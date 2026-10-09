'use strict';
// 떠돌이 상인 창 (MerchantHUD): 왼쪽 = 오늘 물건 5줄 (그림 · 이름(등급 색) · 종류·요구 레벨 · 값),
// 오른쪽 = 고른 물건의 전체 옵션 + 「구매」. 버튼에 물건 이름을 넣지 않는다 — 보고 고른 뒤 산다.
// 컨트롤러는 RootDesk/MyDesk/UI/Windows/MerchantWindow.mlua
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const rows = load('ui_icons');
const icons = Object.fromEntries(rows.map((x) => [x.key, x.ruid]));
// 칸 그림은 ui_icons.csv의 색·투명도를 그대로 쓴다 (다른 창과 같은 공통 값 — 흰색으로 두면 바탕이 하얗게 뜬다)
const part = (key) => { const r = rows.find((x) => x.key === key); return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) }; };

function run() {
  const file = path.join(root, 'ui', 'MerchantHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('MerchantHUD', 7, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  const w = 'SafeArea/MerchantWin';
  b.panel(w, { rect_size: [1100, 720], pos: [0, 20], color: '#100E16', raycast: true, enable: false });
  b.sprite(w + '/Rim', { rect_size: [1140, 760], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  // 제목·닫기: 다른 창과 같은 공통 규칙 (가운데, 창 위에서 17px)
  b.text(w + '/Title', '떠돌이 상인', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [800, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.button(w + '/BtnClose', '', { anchor: 'top-right', pos: [-20, -14], rect_size: [88, 88], image_ruid: icons.btn_close, bg_color: '#FFFFFF' });
  b.text(w + '/Info', '', { anchor: 'top-left', pos: [44, -88], rect_size: [1012, 36], size: 22, color: '#C9BBA0', alignment: 3, bestfit: true, min_size: 18, max_size: 22 });
  // 물건 5줄
  for (let i = 1; i <= 5; i++) {
    const r = w + '/Row' + i;
    b.button(r, '', { anchor: 'top-left', pivot: [0, 1], pos: [28, -132 - (i - 1) * 108], rect_size: [560, 100], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1 });
    b.panel(r + '/Slot', { anchor: 'middle-left', pivot: [0, 0.5], pos: [40, 0], rect_size: [80, 80], color: '#19131E' });
    b.sprite(r + '/Slot/Icon', { rect_size: [60, 60], color: '#FFFFFF', enable: false });
    b.sprite(r + '/Slot/Rim', { rect_size: [80, 80], image_ruid: icons.slot_frame, color: '#FFFFFF', sprite_type: 1 });
    b.text(r + '/Slot/Count', '', { anchor: 'bottom-right', pivot: [1, 0], pos: [-3, 2], rect_size: [60, 24], size: 18, color: '#FFFFFF', alignment: 8 });
    b.text(r + '/Name', '', { anchor: 'top-left', pos: [134, -14], rect_size: [280, 38], size: 24, bold: true, color: '#E6DCC6', alignment: 3, bestfit: true, min_size: 18, max_size: 24 });
    b.text(r + '/Sub', '', { anchor: 'bottom-left', pos: [134, 14], rect_size: [280, 32], size: 19, color: '#A99F8E', alignment: 3, bestfit: true, min_size: 16, max_size: 19 });
    b.text(r + '/Price', '', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-40, 0], rect_size: [120, 40], size: 22, bold: true, color: '#FFD27A', alignment: 5 });
  }
  // 고른 물건 설명 + 구매
  b.panel(w + '/Detail', { anchor: 'top-right', pivot: [1, 1], pos: [-28, -132], rect_size: [464, 424], ...part('win_content'), sprite_type: 1 });
  b.text(w + '/Detail/Desc', '', { anchor: 'top-left', pos: [20, -16], rect_size: [424, 392], size: 20, color: '#E6DCC6', alignment: 0, bestfit: true, min_size: 15, max_size: 20 });
  b.button(w + '/BtnBuy', '구매', { anchor: 'top-right', pivot: [1, 1], pos: [-28, -572], rect_size: [464, 92], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 28, color: '#F4E2B0' });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Merchant UI entities: ' + run());
module.exports = { run };
