'use strict';
// 이야기 카드 (StoryHUD, docs/design/18 §3-4): 시작 내레이션 · 장 표시 · 장 마무리를 화면 전체를 어둡게 덮고 띄운다.
// 컨트롤러는 RootDesk/MyDesk/UI/Hud/StoryCard.mlua (_StoryCard). 카드 전체가 버튼이라 아무 곳이나 누르면 넘어간다.
const { UIBuilder, P, load } = require('./lib.cjs');
const icons = Object.fromEntries(load('ui_icons').map((r) => [r.key, r.ruid]));

function run() {
  const file = P.ui('StoryHUD');
  const b = require('fs').existsSync(file) ? UIBuilder.load(file) : new UIBuilder('StoryHUD', 39, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  const c = 'SafeArea/Card';
  // 넓은 화면에서도 가장자리가 비지 않게 화면보다 크게 덮는다 (stretch는 다시 불러올 때 크기 0으로 접힌다)
  b.button(c, '', { anchor: 'middle-center', rect_size: [4000, 3000], bg_color: { r: 0.02, g: 0.02, b: 0.03, a: 0.92 }, enable: false });
  // 그림: 전체 배경(story_* 그림, 코덱스 요청 docs/requests/codex-story-art-20261012.md)이 있으면 어둡게 깔고,
  // 없으면 그 액트 보스 의뢰 그림을 제목 위 액자로 (StoryCard.ShowArt)
  b.sprite(c + '/Art', { anchor: 'middle-center', rect_size: [1920, 1080], color: '#FFFFFF', alpha: 0.5, sprite_type: 0, enable: false });
  b.sprite(c + '/Plate', { anchor: 'middle-center', pos: [0, 352], rect_size: [270, 270], color: '#FFFFFF', sprite_type: 0, enable: false });
  b.text(c + '/Title', '', { anchor: 'middle-center', pos: [0, 150], rect_size: [1500, 80], size: 52, bold: true, color: '#E6C88A', alignment: 4 });
  b.patchComponent(c + '/Title', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple' });
  b.text(c + '/Sub', '', { anchor: 'middle-center', pos: [0, 84], rect_size: [1500, 44], size: 28, color: '#B8AFA0', alignment: 4 });
  b.text(c + '/Body', '', { anchor: 'middle-center', pos: [0, -40], rect_size: [1300, 200], size: 32, color: '#ECE4D4', alignment: 4 });
  b.text(c + '/Hint', '', { anchor: 'middle-center', pos: [0, -300], rect_size: [900, 36], size: 21, color: '#857D70', alignment: 4 });
  // 그림이 글자 아래에 오게 순서를 정한다 (기존 파일에 새로 붙인 칸은 맨 뒤 = 맨 위에 그려진다)
  ['Art', 'Plate', 'Title', 'Sub', 'Body', 'Hint'].forEach((n, i) => b.patch(c + '/' + n, { display_order: i }));
  // 맵 이동 화면 (MapTransition): 이동 순간 검게 덮고 도착지 이름을 보여 준 뒤, 새 맵·카메라가 자리 잡으면 걷어 낸다.
  // 이야기 카드보다 위 (이동 중에는 다른 것을 보지 않는다). 그림은 loading_act1~3 (코덱스 요청) — 없으면 검은 바탕만
  const f = 'SafeArea/Fade';
  b.panel(f, { anchor: 'middle-center', rect_size: [4000, 3000], color: { r: 0.015, g: 0.012, b: 0.02, a: 1 }, raycast: true, enable: false });
  b.upsertComponent(f, 'MOD.Core.CanvasGroupComponent', { GroupAlpha: 1, BlocksRaycasts: true, Interactable: false });
  b.sprite(f + '/Art', { anchor: 'middle-center', rect_size: [1920, 1080], color: '#FFFFFF', alpha: 0.45, sprite_type: 0, enable: false });
  b.text(f + '/Region', '', { anchor: 'middle-center', pos: [0, 70], rect_size: [1200, 40], size: 26, color: '#9C9488', alignment: 4 });
  b.text(f + '/Name', '', { anchor: 'middle-center', pos: [0, 10], rect_size: [1400, 76], size: 50, bold: true, color: '#E6C88A', alignment: 4 });
  b.patchComponent(f + '/Name', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple' });
  b.sprite(f + '/Spin', { anchor: 'middle-center', pos: [0, -90], rect_size: [72, 72], image_ruid: icons.waypoint_on, color: '#FFFFFF', alpha: 0.8, sprite_type: 0 });
  ['Art', 'Region', 'Name', 'Spin'].forEach((n, i) => b.patch(f + '/' + n, { display_order: i }));
  b.patch(f, { display_order: 10 });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Story HUD entities: ' + run());
module.exports = { run };
