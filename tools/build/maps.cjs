// 맵 생성: maps.csv(보통 난이도) → 배치·설정, difficulty.csv → 악몽·지옥 복제.
// 타일·지형은 사용자가 메이커에서 칠한다. 빌드는 타일을 건드리지 않고 "관리 대상" 엔티티(포털·화로·스포너·
// 웨이포인트·심도 입구·NPC·고정 몬스터·제단)만 CSV와 같게 맞춘다. CSV에서 빠진 관리 대상은 지운다.
"use strict";
const fs = require("fs");
const { MapBuilder, readIfExists, preserveIds, P, pos, at, list, load, num, bool, quiet, exists } = require("./lib.cjs");

const MANAGED_PATH = /^(Gate\w*|Torch\d+|Spawner|Waypoint|DepthEntrance|BloodAltar)$/;

function managedModelIds(monsters, npcs) {
  return new Set(["warpgate", "brazier", "bloodaltar", "waypoint", "depthgate", ...monsters.map((m) => m.id), ...npcs.map((n) => n.id)]);
}

// 이번 빌드가 놓을 엔티티 목록 (이름 → 배치 함수)
function desiredEntities(d, maps, ctx) {
  const out = [];
  const place = (name, model, p, overrides) => out.push({ name, model, pos: p, overrides });
  const fields = maps.filter((m) => m.kind === "field");
  const town = maps.find((m) => m.kind === "town");
  const townArrival = [0, -1.2];

  if (d.kind === "town") {
    const first = fields[0];
    place("GateToField", "Objects/WarpGate", [0, -2.8, 0], { "script.WarpGate": gate(first.id, [-4.6, 0], first.name) });
  } else if (d.kind === "field") {
    const i = fields.indexOf(d);
    const prev = i === 0 ? town : fields[i - 1];
    const next = i === fields.length - 1 ? town : fields[i + 1];
    place("GateBack", "Objects/WarpGate", [-6, 0, 0], { "script.WarpGate": gate(prev.id, prev === town ? townArrival : [4.6, 0], prev.name) });
    place("GateNext", "Objects/WarpGate", [6, 0, 0], { "script.WarpGate": gate(next.id, next === town ? townArrival : [-4.6, 0], next.name) });
  }
  list(d.torches).forEach((t, k) => place(`Torch${k + 1}`, "Objects/Brazier", pos(t)));
  if (d.waypoint !== "") {
    const w = at(d.waypoint);
    place("Waypoint", "Objects/Waypoint", w.pos, { "script.Waypoint": { WaypointId: w.name } });
  }
  for (const f of list(d.fixed)) {
    const x = at(f);
    const m = ctx.monsters[x.name];
    place(m.model, `Region${m.region}/${m.model}`, x.pos);
  }
  for (const e of list(d.extra)) {
    const x = at(e);
    if (x.name === "depthgate") place("DepthEntrance", "Objects/DepthGate", x.pos, { "script.DepthGate": { Action: "enter" } });
    else if (x.name.startsWith("npc:")) {
      const n = ctx.npcs[x.name.slice(4)];
      place(n.model, `NPC/${n.model}`, x.pos);
    } else if (x.name.startsWith("altar:")) {
      place("BloodAltar", "Objects/BloodAltar", x.pos, { "script.QuestMarker": { MarkerId: x.name.slice(6) } });
    } else throw new Error(`maps.csv ${d.id} extra '${e}' 알 수 없음`);
  }
  return out;
}

function gate(target, p, label) {
  return { TargetMap: target, TargetPos: { x: p[0], y: p[1] }, Label: label };
}

function ambience(d) {
  return {
    "@type": "script.MapAmbience", Enable: true,
    DisplayName: d.name, Ambient: num(d.ambient), PlayerLightRadius: num(d.lightRadius),
    Bgm: d.bgm, Wind: bool(d.wind), Crows: bool(d.crows), Difficulty: 0, LevelBonus: 0,
  };
}

function buildNormal(d, maps, ctx) {
  const file = P.map(d.id);
  const map = exists(file) ? MapBuilder.read(file) : MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), d.id);
  map.upsertComponent(d.id, "script.MapAmbience", ambience(d));

  if (d.kind === "instance") {
    // 저장 파일의 필드 이름은 IsInstanceMap (스크립트 API 이름은 InstanceMap)
    const mc = Object.assign({}, map.component(d.id, "MOD.Core.MapComponent"));
    delete mc.InstanceMap;
    mc.IsInstanceMap = true;
    map.upsertComponent(d.id, "MOD.Core.MapComponent", mc);
    map.upsertComponent(d.id, "script.DepthDirector", { "@type": "script.DepthDirector", Enable: true });
  }

  const desired = desiredEntities(d, maps, ctx);
  const keep = new Set(desired.map((e) => e.name));
  if (d.spawns !== "") keep.add("Spawner");
  // CSV에서 빠진 관리 대상 정리
  const managed = ctx.managed;
  for (const e of map.listEntities()) {
    const leaf = e.path.split("/").pop();
    if (e.path.split("/").length !== 4) continue; // /maps/<id>/<leaf> 만
    const isManaged = MANAGED_PATH.test(leaf) || (e.modelId && managed.has(e.modelId));
    if (isManaged && !keep.has(leaf)) map.remove(e.path);
  }
  for (const e of desired) map.placeModel(e.name, P.model(e.model), { pos: e.pos, componentOverrides: e.overrides || {} });
  if (d.spawns !== "") {
    map.empty("Spawner", { pos: [0, 0, 0], scripts: ["script.MonsterSpawner"] });
    map.patchComponent("Spawner", "script.MonsterSpawner", { Entries: d.spawns, EliteChance: num(d.eliteChance) });
  }
  map.write(file);
}

// 악몽·지옥 복제: 보통 맵 + 이름·어둠·레벨 가산·포털 대상 접미사.
// 이미 있는 복제본의 엔티티 id는 경로가 같으면 유지한다 (다시 빌드해도 diff가 생기지 않게)
function buildCopy(d, diff) {
  const name = d.id + diff.mapSuffix;
  const file = P.map(name);
  const map = MapBuilder.fromTemplate(P.map(d.id), name);
  const amb = map.component(name, "script.MapAmbience");
  map.patchComponent(name, "script.MapAmbience", {
    DisplayName: `[${diff.name}] ${amb.DisplayName}`,
    Ambient: Math.round(amb.Ambient * num(diff.ambientMul) * 1000) / 1000,
    Difficulty: num(diff.index), LevelBonus: num(diff.levelBonus),
  });
  for (const e of map.listEntities()) {
    const g = map.component(e.path, "script.WarpGate");
    if (g && g.TargetMap) map.patchComponent(e.path, "script.WarpGate", { TargetMap: g.TargetMap + diff.mapSuffix });
  }
  map.write(file);
}

function run() {
  const maps = load("maps").sort((a, b) => num(a.order) - num(b.order));
  const diffs = load("difficulty").filter((x) => num(x.index) > 0);
  const monsters = load("monsters");
  const npcs = load("npcs");
  const ctx = {
    monsters: Object.fromEntries(monsters.map((m) => [m.id, m])),
    npcs: Object.fromEntries(npcs.map((n) => [n.model, n])),
    managed: managedModelIds(monsters, npcs),
  };
  let copies = 0;
  quiet(() => {
    for (const d of maps) buildNormal(d, maps, ctx);
    for (const d of maps.filter((m) => m.kind !== "instance")) {
      for (const diff of diffs) {
        const file = P.map(d.id + diff.mapSuffix);
        const previous = readIfExists(file);
        buildCopy(d, diff);
        preserveIds(file, previous);
        copies++;
      }
    }
  });
  console.log(`  맵: 보통 ${maps.length} · 난이도 복제 ${copies}`);
}

module.exports = { run };
