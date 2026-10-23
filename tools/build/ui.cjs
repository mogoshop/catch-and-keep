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
      k.rim(name, "win_frame", -20);   // 테두리를 창 바깥으로 10px 더 — 안쪽 내용과 테두리 사이 여백
      // 제목은 테두리 그림의 제목 띠 한가운데 (창 위에서 37px) — 띠 아래 선에 글자가 걸치지 않게
      b.text(`${name}/Title`, title, { size: 26, bold: true, color: C.title, anchor: "top-center", pos: [0, -17], rect_size: [size[0] - 260, 40], alignment: 4, ...outline });
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
    btn(name, text, opts) {
      const o = { font_size: 24, color: C.gold, ...bg("btn_frame"), sprite_type: 1, ...opts };
      b.button(name, text, o);
      b.patchComponent(name, "MOD.Core.TextGUIRendererComponent", require("./ui-tokens.cjs").buttonText(o.font_size));
    },
    ok(name, text, opts) { b.button(name, text, { font_size: 24, color: "#F4E2B0", ...bg("btn_frame"), bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, sprite_type: 1, ...opts }); },
    // 아이콘 칸: 어두운 바탕 + Icon(꺼짐, 컨트롤러가 그림을 넣고 켠다) + Rim(청동 테두리, 등급은 테두리 색으로)
    slot(name, opts, iconSize = 60, key = "slot") {
      const base = key === "slot_eq" ? { r: 0.07, g: 0.07, b: 0.1, a: 0.9 } : DARK;
      b.button(name, "", { bg_color: base, sprite_type: 1, ...opts });
      b.sprite(`${name}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [iconSize, iconSize], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
      k.aspect(`${name}/Icon`);
      k.rim(name, "slot_frame");
    },
    // 쿨다운 덮개: 어두운 원형 채움(시계 방향, 위에서 시작) + 남은 초. 꺼진 채로 두고 컨트롤러(UIKit.ShowCooldown)가 켠다
    cooldown(name, size, round = false) {
      const extra = round ? { image_ruid: K.circle } : {};
      b.sprite(`${name}/Cd`, { anchor: "middle-center", pos: [0, 0], rect_size: [size, size], color: { r: 0, g: 0, b: 0, a: 0.72 }, sprite_type: 3, fill_method: 4, enable: false, ...extra });
      b.patchComponent(`${name}/Cd`, "MOD.Core.SpriteGUIRendererComponent", { FillOrigin: 2, FillAmount: 1, RaycastTarget: false });
      b.text(`${name}/Cd/Text`, "", { size: Math.round(size * 0.34), bold: true, color: "#F6E3B0", anchor: "middle-center", pos: [0, 0], rect_size: [size, size], ...outline });
    },
    // 테마 그림 한 장 (아이콘·장식)
    pic(name, key, opts) {
      b.sprite(name, { ...part(key), sprite_type: 0, ...opts });
      k.aspect(name);
    },
    // 스크롤 글 상자: 스크롤 칸(name) 안에 크기를 직접 정하는 묶음(Body) + 글(Body/Text). 글 높이는 UIKit.SetScrollText가 글 길이로 정한다.
    //   스크롤 칸이 글을 직접 세우면 줄바꿈 전 한 줄 너비로 재서 가로 스크롤바가 생기고 끝까지 안 내려갔다 (10-13 그림자 상세에서 측정)
    //   10-13 사용자 지적: 룬워드 조합법 글이 창 밖으로 넘쳤다 (글자 자동 축소 최소 13으로도 1,971 > 544)
    scrollText(name, anchor, pos, size, textOpts) {
      // 글 폭 = 칸 − 오른쪽 여백 18 − 세로 스크롤바 10 − 여유 12 (스크롤바만큼 보이는 폭이 줄어, 26만 빼면 가로 스크롤바가 생겼다)
      const w = size[0] - 40;
      b.scrollLayout(name, { anchor, pivot: [0, 1], pos, rect_size: size, layout_type: 1, use_scroll: true, padding: [0, 18, 0, 8], scroll_bar_visible: 1, scroll_bar_thickness: 10, scroll_bar_bg_color: { r: 0.14, g: 0.12, b: 0.17, a: 0.6 }, scroll_bar_handle_color: { r: 0.6, g: 0.49, b: 0.3, a: 1 } });
      b.empty(`${name}/Body`, { anchor: "top-left", pivot: [0, 1], pos: [0, 0], rect_size: [w, size[1]] });
      b.text(`${name}/Body/Text`, "", { alignment: 0, anchor: "top-left", pivot: [0, 1], pos: [0, 0], rect_size: [w, size[1]], overflow: 0, ...textOpts });
    },
    // 액트 넘김 막대 (10-20 사용자 선택): ◀ 「액트 2 · 모래 폐허」 ▶ + 아래 점(몇 번째 액트). 액트가 6개까지 늘어도 모양이 그대로
    //   예전 「액트1|액트2|액트3」 단추 줄은 좁아 보였고 액트가 늘면 들어가지 않았다. 내용은 UIKit.SetActPager가 채운다
    actPager(name, anchor, pos, w) {
      b.panel(name, { anchor, pos, rect_size: [w, 76], ...part("win_content"), sprite_type: 1 });
      b.button(`${name}/Prev`, "◀", { anchor: "middle-left", pos: [38, 0], rect_size: [64, 64], font_size: 24, color: C.title, ...bg("btn_frame"), sprite_type: 1 });
      b.button(`${name}/Next`, "▶", { anchor: "middle-right", pos: [-38, 0], rect_size: [64, 64], font_size: 24, color: C.title, ...bg("btn_frame"), sprite_type: 1 });
      b.text(`${name}/Title`, "", { size: 23, bold: true, color: C.title, anchor: "middle-center", pos: [0, 9], rect_size: [w - 170, 34], alignment: 4, bestfit: true, min_size: 16, max_size: 23, ...outline });
      for (let i = 1; i <= 6; i++) {
        b.sprite(`${name}/D${i}`, { anchor: "middle-center", pos: [(i - 3.5) * 22, -20], rect_size: [12, 12], image_ruid: K.dot, sprite_type: 0, color: WHITE, alpha: 1 });
        b.patchComponent(`${name}/D${i}`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
      }
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
  // 신전 축복 (MapShrine): 대상 이름표 아래, 축복이 있을 때만 「분노의 신전 · 주는 피해 +25% · 42초」 (HudMain)
  b.text("ShrineBuff", "", { size: 22, bold: true, color: "#FFD27A", anchor: "top-center", pos: [0, -126], rect_size: [640, 34], ...outline, enable: false });

  // ── 맵 이름 (D2처럼 들어올 때 상단 가운데 2초) ──
  // 띠 그림의 어두운 가운데 안에 제목·부제가 모두 들어가게 (예전 48px 제목은 띠 위로, 부제는 아래 테두리로 넘쳤다)
  b.sprite("Banner", { anchor: "top-center", pos: [0, -270], rect_size: [1000, 180], ...part("banner"), sprite_type: 1 });
  // 판 안쪽 위아래 여백을 같게: 제목(36)과 부제(21)를 한 덩어리로 가운데에
  b.text("Banner/Title", "", { size: 36, bold: true, color: C.title, anchor: "middle-center", pos: [0, 12], rect_size: [700, 48], alignment: 4, ...outline, outline_width: 0.25, bestfit: true, min_size: 28, max_size: 36 });
  b.patchComponent("Banner/Title", "MOD.Core.TextGUIRendererComponent", { Font: "Maple" });
  b.text("Banner/Sub", "", { size: 21, color: C.gold, anchor: "middle-center", pos: [0, -24], rect_size: [700, 28], alignment: 4, ...outline });

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
  // 메뉴 버튼은 미니맵 열(오른쪽 24~368px) 왼쪽으로 40px 띄우고, 위쪽을 지역 이름 상자 위쪽(150)에 맞춘다
  b.button("BtnMenu", "", { anchor: "top-right", pos: [-456, -150], rect_size: [96, 96], ...bg("menu_btn"), sprite_type: 1 });
  b.text("BtnMenu/Label", "메뉴", { size: 22, color: C.white, anchor: "bottom-center", pos: [0, -28], rect_size: [120, 28], ...outline, outline_width: 0.2 });
  k.badge("BtnMenu");

  // ── 퀘스트 추적 (미니맵 아래) ──
  b.button("QuestTrack", "", { anchor: "top-right", pos: [-24, -432], rect_size: [420, 120], ...bg("btn_frame"), sprite_type: 1 });
  k.pic("QuestTrack/Icon", "quest_icon", { anchor: "middle-left", pos: [28, 0], rect_size: [52, 52] });
  b.text("QuestTrack/Title", "", { size: 22, bold: true, color: C.qTitle, alignment: 3, anchor: "top-left", pos: [88, -16], rect_size: [300, 32], ...outline });
  b.text("QuestTrack/Body", "", { size: 18, color: C.qBody, alignment: 0, anchor: "top-left", pos: [88, -50], rect_size: [300, 56] });

  // ── 파티 (왼쪽, 그림자 상태줄 아래) ──
  // 파티원마다 이름·레벨 줄 + 위치 작은 줄 (최대 8명 → 높이 360)
  b.empty("Party", { anchor: "top-left", pos: [24, -272], rect_size: [400, 360] });
  b.text("Party/Text", "", { size: 18, color: "#CCEECC", alignment: 0, anchor: "top-left", pos: [0, 0], rect_size: [400, 360], ...outline });

  // ── NPC 머리 위 의뢰 표시 「!」 (새 의뢰 노랑 · 완료 보고 초록, 화면 좌표로 따라다닌다) ──
  b.text("NpcMark", "!", { size: 96, bold: true, color: "#FFD23F", anchor: "middle-center", pos: [0, 0], rect_size: [90, 120], outline: true, outline_color: "#2A1A05", outline_width: 0.3, enable: false });
  // ── 액트 보스를 쓰러뜨린 뒤 마을 사람 머리 위 「!」 (격려 한마디, docs/design/31 §7 · HudMap.RenderCheerMarks) ──
  for (let i = 1; i <= 8; i++) b.text(`CheerMark${i}`, "!", { size: 84, bold: true, color: "#FFB04A", anchor: "middle-center", pos: [0, 0], rect_size: [80, 110], outline: true, outline_color: "#2A1405", outline_width: 0.3, enable: false });
  // ── 액트 보스 처치 섬광 (ActClearFx) — 화면 전체 흰 판, 누르기를 막지 않는다 ──
  b.panel("BossFlash", { anchor: "middle-center", pos: [0, 0], rect_size: [4000, 3000], color: { r: 1, g: 0.97, b: 0.9, a: 0.85 }, raycast: false, enable: false });

  // ── 안내 (첫 진입·포인트) ──
  b.panel("Tip", { anchor: "top-center", pos: [0, -122], rect_size: [780, 50], ...part("hud_box"), sprite_type: 1, enable: false });
  b.text("Tip/Text", "", { size: 22, color: "#F4ED83", anchor: "middle-center", pos: [0, 0], rect_size: [740, 44], ...outline });

  // ── 경험치 (맨 아래, 공용) ──
  b.panel("XP", { anchor: "bottom-center", pos: [0, 4], rect_size: [960, 22], ...part("gauge_frame"), sprite_type: 1 });
  b.sprite("XP/Fill", { anchor: "middle-left", pos: [8, 0], rect_size: [944, 10], image_ruid: K.gauge_fill, color: "#58B024", alpha: 1, sprite_type: 3, fill_method: 0 });
  b.text("XP/Text", "Lv 1", { size: 15, anchor: "middle-center", pos: [0, 0], rect_size: [900, 20], ...outline });

  // ── 생명·마나: PC는 D2 오브(양쪽 아래). 오브 그림은 코덱스 제작 전까지 임시 ──
  for (const [name, side, fill, x, size] of [
    ["LifeOrb", "bottom-left", "orb_life", 12, 180], ["ManaOrb", "bottom-right", "orb_mana", -12, 180],
  ]) {
    const inner = Math.round(size * 240 / 256);
    b.empty(name, { anchor: side, pos: [x, 28], rect_size: [size, size] });
    b.sprite(`${name}/Bg`, { anchor: "middle-center", pos: [0, 0], rect_size: [inner, inner], ...part("orb_bg"), sprite_type: 0 });
    b.sprite(`${name}/Fill`, { anchor: "middle-center", pos: [0, 0], rect_size: [inner, inner], ...part(fill), sprite_type: 3, fill_method: 1 });
    b.patchComponent(`${name}/Fill`, "MOD.Core.SpriteGUIRendererComponent", { FillOrigin: 0, FillAmount: 1 });
    b.sprite(`${name}/Frame`, { anchor: "middle-center", pos: [0, 0], rect_size: [size, size], ...part("orb_frame"), sprite_type: 0 });
    b.text(`${name}/Text`, "0/0", { size: 22, bold: true, anchor: "middle-center", pos: [0, 0], rect_size: [size, 40], ...outline });
    k.pc(name);
  }
  // ── 모바일 캐릭터 틀 (왼쪽 위, 디아블로 이모탈식): 레벨 원 + 생명·마나 막대. 가운데 아래 오브는 없앴다 (10-13, docs/ui/mobile-layout.md) ──
  b.panel("MFrame", { anchor: "top-left", pos: [24, -16], rect_size: [480, 108], ...part("hud_box"), sprite_type: 1 });
  b.empty("MFrame/Lv", { anchor: "middle-left", pos: [6, 0], rect_size: [100, 100] });
  b.sprite("MFrame/Lv/Bg", { anchor: "middle-center", pos: [0, 0], rect_size: [92, 92], ...part("orb_bg"), sprite_type: 0 });
  b.sprite("MFrame/Lv/Frame", { anchor: "middle-center", pos: [0, 0], rect_size: [100, 100], ...part("orb_frame"), sprite_type: 0 });
  b.text("MFrame/Lv/Text", "1", { size: 36, bold: true, color: C.title, anchor: "middle-center", pos: [0, -2], rect_size: [90, 50], ...outline });
  b.text("MFrame/Lv/Cap", "Lv", { size: 18, color: C.gold, anchor: "top-center", pos: [0, -14], rect_size: [60, 24], ...outline });
  for (const [name, y, h, color, size] of [["Hp", -12, 40, "#D8301F", 22], ["Mp", -60, 32, "#2F6FE6", 19]]) {
    b.panel(`MFrame/${name}`, { anchor: "top-left", pos: [116, y], rect_size: [350, h], ...part("gauge_frame"), sprite_type: 1 });
    b.sprite(`MFrame/${name}/Fill`, { anchor: "middle-left", pos: [8, 0], rect_size: [334, h - 14], image_ruid: K.gauge_fill, color, alpha: 1, sprite_type: 3, fill_method: 0 });
    b.text(`MFrame/${name}/Text`, "0/0", { size, bold: true, anchor: "middle-center", pos: [0, 0], rect_size: [330, h], ...outline });
  }
  k.mobile("MFrame");

  // ── PC 아래 바: 스킬 5칸(A S D F 우클릭) + 벨트 4칸(1~4) + 미니 패널 아이콘 ──
  b.empty("Bottom", { anchor: "bottom-center", pos: [0, 30], rect_size: [1060, 112] });
  k.pc("Bottom");
  b.empty("Bottom/Slots", { anchor: "middle-center", pos: [0, 0], rect_size: [1060, 112] });
  ["A", "S", "D", "F", "R"].forEach((key, i) => {
    const n = `Bottom/Slots/Slot${i + 1}`;
    k.slot(n, { anchor: "middle-left", pos: [76 + i * 96, 0], rect_size: [88, 88] }, 60, "slot_skill");
    k.cooldown(n, 80);
    b.text(`${n}/Key`, key === "R" ? "우클릭" : key, { size: 18, color: C.white, anchor: "bottom-right", pos: [-4, 2], rect_size: [70, 22], alignment: 8, ...outline });
  });
  ["1", "2", "3", "4"].forEach((key, i) => {
    const n = `Bottom/Slots/Belt${i + 1}`;
    k.slot(n, { anchor: "middle-left", pos: [608 + i * 96, 0], rect_size: [88, 88] }, 52);
    b.text(`${n}/Key`, key, { size: 18, color: C.white, anchor: "top-left", pos: [6, -2], rect_size: [24, 22], alignment: 0, ...outline });
    b.text(`${n}/Count`, "", { size: 18, bold: true, anchor: "bottom-right", pos: [-6, 2], rect_size: [60, 24], alignment: 8, ...outline });
  });
  // PC 메뉴 줄: 아이콘 + 아래 메뉴 이름 + 오른쪽 위 단축키 (귀환은 벨트 칸으로 옮겨 메뉴에서 뺐다)
  const MENU = [["BtnInv", K.icon_bag, "I", "소지품"], ["BtnChar", K.icon_stats, "U", "능력치"], ["BtnSkill", K.icon_skill, "K", "스킬"], ["BtnShadow", K.icon_shadow, "H", "그림자"],
    ["BtnQuest", K.icon_quest, "Q", "퀘스트"], ["BtnSocial", K.icon_party, "P", "플레이어"], ["BtnRank", K.icon_rank, "L", "랭킹"], ["BtnExtract", SKILL_ICON.extract_mastery, "E", "그림자 추출"]];
  b.empty("Bottom/Menu", { anchor: "top-center", pos: [0, 92], rect_size: [MENU.length * 88, 84] });
  MENU.forEach(([n, ruid, key, label], i) => {
      const path = `Bottom/Menu/${n}`;
      b.button(path, "", { anchor: "middle-left", pos: [i * 88, 0], rect_size: [84, 84], ...bg("hud_box"), sprite_type: 1 });
      b.sprite(`${path}/Icon`, { anchor: "top-center", pos: [0, -6], rect_size: [44, 44], image_ruid: ruid, sprite_type: 0, color: iconColor(ruid), alpha: 1 });
      k.aspect(`${path}/Icon`);
      b.text(`${path}/Label`, label, { size: 18, bold: true, color: C.gold, anchor: "bottom-center", pos: [0, 4], rect_size: [84, 24], bestfit: true, min_size: 12, max_size: 18, ...outline });
      b.text(`${path}/Key`, key, { size: 16, color: C.white, anchor: "top-right", pos: [-3, -2], rect_size: [20, 18], alignment: 2, ...outline });
      // 붉은 점: 능력치·스킬 = 남은 포인트, 그림자·추출 = 상황 안내가 가리킬 때 (GuideCoach)
      if (["BtnChar", "BtnSkill", "BtnShadow", "BtnExtract"].includes(n)) k.badge(path);
    });

  // ── 메뉴 창 (모바일·PC 공용): 모든 창을 한곳에서 ──
  k.frame("MenuWin", "middle-center", [0, 20], [800, 740], "메뉴");
  [["Inv", K.icon_bag, "소지품"], ["Char", K.icon_stats, "능력치"], ["Skill", K.icon_skill, "스킬"],
    ["Shadow", K.icon_shadow, "그림자"], ["Quest", K.icon_quest, "퀘스트"], ["Social", K.icon_party, "플레이어"],
    ["Rank", K.icon_rank, "랭킹"], ["Rune", K.rune, "룬워드"], ["Input", K.icon_gear, "설정"]].forEach(([n, ruid, label], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const path = `MenuWin/${n}`;
    k.btn(path, "", { anchor: "top-left", pos: [64 + col * 230, -96 - row * 160], rect_size: [212, 148] });
    b.sprite(`${path}/Icon`, { anchor: "top-center", pos: [0, -16], rect_size: [64, 64], image_ruid: ruid, sprite_type: 0, color: iconColor(ruid), alpha: 1 });
    k.aspect(`${path}/Icon`);
    b.text(`${path}/Label`, label, { size: 26, color: C.white, anchor: "bottom-center", pos: [0, 14], rect_size: [200, 34] });
    if (n === "Char" || n === "Skill" || n === "Shadow") k.badge(path);
  });
  // 아래 줄 3칸 (위 격자와 같은 열): 캐릭터 선택으로 (저장 후 선택 창 — CharSelectWindow · PlayerSave.RequestCharSelect)
  //   10-23: 고양이 재(PetWindow)를 넣어 4칸 — 폭 212 → 163
  k.btn("MenuWin/CharSel", "캐릭터 선택", { anchor: "top-left", pos: [64, -576], rect_size: [163, 72], font_size: 20 });
  // 채널 변경 (ChannelWindow · ChannelSystem — 같은 채널끼리만 만나고 파티를 맺는다)
  k.btn("MenuWin/Channel", "채널 변경", { anchor: "top-left", pos: [239, -576], rect_size: [163, 72], font_size: 20 });
  // 게임 안내 (GuideWindow — 첫 진입 때 한 번 저절로 뜨고, 여기서 다시 본다)
  k.btn("MenuWin/Guide", "게임 안내", { anchor: "top-left", pos: [414, -576], rect_size: [163, 72], font_size: 20 });
  // 고양이 재 (PetWindow — 오픈 기념 무료 받기 · 주울 물건 고르기)
  k.ok("MenuWin/Pet", "고양이 재", { anchor: "top-left", pos: [589, -576], rect_size: [163, 72], font_size: 20 });

  // ── 고양이 재 창 (PetWindow · PetSystem): 그림 · 받기/구매 · 주울 물건 5단계 ──
  if (b.find("PetWin")) b.remove("PetWin");
  k.frame("PetWin", "middle-center", [0, 20], [960, 700], "고양이 재");
  b.patchComponent("PetWin", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.05, g: 0.045, b: 0.06, a: 1 } });
  k.inner("PetWin/Art", "top-left", [40, -90], [300, 300]);
  b.sprite("PetWin/Art/Pic", { anchor: "middle-center", pos: [0, 0], rect_size: [220, 220], image_ruid: K.pet_jae, sprite_type: 0, color: WHITE, alpha: 1 });
  k.aspect("PetWin/Art/Pic");
  b.text("PetWin/Status", "", { size: 22, color: C.white, alignment: 0, anchor: "top-left", pos: [370, -96], rect_size: [550, 210], ...outline });
  k.ok("PetWin/BtnGet", "무료로 받기", { anchor: "top-left", pos: [370, -318], rect_size: [300, 76], font_size: 24 });
  b.text("PetWin/FilterLabel", "주워 올 물건", { size: 22, color: C.gold, alignment: 3, anchor: "top-left", pos: [44, -420], rect_size: [600, 34], ...outline });
  ["쉬기", "전부", "쓸 만한 것", "희귀 이상", "유니크·세트"].forEach((t, i) =>
    k.btn(`PetWin/F${i}`, t, { anchor: "top-left", pos: [40 + i * 178, -462], rect_size: [168, 72], font_size: 20 }));
  b.text("PetWin/FilterDesc", "", { size: 19, color: C.dim, alignment: 0, anchor: "top-left", pos: [44, -548], rect_size: [880, 110], ...outline });
  b.text("MenuWin/Help", "단축키  I 소지품 · U 능력치 · K 스킬 · H 그림자 · Q 퀘스트 · P 플레이어 · L 랭킹 · E 추출\nA S D F·우클릭 스킬 · 1~4 벨트(칸 우클릭 = 넣을 물건 바꾸기) · Z 소환 · X 회수 · C 집결",
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
  // 10-11 능력치 개편 (docs/design/16): 줄마다 「이름 · 역할」 + 지금 효과 → 1포인트 더 찍으면 (미리보기), 추천 분배 3개 + 초기화
  k.frame("CharWin", "middle-left", [30, 20], [520, 820], "능력치");
  k.inner("CharWin/Paper", "top-center", [0, -84], [470, 236], "win_content");
  b.text("CharWin/Paper/Info", "", { size: 18, color: C.gold, alignment: 0, anchor: "top-left", pos: [18, -14], rect_size: [434, 210] });
  ["Str", "Ene", "Vit", "Dex"].forEach((s, i) => {
    b.empty(`CharWin/${s}`, { anchor: "top-left", pos: [26, -326 - i * 78], rect_size: [468, 72] });
    b.text(`CharWin/${s}/Text`, s, { size: 20, color: C.white, alignment: 3, anchor: "middle-left", pos: [4, 0], rect_size: [390, 70] });
    k.ok(`CharWin/${s}/BtnAdd`, "+", { anchor: "middle-right", pos: [0, 0], rect_size: [64, 60], font_size: 30 });
  });
  b.text("CharWin/Points", "", { size: 22, color: "#F4ED83", anchor: "bottom-center", pos: [0, 156], rect_size: [460, 30], ...outline });
  [["Auto1", "소환형 추천"], ["Auto2", "주문형 추천"], ["Auto3", "균형 추천"]].forEach(([n, label], i) => {
    k.btn(`CharWin/${n}`, label, { anchor: "bottom-left", pos: [24 + i * 160, 92], rect_size: [152, 54], font_size: 20 });
  });
  k.btn("CharWin/BtnReset", "초기화", { anchor: "bottom-center", pos: [0, 28], rect_size: [460, 54], font_size: 20 });

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

  // ── 스킬 창 (10-11 개편, docs/design/16): 트리 탭 4개(10-20 망령 걸음 추가) + 메인 스킬 카드 6×4 (해금 레벨 순) + 오른쪽 강화 패널 ──
  k.frame("SkillWin", "middle-center", [0, 30], [1020, 860], "스킬");
  for (const old of ["SkillWin/Col1", "SkillWin/Col2", "SkillWin/Col3", "SkillWin/Head1", "SkillWin/Head2", "SkillWin/Head3"]) if (b.find(old)) b.remove(old);
  b.text("SkillWin/Points", "", { size: 22, color: "#F4ED83", anchor: "top-left", pos: [40, -76], rect_size: [560, 30], alignment: 3, ...outline });
  k.btn("SkillWin/BtnReset", "초기화", { anchor: "top-right", pos: [-96, -70], rect_size: [330, 44], font_size: 18 });
  // 트리 탭: 한 트리 최대 12장이라 6×4 카드면 넉넉하다 (전체 34장을 한 판에 넣으면 6×5를 넘었다)
  [["Tab1", "소환"], ["Tab2", "영혼"], ["Tab3", "저주"], ["Tab4", "망령 걸음"]].forEach(([n, t], i) => {
    k.btn(`SkillWin/${n}`, t, { anchor: "top-left", pos: [30 + i * 164, -116], rect_size: [156, 54], font_size: 20 });
    k.badge(`SkillWin/${n}`);   // 상황 안내가 다른 탭의 스킬을 가리킬 때
  });
  b.empty("SkillWin/Grid", { anchor: "top-left", pos: [30, -180], rect_size: [648, 392] });
  for (let i = 24; i < 30; i++) if (b.find(`SkillWin/Grid/M${i + 1}`)) b.remove(`SkillWin/Grid/M${i + 1}`);
  for (let i = 0; i < 24; i++) {
    const n = `SkillWin/Grid/M${i + 1}`;
    const col = i % 6, row = Math.floor(i / 6);
    b.button(n, "", { anchor: "top-left", pos: [col * 109, -row * 98], rect_size: [103, 92], bg_color: { r: 0, g: 0, b: 0, a: 0.3 } });
    b.sprite(`${n}/Icon`, { anchor: "top-center", pos: [0, -4], rect_size: [42, 42], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    k.aspect(`${n}/Icon`);
    b.text(`${n}/Label`, "", { size: 14, color: C.white, alignment: 4, anchor: "bottom-center", pos: [0, 2], rect_size: [101, 44], bestfit: true, min_size: 11, max_size: 14 });
    k.badge(n);   // 상황 안내가 배울 스킬 카드를 가리킨다 (GuideCoach)
  }
  k.inner("SkillWin/Detail", "top-left", [690, -118], [300, 484], "win_content");
  b.text("SkillWin/Detail/Name", "", { size: 22, bold: true, color: C.title, alignment: 3, anchor: "top-left", pos: [14, -10], rect_size: [272, 32], ...outline });
  b.text("SkillWin/Detail/Desc", "", { size: 15, color: C.gold, alignment: 0, anchor: "top-left", pos: [14, -46], rect_size: [272, 150] });
  // 스킬 강화 (10-24 사용자: 「눌러야 하는지 모르겠다」) — 제목 + 안내 한 줄, 칸마다 아이콘 · 이름/효과 · 오른쪽 상태 칩(+1 / 잠김 / 완료)
  b.text("SkillWin/Detail/NodeHead", "스킬 강화", { size: 17, bold: true, color: "#E6C88A", alignment: 3, anchor: "top-left", pos: [14, -196], rect_size: [272, 22] });
  b.text("SkillWin/Detail/NodeHint", "칸을 눌러 고른 뒤 「강화 +1」", { size: 13, color: "#9C9488", alignment: 3, anchor: "top-left", pos: [14, -218], rect_size: [272, 18] });
  for (let i = 0; i < 3; i++) {
    const n = `SkillWin/Detail/N${i + 1}`;
    b.button(n, "", { anchor: "top-left", pos: [10, -240 - i * 80], rect_size: [280, 76], bg_color: { r: 0, g: 0, b: 0, a: 0.35 } });
    b.sprite(`${n}/Icon`, { anchor: "middle-left", pos: [10, 0], rect_size: [40, 40], color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${n}/Icon`);
    b.text(`${n}/Label`, "", { size: 14, color: C.white, alignment: 3, anchor: "middle-left", pos: [58, 0], rect_size: [164, 72], bestfit: true, min_size: 11, max_size: 14 });
    b.text(`${n}/Chip`, "", { size: 15, bold: true, color: C.white, alignment: 4, anchor: "middle-right", pos: [-8, 0], rect_size: [50, 40], bestfit: true, min_size: 11, max_size: 15, ...outline });
  }
  k.inner("SkillWin/DescBox", "bottom-left", [30, 110], [700, 120], "win_content");
  b.text("SkillWin/DescBox/Desc", "", { size: 16, color: C.gold, alignment: 3, anchor: "middle-left", pos: [14, 0], rect_size: [672, 114] });
  // 습득은 설명 오른쪽 버튼. 칸 지정은 PC·모바일 모두 「스킬 편집」 하나
  k.ok("SkillWin/BtnLearn", "습득 +1", { anchor: "bottom-right", pos: [-30, 110], rect_size: [250, 120], font_size: 30 });
  k.btn("SkillWin/BtnEdit", "스킬 편집 — 스킬 칸에 넣기", { anchor: "bottom-left", pos: [30, 24], rect_size: [960, 76], font_size: 26 });
  k.badge("SkillWin/BtnLearn");
  k.badge("SkillWin/BtnEdit");

  // ── NPC 대화 (가까이 가면 화면 아래에 열림, D2처럼 말을 건 뒤 의뢰를 받는다) ──
  k.frame("NpcWin", "bottom-center", [0, 170], [1100, 320], "");
  // 제목(NPC 이름)은 다른 창과 같은 공통 제목 규칙(k.frame: 가운데 · 제목 띠 세로 가운데)을 그대로 쓴다
  k.inner("NpcWin/Paper", "top-center", [0, -72], [1000, 150], "win_content");
  b.text("NpcWin/Paper/Body", "", { size: 22, color: C.gold, alignment: 0, anchor: "top-left", pos: [20, -14], rect_size: [960, 124] });
  [0, 1, 2, 3, 4].forEach((i) => k.btn(`NpcWin/Btn${i + 1}`, `Btn${i + 1}`, { anchor: "bottom-right", pos: [-50 - (4 - i) * 196, 24], rect_size: [184, 72], font_size: 20 }));

  // ── 포털 이름 (D2처럼 출구 위에 갈 곳 이름, HudMap이 화면 좌표로 옮긴다) ──
  for (let i = 1; i <= 4; i++) {
    b.text(`Gate${i}`, "", { size: 22, bold: true, color: "#9ED0FF", anchor: "middle-center", pos: [0, 0], rect_size: [420, 34], ...outline, enable: false });
  }

  // 혼 추출: 손 닿는 혼 위에 「E 추출 45%」, 결과는 혼 자리에서 떠오르는 글자 (HudMain이 화면 좌표로 옮긴다)
  b.text("SoulHint", "", { size: 24, bold: true, color: "#D9B8FF", anchor: "middle-center", pos: [0, 0], rect_size: [320, 34], ...outline, enable: false });
  // 머리 위 경고 (지금 한 행동이 안 된 이유: 마나 부족·혼이 멀다·이미 마을 — HudMain.ShowWarn, docs/ui/message-rules.md)
  b.text("WarnPop", "", { size: 24, bold: true, color: "#FFB45A", anchor: "middle-center", pos: [0, 0], rect_size: [560, 40], ...outline, outline_width: 0.25, enable: false });
  b.text("ExtractPop", "", { size: 30, bold: true, color: "#D9B8FF", anchor: "middle-center", pos: [0, 0], rect_size: [520, 84], ...outline, outline_width: 0.25, enable: false });

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

  // ── 버프·디버프 줄 (10-11 팀 QA: 신전 축복만 위쪽 글자로 보이고 둔화·저주는 안 보였다) ──
  // 왼쪽 위(D2·PoE처럼)에 둥근 칩 최대 8개: 색 원 + 짧은 이름 + 남은 초. 누르면 효과 설명 (HudMain.RenderBuffs)
  // (처음엔 아래 가운데였는데 NPC 대화 안내 「[Space] 이름」과 겹쳤다)
  b.empty("Buffs", { anchor: "top-left", pos: [24, -34], rect_size: [8 * 64, 60] });   // top-left 프리셋은 피벗도 왼쪽 위
  for (let i = 1; i <= 8; i++) {
    const path = `Buffs/B${i}`;
    b.button(path, "", { anchor: "middle-left", pos: [(i - 1) * 64, 0], rect_size: [56, 56], image_ruid: K.circle, bg_color: "#FFFFFF", sprite_type: 0, enable: false });
    b.text(`${path}/Label`, "", { size: 15, bold: true, anchor: "middle-center", pos: [0, 7], rect_size: [56, 22], bestfit: true, min_size: 11, max_size: 15, ...outline });
    b.text(`${path}/Time`, "", { size: 13, anchor: "middle-center", pos: [0, -12], rect_size: [56, 18], ...outline });
    // 디버프 칩 위에 코덱스 붉은 테두리 (debuff_frame, 가운데 투명). 버프와 한눈에 갈린다
    b.sprite(`${path}/Frame`, { anchor: "middle-center", pos: [0, 0], rect_size: [56, 56], image_ruid: K.debuff_frame, color: WHITE, alpha: 1, sprite_type: 0, enable: false });
  }

  // ── 퀘스트 창 (Q) ──
  k.frame("QuestWin", "middle-center", [0, 60], [800, 620], "퀘스트 — 무덤 왕국");
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
  // 10-23 4차 (사용자: 글자 2열 목록은 가독성이 떨어지고 모바일에 맞지 않는다 · 인벤토리처럼 위아래 · 금액은 오른쪽 아래 고정, 누르면 직접 입력):
  // 소지품 창(가운데 1280×960)과 같은 크기의 창 하나로 — 왼쪽 위부터 상대 제안 8칸 · 내 제안 8칸 · 내 가방 6×5(2쪽), 오른쪽 = 고른 물건 설명 · 올리기/되돌리기 · 확인 · 취소.
  // 거래 중에는 소지품 창을 따로 열지 않는다 (가운데 큰 창이라 거래창을 덮었다)
  if (b.find("TradeWin")) b.remove("TradeWin");
  k.frame("TradeWin", "middle-center", [0, 0], [1280, 960], "거래");
  // 소지품 창처럼 바탕을 불투명하게 (뒤의 미니맵·의뢰 글이 비쳤다)
  b.patchComponent("TradeWin", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.05, g: 0.045, b: 0.06, a: 1 } });
  const tradeRow = (side, y) => {
    k.inner(`TradeWin/${side}Row`, "top-left", [24, y], [628, 100]);
    for (let i = 0; i < 8; i++) {
      const slot = `TradeWin/${side}Row/S${i + 1}`;
      k.slot(slot, { anchor: "top-left", pos: [8 + i * 77, -8], rect_size: [74, 84] }, 54);
      b.text(`${slot}/Count`, "", { size: 14, color: C.white, alignment: 8, anchor: "bottom-right", pos: [-4, 2], rect_size: [50, 20], ...outline });
    }
  };
  b.text("TradeWin/TheirLabel", "상대 제안", { size: 21, color: C.gold, alignment: 3, anchor: "top-left", pos: [28, -78], rect_size: [620, 32], ...outline });
  tradeRow("Their", -112);
  // 골드 = 소지품 창과 같은 금화 아이콘 + 금액 (10-23 사용자: 「골드」 글자 대신 아이콘). 확인 상태는 그 왼쪽
  const GOLD_ICON = "94b7d89e2f514e269e04250dd4b7d989";
  const goldIcon = (name, y) => b.sprite(name, { anchor: "top-left", pos: [368, y], rect_size: [36, 36], image_ruid: GOLD_ICON, color: "#FFFFFF", sprite_type: 0 });
  b.text("TradeWin/TheirState", "", { size: 20, color: C.white, alignment: 5, anchor: "top-left", pos: [24, -216], rect_size: [330, 40], ...outline });
  goldIcon("TradeWin/TheirGoldIcon", -218);
  // 상대 금액도 내 골드 칸과 같은 상자 (고칠 수는 없다)
  b.panel("TradeWin/TheirGoldBox", { anchor: "top-left", pos: [412, -214], rect_size: [240, 44], color: { r: 0.02, g: 0.02, b: 0.03, a: 0.95 }, sprite_type: 1 });
  k.rim("TradeWin/TheirGoldBox", "slot_frame");
  b.text("TradeWin/TheirGoldBox/TheirGold", "", { size: 22, color: "#F4ED83", alignment: 5, anchor: "middle-center", pos: [-7, 0], rect_size: [212, 40], ...outline });
  b.text("TradeWin/MyLabel", "내 제안", { size: 21, color: C.white, alignment: 3, anchor: "top-left", pos: [28, -256], rect_size: [300, 32], ...outline });
  tradeRow("My", -290);
  b.text("TradeWin/MyState", "", { size: 20, color: C.white, alignment: 5, anchor: "top-left", pos: [24, -396], rect_size: [330, 40], ...outline });
  goldIcon("TradeWin/MyGoldIcon", -398);
  // 내 골드 칸: 글자색은 part() 뒤에 둬야 한다 (part의 color가 글자색을 검정으로 덮었다)
  b.textInput("TradeWin/MyGold", { anchor: "top-left", pos: [412, -394], rect_size: [240, 44], placeholder: "골드 입력", char_limit: 9, line_type: 0, font_size: 22, ...part("win_content"), color: "#F4ED83", bg_color: { r: 0.02, g: 0.02, b: 0.03, a: 0.95 }, alpha: 0.95, sprite_type: 1 });
  b.patchComponent("TradeWin/MyGold", "MOD.Core.TextGUIRendererComponent", { HorizontalAlignment: 2, Padding: { left: 0, right: 14, top: 0, bottom: 0 }, OutlineWidth: 0.2, OutlineColor: { r: 0, g: 0, b: 0, a: 1 } });
  b.patchComponent("TradeWin/MyGold", "MOD.Core.TextGUIRendererInputComponent", { PlaceHolderColor: { r: 0.66, g: 0.62, b: 0.55, a: 0.8 } });
  k.rim("TradeWin/MyGold", "slot_frame");
  b.text("TradeWin/BagLabel", "내 가방 · 누르면 설명, 「올리기」로 제안", { size: 19, color: C.dim, alignment: 3, anchor: "top-left", pos: [44, -448], rect_size: [464, 30], ...outline });
  k.btn("TradeWin/BagPrev", "◀", { anchor: "top-left", pos: [520, -444], rect_size: [60, 40], font_size: 18 });
  k.btn("TradeWin/BagNext", "▶", { anchor: "top-left", pos: [592, -444], rect_size: [60, 40], font_size: 18 });
  k.inner("TradeWin/Bag", "top-left", [24, -490], [628, 444]);
  for (let i = 0; i < 30; i++) {
    const col = i % 6, row = Math.floor(i / 6);
    const slot = `TradeWin/Bag/B${i + 1}`;
    k.slot(slot, { anchor: "top-left", pos: [10 + col * 102, -10 - row * 86], rect_size: [96, 80] }, 56);
    b.text(`${slot}/Count`, "", { size: 14, color: C.white, alignment: 8, anchor: "bottom-right", pos: [-4, 2], rect_size: [50, 20], ...outline });
  }
  k.inner("TradeWin/Info", "top-right", [-24, -78], [588, 744]);
  k.slot("TradeWin/Info/Pick", { anchor: "top-left", pos: [18, -18], rect_size: [120, 120] }, 88);
  b.text("TradeWin/Info/Head", "", { size: 22, color: C.gold, alignment: 3, anchor: "top-left", pos: [154, -18], rect_size: [416, 120], ...outline });
  b.text("TradeWin/Info/Text", "", { size: 19, color: C.white, alignment: 0, anchor: "top-left", pos: [18, -152], rect_size: [552, 492], ...outline });
  k.btn("TradeWin/Info/BtnAct", "올리기", { anchor: "bottom-center", pos: [0, 16], rect_size: [260, 72], font_size: 22 });
  k.ok("TradeWin/BtnConfirm", "확인", { anchor: "bottom-right", pos: [-326, 28], rect_size: [286, 88], font_size: 24 });
  k.btn("TradeWin/BtnCancel", "취소", { anchor: "bottom-right", pos: [-24, 28], rect_size: [286, 88], font_size: 24 });

  // ── 웨이포인트 창 ──
  k.frame("WpWin", "middle-center", [0, 60], [600, 700], "웨이포인트");
  // 액트 넘김 막대 (WaypointWindow가 고른 액트의 웨이포인트만 보여 준다)
  k.actPager("WpWin/ActBar", "top-center", [0, -110], 520);
  for (let i = 1; i <= 6; i++) {
    const n = `WpWin/Wp${i}`;
    k.btn(n, "", { anchor: "top-left", pos: [40, -186 - (i - 1) * 56], rect_size: [520, 52], font_size: 20 });
    k.pic(`${n}/Icon`, "icon_waypoint", { anchor: "middle-left", pos: [10, 0], rect_size: [38, 38] });
  }
  b.text("WpWin/DiffTitle", "난이도", { size: 19, color: C.gold, anchor: "bottom-center", pos: [0, 100], rect_size: [500, 28], ...outline });
  [["Diff0", "보통", -180], ["Diff1", "악몽", 0], ["Diff2", "지옥", 180]].forEach(([n, t, x]) => {
    k.btn(`WpWin/${n}`, t, { anchor: "bottom-center", pos: [x, 26], rect_size: [170, 64], font_size: 20 });
  });

  // ── 랭킹 창 ──
  k.frame("RankWin", "middle-center", [0, 60], [640, 660], "랭킹");
  // 10-20 B안: 「이번 주 심연」 탭 (주간 규칙 + 주마다 새 기록판) — 탭 셋
  [["TabDepth", "심연 최고 층", -196], ["TabWeek", "이번 주 심연", 0], ["TabQueen", "묘지기 여왕 처치 시간", 196]].forEach(([n, t, x]) => {
    k.btn(`RankWin/${n}`, t, { anchor: "top-center", pos: [x, -86], rect_size: [188, 56], font_size: 17 });
  });
  // 심연 기록은 액트별 (10-20) — 심연 탭 아래 액트 넘김 막대 (RankWindow.SetAct, 보스 탭에선 숨김)
  k.actPager("RankWin/ActBar", "top-center", [0, -166], 580);
  k.inner("RankWin/Paper", "top-center", [0, -218], [580, 414], "win_content");
  b.text("RankWin/Paper/List", "", { size: 19, color: C.gold, alignment: 0, anchor: "top-left", pos: [20, -16], rect_size: [540, 384] });

  // ── 채널 창 (메뉴 「채널 변경」): 채널별 인원, 고르면 확인 후 이동 (ChannelWindow.mlua) ──
  k.frame("ChanWin", "middle-center", [0, 40], [620, 700], "채널");
  for (let i = 1; i <= 8; i++) {
    k.btn(`ChanWin/Ch${i}`, "", { anchor: "top-center", pos: [0, -84 - (i - 1) * 58], rect_size: [540, 52], font_size: 20 });
  }
  b.text("ChanWin/Note", "", { size: 17, color: C.dim, anchor: "bottom-center", pos: [0, 96], rect_size: [540, 52], bestfit: true, min_size: 13, max_size: 17 });
  k.btn("ChanWin/BtnRefresh", "새로 고침", { anchor: "bottom-center", pos: [0, 24], rect_size: [240, 60], font_size: 20 });

  // ── 게임 고르기: 10-22 캐릭터 선택과 같은 전체 화면(CharSelectHUD)으로 옮겼다 (tools/build/roompicker.cjs) ──
  if (b.find("RoomWin")) b.remove("RoomWin");

  // ── 룬워드 조합법 (메뉴 「룬워드」): 조합·부위·효과, 룬별 효과 (RuneWindow.mlua) ──
  k.frame("RuneWin", "middle-center", [0, 20], [960, 760], "룬워드 조합법");
  [["TabWords", "룬워드 조합", -339], ["TabRunes1", "하급 룬", -113], ["TabRunes2", "중급 룬", 113], ["TabRunes3", "상급 룬", 339]].forEach(([n, t, x]) => {
    k.btn(`RuneWin/${n}`, t, { anchor: "top-center", pos: [x, -86], rect_size: [216, 56], font_size: 18 });
  });
  k.inner("RuneWin/Paper", "top-center", [0, -156], [900, 572], "win_content");
  if (b.find("RuneWin/Paper/List")) b.remove("RuneWin/Paper/List");
  k.scrollText("RuneWin/Paper/Scroll", "top-left", [20, -14], [870, 544], { size: 18, color: C.white });

  // ── 게임 안내 (메뉴 「게임 안내」 · 첫 진입 때 한 번): 쪽마다 제목 + 본문, 이전/다음 (GuideWindow.mlua) ──
  k.frame("GuideWin", "middle-center", [0, 20], [1040, 760], "게임 안내");
  k.inner("GuideWin/Paper", "top-center", [0, -90], [960, 548], "win_content");
  b.text("GuideWin/Paper/Head", "", { size: 30, bold: true, color: C.title, alignment: 0, anchor: "top-left", pos: [28, -20], rect_size: [904, 46], ...outline });
  b.text("GuideWin/Paper/Body", "", { size: 22, color: C.white, alignment: 0, anchor: "top-left", pos: [28, -82], rect_size: [904, 448], bestfit: true, min_size: 15, max_size: 22 });
  b.text("GuideWin/Page", "", { size: 20, color: C.dim, anchor: "bottom-center", pos: [0, 40], rect_size: [240, 40] });
  k.btn("GuideWin/BtnPrev", "이전", { anchor: "bottom-left", pos: [40, 26], rect_size: [220, 68] });
  k.ok("GuideWin/BtnNext", "다음", { anchor: "bottom-right", pos: [-40, 26], rect_size: [220, 68] });

  const file = P.ui("GameHUD");
  const previous = readIfExists(file);
  b.write(file);
  preserveIds(file, previous);
  return b.listEntities().length;
}

// ShadowHUD: 상태줄·보관함은 그대로 두고 그림만 바꾸며, 모바일 패드는 새로 짠다
function patchShadowHud() {
  const file = P.ui("ShadowHUD");
  const previous = readIfExists(file);
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
  // 보관함 창 (핵심 콘텐츠라 넓게): 왼쪽 고른 그림자 상세(모습·능력치·고유 능력·소환/강화/분해),
  // 오른쪽 목록(필터 전체|일반|정예|보스 · 정렬 · 8줄 · 페이지). 컨트롤러는 UI/ShadowHUD.mlua
  s.patch("Window", { anchor: "middle-center", pivot: [0.5, 0.5], pos: [0, 0], rect_size: [1560, 900] });
  s.patchComponent("Window", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: "2860136c06ab075439721c027de365af" }, Type: 1, Color: DARK, RaycastTarget: true });
  k.rim("Window", "win_frame", -20);
  s.text("Window/Title", "그림자 보관함", { size: 26, bold: true, color: C.title, anchor: "top-center", pivot: [0.5, 1], pos: [0, -17], rect_size: [900, 40], alignment: 4, ...outline });
  s.button("Window/BtnClose", "", { anchor: "top-right", pivot: [1, 1], pos: [-20, -14], rect_size: [88, 88], ...bg("btn_close"), sprite_type: 1 });
  s.patchComponent("Window/BtnClose", "MOD.Core.TextGUIRendererComponent", { Text: "" });
  // 왼쪽 상세
  const d = "Window/Detail";
  s.panel(d, { anchor: "top-left", pivot: [0, 1], pos: [30, -88], rect_size: [560, 784], ...part("win_content"), sprite_type: 1 });
  s.sprite(`${d}/Stage`, { anchor: "top-center", pivot: [0.5, 1], pos: [0, -18], rect_size: [300, 240], color: { r: 0.09, g: 0.07, b: 0.13, a: 1 }, sprite_type: 1 });
  s.sprite(`${d}/Stage/Portrait`, { anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
  k.aspect(`${d}/Stage/Portrait`);
  s.text(`${d}/Name`, "", { size: 30, bold: true, color: C.title, anchor: "top-center", pivot: [0.5, 1], pos: [0, -268], rect_size: [520, 42], bestfit: true, min_size: 24, max_size: 30, ...outline });
  s.text(`${d}/Grade`, "", { size: 22, color: C.gold, anchor: "top-center", pivot: [0.5, 1], pos: [0, -312], rect_size: [520, 32] });
  // 능력치·고유 능력: 세로 스크롤 칸 (10-13 지적: 고유 기술이 두 줄이 되면 아래 「정수 N 보유」와 겹쳤다).
  //   칸은 이름·등급 아래(-348)부터 정수 줄 위(아래에서 190 = 위에서 594)까지. 글 높이는 ShadowHUD.FitInfo가 글 길이로 정한다
  for (const old of ["Stats", "Trait"]) if (s.find(`${d}/${old}`)) s.remove(`${d}/${old}`);
  s.scrollLayout(`${d}/Info`, { anchor: "top-left", pivot: [0, 1], pos: [20, -348], rect_size: [524, 240], layout_type: 1, spacing: 10, use_scroll: true, padding: [6, 18, 0, 8], scroll_bar_visible: 1, scroll_bar_thickness: 10, scroll_bar_bg_color: { r: 0.14, g: 0.12, b: 0.17, a: 0.6 }, scroll_bar_handle_color: { r: 0.6, g: 0.49, b: 0.3, a: 1 } });
  //   글은 묶음(Body) 하나에 넣는다: 스크롤 칸이 글을 직접 세우면 줄바꿈 전 한 줄 너비(약 620)로 재서 가로 스크롤바가 생기고 둘째 줄까지 안 내려갔다
  for (const old of ["Info/Stats", "Info/Trait"]) if (s.find(`${d}/${old}`)) s.remove(`${d}/${old}`);
  s.empty(`${d}/Info/Body`, { anchor: "top-left", pivot: [0, 1], pos: [0, 0], rect_size: [490, 260] });
  s.text(`${d}/Info/Body/Stats`, "", { size: 21, color: "#E8E1D3", alignment: 0, anchor: "top-left", pivot: [0, 1], pos: [0, 0], rect_size: [490, 188], overflow: 0 });
  s.text(`${d}/Info/Body/Trait`, "", { size: 21, color: "#D9B8FF", alignment: 0, anchor: "top-left", pivot: [0, 1], pos: [0, -198], rect_size: [490, 54], overflow: 0 });
  s.text(`${d}/Empty`, "왼쪽에 보일 그림자를\n오른쪽 목록에서 고르세요", { size: 24, color: C.dim, anchor: "middle-center", pos: [0, 0], rect_size: [500, 120], enable: false });
  // 보유 정수: 버튼 위 오른쪽 ([아이콘] 정수 N 보유). 강화 비용·분해로 얻는 정수는 각 버튼 바로 아래
  s.empty(`${d}/Essence`, { anchor: "bottom-right", pivot: [1, 0], pos: [-20, 150], rect_size: [230, 40] });
  s.sprite(`${d}/Essence/Icon`, { anchor: "middle-left", pivot: [0, 0.5], pos: [0, 0], rect_size: [36, 36], image_ruid: K.essence, color: WHITE, alpha: 1, sprite_type: 0 });
  s.text(`${d}/Essence/Text`, "", { size: 21, color: "#D9B8FF", alignment: 3, anchor: "middle-left", pivot: [0, 0.5], pos: [44, 0], rect_size: [186, 40], bestfit: true, min_size: 16, max_size: 21 });
  [["BtnDeploy", "소환 지정"], ["BtnUpgrade", "강화"], ["BtnSalvage", "분해"]].forEach(([n, label], i) => {
    k.btn(`${d}/${n}`, label, { anchor: "bottom-left", pivot: [0, 0], pos: [20 + i * 176, 52], rect_size: [168, 88], font_size: 26 });
    s.text(`${d}/${n}Note`, "", { size: 18, color: "#D9B8FF", alignment: 4, anchor: "bottom-left", pivot: [0, 0], pos: [20 + i * 176, 14], rect_size: [168, 34], bestfit: true, min_size: 14, max_size: 18 });
  });
  k.badge(`${d}/BtnDeploy`);   // 상황 안내: 첫 소환 지정·군단 확장 (GuideCoach)
  // 오른쪽 목록: 필터 4 + 정렬 1
  [["FAll", "전체"], ["FNormal", "일반"], ["FElite", "정예"], ["FBoss", "보스"]].forEach(([n, label], i) => {
    k.btn(`Window/${n}`, label, { anchor: "top-left", pivot: [0, 1], pos: [620 + i * 152, -88], rect_size: [144, 72], font_size: 24 });
  });
  k.btn("Window/BtnSort", "정렬: 레벨순", { anchor: "top-right", pivot: [1, 1], pos: [-30, -88], rect_size: [236, 72], font_size: 22 });
  for (let i = 1; i <= 8; i++) {
    const row = `Window/Row${i}`;
    for (const old of ["BtnDeploy", "BtnUpgrade", "BtnSalvage"]) if (s.find(`${row}/${old}`)) s.remove(`${row}/${old}`);
    s.button(row, "", { anchor: "top-left", pivot: [0, 1], pos: [620, -176 - (i - 1) * 80], rect_size: [910, 74], bg_color: { r: 0.13, g: 0.12, b: 0.16, a: 1 }, sprite_type: 1 });
    s.patchComponent(row, "MOD.Core.TextGUIRendererComponent", { Text: "" });
    s.sprite(`${row}/Portrait`, { anchor: "middle-left", pivot: [0, 0.5], pos: [12, 0], rect_size: [60, 60], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    k.aspect(`${row}/Portrait`);
    s.text(`${row}/Label`, "", { size: 23, color: C.gold, alignment: 3, anchor: "middle-left", pivot: [0, 0.5], pos: [84, 0], rect_size: [600, 66], bestfit: true, min_size: 18, max_size: 23 });
    s.text(`${row}/State`, "", { size: 21, color: C.dim, alignment: 5, anchor: "middle-right", pivot: [1, 0.5], pos: [-18, 0], rect_size: [200, 60] });
    k.badge(row);   // 상황 안내: 아직 지정하지 않은 그림자 줄
  }
  k.btn("Window/BtnPrev", "◀ 이전", { anchor: "bottom-left", pivot: [0, 0], pos: [620, 18], rect_size: [180, 72], font_size: 22 });
  k.btn("Window/BtnNext", "다음 ▶", { anchor: "bottom-right", pivot: [1, 0], pos: [-30, 18], rect_size: [180, 72], font_size: 22 });
  // 여러 개 선택(분해 전용) — 이전 버튼 옆
  k.btn("Window/BtnMulti", "여러 개 선택", { anchor: "bottom-left", pivot: [0, 0], pos: [816, 18], rect_size: [184, 72], font_size: 21 });
  // 목록 전체 선택 (지금 필터의 분해 가능한 그림자 전부 → 왼쪽 「분해」 한 번) — 10-10 QA
  k.btn("Window/BtnPickAll", "전체 선택", { anchor: "bottom-left", pivot: [0, 0], pos: [1008, 18], rect_size: [164, 72], font_size: 21 });
  s.text("Window/PageText", "", { size: 22, color: C.dim, anchor: "bottom-left", pivot: [0.5, 0], pos: [1262, 30], rect_size: [170, 48] });
  // 테두리(Rim)를 맨 아래로 (제목이 테두리에 가렸다), 창이 GameHUD(하단 메뉴 줄)보다 위에 오게 그룹 순서 6
  {
    const kids = s.listEntities().filter((e) => e.path.startsWith("/ui/ShadowHUD/Window/") && e.path.split("/").length === 5);
    kids.sort((x, y) => (x.name === "Rim" ? -1 : y.name === "Rim" ? 1 : 0)).forEach((e, i) => s.patch(e.path, { display_order: i }));
  }
  s.patchComponent("/", "MOD.Core.UIGroupComponent", { GroupOrder: 6 });

  // 모바일 패드: 조이스틱(왼쪽) + 오른쪽 공격 + 둘레 스킬 4칸 + 물약 2 + 그림자 명령(펼침) + 스킬 편집
  for (const old of ["BtnAttack", "BtnRally", "BtnRecall", "BtnSummon", "BtnStorage", "Attack", "Dash", "Skills", "Potions", "Shadow", "BtnSkillEdit", "Extract"]) {
    if (s.find(`MobilePad/${old}`)) s.remove(`MobilePad/${old}`);
  }
  const center = { anchor: "bottom-right", pivot: [0.5, 0.5] };
  // 오른쪽 아래 모서리 기준 중심 좌표 (디아블로 이모탈식, docs/ui/mobile-layout.md): 큰 공격 + 반지름 250 호에 스킬 4칸 + 호 위 물약 줄 + 호 왼쪽 그림자 명령
  // 묶음(Skills·Potions·Shadow)은 stretch라 부모 크기를 그대로 따라야 한다. 저장된 크기가 달라 생긴 여백(OffsetMin/Max)이 묶음 전체를 114px 옆·89px 아래로 밀어 물약 아랫줄이 화면 밖으로 잘렸다 (10-13)
  // 엔진은 stretch 여백을 저장된 OffsetMin/Max가 아니라 「부모 RectSize − 내 RectSize」로 다시 계산한다 → 크기를 부모(1920×1080)와 같게 둔다
  const fill = (path) => s.patchComponent(path, "MOD.Core.UITransformComponent", { RectSize: { x: 1920, y: 1080 }, OffsetMin: { x: 0, y: 0 }, OffsetMax: { x: 0, y: 0 } });
  fill("/");   // 그룹 루트도 메이커가 저장할 때 2148×901로 여백을 남겼다 (가로 ±114 · 세로 ∓89)
  fill("MobilePad");
  s.button("MobilePad/Attack", "", { ...center, pos: [-170, 170], rect_size: [220, 220], ...bg("orb_bg"), sprite_type: 0 });
  s.sprite("MobilePad/Attack/Ring", { anchor: "middle-center", pos: [0, 0], rect_size: [234, 234], ...part("orb_frame"), sprite_type: 0 });
  k.pic("MobilePad/Attack/Icon", "icon_sword", { anchor: "middle-center", pos: [0, 14], rect_size: [100, 100] });
  b_label(s, "MobilePad/Attack/Label", "공격", 28, "bottom-center");
  s.patch("MobilePad/Attack/Label", { pos: [0, 22] });
  k.cooldown("MobilePad/Attack", 210, true);
  // 편집 모드 표시 (스킬 편집을 누르면 켜짐: 누르는 칸에 스킬을 넣는다)
  const editMark = (path, size) => {
    s.text(`${path}/Edit`, "+", { size, bold: true, color: "#F6E3B0", anchor: "middle-center", pos: [0, 0], rect_size: [120, 120], ...outline, enable: false });
  };
  editMark("MobilePad/Attack", 90);
  // 망령 질주 (10-20): 공격 단추 왼쪽 아래 — 스킬 칸과 별개로 늘 같은 자리 (배우기 전엔 숨김, 남은 횟수는 Count)
  s.button("MobilePad/Dash", "", { ...center, pos: [-360, 60], rect_size: [96, 96], ...bg("orb_bg"), sprite_type: 0 });
  s.sprite("MobilePad/Dash/Icon", { anchor: "middle-center", pos: [0, 0], rect_size: [60, 60], color: WHITE, alpha: 1, sprite_type: 0 });
  s.patchComponent("MobilePad/Dash/Icon", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: SKILL_ICON.wraith_dash }, RaycastTarget: false });
  k.aspect("MobilePad/Dash/Icon");
  s.sprite("MobilePad/Dash/Ring", { anchor: "middle-center", pos: [0, 0], rect_size: [104, 104], ...part("orb_frame"), sprite_type: 0 });
  s.patchComponent("MobilePad/Dash/Ring", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  k.cooldown("MobilePad/Dash", 90, true);
  b_label(s, "MobilePad/Dash/Count", "", 20, "bottom-right");
  s.patch("MobilePad/Dash", { enable: false });
  // 스킬 칸은 이모탈처럼 둥근 단추: 공격 중심(-170,170)에서 반지름 260, 180°·150°·120°·90° (네모 칸은 이웃 칸 모서리가 겹쳤다)
  const arc = [[-430, 170], [-395, 300], [-300, 395], [-170, 430]];
  s.empty("MobilePad/Skills", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  fill("MobilePad/Skills");
  arc.forEach((p, i) => {
    const n = `MobilePad/Skills/S${i + 1}`;
    s.button(n, "", { ...center, pos: p, rect_size: [120, 120], ...bg("orb_bg"), sprite_type: 0 });
    s.sprite(`${n}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [76, 76], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    k.aspect(`${n}/Icon`);
    s.sprite(`${n}/Ring`, { anchor: "middle-center", pos: [0, 0], rect_size: [128, 128], ...part("orb_frame"), sprite_type: 0 });
    s.patchComponent(`${n}/Ring`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    k.cooldown(n, 112, true);
    editMark(n, 64);
    if (i === 0) k.badge(n);   // 상황 안내: 해골 전사를 넣을 칸
  });
  // 「편집 끝」: 스킬 창의 「스킬 편집」으로 편집 모드일 때만 보인다 (평소에는 화면에 떠 있지 않다)
  k.btn("MobilePad/BtnSkillEdit", "편집 끝", { ...center, pos: [-820, 448], rect_size: [220, 88], font_size: 26, enable: false });
  // 벨트 4칸 (2×2): 무엇을 넣을지는 플레이어가 정한다 (「스킬 편집」 중 칸을 누르면 지정). 그림·개수는 MobilePad가 채운다
  // 물약은 공격 단추 왼쪽 맨 아래 한 줄 (엄지가 바로 닿는 높이, 경험치 막대 위). 호 위에 두면 펼친 지도와 겹쳤다
  s.empty("MobilePad/Potions", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  fill("MobilePad/Potions");
  [[-560, 80], [-672, 80], [-784, 80], [-896, 80]].forEach(([x, y], i) => {
    const path = `MobilePad/Potions/Belt${i + 1}`;
    k.slot(path, { ...center, pos: [x, y], rect_size: [104, 104] }, 56);
    b_label(s, `${path}/Count`, "", 20, "bottom-right");
    editMark(path, 56);
  });
  // 그림자 명령: 버튼 하나를 누르면 소환·회수·집결이 위로 펼쳐진다 (배운 것만 보임)
  // 혼 추출: 손 닿는 거리에 내 혼이 있을 때만 나타난다 (그림자 소환을 배운 뒤). PC는 E 키·혼 클릭
  k.slot("MobilePad/Extract", { ...center, pos: [-716, 200], rect_size: [120, 120] }, 70);
  s.patchComponent("MobilePad/Extract/Icon", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: SKILL_ICON.extract_mastery }, Color: hexA("#FFFFFF", 1) });
  s.patch("MobilePad/Extract/Icon", { enable: true });
  b_label(s, "MobilePad/Extract/Label", "추출", 20, "bottom-center");
  s.patch("MobilePad/Extract", { enable: false });
  k.badge("MobilePad/Extract");
  s.empty("MobilePad/Shadow", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  fill("MobilePad/Shadow");
  k.slot("MobilePad/Shadow/Toggle", { ...center, pos: [-600, 200], rect_size: [104, 104] }, 64);
  s.patchComponent("MobilePad/Shadow/Toggle/Icon", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: K.icon_shadow }, Color: hexA(part("icon_shadow").color, 1) });
  s.patch("MobilePad/Shadow/Toggle/Icon", { enable: true });
  k.badge("MobilePad/Shadow/Toggle");
  s.empty("MobilePad/Shadow/Cmds", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });
  fill("MobilePad/Shadow/Cmds");
  [["Summon", "소환", SKILL_ICON.shadow_summon], ["Recall", "회수", K.icon_scroll], ["Rally", "집결", SKILL_ICON.rally]].forEach(([n, label, ruid], i) => {
    const path = `MobilePad/Shadow/Cmds/${n}`;
    const p = [[-600, 316], [-600, 432], [-716, 316]][i];   // 소환·회수는 펼침 단추 위, 집결은 그 왼쪽 (추출 단추 위)
    k.slot(path, { ...center, pos: p, rect_size: [100, 100] }, 56);
    s.patchComponent(`${path}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: ruid } });
    s.patch(`${path}/Icon`, { enable: true });
    b_label(s, `${path}/Label`, label, 18, "bottom-center");
    if (n === "Summon") k.badge(path);
  });
  for (const n of ["MobilePad/Attack", "MobilePad/Dash", "MobilePad/Skills", "MobilePad/BtnSkillEdit", "MobilePad/Potions", "MobilePad/Shadow"]) k.mobile(n);
  // ui_lint L013이 stretch 묶음(Potions) 아래 물약 수 글자를 화면 밖으로 잘못 계산한다 (실제 위치는 물약 칸 안, 메이커 화면 확인). 오류로 빌드를 멈추지 않게 한다
  s.write(file, { strict: false });
  // 다시 만든 패드도 경로가 같으면 예전 UUID를 유지 (메이커가 새 UUID 묶음을 다시 불러오지 못하는 경우가 있었다)
  preserveIds(file, previous);
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
    require("./ux-layout.cjs").run();
    require("./ux-feedback.cjs").run();
  });
  console.log(`  UI: GameHUD ${n}개 엔티티 · ShadowHUD 스킨·모바일 패드`);
}

module.exports = { run, patchShadowHud };
