#!/usr/bin/env node
// 월드 빌드 단일 진입점. data/*.csv → 데이터 스크립트·모델·맵·UI·플레이어 구성.
// 순서는 의존 순서로 고정 (데이터 → 모델 → 플레이어 → 맵(모델을 배치) → UI). 몇 번을 돌려도 결과가 같다.
// 사용: node tools/build.cjs [data|models|player|maps|ui ...]   (인자 없으면 전부)
//       끝나면 메이커: 플레이 중지 → refresh 2번 (새 모델·맵은 두 번째에 등록된다)
"use strict";
const { execFileSync } = require("child_process");
const path = require("path");

const STEPS = {
  data: () => execFileSync(process.execPath, [path.join(__dirname, "gen_data.cjs")], { stdio: "inherit" }),
  models: () => require("./build/models.cjs").run(),
  player: () => require("./build/player.cjs").run(),
  maps: () => require("./build/maps.cjs").run(),
  ui: () => { require("./build/ui.cjs").run(); require("./build/quest-journal.cjs").run(); require("./build/navigation.cjs").run(); require("./build/equipment.cjs").run(); require("./build/audio-settings.cjs").run(); require("./build/journal.cjs").run(); require("./build/companion.cjs").run(); require("./build/aim.cjs").run(); require("./build/confirm.cjs").run(); require("./build/stash.cjs").run(); },
};
const ORDER = Object.keys(STEPS);

const asked = process.argv.slice(2);
for (const a of asked) if (!STEPS[a]) {
  console.error(`알 수 없는 단계 '${a}'. 가능: ${ORDER.join(", ")}`);
  process.exit(2);
}
const steps = ORDER.filter((s) => asked.length === 0 || asked.includes(s));
for (const s of steps) {
  console.log(`[build] ${s}`);
  STEPS[s]();
}
console.log("[build] 완료 → 메이커: 플레이 중지 후 refresh 2번");
