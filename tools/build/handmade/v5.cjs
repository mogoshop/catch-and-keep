// 맵 구성 v5 생성기 (10-31 · docs/design/map-composition-v5-plan.md 2단계) — compose.cjs가 설계서에 v5가 있는 맵에서만 부른다.
//   A 길 안내 도장 없음 (빌더 lib.cjs가 ;v5 맵은 길 경로·도장·흩뿌림 정책을 쓰지 않는다)
//   B 골격·띠: 입구(W·G) → [경유점(웨이포인트 S · 설계서 v5.via)] → 전진 출구(E) 최단 경로(8방향 · 벽 곁 비용 1+0.6×벽 이웃 수 — 1단계 골격과 같은 정의),
//      굴 입구(H)·되돌아가는 문(X)은 이미 그은 띠에서 갈래로. 4방향으로 잇고(폭 1) 한쪽씩 3~4칸 덧대 폭 1~2 · 고리·곁길 없음
//   C 구역 바닥 재적합: 띠 칸 = 바탕(.) · 바탕·길 글자 칸은 가까운 구역으로 · 띠 곁 3칸 안이 바탕과 같아 보이면 그 액트 바닥 패치(넓은 쪽)
//   D 야외: 구역에서 3칸 넘게 떨어진 빈 바닥 36칸 이상이면 벽 토막 줄 섬 1~2개
//   E 역할표 배치: 특징 공간당 1(골격이 들어온 반대쪽 끝·중심) · 기둥류는 의식터·보스·출구·랜드마크 공간에서만 띠 양옆 2열 · 벽 따라 열 · 테두리 · 문 양옆 쌍 ·
//      소품 묶음 ≤3 · 공간당 ≤2묶음 · 같은 소품 그림 맵당 ≤2 · 크기는 빌더가 역할표 기준 크기로(roles.cjs multOf)
//   값은 data/handmade/specs/decor_policy.cjs V5 한 곳. 결과 검사는 tools/check_map_composition.cjs (같은 정의 함수를 여기서도 쓴다)
"use strict";
const path = require("path");
const roles = require("./roles.cjs");
const decor = require("./decor.cjs");
const checker = require("../../check_map_composition.cjs");
const { num } = require("../lib.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const POLICY = require(path.join(ROOT, "data/handmade/specs/decor_policy.cjs"));
const K = (x, y) => `${x},${y}`;
const unK = (k) => k.split(",").map(Number);
const r2 = (v) => Math.round(v * 100) / 100;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const GATES = new Set(["W", "E", "G", "X", "H"]);
// 공간 기능 낱말 (1단계 zone_sheet.py KW와 같다)
const KW = [
  ["의식터", ["제단", "의식", "성소", "예배", "신전", "사원", "설교", "성당", "교회", "기도", "봉인", "종탑", "예배당", "사제", "혼의", "룬", "심장"]],
  ["몬스터 캠프", ["둥지", "소굴", "야영", "진지", "병영", "캠프", "사냥", "무리", "막사", "감옥", "구덩이", "우리", "굴", "알", "군단", "전초", "망루", "보루", "포대"]],
  ["보물·곁길", ["보물", "창고", "금고", "밀수", "서고", "보고", "곳간", "납골", "비밀", "숨은", "무덤", "묘지", "난파", "화물", "서재", "문서"]],
];
function hash01(seed, x, y) {
  let h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function heapPush(h, it) { h.push(it); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function heapPop(h) { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; }
const zoneSpec = (line) => { const [art, tint, ...name] = String(line || "").split(" "); return { art: art === "-" ? null : art, tint: tint === "-" ? null : tint, name: name.join(" ") }; };

function run(o) {
  const { id, spec, g, func, markerOf, puts, table, ctx, seed, mapRow, footCells, clear } = o;
  const V = POLICY.V5;
  const opt = Object.assign({}, spec.v5 === true ? {} : spec.v5);
  const act = num(mapRow.act, 1);
  const outdoor = opt.outdoor !== undefined ? !!opt.outdoor : mapRow.kind === "field";
  // v5-keep (설계서 v5.mode = "keep"): 바닥 보존형 — 구역 바닥·색·길 글자를 그대로 두고 띠를 그리지 않는다(골격은 배치 비움·검사용으로만 계산).
  //   덧대기·구역 재적합·패치·양옆 나누기·경계 고침·섬 없음. 역할 배치·특징 공간당 1·길 안내 0만
  const keep = opt.mode === "keep";
  const rand = rng(seed + 50505);
  const warn = [], report = { id, outdoor, patches: 0 };
  const floor = (x, y) => g.floor(x, y);
  const isMk = (x, y) => markerOf.has(K(x, y));
  const nw = (x, y) => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!floor(x + dx, y + dy)) n++; return n; };
  const cellOfF = (f) => [Math.floor(f.x), Math.floor(f.y)];
  // 발밑 칸 = 빌더와 같은 v5 규칙 (lib.cjs footprintRole — 특징은 그림 아래 1/2 · 반복 구조는 1/3까지 막음)
  //   fopt: { frac (그 자리 막힘 비율), toWall (북벽까지 뒤 칸 막음) } — 빌더 배치표 args foot= · wall=1과 같다
  const fc = (name, x, y, mul, fopt) => { const hmLib = require("./lib.cjs"), sp = table[name]; if (!sp) throw new Error(`${id}: 그림 ${name}이 art_sprites·maple_sprites에 없음`); const sc = hmLib.baseScale(sp, ctx.propScale) * num(mul, 1) * roles.multOf(name); return hmLib.footprintRole(name, x, y, sp.w, sp.h, sc, Object.assign({ isWall: (cx, cy) => !floor(cx, cy) }, fopt || {})).map((k) => k.split(",").map(Number)); };
  // 벽 정면 그림을 북벽에 붙일 발 y: 그림 보이는 높이(불투명)의 윗면이 벽 밑선에 닿게
  const hugY = (name, wallLineY, mul) => Math.round((wallLineY - roles.heightOf(name) * roles.multOf(name) * num(mul, 1)) * 100) / 100;
  const northWall = (x, y) => { const cx = Math.floor(x), cy = Math.floor(y); for (let k = 1; k <= 3; k++) if (!floor(cx, cy + k)) return cy + k; return null; };
  const setPieces = (name) => { const ps = ctx.sets[name]; if (!ps) throw new Error(`${id}: 세트 ${name}이 map_sets.csv에 없음`); return ps; };
  const setCells = (name, x, y, m, sc) => setPieces(name).filter((pc) => !pc.piece.startsWith("d:")).flatMap((pc) => fc(pc.piece, x + num(pc.dx) * m, y + num(pc.dy), num(pc.scale, 1) * num(sc, 1)));
  const blockOf = (name) => { if (/decal/.test(name)) return false; const c = decor.classOf(name); return c.collide === "block" || (["feature", "structure"].includes(roles.roleOf(name)) && !["floor", "portal", "overlay"].includes(c.class)); };   // 빌더 v5 막음 규칙과 같다
  // 손으로 고른 자리(put)의 막는 조각 발밑 + 1칸 — 띠가 그 위로 지나가지 않게 비싸게
  const pen = new Set();
  for (const pu of puts) {
    const [kind, name, x, y, sc, flip] = pu;
    const cells = kind === "set" ? setPieces(name).filter((pc) => !pc.piece.startsWith("d:") && (pc.collide === "block" || blockOf(pc.piece))).flatMap((pc) => fc(pc.piece, x + num(pc.dx) * (flip ? -1 : 1), y + num(pc.dy), num(pc.scale, 1) * num(sc, 1)))
      : kind === "prop" && blockOf(name) ? fc(name, x, y, sc || 1) : [];
    for (const [cx, cy] of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) pen.add(K(cx + dx, cy + dy));
  }

  // ───────── B 골격 ─────────
  // seg: 경유점 사이 곧은 선 [[x, y], [x, y]] — 넓은 방에서 같은 비용 길이 여럿이면 그 선에 가까운 쪽 (띠가 곧게)
  const segD = (px, py, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / L2)) : 0; return Math.hypot(px - a[0] - vx * t, py - a[1] - vy * t); };
  const search = (sources, isGoal, seg) => {
    const dist = new Map(), prev = new Map(), h = [];
    for (const [x, y] of sources) { dist.set(K(x, y), 0); heapPush(h, [0, x, y]); }
    let found = null;
    while (h.length) {
      const [dd, x, y] = heapPop(h);
      if (dd > dist.get(K(x, y))) continue;
      if (isGoal(x, y)) { found = K(x, y); break; }
      for (const [dx, dy] of D8) {
        const nx = x + dx, ny = y + dy;
        if (!floor(nx, ny) || (dx && dy && (!floor(x + dx, y) || !floor(x, y + dy)))) continue;
        const nd = dd + (dx && dy ? 1.414 : 1) * (1 + 0.6 * nw(nx, ny)) * (pen.has(K(nx, ny)) ? 12 : 1) * (keep && g.get(nx, ny).road ? 0.5 : 1) + (seg ? 0.25 * segD(nx, ny, seg[0], seg[1]) : 0), nk = K(nx, ny);   // keep: 남은 길 글자를 따른다 (검사기 골격과 같은 비용)
        if (!dist.has(nk) || nd < dist.get(nk) - 1e-9) { dist.set(nk, nd); prev.set(nk, K(x, y)); heapPush(h, [nd, nx, ny]); }
      }
    }
    if (!found) return null;
    const out = [];
    for (let k = found; k !== undefined; k = prev.get(k)) out.push(unK(k));
    return out.reverse();
  };
  const to4 = (cells) => {   // 대각 한 걸음마다 모서리 칸 하나 (벽 이웃이 적은 쪽)
    const out = [cells[0]];
    for (let i = 1; i < cells.length; i++) {
      const p = out[out.length - 1], q = cells[i];
      if (p[0] !== q[0] && p[1] !== q[1]) {
        const a = [q[0], p[1]], b = [p[0], q[1]];
        const sa = (floor(...a) ? 0 : 99) + nw(...a) + (pen.has(K(...a)) ? 9 : 0), sb = (floor(...b) ? 0 : 99) + nw(...b) + (pen.has(K(...b)) ? 9 : 0);
        out.push(sa <= sb ? a : b);
      }
      out.push(q);
    }
    return out;
  };
  const noLoops = (cells) => {   // 같은 칸을 다시 지나면 그 사이를 잘라낸다 (경유점에서 되돌아 나오는 곁길 없게)
    const out = [], at = new Map();
    for (const c of cells) {
      const k = K(...c);
      if (at.has(k)) { const i = at.get(k); for (const d of out.splice(i + 1)) at.delete(K(...d)); continue; }
      at.set(k, out.length); out.push(c);
    }
    return out;
  };
  const byCh = (ch) => func.filter((f) => f.ch === ch);
  const startF = byCh("W")[0] || byCh("G")[0];
  if (!startF) throw new Error(`${id}: v5 골격 — 들어오는 문(W·G)이 없음`);
  const exitsF = [...byCh("E"), ...byCh("X"), ...func.filter((f) => f.ch === "K" && f.name === "return"), ...byCh("H")];
  // 마을(전진 출구 없음): 들어오는 문 → 웨이포인트가 골격 (1단계 골격 정의와 같다)
  const mainEnd = exitsF[0] || byCh("S")[0];
  // 웨이포인트 경유: 표식 칸 자체 대신 그 8방향 이웃 중 앞뒤 점을 잇는 직선에서 덜 벗어나는 칸 (띠가 표식으로 솟았다 내려오는 혹이 없게 · 웨이포인트는 띠 1칸 안)
  const rawVia = (opt.via || ["S"]).map((v) => (v === "S" ? (byCh("S").find((f) => f !== mainEnd) ? "S" : null) : [Math.floor(v[0]), Math.floor(v[1])])).filter(Boolean);
  const viaPts = rawVia.map((v, i) => {
    if (v !== "S") return v;
    const sc = cellOfF(byCh("S")[0]), prev = i ? (rawVia[i - 1] === "S" ? sc : rawVia[i - 1]) : cellOfF(startF), next = rawVia[i + 1] && rawVia[i + 1] !== "S" ? rawVia[i + 1] : mainEnd ? cellOfF(mainEnd) : sc;
    let best = sc, bd = Infinity;
    for (const [dx, dy] of D8) { const n = [sc[0] + dx, sc[1] + dy]; if (!floor(...n) || isMk(...n)) continue; const dd = Math.hypot(n[0] - prev[0], n[1] - prev[1]) + Math.hypot(next[0] - n[0], next[1] - n[1]); if (dd < bd) { bd = dd; best = n; } }
    return best;
  });
  const legs = [];   // [{ target, cells }] — 첫 갈래가 본 골격
  if (mainEnd) {
    const pts = [cellOfF(startF), ...viaPts, cellOfF(mainEnd)];
    let cells = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const seg = search([cells[cells.length - 1]], (x, y) => x === pts[i][0] && y === pts[i][1], [pts[i - 1], pts[i]]);
      if (!seg) { warn.push(`골격: (${pts[i - 1]}) → (${pts[i]}) 길 없음`); continue; }
      cells = cells.concat(to4(seg).slice(1));
    }
    legs.push({ target: mainEnd.ch === "K" ? "return" : mainEnd.ch, cells: noLoops(cells) });
    if (mainEnd.ch === "S") exitsF.unshift(mainEnd);
  }
  const core = new Set(legs.flatMap((l) => l.cells.map((c) => K(...c))));
  for (const f of exitsF.slice(1)) {
    const goal = cellOfF(f);
    if (core.has(K(...goal))) continue;
    const seg = search([...core].map(unK), (x, y) => x === goal[0] && y === goal[1]);
    if (!seg) { warn.push(`갈래: ${f.ch}${f.child ? " " + f.child : ""} 길 없음`); continue; }
    const cells = to4(seg);
    legs.push({ target: f.child || f.ch, cells });
    for (const c of cells) core.add(K(...c));
  }
  const band = new Set([...core].filter((k) => !isMk(...unK(k))));
  const coreBand = new Set(band);

  // 폭: 칸마다 가로·세로·두 대각 연속 수의 최솟값 (검사기 bandWidth와 같은 정의) ≤2
  const runLen = (x, y, dx, dy) => { let n = 1; for (let k = 1; band.has(K(x + dx * k, y + dy * k)); k++) n++; for (let k = 1; band.has(K(x - dx * k, y - dy * k)); k++) n++; return n; };
  const widthAt = (x, y) => Math.min(runLen(x, y, 1, 0), runLen(x, y, 0, 1), runLen(x, y, 1, 1), runLen(x, y, 1, -1));
  const widthOkAround = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (band.has(K(x + dx, y + dy)) && widthAt(x + dx, y + dy) > checker.MAX_WIDTH) return false; return true; };
  const nearGate = (x, y) => { for (const f of func) { if (!GATES.has(f.ch)) continue; const [fx, fy] = cellOfF(f); if (Math.max(Math.abs(fx - x), Math.abs(fy - y)) <= 1) return true; } return false; };
  const noAdd = new Set();   // 막다른 띠로 뺀 칸은 다시 덧대지 않는다
  const tryAdd = (x, y) => {
    const k = K(x, y);
    if (noAdd.has(k) || band.has(k) || !floor(x, y) || isMk(x, y) || pen.has(k) || nearGate(x, y)) return false;
    band.add(k);
    if (!widthOkAround(x, y)) { band.delete(k); return false; }
    return true;
  };
  // C 가장자리 유기적: 한쪽(위) 3~4칸 · 빔 1 · 다른 쪽(아래) 3~4칸 · 빔 1 — 양쪽 가장자리 모두 6칸 안에서 꺾인다
  if (!keep) legs.forEach((leg, li) => {
    const lr = rng(seed + 777 + li * 131), seq = [];
    while (seq.length < leg.cells.length + 8) {
      // 위 a · 빔 b · 아래 c · 빔 d — 한쪽 가장자리가 같은 줄에 머무는 길이(b+c+d · d+a+b)는 6칸 이하, 평균 폭 약 1.5
      const pick = (r) => r[0] + Math.floor(lr() * (r[1] - r[0] + 1));
      const a = pick(V.DILATE.on), c = pick(V.DILATE.on);
      let b = pick(V.DILATE.gap), d = pick(V.DILATE.gap);
      while (b + c + d > 6 && d > 1) d--;
      while (d + a + b > 6 && b > 1) b--;
      for (let i = 0; i < a; i++) seq.push(1);
      for (let i = 0; i < b; i++) seq.push(0);
      for (let i = 0; i < c; i++) seq.push(-1);
      for (let i = 0; i < d; i++) seq.push(0);
    }
    const off = Math.floor(lr() * 4);
    leg.cells.forEach(([x, y], i) => {
      const s = seq[i + off];
      if (!s) return;
      const n = leg.cells[i + 1] || leg.cells[i], p = leg.cells[i - 1] || leg.cells[i];
      const sx = Math.sign(n[0] - p[0]), sy = Math.sign(n[1] - p[1]);
      if (!sx && !sy) return;
      // 진행 방향 (sx, sy)의 왼쪽 = (−sy, sx). 꺾이는 칸(대각)은 두 축 중 하나만
      const lx = sx && sy ? 0 : -sy, ly = sx && sy ? sx : sx;
      tryAdd(x + lx * s, y + ly * s);
    });
  });
  // 띠 구멍(덧댄 칸이 바닥 한 칸을 둘러쌈) — 구멍 곁 덧댄 칸을 뺀다
  const B0 = () => new Set([...band, ...[...core].filter((k) => isMk(...unK(k)))]);
  for (let pass = 0; pass < (keep ? 0 : 8); pass++) {
    const Bs = B0(), xs = [...Bs].map(unK);
    if (!xs.length) break;
    const x0 = Math.min(...xs.map((p) => p[0])) - 1, x1 = Math.max(...xs.map((p) => p[0])) + 1, y0 = Math.min(...xs.map((p) => p[1])) - 1, y1 = Math.max(...xs.map((p) => p[1])) + 1;
    const out = new Set();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!Bs.has(K(x, y))) out.add(K(x, y));
    const seen = new Set();
    let fixed = false;
    for (const k of out) {
      if (seen.has(k)) continue;
      const comp = [k]; seen.add(k);
      for (let i = 0; i < comp.length; i++) { const [cx, cy] = unK(comp[i]); for (const [dx, dy] of D8) { const nk = K(cx + dx, cy + dy); if (out.has(nk) && !seen.has(nk)) { seen.add(nk); comp.push(nk); } } }
      if (comp.some((q) => { const [cx, cy] = unK(q); return cx <= x0 || cx >= x1 || cy <= y0 || cy >= y1; })) continue;
      for (const q of comp) { const [cx, cy] = unK(q); for (const [dx, dy] of D8) { const nk = K(cx + dx, cy + dy); if (band.has(nk) && !coreBand.has(nk)) { band.delete(nk); fixed = true; } } }
    }
    if (!fixed) break;
  }

  // ───────── C 구역 바닥 재적합 ─────────
  const base = zoneSpec(spec.base);
  const zonesAll = Object.assign({}, spec.zones);
  const used = new Set([...Object.keys(spec.zones), ...Object.keys(spec.roads || {}), ...Object.keys(spec.walls), ...".WEGXHTS"]);
  const freeLetters = "pqrstuvwxyzonmlkjih".split("").filter((ch) => !used.has(ch));
  const zonesExtra = {};
  const newZone = (line) => { const ch = freeLetters.shift(); if (!ch) throw new Error(`${id}: v5 패치 구역 글자가 모자람`); zonesExtra[ch] = line; zonesAll[ch] = line; return ch; };
  const tintDiff = (a, b) => { const p = (a || "1/1/1").split("/").map(Number), q = (b || "1/1/1").split("/").map(Number); return Math.max(...p.map((v, i) => Math.abs(v - q[i]))); };
  const artOf = (z) => { const s = zoneSpec(zonesAll[z]); return s.art ? { art: s.art, tint: s.tint || "1/1/1" } : { art: base.art, tint: base.tint }; };
  const distinct = (z) => { if (!z || z === ".") return false; const a = artOf(z); return a.art !== base.art || tintDiff(a.tint, base.tint) >= V.DISTINCT_TINT; };
  const floorCells = [];
  g.each((x, y) => { if (floor(x, y)) floorCells.push([x, y]); });
  const distBand = new Map(), dq = [];
  for (const k of band) { distBand.set(k, 0); dq.push(k); }
  for (let i = 0; i < dq.length; i++) { const [x, y] = unK(dq[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (!distBand.has(nk) && floor(x + dx, y + dy)) { distBand.set(nk, distBand.get(dq[i]) + 1); dq.push(nk); } } }
  const dB = (x, y) => distBand.get(K(x, y)) ?? 99;
  let emptyZone = null, edgeFix = 0;
  if (!keep) {
  for (const [x, y] of floorCells) {
    const c = g.get(x, y);
    c.band = band.has(K(x, y));
    if (isMk(x, y)) continue;
    if (c.band) { c.zone = "."; c.road = null; continue; }
    c.road = null;   // 길 글자는 띠로 대신한다 — 그 칸 구역 글자(장소 바닥)는 그대로
    if (c.zone === ".") c.zone = null;
  }
  const R = V.FILL_RADIUS_OUTDOOR;
  const fill = (limit) => {   // 가까운 구역으로 (띠는 넘지 않는다)
    const q = floorCells.filter(([x, y]) => { const c = g.get(x, y); return !c.band && !isMk(x, y) && c.zone && c.zone !== "."; }).map(([x, y]) => K(x, y));
    for (let i = 0; i < q.length; i++) {
      const [x, y] = unK(q[i]), z = g.get(x, y).zone;
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, c = g.get(nx, ny);
        if (!c || c.wall || c.band || isMk(nx, ny) || c.zone || !limit(nx, ny)) continue;
        c.zone = z; q.push(K(nx, ny));
      }
    }
  };
  fill((x, y) => !outdoor || dB(x, y) <= R);
  // 띠 곁 패치: 띠에서 2~3칸 안이 바탕과 같아 보이는 덩어리 — 그 덩어리가 띠에서 2칸 이상 깊으면(넓은 쪽) 그 액트 바닥 변형으로
  const depthAt = (x, y) => V.PATCH_DEPTH[0] + (hash01(seed + 31, Math.floor(x / 2), Math.floor(y / 2)) < 0.5 ? 0 : V.PATCH_DEPTH[1] - V.PATCH_DEPTH[0]);
  const cand = new Set(floorCells.filter(([x, y]) => { const c = g.get(x, y); return !c.band && !isMk(x, y) && !distinct(c.zone) && dB(x, y) <= depthAt(x, y); }).map(([x, y]) => K(x, y)));
  const patchOf = new Map();
  let patches = 0;
  for (const k of [...cand]) {
    if (!cand.has(k)) continue;
    const comp = [k]; cand.delete(k);
    for (let i = 0; i < comp.length; i++) { const [x, y] = unK(comp[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (cand.has(nk)) { cand.delete(nk); comp.push(nk); } } }
    if (Math.max(...comp.map((q) => dB(...unK(q)))) < 2) continue;   // 벽에 붙은 좁은 쪽은 벽이 경계
    const near = new Set([base.art]);
    for (const q of comp) { const [x, y] = unK(q); for (const [dx, dy] of D8) { const c = g.get(x + dx, y + dy); if (c && !c.wall && c.zone && c.zone !== ".") near.add(artOf(c.zone).art); } }
    const pick = (V.PATCH[act] || V.PATCH[1]).find((l) => !near.has(l.split(" ")[0])) || (V.PATCH[act] || V.PATCH[1])[0];
    if (!patchOf.has(pick)) patchOf.set(pick, newZone(`${pick} 띠 곁 패치`));
    for (const q of comp) g.get(...unK(q)).zone = patchOf.get(pick);
    patches++;
  }
  fill((x, y) => !outdoor || dB(x, y) <= R);
  // 야외: 남은 바탕 칸 중 좁은 통로(벽 2칸 안)는 가까운 구역으로 (띠 밖 통로가 길처럼 보이지 않게), 넓은 빈 마당은 패치 바닥 — D 섬 자리
  const narrow = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!floor(x + dx, y + dy)) return true; return false; };
  fill(narrow);
  // 띠와 벽 사이에 갇힌 주머니(구역에서 띠를 건너야 닿는 칸): 띠를 건너 가장 가까운 구역으로 (실내 전부 · 야외는 좁은 칸만)
  {
    const q = floorCells.filter(([x, y]) => { const c = g.get(x, y); return !c.band && !isMk(x, y) && c.zone && c.zone !== "."; }).map(([x, y]) => [x, y, g.get(x, y).zone]);
    const seen = new Set(q.map(([x, y]) => K(x, y)));
    for (let i = 0; i < q.length; i++) {
      const [x, y, z] = q[i];
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, nk = K(nx, ny), c = g.get(nx, ny);
        if (seen.has(nk) || !c || c.wall) continue;
        seen.add(nk);
        if (!c.band && !isMk(nx, ny) && !c.zone) { if (outdoor && !narrow(nx, ny)) continue; c.zone = z; }
        q.push([nx, ny, z]);
      }
    }
  }
  for (const [x, y] of floorCells) {
    const c = g.get(x, y);
    if (c.band || isMk(x, y) || c.zone) continue;
    if (!emptyZone) { const usedArts = new Set([base.art, ...Object.keys(zonesAll).map((z) => artOf(z).art)]); const list = V.PATCH[act] || V.PATCH[1]; emptyZone = newZone(`${list.find((l) => !usedArts.has(l.split(" ")[0])) || list[list.length - 1]} 빈 마당 패치`); }
    c.zone = emptyZone;
  }
  report.patches = patches;

  // 띠 양옆 구역 나누기 (설계서 v5.dress[구역].sides = { left, right }): 그 장소 칸을 띠 왼쪽·오른쪽 칸에서 함께 퍼뜨려 두 바닥으로 — 띠가 A·B 사이 빈 띠로 읽히게
  (spec.places || []).forEach((p, i) => {
    const sd = ((opt.dress || {})[p.z] || {}).sides;
    if (!sd) return;
    for (const z of [sd.left, sd.right]) if (!(z in zonesAll)) throw new Error(`${id}: v5 sides 구역 「${z}」가 zones에 없음`);
    const own = (x, y) => { const c = g.get(x, y); return c && !c.wall && !c.band && !isMk(x, y) && c.place === i; };
    const q = [], lab = new Map();
    for (const leg of legs) leg.cells.forEach(([x, y], k) => {
      const n = leg.cells[k + 1] || leg.cells[k], pv = leg.cells[k - 1] || leg.cells[k], sx = Math.sign(n[0] - pv[0]), sy = Math.sign(n[1] - pv[1]);
      if (!sx && !sy) return;
      for (const [z, mul] of [[sd.left, 1], [sd.right, -1]]) for (let d = 1; d <= 3; d++) {
        const c2 = [x - sy * mul * d, y + sx * mul * d], kk = K(...c2);
        if (own(...c2)) { if (!lab.has(kk)) { lab.set(kk, z); q.push(c2); } break; }
        if (!band.has(kk)) break;
      }
    });
    for (let j = 0; j < q.length; j++) { const [x, y] = q[j], z = lab.get(K(x, y)); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (!lab.has(nk) && own(x + dx, y + dy)) { lab.set(nk, z); q.push([x + dx, y + dy]); } } }
    for (const [kk, z] of lab) g.get(...unK(kk)).zone = z;
    report.sides = (report.sides || 0) + lab.size;
  });

  // ───────── 경계 직선 >6 고치기 (검사기 straightEdges와 같은 정의로 찾는다) ─────────
  const wallChars = Object.keys(spec.walls);
  const gridRows = () => {
    const rows = [];
    for (let y = g.y1; y >= g.y0; y--) {
      let line = "";
      for (let x = g.x0; x <= g.x1; x++) { const c = g.get(x, y), mk = markerOf.get(K(x, y)); line += mk || (!c ? wallChars[0] : c.wall ? c.ch : c.road || c.zone || "."); }
      rows.push(line);
    }
    return rows;
  };
  const layoutNow = () => ({
    w: g.w, h: g.h, grid: gridRows(), walls: new Set(wallChars), markers: new Set("WEGXHTS".split("")), roads: {},
    zones: Object.fromEntries([[".", { art: null }], ...Object.entries(zonesAll).map(([ch, l]) => [ch, zoneSpec(l)])]), base, pieces: [],
  });
  const at = (c, r) => [c + g.x0, g.y1 - r];   // 격자 (c, r) → 월드 칸
  const stuck = new Set();
  for (let it = 0; it < 400; it++) {
    const L = layoutNow(), G = checker.makeGrid(L);
    // 막다른 띠(골격에서 2칸 떨어진 덧댄 칸) 먼저 — 덧댄 칸이면 빼고 옆 구역으로
    const bmx = checker.bandMetrics(L, G);
    const deadCell = bmx.deadParts.flat().map((k) => { const [c, r] = unK(k); return at(c, r); }).find(([x, y]) => band.has(K(x, y)) && !coreBand.has(K(x, y)));
    if (deadCell) {
      const c = g.get(...deadCell), nz = D4.map(([dx, dy]) => g.get(deadCell[0] + dx, deadCell[1] + dy)).find((n) => n && !n.wall && !n.band && n.zone && n.zone !== ".");
      band.delete(K(...deadCell)); noAdd.add(K(...deadCell)); c.band = false; c.zone = nz ? nz.zone : c.zone === "." ? null : c.zone; edgeFix++; continue;
    }
    const runs = checker.straightEdges(L, G).filter((rn) => !stuck.has(`${rn.tag}|${rn.line}|${rn.from}`));
    if (!runs.length) break;
    const rn = runs[0];
    let done = false;
    for (const dt of [0, 1, -1, 2, -2]) {
      const t = rn.from + Math.floor(rn.len / 2) + dt;
      const kd = Math.max(0, Math.min(rn.len - 2, Math.floor(rn.len / 2) + dt)), dcx = rn.from + (rn.dc || 0) * kd, drx = rn.line + (rn.dr || 0) * kd;   // 45° 계단: 가운데 계단 칸과 그 가로 이웃
      const [a, b] = rn.tag === "d" ? [at(dcx, drx), at(dcx + rn.hx, drx)] : rn.tag === "h" ? [at(t, rn.line), at(t, rn.line + 1)] : [at(rn.line, t), at(rn.line + 1, t)];
      const ca = g.get(...a), cb = g.get(...b);
      if (!ca || !cb || ca.wall || cb.wall) continue;
      if (!ca.band && !cb.band) {
        // 구역 ↔ 구역: 한 칸을 건너편 구역으로 (표식 칸이 아닌 쪽)
        if (!isMk(...a) && cb.zone) { ca.zone = cb.zone; done = true; break; }
        if (!isMk(...b) && ca.zone) { cb.zone = ca.zone; done = true; break; }
        continue;
      }
      const [bc, zc, zp] = ca.band ? [ca, cb, b] : [cb, ca, a], bp = ca.band ? a : b;
      if (!coreBand.has(K(...bp)) && band.has(K(...bp))) { band.delete(K(...bp)); bc.band = false; bc.zone = zc.zone; done = true; break; }   // 덧댄 칸을 뺀다
      if (!isMk(...zp) && tryAdd(...zp)) { zc.band = true; zc.zone = "."; done = true; break; }                                      // 덧댄다
    }
    if (done) edgeFix++;
    else stuck.add(`${rn.tag}|${rn.line}|${rn.from}`);
  }
  if (stuck.size) warn.push(`경계 직선 >6 못 고친 곳 ${stuck.size}`);
  }   // !keep
  report.edgeFix = edgeFix;
  for (const [x, y] of floorCells) g.get(x, y).band = !keep && band.has(K(x, y));

  // ───────── 배치 준비: 비워 둘 칸 (기능 자리 둘레 · 띠와 띠 곁 1칸) ─────────
  g.each((x, y) => { const c = g.get(x, y); if (c && !c.wall) c.keep = false; });
  const keepAround = (px, py, r) => { for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r); y++) for (let x = Math.floor(px - r - 1); x <= Math.ceil(px + r); x++) { const c = g.get(x, y); if (c && !c.wall && Math.hypot(x + 0.5 - px, y + 0.5 - py) <= r) c.keep = true; } };
  for (const f of func) keepAround(f.x, f.y, f.ch === "S" ? 2.8 : f.ch === "B" ? 3.2 : f.ch === "K" ? (f.name === "end" ? 3.0 : 2.2) : 2.6);
  const margin = new Set();
  for (const k of band) { margin.add(k); const [x, y] = unK(k); for (const [dx, dy] of D4) margin.add(K(x + dx, y + dy)); }
  for (const k of core) margin.add(k);
  if (keep) for (const [x, y] of floorCells) if (g.get(x, y).road) margin.add(K(x, y));   // v5-keep: 설계도 길 글자 칸도 비운다
  const occ = new Set(), feet = [], rows = [], hugs = [];   // hugs: 벽에 붙인 그림 (6차 벽감 메우기)
  const free = (cells, place) => cells.every(([cx, cy]) => { const c = g.get(cx, cy); return c && !c.wall && !c.keep && !margin.has(K(cx, cy)) && !occ.has(K(cx, cy)) && !isMk(cx, cy) && (place === undefined || c.place === place); });
  const occupy = (cells, x, y) => { for (const [cx, cy] of cells) { occ.add(K(cx, cy)); occ.add(K(cx - 1, cy)); occ.add(K(cx + 1, cy)); } feet.push([x, y]); };
  // 막는 조각 발밑(빌더와 같은 footprint) — 놓기 전에 들어오는 문에서 모든 바닥이 그대로 이어지는지 본다 (갇힌 바닥·막힌 화로 0)
  const blocked = new Set();
  const floorN = floorCells.length;
  const startCell = cellOfF(startF);
  //   (6차) noNiche: 막은 칸 곁에 폭 ≤2칸 막다른 벽감(가로 빈칸 ≤2 · 위가 벽·막힘 또는 벽감)이 생기면 거절 — 벽 밀착 줄은 끝을 넓혀 메우므로 끈다
  const makesNiche = (add) => {
    const A = new Set(add), fr = (x, y) => floor(x, y) && !blocked.has(K(x, y)) && !A.has(K(x, y)) && !isMk(x, y);
    const hr = (x, y) => { let n = 1; for (let k = 1; k <= 3 && fr(x - k, y); k++) n++; for (let k = 1; k <= 3 && fr(x + k, y); k++) n++; return n; };
    const xs = add.map((k) => unK(k)[0]), ys = add.map((k) => unK(k)[1]), x0 = Math.min(...xs) - 3, x1 = Math.max(...xs) + 3, y0 = Math.min(...ys) - 4, y1 = Math.max(...ys) + 4;
    const ni = new Set();
    for (let y = y1 + 3; y >= y0; y--) for (let x = x0; x <= x1; x++) if (fr(x, y) && hr(x, y) <= 2 && (!fr(x, y + 1) || ni.has(K(x, y + 1)))) ni.add(K(x, y));
    for (const k of ni) { const [x, y] = unK(k); if (A.has(K(x - 1, y)) || A.has(K(x + 1, y))) return true; }
    return false;
  };
  const canBlock = (cells, noNiche = true) => {
    const add = cells.map(([a, b]) => K(a, b)).filter((k) => !blocked.has(k) && floor(...unK(k)));
    if (!add.length) return true;
    if (noNiche && makesNiche(add)) return false;
    const nb = new Set([...blocked, ...add]), seen = new Set([K(...startCell)]), q = [K(...startCell)];
    for (let i = 0; i < q.length; i++) { const [x, y] = unK(q[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (!seen.has(nk) && !nb.has(nk) && floor(x + dx, y + dy)) { seen.add(nk); q.push(nk); } } }
    let total = 0; for (const [x, y] of floorCells) if (!nb.has(K(x, y))) total++;
    return seen.size === total;
  };
  // 막으면 골격 칸의 가로·세로 빈칸 수 최솟값이 2 밑으로 내려가는가 (벽만으로는 2 이상이었는데) — 검사기 passWidth와 같은 정의
  const narrows = (cells) => {
    const add = new Set(cells.map(([a2, b2]) => K(a2, b2)));
    if (!add.size) return false;
    const xs = cells.map((c2) => c2[0]), ys = cells.map((c2) => c2[1]), bx0 = Math.min(...xs) - 4, bx1 = Math.max(...xs) + 4, by0 = Math.min(...ys) - 4, by1 = Math.max(...ys) + 4;
    const fr = (x, y, w) => floor(x, y) && (w || (!blocked.has(K(x, y)) && !add.has(K(x, y))));
    const run = (x, y, dx, dy, w) => { if (!fr(x, y, w)) return 0; let n = 1; for (let k = 1; k < 9 && fr(x + dx * k, y + dy * k, w); k++) n++; for (let k = 1; k < 9 && fr(x - dx * k, y - dy * k, w); k++) n++; return n; };
    for (const k of core) { const [x, y] = unK(k); if (x < bx0 || x > bx1 || y < by0 || y > by1) continue; if (Math.min(run(x, y, 1, 0, true), run(x, y, 0, 1, true)) >= 2 && Math.min(run(x, y, 1, 0, false), run(x, y, 0, 1, false)) < 2) return true; }
    return false;
  };
  const doBlock = (cells) => { for (const [a, b] of cells) if (floor(a, b)) blocked.add(K(a, b)); };
  // 7차: 그 칸들을 더 막으면 폭 1칸 막다른 줄(검사기 deadLines와 같은 정의) 수 — 세트 묶음 자리 고르기에 쓴다 (세트 줄에는 fill= 막음을 붙이지 않는다)
  const deadCount = (extra) => { const E = new Set(extra.map(([a, b]) => K(a, b))); return checker.deadLines(floorCells.map(([x, y]) => K(x, y)), (k) => floor(...unK(k)) && !blocked.has(k) && !E.has(k), (k) => floor(...unK(k)), (k) => floor(...unK(k)) && (blocked.has(k) || E.has(k)), (k) => isMk(...unK(k)) || band.has(k) || core.has(k)).length; };
  const blockCellsSet = (name, x, y, m, sc) => setPieces(name).filter((pc) => !pc.piece.startsWith("d:") && (pc.collide === "block" || blockOf(pc.piece))).flatMap((pc) => fc(pc.piece, x + num(pc.dx) * m, y + num(pc.dy), num(pc.scale, 1) * num(sc, 1)));
  const blockCellsProp = (name, x, y) => (blockOf(name) ? fc(name, x, y, 1) : []);
  const funcSpots = () => func.map((f) => [f.x, f.y]);
  const nearFunc = (x, y, rx = 2.2, ry = 1.4) => funcSpots().some(([fx, fy]) => Math.abs(fx - x) < rx && Math.abs(fy - y) < ry);
  const count = new Map();   // 그림별 놓인 수 (막는·서 있는 것 — 산발 복제 상한)
  const counted = (name) => ["prop", "feature"].includes(roles.roleOf(name)) && !/decal/.test(name);   // 반복 구조(열·쌍)는 축이 있어 상한 밖
  const bump = (name, n = 1) => { if (counted(name)) count.set(name, (count.get(name) || 0) + n); };
  const setNames = (name) => setPieces(name).filter((pc) => !pc.piece.startsWith("d:")).map((pc) => pc.piece);
  // 그림이 발밑에서 위로 그려지는 자리(폭 70% × 높이 80%)가 띠·출입구·웨이포인트를 덮지 않는가 — 큰 특징·세트만 (기둥 열은 띠 남쪽이면 끝이 살짝 겹친다)
  const lib = require("./lib.cjs");
  const visualClear = (name, x, y, mul) => {
    if (/decal/.test(name)) return true;
    const sp = table[name], sc = lib.baseScale(sp, ctx.propScale) * num(mul, 1) * roles.multOf(name), wc = (num(sp.w, 128) * sc) / 100, hc = (num(sp.h, 128) * sc) / 100;
    for (let cy = Math.floor(y); cy <= Math.floor(y + hc * 0.8); cy++) for (let cx = Math.floor(x - wc * 0.35); cx <= Math.floor(x + wc * 0.35); cx++) { if (band.has(K(cx, cy))) return false; const mk = markerOf.get(K(cx, cy)); if (mk && "WEGXHS".includes(mk)) return false; }
    return true;
  };
  // 놓은 키 큰 그림이 화면에서 차지하는 자리 (화로를 그 몸통 위에 두지 않게 — 10-31 거인 몸통에 겹친 Torch5)
  const vboxes = [];
  const addVbox = (name, x, y, mul) => { if (/decal/.test(name)) return; const sp = table[name], sc = lib.baseScale(sp, ctx.propScale) * num(mul, 1) * roles.multOf(name), wc = (num(sp.w, 128) * sc) / 100, hc = (num(sp.h, 128) * sc) / 100; if (hc >= 1.2) vboxes.push([x - wc * 0.5 - 0.6, y - 0.6, x + wc * 0.5 + 0.6, y + hc + 0.4]); };   // 그림 폭·높이 + 화로 그림 반 폭
  const inVbox = (px, py) => vboxes.some(([a, b, c2, d]) => px >= a && px <= c2 && py >= b && py <= d);
  const setVisual = (sn, x, y, m) => setPieces(sn).every((pc) => visualClear(pc.piece.replace(/^d:/, ""), x + num(pc.dx) * m, y + num(pc.dy), num(pc.scale, 1)));
  // 정면 방향 (역할표 facing · 검사기 facing과 같은 규칙): north 그림은 북쪽 벽이 3칸 안이거나 아무 벽도 2칸 안에 없을 때만 · side는 동·서 벽
  const facingOk = (name, x, y) => {
    const fa = roles.facingOf(name);
    if (fa === "any") return true;
    const cx = Math.floor(x), cy = Math.floor(y), dist = {};
    for (const [d, dx, dy] of [["n", 0, 1], ["s", 0, -1], ["e", 1, 0], ["w", -1, 0]]) { dist[d] = 9; for (let k = 1; k <= 3; k++) if (!floor(cx + dx * k, cy + dy * k)) { dist[d] = k; break; } }
    const want = fa === "north" ? ["n"] : ["e", "w"];
    return want.some((d) => dist[d] <= 3) || Math.min(...Object.values(dist)) > 2;
  };
  const featBlocks = new Set();
  const blockKey = (x, y) => `${Math.floor((Math.floor(x) - g.x0) / 16)},${Math.floor((g.y1 - Math.floor(y)) / 16)}`;   // 검사기 16×16 구역 (격자 c//16, r//16)
  const featPieces = (kind, name, x, y, m) => (kind === "set" ? setPieces(name).filter((pc) => !pc.piece.startsWith("d:") && roles.roleOf(pc.piece) === "feature").map((pc) => [x + num(pc.dx) * m, y + num(pc.dy)]) : roles.roleOf(name) === "feature" ? [[x, y]] : []);
  const pushRow = (kind, name, x, y, o = {}) => rows.push({ kind, name, x: r2(x), y: r2(y), scale: o.scale || "", flip: o.flip ? 1 : "", args: o.args || "", note: o.note || "" });
  // 손으로 고른 자리 먼저
  for (const pu of puts) {
    const [kind, name, x, y, sc, flip] = pu;
    if (kind === "set") { occupy(setCells(name, x, y, flip ? -1 : 1, sc || 1), x, y); doBlock(blockCellsSet(name, x, y, flip ? -1 : 1, sc || 1)); for (const n of setNames(name)) bump(n); }
    else if (kind === "prop") { occupy(fc(name, x, y, sc || 1), x, y); if (blockOf(name)) doBlock(fc(name, x, y, sc || 1)); bump(name); }
    for (const [fx, fy] of featPieces(kind, name, x, y, flip ? -1 : 1)) featBlocks.add(blockKey(fx, fy));
    rows.push({ kind, name, x, y, scale: sc || "", flip: flip ? 1 : "", args: pu[6] || "", note: "손으로 고른 자리" });
  }

  // ───────── D 내부 경계 섬 (야외) ─────────
  report.islands = 0;
  if (outdoor && emptyZone) {
    const zoneCells = floorCells.filter(([x, y]) => { const c = g.get(x, y); return !c.band && c.zone && c.zone !== emptyZone && c.zone !== "."; }).map(([x, y]) => K(x, y));
    const dz = new Map(zoneCells.map((k) => [k, 0])), q = [...zoneCells];
    for (let i = 0; i < q.length; i++) { const [x, y] = unK(q[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (!dz.has(nk) && floor(x + dx, y + dy)) { dz.set(nk, dz.get(q[i]) + 1); q.push(nk); } } }
    const far = new Set(floorCells.filter(([x, y]) => g.get(x, y).zone === emptyZone && (dz.get(K(x, y)) ?? 99) > V.ISLAND_FAR).map(([x, y]) => K(x, y)));
    const wallPiece = V.ISLAND_WALL[act] || V.ISLAND_WALL[1];
    for (const k of [...far]) {
      if (!far.has(k)) continue;
      const comp = [k]; far.delete(k);
      for (let i = 0; i < comp.length; i++) { const [x, y] = unK(comp[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (far.has(nk)) { far.delete(nk); comp.push(nk); } } }
      if (comp.length < V.ISLAND_MIN) continue;
      const want = comp.length >= 90 ? 2 : 1, cs = new Set(comp);
      const depth = (kk) => { const [x, y] = unK(kk); let d = 0; while (d < 8 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => cs.has(K(x + dx * (d + 1), y + dy * (d + 1))))) d++; return d; };
      const xs = comp.map(unK), wide = Math.max(...xs.map((p) => p[0])) - Math.min(...xs.map((p) => p[0])) >= Math.max(...xs.map((p) => p[1])) - Math.min(...xs.map((p) => p[1]));
      const order = comp.slice().sort((a, b) => depth(b) - depth(a) || (a < b ? -1 : 1));
      const sp = table[wallPiece], step = r2(Math.max(1.0, (num(sp.w, 128) * require("./lib.cjs").baseScale(sp, ctx.propScale) * roles.multOf(wallPiece)) / 100 * 0.62));
      const n = V.ISLAND_LEN[0] + Math.floor(rand() * (V.ISLAND_LEN[1] - V.ISLAND_LEN[0] + 1));
      let made = 0;
      for (const kk of order) {
        if (made >= want) break;
        const [cx, cy] = unK(kk);
        if (feet.some(([fx, fy]) => Math.hypot(fx - cx, fy - cy) < 7)) continue;
        const spots = [];
        for (let i = 0; i < n; i++) { const t = (i - (n - 1) / 2) * step; spots.push(wide ? [cx + 0.5 + t, cy + 0.4] : [cx + 0.5, cy + 0.4 + t * 0.8]); }
        const cells = spots.map(([x, y]) => fc(wallPiece, x, y, 1));
        const tent = new Set();
        if (!cells.every((cl) => free(cl) && cl.every(([a, b]) => !tent.has(K(a, b)) && (tent.add(K(a, b)), true)))) continue;
        if (blockOf(wallPiece) && !canBlock(cells.flat())) continue;
        if (blockOf(wallPiece)) doBlock(cells.flat());
        spots.forEach(([x, y], i) => { occupy(cells[i], x, y); bump(wallPiece); pushRow("prop", wallPiece, x, y, { note: "빈 마당 · v5 내부 경계 섬" }); });
        made++;
      }
      report.islands += made;
      if (made < want) warn.push(`섬: 빈 마당 ${comp.length}칸에 ${want}개 중 ${made}개`);
    }
  }

  // ───────── E 공간·기능 ─────────
  const places = spec.places || [];
  const pOwner = new Map(), pq = [];
  for (const [x, y] of floorCells) { const c = g.get(x, y); if (c.place >= 0) { pOwner.set(K(x, y), c.place); pq.push(K(x, y)); } }
  for (let i = 0; i < pq.length; i++) { const [x, y] = unK(pq[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (!pOwner.has(nk) && floor(x + dx, y + dy)) { pOwner.set(nk, pOwner.get(pq[i])); pq.push(nk); } } }
  const ownerOfF = (f) => pOwner.get(K(...cellOfF(f)));
  const coreOrder = legs.flatMap((l) => l.cells);
  const S = places.map((p, i) => {
    const cells = floorCells.filter(([x, y]) => g.get(x, y).place === i && !band.has(K(x, y)));
    const n = Math.max(1, cells.length), cx = cells.reduce((a, c) => a + c[0] + 0.5, 0) / n, cy = cells.reduce((a, c) => a + c[1] + 0.5, 0) / n;
    const onBand = coreOrder.filter((c) => pOwner.get(K(...c)) === i);
    const has = (ch, pred) => func.some((f) => f.ch === ch && (!pred || pred(f)) && ownerOfF(f) === i);
    let fn = null;
    if (has("W") || has("G")) fn = "입구 마당";
    else if (has("B")) fn = "보스 아레나";
    else if (has("E")) fn = "출구 관문";
    else if (has("H")) fn = "보물·곁길";
    else if (has("S")) fn = "랜드마크 마당";
    else for (const [f, words] of KW) if (words.some((w) => p.name.includes(w))) { fn = f; break; }
    if (!fn) fn = onBand.length ? "몬스터 캠프" : "보물·곁길";
    const inPlace = coreOrder.filter((c) => g.get(...c).place === i), entry = inPlace[0] || onBand[0] || null;   // 장소 칸 안에서 띠가 처음 닿는 칸 (없으면 그 장소 몫 띠)
    return { i, p, cells, area: cells.length, c: [cx, cy], R: Math.sqrt(n / Math.PI), fn, onBand, inPlace, entry, feature: null, notes: [] };
  });
  // 설계서 꾸밈 → v5 계획 (설계서 v5.dress[구역]가 있으면 그것, 없으면 dress를 역할표로 나눈다)
  const firstOfZone = new Set();
  const planOf = (s) => {
    const z = s.p.z, d = (spec.dress || {})[z] || {}, o = (opt.dress || {})[z];
    const first = !firstOfZone.has(z); firstOfZone.add(z);
    const plan = { feature: null, colonnade: null, row: null, ring: null, pair: null, sets: [], props: [], floorProps: [], decals: d.decals || [], dn: d.dn || 0 };
    if (o) {
      Object.assign(plan, { sets: o.sets || [], props: o.props || [], decals: o.decals || plan.decals, dn: o.dn ?? plan.dn, clusters: o.clusters });
      if (first && o.feature) { const [kind, name] = o.feature.split(":"); plan.feature = { kind, name, at: o.featureAt, flip: o.featureFlip, scale: o.featureScale, drop: o.featureDrop || [] }; }
      for (const k of ["colonnade", "row", "ring", "pair"]) if (o[k]) plan[k] = typeof o[k] === "string" ? { name: o[k] } : o[k];
      plan.floorProps = o.floorProps || [];
      return plan;
    }
    for (const sn of d.sets || []) {
      const anchor = setPieces(sn).find((pc) => !pc.piece.startsWith("d:"));
      if (first && !plan.feature && anchor && roles.roleOf(anchor.piece) === "feature") plan.feature = { kind: "set", name: sn };
      else plan.sets.push(sn);
    }
    const pillarOk = V.PILLAR_FUNCS.includes(s.fn);
    for (const pn of d.props || []) {
      const role = roles.roleOf(pn), rule = roles.repeatOf(pn);
      if (role === "feature") { if (first && !plan.feature) plan.feature = { kind: "prop", name: pn }; continue; }
      if (role === "floor") { plan.floorProps.push(pn); continue; }
      if (role === "prop") { plan.props.push(pn); continue; }
      if (role !== "structure" || rule === "single") continue;
      if (roles.isPillar(pn)) { if (pillarOk && !plan.colonnade) plan.colonnade = { name: pn }; else s.notes.push(`기둥류 ${pn} 뺌(${s.fn})`); continue; }
      if (rule === "ring") { if (!plan.ring) plan.ring = { name: pn }; continue; }
      if (rule === "pair") { if (!plan.pair) plan.pair = { name: pn }; continue; }
      if (!plan.row) plan.row = { name: pn };
    }
    return plan;
  };
  for (const s of S) s.plan = planOf(s);
  // puts에 이미 특징이 있는 공간
  for (const r of rows) for (const [fx, fy] of featPieces(r.kind, r.name, num(r.x), num(r.y), num(r.flip) === 1 ? -1 : 1)) {
    const i = pOwner.get(K(Math.floor(fx), Math.floor(fy)));
    if (i !== undefined) { const zz = places[i].z; for (const s of S) if (s.p.z === zz) s.hasFeature = true; }
  }

  // 특징: 공간당 1 · 골격이 들어온 쪽 반대 끝(공간 가운데에서 반지름 0.35만큼) · 16×16 구역당 1
  const tentOk = (cells, tent) => cells.every(([a, b]) => !tent.has(K(a, b)));
  const tentAdd = (cells, tent) => { for (const [a, b] of cells) { tent.add(K(a, b)); tent.add(K(a - 1, b)); tent.add(K(a + 1, b)); } };
  // 세트 = 조각 무리. 같은 소품 그림 상한을 넘는 조각과 세트 안 낱개 기둥(같은 기둥이 세트에 하나뿐)만 빼고 나머지(특징 조각 포함)는 남긴다 —
  //   뺀 조각이 있으면 세트 줄 대신 조각마다 줄로 적는다 (빌더 세트 조각 규칙과 같은 자리·배율·뒤집기)
  const groupOf = (kind, name) => (kind === "set" ? setPieces(name).map((pc) => ({ name: pc.piece.replace(/^d:/, ""), decal: pc.piece.startsWith("d:"), dx: num(pc.dx), dy: num(pc.dy), sc: num(pc.scale, 1), flip: num(pc.flip) === 1, collide: pc.collide === "block" || (!pc.piece.startsWith("d:") && blockOf(pc.piece)) ? "block" : "pass" }))
    : [{ name, decal: /decal/.test(name), dx: 0, dy: 0, sc: 1, flip: false, collide: blockOf(name) ? "block" : "pass" }]);
  const trimGroup = (grp) => {
    const tally = new Map(), used = new Map(), out = [], dropped = [];
    for (const p of grp) if (!p.decal) tally.set(p.name, (tally.get(p.name) || 0) + 1);
    for (const p of grp) {
      if (p.decal || roles.roleOf(p.name) === "feature") { out.push(p); continue; }
      if (grp.length > 1 && roles.isPillar(p.name) && tally.get(p.name) === 1) { dropped.push(`${p.name}(낱개 기둥)`); continue; }
      if (counted(p.name)) { const k = (count.get(p.name) || 0) + (used.get(p.name) || 0); if (k >= V.SPRITE_MAX) { dropped.push(`${p.name}(상한)`); continue; } used.set(p.name, (used.get(p.name) || 0) + 1); }
      out.push(p);
    }
    return { out, dropped };
  };
  const pOpt = (p) => ({ frac: p.frac, toWall: p.toWall });
  const gCells = (grp, x, y, m) => grp.filter((p) => !p.decal).flatMap((p) => fc(p.name, x + p.dx * m, y + p.dy, p.sc, pOpt(p)));
  const gBlock = (grp, x, y, m) => grp.filter((p) => !p.decal && p.collide === "block").flatMap((p) => fc(p.name, x + p.dx * m, y + p.dy, p.sc, pOpt(p)));
  const pArgs = (p) => [p.frac ? `foot=${p.frac}` : "", p.toWall ? "wall=1" : ""].filter(Boolean).join(";");
  const gVisual = (grp, x, y, m) => grp.every((p) => visualClear(p.name, x + p.dx * m, y + p.dy, p.sc));
  const gFeat = (grp, x, y, m) => grp.filter((p) => !p.decal && roles.roleOf(p.name) === "feature").map((p) => [x + p.dx * m, y + p.dy]);
  const gCommit = (kind, name, grp, whole, x, y, m, note) => {
    occupy(gCells(grp, x, y, m), x, y); doBlock(gBlock(grp, x, y, m));
    for (const p of grp) if (!p.decal) { bump(p.name); addVbox(p.name, x + p.dx * m, y + p.dy, p.sc); }
    if (whole) { const fp = grp.find((p) => !p.decal && (p.frac || p.toWall)); pushRow(kind, name, x, y, { flip: m < 0, note, args: fp ? pArgs(fp) : "" }); if (kind === "prop" && blockOf(name)) { const p0 = grp.find((p) => !p.decal); hugs.push({ row: rows[rows.length - 1], name, x, y, sc: p0.sc, toWall: !!p0.toWall, frac: p0.frac, cells: fc(name, x, y, p0.sc, pOpt(p0)).map(([a, b]) => K(a, b)) }); } return; }
    for (const p of grp) { pushRow(p.decal ? "decal" : "prop", p.name, x + p.dx * m, y + p.dy, { scale: p.sc !== 1 ? p.sc : "", flip: p.flip !== (m < 0), note: `${note} · ${name} 조각`, args: p.decal ? "" : pArgs(p) }); if (!p.decal && (p.collide === "block")) hugs.push({ row: rows[rows.length - 1], name: p.name, x: x + p.dx * m, y: y + p.dy, sc: p.sc, toWall: !!p.toWall, frac: p.frac, cells: fc(p.name, x + p.dx * m, y + p.dy, p.sc, pOpt(p)).map(([a, b]) => K(a, b)) }); }
  };
  // 특징은 벽 따라 열 다음에 놓는다 (작은 방에서 특징이 벽면을 먼저 차지해 열이 들어가지 못했다)
  function placeFeatures() { for (const s of S) {
    const f = s.plan.feature;
    if (!f || s.hasFeature) continue;
    const trimmed = trimGroup(groupOf(f.kind, f.name)), grp = trimmed.out.filter((p) => !(f.drop || []).includes(p.name)), dropped = trimmed.dropped.concat((f.drop || []).filter((n) => trimmed.out.some((p) => p.name === n)).map((n) => `${n}(설계서)`));   // featureDrop: 설계서가 뺀 세트 조각
    if (f.scale) for (const p of grp) p.sc *= f.scale;   // 설계서 featureScale: 역할 기준 크기에 곱 (성소 제단 3칸 → 4칸)
    if (dropped.length) s.notes.push(`특징 ${f.name}에서 뺀 조각: ${dropped.join(", ")}`);
    let T = s.c;
    if (s.entry) { const e = [s.entry[0] + 0.5, s.entry[1] + 0.5], dx = s.c[0] - e[0], dy = s.c[1] - e[1], L = Math.hypot(dx, dy) || 1; T = [s.c[0] + (dx / L) * 0.35 * s.R, s.c[1] + (dy / L) * 0.35 * s.R]; }
    const st = s.plan.colonnade && !f.at ? stretchOf(s, Object.assign({}, V.COLONNADE, s.plan.colonnade)) : null;
    if (st) { const L = Math.hypot(st.Q[0] - st.P[0], st.Q[1] - st.P[1]) || 1; T = [st.Q[0] + ((st.Q[0] - st.P[0]) / L) * 3, st.Q[1] + ((st.Q[1] - st.P[1]) / L) * 3]; }   // 열주 끝 시선이 모이는 자리
    const pool = s.cells.map(([x, y]) => [x + 0.5, y + 0.3]);
    if (f.at) { T = f.at; pool.unshift([f.at[0], f.at[1]]); }
    pool.sort((a, b) => (f.at && a[0] === f.at[0] && a[1] === f.at[1] ? -1 : 0) || Math.hypot(a[0] - T[0], a[1] - T[1]) - Math.hypot(b[0] - T[0], b[1] - T[1]));
    // 5차: 벽 정면(facing north) 한 장 특징은 북벽이 3칸 안이면 벽에 붙이고(윗면 = 벽 밑선) 뒤 칸을 벽까지 막는다 ·
    //   열린 바닥 특징은 막힘 높이 2/3 (골격 너비가 2칸 밑으로 좁아지면 1/2)
    const hugOne = grp.filter((p) => !p.decal).length === 1 && roles.facingOf(grp.find((p) => !p.decal).name) === "north";
    let best = null;
    for (const [sx0, sy0] of pool) {
      let sy = sy0;
      let sx = sx0;
      const nwl = hugOne ? northWall(sx, sy0) : null;
      for (const p of grp) { p.toWall = false; p.frac = undefined; }
      if (nwl !== null) { const p = grp.find((q) => !q.decal); sy = hugY(p.name, nwl, p.sc) - p.dy; p.toWall = true; }
      // 7차: 모서리 — 발밑 줄 끝과 옆벽 사이가 1~2칸이면 x도 그 벽에 붙인다 (서고 책장 탑: 북·서 두 벽에 밀착 · 옆벽까지 막음은 lib.cjs footprintRole)
      if (nwl !== null) {
        const p = grp.find((q) => !q.decal), fy = Math.floor(sy + p.dy), bc = fc(p.name, sx + p.dx, sy + p.dy, p.sc).filter(([, b]) => b === fy).map(([a]) => a);
        const gap = (e, d) => { for (let k = 1; k <= 3; k++) if (!floor(e + d * k, fy)) return k - 1; return 9; };
        const gl = gap(Math.min(...bc), -1), gr = gap(Math.max(...bc), 1);
        if (gl >= 1 && gl <= 2 && gl <= gr) sx -= gl; else if (gr >= 1 && gr <= 2) sx += gr;
      }
      else for (const p of grp) if (!p.decal && roles.roleOf(p.name) === "feature") p.frac = 0.67;
      for (const m of f.flip ? [-1, 1] : [1, -1]) {
        if (grp.some((p) => p.frac) && narrows(gBlock(grp, sx, sy, m))) for (const p of grp) if (p.frac) p.frac = 0.5;
        // featureAt(설계서가 자리를 정함)은 기능 자리 둘레 비움과 겹쳐도 된다 (보스 바로 뒤 제단) — 띠·띠 곁·놓인 것·표식만 피한다
        const fcells = gCells(grp, sx, sy, m), atOk = f.at && fcells.every(([cx, cy]) => { const c = g.get(cx, cy); return c && !c.wall && !margin.has(K(cx, cy)) && !occ.has(K(cx, cy)) && !isMk(cx, cy); });
        if (!(atOk || free(fcells)) || (!f.at && nearFunc(sx, sy, 3.5, 4.2)) || !gVisual(grp, sx, sy, m) || !grp.every((p) => p.decal || facingOk(p.name, sx + p.dx * m, sy + p.dy))) continue;   // 특징은 포털·입구 그림 앞을 가리지 않게 위아래로 더 비운다
        const fp = gFeat(grp, sx, sy, m);
        if (fp.some(([a, b]) => featBlocks.has(blockKey(a, b)))) continue;
        if (!canBlock(gBlock(grp, sx, sy, m), !grp.some((p) => p.toWall))) continue;   // 7차: 벽 밀착 특징은 벽감을 아래 메우기(padl·padr)로 막는다
        best = { sx, sy, m, fp, opts: grp.map((p) => [p.frac, p.toWall]) }; break;
      }
      if (best) break;
    }
    if (best) grp.forEach((p, i) => { [p.frac, p.toWall] = best.opts[i]; });
    if (!best) { warn.push(`특징 ${f.name}: ${s.p.name}에 자리 없음`); continue; }
    gCommit(f.kind, f.name, grp, !dropped.length && !f.scale, best.sx, best.sy, best.m, `${s.p.name} · v5 특징`);
    for (const [a, b] of best.fp) featBlocks.add(blockKey(a, b));
    s.feature = [best.sx, best.sy];
  } }
  // 반복 구조
  const commit = (s, name, spots, tag) => {
    const bc = blockOf(name) ? spots.flatMap((sp) => sp.cells) : [];   // 자리마다 계산한 발밑 칸 그대로 (벽 정면 열은 벽까지)
    if (!canBlock(bc, !spots.some((sp) => sp.args && sp.args.includes("wall=1")))) { s.notes.push(`${tag} ${name}: 바닥을 가둬(또는 벽감) 뺌`); return; }
    doBlock(bc);
    for (const sp of spots) addVbox(name, sp.q[0], sp.q[1], 1);
    for (const sp of spots) { occupy(sp.cells, sp.q[0], sp.q[1]); bump(name); pushRow("prop", name, sp.q[0], sp.q[1], { flip: sp.flip, note: `${s.p.name} · v5 ${tag}`, args: sp.args || "" }); if (blockOf(name)) hugs.push({ row: rows[rows.length - 1], name, x: sp.q[0], y: sp.q[1], toWall: !!(sp.args && sp.args.includes("wall=1")), cells: sp.cells.map(([a, b]) => K(a, b)) }); } s.notes.push(`${tag} ${name}×${spots.length}`); };
  // 공간 안 곧은 띠 구간 (열주 축) — P = 띠가 들어오는 쪽, Q = 먼 쪽
  function stretchOf(s, C) {
    const runs = [];
    let cur = [];
    for (const c of coreOrder) { if (pOwner.get(K(...c)) === s.i) cur.push(c); else { if (cur.length) runs.push(cur); cur = []; } }
    if (cur.length) runs.push(cur);
    let best = null;
    for (const rn of runs) for (let a = 0; a < rn.length; a++) for (let b = rn.length - 1; b - a + 1 >= C.minLen; b--) {
      if (best && b - a <= best.b - best.a) break;
      const P = [rn[a][0] + 0.5, rn[a][1] + 0.5], Q = [rn[b][0] + 0.5, rn[b][1] + 0.5], L = Math.hypot(Q[0] - P[0], Q[1] - P[1]) || 1;
      let dev = 0;
      for (let k = a; k <= b; k++) dev = Math.max(dev, Math.abs((Q[0] - P[0]) * (rn[k][1] + 0.5 - P[1]) - (Q[1] - P[1]) * (rn[k][0] + 0.5 - P[0])) / L);
      if (dev <= C.straight) { best = { rn, a, b, P, Q }; break; }
    }
    if (!best) return null;
    let { P, Q } = best;
    const ref = s.feature || null, ent = s.entry ? [s.entry[0] + 0.5, s.entry[1] + 0.5] : null;
    if (ref ? Math.hypot(P[0] - ref[0], P[1] - ref[1]) < Math.hypot(Q[0] - ref[0], Q[1] - ref[1]) : ent && Math.hypot(Q[0] - ent[0], Q[1] - ent[1]) < Math.hypot(P[0] - ent[0], P[1] - ent[1])) [P, Q] = [Q, P];
    return { P, Q };
  }
  const colonnade = (s, cfg) => {
    // axis(설계서): 띠가 아니라 정한 축 [[x, y], [x, y]]을 따라 (성소: 띠는 제단 앞에서 출구로 꺾여도 열주는 문→제단 축 끝까지)
    const C = Object.assign({}, V.COLONNADE, cfg), st = C.axis ? { P: C.axis[0], Q: C.axis[1] } : stretchOf(s, C);
    if (!st) { s.notes.push(`열주 ${C.name}: 곧은 띠 구간 없음`); return; }
    const { P, Q } = st;
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]), u = [(Q[0] - P[0]) / L, (Q[1] - P[1]) / L], nrm = [-u[1], u[0]];
    // 기둥은 발밑에서 위로 그려진다 — 두 열의 「보이는 가운데」가 띠를 사이에 두고 대칭이 되게 두 발을 모두 그림 높이 절반(80%)만큼 내린다.
    //   간격(off)은 C.off부터 0.6칸씩 넓혀 보고 쌍이 가장 많이 들어가는 값
    const sp = table[C.name], hv = ((num(sp.h, 128) * lib.baseScale(sp, ctx.propScale) * roles.multOf(C.name)) / 100) * 0.8;
    let pairs = [];
    // tight(설계서): 두 열을 띠 바로 곁에 — 띠 곁 1칸 비움(margin) 대신 띠 칸만 피한다 (성소 3차: 기본 줌 세로 7.2칸에 두 열이 함께 보이게 간격 5칸 안팎)
    const okCells = (cells) => (C.tight ? cells.every(([cx, cy]) => { const c = g.get(cx, cy); return c && !c.wall && !band.has(K(cx, cy)) && !core.has(K(cx, cy)) && !occ.has(K(cx, cy)) && !isMk(cx, cy); }) : free(cells));
    for (const off of C.tight ? [C.off, C.off + 0.3, C.off + 0.6] : [C.off, C.off + 0.6, C.off + 1.2, C.off + 1.8]) {
      const got = [], tent = new Set();
      for (let t = 1.5; t <= L - 0.5 + 1e-6; t += C.step) {
        const p = [P[0] + u[0] * t, P[1] + u[1] * t];
        if (s.feature && Math.hypot(p[0] - s.feature[0], p[1] - s.feature[1]) < 3.2) continue;
        const both = [1, -1].map((sd) => { const q = [r2(p[0] + nrm[0] * off * sd), r2(p[1] + nrm[1] * off * sd - hv / 2)]; return { q, cells: fc(C.name, q[0], q[1], 1), flip: sd < 0 }; });
        if (both.every((bq) => okCells(bq.cells) && tentOk(bq.cells, tent) && !(C.tight ? nearFunc(bq.q[0], bq.q[1], 1.8, 1.8) : nearFunc(bq.q[0], bq.q[1])))) { both.forEach((bq) => tentAdd(bq.cells, tent)); got.push(...both); }
      }
      if (got.length > pairs.length) pairs = got;   // 쌍이 가장 많은 간격 (같으면 좁은 쪽)
    }
    if (pairs.length / 2 < C.minPairs) { s.notes.push(`열주 ${C.name}: ${pairs.length / 2}쌍뿐 — 뺌 (곧은 띠 ${P.map(r2)}→${Q.map(r2)})`); return; }
    commit(s, C.name, pairs, "열주");
  };
  const wallRow = (s, cfg) => {
    const C = Object.assign({}, V.ROW, cfg), sides = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] }, cand = [];
    // facing(역할표): 정면 그림(north)은 위(북)벽에만 · 옆 그림(side)은 동·서 벽에만 · any는 어디든
    const facing = roles.facingOf(C.name), allowed = facing === "north" ? ["n"] : facing === "side" ? ["e", "w"] : ["n", "s", "e", "w"];
    // contiguous: 그림 폭만큼 붙여 빈틈 없이 (책장 등) — 아니면 C.step 일정 간격. 어느 쪽이든 한 줄 안 간격은 하나 (중간이 막히면 거기서 끊고 가장 긴 연속 구간만)
    const spw = table[C.name], wcell = (num(spw.w, 128) * require("./lib.cjs").baseScale(spw, ctx.propScale) * roles.multOf(C.name)) / 100, step = C.contiguous ? (cfg.step || Math.round(wcell * 0.98 * 100) / 100) : C.step;   // contiguous + step: 그림의 불투명 폭(투명 여백 뺀 폭)을 설계서가 준다
    for (const [sd, [dx, dy]] of Object.entries(sides)) {
      if ((C.side && C.side !== sd) || !allowed.includes(sd)) continue;
      const lines = new Map();
      for (const [x, y] of s.cells) { if (floor(x + dx, y + dy) || margin.has(K(x, y))) continue; const ln = dy ? y : x; if (!lines.has(ln)) lines.set(ln, []); lines.get(ln).push(dy ? x : y); }
      for (const [ln, ts] of lines) {
        ts.sort((a, b) => a - b);
        let st = ts[0], pv = ts[0];
        for (let i = 1; i <= ts.length; i++) {
          if (i < ts.length && ts[i] - pv <= 1) { pv = ts[i]; continue; }
          if (pv - st + 1 >= C.minLine) cand.push({ dx, dy, ln, st, en: pv, len: pv - st + 1 });
          if (i < ts.length) { st = ts[i]; pv = ts[i]; }
        }
      }
    }
    if (!cand.length) { s.notes.push(`열 ${C.name}: 벽면 줄 없음`); return; }
    // 긴 벽면부터 — 북쪽 벽은 한 칸 안쪽에 발(그림이 위로 그려져 벽 너머로 넘어가지 않게), 남쪽은 벽 바로 앞, 동·서는 벽 쪽으로 붙인다
    cand.sort((a, b) => b.len - a.len);
    let why = "";
    for (const best of cand) {
      let spots = [], runCur = [];
      const tent = new Set(), tadd = (cells) => { for (const [a, b] of cells) { tent.add(K(a, b)); if (!C.contiguous) { tent.add(K(a - 1, b)); tent.add(K(a + 1, b)); } } };
      const flush = () => { if (runCur.length > spots.length) spots = runCur; runCur = []; };
      for (let t = best.st + 0.5; t <= best.en + (best.dy ? 0.5 : -0.5); t += step) {   // 동·서 벽 열은 맨 위 칸을 비운다 (그림이 방 위로 넘어가지 않게)
        // 담 윗면 맵(;raised)은 북·동·서 가장자리 칸이 절벽 윗단 테두리로 그려져 한 칸 더 안쪽 (남쪽은 낮은 칸에 앞면 띠라 그대로)
        const ins = spec.raised ? 1 : 0;
        const q = best.dy ? [r2(t + 0.5), r2(best.dy > 0 ? best.ln - 0.4 - ins : best.ln + 0.3)] : [r2(best.ln + (best.dx > 0 ? 0.4 : 0.6)), r2(t + 0.4)]   /* 6차: 동·서 벽 열도 벽에 닿는 칸에 (담 윗면 한 칸 안쪽 들이기 없앰 — 뒤 칸이 생겼다) */;
        // 5차: 벽 정면(facing north) 열은 북벽에 붙인다 — 그림 윗면 = 벽 밑선 · 발밑부터 벽까지 막음 (뒤 칸 0)
        const hug = best.dy > 0;   // 6차: 북벽 열은 방향(facing)과 관계없이 모두 벽에 붙이고 벽까지 막는다 (5차는 facing north만이라 바람 비석이 2.4칸 떨어져 뒤로 걸어 들어갔다)
        if (hug) q[1] = hugY(C.name, best.ln + 1, 1);
        const cells = fc(C.name, q[0], q[1], 1, hug ? { toWall: true } : null);
        if (free(cells) && (C.contiguous || tentOk(cells, tent)) && !nearFunc(q[0], q[1])) { tadd(cells); runCur.push({ q, cells, flip: false, args: hug ? "wall=1" : "" }); } else flush();
      }
      flush();
      if (spots.length < C.min) { why = `${spots.length}개뿐`; continue; }
      if (!canBlock(blockOf(C.name) ? spots.flatMap((sp) => sp.cells) : [], !spots.some((sp) => sp.args))) { why = "바닥을 가둠"; continue; }   // 벽 밀착 줄은 벽감을 끝 넓히기로 메운다
      commit(s, C.name, spots, "벽 따라 열");
      return;
    }
    s.notes.push(`열 ${C.name}: 놓을 벽면 없음 (${why})`);
  };
  const ring = (s, cfg) => {
    const C = Object.assign({}, V.RING, cfg);
    if (!s.feature) { s.notes.push(`테두리 ${C.name}: 특징 없음`); return; }
    const spots = [], tent = new Set();
    for (let k = 0; k < C.n; k++) {
      const a = (2 * Math.PI * k) / C.n + Math.PI / C.n, q = [r2(s.feature[0] + Math.cos(a) * C.r), r2(s.feature[1] + Math.sin(a) * C.r)];
      const cells = fc(C.name, q[0], q[1], 1);
      if (free(cells) && tentOk(cells, tent) && !nearFunc(q[0], q[1])) { tentAdd(cells, tent); spots.push({ q, cells, flip: k % 2 === 1 }); }
    }
    if (spots.length < C.min || spots.length < C.n - 1) { s.notes.push(`테두리 ${C.name}: ${spots.length}개뿐 — 뺌`); return; }
    commit(s, C.name, spots, "테두리");
  };
  const pair = (s, cfg) => {
    if (cfg.around === "feature") {   // 특징(제단·처형대) 양옆 쌍 — 역할표 pair 「처형대·제단 양옆 쌍」
      if (!s.feature) { s.notes.push(`쌍 ${cfg.name}: 특징 없음`); return; }
      for (const d of [cfg.d || 2.8, (cfg.d || 2.8) - 0.4, (cfg.d || 2.8) + 0.6, (cfg.d || 2.8) + 1.2]) for (const dy of [0, -0.6, 0.6]) {
        const both = [1, -1].map((sd) => { const q = [r2(s.feature[0] + d * sd), r2(s.feature[1] + dy)]; return { q, cells: fc(cfg.name, q[0], q[1], 1), flip: sd < 0 }; });
        const tent = new Set();
        // 특징 양옆은 보스 자리 둘레(기능 자리 비움)와 겹쳐도 된다 — 띠·표식·놓인 것과 기능 자리 1.2칸 안만 피한다
        const okLoose = (cells) => cells.every(([cx, cy]) => { const c = g.get(cx, cy); return c && !c.wall && !band.has(K(cx, cy)) && !core.has(K(cx, cy)) && !occ.has(K(cx, cy)) && !isMk(cx, cy); });
        if (both.every((bq) => okLoose(bq.cells) && tentOk(bq.cells, tent) && !nearFunc(bq.q[0], bq.q[1], 1.2, 1.2) && (tentAdd(bq.cells, tent), true))) { commit(s, cfg.name, both, "특징 양옆 쌍"); return; }
      }
      s.notes.push(`쌍 ${cfg.name}: 특징 양옆 자리 없음`); return;
    }
    // 공간에 띠가 들어오는 문(첫 칸)과 나가는 문(끝 칸) — 띠 방향으로 0.5~3.5칸 들어간 자리의 양옆
    const ends = s.inPlace.length ? s.inPlace : s.onBand;
    for (const [end, dir] of [[ends[0], 1], [ends[ends.length - 1], -1]]) {
      if (!end) continue;
      const k = coreOrder.findIndex((c) => c[0] === end[0] && c[1] === end[1]), n2 = coreOrder[Math.max(0, Math.min(coreOrder.length - 1, k + 2 * dir))];
      const u0 = [n2[0] - end[0], n2[1] - end[1]], L = Math.hypot(...u0) || 1, u = [u0[0] / L, u0[1] / L], nrm = [-u[1], u[0]];
      for (const along of [1.5, 0.5, 2.5, 3.5, 4.5, 5.5]) for (const off of [2.4, 2.9, 3.4, 1.9]) {
        const p = [end[0] + 0.5 + u[0] * along, end[1] + 0.5 + u[1] * along];
        const both = [1, -1].map((sd) => { const q = [r2(p[0] + nrm[0] * off * sd), r2(p[1] + nrm[1] * off * sd)]; return { q, cells: fc(cfg.name, q[0], q[1], 1), flip: sd < 0 }; });
        const tent = new Set();
        // 문 양옆은 띠 곁(비움 1칸)이어도 된다 — 띠 칸·표식·놓인 것·기능 자리 1.2칸만 피한다 (5차: 2줄 막힘으로 자리가 없어졌다)
        const okDoor = (cells) => cells.every(([cx, cy]) => { const c = g.get(cx, cy); return c && !c.wall && !band.has(K(cx, cy)) && !core.has(K(cx, cy)) && !occ.has(K(cx, cy)) && !isMk(cx, cy) && !(keep && c.road); });
        if (both.every((bq) => okDoor(bq.cells) && tentOk(bq.cells, tent) && !nearFunc(bq.q[0], bq.q[1], 1.2, 1.2) && (tentAdd(bq.cells, tent), true)) && !narrows(both.flatMap((bq) => bq.cells))) { commit(s, cfg.name, both, "문 양옆 쌍"); return; }
      }
    }
    s.notes.push(`쌍 ${cfg.name}: 자리 없음`);
  };
  for (const s of S) for (const rw of [].concat(s.plan.row || [])) wallRow(s, rw);
  placeFeatures();
  for (const s of S) {
    if (s.plan.colonnade) colonnade(s, s.plan.colonnade);
    if (s.plan.ring) ring(s, s.plan.ring);
    if (s.plan.pair) pair(s, s.plan.pair);
  }

  // 화로: 장소마다 하나 (compose.cjs와 같은 규칙 + 띠·띠 곁 칸은 피한다)
  const torches = [];
  if (spec.torches === "auto" || !spec.torches) {
    S.forEach((s) => {
      if (s.p.torch === false) return;
      const off = s.p.torchAt || [0, 0], c0 = s.p.e ? [s.p.e[0], s.p.e[1]] : [(s.p.r[0] + s.p.r[2] + 1) / 2, (s.p.r[1] + s.p.r[3] + 1) / 2];
      let best = null;
      for (const [x, y] of s.cells) {
        const c = g.get(x, y);
        if (occ.has(K(x, y)) || margin.has(K(x, y)) || isMk(x, y)) continue;
        if (feet.some(([fx, fy]) => Math.abs(fx - x - 0.5) < 2.4 && Math.abs(fy - y - 0.5) < 1.6)) continue;
        if (func.some((f) => Math.hypot(f.x - x - 0.5, f.y - y - 0.5) < 3.2)) continue;
        if (torches.some(([tx, ty]) => Math.hypot(tx - x - 0.5, ty - y - 0.5) < 6)) continue;
        if (inVbox(x + 0.5, y + 0.5)) continue;
        let around = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (floor(x + dx, y + dy)) around++;
        if (around < 9) continue;
        const d = Math.hypot(x + 0.5 - c0[0] - off[0], y + 0.5 - c0[1] - off[1]) + (c.keep ? 1.5 : 0);
        if (!best || d < best.d) best = { x, y, d };
      }
      if (best) torches.push([best.x + 0.5, best.y + 0.5]);
    });
  } else for (const p of spec.torches) torches.push([p[0] + 0.5, p[1] + 0.5]);
  for (const [tx, ty] of torches) { func.push({ ch: "T", x: tx, y: ty }); clear(tx, ty, 0.9, 2.2); markerOf.set(K(Math.floor(tx), Math.floor(ty)), "T"); }

  // 소품 묶음 (≤3 · 공간당 ≤2 · 같은 소품 그림 맵당 ≤2) · 바닥 패치 소품 · 바닥 무늬
  const OFFS = [[0, 0], [1.4, 0.2], [-1.4, 0.1], [0.7, -1.0], [-0.7, 1.0], [1.2, 1.1], [-1.2, -1.0]];
  for (const s of S) {
    const pl = s.plan, anchors = [];
    if (!pl.sets.length && !pl.props.length && !pl.floorProps.length && !pl.decals.length) { s.clusters = 0; continue; }
    // 묶음 자리: 장소 칸 · 띠·띠 곁·기능 자리 둘레 밖 · 그 자리에 소품 하나(계획 첫 소품, 없으면 세트 첫 조각)가 실제로 들어가는가
    const probe = pl.props[0] || (pl.sets[0] ? setNames(pl.sets[0])[0] : null);
    const okAt = (x, y) => { const c = g.get(Math.floor(x), Math.floor(y)); return c && !c.wall && !c.keep && c.place === s.i && !margin.has(K(Math.floor(x), Math.floor(y))) && !occ.has(K(Math.floor(x), Math.floor(y))) && !nearFunc(x, y) && (!probe || free(fc(probe, x, y, 1))); };
    if (s.feature) {
      const out = [s.c[0] - s.feature[0], s.c[1] - s.feature[1]], L = Math.hypot(...out) || 1;
      for (let k = 0; k < 16 && anchors.length < 1; k++) { const a = Math.atan2(out[1], out[0]) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.6, q = [s.feature[0] + Math.cos(a) * 3.2, s.feature[1] + Math.sin(a) * 3.2]; if (okAt(...q)) anchors.push(q); }
    } else if (s.cells.length) {
      const pool = s.cells.filter(([x, y]) => okAt(x + 0.5, y + 0.4)).sort((a, b) => Math.hypot(a[0] + 0.5 - s.c[0], a[1] + 0.5 - s.c[1]) - Math.hypot(b[0] + 0.5 - s.c[0], b[1] + 0.5 - s.c[1]));
      if (pool[0]) anchors.push([pool[0][0] + 0.5, pool[0][1] + 0.4]);
    }
    if (s.area >= 50 && anchors.length) {
      const ref = s.entry ? [s.entry[0] + 0.5, s.entry[1] + 0.5] : s.c;
      const pool = s.cells.filter(([x, y]) => okAt(x + 0.5, y + 0.4) && D4.some(([dx, dy]) => !floor(x + dx, y + dy)) && Math.hypot(x + 0.5 - anchors[0][0], y + 0.4 - anchors[0][1]) >= 5)
        .sort((a, b) => Math.hypot(a[0] + 0.5 - ref[0], a[1] - ref[1]) - Math.hypot(b[0] + 0.5 - ref[0], b[1] - ref[1]));
      if (pool[0]) anchors.push([pool[0][0] + 0.5, pool[0][1] + 0.4]);
    }
    const sets = pl.sets.slice();
    let clusters = 0;
    for (const A of anchors.slice(0, pl.clusters ?? V.CLUSTERS_PER_SPACE)) {   // 설계서 clusters: 공간당 묶음 수 (기본 2)
      if (!sets.length && !pl.props.some((n) => counted(n) && (count.get(n) || 0) < V.SPRITE_MAX)) { if (!clusters && (pl.props.length || pl.sets.length)) s.notes.push("묶음 소품 모두 같은 그림 상한"); break; }
      let placed = 0;
      while (sets.length && !placed) {
        const sn = sets.shift();
        const { out: grp, dropped } = trimGroup(groupOf("set", sn));
        if (!grp.some((p) => !p.decal)) { s.notes.push(`세트 ${sn}: 남는 조각 없음`); continue; }
        if (dropped.length) s.notes.push(`세트 ${sn}에서 뺀 조각: ${dropped.join(", ")}`);
        const pool = [];
        for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) pool.push([r2(Math.floor(A[0]) + dx + 0.5), r2(Math.floor(A[1]) + dy + 0.3)]);
        pool.sort((a, b) => Math.hypot(a[0] - A[0], a[1] - A[1]) - Math.hypot(b[0] - A[0], b[1] - A[1]));
        for (const [sx, sy] of pool) for (const m of [1, -1]) {
          if (placed) break;
          if (!free(gCells(grp, sx, sy, m)) || nearFunc(sx, sy, 3, 2.4) || !gVisual(grp, sx, sy, m) || !canBlock(gBlock(grp, sx, sy, m))) continue;
          if (grp.some((p) => p.decal && !floor(Math.floor(sx + p.dx * m), Math.floor(sy + p.dy)))) continue;   // 7차: 세트 바닥 무늬 조각 발이 벽 칸이면 다른 자리 (빌더 경고 「발이 벽 칸 위」)
          if (deadCount(gBlock(grp, sx, sy, m)) > deadCount([])) continue;   // 7차: 세트가 폭 1칸 막다른 줄을 새로 만들면 다른 자리
          gCommit("set", sn, grp, !dropped.length, sx, sy, m, `${s.p.name} · v5 소품 묶음(세트)`);
          placed = 1;
        }
      }
      if (!placed) {
        const names = [...new Set(pl.props)].filter((n) => counted(n) && (count.get(n) || 0) < V.SPRITE_MAX);
        const pick = [];
        for (const n of names) { if (pick.length >= V.CLUSTER_MAX) break; if (rand() < 0.85 || names.length <= V.CLUSTER_MAX) pick.push(n); }
        for (const n of pick) {
          for (const [ox, oy] of OFFS) {
            const q = [r2(A[0] + ox), r2(A[1] + oy)], cells = fc(n, q[0], q[1], 1);
            if (!free(cells) || nearFunc(q[0], q[1]) || feet.some(([fx, fy]) => Math.hypot(fx - q[0], fy - q[1]) < 1.1) || !canBlock(blockCellsProp(n, q[0], q[1]))) continue;
            doBlock(blockCellsProp(n, q[0], q[1]));
            occupy(cells, q[0], q[1]); bump(n); placed++;
            pushRow("prop", n, q[0], q[1], { flip: rand() < 0.5, note: `${s.p.name} · v5 소품 묶음` });
            if (blockOf(n)) hugs.push({ row: rows[rows.length - 1], name: n, x: q[0], y: q[1], cells: cells.map(([a, b]) => K(a, b)) });
            break;
          }
        }
      }
      if (placed) clusters++;
      else s.notes.push(`묶음 실패 @${r2(A[0])},${r2(A[1])}`);
    }
    if (!anchors.length && (pl.sets.length || pl.props.length)) s.notes.push("묶음 자리 없음");
    // 바닥 패치 소품(웅덩이 등) 하나 · 바닥 무늬 ≤3 — 묶음 곁
    const near = [...(s.feature ? [s.feature] : []), ...anchors];
    for (const n of pl.floorProps.slice(0, 1)) for (const A of near) {
      const q = [r2(A[0] + 1.8), r2(A[1] - 1.2)], cells = fc(n, q[0], q[1], 1);
      if (!free(cells) || nearFunc(q[0], q[1]) || !canBlock(blockCellsProp(n, q[0], q[1]))) continue;
      doBlock(blockCellsProp(n, q[0], q[1]));
      occupy(cells, q[0], q[1]); pushRow("prop", n, q[0], q[1], { note: `${s.p.name} · v5 바닥 패치` }); break;
    }
    const dspots = [];
    for (let k = 0; k < 24 && dspots.length < Math.min(pl.dn, V.DECALS_PER_SPACE) && pl.decals.length && near.length; k++) {
      const A = near[k % near.length], a = rand() * Math.PI * 2, rr = 1.4 + rand() * 1.6, q = [r2(A[0] + Math.cos(a) * rr), r2(A[1] + Math.sin(a) * rr)];
      const c = g.get(Math.floor(q[0]), Math.floor(q[1]));
      if (!c || c.wall || band.has(K(Math.floor(q[0]), Math.floor(q[1]))) || nearFunc(q[0], q[1], 1.6, 1.2) || dspots.some(([x, y]) => Math.hypot(x - q[0], y - q[1]) < 2.2) || feet.some(([x, y]) => Math.hypot(x - q[0], y - q[1]) < 1.2)) continue;
      dspots.push(q);
      pushRow("decal", pl.decals[dspots.length % pl.decals.length], q[0], q[1], { flip: rand() < 0.5, note: `${s.p.name} · v5 바닥 무늬` });
    }
    s.clusters = clusters;
  }
  // 6차: 막는 그림 양끝·사이와 벽 사이 폭 ≤2칸 막다른 벽감(벽 밀착 줄 곁 포함) — 곁 그림의 발밑 칸을 그쪽으로 넓혀 막는다 (args padl·padr · 4회까지 되풀이)
  //   벽감 칸 = 빈 바닥 · 가로 빈칸 ≤2 · 바로 위가 벽·막힘이거나 벽감 · 벽에 붙인 그림 칸과 가로로 맞닿음
  {
    const freeC = (x, y) => floor(x, y) && !blocked.has(K(x, y));
    const hRun = (x, y) => { let n = 1; for (let k = 1; k <= 3 && freeC(x - k, y); k++) n++; for (let k = 1; k <= 3 && freeC(x + k, y); k++) n++; return n; };
    const hugCell = new Map();
    hugs.forEach((h, i) => h.cells.forEach((k) => hugCell.set(k, i)));
    // 배치표 args → 발밑 옵션 (빌더 lib.cjs place와 같은 해석: wall=1 · foot= · padl= · padr= · hole= · fill=x/y,…)
    const rowOpt = (h) => {
      const a = h.row.args || "", n = (nm) => Number((a.match(new RegExp("(?:^|;)" + nm + "=(\\d+)")) || [0, 0])[1]), f = (a.match(/(?:^|;)fill=([^;]+)/) || [])[1];
      return { toWall: !!h.toWall, frac: h.frac, padl: n("padl"), padr: n("padr"), hole: n("hole"), fill: f ? f.split(",").map((t) => t.split("/").map(Number)) : null };
    };
    let filled = 0;
    for (let pass = 0; pass < 4; pass++) {
    const niche = new Set();
    for (let y = g.y1; y >= g.y0; y--) for (let x = g.x0; x <= g.x1; x++) if (freeC(x, y) && !isMk(x, y) && hRun(x, y) <= 2 && (!freeC(x, y + 1) || niche.has(K(x, y + 1)))) niche.add(K(x, y));
    const seen = new Set();
    for (const k0 of niche) {
      if (seen.has(k0)) continue;
      const comp = [k0]; seen.add(k0);
      for (let i = 0; i < comp.length; i++) { const [x, y] = unK(comp[i]); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (niche.has(nk) && !seen.has(nk)) { seen.add(nk); comp.push(nk); } } }
      // 왼쪽에 벽 붙은 그림이 있으면 그 그림의 오른쪽을, 아니면 오른쪽 그림의 왼쪽을 넓힌다
      let pick = null;
      for (const k of comp) { const [x, y] = unK(k); if (hugCell.has(K(x - 1, y))) { pick = { i: hugCell.get(K(x - 1, y)), side: "padr" }; break; } }
      if (!pick) for (const k of comp) { const [x, y] = unK(k); if (hugCell.has(K(x + 1, y))) { pick = { i: hugCell.get(K(x + 1, y)), side: "padl" }; break; } }
      if (!pick) continue;
      const h = hugs[pick.i], cols = h.cells.filter((k) => unK(k)[1] === Math.floor(h.y)).map((k) => unK(k)[0]), xs = comp.map((k) => unK(k)[0]);   // 7차: 발밑 줄 끝에서 잰다 (옆벽 막음 칸은 윗줄에만 있을 수 있다)
      const need = pick.side === "padr" ? Math.max(...xs) - Math.max(...cols) : Math.min(...cols) - Math.min(...xs);
      if (need <= 0 || need > 4) continue;   // 벽감 폭은 ≤2(가로 빈칸) — 그 사이 이미 막힌 칸까지 넓혀도 4칸까지
      const cur = Number(((h.row.args || "").match(new RegExp(pick.side + "=(\\d+)")) || [0, 0])[1]);
      const args = (h.row.args || "").split(";").filter((t) => t && !t.startsWith(pick.side + "="));
      args.push(`${pick.side}=${cur + need}`);   // need는 지금 칸(이미 넓힌 것 포함) 끝에서 잰 거리
      h.row.args = args.join(";");
      const nc = fc(h.name, h.x, h.y, h.sc || 1, rowOpt(h));
      doBlock(nc); occupy(nc, h.x, h.y); h.cells = nc.map(([a, b]) => K(a, b)); nc.forEach(([a, b]) => hugCell.set(K(a, b), pick.i));
      filled += comp.length;
    }
    }
    report.nicheFilled = filled;
    // 7차: 폭 1칸 막다른 줄(길이 ≥3 · 장식 곁 · 골격 띠·표식이 없는 것 — 검사기 deadLines와 같은 정의)은 맞닿은 그림의 막힘에 더한다 (배치표 args fill=)
    let lined = 0;
    for (let pass = 0; pass < 3; pass++) {
      const chains = checker.deadLines(floorCells.map(([x, y]) => K(x, y)), (k) => freeC(...unK(k)), (k) => floor(...unK(k)), (k) => floor(...unK(k)) && blocked.has(k), (k) => isMk(...unK(k)) || band.has(k) || core.has(k));
      let did = 0;
      for (const ch of chains) {
        let owner;
        { const cnt = new Map(); for (const k of ch) { const [x, y] = unK(k); for (const [dx, dy] of D4) { const nk = K(x + dx, y + dy); if (hugCell.has(nk) && !ch.includes(nk)) cnt.set(hugCell.get(nk), (cnt.get(hugCell.get(nk)) || 0) + 1); } } for (const [i, n] of cnt) if (owner === undefined || n > cnt.get(owner) || (n === cnt.get(owner) && roles.roleOf(hugs[i].name) === "feature")) owner = i; }   // 가장 많이 맞닿은 그림 (같으면 특징)
        if (owner === undefined) { warn.push("폭 1칸 막다른 줄 (" + ch[0] + ")~" + ch.length + "칸: 맞닿은 그림 없음"); continue; }
        const cells = ch.map(unK);
        if (!canBlock(cells, false)) { warn.push("폭 1칸 막다른 줄 (" + ch[0] + ")~" + ch.length + "칸: 막으면 바닥을 가둠"); continue; }
        const h = hugs[owner], all = (rowOpt(h).fill || []).concat(cells), args = (h.row.args || "").split(";").filter((t) => t && !t.startsWith("fill="));
        args.push("fill=" + all.map(([a, b]) => a + "/" + b).join(","));
        h.row.args = args.join(";");
        const nc = fc(h.name, h.x, h.y, h.sc || 1, rowOpt(h));
        doBlock(nc); h.cells = nc.map(([a, b]) => K(a, b)); nc.forEach(([a, b]) => hugCell.set(K(a, b), owner));
        lined += ch.length; did++;
      }
      if (!did) break;
    }
    report.deadLineFilled = lined;
  }
  report.band = band.size; report.legs = legs.map((l) => `${l.target}:${l.cells.length}`);
  report.spaces = S.map((s) => `${s.p.z}:${s.p.name}=${s.fn}${s.feature ? " ·특징" : ""}${s.clusters ? " ·묶음" + s.clusters : ""}${s.notes.length ? " (" + s.notes.join("; ") + ")" : ""}`);
  report.warn = warn;
  return { rows, torches, zonesExtra, report };
}
module.exports = { run };
