'use strict';
// 공통 UI 규격이 빌더(tools/build/ui-tokens.cjs)와 실행 코드(UIKit.mlua 「대화 상자 규격」·NpcWindow·StoryCard)에서 같은 값인지 확인한다.
// 10-22 사용자: 「공통으로 선언해 화면마다 다르지 않게」 — 한쪽만 바꾸면 여기서 실패한다.
// 10-29: 창 틀(바탕·테두리·제목·닫기)도 모든 창이 ui-tokens 값 그대로인지 본다 (기획서 45 결정 2-A).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { FRAME, DIALOG, BAND } = require('./build/ui-tokens.cjs');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const prop = (text, name) => {
  const m = text.match(new RegExp('property\\s+\\w+\\s+' + name + '\\s*=\\s*(-?[0-9.]+)'));
  return m ? Number(m[1]) : NaN;
};

const kit = read('RootDesk/MyDesk/UI/Core/UIKit.mlua');
const npc = read('RootDesk/MyDesk/UI/Windows/NpcWindow.mlua');
const story = read('RootDesk/MyDesk/UI/Hud/StoryCard.mlua');
const offer = read('RootDesk/MyDesk/UI/Windows/SkillOffer.mlua');
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
  // HUD 장식 띠 한 줄 규격 (10-29 UI-20261029-01 · SkillOffer → UIKit.SetBandText)
  ['SkillOffer.BandFont', prop(offer, 'BandFont'), BAND.font],
  ['SkillOffer.BandMinFont', prop(offer, 'BandMinFont'), BAND.minFont],
  ['SkillOffer.BandPadX', prop(offer, 'BandPadX'), BAND.padX],
  ['SkillOffer.BandPadY', prop(offer, 'BandPadY'), BAND.padY],
  ['SkillOffer.BandMinW', prop(offer, 'BandMinW'), BAND.minW],
  ['SkillOffer.BandMaxW', prop(offer, 'BandMaxW'), BAND.maxW],
  ['SkillOffer.BandMaxWMobile', prop(offer, 'BandMaxWMobile'), BAND.maxWMobile],
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

// ── 랭킹 창 탭 (11-01 사용자 결정 2-C 「탭 폭 넓히기」 · ui-tokens RANKTAB ↔ RankWindow.LayoutTabs) ──
//   빌드된 탭 넷: 폭·높이·글자 16(줄이지 않는 최대)·글 칸 여백(양쪽 RANKTAB.side · 위아래로 한 줄 높이) · 글(빌드 글 + RankWindow가 넣는 「보스 처치 시간」)이
//   글 폭 어림(UIKit.TextWidth 규칙)으로 한 줄에 든다 · RankWindow 배치 값 = ui-tokens · 보이는 탭 둘/넷(rankLayout = LayoutTabs 같은 계산)에서
//   탭·닫기 단추·액트 넘김 막대·기록 칸이 겹치지 않고 창 안 · 빌드 자리 = 탭 둘 배치
let rankChecks = 0;
{
  const { RANKTAB: R, rankLayout, textWidth } = require('./build/ui-tokens.cjs');
  const rank = read('RootDesk/MyDesk/UI/Windows/RankWindow.mlua');
  const quietLog = console.log;
  console.log = () => {};
  let gb;
  try { gb = UIBuilder.read(path.join(root, 'ui', 'GameHUD' + EXT)); } finally { console.log = quietLog; }
  const T = 'MOD.Core.UITransformComponent', X = 'MOD.Core.TextGUIRendererComponent';
  const fail = (msg) => { bad++; console.log('  ✗ 랭킹 탭: ' + msg); };
  const names = ['TabProgress', 'TabQueen', 'TabDepth', 'TabWeek'];
  const tabW = gb.getComponent('RankWin/TabProgress', T).RectSize.x;
  const rp = [
    ['TabW', tabW], ['TabH', R.h], ['TabTop', -R.top], ['TabGapX', R.gapX], ['TabGapY', R.gapY], ['TabPerRow', R.perRow],
    ['ActBarTop', -R.actBarTop], ['ActBarH', R.actBarH], ['PaperTop', -R.paperTop], ['WinW', R.winW], ['WinH', R.winH], ['RimOut', FRAME.rimOut],
  ];
  for (const [k, v] of rp) { rankChecks++; if (prop(rank, k) !== v) fail(`RankWindow.${k} = ${prop(rank, k)} · 빌더/ui-tokens = ${v}`); }
  const queen = rank.match(/_UIKit:SetText\(self\.Win \.\. "\/TabQueen", "([^"]+)"\)/);
  if (!queen) fail('RankWindow가 TabQueen 글을 넣는 줄을 찾지 못함 (코드가 바뀌었으면 이 검사도 고친다)');
  const texts = names.map((n) => [n, gb.getComponent('RankWin/' + n, X).Text]);
  if (queen) texts.push(['TabQueen(실행 중)', queen[1]]);
  for (const n of names) {
    const t = gb.getComponent('RankWin/' + n, T), x = gb.getComponent('RankWin/' + n, X);
    rankChecks++;
    if (t.RectSize.x !== tabW || t.RectSize.y !== R.h) fail(`${n} 크기 ${t.RectSize.x}×${t.RectSize.y} ≠ ${tabW}×${R.h}`);
    if (x.FontSize !== R.font || x.MaxSize !== R.font) fail(`${n} 글자 ${x.FontSize}/${x.MaxSize} ≠ ${R.font}`);
    if (x.Padding.left !== R.side || x.Padding.right !== R.side) fail(`${n} 글 칸 좌우 여백 ${x.Padding.left}/${x.Padding.right} ≠ 장식 안쪽 ${R.side}`);
    if (R.h - x.Padding.top - x.Padding.bottom >= R.font * 3) fail(`${n} 글 칸 높이 ${R.h - x.Padding.top - x.Padding.bottom}이 두 줄을 받는다 (한 줄 높이로)`);
  }
  for (const [n, s] of texts) {
    rankChecks++;
    const need = textWidth(s, R.font), room = tabW - 2 * R.side;
    if (need > room) fail(`「${s}」(${n}) 글자 ${R.font} 어림 ${need.toFixed(1)} > 글 칸 ${room} — 한 줄에 안 든다`);
  }
  const cl = FRAME.close;
  const actW = gb.getComponent('RankWin/ActBar', T).RectSize.x, paperW = gb.getComponent('RankWin/Paper', T).RectSize.x;
  const overlapR = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.t, b.t) - Math.max(a.b, b.b) > 0.5;
  for (const n of [2, 4]) {
    const lay = rankLayout(n, tabW);
    const rects = lay.tabs.map((p, i) => ({ name: names[i], l: p.x - tabW / 2, r: p.x + tabW / 2, t: p.y, b: p.y - R.h }));
    rects.push({ name: 'BtnClose', l: R.winW / 2 + cl.x - cl.size, r: R.winW / 2 + cl.x, t: cl.y, b: cl.y - cl.size });
    if (n > 2) rects.push({ name: 'ActBar', l: -actW / 2, r: actW / 2, t: lay.actTop, b: lay.actTop - R.actBarH });
    rects.push({ name: 'Paper', l: -paperW / 2, r: paperW / 2, t: lay.paperTop, b: lay.paperTop - R.paperH });
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      rankChecks++;
      if (overlapR(rects[i], rects[j])) fail(`탭 ${n}개 배치: ${rects[i].name} × ${rects[j].name} 겹침`);
    }
    for (const r of rects.filter((q) => q.name.startsWith('Tab'))) {
      rankChecks++;
      if (r.l < -(R.winW / 2 - FRAME.padX) - 0.5 || r.r > R.winW / 2 - FRAME.padX + 0.5) fail(`탭 ${n}개 배치: ${r.name}(x ${r.l}~${r.r})이 창 안쪽 ±${R.winW / 2 - FRAME.padX} 밖`);
    }
    const paper = rects.find((q) => q.name === 'Paper');
    rankChecks++;
    if (paper.b < -lay.winH - 0.5) fail(`탭 ${n}개 배치: 기록 칸 아래 ${paper.b}가 창 바탕(높이 ${lay.winH}) 밖`);
  }
  // 빌드 자리 = 탭 둘 배치 (심연을 숨긴 기본) · 심연 탭은 둘째 줄 자리
  const lay2 = rankLayout(2, tabW), lay4 = rankLayout(4, tabW);
  names.forEach((n, i) => {
    const p = gb.getComponent('RankWin/' + n, T).anchoredPosition, want = lay4.tabs[i];
    rankChecks++;
    if (p.x !== want.x || p.y !== want.y || (i < 2 && (p.x !== lay2.tabs[i].x || p.y !== lay2.tabs[i].y))) fail(`빌드 ${n} 자리 (${p.x},${p.y}) ≠ (${want.x},${want.y})`);
  });
  const ab = gb.getComponent('RankWin/ActBar', T).anchoredPosition.y, pa = gb.getComponent('RankWin/Paper', T).anchoredPosition.y, win = gb.getComponent('RankWin', T).RectSize;
  rankChecks++;
  if (ab !== lay2.actTop || pa !== lay2.paperTop || win.x !== R.winW || win.y !== lay2.winH) fail(`빌드 막대·기록 칸·창 (${ab} · ${pa} · ${win.x}×${win.y}) ≠ 탭 한 줄 배치 (${lay2.actTop} · ${lay2.paperTop} · ${R.winW}×${lay2.winH})`);
}
console.log(`[check_ui_tokens] 규격 ${pairs.length}개 · 창 틀 ${frames.length}개 · 랭킹 탭 ${rankChecks}개, 어긋남 ${bad}건`);
process.exit(bad ? 1 : 0);
