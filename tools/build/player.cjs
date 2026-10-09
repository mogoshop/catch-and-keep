// DefaultPlayer 스크립트 구성. 이 목록이 플레이어 컴포넌트의 단일 기준이다 (없으면 붙이고, 목록에 없는 script.*는 뗀다).
"use strict";
const { ModelBuilder, P, quiet } = require("./lib.cjs");

const PLAYER_SCRIPTS = [
  // 전투·생존
  "script.PlayerAttack", "script.PlayerVitals", "script.PlayerStats",
  // 조작·스킬
  "script.ClickControl", "script.SkillBook", "script.SkillEffects",
  // 그림자
  "script.ShadowOwner", "script.ShadowCommander", "script.SoulExtractor",
  // 아이템
  "script.PlayerInventory", "script.PlayerBelt", "script.PlayerShop", "script.PlayerCorpses",
  // 진행·이동·저장
  "script.PlayerQuest", "script.PlayerTravel", "script.PlayerSave", "script.PlayerJournal",
  // 멀티
  "script.PlayerSocial", "script.PlayerDuel", "script.PlayerTrade",
];

function run() {
  const file = P.global("DefaultPlayer");
  let added = 0, removed = 0;
  quiet(() => {
    const b = ModelBuilder.read(file);
    for (const c of b.snapshot().components) {
      if (c.startsWith("script.") && !PLAYER_SCRIPTS.includes(c)) { b.removeComponent(c); removed++; }
    }
    for (const c of PLAYER_SCRIPTS) if (!b.hasComponent(c)) { b.component(c); added++; }
    b.write(file);
  });
  console.log(`  플레이어: 스크립트 ${PLAYER_SCRIPTS.length}개 (추가 ${added}, 제거 ${removed})`);
}

module.exports = { run, PLAYER_SCRIPTS };
