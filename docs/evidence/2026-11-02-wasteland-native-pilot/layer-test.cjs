#!/usr/bin/env node
// 기획 61 단계 1 — 맵 레이어 시험 맵 만들기 (격리 · 원본 map/wasteland 불변 · 그림 0)
//   node docs/evidence/2026-11-02-wasteland-native-pilot/layer-test.cjs        → map/layertest61.map (wasteland 사본 + 맵 레이어 2 + RectTileMap 2)
//   node docs/evidence/2026-11-02-wasteland-native-pilot/layer-test.cjs --rm   → 시험 맵 삭제 (끝나면 메이커 refresh)
// 시험 내용: 큰길(y 0.5) 위 x -24~-19 · y -1~1 칸(6×3)을 레이어 2(RectTileMap2 · SortingLayer MapLayer1) 바닥 타일(266)로 칠하고,
//   그 북쪽 (-21.5, 2.1)에 키 큰 석상 하나를 레이어 2(MapLayer1/0)에, 비교용 같은 석상을 (-27.5, 2.1) 레이어 1(MapLayer0/0)에 둔다.
//   메이커에서 아바타를 그 칸 안팎으로 걸리며 AvatarRendererComponent.SortingLayer / OrderInLayer를 [VRF]로 찍는다 (probe-layer.lua).
//   판정 A: 레이어 2 칸 위에서 SortingLayer가 MapLayer1로 바뀐다 · 판정 B: Default 고정 (지금 -top 방식이 엔진 한계 안의 정답)
// 시험 맵은 데이터(maps.csv)에 넣지 않는다 → 게임 방 목록(GameRoomMaps)에 실리지 않음. 메이커에서 서버 스크립트로 인스턴스 방을 만들어 들어간다.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const NAME = "layertest61";
const OUT = path.join(ROOT, "map", NAME + ".map");
if (process.argv.includes("--rm")) {
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
  console.log("removed", path.relative(ROOT, OUT));
  process.exit(0);
}
const STATUE = "c0a76fa0565a45198a36ac4ba6ca144e";   // a1-headless-king-statue (art_sprites.csv · 220×300 · 발 피벗)
const map = MapBuilder.fromTemplate(path.join(ROOT, "map/wasteland.map"), NAME);
if (map.find("Spawner")) map.remove("Spawner");   // MapInfo가 없는 맵이라 몬스터 생성기는 뺀다
const tileSet = map.component("RectTileMap", "MOD.Core.RectTileMapComponent").TileSetRUID;
const cells = [];
for (let y = -1; y <= 1; y++) for (let x = -24; x <= -19; x++) cells.push({ type: 0, position: { x, y }, tileIndex: 266 });
map.entity("MapleMapLayer2", [
  { "@type": "MOD.Core.MapLayerComponent", IsVisible: true, LayerSortOrder: 1, Locked: false, MapLayerName: "Layer2", Thumbnail: "", Enable: true },
], { modelId: "maplemaplayer" });
map.entity("RectTileMap2", [
  { "@type": "MOD.Core.TransformComponent", Position: { x: 0, y: 0, z: 999 }, QuaternionRotation: { x: 0, y: 0, z: 0, w: 1 }, Enable: true },
  { "@type": "MOD.Core.RectTileMapComponent", SortingLayer: "MapLayer1", TileSetRUID: tileSet, Enable: true, tileMap: cells },
], { modelId: "recttilemap" });
const statue = (name, x, layer) => map.entity(name, [
  { "@type": "MOD.Core.TransformComponent", Position: { x, y: 2.1, z: 0 }, QuaternionRotation: { x: 0, y: 0, z: 0, w: 1 }, Scale: { x: 0.8, y: 0.8, z: 1 }, Enable: true },
  { "@type": "MOD.Core.SpriteRendererComponent", SpriteRUID: STATUE, SortingLayer: layer, OrderInLayer: 0, DrawMode: 0, Color: { r: 1, g: 1, b: 1, a: 1 }, Enable: true },
], { modelId: "mapobject" });
statue("LayerTestStatueL2", -21.5, "MapLayer1");
statue("LayerTestStatueL1", -27.5, "MapLayer0");
map.write(OUT);
const info = map.getMapInfo();
console.log(`wrote ${path.relative(ROOT, OUT)} · TileMapMode ${info.TileMapMode} · entities ${info.entityCount} · layer2 cells ${cells.length}`);
