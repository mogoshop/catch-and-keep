// GameHUD 메뉴 위치(시스템 아이콘 회피) + ShadowHUD 보관함 버튼·힌트 문구 갱신
const path = require("path");
const { UIBuilder } = require(path.resolve(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const ext = ".ui";
const hudPath = path.resolve(__dirname, "../ui/GameHUD" + ext);
const g = UIBuilder.read(hudPath);
g.patch("Menu", { pos: [-200, -20] });
g.write(hudPath);

const shPath = path.resolve(__dirname, "../ui/ShadowHUD" + ext);
const s = UIBuilder.read(shPath);
s.patchComponent("Status/BtnStorage", "MOD.Core.TextGUIRendererComponent", { Text: "보관함 (H)" });
s.patchComponent("Hint", "MOD.Core.TextGUIRendererComponent", {
  Text: "클릭 이동·공격 | A S D F·우클릭 스킬 | 1 2 물약 | Z 소환 X 회수 C 집결 E 추출 | H 보관함 I 소지품 U 능력치 K 스킬",
});
s.patch("Hint", { rect_size: [1300, 30] });
s.write(shPath);
