#!/usr/bin/env node
// 거인 5종(기본·방패·대검·쌍칼·마법사) 시각 교체 등록 (10-30 갈래 E · 코덱스 0120 기존3종 + 0149 기본·마법사 + 0154 최종수용: 몸 150장 + HUD 5).
//   코덱스 팩 assets/codex-bone-giants-v1/packages/(shield|greatsword|twin|basic|mage|J7-HUD5) → 등록 대기표 data/pending/giant-visuals-registration.csv
//   → (메이커 담당) 업로드 팩 docs/evidence/2026-10-30-goal-E/upload-pack을 tools/msw_mcp_call.cjs upload-res로 올림 (피벗·Point·Clamp 업로드 때 함께)
//   → (부모) apply: 받은 RUID를 대기표에 채우고 data/monster_frames.csv form_giant_(종류) 6동작 · data/ui_icons.csv ui_giant_(종류) 줄을 쓴다 → node tools/gen_data.cjs
// 등록 전에는 아무 표에도 줄이 없어서 게임은 지금 그림(변이 그림 × riteGiantScale)을 그대로 쓴다 (UndeadSystem.GiantLook = nil).
// 사용:
//   node tools/register_giant_visuals.cjs plan --assets 「assets/codex-bone-giants-v1 경로」   (대기표 · 등록 계획 · 업로드 팩 다시 만들기)
//   node tools/register_giant_visuals.cjs check                                            (대기표 형식·150+5키·타이밍 검사 — RUID 칸은 비어도 됨)
//   node tools/register_giant_visuals.cjs apply 「업로드 팩 폴더」 [--dry] [--allow-partial]   (RUID가 모두 차야 쓴다 · --allow-partial이면 다 찬 종류만)
//   node tools/register_giant_visuals.cjs preview-rows                                     (오프라인 회귀용 가짜 RUID 줄 — 파일을 쓰지 않는다)
//   node tools/register_giant_visuals.cjs check [--manifest 「아트 결과 json」] [--strict]     (경고까지 실패로 보려면 --strict · 매니페스트 sha 교차 검증)
//   node tools/register_giant_visuals.cjs check-frames                                     (data/monster_frames.csv form_giant_* 줄을 같은 검증표로 — check_data도 이 함수를 쓴다)
//   node tools/register_giant_visuals.cjs fx-audit                                         (지금 GameConst·SkillEffects 효과 연속본 장 수 ↔ 새 목표 · 정보만)
//   node tools/register_giant_visuals.cjs selftest                                         (검증표 자체 테스트: 구 납품 통과 · 새 범위 통과 · 위반 변이 검출)
// 48 V2 (10-30 연출 V2 · 갈래 C): 장 수 검증표는 「코덱스 납품 계약」이지 엔진 상한이 아니다 (MotionSmoother.FrameClip·SkillEffects.PlaySeq는 장 수 제한 없음 —
//   summon48-spectacle-code-audit). 구 납품(기본 150 · skill2 6 · 회전 4~6 · 쌍칼 4~6)은 그대로 통과하고, 새 정의(회전 몸 12~16 · 땅 가르기 12~16 · 내려찍기 12 ·
//   함성 8~12 · 효과 노바 16 · 균열 16 · 내려찍기 12~16 · 함성 12 · 회전 16)를 함께 받는다. 숫자만 늘린 중복 장 · 장마다 0 이하 시간 · 타격 칸 없는 기술은 막는다.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const PENDING = path.join(ROOT, "data/pending/giant-visuals-registration.csv");
const EVID = path.join(ROOT, "docs/evidence/2026-10-30-goal-E");
const PACK = path.join(EVID, "upload-pack");
const FORMS = ["shield", "greatsword", "twin", "basic", "mage"];
// 거인 동작 순서와 장 수 (코덱스 납품 DELIVERY: stand4/move6/attack6/skill6/hit2/split6 · V4 canon 150 그대로) — UndeadSystem.GiantStateOrder와 같은 순서
const STATES = [["stand", 4], ["move", 6], ["attack", 6], ["skill", 6], ["hit", 2], ["split", 6]];
// 기술 몸 동작 검증표 (48 §7-2 · K-4 + 48 V2 10-30 새 정의 · 있을 때만 · UndeadSystem.GiantExtraStates):
//   ranges = 허용 장 수 묶음 [최소, 최대, 구분] — "old" = 구 납품(하위 호환) · "v2" = 연출 V2 새 목표. v2 묶음은 타격 칸·중복 장 규칙을 엄격히 본다.
//   loop = false(한 번 재생 · 서버가 GiantHoldUntil로 붙잡음) · "any"(반복 이음 허용: 회전·기도) · hits = 타격 칸 수 [최소, 최대] (v2 기준 · old는 0~1)
//   sec = 한 바퀴 지속 합(초) 허용 범위 · cycle = 반복 동작 한 바퀴가 맞춰야 할 타격 주기(rite_giants.csv 옵션 이름 · 어긋나면 경고)
//   없으면 게임은 지금 skill 그림을 기술 길이만큼 반복한다 (ShadowUnit.GiantMotionKey) · 방패 skill1 = 함성(V2 새 몸) · 마법사 skill1 = 기도 앞 3장 재사용
const BODY_RULES = {
  shield: {
    skill1: { name: "도발 함성", ranges: [[8, 12, "v2"]], loop: false, hits: [0, 1], sec: [0.4, 1.5] },
    skill2: { name: "방패 내려찍기", ranges: [[6, 6, "old"], [12, 12, "v2"]], loop: false, hits: [1, 1], sec: [0.3, 1.5] },
  },
  greatsword: {
    skill1: { name: "회전 베기", ranges: [[4, 6, "old"], [12, 16, "v2"]], loop: "any", hits: [1, 1], sec: [0.3, 0.8], cycle: ["greatsword", "s1Opts", "gap"] },
    skill2: { name: "땅 가르기", ranges: [[6, 6, "old"], [12, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.3, 1.6] },
  },
  twin: {
    skill2: { name: "돌진", ranges: [[4, 6, "old"]], loop: false, hits: [1, 1], sec: [0.2, 1.0] },
  },
  mage: {
    skill1: { name: "화염 노바(기도 앞 장 재사용)", ranges: [[3, 3, "old"]], loop: false, hits: [0, 1], sec: [0.3, 1.2] },
    skill2: { name: "기도 메테오", ranges: [[6, 6, "old"]], loop: "any", hits: [0, 1], sec: [0.3, 1.5] },
  },
  basic: {},
};
// 효과(FX) 연속본 검증표 (48 V2 새 정의 · 대기표 kind=fx · key giant-fx-(효과)-NN · form = 그 거인 · state = 효과 이름) — 게임 연결은 GameConst/SkillEffects 문자열(부모·갈래 B)
//   nova는 한 번만 터지는 단발 폭발이라 타격 칸이 정확히 하나 (둘째 파동 금지) · 칸마다 0.04초 미만이면 SkillEffects spec.sec를 명시해야 한다(기본 max(0.04, 초/장) 바닥)
const FX_RULES = {
  nova: { form: "mage", name: "화염 노바 단발 폭발", ranges: [[16, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.4, 1.4], now: ["SkillEffects", "FxGiantNova"] },
  spin: { form: "greatsword", name: "회전 베기 수평 고리", ranges: [[16, 16, "v2"]], loop: "any", hits: [0, 1], sec: [0.3, 0.8], cycle: ["greatsword", "s1Opts", "gap"], now: ["GameConst", "FxGiantSpin"] },
  rift: { form: "greatsword", name: "땅 가르기 균열", ranges: [[16, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.4, 1.6], now: ["GameConst", "FxGiantRift"] },
  slam: { form: "shield", name: "방패 내려찍기 충격", ranges: [[12, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.3, 1.5], now: ["GameConst", "FxGiantSlam"] },
  roar: { form: "shield", name: "도발 함성 문양·방사", ranges: [[12, 12, "v2"]], loop: false, hits: [0, 1], sec: [0.4, 1.6], now: ["SkillEffects", "FxGiantRoar"] },
};
const FRAME_MIN_SEC = 1 / 60;   // 몸: 60Hz 화면 한 번보다 짧은 칸은 건너뛸 수 있다 (경고) · 효과: 0.04 미만이면 spec.sec 명시 필요 (경고)
// 하위 호환 내보내기 (예전 EXTRA_STATES 모양: 상태 → 종 → [최소, 최대])
const EXTRA_STATES = {};
for (const form of FORMS) for (const [state, rule] of Object.entries(BODY_RULES[form])) {
  (EXTRA_STATES[state] = EXTRA_STATES[state] || Object.fromEntries(FORMS.map((f) => [f, [0, 0]])))[form] =
    [Math.min(...rule.ranges.map((r) => r[0])), Math.max(...rule.ranges.map((r) => r[1]))];
}
for (const st of ["skill1", "skill2"]) if (!EXTRA_STATES[st]) EXTRA_STATES[st] = Object.fromEntries(FORMS.map((f) => [f, [0, 0]]));
const BLEND_RE = /blend|tween|interp|crossfade|mix|ghost-?frame/i;   // 스틸 블렌드 의심 이름 (매니페스트 표시 · 파일 이름)
const HEAD = ["key", "kind", "form", "state", "frame", "frame_index0", "file", "sha256", "width", "height", "pivot_x", "pivot_y", "filter", "wrap", "duration_ms", "loop", "hit", "animation_key", "ruid"];
const HEX = "0123456789abcdef";
const isHex = (v, n) => typeof v === "string" && v.length === n && [...v].every((ch) => HEX.includes(ch));
const isRuid = (v) => isHex(v, 32);
const isSha = (v) => isHex(v, 64);

const DQ = String.fromCharCode(34), CR = String.fromCharCode(13), LF = String.fromCharCode(10), BOM = String.fromCharCode(0xFEFF);
function parse(text) {
  if (text.startsWith(BOM)) text = text.slice(1);
  const rows = [];
  let row = [], cell = "", inq = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inq) { if (ch === DQ && text[i + 1] === DQ) { cell += DQ; i++; } else if (ch === DQ) inq = false; else cell += ch; }
    else if (ch === DQ) inq = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === LF || ch === CR) { if (ch === CR && text[i + 1] === LF) i++; row.push(cell); cell = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
const quote = (v) => {
  const s = String(v);
  return (s.includes(DQ) || s.includes(",") || s.includes(LF)) ? DQ + s.split(DQ).join(DQ + DQ) + DQ : s;
};
const toCsv = (head, rows) => [head.join(","), ...rows.map((r) => head.map((h) => quote(r[h] ?? "")).join(","))].join(LF) + LF;
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function plan(assets) {
  if (!assets || !fs.existsSync(path.join(assets, "packages"))) throw new Error("--assets (assets/codex-bone-giants-v1) 폴더가 필요하다 (메인 작업 폴더에만 있다 · 읽기만)");
  const rows = [];
  for (const form of FORMS) {
    const dir = path.join(assets, "packages", form);
    const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
    const timing = JSON.parse(fs.readFileSync(path.join(dir, "animation-timing.json"), "utf8"));
    const props = Object.fromEntries(parse(fs.readFileSync(path.join(dir, "resource-properties.csv"), "utf8")).map((r) => [r.key, r]));
    const tByFile = Object.fromEntries(timing.map((t) => [t.file, t]));
    for (const m of man) {
      // 48 V2: 같은 팩 manifest에 효과(kind "fx" · state = 효과 이름 · key giant-fx-(효과)-NN) 줄이 있으면 효과로 받는다 (검증은 FX_RULES)
      const t = tByFile[m.file], p = props[m.key];
      if (!t || !p) throw new Error(m.key + ": 타이밍·속성 줄 없음");
      const sha = sha256(path.join(assets, m.file));
      if (sha !== m.sha256) throw new Error(m.key + ": sha256 불일치");
      rows.push({ key: m.key, kind: m.kind === "fx" ? "fx" : "frame", form, state: m.state, frame: m.frame, frame_index0: t.index, file: m.file, sha256: sha, width: m.size[0], height: m.size[1],
        pivot_x: m.pivot[0], pivot_y: m.pivot[1], filter: p.filter, wrap: p.wrap, duration_ms: t.duration_ms, loop: t.loop ? "true" : "false", hit: t.hit ? "true" : "false",
        animation_key: "form_giant_" + form, ruid: "" });
    }
  }
  {
    const dir = path.join(assets, "packages", "J7-HUD5");
    const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
    const props = Object.fromEntries(parse(fs.readFileSync(path.join(dir, "resource-properties.csv"), "utf8")).map((r) => [r.key, r]));
    for (const m of man) {
      const p = props[m.key];
      const sha = sha256(path.join(assets, m.file));
      if (sha !== m.sha256) throw new Error(m.key + ": sha256 불일치");
      rows.push({ key: m.key, kind: "ui_icon", form: m.key.replace("ui_giant_", ""), state: "", frame: "", frame_index0: "", file: m.file, sha256: sha, width: m.size[0], height: m.size[1],
        pivot_x: m.pivot[0], pivot_y: m.pivot[1], filter: p ? p.filter : "Point", wrap: p ? p.wrap : "Clamp", duration_ms: "", loop: "", hit: "", animation_key: "", ruid: "" });
    }
  }
  // 기존 대기표에 이미 받은 RUID가 있으면 지키고, 그림(sha256)이 바뀐 줄은 RUID를 비운다 (피벗은 처음 불리기 전에만 — 그림이 바뀌면 새 RUID)
  const old = fs.existsSync(PENDING) ? Object.fromEntries(parse(fs.readFileSync(PENDING, "utf8")).map((r) => [r.key, r])) : {};
  for (const r of rows) if (old[r.key] && old[r.key].sha256 === r.sha256 && isRuid(old[r.key].ruid)) r.ruid = old[r.key].ruid;
  fs.mkdirSync(path.dirname(PENDING), { recursive: true });
  fs.writeFileSync(PENDING, toCsv(HEAD, rows));
  // 업로드 팩 (tools/msw_mcp_call.cjs upload-res 형식): 파일 경로는 팩 폴더 기준 → 메인 폴더 assets (읽기만 · 커밋 안 함)
  fs.mkdirSync(PACK, { recursive: true });
  const rel = path.relative(PACK, path.join(ROOT, "assets/codex-bone-giants-v1")).split(path.sep).join("/");
  fs.writeFileSync(path.join(PACK, "resource-mapping.csv"), toCsv(["key", "upload_name", "file", "RUID", "category", "group", "status"],
    rows.map((r) => ({ key: r.key, upload_name: r.key, file: rel + "/" + r.file, RUID: r.ruid, category: r.kind === "frame" ? "monster-frame" : r.kind === "fx" ? "fx" : "ui", group: "OJYYQ", status: r.ruid ? "uploaded" : "ready" }))));
  fs.writeFileSync(path.join(PACK, "resource-properties.csv"), toCsv(["name", "pivot_x", "pivot_y", "filter_mode", "wrap_mode", "width", "height"],
    rows.map((r) => ({ name: r.key, pivot_x: r.pivot_x, pivot_y: r.pivot_y, filter_mode: r.filter, wrap_mode: r.wrap, width: r.width, height: r.height }))));
  const planJson = { source: "assets/codex-bone-giants-v1/packages (shield · greatsword · twin · basic · mage · J7-HUD5) · 코덱스 goal-basic-mage-art-decision-0149 + goal-J7-extra2-review-0128",
    rule: "피벗·Point·Clamp는 업로드 직후 처음 불리기 전에 넣는다 (나중에 바꾸면 새 RUID) · 등록 전 게임은 지금 그림",
    upload: "메인 폴더에서 node tools/msw_mcp_call.cjs upload-res docs/evidence/2026-10-30-goal-E/upload-pack --dry 뒤 실제 (그룹 OJYYQ · 피벗 속성은 같은 호출에서 asset_update_resource_storage_info)",
    register: "node tools/register_giant_visuals.cjs apply docs/evidence/2026-10-30-goal-E/upload-pack 뒤 node tools/gen_data.cjs · npm test",
    count: { frames: rows.filter((r) => r.kind === "frame").length, ui_icons: rows.filter((r) => r.kind === "ui_icon").length },
    entries: rows.map((r) => ({ key: r.key, kind: r.kind, file: "assets/codex-bone-giants-v1/" + r.file, sha256: r.sha256, size: [Number(r.width), Number(r.height)],
      pivot: [Number(r.pivot_x), Number(r.pivot_y)], filter: r.filter, wrap: r.wrap, state: r.state || null, frame: r.frame === "" ? null : Number(r.frame),
      frame_index0: r.frame_index0 === "" ? null : Number(r.frame_index0), duration_ms: r.duration_ms === "" ? null : Number(r.duration_ms),
      loop: r.loop === "" ? null : r.loop === "true", hit: r.hit === "" ? null : r.hit === "true",
      registers_to: r.kind === "frame" ? "data/monster_frames.csv form_giant_" + r.form + " " + r.state + " #" + (Number(r.frame_index0) + 1) : "data/ui_icons.csv " + r.key })) };
  fs.writeFileSync(path.join(EVID, "registration-plan.json"), JSON.stringify(planJson, null, 1) + LF);
  console.log("대기표 " + rows.length + "줄 (몸 " + planJson.count.frames + " · HUD " + planJson.count.ui_icons + ") · 업로드 팩 · 등록 계획을 썼다");
}

const load = () => parse(fs.readFileSync(PENDING, "utf8"));

// rite_giants.csv 옵션 (반복 동작 한 바퀴 ↔ 타격 주기 교차 검사용 · 없으면 건너뜀)
function giantOpt(form, col, name) {
  try {
    const row = parse(fs.readFileSync(path.join(ROOT, "data/rite_giants.csv"), "utf8")).find((r) => r.kind === form);
    const part = ((row && row[col]) || "").split(";").find((x) => x.startsWith(name + "="));
    return part ? Number(part.split("=")[1]) : null;
  } catch (e) { return null; }
}
const rangeText = (rule) => rule.ranges.map(([lo, hi, tier]) => (lo === hi ? lo : lo + "~" + hi) + "(" + (tier === "old" ? "구 납품" : "V2") + ")").join(" · ");
const r3 = (x) => Math.round(x * 1000) / 1000;

// 한 연속본 검사 (대기표 몸·효과 · monster_frames 줄 공통): items = [{ id, sec, hit, loop, ident, file }] (칸 순서대로)
//   장 수 묶음 → 그 묶음 규칙: 칸마다 양수 시간 · 반복 허용 · 타격 칸 수 · 한 바퀴 합 · 반복 주기 · 인접 중복 장(V2 = 오류) · 떨어진 재사용 장 · 블렌드 이름
function seqCheck(label, rule, items, out, kind) {
  const n = items.length;
  const range = rule.ranges.find(([lo, hi]) => n >= lo && n <= hi);
  if (!range) { out.errors.push(label + " " + n + "장 — 허용 " + rangeText(rule) + " (" + rule.name + ")"); return null; }
  const v2 = range[2] === "v2";
  const minSec = kind === "fx" ? 0.04 : FRAME_MIN_SEC;
  let sum = 0;
  items.forEach((it, i) => {
    if (!(it.sec > 0)) out.errors.push(label + " #" + (i + 1) + " 시간 " + it.sec + " — 양수여야 함");
    else if (it.sec < minSec - 1e-9) out.warnings.push(label + " #" + (i + 1) + " " + r3(it.sec) + "초 < " + r3(minSec) + (kind === "fx" ? " — SkillEffects spec.sec를 명시해야 이 간격으로 돈다 (기본 바닥 0.04)" : " — 60Hz 화면에서 건너뛸 수 있음"));
    sum += it.sec > 0 ? it.sec : 0;
  });
  const looped = items.some((it) => it.loop);
  if (looped && rule.loop !== "any") out.errors.push(label + " 반복 — " + rule.name + "은 한 번 재생 (서버가 GiantHoldUntil로 붙잡음)");
  const hits = items.filter((it) => it.hit).length;
  const [hlo, hhi] = v2 ? rule.hits : [0, 1];
  if (hits < hlo || hits > hhi) out.errors.push(label + " 타격 칸 " + hits + "개 — " + (hlo === hhi ? hlo : hlo + "~" + hhi) + "개여야 함" + (rule === FX_RULES.nova ? " (노바는 단발 폭발 하나 · 둘째 파동 금지)" : ""));
  if (sum < rule.sec[0] - 1e-6 || sum > rule.sec[1] + 1e-6) (v2 ? out.errors : out.warnings).push(label + " 지속 합 " + r3(sum) + "초 — " + rule.sec[0] + "~" + rule.sec[1] + "초 밖");
  if (looped && rule.cycle) {
    const gap = giantOpt(...rule.cycle);
    if (gap > 0 && ![1, 2].some((k) => Math.abs(sum - k * gap) <= 0.02)) out.warnings.push(label + " 반복 한 바퀴 " + r3(sum) + "초가 타격 주기 " + gap + "초(" + rule.cycle.join(" ") + ")의 1·2배가 아님 — 루프 이음이 타격과 어긋남");
  }
  for (let i = 1; i < n; i++) if (items[i].ident && items[i].ident === items[i - 1].ident) (v2 ? out.errors : out.warnings).push(label + " #" + i + "→#" + (i + 1) + " 같은 그림 연속 (중복 장 · 숫자만 늘린 장 금지)");
  const seen = new Map();
  items.forEach((it, i) => {
    if (!it.ident) return;
    if (seen.has(it.ident) && seen.get(it.ident) !== i - 1) out.warnings.push(label + " #" + (i + 1) + " = #" + (seen.get(it.ident) + 1) + " 같은 그림 재사용 (왕복·스틸 의심 — 의도면 무시)");
    seen.set(it.ident, i);
    if (it.file && BLEND_RE.test(it.file)) out.warnings.push(label + " #" + (i + 1) + " 파일 이름이 블렌드·보간 장 (" + path.basename(it.file) + ") — 스틸 블렌드 의심");
  });
  return { n, tier: range[2], sum: r3(sum), hits };
}

// 대기표 검사: 종류마다 6동작·장 수·칸 번호 0..n-1·타이밍(서기·걷기 반복, 공격·기술 타격 칸 하나)·192 발 피벗 · HUD 5 · RUID 칸은 비거나 32자리
//   + 기술 몸(BODY_RULES) · 효과(FX_RULES) 연속본은 있을 때만 새 검증표로 · 반환 { errors, warnings, summary }
function checkAll(rows) {
  const out = { errors: [], warnings: [], summary: [] };
  const bad = out.errors;
  const frames = rows.filter((r) => r.kind === "frame"), icons = rows.filter((r) => r.kind === "ui_icon"), fx = rows.filter((r) => r.kind === "fx");
  const base = frames.filter((r) => STATES.some(([st]) => st === r.state));
  if (base.length !== FORMS.length * 30) bad.push("몸 프레임 " + base.length + " ≠ 150");
  if (icons.length !== FORMS.length) bad.push("HUD 아이콘 " + icons.length + " ≠ 5");
  for (const r of rows) if (!["frame", "ui_icon", "fx"].includes(r.kind)) bad.push(r.key + " kind '" + r.kind + "' — frame·ui_icon·fx 중 하나");
  const keys = new Set();
  for (const r of rows) {
    if (keys.has(r.key)) bad.push("키 중복 " + r.key);
    keys.add(r.key);
    if (r.ruid !== "" && !isRuid(r.ruid)) bad.push(r.key + " RUID 형식 " + r.ruid);
    if (!isSha(r.sha256)) bad.push(r.key + " sha256 형식");
    if (r.filter !== "Point" || r.wrap !== "Clamp") bad.push(r.key + " filter/wrap " + r.filter + "/" + r.wrap);
  }
  const ruidSha = new Map();
  for (const r of rows) if (isRuid(r.ruid)) {
    if (ruidSha.has(r.ruid) && ruidSha.get(r.ruid) !== r.sha256) bad.push(r.key + " RUID가 다른 그림과 같음 " + r.ruid);
    ruidSha.set(r.ruid, r.sha256);
  }
  const stepKey = (prefix, r, i) => Number(r.frame_index0) !== i || r.key !== prefix + String(i + 1).padStart(2, "0");
  for (const form of FORMS) {
    for (const [state, n] of STATES) {
      const list = frames.filter((r) => r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
      if (list.length !== n) { bad.push(form + " " + state + " " + list.length + "장 ≠ " + n); continue; }
      list.forEach((r, i) => {
        if (stepKey("giant-" + form + "-" + state + "-", r, i)) bad.push(r.key + " 칸 번호/키");
        if (Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.03125 || Number(r.height) !== 192) bad.push(r.key + " 피벗·높이");
        if (!(Number(r.duration_ms) > 0)) bad.push(r.key + " 시간");
        if ((r.loop === "true") !== (state === "stand" || state === "move")) bad.push(r.key + " 반복");
      });
      const hits = list.filter((r) => r.hit === "true").length;
      if (hits !== ((state === "attack" || state === "skill") ? 1 : 0)) bad.push(form + " " + state + " 타격 칸 " + hits);
      for (let i = 1; i < list.length; i++) if (list[i].sha256 === list[i - 1].sha256) out.warnings.push(form + " " + state + " #" + i + "→#" + (i + 1) + " 같은 그림 연속");
    }
    const known = new Set([...STATES.map(([st]) => st), ...Object.keys(BODY_RULES[form])]);
    for (const st of new Set(frames.filter((r) => r.form === form).map((r) => r.state))) if (!known.has(st)) bad.push(form + " " + st + " — 검증표에 없는 동작 (기술 몸은 " + (Object.keys(BODY_RULES[form]).join("·") || "없음") + ")");
    for (const [state, rule] of Object.entries(BODY_RULES[form])) {
      // 기술 몸은 있을 때만: 칸 번호 0..n-1 · 키 · 192 발 피벗 + seqCheck(장 수 묶음 · 시간 · 반복 · 타격 칸 · 중복 장)
      const list = frames.filter((r) => r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
      if (list.length === 0) continue;
      list.forEach((r, i) => {
        if (stepKey("giant-" + form + "-" + state + "-", r, i)) bad.push(r.key + " 칸 번호/키");
        if (Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.03125 || Number(r.height) !== 192) bad.push(r.key + " 피벗·높이");
      });
      const res = seqCheck(form + " " + state, rule, list.map((r) => ({ id: r.key, sec: Number(r.duration_ms) / 1000, hit: r.hit === "true", loop: r.loop === "true", ident: r.sha256, file: r.file })), out, "body");
      if (res) out.summary.push("몸 " + form + " " + state + " " + res.n + "장(" + res.tier + ") " + res.sum + "초 타격 " + res.hits);
    }
  }
  for (const r of icons) if (!FORMS.includes(r.form) || Number(r.width) !== 48 || Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.5) bad.push(r.key + " HUD 규격");
  const fxNames = new Set(fx.map((r) => r.state));
  for (const name of fxNames) {
    const rule = FX_RULES[name];
    if (!rule) { bad.push("효과 '" + name + "' — 검증표에 없음 (" + Object.keys(FX_RULES).join("·") + ")"); continue; }
    const list = fx.filter((r) => r.state === name).sort((a, b) => a.frame_index0 - b.frame_index0);
    list.forEach((r, i) => {
      if (stepKey("giant-fx-" + name + "-", r, i)) bad.push(r.key + " 칸 번호/키 (giant-fx-" + name + "-NN)");
      if (r.form !== rule.form) bad.push(r.key + " form '" + r.form + "' — " + rule.form);
      const px = Number(r.pivot_x), py = Number(r.pivot_y);
      if (!(px >= 0 && px <= 1 && py >= 0 && py <= 1) || !(Number(r.width) > 0 && Number(r.height) > 0)) bad.push(r.key + " 피벗·크기");
    });
    const sizes = new Set(list.map((r) => r.width + "x" + r.height));
    if (sizes.size > 1) bad.push("효과 " + name + " 장마다 캔버스 크기가 다름 (" + [...sizes].join(",") + ") — 같은 ref·배율로 이어지지 않는다");
    const res = seqCheck("효과 " + name, rule, list.map((r) => ({ id: r.key, sec: Number(r.duration_ms) / 1000, hit: r.hit === "true", loop: r.loop === "true", ident: r.sha256, file: r.file })), out, "fx");
    if (res) out.summary.push("효과 " + name + " " + res.n + "장(" + res.tier + ") " + res.sum + "초 타격 " + res.hits);
  }
  return out;
}
const check = (rows) => checkAll(rows).errors;   // 예전 모양 (오류 목록만)

// data/monster_frames.csv의 form_giant_* 줄 검사 (check_data · check-frames): 기본 6동작 장 수 그대로 · 칸 수 = 시간 수 · 양수 시간 · 반복 · 타격 칸(impact = hitFrame 0부터) 범위
//   + 기술 몸 줄은 BODY_RULES(같은 표) — V2 묶음(12~16장 등)은 impact가 반드시 있어야 한다 (FrameClip s · 서버 피해 시각과 맞출 칸)
function checkFrames(mfRows) {
  const out = { errors: [], warnings: [], summary: [] };
  const giant = mfRows.filter((r) => /^form_giant_/.test(r.monster));
  for (const r of giant) if (!FORMS.includes(r.monster.replace("form_giant_", ""))) out.errors.push(r.monster + " — 거인 5종이 아님");
  for (const form of FORMS) {
    const mine = giant.filter((r) => r.monster === "form_giant_" + form);
    if (mine.length === 0) continue;   // 등록 전 = 지금 그림 (GiantLook nil)
    const seenState = new Set();
    for (const r of mine) {
      const label = "form_giant_" + form + " " + r.state;
      if (seenState.has(r.state)) out.errors.push(label + " 줄 중복");
      seenState.add(r.state);
      const f = r.frames ? r.frames.split(";") : [], d = r.delays ? r.delays.split(";") : [];
      if (f.length !== d.length) { out.errors.push(label + " 장 " + f.length + " ≠ 시간 " + d.length); continue; }
      if (f.some((x) => !isRuid(x))) out.errors.push(label + " RUID 형식");
      if (r.loop !== "true" && r.loop !== "false") out.errors.push(label + " loop '" + r.loop + "'");
      const hasImp = r.impact !== "" && r.impact !== undefined;
      const imp = hasImp ? Number(r.impact) : -1;
      if (hasImp && !(Number.isInteger(imp) && imp >= 0 && imp < f.length)) out.errors.push(label + " impact(hitFrame) " + r.impact + " — 0~" + (f.length - 1));
      const base = STATES.find(([st]) => st === r.state);
      if (base) {
        if (f.length !== base[1]) out.errors.push(label + " " + f.length + "장 ≠ " + base[1] + " (V4 canon)");
        if (d.some((x) => !(Number(x) > 0))) out.errors.push(label + " 시간은 양수");
        if ((r.loop === "true") !== (r.state === "stand" || r.state === "move")) out.errors.push(label + " 반복");
        if ((r.state === "attack" || r.state === "skill") !== hasImp) out.errors.push(label + " 타격 칸 " + (hasImp ? "있음" : "없음"));
        continue;
      }
      const rule = BODY_RULES[form][r.state];
      if (!rule) { out.errors.push(label + " — 검증표에 없는 동작"); continue; }
      const items = f.map((x, i) => ({ id: label + "#" + (i + 1), sec: Number(d[i]), hit: i === imp, loop: r.loop === "true", ident: x }));
      const res = seqCheck(label, rule, items, out, "body");
      if (res) {
        if (res.tier === "v2" && !hasImp && rule.hits[0] > 0) out.errors.push(label + " V2 " + res.n + "장인데 impact(hitFrame) 칸이 비어 있음");
        out.summary.push(label + " " + res.n + "장(" + res.tier + ") " + res.sum + "초 impact " + (hasImp ? imp : "-"));
      }
    }
    for (const [st, n] of STATES) if (!seenState.has(st)) out.errors.push("form_giant_" + form + " " + st + " 줄 없음 (" + n + "장 · 하나라도 빠지면 거인 그림 전체가 꺼짐)");
  }
  return out;
}

// 아트 결과 매니페스트(json) 교차 검증: sha256·key/file이 있는 항목을 모두 찾아 대기표와 맞춘다 (형식이 달라도 찾은 만큼만 · 블렌드 표시 경고)
function crossManifest(rows, json) {
  const out = { errors: [], warnings: [], summary: [] };
  const found = [];
  (function walk(v) {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === "object") {
      if (typeof v.sha256 === "string" && (v.key || v.file || v.path)) found.push(v);
      for (const x of Object.values(v)) if (x && typeof x === "object") walk(x);
    }
  })(json);
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  const byBase = Object.fromEntries(rows.filter((r) => r.file).map((r) => [path.basename(r.file), r]));
  let matched = 0, unknown = 0;
  for (const m of found) {
    const r = byKey[m.key] || byBase[path.basename(String(m.file || m.path || ""))];
    if (!r) { unknown++; continue; }
    matched++;
    if (String(m.sha256).toLowerCase() !== r.sha256) out.errors.push(r.key + " 매니페스트 sha256 " + String(m.sha256).slice(0, 8) + "… ≠ 대기표 " + r.sha256.slice(0, 8) + "… (그림이 바뀜 → 새 업로드·새 RUID)");
    if (m.blend || m.interpolated || m.tween || (Array.isArray(m.source_frames) && m.source_frames.length > 1) || BLEND_RE.test(String(m.file || m.path || "")))
      out.warnings.push(r.key + " 매니페스트가 블렌드·보간 장으로 표시 — 스틸 블렌드 의심");
  }
  out.summary.push("매니페스트 항목 " + found.length + " · 대기표와 맞음 " + matched + " · 대기표에 없음 " + unknown + (found.length === 0 ? " (도착분 없음 — 교차 검증 건너뜀)" : ""));
  return out;
}

// 대기표 → monster_frames 줄: form_giant_(종류) 6동작 + 있는 기술 몸 (RUID ; · 시간 초 ; · 반복 · 클립 없음 · impact = 타격 칸(hitFrame) 0부터)
function framesRows(rows, form) {
  const extra = Object.keys(BODY_RULES[form] || {}).filter((state) => rows.some((r) => r.kind === "frame" && r.form === form && r.state === state));
  return [...STATES.map(([state]) => state), ...extra].map((state) => {
    const list = rows.filter((r) => r.kind === "frame" && r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
    const hit = list.findIndex((r) => r.hit === "true");
    return ["form_giant_" + form, state, list.map((r) => r.ruid).join(";"), list.map((r) => String(Number(r.duration_ms) / 1000)).join(";"), list[0].loop === "true" ? "true" : "false", "", hit >= 0 ? String(hit) : ""].join(",");
  });
}

// 대기표 → 효과 연속본 문자열 (「|」로 이음 · GameConst/SkillEffects 속성에 넣을 값 — 그 파일은 부모·갈래 B 소유라 여기서는 보이기만)
function fxStrings(rows) {
  return Object.keys(FX_RULES).map((name) => {
    const list = rows.filter((r) => r.kind === "fx" && r.state === name).sort((a, b) => a.frame_index0 - b.frame_index0);
    if (list.length === 0) return null;
    const hit = list.findIndex((r) => r.hit === "true");
    return { name, target: FX_RULES[name].now.join("."), n: list.length, ready: list.every((r) => isRuid(r.ruid)), ruids: list.map((r) => r.ruid).join("|"),
      sec: list.map((r) => Number(r.duration_ms) / 1000), hitFrame: hit, size: [Number(list[0].width), Number(list[0].height)] };
  }).filter(Boolean);
}

function apply(pack, argv) {
  const rows = load();
  const bad = check(rows);
  if (bad.length) throw new Error("대기표 검사 실패: " + bad.join(" / "));
  if (pack) {
    const up = Object.fromEntries(parse(fs.readFileSync(path.join(ROOT, pack, "resource-mapping.csv"), "utf8")).map((r) => [r.key || r.upload_name, r.RUID || r.ruid || ""]));
    for (const r of rows) if (isRuid(up[r.key])) r.ruid = up[r.key];
  }
  const done = (form) => rows.filter((r) => r.form === form && r.kind === "frame").every((r) => isRuid(r.ruid));
  const ready = FORMS.filter(done);
  if (ready.length < FORMS.length && !argv.includes("--allow-partial")) throw new Error("RUID가 다 차지 않음: " + FORMS.filter((f) => !done(f)).join(",") + " (다 찬 종류만 쓰려면 --allow-partial)");
  const mfFile = path.join(ROOT, "data/monster_frames.csv");
  const mf = fs.readFileSync(mfFile, "utf8").split(LF).filter((l) => l !== "");
  const keep = mf.filter((l, i) => i === 0 || !ready.some((f) => l.startsWith("form_giant_" + f + ",")));
  const add = ready.flatMap((f) => framesRows(rows, f));
  // 쓰기 전에 결과 monster_frames를 같은 검증표로 (기술 몸 V2 묶음은 impact 필수)
  const after = checkFrames(parse([...keep, ...add].join(LF) + LF));
  if (after.errors.length) throw new Error("monster_frames 검사 실패: " + after.errors.join(" / "));
  const icons = rows.filter((r) => r.kind === "ui_icon" && isRuid(r.ruid) && ready.includes(r.form));
  const uiFile = path.join(ROOT, "data/ui_icons.csv");
  const ui = fs.readFileSync(uiFile, "utf8").split(LF).filter((l) => l !== "");
  const uiKeep = ui.filter((l) => !icons.some((r) => l.startsWith(r.key + ",")));
  const uiAdd = icons.map((r) => [r.key, r.ruid, "#FFFFFF", "1", quote("거인 HUD 아이콘 48px (코덱스 J7-HUD5 · 0120 채택 · sha256 " + r.sha256.slice(0, 8) + "… · 갈래 E 등록)")].join(","));
  console.log("쓸 것: monster_frames " + add.length + "줄 (" + (ready.join(",") || "-") + ") · ui_icons " + uiAdd.length + "줄");
  for (const fx of fxStrings(rows)) console.log("효과 " + fx.name + " → " + fx.target + " " + fx.n + "장 hitFrame " + fx.hitFrame + (fx.ready ? " : " + fx.ruids : " (RUID 덜 참)") + " · 간격 " + fx.sec.join(";"));
  if (argv.includes("--dry")) { for (const l of [...add, ...uiAdd]) console.log("  " + l.slice(0, 160)); return; }
  fs.writeFileSync(mfFile, [...keep, ...add].join(LF) + LF);
  fs.writeFileSync(uiFile, [...uiKeep, ...uiAdd].join(LF) + LF);
  fs.writeFileSync(PENDING, toCsv(HEAD, rows));
  console.log("다음: node tools/gen_data.cjs · npm test · 메이커 refresh (효과 문자열은 부모가 GameConst/SkillEffects에)");
}

// 지금 게임에 걸린 효과 연속본 장 수 ↔ 새 목표 (정보만 · 실패하지 않는다)
function fxAudit() {
  const read = (file) => { try { return fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk", file), "utf8"); } catch (e) { return ""; } };
  const src = { GameConst: read("Common/GameConst.mlua"), SkillEffects: read("Skill/SkillEffects.mlua") };
  return Object.entries(FX_RULES).map(([name, rule]) => {
    const m = src[rule.now[0]].match(new RegExp("property string " + rule.now[1] + ' = "([^"]*)"'));
    const n = m ? m[1].split("|").filter(Boolean).length : 0;
    return name + " (" + rule.now.join(".") + ") 지금 " + n + "장 → 목표 " + rangeText(rule) + (rule.ranges.some(([lo, hi]) => n >= lo && n <= hi) ? " · 이미 맞음" : " · 새 그림 등록 대기");
  });
}

// 검증표 자체 테스트 (npm test): 구 납품 통과 · V2 새 범위 통과 · 위반 변이 검출 · 지금 monster_frames 통과
function selftest() {
  const fake = (k) => crypto.createHash("sha256").update(k).digest("hex");
  const row = (o) => Object.assign({ key: "", kind: "frame", form: "", state: "", frame: "", frame_index0: "", file: "", sha256: "", width: 128, height: 192, pivot_x: 0.5, pivot_y: 0.03125,
    filter: "Point", wrap: "Clamp", duration_ms: 100, loop: "false", hit: "false", animation_key: "", ruid: "" }, o);
  const seq = (kind, form, state, n, o = {}) => Array.from({ length: n }, (_, i) => {
    const key = (kind === "fx" ? "giant-fx-" : "giant-" + form + "-") + state + "-" + String(i + 1).padStart(2, "0");
    return row({ key, kind, form, state, frame: i + 1, frame_index0: i, file: (o.file || "f") + "/" + key + ".png", sha256: fake((o.salt || "") + key),
      width: kind === "fx" ? 256 : 128, height: kind === "fx" ? 256 : 192, pivot_y: kind === "fx" ? 0.5 : 0.03125,
      duration_ms: o.ms !== undefined ? o.ms : 100, loop: o.loop ? "true" : "false", hit: i === (o.hitAt === undefined ? -1 : o.hitAt) || (o.hits || []).includes(i) ? "true" : "false" });
  });
  const base = () => {
    const out = [];
    for (const form of FORMS) {
      for (const [state, n] of STATES) out.push(...seq("frame", form, state, n, { loop: state === "stand" || state === "move", hitAt: state === "attack" || state === "skill" ? 3 : undefined }));
      out.push(row({ key: "ui_giant_" + form, kind: "ui_icon", form, width: 48, height: 48, pivot_y: 0.5, sha256: fake("ui" + form), duration_ms: "", loop: "", hit: "" }));
    }
    return out;
  };
  const legacy = () => [...base(),
    ...seq("frame", "shield", "skill2", 6, { hitAt: 3, ms: 73 }), ...seq("frame", "greatsword", "skill1", 6, { loop: true, hitAt: 2, ms: 66.67 }),
    ...seq("frame", "greatsword", "skill2", 6, { hitAt: 3, ms: 92 }), ...seq("frame", "twin", "skill2", 4, { hitAt: 1 }),
    ...seq("frame", "mage", "skill2", 6, { loop: true, ms: 120 }), ...seq("frame", "mage", "skill1", 3, { ms: 250 })];
  const v2 = () => [...base(),
    ...seq("frame", "shield", "skill1", 10, { ms: 80 }), ...seq("frame", "shield", "skill2", 12, { hitAt: 6, ms: 60 }),
    ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 25 }), ...seq("frame", "greatsword", "skill2", 14, { hitAt: 6, ms: 60 }),
    ...seq("frame", "twin", "skill2", 6, { hitAt: 2, ms: 70 }),
    ...seq("fx", "mage", "nova", 16, { hitAt: 3, ms: 50 }), ...seq("fx", "greatsword", "spin", 16, { loop: true, ms: 50 }), ...seq("fx", "greatsword", "rift", 16, { hitAt: 2, ms: 50 }),
    ...seq("fx", "shield", "slam", 12, { hitAt: 4, ms: 60 }), ...seq("fx", "shield", "roar", 12, { ms: 70 })];
  const results = [];
  const expect = (name, out, want) => {
    const errs = out.errors.join(" | ");
    const ok = want === null ? out.errors.length === 0 : out.errors.some((e) => e.includes(want));
    results.push({ name, ok, detail: ok ? "" : (want === null ? "오류가 나면 안 됨: " + errs : "'" + want + "' 오류를 못 잡음 (" + (errs || "오류 없음") + ")") });
  };
  const expectWarn = (name, out, want) => {
    const ok = out.errors.length === 0 && out.warnings.some((w) => w.includes(want));
    results.push({ name, ok, detail: ok ? "" : "경고 '" + want + "' 없음 · 오류 " + out.errors.join(" | ") + " · 경고 " + out.warnings.join(" | ") });
  };
  const mutate = (rows, pick, fn) => rows.map((r) => (pick(r) ? Object.assign({}, r, fn(r)) : r));
  // 통과해야 하는 것
  if (fs.existsSync(PENDING)) expect("지금 대기표(구 납품 150+5)", checkAll(load()), null);
  expect("합성 기본 150+5", checkAll(base()), null);
  expect("구 납품 기술 몸(방패 6 · 회전 6 반복 · 가르기 6 · 쌍칼 4 · 기도 6 · 노바 앞 3)", checkAll(legacy()), null);
  expect("구 납품 쌍칼 6장", checkAll([...base(), ...seq("frame", "twin", "skill2", 6, { hitAt: 2 })]), null);
  expect("V2 새 범위(함성 10 · 내려찍기 12 · 회전 16 · 가르기 14 · 효과 노바 16 · 회전 16 · 균열 16 · 내려찍기 12 · 함성 12)", checkAll(v2()), null);
  expect("V2 경계(함성 8·12 · 가르기 12·16 · 효과 내려찍기 16)", checkAll([...base(), ...seq("frame", "shield", "skill1", 8, { ms: 80 }), ...seq("frame", "greatsword", "skill2", 16, { hitAt: 6, ms: 60 }),
    ...seq("fx", "shield", "slam", 16, { hitAt: 4, ms: 60 })]), null);
  expect("V2 함성 12", checkAll([...base(), ...seq("frame", "shield", "skill1", 12, { ms: 80 })]), null);
  // 코덱스 확정 후속: 대검 회전 몸은 12~16 모두 허용 (짧은 기존 회전 시간에 맞춤 · 16을 채우려 복제 금지 = 중복 장 오류 유지)
  expect("V2 회전 몸 12장(하한)", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 12, { loop: true, hitAt: 6, ms: 33.34 })]), null);
  expect("V2 회전 몸 16장(상한)", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 25 })]), null);
  expect("V2 회전 몸 17장", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 17, { loop: true, hitAt: 8, ms: 23.53 })]), "17장 — 허용");
  expect("V2 회전 몸 16장을 복제로 채움", checkAll(mutate([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 25 })], (r) => r.key === "giant-greatsword-skill1-10", () => ({ sha256: fake("giant-greatsword-skill1-09") }))), "같은 그림 연속");
  const mfNow = parse(fs.readFileSync(path.join(ROOT, "data/monster_frames.csv"), "utf8"));
  expect("지금 monster_frames form_giant_* (기본 150 + full66 기술 몸)", checkFrames(mfNow), null);
  const mfRows = (rows) => parse(["monster,state,frames,delays,loop,clip,impact", ...FORMS.flatMap((f) => framesRows(rows.map((r) => Object.assign({}, r, { ruid: r.sha256.slice(0, 32) })), f))].join(LF) + LF);
  expect("V2 대기표 → monster_frames 줄(impact 포함)", checkFrames(mfRows(v2())), null);
  // 위반 변이 (잡아야 하는 것)
  expect("회전 몸 10장 (4~6·16 밖)", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 10, { loop: true, hitAt: 2, ms: 40 })]), "10장 — 허용");
  expect("방패 내려찍기 7장", checkAll([...base(), ...seq("frame", "shield", "skill2", 7, { hitAt: 3 })]), "7장 — 허용");
  expect("노바 효과 타격 칸 둘 (둘째 파동)", checkAll([...base(), ...seq("fx", "mage", "nova", 16, { hits: [3, 10], ms: 50 })]), "둘째 파동");
  expect("노바 효과 15장", checkAll([...base(), ...seq("fx", "mage", "nova", 15, { hitAt: 3, ms: 50 })]), "15장 — 허용");
  expect("V2 중복 장 (같은 그림 연속)", checkAll(mutate(v2(), (r) => r.key === "giant-greatsword-skill2-05", () => ({ sha256: fake("giant-greatsword-skill2-04") }))), "같은 그림 연속");
  expect("시간 0", checkAll(mutate(v2(), (r) => r.key === "giant-shield-skill2-03", () => ({ duration_ms: 0 }))), "양수여야 함");
  expect("내려찍기 반복", checkAll(mutate(v2(), (r) => r.key.startsWith("giant-shield-skill2-"), () => ({ loop: "true" }))), "반복");
  expect("균열 효과 타격 칸 없음", checkAll(mutate(v2(), (r) => r.key.startsWith("giant-fx-rift-"), () => ({ hit: "false" }))), "타격 칸 0개");
  expect("기본 stand 5장", checkAll([...base(), ...seq("frame", "basic", "stand", 5, { loop: true, salt: "x" }).slice(4).map((r) => Object.assign(r, { key: "giant-basic-stand-05" }))]), "stand 5장");
  expect("V2 지속 합 초과 (가르기 16 × 0.2초)", checkAll([...base(), ...seq("frame", "greatsword", "skill2", 16, { hitAt: 6, ms: 200 })]), "지속 합");
  expect("효과 form 틀림", checkAll(mutate(v2(), (r) => r.key === "giant-fx-nova-01", () => ({ form: "shield" }))), "form 'shield'");
  expect("검증표에 없는 동작", checkAll([...base(), ...seq("frame", "twin", "skill3", 6, { hitAt: 2 })]), "검증표에 없는 동작");
  expect("기본 거인 기술 몸", checkAll([...base(), ...seq("frame", "basic", "skill1", 6, { hitAt: 2 })]), "검증표에 없는 동작");
  expect("효과 장마다 캔버스 다름", checkAll(mutate(v2(), (r) => r.key === "giant-fx-spin-07", () => ({ width: 300 }))), "캔버스 크기");
  const mfV2 = mfRows(v2());
  expect("monster_frames V2 회전 16장 impact 비움", checkFrames(mfV2.map((r) => (r.monster === "form_giant_greatsword" && r.state === "skill1" ? Object.assign({}, r, { impact: "" }) : r))), "impact(hitFrame) 칸이 비어");
  expect("monster_frames impact 범위 밖", checkFrames(mfV2.map((r) => (r.monster === "form_giant_shield" && r.state === "skill2" ? Object.assign({}, r, { impact: "20" }) : r))), "impact(hitFrame) 20");
  expect("monster_frames 장·시간 수 다름", checkFrames(mfV2.map((r) => (r.monster === "form_giant_twin" && r.state === "skill2" ? Object.assign({}, r, { delays: "0.1;0.1" }) : r))), "≠ 시간");
  expect("monster_frames 기본 attack impact 없음", checkFrames(mfNow.map((r) => (r.monster === "form_giant_mage" && r.state === "attack" ? Object.assign({}, r, { impact: "" }) : r))), "타격 칸 없음");
  expect("monster_frames 기본 move 줄 빠짐", checkFrames(mfNow.filter((r) => !(r.monster === "form_giant_twin" && r.state === "move"))), "move 줄 없음");
  // 경고 (실패는 아님)
  expectWarn("회전 반복 한 바퀴 ≠ 타격 주기", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 34 })]), "타격 주기");
  expectWarn("구 납품 인접 중복은 경고만", checkAll(mutate(legacy(), (r) => r.key === "giant-shield-skill2-02", () => ({ sha256: fake("giant-shield-skill2-01") }))), "같은 그림 연속");
  expectWarn("효과 0.04초 미만 간격", checkAll([...base(), ...seq("fx", "greatsword", "spin", 16, { loop: true, ms: 25 })]), "spec.sec");
  expectWarn("블렌드 이름", checkAll([...base(), ...seq("fx", "mage", "nova", 16, { hitAt: 3, ms: 50, file: "blend" })]), "블렌드");
  // 매니페스트 교차 검증
  const vrows = v2();
  expect("매니페스트 sha 일치", crossManifest(vrows, { deliveries: [{ frames: vrows.slice(0, 5).map((r) => ({ key: r.key, sha256: r.sha256 })) }] }), null);
  expect("매니페스트 sha 다름", crossManifest(vrows, [{ key: vrows[0].key, sha256: fake("other") }]), "매니페스트 sha256");
  expectWarn("매니페스트 블렌드 표시", crossManifest(vrows, [{ file: path.basename(vrows[2].file), sha256: vrows[2].sha256, blend: true }]), "블렌드");
  return results;
}

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  const report = (title, out, strict) => {
    for (const w of out.warnings) console.log("경고  " + w);
    if (out.errors.length || (strict && out.warnings.length)) { console.log(out.errors.join(LF)); process.exit(1); }
    console.log(title);
  };
  if (cmd === "plan") plan(opt("--assets"));
  else if (cmd === "check") {
    const rows = load();
    const out = checkAll(rows);
    if (opt("--manifest")) {
      const x = crossManifest(rows, JSON.parse(fs.readFileSync(path.resolve(opt("--manifest")), "utf8")));
      out.errors.push(...x.errors); out.warnings.push(...x.warnings); out.summary.push(...x.summary);
    }
    for (const l of out.summary) console.log("  " + l);
    report("[register_giant_visuals] 대기표 " + rows.length + "줄 · 몸 150 · HUD 5 · 기술 몸 " + rows.filter((r) => r.kind === "frame" && !STATES.some(([st]) => st === r.state)).length +
      " · 효과 " + rows.filter((r) => r.kind === "fx").length + " · RUID 채움 " + rows.filter((r) => isRuid(r.ruid)).length + " · 문제 0 · 경고 " + out.warnings.length, out, rest.includes("--strict"));
  }
  else if (cmd === "check-frames") {
    const out = checkFrames(parse(fs.readFileSync(path.join(ROOT, "data/monster_frames.csv"), "utf8")));
    for (const l of out.summary) console.log("  " + l);
    report("[register_giant_visuals] monster_frames form_giant_* 문제 0 · 경고 " + out.warnings.length, out, rest.includes("--strict"));
  }
  else if (cmd === "fx-audit") for (const l of fxAudit()) console.log(l);
  else if (cmd === "selftest") {
    const res = selftest();
    for (const r of res.filter((x) => !x.ok)) console.log("실패  " + r.name + " — " + r.detail);
    const fail = res.filter((x) => !x.ok).length;
    console.log("[register_giant_visuals selftest] 통과 " + (res.length - fail) + " / 실패 " + fail + " (구 납품 · V2 새 범위 · 위반 변이 · monster_frames · 매니페스트)");
    if (fail) process.exit(1);
  }
  else if (cmd === "apply") apply(rest[0] && !rest[0].startsWith("--") ? rest[0] : null, rest);
  else if (cmd === "preview-rows") {
    // 오프라인 회귀용: RUID 자리에 그림 sha256 앞 32자리를 넣은 가짜 등록으로 apply가 쓸 monster_frames 줄을 보인다 (파일은 쓰지 않는다)
    const rows = load().map((r) => Object.assign({}, r, { ruid: r.sha256.slice(0, 32) }));
    for (const f of FORMS) for (const l of framesRows(rows, f)) console.log(l);
  }
  else { console.log("사용: plan --assets 폴더 | check [--manifest json] [--strict] | check-frames | fx-audit | selftest | apply 업로드팩 [--dry] [--allow-partial]"); process.exit(2); }
}
module.exports = { check, checkAll, checkFrames, crossManifest, framesRows, fxStrings, parse, STATES, EXTRA_STATES, BODY_RULES, FX_RULES, FORMS, load };
