"use strict";
const fs=require("fs"),path=require("path");
const ROOT="/Users/leeinguk/Desktop/hoho/잡으면 내편";
const hm=require(path.join(ROOT,"tools/build/handmade/lib.cjs"));
const {load}=require(path.join(ROOT,"tools/build/lib.cjs"));
const S=__dirname, K=(x,y)=>x+","+y;
const out=[];
for(const m of load("maps").filter(r=>r.kind!=="instance")){
  const j=JSON.parse(fs.readFileSync(path.join(S,"json",m.id+".json")));
  const bp=hm.parseBlueprint(m.id);
  const coll=new Set(j.tiles.map(([x,y])=>K(x,y)));
  const walk=(x,y)=>bp.isFloor(x,y)&&!coll.has(K(x,y));
  const pts=[];
  for(const p of j.pieces){ if(/^(ArtProp|ArtSet|ArtDecal|ArtJoin)/.test(p.entity)) pts.push([p.pos.x,p.pos.y+0.3]); }
  for(const f of j.func) pts.push([f.x,f.y]);
  // 막힌 장식 칸도 장식으로 (큰 그림 발밑)
  for(const k of coll){const [x,y]=k.split(",").map(Number); if(bp.isFloor(x,y)) pts.push([x+0.5,y+0.5]);}
  const R=3.5; const {x0,x1,y0,y1}=bp.bounds; const dead=new Set(); let wn=0;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){ if(!walk(x,y))continue; wn++; const cx=x+0.5,cy=y+0.5; let ok=false; for(const [px,py] of pts){ if(Math.abs(px-cx)<=R&&Math.abs(py-cy)<=R&&Math.hypot(px-cx,py-cy)<=R){ok=true;break;} } if(!ok) dead.add(K(x,y)); }
  const seen=new Set(), blobs=[];
  for(const k of dead){ if(seen.has(k))continue; const q=[k]; seen.add(k); const cells=[]; while(q.length){const c=q.pop(); cells.push(c); const [x,y]=c.split(",").map(Number); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nk=K(x+dx,y+dy); if(dead.has(nk)&&!seen.has(nk)){seen.add(nk);q.push(nk);}}}
    const xs=cells.map(c=>+c.split(",")[0]), ys=cells.map(c=>+c.split(",")[1]); const mx=Math.round(xs.reduce((a,b)=>a+b)/xs.length), my=Math.round(ys.reduce((a,b)=>a+b)/ys.length);
    const zc=bp.zoneOf(mx,my)||bp.zoneOf(xs[0],ys[0]); blobs.push({n:cells.length, box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)], zone: zc&&bp.zones[zc]?bp.zones[zc].name:""}); }
  blobs.sort((a,b)=>b.n-a.n);
  out.push({id:m.id, walk:wn, dead:dead.size, deadPct:+(dead.size/wn*100).toFixed(1), big:blobs.filter(b=>b.n>=15).slice(0,4)});
}
fs.writeFileSync(path.join(S,"audit2.json"),JSON.stringify(out,null,1));
for(const r of out.sort((a,b)=>b.deadPct-a.deadPct)) console.log(r.id.padEnd(15), String(r.deadPct).padStart(5)+"%", r.dead, r.big.map(b=>`${b.n}@(${b.box.join(",")})${b.zone}`).join(" | "));
