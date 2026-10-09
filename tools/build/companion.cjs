'use strict';
// 소환수 띠 (CompanionHUD): 같은 종류는 초상 하나에 「×N」으로 묶는다 (CompanionHUD.mlua가 종류별로 모은다).
// 기존 띠의 UUID·배치를 유지하고 칸마다 수 표시(Count)만 더한다. 모바일 위치는 스크립트가 생명·마나 오브 위로 옮긴다.
const { UIBuilder, P } = require('./lib.cjs');

function run() {
  const file = P.ui('CompanionHUD');
  const b = UIBuilder.load(file);
  for (let i = 1; i <= 4; i++) {
    const unit = `SafeArea/Strip/Unit${i}`;
    b.text(`${unit}/Count`, '', { anchor: 'top-right', pos: [-2, -2], rect_size: [64, 34], size: 26, bold: true, color: '#F6E3B0', alignment: 5, outline: true, outline_color: '#1A1410', outline_width: 0.3 });
  }
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Companion HUD entities: ' + run());
module.exports = { run };
