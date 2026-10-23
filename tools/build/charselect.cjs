'use strict';
// 캐릭터 선택 창 (CharSelectHUD): 월드에 들어오면 계정의 캐릭터 슬롯 4칸을 보여 준다.
// 칸을 고르고 「입장」, 빈 칸이면 이름을 적고 「새 캐릭터」, 「삭제」(확인 창). 창고는 계정 공용이라 어느 캐릭터로 들어가도 같다.
// 그룹 순서 30: 게임 HUD·창(5~20) 위, 확인 창(40) 아래. 컨트롤러는 RootDesk/MyDesk/UI/Windows/CharSelectWindow.mlua
const path = require('path'), fs = require('fs');
const root = process.env.MSW_WORLD_ROOT || path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const { load } = require(path.join(root, 'tools/lib/csv.cjs'));
const rows = load('ui_icons');
const icons = Object.fromEntries(rows.map((x) => [x.key, x.ruid]));
const part = (key) => { const r = rows.find((x) => x.key === key); return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) }; };
const SLOTS = 4;

// UI 아바타: 비어 있는 그림 자리 + 옷장(CostumeManager, 계정 옷 무시) + 아바타 그리기 — 옷은 CharSelectWindow가 칸마다 입힌다
function avatarOf(b) {
  return (name, opts) => {
    b.avatar(name, { ...opts, raycast: false, preserve_avatar: 1 });
    if (!b.hasComponent || !b.hasComponent(name, 'MOD.Core.CostumeManagerComponent')) {
      try { b.addComponent(name, 'MOD.Core.CostumeManagerComponent', { UseCustomEquipOnly: true }); } catch (e) { b.patchComponent(name, 'MOD.Core.CostumeManagerComponent', { UseCustomEquipOnly: true }); }
    }
  };
}

function run() {
  const file = path.join(root, 'ui', 'CharSelectHUD.' + 'ui');
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder('CharSelectHUD', 30, true);
  const avatar = avatarOf(b);
  b.empty('SafeArea', { anchor: 'stretch', rect_size: [1920, 1080] });
  // 화면 전체를 덮는 어두운 바탕 (뒤의 게임 입력을 막는다)
  const w = 'SafeArea/Win';
  b.panel(w, { anchor: 'middle-center', rect_size: [1920, 1080], color: { r: 0.03, g: 0.02, b: 0.04, a: 0.94 }, raycast: true, enable: false });
  const box = w + '/Box';
  b.panel(box, { rect_size: [1520, 800], pos: [0, 10], color: '#100E16', raycast: true });
  b.sprite(box + '/Rim', { rect_size: [1560, 840], image_ruid: icons.win_frame, color: '#FFFFFF', sprite_type: 1 });
  b.text(box + '/Title', '캐릭터 선택', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -17], rect_size: [900, 40], size: 28, color: '#E6C88A', alignment: 4, bold: true });
  b.text(box + '/Info', '', { anchor: 'top-left', pos: [48, -86], rect_size: [1424, 36], size: 22, color: '#C9BBA0', alignment: 3, bestfit: true, min_size: 18, max_size: 22 });
  // 슬롯 4칸 (가로로): 위 = 캐릭터 모습(UI 아바타 — 칸마다 CostumeManager로 그 캐릭터 외형을 입힌다), 아래 = 이름·레벨·난이도.
  // 빈 칸은 「+ 새 캐릭터」 — 누르면 만들기 판(Create)이 열린다 (10-13)
  for (let i = 1; i <= SLOTS; i++) {
    const n = box + '/S' + i;
    b.button(n, '', { anchor: 'top-left', pivot: [0, 1], pos: [48 + (i - 1) * 360, -136], rect_size: [340, 470], ...part('win_content'), bg_color: part('win_content').color, sprite_type: 1 });
    b.sprite(n + '/Pick', { rect_size: [340, 470], image_ruid: icons.slot_frame, color: '#E6C88A', sprite_type: 1, enable: false });
    b.text(n + '/No', String(i), { anchor: 'top-left', pos: [20, -14], rect_size: [60, 40], size: 26, bold: true, color: '#6E6658', alignment: 3 });
    avatar(n + '/Avatar', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -24], rect_size: [240, 290] });
    b.text(n + '/Plus', '+', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -96], rect_size: [200, 140], size: 120, bold: true, color: '#5E5648', alignment: 4, enable: false });
    b.text(n + '/Name', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -318], rect_size: [300, 46], size: 30, bold: true, color: '#F3E7CC', alignment: 4, bestfit: true, min_size: 20, max_size: 30 });
    b.text(n + '/Level', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -368], rect_size: [300, 36], size: 24, color: '#E6C88A', alignment: 4 });
    b.text(n + '/Diff', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -408], rect_size: [300, 36], size: 22, color: '#A99F8E', alignment: 4 });
  }
  // 예전 아래 줄 이름 입력은 만들기 판으로 옮겼다
  for (const old of [box + '/NameLabel', box + '/NameInput']) if (b.find(old)) b.remove(old);
  b.button(box + '/BtnDelete', '삭제', { anchor: 'bottom-right', pivot: [1, 0], pos: [-660, 40], rect_size: [220, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: '#E6DCC6' });
  b.button(box + '/BtnEnter', '입장', { anchor: 'bottom-right', pivot: [1, 0], pos: [-48, 40], rect_size: [592, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 30, color: '#F4E2B0' });

  // ── 캐릭터 만들기 판 (빈 칸을 누르면): 왼쪽 큰 미리보기, 오른쪽 이름·성별·머리 색·눈 색·무작위, 아래 만들기·취소 ──
  const c = box + '/Create';
  b.panel(c, { anchor: 'top-left', pivot: [0, 1], pos: [40, -76], rect_size: [1440, 690], color: '#100E16', raycast: true, enable: false });
  b.text(c + '/Title', '새 캐릭터 만들기', { anchor: 'top-left', pos: [520, -20], rect_size: [700, 50], size: 32, bold: true, color: '#E6C88A', alignment: 3 });
  b.panel(c + '/Stage', { anchor: 'top-left', pivot: [0, 1], pos: [40, -20], rect_size: [420, 560], ...part('win_content'), bg_color: part('win_content').color, sprite_type: 1 });
  avatar(c + '/Stage/Avatar', { anchor: 'middle-center', pos: [0, 10], rect_size: [340, 440] });
  b.text(c + '/Stage/Hint', '데몬슬레이어의 피를 이은 술사', { anchor: 'bottom-center', pos: [0, 16], rect_size: [400, 32], size: 20, color: '#A99F8E', alignment: 4 });
  const row = (name, label, y) => b.text(c + '/' + name, label, { anchor: 'top-left', pos: [520, y], rect_size: [180, 60], size: 26, color: '#C9BBA0', alignment: 3 });
  // 이름
  row('NameLabel', '이름', -100);
  b.textInput(c + '/NameInput', { anchor: 'top-left', pivot: [0, 1], pos: [720, -94], rect_size: [560, 76], placeholder: '이름 (최대 10글자)', char_limit: 10, line_type: 0, font_size: 26, ...part('win_content'), color: '#F3E7CC', placeholder_color: '#8A8172', bg_color: part('win_content').color, sprite_type: 1 });
  // 성별
  row('GenderLabel', '성별', -200);
  b.button(c + '/BtnMale', '남', { anchor: 'top-left', pivot: [0, 1], pos: [720, -194], rect_size: [200, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 28, color: '#E6DCC6' });
  b.button(c + '/BtnFemale', '여', { anchor: 'top-left', pivot: [0, 1], pos: [940, -194], rect_size: [200, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 28, color: '#E6DCC6' });
  // 머리 색 · 눈 색: ◀ 이름 ▶
  const pick = (key, label, y) => {
    row(key + 'Label', label, y);
    b.button(c + '/' + key + 'Prev', '◀', { anchor: 'top-left', pivot: [0, 1], pos: [720, y + 6], rect_size: [96, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 28, color: '#E6DCC6' });
    b.text(c + '/' + key + 'Name', '', { anchor: 'top-left', pos: [828, y], rect_size: [340, 64], size: 28, bold: true, color: '#F3E7CC', alignment: 4 });
    b.button(c + '/' + key + 'Next', '▶', { anchor: 'top-left', pivot: [0, 1], pos: [1184, y + 6], rect_size: [96, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 28, color: '#E6DCC6' });
  };
  pick('Hair', '머리 색', -300);
  pick('Face', '눈 색', -400);
  b.button(c + '/BtnRandom', '무작위', { anchor: 'top-left', pivot: [0, 1], pos: [720, -494], rect_size: [260, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: '#E6DCC6' });
  b.text(c + '/Note', '외형은 나중에 바꿀 수 없다\n장비를 입으면 옷과 무기 모습이 바뀐다', { anchor: 'top-left', pos: [40, -592], rect_size: [420, 70], size: 19, color: '#8C8270', alignment: 4 });
  b.button(c + '/BtnCancel', '취소', { anchor: 'bottom-right', pivot: [1, 0], pos: [-660, 24], rect_size: [220, 88], image_ruid: icons.btn_frame, bg_color: '#FFFFFF', sprite_type: 1, font_size: 24, color: '#E6DCC6' });
  b.button(c + '/BtnCreate', '만들기', { anchor: 'bottom-right', pivot: [1, 0], pos: [-40, 24], rect_size: [592, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, font_size: 30, color: '#F4E2B0' });
  // 첫 진입 로딩 화면: 처음부터 켜져 있어 스크립트가 돌기 전에도 바로 그려진다 (10-10 QA: 메이플월드 기본 캐릭터가 1.5초 보였다가
  // 캐릭터 슬롯이 켜졌다). 저장을 불러와 선택 창이 열리거나 캐릭터를 다 불러오면 CharSelectWindow가 끈다
  const boot = 'SafeArea/Boot';
  if (!b.find(boot)) {
    b.panel(boot, { anchor: 'middle-center', rect_size: [3840, 2160], color: { r: 0.02, g: 0.015, b: 0.03, a: 1 }, raycast: true });
    b.text(boot + '/Status', '불러오는 중…', { anchor: 'middle-center', pos: [0, -70], rect_size: [900, 50], size: 28, color: '#A99F8E', alignment: 4 });
  }
  // 10-22 이름 확정: 「메이플 리저렉션」 · 부제 「네크로맨서 편」 (디아블로처럼 직업이 여럿일 것 같은 제목이라 지금 직업을 부제로 밝힌다)
  for (const n of ['Title', 'Subtitle']) if (b.find(boot + '/' + n)) b.remove(boot + '/' + n);
  b.text(boot + '/Title', '메이플 리저렉션', { anchor: 'middle-center', pos: [0, 60], rect_size: [1000, 90], size: 64, bold: true, color: '#E6C88A', alignment: 4 });
  b.text(boot + '/Subtitle', '네크로맨서 편', { anchor: 'middle-center', pos: [0, -2], rect_size: [900, 46], size: 30, color: '#B79AD8', alignment: 4 });
  b.patch(boot + '/Status', { pos: [0, -70] });
  b.write(file, { lint_verbose: false });
  return b.listEntities().length;
}

if (require.main === module) console.log('CharSelect UI entities: ' + run());
module.exports = { run };
