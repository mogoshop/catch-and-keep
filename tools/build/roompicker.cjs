'use strict';
// 게임 고르기 (10-22 개편 · docs/design/30): 캐릭터 선택과 같은 어두운 전체 화면(CharSelectHUD) 위에 이어서 뜬다.
//   첫 화면(Home) = 그림 카드 두 장 「솔로 플레이」 「파티 플레이」 + 캐릭터 선택 · 채널 변경
//   파티 플레이(List) = 방 목록 + 새로 고침 · 방 만들기 · 뒤로
//   덮는 판: 방 만들기(Create) · 비밀번호(Ask) · 모집(Party) · 불러오는 중(Loading)
// 컨트롤러: RootDesk/MyDesk/UI/Windows/RoomWindow.mlua (UIKit 창 별칭 RoomWin → /ui/CharSelectHUD/SafeArea/Room)
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const { readIfExists, preserveIds } = require('./lib.cjs');
const rows = load('ui_icons');
const icons = Object.fromEntries(rows.map((x) => [x.key, x.ruid]));
const part = (key) => { const r = rows.find((x) => x.key === key); return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) }; };

const CARD_SOLO = 'b02bf701dc0743b3b0d79d02ec113a5f';    // 코덱스 게임 고르기 카드 v1 솔로 1320×750 (10-22 사용자 확정)
const CARD_PARTY = '8bac69b9e8fa4c17ad815abb5f38b3fb';   // 코덱스 게임 고르기 카드 v1 파티 1320×750 (10-22 사용자 확정)
const GOLD = '#E6C88A', TEXT = '#E6DCC6', DIM = '#A8A090';
const ROWS = 7;

function run() {
  const file = path.join(root, 'ui', 'CharSelectHUD.' + 'ui');
  const previous = readIfExists(file);   // 다시 지어도 같은 경로는 옛 id 그대로 (10-22: 빌드마다 id가 바뀌어 메이커가 게임 고르기 하위 요소를 놓쳤다)
  const b = UIBuilder.read(file);
  const R = 'SafeArea/Room';
  if (b.find(R)) b.remove(R);
  const btn = (name, text, opts) => b.button(name, text, { image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: TEXT, ...opts });
  const ok = (name, text, opts) => btn(name, text, { bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: '#F4E2B0', ...opts });
  const rim = (name, key, w, h) => {
    b.sprite(name + '/Rim', { anchor: 'middle-center', pos: [0, 0], rect_size: [w, h], ...part(key), sprite_type: 1 });
    b.patchComponent(name + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  };
  const input = (name, opts) => b.textInput(name, { line_type: 0, font_size: 24, color: '#F3E7CC', ...part('win_content'), bg_color: part('win_content').color, sprite_type: 1, ...opts });

  // 화면 전체를 덮는 어두운 바탕 (캐릭터 선택과 같은 색 · 뒤의 로비와 HUD를 가리고 입력을 막는다)
  b.panel(R, { anchor: 'middle-center', rect_size: [1920, 1080], color: { r: 0.03, g: 0.02, b: 0.04, a: 0.96 }, raycast: true, enable: false });
  const box = R + '/Box';
  b.panel(box, { rect_size: [1520, 800], pos: [0, 10], color: '#100E16', raycast: true });
  b.sprite(box + '/Rim', { rect_size: [1560, 840], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(box + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(box + '/Title', '게임 고르기', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [900, 40], size: 28, color: GOLD, alignment: 4, bold: true });

  // ── 첫 화면: 그림 카드 두 장 ──
  const home = box + '/Home';
  b.empty(home, { anchor: 'middle-center', rect_size: [1520, 800] });
  b.text(home + '/Info', '어떻게 플레이할까요?', { anchor: 'top-center', pos: [0, -92], rect_size: [1300, 40], size: 24, color: DIM, alignment: 4 });
  const card = (name, x, art, title, desc) => {
    const c = home + '/' + name;
    b.button(c, '', { anchor: 'middle-center', pos: [x, 8], rect_size: [660, 540], image_ruid: icons.btn_frame, bg_color: '#1A1622', sprite_type: 1 });
    b.sprite(c + '/Art', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -22], rect_size: [616, 350], image_ruid: art, color: '#FFFFFF', sprite_type: 0 });
    b.patchComponent(c + '/Art', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
    b.text(c + '/Name', title, { anchor: 'bottom-center', pos: [0, 104], rect_size: [600, 60], size: 42, bold: true, color: GOLD, alignment: 4 });
    b.text(c + '/Desc', desc, { anchor: 'bottom-center', pos: [0, 48], rect_size: [600, 40], size: 21, color: DIM, alignment: 4 });
  };
  card('Solo', -350, CARD_SOLO, '솔로 플레이', '나만의 게임 · 다른 사람은 들어오지 않는다');
  card('Party', 350, CARD_PARTY, '파티 플레이', '방에 들어가거나 직접 만든다 · 최대 4명');
  // 10-22 사용자: 왼쪽 아래 모서리에 붙은 두 버튼이 새 카드 그림과 어색했다 → 카드 아래 가운데에 나란히, 안내 줄은 그 위
  b.text(home + '/Note', '', { anchor: 'middle-center', pos: [0, -290], rect_size: [1300, 32], size: 18, color: DIM, alignment: 4, bestfit: true, min_size: 14, max_size: 18 });
  btn(home + '/BtnChar', '캐릭터 선택', { anchor: 'middle-center', pos: [-160, -342], rect_size: [290, 66], font_size: 22 });
  btn(home + '/BtnChannel', '채널 변경', { anchor: 'middle-center', pos: [160, -342], rect_size: [290, 66], font_size: 22 });

  // ── 파티 플레이: 방 목록 ──
  const list = box + '/List';
  b.empty(list, { anchor: 'middle-center', rect_size: [1520, 800], enable: false });
  btn(list + '/BtnBack', '◀  뒤로', { anchor: 'top-left', pos: [44, -78], rect_size: [200, 64], font_size: 22 });
  b.text(list + '/Head', '열린 방 (공개 · [비공개] · [모집 중])', { anchor: 'top-center', pos: [0, -94], rect_size: [900, 36], size: 22, color: DIM, alignment: 4 });
  btn(list + '/BtnRefresh', '새로 고침', { anchor: 'top-right', pos: [-44, -78], rect_size: [220, 64], font_size: 22 });
  for (let i = 1; i <= ROWS; i++) {
    btn(list + '/R' + i, '', { anchor: 'top-center', pos: [0, -168 - (i - 1) * 68], rect_size: [1420, 60], font_size: 22 });
  }
  b.text(list + '/Empty', '열린 방이 아직 없습니다\n「방 만들기」로 먼저 열고 친구를 불러 보세요', { anchor: 'middle-center', pos: [0, 10], rect_size: [1100, 120], size: 28, color: DIM, alignment: 4, enable: false });
  b.text(list + '/Note', '', { anchor: 'bottom-left', pos: [48, 40], rect_size: [980, 36], size: 18, color: DIM, alignment: 3, bestfit: true, min_size: 14, max_size: 18 });
  ok(list + '/BtnCreate', '방 만들기', { anchor: 'bottom-right', pos: [-44, 22], rect_size: [360, 76], font_size: 26 });

  // ── 덮는 판 (같은 상자 위) ──
  // 덮는 판이 열리면 컨트롤러가 아래 화면(Home·List)을 숨긴다 (win_content 그림이 반투명이라 비친다)
  const sheet = (name) => {
    b.panel(name, { anchor: 'middle-center', pos: [0, -30], rect_size: [1440, 700], ...part('win_content'), sprite_type: 1, raycast: true, enable: false });
  };
  // 방 만들기: 이름 · 공개/비공개 · 비밀번호 · 인원 2~4
  const cr = box + '/Create';
  sheet(cr);
  b.text(cr + '/Title', '방 만들기', { anchor: 'top-center', pos: [0, -28], rect_size: [600, 44], size: 28, bold: true, color: GOLD, alignment: 4 });
  const label = (name, text, y) => b.text(name, text, { anchor: 'top-left', pos: [180, y], rect_size: [200, 60], size: 22, color: GOLD, alignment: 3 });
  label(cr + '/NameLabel', '방 이름', -110);
  input(cr + '/Name', { anchor: 'top-left', pivot: [0, 1], pos: [400, -104], rect_size: [760, 72], placeholder: '비우면 「(이름)의 게임」', char_limit: 16 });
  label(cr + '/LockLabel', '공개 여부', -220);
  btn(cr + '/BtnPublic', '공개', { anchor: 'top-left', pos: [400, -214], rect_size: [220, 70], font_size: 22 });
  btn(cr + '/BtnPrivate', '비공개', { anchor: 'top-left', pos: [636, -214], rect_size: [220, 70], font_size: 22 });
  label(cr + '/PwLabel', '비밀번호', -330);
  input(cr + '/Pw', { anchor: 'top-left', pivot: [0, 1], pos: [400, -324], rect_size: [456, 72], placeholder: '비공개 방만', char_limit: 12 });
  label(cr + '/MaxLabel', '최대 인원', -440);
  [2, 3, 4].forEach((n, i) => btn(cr + '/Max' + n, n + '명', { anchor: 'top-left', pos: [400 + i * 160, -434], rect_size: [146, 70], font_size: 22 }));
  btn(cr + '/BtnBack', '취소', { anchor: 'bottom-left', pos: [60, 34], rect_size: [240, 76], font_size: 22 });
  ok(cr + '/BtnMake', '만들고 친구 모으기', { anchor: 'bottom-right', pos: [-60, 34], rect_size: [360, 76], font_size: 24 });
  // 비공개 방 비밀번호
  const ask = box + '/Ask';
  b.panel(ask, { anchor: 'middle-center', pos: [0, -30], rect_size: [760, 360], ...part('win_content'), sprite_type: 1, raycast: true, enable: false });
  b.text(ask + '/Title', '', { anchor: 'top-center', pos: [0, -30], rect_size: [680, 44], size: 26, bold: true, color: GOLD, alignment: 4 });
  input(ask + '/Pw', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -104], rect_size: [560, 72], placeholder: '비밀번호', char_limit: 12 });
  btn(ask + '/BtnCancel', '취소', { anchor: 'bottom-left', pos: [60, 34], rect_size: [240, 76], font_size: 22 });
  ok(ask + '/BtnJoin', '들어가기', { anchor: 'bottom-right', pos: [-60, 34], rect_size: [240, 76], font_size: 22 });
  // 모집: 모인 사람 · 팀장 「출발」
  const party = box + '/Party';
  sheet(party);
  b.text(party + '/Title', '', { anchor: 'top-center', pos: [0, -28], rect_size: [1300, 44], size: 26, bold: true, color: GOLD, alignment: 4, bestfit: true, min_size: 18, max_size: 26 });
  b.text(party + '/Members', '', { anchor: 'top-left', pos: [160, -110], rect_size: [1120, 300], size: 26, color: '#FFFFFF', alignment: 0 });
  b.text(party + '/Note', '', { anchor: 'bottom-center', pos: [0, 130], rect_size: [1300, 70], size: 20, color: DIM, alignment: 4, bestfit: true, min_size: 14, max_size: 20 });
  btn(party + '/BtnLeave', '나가기', { anchor: 'bottom-left', pos: [60, 34], rect_size: [240, 76], font_size: 22 });
  ok(party + '/BtnStart', '출발', { anchor: 'bottom-right', pos: [-60, 34], rect_size: [360, 76], font_size: 28 });
  // 불러오는 중 (캐릭터 선택 「입장」 직후 · 방 목록을 받기 전)
  b.text(box + '/Loading', '캐릭터를 불러오는 중…', { anchor: 'middle-center', pos: [0, 0], rect_size: [1000, 60], size: 30, color: DIM, alignment: 4, enable: false });

  b.write(file, { lint_verbose: false });
  preserveIds(file, previous);
  return b.listEntities().length;
}

if (require.main === module) console.log('RoomPicker UI entities: ' + run());
module.exports = { run };
