// 맵 생성: maps.csv(보통 난이도) → 배치·설정, difficulty.csv → 악몽·지옥 복제.
// 타일·지형은 사용자가 메이커에서 칠한다 (예외: map_layouts.csv에 있는 던전은 빌드가 방·통로 타일을 만든다 — 10-10 사용자 승인).
// 빌드는 그 밖의 타일을 건드리지 않고 "관리 대상" 엔티티(포털·화로·스포너·
// 웨이포인트·심도 입구·NPC·고정 몬스터·제단)만 CSV와 같게 맞춘다. CSV에서 빠진 관리 대상은 지운다.
"use strict";
const fs = require("fs");
const { MapBuilder, readIfExists, preserveIds, P, pos, at, list, load, num, bool, quiet, exists } = require("./lib.cjs");
const layoutGen = require("./layout.cjs");

const MANAGED_PATH = /^(Gate\w*|Torch\d+|Spawner|Waypoint|DepthEntrance|BloodAltar|Art\w+)$/;

function managedModelIds(monsters, npcs) {
  return new Set(["warpgate", "brazier", "bloodaltar", "waypoint", "depthgate", "artsprite", ...monsters.map((m) => m.id), ...npcs.map((n) => n.id)]);
}

// 맵 크기(타일, 1칸 = 1월드 단위): 가로 x = -w/2 .. w/2-1, 세로 y = -h/2+1 .. h/2 (메이커 기본 RectTile 격자와 같은 기준)
function edges(d) {
  const w = num(d.w, 14), h = num(d.h, 8);
  return { left: -(w / 2) + 1, right: w / 2 - 1, bottom: -(h / 2) + 1, top: h / 2, w, h };
}
// 포털 앞 도착 위치 (포털에서 안쪽으로 1.4칸)
const arriveLeft = (d) => [edges(d).left + 1.4, 0];
const arriveRight = (d) => [edges(d).right - 1.4, 0];

// 곁가지 던전 하나 = entry가 있는 첫 층 + 바로 뒤따르는(entry 없는) 층들. 한 필드에 던전이 여러 개 붙을 수 있다
function dungeonFloors(maps, m) {
  let cur = [];
  for (const x of maps.filter((y) => y.kind === "side" && y.parent === m.parent)) {
    if (x.entry !== "") cur = [];
    cur.push(x);
    if (x === m) break;
  }
  const rest = maps.filter((y) => y.kind === "side" && y.parent === m.parent);
  for (let k = rest.indexOf(m) + 1; k < rest.length && rest[k].entry === ""; k++) cur.push(rest[k]);
  return cur;
}

// 이번 빌드가 놓을 엔티티 목록
//   액트마다: 그 액트의 마을 → 필드 사슬(order 순, 왼쪽 GateBack·오른쪽 GateNext) → 보스 방 (액트 사이는 카라반 NPC가 잇는다)
//   곁가지 던전(kind=side): 부모 필드의 entry 위치에 입구(Gate_<첫 층>), 층끼리는 GateBack/GateNext, 마지막 층은 막다른 곳 (D2)
function desiredEntities(d, maps, ctx) {
  const out = [];
  const place = (name, model, p, overrides) => out.push({ name, model, pos: p, overrides });
  const act = d.act || "1";
  const fields = maps.filter((m) => m.kind === "field" && (m.act || "1") === act);
  const town = maps.find((m) => m.kind === "town" && (m.act || "1") === act);
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
    // 이 필드에 딸린 곁가지 던전 입구 (던전마다 하나)
    for (const firstFloor of maps.filter((m) => m.kind === "side" && m.parent === d.id && m.entry !== "")) {
      const p = pos(firstFloor.entry);
      place(`Gate_${firstFloor.id}`, "Objects/WarpGate", p, { "script.WarpGate": gate(firstFloor.id, arriveLeft(firstFloor), firstFloor.name) });
    }
  } else if (d.kind === "side") {
    const floors = dungeonFloors(maps, d);
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
  // 같은 고정 몬스터가 여러 번 나오면 엔티티 이름에 번호 (사원 문지기 두 형제)
  const fixedCount = {};
  for (const f of list(d.fixed)) fixedCount[at(f).name] = (fixedCount[at(f).name] || 0) + 1;
  const fixedSeen = {};
  for (const f of list(d.fixed)) {
    const x = at(f);
    const m = ctx.monsters[x.name];
    fixedSeen[x.name] = (fixedSeen[x.name] || 0) + 1;
    const name = fixedCount[x.name] > 1 ? `${m.model}${fixedSeen[x.name]}` : m.model;
    place(name, `Region${m.region}/${m.model}`, x.pos);
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
  const layout = layoutOf(d, out, ctx);
  for (const a of artEntities(d, maps, ctx, layout)) place(a.name, "Objects/ArtSprite", a.pos, a.overrides);
  return out;
}

function decorPositions(d) {
  const file = P.map(d.id);
  if (!exists(file)) return [];
  const map = MapBuilder.read(file);
  const out = [];
  for (const e of map.listEntities()) {
    const parts = e.path.split("/");
    if (parts.length !== 4 || !/^Decor/.test(parts[3])) continue;
    const t = map.component(e.path, "MOD.Core.TransformComponent");
    if (t && t.Position) out.push({ path: e.path, x: t.Position.x, y: t.Position.y });
  }
  return out;
}

// 통로 배치가 있는 맵: 지금까지 놓은 기능 엔티티 자리를 방·길로 삼아 배치를 만든다 (맵마다 한 번)
function layoutOf(d, entities, ctx) {
  const spec = ctx.layouts[d.id];
  if (!spec) return null;
  if (ctx.layoutCache[d.id]) return ctx.layoutCache[d.id];
  const e = edges(d);
  const anchors = entities.map((x) => ({
    x: x.pos[0], y: x.pos[1],
    kind: x.name === "GateBack" && x.pos[0] === e.left ? "portalW" : x.name === "GateNext" && x.pos[0] === e.right ? "portalE" : /^Torch/.test(x.name) ? "room" : "stop",
  }));
  // 메이커에서 놓은 장식(Decor_) 자리: 필드는 그 칸을 바닥으로 남긴다 (동굴 미로는 벽에 묻힌 장식을 끈다 — buildNormal)
  for (const p of decorPositions(d)) anchors.push({ x: p.x, y: p.y, kind: "decor" });
  const layout = layoutGen.generate(d, spec, anchors);
  ctx.layoutCache[d.id] = layout;
  return layout;
}

// 맵 그림 (data/map_art.csv · art_sprites.csv): 반복 그리기 바닥 + 길 띠 + 9분할 테두리 + 장식.
// 타일맵(통행 판정, OrderInLayer 0) 위에 OrderInLayer 1로 덮고, 캐릭터·NPC(2 이상) 아래에 깐다. 같은 층에선 Z가 작을수록 앞.
// 바닥 영역 = 타일 칸 전체: 칸 (x, y)는 월드 [x, x+1]×[y, y+1] (메이커 ToWorldPosition 실측 10-10: 칸 (1,-1) 중심 = (1.5, -0.5))
// → x -w/2 ~ w/2, y -h/2+1 ~ h/2+1. 테두리 한 칸 = 128px = 1.28
// 반복 그리기(Tiled) 측정값 (메이커 10-10): TiledSize = 그림 장 수(1.28 → 1.28장 = 1.64), 영역은 위치에 첫 장의 중심을 두고
// 오른쪽·위로 펼쳐진다 → 월드 사각형 [x0,x1]×[y0,y1]을 덮으려면 위치 = (x0+S/2, y0+S/2), TiledSize = (폭/S, 높이/S), S = 한 장 크기
// 장식 발밑 칸: 그림 가로의 80% · 발밑 한 줄을 막는다 (키 큰 장식도 윗부분은 원근상 뒤로 지나가 보이게 둔다)
const PROP_WALL_TILE = 269;   // AshCampTiles 충돌 타일 (모든 맵 같은 타일셋)
function propFootprint(x, y, wPx, scale) {
  const hw = (num(wPx, 128) * scale / 100) * 0.4;
  const cy = Math.floor(y), out = [];
  for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw - 1e-6); cx++) out.push(`${cx},${cy}`);
  return out;
}

function artEntities(d, maps, ctx, layout) {
  const art = ctx.art[d.id] || (layout ? {} : null);
  if (!art) return [];
  const blocked = new Set();
  ctx.propBlocked[d.id] = blocked;
  const block = (name, x, y, scale) => { for (const k of propFootprint(x, y, (ctx.sprites[name] || {}).w, scale)) blocked.add(k); };
  const ruid = (name) => {
    const s = ctx.sprites[name];
    if (!s) throw new Error(`map_art ${d.id}: 그림 '${name}'이 art_sprites.csv에 없음`);
    return s.ruid;
  };
  const w = num(d.w), h = num(d.h);
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2 + 1, y1 = h / 2 + 1;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, T = 1.28;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const sprite = (rid, size, order) => ({
    "MOD.Core.SpriteRendererComponent": Object.assign(
      { SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: order },
      size ? { DrawMode: 2, TiledSize: { x: r3(size[0]), y: r3(size[1]) } } : { DrawMode: 0 }),
  });
  const S = 1.28;
  // 중심 (x, y) · 크기 (rw, rh)인 월드 사각형을 반복 그리기로 덮는 배치
  const tiled = (name, rid, x, y, rw, rh, z) => ({ name, pos: [r3(x - rw / 2 + S / 2), r3(y - rh / 2 + S / 2), z], overrides: sprite(rid, [rw / S, rh / S], 1) });
  const out = [];
  if (art.floor) out.push(tiled("ArtFloor", ruid(art.floor), cx, cy, w, h, 0));
  list(art.roads || "").forEach((r, k) => {
    const [x, y, rw, rh] = r.split("/").map(Number);
    out.push(tiled(`ArtRoad${k + 1}`, ruid(art.road), x, y, rw, rh, -0.01));
  });
  // 벽 칸마다 바위 9조각 (한 조각 = 1칸이 되게 1/1.28 축소, 같은 줄 같은 조각은 반복 그리기로 합침). 칸 (x, y) = 월드 [x, x+1]×[y, y+1]
  const walls = (lay, atlas, tint, prefix) => {
    const [tr, tg, tb] = (tint || "1/1/1").split("/").map(Number);
    const k = 1 / S;
    layoutGen.wallRuns(lay).forEach((r, i) => {
      const o = sprite(ruid(`${atlas}-borders-${r.piece}`), [r.len, 1], 1);
      o["MOD.Core.SpriteRendererComponent"].Color = { r: tr, g: tg, b: tb, a: 1 };
      o["MOD.Core.TransformComponent"] = { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: k, y: k, z: 1 } };
      out.push({ name: `${prefix}${i + 1}`, pos: [r.x + 0.5, r.y + 0.5, -0.02], overrides: o });
    });
  };
  if (layout) {
    // 지형 생성 맵: 바닥 그림(맵 전체) → 길 칸 그림 → 벽(충돌 타일 칸) → 장식(넓은 빈 곳)
    const spec = ctx.layouts[d.id];
    const k = 1 / S;
    const cellScale = { "$type": "MOD.Core.MODVector3, MOD.Core", x: k, y: k, z: 1 };
    if (spec.floorArt) out.push(tiled("ArtFloor", ruid(spec.floorArt), cx, cy, w, h, 0));
    if (spec.roadArt) {
      layoutGen.roadRuns(layout).forEach((r, i) => {
        const o = sprite(ruid(spec.roadArt), [r.len, 1], 1);
        o["MOD.Core.TransformComponent"] = { Scale: cellScale };
        out.push({ name: `ArtRoad${i + 1}`, pos: [r.x + 0.5, r.y + 0.5, -0.01], overrides: o });
      });
    }
    walls(layout, spec.wall, spec.tint, "ArtWall");
    const props = list(spec.props || "");
    if (props.length) {
      layoutGen.propSpots(layout, num(spec.propCount, 6), spec.seed).forEach((p, i) => {
        const name = props[p.pick % props.length];
        block(name, p.x + 0.5, p.y + 0.2, 0.8);
        out.push({ name: `ArtProp${i + 1}`, pos: [p.x + 0.5, p.y + 0.2, -0.03], overrides: Object.assign(sprite(ruid(name), null, 1), { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: 0.8, y: 0.8, z: 1 } } }) });
      });
    }
  } else if (art.border) {
    // 열린 맵: 걷는 타일 바깥 두 칸에 바위 테두리 → 그림 경계 = 통행 경계 (테두리 위를 걸어 다니지 않는다)
    // 포털(GateBack 왼쪽 · GateNext 오른쪽)이 있는 쪽은 가운데 네 칸(y -2 ~ 2)을 어둡게 비워 출구로 보이게 한다
    const floors = d.kind === "side" ? dungeonFloors(maps, d) : [];
    const portalAt = { w: d.kind === "field" || d.kind === "side", e: d.kind === "field" || (d.kind === "side" && floors.indexOf(d) < floors.length - 1) };
    const tb = { x0: -w / 2, x1: w / 2 - 1, y0: -h / 2 + 1, y1: h / 2 };
    const inTiles = (x, y) => x >= tb.x0 && x <= tb.x1 && y >= tb.y0 && y <= tb.y1;
    const gap = (x, y) => y >= -2 && y <= 1 && ((portalAt.w && x < tb.x0) || (portalAt.e && x > tb.x1));
    const frame = { bounds: { x0: tb.x0 - 2, x1: tb.x1 + 2, y0: tb.y0 - 2, y1: tb.y1 + 2 }, isFloor: (x, y) => inTiles(x, y) || gap(x, y) };
    walls(frame, art.border, "1/1/1", "ArtBorder");
  }
  list(art.props || "").forEach((p, k) => {
    const [name, at, sc] = p.split("@").concat([]);
    const [x, y] = at.split("/").map(Number);
    const s = num(sc, 0.8);
    block(name, x, y, s);
    out.push({ name: `ArtProp${k + 1}`, pos: [x, y, -0.03], overrides: Object.assign(sprite(ruid(name), null, 1), { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: s, y: s, z: 1 } } }) });
  });
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
    Storm: num(d.storm, 0),
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
  const layout = ctx.layoutCache[d.id];
  if (layout) {
    const spec = ctx.layouts[d.id];
    const roadTile = spec.roadTile === "" ? -1 : num(spec.roadTile);
    const blocked = ctx.propBlocked[d.id] || new Set();
    const tileMap = layoutGen.tiles(layout, num(spec.floorTile), num(spec.wallTile), roadTile)
      .map((t) => (blocked.has(`${t.position.x},${t.position.y}`) ? Object.assign({}, t, { tileIndex: num(spec.wallTile) }) : t));
    map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { tileMap });
    // 안쪽 벽 칸에 묻힌 장식은 끈다 (배치가 바뀌어 다시 바닥이 되면 켠다). 맨 바깥 테두리 줄 장식은 그대로
    const lb = layout.bounds;
    for (const p of decorPositions(d)) {
      const x = Math.floor(p.x), y = Math.floor(p.y);
      const edge = x <= lb.x0 || x >= lb.x1 || y <= lb.y0 || y >= lb.y1;
      map.patch(p.path, { enable: edge || layout.isFloor(x, y) });
    }
  }
  // 장식 충돌 칸이 기능 자리(포털·NPC·웨이포인트·화로 등)를 막으면 빌드를 멈춘다
  for (const e of desired) {
    if (/^Art/.test(e.name)) continue;
    const k = `${Math.floor(e.pos[0])},${Math.floor(e.pos[1])}`;
    if ((ctx.propBlocked[d.id] || new Set()).has(k)) throw new Error(`${d.id}: 장식이 ${e.name} 자리(${k})를 막음`);
  }
  if (!layout && ctx.art[d.id]) {
    // 열린 그림 맵(액트 2·심도): 칠해 둔 타일은 그대로 두고 장식 발밑 칸만 충돌 타일로 (장식이 옮겨지면 예전 칸은 바닥으로 되돌린다)
    const blocked = ctx.propBlocked[d.id] || new Set();
    const comp = map.component("RectTileMap", "MOD.Core.RectTileMapComponent");
    const tileMap = (comp.tileMap || []).map((t) => {
      const k = `${t.position.x},${t.position.y}`;
      if (blocked.has(k)) return Object.assign({}, t, { tileIndex: PROP_WALL_TILE });
      if (t.tileIndex === PROP_WALL_TILE) return Object.assign({}, t, { tileIndex: 266 });
      return t;
    });
    map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { tileMap });
  }
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
    art: Object.fromEntries(load("map_art").map((a) => [a.map, a])),
    sprites: Object.fromEntries(load("art_sprites").map((s) => [s.name, s])),
    layouts: Object.fromEntries(load("map_layouts").map((l) => [l.map, l])),
    layoutCache: {},
    propBlocked: {},
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
  // MAPS_ONLY=town,oasis,... 이면 그 맵(과 난이도 복제)만 다시 만든다 — 다른 맵의 메이커 편집을 건드리지 않게
  const only = (process.env.MAPS_ONLY || "").split(",").filter((x) => x !== "");
  const target = only.length > 0 ? maps.filter((m) => only.includes(m.id)) : maps;
  if (only.length > 0 && target.length !== only.length) throw new Error(`MAPS_ONLY에 maps.csv에 없는 id: ${only.join(",")}`);
  let copies = 0;
  quiet(() => {
    for (const d of target) buildNormal(d, maps, ctx);
    for (const d of target.filter((m) => m.kind !== "instance")) {
      for (const diff of diffs) {
        const file = P.map(d.id + diff.mapSuffix);
        const previous = readIfExists(file);
        buildCopy(d, diff);
        preserveIds(file, previous);
        copies++;
      }
    }
  });
  console.log(`  맵: 보통 ${target.length} · 난이도 복제 ${copies}`);
}

module.exports = { run, edges, minimapFeatures };
