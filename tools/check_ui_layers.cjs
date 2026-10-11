// 창(처음에 꺼져 있다 켜지는 큰 판)이 늘 보이는 HUD 조각에 가려지는지 화면 좌표로 전수 검사한다.
// 가림 판정: HUD 조각의 UI 그룹 GroupOrder가 더 크거나, 같은데 다른 그룹(겹침 순서 불안정), 같은 그룹이면 형제 순서상 뒤(나중에 그림).
// 사용: node tools/check_ui_layers.cjs  (문제가 있으면 exit 1)
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const { UIBuilder } = require(path.join(ROOT, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const SCREEN = { x: 1920, y: 1080 };
const WIN_MIN = { x: 300, y: 200 };   // 이보다 작은 꺼진 조각(배지·말풍선 등)은 창으로 보지 않는다
const RENDERERS = ["MOD.Core.SpriteGUIRendererComponent", "MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent", "MOD.Core.RawImageGUIRendererComponent"];

function quietRead(file) {
  const log = console.log;
  console.log = () => {};
  try { return UIBuilder.read(file); } finally { console.log = log; }
}

function visibleRenderer(b, p) {
  // 실제로 화면에 그려지는 조각만 (투명 바탕 글자 판의 숨은 스프라이트는 제외)
  for (const t of RENDERERS) {
    const c = b.getComponent(p, t);
    if (!c || c.Enable === false) continue;
    if (t === "MOD.Core.SpriteGUIRendererComponent") {
      const a = c.Color && typeof c.Color.a === "number" ? c.Color.a : 1;
      if (a <= 0.02) continue;
    }
    if ((t === "MOD.Core.TextGUIRendererComponent" || t === "MOD.Core.TextComponent") && !(c.Text && String(c.Text).trim())) continue;
    return true;
  }
  return false;
}

function load(file) {
  const b = quietRead(file);
  const group = b.getComponent("/", "MOD.Core.UIGroupComponent") || {};
  const list = b.listEntities();
  const byPath = new Map();
  const nodes = [];
  list.forEach((e, order) => {
    const t = b.getComponent(e.path, "MOD.Core.UITransformComponent") || {};
    const parentPath = e.path.substring(0, e.path.lastIndexOf("/"));
    const parent = byPath.get(parentPath);
    let rect;
    if (!parent) rect = { x0: 0, y0: 0, x1: SCREEN.x, y1: SCREEN.y };
    else {
      const pw = parent.rect.x1 - parent.rect.x0, ph = parent.rect.y1 - parent.rect.y0;
      const amin = t.AnchorsMin || { x: 0.5, y: 0.5 }, amax = t.AnchorsMax || { x: 0.5, y: 0.5 };
      const omin = t.OffsetMin || { x: 0, y: 0 }, omax = t.OffsetMax || { x: 0, y: 0 };
      rect = {
        x0: parent.rect.x0 + pw * amin.x + omin.x, y0: parent.rect.y0 + ph * amin.y + omin.y,
        x1: parent.rect.x0 + pw * amax.x + omax.x, y1: parent.rect.y0 + ph * amax.y + omax.y,
      };
    }
    const plat = t.ActivePlatform === undefined ? 255 : t.ActivePlatform;
    const node = {
      file: path.basename(file), path: e.path, order, enable: e.enable !== false, rect, parent,
      pc: (plat & 1) !== 0 && (!parent || parent.pc), mobile: (plat & 2) !== 0 && (!parent || parent.mobile),
      drawn: visibleRenderer(b, e.path),
    };
    node.shownByDefault = node.enable && (!parent || parent.shownByDefault);
    byPath.set(e.path, node);
    nodes.push(node);
  });
  return { file: path.basename(file), groupOrder: group.GroupOrder || 0, nodes };
}

const groups = fs.readdirSync(path.join(ROOT, "ui")).filter((f) => f.endsWith(".ui")).map((f) => load(path.join(ROOT, "ui", f)));

function isAncestor(a, b) { return b.path.startsWith(a.path + "/"); }
function overlap(a, b) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 4 && h > 4 ? w * h : 0;
}

// 창 = UIKit:RegisterWindow로 등록되는 판(스크립트가 시작 때 닫는다 — 파일에서는 켜져 있을 수 있다) + 꺼진 채로 시작하는 큰 판
const registered = new Set();
(function scan(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) scan(p);
    else if (f.name.endsWith(".mlua")) {
      const src = fs.readFileSync(p, "utf8");
      for (const m of src.matchAll(/RegisterWindow\("([^"]+)"\)/g)) registered.add(m[1]);
      if (/RegisterWindow\(self\.Win\)/.test(src)) for (const m of src.matchAll(/property string Win = "([^"]+)"/g)) registered.add(m[1]);
    }
  }
})(path.join(ROOT, "RootDesk/MyDesk"));
function isWindow(n) {
  const name = n.path.substring(n.path.lastIndexOf("/") + 1);
  if (registered.has(name) || registered.has(n.path) || /Win$/.test(name)) return true;
  if (n.enable || !(n.parent && n.parent.shownByDefault)) return false;
  return n.rect.x1 - n.rect.x0 >= WIN_MIN.x && n.rect.y1 - n.rect.y0 >= WIN_MIN.y;
}
const BOOT_ONLY = new Set(["CharSelectHUD" + ".ui"]);   // 입장 전 전체 화면 (그동안 다른 창은 없다)
// 창이 열려 있는 동안 스크립트가 끄는 HUD (가림 대상이 아니다): 모바일 패드(MobilePad.Poll), 소환수 목록(CompanionHUD), 안내 줄(HudMain Tip),
// 모바일 일지 버튼(JournalWindow — HudMap.ShouldShowQuestTrack이 창이 열리면 false. 거래 창은 소지품 창을 함께 연다)
const HIDDEN_WHILE_WINDOW = ["/ui/ShadowHUD/MobilePad", "/ui/CompanionHUD/", "/ui/GameHUD/Tip", "/ui/JournalHUD/SafeArea/BtnOpen"];
const windows = [];
for (const g of groups) for (const n of g.nodes) {
  n.isWindow = isWindow(n);
  n.inWindow = n.isWindow || !!(n.parent && n.parent.inWindow);
  if (n.isWindow) windows.push({ g, n });
}
// 늘 보이는 HUD 조각 (창 안·입장 전 화면은 제외)
const huds = [];
for (const g of groups) {
  if (BOOT_ONLY.has(g.file)) continue;
  for (const n of g.nodes) {
    if (!n.shownByDefault || !n.drawn || n.inWindow) continue;
    if (HIDDEN_WHILE_WINDOW.some((p) => n.path === p || n.path.startsWith(p.endsWith("/") ? p : p + "/"))) continue;
    huds.push({ g, n });
  }
}

const problems = new Map();
for (const w of windows) for (const h of huds) {
  for (const platform of ["pc", "mobile"]) {
    if (!w.n[platform] || !h.n[platform]) continue;
    let covers = false, why = "";
    if (h.g.groupOrder > w.g.groupOrder) { covers = true; why = `그룹 ${h.g.groupOrder} > ${w.g.groupOrder}`; }
    else if (h.g.groupOrder === w.g.groupOrder && h.g.file !== w.g.file) { covers = true; why = `그룹 순서 같음 (${h.g.groupOrder}) — 겹침 불안정`; }
    // 같은 그룹 안은 UIKit:Open이 연 창을 맨 앞으로 옮기므로(SetSiblingIndex) 가리지 않는다
    if (!covers || !overlap(w.n.rect, h.n.rect)) continue;
    // HUD 조각의 맨 위 조상(그룹 바로 아래) 단위로 묶어 보고한다
    let top = h.n;
    while (top.parent && top.parent.parent && top.parent.parent.parent) top = top.parent;
    const key = `${platform}  ${w.g.file}:${w.n.path}  ←  ${h.g.file}:${top.path}  (${why})`;
    problems.set(key, (problems.get(key) || 0) + 1);
  }
}

// 그룹 순서가 정해 둔 표(tools/build/ui-order.cjs)와 같은가 — 메이커가 저장하며 다시 매기면 여기서 걸린다
const { ORDER } = require("./build/ui-order.cjs");
for (const g of groups) {
  const want = ORDER.indexOf(g.file.replace(/\.ui$/, ""));
  if (want < 0) problems.set(`${g.file}: 그룹 순서 표에 없음 (tools/build/ui-order.cjs ORDER)`, 1);
  else if (g.groupOrder !== want) problems.set(`${g.file}: 그룹 순서 ${g.groupOrder} ≠ ${want} — 메이커가 다시 매김. node tools/build/ui-order.cjs 후 refresh`, 1);
}

console.log(`[check_ui_layers] 창 ${windows.length}개 · 늘 보이는 HUD 조각 ${huds.length}개`);
for (const [k, n] of [...problems.entries()].sort()) console.log(`  ${k}  조각 ${n}개`);
console.log(`[check_ui_layers] 가림 ${problems.size}건`);
process.exitCode = problems.size ? 1 : 0;
