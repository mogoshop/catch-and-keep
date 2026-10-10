// 코덱스 애니메이션 등록표(assets/<팩>/animation-registration.csv) → data/monster_frames.csv
// 클립을 메이커에서 만들지 않고 프레임 스프라이트를 FrameAnimator가 직접 재생한다 (클립 RUID가 있으면 그 동작은 클립).
//   node tools/import_frames.cjs <팩 폴더> <코덱스 entity=monsters.csv id,...>
//   예) node tools/import_frames.cjs assets/codex-act2-v1 jackal=jackal
// 이미 있는 다른 몬스터 행은 그대로 두고, 지정한 몬스터 행만 새로 쓴다.
"use strict";
const fs = require("fs");
const path = require("path");
const { load } = require("./lib/csv.cjs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data/monster_frames.csv");
const HEADER = "monster,state,frames,delays,loop,clip";

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === "") continue;
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    rows.push(out);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

function main() {
  const [pack, mapArg] = process.argv.slice(2);
  if (!pack || !mapArg) throw new Error("사용법: node tools/import_frames.cjs <팩 폴더> <entity=monster,...>");
  const map = Object.fromEntries(mapArg.split(",").map((p) => p.split("=")));
  const monsterIds = new Set(load("monsters").map((m) => m.id));
  for (const id of Object.values(map)) if (!monsterIds.has(id)) throw new Error(`monsters.csv에 '${id}' 없음`);
  const reg = parseCsv(fs.readFileSync(path.join(ROOT, pack, "animation-registration.csv"), "utf8"));
  const keep = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").split("\n").slice(1).filter((l) => l && !Object.values(map).includes(l.split(",")[0])) : [];
  const added = [];
  for (const r of reg) {
    const id = map[r.entity];
    if (!id) continue;
    const frames = r.ordered_sprite_RUIDs.split(";").filter(Boolean);
    const delays = r.ordered_frame_delay_seconds.split(";").filter(Boolean);
    if (frames.length === 0 || frames.length !== delays.length) throw new Error(`${r.entity} ${r.state}: 프레임·지연 수가 다름`);
    added.push([id, r.state, frames.join(";"), delays.join(";"), r.loop === "true" ? "true" : "false", r.animationclip_RUID || ""].join(","));
  }
  fs.writeFileSync(OUT, [HEADER, ...keep, ...added].join("\n") + "\n");
  console.log(`monster_frames.csv: ${added.length}행 추가 · 기존 ${keep.length}행 유지`);
}

main();
