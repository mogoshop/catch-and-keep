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
//   node tools/register_giant_visuals.cjs intake-fx 「manifest.json」 [--fx nova] [--layers] [--write]   (아트 매니페스트 → 대기표 효과 줄 · sha 재측정 · B 새 자리·*Opts 출력)
//   node tools/register_giant_visuals.cjs intake-art --nova 「manifest」 --greatsword 「폴더」 --shield 「폴더」 [--out 폴더] [--write]   (full133 납품 → 대기표·monster_frames·효과 자리 초안)
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
  nova: { form: "mage", name: "화염 노바 단발 폭발", ranges: [[16, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.4, 1.4], legacy: ["SkillEffects", "FxGiantNova"] },
  spin: { form: "greatsword", name: "회전 베기 수평 고리", ranges: [[16, 16, "v2"]], loop: "any", hits: [0, 1], sec: [0.3, 0.8], cycle: ["greatsword", "s1Opts", "gap"], legacy: ["GameConst", "FxGiantSpin"] },
  rift: { form: "greatsword", name: "땅 가르기 균열", ranges: [[16, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.4, 1.6], legacy: ["GameConst", "FxGiantRift"] },
  slam: { form: "shield", name: "방패 내려찍기 충격", ranges: [[12, 16, "v2"]], loop: false, hits: [1, 1], sec: [0.3, 1.5], legacy: ["GameConst", "FxGiantSlam"] },
  roar: { form: "shield", name: "도발 함성 문양·방사", ranges: [[12, 12, "v2"]], loop: false, hits: [0, 1], sec: [0.4, 1.6], legacy: ["SkillEffects", "FxGiantRoar"] },
};
// 48 V2 B 새 자리 (B 73fc0393 · SkillEffects): 층 → [연속본 속성, 계약(*Opts) 속성, order, 메모]. "" = 한 층 납품 · rear = 몸 뒤 · front = 몸 앞 (back = rear 별칭)
//   *Opts 계약 키 (B fx_slots): w·h(원본 px) · ref(그림이 그려진 세계 지름 칸 · 56px=1칸) · impact(타격 칸 1부터 = hitFrame+1) · sec · span · order · ax·ay · face · flip
//   노바 앞 층(작은 중앙 섬광)은 B에 자리가 없다 → 제안 이름 FxGiantNovaFront(+Opts) · 한 층으로 쓰면 원본 합본을 FxGiantNova에
const FX_SLOTS = {
  nova: { "": ["FxGiantNova", "FxGiantNovaOpts", 1, ""], rear: ["FxGiantNova", "FxGiantNovaOpts", 1, "층 나눔 시 뒤 층(바닥 광선·파편)"], front: ["FxGiantNovaFront", "FxGiantNovaFrontOpts", 6, "제안 — B 자리 없음 (작은 중앙 섬광)"] },
  spin: { "": ["FxGiantSpinFront", "FxGiantSpinOpts", 6, "한 층이면 앞 자리"], rear: ["FxGiantSpinBack", "FxGiantSpinOpts", 1, ""], front: ["FxGiantSpinFront", "FxGiantSpinOpts", 6, ""] },
  rift: { "": ["FxGiantRiftSeq", "FxGiantRiftOpts", 1, ""] },
  slam: { "": ["FxGiantSlamSeq", "FxGiantSlamOpts", 1, ""], rear: ["FxGiantSlamSeq", "FxGiantSlamOpts", 1, "분출·바닥 충격"], front: ["FxGiantSlamFront", "FxGiantSlamFrontOpts", 6, "접점 광"] },
  roar: { "": ["FxGiantRoarSeq", "FxGiantRoarOpts", 1, "방사는 몸 뒤(납품 behind_radial) — 지금 B 기본 order 6과 다르면 부모가 Opts order로"], front: ["FxGiantRoarFront", "FxGiantRoarFrontOpts", 6, "제안 — B 자리 없음 (축광 0~4 앞 별)"] },
};
// ref (그림이 그려진 세계 지름 칸): 노바 = 내용 지름 420px ÷ 56 = 7.5칸 (캔버스 640×512 = 11.43×9.14칸 · summon48-spectacle-nova-layer-contract) · 나머지는 이미지 계약이 오면 부모가 Opts에
const FX_REF = { nova: 7.5, spin: 3.2 };   // 회전 = 대검 납품 world_size_tiles.diameter 3.2 (지금 GiantFxSpec ref와 같음) · 균열은 길이로 늘임(stretch · ref 없음)
const LAYER_ALIAS = { back: "rear" };
const layerOf = (r) => LAYER_ALIAS[r.layer] || r.layer || "";
const FRAME_MIN_SEC = 1 / 30;   // 몸: 한 칸이 1/30초보다 짧으면 「경고」만 (렌더·갱신 주기에 따라 그 구간이 건너뛰어지거나 길어질 수 있음 — 엔진 상한·필수 규칙 아님 · 60Hz면 25ms도 재생 · 코덱스 정정) · 효과: 0.04 미만이면 spec.sec 명시 필요 (경고)
// 하위 호환 내보내기 (예전 EXTRA_STATES 모양: 상태 → 종 → [최소, 최대])
const EXTRA_STATES = {};
for (const form of FORMS) for (const [state, rule] of Object.entries(BODY_RULES[form])) {
  (EXTRA_STATES[state] = EXTRA_STATES[state] || Object.fromEntries(FORMS.map((f) => [f, [0, 0]])))[form] =
    [Math.min(...rule.ranges.map((r) => r[0])), Math.max(...rule.ranges.map((r) => r[1]))];
}
for (const st of ["skill1", "skill2"]) if (!EXTRA_STATES[st]) EXTRA_STATES[st] = Object.fromEntries(FORMS.map((f) => [f, [0, 0]]));
// 상태 별칭 (한 곳): 방패 함성 몸은 A와 같은 키 skill1 — 납품이 roar로 오면 여기서만 skill1로 바꿔 읽는다 (키 이름 giant-shield-roar-NN은 그대로 허용)
const STATE_ALIAS = { shield: { roar: "skill1" } };
const canonRows = (rows, formOf) => rows.map((r) => {
  const to = (STATE_ALIAS[formOf(r)] || {})[r.state];
  return to ? Object.assign({}, r, { state: to, rawState: r.state }) : r;
});
const BLEND_RE = /blend|tween|interp|crossfade|mix|ghost-?frame/i;   // 스틸 블렌드 의심 이름 (매니페스트 표시 · 파일 이름)
const HEAD = ["key", "kind", "form", "state", "frame", "frame_index0", "file", "sha256", "width", "height", "pivot_x", "pivot_y", "filter", "wrap", "duration_ms", "loop", "hit", "animation_key", "ruid", "layer", "derived", "source_index0", "source_key"];
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
  for (const r of Object.values(old)) if ((r.kind === "fx" || (r.kind === "frame" && !STATES.some(([st]) => st === r.state))) && !rows.some((x) => x.key === r.key)) rows.push(r);   // intake로 넣은 효과·기술 몸 줄 유지
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
  const looped = items.some((it) => it.loop);
  const cycled = kind === "fx" && looped && rule.cycle;   // 반복 효과(회전)는 B cycle 규칙(한 바퀴 = gap)이 간격을 정한다 → 0.04 바닥 경고 없음
  items.forEach((it, i) => {
    if (!(it.sec > 0)) out.errors.push(label + " #" + (i + 1) + " 시간 " + it.sec + " — 양수여야 함");
    else if (it.sec < minSec - 1e-6 && !cycled) out.warnings.push(label + " #" + (i + 1) + " " + r3(it.sec) + "초 < " + r3(minSec) + (kind === "fx" ? " — *Opts에 durations(장마다 ms · 제안 키)나 sec·impact를 줘야 이 간격으로 돈다 (기본 바닥 0.04)" : " — 렌더·갱신 주기가 이보다 길면 이 구간이 건너뛰어지거나 길어질 수 있음 (경고 · 통과)"));
    sum += it.sec > 0 ? it.sec : 0;
  });
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
  rows = canonRows(rows, (r) => (r.kind === "frame" ? r.form : ""));
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
      const v2 = rule.ranges.some(([lo, hi, tier]) => tier === "v2" && list.length >= lo && list.length <= hi);
      list.forEach((r, i) => {
        if (stepKey("giant-" + form + "-" + (r.rawState || state) + "-", r, i)) bad.push(r.key + " 칸 번호/키");
        if (!v2 && (Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.03125 || Number(r.height) !== 192)) bad.push(r.key + " 피벗·높이 (구 납품 = 192 · 발 0.03125)");
        const px = Number(r.pivot_x), py = Number(r.pivot_y);
        if (v2 && (!(px >= 0 && px <= 1 && py >= 0 && py <= 1) || !(Number(r.width) > 0 && Number(r.height) > 0))) bad.push(r.key + " 피벗·크기");
      });
      if (v2) {
        // V2 기술 몸은 납품 캔버스 그대로 (대검 384×224 · 루트 192,186 · 방패 256×256 · 루트 128,248) — 한 동작 안에서 캔버스·피벗이 바뀌면 발이 튄다. 기본 몸과의 발 맞춤은 갈래 A(MotionSmoother) 몫
        const canv = new Set(list.map((r) => r.width + "x" + r.height + "@" + r.pivot_x + "," + r.pivot_y));
        if (canv.size > 1) bad.push(form + " " + state + " 장마다 캔버스·피벗이 다름 (" + [...canv].join(" ") + ")");
      }
      const res = seqCheck(form + " " + state, rule, list.map((r) => ({ id: r.key, sec: Number(r.duration_ms) / 1000, hit: r.hit === "true", loop: r.loop === "true", ident: r.sha256, file: r.file })), out, "body");
      if (res) out.summary.push("몸 " + form + " " + state + " " + res.n + "장(" + res.tier + ") " + res.sum + "초 타격 " + res.hits);
    }
  }
  for (const r of icons) if (!FORMS.includes(r.form) || Number(r.width) !== 48 || Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.5) bad.push(r.key + " HUD 규격");
  // 효과: (효과 이름, 층)마다 한 연속본 · 키 giant-fx-(효과)[-(층)]-NN · 층끼리는 장 수·시간·타격 칸·캔버스·피벗이 같아야 한다 (앞+뒤 = 원본 합본 · 새 장 아님)
  const groups = new Map();
  for (const r of fx) { const k = r.state + "|" + layerOf(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const byName = {};
  const mainOf = {};
  for (const [gk, rowsG] of groups) if (gk.endsWith("|")) mainOf[gk.slice(0, -1)] = rowsG.slice().sort((a, b) => a.frame_index0 - b.frame_index0);
  for (const [gk, rowsG] of groups) {
    const [name, layer] = gk.split("|");
    const rule = FX_RULES[name];
    if (!rule) { bad.push("효과 '" + name + "' — 검증표에 없음 (" + Object.keys(FX_RULES).join("·") + ")"); continue; }
    if (!(layer in FX_SLOTS[name])) { bad.push("효과 " + name + " 층 '" + layer + "' — 이 효과의 자리는 " + Object.keys(FX_SLOTS[name]).map((x) => x || "(한 층)").join("·")); continue; }
    const list = rowsG.sort((a, b) => a.frame_index0 - b.frame_index0);
    const label = "효과 " + name + (layer ? "(" + layer + ")" : "");
    list.forEach((r, i) => {
      if (stepKey("giant-fx-" + name + "-" + (r.layer ? r.layer + "-" : ""), r, i)) bad.push(r.key + " 칸 번호/키 (giant-fx-" + name + (r.layer ? "-" + r.layer : "") + "-NN)");
      if (r.form !== rule.form) bad.push(r.key + " form '" + r.form + "' — " + rule.form);
      const px = Number(r.pivot_x), py = Number(r.pivot_y);
      if (!(px >= 0 && px <= 1 && py >= 0 && py <= 1) || !(Number(r.width) > 0 && Number(r.height) > 0)) bad.push(r.key + " 피벗·크기");
    });
    const sizes = new Set(list.map((r) => r.width + "x" + r.height + "@" + r.pivot_x + "," + r.pivot_y));
    if (sizes.size > 1) bad.push(label + " 장마다 캔버스 크기·피벗이 다름 (" + [...sizes].join(" ") + ") — 같은 ref·배율로 이어지지 않는다");
    const main = mainOf[name];
    const derived = layer !== "" && main && list.every((r) => r.derived === "true");
    if (derived) {
      // 파생 층: 원본 칸에 붙은 앞/뒤 그림 (새 프레임 아님) — 장 수 ≤ 원본 · 원본 칸 번호 범위·순서 · 시간 = 원본 그 칸
      if (list.length > main.length) bad.push(label + " 파생 층 " + list.length + "장 > 원본 " + main.length + "장");
      let prev = -1;
      list.forEach((r) => {
        const si = Number(r.source_index0);
        if (!(Number.isInteger(si) && si >= 0 && si < main.length) || si <= prev) { bad.push(r.key + " source_index0 '" + r.source_index0 + "' — 원본 0~" + (main.length - 1) + " 안 · 늘어나는 순서"); return; }
        prev = si;
        if (Number(r.duration_ms) !== Number(main[si].duration_ms)) bad.push(r.key + " 시간 " + r.duration_ms + "ms ≠ 원본 #" + (si + 1) + " " + main[si].duration_ms + "ms (층은 원본과 같은 시각)");
        if (r.loop !== main[si].loop) bad.push(r.key + " 반복이 원본과 다름");
      });
      out.summary.push(label + " 파생 층 " + list.length + "장 (원본 칸 " + list.map((r) => r.source_index0).join(",") + " · 새 프레임 아님)");
    } else {
      const res = seqCheck(label, rule, list.map((r) => ({ id: r.key, sec: Number(r.duration_ms) / 1000, hit: r.hit === "true", loop: r.loop === "true", ident: r.sha256, file: r.file })), out, "fx");
      if (res) out.summary.push(label + " " + res.n + "장(" + res.tier + ") " + res.sum + "초 타격 " + res.hits);
    }
    (byName[name] = byName[name] || []).push({ layer, list, derived });
  }
  for (const [name, gs] of Object.entries(byName)) {
    const full = mainOf[name] ? mainOf[name].length : null;
    const layered = gs.filter((g) => g.layer !== "" && (full === null || g.list.length === full));   // 원본과 장 수가 같은 층끼리만 (부분 파생 층은 위에서 원본 칸과 맞춤)
    if (layered.length < 2) continue;
    const sig = (g) => [g.list.length, g.list.map((r) => Number(r.duration_ms)).join(","), g.derived ? "-" : g.list.findIndex((r) => r.hit === "true"), g.list[0].width + "x" + g.list[0].height, g.list[0].pivot_x + "," + g.list[0].pivot_y, g.list.map((r) => r.loop).join("")].join(" / ");
    const first = sig(layered[0]);
    for (const g of layered.slice(1)) if (sig(g) !== first) bad.push("효과 " + name + " 층 " + layered[0].layer + "·" + g.layer + "의 장 수·시간·타격 칸·캔버스·피벗·반복이 다름 (" + first + " ≠ " + sig(g) + ") — 앞·뒤 층은 같은 시각에 함께 돈다");
  }
  return out;
}
const check = (rows) => checkAll(rows).errors;   // 예전 모양 (오류 목록만)

// data/monster_frames.csv의 form_giant_* 줄 검사 (check_data · check-frames): 기본 6동작 장 수 그대로 · 칸 수 = 시간 수 · 양수 시간 · 반복 · 타격 칸(impact = hitFrame 0부터) 범위
//   + 기술 몸 줄은 BODY_RULES(같은 표) — V2 묶음(12~16장 등)은 impact가 반드시 있어야 한다 (FrameClip s · 서버 피해 시각과 맞출 칸)
function checkFrames(mfRows) {
  mfRows = canonRows(mfRows, (r) => String(r.monster || "").replace("form_giant_", ""));
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
  const layersFirst = rows.slice().sort((a, b) => (b.layer ? 1 : 0) - (a.layer ? 1 : 0));   // 같은 파일 이름·원래 key면 층 줄보다 원본 줄
  const byBase = Object.fromEntries(layersFirst.filter((r) => r.file).map((r) => [path.basename(r.file), r]));
  const bySource = Object.fromEntries(layersFirst.filter((r) => r.source_key).map((r) => [r.source_key, r]));
  let matched = 0, unknown = 0;
  for (const m of found) {
    const r = byKey[m.key] || bySource[m.key] || byBase[path.basename(String(m.file || m.path || ""))];
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
  rows = canonRows(rows, (r) => (r.kind === "frame" ? r.form : ""));
  const extra = Object.keys(BODY_RULES[form] || {}).filter((state) => rows.some((r) => r.kind === "frame" && r.form === form && r.state === state));
  return [...STATES.map(([state]) => state), ...extra].map((state) => {
    const list = rows.filter((r) => r.kind === "frame" && r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
    const hit = list.findIndex((r) => r.hit === "true");
    return ["form_giant_" + form, state, list.map((r) => r.ruid).join(";"), list.map((r) => String(Number(r.duration_ms) / 1000)).join(";"), list[0].loop === "true" ? "true" : "false", "", hit >= 0 ? String(hit) : ""].join(",");
  });
}

// 대기표 → 효과 연속본 문자열과 *Opts 계약 (B 73fc0393 새 자리 · 그 파일은 부모·갈래 B 소유라 여기서는 보이기만)
//   opts = w·h(원본 px) · ref(FX_REF) · impact(hitFrame+1) · durations(장마다 ms가 다를 때 · 「,」로 이음 — Opts 칸 구분자 「;」와 겹치지 않게 · B GiantFxFrameSec 미지원 = 제안 키) · order
//   기존 Opts의 span·ax·ay·dy·face·flip(이미지 메타데이터)은 부모가 합친다 · 간격이 모두 같으면 durations를 쓰지 않고 B 규칙(impact·cycle·span·fit)에 맡긴다
function fxOptsText(name, list, order) {
  const hit = list.findIndex((r) => r.hit === "true");
  const ms = list.map((r) => Number(r.duration_ms));
  const parts = ["w=" + Number(list[0].width), "h=" + Number(list[0].height)];
  if (FX_REF[name]) parts.push("ref=" + FX_REF[name]);
  if (hit >= 0) parts.push("impact=" + (hit + 1));
  if (!ms.every((x) => Math.abs(x - ms[0]) < 1e-9) || list.every((r) => r.derived === "true" && list.length > 0) && list.length < 16 && list.some((r) => r.layer)) parts.push("durations=" + ms.join(","));   // 부분 파생 층(앞 별)은 원본 칸 시각 그대로 (B fit로 늘이지 않게)
  parts.push("order=" + order);
  return parts.join(";");
}
function fxStrings(rows) {
  const out = [];
  for (const name of Object.keys(FX_RULES)) for (const layer of Object.keys(FX_SLOTS[name])) {
    const list = rows.filter((r) => r.kind === "fx" && r.state === name && layerOf(r) === layer).sort((a, b) => a.frame_index0 - b.frame_index0);
    if (list.length === 0) continue;
    const [slot, optsSlot, order, note] = FX_SLOTS[name][layer];
    const hit = list.findIndex((r) => r.hit === "true");
    out.push({ name, layer, slot: "SkillEffects." + slot, optsSlot: "SkillEffects." + optsSlot, note, n: list.length, ready: list.every((r) => isRuid(r.ruid)), ruids: list.map((r) => r.ruid).join("|"),
      opts: fxOptsText(name, list, order), hitFrame: hit, impact: hit >= 0 ? hit + 1 : null, durationsMs: list.map((r) => Number(r.duration_ms)),
      size: [Number(list[0].width), Number(list[0].height)], pivot: [Number(list[0].pivot_x), Number(list[0].pivot_y)],
      worldCanvas: FX_REF[name] ? null : null, canvasTiles: [r3(Number(list[0].width) / 56), r3(Number(list[0].height) / 56)], legacy: FX_RULES[name].legacy.join(".") });
  }
  return out;
}

// 아트 납품 매니페스트(예 nova/full/manifest.json) → 대기표 효과 줄 (role effect · frame_index0 순 · peak_time_ms 칸 = 타격 칸 · 장마다 proposed_duration_ms · layers.front/rear는 --layers일 때 층 줄)
//   파일 sha256을 디스크에서 다시 재서 매니페스트와 맞춘다 (readSha를 주면 그것으로 · selftest) · 매니페스트 world_diameter_tiles ↔ FX_REF 교차
function intakeFx(json, dir, name, opt = {}) {
  const res = { rows: [], errors: [], warnings: [], summary: [] };
  const rule = FX_RULES[name];
  if (!rule) { res.errors.push("효과 '" + name + "' — 검증표에 없음"); return res; }
  const shaOf = opt.readSha || ((file) => (fs.existsSync(file) ? sha256(file) : null));
  const eff = (json.assets || []).filter((a) => a.role === "effect").sort((a, b) => a.frame_index0 - b.frame_index0);
  if (eff.length === 0) { res.errors.push("매니페스트에 role effect 항목이 없음"); return res; }
  const peak = eff[0].peak_time_ms;
  let hitIdx = eff.findIndex((a) => a.hit === true);
  if (hitIdx < 0 && peak !== undefined) hitIdx = eff.findIndex((a) => a.proposed_time_ms === peak);
  if (hitIdx < 0) res.errors.push("타격 칸을 못 찾음 (hit 표시도 peak_time_ms와 같은 proposed_time_ms도 없음)");
  const assetsRoot = path.join(ROOT, "assets/codex-bone-giants-v1");
  const relFile = (abs) => { const i = abs.split(path.sep).join("/").indexOf("/codex-bone-giants-v1/"); return i >= 0 ? abs.split(path.sep).join("/").slice(i + "/codex-bone-giants-v1/".length) : "spectacle-v2-20261030/" + name + "/full/" + path.relative(dir, abs).split(path.sep).join("/"); };   // 작업 폴더 납품도 assets 자리 기준 이름으로
  const layers = [""].concat(opt.layers ? ["front", "rear"] : []);
  for (const layer of layers) {
    eff.forEach((a, i) => {
      const file = layer ? (a.layers || {})[layer] : a.file;
      if (!file) { res.errors.push(a.key + " " + layer + " 층 파일 경로 없음"); return; }
      const abs = path.resolve(dir, file);
      const got = shaOf(abs);
      if (!got) res.errors.push(a.key + (layer ? " " + layer : "") + " 파일 없음 " + file);
      else if (!layer && String(a.sha256).toLowerCase() !== got) res.errors.push(a.key + " sha256 매니페스트 " + String(a.sha256).slice(0, 8) + "… ≠ 파일 " + got.slice(0, 8) + "…");
      if (Number(a.frame_index0) !== i) res.errors.push(a.key + " frame_index0 " + a.frame_index0 + " ≠ " + i);
      res.rows.push({ key: "giant-fx-" + name + "-" + (layer ? layer + "-" : "") + String(i + 1).padStart(2, "0"), kind: "fx", form: rule.form, state: name, frame: i + 1, frame_index0: i,
        file: relFile(abs), sha256: got || "", width: a.size[0], height: a.size[1], pivot_x: a.pivot[0], pivot_y: a.pivot[1], filter: "Point", wrap: "Clamp",
        duration_ms: a.proposed_duration_ms, loop: "false", hit: !layer && i === hitIdx ? "true" : "false", animation_key: "", ruid: "", layer,
        derived: layer ? "true" : "", source_index0: layer ? i : "", source_key: layer ? a.key + "-" + layer : a.key });
    });
  }
  const wd = eff[0].world_diameter_tiles;
  if (wd !== undefined && FX_REF[name] !== undefined && Number(wd) !== FX_REF[name]) res.warnings.push(name + " 매니페스트 world_diameter_tiles " + wd + " ≠ ref " + FX_REF[name]);
  const total = eff.reduce((t, a) => t + Number(a.proposed_duration_ms || 0), 0);
  res.summary.push(name + " 매니페스트 " + eff.length + "장 · 타격 칸 index " + hitIdx + " (impact " + (hitIdx + 1) + ") · 합 " + total + "ms · 캔버스 " + eff[0].size.join("×") + " · 피벗 " + eff[0].pivot.join("/") +
    (wd !== undefined ? " · 세계 지름 " + wd + "칸(ref)" : "") + " · 캔버스 세계 " + r3(eff[0].size[0] / 56) + "×" + r3(eff[0].size[1] / 56) + "칸" + (opt.layers ? " · 층 front/rear 포함" : ""));
  void assetsRoot;
  return res;
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
  for (const fx of fxStrings(rows)) console.log("효과 " + fx.name + (fx.layer ? "(" + fx.layer + ")" : "") + " → " + fx.slot + " " + fx.n + "장" + (fx.ready ? " = " + fx.ruids : " (RUID 덜 참)") + " · " + fx.optsSlot + " = " + fx.opts + (fx.note ? " · " + fx.note : ""));
  if (argv.includes("--dry")) { for (const l of [...add, ...uiAdd]) console.log("  " + l.slice(0, 160)); return; }
  fs.writeFileSync(mfFile, [...keep, ...add].join(LF) + LF);
  fs.writeFileSync(uiFile, [...uiKeep, ...uiAdd].join(LF) + LF);
  fs.writeFileSync(PENDING, toCsv(HEAD, rows));
  console.log("다음: node tools/gen_data.cjs · npm test · 메이커 refresh (효과 문자열은 부모가 GameConst/SkillEffects에)");
}

// ───── 48 V2 full133 납품 인수 (계약 summon48-spectacle-full-art-integration-contract · 원문 소비) ─────
//   대검 64(몸 skill1 회전 16 × 25ms 반복 · skill2 균열 16 합 550ms 접점 index 9 · 효과 회전 16 × 25ms 반복 + 파생 앞/뒤 32 · 균열 16 = 접점 300ms에 시작 · 길이 0.65초)
//   방패 52(몸 skill2 내려찍기 12 접점 index 6 = 120ms · skill1 함성 12 × 50ms · 효과 내려찍기 16(index 3 = 120ms 접점 · 몸과 t0 동시) · 함성 12 × 50ms · 파생 앞 별 8)
//   RUID 칸은 비움 (업로드 뒤 부모) · key = 대기표 규칙 이름(giant-<종>-<동작>-NN · giant-fx-<효과>[-층]-NN) · source_key = 납품 원래 key
const RIFT_FX_TOTAL_MS = 650;   // 계약: 균열 효과 길이 = 솟음 rise 0.25 + 잔광 0.4 (지금 연결 총 0.65초) → 16장 고르게(fit)
function artRow(o) {
  return Object.assign({ frame: "", file: "", sha256: "", filter: "Point", wrap: "Clamp", loop: "false", hit: "false", animation_key: "", ruid: "", layer: "", derived: "", source_index0: "", source_key: "" }, o);
}
function intakeGreatsword(dir, opt = {}) {
  const res = { rows: [], errors: [], warnings: [], summary: [], meta: {} };
  const shaOf = opt.readSha || ((file) => (fs.existsSync(file) ? sha256(file) : null));
  const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const tim = JSON.parse(fs.readFileSync(path.join(dir, "animation-timing-proposal.json"), "utf8"));
  const by = (g) => man.assets.filter((a) => a.group === g);   // 납품 순서 = 칸 순서 (key 번호 순)
  const verify = (a, abs) => { const got = shaOf(abs); if (!got) res.errors.push(a.key + " 파일 없음 " + a.file); else if (got !== a.sha256) res.errors.push(a.key + " sha256 매니페스트 ≠ 파일"); return got || a.sha256; };
  const body = (group, state, durs, loop, hitIdx) => by(group).forEach((a, i) => res.rows.push(artRow({ key: "giant-greatsword-" + state + "-" + String(i + 1).padStart(2, "0"), kind: "frame", form: "greatsword", state,
    frame: i + 1, frame_index0: i, file: "spectacle-v2-20261030/greatsword/full/" + a.file, sha256: verify(a, path.join(dir, a.file)), width: a.width, height: a.height, pivot_x: a.pivot[0], pivot_y: a.pivot[1],
    duration_ms: durs[i], loop: loop ? "true" : "false", hit: i === hitIdx ? "true" : "false", animation_key: "form_giant_greatsword", source_key: a.key })));
  const b1 = tim.body_proposal.skill1, b2 = tim.body_proposal.skill2;
  body("skill1", "skill1", b1.durations_ms, b1.loop, 0);              // 회전: 첫 타 = 첫 칸 (B skill1Hit 0)
  body("skill2", "skill2", b2.durations_ms, false, b2.contact_index);  // 균열: 접점 index 9 = 300ms
  const fxRows = (group, name, durs, loop, hitIdx) => by(group).forEach((a, i) => res.rows.push(artRow({ key: "giant-fx-" + name + "-" + String(i + 1).padStart(2, "0"), kind: "fx", form: "greatsword", state: name,
    frame: i + 1, frame_index0: i, file: "spectacle-v2-20261030/greatsword/full/" + a.file, sha256: verify(a, path.join(dir, a.file)), width: a.width, height: a.height, pivot_x: a.pivot[0], pivot_y: a.pivot[1],
    duration_ms: durs[i], loop: loop ? "true" : "false", hit: i === hitIdx ? "true" : "false", source_key: a.key })));
  fxRows("spin", "spin", tim.fx_proposal.spin.durations_ms, true, -1);
  const nRift = by("rift").length;
  fxRows("rift", "rift", Array.from({ length: nRift }, () => r3(RIFT_FX_TOTAL_MS / nRift)), false, 0);   // 첫 장 = 접점 300ms 순간
  const spin = by("spin");
  for (const L of man.layers || []) {
    const si = spin.findIndex((a) => a.key === L.from_key);
    if (si < 0) { res.errors.push(L.key + " from_key " + L.from_key + " 원본 없음"); continue; }
    const layer = LAYER_ALIAS[L.layer] || L.layer;
    res.rows.push(artRow({ key: "giant-fx-spin-" + layer + "-" + String(si + 1).padStart(2, "0"), kind: "fx", form: "greatsword", state: "spin", frame: si + 1, frame_index0: si,
      file: "spectacle-v2-20261030/greatsword/full/" + L.file, sha256: verify(L, path.join(dir, L.file)), width: L.width, height: L.height, pivot_x: L.pivot[0], pivot_y: L.pivot[1],
      duration_ms: tim.fx_proposal.spin.durations_ms[si], loop: "true", layer, derived: "true", source_index0: si, source_key: L.key }));
  }
  const spinWorld = (spin[0] || {}).world_size_tiles || {};
  res.meta = { spin_ref: spinWorld.diameter, rift_world: (by("rift")[0] || {}).world_size_tiles, body_canvas: man.body_canvas, body_root: man.nominal_body_root, rift_fx_start_ms: tim.fx_proposal.rift.start_relative_to_body_ms };
  res.summary.push("대검 몸 skill1 " + by("skill1").length + " · skill2 " + by("skill2").length + " · 효과 spin " + spin.length + " · rift " + nRift + " · 파생 층 " + (man.layers || []).length + " (새 프레임 아님)");
  return res;
}
function intakeShield(dir, opt = {}) {
  const res = { rows: [], errors: [], warnings: [], summary: [], meta: {} };
  const shaOf = opt.readSha || ((file) => (fs.existsSync(file) ? sha256(file) : null));
  const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const tim = JSON.parse(fs.readFileSync(path.join(dir, "animation-timing-proposal.json"), "utf8"));
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "records/contact-and-mirror-spec.json"), "utf8"));
  const der = fs.existsSync(path.join(dir, "records/derived-layer-manifest.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "records/derived-layer-manifest.json"), "utf8")) : [];
  const by = (role) => man.files.filter((a) => a.role === role).sort((a, b) => a.frame_index0 - b.frame_index0);
  const verify = (a, abs) => { const got = shaOf(abs); if (!got) res.errors.push((a.key || a.file) + " 파일 없음"); else if (got !== a.sha256) res.errors.push((a.key || a.file) + " sha256 매니페스트 ≠ 파일"); return got || a.sha256; };
  const add = (role, kind, name, durs, hitIdx) => by(role).forEach((a, i) => res.rows.push(artRow({
    key: kind === "frame" ? "giant-shield-" + name + "-" + String(i + 1).padStart(2, "0") : "giant-fx-" + name + "-" + String(i + 1).padStart(2, "0"), kind, form: "shield", state: name,
    frame: i + 1, frame_index0: i, file: "spectacle-v2-20261030/shield/full/" + a.file, sha256: verify(a, path.join(dir, a.file)), width: a.size[0], height: a.size[1], pivot_x: a.pivot[0], pivot_y: a.pivot[1],
    duration_ms: durs[i], loop: "false", hit: i === hitIdx ? "true" : "false", animation_key: kind === "frame" ? "form_giant_shield" : "", source_key: a.key })));
  add("slam_body", "frame", "skill2", tim.slam_body.durations_ms, tim.slam_body.contact_index0);   // 접점 index 6 = 120ms
  add("shout_body", "frame", "skill1", tim.shout_body.durations_ms, -1);                         // 함성: 타격 칸 비움 (계약 — FX는 몸 t0에 같이 시작 · skill1Hit로 늦추지 않음)
  add("slam_FX", "fx", "slam", tim.slam_FX.durations_ms, tim.slam_FX.behind_ground_start_index0); // index 3 = 120ms 지면 접점 (몸과 t0 동시 시작)
  add("shout_FX", "fx", "roar", tim.shout_FX.durations_ms, -1);
  const slamFx = by("slam_FX");
  der.forEach((L) => {
    const si = Number(L.source_frame_index0);
    const name = /shout/.test(L.source + L.file) ? "roar" : "slam";   // 앞 별: 내려찍기 0~2 · 함성 0~4 (축광 칸)
    const durs = name === "roar" ? tim.shout_FX.durations_ms : tim.slam_FX.durations_ms;
    res.rows.push(artRow({ key: "giant-fx-" + name + "-front-" + String(si + 1).padStart(2, "0"), kind: "fx", form: "shield", state: name, frame: si + 1, frame_index0: si,
      file: "spectacle-v2-20261030/shield/full/" + L.file, sha256: verify(L, path.join(dir, L.file)), width: L.crop[2] - L.crop[0], height: L.crop[3] - L.crop[1], pivot_x: L.pivot[0], pivot_y: L.pivot[1],
      duration_ms: durs[si], loop: "false", layer: "front", derived: "true", source_index0: si, source_key: path.basename(L.file, ".png") }));
    void slamFx;
  });
  res.meta = { slam: spec.slam, shout: spec.shout, roar_latch_body_index0: (spec.shout || {}).latch_body_frame_index0, roar_climax_index0: tim.shout_body.climax_index0 };
  res.summary.push("방패 몸 skill2 " + by("slam_body").length + " · skill1 " + by("shout_body").length + " · 효과 slam " + slamFx.length + " · roar " + by("shout_FX").length + " · 파생 앞 별 " + der.length + " (새 프레임 아님)");
  return res;
}
// 대기표 줄 → monster_frames 초안 (RUID 비움 · key·sha·시간·impact·반복) · 기술 몸만
function framesDraft(rows) {
  const out = [];
  for (const form of FORMS) for (const state of Object.keys(BODY_RULES[form])) {
    const list = rows.filter((r) => r.kind === "frame" && r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
    if (list.length === 0) continue;
    const hit = list.findIndex((r) => r.hit === "true");
    out.push({ monster: "form_giant_" + form, state, keys: list.map((r) => r.key).join(";"), sha256: list.map((r) => r.sha256.slice(0, 12)).join(";"), delays: list.map((r) => String(Number(r.duration_ms) / 1000)).join(";"),
      loop: list[0].loop === "true" ? "true" : "false", clip: "", impact: hit >= 0 ? String(hit) : "", ruids: "", canvas: list[0].width + "x" + list[0].height, pivot: list[0].pivot_x + "," + list[0].pivot_y });
  }
  return out;
}

// 지금 게임에 걸린 효과 연속본 장 수 ↔ 새 목표 (정보만 · 실패하지 않는다): B 새 자리(SkillEffects V2)가 있으면 그것, 없으면 옛 자리
function fxAudit() {
  const read = (file) => { try { return fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk", file), "utf8"); } catch (e) { return ""; } };
  const src = { GameConst: read("Common/GameConst.mlua"), SkillEffects: read("Skill/SkillEffects.mlua") };
  const prop = (file, name) => { const m = src[file].match(new RegExp("property string " + name + ' = "([^"]*)"')); return m ? m[1] : null; };
  const count = (v) => (v ? v.split("|").filter(Boolean).length : 0);
  return Object.entries(FX_RULES).map(([name, rule]) => {
    const slots = [...new Set(Object.values(FX_SLOTS[name]).map((x) => x[0]))].map((slot) => { const v = prop("SkillEffects", slot); return slot + " " + (v === null ? "자리 없음(B 병합 전)" : count(v) + "장"); });
    const n = count(prop(rule.legacy[0], rule.legacy[1]));
    return name + " 옛 " + rule.legacy.join(".") + " " + n + "장 · V2 자리 " + slots.join(" · ") + " → 목표 " + rangeText(rule);
  });
}

// 검증표 자체 테스트 (npm test): 구 납품 통과 · V2 새 범위 통과 · 위반 변이 검출 · 지금 monster_frames 통과
function selftest() {
  const fake = (k) => crypto.createHash("sha256").update(k).digest("hex");
  const row = (o) => Object.assign({ key: "", kind: "frame", form: "", state: "", frame: "", frame_index0: "", file: "", sha256: "", width: 128, height: 192, pivot_x: 0.5, pivot_y: 0.03125,
    filter: "Point", wrap: "Clamp", duration_ms: 100, loop: "false", hit: "false", animation_key: "", ruid: "" }, o);
  const seq = (kind, form, state, n, o = {}) => Array.from({ length: n }, (_, i) => {
    const key = (kind === "fx" ? "giant-fx-" : "giant-" + form + "-") + state + "-" + (o.layer ? o.layer + "-" : "") + String(i + 1).padStart(2, "0");
    return row({ key, kind, form, state, frame: i + 1, frame_index0: i, file: (o.file || "f") + "/" + key + ".png", sha256: fake((o.salt || "") + key),
      width: o.w || (kind === "fx" ? 256 : 128), height: o.h || (kind === "fx" ? 256 : 192), pivot_y: o.py !== undefined ? o.py : kind === "fx" ? 0.5 : 0.03125, layer: o.layer || "",
      duration_ms: o.msList ? o.msList[i] : o.ms !== undefined ? o.ms : 100, loop: o.loop ? "true" : "false", hit: i === (o.hitAt === undefined ? -1 : o.hitAt) || (o.hits || []).includes(i) ? "true" : "false" });
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
  expect("V2 회전 몸 17장", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 17, { loop: true, hitAt: 8, ms: 40 })]), "17장 — 허용");
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
  // 몸 짧은 칸(1/30초 미만)은 경고만 · 통과 (코덱스 정정) · 방패 함성 몸 8~12 밖 검출
  expect("몸 한 칸 0.04초 통과", checkAll([...base(), ...seq("frame", "shield", "skill2", 12, { hitAt: 6, ms: 40 })]), null);
  expectWarn("몸 한 칸 1/30초 미만은 경고·통과 (회전 16 × 0.025)", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 25 })]), "건너뛰어지거나");
  expectWarn("monster_frames 몸 칸 0.02초는 경고·통과", checkFrames(mfV2.map((r) => (r.monster === "form_giant_greatsword" && r.state === "skill2" ? Object.assign({}, r, { delays: r.delays.split(";").map((x, i) => (i === 3 ? "0.02" : x)).join(";") }) : r))), "건너뛰어지거나");
  expect("함성 별칭 roar → skill1 (대기표)", checkAll([...base(), ...seq("frame", "shield", "roar", 10, { ms: 80 })]), null);
  { const out = framesRows([...base(), ...seq("frame", "shield", "roar", 10, { ms: 80 })].map((r) => Object.assign({}, r, { ruid: r.sha256.slice(0, 32) })), "shield");
    results.push({ name: "함성 별칭은 monster_frames에 skill1로 씀", ok: out.some((l) => l.startsWith("form_giant_shield,skill1,")) && !out.some((l) => l.includes(",roar,")), detail: out.map((l) => l.slice(0, 40)).join(" | ") }); }
  expect("함성 skill1·roar 두 줄 = 중복", checkFrames([...mfV2, ...mfV2.filter((r) => r.monster === "form_giant_shield" && r.state === "skill1").map((r) => Object.assign({}, r, { state: "roar" }))]), "줄 중복");
  expect("방패 함성 몸 7장", checkAll([...base(), ...seq("frame", "shield", "skill1", 7, { ms: 80 })]), "7장 — 허용");
  expect("방패 함성 몸 13장", checkAll([...base(), ...seq("frame", "shield", "skill1", 13, { ms: 80 })]), "13장 — 허용");
  expect("방패 함성 몸 반복", checkAll([...base(), ...seq("frame", "shield", "skill1", 10, { loop: true, ms: 80 })]), "반복");
  expectWarn("회전 반복 한 바퀴 ≠ 타격 주기", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 8, ms: 34 })]), "타격 주기");
  expectWarn("구 납품 인접 중복은 경고만", checkAll(mutate(legacy(), (r) => r.key === "giant-shield-skill2-02", () => ({ sha256: fake("giant-shield-skill2-01") }))), "같은 그림 연속");
  expectWarn("효과 0.04초 미만 간격 (균열 16 × 0.025)", checkAll([...base(), ...seq("fx", "greatsword", "rift", 16, { hitAt: 2, ms: 25 })]), "durations");
  { const o = checkAll([...base(), ...seq("fx", "greatsword", "spin", 16, { loop: true, ms: 25 })]);
    results.push({ name: "회전 효과 16 × 0.025 반복은 cycle 규칙 → 바닥 경고 없음·통과", ok: o.errors.length === 0 && !o.warnings.some((w) => w.includes("< 0.04")), detail: o.errors.concat(o.warnings).join(" | ") }); }
  expectWarn("블렌드 이름", checkAll([...base(), ...seq("fx", "mage", "nova", 16, { hitAt: 3, ms: 50, file: "blend" })]), "블렌드");
  // B 새 자리 출력 (B 73fc0393): 노바 = FxGiantNova + FxGiantNovaOpts(impact = hitFrame+1 · ref 7.5 · 원본 px · 장마다 ms) · 층 front/rear · 회전 뒤/앞 · 내려찍기 앞
  const NOVA_MS = [20, 20, 25, 25, 35, 35, 25, 25, 40, 50, 80, 80, 90, 90, 90, 90];
  const nova = (o = {}) => seq("fx", "mage", "nova", 16, Object.assign({ hitAt: 6, msList: NOVA_MS, w: 640, h: 512, py: 0.375 }, o));
  expect("노바 16장 장마다 다른 시간(20~90ms · 합 0.82초)", checkAll([...base(), ...nova()]), null);
  { const fx = fxStrings([...base(), ...nova()]).find((x) => x.name === "nova" && x.layer === "");
    const want = "w=640;h=512;ref=7.5;impact=7;durations=" + NOVA_MS.join(",") + ";order=1";
    results.push({ name: "노바 출력 = FxGiantNova + FxGiantNovaOpts " + want, ok: !!fx && fx.slot === "SkillEffects.FxGiantNova" && fx.optsSlot === "SkillEffects.FxGiantNovaOpts" && fx.opts === want && fx.impact === 7 && fx.canvasTiles[0] === 11.429 && fx.canvasTiles[1] === 9.143, detail: fx ? fx.slot + " " + fx.opts + " " + fx.canvasTiles : "없음" }); }
  { const rows = [...base(), ...nova({ layer: "front" }), ...nova({ layer: "rear" })];
    const fx = fxStrings(rows);
    const front = fx.find((x) => x.name === "nova" && x.layer === "front"), rear = fx.find((x) => x.name === "nova" && x.layer === "rear");
    expect("노바 앞·뒤 층", checkAll(rows), null);
    results.push({ name: "노바 층 출력 (뒤 = FxGiantNova order 1 · 앞 = FxGiantNovaFront 제안 order 6)", ok: !!front && !!rear && rear.slot === "SkillEffects.FxGiantNova" && /order=1$/.test(rear.opts) && front.slot === "SkillEffects.FxGiantNovaFront" && /order=6$/.test(front.opts), detail: fx.map((x) => x.layer + ":" + x.slot + " " + x.opts).join(" | ") }); }
  expect("노바 층 시간 다름", checkAll([...base(), ...nova({ layer: "front" }), ...nova({ layer: "rear", msList: NOVA_MS.map((x, i) => (i === 3 ? 30 : x)) })]), "층 front·rear");
  expect("노바 층 타격 칸 다름", checkAll([...base(), ...nova({ layer: "front" }), ...nova({ layer: "rear", hitAt: 5 })]), "층 front·rear");
  expect("균열에 없는 층", checkAll([...base(), ...seq("fx", "greatsword", "rift", 16, { hitAt: 2, ms: 50, layer: "front" })]), "층 'front'");
  { const rows = [...base(), ...seq("fx", "greatsword", "spin", 16, { loop: true, ms: 50, layer: "back" }), ...seq("fx", "greatsword", "spin", 16, { loop: true, ms: 50, layer: "front" })];
    const fx = fxStrings(rows);
    expect("회전 뒤(back 별칭)·앞 층", checkAll(rows), null);
    results.push({ name: "회전 층 출력 FxGiantSpinBack(order 1)·FxGiantSpinFront(order 6)·FxGiantSpinOpts · 같은 간격이면 durations 없음", ok: fx.some((x) => x.slot === "SkillEffects.FxGiantSpinBack" && x.optsSlot === "SkillEffects.FxGiantSpinOpts" && x.opts === "w=256;h=256;ref=3.2;order=1") && fx.some((x) => x.slot === "SkillEffects.FxGiantSpinFront" && x.opts === "w=256;h=256;ref=3.2;order=6"), detail: fx.map((x) => x.slot + " " + x.opts).join(" | ") }); }
  { const fx = fxStrings([...base(), ...seq("fx", "shield", "slam", 12, { hitAt: 4, ms: 60, layer: "front" }), ...seq("fx", "shield", "slam", 12, { hitAt: 4, ms: 60, layer: "rear" }), ...seq("fx", "shield", "roar", 12, { ms: 70 }), ...seq("fx", "greatsword", "rift", 16, { hitAt: 2, ms: 50 })]);
    const want = { "slam:front": ["SkillEffects.FxGiantSlamFront", "SkillEffects.FxGiantSlamFrontOpts", "w=256;h=256;impact=5;order=6"], "slam:rear": ["SkillEffects.FxGiantSlamSeq", "SkillEffects.FxGiantSlamOpts", "w=256;h=256;impact=5;order=1"],
      "roar:": ["SkillEffects.FxGiantRoarSeq", "SkillEffects.FxGiantRoarOpts", "w=256;h=256;order=1"], "rift:": ["SkillEffects.FxGiantRiftSeq", "SkillEffects.FxGiantRiftOpts", "w=256;h=256;impact=3;order=1"] };
    const bad = Object.entries(want).filter(([k, [a, b, c]]) => !fx.some((x) => x.name + ":" + x.layer === k && x.slot === a && x.optsSlot === b && x.opts === c));
    results.push({ name: "내려찍기 앞·뒤 · 함성 · 균열 출력 자리", ok: bad.length === 0, detail: bad.map(([k]) => k).join(",") + " ← " + fx.map((x) => x.name + ":" + x.layer + " " + x.slot + " " + x.opts).join(" | ") }); }
  // 매니페스트 → 대기표 효과 줄 (intakeFx)
  { const man = { assets: [...NOVA_MS.map((ms, i) => ({ key: "fx-giant-nova-v2-" + String(i).padStart(2, "0"), file: "png/fx/" + i + ".png", role: "effect", frame_index0: i, size: [640, 512], pivot: [0.5, 0.375],
      proposed_time_ms: NOVA_MS.slice(0, i).reduce((a, b) => a + b, 0), proposed_duration_ms: ms, peak_time_ms: 160, world_diameter_tiles: 7.5, sha256: fake("nova" + i), layers: { front: "layers/front/" + i + ".png", rear: "layers/rear/" + i + ".png" } })),
      { key: "node-explosion-amplification", role: "node", file: "png/nodes/n.png", size: [96, 96], pivot: [0.5, 0.5], sha256: fake("node") }] };
    const shaMap = (abs) => { const m = abs.match(/png\/fx\/(\d+)\.png$/); return m ? fake("nova" + m[1]) : fake(abs); };
    const got = intakeFx(man, "/x/nova/full", "nova", { layers: true, readSha: shaMap });
    const main = got.rows.filter((r) => r.layer === "");
    const merged = [...base(), ...got.rows];
    const fx = fxStrings(merged).find((x) => x.name === "nova" && x.layer === "");
    results.push({ name: "매니페스트 인수: 16장 · 타격 칸 index 6(160ms) → impact 7 · 층 32 · 검사 통과", ok: got.errors.length === 0 && main.length === 16 && main[6].hit === "true" && got.rows.length === 48 && checkAll(merged).errors.length === 0 && fx && fx.impact === 7,
      detail: got.errors.join(" | ") + " " + checkAll(merged).errors.join(" | ") });
    const bad = intakeFx(man, "/x/nova/full", "nova", { readSha: (abs) => (abs.endsWith("/3.png") && abs.includes("png/fx") ? fake("other") : shaMap(abs)) });
    results.push({ name: "매니페스트 인수: 파일 sha 다름 검출", ok: bad.errors.some((e) => e.includes("sha256 매니페스트")), detail: bad.errors.join(" | ") });
    const noPeak = intakeFx({ assets: man.assets.map((a) => Object.assign({}, a, { peak_time_ms: 999 })) }, "/x", "nova", { readSha: shaMap });
    results.push({ name: "매니페스트 인수: 타격 칸 없음 검출", ok: noPeak.errors.some((e) => e.includes("타격 칸을 못 찾음")), detail: noPeak.errors.join(" | ") }); }
  // 실제 노바 납품(있으면): assets/codex-bone-giants-v1/spectacle-v2-20261030/nova/full/manifest.json — worktree에는 assets가 없어 메인 폴더를 찾아본다
  { const cands = [process.env.NOVA_MANIFEST, path.join(ROOT, "assets/codex-bone-giants-v1/spectacle-v2-20261030/nova/full/manifest.json"), path.join(ROOT, "../../../assets/codex-bone-giants-v1/spectacle-v2-20261030/nova/full/manifest.json")].filter(Boolean);
    const real = cands.find((p) => fs.existsSync(p));
    if (real) {
      const got = intakeFx(JSON.parse(fs.readFileSync(real, "utf8")), path.dirname(real), "nova", { layers: true });
      const merged = [...base(), ...got.rows];
      const fx = fxStrings(merged).find((x) => x.name === "nova" && x.layer === "");
      const ok = got.errors.length === 0 && checkAll(merged).errors.length === 0 && fx && fx.impact === 7 && fx.opts.startsWith("w=640;h=512;ref=7.5;impact=7;durations=");
      results.push({ name: "실제 노바 납품 매니페스트(sha 재측정 · 층 포함)", ok, detail: got.errors.concat(checkAll(merged).errors).join(" | ") + " " + (fx ? fx.opts : "") });
    } else results.push({ name: "실제 노바 납품 매니페스트 (없음 — 건너뜀)", ok: true, detail: "" });
  }
  // full133: V2 기술 몸 납품 캔버스(대검 384×224 · 발 38/224) 통과 · 구 납품 묶음은 192 규격 그대로 · 파생 층(새 프레임 아님)
  expect("V2 회전 몸 384×224 캔버스", checkAll([...base(), ...seq("frame", "greatsword", "skill1", 16, { loop: true, hitAt: 0, ms: 25, w: 384, h: 224, py: 38 / 224 })]), null);
  expect("V2 방패 내려찍기 몸 256×256 (20~60ms · 접점 index 6)", checkAll([...base(), ...seq("frame", "shield", "skill2", 12, { hitAt: 6, msList: [20, 20, 20, 20, 20, 20, 40, 40, 60, 60, 60, 60], w: 256, h: 256 })]), null);
  expect("구 납품 6장 몸이 192 아님", checkAll([...base(), ...seq("frame", "shield", "skill2", 6, { hitAt: 3, w: 256, h: 256 })]), "피벗·높이");
  expect("V2 몸 장마다 캔버스 다름", checkAll(mutate([...base(), ...seq("frame", "greatsword", "skill2", 16, { hitAt: 9, ms: 34, w: 384, h: 224, py: 38 / 224 })], (r) => r.key === "giant-greatsword-skill2-05", () => ({ height: 230 }))), "캔버스·피벗이 다름");
  { const SLAM = [40, 40, 40, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
    const main = seq("fx", "shield", "slam", 16, { hitAt: 3, msList: SLAM, w: 384, h: 288, py: 0.104 });
    const star = (o = {}) => Array.from({ length: 8 }, (_, i) => Object.assign(row({ key: "giant-fx-slam-front-" + String(i + 1).padStart(2, "0"), kind: "fx", form: "shield", state: "slam", frame: i + 1, frame_index0: i, sha256: fake("star" + i),
      width: 65, height: 65, pivot_y: 0.5, duration_ms: SLAM[i], layer: "front", derived: "true", source_index0: i }), o.fn ? o.fn(i) : {}));
    expect("내려찍기 파생 앞 별 8장 (원본 16 중 0~7 · 새 프레임 아님)", checkAll([...base(), ...main, ...star()]), null);
    expect("파생 층 시간 ≠ 원본", checkAll([...base(), ...main, ...star({ fn: (i) => (i === 2 ? { duration_ms: 50 } : {}) })]), "층은 원본과 같은 시각");
    expect("파생 층 원본 칸 범위 밖", checkAll([...base(), ...main, ...star({ fn: (i) => (i === 7 ? { source_index0: 16 } : {}) })]), "source_index0");
    const fx = fxStrings([...base(), ...main, ...star()]);
    results.push({ name: "내려찍기 출력 = FxGiantSlamSeq(impact 4 · 장마다 ms · order 1) + FxGiantSlamFront(앞 별 8 · order 6)", ok: fx.some((x) => x.slot === "SkillEffects.FxGiantSlamSeq" && x.opts === "w=384;h=288;impact=4;durations=" + SLAM.join(",") + ";order=1") && fx.some((x) => x.slot === "SkillEffects.FxGiantSlamFront" && x.n === 8 && /order=6$/.test(x.opts)), detail: fx.map((x) => x.slot + " " + x.opts).join(" | ") }); }
  // 실제 full133 납품(있으면): 대검 64 · 방패 52 → 대기표 줄 → 검사 통과 · 기대 값
  { const art = [process.env.ART_V2_DIR, "/Users/leeinguk/Documents/New project/art-summon48-spectacle-v2-20261030"].filter(Boolean).find((p) => fs.existsSync(path.join(p, "greatsword/full/manifest.json")) && fs.existsSync(path.join(p, "shield/full/manifest.json")));
    if (art) {
      const g = intakeGreatsword(path.join(art, "greatsword/full")), h = intakeShield(path.join(art, "shield/full"));
      const rows = [...base(), ...g.rows, ...h.rows];
      const o = checkAll(rows);
      const fd = framesDraft(rows);
      const pick = (f, st) => fd.find((x) => x.monster === "form_giant_" + f && x.state === st) || {};
      const sum = (x) => (x.delays || "").split(";").reduce((a, b) => a + Number(b), 0);
      const want = [
        ["대검 회전 몸 16 × 25ms 반복 impact 0", pick("greatsword", "skill1").keys.split(";").length === 16 && Math.abs(sum(pick("greatsword", "skill1")) - 0.4) < 1e-6 && pick("greatsword", "skill1").loop === "true" && pick("greatsword", "skill1").impact === "0"],
        ["대검 균열 몸 16 합 550ms impact 9", pick("greatsword", "skill2").keys.split(";").length === 16 && Math.abs(sum(pick("greatsword", "skill2")) - 0.55) < 1e-6 && pick("greatsword", "skill2").impact === "9"],
        ["방패 내려찍기 몸 12 impact 6", pick("shield", "skill2").keys.split(";").length === 12 && pick("shield", "skill2").impact === "6"],
        ["방패 함성 몸 12 × 50ms impact 없음", pick("shield", "skill1").keys.split(";").length === 12 && Math.abs(sum(pick("shield", "skill1")) - 0.6) < 1e-6 && pick("shield", "skill1").impact === ""],
      ];
      const fx = fxStrings(rows);
      want.push(["효과 회전 16 반복 + 파생 뒤·앞 → FxGiantSpinBack·Front · ref 3.2", fx.some((x) => x.slot === "SkillEffects.FxGiantSpinFront" && x.layer === "" && /ref=3.2/.test(x.opts)) && fx.some((x) => x.slot === "SkillEffects.FxGiantSpinBack" && x.n === 16)]);
      want.push(["효과 균열 16 → FxGiantRiftSeq impact 1", fx.some((x) => x.slot === "SkillEffects.FxGiantRiftSeq" && x.n === 16 && /impact=1;/.test(x.opts))]);
      want.push(["효과 내려찍기 16 impact 4 · 함성 12", fx.some((x) => x.slot === "SkillEffects.FxGiantSlamSeq" && x.n === 16 && /impact=4;/.test(x.opts)) && fx.some((x) => x.slot === "SkillEffects.FxGiantRoarSeq" && x.n === 12)]);
      results.push({ name: "실제 대검 64·방패 52 납품 → 대기표 줄 검사 통과 (sha 재측정)", ok: g.errors.length + h.errors.length + o.errors.length === 0, detail: [...g.errors, ...h.errors, ...o.errors].slice(0, 6).join(" | ") });
      for (const [n, ok] of want) results.push({ name: "실제 납품: " + n, ok, detail: JSON.stringify(fd.map((x) => [x.state, x.impact, x.loop])) + " " + fx.map((x) => x.slot + " " + x.opts.slice(0, 40)).join(" | ") });
    } else results.push({ name: "실제 대검·방패 납품 (없음 — 건너뜀)", ok: true, detail: "" });
  }
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
    const rows = opt("--pending") ? parse(fs.readFileSync(path.resolve(opt("--pending")), "utf8")) : load();
    const out = checkAll(rows);
    rest.forEach((a, i) => {
      if (a !== "--manifest") return;
      const x = crossManifest(rows, JSON.parse(fs.readFileSync(path.resolve(rest[i + 1]), "utf8")));
      out.errors.push(...x.errors); out.warnings.push(...x.warnings); out.summary.push(...x.summary);
    });
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
  else if (cmd === "intake-art") {
    // full133 납품 → 대기표 초안·monster_frames 초안·효과 자리 초안 (기본 보기만 · --out 폴더에 쓴다 · 대기표 자체는 --write일 때만)
    //   intake-art --nova 「nova/full/manifest.json」 --greatsword 「greatsword/full」 --shield 「shield/full」 [--out 폴더] [--write]
    const parts = [];
    let rows = load();
    if (opt("--nova")) { const p = path.resolve(opt("--nova")); const g = intakeFx(JSON.parse(fs.readFileSync(p, "utf8")), path.dirname(p), "nova", { layers: true }); parts.push(g); rows = rows.filter((r) => !(r.kind === "fx" && r.state === "nova")).concat(g.rows); }
    if (opt("--greatsword")) { const g = intakeGreatsword(path.resolve(opt("--greatsword"))); parts.push(g); rows = rows.filter((r) => !(r.form === "greatsword" && (r.kind === "fx" || (r.kind === "frame" && !STATES.some(([st]) => st === r.state))))).concat(g.rows); }
    if (opt("--shield")) { const g = intakeShield(path.resolve(opt("--shield"))); parts.push(g); rows = rows.filter((r) => !(r.form === "shield" && (r.kind === "fx" || (r.kind === "frame" && !STATES.some(([st]) => st === r.state))))).concat(g.rows); }
    const out = checkAll(rows);
    for (const g of parts) { out.errors.unshift(...g.errors); out.warnings.unshift(...g.warnings); out.summary.unshift(...g.summary); }
    // 같은 줄을 RUID 대신 sha 앞 32자리로 채워 monster_frames 검사 (기본 줄 + 새 기술 몸)
    const fake = rows.map((r) => Object.assign({}, r, { ruid: isRuid(r.ruid) ? r.ruid : r.sha256.slice(0, 32) }));
    const mfNow = parse(fs.readFileSync(path.join(ROOT, "data/monster_frames.csv"), "utf8"));
    const touched = new Set(fake.filter((r) => r.kind === "frame" && !STATES.some(([st]) => st === r.state)).map((r) => "form_giant_" + r.form + "|" + r.state));
    const mfNew = [...mfNow.filter((r) => !touched.has(r.monster + "|" + r.state)), ...FORMS.flatMap((f) => framesRows(fake, f).map((l) => l.split(",")).filter((c) => touched.has(c[0] + "|" + c[1])).map((c) => ({ monster: c[0], state: c[1], frames: c[2], delays: c[3], loop: c[4], clip: c[5], impact: c[6] })))];
    const fr = checkFrames(mfNew);
    out.errors.push(...fr.errors); out.warnings.push(...fr.warnings); out.summary.push(...fr.summary.filter((l) => /skill[12]/.test(l)));
    const slots = fxStrings(rows);
    for (const l of out.summary) console.log("  " + l);
    for (const fx of slots) console.log("  효과 " + fx.name + (fx.layer ? "(" + fx.layer + ")" : "") + " → " + fx.slot + " " + fx.n + "장 · " + fx.optsSlot + " = " + fx.opts + (fx.note ? " · " + fx.note : ""));
    if (opt("--out") && out.errors.length === 0) {
      const dir = path.resolve(opt("--out"));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "pending-draft.csv"), toCsv(HEAD, rows));
      const fd = framesDraft(rows);
      fs.writeFileSync(path.join(dir, "monster_frames-draft.csv"), toCsv(["monster", "state", "keys", "sha256", "delays", "loop", "clip", "impact", "ruids", "canvas", "pivot"], fd));
      const meta = Object.assign({}, ...parts.map((g) => g.meta));
      fs.writeFileSync(path.join(dir, "fx-slots-draft.json"), JSON.stringify({ note: "RUID 비움 — 업로드 뒤 부모가 「|」로 이어 slot에 · optsSlot 문자열은 B 73fc0393 계약(w·h px · ref · impact=hitFrame+1 · durations=장마다 ms(「,」 · 제안 키) · order) · 기존 span·ax·ay·dy·face·flip은 부모가 이미지 메타데이터(meta)로 합침",
        slots: slots.map((x) => ({ name: x.name, layer: x.layer || "(한 층)", slot: x.slot, optsSlot: x.optsSlot, opts: x.opts, n: x.n, impact: x.impact, durationsMs: x.durationsMs, size: x.size, pivot: x.pivot, canvasTiles: x.canvasTiles, note: x.note, keys: rows.filter((r) => r.kind === "fx" && r.state === x.name && layerOf(r) === x.layer).sort((a, b) => a.frame_index0 - b.frame_index0).map((r) => r.key) })),
        meta, warnings: out.warnings }, null, 1) + LF);
      console.log("  초안을 썼다: " + dir + " (pending-draft.csv · monster_frames-draft.csv · fx-slots-draft.json)");
    }
    if (rest.includes("--write") && out.errors.length === 0) fs.writeFileSync(PENDING, toCsv(HEAD, rows));
    report("[register_giant_visuals] intake-art 줄 " + rows.length + " · 문제 0 · 경고 " + out.warnings.length + (rest.includes("--write") ? " · 대기표에 씀" : ""), out, rest.includes("--strict"));
  }
  else if (cmd === "intake-fx") {
    // 아트 매니페스트 → 대기표 효과 줄 (기본은 보기만 · --write면 대기표에 씀 · --layers면 front/rear 층 줄도)
    const man = rest[0];
    const name = opt("--fx") || "nova";
    if (!man || man.startsWith("--")) { console.log("사용: intake-fx 「manifest.json」 [--fx nova] [--layers] [--write]"); process.exit(2); }
    const abs = path.resolve(man);
    const got = intakeFx(JSON.parse(fs.readFileSync(abs, "utf8")), path.dirname(abs), name, { layers: rest.includes("--layers") });
    const merged = [...load().filter((r) => !(r.kind === "fx" && r.state === name)), ...got.rows];
    const out = checkAll(merged);
    out.errors.unshift(...got.errors); out.warnings.unshift(...got.warnings);
    for (const l of [...got.summary, ...out.summary.filter((x) => x.includes(name))]) console.log("  " + l);
    for (const fx of fxStrings(merged).filter((x) => x.name === name)) console.log("  " + (fx.layer || "한 층") + ": " + fx.slot + " (" + fx.n + "장) · " + fx.optsSlot + " = " + fx.opts + (fx.note ? " · " + fx.note : ""));
    if (rest.includes("--write") && out.errors.length === 0) fs.writeFileSync(PENDING, toCsv(HEAD, merged));
    report("[register_giant_visuals] intake-fx " + name + " " + got.rows.length + "줄 · 문제 0 · 경고 " + out.warnings.length + (rest.includes("--write") ? " · 대기표에 씀" : " · 보기만 (--write로 씀)"), out, rest.includes("--strict"));
  }
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
  else { console.log("사용: plan --assets 폴더 | check [--manifest json] [--strict] | check-frames | fx-audit | intake-fx manifest [--fx nova] [--layers] [--write] | selftest | apply 업로드팩 [--dry] [--allow-partial]"); process.exit(2); }
}
module.exports = { check, checkAll, checkFrames, crossManifest, framesRows, framesDraft, fxStrings, intakeFx, intakeGreatsword, intakeShield, FX_SLOTS, FX_REF, parse, STATES, EXTRA_STATES, BODY_RULES, FX_RULES, FORMS, load };
