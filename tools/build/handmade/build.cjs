#!/usr/bin/env node
// 설계도 맵 손잡이 — 맵 몇 장만 빠르게 짓거나 검사한다 (10-28 맵 66장 전면 개편).
//   node tools/build/handmade/build.cjs rotmarsh execution        짓고(난이도 복제 포함) 요약·경고를 찍는다
//   node tools/build/handmade/build.cjs act1 --check               액트 설계서의 맵 전부를 짓지 않고 검사만
//   node tools/build/handmade/build.cjs stormeye --floormix-y=seam-only --out=docs/evidence/…/maps
//       ;floormix 줄(상하) 정책 시범 (lib.cjs FLOORMIX_Y_MODES · 기본 mix) · --out: map/ 대신 그 폴더에 노말만 쓴다 (난이도 복제 없음 · map/은 그대로)
//   node tools/build/handmade/build.cjs crabcave1 stormeye --floormix=flip --out=docs/evidence/…/maps
//       ;floormix 바닥 정책 (lib.cjs FLOORMIX_MODES) — 10-29 코덱스 승인으로 기본 = variants(현행 + 변형을 격자 칸마다 좌표 해시로 고르고 임의 뒤집기 없음 · I-2,
//       FLOOR_VARIANTS에 변형이 있는 따개비 돌 바닥만 해당) · --floormix=flip / FLOORMIX=flip은 옛 정책(열·줄 의사난수 뒤집기) 재현용
// 설계도는 compose.cjs가 설계서(data/handmade/specs/act<N>.cjs)로 만든다. 전체 빌드(tools/build.cjs maps)도 같은 빌더를 쓴다.
"use strict";
const path = require("path");
const handmade = require("./lib.cjs");
const maps = require("../maps.cjs");
const { load, num, quiet, P } = require("../lib.cjs");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const checkOnly = process.argv.includes("--check");
const optOf = (name) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : null; };
if (optOf("floormix-y")) handmade.setFloormixY(optOf("floormix-y"));
if (optOf("floormix")) handmade.setFloormixMode(optOf("floormix"));
const outDir = optOf("out") ? path.resolve(optOf("out")) : null;
if (outDir) require("fs").mkdirSync(outDir, { recursive: true });
const rows = load("maps").sort((a, b) => num(a.order) - num(b.order));
let ids = [];
for (const a of args) {
  if (/^act\d$/.test(a)) ids.push(...Object.keys(require(path.join(handmade.HM_DIR, "specs", a + ".cjs"))));
  else ids.push(a);
}
if (!ids.length) throw new Error("사용: build.cjs <맵id|act1>… [--check]");
const ctx = maps.context();
let totalEntities = 0, sizeWarnN = 0;
for (const id of ids) {
  const d = rows.find((m) => m.id === id);
  if (!d) throw new Error(`maps.csv에 '${id}' 없음`);
  const func = d.kind === "handmade" ? null : maps.desiredEntities(d, rows, ctx);
  if (checkOnly) {
    const bp = handmade.parseBlueprint(id);
    const list = handmade.loadRows(id);
    const f = func || handmade.functionalEntities(d, rows, ctx, list);
    const art = handmade.artEntities(d, ctx, bp, list, f);
    const r = handmade.check(bp, f, art);
    console.log(`  ${id} ${bp.w}×${bp.h}: 기능 ${f.length} · 그림 ${art.entities.length} ${JSON.stringify(art.counts)} · 닿는 바닥 ${r.reachable}칸`);
    for (const w of r.warn) console.log("    ! " + w);
    for (const w of art.size) { console.log("    ! " + w); sizeWarnN++; }   // 10-29 크기 검사 (lib.cjs SIZE_MIN_PX)
    totalEntities += art.entities.length + f.length;
    continue;
  }
  const outFile = outDir ? path.join(outDir, path.basename(P.map(id))) : null;
  const s = quiet(() => handmade.build(d, rows, ctx, func, { outFile }));
  const copies = outDir ? 0 : quiet(() => maps.buildCopies(d));
  console.log(`  ${id}: 엔티티 ${s.entities} (벽 ${s.walls} · 구역 ${s.zones} · 길 ${s.roads} · 세트 ${s.sets} · 장식 ${s.props} · 무늬 ${s.decals}) · 닿는 바닥 ${s.reachable}칸 · 난이도 복제 ${copies}`);
  for (const w of s.warn) console.log("    ! " + w);
  totalEntities += s.entities;
}
console.log(`  합계 엔티티 ${totalEntities} (맵 ${ids.length}장)${checkOnly ? ` · 크기 경고 ${sizeWarnN}` : ""}`);
