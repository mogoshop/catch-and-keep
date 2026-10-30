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
  // I04 (10-29): BasicAtk = 큰 단추에 스킬을 넣은 고급 배치의 기본 공격 · AimCancel = 스킬 끌기 중 「취소」 표시 (둘 다 상황에 따라 켜지지만 늘 떠 있다고 보고 잰다)
  for (const n of ["Stick", "Attack", "Dash", "BasicAtk", "AimCancel", "Extract", "BtnSkillEdit", "Shadow/Toggle", "Shadow/Cmds/Summon", "Shadow/Cmds/Recall", "Shadow/Cmds/Rally"]) add("MobilePad/" + n, "ShadowHUD", "MobilePad/" + n);
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
// SkillOffer.SetBandText: 긴 선택 보상 제목이면 띠가 모바일 상한 폭까지 넓어진다 (10-29 UI-20261029-01) → 가장 넓은 폭으로 잰다
{
  const so = read("RootDesk/MyDesk/UI/Windows/SkillOffer.mlua");
  const band = items.get("GameHUD/OfferBand");
  band.size = [+need(/property number BandMaxWMobile = (\d+)/, so, "SkillOffer 모바일 띠 최대 폭")[1], band.size[1]];
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

// I04 ㉠ (10-29 21:03 코덱스 위임 승인 · approval-i04-review-2103): 고급 배치 기본 공격(BasicAtk)과 큰 공격·S4의 실제 입력 사각형 가장자리 간격 ≥ 8 UI 단위 (목표 8~12).
//   한 축이 겹치면 다른 축의 틈, 두 축 모두 떨어지면 모서리 사이 직선 거리. 둥근 그림(테두리) 사이 여백으로 대신하지 않는다 · 셋 다 오른쪽 아래 앵커라 화면마다 같은 값
const MIN_TAP_GAP = 8;
const TAP_GAP_PAIRS = [["MobilePad/BasicAtk", "MobilePad/Attack"], ["MobilePad/BasicAtk", "MobilePad/Skills/S4"]];
function edgeGap(ra, rb) {
  const dx = Math.max(ra[0] - rb[1], rb[0] - ra[1]), dy = Math.max(ra[2] - rb[3], rb[2] - ra[3]);
  if (dx <= 0 && dy <= 0) return -Math.min(-dx, -dy);   // 겹침: 음수
  if (dx <= 0) return dy;
  if (dy <= 0) return dx;
  return Math.hypot(dx, dy);
}
for (const [label, W, H] of CANVASES) {
  for (const [a, b] of TAP_GAP_PAIRS) {
    const g = edgeGap(rect(items.get(a), W, H), rect(items.get(b), W, H));
    if (g < MIN_TAP_GAP - 1e-6) problems.push(`${label}: ${a} ↔ ${b} 입력 사각형 간격 ${g.toFixed(1)} < ${MIN_TAP_GAP} (I04 ㉠)`);
    else if (verbose && label === CANVASES[0][0]) console.log(`  I04 간격 ${a.split("/").pop()} ↔ ${b.split("/").pop()} = ${g.toFixed(1)} (≥ ${MIN_TAP_GAP})`);
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

  // ── 스킬 창 모바일 해금 시간선 (QR1629-O\-02 · RootDesk/MyDesk/UI/Windows/SkillWindow.mlua) ──
  //   iPad에서 첫 줄 칸 아래 랭크·「배우기」 글이 둘째 줄 칸 테두리에 덮였다(줄 간격 96). 칸 88 · 테두리 칸+8 · 상태 글(빌더 State: 칸 아래 2, 높이 16)로
  //   줄마다 「상태 글 아래 끝 ≥ 다음 줄 테두리 위 끝」, 마지막 줄 글이 진행 막대 위, 막대가 판(356) 테두리 안, 테두리가 열 폭 안인지 잰다. PC 배치는 보지 않는다
{
  const sw = read('RootDesk/MyDesk/UI/Windows/SkillWindow.mlua');
  const swProp = (name) => +need(new RegExp('property integer ' + name + ' = (-?[0-9]+)'), sw, 'SkillWindow.' + name)[1];
  const rows = swProp('MobileRows'), step = swProp('MobileStepY'), barY = swProp('MobileBarY');
  const btn = +need(/local btn = mobile and (\d+) or \d+/, sw, 'SkillWindow 모바일 칸')[1];
  const colW = +need(/local colW = mobile and (\d+) or/, sw, 'SkillWindow 모바일 열 폭')[1];
  const ringPad = +need(/ring.UITransformComponent.RectSize = Vector2.btn . (\d+), btn . \d+./, sw, 'SkillWindow 칸 테두리')[1] / 2;
  const gb = uiOf('GameHUD');
  const T = 'MOD.Core.UITransformComponent';
  const col = gb.getComponent('SkillWin/TL/C1', T);
  const slot = gb.getComponent('SkillWin/TL/C1/S1', T);
  const state = gb.getComponent('SkillWin/TL/C1/S1/State', T);
  const bar = gb.getComponent('SkillWin/TL/Bar', T);
  const panel = gb.getComponent('SkillWin/TL', T);
  const { SKPANEL } = require('./build/ui-tokens.cjs');
  const colTop = col.anchoredPosition.y;               // 판 위에서 열 위 끝 (열 피벗 위)
  const slotTop0 = slot.anchoredPosition.y;            // 열 위에서 첫 줄 칸 위 끝 (칸 피벗 위)
  if (Math.abs(state.Pivot.y - 1) > 1e-6) problems.push('스킬 창 시간선: 상태 글 피벗이 위가 아니다 — 이 검사의 계산을 고친다');
  const stateBelow = -state.anchoredPosition.y;        // 칸 아래 끝에서 글 위 끝까지
  const stateH = state.RectSize.y;
  let lastStateBottom = 0;
  for (let r = 1; r <= rows; r++) {
    const top = colTop + slotTop0 - (r - 1) * step;
    const stateBottom = top - btn - stateBelow - stateH;
    lastStateBottom = stateBottom;
    if (r < rows) {
      const nextRingTop = colTop + slotTop0 - r * step + ringPad;
      if (nextRingTop > stateBottom + 0.5) problems.push('스킬 창 모바일 시간선: ' + r + '줄 상태 글(아래 ' + stateBottom + ')이 ' + (r + 1) + '줄 칸 테두리(위 ' + nextRingTop + ')에 ' + (nextRingTop - stateBottom) + ' 덮인다');
    }
  }
  const barH = bar.RectSize.y;
  if (barY + barH / 2 > lastStateBottom + 0.5) problems.push('스킬 창 모바일 시간선: 막대 위 끝 ' + (barY + barH / 2) + '이 마지막 줄 상태 글 아래 끝 ' + lastStateBottom + '보다 위');
  const inner = -(panel.RectSize.y - SKPANEL.border);
  if (barY - barH / 2 < inner - 0.5) problems.push('스킬 창 모바일 시간선: 막대 아래 끝 ' + (barY - barH / 2) + '이 판 테두리 안쪽 ' + inner + ' 밖');
  if (btn + ringPad * 2 > colW) problems.push('스킬 창 모바일 시간선: 칸 테두리 ' + (btn + ringPad * 2) + ' > 열 폭 ' + colW);
  if (btn < 88) problems.push('스킬 창 모바일 시간선: 칸 ' + btn + ' < 손가락 88');
  // RB-OBS-04: 쪽 넘김 단추(TL/Prev·TL/NextPage — 그림·누르는 자리 같은 사각형)가 첫 열·마지막 열(한 쪽 PageSize열)의
  //   칸(누르는 자리)·테두리·상태 글과 겹치지 않고, 진행 막대가 판 테두리 안에 있는지. 열 왼쪽 = SkillWindow.MobileX0, 열 간격 = 모바일 colW
  const x0 = swProp('MobileX0');
  const per = +need(/if Environment:IsMobilePlatform\(\) then return (\d+) end/, sw, 'SkillWindow 모바일 PageSize')[1];
  const PW = panel.RectSize.x, PH = panel.RectSize.y;
  const rectOf = (path) => {
    // 판(위-왼쪽 기준, 아래로 −) 안의 사각형: 판 바로 아래 자식만 (anchor 한 점 · pivot)
    const t = gb.getComponent(path, T);
    const ax = t.AnchorsMin.x * PW, ay = -(1 - t.AnchorsMin.y) * PH;
    const left = ax + t.anchoredPosition.x - t.Pivot.x * t.RectSize.x;
    const top = ay + t.anchoredPosition.y + (1 - t.Pivot.y) * t.RectSize.y;
    return { l: left, r: left + t.RectSize.x, t: top, b: top - t.RectSize.y };
  };
  const navs = { Prev: rectOf('SkillWin/TL/Prev'), NextPage: rectOf('SkillWin/TL/NextPage') };
  const colWidth = col.RectSize.x;   // 칸은 열 위-가운데에 붙는다
  const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.t, b.t) - Math.max(a.b, b.b) > 0.5;
  for (const c of [1, per]) {
    const cx = x0 + (c - 1) * colW + colWidth / 2;
    for (let r = 1; r <= rows; r++) {
      const top = colTop + slotTop0 - (r - 1) * step;
      const parts = {
        칸: { l: cx - btn / 2, r: cx + btn / 2, t: top, b: top - btn },
        테두리: { l: cx - btn / 2 - ringPad, r: cx + btn / 2 + ringPad, t: top + ringPad, b: top - btn - ringPad },
        상태글: { l: cx - state.RectSize.x / 2, r: cx + state.RectSize.x / 2, t: top - btn - stateBelow, b: top - btn - stateBelow - stateH },
      };
      for (const [nn, nr] of Object.entries(navs)) for (const [pn, pr] of Object.entries(parts)) {
        if (overlap(nr, pr)) problems.push(`스킬 창 모바일 시간선: 넘김 단추 ${nn}(x ${nr.l}~${nr.r} · y ${nr.b}~${nr.t})가 ${c}열 ${r}줄 ${pn}(x ${pr.l}~${pr.r} · y ${pr.b}~${pr.t})과 겹친다`);
      }
    }
  }
  const barRight = x0 + per * colW;
  if (barRight > PW - SKPANEL.border + 0.5) problems.push('스킬 창 모바일 시간선: 막대 오른쪽 끝 ' + barRight + '이 판 테두리 안쪽 ' + (PW - SKPANEL.border) + ' 밖');
  if (verbose) console.log('스킬 창 모바일 시간선 넘김 단추: Prev x ' + navs.Prev.l + '~' + navs.Prev.r + ' · 첫 열 테두리 x ' + (x0 + colWidth / 2 - btn / 2 - ringPad) + '~ · ' + per + '열 테두리 ~' + (x0 + (per - 1) * colW + colWidth / 2 + btn / 2 + ringPad) + ' · Next x ' + navs.NextPage.l + '~' + navs.NextPage.r + ' · 막대 ' + x0 + '~' + barRight);
  if (verbose) console.log('스킬 창 모바일 시간선: 줄 ' + rows + ' · 간격 ' + step + ' · 마지막 글 아래 ' + lastStateBottom + ' · 막대 ' + barY + ' · 판 안쪽 ' + inner);
}

  // ── 스킬 창 편성 조작 칸 WS/Form (10-30 갈래 B · I03 단계 2 희망 편성 · I04 골편 홀드 반복 설정) ──
  //   SkillWindow.RenderForm은 해골 전사·해골 마법사·골편 트리에서만 칸을 켠다. 그 트리의 강화 노드(RenderNodes와 같은 배치: 필요 랭크 열 680+104씩 · 줄 96+102씩 · 100칸)·
  //   필요 랭크 머리(Need, -66 높이 20)와 겹치지 않고, 공방 판 안쪽(SKPANEL) 안에 있으며, 단추가 손가락 88 이상이고 서로 겹치지 않는지 (PC·모바일 같은 배치)
{
  const gb = uiOf('GameHUD');
  const T = 'MOD.Core.UITransformComponent';
  const { SKPANEL, BUTTON } = require('./build/ui-tokens.cjs');
  const ws = gb.getComponent('SkillWin/WS', T);
  const rectIn = (t, ox, oy) => {
    // 부모 위-왼쪽(ox, oy) 기준 위-왼쪽 고정 앵커 칸 → 공방 기준 사각형
    const l = ox + t.anchoredPosition.x - t.Pivot.x * t.RectSize.x;
    const top = oy + t.anchoredPosition.y + (1 - t.Pivot.y) * t.RectSize.y;
    return { l, r: l + t.RectSize.x, t: top, b: top - t.RectSize.y };
  };
  const form = gb.getComponent('SkillWin/WS/Form', T);
  const fr = rectIn(form, 0, 0);
  const kids = {};
  for (const k of ['Head', 'Mode', 'Minus', 'Plus']) kids[k] = rectIn(gb.getComponent('SkillWin/WS/Form/' + k, T), fr.l, fr.t);
  const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.t, b.t) - Math.max(a.b, b.b) > 0.5;
  const inside = (a, b) => a.l >= b.l - 0.5 && a.r <= b.r + 0.5 && a.t <= b.t + 0.5 && a.b >= b.b - 0.5;
  const panelIn = { l: SKPANEL.border, r: ws.RectSize.x - SKPANEL.border, t: -SKPANEL.border, b: -(ws.RectSize.y - SKPANEL.border) };
  if (!inside(fr, panelIn)) problems.push(`스킬 창 편성 칸 WS/Form(x ${fr.l}~${fr.r} · y ${fr.b}~${fr.t})이 공방 판 안쪽 밖`);
  for (const [k, r] of Object.entries(kids)) if (!inside(r, fr)) problems.push(`스킬 창 편성 칸 ${k}가 WS/Form 밖`);
  for (const k of ['Mode', 'Minus', 'Plus']) {
    const r = kids[k];
    if (r.r - r.l < 88 || r.t - r.b < BUTTON.h || r.t - r.b < 88) problems.push(`스킬 창 편성 칸 ${k} ${r.r - r.l}×${r.t - r.b} < 손가락 88`);
  }
  const ks = Object.keys(kids);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (overlap(kids[ks[i]], kids[ks[j]])) problems.push(`스킬 창 편성 칸 ${ks[i]} ↔ ${ks[j]} 겹침`);
  const skills = require('./lib/csv.cjs').load('skills');
  for (const parent of ['raise_skeleton', 'raise_mage', 'bone_shard']) {
    const nodes = skills.filter((s) => s.parent === parent);
    const needs = [...new Set(nodes.map((s) => +s.need))].sort((a, b) => a - b);
    const rowsIn = {};
    for (const n of nodes) {
      const ci = needs.indexOf(+n.need) + 1;
      rowsIn[ci] = (rowsIn[ci] || 0) + 1;
      const x = 680 + (ci - 1) * 104, y = -96 - (rowsIn[ci] - 1) * 102;
      const nr = { l: x - 50, r: x + 50, t: y, b: y - 100 };
      if (overlap(nr, fr)) problems.push(`스킬 창 편성 칸이 ${parent} 강화 노드 ${n.id}(x ${nr.l}~${nr.r} · y ${nr.b}~${nr.t})와 겹친다`);
    }
    for (let i = 1; i <= needs.length; i++) {
      const x = 680 + (i - 1) * 104;
      if (overlap({ l: x - 50, r: x + 50, t: -66, b: -86 }, fr)) problems.push(`스킬 창 편성 칸이 ${parent} 필요 랭크 머리 ${i}열과 겹친다`);
    }
  }
  if (verbose) console.log(`스킬 창 편성 칸 WS/Form x ${fr.l}~${fr.r} · y ${fr.b}~${fr.t} · Mode ${kids.Mode.r - kids.Mode.l}×${kids.Mode.t - kids.Mode.b} · ± ${kids.Minus.r - kids.Minus.l}×${kids.Minus.t - kids.Minus.b}`);
}

  // ── S48-UI-DETAIL-PIPS-01 (10-30): 편성 줄 WS/Roster ↔ 랭크 점 줄 WS/Pip1~20 비겹침 ──
  //   PC 해골 전사·마법사 상세에서 편성 줄(효과 칸 6~7번째 줄)이 랭크 점 줄을 덮었다 → 편성 줄은 WS/Roster(강화 트리 아래)로. 점은 단계·완성 칸이 26으로 커지며 왼쪽 위로 3 비킨다(SkillWindow.SizePip)
  //   효과 칸(WS/Stat) 상자도 큰 점과 겹치지 않고, 편성 줄은 판 안쪽 · 편성 조작 칸(WS/Form) · 해골 전사·마법사 노드 · 필요 랭크 머리 · 랭크 안내 줄(RankNote·Reason)과 겹치지 않는다
{
  const gb = uiOf('GameHUD');
  const T = 'MOD.Core.UITransformComponent';
  const { SKPANEL } = require('./build/ui-tokens.cjs');
  const ws = gb.getComponent('SkillWin/WS', T);
  const rectIn = (t, ox, oy) => {
    const l = ox + t.anchoredPosition.x - t.Pivot.x * t.RectSize.x;
    const top = oy + t.anchoredPosition.y + (1 - t.Pivot.y) * t.RectSize.y;
    return { l, r: l + t.RectSize.x, t: top, b: top - t.RectSize.y };
  };
  const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.t, b.t) - Math.max(a.b, b.b) > 0.5;
  const inside = (a, b) => a.l >= b.l - 0.5 && a.r <= b.r + 0.5 && a.t <= b.t + 0.5 && a.b >= b.b - 0.5;
  const get = (p) => gb.getComponent('SkillWin/WS/' + p, T);
  if (!get('Roster')) problems.push('스킬 창 편성 줄 WS/Roster 없음 — node tools/build.cjs ui (S48-UI-DETAIL-PIPS-01)');
  else {
    const roster = rectIn(get('Roster'), 0, 0);
    const stat = rectIn(get('Stat'), 0, 0);
    const pips = [];
    for (let i = 1; i <= 20; i++) {
      const p = rectIn(get('Pip' + i), 0, 0);
      const grow = (26 - (p.r - p.l)) / 2;
      pips.push({ i, l: p.l - grow, r: p.r + grow, t: p.t + grow, b: p.b - grow });
    }
    for (const p of pips) {
      if (overlap(roster, p)) problems.push(`스킬 창 편성 줄 WS/Roster(x ${roster.l}~${roster.r} · y ${roster.b}~${roster.t})이 랭크 점 ${p.i}(큰 점 26 기준)과 겹친다`);
      if (overlap(stat, p)) problems.push(`스킬 창 효과 칸 WS/Stat(y ${stat.b}~${stat.t})이 랭크 점 ${p.i}(큰 점 26 · y ${p.b}~${p.t})과 겹친다`);
    }
    for (const k of ['RankNote', 'Reason', 'Stat', 'Form']) if (overlap(roster, rectIn(get(k), 0, 0))) problems.push(`스킬 창 편성 줄 WS/Roster ↔ WS/${k} 겹침`);
    const panelIn = { l: SKPANEL.border, r: ws.RectSize.x - SKPANEL.border, t: -SKPANEL.border, b: -(ws.RectSize.y - SKPANEL.border) };
    if (!inside(roster, panelIn)) problems.push(`스킬 창 편성 줄 WS/Roster가 공방 판 안쪽 밖`);
    const skills = require('./lib/csv.cjs').load('skills');
    for (const parent of ['raise_skeleton', 'raise_mage']) {
      const nodes = skills.filter((s) => s.parent === parent);
      const needs = [...new Set(nodes.map((s) => +s.need))].sort((a, b) => a - b);
      const rowsIn = {};
      for (const n of nodes) {
        const ci = needs.indexOf(+n.need) + 1;
        rowsIn[ci] = (rowsIn[ci] || 0) + 1;
        const x = 680 + (ci - 1) * 104, y = -96 - (rowsIn[ci] - 1) * 102;
        if (overlap({ l: x - 50, r: x + 50, t: y, b: y - 100 }, roster)) problems.push(`스킬 창 편성 줄 WS/Roster가 ${parent} 강화 노드 ${n.id}와 겹친다`);
      }
      for (let i = 1; i <= needs.length; i++) {
        const x = 680 + (i - 1) * 104;
        if (overlap({ l: x - 50, r: x + 50, t: -66, b: -86 }, roster)) problems.push(`스킬 창 편성 줄 WS/Roster가 ${parent} 필요 랭크 머리 ${i}열과 겹친다`);
      }
    }
    const pipTop = Math.max(...pips.map((p) => p.t)), pipBottom = Math.min(...pips.map((p) => p.b));
    if (verbose) console.log(`스킬 창 편성 줄 WS/Roster x ${roster.l}~${roster.r} · y ${roster.b}~${roster.t} · 효과 칸 y ${stat.b}~${stat.t} · 랭크 점 x ${pips[0].l}~${pips[19].r} · y ${pipBottom}~${pipTop}`);
  }
}

if (problems.length) {
  for (const p of problems) console.log(p);
  console.log(`[check_mobile_layout] 문제 ${problems.length}건`);
  process.exit(1);
}
console.log(`[check_mobile_layout] 요소 ${names.length}개 · 화면 ${CANVASES.length}종 · 좁은 화면 넓은 창 ${WIDE.length}개(조각 ${wideChecked}), 문제 0건`);
