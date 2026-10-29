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

  // (옛 미니맵·퀘스트 추적·소지품·퀘스트 창·소환수 배지는 10-29 45 1-26 A에서 지웠다 — NavigationHUD·EquipmentHUD·QuestJournalHUD·CompanionHUD가 대신한다)

  // ── 메뉴 버튼 (미니맵 왼쪽) ──
  // 메뉴 버튼은 미니맵 열(오른쪽 24~368px) 왼쪽으로 40px 띄우고, 위쪽을 지역 이름 상자 위쪽(150)에 맞춘다
  b.button("BtnMenu", "", { anchor: "top-right", pos: [-456, -150], rect_size: [96, 96], ...bg("menu_btn"), sprite_type: 1 });
  b.text("BtnMenu/Label", "메뉴", { size: 22, color: C.white, anchor: "bottom-center", pos: [0, -28], rect_size: [120, 28], ...outline, outline_width: 0.2 });
  k.badge("BtnMenu");
  // 「재 받기」 뱃지 (오픈 기념 무료 펫 · 10-27 사용자): 메뉴 단추와 같은 크기로 그 아래(이름표 28 + 간격 16). 한 번 누르면 계정에 남아 다시 안 뜬다 (PetWindow.UpdateBadge)
  // 메뉴 그림(menu_btn)은 96 칸 가운데 약 52px만 그려져 있어, 얼굴을 칸 가득 채우면 이름과의 간격이 달라 보였다 (10-27 사용자) → 투명 칸 + 가운데 56px 얼굴
  b.button("BtnJae", "", { anchor: "top-right", pos: [-456, -150 - 96 - 28 - 16], rect_size: [96, 96], bg_color: { r: 1, g: 1, b: 1, a: 0 }, sprite_type: 0, enable: false });
  k.pic("BtnJae/Icon", "pet_jae", { anchor: "middle-center", pos: [0, 0], rect_size: [56, 56], color: WHITE, alpha: 1 });
  b.patchComponent("BtnJae/Icon", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.text("BtnJae/Label", "재 받기", { size: 22, color: C.white, anchor: "bottom-center", pos: [0, -28], rect_size: [120, 28], ...outline, outline_width: 0.2 });
  k.badge("BtnJae");
  // 「일지」 뱃지 (10-27 사용자: 일지는 잘 안 읽으니 해당 행동을 하면 띄운다 — 진행 10% 단계 · 완료 · 받을 보상). 자리는 JournalBadge가 정한다
  //   (재 받기가 없으면 그 자리, 있으면 그 왼쪽). Tip = 왼쪽으로 뻗는 진행 말풍선(journalPulseSeconds초). 그림은 코덱스 jr_badge 오면 바꾼다
  b.button("BtnJournal", "", { anchor: "top-right", pos: [-456, -150 - 96 - 28 - 16], rect_size: [96, 96], bg_color: { r: 1, g: 1, b: 1, a: 0 }, sprite_type: 0, enable: false });
  k.pic("BtnJournal/Icon", "jr_badge", { anchor: "middle-center", pos: [0, 0], rect_size: [96, 96], color: WHITE, alpha: 1 });
  b.patchComponent("BtnJournal/Icon", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.text("BtnJournal/Label", "일지", { size: 22, color: C.white, anchor: "bottom-center", pos: [0, -28], rect_size: [120, 28], ...outline, outline_width: 0.2 });
  k.badge("BtnJournal");
  b.panel("BtnJournal/Tip", { anchor: "middle-left", pivot: [1, 0.5], pos: [-8, 0], rect_size: [330, 72], ...part("hud_box"), sprite_type: 1, enable: false });
  b.patchComponent("BtnJournal/Tip", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.text("BtnJournal/Tip/Name", "", { size: 20, bold: true, color: C.title, alignment: 3, anchor: "top-left", pos: [16, -6], rect_size: [300, 28], bestfit: true, min_size: 14, max_size: 20, ...outline });
  require("./lib.cjs").progressBar(b, "BtnJournal/Tip/Bar", { anchor: "bottom-left", pivot: [0, 0], pos: [16, 12], rect_size: [200, 16] });
  b.text("BtnJournal/Tip/Value", "", { size: 18, color: C.white, alignment: 5, anchor: "bottom-right", pos: [-14, 6], rect_size: [100, 26], ...outline });

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
    ["BtnQuest", K.icon_quest, "Q", "퀘스트"], ["BtnSocial", K.icon_party, "P", "파티플레이"], ["BtnRank", K.icon_rank, "L", "랭킹"], ["BtnExtract", SKILL_ICON.extract_mastery, "E", "그림자 추출"]];
  b.empty("Bottom/Menu", { anchor: "top-center", pos: [0, 92], rect_size: [MENU.length * 88, 84] });
  MENU.forEach(([n, ruid, key, label], i) => {
      const path = `Bottom/Menu/${n}`;
      b.button(path, "", { anchor: "middle-left", pos: [i * 88, 0], rect_size: [84, 84], ...bg("hud_box"), sprite_type: 1 });
      b.sprite(`${path}/Icon`, { anchor: "top-center", pos: [0, -6], rect_size: [44, 44], image_ruid: ruid, sprite_type: 0, color: iconColor(ruid), alpha: 1 });
      k.aspect(`${path}/Icon`);
      // 메뉴 이름 20 (10-29 45 1-26 A: 18 × 줄 0.85배 = 실제 약 15라 읽기 어려웠다 — HudMain.CompactMenuRow). 다섯 글자 이름만 칸에 맞춰 줄어든다
      b.text(`${path}/Label`, label, { size: 20, bold: true, color: C.gold, anchor: "bottom-center", pos: [0, 2], rect_size: [84, 26], bestfit: true, min_size: 15, max_size: 20, ...outline });
      b.text(`${path}/Key`, key, { size: 16, color: C.white, anchor: "top-right", pos: [-3, -2], rect_size: [20, 18], alignment: 2, ...outline });
      // 붉은 점: 능력치·스킬 = 남은 포인트, 그림자·추출 = 상황 안내가 가리킬 때 (GuideCoach)
      if (["BtnChar", "BtnSkill", "BtnShadow", "BtnExtract"].includes(n)) k.badge(path);
    });

  // ── 메뉴 창 (모바일·PC 공용): 모든 창을 한곳에서 ──
  k.frame("MenuWin", "middle-center", [0, 20], [800, 740], "메뉴");
  [["Inv", K.icon_bag, "소지품"], ["Char", K.icon_stats, "능력치"], ["Skill", K.icon_skill, "스킬"],
    ["Shadow", K.icon_shadow, "그림자"], ["Quest", K.icon_quest, "퀘스트"], ["Social", K.icon_party, "파티플레이"],
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
  // 펫 (PetWindow — 오픈 기념 무료 받기 · 펫 사기·고르기 · 주울 물건 고르기)
  k.ok("MenuWin/Pet", "펫", { anchor: "top-left", pos: [589, -576], rect_size: [163, 72], font_size: 20 });

  // ── 펫 창 (PetWindow · PetSystem): 위 줄 펫 칸 6 → 고른 펫 그림 · 받기/구매/함께하기 · 주울 물건 5단계 ──
  //   10-24 사용자: 능력은 모두 고양이 재와 같고 모습만 다른 펫 여러 마리 (data/pets.csv 순서 = 칸 순서)
  if (b.find("PetWin")) b.remove("PetWin");
  k.frame("PetWin", "middle-center", [0, 20], [960, 840], "펫");
  b.patchComponent("PetWin", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.05, g: 0.045, b: 0.06, a: 1 } });
  for (let i = 1; i <= 6; i++) {
    const n = `PetWin/P${i}`;
    k.slot(n, { anchor: "top-left", pos: [40 + (i - 1) * 148, -84], rect_size: [140, 150] }, 88);
    b.patch(`${n}/Icon`, { pos: [0, 18] });
    // 이름은 칸 테두리(아래 10px) 위에 — 테두리에 걸치면 글자가 반쯤 가려졌다
    b.text(`${n}/Name`, "", { size: 18, bold: true, color: C.white, anchor: "bottom-center", pos: [0, 16], rect_size: [128, 26], alignment: 4, ...outline });
    b.sprite(`${n}/Sel`, { anchor: "middle-center", pos: [0, 0], rect_size: [140, 150], ...part("slot_frame"), color: "#E6C88A", sprite_type: 1, enable: false });
    b.patchComponent(`${n}/Sel`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  }
  k.inner("PetWin/Art", "top-left", [40, -254], [260, 260]);
  b.sprite("PetWin/Art/Pic", { anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], image_ruid: K.pet_jae, sprite_type: 0, color: WHITE, alpha: 1 });
  k.aspect("PetWin/Art/Pic");
  b.text("PetWin/Status", "", { size: 22, color: C.white, alignment: 0, anchor: "top-left", pos: [330, -258], rect_size: [590, 200], ...outline });
  k.ok("PetWin/BtnGet", "무료로 받기", { anchor: "top-left", pos: [330, -462], rect_size: [300, 76], font_size: 24 });
  b.text("PetWin/FilterLabel", "주워 올 물건 (모든 펫 같음)", { size: 22, color: C.gold, alignment: 3, anchor: "top-left", pos: [44, -560], rect_size: [600, 34], ...outline });
  ["쉬기", "전부", "쓸 만한 것", "희귀 이상", "유니크·세트"].forEach((t, i) =>
    k.btn(`PetWin/F${i}`, t, { anchor: "top-left", pos: [40 + i * 178, -602], rect_size: [168, 72], font_size: 20 }));
  b.text("PetWin/FilterDesc", "", { size: 19, color: C.dim, alignment: 0, anchor: "top-left", pos: [44, -688], rect_size: [880, 110], ...outline });
  b.text("MenuWin/Help", "단축키  I 소지품 · U 능력치 · K 스킬 · H 그림자 · Q 퀘스트 · P 파티플레이 · L 랭킹 · E 추출\nA S D F·우클릭 스킬 · 1~4 벨트(칸 우클릭 = 넣을 물건 바꾸기) · Z 소환 · X 회수 · C 집결",
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
  // 10-27 개편 (docs/design/37 §3 · 디아3/4·이모탈 레퍼런스): 1140×720 두 칸
  //   왼쪽: 머리줄 · 요약 지표 3칸(내 피해 · 생존 · 소환수) · 저항 칩 4 · 세부 분류 탭 4 + 설명 칸(0인 값은 숨김, 능력치 줄을 누르면 출처)
  //   오른쪽: 능력치 4줄(값 · 장비 몫 · 1포인트당 효과 · 지금 효과 · [+]) · 추천 분배 3 · 초기화
  k.frame("CharWin", "middle-center", [0, 0], [1140, 720], "능력치");
  const TL = { anchor: "top-left", pivot: [0, 1] };
  b.text("CharWin/Head", "", { ...TL, pos: [30, -80], rect_size: [540, 34], size: 24, bold: true, color: C.qTitle, alignment: 3 });
  // 요약 아이콘: 코덱스 stat_sum_* (내 피해는 수정본 오기 전까지 고유 낫 아이콘)
  [["Sum1", K.stat_sum_dmg, "내 피해"], ["Sum2", K.stat_sum_life, "생존"], ["Sum3", K.stat_sum_minion, "소환수"]].forEach(([n, ruid, label], i) => {
    const p = `CharWin/${n}`;
    b.panel(p, { ...TL, pos: [30 + i * 184, -122], rect_size: [172, 118], color: "#17151D" });
    b.sprite(`${p}/Icon`, { ...TL, pos: [12, -12], rect_size: [44, 44], image_ruid: ruid, color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${p}/Icon`);
    b.text(`${p}/Label`, label, { ...TL, pos: [62, -20], rect_size: [104, 28], size: 19, color: "#A99F8E", alignment: 3 });
    b.text(`${p}/Value`, "", { ...TL, pos: [12, -60], rect_size: [152, 36], size: 28, bold: true, color: "#F4E2B0", alignment: 3, bestfit: true, min_size: 18, max_size: 28 });
    b.text(`${p}/Sub`, "", { ...TL, pos: [12, -94], rect_size: [152, 20], size: 15, color: "#8A8478", alignment: 3, bestfit: true, min_size: 12, max_size: 15 });
  });
  // 저항 칩: 원소 아이콘(코덱스 stat_res_*, 40px) + 값
  [["Res1", "#FF7A45", K.stat_res_fire], ["Res2", "#7AB8FF", K.stat_res_cold], ["Res3", "#FFE15A", K.stat_res_light], ["Res4", "#7CFF7A", K.stat_res_poison]].forEach(([n, color, ruid], i) => {
    const p = `CharWin/${n}`;
    b.panel(p, { ...TL, pos: [30 + i * 137, -256], rect_size: [129, 46], color: "#17151D" });
    b.sprite(`${p}/Icon`, { ...TL, pos: [4, -3], rect_size: [40, 40], image_ruid: ruid, color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${p}/Icon`);
    b.text(`${p}/Text`, "", { ...TL, pos: [44, -6], rect_size: [82, 34], size: 20, color, alignment: 3, bestfit: true, min_size: 14, max_size: 20 });
  });
  [["Tab1", "공격"], ["Tab2", "소환수"], ["Tab3", "방어"], ["Tab4", "유틸"]].forEach(([n, label], i) => {
    k.btn(`CharWin/${n}`, label, { ...TL, pos: [30 + i * 137, -318], rect_size: [129, 64], font_size: 21 });
  });
  k.inner("CharWin/Paper", "top-left", [30, -390], [540, 236], "win_content");
  b.patch("CharWin/Paper", { pivot: [0, 1], pos: [30, -390], rect_size: [540, 236] });
  // 분류 머리 띠 (코덱스 stat_group_bar, 9-slice) — 지금 보는 분류 · 능력치 이름
  b.sprite("CharWin/Paper/Head", { ...TL, pos: [10, -8], rect_size: [520, 36], image_ruid: K.stat_group_bar, color: WHITE, alpha: 1, sprite_type: 1 });
  b.text("CharWin/Paper/Head/Text", "", { anchor: "middle-left", pivot: [0, 0.5], pos: [44, 0], rect_size: [430, 30], size: 19, bold: true, color: C.qTitle, alignment: 3 });
  b.text("CharWin/Paper/Info", "", { ...TL, pos: [18, -50], rect_size: [504, 176], size: 20, color: C.white, alignment: 0, bestfit: true, min_size: 15, max_size: 20 });
  ["Str", "Ene", "Vit", "Dex"].forEach((s, i) => {
    const p = `CharWin/${s}`;
    b.panel(p, { ...TL, pos: [590, -84 - i * 112], rect_size: [520, 104], color: "#17151D" });
    // 줄을 누르면 왼쪽 설명 칸에 출처(기본 · 투자 · 장비)를 보여 준다 (Hit는 글자 뒤 투명 단추)
    b.button(`${p}/Hit`, "", { ...TL, pos: [0, 0], rect_size: [410, 104], bg_color: { r: 1, g: 1, b: 1, a: 0 }, sprite_type: 0 });
    b.text(`${p}/Name`, "", { ...TL, pos: [16, -8], rect_size: [390, 38], size: 26, bold: true, color: "#F4E2B0", alignment: 3 });
    b.text(`${p}/Per`, "", { ...TL, pos: [16, -48], rect_size: [390, 26], size: 18, color: "#A99F8E", alignment: 3, bestfit: true, min_size: 13, max_size: 18 });
    b.text(`${p}/Now`, "", { ...TL, pos: [16, -74], rect_size: [390, 26], size: 18, color: "#D8CFBC", alignment: 3, bestfit: true, min_size: 13, max_size: 18 });
    k.ok(`${p}/BtnAdd`, "+", { anchor: "middle-right", pos: [-52, 0], rect_size: [96, 96], font_size: 34 });
  });
  b.text("CharWin/Points", "", { anchor: "bottom-left", pivot: [0, 0], pos: [30, 44], rect_size: [540, 40], size: 22, color: "#F4ED83", ...outline });
  [["Auto1", "소환형 추천"], ["Auto2", "주문형 추천"], ["Auto3", "균형 추천"]].forEach(([n, label], i) => {
    k.btn(`CharWin/${n}`, label, { anchor: "bottom-left", pivot: [0, 0], pos: [590 + i * 176, 96], rect_size: [168, 60], font_size: 20 });
  });
  k.btn("CharWin/BtnReset", "초기화", { anchor: "bottom-left", pivot: [0, 0], pos: [590, 26], rect_size: [520, 56], font_size: 20 });

  // ── 스킬 창 V3 「해금 시간선 + 스킬 공방」 (10-28 피드백 F4 · 기획서 38 #24-A, 시안 assets/codex-skill-window-mock-v1/V3-pc.png) ──
  //   위 = Lv1→50 해금 시간선: 열 = 메인 스킬이 열리는 레벨(지금 23종), 열마다 그 레벨의 메인 스킬 최대 3개(트리색 테두리) · 지금 레벨 표지 · 「다음 해금」
  //   아래 = 고른 스킬의 공방: 큰 초상 · 지금/다음 · 랭크 사다리 20칸 · 배우기/스킬 칸에 넣기 · 오른쪽에 필요 랭크 열별 강화 노드(허브에서 갈래 선)
  //   탭 없음 — 트리는 테두리 색. 배치·크기(PC 23열 한 판 / 모바일 쪽 넘김)는 실행 중에 SkillWindow.LayoutTimeline이 정한다
  k.frame("SkillWin", "middle-center", [0, 20], [1400, 960], "스킬");
  for (const old of ["SkillWin/Col1", "SkillWin/Col2", "SkillWin/Col3", "SkillWin/Head1", "SkillWin/Head2", "SkillWin/Head3", "SkillWin/Grid", "SkillWin/Detail", "SkillWin/DescBox", "SkillWin/Tab1", "SkillWin/Tab2", "SkillWin/Tab3", "SkillWin/Tab4"]) if (b.find(old)) b.remove(old);
  // 판 안 여백: 9조각 테두리 24 + 12 = 36 (ui-tokens SKPANEL, 10-28 「제목이 테두리에 걸침」). 실행 중 배치 SkillWindow.mlua와 같은 숫자
  const SP = require("./ui-tokens.cjs").SKPANEL.pad;
  b.text("SkillWin/Points", "", { size: 24, color: "#F4ED83", anchor: "top-left", pos: [51, -76], rect_size: [340, 40], alignment: 3, ...outline });
  b.text("SkillWin/Legend", "", { size: 18, color: C.gold, anchor: "top-left", pos: [400, -76], rect_size: [640, 40], alignment: 4, ...outline });
  k.btn("SkillWin/BtnReset", "초기화", { anchor: "top-right", pos: [-51, -72], rect_size: [300, 48], font_size: 18 });
  // 해금 시간선 (판 356: 머리 줄 36~60 · 열 68~290 · 막대 304)
  const tl = "SkillWin/TL";
  //   그림은 코덱스 skill-window-v3 전체 제작 (10-28): 바탕판 9조각 · 칸 테두리 4상태(64/96) · 화살표 · 지금 선/표지 · 초상 · 랭크 점 · 허브·연결선 · 노드 4상태
  k.inner(tl, "top-left", [51, -128], [1298, 356], "sk_timeline_panel");
  // 판 안 머리 줄: 제목(왼쪽) · 다음 해금(오른쪽) — 예전엔 제목이 테두리 위, 다음 해금은 아래 테두리 선 위에 걸쳤다
  b.text(`${tl}/Head`, "해금 시간선", { size: 18, bold: true, color: "#E6C88A", anchor: "top-left", pos: [SP, -SP], rect_size: [160, 24], alignment: 3 });
  b.text(`${tl}/Next`, "", { size: 17, color: C.gold, anchor: "top-right", pos: [-SP, -SP], rect_size: [1298 - 2 * SP - 176, 24], alignment: 5, bestfit: true, min_size: 13, max_size: 17, ...outline });
  b.button(`${tl}/Prev`, "", { anchor: "middle-left", pos: [24, -2], rect_size: [44, 88], ...bg("sk_arrow_left_44"), sprite_type: 0 });
  b.button(`${tl}/NextPage`, "", { anchor: "middle-right", pos: [-24, -2], rect_size: [44, 88], ...bg("sk_arrow_right_44"), sprite_type: 0 });
  k.badge(`${tl}/Prev`);
  k.badge(`${tl}/NextPage`);
  for (let c = 1; c <= 26; c++) {
    const col = `${tl}/C${c}`;
    b.empty(col, { anchor: "top-left", pivot: [0, 1], pos: [44 + (c - 1) * 52, -68], rect_size: [52, 222] });
    b.text(`${col}/Lv`, "", { size: 15, color: C.dim, anchor: "top-center", pos: [0, 0], rect_size: [52, 18], alignment: 4 });
    for (let r = 1; r <= 3; r++) {
      const s = `${col}/S${r}`;
      b.button(s, "", { anchor: "top-center", pos: [0, -20 - (r - 1) * 68], rect_size: [48, 48], bg_color: { r: 0.06, g: 0.05, b: 0.08, a: 0.95 }, sprite_type: 1 });
      b.sprite(`${s}/Ring`, { anchor: "middle-center", pos: [0, 0], rect_size: [56, 56], ...part("sk_tl_node_frame_64"), sprite_type: 0 });
      b.patchComponent(`${s}/Ring`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
      b.sprite(`${s}/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [40, 40], color: WHITE, alpha: 1, sprite_type: 0 });
      k.aspect(`${s}/Icon`);
      b.patchComponent(`${s}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
      b.text(`${s}/State`, "", { size: 13, color: C.white, anchor: "bottom-center", pivot: [0.5, 1], pos: [0, -2], rect_size: [60, 16], alignment: 4, ...outline });
      k.badge(s);   // 상황 안내가 배울 스킬을 가리킨다 (GuideCoach)
    }
  }
  // 진행 막대: 열 아래 304 · 지금 선은 막대에서 열 위(68)까지 · 불꽃 표지는 막대 위에 (예전엔 판 밖 머리 줄의 범례를 덮었다)
  require("./lib.cjs").progressBar(b, `${tl}/Bar`, { anchor: "top-left", pivot: [0, 0.5], pos: [44, -304], rect_size: [1210, 16] });
  b.sprite(`${tl}/Bar/Mark`, { anchor: "middle-left", pivot: [0.5, 0.5], pos: [0, 116], rect_size: [4, 236], ...part("sk_tl_nowline"), sprite_type: 0 });
  b.sprite(`${tl}/Bar/Mark/Pin`, { anchor: "bottom-center", pivot: [0.5, 0.5], pos: [0, 2], rect_size: [28, 34], ...part("sk_tl_marker"), sprite_type: 0 });
  b.text(`${tl}/Bar/Now`, "", { size: 16, bold: true, color: "#FFE9A8", anchor: "middle-left", pivot: [0.5, 0.5], pos: [0, 0], rect_size: [80, 22], alignment: 4, ...outline });
  // 스킬 공방 (판 452: 왼쪽 = 초상·이름·설명·효과·랭크 점·배우기 단추 / 오른쪽 = 강화 노드 6열 × 3줄)
  //   두 판 그림은 위·아래에 투명 여백(시간선 아래 16 · 공방 위 21)이 있어 판 사이를 12 띄우면 눈에는 50이 빈다 → 여백끼리 겹쳐 보이는 틈 12 (메이커 캡처 10-28)
  const ws = "SkillWin/WS";
  k.inner(ws, "top-left", [51, -460], [1298, 452], "sk_workshop_panel");
  b.panel(`${ws}/Portrait`, { anchor: "top-left", pivot: [0, 1], pos: [SP, -SP], rect_size: [140, 140], color: { r: 0.03, g: 0.03, b: 0.05, a: 0.95 } });
  k.rim(`${ws}/Portrait`, "sk_portrait_frame", -6);
  b.sprite(`${ws}/Portrait/Icon`, { anchor: "middle-center", pos: [0, 0], rect_size: [104, 104], color: WHITE, alpha: 1, sprite_type: 0 });
  k.aspect(`${ws}/Portrait/Icon`);
  b.text(`${ws}/Name`, "", { size: 26, bold: true, color: C.title, anchor: "top-left", pos: [SP + 156, -SP], rect_size: [338, 32], alignment: 3, bestfit: true, min_size: 18, max_size: 26, ...outline });
  b.text(`${ws}/Info`, "", { size: 17, color: C.dim, anchor: "top-left", pos: [SP + 156, -SP - 36], rect_size: [338, 22], alignment: 3 });
  b.text(`${ws}/Desc`, "", { size: 17, color: C.gold, anchor: "top-left", pos: [SP + 156, -SP - 62], rect_size: [338, 78], alignment: 0, bestfit: true, min_size: 13, max_size: 17 });
  b.text(`${ws}/Stat`, "", { size: 17, color: "#F4ED83", anchor: "top-left", pos: [SP, -188], rect_size: [494, 60], alignment: 0, bestfit: true, min_size: 13, max_size: 17 });
  for (let i = 1; i <= 20; i++) b.sprite(`${ws}/Pip${i}`, { anchor: "top-left", pos: [SP + (i - 1) * 25, -258], rect_size: [20, 20], ...part("sk_rank_pip_empty"), sprite_type: 0 });
  b.text(`${ws}/RankNote`, "", { size: 15, color: "#8C99B4", anchor: "top-left", pos: [SP, -286], rect_size: [230, 20], alignment: 3 });
  b.text(`${ws}/Reason`, "", { size: 15, color: "#FF9A8A", anchor: "top-left", pos: [SP + 230, -286], rect_size: [264, 20], alignment: 5, bestfit: true, min_size: 12, max_size: 15 });
  // 단추 줄: 공방 판 안쪽 아래 (창 바닥 48 + 판 여백 36)
  k.ok("SkillWin/BtnLearn", "배우기", { anchor: "bottom-left", pos: [51 + SP, 48 + SP], rect_size: [240, 88], font_size: 26 });
  k.btn("SkillWin/BtnEdit", "스킬 칸에 넣기", { anchor: "bottom-left", pos: [51 + SP + 256, 48 + SP], rect_size: [240, 88], font_size: 22 });
  k.badge("SkillWin/BtnLearn");
  k.badge("SkillWin/BtnEdit");
  // 오른쪽 강화 트리: 허브 ◉ + 필요 랭크 열 머리 + 노드 8칸 (위치는 SkillWindow.RenderNodes — 열 680+104씩 · 줄 96+102씩)
  b.panel(`${ws}/Div`, { anchor: "top-left", pos: [540, -SP], rect_size: [2, 452 - 2 * SP], color: { r: 0.45, g: 0.38, b: 0.28, a: 0.6 } });
  b.text(`${ws}/TreeHead`, "스킬 강화", { size: 18, bold: true, color: "#E6C88A", anchor: "top-left", pos: [560, -SP], rect_size: [200, 24], alignment: 3 });
  b.panel(`${ws}/Spine`, { anchor: "top-left", pivot: [0.5, 1], pos: [600, -128], rect_size: [4, 204], color: "#4A3F55" });
  b.button(`${ws}/Hub`, "", { anchor: "top-left", pivot: [0.5, 0.5], pos: [600, -230], rect_size: [56, 56], image_ruid: K.sk_ws_hub, bg_color: "#FFFFFF", sprite_type: 0 });
  for (let i = 1; i <= 6; i++) b.text(`${ws}/Need${i}`, "", { size: 15, color: C.dim, anchor: "top-left", pivot: [0.5, 1], pos: [680 + (i - 1) * 104, -66], rect_size: [100, 20], alignment: 4, bestfit: true, min_size: 12, max_size: 15 });
  for (let i = 1; i <= 8; i++) {
    const n = `${ws}/N${i}`;
    b.sprite(`${ws}/L${i}`, { anchor: "top-left", pivot: [0, 0.5], pos: [600, -124], rect_size: [80, 12], ...part("sk_ws_link_dark"), sprite_type: 1 });
    b.button(n, "", { anchor: "top-left", pivot: [0.5, 1], pos: [680, -96], rect_size: [100, 100], bg_color: { r: 0, g: 0, b: 0, a: 0.25 }, sprite_type: 1 });
    b.sprite(`${n}/Ring`, { anchor: "top-center", pos: [0, 2], rect_size: [68, 68], ...part("sk_ws_node_frame_empty"), sprite_type: 0 });
    b.patchComponent(`${n}/Ring`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    b.sprite(`${n}/Icon`, { anchor: "top-center", pos: [0, -10], rect_size: [44, 44], color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${n}/Icon`);
    b.patchComponent(`${n}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    b.text(`${n}/Label`, "", { size: 14, color: C.white, anchor: "bottom-center", pos: [0, 0], rect_size: [100, 34], alignment: 4, bestfit: true, min_size: 11, max_size: 14, ...outline });
  }

  // ── 혼의 제물 3택 카드 (10-28 피드백 F4 · 기획서 38 #24-A 2차, 시안 assets/codex-skill-window-mock-v1/V4-pc.png 카드 부분) ──
  //   포인트가 생기면 HUD 띠 「혼의 제물 — 고르기」 → 카드 3장(새 스킬 · 쓰던 스킬 랭크 업 · 강화) + 다음 해금 미리보기. 컨트롤러 SkillOffer.mlua
  //   선택 보상(10-28)도 같은 창: 카드 셋을 가운데로, 아래 단추 줄 없이 창 높이를 줄인다 (SkillOffer.Layout — 높이 772 / 668)
  //   10-28 사용자 「색깔 띠 지우고 · 글이 길면 줄이거나 줄바꿈 · 버튼 개선 · 아래 빈 공간」: 카드 그림 맨 위 흰 띠를 잘라 다시 올렸고(claude-offer-card-v2),
  //   글 칸은 카드 테두리 안쪽(폭 222)에서 줄을 바꾸며, 고르기는 카드 아래 진짜 단추다
  b.button("OfferBand", "혼의 제물 — 고르기", { anchor: "bottom-center", pos: [0, 236], rect_size: [440, 72], ...bg("sk_offer_banner"), color: "#F4E2B0", font_size: 24, sprite_type: 1, enable: false });
  k.badge("OfferBand");
  k.frame("OfferWin", "middle-center", [0, 20], [1400, 772], "혼의 제물");
  for (let i = 1; i <= 3; i++) for (const old of ["Band", "Pick"]) if (b.find(`OfferWin/Card${i}/${old}`)) b.remove(`OfferWin/Card${i}/${old}`);
  b.text("OfferWin/Sub", "포인트를 바칠 곳을 고르세요", { size: 20, color: C.gold, anchor: "top-left", pos: [51, -76], rect_size: [800, 30], alignment: 3 });
  b.text("OfferWin/Left", "", { size: 22, bold: true, color: "#F4ED83", anchor: "top-right", pos: [-51, -76], rect_size: [300, 30], alignment: 5, ...outline });
  // 카드 340×404 (그림 360×428을 같은 비율로) · 사이 16 · 첫 카드 74 (오른쪽 미리보기까지 좌우 여백이 같게)
  const CARD = { w: 340, h: 404, step: 356, x0: 74, top: -116, text: 222 };
  for (let i = 1; i <= 3; i++) {
    const c = `OfferWin/Card${i}`;
    const x = CARD.x0 + (i - 1) * CARD.step;
    // 카드 그림 3종(새 스킬·랭크 업·강화)은 SkillOffer.Render가 종류마다 바꿔 낀다 (코덱스 skill-window-v3, 흰 띠 자른 판)
    b.button(c, "", { anchor: "top-left", pos: [x, CARD.top], rect_size: [CARD.w, CARD.h], ...bg("sk_offer_card_new"), sprite_type: 0 });
    // 글은 카드 안쪽 어두운 칸(테두리 안 40~350)에만
    b.text(`${c}/Kind`, "", { size: 20, bold: true, color: "#F0D9A0", anchor: "top-center", pos: [0, -50], rect_size: [CARD.text, 26], alignment: 4, bestfit: true, min_size: 14, max_size: 20, ...outline });
    b.sprite(`${c}/Icon`, { anchor: "top-center", pos: [0, -82], rect_size: [88, 88], color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${c}/Icon`);
    b.patchComponent(`${c}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    b.text(`${c}/Name`, "", { size: 24, bold: true, color: C.title, anchor: "top-center", pos: [0, -176], rect_size: [CARD.text, 30], alignment: 4, bestfit: true, min_size: 16, max_size: 24, ...outline });
    b.text(`${c}/Effect`, "", { size: 17, color: C.gold, anchor: "top-center", pos: [0, -212], rect_size: [CARD.text, 78], alignment: 1, bestfit: true, min_size: 13, max_size: 17 });
    b.text(`${c}/Change`, "", { size: 16, color: "#7CFF7A", anchor: "top-center", pos: [0, -294], rect_size: [CARD.text, 46], alignment: 1, bestfit: true, min_size: 12, max_size: 16 });
    // 고르기 단추: 카드 바로 아래 (카드를 눌러도 같다)
    k.ok(`OfferWin/Pick${i}`, "이 카드로", { anchor: "top-left", pos: [x + 20, CARD.top - CARD.h - 12], rect_size: [300, 88], font_size: 24 });
  }
  b.sprite("OfferWin/Preview", { anchor: "top-left", pos: [CARD.x0 + 3 * CARD.step, CARD.top], rect_size: [184, CARD.h], ...part("sk_offer_card_preview"), sprite_type: 0 });
  //   미리보기 판은 위 장식이 40까지 내려온다 → 머리 글은 그 아래 (10-28 캡처: 장식에 걸침)
  b.text("OfferWin/Preview/Head", "다음 해금", { size: 20, bold: true, color: C.dim, anchor: "top-center", pos: [0, -48], rect_size: [150, 28], alignment: 4 });
  b.sprite("OfferWin/Preview/Icon", { anchor: "top-center", pos: [0, -86], rect_size: [80, 80], color: { r: 1, g: 1, b: 1, a: 0.45 }, sprite_type: 0 });
  k.aspect("OfferWin/Preview/Icon");
  b.text("OfferWin/Preview/Body", "", { size: 17, color: C.dim, anchor: "top-center", pos: [0, -180], rect_size: [150, 190], alignment: 1, bestfit: true, min_size: 13, max_size: 17 });
  // 고른 카드 위 반짝임 6프레임 (코덱스 sk-offer-pick-01~06 · 80ms씩, SkillOffer.Flash)
  b.sprite("OfferWin/Flash", { anchor: "top-left", pivot: [0.5, 0.5], pos: [0, 0], rect_size: [380, 444], ...part("sk_offer_pick_01"), sprite_type: 0, enable: false });
  b.patchComponent("OfferWin/Flash", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  k.btn("OfferWin/BtnReroll", "다시 섞기", { anchor: "bottom-left", pos: [51, 48], rect_size: [320, 88], font_size: 22 });
  k.btn("OfferWin/BtnBoard", "보드에서 직접 고르기 (K)", { anchor: "bottom-right", pos: [-51, 48], rect_size: [420, 88], font_size: 22 });

  // ── 노말 끝 「다음 난이도 미리보기」 카드 1장 (기획서 43 ④-a · 결정 7, 10-29) — 컨트롤러 Progress/NightmarePreview.mlua ──
  //   혼의 제물·선택 보상 카드(위 OfferWin)와 같은 양식: 창 틀 + 카드 그림(sk_offer_card_new) 한 장 + 오른쪽 목록 + 확인 단추. 글귀는 10-29 사용자 확정
  //   카드 안 Art = 그림 자리 (코덱스 「문 아래 붉은 틈」이 오면 ui_icons preview_nightmare로 NightmarePreview가 바꿔 낀다)
  k.frame("PreviewWin", "middle-center", [0, 20], [1100, 640], "다음 난이도");
  b.text("PreviewWin/Sub", "", { size: 20, color: C.gold, anchor: "top-left", pos: [51, -76], rect_size: [1000, 30], alignment: 3 });
  b.sprite("PreviewWin/Card", { anchor: "top-left", pos: [60, -116], rect_size: [CARD.w, CARD.h], ...part("sk_offer_card_new"), sprite_type: 0 });
  b.text("PreviewWin/Card/Kind", "", { size: 20, bold: true, color: "#F0D9A0", anchor: "top-center", pos: [0, -50], rect_size: [CARD.text, 26], alignment: 4, ...outline });
  b.sprite("PreviewWin/Card/Art", { anchor: "top-center", pos: [0, -84], rect_size: [CARD.text, 200], color: { r: 0.32, g: 0.08, b: 0.1, a: 1 }, sprite_type: 0 });
  b.patchComponent("PreviewWin/Card/Art", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  // 그림이 오기 전에는 빈 틀만 (10-29 45 §2-7: 「그림 자리」 글자가 화면에 보였다)
  b.text("PreviewWin/Card/Name", "", { size: 22, bold: true, color: C.title, anchor: "top-center", pos: [0, -296], rect_size: [CARD.text, 30], alignment: 4, bestfit: true, min_size: 16, max_size: 22, ...outline });
  // 목록 칸을 줄이고 아래 줄(해금 조건 · 「웨이포인트에서 …」)은 목록 밑 오른쪽 칸으로 (10-29: 카드 틀 아래 장식과 글이 겹쳤다)
  k.inner("PreviewWin/List", "top-left", [430, -116], [610, 340]);
  b.text("PreviewWin/List/Body", "", { size: 22, color: C.gold, alignment: 0, anchor: "top-left", pos: [24, -22], rect_size: [562, 296], bestfit: true, min_size: 16, max_size: 22 });
  b.text("PreviewWin/Foot", "", { size: 18, color: C.dim, anchor: "top-left", pivot: [0, 1], pos: [434, -470], rect_size: [606, 44], alignment: 3, bestfit: true, min_size: 14, max_size: 18 });
  k.ok("PreviewWin/BtnOk", "확인", { anchor: "bottom-center", pos: [0, 28], rect_size: [300, 88], font_size: 24 });

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

  // 머리 위 콤보 (10-28 사용자: 「30마리 처치 판은 촌스럽다 — 메이플처럼 캐릭터 머리 위에 숫자로」): 「COMBO 12」 — HudMain이 머리 위로 옮기고
  //   처치마다 툭 커졌다 줄어든다. 10·25·50·100에서 색이 짙어지고, 끊기면 흐려지며 사라진다 (HudMain.RenderStreak · RenderCombo)
  //   PC 「줍기」 단추는 뺐다(10-28 사용자 「번잡」) — G 키 · 클릭 줍기 · 줍기 커서로 (ClickControl)
  b.text("ComboHead", "", { size: 46, bold: true, color: "#FFFFFF", anchor: "middle-center", pos: [0, 0], rect_size: [420, 70], alignment: 4, ...outline, outline_width: 0.3, enable: false });
  // 뼈 의식 충전 고리 (기획서 43 §3-1 · 10-29 결정 1A): 의식 칸을 누르고 있는 동안 머리 위에 — 둥근 바탕 + 위에서 시계 방향으로 차는 고리(쿨다운 덮개와 같은 Radial360 양식)
  //   + 가운데 단계 숫자(1·2·3·5) + 아래 단계 이름 + 2·3·5기 눈금 점. HudMain.RenderRite가 머리 위로 옮기고 채움·색·눈금을 그린다.
  //   임시 그림(원형 바탕 · 미니맵 점) — 코덱스 「충전 고리 3단」이 오면 Back/Fill만 바꾼다
  b.empty("RiteRing", { anchor: "middle-center", pos: [0, 0], rect_size: [120, 150], enable: false });
  b.sprite("RiteRing/Back", { anchor: "middle-center", pos: [0, 12], rect_size: [96, 96], image_ruid: K.circle, color: "#140F18", alpha: 0.78, sprite_type: 0 });
  b.sprite("RiteRing/Fill", { anchor: "middle-center", pos: [0, 12], rect_size: [96, 96], image_ruid: K.circle, color: "#D8CDB4", alpha: 0.95, sprite_type: 3, fill_method: 4 });
  b.patchComponent("RiteRing/Fill", "MOD.Core.SpriteGUIRendererComponent", { FillOrigin: 2, FillAmount: 0, RaycastTarget: false });
  b.sprite("RiteRing/Hole", { anchor: "middle-center", pos: [0, 12], rect_size: [70, 70], image_ruid: K.circle, color: "#140F18", alpha: 0.92, sprite_type: 0 });
  for (const t of ["T2", "T3", "T5"]) b.sprite(`RiteRing/${t}`, { anchor: "middle-center", pos: [0, 12], rect_size: [12, 12], image_ruid: K.dot, color: "#6E6658", alpha: 1, sprite_type: 0 });
  b.text("RiteRing/Count", "", { size: 34, bold: true, color: "#FFFFFF", anchor: "middle-center", pos: [0, 12], rect_size: [70, 50], alignment: 4, ...outline, outline_width: 0.25 });
  b.text("RiteRing/Label", "", { size: 22, bold: true, color: "#F6E3B0", anchor: "middle-center", pos: [0, -56], rect_size: [260, 34], alignment: 4, ...outline, outline_width: 0.25 });
  // 혼 추출: 손 닿는 혼 위에 「E 추출 45%」, 결과는 혼 자리에서 떠오르는 글자 (HudMain이 화면 좌표로 옮긴다)
  b.text("SoulHint", "", { size: 24, bold: true, color: "#D9B8FF", anchor: "middle-center", pos: [0, 0], rect_size: [360, 84], ...outline, enable: false });
  // 머리 위 경고 (지금 한 행동이 안 된 이유: 마나 부족·혼이 멀다·이미 마을 — HudMain.ShowWarn, docs/ui/message-rules.md)
  b.text("WarnPop", "", { size: 24, bold: true, color: "#FFB45A", anchor: "middle-center", pos: [0, 0], rect_size: [560, 40], ...outline, outline_width: 0.25, enable: false });
  b.text("ExtractPop", "", { size: 30, bold: true, color: "#D9B8FF", anchor: "middle-center", pos: [0, 0], rect_size: [520, 84], ...outline, outline_width: 0.25, enable: false });
  // 습격 예고 (기획서 41 #7-A · 글귀 「습격이 온다」): 가운데 위 글귀 3초 + 떼가 솟을 자리마다 화면 가장자리 표식 최대 8 (HudMain.RaidWarn · RenderRaid)
  //   10-29 코덱스 표식 ui_raid_edge_mark_1~3(오른쪽을 가리키는 붉은 발톱 96px) 64칸(사용자 결정 48→64) — RenderRaid가 자리 방향으로 8방향 돌리고 1 나타남 → 2 긁음 → 3 흩어짐으로 바꾼다
  b.text("RaidText", "", { size: 34, bold: true, color: "#FF7A5A", anchor: "middle-center", pos: [0, 250], rect_size: [600, 50], alignment: 4, ...outline, outline_width: 0.3, enable: false });
  for (let i = 1; i <= 8; i++) b.sprite(`RaidMark${i}`, { anchor: "middle-center", pos: [0, 0], rect_size: [64, 64], image_ruid: K.ui_raid_edge_mark_2, sprite_type: 0, color: WHITE, alpha: 1, enable: false });
  // 습격 격퇴 판 (10-29 코덱스 ui_raid_repelled_plate 9조각 64/64/24/24): 「습격 격퇴 · N마리」 + 골드 주머니 안내 — 알림 띠(UXFeedback)와 같은 글자 양식, 바탕만 판.
  //   예고 글귀 자리(가운데 위)에 4초 뒤 흐려지며 사라진다 (HudMain.RaidDefeated · RenderRaidPlate)
  b.sprite("RaidPlate", { anchor: "middle-center", pos: [0, 250], rect_size: [760, 136], ...part("ui_raid_repelled_plate"), sprite_type: 1, enable: false });
  b.upsertComponent("RaidPlate", "MOD.Core.CanvasGroupComponent", { GroupAlpha: 1, BlocksRaycasts: false, Interactable: false });
  b.text("RaidPlate/Title", "", { size: 30, bold: true, color: C.qTitle, anchor: "middle-center", pos: [0, 18], rect_size: [600, 40], alignment: 4, ...outline, outline_width: 0.2 });
  b.text("RaidPlate/Body", "", { size: 22, color: "#DDD4C3", anchor: "middle-center", pos: [0, -22], rect_size: [600, 32], alignment: 4, bestfit: true, min_size: 16, max_size: 22, ...outline, outline_width: 0.15 });

  // 출구 가까이 가면 화면 가운데 아래 안내 (어디로 가는지 + 들어서면 이동)
  b.panel("GatePrompt", { anchor: "bottom-center", pos: [0, 330], rect_size: [760, 60], ...part("hud_box"), sprite_type: 1, enable: false });
  b.text("GatePrompt/Text", "", { size: 24, bold: true, color: "#9ED0FF", anchor: "middle-center", pos: [0, 0], rect_size: [740, 56], ...outline });

  // ── 버프·디버프 줄 (10-11 팀 QA: 신전 축복만 위쪽 글자로 보이고 둔화·저주는 안 보였다) ──
  // 둥근 칩 최대 8개: 그림(코덱스 buff_*) 또는 색 원 + 짧은 이름 + 남은 초 (HudMain.RenderBuffs)
  // 10-24 사용자: PC는 생명 오브(바닥 28 + 180) 바로 위, 마우스를 올리면 설명 상자(Tip). 모바일은 MobileLayout이 왼쪽 위로 옮기고 누르면 설명
  b.empty("Buffs", { anchor: "bottom-left", pos: [20, 214], rect_size: [8 * 64, 60] });
  for (let i = 1; i <= 8; i++) {
    const path = `Buffs/B${i}`;
    b.button(path, "", { anchor: "middle-left", pos: [(i - 1) * 64, 0], rect_size: [56, 56], image_ruid: K.circle, bg_color: "#FFFFFF", sprite_type: 0, enable: false });
    b.text(`${path}/Label`, "", { size: 15, bold: true, anchor: "middle-center", pos: [0, 7], rect_size: [56, 22], bestfit: true, min_size: 11, max_size: 15, ...outline });
    b.text(`${path}/Time`, "", { size: 13, anchor: "middle-center", pos: [0, -12], rect_size: [56, 18], ...outline });
    // 디버프 칩 위에 코덱스 붉은 테두리 (debuff_frame, 가운데 투명). 버프와 한눈에 갈린다
    b.sprite(`${path}/Frame`, { anchor: "middle-center", pos: [0, 0], rect_size: [56, 56], image_ruid: K.debuff_frame, color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    // 오오라 칩 위에 등급 테두리 (aura_tier1~3 옅은·짙은·극한, 가운데 투명 — 코덱스 10-24)
    b.sprite(`${path}/Tier`, { anchor: "middle-center", pos: [0, 0], rect_size: [56, 56], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    b.patchComponent(`${path}/Tier`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  }
  // 마우스를 올린 칩의 설명 (칩 줄 바로 위, x는 실행 중에 그 칩에 맞춘다)
  b.panel("Buffs/Tip", { anchor: "bottom-left", pos: [0, 64], rect_size: [440, 84], ...part("hud_box"), sprite_type: 1, enable: false });
  b.patchComponent("Buffs/Tip", "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.text("Buffs/Tip/Text", "", { size: 17, color: C.white, alignment: 3, anchor: "middle-center", pos: [0, 0], rect_size: [412, 76], bestfit: true, min_size: 12, max_size: 17 });

  // ── 파티플레이 창 (P): 파티 초대 / 결투 / 거래 / 살펴보기(10-24), 파티 탈퇴 ──
  k.frame("SocialWin", "middle-center", [0, 60], [800, 660], "파티플레이");
  for (let i = 1; i <= 8; i++) {
    const y = -88 - (i - 1) * 62;
    b.text(`SocialWin/Name${i}`, "", { size: 19, color: C.gold, alignment: 3, anchor: "top-left", pos: [40, y], rect_size: [262, 54], bestfit: true, min_size: 13, max_size: 19, ...outline });
    k.btn(`SocialWin/Party${i}`, "파티", { anchor: "top-left", pos: [310, y], rect_size: [104, 54], font_size: 17 });
    k.btn(`SocialWin/Duel${i}`, "결투", { anchor: "top-left", pos: [418, y], rect_size: [104, 54], font_size: 17 });
    k.btn(`SocialWin/Trade${i}`, "거래", { anchor: "top-left", pos: [526, y], rect_size: [104, 54], font_size: 17 });
    k.btn(`SocialWin/Inspect${i}`, "살펴보기", { anchor: "top-left", pos: [634, y], rect_size: [128, 54], font_size: 17 });
  }
  k.btn("SocialWin/BtnLeave", "파티 탈퇴", { anchor: "bottom-left", pos: [40, 22], rect_size: [200, 62], font_size: 19 });
  // 살펴보기 판: 같은 창 위에 덮는다 — 왼쪽 능력치·스킬, 오른쪽 착용 장비 (SocialWindow.OnInspect)
  b.panel("SocialWin/Inspect", { anchor: "top-left", pos: [24, -76], rect_size: [752, 560], color: { r: 0.05, g: 0.045, b: 0.06, a: 1 }, raycast: true, enable: false });
  b.text("SocialWin/Inspect/Title", "", { size: 22, bold: true, color: C.title, alignment: 3, anchor: "top-left", pos: [16, -10], rect_size: [560, 32], ...outline });
  b.text("SocialWin/Inspect/Stats", "", { size: 15, color: C.gold, alignment: 0, anchor: "top-left", pos: [16, -50], rect_size: [300, 500], bestfit: true, min_size: 11, max_size: 15 });
  b.text("SocialWin/Inspect/Gear", "", { size: 15, color: C.white, alignment: 0, anchor: "top-left", pos: [328, -50], rect_size: [410, 500], bestfit: true, min_size: 10, max_size: 15 });
  k.btn("SocialWin/Inspect/BtnBack", "돌아가기", { anchor: "top-right", pos: [-12, -6], rect_size: [150, 44], font_size: 17 });

  // ── 받은 요청 (수락/거절) → ConfirmHUD/SafeArea/Request (tools/build/confirm.cjs) ──
  //   10-29 45 §2-6 #6: GameHUD 안에 있으면 창(SetSiblingIndex 맨 위)·다른 그룹 창 뒤에 깔려 요청을 못 봤다 → 확인 창 층으로 옮김

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
  // 10-28: 액트마다 웨이포인트 6 → 8곳(보스 바로 앞 층 +5) — 줄 간격 56 → 48로 8줄이 난이도 단추 위에 들어간다
  for (let i = 1; i <= 8; i++) {
    const n = `WpWin/Wp${i}`;
    k.btn(n, "", { anchor: "top-left", pos: [40, -186 - (i - 1) * 48], rect_size: [520, 46], font_size: 20 });
    k.pic(`${n}/Icon`, "icon_waypoint", { anchor: "middle-left", pos: [10, 0], rect_size: [34, 34] });
  }
  b.text("WpWin/DiffTitle", "난이도", { size: 19, color: C.gold, anchor: "bottom-center", pos: [0, 100], rect_size: [500, 28], ...outline });
  [["Diff0", "보통", -180], ["Diff1", "악몽", 0], ["Diff2", "지옥", 180]].forEach(([n, t, x]) => {
    k.btn(`WpWin/${n}`, t, { anchor: "bottom-center", pos: [x, 26], rect_size: [170, 64], font_size: 20 });
  });
  // 잠긴 난이도 단추 말풍선 (PC 마우스 올림 · 기획서 43 결정 7): 해금 조건은 WaypointWindow.OnDiffHover → NightmarePreview.UnlockConditionText
  b.panel("WpWin/DiffTip", { anchor: "bottom-center", pivot: [0.5, 0], pos: [0, 100], rect_size: [520, 104], color: { r: 0.05, g: 0.045, b: 0.06, a: 0.97 }, sprite_type: 1, enable: false });
  k.rim("WpWin/DiffTip", "slot_frame");
  b.text("WpWin/DiffTip/Text", "", { size: 19, color: C.gold, anchor: "middle-center", pos: [0, 0], rect_size: [488, 88], alignment: 4, bestfit: true, min_size: 14, max_size: 19, ...outline });

  // ── 랭킹 창 ──
  k.frame("RankWin", "middle-center", [0, 60], [640, 660], "랭킹");
  // 10-20 B안: 「이번 주 심연」 탭 (주간 규칙 + 주마다 새 기록판) · 10-24 「성장 순위」 탭 (레벨 + 가장 멀리 간 난이도·액트) — 탭 넷.
  // 심연을 숨긴 동안(config depthEnabled 0) 심연 두 탭은 RankWindow가 끈다 → 앞 두 칸(성장·보스)만 보인다
  [["TabProgress", "성장 순위", -228], ["TabQueen", "묘지기 여왕 처치 시간", -76], ["TabDepth", "심연 최고 층", 76], ["TabWeek", "이번 주 심연", 228]].forEach(([n, t, x]) => {
    k.btn(`RankWin/${n}`, t, { anchor: "top-center", pos: [x, -86], rect_size: [148, 56], font_size: 16 });
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
  // 10-27 사용자: 글 나열 → 줄마다 룬 그림 · 가진 표시 · 「만들 수 있음」. 룬워드 5줄 · 룬 8줄씩 쪽 넘김 (RuneWindow)
  k.inner("RuneWin/Paper", "top-center", [0, -162], [900, 504], "win_content");
  if (b.find("RuneWin/Paper/List")) b.remove("RuneWin/Paper/List");
  if (b.find("RuneWin/Paper/Scroll")) b.remove("RuneWin/Paper/Scroll");
  b.text("RuneWin/Hint", "", { size: 17, color: "#9C9488", anchor: "top-center", pos: [0, -128], rect_size: [880, 30], alignment: 4, bestfit: true, min_size: 13, max_size: 17 });
  // 10-27 사용자: 「옵션이랑 룬이 너무 붙어 있다」 → 한 쪽 4줄 · 줄 높이 96 → 120, 세 띠로 나눔: 이름·부위(10~40) · 룬(46~80) · 효과(88~112)
  if (b.find("RuneWin/Paper/W5")) b.remove("RuneWin/Paper/W5");
  for (let i = 1; i <= 4; i++) {
    const n = `RuneWin/Paper/W${i}`;
    b.panel(n, { anchor: "top-left", pos: [10, -6 - (i - 1) * 124], rect_size: [880, 120], color: "#17151D", enable: false });
    b.text(`${n}/Name`, "", { size: 22, bold: true, color: "#E6C88A", alignment: 3, anchor: "top-left", pos: [16, -10], rect_size: [330, 30], bestfit: true, min_size: 16, max_size: 22 });
    b.text(`${n}/Info`, "", { size: 17, color: "#A99F8E", alignment: 3, anchor: "top-left", pos: [350, -12], rect_size: [330, 26], bestfit: true, min_size: 13, max_size: 17 });
    b.text(`${n}/Ready`, "", { size: 18, bold: true, color: "#7CD67C", alignment: 5, anchor: "top-right", pos: [-16, -11], rect_size: [180, 28] });
    for (let r = 1; r <= 6; r++) {
      b.sprite(`${n}/R${r}`, { anchor: "top-left", pos: [36 + (r - 1) * 140, -46], rect_size: [34, 34], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
      k.aspect(`${n}/R${r}`);
      b.text(`${n}/R${r}/Name`, "", { size: 18, color: "#F4E2B0", alignment: 3, anchor: "middle-right", pivot: [0, 0.5], pos: [8, 0], rect_size: [92, 30], bestfit: true, min_size: 12, max_size: 18 });
    }
    b.text(`${n}/Mods`, "", { size: 17, color: "#8FB4FF", alignment: 3, anchor: "bottom-left", pos: [16, 8], rect_size: [848, 24], bestfit: true, min_size: 12, max_size: 17 });
  }
  for (let i = 1; i <= 8; i++) {
    const n = `RuneWin/Paper/U${i}`;
    b.panel(n, { anchor: "top-left", pos: [10, -6 - (i - 1) * 62], rect_size: [880, 58], color: "#17151D", enable: false });
    b.sprite(`${n}/Icon`, { anchor: "middle-left", pos: [36, 0], rect_size: [46, 46], color: WHITE, alpha: 1, sprite_type: 0 });
    k.aspect(`${n}/Icon`);
    b.text(`${n}/Name`, "", { size: 20, bold: true, color: "#F4E2B0", alignment: 3, anchor: "top-left", pos: [72, -2], rect_size: [560, 28] });
    b.text(`${n}/Own`, "", { size: 18, color: "#7CD67C", alignment: 5, anchor: "top-right", pos: [-14, -3], rect_size: [200, 26] });
    b.text(`${n}/Mods`, "", { size: 16, color: "#B9B0A1", alignment: 3, anchor: "bottom-left", pos: [72, 2], rect_size: [796, 24], bestfit: true, min_size: 12, max_size: 16 });
  }
  k.btn("RuneWin/BtnPrev", "◀", { anchor: "bottom-left", pos: [100, 48], rect_size: [120, 56], font_size: 20 });
  k.btn("RuneWin/BtnNext", "▶", { anchor: "bottom-right", pos: [-100, 48], rect_size: [120, 56], font_size: 20 });
  b.text("RuneWin/Page", "", { size: 20, color: "#B9B0A1", anchor: "bottom-center", pos: [0, 48], rect_size: [200, 40], alignment: 4 });

  // ── 게임 안내 (메뉴 「게임 안내」 · 첫 진입 때 책갈피 1~4 · 상황 카드): docs/design/35 (10-27 사용자 B안) ──
  //   왼쪽 책갈피 7 (T1~T7: 그림 + 이름 + 안 본 표시) · 오른쪽 16:9 화면(Media/Shot = 움짤 animationclip 또는 캡처, 없으면 Media/Empty)
  //   + 제목 · 설명 · 쪽 점(D1~D6) · 이전/다음 · 상황 카드의 「자세히 보기」(BtnMore). 내용은 GuideWindow.mlua BuildTabs
  {
    const T = require("./ui-tokens.cjs");
    const W = 1560, H = 920, tabW = 300, mediaW = 864, mediaH = 486;
    const rx = T.FRAME.padX + tabW + T.FRAME.gap;              // 오른쪽 칸 왼쪽 (창 왼쪽에서)
    const rw = W - rx - T.FRAME.padX;                           // 오른쪽 칸 폭
    const top = T.FRAME.contentTop;
    k.frame("GuideWin", "middle-center", [0, 0], [W, H], "게임 안내");
    // 바탕을 꽉 채운 그림으로 (기본 바탕 그림은 가운데가 비쳐 글만 있는 쪽에서 뒤 화면이 보였다 — 10-27 메이커)
    b.patchComponent("GuideWin", "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: K.gauge_fill }, Type: 0, Color: { r: 0.045, g: 0.04, b: 0.055, a: 1 } });
    k.inner("GuideWin/Tabs", "top-left", [T.FRAME.padX, -top], [tabW, H - top - T.FRAME.padBottom], "win_content");
    // 책갈피 그림: 코덱스 guide_* (10-27 샘플 군단부터, 나머지는 받을 때까지 메뉴 아이콘), 칸은 guide_tab(고르면 GuideWindow가 guide_tab_on으로)
    const tabIcon = ["icon_scroll", "guide_legion", "icon_skill", "icon_bag", "icon_waypoint", "icon_party", "icon_sword"];
    tabIcon.forEach((key, i) => {
      const n = `GuideWin/Tabs/T${i + 1}`;
      b.button(n, "", { anchor: "top-left", pos: [16, -16 - i * 96], rect_size: [tabW - 32, T.BUTTON.h], ...bg("guide_tab"), sprite_type: 1 });
      // 안쪽 칸(장식 사이)을 아이콘 + 이름 칸으로 나누고 이름은 가운데 정렬 → 4글자 기준 무리가 칸 가운데에 온다 (T.TAB)
      const inner = tabW - 32 - T.TAB.artLeft - T.TAB.artRight;
      const iconX = T.TAB.artLeft + T.TAB.gap;
      const labelX = iconX + T.TAB.icon + T.TAB.gap;
      const labelW = T.TAB.artLeft + inner - labelX;
      k.pic(`${n}/Icon`, key, { anchor: "middle-left", pos: [iconX, 0], rect_size: [T.TAB.icon, T.TAB.icon], color: WHITE, alpha: 1 });
      b.patchComponent(`${n}/Icon`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
      b.text(`${n}/Label`, "", { size: T.TAB.font, bold: true, color: C.gold, alignment: 4, anchor: "middle-left", pos: [labelX, 0], rect_size: [labelW, 44], bestfit: true, min_size: T.TAB.minFont, max_size: T.TAB.font, ...outline });
      k.badge(n);
    });
    b.text("GuideWin/Tabs/Hint", "게임 안내는 메뉴에서\n다시 볼 수 있습니다", { size: 17, color: C.dim, anchor: "bottom-center", pos: [0, 20], rect_size: [tabW - 32, 56] });
    // 화면 칸: 검은 바탕 + 그림(꺼짐, 쪽에 그림이 있을 때 켠다) + 준비 중 글 + 칸 테두리
    b.panel("GuideWin/Media", { anchor: "top-left", pos: [rx + (rw - mediaW) / 2, -top], rect_size: [mediaW, mediaH], color: { r: 0.02, g: 0.02, b: 0.03, a: 1 }, sprite_type: 1 });
    b.sprite("GuideWin/Media/Shot", { anchor: "middle-center", pos: [0, 0], rect_size: [mediaW - 8, mediaH - 8], color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    k.aspect("GuideWin/Media/Shot");
    // 안내 영상 (유튜브 일부 공개 1편 · 10-27): 쪽마다 그 장면 초로 Jump하고 길이만큼 되풀이 (GuideWindow). 실행 중 AddComponent로는 화면이 안 나와 파일에 미리 둔다 (docs/design/35 §8)
    b.empty("GuideWin/Media/Video", { anchor: "middle-center", pos: [0, 0], rect_size: [mediaW - 8, mediaH - 8], enable: false });
    b.addComponent("GuideWin/Media/Video", "MOD.Core.RawImageGUIRendererComponent", { "@type": "MOD.Core.RawImageGUIRendererComponent", Enable: true, MaterialId: "" });
    b.addComponent("GuideWin/Media/Video", "MOD.Core.YoutubePlayerGUIComponent", { "@type": "MOD.Core.YoutubePlayerGUIComponent", Enable: true, Urls: ["https://www.youtube.com/watch?v=frX4-7REhRw"], Loop: true, PlayOnAwake: false, Shuffle: false, Volume: 0, PlaySpeed: 1 });
    // 10-27 A안 (GuideWindow.KeepPlayer): 재생기를 창이 열려 있는 동안 살려 두고 영상 없는 쪽에서는 투명하게 숨긴다 (Media · Video 투명도)
    b.upsertComponent("GuideWin/Media", "MOD.Core.CanvasGroupComponent", { GroupAlpha: 1, BlocksRaycasts: false, Interactable: false });
    b.upsertComponent("GuideWin/Media/Video", "MOD.Core.CanvasGroupComponent", { GroupAlpha: 1, BlocksRaycasts: false, Interactable: false });
    // 재생기를 새로 불러오는 동안 하얀 화면이 비쳤다 (10-27 첫 유저 녹화) → 영상 위 가림 그림 = 안내 영상 인트로 고정 그림 (글 없음 · 10-27 사용자). GuideWindow가 불러오는 동안만 켠다
    b.sprite("GuideWin/Media/Cover", { anchor: "middle-center", pos: [0, 0], rect_size: [mediaW - 8, mediaH - 8], image_ruid: K.guide_video_cover, color: WHITE, alpha: 1, sprite_type: 0, enable: false });
    if (b.find("GuideWin/Media/Cover/Text")) b.remove("GuideWin/Media/Cover/Text");
    b.text("GuideWin/Media/Empty", "", { size: 22, color: C.dim, anchor: "middle-center", pos: [0, 0], rect_size: [mediaW - 40, 60] });
    k.rim("GuideWin/Media", "slot_frame");
    const headY = top + mediaH + 12;
    b.text("GuideWin/Head", "", { size: 30, bold: true, color: C.title, alignment: 0, anchor: "top-left", pos: [rx, -headY], rect_size: [rw, 44], ...outline });
    b.text("GuideWin/Body", "", { size: 22, color: C.white, alignment: 0, anchor: "top-left", pos: [rx, -(headY + 50)], rect_size: [rw, 150], bestfit: true, min_size: 15, max_size: 22 });
    // 아래 줄: 이전 · 쪽 점 · (자세히 보기) · 다음
    const by = T.FRAME.buttonBottom;
    k.btn("GuideWin/BtnPrev", "이전", { anchor: "bottom-left", pos: [rx, by], rect_size: [220, T.BUTTON.h] });
    k.ok("GuideWin/BtnNext", "다음", { anchor: "bottom-right", pos: [-T.FRAME.padX, by], rect_size: [220, T.BUTTON.h] });
    k.btn("GuideWin/BtnMore", "자세히 보기", { anchor: "bottom-right", pos: [-(T.FRAME.padX + 220 + T.FRAME.gap), by], rect_size: [220, T.BUTTON.h], enable: false });
    // 「나중에 보기」 (기획서 39 결정 #2B, 10-29): 첫 진입 둘러보기 첫 쪽에만 — 첫 쪽엔 「이전」이 꺼져 있어 그 자리에 둔다. 다시 보기는 메뉴 「게임 안내」. 글귀 승인 전
    k.btn("GuideWin/BtnLater", "나중에 보기", { anchor: "bottom-left", pos: [rx, by], rect_size: [220, T.BUTTON.h], enable: false });
    const dotX = rx + rw / 2 - W / 2;                          // 오른쪽 칸 가운데 (창 가운데 기준)
    for (let i = 1; i <= 6; i++) {
      b.sprite(`GuideWin/D${i}`, { anchor: "bottom-center", pivot: [0.5, 0.5], pos: [dotX + (i - 3.5) * 30, by + T.BUTTON.h / 2], rect_size: [16, 16], image_ruid: K.dot, sprite_type: 0, color: WHITE, alpha: 1 });
      b.patchComponent(`GuideWin/D${i}`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    }
  }

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
    // 소환 지정 번호 배지 (10-29 글귀 확정 79: 줄 글의 「[지정 N]」을 칸 왼쪽 위 모서리로 — 초상 위에 겹친다). ShadowHUD.RenderRows가 켜고 끈다
    s.panel(`${row}/Assign`, { anchor: "top-left", pivot: [0, 1], pos: [4, -4], rect_size: [30, 30], color: "#FFD27A", alpha: 1, sprite_type: 1, enable: false });
    s.patchComponent(`${row}/Assign`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
    s.text(`${row}/Assign/Num`, "", { size: 20, bold: true, color: "#1A1408", alignment: 4, anchor: "middle-center", pos: [0, 0], rect_size: [30, 30] });
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
    // ux-layout이 덧붙이는 엔티티(대화 창 초상·쪽 번호·배너 소개 줄)는 buildGameHud가 새로 짠 파일에 없어 빌드마다 id가 바뀌었다 (10-29)
    //   → 빌드 전 파일을 들고 있다가 ux-layout 뒤에 한 번 더 id를 잇는다 (빌드를 두 번 돌려도 같게)
    const gameFile = P.ui("GameHUD");
    const before = readIfExists(gameFile);
    n = buildGameHud();
    patchShadowHud();
    require("./ux-layout.cjs").run();
    preserveIds(gameFile, before);
    require("./ux-feedback.cjs").run();
  });
  console.log(`  UI: GameHUD ${n}개 엔티티 · ShadowHUD 스킨·모바일 패드`);
}

module.exports = { run, patchShadowHud };
