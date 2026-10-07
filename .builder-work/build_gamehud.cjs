// GameHUD 생성: D2식 하단 바(생명/마나 오브·경험치·스킬 슬롯·포션), 대상 정보, 능력치/소지품/스킬 창, 메뉴 버튼
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const OUT = path.resolve(__dirname, "../ui/GameHUD" + ".ui");
const b = new UIBuilder("GameHUD", 5);
b.patchComponent("/", "MOD.Core.UIGroupComponent", { GroupOrder: 5 });
const outline = { outline: true, outline_color: "#000000" };

// ── 하단 바 (D2 배치: 왼쪽 생명 오브 · 가운데 미니 패널/경험치/스킬·벨트 · 오른쪽 마나 오브) ──
b.empty("Bottom", { anchor: "bottom-center", pos: [0, 0], rect_size: [1300, 236] });
for (const [name, side, col] of [["LifeOrb", "bottom-left", "#C0282D"], ["ManaOrb", "bottom-right", "#2D50C8"]]) {
  b.panel(`Bottom/${name}`, { anchor: side, pos: [side.endsWith("left") ? 10 : -10, 10], rect_size: [160, 160], color: "#140A0A", alpha: 0.85 });
  b.sprite(`Bottom/${name}/Fill`, { anchor: "middle-center", pos: [0, 0], rect_size: [148, 148], color: col, alpha: 0.95, sprite_type: 3, fill_method: 1 });
  b.text(`Bottom/${name}/Text`, "0/0", { size: 22, bold: true, anchor: "middle-center", pos: [0, 0], rect_size: [160, 40], ...outline });
}
// 미니 패널 (D2: 능력치·소지품·스킬·파티·퀘스트·랭킹·추출·조작)
b.empty("Bottom/Menu", { anchor: "top-center", pos: [0, -2], rect_size: [920, 44] });
[["BtnChar", "능력치 U"], ["BtnInv", "소지품 I"], ["BtnSkill", "스킬 K"], ["BtnQuest", "퀘스트 Q"], ["BtnSocial", "플레이어 P"], ["BtnRank", "랭킹 L"], ["BtnExtract", "추출 E"], ["BtnPortal", "귀환 T"]].forEach(([n, t], i) => {
  b.button(`Bottom/Menu/${n}`, t, { anchor: "middle-center", pos: [-399 + i * 114, 0], rect_size: [108, 42], font_size: 16 });
});
b.panel("Bottom/XP", { anchor: "top-center", pos: [0, -52], rect_size: [900, 22], color: "#000000", alpha: 0.7 });
b.sprite("Bottom/XP/Fill", { anchor: "middle-left", pos: [4, 0], rect_size: [892, 14], color: "#D2AA3C", alpha: 0.95, sprite_type: 3, fill_method: 0 });
b.text("Bottom/XP/Text", "Lv 1", { size: 16, anchor: "middle-center", pos: [0, 0], rect_size: [900, 22], ...outline });
// 스킬 5칸 (A S D F 우클릭) + 벨트 4칸 (1 2 3 4)
b.empty("Bottom/Slots", { anchor: "bottom-center", pos: [0, 16], rect_size: [920, 104] });
["Slot1", "Slot2", "Slot3", "Slot4", "Slot5", "Belt1", "Belt2", "Belt3", "Belt4"].forEach((n, i) => {
  const isBelt = n.startsWith("Belt");
  b.button(`Bottom/Slots/${n}`, n, {
    anchor: "middle-center", pos: [-404 + i * 101 + (isBelt ? 12 : 0), 0], rect_size: [94, 94], font_size: 16,
    bg_color: isBelt ? { r: 0.25, g: 0.08, b: 0.08, a: 0.85 } : { r: 0.12, g: 0.1, b: 0.18, a: 0.85 },
  });
});

// ── 대상 정보 ──
b.panel("Target", { anchor: "top-center", pos: [0, -150], rect_size: [440, 84], color: "#000000", alpha: 0.65 });
b.text("Target/Name", "", { size: 22, bold: true, anchor: "top-center", pos: [0, -6], rect_size: [420, 30], ...outline });
b.panel("Target/Bar", { anchor: "top-center", pos: [0, -40], rect_size: [400, 16], color: "#2A0A0A", alpha: 0.9 });
b.sprite("Target/Bar/Fill", { anchor: "middle-left", pos: [2, 0], rect_size: [396, 12], color: "#C0282D", alpha: 1, sprite_type: 3, fill_method: 0 });
b.text("Target/Curse", "", { size: 16, color: "#C88CFF", anchor: "top-center", pos: [0, -60], rect_size: [420, 22], ...outline });

// ── 공통 창 ──
function windowBase(name, anchor, pos, size, title) {
  b.panel(name, { anchor, pos, rect_size: size, color: "#0E0C14", alpha: 0.94, raycast: true });
  b.text(`${name}/Title`, title, { size: 28, bold: true, color: "#D2AA3C", anchor: "top-center", pos: [0, -14], rect_size: [size[0] - 160, 40] });
  b.button(`${name}/BtnClose`, "X", { anchor: "top-right", pos: [-8, -8], rect_size: [64, 64], font_size: 26 });
}

// 능력치 창
windowBase("CharWin", "middle-left", [30, 60], [440, 560], "능력치");
b.text("CharWin/Info", "", { size: 18, alignment: 0, anchor: "top-left", pos: [24, -72], rect_size: [340, 214] });
["Str", "Dex", "Vit", "Ene"].forEach((s, i) => {
  b.empty(`CharWin/${s}`, { anchor: "top-left", pos: [20, -290 - i * 62], rect_size: [400, 56] });
  b.text(`CharWin/${s}/Text`, s, { size: 22, alignment: 3, anchor: "middle-left", pos: [4, 0], rect_size: [310, 50] });
  b.button(`CharWin/${s}/BtnAdd`, "+", { anchor: "middle-right", pos: [0, 0], rect_size: [64, 56], font_size: 30, bg_color: { r: 0.3, g: 0.22, b: 0.08, a: 0.95 } });
});
b.text("CharWin/Points", "", { size: 22, color: "#FFE15A", anchor: "bottom-center", pos: [0, 18], rect_size: [400, 30] });

// 소지품 창
windowBase("InvWin", "middle-right", [-30, -20], [640, 780], "소지품");
b.text("InvWin/Gold", "", { size: 20, color: "#FFE15A", alignment: 3, anchor: "top-left", pos: [24, -62], rect_size: [520, 30] });
["weapon", "offhand", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring1", "ring2"].forEach((s, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  b.button(`InvWin/Eq_${s}`, s, { anchor: "top-left", pos: [20 + col * 304, -100 - row * 50], rect_size: [296, 44], font_size: 16 });
});
for (let i = 0; i < 30; i++) {
  const col = i % 6, row = Math.floor(i / 6);
  b.button(`InvWin/Bag${i + 1}`, "", { anchor: "top-left", pos: [20 + col * 101, -354 - row * 56], rect_size: [96, 52], font_size: 14 });
}
b.text("InvWin/Desc", "", { size: 16, alignment: 0, anchor: "bottom-left", pos: [24, 80], rect_size: [592, 58] });
b.button("InvWin/BtnEquip", "장착", { anchor: "bottom-left", pos: [20, 16], rect_size: [180, 60], font_size: 22, bg_color: { r: 0.15, g: 0.25, b: 0.15, a: 0.95 } });
b.button("InvWin/BtnSell", "판매", { anchor: "bottom-left", pos: [212, 16], rect_size: [180, 60], font_size: 22, bg_color: { r: 0.3, g: 0.2, b: 0.08, a: 0.95 } });
b.text("InvWin/Hint", "룬: 선택 후 장비 칸 클릭 = 소켓", { size: 15, color: "#AAAAAA", anchor: "bottom-right", pos: [-20, 30], rect_size: [230, 40] });

// 스킬 창
windowBase("SkillWin", "middle-center", [0, 40], [960, 780], "스킬");
b.text("SkillWin/Points", "", { size: 20, color: "#FFE15A", anchor: "top-left", pos: [24, -62], rect_size: [500, 30], alignment: 3 });
[0, 1, 2].forEach((t) => {
  b.text(`SkillWin/Head${t + 1}`, "", { size: 22, bold: true, color: "#D2AA3C", anchor: "top-left", pos: [24 + t * 310, -100], rect_size: [296, 34] });
  for (let r = 0; r < 10; r++) {
    b.button(`SkillWin/T${t + 1}_${r + 1}`, "", { anchor: "top-left", pos: [24 + t * 310, -140 - r * 46], rect_size: [296, 42], font_size: 16 });
  }
});
b.text("SkillWin/Desc", "", { size: 18, alignment: 0, anchor: "bottom-left", pos: [24, 90], rect_size: [912, 60] });
[["BtnLearn", "습득 +1"], ["BtnA", "A 슬롯"], ["BtnS", "S 슬롯"], ["BtnD", "D 슬롯"], ["BtnF", "F 슬롯"], ["BtnR", "우클릭"]].forEach(([n, t], i) => {
  const opts = { anchor: "bottom-left", pos: [24 + i * 152, 16], rect_size: [144, 62], font_size: 20 };
  if (i === 0) opts.bg_color = { r: 0.3, g: 0.22, b: 0.08, a: 0.95 };
  b.button(`SkillWin/${n}`, t, opts);
});

// 의뢰 추적 (좌상단, 힌트 아래)
b.text("QuestTrack", "", { size: 20, color: "#FFE15A", alignment: 3, anchor: "top-left", pos: [280, -140], rect_size: [700, 30], outline: true, outline_color: "#000000" });

// NPC 창 (가까이 가면 열림)
b.panel("NpcWin", { anchor: "middle-left", pos: [30, 120], rect_size: [480, 360], color: "#0E0C14", alpha: 0.94, raycast: true });
b.text("NpcWin/Title", "", { size: 26, bold: true, color: "#D2AA3C", anchor: "top-center", pos: [0, -14], rect_size: [440, 40] });
b.text("NpcWin/Body", "", { size: 19, alignment: 0, anchor: "top-left", pos: [24, -64], rect_size: [432, 150] });
[["Btn1", 0], ["Btn2", 1], ["Btn3", 2], ["Btn4", 3], ["Btn5", 4]].forEach(([n, i]) => {
  b.button(`NpcWin/${n}`, n, { anchor: "bottom-left", pos: [14 + i * 91, 20], rect_size: [86, 70], font_size: 15, bg_color: { r: 0.3, g: 0.22, b: 0.08, a: 0.95 } });
});

// 퀘스트 창 (Q): 영역 의뢰 목록
windowBase("QuestWin", "middle-center", [0, 60], [760, 560], "퀘스트 — 잿빛 변경");
for (let i = 1; i <= 6; i++) b.button(`QuestWin/Q${i}`, "", { anchor: "top-left", pos: [24, -70 - (i - 1) * 54], rect_size: [712, 48], font_size: 18 });
b.text("QuestWin/Desc", "", { size: 18, alignment: 0, anchor: "bottom-left", pos: [24, 20], rect_size: [712, 110] });

// 파티 패널 (좌측, 의뢰 추적 아래)
b.text("PartyPanel", "", { size: 17, color: "#AACCAA", alignment: 0, anchor: "top-left", pos: [24, -190], rect_size: [420, 200], outline: true, outline_color: "#000000" });

// 플레이어 창 (P): 같은 서버 플레이어 → 파티 초대 / 결투 / 거래, 파티 탈퇴
windowBase("SocialWin", "middle-center", [0, 60], [760, 620], "플레이어");
for (let i = 1; i <= 8; i++) {
  const y = -70 - (i - 1) * 60;
  b.text(`SocialWin/Name${i}`, "", { size: 18, alignment: 3, anchor: "top-left", pos: [24, y], rect_size: [300, 52] });
  b.button(`SocialWin/Party${i}`, "파티", { anchor: "top-left", pos: [340, y], rect_size: [120, 52], font_size: 17 });
  b.button(`SocialWin/Duel${i}`, "결투", { anchor: "top-left", pos: [470, y], rect_size: [120, 52], font_size: 17, bg_color: { r: 0.35, g: 0.08, b: 0.08, a: 0.95 } });
  b.button(`SocialWin/Trade${i}`, "거래", { anchor: "top-left", pos: [600, y], rect_size: [120, 52], font_size: 17 });
}
b.button("SocialWin/BtnLeave", "파티 탈퇴", { anchor: "bottom-left", pos: [24, 16], rect_size: [180, 56], font_size: 18 });

// 받은 요청 (수락/거절)
b.panel("Request", { anchor: "top-center", pos: [0, -250], rect_size: [560, 150], color: "#1A0E0E", alpha: 0.95, raycast: true });
b.text("Request/Text", "", { size: 20, anchor: "top-center", pos: [0, -14], rect_size: [520, 60] });
b.button("Request/BtnYes", "수락", { anchor: "bottom-center", pos: [-90, 14], rect_size: [160, 56], font_size: 20, bg_color: { r: 0.15, g: 0.3, b: 0.15, a: 0.95 } });
b.button("Request/BtnNo", "거절", { anchor: "bottom-center", pos: [90, 14], rect_size: [160, 56], font_size: 20, bg_color: { r: 0.35, g: 0.1, b: 0.1, a: 0.95 } });

// 거래 창: 왼쪽 내 제안 / 오른쪽 상대 제안. 거래 중 소지품 칸을 누르면 올라간다
windowBase("TradeWin", "middle-left", [30, 10], [620, 640], "거래");
b.text("TradeWin/MyTitle", "내 제안", { size: 20, color: "#D2AA3C", anchor: "top-left", pos: [24, -64], rect_size: [280, 30] });
b.text("TradeWin/TheirTitle", "상대 제안", { size: 20, color: "#D2AA3C", anchor: "top-left", pos: [320, -72], rect_size: [220, 26] });
for (let i = 1; i <= 8; i++) {
  b.button(`TradeWin/My${i}`, "", { anchor: "top-left", pos: [20, -100 - (i - 1) * 50], rect_size: [284, 44], font_size: 15 });
  b.text(`TradeWin/Their${i}`, "", { size: 15, anchor: "top-left", pos: [320, -100 - (i - 1) * 50], rect_size: [284, 44] });
}
b.text("TradeWin/Gold", "", { size: 18, color: "#FFE15A", alignment: 0, anchor: "bottom-left", pos: [24, 90], rect_size: [576, 50] });
[["BtnGoldMinus", "-100골드", 20], ["BtnGoldPlus", "+100골드", 166], ["BtnConfirm", "확인", 312], ["BtnCancel", "취소", 458]].forEach(([n, t, x]) => {
  b.button(`TradeWin/${n}`, t, { anchor: "bottom-left", pos: [x, 20], rect_size: [140, 60], font_size: 18 });
});

// 웨이포인트 창 (웨이포인트 위에 서면 열림): 이동 + 난이도
windowBase("WpWin", "middle-center", [0, 60], [560, 560], "웨이포인트");
for (let i = 1; i <= 6; i++) b.button(`WpWin/Wp${i}`, "", { anchor: "top-left", pos: [24, -70 - (i - 1) * 56], rect_size: [512, 50], font_size: 19 });
b.text("WpWin/DiffTitle", "난이도", { size: 18, color: "#D2AA3C", anchor: "bottom-center", pos: [0, 86], rect_size: [500, 28] });
[["Diff0", "보통", -170], ["Diff1", "악몽", 0], ["Diff2", "지옥", 170]].forEach(([n, t, x]) => {
  b.button(`WpWin/${n}`, t, { anchor: "bottom-center", pos: [x, 20], rect_size: [160, 60], font_size: 19 });
});

// 랭킹 창 (L): 심도 최고 층 / 여왕 최단 처치
windowBase("RankWin", "middle-center", [0, 60], [600, 600], "랭킹");
[["TabDepth", "심도 최고 층", -140], ["TabQueen", "묘지기 여왕 처치 시간", 140]].forEach(([n, t, x]) => {
  b.button(`RankWin/${n}`, t, { anchor: "top-center", pos: [x, -76], rect_size: [250, 48], font_size: 17 });
});
b.text("RankWin/List", "", { size: 19, alignment: 0, anchor: "top-left", pos: [40, -130], rect_size: [520, 440] });

b.write(OUT);
console.log("entities:", b.listEntities().length);
