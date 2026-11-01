#!/usr/bin/env node
// 실제 keep 맵 한 장을 check_map_composition 자가 테스트 입력(JSON)으로 떠 놓는다 — 기준(git <ref>: 설계도 + 그때 지은 맵 파일 충돌 칸) ↔ 지금(설계도 + 빌드 계산).
//   node docs/evidence/2026-11-01-route-tools/export_keep_fixture.cjs keeperhouse '3c759419^' tests/quality/map_composition/32-keeperhouse-3c759419.json
// 그림 배치(pieces)는 넣지 않는다 — keepFloor·격자·막힌 칸으로 재는 항목만 실제와 같고 배치 항목은 0 (자가 테스트 expect는 keepFloor만).
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const [id, ref, outFile] = process.argv.slice(2);
if (!id || !ref || !outFile) throw new Error("사용: export_keep_fixture.cjs <맵id> <git 기준> <출력 JSON>");
const hm = require(path.join(ROOT, "tools/build/handmade/lib.cjs"));
const maps = require(path.join(ROOT, "tools/build/maps.cjs"));
const { load } = require(path.join(ROOT, "tools/build/lib.cjs"));
const rl = require(path.join(ROOT, "tools/route_lengths.cjs"));
const cmc = require(path.join(ROOT, "tools/check_map_composition.cjs"));
const mapRows = load("maps"), d = mapRows.find((m) => m.id === id);
const built = rl.builtCells(d, mapRows, maps.context()), bp = built.bp;
const toGrid = (x, y, w, h) => `${x + w / 2},${h / 2 - y}`;
// 지금: 설계도 바닥인데 빌드 칸이 막힌 칸
const blocked = bp.cells().filter(([x, y]) => bp.isFloor(x, y) && !built.open(x, y)).map(([x, y]) => toGrid(x, y, bp.w, bp.h));
// 기준: 그때 설계도 + 그때 맵 파일 충돌 칸
const refText = require("child_process").execFileSync("git", ["show", `${ref}:data/handmade/${id}.txt`], { cwd: ROOT, encoding: "utf8" });
const refRows = refText.split(/\r?\n/).filter((l) => l && !l.startsWith(";")), refWalls = [...refText.matchAll(/^;wall (\S)/gm)].map((m) => m[1]);
const H = refRows.length, W = refRows[0].length, refOpen = cmc.builtOpenAt(ref, id);
if (!refOpen) throw new Error(`${ref}에 map/${id} 없음`);
const refBlocked = [];
refRows.forEach((row, r) => [...row].forEach((ch, c) => { if (!refWalls.includes(ch) && !refOpen.has(`${c - W / 2},${H / 2 - r}`)) refBlocked.push(`${c},${r}`); }));
const end = rl.endOf(d);
const j = {
  note: `실제 맵 ${id}: 기준 ${ref}(설계도 + 그때 맵 파일 충돌 칸) ↔ 지금(설계도 + 빌드 계산) — keepFloor 기대 ${process.env.EXPECT || 1} (뜬 날 2026-11-01 · 그림 배치 없음)`,
  grid: bp.rows, zones: bp.zones, roads: bp.roads, base: bp.base, walls: Object.keys(bp.walls), markers: [...bp.markers].join(""),
  guide: 0, pieces: [], blocked, v5keep: !!bp.v5keep, end: end ? [`${end[0]},${end[1]}`] : [],
  keepRef: { grid: refRows, walls: refWalls, blocked: refBlocked },
  expect: { keepFloor: Number(process.env.EXPECT || 1) },
};
fs.writeFileSync(path.resolve(ROOT, outFile), JSON.stringify(j, null, 1));
console.log(`${outFile}: 지금 막힌 칸 ${blocked.length} · 기준 막힌 칸 ${refBlocked.length} · 끝방 ${j.end.join(" ")}`);
