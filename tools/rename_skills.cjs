#!/usr/bin/env node
// 스킬 이름 A안(외래어) 일괄 교체 — 초안 (docs/design/54-skill-names-A-20261101.md §5)
// ⚠ 사용자 승인 전 실행 금지. 승인 뒤에도 먼저 기본(미리보기)으로 돌려 바뀔 줄을 확인하고, 그다음 --write.
//
// 사용:
//   node tools/rename_skills.cjs                 미리보기(파일을 바꾸지 않음) — 바뀔 줄과 검사 결과만 출력
//   node tools/rename_skills.cjs --write         실제로 쓴다
//   node tools/rename_skills.cjs --rite=keep     거인 분리를 하지 않을 때(bone_rite = 「본 리추얼」)
//   (장비 옵션 이름은 이 도구가 바꾸지 않는다 — 54 §4-4 사용자 결정 뒤 별도 작업 + ItemData.MigrateLegacyItem 이전 줄 필요)
//
// 하는 일
//   1) data/skills.csv: name 열을 id 기준으로 교체(지금 이름이 표의 「옛 이름」과 다르면 멈춤) + desc·card 열 안의 옛 이름 교체
//   2) 코드·문서 문자열: TARGETS에 적은 파일만, 「옛 이름」별 예상 줄 수가 맞을 때만, 주석이 아닌 문자열 리터럴 안에서만 교체
//   3) HUD 버프 칩 짧은 이름(CHIP) — 칸 56px라 긴 새 이름 대신 정해 둔 짧은 말
//   4) 바꾼 자리 뒤 조사(은/는·이/가·을/를·과/와·으로/로·이나/나)를 새 이름 받침에 맞춤
//   5) 검사: 새 이름 중복·글자 수(메인 7 · 노드 11)·새 이름이 다른 옛 이름을 품는지 · 쓴 뒤 대상 문자열에 옛 이름이 남았는지
// 하지 않는 일: gen(→ node tools/gen_data.cjs) · 검사(check_data·check_voice·npm test) · 메이커 확인 — 54 §5 순서대로 사람이/에이전트가 따로
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const WRITE = process.argv.includes("--write");
const RITE_SPLIT = !process.argv.includes("--rite=keep");

// ── 옛 이름 → 새 이름 (id 기준 · 긴 옛 이름부터 — 「뼈까지 쇠약」을 「쇠약」보다 먼저) ──
const MAP = {
  giant_gs_twice: ["세 줄 가르기", "트리플 슬래시"],
  prison_pull: ["끌어당기는 뼈", "그래비티 프리즌"],
  step_hunt: ["사냥꾼의 걸음", "킬 부스트"],
  skel_burst: ["무너지는 뼈", "본 익스플로젼"],
  deploy_expand: ["그림자 증원", "쉐도우 레기온"],
  mage_legion: ["마법사 증원", "메이지 레기온"],
  armor_thorns: ["터지는 갑옷", "실드 버스트"],
  mist_wide: ["번지는 안개", "미스트-익스텐드"],
  shadow_sacrifice: ["그림자 희생", "쉐도우 버스트"],
  death_wave: ["죽음의 파동", "데스 노바"],
  mark_weakness: ["약화의 낙인", "앰플리파이"],
  curse_power: ["저주의 무게", "커스-리인포스"],
  enfeeble_deep: ["뼈까지 쇠약", "위크니스-리인포스"],
  swift_step: ["가벼운 걸음", "헤이스트"],
  skeleton_mastery: ["단련된 뼈", "스켈레톤 마스터리"],
  extract_mastery: ["추출 숙련", "소울 캐치"],
  mage_focus: ["원소 집중", "메이지-리인포스"],
  mage_curse: ["저주 속성", "커스 메이지"],
  bomb_marrow: ["골수 화약", "봄-리인포스"],
  giant_gs_scar: ["갈라진 땅", "어스 크랙"],
  giant_twin_flurry: ["끝없는 칼", "퓨리-퍼시스트"],
  giant_twin_reset: ["피의 질주", "체인 러시"],
  giant_mage_meteor: ["큰 메테오", "메테오-익스텐드"],
  giant_mage_resist: ["원소 붕괴", "파이어 브레이크"],
  giant_mage_pull: ["폭발 증폭", "인페르노"],
  offering_heal: ["진한 성찬", "오퍼링-리인포스"],
  offering_wide: ["넓은 성찬", "오퍼링-익스텐드"],
  offering_frenzy: ["피의 고양", "오퍼링 프렌지"],
  elite_promote: ["정예 승격", "엘리트 쉐도우"],
  aura_deep: ["깊은 울림", "오라-리인포스"],
  bone_shard: ["골편 투척", "본 다트"],
  armor_thick: ["두꺼운 뼈", "실드-리인포스"],
  hex_flame: ["저주 불꽃", "커스 헌트"],
  flame_hex: ["낙인 연소", "헌트-리인포스"],
  bone_prison: ["골격 감옥", "본 프리즌"],
  soul_drain: ["생기 앗기", "소울 드레인"],
  frost_long: ["서리 표식", "프로스트 마크"],
  storm_fast: ["회전 가속", "스톰-액셀레이션"],
  soul_torrent: ["영혼 격류", "호밍 소울"],
  curse_area: ["저주 범위", "커스-익스텐드"],
  curse_duration: ["저주 지속", "커스-퍼시스트"],
  thorn_curse: ["가시 저주", "페인 리플렉트"],
  life_tap: ["생명 약탈", "라이프 스틸"],
  resist_break: ["저항 붕괴", "레지스트 다운"],
  plague_curse: ["역병 저주", "커스 스프레드"],
  wraith_dash: ["망령 질주", "팬텀 대쉬"],
  dash_quick: ["재빠른 숨", "대쉬-쿨타임 리듀스"],
  dash_legion: ["군단 질주", "팔로우 대쉬"],
  dash_trail: ["망령 자취", "대쉬 슬래시"],
  dash_blink: ["망령 도약", "텔레포트"],
  skel_legion: ["뼈 군단", "스켈레톤 레기온"],
  skel_resonance: ["뼈 공명", "본 레조넌스"],
  bone_rite: ["뼈 의식", "스켈레톤 봄"],
  bomb_wide: ["큰 폭발", "봄-익스텐드"],
  bomb_pair: ["짝 폭탄", "더블 봄"],
  giant_shield_wall: ["뼈 성벽", "가디언 월"],
  giant_shield_phalanx: ["뼈 방진", "팔랑크스"],
  giant_gs_spin: ["긴 회전", "휠윈드-퍼시스트"],
  bone_offering: ["뼈 성찬", "오퍼링 힐"],
  elite_twin: ["정예 둘", "트윈 엘리트"],
  shard_multi: ["모인 뼈", "다트 포커스"],
  shard_spike: ["뼈 가시", "바운스-리인포스"],
  bone_armor: ["뼈 갑옷", "본 실드"],
  poison_spread: ["독 확산", "포이즌 스프레드"],
  mist_thick: ["짙은 독", "미스트-퍼시스트"],
  prison_wide: ["큰 감옥", "프리즌-익스텐드"],
  drain_share: ["혼 사슬", "체인 드레인"],
  frost_soul: ["서리 혼", "프로즌 오브"],
  bone_storm: ["뼈 폭풍", "본 스톰"],
  dash_ghost: ["뼈 껍질", "대쉬 실드"],
  dash_charge: ["여분 숨", "더블 대쉬"],
  poison_mist: ["독안개", "포이즌 미스트"],
  step_gale: ["잔걸음", "애프터 대쉬"],
  command_mastery: ["군령", "쉐도우 마스터리"],
  giant_twin_echo: ["잔상", "에코 러시"],
  command_aura: ["호령", "커맨드 오라"],
  shard_bounce: ["튕김", "다트 바운스"],
  flame_twin: ["쌍불", "더블 헌트"],
  frost_shatter: ["파쇄", "아이스 버스트"],
  enfeeble: ["쇠약", "위크니스"],
  enfeeble_decay: ["쇠퇴", "위크니스 슬로우"],
  terror: ["공포", "피어"],
  terror_frenzy: ["광란", "피어 컨퓨전"],
};
if (!RITE_SPLIT) MAP.bone_rite = ["뼈 의식", "본 리추얼"];
const NODE = new Set(); // skills.csv kind=node 로 채움

// ── 문자열 교체 대상: 파일 · 옛 이름별 「그 이름이 든 문자열 줄 수」(54 §4 조사 시점 b433de46 기준) ──
//   줄 수가 다르면 그 사이 코드가 바뀐 것 → 멈추고 54 §4 표를 다시 맞춘다 (조용히 덜/더 바꾸지 않기)
const TARGETS = [
  { file: "RootDesk/MyDesk/Monster/MonsterStatus.mlua", expect: {"약화의 낙인": 1, "쇠약": 1, "가시 저주": 1, "공포": 1, "생명 약탈": 1, "쇠퇴": 1, "저항 붕괴": 1, "골격 감옥": 1, "저주 속성": 1, "서리 표식": 1} },
  { file: "RootDesk/MyDesk/Player/PlayerStats.mlua", expect: {"약화의 낙인": 1, "쇠약": 1, "쇠퇴": 1} },
  { file: "RootDesk/MyDesk/Progress/NightmarePreview.mlua", expect: {"뼈 의식": 1} },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", expect: {"골편 투척": 1} },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", expect: {"그림자 증원": 1, "뼈 갑옷": 3, "서리 혼": 2, "뼈 성찬": 2, "망령 질주": 3, "독안개": 2, "저주 속성": 1, "약화의 낙인": 1, "쇠약": 2, "쇠퇴": 1, "골격 감옥": 1, "공포": 1, "호령": 1, "독 확산": 1, "뼈 군단": 1, "마법사 증원": 1} },
  { file: "RootDesk/MyDesk/Skill/SkillEffects.mlua", expect: {"서리 혼": 1, "정예 둘": 1} },
  { file: "RootDesk/MyDesk/Test/SelfTest.mlua", expect: {"단련된 뼈": 1, "그림자 증원": 1, "골편 투척": 1} },
  { file: "RootDesk/MyDesk/UI/Hud/GuideCoach.mlua", expect: {"그림자 증원": 1} },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", expect: {"망령 질주": 1, "망령 도약": 1, "호령": 4, "뼈 갑옷": 1, "가벼운 걸음": 1, "잔걸음": 2, "사냥꾼의 걸음": 1} },
  { file: "RootDesk/MyDesk/UI/Windows/GuideWindow.mlua", expect: {"그림자 증원": 1} },
  { file: "docs/ui/message-rules.md", expect: {"호령": 1} },
  { file: "docs/ui/mobile-layout.md", expect: {"뼈 의식": 1} },
  { file: "tools/check_data.cjs", expect: {"저주 속성": 1, "폭발 증폭": 1} },
  { file: "tools/check_decisions38.cjs", expect: {"뼈 의식": 1, "가벼운 걸음": 1} },
];
// ── 정해 둔 특수 교체 (일반 교체보다 먼저) ──
const SPECIAL = [
  // HUD 버프 칩 짧은 이름 (Buffs/B*/Label 56px · bestfit 11~15 → 한글 3~4자)
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "호령"', to: 'label = "오라"', expect: 2 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "뼈갑옷"', to: 'label = "실드"', expect: 1 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "잔걸음"', to: 'label = "애프터"', expect: 1 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "걸음"', to: 'label = "헤이스트"', expect: 1 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "사냥"', to: 'label = "부스트"', expect: 1 },
  { file: "RootDesk/MyDesk/UI/Hud/HudMain.mlua", from: 'label = "질주"', to: 'label = "대쉬"', expect: 1 },
  // 줄임 표기(「골편」「낙인」만 쓴 자리 — 옛 전체 이름 검색에 안 걸림 · 54 §4-2)
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '" · 낙인 +%g%%"', to: '" · 앰플리파이 +%g%%"', expect: 1 },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '"표식 남은 적에게 골편 피해 +%d%%"', to: '"표식 남은 적에게 본 다트 피해 +%d%%"', expect: 1 },
  { file: "RootDesk/MyDesk/Skill/SkillBook.mlua", from: '"골편이 2발 이상일 때', to: '"본 다트가 2발 이상일 때', expect: 1 },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"골편 한 발이 맞히는', to: '"본 다트 한 발이 맞히는', expect: 1 },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"저주를 걸면 낙인도 함께', to: '"저주를 걸면 앰플리파이도 함께', expect: 1 },
  { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"골편이 맞힌 뒤', to: '"본 다트가 맞힌 뒤', expect: 1 },
  // 선택 보상 이름 「꿰뚫는 골편」은 사용자 결정(54 §6 결정 3) — 승인되면 아래 줄 주석을 푼다
  // { file: "RootDesk/MyDesk/Quest/PlayerQuest.mlua", from: '"꿰뚫는 골편"', to: '"꿰뚫는 뼛조각"', expect: 1 },
  // 악몽 미리보기: 「뼈 의식 거인」 → 분리면 새 메인 이름 하나로
  { file: "RootDesk/MyDesk/Progress/NightmarePreview.mlua", from: '"뼈 의식 거인"', to: RITE_SPLIT ? '"본 자이언트"' : '"본 리추얼 거인"', expect: 1 },
];
// 같은 파일 안이라도 건드리면 안 되는 줄 (다른 뜻의 같은 낱말 — 54 §4-3 「제외」)
// skills.csv 설명에서 일반 낱말로 쓰인 옛 이름 — 교체 뒤 되돌린다
// skills.csv 설명의 줄임 표기 「골편」 (옛 전체 이름 교체 뒤 남는 것)
const CSV_STEMS = [["골편이 좁게 모여", "본 다트가 좁게 모여"], ["골편이 더 깊이", "본 다트가 더 깊이"]];
const KEEP_WORDS = [["에코 러시를 남기며", "잔상을 남기며"], ["에코 러시 둘이", "잔상 둘이"]];
const SKIP_LINE = [/수호령의/, /혼 사슬 제단/, /혼 사슬의 의식/, /"armor2"/, /StatNames\[/, /모든 저주 (범위|지속) \+/, /번 튕김/, /잔상 둘이 같은 길/];

const problems = [];
const report = [];
const pending = []; // [file, text] — 모든 검사가 통과한 뒤에만 한꺼번에 쓴다

// ── 조사 맞춤 ──
function jong(word) {
  const ch = word.trim().slice(-1);
  const c = ch.charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return -1;
  return (c - 0xac00) % 28; // 0 = 받침 없음 · 8 = ㄹ
}
const PAIRS = [["으로", "로"], ["이나", "나"], ["은", "는"], ["이", "가"], ["을", "를"], ["과", "와"]];
function fixJosa(text, newName) {
  // 새 이름 바로 뒤(」 ' " 하나까지 허용)에 붙은 조사를 받침에 맞춘다
  const j = jong(newName);
  if (j < 0) return text;
  const esc = newName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(esc + "([」'\"]?)(으로|이나|은|는|이|가|을|를|과|와|로|나)(?![가-힣])|" + esc + "([」'\"]?)(으로|이나|은|는|을|를|과|와|로)", "g"), (m, q1, p1, q2, p2) => {
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

// ── 문자열 리터럴 범위 (주석 앞까지) ──
function literalRanges(line, commentMark) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line.startsWith(commentMark, i)) break;
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
function replaceInLiterals(line, commentMark, pairs) {
  const ranges = literalRanges(line, commentMark);
  if (!ranges.length) return line;
  let res = "", last = 0;
  for (const [a, b] of ranges) {
    let seg = line.slice(a, b);
    for (const [o, n] of pairs) if (seg.includes(o)) seg = fixJosa(seg.split(o).join(n), n);
    res += line.slice(last, a) + seg;
    last = b;
  }
  return res + line.slice(last);
}
const sortedPairs = (olds) => Object.values(MAP).filter(([o]) => olds.includes(o)).sort((x, y) => y[0].length - x[0].length);

// ── 0) 사전 검사 ──
(function preflight() {
  const news = Object.values(MAP).map((x) => x[1]);
  const dup = news.filter((n, i) => news.indexOf(n) !== i);
  if (dup.length) problems.push("새 이름 중복: " + dup.join(", "));
  const olds = Object.values(MAP).map((x) => x[0]);
  for (const n of news) for (const o of olds) if (n !== o && n.includes(o)) problems.push(`새 이름 「${n}」이 옛 이름 「${o}」을 품음 — 두 번 돌리면 겹쳐 바뀜`);
})();

// ── 1) skills.csv ──
(function skills() {
  const file = path.join(ROOT, "data/skills.csv");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const head = lines[0].split(",");
  if (head[0] !== "id" || head[1] !== "name") { problems.push("skills.csv 머리 줄이 id,name,… 이 아님"); return; }
  const kindAt = head.indexOf("kind");
  const pairsAll = Object.values(MAP).sort((x, y) => y[0].length - x[0].length);
  let changedName = 0, changedDesc = 0;
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.trim()) continue;
    const m = ln.match(/^([a-z0-9_]+),([^,]*),(.*)$/);
    if (!m) { problems.push(`skills.csv ${i + 1}행: id,name 을 읽지 못함`); continue; }
    const [, id, name, rest] = m;
    if (rest.split(",")[kindAt - 2] === "node") NODE.add(id);
    let newName = name;
    if (MAP[id]) {
      if (name !== MAP[id][0]) { problems.push(`skills.csv ${id}: 지금 이름 「${name}」 ≠ 표의 옛 이름 「${MAP[id][0]}」`); continue; }
      newName = MAP[id][1];
      changedName++;
    }
    // desc·card 등 나머지 열: 옛 이름 → 새 이름 (RUID·숫자 열에는 한글이 없다)
    let newRest = rest;
    for (const [o, n] of pairsAll) if (newRest.includes(o)) newRest = fixJosa(newRest.split(o).join(n), n);
    // 일반 낱말 되돌리기: 설명 속 「잔상」이 노드 이름이 아니라 동작을 뜻하는 자리 (step_gale · giant_twin_echo 설명)
    for (const [bad, keep] of KEEP_WORDS) newRest = newRest.split(bad).join(keep);
    for (const [a, b] of CSV_STEMS) newRest = newRest.split(a).join(b);
    if (newRest !== rest) changedDesc++;
    const out = `${id},${newName},${newRest}`;
    if (out !== ln) { report.push(`skills.csv:${i + 1}  ${ln.slice(0, 90)}\n        → ${out.slice(0, 90)}`); lines[i] = out; }
  }
  // 글자 수 검사 (메인 7 · 노드 11 — 54 §1-1)
  for (const [id, [, n]] of Object.entries(MAP)) {
    const lim = NODE.has(id) ? 11 : 7;
    if ([...n].length > lim) problems.push(`글자 수 초과: ${id} 「${n}」 ${[...n].length} > ${lim}`);
  }
  report.push(`skills.csv: 이름 ${changedName}줄 · 설명/카드 ${changedDesc}줄`);
  pending.push([file, lines.join("\n")]);
})();

// ── 2) 코드·문서 문자열 ──
for (const t of TARGETS) {
  const file = path.join(ROOT, t.file);
  if (!fs.existsSync(file)) { problems.push(`없는 파일: ${t.file}`); continue; }
  const isMd = t.file.endsWith(".md");
  const mark = t.file.endsWith(".cjs") ? "//" : "--";
  let lines = fs.readFileSync(file, "utf8").split("\n");
  // 특수 교체 먼저
  for (const s of SPECIAL.filter((x) => x.file === t.file)) {
    const hit = lines.filter((l) => l.includes(s.from)).length;
    if (hit !== s.expect) { problems.push(`${t.file}: 「${s.from}」 ${hit}줄 (예상 ${s.expect})`); continue; }
    lines = lines.map((l) => l.split(s.from).join(s.to));
  }
  // 옛 이름별 예상 줄 수 확인
  const olds = Object.keys(t.expect);
  for (const o of olds) {
    const n = lines.filter((l) => !SKIP_LINE.some((r) => r.test(l)) && (isMd ? l.includes(o) : literalRanges(l, mark).some(([a, b]) => l.slice(a, b).includes(o)))).length;
    const want = t.expect[o] - SPECIAL.filter((s) => s.file === t.file && s.from.includes(o)).reduce((acc, s) => acc + s.expect, 0);
    if (n !== want && n !== t.expect[o]) problems.push(`${t.file}: 「${o}」 문자열 줄 ${n} (예상 ${t.expect[o]})`);
  }
  const pairs = sortedPairs(olds);
  let count = 0;
  lines = lines.map((l, i) => {
    if (SKIP_LINE.some((r) => r.test(l))) return l;
    let out = l;
    if (isMd) { for (const [o, n] of pairs) if (out.includes(o)) out = fixJosa(out.split(o).join(n), n); }
    else out = replaceInLiterals(l, mark, pairs);
    if (out !== l) { count++; report.push(`${t.file}:${i + 1}\n        - ${l.trim().slice(0, 110)}\n        + ${out.trim().slice(0, 110)}`); }
    return out;
  });
  // 쓴 뒤 남은 옛 이름 (대상 문자열 안)
  for (const o of olds) {
    const left = lines.filter((l) => !SKIP_LINE.some((r) => r.test(l)) && (isMd ? l.includes(o) : literalRanges(l, mark).some(([a, b]) => l.slice(a, b).includes(o)))).length;
    if (left) problems.push(`${t.file}: 교체 뒤에도 「${o}」 ${left}줄 남음`);
  }
  report.push(`${t.file}: ${count}줄`);
  pending.push([file, lines.join("\n")]);
}

// ── 출력 ──
console.log(report.join("\n"));
if (problems.length) {
  console.error("\n멈춤 — 고칠 것:\n  " + problems.join("\n  "));
  process.exit(1);
}
if (WRITE) for (const [f, text] of pending) fs.writeFileSync(f, text);
console.log(WRITE ? "\n썼습니다. 다음: node tools/gen_data.cjs → node tools/check_data.cjs → node tools/check_voice.cjs → npm test → 메이커 확인(54 §5-4)"
                  : "\n미리보기만 했습니다 (--write 로 실제 교체).");
