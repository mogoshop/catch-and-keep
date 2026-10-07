// 기존 타일·구조물 배치를 보존하면서 출구 그림만 갱신한다.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {ROOT,ModelBuilder,MapBuilder,P,quiet,load}=require('./lib.cjs');
function run(){let changed=0;quiet(()=>{
 const rows=load('objects').filter(r=>['WarpGate','DepthGate'].includes(r.model));
 for(const r of rows){const b=ModelBuilder.read(P.model('Objects/'+r.model));b.value('MOD.Core.SpriteRendererComponent','SpriteRUID',r.ruid,'string').value('MOD.Core.TransformComponent','Scale',{x:Number(r.scale),y:Number(r.scale),z:1},'vector3').write(P.model('Objects/'+r.model));}
 for(const file of fs.readdirSync(path.join(ROOT,'map')).filter(f=>f.endsWith('.map'))){
  const p=path.join(ROOT,'map',file),m=MapBuilder.read(p);if(m.getTileMapMode()!==1)throw new Error('예상하지 못한 맵 모드 '+file);
  const terrain=crypto.createHash('sha256').update(JSON.stringify(m.getTiles())).digest('hex');let count=0;
  for(const e of m.listEntities()){
   const warp=m.component(e.path,'script.WarpGate'),depth=m.component(e.path,'script.DepthGate');if(!warp&&!depth)continue;
   const r=rows.find(r=>r.model===(depth?'DepthGate':'WarpGate')),t=m.component(e.path,'MOD.Core.TransformComponent');
   m.patchComponent(e.path,'MOD.Core.SpriteRendererComponent',{SpriteRUID:r.ruid});
   m.patchComponent(e.path,'MOD.Core.TransformComponent',{Scale:{...t.Scale,x:Number(r.scale),y:Number(r.scale),z:1}});count++;
  }
  if(terrain!==crypto.createHash('sha256').update(JSON.stringify(m.getTiles())).digest('hex'))throw new Error('타일 변경 감지 '+file);
  if(count){m.write(p);changed+=count;}
 }
});console.log('포털 그림 '+changed+'개 갱신, 타일 보존');}
if(require.main===module)run();module.exports={run};
