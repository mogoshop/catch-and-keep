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
