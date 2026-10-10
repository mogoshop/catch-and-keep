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
for (const name of ["config", "difficulty", "stats", "item_bases", "item_affixes", "item_uniques", "runes", "runewords", "skills", "quests", "named", "waypoints", "monsters", "bosses", "maps", "sounds", "shop", "objects", "npcs", "monster_ranks", "variants", "item_sets", "item_set_pieces", "drop_tables", "ui_icons"]) {
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
    else if (!statKeys.has(m[1])) err(table, i, `${col}의 '${m[1]}' — stats.csv에 없는 능력치`);
  }
}

// ── 아이템 ──
T.item_bases.forEach((r, i) => {
  if (!SLOTS.has(r.slot)) err("item_bases", i, `slot '${r.slot}' 알 수 없음`);
  if (!["", "true", "false"].includes(r.drop || "")) err("item_bases", i, "drop — 빈칸 / true / false");
});
T.item_affixes.forEach((r, i) => {
  if (!statKeys.has(r.stat)) err("item_affixes", i, `stat '${r.stat}' — stats.csv에 없음`);
  if (num(r.min) > num(r.max)) err("item_affixes", i, "min > max");
  for (const s of r.slots.split(/[,;|]/)) if (s !== "" && s !== "any" && !SLOTS.has(s)) err("item_affixes", i, `slots '${s}' 알 수 없음`);
});
unique("item_uniques", "id");
T.item_uniques.forEach((r, i) => {
  if (!baseIds.has(r.base)) err("item_uniques", i, `base '${r.base}' — item_bases에 없음`);
  if (r.source !== "" && !sourceIds.has(r.source)) err("item_uniques", i, `source '${r.source}' — monsters.csv sourceId에 없음`);
  checkMods("item_uniques", i, "mods", r.mods);
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
  if (!/shadowCap=/.test(r.full)) err("item_sets", i, "완성 효과에 shadowCap(그림자 상한)이 없음 — 세트의 확실한 이익");
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
  if (!["command", "soul", "curse"].includes(r.tree)) err("skills", i, `tree '${r.tree}' 알 수 없음`);
  if (r.prereq !== "" && !skillIds.has(r.prereq)) err("skills", i, `prereq '${r.prereq}' — skills.csv에 없음`);
  if (num(r.maxLv) < 1) err("skills", i, "maxLv < 1");
  if (r.nextLv !== "" && num(r.nextLv) <= num(r.row)) err("skills", i, `nextLv ${r.nextLv} — 요구 레벨(row ${r.row})보다 커야 함`);
});
for (const tree of ["command", "soul", "curse"]) {
  const n = T.skills.filter((r) => r.tree === tree).length;
  if (n > 12) err("skills", null, `${tree} 트리 ${n}개 — 스킬 창은 트리당 12칸`);
}

// 착용 가능한 부위의 외형 RUID는 아이콘과 같은 에셋을 사용한다.
const AVATAR_SLOTS = new Set(["weapon", "helm", "armor", "gloves", "boots"]);
T.item_bases.forEach((r, i) => {
  if (AVATAR_SLOTS.has(r.slot) && !RUID.test(r.avatar || "")) err("item_bases", i, "avatar — 착용 외형 RUID 필요");
  if (r.avatar && r.icon !== r.avatar) err("item_bases", i, "icon과 avatar가 달라 착용 그림이 일치하지 않음");
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
    if (!monsterIds.has(id)) err("maps", i, `fixed '${id}' — monsters.csv에 없음`);
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
const KINDS = ["kill", "extract", "reach", "raise", "clear", "boss", "ritual", "chest"];
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
  if (![1, 2].includes(num(r.act))) err("quests", i, `act '${r.act}' — 1 / 2`);
  if (!(num(r.count) > 0)) err("quests", i, "count 양수여야 함");
  for (const part of r.reward.split(",")) {
    if (part === "") continue;
    const [k, v] = [part.slice(0, part.indexOf(":")), part.slice(part.indexOf(":") + 1)];
    if (k === "rune" && !runeIds.has(v)) err("quests", i, `보상 룬 '${v}' — runes.csv에 없음`);
    else if (k === "item" && !baseIds.has(v.split("|")[0])) err("quests", i, `보상 아이템 '${v.split("|")[0]}' — item_bases에 없음`);
    else if (["skp", "stp", "gen", "socket", "deploy", "runes", "respoison", "unique"].includes(k)) { if (!(num(v) > 0)) err("quests", i, `보상 '${part}' 수치 오류`); }
    else if (!["rune", "item"].includes(k)) err("quests", i, `보상 종류 '${k}' 알 수 없음`);
  }
});

// ── 몬스터 등급 (추출 확률 단일 기준) ──
const rankIds = unique("monster_ranks", "rank");
for (const k of ["normal", "elite", "unique", "boss"]) if (!rankIds.has(k)) err("monster_ranks", null, `'${k}' 등급 없음 (Monster:GetRank가 쓴다)`);
T.monster_ranks.forEach((r, i) => {
  const c = num(r.extractChance, -1);
  if (!(c > 0 && c <= 1)) err("monster_ranks", i, `extractChance ${r.extractChance} — 0 초과 1 이하`);
  if (![1, 2, 3].includes(num(r.shadowGrade))) err("monster_ranks", i, "shadowGrade 1~3");
});

// ── 변종 능력 ──
const variantIds = unique("variants", "id");
T.variants.forEach((r, i) => {
  if (r.kind === "aura" && !["dmg", "haste", "guard"].includes(r.effect)) err("variants", i, `오오라 effect '${r.effect}' — dmg / haste / guard`);
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
  if (!["shop", "quest", "smith", "merchant", "stash", "caravan", "scholar", "apothecary"].includes(r.kind)) err("npcs", i, `kind '${r.kind}' 알 수 없음`);
});
T.maps.forEach((r, i) => {
  if (!["town", "field", "instance", "side"].includes(r.kind)) err("maps", i, `kind '${r.kind}' — town / field / instance / side`);
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
  }
});
// 액트마다 마을 하나 (필드 사슬은 같은 액트의 마을에서 시작해 마을로 돌아온다)
for (const act of new Set(T.maps.map((r) => r.act || "1"))) {
  if (T.maps.filter((r) => (r.act || "1") === act && r.kind === "town").length !== 1) err("maps", null, `액트 ${act}: town은 정확히 하나여야 함`);
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
