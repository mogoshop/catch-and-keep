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
  b.panel(w, { rect_size: [960, 800], color: "#100E16", raycast: true });
  b.sprite(w + "/Rim", { rect_size: [980, 820], image_ruid: icons.win_frame, color: "#FFFFFF" });
  b.text(w + "/Title", "환경 설정", { anchor: "top-center", pos: [0, -26], rect_size: [600, 58], size: 38, bold: true, color: "#E6C88A" });
  b.text(w + "/Help", "소리는 즉시 바뀌며, 설정은 자동으로 저장됩니다", { anchor: "top-center", pos: [0, -96], rect_size: [840, 44], size: 26, color: "#D8CFBC" });
  const button = (name, text, pos, size) => b.button(w + "/" + name, text, { pos, rect_size: size, image_ruid: icons.btn_frame, bg_color: "#FFFFFF", color: "#E6DCC6", font_size: 28 });
  for (const [i, key, title] of [[0, "bgm", "배경 음악"], [1, "effects", "효과음"], [2, "ambience", "환경음"]]) {
    const r = w + "/" + key;
    b.panel(r, { pos: [0, 160 - i * 142], rect_size: [840, 124], color: "#191520" });
    b.text(r + "/Label", title, { anchor: "middle-left", pos: [20, 0], rect_size: [170, 60], size: 30, color: "#E6DCC6", alignment: 3 });
    for (const [name, label, x] of [["Minus", "−", -160], ["Plus", "+", 160], ["Mute", "음소거", 300]]) {
      b.button(r + "/" + name, label, { pos: [x, 0], rect_size: [name === "Mute" ? 150 : 88, 88], image_ruid: icons.btn_frame, bg_color: "#FFFFFF", color: "#E6DCC6", font_size: 28 });
    }
    b.text(r + "/Value", "", { pos: [0, 28], rect_size: [160, 46], size: 30, color: "#FFFFFF" });
    b.panel(r + "/Bar", { pos: [0, -20], rect_size: [176, 18], color: "#38323F" });
    b.sprite(r + "/Bar/Fill", { rect_size: [176, 18], color: "#B69B63", sprite_type: 3, fill_method: 0 });
  }
  b.text(w + "/Status", "설정을 불러오는 중", { pos: [0, -238], rect_size: [840, 50], size: 26, color: "#B8B0A1" });
  button("Reset", "기본값", [-290, -332], [220, 88]);
  button("Input", "조작 방식 전환", [0, -332], [280, 88]);
  button("Back", "메뉴로", [290, -332], [220, 88]);
  b.patchComponent(w + "/Input", "MOD.Core.UITransformComponent", { ActivePlatform: 1 });
  b.write(file);
  console.log("  UI: 환경 설정 (배경음·효과음·환경음)");
}
module.exports = { run };
