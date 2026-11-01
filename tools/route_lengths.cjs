#!/usr/bin/env node
// 설계도 맵의 실제 길 재기 (10-28 · 시뮬 큰 맵 가정을 지형으로 바꾸려고): 맵마다
//   route  = 들어오는 문(W, 마을은 G)에서 나가는 문(E) — 막다른 맵은 끝방 자리(maps.csv extra end@)·보스 자리(fixed 첫 자리) — 까지 최단 걸음 수(칸 · 4방향)
//            · 「빌드된 맵 칸」 위에서 잰다 (11-01 사용자 결정 7-A)
//   near   = 길에서 4칸(8방향 · 바닥으로만 퍼짐) 안에 드는 바닥 비율 (몬스터는 바닥에 고르게 나오므로 「지나가며 마주치는 몬스터 비율」의 근사)
//   floor  = 바닥 칸 수
// 빌드된 맵 칸 = 설계도 바닥 − 장식 막힘(art.blocked) − 장식 사이 갇힌 바닥(check sealed).
//   tools/build/handmade/lib.cjs build()가 RectTileMap에 충돌 타일(269)로 쓰는 것과 같은 정의 · 같은 함수(desiredEntities → artEntities → check)로 계산한다.
//   = map/<id>.map 충돌 칸(11-01 설계도 맵 66/66 같음) = 메이커 서버 칸. (10-28~10-31은 설계도 글자 바닥만 재서 장식이 막은 칸을 지나는 길이 짧게 나왔다 —
//   wreckcoast 75→77 · keeperhouse 58→60 · heartbridge 69→71 · docs/evidence/2026-11-01-route-tools)
// near·floor 기준 (NEAR_BASIS · 11-01): 기본 "blueprint" = 옛 정의 그대로(설계도 바닥 · 설계도 최단 길 둘레). "built"(--near=built)는 빌드된 맵 칸으로 잰다 —
//   몬스터는 충돌 칸에 나오지 않으니(MonsterSpawner → Util.TileBlocked) 뜻은 built가 맞지만 62행 near가 −0.026~+0.075 움직여 sim_balance 지옥 끝 레벨이
//   90→91이 되어 npm test 「거인 끝 레벨 (46-7)」이 깨진다 → 밸런스 기준 결정 전까지 blueprint (영향 표 = docs/evidence/2026-11-01-route-tools/README.md)
// → data/handmade/routes.csv (sim_balance.py · sim_clear.py가 route·near를 읽는다).
//   node tools/route_lengths.cjs                다시 재서 쓰고 바뀐 행을 찍는다
//   node tools/route_lengths.cjs --check        쓰지 않고 지금 routes.csv와 다르면 바뀔 행을 찍고 종료 코드 1
//   node tools/route_lengths.cjs --near=built   near·floor도 빌드된 맵 칸으로 (승인 뒤 기본값을 바꾸려면 NEAR_BASIS)
"use strict";
const fs = require("fs");
const path = require("path");

const NEAR = 4;
const NEAR_BASIS = "blueprint";   // near·floor 기준: "blueprint"(옛 정의) | "built" — 위 머리말
const key = (x, y) => x + "," + y;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cellOf = (p) => [Math.floor(p[0]), Math.floor(p[1])];

// 빌드된 맵 칸 — lib.cjs build()와 같은 차례: 기능 엔티티(maps.cjs desiredEntities · 설계도 맵은 handmade 배치표) → 그림(artEntities) → 이어짐 검사(check)
//   open(x, y) = 충돌 타일이 아닌 칸 (build의 tileIndex: 설계도 벽 ∪ art.blocked ∪ sealed → 269)
function builtCells(d, mapRows, ctx) {
  const hm = require("./build/handmade/lib.cjs");
  const maps = require("./build/maps.cjs");
  const { quiet } = require("./build/lib.cjs");
  const bp = hm.parseBlueprint(d.id);
  const rows = hm.loadRows(d.id);
  const func = quiet(() => maps.desiredEntities(d, mapRows, ctx));
  const art = quiet(() => hm.artEntities(d, ctx, bp, rows, func));
  const { sealed } = hm.check(bp, func, art);
  const open = (x, y) => bp.isFloor(x, y) && !art.blocked.has(key(x, y)) && !sealed.has(key(x, y));
  return { bp, rows, func, art, sealed, open };
}

// maps.csv extra의 끝방 자리 (end@x/y) → 칸 · 없으면 null
function endOf(d) {
  const t = (d.extra || "").split(";").find((s) => s.startsWith("end@"));
  return t ? cellOf(t.split("@")[1].split("/").map(Number)) : null;
}

// 시작(W, 없으면 G) · 목표(E → 없으면 extra end@ → 없으면 fixed 첫 자리) 칸
function routeEnds(d) {
  const hm = require("./build/handmade/lib.cjs");
  const mk = hm.markers(d.id).list;
  const start = (mk.W || mk.G || [])[0];
  let goal = (mk.E || [])[0] ? cellOf(mk.E[0]) : null, kind = "E";
  if (!goal) {
    const boss = (d.fixed || "").split(";").filter(Boolean)[0];
    goal = endOf(d);
    kind = "end@";
    if (!goal && boss) { goal = cellOf(boss.split("@")[1].split("/").map(Number)); kind = "boss"; }
  }
  return start && goal ? { start: cellOf(start), goal, kind } : null;
}

// 4방향 최단 길 (이웃 순서 동·서·북·남 — 같은 길이 길이 여럿이면 near가 고르는 길이 이 순서로 정해진다) → 길 칸 목록(목표 → 시작) · 못 닿으면 null
function shortest(open, start, goal) {
  const [sx, sy] = start, [gx, gy] = goal;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === gx && y === gy) break;
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !open(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  if (!prev.has(key(gx, gy))) return null;
  const cells = [];
  for (let k = key(gx, gy); k; k = prev.get(k)) cells.push(k.split(",").map(Number));
  return cells;
}

// 한 맵의 행 { route, near, floor } — route는 늘 빌드된 맵 칸 · near·floor는 basis("blueprint" | "built")
function measure(d, mapRows, ctx, basis = NEAR_BASIS) {
  const ends = routeEnds(d);
  if (!ends) return null;
  const { bp, open } = builtCells(d, mapRows, ctx);
  if (!open(...ends.start)) throw new Error(`${d.id}: 시작 칸 (${ends.start})이 걷는 칸이 아님`);
  if (!open(...ends.goal)) throw new Error(`${d.id}: 목표 ${ends.kind} 칸 (${ends.goal})이 걷는 칸이 아님 (설계도 벽이거나 장식이 막음)`);
  const pathCells = shortest(open, ends.start, ends.goal);
  if (!pathCells) throw new Error(`${d.id}: 시작 (${ends.start}) → 목표 ${ends.kind} (${ends.goal}) 길이 없음`);
  // near: 길에서 NEAR칸 안의 바닥 (8방향 거리) — blueprint 기준은 설계도 바닥 위 설계도 최단 길(옛 정의 · 같은 이웃 순서라 값이 그대로)
  const floorOk = basis === "built" ? open : bp.isFloor;
  const nearPath = basis === "built" ? pathCells : shortest(bp.isFloor, ends.start, ends.goal);
  const dist = new Map(), dq = [];
  for (const [x, y] of nearPath) { dist.set(key(x, y), 0); dq.push([x, y]); }
  for (let i = 0; i < dq.length; i++) {
    const [x, y] = dq[i], dd = dist.get(key(x, y));
    if (dd >= NEAR) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (dist.has(k) || !floorOk(nx, ny)) continue;
      dist.set(k, dd + 1); dq.push([nx, ny]);
    }
  }
  let floor = 0;
  for (const [x, y] of bp.cells()) if (floorOk(x, y)) floor++;
  return { route: pathCells.length - 1, near: (dist.size / floor).toFixed(3), floor, kind: ends.kind, blueprintRoute: shortest(bp.isFloor, ends.start, ends.goal).length - 1 };
}

function main() {
  const hm = require("./build/handmade/lib.cjs");
  const maps = require("./build/maps.cjs");
  const { load } = require("./build/lib.cjs");
  const checkOnly = process.argv.includes("--check");
  const basisArg = (process.argv.find((a) => a.startsWith("--near=")) || "").slice(7);
  const basis = basisArg || NEAR_BASIS;
  if (!["blueprint", "built"].includes(basis)) throw new Error(`--near=${basisArg}: blueprint | built`);
  const file = path.join(hm.HM_DIR, "routes.csv");
  const mapRows = load("maps"), ctx = maps.context();
  const out = [["map", "route", "near", "floor"]];
  const detour = [];
  for (const m of mapRows) {
    if (m.kind === "instance" || !hm.hasBlueprint(m.id)) continue;
    const r = measure(m, mapRows, ctx, basis);
    if (!r) continue;
    out.push([m.id, r.route, r.near, r.floor]);
    if (r.route !== r.blueprintRoute) detour.push(`${m.id} ${r.blueprintRoute}→${r.route}`);
  }
  console.log(`near·floor 기준 ${basis} · 장식 막힘으로 설계도 글자 길보다 긴 맵 ${detour.length}장${detour.length ? ": " + detour.join(" · ") : ""}`);
  const text = out.map((r) => r.join(",")).join("\n") + "\n";
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const was = Object.fromEntries(before.trim().split("\n").slice(1).filter(Boolean).map((l) => [l.split(",")[0], l]));
  const changed = out.slice(1).filter((r) => was[r[0]] !== r.join(","));
  const gone = Object.keys(was).filter((id) => !out.some((r) => r[0] === id));
  const rows = out.slice(1);
  const avg = (k) => rows.reduce((a, r) => a + Number(r[k]), 0) / rows.length;
  console.log(`맵 ${rows.length}장 · 평균 길 ${avg(1).toFixed(1)}칸 · 길 4칸 안 바닥 ${(avg(2) * 100).toFixed(0)}% · 바뀐 행 ${changed.length}${gone.length ? ` · 사라진 행 ${gone.join(" ")}` : ""}`);
  for (const r of changed) console.log(`  ${r[0]}: ${was[r[0]] ? was[r[0]].split(",").slice(1).join(" · ") : "(새 행)"} → ${r.slice(1).join(" · ")}`);
  if (checkOnly) {
    if (text !== before) { console.log("[route_lengths --check] routes.csv가 지금 맵과 다름 — node tools/route_lengths.cjs"); process.exit(1); }
    console.log("[route_lengths --check] routes.csv = 지금 맵");
    return;
  }
  fs.writeFileSync(file, text);
}

module.exports = { NEAR, NEAR_BASIS, builtCells, endOf, routeEnds, shortest, measure };
if (require.main === module) main();
