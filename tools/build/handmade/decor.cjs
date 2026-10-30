// 맵 장식 정책·길 안내·이음새 (10-31 사용자 실플레이 피드백 C-1~C-6 · 값은 data/handmade/specs/decor_policy.cjs).
//   lib.cjs artEntities가 정책 맵(POLICY.FULL·COLLIDE_ONLY)에서 부른다. 검사기 tools/check_decor_collision.cjs도 같은 함수로 잰다.
//   · classOf(그림)          decor_collision.csv 분류 — tall=막음 · floor/portal/overlay/바닥 무늬=통과 (C-2)
//   · planRows(...)          흩뿌림 1/4 · 액트 1 세 맵 세트 절반·부적합 제외 (C-1, 길 비우기 전)
//   · routes(...)            들어오는 문 → 출구·굴 입구·되돌아가는 문·끝방 실측 경로 → 줄 당기기 → 모서리 둥글리기 → 0.25칸 간격 점 (C-3·C-6)
//   · guideEntities(...)     곡선을 12°마다 끊은 토막을 돌린 반복 그림 두 겹(테 반투명 + 가운데 불투명)으로 (사각형 이어 붙이기 아님)
//   · seamEntities(...)      바닥 경계 그라데이션 띠 · 볼록 모서리 45° 반칸 조각 · 막힌 칸 옆 그늘 (C-5)
"use strict";
const fs = require("fs");
const path = require("path");
const { parse } = require("../../lib/csv.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const POLICY = require(path.join(ROOT, "data/handmade/specs/decor_policy.cjs"));
const S = 1.28;
const key = (x, y) => `${x},${y}`;
const r3 = (v) => Math.round(v * 1000) / 1000;
const parseArgs = (text) => Object.fromEntries((text || "").split(";").filter(Boolean).map((kv) => { const [k, v] = kv.split("="); return [k.trim(), (v || "").trim()]; }));

// ───────── C-2 분류 ─────────
let classCache = null;
function classTable() {
  if (!classCache) {
    const rows = parse(fs.readFileSync(path.join(ROOT, "data/decor_collision.csv"), "utf8"));
    const h = rows.shift();
    classCache = {};
    for (const r of rows) if (r.length > 1) { const o = Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])); classCache[o.name] = o; }
  }
  return classCache;
}
const isDecalName = (n) => /decal/.test(n);
function classOf(name) {
  if (isDecalName(name)) return { name, class: "decal", collide: "pass", flat: "1", opaqueH: "0" };
  const c = classTable()[name];
  if (!c) throw new Error(`그림 '${name}'의 충돌 분류가 data/decor_collision.csv에 없음 — 한 줄 넣는다 (tall=막음 · floor/portal/overlay=통과)`);
  return c;
}
const modeOf = (id) => (POLICY.FULL.includes(id) ? "full" : POLICY.COLLIDE_ONLY.includes(id) ? "collide" : null);

// ───────── C-1 흩뿌림·세트 ─────────
//   포털·입구 그림(portal)과 겹친 빛(overlay)은 기능 그림이라 흩뿌림이 아니다
const isScatterRow = (r) => (r.kind === "prop" && r.note !== "손으로 고른 자리" && parseArgs(r.args).keep !== "1" && !["portal", "overlay"].includes(classOf(r.name).class)) || r.kind === "cluster";
const isDressDecal = (r) => r.kind === "decal" && r.note !== "손으로 고른 자리" && parseArgs(r.args).keep !== "1";
function rank(id, r) {   // 행마다 고정된 섞음 순서 (빌드마다 같다)
  let h = 2166136261 >>> 0;
  for (const ch of `${id}|${r.kind}|${r.name}|${r.x}|${r.y}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}
const floorish = (n) => { const c = classOf(n); return c.class === "floor" || c.class === "decal"; };
// 길 비우기 전 단계: 부적합 빼기 · 세트 줄이기 · 흩뿌림 후보 고르기. stats는 전후 표에 쓴다
function planRows(d, rows) {
  const id = d.id, trio = POLICY.ACT1_TRIO.includes(id), K = POLICY.SCATTER_KEEP;
  const stats = { setsBefore: rows.filter((r) => r.kind === "set").length, unfitSets: 0, unfitProps: 0 };
  let list = rows.slice();
  if (trio) {
    list = list.filter((r) => {
      if (r.kind === "set" && POLICY.UNFIT_SETS.includes(r.name)) { stats.unfitSets++; return false; }
      if (r.kind === "prop" && POLICY.UNFIT_SPRITES.includes(r.name) && parseArgs(r.args).keep !== "1") { stats.unfitProps++; return false; }
      return true;
    });
    const sets = list.filter((r) => r.kind === "set");
    const target = Math.round(stats.setsBefore * POLICY.SET_KEEP);
    const seen = new Set();
    const pri = (r) => (r.name.startsWith("a1_lm_") ? 0 : r.note === "손으로 고른 자리" ? 1 : 2);
    const order = sets.map((r, i) => ({ r, i })).sort((a, b) => pri(a.r) - pri(b.r) || a.i - b.i);
    const keep = new Set(), later = [];
    for (const o of order) { if (seen.has(o.r.name)) later.push(o); else { seen.add(o.r.name); keep.add(o.r); } }
    for (const o of later) keep.add(o.r);
    const kept = [...keep].slice(0, target);
    list = list.filter((r) => r.kind !== "set" || kept.includes(r));
  }
  // 흩뿌림: 장소 소품 줄 수 N → 바닥 장식만 · N × K개까지 (길 비우기는 routes 뒤 finalizeRows)
  const scatterProps = rows.filter((r) => r.kind === "prop" && isScatterRow(r));
  stats.scatterBefore = scatterProps.length + rows.filter((r) => r.kind === "cluster").reduce((a, r) => a + Number(parseArgs(r.args).n || 4), 0);
  stats.scatterTarget = Math.round(scatterProps.length * K);
  const out = [];
  for (const r of list) {
    if (r.kind === "prop" && isScatterRow(r)) { if (floorish(r.name)) out.push(Object.assign({ scatter: true, rank: rank(id, r) }, r)); continue; }
    if (r.kind === "cluster") {
      const a = parseArgs(r.args), names = r.name.split("|").filter((n) => floorish(n) && !(trio && POLICY.UNFIT_SPRITES.includes(n)));
      const n = Math.round(Number(a.n || 4) * K);
      if (!names.length || n <= 0) continue;
      a.n = String(n);
      out.push(Object.assign({}, r, { name: names.join("|"), args: Object.entries(a).map(([k, v]) => `${k}=${v}`).join(";"), scatter: true }));
      continue;
    }
    out.push(r);
  }
  return { rows: out, stats };
}
// 길 비우기 + 흩뿌림 개수 맞추기 (route = routes() 결과). 장소 바닥 무늬도 길 안에서는 뺀다
function finalizeRows(d, planned, route) {
  const near = (x, y) => route && distToCurve(route, x, y) < POLICY.ROUTE_CLEAR;
  let quota = planned.stats.scatterTarget;
  const props = planned.rows.filter((r) => r.kind === "prop" && r.scatter).sort((a, b) => a.rank - b.rank);
  const keepProps = new Set();
  let cleared = 0;
  for (const r of props) {
    if (near(Number(r.x), Number(r.y))) { cleared++; continue; }
    if (keepProps.size < quota) keepProps.add(r);
  }
  const out = [];
  for (const r of planned.rows) {
    if (r.kind === "prop" && r.scatter) { if (keepProps.has(r)) out.push(r); continue; }
    if (isDressDecal(r) && near(Number(r.x), Number(r.y))) { cleared++; continue; }
    out.push(r);
  }
  return { rows: out, cleared };
}

// ───────── C-3·C-6 길 경로 ─────────
function distSqToCell(px, py, cx, cy) {
  const dx = Math.max(cx - px, 0, px - (cx + 1)), dy = Math.max(cy - py, 0, py - (cy + 1));
  return dx * dx + dy * dy;
}
// 점에서 가장 가까운 못 걷는 칸(맵 밖 포함)까지 거리 (최대 R)
function clearanceAt(walk, px, py, R = 3) {
  let best = R * R;
  const x0 = Math.floor(px - R), x1 = Math.floor(px + R), y0 = Math.floor(py - R), y1 = Math.floor(py + R);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (walk(x, y)) continue;
    const dd = distSqToCell(px, py, x, y);
    if (dd < best) best = dd;
  }
  return Math.sqrt(best);
}
function heapPush(h, item) { h.push(item); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function heapPop(h) { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; }
// 걷는 칸 위 최단 경로 (벽에서 1.6칸 안이면 비용을 더해 길 가운데로) — sources: [[x, y]…] 비용 0
function shortest(walk, clr, sources, goal) {
  const dist = new Map(), prev = new Map(), h = [];
  for (const [x, y] of sources) { dist.set(key(x, y), 0); heapPush(h, [0, x, y]); }
  const gk = key(goal[0], goal[1]);
  while (h.length) {
    const [dd, x, y] = heapPop(h);
    const k = key(x, y);
    if (dd > dist.get(k)) continue;
    if (k === gk) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!walk(nx, ny)) continue;
      if (dx && dy && (!walk(x + dx, y) || !walk(x, y + dy))) continue;
      const c = clr(nx, ny);
      const step = (dx && dy ? Math.SQRT2 : 1) * (1 + Math.max(0, 1.6 - c) * 4);
      const nd = dd + step, nk = key(nx, ny);
      if (!dist.has(nk) || nd < dist.get(nk) - 1e-9) { dist.set(nk, nd); prev.set(nk, k); heapPush(h, [nd, nx, ny]); }
    }
  }
  if (!dist.has(gk)) return null;
  const cells = [];
  for (let k = gk; k !== undefined; k = prev.get(k)) cells.push(k.split(",").map(Number));
  return cells.reverse();
}
// 줄 당기기: 칸 가운데 점들 중 직선으로 이어도 벽에서 떨어진 만큼 남는 가장 먼 점으로
function pull(pts, clearAt, half) {
  const segMin = (a, b) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.2));
    let m = Infinity;
    for (let i = 0; i <= n; i++) m = Math.min(m, clearAt(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n));
    return m;
  };
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let best = i + 1;
    let need = Infinity;
    for (let j = i + 1; j < pts.length && j <= i + 60; j++) {
      need = Math.min(need, clearAt(pts[j][0], pts[j][1]));
      const want = Math.min(half, Math.min(need, clearAt(pts[i][0], pts[i][1]))) - 0.05;
      if (segMin(pts[i], pts[j]) >= want) best = j;
    }
    out.push(pts[best]);
    i = best;
  }
  return out;
}
// 모서리 둥글리기 (반경 R, 토막 길이의 절반을 넘지 않게) → 0.25칸 간격 점 [{x, y, r(그 자리 반경 · 직선이면 Infinity)}]
function fillet(V, R) {
  const P = [];
  const push = (x, y, r) => { const l = P[P.length - 1]; if (!l || Math.hypot(l.x - x, l.y - y) > 1e-6) P.push({ x, y, r }); };
  const line = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.25)); for (let i = 0; i <= n; i++) push(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, Infinity); };
  if (V.length < 3) { line(V[0], V[V.length - 1]); return P; }
  let cur = V[0];
  for (let i = 1; i < V.length - 1; i++) {
    const a = [V[i][0] - V[i - 1][0], V[i][1] - V[i - 1][1]], b = [V[i + 1][0] - V[i][0], V[i + 1][1] - V[i][1]];
    const la = Math.hypot(...a), lb = Math.hypot(...b);
    const ua = [a[0] / la, a[1] / la], ub = [b[0] / lb, b[1] / lb];
    const cross = ua[0] * ub[1] - ua[1] * ub[0], dot = ua[0] * ub[0] + ua[1] * ub[1];
    const th = Math.atan2(Math.abs(cross), dot);
    if (th < 1e-3) continue;
    let t = R * Math.tan(th / 2);
    const lim = Math.min(la, lb) * 0.5;
    let r = R;
    if (t > lim) { t = lim; r = t / Math.tan(th / 2); }
    const p1 = [V[i][0] - ua[0] * t, V[i][1] - ua[1] * t], p2 = [V[i][0] + ub[0] * t, V[i][1] + ub[1] * t];
    line(cur, p1);
    const s = cross > 0 ? 1 : -1, nrm = [-ua[1] * s, ua[0] * s];
    const c = [p1[0] + nrm[0] * r, p1[1] + nrm[1] * r];
    const a0 = Math.atan2(p1[1] - c[1], p1[0] - c[0]), n = Math.max(2, Math.ceil((th * r) / 0.25));
    for (let k = 1; k <= n; k++) { const ang = a0 + s * th * (k / n); push(c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r, r); }
    cur = p2;
  }
  line(cur, V[V.length - 1]);
  return P;
}
// 길 경로들: 들어오는 문에서 첫 출구까지, 다음 출구부터는 이미 그린 길에서 갈라진다 (같은 길을 두 번 칠하지 않게)
//   blocked: 막는 장식 발밑 칸 · 결과 { curves: [{target, pts}], cells(원래 칸 경로) }
function routes(d, bp, blocked, func) {
  const walk = (x, y) => bp.isFloor(x, y) && !blocked.has(key(x, y));
  const clrCache = new Map();
  const clr = (x, y) => { const k = key(x, y); if (!clrCache.has(k)) clrCache.set(k, clearanceAt(walk, x + 0.5, y + 0.5)); return clrCache.get(k); };
  const clearAt = (px, py) => clearanceAt(walk, px, py);
  const cellOf = (p) => [Math.floor(p[0]), Math.floor(p[1])];
  const start = func.find((e) => e.name === "GateBack") || func.find((e) => e.name === "GateToField");
  if (!start) return null;
  const targets = [];
  for (const e of func) if (e.name === "GateNext") targets.push({ name: e.name, pos: e.pos });
  for (const e of func) if (e.name === "GateReturn") targets.push({ name: e.name, pos: e.pos });
  for (const e of func) if (/^Gate_/.test(e.name)) targets.push({ name: e.name, pos: e.pos });
  const end = String(d.extra || "").split(";").find((t) => t.startsWith("end@"));
  if (end) targets.push({ name: "end", pos: end.split("@")[1].split("/").map(Number) });
  const curves = [], used = [];
  for (const t of targets) {
    const goal = cellOf(t.pos);
    if (!walk(goal[0], goal[1])) continue;
    const srcCells = used.length ? used : [cellOf(start.pos)];
    const cells = shortest(walk, clr, srcCells, goal);
    if (!cells) continue;
    const first = used.length ? null : [start.pos[0], start.pos[1]];
    const pts = cells.map(([x, y]) => [x + 0.5, y + 0.5]);
    if (first) pts[0] = first;
    pts[pts.length - 1] = [t.pos[0], t.pos[1]];
    const V = pull(pts, clearAt, POLICY.GUIDE_WIDTH / 2);
    curves.push({ target: t.name, pts: fillet(V, POLICY.GUIDE_RADIUS), branch: !!used.length });
    for (const c of cells) used.push(c);
  }
  return { curves, walk, clearAt };
}
function distToCurve(route, x, y) {
  let m = Infinity;
  for (const c of route.curves) for (let i = 0; i + 1 < c.pts.length; i++) {
    const a = c.pts[i], b = c.pts[i + 1];
    const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy;
    const t = L2 ? Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / L2)) : 0;
    m = Math.min(m, Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t)));
  }
  return m;
}
// 칸 사각형에서 곡선까지 거리
function cellDistToCurve(route, cx, cy) {
  let m = Infinity;
  for (const c of route.curves) for (const p of c.pts) m = Math.min(m, Math.sqrt(distSqToCell(p.x, p.y, cx, cy)));
  return m;
}

// ───────── 그림 엔티티 공용 ─────────
const tintArr = (t) => (t || "1/1/1").split("/").map(Number);
function capTint(t) {   // 바닥 색 상한 (길 안내가 밝아질 여유) — 세 채널 같은 비율
  const c = tintArr(t), m = Math.max(...c);
  if (m <= POLICY.FLOOR_TINT_CAP) return c;
  return c.map((v) => r3((v * POLICY.FLOOR_TINT_CAP) / m));
}
const quat = (deg) => { const h = (deg * Math.PI) / 360; return { x: 0, y: 0, z: r3(Math.sin(h) * 1000) / 1000, w: r3(Math.cos(h) * 1000) / 1000 }; };
// 회전한 반복 그림 사각형: 시작점 a에서 방향 deg로 길이 L · 폭 W (가운데 줄이 a를 지난다). 반복 그림은 첫 장(왼쪽 아래 장 가운데)을 축으로 돈다
function rotRect(name, rid, ax, ay, deg, L, W, rgb, alpha, z) {
  const th = (deg * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
  const off = S / 2 - W / 2;
  const px = ax + ux * (S / 2) + nx * off, py = ay + uy * (S / 2) + ny * off;
  return {
    name, pos: [r3(px), r3(py), z],
    overrides: {
      "MOD.Core.SpriteRendererComponent": { SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: 1, DrawMode: 2, TiledSize: { x: r3(L / S), y: r3(W / S) }, Color: { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha } },
      "MOD.Core.TransformComponent": { QuaternionRotation: quat(deg) },
    },
  };
}
// 축에 맞춘 반복 그림 사각형 [x0, x1] × [y0, y1]
function rect(name, rid, x0, y0, x1, y1, rgb, alpha, z) {
  return {
    name, pos: [r3(x0 + S / 2), r3(y0 + S / 2), z],
    overrides: { "MOD.Core.SpriteRendererComponent": { SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: 1, DrawMode: 2, TiledSize: { x: r3((x1 - x0) / S), y: r3((y1 - y0) / S) }, Color: { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha } } },
  };
}

// 칸의 바닥 (그림·색·계층 순위) — 걷는 칸만. noRoad: 길 글자 칸도 그 자리 구역 바닥으로 (길 안내 그림용)
function floorAt(bp, classes, x, y, noRoad) {
  const ch = bp.at(x, y);
  if (ch === null || bp.isWall(x, y)) return null;
  if (ch in bp.roads) {
    // 길 글자 위 길 안내는 그 길 그림 (가까운 구역 그림을 따르면 길 한가운데서 그림이 바뀌었고, 바탕 그림은 흙길 위에 다른 색 띠로 떴다)
    const r = bp.roads[ch]; return { art: r.art, tint: r.tint, rank: 3, ch };
  }
  const zc = bp.zoneOf(x, y), z = bp.zones[zc] || {};
  const art = z.art || bp.base.art, tint = z.art ? z.tint || "1/1/1" : bp.base.tint;
  const cls = (classes && classes[zc]) || (z.art && z.art !== bp.base.art ? "terrain" : "base");
  return { art, tint, rank: cls === "terrain" ? 2 : 1, ch: zc };
}
const fkey = (f) => `${f.art}|${f.tint}`;

// ───────── C-6 길 안내 그림 ─────────
function guideEntities(bp, classes, route, ruidOf) {
  const out = [];
  if (!route) return { entities: out, segments: 0, sharp: 0, minRadius: Infinity, wallHits: 0 };
  let n = 0, sharp = 0, minRadius = Infinity;
  const STEP = POLICY.GUIDE_STEP_DEG;
  for (const c of route.curves) {
    const P = c.pts;
    if (P.length < 2) continue;
    // 끝에서 잰 거리 (출구 EXIT_LEN칸 안은 넓힌다)
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    const total = acc[acc.length - 1];
    const info = P.map((p, i) => {
      const f = floorAt(bp, classes, Math.floor(p.x), Math.floor(p.y), true) || floorAt(bp, classes, Math.floor(P[Math.max(0, i - 1)].x), Math.floor(P[Math.max(0, i - 1)].y), true);
      const exit = total - acc[i] <= POLICY.EXIT_LEN;
      const clear = route.clearAt(p.x, p.y);
      const outer = Math.min(exit ? POLICY.EXIT_WIDTH : POLICY.GUIDE_WIDTH, 2 * (clear - 0.15));
      return { f, exit, outer: Math.max(0.6, outer), clear };
    });
    for (const p of P) if (p.r < minRadius) minRadius = p.r;
    let i = 0;
    let prevDeg = null;
    while (i < P.length - 1) {
      const d0 = (Math.atan2(P[i + 1].y - P[i].y, P[i + 1].x - P[i].x) * 180) / Math.PI;
      let j = i + 1;
      while (j < P.length - 1) {
        const dj = (Math.atan2(P[j + 1].y - P[j].y, P[j + 1].x - P[j].x) * 180) / Math.PI;
        let dd = Math.abs(dj - d0); if (dd > 180) dd = 360 - dd;
        if (dd > STEP / 2 || !info[j + 1].f || !info[i].f || fkey(info[j + 1].f) !== fkey(info[i].f) || info[j + 1].exit !== info[i].exit) break;
        if (Math.abs(info[j + 1].outer - info[i].outer) > 0.25) break;
        j++;
      }
      const a = P[i], b = P[j];
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (prevDeg !== null) { let dd = Math.abs(deg - prevDeg); if (dd > 180) dd = 360 - dd; if (dd > 30) sharp++; }
      prevDeg = deg;
      let outerW = Infinity;
      for (let k = i; k <= j; k++) outerW = Math.min(outerW, info[k].outer);
      const f = info[i].f || info[j].f;
      if (f) {
        const ext = 0.12, ux = Math.cos((deg * Math.PI) / 180), uy = Math.sin((deg * Math.PI) / 180);
        const L = Math.hypot(b.x - a.x, b.y - a.y) + 2 * ext;
        const base = capTint(f.tint).map((v) => r3(Math.min(1, v * POLICY.GUIDE_BRIGHT)));
        const coreW = Math.max(0.4, Math.min(info[i].exit ? POLICY.EXIT_CORE : POLICY.GUIDE_CORE, outerW - 0.6));
        const rid = ruidOf(f.art);
        out.push(rotRect(`ArtGuide${++n}`, rid, a.x - ux * ext, a.y - uy * ext, r3(deg), r3(L), r3(outerW), base, POLICY.GUIDE_EDGE_ALPHA, -0.0115));
        out.push(rotRect(`ArtGuide${++n}`, rid, a.x - ux * ext, a.y - uy * ext, r3(deg), r3(L), r3(coreW), base, 1, -0.0116));
      }
      i = j;
    }
  }
  return { entities: out, segments: n / 2, sharp, minRadius };
}

// ───────── C-5 이음새 ─────────
//   걷는 칸끼리 바닥이 다른 경계: 위 계층(순위가 높은 쪽 · 같으면 글자 순) 그림을 아래 칸으로 BAND 띠만큼 번지게
//   볼록 모서리(한 칸만 위 계층인 2×2 꼭짓점): 45° 반칸 조각 · 막힌 칸(block) 옆: 그늘 띠 + 볼록 벽 모서리 그늘 조각
function seamEntities(bp, classes, ruidOf, opts = {}) {
  const out = [], b = bp.bounds;
  const isBlock = (x, y) => {
    const ch = bp.at(x, y);
    if (ch === null) return true;
    if (classes && ch in classes) return classes[ch] === "block";
    return bp.isWall(x, y);
  };
  const F = new Map();
  for (const [x, y] of bp.cells()) if (!isBlock(x, y)) F.set(key(x, y), floorAt(bp, classes, x, y));
  const fl = (x, y) => F.get(key(x, y)) || null;
  const upper = (p, q) => (p.rank !== q.rank ? p.rank > q.rank : p.ch < q.ch);   // p가 q보다 위인가
  let bandN = 0, cornerN = 0, shadeN = 0;
  const edges = { total: 0, covered: 0 }, corners = { total: 0, treated: 0 };
  // 띠 하나 (가로 경계 선 y=Y · 칸 xa..xb · 아래 칸 쪽 dir=-1(아래로)/+1(위로)) — 세로는 swap
  const bands = (spec, hor, line, a0, a1, dir, rid, rgb, alphaMul, z, prefix) => {
    let d0 = 0;
    for (const [w, al] of spec) {
      const lo = dir < 0 ? line - d0 - w : line + d0, hi = lo + w;
      out.push(hor ? rect(`${prefix}${prefix === "ArtShade" ? ++shadeN : ++bandN}`, rid, a0, lo, a1, hi, rgb, r3(al * alphaMul), z)
        : rect(`${prefix}${prefix === "ArtShade" ? ++shadeN : ++bandN}`, rid, lo, a0, hi, a1, rgb, r3(al * alphaMul), z));
      d0 += w;
    }
  };
  const runs = new Map();   // 열쇠 → [[시작, 끝]]
  const addRun = (k, t) => { const l = runs.get(k) || []; const last = l[l.length - 1]; if (last && last[1] === t - 1) last[1] = t; else l.push([t, t]); runs.set(k, l); };
  // 가로 경계 (x, y) | (x, y+1): 선 y+1
  for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    const p = fl(x, y), q = fl(x, y + 1);
    if (p && q && fkey(p) !== fkey(q)) { edges.total++; const up = upper(p, q) ? p : q, dir = up === p ? 1 : -1; addRun(`H|${y + 1}|${dir}|${fkey(up)}`, x); }
    else if ((p && !q && isBlock(x, y + 1)) || (!p && q && isBlock(x, y))) { edges.total++; addRun(`SH|${y + 1}|${p ? -1 : 1}`, x); }
  }
  for (let x = b.x0; x < b.x1; x++) for (let y = b.y0; y <= b.y1; y++) {
    const p = fl(x, y), q = fl(x + 1, y);
    if (p && q && fkey(p) !== fkey(q)) { edges.total++; const up = upper(p, q) ? p : q, dir = up === p ? 1 : -1; addRun(`V|${x + 1}|${dir}|${fkey(up)}`, y); }
    else if ((p && !q && isBlock(x + 1, y)) || (!p && q && isBlock(x, y))) { edges.total++; addRun(`SV|${x + 1}|${p ? -1 : 1}`, y); }
  }
  const shadeRid = ruidOf(POLICY.SHADE_ART);
  for (const [k, list] of runs) {
    const [kind, lineS, dirS, art, tint] = k.split("|");
    const line = Number(lineS), dir = Number(dirS);
    for (const [s, e] of list) {
      edges.covered += e - s + 1;
      if (kind === "H" || kind === "V") bands(POLICY.BAND, kind === "H", line, s, e + 1, dir, ruidOf(art), capTint(tint), 1, -0.007, "ArtBand");
      else if (!opts.noShade) bands(POLICY.SHADE, kind === "SH", line, s, e + 1, dir, shadeRid, [0, 0, 0], 1, -0.0118, "ArtShade");
    }
  }
  if (opts.noShade) edges.covered = edges.total;   // 담 윗면 맵: 막힌 칸 경계는 앞면·가장자리 띠가 이음새
  // 볼록 모서리: 꼭짓점 (X, Y) 둘레 2×2
  const diamond = (name, rid, cx, cy, size, rgb, alpha, z) => {
    const deg = 45, th = Math.PI / 4, ux = Math.cos(th), uy = Math.sin(th);
    // rotRect는 가운데 줄 시작점 기준 — 사각형 가운데가 (cx, cy)가 되게 시작점을 뒤로 size/2
    return rotRect(name, rid, cx - ux * (size / 2), cy - uy * (size / 2), deg, size, size, rgb, alpha, z);
  };
  for (let Y = b.y0 + 1; Y <= b.y1; Y++) for (let X = b.x0 + 1; X <= b.x1; X++) {
    const quad = [[X - 1, Y - 1, X, Y - 1, X - 1, Y, X, Y], [X, Y - 1, X - 1, Y - 1, X, Y, X - 1, Y], [X - 1, Y, X, Y, X - 1, Y - 1, X, Y - 1], [X, Y, X - 1, Y, X, Y - 1, X - 1, Y - 1]];
    for (const [cx, cy, hx, hy, vx, vy, gx, gy] of quad) {   // 이 칸 · 가로 이웃 · 세로 이웃 · 대각
      const c = fl(cx, cy);
      if (c) {
        const h = fl(hx, hy), v = fl(vx, vy), g = fl(gx, gy);
        if (h && v && g && fkey(h) !== fkey(c) && fkey(v) !== fkey(c) && fkey(g) !== fkey(c) && upper(c, h) && upper(c, v)) {
          corners.total++; corners.treated++;
          out.push(diamond(`ArtCorner${++cornerN}`, ruidOf(c.art), X, Y, POLICY.CORNER.size, capTint(c.tint), POLICY.CORNER.alpha, -0.0072));
        }
      }
    }
  }
  return { entities: out, bands: bandN, shades: shadeN, corners: cornerN, edges, cornerStats: corners };
}
// 고치기 전 기준: 볼록 직각 모서리 수 (같은 판정 · 조각 없음) — 전후 표용
function countCorners(bp, classes) { return seamEntities(bp, classes, () => "", {}).cornerStats.total; }

module.exports = { POLICY, classOf, classTable, modeOf, isScatterRow, planRows, finalizeRows, routes, distToCurve, cellDistToCurve, guideEntities, seamEntities, countCorners, floorAt, capTint, rotRect, parseArgs };
