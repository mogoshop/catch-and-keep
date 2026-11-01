#!/usr/bin/env node
// keepFloor 빌드 칸 길이 늘어난 목표마다 「이 칸 하나만 풀면 기준 길이로 돌아오는」 막힌 칸과 그 칸을 막은 장식 (맵은 고치지 않는다 · 읽기만)
//   node docs/evidence/2026-11-01-route-tools/blockers.cjs <git 기준> <맵id>[,<맵id>...]
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const [ref, list] = process.argv.slice(2);
const hm = require(path.join(ROOT, "tools/build/handmade/lib.cjs"));
const maps = require(path.join(ROOT, "tools/build/maps.cjs"));
const { load } = require(path.join(ROOT, "tools/build/lib.cjs"));
const rl = require(path.join(ROOT, "tools/route_lengths.cjs"));
const cmc = require(path.join(ROOT, "tools/check_map_composition.cjs"));
const mapRows = load("maps"), ctx = maps.context();
const fs = require("fs");
for (const id of list.split(",")) {
  const d = mapRows.find((m) => m.id === id);
  const b = rl.builtCells(d, mapRows, ctx), bp = b.bp;
  const open = new Set(bp.cells().filter(([x, y]) => b.open(x, y)).map(([x, y]) => `${x},${y}`));
  const end = rl.endOf(d), goals = end ? [["end@", `${end[0]},${end[1]}`]] : [];
  const refText = require("child_process").execFileSync("git", ["show", `${ref}:data/handmade/${id}.txt`], { cwd: ROOT, encoding: "utf8" });
  const refSide = cmc.keepFloorOf(refText, { goals, open: cmc.builtOpenAt(ref, id) });
  const text = fs.readFileSync(path.join(hm.HM_DIR, id + ".txt"), "utf8");
  const cur = cmc.keepFloorOf(text, { goals, open });
  for (const g of Object.keys(refSide.built)) {
    const a = refSide.built[g], now = cur.built[g];
    if (!(a >= 0 && (now < 0 || now > a))) continue;
    const fixes = [];
    for (const k of b.art.blocked) {
      const [x, y] = k.split(",").map(Number);
      if (!bp.isFloor(x, y)) continue;
      const trial = new Set(open); trial.add(k);
      const t = cmc.keepFloorOf(text, { goals, open: trial }).built[g];
      if (t <= a) {
        const who = (b.art.pieces || []).filter((p) => (p.cells || []).some(([cx, cy]) => cx === x && cy === y) || (Math.floor(p.x) === x && Math.floor(p.y) === y)).map((p) => `${p.name || "?"} ${p.sprite} @${p.x}/${p.y}`);
        fixes.push(`(${k}) ${who.join(" | ") || "장식 발밑(pieces에 칸 목록 없음)"}`);
      }
    }
    console.log(`${id} ${g}: 기준 ${ref} ${a} → 지금 ${now} · 한 칸만 풀면 ${a} 이하: ${fixes.join(" · ") || "없음(두 칸 이상이 함께 막음)"}`);
  }
}
