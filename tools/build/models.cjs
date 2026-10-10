// 모델 생성: 몬스터(monsters.csv + bosses.csv), 오브젝트(objects.csv), NPC(npcs.csv).
// 모두 고정 템플릿에서 새로 만든다 (기존 결과물을 읽어 고치지 않으므로 실행 순서·횟수와 무관하게 같은 결과).
"use strict";
const { ModelBuilder, P, list, load, num, bool, quiet } = require("./lib.cjs");

// 몬스터 공통 구성: 템플릿(네이티브 9종: Transform·StateAnimation·SpriteRenderer·Movement·AIChase·State·Hit·DamageSkinSpawner·Kinematicbody)
// + 스크립트. 탑다운(RectTile)이라 Body는 Kinematicbody.
const MONSTER_SCRIPTS = ["script.Monster", "script.MonsterStatus", "script.MonsterTraits", "script.MonsterAttack"];

function buildMonster(m, boss) {
  const b = ModelBuilder.read(P.template("MonsterBase"));
  b.renameModel(m.model, m.id);
  const clips = { stand: m.stand, move: m.move, hit: m.hit, die: m.die };
  if (m.attack !== "") clips.attack = m.attack;
  b.value("MOD.Core.StateAnimationComponent", "ActionSheet", clips, "action_sheet");
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", m.stand, "string");
  const s = num(m.scale, 1);
  b.value("MOD.Core.TransformComponent", "Scale", { x: s, y: s, z: 1 }, "vector3");
  // 히트 박스: 스프라이트 크기(px)의 60% × 배율, 최소 0.4. hitW/hitH가 있으면 그 값
  const bw = m.hitW !== "" ? num(m.hitW) : Math.max(0.4, (num(m.w) / 100) * 0.6 * s);
  const bh = m.hitH !== "" ? num(m.hitH) : Math.max(0.4, (num(m.h) / 100) * 0.6 * s);
  b.value("MOD.Core.HitComponent", "BoxSize", { x: round(bw), y: round(bh) }, "vector2");
  b.value("MOD.Core.HitComponent", "ColliderOffset", { x: 0, y: round(bh / 2) }, "vector2");
  b.value("MOD.Core.MovementComponent", "InputSpeed", num(m.speed), "float");
  b.value("MOD.Core.AIChaseComponent", "IsChaseNearPlayer", true, "bool");

  for (const c of MONSTER_SCRIPTS) b.component(c);
  b.value("script.Monster", "MaxHp", num(m.baseHp), "double");
  b.value("script.Monster", "Level", num(m.baseLevel), "long");
  b.value("script.Monster", "SourceId", m.sourceId, "string");
  b.value("script.Monster", "Grade", num(m.grade, 1), "long");
  b.value("script.Monster", "RespawnDelay", num(m.respawn), "double");
  b.value("script.Monster", "Unique", bool(m.unique), "bool");
  b.value("script.MonsterTraits", "Resists", m.resists, "string");
  b.value("script.MonsterTraits", "Tint", m.tint, "string");
  b.value("script.MonsterAttack", "Damage", num(m.baseDmg), "long");
  b.value("script.MonsterAttack", "AttackCooldown", num(m.atkIntervalSec), "double");
  b.value("script.MonsterAttack", "Element", m.element, "string");
  b.value("script.MonsterAttack", "ElementRatio", num(m.elementRatio), "double");
  if (m.attackRange !== "") b.value("script.MonsterAttack", "AttackRange", num(m.attackRange), "double");
  if (m.behavior === "nest") {
    // 뼈 둥지: 움직이지도 때리지도 않고 졸개를 낳는다 (MonsterNest). 부수면 정예 보상
    b.removeComponent("MOD.Core.AIChaseComponent");
    b.removeComponent("script.MonsterAttack");
    b.component("script.MonsterNest");
  } else if (m.behavior !== "") {
    b.component("script.MonsterBehavior");
    b.value("script.MonsterBehavior", "Mode", m.behavior, "string");
  }
  if (boss) {
    b.component("script.BossPattern");
    b.value("script.BossPattern", "BossName", boss.bossName, "string");
    b.value("script.BossPattern", "MinionModelId", boss.minion, "string");
    b.value("script.BossPattern", "MinionCount", num(boss.minionCount), "long");
    b.value("script.BossPattern", "SlamDamage", num(boss.slamDamage), "double");
    b.value("script.BossPattern", "SlamRadius", num(boss.slamRadius), "double");
    b.value("script.BossPattern", "SlamInterval", num(boss.slamInterval), "double");
    b.value("script.BossPattern", "PoolSeconds", num(boss.poolSec, 0), "double");
    b.value("script.BossPattern", "PoolElement", boss.poolElement || "", "string");
    b.value("script.BossPattern", "SlamAtTarget", bool(boss.atTarget), "bool");
    b.value("script.BossPattern", "Bonded", bool(boss.bond), "bool");
    if (boss.extra) b.component(boss.extra);
  }
  b.write(P.model(`Region${m.region}/${m.model}`));
}

function round(v) { return Math.round(v * 1000) / 1000; }

// "script.TorchLight.Radius=1.8" → 값 (숫자만)
function applyValues(b, text) {
  for (const part of list(text)) {
    const [lhs, v] = part.split("=");
    const dot = lhs.lastIndexOf(".");
    b.value(lhs.slice(0, dot), lhs.slice(dot + 1), Number(v), "double");
  }
}

function buildObject(o) {
  const b = ModelBuilder.fromTemplate(P.skillModel("MapObject"), o.model);
  b.renameModel(o.model, o.id);
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", o.ruid, "string");
  b.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
  const s = num(o.scale, 1);
  b.value("MOD.Core.TransformComponent", "Scale", { x: s, y: s, z: 1 }, "vector3");
  for (const c of list(o.components)) b.component(c);
  applyValues(b, o.values);
  b.write(P.model(`${o.folder}/${o.model}`));
}

function buildNpc(n) {
  // StaticNPC 템플릿은 사이드뷰용 Rigidbody를 가진다 → 탑다운이라 뺀다
  const b = ModelBuilder.fromTemplate(P.skillModel("StaticNPC"), n.model);
  b.renameModel(n.model, n.id);
  b.removeComponent("MOD.Core.RigidbodyComponent");
  // 템플릿 기본값(IsLegacy=true)은 런타임 경고 LWA-3019
  b.value("MOD.Core.StateComponent", "IsLegacy", false, "bool");
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", n.stand, "string");
  b.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
  b.value("MOD.Core.StateAnimationComponent", "ActionSheet", { stand: n.stand }, "action_sheet");
  b.value("MOD.Core.NameTagComponent", "Name", n.name, "string");
  b.component("script.WorldNPC");
  b.value("script.WorldNPC", "NpcName", n.name, "string");
  b.value("script.WorldNPC", "Kind", n.kind, "string");
  b.write(P.model(`NPC/${n.model}`));
}

function run() {
  const bosses = Object.fromEntries(load("bosses").map((r) => [r.id, r]));
  const monsters = load("monsters");
  const objects = load("objects");
  const npcs = load("npcs");
  quiet(() => {
    for (const m of monsters) buildMonster(m, bosses[m.id]);
    for (const o of objects) buildObject(o);
    for (const n of npcs) buildNpc(n);
  });
  console.log(`  모델: 몬스터 ${monsters.length} · 오브젝트 ${objects.length} · NPC ${npcs.length}`);
}

module.exports = { run, buildMonster, buildObject, buildNpc };
