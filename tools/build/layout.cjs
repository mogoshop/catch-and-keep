// 던전 통로 배치 (data/map_layouts.csv): 방 + 좁은 굽은 통로를 칸 단위로 만든다 (디아블로 2 동굴처럼).
// 결과: 칸마다 바닥/벽 → 타일(바닥 = 걷는 타일, 벽 = 충돌 타일)과 벽 그림(바위 9조각을 칸 이웃에 맞춰 고른다).
// 같은 seed면 늘 같은 배치 (다시 빌드해도 diff가 생기지 않게). 기능 위치(포털·화로·웨이포인트·고정 몬스터·NPC 등)는 늘 방 안.
"use strict";

// 맵 칸 범위 (maps.cjs edges와 같은 기준): x = -w/2 .. w/2-1, y = -h/2+1 .. h/2, 칸 (x, y) = 월드 [x, x+1]×[y, y+1] → 월드 좌표의 칸 = floor
function bounds(d) {
  const w = Number(d.w), h = Number(d.h);
  return { x0: -w / 2, x1: w / 2 - 1, y0: -h / 2 + 1, y1: h / 2 };
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// anchors: [{ x, y, kind }] — kind "portalW"/"portalE" = 가장자리 출구, "stop" = 길이 거쳐 가는 기능(웨이포인트·입구·NPC·보스),
// "room" = 화로 같은 자리, "decor" = 메이커 장식(Decor_) 자리. style "maze" = 동굴 미로, 그 밖 = 필드 (generateField)
function generate(d, spec, anchors) {
  if ((spec.style || "maze") !== "maze") return generateField(d, spec, anchors);
  return generateMaze(d, spec, anchors.filter((a) => a.kind !== "decor"));
}

function generateMaze(d, spec, anchors) {
  const b = bounds(d);
  const rand = rng(Number(spec.seed) || 1);
  const ri = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const cw = Math.max(1, Number(spec.corridor) || 2);
  const floor = new Set();
  const key = (x, y) => `${x},${y}`;
  const inner = (x, y) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1;
  const dig = (x, y, edge = false) => { if (inner(x, y) || edge) floor.add(key(x, y)); };
  const room = (cx, cy, rw, rh) => {
    for (let x = cx - Math.floor(rw / 2); x < cx - Math.floor(rw / 2) + rw; x++)
      for (let y = cy - Math.floor(rh / 2); y < cy - Math.floor(rh / 2) + rh; y++) dig(x, y);
  };

  // 큰 격자(C칸 간격) 위에서 미로를 판다: 깊이 우선으로 한 줄기 굽은 길 + 고리 몇 개 → 좁은 길목이 이어진다
  const C = Math.max(cw + 2, Number(spec.cell) || 4);
  const nx = Math.floor((b.x1 - b.x0 - 1 - cw) / C) + 1, ny = Math.floor((b.y1 - b.y0 - 1 - cw) / C) + 1;
  const ox = b.x0 + 1 + Math.floor((b.x1 - b.x0 - 1 - cw - (nx - 1) * C) / 2);
  const oy = b.y0 + 1 + Math.floor((b.y1 - b.y0 - 1 - cw - (ny - 1) * C) / 2);
  const cx = (i) => ox + i * C, cy = (j) => oy + j * C;
  const cellOf = (x, y) => [Math.max(0, Math.min(nx - 1, Math.round((x - ox) / C))), Math.max(0, Math.min(ny - 1, Math.round((y - oy) / C)))];
  const brush = (x, y) => { for (let i = 0; i < cw; i++) for (let j = 0; j < cw; j++) dig(x + i, y + j); };
  const line = (ax, ay, bx, by) => {
    let x = ax, y = ay;
    brush(x, y);
    while (x !== bx) { x += Math.sign(bx - x); brush(x, y); }
    while (y !== by) { y += Math.sign(by - y); brush(x, y); }
  };
  const link = (i, j, k, l) => line(cx(i), cy(j), cx(k), cy(l));

  const start = anchors.find((a) => a.kind === "portalW") || anchors[0];
  const [si, sj] = cellOf(start.x, start.y);
  const visited = new Set([`${si}:${sj}`]);
  const stack = [[si, sj]];
  const edgesUsed = new Set();
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([di, dj]) => [i + di, j + dj])
      .filter(([k, l]) => k >= 0 && k < nx && l >= 0 && l < ny && !visited.has(`${k}:${l}`));
    if (next.length === 0) { stack.pop(); continue; }
    // 가로로 뻗는 쪽을 조금 더 자주 (왼쪽 입구 → 오른쪽 끝방 흐름)
    next.sort(() => rand() - 0.5);
    const pick = next.find(([k]) => k > i && rand() < 0.35) || next[0];
    const [k, l] = pick;
    visited.add(`${k}:${l}`);
    edgesUsed.add(`${i}:${j}-${k}:${l}`);
    link(i, j, k, l);
    stack.push([k, l]);
  }
  // 고리: 막다른 길만 이어지지 않게 이웃 몇 쌍을 더 잇는다
  const loops = Number(spec.loops) || 0;
  for (let n = 0, tries = 0; n < loops && tries < 100; tries++) {
    const i = ri(0, nx - 1), j = ri(0, ny - 1), [di, dj] = rand() < 0.5 ? [1, 0] : [0, 1];
    if (i + di >= nx || j + dj >= ny) continue;
    if (edgesUsed.has(`${i}:${j}-${i + di}:${j + dj}`) || edgesUsed.has(`${i + di}:${j + dj}-${i}:${j}`)) continue;
    edgesUsed.add(`${i}:${j}-${i + di}:${j + dj}`);
    link(i, j, i + di, j + dj);
    n++;
  }
  // 방: 기능 위치마다 작은 방 + 길에 붙인다, 빈 방 몇 개
  const roomAt = (x, y) => {
    room(x, y, ri(4, 5), ri(3, 4));
    const [i, j] = cellOf(x, y);
    line(x, y, cx(i), y);
    line(cx(i), y, cx(i), cy(j));
  };
  for (const a of anchors) {
    const x = Math.floor(a.x), y = Math.floor(a.y);
    if (a.kind === "portalW") {
      for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) dig(x + i, y + j);
      const [i, j] = cellOf(x, y);
      line(x, y, cx(i), y);
      line(cx(i), y, cx(i), cy(j));
    } else if (a.kind === "portalE") {
      for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) dig(x - i, y + j, i === 0);
      const [i, j] = cellOf(x, y);
      line(cx(i), cy(j), cx(i), y);
      line(cx(i), y, x - 1, y);
    } else roomAt(x, y);
  }
  const extra = Number(spec.rooms) || 0;
  for (let n = 0; n < extra; n++) {
    const i = ri(1, nx - 1), j = ri(0, ny - 1);
    room(cx(i) + 1, cy(j) + 1, ri(4, 6), ri(4, 5));
  }

  // 한 칸 두께 벽(양옆이 바닥)은 바위 그림이 어색하다 → 바닥으로
  for (let pass = 0; pass < 2; pass++) {
    for (let x = b.x0 + 1; x < b.x1; x++) for (let y = b.y0 + 1; y < b.y1; y++) {
      if (floor.has(key(x, y))) continue;
      const f = (dx, dy) => floor.has(key(x + dx, y + dy));
      if ((f(0, 1) && f(0, -1)) || (f(1, 0) && f(-1, 0))) floor.add(key(x, y));
    }
  }

  // 검증: 기능 위치는 바닥, 모든 바닥은 왼쪽 출구에서 이어진다
  for (const a of anchors) {
    if (!floor.has(key(Math.floor(a.x), Math.floor(a.y)))) throw new Error(`layout ${d.id}: 기능 위치 (${a.x}, ${a.y})가 벽`);
  }
  const seen = new Set([key(Math.floor(start.x), Math.floor(start.y))]);
  const queue = [[Math.floor(start.x), Math.floor(start.y)]];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = key(x + dx, y + dy);
      if (floor.has(k) && !seen.has(k)) { seen.add(k); queue.push([x + dx, y + dy]); }
    }
  }
  if (seen.size !== floor.size) throw new Error(`layout ${d.id}: 바닥 ${floor.size}칸 중 ${floor.size - seen.size}칸이 끊김`);
  return { bounds: b, floor, isFloor: (x, y) => floor.has(key(x, y)) };
}


// 필드: 열린 들판에 테마별 장애물(늪 웅덩이 · 숲 덤불 · 무너진 담장 · 바위 언덕)과 들쭉날쭉한 가장자리를 두고,
// 포털 → 기능 자리(stop) → 포털로 구불구불한 길(roadTile)을 낸다. 기능·장식 자리는 늘 바닥이고 모든 바닥은 왼쪽 출구에서 이어진다.
function generateField(d, spec, anchors) {
  const b = bounds(d);
  const rand = rng(Number(spec.seed) || 1);
  const ri = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const rf = (lo, hi) => lo + rand() * (hi - lo);
  const key = (x, y) => `${x},${y}`;
  const inner = (x, y) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1;
  const wall = new Set(), keep = new Set(), road = new Set(), edgeFloor = new Set();
  const disk = (cx, cy, r, set) => {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        if (inner(x, y) && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) set.add(key(x, y));
  };

  // 1) 기능 자리 둘레는 비워 둔다
  for (const a of anchors) {
    const r = a.kind === "decor" ? 1 : a.kind === "portalW" || a.kind === "portalE" ? 3 : 2.5;
    disk(a.x, a.y, r, keep);
    if (a.kind === "portalE") for (let j = -1; j <= 1; j++) edgeFloor.add(key(b.x1, Math.floor(a.y) + j));
  }
  // 2) 길: 왼쪽 출구 → 기능 자리(x 순) → 오른쪽 출구. 구간마다 위아래로 흔들리는 중간점 1~2개
  const rw = Math.max(2, Number(spec.corridor) || 3);
  const pw = anchors.find((a) => a.kind === "portalW"), pe = anchors.find((a) => a.kind === "portalE");
  const stops = anchors.filter((a) => a.kind === "stop").sort((p, q) => p.x - q.x);
  const pts = [pw ? { x: pw.x + 1, y: pw.y } : { x: b.x0 + 2, y: 0 }, ...stops.map((a) => ({ x: a.x, y: a.y }))];
  if (pe) pts.push({ x: pe.x - 1, y: pe.y });
  const swing = Math.max(2, (b.y1 - b.y0) / 6);
  const path = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], c = pts[i];
    const n = Math.abs(c.x - a.x) > 18 ? 2 : 1;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const y = Math.max(b.y0 + 3, Math.min(b.y1 - 3, a.y + (c.y - a.y) * t + rf(-swing, swing)));
      path.push({ x: a.x + (c.x - a.x) * t, y });
    }
    path.push(c);
  }
  // 칸 격자에서 비스듬한 길은 계단처럼 깨진다 → 가로·세로 구간으로만 잇는다 (꺾이는 곳은 ㄱ자)
  const half = Math.floor(rw / 2);
  const stamp = (x, y) => { for (let i = -half; i < rw - half; i++) for (let j = -half; j < rw - half; j++) if (inner(x + i, y + j)) road.add(key(x + i, y + j)); };
  for (let i = 1; i < path.length; i++) {
    const ax = Math.floor(path[i - 1].x), ay = Math.floor(path[i - 1].y), cx = Math.floor(path[i].x), cy = Math.floor(path[i].y);
    for (let x = ax; x !== cx + Math.sign(cx - ax) || x === ax; x += Math.sign(cx - ax) || 1) { stamp(x, ay); if (x === cx) break; }
    for (let y = ay; y !== cy + Math.sign(cy - ay) || y === ay; y += Math.sign(cy - ay) || 1) { stamp(cx, y); if (y === cy) break; }
  }
  const free = (k) => !keep.has(k) && !road.has(k);

  // 3) 가장자리: 2~4칸마다 0~3칸 깊이로 안쪽을 메워 직사각형 느낌을 없앤다
  const bite = (x, y) => { const k = key(x, y); if (inner(x, y) && free(k)) wall.add(k); };
  for (let x = b.x0 + 1; x < b.x1; ) {
    const len = ri(2, 4), top = ri(0, 3), bottom = ri(0, 3);
    for (let i = 0; i < len; i++) {
      for (let j = 1; j <= top; j++) bite(x + i, b.y1 - j);
      for (let j = 1; j <= bottom; j++) bite(x + i, b.y0 + j);
    }
    x += len;
  }
  for (let y = b.y0 + 1; y < b.y1; ) {
    const len = ri(2, 4), left = ri(0, 2), right = ri(0, 2);
    for (let i = 0; i < len; i++) {
      for (let j = 1; j <= left; j++) bite(b.x0 + j, y + i);
      for (let j = 1; j <= right; j++) bite(b.x1 - j, y + i);
    }
    y += len;
  }

  // 4) 테마 장애물: 안쪽 칸의 density 비율이 막힐 때까지
  const style = spec.style;
  const innerCount = (b.x1 - b.x0 - 1) * (b.y1 - b.y0 - 1);
  const target = innerCount * (Number(spec.density) || 0.25);
  const blob = (cx, cy, rx, ry) => {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++)
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        const v = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (v <= 1 + rf(-0.25, 0.2)) bite(x, y);
      }
  };
  const segment = (x, y, len, horizontal) => {
    // 무너진 담장: 두께 2, 중간에 1~2칸 무너진 틈
    const gapAt = ri(1, Math.max(1, len - 3)), gapLen = rand() < 0.5 ? 2 : 0;
    for (let i = 0; i < len; i++) {
      if (i >= gapAt && i < gapAt + gapLen) continue;
      for (let t = 0; t < 2; t++) horizontal ? bite(x + i, y + t) : bite(x + t, y + i);
    }
  };
  for (let tries = 0; tries < 800 && wall.size < target; tries++) {
    const cx = rf(b.x0 + 3, b.x1 - 3), cy = rf(b.y0 + 3, b.y1 - 3);
    if (style === "marsh") blob(cx, cy, rf(1.5, 3.5), rf(1.2, 2.4));
    else if (style === "forest") blob(cx, cy, rf(1, 2.2), rf(1, 2));
    else if (style === "ruins") {
      if (rand() < 0.7) {
        const x = Math.floor(cx), y = Math.floor(cy), len = ri(4, 9);
        segment(x, y, len, rand() < 0.5);
        if (rand() < 0.4) segment(x, y, ri(3, 6), rand() < 0.5);   // ㄱ자로 꺾인 담
      } else blob(cx, cy, rf(1, 1.6), rf(1, 1.4));
    } else blob(cx, cy, rf(2, 4.5), rf(1.5, 3));   // waste: 바위 언덕
  }

  // 5) 한 칸 두께 벽(양옆이 바닥)은 바닥으로
  const isWall = (x, y) => !inner(x, y) ? !edgeFloor.has(key(x, y)) : wall.has(key(x, y));
  for (let pass = 0; pass < 2; pass++) {
    for (const k of [...wall]) {
      const [x, y] = k.split(",").map(Number);
      if ((!isWall(x, y + 1) && !isWall(x, y - 1)) || (!isWall(x + 1, y) && !isWall(x - 1, y))) wall.delete(k);
    }
  }

  // 6) 이어짐: 왼쪽 출구에서 못 가는 기능 자리는 가장 가까운 닿는 칸까지 폭 2로 뚫고, 남은 고립 바닥은 벽으로
  const reach = () => {
    const sx = Math.floor(pts[0].x), sy = Math.floor(pts[0].y);
    const seen = new Set([key(sx, sy)]);
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (!seen.has(k) && !isWall(nx, ny)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    return seen;
  };
  let seen = reach();
  for (const a of anchors) {
    const ax = Math.floor(a.x), ay = Math.floor(a.y);
    if (seen.has(key(ax, ay))) continue;
    let best = null, bestD = 1e9;
    for (const k of seen) {
      const [x, y] = k.split(",").map(Number);
      const dd = Math.abs(x - ax) + Math.abs(y - ay);
      if (dd < bestD) { bestD = dd; best = [x, y]; }
    }
    if (!best) continue;
    let x = ax, y = ay;
    const open = (cx, cy) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) wall.delete(key(cx + i, cy + j)); };
    open(x, y);
    while (x !== best[0]) { x += Math.sign(best[0] - x); open(x, y); }
    while (y !== best[1]) { y += Math.sign(best[1] - y); open(x, y); }
    seen = reach();
  }
  for (let x = b.x0 + 1; x < b.x1; x++) for (let y = b.y0 + 1; y < b.y1; y++) {
    if (!wall.has(key(x, y)) && !seen.has(key(x, y))) wall.add(key(x, y));
  }

  const floor = new Set(seen);
  for (const a of anchors) {
    if (!floor.has(key(Math.floor(a.x), Math.floor(a.y)))) throw new Error(`layout ${d.id}: 기능 위치 (${a.x}, ${a.y})가 벽`);
  }
  return { bounds: b, floor, isFloor: (x, y) => floor.has(key(x, y)), isRoad: (x, y) => road.has(key(x, y)) && floor.has(key(x, y)) };
}

// 타일 배열: 바닥 = floorTile, 벽 = wallTile (둘 다 0부터 세는 타일셋 번호)
function tiles(layout, floorTile, wallTile, roadTile) {
  const { x0, x1, y0, y1 } = layout.bounds;
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    out.push({ type: 0, position: { x, y }, tileIndex: !layout.isFloor(x, y) ? wallTile : layout.isRoad && layout.isRoad(x, y) && roadTile >= 0 ? roadTile : floorTile });
  }
  return out;
}

// 벽 칸마다 바위 9조각 중 하나: 바닥 쪽으로 드러난 면의 조각 (위가 바닥 = 'n', 위·오른쪽 = 'ne' ...), 안쪽 = 'center'.
// 같은 줄의 같은 조각은 하나로 합친다 → [{ piece, x, y, len }]
function wallRuns(layout) {
  const { x0, x1, y0, y1 } = layout.bounds;
  const f = (x, y) => layout.isFloor(x, y);
  const pieceAt = (x, y) => {
    const n = f(x, y + 1), s = f(x, y - 1), e = f(x + 1, y), w = f(x - 1, y);
    if ((n && s) || (e && w) || n + s + e + w >= 3) return "center";
    if (n) return e ? "ne" : w ? "nw" : "n";
    if (s) return e ? "se" : w ? "sw" : "s";
    if (e) return "e";
    if (w) return "w";
    return "center";
  };
  const runs = [];
  for (let y = y0; y <= y1; y++) {
    let cur = null;
    for (let x = x0; x <= x1 + 1; x++) {
      const p = x <= x1 && !f(x, y) ? pieceAt(x, y) : null;
      if (cur && p === cur.piece) { cur.len++; continue; }
      if (cur) runs.push(cur);
      cur = p ? { piece: p, x, y, len: 1 } : null;
    }
  }
  return runs;
}

module.exports = { bounds, generate, tiles, wallRuns };
