#!/usr/bin/env node
// 설계도 맵의 실제 길 재기 (10-28 · 시뮬 큰 맵 가정을 지형으로 바꾸려고): 맵마다
//   route  = 들어오는 문(W, 마을은 G)에서 나가는 문(E) — 막다른 맵은 끝방 자리(extra end)·보스 자리 — 까지 최단 걸음 수(칸)
//   near   = 그 길에서 4칸 안에 드는 바닥 비율 (몬스터는 바닥에 고르게 나오므로 「지나가며 마주치는 몬스터 비율」의 근사)
// → data/handmade/routes.csv (sim_balance.py · sim_clear.py가 읽는다). node tools/route_lengths.cjs
"use strict";
const fs = require("fs");
const path = require("path");
const hm = require("./build/handmade/lib.cjs");
const { load } = require("./build/lib.cjs");

const NEAR = 4;
const out = [["map", "route", "near", "floor"]];
for (const m of load("maps")) {
  if (m.kind === "instance" || !hm.hasBlueprint(m.id)) continue;
  const bp = hm.parseBlueprint(m.id);
  const mk = hm.markers(m.id).list;
  const cell = (p) => [Math.floor(p[0]), Math.floor(p[1])];
  const start = (mk.W || mk.G || [])[0];
  let goal = (mk.E || [])[0];
  const xy = (t) => t.split("@")[1].split("/").map(Number);
  if (!goal) {
    const end = (m.extra || "").split(";").find((t) => t.startsWith("end@"));
    const boss = (m.fixed || "").split(";").filter(Boolean)[0];
    if (end) goal = xy(end); else if (boss) goal = xy(boss);
  }
  if (!start || !goal) continue;
  const key = (x, y) => x + "," + y;
  const [sx, sy] = cell(start), [gx, gy] = cell(goal);
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === gx && y === gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !bp.isFloor(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  const pathCells = [];
  for (let k = key(gx, gy); k; k = prev.get(k)) pathCells.push(k.split(",").map(Number));
  // 길에서 NEAR칸 안의 바닥 (8방향 거리)
  const dist = new Map(), dq = [];
  for (const [x, y] of pathCells) { dist.set(key(x, y), 0); dq.push([x, y]); }
  for (let i = 0; i < dq.length; i++) {
    const [x, y] = dq[i], d = dist.get(key(x, y));
    if (d >= NEAR) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (dist.has(k) || !bp.isFloor(nx, ny)) continue;
      dist.set(k, d + 1); dq.push([nx, ny]);
    }
  }
  let floor = 0;
  for (const [x, y] of bp.cells()) if (bp.isFloor(x, y)) floor++;
  out.push([m.id, pathCells.length - 1, (dist.size / floor).toFixed(3), floor]);
}
fs.writeFileSync(path.join(hm.HM_DIR, "routes.csv"), out.map((r) => r.join(",")).join("\n") + "\n");
const rows = out.slice(1);
const avg = (k) => rows.reduce((a, r) => a + Number(r[k]), 0) / rows.length;
console.log(`맵 ${rows.length}장 · 평균 길 ${avg(1).toFixed(1)}칸 · 길 4칸 안 바닥 ${(avg(2) * 100).toFixed(0)}%`);
for (const r of rows.filter((r) => ["wasteland", "rotmarsh", "crypt1", "hollow", "queentomb", "canyon", "throne"].includes(r[0]))) console.log("  " + r.join(" · "));
