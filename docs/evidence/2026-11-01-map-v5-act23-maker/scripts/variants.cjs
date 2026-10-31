// nm/hell 변형 맵 파일 비교: 맵 바로 아래 엔티티 (이름·모델·위치·크기·스프라이트) · 충돌 칸 · 타일 전체 · 스포너 값
"use strict";
const ROOT="/Users/leeinguk/Desktop/hoho/잡으면 내편"; process.chdir(ROOT);
const fs=require("fs"), crypto=require("crypto"); const { MapBuilder }=require(ROOT+"/tools/build/lib.cjs");
const H=(s)=>crypto.createHash("sha1").update(s).digest("hex").slice(0,12);
const ids="oasis dunes canyon stormwaste sunkenroad scorpnest1 scorpnest2 drywell kingtomb1 kingtomb2 archive vipernest temple1 temple2 temple3 harbor saltflat wreckcoast stormcliff drownedvillage crabcave1 crabcave2 wreckhold smuggler1 smuggler2 seachapel keeperhouse lighthouse1 lighthouse2 lighthouse3 stormeye".split(" ");
function sig(file){
  const mb=MapBuilder.read(file); const root=mb.listEntities()[0].path;
  const ents=mb.listEntities().filter(e=>e.path.split("/").length===4);
  const rows=[], spawner=[];
  for(const e of ents){ const t=mb.component(e.path,"MOD.Core.TransformComponent")||{}; const sr=mb.component(e.path,"MOD.Core.SpriteRendererComponent")||{};
    const p=t.Position||{}, s=t.Scale||{};
    if(/^Spawner/.test(e.name)){ const sp=(mb.component(e.path,"script.MonsterSpawner")||{}); spawner.push(JSON.stringify(sp)); }
    rows.push([e.name,e.modelId||"",(p.x||0).toFixed(3),(p.y||0).toFixed(3),(p.z||0).toFixed(3),(s.x||1).toFixed(3),(s.y||1).toFixed(3),typeof sr.SpriteRUID==="object"?JSON.stringify(sr.SpriteRUID):(sr.SpriteRUID||""),e.componentNames].join("|"));
  }
  rows.sort();
  const tm=mb.component("RectTileMap","MOD.Core.RectTileMapComponent").tileMap.map(t=>`${t.position.x},${t.position.y},${t.tileIndex}`).sort();
  return { n:ents.length, art:ents.filter(e=>/^Art/.test(e.name)).length, ent:H(rows.join("\n")), tiles:H(tm.join(";")), coll:tm.filter(s=>s.endsWith(",269")).length, spawner:H(spawner.join("\n")), rows, spawnerRaw:spawner };
}
const out=[]; let same=0, total=0;
for(const id of ids){ const b=sig(`map/${id}.map`);
  for(const v of ["nm","hell"]){ const f=`map/${id}_${v}.map`; if(!fs.existsSync(f)){ out.push(`${id}\t${v}\t(파일 없음)`); continue; } total++;
    const s=sig(f); const eq=s.ent===b.ent&&s.tiles===b.tiles; if(eq) same++;
    let diff=""; if(s.ent!==b.ent){ const A=new Set(b.rows), B=new Set(s.rows); const only1=b.rows.filter(r=>!B.has(r)), only2=s.rows.filter(r=>!A.has(r)); diff=`ent차 base만 ${only1.length} 변형만 ${only2.length} 예 ${(only1[0]||"").slice(0,80)} / ${(only2[0]||"").slice(0,80)}`; }
    out.push(`${id}\t${v}\t엔티티 ${s.n}/${b.n} · Art ${s.art}/${b.art} · 엔티티지문 ${s.ent===b.ent?"=":"≠"} · 타일 ${s.tiles===b.tiles?"=":"≠"}(충돌 ${s.coll}/${b.coll}) · 스포너 ${s.spawner===b.spawner?"=":"≠"}\t${eq?"같은 구성":"다름"}\t${diff}`);
  }
}
console.log(out.join("\n")); console.log(`같은 구성 ${same}/${total}`);
