// 빌드 결과 검사: 경로(HTML) 수 · 내부 링크 깨짐 0 · 해시 링크 0(본문 건너뛰기 #main만 허용) · 이모지 0 · 페이지 메타.
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {filesUnder} from './lib.mjs';
// 이모지·그림 기호: 기본 이모지 표시 문자 + 기호 블록(▧ ✦ ◷ ✓ ✕ ★ 등) + 이모지 변형 선택자. 화살표(→ ↔)·가운뎃점은 글자로 허용.
export const EMOJI=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}\u{FE0F}]|\p{Emoji_Presentation}/u;
const exists=async f=>{try{return (await stat(f)).isFile()}catch{return false}};
export async function checkSite(dist,{maxSkillsHTML=300*1024}={}){
  const files=await filesUnder(dist);const html=files.filter(f=>f.endsWith('.html'));const errors=[];
  const texts=[...html,...files.filter(f=>/\.(js|css)$/.test(f))];
  for(const f of texts){const t=await readFile(path.join(dist,f),'utf8');const m=t.match(EMOJI);if(m)errors.push(`emoji ${JSON.stringify(m[0])} in /${f}`);if(/\.js$/.test(f)&&/href=["']#(?!main["'])/.test(t))errors.push(`hash link in /${f}`)}
  const checked=new Map();
  for(const f of html){
    const raw=await readFile(path.join(dist,f),'utf8');
    for(const need of ['<title>','name="description"','property="og:title"','property="og:image"'])if(!raw.includes(need))errors.push(`/${f} lacks ${need}`);
    const markup=raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,m=>m.startsWith('<script src')?m:'');
    for(const [,attr,value] of markup.matchAll(/\s(href|src)="([^"]*)"/g)){
      const v=value.replaceAll('&amp;','&');
      if(v==='#main')continue;
      if(v.includes('#')){errors.push(`hash link ${v} in /${f}`);continue}
      if(/^(?:https?:|mailto:|data:)/.test(v))continue;
      if(!v.startsWith('/')){errors.push(`relative ${attr} ${v} in /${f}`);continue}
      let p=decodeURIComponent(v.split('?')[0]);if(p.endsWith('/'))p+='index.html';
      if(!checked.has(p))checked.set(p,await exists(path.join(dist,p)));
      if(!checked.get(p))errors.push(`broken ${attr} ${v} in /${f}`);
    }
  }
  const skills=path.join(dist,'skills/index.html');
  if(await exists(skills)){const size=(await stat(skills)).size;if(size>maxSkillsHTML)errors.push(`/skills/ HTML ${size} bytes > ${maxSkillsHTML}`)}
  return {routes:html.map(f=>'/'+f.replace(/index\.html$/,'')).sort(),links:checked.size,errors};
}
