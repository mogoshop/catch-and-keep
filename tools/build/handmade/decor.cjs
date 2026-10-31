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
const isV4 = (id) => (POLICY.GUIDE_V4 ? POLICY.GUIDE_V4.includes(id) : POLICY.FULL.includes(id));   // 길 안내 v4 (갈래·고리·폭 1·끊긴 발길·액트 타일)

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
  const near = (x, y) => tooClose(route, x, y);
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
function pull(pts, clearAt, half, decorAt, clear = POLICY.ROUTE_CLEAR) {
  const segMin = (f, a, b) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.2));
    let m = Infinity;
    for (let i = 0; i <= n; i++) m = Math.min(m, f(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n));
    return m;
  };
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let best = i + 1;
    let need = Infinity, needD = Infinity;
    for (let j = i + 1; j < pts.length && j <= i + 60; j++) {
      need = Math.min(need, clearAt(pts[j][0], pts[j][1]));
      needD = Math.min(needD, decorAt(pts[j][0], pts[j][1]));
      const want = Math.min(half, Math.min(need, clearAt(pts[i][0], pts[i][1]))) - 0.05;
      const wantD = Math.min(clear + 0.3, Math.min(needD, decorAt(pts[i][0], pts[i][1]))) - 0.05;
      if (segMin(clearAt, pts[i], pts[j]) >= want && segMin(decorAt, pts[i], pts[j]) >= wantD) best = j;
    }
    out.push(pts[best]);
    i = best;
  }
  return out;
}
// 꺾인 점 둘이 너무 가까워 반경 1칸 둥글리기가 안 되면(짧은 토막 양끝이 다 꺾임) 두 점을 앞뒤 토막 연장선이 만나는 한 점으로 합친다
//   (합친 점이 벽에 붙으면 그대로 둔다)
function widen(V, clearAt) {
  const turn = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]];
    return Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), u[0] * v[0] + u[1] * v[1]);
  };
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  let pts = V.slice();
  for (let pass = 0; pass < 40; pass++) {
    let changed = false;
    for (let i = 1; i + 2 < pts.length; i++) {
      const t1 = Math.tan(turn(pts[i - 1], pts[i], pts[i + 1]) / 2), t2 = Math.tan(turn(pts[i], pts[i + 1], pts[i + 2]) / 2);
      if (t1 + t2 <= len(pts[i], pts[i + 1]) + 1e-9) continue;   // 반경 1칸 둥글리기 두 개가 들어간다
      const a = pts[i - 1], b = pts[i], c = pts[i + 2], d = pts[i + 1];
      const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
      let m = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2];
      if (Math.abs(den) > 1e-6) {
        const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, p = [a[0] + r[0] * t, a[1] + r[1] * t];
        if (len(p, m) < 3) m = p;
      }
      if (clearAt(m[0], m[1]) < 0.45) continue;
      pts.splice(i, 2, m);
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return pts;
}
// 모서리 둥글리기 (반경 R, 토막 길이의 절반을 넘지 않게) → 0.25칸 간격 점 [{x, y, r(그 자리 반경 · 직선이면 Infinity)}]
function fillet(V, R, clearAt) {
  const P = [];
  const push = (x, y, r, turn) => { const l = P[P.length - 1]; if (!l || Math.hypot(l.x - x, l.y - y) > 1e-6) P.push({ x, y, r, turn: turn || 0 }); };   // turn = 그 원호가 꺾는 각도(°)
  const line = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.25)); for (let i = 0; i <= n; i++) push(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, Infinity); };
  if (V.length < 3) { line(V[0], V[V.length - 1]); return P; }
  let cur = V[0];
  // 꺾인 점마다 tan(꺾임/2) — 한 토막을 양끝 둥글리기가 이 비율로 나눠 쓴다 (끝 토막은 혼자 다 쓴다)
  const tanAt = V.map((p, i) => {
    if (i === 0 || i === V.length - 1) return 0;
    const u = [V[i][0] - V[i - 1][0], V[i][1] - V[i - 1][1]], v = [V[i + 1][0] - V[i][0], V[i + 1][1] - V[i][1]];
    return Math.tan(Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), u[0] * v[0] + u[1] * v[1]) / 2);
  });
  for (let i = 1; i < V.length - 1; i++) {
    const a = [V[i][0] - V[i - 1][0], V[i][1] - V[i - 1][1]], b = [V[i + 1][0] - V[i][0], V[i + 1][1] - V[i][1]];
    const la = Math.hypot(...a), lb = Math.hypot(...b);
    const ua = [a[0] / la, a[1] / la], ub = [b[0] / lb, b[1] / lb];
    const cross = ua[0] * ub[1] - ua[1] * ub[0], dot = ua[0] * ub[0] + ua[1] * ub[1];
    const th = Math.atan2(Math.abs(cross), dot);
    if (th < 1e-3) continue;
    const ti = tanAt[i] || 1e-9;
    const lim = Math.min(la * (ti / (ti + tanAt[i - 1])), lb * (ti / (ti + tanAt[i + 1])));
    const rmax = Math.min(R, lim / Math.tan(th / 2));
    if (!(rmax > 1e-6)) { line(cur, V[i]); cur = V[i]; continue; }   // 길이 0 토막 등 — 둥글리지 않고 꺾인 점 그대로
    const s = cross > 0 ? 1 : -1, nrm = [-ua[1] * s, ua[0] * s];
    // 원호: 반경 rr이면 접점 p1·p2와 원호 점들 — 원호가 벽 모서리를 스치면(여유 0.45칸 미만) 반경을 1.25 → 1칸까지 줄여 꺾인 점 쪽으로 붙인다
    const arc = (rr) => {
      const t = rr * Math.tan(th / 2);
      const p1 = [V[i][0] - ua[0] * t, V[i][1] - ua[1] * t], p2 = [V[i][0] + ub[0] * t, V[i][1] + ub[1] * t];
      const c = [p1[0] + nrm[0] * rr, p1[1] + nrm[1] * rr];
      const a0 = Math.atan2(p1[1] - c[1], p1[0] - c[0]), n = Math.max(2, Math.ceil((th * rr) / 0.25));
      const pts = [];
      for (let k = 1; k <= n; k++) { const ang = a0 + s * th * (k / n); pts.push([c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr]); }
      return { p1, p2, pts, rr };
    };
    const cands = [rmax, 1.25, 1.0].filter((v, k, all) => v <= rmax + 1e-9 && all.indexOf(v) === k);
    let pick = null;
    for (const rr of cands) {
      const A = arc(rr);
      pick = A;
      if (!clearAt || A.pts.every(([x, y]) => clearAt(x, y) >= 0.45)) break;
    }
    line(cur, pick.p1);
    for (const [x, y] of pick.pts) push(x, y, pick.rr, (th * 180) / Math.PI);
    cur = pick.p2;
  }
  line(cur, V[V.length - 1]);
  return P;
}
// 길 경로들: 들어오는 문에서 첫 출구까지, 다음 출구부터는 이미 그린 길에서 갈라진다 (같은 길을 두 번 칠하지 않게)
//   blocked: 막는 장식 발밑 칸 · 결과 { curves: [{target, pts}], cells(원래 칸 경로) }
function routes(d, bp, blocked, func) {
  if (isV4(d.id)) return routesV4(d, bp, blocked, func);
  const walk = (x, y) => bp.isFloor(x, y) && !blocked.has(key(x, y));
  // 막는 장식(세트·랜드마크)에서는 ROUTE_CLEAR만큼 더 떨어지게 — 길이 붙어 지나가면 그 조각을 빼야 한다
  const notDecor = (x, y) => !blocked.has(key(x, y));
  const clrCache = new Map();
  const clr = (x, y) => {
    const k = key(x, y);
    if (!clrCache.has(k)) {
      const w = clearanceAt(walk, x + 0.5, y + 0.5), dc = clearanceAt(notDecor, x + 0.5, y + 0.5);
      clrCache.set(k, Math.min(w, dc < POLICY.ROUTE_CLEAR + 0.6 ? dc - 2.5 * (POLICY.ROUTE_CLEAR + 0.6 - dc) : 9));
    }
    return clrCache.get(k);
  };
  const clearAt = (px, py) => clearanceAt(walk, px, py);
  const decorAt = (px, py) => clearanceAt(notDecor, px, py);
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
    const V = widen(pull(pts, clearAt, POLICY.GUIDE_WIDTH / 2, decorAt), clearAt);
    curves.push({ target: t.name, pts: fillet(V, POLICY.GUIDE_RADIUS, clearAt), branch: !!used.length });
    for (const c of cells) used.push(c);
  }
  return { curves, walk, clearAt };
}
// ───────── C-7 길 안내 v4 경로: 출구마다 갈래 · 구역마다 고리 ─────────
//   큰길(BIG_ROAD_GLYPHS)은 그 자체가 길 — 경로는 큰길을 싸게(ROAD_COST) 따라가다 갈라지고, 그림은 큰길 밖에만 (guideV4)
//   ① 들어오는 문 → (큰길이 있고 문이 큰길 밖이면) 큰길까지 ② 출구(다음 맵 문·되돌아가는 문·굴 입구·끝방)마다 「큰길 + 이미 그린 갈래」에서 갈라지는 갈래
//   ③ 설계도 구역(LOOP_MIN_CELLS칸 이상)마다 큰길·갈래에서 들어가 구역 뒤편 경유점(LOOP_ANGLES)을 돌아 다시 큰길·갈래로 나오는 고리
// 여러 출발점·여러 도착점 최단 경로 (cost(x, y) = 칸 비용 배율) — 도착 칸에서 출발 칸까지
function search(walk, clr, sources, isGoal, cost) {
  const dist = new Map(), prev = new Map(), h = [];
  for (const [x, y] of sources) { const k = key(x, y); if (!dist.has(k)) { dist.set(k, 0); heapPush(h, [0, x, y]); } }
  let found = null;
  while (h.length) {
    const [dd, x, y] = heapPop(h);
    const k = key(x, y);
    if (dd > dist.get(k)) continue;
    if (isGoal(x, y)) { found = k; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!walk(nx, ny)) continue;
      if (dx && dy && (!walk(x + dx, y) || !walk(x, y + dy))) continue;
      const c = clr(nx, ny);
      // v4: 벽 1.8칸 안을 v3(1.6칸·×4)보다 비싸게(×10) — 폭 1칸 안내선이 벽 칸에 닿지 않게 길 가운데로 (10-31 63장 시험 빌드 벽 접촉)
      const step = (dx && dy ? Math.SQRT2 : 1) * (1 + Math.max(0, 1.8 - c) * 10) * cost(nx, ny);
      const nd = dd + step, nk = key(nx, ny);
      if (!dist.has(nk) || nd < dist.get(nk) - 1e-9) { dist.set(nk, nd); prev.set(nk, k); heapPush(h, [nd, nx, ny]); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = found; k !== undefined; k = prev.get(k)) cells.push(k.split(",").map(Number));
  return cells.reverse();
}
// 두 곡선(0.25칸 점)이 엇갈리는가 — 각 곡선 양끝 1칸(큰길·갈래에 붙는 자리)은 빼고 본다
function curvesCross(A, B) {
  const trim = (P) => {
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    const T = acc[acc.length - 1];
    return P.filter((p, i) => acc[i] >= 1 && acc[i] <= T - 1);
  };
  const a = trim(A), b = trim(B);
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  for (let i = 0; i + 1 < a.length; i++) {
    const p1 = a[i], p2 = a[i + 1];
    for (let j = 0; j + 1 < b.length; j++) {
      const q1 = b[j], q2 = b[j + 1];
      if (Math.max(p1.x, p2.x) < Math.min(q1.x, q2.x) || Math.max(q1.x, q2.x) < Math.min(p1.x, p2.x) || Math.max(p1.y, p2.y) < Math.min(q1.y, q2.y) || Math.max(q1.y, q2.y) < Math.min(p1.y, p2.y)) continue;
      const d1 = cross(q1, q2, p1), d2 = cross(q1, q2, p2), d3 = cross(p1, p2, q1), d4 = cross(p1, p2, q2);
      if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return true;
    }
  }
  return false;
}
function routesV4(d, bp, blocked, func) {
  const V = POLICY.V4;
  const walk = (x, y) => bp.isFloor(x, y) && !blocked.has(key(x, y));
  const notDecor = (x, y) => !blocked.has(key(x, y));
  const big = new Set(POLICY.BIG_ROAD_GLYPHS);
  const isBig = (x, y) => { const ch = bp.at(x, y); return ch !== null && big.has(ch) && ch in bp.roads; };
  const clrCache = new Map();
  const clr = (x, y) => {
    const k = key(x, y);
    if (!clrCache.has(k)) {
      const w = clearanceAt(walk, x + 0.5, y + 0.5), dc = clearanceAt(notDecor, x + 0.5, y + 0.5);
      clrCache.set(k, Math.min(w, dc < POLICY.ROUTE_CLEAR + 0.6 ? dc - 2.5 * (POLICY.ROUTE_CLEAR + 0.6 - dc) : 9));
    }
    return clrCache.get(k);
  };
  const clearAt = (px, py) => clearanceAt(walk, px, py);
  const decorAt = (px, py) => clearanceAt(notDecor, px, py);
  const cellOf = (p) => [Math.floor(p[0]), Math.floor(p[1])];
  const roadCost = (x, y) => (isBig(x, y) ? V.ROAD_COST : 1);
  const start = func.find((e) => e.name === "GateBack") || func.find((e) => e.name === "GateToField");
  if (!start) return null;
  const bigCells = [];
  for (const [x, y] of bp.cells()) if (isBig(x, y) && walk(x, y)) bigCells.push([x, y]);
  const net = new Set(bigCells.map(([x, y]) => key(x, y)));
  const netList = () => [...net].map((k) => k.split(",").map(Number));
  const curves = [], exits = [], loops = [];
  // breaks: 경유점 자리(칸 목록 번호) — 줄 당기기는 경유점 사이 구간마다 따로 (고리를 통째로 당기면 나가는 길과 돌아오는 길이 이어져 고리가 사라졌다)
  const toCurve = (cells, first, last, kind, target, clear, breaks) => {
    const pts = cells.map(([x, y]) => [x + 0.5, y + 0.5]);
    if (first) pts[0] = first;
    if (last) pts[pts.length - 1] = last;
    if (pts.length < 2) return null;
    const cuts = [0, ...(breaks || []).filter((b) => b > 0 && b < pts.length - 1), pts.length - 1];
    let Vall = [];
    for (let k = 0; k + 1 < cuts.length; k++) {
      const leg = pull(pts.slice(cuts[k], cuts[k + 1] + 1), clearAt, V.WIDTH / 2, decorAt, clear);
      Vall = Vall.length ? Vall.concat(leg.slice(1)) : leg;
    }
    const Vd = Vall.filter((p, k) => k === 0 || Math.hypot(p[0] - Vall[k - 1][0], p[1] - Vall[k - 1][1]) > 1e-6);   // 구간 이음매 겹친 점
    // 되돌아 나오는 뾰족한 끝(150° 넘게 꺾임 — 막다른 경유점에 갔다가 같은 길로 나옴)은 그 점을 빼 앞뒤를 바로 잇는다 (나란한 두 줄이 한 줄로)
    const dropSpurs = (W0) => {
      let Vs = W0.filter((p, k) => k === 0 || Math.hypot(p[0] - W0[k - 1][0], p[1] - W0[k - 1][1]) > 1e-3);
      for (let pass = 0; pass < 20; pass++) {
        let cut = -1;
        for (let i = 1; i + 1 < Vs.length && cut < 0; i++) {
          const u = [Vs[i][0] - Vs[i - 1][0], Vs[i][1] - Vs[i - 1][1]], v = [Vs[i + 1][0] - Vs[i][0], Vs[i + 1][1] - Vs[i][1]];
          if (Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), u[0] * v[0] + u[1] * v[1]) > (150 * Math.PI) / 180) cut = i;
        }
        if (cut < 0) break;
        Vs = Vs.slice(0, cut).concat(Vs.slice(cut + 1)).filter((p, k, all) => k === 0 || Math.hypot(p[0] - all[k - 1][0], p[1] - all[k - 1][1]) > 1e-3);
      }
      return Vs;
    };
    let Vt = widen(dropSpurs(Vd), clearAt);
    // 반경 1칸 둥글리기가 안 되는 꺾인 점은, 앞뒤 점을 바로 이어도 벽에서 0.45칸 떨어지면 뺀다 (고리 경유점 사이가 짧을 때)
    //   그 점을 못 빼면(벽에 막힘) 바로 앞·뒤 꺾인 점을 빼 본다 — 그래도 안 되면 그 점은 두고 다음 점으로
    const tanH = (i) => { const u = [Vt[i][0] - Vt[i - 1][0], Vt[i][1] - Vt[i - 1][1]], v = [Vt[i + 1][0] - Vt[i][0], Vt[i + 1][1] - Vt[i][1]]; return Math.tan(Math.atan2(Math.abs(u[0] * v[1] - u[1] * v[0]), u[0] * v[0] + u[1] * v[1]) / 2); };
    const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    const clearSeg = (a, b) => { const n = Math.max(1, Math.ceil(len(a, b) / 0.2)); for (let k = 0; k <= n; k++) if (clearAt(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n) < 0.45) return false; return true; };
    const stuck = new Set();
    for (let pass = 0; pass < 40; pass++) {
      let bad = -1;
      for (let i = 1; i + 1 < Vt.length && bad < 0; i++) {
        if (stuck.has(`${Vt[i][0]},${Vt[i][1]}`)) continue;
        const ti = tanH(i), tp = i > 1 ? tanH(i - 1) : 0, tn = i + 2 < Vt.length ? tanH(i + 1) : 0;
        if (ti < 1e-6) continue;
        const lim = Math.min(len(Vt[i - 1], Vt[i]) * (ti / (ti + tp)), len(Vt[i], Vt[i + 1]) * (ti / (ti + tn)));
        if (lim / ti < 1 - 1e-6) bad = i;
      }
      if (bad < 0) break;
      const cand = [bad, bad + 1, bad - 1].filter((k) => k >= 1 && k + 1 < Vt.length);
      const k = cand.find((q) => clearSeg(Vt[q - 1], Vt[q + 1]));
      if (k === undefined) { stuck.add(`${Vt[bad][0]},${Vt[bad][1]}`); continue; }
      Vt = Vt.slice(0, k).concat(Vt.slice(k + 1));
    }
    Vt = dropSpurs(Vt);   // 합치기·빼기 뒤 새로 생긴 되돌아 나오는 끝
    return { target, kind, pts: fillet(Vt, POLICY.GUIDE_RADIUS, clearAt), branch: true };
  };
  // ① 들어오는 문 → 큰길 (문이 큰길 밖일 때) — 큰길이 없는 맵(굴)은 문 자체가 출발점
  const sc = cellOf(start.pos);
  if (!net.size) net.add(key(sc[0], sc[1]));
  else if (!net.has(key(sc[0], sc[1]))) {
    const cells = search(walk, clr, [sc], (x, y) => net.has(key(x, y)), roadCost);
    if (cells) { const c = toCurve(cells, [start.pos[0], start.pos[1]], null, "exit", "entry", POLICY.ROUTE_CLEAR); if (c) curves.push(c); for (const q of cells) net.add(key(q[0], q[1])); }
  }
  // ② 출구마다 갈래
  const targets = [];
  for (const e of func) if (e.name === "GateNext") targets.push({ name: e.name, pos: e.pos });
  for (const e of func) if (e.name === "GateReturn") targets.push({ name: e.name, pos: e.pos });
  for (const e of func) if (/^Gate_/.test(e.name)) targets.push({ name: e.name, pos: e.pos });
  const end = String(d.extra || "").split(";").find((t) => t.startsWith("end@"));
  if (end) targets.push({ name: "end", pos: end.split("@")[1].split("/").map(Number) });
  for (const t of targets) {
    const goal = cellOf(t.pos);
    if (!walk(goal[0], goal[1])) { exits.push({ target: t.name, ok: false, reason: "출구 칸이 막힘" }); continue; }
    // 도착점에서 거꾸로 그물(큰길·갈래)까지 — 그물에 닿는 첫 칸에서 갈라진다
    const back = search(walk, clr, [goal], (x, y) => net.has(key(x, y)), roadCost);
    if (!back) { exits.push({ target: t.name, ok: false, reason: "길 없음" }); continue; }
    const cells = back.reverse();
    const offRoad = cells.filter(([x, y]) => !isBig(x, y)).length;
    exits.push({ target: t.name, ok: true, cells: cells.length, offRoad });
    const c = toCurve(cells, null, [t.pos[0], t.pos[1]], "exit", t.name, POLICY.ROUTE_CLEAR);
    if (c) curves.push(c);
    for (const q of cells) net.add(key(q[0], q[1]));
  }
  // ③ 구역마다 고리
  const zoneChars = Object.keys(bp.zones).filter((ch) => ch !== ".");
  const netFixed = new Set(net);   // 고리는 큰길·출구 갈래에만 붙는다 (고리끼리 잇지 않음)
  const loopCells = new Set();     // 앞서 만든 고리가 지나는 칸 (뒤 고리가 비켜 간다)
  for (const ch of zoneChars) {
    // 그 구역 글자의 가장 큰 덩어리
    const seen = new Set(); let bestComp = [];
    for (const [x, y] of bp.cells()) {
      if (bp.at(x, y) !== ch || seen.has(key(x, y))) continue;
      const comp = [[x, y]]; seen.add(key(x, y));
      for (let i = 0; i < comp.length; i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = comp[i][0] + dx, ny = comp[i][1] + dy;
        if (bp.at(nx, ny) === ch && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); comp.push([nx, ny]); }
      }
      if (comp.length > bestComp.length) bestComp = comp;
    }
    if (bestComp.length < V.LOOP_MIN_CELLS) continue;
    const zname = `loop:${ch}`;
    const cx = bestComp.reduce((a, c) => a + c[0] + 0.5, 0) / bestComp.length, cy = bestComp.reduce((a, c) => a + c[1] + 0.5, 0) / bestComp.length;
    const Rz = Math.sqrt(bestComp.length / Math.PI), ring = Math.max(V.LOOP_RING[1], Math.min(V.LOOP_RING[2], Rz * V.LOOP_RING[0]));
    const inZone = new Set(bestComp.map(([x, y]) => key(x, y)));
    // 경유점 자리: 벽 1.2칸 · 장식 1.5칸 (좁은 구역이면 벽 1칸 · 장식 LOOP_CLEAR까지 낮춘다)
    let wallMin = 1.2, decorMin = 1.5;
    const goodCell = (x, y) => inZone.has(key(x, y)) && walk(x, y) && clearAt(x + 0.5, y + 0.5) >= wallMin && decorAt(x + 0.5, y + 0.5) >= decorMin;
    if (!bestComp.some(([x, y]) => goodCell(x, y))) { wallMin = 1.0; decorMin = V.LOOP_CLEAR; }
    // 들어오는 쪽: 구역 가운데(막혔으면 가운데에서 가장 가까운 경유점 자리)에서 그물까지 가장 가까운 칸
    let cc = [Math.floor(cx), Math.floor(cy)];
    if (!walk(cc[0], cc[1])) {
      let best = null;
      for (const [x, y] of bestComp) if (goodCell(x, y)) { const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (!best || dd < best.dd) best = { x, y, dd }; }
      if (best) cc = [best.x, best.y];
    }
    const inCells = walk(cc[0], cc[1]) ? search(walk, clr, [cc], (x, y) => netFixed.has(key(x, y)), roadCost) : null;
    if (!inCells) { loops.push({ zone: ch, ok: false, reason: "구역 가운데에서 큰길·갈래까지 길 없음", cells: bestComp.length }); continue; }
    const A = inCells[inCells.length - 1];
    const thA = Math.atan2(A[1] + 0.5 - cy, A[0] + 0.5 - cx);
    // 앞서 만든 고리와 엇갈리지 않게(10-31 rotmarsh b·c X자): 앞 고리 칸 둘레는 비싸게(×8) 돌고, 그래도 엇갈리면
    //   경유점 각도를 거울로 · 고리 반경 0.7배 · 1.3배로 다시 — 끝까지 엇갈리면 그 구역 고리는 생략(목록으로 보고)
    const nearLoop = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (loopCells.has(key(x + dx, y + dy))) return true; return false; };
    const avoid = (x, y) => (nearLoop(x, y) && !netFixed.has(key(x, y)) ? 8 : 1);
    let made = null, why = "";
    for (const [rk, sign] of [[1, 1], [1, -1], [0.7, 1], [0.7, -1], [1.3, 1], [1.3, -1]]) {
      const wps = [];
      for (const deg of V.LOOP_ANGLES) {
        const th = thA + (sign * deg * Math.PI) / 180, ix = cx + Math.cos(th) * ring * rk, iy = cy + Math.sin(th) * ring * rk;
        let best = null;
        for (const [x, y] of bestComp) { if (!goodCell(x, y) || nearLoop(x, y)) continue; const dd = Math.hypot(x + 0.5 - ix, y + 0.5 - iy); if (dd < 2.5 && (!best || dd < best.dd)) best = { x, y, dd }; }
        if (best && !wps.some(([wx, wy]) => Math.hypot(wx - best.x, wy - best.y) < 2)) wps.push([best.x, best.y]);
      }
      if (wps.length < 2) { why = why || "구역 안 경유점 자리 부족(벽·장식에서 1.2칸)"; continue; }
      // 그물 → 첫 경유점 → … → 끝 경유점 → 그물 (나오는 길은 들어간 길 1.5칸 안을 비싸게 해 다른 쪽으로)
      let cells = search(walk, clr, netList().filter(([x, y]) => netFixed.has(key(x, y))), (x, y) => x === wps[0][0] && y === wps[0][1], (x, y) => roadCost(x, y) * avoid(x, y));
      if (!cells) { why = "첫 경유점까지 길 없음"; continue; }
      let okAll = true;
      const breaks = [cells.length - 1];
      for (let k = 1; k < wps.length && okAll; k++) {
        const seg = search(walk, clr, [wps[k - 1]], (x, y) => x === wps[k][0] && y === wps[k][1], avoid);
        if (!seg) okAll = false; else { cells = cells.concat(seg.slice(1)); breaks.push(cells.length - 1); }
      }
      if (!okAll) { why = "경유점 사이 길 없음"; continue; }
      const outSet = new Set(cells.map(([x, y]) => key(x, y)));
      const nearOut = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (outSet.has(key(x + dx, y + dy))) return true; return false; };
      const startK = key(cells[0][0], cells[0][1]);
      const ret = search(walk, clr, [wps[wps.length - 1]], (x, y) => netFixed.has(key(x, y)) && key(x, y) !== startK, (x, y) => (nearOut(x, y) && !netFixed.has(key(x, y)) ? 6 : 1) * roadCost(x, y) * avoid(x, y));
      if (ret) cells = cells.concat(ret.slice(1));
      const c = toCurve(cells, null, null, "loop", zname, V.LOOP_CLEAR, breaks);
      if (!c) { why = "곡선이 짧음"; continue; }
      if (curves.some((o) => o.kind === "loop" && curvesCross(c.pts, o.pts))) { why = "다른 고리와 엇갈림(회피 실패)"; continue; }
      if (c.pts.some((p) => p.turn > 45 && p.r < 1 - 1e-6 && !isBig(Math.floor(p.x), Math.floor(p.y)))) { why = "반경 1칸 둥글리기 불가(짧은 갈래에 급히 꺾임)"; continue; }
      made = { c, cells, wps, back: !!ret, variant: `${rk}/${sign}` };
      break;
    }
    if (!made) { loops.push({ zone: ch, ok: false, skipped: true, reason: why, cells: bestComp.length }); continue; }
    curves.push(made.c);
    for (const [x, y] of made.cells) if (!netFixed.has(key(x, y))) loopCells.add(key(x, y));
    loops.push({ zone: ch, ok: true, cells: bestComp.length, waypoints: made.wps.length, back: made.back, variant: made.variant });
  }
  return { curves, walk, clearAt, v4: true, isBig, exits, loops };
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
// 비워야 하는 거리: 출구 갈래(v3 포함) ROUTE_CLEAR · v4 고리 LOOP_CLEAR — 점·칸이 어느 곡선의 그 거리 안인가
const clearOf = (c) => (c.kind === "loop" ? POLICY.V4.LOOP_CLEAR : POLICY.ROUTE_CLEAR);
function tooClose(route, x, y) {
  if (!route) return false;
  for (const c of route.curves) if (distToCurve({ curves: [c] }, x, y) < clearOf(c)) return true;
  return false;
}
function cellTooClose(route, cx, cy) {
  if (!route) return false;
  for (const c of route.curves) { const lim = clearOf(c) ** 2; for (const p of c.pts) if (distSqToCell(p.x, p.y, cx, cy) < lim) return true; }
  return false;
}

// ───────── 그림 엔티티 공용 ─────────
const tintArr = (t) => (t || "1/1/1").split("/").map(Number);
// 바닥 색 상한: v3 맵은 길 안내가 그 자리 바닥 × 1.25라 FLOOR_TINT_CAP까지 낮춘다. v4 맵은 길 안내가 액트 타일(GUIDE_TILE)이라 바닥을 낮추지 않는다
let curCap = POLICY.FLOOR_TINT_CAP;
function setMap(id) { curCap = isV4(id) ? 1 : POLICY.FLOOR_TINT_CAP; }
function capTint(t) {   // 세 채널 같은 비율 (채도 그대로)
  const c = tintArr(t), m = Math.max(...c);
  if (m <= curCap) return c;
  return c.map((v) => r3((v * curCap) / m));
}
// ───────── 회전한 반복 그림 — 회전 생성은 이 한 곳 (길 안내 토막 · 45° 모서리 조각 · 검사기·미리보기 역산) ─────────
//   메이커 실화면 확인 전 가정 (10-31): 반복 그리기(DrawMode 2)는 회전이 없을 때처럼 「첫 장(왼쪽 아래 장) 가운데 = 엔티티 자리」에서 깔리고,
//   TransformComponent.QuaternionRotation(z축)이 그 자리를 축으로 반시계(+)로 돌린다. 실화면이 다르면 decor_policy.cjs 두 값만 바꾸고 다시 짓는다:
//     ROT_ANCHOR "first-tile"(가정) | "center"(사각형 가운데가 엔티티 자리) · ROT_SIGN 1(반시계 +) | -1
const quat = (deg) => { const h = ((POLICY.ROT_SIGN || 1) * deg * Math.PI) / 360; return { x: 0, y: 0, z: Math.round(Math.sin(h) * 1e6) / 1e6, w: Math.round(Math.cos(h) * 1e6) / 1e6 }; };
// 사각형 안 점 (사각형 왼쪽 아래 모서리에서 길이 방향 a · 폭 방향 b)의 월드 좌표 — 엔티티 자리·회전·크기로 (검사기·미리보기가 같은 식을 쓴다)
function rectPoint(pos, deg, L, W, a, b) {
  const th = (deg * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
  const lx = POLICY.ROT_ANCHOR === "center" ? a - L / 2 : a - S / 2, ly = POLICY.ROT_ANCHOR === "center" ? b - W / 2 : b - S / 2;
  return [pos[0] + ux * lx + nx * ly, pos[1] + uy * lx + ny * ly];
}
// 회전한 반복 그림 사각형: 시작점 a에서 방향 deg로 길이 L · 폭 W (가운데 줄이 a를 지난다)
function rotRect(name, rid, ax, ay, deg, L, W, rgb, alpha, z) {
  const th = (deg * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
  // rectPoint(pos, …, 0, W/2) = a 가 되는 엔티티 자리
  const lx = POLICY.ROT_ANCHOR === "center" ? -L / 2 : -S / 2, ly = POLICY.ROT_ANCHOR === "center" ? 0 : W / 2 - S / 2;
  const px = ax - (ux * lx + nx * ly), py = ay - (uy * lx + ny * ly);
  return {
    name, pos: [r3(px), r3(py), z],
    overrides: {
      "MOD.Core.SpriteRendererComponent": { SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: 1, DrawMode: 2, TiledSize: { x: r3(L / S), y: r3(W / S) }, Color: { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha } },
      "MOD.Core.TransformComponent": { QuaternionRotation: quat(deg) },
    },
  };
}
// 엔티티 → [자리, 각도, 길이, 폭] (검사기용 역산)
function rotOf(e) {
  const sr = e.overrides["MOD.Core.SpriteRendererComponent"], q = e.overrides["MOD.Core.TransformComponent"].QuaternionRotation;
  return { pos: e.pos, deg: ((2 * Math.atan2(q.z, q.w) * 180) / Math.PI) * (POLICY.ROT_SIGN || 1), L: sr.TiledSize.x * S, W: sr.TiledSize.y * S };
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
  // 담 윗면 맵(구역 바닥을 그리지 않는 꼴): 걷는 칸은 모두 담 윗면 그림 하나 — 바닥 경계가 없다
  if (bp.raised && !bp.raised.zoneTop) return { art: `${bp.raised.atlas}-borders-n`, tint: bp.raised.tint, rank: 1, ch: "." };
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
// 물 ↔ 뭍 경계는 액트 3 물가 거품 띠(;shore)가 이미 이음새 — 띠·모서리 조각을 겹쳐 깔지 않고 처리된 경계로 센다
const shoreEdge = (bp, p, q) => !!bp.shore && bp.shore.sea.has(p.art) !== bp.shore.sea.has(q.art);

// ───────── C-6 길 안내 그림 ─────────
function guideEntities(bp, classes, route, ruidOf, mapInfo) {
  if (route && route.v4) return guideV4(bp, route, ruidOf, mapInfo || {});
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
    // 한 길(출구 하나)은 한 그림으로 — 자리마다 바닥을 따르면 길이 길·구역 그림 조각으로 갈려 네모 블록처럼 보였다(10-31 동문 근접 미리보기).
    //   그 길이 가장 많이 지나는 바닥(그림·색)을 쓴다
    {
      const cnt = new Map();
      for (const it of info) if (it.f) { const k2 = fkey(it.f); cnt.set(k2, (cnt.get(k2) || { n: 0, f: it.f })); cnt.get(k2).n++; }
      const major = [...cnt.values()].sort((x, y) => y.n - x.n)[0];
      if (major) for (const it of info) if (it.f) it.f = major.f;
    }
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
        if (Math.abs(info[j + 1].outer - info[i].outer) > 0.8) break;   // 벽 가까이 폭이 조금씩 바뀌어도 0.8칸 안이면 한 토막 (좁은 쪽 폭)
        // 곧은 토막(현)이 곡선에서 0.15칸 넘게 벗어나면 끊는다 — 길게 휘는 구간에서 현이 벽 쪽으로 파고들었다
        const ax = P[i].x, ay = P[i].y, bx = P[j + 1].x, by = P[j + 1].y, cl = Math.hypot(bx - ax, by - ay) || 1;
        let off = 0;
        for (let k = i + 1; k <= j; k++) off = Math.max(off, Math.abs((bx - ax) * (P[k].y - ay) - (by - ay) * (P[k].x - ax)) / cl);
        if (off > 0.15) break;   // 폭은 벽에서 0.15칸 띄워 잡으므로(outer = 2 × (여유 − 0.15)) 현이 이만큼 벗어나도 벽에 닿지 않는다
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
        // 토막 끝을 이음매 틈(폭/2 × tan(꺾임/2))만큼 늘린다 — 단 늘린 모서리가 벽에 닿지 않게 그 자리 여유 안에서
        const ext0 = (outerW / 2) * Math.tan((POLICY.GUIDE_STEP_DEG * Math.PI) / 360) + 0.06, ux = Math.cos((deg * Math.PI) / 180), uy = Math.sin((deg * Math.PI) / 180);
        const room = (p) => Math.sqrt(Math.max(0, route.clearAt(p.x, p.y) ** 2 - (outerW / 2) ** 2)) - 0.03;
        const extA = Math.min(ext0, Math.max(0.03, room(a))), extB = Math.min(ext0, Math.max(0.03, room(b)));
        const ext = extA;
        const L = Math.hypot(b.x - a.x, b.y - a.y) + extA + extB;
        // 10-31 메이커 실측: ×1.10은 줌 130에서도 안 보였다 → 밝은 가운데(×GUIDE_BRIGHT · 출구 앞 ×EXIT_BRIGHT) + 양 가장자리 어두운 테 선(×GUIDE_EDGE_DARK)
        //   어두운 사각형(폭 W)을 깔고 그 위에 밝은 사각형(폭 W − 2×GUIDE_EDGE)을 얹는다 — 토막당 두 장 그대로
        const cap = capTint(f.tint), k = info[i].exit ? POLICY.EXIT_BRIGHT : POLICY.GUIDE_BRIGHT;
        const bright = cap.map((v) => r3(Math.min(1, v * k))), dark = cap.map((v) => r3(v * POLICY.GUIDE_EDGE_DARK));
        const rid = ruidOf(f.art);
        out.push(rotRect(`ArtGuide${++n}`, rid, a.x - ux * ext, a.y - uy * ext, r3(deg), r3(L), r3(outerW), dark, 1, -0.0115));
        out.push(rotRect(`ArtGuide${++n}`, rid, a.x - ux * ext, a.y - uy * ext, r3(deg), r3(L), r3(Math.max(0.3, outerW - 2 * POLICY.GUIDE_EDGE)), bright, 1, -0.0116));
      }
      i = j;
    }
  }
  return { entities: out, segments: n / 2, sharp, minRadius };
}

// ───────── C-7·C-8 길 안내 v4 그림: 폭 1칸 · 큰길 위 없음 · 끊긴 발길 · 액트 타일 ─────────
//   곡선마다 ① 어두운 바탕 띠(폭 W · 타일 × EDGE_DARK — 양옆 테 선 역할)를 STEP_DEG마다 끊은 토막으로 깔고
//   ② 그 위에 밝은 발길 토막(폭 W − 2×EDGE · 타일 × BRIGHT)을 길이 DASH 사이 의사 난수로 얹되 빈틈이 GAP_RATIO가 되게 (맵 id 씨앗 — 빌드마다 같다)
//   조각 종류(straight·curve·fork·end)는 pieces에 기록 — GUIDE_TILE[액트][종류] 그림·색으로 그린다(코덱스 타일이 오면 그림만 바꾼다)
function seededRand(text) {
  let h = 2166136261 >>> 0;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => { h = (h + 0x6d2b79f5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// 코덱스 길 안내 타일 도장 (GUIDE_TILE stamp — 액트 1부터): 1칸 간격 낱장(가운데 피벗 · 회전 · 좌우 반전), 바탕 띠·테 선 없음.
//   구간 처음 = 갈림 타일(그린 길에서 갈라질 때) 또는 끝 타일(큰길·문 쪽으로 옅어짐) · 마지막 = 끝 타일 · 사이 = 직선 타일(1칸 안에서 CURVE_DEG 넘게 꺾이면 곡선 타일)
//   사이 도장은 STAMP.GAP 확률로 빈다(맵 id 씨앗). 조각마다 중심·진행 방향(hd)을 기록 — 검사기는 진행 방향 1칸 × CORE_W 폭(흙길 몸통)으로 벽·큰길 겹침을 잰다
function stampSprite(name, rid, cx, cy, deg, flip, rgb) {
  return {
    name, pos: [r3(cx), r3(cy), -0.0116],
    overrides: {
      "MOD.Core.SpriteRendererComponent": { SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: 1, DrawMode: 0, FlipX: !!flip, Color: { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 } },
      "MOD.Core.TransformComponent": { QuaternionRotation: quat(r3(deg)) },
    },
  };
}
function guideStamps(bp, route, ruidOf, mapInfo, tiles) {
  const V = POLICY.V4, ST = V.STAMP, out = [], pieces = [];
  const rand0 = seededRand(`${mapInfo.id}|stamp`);
  const mapVar = r3(1 - ST.VAR * 2 * rand0());   // 맵마다 명도 0.84~1 (타일 색은 1보다 밝힐 수 없어 아래로만 ±8%)
  const nearBig = (x, y) => {
    for (let cy = Math.floor(y - 1); cy <= Math.floor(y + 1); cy++) for (let cx = Math.floor(x - 1); cx <= Math.floor(x + 1); cx++) if (route.isBig(cx, cy) && distSqToCell(x, y, cx, cy) < 0.55 * 0.55) return true;
    return false;
  };
  const kinds = { straight: 0, curve: 0, fork: 0, end: 0 };
  let n = 0, sharp = 0, minRadius = Infinity;
  const drawnPts = [];   // 앞서 그린 길의 점 (갈림 판정)
  const put = (kind, cx, cy, rot, hd, flip, exit, target, rgbMul) => {
    // 흙길 몸통(진행 방향 1칸 × CORE_W)이 벽 모서리에 걸리는 길목이면 그 도장은 비운다
    const th = (hd * Math.PI) / 180;
    for (let a = -0.45; a <= 0.45; a += 0.15) if (route.clearAt(cx + Math.cos(th) * a, cy + Math.sin(th) * a) < ST.CORE_W / 2 + 0.03) return;
    const t = tiles[kind], rgb = tintArr(t.tint).map((v) => r3(Math.min(1, v * mapVar * (rgbMul || 1))));
    const e = stampSprite(`ArtGuide${++n}`, ruidOf(t.art), cx, cy, rot, flip, rgb);
    out.push(e);
    pieces.push({ name: e.name, kind, layer: "stamp", W: V.WIDTH, exit, target, cx: r3(cx), cy: r3(cy), hd: r3(hd) });
    kinds[kind]++;
  };
  for (const c of route.curves) {
    const P = c.pts;
    if (P.length < 2) continue;
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    const total = acc[acc.length - 1];
    const exitCurve = c.kind === "exit" && !["end", "entry"].includes(c.target);
    const draw = P.map((p) => !nearBig(p.x, p.y));
    for (let i = 0; i < P.length; i++) if (draw[i] && P[i].turn > 45 && P[i].r < minRadius) minRadius = P[i].r;
    const rnd = seededRand(`${mapInfo.id}|${c.target}|stamp`);
    const at = (s) => {
      let k = 0;
      while (k < P.length - 2 && acc[k + 1] < s) k++;
      const t = Math.min(1, Math.max(0, (s - acc[k]) / ((acc[k + 1] - acc[k]) || 1)));
      return { x: P[k].x + (P[k + 1].x - P[k].x) * t, y: P[k].y + (P[k + 1].y - P[k].y) * t };
    };
    const heading = (s0, s1) => { const a = at(Math.max(0, s0)), b = at(Math.min(total, s1)); return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI; };
    let i0 = 0;
    while (i0 < P.length) {
      while (i0 < P.length && !draw[i0]) i0++;
      if (i0 >= P.length - 1) break;
      let i1 = i0;
      while (i1 + 1 < P.length && draw[i1 + 1]) i1++;
      const L = acc[i1] - acc[i0];
      if (L >= 0.6) {
        const cnt = Math.max(1, Math.round(L / ST.PITCH)), sp = L / cnt;
        const onTrail = (p) => drawnPts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.6);
        let prevHd = null;
        for (let k = 0; k < cnt; k++) {
          const s = acc[i0] + sp * (k + 0.5), p = at(s), hd = heading(s - 0.5, s + 0.5);
          const exit = exitCurve && total - s <= POLICY.EXIT_LEN;
          // 이웃 도장 진행 방향이 65° 넘게 바뀌면 꺾임 — 단 곡선 타일 자리(그 꺾임을 타일 한 장이 그린다)와 빈 도장은 빼고 센다
          let jump = false;
          if (prevHd !== null) { let dd = Math.abs(hd - prevHd); if (dd > 180) dd = 360 - dd; jump = dd > 65; }   // 반경 1칸 원호는 1칸에 57°쯤 꺾인다 — 그보다 큰 꺾임만
          if (jump) {
            const hI = heading(s - 0.5, s), hO = heading(s, s + 0.5);
            let tn = hO - hI; while (tn > 180) tn -= 360; while (tn < -180) tn += 360;
            if (Math.abs(tn) < ST.CURVE_DEG) sharp++;
          }
          prevHd = hd;
          if (k === 0 && cnt > 1) {
            if (c.branch && i0 === 0 && onTrail(P[0])) put("fork", P[0].x, P[0].y, hd + 90, hd, false, exit, c.target);   // 갈림: S(갈래)가 진행 방향 · W–E는 갈라져 나온 길
            else put("end", p.x, p.y, hd - 90, hd, false, exit, c.target);                                              // 시작: N이 앞쪽(길이 이어지는 쪽) · 뒤로 옅어짐
            continue;
          }
          if (k === cnt - 1) { put("end", p.x, p.y, hd + 90, hd, false, exit, c.target); continue; }   // 마지막: N이 뒤쪽 · 앞으로 옅어짐
          // 1칸 안 꺾임 = 도장 앞끝(s−0.5)과 뒤끝(s+0.5) 접선 방향 차 (10-31 메이커 3차: 50° 기준이면 66장 곡선 타일 0장 → 25°)
          const hIn = heading(s - 0.65, s - 0.35), hOut = heading(s + 0.35, s + 0.65);
          let turn = hOut - hIn; while (turn > 180) turn -= 360; while (turn < -180) turn += 360;
          if (rnd() < ST.GAP && Math.abs(turn) < ST.CURVE_DEG) continue;   // 끊긴 발길 (빈틈) — 꺾이는 자리는 비우지 않는다(꺾임이 끊겨 보이지 않게)
          if (Math.abs(turn) >= ST.CURVE_DEG) {
            // 곡선 타일(90° 한 장)을 이 칸의 평균 진행 방향에 맞춰 돌린다: 왼쪽 = 원본(N→E, 평균 −45°) · 오른쪽 = 좌우 반전(N→W, 평균 −135°)
            put("curve", p.x, p.y, turn > 0 ? hd + 45 : hd + 135, hd, turn < 0, exit, c.target);
            // 50° 넘게 꺾이면 반 칸 뒤에 나가는 방향 직선 한 장으로 이음을 보정
            if (Math.abs(turn) >= ST.CURVE_FIX_DEG && k + 1 < cnt - 1) { const q = at(s + sp / 2); put("straight", q.x, q.y, hOut - 90, hOut, rnd() < 0.5, exit, c.target); }
          } else put("straight", p.x, p.y, hd - 90, hd, rnd() < 0.5, exit, c.target);
        }
        for (let k = i0; k <= i1; k++) drawnPts.push(P[k]);
      }
      i0 = i1 + 1;
    }
  }
  return { entities: out, segments: pieces.length, dashes: 0, sharp, minRadius, pieces, kinds, mapVar };
}
function guideV4(bp, route, ruidOf, mapInfo) {
  {
    const tl = POLICY.GUIDE_TILE[mapInfo.act] || POLICY.GUIDE_TILE[1];
    if (tl.straight.stamp) return guideStamps(bp, route, ruidOf, mapInfo, tl);
  }
  const V = POLICY.V4, out = [], pieces = [];
  const rand0 = seededRand(`${mapInfo.id}|guide`);
  const mapVar = 1 + V.MAP_VAR * (2 * rand0() - 1);
  const tiles = POLICY.GUIDE_TILE[mapInfo.act] || POLICY.GUIDE_TILE[1];
  const nearBig = (x, y) => {
    for (let cy = Math.floor(y - 1); cy <= Math.floor(y + 1); cy++) for (let cx = Math.floor(x - 1); cx <= Math.floor(x + 1); cx++) if (route.isBig(cx, cy) && distSqToCell(x, y, cx, cy) < 0.55 * 0.55) return true;
    return false;
  };
  let n = 0, sharp = 0, minRadius = Infinity;
  const kinds = { straight: 0, curve: 0, fork: 0, end: 0 };
  const color = (kind, mul) => tintArr(tiles[kind].tint).map((v) => r3(Math.min(1, v * mapVar * mul)));
  const emit = (kind, layer, a, b, W, exit, target) => {
    const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, L = Math.hypot(b.x - a.x, b.y - a.y);
    if (L < 0.05) return;
    // 토막 가운데 줄을 따라 벽 여유를 재 폭을 그 안으로 (길목에서 곡선이 벽 모서리를 스치는 자리) — 너무 좁으면 그 토막은 건너뛴다
    { let m = Infinity; for (let k = 0; k <= 8; k++) m = Math.min(m, route.clearAt(a.x + ((b.x - a.x) * k) / 8, a.y + ((b.y - a.y) * k) / 8)); W = Math.min(W, 2 * (m - 0.04)); if (W < 0.1) return; }
    const t = tiles[kind];
    const rgb = layer === "base" ? color(kind, V.EDGE_DARK) : color(kind, exit ? V.EXIT_BRIGHT : V.BRIGHT);
    const e = rotRect(`ArtGuide${++n}`, ruidOf(t.art), a.x, a.y, r3(deg), r3(L), r3(W), rgb, 1, layer === "base" ? -0.0115 : -0.0116);
    out.push(e);
    pieces.push({ name: e.name, kind, layer, W: r3(W), exit, target });
    kinds[kind]++;
    return deg;
  };
  // 끝 조각: 끝점 p에 바탕 띠 방향 deg로 45° 돌린 정사각형(한 변 W×0.707 → 반대각선 W/2) — 띠 끝 모서리 두 점과 맞닿고 반칸 앞으로 뾰족하게 · 불투명도 END_ALPHA
  const capEnd = (p, deg, W, exit, target) => {
    const s = W * Math.SQRT1_2, th = ((deg + 45) * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th);
    const e = rotRect(`ArtGuide${++n}`, ruidOf(tiles.end.art), p.x - ux * (s / 2), p.y - uy * (s / 2), r3(deg + 45), r3(s), r3(s), color("end", V.EDGE_DARK), V.END_ALPHA, -0.0115);
    out.push(e);
    pieces.push({ name: e.name, kind: "end", layer: "cap", W: r3(s), exit, target });
    kinds.end++;
  };
  for (const c of route.curves) {
    const P = c.pts;
    if (P.length < 2) continue;
    const acc = [0];
    for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
    const total = acc[acc.length - 1];
    const exitCurve = c.kind === "exit" && !["end", "entry"].includes(c.target);
    const info = P.map((p, i) => {
      const exit = exitCurve && total - acc[i] <= POLICY.EXIT_LEN;
      const clear = route.clearAt(p.x, p.y);
      const W = Math.max(0.24, Math.min(exit ? V.EXIT_WIDTH : V.WIDTH, 2 * (clear - 0.18)));   // 한 칸 좁은 길목은 그 폭에 맞춰 가늘게
      return { draw: !nearBig(p.x, p.y), exit, W };
    });
    // v4: 반경 1칸 규칙은 45° 넘게 꺾는 원호에만 (작게 꺾는 곳은 반경이 작아도 모서리로 보이지 않는다 — 좁은 굴 길목)
    for (let i = 0; i < P.length; i++) if (info[i].draw && P[i].turn > 45 && P[i].r < minRadius) minRadius = P[i].r;
    const firstDraw = info.findIndex((it) => it.draw);
    if (firstDraw < 0) continue;
    const kindAt = (i, j) => {
      if (info[j].exit) return "end";
      if (acc[i] - acc[firstDraw] < V.FORK_LEN) return "fork";
      for (let k = i; k <= j; k++) if (Number.isFinite(P[k].r)) return "curve";
      return "straight";
    };
    // 그릴 수 있는 점 구간(큰길 밖)마다
    let i0 = 0;
    while (i0 < P.length) {
      while (i0 < P.length && !info[i0].draw) i0++;
      if (i0 >= P.length - 1) break;
      let i1 = i0;
      while (i1 + 1 < P.length && info[i1 + 1].draw) i1++;
      if (i1 > i0) {
        // ① 바탕 띠
        let i = i0, prevDeg = null;
        while (i < i1) {
          const d0 = Math.atan2(P[i + 1].y - P[i].y, P[i + 1].x - P[i].x) * 180 / Math.PI;
          let j = i + 1;
          while (j < i1) {
            const dj = Math.atan2(P[j + 1].y - P[j].y, P[j + 1].x - P[j].x) * 180 / Math.PI;
            let dd = Math.abs(dj - d0); if (dd > 180) dd = 360 - dd;
            if (dd > V.STEP_DEG / 2 || info[j + 1].exit !== info[i].exit || Math.abs(info[j + 1].W - info[i].W) > 0.3) break;
            const ax = P[i].x, ay = P[i].y, bx = P[j + 1].x, by = P[j + 1].y, cl = Math.hypot(bx - ax, by - ay) || 1;
            let off = 0;
            for (let k = i + 1; k <= j; k++) off = Math.max(off, Math.abs((bx - ax) * (P[k].y - ay) - (by - ay) * (P[k].x - ax)) / cl);
            if (off > 0.15) break;   // 폭을 벽에서 0.18칸 띄워 잡으므로 현이 0.15칸 벗어나도 벽에 닿지 않는다
            j++;
          }
          let W = Infinity;
          for (let k = i; k <= j; k++) W = Math.min(W, info[k].W);
          const deg = Math.atan2(P[j].y - P[i].y, P[j].x - P[i].x) * 180 / Math.PI;
          // 이음매 틈만큼 양끝을 늘린다 (그 자리 벽 여유 안에서)
          const ext0 = (W / 2) * Math.tan((V.STEP_DEG * Math.PI) / 360) + 0.04, ux = Math.cos(deg * Math.PI / 180), uy = Math.sin(deg * Math.PI / 180);
          const room = (p) => Math.sqrt(Math.max(0, route.clearAt(p.x, p.y) ** 2 - (W / 2) ** 2)) - 0.03;
          const eA = i === i0 ? 0 : Math.min(ext0, Math.max(0.02, room(P[i]))), eB = j === i1 ? 0 : Math.min(ext0, Math.max(0.02, room(P[j])));
          const a = { x: P[i].x - ux * eA, y: P[i].y - uy * eA }, b = { x: P[j].x + ux * eB, y: P[j].y + uy * eB };
          if (prevDeg !== null) { let dd = Math.abs(deg - prevDeg); if (dd > 180) dd = 360 - dd; if (dd > V.STEP_DEG + 5) sharp++; }   // v4: 토막 각도(40°)를 넘는 꺾임만 (직각 90°는 반드시 잡힌다)
          prevDeg = deg;
          emit(kindAt(i, j), "base", a, b, W, info[j].exit, c.target);
          // 구간 시작·끝: 바탕 띠 끝에 반칸 뾰족한 끝 조각(end · 45° 마름모, 반투명 — 끝이 네모 블록으로 끊기지 않게, 코덱스 end 타일 오기 전 임시)
          if (i === i0) capEnd(P[i0], deg + 180, W, info[i0].exit, c.target);
          if (j === i1) capEnd(P[i1], deg, W, info[i1].exit, c.target);
          i = j;
        }
        // ② 끊긴 발길 토막
        const rnd = seededRand(`${mapInfo.id}|${c.target}|${i0}`);
        const pointAt = (s) => {
          let k = i0;
          while (k < i1 && acc[k + 1] < s) k++;
          const t = Math.min(1, Math.max(0, (s - acc[k]) / ((acc[k + 1] ?? acc[k]) - acc[k] || 1)));
          return { x: P[k].x + (P[Math.min(k + 1, i1)].x - P[k].x) * t, y: P[k].y + (P[Math.min(k + 1, i1)].y - P[k].y) * t, k };
        };
        let s = acc[i0] + 0.45 + rnd() * 0.4;   // 발길 토막은 끝 조각 안쪽에서만
        while (s < acc[i1] - 0.65) {
          const len = V.DASH[0] + (V.DASH[1] - V.DASH[0]) * rnd();
          const e = Math.min(acc[i1] - 0.45, s + len);
          // 토막 안에서도 STEP_DEG/2마다 끊어 곡선을 따른다
          const pts = [pointAt(s)];
          for (let k = i0; k <= i1; k++) if (acc[k] > s + 1e-6 && acc[k] < e - 1e-6) pts.push({ x: P[k].x, y: P[k].y, k });
          pts.push(pointAt(e));
          let a = 0;
          while (a < pts.length - 1) {
            const d0 = Math.atan2(pts[a + 1].y - pts[a].y, pts[a + 1].x - pts[a].x) * 180 / Math.PI;
            let b = a + 1;
            while (b < pts.length - 1) {
              const db = Math.atan2(pts[b + 1].y - pts[b].y, pts[b + 1].x - pts[b].x) * 180 / Math.PI;
              let dd = Math.abs(db - d0); if (dd > 180) dd = 360 - dd;
              if (dd > V.STEP_DEG / 2) break;
              // 발길 토막도 현이 곡선에서 0.1칸 넘게 벗어나면 끊는다 (긴 토막이 휘는 길목에서 벽 모서리를 가로질렀다)
              { const ax = pts[a].x, ay = pts[a].y, bx = pts[b + 1].x, by = pts[b + 1].y, cl = Math.hypot(bx - ax, by - ay) || 1; let off = 0; for (let k = a + 1; k <= b; k++) off = Math.max(off, Math.abs((bx - ax) * (pts[k].y - ay) - (by - ay) * (pts[k].x - ax)) / cl); if (off > 0.1) break; }
              b++;
            }
            const ki = Math.min(pts[a].k, i1), kj = Math.min(pts[b].k + 1, i1);
            let W = Infinity;
            for (let k = ki; k <= kj; k++) W = Math.min(W, info[k].W);
            emit(kindAt(ki, kj), "dash", pts[a], pts[b], Math.max(0.14, W - 2 * V.EDGE), info[kj].exit, c.target);
            a = b;
          }
          s = e + len * (V.GAP_RATIO / (1 - V.GAP_RATIO)) * (0.7 + 0.6 * rnd());
        }
      }
      i0 = i1 + 1;
    }
  }
  return { entities: out, segments: pieces.filter((p) => p.layer === "base").length, dashes: pieces.filter((p) => p.layer === "dash").length, sharp, minRadius, pieces, kinds, mapVar: r3(mapVar) };
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
    if (p && q && fkey(p) !== fkey(q) && shoreEdge(bp, p, q)) { edges.total++; edges.covered++; edges.foam = (edges.foam || 0) + 1; }
    else if (p && q && fkey(p) !== fkey(q)) { edges.total++; const up = upper(p, q) ? p : q, dir = up === p ? 1 : -1; addRun(`H|${y + 1}|${dir}|${p.rank === q.rank ? 1 : 0}|${fkey(up)}`, x); }
    else if ((p && !q && isBlock(x, y + 1)) || (!p && q && isBlock(x, y))) { edges.total++; addRun(`SH|${y + 1}|${p ? -1 : 1}|0`, x); }
  }
  for (let x = b.x0; x < b.x1; x++) for (let y = b.y0; y <= b.y1; y++) {
    const p = fl(x, y), q = fl(x + 1, y);
    if (p && q && fkey(p) !== fkey(q) && shoreEdge(bp, p, q)) { edges.total++; edges.covered++; edges.foam = (edges.foam || 0) + 1; }
    else if (p && q && fkey(p) !== fkey(q)) { edges.total++; const up = upper(p, q) ? p : q, dir = up === p ? 1 : -1; addRun(`V|${x + 1}|${dir}|${p.rank === q.rank ? 1 : 0}|${fkey(up)}`, y); }
    else if ((p && !q && isBlock(x + 1, y)) || (!p && q && isBlock(x, y))) { edges.total++; addRun(`SV|${x + 1}|${p ? -1 : 1}|0`, y); }
  }
  const shadeRid = ruidOf(POLICY.SHADE_ART);
  for (const [k, list] of runs) {
    const [kind, lineS, dirS, sameS, art, tint] = k.split("|");
    const line = Number(lineS), dir = Number(dirS);
    for (const [s, e] of list) {
      edges.covered += e - s + 1;
      // 같은 계층끼리(구역 ↔ 구역) 맞닿는 경계는 첫 겹만 — 계층이 다른 경계(길 ↔ 구역 · 새 지형 ↔ 일반)만 두 겹 그라데이션 (10-31 엔티티 절감)
      // 막힌 칸 옆: SHADE가 비면(10-31 메이커 로딩 실측으로 그늘 띠 제거) 벽 9조각의 가장자리 조각(바위 테두리)이 이음새
      if (kind === "H" || kind === "V") bands(sameS === "1" ? POLICY.BAND.slice(0, 1) : POLICY.BAND, kind === "H", line, s, e + 1, dir, ruidOf(art), capTint(tint), 1, -0.007, "ArtBand");
      else if (!opts.noShade && POLICY.SHADE.length) bands(POLICY.SHADE, kind === "SH", line, s, e + 1, dir, shadeRid, [0, 0, 0], 1, -0.0118, "ArtShade");
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
        if (h && v && g && fkey(h) !== fkey(c) && fkey(v) !== fkey(c) && fkey(g) !== fkey(c) && upper(c, h) && upper(c, v) && !shoreEdge(bp, c, h) && !shoreEdge(bp, c, v)) {
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

module.exports = { curvesCross, setMap, isV4, tooClose, cellTooClose, rectPoint, rotOf, shoreEdge, POLICY, classOf, classTable, modeOf, isScatterRow, planRows, finalizeRows, routes, distToCurve, cellDistToCurve, guideEntities, seamEntities, countCorners, floorAt, capTint, rotRect, parseArgs };
