'use strict';
// 공통 UI 규격이 빌더(tools/build/ui-tokens.cjs)와 실행 코드(UIKit.mlua 「대화 상자 규격」·NpcWindow·StoryCard)에서 같은 값인지 확인한다.
// 10-22 사용자: 「공통으로 선언해 화면마다 다르지 않게」 — 한쪽만 바꾸면 여기서 실패한다.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { FRAME, DIALOG } = require('./build/ui-tokens.cjs');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const prop = (text, name) => {
  const m = text.match(new RegExp('property\\s+\\w+\\s+' + name + '\\s*=\\s*([0-9.]+)'));
  return m ? Number(m[1]) : NaN;
};

const kit = read('RootDesk/MyDesk/UI/Core/UIKit.mlua');
const npc = read('RootDesk/MyDesk/UI/Windows/NpcWindow.mlua');
const story = read('RootDesk/MyDesk/UI/Hud/StoryCard.mlua');
const pairs = [
  ['UIKit.DialogWidth', prop(kit, 'DialogWidth'), DIALOG.width],
  ['UIKit.DialogPadX', prop(kit, 'DialogPadX'), FRAME.padX],
  ['UIKit.DialogContentTop', prop(kit, 'DialogContentTop'), FRAME.contentTop],
  ['UIKit.DialogGap', prop(kit, 'DialogGap'), FRAME.gap],
  ['UIKit.DialogPortraitW', prop(kit, 'DialogPortraitW'), DIALOG.portrait.w],
  ['UIKit.DialogTextPadX', prop(kit, 'DialogTextPadX'), DIALOG.textPad.x],
  ['UIKit.DialogTextPadY', prop(kit, 'DialogTextPadY'), DIALOG.textPad.y],
  ['UIKit.DialogPageNoH', prop(kit, 'DialogPageNoH'), DIALOG.pageNo.h],
  ['UIKit.DialogPageNoBottom', prop(kit, 'DialogPageNoBottom'), DIALOG.pageNo.bottom],
  ['UIKit.DialogFontPc', prop(kit, 'DialogFontPc'), DIALOG.font.pc],
  ['UIKit.DialogFontMobile', prop(kit, 'DialogFontMobile'), DIALOG.font.mobile],
  ['NpcWindow.PaperHeight', prop(npc, 'PaperHeight'), DIALOG.npcPaperH],
  ['StoryCard.PaperH', prop(story, 'PaperH'), DIALOG.storyPaperH],
];
let bad = 0;
for (const [name, lua, js] of pairs) {
  if (lua !== js) {
    bad++;
    console.log(`  ✗ ${name} = ${lua} · ui-tokens.cjs = ${js}`);
  }
}
console.log(`[check_ui_tokens] 규격 ${pairs.length}개, 어긋남 ${bad}건`);
process.exit(bad ? 1 : 0);
