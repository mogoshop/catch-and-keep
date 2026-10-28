// 손으로 지은 맵 (data/handmade/<id>.txt 설계도 + <id>.csv 배치표 → map/<id>.map).
// 10-28 사용자: 「전체 66개 맵 퀄리티가 들쭉날쭉 — 맵 하나를 진짜 사람이 한 땀 한 땀 만든 것처럼」.
// 자동 생성기(layout.cjs)를 쓰지 않고 설계도의 칸을 그대로 타일·벽 그림으로 옮기고, 배치표의 좌표에 세트·장식·바닥 무늬를 놓는다.
//
// 설계도(.txt): `;` 줄은 지시문/주석, 나머지 줄이 격자 (한 글자 = 한 칸, 위가 북쪽). 지시문:
//   ;size W H                      맵 크기 (maps.csv w·h와 같아야 한다)
//   ;base <바닥그림> <색>             맵 전체 바탕 바닥 (art_sprites.csv floor)
//   ;zone <글자> <바닥그림|-> <색|-> <이름>   구역 바닥 (-: 바탕 그대로). 길·표식 칸은 가장 가까운 구역 글자를 따른다
//   ;road <글자> <길그림> <색> <이름>  길 칸 (타일 265 + 길 그림)
//   ;wall <글자> <9조각 묶음> <색> <이름>  벽 칸 (충돌 타일 269 + 바위 9조각 그림)
//   ;raised <9조각 묶음> <색> <이름>  담 윗면 맵 (10-28 사용자 「담 위에서 플레이하는 느낌」 시안): 걷는 칸 전체를 이 9조각으로 덮고(가장자리 = 낮은 칸과 맞닿은 면),
//                                    첫 벽 글자 칸은 그림 없이 바탕을 낮은 모래로 두며, 담 남쪽 아래 한 칸에 앞면·그 아래 그림자를 그린다. 다른 벽 글자(기둥 등)는 담 위의 벽으로 그대로
//   ;markers W E H T S R             표식 글자 (바닥으로 친다). 배치표의 기능 엔티티가 표식 1칸 안에 있는지 검사한다
// 배치표(.csv) kind: gate(target=·arrive=town|left|right) · torch · waypoint(name=id) · set(map_sets.csv) · prop · decal ·
//   cluster(name=그림|그림…, args r=반경;n=개수;seed=씨앗 — 시드 고정 흩뿌림, 바닥이 아니거나 길이면 피한다)
// 크기 규칙은 maps.cjs와 같다: 코덱스 prop 0.8배 · prop-1x 1배 · 둘 다 ×art_scale.csv, 메이플(mp-*)은 data/handmade/maple_sprites.csv scale.
// 피벗: 코덱스 그림은 발밑, 메이플 그림은 maple_sprites.csv ny(아래에서 잰 피벗 비율)만큼 올려 발이 좌표에 오게 한다.
"use strict";
const fs = require("fs");
const path = require("path");
const { MapBuilder, readIfExists, preserveIds, P, load, num, bool } = require("../lib.cjs");
const layoutGen = require("../layout.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const HM_DIR = path.join(ROOT, "data/handmade");
const S = 1.28;                       // 그림 한 장 = 1.28칸 (128px)
const TILE = { floor: 266, road: 265, wall: 269 };
const PROJECT_TILESET = JSON.parse(fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/AshCampTiles.tileset"), "utf8")).EntryKey;
const WALL_CENTER_SHADE = 0.3;        // 벽 속 조각은 어둡게 (maps.cjs와 같은 값)
const WALL_EDGE_SHADE = 0.68;         // 바닥에 닿은 center 조각 (얇은 벽·들판 안 바위) — 구멍이 아니라 바위 윗면으로 읽히게
const ROCK_DEPTH = 3;                 // 바닥에서 이 칸 수 안의 바위 속은 가장자리 그림으로 덮는다 (더 깊으면 검은 바깥)
const RAISED_FACE = 0.55;             // 담 윗면 맵: 담 남쪽 앞면(center 조각) 밝기
const RAISED_SHADOW = 0.32;           // 담 윗면 맵: 앞면 아래 그림자(검은 바위 속 조각) 불투명도
const r3 = (v) => Math.round(v * 1000) / 1000;
const key = (x, y) => `${x},${y}`;
const tintOf = (t) => { const [r, g, b] = (t || "1/1/1").split("/").map(Number); return { r, g, b, a: 1 }; };
const vec3 = (v) => ({ "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(v), y: r3(v), z: 1 });
const NEAR_FUNC = [2.2, 1.4];         // 기능 자리(포털·화로·웨이포인트) 곁은 비운다 (maps.cjs placePieces와 같은 폭)

// ───────── 설계도 ─────────
function parseBlueprint(id) {
  const text = fs.readFileSync(path.join(HM_DIR, id + ".txt"), "utf8");
  const bp = { id, w: 0, h: 0, base: null, zones: {}, roads: {}, walls: {}, markers: new Set(), rows: [] };
  for (const raw of text.split(/\r?\n/)) {
    if (raw.startsWith(";")) {
      const m = raw.slice(1).trim().split(/\s+/);
      if (m[0] === "size") { bp.w = Number(m[1]); bp.h = Number(m[2]); }
      else if (m[0] === "base") bp.base = { art: m[1], tint: m[2] };
      else if (m[0] === "zone") bp.zones[m[1]] = { art: m[2] === "-" ? null : m[2], tint: m[3] === "-" ? null : m[3], name: m.slice(4).join(" ") };
      else if (m[0] === "road") bp.roads[m[1]] = { art: m[2], tint: m[3], name: m.slice(4).join(" ") };
      else if (m[0] === "wall") bp.walls[m[1]] = { atlas: m[2], tint: m[3], name: m.slice(4).join(" ") };
      else if (m[0] === "raised") bp.raised = { atlas: m[1], tint: m[2], name: m.slice(3).join(" ") };
      else if (m[0] === "markers") for (const ch of m.slice(1)) bp.markers.add(ch);
      continue;
    }
    if (raw.trim() === "") continue;
    bp.rows.push(raw);
  }
  if (!bp.w || !bp.h) throw new Error(`${id}.txt: ;size 지시문이 없음`);
  if (bp.rows.length !== bp.h) throw new Error(`${id}.txt: 격자 ${bp.rows.length}줄 — ;size 세로 ${bp.h}줄이어야 함`);
  bp.rows.forEach((row, r) => { if (row.length !== bp.w) throw new Error(`${id}.txt: ${r + 1}번째 줄 ${row.length}글자 — ;size 가로 ${bp.w}글자여야 함`); });
  for (const row of bp.rows) for (const ch of row) {
    if (!(ch in bp.zones) && !(ch in bp.roads) && !(ch in bp.walls) && !bp.markers.has(ch)) throw new Error(`${id}.txt: 알 수 없는 글자 '${ch}'`);
  }
  // 칸 (x, y) ↔ 격자 (c, r): x = c - w/2, y = h/2 - r (maps.cjs edges · layout.cjs bounds와 같은 기준)
  bp.bounds = { x0: -bp.w / 2, x1: bp.w / 2 - 1, y0: -bp.h / 2 + 1, y1: bp.h / 2 };
  bp.at = (x, y) => {
    const c = x + bp.w / 2, r = bp.h / 2 - y;
    if (c < 0 || c >= bp.w || r < 0 || r >= bp.h) return null;
    return bp.rows[r][c];
  };
  bp.isWall = (x, y) => { const ch = bp.at(x, y); return ch === null || ch in bp.walls; };
  bp.isFloor = (x, y) => !bp.isWall(x, y);
  bp.isRoad = (x, y) => { const ch = bp.at(x, y); return ch !== null && ch in bp.roads; };
  bp.cells = () => { const out = []; for (let y = bp.bounds.y1; y >= bp.bounds.y0; y--) for (let x = bp.bounds.x0; x <= bp.bounds.x1; x++) out.push([x, y]); return out; };
  // 길·표식 칸의 구역: 가장 가까운 구역 글자 (벽을 넘지 않고 퍼뜨린다)
  const zone = new Map();
  const q = [];
  for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (ch in bp.zones) { zone.set(key(x, y), ch); q.push([x, y]); } }
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i], z = zone.get(key(x, y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!bp.isFloor(nx, ny) || zone.has(key(nx, ny))) continue;
      zone.set(key(nx, ny), z); q.push([nx, ny]);
    }
  }
  bp.zoneOf = (x, y) => zone.get(key(x, y)) || null;
  return bp;
}

function loadRows(id) { return fs.existsSync(path.join(HM_DIR, id + ".csv")) ? load("handmade/" + id) : []; }
const hasBlueprint = (id) => fs.existsSync(path.join(HM_DIR, id + ".txt"));
// 설계도 표식 칸 → 엔티티 자리 (칸 가운데). 포털(W·E·G·X)·입구(H)를 maps.cjs가 이것으로 놓는다
const markerCache = new Map();
function markers(id) {
  if (!markerCache.has(id)) {
    const bp = parseBlueprint(id), out = {};
    for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (bp.markers.has(ch)) (out[ch] = out[ch] || []).push([x + 0.5, y + 0.5]); }
    markerCache.set(id, { list: out, w: bp.w, h: bp.h });
  }
  return markerCache.get(id);
}
// 포털 앞 도착 자리: 표식에서 가장 가까운 맵 가장자리의 안쪽으로 1.4칸
function inward(id, p) {
  const { w, h } = markers(id);
  const dl = p[0] + w / 2, dr = w / 2 - p[0], db = p[1] + h / 2, dt = h / 2 - p[1];
  const m = Math.min(dl, dr, db, dt);
  if (m > 6) return [p[0], p[1] - 1.4];
  return m === dl ? [p[0] + 1.4, p[1]] : m === dr ? [p[0] - 1.4, p[1]] : m === db ? [p[0], p[1] + 1.4] : [p[0], p[1] - 1.4];
}
function parseArgs(text) { return Object.fromEntries((text || "").split(";").filter(Boolean).map((kv) => { const [k, v] = kv.split("="); return [k.trim(), (v || "").trim()]; })); }

// ───────── 그림 표 ─────────
function spriteTable(ctx) {
  const table = Object.assign({}, ctx.sprites);
  for (const m of load("handmade/maple_sprites")) table[m.name] = Object.assign({ kind: "maple" }, m);
  return table;
}
function spriteOf(table, name, where) {
  const sp = table[name];
  if (!sp) throw new Error(`${where}: 그림 '${name}'이 art_sprites.csv·maple_sprites.csv에 없음`);
  return sp;
}
function baseScale(sp, propScale) {
  if (sp.kind === "maple") return num(sp.scale, 1);
  return (sp.kind === "prop-1x" ? 1 : 0.8) * (propScale[sp.name] || 1);
}
// 장식 발밑 칸: 그림 가로의 60% · 발밑 한 줄 (maps.cjs propFootprint과 같다)
function footprint(x, y, wPx, scale) {
  const hw = (num(wPx, 128) * scale / 100) * 0.3;
  const cy = Math.floor(y), out = [];
  for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw - 1e-6); cx++) {
    const cover = Math.min(x + hw, cx + 1) - Math.max(x - hw, cx);
    if (cover >= 0.35 || cx === Math.floor(x)) out.push(key(cx, cy));
  }
  return out;
}

// ───────── 기능 엔티티 (포털·화로·웨이포인트) — maps.cjs desiredEntities와 같은 꼴 {name, model, pos, overrides} ─────────
const edgesOf = (d) => { const w = num(d.w), h = num(d.h); return { left: -(w / 2) + 1, right: w / 2 - 1, bottom: -(h / 2) + 1, top: h / 2 }; };
function functionalEntities(d, maps, ctx, rows) {
  rows = rows || loadRows(d.id);
  const out = [];
  let torch = 0;
  for (const r of rows) {
    const x = num(r.x), y = num(r.y);
    if (r.kind === "gate") {
      const a = parseArgs(r.args);
      const target = maps.find((m) => m.id === a.target);
      if (!target) throw new Error(`${d.id}.csv ${r.name}: target '${a.target}'이 maps.csv에 없음`);
      const e = edgesOf(target);
      const at = a.arrive === "town" ? [ctx.townArrival.x, ctx.townArrival.y] : a.arrive === "right" ? [e.right - 1.4, 0] : [e.left + 1.4, 0];
      out.push({ name: r.name, model: "Objects/WarpGate", pos: [x, y, 0], overrides: { "script.WarpGate": { TargetMap: target.id, TargetPos: { x: at[0], y: at[1] }, Label: target.name } } });
    } else if (r.kind === "torch") {
      out.push({ name: `Torch${++torch}`, model: "Objects/Brazier", pos: [x, y, 0] });
    } else if (r.kind === "waypoint") {
      out.push({ name: "Waypoint", model: "Objects/Waypoint", pos: [x, y, 0], overrides: { "script.Waypoint": { WaypointId: r.name } } });
    }
  }
  return out;
}

// ───────── 그림 엔티티 ─────────
function artEntities(d, ctx, bp, rows, func) {
  const table = spriteTable(ctx);
  const ruid = (name, where) => spriteOf(table, name, where).ruid;
  const out = [], warn = [], blocked = new Set(), feet = [];
  const b = bp.bounds, w = bp.w, h = bp.h;
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2 + 1, y1 = h / 2 + 1;
  const funcSpots = func.map((e) => e.pos);
  const nearFunc = (x, y) => funcSpots.some(([fx, fy]) => Math.abs(fx - x) < NEAR_FUNC[0] && Math.abs(fy - y) < NEAR_FUNC[1]);
  const sprite = (rid, size, order) => ({
    "MOD.Core.SpriteRendererComponent": Object.assign({ SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: order },
      size ? { DrawMode: 2, TiledSize: { x: r3(size[0]), y: r3(size[1]) } } : { DrawMode: 0 }),
  });
  // 중심 (cx, cy) · 크기 (rw, rh) 월드 사각형을 반복 그리기로 덮는다 (maps.cjs tiled와 같다)
  const tiled = (name, rid, cx, cy, rw, rh, z, tint) => {
    const o = sprite(rid, [rw / S, rh / S], 1);
    if (tint) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(tint);
    return { name, pos: [r3(cx - rw / 2 + S / 2), r3(cy - rh / 2 + S / 2), z], overrides: o };
  };
  // 1) 바탕 바닥 — 맵 전체
  out.push(tiled("ArtFloor", ruid(bp.base.art, "base"), (x0 + x1) / 2, (y0 + y1) / 2, w, h, 0, bp.base.tint));
  // 같은 열쇠 칸을 큰 사각형으로 묶는다 (위 왼쪽부터 오른쪽으로 늘리고, 그 폭 그대로 아래로 늘릴 수 있는 만큼)
  //   (10-28 엔티티 예산: 시안 1장 벽 529개 — 큰 맵 66장 × 난이도 3본이라 벽 엔티티를 줄여야 한다)
  const mergeRects = (pk) => {
    const rects = [], done = new Set();
    for (let y = b.y1; y >= b.y0; y--) for (let x = b.x0; x <= b.x1; x++) {
      const p = pk.get(key(x, y));
      if (!p || done.has(key(x, y))) continue;
      let xe = x;
      while (pk.get(key(xe + 1, y)) === p && !done.has(key(xe + 1, y))) xe++;
      let yb = y;
      const rowOk = (yy) => { for (let xx = x; xx <= xe; xx++) if (pk.get(key(xx, yy)) !== p || done.has(key(xx, yy))) return false; return true; };
      while (rowOk(yb - 1)) yb--;
      for (let yy = yb; yy <= y; yy++) for (let xx = x; xx <= xe; xx++) done.add(key(xx, yy));
      rects.push({ p, x, y: yb, len: xe - x + 1, rows: y - yb + 1 });
    }
    return rects;
  };
  const cellScale = { "MOD.Core.TransformComponent": { Scale: vec3(1 / S) } };
  // 9조각 고르기: open(x, y)가 참인 이웃 쪽이 가장자리 (벽 칸이면 바닥 쪽, 담 윗면 칸이면 낮은 모래 쪽)
  // 10-28 2차 검수: 바위(waste) 묶음의 center 조각은 그림 자체가 검은 공간이라, 얇은 벽(양쪽 바닥)·튀어나온 끝을 center로 그리면
  //   밝기를 올려도 검은 막대였다 → 얇은 벽은 가장자리 조각(가로는 n · 세로는 w), 세 면이 바닥인 끝은 붙은 쪽 반대 조각으로
  const pieceBy = (open) => (x, y) => {
    const n = open(x, y + 1), s = open(x, y - 1), e = open(x + 1, y), ww = open(x - 1, y);
    const cnt = n + s + e + ww;
    if (cnt === 4) return "n";
    if (cnt === 3) return !n ? "s" : !s ? "n" : !e ? "w" : "e";
    if (n && s) return "n";
    if (e && ww) return "w";
    if (n) return e ? "ne" : ww ? "nw" : "n";
    if (s) return e ? "se" : ww ? "sw" : "s";
    if (e) return "e";
    if (ww) return "w";
    return "center";
  };
  // 2-1) 담 윗면 맵: 걷는 칸(+ 담 위 기둥 칸)을 담 9조각으로, 낮은 칸(첫 벽 글자)은 바탕 모래 그대로 + 담 앞면·그림자
  const lowCh = bp.raised ? Object.keys(bp.walls)[0] : null;
  const isLow = (x, y) => { const ch = bp.at(x, y); return ch === null || ch === lowCh; };
  let raisedN = 0;
  if (bp.raised) {
    const rp = pieceBy(isLow), pk = new Map();
    // 10-28 코덱스 담 위 추가 6장: 앞면 3조각(sw·s·se) · 끊긴 담 끝(e·w)이 있는 묶음이면 그 그림을, 없으면 예전처럼 center를 어둡게
    const has = (n) => !!table[n];
    const A = bp.raised.atlas;
    const faceArt = has(`${A}-face-s`) && has(`${A}-face-sw`) && has(`${A}-face-se`);
    const brokenArt = has(`${A}-broken-e`) && has(`${A}-broken-w`);
    const isFace = (x, y) => isLow(x, y) && bp.at(x, y) !== null && !isLow(x, y + 1);
    for (const [x, y] of bp.cells()) {
      if (isLow(x, y)) {
        // 바로 위(북쪽)가 담이면 앞면(왼끝·가운데·오른끝), 두 칸 위가 담이고 바로 위가 앞면이면 그림자
        if (!isLow(x, y + 1)) pk.set(key(x, y), !faceArt ? "face" : !isFace(x - 1, y) ? "face-sw" : !isFace(x + 1, y) ? "face-se" : "face-s");
        else if (isLow(x, y + 1) && bp.at(x, y + 1) !== null && !isLow(x, y + 2)) pk.set(key(x, y), "shadow");
        continue;
      }
      let piece = rp(x, y);
      // 한 칸 너비 담길이 가로로 끝나는 칸(위·아래·한쪽이 낮음) = 무너진 담 끝
      if (brokenArt && (piece === "e" || piece === "w") && isLow(x, y + 1) && isLow(x, y - 1)) piece = `broken-${piece}`;
      pk.set(key(x, y), piece);
    }
    const t = tintOf(bp.raised.tint);
    for (const r of mergeRects(pk)) {
      const face = r.p === "face", shadow = r.p === "shadow";
      const own = r.p.startsWith("face-") || r.p.startsWith("broken-");
      const name = shadow ? "waste-borders-center" : own ? `${A}-${r.p}` : `${A}-borders-${face ? "center" : r.p}`;
      const o = sprite(ruid(name, "raised"), [r.len, r.rows], 1);
      const m = face ? RAISED_FACE : 1;
      o["MOD.Core.SpriteRendererComponent"].Color = shadow ? { r: 0, g: 0, b: 0, a: RAISED_SHADOW } : { r: t.r * m, g: t.g * m, b: t.b * m, a: 1 };
      out.push({ name: `ArtRaised${++raisedN}`, pos: [r.x + 0.5, r.y + 0.5, -0.005], overrides: Object.assign(o, cellScale) });
    }
  }
  // 2) 구역 바닥 — 같은 구역 칸을 줄 단위 사각형으로 묶어(위에서부터, 아래로 늘릴 수 있는 만큼) 반복 그리기 (담 윗면 맵은 담이 덮으므로 그리지 않는다)
  let zoneN = 0;
  for (const [ch, z] of Object.entries(bp.zones)) {
    if (!z.art || bp.raised) continue;
    const covered = new Set();
    const inZone = (x, y) => bp.isFloor(x, y) && bp.zoneOf(x, y) === ch && !covered.has(key(x, y));
    for (let y = b.y1; y >= b.y0; y--) for (let x = b.x0; x <= b.x1; x++) {
      if (!inZone(x, y)) continue;
      let xe = x;
      while (inZone(xe + 1, y)) xe++;
      let yb = y;
      const rowOk = (yy) => { for (let xx = x; xx <= xe; xx++) if (!inZone(xx, yy)) return false; return true; };
      while (rowOk(yb - 1)) yb--;
      for (let yy = yb; yy <= y; yy++) for (let xx = x; xx <= xe; xx++) covered.add(key(xx, yy));
      out.push(tiled(`ArtZone${++zoneN}`, ruid(z.art, `zone ${ch}`), (x + xe + 1) / 2, (yb + y + 1) / 2, xe - x + 1, y - yb + 1, -0.005, z.tint));
    }
  }
  // 3) 길 — 줄마다 이어진 구간 (칸 크기 그림)
  let roadN = 0;
  for (let y = b.y1; y >= b.y0; y--) {
    let cur = null;
    for (let x = b.x0; x <= b.x1 + 1; x++) {
      const ch = x <= b.x1 ? bp.at(x, y) : null;
      const on = ch !== null && ch in bp.roads ? ch : null;
      if (cur && on === cur.ch) { cur.len++; continue; }
      if (cur) {
        const rd = bp.roads[cur.ch];
        const o = sprite(ruid(rd.art, `road ${cur.ch}`), [cur.len, 1], 1);
        o["MOD.Core.SpriteRendererComponent"].Color = tintOf(rd.tint);
        out.push({ name: `ArtRoad${++roadN}`, pos: [cur.x + 0.5, y + 0.5, -0.01], overrides: Object.assign(o, cellScale) });
      }
      cur = on ? { ch: on, x, len: 1 } : null;
    }
  }
  // 4) 벽 — 바닥에 드러난 면의 조각 (layout.cjs wallRuns와 같은 규칙), 벽 글자마다 다른 9조각 묶음
  const f = (x, y) => bp.isFloor(x, y);
  const pieceAt = pieceBy(f);
  // 10-28 1차 검수: 얇은 벽(양쪽이 바닥)·들판 안 바위 덩어리가 「center」 0.3으로 검은 구멍처럼 보였다 →
  //   바닥에 닿은(8방향) center 조각은 WALL_EDGE_SHADE로 밝게, 바닥에서 떨어진 깊은 속만 어둡게
  const touchesFloor = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && f(x + dx, y + dy)) return true; return false; };
  // 10-28 3차 검수: 들판 안 두꺼운 바위(석상 뒤 5×4 등)의 속이 검은 구덩이처럼 보였다 →
  //   바닥에서 ROCK_DEPTH칸(8방향 거리) 안의 속 조각은 가장자리(n) 그림으로 덮어 바위 윗면으로, 그보다 깊은 바깥 덩어리만 검은 공간
  const depth = new Map(), dq = [];
  for (const [x, y] of bp.cells()) if (f(x, y)) { depth.set(key(x, y), 0); dq.push([x, y]); }
  for (let i = 0; i < dq.length; i++) {
    const [x, y] = dq[i], d0 = depth.get(key(x, y));
    if (d0 >= ROCK_DEPTH) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const k = key(x + dx, y + dy);
      if (depth.has(k) || bp.at(x + dx, y + dy) === null) continue;
      depth.set(k, d0 + 1); dq.push([x + dx, y + dy]);
    }
  }
  // 칸마다 조각 열쇠 → 같은 열쇠 칸을 큰 사각형으로 덮는다 (담 윗면 맵의 낮은 칸은 그리지 않는다 — 바탕 모래가 보인다)
  const pk = new Map();
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    const ch = bp.at(x, y);
    if (ch === null || !(ch in bp.walls) || ch === lowCh) continue;
    let piece = pieceAt(x, y);
    if (piece === "center" && !touchesFloor(x, y) && depth.has(key(x, y))) piece = "n";
    pk.set(key(x, y), `${ch}|${piece}|${piece === "center" && touchesFloor(x, y) ? 1 : 0}`);
  }
  let wallN = 0;
  for (const r of mergeRects(pk)) {
    const [wch, wpiece, lit] = r.p.split("|");
    const wl = bp.walls[wch];
    const o = sprite(ruid(`${wl.atlas}-borders-${wpiece}`, `wall ${wch}`), [r.len, r.rows], 1);
    const t = tintOf(wl.tint), m = wpiece !== "center" ? 1 : lit === "1" ? WALL_EDGE_SHADE : WALL_CENTER_SHADE;
    o["MOD.Core.SpriteRendererComponent"].Color = { r: t.r * m, g: t.g * m, b: t.b * m, a: 1 };
    out.push({ name: `ArtWall${++wallN}`, pos: [r.x + 0.5, r.y + 0.5, -0.02], overrides: Object.assign(o, cellScale) });
  }
  // 5) 장식·바닥 무늬: 아래(남쪽)에 있는 그림일수록 앞에 그린다 (z -0.034 ~ -0.026, 바닥 무늬는 -0.015)
  const zOf = (y, decal) => decal ? -0.015 : r3(-0.034 + ((y - b.y0) / (b.y1 - b.y0)) * 0.008);
  // ok: 배치표 args ok=cliff(일부러 절벽·담 위) · ok=gate(일부러 기능 자리 곁) · ok=gate+cliff(둘 다) — 그 경고를 끈다
  const place = (name, spName, x, y, scaleMul, flip, tint, decal, where, ok) => {
    const sp = spriteOf(table, spName, where);
    const sc = baseScale(sp, ctx.propScale) * num(scaleMul, 1);
    const cell = [Math.floor(x), Math.floor(y)];
    const okHas = (w) => String(ok || "").split("+").includes(w);   // ok=gate+cliff: 둘 다 일부러 (10-28 곁가지 올라가는 계단 — 벽에 붙고 포털 위)
    if (!bp.isFloor(cell[0], cell[1])) { if (!okHas("cliff")) warn.push(`${where}: '${spName}' (${x}, ${y})의 발이 벽 칸 ${cell} 위 — 절벽 위 장식이면 args ok=cliff, 아니면 좌표를 고친다`); }
    else if (!decal && bp.isRoad(cell[0], cell[1])) warn.push(`${where}: '${spName}' (${x}, ${y})의 발이 길 칸 위 — 막지 않는다 (길을 막는 장식은 길 밖으로)`);
    else if (!decal && nearFunc(x, y)) { if (!okHas("gate")) warn.push(`${where}: '${spName}' (${x}, ${y})이 기능 자리(포털·화로·웨이포인트) 곁 — 막지 않는다 (일부러면 args ok=gate)`); }
    else if (!decal) for (const k of footprint(x, y, sp.w, sc)) { const [cx, cy] = k.split(",").map(Number); if (bp.isFloor(cx, cy) && !bp.isRoad(cx, cy)) blocked.add(k); }
    if (!decal) feet.push([x, y]);
    const o = sprite(sp.ruid, null, 1);
    o["MOD.Core.SpriteRendererComponent"].FlipX = !!flip;
    const c = tint || sp.tint;
    if (c) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(c);
    o["MOD.Core.TransformComponent"] = { Scale: vec3(sc) };
    const py = y + (num(sp.ny, 0) * num(sp.h, 0) * sc) / 100;   // 발이 y에 오게 (메이플 피벗 보정)
    out.push({ name, pos: [r3(x), r3(py), zOf(y, decal)], overrides: o });
  };
  let propN = 0, decalN = 0, setN = 0, clN = 0;
  for (const r of rows) {
    const x = num(r.x), y = num(r.y), where = `${d.id}.csv ${r.kind} ${r.name || ""} @${r.x}/${r.y}`;
    if (r.kind === "prop") place(`ArtProp${++propN}`, r.name, x, y, r.scale, num(r.flip) === 1, r.tint, false, where, parseArgs(r.args).ok);
    else if (r.kind === "decal") place(`ArtDecal${++decalN}`, r.name, x, y, r.scale, num(r.flip) === 1, r.tint, true, where);
    else if (r.kind === "set") {
      const pieces = ctx.sets[r.name];
      if (!pieces) throw new Error(`${where}: 세트 '${r.name}'이 map_sets.csv에 없음`);
      const mirror = num(r.flip) === 1 ? -1 : 1, tag = `ArtSet${++setN}`;
      pieces.forEach((pc, k) => {
        const decal = pc.piece.startsWith("d:"), name = decal ? pc.piece.slice(2) : pc.piece;
        const px = x + num(pc.dx) * mirror, py = y + num(pc.dy);
        place(`${tag}_${k + 1}`, name, r3(px), r3(py), num(pc.scale, 1) * num(r.scale, 1), (num(pc.flip) === 1) !== (mirror < 0), null, decal, `${where} 조각 ${k + 1} '${name}'`);
      });
    } else if (r.kind === "cluster") {
      const a = parseArgs(r.args), names = r.name.split("|"), radius = num(a.r, 3), n = num(a.n, 4);
      const rand = layoutGen.rng(num(a.seed, 1) * 131 + ++clN);
      let placed = 0;
      for (let tries = 0; tries < n * 40 && placed < n; tries++) {
        const ang = rand() * Math.PI * 2, dist = Math.sqrt(rand()) * radius;
        const px = r3(x + Math.cos(ang) * dist), py = r3(y + Math.sin(ang) * dist * 0.75);
        const cx = Math.floor(px), cy = Math.floor(py);
        if (!bp.isFloor(cx, cy) || bp.isRoad(cx, cy) || blocked.has(key(cx, cy)) || nearFunc(px, py)) continue;
        if (feet.some(([fx, fy]) => Math.hypot(fx - px, fy - py) < 1.3)) continue;
        const name = names[Math.floor(rand() * names.length)], decal = /decal/.test(name);
        place(`ArtCl${clN}_${++placed}`, name, px, py, 0.85 + rand() * 0.3, rand() < 0.5, null, decal, `${where} 흩뿌림`);
      }
      if (placed < n) warn.push(`${where}: 흩뿌림 ${n}개 중 ${placed}개만 자리를 찾음`);
    } else if (!["gate", "torch", "waypoint"].includes(r.kind)) throw new Error(`${where}: kind '${r.kind}' 알 수 없음`);
  }
  return { entities: out, blocked, warn, counts: { props: propN, decals: decalN, sets: setN, clusters: clN, walls: wallN, roads: roadN, zones: zoneN, raised: raisedN } };
}

// ───────── 검사: 표식 ↔ 기능 엔티티 · 이어짐 ─────────
function check(bp, func, art) {
  const warn = [...art.warn];
  const markerCells = [];
  for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (bp.markers.has(ch)) markerCells.push({ ch, x, y }); }
  const feet = art.entities.filter((e) => /^Art(Prop|Set|Cl)/.test(e.name)).map((e) => e.pos);
  for (const m of markerCells) {
    const near = (list, dd) => list.some(([px, py]) => Math.abs(px - (m.x + 0.5)) <= dd && Math.abs(py - (m.y + 0.5)) <= dd);
    if (m.ch === "R") { if (!near(feet, 2.5)) warn.push(`표식 R (${m.x}, ${m.y}) 2.5칸 안에 장식이 없음`); continue; }
    const kind = { W: /^GateBack$/, E: /^GateNext$/, H: /^Gate_/, T: /^Torch/, S: /^Waypoint$/, G: /^GateToField$/, X: /^GateReturn$/ }[m.ch];
    const list = func.filter((e) => kind.test(e.name)).map((e) => e.pos);
    if (!near(list, 1.0)) warn.push(`표식 ${m.ch} (${m.x}, ${m.y}) 1칸 안에 해당 엔티티가 없음`);
  }
  // 기능 자리는 바닥이고 막히지 않아야 한다
  for (const e of func) {
    const k = key(Math.floor(e.pos[0]), Math.floor(e.pos[1]));
    if (!bp.isFloor(Math.floor(e.pos[0]), Math.floor(e.pos[1]))) throw new Error(`${e.name} (${e.pos[0]}, ${e.pos[1]})이 벽 칸`);
    if (art.blocked.has(k)) throw new Error(`${e.name} 자리 ${k}를 장식이 막음`);
  }
  // 모든 바닥은 서문에서 이어져야 한다 (장식 발밑 칸은 막힌 것으로)
  const start = func.find((e) => e.name === "GateBack") || func.find((e) => e.name === "GateToField") || func[0];
  const sx = Math.floor(start.pos[0]), sy = Math.floor(start.pos[1]);
  const seen = new Set([key(sx, sy)]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (seen.has(k) || !bp.isFloor(nx, ny) || art.blocked.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  // 장식 사이에 갇힌 바닥은 짓을 때 충돌 칸으로 막는다 (몬스터 출현·드롭이 못 가는 자리에 생기지 않게 · 바닥 그림은 그대로)
  const cut = [];
  for (const [x, y] of bp.cells()) if (bp.isFloor(x, y) && !art.blocked.has(key(x, y)) && !seen.has(key(x, y))) cut.push(key(x, y));
  for (const e of func) if (!seen.has(key(Math.floor(e.pos[0]), Math.floor(e.pos[1])))) throw new Error(`${e.name}까지 서문에서 길이 없음 — 설계도·장식 발밑을 고친다`);
  if (cut.length) warn.push(`장식 사이에 갇힌 바닥 ${cut.length}칸 — 충돌 칸으로 막는다: ${cut.slice(0, 16).map((k) => `(${k})`).join(" ")}${cut.length > 16 ? " …" : ""}`);
  return { warn, reachable: seen.size, cut: cut.length, sealed: new Set(cut) };
}

function ambience(d) {
  return {
    "@type": "script.MapAmbience", Enable: true,
    DisplayName: d.name, Ambient: num(d.ambient), PlayerLightRadius: num(d.lightRadius),
    Bgm: d.bgm, Wind: bool(d.wind), Crows: bool(d.crows), Difficulty: 0, LevelBonus: 0,
    Storm: num(d.storm, 0), StatMul: num(d.statMul, 1),
    // 날씨 (10-28 액트 3 「젖은 느낌」, maps.cjs와 같은 규칙): 바람 부는 바깥 맵 = 비, 그 밖의 액트 3 맵 = 옅은 안개
    Weather: num(d.act, 1) !== 3 ? "" : bool(d.wind) ? "rain" : "mist",
  };
}

// 맵 파일 하나를 설계도대로 다시 짓는다 (늘 템플릿에서 새로, 엔티티 id는 경로가 같으면 예전 것을 유지)
function build(d, maps, ctx, funcIn) {
  const bp = parseBlueprint(d.id);
  if (bp.w !== num(d.w) || bp.h !== num(d.h)) throw new Error(`${d.id}: 설계도 ${bp.w}×${bp.h} ≠ maps.csv ${d.w}×${d.h}`);
  const rows = loadRows(d.id);
  const func = funcIn || functionalEntities(d, maps, ctx, rows);
  const art = artEntities(d, ctx, bp, rows, func);
  const result = check(bp, func, art);

  const file = P.map(d.id);
  const previous = readIfExists(file);
  const map = MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), d.id);
  const tileMap = bp.cells().map(([x, y]) => ({
    type: 0, position: { x, y },
    tileIndex: bp.isWall(x, y) || art.blocked.has(key(x, y)) || result.sealed.has(key(x, y)) ? TILE.wall : bp.isRoad(x, y) ? TILE.road : TILE.floor,
  }));
  map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { TileSetRUID: PROJECT_TILESET, tileMap });
  map.upsertComponent(d.id, "script.MapAmbience", ambience(d));
  const mc = Object.assign({}, map.component(d.id, "MOD.Core.MapComponent"));
  delete mc.InstanceMap;
  mc.IsInstanceMap = true;
  map.upsertComponent(d.id, "MOD.Core.MapComponent", mc);
  map.data.Usage = 1;   // 인스턴스 맵 (게임 방에 실린다) — maps.cjs buildNormal과 같다
  for (const e of art.entities) map.placeModel(e.name, P.model("Objects/ArtSprite"), { pos: e.pos, componentOverrides: e.overrides });
  for (const e of func) map.placeModel(e.name, P.model(e.model), { pos: e.pos, componentOverrides: e.overrides || {} });
  if (d.spawns !== "") {
    map.empty("Spawner", { pos: [0, 0, 0], scripts: ["script.MonsterSpawner"] });
    const e = edgesOf(d);
    map.patchComponent("Spawner", "script.MonsterSpawner", {
      Entries: d.spawns, EliteChance: num(d.eliteChance),
      VariantChance: d.variantChance === "" ? -1 : num(d.variantChance),
      PackSize: Math.max(1, num(d.packSize, 1)), RespawnSec: num(d.respawnSec, 10),
      AreaMin: { x: e.left + 2, y: e.bottom + 1.5 }, AreaMax: { x: e.right - 2, y: e.top - 1.5 },
    });
  }
  map.write(file);
  preserveIds(file, previous);
  return Object.assign({ entities: art.entities.length + func.length + 1, blockedCells: art.blocked.size }, art.counts, result);
}

module.exports = { parseBlueprint, loadRows, functionalEntities, artEntities, check, build, hasBlueprint, markers, inward, spriteTable, baseScale, footprint, HM_DIR };
