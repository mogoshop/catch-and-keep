import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,rm,access,symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frame=Buffer.from('fixture image bytes');
const digest=createHash('sha256').update(frame).digest('hex');
const writeJSON=(file,value)=>writeFile(file,JSON.stringify(value));
const run=(folder,script,env=process.env)=>spawnSync(process.execPath,[`scripts/${script}.mjs`],{cwd:folder,env,encoding:'utf8'});

async function fixture(t) {
  const folder=await mkdtemp(path.join(os.tmpdir(),'library-security-'));
  t.after(()=>rm(folder,{recursive:true,force:true}));
  for(const dir of ['scripts','public','templates','content/assets/media','content/maps/media','content/policies'])await mkdir(path.join(folder,dir),{recursive:true});
  for(const name of ['build.mjs','lib.mjs'])await cp(path.join(root,'scripts',name),path.join(folder,'scripts',name));
  await cp(path.join(root,'templates/atlas.html'),path.join(folder,'templates/atlas.html'));
  await writeFile(path.join(folder,'public/index.html'),'<main>Fixture</main>');
  const atlas={createdAt:'2026-10-31',sourceCommit:'12345678',summary:{uniqueImages:1,frameReferences:1},
    skills:[{id:'skill',name:'Skill',icon:'media/used.png',groups:['group']}],
    groups:[{id:'group',title:'Group',category:'fx',frames:['media/used.png'],durations:[100]}],engineEffects:[],proceduralEffects:[]};
  const maps={updatedAt:'2026-10-31',maps:[{id:'map',preview:'media/used.webp'}]};
  await writeJSON(path.join(folder,'content/assets/catalog.json'),atlas);
  await writeJSON(path.join(folder,'content/assets/media-manifest.json'),[{file:'media/used.png',sha256:digest}]);
  await writeJSON(path.join(folder,'content/maps/maps.json'),maps);
  await writeJSON(path.join(folder,'content/policies/policies.json'),{policies:[{id:'policy',title:'Policy'}]});
  await writeFile(path.join(folder,'content/assets/media/used.png'),frame);
  await writeFile(path.join(folder,'content/maps/media/used.webp'),frame);
  return {folder,atlas,maps};
}

test('build publishes only current referenced media and preserves catalog dollar sequences',async t=>{
  const {folder,atlas}=await fixture(t);
  atlas.skills[0].desc="Literal $& $` $' $$ and </script><script>example</script>";
  await writeJSON(path.join(folder,'content/assets/catalog.json'),atlas);
  // This file belonged to an earlier import and is no longer referenced.
  await writeFile(path.join(folder,'content/assets/media/removed.png'),'old private asset');
  await writeFile(path.join(folder,'content/maps/media/removed.webp'),'old private map');
  // An unreferenced old manifest entry need not exist in the current snapshot.
  await writeJSON(path.join(folder,'content/assets/media-manifest.json'),[
    {file:'media/used.png',sha256:digest},{file:'media/removed.png',sha256:'old hash'}
  ]);
  const result=run(folder,'build');assert.equal(result.status,0,result.stderr);
  for(const output of ['dist','.vercel/output/static']) {
    await access(path.join(folder,output,'assets/media/used.png'));
    await access(path.join(folder,output,'maps/media/used.webp'));
    await assert.rejects(access(path.join(folder,output,'assets/media/removed.png')));
    await assert.rejects(access(path.join(folder,output,'maps/media/removed.webp')));
  }
  const html=await readFile(path.join(folder,'dist/assets/index.html'),'utf8');
  const embedded=html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(embedded),atlas);
  assert.equal(embedded.includes('</script>'),false);
});

test('build rejects out-of-media paths, symlinks and unverified referenced assets',async t=>{
  for(const kind of ['outside-media','symlink','missing-hash','bad-hash'])await t.test(kind,async t=>{
    const {folder,atlas}=await fixture(t);
    if(kind==='outside-media') {
      atlas.skills[0].icon='catalog.json';
      await writeJSON(path.join(folder,'content/assets/catalog.json'),atlas);
    } else if(kind==='symlink') {
      await rm(path.join(folder,'content/assets/media/used.png'));
      await symlink(path.join(folder,'content/maps/media/used.webp'),path.join(folder,'content/assets/media/used.png'));
    } else {
      await writeJSON(path.join(folder,'content/assets/media-manifest.json'),kind==='missing-hash'?[]:[{file:'media/used.png',sha256:'wrong'}]);
    }
    const result=run(folder,'build');assert.notEqual(result.status,0);
    assert.match(result.stderr,/must stay in media|Not a regular bundle|missing from manifest|hash mismatch/);
    await assert.rejects(access(path.join(folder,'.vercel/output/config.json')));
  });
});

test('atlas renders catalog image attributes and summary text without creating HTML',async()=>{
  const template=await readFile(path.join(root,'templates/atlas.html'),'utf8');
  const script=template.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const injected='media/image" onerror="alert(1).png';
  const data={createdAt:'2026-10-31',sourceCommit:'12345678',summary:{uniqueImages:'<img src=x onerror=alert(1)>',frameReferences:1},
    skills:[{name:'Skill',icon:injected}],groups:[{id:'group',title:'Group',category:'fx',frames:[injected],durations:[100]}],engineEffects:[],proceduralEffects:[]};
  const nodes=new Map();
  const getNode=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{
      textContent:'',innerHTML:'',querySelectorAll:()=>[],setAttribute(){},classList:{toggle(){}},
      showModal(){this.open=true;},getContext:()=>({clearRect(){},fillText(){}}),width:100,height:100
    });
    return nodes.get(selector);
  };
  getNode('#catalog-data').textContent=JSON.stringify(data);
  const context=vm.createContext({document:{querySelector:getNode,querySelectorAll:()=>[],getElementById:id=>getNode('#'+id)},
    performance:{now:()=>0},requestAnimationFrame(){},IntersectionObserver:class{disconnect(){}observe(){}},Image:class{complete=false;naturalWidth=0;}});
  vm.runInContext(script,context);
  vm.runInContext('renderAudit();openDetail(DATA.groups[0]);',context);
  for(const selector of ['#grid','#frames']) {
    const html=getNode(selector).innerHTML;
    assert.ok(html.includes('src="media/image&quot; onerror=&quot;alert(1).png"'));
    assert.equal(html.includes('src="media/image" onerror='),false);
  }
  assert.ok(getNode('#stats').innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.equal(getNode('#stats').innerHTML.includes('<img'),false);
});

test('build embeds effect-slot data and verifies its separate media manifest',async t=>{
  for(const kind of ['ok','bad-hash'])await t.test(kind,async t=>{
    const {folder}=await fixture(t);
    const slotFrame=Buffer.from('slot frame bytes');
    await mkdir(path.join(folder,'content/assets/media/slots'),{recursive:true});
    await writeFile(path.join(folder,'content/assets/media/slots/a.png'),slotFrame);
    const cand={id:'maple:x',source:'maple',title:'</script><img src=x onerror=alert(1)>',frames:['media/slots/a.png'],durations:[100],ruids:['0'.repeat(32)],box:[1,1]};
    const slots={createdAt:'2026-11-01',sourceRef:'origin/main',sourceCommit:'abc',sourceDate:'2026-11-01',catalog:{createdAt:'2026-10-31',sourceCommit:'def'},
      groups:[{id:'g',title:'G'}],slots:[{id:'s',title:'S',group:'g',runtime:null,currentNote:'',current:null,fx:[],maple:[cand]}],unassigned:[],counts:{slots:1}};
    await writeJSON(path.join(folder,'content/assets/slots.json'),slots);
    await writeJSON(path.join(folder,'content/assets/slots-manifest.json'),[{file:'media/slots/a.png',sha256:kind==='ok'?createHash('sha256').update(slotFrame).digest('hex'):'wrong'}]);
    const result=run(folder,'build');
    if(kind==='bad-hash'){assert.notEqual(result.status,0);assert.match(result.stderr,/hash mismatch/);return;}
    assert.equal(result.status,0,result.stderr);
    await access(path.join(folder,'dist/assets/media/slots/a.png'));
    const html=await readFile(path.join(folder,'dist/assets/index.html'),'utf8');
    const embedded=html.match(/<script id="slots-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(embedded),slots);
    assert.equal(embedded.includes('</script>'),false);
  });
});

test('effect picker renders slot text as text and exports RUIDs with the memo',async()=>{
  const template=await readFile(path.join(root,'templates/atlas.html'),'utf8');
  const script=template.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const evil='<img src=x onerror=alert(1)>';
  const cand={id:'maple:x',source:'maple',title:evil,statusLabel:evil,frames:['media/a.png'],durations:[100],ruids:['1'.repeat(32)],box:[1,1],runtimeKey:'SkillEffects.FxPoisonCloud'};
  const searched={id:'maple:y',source:'maple',origin:'search',title:'검색 후보',statusLabel:'타격 효과',reason:evil,frames:['media/a.png'],durations:[100],ruids:['2'.repeat(32)],box:[1,1]};
  const slots={createdAt:'2026-11-01T00:00:00Z',sourceRef:'origin/main',sourceCommit:'abcdef12',sourceDate:'2026-11-01T00:00:00+09:00',catalog:{createdAt:'2026-10-31',sourceCommit:'12345678'},
    groups:[{id:'g',title:evil}],slots:[{id:'s',title:evil,group:'g',runtime:'GameConst.FxSkillPoisonCloud',currentNote:evil,current:null,fx:[],maple:[cand,searched]},{id:'t',title:'T',group:'g',runtime:null,currentNote:'',current:null,fx:[],maple:[],mapleExcluded:evil}],unassigned:[],counts:{slots:2}};
  const data={createdAt:'2026-10-31',sourceCommit:'12345678',summary:{uniqueImages:1,frameReferences:1},skills:[],groups:[],engineEffects:[],proceduralEffects:[]};
  const nodes=new Map();
  const getNode=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',value:'',querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},classList:{toggle(){}},showModal(){},getContext:()=>({clearRect(){},fillText(){}}),width:100,height:100});
    return nodes.get(selector);
  };
  getNode('#catalog-data').textContent=JSON.stringify(data);
  getNode('#slots-data').textContent=JSON.stringify(slots);
  const context=vm.createContext({document:{querySelector:getNode,querySelectorAll:()=>[],getElementById:id=>getNode('#'+id)},
    performance:{now:()=>0},requestAnimationFrame(){},IntersectionObserver:class{disconnect(){}observe(){}},Image:class{complete=false;naturalWidth=0;}});
  vm.runInContext(script,context);
  for(const view of ['current','fx','maple','compare']) {
    vm.runInContext(`STATE.tab='pick';PICK.view=${JSON.stringify(view)};render();`,context);
    const html=getNode('#grid').innerHTML;
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'),view);
    assert.equal(html.includes('<img src=x'),false,view);
  }
  vm.runInContext(`STATE.tab='pick';PICK.view='maple';render();`,context);
  assert.ok(getNode('#grid').innerHTML.includes('메이플 후보 · 검색'));
  assert.ok(vm.runInContext('buildExport.length===0',context));
  const searchedText=vm.runInContext(`PICK.picks={s:{choice:'maple:y'}};buildExport()`,context);
  const searchedJson=JSON.parse(searchedText.match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(searchedJson.picks[0].candidateOrigin,'search');
  assert.deepEqual(searchedJson.picks[0].ruids,['2'.repeat(32)]);
  const text=vm.runInContext(`PICK.picks={s:{choice:'maple:x',memo:'잘 보임'}};buildExport()`,context);
  const json=JSON.parse(text.match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(json.picks[0].slotId,'s');
  assert.equal(json.picks[0].choice,'maple');
  assert.deepEqual(json.picks[0].ruids,['1'.repeat(32)]);
  assert.equal(json.picks[0].memo,'잘 보임');
});

test('publish reports deployment launch and signal failures as failures',async t=>{
  for(const mode of ['missing-command','signal','exit-code'])await t.test(mode,async t=>{
    const folder=await mkdtemp(path.join(os.tmpdir(),'library-publish-'));
    t.after(()=>rm(folder,{recursive:true,force:true}));
    for(const dir of ['scripts','.vercel','bin'])await mkdir(path.join(folder,dir),{recursive:true});
    for(const name of ['publish.mjs','lib.mjs'])await cp(path.join(root,'scripts',name),path.join(folder,'scripts',name));
    await writeFile(path.join(folder,'scripts/build.mjs'),'// Deliberately no-op fixture build.\n');
    await writeJSON(path.join(folder,'.vercel/project.json'),{projectId:'fixture',orgId:'fixture'});
    await writeFile(path.join(folder,'bin/git'),`#!${process.execPath}\n`,{mode:0o755});
    const cli=`#!${process.execPath}\nconst fs=require('node:fs');
if(process.argv.includes('api')) {
  process.stdout.write(JSON.stringify({ssoProtection:{deploymentType:'all'}}));
  if(${JSON.stringify(mode)}==='missing-command')fs.unlinkSync(process.argv[1]);
} else if(${JSON.stringify(mode)}==='signal')process.kill(process.pid,'SIGTERM');
else process.exit(7);\n`;
    await writeFile(path.join(folder,'bin/npx'),cli,{mode:0o755});
    const result=run(folder,'publish',{...process.env,PATH:path.join(folder,'bin')});
    assert.equal(result.status,mode==='exit-code'?7:1,result.stderr);
    if(mode==='missing-command')assert.match(result.stderr,/Deployment could not start/);
    if(mode==='signal')assert.match(result.stderr,/Deployment terminated by signal/);
  });
});

test('build embeds scene-preview data and verifies its separate still manifest',async t=>{
  for(const kind of ['ok','bad-hash','outside-media'])await t.test(kind,async t=>{
    const {folder}=await fixture(t);
    const still=Buffer.from('scene still bytes');
    await mkdir(path.join(folder,'content/scene/media'),{recursive:true});
    await writeFile(path.join(folder,'content/scene/media/actor-player-stand.png'),still);
    const scene={createdAt:'2026-11-01',sourceRef:'origin/main',sourceCommit:'abc',rules:{s:{id:'s',scene:'player',anchor:'targetBody',scale:1,order:6,note:'</script><img src=x onerror=alert(1)>',uses:[],estimated:[]}},
      actors:[{id:'player-stand',role:'player',pose:'stand',label:'P',file:kind==='outside-media'?'scene.json':'media/actor-player-stand.png',size:[1,1],feet:[0,1],pxPerCell:100,kind:'capture',source:{}}],maps:[],pivots:{}};
    await writeJSON(path.join(folder,'content/scene/scene.json'),scene);
    await writeJSON(path.join(folder,'content/scene/scene-manifest.json'),[{file:'media/actor-player-stand.png',sha256:kind==='bad-hash'?'wrong':createHash('sha256').update(still).digest('hex')}]);
    const result=run(folder,'build');
    if(kind!=='ok'){assert.notEqual(result.status,0);assert.match(result.stderr,/hash mismatch|must stay in media/);await assert.rejects(access(path.join(folder,'.vercel/output/config.json')));return;}
    assert.equal(result.status,0,result.stderr);
    await access(path.join(folder,'dist/assets/scene/media/actor-player-stand.png'));
    const html=await readFile(path.join(folder,'dist/assets/index.html'),'utf8');
    const embedded=html.match(/<script id="scene-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(embedded),scene);
    assert.equal(embedded.includes('</script>'),false);
  });
});

test('scene rules cover every effect slot and resolve only through the provenance accessor',async()=>{
  const {SLOTS}=await import('./slot-defs.mjs');const {SCENE_RULES}=await import('./scene-defs.mjs');
  assert.equal(SLOTS.length,83);assert.equal(SCENE_RULES.length,83);
  assert.ok(!SLOTS.some(s=>/^spear/.test(s.id)||/FxSkillSpear/.test(s.runtime||"")),"뼈 창 자리는 11-01 스킬 삭제로 뺐다");
  // 해골 마법사 뼈 투척(옛 뼈 창 그림) 두 자리: 해골·망자 묶음 · 옛 이름 후보(FxSkillSpear*·bone-spear·spear-stick·spear-shard)를 모은다
  const bolt=SLOTS.find(s=>s.id==='bone-bolt'),hit=SLOTS.find(s=>s.id==='bone-bolt-hit');
  assert.equal(bolt.runtime,'GameConst.FxBoneBolt');assert.equal(hit.runtime,'GameConst.FxBoneBoltHit');assert.equal(bolt.group,'undead');assert.equal(hit.group,'undead');
  const first=name=>(SLOTS.find(s=>s.match&&new RegExp(s.match,'i').test(name))||{}).id;
  for(const n of ['runtime--GameConst-FxSkillSpear GameConst.FxSkillSpear','codex-skill-fx-v1--fx-bone-spear','runtime--GameConst-FxSkillSpearShard GameConst.FxSkillSpearShard','fx-B-bone-spear-projectile-00'])assert.equal(first(n),'bone-bolt',n);
  for(const n of ['runtime--GameConst-FxSkillSpearHit GameConst.FxSkillSpearHit','fx-B-bone-spear-stick-03'])assert.equal(first(n),'bone-bolt-hit',n);
  const sceneOf=id=>SCENE_RULES.find(r=>r.id===id);
  assert.equal(sceneOf('bone-bolt').scene,'summon');assert.equal(sceneOf('bone-bolt').proj.to,'targetBody');assert.equal(sceneOf('bone-bolt-hit').anchor,'targetBody');
  // 저주 원형판 6자리만 판정 지름(judgeD)을 가진다 = 2 × 코드 반경 1.5
  const kd={c:(a,fb)=>fb,kv:(a,b,fb)=>fb,code:v=>v,est:v=>v};
  assert.deepEqual(SCENE_RULES.filter(r=>r.judgeD).map(r=>r.id).sort(),['curse-amp','curse-lifetap','curse-resist','curse-terror','curse-thorn','curse-weaken']);
  for(const r of SCENE_RULES.filter(r=>r.judgeD))assert.equal(r.judgeD(kd),3,r.id);
  assert.deepEqual(SCENE_RULES.map(r=>r.id).sort(),SLOTS.map(s=>s.id).sort());
  const uses=[];const rec=t=>(v,x)=>(uses.push(t),typeof v==='number'?v:typeof x==='number'?x:1);
  const k={c:(key,fb)=>(uses.push('read'),fb),kv:(key,n,fb)=>(uses.push('read'),fb),kvList:()=>(uses.push('read'),[6,1]),list:()=>[],cfg:(n,fb)=>(uses.push('read'),fb),code:rec('code'),est:rec('est')};
  for(const r of SCENE_RULES){
    const s=r.scale(k);assert.ok(Number.isFinite(s)&&s>0,`${r.id} scale ${s}`);
    if(typeof r.order==='function')assert.ok(Number.isFinite(r.order(k)),r.id);
    assert.ok(r.proj||r.anchor,`${r.id} needs anchor or proj`);
  }
  assert.ok(uses.includes('read')&&uses.includes('code')&&uses.includes('est'));
});

test('scene view renders rule and actor text as text and exports the shortlist JSON',async()=>{
  const template=await readFile(path.join(root,'templates/atlas.html'),'utf8');
  const script=template.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const evil='<img src=x onerror=alert(1)>';
  const cand={id:'maple:x',source:'maple',title:'T',frames:['media/a.png'],durations:[100],ruids:['1'.repeat(32)],box:[1,1]};
  const slots={createdAt:'2026-11-01T00:00:00Z',sourceRef:'origin/main',sourceCommit:'abcdef12',sourceDate:'2026-11-01T00:00:00+09:00',catalog:{createdAt:'2026-10-31',sourceCommit:'12345678'},
    groups:[{id:'g',title:'G'}],slots:[{id:'s',title:'S',group:'g',runtime:'GameConst.FxSkillShardHit',currentNote:'',current:null,fx:[],maple:[cand]}],unassigned:[],counts:{slots:1}};
  const scene={sourceCommit:'fedcba98',sourceDate:'2026-11-01T00:00:00+09:00',rules:{s:{id:'s',scene:'player',anchor:'targetBody',dy:0.3,scale:1.1,order:6,note:evil,src:[evil],uses:[{f:'scale',t:'est',v:1.1,why:evil}],estimated:['scale']}},
    actors:[{id:'player-stand',role:'player',pose:'stand',label:evil,file:'media/a.png',size:[1,1],feet:[0,1],pxPerCell:100,kind:'capture',source:{file:evil,crop:[0,0,1,1],zoom:100},note:evil}],
    maps:[{id:'m',label:evil,file:'media/m.png',size:[1,1],pxPerCell:100,source:{file:'x'}}],pivots:{}};
  const data={createdAt:'2026-10-31',sourceCommit:'12345678',summary:{uniqueImages:1,frameReferences:1},skills:[],groups:[],engineEffects:[],proceduralEffects:[]};
  const nodes=new Map();
  const getNode=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',value:'',querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},classList:{toggle(){}},showModal(){},getContext:()=>({clearRect(){},fillText(){}}),width:100,height:100});
    return nodes.get(selector);
  };
  getNode('#catalog-data').textContent=JSON.stringify(data);
  getNode('#slots-data').textContent=JSON.stringify(slots);
  getNode('#scene-data').textContent=JSON.stringify(scene);
  const context=vm.createContext({document:{querySelector:getNode,querySelectorAll:()=>[],getElementById:id=>getNode('#'+id)},
    performance:{now:()=>0},requestAnimationFrame(){},IntersectionObserver:class{disconnect(){}observe(){}},Image:class{complete=false;naturalWidth=0;}});
  vm.runInContext(script,context);
  for(const view of ['maple','compare']){
    vm.runInContext(`SV.on=true;STATE.tab='pick';PICK.view=${JSON.stringify(view)};PICK.slot='s';render();`,context);
    const html=getNode('#grid').innerHTML;
    assert.ok(html.includes('scene-stage'),view);assert.ok(html.includes('장면 규칙'),view);assert.ok(html.includes('후보 남기기'),view);
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'),view);
    assert.equal(html.includes('<img src=x'),false,view);
  }
  vm.runInContext(`toggleKeep('s','maple:x',true)`,context);
  const json=JSON.parse(vm.runInContext('buildShortlist()',context));
  assert.equal(json.kind,'catch-and-keep/effect-shortlist');
  assert.equal(json.data.sceneRulesCommit,'fedcba98');
  assert.equal(json.slots[0].slotId,'s');
  assert.equal(json.slots[0].runtimeKey,'GameConst.FxSkillShardHit');
  assert.deepEqual(json.slots[0].keep.map(x=>x.candidateId),['maple:x']);
  assert.deepEqual(json.slots[0].keep[0].ruids,['1'.repeat(32)]);
  assert.deepEqual(json.slots[0].sceneRule.estimated,['scale']);
  vm.runInContext(`toggleKeep('s','maple:x',false)`,context);
  assert.equal(JSON.parse(vm.runInContext('buildShortlist()',context)).slots.length,0);
  // 후보 크기: 판정 지름이 있는 원형판 자리는 기본(auto)이 판정 원 맞춤 — 그림이 아직 안 왔으면 보이는 폭의 절반을 반경으로 어림
  vm.runInContext(`SCENE.rules.c={id:'c',scene:'player',anchor:'aim',scale:0.5,judgeD:3,order:1};SLOTS.slots.push({id:'c',title:'C',group:'g',runtime:null,current:null,fx:[],maple:[{id:'maple:y',source:'maple',frames:['media/b.png'],durations:[100],ruids:[],box:[200,120]}]})`,context);
  assert.equal(vm.runInContext(`SV.size`,context),'auto');
  assert.equal(vm.runInContext(`sizeMode(SLOTS.slots[0])+','+sizeMode(SLOTS.slots[1])`,context),'code,circle');
  assert.equal(vm.runInContext(`fitFactor(SLOTS.slots[1],SLOTS.slots[1].maple[0],SCENE.rules.c)`,context),3);
  assert.equal(vm.runInContext(`fitFactor(SLOTS.slots[0],SLOTS.slots[0].maple[0],SCENE.rules.s)`,context),1);
  vm.runInContext(`SV.size='code'`,context);assert.equal(vm.runInContext(`fitFactor(SLOTS.slots[1],SLOTS.slots[1].maple[0],SCENE.rules.c)`,context),1);
  vm.runInContext(`SV.size='circle'`,context);assert.equal(vm.runInContext(`sizeMode(SLOTS.slots[0])`,context),'code');
  vm.runInContext(`SV.on=true;PICK.view='compare';PICK.slot='c';render();`,context);
  assert.ok(getNode('#grid').innerHTML.includes('판정 원에 맞춤'));assert.ok(getNode('#grid').innerHTML.includes('판정 지름 3칸'));
});

test('build embeds recommendation data and verifies the re-search frame manifest',async t=>{
  for(const kind of ['ok','bad-hash'])await t.test(kind,async t=>{
    const {folder}=await fixture(t);
    const extraFrame=Buffer.from('re-search frame bytes');
    await mkdir(path.join(folder,'content/assets/media/slots'),{recursive:true});
    await writeFile(path.join(folder,'content/assets/media/slots/r.png'),extraFrame);
    const extra={id:'maple:r',source:'maple',origin:'recommend',title:'</script><img src=x onerror=alert(1)>',frames:['media/slots/r.png'],durations:[100],ruids:['3'.repeat(32)],box:[1,1]};
    const reco={createdAt:'2026-11-01',slotsCommit:'abc',counts:{slots:1},slots:{s:{id:'s',status:'maple',pick:'maple:r',confidence:'high',ranked:[{candidateId:'maple:r',score:80,reasons:['</script>']}]}},extras:{s:[extra]}};
    await writeJSON(path.join(folder,'content/assets/recommend.json'),reco);
    await writeJSON(path.join(folder,'content/assets/recommend-manifest.json'),[{file:'media/slots/r.png',sha256:kind==='ok'?createHash('sha256').update(extraFrame).digest('hex'):'wrong'}]);
    const result=run(folder,'build');
    if(kind==='bad-hash'){assert.notEqual(result.status,0);assert.match(result.stderr,/hash mismatch/);return;}
    assert.equal(result.status,0,result.stderr);
    await access(path.join(folder,'dist/assets/media/slots/r.png'));
    const html=await readFile(path.join(folder,'dist/assets/index.html'),'utf8');
    const embedded=html.match(/<script id="reco-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(embedded),reco);
    assert.equal(embedded.includes('</script>'),false);
  });
});

test('recommendation table covers every slot and the PNG reader decodes RGBA and palette images',async()=>{
  const {SLOTS}=await import('./slot-defs.mjs');const {RECO_SLOTS,ROLE_KO,ELEMENTS,WEIGHTS}=await import('./recommend-defs.mjs');const {EXCLUDED}=await import('./maple-queries.mjs');
  assert.deepEqual(Object.keys(RECO_SLOTS).sort(),SLOTS.map(s=>s.id).sort());
  for(const [id,[role,el]] of Object.entries(RECO_SLOTS)){assert.ok(ROLE_KO[role],`${id} role ${role}`);assert.ok(ELEMENTS[el],`${id} element ${el}`);}
  assert.equal(Math.round(Object.values(WEIGHTS).reduce((a,b)=>a+b,0)*1000),1000);
  assert.deepEqual(Object.keys(EXCLUDED).sort(),['blast','rite-whirl','rite-whirl-trace','summon-ritual']);
  const {decodePNG}=await import('./png.mjs');const {deflateSync,crc32}=await import('node:zlib');
  const chunk=(type,body)=>{const len=Buffer.alloc(4);len.writeUInt32BE(body.length);const tb=Buffer.concat([Buffer.from(type,'ascii'),body]);const crc=Buffer.alloc(4);crc.writeUInt32BE((crc32?crc32(tb):0)>>>0);return Buffer.concat([len,tb,crc]);};
  const png=(w,h,depth,type,rows,extra=[])=>{const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=depth;ih[9]=type;return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ih),...extra,chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);};
  // 2×1 RGBA, 둘째 줄 없음 · 필터 1(Sub)
  const rgba=decodePNG(png(2,1,8,6,[Buffer.from([1,10,20,30,255,5,5,5,0])]));
  assert.deepEqual([...rgba.data],[10,20,30,255,15,25,35,255]);
  // 팔레트 2색 · 1비트 · tRNS로 0번 투명
  const pal=decodePNG(png(3,1,1,3,[Buffer.from([0,0b01000000])],[chunk('PLTE',Buffer.from([0,0,0,200,100,50])),chunk('tRNS',Buffer.from([0]))]));
  assert.deepEqual([...pal.data],[0,0,0,0,200,100,50,255,0,0,0,0]);
});

test('picker shows recommendation badges, confirms through the normal pick and cycles alternatives',async()=>{
  const template=await readFile(path.join(root,'templates/atlas.html'),'utf8');
  const script=template.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const evil='<img src=x onerror=alert(1)>';
  const a={id:'maple:a',source:'maple',origin:'search',title:'A',frames:['media/a.png'],durations:[100],ruids:['a'.repeat(32)],box:[1,1]};
  const b={id:'maple:b',source:'maple',origin:'search',title:'B',frames:['media/b.png'],durations:[100],ruids:['b'.repeat(32)],box:[1,1]};
  const extra={id:'maple:r',source:'maple',origin:'recommend',title:evil,frames:['media/r.png'],durations:[100],ruids:['c'.repeat(32)],box:[1,1],pivots:[[3,4]]};
  const codex={id:'current',source:'current',kind:'codex',title:'해골 폭탄',frames:['media/k.png'],durations:[100],ruids:['d'.repeat(32)],use:'connected'};
  const slots={createdAt:'2026-11-01T00:00:00Z',sourceRef:'origin/main',sourceCommit:'abcdef12',sourceDate:'2026-11-01T00:00:00+09:00',catalog:{createdAt:'2026-10-31',sourceCommit:'12345678'},
    groups:[{id:'g',title:'G'}],slots:[{id:'s',title:'S',group:'g',runtime:'GameConst.FxSkillShardHit',currentNote:'',current:null,fx:[],maple:[a,b]},{id:'k',title:'K',group:'g',runtime:'GameConst.FxSkillBlast',currentNote:'',current:codex,fx:[],maple:[],mapleExcluded:'해골'}],unassigned:[],counts:{slots:2}};
  const reco={createdAt:'2026-11-01T00:00:00Z',slotsCommit:'abcdef12',counts:{maple:1,high:0,mid:0,low:1,codexKeep:1,fromSearch:0,fromResearch:1},rule:{weights:{part:0.5,color:0.5},confidence:{high:70}},
    slots:{s:{id:'s',status:'maple',pick:'maple:r',confidence:'low',roleKo:'명중',elementKo:'저주',margin:1.2,lowWhy:[evil],ranked:[{candidateId:'maple:r',score:81,reasons:[evil,'색 · 보라']},{candidateId:'maple:b',score:79.8,reasons:['B 이유']},{candidateId:'maple:gone',score:50}]},
      k:{id:'k',status:'codex-keep',pick:'current',confidence:'keep',reasons:['해골 관련 자리 — 코덱스 커스텀 그림 유지'],ranked:[]}},extras:{s:[extra]}};
  const data={createdAt:'2026-10-31',sourceCommit:'12345678',summary:{uniqueImages:1,frameReferences:1},skills:[],groups:[],engineEffects:[],proceduralEffects:[]};
  const nodes=new Map();
  const getNode=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',value:'',querySelectorAll:()=>[],querySelector:()=>null,setAttribute(){},classList:{toggle(){}},showModal(){},getContext:()=>({clearRect(){},fillText(){}}),width:100,height:100});
    return nodes.get(selector);
  };
  getNode('#catalog-data').textContent=JSON.stringify(data);
  getNode('#slots-data').textContent=JSON.stringify(slots);
  getNode('#reco-data').textContent=JSON.stringify(reco);
  const context=vm.createContext({document:{querySelector:getNode,querySelectorAll:()=>[],getElementById:id=>getNode('#'+id)},
    performance:{now:()=>0},requestAnimationFrame(){},IntersectionObserver:class{disconnect(){}observe(){}},Image:class{complete=false;naturalWidth=0;}});
  vm.runInContext(script,context);
  // 재검색 후보가 자리 후보 끝에 붙고, 없어진 후보(maple:gone)는 순위에서 빠진다
  assert.deepEqual(JSON.parse(vm.runInContext(`JSON.stringify(SLOTS.slots[0].maple.map(c=>c.id))`,context)),['maple:a','maple:b','maple:r']);
  assert.equal(vm.runInContext(`rankedOf(SLOTS.slots[0]).length`,context),2);
  for(const view of ['maple','reco','compare']){
    vm.runInContext(`STATE.tab='pick';PICK.view=${JSON.stringify(view)};PICK.slot='s';render();`,context);
    const html=getNode('#grid').innerHTML;
    assert.ok(html.includes('추천 1순위'),view);assert.ok(html.includes('data-reco-ok="s"'),view);
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'),view);assert.equal(html.includes('<img src=x'),false,view);
  }
  vm.runInContext(`STATE.tab='pick';PICK.view='maple';render();`,context);
  let html=getNode('#grid').innerHTML;
  assert.ok(html.includes('코덱스 커스텀 유지'));assert.ok(html.includes('확신 낮음'));assert.ok(html.includes('메이플 후보 · 재검색'));assert.ok(html.includes('다른 것 · 지금 1/2'));
  // 맨 앞 카드 = 추천 1순위
  assert.ok(html.indexOf('data-card="maple:r"')<html.indexOf('data-card="maple:a"'));
  vm.runInContext(`confirmReco('s')`,context);
  assert.equal(vm.runInContext(`PICK.picks.s.choice`,context),'maple:r');
  vm.runInContext(`confirmReco('s')`,context); // 두 번 눌러도 풀리지 않음
  assert.equal(vm.runInContext(`PICK.picks.s.choice`,context),'maple:r');
  const json=JSON.parse(vm.runInContext('buildExport()',context).match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(json.kind,'catch-and-keep/effect-picks');assert.equal(json.picks[0].choice,'maple');assert.equal(json.picks[0].candidateOrigin,'recommend');assert.deepEqual(json.picks[0].ruids,['c'.repeat(32)]);
  vm.runInContext(`nextReco('s')`,context);
  assert.equal(vm.runInContext(`shownReco(SLOTS.slots[0]).row.candidateId`,context),'maple:b');
  vm.runInContext(`confirmReco('s')`,context);assert.equal(vm.runInContext(`PICK.picks.s.choice`,context),'maple:b');
  vm.runInContext(`nextReco('s')`,context);assert.equal(vm.runInContext(`shownReco(SLOTS.slots[0]).rank`,context),1);
  vm.runInContext(`confirmReco('k')`,context);assert.equal(vm.runInContext(`PICK.picks.k.choice`,context),'current');
  // 필터: 확신 낮음만 / 코덱스 유지
  vm.runInContext(`PICK.view='maple';PICK.recoFilter='keep';render();`,context);html=getNode('#grid').innerHTML;assert.ok(html.includes('id="slot-k"'));assert.equal(html.includes('id="slot-s"'),false);
  vm.runInContext(`PICK.recoFilter='low';render();`,context);html=getNode('#grid').innerHTML;assert.ok(html.includes('id="slot-s"'));assert.equal(html.includes('id="slot-k"'),false);
  // 재검색 후보의 장면 피벗은 후보에 실린 값을 쓴다
  assert.equal(vm.runInContext(`pivotOf(SLOTS.slots[0].maple[2],{},0,10,10).join(',')`,context),'3,4');
});
