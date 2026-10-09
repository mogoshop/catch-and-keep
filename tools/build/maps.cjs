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

// 맵 크기(타일, 1칸 = 1월드 단위): 가로 x = -w/2 .. w/2-1, 세로 y = -h/2+1 .. h/2 (메이커 기본 RectTile 격자와 같은 기준)
function edges(d) {
  const w = num(d.w, 14), h = num(d.h, 8);
  return { left: -(w / 2) + 1, right: w / 2 - 1, bottom: -(h / 2) + 1, top: h / 2, w, h };
}
// 포털 앞 도착 위치 (포털에서 안쪽으로 1.4칸)
const arriveLeft = (d) => [edges(d).left + 1.4, 0];
const arriveRight = (d) => [edges(d).right - 1.4, 0];

// 이번 빌드가 놓을 엔티티 목록
//   마을 → 필드 사슬(order 순, 왼쪽 GateBack·오른쪽 GateNext) → 보스 방
//   곁가지 던전(kind=side): 부모 필드의 entry 위치에 입구(Gate_<첫 층>), 층끼리는 GateBack/GateNext, 마지막 층은 막다른 곳 (D2)
function desiredEntities(d, maps, ctx) {
  const out = [];
  const place = (name, model, p, overrides) => out.push({ name, model, pos: p, overrides });
  const fields = maps.filter((m) => m.kind === "field");
  const town = maps.find((m) => m.kind === "town");
  const townArrival = [ctx.townArrival.x, ctx.townArrival.y];
  const e = edges(d);

  if (d.kind === "town") {
    const first = fields[0];
    place("GateToField", "Objects/WarpGate", [townArrival[0], ctx.townExitY ?? townArrival[1] - 1.4, 0], { "script.WarpGate": gate(first.id, arriveLeft(first), first.name) });
  } else if (d.kind === "field") {
    const i = fields.indexOf(d);
    const prev = i === 0 ? town : fields[i - 1];
    const next = i === fields.length - 1 ? town : fields[i + 1];
    place("GateBack", "Objects/WarpGate", [e.left, 0, 0], { "script.WarpGate": gate(prev.id, prev === town ? townArrival : arriveRight(prev), prev.name) });
    place("GateNext", "Objects/WarpGate", [e.right, 0, 0], { "script.WarpGate": gate(next.id, next === town ? townArrival : arriveLeft(next), next.name) });
    // 이 필드에 딸린 곁가지 던전 입구
    const firstFloor = maps.find((m) => m.kind === "side" && m.parent === d.id && m.entry !== "");
    if (firstFloor) {
      const p = pos(firstFloor.entry);
      place(`Gate_${firstFloor.id}`, "Objects/WarpGate", p, { "script.WarpGate": gate(firstFloor.id, arriveLeft(firstFloor), firstFloor.name) });
    }
  } else if (d.kind === "side") {
    const floors = maps.filter((m) => m.kind === "side" && m.parent === d.parent);
    const i = floors.indexOf(d);
    if (i === 0) {
      const parent = maps.find((m) => m.id === d.parent);
      const back = pos(d.entry);
      place("GateBack", "Objects/WarpGate", [e.left, 0, 0], { "script.WarpGate": gate(parent.id, [back[0], back[1] - 1.4], parent.name) });
    } else {
      const prev = floors[i - 1];
      place("GateBack", "Objects/WarpGate", [e.left, 0, 0], { "script.WarpGate": gate(prev.id, arriveRight(prev), prev.name) });
    }
    if (i < floors.length - 1) {
      const next = floors[i + 1];
      place("GateNext", "Objects/WarpGate", [e.right, 0, 0], { "script.WarpGate": gate(next.id, arriveLeft(next), next.name) });
    }
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
  for (const ex of list(d.extra)) {
    const x = at(ex);
    if (x.name === "depthgate") place("DepthEntrance", "Objects/DepthGate", x.pos, { "script.DepthGate": { Action: "enter" } });
    else if (x.name.startsWith("npc:")) {
      const n = ctx.npcs[x.name.slice(4)];
      place(n.model, `NPC/${n.model}`, x.pos);
    } else if (x.name.startsWith("altar:")) {
      place("BloodAltar", "Objects/BloodAltar", x.pos, { "script.QuestMarker": { MarkerId: x.name.slice(6) } });
    } else throw new Error(`maps.csv ${d.id} extra '${ex}' 알 수 없음`);
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
    // 출현 범위 = 맵 가장자리에서 2칸 안쪽 (포털 앞은 비워 둔다)
    const e = edges(d);
    map.patchComponent("Spawner", "script.MonsterSpawner", {
      Entries: d.spawns, EliteChance: num(d.eliteChance),
      VariantChance: d.variantChance === "" ? -1 : num(d.variantChance),
      PackSize: Math.max(1, num(d.packSize, 1)), RespawnSec: num(d.respawnSec, 10),
      AreaMin: { x: e.left + 2, y: e.bottom + 1.5 }, AreaMax: { x: e.right - 2, y: e.top - 1.5 },
    });
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

// maps.csv와 맵 빌드가 같은 기준으로 쓰는 맥락 (gen_data의 미니맵 정보도 이것을 쓴다)
function context() {
  const monsters = load("monsters");
  const npcs = load("npcs");
  const cfg = Object.fromEntries(load("config").map((r) => [r.key, num(r.value)]));
  return {
    townArrival: { x: cfg.townArrivalX, y: cfg.townArrivalY },
    townExitY: cfg.townExitY,
    monsters: Object.fromEntries(monsters.map((m) => [m.id, m])),
    npcs: Object.fromEntries(npcs.map((n) => [n.model, n])),
    managed: managedModelIds(monsters, npcs),
  };
}

// 미니맵 표시물: 맵 빌드가 놓는 엔티티(포털·웨이포인트·NPC·심도 입구·제단·고정 보스)와 같은 위치
function minimapFeatures(d, maps) {
  const ctx = context();
  const out = [];
  for (const e of desiredEntities(d, maps, ctx)) {
    const src = e.model;
    let kind = "";
    if (e.name.startsWith("Gate")) kind = "portal";
    else if (e.name === "Waypoint") kind = "waypoint";
    else if (e.name === "DepthEntrance") kind = "depth";
    else if (e.name === "BloodAltar") kind = "altar";
    else if (src.startsWith("NPC/")) kind = ((ctx.npcs[e.name] || {}).kind === "quest") ? "quest" : "npc";
    else if (src.startsWith("Region")) kind = "boss";
    if (kind === "") continue;
    let label = "";
    if (kind === "portal") label = e.overrides["script.WarpGate"].Label;
    if (kind === "npc" || kind === "quest") label = (ctx.npcs[e.name] || {}).name || "";
    out.push({ kind, x: e.pos[0], y: e.pos[1], label, targetMap: kind === "portal" ? e.overrides["script.WarpGate"].TargetMap : "" });
  }
  return out;
}

function run() {
  const maps = load("maps").sort((a, b) => num(a.order) - num(b.order));
  const diffs = load("difficulty").filter((x) => num(x.index) > 0);
  const ctx = context();
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

module.exports = { run, edges, minimapFeatures };
