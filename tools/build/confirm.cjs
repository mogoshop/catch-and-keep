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
  b.text(w + '/Title', '', { anchor: 'top-center', pos: [0, -28], rect_size: [640, 44], size: 28, bold: true, color: '#E6C88A' });
  b.sprite(w + '/Icon', { anchor: 'top-center', pos: [0, -86], rect_size: [56, 56], color: '#FFFFFF', sprite_type: 0, enable: false });
  b.text(w + '/Body', '', { anchor: 'top-center', pos: [0, -86], rect_size: [660, 150], size: 24, color: '#E8E1D3', alignment: 1, bestfit: true, min_size: 19, max_size: 24 });
  b.button(w + '/BtnNo', '취소', { anchor: 'bottom-center', pos: [-150, 30], rect_size: [240, 88], font_size: 26, image_ruid: icons.btn_frame, bg_color: '#FFFFFF', color: '#E6DCC6' });
  b.button(w + '/BtnYes', '확인', { anchor: 'bottom-center', pos: [150, 30], rect_size: [240, 88], font_size: 26, image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: '#F4E2B0' });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Confirm HUD entities: ' + run());
module.exports = { run };
