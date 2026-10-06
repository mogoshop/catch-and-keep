// 마을 맵(town) + NPC·포털 모델 생성, 사냥터(map01)에 마을행 포털 배치, DefaultPlayer에 PlayerQuest 부착
const path = require("path");
const G = path.resolve(__dirname, "../.claude/skills/msw-general");
const { ModelBuilder } = require(path.join(G, "scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(G, "scripts/map/msw_map_builder.cjs"));
const ROOT = path.resolve(__dirname, "..");
const M = (p) => path.join(ROOT, "RootDesk/MyDesk/Models", p);

// NPC 모델 (StaticNPC 템플릿, 탑다운이라 Rigidbody 제거)
function npc(name, id, standRuid, npcName, kind) {
  const b = ModelBuilder.fromTemplate(path.join(G, "models/StaticNPC.model"), name);
  b.renameModel(name, id);
  b.removeComponent("MOD.Core.RigidbodyComponent");
  b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", standRuid, "string");
  b.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
  b.value("MOD.Core.StateAnimationComponent", "ActionSheet", { stand: standRuid }, "action_sheet");
  b.value("MOD.Core.NameTagComponent", "Name", npcName, "string");
  b.component("script.WorldNPC");
  b.value("script.WorldNPC", "NpcName", npcName, "string");
  b.value("script.WorldNPC", "Kind", kind, "string");
  b.write(M(`NPC/${name}.model`));
}
npc("ShopKeeper", "shopkeeper", "6a20255974824deca3bf195281e58fe9", "떠돌이 상인", "shop");
npc("Elder", "elder", "a2144125efd64414be83bac6ad84e5ab", "마을 노인", "quest");

// 포털 모델
const gate = ModelBuilder.fromTemplate(path.join(G, "models/MapObject.model"), "WarpGate");
gate.renameModel("WarpGate", "warpgate");
gate.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", "2de58d186cec4176934bab677ad94b45", "string");
gate.value("MOD.Core.SpriteRendererComponent", "SortingLayer", "MapLayer0", "string");
gate.component("script.WarpGate");
gate.write(M("Objects/WarpGate.model"));

// 마을 맵
const townPath = path.join(ROOT, "map/town.map");
const fs = require("fs");
const town = fs.existsSync(townPath) ? MapBuilder.read(townPath) : MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), "town");
if (!town.find("ShopKeeper")) town.placeModel("ShopKeeper", M("NPC/ShopKeeper.model"), { pos: [-2.5, 1, 0] });
if (!town.find("Elder")) town.placeModel("Elder", M("NPC/Elder.model"), { pos: [2.5, 1, 0] });
if (!town.find("GateToField")) town.placeModel("GateToField", M("Objects/WarpGate.model"), {
  pos: [0, -2.5, 0],
  componentOverrides: { "script.WarpGate": { TargetMap: "map01", TargetPos: { x: -4.5, y: -2.5 }, Label: "사냥터" } },
});
town.write(townPath);

// 사냥터 → 마을 포털
const fieldPath = path.join(ROOT, "map/map01.map");
const field = MapBuilder.read(fieldPath);
if (!field.find("GateToTown")) field.placeModel("GateToTown", M("Objects/WarpGate.model"), {
  pos: [-6, -2.5, 0],
  componentOverrides: { "script.WarpGate": { TargetMap: "town", TargetPos: { x: 0, y: -1.2 }, Label: "마을" } },
});
field.write(fieldPath);

const p = ModelBuilder.read(path.join(ROOT, "Global/DefaultPlayer.model"));
if (!p.hasComponent("script.PlayerQuest")) p.component("script.PlayerQuest");
p.write(path.join(ROOT, "Global/DefaultPlayer.model"));
console.log("town:", JSON.stringify(MapBuilder.read(townPath).getMapInfo()));
