// 사이트 틀 검사(지시서 57 §4): 라우트 생성 수 · 내부 링크 깨짐 0 · 해시 링크 0 · 이모지 0 · 옛 주소 규칙.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {checkSite,EMOJI,checkStyle,visibleText,BANNED_WORDS,HYPE_WORDS} from './check-site.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const png=Buffer.from('fixture image bytes');const sha=createHash('sha256').update(png).digest('hex');
const W=(f,v)=>writeFile(f,JSON.stringify(v));

async function site(t){
  const folder=await mkdtemp(path.join(os.tmpdir(),'library-site-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  for(const d of ['scripts','templates','content/assets/media','content/maps/media','content/policies'])await mkdir(path.join(folder,d),{recursive:true});
  for(const n of ['build.mjs','lib.mjs','site.mjs','check-site.mjs'])await cp(path.join(root,'scripts',n),path.join(folder,'scripts',n));
  for(const n of ['skills-views.js','skills-app.js'])await cp(path.join(root,'templates',n),path.join(folder,'templates',n));
  await cp(path.join(root,'public'),path.join(folder,'public'),{recursive:true});
  const skills=[{id:'a_skill',name:'가',kind:'active',tree:'command',row:'1',icon:'media/i.png',groups:['g1']},{id:'b_skill',name:'나',kind:'active',tree:'soul',row:'2',icon:'media/i.png',groups:[]},{id:'n1',name:'노드',kind:'node',parent:'a_skill',icon:'media/i.png',ownGroups:['g1']}];
  const atlas={createdAt:'2026-11-02 10:37 KST',sourceCommit:'6b604cd6aeec',summary:{uniqueImages:1,frameReferences:1},skills,
    groups:[{id:'g1',title:'효과',category:'fx',frames:['media/i.png'],durations:[100],connection:'connected'},{id:'s1',title:'거인',category:'summon',frames:['media/i.png'],durations:[100]}],engineEffects:[],proceduralEffects:[],
    changes:{previous:{createdAt:'2026-10-31 18:50 KST',sourceCommit:'91a67437'},renamed:[{id:'a_skill',from:'옛 이름',to:'가'}],iconChanged:[],added:[],removed:[]}};
  const maps={updatedAt:'2026-11-02T10:52:52+09:00',sourceCommit:'86789485',summary:{text:'맵 요약'},maps:[
    {id:'town',name:'마을',act:1,role:'마을',preview:'media/m.webp',screenshots:[{src:'media/m.webp',kind:'actual-overview',label:'실제 전체맵 캡처'}]},
    {id:'field',name:'들판 (Lv 1~3)',act:1,role:'사냥터',size:{width:70,height:50}},{id:'depth',name:'심도',act:1,role:'심도 인스턴스',status:'등록됨 · 이미지 없음'}]};
  const policies={updatedAt:'2026-10-31T18:56:25+09:00',sourceCommit:'91a67437',summary:'규칙 요약',policies:[{id:'vision',title:'방향',category:'핵심',status:'approved',summary:'요약',body:'본문'},{id:'r2',title:'둘',category:'운영',status:'draft',body:['가','나']}]};
  await W(path.join(folder,'content/assets/catalog.json'),atlas);await W(path.join(folder,'content/assets/media-manifest.json'),[{file:'media/i.png',sha256:sha}]);
  await W(path.join(folder,'content/maps/maps.json'),maps);await W(path.join(folder,'content/policies/policies.json'),policies);
  await writeFile(path.join(folder,'content/assets/media/i.png'),png);await writeFile(path.join(folder,'content/maps/media/m.webp'),png);
  const r=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:folder,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  return {folder,dist:path.join(folder,'dist')};
}

test('build emits one HTML page per route with no broken internal links, hash links or emoji',async t=>{
  const {folder,dist}=await site(t);
  const c=await checkSite(dist);
  assert.deepEqual(c.errors,[]);
  // 홈 1 · 스킬 5(대조표·효과·거인·아이콘·고르기) + 메인 스킬 2 · 맵 1+3 · 규칙 1+2 · 기록 1 · 404 1
  assert.equal(c.routes.length,1+5+2+4+3+1+1);
  for(const r of ['/','/skills/','/skills/fx/','/skills/summons/','/skills/icons/','/skills/pick/','/skills/a_skill/','/skills/b_skill/','/maps/','/maps/town/','/maps/field/','/maps/depth/','/rules/','/rules/vision/','/rules/r2/','/changelog/','/404.html'])assert.ok(c.routes.includes(r),r);
  const map=await readFile(path.join(dist,'maps/field/index.html'),'utf8');
  assert.match(map,/<title>맵 · 들판 — 메이플 리저렉션<\/title>/);assert.match(map,/레벨대<\/th><td>Lv 1~3/);assert.match(map,/출구<\/th><td>자료 없음/);
  assert.ok((await readFile(path.join(dist,'maps/index.html'),'utf8')).includes('이미지 없음'));
  const home=await readFile(path.join(dist,'index.html'),'utf8');
  assert.ok(home.includes('메이플 리저렉션'));assert.equal(/Catch &amp; Keep|잡으면 내편<\/h1>/.test(home),false);
  assert.match(home,/property="og:image" content="https:\/\/[^"]+\/img\/og-default\.webp"/);
  const detail=await readFile(path.join(dist,'skills/a_skill/index.html'),'utf8');
  assert.ok(detail.includes('이름 바뀜'));assert.match(detail,/og:image" content="https:\/\/[^"]+\/assets\/media\/i\.png"/);
  const cfg=JSON.parse(await readFile(path.join(folder,'.vercel/output/config.json'),'utf8'));
  const legacy=cfg.routes.find(r=>r.headers?.Location==='/skills/');assert.ok(new RegExp(legacy.src).test('/assets/')&&new RegExp(legacy.src).test('/assets'));
  assert.ok(cfg.routes.some(r=>r.status===404&&r.dest==='/404.html'));
});

test('site checker reports broken links, hash links, relative links and emoji',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'library-check-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const head='<title>x</title><meta name="description" content="d"><meta property="og:title" content="x"><meta property="og:image" content="https://x/a.png">';
  await mkdir(path.join(dir,'ok'),{recursive:true});await writeFile(path.join(dir,'ok/index.html'),head);
  await writeFile(path.join(dir,'index.html'),`${head}<a href="#main">skip</a><a href="/ok/?act=1">ok</a><a href="#maps">old</a><a href="/missing/">x</a><img src="media/a.png"><p>✦</p>`);
  const {errors}=await checkSite(dir);
  assert.ok(errors.some(e=>/hash link #maps/.test(e)));assert.ok(errors.some(e=>/broken href \/missing\//.test(e)));
  assert.ok(errors.some(e=>/relative src/.test(e)));assert.ok(errors.some(e=>/emoji/.test(e)));
  assert.equal(errors.some(e=>/#main|\/ok\//.test(e)),false);
  for(const ch of ['\u{1F480}','✨','▧','✓'])assert.ok(EMOJI.test(ch),ch);
  for(const ch of ['→','↔','·','×'])assert.equal(EMOJI.test(ch),false,ch);
});

test('AI-look checks: gradient text, glow shadows, banned and hype words fail; off-scale radius warns (지시서 58 §6)',async()=>{
  const bad=checkStyle('.a{background-clip:text;-webkit-text-fill-color:transparent}.b{text-shadow:0 0 8px gold}.c{box-shadow:0 0 12px #f0c}.d{border-radius:14px}.e{box-shadow:0 0 0 1px #fff,0 6px 20px rgba(0,0,0,.1);border-radius:16px 999px}');
  assert.ok(bad.errors.some(e=>/gradient text/.test(e)));assert.ok(bad.errors.some(e=>/text-shadow/.test(e)));
  assert.equal(bad.errors.filter(e=>/glow/.test(e)).length,1);assert.deepEqual(bad.warnings,['radius 14px outside 16/10/8/999 in /site.css']);
  const ok=checkStyle(await readFile(path.join(root,'public/site.css'),'utf8'));assert.deepEqual(ok.errors,[]);assert.deepEqual(ok.warnings,[]);
  const text=visibleText('<p>개발 라이브러리 허브</p><script id="d" type="application/json">{"x":"아카이브"}</script><p>완벽한 군단</p>');
  assert.deepEqual(text.match(BANNED_WORDS),['라이브러리','허브']);assert.deepEqual(text.match(HYPE_WORDS),['완벽한']);
});
