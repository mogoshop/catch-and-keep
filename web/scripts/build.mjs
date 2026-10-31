import {readFile,writeFile,mkdir,rm,cp,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readJSON,safeRelative,assertSanitized,filesUnder} from './lib.mjs';
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
for(const s of atlas.skills)if(s.icon)assetFiles.add(mediaPath(s.icon));
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
    if(kind==='assets') {
      if(!hashes.has(file))throw new Error(`Referenced asset missing from manifest: ${file}`);
      if(createHash('sha256').update(data).digest('hex')!==hashes.get(file))throw new Error(`Asset hash mismatch: ${file}`);
    }
    const destination=path.join(dist,kind,file);
    await mkdir(path.dirname(destination),{recursive:true});
    await writeFile(destination,data);
  }
}
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'data'),{recursive:true});
await cp(path.join(root,'public'),dist,{recursive:true});
await mkdir(path.join(dist,'assets'),{recursive:true});
await copyReferencedMedia('maps',mapFiles);
await copyReferencedMedia('assets',assetFiles);
await writeFile(path.join(dist,'data/maps.json'),JSON.stringify(maps));
await writeFile(path.join(dist,'data/policies.json'),JSON.stringify(policies));
await writeFile(path.join(dist,'assets/catalog.json'),JSON.stringify(atlas));
await writeFile(path.join(dist,'assets/audit-summary.json'),JSON.stringify(atlas.summary));
const template=await readFile(path.join(root,'templates/atlas.html'),'utf8');
await writeFile(path.join(dist,'assets/index.html'),template.replace('__CATALOG__',()=>JSON.stringify(atlas).replaceAll('</','<\\/')));
let commit='local';try {commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
const visible=g=>!g.hiddenDuplicate&&(!['legacy','superseded'].includes(g.status)||g.connection==='connected');
const site={title:'잡으면 내편 · 개발 자료실',builtAt:new Date().toISOString(),sourceCommit:commit,
 asset:{...atlas.summary,fxGroups:atlas.groups.filter(g=>g.category==='fx'&&visible(g)).length,summonGroups:atlas.groups.filter(g=>g.category==='summon'&&visible(g)).length},
 map:{total:maps.maps.length,withPreview:maps.maps.filter(m=>m.preview).length},policy:{count:policies.policies.length},
 snapshots:[{type:'스킬·에셋',date:atlas.createdAt,sourceCommit:atlas.sourceCommit},{type:'맵',date:maps.updatedAt,sourceCommit:maps.sourceCommit},{type:'정책',date:policies.updatedAt,sourceCommit:policies.sourceCommit}]};
await writeFile(path.join(dist,'data/site.json'),JSON.stringify(site));
await writeFile(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
const output=path.join(root,'.vercel/output');await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
await cp(dist,path.join(output,'static'),{recursive:true});
await writeFile(path.join(output,'config.json'),JSON.stringify({version:3,routes:[{src:'/(.*)',headers:{'X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'},continue:true},{handle:'filesystem'}]}));
const files=await filesUnder(dist);
await writeFile(path.join(root,'.vercel/build-verification.json'),JSON.stringify({builtAt:site.builtAt,fileCount:files.length,mediaHashes:assetFiles.size,skills:atlas.skills.length,maps:maps.maps.length,policies:policies.policies.length},null,2));
console.log(`Built ${files.length} files: ${atlas.skills.length} skills, ${maps.maps.length} maps, ${policies.policies.length} policies. Verified ${assetFiles.size} referenced asset hashes.`);
