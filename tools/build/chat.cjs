'use strict';
// 채팅 (ChatHUD, 10-12): MSW 기본 채팅창(ChatComponent)을 메이플처럼 왼쪽 아래에 둔다.
// 말한 내용은 채팅창에 쌓이고, 플레이어 머리 위 말풍선(ChatBalloonComponent · ChatModeEnabled)으로도 뜬다.
// 시스템 알림(획득·의뢰·알림 띠)은 지금처럼 화면 가운데 위 알림 자리에 따로 뜬다 — 채팅과 섞이지 않는다.
// 자리: 생명 오브(왼쪽 아래 ~190px) 위. 창보다 아래에 그린다 (tools/build/ui-order.cjs에서 GameHUD 다음).
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));

function run() {
  const file = path.join(root, 'ui', 'ChatHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('ChatHUD', 5, true);
  b.chat('Chat', {
    anchor: 'bottom-left', pos: [16, 210], rect_size: [520, 300],
    use_chat_balloon: true, expand: true, use_chat_emotion: true,
    enable_voice_chat: false, hide_world_chat_button: false, message_align_bottom: true,
  });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('Chat UI entities: ' + run());
module.exports = { run };
