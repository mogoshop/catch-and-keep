#!/usr/bin/env node
// tools/dps/aggregate.cjs 자체 시험 (npm test 「DPS 집계 도구」). 입력 로그 fixtures/oracle-*.log는 tests/quality/dps.lua가 실제 Monster·Telemetry 본문으로 만든 것:
//   DPS_LOG_OUT=tools/dps/fixtures/oracle-flush.log DPS_LOG_FULL=tools/dps/fixtures/oracle-full.log python3 tests/quality/run.py --lua <lua5.4> dps
'use strict';
const fs = require("fs");
const path = require("path");
const agg = require("./aggregate.cjs");

let fails = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes += 1;
  else {
    fails += 1;
    console.log("FAIL " + name + " " + (detail === undefined ? "" : JSON.stringify(detail)));
  }
}
const read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

// 1) 실제 본문이 만든 전체 원장: 원장 검사 ok, 합계·미상 비율·TTK
const full = agg.aggregate([read("oracle-full.log")]);
const s = full.runs[0];
check("full log parsed one run", full.runs.length === 1, full.runs.length);
check("ledger complete and consistent", s.ledger_check.status === "ok", s.ledger_check);
check("effective total from server summary", s.effective === 302, s.effective);
check("unknown ratio = (player.unknown + tick.unknown + hit.none) / eff", s.unknown_ratio === Math.round((232 + 5 + 7) / 302 * 100) / 100, s.unknown_ratio);
check("TTK success samples separated from censored", s.ttk.samples === 4 && s.ttk.censored >= 1, s.ttk);
check("combat time uses ledger + fencepost", s.combat.method.startsWith("원장") && s.combat_dps > s.total_dps, s.combat);
check("summon source kept as its own category", s.by_category["소환"] === 10, s.by_category);
check("unsupported stays unsupported (not 0)", s.owners.find((o) => o.owner === "u1").mana_spent === "unsupported", s.owners);

// 2) 원장 일부만 찍힌 요약: incomplete → 서버 active, 울타리 보정 없음
const part = agg.aggregate([read("oracle-flush.log")]).runs[0];
check("partial ledger → incomplete", part.ledger_check.status === "incomplete", part.ledger_check);
check("partial ledger → server active method", part.combat.method.startsWith("서버"), part.combat.method);
check("same effective in both views", part.effective === s.effective, part.effective);

// 3) 합성 로그: 울타리 보정 · 공백 분할 · 중복 순번 검출 · 장면 이름 규약 · 파일 둘의 같은 run 번호
function ev(run, n, t, life, seq, eff) {
  return "[DPS] ev|" + [run, n, t, "hit", life, seq, 1, "u1", "player", "player.unknown", 100 - (seq - 1) * eff, 100 - seq * eff, eff, 0, eff, 0].join("|");
}
function windowLine(run, scene, dur, events, eff) {
  return "[DPS] window run=" + run + " scene=" + scene + " dur=" + dur + " events=" + events + " kept=" + events + " dropped=0 hit_events=" + events + " eff=" + eff +
    " raw=" + eff + " absorb=0 over=0 first=0 last=0 active=0 segs=1 gap=3.00 heal=0 drift=0 scale=0 rebase=0 resets=0 tag_hit=0 tag_miss=0 lives=1 life_overflow=0 owner_overflow=0 halted=no";
}
const synth = [windowLine(1, "L15-magic-boss-r2", 20, 3, 30), ev(1, 1, 0, 1, 1, 10), ev(1, 2, 1, 1, 2, 10), ev(1, 3, 2, 1, 3, 10)].join("\n");
const a = agg.aggregate([synth]).runs[0];
check("fencepost: 3 hits 1s apart = 3s combat (2s + 1 interval)", a.combat.seconds === 3 && a.combat_dps === 10 && a.total_dps === 1.5, a.combat);
check("scene label parsed L15 magic boss r2", a.level === 15 && a.build === "magic" && a.scene === "boss" && a.rep === 2, a);
const split = [windowLine(1, "L5-summon-horde-r1", 30, 4, 40), ev(1, 1, 0, 1, 1, 10), ev(1, 2, 1, 1, 2, 10), ev(1, 3, 10, 1, 3, 10), ev(1, 4, 11, 1, 4, 10)].join("\n");
const b = agg.aggregate([split]).runs[0];
check("gap > 3s splits segments: 2 segs, 2s active + 2 intervals = 4s", b.combat.segs === 2 && b.combat.seconds === 4, b.combat);
const regap = agg.aggregate([split], { gap: 10 }).runs[0];
check("--gap 10 recomputes as one segment", regap.combat.segs === 1 && regap.combat.method.indexOf("재계산") >= 0, regap.combat);
const dup = [windowLine(1, "x", 5, 2, 20), ev(1, 1, 0, 1, 1, 10), ev(1, 2, 0, 1, 1, 10)].join("\n");
check("duplicate (life, seq) detected as fail", agg.aggregate([dup]).runs[0].ledger_check.status === "fail");
const two = agg.aggregate([synth, split]);
check("same run id in two files kept apart", two.runs.length === 2 && two.runs[0].run !== two.runs[1].run, two.runs.map((r) => r.run));

// 4) 계산기 세 열: 소환 빌드 미계산 · 실측은 같은 레벨·빌드 실행의 중앙
const calc = [
  { level: "15", build: "magic", skill: "bone_shard", one_hit_without_curse: "293", one_hit_with_own_mark: "", projectiles_emitted: "3", cooldown_s: "0.69767441860465" },
  { level: "15", build: "summon", skill: "raise_skeleton", one_hit_without_curse: "", projectiles_emitted: "", cooldown_s: "0.46" },
];
const three = agg.aggregate([synth], { calc }).three_columns;
const m15 = three.find((r) => r.level === 15 && r.build === "magic");
check("three columns: calc one-hit/upper + measured median", m15 && m15.one_hit === 293 && m15.upper === 1259.9 && m15.measured_total === 1.5 && m15.runs === 1, m15);
check("summon without one-hit stays 미계산 (no row invented)", !three.find((r) => r.level === 15 && r.build === "summon"), three);
const md = agg.markdown(agg.aggregate([synth], { calc }));
check("markdown has the three-column table", md.indexOf("설명 1타 / 가정 상한 / 실측") >= 0 && md.indexOf("1259.9") >= 0);

if (fails) {
  console.log("[dps selftest] " + fails + " 실패 / " + (fails + passes));
  process.exit(1);
}
console.log("[dps selftest] " + passes + "개 통과 (실제 본문 원장 로그 2종 + 합성 로그)");
