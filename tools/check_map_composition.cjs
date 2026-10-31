#!/usr/bin/env node
// 맵 구성 검사기 (맵 구성 v5 2단계 · docs/design/map-composition-v5-plan.md P1~P6 · 수치 정의 = docs/review/map-audit-20261031.md 「수치 정의」).
//   node tools/check_map_composition.cjs --map sanctum[,sulfurmarsh]   맵을 짓지 않고(메모리에서) 빌더와 같은 계산으로 잰다
//   node tools/check_map_composition.cjs --all                          v5 맵(설계도 ;v5) 전부 — 0건이어야 한다. --legacy면 v4 맵도 참고로 잰다(종료 코드에 넣지 않음)
//   node tools/check_map_composition.cjs --selftest                     tests/quality/map_composition/*.json 가짜 입력(위반을 심음)을 정확히 잡는가
//   [--json 파일]  맵별 수치
// 항목 (0건이어야 한다):
//   guide        길 안내 도장(ArtGuide) 0 — 길은 바닥 구역 경계의 빈 띠(P1)
//   bandWidth    띠 폭 ≤2: 띠 칸(설계도 바탕 . · 길 글자)마다 가로·세로·두 대각 연속 칸 수의 최솟값 ≥3인 칸 덩어리 수
//   bandBreak    띠 끊김: 띠+출입구 표식(W E H X G)의 4방향 덩어리 수 − 1 + 띠로 닿지 않는 출구 수
//   bandLoop     띠 고리: 띠에 둘러싸인 구멍(띠 밖 칸의 8방향 덩어리 중 맵 테두리에 닿지 않는 것) 수
//   bandDeadEnd  막다른 띠: 입구 → 출구마다 띠 안 최단 경로를 합친 골격에서 2칸(체비셰프) 넘게 떨어진 띠 칸 덩어리 수
//   bandEdgeEmpty 띠 옆 빈 바닥: 띠와 바닥(그림·색)이 같은 이웃 칸이 띠에서 3칸 넘게 이어지는 곳 수 (띠 경계가 안 보임 · v5 C)
//   straightEdge 구역 경계 직선 연속 >6칸: 바닥이 다른 걷는 칸 경계에서 한쪽 바닥이 같은 채 한 줄로 이어진 변 묶음 수
//                + 한 칸씩 고른 45° 계단이 7칸 이상 이어진 수 (화면에서 비스듬한 직선 — 칸 단위로 잰다, 그림 조각 단위 아님)
//   scattered    산발 복제: 1단계 정의(같은 그림 3개 이상 · 4.5칸(기둥 7칸) 묶음이 한 줄도 벽 따라도 아닌 개수) — 축 있는 반복에
//                「평행 두 줄(열주)」·「고리(테두리)」를 더 인정 (1단계 정의는 2열 열주를 산발로 셌다)
//   featureSpace 특징 과밀 공간: 역할 feature 장식이 2개 이상인 공간 수 (공간 = 구역 글자 8칸 이상 · 나머지 칸은 가까운 공간)
//   pillarSingle 기둥 낱개: 1단계 정의 (같은 기둥 그림이 5칸 안에, 또는 12칸 안 같은 가로·세로 줄에 없음)
//   landmarkBlock 랜드마크 과밀: 16×16칸 구역에 feature 2개 이상인 구역 수
//   branchExtra  가지 간 추가 연결: 띠에 닿지 않는 공간(가지)들과 「골격」 묶음 사이 연결 입구(접한 칸 덩어리)로 만든 그래프의 순환 수가
//                가지 수의 50%를 넘는 만큼
//   waypoint     웨이포인트(표식 S)가 띠에서 1칸(8방향) 넘게 떨어짐
//   decorCollision 기존 검사기 tools/check_decor_collision.cjs 문제 수 (그 맵만)
//   budget       엔티티 예산: 설계도 맵 노말 66장 합 ≤ 47900 (검사한 맵은 메모리 계산, 나머지는 map/<id>.map)
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const roles = require("./build/handmade/roles.cjs");

const BUDGET = 47900;
const MAX_RUN = 6, MAX_WIDTH = 2;
const ITEMS = ["guide", "bandWidth", "bandBreak", "bandLoop", "bandDeadEnd", "bandEdgeEmpty", "straightEdge", "scattered", "featureSpace", "pillarSingle", "landmarkBlock", "branchExtra", "waypoint", "decorCollision", "budget"];
const LABEL = { guide: "길 안내 도장", bandWidth: "띠 폭 >2", bandBreak: "띠 끊김", bandLoop: "띠 고리", bandDeadEnd: "막다른 띠", bandEdgeEmpty: "띠 옆 빈 바닥",
  straightEdge: "구역 경계 직선 >6", scattered: "산발 복제", featureSpace: "특징 과밀 공간", pillarSingle: "기둥 낱개", landmarkBlock: "랜드마크 과밀 16×16",
  branchExtra: "가지 간 추가 연결 >50%", waypoint: "웨이포인트 골격 밖", decorCollision: "check_decor_collision", budget: "엔티티 예산" };
const CONNECT = new Set(["W", "E", "H", "X", "G"]);
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const K = (c, r) => `${c},${r}`;
const unK = (k) => k.split(",").map(Number);
const PILLAR = (s) => roles.isPillar(s);
const roleOf = (s) => roles.roleOf(s);

// ───────── 격자 ─────────
function makeGrid(L) {
  const W = L.w, H = L.h, g = L.grid;
  const G = { W, H };
  G.ch = (c, r) => (r >= 0 && r < H && c >= 0 && c < W ? g[r][c] : null);
  G.floor = (c, r) => { const x = G.ch(c, r); return x !== null && !L.walls.has(x); };
  G.cells = () => { const o = []; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) o.push([c, r]); return o; };
  G.cellOf = (x, y) => [Math.floor(x + W / 2), H / 2 - Math.floor(y)];
  // 길·표식 칸의 구역: 가장 가까운 구역 글자 (lib.cjs parseBlueprint zoneOf와 같은 차례)
  const zone = new Map(), q = [];
  for (const [c, r] of G.cells()) { const x = G.ch(c, r); if (x in L.zones) { zone.set(K(c, r), x); q.push([c, r]); } }
  for (let i = 0; i < q.length; i++) {
    const [c, r] = q[i], z = zone.get(K(c, r));
    for (const [dc, dr] of D4) { const n = [c + dc, r + dr]; if (G.floor(...n) && !zone.has(K(...n))) { zone.set(K(...n), z); q.push(n); } }
  }
  G.zoneOf = (c, r) => zone.get(K(c, r)) || null;
  // 칸의 바닥 그림·색 (decor.cjs floorAt과 같다 — 길 글자는 그 길 그림, 구역 그림이 없으면 바탕)
  G.floorKey = (c, r) => {
    if (!G.floor(c, r)) return null;
    const x = G.ch(c, r);
    if (L.roads && x in L.roads) return `${L.roads[x].art}|${L.roads[x].tint}`;
    const z = L.zones[G.zoneOf(c, r)] || {};
    return z.art ? `${z.art}|${z.tint || "1/1/1"}` : `${L.base.art}|${L.base.tint}`;
  };
  G.isBand = (c, r) => { const x = G.ch(c, r); return x === "." || (!!L.roads && x !== null && x in L.roads); };
  G.marker = (c, r) => { const x = G.ch(c, r); return x !== null && L.markers.has(x) ? x : null; };
  return G;
}
const comps = (set, dirs) => {   // 칸 열쇠 집합 → 덩어리들
  const seen = new Set(), out = [];
  for (const k of set) {
    if (seen.has(k)) continue;
    const comp = [k]; seen.add(k);
    for (let i = 0; i < comp.length; i++) { const [c, r] = unK(comp[i]); for (const [dc, dr] of dirs) { const n = K(c + dc, r + dr); if (set.has(n) && !seen.has(n)) { seen.add(n); comp.push(n); } } }
    out.push(comp);
  }
  return out;
};
const bfs = (sources, pass, dirs = D4) => {
  const dist = new Map(), prev = new Map(), q = [];
  for (const s of sources) { dist.set(s, 0); q.push(s); }
  for (let i = 0; i < q.length; i++) {
    const [c, r] = unK(q[i]);
    for (const [dc, dr] of dirs) { const n = K(c + dc, r + dr); if (!dist.has(n) && pass(n)) { dist.set(n, dist.get(q[i]) + 1); prev.set(n, q[i]); q.push(n); } }
  }
  return { dist, prev };
};

// ───────── 띠 (P1·P2) ─────────
function bandMetrics(L, G) {
  const band = new Set(), conn = new Set();
  let start = null;
  const exits = [];
  for (const [c, r] of G.cells()) {
    if (!G.floor(c, r)) continue;
    if (G.isBand(c, r)) band.add(K(c, r));
    const m = G.marker(c, r);
    if (m === "S" && D4.some(([dc, dr]) => G.isBand(c + dc, r + dr))) conn.add(K(c, r));   // 띠 위 웨이포인트는 띠를 잇는다 (자리 검사는 waypoint 항목)
    if (m && CONNECT.has(m)) { conn.add(K(c, r)); if (m === "W" || (m === "G" && !start)) start = start && m === "G" ? start : K(c, r); if ("EHX".includes(m)) exits.push(K(c, r)); }
  }
  const B = new Set([...band, ...conn]);
  // 폭: 칸마다 가로·세로·두 대각 연속 수의 최솟값
  const run = (c, r, dc, dr) => { let n = 1; for (let k = 1; band.has(K(c + dc * k, r + dr * k)); k++) n++; for (let k = 1; band.has(K(c - dc * k, r - dr * k)); k++) n++; return n; };
  const widthOf = (k) => { const [c, r] = unK(k); return Math.min(run(c, r, 1, 0), run(c, r, 0, 1), run(c, r, 1, 1), run(c, r, 1, -1)); };
  const wide = new Set([...band].filter((k) => widthOf(k) > MAX_WIDTH));
  const widthBlobs = comps(wide, D8);
  let maxWidth = 0; for (const k of band) maxWidth = Math.max(maxWidth, widthOf(k));
  // 끊김
  const parts = comps(B, D4);
  const startPart = parts.find((p) => start && p.includes(start)) || null;
  const reach = new Set(startPart || []);
  const unreached = exits.filter((e) => !reach.has(e));
  const breaks = band.size ? Math.max(0, parts.length - 1) + unreached.length : (exits.length ? exits.length : 0);
  // 고리: 띠 밖(맵 밖 한 겹 포함) 8방향 덩어리 중 맵 테두리에 닿지 않는 것
  const outside = new Set();
  for (let r = -1; r <= G.H; r++) for (let c = -1; c <= G.W; c++) if (!B.has(K(c, r))) outside.add(K(c, r));
  const holes = comps(outside, D8).filter((p) => !p.some((k) => { const [c, r] = unK(k); return c < 0 || r < 0 || c >= G.W || r >= G.H; }));
  // 막다른 띠: 입구 → 출구 최단 경로 합 (골격)에서 체비셰프 2칸 이상
  const U = new Set();
  if (start) {
    const { prev } = bfs([start], (n) => B.has(n));
    for (const e of exits) { if (!reach.has(e)) continue; for (let k = e; k !== undefined; k = prev.get(k)) U.add(k); }
  }
  const nearU = (k) => { const [c, r] = unK(k); for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (U.has(K(c + dc, r + dr))) return true; return false; };
  //   출구에 하나도 못 닿으면(끊김으로 센다) 재지 않는다 · 고리 테두리 칸(구멍에 8방향으로 닿음)은 고리로 세므로 뺀다
  const holeCells = new Set(holes.flat());
  const rim = (k) => { const [c, r] = unK(k); return D8.some(([dc, dr]) => holeCells.has(K(c + dc, r + dr))); };
  const dead = new Set(U.size ? [...band].filter((k) => reach.has(k) && !nearU(k) && !rim(k)) : []);
  const deadParts = comps(dead, D8);
  // 띠 옆 빈 바닥: 띠와 바닥이 같은 이웃 칸이 띠에서 3칸 넘게 이어짐
  const bandKey = new Map([...band].map((k) => [k, G.floorKey(...unK(k))]));
  const same = new Set();
  for (const k of band) { const [c, r] = unK(k); for (const [dc, dr] of D4) { const n = K(c + dc, r + dr); if (!B.has(n) && G.floor(c + dc, r + dr) && !G.marker(c + dc, r + dr) && G.floorKey(c + dc, r + dr) === bandKey.get(k)) same.add(n); } }
  const emptySpots = [];
  for (const part of comps(same, D8)) {
    const key0 = G.floorKey(...unK(part[0]));
    const { dist } = bfs(part, (n) => !B.has(n) && G.floor(...unK(n)) && G.floorKey(...unK(n)) === key0);
    const far = Math.max(...dist.values());
    if (far >= 2) emptySpots.push({ at: part[0], far });
  }
  return { band, conn, B, start, exits, unreached, widthBlobs, maxWidth, breaks, holes, U, deadParts, emptySpots, widthOf };
}

// ───────── 구역 경계 직선 (P1 · v5 C) ─────────
function straightEdges(L, G) {
  const found = [];
  const scan = (len, lines, keyA, keyB, tag) => {
    for (let ln = 0; ln < lines; ln++) {
      const ivs = [];
      let a = null, b = null;
      const close = (cur, t) => { if (cur && t - cur.s > MAX_RUN) ivs.push([cur.s, t]); };
      for (let t = 0; t <= len; t++) {
        const ka = t < len ? keyA(ln, t) : null, kb = t < len ? keyB(ln, t) : null;
        const edge = ka && kb && ka !== kb;
        if (!edge) { close(a, t); close(b, t); a = b = null; continue; }
        if (!a || a.k !== ka) { close(a, t); a = { s: t, k: ka }; }
        if (!b || b.k !== kb) { close(b, t); b = { s: t, k: kb }; }
      }
      ivs.sort((p, q) => p[0] - q[0]);
      const merged = [];
      for (const iv of ivs) { const m = merged[merged.length - 1]; if (m && iv[0] < m[1]) m[1] = Math.max(m[1], iv[1]); else merged.push(iv.slice()); }
      for (const [s, e] of merged) found.push({ tag, line: ln, from: s, len: e - s });
    }
  };
  // 가로 변: (c, r) | (c, r+1) — 줄 r마다 c로 · 세로 변: (c, r) | (c+1, r) — 열 c마다 r로
  scan(G.W, G.H - 1, (r, c) => G.floorKey(c, r), (r, c) => G.floorKey(c, r + 1), "h");
  scan(G.H, G.W - 1, (c, r) => G.floorKey(c, r), (c, r) => G.floorKey(c + 1, r), "v");
  // 45° 계단 (10-31 표본 검수: 칸 계단이 한 칸씩 고르게 이어지면 화면에서 비스듬한 직선으로 읽혔다): 대각선 위 칸 X마다 바닥 A,
  //   X의 가로 이웃·세로 이웃이 A가 아니고 다음 계단 칸(X+대각)이 다시 A인 자리가 같은 A로 이어지는 수 — 7칸 이상이면 한 번
  const key = (c, r) => G.floorKey(c, r);
  for (const [dc, dr] of [[1, -1], [1, 1]]) for (const [hx, vy] of [[-1, dr], [1, -dr]]) {
    const seen = new Set();
    for (let r0 = 0; r0 < G.H; r0++) for (let c0 = 0; c0 < G.W; c0++) {
      // 한 경계를 양쪽에서 두 번 세지 않게 바닥 이름이 앞서는 쪽(A < B)에서만
      const stair = (c, r) => { const a = key(c, r); if (!a) return null; const h = key(c + hx, r), v = key(c, r + vy); return h && v === h && h !== a && a < h && key(c + dc, r + dr) === a ? a : null; };
      if (seen.has(K(c0, r0))) continue;
      const a = stair(c0, r0);
      if (!a || stair(c0 - dc, r0 - dr) === a) continue;   // 줄의 첫 칸에서만 센다
      let n = 0;
      for (let c = c0, r = r0; stair(c, r) === a; c += dc, r += dr) { seen.add(K(c, r)); n++; }
      if (n > MAX_RUN) found.push({ tag: "d", line: r0, from: c0, len: n + 1, dc, dr, hx, vy });
    }
  }
  return found;
}

// ───────── 배치 (P3·P5) — 1단계 zone_sheet.py 정의 ─────────
function placementMetrics(L, G, band) {
  const floorCells = G.cells().filter(([c, r]) => G.floor(c, r));
  const edgeCells = floorCells.filter(([c, r]) => D4.some(([dc, dr]) => !G.floor(c + dc, r + dr))).map(([c, r]) => K(c, r));
  const wallD = bfs(edgeCells, (n) => G.floor(...unK(n))).dist;
  const nearWall = (x, y) => (wallD.get(K(...G.cellOf(x, y))) ?? 0) <= 1;
  const solid = L.pieces.filter((p) => !p.decal && roleOf(p.s) !== "floor");
  const by = new Map();
  for (const p of solid) { if (!by.has(p.s)) by.set(p.s, []); by.get(p.s).push(p); }
  let scattered = 0;
  const scatteredKinds = [];
  const axisOk = (grp) => {
    const n = grp.length, mx = grp.reduce((a, p) => a + p.x, 0) / n, my = grp.reduce((a, p) => a + p.y, 0) / n;
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of grp) { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, lmin = tr / 2 - Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    if (Math.sqrt(Math.max(0, lmin) / n) <= 0.5) return "line";                                  // 한 줄 (1단계)
    if (grp.every((p) => nearWall(p.x, p.y))) return "wall";                                      // 벽 따라 (1단계)
    // 평행 두 줄 (열주): 긴 축에 수직인 거리로 두 무리 — 무리마다 흩어짐 ≤0.5 · 2개 이상 · 사이 1.5칸 이상
    //   두 줄이 짧고 사이가 넓으면 긴 축이 줄에 수직이라 긴 축과 그 수직 축을 모두 본다
    const sd = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
    const th0 = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    for (const th of [th0, th0 + Math.PI / 2]) {
      const off = grp.map((p) => -(p.x - mx) * Math.sin(th) + (p.y - my) * Math.cos(th)).sort((a, b) => a - b);
      for (let k = 2; k <= n - 2; k++) if (off[k] - off[k - 1] >= 1.5 && sd(off.slice(0, k)) <= 0.5 && sd(off.slice(k)) <= 0.5) return "rows2";
    }
    // 고리 (테두리): 4개 이상 · 가운데에서 거리 1.5칸 이상 · 거리 흩어짐 ≤0.5
    if (n >= 4) { const rad = grp.map((p) => Math.hypot(p.x - mx, p.y - my)), m = rad.reduce((s, v) => s + v, 0) / n; if (m >= 1.5 && sd(rad) <= 0.5) return "ring"; }
    return null;
  };
  for (const [s, ps] of by) {
    if (ps.length < 3) continue;
    const lim = PILLAR(s) ? 7 : 4.5, used = new Set(), groups = [];
    ps.forEach((p, i0) => {
      if (used.has(i0)) return;
      const st = [i0], grp = []; used.add(i0);
      while (st.length) { const k = st.pop(); grp.push(ps[k]); ps.forEach((o, j) => { if (!used.has(j) && Math.hypot(o.x - ps[k].x, o.y - ps[k].y) <= lim) { used.add(j); st.push(j); } }); }
      groups.push(grp);
    });
    let bad = 0;
    for (const grp of groups) {
      const ok = grp.length >= 3 ? !!axisOk(grp) : grp.length === 2 && PILLAR(s);
      if (!ok) bad += grp.length;
    }
    if (bad >= 3 || (bad && bad === ps.length)) { scattered += bad; scatteredKinds.push([s, bad]); }
  }
  // 공간 (구역 글자 8칸 이상) · 칸 주인 (가까운 공간)
  const zcells = new Map();
  for (const [c, r] of floorCells) { const x = G.ch(c, r); if (x in L.zones && x !== ".") { if (!zcells.has(x)) zcells.set(x, []); zcells.get(x).push(K(c, r)); } }
  const zones = [...zcells.keys()].filter((z) => zcells.get(z).length >= 8).sort();
  const owner = new Map(), q = [];
  for (const z of zones) for (const k of zcells.get(z)) { owner.set(k, z); q.push(k); }
  for (let i = 0; i < q.length; i++) { const [c, r] = unK(q[i]); for (const [dc, dr] of D4) { const n = K(c + dc, r + dr); if (!owner.has(n) && G.floor(c + dc, r + dr)) { owner.set(n, owner.get(q[i])); q.push(n); } } }
  const feats = L.pieces.filter((p) => !p.decal && roleOf(p.s) === "feature");
  const featBy = new Map();
  for (const p of feats) { const z = owner.get(K(...G.cellOf(p.x, p.y))); if (z) featBy.set(z, (featBy.get(z) || 0) + 1); }
  const featureSpaces = [...featBy.entries()].filter(([, n]) => n >= 2).map(([z, n]) => `${z}×${n}`);
  // 기둥 낱개
  const pillars = solid.filter((p) => PILLAR(p.s));
  const partner = (p, o) => { if (o === p || o.s !== p.s) return false; const dd = Math.hypot(o.x - p.x, o.y - p.y); return dd <= 5 || (dd <= 12 && (Math.abs(o.x - p.x) <= 0.6 || Math.abs(o.y - p.y) <= 0.6)); };
  const singles = pillars.filter((p) => !pillars.some((o) => partner(p, o)));
  // 랜드마크 16×16
  const blocks = new Map();
  for (const p of feats) { const [c, r] = G.cellOf(p.x, p.y); const k = `${Math.floor(c / 16)},${Math.floor(r / 16)}`; blocks.set(k, (blocks.get(k) || 0) + 1); }
  const dense = [...blocks.entries()].filter(([, n]) => n >= 2);
  return { scattered, scatteredKinds, zones, zcells, owner, featureSpaces, singles, dense, feats: feats.length, axisOk };
}

// ───────── 가지 간 추가 연결 (P5) ─────────
function branchMetrics(L, G, bm, pm) {
  const { B } = bm, { zones, zcells, owner } = pm;
  const skel = new Set(zones.filter((z) => zcells.get(z).some((k) => { const [c, r] = unK(k); return D4.some(([dc, dr]) => B.has(K(c + dc, r + dr))); })));
  const branches = zones.filter((z) => !skel.has(z));
  const nodeOf = (k) => { if (B.has(k)) return "@"; const z = owner.get(k); return z && branches.includes(z) ? z : "@"; };
  const edges = [];
  for (const X of branches) {
    const touch = new Map();
    for (const [k, z] of owner) {
      if (z !== X || B.has(k)) continue;
      const [c, r] = unK(k);
      for (const [dc, dr] of D4) {
        const n = K(c + dc, r + dr);
        if (!G.floor(c + dc, r + dr)) continue;
        const t = nodeOf(n);
        if (t === X || (t !== "@" && t < X)) continue;   // 가지끼리는 글자 순 한쪽에서만 센다
        if (!touch.has(t)) touch.set(t, new Set());
        touch.get(t).add(k);
      }
    }
    for (const [t, set] of touch) for (let i = comps(set, D8).length; i > 0; i--) edges.push([X, t]);
  }
  const nodes = ["@", ...branches], parent = new Map(nodes.map((n) => [n, n]));
  const find = (n) => { while (parent.get(n) !== n) n = parent.get(n); return n; };
  for (const [a, b] of edges) parent.set(find(a), find(b));
  const C = new Set(nodes.map(find)).size;
  const cycles = Math.max(0, edges.length - nodes.length + C), allowed = Math.floor(branches.length * 0.5);
  return { skeleton: [...skel], branches, edges: edges.length, cycles, allowed, extra: Math.max(0, cycles - allowed) };
}

// ───────── 한 맵 ─────────
function analyze(L) {
  const G = makeGrid(L);
  const bm = bandMetrics(L, G);
  const pm = placementMetrics(L, G, bm.band);
  const br = branchMetrics(L, G, bm, pm);
  const runs = straightEdges(L, G);
  const wps = G.cells().filter(([c, r]) => G.marker(c, r) === "S");
  const wpOff = wps.filter(([c, r]) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (bm.band.has(K(c + dc, r + dr))) return false; return true; }).length;
  const counts = {
    guide: L.guide || 0, bandWidth: bm.widthBlobs.length, bandBreak: bm.breaks, bandLoop: bm.holes.length, bandDeadEnd: bm.deadParts.length,
    bandEdgeEmpty: bm.emptySpots.length, straightEdge: runs.length, scattered: pm.scattered, featureSpace: pm.featureSpaces.length,
    pillarSingle: pm.singles.length, landmarkBlock: pm.dense.length, branchExtra: br.extra, waypoint: wpOff,
  };
  const w2 = (k) => { const [c, r] = unK(k); return `(${c - G.W / 2}, ${G.H / 2 - r})`; };   // 월드 칸 좌표로 적는다
  const detail = {
    bandCells: bm.band.size, maxWidth: bm.maxWidth, wide: bm.widthBlobs.map((b) => w2(b[0])), unreached: bm.unreached.map(w2), holes: bm.holes.map((h) => `${w2(h[0])}~${h.length}칸`),
    dead: bm.deadParts.map((p) => `${w2(p[0])}~${p.length}칸`), empty: bm.emptySpots.map((e) => `${w2(e.at)} ${e.far + 1}칸`),
    runs: runs.map((r) => (r.tag === "d" ? `45° (${r.from - G.W / 2}, ${G.H / 2 - r.line})부터 ${r.len}칸` : `${r.tag} ${r.tag === "h" ? `y=${G.H / 2 - r.line}` : `x=${r.line - G.W / 2 + 1}`} ${r.len}칸`)),
    scatteredKinds: pm.scatteredKinds.map(([s, n]) => `${s}×${n}`), featureSpaces: pm.featureSpaces, pillarSingles: pm.singles.map((p) => `${p.s}@${p.x},${p.y}`),
    dense: pm.dense.map(([k, n]) => `${k}×${n}`), spaces: pm.zones.length, features: pm.feats,
    skeleton: br.skeleton, branches: br.branches, branchEdges: br.edges, branchCycles: br.cycles, branchAllowed: br.allowed,
  };
  return { counts, detail };
}
module.exports = { analyze, makeGrid, bandMetrics, straightEdges, placementMetrics, ITEMS, LABEL, BUDGET, MAX_RUN, MAX_WIDTH };

// ───────── 실제 맵 → 입력 ─────────
function layoutOf(id, env) {
  const { hm, maps, mapRows, ctx, quiet, num } = env;
  const d = mapRows.find((m) => m.id === id);
  if (!d) throw new Error(`${id}: maps.csv에 없음`);
  const bp = hm.parseBlueprint(id);
  const rows = hm.loadRows(id);
  const func = d.kind === "handmade" ? hm.functionalEntities(d, mapRows, ctx, rows) : quiet(() => maps.desiredEntities(d, mapRows, ctx));
  const art = quiet(() => hm.artEntities(d, ctx, bp, rows, func));
  return {
    id, v5: !!bp.v5, w: bp.w, h: bp.h, grid: bp.rows, walls: new Set(Object.keys(bp.walls)), zones: bp.zones, roads: bp.roads, base: bp.base, markers: bp.markers,
    pieces: (art.pieces || []).map((p) => ({ name: p.name, s: p.sprite, x: p.x, y: p.y, decal: p.decal, block: p.block })),
    guide: art.entities.filter((e) => /^ArtGuide/.test(e.name)).length, entities: art.entities.length + func.length + 1, piecesKnown: !!art.mode,
  };
}
function fileEntities(id) {
  const { MapBuilder } = require("./build/lib.cjs");
  const f = path.join(ROOT, "map", id + ".map");
  return fs.existsSync(f) ? MapBuilder.read(f).listEntities().length - 5 : 0;   // 템플릿 5개(맵·Background·MapleMapLayer·RectTileMap·SpawnLocation) 뺌
}
// 자가 테스트 입력(JSON) → 입력
function layoutFromJson(j) {
  return Object.assign({ guide: 0, pieces: [], roads: {}, base: { art: "base", tint: "1/1/1" } }, j, {
    walls: new Set(j.walls || ["#"]), markers: new Set((j.markers || "WEGXHTS").split("")), grid: j.grid, w: j.grid[0].length, h: j.grid.length,
  });
}

function selftest() {
  const dir = path.join(ROOT, "tests/quality/map_composition");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  let ok = 0, planted = 0;
  const fails = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const r = analyze(layoutFromJson(j));
    const want = j.expect || {};
    const bad = ITEMS.filter((it) => !["decorCollision", "budget"].includes(it) && (r.counts[it] || 0) !== (want[it] || 0));
    planted += Object.values(want).reduce((a, v) => a + v, 0);
    if (bad.length) fails.push(`${f}: ${bad.map((it) => `${it} 기대 ${want[it] || 0} · 실제 ${r.counts[it]}`).join(" / ")}${process.env.MC_DEBUG ? "\n" + JSON.stringify(r.detail) : ""}`);
    else ok++;
  }
  for (const m of fails) console.log("  ! " + m);
  console.log(`[check_map_composition --selftest] 입력 ${files.length}개 · 통과 ${ok} · 심은 위반 ${planted}건 ${fails.length ? "놓침·오탐 있음" : "모두 정확히 검출 · 깨끗한 입력 오탐 0"}`);
  return fails.length === 0 && files.length > 0;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) { process.exit(selftest() ? 0 : 1); }
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const hm = require("./build/handmade/lib.cjs");
  const maps = require("./build/maps.cjs");
  const { load, num, quiet } = require("./build/lib.cjs");
  const mapRows = load("maps");
  const env = { hm, maps, mapRows, ctx: maps.context(), quiet, num };
  const all = mapRows.filter((m) => m.kind !== "handmade" && hm.hasBlueprint(m.id)).map((m) => m.id);
  let ids = [];
  if (opt("--map")) ids = opt("--map").split(",").filter(Boolean);
  else if (args.includes("--all")) ids = all.filter((id) => args.includes("--legacy") || hm.parseBlueprint(id).v5);
  else { console.log("사용: check_map_composition.cjs --map <id[,id]> | --all [--legacy] | --selftest [--json 파일]"); process.exit(2); }
  const report = {}, entities = {};
  let total = 0;
  for (const id of ids) {
    const L = layoutOf(id, env);
    const r = analyze(L);
    entities[id] = L.entities;
    report[id] = { v5: L.v5, entities: L.entities, counts: r.counts, detail: r.detail };
  }
  // 기존 검사기 (그 맵들만 · 한 번에)
  const policyIds = ids.filter((id) => require("./build/handmade/decor.cjs").modeOf(id));
  if (policyIds.length) {
    const r = require("child_process").spawnSync(process.execPath, [path.join(__dirname, "check_decor_collision.cjs"), ...policyIds, "--all"], { cwd: ROOT, encoding: "utf8" });
    const lines = (r.stdout + r.stderr).split("\n");
    for (const id of policyIds) report[id].counts.decorCollision = lines.filter((l) => l.startsWith(`  ! ${id} `) || l.startsWith(`  ! ${id}:`)).length;
    const tail = lines.filter((l) => l.startsWith("[check_decor_collision]")).pop() || "";
    const nTot = Number((tail.match(/문제 (\d+)건/) || [0, 0])[1]);
    const nMap = policyIds.reduce((a, id) => a + report[id].counts.decorCollision, 0);
    if (nTot > nMap) { report[policyIds[0]].counts.decorCollision += nTot - nMap; report[policyIds[0]].detail.decorTables = [`표 문제 ${nTot - nMap}건 (decor_collision·map_sets·tile_classes)`]; }   // 맵 밖 표 문제는 첫 맵에 얹어 실패로 센다
  }
  for (const id of ids) if (report[id].counts.decorCollision === undefined) report[id].counts.decorCollision = 0;
  // 엔티티 예산
  for (const id of all) total += entities[id] !== undefined ? entities[id] : fileEntities(id);
  const over = total > BUDGET ? 1 : 0;
  let fail = 0;
  for (const id of ids) {
    const rp = report[id];
    rp.counts.budget = over;
    const sum = ITEMS.reduce((a, it) => a + (rp.counts[it] || 0), 0);
    if (rp.v5) fail += sum;
    const bad = ITEMS.filter((it) => rp.counts[it]).map((it) => `${LABEL[it]} ${rp.counts[it]}`);
    console.log(`  ${id}${rp.v5 ? " [v5]" : " [v4 참고]"}: 위반 ${sum}${bad.length ? " — " + bad.join(" · ") : ""} · 엔티티 ${rp.entities} · 띠 ${rp.detail.bandCells}칸(최대 폭 ${rp.detail.maxWidth}) · 공간 ${rp.detail.spaces} · 특징 ${rp.detail.features}`);
    if (args.includes("--verbose") || (rp.v5 && sum)) for (const [k, v] of Object.entries(rp.detail)) if (Array.isArray(v) ? v.length : false) console.log(`      ${k}: ${v.slice(0, 12).join(" · ")}${v.length > 12 ? " …" : ""}`);
  }
  if (opt("--json")) fs.writeFileSync(opt("--json"), JSON.stringify({ budget: { total, limit: BUDGET }, maps: report }, null, 1));
  const v5n = ids.filter((id) => report[id].v5).length;
  console.log(`[check_map_composition] 맵 ${ids.length}장 (v5 ${v5n}) · 엔티티 합 ${total}/${BUDGET} · v5 위반 ${fail}건`);
  process.exit(fail ? 1 : 0);
}
if (require.main === module) main();
