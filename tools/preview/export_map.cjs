#!/usr/bin/env node
// 맵 미리보기 1단계 (메이커 없이 · 10-31 실플레이 피드백 C): .map의 그림 엔티티를 JSON으로 뽑는다 → tools/preview/render_map.py가 그린다.
//   node tools/preview/export_map.cjs <맵id> <출력.json> [맵 파일 — 기본 map/<맵id>.map · build.cjs --out 시범본]
// 뽑는 것: SpriteRendererComponent가 있는 엔티티(그림 이름 · 자리 · 배율 · 반복 크기 · 색 · 뒤집기) · 충돌 칸(타일 269) ·
//   기능 자리(포털·화로·웨이포인트 — 모델 그림이라 점으로만) · 설계도 크기
"use strict";
const fs = require("fs");
const path = require("path");
const { MapBuilder, load } = require("../build/lib.cjs");

const [id, outFile, mapFile] = process.argv.slice(2);
if (!id || !outFile) throw new Error("사용: export_map.cjs <맵id> <출력.json>");
const ROOT = path.resolve(__dirname, "../..");
const names = {};
for (const r of load("art_sprites")) names[r.ruid] = { name: r.name, kind: r.kind, w: Number(r.w), h: Number(r.h) };
for (const r of load("handmade/maple_sprites")) names[r.ruid] = { name: r.name, kind: "maple", w: Number(r.w), h: Number(r.h), ny: Number(r.ny || 0) };
const mb = MapBuilder.read(mapFile ? path.resolve(mapFile) : path.join(ROOT, "map", id + ".map"));
const pieces = [], func = [];
for (const e of mb.listEntities()) {
  const tr = mb.component(e.path, "MOD.Core.TransformComponent");
  const sr = mb.component(e.path, "MOD.Core.SpriteRendererComponent");
  const leaf = e.path.split("/").pop();
  if (/^(Gate|Torch|Waypoint)/.test(leaf) && tr) { func.push({ name: leaf, x: tr.Position.x, y: tr.Position.y }); continue; }
  if (!sr || !tr || !/^Art/.test(leaf)) continue;
  const rid = typeof sr.SpriteRUID === "string" ? sr.SpriteRUID : (sr.SpriteRUID || {}).DataId;
  const sp = names[rid];
  if (!sp) continue;
  pieces.push({
    entity: leaf, ruid: rid, name: sp.name, kind: sp.kind, w: sp.w, h: sp.h, ny: sp.ny || 0,
    pos: tr.Position, scale: tr.Scale || { x: 1, y: 1 }, drawMode: sr.DrawMode || 0, tiled: sr.TiledSize || null,
    color: sr.Color || null, flipX: !!sr.FlipX, flipY: !!sr.FlipY, rot: tr.QuaternionRotation ? (2 * Math.atan2(tr.QuaternionRotation.z || 0, tr.QuaternionRotation.w ?? 1) * 180) / Math.PI : 0,
  });
}
const tiles = mb.component("RectTileMap", "MOD.Core.RectTileMapComponent").tileMap.filter((t) => t.tileIndex === 269).map((t) => [t.position.x, t.position.y]);
const base = id.replace(/_(nm|hell)$/, "");
const row = load("maps").find((m) => m.id === base);
const hm = require("../build/handmade/lib.cjs");
const bpWalls = [];
if (hm.hasBlueprint(base)) { const bp = hm.parseBlueprint(base); for (const [x, y] of bp.cells()) if (bp.isWall(x, y)) bpWalls.push([x, y]); }
fs.writeFileSync(outFile, JSON.stringify({ id, w: Number(row.w), h: Number(row.h), pieces, tiles, func, bpWalls }));
console.log(`${id}: 그림 ${pieces.length} · 충돌 칸 ${tiles.length} · 기능 자리 ${func.length} → ${outFile}`);
