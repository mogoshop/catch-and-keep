#!/usr/bin/env node
// 알림 채널 배정표 (10-31 실플레이 피드백 B-4): 화면 알림을 부르는 곳을 전부 찾아 채널 A·B·C·D로 나눈다.
//   A 「상단 띠」  HudMap.TopPush · TopPushFor · ShowAlert · Util.NotifyTop(Map) — 습격 · 보스 등장/처치 · 퀘스트 목표 달성 · 일지 완료 · 맵 입장
//   B 「왼쪽 알림 더미」 NoticeFeed.Push · Util.Notify(Map) — 최대 3줄(모바일 2) · 같은 글 10초 안 ×N · 상한·경고류 60초에 한 번
//   C 「오른쪽 추적기」 HudMain.SetJournalTrack — 퀘스트 추적기 안 일지 진행 한 줄
//   D 「줍기 표시」 Util.NotifyPickup · HudMain.PickupPop — 발밑 작은 글씨
//   (머리 위 경고 Util.Warn은 창이 떠 있을 때만 B — 파일별 수만 적는다 · 큰 알림 판 Util.Banner/UXFeedback은 퀘스트 목표 달성·일지 완료만 A로 간다)
// 사용: node tools/notice_channels.cjs            → docs/evidence/2026-10-31-playfeedback-B/notice-channels.md 다시 쓰기
//       node tools/notice_channels.cjs --check    → 표와 코드의 부르는 곳 수가 파일·방법마다 같은지 (누락 0 · npm test)
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "RootDesk/MyDesk");
const OUT = path.join(ROOT, "docs/evidence/2026-10-31-playfeedback-B/notice-channels.md");
const LIMIT = ["최대 ", "한도", "상한", "가방이 가득"];   // NoticeFeed.LimitPatterns와 같은 값

const APIS = [
  { re: /_NoticeFeed:Push\(/, api: "NoticeFeed.Push" },
  { re: /_Util:NotifyTopMap\(/, api: "Util.NotifyTopMap" },
  { re: /_Util:NotifyTop\(/, api: "Util.NotifyTop" },
  { re: /_Util:NotifyPickup\(/, api: "Util.NotifyPickup" },
  { re: /_Util:NotifyMap\(/, api: "Util.NotifyMap" },
  { re: /_Util:Notify\(/, api: "Util.Notify" },
  { re: /_HudMap:TopPushFor\(/, api: "HudMap.TopPushFor" },
  { re: /_HudMap:TopPush\(/, api: "HudMap.TopPush" },
  { re: /_HudMap:ShowAlert\(/, api: "HudMap.ShowAlert" },
  { re: /_HudMain:PickupPop\(/, api: "HudMain.PickupPop" },
  { re: /_HudMain:SetJournalTrack\(/, api: "HudMain.SetJournalTrack" },
];
const GROUPED = [{ re: /_Util:Warn\(/, api: "Util.Warn" }, { re: /_Util:Banner\(/, api: "Util.Banner" }];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".mlua")) out.push(p);
  }
  return out.sort();
}
function code(line) {
  // 주석(--) 앞까지만 (글 안의 「--」는 드물다 — 따옴표 안이면 그대로 둔다)
  let q = null;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === "-" && line[i + 1] === "-") return line.slice(0, i);
  }
  return line;
}
function snippet(c, api) {
  const at = c.indexOf(api.split(".")[1] + "(");
  const rest = c.slice(at);
  const m = rest.match(/"([^"]*)"/);
  let s = m ? m[1] : rest.slice(rest.indexOf("(") + 1, rest.indexOf("(") + 50);
  s = s.replace(/\|/g, "/").trim();
  return s.length > 42 ? s.slice(0, 42) + "…" : s;
}
function channelOf(file, api, c, fn) {
  const base = path.basename(file, ".mlua");
  if (api.startsWith("HudMap.") || api === "Util.NotifyTop" || api === "Util.NotifyTopMap") return "A";
  if (api === "Util.NotifyPickup" || api === "HudMain.PickupPop") return "D";
  if (api === "HudMain.SetJournalTrack") return "C";
  if (api === "NoticeFeed.Push") {
    if (base === "Util" && fn === "Notify") return "B (Notify 본체)";
    if (base === "Util" && fn === "Warn") return "B (창이 떠 있을 때 Warn)";
    if (base === "Util" && fn === "NotifyTop") return "B (채널 A를 끈 때만)";
    if (base === "BossPattern") return "B (채널 A를 끈 때만)";
    if (base === "HudMain" && fn === "PickupPop") return "B (창이 떠 있을 때 줍기)";
    if (base === "UXFeedback") return "B (큰 알림 넘침·창 안 결과)";
  }
  const limited = LIMIT.some((p) => c.includes(p));
  return limited ? "B · 상한 60초" : "B";
}
function scan() {
  const rows = [], grouped = {};
  for (const f of walk(SRC)) {
    const rel = path.relative(ROOT, f);
    let fn = "";
    fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      const m = line.match(/^\s+(?:method \S+ |handler )(\w+)\(/);
      if (m) fn = m[1];
      const c = code(line);
      for (const a of APIS) {
        if (a.re.test(c)) {
          rows.push({ file: rel, line: i + 1, api: a.api, fn, text: snippet(c, a.api), ch: channelOf(f, a.api, c, fn) });
          break;
        }
      }
      for (const g of GROUPED) if (g.re.test(c)) { const k = rel + "|" + g.api; grouped[k] = (grouped[k] || 0) + 1; }
    });
  }
  return { rows, grouped };
}
function render({ rows, grouped }) {
  const byCh = {};
  for (const r of rows) { const k = r.ch[0]; byCh[k] = (byCh[k] || 0) + 1; }
  const L = [];
  L.push("# 알림 채널 배정표 (10-31 실플레이 피드백 B-4)");
  L.push("");
  L.push("사용자 피드백(10-31 00:0x): 「사냥 중 알림이 6개 왔다갔다 — 파티 목록 · 왼쪽 알림 더미 · 상단 습격 띠 · 맵 이름 · 퀘스트 추적기 · 일지 진행까지, 채팅까지 겹치면 정신없다」.");
  L.push("화면 알림을 네 채널로 나눴다. 이 표는 `node tools/notice_channels.cjs`가 코드에서 다시 만들고, `npm test`의 「알림 채널 배정」이 파일·방법마다 부르는 곳 수가 표와 같은지 본다(누락 0).");
  L.push("");
  L.push("| 채널 | 자리 · 규칙 (상수) | 무엇 |");
  L.push("|---|---|---|");
  L.push("| **A 상단 띠** | 위 가운데 맵 배너 자리 하나 · 한 번에 1개 · 대기열 · 2.5초(`HudMap.TopSeconds`) · 같은 키 10초 안 다시 안 띄움(`TopDedupSec`) · 급한 것(습격 시작·보스 등장)이 덜 급한 것을 밀어냄 · 창이 떠 있으면 기다리고 8초 지난 것은 버림(`TopStaleSec`) · 끄기 `HudMap.TopChannelOn` | 습격 시작/격퇴 · 보스 등장/처치(「○○ 처치!」 + 다시 나오는 때 한 띠로 합침) · 퀘스트 목표 달성 · 일지 완료(업적 달성 · 일일 퀘스트 완료) · 맵 입장 이름(예전 맵 배너 — 입장 때 1회) · 재의 왕 각성 안내 |");
  L.push("| **B 왼쪽 알림 더미** | PC 채팅 창 바로 위(펼치면 위로 · `ChatOpenExtra`) · 파티 목록·큰 알림 판 아래 끝까지만 · 위가 최신 · 동시 3줄(`KeepLines`) · 모바일 2줄(`MobileKeepLines`) · 4초 · 같은 글(숫자만 다른 글 포함) 10초 안 ×N(`MergeSec`) · 상한·경고류 60초에 1회(`LimitSec` · `LimitPatterns`) | 아래 표의 B 줄 전부 · 머리 위 경고(`Util.Warn`)는 창이 떠 있을 때만 |");
  L.push("| **C 오른쪽 추적기** | 퀘스트 추적기 맨 아래 한 줄(PC는 카드 +34 · 모바일은 지역 줄 자리) · 바뀌면 제자리 갱신 · 30초 뒤 접음(`HudMain.JournalTrackSec`) · 예전 일지 진행 말풍선은 끔(`JournalWindow.PulseToTracker`) | 일지 진행 「업적 · 이름 n/N」 · 「일일 퀘스트 · 이름 n/N」 |");
  L.push("| **D 줍기 표시** | 캐릭터 발밑 작은 글씨 1.5초 떠올라 사라짐(`HudMain.PickSeconds`) · 최대 3개 · 골드는 0.9초 안 한 글로 더함 · 머리 위 COMBO와 떨어진 발밑 · 창이 떠 있으면 B | 골드 +N · 귀환 두루마리 +N · 물약 +N · 아이템 이름 |");
  L.push("");
  L.push("파티 목록(PC)은 평소 「파티 (n) · 이름 Lv · …」 한 줄로 접고 마우스를 올리거나 누르면 펼친다 — 왼쪽 알림 더미는 그 아래 끝을 피한다(`NoticeFeed.PlaceHome`). 모바일은 알림 더미가 지도 아래(오른쪽)라 예전처럼 펼친 채.");
  L.push("");
  L.push(`## 부르는 곳 전수 (${rows.length}곳 · A ${byCh.A || 0} · B ${byCh.B || 0} · C ${byCh.C || 0} · D ${byCh.D || 0})`);
  L.push("");
  L.push("| 파일 | 줄 | 함수 | 부르는 법 | 글(앞부분) | 채널 |");
  L.push("|---|---|---|---|---|---|");
  for (const r of rows) L.push(`| ${r.file.replace("RootDesk/MyDesk/", "")} | ${r.line} | ${r.fn} | ${r.api} | ${r.text} | ${r.ch} |`);
  L.push("");
  L.push("## 파일별 수만 적는 것");
  L.push("");
  L.push("| 파일 | 부르는 법 | 수 | 채널 |");
  L.push("|---|---|---|---|");
  for (const k of Object.keys(grouped).sort()) {
    const [file, api] = k.split("|");
    L.push(`| ${file.replace("RootDesk/MyDesk/", "")} | ${api} | ${grouped[k]} | ${api === "Util.Warn" ? "머리 위 경고 (창이 떠 있으면 B)" : "큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A)"} |`);
  }
  L.push("");
  return L.join("\n");
}
function parse(md) {
  const count = {};
  const sec = md.split("## 부르는 곳 전수")[1] || "";
  for (const line of sec.split("\n")) {
    const m = line.match(/^\| ([^|]+\.mlua) \| \d+ \| [^|]* \| ([\w.]+) \|/);
    if (m) { const k = m[1].trim() + "|" + m[2]; count[k] = (count[k] || 0) + 1; }
  }
  const grp = {};
  for (const line of (md.split("## 파일별 수만 적는 것")[1] || "").split("\n")) {
    const m = line.match(/^\| ([^|]+\.mlua) \| ([\w.]+) \| (\d+) \|/);
    if (m) grp[m[1].trim() + "|" + m[2]] = +m[3];
  }
  return { count, grp };
}

const scanned = scan();
if (process.argv.includes("--check")) {
  if (!fs.existsSync(OUT)) { console.log("[notice_channels] 표 없음 — node tools/notice_channels.cjs"); process.exit(1); }
  const md = parse(fs.readFileSync(OUT, "utf8"));
  const now = {};
  for (const r of scanned.rows) { const k = r.file.replace("RootDesk/MyDesk/", "") + "|" + r.api; now[k] = (now[k] || 0) + 1; }
  const bad = [];
  for (const k of new Set([...Object.keys(now), ...Object.keys(md.count)])) if ((now[k] || 0) !== (md.count[k] || 0)) bad.push(`${k} 코드 ${now[k] || 0} · 표 ${md.count[k] || 0}`);
  for (const [k, n] of Object.entries(scanned.grouped)) { const kk = k.replace("RootDesk/MyDesk/", ""); if ((md.grp[kk] || 0) !== n) bad.push(`${kk} 코드 ${n} · 표 ${md.grp[kk] || 0}`); }
  // 반례: 줍기·보스 처치·보스 등장이 다시 B로 새지 않는다
  const leak = scanned.rows.filter((r) => r.ch[0] === "B" && /^골드 \+|다시 나타났다|DownText/.test(r.text));
  for (const r of leak) bad.push(`채널 A/D로 가야 할 글이 B: ${r.file}:${r.line} ${r.text}`);
  if (bad.length) { console.log("[notice_channels] 어긋남 " + bad.length + "건\n  " + bad.join("\n  ")); process.exit(1); }
  console.log(`[notice_channels] 부르는 곳 ${scanned.rows.length}곳 표와 같음 · 채널 누락 0`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, render(scanned));
  console.log(`[notice_channels] ${path.relative(ROOT, OUT)} — ${scanned.rows.length}곳`);
}
