// 악몽·지옥 복제 맵의 레벨 가산(MapAmbience.LevelBonus)만 difficulty.csv 값으로 맞춘다.
// 복제 맵을 통째로 다시 만들지 않으므로 보통 맵의 진행 중인 편집(다른 작업자)이 복제본에 섞이지 않는다.
//   node tools/set_level_bonus.cjs
"use strict";
const path = require("path");
const fs = require("fs");
const { load, num } = require("./lib/csv.cjs");
const { MapBuilder } = require(path.join(__dirname, "..", ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));

const ROOT = path.join(__dirname, "..");
const diffs = load("difficulty").filter((d) => num(d.index) > 0);
const maps = load("maps").filter((m) => m.kind !== "instance");
let changed = 0, same = 0;
for (const m of maps) {
  for (const d of diffs) {
    const name = m.id + d.mapSuffix;
    const file = path.join(ROOT, "map", name + ".map");
    if (!fs.existsSync(file)) throw new Error(`복제 맵 없음: ${name}`);
    const map = MapBuilder.read(file);
    const amb = map.component(name, "script.MapAmbience");
    const want = num(d.levelBonus);
    if (amb.LevelBonus === want) { same++; continue; }
    map.patchComponent(name, "script.MapAmbience", { LevelBonus: want });
    map.write(file);
    changed++;
  }
}
console.log(`레벨 가산: ${changed}개 바꿈 · ${same}개 그대로 (${diffs.map((d) => `${d.name} +${d.levelBonus}`).join(" · ")})`);
