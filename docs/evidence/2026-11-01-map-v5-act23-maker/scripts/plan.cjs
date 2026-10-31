// 액트 2·3 부딪혀 보기 대상 고르기 (오프라인) — 맵 파일 충돌 칸(tileIndex 269) + 빌더와 같은 계산의 장식 조각(art.pieces)
// 출력: plan.json (맵마다 후보 밀기 2개: 시작 칸·방향·예상 멈춤 좌표·근거)
"use strict";
const ROOT = "/Users/leeinguk/Desktop/hoho/잡으면 내편";
process.chdir(ROOT);
const fs = require("fs");
const path = require("path");
const hm = require(ROOT + "/tools/build/handmade/lib.cjs");
const roles = require(ROOT + "/tools/build/handmade/roles.cjs");
const maps = require(ROOT + "/tools/build/maps.cjs");
const { load, MapBuilder, quiet } = require(ROOT + "/tools/build/lib.cjs");
const A2 = "oasis dunes canyon stormwaste sunkenroad scorpnest1 scorpnest2 drywell kingtomb1 kingtomb2 archive vipernest temple1 temple2 temple3".split(" ");
const A3 = "harbor saltflat wreckcoast stormcliff drownedvillage crabcave1 crabcave2 wreckhold smuggler1 smuggler2 seachapel keeperhouse lighthouse1 lighthouse2 lighthouse3 stormeye".split(" ");
const mapRows = load("maps");
const ctx = maps.context();
const K = (x, y) => `${x},${y}`;
const out = {};
for (const id of [...A2, ...A3]) {
  const d = mapRows.find((m) => m.id === id);
  const bp = hm.parseBlueprint(id);
  const rows = hm.loadRows(id);
  const func = hm.functionalEntities(d, mapRows, ctx, rows);
  const art = quiet(() => hm.artEntities(d, ctx, bp, rows, func));
  const mb = MapBuilder.read(path.join(ROOT, "map", id + ".map"));
  const coll = new Set(mb.component("RectTileMap", "MOD.Core.RectTileMapComponent").tileMap.filter((t) => t.tileIndex === 269).map((t) => K(t.position.x, t.position.y)));
  const allTiles = new Set(mb.component("RectTileMap", "MOD.Core.RectTileMapComponent").tileMap.map((t) => K(t.position.x, t.position.y)));
  const open = (x, y) => allTiles.has(K(x, y)) && !coll.has(K(x, y));
  // 기능 자리(포털·웨이포인트·게이트·NPC) — 시작 칸이 이 근처면 안 됨
  const funcPos = [];
  for (const e of mb.listEntities()) {
    const n = e.path.split("/").pop();
    if (/^(Gate|Portal|Waypoint|Depth|TownBoard|Npc|ShopKeeper|Smith|Stash|Elder|Caravan|Merchant|Apothecary|Scholar|Captain|Harbormaster|KeeperDaughter)/.test(n)) {
      const t = mb.component(e.name, "MOD.Core.TransformComponent");
      if (t && t.Position) funcPos.push({ n, x: t.Position.x, y: t.Position.y });
    }
  }
  const nearFunc = (x, y, r) => funcPos.find((f) => Math.hypot(f.x - x, f.y - y) < r);
  const rowByXY = (p) => rows.find((r) => r.name === p.sprite && Math.abs(Number(r.x) - p.x) < 0.01 && Math.abs(Number(r.y) - p.y) < 0.01);
  const cands = [];
  for (const p of art.pieces) {
    if (!p.block || !p.cells.length || p.decal) continue;
    if (/entrance|stair|portal/.test(p.sprite)) continue;
    const role = roles.roleOf(p.sprite);
    const cellSet = new Set(p.cells.map(([a, b]) => K(a, b)));
    const r = rowByXY(p);
    const note = r ? `${r.note || ""}${r.args ? " [" + r.args + "]" : ""}` : "";
    const pri = (/landmark|_lm_|lm-/.test(p.sprite) ? 0 : role === "feature" ? 1 : role === "structure" ? 2 : 3) + (r && /손으로/.test(r.note || "") ? -0.5 : 0);
    // 네 방향 밀기: 조각 칸의 바깥 이웃이 열려 있고 그 방향으로 3칸 열린 줄
    const dirs = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };
    for (const [dn, [dx, dy]] of Object.entries(dirs)) {
      for (const [cx, cy] of p.cells) {
        // 밀기 방향으로 들어오는 면: (cx - dx, cy - dy)가 조각 밖이어야
        const fx = cx - dx, fy = cy - dy;
        if (cellSet.has(K(fx, fy))) continue;
        let ok = true;
        for (let i = 1; i <= 3; i++) if (!open(cx - dx * i, cy - dy * i)) ok = false;
        // 옆 칸(진행 방향 직각) 하나씩도 열려 있으면 더 좋다 (가장자리 문지름 방지) — 필수 아님
        if (!ok) continue;
        const sx = cx - dx * 3 + 0.5, sy = cy - dy * 3 + 0.5;
        if (nearFunc(sx, sy, 3.2)) continue;
        // 기대 멈춤: 위로 → cy - 0.01 · 아래로 → cy + 1.01 · 왼쪽 → cx + 1.01 · 오른쪽 → cx - 0.01
        const ex = dn === "left" ? cx + 1.01 : dn === "right" ? cx - 0.01 : sx;
        const ey = dn === "up" ? cy - 0.01 : dn === "down" ? cy + 1.01 : sy;
        const sideOpen = (dx === 0 ? [open(cx - 1, cy - dy), open(cx + 1, cy - dy)] : [open(cx - dx, cy - 1), open(cx - dx, cy + 1)]).filter(Boolean).length;
        cands.push({ piece: p.name, sprite: p.sprite, role, at: [p.x, p.y], cells: p.cells.length, note, pri, dir: dn, hit: [cx, cy], start: [sx, sy], expect: [Math.round(ex * 100) / 100, Math.round(ey * 100) / 100], sideOpen });
      }
    }
  }
  // 고르기: 서로 다른 조각 2개 (우선순위 · 위로 밀기 우선 · 옆 열림)
  const dirPri = { up: 0, left: 1, right: 1, down: 2 };
  cands.sort((a, b) => a.pri - b.pri || dirPri[a.dir] - dirPri[b.dir] || b.sideOpen - a.sideOpen || Math.abs(a.hit[0] + 0.5 - a.at[0]) - Math.abs(b.hit[0] + 0.5 - b.at[0]));
  const pick = [];
  for (const c of cands) { if (pick.length >= 2) break; if (pick.some((q) => q.piece === c.piece)) continue; pick.push(c); }
  // 두 번째는 가능하면 다른 방향(옆)으로
  out[id] = { pick, nCand: cands.length, funcPos, wp: funcPos.filter((f) => /^Waypoint/.test(f.n)) };
  console.log(id.padEnd(15), cands.length, pick.map((c) => `${c.piece} ${c.sprite}(${c.role}) ${c.dir} start=${c.start} exp=${c.expect} | ${c.note.slice(0, 40)}`).join("  ||  "));
}
fs.writeFileSync(path.join(__dirname, "plan.json"), JSON.stringify(out, null, 1));
