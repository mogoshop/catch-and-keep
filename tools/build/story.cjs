'use strict';
// 이야기 카드 (StoryHUD, docs/design/18 §3-4): 시작 내레이션 · 장 표시 · 장 마무리를 화면 전체를 어둡게 덮고 띄운다.
// 컨트롤러는 RootDesk/MyDesk/UI/Hud/StoryCard.mlua (_StoryCard). 카드 전체가 버튼이라 아무 곳이나 누르면 넘어간다.
const { UIBuilder, P, load } = require('./lib.cjs');
const icons = Object.fromEntries(load('ui_icons').map((r) => [r.key, r.ruid]));
const { FRAME, COLOR, DIALOG, dialogLayout, portraitSprite } = require('./ui-tokens.cjs');

function run() {
  const file = P.ui('StoryHUD');
  const b = require('fs').existsSync(file) ? UIBuilder.load(file) : new UIBuilder('StoryHUD', 39, true);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  const c = 'SafeArea/Card';
  // 10-22 개편 (사용자 C안): 화면 전체 = 이야기 그림(천천히 다가오는 움직임은 StoryCard가 준다) · 왼쪽 위 = 장면 제목 ·
  // 아래 = NPC 대화창 모양 상자(큰 초상화 + 이름 + 여러 줄 대사). 장 제목 카드는 가운데 큰 글자(BigTitle)만
  // 예전 배치의 칸(가운데 글·화자 그림)은 지운다. 나머지는 같은 경로를 고쳐 쓰므로 엔티티 id가 그대로다
  for (const old of ['Who', 'Body', 'Hint']) { try { b.remove(c + '/' + old); } catch (e) { /* 이미 없다 */ } }
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
  // 대화 상자: NPC 대화창과 같은 공통 규격 (tools/build/ui-tokens.cjs) — 테두리 · 이름 띠 · 초상화 칸 · 글 칸(Paper) · 쪽 표시
  const box = c + '/Box';
  const H = FRAME.contentTop + DIALOG.storyPaperH + FRAME.padBottom;
  const L = dialogLayout(H, true);
  for (const old of ['Body', 'Hint']) { try { b.remove(box + '/' + old); } catch (e) { /* 이미 Paper 안으로 옮겼다 */ } }
  // 카드(4000×3000) 가운데 = 화면 가운데 → 화면 아래에서 48 띄운 자리 (1080 화면 기준)
  b.panel(box, { anchor: 'middle-center', pos: [0, -(540 - 48 - H / 2)], rect_size: [DIALOG.width, H], color: COLOR.panel, sprite_type: 1, raycast: false });
  b.sprite(box + '/Rim', { anchor: 'middle-center', pos: [0, 0], rect_size: [DIALOG.width + FRAME.rimOut * 2, H + FRAME.rimOut * 2], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(box + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  // 이름 = 창 제목과 같은 규칙 (위에서 titleTop · 띠 세로 가운데 · 모든 화자 같은 색)
  b.text(box + '/Name', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -FRAME.titleTop], rect_size: [DIALOG.width - 260, FRAME.titleH], size: FRAME.titleSize, bold: true, color: COLOR.title, alignment: 4, outline: true, outline_color: '#2D2D2D' });
  b.panel(box + '/PortraitBox', { anchor: 'top-left', pivot: [0, 1], pos: [L.portraitX, -FRAME.contentTop], rect_size: [DIALOG.portrait.w, L.paperH], image_ruid: icons.win_content, color: '#000000', alpha: 0.35, sprite_type: 1, raycast: false });
  b.sprite(box + '/PortraitBox/Portrait', { ...portraitSprite(L.paperH), enable: false });
  b.patchComponent(box + '/PortraitBox/Portrait', 'MOD.Core.SpriteGUIRendererComponent', { PreserveSprite: 0 });
  b.panel(box + '/Paper', { anchor: 'top-left', pivot: [0, 1], pos: [L.paperX, -FRAME.contentTop], rect_size: [L.paperW, L.paperH], image_ruid: icons.win_content, color: '#000000', alpha: 0.3, sprite_type: 1, raycast: false });
  b.text(box + '/Paper/Body', '', { anchor: 'top-left', pos: [DIALOG.textPad.x, -DIALOG.textPad.y], rect_size: [L.paperW - DIALOG.textPad.x * 2, L.paperH - DIALOG.textPad.y * 2 - DIALOG.pageNo.h + DIALOG.pageNo.bottom], size: DIALOG.font.pc, color: COLOR.body, alignment: 0 });
  b.patchComponent(box + '/Paper/Body', 'MOD.Core.TextGUIRendererComponent', { BestFit: true, MinSize: DIALOG.font.min, MaxSize: DIALOG.font.pc });
  b.text(box + '/Paper/Hint', '', { anchor: 'bottom-right', pos: [-DIALOG.pageNo.right, DIALOG.pageNo.bottom], rect_size: [DIALOG.pageNo.w, DIALOG.pageNo.h], size: DIALOG.pageNo.size, color: COLOR.dim, alignment: 8 });
  ['Rim', 'Name', 'PortraitBox', 'Paper'].forEach((n, i) => b.patch(box + '/' + n, { display_order: i }));
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
