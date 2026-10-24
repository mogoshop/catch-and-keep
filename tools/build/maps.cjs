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
    // 봉인 문 (10-23): 이 맵이 gate 의뢰의 문지기 맵(map1)이면 앞으로 가는 문은 그 문지기를 쓰러뜨려야 지난다 (WarpGate.SealGate).
    // 문지기 맵과 보스 맵 사이에 맵이 더 있어도(심연의 문 3층 → 재의 회랑 · 심장의 다리 · 옥좌의 전실 → 옥좌) 문지기 맵을 나가는 문 하나만 잠근다
    const sealQ = (ctx.quests || []).find((q) => q.kind === "gate" && q.map1 === d.id && q.gate);
    const nextGate = gate(next.id, next === town ? townArrival : arriveLeft(next), next.name);
    if (sealQ) nextGate.SealGate = sealQ.gate;
    place("GateNext", "Objects/WarpGate", [e.right, 0, 0], { "script.WarpGate": nextGate });
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
    // 액트 마을마다 붉은 심도 포탈 (10-20: 심도는 액트별 — 그 액트 레벨대·몬스터, 해금은 액트 마지막 의뢰)
    // 10-24 사용자: 심연은 일단 숨긴다 (config depthEnabled 0이면 포탈을 놓지 않는다 — 다시 켜면 1)
    if (x.name === "depthgate") { if (DEPTH_ON) place("DepthEntrance", "Objects/DepthGate", x.pos, { "script.DepthGate": { Action: "enter", Act: num(d.act || 1) } }); }
    else if (x.name.startsWith("npc:")) {
      const n = ctx.npcs[x.name.slice(4)];
      place(n.model, `NPC/${n.model}`, x.pos);
      // 발밑 그림자 (docs/design/31 §5): 맵 그림(Art*)으로 바닥 위·NPC 아래. 의뢰 23 뒤 하르크·미라·엘리안 것만 클라이언트가 끈다 (StoryPresence)
      if (n.kind !== "stash") place(`ArtShadow${n.model}`, "Objects/ArtSprite", [x.pos[0], x.pos[1] + 0.02, -0.02], {
        "MOD.Core.SpriteRendererComponent": { SpriteRUID: FOOT_SHADOW, SortingLayer: "MapLayer0", OrderInLayer: 1, DrawMode: 0 },
      });
      // 숯 (오렌의 고양이): 3장을 끝내면 하르크 오른쪽 발치에 앉는다. 그림은 StoryPresence가 ui_icons soot로 넣고 켠다
      if (n.kind === "smith") place("ArtSoot", "Objects/ArtSprite", [x.pos[0] + 0.6, x.pos[1] - 0.05, -0.03], {
        "MOD.Core.SpriteRendererComponent": { SpriteRUID: "", SortingLayer: "MapLayer0", OrderInLayer: 2, DrawMode: 0 },
      });
    } else if (x.name.startsWith("altar:")) {
      place("BloodAltar", "Objects/BloodAltar", x.pos, { "script.QuestMarker": { MarkerId: x.name.slice(6) } });
    } else throw new Error(`maps.csv ${d.id} extra '${ex}' 알 수 없음`);
  }
  const layout = layoutOf(d, out, ctx);
  for (const a of artEntities(d, maps, ctx, layout, out)) place(a.name, "Objects/ArtSprite", a.pos, a.overrides);
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
    if (t && t.Position) out.push({ path: e.path, x: t.Position.x, y: t.Position.y, model: e.modelId || "", scale: (t.Scale && t.Scale.x) || 1 });
  }
  return out;
}

// 메이커 장식(Decor_) 발밑 폭(월드 단위, 배율 1 기준). 다리는 밟고 지나가는 장식이라 막지 않는다
// NPC 발밑 그림자 (assets/claude-story-v1 foot-shadow · 그룹 OJYYQ)
const FOOT_SHADOW = "cabd4773c16c465a90cb46d571d1d623";

const DECOR_FOOT = { decorfence: 2.5, decorruins: 2, decordeadtree: 1, decorsarcophagus: 1.5, decorrockedge: 2, decorabyss: 3, decorwell: 1.5, decorbridge: 0 };

// 장식(Decor_) 발밑 칸을 막는다. 길·기능 자리 둘레(2칸)는 피하고, 지형 생성 맵에선 막아서 길이 끊기는 장식은 통과로 둔다
function blockDecor(d, layout, blocked, desired) {
  const near = desired.filter((e) => !/^Art/.test(e.name)).map((e) => [e.pos[0], e.pos[1]]);
  const open = (x, y) => (layout ? layout.isFloor(x, y) : true) && !blocked.has(`${x},${y}`);
  const reach = () => {
    if (!layout) return 0;
    const start = (layout.anchors || []).find((a) => a.kind === "portalW") || (layout.anchors || [])[0];
    if (!start) return 0;
    const sx = Math.floor(start.x), sy = Math.floor(start.y);
    const seen = new Set([`${sx},${sy}`]);
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
      }
    }
    return seen.size;
  };
  let before = reach();
  for (const p of decorPositions(d)) {
    const foot = DECOR_FOOT[p.model];
    if (!foot) continue;
    const cells = propFootprint(p.x, p.y, foot * 100 / 0.8, 0.8 * Math.abs(p.scale));
    if (cells.some((k) => {
      const [x, y] = k.split(",").map(Number);
      return (layout && (!layout.isFloor(x, y) || (layout.isRoad && layout.isRoad(x, y)))) || near.some(([fx, fy]) => Math.hypot(x + 0.5 - fx, y + 0.5 - fy) < 2);
    })) continue;
    const added = cells.filter((k) => !blocked.has(k));
    for (const k of added) blocked.add(k);
    if (layout) {
      const after = reach();
      if (after < before - added.length) { for (const k of added) blocked.delete(k); continue; }
      before = after;
    }
  }
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
// 장식 발밑 칸: 그림 가로의 60% · 발밑 한 줄을 막는다 (키 큰 장식도 윗부분은 원근상 뒤로 지나가 보이게 둔다)
// (10-10 9차 QA: 그림보다 넓게 막혀 보였다 — 그림 양옆의 투명 여백까지 막던 80% → 60%)
const PROP_WALL_TILE = 269;   // AshCampTiles 충돌 타일 (모든 맵 같은 타일셋)
// 모든 맵이 쓰는 타일셋. 새 맵은 빌더 템플릿 타일셋(번호가 다름)으로 만들어지므로 이것으로 바꾼다
// (10-11: depth2~4가 템플릿 타일셋으로 생겨 벽·충돌·미니맵 지형이 전부 어긋났다)
const DEPTH_ON = num((load("config").find((r) => r.key === "depthEnabled") || {}).value) > 0;
const PROJECT_TILESET = JSON.parse(fs.readFileSync(require("path").join(__dirname, "../../RootDesk/MyDesk/AshCampTiles.tileset"), "utf8")).EntryKey;
// 옆 칸은 그림이 그 칸의 35% 이상을 덮을 때만 막는다 (9차 QA: 폭 1.76칸 선반이 양옆으로 0.03칸 걸쳐 3칸을 막아,
// 선반 두 개와 벽이 이어진 줄이 8칸짜리 보이지 않는 벽이 됐다)
function propFootprint(x, y, wPx, scale) {
  const hw = (num(wPx, 128) * scale / 100) * 0.3;
  const cy = Math.floor(y), out = [];
  for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw - 1e-6); cx++) {
    const cover = Math.min(x + hw, cx + 1) - Math.max(x - hw, cx);
    if (cover >= 0.35 || cx === Math.floor(x)) out.push(`${cx},${cy}`);
  }
  return out;
}

// 자리마다 크기 흔들기 (0~999 뽑기 → 배율). 10-25 사용자: 「에셋 크기들이 다 너무 똑같아서 별로」
// 대부분은 0.8~1.15, 열에 둘은 확 작거나(0.65) 확 크게(1.35~1.5) — 같은 그림도 들쭉날쭉해 보이게
const SIZE_STEPS = [0.65, 0.78, 0.86, 0.93, 1, 1, 1.07, 1.15, 1.25, 1.4];
const sizeVar = (pick) => SIZE_STEPS[pick % SIZE_STEPS.length] * (0.97 + ((pick >> 4) % 7) / 100);
// 넓은 빈터 자리 고르기 (랜드마크 · 바닥 무늬 공용, 시드 고정): free(x, y)가 참인 칸 중 반경 r 안이 모두 free인 곳,
// 피할 점들(avoid: [x, y, 거리])에서 떨어지고 고른 자리끼리 gap 이상 떨어지게 count개
function pickSpots(bounds, free, r, count, seed, avoid, gap) {
  const rand = layoutGen.rng(seed);
  const cands = [];
  for (let x = bounds.x0 + 1; x < bounds.x1; x++) for (let y = bounds.y0 + 1; y < bounds.y1; y++) {
    let ok = true;
    for (let dx = -r; dx <= r && ok; dx++) for (let dy = -r; dy <= r && ok; dy++) if (!free(x + dx, y + dy)) ok = false;
    if (!ok) continue;
    const px = x + 0.5, py = y + 0.2;
    if (avoid.some(([ax, ay, d]) => Math.hypot(px - ax, py - ay) < d)) continue;
    cands.push({ x: px, y: py, k: rand() });
  }
  cands.sort((a, b) => a.k - b.k);
  const out = [];
  for (const c of cands) {
    if (out.length >= count) break;
    if (out.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < gap)) continue;
    out.push(c);
  }
  return out.map((c) => Object.assign(c, { pick: Math.floor(rand() * 1000) }));
}

function artEntities(d, maps, ctx, layout, fixed) {
  const art = ctx.art[d.id] || (layout ? {} : null);
  if (!art) return [];
  const blocked = new Set();
  ctx.propBlocked[d.id] = blocked;
  const block = (name, x, y, scale) => { for (const k of propFootprint(x, y, (ctx.sprites[name] || {}).w, scale)) blocked.add(k); };
  // 메이플식 장식(art_sprites kind prop-1x)은 예전 그림 × 0.8 크기로 원본 크기에 그렸다 → 배율을 1/0.8 하여 화면 크기는 그대로, 픽셀은 1:1
  const pscale = (name, sc) => ((ctx.sprites[name] || {}).kind === "prop-1x" ? sc / 0.8 : sc) * (ctx.propScale[name] || 1);
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
  const seedOf = (salt) => [...d.id].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), salt) >>> 0;
  const scaled = (o, sc) => Object.assign(o, { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(sc), y: r3(sc), z: 1 } } });
  // 랜드마크 (map_layouts·map_art landmarks): 사냥터마다 1~2개, 넓은 빈터 한가운데. 장식처럼 발밑 칸을 막는다
  // 10-25 사용자: 코덱스 맵 다채화 77종 — 「돌려 쓸 생각만 하지 말고 과감하게」
  const placeLandmarks = (names, bounds, free, avoid) => {
    // 7×7 빈터가 없으면 5×5로 (늪처럼 웅덩이가 촘촘한 맵)
    let spots = pickSpots(bounds, free, 3, names.length, seedOf(17), avoid, 12);
    if (spots.length < names.length) spots = pickSpots(bounds, free, 2, names.length, seedOf(17), avoid, 12);
    spots.forEach((c, i) => {
      const name = names[i];
      const sc = pscale(name, 0.8) * (0.92 + (c.pick % 20) / 100);
      const o = sprite(ruid(name), null, 1);
      o["MOD.Core.SpriteRendererComponent"].FlipX = c.pick % 2 === 1;
      block(name, c.x, c.y, sc);
      out.push({ name: `ArtLandmark${i + 1}`, pos: [r3(c.x), r3(c.y), -0.03], overrides: scaled(o, sc) });
    });
    return spots;
  };
  // 바닥 무늬 (decals · decalCount): 밟고 지나가는 납작한 그림 — 막지 않는다. 바닥·길 위, 장식 발밑은 피한다
  const placeDecals = (names, count, bounds, free, avoid) => {
    if (!names.length) return;
    pickSpots(bounds, free, 0, count, seedOf(29), avoid, 3.2).forEach((c, i) => {
      const name = names[c.pick % names.length];
      const sc = pscale(name, 0.8) * sizeVar(c.pick) * 1.05;
      const o = sprite(ruid(name), null, 1);
      o["MOD.Core.SpriteRendererComponent"].FlipX = (c.pick >> 2) % 2 === 1;
      out.push({ name: `ArtDecal${i + 1}`, pos: [r3(c.x), r3(c.y), -0.015], overrides: scaled(o, sc) });
    });
  };
  // 중심 (x, y) · 크기 (rw, rh)인 월드 사각형을 반복 그리기로 덮는 배치
  const tiled = (name, rid, x, y, rw, rh, z) => ({ name, pos: [r3(x - rw / 2 + S / 2), r3(y - rh / 2 + S / 2), z], overrides: sprite(rid, [rw / S, rh / S], 1) });
  const out = [];
  if (art.floor) out.push(tiled("ArtFloor", ruid(art.floor), cx, cy, w, h, 0));
  list(art.roads || "").forEach((r, k) => {
    const [x, y, rw, rh] = r.split("/").map(Number);
    out.push(tiled(`ArtRoad${k + 1}`, ruid(art.road), x, y, rw, rh, -0.01));
  });
  // 벽 칸마다 바위 9조각 (한 조각 = 1칸이 되게 1/1.28 축소, 같은 줄 같은 조각은 반복 그리기로 합침). 칸 (x, y) = 월드 [x, x+1]×[y, y+1]
  // 벽 안쪽(center) 조각은 아주 어둡게: 지하실 벽돌처럼 바닥 그림과 닮은 조각이 있어 두꺼운 벽 속이 걸을 수 있는 바닥처럼 보였다
  // (10-10 9차 QA: 캐릭터 아래가 넓게 비어 보이는데 미니맵으로는 막힌 곳 — 마우스로 끌어도 왜 멈추는지 몰랐다).
  // 바닥과 맞닿은 가장자리 조각은 그대로 두어 벽의 테두리는 보이고, 그 안은 맵 바깥처럼 어두운 덩어리로 읽힌다
  const WALL_CENTER_SHADE = 0.3;
  const walls = (lay, atlas, tint, prefix) => {
    const [tr, tg, tb] = (tint || "1/1/1").split("/").map(Number);
    const k = 1 / S;
    layoutGen.wallRuns(lay).forEach((r, i) => {
      const o = sprite(ruid(`${atlas}-borders-${r.piece}`), [r.len, 1], 1);
      const m = r.piece === "center" ? WALL_CENTER_SHADE : 1;
      o["MOD.Core.SpriteRendererComponent"].Color = { r: tr * m, g: tg * m, b: tb * m, a: 1 };
      o["MOD.Core.TransformComponent"] = { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: k, y: k, z: 1 } };
      out.push({ name: `${prefix}${i + 1}`, pos: [r.x + 0.5, r.y + 0.5, -0.02], overrides: o });
    });
  };
  if (layout) {
    // 지형 생성 맵: 바닥 그림(맵 전체) → 길 칸 그림 → 벽(충돌 타일 칸) → 장식(넓은 빈 곳)
    const spec = ctx.layouts[d.id];
    const k = 1 / S;
    const cellScale = { "$type": "MOD.Core.MODVector3, MOD.Core", x: k, y: k, z: 1 };
    // 바닥·길 색 (map_layouts floorTint · roadTint — 10-24 사용자: 액트 3 바다 맵이 액트 1 회색 바닥 그대로라 무채색이었다)
    const tintOf = (t) => { const [r, g, bl] = (t || "1/1/1").split("/").map(Number); return { r, g, b: bl, a: 1 }; };
    if (spec.floorArt) {
      const f = tiled("ArtFloor", ruid(spec.floorArt), cx, cy, w, h, 0);
      if (spec.floorTint) f.overrides["MOD.Core.SpriteRendererComponent"].Color = tintOf(spec.floorTint);
      out.push(f);
    }
    if (spec.roadArt) {
      layoutGen.roadRuns(layout).forEach((r, i) => {
        const o = sprite(ruid(spec.roadArt), [r.len, 1], 1);
        if (spec.roadTint) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(spec.roadTint);
        o["MOD.Core.TransformComponent"] = { Scale: cellScale };
        out.push({ name: `ArtRoad${i + 1}`, pos: [r.x + 0.5, r.y + 0.5, -0.01], overrides: o });
      });
    }
    walls(layout, spec.wall, spec.tint, "ArtWall");
    const anchorsAvoid = (layout.anchors || []).filter((a) => a.kind !== "decor").map((a) => [a.x, a.y, 4]);
    const openFloor = (x, y) => layout.isFloor(x, y) && !(layout.isRoad && layout.isRoad(x, y));
    const marks = placeLandmarks(list(spec.landmarks || ""), layout.bounds, openFloor, anchorsAvoid);
    const props = list(spec.props || "");
    if (props.length) {
      // 장식 이름 뒤 「*배율」은 이 맵에서만 그 장식을 더 키운다 (장식 자체 크기는 art_scale.csv).
      // 크기를 바꾼 장식이 하나라도 있는 맵은 같은 그림이 똑같이 찍혀 보이지 않게 자리마다 크기 ±12%와 좌우 뒤집기를 섞는다 (시드 고정이라 빌드마다 같다)
      const vary = true;   // 10-25: 모든 맵에서 크기·좌우를 섞는다 (예전엔 배율을 바꾼 장식이 있는 맵만)
      layoutGen.propSpots(layout, num(spec.propCount, 6), spec.seed).filter((p) => !marks.some((m) => Math.hypot(p.x + 0.5 - m.x, p.y + 0.2 - m.y) < 4)).forEach((p, i) => {
        const [name, mul] = props[p.pick % props.length].split("*");
        const ps = pscale(name, 0.8) * num(mul, 1) * (vary ? sizeVar(p.pick * 7 + 3) : 1);
        const o = sprite(ruid(name), null, 1);
        if (vary) o["MOD.Core.SpriteRendererComponent"].FlipX = (p.pick >> 3) % 2 === 1;
        block(name, p.x + 0.5, p.y + 0.2, ps);
        out.push({ name: `ArtProp${i + 1}`, pos: [p.x + 0.5, p.y + 0.2, -0.03], overrides: Object.assign(o, { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(ps), y: r3(ps), z: 1 } } }) });
      });
    }
    const solid = out.filter((e) => /^Art(Prop|Landmark)\d+$/.test(e.name)).map((e) => [e.pos[0], e.pos[1], 1.6]);
    placeDecals(list(spec.decals || ""), num(spec.decalCount, 0), layout.bounds, (x, y) => layout.isFloor(x, y), anchorsAvoid.map(([x, y]) => [x, y, 2]).concat(solid));
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
    // 흩뿌림 장식 (map_art scatter · scatterCount): 열린 맵 안쪽 빈 땅에 시드 고정으로 뿌린다.
    // 10-24 사용자: 액트 2 사냥터가 네 귀퉁이 장식 6개뿐이라 맨 모래밭이었다 — 길·포털 앞·기능 자리(제단·화로·웨이포인트)·고정 장식 곁은 비운다
    const fixedAvoid = (fixed || []).filter((e) => !/^Art/.test(e.name)).map((e) => [e.pos[0], e.pos[1], 4.5])
      .concat(list(art.props || "").map((p) => p.split("@")[1].split("/").map(Number).concat([4])));
    const roadRects = list(art.roads || "").map((r) => r.split("/").map(Number));
    const inOpen = (x, y) => inTiles(x, y) && !roadRects.some(([rx, ry, rw, rh]) => Math.abs(x + 0.5 - rx) < rw / 2 + 0.8 && Math.abs(y + 0.2 - ry) < rh / 2 + 1.2)
      && !(y > -4 && y < 3 && ((portalAt.w && x < tb.x0 + 4) || (portalAt.e && x > tb.x1 - 3)));
    const openMarks = placeLandmarks(list(art.landmarks || ""), tb, inOpen, fixedAvoid);
    const kinds = list(art.scatter || "");
    if (kinds.length) {
      const rand = layoutGen.rng([...d.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
      const roads = list(art.roads || "").map((r) => r.split("/").map(Number));
      const onRoad = (x, y) => roads.some(([rx, ry, rw, rh]) => Math.abs(x - rx) < rw / 2 + 0.8 && Math.abs(y - ry) < rh / 2 + 1.2);
      const keepOut = (fixed || []).filter((e) => !/^Art/.test(e.name)).map((e) => e.pos)
        .concat(list(art.props || "").map((p) => p.split("@")[1].split("/").map(Number)))
        .concat(openMarks.map((m) => [m.x, m.y, 4.5]));
      const nearPortal = (x, y) => y > -3.5 && y < 3 && ((portalAt.w && x < tb.x0 + 4) || (portalAt.e && x > tb.x1 - 3));
      const cands = [];
      for (let x = tb.x0 + 2; x <= tb.x1 - 1; x++) for (let y = tb.y0 + 1; y <= tb.y1 - 1; y++) {
        const px = x + 0.5, py = y + 0.2;
        if (onRoad(px, py) || nearPortal(px, py) || keepOut.some(([kx, ky, kd]) => Math.hypot(px - kx, py - ky) < (kd || 3))) continue;
        cands.push({ x: px, y: py, k: rand() });
      }
      cands.sort((p, q) => p.k - q.k);
      const picked = [];
      for (const c of cands) {
        if (picked.length >= num(art.scatterCount, 12)) break;
        if (picked.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < 4.2)) continue;
        picked.push(c);
      }
      picked.forEach((c, i) => {
        const name = kinds[Math.floor(rand() * kinds.length)];
        const s = pscale(name, 0.8) * sizeVar(Math.floor(rand() * 1000));
        const o = sprite(ruid(name), null, 1);
        o["MOD.Core.SpriteRendererComponent"].FlipX = rand() < 0.5;
        block(name, c.x, c.y, s);
        out.push({ name: `ArtScatter${i + 1}`, pos: [r3(c.x), r3(c.y), -0.03], overrides: Object.assign(o, { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(s), y: r3(s), z: 1 } } }) });
      });
    }
    const solidOpen = out.filter((e) => /^Art(Prop|Scatter|Landmark)\d+$/.test(e.name)).map((e) => [e.pos[0], e.pos[1], 1.6]);
    placeDecals(list(art.decals || ""), num(art.decalCount, 0), tb, inTiles, fixedAvoid.map(([x, y]) => [x, y, 2]).concat(solidOpen));
  }
  // 지형 생성 맵에 고정 장식을 더하면(map_art 같은 맵 행) 자동 장식 다음 번호부터 — 이름이 겹치면 엔티티 경로가 둘이 된다
  const placed = out.filter((e) => /^ArtProp\d+$/.test(e.name)).length;
  list(art.props || "").forEach((p, k) => {
    const [name, at, sc] = p.split("@").concat([]);
    const [x, y] = at.split("/").map(Number);
    const s = pscale(name, num(sc, 0.8));
    block(name, x, y, s);
    out.push({ name: `ArtProp${placed + k + 1}`, pos: [x, y, -0.03], overrides: Object.assign(sprite(ruid(name), null, 1), { "MOD.Core.TransformComponent": { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(s), y: r3(s), z: 1 } } }) });
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
    StatMul: num(d.statMul, 1),
  };
}

const LOBBY = "map01";   // 월드 시작 맵 = 정적 방의 로비 (빌드하지 않는다)

function buildNormal(d, maps, ctx) {
  const file = P.map(d.id);
  // 10-21 방 구조: map01은 월드 시작 맵이라 정적 방의 로비로 남고, 사냥터 「피 묻은 황무지」는 그 그림을 복제한 wasteland가 맡는다 (docs/design/30)
  const seed = d.id === "wasteland" && !exists(file) && exists(P.map(LOBBY)) ? P.map(LOBBY) : null;
  const map = exists(file) ? MapBuilder.read(file) : MapBuilder.fromTemplate(seed || MapBuilder.templatePath("rect"), d.id);
  if (map.component("RectTileMap", "MOD.Core.RectTileMapComponent")) {
    map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { TileSetRUID: PROJECT_TILESET });
  }
  map.upsertComponent(d.id, "script.MapAmbience", ambience(d));

  {
    // 10-21 방 구조 (docs/design/30): 로비(map01) 말고 모든 맵이 인스턴스 맵 — 마을·사냥터·보스 방은 게임 방(game:) 안에, 심연은 심연 방(depth:) 안에.
    // 저장 파일의 필드 이름은 IsInstanceMap (스크립트 API 이름은 InstanceMap)
    const mc = Object.assign({}, map.component(d.id, "MOD.Core.MapComponent"));
    delete mc.InstanceMap;
    mc.IsInstanceMap = true;
    map.upsertComponent(d.id, "MOD.Core.MapComponent", mc);
    // 메이커는 파일 머리의 Usage(1 = 인스턴스 맵)로 정적/인스턴스 방을 가른다. IsInstanceMap만 켜면 정적 방에 실린다
    // (10-11: 새로 만든 depth2~4가 "must be set to instance map"으로 다음 층 이동 실패)
    map.data.Usage = 1;
    if (d.kind === "instance") map.upsertComponent(d.id, "script.DepthDirector", { "@type": "script.DepthDirector", Enable: true });
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
  // 바닥 그림(ArtFloor)이 맵 전체를 덮는 맵: 메이커 장식(Decor_)은 그 그림 아래(순서 0, z 999)에 깔려 보이지 않는다.
  // 그런데 발밑을 충돌 칸으로 막아 「투명한데 못 지나가는 곳」이 됐다 (10-13 사용자 지적: 굶주린 굴 — 액트 1 지형 맵 43장에서 857칸).
  // 보이지 않는 장식은 끄고 막지 않는다. 바닥 그림이 없는 손으로 꾸민 맵(wasteland · 옛 map01)의 장식은 그대로 보이고 막는다
  const floorPainted = layout ? !!(ctx.layouts[d.id] || {}).floorArt : !!(ctx.art[d.id] || {}).floor;
  if (floorPainted) {
    for (const p of decorPositions(d)) map.patch(p.path, { enable: false });
  } else if (layout || ctx.art[d.id]) {
    if (!ctx.propBlocked[d.id]) ctx.propBlocked[d.id] = new Set();
    blockDecor(d, layout, ctx.propBlocked[d.id], desired);
  }
  if (layout) {
    const spec = ctx.layouts[d.id];
    const roadTile = spec.roadTile === "" ? -1 : num(spec.roadTile);
    const blocked = ctx.propBlocked[d.id] || new Set();
    const tileMap = layoutGen.tiles(layout, num(spec.floorTile), num(spec.wallTile), roadTile)
      .map((t) => (blocked.has(`${t.position.x},${t.position.y}`) ? Object.assign({}, t, { tileIndex: num(spec.wallTile) }) : t));
    map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { tileMap });
    // 안쪽 벽 칸에 묻힌 장식은 끈다 (배치가 바뀌어 다시 바닥이 되면 켠다). 맨 바깥 테두리 줄 장식은 그대로
    const lb = layout.bounds;
    for (const p of floorPainted ? [] : decorPositions(d)) {
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
    quests: load("quests"),
    art: Object.fromEntries(load("map_art").map((a) => [a.map, a])),
    sprites: Object.fromEntries(load("art_sprites").map((s) => [s.name, s])),
    // 장식별 크기 배율 (art_scale.csv — 천막·배·탑 같은 큰 구조물은 크게, 작은 잔해는 조금만. 10-24 사용자: 전부 같은 값이라 마을 천막이 너무 작았다)
    propScale: Object.fromEntries(load("art_scale").map((s) => [s.name, num(s.scale, 1)])),
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
