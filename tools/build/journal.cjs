'use strict';
// 일지 창 (JournalHUD): 일일 의뢰 · 업적 · 몬스터 도감 · 아이템 도감 4탭, 8줄 목록 + 페이지. 모바일은 의뢰 추적 아래 「일지」 버튼으로 연다 (PC는 J).
// 화풍은 의뢰 일지(QuestJournalHUD)와 같은 프레임·색을 쓴다.
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const icons = Object.fromEntries(load('ui_icons').map((x) => [x.key, x.ruid]));
const ROWS = 8;

function run() {
  const file = path.join(root, 'ui/JournalHUD.u' + 'i');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('JournalHUD', 13, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });

  // 모바일 전용 여는 버튼 (의뢰 추적 패널 바로 아래, 왼쪽 위 기준)
  b.button('SafeArea/BtnOpen', '일지', { anchor: 'top-left', pos: [24, -548], rect_size: [150, 88], font_size: 28, bg_color: '#24212B', color: '#E6C88A' });
  b.sprite('SafeArea/BtnOpen/Dot', { anchor: 'top-right', pos: [-6, -6], rect_size: [22, 22], image_ruid: icons.red_dot, color: '#FFFFFF', sprite_type: 0, enable: false });
  b.patchComponent('SafeArea/BtnOpen', 'MOD.Core.UITransformComponent', { ActivePlatform: 2 });

  const win = 'SafeArea/JournalWin';
  b.panel(win, { rect_size: [1320, 900], color: { r: .05, g: .045, b: .06, a: 1 }, raycast: true, enable: false });
  b.sprite(win + '/Rim', { rect_size: [1360, 940], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.text(win + '/Title', '일지', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [700, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.button(win + '/BtnClose', '', { anchor: 'top-right', pos: [-20, -14], rect_size: [88, 88], image_ruid: icons.btn_close, bg_color: '#FFFFFF' });
  // 4탭: 일일 의뢰 · 업적 · 몬스터 도감 · 아이템 도감 (유니크·세트·룬워드 수집 — docs/design/19 §2-6)
  [['TabDaily', '일일 의뢰'], ['TabAch', '업적'], ['TabCol', '몬스터 도감'], ['TabItem', '아이템 도감']].forEach(([n, label], i) => {
    b.button(win + '/' + n, label, { anchor: 'top-left', pos: [40 + i * 214, -88], rect_size: [204, 88], font_size: 26, bg_color: '#24212B', color: '#E6DCC6' });
  });
  b.text(win + '/Info', '', { anchor: 'top-right', pos: [-40, -110], rect_size: [380, 48], size: 22, color: '#B9B0A1', alignment: 5, bestfit: true, min_size: 16, max_size: 22 });
  b.panel(win + '/List', { anchor: 'top-left', pos: [30, -186], rect_size: [1260, 604], color: '#111018' });
  for (let i = 1; i <= ROWS; i++) {
    const n = win + '/List/R' + i;
    // 10-27 코덱스 그림: 줄 칸(jr_row · 완료 jr_row_done · 받을 보상 jr_row_claim, 9-slice) · 왼쪽 96 아이콘 자리에 업적 문양(jr_icon_*)
    b.sprite(n, { anchor: 'top-left', pos: [10, -8 - (i - 1) * 74], rect_size: [1240, 70], image_ruid: icons.jr_row, color: '#FFFFFF', sprite_type: 1, enable: false });
    b.sprite(n + '/Icon', { anchor: 'middle-left', pos: [50, 0], rect_size: [58, 58], image_ruid: icons.jr_icon_kill, color: '#FFFFFF', sprite_type: 0, enable: false });
    b.text(n + '/Name', '', { anchor: 'top-left', pos: [112, -5], rect_size: [600, 34], size: 22, color: '#ECE1CB', alignment: 3, bold: true, overflow: 1 });
    // 도감 탭은 진행 막대를 숨기고 한 줄 설명(최대 48자)이 들어가게 1010px로 넓힌다 (JournalWindow.RenderRow)
    b.text(n + '/Desc', '', { anchor: 'bottom-left', pos: [112, 9], rect_size: [600, 24], size: 17, color: '#A99F8E', alignment: 3, overflow: 1, bestfit: true, min_size: 13, max_size: 17 });
    b.sprite(n + '/BarBg', { anchor: 'middle-right', pos: [-230, -10], rect_size: [260, 16], image_ruid: icons.jr_bar_bg, color: '#FFFFFF', sprite_type: 1 });
    b.sprite(n + '/BarBg/Fill', { anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], rect_size: [260, 16], image_ruid: icons.jr_bar_fill, color: '#FFFFFF', sprite_type: 1 });
    b.text(n + '/Value', '', { anchor: 'middle-right', pos: [-18, 0], rect_size: [200, 40], size: 24, color: '#E6C88A', alignment: 5, overflow: 2 });
    // 업적 (10-27 A+C): 막대 위 난이도 별 3칸(보통 · 악몽 · 지옥 중 깬 곳) · 오른쪽 단추 = 「받기」(받을 보상) 또는 「칭호 달기/떼기」
    b.text(n + '/Stars', '', { anchor: 'top-right', pos: [-340, -4], rect_size: [200, 26], size: 20, color: '#77707F', alignment: 4, enable: false });
    b.sprite(n + '/Chest', { anchor: 'middle-right', pos: [-276, 0], rect_size: [54, 54], image_ruid: icons.jr_chest_open, color: '#FFFFFF', sprite_type: 0, enable: false });
    b.button(n + '/BtnAct', '받기', { anchor: 'middle-right', pos: [-98, 0], rect_size: [170, 60], font_size: 22, bg_color: '#5A3E8C', color: '#FFF4D8', enable: false });
  }
  b.button(win + '/BtnPrev', '◀ 이전', { anchor: 'bottom-left', pos: [40, 14], rect_size: [200, 88], font_size: 24, bg_color: '#24212B' });
  b.button(win + '/BtnNext', '다음 ▶', { anchor: 'bottom-right', pos: [-40, 14], rect_size: [200, 88], font_size: 24, bg_color: '#24212B' });
  b.text(win + '/Page', '', { anchor: 'bottom-center', pos: [0, 46], rect_size: [300, 36], size: 24, color: '#B9B0A1' });
  b.text(win + '/Hint', 'J 일지 · 일일 의뢰는 한국 시간 자정에 바뀝니다 · 업적은 난이도마다 따로, 달성하면 「받기」', { anchor: 'bottom-center', pos: [0, 10], rect_size: [760, 30], size: 18, color: '#7F7868', bestfit: true, min_size: 16, max_size: 18 });
  b.patchComponent(win + '/Hint', 'MOD.Core.UITransformComponent', { ActivePlatform: 1 });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Journal entities: ' + run());
module.exports = { run };
