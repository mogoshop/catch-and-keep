'use strict';
// 소환수 띠 (CompanionHUD): 같은 종류는 초상 하나에 「×N」으로 묶는다 (CompanionHUD.mlua가 종류별로 모은다).
// 기존 띠의 UUID·배치를 유지하고 칸마다 수 표시(Count)만 더한다. 모바일 위치는 스크립트가 생명·마나 오브 위로 옮긴다.
const { UIBuilder, P } = require('./lib.cjs');

function run() {
  const file = P.ui('CompanionHUD');
  const b = UIBuilder.load(file);
  for (let i = 1; i <= 4; i++) {
    const unit = `SafeArea/Strip/Unit${i}`;
    b.text(`${unit}/Count`, '', { anchor: 'top-right', pos: [-6, -4], rect_size: [56, 28], size: 21, bold: true, color: '#F6E3B0', alignment: 5, outline: true, outline_color: '#1A1410', outline_width: 0.3 });
    // 초상은 테두리(위 84) 한가운데 기준 — 그림 비율에 따라 크기가 달라도 가운데에 온다 (10-13: 위쪽 기준이라 작은 그림이 칸 위에 붙었다)
    b.patch(`${unit}/Portrait`, { anchor: 'top-center', pivot: [0.5, 0.5], pos: [0, -42] });
  }
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Companion HUD entities: ' + run());
module.exports = { run };
