#!/usr/bin/env node
// 맵 파일 두 개를 엔티티 단위로 비교한다 (11-01 마을 남문 2차 증거 — 바뀐 엔티티가 남문 둘레뿐인지).
//   node docs/evidence/2026-11-01-town-gate-2/map_diff.cjs <전.map> <후.map>
// 찍는 것: 추가·삭제 엔티티 · 내용이 바뀐 엔티티(계층 순서 번호 displayOrder 말고 다른 칸이 바뀐 것)와 그 자리 ·
//   displayOrder만 바뀐 엔티티 수와 「기존 엔티티끼리 순서가 그대로인가」 · 타일(RectTileMap)·맵 머리 같음 여부
"use strict";
const fs = require("fs");
const [fa, fb] = process.argv.slice(2);
if (!fa || !fb) throw new Error("사용: map_diff.cjs <전.map> <후.map>");
const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const A = load(fa), B = load(fb);
const js = (e) => (typeof e.jsonString === "string" ? JSON.parse(e.jsonString) : e.jsonString);
const ents = (m) => new Map(m.ContentProto.Entities.map((e) => [e.path, e]));
const EA = ents(A), EB = ents(B);
const flat = (o, p = "", out = {}) => {
  if (o && typeof o === "object") for (const k of Object.keys(o)) flat(o[k], p ? `${p}.${k}` : k, out);
  else out[p] = o;
  return out;
};
const posOf = (e) => { const t = (js(e)["@components"] || []).find((c) => c["@type"] === "MOD.Core.TransformComponent"); return t ? `(${t.Position.x}, ${t.Position.y})` : "-"; };
const added = [...EB.keys()].filter((k) => !EA.has(k));
const removed = [...EA.keys()].filter((k) => !EB.has(k));
const content = [], orderOnly = [];
for (const [k, ea] of EA) {
  if (!EB.has(k)) continue;
  const x = flat(ea), y = flat(EB.get(k));
  const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((q) => x[q] !== y[q]);
  if (!keys.length) continue;
  const real = keys.filter((q) => !/(^|\.)displayOrder$/.test(q));
  if (real.length) content.push({ k, pos: posOf(EB.get(k)), d: real.map((q) => `${q}: ${JSON.stringify(x[q])} → ${JSON.stringify(y[q])}`) });
  else orderOnly.push(k);
}
// 기존 엔티티끼리 displayOrder 순서가 그대로인가
const ord = (E) => [...E.values()].filter((e) => EA.has(e.path) && EB.has(e.path)).sort((p, q) => js(p).displayOrder - js(q).displayOrder).map((e) => e.path).join("|");
const sameOrder = ord(EA) === ord(EB);
const shift = orderOnly.map((k) => js(EB.get(k)).displayOrder - js(EA.get(k)).displayOrder);
const head = (m) => { const c = JSON.parse(JSON.stringify(m)); delete c.ContentProto.Entities; return JSON.stringify(c); };
console.log(`엔티티 ${EA.size} → ${EB.size} · 맵 머리(엔티티 밖) 같음 ${head(A) === head(B)}`);
console.log(`추가 ${added.length}: ${added.map((k) => `${k} ${posOf(EB.get(k))}`).join(" · ") || "-"}`);
console.log(`삭제 ${removed.length}: ${removed.join(" · ") || "-"}`);
console.log(`내용 바뀜 ${content.length}:`);
for (const c of content) { console.log(`  ${c.k} ${c.pos}`); for (const d of c.d) console.log(`    ${d}`); }
console.log(`계층 순서 번호(displayOrder)만 바뀜 ${orderOnly.length} · 차이 ${[...new Set(shift)].join(",") || "-"} · 기존 엔티티끼리 순서 그대로 ${sameOrder}`);
