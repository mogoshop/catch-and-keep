// 맵 구성 검사기 자가 테스트 입력 만들기 — node tests/quality/map_composition/make_fixtures.cjs (이 폴더에 *.json을 다시 쓴다)
//   40×16 가짜 맵: 서쪽 마당 a · 동쪽 마당 b · 북서 곁방 c(문 하나) · 띠(줄 8 골격 + 위·아래 3칸씩 엇갈려 덧댐) · 특징 2 · 열주 2열 · 소품 묶음.
//   00-clean은 모든 항목 0, 나머지는 위반 하나씩을 심고 (14-diagonal은 24×16 따로) expect에 기대 수를 적는다 (tools/check_map_composition.cjs --selftest가 비교).
"use strict";
const fs = require("fs"), path = require("path");
const OUT = process.argv[2] || __dirname;
const W = 40, H = 16;
function base() {
  const g = Array.from({ length: H }, () => Array(W).fill("#"));
  for (let r = 1; r < H - 1; r++) for (let c = 1; c < W - 1; c++) g[r][c] = c <= 19 + (Math.floor(r / 3) % 2) ? "a" : "b";
  // 곁방 c (북서) — 벽 줄 4에 문 하나
  for (let r = 1; r <= 4; r++) for (let c = 1; c <= 12; c++) g[r][c] = "#";
  for (let r = 1; r <= 3; r++) for (let c = 3; c <= 10; c++) g[r][c] = "c";
  g[4][6] = "c";
  // 띠: 줄 8 골격 + 위(7)·아래(9) 3칸씩 엇갈려 덧댐
  const pat = [];
  while (pat.length < W + 8) pat.push(1, 1, 1, 0, -1, -1, -1, 0);
  for (let c = 1; c <= W - 2; c++) { g[8][c] = "."; const s = pat[c - 3]; if (s && c > 2 && c < W - 3) g[8 - s][c] = "."; }
  g[8][0] = "W"; g[8][W - 1] = "E";
  g[7][12] === "." ? (g[9][12] = "S") : (g[7][12] = "S");
  return g;
}
const wx = (c) => c - W / 2 + 0.5, wy = (r) => H / 2 - r + 0.5;
const cleanPieces = () => [
  { s: "a2-landmark-sun-disc-altar", x: wx(6), y: wy(11) },   // 정면 그림 — 벽에서 4칸 (서 있는 것)
  { s: "a4-landmark-sulfur-geyser", x: wx(34), y: wy(12) },
  { s: "a2-broken-urns", x: wx(8), y: wy(12) }, { s: "a2-adjunct-censer-base", x: wx(9), y: wy(13) },
  ...[22, 25.5, 29].flatMap((c) => [{ s: "temple-column", x: c - W / 2, y: 3.3 }, { s: "temple-column", x: c - W / 2, y: -3.3 }]),
];
const zones = { ".": { art: null, name: "바탕" }, a: { art: "fake-floor-a", tint: "0.8/0.7/0.6", name: "서쪽 마당" }, b: { art: "fake-floor-b", tint: "0.7/0.7/0.8", name: "동쪽 마당" }, c: { art: "fake-floor-c", tint: "0.6/0.6/0.6", name: "곁방" }, d: { art: "fake-floor-d", tint: "0.9/0.6/0.5", name: "네모 패치" } };
const save = (name, g, pieces, expect, extra = {}) => fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(Object.assign({ note: extra.note || "", grid: g.map((r) => r.join("")), zones, base: { art: "fake-base", tint: "1/1/1" }, walls: ["#"], markers: "WEGXHTS", guide: 0, pieces: pieces.map((p, i) => Object.assign({ name: `P${i + 1}`, decal: false, block: true }, p)), expect }, extra.json || {}), null, 1));
save("00-clean", base(), cleanPieces(), {}, { note: "깨끗한 입력 — 모든 항목 0 (오탐 검사)" });
save("01-guide", base(), cleanPieces(), { guide: 3 }, { note: "길 안내 도장 3개", json: { guide: 3 } });
{ const g = base(); for (let r = 7; r <= 9; r++) for (let c = 15; c <= 17; c++) g[r][c] = "."; save("02-width", g, cleanPieces(), { bandWidth: 1 }, { note: "띠 3×3 덩어리 (폭 3)" }); }
{ const g = base(); for (let r = 7; r <= 9; r++) g[r][24] = "b"; save("03-break", g, cleanPieces(), { bandBreak: 2 }, { note: "띠 끊김 — 덩어리 2개(+1) · 출구 못 닿음(+1)" }); }
{ const g = base(); for (let c = 19; c <= 21; c++) { g[7][c] = "."; g[9][c] = "."; } g[8][20] = "b"; save("04-loop", g, cleanPieces(), { bandLoop: 1 }, { note: "띠가 구역 한 칸을 둘러쌈 (고리 1)" }); }
{ const g = base(); for (let r = 5; r <= 7; r++) g[r][15] = "."; save("05-deadend", g, cleanPieces(), { bandDeadEnd: 1 }, { note: "띠에서 북쪽으로 막다른 곁길" }); }
{ const g = base(); for (let r = 11; r <= 13; r++) for (let c = 3; c <= 11; c++) g[r][c] = "d"; save("06-straight", g, cleanPieces().filter((p) => !(p.x < -10 && p.y < -2)).concat([{ s: "a2-landmark-sun-disc-altar", x: wx(6), y: wy(5) }]), { straightEdge: 2 }, { note: "네모 패치 위·아래 변 9칸 직선" }); }
save("07-scatter", base(), cleanPieces().concat([{ s: "a2-adjunct-golden-mask-fragments", x: wx(4), y: wy(11) }, { s: "a2-adjunct-golden-mask-fragments", x: wx(15), y: wy(12) }, { s: "a2-adjunct-golden-mask-fragments", x: wx(30), y: wy(5) }]), { scattered: 3 }, { note: "같은 소품 3개 산발" });
save("08-feature2", base(), cleanPieces().concat([{ s: "a2-landmark-golden-mask-wall", x: wx(17), y: wy(12) }]), { featureSpace: 1 }, { note: "서쪽 마당에 특징 2개 (16×16 구역은 다름)" });
save("09-landmark", base(), cleanPieces().concat([{ s: "a2-landmark-golden-mask-wall", x: wx(8), y: wy(2) }]), { landmarkBlock: 1 }, { note: "다른 공간이지만 같은 16×16 구역에 특징 2개" });
save("10-pillar", base(), cleanPieces().concat([{ s: "wind-stele", x: wx(15), y: wy(4) }]), { pillarSingle: 1 }, { note: "낱개 선돌" });
{ const g = base(); g[4][9] = "c"; save("11-branch", g, cleanPieces(), { branchExtra: 1 }, { note: "곁방에 문 둘 (가지 1개 · 추가 연결 1 > 50%)" }); }
{ const g = base(); for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === "S") g[r][c] = "a"; g[12][14] = "S"; save("12-waypoint", g, cleanPieces(), { waypoint: 1 }, { note: "웨이포인트가 띠에서 떨어짐" }); }
{ const z = JSON.parse(JSON.stringify(zones)); z.b = { art: null, name: "바탕과 같은 마당" }; const g = base(); fs.writeFileSync(path.join(OUT, "13-empty.json"), JSON.stringify({ note: "동쪽 마당이 띠와 같은 바닥 — 띠 양옆 빈 바닥 2곳", grid: g.map((r) => r.join("")), zones: z, base: { art: "fake-base", tint: "1/1/1" }, walls: ["#"], markers: "WEGXHTS", guide: 0, pieces: cleanPieces().map((p, i) => Object.assign({ name: `P${i + 1}`, decal: false, block: true }, p)), expect: { bandEdgeEmpty: 2 } }, null, 1)); }
{ // 45° 계단 경계: 서쪽 마당 a 안에 대각선으로 잘린 패치 d (계단 10칸 · 한 경계 = 1건)
  const g = Array.from({ length: 16 }, (_, r) => Array.from({ length: 24 }, (_, c) => (r === 0 || c === 0 || r === 15 || c === 23 ? "#" : c - r > 6 ? "d" : "a")));
  fs.writeFileSync(path.join(OUT, "14-diagonal.json"), JSON.stringify({ note: "한 칸씩 고른 45° 계단 경계 (화면에서 비스듬한 직선)", grid: g.map((r) => r.join("")), zones, base: { art: "fake-base", tint: "1/1/1" }, walls: ["#"], markers: "WEGXHTS", guide: 0, pieces: [], expect: { straightEdge: 1 } }, null, 1));
}
save("17-featurepass", base(), cleanPieces().concat([{ s: "a2-landmark-golden-mask-wall", x: wx(30), y: wy(5), block: false }]).filter((p) => p.s !== "a4-landmark-sulfur-geyser"), { featurePass: 1 }, { note: "서 있는 특징인데 막지 않음" });
save("18-passwidth", base(), cleanPieces(), { passWidth: 1 }, { note: "장식 발밑이 띠 위아래를 막아 너비 1칸", json: { blocked: ["20,7", "20,9", "20,6", "20,10"] } });
save("19-reach", base(), cleanPieces(), { spaceReach: 1 }, { note: "곁방 문 칸을 장식이 막음", json: { blocked: ["6,4"] } });
save("20-facing", base(), cleanPieces().concat([{ s: "bookshelf", x: wx(1), y: wy(12) }]), { facing: 1 }, { note: "정면 그림(책장)을 서쪽 벽에" });
save("21-rowgap", base(), cleanPieces().concat([22, 25, 30].map((c) => ({ s: "broken-column", x: wx(c), y: wy(14) }))), { rowGap: 1 }, { note: "벽 따라 한 줄 간격 3·5칸" });
save("22-rowflip", base(), cleanPieces().concat([22, 25, 28].map((c, i) => ({ s: "wind-stele", x: wx(c), y: wy(14), flip: i === 1 }))), { rowFlip: 1 }, { note: "한 줄 가운데 하나만 뒤집힘" });
save("23-behindwall", base(), cleanPieces().concat([{ s: "bookshelf", x: wx(8), y: wy(7) }]).map((p) => p), { behindWall: 1 }, { note: "북벽 정면 책장 뒤(벽까지) 걷는 칸 1", json: {} });
save("15-seam", base(), cleanPieces(), { seamAlpha: 3 }, { note: "반투명 이음새 조각 3개 (ArtBand·ArtCorner)", json: { seams: 3 } });
{ // v5 keep (바닥 보존형): 길 글자 띠가 3칸 폭이어도 띠 폭·구역 경계는 재지 않는다 — 골격(입구→출구 최단)·웨이포인트만
  const g = base(); for (let c = 1; c <= W - 2; c++) for (let r = 7; r <= 9; r++) if (g[r][c] !== "S") g[r][c] = "=";
  save("16-keep", g, cleanPieces(), {}, { note: "v5 keep: 3칸 큰길이 그대로 있어도 위반 아님 (깨끗한 입력)", json: { v5keep: true, roads: { "=": { art: "fake-road", tint: "1/1/1" } } } });
}
console.log("ok");
