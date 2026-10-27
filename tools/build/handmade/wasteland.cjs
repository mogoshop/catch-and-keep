#!/usr/bin/env node
// 피 묻은 황무지 — 손으로 지은 시안 (map/wasteland_hm.map + 난이도 복제).
//   설계도 data/handmade/wasteland_hm.txt · 배치표 data/handmade/wasteland_hm.csv · 메이플 그림 표 data/handmade/maple_sprites.csv
//   node tools/build/handmade/wasteland.cjs            맵을 짓고 요약·경고를 찍는다
//   node tools/build/handmade/wasteland.cjs --check    짓지 않고 설계도·배치표만 검사한다
// maps.csv의 kind=handmade 행은 tools/build.cjs maps(= maps.cjs run)에서도 같은 빌더로 지어진다 — 이 스크립트는 그 한 맵만 빠르게 돌리는 손잡이.
"use strict";
const handmade = require("./lib.cjs");
const maps = require("../maps.cjs");
const { load, num, quiet } = require("../lib.cjs");

const ID = "wasteland_hm";
const rows = load("maps").sort((a, b) => num(a.order) - num(b.order));
const d = rows.find((m) => m.id === ID);
if (!d || d.kind !== "handmade") throw new Error(`maps.csv에 kind=handmade 인 '${ID}' 행이 없음`);
const ctx = maps.context();

if (process.argv.includes("--check")) {
  const bp = handmade.parseBlueprint(ID);
  const list = handmade.loadRows(ID);
  const func = handmade.functionalEntities(d, rows, ctx, list);
  const art = handmade.artEntities(d, ctx, bp, list, func);
  const r = handmade.check(bp, func, art);
  console.log(`설계도 ${bp.w}×${bp.h} · 기능 ${func.length} · 그림 ${art.entities.length} (${JSON.stringify(art.counts)}) · 발밑 막힘 ${art.blocked.size}칸 · 닿는 바닥 ${r.reachable}칸`);
  for (const w of r.warn) console.log("  ! " + w);
  process.exit(0);
}

const summary = quiet(() => handmade.build(d, rows, ctx));
for (const w of summary.warn) console.log("  ! " + w);
console.log(`  ${ID}: 엔티티 ${summary.entities} (장식 ${summary.props} · 세트 ${summary.sets} · 흩뿌림 ${summary.clusters} · 바닥 무늬 ${summary.decals} · 벽 ${summary.walls} · 길 ${summary.roads} · 구역 바닥 ${summary.zones}) · 발밑 막힘 ${summary.blockedCells}칸 · 닿는 바닥 ${summary.reachable}칸 · 끊긴 바닥 ${summary.cut}칸`);
// 난이도 복제 (악몽·지옥) — maps.cjs와 같은 방식
const copies = maps.buildCopies(d);
console.log(`  난이도 복제 ${copies}`);
