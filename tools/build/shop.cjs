'use strict';
// 잿빛 행상 거래 창 (ShopHUD): 창고처럼 두 칸 — 왼쪽 = 살 물건(물약 등급은 야영지 난이도별 · 회복 · 귀환 · 도박) + 설명 + 구매,
// 오른쪽 = 가방 60칸(눌러서 고르기 · 여러 개 선택) + 판매. 컨트롤러는 RootDesk/MyDesk/UI/Windows/ShopWindow.mlua
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const rows = load('ui_icons');
const icons = Object.fromEntries(rows.map((x) => [x.key, x.ruid]));
// 칸 그림은 ui_icons.csv의 색·투명도를 그대로 쓴다 (다른 창과 같은 공통 값)
const part = (key) => { const r = rows.find((x) => x.key === key); return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) }; };
const GOODS = 9;

// 고른 칸 표시: 하늘색 테두리 + 옅은 채움 — 등급 테두리색(파랑·노랑·금·초록)과 겹치지 않는다
function pick(b, n, size) {
  b.sprite(n + '/Pick', { rect_size: [size, size], image_ruid: icons.slot_frame, color: '#6FE3FF', sprite_type: 1, enable: false });
  b.panel(n + '/Pick/Fill', { rect_size: [size - 10, size - 10], color: { r: 0.43, g: 0.89, b: 1, a: 0.2 } });
}

function slot(b, n, size, iconSize) {
  b.sprite(n + '/Rim', { rect_size: [size, size], image_ruid: icons.slot_frame, color: '#FFFFFF', sprite_type: 1 });
  b.sprite(n + '/Icon', { rect_size: [iconSize, iconSize], color: '#FFFFFF', enable: false });
  b.text(n + '/Count', '', { anchor: 'bottom-right', pivot: [1, 0], pos: [-4, 2], rect_size: [60, 26], size: 19, bold: true, color: '#FFFFFF', alignment: 8, outline: true, outline_color: '#101010', outline_width: 0.3 });
}

function run() {
  const file = path.join(root, 'ui', 'ShopHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('ShopHUD', 10, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  const w = 'SafeArea/ShopWin';
  b.panel(w, { rect_size: [1380, 880], pos: [0, 10], color: '#100E16', raycast: true, enable: false });
  b.sprite(w + '/Rim', { rect_size: [1420, 920], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  // 제목·닫기: 다른 창과 같은 공통 규칙 (가운데, 창 위에서 17px)
  b.text(w + '/Title', '거래', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [900, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.button(w + '/BtnClose', '', { anchor: 'top-right', pos: [-20, -14], rect_size: [88, 88], image_ruid: icons.btn_close, bg_color: '#FFFFFF' });
  b.text(w + '/Info', '', { anchor: 'top-left', pos: [44, -86], rect_size: [1292, 36], size: 22, color: '#C9BBA0', alignment: 3, bestfit: true, min_size: 18, max_size: 22 });

  // ── 왼쪽: 살 물건 (5열 × 2줄) ──
  b.text(w + '/GoodsLabel', '살 물건', { anchor: 'top-left', pos: [44, -128], rect_size: [616, 34], size: 24, bold: true, color: '#E6C88A', alignment: 3 });
  for (let i = 1; i <= GOODS; i++) {
    const n = w + '/G' + i;
    const col = (i - 1) % 5, row = Math.floor((i - 1) / 5);
    b.button(n, '', { anchor: 'top-left', pivot: [0, 1], pos: [36 + col * 126, -168 - row * 186], rect_size: [116, 176], bg_color: '#19131E', sprite_type: 1 });
    b.empty(n + '/Slot', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -6], rect_size: [96, 96] });
    slot(b, n + '/Slot', 96, 72);
    pick(b, n + '/Slot', 96);
    b.text(n + '/Name', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -104], rect_size: [112, 34], size: 17, color: '#E6DCC6', alignment: 4, bestfit: true, min_size: 13, max_size: 17 });
    b.text(n + '/Price', '', { anchor: 'bottom-center', pivot: [0.5, 0], pos: [0, 6], rect_size: [112, 30], size: 20, bold: true, color: '#FFD27A', alignment: 4 });
  }
  // 설명 (고른 상품 또는 고른 가방 물건)
  b.panel(w + '/Detail', { anchor: 'top-left', pivot: [0, 1], pos: [36, -548], rect_size: [620, 204], ...part('win_content'), sprite_type: 1 });
  b.text(w + '/Detail/Desc', '', { anchor: 'top-left', pos: [18, -12], rect_size: [584, 182], size: 20, color: '#E6DCC6', alignment: 0, bestfit: true, min_size: 14, max_size: 20 });
  b.button(w + '/BtnBuy', '구매', { anchor: 'top-left', pivot: [0, 1], pos: [36, -766], rect_size: [302, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 26, color: '#F4E2B0' });
  b.button(w + '/BtnBuy5', '5개 구매', { anchor: 'top-left', pivot: [0, 1], pos: [354, -766], rect_size: [302, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 26, color: '#E6DCC6' });

  // ── 오른쪽: 가방 (6열, 5줄 보임 · 스크롤) ──
  b.text(w + '/BagLabel', '가방', { anchor: 'top-left', pos: [704, -128], rect_size: [640, 34], size: 24, bold: true, color: '#E6C88A', alignment: 3 });
  const g = w + '/Bag';
  b.scrollLayout(g, { anchor: 'top-left', pivot: [0, 1], pos: [696, -168], rect_size: [648, 522], layout_type: 2, cell_size: [88, 88], constraint: 1, constraint_count: 6, grid_spacing: [14, 14], padding: [12, 12, 8, 8], use_scroll: true, v_scroll_dir: 2, scroll_bar_visible: 1, scroll_bar_thickness: 10, scroll_bar_bg_color: { r: 0.14, g: 0.12, b: 0.17, a: 0.6 }, scroll_bar_handle_color: { r: 0.6, g: 0.49, b: 0.3, a: 1 } });
  for (let i = 1; i <= 60; i++) {
    const n = g + '/B' + i;
    b.button(n, '', { anchor: 'top-left', pos: [12 + ((i - 1) % 6) * 102, -8 - Math.floor(((i - 1) % 30) / 6) * 102], rect_size: [88, 88], bg_color: '#19131E' });
    slot(b, n, 88, 64);
    pick(b, n, 88);
  }
  b.button(w + '/BtnSell', '판매', { anchor: 'top-left', pivot: [0, 1], pos: [696, -766], rect_size: [316, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 26, color: '#F4E2B0' });
  b.button(w + '/BtnMulti', '여러 개 선택', { anchor: 'top-left', pivot: [0, 1], pos: [1028, -766], rect_size: [316, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: '#E6DCC6' });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Shop UI entities: ' + run());
module.exports = { run };
