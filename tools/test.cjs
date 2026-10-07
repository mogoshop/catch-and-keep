#!/usr/bin/env node
// 오프라인 테스트 묶음 (메이커 없이, 커밋 전에 돌린다). 하나라도 실패하면 종료 코드 1.
//   1. 생성 데이터가 CSV와 같은가        (gen_data --check)
//   2. 데이터 표 무결성                    (check_data)
//   3. 스크립트 교차 참조·ExecSpace        (check_scripts)
//   4. 모델·맵 참조                        (check_assets)
//   5. 검사기 자가 테스트                  (tests/fixtures: 일부러 틀린 코드의 "-- EXPECT" 줄을 정확히 잡는가)
//   6. --build: 빌드를 두 번 돌려 결과가 같은가 (멱등성, 파일을 다시 쓴다)
// 사용: node tools/test.cjs [--build]
// 메이커 안 런타임 검사는 RootDesk/MyDesk/Test/SelfTest.mlua (플레이 시작 시 "[SelfTest] 통과 n / 실패 m")
"use strict";
const { spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const node = (script, args = []) => spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
const results = [];

function step(name, fn) {
  let ok = false;
  let detail = "";
  try { [ok, detail] = fn(); } catch (e) { detail = e.stack || String(e); }
  results.push({ name, ok });
  console.log(`${ok ? "통과" : "실패"}  ${name}${detail ? "\n" + detail.trimEnd().split("\n").map((l) => "      " + l).join("\n") : ""}`);
}

function tool(script, args) {
  const r = node(script, args);
  const out = (r.stdout + r.stderr).trim();
  const last = out.split("\n").pop();
  return [r.status === 0, r.status === 0 ? last : out];
}

step("생성 데이터 최신", () => tool("gen_data.cjs", ["--check"]));
step("데이터 무결성", () => tool("check_data.cjs"));
step("스크립트 참조", () => tool("check_scripts.cjs"));
step("모델·맵 참조", () => tool("check_assets.cjs"));

step("검사기 자가 테스트", () => {
  const fixture = path.join(ROOT, "tests/fixtures/bad_scripts");
  const r = node("check_scripts.cjs", ["--root", fixture]);
  const found = new Set();
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/^(\S+\.mlua):(\d+)\s/);
    if (m) found.add(`${m[1]}:${m[2]}`);
  }
  const expected = new Set();
  for (const f of require("./lib/mlua.cjs").walk(path.join(fixture, "RootDesk/MyDesk"), ".mlua", [])) {
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/--\s*EXPECT\b/.test(l) && i > 0) expected.add(`${path.relative(fixture, f)}:${i + 1}`);
    });
  }
  const missed = [...expected].filter((x) => !found.has(x));
  const extra = [...found].filter((x) => !expected.has(x));
  const ok = missed.length === 0 && extra.length === 0 && expected.size > 0;
  return [ok, ok ? `기대 ${expected.size}건 모두 검출, 오탐 0` : `놓침 ${missed.join(" ")} / 오탐 ${extra.join(" ")}`];
});

if (process.argv.includes("--build")) {
  step("빌드 멱등성", () => {
    const dirs = ["map", "ui", "Global", "RootDesk/MyDesk/Models", "RootDesk/MyDesk/Data"];
    const hash = () => {
      const h = crypto.createHash("sha1");
      const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (!p.endsWith(".directory")) h.update(p).update(fs.readFileSync(p));
        }
      };
      for (const d of dirs) walk(path.join(ROOT, d));
      return h.digest("hex");
    };
    const b1 = node("build.cjs");
    if (b1.status !== 0) return [false, b1.stdout + b1.stderr];
    const first = hash();
    const b2 = node("build.cjs");
    if (b2.status !== 0) return [false, b2.stdout + b2.stderr];
    return [first === hash(), first === hash() ? "두 번째 빌드 결과가 첫 번째와 같다" : "두 번째 빌드에서 파일이 바뀌었다"];
  });
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n[test] ${results.length - failed}/${results.length} 통과`);
process.exitCode = failed ? 1 : 0;
