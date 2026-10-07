#!/usr/bin/env node
// 스크립트 정적 검사 (메이커 없이). 메이커 LSP는 새 스크립트를 Refresh 전까지 모르므로, 파일 사이 참조를 여기서 확인한다.
//   1. _Logic:Method / _Logic.Prop  — 대상 Logic·서비스가 있고 멤버가 있는가, 인자 개수가 맞는가
//   2. "script.X"                    — X 스크립트가 있는가
//   3. 타입이 붙은 지역 변수·매개변수 (---@type X, method ...(X a), local a = self:Foo() → X) 의 멤버·인자 개수
//   4. self:Method / self.Member     — 상속 사슬 안에 있는가
//   5. ExecSpace 경계 — ServerOnly 메서드에서 ClientOnly 메서드 호출(또는 반대)은 조용히 무시되므로 오류
//   6. 같은 이름 스크립트 중복
//   7. 다중 반환 선언 (method integer, integer F) — 메이커가 스크립트 전체를 조용히 등록하지 않는다
// 사용: node tools/check_scripts.cjs [--quiet]
"use strict";
const path = require("path");
const { scrub, lineIndex, readArgs, loadWorld } = require("./lib/mlua.cjs");

const ROOT = path.resolve(__dirname, "..");
// 기본은 이 저장소. 자가 테스트는 --root <dir>로 픽스처 폴더(RootDesk/MyDesk 구조)를 넘긴다 (네이티브 정의는 항상 이 저장소 것)
const rootArg = process.argv.indexOf("--root");
const USER_ROOT = rootArg > 0 ? path.resolve(process.argv[rootArg + 1]) : ROOT;
const { scripts, user } = loadWorld(ROOT, USER_ROOT);
const findings = [];
const report = (s, line, msg) => findings.push({ file: path.relative(USER_ROOT, s.file), line, msg });

// 엔진이 암묵적으로 주는 멤버 (d.mlua에 선언이 없다)
const IMPLICIT = { Component: ["Entity", "Name"], Logic: [] };
// 멤버 검사를 건너뛰는 타입 (컴포넌트 이름으로 동적 접근 등)
const DYNAMIC = new Set(["Entity", "any", "table", "string", "number", "integer", "boolean", "Component"]);

// 상속 사슬 따라 멤버 찾기. 사슬 중간에 정의가 없으면 unknown
function lookup(typeName, member) {
  let t = scripts[typeName];
  const seen = new Set();
  while (t && !seen.has(t.name)) {
    seen.add(t.name);
    if (t.methods[member]) return { kind: "method", sigs: t.methods[member], owner: t };
    if (t.props[member]) return { kind: "prop", prop: t.props[member], owner: t };
    if ((IMPLICIT[t.name] || []).includes(member)) return { kind: "prop", owner: t };
    if (!t.base) return null;
    if (!scripts[t.base]) return { kind: "unknown" };
    t = scripts[t.base];
  }
  return t ? null : { kind: "unknown" };
}

function argsOk(sigs, count) {
  return sigs.some((sig) => {
    const required = sig.params.filter((p) => !p.optional).length;
    let max = sig.params.length;
    if (sig.exec === "Client") max += 1; // 서버 → 특정 클라이언트: 마지막에 userId
    return count >= required && count <= max;
  });
}

function sigText(sigs) {
  return sigs.map((s) => "(" + s.params.map((p) => p.type + " " + p.name + (p.optional ? "?" : "")).join(", ") + ")").join(" | ");
}

// 같은 쪽에서만 도는 메서드끼리의 호출이 반대편을 부르면 아무 일도 일어나지 않는다
function execConflict(callerExec, calleeExec) {
  return (callerExec === "ServerOnly" && calleeExec === "ClientOnly") || (callerExec === "ClientOnly" && calleeExec === "ServerOnly");
}

function checkMember(s, at, line, typeName, member, isCall, code, callerExec, label) {
  if (DYNAMIC.has(typeName) || !scripts[typeName]) return;
  const r = lookup(typeName, member);
  if (r === null) {
    report(s, line, `${label}: ${typeName}에 '${member}' 없음`);
    return;
  }
  if (r.kind !== "method" || !isCall) return;
  const a = readArgs(code, at);
  if (a && !argsOk(r.sigs, a.count)) report(s, line, `${label}:${member} 인자 ${a.count}개 — 선언 ${sigText(r.sigs)}`);
  if (!r.owner.native) {
    const callee = r.sigs[0].exec;
    if (execConflict(callerExec, callee)) report(s, line, `${label}:${member} — ${callerExec} 메서드에서 ${callee} 메서드 호출 (반대편이라 실행되지 않음)`);
  }
}

// _UtilLogic → UtilLogic, _TimerService → TimerService, _GameConst → Const
function globalType(name) {
  return scripts[name] ? name : null;
}

for (const s of user) {
  if (s.duplicateOf) report(s, s.line, `스크립트 이름 '${s.name}' 중복 (${path.relative(ROOT, s.duplicateOf)})`);
  for (const [name, sigs] of Object.entries(s.methods)) {
    for (const sig of sigs) if (/,/.test(sig.ret.replace(/<[^>]*>/g, ""))) report(s, sig.line, `${name}: 다중 반환 선언 '${sig.ret}' — 메이커가 스크립트를 등록하지 않는다 (table로 반환)`);
  }
  const code = scrub(s.src, true);       // 문자열 내용 가림
  const withStrings = scrub(s.src, false); // 주석만 제거
  const lineOf = lineIndex(s.src);
  const rawLines = s.src.split("\n");
  const spanAt = (line) => {
    let best = null;
    for (const m of s.methodSpans) if (m.line <= line && line <= (m.endLine || 1e9)) best = m;
    return best;
  };
  const execAt = (line) => (spanAt(line) || {}).exec || "";

  // 2. "script.X"
  for (const m of withStrings.matchAll(/["']script\.(\w+)["']/g)) {
    if (!scripts[m[1]] || scripts[m[1]].native) report(s, lineOf(m.index), `"script.${m[1]}" — 그런 스크립트 없음`);
  }

  // 1. 전역 Logic / 서비스
  for (const m of code.matchAll(/(?<![\w.])_(\w+)\s*([:.])\s*(\w+)/g)) {
    const line = lineOf(m.index);
    if (m[1].startsWith("_")) continue; // __base
    const t = globalType(m[1]);
    if (!t) {
      report(s, line, `_${m[1]} — 그런 Logic·서비스 없음`);
      continue;
    }
    const at = m.index + m[0].length;
    const callAt = code.slice(at).match(/^\s*\(/) ? at + code.slice(at).indexOf("(") : -1;
    checkMember(s, callAt, line, t, m[3], m[2] === ":" && callAt >= 0, code, execAt(line), "_" + m[1]);
  }

  // 4. self
  for (const m of code.matchAll(/(?<![\w.])self\s*([:.])\s*(\w+)/g)) {
    const line = lineOf(m.index);
    const at = m.index + m[0].length;
    const callAt = code.slice(at).match(/^\s*\(/) ? at + code.slice(at).indexOf("(") : -1;
    checkMember(s, callAt, line, s.name, m[2], m[1] === ":" && callAt >= 0, code, execAt(line), "self");
  }

  // 3. 타입이 붙은 변수
  for (const span of s.methodSpans) {
    const vars = {};
    for (const p of span.params || []) if (scripts[p.type]) vars[p.name] = p.type;
    const from = span.line;
    const to = span.endLine || rawLines.length;
    for (let ln = from; ln <= to; ln++) {
      const raw = rawLines[ln - 1] || "";
      const ann = raw.match(/---@type\s+(\w+)/);
      if (ann) {
        const next = (rawLines[ln] || "").match(/^\s*local\s+(\w+)/);
        if (next) vars[next[1]] = ann[1];
        continue;
      }
      // local x = self:Foo() / _Logic:Foo() → Foo의 반환 타입
      const am = raw.match(/^\s*local\s+(\w+)\s*=\s*(self|_(\w+))\s*:\s*(\w+)\s*\([^()]*\)\s*(--.*)?$/);
      if (am) {
        const t = am[2] === "self" ? s.name : am[3];
        const r = scripts[t] ? lookup(t, am[4]) : null;
        if (r && r.kind === "method" && scripts[r.sigs[0].ret]) vars[am[1]] = r.sigs[0].ret;
      }
    }
    const names = Object.keys(vars);
    if (names.length === 0) continue;
    const re = new RegExp(`(?<![\\w.])(${names.join("|")})\\s*([:.])\\s*(\\w+)`, "g");
    for (const m of code.matchAll(re)) {
      const line = lineOf(m.index);
      if (line < from || line > to) continue;
      const at = m.index + m[0].length;
      const callAt = code.slice(at).match(/^\s*\(/) ? at + code.slice(at).indexOf("(") : -1;
      checkMember(s, callAt, line, vars[m[1]], m[3], m[2] === ":" && callAt >= 0, code, execAt(line), m[1]);
    }
  }
}

findings.sort((a, b) => (a.file + a.line).localeCompare(b.file + b.line, undefined, { numeric: true }));
const quiet = process.argv.includes("--quiet");
for (const f of findings) console.log(`${f.file}:${f.line}  ${f.msg}`);
if (!quiet || findings.length) console.log(`\n[check_scripts] 사용자 스크립트 ${user.length}개, 문제 ${findings.length}건`);
process.exitCode = findings.length ? 1 : 0;
