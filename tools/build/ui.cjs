// UI 생성: GameHUD(상시 HUD·창·메뉴, 컨트롤러는 RootDesk/MyDesk/UI) + ShadowHUD(그림자 상태·보관함·모바일 패드).
// GameHUD는 매번 새로 만든다 (경로 = 컨트롤러가 찾는 이름. 이름을 바꾸면 UI/*의 경로도 같이).
// 그림은 data/ui_icons.csv: 코덱스 제작 음울한 테마(창·버튼·칸·미니맵 테두리, 오브, 빈 장비, 메뉴·스킬 아이콘, 9-slice 경계는 리소스에 설정)
// + msw-ui-kit simplefantasy 부품(안쪽 칸·정보 띠·등급 테두리·작은 아이콘, 색 마스크는 color·alpha 필수),
// 아이템·스킬 아이콘은 item_bases.csv·skills.csv의 icon 열(메이플 아이템·스킬 그림).
// PC 전용 = ActivePlatform 1, 모바일 전용 = 2 (나머지는 공용).
"use strict";
const { UIBuilder, P, quiet, readIfExists, preserveIds, load } = require("./lib.cjs");

const ICONS = load("ui_icons");
const K = Object.fromEntries(ICONS.map((r) => [r.key, r.ruid]));
// 테마 부품: 그림 + 정해진 색 (마스크 그림은 색 없이 쓰면 하얗게 덮이거나 안 보인다)
const part = (key) => {
  const r = ICONS.find((x) => x.key === key);
  if (!r) throw new Error(`ui_icons.csv에 ${key} 없음`);
  return { image_ruid: r.ruid, color: r.color, alpha: Number(r.alpha) };
};
const bg = (key) => { const q = part(key); return { image_ruid: q.image_ruid, bg_color: hexA(q.color, q.alpha) }; };
function iconColor(ruid) {
  const r = ICONS.find((x) => x.ruid === ruid);
  return r ? r.color : WHITE;
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}
const SKILL_ICON = Object.fromEntries(load("skills").map((r) => [r.id, r.icon]));
// 글자색: 테마 원작 조합 (어두운 바탕 = 밝은 글자, 종이 = #757474, 퀘스트 종이 = #6C7995/#8C99B4)
const C = { gold: "#E6DCC6", brown: "#757474", white: "#FFFFFF", dim: "#A8A090", dark: "#2D2D2D", qTitle: "#E6C88A", qBody: "#D8CFBC", value: "#D3CCCC", title: "#F6E3B0" };
const DARK = { r: 0.05, g: 0.045, b: 0.06, a: 0.94 };   // 테두리 그림 뒤에 까는 어두운 바탕
const WHITE = "#FFFFFF";
const outline = { outline: true, outline_color: "#2D2D2D" };

// ── 공통 부품 ──
function kit(b) {
  const k = {
    pc(name) { b.patchComponent(name, "MOD.Core.UITransformComponent", { ActivePlatform: 1 }); },
    mobile(name) { b.patchComponent(name, "MOD.Core.UITransformComponent", { ActivePlatform: 2 }); },
    // 아이콘은 칸 크기에 맞춰 늘린다 (PreserveSprite None). AspectOnly·NativeSize는 메이플 아이템 그림의 피벗 때문에 칸 밖으로 밀린다
    aspect(name) { b.patchComponent(name, "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 0 }); },
    // 창: 남색 바탕(9-slice) + 흰 제목 + 닫기(70)
    frame(name, anchor, pos, size, title) {
      b.panel(name, { anchor, pos, rect_size: size, color: DARK, sprite_type: 1, raycast: true });
      k.rim(name, "win_frame", -10);
      b.text(`${name}/Title`, title, { size: 30, bold: true, color: C.title, anchor: "top-center", pos: [0, -22], rect_size: [size[0] - 260, 44], ...outline });
      b.button(`${name}/BtnClose`, "", { anchor: "top-right", pos: [-12, -10], rect_size: [70, 70], ...bg("btn_close"), sprite_type: 1 });
    },
    // 테두리 그림을 부모 크기에 맞춰 덮는다 (inset 음수 = 바깥으로 조금 넘침)
    // stretch 앵커는 다시 불러올 때 크기 0으로 접히므로, 부모 크기를 읽어 가운데 고정 크기로 둔다
    rim(name, key, inset = 0) {
      const size = b.getComponent(name, "MOD.Core.UITransformComponent").RectSize;
      b.sprite(`${name}/Rim`, { anchor: "middle-center", pos: [0, 0], rect_size: [size.x - inset * 2, size.y - inset * 2], ...part(key), sprite_type: 1 });
      b.patchComponent(`${name}/Rim`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    },
    // 안쪽 칸: win_content(어두운, 밝은 글자) / win_paper·win_desc(밝은 종이, #757474 글자)
    inner(name, anchor, pos, size, key = "win_content") {
      b.panel(name, { anchor, pos, rect_size: size, ...part(key), sprite_type: 1 });
    },
    // 버튼 (흰 글자)
    btn(name, text, opts) { b.button(name, text, { font_size: 24, color: C.gold, ...bg("btn_frame"), sprite_type: 1, ...opts }); },
    ok(name, text, opts) { b.button(name, text, { font_size: 24, color: "#F4E2B0", ...bg("btn_frame"), bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, ...opts }); },
    // 아이콘 칸: 어두운 바탕 + Icon(꺼짐, 컨트롤러가 그림을 넣고 켠다) + Rim(청동 테두리, 등급은 테두리 색으로)
    slot(name, opts, iconSize = 60, key = "slot") {
      const base = key === "slot_eq" ? { r: 0.07, g: 0.07, b: 0.1, a: 0.9 } : DARK;
      b.button(name, "", { bg_color: base, sprite_type: 1, ...opts });
      b.sprite(`${name}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [iconSize, iconSize], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
      k.aspect(`${name}/Icon`);
      k.rim(name, "slot_frame");
    },
    // 테마 그림 한 장 (아이콘·장식)
    pic(name, key, opts) {
      b.sprite(name, { ...part(key), sprite_type: 0, ...opts });
      k.aspect(name);
    },
    // 오른쪽 위 빨간 점 (쓸 포인트가 있을 때)
    badge(name) {
      b.sprite(`${name}/Badge`, { anchor: "top-right", pos: [4, 4], rect_size: [26, 26], ...part("red_dot"), sprite_type: 0, enable: false });
    },
  };
  return k;
}

function buildGameHud() {
  const b = new UIBuilder("GameHUD", 5);
  b.patchComponent("/", "MOD.Core.UIGroupComponent", { GroupOrder: 5 });
  const k = kit(b);

  // ── 대상 정보 (상단 가운데) ──
  b.panel("Target", { anchor: "top-center", pos: [0, -20], rect_size: [460, 92], ...part("hud_box"), sprite_type: 1 });
  b.text("Target/Name", "", { size: 22, bold: true, anchor: "top-center", pos: [0, -6], rect_size: [440, 30], ...outline });
  b.panel("Target/Bar", { anchor: "top-center", pos: [0, -42], rect_size: [420, 24], ...part("gauge_frame"), sprite_type: 1 });
  b.sprite("Target/Bar/Fill", { anchor: "middle-left", pos: [8, 0], rect_size: [404, 12], image_ruid: K.gauge_fill, color: "#E03A2A", alpha: 1, sprite_type: 3, fill_method: 0 });
  b.text("Target/Curse", "", { size: 16, color: "#C88CFF", anchor: "top-center", pos: [0, -66], rect_size: [440, 22], ...outline });

  // ── 맵 이름 (D2처럼 들어올 때 상단 가운데 2초) ──
  b.sprite("Banner", { anchor: "top-center", pos: [0, -280], rect_size: [900, 150], ...part("banner"), sprite_type: 1 });
  b.text("Banner/Title", "", { size: 48, bold: true, color: C.title, anchor: "top-center", pos: [0, -22], rect_size: [620, 64], ...outline, outline_width: 0.25 });
  b.patchComponent("Banner/Title", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
  b.text("Banner/Sub", "", { size: 24, color: C.gold, anchor: "top-center", pos: [0, -86], rect_size: [620, 36], ...outline });

  // ── 미니맵 (오른쪽 위, PC 시스템 버튼 아래) ──
  b.panel("MiniMap", { anchor: "top-right", pos: [-24, -140], rect_size: [300, 280], color: DARK, sprite_type: 1, raycast: true });
  b.panel("MiniMap/Area", { anchor: "middle-center", pos: [0, -10], rect_size: [256, 200], ...part("win_content"), sprite_type: 1 });
  for (let i = 1; i <= 12; i++) {
    b.sprite(`MiniMap/Area/F${i}`, { anchor: "middle-center", pos: [0, 0], rect_size: [20, 20], image_ruid: K.dot, sprite_type: 0, color: WHITE, alpha: 1, enable: false });
  }
  for (let i = 1; i <= 3; i++) {
    b.sprite(`MiniMap/Area/P${i}`, { anchor: "middle-center", pos: [0, 0], rect_size: [16, 16], image_ruid: K.dot, sprite_type: 0, color: "#5AA0FF", alpha: 1, enable: false });
  }
  b.sprite("MiniMap/Area/Me", { anchor: "middle-center", pos: [0, 0], rect_size: [20, 20], image_ruid: K.dot, sprite_type: 0, color: "#50FF50", alpha: 1 });
  k.rim("MiniMap", "minimap_frame", -6);
  b.text("MiniMap/Name", "", { size: 19, bold: true, color: C.title, anchor: "top-center", pos: [0, -14], rect_size: [220, 28], ...outline });

  // ── 메뉴 버튼 (미니맵 왼쪽) ──
  b.button("BtnMenu", "", { anchor: "top-right", pos: [-344, -140], rect_size: [96, 96], ...bg("menu_btn"), sprite_type: 1 });
  b.text("BtnMenu/Label", "메뉴", { size: 22, color: C.white, anchor: "bottom-center", pos: [0, -28], rect_size: [120, 28], ...outline, outline_width: 0.2 });
  k.badge("BtnMenu");

  // ── 퀘스트 추적 (미니맵 아래) ──
  b.button("QuestTrack", "", { anchor: "top-right", pos: [-24, -432], rect_size: [420, 120], ...bg("btn_frame"), sprite_type: 1 });
  k.pic("QuestTrack/Icon", "quest_icon", { anchor: "middle-left", pos: [28, 0], rect_size: [52, 52] });
  b.text("QuestTrack/Title", "", { size: 22, bold: true, color: C.qTitle, alignment: 3, anchor: "top-left", pos: [88, -16], rect_size: [300, 32], ...outline });
  b.text("QuestTrack/Body", "", { size: 18, color: C.qBody, alignment: 0, anchor: "top-left", pos: [88, -50], rect_size: [300, 56] });

  // ── 파티 (왼쪽, 그림자 상태줄 아래) ──
  b.empty("Party", { anchor: "top-left", pos: [24, -272], rect_size: [400, 170] });
  b.text("Party/Text", "", { size: 18, color: "#CCEECC", alignment: 0, anchor: "top-left", pos: [0, 0], rect_size: [400, 170], ...outline });

  // ── NPC 머리 위 의뢰 표시 (화면 좌표로 따라다닌다) ──
  b.sprite("NpcMark", { anchor: "middle-center", pos: [0, 0], rect_size: [84, 84], image_ruid: K.q_avail, sprite_type: 0, color: WHITE, alpha: 1, enable: false });
  k.aspect("NpcMark");

  // ── 안내 (첫 진입·포인트) ──
  b.panel("Tip", { anchor: "top-center", pos: [0, -122], rect_size: [780, 50], ...part("hud_box"), sprite_type: 1, enable: false });
  b.text("Tip/Text", "", { size: 22, color: "#F4ED83", anchor: "middle-center", pos: [0, 0], rect_size: [740, 44], ...outline });

  // ── 경험치 (맨 아래, 공용) ──
  b.panel("XP", { anchor: "bottom-center", pos: [0, 4], rect_size: [960, 22], ...part("gauge_frame"), sprite_type: 1 });
  b.sprite("XP/Fill", { anchor: "middle-left", pos: [8, 0], rect_size: [944, 10], image_ruid: K.gauge_fill, color: "#58B024", alpha: 1, sprite_type: 3, fill_method: 0 });
  b.text("XP/Text", "Lv 1", { size: 15, anchor: "middle-center", pos: [0, 0], rect_size: [900, 20], ...outline });

  // ── 생명·마나: PC는 D2 오브(양쪽 아래), 모바일은 가운데 아래 작게. 오브 그림은 코덱스 제작 전까지 임시 ──
  for (const [name, side, fill, x, size, platform] of [
    ["LifeOrb", "bottom-left", "orb_life", 12, 180, "pc"], ["ManaOrb", "bottom-right", "orb_mana", -12, 180, "pc"],
    ["MLife", "bottom-center", "orb_life", -74, 124, "mobile"], ["MMana", "bottom-center", "orb_mana", 74, 124, "mobile"],
  ]) {
    const inner = Math.round(size * 240 / 256);
    b.empty(name, { anchor: side, pos: [x, 28], rect_size: [size, size] });
    b.sprite(`${name}/Bg`, { anchor: "middle-center", pos: [0, 0], rect_size: [inner, inner], ...part("orb_bg"), sprite_type: 0 });
    b.sprite(`${name}/Fill`, { anchor: "middle-center", pos: [0, 0], rect_size: [inner, inner], ...part(fill), sprite_type: 3, fill_method: 1 });
    b.patchComponent(`${name}/Fill`, "MOD.Core.SpriteGUIRendererComponent", { FillOrigin: 0, FillAmount: 1 });
    b.sprite(`${name}/Frame`, { anchor: "middle-center", pos: [0, 0], rect_size: [size, size], ...part("orb_frame"), sprite_type: 0 });
    b.text(`${name}/Text`, "0/0", { size: size > 150 ? 22 : 17, bold: true, anchor: "middle-center", pos: [0, 0], rect_size: [size, 40], ...outline });
    if (platform === "pc") k.pc(name); else k.mobile(name);
  }

  // ── PC 아래 바: 스킬 5칸(A S D F 우클릭) + 벨트 4칸(1~4) + 미니 패널 아이콘 ──
  b.empty("Bottom", { anchor: "bottom-center", pos: [0, 30], rect_size: [1060, 112] });
  k.pc("Bottom");
  b.empty("Bottom/Slots", { anchor: "middle-center", pos: [0, 0], rect_size: [1060, 112] });
  ["A", "S", "D", "F", "R"].forEach((key, i) => {
    const n = `Bottom/Slots/Slot${i + 1}`;
    k.slot(n, { anchor: "middle-left", pos: [76 + i * 96, 0], rect_size: [88, 88] }, 60, "slot_skill");
    b.text(`${n}/Key`, key === "R" ? "우클릭" : key, { size: 18, color: C.white, anchor: "bottom-right", pos: [-4, 2], rect_size: [70, 22], alignment: 8, ...outline });
  });
  ["1", "2", "3", "4"].forEach((key, i) => {
    const n = `Bottom/Slots/Belt${i + 1}`;
    k.slot(n, { anchor: "middle-left", pos: [608 + i * 96, 0], rect_size: [88, 88] }, 52);
    b.text(`${n}/Key`, key, { size: 18, color: C.white, anchor: "top-left", pos: [6, -2], rect_size: [24, 22], alignment: 0, ...outline });
    b.text(`${n}/Count`, "", { size: 18, bold: true, anchor: "bottom-right", pos: [-6, 2], rect_size: [60, 24], alignment: 8, ...outline });
  });
  b.empty("Bottom/Menu", { anchor: "top-center", pos: [0, 64], rect_size: [9 * 66, 60] });
  [["BtnInv", K.icon_bag, "I"], ["BtnChar", K.icon_stats, "U"], ["BtnSkill", K.icon_skill, "K"], ["BtnShadow", K.icon_shadow, "H"],
    ["BtnQuest", K.icon_quest, "Q"], ["BtnSocial", K.icon_party, "P"], ["BtnRank", K.icon_rank, "L"], ["BtnExtract", SKILL_ICON.extract_mastery, "E"], ["BtnPortal", K.icon_scroll, "T"]]
    .forEach(([n, ruid, key], i) => {
      const path = `Bottom/Menu/${n}`;
      b.button(path, "", { anchor: "middle-left", pos: [i * 66, 0], rect_size: [60, 60], ...bg("hud_box"), sprite_type: 1 });
      b.sprite(`${path}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [40, 40], image_ruid: ruid, sprite_type: 0, color: iconColor(ruid), alpha: 1 });
      k.aspect(`${path}/Icon`);
      b.text(`${path}/Key`, key, { size: 16, color: C.white, anchor: "bottom-right", pos: [-2, 0], rect_size: [20, 18], alignment: 8, ...outline });
      if (n === "BtnChar" || n === "BtnSkill") k.badge(path);
    });

  // ── 메뉴 창 (모바일·PC 공용): 모든 창을 한곳에서 ──
  k.frame("MenuWin", "middle-center", [0, 20], [800, 640], "메뉴");
  [["Inv", K.icon_bag, "소지품"], ["Char", K.icon_stats, "능력치"], ["Skill", K.icon_skill, "스킬"],
    ["Shadow", K.icon_shadow, "그림자"], ["Quest", K.icon_quest, "퀘스트"], ["Social", K.icon_party, "플레이어"],
    ["Rank", K.icon_rank, "랭킹"], ["Portal", K.icon_portal, "귀환"], ["Input", K.icon_gear, "조작 전환"]].forEach(([n, ruid, label], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const path = `MenuWin/${n}`;
    k.btn(path, "", { anchor: "top-left", pos: [64 + col * 230, -96 - row * 160], rect_size: [212, 148] });
    b.sprite(`${path}/Icon`, { anchor: "top-center", pos: [0, -16], rect_size: [64, 64], image_ruid: ruid, sprite_type: 0, color: iconColor(ruid), alpha: 1 });
    k.aspect(`${path}/Icon`);
    b.text(`${path}/Label`, label, { size: 26, color: C.white, anchor: "bottom-center", pos: [0, 14], rect_size: [200, 34] });
    if (n === "Char" || n === "Skill") k.badge(path);
  });
  b.text("MenuWin/Help", "단축키  I 소지품 · U 능력치 · K 스킬 · H 그림자 · Q 퀘스트 · P 플레이어 · L 랭킹 · T 귀환\nA S D F·우클릭 스킬 · 1 2 3 물약 · Z 소환 · X 회수 · C 집결 · E 추출 · 칸 클릭 = 스킬 바꾸기",
    { size: 17, color: C.dim, anchor: "bottom-center", pos: [0, 20], rect_size: [740, 56] });
  k.pc("MenuWin/Help");

  // ── 스킬 지정 (퀵슬롯 칸을 누르거나 메뉴·모바일 편집 버튼으로) ──
  k.frame("SkillPick", "middle-center", [0, 20], [900, 720], "스킬 지정");
  ["A", "S", "D", "F", "우클릭"].forEach((t, i) => k.btn(`SkillPick/Tab${i + 1}`, t, { anchor: "top-left", pos: [40 + i * 166, -86], rect_size: [152, 64], font_size: 22 }));
  k.inner("SkillPick/Grid", "top-center", [0, -166], [820, 424]);
  for (let i = 0; i < 18; i++) {
    const col = i % 6, row = Math.floor(i / 6);
    const n = `SkillPick/Grid/Pick${i + 1}`;
    k.slot(n, { anchor: "top-left", pos: [20 + col * 132, -16 - row * 136], rect_size: [120, 128] }, 60, "slot_skill");
    b.patch(`${n}/Icon`, { pos: [0, 14] });
    b.text(`${n}/Name`, "", { size: 16, bold: true, anchor: "bottom-center", pos: [0, 6], rect_size: [116, 26], ...outline });
  }
  b.text("SkillPick/Desc", "", { size: 20, color: C.white, alignment: 6, anchor: "bottom-left", pos: [40, 24], rect_size: [600, 90] });
  k.btn("SkillPick/BtnClear", "칸 비우기", { anchor: "bottom-right", pos: [-40, 30], rect_size: [190, 70] });

  // ── 능력치 창 ──
  k.frame("CharWin", "middle-left", [30, 40], [480, 640], "능력치");
  k.inner("CharWin/Paper", "top-center", [0, -84], [430, 250], "win_content");
  b.text("CharWin/Paper/Info", "", { size: 18, color: C.gold, alignment: 0, anchor: "top-left", pos: [18, -14], rect_size: [394, 222] });
  ["Str", "Dex", "Vit", "Ene"].forEach((s, i) => {
    b.empty(`CharWin/${s}`, { anchor: "top-left", pos: [26, -350 - i * 64], rect_size: [428, 58] });
    b.text(`CharWin/${s}/Text`, s, { size: 24, color: C.white, alignment: 3, anchor: "middle-left", pos: [4, 0], rect_size: [340, 52] });
    k.ok(`CharWin/${s}/BtnAdd`, "+", { anchor: "middle-right", pos: [0, 0], rect_size: [64, 56], font_size: 30 });
  });
  b.text("CharWin/Points", "", { size: 22, color: "#F4ED83", anchor: "bottom-center", pos: [0, 22], rect_size: [420, 30], ...outline });

  // ── 소지품 창: 장비(종이 인형) + 설명 + 가방 6×5 ──
  k.frame("InvWin", "middle-right", [-30, -60], [900, 860], "소지품");
  k.inner("InvWin/Doll", "top-left", [28, -84], [420, 400], "win_content");
  // 종이 인형: 투구·목걸이 / 무기·갑옷·보조 / 장갑·허리띠·신발 / 반지 둘 (가운데 210 기준 대칭)
  const doll = { helm: [168, -16], amulet: [276, -16], weapon: [60, -112], armor: [168, -112], offhand: [276, -112], gloves: [60, -208], belt: [168, -208], boots: [276, -208], ring1: [114, -304], ring2: [222, -304] };
  for (const [s, p] of Object.entries(doll)) {
    k.slot(`InvWin/Doll/Eq_${s}`, { anchor: "top-left", pos: p, rect_size: [84, 84] }, 60, "slot_eq");
    k.pic(`InvWin/Doll/Eq_${s}/Ghost`, "eq_" + s.replace(/[0-9]/g, ""), { anchor: "middle-center", pos: [0, 0], rect_size: [52, 52] });
  }
  k.inner("InvWin/DescBox", "top-right", [-28, -84], [404, 400], "win_content");
  b.text("InvWin/DescBox/Desc", "", { size: 17, color: C.gold, alignment: 0, anchor: "top-left", pos: [16, -14], rect_size: [372, 372] });
  b.text("InvWin/Gold", "", { size: 22, color: "#F4ED83", alignment: 3, anchor: "top-left", pos: [32, -490], rect_size: [560, 30], ...outline });
  k.inner("InvWin/Bag", "top-left", [28, -526], [560, 314]);
  for (let i = 0; i < 30; i++) {
    const col = i % 6, row = Math.floor(i / 6);
    k.slot(`InvWin/Bag/Bag${i + 1}`, { anchor: "top-left", pos: [12 + col * 90, -12 - row * 58], rect_size: [86, 56] }, 42);
  }
  k.ok("InvWin/BtnEquip", "장착", { anchor: "bottom-right", pos: [-28, 120], rect_size: [260, 76] });
  k.btn("InvWin/BtnSell", "판매", { anchor: "bottom-right", pos: [-28, 30], rect_size: [260, 76] });
  b.text("InvWin/Hint", "룬: 고른 뒤 장비 칸 = 소켓\n장비 칸 누르기 = 해제", { size: 16, color: C.dim, alignment: 8, anchor: "bottom-right", pos: [-28, 210], rect_size: [260, 60] });

  // ── 스킬 창: 3트리 × 12칸 (아이콘 + 이름·레벨) ──
  k.frame("SkillWin", "middle-center", [0, 30], [1020, 860], "스킬");
  b.text("SkillWin/Points", "", { size: 22, color: "#F4ED83", anchor: "top-left", pos: [40, -76], rect_size: [500, 30], alignment: 3, ...outline });
  [0, 1, 2].forEach((t) => {
    k.inner(`SkillWin/Col${t + 1}`, "top-left", [30 + t * 324, -112], [312, 560]);
    b.text(`SkillWin/Col${t + 1}/Head`, "", { size: 24, bold: true, color: C.white, anchor: "top-center", pos: [0, -8], rect_size: [296, 32], ...outline });
    for (let r = 0; r < 12; r++) {
      const n = `SkillWin/Col${t + 1}/T${r + 1}`;
      b.button(n, "", { anchor: "top-left", pos: [8, -44 - r * 42], rect_size: [296, 40], bg_color: { r: 0, g: 0, b: 0, a: 0.25 } });
      b.sprite(`${n}/Icon`, { anchor: "middle-left", pos: [4, 0], rect_size: [34, 34], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
      k.aspect(`${n}/Icon`);
      b.text(`${n}/Label`, "", { size: 17, color: C.white, alignment: 3, anchor: "middle-left", pos: [44, 0], rect_size: [248, 36] });
    }
  });
  k.inner("SkillWin/DescBox", "bottom-left", [30, 104], [960, 72], "win_content");
  b.text("SkillWin/DescBox/Desc", "", { size: 17, color: C.gold, alignment: 3, anchor: "middle-left", pos: [14, 0], rect_size: [932, 66] });
  [["BtnLearn", "습득 +1"], ["BtnA", "A"], ["BtnS", "S"], ["BtnD", "D"], ["BtnF", "F"], ["BtnR", "우클릭"]].forEach(([n, t], i) => {
    const opts = { anchor: "bottom-left", pos: [30 + i * 162, 24], rect_size: [150, 66] };
    if (i === 0) k.ok(`SkillWin/${n}`, t, opts); else k.btn(`SkillWin/${n}`, t, opts);
  });

  // ── NPC 대화 (가까이 가면 화면 아래에 열림, D2처럼 말을 건 뒤 의뢰를 받는다) ──
  k.frame("NpcWin", "bottom-center", [0, 170], [1100, 320], "");
  b.patch("NpcWin/Title", { anchor: "top-left", pos: [70, -22], rect_size: [600, 44], pivot: [0, 1] });
  b.patchComponent("NpcWin/Title", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 1 });
  k.inner("NpcWin/Paper", "top-center", [0, -72], [1000, 150], "win_content");
  b.text("NpcWin/Paper/Body", "", { size: 22, color: C.gold, alignment: 0, anchor: "top-left", pos: [20, -14], rect_size: [960, 124] });
  [0, 1, 2, 3, 4].forEach((i) => k.btn(`NpcWin/Btn${i + 1}`, `Btn${i + 1}`, { anchor: "bottom-right", pos: [-50 - (4 - i) * 196, 24], rect_size: [184, 72], font_size: 20 }));

  // ── 포털 이름 (D2처럼 출구 위에 갈 곳 이름, HudMap이 화면 좌표로 옮긴다) ──
  for (let i = 1; i <= 4; i++) {
    b.text(`Gate${i}`, "", { size: 22, bold: true, color: "#9ED0FF", anchor: "middle-center", pos: [0, 0], rect_size: [420, 34], ...outline, enable: false });
  }

  // 출구 가까이 가면 화면 가운데 아래 안내 (어디로 가는지 + 들어서면 이동)
  b.panel("GatePrompt", { anchor: "bottom-center", pos: [0, 330], rect_size: [760, 60], ...part("hud_box"), sprite_type: 1, enable: false });
  b.text("GatePrompt/Text", "", { size: 24, bold: true, color: "#9ED0FF", anchor: "middle-center", pos: [0, 0], rect_size: [740, 56], ...outline });

  // ── 소환수 배지 (해골·마법사·되살림·그림자 + 수, 있을 때만) — PC는 생명 오브 위, 모바일은 조이스틱 위 ──
  const minions = [["Skel", SKILL_ICON.raise_skeleton], ["Mage", SKILL_ICON.raise_mage], ["Revive", SKILL_ICON.revive], ["Shadow", SKILL_ICON.shadow_summon]];
  for (const [root, y, platform] of [["Minions", 236, "pc"], ["MMinions", 430, "mobile"]]) {
    b.empty(root, { anchor: "bottom-left", pos: [20, y], rect_size: [4 * 76, 72] });
    minions.forEach(([n, ruid], i) => {
      const path = `${root}/${n}`;
      b.sprite(path, { anchor: "middle-left", pos: [i * 76, 0], rect_size: [68, 68], image_ruid: ruid, sprite_type: 0, color: WHITE, alpha: 1, enable: false });
      k.rim(path, "slot_frame", -2);
      b.text(`${path}/Count`, "", { size: 22, bold: true, anchor: "bottom-right", pos: [-2, 0], rect_size: [60, 28], alignment: 8, ...outline });
    });
    if (platform === "pc") k.pc(root); else k.mobile(root);
  }

  // ── 퀘스트 창 (Q) ──
  k.frame("QuestWin", "middle-center", [0, 60], [800, 620], "퀘스트 — 잿빛 변경");
  for (let i = 1; i <= 6; i++) {
    const n = `QuestWin/Q${i}`;
    k.btn(n, "", { anchor: "top-left", pos: [40, -88 - (i - 1) * 60], rect_size: [720, 54], font_size: 19 });
    k.pic(`${n}/Icon`, "quest_icon", { anchor: "middle-left", pos: [10, 0], rect_size: [36, 36] });
  }
  k.inner("QuestWin/DescBox", "bottom-center", [0, 24], [720, 120], "win_content");
  b.text("QuestWin/DescBox/Desc", "", { size: 18, color: C.gold, alignment: 0, anchor: "top-left", pos: [14, -10], rect_size: [692, 100] });

  // ── 플레이어 창 (P): 파티 초대 / 결투 / 거래, 파티 탈퇴 ──
  k.frame("SocialWin", "middle-center", [0, 60], [800, 660], "플레이어");
  for (let i = 1; i <= 8; i++) {
    const y = -88 - (i - 1) * 62;
    b.text(`SocialWin/Name${i}`, "", { size: 19, color: C.gold, alignment: 3, anchor: "top-left", pos: [40, y], rect_size: [300, 54], ...outline });
    k.btn(`SocialWin/Party${i}`, "파티", { anchor: "top-left", pos: [350, y], rect_size: [124, 54], font_size: 18 });
    k.btn(`SocialWin/Duel${i}`, "결투", { anchor: "top-left", pos: [482, y], rect_size: [124, 54], font_size: 18 });
    k.btn(`SocialWin/Trade${i}`, "거래", { anchor: "top-left", pos: [614, y], rect_size: [124, 54], font_size: 18 });
  }
  k.btn("SocialWin/BtnLeave", "파티 탈퇴", { anchor: "bottom-left", pos: [40, 22], rect_size: [200, 62], font_size: 19 });

  // ── 받은 요청 (수락/거절) ──
  b.panel("Request", { anchor: "top-center", pos: [0, -250], rect_size: [600, 170], ...part("win_panel"), sprite_type: 1, raycast: true });
  b.text("Request/Text", "", { size: 21, color: C.gold, anchor: "top-center", pos: [0, -20], rect_size: [540, 60], ...outline });
  k.ok("Request/BtnYes", "수락", { anchor: "bottom-center", pos: [-100, 20], rect_size: [180, 62] });
  k.btn("Request/BtnNo", "거절", { anchor: "bottom-center", pos: [100, 20], rect_size: [180, 62] });

  // ── 거래 창 ──
  k.frame("TradeWin", "middle-left", [30, 10], [660, 700], "거래");
  b.text("TradeWin/MyTitle", "내 제안", { size: 20, color: C.white, anchor: "top-left", pos: [34, -78], rect_size: [280, 30], ...outline });
  b.text("TradeWin/TheirTitle", "상대 제안", { size: 20, color: C.gold, anchor: "top-left", pos: [340, -78], rect_size: [200, 30], ...outline });
  for (let i = 1; i <= 8; i++) {
    k.btn(`TradeWin/My${i}`, "", { anchor: "top-left", pos: [30, -112 - (i - 1) * 52], rect_size: [292, 48], font_size: 15 });
    b.text(`TradeWin/Their${i}`, "", { size: 15, color: C.white, anchor: "top-left", pos: [340, -112 - (i - 1) * 52], rect_size: [292, 48], ...outline });
  }
  b.text("TradeWin/Gold", "", { size: 18, color: "#F4ED83", alignment: 6, anchor: "bottom-left", pos: [34, 96], rect_size: [592, 50], ...outline });
  [["BtnGoldMinus", "-100골드", 30], ["BtnGoldPlus", "+100골드", 182], ["BtnConfirm", "확인", 334], ["BtnCancel", "취소", 486]].forEach(([n, t, x]) => {
    const opts = { anchor: "bottom-left", pos: [x, 24], rect_size: [144, 62], font_size: 18 };
    if (n === "BtnConfirm") k.ok(`TradeWin/${n}`, t, opts); else k.btn(`TradeWin/${n}`, t, opts);
  });

  // ── 웨이포인트 창 ──
  k.frame("WpWin", "middle-center", [0, 60], [600, 640], "웨이포인트");
  for (let i = 1; i <= 6; i++) {
    const n = `WpWin/Wp${i}`;
    k.btn(n, "", { anchor: "top-left", pos: [40, -88 - (i - 1) * 62], rect_size: [520, 56], font_size: 20 });
    k.pic(`${n}/Icon`, "icon_waypoint", { anchor: "middle-left", pos: [10, 0], rect_size: [38, 38] });
  }
  b.text("WpWin/DiffTitle", "난이도", { size: 19, color: C.gold, anchor: "bottom-center", pos: [0, 100], rect_size: [500, 28], ...outline });
  [["Diff0", "보통", -180], ["Diff1", "악몽", 0], ["Diff2", "지옥", 180]].forEach(([n, t, x]) => {
    k.btn(`WpWin/${n}`, t, { anchor: "bottom-center", pos: [x, 26], rect_size: [170, 64], font_size: 20 });
  });

  // ── 랭킹 창 ──
  k.frame("RankWin", "middle-center", [0, 60], [640, 660], "랭킹");
  [["TabDepth", "심도 최고 층", -150], ["TabQueen", "묘지기 여왕 처치 시간", 150]].forEach(([n, t, x]) => {
    k.btn(`RankWin/${n}`, t, { anchor: "top-center", pos: [x, -86], rect_size: [280, 56], font_size: 18 });
  });
  k.inner("RankWin/Paper", "top-center", [0, -156], [580, 470], "win_content");
  b.text("RankWin/Paper/List", "", { size: 19, color: C.gold, alignment: 0, anchor: "top-left", pos: [20, -16], rect_size: [540, 440] });

  const file = P.ui("GameHUD");
  const previous = readIfExists(file);
  b.write(file);
  preserveIds(file, previous);
  return b.listEntities().length;
}

// ShadowHUD: 상태줄·보관함은 그대로 두고 그림만 바꾸며, 모바일 패드는 새로 짠다
function patchShadowHud() {
  const file = P.ui("ShadowHUD");
  const s = UIBuilder.read(file);
  const k = kit(s);
  // 테마 부품으로 바꿔 입힌다 (그림 + 정해진 색)
  const skin = (path, key) => {
    const q = part(key);
    s.patchComponent(path, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: q.image_ruid }, Type: 1, Color: hexA(q.color, q.alpha) });
  };
  const textColor = (path, hex) => s.patchComponent(path, "MOD.Core.TextGUIRendererComponent", { FontColor: hexA(hex, 1) });

  // 안내 한 줄은 메뉴 창(단축키)으로 옮겼다
  s.patch("Hint", { enable: false });
  // 상태줄: PC 시스템 버튼(왼쪽 위 260×170)을 피해 오른쪽으로
  // 상태줄은 숨긴다: 소환 수는 GameHUD 소환수 배지, 보관함·조작 전환은 메뉴 창에
  s.patch("Status", { anchor: "top-left", pos: [20, -190], rect_size: [760, 72], enable: false });
  s.patch("Status/Text", { rect_size: [400, 64] });
  skin("Status", "hud_box");
  s.patchComponent("Status/BtnStorage", "MOD.Core.TextGUIRendererComponent", { Text: "보관함 (H)" });
  skin("Status/BtnStorage", "btn_frame");
  skin("Status/BtnInput", "btn_frame");
  // 보관함 창: 어두운 바탕 + 코덱스 창 테두리 + 줄마다 원본 몬스터 초상
  s.patchComponent("Window", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: "2860136c06ab075439721c027de365af" }, Type: 1, Color: DARK });
  k.rim("Window", "win_frame", -10);
  textColor("Window/Title", C.white);
  for (let i = 1; i <= 8; i++) {
    const row = `Window/Row${i}`;
    skin(row, "win_content");
    if (!s.find(`${row}/Portrait`)) s.sprite(`${row}/Portrait`, { anchor: "middle-left", pos: [6, 0], rect_size: [48, 48], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    k.aspect(`${row}/Portrait`);
    s.patch(`${row}/Label`, { pos: [60, 0], rect_size: [350, 44] });
    for (const btn of ["BtnDeploy", "BtnUpgrade", "BtnSalvage"]) skin(`${row}/${btn}`, "btn_frame");
  }
  for (const btn of ["BtnPrev", "BtnNext"]) skin(`Window/${btn}`, "btn_frame");
  skin("Window/BtnClose", "btn_close");
  s.patchComponent("Window/BtnClose", "MOD.Core.TextGUIRendererComponent", { Text: "" });

  // 모바일 패드: 조이스틱(왼쪽) + 오른쪽 공격 + 둘레 스킬 4칸 + 물약 2 + 그림자 명령(펼침) + 스킬 편집
  for (const old of ["BtnAttack", "BtnRally", "BtnRecall", "BtnSummon", "BtnStorage", "Attack", "Skills", "Potions", "Shadow", "BtnSkillEdit"]) {
    if (s.find(`MobilePad/${old}`)) s.remove(`MobilePad/${old}`);
  }
  const center = { anchor: "bottom-right", pivot: [0.5, 0.5] };
  // 오른쪽 아래 모서리 기준 중심 좌표 (엄지 반경 안, 서로 겹치지 않게)
  s.button("MobilePad/Attack", "", { ...center, pos: [-180, 190], rect_size: [220, 220], ...bg("orb_bg"), sprite_type: 0 });
  s.sprite("MobilePad/Attack/Ring", { anchor: "middle-center", pos: [0, 0], rect_size: [234, 234], ...part("orb_frame"), sprite_type: 0 });
  k.pic("MobilePad/Attack/Icon", "icon_sword", { anchor: "middle-center", pos: [0, 14], rect_size: [100, 100] });
  b_label(s, "MobilePad/Attack/Label", "공격", 28, "bottom-center");
  s.patch("MobilePad/Attack/Label", { pos: [0, 22] });
  const arc = [[-420, 120], [-390, 290], [-260, 410], [-100, 430]];
  s.empty("MobilePad/Skills", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  arc.forEach((p, i) => {
    const n = `MobilePad/Skills/S${i + 1}`;
    k.slot(n, { ...center, pos: p, rect_size: [124, 124] }, 80, "slot_skill");
    b_label(s, `${n}/Key`, ["A", "S", "D", "F"][i], 18, "bottom-right");
  });
  k.btn("MobilePad/BtnSkillEdit", "스킬 편집", { ...center, pos: [-580, 560], rect_size: [150, 64], font_size: 20 });
  s.empty("MobilePad/Potions", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  [["Hp", K.potion_hp, -580], ["Mp", K.potion_mp, -700]].forEach(([n, ruid, x]) => {
    const path = `MobilePad/Potions/${n}`;
    k.slot(path, { ...center, pos: [x, 70], rect_size: [104, 104] }, 56);
    s.patchComponent(`${path}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: ruid } });
    s.patch(`${path}/Icon`, { enable: true });
    b_label(s, `${path}/Count`, "", 20, "bottom-right");
  });
  // 그림자 명령: 버튼 하나를 누르면 소환·회수·집결이 위로 펼쳐진다 (배운 것만 보임)
  s.empty("MobilePad/Shadow", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  k.slot("MobilePad/Shadow/Toggle", { ...center, pos: [-580, 200], rect_size: [104, 104] }, 64);
  s.patchComponent("MobilePad/Shadow/Toggle/Icon", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: K.icon_shadow }, Color: hexA(part("icon_shadow").color, 1) });
  s.patch("MobilePad/Shadow/Toggle/Icon", { enable: true });
  s.empty("MobilePad/Shadow/Cmds", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  [["Summon", "소환", SKILL_ICON.shadow_summon], ["Recall", "회수", K.icon_scroll], ["Rally", "집결", SKILL_ICON.rally]].forEach(([n, label, ruid], i) => {
    const path = `MobilePad/Shadow/Cmds/${n}`;
    const p = [[-580, 320], [-580, 436], [-700, 320]][i];
    k.slot(path, { ...center, pos: p, rect_size: [100, 100] }, 56);
    s.patchComponent(`${path}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: ruid } });
    s.patch(`${path}/Icon`, { enable: true });
    b_label(s, `${path}/Label`, label, 18, "bottom-center");
  });
  for (const n of ["MobilePad/Attack", "MobilePad/Skills", "MobilePad/BtnSkillEdit", "MobilePad/Potions", "MobilePad/Shadow"]) k.mobile(n);
  s.write(file);
}

// 칸·버튼 위 글자 (외곽선)
function b_label(s, path, text, size, where) {
  const at = {
    center: { anchor: "middle-center", pos: [0, 0], alignment: 4 },
    "bottom-right": { anchor: "bottom-right", pos: [-6, 4], alignment: 8 },
    "bottom-center": { anchor: "bottom-center", pos: [0, -26], alignment: 4 },
  }[where];
  s.text(path, text, { size, bold: true, anchor: at.anchor, pos: at.pos, rect_size: [120, 30], alignment: at.alignment, ...outline });
}

function run() {
  let n = 0;
  quiet(() => {
    n = buildGameHud();
    patchShadowHud();
  });
  console.log(`  UI: GameHUD ${n}개 엔티티 · ShadowHUD 스킨·모바일 패드`);
}

module.exports = { run };
