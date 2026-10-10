'use strict';
// 캐릭터 선택 창 (CharSelectHUD): 월드에 들어오면 계정의 캐릭터 슬롯 4칸을 보여 준다.
// 칸을 고르고 「입장」, 빈 칸이면 이름을 적고 「새 캐릭터」, 「삭제」(확인 창). 창고는 계정 공용이라 어느 캐릭터로 들어가도 같다.
// 그룹 순서 30: 게임 HUD·창(5~20) 위, 확인 창(40) 아래. 컨트롤러는 RootDesk/MyDesk/UI/Windows/CharSelectWindow.mlua
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const rows = load('ui_icons');
const icons = Object.fromEntries(rows.map((x) => [x.key, x.ruid]));
const part = (key) => { const r = rows.find((x) => x.key === key); return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) }; };
const SLOTS = 4;

function run() {
  const file = path.join(root, 'ui', 'CharSelectHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('CharSelectHUD', 30, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  // 화면 전체를 덮는 어두운 바탕 (뒤의 게임 입력을 막는다)
  const w = 'SafeArea/Win';
  b.panel(w, { anchor: 'middle-center', rect_size: [1920, 1080], color: { r: 0.03, g: 0.02, b: 0.04, a: 0.94 }, raycast: true, enable: false });
  const box = w + '/Box';
  b.panel(box, { rect_size: [1520, 800], pos: [0, 10], color: '#100E16', raycast: true });
  b.sprite(box + '/Rim', { rect_size: [1560, 840], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.text(box + '/Title', '캐릭터 선택', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [900, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.text(box + '/Info', '', { anchor: 'top-left', pos: [48, -86], rect_size: [1424, 36], size: 22, color: '#C9BBA0', alignment: 3, bestfit: true, min_size: 18, max_size: 22 });
  // 슬롯 4칸 (가로로)
  for (let i = 1; i <= SLOTS; i++) {
    const n = box + '/S' + i;
    b.button(n, '', { anchor: 'top-left', pivot: [0, 1], pos: [48 + (i - 1) * 360, -136], rect_size: [340, 430], ...part('win_content'), bg_color: part('win_content').color, sprite_type: 1 });
    b.sprite(n + '/Pick', { rect_size: [340, 430], image_ruid: icons.slot_frame, color: '#E6C88A', sprite_type: 1, enable: false });
    b.text(n + '/No', String(i), { anchor: 'top-left', pos: [20, -14], rect_size: [60, 40], size: 26, bold: true, color: '#6E6658', alignment: 3 });
    b.text(n + '/Name', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -150], rect_size: [300, 50], size: 30, bold: true, color: '#F3E7CC', alignment: 4, bestfit: true, min_size: 20, max_size: 30 });
    b.text(n + '/Level', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -210], rect_size: [300, 40], size: 26, color: '#E6C88A', alignment: 4 });
    b.text(n + '/Diff', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -254], rect_size: [300, 36], size: 22, color: '#A99F8E', alignment: 4 });
  }
  // 아래: 이름 입력(빈 칸을 골랐을 때) · 입장 · 새 캐릭터 · 삭제
  b.text(box + '/NameLabel', '새 캐릭터 이름', { anchor: 'bottom-left', pivot: [0, 0], pos: [48, 136], rect_size: [400, 34], size: 22, color: '#C9BBA0', alignment: 3 });
  b.textInput(box + '/NameInput', { anchor: 'bottom-left', pivot: [0, 0], pos: [48, 40], rect_size: [520, 88], placeholder: '이름 (최대 10글자)', char_limit: 10, line_type: 0, font_size: 26, color: '#F3E7CC', ...part('win_content'), bg_color: part('win_content').color, sprite_type: 1 });
  b.button(box + '/BtnDelete', '삭제', { anchor: 'bottom-right', pivot: [1, 0], pos: [-660, 40], rect_size: [220, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: '#E6DCC6' });
  b.button(box + '/BtnEnter', '입장', { anchor: 'bottom-right', pivot: [1, 0], pos: [-48, 40], rect_size: [592, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 30, color: '#F4E2B0' });
  // 첫 진입 로딩 화면: 처음부터 켜져 있어 스크립트가 돌기 전에도 바로 그려진다 (10-10 QA: 메이플월드 기본 캐릭터가 1.5초 보였다가
  // 캐릭터 슬롯이 켜졌다). 저장을 불러와 선택 창이 열리거나 캐릭터를 다 불러오면 CharSelectWindow가 끈다
  const boot = 'SafeArea/Boot';
  if (!b.find(boot)) {
    b.panel(boot, { anchor: 'middle-center', rect_size: [3840, 2160], color: { r: 0.02, g: 0.015, b: 0.03, a: 1 }, raycast: true });
    b.text(boot + '/Title', '잡으면 내편', { anchor: 'middle-center', pos: [0, 40], rect_size: [900, 90], size: 64, bold: true, color: '#E6C88A', alignment: 4 });
    b.text(boot + '/Status', '불러오는 중…', { anchor: 'middle-center', pos: [0, -40], rect_size: [900, 50], size: 28, color: '#A99F8E', alignment: 4 });
  }
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('CharSelect UI entities: ' + run());
module.exports = { run };
