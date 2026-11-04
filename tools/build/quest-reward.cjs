'use strict';
// 퀘스트 완료 보상 연출 (QuestRewardHUD · 11-03 D안 — 사용자 「완료 버튼 이후 받을 보상을 좀 더 극적으로」).
//   컨트롤러는 RootDesk/MyDesk/UI/Windows/QuestRewardWindow.mlua (_QuestRewardWindow). 보상 지급은 서버 PlayerQuest.TurnIn 그대로 — 이 화면은 보여 주기만.
//   ① Band  : 보통 퀘스트 — NPC 대화 창(GameHUD/NpcWin) 단추 줄 왼쪽 빈자리에 보상 칩 줄(아이콘 + 수량). 실행 중 NpcWin 자리에 맞춰 옮긴다
//   ② Plate : 큰 퀘스트 — 화면 가운데 결산 판. 습격 격퇴 판(ui_raid_repelled_plate 9조각)과 같은 틀 + 꽉 찬 어두운 바탕(큰 판 바탕 비침 방지)
//             보상 카드(부위 고르기 카드와 같은 sk_offer_card_new) 최대 4장 + 경험치 막대(lib progressBar — 업적 막대) + 「받기」
//   ③ Dim · Pillar : 액트 마지막 퀘스트 — 결산 판 앞 0.6초 어두워짐 + 금빛 빛기둥(레벨업 빛기둥 fx_levelup_1~8 · 바닥 빛줄기 fx_loot_beam 재사용)
//   ④ Fly   : 받기 뒤 아이콘이 가방 단추로 날아가는 층 + 골드 숫자 굴림(Count)
//   여백·단추는 ui-tokens.cjs 값만 쓴다. 따로 그룹이라 GameHUD를 다시 만들지 않는다 (그룹 순서 = ui-order.cjs 맨 끝)
const { UIBuilder, P, load, progressBar } = require('./lib.cjs');
const T = require('./ui-tokens.cjs');
const U = 'u' + 'i';

const ROWS = load('ui_icons');
const row = (key) => { const r = ROWS.find((x) => x.key === key); if (!r) throw new Error(`ui_icons.csv에 ${key} 없음`); return r; };
const K = (key) => row(key).ruid;
const outline = { outline: true, outline_color: '#2D2D2D' };
const GOLD_TEXT = '#E6C88A';      // RaidPlate 제목 · 알림 판 제목과 같은 금빛
const BODY_TEXT = '#DDD4C3';

// 결산 판 규격 (ui-tokens FRAME 여백 기준). 카드 = 부위 고르기 카드(340×404)를 비율 그대로 0.705배
// 11-04 메이커 확인: 판 틀(ui_raid_repelled_plate) 위 금빛 띠가 위에서 약 20~45에 그려져 제목(30)을 가로질렀다 → 제목·부제·카드·경험치 줄을 띠 아래로 내림
const PLATE = { w: 1180, h: 640, titleTop: 58, subTop: 104, cardsTop: 146 };
const CARD = { w: 240, h: 285, gap: T.FRAME.gap, text: 156, max: 4 };
const EXP = { top: 446, barW: 720, barH: 20, rowH: 44 };
const BAND = { w: 1000, h: T.BUTTON.h, chipH: 64, chips: 5, icon: 44 };
const ORDER = 19;   // ui-order.cjs ORDER 맨 끝 (확인 창보다 위 — 결산 판이 떠 있는 동안 이야기 카드는 창이 닫힐 때까지 기다린다)

function build() {
  const file = P[U]('QuestRewardHUD');
  const b = require('fs').existsSync(file) ? UIBuilder.load(file) : new UIBuilder('QuestRewardHUD', ORDER, true);
  b.patchComponent('/', 'MOD.Core.UIGroupComponent', { GroupOrder: ORDER, DefaultShow: true });
  b.patch('/', { display_order: ORDER });
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });

  // ── ③ 어두워짐 · 빛기둥 (맨 아래에 깔린다) ──
  b.panel('SafeArea/Dim', { anchor: 'middle-center', rect_size: [4000, 3000], color: { r: 0, g: 0, b: 0, a: 0 }, raycast: true, enable: false });
  b.empty('SafeArea/Pillar', { anchor: 'middle-center', pos: [0, 0], rect_size: [420, 900], enable: false });
  b.sprite('SafeArea/Pillar/Beam', { anchor: 'middle-center', pos: [0, 0], rect_size: [300, 1060], image_ruid: K('fx_loot_beam'), color: { r: 1, g: 0.82, b: 0.42, a: 0.85 }, sprite_type: 0 });
  b.sprite('SafeArea/Pillar/Glow', { anchor: 'middle-center', pos: [0, -260], rect_size: [520, 200], image_ruid: K('fx_loot_glow'), color: { r: 1, g: 0.85, b: 0.5, a: 0.8 }, sprite_type: 0 });
  b.sprite('SafeArea/Pillar/Frame', { anchor: 'middle-center', pos: [0, 40], rect_size: [400, 800], image_ruid: K('fx_levelup_1'), color: { r: 1, g: 0.9, b: 0.6, a: 1 }, sprite_type: 0 });
  for (const n of ['Beam', 'Glow', 'Frame']) b.patchComponent(`SafeArea/Pillar/${n}`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });

  // ── ② 결산 판 ──
  const p = 'SafeArea/Plate';
  b.panel(p, { anchor: 'middle-center', pos: [0, 10], rect_size: [PLATE.w, PLATE.h], image_ruid: K('gauge_fill'), color: T.COLOR.windowBg, sprite_type: 0, raycast: true, enable: false });
  b.sprite(`${p}/Rim`, { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, 0], rect_size: [PLATE.w + T.FRAME.rimOut * 2, PLATE.h + T.FRAME.rimOut * 2], image_ruid: K('ui_raid_repelled_plate'), color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(`${p}/Rim`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  // 제목 이름을 Title이 아닌 Heading으로: 결산 판은 공용 창 틀(제목 26·닫기)이 아니라 습격 격퇴 판 계열이다 (check_ui_tokens 창 틀 규칙 대상 밖)
  b.text(`${p}/Heading`, '퀘스트 완료', { size: 34, bold: true, color: GOLD_TEXT, anchor: 'top-center', pivot: [0.5, 1], pos: [0, -PLATE.titleTop], rect_size: [PLATE.w - 260, 44], alignment: 4, ...outline, outline_width: 0.2 });
  b.text(`${p}/Sub`, '', { size: 24, color: BODY_TEXT, anchor: 'top-center', pivot: [0.5, 1], pos: [0, -PLATE.subTop], rect_size: [PLATE.w - 260, 32], alignment: 4, bestfit: true, min_size: 18, max_size: 24, ...outline, outline_width: 0.15 });
  const c = T.FRAME.close;
  b.button(`${p}/BtnClose`, '', { anchor: 'top-right', pivot: [1, 1], pos: [c.x, c.y], rect_size: [c.size, c.size], image_ruid: K('btn_close'), bg_color: '#FFFFFF', sprite_type: 1 });
  // 카드 칸: 보상 수만큼 실행 중 가운데 정렬 (QuestRewardWindow.LayoutCards)
  b.empty(`${p}/Cards`, { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -PLATE.cardsTop], rect_size: [CARD.max * CARD.w + (CARD.max - 1) * CARD.gap, CARD.h] });
  for (let i = 1; i <= CARD.max; i++) {
    const k = `${p}/Cards/K${i}`;
    const x = (i - 1) * (CARD.w + CARD.gap);
    b.sprite(k, { anchor: 'top-left', pivot: [0.5, 0.5], pos: [x + CARD.w / 2, -CARD.h / 2], rect_size: [CARD.w, CARD.h], image_ruid: K('sk_offer_card_new'), color: '#FFFFFF', sprite_type: 0, enable: false });
    b.patchComponent(k, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });
    b.text(`${k}/Kind`, '', { size: 18, bold: true, color: '#F0D9A0', anchor: 'top-center', pos: [0, -34], rect_size: [CARD.text, 24], alignment: 4, bestfit: true, min_size: 13, max_size: 18, ...outline });
    b.sprite(`${k}/Icon`, { anchor: 'top-center', pos: [0, -60], rect_size: [64, 64], color: '#FFFFFF', sprite_type: 0 });
    b.patchComponent(`${k}/Icon`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });
    b.text(`${k}/Glyph`, '', { size: 30, bold: true, color: '#9FE07A', anchor: 'top-center', pos: [0, -70], rect_size: [CARD.text, 44], alignment: 4, ...outline, outline_width: 0.25, enable: false });
    b.text(`${k}/Value`, '', { size: 26, bold: true, color: T.COLOR.title, anchor: 'top-center', pos: [0, -134], rect_size: [CARD.text, 34], alignment: 4, bestfit: true, min_size: 16, max_size: 26, ...outline });
    b.text(`${k}/Note`, '', { size: 15, color: T.COLOR.body, anchor: 'top-center', pos: [0, -172], rect_size: [CARD.text, 46], alignment: 1, bestfit: true, min_size: 12, max_size: 15 });
  }
  // 경험치 줄: Lv 글 | 업적 막대(lib progressBar — 민짜 막대 금지) | 수치 · 레벨 업 글
  const e = `${p}/Exp`;
  b.empty(e, { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -EXP.top], rect_size: [PLATE.w - T.FRAME.padX * 2, EXP.rowH] });
  b.text(`${e}/Lv`, '', { size: 22, bold: true, color: T.COLOR.title, anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], rect_size: [140, EXP.rowH], alignment: 3, ...outline });
  progressBar(b, `${e}/Bar`, { anchor: 'middle-center', pos: [0, 0], rect_size: [EXP.barW, EXP.barH] });
  b.text(`${e}/Value`, '', { size: 20, color: T.COLOR.body, anchor: 'middle-right', pivot: [1, 0.5], pos: [0, 0], rect_size: [180, EXP.rowH], alignment: 5, bestfit: true, min_size: 14, max_size: 20, ...outline });
  b.text(`${e}/Up`, 'LEVEL UP', { size: 26, bold: true, color: '#FFE15A', anchor: 'middle-center', pos: [0, 26], rect_size: [300, 36], alignment: 4, ...outline, outline_width: 0.25, enable: false });
  b.button(`${p}/BtnGet`, '받기', { anchor: 'bottom-center', pivot: [0.5, 0], pos: [0, T.FRAME.buttonBottom], rect_size: [300, T.BUTTON.h], font_size: T.BUTTON.fontMain, color: '#F4E2B0', image_ruid: K('btn_frame'), bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1 });
  b.patchComponent(`${p}/BtnGet`, 'MOD.Core.TextGUIRendererComponent', T.buttonText(T.BUTTON.fontMain));

  // ── ① 보상 칩 줄 (NPC 대화 창 단추 줄 왼쪽) ──
  const bd = 'SafeArea/Band';
  b.empty(bd, { anchor: 'bottom-center', pivot: [0.5, 0], pos: [-100, 200 + T.FRAME.buttonBottom], rect_size: [BAND.w, BAND.h], enable: false });
  b.text(`${bd}/Label`, '보상', { size: 22, bold: true, color: T.COLOR.dim, anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], rect_size: [64, BAND.h], alignment: 3, ...outline });
  const plate = row(T.PLATE.key);
  for (let i = 1; i <= BAND.chips; i++) {
    const ch = `${bd}/C${i}`;
    b.panel(ch, { anchor: 'middle-left', pivot: [0, 0.5], pos: [72 + (i - 1) * 180, 0], rect_size: [170, BAND.chipH], image_ruid: plate.ruid, color: '#B8AE9A', sprite_type: 1, enable: false });
    b.sprite(`${ch}/Icon`, { anchor: 'middle-left', pivot: [0.5, 0.5], pos: [T.PLATE.rim + T.PLATE.pad + BAND.icon / 2, 0], rect_size: [BAND.icon, BAND.icon], color: '#FFFFFF', sprite_type: 0 });
    b.patchComponent(`${ch}/Icon`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });
    b.text(`${ch}/Glyph`, '', { size: 18, bold: true, color: '#9FE07A', anchor: 'middle-left', pivot: [0.5, 0.5], pos: [T.PLATE.rim + T.PLATE.pad + BAND.icon / 2, 0], rect_size: [BAND.icon + 8, BAND.icon], alignment: 4, ...outline, enable: false });
    b.text(`${ch}/Text`, '', { size: 21, bold: true, color: T.COLOR.title, anchor: 'middle-left', pivot: [0, 0.5], pos: [T.PLATE.rim + T.PLATE.pad + BAND.icon + T.PLATE.gap, 0], rect_size: [110, BAND.chipH - 8], alignment: 3, ...outline });
  }

  // ── ④ 날아가는 아이콘 · 골드 굴림 (맨 위) ──
  b.empty('SafeArea/Fly', { anchor: 'middle-center', pos: [0, 0], rect_size: [1920, 1080] });
  for (let i = 1; i <= 6; i++) {
    b.sprite(`SafeArea/Fly/I${i}`, { anchor: 'middle-center', pos: [0, 0], rect_size: [56, 56], color: '#FFFFFF', sprite_type: 0, enable: false });
    b.patchComponent(`SafeArea/Fly/I${i}`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });
  }
  b.text('SafeArea/Fly/Count', '', { size: 26, bold: true, color: '#FFE15A', anchor: 'middle-center', pos: [0, 0], rect_size: [360, 40], alignment: 4, ...outline, outline_width: 0.25, enable: false });

  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

function run() { console.log(`  UI: QuestRewardHUD ${build()}개 엔티티`); }
if (require.main === module) run();
module.exports = { run, PLATE, CARD, EXP, BAND };
