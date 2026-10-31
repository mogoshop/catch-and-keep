#!/usr/bin/env node
// 타일 4계층 표 (10-31 실플레이 피드백 C-4): data/handmade/tile_classes.csv — 맵마다 설계도 글자 → tile_class
//   guide   길 안내 (설계도 글자가 아니라 길 경로로 그린다 — 글자 칸 「(guide)」 한 줄로 적는다)
//   base    일반 바닥 (바탕 . · 그림 없는 구역 · 바탕과 같은 그림의 구역 · 표식 글자)
//   terrain 새 지형 (바탕과 다른 그림의 구역 · 길 글자)
//   block   통행 불가 (벽 글자) — 빌더는 이 계층만 충돌 칸(269)으로 짓는다
//   우선순위 guide > terrain > base (이음새 띠는 위 계층이 아래 칸으로 번진다), block은 따로.
//   node tools/build/handmade/tile_classes.cjs          빠진 맵·글자만 규칙대로 채워 쓴다 (있는 줄은 손댄 값으로 보고 그대로)
//   node tools/build/handmade/tile_classes.cjs --check  빠진 줄·남는 줄이 있으면 실패
"use strict";
const fs = require("fs");
const path = require("path");
const lib = () => require("./lib.cjs");   // lib.cjs가 이 파일을 부르므로 늦게 부른다
const { load } = require("../lib.cjs");
const { parse } = require("../../lib/csv.cjs");

const FILE = path.resolve(__dirname, "../../../data/handmade/tile_classes.csv");
const HEAD = ["map", "glyph", "tile_class", "note"];
const CLASSES = ["guide", "base", "terrain", "block"];

function read() {
  if (!fs.existsSync(FILE)) return [];
  const rows = parse(fs.readFileSync(FILE, "utf8"));
  const h = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
// 설계도 하나의 규칙 분류 → [{glyph, tile_class, note}]
function derive(id) {
  const bp = lib().parseBlueprint(id);
  const out = [{ glyph: "(guide)", tile_class: "guide", note: "길 안내 — 설계도 글자 아님 (decor.cjs 경로 곡선)" }];
  const baseArt = bp.base && bp.base.art;
  for (const [ch, z] of Object.entries(bp.zones)) {
    const same = !z.art || z.art === baseArt;
    // 맵 구성 v5 (;v5): 바탕 칸(.) = 골격 띠 = 길 안내 계층 (이음새는 띠가 위 · decor.cjs floorAt)
    if (bp.v5 && ch === ".") { out.push({ glyph: ch, tile_class: "guide", note: "v5 골격 띠 (바탕 바닥 · 구역 경계의 빈 띠)" }); continue; }
    out.push({ glyph: ch, tile_class: same ? "base" : "terrain", note: `구역 ${z.art || "(바탕)"} ${z.name}`.trim() });
  }
  for (const [ch, r] of Object.entries(bp.roads)) out.push({ glyph: ch, tile_class: "terrain", note: `길 ${r.art} ${r.name}`.trim() });
  for (const [ch, w] of Object.entries(bp.walls)) out.push({ glyph: ch, tile_class: "block", note: `벽 ${w.atlas} ${w.name}`.trim() });
  for (const ch of bp.markers) out.push({ glyph: ch, tile_class: "base", note: "표식 (바닥)" });
  return out;
}
let cache = null;
// 맵 id → { 글자: tile_class } (표에 없는 맵이면 null)
function classesOf(id) {
  if (!cache) {
    cache = {};
    for (const r of read()) (cache[r.map] = cache[r.map] || {})[r.glyph] = r.tile_class;
  }
  return cache[id] || null;
}

function main() {
  const check = process.argv.includes("--check");
  const have = read();
  const key = (r) => `${r.map}|${r.glyph}`;
  const known = new Map(have.map((r) => [key(r), r]));
  const ids = load("maps").filter((m) => lib().hasBlueprint(m.id)).map((m) => m.id);
  const rows = [], missing = [], bad = [];
  for (const id of ids) for (const r of derive(id)) {
    const k = `${id}|${r.glyph}`;
    if (known.has(k) && !(r.tile_class === "guide" && known.get(k).tile_class !== "guide")) { rows.push(known.get(k)); known.delete(k); }   // v5 띠(.)는 손댄 값보다 규칙이 먼저
    else if (known.has(k)) { known.delete(k); rows.push(Object.assign({ map: id }, r)); }
    else { missing.push(k); rows.push(Object.assign({ map: id }, r)); }
  }
  for (const r of rows) if (!CLASSES.includes(r.tile_class)) bad.push(`${key(r)} '${r.tile_class}'`);
  const extra = [...known.keys()];
  if (check) {
    const msg = [...missing.map((k) => "빠짐 " + k), ...extra.map((k) => "남음 " + k), ...bad.map((k) => "계층 이름 " + k)];
    if (msg.length) { console.log(msg.slice(0, 20).join("\n")); process.exit(1); }
    console.log(`[tile_classes] 맵 ${ids.length} · 줄 ${rows.length} · 문제 0`);
    return;
  }
  const cell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(FILE, [HEAD.join(","), ...rows.map((r) => HEAD.map((h) => cell(r[h])).join(","))].join("\n") + "\n");
  console.log(`[tile_classes] 맵 ${ids.length} · 줄 ${rows.length} (새로 ${missing.length} · 지움 ${extra.length})`);
}

if (require.main === module) main();
module.exports = { classesOf, derive, CLASSES, FILE };
