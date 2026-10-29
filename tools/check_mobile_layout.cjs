#!/usr/bin/env node
// 모바일 HUD 배치 검사 (docs/ui/mobile-layout.md, 10-13): 화면 비율 몇 가지에서 모바일 HUD 요소가 화면 밖으로 나가거나 서로 겹치지 않는가.
//   · 빌드 값은 ui/*.ui에서(UIBuilder로 읽음), 모바일에서 실행 중에 바꾸는 값은 MobileLayout·HudMap·CompanionHUD·NpcWindow 코드에서 읽는다
//   · 메이커 모바일 미리보기는 다시 불러온 UI 그룹을 1080 높이로 배치해서(10-13 확인) 실제 기기 배치를 잴 수 없다 → 같은 계산을 여기서 한다
//   · 노치·홈 표시줄 여백은 엔진이 UI 전체에 준다. 아이폰 가로는 그 안쪽(약 2014×1025)으로 잰다
// 사용: node tools/check_mobile_layout.cjs [-v] [--svg 파일]   (--svg: 아이폰 가로 배치를 그림으로 — docs/ui/mobile-layout-iphone.svg)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const { UIBuilder } = require(path.join(ROOT, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// 화면 비율: 16:9 휴대폰, 아이폰 가로 안전영역, 태블릿 4:3, 20:9 노치 없는 휴대폰
const CANVASES = [["16:9", 1920, 1080], ["아이폰 가로(안전영역)", 2014, 1025], ["태블릿 4:3", 1920, 1440], ["20:9", 2400, 1080]];
// AlignmentOption → 부모 안의 고정 앵커 점
const ANCHOR = { 0: [0.5, 0.5], 1: [0, 0.5], 2: [1, 0.5], 3: [0.5, 1], 4: [0, 1], 5: [1, 1], 6: [0.5, 0], 7: [0, 0], 8: [1, 0] };
const NAMED = { top: 3, topL: 4, topR: 5, bottom: 6, TopCenter: 3, TopLeft: 4, TopRight: 5, BottomCenter: 6, BottomLeft: 7, BottomRight: 8 };
// 같은 자리를 차례로 쓰는 것 (동시에 뜨지 않는다 — docs/ui/message-rules.md, UXFeedback.IsShowing)
const TURNS = [["GameHUD/Banner", "GameHUD/Tip"], ["GameHUD/GatePrompt", "RewardHUD/Toast"]];
// 겹쳐도 되는 것 (없음 — 10-13: 안내 줄이 펼친 지도를 덮던 것을 지도 아래로 옮겼다)
const ACCEPTED = [];

const items = new Map();   // 이름 → { al, pivot, pos, size, scale }
const problems = [];

function fromUi(group, rel) {
  const b = UIBuilder.read(path.join(ROOT, "ui", group + ".ui"));
  const t = b.getComponent(rel, "MOD.Core.UITransformComponent");
  if (!t) throw new Error(`${group}/${rel} 없음`);
  return { al: t.AlignmentOption, pivot: [t.Pivot.x, t.Pivot.y], pos: [t.anchoredPosition.x, t.anchoredPosition.y], size: [t.RectSize.x, t.RectSize.y], scale: 1 };
}
function add(name, group, rel) { items.set(name, fromUi(group, rel)); }
function need(re, text, what) {
  const m = text.match(re);
  if (!m) throw new Error(`${what}: 모바일 값을 찾지 못함 (코드가 바뀌었으면 이 검사도 고친다)`);
  return m;
}

const quiet = console.log;
console.log = () => {};
try {
  // 빌드 값 (모바일 전용·공용)
  add("GameHUD/MFrame", "GameHUD", "MFrame");
  add("GameHUD/XP", "GameHUD", "XP");
  for (const n of ["Buffs", "Party", "Target", "Banner", "Tip", "GatePrompt", "BtnMenu", "OfferBand"]) add("GameHUD/" + n, "GameHUD", n);
  add("RewardHUD/Feed", "RewardHUD", "Feed");
  add("RewardHUD/Toast", "RewardHUD", "Toast");
  add("ChatHUD/Chat", "ChatHUD", "Chat");
  for (const n of ["Stick", "Attack", "Extract", "BtnSkillEdit", "Shadow/Toggle", "Shadow/Cmds/Summon", "Shadow/Cmds/Recall", "Shadow/Cmds/Rally"]) add("MobilePad/" + n, "ShadowHUD", "MobilePad/" + n);
  for (let i = 1; i <= 4; i++) { add(`MobilePad/Skills/S${i}`, "ShadowHUD", `MobilePad/Skills/S${i}`); add(`MobilePad/Potions/Belt${i}`, "ShadowHUD", `MobilePad/Potions/Belt${i}`); }
  add("NavigationHUD/SafeArea/MiniMap", "NavigationHUD", "SafeArea/MiniMap");
  add("NavigationHUD/SafeArea/QuestTrack", "NavigationHUD", "SafeArea/QuestTrack");
  add("JournalHUD/SafeArea/BtnOpen", "JournalHUD", "SafeArea/BtnOpen");
  add("CompanionHUD/SafeArea/Strip", "CompanionHUD", "SafeArea/Strip");
  add("InteractionHUD/SafeArea/Talk", "InteractionHUD", "SafeArea/Talk");
} finally {
  console.log = quiet;
}

// MobileLayout.Apply: Place(path, 정렬, 피벗, 위치) · Size(path, 크기)
const ml = read("RootDesk/MyDesk/UI/Hud/MobileLayout.mlua");
for (const m of ml.matchAll(/self:Place\("\/ui\/([^"]+)",\s*(?:AlignmentType\.)?(\w+),\s*Vector2\(([-\d.]+),\s*([-\d.]+)\),\s*Vector2\(([-\d.]+),\s*([-\d.]+)\)\)/g)) {
  const it = items.get(m[1]);
  if (!it) { problems.push(`MobileLayout이 옮기는 ${m[1]}을 이 검사가 모른다 — 목록에 넣는다`); continue; }
  if (NAMED[m[2]] === undefined) { problems.push(`MobileLayout 정렬 ${m[2]}을 모른다`); continue; }
  Object.assign(it, { al: NAMED[m[2]], pivot: [+m[3], +m[4]], pos: [+m[5], +m[6]] });
}
for (const m of ml.matchAll(/self:Size\("\/ui\/([^"]+)",\s*Vector2\(([-\d.]+),\s*([-\d.]+)\)\)/g)) {
  const it = items.get(m[1]);
  if (it) it.size = [+m[2], +m[3]];
}
// HudMap.RenderLayout 모바일: 지도(펼친 상태 344×488, 0.8배) · 의뢰 추적 · 일지 단추
const hm = read("RootDesk/MyDesk/UI/Hud/HudMap.mlua");
const map = items.get("NavigationHUD/SafeArea/MiniMap");
const mp = need(/mobile and Vector2\(([-\d]+), ([-\d]+)\) or Vector2\(-24, -150\)/, hm, "HudMap 지도 위치");
const mh = +need(/self\.Expanded and \(mobile and (\d+) or 488\)/, hm, "HudMap 모바일 펼친 지도 높이")[1];
Object.assign(map, { al: 5, pivot: [1, 1], pos: [+mp[1], +mp[2]], size: [344, mh], scale: +need(/local k = mobile and ([\d.]+) or 1/, hm, "HudMap 지도 배율")[1] });
const qt = need(/t\.anchoredPosition = mobile and Vector2\(([-\d]+), ([-\d]+)\) or Vector2\(-24, self\.Expanded/, hm, "HudMap 의뢰 추적 위치");
Object.assign(items.get("NavigationHUD/SafeArea/QuestTrack"), { al: 4, pivot: [0, 1], pos: [+qt[1], +qt[2]] });
const jo = need(/journal[\s\S]{0,400}?AlignmentType\.(\w+)[\s\S]{0,120}?Pivot = Vector2\(([\d.]+), ([\d.]+)\)[\s\S]{0,120}?anchoredPosition = Vector2\(([-\d]+), ([-\d]+)\)/, hm, "HudMap 일지 단추");
Object.assign(items.get("JournalHUD/SafeArea/BtnOpen"), { al: NAMED[jo[1]], pivot: [+jo[2], +jo[3]], pos: [+jo[4], +jo[5]] });
// CompanionHUD 모바일: 가운데 아래, 4칸이 다 찼을 때 폭 432
const cm = need(/AlignmentType\.BottomCenter[\s\S]{0,120}?anchoredPosition = Vector2\(([-\d]+), ([-\d]+)\)/, read("RootDesk/MyDesk/UI/Hud/CompanionHUD.mlua"), "CompanionHUD 모바일 위치");
Object.assign(items.get("CompanionHUD/SafeArea/Strip"), { al: 6, pivot: [0.5, 0], pos: [+cm[1], +cm[2]], size: [4 * 112 - 16, 112] });
// NpcWindow: 대화 단추 높이 (모바일)
const tk = need(/IsMobilePlatform\(\) and (\d+) or \d+\) end/, read("RootDesk/MyDesk/UI/Windows/NpcWindow.mlua"), "NpcWindow 대화 단추");
items.get("InteractionHUD/SafeArea/Talk").pos[1] = +tk[1];

function rect(it, W, H) {
  const [ax, ay] = ANCHOR[it.al] || [0.5, 0.5];
  const w = it.size[0] * it.scale, h = it.size[1] * it.scale;
  const px = ax * W + it.pos[0], py = ay * H + it.pos[1];   // 피벗 점 (화면 왼쪽 아래 기준)
  return [px - it.pivot[0] * w, px + (1 - it.pivot[0]) * w, py - it.pivot[1] * h, py + (1 - it.pivot[1]) * h];
}
const pairIn = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const verbose = process.argv.includes("-v");
const names = [...items.keys()];
for (const [label, W, H] of CANVASES) {
  const R = names.map((n) => [n, rect(items.get(n), W, H)]);
  for (const [n, [x0, x1, y0, y1]] of R) {
    if (x0 < -0.5 || y0 < -0.5 || x1 > W + 0.5 || y1 > H + 0.5) problems.push(`${label}: ${n} 화면 밖 (${x0.toFixed(0)}..${x1.toFixed(0)}, ${y0.toFixed(0)}..${y1.toFixed(0)})`);
  }
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const [a, ra] = R[i], [b, rb] = R[j];
    if (pairIn(TURNS, a, b) || pairIn(ACCEPTED, a, b)) continue;
    // 스킬 칸은 둥근 단추라 네모 칸 모서리끼리만 닿는 것은 겹침이 아니다 (중심 거리 ≥ 지름이면 통과)
    if (a.includes("/Skills/S") && b.includes("/Skills/S")) {
      const d = Math.hypot((ra[0] + ra[1] - rb[0] - rb[1]) / 2, (ra[2] + ra[3] - rb[2] - rb[3]) / 2);
      if (d >= ra[1] - ra[0]) continue;
    }
    const ox = Math.min(ra[1], rb[1]) - Math.max(ra[0], rb[0]);
    const oy = Math.min(ra[3], rb[3]) - Math.max(ra[2], rb[2]);
    if (ox > 0.5 && oy > 0.5) problems.push(`${label}: ${a} × ${b} 겹침 ${ox.toFixed(0)}×${oy.toFixed(0)}`);
  }
  if (verbose) {
    console.log(`== ${label} ${W}×${H}`);
    for (const [n, [x0, x1, y0, y1]] of R) console.log(`  ${n.padEnd(36)} x ${x0.toFixed(0).padStart(5)}..${x1.toFixed(0).padStart(5)}  y ${y0.toFixed(0).padStart(5)}..${y1.toFixed(0).padStart(5)}`);
  }
}

const svgAt = process.argv.indexOf("--svg");
if (svgAt > 0) {
  // 아이폰 가로 안전영역 배치 그림 (y는 위가 0이 되게 뒤집는다)
  const [, W, H] = CANVASES[1];
  const color = (n) => n.startsWith("MobilePad") ? "#7A4FB8" : n.includes("Feed") || n.includes("Toast") || n.includes("Chat") ? "#2F7F6F" : n.includes("Banner") || n.includes("Tip") || n.includes("Gate") || n.includes("Target") ? "#B07A2A" : "#3E6FA8";
  const label = (n) => n.split("/").pop();
  const body = names.map((n) => {
    const [x0, x1, y0, y1] = rect(items.get(n), W, H);
    const round = n.includes("/Skills/S") || n.endsWith("/Attack") ? ` rx="${(x1 - x0) / 2}"` : "";
    return `<rect x="${x0.toFixed(0)}" y="${(H - y1).toFixed(0)}" width="${(x1 - x0).toFixed(0)}" height="${(y1 - y0).toFixed(0)}"${round} fill="${color(n)}" fill-opacity="0.35" stroke="${color(n)}" stroke-width="3"/>`
      + `<text x="${((x0 + x1) / 2).toFixed(0)}" y="${(H - (y0 + y1) / 2 + 9).toFixed(0)}" font-size="${Math.min(26, Math.max(15, (x1 - x0) / 6)).toFixed(0)}" text-anchor="middle" fill="#F2EEE6">${label(n)}</text>`;
  }).join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="sans-serif">\n<rect width="${W}" height="${H}" fill="#1B1A1F"/>\n`
    + `<circle cx="${W / 2}" cy="${H * 0.55}" r="60" fill="#888" fill-opacity="0.5"/><text x="${W / 2}" y="${H * 0.55 + 8}" font-size="24" text-anchor="middle" fill="#fff">캐릭터</text>\n${body}\n</svg>\n`;
  fs.writeFileSync(path.resolve(process.argv[svgAt + 1]), svg);
}

// ── 좁은 화면 넓은 창 5개 (10-29 기획서 45 결정 4-A · RootDesk/MyDesk/UI/Hud/WindowFit.mlua) ──
//   4:3 태블릿 보이는 칸 1440×1080 안에 창 바깥(테두리 포함)이 가장자리 16을 띄우고 들어가는지,
//   창 바로 아래 조각(그림자 보관함은 상세 판 안까지)이 바뀐 창 크기 안에 있는지, WindowFit이 옮긴 조각끼리 겹치지 않는지 잰다.
const { NARROW, FRAME } = require("./build/ui-tokens.cjs");
const wf = read("RootDesk/MyDesk/UI/Hud/WindowFit.mlua");
const wfProp = (name) => Number((wf.match(new RegExp("property\\s+\\w+\\s+" + name + "\\s*=\\s*([0-9.]+)")) || [])[1]);
for (const [name, js] of [["BodyMaxW", NARROW.bodyMaxW], ["BodyMaxH", NARROW.bodyMaxH], ["Edge", NARROW.edge], ["RimOut", FRAME.rimOut], ["VisibleH", NARROW.visibleH]]) {
  if (wfProp(name) !== js) problems.push(`WindowFit.${name} = ${wfProp(name)} · ui-tokens = ${js} (한쪽만 바꾸지 않는다)`);
}
const fit = new Map();   // 경로 → { pos?, size? }
const num = "([-\\d.]+)";
for (const m of wf.matchAll(new RegExp(`self:Box\\("([^"]+)",\\s*${num},\\s*${num},\\s*${num},\\s*${num}\\)`, "g"))) fit.set(m[1], { ...(fit.get(m[1]) || {}), pos: [+m[2], +m[3]], size: [+m[4], +m[5]] });
for (const m of wf.matchAll(new RegExp(`self:Pos\\("([^"]+)",\\s*${num},\\s*${num}\\)`, "g"))) fit.set(m[1], { ...(fit.get(m[1]) || {}), pos: [+m[2], +m[3]] });
for (const m of wf.matchAll(new RegExp(`self:Size\\("([^"]+)",\\s*${num},\\s*${num}\\)`, "g"))) fit.set(m[1], { ...(fit.get(m[1]) || {}), size: [+m[2], +m[3]] });
const hidden = new Set([...wf.matchAll(/_UIKit:SetEnabled\("([^"]+)",\s*false\)/g)].map((m) => m[1]));
const WIDE = ["/ui/EquipmentHUD/SafeArea/InvWin", "/ui/ShopHUD/SafeArea/ShopWin", "/ui/GameHUD/OfferWin", "/ui/GameHUD/GuideWin", "/ui/ShadowHUD/Window"];
// 겹쳐도 되는 조각: 잠금 단추는 설명 칸 오른쪽 위 빈 자리에 일부러 얹는다 · 그림자 상세 「Empty」 안내는 고른 그림자가 없을 때 혼자 뜬다 (* = 아무 조각)
const WIDE_OK = [["InvWin/BtnLock", "InvWin/DescBox"], ["Detail/Empty", "*"]];
const uiCache = new Map();
function uiOf(group) {
  if (!uiCache.has(group)) {
    const log = console.log;
    console.log = () => {};
    try { uiCache.set(group, UIBuilder.read(path.join(ROOT, "ui", group + ".ui"))); } finally { console.log = log; }
  }
  return uiCache.get(group);
}
function geo(b, p) {
  // 고정 앵커 조각의 앵커 점·피벗·자리·크기 (WindowFit 값이 있으면 그것). stretch 앵커는 null
  const t = b.getComponent(p, "MOD.Core.UITransformComponent");
  if (!t) return null;
  const amin = t.AnchorsMin || { x: 0.5, y: 0.5 }, amax = t.AnchorsMax || { x: 0.5, y: 0.5 };
  if (Math.abs(amin.x - amax.x) > 1e-6 || Math.abs(amin.y - amax.y) > 1e-6) return null;
  const f = fit.get(p) || {};
  return { anchor: [amin.x, amin.y], pivot: [t.Pivot.x, t.Pivot.y], pos: f.pos || [t.anchoredPosition.x, t.anchoredPosition.y], size: f.size || [t.RectSize.x, t.RectSize.y] };
}
const childRect = (g, W, H) => {
  const px = g.anchor[0] * W + g.pos[0], py = g.anchor[1] * H + g.pos[1];
  return [px - g.pivot[0] * g.size[0], px + (1 - g.pivot[0]) * g.size[0], py - g.pivot[1] * g.size[1], py + (1 - g.pivot[1]) * g.size[1]];
};
let wideChecked = 0;
for (const win of WIDE) {
  const group = win.split("/")[2];
  const b = uiOf(group);
  const wg = geo(b, win);
  if (!wg) { problems.push(`좁은 화면: ${win} 없음`); continue; }
  const [W, H] = wg.size;
  const outerW = W + FRAME.rimOut * 2, outerH = H + FRAME.rimOut * 2;
  // 창은 화면 가운데 기준 (SafeArea·그룹 가운데 앵커) — 보이는 칸 1440×1080의 가장자리 16 안
  const halfW = NARROW.visibleW / 2 - NARROW.edge, halfH = NARROW.visibleH / 2 - NARROW.edge;
  if (Math.abs(wg.pos[0]) + outerW / 2 > halfW + 0.5 || Math.abs(wg.pos[1]) + outerH / 2 > halfH + 0.5) problems.push(`좁은 화면 4:3: ${win} 바깥 ${outerW}×${outerH} (자리 ${wg.pos.join(",")})가 보이는 칸 ${NARROW.visibleW}×${NARROW.visibleH} − 가장자리 ${NARROW.edge}를 넘는다`);
  if (W > NARROW.bodyMaxW || H > NARROW.bodyMaxH) problems.push(`좁은 화면 4:3: ${win} 바탕 ${W}×${H} > 상한 ${NARROW.bodyMaxW}×${NARROW.bodyMaxH}`);
  // 창 바로 아래 조각 + 그림자 상세 판 안 조각
  const parents = [[win, W, H]];
  const detail = win + "/Detail";
  if (b.find(detail)) { const dg = geo(b, detail); if (dg) parents.push([detail, dg.size[0], dg.size[1]]); }
  for (const [parent, PW, PH] of parents) {
    const kids = b.listEntities().filter((e) => e.path.startsWith(parent + "/") && e.path.split("/").length === parent.split("/").length + 1);
    const rects = [];
    for (const e of kids) {
      // 테두리 · 실행 중에 자리를 정하는 연출(고른 카드 반짝임 Flash)은 빼고
      if (e.name === "Rim" || e.name === "Flash" || hidden.has(e.path)) continue;
      const g = geo(b, e.path);
      if (!g) continue;
      const r = childRect(g, PW, PH);
      wideChecked++;
      if (r[0] < -0.5 || r[2] < -0.5 || r[1] > PW + 0.5 || r[3] > PH + 0.5) problems.push(`좁은 화면 4:3: ${e.path.replace("/ui/", "")} (${r.map((v) => v.toFixed(0)).join(",")})가 ${parent.split("/").pop()} ${PW}×${PH} 밖`);
      if (e.name !== "Title") rects.push([e.path, r, fit.has(e.path)]);
    }
    // 겹침: WindowFit이 옮긴 조각이 하나라도 낀 쌍만 본다 (빌드 그대로인 조각끼리는 PC 배치 — check_ui_layers 몫)
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const [a, ra, fa] = rects[i], [c, rc, fc] = rects[j];
      if (!fa && !fc) continue;
      const short = (p) => p.split("/").slice(-2).join("/");
      const okPair = (x, y) => (short(a) === x && (y === "*" || short(c) === y)) || (short(c) === x && (y === "*" || short(a) === y));
      if (WIDE_OK.some(([x, y]) => okPair(x, y) || okPair(y, x))) continue;
      const ox = Math.min(ra[1], rc[1]) - Math.max(ra[0], rc[0]), oy = Math.min(ra[3], rc[3]) - Math.max(ra[2], rc[2]);
      if (ox > 0.5 && oy > 0.5) problems.push(`좁은 화면 4:3: ${a.replace("/ui/", "")} × ${short(c)} 겹침 ${ox.toFixed(0)}×${oy.toFixed(0)}`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.log(p);
  console.log(`[check_mobile_layout] 문제 ${problems.length}건`);
  process.exit(1);
}
console.log(`[check_mobile_layout] 요소 ${names.length}개 · 화면 ${CANVASES.length}종 · 좁은 화면 넓은 창 ${WIDE.length}개(조각 ${wideChecked}), 문제 0건`);
