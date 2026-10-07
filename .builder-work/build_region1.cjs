// 영역 1 「잿빛 변경」: 몬스터 9종 모델 + 맵(필드 4·납골당 3·여왕의 무덤) + 포털 연결 + 어둠 설정 + 스포너
const path = require("path");
const fs = require("fs");
const G = path.resolve(__dirname, "../.claude/skills/msw-general");
const { ModelBuilder } = require(path.join(G, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(G, "scripts/map/msw_map_builder.cjs"));
const ROOT = path.resolve(__dirname, "..");
const M = (p) => path.join(ROOT, "RootDesk/MyDesk/Models", p);
const MAP = (n) => path.join(ROOT, "map", n + ".map");

// ── 몬스터 모델 ──
// clips: stand, move, hit, die, attack / size: 스프라이트 픽셀 크기 (히트 박스 계산용)
const MOBS = [
  { name: "Hellhound", id: "hellhound", src: "hellhound", hp: 40, dmg: 5, speed: 1.5, tint: "0.75,0.35,0.3", w: 92, h: 54,
    clips: { stand: "c436866a4cda4f7b8614d2f0a6b36ae5", move: "d436b59499404682aebbb64fbb610a98", hit: "424abd9baa8741e785a2a0aedd403fab", die: "daa03ac34f7a4c1d84c09a24ff7f92a3", attack: "15147adffddd4da9908d2108951ae405" } },
  { name: "GraveWorm", id: "graveworm", src: "graveworm", hp: 50, dmg: 5, speed: 0.8, tint: "0.6,0.7,0.5", w: 60, h: 53,
    clips: { stand: "2eccc104f9114701b2bac18a8d7f3845", move: "f5f4d35b8e7f4c6599b6598ec1023c5a", hit: "34b90d154fe64195b77ea771c9f9010c", die: "38e5aa08fddd49d48cd9ee99124d3d22" } },
  { name: "AshenDead", id: "ashendead", src: "ashen_dead", hp: 70, dmg: 7, speed: 1.0, tint: "0.6,0.58,0.55", w: 56, h: 92,
    clips: { stand: "9c27b5511689485ab1b3381a00fcfec6", move: "3799c5aea9dc45b09057cd1adba0e913", hit: "c9502f5bc1894ee690656ccf404a8ae0", die: "9f235b8f73024ce3b75ce592dd61b43e", attack: "729193316d524a0eb642261bd9d78584" } },
  { name: "CorpseCrow", id: "corpsecrow", src: "corpse_crow", hp: 35, dmg: 6, speed: 1.8, tint: "0.45,0.4,0.5", w: 66, h: 53,
    clips: { stand: "5f1a018ca946468a8d3a6dac0d9c4ba8", move: "a408d61514e9476c933bdef0e9e2d0d2", hit: "4ab7ee78da154771bf0097cbc96008ae", die: "f387a5eebde64a9d9baafa012cb454b2" } },
  { name: "SkelWarrior", id: "skelwarrior", src: "skel_warrior", hp: 90, dmg: 9, speed: 1.1, tint: "0.8,0.75,0.65", w: 84, h: 87,
    clips: { stand: "0f7660bf15a14a379657c4f35fe10fd0", move: "d247c52315634dba95e5956ca057d06b", hit: "ce9e7bef3c554fa8a6e97e9f5dc1a429", die: "9b6c189cca0c4204a7a4ac6e9463ecb0", attack: "9d5d21845a534917b1af1ee368e2dd08" } },
  { name: "StarvedWraith", id: "starvedwraith", src: "starved_wraith", hp: 70, dmg: 10, speed: 1.6, tint: "0.55,0.75,0.65", w: 72, h: 60,
    clips: { stand: "15e7b98cec434b269c09e97f550921c3", move: "2f11969b1f694825ac8ad13635711c5b", hit: "23a95f12278c491bb7358ca69540c206", die: "e8b502ac4eb14d348eaf516273761e8b" } },
  // 최상위 (고유 이름, 정예 등급, 고정 배치)
  { name: "Headsman", id: "headsman", src: "headsman", hp: 600, dmg: 14, speed: 1.2, tint: "0.7,0.3,0.3", w: 65, h: 92, grade: 2, unique: true, scale: 1.2,
    clips: { stand: "c68c66cc812e4e4aa9a6f1ffcdc48985", move: "924e249ccb8747dbbe548dc5af908c4f", hit: "a9f9b95d39094e9aab7571b6d29f1788", die: "883de94d1aa3471ab3ba3dbba36d6e5a", attack: "a6dc470643f741c288b2d7bbf9a1aeeb" } },
  { name: "SkelCaptain", id: "skelcaptain", src: "skel_captain", hp: 800, dmg: 16, speed: 1.0, tint: "0.75,0.65,0.5", w: 120, h: 133, grade: 2, unique: true,
    clips: { stand: "ed882269a5d543318ad73e7032632960", move: "94003c3d90dd4fd4866c725b29704169", hit: "fcdeaaece999433587fd7a953758ae8e", die: "2d11a182fb8948aa91fa9000118eb9bf", attack: "791b405fbab44bf1a914043ca29a1848" } },
];

// 옛 시험 몬스터(FieldMob1209)는 지웠으므로 이미 만든 영역 1 모델을 바탕으로 쓴다 (컴포넌트 구성은 같다)
const base = M("Region1/AshenDead.model");
for (const m of MOBS) {
  const b = ModelBuilder.read(base);
  b.renameModel(m.name, m.id);
  b.value("MOD.Core.StateAnimationComponent", "ActionSheet", m.clips, "action_sheet");
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", m.clips.stand, "string");
  const s = m.scale || 1;
  const bw = Math.max(0.4, (m.w / 100) * 0.6 * s), bh = Math.max(0.4, (m.h / 100) * 0.6 * s);
  b.value("MOD.Core.HitComponent", "BoxSize", { x: bw, y: bh }, "vector2");
  b.value("MOD.Core.HitComponent", "ColliderOffset", { x: 0, y: bh / 2 }, "vector2");
  if (s !== 1) b.value("MOD.Core.TransformComponent", "Scale", { x: s, y: s, z: 1 }, "vector3");
  b.value("MOD.Core.MovementComponent", "InputSpeed", m.speed, "float");
  b.value("MOD.Core.AIChaseComponent", "IsChaseNearPlayer", true, "bool");
  b.value("script.ShadowMonster", "MaxHp", m.hp, "double");
  b.value("script.ShadowMonster", "SourceId", m.src, "string");
  b.value("script.ShadowMonster", "Grade", m.grade || 1, "long");
  b.value("script.ShadowMonster", "Level", 1, "long");
  b.value("script.ShadowMonster", "RespawnDelay", m.unique ? 90 : 10, "double");
  b.value("script.ShadowMonster", "Tint", m.tint, "string");
  if (m.unique) b.value("script.ShadowMonster", "Unique", true, "bool");
  b.value("script.MonsterAttack", "Damage", m.dmg, "long");
  b.write(M(`Region1/${m.name}.model`));
}

// 보스: 묘지기 여왕 (블러디 퀸 외형) — BossMushmom을 바탕으로
const q = ModelBuilder.read(M("Region1/GraveQueen.model"));
q.renameModel("GraveQueen", "gravequeen");
const qc = { stand: "f4a4aadb84bb4060af45a7ad23f189e5", move: "a97b63a93e6b4be2a6158acc573126bc", hit: "61e3b8af00bb47a9ac50df853853b57b", die: "8628466afef941048f19d6c1d699f83d", attack: "6bd87ca65e864cf98162f51d2f61efda" };
q.value("MOD.Core.StateAnimationComponent", "ActionSheet", qc, "action_sheet");
q.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", qc.stand, "string");
q.value("MOD.Core.TransformComponent", "Scale", { x: 0.55, y: 0.55, z: 1 }, "vector3");
q.value("MOD.Core.HitComponent", "BoxSize", { x: 1.6, y: 2.4 }, "vector2");
q.value("MOD.Core.HitComponent", "ColliderOffset", { x: 0, y: 1.2 }, "vector2");
q.value("script.ShadowMonster", "MaxHp", 2600, "double");
q.value("script.ShadowMonster", "SourceId", "grave_queen", "string");
q.value("script.ShadowMonster", "Level", 12, "long");
q.value("script.ShadowMonster", "RespawnDelay", 120, "double");
q.value("script.ShadowMonster", "Tint", "0.8,0.55,0.6", "string");
q.value("script.MonsterAttack", "Damage", 18, "long");
q.value("script.BossPattern", "BossName", "묘지기 여왕", "string");
q.value("script.BossPattern", "MinionModelId", "graveworm", "string");
q.value("script.BossPattern", "MinionCount", 4, "long");
q.value("script.BossPattern", "SlamDamage", 26, "double");
q.write(M("Region1/GraveQueen.model"));

// 횃불 (고정 광원) + 제단 표식 모델
const torch = ModelBuilder.fromTemplate(path.join(G, "models/MapObject.model"), "Brazier");
torch.renameModel("Brazier", "brazier");
torch.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "04a857bd272b4bfb8cdc6c369c66e9e5", "string");
torch.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
torch.component("script.TorchLight");
torch.write(M("Objects/Brazier.model"));

const altar = ModelBuilder.fromTemplate(path.join(G, "models/MapObject.model"), "BloodAltar");
altar.renameModel("BloodAltar", "bloodaltar");
altar.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "ec8cadea70c548d7811996b27b501e54", "string");
altar.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
altar.component("script.TorchLight");
altar.value("script.TorchLight", "Radius", 1.8, "double");
altar.component("script.QuestMarker");
altar.value("script.QuestMarker", "MarkerId", "blood_altar", "string");
altar.write(M("Objects/BloodAltar.model"));

// ── 맵 ──
// id, 표시 이름, 어둠, 스포너, 이전 맵, 다음 맵
const MAPS = [
  { id: "map01", name: "피 묻은 황무지 (Lv 1~3)", amb: 0.14, entries: "hellhound:7:1", elite: 0 },
  { id: "rotmarsh", name: "썩은 갈대 늪 (Lv 3~5)", amb: 0.11, entries: "hellhound:4:3;graveworm:6:4", elite: 0.05 },
  { id: "execution", name: "무너진 형장 (Lv 5~7)", amb: 0.11, entries: "ashendead:6:5;corpsecrow:4:6", elite: 0.08 },
  { id: "gallows", name: "교수대 숲 (Lv 6~9)", amb: 0.09, entries: "ashendead:4:7;graveworm:3:7;corpsecrow:4:8", elite: 0.15,
    fixed: [["Headsman", "Region1/Headsman.model", [4.5, 2, 0]]], altar: [-4.5, 2.5, 0] },
  { id: "crypt1", name: "지하 납골당 1층 (Lv 8~10)", amb: 0.06, entries: "skelwarrior:6:8;ashendead:3:8", elite: 0.1 },
  { id: "crypt2", name: "지하 납골당 2층 (Lv 9~11)", amb: 0.05, entries: "skelwarrior:5:10;starvedwraith:4:10", elite: 0.12 },
  { id: "crypt3", name: "지하 납골당 3층 (Lv 10~12)", amb: 0.05, entries: "skelwarrior:4:11;starvedwraith:5:11", elite: 0.15,
    fixed: [["SkelCaptain", "Region1/SkelCaptain.model", [4.5, -2, 0]]] },
  { id: "queentomb", name: "여왕의 무덤", amb: 0.07, entries: "", elite: 0,
    fixed: [["GraveQueen", "Region1/GraveQueen.model", [3, 0, 0]]] },
];

const gateModel = M("Objects/WarpGate.model");
function gate(map, name, pos, target, tpos, label) {
  if (map.find(name)) map.remove(name);
  map.placeModel(name, gateModel, { pos, componentOverrides: { "script.WarpGate": { TargetMap: target, TargetPos: { x: tpos[0], y: tpos[1] }, Label: label } } });
}

MAPS.forEach((d, i) => {
  const file = MAP(d.id);
  const map = fs.existsSync(file) ? MapBuilder.read(file) : MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), d.id);
  // 옛 시험용 배치 정리 (map01)
  for (const e of map.listEntities()) {
    if (/^\/maps\/[^/]+\/(Mob\d+_\d+|BossMushmom|GateToTown|GateNext|GateBack|Spawner|Torch\d|BloodAltar)$/.test(e.path)) map.remove(e.path);
  }
  map.upsertComponent(d.id, "script.MapAmbience", { "@type": "script.MapAmbience", Enable: true, DisplayName: d.name, Ambient: d.amb });
  if (d.entries) {
    map.empty("Spawner", { pos: [0, 0, 0], scripts: ["script.MonsterSpawner"] });
    map.patchComponent("Spawner", "script.MonsterSpawner", { Entries: d.entries, EliteChance: d.elite });
  }
  for (const [n, mp, pos] of d.fixed || []) {
    if (map.find(n)) map.remove(n);
    map.placeModel(n, M(mp), { pos });
  }
  // 포털: 왼쪽 = 이전, 오른쪽 = 다음
  const prev = i === 0 ? "town" : MAPS[i - 1].id;
  gate(map, "GateBack", [-6, 0, 0], prev, i === 0 ? [0, -1.2] : [4.6, 0], i === 0 ? "잿불 야영지" : MAPS[i - 1].name);
  if (i < MAPS.length - 1) gate(map, "GateNext", [6, 0, 0], MAPS[i + 1].id, [-4.6, 0], MAPS[i + 1].name);
  else gate(map, "GateNext", [6, 0, 0], "town", [0, -1.2], "잿불 야영지");
  // 화로 2개 (어둠 속 이정표)
  map.placeModel("Torch1", M("Objects/Brazier.model"), { pos: [-5.2, 1.2, 0] });
  map.placeModel("Torch2", M("Objects/Brazier.model"), { pos: [5.2, -1.2, 0] });
  if (d.altar) {
    map.placeModel("BloodAltar", M("Objects/BloodAltar.model"), { pos: d.altar });
  }
  map.write(file);
  console.log("map", d.id, "ok");
});

// 마을: 이름·밝기, 사냥터 포털 위치 정리, NPC 이름
const townFile = MAP("town");
const town = MapBuilder.read(townFile);
town.upsertComponent("town", "script.MapAmbience", { "@type": "script.MapAmbience", Enable: true, DisplayName: "잿불 야영지", Ambient: 0.4, PlayerLightRadius: 4.5 });
gate(town, "GateToField", [0, -2.8, 0], "map01", [-4.6, 0], "피 묻은 황무지");
town.patchComponent("ShopKeeper", "script.WorldNPC", { NpcName: "잿빛 행상 고르" });
town.patchComponent("Elder", "script.WorldNPC", { NpcName: "파문당한 사제 오렌" });
town.patchComponent("ShopKeeper", "MOD.Core.NameTagComponent", { Name: "잿빛 행상 고르" });
town.patchComponent("Elder", "MOD.Core.NameTagComponent", { Name: "파문당한 사제 오렌" });
for (const [n, p] of [["Torch1", [-1.2, 1.6, 0]], ["Torch2", [1.2, 1.6, 0]], ["Torch3", [0, -1.8, 0]]]) {
  if (town.find(n)) town.remove(n);
  town.placeModel(n, M("Objects/Brazier.model"), { pos: p });
}
town.write(townFile);
console.log("town ok");
