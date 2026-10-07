#!/usr/bin/env node
// 데이터 무결성 검사 (data/*.csv). 표끼리의 참조가 끊기면 게임에서는 조용히 빈 값이 되므로 여기서 막는다.
//   id 중복, 룬워드 → 룬, 아이템 옵션 키 → stats.csv, 유니크 → 베이스, 스킬 선행 → 스킬,
//   의뢰 대상 → 몬스터 sourceId·맵 표식, 맵 출현·고정 몬스터 → monsters.csv, BGM → sounds.csv,
//   웨이포인트 ↔ 맵, 보스 → 몬스터, 난이도 순번, RUID 형식
// 사용: node tools/check_data.cjs   (GAME_DATA_DIR=<dir>로 다른 폴더 검사 가능)
"use strict";
const { load, num } = require("./lib/csv.cjs");

const errors = [];
const err = (table, row, msg) => errors.push(`${table}.csv${row !== null ? " " + (row + 2) + "행" : ""}: ${msg}`);

const T = {};
for (const name of ["config", "difficulty", "stats", "item_bases", "item_affixes", "item_uniques", "runes", "runewords", "skills", "quests", "waypoints", "monsters", "bosses", "maps", "sounds", "shop", "objects", "npcs", "monster_ranks", "variants", "item_sets", "item_set_pieces", "drop_tables"]) {
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
T.item_bases.forEach((r, i) => { if (!SLOTS.has(r.slot)) err("item_bases", i, `slot '${r.slot}' 알 수 없음`); });
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
  if (n > 10) err("skills", null, `${tree} 트리 ${n}개 — 스킬 창은 트리당 10칸`);
}

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
  if (!["", "burrow", "hitrun"].includes(r.behavior)) err("monsters", i, `behavior '${r.behavior}' 알 수 없음`);
});
const bossIds = new Set();
T.bosses.forEach((r, i) => {
  bossIds.add(r.id);
  if (!monsterIds.has(r.id)) err("bosses", i, `id '${r.id}' — monsters.csv에 없음`);
  if (r.minion !== "" && !monsterIds.has(r.minion)) err("bosses", i, `minion '${r.minion}' — monsters.csv에 없음`);
});

if (!T.monsters.some((r) => r.depth === "pool")) err("monsters", null, "depth=pool 몬스터가 하나도 없음 (심도 던전이 빈다)");

// ── 맵 ──
const markers = new Set();
T.maps.forEach((r, i) => {
  if (!soundKeys.has(r.bgm)) err("maps", i, `bgm '${r.bgm}' — sounds.csv에 없음`);
  for (const sp of r.spawns.split(";")) {
    if (sp === "") continue;
    const [id, count, level] = sp.split(":");
    if (!monsterIds.has(id)) err("maps", i, `spawns '${id}' — monsters.csv에 없음`);
    if (!(num(count) > 0) || !(num(level) > 0)) err("maps", i, `spawns '${sp}' 형식 오류 (id:수:레벨)`);
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

// ── 의뢰 ──
T.quests.forEach((r, i) => {
  if (r.kind === "kill" && !sourceIds.has(r.target)) err("quests", i, `kill 대상 '${r.target}' — monsters.csv sourceId에 없음`);
  if (r.kind === "reach" && !markers.has(r.target)) err("quests", i, `reach 대상 '${r.target}' — maps.csv extra에 altar:${r.target} 없음`);
  if (!["kill", "extract", "reach", "raise"].includes(r.kind)) err("quests", i, `kind '${r.kind}' 알 수 없음`);
  if (r.kind === "raise" && !["skeleton", "mage", "revive"].includes(r.target)) err("quests", i, `raise 대상 '${r.target}' — skeleton / mage / revive`);
  if (!(num(r.count) > 0)) err("quests", i, "count 양수여야 함");
  for (const part of r.reward.split(",")) {
    if (part === "") continue;
    const [k, v] = [part.slice(0, part.indexOf(":")), part.slice(part.indexOf(":") + 1)];
    if (k === "rune" && !runeIds.has(v)) err("quests", i, `보상 룬 '${v}' — runes.csv에 없음`);
    else if (k === "item" && !baseIds.has(v.split("|")[0])) err("quests", i, `보상 아이템 '${v.split("|")[0]}' — item_bases에 없음`);
    else if (["skp", "stp", "gen"].includes(k)) { if (!(num(v) > 0)) err("quests", i, `보상 '${part}' 수치 오류`); }
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
  if (r.kind === "skill" && !(num(r.interval) > 0 && num(r.mult) > 0)) err("variants", i, "기술은 interval·mult 양수");
  if (!["aura", "skill"].includes(r.kind)) err("variants", i, `kind '${r.kind}' — aura / skill`);
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
  if (!["shop", "quest"].includes(r.kind)) err("npcs", i, `kind '${r.kind}' 알 수 없음`);
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
    const floors = T.maps.filter((m) => m.kind === "side" && m.parent === r.parent);
    if (floors[0] === r && r.entry === "") err("maps", i, "곁가지 첫 층은 entry(부모 필드의 입구 위치)가 필요");
    if (floors[0] !== r && r.entry !== "") err("maps", i, "entry는 첫 층에만");
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
if (T.maps.filter((r) => r.kind === "town").length !== 1) err("maps", null, "town은 정확히 하나여야 함");

// ── 난이도·사운드 ──
T.difficulty.forEach((r, i) => {
  if (num(r.index, -1) !== i) err("difficulty", i, `index ${r.index} — 0부터 순서대로여야 함`);
  if (!(num(r.ambientMul) > 0)) err("difficulty", i, "ambientMul 양수여야 함");
});
T.sounds.forEach((r, i) => { if (!RUID.test(r.ruid)) err("sounds", i, `ruid 형식 오류`); });

for (const e of errors) console.log(e);
console.log(`\n[check_data] 표 ${Object.keys(T).length}개, 문제 ${errors.length}건`);
process.exitCode = errors.length ? 1 : 0;
