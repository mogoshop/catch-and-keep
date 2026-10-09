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
  applyResources(b);
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}
if (require.main === module) console.log('Aim HUD entities: ' + run());
module.exports = { run, applyResources };
