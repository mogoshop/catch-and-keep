"use strict";
const fs = require("fs");
const { UIBuilder, P, load } = require("./lib.cjs");
const icons = Object.fromEntries(load("ui_icons").map(row => [row.key, row.ruid]));
function run() {
  const file = P.ui("AudioSettingsHUD");
  const b = fs.existsSync(file) ? UIBuilder.read(file) : new UIBuilder("AudioSettingsHUD", 20, true);
  b.panel("Modal", { anchor: "stretch", color: { r: 0, g: 0, b: 0, a: 0.65 }, raycast: true, enable: false });
  b.empty("Modal/SafeArea", { anchor: "stretch" });
  const w = "Modal/SafeArea/Panel";
  // 10-25: 아래에 「개발자 응원하기」 줄을 더해 800 → 960 (버튼과 아래 테두리 사이 여백)
  b.panel(w, { rect_size: [960, 960], color: "#100E16", raycast: true });
  b.sprite(w + "/Rim", { rect_size: [1000, 1000], image_ruid: icons.win_frame, color: "#FFFFFF" });
  b.text(w + "/Title", "환경 설정", { anchor: "top-center", pivot: [0.5, 1], pos: [0, -17], rect_size: [600, 40], size: 28, bold: true, color: "#E6C88A", alignment: 4 });
  b.text(w + "/Help", "소리는 즉시 바뀌며, 설정은 자동으로 저장됩니다", { anchor: "top-center", pos: [0, -96], rect_size: [840, 44], size: 26, color: "#D8CFBC" });
  const button = (name, text, pos, size) => b.button(w + "/" + name, text, { pos, rect_size: size, image_ruid: icons.btn_frame, bg_color: "#FFFFFF", color: "#E6DCC6", font_size: 28 });
  for (const [i, key, title] of [[0, "bgm", "배경 음악"], [1, "effects", "효과음"], [2, "ambience", "환경음"]]) {
    const r = w + "/" + key;
    b.panel(r, { pos: [0, 220 - i * 142], rect_size: [840, 124], color: "#191520" });
    b.text(r + "/Label", title, { anchor: "middle-left", pos: [20, 0], rect_size: [170, 60], size: 30, color: "#E6DCC6", alignment: 3 });
    for (const [name, label, x] of [["Minus", "−", -160], ["Plus", "+", 160], ["Mute", "음소거", 300]]) {
      b.button(r + "/" + name, label, { pos: [x, 0], rect_size: [name === "Mute" ? 150 : 88, 88], image_ruid: icons.btn_frame, bg_color: "#FFFFFF", color: "#E6DCC6", font_size: 28 });
    }
    b.text(r + "/Value", "", { pos: [0, 28], rect_size: [160, 46], size: 30, color: "#FFFFFF" });
    b.panel(r + "/Bar", { pos: [0, -20], rect_size: [176, 18], color: "#38323F" });
    b.sprite(r + "/Bar/Fill", { rect_size: [176, 18], color: "#B69B63", sprite_type: 3, fill_method: 0 });
  }
  b.text(w + "/Status", "설정을 불러오는 중", { pos: [0, -178], rect_size: [840, 50], size: 26, color: "#B8B0A1" });
  button("Reset", "기본값", [-290, -272], [220, 88]);
  button("Input", "조작 방식 전환", [0, -272], [280, 88]);
  button("Back", "메뉴로", [290, -272], [220, 88]);
  // 개발자 응원하기 (후원 패스 — Shop/Supporter · AudioWindow.OpenSupport). 능력치 없이 이름 아래 칭호만
  b.button(w + "/Support", "개발자 응원하기  ·  커피 한 잔 사 주기", { pos: [0, -376], rect_size: [840, 88], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: "#F4E2B0", font_size: 28 });
  buildSupport(b);
  b.patchComponent(w + "/Input", "MOD.Core.UITransformComponent", { ActivePlatform: 1 });
  b.write(file);
  console.log("  UI: 환경 설정 (배경음·효과음·환경음)");
}
// 후원 창: 같은 모달 안 두 번째 판 (설정 판과 번갈아 켠다). 카드 3장 = 썸네일 · 상품 이름 · 가격 · 칭호 · 응원하기
// 10-25 사용자: 「개발자의 시간은 무료가 아니다」 후원 패스 3단계 (문구 docs/promo/supporter-pass-copy-20261025.md)
function buildSupport(b) {
  const s = "Modal/SafeArea/Support";
  b.panel(s, { rect_size: [1080, 820], color: "#100E16", raycast: true, enable: false });
  b.sprite(s + "/Rim", { rect_size: [1120, 860], image_ruid: icons.win_frame, color: "#FFFFFF" });
  b.text(s + "/Title", "개발자 응원하기", { anchor: "top-center", pivot: [0.5, 1], pos: [0, -17], rect_size: [600, 40], size: 28, bold: true, color: "#E6C88A", alignment: 4 });
  b.text(s + "/Help", "개발자의 시간은 무료가 아닙니다.\n능력치는 없고, 이름 아래에 칭호 한 줄이 붙어요. 한 번 사면 계정의 모든 캐릭터에 붙습니다.", { anchor: "top-center", pos: [0, -110], rect_size: [960, 76], size: 22, color: "#D8CFBC", alignment: 4 });
  const cards = [["1", "개발자 커피 한 잔", "후원자", "#D8CFC0"], ["2", "개발자 커피 다섯 잔", "든든한 후원자", "#E6C88A"], ["3", "개발자 커피 열 잔", "키다리 후원자", "#C9A0FF"]];
  cards.forEach(([i, name, title, color], k) => {
    const c = `${s}/Card${i}`;
    b.panel(c, { pos: [(k - 1) * 330, -30], rect_size: [310, 440], color: "#191520" });
    b.sprite(c + "/Icon", { anchor: "top-center", pos: [0, -24], rect_size: [160, 160], image_ruid: icons["supporter_" + i], color: "#FFFFFF", sprite_type: 0 });
    b.patchComponent(c + "/Icon", "MOD.Core.SpriteGUIRendererComponent", { PreserveSprite: 0, RaycastTarget: false });
    b.text(c + "/Name", name, { anchor: "top-center", pos: [0, -206], rect_size: [290, 40], size: 24, bold: true, color: "#F3E7CC", alignment: 4 });
    b.text(c + "/Price", "", { anchor: "top-center", pos: [0, -248], rect_size: [290, 34], size: 22, color: "#E6C88A", alignment: 4 });
    b.text(c + "/Title", `칭호  <color=${color}>${title}</color>`, { anchor: "top-center", pos: [0, -290], rect_size: [290, 34], size: 21, color: "#A99F8E", alignment: 4 });
    b.button(c + "/Btn", "응원하기", { anchor: "bottom-center", pos: [0, 24], rect_size: [250, 80], image_ruid: icons.btn_frame, bg_color: { r: 1, g: 0.86, b: 0.62, a: 1 }, color: "#F4E2B0", font_size: 24 });
  });
  b.button(s + "/Back", "설정으로", { anchor: "bottom-center", pos: [0, 40], rect_size: [260, 80], image_ruid: icons.btn_frame, bg_color: "#FFFFFF", color: "#E6DCC6", font_size: 24 });
}
module.exports = { run };
