// 경로마다 HTML을 만드는 정적 사전 렌더(바닐라). build.mjs가 검증한 자료를 받아 [{path, html}]를 돌려준다.
// 틀 = 상단 내비 + 본문(최대 1200px) + 푸터. 모든 링크는 실제 경로(해시 라우팅 없음). 스킬 화면 조각은 templates/skills-views.js를 node:vm으로 그대로 쓴다.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const SITE_NAME='메이플 리저렉션';
export const SITE_NAME_EN='Maple Resurrection';
export const ORIGIN=(process.env.SITE_ORIGIN||'https://catch-and-keep-library.vercel.app').replace(/\/$/,'');
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=v=>esc(encodeURIComponent(String(v)));

// ---- 아이콘: 인라인 SVG 한 세트(24 격자 · 선 1.8 · currentColor). 이모지·기호 글자를 쓰지 않는다 ----
const PATHS={
  skills:'<path d="M12 3.5l2.1 6.4 6.4 2.1-6.4 2.1L12 20.5l-2.1-6.4L3.5 12l6.4-2.1z"/>',
  maps:'<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  rules:'<path d="M6.5 3.5h8l3 3v14h-11z"/><path d="M9.5 10.5h5M9.5 14h5M9.5 17.5h3"/>',
  changelog:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  expand:'<path d="m6 9 6 6 6-6"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  prev:'<path d="m14.5 6-6 6 6 6"/>',
  next:'<path d="m9.5 6 6 6-6 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  external:'<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v5.5H4.5V6H10"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  filter:'<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
  play:'<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
};
export function icon(name,size=20,label='') {
  return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"'}>${PATHS[name]}</svg>`;
}
// 파비콘 = 「리」 한 글자(글자 로고와 같은 Pretendard 800 · 없으면 시스템 고딕). 그림 로고는 별도 요청.
// ⓘ 팝오버(사용법 한 곳) · 「필터」 단추 · 오른쪽 서랍 · 도구 막대 — 모든 목록 화면이 같은 3층(탭 → 한 줄 막대 → 서랍)
export const info=(label,html)=>`<details class="info"><summary title="${esc(label)}">${icon('info',20)}<span class="sr-only">${esc(label)}</span></summary><div class="info-pop">${html}</div></details>`;
const filterBtn=(id,n='')=>`<button class="filter-btn" type="button" data-drawer-open="${id}" aria-controls="${id}" aria-expanded="false">${icon('filter',18)}필터 <b data-filter-n>${n}</b></button>`;
const drawer=(id,body,foot='')=>`<div class="drawer-shade" data-drawer-close hidden></div><aside class="drawer" id="${id}" hidden aria-labelledby="${id}-t"><div class="drawer-head"><h2 id="${id}-t">필터</h2><button type="button" data-drawer-close aria-label="필터 닫기">${icon('close',18)}</button></div><div class="drawer-body">${body}</div>${foot?`<div class="drawer-foot">${foot}</div>`:''}</aside>`;
const toolbar=(...parts)=>`<div class="toolbar"><div class="toolbar-inner">${parts.join('')}</div></div>`;
export const FAVICON=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1A1D21"/><text x="32" y="45" text-anchor="middle" font-family="Pretendard,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="38" font-weight="800" fill="#D1A65A">리</text></svg>\n`;

// ---- 날짜: 자료마다 형식이 달라("2026-11-02 10:37 KST" · ISO UTC · ISO+09:00) 모두 KST로 맞춘다 ----
function toDate(v){if(!v)return null;const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)? ?KST$/);if(m)return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`);const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function kstParts(v){const d=toDate(v);if(!d)return null;const f=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);const o={};for(const p of f)o[p.type]=p.value;if(o.hour==='24')o.hour='00';return o}
export const fmtDay=v=>{const p=kstParts(v);return p?`${p.year}.${p.month}.${p.day}`:'기록 없음'};
export const fmtShort=v=>{const p=kstParts(v);return p?`${p.month}.${p.day}`:'—'};
export const fmtTime=v=>{const p=kstParts(v);return p?`${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute} KST`:'기록 없음'};
const short=c=>c?String(c).slice(0,8):'기록 없음';
const plainText=v=>typeof v==='object'&&v!==null?v.text||v.description||v.summary||v.label||'':String(v??'');
const asList=v=>Array.isArray(v)?v:v?[v]:[];

// ---- 스킬 화면 조각(templates/skills-views.js)을 빌드에서 그대로 실행 ----
export function loadSkillViews(root){
  const code=readFileSync(path.join(root,'templates/skills-views.js'),'utf8');
  const ctx=vm.createContext({});
  vm.runInContext(code+';this.__v={skvModel,skvAuditList,skvIconList,skvBar,skvStamp,skvDetail,skvTreeOf,groupCard,groupScope,SKV,SKV_TREES};',ctx);
  return ctx.__v;
}

// ---- 맵 표시용 정리(내용은 그대로, 보이는 이름에서 레벨대만 따로 뽑는다) ----
const kinds={actual:'실제 캡처','actual-overview':'실제 전체맵 캡처','actual-player':'실제 플레이 화면','actual-comparison':'실제 캡처 비교',screenshot:'실제 캡처',runtime:'실행 화면',maker:'메이커 캡처',offline:'오프라인 미리보기',render:'오프라인 미리보기','offline-render':'오프라인 미리보기','offline-preview':'오프라인 미리보기','offline-diagram':'오프라인 구조도',diagram:'구조도',schematic:'구조도',layout:'구조도',preview:'미리보기'};
const kindLabel=v=>kinds[String(v||'').toLowerCase()]||v||'미리보기';
const refPath=v=>typeof v==='object'&&v?v.src||v.path||v.url:v;
const mapImg=v=>{const r=refPath(v);return r?'/maps/'+String(r).replace(/^\.\//,''):''};
export function mapView(m){
  const name=String(m.name||m.title||m.id);const lv=name.match(/\s*\((Lv [^)]+)\)\s*$/);
  const shots=asList(m.screenshots).map(s=>typeof s==='string'?{src:s,kind:'preview'}:s).filter(s=>refPath(s));
  return {...m,id:String(m.id),fullName:name,displayName:lv?name.slice(0,lv.index).trim():name,level:lv?lv[1]:'',shots,thumb:mapImg(m.preview||m.thumbnail||shots[0]),overview:mapImg(shots[0]),act:m.act??''};
}
const actName=a=>a===''||a===null||a===undefined?'기타':/^\d+$/.test(String(a))?`액트 ${a}`:String(a);
const policyStatus=v=>({approved:['승인','ok'],active:['적용','ok'],current:['현재 정책','ok'],implemented:['구현 기록','ok'],verified:['검증 기록','ok'],draft:['초안','warn'],review:['검토 중','warn'],'needs-review':['검토 필요','warn'],pending:['확인 대기','warn'],planned:['계획','old']}[v]||[v||'상태 미기록','old']);
const mapStatusTone=s=>/이미지 없음/.test(s||'')?'old':/적용 완료/.test(s||'')?'ok':/표본|잔여|미확대/.test(s||'')?'warn':'neutral';

// ---- 공용 틀 ----
const NAV=[['/','홈','home'],['/skills/','스킬','skills'],['/maps/','맵','maps'],['/rules/','규칙','rules'],['/review/','검수','review'],['/changelog/','기록','changelog']];
// 출처·커밋·생성 시각은 본문 위가 아니라 푸터 한 줄(footNote = 이 화면 자료의 출처)
function layout(ctx,{path:p,section,title,description,image,body,bodyAttrs='',scripts='',head='',footNote=''}){
  const full=p==='/'?`${SITE_NAME} — 개발 자료실`:`${title} — ${SITE_NAME}`;
  const og=image?(/^https?:/.test(image)?image:ORIGIN+image):ORIGIN+'/img/og-default.webp';
  const canonical=ORIGIN+(p==='/404.html'?'/':p);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#121417">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(og)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/pretendard-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset('/site.css')}">
${head}</head>
<body data-section="${esc(section)}"${bodyAttrs}>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
<header class="site-header"><div class="wrap header-row">
<a class="logo" href="/"${p==='/'?' aria-current="page"':''}><span class="logo-ko">${SITE_NAME}</span><span class="logo-en">${SITE_NAME_EN.toUpperCase()}</span></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">${icon('menu',22)}<span class="sr-only">메뉴</span></button>
<nav id="site-nav" class="site-nav" aria-label="주 메뉴">${NAV.map(([href,label,key])=>`<a href="${href}"${key===section?' class="active"':''}${href===p?' aria-current="page"':''}>${label}</a>`).join('')}</nav>
</div></header>
<main id="main" tabindex="-1"><div class="wrap">
${body}
</div></main>
<footer class="site-footer"><div class="wrap">
${footNote?`<p class="footer-note">${footNote}</p>`:''}<div class="footer-row">
<span>스냅샷 ${esc(fmtDay(ctx.latest))} · 스킬 자료 커밋 <code>${esc(short(ctx.atlas.sourceCommit))}</code> · 사이트 생성 ${esc(fmtTime(ctx.builtAt))}</span>
<span>개발명 잡으면 내편</span>
</div></div></footer>
<script src="${ctx.asset('/site.js')}" defer></script>
${scripts}</body>
</html>
`;
}
const pageHead=(title,lead,extra='')=>`<header class="page-head">${extra}<h1>${esc(title)}</h1>${lead?`<p class="lead">${esc(lead)}</p>`:''}</header>`;
const crumb=(href,label)=>`<nav class="crumb" aria-label="위치"><a href="${href}">${icon('prev',16)}${esc(label)}</a></nav>`;
const pager=(prev,next,noun)=>`<nav class="pager" aria-label="이전·다음 ${noun}">${prev?`<a class="pager-prev" rel="prev" href="${prev.href}">${icon('prev',18)}<span><small>이전 ${noun}</small>${esc(prev.label)}</span></a>`:'<span></span>'}${next?`<a class="pager-next" rel="next" href="${next.href}"><span><small>다음 ${noun}</small>${esc(next.label)}</span>${icon('next',18)}</a>`:'<span></span>'}</nav>`;
const searchBox=(label,placeholder,id='q')=>`<label class="search">${icon('search',18)}<input id="${id}" name="q" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(label)}" autocomplete="off"></label>`;
const tcard=(href,media,title,meta,extra='')=>`<a class="card tcard" href="${href}"><span class="tcard-media">${media}</span><span class="tcard-body"><span class="tcard-title">${esc(title)}</span>${meta?`<span class="tcard-meta">${esc(meta)}</span>`:''}${extra}</span></a>`;

// ---- 홈 ----
// 키 아트 = 출시 썸네일 v8(그림마다 부제) · 특징 = 월드 서브이미지 v3 · 특징 글 = 출시 캡션 4차 A안(docs/promo/caption-release-20261025-v4.md)의 문장
export const KEY_ART=[
  ['/img/key/01-campfire-companions.webp','모닥불 곁의 두 동료 — 출시 썸네일 ①','출시 썸네일 v8 ① · 2026.10.22'],
  ['/img/key/03-recruitment-scene.webp','계약의 순간 — 출시 썸네일 ③','출시 썸네일 v8 ③ · 2026.10.22'],
  ['/img/key/05-scythe-and-helmet.webp','낫과 낡은 투구 — 출시 썸네일 ⑤','출시 썸네일 v8 ⑤ · 2026.10.22'],
  ['/img/key/06-short-procession.webp','작은 군단의 행진 — 출시 썸네일 ⑥','출시 썸네일 v8 ⑥ · 2026.10.22'],
];
export const FEATURES=[
  ['/img/feature/1-necromancer-25d.webp','네크로맨서','쓰러뜨린 적의 혼으로 군단을 만드는 네크로맨서 액션 RPG입니다. 해골 전사와 해골 마법사를 일으킵니다.'],
  ['/img/feature/2-legion-battle.webp','군단 전투','잡은 몬스터는 그림자 병사로 거느립니다. 보스도 잡으면 내 편이 됩니다.'],
  ['/img/feature/3-loot-and-party-v2.webp','전리품과 파티','바닥에 떨어진 장비를 직접 줍고, 스킬과 강화로 나만의 군단을 완성합니다. 최대 4인 파티를 지원합니다.'],
  ['/img/feature/4-story-awakening.webp','이야기','무덤 왕국부터 심연의 문까지 네 개의 지역을 지납니다. 보통·악몽·지옥 세 단계 난이도.'],
];
export const VIDEO_ID='_tM92ViIeNw';
function homePage(ctx){
  const {atlas,maps,policies}=ctx;const mains=atlas.skills.filter(s=>s.kind!=='node').length,nodes=atlas.skills.length-mains;
  const ms=maps.summary||{};const base=ms.baseMaps??maps.maps.filter(m=>m.role!=='심도 인스턴스').length,depth=ms.depthInstances??maps.maps.length-base;
  const approved=policies.policies.filter(p=>p.status==='approved').length;
  const vision=policies.policies.find(p=>p.id==='vision');
  const lead=vision?`${vision.title}. ${plainText(vision.summary)}`:'쓰러뜨린 적을 군단으로 거느리는 네크로맨서 핵앤슬래시.';
  const ch=atlas.changes||{};const ren=ch.renamed||[],ic=ch.iconChanged||[],add=ch.added||[],rem=ch.removed||[];
  const prev=ch.previous;
  const changes=prev?[
    `스킬 이름 ${ren.length}개 변경${ren[0]?` — 예: ${ren[0].from} → ${ren[0].to}`:''}`,
    `스킬 아이콘 ${ic.length}개 교체${ic.length?` — ${ic.slice(0,3).map(x=>(atlas.skills.find(s=>s.id===x.id)||{}).name||x.id).join(' · ')}${ic.length>3?' 외':''}`:''}`,
    `스킬 신규 ${add.length} · 삭제 ${rem.length}${add[0]?` — 신규 ${add.map(x=>x.name).join(' · ')}`:''}${rem.length?` · 삭제 ${rem.filter(r=>r.kind!=='node').map(r=>r.name).join(' · ')||rem[0].name}`:''}`]:[];
  const hotbar=ctx.skillModel.mains.filter(s=>s.icon).slice(0,6);
  const map=ctx.mapList.find(m=>m.id==='wasteland')||ctx.mapList.find(m=>m.overview);
  const hero=ctx.hero;
  const entries=[
    tcard('/skills/',`<span class="hotbar">${hotbar.map(s=>`<span><img src="${esc(s.icon)}" alt="" loading="lazy" width="40" height="40"></span>`).join('')}</span>`,'스킬',`메인 ${mains} · 강화 노드 ${nodes} · 핫바 아이콘 ${fmtShort(atlas.createdAt)}`),
    tcard('/maps/',`<img src="${esc(hero.src)}" alt="${esc(hero.alt)}" loading="lazy">`,'맵',`등록 ${maps.maps.length} · 기본 ${base} · 심도 ${depth} · ${map?map.displayName+' 캡처 ':''}${fmtShort(maps.updatedAt)}`),
    tcard('/rules/',`<ul class="rule-thumb">${policies.policies.slice(0,4).map(p=>`<li>${esc(p.title)}</li>`).join('')}</ul>`,'규칙',`${policies.policies.length}건 · 승인 ${approved}`),
  ];
  const body=`<section class="home-intro" aria-labelledby="home-title"><div><h1 id="home-title">${SITE_NAME}</h1><p class="lead">${esc(lead)}</p></div><a class="cta" href="/skills/">스킬 대조표 보기</a></section>
<section class="home-hero" aria-label="키 아트와 플레이 영상">
<figure class="keyart" data-keyart><div class="keyart-stage">${KEY_ART.map(([src,alt],i)=>`<img src="${src}" width="1280" height="720" alt="${esc(alt)}" data-slide="${i}"${i?' hidden loading="lazy"':' fetchpriority="high"'} decoding="async">`).join('')}</div>
<div class="keyart-foot"><figcaption data-keyart-cap>${esc(KEY_ART[0][2])}</figcaption><div class="dots" role="group" aria-label="키 아트 고르기">${KEY_ART.map(([,alt,cap],i)=>`<button type="button" data-dot="${i}" data-cap="${esc(cap)}" aria-pressed="${i===0}" aria-label="${i+1}번째 그림 · ${esc(alt.split(' — ')[0])}"></button>`).join('')}</div></div></figure>
<div class="video"><h2>플레이 영상</h2><button class="yt" type="button" data-yt="${VIDEO_ID}" aria-label="플레이 영상 재생 · YouTube"><img src="https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="yt-play">${icon('play',28)}</span></button><p>누르면 YouTube 영상을 불러옵니다 · 자동 재생 없음</p></div>
</section>
<section aria-labelledby="entry-title"><h2 id="entry-title" class="section-title">둘러보기</h2><div class="entries">${entries.join('')}</div></section>
<section aria-labelledby="feat-title"><h2 id="feat-title" class="section-title">특징</h2><ul class="features">${FEATURES.map(([src,t,d])=>`<li class="feature"><img src="${src}" width="960" height="540" alt="${esc(t)} — 월드 서브이미지" loading="lazy" decoding="async"><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul></section>
${changes.length?`<section class="changes" aria-labelledby="chg-title"><h2 id="chg-title" class="section-title">바뀐 것</h2><ul>${changes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="minor">직전 스킬 묶음 ${esc(prev.createdAt)}(${esc(short(prev.sourceCommit))}) 대비 · 맵·규칙은 비교 자료 없음</p></section>`:''}`;
  const foot=`키 아트 = 출시 썸네일 v8(2026.10.22) · 특징 그림 = 월드 서브이미지 v3(2026.10.23 · 실제 플레이 화면 축소·배치) · 특징 글 = 출시 캡션 4차(2026.10.25) · 맵 그림 = ${esc(hero.caption)} · 영상 = YouTube ${VIDEO_ID}`;
  return layout(ctx,{path:'/',section:'home',title:SITE_NAME,description:`${SITE_NAME} 개발 자료실 — 스킬 ${mains}개·맵 ${maps.maps.length}개·규칙 ${policies.policies.length}건과 스냅샷 기준 시점.`,image:'/img/og-default.webp',body,footNote:foot});
}

// ---- 스킬 ----
const SKILL_TABS=[['/skills/','대조표','audit'],['/skills/fx/','효과','fx'],['/skills/summons/','거인·소환물','summon'],['/skills/icons/','아이콘','icons'],['/skills/pick/','효과 고르기','pick']];
function skillsHead(ctx,view){
  const {atlas}=ctx;const mains=atlas.skills.filter(s=>s.kind!=='node').length;
  return `${pageHead('스킬',`메인 스킬 ${mains}개와 강화 노드 ${atlas.skills.length-mains}개. 효과·거인 동작은 원본 PNG를 이어 재생합니다.`)}
<nav class="subnav" aria-label="스킬 화면">${SKILL_TABS.map(([href,label,key])=>`<a href="${href}"${key===view?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
const DETAIL_DIALOG=`<dialog id="detail" aria-labelledby="detailTitle"><div class="dialog-top"><h2 id="detailTitle"></h2><button id="closeDetail" type="button" aria-label="크게 보기 닫기">${icon('close',18)}<span>닫기</span></button></div><div class="stage dialog-stage"><canvas id="detailCanvas" width="900" height="500"></canvas></div><div class="dialog-body"><div class="playback"><button id="detailPlay" type="button">일시정지</button><button id="restart" type="button">처음부터</button><input id="scrub" type="range" min="0" max="0" value="0" aria-label="프레임 선택"><span id="detailFrame" class="minor"></span></div><div id="detailMeta" class="minor"></div><div class="frames" id="frames"></div><p id="detailNote"></p><details class="sources"><summary>출처·연결 근거</summary><pre id="sourceText"></pre></details></div></dialog>`;
const EXPORT_DIALOG=`<dialog id="exportDialog" aria-labelledby="exportTitle"><div class="dialog-top"><h2 id="exportTitle">선택 내보내기</h2><button id="closeExport" type="button" aria-label="내보내기 닫기">${icon('close',18)}<span>닫기</span></button></div><div class="dialog-body"><p id="exportStatus" role="status"></p><textarea id="exportText" readonly aria-label="내보낼 선택 내용"></textarea><p class="minor"><button id="copyExport" type="button">다시 복사</button> 사람이 읽는 요약 아래에 자리 id·후보 id·RUID 목록·메모를 담은 JSON이 붙어 있습니다.</p></div></dialog>`;
const embed=(id,value)=>`<script id="${id}" type="application/json">${JSON.stringify(value).replaceAll('</','<\\/')}</script>`;
// 재생 묶음: 오른쪽 아래 고정 알약 3개(도구 막대에서 뺌)
const PLAY_DOCK=`<div class="play-dock" role="group" aria-label="재생"><button id="playAll" type="button" aria-pressed="true">전체 일시정지</button><label><span class="sr-only">속도</span><select id="speed" aria-label="재생 속도"><option value="0.5">0.5×</option><option selected value="1">속도 1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label><span class="sr-only">배경</span><select id="background" aria-label="그림 배경"><option value="dark">배경 어둡게</option><option value="mid">배경 중간</option><option value="light">배경 밝게</option></select></label></div>`;
function skillScripts(ctx){return `<script src="${ctx.asset('/skills/app.js')}" defer></script>\n`}
function skillStamp(ctx){const a=ctx.atlas;const p=a.changes?.previous;return `스킬 자료 = 게임 커밋 <code>${esc(short(a.sourceCommit))}</code> · 생성 ${esc(a.createdAt||'')}${p?` · 변경 비교 ${esc(p.createdAt)} 묶음(${esc(short(p.sourceCommit))})`:' · 직전 묶음 비교 자료 없음'} · 「코드 연결」은 소스·PNG 바이트 대조이며 실제 플레이 검수와 별개 · 원본 PNG 재생, 실제 녹화 아님`}
function skillsAudit(ctx,kind){
  const V=ctx.views;const M=V.skvModel(ctx.atlasView);
  const html=kind==='icons'
    ?`<div class="skv">${V.skvBar(M,'icons')}<div class="skv-list skv-icons skv-size-${V.SKV.size}">${V.skvIconList(M).html}</div></div>`
    :`<div class="skv">${V.skvBar(M,'audit')}<div class="skv-list">${V.skvAuditList(ctx.atlasView,M).html}</div></div>`;
  const count=kind==='icons'?`메인 스킬 ${M.mains.length}개와 그 노드 아이콘 · 전체 ${ctx.atlas.skills.length}개`:`메인 스킬 ${M.mains.length}개 · 전체 ${ctx.atlas.skills.length}개(강화 노드 포함) 대조`;
  const body=`${skillsHead(ctx,kind)}
<div id="skv-root" data-skv="${kind}">${html}</div>
<p class="status-line"><span id="count" aria-live="polite">${esc(count)}</span></p>
${DETAIL_DIALOG}`;
  const p=kind==='icons'?'/skills/icons/':'/skills/';
  return layout(ctx,{path:p,section:'skills',title:kind==='icons'?'스킬 · 아이콘':'스킬 · 대조표',description:kind==='icons'?`스킬·강화 노드 아이콘 ${ctx.atlas.skills.length}개를 스킬 창·지정 창·핫바 크기로 비교.`:`메인 스킬 ${M.mains.length}개를 트리별 카드로 — 강화 노드, 효과 연결, 직전 묶음 대비 변경 표시.`,body,bodyAttrs:` data-view="${kind}" data-skills="${ctx.asset('/skills/data/skills.json')}"`,scripts:skillScripts(ctx),footNote:skillStamp(ctx)+(kind==='icons'?' · 아이콘 묶음 = 스킬 자료의 icon PNG':'')});
}
const SCOPES=[['current','현재 연결 + 최신 제작'],['all','이전 버전 포함'],['connected','코드 연결'],['pending','제작·검토 후보']];
// 효과 탭 왼쪽 목록 = 효과를 쓰는 메인 스킬(전체 · 스킬마다 · 스킬 연결 없음)
export function fxSkillList(ctx){
  const fx=new Set(ctx.atlasView.groups.filter(g=>g.category==='fx').map(g=>g.id));
  return ctx.skillModel.mains.map(s=>{const ids=new Set((s.groups||[]).filter(id=>fx.has(id)));for(const n of ctx.skillModel.nodesOf.get(s.id)||[])for(const id of n.ownGroups||[])if(fx.has(id))ids.add(id);return {id:s.id,name:s.name,icon:s.icon||'',groups:[...ids]}}).filter(x=>x.groups.length);
}
function skillsGrid(ctx,kind){
  const V=ctx.views;const cat=kind==='summon'?'summon':'fx';const all=ctx.atlasView.groups.filter(g=>g.category===cat);const shown=all.filter(g=>V.groupScope(g,'current'));
  const p=kind==='summon'?'/skills/summons/':'/skills/fx/';
  const help=`<p>카드를 누르면 크게 보기 · 프레임별로 확인합니다.</p><p>원본 PNG를 연결한 오프라인 미리보기입니다. 각 카드에 맞춰 확대하므로 실게임 크기 비율과는 다릅니다.</p><p>「코드 연결」은 소스에서 확인한 상태이며 실제 플레이 검수 판정과는 별개입니다. 프레임 보간·새 그림 생성 없이 원본 순서대로 재생하고, 확인되지 않은 속도는 검수용 100ms/장으로 표시합니다.</p>`;
  const tb=toolbar(searchBox('스킬·효과 이름 검색','스킬·효과 이름 검색','search'),`<div class="chips" role="group" aria-label="보기">${SCOPES.map(([v,l])=>`<button type="button" class="chip" data-scope="${v}" aria-pressed="${v==='current'}">${l}</button>`).join('')}</div>`,`<div class="tool-end">${info('사용법',help)}</div>`);
  let grid;
  if(kind==='summon')grid=`<div class="grid" id="grid">${shown.map(V.groupCard).join('')}</div>`;
  else{const sk=fxSkillList(ctx);grid=`<div class="split" id="grid" data-mode="detail"><nav class="split-list" aria-label="스킬별 효과"><ul><li><button type="button" class="li-btn" data-fx-skill="" aria-current="true"><span class="li-thumb">${shown.length}</span><span class="li-text"><b>전체</b><small>효과 묶음 ${shown.length}</small></span><span></span></button></li></ul><h3>스킬별</h3><ul>${sk.map(s=>`<li><button type="button" class="li-btn" data-fx-skill="${esc(s.id)}"><span class="li-thumb">${s.icon?`<img src="${esc(s.icon)}" alt="" loading="lazy">`:''}</span><span class="li-text"><b>${esc(s.name)}</b><small>효과 ${s.groups.length}</small></span><span></span></button></li>`).join('')}</ul></nav><div class="split-detail"><div class="detail-bar"><button type="button" class="back-btn small" data-back>스킬 목록</button><span class="pick-count">전체 · 효과 ${shown.length}</span></div><div class="grid">${shown.map(V.groupCard).join('')}</div></div></div>`}
  const body=`${skillsHead(ctx,kind)}
${tb}
<p class="status-line"><span id="count" aria-live="polite">${shown.length}개 묶음 표시 · 총 ${all.length}개</span></p>
${grid}
${kind==='summon'?'':embed('fx-skills',fxSkillList(ctx))}
${PLAY_DOCK}
${DETAIL_DIALOG}`;
  return layout(ctx,{path:p,section:'skills',title:kind==='summon'?'스킬 · 거인·소환물':'스킬 · 효과',description:kind==='summon'?`거인·소환물 동작 ${shown.length}묶음을 원본 프레임으로 재생.`:`스킬 효과 ${shown.length}묶음을 원본 프레임 순서대로 재생.`,body,bodyAttrs:` data-view="${kind}" data-src="${ctx.asset(kind==='summon'?'/skills/data/summons.json':'/skills/data/fx.json')}"`,scripts:skillScripts(ctx),footNote:`${esc(ctx.atlas.createdAt)} 기준 · 정본 <code>${esc(short(ctx.atlas.sourceCommit))}</code> · 원본 PNG를 연결한 오프라인 미리보기(실제 녹화 아님 · 카드마다 자동 확대)`});
}
function skillsPick(ctx){
  const {slots,scene,reco,atlas}=ctx;
  const help=`<div id="pickInfo"><p>왼쪽에서 자리를 고르면 오른쪽에 그 자리의 후보가 나란히 재생됩니다. 카드 아래 단추로 자리마다 하나를 고르고 메모를 남긴 뒤 「선택 내보내기」로 복사해 붙여 넣어 주세요.</p><p>실제 게임에서 다시 찍어 볼 후보는 여러 개 「후보 남기기」 → 「실녹화 목록 내보내기」. 고른 것은 이 브라우저에만 저장됩니다.</p></div>`;
  const tb=toolbar(searchBox('자리·후보 검색','자리·후보 이름·RUID 검색','search'),`<div class="chips" id="pickTools" role="group" aria-label="후보 출처"></div>`,`<div class="tool-end">${slots?filterBtn('pickDrawer'):''}${info('사용법',help)}</div>`);
  const foot=slots?`자리 기준 = 게임 정본 <code>${esc(short(slots.sourceCommit))}</code>(${esc(slots.sourceRef||'')}) · 코덱스 FX 목록 = 카탈로그 <code>${esc(short(slots.catalog?.sourceCommit))}</code>(${esc(slots.catalog?.createdAt||'')}) + 그 뒤 통일 공정 FX · 메이플 그림 = MSW 리소스 검색 API 프레임 · 「메이플 후보 · 검색」 = 고정 목록(scripts/maple-picks.mjs) · 자료 생성 ${esc(fmtTime(slots.createdAt))}${scene?` · 장면 보기 = 웹 합성(근사 · 메이커 실녹화 아님) · 배치 규칙 게임 <code>${esc(short(scene.sourceCommit))}</code>`:''}${reco?` · 추천 점수 ${esc(fmtTime(reco.createdAt))}`:''}`:'효과 자리 비교 자료 없음';
  const body=`${skillsHead(ctx,'pick')}
${tb}
<div class="applied" id="pickApplied" aria-label="적용한 필터"></div>
<p class="status-line"><span id="count" aria-live="polite">${slots?`효과 자리 ${slots.counts?.slots??slots.slots.length}곳`:'효과 자리 비교 자료 없음'}</span></p>
<div class="pick" id="grid">${slots?'<p class="minor">자리 목록을 그리는 중…</p>':'<div class="empty">효과 자리 비교 자료가 이 배포에 없습니다.</div>'}</div>
${slots?drawer('pickDrawer','<div id="pickDrawerBody"></div>','<button type="button" id="pickReset">필터 초기화</button><button type="button" id="pickClear">고른 것 모두 지우기</button>'):''}
${PLAY_DOCK}
${DETAIL_DIALOG}${EXPORT_DIALOG}
${embed('catalog-data',{createdAt:atlas.createdAt,sourceCommit:atlas.sourceCommit,summary:atlas.summary,skills:[],groups:[],engineEffects:[],proceduralEffects:[]})}
${embed('slots-data',ctx.slotsView)}
${embed('scene-data',scene)}
${embed('reco-data',ctx.recoView)}`;
  return layout(ctx,{path:'/skills/pick/',section:'skills',title:'스킬 · 효과 고르기',description:'스킬 효과 자리마다 지금 그림·코덱스 FX·메이플 클립을 나란히 보고 고르는 화면.',body,bodyAttrs:' data-view="pick"',scripts:skillScripts(ctx),footNote:foot});
}
function skillDetail(ctx,s,i,list){
  const V=ctx.views;const M=ctx.skillModel;
  const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/skills/${enc(x.id)}/`,label:x.name};
  const body=`${crumb('/skills/','스킬 대조표')}
${V.skvDetail(ctx.atlasView,M,s)}
${pager(link(prev),link(next),'스킬')}
${DETAIL_DIALOG}`;
  const nodes=(M.nodesOf.get(s.id)||[]).length;
  return layout(ctx,{path:`/skills/${encodeURIComponent(s.id)}/`,section:'skills',title:`스킬 · ${s.name}`,description:`${s.name}(${s.kindLabel||s.kind}) — ${plainText(s.desc).slice(0,110)}${nodes?` · 강화 노드 ${nodes}개`:''}`,image:s.icon?(String(s.icon).startsWith('/')?s.icon:'/assets/'+s.icon):undefined,body,bodyAttrs:` data-view="skill" data-skills="${ctx.asset('/skills/data/skills.json')}"`,scripts:skillScripts(ctx),footNote:skillStamp(ctx)});
}

// ---- 맵 ----
function mapCard(m){
  const meta=[actName(m.act),m.role||'역할 미기록',m.size?`${m.size.width}×${m.size.height}`:'',m.level].filter(Boolean).join(' · ');
  const text=[m.fullName,m.id,actName(m.act),m.role].join(' ').toLowerCase();
  const media=m.thumb?`<img src="${esc(m.thumb)}" alt="${esc(m.displayName)} — ${esc(m.capturedAt?'캡처 '+fmtDay(m.capturedAt):kindLabel(m.previewLabel||'preview'))}" loading="lazy" decoding="async">`:`<span class="thumb-empty">이미지 없음</span>`;
  return `<li data-item data-act="${esc(m.act)}" data-role="${esc(m.role||'')}" data-text="${esc(text)}">${tcard(`/maps/${enc(m.id)}/`,media,m.displayName,meta,`<span class="badge ${mapStatusTone(m.status)}">${esc(m.status||'상태 미기록')}</span>`)}</li>`;
}
function mapsPage(ctx){
  const list=ctx.mapList;const acts=[...new Set(list.map(m=>String(m.act)))];const roles=[...new Set(list.map(m=>m.role).filter(Boolean))];
  const sum=ctx.maps.summary||{};const lead=plainText(sum)||'맵의 전체 캡처와 제원.';
  const body=`${pageHead('맵',lead)}
<div class="filters" data-filter-root data-noun="맵" data-drawer-keys="role">
${toolbar(searchBox('맵 검색','맵 이름·id 검색'),`<nav class="chips" aria-label="액트"><a href="/maps/" data-filter="act" data-value="" aria-current="true">전체 <b>${list.length}</b></a>${acts.map(a=>`<a href="/maps/?act=${enc(a)}" data-filter="act" data-value="${esc(a)}">${esc(actName(a))} <b>${list.filter(m=>String(m.act)===a).length}</b></a>`).join('')}</nav>`,`<div class="tool-end"><span class="result-count" data-count aria-live="polite">${list.length}개 맵</span>${filterBtn('mapDrawer')}</div>`)}
<div class="applied" data-applied aria-label="적용한 필터"></div>
${drawer('mapDrawer',`<fieldset><legend>역할</legend><div class="chips" role="group" aria-label="역할"><a href="/maps/" data-filter="role" data-value="" aria-current="true">모든 역할</a>${roles.map(r=>`<a href="/maps/?role=${enc(r)}" data-filter="role" data-value="${esc(r)}">${esc(r)} <b>${list.filter(m=>m.role===r).length}</b></a>`).join('')}</div></fieldset>`,`<a class="text-link" href="/maps/" data-filter="role" data-value="">역할 지우기</a><button type="button" data-drawer-close>닫기</button>`)}
</div>
<ul class="map-grid" data-list>${list.map(mapCard).join('')}</ul>
<p class="empty" data-empty hidden>조건에 맞는 맵이 없습니다.</p>`;
  return layout(ctx,{path:'/maps/',section:'maps',title:'맵',description:`등록 맵 ${list.length}개 — 액트·역할별 전체맵 캡처와 제원.`,image:list.find(m=>m.overview)?.overview,body,footNote:`맵 자료 ${esc(fmtTime(ctx.maps.updatedAt))} · 소스 <code>${esc(short(ctx.maps.sourceCommit))}</code>${sum.scopeNote?` · ${esc(sum.scopeNote)}`:''}`});
}
function mapDetail(ctx,m,i,list){
  const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/maps/${enc(x.id)}/`,label:x.displayName};
  const rows=[
    ['액트',actName(m.act)],['역할',m.role||'자료 없음'],['레벨대',m.level||'자료 없음'],['크기',m.size?`${m.size.width} × ${m.size.height}칸`:'자료 없음'],
    ['출구',m.exits?asList(m.exits).map(plainText).join(' · '):'자료 없음'],['난이도 인스턴스',m.difficulty||'자료 없음'],['상태',m.status||'자료 없음'],
    ...(m.instanceIndex!==undefined?[['심도 순번',String(m.instanceIndex)]]:[]),
    ...(m.designMode?[['구성 방식',`${m.designMode}${m.designGrade?` · 등급 ${m.designGrade}`:''}${m.designStatus?` · ${m.designStatus}`:''}`]]:[]),
    ...(m.capturedAt?[['캡처 시각',fmtTime(m.capturedAt)]]:[]),
  ];
  const shots=m.shots;const cap=s=>`${s.label||kindLabel(s.kind)}${m.capturedAt?` · ${fmtDay(m.capturedAt)}`:''}`;
  const view=shots.length?`<section class="map-view" data-shots aria-label="맵 그림">${shots.length>1?`<div class="seg seg-buttons" role="group" aria-label="그림 고르기">${shots.map((s,k)=>`<button type="button" data-shot="${k}" aria-pressed="${k===0}">${esc(s.label?s.label.split(' · ')[0]:kindLabel(s.kind))}</button>`).join('')}</div>`:''}${shots.map((s,k)=>`<figure class="shot" data-shot-panel="${k}"${k?' hidden':''}><img src="${esc(mapImg(s))}" alt="${esc(m.displayName)} — ${esc(s.label||kindLabel(s.kind))}" ${k?'loading="lazy" ':''}decoding="async"><figcaption>${esc(cap(s))}</figcaption></figure>`).join('')}</section>`
    :`<section class="map-view"><div class="shot-empty">이 맵의 그림은 아직 등록되지 않았습니다 · ${esc(m.status||'')}</div></section>`;
  const refs=asList(m.sourceRefs).map(r=>`<li><code>${esc(typeof r==='string'?r:r.path||r.file||'')}</code>${typeof r==='object'&&r.section?` <span class="minor">${esc(r.section)}</span>`:''}</li>`).join('');
  const body=`${crumb(`/maps/?act=${enc(m.act)}`,`맵 · ${actName(m.act)}`)}
${pageHead(m.displayName,m.description||'',`<p class="eyebrow">${esc(actName(m.act))} · ${esc(m.role||'')}</p>`)}
${view}
<div class="detail-grid">
<section><h2>제원</h2><table class="spec"><tbody>${rows.map(([k,v])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>${m.designReason?`<p class="minor">${esc(m.designReason)}</p>`:''}</section>
<section>${asList(m.spaces).length?`<h2>공간</h2><ul class="plain">${m.spaces.map(s=>`<li><b>${esc(s.name)}</b> <span class="minor">${esc(s.role||'')}</span></li>`).join('')}</ul>`:''}<h2>노트</h2>${asList(m.notes).length?`<ul class="plain">${m.notes.map(n=>`<li>${esc(plainText(n))}</li>`).join('')}</ul>`:'<p class="minor">기록된 노트 없음</p>'}<h2>원본 자료</h2>${refs?`<ul class="refs">${refs}</ul>`:'<p class="minor">연결된 원본 경로 없음</p>'}</section>
</div>
${pager(link(prev),link(next),'맵')}`;
  return layout(ctx,{path:`/maps/${encodeURIComponent(m.id)}/`,section:'maps',title:`맵 · ${m.displayName}`,description:`${actName(m.act)} ${m.role||''} ${m.displayName}${m.level?` (${m.level})`:''} — ${m.description||m.status||''}`.trim(),image:m.overview||undefined,body,footNote:`맵 자료 ${esc(fmtDay(ctx.maps.updatedAt))} · 소스 <code>${esc(short(ctx.maps.sourceCommit))}</code>${m.capturedAt?` · 그림 캡처 ${esc(fmtTime(m.capturedAt))}`:''}`});
}

// ---- 규칙 ----
function rulesPage(ctx){
  const list=ctx.policies.policies;const cats=[...new Set(list.map(p=>p.category||'일반'))];
  const row=p=>{const st=policyStatus(p.status);return `<li data-item data-cat="${esc(p.category||'일반')}" data-text="${esc([p.title,p.category,plainText(p.summary),plainText(p.body)].join(' ').toLowerCase())}"><a class="rule-row" href="/rules/${enc(p.id)}/"><span class="rule-main"><b>${esc(p.title)}</b><span>${esc(plainText(p.summary))}</span></span><span class="badge ${st[1]}">${esc(st[0])}</span>${icon('next',18)}</a></li>`};
  const body=`${pageHead('규칙',plainText(ctx.policies.summary))}
<div class="filters" data-filter-root data-noun="규칙">
${toolbar(searchBox('규칙 검색','규칙 제목·내용 검색'),`<div class="chips" role="group" aria-label="분류"><a href="/rules/" data-filter="cat" data-value="" aria-current="true">전체 <b>${list.length}</b></a>${cats.map(c=>`<a href="/rules/?cat=${enc(c)}" data-filter="cat" data-value="${esc(c)}">${esc(c)} <b>${list.filter(p=>(p.category||'일반')===c).length}</b></a>`).join('')}</div>`,`<div class="tool-end"><span class="result-count" data-count aria-live="polite">${list.length}건</span></div>`)}
</div>
${cats.map(c=>`<section class="rule-group" data-group><h2>${esc(c)}</h2><ul class="rule-list" data-list>${list.filter(p=>(p.category||'일반')===c).map(row).join('')}</ul></section>`).join('')}
<p class="empty" data-empty hidden>조건에 맞는 규칙이 없습니다.</p>`;
  return layout(ctx,{path:'/rules/',section:'rules',title:'규칙',description:`게임 규칙 ${list.length}건 — 설계 의도와 원본 문서 근거.`,body,footNote:`규칙 자료 ${esc(fmtTime(ctx.policies.updatedAt))} · 소스 <code>${esc(short(ctx.policies.sourceCommit))}</code> · 상태는 정책 결정 상태이며 적용·검증 완료를 뜻하지 않습니다`});
}
function ruleDetail(ctx,p,i,list){
  const st=policyStatus(p.status);const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/rules/${enc(x.id)}/`,label:x.title};
  const body=Array.isArray(p.body)?`<ul class="plain body-list">${p.body.map(x=>`<li>${esc(plainText(x))}</li>`).join('')}</ul>`:`<div class="prose"><p>${esc(plainText(p.body||p.content)||'상세 내용이 기록되지 않았습니다.')}</p></div>`;
  const refs=asList(p.sourceRefs).map(r=>`<li><code>${esc(typeof r==='string'?r:r.path||r.file||r.url||'')}</code>${typeof r==='object'&&r.section?`<span class="minor">${esc(r.section)}</span>`:''}</li>`).join('');
  const html=`${crumb('/rules/','규칙')}
${pageHead(p.title,plainText(p.summary),`<p class="eyebrow">${esc(p.category||'일반')}</p>`)}
<div class="badges-row"><span class="badge ${st[1]}">${esc(st[0])}</span><code class="id">${esc(p.id)}</code></div>
<section class="rule-body"><h2>내용</h2>${body}</section>
<section class="rule-body"><h2>근거</h2>${refs?`<ul class="refs">${refs}</ul>`:'<p class="minor">연결된 원본 경로 없음</p>'}</section>
${pager(link(prev),link(next),'규칙')}`;
  return layout(ctx,{path:`/rules/${encodeURIComponent(p.id)}/`,section:'rules',title:`규칙 · ${p.title}`,description:`${p.category||'규칙'} — ${plainText(p.summary)||p.title}`,body:html,footNote:`자료 기준 ${esc(fmtDay(p.updatedAt||ctx.policies.updatedAt))} · 소스 <code>${esc(short(p.sourceCommit||ctx.policies.sourceCommit))}</code> · 상태는 정책 결정 상태이며 적용·검증 완료를 뜻하지 않습니다`});
}

// ---- 기록 ----
function changelogPage(ctx){
  const {atlas}=ctx;const ch=atlas.changes||{};const ren=ch.renamed||[],ic=ch.iconChanged||[],add=ch.added||[],rem=ch.removed||[];
  const nameOf=id=>(atlas.skills.find(s=>s.id===id)||{}).name||id;
  const hasPage=id=>ctx.skillModel.mains.some(s=>s.id===id);   // 상세 쪽은 메인 스킬만 — 노드 이름 바뀜은 글자로 (11-03 노드 축 바꾸기)
  const rows=ctx.snapshots.map(s=>`<tr><th scope="row">${esc(s.type)}</th><td>${esc(fmtTime(s.date))}</td><td><code title="${esc(s.sourceCommit||'')}">${esc(short(s.sourceCommit))}</code></td><td>${esc(s.changes||'비교 자료 없음')}</td></tr>`).join('');
  const body=`${pageHead('기록','자료마다 만든 시각과 기준 게임 소스 커밋입니다. 배포 시각·자료 검수 시각·실제 게임 검증 기록과는 별개입니다.')}
<div class="table-wrap"><table class="table"><thead><tr><th scope="col">자료</th><th scope="col">만든 시각</th><th scope="col">소스 커밋</th><th scope="col">바뀐 수</th></tr></thead><tbody>${rows}</tbody></table></div>
${ch.previous?`<section class="log-section"><h2>스킬 묶음 변경</h2><p class="minor">직전 ${esc(ch.previous.createdAt)}(${esc(short(ch.previous.sourceCommit))}) → 이번 ${esc(atlas.createdAt)}(${esc(short(atlas.sourceCommit))})</p>
<div class="log-grid">
<div><h3>이름 바뀜 <span class="count">${ren.length}</span></h3>${ren.length?`<ul class="plain">${ren.map(r=>`<li>${hasPage(r.id)?`<a href="/skills/${enc(r.id)}/">${esc(r.to)}</a>`:esc(r.to)} <span class="minor">← ${esc(r.from)}${hasPage(r.id)?'':' · 노드'}</span></li>`).join('')}</ul>`:'<p class="minor">없음</p>'}</div>
<div><h3>아이콘 교체 <span class="count">${ic.length}</span></h3>${ic.length?`<ul class="plain">${ic.map(r=>`<li>${esc(nameOf(r.id))}</li>`).join('')}</ul>`:'<p class="minor">없음</p>'}<h3>신규 <span class="count">${add.length}</span></h3>${add.length?`<ul class="plain">${add.map(r=>`<li>${esc(r.name)}</li>`).join('')}</ul>`:'<p class="minor">없음</p>'}<h3>삭제 <span class="count">${rem.length}</span></h3>${rem.length?`<ul class="plain">${rem.map(r=>`<li>${esc(r.name)} <span class="minor">${esc(r.kind==='node'?'노드':'스킬')}</span></li>`).join('')}</ul>`:'<p class="minor">없음</p>'}</div>
</div></section>`:''}
<section class="log-section"><h2>이 사이트 빌드</h2><table class="spec"><tbody><tr><th scope="row">생성 시각</th><td>${esc(fmtTime(ctx.builtAt))}</td></tr><tr><th scope="row">웹 소스 커밋</th><td><code>${esc(short(ctx.webCommit))}</code></td></tr><tr><th scope="row">원본 목록</th><td><a href="/assets/catalog.json">스킬 목록 JSON</a> · <a href="/assets/audit-summary.json">대조 요약 JSON</a></td></tr></tbody></table></section>`;
  return layout(ctx,{path:'/changelog/',section:'changelog',title:'기록',description:'자료별 스냅샷 시각·소스 커밋과 스킬 묶음 변경 내역.',body});
}
// ---- 검수 자료실(npm run review): 끝난 작업의 실제 게임 캡처·실속도 영상 ----
// 사진은 미리보기(640) → 눌러서 크게(1600, site.js 확대 창) · 영상은 HTML5 video(내려받기 링크) · 표(CSV)·기록(README·MAKER-CHECK)은 글로
const rvMedia=v=>'/review/'+v;
const fmtBytes=n=>n>=1048576?`${(n/1048576).toFixed(1)}MB`:`${Math.max(1,Math.round(n/1024))}KB`;
const fmtSec=s=>`${Math.round(s)}초`;
const rvKind=k=>k==='reference'?['참고','old']:['완료','ok'];
const inlineMd=t=>esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
// 작은 마크다운: 제목 · 표 · 목록(- · 1.) · 문단 · **굵게** · `코드`
export function miniMarkdown(md){
  const lines=md.replace(/\r/g,'').split('\n');const out=[];let i=0;
  const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  while(i<lines.length){
    const l=lines[i];
    if(!l.trim()){i++;continue}
    const h=l.match(/^(#{1,6})\s+(.*)$/);if(h){const n=Math.min(6,h[1].length+2);out.push(`<h${n}>${inlineMd(h[2])}</h${n}>`);i++;continue}
    if(/^\s*\|/.test(l)&&/^\s*\|?\s*:?-{2,}/.test(lines[i+1]||'')){
      const head=cells(l);i+=2;const rows=[];while(i<lines.length&&/^\s*\|/.test(lines[i]))rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap"><table class="table"><thead><tr>${head.map(c=>`<th scope="col">${inlineMd(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${inlineMd(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue}
    if(/^\s*(?:[-*]|\d+\.)\s+/.test(l)){const ol=/^\s*\d+\./.test(l);const items=[];
      while(i<lines.length&&/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])){let t=lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/,'');while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i]))t+=' '+lines[i++].trim();items.push(t)}
      out.push(`<${ol?'ol':'ul'} class="rv-list">${items.map(t=>`<li>${inlineMd(t)}</li>`).join('')}</${ol?'ol':'ul'}>`);continue}
    if(/^-{3,}\s*$/.test(l)){out.push('<hr>');i++;continue}
    const para=[];while(i<lines.length&&lines[i].trim()&&!/^(#{1,6}\s|\s*\||\s*(?:[-*]|\d+\.)\s+|-{3,}\s*$)/.test(lines[i]))para.push(lines[i++].trim());
    if(para.length)out.push(`<p>${inlineMd(para.join(' '))}</p>`);else{out.push(`<p>${inlineMd(l)}</p>`);i++}
  }
  return out.join('\n');
}
function rvCard(it){
  const k=rvKind(it.kind);const c=it.cover;
  const media=c?`<img src="${esc(rvMedia(c.thumb))}" alt="${esc(it.title)} — ${esc(c.caption||'')}" loading="lazy" decoding="async">`:'<span class="thumb-empty">그림 없음</span>';
  const meta=`${fmtDay(it.date+'T12:00:00+09:00')} · 커밋 ${short(it.commit)} · 사진 ${it.counts.images}${it.counts.videos?` · 영상 ${it.counts.videos}`:''}`;
  return `<li>${tcard(`/review/${enc(it.id)}/`,media,it.title,meta,`<span class="rv-sum">${esc(it.summary)}</span><span class="badge ${k[1]}">${k[0]}</span>`)}</li>`;
}
function reviewPage(ctx){
  const r=ctx.review;const items=r?.items||[];
  const done=items.filter(i=>i.kind!=='reference'),ref=items.filter(i=>i.kind==='reference');
  const group=(t,l)=>l.length?`<section class="rv-group"><h2>${esc(t)} <span class="count">${l.length}</span></h2><ul class="map-grid rv-cards">${l.map(rvCard).join('')}</ul></section>`:'';
  const body=`${pageHead(r?.title||'검수 자료실',r?.lead||'끝난 작업의 실제 게임 캡처와 영상입니다.')}
${items.length?group('완료 항목',done)+group('참고',ref):'<div class="shot-empty">검수 자료가 아직 없습니다 · npm run review -- --game &lt;게임 체크아웃&gt;</div>'}`;
  const cover=items.find(i=>i.cover)?.cover;
  return layout(ctx,{path:'/review/',section:'review',title:r?.title||'검수 자료실',description:`끝난 작업 ${items.length}건의 실제 게임 캡처·실속도 영상.`,image:cover?rvMedia(cover.src):undefined,body,footNote:r?`검수 자료 생성 ${esc(fmtTime(r.createdAt))} · 게임 HEAD <code>${esc(short(r.gameHead))}</code> · 사진은 긴 변 1600px JPEG로 줄인 사본(원본 PNG는 게임 저장소)`:''});
}
function reviewDetail(ctx,it,i,list){
  const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/review/${enc(x.id)}/`,label:x.title};const k=rvKind(it.kind);
  const fig=(x,n)=>`<li><a class="rv-shot" href="${esc(rvMedia(x.src))}" data-lightbox="${esc(it.id)}" data-caption="${esc(x.caption)}"><img src="${esc(rvMedia(x.thumb))}" alt="${esc(x.caption)}" width="${Math.round(x.width*Math.min(1,640/Math.max(x.width,x.height)))}" height="${Math.round(x.height*Math.min(1,640/Math.max(x.width,x.height)))}"${n>3?' loading="lazy"':''} decoding="async"></a><span class="rv-cap">${esc(x.caption)}</span></li>`;
  const vid=v=>`<figure class="rv-video"><video controls preload="metadata" playsinline poster="${esc(rvMedia(v.poster))}" width="${v.width}" height="${v.height}"><source src="${esc(rvMedia(v.src))}" type="video/mp4"></video><figcaption><span>${esc(v.caption)}</span><span class="minor">${fmtSec(v.duration)} · ${v.width}×${v.height} · ${fmtBytes(v.bytes)}${v.reencoded?` · ${esc(v.reencoded)} 재인코딩(원본 ${fmtBytes(v.originalBytes)})`:''} · <a class="text-link" href="${esc(rvMedia(v.src))}" download>내려받기</a></span><code>${esc(it.folder+v.source)}</code></figcaption></figure>`;
  const table=t=>`<p class="minor"><code>${esc(it.folder+t.source)}</code> · ${t.rows.length}줄</p><div class="table-wrap"><table class="table rv-table"><thead><tr>${t.header.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const note=n=>`<details class="rv-note"${n.format==='md'?' open':''}><summary><code>${esc(it.folder+n.source)}</code></summary>${n.format==='md'?`<div class="rv-md">${miniMarkdown(n.text)}</div>`:`<pre class="rv-pre">${esc(n.text)}</pre>`}</details>`;
  let n=0;
  const secs=it.sections.map(s=>`<section class="rv-section"><h2>${esc(s.title)}${s.images.length?` <span class="count">${s.images.length}</span>`:''}</h2>${s.lead?`<p class="minor">${esc(s.lead)}</p>`:''}
${s.videos.length?`<div class="rv-videos">${s.videos.map(vid).join('')}</div>`:''}${s.images.length?`<ul class="rv-grid">${s.images.map(x=>fig(x,n++)).join('')}</ul>`:''}${s.tables.map(table).join('')}${s.notes.map(note).join('')}</section>`).join('\n');
  const rows=[['날짜',fmtDay(it.date+'T12:00:00+09:00')],['게임 커밋',`<code title="${esc(it.commit)}">${esc(short(it.commit))}</code>`],['자료 폴더',`<code>${esc(it.folder)}</code> <span class="minor">(게임 저장소)</span>`],['사진 · 영상',`${it.counts.images}장 · ${it.counts.videos}개`]];
  const body=`${crumb('/review/','검수 자료실')}
${pageHead(it.title,it.summary,`<p class="eyebrow">${esc(fmtDay(it.date+'T12:00:00+09:00'))} · <span class="badge ${k[1]}">${k[0]}</span></p>`)}
<table class="spec rv-spec"><tbody>${rows.map(([a,b])=>`<tr><th scope="row">${esc(a)}</th><td>${b}</td></tr>`).join('')}</tbody></table>
${secs}
${pager(link(prev),link(next),'항목')}
<dialog class="rv-lightbox" aria-label="크게 보기"><div class="dialog-top"><h2 data-lb-cap></h2><span class="minor" data-lb-n></span><button type="button" data-lb-prev aria-label="이전 사진">${icon('prev',20)}</button><button type="button" data-lb-next aria-label="다음 사진">${icon('next',20)}</button><button type="button" data-lb-close aria-label="닫기">${icon('close',20)}</button></div><img data-lb-img alt=""></dialog>`;
  return layout(ctx,{path:`/review/${encodeURIComponent(it.id)}/`,section:'review',title:`검수 · ${it.title}`,description:`${fmtDay(it.date+'T12:00:00+09:00')} ${it.title} — ${it.summary}`,image:it.cover?rvMedia(it.cover.src):undefined,body,footNote:`검수 자료 생성 ${esc(fmtTime(ctx.review.createdAt))} · 게임 커밋 <code>${esc(short(it.commit))}</code> · 자료 폴더 <code>${esc(it.folder)}</code> · 사진은 긴 변 1600px JPEG 사본`});
}
function notFoundPage(ctx){
  const body=`<section class="not-found"><h1>없는 주소입니다</h1><p class="lead">주소가 바뀌었거나 지워졌을 수 있습니다.</p><ul class="nf-links">${NAV.map(([href,label])=>`<li><a class="card" href="${href}">${esc(label)}${icon('next',16)}</a></li>`).join('')}</ul></section>`;
  return layout(ctx,{path:'/404.html',section:'',title:'없는 주소',description:'찾는 주소가 없습니다.',body});
}

export function renderSite(ctx){
  const pages=[];const add=(p,html)=>pages.push({path:p,html});
  ctx.mapList=ctx.maps.maps.map(mapView);
  ctx.skillModel=ctx.views.skvModel(ctx.atlasView);
  add('/',homePage(ctx));
  add('/skills/',skillsAudit(ctx,'audit'));
  add('/skills/icons/',skillsAudit(ctx,'icons'));
  add('/skills/fx/',skillsGrid(ctx,'fx'));
  add('/skills/summons/',skillsGrid(ctx,'summon'));
  add('/skills/pick/',skillsPick(ctx));
  const mains=ctx.skillModel.mains;mains.forEach((s,i)=>add(`/skills/${encodeURIComponent(s.id)}/`,skillDetail(ctx,s,i,mains)));
  add('/maps/',mapsPage(ctx));
  ctx.mapList.forEach((m,i,l)=>add(`/maps/${encodeURIComponent(m.id)}/`,mapDetail(ctx,m,i,l)));
  add('/rules/',rulesPage(ctx));
  ctx.policies.policies.forEach((p,i,l)=>add(`/rules/${encodeURIComponent(p.id)}/`,ruleDetail(ctx,p,i,l)));
  add('/review/',reviewPage(ctx));
  (ctx.review?.items||[]).forEach((it,i,l)=>add(`/review/${encodeURIComponent(it.id)}/`,reviewDetail(ctx,it,i,l)));
  add('/changelog/',changelogPage(ctx));
  add('/404.html',notFoundPage(ctx));
  return pages;
}
