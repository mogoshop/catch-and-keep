const path=require("path");const ROOT=process.argv[2];const id=process.argv[3];
const {MapBuilder}=require(path.join(ROOT,".claude/skills/msw-general/scripts/map/msw_map_builder.cjs"));
const b=MapBuilder.read(path.join(ROOT,"map",id+"."+"m"+"ap"));
const zs={};
for(const e of b.entities){const js=b._entityJson(e);const n=js.name||"";
 const comps=js["@components"]||[];
 if(!n.startsWith("Art")&&!n.startsWith("Torch")) console.log(n, js.modelId, comps.map(c=>c["@type"].replace("MOD.Core.","")).join("|"));
 for(const c of comps){ if(["MOD.Core.MapComponent","MOD.Core.BackgroundComponent","MOD.Core.MapLayerComponent"].includes(c["@type"])) console.log("  ",JSON.stringify(c).slice(0,400));
  if(c["@type"]==="MOD.Core.RectTileMapComponent"){const {tileMap,...rest}=c;console.log("  RT",JSON.stringify(rest));}
  if(c["@type"]==="MOD.Core.TransformComponent"&&n.startsWith("Art")){const p=(n.match(/^Art[A-Z][a-z]+/)||[n])[0];const z=c.Position&&c.Position.z;(zs[p]=zs[p]||new Set()).add(z);}}
}
console.log(Object.fromEntries(Object.entries(zs).map(([k,v])=>[k,[...v].slice(0,8)])));
