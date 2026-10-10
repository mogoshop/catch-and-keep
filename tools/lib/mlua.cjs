// mlua 정적 분석용 경량 파서.
// 완전한 문법 분석기는 아니다. 스크립트 선언(script/extends/@Logic…), 멤버(property/method + ExecSpace·매개변수),
// 주석 제거, 문자열 가림, 괄호 짝 맞추기, 줄 번호 계산만 한다. tools/check_scripts.cjs가 쓴다.
"use strict";
const fs = require("fs");
const path = require("path");

// 주석을 공백으로 바꾼다 (줄 번호 유지). blankStrings면 문자열 내용도 공백으로 바꾼다.
function scrub(src, blankStrings) {
  const out = src.split("");
  let i = 0;
  const n = src.length;
  const blank = (a, b) => {
    for (let k = a; k < b && k < n; k++) if (out[k] !== "\n") out[k] = " ";
  };
  const longOpen = (at) => {
    // [[ 또는 [==[ → 등호 개수, 아니면 -1
    if (src[at] !== "[") return -1;
    let k = at + 1;
    let eq = 0;
    while (src[k] === "=") { eq++; k++; }
    return src[k] === "[" ? eq : -1;
  };
  const longClose = (from, eq) => {
    const close = "]" + "=".repeat(eq) + "]";
    const idx = src.indexOf(close, from);
    return idx < 0 ? n : idx + close.length;
  };
  while (i < n) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") {
      const eq = longOpen(i + 2);
      if (eq >= 0) {
        const end = longClose(i + 2, eq);
        blank(i, end);
        i = end;
      } else {
        let end = src.indexOf("\n", i);
        if (end < 0) end = n;
        blank(i, end);
        i = end;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < n && src[k] !== c && src[k] !== "\n") {
        if (src[k] === "\\") k++;
        k++;
      }
      if (blankStrings) blank(i + 1, k);
      i = k + 1;
      continue;
    }
    const eq = longOpen(i);
    if (eq >= 0) {
      const end = longClose(i, eq);
      if (blankStrings) blank(i + 2 + eq, end - 2 - eq);
      i = end;
      continue;
    }
    i++;
  }
  return out.join("");
}

// 위치 → 줄 번호 (1부터)
function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return (pos) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}

// 최상위 쉼표로 나누기 (괄호·꺾쇠·중괄호 안의 쉼표는 무시)
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if ("(<{[".includes(ch)) depth++;
    else if (")>}]".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim() !== "" || parts.length > 0) parts.push(cur);
  return parts.map((p) => p.trim());
}

// pos의 "(" 짝까지 읽어 인자 개수와 끝 위치를 돌려준다 (함수 리터럴 안의 괄호도 짝 맞춤)
function readArgs(code, pos) {
  if (code[pos] !== "(") return null;
  let depth = 0;
  let k = pos;
  for (; k < code.length; k++) {
    const ch = code[k];
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    else if (ch === ")" || ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  const inner = code.slice(pos + 1, k);
  // 인자 안의 function ... end 본문 쉼표가 섞이지 않게: 괄호 깊이만으로 충분하지 않으므로 function~end를 지운다
  const flat = stripFunctionBodies(inner);
  const args = flat.trim() === "" ? [] : splitArgs(flat);
  return { count: args.length, end: k };
}

function stripFunctionBodies(text) {
  // function ( ... ) <body> end 를 "F"로 바꾼다. 본문 안의 if/for/while/do/function ... end 짝을 센다
  const re = /\b(function|if|for|while|do|repeat|end|until)\b/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m[1] !== "function") continue;
    let depth = 0;
    re.lastIndex = m.index;
    let endPos = text.length;
    let mm;
    while ((mm = re.exec(text))) {
      const w = mm[1];
      if (w === "function" || w === "if" || w === "do" || w === "repeat") depth++;
      // for/while 다음의 do가 블록을 연다 → for/while 자체는 세지 않는다
      else if (w === "end" || w === "until") {
        depth--;
        if (depth === 0) { endPos = mm.index + w.length; break; }
      }
    }
    out += text.slice(last, m.index) + "F";
    last = endPos;
    re.lastIndex = endPos;
  }
  return out + text.slice(last);
}

function splitArgs(text) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if ("({[".includes(ch)) depth++;
    else if (")}]".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

// 매개변수 목록 "Entity a, integer b = 0" → [{type, name, optional}]
function parseParams(text) {
  if (text.trim() === "") return [];
  return splitTop(text).map((p) => {
    const optional = p.includes("=");
    const decl = p.split("=")[0].trim();
    const m = decl.match(/^(.*\S)\s+(\w+)$/);
    return m ? { type: m[1].trim(), name: m[2], optional } : { type: "any", name: decl, optional };
  });
}

// 파일 하나의 스크립트 선언을 읽는다
function parseScript(file, src, native) {
  const code = scrub(src, false);
  const lines = code.split("\n");
  let script = null;
  let pending = [];
  let current = null; // 현재 method/handler
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    const sm = line.match(/^script\s+(\w+)(?:\s+extends\s+(\w+))?/);
    if (sm) {
      const kind = (pending.find((a) => /^@(Logic|Component|Event|Struct|Item|BTNode|State|Service)\b/.test(a)) || "").replace(/^@(\w+).*/, "$1");
      script = { name: sm[1], base: sm[2] || null, kind, file, native, line: i + 1, props: {}, methods: {}, methodSpans: [] };
      pending = [];
      continue;
    }
    if (/^@\w+/.test(line) && !/^@\w+.*\b(property|method|handler)\b/.test(line)) {
      pending.push(line);
      continue;
    }
    if (!script) { pending = []; continue; }
    const annotations = pending.concat((line.match(/@\w+(\([^)]*\))?/g) || []));
    pending = [];
    const pm = line.match(/\bproperty\s+([\w<>,\s]+?)\s+(\w+)\s*(=|$)/);
    if (pm) {
      script.props[pm[2]] = { type: pm[1].replace(/\s+/g, " "), line: i + 1, sync: annotations.some((a) => /@(Sync|TargetUserSync)/.test(a)) };
      continue;
    }
    // 매개변수 목록은 괄호 짝으로 자른다 (기본값 Vector2(0, 0) 안의 ")"에서 끊으면 인자 수를 적게 셌다)
    let mm = line.match(/\b(method|handler)\s+(?:([\w<>,\s]+?)\s+)?(\w+)\s*\(/);
    if (mm) {
      let depth = 1, j = mm.index + mm[0].length;
      const start = j;
      for (; j < line.length && depth > 0; j++) {
        if (line[j] === "(") depth++;
        else if (line[j] === ")") depth--;
      }
      mm = depth === 0 ? [mm[0], mm[1], mm[2], mm[3], line.slice(start, j - 1)] : null;
    }
    if (mm) {
      const execA = annotations.find((a) => a.startsWith("@ExecSpace"));
      const exec = execA ? (execA.match(/"(\w+)"/) || [])[1] || "" : "";
      if (current) current.endLine = i;
      if (mm[1] === "handler") { current = { name: mm[3], handler: true, exec, line: i + 1 }; script.methodSpans.push(current); continue; }
      const sig = { ret: (mm[2] || "void").replace(/\s+/g, " "), params: parseParams(mm[4]), exec, line: i + 1 };
      (script.methods[mm[3]] = script.methods[mm[3]] || []).push(sig);
      current = { name: mm[3], exec, line: i + 1, params: sig.params };
      script.methodSpans.push(current);
    }
  }
  if (current) current.endLine = lines.length;
  return script;
}

function walk(dir, ext, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

// 원본 + 네이티브 정의를 모두 읽어 이름 → 스크립트 사전을 만든다
function loadWorld(root, userRoot) {
  const scripts = {};
  const nativeDir = path.join(root, "Environment", "NativeScripts");
  for (const f of walk(nativeDir, ".d.mlua", [])) {
    const s = parseScript(f, fs.readFileSync(f, "utf8"), true);
    if (s) scripts[s.name] = s;
  }
  const userFiles = walk(path.join(userRoot || root, "RootDesk", "MyDesk"), ".mlua", []);
  const user = [];
  for (const f of userFiles) {
    const src = fs.readFileSync(f, "utf8");
    const s = parseScript(f, src, false);
    if (!s) continue;
    s.src = src;
    if (scripts[s.name] && !scripts[s.name].native) s.duplicateOf = scripts[s.name].file;
    scripts[s.name] = s;
    user.push(s);
  }
  return { scripts, user };
}

module.exports = { scrub, lineIndex, readArgs, parseParams, parseScript, loadWorld, walk };
