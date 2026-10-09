#!/usr/bin/env node
// 출시 전 확인: 저장소 그대로의 상태에서만 출시한다 (docs/codex-claude-roles.md "Git·출시 규칙").
//   1) 작업 트리가 깨끗한가 (.claude/·AGENTS.md·CLAUDE.md 같은 도구 설정은 제외)
//   2) HEAD가 origin/main과 같은가 (푸시하지 않은 커밋·뒤처진 상태로 출시하지 않는다)
//   3) npm test 통과
// 사용: npm run release:check   (실패하면 이유를 출력하고 종료 코드 1)
"use strict";
const { execSync, spawnSync } = require("child_process");
const sh = (c) => execSync(c, { encoding: "utf8" }).trim();
const IGNORE = [/^\.claude\//, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.mcp\.json$/];
let failed = false;
const fail = (msg) => { failed = true; console.log("실패  " + msg); };

// Porcelain 상태 코드 앞 공백을 보존한다. trim()은 첫 경로의 첫 글자를 잘라낸다.
const dirty = execSync("git status --porcelain", { encoding: "utf8" }).split("\n").filter(Boolean)
  .map((l) => l.slice(3)).filter((p) => !IGNORE.some((r) => r.test(p)));
if (dirty.length > 0) {
  fail(`커밋하지 않은 변경 ${dirty.length}개 — 메이커 재저장분이면 'chore(maker)' 커밋으로 정리하거나 되돌린 뒤 출시`);
  dirty.slice(0, 12).forEach((p) => console.log("        " + p));
} else console.log("통과  작업 트리 깨끗함");

try { sh("git fetch -q origin"); } catch (e) { fail("origin을 가져오지 못함: " + e.message); }
const head = sh("git rev-parse HEAD"), main = sh("git rev-parse origin/main");
if (head !== main) fail(`HEAD(${head.slice(0, 7)})가 origin/main(${main.slice(0, 7)})과 다름 — 푸시/풀 후 출시`);
else console.log(`통과  HEAD = origin/main (${head.slice(0, 7)})`);

const test = spawnSync(process.execPath, ["tools/test.cjs"], { encoding: "utf8" });
if (test.status !== 0) fail("npm test 실패\n" + (test.stdout || "").split("\n").slice(-8).join("\n"));
else console.log("통과  npm test");

console.log(failed ? "\n[release:check] 출시하지 마세요" : `\n[release:check] 출시 가능 — 출시 커밋 ${head.slice(0, 7)}를 docs/ux-polish.json에 기록`);
process.exitCode = failed ? 1 : 0;
