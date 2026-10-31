#!/usr/bin/env node
// 맵 구성 v5 1단계 검수용 — 설계도 맵 66장의 「현재 빌더가 실제로 놓는 것」을 JSON으로 덤프한다 (읽기 전용 · 맵 파일을 쓰지 않는다).
//   저장소 맨 위에서: node tools/review/dump_map_layout.cjs <out.json> [맵id…]
//   맵마다: 설계도 격자·구역 범례·장소 목록([n] 줄) · 기능 엔티티(포털·웨이포인트·화로) · 놓인 장식(pieces: 그림·자리·배율·막음·흩뿌림·세트)
//   · 길 안내 곡선(guide v4: exit/loop 갈래) · 엔티티 수. tools/review/zone_sheet.py가 이 JSON으로 구획도·검수표를 만든다.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const handmade = require(path.join(ROOT, "tools/build/handmade/lib.cjs"));
const maps = require(path.join(ROOT, "tools/build/maps.cjs"));
const { load, num, quiet } = require(path.join(ROOT, "tools/build/lib.cjs"));

const out = process.argv[2];
if (!out) throw new Error("사용: dump_map_layout.cjs <out.json> [맵id…]");
const want = process.argv.slice(3);
const rows = load("maps").sort((a, b) => num(a.order) - num(b.order));
const ctx = maps.context();
const result = [];
const r2 = (v) => Math.round(v * 100) / 100;
const LEGEND = /^;(size|base|zone|road|wall|markers|raised|shore|backdrop|floormix)\b/;
const gateTarget = (e) => (e.overrides && e.overrides["script.WarpGate"] ? e.overrides["script.WarpGate"].TargetMap : undefined);
for (const d of rows) {
  if (d.kind === "handmade" || !handmade.hasBlueprint(d.id)) continue;
  if (want.length && !want.includes(d.id)) continue;
  const bp = handmade.parseBlueprint(d.id);
  const text = fs.readFileSync(path.join(handmade.HM_DIR, d.id + ".txt"), "utf8");
  const places = [], header = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith(";")) continue;
    const m = line.match(/^;\s+\[(\d+)\]\s+(.*)$/);
    if (m) places.push({ n: Number(m[1]), text: m[2].trim() });
    else if (!LEGEND.test(line)) header.push(line.slice(1).trim());
  }
  const list = handmade.loadRows(d.id);
  const func = quiet(() => maps.desiredEntities(d, rows, ctx));
  let art;
  try { art = quiet(() => handmade.artEntities(d, ctx, bp, list, func)); }
  catch (e) { result.push({ id: d.id, error: String(e.message || e) }); continue; }
  const curves = ((art.route && art.route.curves) || []).map((c) => ({
    kind: c.kind || (c.branch ? "branch" : "exit"), target: c.target,
    pts: c.pts.filter((p, i) => i % 4 === 0 || i === c.pts.length - 1).map((p) => [r2(p.x), r2(p.y)]),
  }));
  result.push({
    id: d.id, order: num(d.order), name: d.name, act: num(d.act, 1), kind: d.kind, w: bp.w, h: bp.h, mode: art.mode,
    header, places, zones: bp.zones, roads: bp.roads,
    walls: Object.fromEntries(Object.entries(bp.walls).map(([k, v]) => [k, { name: v.name }])),
    markers: [...bp.markers], grid: bp.rows, raised: bp.raised ? { name: bp.raised.name } : null, shore: bp.shore ? { sea: [...bp.shore.sea] } : null,
    func: func.map((e) => ({ name: e.name, pos: [e.pos[0], e.pos[1]], target: gateTarget(e) })),
    rows: list.map((r) => ({ kind: r.kind, name: r.name, x: num(r.x), y: num(r.y), note: r.note })),
    pieces: (art.pieces || []).map((p) => ({ n: p.name, s: p.sprite, x: r2(p.x), y: r2(p.y), sc: Math.round(p.sc * 1000) / 1000, decal: p.decal, block: p.block, scatter: p.scatter })),
    curves, counts: art.counts, entities: art.entities.length + func.length,
  });
}
fs.writeFileSync(out, JSON.stringify(result));
console.log(`맵 ${result.length}장 → ${out} (오류 ${result.filter((r) => r.error).length})`);
