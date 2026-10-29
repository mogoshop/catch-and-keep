#!/usr/bin/env node
// I05 메이커 붙여 넣기 조각 만들기 — docs/evidence/2026-10-30-goal-C/DPS-maker-scripts.lua에서 블록을 꺼내 CFG 줄을 채운다 (Maker 실행은 하지 않는다).
// 사용:
//   node tools/dps/maker-blocks.cjs S00                         사전 점검 블록
//   node tools/dps/maker-blocks.cjs S10 15 magic boss 1 auto    장면 블록 (레벨 · 빌드 · 장면 · 반복 · auto|human)
//   node tools/dps/maker-blocks.cjs S90                         강제 마감 블록
//   node tools/dps/maker-blocks.cjs --queue [A|B|all]           실행 순서표 (A = 반복 1회 전체, B = 반복 2·3회)
//   node tools/dps/maker-blocks.cjs --check <luac>              모든 장면 조합을 luac -p로 문법 검사 (런타임 검증 아님)
//   node tools/dps/maker-blocks.cjs --dryrun <lua> [-v]         모든 장면 조합을 maker-dryrun.lua 대역으로 실행 (nil·오타·흐름 오류만)
'use strict';
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const FILE = path.join(__dirname, "..", "..", "docs", "evidence", "2026-10-30-goal-C", "DPS-maker-scripts.lua");
const LEVELS = [5, 15, 30];
const BUILDS = ["summon", "magic", "curse_mix"];
const SCENES = ["boss", "horde", "narrow", "ranged", "sustain60", "wipe"];
const INPUTS = ["auto", "human"];

function blocks() {
  const text = fs.readFileSync(FILE, "utf8");
  const out = {};
  let cur = null;
  for (const line of text.split("\n")) {
    const m = /^-- =+ \[(S\d\d)\]/.exec(line);
    if (m) {
      cur = m[1];
      out[cur] = [];
    }
    if (cur) out[cur].push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join("\n").trimEnd() + "\n";
  return out;
}

function scene(level, build, sceneName, rep, input) {
  if (!LEVELS.includes(Number(level)) || !BUILDS.includes(build) || !SCENES.includes(sceneName) || !INPUTS.includes(input)) {
    throw new Error("bad args: " + [level, build, sceneName, rep, input].join(" "));
  }
  const q = String.fromCharCode(39);
  const cfg = "local CFG = " + String.fromCharCode(123) + " level = " + Number(level) + ", build = " + q + build + q + ", scene = " + q + sceneName + q +
    ", rep = " + Number(rep) + ", input = " + q + input + q + " " + String.fromCharCode(125);
  const lines = blocks().S10.split("\n");
  const i = lines.findIndex((l) => l.startsWith("local CFG = "));
  if (i < 0) throw new Error("CFG line not found");
  lines[i] = cfg + "   -- maker-blocks.cjs가 채움";
  return lines.join("\n");
}

function queue(tier) {
  const rows = [];
  const reps = tier === "A" ? [1] : tier === "B" ? [2, 3] : [1, 2, 3];
  for (const level of LEVELS) {
    for (const rep of reps) {
      for (const sceneName of SCENES) {
        for (const build of BUILDS) {
          if (sceneName === "wipe" && build === "magic") continue;   // 소환을 쓰지 않는 빌드는 전멸 복구 해당 없음
          rows.push({ level, build, scene: sceneName, rep, input: "auto" });
        }
      }
    }
  }
  return rows;
}

function main(argv) {
  const cmd = argv[0];
  if (cmd === "S00" || cmd === "S90") return process.stdout.write(blocks()[cmd]);
  if (cmd === "S10") return process.stdout.write(scene(argv[1], argv[2], argv[3], argv[4] || 1, argv[5] || "auto"));
  if (cmd === "--queue") {
    const rows = queue(argv[1] || "A");
    rows.forEach((r, i) => console.log(String(i + 1).padStart(3) + "  S10 " + [r.level, r.build, r.scene, r.rep, r.input].join(" ") + "   label=L" + r.level + "-" + r.build + "-" + r.scene + "-r" + r.rep + "-" + r.input));
    console.log("합계 " + rows.length + "회 (레벨이 바뀔 때 플레이를 새로 시작 · 각 장면은 앞 장면의 [DPS-RUN] end 뒤)");
    return;
  }
  if (cmd === "--check") {
    const luac = argv[1];
    if (!luac) throw new Error("--check <luac 경로>");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dps-blocks-"));
    const all = [["S00", blocks().S00], ["S90", blocks().S90]];
    for (const level of LEVELS) for (const build of BUILDS) for (const sceneName of SCENES) all.push([[level, build, sceneName].join("-"), scene(level, build, sceneName, 1, "auto")]);
    let n = 0;
    for (const [name, code] of all) {
      const f = path.join(dir, name + ".lua");
      fs.writeFileSync(f, code);
      const r = spawnSync(luac, ["-p", f], { encoding: "utf8" });
      if (r.status !== 0) {
        console.log("FAIL " + name + "\n" + r.stderr);
        process.exitCode = 1;
      } else n += 1;
    }
    console.log("[maker-blocks] luac -p " + n + "/" + all.length + " 블록 문법 통과 (런타임 검증 아님)");
    return;
  }
  if (cmd === "--dryrun") {
    const lua = argv[1];
    if (!lua) throw new Error("--dryrun <lua 경로>");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dps-dry-"));
    let ok = 0;
    let total = 0;
    for (const level of LEVELS) for (const build of BUILDS) for (const sceneName of SCENES) for (const input of INPUTS) {
      total += 1;
      const f = path.join(dir, [level, build, sceneName, input].join("-") + ".lua");
      fs.writeFileSync(f, scene(level, build, sceneName, 1, input));
      const r = spawnSync(lua, [path.join(__dirname, "maker-dryrun.lua"), f], { encoding: "utf8" });
      const out = r.stdout + r.stderr;
      const done = /DRY OK/.test(out) && !/ERR\s|traceback/.test(out);
      const why = (out.match(/reason=\S+/) || ["reason=?"])[0];
      if (done) ok += 1;
      else { console.log("FAIL " + [level, build, sceneName, input].join(" ") + "\n" + out.split("\n").slice(-8).join("\n")); process.exitCode = 1; }
      if (argv.includes("-v")) console.log([level, build, sceneName, input].join(" ") + " " + (done ? "ok " : "fail ") + why);
    }
    console.log("[maker-blocks] 대역 실행 " + ok + "/" + total + " 장면 조합 오류 없음 (엔진 흉내 — Maker 실행 아님)");
    return;
  }
  console.error("사용: maker-blocks.cjs S00 | S90 | S10 <lv> <build> <scene> <rep> <auto|human> | --queue [A|B|all] | --check <luac>");
  process.exitCode = 2;
}

module.exports = { blocks, scene, queue };
if (require.main === module) main(process.argv.slice(2));
