// 검수 자료실 생성기: 게임 체크아웃의 증거 폴더(docs/evidence/…)를 항목 메타(review/items.json)대로 읽어
// 사진은 긴 변 1600px 이하 JPEG(품질 85)와 640px 미리보기로 줄이고, 영상은 그대로(빠른 시작 재포장) · 20MB 넘으면 H.264 CRF 23로 다시 인코딩한다.
// 결과는 content/review/(Git 제외)에만 쓴다: review.json · review-manifest.json(SHA-256) · media/<항목>/…
// 게임 체크아웃은 읽기만 한다(파일 읽기 · git rev-parse).
//   npm run review -- --game /path/to/game-checkout [--items review/items.json] [--only <항목 id,항목 id>]
import {readFile,writeFile,mkdir,rm,readdir,stat,rename} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readJSON,assertSanitized,filesUnder} from './lib.mjs';
import {EMOJI} from './check-site.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:undefined};
const game=opt('game');if(!game)throw new Error('Usage: npm run review -- --game <game checkout> [--items review/items.json] [--only id,id]');
const itemsFile=path.resolve(root,opt('items')||'review/items.json');
const only=opt('only')?new Set(opt('only').split(',')):null;
const out=path.join(root,'content/review');
const MAX_FULL=1600,MAX_THUMB=640,MAX_VIDEO=20*1024*1024;

const run=(cmd,a,o={})=>execFileSync(cmd,a,{encoding:'utf8',maxBuffer:64e6,stdio:['ignore','pipe','pipe'],...o});
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
// 글롭: 마지막 조각만 * ? [...] (예: shots/chk-*.jpg · rec/*.mp4 · shots/[0-9]*-view.jpg)
function globRe(p){return new RegExp('^'+p.replace(/[.+^${}()|\\]/g,'\\$&').replace(/\*/g,'[^/]*').replace(/\?/g,'[^/]')+'$')}
async function expand(dir,pattern){
  const sub=path.posix.dirname(pattern),base=path.posix.basename(pattern);
  if(!/[*?[]/.test(base)){const f=path.join(dir,pattern);if(!existsSync(f))throw new Error(`Missing evidence file: ${pattern}`);return [pattern]}
  const re=globRe(base);const d=path.join(dir,sub);
  const names=(await readdir(d,{withFileTypes:true})).filter(e=>e.isFile()&&re.test(e.name)).map(e=>e.name).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
  if(!names.length)throw new Error(`No evidence file matches ${pattern}`);
  return names.map(n=>sub==='.'?n:`${sub}/${n}`);
}
const flat=rel=>rel.replace(/\//g,'__').replace(/[^\w.-]/g,'_');
const stem=rel=>path.posix.basename(rel).replace(/\.[^.]+$/,'');
function dims(file){const t=run('sips',['-g','pixelWidth','-g','pixelHeight',file]);return [+t.match(/pixelWidth: (\d+)/)[1],+t.match(/pixelHeight: (\d+)/)[1]]}
function toJPEG(src,dst,max,q){
  const [w,h]=dims(src);const a=['-s','format','jpeg','-s','formatOptions',String(q)];
  if(Math.max(w,h)>max)a.push('-Z',String(max));
  run('sips',[...a,src,'--out',dst]);return dims(dst);
}
function probe(file){const j=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',file]));const v=j.streams.find(s=>s.width)||{};return {duration:+j.format.duration,codec:v.codec_name,width:v.width,height:v.height}}
async function video(src,dst){
  const size=(await stat(src)).size;let reencoded=false;
  if(size>MAX_VIDEO){
    for(const crf of [23,26,28]){run('ffmpeg',['-y','-v','error','-i',src,'-c:v','libx264','-preset','medium','-crf',String(crf),'-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',dst]);reencoded=`H.264 CRF ${crf}`;if((await stat(dst)).size<=MAX_VIDEO)break}
  } else run('ffmpeg',['-y','-v','error','-i',src,'-c','copy','-movflags','+faststart',dst]);
  return {reencoded,originalBytes:size};
}
// 표: 따옴표 칸을 지원하는 CSV
function parseCSV(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c;continue}
    if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}
  if(cell||row.length){row.push(cell);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()));
}
// 글: 로컬 절대 경로는 지우고, 이모지·그림 기호는 사이트 규칙(이모지 0)대로 뺀다
const EMOJI_G=new RegExp(EMOJI.source,'gu');
const cleanText=t=>t.replace(/\/(?:Users|private)\/[^\s`'")\]]*/g,'(로컬 경로)').replace(/[A-Z]:\\Users\\[^\s`'")\]]*/g,'(로컬 경로)').replace(EMOJI_G,'');

const meta=await readJSON(itemsFile);
const gameHead=run('git',['-C',game,'rev-parse','HEAD']).trim();
let previous=null;try{previous=await readJSON(path.join(out,'review.json'))}catch{}
if(!only)await rm(out,{recursive:true,force:true});
await mkdir(path.join(out,'media'),{recursive:true});
const items=[];
for(const it of meta.items){
  if(only&&!only.has(it.id)){const keep=previous?.items?.find(x=>x.id===it.id);if(!keep)throw new Error(`--only skips ${it.id} but no previous build exists for it`);items.push(keep);continue}
  const dir=path.join(game,it.folder);if(!existsSync(dir))throw new Error(`Missing evidence folder: ${it.folder}`);
  const mdir=path.join(out,'media',it.id);await rm(mdir,{recursive:true,force:true});await mkdir(path.join(mdir,'t'),{recursive:true});
  const caption=rel=>it.captions?.[rel]||stem(rel);
  let commitFull='';try{commitFull=run('git',['-C',game,'rev-parse','--verify',it.commit+'^{commit}']).trim()}catch{throw new Error(`Commit ${it.commit} not found in game checkout`)}
  const sections=[];let nImg=0,nVid=0,cover=null;
  for(const s of it.sections){
    const sec={title:s.title,lead:s.lead||'',images:[],videos:[],tables:[],notes:[]};
    for(const p of s.images||[])for(const rel of await expand(dir,p)){
      const name=flat(rel).replace(/\.[^.]+$/,'')+'.jpg';
      const [w,h]=toJPEG(path.join(dir,rel),path.join(mdir,name),MAX_FULL,85);toJPEG(path.join(dir,rel),path.join(mdir,'t',name),MAX_THUMB,80);
      const img={src:`media/${it.id}/${name}`,thumb:`media/${it.id}/t/${name}`,width:w,height:h,caption:caption(rel),source:rel};
      sec.images.push(img);nImg++;if(it.cover===rel||(!it.cover&&!cover))cover=img;
    }
    for(const p of s.videos||[])for(const rel of await expand(dir,p)){
      const name=flat(rel);const dst=path.join(mdir,name);const v=await video(path.join(dir,rel),dst);const pr=probe(dst);
      const poster=name.replace(/\.mp4$/i,'')+'.poster.jpg';
      run('ffmpeg',['-y','-v','error','-ss',String(Math.min(1,pr.duration/2)),'-i',dst,'-frames:v','1','-vf',`scale='min(${MAX_FULL},iw)':-2`,'-q:v','3',path.join(mdir,poster)]);
      sec.videos.push({src:`media/${it.id}/${name}`,poster:`media/${it.id}/${poster}`,caption:caption(rel),source:rel,duration:Math.round(pr.duration*10)/10,width:pr.width,height:pr.height,codec:pr.codec,bytes:(await stat(dst)).size,originalBytes:v.originalBytes,reencoded:v.reencoded});nVid++;
    }
    for(const p of s.tables||[])for(const rel of await expand(dir,p)){const rows=parseCSV(cleanText(await readFile(path.join(dir,rel),'utf8')));sec.tables.push({source:rel,header:rows[0]||[],rows:rows.slice(1)})}
    for(const p of s.notes||[])for(const rel of await expand(dir,p))sec.notes.push({source:rel,format:/\.md$/i.test(rel)?'md':'txt',text:cleanText(await readFile(path.join(dir,rel),'utf8'))});
    sections.push(sec);
  }
  if(!cover){const v=sections.flatMap(s=>s.videos)[0];if(v)cover={src:v.poster,thumb:v.poster,caption:v.caption}}
  items.push({id:it.id,title:it.title,date:it.date,kind:it.kind||'done',summary:it.summary||'',folder:it.folder.replace(/\/?$/,'/'),commit:commitFull,cover,counts:{images:nImg,videos:nVid},sections});
  console.log(`${it.id}: ${nImg} images · ${nVid} videos`);
}
const review={createdAt:new Date().toISOString(),gameHead,title:meta.title,lead:meta.lead,items};
assertSanitized(review,'review');
const manifest=[];for(const f of (await filesUnder(path.join(out,'media'))).sort())manifest.push({file:'media/'+f,sha256:await sha(path.join(out,'media',f))});
const referenced=new Set(items.flatMap(i=>i.sections.flatMap(s=>[...s.images.flatMap(x=>[x.src,x.thumb]),...s.videos.flatMap(x=>[x.src,x.poster])])));
for(const f of referenced)if(!manifest.some(m=>m.file===f))throw new Error(`Referenced review media missing: ${f}`);
await writeFile(path.join(out,'review.json'),JSON.stringify(review,null,1));
await writeFile(path.join(out,'review-manifest.json'),JSON.stringify(manifest,null,1));
const bytes=(await Promise.all(manifest.map(m=>stat(path.join(out,m.file))))).reduce((a,s)=>a+s.size,0);
console.log(`Review: ${items.length} items · ${manifest.length} media files · ${(bytes/1048576).toFixed(1)} MB → content/review/ (game HEAD ${gameHead.slice(0,8)})`);
