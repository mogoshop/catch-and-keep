// 마을 남문 통로 폭·서버 칸 BFS (11-01 남문 레인 증거)
//   서버가 걷게 하는 칸 = 설계도 바닥(bp.isFloor) − .map 충돌 타일(269) · 4방향 BFS (tools/route_lengths.cjs와 같은 이웃 규칙 · 거기에 장식 충돌 칸만 더 뺀다)
//   사용: node tools/preview/export_map.cjs town <전.json> <HEAD town 맵 파일>
//         node tools/preview/export_map.cjs town <후.json>   (town_nm·town_hell도 같은 꼴로 뽑아 뒤에 붙이면 충돌 칸 일치를 본다)
//         node docs/evidence/2026-11-01-town-gate/gate_bfs.cjs <전.json> <후.json> [<후 nm.json> <후 hell.json>]
"use strict";
const fs = require("fs"), path = require("path");
const hm = require(path.resolve(__dirname, "../../../tools/build/handmade/lib.cjs"));
const files = process.argv.slice(2);
if (files.length < 2) throw new Error("사용: gate_bfs.cjs <전.json> <후.json> [추가 후.json…]");
const K = (x, y) => x + "," + y;
const G = [0, -10], ARR = [0, -2];   // G = 마을 출구 GateToField (0.5,-9.5) 칸 · ARR = 황무지 GateBack 도착 (0,-1.6) 칸
const XS = [...Array(13)].map((_, i) => i - 6), YS = [...Array(7)].map((_, i) => -5 - i);
function state(file) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const bp = hm.parseBlueprint(d.id.replace(/_(nm|hell)$/, ""));
  const solid = new Set(d.tiles.map(([x, y]) => K(x, y)));
  const bpWall = new Set(d.bpWalls.map(([x, y]) => K(x, y)));
  const artBlocked = [...solid].filter((k) => !bpWall.has(k)).map((k) => k.split(",").map(Number)).filter(([x, y]) => bp.isFloor(x, y));
  const open = (x, y) => bp.isFloor(x, y) && !solid.has(K(x, y));
  const dist = new Map([[K(G[0], G[1]), 0]]), q = [G];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = K(nx, ny); if (dist.has(k) || !open(nx, ny)) continue; dist.set(k, dist.get(K(x, y)) + 1); q.push([nx, ny]); }
  }
  const floorOpen = bp.cells().filter(([x, y]) => open(x, y)).length;
  return { d, bp, solid, open, artBlocked, dist, floorOpen };
}
const run = (s, y) => { if (!s.open(0, y)) return null; let l = 0, r = 0; while (s.open(l - 1, y)) l--; while (s.open(r + 1, y)) r++; return [l, r]; };
const fmt = (sp) => (sp ? `${sp[1] - sp[0] + 1}칸 (x ${sp[0]}~${sp[1]})` : "0칸");
const grid = (s, label) => {
  const out = [`## ${label} — ${s.d.id} 남문 둘레 (# 벽 · X 장식 막힘 · G 출구 포털 칸 · . 열린 칸)`, "```", "  y\\x " + XS.map((x) => String(x).padStart(3)).join("")];
  for (const y of YS) out.push(String(y).padStart(4) + " " + XS.map((x) => "  " + (x === G[0] && y === G[1] ? "G" : !s.bp.isFloor(x, y) ? "#" : s.solid.has(K(x, y)) ? "X" : ".")).join(""));
  out.push("```");
  return out;
};
const [B, A, ...more] = files.map(state);
const out = ["# 마을 남문 서버 칸 BFS — 전(HEAD 8558cf5b) · 후(이 레인)", ""];
out.push(...grid(B, "전"), "", ...grid(A, "후"), "");
out.push("## 문 줄 열린 폭 (x 0을 지나는 가로 연속 열린 칸)", "", "| 줄 | 전 | 후 |", "|---|---|---|");
for (const y of [-10, -9, -8]) out.push(`| y ${y} | ${fmt(run(B, y))} | ${fmt(run(A, y))} |`);
out.push("", "## 문 칸 (y −10) 하나씩", "", "| 칸 | 전 | 후 |", "|---|---|---|");
for (const x of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) out.push(`| (${x},−10) | ${B.open(x, -10) ? "열림" : "막힘"} | ${A.open(x, -10) ? "열림" : "막힘"} |`);
const set = (s) => new Set(s.artBlocked.map(([x, y]) => K(x, y)));
const sb = set(B), sa = set(A), only = (p, q) => [...p].filter((k) => !q.has(k)).map((k) => `(${k})`).join(" ") || "없음";
out.push("", "## 장식 막힘 칸 차이 (설계도 바닥 위 충돌 칸)", "", `- 전에만 막힘(이번에 엶): ${only(sb, sa)}`, `- 후에만 막힘(이번에 막음): ${only(sa, sb)}`, `- 장식 막힘 칸 수: 전 ${sb.size} → 후 ${sa.size}`);
out.push("", "## G(0,−10)에서 4방향 BFS", "", "| | 전 | 후 |", "|---|---|---|");
out.push(`| 열린 바닥 칸 | ${B.floorOpen} | ${A.floorOpen} |`);
out.push(`| G에서 닿는 칸 | ${B.dist.size} | ${A.dist.size} |`);
out.push(`| 못 닿는 열린 칸 | ${B.floorOpen - B.dist.size} | ${A.floorOpen - A.dist.size} |`);
out.push(`| G → 황무지 도착 자리 (0,−2) 걸음 | ${B.dist.get(K(...ARR))} | ${A.dist.get(K(...ARR))} |`);
const far = (s) => Math.max(...s.dist.values());
out.push(`| G에서 가장 먼 칸 걸음 | ${far(B)} | ${far(A)} |`);
const diffD = [...A.dist].filter(([k, v]) => B.dist.has(k) && B.dist.get(k) !== v).map(([k, v]) => `(${k}) ${B.dist.get(k)}→${v}걸음`);
out.push("", `- 전·후 둘 다 닿는 칸 중 G 걸음 수가 달라진 칸: ${diffD.length}${diffD.length ? " — " + diffD.join(" · ") : ""}`);
for (const s of more) {
  const same = s.solid.size === A.solid.size && [...s.solid].every((k) => A.solid.has(k));
  out.push(`- ${s.d.id}: 충돌 칸 ${s.solid.size} · ${A.d.id} 후와 ${same ? "같음" : "다름"} · G에서 닿는 칸 ${s.dist.size}/${s.floorOpen} · 도착 자리 ${s.dist.get(K(...ARR))}걸음`);
}
console.log(out.join("\n"));
