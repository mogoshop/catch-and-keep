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


// ── 랭킹 창 (11-01 결정 2-C 탭 폭 · 11-01 2차 「공백 줄이자 · 캐릭터 작게 · 20위」 — ui-tokens RANKTAB·RANK ↔ RankWindow.LayoutTabs·Layout ↔ 빌드된 RankWin) ──
//   ① RankWindow 배치 값 = ui-tokens (탭 · 창 · 기록 판 · 칸) · RankingSystem.TopCount = RANK.top
//   ② 빌드된 탭 넷: 폭·높이·글자 16·글 칸 여백(양쪽 side · 한 줄 높이) · 글(빌드 글 + RankWindow가 넣는 「보스 처치 시간」)이 글 폭 어림으로 한 줄
//   ③ 빌드 = 기본 배치(rankWinLayout progress): 창 크기·자리 · 테두리 · 기록 판 · 머리 줄 · 막대(꺼짐 · 오른쪽 위) · 목록 · 칸 20(4 × 5 자리) · 칸 안 순위·그림·이름·기록이
//      칸 안에서 서로 안 겹침 · 그림 = UI 아바타 + 옷장(외형 입힘) · 내 순위 줄 조각
//   ④ 탭 둘/넷 × 막대 숨김/보임 4배치: 탭·닫기·기록 판 안 겹침 · 머리 줄·막대·목록·내 순위가 판 안 · 서로 안 겹침 · 공백 없음(판 = 탭 바로 아래 SPACE · 목록 = 머리 줄 바로 아래 gap) ·
//      창 위 끝 고정 · 테두리 아래 끝이 PC 하단 메뉴 줄(Bottom/Menu)·버프 줄(Buffs) 위 SPACE 이상 (메이커 11-01 관찰 2) · 4:3 태블릿(1440×1080)·아이폰 가로 안전영역(1025) 안
//   ⑤ 글 폭: 기록 글 예(성장·심연·보스)·이름 10자가 칸 글 폭에 (어림 · 넘치면 BestFit으로 줄인다 — 최소 글자에서도 든다)
let rankChecks = 0;
{
  const TK = require('./build/ui-tokens.cjs');
  const { RANKTAB: R, RANK: K, rankLayout, rankWinLayout, textWidth, SPACE, NARROW } = TK;
  const rank = read('RootDesk/MyDesk/UI/Windows/RankWindow.mlua');
  const rs = read('RootDesk/MyDesk/Endgame/RankingSystem.mlua');
  const quietLog = console.log;
  console.log = () => {};
  let gb;
  try { gb = UIBuilder.read(path.join(root, 'ui', 'GameHUD' + EXT)); } finally { console.log = quietLog; }
  const T = 'MOD.Core.UITransformComponent', X = 'MOD.Core.TextGUIRendererComponent';
  const fail = (msg) => { bad++; console.log('  ✗ 랭킹 창: ' + msg); };
  const check = (ok, msg) => { rankChecks++; if (!ok) fail(msg); };
  const tr = (p) => gb.getComponent('RankWin' + (p ? '/' + p : ''), T);
  // 고정 앵커 사각형 (부모 사각형 안) — { l, r, b, t }
  const place = (t, P) => {
    if (t.AnchorsMin.x !== t.AnchorsMax.x || t.AnchorsMin.y !== t.AnchorsMax.y) throw new Error('늘이는 앵커는 이 검사가 모른다');
    const ax = P.l + t.AnchorsMin.x * (P.r - P.l), ay = P.b + t.AnchorsMin.y * (P.t - P.b);
    const l = ax + t.anchoredPosition.x - t.Pivot.x * t.RectSize.x, b = ay + t.anchoredPosition.y - t.Pivot.y * t.RectSize.y;
    return { l, r: l + t.RectSize.x, b, t: b + t.RectSize.y };
  };
  const screenRect = (rel) => {   // GameHUD 엔티티의 화면 사각형 (화면 가운데 0)
    let P = { l: -960, r: 960, b: -540, t: 540 };
    const parts = rel.split('/');
    for (let i = 1; i <= parts.length; i++) P = place(gb.getComponent(parts.slice(0, i).join('/'), T), P);
    return P;
  };
  const ov = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.t, b.t) - Math.max(a.b, b.b) > 0.5;
  const inside = (a, P) => a.l >= P.l - 0.5 && a.r <= P.r + 0.5 && a.b >= P.b - 0.5 && a.t <= P.t + 0.5;
  const names = ['TabProgress', 'TabQueen', 'TabDepth', 'TabWeek'];
  const tabW = tr('TabProgress').RectSize.x;
  // ① 실행 중 값 = ui-tokens
  const lay0 = rankWinLayout('progress');
  const props = [
    ['TabW', tabW], ['TabH', R.h], ['TabTop', -R.top], ['TabGapX', R.gapX], ['TabGapY', R.gapY], ['TabPerRow', R.perRow],
    ['WinW', K.winW], ['RimOut', FRAME.rimOut], ['RimTop', K.rimTop], ['PaperTop', -K.paperTop], ['PaperW', K.paperW], ['PaperPad', K.pad], ['PaperGap', K.gap],
    ['PaperBottom', K.bottom], ['HeadH', K.headH], ['ActBarW', K.actBarW], ['ActBarH', K.actBarH], ['ListW', K.listW], ['ListH', K.listH], ['MineH', K.mineH], ['TopCount', K.top],
  ];
  for (const [k, v] of props) check(prop(rank, k) === v, `RankWindow.${k} = ${prop(rank, k)} · 빌더/ui-tokens = ${v}`);
  check(prop(rs, 'TopCount') === K.top && K.top === K.cols * K.rows, `RankingSystem.TopCount ${prop(rs, 'TopCount')} = 칸 ${K.cols} × ${K.rows} = RANK.top ${K.top}`);
  check(prop(rs, 'NameScanMax') === K.top + 25, `RankingSystem.NameScanMax ${prop(rs, 'NameScanMax')} = 첫 묶음 ${K.top} + 한 쪽 25`);
  // ② 탭
  const queen = rank.match(/_UIKit:SetText\(self\.Win \.\. "\/TabQueen", "([^"]+)"\)/);
  check(!!queen, 'RankWindow가 TabQueen 글을 넣는 줄을 찾지 못함 (코드가 바뀌었으면 이 검사도 고친다)');
  const texts = names.map((n) => [n, gb.getComponent('RankWin/' + n, X).Text]);
  if (queen) texts.push(['TabQueen(실행 중)', queen[1]]);
  for (const n of names) {
    const t = tr(n), x = gb.getComponent('RankWin/' + n, X);
    check(t.RectSize.x === tabW && t.RectSize.y === R.h, `${n} 크기 ${t.RectSize.x}×${t.RectSize.y} ≠ ${tabW}×${R.h}`);
    check(x.FontSize === R.font && x.MaxSize === R.font, `${n} 글자 ${x.FontSize}/${x.MaxSize} ≠ ${R.font}`);
    check(x.Padding.left === R.side && x.Padding.right === R.side, `${n} 글 칸 좌우 여백 ${x.Padding.left}/${x.Padding.right} ≠ 장식 안쪽 ${R.side}`);
    check(R.h - x.Padding.top - x.Padding.bottom < R.font * 3, `${n} 글 칸 높이 ${R.h - x.Padding.top - x.Padding.bottom}이 두 줄을 받는다 (한 줄 높이로)`);
  }
  for (const [n, s] of texts) {
    const need = textWidth(s, R.font), room = tabW - 2 * R.side;
    check(need <= room, `「${s}」(${n}) 글자 ${R.font} 어림 ${need.toFixed(1)} > 글 칸 ${room} — 한 줄에 안 든다`);
  }
  const four = rankLayout(4, tabW);
  names.forEach((n, i) => {
    const p = tr(n).anchoredPosition, want = four.tabs[i];
    check(p.x === want.x && p.y === want.y, `빌드 ${n} 자리 (${p.x},${p.y}) ≠ 탭 넷 한 줄 (${want.x},${want.y})`);
  });
  check(four.rows === 1 && rankLayout(2, tabW).rows === 1, `탭 넷도 한 줄이어야 한다 (perRow ${R.perRow})`);
  // ③ 빌드 = 기본 배치 (조각이 없으면 — 예전 빌드 등 — 던지지 않고 한 건으로 센다)
  try {
  const win = tr(''), rim = tr('Rim'), paper = tr('Paper');
  check(win.RectSize.x === K.winW && win.RectSize.y === lay0.winH && win.anchoredPosition.x === 0 && win.anchoredPosition.y === lay0.winY, `빌드 창 ${win.RectSize.x}×${win.RectSize.y} @${win.anchoredPosition.y} ≠ ${K.winW}×${lay0.winH} @${lay0.winY}`);
  check(rim.RectSize.x === lay0.rim[0] && rim.RectSize.y === lay0.rim[1], `빌드 테두리 ${rim.RectSize.x}×${rim.RectSize.y} ≠ ${lay0.rim.join('×')}`);
  check(paper.RectSize.x === K.paperW && paper.RectSize.y === lay0.paperH && paper.anchoredPosition.y === -K.paperTop, `빌드 기록 판 ${paper.RectSize.x}×${paper.RectSize.y} @${paper.anchoredPosition.y} ≠ ${K.paperW}×${lay0.paperH} @${-K.paperTop}`);
  check(K.paperTop === R.top + R.h + SPACE, `기록 판 위 끝 ${K.paperTop} = 탭 아래 끝 + SPACE (공백 없음)`);
  const P0 = { l: 0, r: K.paperW, b: 0, t: lay0.paperH };   // 기록 판 안 (왼쪽 아래 0)
  const inPaper = (rel) => place(tr('Paper/' + rel), P0);
  const head = inPaper('Head'), bar = inPaper('ActBar'), list = inPaper('List'), mine = inPaper('Mine');
  check(gb.find('RankWin/Paper/ActBar').jsonString.enable === false, '액트 넘김 막대는 빌드에서 꺼 둔다 (심연 탭에서만 RankWindow.Layout이 켠다)');
  check(!gb.find('RankWin/ActBar'), '예전 자리(탭 아래 따로 둔 막대 RankWin/ActBar)가 남아 있다');
  check(Math.abs(bar.r - (K.paperW - K.pad)) < 0.5 && Math.abs(bar.t - (lay0.paperH - K.pad)) < 0.5 && bar.r - bar.l === K.actBarW && bar.t - bar.b === K.actBarH, `막대 ${JSON.stringify(bar)} ≠ 판 오른쪽 위 pad 안 ${K.actBarW}×${K.actBarH}`);
  check(Math.abs(head.t - (lay0.paperH - K.pad)) < 0.5 && head.l === K.pad && head.t - head.b === K.headH, `머리 줄 ${JSON.stringify(head)} ≠ 판 위 pad · 높이 ${K.headH}`);
  check(Math.abs(list.t - (head.b - K.gap)) < 0.5 && list.r - list.l === K.listW && list.t - list.b === K.listH, `목록 위 끝 ${list.t} = 머리 줄 아래 ${head.b} − gap ${K.gap} (공백 없음) · ${K.listW}×${K.listH}`);
  check(mine.b === K.pad && mine.l === K.pad && Math.abs(mine.t - (list.b - K.gap)) < 0.5, `내 순위 줄 ${JSON.stringify(mine)} = 판 아래 pad · 목록 아래 gap`);
  const LP = { l: 0, r: K.listW, b: 0, t: K.listH };
  const cells = [];
  for (let i = 1; i <= K.top; i++) {
    const c = 'Paper/List/R' + i;
    if (!gb.find('RankWin/' + c)) { check(false, `칸 R${i} 없음`); continue; }
    const cr = place(tr(c), LP);
    cells.push(cr);
    const col = (i - 1) % K.cols, row = Math.floor((i - 1) / K.cols);
    check(Math.abs(cr.l - col * (K.cellW + K.gapX)) < 0.5 && Math.abs(cr.t - (K.listH - row * (K.cellH + K.gapY))) < 0.5 && cr.r - cr.l === K.cellW && cr.t - cr.b === K.cellH, `칸 R${i} 자리 ≠ ${row + 1}줄 ${col + 1}칸 (${K.cellW}×${K.cellH})`);
    check(inside(cr, LP), `칸 R${i}이 목록 밖`);
    const CP = { l: 0, r: K.cellW, b: 0, t: K.cellH };
    const parts = {};
    for (const k of ['Rank', 'Avatar', 'Name', 'Value']) {
      parts[k] = place(tr(`${c}/${k}`), CP);
      check(inside(parts[k], CP), `칸 R${i}/${k} ${JSON.stringify(parts[k])}가 칸 ${K.cellW}×${K.cellH} 밖`);
    }
    for (const [a, b] of [['Rank', 'Avatar'], ['Rank', 'Name'], ['Rank', 'Value'], ['Avatar', 'Name'], ['Avatar', 'Value'], ['Name', 'Value']]) check(!ov(parts[a], parts[b]), `칸 R${i}: ${a} ↔ ${b} 겹침`);
    const av = gb.find(`RankWin/${c}/Avatar`).componentNames;
    check(av.includes('MOD.Core.AvatarGUIRendererComponent') && av.includes('MOD.Core.CostumeManagerComponent'), `칸 R${i}/Avatar = UI 아바타 + 옷장 (CharSelectWindow.Dress가 외형을 입힌다)`);
    check(gb.find('RankWin/' + c).jsonString.enable === false, `칸 R${i}은 빌드에서 꺼 둔다 (기록이 있는 칸만 OnData가 켠다)`);
  }
  for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) check(!ov(cells[i], cells[j]), `칸 R${i + 1} ↔ R${j + 1} 겹침`);
  {
    const MP = { l: 0, r: K.listW, b: 0, t: K.mineH };
    const parts = {};
    for (const k of ['Label', 'Rank', 'Avatar', 'Name', 'Value']) { parts[k] = place(tr('Paper/Mine/' + k), MP); check(inside(parts[k], MP), `내 순위 줄 ${k}이 줄 밖`); }
    const ks = Object.keys(parts);
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) check(!ov(parts[ks[i]], parts[ks[j]]), `내 순위 줄 ${ks[i]} ↔ ${ks[j]} 겹침`);
    // 창 아래 모서리 장식(메이커 B7 실측 약 44~50)과 떨어지게: 줄 안 가장 왼쪽 글·가장 오른쪽 글이 바탕 가장자리에서 cornerClear 이상
    const leftmost = Math.min(...ks.map((k) => parts[k].l)), rightmost = Math.max(...ks.map((k) => parts[k].r));
    check(K.edge + K.pad + leftmost >= K.cornerClear && K.edge + K.pad + (K.listW - rightmost) >= K.cornerClear, `내 순위 줄 글이 창 바탕 가장자리에서 ${K.edge + K.pad + leftmost} / ${K.edge + K.pad + (K.listW - rightmost)} — 모서리 장식 ${K.cornerClear} 안`);
    check(gb.find('RankWin/Paper/Mine/Avatar').componentNames.includes('MOD.Core.CostumeManagerComponent'), '내 순위 줄 그림 = UI 아바타 + 옷장');
  }
  } catch (e) { check(false, `빌드된 RankWin이 2차 구조(기록 판 머리 줄·막대·칸 20·내 순위 줄)와 다르다 — ${e.message}`); }
  // ④ 탭 둘/넷 × 막대 숨김/보임 — 창 기준 (창 바탕 위 가운데 0, 위 +) → 화면
  const menu = screenRect('Bottom/Menu'), buffs = screenRect('Buffs');
  const cl = FRAME.close;
  const states = [];
  for (const n of [2, 4]) for (const kind of ['progress', 'depth']) {
    const lay = rankWinLayout(kind), tabs = rankLayout(n, tabW);
    const name = `탭 ${n === 2 ? '둘' : '넷'} · 막대 ${lay.paged ? '보임' : '숨김'}`;
    const top = lay.winY + lay.winH / 2;   // 창 바탕 위 끝 (화면)
    const rects = tabs.tabs.map((p, i) => ({ name: names[i], l: p.x - tabW / 2, r: p.x + tabW / 2, t: p.y, b: p.y - R.h }));
    rects.push({ name: 'BtnClose', l: K.winW / 2 + cl.x - cl.size, r: K.winW / 2 + cl.x, t: cl.y, b: cl.y - cl.size });
    const pr = { name: 'Paper', l: -K.paperW / 2, r: K.paperW / 2, t: -lay.paperTop, b: -lay.paperTop - lay.paperH };
    rects.push(pr);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) check(!ov(rects[i], rects[j]), `${name}: ${rects[i].name} × ${rects[j].name} 겹침`);
    for (const r of rects.filter((q) => q.name.startsWith('Tab'))) check(r.l >= -(K.winW / 2 - FRAME.padX) - 0.5 && r.r <= K.winW / 2 - FRAME.padX + 0.5, `${name}: ${r.name}(x ${r.l}~${r.r})이 창 안쪽 ±${K.winW / 2 - FRAME.padX} 밖`);
    check(Math.abs(pr.t - (-(R.top + R.h) - SPACE)) < 0.5, `${name}: 기록 판 위 끝 ${pr.t} = 탭 아래 끝 − SPACE (공백 없음)`);
    check(Math.abs(pr.b - (-lay.winH + K.bottom)) < 0.5, `${name}: 기록 판 아래 ↔ 창 바탕 아래 ${K.bottom}`);
    // 기록 판 안: 머리 줄(막대 보임이면 막대 높이 · 왼쪽 글 + 오른쪽 막대) → 목록 → 내 순위
    const PP = { l: 0, r: K.paperW, b: 0, t: lay.paperH };
    const hd = { name: 'Head', l: K.pad, r: K.pad + (lay.paged ? K.listW - K.actBarW - K.gap : K.listW), t: lay.paperH - K.pad, b: lay.paperH - K.pad - lay.headH };
    const inner = [hd, { name: 'List', l: K.pad, r: K.pad + K.listW, t: lay.paperH - lay.listTop, b: lay.paperH - lay.listTop - K.listH }, { name: 'Mine', l: K.pad, r: K.pad + K.listW, b: K.pad, t: K.pad + K.mineH }];
    if (lay.paged) inner.push({ name: 'ActBar', l: K.paperW - K.pad - K.actBarW, r: K.paperW - K.pad, t: lay.paperH - K.pad, b: lay.paperH - K.pad - K.actBarH });
    for (const r of inner) check(inside(r, PP), `${name}: ${r.name}이 기록 판 밖`);
    for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) check(!ov(inner[i], inner[j]), `${name}: ${inner[i].name} × ${inner[j].name} 겹침`);
    check(Math.abs(inner[1].t - (hd.b - K.gap)) < 0.5 && Math.abs(inner[2].t - (inner[1].b - K.gap)) < 0.5, `${name}: 머리 줄 → 목록 → 내 순위 사이 gap ${K.gap}뿐 (공백 없음)`);
    // 화면: 창 위 끝 고정 · 하단 메뉴 줄 · 버프 줄 위 · 좁은 화면 안
    const rimR = { l: -lay.rim[0] / 2, r: lay.rim[0] / 2, t: top + FRAME.rimOut, b: top - lay.winH - FRAME.rimOut };
    check(Math.abs(rimR.t - K.rimTop) < 0.5, `${name}: 테두리 위 끝 ${rimR.t} = RANK.rimTop ${K.rimTop} (고정)`);
    check(rimR.b >= menu.t + SPACE - 0.5, `${name}: 테두리 아래 ${rimR.b} — 하단 메뉴 줄 위 끝 ${menu.t} + SPACE 위여야 (메이커 11-01 관찰 2)`);
    if (rimR.l < buffs.r && rimR.r > buffs.l) check(rimR.b >= buffs.t + SPACE - 0.5, `${name}: 테두리 아래 ${rimR.b} — 버프 줄 위 끝 ${buffs.t} + SPACE 위여야`);
    check(rimR.r <= NARROW.visibleW / 2 - NARROW.edge + 0.5 && rimR.t <= NARROW.visibleH / 2 - NARROW.edge + 0.5 && rimR.b >= -NARROW.visibleH / 2 + NARROW.edge - 0.5, `${name}: 4:3 화면 ${NARROW.visibleW}×${NARROW.visibleH} − 가장자리 ${NARROW.edge} 밖`);
    check(rimR.t <= 1025 / 2 - NARROW.edge + 0.5 && rimR.b >= -1025 / 2 + NARROW.edge - 0.5, `${name}: 아이폰 가로 안전영역(1025) − 가장자리 ${NARROW.edge} 밖`);
    check(K.winW <= NARROW.bodyMaxW, `창 바탕 폭 ${K.winW} ≤ 좁은 화면 상한 ${NARROW.bodyMaxW} (WindowFit 없이 들어간다)`);
    states.push(`${name} 창 ${K.winW}×${lay.winH} 테두리 ${rimR.t}~${rimR.b} (메뉴 ${menu.t} · 버프 ${buffs.t})`);
  }
  // ⑤ 글 폭 (어림): 칸 기록 · 이름 · 머리 줄
  for (const s of ['Lv60 · 지옥 액트 4', 'Lv60 · 악몽 완료', '123층 · 33분 05초', '99999초']) check(textWidth(s, K.font.value) <= K.textW + 0.5, `칸 기록 「${s}」 글자 ${K.font.value} 어림 ${textWidth(s, K.font.value).toFixed(1)} > 글 폭 ${K.textW}`);
  check(textWidth('가나다라마바사아자차', K.font.min) <= K.textW, `이름 10자가 최소 글자 ${K.font.min}에서도 칸 글 폭 ${K.textW}에 든다`);
  check(textWidth('재의 왕 고르바스 최단 처치  (노말)', K.font.head) <= K.listW, '보스 판 제목이 머리 줄에 든다');
  check(textWidth('최고 층 · 같은 층이면 빠른 순  (노말)', K.font.head) <= K.listW - K.actBarW - K.gap, '심연 판 제목이 막대 왼쪽 머리 줄에 든다');
  check(textWidth('피의 달 — 몬스터 생명·공격 +15% · 이동 +10% · 그림자 추출 +8%p', K.font.min) <= K.listW - K.actBarW - K.gap, '이번 주 규칙 가장 긴 줄이 최소 글자로 막대 왼쪽 머리 줄에 든다');
  check(K.actBarH >= 3 * K.font.min * 1.2, `이번 주 머리 줄 세 줄(규칙 제목 + 규칙 둘)이 막대 높이 ${K.actBarH}에 든다 (최소 글자 ${K.font.min})`);
  if (process.argv.includes('-v')) for (const s of states) console.log('  랭킹 창 ' + s);
}
console.log(`[check_ui_tokens] 규격 ${pairs.length}개 · 창 틀 ${frames.length}개 · 랭킹 창 ${rankChecks}개, 어긋남 ${bad}건`);
process.exit(bad ? 1 : 0);
