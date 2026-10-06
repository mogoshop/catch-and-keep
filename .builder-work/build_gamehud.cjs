// GameHUD 생성: D2식 하단 바(생명/마나 오브·경험치·스킬 슬롯·포션), 대상 정보, 능력치/소지품/스킬 창, 메뉴 버튼
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const OUT = path.resolve(__dirname, "../ui/GameHUD" + ".ui");
const b = new UIBuilder("GameHUD", 2);
const outline = { outline: true, outline_color: "#000000" };

// ── 하단 바 ──
b.empty("Bottom", { anchor: "bottom-center", pos: [0, 0], rect_size: [1120, 180] });
for (const [name, side, col] of [["LifeOrb", "bottom-left", "#C0282D"], ["ManaOrb", "bottom-right", "#2D50C8"]]) {
  b.panel(`Bottom/${name}`, { anchor: side, pos: [side.endsWith("left") ? 10 : -10, 10], rect_size: [150, 150], color: "#140A0A", alpha: 0.85 });
  b.sprite(`Bottom/${name}/Fill`, { anchor: "middle-center", pos: [0, 0], rect_size: [138, 138], color: col, alpha: 0.95, sprite_type: 3, fill_method: 1 });
  b.text(`Bottom/${name}/Text`, "0/0", { size: 22, bold: true, anchor: "middle-center", pos: [0, 0], rect_size: [150, 40], ...outline });
}
b.panel("Bottom/XP", { anchor: "top-center", pos: [0, -6], rect_size: [780, 22], color: "#000000", alpha: 0.7 });
b.sprite("Bottom/XP/Fill", { anchor: "middle-left", pos: [4, 0], rect_size: [772, 14], color: "#D2AA3C", alpha: 0.95, sprite_type: 3, fill_method: 0 });
b.text("Bottom/XP/Text", "Lv 1", { size: 16, anchor: "middle-center", pos: [0, 0], rect_size: [780, 22], ...outline });
b.empty("Bottom/Slots", { anchor: "bottom-center", pos: [0, 18], rect_size: [740, 110] });
["Slot1", "Slot2", "Slot3", "Slot4", "Slot5", "Pot1", "Pot2"].forEach((n, i) => {
  const isPot = n.startsWith("Pot");
  b.button(`Bottom/Slots/${n}`, n, {
    anchor: "middle-center", pos: [-318 + i * 106, 0], rect_size: [98, 98], font_size: 18,
    bg_color: isPot ? { r: 0.25, g: 0.08, b: 0.08, a: 0.85 } : { r: 0.12, g: 0.1, b: 0.18, a: 0.85 },
  });
});

// ── 대상 정보 ──
b.panel("Target", { anchor: "top-center", pos: [0, -16], rect_size: [440, 84], color: "#000000", alpha: 0.65 });
b.text("Target/Name", "", { size: 22, bold: true, anchor: "top-center", pos: [0, -6], rect_size: [420, 30], ...outline });
b.panel("Target/Bar", { anchor: "top-center", pos: [0, -40], rect_size: [400, 16], color: "#2A0A0A", alpha: 0.9 });
b.sprite("Target/Bar/Fill", { anchor: "middle-left", pos: [2, 0], rect_size: [396, 12], color: "#C0282D", alpha: 1, sprite_type: 3, fill_method: 0 });
b.text("Target/Curse", "", { size: 16, color: "#C88CFF", anchor: "top-center", pos: [0, -60], rect_size: [420, 22], ...outline });

// ── 메뉴 버튼 (우상단, PC·모바일 공통) ──
b.empty("Menu", { anchor: "top-right", pos: [-20, -20], rect_size: [520, 64] });
[["BtnChar", "능력치 U"], ["BtnInv", "소지품 I"], ["BtnSkill", "스킬 K"], ["BtnExtract", "추출 E"]].forEach(([n, t], i) => {
  b.button(`Menu/${n}`, t, { anchor: "middle-right", pos: [-(i * 130), 0], rect_size: [122, 64], font_size: 20 });
});

// ── 공통 창 ──
function windowBase(name, anchor, pos, size, title) {
  b.panel(name, { anchor, pos, rect_size: size, color: "#0E0C14", alpha: 0.94, raycast: true });
  b.text(`${name}/Title`, title, { size: 28, bold: true, color: "#D2AA3C", anchor: "top-center", pos: [0, -14], rect_size: [size[0] - 160, 40] });
  b.button(`${name}/BtnClose`, "X", { anchor: "top-right", pos: [-8, -8], rect_size: [64, 64], font_size: 26 });
}

// 능력치 창
windowBase("CharWin", "middle-left", [30, 60], [440, 560], "능력치");
b.text("CharWin/Info", "", { size: 20, alignment: 0, anchor: "top-left", pos: [24, -70], rect_size: [392, 200] });
["Str", "Dex", "Vit", "Ene"].forEach((s, i) => {
  b.empty(`CharWin/${s}`, { anchor: "top-left", pos: [20, -290 - i * 62], rect_size: [400, 56] });
  b.text(`CharWin/${s}/Text`, s, { size: 22, alignment: 3, anchor: "middle-left", pos: [4, 0], rect_size: [310, 50] });
  b.button(`CharWin/${s}/BtnAdd`, "+", { anchor: "middle-right", pos: [0, 0], rect_size: [64, 56], font_size: 30, bg_color: { r: 0.3, g: 0.22, b: 0.08, a: 0.95 } });
});
b.text("CharWin/Points", "", { size: 22, color: "#FFE15A", anchor: "bottom-center", pos: [0, 18], rect_size: [400, 30] });

// 소지품 창
windowBase("InvWin", "middle-right", [-30, 40], [640, 820], "소지품");
b.text("InvWin/Gold", "", { size: 20, color: "#FFE15A", alignment: 3, anchor: "top-left", pos: [24, -62], rect_size: [592, 30] });
["weapon", "offhand", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring1", "ring2"].forEach((s, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  b.button(`InvWin/Eq_${s}`, s, { anchor: "top-left", pos: [20 + col * 304, -100 - row * 50], rect_size: [296, 44], font_size: 16 });
});
for (let i = 0; i < 30; i++) {
  const col = i % 6, row = Math.floor(i / 6);
  b.button(`InvWin/Bag${i + 1}`, "", { anchor: "top-left", pos: [20 + col * 101, -360 - row * 62], rect_size: [96, 56], font_size: 14 });
}
b.text("InvWin/Desc", "", { size: 17, alignment: 0, anchor: "bottom-left", pos: [24, 84], rect_size: [592, 96] });
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

b.write(OUT);
console.log("entities:", b.listEntities().length);
