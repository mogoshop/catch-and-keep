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
  // 10-22 개편 (사용자 C안): 화면 전체 = 이야기 그림(천천히 다가오는 움직임은 StoryCard가 준다) · 왼쪽 위 = 장면 제목 ·
  // 아래 = NPC 대화창 모양 상자(큰 초상화 + 이름 + 여러 줄 대사). 장 제목 카드는 가운데 큰 글자(BigTitle)만
  // 예전 배치의 칸(가운데 글·화자 그림)은 지운다. 나머지는 같은 경로를 고쳐 쓰므로 엔티티 id가 그대로다
  for (const old of ['Who', 'Body', 'Hint']) { try { b.remove(c + '/' + old); } catch (e) { /* 이미 없다 */ } }
  const DARK = { r: 0.04, g: 0.035, b: 0.05, a: 0.92 };
  // 넓은 화면에서도 가장자리가 비지 않게 화면보다 크게 덮는다 (stretch는 다시 불러올 때 크기 0으로 접힌다)
  b.button(c, '', { anchor: 'middle-center', rect_size: [4000, 3000], bg_color: { r: 0.02, g: 0.02, b: 0.03, a: 1 }, enable: false });   // 불투명 (카드 뒤로 HUD·캐릭터가 비치지 않게)
  b.sprite(c + '/Art', { anchor: 'middle-center', rect_size: [1920, 1080], color: '#FFFFFF', alpha: 0.85, sprite_type: 0, enable: false });
  b.sprite(c + '/Plate', { anchor: 'middle-center', pos: [0, 352], rect_size: [270, 270], color: '#FFFFFF', sprite_type: 0, enable: false });
  // 아래쪽 그림을 눌러 글이 읽히게 하는 어두운 띠
  b.panel(c + '/Shade', { anchor: 'middle-center', pos: [0, -400], rect_size: [4000, 420], color: { r: 0, g: 0, b: 0, a: 0.55 }, raycast: false });
  // 장 제목 카드 (야영지 첫 진입 등): 가운데 큰 제목 + 부제
  b.text(c + '/BigTitle', '', { anchor: 'middle-center', pos: [0, 40], rect_size: [1500, 90], size: 64, bold: true, color: '#F0D9A0', alignment: 4, outline: true, outline_color: '#1A1410' });
  b.patchComponent(c + '/BigTitle', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple' });
  b.text(c + '/BigSub', '', { anchor: 'middle-center', pos: [0, -36], rect_size: [1500, 44], size: 30, color: '#CFC3AE', alignment: 4, outline: true, outline_color: '#1A1410' });
  // 장면 제목 (왼쪽 위)
  b.text(c + '/Title', '', { anchor: 'middle-center', pos: [-470, 455], rect_size: [900, 56], size: 40, bold: true, color: '#F0D9A0', alignment: 3, outline: true, outline_color: '#1A1410' });
  b.patchComponent(c + '/Title', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple' });
  b.text(c + '/Sub', '', { anchor: 'middle-center', pos: [-470, 408], rect_size: [900, 34], size: 24, color: '#CFC3AE', alignment: 3, outline: true, outline_color: '#1A1410' });
  // 대화 상자 (NPC 대화창과 같은 테두리)
  const box = c + '/Box';
  b.panel(box, { anchor: 'middle-center', pos: [0, -372], rect_size: [1640, 280], color: DARK, sprite_type: 1, raycast: false });
  {
    const size = b.getComponent(box, 'MOD.Core.UITransformComponent').RectSize;
    b.sprite(box + '/Rim', { anchor: 'middle-center', pos: [0, 0], rect_size: [size.x + 40, size.y + 40], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
    b.patchComponent(box + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  }
  b.panel(box + '/PortraitBox', { anchor: 'middle-center', pos: [-678, -20], rect_size: [210, 200], image_ruid: icons.win_content, color: '#000000', alpha: 0.4, sprite_type: 1, raycast: false });
  b.sprite(box + '/PortraitBox/Portrait', { anchor: 'middle-center', pos: [0, -42], rect_size: [176, 168], color: '#FFFFFF', sprite_type: 0, preserve_aspect: true, enable: false });
  b.text(box + '/Name', '', { anchor: 'middle-center', pos: [0, 103], rect_size: [900, 40], size: 28, bold: true, color: '#F0D9A0', alignment: 4, outline: true, outline_color: '#1A1410' });
  b.text(box + '/Body', '', { anchor: 'middle-center', pos: [110, -12], rect_size: [1320, 190], size: 30, color: '#ECE4D4', alignment: 3 });   // 이름 띠 아래 칸에서 세로 가운데 (10-22)
  b.text(box + '/Hint', '', { anchor: 'middle-center', pos: [560, -104], rect_size: [400, 28], size: 20, color: '#9C9488', alignment: 5 });
  ['Art', 'Plate', 'Shade', 'BigTitle', 'BigSub', 'Title', 'Sub', 'Box'].forEach((n, i) => b.patch(c + '/' + n, { display_order: i }));
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
