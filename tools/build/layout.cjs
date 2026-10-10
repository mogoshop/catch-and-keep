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

// anchors: [{ x, y, kind }] — kind "portalW"/"portalE"는 가장자리 출구, 나머지는 방 중심
function generate(d, spec, anchors) {
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

// 타일 배열: 바닥 = floorTile, 벽 = wallTile (둘 다 0부터 세는 타일셋 번호)
function tiles(layout, floorTile, wallTile) {
  const { x0, x1, y0, y1 } = layout.bounds;
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    out.push({ type: 0, position: { x, y }, tileIndex: layout.isFloor(x, y) ? floorTile : wallTile });
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
