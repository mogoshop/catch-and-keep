#!/usr/bin/env node
// 모델·맵 참조 검사 (메이커 없이). 지운 스크립트를 아직 붙이고 있는 모델처럼, 메이커에서 오류 없이 조용히 빠지는 문제를 막는다.
//   모델·맵 엔티티의 script.X → 스크립트 존재 / 맵 배치 modelId → 모델 존재
//   WarpGate.TargetMap → 맵 파일 / Waypoint.WaypointId → waypoints.csv / MonsterSpawner.Entries → 모델 id
//   MapAmbience.Bgm → sounds.csv 키 또는 RUID / 난이도 복제 맵이 모두 있는가
// 사용: node tools/check_assets.cjs
"use strict";
const fs = require("fs");
const path = require("path");
const { ModelBuilder, MapBuilder, EXT, quiet, load, num } = require("./build/lib.cjs");
const { walk } = require("./lib/mlua.cjs");

const ROOT = path.resolve(__dirname, "..");
const rel = (f) => path.relative(ROOT, f);
const problems = [];
const bad = (file, msg) => problems.push(`${rel(file)}: ${msg}`);

// 엔진이 기본으로 주는 모델 id (워크스페이스에 파일이 없다)
const ENGINE_MODELS = new Set(["mapempty", "maplemaplayer", "recttilemap", "tilemap", "sideviewrecttilemap", "player"]);

const scripts = new Set(walk(path.join(ROOT, "RootDesk/MyDesk"), ".mlua", []).map((f) => path.basename(f, ".mlua")));
const modelFiles = [...walk(path.join(ROOT, "Global"), EXT.model, []), ...walk(path.join(ROOT, "RootDesk"), EXT.model, [])];
const modelIds = new Set(ENGINE_MODELS);

quiet(() => {
  for (const f of modelFiles) {
    const s = ModelBuilder.snapshot(f);
    if (modelIds.has(s.model_id) && !ENGINE_MODELS.has(s.model_id)) bad(f, `모델 id '${s.model_id}' 중복`);
    modelIds.add(s.model_id);
    for (const c of s.components) if (c.startsWith("script.") && !scripts.has(c.slice(7))) bad(f, `${c} — 스크립트 없음`);
    for (const v of s.values) {
      const t = v.target_type || "";
      if (t.startsWith("script.") && !s.components.includes(t)) bad(f, `값 ${t}.${v.name} — 그 컴포넌트가 모델에 없음`);
    }
  }
});

const waypoints = new Set(load("waypoints").map((w) => w.id));
const sounds = new Set(load("sounds").map((r) => r.key));
const mapFiles = walk(path.join(ROOT, "map"), EXT.map, []);
const mapIds = new Set(mapFiles.map((f) => path.basename(f, EXT.map)));

quiet(() => {
  for (const f of mapFiles) {
    const map = MapBuilder.read(f);
    for (const e of map.listEntities()) {
      if (e.modelId && !modelIds.has(e.modelId)) bad(f, `${e.path} modelId '${e.modelId}' — 모델 없음`);
      for (const c of (e.componentNames || "").split(",")) {
        if (c.startsWith("script.") && !scripts.has(c.slice(7))) bad(f, `${e.path} ${c} — 스크립트 없음`);
      }
      const gate = map.component(e.path, "script.WarpGate");
      if (gate && gate.TargetMap && !mapIds.has(gate.TargetMap)) bad(f, `${e.path} WarpGate → '${gate.TargetMap}' 맵 없음`);
      const wp = map.component(e.path, "script.Waypoint");
      if (wp && !waypoints.has(wp.WaypointId || "camp")) bad(f, `${e.path} WaypointId '${wp.WaypointId}' — waypoints.csv에 없음`);
      const sp = map.component(e.path, "script.MonsterSpawner");
      if (sp) for (const entry of (sp.Entries || "").split(";").filter(Boolean)) {
        const id = entry.split(":")[0];
        if (!modelIds.has(id)) bad(f, `${e.path} 스포너 '${id}' — 모델 없음`);
      }
      const amb = map.component(e.path, "script.MapAmbience");
      if (amb && amb.Bgm && !sounds.has(amb.Bgm) && !/^[0-9a-f]{32}$/.test(amb.Bgm)) bad(f, `MapAmbience.Bgm '${amb.Bgm}' — sounds.csv 키도 RUID도 아님`);
    }
  }
});

// 난이도 복제 맵
const suffixes = load("difficulty").filter((d) => num(d.index) > 0).map((d) => d.mapSuffix);
for (const m of load("maps")) {
  if (!mapIds.has(m.id)) problems.push(`map/${m.id}${EXT.map}: maps.csv에 있는데 파일 없음 (node tools/build.cjs maps)`);
  if (m.kind === "instance") continue;
  for (const s of suffixes) if (!mapIds.has(m.id + s)) problems.push(`map/${m.id + s}${EXT.map}: 난이도 복제 없음`);
}

for (const p of problems) console.log(p);
console.log(`\n[check_assets] 모델 ${modelFiles.length}개 · 맵 ${mapFiles.length}개, 문제 ${problems.length}건`);
process.exitCode = problems.length ? 1 : 0;
