'use strict';
// 조준 방향 표시 (AimHUD/Direction): 몬스터 화살 그림 대신 반투명한 꺾쇠(>) 그림.
// PlayerAttack.UpdateAimIndicator가 위치·회전(+x 방향 기준)을 정한다. 경로는 그대로 둔다.
const { UIBuilder, P } = require('./lib.cjs');

function run() {
  const file = P.ui('AimHUD');
  const b = UIBuilder.load(file);
  // 반투명 꺾쇠(>) 그림 (메이플 리소스). UI 도형(polygon)은 화면에 그려지지 않아 그림을 쓴다
  if (b.find('Direction')) b.remove('Direction');
  b.sprite('Direction', { anchor: 'middle-center', pos: [0, 0], rect_size: [22, 28], image_ruid: '400cf2ff609d4bc0ab6cf62a110ef36f', color: { r: 1, g: 0.93, b: 0.78, a: 0.6 }, sprite_type: 0, enable: false });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Aim HUD entities: ' + run());
module.exports = { run };
