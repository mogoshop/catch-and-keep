// 타일 대충 전수 수치 (조사용 · 읽기 전용) — export_map JSON + 설계도
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = "/Users/leeinguk/Desktop/hoho/잡으면 내편";
const hm = require(path.join(ROOT, "tools/build/handmade/lib.cjs"));
const { load } = require(path.join(ROOT, "tools/build/lib.cjs"));
const S = path.dirname(__filename);
const maps = load("maps").filter((r) => r.kind !== "instance");
const bosses = new Set(load("bosses").map((b) => b.map || b.mapId || "").filter(Boolean));
const out = [];
const K = (x, y) => x + "," + y;
const FLOOR_ENT = /^(ArtFloor|ArtZone|ArtRoad)/;
const OVER_ENT = /^(ArtBand|ArtCorner|ArtEdge|ArtFoam|ArtJoin)/;
const DECOR_ENT = /^(ArtProp|ArtSet|ArtDecal)/;
function rectOf(p, centered) {
  const sx = Math.abs(p.scale.x || 1), sy = Math.abs(p.scale.y || 1);
  const tw = (p.w / 100) * sx, th = (p.h / 100) * sy;
  if (p.drawMode === 2 && p.tiled) {
    const x0 = p.pos.x - tw / 2, y0 = p.pos.y - th / 2;
    return [x0, y0, x0 + p.tiled.x * tw, y0 + p.tiled.y * th];
  }
  if (centered) return [p.pos.x - tw / 2, p.pos.y - th / 2, p.pos.x + tw / 2, p.pos.y + th / 2];
  return [p.pos.x - tw / 2, p.pos.y - 0.2, p.pos.x + tw / 2, p.pos.y + Math.min(th, 2.5)];
}
const cellsIn = (r, shrink = 0.15) => { const o = []; for (let y = Math.floor(r[1] + shrink); y <= Math.floor(r[3] - shrink); y++) for (let x = Math.floor(r[0] + shrink); x <= Math.floor(r[2] - shrink); x++) o.push([x, y]); return o; };
for (const m of maps) {
  const id = m.id;
  const j = JSON.parse(fs.readFileSync(path.join(S, "json", id + ".json")));
  const bp = hm.parseBlueprint(id);
  const coll = new Set(j.tiles.map(([x, y]) => K(x, y)));
  const walk = (x, y) => bp.isFloor(x, y) && !coll.has(K(x, y));
  // 바닥 그림 (앞 = z 작은 것, 같으면 나중)
  const floorAt = new Map(), fz = new Map();
  j.pieces.forEach((p, i) => {
    if (!FLOOR_ENT.test(p.entity) || p.kind !== "floor") return;
    if (p.color && p.color.a !== undefined && p.color.a < 0.95) return;
    const z = p.pos.z || 0;
    for (const [x, y] of cellsIn(rectOf(p, true), 0.3)) {
      const k = K(x, y), cur = fz.get(k);
      if (cur === undefined || z < cur - 1e-6 || Math.abs(z - cur) < 1e-6) { fz.set(k, z); const c = p.color || { r: 1, g: 1, b: 1 }; floorAt.set(k, `${p.name}@${(+c.r).toFixed(2)}/${(+c.g).toFixed(2)}/${(+c.b).toFixed(2)}`); }
    }
  });
  const busy = new Set();
  const props = [];
  for (const p of j.pieces) {
    if (OVER_ENT.test(p.entity)) for (const c of cellsIn(rectOf(p, true), 0.25)) busy.add(K(...c));
    else if (DECOR_ENT.test(p.entity)) {
      const centered = /ArtDecal/.test(p.entity);
      for (const c of cellsIn(rectOf(p, centered), 0.1)) busy.add(K(...c));
      if (!/Top/.test(p.entity)) props.push(p);
    }
  }
  for (const f of j.func) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) busy.add(K(Math.floor(f.x) + dx, Math.floor(f.y) + dy));
  const { x0, x1, y0, y1 } = bp.bounds;
  // 1 민무늬: 같은 바닥·장식 없음 최대 정사각형 (DP, 아래→위 · 왼→오)
  const plain = (x, y) => walk(x, y) && !busy.has(K(x, y));
  const dp = new Map(); let best = 0, bestAt = null; const sq6 = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!plain(x, y)) continue;
    const f = floorAt.get(K(x, y)) || "base";
    const same = (a, b) => plain(a, b) && (floorAt.get(K(a, b)) || "base") === f;
    let v = 1;
    if (same(x - 1, y) && same(x, y - 1) && same(x - 1, y - 1)) v = 1 + Math.min(dp.get(K(x - 1, y)) || 0, dp.get(K(x, y - 1)) || 0, dp.get(K(x - 1, y - 1)) || 0);
    dp.set(K(x, y), v);
    if (v > best) { best = v; bestAt = [x - v + 1, y - v + 1, x, y, f]; }
    if (v >= 6) sq6.push([x - v + 1, y - v + 1, x, y]);
  }
  const plainCells = new Set();
  for (const [a, b, c, d] of sq6) for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) plainCells.add(K(x, y));
  // 민무늬 덩어리
  const seen = new Set(), blobs = [];
  for (const k of plainCells) { if (seen.has(k)) continue; const q = [k]; seen.add(k); let n = 0, bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const fl = {};
    while (q.length) { const c = q.pop(); n++; const [x, y] = c.split(",").map(Number); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); const f = floorAt.get(c) || "base"; fl[f] = (fl[f] || 0) + 1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = K(x + dx, y + dy); if (plainCells.has(nk) && !seen.has(nk)) { seen.add(nk); q.push(nk); } } }
    const zc = bp.zoneOf(bx0 + ((bx1 - bx0) >> 1), by0 + ((by1 - by0) >> 1)); blobs.push({ n, box: [bx0, by0, bx1, by1], floor: Object.entries(fl).sort((a, b) => b[1] - a[1])[0][0], zone: zc && bp.zones[zc] ? bp.zones[zc].name : "" }); }
  blobs.sort((a, b) => b.n - a.n);
  let walkN = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (walk(x, y)) walkN++;
  // 4 벽 밋밋: 북벽 면 (벽 칸 아래가 걷는 칸) 가로 연속 ≥8, 벽 칸·아래 칸·아래 2칸에 장식 없음
  const wallRuns = [];
  const decorNear = (x, y) => busy.has(K(x, y)) || busy.has(K(x, y - 1)) || busy.has(K(x, y - 2)) || coll.has(K(x, y - 1));
  for (let y = y0; y <= y1; y++) { let run = 0, start = null;
    for (let x = x0; x <= x1 + 1; x++) {
      const face = x <= x1 && bp.isWall(x, y) && bp.isFloor(x, y - 1) && bp.at(x,y)!==null;
      const ok = face && !decorNear(x, y);
      if (ok) { if (!run) start = x; run++; } else { if (run >= 8) wallRuns.push({ y, x0: start, x1: start + run - 1, n: run }); run = 0; }
    } }
  // 옆벽 (동·서) 세로 연속 ≥8
  const sideRuns = [];
  for (const dir of [1, -1]) for (let x = x0; x <= x1; x++) { let run = 0, start = null;
    for (let y = y0; y <= y1 + 1; y++) {
      const face = y <= y1 && bp.isWall(x, y) && bp.at(x,y)!==null && bp.isFloor(x + dir, y);
      const ok = face && !busy.has(K(x, y)) && !busy.has(K(x + dir, y)) && !coll.has(K(x + dir, y));
      if (ok) { if (!run) start = y; run++; } else { if (run >= 10) sideRuns.push({ x, y0: start, y1: start + run - 1, n: run }); run = 0; }
    } }
  // 2 이음매: 다른 바닥 경계 직선 연속 (걷는 칸끼리 · 덧칠 조각 없는 변) ≥7
  const seamRuns = [];
  const fl = (x, y) => floorAt.get(K(x, y)) || "base";
  const seamH = (x, y) => walk(x, y) && walk(x, y + 1) && fl(x, y) !== fl(x, y + 1) && !busy.has(K(x, y)) && !busy.has(K(x, y + 1));
  const seamV = (x, y) => walk(x, y) && walk(x + 1, y) && fl(x, y) !== fl(x + 1, y) && !busy.has(K(x, y)) && !busy.has(K(x + 1, y));
  for (let y = y0; y <= y1; y++) { let run = 0, s = null; for (let x = x0; x <= x1 + 1; x++) { if (x <= x1 && seamH(x, y)) { if (!run) s = x; run++; } else { if (run >= 7) seamRuns.push({ dir: "가로", at: `y${y}|${y + 1} x${s}~${s + run - 1}`, n: run }); run = 0; } } }
  for (let x = x0; x <= x1; x++) { let run = 0, s = null; for (let y = y0; y <= y1 + 1; y++) { if (y <= y1 && seamV(x, y)) { if (!run) s = y; run++; } else { if (run >= 7) seamRuns.push({ dir: "세로", at: `x${x}|${x + 1} y${s}~${s + run - 1}`, n: run }); run = 0; } } }
  // 3 빈 방: 설계도 구역 글자 덩어리 ≥40칸, 장식(소품·세트·무늬) 수
  const zseen = new Set(), rooms = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = bp.at(x, y); if (!(ch in bp.zones) || zseen.has(K(x, y))) continue;
    const q = [[x, y]]; zseen.add(K(x, y)); const cells = [];
    while (q.length) { const [a, b] = q.pop(); cells.push([a, b]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + dx, nb = b + dy; if (bp.at(na, nb) === ch && !zseen.has(K(na, nb))) { zseen.add(K(na, nb)); q.push([na, nb]); } } }
    if (cells.length < 40) continue;
    const cs = new Set(cells.map(([a, b]) => K(a, b)));
    let nProp = 0, nSet = 0, nDecal = 0, feat = 0;
    for (const p of props) { if (!cs.has(K(Math.floor(p.pos.x), Math.floor(p.pos.y)))) continue; if (/ArtDecal/.test(p.entity)) nDecal++; else if (/ArtSet/.test(p.entity)) nSet++; else nProp++; if (/landmark|_lm_/.test(p.name)) feat++; }
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    rooms.push({ ch, name: bp.zones[ch].name, n: cells.length, prop: nProp, set: nSet, decal: nDecal, feat, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], density: (nProp + nSet + nDecal) / cells.length * 100 });
  }
  const emptyRooms = rooms.filter((r) => r.prop + r.set === 0);
  const sparseRooms = rooms.filter((r) => r.prop + r.set > 0 && r.n >= 80 && (r.prop + r.set + r.decal) / r.n < 0.04);
  out.push({ id, act: m.act, kind: m.kind, name: m.name, v5: bp.v5 ? (bp.v5keep ? "keep" : "v5") : "-", base: bp.base && bp.base.art, floormix: [...bp.floorMix].join(","), walk: walkN,
    plainMax: best, plainAt: bestAt, plainCells: plainCells.size, plainPct: +(plainCells.size / walkN * 100).toFixed(1), blobs: blobs.slice(0, 4),
    wallRuns: wallRuns.sort((a, b) => b.n - a.n), sideRuns: sideRuns.sort((a, b) => b.n - a.n), seamRuns: seamRuns.sort((a, b) => b.n - a.n), rooms, emptyRooms, sparseRooms,
    nDecal: j.pieces.filter((p) => /^ArtDecal/.test(p.entity)).length, nProp: props.filter((p) => !/ArtDecal/.test(p.entity)).length, nZone: j.pieces.filter((p) => /^ArtZone/.test(p.entity)).length, nBand: j.pieces.filter((p) => /^ArtBand/.test(p.entity)).length });
}
fs.writeFileSync(path.join(S, "audit.json"), JSON.stringify(out, null, 1));
for (const r of out) console.log([r.id, r.act, r.kind, r.v5, "walk" + r.walk, "plainMax" + r.plainMax, "plain%" + r.plainPct, "wall8+:" + r.wallRuns.length + "(max" + (r.wallRuns[0] ? r.wallRuns[0].n : 0) + ")", "side10+:" + r.sideRuns.length, "seam7+:" + r.seamRuns.length + "(max" + (r.seamRuns[0] ? r.seamRuns[0].n : 0) + ")", "rooms" + r.rooms.length, "empty" + r.emptyRooms.length, "sparse" + r.sparseRooms.length, "decal" + r.nDecal, "prop" + r.nProp, "band" + r.nBand].join(" "));
