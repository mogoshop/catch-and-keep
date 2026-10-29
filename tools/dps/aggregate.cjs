#!/usr/bin/env node
// I05 개발용 전투 계측 집계 (오프라인). 메이커 로그 텍스트의 「[DPS]」 줄(Telemetry.DpsFlush)을 읽어 실행(장면)마다 표를 만든다.
//   총구간 DPS = 유효 피해 / 실행 전체 시간 (준비·이동·복구 포함, DpsStart → DpsFlush 또는 상한 정지 시각)
//   전투 구간 DPS = 유효 피해 / 전투 시간. 전투 시간 = 유효 피해 사이 간격 중 공백 임계값(기본 3초 = 서버 DpsGapSec) 이하만 합친 것.
//     원장(ev) 줄이 빠짐없이 있으면 구간마다 「구간 안 중앙 타격 간격」 하나를 더해 울타리 오차(타격 N번 = 간격 N-1개)를 보정한다.
//     원장이 잘렸으면 서버 active 그대로 쓰고 「울타리 보정 없음」으로 표시한다.
//   TTK = 시도 안 첫 유효 타격 → 사망 (빈 맵 리셋은 새 시도). 죽지 않은 대상은 censored로 따로 센다 (성공 표본에 넣지 않는다).
//   출처: summon.<종류> · skill.<id>(공격 쪽 꼬리표가 정확히 맞은 것만) · player.unknown · tick.unknown · hit.none · monster. 미상 비율을 함께 낸다.
//   「설명 1타 / 가정 상한 / 실측」: --calc에 오프라인 계산기 comparison.json(또는 csv)을 주면 같은 레벨·빌드의 앞 두 열을 채운다. 계산값을 실측이라 쓰지 않는다.
// 사용: node tools/dps/aggregate.cjs <로그 파일...> [--calc comparison.json] [--gap 3] [--out-json 파일] [--out-md 파일]
// 장면 이름 규약 (docs/evidence/2026-10-30-goal-C/test-plan.md): L<레벨>-<summon|magic|curse_mix>-<장면>-r<반복>  예) L15-magic-boss-r1
'use strict';
const fs = require("fs");
const path = require("path");

const SKILL_FAMILY = {
  bone_shard: "magic", bone_spear: "magic", corpse_blast: "magic", soul_drain: "magic",
  frost_soul: "magic", frost_split: "magic", frost_shatter: "magic",
  hex_flame: "curse", hex_burst: "curse", mark_weakness: "curse", enfeeble: "curse",
  skeleton_bomb: "summon_skill", bone_rite: "summon_skill", bone_rite_push: "summon_skill",
};

function categoryOf(src) {
  if (src.startsWith("summon.")) return "소환";
  if (src.startsWith("skill.")) {
    const fam = SKILL_FAMILY[src.slice(6)];
    if (fam === "magic") return "마법(확인)";
    if (fam === "curse") return "저주(확인)";
    if (fam === "summon_skill") return "소환 스킬(확인)";
    return "스킬(확인·미분류)";
  }
  if (src === "player.basic") return "기본 공격(확인)";
  if (src === "player.unknown") return "미상(플레이어 직접)";
  if (src === "tick.unknown") return "미상(틱: 독·가시·반사·혼란)";
  if (src === "monster") return "몬스터끼리";
  if (src === "overflow") return "출처 상한 초과";
  return "무주체";
}
const UNKNOWN = new Set(["player.unknown", "tick.unknown", "hit.none"]);

function kv(text) {
  const out = {};
  for (const m of text.matchAll(/(\w+)=(\S+)/g)) out[m[1]] = m[2];
  return out;
}
const num = (v) => (v === undefined || v === "-1" || v === "censored" || v === "unsupported" || v === "-" ? null : Number(v));
const r2 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);

function median(list) {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const k = Math.floor(s.length / 2);
  return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
}
function pct(list, p) {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))];
}

function parse(text) {
  const runs = new Map();
  const get = (id) => {
    if (!runs.has(id)) runs.set(id, { run: id, window: null, owners: [], src: [], lives: [], sample: null, ev: [], end: null });
    return runs.get(id);
  };
  for (const raw of text.split(/\r?\n/)) {
    const at = raw.indexOf("[DPS] ");
    if (at < 0) continue;
    const line = raw.slice(at + 6).trim();
    if (line.startsWith("ev|")) {
      const f = line.split("|");
      if (f.length < 17) continue;
      const r = get(Number(f[1]));
      r.ev.push({ n: +f[2], t: +f[3], kind: f[4], life: +f[5], seq: +f[6], att: +f[7], owner: f[8], ak: f[9], src: f[10], b: +f[11], a: +f[12], raw: +f[13], ab: +f[14], eff: +f[15], ov: +f[16] });
      continue;
    }
    const word = line.split(" ")[0];
    const o = kv(line);
    if (!o.run) continue;
    const r = get(Number(o.run));
    if (word === "window") r.window = o;
    else if (word === "owner") r.owners.push(o);
    else if (word === "src") r.src.push(o);
    else if (word === "life") r.lives.push(o);
    else if (word === "sample") r.sample = o;
    else if (word === "end") r.end = o;
  }
  return [...runs.values()].filter((r) => r.window);
}

function sceneMeta(scene) {
  const m = /^L(\d+)-(summon|magic|curse_mix)-([a-z0-9_]+)(?:-r(\d+))?/.exec(scene || "");
  if (!m) return { level: null, build: null, scene: scene || "?", rep: null };
  return { level: Number(m[1]), build: m[2], scene: m[3], rep: m[4] ? Number(m[4]) : null };
}

// 원장 줄로 전투 구간을 다시 계산 (빠짐없을 때만)
function combatFromLedger(ev, gap) {
  const times = ev.filter((e) => (e.kind === "hit" || e.kind === "tick") && e.eff > 0).map((e) => e.t).sort((a, b) => a - b);
  if (!times.length) return { active: 0, segs: 0, interval: null, corrected: 0 };
  const inside = [];
  let active = 0;
  let segs = 1;
  for (let i = 1; i < times.length; i++) {
    const d = times[i] - times[i - 1];
    if (d <= gap) {
      active += d;
      if (d > 0) inside.push(d);
    } else segs += 1;
  }
  const interval = median(inside);
  return { active, segs, interval, corrected: active + segs * (interval || 0) };
}

// 원장 검사: 빠짐없나 · (생명, 순번) 중복 없음 · 생명마다 순번 1부터 연속 · effective 식 · 원장 합 = 요약 합
function ledgerCheck(r) {
  const w = r.window;
  const events = Number(w.events);
  const complete = Number(w.dropped) === 0 && r.ev.length === events;
  if (!complete) return { status: "incomplete", detail: "원장 " + r.ev.length + "/" + events + "줄 · dropped " + w.dropped };
  const seen = new Set();
  const lastSeq = new Map();
  let eff = 0;
  const problems = [];
  for (const e of r.ev) {
    const key = e.life + "/" + e.seq;
    if (seen.has(key)) problems.push("중복 " + key);
    seen.add(key);
    const prev = lastSeq.get(e.life) || 0;
    if (e.seq !== prev + 1) problems.push("순번 건너뜀 life " + e.life + ": " + prev + "→" + e.seq);
    lastSeq.set(e.life, e.seq);
    if (e.kind === "hit" || e.kind === "tick") {
      const expect = Math.min(Math.max(0, e.b), Math.max(0, e.b - e.a));
      if (Math.abs(expect - e.eff) > 0.011) problems.push("effective 식 불일치 n=" + e.n);
      eff += e.eff;
    }
  }
  // 로그 숫자는 소수 둘째 자리 반올림 → 줄마다 최대 0.005 오차
  if (Math.abs(eff - Number(w.eff)) > 0.005 * r.ev.length + 0.01) problems.push("원장 합 " + r2(eff) + " ≠ 요약 " + w.eff);
  return { status: problems.length ? "fail" : "ok", detail: problems.slice(0, 5).join("; ") || "원장 " + events + "줄 · 합 " + r2(eff) };
}

function summarize(r, gapArg) {
  const w = r.window;
  const meta = sceneMeta(w.scene);
  const dur = Number(w.dur);
  const eff = Number(w.eff);
  const serverGap = Number(w.gap) || 3;
  const gap = gapArg || serverGap;
  const check = ledgerCheck(r);
  let combat;
  if (check.status !== "incomplete") {
    const c = combatFromLedger(r.ev, gap);
    combat = { seconds: c.corrected, raw_active: c.active, segs: c.segs, interval: c.interval, method: gap === serverGap ? "원장+울타리 보정" : "원장+울타리 보정(공백 " + gap + "초 재계산)" };
  } else {
    combat = { seconds: Number(w.active), raw_active: Number(w.active), segs: Number(w.segs), interval: null, method: "서버 active(울타리 보정 없음 · 공백 " + serverGap + "초)" };
  }
  const bySrc = {};
  const byCat = {};
  let unknownEff = 0;
  for (const s of r.src) {
    const e = Number(s.eff);
    bySrc[s.src] = (bySrc[s.src] || 0) + e;
    const cat = categoryOf(s.src);
    byCat[cat] = (byCat[cat] || 0) + e;
    if (UNKNOWN.has(s.src)) unknownEff += e;
  }
  const ttkAll = [];
  const byGrade = {};
  let censored = 0;
  for (const l of r.lives) {
    const v = num(l.ttk);
    if (v === null) {
      if (Number(l.events) > 0) censored += 1;
      continue;
    }
    ttkAll.push(v);
    (byGrade[l.grade] = byGrade[l.grade] || []).push(v);
  }
  const gradeOut = {};
  for (const g of Object.keys(byGrade)) gradeOut[g] = { n: byGrade[g].length, median: r2(median(byGrade[g])) };
  const owners = r.owners.map((o) => ({
    owner: o.owner, eff: Number(o.eff), active_s: Number(o.active), deaths: Number(o.deaths), hp_drop_sampled: Number(o.hp_drop_sampled),
    hits_taken: o.hits_taken, mana_spent: o.mana_spent === "unsupported" ? "unsupported" : Number(o.mana_spent), casts: o.casts,
    mana_drop_sampled: Number(o.mana_drop_sampled), mana_rise_sampled: Number(o.mana_rise_sampled),
    soul_raise: Number(o.soul_raise), soul_extract: Number(o.soul_extract), soul_other: o.soul_other,
    legion_max: Number(o.legion_max), legion_loss: Number(o.legion_loss), legion_loss_reason: o.legion_loss_reason, wipes: Number(o.wipes),
    recover_s: o.recover && o.recover !== "-" ? o.recover.split(",").map(Number) : [], wipe_open: o.wipe_open,
  }));
  return Object.assign({ run: r.key || String(r.run), scene_label: w.scene }, meta, {
    duration_s: dur, effective: eff, raw: Number(w.raw), absorbed: Number(w.absorb), overkill: Number(w.over),
    total_dps: dur > 0 ? r2(eff / dur) : null,
    combat_dps: combat.seconds > 0 ? r2(eff / combat.seconds) : null, combat,
    gap_s: gap, heal: Number(w.heal), drift: Number(w.drift), scale: Number(w.scale), resets: Number(w.resets),
    unknown_ratio: eff > 0 ? r2(unknownEff / eff) : null, by_source: bySrc, by_category: byCat,
    ttk: { samples: ttkAll.length, censored, median: r2(median(ttkAll)), p90: r2(pct(ttkAll, 0.9)), by_grade: gradeOut },
    owners, sampler: r.sample ? { n: Number(r.sample.n), late: Number(r.sample.late), max_gap: Number(r.sample.max_gap) } : null,
    halted: w.halted, ledger_check: check, dropped: Number(w.dropped), life_overflow: Number(w.life_overflow), owner_overflow: Number(w.owner_overflow),
    ev_omitted: r.end ? Number(r.end.ev_omitted || 0) : null, flush_truncated: r.end ? Number(r.end.truncated || 0) : null,
  });
}

// 오프라인 계산기(parallel-analysis/combat/results/comparison.csv|json) → 설명 1타 · 가정 상한 (같은 레벨·빌드에서 상한이 가장 큰 공격 스킬 하나)
function calcRows(calc) {
  if (!calc) return [];
  if (Array.isArray(calc)) return calc;
  for (const k of ["rows", "results", "comparison", "table"]) if (Array.isArray(calc[k])) return calc[k];
  return [];
}
function calcColumns(calc) {
  const out = {};
  for (const row of calcRows(calc)) {
    const oneHit = row.one_hit_without_curse === "" || row.one_hit_without_curse == null ? null : Number(row.one_hit_without_curse);
    if (oneHit === null || !Number.isFinite(oneHit)) continue;
    const proj = Number(row.projectiles_emitted) || 1;
    const cd = Number(row.cooldown_s);
    const key = Number(row.level) + "/" + row.build;
    const upper = cd > 0 ? oneHit * proj / cd : null;
    const marked = row.one_hit_with_own_mark == null || row.one_hit_with_own_mark === "" ? null : Number(row.one_hit_with_own_mark);
    const prev = out[key];
    if (!prev || (upper || 0) > (prev.upper || 0)) out[key] = { skill: row.skill, one_hit: oneHit, one_hit_marked: marked, projectiles: proj, cooldown_s: cd, upper: r2(upper) };
  }
  return out;
}
function loadCalc(file) {
  if (!file) return null;
  const text = fs.readFileSync(file, "utf8");
  if (!file.endsWith(".csv")) return JSON.parse(text);
  const lines = text.trim().split(/\r?\n/);
  const cols = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const row = {};
    l.split(",").forEach((v, i) => (row[cols[i]] = v));
    return row;
  });
}

function cell(v, empty) {
  return v === null || v === undefined || v === "" ? empty : String(v);
}

function markdown(report) {
  const L = [];
  L.push("# I05 실전 계측 집계", "");
  L.push("- 입력: " + report.inputs.join(", "));
  L.push("- 실측 = 서버 HP 원장(Monster.ApplyHpDamage → Telemetry.DpsHit). 설명 1타·가정 상한은 오프라인 계산이며 실측이 아니다. 셋을 더하거나 서로 대신하지 않는다.");
  L.push("- 공백 임계값: " + (report.gap_s === null ? "서버 DpsGapSec(기본 3초)" : report.gap_s + "초(재계산)") + ". 전투 구간 = 유효 피해 사이 간격이 임계값 이하인 부분.", "");
  L.push("| 실행 | 레벨 | 빌드 | 장면 | 반복 | 총구간(초) | 유효 피해 | 총구간 DPS | 전투 구간 DPS | 전투 시간 방식 | 미상 비율 | TTK 중앙 (표본/미처치) | 플레이어 사망 | 원장 검사 |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const s of report.runs) {
    const deaths = s.owners.reduce((a, o) => a + (o.deaths || 0), 0);
    L.push("| " + [s.run, cell(s.level, "-"), cell(s.build, "-"), s.scene, cell(s.rep, "-"), s.duration_s, s.effective, cell(s.total_dps, "-"), cell(s.combat_dps, "-"), s.combat.method,
      cell(s.unknown_ratio, "-"), cell(s.ttk.median, "-") + " (" + s.ttk.samples + "/" + s.ttk.censored + ")", deaths, s.ledger_check.status].join(" | ") + " |");
  }
  L.push("", "## 설명 1타 / 가정 상한 / 실측", "");
  L.push("| 레벨 | 빌드 | 대표 스킬 | 설명 1타 | 자기 표식 1타 | 가정 상한 (1타×발수÷재사용) | 실측 총구간 DPS (중앙) | 실측 전투 구간 DPS (중앙) | 실행 수 |");
  L.push("|---|---|---|---|---|---|---|---|---|");
  for (const row of report.three_columns) {
    L.push("| " + [row.level, row.build, cell(row.skill, "-"), cell(row.one_hit, "미계산"), cell(row.one_hit_marked, "-"), cell(row.upper, "미계산"),
      cell(row.measured_total, "미측정"), cell(row.measured_combat, "미측정"), row.runs].join(" | ") + " |");
  }
  L.push("", "소환 빌드의 1타·상한은 계산기가 소환수 실제 적중 수·가동률을 모르므로 미계산이다 (comparison.csv의 power 0).");
  L.push("", "## 출처 기여 (유효 피해)", "");
  for (const s of report.runs) {
    const parts = Object.entries(s.by_category).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + r2(v) + " (" + (s.effective > 0 ? Math.round(v / s.effective * 100) : 0) + "%)");
    L.push("- 실행 " + s.run + " " + s.scene_label + ": " + (parts.join(" · ") || "피해 없음"));
  }
  L.push("", "## 피격·사망·자원·복구 (owner별)", "");
  L.push("| 실행 | owner | 사망 | 생명 하락(표본) | 피격 수 | 마나 소비(성공 시전) | 마나 하락/상승(표본) | 혼 소환/추출/기타 | 군단 최대 | 손실(이유) | 전멸 | 복구(초) |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const s of report.runs) {
    for (const o of s.owners) {
      if (o.owner === "none") continue;
      const rec = o.recover_s.length ? o.recover_s.join(",") : (o.wipe_open !== "no" ? "미복구" : "-");
      L.push("| " + [s.run, o.owner, o.deaths, o.hp_drop_sampled, o.hits_taken, o.mana_spent, o.mana_drop_sampled + "/" + o.mana_rise_sampled,
        o.soul_raise + "/" + o.soul_extract + "/" + o.soul_other, o.legion_max, o.legion_loss + "(" + o.legion_loss_reason + ")", o.wipes, rec].join(" | ") + " |");
    }
  }
  L.push("", "unsupported = 그 값을 정확히 세는 hook이 아직 없다 (0이 아니다 · patch_requests 참고). 표본 값은 0.25초 표본 사이의 상쇄를 못 본다.");
  return L.join("\n") + "\n";
}

function aggregate(texts, opts) {
  opts = opts || {};
  const runs = [];
  texts.forEach((t, i) => {
    for (const r of parse(t)) {
      r.key = texts.length > 1 ? (i + 1) + ":" + r.run : String(r.run);
      runs.push(r);
    }
  });
  const gap = opts.gap ? Number(opts.gap) : null;
  const summaries = runs.map((r) => summarize(r, gap));
  const calc = calcColumns(opts.calc || null);
  const keys = new Set(Object.keys(calc));
  for (const s of summaries) if (s.level && s.build) keys.add(s.level + "/" + s.build);
  const three = [...keys].sort((a, b) => {
    const [la, ba] = a.split("/");
    const [lb, bb] = b.split("/");
    return Number(la) - Number(lb) || ba.localeCompare(bb);
  }).map((key) => {
    const [level, build] = key.split("/");
    const mine = summaries.filter((s) => s.level + "/" + s.build === key);
    const c = calc[key] || {};
    return {
      level: Number(level), build, skill: c.skill || null, one_hit: c.one_hit ?? null, one_hit_marked: c.one_hit_marked ?? null, upper: c.upper ?? null,
      measured_total: r2(median(mine.map((s) => s.total_dps).filter((v) => v !== null))),
      measured_combat: r2(median(mine.map((s) => s.combat_dps).filter((v) => v !== null))), runs: mine.length,
    };
  });
  return { generated_by: "tools/dps/aggregate.cjs", inputs: opts.inputs || [], gap_s: gap, runs: summaries, three_columns: three,
    note: "설명 1타·가정 상한 = 오프라인 계산(comparison), 실측 = 서버 HP 원장. 실제 빌드 비교 결론은 이 표만으로 내리지 않는다 (반복 수·실패·seed를 test-plan대로 남긴다)." };
}

function main(argv) {
  const files = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--calc") opts.calcFile = argv[++i];
    else if (a === "--gap") opts.gap = argv[++i];
    else if (a === "--out-json") opts.outJson = argv[++i];
    else if (a === "--out-md") opts.outMd = argv[++i];
    else files.push(a);
  }
  if (!files.length) {
    console.error("사용: node tools/dps/aggregate.cjs <로그...> [--calc comparison.csv|json] [--gap 3] [--out-json f] [--out-md f]");
    process.exit(2);
  }
  opts.calc = loadCalc(opts.calcFile);
  opts.inputs = files.map((f) => path.basename(f));
  const report = aggregate(files.map((f) => fs.readFileSync(f, "utf8")), opts);
  const md = markdown(report);
  if (opts.outJson) fs.writeFileSync(opts.outJson, JSON.stringify(report, null, 2) + "\n");
  if (opts.outMd) fs.writeFileSync(opts.outMd, md);
  if (!opts.outJson && !opts.outMd) process.stdout.write(md);
  else console.log("[dps] 실행 " + report.runs.length + "개 집계 · 원장 검사 " + (report.runs.map((r) => r.ledger_check.status).join(",") || "-"));
  return report;
}

module.exports = { parse, summarize, aggregate, markdown, calcColumns, loadCalc, combatFromLedger, ledgerCheck, categoryOf, sceneMeta };
if (require.main === module) main(process.argv.slice(2));
