#!/usr/bin/env node
// 메인 스킬 이름 실존 이름 교체 (docs/design/56-skill-names-reference-mapping-20261101.md §2 추천 · 11-02 사용자 결정 A)
//   메인 26개 이름만 바꾼다 (해골 전사·해골 마법사 유지 · 신규 본 골렘은 skills.csv 새 줄). 노드 62개 이름은 이번에 바꾸지 않는다 (사용자 별도 결정 대기).
//   장비 이름(군령의·호령의·룬워드 「첫 번째 군령」·유니크 「골편 반지」·「격류의 인장」)은 그대로 (사용자 미결 · 54 §4-4).
//
// 사용:
//   node tools/rename_skills.cjs                     미리보기 (파일을 바꾸지 않음) — 바뀔 줄 전부와 검사 결과
//   node tools/rename_skills.cjs --out=<파일>        미리보기를 파일에도 쓴다 (증거 폴더용)
//   node tools/rename_skills.cjs --write             실제로 쓴다 (검사가 하나라도 걸리면 아무 파일도 쓰지 않음)
//
// 하는 일
//   1) data/skills.csv: name 열을 id 기준으로 (지금 이름이 표의 옛 이름과 다르면 멈춤) + desc·card 열 안의 옛 메인 이름
//   2) 코드·문서: FILES에 적은 파일만 · 주석이 아닌 문자열 리터럴 안에서만 (md·csv note는 줄 전체) · SKIP_LINE(같은 낱말 다른 뜻 · 명령 동사 · 장비 이름) 제외
//   3) SPECIAL: 줄임 표기(「골편」「낙인」「의식」) · HUD 칩 짧은 말 · 조사가 다음 문자열 조각에 있는 줄 · 선택 보상 「꿰뚫는 골편」
//   4) 바꾼 자리 뒤 조사(은/는·이/가·을/를·과/와·으로/로·이나/나)를 새 이름 받침에 맞춤
//   5) 검사: 새 이름 중복 · 글자 수(메인 7) · 새 이름이 다른 옛 이름을 품는지 · 쓴 뒤 대상 문자열에 옛 이름이 남았는지(SKIP_LINE 밖)
// 하지 않는 일: gen(→ npm run gen) · 검사(check_data·check_voice·npm test) · 메이커 확인
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const WRITE = process.argv.includes("--write");
const OUT = (process.argv.find((a) => a.startsWith("--out=")) || "").slice(6);

// ── 옛 이름 → 새 이름 (56 §2-1~2-4 추천 열 · 괄호의 공식 한국어는 툴팁·문서용이라 여기 넣지 않는다) ──
const MAP = {
  shadow_summon: ["그림자 소환", "리바이브"],
  rally: ["집결", "컨보케이션"],
  bone_rite: ["뼈 의식", "본 노바"],
  bone_offering: ["뼈 성찬", "본 오퍼링"],
  elite_promote: ["정예 승격", "드레드 셰이드"],
  command_aura: ["호령", "배틀 오더스"],
  bone_shard: ["골편 투척", "티스"],
  bone_armor: ["뼈 갑옷", "본 아머"],
  poison_mist: ["독안개", "포이즌 미스트"],
  hex_flame: ["저주 불꽃", "헥스블라스트"],
  bone_prison: ["골격 감옥", "본 프리즌"],
  soul_drain: ["생기 앗기", "드레인 라이프"],
  frost_soul: ["서리 혼", "프로즌 오브"],
  bone_storm: ["뼈 폭풍", "본 스톰"],
  shadow_sacrifice: ["그림자 희생", "세크리파이스"],
  soul_torrent: ["영혼 격류", "본 스피리트"],
  death_wave: ["죽음의 파동", "데스 노바"],
  mark_weakness: ["약화의 낙인", "앰플리파이"],
  enfeeble: ["쇠약", "위큰"],
  terror: ["공포", "하울"],
  thorn_curse: ["가시 저주", "아이언 메이든"],
  life_tap: ["생명 약탈", "라이프 탭"],
  resist_break: ["저항 붕괴", "로워 레지스트"],
  plague_curse: ["역병 저주", "컨테이전"],
  swift_step: ["가벼운 걸음", "헤이스트"],
  wraith_dash: ["망령 질주", "레이스 폼"],
};
// 옛 이름을 품고 있지만 바꾸지 않는 낱말 (노드 이름 「뼈까지 쇠약」 — 노드 이름은 이번에 그대로)
const PROTECT = ["뼈까지 쇠약", "수호령", "커서 위치에 독안개"];   // 「커서 위치에 독안개」 = poison_mist 설명의 보통 낱말(안개)

// ── 대상 파일 · 방식 ──
//   lit = 주석 아닌 문자열 리터럴만 (mark = 주석 표시) · line = 줄 전체 (md) · note = csv 마지막 열(note)만 · none = SPECIAL만
const FILES = [
  { file: "RootDesk/MyDesk/Monster/MonsterStatus.mlua", mode: "lit", mark: "--" },
  { file: "RootDesk/MyDesk/Player/PlayerStats.mlua", mode: "lit", mark: "--" },
  { file: "RootDesk/MyDesk/Progress/NightmarePreview.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/Shadow/ShadowCommander.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/Shadow/SoulExtractor.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", mode: "lit", mark: "--" },
  { file: "RootDesk/MyDesk/Skill/SkillEffects.mlua", mode: "lit", mark: "--" },
  { file: "RootDesk/MyDesk/Test/SelfTest.mlua", mode: "lit", mark: "--" },
  { file: "RootDesk/MyDesk/UI/Hud/GuideCoach.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", mode: "none", mark: "--" },
  { file: "RootDesk/MyDesk/UI/Windows/GuideWindow.mlua", mode: "none", mark: "--" },
  { file: "docs/ui/message-rules.md", mode: "line" },
  { file: "docs/ui/mobile-layout.md", mode: "line" },
  { file: "tools/check_decisions38.cjs", mode: "lit", mark: "//" },
  { file: "tools/check_mobile_layout.cjs", mode: "lit", mark: "//" },
  { file: "tools/sim_balance.py", mode: "lit", mark: "#" },
  { file: "data/config.csv", mode: "note" },
  { file: "data/sounds.csv", mode: "note" },
  { file: "data/ui_icons.csv", mode: "note" },
  { file: "data/objects.csv", mode: "note" },
  { file: "data/stats.csv", mode: "none" },
];
// 바꾸지 않는 줄 (같은 낱말 다른 뜻 · 명령 동사 · 장비·몬스터 이름 · 로그)
const SKIP_LINE = [
  /혼 추출·그림자 소환 해금/,   // 그림자 소환 1랭크 요약 = 「그림자를 소환하는 행동」이 열림 (명령 동사)
  /수호령의|호령의|골편 반지|격류의 인장|첫 번째 군령/,   // 장비 이름 (사용자 미결)
  /skill_poison|독안개가 남는다/,   // 몬스터 변종 능력 「독안개」 (플레이어 스킬과 별개)
];

// ── 정해 둔 특수 교체 (일반 교체보다 먼저 · line 정규식이 있으면 그 줄에서만) ──
const SPECIAL = [
  // 악몽 미리보기: 거인은 이제 새 메인 「본 골렘」
  { file: "RootDesk/MyDesk/Progress/NightmarePreview.mlua", from: '"뼈 의식 거인"', to: '"본 골렘"' },
  // 선택 보상 카드 (줄임 표기 「골편」「낙인」 · 이름 「꿰뚫는 골편」 → 56 추천 「꿰뚫는 뼛조각」)
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"골편 투척 +1발', to: '"티스 +1발' },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"꿰뚫는 골편"', to: '"꿰뚫는 뼛조각"' },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"골편 한 발이 맞히는', to: '"티스 한 발이 맞히는' },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"저주를 걸면 낙인도 함께', to: '"저주를 걸면 앰플리파이도 함께' },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"골편이 맞힌 뒤', to: '"티스가 맞힌 뒤' },
  // 명령 동사(집중·집결·그림자 소환·혼 추출)는 그대로 두고 「스킬 이름」 자리만 · 조사가 다음 문자열 조각에 있다
  { file: "RootDesk/MyDesk/Shadow/ShadowCommander.mlua", from: '"집중은 스킬 「집결」(Lv"', to: '"집중은 스킬 「컨보케이션」(Lv"' },
  { file: "RootDesk/MyDesk/Shadow/ShadowCommander.mlua", from: '"집결은 스킬 「집결」(Lv"', to: '"집결은 스킬 「컨보케이션」(Lv"' },
  { file: "RootDesk/MyDesk/Shadow/ShadowCommander.mlua", from: '"그림자 소환은 스킬 「그림자 소환」(Lv"', to: '"그림자 소환은 스킬 「리바이브」(Lv"' },
  { file: "RootDesk/MyDesk/Shadow/ShadowCommander.mlua", line: /「리바이브」\(Lv/, from: '")을 배워야 합니다"', to: '")를 배워야 합니다"' },
  { file: "RootDesk/MyDesk/Shadow/SoulExtractor.mlua", from: '"혼 추출은 스킬 「그림자 소환」(Lv"', to: '"혼 추출은 스킬 「리바이브」(Lv"', count: 2 },
  { file: "RootDesk/MyDesk/Shadow/SoulExtractor.mlua", line: /「리바이브」\(Lv/, from: '")을 배워야 합니다"', to: '")를 배워야 합니다"' },
  { file: "RootDesk/MyDesk/Shadow/SoulExtractor.mlua", line: /「리바이브」\(Lv/, from: '")을 배운 뒤에 할 수 있습니다"', to: '")를 배운 뒤에 할 수 있습니다"' },
  // 스킬 창 효과 줄 줄임 표기 (54 §4-2) · 본 노바 강화 셋의 「의식 1기」
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '" · 낙인 +%g%%"', to: '" · 앰플리파이 +%g%%"' },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '"표식 남은 적에게 골편 피해 +%d%%"', to: '"표식 남은 적에게 티스 피해 +%d%%"' },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '"골편이 2발 이상일 때', to: '"티스가 2발 이상일 때' },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '"의식 1기', to: '"본 노바 1기', count: 3 },
  // 검사: 장비 스탯 이름은 스킬 이름을 따라간다 (안 바꾸면 SelfTest 실패)
  { file: "RootDesk/MyDesk/Test/SelfTest.mlua", from: '"골편 투척 레벨"', to: '"티스 레벨"' },
  { file: "RootDesk/MyDesk/Test/SelfTest.mlua", from: '"집결은 배워야 쓰는', to: '"컨보케이션은 배워야 쓰는' },
  // 상황 안내 (「」로 부르는 스킬 이름만 · 「C 집결」「Z 소환」 같은 명령 이름은 그대로)
  { file: "RootDesk/MyDesk/UI/Hud/GuideCoach.mlua", from: '「그림자 소환」을 배우면', to: '「리바이브」를 배우면' },
  { file: "RootDesk/MyDesk/UI/Hud/GuideCoach.mlua", from: '"Lv5 — 그림자 소환이 열렸습니다"', to: '"Lv5 — 리바이브가 열렸습니다"' },
  { file: "RootDesk/MyDesk/UI/Hud/GuideCoach.mlua", from: 'g("「그림자 소환」") .. "을 배웁니다', to: 'g("「리바이브」") .. "를 배웁니다' },
  { file: "RootDesk/MyDesk/UI/Windows/GuideWindow.mlua", from: '"Lv5에 「그림자 소환」을 배우면', to: '"Lv5에 「리바이브」를 배우면' },
  // HUD 버프 칩 짧은 말 (Buffs/B*/Label 56px · bestfit 15→11) + 툴팁 이름 — 노드 칩(잔걸음·사냥)은 노드 이름이 그대로라 그대로
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'and "망령 도약" or "망령 질주"', to: 'and "망령 도약" or "레이스 폼"' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "질주"', to: 'label = "레이스 폼"' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "호령"', to: 'label = "오더스"', count: 2 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: '"호령 · 그림자', to: '"배틀 오더스 · 그림자' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: '"동료의 호령 · ', to: '"동료의 배틀 오더스 · ' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "뼈갑옷"', to: 'label = "본 아머"' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: '"뼈 갑옷 · 피해 흡수', to: '"본 아머 · 피해 흡수' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "걸음"', to: 'label = "헤이스트"' },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: '"가벼운 걸음 · 내 이동', to: '"헤이스트 · 내 이동' },
  // 개발 도구 문구: 거인 쪽은 새 메인 「본 골렘」
  { file: "tools/sim_balance.py", from: "뼈 의식 거인", to: "본 골렘", count: 2 },
  { file: "tools/check_mobile_layout.cjs", from: "뼈 의식 거인", to: "본 골렘 거인" },
  // config 메모: 거인 줄은 본 골렘으로 (5기 문턱·랭크 배율 메모는 거인 분리 작업이 따로 고친다)
  { file: "data/config.csv", from: "뼈 의식 거인 수", to: "본 골렘 거인 수" },
  { file: "data/config.csv", from: "뼈 의식 5기만 충전 칸 수", to: "본 골렘 충전 칸 수" },
  // stats 메모: 줄임 표기 묶음
  { file: "data/stats.csv", from: "(낙인·쇠약·가시·약탈·쇠퇴·저항 붕괴)", to: "(앰플리파이·위큰·아이언 메이든·라이프 탭·쇠퇴·로워 레지스트)" },
];
// skills.csv 설명의 줄임 표기 「골편」 (옛 전체 이름 교체 뒤 남는 것)
const CSV_STEMS = [["골편이 좁게 모여", "티스가 좁게 모여"], ["골편이 더 깊이", "티스가 더 깊이"], ["전방위 데스 노바", "전방위 파동을 일으킨다"]];   // death_wave 설명의 「죽음의 파동」은 보통 낱말(파동)

const problems = [];
const report = [];
const pending = [];   // [file, text] — 모든 검사가 통과한 뒤에만 한꺼번에 쓴다
const OLDS = Object.values(MAP).map((x) => x[0]);

// ── 조사 맞춤 ──
function jong(word) {
  const c = word.trim().slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return -1;
  return (c - 0xac00) % 28;   // 0 = 받침 없음 · 8 = ㄹ
}
const PAIRS = [["으로", "로"], ["이나", "나"], ["은", "는"], ["이", "가"], ["을", "를"], ["과", "와"]];
function fixJosa(text, newName) {
  const j = jong(newName);
  if (j < 0) return text;
  const esc = newName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(esc + "([」'\"]?)(으로|이나|은|는|이|가|을|를|과|와|로|나)(?![가-힣])|" + esc + "([」'\"]?)(으로|이나|은|는|을|를|과|와|로|에서)", "g"), (m, q1, p1, q2, p2) => {
    const q = q1 !== undefined ? q1 : (q2 || "");
    const p = p1 !== undefined ? p1 : p2;
    for (const [a, b] of PAIRS) {
      if (p !== a && p !== b) continue;
      let use;
      if (a === "으로") use = (j === 0 || j === 8) ? b : a;
      else use = j === 0 ? b : a;
      return newName + q + use;
    }
    return m;
  });
}
function replaceNames(seg) {
  // 보호 낱말을 잠시 빼고 긴 옛 이름부터 바꾼다
  const keep = [];
  PROTECT.forEach((w, i) => { seg = seg.split(w).join(`\u0001${i}\u0001`); keep[i] = w; });
  for (const [o, n] of Object.values(MAP).sort((x, y) => y[0].length - x[0].length)) {
    if (seg.includes(o)) seg = fixJosa(seg.split(o).join(n), n);
  }
  return seg.replace(/\u0001(\d+)\u0001/g, (_, i) => keep[Number(i)]);
}
function hasOld(seg) {
  let s = seg;
  for (const w of PROTECT) s = s.split(w).join("");
  return OLDS.some((o) => s.includes(o));
}

// ── 문자열 리터럴 범위 (주석 앞까지) ──
function literalRanges(line, mark) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line.startsWith(mark, i)) break;
    const ch = line[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      let k = i + 1;
      while (k < line.length && line[k] !== ch) { if (line[k] === "\\") k++; k++; }
      out.push([i, Math.min(k + 1, line.length)]);
      i = k + 1;
      continue;
    }
    i++;
  }
  return out;
}
function mapLiterals(line, mark, fn) {
  const ranges = literalRanges(line, mark);
  if (!ranges.length) return line;
  let res = "", last = 0;
  for (const [a, b] of ranges) { res += line.slice(last, a) + fn(line.slice(a, b)); last = b; }
  return res + line.slice(last);
}
function commentAt(line, mark) {
  // 주석이 시작하는 자리 (문자열 리터럴 밖 · 없으면 줄 길이)
  let i = 0;
  while (i < line.length) {
    if (line.startsWith(mark, i)) return i;
    const ch = line[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      let k = i + 1;
      while (k < line.length && line[k] !== ch) { if (line[k] === "\\") k++; k++; }
      i = k + 1;
      continue;
    }
    i++;
  }
  return line.length;
}
function noteIndex(line) {
  // csv 마지막 열 시작 위치 (따옴표 안 쉼표 무시)
  let q = false, at = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') q = !q;
    else if (line[i] === "," && !q) at = i;
  }
  return at;
}
function targetHasOld(line, t) {
  if (SKIP_LINE.some((r) => r.test(line))) return false;
  if (t.mode === "lit") return literalRanges(line, t.mark).some(([a, b]) => hasOld(line.slice(a, b)));
  if (t.mode === "line") return hasOld(line);
  if (t.mode === "note") { const k = noteIndex(line); return k >= 0 && hasOld(line.slice(k + 1)); }
  return false;
}

// ── 0) 사전 검사 ──
(function preflight() {
  const news = Object.values(MAP).map((x) => x[1]);
  const dup = news.filter((n, i) => news.indexOf(n) !== i);
  if (dup.length) problems.push("새 이름 중복: " + dup.join(", "));
  for (const n of news) for (const o of OLDS) if (n.includes(o)) problems.push(`새 이름 「${n}」이 옛 이름 「${o}」을 품음`);
  for (const [id, [, n]] of Object.entries(MAP)) if ([...n].length > 7) problems.push(`글자 수 초과: ${id} 「${n}」 ${[...n].length} > 7 (메인 · 핫바 고르기 Clip 7)`);
})();

// ── 1) skills.csv ──
(function skills() {
  const file = path.join(ROOT, "data/skills.csv");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const head = lines[0].split(",");
  if (head[0] !== "id" || head[1] !== "name") { problems.push("skills.csv 머리 줄이 id,name,… 이 아님"); return; }
  const kindAt = head.indexOf("kind");
  let nName = 0, nDesc = 0;
  const seen = new Set();
  const news = new Set(Object.values(MAP).map((x) => x[1]));
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.trim()) continue;
    const m = ln.match(/^([a-z0-9_]+),([^,]*),(.*)$/);
    if (!m) { problems.push(`skills.csv ${i + 1}행: id,name 을 읽지 못함`); continue; }
    const [, id, name, rest] = m;
    let newName = name;
    if (MAP[id]) {
      seen.add(id);
      if (name === MAP[id][1]) { /* 이미 바뀜 */ }
      else if (name !== MAP[id][0]) { problems.push(`skills.csv ${id}: 지금 이름 「${name}」 ≠ 표의 옛 이름 「${MAP[id][0]}」`); continue; }
      else { newName = MAP[id][1]; nName++; }
    } else if (rest.split(",")[kindAt - 2] !== "node" && news.has(name)) problems.push(`skills.csv ${id}: 새 이름 「${name}」과 겹침`);
    let newRest = replaceNames(rest);
    for (const [a, b] of CSV_STEMS) newRest = newRest.split(a).join(b);
    if (newRest !== rest) nDesc++;
    const out = `${id},${newName},${newRest}`;
    if (out !== ln) { report.push(`data/skills.csv:${i + 1}\n        - ${ln}\n        + ${out}`); lines[i] = out; }
    if (hasOld(newName + "," + newRest)) problems.push(`skills.csv ${id}: 교체 뒤에도 옛 이름이 남음 — ${newRest.slice(0, 60)}`);
  }
  for (const id of Object.keys(MAP)) if (!seen.has(id)) problems.push(`skills.csv에 ${id} 줄이 없음`);
  report.push(`== data/skills.csv: 이름 ${nName}줄 · 설명/카드 ${nDesc}줄 ==`);
  pending.push([file, lines.join("\n")]);
})();

// ── 2) 코드·문서·csv 메모 ──
for (const t of FILES) {
  const file = path.join(ROOT, t.file);
  if (!fs.existsSync(file)) { problems.push(`없는 파일: ${t.file}`); continue; }
  let lines = fs.readFileSync(file, "utf8").split("\n");
  const before = lines.slice();
  for (const s of SPECIAL.filter((x) => x.file === t.file)) {
    let hit = 0;
    lines = lines.map((l) => {
      if (s.line && !s.line.test(l)) return l;
      const cut = t.mark ? commentAt(l, t.mark) : l.length;   // 코드 파일은 주석 앞까지만
      const head = l.slice(0, cut);
      if (!head.includes(s.from)) return l;
      hit += head.split(s.from).length - 1;
      return head.split(s.from).join(s.to) + l.slice(cut);
    });
    if (hit !== (s.count || 1)) problems.push(`${t.file}: 특수 교체 「${s.from}」 ${hit}곳 (예상 ${s.count || 1})`);
  }
  if (t.mode !== "none") {
    lines = lines.map((l) => {
      if (SKIP_LINE.some((r) => r.test(l))) return l;
      if (t.mode === "lit") return mapLiterals(l, t.mark, replaceNames);
      if (t.mode === "line") return replaceNames(l);
      if (t.mode === "note") { const k = noteIndex(l); return k < 0 ? l : l.slice(0, k + 1) + replaceNames(l.slice(k + 1)); }
      return l;
    });
  }
  let count = 0;
  lines.forEach((l, i) => {
    if (l !== before[i]) { count++; report.push(`${t.file}:${i + 1}\n        - ${before[i].trim()}\n        + ${l.trim()}`); }
    if (targetHasOld(l, t)) problems.push(`${t.file}:${i + 1} 교체 뒤에도 옛 이름 — ${l.trim().slice(0, 80)}`);
  });
  report.push(`== ${t.file}: ${count}줄 ==`);
  pending.push([file, lines.join("\n")]);
}

// ── 출력 ──
const text = report.join("\n") + (problems.length ? "\n\n멈춤 — 고칠 것:\n  " + problems.join("\n  ") : "\n\n검사 통과 (" + (WRITE ? "씀" : "미리보기") + ")");
console.log(text);
if (OUT) fs.writeFileSync(OUT, text + "\n");
if (problems.length) process.exit(1);
if (WRITE) for (const [f, t] of pending) fs.writeFileSync(f, t);
console.log(WRITE ? "\n썼습니다. 다음: npm run gen → node tools/check_data.cjs → node tools/check_voice.cjs → npm test → 메이커 확인"
                  : "\n미리보기만 했습니다 (--write 로 실제 교체).");
