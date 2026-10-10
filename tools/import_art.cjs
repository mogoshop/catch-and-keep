// 코덱스 환경 그림 연결표(assets/<팩>/upload-environment-mapping.csv + resource-mapping.csv) → data/art_sprites.csv
// 맵 바닥·테두리·장식(data/map_art.csv)과 NPC 그림이 이름으로 찾는다. 이미 있는 다른 이름 행은 그대로 둔다.
//   node tools/import_art.cjs <팩 폴더> [--pivot <목록 파일>]
//   --pivot: 피벗 일괄 설정용 목록(guid,이름,subcategory,pivot_x,pivot_y,wrap)을 쓴다 → node tools/msw_mcp_call.cjs pivot <목록>
//     바닥·테두리 = 가운데 피벗 + Repeat (반복 그리기), 장식·NPC·효과 = 발밑 피벗
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data/art_sprites.csv");
const HEADER = "name,kind,w,h,ruid";

function parseCsv(text) {
  const [head, ...rows] = text.split(/\r?\n/).filter((l) => l !== "").map((l) => l.split(","));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

function main() {
  const args = process.argv.slice(2);
  const pack = args[0];
  if (!pack) throw new Error("사용법: node tools/import_art.cjs <팩 폴더> [--pivot <목록 파일>]");
  const pivotFile = args.includes("--pivot") ? args[args.indexOf("--pivot") + 1] : "";
  const up = parseCsv(fs.readFileSync(path.join(ROOT, pack, "upload-environment-mapping.csv"), "utf8"));
  const dims = Object.fromEntries(parseCsv(fs.readFileSync(path.join(ROOT, pack, "resource-mapping.csv"), "utf8")).map((r) => [r.RUID, r]));
  const names = new Set(up.map((r) => r.upload_name));
  const keep = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8").split("\n").slice(1).filter((l) => l && !names.has(l.split(",")[0])) : [];
  const rows = up.map((r) => {
    const d = dims[r.RUID] || {};
    if (!/^[0-9a-f]{32}$/.test(r.RUID)) throw new Error(`${r.upload_name}: RUID 없음`);
    return [r.upload_name, r.category, d.width || "", d.height || "", r.RUID].join(",");
  });
  fs.writeFileSync(OUT, [HEADER, ...keep, ...rows].join("\n") + "\n");
  console.log(`art_sprites.csv: ${rows.length}행 · 기존 ${keep.length}행 유지`);
  if (pivotFile) {
    const tiled = new Set(["floor", "border-atlas"]);
    const lines = up.map((r) => tiled.has(r.category) ? `${r.RUID},${r.upload_name},object,0.5,0.5,Repeat` : `${r.RUID},${r.upload_name},object,0.5,0,Clamp`);
    fs.writeFileSync(pivotFile, lines.join("\n") + "\n");
    console.log(`피벗 목록 ${lines.length}행 → ${pivotFile}`);
  }
}

main();
