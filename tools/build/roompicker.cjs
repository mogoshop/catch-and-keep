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
// 여백·버튼은 공통 규격만 쓴다 (10-22 사용자: 화면마다 제각각이던 22·34·44·60 여백 정리)
const { FRAME, INNER, BUTTON, SPACE, buttonText } = require('./ui-tokens.cjs');
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
  const btn = (name, text, opts) => {
    const o = { image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: TEXT, ...opts };
    b.button(name, text, o);
    b.patchComponent(name, 'MOD.Core.TextGUIRendererComponent', buttonText(o.font_size));
  };
  const ok = (name, text, opts) => btn(name, text, { bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: '#F4E2B0', ...opts });
  const rim = (name, key, w, h) => {
    b.sprite(name + '/Rim', { anchor: 'middle-center', pos: [0, 0], rect_size: [w, h], ...part(key), sprite_type: 1 });
    b.patchComponent(name + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  };
  const input = (name, opts) => b.textInput(name, { line_type: 0, font_size: 24, ...part('win_content'), color: '#F3E7CC', placeholder_color: '#8A8172', bg_color: part('win_content').color, sprite_type: 1, ...opts });

  // 화면 전체를 덮는 어두운 바탕 (캐릭터 선택과 같은 색 · 뒤의 로비와 HUD를 가리고 입력을 막는다)
  b.panel(R, { anchor: 'middle-center', rect_size: [1920, 1080], color: { r: 0.03, g: 0.02, b: 0.04, a: 0.96 }, raycast: true, enable: false });
  const box = R + '/Box';
  const BW = 1520, BH = 800;
  b.panel(box, { rect_size: [BW, BH], pos: [0, 10], color: '#100E16', raycast: true });
  b.sprite(box + '/Rim', { rect_size: [BW + FRAME.rimOut * 2, BH + FRAME.rimOut * 2], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.patchComponent(box + '/Rim', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
  b.text(box + '/Title', '게임 고르기', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -FRAME.titleTop], rect_size: [900, FRAME.titleH], size: FRAME.titleSize, color: GOLD, alignment: 4, bold: true });
  // 내용 칸 (테두리 안쪽 경계 + 12): 위 contentTop · 좌우 padX · 아래 padBottom. 세로 좌표는 상자 가운데 기준
  const top = BH / 2 - FRAME.contentTop, bottom = -BH / 2 + FRAME.padBottom, innerW = BW - FRAME.padX * 2;

  // ── 첫 화면: 그림 카드 두 장 ──
  const home = box + '/Home';
  b.empty(home, { anchor: 'middle-center', rect_size: [1520, 800] });
  // 위에서 아래로: 안내(40) · SPACE · 카드 · SPACE · 상태 줄(32) · SPACE · 버튼(88) · 아래 여백
  const infoH = 40, noteH = 32, sp = SPACE;
  const btnTop = bottom + BUTTON.h, noteY = btnTop + sp + noteH / 2, cardTop = top - infoH - sp, cardBottom = btnTop + sp + noteH + sp;
  const cardH = cardTop - cardBottom, cardW = (innerW - 80) / 2;   // 두 카드 사이 80
  b.text(home + '/Info', '어떻게 플레이할까요?', { anchor: 'middle-center', pos: [0, top - infoH / 2], rect_size: [1300, infoH], size: 24, color: DIM, alignment: 4 });
  const artW = cardW - 72, artH = Math.round(artW * 750 / 1320);   // 카드 그림 1320×750 비율 그대로
  const card = (name, x, art, title, desc) => {
    const c = home + '/' + name;
    b.button(c, '', { anchor: 'middle-center', pos: [x, (cardTop + cardBottom) / 2], rect_size: [cardW, cardH], image_ruid: icons.btn_frame, bg_color: '#1A1622', sprite_type: 1 });
    b.sprite(c + '/Art', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -20], rect_size: [artW, artH], image_ruid: art, color: '#FFFFFF', sprite_type: 0 });
    b.patchComponent(c + '/Art', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: false });
    b.text(c + '/Name', title, { anchor: 'bottom-center', pos: [0, 64], rect_size: [cardW - 60, 52], size: 40, bold: true, color: GOLD, alignment: 4 });
    b.text(c + '/Desc', desc, { anchor: 'bottom-center', pos: [0, 22], rect_size: [cardW - 60, 34], size: 21, color: DIM, alignment: 4 });
  };
  card('Solo', -(cardW / 2 + 40), CARD_SOLO, '솔로 플레이', '나만의 게임 · 다른 사람은 들어오지 않는다');
  card('Party', cardW / 2 + 40, CARD_PARTY, '파티 플레이', '방에 들어가거나 직접 만든다 · 최대 4명');
  b.text(home + '/Note', '', { anchor: 'middle-center', pos: [0, noteY], rect_size: [1300, noteH], size: 18, color: DIM, alignment: 4, bestfit: true, min_size: 14, max_size: 18 });
  btn(home + '/BtnChar', '캐릭터 선택', { anchor: 'middle-center', pos: [-(BUTTON.w + FRAME.gap) / 2 - 20, bottom + BUTTON.h / 2], rect_size: [BUTTON.w + 40, BUTTON.h], font_size: BUTTON.font });
  btn(home + '/BtnChannel', '채널 변경', { anchor: 'middle-center', pos: [(BUTTON.w + FRAME.gap) / 2 + 20, bottom + BUTTON.h / 2], rect_size: [BUTTON.w + 40, BUTTON.h], font_size: BUTTON.font });

  // ── 파티 플레이: 방 목록 ──
  const list = box + '/List';
  b.empty(list, { anchor: 'middle-center', rect_size: [1520, 800], enable: false });
  btn(list + '/BtnBack', '◀  뒤로', { anchor: 'top-left', pos: [FRAME.padX, -FRAME.contentTop], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  b.text(list + '/Head', '열린 방 (공개 · [비공개] · [모집 중])', { anchor: 'top-center', pos: [0, -FRAME.contentTop], rect_size: [900, BUTTON.h], size: 22, color: DIM, alignment: 4 });
  btn(list + '/BtnRefresh', '새로 고침', { anchor: 'top-right', pos: [-FRAME.padX, -FRAME.contentTop], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  const rowTop = FRAME.contentTop + BUTTON.h + FRAME.gap, rowH = 60, rowStep = rowH + 8;
  for (let i = 1; i <= ROWS; i++) {
    btn(list + '/R' + i, '', { anchor: 'top-center', pos: [0, -(rowTop + (i - 1) * rowStep)], rect_size: [innerW, rowH], font_size: BUTTON.font });
  }
  b.text(list + '/Empty', '열린 방이 아직 없습니다\n「방 만들기」로 먼저 열고 친구를 불러 보세요', { anchor: 'middle-center', pos: [0, 10], rect_size: [1100, 120], size: 28, color: DIM, alignment: 4, enable: false });
  b.text(list + '/Note', '', { anchor: 'bottom-left', pos: [FRAME.padX, FRAME.buttonBottom], rect_size: [innerW - BUTTON.wide - FRAME.gap, BUTTON.h], size: 18, color: DIM, alignment: 3, bestfit: true, min_size: 14, max_size: 18 });
  ok(list + '/BtnCreate', '방 만들기', { anchor: 'bottom-right', pos: [-FRAME.padX, FRAME.buttonBottom], rect_size: [BUTTON.wide, BUTTON.h], font_size: BUTTON.fontMain });

  // ── 덮는 판 (같은 상자 위) ──
  // 덮는 판이 열리면 컨트롤러가 아래 화면(Home·List)을 숨긴다 (win_content 그림이 반투명이라 비친다)
  const sheet = (name) => {
    b.panel(name, { anchor: 'middle-center', pos: [0, (top + bottom) / 2], rect_size: [innerW, top - bottom], ...part('win_content'), sprite_type: 1, raycast: true, enable: false });
  };
  // 방 만들기: 이름 · 공개/비공개 · 비밀번호 · 인원 2~4
  const cr = box + '/Create';
  sheet(cr);
  b.text(cr + '/Title', '방 만들기', { anchor: 'top-center', pos: [0, -INNER.pad], rect_size: [600, 44], size: 28, bold: true, color: GOLD, alignment: 4 });
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
  btn(cr + '/BtnBack', '취소', { anchor: 'bottom-left', pos: [INNER.pad, INNER.pad], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  ok(cr + '/BtnMake', '만들고 친구 모으기', { anchor: 'bottom-right', pos: [-INNER.pad, INNER.pad], rect_size: [BUTTON.wide, BUTTON.h], font_size: BUTTON.font + 2 });
  // 비공개 방 비밀번호
  const ask = box + '/Ask';
  b.panel(ask, { anchor: 'middle-center', pos: [0, (top + bottom) / 2], rect_size: [760, 380], ...part('win_content'), sprite_type: 1, raycast: true, enable: false });
  b.text(ask + '/Title', '', { anchor: 'top-center', pos: [0, -INNER.pad], rect_size: [680, 44], size: 26, bold: true, color: GOLD, alignment: 4 });
  input(ask + '/Pw', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -104], rect_size: [560, 72], placeholder: '비밀번호', char_limit: 12 });
  btn(ask + '/BtnCancel', '취소', { anchor: 'bottom-left', pos: [INNER.pad, INNER.pad], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  ok(ask + '/BtnJoin', '들어가기', { anchor: 'bottom-right', pos: [-INNER.pad, INNER.pad], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  // 모집: 모인 사람 · 팀장 「출발」
  const party = box + '/Party';
  sheet(party);
  b.text(party + '/Title', '', { anchor: 'top-center', pos: [0, -INNER.pad], rect_size: [1300, 44], size: 26, bold: true, color: GOLD, alignment: 4, bestfit: true, min_size: 18, max_size: 26 });
  b.text(party + '/Members', '', { anchor: 'top-left', pos: [160, -110], rect_size: [1120, 300], size: 26, color: '#FFFFFF', alignment: 0 });
  b.text(party + '/Note', '', { anchor: 'bottom-center', pos: [0, INNER.pad + BUTTON.h + FRAME.gap], rect_size: [1300, 70], size: 20, color: DIM, alignment: 4, bestfit: true, min_size: 14, max_size: 20 });
  btn(party + '/BtnLeave', '나가기', { anchor: 'bottom-left', pos: [INNER.pad, INNER.pad], rect_size: [BUTTON.w, BUTTON.h], font_size: BUTTON.font });
  ok(party + '/BtnStart', '출발', { anchor: 'bottom-right', pos: [-INNER.pad, INNER.pad], rect_size: [BUTTON.wide, BUTTON.h], font_size: BUTTON.fontMain + 2 });
  // 불러오는 중 (캐릭터 선택 「입장」 직후 · 방 목록을 받기 전)
  b.text(box + '/Loading', '캐릭터를 불러오는 중…', { anchor: 'middle-center', pos: [0, 0], rect_size: [1000, 60], size: 30, color: DIM, alignment: 4, enable: false });

  b.write(file, { lint_verbose: false });
  preserveIds(file, previous);
  return b.listEntities().length;
}

if (require.main === module) console.log('RoomPicker UI entities: ' + run());
module.exports = { run };
