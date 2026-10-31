// 에셋 역할표 (맵 구성 v5 · data/handmade/asset_roles.csv — 1단계 레인 A 산출, 498행).
//   role: structure(반복 구조) · feature(특징, 공간당 1) · prop(소품, 묶음 ≤3) · floor(바닥·무늬) · unused  (`?` 접미 = 미확정, 그대로 쓴다)
//   base_cells: 역할이 정한 기준 크기 = 화면 높이 칸 (decor_collision.csv heightCells와 같은 잣대 — 「현재 4.29칸 → 기준 3칸」)
//   multOf(그림) = base_cells ÷ 지금 높이 칸 — v5 맵(;v5)에서만 빌더가 장식·세트 조각 배율에 곱한다 (포털 그림·겹친 빛·바닥 무늬는 1)
//   isPillar(그림): 1단계 검수표 정의 그대로 — 역할 structure이고 notes에 기둥·깃대·선돌·촛대·말뚝
"use strict";
const fs = require("fs");
const path = require("path");
const { parse } = require("../../lib/csv.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const FILE = path.join(ROOT, "data/handmade/asset_roles.csv");
const PILLAR_WORDS = ["기둥", "깃대", "선돌", "촛대", "말뚝"];
const MULT_RANGE = [0.5, 2.2];   // 표 값이 크게 어긋날 때의 안전 범위
let cache = null, heightCache = null;
const readCsv = (file) => {
  const rows = parse(fs.readFileSync(file, "utf8"));
  const h = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
};
function table() {
  if (!cache) {
    cache = {};
    for (const o of readCsv(FILE)) {
      o.sure = !o.role.endsWith("?");
      o.role = o.role.replace(/\?$/, "");
      o.base = Number(o.base_cells);
      cache[o.name] = o;
    }
  }
  return cache;
}
function heights() {
  if (!heightCache) { heightCache = {}; for (const o of readCsv(path.join(ROOT, "data/decor_collision.csv"))) heightCache[o.name] = o; }
  return heightCache;
}
const isDecal = (n) => /decal/.test(n);
const rowOf = (name) => table()[name] || null;
// 역할 (표에 없으면 바닥 무늬 = floor, 그 밖 = prop — 1단계 role_of와 같다)
function roleOf(name) { const r = rowOf(name); return r ? r.role : isDecal(name) ? "floor" : "prop"; }
function isPillar(name) { const r = rowOf(name); return !!r && r.role === "structure" && PILLAR_WORDS.some((w) => r.notes.includes(w)); }
// facing (10-31 표본 4차): north = 정면 그림(책장·제단·문·우리·관·탁자 …) → 위(북)벽 전용 · side = 옆 벽용(-v 그림) · any = 방향 없음(기둥·석상·화로)
function facingOf(name) { const r = rowOf(name); return (r && r.facing) || "any"; }
// 충돌 발 부분 비율: 서 있는 특징은 그림 높이의 아래 1/2, 반복 구조는 1/3 (윗부분은 걸어서 지나간다) · 소품·바닥은 발밑 한 줄
function footFrac(name) { const r = rowOf(name), role = roleOf(name); if (isDecal(name) || !r) return 0; return role === "feature" ? 0.5 : role === "structure" ? 1 / 3 : 0; }
function repeatOf(name) { const r = rowOf(name); return r ? r.repeat_rule : ""; }
function multOf(name) {
  if (isDecal(name)) return 1;
  const r = rowOf(name), hc = heights()[name];
  if (!r || !hc || ["floor", "unused"].includes(r.role) || ["portal", "overlay"].includes(hc.class)) return 1;
  const cur = Number(hc.heightCells);
  if (!(r.base > 0) || !(cur > 0)) return 1;
  return Math.round(Math.min(MULT_RANGE[1], Math.max(MULT_RANGE[0], r.base / cur)) * 1000) / 1000;
}
module.exports = { table, rowOf, roleOf, isPillar, repeatOf, multOf, facingOf, footFrac, PILLAR_WORDS, FILE };
