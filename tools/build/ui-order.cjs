// UI 그룹 그리기 순서 한 곳에서 정하기 (10-11).
// 메이커는 저장할 때 그룹 순서를 0~15로 다시 매긴다 — 값이 겹치면 순서를 제멋대로 정해 HUD가 창을 덮었다
// (상점 창이 GameHUD 아래로, 그림자 창이 GameHUD 아래로). 모든 그룹에 겹치지 않는 순서를 주고
// 루트 displayOrder와 UIGroupComponent.GroupOrder를 같은 값으로 써서, 다시 매겨도 위아래가 바뀌지 않게 한다.
// 아래로 갈수록 위에 그린다: 늘 보이는 HUD(채팅창 포함) → 창 → 입장 화면·장비 → 설정 → 보상 알림 → 이야기 카드 → 확인 창
"use strict";
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const ORDER = [
  "AimHUD", "NavigationHUD", "CompanionHUD", "InteractionHUD",
  "GameHUD", "ChatHUD", "ShadowHUD",
  "ShopHUD", "StashHUD", "MerchantHUD", "JournalHUD", "QuestJournalHUD", "CoopHUD",
  "CharSelectHUD", "EquipmentHUD", "AudioSettingsHUD", "RewardHUD", "StoryHUD", "ConfirmHUD",
];

function run() {
  const dir = path.join(__dirname, "../../ui");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ui")).map((f) => f.slice(0, -3));
  const unknown = files.filter((f) => !ORDER.includes(f));
  if (unknown.length) throw new Error(`[ui-order] 순서가 정해지지 않은 UI 그룹: ${unknown.join(", ")} — tools/build/ui-order.cjs ORDER에 넣으세요`);
  let changed = 0;
  ORDER.forEach((name, i) => {
    const file = path.join(dir, name + ".ui");
    if (!fs.existsSync(file)) return;
    const log = console.log;
    console.log = () => {};
    try {
      const b = UIBuilder.read(file);
      const g = b.getComponent("/", "MOD.Core.UIGroupComponent");
      const root = b.find("/");
      if (g.GroupOrder === i && root.jsonString.displayOrder === i) return;
      b.patchComponent("/", "MOD.Core.UIGroupComponent", { GroupOrder: i });
      b.patch("/", { display_order: i });
      b.write(file, { lint_verbose: false });
      changed++;
    } finally {
      console.log = log;
    }
  });
  console.log(`  UI 그룹 순서: ${ORDER.length}개 고정 (바뀜 ${changed})`);
}

module.exports = { run, ORDER };
if (require.main === module) run();
