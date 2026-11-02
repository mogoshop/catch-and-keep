import {readFile,writeFile,mkdir,rm,cp,lstat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readJSON,safeRelative,assertSanitized,filesUnder} from './lib.mjs';
import {renderSite,loadSkillViews,FAVICON} from './site.mjs';
import {checkSite} from './check-site.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const content=path.join(root,'content');
const dist=path.join(root,'dist');
let atlas,maps,policies;
try { [atlas,maps,policies]=await Promise.all(['assets/catalog.json','maps/maps.json','policies/policies.json'].map(x=>readJSON(path.join(content,x)))); }
catch(e){throw new Error('Private content is missing. Run npm run import -- --atlas <path> --maps <path> --policies <path>. Public Git checkouts never deploy an empty replacement.',{cause:e});}
for(const [name,data] of Object.entries({atlas,maps,policies}))assertSanitized(data,name);
if(!atlas.skills?.length||!atlas.groups?.length||!maps.maps?.length||!policies.policies?.length)throw new Error('A required catalog is empty');
const manifest=await readJSON(path.join(content,'assets/media-manifest.json'));
function mediaPath(value) {
  const relative=path.posix.normalize(safeRelative(value));
  if(!relative.startsWith('media/')||relative==='media/')throw new Error(`Media reference must stay in media/: ${value}`);
  return relative;
}
const assetFiles=new Set(),mapFiles=new Set(),hashes=new Map();
for(const m of manifest) {
  const file=mediaPath(m.file);
  if(hashes.has(file))throw new Error(`Duplicate manifest path: ${file}`);
  hashes.set(file,m.sha256);
}
for(const g of atlas.groups)for(const f of g.frames)assetFiles.add(mediaPath(f));
// Optional effect-slot comparison data (npm run slots). Its extra media has its own SHA manifest.
let slots=null;
try { slots=await readJSON(path.join(content,'assets/slots.json')); }
catch(e){ if(e.code!=='ENOENT')throw e; console.warn('No content/assets/slots.json: the slot comparison tab will show its empty state. Run npm run slots -- --game <checkout>.'); }
if(slots) {
  assertSanitized(slots,'slots');
  for(const m of await readJSON(path.join(content,'assets/slots-manifest.json'))) {
    const file=mediaPath(m.file);
    if(hashes.has(file)&&hashes.get(file)!==m.sha256)throw new Error(`Conflicting manifest path: ${file}`);
    hashes.set(file,m.sha256);
  }
  const candidates=slots.slots.flatMap(s=>[s.current,...s.fx,...s.maple]).concat(slots.unassigned).filter(Boolean);
  for(const c of candidates)for(const f of c.frames)assetFiles.add(mediaPath(f));
}
// Optional recommendation data (npm run recommend): 자리별 1순위와 재검색 후보. 재검색 후보 프레임은 자기 SHA 매니페스트로 검사한다.
let reco=null;
try { reco=await readJSON(path.join(content,'assets/recommend.json')); }
catch(e){ if(e.code!=='ENOENT')throw e; console.warn('No content/assets/recommend.json: the picker shows no recommendation badges. Run npm run recommend -- --game <checkout>.'); }
if(reco) {
  assertSanitized(reco,'recommend');
  for(const m of await readJSON(path.join(content,'assets/recommend-manifest.json'))) {
    const file=mediaPath(m.file);
    if(hashes.has(file)&&hashes.get(file)!==m.sha256)throw new Error(`Conflicting manifest path: ${file}`);
    hashes.set(file,m.sha256);
  }
  for(const list of Object.values(reco.extras||{}))for(const c of list)for(const f of c.frames)assetFiles.add(mediaPath(f));
}
// Optional scene-preview data (npm run scene): actor/map stills under content/scene with their own SHA manifest.
let scene=null;const sceneFiles=new Set(),sceneHashes=new Map();
try { scene=await readJSON(path.join(content,'scene/scene.json')); }
catch(e){ if(e.code!=='ENOENT')throw e; console.warn('No content/scene/scene.json: the scene preview will show its empty state. Run npm run scene -- --game <checkout>.'); }
if(scene) {
  assertSanitized(scene,'scene');
  for(const m of await readJSON(path.join(content,'scene/scene-manifest.json'))) {
    const file=mediaPath(m.file);
    if(sceneHashes.has(file))throw new Error(`Duplicate scene manifest path: ${file}`);
    sceneHashes.set(file,m.sha256);
  }
  for(const a of [...(scene.actors||[]),...(scene.maps||[])])sceneFiles.add(mediaPath(a.file));
}
for(const s of atlas.skills)if(s.icon)assetFiles.add(mediaPath(s.icon));
// Previous icons for the 「아이콘 교체」 / 「삭제됨」 comparison (atlas build-changes.py) are checked against the same manifest.
for(const c of atlas.changes?.iconChanged||[])if(c.previousIcon)assetFiles.add(mediaPath(c.previousIcon));
for(const r of atlas.changes?.removed||[])if(r.icon)assetFiles.add(mediaPath(r.icon));
const referencePath=value=>typeof value==='object'&&value?value.src||value.path||value.url:value;
for(const m of maps.maps) {
  const refs=[m.preview,m.thumbnail,...(m.screenshots||[]),...(m.diagrams||[])].map(referencePath).filter(Boolean);
  for(const f of refs)mapFiles.add(mediaPath(f));
}
async function copyReferencedMedia(kind,files) {
  for(const file of files) {
    // Check every path component: a symlinked directory must not escape the bundle.
    let source=root;
    const segments=['content',kind,...file.split('/')];
    for(let i=0;i<segments.length;i++) {
      source=path.join(source,segments[i]);
      const info=await lstat(source);
      if(info.isSymbolicLink()||(i===segments.length-1?!info.isFile():!info.isDirectory()))throw new Error(`Not a regular bundle media file: ${kind}/${file}`);
    }
    const data=await readFile(source);
    const verify=kind==='assets'?hashes:kind==='scene'?sceneHashes:null;
    if(verify) {
      if(!verify.has(file))throw new Error(`Referenced asset missing from manifest: ${kind}/${file}`);
      if(createHash('sha256').update(data).digest('hex')!==verify.get(file))throw new Error(`Asset hash mismatch: ${kind}/${file}`);
    }
    // Scene stills are served next to the atlas page (assets/scene/media/...).
    const destination=path.join(dist,kind==='scene'?'assets/scene':kind,file);
    await mkdir(path.dirname(destination),{recursive:true});
    await writeFile(destination,data);
  }
}
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(path.join(root,'public'),dist,{recursive:true});
await mkdir(path.join(dist,'assets'),{recursive:true});
await copyReferencedMedia('maps',mapFiles);
await copyReferencedMedia('assets',assetFiles);
await copyReferencedMedia('scene',sceneFiles);
await writeFile(path.join(dist,'assets/catalog.json'),JSON.stringify(atlas));
await writeFile(path.join(dist,'assets/audit-summary.json'),JSON.stringify(atlas.summary));
let commit='local';try {commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
// 페이지가 /skills/<id>/ 처럼 깊어져도 그림이 열리도록, 화면에 싣는 사본만 media/… → /assets/media/… 절대 경로로 바꾼다(자료 원본·검사는 그대로).
const MEDIA_REF=/^media\/[^\s"]+\.(?:png|webp|gif|jpe?g)$/i;
const absMedia=v=>Array.isArray(v)?v.map(absMedia):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,absMedia(x)])):typeof v==='string'&&MEDIA_REF.test(v)?'/assets/'+v:v;
const atlasView=absMedia(atlas),slotsView=slots?absMedia(slots):null,recoView=reco?absMedia(reco):null;
// 스킬 화면 자료: 대조표·아이콘·상세는 HTML을 미리 만들고, 검색·효과 재생에 쓰는 자료만 따로 받는다(첫 화면 HTML을 가볍게).
const usedGroups=new Set();for(const s of atlas.skills){(s.groups||[]).forEach(x=>usedGroups.add(x));(s.ownGroups||[]).forEach(x=>usedGroups.add(x));usedGroups.add('icon-'+s.id)}
const {groups:_g,...atlasMeta}=atlasView;
const skillData=JSON.stringify({...atlasMeta,groups:atlasView.groups.filter(g=>usedGroups.has(g.id))});
const fxData=JSON.stringify({createdAt:atlas.createdAt,sourceCommit:atlas.sourceCommit,groups:atlasView.groups.filter(g=>g.category==='fx')});
const summonData=JSON.stringify({createdAt:atlas.createdAt,sourceCommit:atlas.sourceCommit,groups:atlasView.groups.filter(g=>g.category==='summon')});
const appJS=(await readFile(path.join(root,'templates/skills-views.js'),'utf8'))+'\n'+(await readFile(path.join(root,'templates/skills-app.js'),'utf8'));
await mkdir(path.join(dist,'skills/data'),{recursive:true});
await writeFile(path.join(dist,'skills/app.js'),appJS);
await writeFile(path.join(dist,'skills/data/skills.json'),skillData);
await writeFile(path.join(dist,'skills/data/fx.json'),fxData);
await writeFile(path.join(dist,'skills/data/summons.json'),summonData);
await writeFile(path.join(dist,'favicon.svg'),FAVICON);
const versions=new Map();
const asset=url=>{if(!versions.has(url))versions.set(url,createHash('sha256').update(readFileSync(path.join(dist,url))).digest('hex').slice(0,10));return `${url}?v=${versions.get(url)}`};
const visible=g=>!g.hiddenDuplicate&&(!['legacy','superseded'].includes(g.status)||g.connection==='connected');
const ch=atlas.changes||{};const nChanged=(ch.renamed||[]).length+(ch.iconChanged||[]).length+(ch.added||[]).length+(ch.removed||[]).length;
const snapshots=[{type:'스킬·에셋',date:atlas.createdAt,sourceCommit:atlas.sourceCommit,changes:ch.previous?`${nChanged}건 (이름 ${(ch.renamed||[]).length} · 아이콘 ${(ch.iconChanged||[]).length} · 신규 ${(ch.added||[]).length} · 삭제 ${(ch.removed||[]).length})`:''},...(slots?[{type:'효과 자리 비교',date:slots.createdAt,sourceCommit:slots.sourceCommit}]:[]),...(scene?[{type:'장면 보기 배치 규칙',date:scene.createdAt,sourceCommit:scene.sourceCommit}]:[]),...(reco?[{type:'효과 추천 점수',date:reco.createdAt,sourceCommit:reco.slotsCommit}]:[]),{type:'맵',date:maps.updatedAt,sourceCommit:maps.sourceCommit},{type:'규칙',date:policies.updatedAt,sourceCommit:policies.sourceCommit}];
const builtAt=new Date().toISOString();
const latest=[atlas.createdAt,maps.updatedAt,policies.updatedAt,slots?.createdAt].filter(Boolean).sort((a,b)=>(+new Date(String(b).replace(/ (\d\d:\d\d) KST$/,'T$1:00+09:00'))||0)-(+new Date(String(a).replace(/ (\d\d:\d\d) KST$/,'T$1:00+09:00'))||0))[0];
const hero={src:'/img/hero-wasteland.webp',og:'/img/hero-wasteland.webp',alt:'피 묻은 황무지 전체맵 — 메이커 재촬영 화면',caption:'피 묻은 황무지 전체맵 가운데 부분 · 메이커 재촬영(맵 그림만 · 표시용 축소) · 2026.11.02'};
const ctx={atlas,atlasView,maps,policies,slots,slotsView,scene,reco,recoView,builtAt,latest,webCommit:commit,snapshots,hero,asset,views:loadSkillViews(root)};
const pages=renderSite(ctx);
for(const {path:p,html} of pages){
  const file=p.endsWith('/')?path.join(dist,decodeURIComponent(p),'index.html'):path.join(dist,p);
  await mkdir(path.dirname(file),{recursive:true});await writeFile(file,html);
}
await writeFile(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
const check=await checkSite(dist);
if(check.errors.length)throw new Error(`Site check failed (${check.errors.length}):\n`+check.errors.slice(0,40).join('\n'));
const site={title:'메이플 리저렉션 · 개발 자료실',builtAt,sourceCommit:commit,routes:check.routes.length,
 asset:{...atlas.summary,fxGroups:atlas.groups.filter(g=>g.category==='fx'&&visible(g)).length,summonGroups:atlas.groups.filter(g=>g.category==='summon'&&visible(g)).length,slots:slots?.counts||null},
 map:{total:maps.maps.length,withPreview:maps.maps.filter(m=>m.preview).length},policy:{count:policies.policies.length},snapshots};
// Build Output API(prebuilt)는 vercel.json을 읽지 않으므로 같은 규칙을 여기 둔다: 옛 주소 → 새 경로 · 끝 / 붙이기 · 없는 주소 = 404.html
const routes=[
 {src:'/(.*)',headers:{'X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'},continue:true},
 {src:'^/assets/?(?:index\\.html)?$',status:308,headers:{Location:'/skills/'}},
 {src:'^/index\\.html$',status:308,headers:{Location:'/'}},
 {src:'^/((?:[^/]+/)*[^/.]+)$',status:308,headers:{Location:'/$1/'}},
 {handle:'filesystem'},
 {handle:'error'},
 {src:'/(.*)',status:404,dest:'/404.html'}];
const output=path.join(root,'.vercel/output');await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
await cp(dist,path.join(output,'static'),{recursive:true});
await writeFile(path.join(output,'config.json'),JSON.stringify({version:3,routes}));
const files=await filesUnder(dist);
await writeFile(path.join(root,'.vercel/build-verification.json'),JSON.stringify({builtAt,fileCount:files.length,routes:check.routes.length,internalLinks:check.links,mediaHashes:assetFiles.size,sceneHashes:sceneFiles.size,recommendSlots:reco?Object.keys(reco.slots||{}).length:0,skills:atlas.skills.length,maps:maps.maps.length,policies:policies.policies.length,site},null,2));
console.log(`Built ${files.length} files · ${check.routes.length} pages (${check.links} internal link targets checked): ${atlas.skills.length} skills, ${maps.maps.length} maps, ${policies.policies.length} policies. Verified ${assetFiles.size} referenced asset hashes${scene?` and ${sceneFiles.size} scene stills`:''}.`);
