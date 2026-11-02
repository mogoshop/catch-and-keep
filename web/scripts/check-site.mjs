// 빌드 결과 검사: 경로(HTML) 수 · 내부 링크 깨짐 0 · 해시 링크 0(본문 건너뛰기 #main만 허용) · 이모지 0 · 페이지 메타.
// 지시서 58 §6 「AI 느낌 제거」 중 기계로 볼 수 있는 것: 그라데이션 글자 0 · 네온 그림자 0 · 금지 낱말 0 · 과장 형용사 0 (실패) / 반경 체계 밖 값 · 화면당 금색 요소 5개 초과 (경고)
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {filesUnder} from './lib.mjs';
// 이모지·그림 기호: 기본 이모지 표시 문자 + 기호 블록(▧ ✦ ◷ ✓ ✕ ★ 등) + 이모지 변형 선택자. 화살표(→ ↔)·가운뎃점은 글자로 허용.
export const EMOJI=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}\u{FE0F}]|\p{Emoji_Presentation}/u;
export const BANNED_WORDS=/워크스페이스|아카이브|라이브러리|허브/g;
export const HYPE_WORDS=/혁신적|완벽한|궁극의|압도적인|최고의|놀라운|역대급/g;
const RADII=new Set(['0','8px','10px','16px','999px','50%','var(--r-card)','var(--r-btn)','var(--r-sm)','var(--r-pill)','inherit']);
// 보이는 글만: 스크립트(자료 JSON 포함)·스타일·태그를 걷어 낸다
export const visibleText=html=>html.replace(/<script\b[\s\S]*?<\/script>/g,' ').replace(/<style\b[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ');
export function checkStyle(css,file='site.css'){
  const errors=[],warnings=[];
  if(/background-clip\s*:\s*text|text-fill-color/i.test(css))errors.push(`gradient text in /${file}`);
  for(const m of css.matchAll(/text-shadow\s*:\s*([^;}]+)/gi))if(!/^\s*none\s*$/i.test(m[1]))errors.push(`text-shadow ${m[1].trim()} in /${file}`);
  // 네온 = 가로·세로 0에 흐림만 있는 빛 그림자(0 0 Npx …). 고리 테(0 0 0 1px)는 흐림 0이라 허용
  for(const m of css.matchAll(/box-shadow\s*:\s*([^;}]+)/gi))for(const part of m[1].split(/,(?![^(]*\))/))if(/^\s*(?:inset\s+)?0(?:px)?\s+0(?:px)?\s+([1-9]\d*)px/.test(part))errors.push(`glow box-shadow ${part.trim()} in /${file}`);
  for(const m of css.matchAll(/border-radius\s*:\s*([^;}]+)/gi))for(const v of m[1].trim().split(/\s+/))if(!RADII.has(v))warnings.push(`radius ${v} outside 16/10/8/999 in /${file}`);
  return {errors,warnings};
}
// 금색 요소 어림(경고): 머리 내비·푸터 밖의 활성 탭·선택 칩(aria-current) + 선택된 칩 단추 + 주 단추 + 고른 카드 + 홈 영상 재생 단추
export function goldCount(html){
  const body=html.replace(/<header class="site-header">[\s\S]*?<\/header>/,'').replace(/<footer[\s\S]*?<\/footer>/,'').replace(/<script\b[\s\S]*?<\/script>/g,'').replace(/<aside class="drawer"[\s\S]*?<\/aside>/g,'');
  return (body.match(/aria-current="(?:true|page)"/g)||[]).length+(body.match(/class="chip"[^>]*aria-pressed="true"/g)||[]).length+(body.match(/class="[^"]*\b(?:primary|chosen)\b/g)||[]).length;
}
const exists=async f=>{try{return (await stat(f)).isFile()}catch{return false}};
export async function checkSite(dist,{maxSkillsHTML=300*1024}={}){
  const files=await filesUnder(dist);const html=files.filter(f=>f.endsWith('.html'));const errors=[],warnings=[];
  for(const f of files.filter(f=>f.endsWith('.css'))){const r=checkStyle(await readFile(path.join(dist,f),'utf8'),f);errors.push(...r.errors);warnings.push(...r.warnings)}
  const texts=[...html,...files.filter(f=>/\.(js|css)$/.test(f))];
  for(const f of texts){const t=await readFile(path.join(dist,f),'utf8');const m=t.match(EMOJI);if(m)errors.push(`emoji ${JSON.stringify(m[0])} in /${f}`);if(/\.js$/.test(f)&&/href=["']#(?!main["'])/.test(t))errors.push(`hash link in /${f}`);
    const words=/\.html$/.test(f)?visibleText(t):/\.js$/.test(f)?t:'';
    for(const re of [BANNED_WORDS,HYPE_WORDS]){const m=words.match(re);if(m)errors.push(`word ${[...new Set(m)].join(',')} in /${f}`)}
    if(/\.html$/.test(f)){const g=goldCount(t);if(g>5)warnings.push(`${g} accent elements on /${f} (> 5)`)}}
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
  return {routes:html.map(f=>'/'+f.replace(/index\.html$/,'')).sort(),links:checked.size,errors,warnings};
}
