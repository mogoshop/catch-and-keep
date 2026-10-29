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
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const PENDING = path.join(ROOT, "data/pending/giant-visuals-registration.csv");
const EVID = path.join(ROOT, "docs/evidence/2026-10-30-goal-E");
const PACK = path.join(EVID, "upload-pack");
const FORMS = ["shield", "greatsword", "twin", "basic", "mage"];
// 거인 동작 순서와 장 수 (코덱스 납품 DELIVERY: stand4/move6/attack6/skill6/hit2/split6) — UndeadSystem.GiantStateOrder와 같은 순서
const STATES = [["stand", 4], ["move", 6], ["attack", 6], ["skill", 6], ["hit", 2], ["split", 6]];
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
      const t = tByFile[m.file], p = props[m.key];
      if (!t || !p) throw new Error(m.key + ": 타이밍·속성 줄 없음");
      const sha = sha256(path.join(assets, m.file));
      if (sha !== m.sha256) throw new Error(m.key + ": sha256 불일치");
      rows.push({ key: m.key, kind: "frame", form, state: m.state, frame: m.frame, frame_index0: t.index, file: m.file, sha256: sha, width: m.size[0], height: m.size[1],
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
    rows.map((r) => ({ key: r.key, upload_name: r.key, file: rel + "/" + r.file, RUID: r.ruid, category: r.kind === "frame" ? "monster-frame" : "ui", group: "OJYYQ", status: r.ruid ? "uploaded" : "ready" }))));
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

// 대기표 검사: 종류마다 6동작·장 수·칸 번호 0..n-1·타이밍(서기·걷기 반복, 공격·기술 타격 칸 하나)·192 발 피벗 · HUD 5 · RUID 칸은 비거나 32자리
function check(rows) {
  const bad = [];
  const frames = rows.filter((r) => r.kind === "frame"), icons = rows.filter((r) => r.kind === "ui_icon");
  if (frames.length !== FORMS.length * 30) bad.push("몸 프레임 " + frames.length + " ≠ 150");
  if (icons.length !== FORMS.length) bad.push("HUD 아이콘 " + icons.length + " ≠ 5");
  const keys = new Set();
  for (const r of rows) {
    if (keys.has(r.key)) bad.push("키 중복 " + r.key);
    keys.add(r.key);
    if (r.ruid !== "" && !isRuid(r.ruid)) bad.push(r.key + " RUID 형식 " + r.ruid);
    if (!isSha(r.sha256)) bad.push(r.key + " sha256 형식");
    if (r.filter !== "Point" || r.wrap !== "Clamp") bad.push(r.key + " filter/wrap " + r.filter + "/" + r.wrap);
  }
  for (const form of FORMS) {
    for (const [state, n] of STATES) {
      const list = frames.filter((r) => r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
      if (list.length !== n) { bad.push(form + " " + state + " " + list.length + "장 ≠ " + n); continue; }
      list.forEach((r, i) => {
        if (Number(r.frame_index0) !== i || r.key !== "giant-" + form + "-" + state + "-" + String(i + 1).padStart(2, "0")) bad.push(r.key + " 칸 번호/키");
        if (Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.03125 || Number(r.height) !== 192) bad.push(r.key + " 피벗·높이");
        if (!(Number(r.duration_ms) > 0)) bad.push(r.key + " 시간");
        if ((r.loop === "true") !== (state === "stand" || state === "move")) bad.push(r.key + " 반복");
      });
      const hits = list.filter((r) => r.hit === "true").length;
      if (hits !== ((state === "attack" || state === "skill") ? 1 : 0)) bad.push(form + " " + state + " 타격 칸 " + hits);
    }
  }
  for (const r of icons) if (!FORMS.includes(r.form) || Number(r.width) !== 48 || Number(r.pivot_x) !== 0.5 || Number(r.pivot_y) !== 0.5) bad.push(r.key + " HUD 규격");
  return bad;
}

// 대기표 → monster_frames 줄: form_giant_(종류) 6동작 (RUID ; · 시간 초 ; · 반복 · 클립 없음 · 공격·기술은 타격 칸 0부터)
function framesRows(rows, form) {
  return STATES.map(([state]) => {
    const list = rows.filter((r) => r.kind === "frame" && r.form === form && r.state === state).sort((a, b) => a.frame_index0 - b.frame_index0);
    const hit = list.findIndex((r) => r.hit === "true");
    return ["form_giant_" + form, state, list.map((r) => r.ruid).join(";"), list.map((r) => String(Number(r.duration_ms) / 1000)).join(";"), list[0].loop === "true" ? "true" : "false", "", hit >= 0 ? String(hit) : ""].join(",");
  });
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
  const icons = rows.filter((r) => r.kind === "ui_icon" && isRuid(r.ruid) && ready.includes(r.form));
  const uiFile = path.join(ROOT, "data/ui_icons.csv");
  const ui = fs.readFileSync(uiFile, "utf8").split(LF).filter((l) => l !== "");
  const uiKeep = ui.filter((l) => !icons.some((r) => l.startsWith(r.key + ",")));
  const uiAdd = icons.map((r) => [r.key, r.ruid, "#FFFFFF", "1", quote("거인 HUD 아이콘 48px (코덱스 J7-HUD5 · 0120 채택 · sha256 " + r.sha256.slice(0, 8) + "… · 갈래 E 등록)")].join(","));
  console.log("쓸 것: monster_frames " + add.length + "줄 (" + (ready.join(",") || "-") + ") · ui_icons " + uiAdd.length + "줄");
  if (argv.includes("--dry")) { for (const l of [...add, ...uiAdd]) console.log("  " + l.slice(0, 160)); return; }
  fs.writeFileSync(mfFile, [...keep, ...add].join(LF) + LF);
  fs.writeFileSync(uiFile, [...uiKeep, ...uiAdd].join(LF) + LF);
  fs.writeFileSync(PENDING, toCsv(HEAD, rows));
  console.log("다음: node tools/gen_data.cjs · npm test · 메이커 refresh");
}

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  if (cmd === "plan") plan(opt("--assets"));
  else if (cmd === "check") {
    const rows = load();
    const bad = check(rows);
    if (bad.length) { console.log(bad.join(LF)); process.exit(1); }
    console.log("[register_giant_visuals] 대기표 " + rows.length + "줄 · 몸 150 · HUD 5 · RUID 채움 " + rows.filter((r) => isRuid(r.ruid)).length + " · 문제 0");
  }
  else if (cmd === "apply") apply(rest[0] && !rest[0].startsWith("--") ? rest[0] : null, rest);
  else if (cmd === "preview-rows") {
    // 오프라인 회귀용 (tests/quality/giant_visuals.lua): RUID 자리에 그림 sha256 앞 32자리를 넣은 가짜 등록으로 apply가 쓸 monster_frames 줄을 보인다 (파일은 쓰지 않는다)
    const rows = load().map((r) => Object.assign({}, r, { ruid: r.sha256.slice(0, 32) }));
    for (const f of FORMS) for (const l of framesRows(rows, f)) console.log(l);
  }
  else { console.log("사용: plan --assets 폴더 | check | apply 업로드팩 [--dry] [--allow-partial]"); process.exit(2); }
}
module.exports = { check, framesRows, parse, STATES, FORMS, load };
