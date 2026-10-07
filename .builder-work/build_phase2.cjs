// 2차: 사망 시체·웨이포인트·심도 문 모델, 몬스터 행동·속성, 플레이어 컴포넌트, 맵 배경음·웨이포인트,
//      심도 던전(인스턴스 맵), 악몽·지옥 난이도 맵 복제. build_region1.cjs 다음에 실행한다 (여러 번 실행해도 같은 결과).
const path = require("path");
const fs = require("fs");
const G = path.resolve(__dirname, "../.claude/skills/msw-general");
const { ModelBuilder } = require(path.join(G, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(G, "scripts/map/msw_map_builder.cjs"));
const ROOT = path.resolve(__dirname, "..");
const M = (p) => path.join(ROOT, "RootDesk/MyDesk/Models", p);
const MAP = (n) => path.join(ROOT, "map", n + ".map");

// ── 오브젝트 모델 ──
function objectModel(name, id, ruid, scripts, scale) {
  const b = ModelBuilder.fromTemplate(path.join(G, "models/MapObject.model"), name);
  b.renameModel(name, id);
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", ruid, "string");
  b.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
  if (scale) b.value("MOD.Core.TransformComponent", "Scale", { x: scale, y: scale, z: 1 }, "vector3");
  for (const s of scripts) b.component(s);
  return b;
}
const corpse = objectModel("PlayerCorpse", "playercorpse", "4a670d14660e4fcc9f949a495d04acb1", ["script.PlayerCorpse"]);
corpse.component("MOD.Core.NameTagComponent");
corpse.write(M("Objects/PlayerCorpse.model"));
const wp = objectModel("Waypoint", "waypoint", "8143c6e176254fefb4c5eb08271f7f01", ["script.Waypoint", "script.TorchLight"]);
wp.write(M("Objects/Waypoint.model"));
const dg = objectModel("DepthGate", "depthgate", "2de58d186cec4176934bab677ad94b45", ["script.DepthGate", "script.TorchLight"], 1.4);
dg.write(M("Objects/DepthGate.model"));

// ── 몬스터: 특수 행동·속성·저항 ──
const MOB_EXTRA = {
  Hellhound: { element: "fire", ratio: 0.5, res: "fire=50" },
  GraveWorm: { behavior: "burrow", res: "poison=75" },
  AshenDead: { res: "poison=40,cold=20" },
  CorpseCrow: { behavior: "hitrun", res: "" },
  SkelWarrior: { res: "poison=60,cold=30" },
  StarvedWraith: { element: "cold", ratio: 0.6, res: "cold=60,magic=30" },
  Headsman: { element: "fire", ratio: 0.4, res: "fire=40,poison=30" },
  SkelCaptain: { element: "cold", ratio: 0.4, res: "poison=75,cold=40" },
  GraveQueen: { element: "poison", ratio: 0.5, res: "poison=60,fire=25" },
};
for (const [name, x] of Object.entries(MOB_EXTRA)) {
  const file = M(`Region1/${name}.model`);
  const b = ModelBuilder.read(file);
  if (x.behavior) {
    if (!b.hasComponent("script.MonsterBehavior")) b.component("script.MonsterBehavior");
    b.value("script.MonsterBehavior", "Mode", x.behavior, "string");
  }
  if (x.element) {
    b.value("script.MonsterAttack", "Element", x.element, "string");
    b.value("script.MonsterAttack", "ElementRatio", x.ratio, "double");
  }
  b.value("script.ShadowMonster", "Resists", x.res, "string");
  b.write(file);
}

// ── 플레이어 컴포넌트 ──
const dp = ModelBuilder.read(path.join(ROOT, "Global/DefaultPlayer.model"));
for (const s of ["script.PlayerTravel", "script.PlayerSocial", "script.PlayerDuel", "script.PlayerTrade"]) {
  if (!dp.hasComponent(s)) dp.component(s);
}
dp.write(path.join(ROOT, "Global/DefaultPlayer.model"));

// ── 보통 난이도 맵: 배경음·환경음, 웨이포인트, 심도 입구 ──
const BGM = {
  town: "93147bcf77494841b8d4478791ed9282", field: "8efc5a3200114606a71e907036fe920f",
  gallows: "9ae18480bcc848c496263c4b057f8e6e", crypt: "fec06ea8a4a943279acfdba9a1f3a1f8", boss: "2a0257f832ee4a7c84c0a8efc9aa5bba",
};
const NORMAL = [
  { id: "town", bgm: BGM.town, crows: false, wind: true, wp: ["camp", [-3, 1.6, 0]], depth: [3, 1.6, 0] },
  { id: "map01", bgm: BGM.field, crows: true, wind: true },
  { id: "rotmarsh", bgm: BGM.field, crows: true, wind: true },
  { id: "execution", bgm: BGM.field, crows: true, wind: true, wp: ["execution", [-3.2, -3, 0]] },
  { id: "gallows", bgm: BGM.gallows, crows: true, wind: true },
  { id: "crypt1", bgm: BGM.crypt, crows: false, wind: false, wp: ["crypt1", [-3.2, -3, 0]] },
  { id: "crypt2", bgm: BGM.crypt, crows: false, wind: false },
  { id: "crypt3", bgm: BGM.crypt, crows: false, wind: false },
  { id: "queentomb", bgm: BGM.boss, crows: false, wind: false },
];
for (const d of NORMAL) {
  const file = MAP(d.id);
  const map = MapBuilder.read(file);
  map.patchComponent(d.id, "script.MapAmbience", { Bgm: d.bgm, Crows: d.crows, Wind: d.wind, Difficulty: 0, LevelBonus: 0 });
  if (d.wp) {
    if (map.find("Waypoint")) map.remove("Waypoint");
    map.placeModel("Waypoint", M("Objects/Waypoint.model"), { pos: d.wp[1], componentOverrides: { "script.Waypoint": { WaypointId: d.wp[0] } } });
  }
  if (d.depth) {
    if (map.find("DepthEntrance")) map.remove("DepthEntrance");
    map.placeModel("DepthEntrance", M("Objects/DepthGate.model"), { pos: d.depth, componentOverrides: { "script.DepthGate": { Action: "enter" } } });
  }
  map.write(file);
}

// ── 심도 던전 맵 (인스턴스 맵) ──
{
  const file = MAP("depth");
  const map = fs.existsSync(file) ? MapBuilder.read(file) : MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), "depth");
  // 저장 파일의 필드 이름은 IsInstanceMap (스크립트 API에서는 InstanceMap)
  const mc = Object.assign({}, map.component("depth", "MOD.Core.MapComponent"));
  delete mc.InstanceMap;
  mc.IsInstanceMap = true;
  map.upsertComponent("depth", "MOD.Core.MapComponent", mc);
  map.upsertComponent("depth", "script.MapAmbience", { "@type": "script.MapAmbience", Enable: true, DisplayName: "심도", Ambient: 0.05, Bgm: BGM.crypt, Wind: false, Crows: false });
  map.upsertComponent("depth", "script.DepthDirector", { "@type": "script.DepthDirector", Enable: true });
  for (const [n, p] of [["Torch1", [-5.2, 2.5, 0]], ["Torch2", [5.2, -2.5, 0]]]) {
    if (map.find(n)) map.remove(n);
    map.placeModel(n, M("Objects/Brazier.model"), { pos: p });
  }
  map.write(file);
}

// ── 악몽·지옥: 보통 맵을 복제해 레벨·어둠·포털 대상을 바꾼다 ──
const DIFFS = [
  { suffix: "_nm", diff: 1, bonus: 30, label: "[악몽] ", amb: 0.8 },
  { suffix: "_hell", diff: 2, bonus: 60, label: "[지옥] ", amb: 0.65 },
];
for (const D of DIFFS) {
  for (const d of NORMAL) {
    const src = MAP(d.id);
    const name = d.id + D.suffix;
    const map = MapBuilder.fromTemplate(src, name);
    const amb = map.component(name, "script.MapAmbience");
    map.patchComponent(name, "script.MapAmbience", {
      DisplayName: D.label + (amb.DisplayName || d.id),
      Ambient: Math.round((amb.Ambient || 0.1) * D.amb * 1000) / 1000,
      Difficulty: D.diff, LevelBonus: D.bonus,
    });
    for (const e of map.listEntities()) {
      const leaf = e.path.split("/").pop();
      let gate = null;
      try { gate = map.component(e.path, "script.WarpGate"); } catch (err) { gate = null; }
      if (gate && gate.TargetMap) map.patchComponent(e.path, "script.WarpGate", { TargetMap: gate.TargetMap + D.suffix });
      void leaf;
    }
    map.write(MAP(name));
  }
}
console.log("phase2 ok");
