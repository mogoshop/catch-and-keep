'use strict';
// 함께 하는 이유 UI (기획서 39 §7 · 결정 #12A · #14A · 10-29) — CoopHUD 그룹.
//   RescueBar       : 파티 구출 — 구출하는 쪽 머리 위 3초 진행 막대 (화면 좌표로 따라다닌다 · RescueHUD.mlua)
//   SafeArea/Downed : 쓰러진 쪽 안내 판 「파티원이 오면 일어날 수 있다」 + 구출 진행 막대 + 「마을에서 부활」
//   SafeArea/BoardWin: 마을 게시판 창 — 탭 「모집 판」(파티 찾는 중 켜기/끄기 · 목록 5줄 · 초대) / 「오늘의 기록」(스크롤 글)
// 컨트롤러: RootDesk/MyDesk/UI/Hud/RescueHUD.mlua · UI/Windows/TownBoardWindow.mlua. 진행 막대는 lib.progressBar(업적 막대) 양식, 단추 88px 이상, 여백은 ui-tokens.
// 그림은 기존 테마(win_frame · btn_frame · win_content) — 코덱스 게시판 그림(기획서 39 부록 C ⑦) 전까지 임시. 글귀도 임시 (승인 전).
const fs = require('fs');
const { UIBuilder, P, load, progressBar } = require('./lib.cjs');
const T = require('./ui-tokens.cjs');

const ICONS = load('ui_icons');
const K = Object.fromEntries(ICONS.map((r) => [r.key, r.ruid]));
const part = (key) => {
  const r = ICONS.find((x) => x.key === key);
  if (!r) throw new Error(`ui_icons.csv에 ${key} 없음`);
  return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) };
};
const C = { gold: '#E6DCC6', title: '#F6E3B0', dim: '#9C9488', white: '#FFFFFF' };
const outline = { outline: true, outline_color: '#2D2D2D' };
const SOLID = { r: 0.045, g: 0.04, b: 0.055, a: 1 };

function btn(b, name, text, opts) {
  const o = { font_size: T.BUTTON.font, color: C.gold, image_ruid: K.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, ...opts };
  b.button(name, text, o);
  b.patchComponent(name, 'MOD.Core.TextGUIRendererComponent', T.buttonText(o.font_size));
}

// 창 틀: 꽉 찬 어두운 바탕(큰 창 뒤가 비치지 않게 gauge_fill) + 테두리 + 제목 + 닫기
function frame(b, name, size, title) {
  b.panel(name, { anchor: 'middle-center', pos: [0, 0], rect_size: size, color: SOLID, sprite_type: 0, raycast: true, enable: false });
  b.patchComponent(name, 'MOD.Core.SpriteGUIRendererComponent', { ImageRUID: { DataId: K.gauge_fill }, Type: 0, Color: SOLID });
  const rim = T.FRAME.rimOut;
  b.sprite(`${name}/Rim`, { anchor: 'middle-center', pos: [0, 0], rect_size: [size[0] + rim * 2, size[1] + rim * 2], image_ruid: K.win_frame, color: C.white, sprite_type: 1 });
  b.patchComponent(`${name}/Rim`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(`${name}/Title`, title, { size: T.FRAME.titleSize, bold: true, color: C.title, anchor: 'top-center', pos: [0, -T.FRAME.titleTop], rect_size: [size[0] - 260, T.FRAME.titleH], alignment: 4, ...outline });
  b.button(`${name}/BtnClose`, '', { anchor: 'top-right', pos: [-12, -8], rect_size: [88, 88], image_ruid: K.btn_close, bg_color: '#FFFFFF', sprite_type: 1 });
}

// 스크롤 글 상자 (ui.cjs kit.scrollText와 같은 모양 — UIKit.SetScrollText가 채운다)
function scrollText(b, name, pos, size, textOpts) {
  const w = size[0] - 40;
  b.scrollLayout(name, { anchor: 'top-left', pivot: [0, 1], pos, rect_size: size, layout_type: 1, use_scroll: true, padding: [0, 18, 0, 8], scroll_bar_visible: 1, scroll_bar_thickness: 10, scroll_bar_bg_color: { r: 0.14, g: 0.12, b: 0.17, a: 0.6 }, scroll_bar_handle_color: { r: 0.6, g: 0.49, b: 0.3, a: 1 } });
  b.empty(`${name}/Body`, { anchor: 'top-left', pivot: [0, 1], pos: [0, 0], rect_size: [w, size[1]] });
  b.text(`${name}/Body/Text`, '', { alignment: 0, anchor: 'top-left', pivot: [0, 1], pos: [0, 0], rect_size: [w, size[1]], overflow: 0, ...textOpts });
}

function buildRescue(b) {
  // 구출하는 쪽 머리 위: 이름 + 진행 막대 (RescueHUD가 매 프레임 머리 위로 옮긴다)
  b.empty('RescueBar', { anchor: 'middle-center', pos: [0, 120], rect_size: [260, 64], enable: false });
  b.text('RescueBar/Label', '', { size: 20, bold: true, color: C.title, anchor: 'top-center', pos: [0, 0], rect_size: [260, 30], alignment: 4, ...outline });
  progressBar(b, 'RescueBar/Track', { anchor: 'bottom-center', pivot: [0.5, 0], pos: [0, 6], rect_size: [220, 16] });

  // 쓰러진 쪽 안내 판 (위쪽 가운데 — 아래 HUD·채팅을 가리지 않게)
  const d = 'SafeArea/Downed';
  const W = 720, H = T.FRAME.contentTop + 40 + 12 + 30 + 12 + 16 + 12 + T.BUTTON.h + T.FRAME.padBottom;
  b.panel(d, { anchor: 'top-center', pos: [0, -150], rect_size: [W, H], ...part('win_panel'), sprite_type: 1, raycast: true, enable: false });
  b.sprite(`${d}/Rim`, { anchor: 'middle-center', pos: [0, 0], rect_size: [W + T.FRAME.rimOut * 2, H + T.FRAME.rimOut * 2], image_ruid: K.win_frame, color: C.white, sprite_type: 1 });
  b.patchComponent(`${d}/Rim`, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(`${d}/Title`, '쓰러졌다', { size: T.FRAME.titleSize, bold: true, color: C.title, anchor: 'top-center', pos: [0, -T.FRAME.titleTop], rect_size: [W - 120, T.FRAME.titleH], alignment: 4, ...outline });
  const x = T.FRAME.padX;
  let y = T.FRAME.contentTop;
  b.text(`${d}/Text`, '파티원이 곁에 오면 일어날 수 있다', { size: 22, color: C.gold, anchor: 'top-left', pivot: [0, 1], pos: [x, -y], rect_size: [W - x * 2, 40], alignment: 3, bestfit: true, min_size: 16, max_size: 22, ...outline });
  y += 40 + 12;
  b.text(`${d}/Help`, '', { size: 19, color: C.dim, anchor: 'top-left', pivot: [0, 1], pos: [x, -y], rect_size: [W - x * 2, 30], alignment: 3, bestfit: true, min_size: 14, max_size: 19 });
  y += 30 + 12;
  progressBar(b, `${d}/HelpBar`, { anchor: 'top-left', pivot: [0, 1], pos: [x, -y], rect_size: [W - x * 2, 16] });
  btn(b, `${d}/BtnTown`, '마을에서 부활', { anchor: 'bottom-center', pivot: [0.5, 0], pos: [0, T.FRAME.buttonBottom], rect_size: [300, T.BUTTON.h] });
}

function buildBoard(b) {
  const w = 'SafeArea/BoardWin';
  const W = 1040, H = 850;
  frame(b, w, [W, H], '마을 게시판');
  const x = T.FRAME.padX;
  const top = T.FRAME.contentTop;
  const tabW = 260;
  btn(b, `${w}/TabLfg`, '모집 판', { anchor: 'top-left', pivot: [0, 1], pos: [x, -top], rect_size: [tabW, T.BUTTON.h] });
  btn(b, `${w}/TabRec`, '오늘의 기록', { anchor: 'top-left', pivot: [0, 1], pos: [x + tabW + T.FRAME.gap, -top], rect_size: [tabW, T.BUTTON.h] });
  const y0 = top + T.BUTTON.h + T.FRAME.gap;               // 178
  const innerW = W - x * 2;                                  // 938

  // ① 모집 판
  const L = `${w}/Lfg`;
  b.empty(L, { anchor: 'middle-center', pos: [0, 0], rect_size: [W, H] });
  btn(b, `${L}/BtnToggle`, '파티 찾는 중 · 켜기', { anchor: 'top-left', pivot: [0, 1], pos: [x, -y0], rect_size: [360, T.BUTTON.h] });
  b.text(`${L}/Hint`, '켜 두면 이 채널의 다른 사람이 게시판에서 보고 초대할 수 있다', { size: 19, color: C.dim, anchor: 'top-left', pivot: [0, 1], pos: [x + 360 + T.FRAME.gap, -y0], rect_size: [innerW - 360 - T.FRAME.gap, T.BUTTON.h], alignment: 3, bestfit: true, min_size: 14, max_size: 19 });
  const rowH = 96, rowGap = 8;
  const y1 = y0 + T.BUTTON.h + T.FRAME.gap;                 // 282
  for (let i = 1; i <= 5; i++) {
    const r = `${L}/R${i}`;
    b.panel(r, { anchor: 'top-left', pivot: [0, 1], pos: [x, -(y1 + (i - 1) * (rowH + rowGap))], rect_size: [innerW, rowH], ...part('win_content'), sprite_type: 1 });
    b.text(`${r}/Name`, '', { size: 21, color: C.gold, anchor: 'middle-left', pivot: [0, 0.5], pos: [20, 0], rect_size: [innerW - 20 - 240 - 16, 80], alignment: 3, bestfit: true, min_size: 14, max_size: 21, ...outline });
    btn(b, `${r}/BtnInvite`, '초대', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-4, 0], rect_size: [240, T.BUTTON.h], font_size: 20 });
  }
  b.text(`${L}/Empty`, '지금 파티를 찾는 사람이 없다', { size: 21, color: C.dim, anchor: 'top-left', pivot: [0, 1], pos: [x, -y1], rect_size: [innerW, rowH], alignment: 4, enable: false });

  // ② 오늘의 기록
  const R = `${w}/Rec`;
  b.empty(R, { anchor: 'middle-center', pos: [0, 0], rect_size: [W, H] });
  b.text(`${R}/Head`, '이 채널 · 오늘 (한국 시간)', { size: 20, color: C.dim, anchor: 'top-left', pivot: [0, 1], pos: [x, -y0], rect_size: [innerW, 36], alignment: 3 });
  b.panel(`${R}/Paper`, { anchor: 'top-left', pivot: [0, 1], pos: [x, -(y0 + 44)], rect_size: [innerW, H - (y0 + 44) - T.FRAME.padBottom], ...part('win_content'), sprite_type: 1 });
  scrollText(b, `${R}/Paper/List`, [T.INNER.pad, -T.INNER.pad / 2], [innerW - T.INNER.pad * 2, H - (y0 + 44) - T.FRAME.padBottom - T.INNER.pad], { size: 20, color: C.gold });
}

function run() {
  const file = P.ui('CoopHUD');
  const b = fs.existsSync(file) ? UIBuilder.load(file) : new UIBuilder('CoopHUD', 13, true);
  // 그룹 순서는 tools/build/ui-order.cjs가 정한다
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  buildRescue(b);
  buildBoard(b);
  b.patchComponent('/', 'MOD.Core.UITransformComponent', { RectSize: { x: 1920, y: 1080 }, OffsetMin: { x: 0, y: 0 }, OffsetMax: { x: 0, y: 0 } });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('CoopHUD 엔티티 ' + run());
module.exports = { run };
