#!/usr/bin/env node
// 데이터 무결성 검사 (data/*.csv). 표끼리의 참조가 끊기면 게임에서는 조용히 빈 값이 되므로 여기서 막는다.
//   id 중복, 룬워드 → 룬, 아이템 옵션 키 → stats.csv, 유니크 → 베이스, 스킬 선행 → 스킬,
//   의뢰 대상 → 몬스터 sourceId·맵 표식, 맵 출현·고정 몬스터 → monsters.csv, BGM → sounds.csv,
//   웨이포인트 ↔ 맵, 보스 → 몬스터, 난이도 순번, RUID 형식
// 사용: node tools/check_data.cjs   (GAME_DATA_DIR=<dir>로 다른 폴더 검사 가능)
"use strict";
const { load, num } = require("./lib/csv.cjs");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const errors = [];
const err = (table, row, msg) => errors.push(`${table}.csv${row !== null ? " " + (row + 2) + "행" : ""}: ${msg}`);

const T = {};
for (const name of ["config", "difficulty", "stats", "item_bases", "item_affixes", "item_uniques", "runes", "runewords", "skills", "quests", "named", "waypoints", "monsters", "bosses", "maps", "sounds", "shop", "objects", "npcs", "monster_ranks", "variants", "item_sets", "item_set_pieces", "drop_tables", "ui_icons", "map_sets", "rite_giants", "monster_frames"]) {
  try { T[name] = load(name); } catch (e) { err(name, null, "읽을 수 없음 — " + e.message); T[name] = []; }
}

function unique(table, col) {
  const seen = new Map();
  T[table].forEach((r, i) => {
    const v = r[col];
    if (v === "") err(table, i, `${col} 비어 있음`);
    else if (seen.has(v)) err(table, i, `${col} '${v}' 중복 (${seen.get(v) + 2}행)`);
    else seen.set(v, i);
  });
  return new Set(seen.keys());
}

const statKeys = unique("stats", "key");
const baseIds = unique("item_bases", "id");
unique("item_affixes", "id");
const runeIds = unique("runes", "id");
const skillIds = unique("skills", "id");
const monsterIds = unique("monsters", "id");
const sourceIds = unique("monsters", "sourceId");
const archIds = new Set(load("archetypes").map((r) => r.id));
// 몬스터 상태 (각성 등): 속도 배율은 숫자, 색조는 "r,g,b", 글자색은 #RRGGBB
load("monster_states").forEach((r, i) => {
  for (const k of ["speedPct", "attackPct"]) if (r[k] === "" || isNaN(Number(r[k]))) err("monster_states", i, `${k} '${r[k]}' — 숫자가 아님`);
  if (r.tint !== "" && !/^[\d.]+,[\d.]+,[\d.]+$/.test(r.tint)) err("monster_states", i, `tint '${r.tint}' — "r,g,b"가 아님`);
  if (!/^#[0-9A-Fa-f]{6}$/.test(r.color)) err("monster_states", i, `color '${r.color}' — #RRGGBB가 아님`);
});
const mapIds = unique("maps", "id");
const soundKeys = unique("sounds", "key");
const wpIds = unique("waypoints", "id");
unique("difficulty", "id");
unique("config", "key");

const SLOTS = new Set(["weapon", "offhand", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring", "lamp"]);
const ELEMENTS = new Set(["", "fire", "cold", "light", "poison", "magic"]);
const RUID = /^[0-9a-f]{32}$/;

// "dmgPct=15,def=10" 형태 옵션 문자열
function checkMods(table, i, col, text) {
  if (text === "") return;
  for (const part of text.split(",")) {
    const m = part.trim().match(/^(\w+)=(-?[\d.]+)$/);
    if (!m) err(table, i, `${col} '${part}' 형식 오류 (키=숫자)`);
    else if (m[1].startsWith("sk_")) {
      // 단일 스킬 레벨 sk_<메인 스킬 id> (docs/design/19)
      const sk = T.skills.find((s) => s.id === m[1].slice(3));
      if (!sk || sk.kind === "node") err(table, i, `${col}의 '${m[1]}' — skills.csv에 없는 메인 스킬`);
    } else if (!statKeys.has(m[1])) err(table, i, `${col}의 '${m[1]}' — stats.csv에 없는 능력치`);
  }
}

// ── 아이템 ──
T.item_bases.forEach((r, i) => {
  if (!SLOTS.has(r.slot)) err("item_bases", i, `slot '${r.slot}' 알 수 없음`);
  if (!["", "true", "false"].includes(r.drop || "")) err("item_bases", i, "drop — 빈칸 / true / false");
  // 베이스 3등급 (docs/design/19): 0 일반형 Lv1~30 · 1 강화형 31~60 · 2 정예형 61~90
  const g = r.grade || "0";
  if (!["0", "1", "2"].includes(g)) err("item_bases", i, "grade — 0 / 1 / 2");
  else if (num(r.reqLv) > [30, 60, 90][num(g)] || num(r.reqLv) < [1, 31, 61][num(g)]) err("item_bases", i, `grade ${g}인데 reqLv ${r.reqLv} — 등급 구간 밖`);
});
T.item_affixes.forEach((r, i) => {
  if (!statKeys.has(r.stat)) err("item_affixes", i, `stat '${r.stat}' — stats.csv에 없음`);
  if (num(r.min) > num(r.max)) err("item_affixes", i, "min > max");
  // 난이도 구간 (docs/design/19): 0 보통 · 1 악몽(아이템 레벨 31~) · 2 지옥(61~)
  if (!["0", "1", "2"].includes(r.tier || "0")) err("item_affixes", i, "tier — 0 / 1 / 2");
  else if (num(r.minIlvl) < [1, 31, 61][num(r.tier || 0)]) err("item_affixes", i, `tier ${r.tier}인데 minIlvl ${r.minIlvl} — 그 난이도 첫 아이템 레벨보다 낮다`);
  for (const s of r.slots.split(/[,;|]/)) if (s !== "" && s !== "any" && !SLOTS.has(s)) err("item_affixes", i, `slots '${s}' 알 수 없음`);
});
unique("item_uniques", "id");
T.item_uniques.forEach((r, i) => {
  if (!baseIds.has(r.base)) err("item_uniques", i, `base '${r.base}' — item_bases에 없음`);
  if (r.source !== "" && !sourceIds.has(r.source)) err("item_uniques", i, `source '${r.source}' — monsters.csv sourceId에 없음`);
  checkMods("item_uniques", i, "mods", r.mods);
  if ((r.weight || "") !== "" && !(num(r.weight) > 0)) err("item_uniques", i, "weight — 빈칸(=1) 또는 0보다 큰 수");
});
T.runes.forEach((r, i) => { for (const c of ["weapon", "armor", "lamp"]) checkMods("runes", i, c, r[c]); });
T.runewords.forEach((r, i) => {
  for (const id of r.runes.split(",")) if (!runeIds.has(id.trim())) err("runewords", i, `룬 '${id}' — runes.csv에 없음`);
  for (const s of r.slots.split(/[,;|]/)) if (!SLOTS.has(s)) err("runewords", i, `slots '${s}' 알 수 없음`);
  checkMods("runewords", i, "mods", r.mods);
});

// ── 드롭 표 ──
const dropRanks = unique("drop_tables", "rank");
for (const k of ["normal", "elite", "champion", "unique", "boss", "gamble", "quest"]) if (!dropRanks.has(k)) err("drop_tables", null, `'${k}' 없음`);
T.drop_tables.forEach((r, i) => {
  if (!(num(r.picks) >= 1)) err("drop_tables", i, "picks ≥ 1");
  if (!(num(r.none) + num(r.gold) + num(r.potion) + num(r.item) + num(r.rune) > 0)) err("drop_tables", i, "가중치 합 0");
  if (num(r.unique) + num(r.set) + num(r.rare) > 100) err("drop_tables", i, "유니크+세트+레어 > 100%");
});

// ── 세트 ──
const setIds = unique("item_sets", "id");
unique("item_set_pieces", "base");   // 베이스 하나는 세트 조각 하나 (조각을 베이스로 찾는다)
T.item_sets.forEach((r, i) => {
  for (const c of ["bonus2", "bonus3", "full"]) checkMods("item_sets", i, c, r[c]);
  // 그림자 상한은 정예형 세트 완성 효과에만, 중첩 없음 (10-12 결정 · docs/design/19 §5). grade 칸이 없던 옛 표는 모든 세트에 있어야 했다
  if (r.grade === undefined) { if (!/shadowCap=/.test(r.full)) err("item_sets", i, "완성 효과에 shadowCap(그림자 상한)이 없음"); }
  else if (r.grade === "2" && !/shadowCap=/.test(r.full)) err("item_sets", i, "정예형 세트 완성 효과에 shadowCap이 없음");
  else if (r.grade !== "2" && /shadowCap=/.test(r.bonus2 + r.bonus3 + r.full)) err("item_sets", i, "그림자 상한은 정예형 세트만");
  const n = T.item_set_pieces.filter((p) => p.set === r.id).length;
  if (n < 2) err("item_sets", i, `조각 ${n}개 — 2개 이상`);
});
T.item_set_pieces.forEach((r, i) => {
  if (!setIds.has(r.set)) err("item_set_pieces", i, `set '${r.set}' — item_sets.csv에 없음`);
  if (!baseIds.has(r.base)) err("item_set_pieces", i, `base '${r.base}' — item_bases.csv에 없음`);
  checkMods("item_set_pieces", i, "mods", r.mods);
});
for (const t of ["item_uniques", "runewords", "runes"]) {
  T[t].forEach((r, i) => { for (const c of ["mods", "weapon", "armor", "lamp"]) if (/shadowCap=/.test(r[c] || "")) err(t, i, "shadowCap은 세트 전용"); });
}
// 계열 (docs/design/19): 소환 command · 영혼 soul · 저주 curse · 범용 any
for (const t of ["item_uniques", "item_sets", "runewords"]) {
  T[t].forEach((r, i) => { if (r.tree !== undefined && !["command", "soul", "curse", "any"].includes(r.tree)) err(t, i, `tree '${r.tree}' — command / soul / curse / any`); });
}
// 룬워드 룬 수 ≤ 그 부위 베이스의 최대 소켓
T.runewords.forEach((r, i) => {
  const n = r.runes.split(",").length;
  for (const slot of r.slots.split(/[,;|]/)) {
    const max = Math.max(0, ...T.item_bases.filter((b) => b.slot === slot).map((b) => num(b.sockets)));
    if (n > max) err("runewords", i, `룬 ${n}개 — ${slot} 최대 소켓 ${max}`);
  }
});

// ── 스킬 ──
T.skills.forEach((r, i) => {
  if (!["command", "soul", "curse", "move"].includes(r.tree)) err("skills", i, `tree '${r.tree}' 알 수 없음`);   // move = 이동 (기동, 10-20 · 10-24 이름 변경)
  if (r.prereq !== "" && !skillIds.has(r.prereq)) err("skills", i, `prereq '${r.prereq}' — skills.csv에 없음`);
  if (num(r.maxLv) < 1) err("skills", i, "maxLv < 1");
  if (r.nextLv !== "" && num(r.nextLv) > 0 && num(r.nextLv) <= num(r.row)) err("skills", i, `nextLv ${r.nextLv} — 요구 레벨(row ${r.row})보다 커야 함`);
  // 강화 노드 (docs/design/16): 메인 스킬에 붙고, 필요 메인 랭크가 메인 최대 랭크 안
  if (r.kind === "node") {
    const parent = T.skills.find((x) => x.id === r.parent);
    if (!parent) err("skills", i, `parent '${r.parent}' — skills.csv에 없음`);
    else if (parent.kind === "node") err("skills", i, `parent '${r.parent}'가 강화 노드 — 메인 스킬이어야 함`);
    else if (num(r.need) > num(parent.maxLv)) err("skills", i, `need ${r.need} — 메인 최대 랭크 ${parent.maxLv}보다 큼`);
  } else if ((r.parent || "") !== "") err("skills", i, "메인 스킬에 parent가 있음");
});
for (const tree of ["command", "soul", "curse", "move"]) {
  // 10-11: 트리 칸 제한 없음 — 스킬 창은 해금 레벨 순 목록 (docs/design/16)
}

// ── 혼의 제물·선택 보상 카드 글 (10-29 오후 검수: 「골편 투척」 설명 95자가 카드 글 칸을 넘어 아래 초록 수치 줄을 덮었다) ──
//   카드 글 칸 OfferWin/Card{i}/Effect = 폭 222 · 높이 78 · 글꼴 17→13(BestFit) — tools/build/ui.cjs. 넣는 글은 SkillOffer.CardText와 같은 규칙:
//   skills.csv card 열이 있으면 그것, 없으면 desc의 첫 문장(괄호 밖에서 처음 나오는 「.」+빈칸 또는 글 끝까지 · 없으면 전체).
//   상한 N = 72자 — 메이커 실측(10-29, TextGUIRendererComponent.GetPreferredHeight/Width, 글꼴 13 · 폭 222):
//     줄 높이 19.24 → 4줄 77.0 ≤ 칸 78 (5줄 96.2는 넘침) · 한글 한 자 11.96px → 한 줄 18자 (빈칸 2.93 · 숫자 7.41은 더 좁다)
//     → 가장 넓은 한글로만 채워도 18자 × 4줄 = 72자는 4줄 안. (실제 설명 앞부분으로 재면 90자까지 4줄 · 80자 카드 글은 77px로 칸에 1px 남아 여유가 없었다)
//   넘치면 card 열에 짧은 카드 글을 적는다 (새 글귀 → docs/requests/copy-review-20261029-pm.md 「승인 전」). 칸은 말줄임으로도 막혀 있다(Overflow 1)
const CARD_TEXT_MAX = 72;
const CARD_TEXT_LINES = 4;
function firstSentence(text) {
  let depth = 0;
  const a = [...text];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "(") depth++;
    else if (a[i] === ")") depth = Math.max(0, depth - 1);
    else if (a[i] === "." && depth === 0 && (i === a.length - 1 || a[i + 1] === " " || a[i + 1] === "\n")) return a.slice(0, i + 1).join("");
  }
  return text;
}
function checkCardText(where, text) {
  const chars = [...text.replace(/\n/g, "")].length;
  const lines = text.split("\n").length;
  if (chars > CARD_TEXT_MAX) return `${where} 카드 글 ${chars}자 > ${CARD_TEXT_MAX}자 (13px·폭 222에서 4줄을 넘을 수 있다 — card 열에 짧은 글) : ${text}`;
  if (lines > CARD_TEXT_LINES) return `${where} 카드 글 줄바꿈 ${lines}줄 > ${CARD_TEXT_LINES}줄`;
  return null;
}
T.skills.forEach((r, i) => {
  const text = (r.card || "") !== "" ? r.card : firstSentence(r.desc);
  const p = checkCardText(r.id, text);
  if (p) err("skills", i, p);
});
//   선택 보상 카드(PlayerQuest.ChoiceDef — 코드 안 표)도 같은 칸에 들어간다: { 이름, 설명, 악몽·지옥, 아이콘 스킬 }
{
  const quest = fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/Quest/PlayerQuest.mlua"), "utf8");
  const defs = [...quest.matchAll(/\["(\d\w+)"\] = \{ "([^"]*)", "((?:[^"\\]|\\.)*)", "([^"]*)", "(\w+)" \}/g)];
  if (defs.length !== 9) err("skills", null, `PlayerQuest.ChoiceDef 선택 보상 표를 ${defs.length}개 읽었다 (9개여야 함 — 모양이 바뀌었으면 이 검사도 고친다)`);
  for (const m of defs) {
    if (!skillIds.has(m[5])) err("skills", null, `선택 보상 ${m[1]} 아이콘 스킬 '${m[5]}' — skills.csv에 없음`);
    const p = checkCardText(`선택 보상 ${m[1]}`, firstSentence(m[3].replace(/\\n/g, "\n")));
    if (p) err("skills", null, p);
  }
  // 카드 칸에는 CardText만 — 설명 전체(def.desc)를 바로 넣으면 이 검사가 지키는 상한이 무의미해진다
  const offer = fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/UI/Windows/SkillOffer.mlua"), "utf8");
  if (/\/Effect", def\.desc/.test(offer) || !/method string CardText/.test(offer)) err("skills", null, "SkillOffer.mlua: 카드 Effect 칸에 설명 전체(def.desc)를 넣는다 — CardText(def)로");
}

// 착용 가능한 부위의 외형 RUID는 아이콘과 같은 에셋을 사용한다.
const AVATAR_SLOTS = new Set(["weapon", "helm", "armor", "gloves", "boots"]);
// 예외: 잿빛 장막 유니크 베이스는 같은 디자인으로 따로 그린 아이콘(iconPx)을 쓴다.
// ashen_scythe는 커스텀 무기 외형(공식 무기 템플릿 필요) 등록 전까지 사신의 낫 외형을 빌려 쓴다 (2026-10-10).
const DRAWN_ICON_BASES = new Set(["ashen_robe", "ashen_gloves", "ashen_boots", "ashen_scythe"]);
T.item_bases.forEach((r, i) => {
  if (AVATAR_SLOTS.has(r.slot) && !RUID.test(r.avatar || "")) err("item_bases", i, "avatar — 착용 외형 RUID 필요");
  if (r.avatar && r.icon !== r.avatar && !(DRAWN_ICON_BASES.has(r.id) && num(r.iconPx) > 0)) err("item_bases", i, "icon과 avatar가 달라 착용 그림이 일치하지 않음");
});

// ── 아이콘: 베이스·스킬마다 그림, UI 아이콘 표는 키 중복 없이 RUID·색 형식 ──
T.item_bases.forEach((r, i) => { if (!RUID.test(r.icon || "")) err("item_bases", i, `icon '${r.icon}' — 32자리 RUID 필요`); });
T.skills.forEach((r, i) => { if (!RUID.test(r.icon || "")) err("skills", i, `icon '${r.icon}' — 32자리 RUID 필요`); });
unique("ui_icons", "key");
T.ui_icons.forEach((r, i) => {
  if (!RUID.test(r.ruid)) err("ui_icons", i, `ruid '${r.ruid}' 형식`);
  if (!/^#[0-9A-Fa-f]{6}$/.test(r.color)) err("ui_icons", i, `color '${r.color}' — #RRGGBB`);
  if (!(num(r.alpha) > 0 && num(r.alpha) <= 1)) err("ui_icons", i, `alpha ${r.alpha} — 0~1`);
});

// ── 몬스터·보스 ──
T.monsters.forEach((r, i) => {
  for (const c of ["baseLevel", "baseHp", "baseDmg", "atkIntervalSec", "speed"]) if (!(num(r[c], NaN) > 0)) err("monsters", i, `${c} 양수여야 함 ('${r[c]}')`);
  if (!ELEMENTS.has(r.element)) err("monsters", i, `element '${r.element}' 알 수 없음`);
  for (const part of r.resists.split(/[;,]/)) {
    if (part === "") continue;
    const m = part.match(/^(\w+)=(-?\d+)$/);
    if (!m || !ELEMENTS.has(m[1])) err("monsters", i, `resists '${part}' 형식 오류`);
  }
  for (const c of ["stand", "move", "hit", "die"]) if (!RUID.test(r[c])) err("monsters", i, `${c} RUID 형식 오류 ('${r[c]}')`);
  if (r.attack !== "" && !RUID.test(r.attack)) err("monsters", i, `attack RUID 형식 오류`);
  if (r.depth !== "" && r.depth !== "pool" && !/^every\d+$/.test(r.depth)) err("monsters", i, `depth '${r.depth}' — pool / everyN / 빈칸`);
  if (!archIds.has(r.archetype)) err("monsters", i, `archetype '${r.archetype}' — archetypes.csv에 없음`);
  if (!["", "burrow", "hitrun", "coward", "ranged", "nest", "phase"].includes(r.behavior)) err("monsters", i, `behavior '${r.behavior}' 알 수 없음`);
});
const bossIds = new Set();
T.bosses.forEach((r, i) => {
  bossIds.add(r.id);
  if (!monsterIds.has(r.id)) err("bosses", i, `id '${r.id}' — monsters.csv에 없음`);
  if (r.minion !== "" && !monsterIds.has(r.minion)) err("bosses", i, `minion '${r.minion}' — monsters.csv에 없음`);
  // 장판: 내려찍은 자리에 poolSec초 동안 남아 0.5초마다 속성 피해
  if (!(num(r.poolSec, 0) >= 0)) err("bosses", i, `poolSec '${r.poolSec}' — 0 이상`);
  if (num(r.poolSec, 0) > 0 && (r.poolElement === "" || !ELEMENTS.has(r.poolElement))) err("bosses", i, `poolElement '${r.poolElement}' 알 수 없음`);
  if (num(r.poolSec, 0) >= num(r.slamInterval) - 1) err("bosses", i, "poolSec는 slamInterval보다 1초 이상 짧아야 함 (예고 원과 겹침)");
  if (!["true", "false", ""].includes(r.atTarget)) err("bosses", i, `atTarget '${r.atTarget}' — true / false`);
  if (r.aura && !ELEMENTS.has(r.aura)) err("bosses", i, `aura '${r.aura}' — 속성 이름`);
  if (r.aura && !(num(r.auraRadius, 0) > 0 && num(r.auraMult, 0) > 0)) err("bosses", i, "aura가 있으면 auraRadius·auraMult > 0");
  if (r.ult && !["marks", "half"].includes(r.ult)) err("bosses", i, `ult '${r.ult}' — marks / half`);
  if (r.ult && !(num(r.ultMult, 0) > 0 && r.ultName)) err("bosses", i, "ult가 있으면 ultName·ultMult 필요");
  if (r.bond && !/^[a-z0-9_]+$/.test(r.bond)) err("bosses", i, `bond '${r.bond}' — 형제 묶음 이름 (영문 소문자)`);
  if (r.extra && !fs.existsSync(path.join(ROOT, "RootDesk/MyDesk/Monster", r.extra.replace(/^script\./, "") + ".mlua"))) err("bosses", i, `extra '${r.extra}' — RootDesk/MyDesk/Monster에 스크립트 없음`);
});

if (!T.monsters.some((r) => r.depth === "pool")) err("monsters", null, "depth=pool 몬스터가 하나도 없음 (심도 던전이 빈다)");

// ── 맵 ──
const markers = new Set();
T.maps.forEach((r, i) => {
  if (!soundKeys.has(r.bgm)) err("maps", i, `bgm '${r.bgm}' — sounds.csv에 없음`);
  // 출현 목록: 보통(spawns) · 악몽(spawnsNm) · 지옥(spawnsHell, 비면 보통 목록). 레벨은 보통 기준 (난이도 가산은 실행 시)
  for (const col of ["spawns", "spawnsNm", "spawnsHell"]) {
    for (const sp of (r[col] || "").split(";")) {
      if (sp === "") continue;
      const [id, count, level] = sp.split(":");
      if (!monsterIds.has(id)) err("maps", i, `${col} '${id}' — monsters.csv에 없음`);
      if (!(num(count) > 0) || !(num(level) > 0)) err("maps", i, `${col} '${sp}' 형식 오류 (id:수:레벨)`);
    }
    if (col !== "spawns" && r[col] && !r.spawns) err("maps", i, `${col}만 있고 spawns가 비었음`);
  }
  for (const f of r.fixed.split(";")) {
    if (f === "") continue;
    const id = f.split("@")[0];
    if (!monsterIds.has(id)) { err("maps", i, `fixed '${id}' — monsters.csv에 없음`); continue; }
    // 고정 배치 보스는 맵 레벨을 따로 받지 않는다 → 기본 레벨이 그 맵 출현 몬스터보다 낮으면 「최상위 Lv1」로 보인다 (10-11 처형인)
    const top = Math.max(0, ...(r.spawns || "").split(";").filter(Boolean).map((sp) => num(sp.split(":")[2])));
    const mon = T.monsters.find((m) => m.id === id);
    if (top > 0 && num(mon.baseLevel) < top) err("maps", i, `fixed '${id}' 기본 레벨 ${mon.baseLevel} < 이 맵 몬스터 Lv${top}`);
  }
  if (r.waypoint !== "") {
    const id = r.waypoint.split("@")[0];
    const wp = T.waypoints.find((w) => w.id === id);
    if (!wp) err("maps", i, `waypoint '${id}' — waypoints.csv에 없음`);
    else if (wp.map !== r.id) err("maps", i, `waypoint '${id}'의 map이 '${wp.map}' (이 맵은 '${r.id}')`);
    else {
      const [x, y] = r.waypoint.split("@")[1].split("/").map(Number);
      if (Math.hypot(num(wp.x) - x, num(wp.y) - y) > 2) err("waypoints", null, `${id} 도착 위치(${wp.x},${wp.y})가 웨이포인트(${x},${y})에서 2칸 넘게 떨어짐`);
    }
  }
  for (const x of r.extra.split(";")) {
    const m = x.match(/^altar:(\w+)@/);
    if (m) markers.add(m[1]);
  }
});
T.waypoints.forEach((r, i) => { if (!mapIds.has(r.map)) err("waypoints", i, `map '${r.map}' — maps.csv에 없음`); });

// ── 이름 있는 적 (named.csv) ──
const namedIds = new Set();
T.named.forEach((r, i) => {
  if (!mapIds.has(r.map)) err("named", i, `map '${r.map}' — maps.csv에 없음`);
  if (!["end", "ritual"].includes(r.place)) err("named", i, `place '${r.place}' — end / ritual`);
  if (r.id !== "") {
    namedIds.add(r.id);
    if (!monsterIds.has(r.model)) err("named", i, `model '${r.model}' — monsters.csv id에 없음`);
    if (!(num(r.hpMul) > 0)) err("named", i, "hpMul 양수여야 함");
  }
  if (r.escort !== "" && !monsterIds.has(r.escort)) err("named", i, `escort '${r.escort}' — monsters.csv id에 없음`);
  if (r.key !== "" && !sourceIds.has(r.key)) err("named", i, `key '${r.key}' — monsters.csv sourceId에 없음`);
});

// ── 의뢰 ──
const KINDS = ["kill", "extract", "reach", "raise", "clear", "boss", "ritual", "chest", "gate"];
T.quests.forEach((r, i) => {
  if (!KINDS.includes(r.kind)) err("quests", i, `kind '${r.kind}' 알 수 없음`);
  // kill 대상은 '|'로 여러 종류 (예: 창·방패 문지기)
  for (const t of r.kind === "kill" ? r.target.split("|") : r.kind === "chest" ? [r.target] : []) if (!sourceIds.has(t)) err("quests", i, `${r.kind} 대상 '${t}' — monsters.csv sourceId에 없음`);
  if (r.kind === "reach" && !markers.has(r.target)) err("quests", i, `reach 대상 '${r.target}' — maps.csv extra에 altar:${r.target} 없음`);
  if (r.kind === "raise" && !["skeleton", "mage", "revive"].includes(r.target)) err("quests", i, `raise 대상 '${r.target}' — skeleton / mage / revive`);
  if (r.kind === "clear" && !mapIds.has(r.target)) err("quests", i, `clear 대상 맵 '${r.target}' — maps.csv에 없음`);
  if ((r.kind === "boss" || r.kind === "ritual") && !namedIds.has(r.target)) err("quests", i, `${r.kind} 대상 '${r.target}' — named.csv id에 없음`);
  if (r.kind === "ritual" && !markers.has(r.map1)) err("quests", i, `ritual 제단 '${r.map1}' — maps.csv extra에 altar 없음`);
  if (r.kind === "chest" && !T.named.some((x) => x.map === r.map && x.chest === "true" && x.key === r.target)) err("quests", i, `chest — named.csv에 map '${r.map}' key '${r.target}' 봉인 상자 없음`);
  if (r.map !== "" && !mapIds.has(r.map)) err("quests", i, `map '${r.map}' — maps.csv에 없음`);
  if (r.kind === "chest" && !mapIds.has(r.map1)) err("quests", i, `chest 1단계 맵 '${r.map1}' — maps.csv에 없음`);
  if (!T.npcs.some((x) => x.kind === r.giver)) err("quests", i, `giver '${r.giver}' — npcs.csv kind에 없음`);
  if (![1, 2, 3, 4].includes(num(r.act))) err("quests", i, `act '${r.act}' — 1 ~ 4`);
  if (!(num(r.count) > 0)) err("quests", i, "count 양수여야 함");
  for (const part of r.reward.split(",")) {
    if (part === "") continue;
    const [k, v] = [part.slice(0, part.indexOf(":")), part.slice(part.indexOf(":") + 1)];
    if (k === "rune" && !runeIds.has(v)) err("quests", i, `보상 룬 '${v}' — runes.csv에 없음`);
    else if (k === "item" && !baseIds.has(v.split("|")[0])) err("quests", i, `보상 아이템 '${v.split("|")[0]}' — item_bases에 없음`);
    else if (["skp", "stp", "gen", "socket", "deploy", "runes", "respoison", "reslight", "resfire", "unique", "choice"].includes(k)) { if (!(num(v) > 0)) err("quests", i, `보상 '${part}' 수치 오류`); }
    else if (!["rune", "item"].includes(k)) err("quests", i, `보상 종류 '${k}' 알 수 없음`);
  }
});

// ── 몬스터 등급 (추출 확률 단일 기준) ──
const rankIds = unique("monster_ranks", "rank");
for (const k of ["normal", "elite", "unique", "boss"]) if (!rankIds.has(k)) err("monster_ranks", null, `'${k}' 등급 없음 (Monster:GetRank가 쓴다)`);
T.monster_ranks.forEach((r, i) => {
  const c = num(r.extractChance, -1);
  if (!(c > 0 && c <= 1)) err("monster_ranks", i, `extractChance ${r.extractChance} — 0 초과 1 이하`);
  const cap = num(r.extractCap, -1);
  if (!(cap >= c && cap <= 1)) err("monster_ranks", i, `extractCap ${r.extractCap} — extractChance 이상 1 이하`);
  if (![1, 2, 3].includes(num(r.shadowGrade))) err("monster_ranks", i, "shadowGrade 1~3");
});

// ── 변종 능력 ──
const variantIds = unique("variants", "id");
T.variants.forEach((r, i) => {
  const AURA_EFFECTS = ["dmg", "haste", "move", "guard", "regen", "resist", "thorns", "crit", "corrode"];   // 10-24 B안 9종 (MonsterStatus·ShadowUnit.AuraAmount)
  if (r.kind === "aura" && !AURA_EFFECTS.includes(r.effect)) err("variants", i, `오오라 effect '${r.effect}' — ${AURA_EFFECTS.join(" / ")}`);
  if ((r.kind === "skill" || r.kind === "cloud") && !(num(r.interval) > 0 && num(r.mult) > 0)) err("variants", i, "기술은 interval·mult 양수");
  if (!["aura", "skill", "cloud"].includes(r.kind)) err("variants", i, `kind '${r.kind}' — aura / skill / cloud`);
  if (!(num(r.radius) > 0)) err("variants", i, "radius 양수");
});
if (!T.variants.some((r) => num(r.weight) > 0)) err("variants", null, "weight > 0 인 변종이 없음 (무작위 변종 우두머리가 나오지 않는다)");
T.monsters.forEach((r, i) => { if (r.innate !== "" && !variantIds.has(r.innate)) err("monsters", i, `innate '${r.innate}' — variants.csv에 없음`); });

// ── 상점·오브젝트·NPC ──
const shopKeys = unique("shop", "key");
for (const k of ["hp", "mp", "rv", "tp", "gamble"]) if (!shopKeys.has(k)) err("shop", null, `'${k}' 품목 없음 (벨트·상점 창이 쓴다)`);
T.shop.forEach((r, i) => { if (!(num(r.price) > 0)) err("shop", i, "price 양수여야 함"); });
const objectModels = unique("objects", "model");
T.objects.forEach((r, i) => { if (!RUID.test(r.ruid)) err("objects", i, "ruid 형식 오류"); });
for (const need of ["WarpGate", "Brazier", "BloodAltar", "PlayerCorpse", "Waypoint", "DepthGate"]) if (!objectModels.has(need)) err("objects", null, `${need} 없음 (맵 빌드가 쓴다)`);
const npcModels = unique("npcs", "model");
T.npcs.forEach((r, i) => {
  if (!RUID.test(r.stand)) err("npcs", i, "stand RUID 형식 오류");
  if (!["shop", "quest", "smith", "merchant", "stash", "caravan", "captain", "scholar", "apothecary", "harbormaster", "keeperdaughter", "scout", "outpostcaptain", "deserter"].includes(r.kind)) err("npcs", i, `kind '${r.kind}' 알 수 없음`);
});
T.maps.forEach((r, i) => {
  // handmade = 손으로 지은 맵 시안 (data/handmade/<id>.txt·csv, 10-28). 필드 사슬·곁가지에 끼지 않고 포털·웨이포인트로 이어지지 않는다 — 개발자가 이동해 본다
  if (!["town", "field", "instance", "side", "handmade"].includes(r.kind)) err("maps", i, `kind '${r.kind}' — town / field / instance / side / handmade`);
  if (r.kind === "handmade" && !fs.existsSync(path.join(__dirname, "../data/handmade", r.id + ".txt"))) err("maps", i, `handmade 맵인데 data/handmade/${r.id}.txt 설계도가 없음`);
  // 크기와 좌표: 모든 위치가 맵 타일 범위 안 (x = -w/2 .. w/2-1, y = -h/2+1 .. h/2)
  const w = num(r.w), h = num(r.h);
  if (!(w >= 8 && h >= 6) || w % 2 || h % 2) err("maps", i, `크기 ${r.w}×${r.h} — 8×6 이상 짝수`);
  const inside = (text, what) => {
    const xy = text.includes("@") ? text.split("@")[1] : text;
    const [x, y] = xy.split("/").map(Number);
    if (Number.isNaN(x) || Number.isNaN(y)) return err("maps", i, `${what} 좌표 '${text}' 형식 오류`);
    if (x < -w / 2 + 1 || x > w / 2 - 2 || y < -h / 2 + 1 || y > h / 2 - 1) err("maps", i, `${what} '${text}' — 맵 ${w}×${h} 범위 밖 (포털 줄 x=±${w / 2 - 1} 제외)`);
  };
  for (const t of r.torches.split(";").filter(Boolean)) inside(t, "torches");
  for (const t of r.fixed.split(";").filter(Boolean)) inside(t, "fixed");
  for (const t of r.extra.split(";").filter(Boolean)) inside(t, "extra");
  if (r.waypoint !== "") inside(r.waypoint, "waypoint");
  if (r.kind === "side") {
    const parent = T.maps.find((m) => m.id === r.parent);
    if (!parent || parent.kind !== "field") err("maps", i, `parent '${r.parent}' — 필드 맵이어야 함`);
    // 던전 = entry 있는 첫 층 + 뒤따르는 entry 없는 층들 (한 필드에 던전 여러 개 가능)
    const sides = T.maps.filter((m) => m.kind === "side" && m.parent === r.parent);
    if (sides[0] === r && r.entry === "") err("maps", i, "곁가지 첫 층은 entry(부모 필드의 입구 위치)가 필요");
    if (r.entry !== "") {
      const [x, y] = r.entry.split("/").map(Number);
      for (const o of sides) {
        if (o === r || o.entry === "") continue;
        const [ox, oy] = o.entry.split("/").map(Number);
        if (Math.hypot(x - ox, y - oy) < 3) err("maps", i, `entry '${r.entry}' — 같은 필드의 ${o.id} 입구와 너무 가까움`);
      }
    }
    if (r.entry !== "" && parent) {
      const [x, y] = r.entry.split("/").map(Number);
      const pw = num(parent.w), ph = num(parent.h);
      if (x < -pw / 2 + 2 || x > pw / 2 - 3 || y < -ph / 2 + 2 || y > ph / 2 - 1) err("maps", i, `entry '${r.entry}' — 부모 ${parent.id} 범위 밖`);
    }
  }
  for (const x of r.extra.split(";")) {
    const m = x.match(/^npc:(\w+)@/);
    if (m && !npcModels.has(m[1])) err("maps", i, `npc '${m[1]}' — npcs.csv에 없음`);
    // 길 위 사건 (기획서 39 #7 A): 종류 · 사냥터만 · 둘레 장면 세트(map_sets.csv a<액트>_road_<종류>)가 있어야 한다
    const road = x.match(/^road:(\w+)@/);
    if (road) {
      if (!["chest", "shrine", "nest", "ritual"].includes(road[1])) err("maps", i, `extra '${x}' — 길 위 사건 종류는 chest·shrine·nest·ritual`);
      if (r.kind !== "field") err("maps", i, `extra '${x}' — 길 위 사건은 사냥터(field)에만`);
      if (!T.map_sets.some((s) => s.set === `a${r.act || 1}_road_${road[1]}`)) err("maps", i, `extra '${x}' — map_sets.csv에 장면 세트 a${r.act || 1}_road_${road[1]}이 없음`);
    }
  }
});
// 액트마다 마을 하나 (필드 사슬은 같은 액트의 마을에서 시작해 마을로 돌아온다)
for (const act of new Set(T.maps.map((r) => r.act || "1"))) {
  if (T.maps.filter((r) => (r.act || "1") === act && r.kind === "town").length !== 1) err("maps", null, `액트 ${act}: town은 정확히 하나여야 함`);
}

// ── 뼈 의식 거인 5종 (46-2 · rite_giants.csv · 수치는 46 결정 4 초안) ──
{
  const KINDS = ["basic", "shield", "greatsword", "twin", "mage"];
  const NUMS = ["hpMul", "guardPct", "atkMul", "interval", "radius", "range", "speedMul", "blastMul", "tauntSec", "tauntRadius", "s1Mul", "s1Cd", "s1Radius", "s2Mul", "s2Cd", "s2Reach"];
  const SHAPES = new Set(["single", "arc", "line", "dash", "field"]);
  const kinds = T.rite_giants.map((r) => r.kind);
  if (kinds.length !== KINDS.length || KINDS.some((k) => !kinds.includes(k))) err("rite_giants", null, `종류는 정확히 ${KINDS.join("·")} 다섯 줄이어야 함 (지금 ${kinds.join("·")})`);
  const frameKeys = new Set(T.monster_frames.map((r) => r.monster));
  T.rite_giants.forEach((r, i) => {
    for (const k of NUMS) if (r[k] === "" || isNaN(Number(r[k])) || Number(r[k]) < 0) err("rite_giants", i, `${k} '${r[k]}' — 0 이상 숫자가 아님`);
    // 48 §4-1 (K-4 정정): 기본 거인은 기술 없음 — s1·s2 칸을 통째로 비울 수 있다 (비우면 이름·재사용·모양도 비움 · 반쯤 빈 줄은 오류)
    const has1 = r.s1 !== "", has2 = r.s2 !== "";
    for (const k of ["hpMul", "atkMul", "interval", "range", "speedMul"].concat(has1 ? ["s1Cd"] : [], has2 ? ["s2Cd"] : [])) if (!(Number(r[k]) > 0)) err("rite_giants", i, `${k} 양수여야 함`);
    if (Number(r.guardPct) >= 90) err("rite_giants", i, "guardPct 90 미만이어야 함");
    if (has2 ? !SHAPES.has(r.s2Shape) : r.s2Shape !== "") err("rite_giants", i, `s2Shape '${r.s2Shape}' — single·arc·line·dash·field 중 하나 (s2가 비면 비움)`);
    if (r.name === "" || (has1 !== (r.s1Name !== "")) || (has2 !== (r.s2Name !== ""))) err("rite_giants", i, "이름·스킬 칸이 비어 있음 (스킬을 비우면 이름도 비운다)");
    if (!has1 && (Number(r.s1Mul) !== 0 || Number(r.s1Cd) !== 0 || Number(r.s1Radius) !== 0 || r.s1Opts !== "")) err("rite_giants", i, "s1이 비었는데 s1 수치가 남아 있음");
    if (!has2 && (Number(r.s2Mul) !== 0 || Number(r.s2Cd) !== 0 || Number(r.s2Reach) !== 0 || r.s2Opts !== "")) err("rite_giants", i, "s2가 비었는데 s2 수치가 남아 있음");
    if (r.kind !== "basic" && (!has1 || !has2)) err("rite_giants", i, "기술 없는 거인은 basic뿐 (48 §4-1)");
    for (const c of ["s1Opts", "s2Opts"]) for (const part of (r[c] || "").split(";").filter((x) => x !== "")) if (!/^\w+=[\d.]+$/.test(part)) err("rite_giants", i, `${c} '${part}' — "이름=숫자;…" 꼴이 아님`);
    if (r.frames !== `giant_${r.kind}`) err("rite_giants", i, `frames '${r.frames}' — giant_${r.kind}이어야 함`);
    else if (!frameKeys.has("form_" + r.frames)) err("rite_giants", i, `frames — monster_frames.csv에 form_${r.frames}가 없음`);
    if (!/초안/.test(r.note)) err("rite_giants", i, "note에 「초안」 표시가 있어야 함 (46 결정 4 — 확정 아님)");
  });
}

// ── 48 소환물 정리 (48-0 · 기획서 48 §0-3 · §4-4): 지운 노드 9개는 어느 표에도 남지 않고, 해골 전사 6 · 해골 마법사 3 · 거인 노드 12 = 21 ──
{
  const GONE = ["skel_shield", "mage_aura", "mage_twin", "mage_pierce", "mage_blast", "mage_hex", "giant_quake", "giant_basic_split", "giant_basic_return"];
  for (const id of GONE) if (skillIds.has(id)) err("skills", null, `48-0: '${id}'는 지운 노드 (투자는 SkillBook.MigrateLevels가 돌려줌)`);
  const choicesTxt = fs.readFileSync(path.join(ROOT, "data/skill_choices.csv"), "utf8");
  for (const id of GONE) if (new RegExp(`^${id},`, "m").test(choicesTxt)) err("skill_choices", null, `48-0: 지운 노드 '${id}'가 남아 있음`);
  const curse = T.skills.find((r) => r.id === "mage_curse");
  if (!curse || curse.parent !== "raise_mage" || curse.kind !== "node" || curse.maxLv !== "1") err("skills", null, "48-0: mage_curse(저주 속성) — raise_mage 노드 · 1랭크여야 함");
  const nodesOf = (p, pre) => T.skills.filter((r) => r.kind === "node" && r.parent === p && (!pre || r.id.startsWith(pre))).length;
  const counts = { skeleton: nodesOf("raise_skeleton"), mage: nodesOf("raise_mage"), giant: nodesOf("bone_rite", "giant_") };
  if (counts.skeleton !== 6 || counts.mage !== 3 || counts.giant !== 12) err("skills", null, `48-0 노드 수 해골 전사 ${counts.skeleton}/6 · 마법사 ${counts.mage}/3 · 거인 ${counts.giant}/12 (합 21)`);
  const basic = T.rite_giants.find((r) => r.kind === "basic");
  if (basic && (basic.s1 !== "" || basic.s2 !== "" || Number(basic.tauntSec) !== 0)) err("rite_giants", null, "48-0: 기본 거인은 s1·s2·도발 비움");
  const mage = T.rite_giants.find((r) => r.kind === "mage");
  if (mage) {
    const o = Object.fromEntries((mage.s2Opts || "").split(";").filter(Boolean).map((x) => x.split("=")));
    const cap = Number(o.radiusMax), base = Number(o.radius);
    if (mage.s2 === "meteor" && !(cap > 0 && base > 0 && base <= cap && cap <= 2)) err("rite_giants", null, `48-0 (리뷰 정정): 기도 메테오 반경 radius ${o.radius} · radiusMax ${o.radiusMax} — 상한 2.0 이하`);
  }
}

// ── 택일 묶음 (46-5 · skill_choices.csv · 44 결정 5 「둘 중 하나」) ──
{
  const choices = load("skill_choices");
  const byId = Object.fromEntries(T.skills.map((r) => [r.id, r]));
  const groups = {};
  choices.forEach((c, i) => {
    const sk = byId[c.id];
    if (!sk) err("skill_choices", i, `id '${c.id}' — skills.csv에 없음`);
    else if (sk.kind !== "node") err("skill_choices", i, `id '${c.id}' — 강화 노드(kind node)만 묶는다`);
    if (!/^\w+$/.test(c.group)) err("skill_choices", i, `group '${c.group}' — 비어 있거나 형식 오류`);
    if (c.hold !== "" && c.hold !== "1") err("skill_choices", i, `hold '${c.hold}' — "" 또는 1`);
    (groups[c.group] = groups[c.group] || []).push(c);
  });
  for (const [g, list] of Object.entries(groups)) {
    if (list.length !== 2) err("skill_choices", null, `group ${g}: 정확히 둘이어야 함 (지금 ${list.length})`);
    if (new Set(list.map((c) => c.hold)).size !== 1) err("skill_choices", null, `group ${g}: 한쪽만 보류 — 둘 다 보류이거나 둘 다 열려야 함 (46 §4-3)`);
    const parents = new Set(list.map((c) => (byId[c.id] || {}).parent));
    const needs = new Set(list.map((c) => (byId[c.id] || {}).need));
    if (parents.size !== 1 || needs.size !== 1) err("skill_choices", null, `group ${g}: 같은 메인·같은 필요 랭크여야 함`);
    for (const c of list) if ((byId[c.id] || {}).maxLv !== "1") err("skill_choices", null, `group ${g}: ${c.id} 갈림은 1랭크`);
  }
}

// ── 난이도·사운드 ──
T.difficulty.forEach((r, i) => {
  if (num(r.index, -1) !== i) err("difficulty", i, `index ${r.index} — 0부터 순서대로여야 함`);
  if (!(num(r.ambientMul) > 0)) err("difficulty", i, "ambientMul 양수여야 함");
});
T.sounds.forEach((r, i) => { if (!RUID.test(r.ruid)) err("sounds", i, `ruid 형식 오류`); });

for (const e of errors) console.log(e);
console.log(`\n[check_data] 표 ${Object.keys(T).length}개, 문제 ${errors.length}건`);
process.exitCode = errors.length ? 1 : 0;
