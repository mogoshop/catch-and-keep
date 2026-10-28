#!/usr/bin/env node
// 장소 설계서 → 설계도·배치표 (10-28 맵 66장 전면 개편 · 기획서 38 F7 · 부록 C A+B).
//   맵마다 「장소」를 글로 정한다: 장소(이름·모양·바닥) · 길(꺾인 선·폭·포장) · 바위·담 · 포털·웨이포인트·화로·입구 · 장소마다 세트·소품·바닥 무늬.
//   이 도구가 그 글을 칸 격자(data/handmade/<id>.txt)와 배치표(<id>.csv)로 옮기고, 기능 자리(화로·웨이포인트·던전 입구·보스·NPC)를
//   maps.csv · waypoints.csv에 적는다. 맵 파일은 tools/build.cjs maps(maps.cjs → handmade/lib.cjs build)가 설계도대로 짓는다.
//   설계서: data/handmade/specs/act<N>.cjs (module.exports = { <맵 id>: 설계서, ... })
//   node tools/build/handmade/compose.cjs act1            그 액트 설계서 전부 → 설계도·배치표·maps.csv
//   node tools/build/handmade/compose.cjs act1 rotmarsh   한 맵만
//   node tools/build/handmade/compose.cjs act1 --view     글자 지도만 찍는다 (파일을 쓰지 않는다)
//
// 설계서 꼴 (좌표는 월드 칸 — 칸 (x, y) = 월드 [x, x+1]×[y, y+1], 가로 -w/2 ~ w/2-1 · 세로 -h/2+1 ~ h/2):
//   size [w, h] · title · story [줄…] (설계도 머리 주석)
//   base "바닥그림 색" · walls { 글자: "9조각묶음 색 이름" } (첫 글자가 바깥 바위) · zones { 글자: "바닥그림 색 이름" } · roads { 글자: "길그림 색 이름" }
//   places [{ z, name, e: [cx, cy, rx, ry] | r: [x0, y0, x1, y1], rough }]   장소 (z 구역 글자로 바닥을 판다)
//   paths  [{ pts: [[x, y]…], w, road, rw, z }]                            길 (폭 w로 바닥을 파고, 가운데 rw칸은 포장 글자)
//   rocks  [{ e | r | line: [[x, y]…], ch, w, gaps }]                       바위·담 (다시 벽으로) — 길 위는 피한다
//   gates { W: [x, y], E: [x, y], G: [x, y] } · holes { 첫층id: [x, y] } · waypoint [x, y] · torches "auto" | [[x, y]…]
//   fixed { 몬스터id: [x, y] } · extra { "npc:Model" | "altar:id" | depthgate | return | end : [x, y] }
//   dress { 구역글자: { sets: [...], props: [...], n, decals: [...], dn } } · put [[kind, name, x, y, scale, flip]…]
"use strict";
const fs = require("fs");
const path = require("path");
const { load, num } = require("../lib.cjs");
const { parse } = require("../../lib/csv.cjs");
const hm = require("./lib.cjs");
const layoutGen = require("../layout.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const SPEC_DIR = path.join(hm.HM_DIR, "specs");
const key = (x, y) => `${x},${y}`;
const r2 = (v) => Math.round(v * 100) / 100;

// ───────── 잡음 (시드 고정) ─────────
function hash(seed, x, y) {
  let h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise2(seed, x, y, scale) {
  const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(seed, ix, iy), b = hash(seed, ix + 1, iy), c = hash(seed, ix, iy + 1), d = hash(seed, ix + 1, iy + 1);
  return (a + (b - a) * s(tx)) + ((c + (d - c) * s(tx)) - (a + (b - a) * s(tx))) * s(ty);   // 0~1
}
const seedOf = (text) => [...text].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);

// ───────── 격자 ─────────
function makeGrid(w, h, wallCh) {
  const g = { w, h, x0: -w / 2, x1: w / 2 - 1, y0: -h / 2 + 1, y1: h / 2 };
  g.cell = new Map();   // key → { ch, zone, place, keep, road }
  g.in = (x, y) => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1;
  g.get = (x, y) => g.cell.get(key(x, y)) || null;
  g.floor = (x, y) => { const c = g.get(x, y); return !!c && !c.wall; };
  g.dig = (x, y, zone, place) => {
    if (!g.in(x, y)) return;
    const c = g.get(x, y);
    if (c && !c.wall) return;   // 먼저 판 장소의 바닥은 그대로
    g.cell.set(key(x, y), { wall: false, zone, place: place ?? -1, keep: false, road: null });
  };
  g.fill = (x, y, ch) => { if (g.in(x, y)) g.cell.set(key(x, y), { wall: true, ch }); };
  g.each = (fn) => { for (let y = g.y1; y >= g.y0; y--) for (let x = g.x0; x <= g.x1; x++) fn(x, y); };
  g.wallCh = wallCh;
  return g;
}

// 모양 안 판정 (칸 가운데 기준, 가장자리를 잡음으로 깨문다)
function inShape(shape, x, y, seed, rough) {
  const px = x + 0.5, py = y + 0.5;
  if (shape.e) {
    const [cx, cy, rx, ry] = shape.e;
    const dx = (px - cx) / rx, dy = (py - cy) / ry, dd = Math.hypot(dx, dy);
    const n = noise2(seed, px, py, 5.5) - 0.5;
    return dd <= 1 + (rough / Math.min(rx, ry)) * n * 2;
  }
  if (shape.r) {
    const [ax, ay, bx, by] = shape.r;
    const edge = Math.min(px - ax, bx + 1 - px, py - ay, by + 1 - py);
    if (edge <= 0) return false;
    return edge >= noise2(seed, px, py, 4.5) * rough;
  }
  throw new Error("모양은 e 또는 r");
}
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
  const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
function lineDist(pts, px, py) {
  let d = 1e9;
  for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}

// ───────── 그림 크기 (장식 발밑 칸) ─────────
function footCells(table, propScale, name, x, y, mul) {
  const sp = table[name];
  if (!sp) throw new Error(`그림 '${name}'이 art_sprites.csv·maple_sprites.csv에 없음`);
  const sc = hm.baseScale(sp, propScale) * mul;
  return hm.footprint(x, y, sp.w, sc).map((k) => k.split(",").map(Number));
}
const isDecal = (name) => /decal/.test(name);

// ───────── 설계서 → 설계도 ─────────
function compose(id, spec, ctx, mapRow) {
  const [w, h] = spec.size;
  const seed = seedOf(id);
  const wallChars = Object.keys(spec.walls);
  const g = makeGrid(w, h, wallChars[0]);
  const zoneOf = (ch) => (ch === "." || ch in spec.zones ? ch : (() => { throw new Error(`${id}: 구역 글자 '${ch}'가 zones에 없음`); })());
  // 1) 장소
  const places = spec.places || [];
  places.forEach((p, i) => {
    const z = zoneOf(p.z || ".");
    const rough = p.rough ?? 1.0;
    const box = p.e ? [p.e[0] - p.e[2] - 3, p.e[1] - p.e[3] - 3, p.e[0] + p.e[2] + 3, p.e[1] + p.e[3] + 3] : [p.r[0] - 1, p.r[1] - 1, p.r[2] + 1, p.r[3] + 1];
    for (let y = Math.floor(box[1]); y <= Math.ceil(box[3]); y++) for (let x = Math.floor(box[0]); x <= Math.ceil(box[2]); x++) {
      if (inShape(p, x, y, seed + i * 97, rough)) g.dig(x, y, z, i);
    }
  });
  // 2) 길 (폭 잡음으로 들쭉날쭉) — 장소 바닥은 그대로 두고 벽만 판다. 가운데는 포장(road) · 둘레는 장식을 두지 않는 칸(keep)
  (spec.paths || []).forEach((pa, i) => {
    const z = zoneOf(pa.z || ".");
    const half = (pa.w || 3) / 2, rw = (pa.rw || 0) / 2;
    const xs = pa.pts.map((p) => p[0]), ys = pa.pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys) - half - 2); y <= Math.ceil(Math.max(...ys) + half + 2); y++) {
      for (let x = Math.floor(Math.min(...xs) - half - 2); x <= Math.ceil(Math.max(...xs) + half + 2); x++) {
        const d = lineDist(pa.pts, x + 0.5, y + 0.5);
        const wob = (noise2(seed + 500 + i * 31, x + 0.5, y + 0.5, 6) - 0.5) * (pa.wobble ?? 0.8);
        if (d <= half + wob) {
          g.dig(x, y, z, -1);
          const c = g.get(x, y);
          if (!c) continue;
          if (pa.road && d <= rw + 0.05) c.road = pa.road;
          if (d <= Math.max(rw + 0.8, (pa.keep ?? 1.1))) c.keep = true;
        }
      }
    }
  });
  // 3) 바위·담 (길 위 keep 칸은 남긴다 — force면 그대로 덮는다)
  (spec.rocks || []).forEach((rk, i) => {
    const ch = rk.ch || wallChars[0];
    if (!(ch in spec.walls)) throw new Error(`${id}: 바위 글자 '${ch}'가 walls에 없음`);
    const put = (x, y) => { const c = g.get(x, y); if (c && !c.wall && c.keep && !rk.force) return; g.fill(x, y, ch); };
    if (rk.line) {
      const half = (rk.w || 1) / 2;
      const gaps = (rk.gaps || []).map((gp) => gp);
      const xs = rk.line.map((p) => p[0]), ys = rk.line.map((p) => p[1]);
      for (let y = Math.floor(Math.min(...ys) - 2); y <= Math.ceil(Math.max(...ys) + 2); y++) for (let x = Math.floor(Math.min(...xs) - 2); x <= Math.ceil(Math.max(...xs) + 2); x++) {
        if (lineDist(rk.line, x + 0.5, y + 0.5) > half) continue;
        if (gaps.some(([gx, gy, gr]) => Math.hypot(x + 0.5 - gx, y + 0.5 - gy) <= (gr || 1.5))) continue;
        put(x, y);
      }
      return;
    }
    const rough = rk.rough ?? 0.6;
    const box = rk.e ? [rk.e[0] - rk.e[2] - 2, rk.e[1] - rk.e[3] - 2, rk.e[0] + rk.e[2] + 2, rk.e[1] + rk.e[3] + 2] : [rk.r[0] - 1, rk.r[1] - 1, rk.r[2] + 1, rk.r[3] + 1];
    for (let y = Math.floor(box[1]); y <= Math.ceil(box[3]); y++) for (let x = Math.floor(box[0]); x <= Math.ceil(box[2]); x++) {
      if (inShape(rk, x, y, seed + 900 + i * 53, rough)) put(x, y);
    }
  });

  // 4) 기능 자리 — 둘레를 바닥으로 파고 장식을 비운다
  const func = [];   // { ch, x, y } (월드 좌표)
  const markAt = [];
  const clear = (px, py, r, keepR) => {
    const zoneNear = nearestZone(g, px, py);
    for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r); y++) for (let x = Math.floor(px - r - 1); x <= Math.ceil(px + r); x++) {
      const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
      if (d <= r) { const c = g.get(x, y); if (!c || c.wall) g.cell.set(key(x, y), { wall: false, zone: zoneNear, place: -1, keep: true, road: null }); }
      if (d <= keepR) { const c = g.get(x, y); if (c && !c.wall) c.keep = true; }
    }
  };
  const gates = spec.gates || {};
  for (const [ch, p] of Object.entries(gates)) {
    if (!["W", "E", "G", "X"].includes(ch)) throw new Error(`${id}: gates 글자 '${ch}' (W·E·G·X)`);
    func.push({ ch, x: p[0] + 0.5, y: p[1] + 0.5 });
    clear(p[0] + 0.5, p[1] + 0.5, 1.6, 2.6);
    markAt.push([ch, p[0], p[1]]);
  }
  for (const [child, p] of Object.entries(spec.holes || {})) { func.push({ ch: "H", child, x: p[0] + 0.5, y: p[1] + 0.5 }); clear(p[0] + 0.5, p[1] + 0.5, 1.6, 2.6); markAt.push(["H", p[0], p[1]]); }
  if (spec.waypoint) { const p = spec.waypoint; func.push({ ch: "S", x: p[0] + 0.5, y: p[1] + 0.5 }); clear(p[0] + 0.5, p[1] + 0.5, 1.8, 2.8); markAt.push(["S", p[0], p[1]]); }
  for (const [name, p] of Object.entries(spec.fixed || {})) { func.push({ ch: "B", name, x: p[0] + 0.5, y: p[1] + 0.5 }); clear(p[0] + 0.5, p[1] + 0.5, 2.2, 3.2); }
  for (const [name, p] of Object.entries(spec.extra || {})) {
    func.push({ ch: "K", name, x: p[0] + 0.5, y: p[1] + 0.5 });
    clear(p[0] + 0.5, p[1] + 0.5, name === "end" ? 2.4 : 1.4, name === "end" ? 3.0 : 2.2);
    if (name === "return") markAt.push(["X", p[0], p[1]]);
  }
  // 손으로 고른 장식(put)의 발밑 — 화로가 그 자리를 피한다
  const table = hm.spriteTable(ctx);
  const puts = [...(spec.put || []), ...entrancePuts(id, mapRow, func, ctx)];
  const putFeet = new Set();
  for (const pu of puts) {
    if (pu[0] !== "prop") continue;
    for (const [cx, cy] of footCells(table, ctx.propScale, pu[1], pu[2], pu[3], pu[4] || 1)) for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) putFeet.add(key(cx + dx, cy + dy));
  }
  let torches = [];

  // 5) 바깥 테두리 한 줄은 벽 (포털 표식 칸만 바닥)
  g.each((x, y) => {
    if (x !== g.x0 && x !== g.x1 && y !== g.y0 && y !== g.y1) return;
    if (markAt.some(([ch, mx, my]) => mx === x && my === y && "WEGX".includes(ch))) return;
    g.fill(x, y, wallChars[0]);
  });
  // 6) 이어짐: 첫 포털에서 닿지 않는 바닥 덩어리 — 작으면 벽으로, 크면 가장 가까운 닿는 바닥까지 폭 2 통로
  const start = func.find((f) => f.ch === "W") || func.find((f) => f.ch === "G") || func[0];
  for (let pass = 0; pass < 12; pass++) {
    const reach = flood(g, Math.floor(start.x), Math.floor(start.y));
    const comps = components(g, reach);
    if (!comps.length) break;
    for (const comp of comps) {
      if (comp.length < 10 && !comp.some(([x, y]) => func.some((f) => Math.floor(f.x) === x && Math.floor(f.y) === y))) { for (const [x, y] of comp) g.fill(x, y, wallChars[0]); continue; }
      let best = null;
      for (const [ax, ay] of comp) for (const k of reach) {
        const [bx, by] = k.split(",").map(Number);
        const d = Math.abs(ax - bx) + Math.abs(ay - by);
        if (!best || d < best.d) best = { ax, ay, bx, by, d };
      }
      const z = g.get(best.ax, best.ay).zone;
      for (const [x, y] of lPath(best.ax, best.ay, best.bx, best.by)) { g.dig(x, y, z, -1); g.dig(x + 1, y, z, -1); g.dig(x, y + 1, z, -1); }
    }
  }
  // 7) 표식 칸
  const markerOf = new Map();
  for (const [ch, x, y] of markAt) markerOf.set(key(x, y), ch);

  // 8) 꾸밈 — 장소마다 세트(벽 등지기 우선) → 소품(벽 가까이) → 바닥 무늬. 마지막에 put(손으로 고른 자리)
  const rows = [];
  const occ = new Set(), feet = [];
  const funcSpots = func.map((f) => [f.x, f.y]);
  const nearFunc = (x, y, rx = 2.2, ry = 1.4) => funcSpots.some(([fx, fy]) => Math.abs(fx - x) < rx && Math.abs(fy - y) < ry);
  const freeFoot = (cells, place) => cells.every(([cx, cy]) => {
    const c = g.get(cx, cy);
    return c && !c.wall && !c.keep && !c.road && !occ.has(key(cx, cy)) && (place === undefined || c.place === place) && !markerOf.has(key(cx, cy));
  });
  const occupy = (cells, x, y) => { for (const [cx, cy] of cells) { occ.add(key(cx, cy)); occ.add(key(cx - 1, cy)); occ.add(key(cx + 1, cy)); } feet.push([x, y]); };
  const wallNear = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!g.floor(x + dx, y + dy)) return true; return false; };
  const rand = layoutGen.rng(seed + 4242);
  const placeCells = (i) => { const out = []; g.each((x, y) => { const c = g.get(x, y); if (c && !c.wall && c.place === i) out.push([x, y]); }); return out; };
  // 손으로 고른 자리 먼저 (랜드마크)
  for (const pu of puts) {
    const [kind, name, x, y, sc, flip] = pu;
    if (kind === "set") {
      const pieces = ctx.sets[name];
      if (!pieces) throw new Error(`${id}: 세트 '${name}'이 map_sets.csv에 없음`);
      const m = flip ? -1 : 1;
      for (const pc of pieces) if (!pc.piece.startsWith("d:")) { const px = x + num(pc.dx) * m, py = y + num(pc.dy); occupy(footCells(table, ctx.propScale, pc.piece, px, py, num(pc.scale, 1) * (sc || 1)), px, py); }
      rows.push({ kind: "set", name, x, y, scale: sc || "", flip: flip ? 1 : "", args: pu[6] || "", note: "손으로 고른 자리" });
    } else if (kind === "prop") {
      occupy(footCells(table, ctx.propScale, name, x, y, sc || 1), x, y);
      rows.push({ kind: "prop", name, x, y, scale: sc || "", flip: flip ? 1 : "", args: pu[6] || "", note: "손으로 고른 자리" });
    } else if (kind === "decal") rows.push({ kind: "decal", name, x, y, scale: sc || "", flip: flip ? 1 : "", args: "", note: "" });
    else throw new Error(`${id}: put kind '${kind}'`);
  }
  const dressOf = (p, i) => {
    const dr = (spec.dress || {})[p.z] || {};
    const own = p.dress || {};
    return {
      sets: own.sets || (i === places.findIndex((q) => q.z === p.z) ? dr.sets || [] : []),
      props: own.props || dr.props || [], n: own.n ?? (dr.n ?? 0),
      decals: own.decals || dr.decals || [], dn: own.dn ?? (dr.dn ?? 0),
      cells: placeCells(i), center: p.e ? [p.e[0], p.e[1]] : [(p.r[0] + p.r[2] + 1) / 2, (p.r[1] + p.r[3] + 1) / 2],
    };
  };
  const D = places.map(dressOf);
  places.forEach((p, i) => {
    const { sets, cells } = D[i];
    const [cx, cy] = D[i].center;
    const centers = [];
    for (const setName of sets) {
      const pieces = ctx.sets[setName];
      if (!pieces) throw new Error(`${id}: 세트 '${setName}'이 map_sets.csv에 없음`);
      const back = pieces[0].back === "1";
      let best = null;
      // 1차: 장소 칸 · 2차(자리가 없으면): 장소 가운데에서 장소 반경 + 5칸 안의 바닥 (큰 길이 장소를 가로지르는 사냥터)
      const reach = (p.e ? Math.max(p.e[2], p.e[3]) : Math.max(p.r[2] - p.r[0], p.r[3] - p.r[1]) / 2) + 5;
      const wide = [];
      g.each((x, y) => { if (g.floor(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= reach) wide.push([x, y]); });
      for (const pool of [cells, wide]) {
      if (best) break;
      for (const [x, y] of pool) {
        const sx = x + 0.5, sy = y + 0.3;
        if (nearFunc(sx, sy, 3.5, 3)) continue;
        for (const m of [1, -1]) {
          const ok = pieces.every((pc) => {
            const px = sx + num(pc.dx) * m, py = sy + num(pc.dy);
            if (pc.piece.startsWith("d:")) return g.floor(Math.floor(px), Math.floor(py));
            return freeFoot(footCells(table, ctx.propScale, pc.piece, px, py, num(pc.scale, 1)), undefined) && !nearFunc(px, py);
          });
          if (!ok) continue;
          const backOk = [-1, 0, 1].every((dx) => !g.floor(x + dx, y + 3) || !g.floor(x + dx, y + 2));
          const spread = centers.length ? Math.min(...centers.map(([ax, ay]) => Math.hypot(ax - sx, ay - sy))) : 12;
          const score = (back && backOk ? -8 : 0) - Math.min(spread, 14) + Math.hypot(sx - cx, sy - cy) * 0.25 + rand() * 1.5;
          if (!best || score < best.score) best = { sx, sy, m, score };
        }
      }
      }
      if (!best) { console.log(`  ! ${id} 장소 '${p.name}': 세트 ${setName} 자리 없음`); continue; }
      for (const pc of pieces) if (!pc.piece.startsWith("d:")) { const px = best.sx + num(pc.dx) * best.m, py = best.sy + num(pc.dy); occupy(footCells(table, ctx.propScale, pc.piece, px, py, num(pc.scale, 1)), px, py); }
      centers.push([best.sx, best.sy]);
      rows.push({ kind: "set", name: setName, x: r2(best.sx), y: r2(best.sy), scale: "", flip: best.m < 0 ? 1 : "", args: "", note: p.name });
    }
  });
  // 화로: 장소마다 한 개 (장소 가운데에서 가장 가까운, 길 밖 바닥) — 넓은 맵의 어둠을 장소 단위로 밝힌다
  if (spec.torches === "auto" || !spec.torches) {
    places.forEach((p, i) => {
      if (p.torch === false) return;
      const [cx, cy] = p.e ? [p.e[0], p.e[1]] : [(p.r[0] + p.r[2] + 1) / 2, (p.r[1] + p.r[3] + 1) / 2];
      const off = p.torchAt || [0, 0];
      let best = null;
      g.each((x, y) => {
        const c = g.get(x, y);
        if (!c || c.wall || c.road || c.place !== i || putFeet.has(key(x, y)) || occ.has(key(x, y))) return;
        if (feet.some(([fx, fy]) => Math.abs(fx - x - 0.5) < 2.4 && Math.abs(fy - y - 0.5) < 1.6)) return;
        if (func.some((f) => Math.hypot(f.x - x - 0.5, f.y - y - 0.5) < 3.2)) return;
        if (torches.some(([tx, ty]) => Math.hypot(tx - x - 0.5, ty - y - 0.5) < 6)) return;
        let around = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (g.floor(x + dx, y + dy)) around++;
        if (around < 9) return;
        const d = Math.hypot(x + 0.5 - cx - off[0], y + 0.5 - cy - off[1]) + (c.keep ? 1.5 : 0);
        if (!best || d < best.d) best = { x, y, d };
      });
      if (best) torches.push([best.x + 0.5, best.y + 0.5]);
    });
  } else torches = spec.torches.map((p) => [p[0] + 0.5, p[1] + 0.5]);
  for (const [tx, ty] of torches) { func.push({ ch: "T", x: tx, y: ty }); funcSpots.push([tx, ty]); clear(tx, ty, 0.9, 2.2); markerOf.set(key(Math.floor(tx), Math.floor(ty)), "T"); }
  places.forEach((p, i) => {
    const { props, n, decals, dn, cells } = D[i];
    // 소품: 열에 일곱은 벽 가까이(1~2칸), 셋은 장소 안쪽 — 서로 1.8칸 이상
    let placed = 0;
    const cand = cells.map(([x, y]) => ({ x, y, k: rand() })).sort((a, b) => a.k - b.k);
    for (let pass = 0; pass < 2 && placed < n; pass++) {
      for (const c of cand) {
        if (placed >= n) break;
        const hug = wallNear(c.x, c.y, 2);
        if (pass === 0 && !hug && placed < n * 0.7) continue;
        const name = props[Math.floor(rand() * props.length)];
        const sx = r2(c.x + 0.3 + rand() * 0.4), sy = r2(c.y + 0.2 + rand() * 0.3);
        const mul = r2(0.9 + rand() * 0.2);
        if (nearFunc(sx, sy)) continue;
        if (feet.some(([fx, fy]) => Math.hypot(fx - sx, fy - sy) < 1.8)) continue;
        const foot = footCells(table, ctx.propScale, name, sx, sy, mul);
        if (!freeFoot(foot, i)) continue;
        occupy(foot, sx, sy);
        rows.push({ kind: "prop", name, x: sx, y: sy, scale: mul, flip: rand() < 0.5 ? 1 : "", args: "", note: p.name });
        placed++;
      }
    }
    if (placed < n) console.log(`  ! ${id} 장소 '${p.name}': 소품 ${n}개 중 ${placed}개`);
    // 바닥 무늬: 장소 바닥 아무 데나 (길 위도 된다), 서로 3칸
    const dspots = [];
    for (const c of cells.map(([x, y]) => ({ x, y, k: rand() })).sort((a, b) => a.k - b.k)) {
      if (dspots.length >= dn || !decals.length) break;
      const sx = r2(c.x + 0.5), sy = r2(c.y + 0.4);
      if (nearFunc(sx, sy, 1.6, 1.2) || dspots.some(([ax, ay]) => Math.hypot(ax - sx, ay - sy) < 3) || feet.some(([fx, fy]) => Math.hypot(fx - sx, fy - sy) < 1.4)) continue;
      if (!g.floor(c.x - 1, c.y) || !g.floor(c.x + 1, c.y)) continue;
      dspots.push([sx, sy]);
      rows.push({ kind: "decal", name: decals[dspots.length % decals.length], x: sx, y: sy, scale: r2(0.9 + rand() * 0.25), flip: rand() < 0.5 ? 1 : "", args: "", note: p.name });
    }
  });

  // 9) 글자 격자
  const grid = [];
  for (let y = g.y1; y >= g.y0; y--) {
    let line = "";
    for (let x = g.x0; x <= g.x1; x++) {
      const c = g.get(x, y);
      const mk = markerOf.get(key(x, y));
      if (mk) line += mk;
      else if (!c) line += wallChars[0];
      else if (c.wall) line += c.ch;
      else if (c.road) line += c.road;
      else line += c.zone;
    }
    grid.push(line);
  }
  return { grid, rows, func, torches };
}

// 곁가지 입구 · 층 계단 그림 (10-28 코덱스 entrances — 「단순 포털이 아니라 굴에 포털을 올려 — 디아2처럼」):
//   필드의 곁가지 구멍(H) = 그 던전 입구 그림, 곁가지 층 문 = 1층 → 2층(E) 내려가기 · 2층 → 1층(W) 올라가기 계단 (data/entrance_art.csv).
//   그림의 어두운 구멍(openY — 캔버스 아래에서 비율, 피벗은 발밑)이 포털 자리에 오도록 발을 내린다. 포털 곁 경고는 일부러라 ok=gate
const ENTRANCE_PIVOT_Y = 0.0234375;
const PORTAL_CENTER_Y = 0.38;   // 포털 그림(WarpGate) 소용돌이 가운데가 엔티티 자리보다 이만큼 위 (크기 1 기준, 10-28 메이커 실측) — 작게 줄인 만큼 함께 줄어든다
function entrancePuts(id, mapRow, func, ctx) {
  const art = load("entrance_art");
  const by = Object.fromEntries(art.map((r) => [r.use, r]));
  const out = [];
  const add = (row, x, y) => {
    if (!row) return;
    const sc = ctx.propScale[row.art] || 1;
    const lift = (num(row.openY) - ENTRANCE_PIVOT_Y) * 512 * sc / 100 - PORTAL_CENTER_Y * require("../maps.cjs").ENTRANCE_PORTAL.scale;
    out.push(["prop", row.art, x, Math.round((y - lift) * 100) / 100, 1, 0, "ok=gate+cliff"]);   // 벽을 등진 그림이라 발이 벽 칸에 닿기도 한다
  };
  for (const f of func) if (f.ch === "H") add(by[f.child], f.x, f.y);
  if (mapRow && mapRow.kind === "side") {
    const maps = load("maps");
    const same = maps.filter((m) => m.kind === "side" && m.parent === mapRow.parent);
    let floors = [];
    for (const m of same) {
      if (m.entry !== "") floors = [];
      floors.push(m);
      if (m.id === id) break;
    }
    for (let k = same.findIndex((m) => m.id === id) + 1; k < same.length && same[k].entry === ""; k++) floors.push(same[k]);
    const i = floors.findIndex((m) => m.id === id);
    const act = mapRow.act || 1;
    for (const f of func) {
      if (f.ch === "W" && i > 0) add(by[`up:${act}`], f.x, f.y);
      if (f.ch === "E" && i < floors.length - 1) add(by[`down:${act}`], f.x, f.y);
    }
  }
  return out;
}

function nearestZone(g, px, py) {
  let best = null;
  for (let r = 0; r < 8 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const c = g.get(Math.floor(px) + dx, Math.floor(py) + dy);
    if (c && !c.wall && c.zone) { best = c.zone; break; }
  }
  return best || ".";
}
function flood(g, sx, sy) {
  const seen = new Set();
  if (!g.floor(sx, sy)) return seen;
  seen.add(key(sx, sy));
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = key(x + dx, y + dy);
      if (!seen.has(k) && g.floor(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
    }
  }
  return seen;
}
function components(g, reach) {
  const done = new Set(reach), out = [];
  g.each((x, y) => {
    if (done.has(key(x, y)) || !g.floor(x, y)) return;
    const comp = [...flood(g, x, y)].map((k) => k.split(",").map(Number));
    for (const [cx, cy] of comp) done.add(key(cx, cy));
    out.push(comp);
  });
  return out;
}
function lPath(ax, ay, bx, by) {
  const out = [];
  const sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
  let x = ax, y = ay;
  while (x !== bx) { out.push([x, y]); x += sx; }
  while (y !== by) { out.push([x, y]); y += sy; }
  out.push([x, y]);
  return out;
}

// ───────── 글로 쓰기 ─────────
function blueprintText(id, spec, grid, mapRow) {
  const [w, h] = spec.size;
  const L = [];
  L.push(`; ${spec.title || mapRow.name} — 장소 설계도 (${w}×${h}). 설계서 data/handmade/specs/act${mapRow.act || 1}.cjs → tools/build/handmade/compose.cjs가 만든다 (손으로 고치지 말고 설계서를 고친다)`);
  L.push(`; 칸 (c, r) → 월드 칸 x = c - ${w / 2}, y = ${h / 2} - r. 한 글자 = 한 칸, 위가 북쪽`);
  for (const line of spec.story || []) L.push("; " + line);
  L.push(";");
  (spec.places || []).forEach((p, i) => L.push(`;   [${i + 1}] ${p.name}${p.note ? " — " + p.note : ""}`));
  L.push(";");
  L.push(`;size ${w} ${h}`);
  L.push(`;base ${spec.base}`);
  L.push(`;zone . - - 바탕 바닥`);
  for (const [ch, z] of Object.entries(spec.zones)) L.push(`;zone ${ch} ${z}`);
  for (const [ch, r] of Object.entries(spec.roads || {})) L.push(`;road ${ch} ${r}`);
  for (const [ch, wl] of Object.entries(spec.walls)) L.push(`;wall ${ch} ${wl}`);
  if (spec.raised) L.push(`;raised ${spec.raised}`);
  if (spec.shore) L.push(`;shore ${spec.shore}`);   // 물가 거품: <바다 그림> <거품 그림> [크기] [색] (lib.cjs 3-1)
  L.push(";markers W E G X H T S");
  L.push("; W 들어오는 문 · E 나가는 문 · G 마을 출구 · X 되돌아가는 문 · H 곁가지 입구 · T 화로 · S 웨이포인트 — 엔티티는 maps.csv(기능 자리)로 maps.cjs가 놓는다");
  L.push(...grid);
  return L.join("\n") + "\n";
}
function csvCell(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, [header.join(","), ...rows.map((r) => header.map((hd) => csvCell(r[hd])).join(","))].join("\n") + "\n");
}
function readCsv(name) {
  const rows = parse(fs.readFileSync(path.join(ROOT, "data", name + ".csv"), "utf8"));
  const header = rows.shift();
  return { header, rows: rows.map((r) => Object.fromEntries(header.map((hd, i) => [hd, r[i] ?? ""]))) };
}
const fmt = (v) => String(r2(v));

// maps.csv · waypoints.csv 기능 자리 열을 설계서대로
function syncTables(results) {
  const maps = readCsv("maps"), wps = readCsv("waypoints");
  for (const { id, spec, func } of results) {
    const row = maps.rows.find((m) => m.id === id);
    row.w = String(spec.size[0]);
    row.h = String(spec.size[1]);
    row.torches = func.filter((f) => f.ch === "T").map((f) => `${fmt(f.x)}/${fmt(f.y)}`).join(";");
    const s = func.find((f) => f.ch === "S");
    const wpId = row.waypoint ? row.waypoint.split("@")[0] : (wps.rows.find((r) => r.map === id) || {}).id;
    if (s && !wpId) throw new Error(`${id}: 웨이포인트 자리가 있는데 waypoints.csv에 이 맵 줄이 없음`);
    if (!s && wpId) throw new Error(`${id}: waypoints.csv에 '${wpId}'가 있는데 설계서에 waypoint가 없음`);
    if (s) {
      row.waypoint = `${wpId}@${fmt(s.x)}/${fmt(s.y)}`;
      const wr = wps.rows.find((r) => r.id === wpId);
      wr.x = fmt(s.x); wr.y = fmt(s.y - 1.3);
    }
    for (const f of func.filter((q) => q.ch === "H")) {
      const child = maps.rows.find((m) => m.id === f.child);
      if (!child || child.parent !== id) throw new Error(`${id}: holes '${f.child}'는 이 맵을 parent로 둔 곁가지 첫 층이어야 함`);
      child.entry = `${fmt(f.x)}/${fmt(f.y)}`;
    }
    const fixed = func.filter((f) => f.ch === "B");
    const oldFixed = row.fixed ? row.fixed.split(";").map((t) => t.split("@")[0]) : [];
    if (fixed.length !== oldFixed.length || fixed.some((f, i) => f.name.replace(/#\d+$/, "") !== oldFixed[i])) throw new Error(`${id}: fixed ${fixed.map((f) => f.name)} ≠ maps.csv ${oldFixed}`);
    row.fixed = fixed.map((f) => `${f.name.replace(/#\d+$/, "")}@${fmt(f.x)}/${fmt(f.y)}`).join(";");
    // 출현 구역 (보스 맵: 호위 무리는 회랑에만 — 아레나는 보스 혼자). gen_data MapSpawns가 맵 전체 대신 이 사각형을 쓴다
    if ("area" in row) row.area = spec.area ? spec.area.join("/") : "";
    const extra = func.filter((f) => f.ch === "K");
    if (extra.length || spec.extra) row.extra = extra.map((f) => `${f.name}@${fmt(f.x)}/${fmt(f.y)}`).join(";");
  }
  writeCsv(path.join(ROOT, "data/maps.csv"), maps.header, maps.rows);
  writeCsv(path.join(ROOT, "data/waypoints.csv"), wps.header, wps.rows);
}

function main() {
  const [actName, onlyId] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const view = process.argv.includes("--view");
  if (!actName) throw new Error("사용: compose.cjs act1 [맵id] [--view]");
  const specs = require(path.join(SPEC_DIR, actName + ".cjs"));
  const ctx = require("../maps.cjs").context();
  const mapRows = load("maps");
  const results = [];
  for (const [id, spec] of Object.entries(specs)) {
    if (onlyId && id !== onlyId) continue;
    const row = mapRows.find((m) => m.id === id);
    if (!row) throw new Error(`${id}: maps.csv에 없음`);
    const out = compose(id, spec, ctx, row);
    results.push({ id, spec, ...out });
    const floors = out.grid.join("").replace(/[^.a-z=\-~WEGXHTS]/g, "").length;
    console.log(`  ${id} ${spec.size.join("×")}: 바닥 ${floors}칸 · 화로 ${out.torches.length} · 세트 ${out.rows.filter((r) => r.kind === "set").length} · 소품 ${out.rows.filter((r) => r.kind === "prop").length} · 무늬 ${out.rows.filter((r) => r.kind === "decal").length}`);
    if (view) { console.log(out.grid.join("\n")); continue; }
    fs.writeFileSync(path.join(hm.HM_DIR, id + ".txt"), blueprintText(id, spec, out.grid, row));
    writeCsv(path.join(hm.HM_DIR, id + ".csv"), ["kind", "name", "x", "y", "scale", "flip", "tint", "args", "note"], out.rows);
  }
  if (!view) syncTables(results);
}

if (require.main === module) main();
module.exports = { compose };
