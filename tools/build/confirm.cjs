'use strict';
// 공용 확인 창 (ConfirmHUD): 제목 · 본문 · 확인/취소. 그림자 소환·강화·분해, 소지품 버리기·판매 등 되돌리기 어려운 조작 전에 띄운다.
// 컨트롤러는 RootDesk/MyDesk/UI/Windows/ConfirmDialog.mlua (_ConfirmDialog:Show).
const { UIBuilder, P, load } = require('./lib.cjs');
const icons = Object.fromEntries(load('ui_icons').map((r) => [r.key, r.ruid]));

function run() {
  const file = P.ui('ConfirmHUD');
  const b = require('fs').existsSync(file) ? UIBuilder.load(file) : new UIBuilder('ConfirmHUD', 40, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  // 화면 전체를 어둡게 덮어 뒤 창을 누르지 못하게 한다
  b.panel('SafeArea/Dim', { anchor: 'middle-center', rect_size: [4000, 3000], color: { r: 0, g: 0, b: 0, a: 0.55 }, raycast: true, enable: false });
  const w = 'SafeArea/Dim/Box';
  b.panel(w, { anchor: 'middle-center', rect_size: [760, 420], color: { r: 0.05, g: 0.045, b: 0.06, a: 1 }, raycast: true });
  b.sprite(w + '/Rim', { anchor: 'middle-center', rect_size: [800, 460], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(w + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(w + '/Title', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [640, 40], size: 28, bold: true, color: '#E6C88A', alignment: 4 });
  b.sprite(w + '/Icon', { anchor: 'top-center', pos: [0, -86], rect_size: [56, 56], color: '#FFFFFF', sprite_type: 0, enable: false });
  b.text(w + '/Body', '', { anchor: 'top-center', pos: [0, -86], rect_size: [660, 150], size: 24, color: '#E8E1D3', alignment: 1, bestfit: true, min_size: 19, max_size: 24 });
  b.button(w + '/BtnNo', '취소', { anchor: 'bottom-center', pos: [-150, 30], rect_size: [240, 88], font_size: 26, image_ruid: icons.btn_frame, bg_color: '#FFFFFF', color: '#E6DCC6' });
  b.button(w + '/BtnYes', '확인', { anchor: 'bottom-center', pos: [150, 30], rect_size: [240, 88], font_size: 26, image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: '#F4E2B0' });
  buildInputPick(b);
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

// 조작 방식 고르기 (PC 첫 진입 · GuideWindow): 카드 두 장 — 그림 + 이동·공격·스킬·질주 키 + 고르기 단추.
// 10-24 사용자: 예전 창은 「디아블로식·메이플식」 같은 다른 게임 이름으로 설명했고 실제 키(스킬·질주)가 없었다.
// 그림은 메이플 리소스: 컴퓨터 마우스 아이템 아이콘 · 흰 키캡(방향키) · Ctrl·Space 키캡. A S D F 글자 키 그림은 없어 글자로 쓴다.
const PICK_ART = {
  mouse: '773a10c9a5d84765a6dd1518d4d6725e',      // 32×32 마우스 아이템
  up: 'da61b29d772e4906abbe367fc2497f50', left: 'eaba4ae640a54cd986b83007b7e3d792',
  down: 'e50bda8102d44a8ca80faaf789b3b8c5', right: 'acadd9d6fb6a4cd696b75bcc751b6b2b',   // 76×76 흰 키캡
  ctrl: 'bb87e9a4964d4ee5a1f4da5be531c031',       // 56×44
  space: '269a7f50ad5b4b578a2f9ec27ae623b0',      // 236×68
};
function buildInputPick(b) {
  const pic = (name, ruid, pos, size) => {
    b.sprite(name, { anchor: 'middle-center', pos, rect_size: size, image_ruid: ruid, color: '#FFFFFF', sprite_type: 0 });
    b.patchComponent(name, 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false, PreserveSprite: 0 });
  };
  const gold = (t) => `<color=#E8C66B>${t}</color>`;
  b.panel('SafeArea/Pick', { anchor: 'middle-center', rect_size: [4000, 3000], color: { r: 0, g: 0, b: 0, a: 0.6 }, raycast: true, enable: false });
  const w = 'SafeArea/Pick/Box';
  b.panel(w, { anchor: 'middle-center', rect_size: [1120, 680], color: { r: 0.05, g: 0.045, b: 0.06, a: 1 }, raycast: true });
  b.sprite(w + '/Rim', { anchor: 'middle-center', rect_size: [1160, 720], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(w + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(w + '/Title', '조작 방식 고르기', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [700, 40], size: 28, bold: true, color: '#E6C88A', alignment: 4 });
  const cards = [
    { key: 'Mouse', x: -272, name: '마우스', btn: '마우스로 하기',
      rows: [['이동', '바닥 클릭'], ['공격', '적 클릭 · 누르고 있으면 계속'], ['스킬', 'A S D F · 우클릭 → 커서 쪽'], ['질주', 'Space → 커서 쪽']] },
    { key: 'Keys', x: 272, name: '키보드', btn: '키보드로 하기',
      rows: [['이동', '방향키'], ['공격', 'Ctrl → 가까운 적'], ['스킬', 'A S D F · 우클릭 → 보는 쪽'], ['질주', 'Space → 보는 쪽']] },
  ];
  for (const c of cards) {
    const card = `${w}/${c.key}`;
    b.panel(card, { anchor: 'middle-center', pos: [c.x, 8], rect_size: [500, 520], color: { r: 0.11, g: 0.1, b: 0.13, a: 1 }, raycast: false });
    // 그림 (카드 위쪽 150px)
    if (c.key === 'Mouse') {
      pic(`${card}/Art`, PICK_ART.mouse, [0, 160], [112, 112]);
    } else {
      b.empty(`${card}/Art`, { anchor: 'middle-center', pos: [0, 160], rect_size: [240, 130] });
      pic(`${card}/Art/Up`, PICK_ART.up, [0, 32], [62, 62]);
      pic(`${card}/Art/Left`, PICK_ART.left, [-64, -30], [62, 62]);
      pic(`${card}/Art/Down`, PICK_ART.down, [0, -30], [62, 62]);
      pic(`${card}/Art/Right`, PICK_ART.right, [64, -30], [62, 62]);
    }
    b.text(`${card}/Name`, c.name, { anchor: 'middle-center', pos: [0, 78], rect_size: [440, 44], size: 30, bold: true, color: '#F6E3B0', alignment: 4 });
    // 한 줄에 「무엇 — 어떤 키」 (왼쪽 정렬, 항목 이름은 금색)
    c.rows.forEach(([what, how], i) => {
      b.text(`${card}/Row${i + 1}`, `${gold(what)}    ${how}`, { anchor: 'middle-center', pos: [10, 22 - i * 46], rect_size: [420, 40], size: 23, color: '#E8E1D3', alignment: 3 });
    });
    b.button(`${card}/Btn`, c.btn, { anchor: 'bottom-center', pos: [0, 26], rect_size: [300, 88], font_size: 25, image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: '#F4E2B0' });
  }
  b.text(w + '/Note', '언제든 메뉴 → 설정에서 바꿀 수 있습니다.', { anchor: 'bottom-center', pos: [0, 38], rect_size: [800, 30], size: 20, color: '#A8A090', alignment: 4 });
}

if (require.main === module) console.log('Confirm HUD entities: ' + run());
module.exports = { run };
