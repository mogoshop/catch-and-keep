// read-only map statistics via MapBuilder read API
const fs = require("fs"), path = require("path");
const ROOT = process.argv[2];
const { MapBuilder } = require(path.join(ROOT, ".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const ext = "." + "m" + "ap";
const dir = path.join(ROOT, "map");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(ext));
const rows = [];
const agg = { layers: {}, prefix: {}, modes: {}, grid: {}, tileset: {}, comps: {}, drawMode: {} };
for (const f of files) {
  const b = MapBuilder.read(path.join(dir, f));
  const r = { map: f.slice(0, -ext.length), mode: b.getTileMapMode(), ents: b.entities.length, sprites: 0, art: 0, artTop: 0, tiled: 0, light: 0, trigger: 0, tiles: 0, collTiles: 0, w: 0, h: 0 };
  agg.modes[r.mode] = (agg.modes[r.mode] || 0) + 1;
  for (const e of b.entities) {
    const js = b._entityJson(e);
    const name = js.name || "";
    const comps = js["@components"] || [];
    for (const c of comps) {
      const t = c["@type"]; agg.comps[t] = (agg.comps[t] || 0) + 1;
      if (t === "MOD.Core.SpriteRendererComponent") {
        r.sprites++;
        const key = `${c.SortingLayer}/${c.OrderInLayer}`; agg.layers[key] = (agg.layers[key] || 0) + 1;
        agg.drawMode[c.DrawMode] = (agg.drawMode[c.DrawMode] || 0) + 1;
        if (c.DrawMode === 2) r.tiled++;
      }
      if (t === "MOD.Core.LightComponent") r.light++;
      if (t === "MOD.Core.TriggerComponent") r.trigger++;
      if (t === "MOD.Core.RectTileMapComponent") {
        const g = JSON.stringify(c.GridSize); agg.grid[g] = (agg.grid[g] || 0) + 1;
        agg.tileset[c.TileSetRUID] = (agg.tileset[c.TileSetRUID] || 0) + 1;
        const tm = c.tileMap || [];
        r.tiles += tm.length; r.collTiles += tm.filter((x) => x.tileIndex === 269 || x.tileIndex === 0).length;
        if (tm.length) { const xs = tm.map((x) => x.position.x), ys = tm.map((x) => x.position.y); r.w = Math.max(...xs) - Math.min(...xs) + 1; r.h = Math.max(...ys) - Math.min(...ys) + 1; }
        r.tileIdx = r.tileIdx || {}; for (const x of tm) r.tileIdx[x.tileIndex] = (r.tileIdx[x.tileIndex] || 0) + 1;
      }
    }
    if (name.startsWith("Art")) { r.art++; if (name.endsWith("Top")) r.artTop++; }
    const p = (name.match(/^[A-Z][a-z]+(?:[A-Z][a-z]+)?/) || [name])[0]; agg.prefix[p] = (agg.prefix[p] || 0) + 1;
  }
  rows.push(r);
}
rows.sort((a, b) => b.ents - a.ents);
const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
console.log(JSON.stringify({ n: rows.length, totals: { ents: sum("ents"), sprites: sum("sprites"), art: sum("art"), tiled: sum("tiled"), light: sum("light") },
  median: rows[Math.floor(rows.length / 2)], top: rows.slice(0, 8).map(({ tileIdx, ...x }) => x), bottom: rows.slice(-4).map(({ tileIdx, ...x }) => x),
  agg: { ...agg, prefix: Object.fromEntries(Object.entries(agg.prefix).sort((a, b) => b[1] - a[1]).slice(0, 25)), comps: Object.fromEntries(Object.entries(agg.comps).sort((a, b) => b[1] - a[1]).slice(0, 25)) },
  tileIdxSample: rows.slice(0, 3).map((r) => [r.map, r.tileIdx]) }, null, 1));
fs.writeFileSync(path.join(__dirname, "mapstats.json"), JSON.stringify(rows.map(({ tileIdx, ...x }) => x), null, 1));
