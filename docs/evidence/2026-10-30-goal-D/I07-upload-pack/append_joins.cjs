#!/usr/bin/env node
// I07 재질 접합 — 맵을 다시 짓지 않고 ArtJoin<n>만 맵 끝에 덧붙인다 (10-30 · I07-registration.patch를 만든 스크립트).
//   node docs/evidence/2026-10-30-goal-D/I07-upload-pack/append_joins.cjs demonroad wreckcoast
// 왜: 설계도 빌드(tools/build/handmade/build.cjs)는 그림(Art*) 다음에 기능 엔티티(GateBack·Torch·Waypoint·Spawner …)를 놓아서
//   ArtJoin이 배열 가운데에 끼고 기존 기능 엔티티 12개의 displayOrder가 +n 밀린다. 합격 기준(diff = 끝에 덧붙은 ArtJoin뿐)을 지키려고
//   ArtJoin 엔티티 값(자리·배율·뒤집기·RUID·z)은 빌더와 같은 함수(handmade.artEntities)로 계산하고, 기존 맵을 MapBuilder로 읽어 끝에만 placeModel 한다.
//   노말 + 난이도 복제(_nm·_hell)에 같은 값을 붙인다 (buildCopies는 노말을 그대로 복제하므로 ArtJoin 컴포넌트가 노말과 같다).
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../../../..");
process.chdir(ROOT);
const handmade = require(path.join(ROOT, "tools/build/handmade/lib.cjs"));
const maps = require(path.join(ROOT, "tools/build/maps.cjs"));
const { MapBuilder, load, num, P } = require(path.join(ROOT, "tools/build/lib.cjs"));

const ids = process.argv.slice(2);
if (!ids.length) throw new Error("사용: append_joins.cjs <맵id>…");
const rows = load("maps").sort((a, b) => num(a.order) - num(b.order));
const ctx = maps.context();
const suffixes = ["", ...load("difficulty").filter((x) => num(x.index) > 0).map((x) => x.mapSuffix)];
for (const id of ids) {
  const d = rows.find((m) => m.id === id);
  if (!d) throw new Error(`maps.csv에 '${id}' 없음`);
  // build.cjs와 같은 순서로 기능 엔티티 → 그림 엔티티를 계산 (쓰지는 않는다)
  const bp = handmade.parseBlueprint(id);
  const list = handmade.loadRows(id);
  const func = (d.kind === "handmade" ? null : maps.desiredEntities(d, rows, ctx)) || handmade.functionalEntities(d, rows, ctx, list);
  const art = handmade.artEntities(d, ctx, bp, list, func);
  const joins = art.entities.filter((e) => /^ArtJoin\d+$/.test(e.name));
  const missing = art.warn.filter((w) => /재질 접합/.test(w));
  if (missing.length) throw new Error(`${id}: ${missing.join(" / ")}`);
  for (const sfx of suffixes) {
    const file = P.map(id + sfx);
    const map = MapBuilder.read(file);
    const have = map.listEntities().filter((e) => /\/ArtJoin\d+$/.test(String(e.path || "")));
    if (have.length) throw new Error(`${file}: 이미 ArtJoin ${have.length}개 — 덧붙이지 않음`);
    for (const e of joins) map.placeModel(e.name, P.model("Objects/ArtSprite"), { pos: e.pos, componentOverrides: e.overrides });
    map.write(file);
    console.log(`  ${id + sfx}: ArtJoin ${joins.length}개 덧붙임 → ${joins.map((e) => `${e.name}(${e.pos.join(",")})`).join(" ")}`);
  }
}
