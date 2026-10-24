// 맵 그림 제자리 고치기: 다시 빌드하지 않고(벽·길 배치가 바뀌지 않게) 이미 만든 맵의 장식 크기와 바닥·길·벽 색만 데이터에 맞춘다.
//   node tools/build/art-patch.cjs [기준 커밋=HEAD]
//   · 장식(ArtProp*) 크기: art_scale.csv가 기준 커밋보다 바뀐 장식만 「새 배율 / 예전 배율」을 곱한다 (자리마다 섞은 ±12%는 그대로 남는다)
//   · 색: map_layouts.csv의 floorTint · roadTint (없으면 흰색) · tint(벽, 예전 값으로 나눈 뒤 새 값을 곱해 벽 속 어두운 배율은 남긴다)
// 10-24 사용자: 천막·배·탑 같은 큰 장식이 사람에 비해 작다 · 액트 3 바다 맵이 너무 무채색이다 (출시 전날 — 맵을 통째로 다시 만들지 않는다)
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { MapBuilder, load, num, list } = require("./lib.cjs");

const ROOT = path.join(__dirname, "..", "..");
const ref = process.argv[2] || "HEAD";
const { parse } = require("../lib/csv.cjs");
const csvAt = (name) => {
  const [head, ...rows] = parse(execSync(`git show ${ref}:data/${name}.csv`, { cwd: ROOT, encoding: "utf8" }));
  return rows.map((c) => Object.fromEntries(head.map((k, i) => [k, c[i]])));
};
const oldScale = Object.fromEntries(csvAt("art_scale").map((r) => [r.name, num(r.scale, 1)]));
const newScale = Object.fromEntries(load("art_scale").map((r) => [r.name, num(r.scale, 1)]));
const byRuid = Object.fromEntries(load("art_sprites").map((r) => [r.ruid, r.name]));
const oldLay = Object.fromEntries(csvAt("map_layouts").map((r) => [r.map, r]));
const newLay = Object.fromEntries(load("map_layouts").map((r) => [r.map, r]));
const rgb = (s) => (s || "1/1/1").split("/").map(Number);

const changed = Object.keys(newScale).filter((n) => (oldScale[n] || 1) !== newScale[n]);
let props = 0, colors = 0, files = 0;
for (const file of fs.readdirSync(path.join(ROOT, "map")).filter((f) => f.endsWith(".map"))) {
  const id = file.replace(/\.map$/, "");
  const base = id.replace(/_(nm|hell)$/, "");
  const b = MapBuilder.read(path.join("map", file));
  let touched = false;
  for (const e of b.listEntities()) {
    const name = String(e.path || e.name).split("/").pop();
    if (/^ArtProp\d+$/.test(name)) {
      const sr = b.component(name, "MOD.Core.SpriteRendererComponent");
      const art = sr && byRuid[typeof sr.SpriteRUID === "string" ? sr.SpriteRUID : (sr.SpriteRUID || {}).DataId];
      if (!art || !changed.includes(art)) continue;
      const tr = b.component(name, "MOD.Core.TransformComponent");
      const s = (tr && tr.Scale) || { x: 1, y: 1, z: 1 };
      const k = newScale[art] / (oldScale[art] || 1);
      const r3 = (v) => Math.round(v * 1000) / 1000;
      b.patchComponent(name, "MOD.Core.TransformComponent", { Scale: { "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(s.x * k), y: r3(s.y * k), z: s.z || 1 } });
      props++; touched = true;
    }
  }
  const o = oldLay[base], n = newLay[base];
  const same = (x, y) => (x || "") === (y || "");
  if (o && n && !(same(o.floorTint, n.floorTint) && same(o.roadTint, n.roadTint) && same(o.tint, n.tint))) {
    const [fr, fg, fb] = rgb(n.floorTint), [rr, rg, rb] = rgb(n.roadTint);
    const [or, og, ob] = rgb(o.tint), [wr, wg, wb] = rgb(n.tint);
    for (const e of b.listEntities()) {
      const name = String(e.path || e.name).split("/").pop();
      let c = null;
      if (name === "ArtFloor") c = { r: fr, g: fg, b: fb, a: 1 };
      else if (/^ArtRoad\d+$/.test(name)) c = { r: rr, g: rg, b: rb, a: 1 };
      else if (/^ArtWall\d+$/.test(name)) {
        const cur = (b.component(name, "MOD.Core.SpriteRendererComponent") || {}).Color || { r: or, g: og, b: ob };
        c = { r: cur.r / or * wr, g: cur.g / og * wg, b: cur.b / ob * wb, a: 1 };
      }
      if (c) { b.patchComponent(name, "MOD.Core.SpriteRendererComponent", { Color: c }); colors++; touched = true; }
    }
  }
  if (touched) { b.write(path.join("map", file)); files++; }
}
console.log(`[art-patch] 기준 ${ref} · 크기 바뀐 장식 ${changed.length}종 (${changed.join(", ")}) → 장식 ${props}개 · 색 ${colors}개 · 맵 ${files}개`);
