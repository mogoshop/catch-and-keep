#!/usr/bin/env node
// 바닥 시범 비교판 1단계 — 맵 파일에서 바닥 그림 조각(ArtFloor·ArtZone*)과 RectTileMap 칸을 JSON으로 꺼낸다 (MapBuilder 읽기 API만 · 맵을 쓰지 않는다)
// 사용: node export_floor.cjs <저장소 루트> <맵 파일> <출력 json>
"use strict";
const path = require("path");
const fs = require("fs");
const [,, root, mapFile, outJson] = process.argv;
const { MapBuilder } = require(path.join(root, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const log = console.log;
console.log = () => {};
let m;
try { m = MapBuilder.read(mapFile); } finally { console.log = log; }
const ents = m.listEntities();
const out = { map: path.basename(mapFile), pieces: [], tiles: [] };
for (const e of ents) {
  const nm = e.name || e.path.split("/").pop();
  if (!/^Art(Zone|Floor)/.test(nm)) continue;
  const sr = m.component(e.path, "MOD.Core.SpriteRendererComponent");
  if (!sr) continue;
  const tr = m.component(e.path, "MOD.Core.TransformComponent") || {};
  out.pieces.push({
    name: nm, ruid: typeof sr.SpriteRUID === "string" ? sr.SpriteRUID : (sr.SpriteRUID || {}).DataId,
    flipX: !!sr.FlipX, flipY: !!sr.FlipY, drawMode: sr.DrawMode, tiled: sr.TiledSize, color: sr.Color || null,
    pos: tr.Position, scale: tr.Scale || null,
  });
}
const tm = ents.find((e) => (e.name || "") === "RectTileMap" || e.path.endsWith("/RectTileMap"));
out.tiles = (m.component(tm.path, "MOD.Core.RectTileMapComponent").tileMap || []).map((t) => [t.position.x, t.position.y, t.tileIndex]);
fs.writeFileSync(outJson, JSON.stringify(out));
log(`${out.map}: 바닥 조각 ${out.pieces.length} · 칸 ${out.tiles.length}`);
