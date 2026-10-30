#!/usr/bin/env node
// 맵 장식 충돌·길 안내·이음새 검사 (10-31 사용자 실플레이 피드백 C — 정책 data/handmade/specs/decor_policy.cjs).
//   node tools/check_decor_collision.cjs [맵id…] [--json 파일]      맵을 짓지 않고(메모리에서) 빌더와 같은 계산으로 잰다 + 지어 둔 map/<id>.map과 맞는지
// 0건이어야 하는 것:
//   표    decor_collision.csv 분류·충돌 불일치 · map_sets.csv collide 빈칸·분류와 다름 · tile_classes.csv 빠짐/남음
//   C-2   「높이 1칸 이상 조각인데 통과」(평평한 웅덩이·깔린 것은 flat=1로 따로 적은 것만 예외) · 「바닥 조각인데 막힘」
//   C-1·3 「길 폭 3칸 안의 막는 조각」 · 「길 폭 3칸 안의 흩뿌림」 · 「길 안내가 벽·막힌 칸과 겹침」
//   C-5   「계층 경계에 전환 띠 없음」(바닥이 다른 걷는 칸 경계 · 막힌 칸 옆) · 「볼록 직각 모서리에 모서리 조각 없음」
//   C-6   「길 안내가 직각으로 꺾임」(이웃 토막 방향 차 30° 초과) · 「둥글린 반경 1칸 미만」
//   빌드  지어 둔 맵의 충돌 칸·길 안내 수가 계산과 다르면 (맵을 다시 짓지 않은 것)
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const hm = require("./build/handmade/lib.cjs");
const decor = require("./build/handmade/decor.cjs");
const tileClasses = require("./build/handmade/tile_classes.cjs");
const maps = require("./build/maps.cjs");
const { load, num, MapBuilder, quiet } = require("./build/lib.cjs");
const { parse } = require("./lib/csv.cjs");

const ROOT = path.resolve(__dirname, "..");
const P = decor.POLICY;
const args = process.argv.slice(2);
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const only = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--json");
const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const key = (x, y) => `${x},${y}`;

// ── 표 ──
const classes = decor.classTable();
for (const c of Object.values(classes)) {
  if (!["tall", "floor", "portal", "overlay"].includes(c.class)) bad("decor_collision.csv", `${c.name} class '${c.class}'`);
  if (c.collide !== (c.class === "tall" ? "block" : "pass")) bad("decor_collision.csv", `${c.name} ${c.class}인데 collide ${c.collide}`);
}
{
  const rows = parse(fs.readFileSync(path.join(ROOT, "data/map_sets.csv"), "utf8"));
  const h = rows.shift(), ci = h.indexOf("collide"), pi = h.indexOf("piece");
  if (ci < 0) bad("map_sets.csv", "collide 열이 없음");
  else rows.filter((r) => r.length > 1).forEach((r, i) => {
    const pc = r[pi], want = pc.startsWith("d:") || /decal/.test(pc) ? "pass" : (classes[pc] || {}).collide;
    if (!want) bad("map_sets.csv", `${i + 2}행 '${pc}' — decor_collision.csv에 분류 없음`);
    else if (r[ci] !== want) bad("map_sets.csv", `${i + 2}행 '${pc}' collide '${r[ci]}' ≠ 분류 ${want}`);
  });
}
{
  const r = require("child_process").spawnSync(process.execPath, [path.join(__dirname, "build/handmade/tile_classes.cjs"), "--check"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) bad("tile_classes.csv", (r.stdout + r.stderr).trim().split("\n").slice(0, 5).join(" / "));
}

// ── 맵 ──
const mapRows = load("maps");
const ctx = maps.context();
const ids = (only.length ? only : [...P.FULL, ...P.COLLIDE_ONLY]).filter((id) => decor.modeOf(id));
const report = {};
const H = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
// 축 맞춘 그림 사각형 (반복 그리기 · 회전 없음)이 점을 덮는가
const rectOf = (e) => {
  const sr = e.overrides["MOD.Core.SpriteRendererComponent"], ts = sr.TiledSize, sc = ((e.overrides["MOD.Core.TransformComponent"] || {}).Scale || { x: 1 }).x || 1, t = 1.28 * sc;
  return [e.pos[0] - t / 2, e.pos[1] - t / 2, e.pos[0] - t / 2 + ts.x * t, e.pos[1] - t / 2 + ts.y * t];
};
for (const id of ids) {
  const d = mapRows.find((m) => m.id === id);
  if (!d) { bad(id, "maps.csv에 없음"); continue; }
  const bp = hm.parseBlueprint(id);
  const rows = hm.loadRows(id);
  const func = d.kind === "handmade" ? hm.functionalEntities(d, mapRows, ctx, rows) : maps.desiredEntities(d, mapRows, ctx);
  const art = quiet(() => hm.artEntities(d, ctx, bp, rows, func));
  const res = hm.check(bp, func, art);
  const tc = tileClasses.classesOf(id);
  const isBlock = (x, y) => { const ch = bp.at(x, y); return ch === null || tc[ch] === "block"; };
  const where = (s) => `${id} ${s}`;
  const c = { v1: 0, v2: 0, v3: 0, v3s: 0, v4: 0, seam: 0, corner: 0, sharp: 0, radius: 0, stale: 0 };
  // C-2
  for (const p of art.pieces) {
    if (p.decal) continue;
    const k = decor.classOf(p.sprite), hCells = (num(k.opaqueH) * p.sc) / 100;
    if (!p.block && hCells >= 1 && k.flat !== "1" && !["portal", "overlay"].includes(k.class)) { c.v1++; bad(where(p.name), `높이 ${hCells.toFixed(2)}칸 '${p.sprite}'인데 통과`); }
    if (p.block && k.class === "floor") { c.v2++; bad(where(p.name), `바닥 조각 '${p.sprite}'인데 막힘`); }
  }
  // C-1·C-3
  const route = art.route;
  if (route) {
    for (const p of art.pieces) {
      if (p.block) for (const [cx, cy] of p.cells) if (decor.cellDistToCurve(route, cx, cy) < P.ROUTE_CLEAR - 1e-6) { c.v3++; bad(where(p.name), `막는 조각 '${p.sprite}' 칸 (${cx}, ${cy})이 길 폭 3칸 안`); break; }
      if (p.scatter && decor.distToCurve(route, p.x, p.y) < P.ROUTE_CLEAR - 1e-6) { c.v3s++; bad(where(p.name), `흩뿌림 '${p.sprite}'이 길 폭 3칸 안`); }
    }
    // 길 안내 토막(돌린 사각형) 안을 0.2칸 간격으로 찍어 벽·막힌 칸과 겹치는지
    for (const e of art.entities.filter((e) => /^ArtGuide/.test(e.name))) {
      const r = decor.rotOf(e);   // 회전 역산은 빌더와 같은 한 곳 (decor.cjs rectPoint)
      let hit = false;
      for (let a = 0.05; a < r.L - 0.05 && !hit; a += 0.2) for (let b = 0.05; b < r.W - 0.05 && !hit; b += 0.2) {
        const [wx, wy] = decor.rectPoint(r.pos, r.deg, r.L, r.W, a, b);
        const cx = Math.floor(wx), cy = Math.floor(wy);
        if (isBlock(cx, cy) || art.blocked.has(key(cx, cy))) hit = true;
      }
      if (hit) { c.v4++; bad(where(e.name), "길 안내가 벽·막힌 칸과 겹침"); }
    }
    if (art.guide) {
      c.sharp = art.guide.sharp;
      if (c.sharp) bad(id, `길 안내 직각 꺾임 ${c.sharp}곳`);
      if (art.guide.minRadius < 1 - 1e-6) { c.radius = 1; bad(id, `길 안내 둥글린 반경 ${art.guide.minRadius.toFixed(2)}칸 (1칸 미만)`); }
    }
  }
  // C-5: 경계마다 아래 칸 쪽 0.25칸 점이 띠(ArtBand·ArtShade) 안에 드는가 · 볼록 모서리마다 ArtCorner
  const bandRects = art.entities.filter((e) => /^Art(Band|Shade)\d/.test(e.name)).map(rectOf);
  const inBand = (x, y) => bandRects.some(([a, b, cc, dd]) => x >= a - 1e-6 && x <= cc + 1e-6 && y >= b - 1e-6 && y <= dd + 1e-6);
  const fl = (x, y) => (isBlock(x, y) ? null : decor.floorAt(bp, tc, x, y));
  const fk = (f) => `${f.art}|${f.tint}`;
  const up = (p, q) => (p.rank !== q.rank ? p.rank > q.rank : p.ch < q.ch);
  const b = bp.bounds;
  let edges = 0;
  for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    const p = fl(x, y), q = fl(x, y + 1);
    if (p && q && fk(p) !== fk(q) && decor.shoreEdge(bp, p, q)) edges++;   // 물가 거품 띠가 이음새
    else if (p && q && fk(p) !== fk(q)) { edges++; const lowBelow = up(q, p); if (!inBand(x + 0.5, lowBelow ? y + 1 - 0.25 : y + 1 + 0.25)) { c.seam++; } }
    else if (!bp.raised && ((p && !q && isBlock(x, y + 1)) || (!p && q && isBlock(x, y)))) { edges++; if (!inBand(x + 0.5, p ? y + 1 - 0.2 : y + 1 + 0.2)) c.seam++; }
  }
  for (let x = b.x0; x < b.x1; x++) for (let y = b.y0; y <= b.y1; y++) {
    const p = fl(x, y), q = fl(x + 1, y);
    if (p && q && fk(p) !== fk(q) && decor.shoreEdge(bp, p, q)) edges++;
    else if (p && q && fk(p) !== fk(q)) { edges++; const lowLeft = up(q, p); if (!inBand(lowLeft ? x + 1 - 0.25 : x + 1 + 0.25, y + 0.5)) c.seam++; }
    else if (!bp.raised && ((p && !q && isBlock(x + 1, y)) || (!p && q && isBlock(x, y)))) { edges++; if (!inBand(p ? x + 1 - 0.2 : x + 1 + 0.2, y + 0.5)) c.seam++; }
  }
  if (c.seam) bad(id, `계층 경계 ${edges}변 중 전환 띠 없음 ${c.seam}변`);
  const cornerAt = new Set(art.entities.filter((e) => /^ArtCorner/.test(e.name)).map((e) => {
    const r = decor.rotOf(e), [wx, wy] = decor.rectPoint(r.pos, r.deg, r.L, r.W, r.L / 2, r.W / 2);   // 사각형 가운데
    return key(Math.round(wx), Math.round(wy));
  }));
  let cornersTotal = 0;
  for (let Y = b.y0 + 1; Y <= b.y1; Y++) for (let X = b.x0 + 1; X <= b.x1; X++) {
    const quad = [[X - 1, Y - 1, X, Y - 1, X - 1, Y, X, Y], [X, Y - 1, X - 1, Y - 1, X, Y, X - 1, Y], [X - 1, Y, X, Y, X - 1, Y - 1, X, Y - 1], [X, Y, X - 1, Y, X, Y - 1, X - 1, Y - 1]];
    for (const [cx, cy, hx, hy, vx, vy, gx, gy] of quad) {
      const cc = fl(cx, cy), h = fl(hx, hy), v = fl(vx, vy), g = fl(gx, gy);
      if (cc && h && v && g && fk(h) !== fk(cc) && fk(v) !== fk(cc) && fk(g) !== fk(cc) && up(cc, h) && up(cc, v) && !decor.shoreEdge(bp, cc, h) && !decor.shoreEdge(bp, cc, v)) {
        cornersTotal++;
        if (!cornerAt.has(key(X, Y))) c.corner++;
      }
    }
  }
  if (c.corner) bad(id, `볼록 직각 모서리 ${cornersTotal}곳 중 모서리 조각 없음 ${c.corner}곳`);
  // 빌드와 맞는가 (충돌 칸 · 길 안내 수)
  const want = [];
  for (const [x, y] of bp.cells()) if (isBlock(x, y) || art.blocked.has(key(x, y)) || res.sealed.has(key(x, y))) want.push(key(x, y));
  const file = path.join(ROOT, "map", id + ".map");
  let collHash = "", built = null;
  if (fs.existsSync(file)) {
    const mb = MapBuilder.read(file);
    const tiles = mb.component("RectTileMap", "MOD.Core.RectTileMapComponent").tileMap.filter((t) => t.tileIndex === 269).map((t) => key(t.position.x, t.position.y)).sort();
    collHash = H(tiles.join(";"));
    built = { coll: tiles.length, guide: mb.listEntities().filter((e) => /\/ArtGuide\d+$/.test(e.path)).length };
    if (collHash !== H(want.sort().join(";"))) { c.stale++; bad(id, "map 파일 충돌 칸이 계산과 다름 — node tools/build/handmade/build.cjs " + id); }
    if (built.guide !== art.entities.filter((e) => /^ArtGuide/.test(e.name)).length) { c.stale++; bad(id, "map 파일 길 안내 수가 계산과 다름 — 다시 짓는다"); }
  }
  const bpWalls = []; for (const [x, y] of bp.cells()) if (bp.isWall(x, y)) bpWalls.push(key(x, y));
  report[id] = Object.assign({ bpWallHash: H(bpWalls.join(";")), collHash, collCells: want.length, edges, cornersTotal,
    blockPieces: art.pieces.filter((p) => p.block && !/^ArtMark/.test(p.name)).length, marks: art.counts.marks || 0,
    scatter: art.pieces.filter((p) => p.scatter).length, counts: art.counts, policy: art.policy ? Object.assign({}, art.policy, { rows: undefined }) : null }, c);
  const tot = Object.values(c).reduce((a, v) => a + v, 0);
  console.log(`  ${id}: 위반 ${tot} · 막는 조각 ${report[id].blockPieces} · 흩뿌림 ${report[id].scatter} · 길 안내 토막 ${art.guide ? art.guide.segments : 0} · 표식 ${report[id].marks} · 경계 ${edges}변 · 볼록 모서리 ${cornersTotal}`);
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1));
for (const p of problems.slice(0, 40)) console.log("  ! " + p);
if (problems.length > 40) console.log(`  ! … 외 ${problems.length - 40}건`);
console.log(`[check_decor_collision] 맵 ${ids.length}장 · 문제 ${problems.length}건`);
process.exit(problems.length ? 1 : 0);
