// 모델 생성: 몬스터(monsters.csv + bosses.csv), 오브젝트(objects.csv), NPC(npcs.csv).
// 모두 고정 템플릿에서 새로 만든다 (기존 결과물을 읽어 고치지 않으므로 실행 순서·횟수와 무관하게 같은 결과).
"use strict";
const { ModelBuilder, P, list, load, num, bool, quiet } = require("./lib.cjs");

// 몬스터 공통 구성: 템플릿(네이티브 9종: Transform·StateAnimation·SpriteRenderer·Movement·AIChase·State·Hit·DamageSkinSpawner·Kinematicbody)
// + 스크립트. 탑다운(RectTile)이라 Body는 Kinematicbody.
// NPC·보스 발밑 그림자 (assets/claude-story-v1 foot-shadow · 그룹 OJYYQ, maps.cjs와 같은 그림)
const FOOT_SHADOW = "cabd4773c16c465a90cb46d571d1d623";
const FOOT_SHADOW_MODEL = "footshadow";   // 공용 발밑 그림자 모델 — 맵에 고정 배치되는 몬스터의 자식도 등록된 모델을 가리켜야 한다 (check_assets)

function buildFootShadow() {
  const b = ModelBuilder.fromTemplate(P.skillModel("TransformOnly"), "FootShadow", { model_id: FOOT_SHADOW_MODEL });
  b.component("MOD.Core.SpriteRendererComponent")
    .value("MOD.Core.SpriteRendererComponent", "SpriteRUID", FOOT_SHADOW, "string")
    .value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
    .value("MOD.Core.SpriteRendererComponent", "OrderInLayer", 1, "int");
  b.write(P.model("Effects/FootShadow"));
}

const MONSTER_SCRIPTS = ["script.Monster", "script.MonsterStatus", "script.MonsterTraits", "script.MonsterAttack"];

// 프레임 애니메이션 몬스터 (data/monster_frames.csv): 상태 애니메이션 컴포넌트 대신 FrameAnimator가 스프라이트를 직접 넘긴다
function framesOf(id) {
  const rows = load("monster_frames").filter((f) => f.monster === id);
  return rows.length > 0 ? Object.fromEntries(rows.map((f) => [f.state, f])) : null;
}

function buildMonster(m, boss) {
  const b = ModelBuilder.read(P.template("MonsterBase"));
  b.renameModel(m.model, m.id);
  const frames = framesOf(m.id);
  if (frames) {
    b.removeComponent("MOD.Core.StateAnimationComponent");
    b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", frames.stand.frames.split(";")[0], "string");
    b.component("script.FrameAnimator");
    b.value("script.FrameAnimator", "FrameKey", m.sourceId, "string");
  } else {
    const clips = { stand: m.stand, move: m.move, hit: m.hit, die: m.die };
    if (m.attack !== "") clips.attack = m.attack;
    b.value("MOD.Core.StateAnimationComponent", "ActionSheet", clips, "action_sheet");
    b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", m.stand, "string");
    // 템플릿(MonsterBase)의 재생 범위가 0~0이라 메이플 애니메이션 클립이 첫 프레임에 멈춰 있었다 (10-10 QA: 액트 1 몬스터 애니메이션 없음) → 끝까지 재생
    b.value("MOD.Core.SpriteRendererComponent", "EndFrameIndex", 2147483647, "int");
  }
  const s = num(m.scale, 1);
  b.value("MOD.Core.TransformComponent", "Scale", { x: s, y: s, z: 1 }, "vector3");
  // 발밑 그림자 (monsters.csv shadow = 그림자 배율, 비우면 없음): 그림에 그림자가 없는 큰 몸이 바닥에서 떠 보이지 않게 (10-22 사용자: 심장의 사도).
  // 몸(순서 2) 아래 순서 1 — NPC 발밑 그림자(maps.cjs ArtShadow)와 같은 그림
  if (m.shadow) {
    const k = num(m.shadow);
    // 자식 id는 몬스터 id에서 만든 고정값 (빌드할 때마다 바뀌어 모델 파일이 흔들리지 않게)
    const h = require("crypto").createHash("md5").update(`${m.id}/FootShadow`).digest("hex");
    const cid = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    b.child("FootShadow", { components: ["MOD.Core.TransformComponent", "MOD.Core.SpriteRendererComponent"], id: cid, model_id: FOOT_SHADOW_MODEL })
      .childValue("FootShadow", "MOD.Core.TransformComponent", "Position", { x: 0, y: 0.02, z: 0 }, "vector3")
      .childValue("FootShadow", "MOD.Core.TransformComponent", "Scale", { x: k, y: k, z: 1 }, "vector3")
      .childValue("FootShadow", "MOD.Core.SpriteRendererComponent", "SpriteRUID", FOOT_SHADOW, "string")
      .childValue("FootShadow", "MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string")
      .childValue("FootShadow", "MOD.Core.SpriteRendererComponent", "OrderInLayer", 1, "int");
  }
  // 히트 박스: 스프라이트 크기(px)의 60%, 최소 0.4. hitW/hitH가 있으면 그 값.
  //   새 충돌 방식(HitComponent IsLegacy false)은 Transform 크기를 따라 커지므로 여기서 배율(s)을 또 곱하지 않는다 (10-28 보스 ×1.2~1.4 — 전에는 모두 1이라 드러나지 않았다)
  const bw = m.hitW !== "" ? num(m.hitW) : Math.max(0.4, (num(m.w) / 100) * 0.6);
  const bh = m.hitH !== "" ? num(m.hitH) : Math.max(0.4, (num(m.h) / 100) * 0.6);
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
    b.value("script.BossPattern", "BondGroup", boss.bond || "", "string");
    // 기본 공격 배율 (bosses.csv basicMul, 10-23): 보스 모델은 자기 레벨로 만들어 레벨 보정이 없어 기본 공격이 주변 몹보다 약했다 — 기본 공격·화살·연쇄만 (기술·오오라·궁극기는 그대로)
    if (boss.basicMul) b.value("script.MonsterAttack", "BasicMul", num(boss.basicMul), "double");
    if (boss.extra) b.component(boss.extra);
    // 보스 공용 패턴 묶음 + 보스방 둥지·토템 (10-28 사용자 A안 · RootDesk/MyDesk/Monster/BossMoves.mlua)
    if (boss.moves) {
      b.component("script.BossMoves");
      b.value("script.BossMoves", "Moves", boss.moves, "string");
      b.value("script.BossMoves", "MoveCount", num(boss.moveCount, 1), "long");
      b.value("script.BossMoves", "Interval", num(boss.moveInterval, 12), "double");
      b.value("script.BossMoves", "Totems", num(boss.totems, 0), "long");
      b.value("script.BossMoves", "TotemMinion", boss.minion || "", "string");
      b.value("script.BossMoves", "TotemTint", boss.totemTint || "", "string");
    }
  }
  // 공통 보스 틀 없이 의식만 붙는 보스 (monsters.csv rite — 처형인·근위대장·밀수꾼 두목, docs/design/40)
  if (m.rite) b.component(m.rite);
  b.write(P.model(`Region${m.region}/${m.model}`));
}

function round(v) { return Math.round(v * 1000) / 1000; }

// "script.TorchLight.Radius=1.8" → 값 (숫자만)
function applyValues(b, text) {
  for (const part of list(text)) {
    const [lhs, v] = part.split("=");
    const dot = lhs.lastIndexOf(".");
    const name = lhs.slice(dot + 1);
    b.value(lhs.slice(0, dot), name, Number(v), name === "OrderInLayer" ? "int" : "double");
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
    buildFootShadow();
    for (const m of monsters) buildMonster(m, bosses[m.id]);
    for (const o of objects) buildObject(o);
    for (const n of npcs) buildNpc(n);
  });
  console.log(`  모델: 몬스터 ${monsters.length} · 오브젝트 ${objects.length} · NPC ${npcs.length}`);
}

module.exports = { run, buildMonster, buildObject, buildNpc };
