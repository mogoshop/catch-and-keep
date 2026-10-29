"use strict";
// 오른쪽을 향하는 투명 꺾쇠. PlayerAttack가 +x 기준으로 회전시킨다.
const { UIBuilder, P, load } = require('./lib.cjs');
function applyResources(b) {
  const icons = Object.fromEntries(load('ui_icons').map(x => [x.key, x.ruid]));
  if (!icons.aim_chevron) throw new Error('aim_chevron 업로드 RUID가 없습니다');
  b.patch('Direction', { rect_size: [24, 30] });
  b.patchComponent('Direction', 'MOD.Core.SpriteGUIRendererComponent', {
    ImageRUID: { DataId: icons.aim_chevron }, Type: 0,
    Color: { r: 1, g: 0.93, b: 0.78, a: 1 }, RaycastTarget: false
  });
}
function run() {
  const file = P.ui('AimHUD');
  const b = UIBuilder.load(file);
  if (!b.find('Direction')) b.sprite('Direction', { anchor: 'middle-center', pos: [0, 0], rect_size: [24, 30], enable: false });
  // 44-2 궁극기 연출: 내 화면만 0.25초 어둡게 (SkillEffects.ShowUltimate가 알파를 0.42 → 0으로 걷는다). AimHUD는 가장 아래 UI 그룹(ui-order 0)이라
  //   월드만 어두워지고 HUD·창은 그대로 밝다. 누름을 가로채지 않게 RaycastTarget 끔 · 화면 비율이 달라도 덮게 크게(확인 창 Dim과 같은 4000×3000) · 조준 쐐기보다 뒤
  b.panel('UltDim', { anchor: 'middle-center', pos: [0, 0], rect_size: [4000, 3000], color: { r: 0, g: 0, b: 0, a: 0 }, raycast: false, enable: false });
  b.patch('UltDim', { display_order: 0 });
  b.patch('Direction', { display_order: 1 });
  applyResources(b);
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}
if (require.main === module) console.log('Aim HUD entities: ' + run());
module.exports = { run, applyResources };
