// read-only: component types used across all maps + wasteland detail (MapBuilder read API only)
const fs = require("fs"), path = require("path");
const ROOT = process.argv[2];
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const ext = "." + "m" + "ap";
const dir = path.join(ROOT, "map");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(ext));
const comps = {}, mats = {}, layers = {}, bg = {}, mapLayerNames = {};
let w = null;
for (const f of files) {
  const b = MapBuilder.read(path.join(dir, f));
  const id = f.slice(0, -ext.length);
  const det = { names: {}, layerOrder: {}, mapLayers: [], bg: null, sound: 0, light: 0, particle: 0, matSet: 0, ents: b.entities.length, torchLike: [] };
  for (const e of b.entities) {
    const js = b._entityJson(e);
    const name = js.name || "";
    const cs = js["@components"] || [];
    for (const c of cs) {
      const t = (c["@type"] || "").replace("MOD.Core.", "");
      comps[t] = (comps[t] || 0) + 1;
      if (c.MaterialId) { mats[c.MaterialId] = (mats[c.MaterialId] || 0) + 1; det.matSet++; }
      if (t === "SpriteRendererComponent") { const k = `${c.SortingLayer}/${c.OrderInLayer}`; det.layerOrder[k] = (det.layerOrder[k] || 0) + 1; }
      if (t === "MapLayerComponent") { det.mapLayers.push({ name, LayerSortOrder: c.LayerSortOrder, MapLayerName: c.MapLayerName }); mapLayerNames[c.MapLayerName || name] = (mapLayerNames[c.MapLayerName || name] || 0) + 1; }
      if (t === "BackgroundComponent") { det.bg = { Type: c.Type, SolidColor: c.SolidColor, TemplateRUID: c.TemplateRUID }; bg[c.Type] = (bg[c.Type] || 0) + 1; }
      if (t === "SoundComponent") det.sound++;
      if (t === "LightComponent") det.light++;
      if (/Particle/.test(t)) det.particle++;
    }
    const p = (name.match(/^[A-Za-z]+/) || [name])[0];
    det.names[p] = (det.names[p] || 0) + 1;
  }
  if (id === "wasteland") w = det;
}
// wasteland props by sprite key (from csv)
const out = { files: files.length, componentTypes: Object.fromEntries(Object.entries(comps).sort((a, b) => b[1] - a[1])), materialIds: mats, backgroundTypes: bg, mapLayerNames, wasteland: w };
fs.writeFileSync(path.join(__dirname, "native-usage.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
