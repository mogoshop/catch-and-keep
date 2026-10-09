'use strict';
// 창고 창 (StashHUD): 위 = 창고 100칸(10열, 4줄 보임·스크롤), 가운데 = 등급별 한꺼번에 넣기 5버튼, 아래 = 가방 60칸(2줄 보임).
// 칸을 누르면 바로 옮긴다 (창고 → 가방 / 가방 → 창고). 컨트롤러는 RootDesk/MyDesk/UI/Windows/StashWindow.mlua
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const icons = Object.fromEntries(load('ui_icons').map((x) => [x.key, x.ruid]));

function grid(b, name, count, pos, rows, prefix) {
  b.scrollLayout(name, { anchor: 'top-left', pos, rect_size: [1044, rows * 102 + 8], layout_type: 2, cell_size: [88, 88], constraint: 1, constraint_count: 10, grid_spacing: [14, 14], padding: [8, 8, 6, 6], use_scroll: true, v_scroll_dir: 2, scroll_bar_visible: 1, scroll_bar_thickness: 10, scroll_bar_bg_color: { r: 0.14, g: 0.12, b: 0.17, a: 0.6 }, scroll_bar_handle_color: { r: 0.6, g: 0.49, b: 0.3, a: 1 } });
  for (let i = 1; i <= count; i++) {
    const n = name + '/' + prefix + i;
    // 실제 위치는 그리드가 정한다 (작성 좌표는 보이는 줄 안)
    b.button(n, '', { anchor: 'top-left', pos: [8 + ((i - 1) % 10) * 102, -Math.floor(((i - 1) % (rows * 10)) / 10) * 104], rect_size: [88, 88], bg_color: '#19131E' });
    b.sprite(n + '/Rim', { rect_size: [88, 88], image_ruid: icons.slot_frame, color: '#FFFFFF', sprite_type: 1 });
    b.sprite(n + '/Icon', { rect_size: [64, 64], color: '#FFFFFF', enable: false });
    b.text(n + '/Count', '', { anchor: 'bottom-right', pivot: [1, 0], pos: [-4, 2], rect_size: [60, 28], size: 20, bold: true, color: '#FFFFFF', alignment: 8, outline: true, outline_color: '#101010', outline_width: 0.3 });
  }
}

function run() {
  const file = path.join(root, 'ui', 'StashHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('StashHUD', 7, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  const w = 'SafeArea/StashWin';
  b.panel(w, { rect_size: [1100, 1000], pos: [0, 0], color: '#100E16', raycast: true, enable: false });
  b.sprite(w + '/Rim', { rect_size: [1140, 1040], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.text(w + '/Title', '창고', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [800, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.button(w + '/BtnClose', '', { anchor: 'top-right', pos: [-20, -14], rect_size: [88, 88], image_ruid: icons.btn_close, bg_color: '#FFFFFF' });
  b.text(w + '/StashLabel', '창고', { anchor: 'top-left', pos: [28, -96], rect_size: [1044, 36], size: 24, color: '#C9BBA0', alignment: 3 });
  grid(b, w + '/Stash', 100, [28, -134], 4, 'S');
  // 등급별 한꺼번에 넣기 (가방 → 창고)
  [['DepNormal', '일반 넣기'], ['DepMagic', '마법 넣기'], ['DepRare', '레어 넣기'], ['DepUnique', '유니크·세트'], ['DepRune', '룬 넣기']].forEach(([n, label], i) => {
    b.button(w + '/' + n, label, { anchor: 'top-left', pos: [28 + i * 210, -560], rect_size: [198, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', font_size: 22, color: '#E6DCC6' });
  });
  b.text(w + '/BagLabel', '가방', { anchor: 'top-left', pos: [28, -660], rect_size: [1044, 36], size: 24, color: '#C9BBA0', alignment: 3 });
  grid(b, w + '/Bag', 60, [28, -698], 2, 'B');
  b.text(w + '/Info', '', { anchor: 'bottom-left', pos: [28, 24], rect_size: [1044, 40], size: 22, color: '#D9CDB4', alignment: 3, bestfit: true, min_size: 16, max_size: 22 });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Stash UI entities: ' + run());
module.exports = { run };
