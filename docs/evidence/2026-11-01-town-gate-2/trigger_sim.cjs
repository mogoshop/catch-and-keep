#!/usr/bin/env node
// 마을 남문 넘어가는 칸 오프라인 계산 (11-01 4-A) — WarpGate.Check와 같은 식을 맵 파일 값으로 돌린다 (메이커 아님 · 판정 식 대조용).
//   node docs/evidence/2026-11-01-town-gate-2/trigger_sim.cjs [맵 파일=map/town.map]
//   넘어감 = 원(반경 Radius) 안 또는 사각(|dx| ≤ TriggerBox.x · |dy| ≤ TriggerBox.y) 안. 서버 칸(충돌 타일)은 맵 파일 RectTileMap에서 읽는다.
//   ① 문 줄 세 칸(x −1·0·1)마다 북쪽(y −8.5)에서 아래로만 0.01씩 내려가며 처음 넘어가는 y와, 막힘 없이 그 y까지 내려올 수 있는가
//   ② 넘어가면 안 되는 자리(문 줄 위 y −9 줄 한가운데 · 양옆 막힌 칸 위 · 오른쪽 열린 칸 (4,−10))
//   ③ HUD 출구 안내(HudMap: 출구에서 max(1.8, Radius+0.8) 안 · 몬스터 없으면 표시) — 사각 구역 모든 점이 안내 거리 안인가
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const { MapBuilder } = require(path.join(ROOT, "tools/build/lib.cjs"));
const file = path.resolve(process.argv[2] || path.join(ROOT, "map/town.map"));
const m = MapBuilder.read(file);
const g = m.component("GateToField", "script.WarpGate");
const gp = m.component("GateToField", "MOD.Core.TransformComponent").Position;
const R = g.Radius ?? 0.6, B = g.TriggerBox || { x: 0, y: 0 }, box = B.x > 0 && B.y > 0;
const blocked = new Set();
for (const t of m.getTiles()) if (Number(t.tileIndex) === 269) blocked.add(`${t.position.x},${t.position.y}`);   // 269 = 충돌 타일 (빌더 TILE.wall)
const isBlocked = (x, y) => blocked.has(`${Math.floor(x)},${Math.floor(y)}`);
const inside = (x, y) => { const dx = x - gp.x, dy = y - gp.y; return Math.hypot(dx, dy) <= R || (box && Math.abs(dx) <= B.x && Math.abs(dy) <= B.y); };
const out = [];
out.push(`# 마을 남문 넘어가는 칸 계산 — ${path.basename(file)}`, "");
out.push(`- 포털 GateToField (${gp.x}, ${gp.y}) · 대상 ${g.TargetMap} · Radius ${R} · TriggerBox ${box ? `(${B.x}, ${B.y}) = x ${gp.x - B.x}~${gp.x + B.x} · y ${gp.y - B.y}~${gp.y + B.y}` : "없음(원만)"}`);
out.push(`- 맵 파일 막힘 타일 ${blocked.size}칸 · 문 줄 y −10: ${[-3, -2, -1, 0, 1, 2, 3, 4].map((x) => `${x}${isBlocked(x + 0.5, -9.5) ? "■" : "□"}`).join(" ")} (■ 막힘)`, "");
out.push("## ① 문 줄 세 칸에서 아래로만", "", "| 칸 | 내려오는 x | 처음 넘어가는 y | 그 y까지 막힘 | 결과 |", "|---|---|---|---|---|");
for (const [cell, xs] of [[-1, [-0.99, -0.5, -0.01]], [0, [0.01, 0.5, 0.99]], [1, [1.01, 1.5, 1.99]]]) for (const x of xs) {
  let hit = null, wall = null;
  for (let y = -8.5; y >= -9.99; y = Math.round((y - 0.01) * 100) / 100) { if (isBlocked(x, y)) { wall = y; break; } if (inside(x, y)) { hit = y; break; } }
  out.push(`| ${cell} | ${x} | ${hit === null ? "—" : hit} | ${wall === null ? "없음" : wall} | ${hit !== null ? "넘어감 ✅" : "못 넘어감 ❌"} |`);
}
out.push("", "## ② 넘어가면 안 되는 자리", "", "| 자리 | 넘어감 |", "|---|---|");
const neg = [["문 줄 위 y −9 줄 가운데 (x −0.5, y −8.5)", -0.5, -8.5], ["(0.5, −8.5)", 0.5, -8.5], ["(1.5, −8.5)", 1.5, -8.5], ["막힌 (−2,−10) 위 (−1.5, −9.0)", -1.5, -9.0], ["막힌 (2,−10) 위 (2.5, −9.0)", 2.5, -9.0], ["오른쪽 열린 칸 (4.5, −9.99)", 4.5, -9.99], ["왼쪽 (−3.5, −9.99)", -3.5, -9.99]];
let bad = 0;
for (const [n, x, y] of neg) { const v = inside(x, y); if (v) bad++; out.push(`| ${n} | ${v ? "넘어감 ❌" : "아님 ✅"} |`); }
let far = 0;
if (box) for (let x = gp.x - B.x; x <= gp.x + B.x + 1e-9; x += 0.05) for (let y = gp.y - B.y; y <= gp.y + B.y + 1e-9; y += 0.05) far = Math.max(far, Math.hypot(x - gp.x, y - gp.y));
const prompt = Math.max(1.8, R + 0.8);
out.push("", "## ③ HUD 출구 안내 「출구: … — 들어서면 이동」", "", `- 안내 거리 max(1.8, Radius+0.8) = ${prompt} · 사각 구역에서 출구까지 가장 먼 점 ${far.toFixed(3)} → ${far <= prompt ? "구역 전부 안내 거리 안 ✅" : "밖이 있음 ❌"} (마을엔 몬스터가 없어 전투 중 조건 Radius+0.4는 안 걸림)`);
out.push(`- 넘어가면 안 되는 자리에서 넘어감 ${bad}곳`);
console.log(out.join("\n"));
