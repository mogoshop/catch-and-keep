'use strict';
// 공통 UI 규격이 빌더(tools/build/ui-tokens.cjs)와 실행 코드(UIKit.mlua 「대화 상자 규격」·NpcWindow·StoryCard)에서 같은 값인지 확인한다.
// 10-22 사용자: 「공통으로 선언해 화면마다 다르지 않게」 — 한쪽만 바꾸면 여기서 실패한다.
// 10-29: 창 틀(바탕·테두리·제목·닫기)도 모든 창이 ui-tokens 값 그대로인지 본다 (기획서 45 결정 2-A).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { FRAME, DIALOG } = require('./build/ui-tokens.cjs');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const prop = (text, name) => {
  const m = text.match(new RegExp('property\\s+\\w+\\s+' + name + '\\s*=\\s*([0-9.]+)'));
  return m ? Number(m[1]) : NaN;
};

const kit = read('RootDesk/MyDesk/UI/Core/UIKit.mlua');
const npc = read('RootDesk/MyDesk/UI/Windows/NpcWindow.mlua');
const story = read('RootDesk/MyDesk/UI/Hud/StoryCard.mlua');
const pairs = [
  ['UIKit.DialogWidth', prop(kit, 'DialogWidth'), DIALOG.width],
  ['UIKit.DialogPadX', prop(kit, 'DialogPadX'), FRAME.padX],
  ['UIKit.DialogContentTop', prop(kit, 'DialogContentTop'), FRAME.contentTop],
  ['UIKit.DialogGap', prop(kit, 'DialogGap'), FRAME.gap],
  ['UIKit.DialogPortraitW', prop(kit, 'DialogPortraitW'), DIALOG.portrait.w],
  ['UIKit.DialogTextPadX', prop(kit, 'DialogTextPadX'), DIALOG.textPad.x],
  ['UIKit.DialogTextPadY', prop(kit, 'DialogTextPadY'), DIALOG.textPad.y],
  ['UIKit.DialogPageNoH', prop(kit, 'DialogPageNoH'), DIALOG.pageNo.h],
  ['UIKit.DialogPageNoBottom', prop(kit, 'DialogPageNoBottom'), DIALOG.pageNo.bottom],
  ['UIKit.DialogFontPc', prop(kit, 'DialogFontPc'), DIALOG.font.pc],
  ['UIKit.DialogFontMobile', prop(kit, 'DialogFontMobile'), DIALOG.font.mobile],
  ['NpcWindow.PaperHeight', prop(npc, 'PaperHeight'), DIALOG.npcPaperH],
  ['StoryCard.PaperH', prop(story, 'PaperH'), DIALOG.storyPaperH],
];
let bad = 0;
for (const [name, lua, js] of pairs) {
  if (lua !== js) {
    bad++;
    console.log(`  ✗ ${name} = ${lua} · ui-tokens.cjs = ${js}`);
  }
}

// ── 창 틀 규격 (10-29 기획서 45 결정 2-A · tools/build/lib.cjs windowFrame) ──
//   제목(Title)·닫기(BtnClose)가 있는 모든 창이 같은 틀인가: 바탕 gauge_fill 꽉 찬 그림 + COLOR.windowBg · 테두리 = 바탕 + 2×rimOut ·
//   제목 FRAME.titleSize · COLOR.title · 위에서 titleTop · 닫기 FRAME.close (오른쪽 위 모서리 기준). 창 몸통 배치는 각 빌더 몫이라 보지 않는다.
const { COLOR } = require('./build/ui-tokens.cjs');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require('./lib/csv.cjs');
const icons = Object.fromEntries(load('ui_icons').map((r) => [r.key, r.ruid]));
const EXT = '.' + 'ui';
// 예전 별도 빌더 7개(소지품·창고·상점·떠돌이 상인·의뢰 일지·일지·그림자 보관함) + 마을 게시판 — 틀을 다시 따로 그리면 여기서 빠져 실패한다
const MUST = ['EquipmentHUD/SafeArea/InvWin', 'StashHUD/SafeArea/StashWin', 'ShopHUD/SafeArea/ShopWin', 'MerchantHUD/SafeArea/MerchantWin',
  'QuestJournalHUD/SafeArea/QuestWin', 'JournalHUD/SafeArea/JournalWin', 'ShadowHUD/Window', 'CoopHUD/SafeArea/BoardWin'];
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const near = (a, b) => Math.abs((a || 0) - b) < 1.5 / 255;
const sameColor = (c, rgb, a) => !!c && near(c.r, rgb[0]) && near(c.g, rgb[1]) && near(c.b, rgb[2]) && (a === undefined || near(c.a, a));
const bg = COLOR.windowBg, titleRgb = hexRgb(COLOR.title), cl = FRAME.close;
const frames = [];
for (const f of fs.readdirSync(path.join(root, 'ui')).filter((x) => x.endsWith(EXT)).sort()) {
  const quiet = console.log;
  console.log = () => {};
  let b;
  try { b = UIBuilder.read(path.join(root, 'ui', f)); } finally { console.log = quiet; }
  for (const w of b.listEntities().filter((e) => b.find(e.path + '/Title') && b.find(e.path + '/BtnClose'))) {
    const name = w.path.replace('/ui/', '');
    frames.push(name);
    const why = [];
    const sp = b.getComponent(w.path, 'MOD.Core.SpriteGUIRendererComponent');
    const img = sp && sp.ImageRUID && (sp.ImageRUID.DataId || sp.ImageRUID);
    if (img !== icons.gauge_fill) why.push(`바탕 그림 ${img} ≠ gauge_fill`);
    if (!sp || !sameColor(sp.Color, [bg.r, bg.g, bg.b], bg.a)) why.push('바탕 색 ≠ COLOR.windowBg');
    const wt = b.getComponent(w.path, 'MOD.Core.UITransformComponent');
    const rt = b.find(w.path + '/Rim') && b.getComponent(w.path + '/Rim', 'MOD.Core.UITransformComponent');
    if (!rt || rt.RectSize.x !== wt.RectSize.x + FRAME.rimOut * 2 || rt.RectSize.y !== wt.RectSize.y + FRAME.rimOut * 2) why.push('테두리 ≠ 바탕 + 2×rimOut');
    const tt = b.getComponent(w.path + '/Title', 'MOD.Core.TextGUIRendererComponent');
    const tr = b.getComponent(w.path + '/Title', 'MOD.Core.UITransformComponent');
    if (!tt || tt.FontSize !== FRAME.titleSize || !sameColor(tt.FontColor, titleRgb)) why.push(`제목 ${tt ? tt.FontSize : '?'} ≠ ${FRAME.titleSize} · COLOR.title`);
    if (!tr || tr.anchoredPosition.y !== -FRAME.titleTop || tr.Pivot.y !== 1) why.push('제목 자리 ≠ 위에서 titleTop');
    const ct = b.getComponent(w.path + '/BtnClose', 'MOD.Core.UITransformComponent');
    if (!ct || ct.RectSize.x !== cl.size || ct.RectSize.y !== cl.size || ct.anchoredPosition.x !== cl.x || ct.anchoredPosition.y !== cl.y || ct.Pivot.x !== 1 || ct.Pivot.y !== 1) why.push(`닫기 ≠ ${cl.size} (${cl.x},${cl.y})`);
    if (why.length) { bad++; console.log(`  ✗ 창 틀 ${name}: ${why.join(' · ')}`); }
  }
}
for (const m of MUST) if (!frames.includes(m)) { bad++; console.log(`  ✗ 창 틀 ${m}: 공용 창 틀(제목·닫기)이 없다`); }
console.log(`[check_ui_tokens] 규격 ${pairs.length}개 · 창 틀 ${frames.length}개, 어긋남 ${bad}건`);
process.exit(bad ? 1 : 0);
