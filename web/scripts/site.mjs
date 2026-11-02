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
};
export function icon(name,size=20,label='') {
  return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"'}>${PATHS[name]}</svg>`;
}
export const FAVICON=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#27271e" stroke="#7c7055" stroke-width="2"/><text x="32" y="41" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="25" font-weight="600" fill="#e4bb75">C·K</text></svg>\n`;

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
const NAV=[['/','홈','home'],['/skills/','스킬','skills'],['/maps/','맵','maps'],['/rules/','규칙','rules'],['/changelog/','기록','changelog']];
function layout(ctx,{path:p,section,title,description,image,body,bodyAttrs='',scripts='',head=''}){
  const full=p==='/'?`${SITE_NAME} — 개발 자료실`:`${title} — ${SITE_NAME}`;
  const og=image?(/^https?:/.test(image)?image:ORIGIN+image):ORIGIN+'/img/hero-wasteland.webp';
  const canonical=ORIGIN+(p==='/404.html'?'/':p);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#111412">
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
<a class="logo" href="/"${p==='/'?' aria-current="page"':''}><span class="logo-ko">${SITE_NAME}</span><span class="logo-en">${SITE_NAME_EN}</span></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">${icon('menu',22)}<span class="sr-only">메뉴</span></button>
<nav id="site-nav" class="site-nav" aria-label="주 메뉴">${NAV.map(([href,label,key])=>`<a href="${href}"${key===section?' class="active"':''}${href===p?' aria-current="page"':''}>${label}</a>`).join('')}</nav>
<span class="header-snap">스냅샷 ${esc(fmtShort(ctx.latest))}</span>
</div></header>
<main id="main" tabindex="-1"><div class="wrap">
${body}
</div></main>
<footer class="site-footer"><div class="wrap footer-row">
<span>스냅샷 커밋 <code>${esc(short(ctx.atlas.sourceCommit))}</code> · 생성 ${esc(fmtTime(ctx.builtAt))}</span>
<span>원본 PNG 재생, 실제 녹화 아님</span>
<span>개발명 잡으면 내편</span>
</div></footer>
<script src="${ctx.asset('/site.js')}" defer></script>
${scripts}</body>
</html>
`;
}
const pageHead=(title,lead,extra='')=>`<header class="page-head">${extra}<h1>${esc(title)}</h1>${lead?`<p class="lead">${esc(lead)}</p>`:''}</header>`;
const crumb=(href,label)=>`<nav class="crumb" aria-label="위치"><a href="${href}">${icon('prev',16)}${esc(label)}</a></nav>`;
const pager=(prev,next,noun)=>`<nav class="pager" aria-label="이전·다음 ${noun}">${prev?`<a class="pager-prev" rel="prev" href="${prev.href}">${icon('prev',18)}<span><small>이전 ${noun}</small>${esc(prev.label)}</span></a>`:'<span></span>'}${next?`<a class="pager-next" rel="next" href="${next.href}"><span><small>다음 ${noun}</small>${esc(next.label)}</span>${icon('next',18)}</a>`:'<span></span>'}</nav>`;
const searchBox=(label,placeholder,id='q')=>`<label class="search">${icon('search',18)}<input id="${id}" name="q" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(label)}" autocomplete="off"></label>`;

// ---- 홈 ----
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
  const hero=ctx.hero;
  const cards=[
    ['/skills/','skills','스킬',`메인 스킬 ${mains} · 강화 노드 ${nodes}`,'트리별 대조표 · 효과 재생 · 아이콘'],
    ['/maps/','maps','맵',`등록 ${maps.maps.length} · 기본 맵 ${base} · 심도 ${depth}`,'액트별 전체맵 캡처와 제원'],
    ['/rules/','rules','규칙',`${policies.policies.length}건 · 승인 ${approved}`,'설계 문서에서 확인한 규칙과 근거'],
  ];
  const snaps=[['스킬',atlas.createdAt,atlas.sourceCommit],['맵',maps.updatedAt,maps.sourceCommit],['규칙',policies.updatedAt,policies.sourceCommit]];
  const body=`<section class="home-hero" aria-labelledby="home-title">
<div class="home-intro"><h1 id="home-title">${SITE_NAME}</h1><p class="lead">${esc(lead)}</p></div>
<figure class="hero-shot"><img src="${esc(hero.src)}" width="1600" height="720" alt="${esc(hero.alt)}" fetchpriority="high" decoding="async"><figcaption>${esc(hero.caption)}</figcaption></figure>
</section>
<section class="entries" aria-label="둘러보기">${cards.map(([href,ic,t,count,line])=>`<a class="card entry" href="${href}"><span class="entry-icon">${icon(ic,22)}</span><h2>${t}</h2><p class="entry-count">${esc(count)}</p><p class="entry-line">${esc(line)}</p><span class="entry-more">보기${icon('next',16)}</span></a>`).join('')}</section>
<section class="snapline" aria-labelledby="snap-title"><h2 id="snap-title">최신 스냅샷</h2><ul>${snaps.map(([t,d,c])=>`<li><span>${t}</span><b>${esc(fmtDay(d))}</b><code>${esc(short(c))}</code></li>`).join('')}</ul><a class="text-link" href="/changelog/">기록 전체${icon('next',16)}</a></section>
${changes.length?`<section class="changes" aria-labelledby="chg-title"><h2 id="chg-title">바뀐 것</h2><ul>${changes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="minor">직전 스킬 묶음 ${esc(prev.createdAt)}(${esc(short(prev.sourceCommit))}) 대비 · 맵·규칙은 비교 자료 없음</p></section>`:''}`;
  return layout(ctx,{path:'/',section:'home',title:SITE_NAME,description:`${SITE_NAME} 개발 자료실 — 스킬 ${mains}개·맵 ${maps.maps.length}개·규칙 ${policies.policies.length}건과 스냅샷 기준 시점.`,image:hero.og,body});
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
const PLAYBACK=`<button id="playAll" type="button" aria-pressed="true">전체 일시정지</button><label class="select-label">속도<select id="speed"><option value="0.5">0.5×</option><option selected value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label class="select-label">배경<select id="background"><option value="dark">어둡게</option><option value="mid">중간</option><option value="light">밝게</option></select></label>`;
function skillScripts(ctx){return `<script src="${ctx.asset('/skills/app.js')}" defer></script>\n`}
function skillsAudit(ctx,kind){
  const V=ctx.views;const M=V.skvModel(ctx.atlasView);
  const html=kind==='icons'
    ?`<div class="skv">${V.skvBar(M,'icons')}${V.skvStamp(ctx.atlasView,M)}<p class="minor">104px = 스킬 창 초상 · 60px = 스킬 지정 창 · 40px = 핫바 칸(어두운 칸 위). 메인 다음에 그 노드가 이어집니다.</p><div class="skv-list skv-icons skv-size-${V.SKV.size}">${V.skvIconList(M).html}</div></div>`
    :`<div class="skv">${V.skvBar(M,'audit')}${V.skvStamp(ctx.atlasView,M)}<div class="skv-list">${V.skvAuditList(ctx.atlasView,M).html}</div></div>`;
  const count=kind==='icons'?`메인 스킬 ${M.mains.length}개와 그 노드 아이콘 · 전체 ${ctx.atlas.skills.length}개`:`메인 스킬 ${M.mains.length}개 · 전체 ${ctx.atlas.skills.length}개(강화 노드 포함) 대조`;
  const body=`${skillsHead(ctx,kind)}
<p class="status-line"><span id="count" aria-live="polite">${esc(count)}</span><span class="minor">${kind==='icons'?'아이콘을 누르면 크게 보기':'스킬 이름을 누르면 상세 · 효과를 누르면 프레임 재생'}</span></p>
<div id="skv-root" data-skv="${kind}">${html}</div>
${DETAIL_DIALOG}`;
  const p=kind==='icons'?'/skills/icons/':'/skills/';
  return layout(ctx,{path:p,section:'skills',title:kind==='icons'?'스킬 · 아이콘':'스킬 · 대조표',description:kind==='icons'?`스킬·강화 노드 아이콘 ${ctx.atlas.skills.length}개를 스킬 창·지정 창·핫바 크기로 비교.`:`메인 스킬 ${M.mains.length}개를 트리별 카드로 — 강화 노드, 효과 연결, 직전 묶음 대비 변경 표시.`,body,bodyAttrs:` data-view="${kind}" data-skills="${ctx.asset('/skills/data/skills.json')}"`,scripts:skillScripts(ctx)});
}
function skillsGrid(ctx,kind){
  const V=ctx.views;const cat=kind==='summon'?'summon':'fx';const all=ctx.atlasView.groups.filter(g=>g.category===cat);const shown=all.filter(g=>V.groupScope(g,'current'));
  const p=kind==='summon'?'/skills/summons/':'/skills/fx/';
  const body=`${skillsHead(ctx,kind)}
<div class="toolbar"><div class="toolbar-inner">${searchBox('스킬·효과 이름 검색','스킬·효과 이름 검색','search')}<label class="select-label">보기<select id="scope"><option value="current">현재 연결 + 최신 제작</option><option value="all">이전 버전 포함 전체</option><option value="connected">코드 연결 확인</option><option value="pending">제작·검토 후보</option></select></label>${PLAYBACK}</div></div>
<p class="status-line"><span id="count" aria-live="polite">${shown.length}개 묶음 표시 · 총 ${all.length}개</span><span class="minor">카드를 누르면 크게 보기 · 프레임별 확인</span></p>
<div class="grid" id="grid">${shown.map(V.groupCard).join('')}</div>
<p class="minor notice">원본 PNG를 연결한 오프라인 미리보기입니다. 각 카드에 맞춰 확대하므로 실게임 크기 비율과는 다릅니다. 「코드 연결」은 소스에서 확인한 상태이며 실제 플레이 검수 판정과는 별개입니다. 프레임 보간·새 그림 생성 없이 원본 순서대로 재생하고, 확인되지 않은 속도는 검수용 100ms/장으로 표시합니다. ${esc(ctx.atlas.createdAt)} 기준 · 정본 ${esc(short(ctx.atlas.sourceCommit))}.</p>
${DETAIL_DIALOG}`;
  return layout(ctx,{path:p,section:'skills',title:kind==='summon'?'스킬 · 거인·소환물':'스킬 · 효과',description:kind==='summon'?`거인·소환물 동작 ${shown.length}묶음을 원본 프레임으로 재생.`:`스킬 효과 ${shown.length}묶음을 원본 프레임 순서대로 재생.`,body,bodyAttrs:` data-view="${kind}" data-src="${ctx.asset(kind==='summon'?'/skills/data/summons.json':'/skills/data/fx.json')}"`,scripts:skillScripts(ctx)});
}
function skillsPick(ctx){
  const {slots,scene,reco,atlas}=ctx;
  const body=`${skillsHead(ctx,'pick')}
<div class="toolbar"><div class="toolbar-inner">${searchBox('자리·후보 검색','자리·후보 이름·RUID 검색','search')}${PLAYBACK}</div></div>
<p class="status-line"><span id="count" aria-live="polite">${slots?`효과 자리 ${slots.counts?.slots??slots.slots.length}곳`:'효과 자리 비교 자료 없음'}</span><span class="minor">이 브라우저에만 저장됩니다</span></p>
<div class="pick" id="grid">${slots?'<p class="minor">자리 목록을 그리는 중…</p>':'<div class="empty">효과 자리 비교 자료가 이 배포에 없습니다.</div>'}</div>
${DETAIL_DIALOG}${EXPORT_DIALOG}
${embed('catalog-data',{createdAt:atlas.createdAt,sourceCommit:atlas.sourceCommit,summary:atlas.summary,skills:[],groups:[],engineEffects:[],proceduralEffects:[]})}
${embed('slots-data',ctx.slotsView)}
${embed('scene-data',scene)}
${embed('reco-data',ctx.recoView)}`;
  return layout(ctx,{path:'/skills/pick/',section:'skills',title:'스킬 · 효과 고르기',description:'스킬 효과 자리마다 지금 그림·코덱스 FX·메이플 클립을 나란히 보고 고르는 화면.',body,bodyAttrs:' data-view="pick"',scripts:skillScripts(ctx)});
}
function skillDetail(ctx,s,i,list){
  const V=ctx.views;const M=ctx.skillModel;
  const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/skills/${enc(x.id)}/`,label:x.name};
  const body=`${crumb('/skills/','스킬 대조표')}
${V.skvDetail(ctx.atlasView,M,s)}
${pager(link(prev),link(next),'스킬')}
${DETAIL_DIALOG}`;
  const nodes=(M.nodesOf.get(s.id)||[]).length;
  return layout(ctx,{path:`/skills/${encodeURIComponent(s.id)}/`,section:'skills',title:`스킬 · ${s.name}`,description:`${s.name}(${s.kindLabel||s.kind}) — ${plainText(s.desc).slice(0,110)}${nodes?` · 강화 노드 ${nodes}개`:''}`,image:s.icon?'/assets/'+s.icon:undefined,body,bodyAttrs:` data-view="skill" data-skills="${ctx.asset('/skills/data/skills.json')}"`,scripts:skillScripts(ctx)});
}

// ---- 맵 ----
function mapCard(m){
  const meta=[m.level,m.size?`${m.size.width}×${m.size.height}칸`:''].filter(Boolean).join(' · ');
  const text=[m.fullName,m.id,actName(m.act),m.role].join(' ').toLowerCase();
  return `<li data-item data-act="${esc(m.act)}" data-role="${esc(m.role||'')}" data-text="${esc(text)}"><a class="card map-card" href="/maps/${enc(m.id)}/"><span class="thumb">${m.thumb?`<img src="${esc(m.thumb)}" alt="" loading="lazy" decoding="async">`:`<span class="thumb-empty">이미지 없음</span>`}</span><span class="map-card-body"><span class="eyebrow">${esc(actName(m.act))} · ${esc(m.role||'역할 미기록')}</span><span class="map-card-title">${esc(m.displayName)}</span>${meta?`<span class="meta">${esc(meta)}</span>`:''}<span class="badge ${mapStatusTone(m.status)}">${esc(m.status||'상태 미기록')}</span></span></a></li>`;
}
function mapsPage(ctx){
  const list=ctx.mapList;const acts=[...new Set(list.map(m=>String(m.act)))];const roles=[...new Set(list.map(m=>m.role).filter(Boolean))];
  const sum=ctx.maps.summary||{};const lead=plainText(sum)||'맵의 전체 캡처와 제원.';
  const body=`${pageHead('맵',lead)}
<div class="filters" data-filter-root data-noun="맵">
<nav class="seg" aria-label="액트"><a href="/maps/" data-filter="act" data-value="" aria-current="true">전체 <b>${list.length}</b></a>${acts.map(a=>`<a href="/maps/?act=${enc(a)}" data-filter="act" data-value="${esc(a)}">${esc(actName(a))} <b>${list.filter(m=>String(m.act)===a).length}</b></a>`).join('')}</nav>
<div class="chips" role="group" aria-label="역할"><a href="/maps/" data-filter="role" data-value="" aria-current="true">모든 역할</a>${roles.map(r=>`<a href="/maps/?role=${enc(r)}" data-filter="role" data-value="${esc(r)}">${esc(r)} <b>${list.filter(m=>m.role===r).length}</b></a>`).join('')}</div>
<div class="filter-row">${searchBox('맵 검색','맵 이름·id 검색')}<span class="result-count" data-count aria-live="polite">${list.length}개 맵</span></div>
</div>
${sum.scopeNote?`<p class="minor note">${esc(sum.scopeNote)}</p>`:''}
<ul class="map-grid" data-list>${list.map(mapCard).join('')}</ul>
<p class="empty" data-empty hidden>조건에 맞는 맵이 없습니다.</p>`;
  return layout(ctx,{path:'/maps/',section:'maps',title:'맵',description:`등록 맵 ${list.length}개 — 액트·역할별 전체맵 캡처와 제원.`,image:list.find(m=>m.overview)?.overview,body});
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
  const shots=m.shots;
  const view=shots.length?`<section class="map-view" data-shots aria-label="맵 그림">${shots.length>1?`<div class="seg seg-buttons" role="group" aria-label="그림 고르기">${shots.map((s,k)=>`<button type="button" data-shot="${k}" aria-pressed="${k===0}">${esc(s.label?s.label.split(' · ')[0]:kindLabel(s.kind))}</button>`).join('')}</div>`:''}${shots.map((s,k)=>`<figure class="shot" data-shot-panel="${k}"${k?' hidden':''}><img src="${esc(mapImg(s))}" alt="${esc(m.displayName)} — ${esc(s.label||kindLabel(s.kind))}" ${k?'loading="lazy" ':''}decoding="async"><figcaption>${esc(s.label||kindLabel(s.kind))}</figcaption></figure>`).join('')}</section>`
    :`<section class="map-view"><div class="shot-empty">이 맵의 그림은 아직 등록되지 않았습니다 · ${esc(m.status||'')}</div></section>`;
  const refs=asList(m.sourceRefs).map(r=>`<li><code>${esc(typeof r==='string'?r:r.path||r.file||'')}</code>${typeof r==='object'&&r.section?` <span class="minor">${esc(r.section)}</span>`:''}</li>`).join('');
  const body=`${crumb(`/maps/?act=${enc(m.act)}`,`맵 · ${actName(m.act)}`)}
${pageHead(m.displayName,m.description||'',`<p class="eyebrow">${esc(actName(m.act))} · ${esc(m.role||'')}</p>`)}
${view}
<div class="detail-grid">
<section><h2>제원</h2><table class="spec"><tbody>${rows.map(([k,v])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>${m.designReason?`<p class="minor">${esc(m.designReason)}</p>`:''}</section>
<section>${asList(m.spaces).length?`<h2>공간</h2><ul class="plain">${m.spaces.map(s=>`<li><b>${esc(s.name)}</b> <span class="minor">${esc(s.role||'')}</span></li>`).join('')}</ul>`:''}<h2>노트</h2>${asList(m.notes).length?`<ul class="plain">${m.notes.map(n=>`<li>${esc(plainText(n))}</li>`).join('')}</ul>`:'<p class="minor">기록된 노트 없음</p>'}<h2>원본 자료</h2>${refs?`<ul class="refs">${refs}</ul>`:'<p class="minor">연결된 원본 경로 없음</p>'}<p class="minor">자료 기준 ${esc(fmtDay(ctx.maps.updatedAt))} · 소스 ${esc(short(ctx.maps.sourceCommit))}</p></section>
</div>
${pager(link(prev),link(next),'맵')}`;
  return layout(ctx,{path:`/maps/${encodeURIComponent(m.id)}/`,section:'maps',title:`맵 · ${m.displayName}`,description:`${actName(m.act)} ${m.role||''} ${m.displayName}${m.level?` (${m.level})`:''} — ${m.description||m.status||''}`.trim(),image:m.overview||undefined,body});
}

// ---- 규칙 ----
function rulesPage(ctx){
  const list=ctx.policies.policies;const cats=[...new Set(list.map(p=>p.category||'일반'))];
  const row=p=>{const st=policyStatus(p.status);return `<li data-item data-cat="${esc(p.category||'일반')}" data-text="${esc([p.title,p.category,plainText(p.summary),plainText(p.body)].join(' ').toLowerCase())}"><a class="rule-row" href="/rules/${enc(p.id)}/"><span class="rule-main"><b>${esc(p.title)}</b><span>${esc(plainText(p.summary))}</span></span><span class="badge ${st[1]}">${esc(st[0])}</span>${icon('next',18)}</a></li>`};
  const body=`${pageHead('규칙',plainText(ctx.policies.summary))}
<div class="filters" data-filter-root data-noun="규칙">
<div class="chips" role="group" aria-label="분류"><a href="/rules/" data-filter="cat" data-value="" aria-current="true">전체 <b>${list.length}</b></a>${cats.map(c=>`<a href="/rules/?cat=${enc(c)}" data-filter="cat" data-value="${esc(c)}">${esc(c)} <b>${list.filter(p=>(p.category||'일반')===c).length}</b></a>`).join('')}</div>
<div class="filter-row">${searchBox('규칙 검색','규칙 제목·내용 검색')}<span class="result-count" data-count aria-live="polite">${list.length}건</span></div>
</div>
${cats.map(c=>`<section class="rule-group" data-group><h2>${esc(c)}</h2><ul class="rule-list" data-list>${list.filter(p=>(p.category||'일반')===c).map(row).join('')}</ul></section>`).join('')}
<p class="empty" data-empty hidden>조건에 맞는 규칙이 없습니다.</p>`;
  return layout(ctx,{path:'/rules/',section:'rules',title:'규칙',description:`게임 규칙 ${list.length}건 — 설계 의도와 원본 문서 근거.`,body});
}
function ruleDetail(ctx,p,i,list){
  const st=policyStatus(p.status);const prev=list[i-1],next=list[i+1];const link=x=>x&&{href:`/rules/${enc(x.id)}/`,label:x.title};
  const body=Array.isArray(p.body)?`<ul class="plain body-list">${p.body.map(x=>`<li>${esc(plainText(x))}</li>`).join('')}</ul>`:`<div class="prose"><p>${esc(plainText(p.body||p.content)||'상세 내용이 기록되지 않았습니다.')}</p></div>`;
  const refs=asList(p.sourceRefs).map(r=>`<li><code>${esc(typeof r==='string'?r:r.path||r.file||r.url||'')}</code>${typeof r==='object'&&r.section?`<span class="minor">${esc(r.section)}</span>`:''}</li>`).join('');
  const html=`${crumb('/rules/','규칙')}
${pageHead(p.title,plainText(p.summary),`<p class="eyebrow">${esc(p.category||'일반')}</p>`)}
<div class="badges-row"><span class="badge ${st[1]}">${esc(st[0])}</span><code class="id">${esc(p.id)}</code></div>
<section class="rule-body"><h2>내용</h2>${body}</section>
<section class="rule-body"><h2>근거</h2>${refs?`<ul class="refs">${refs}</ul>`:'<p class="minor">연결된 원본 경로 없음</p>'}<p class="minor">상태는 정책 결정 상태이며 적용·검증 완료를 뜻하지 않습니다 · 자료 기준 ${esc(fmtDay(p.updatedAt||ctx.policies.updatedAt))} · 소스 ${esc(short(p.sourceCommit||ctx.policies.sourceCommit))}</p></section>
${pager(link(prev),link(next),'규칙')}`;
  return layout(ctx,{path:`/rules/${encodeURIComponent(p.id)}/`,section:'rules',title:`규칙 · ${p.title}`,description:`${p.category||'규칙'} — ${plainText(p.summary)||p.title}`,body:html});
}

// ---- 기록 ----
function changelogPage(ctx){
  const {atlas}=ctx;const ch=atlas.changes||{};const ren=ch.renamed||[],ic=ch.iconChanged||[],add=ch.added||[],rem=ch.removed||[];
  const nameOf=id=>(atlas.skills.find(s=>s.id===id)||{}).name||id;
  const rows=ctx.snapshots.map(s=>`<tr><th scope="row">${esc(s.type)}</th><td>${esc(fmtTime(s.date))}</td><td><code title="${esc(s.sourceCommit||'')}">${esc(short(s.sourceCommit))}</code></td><td>${esc(s.changes||'비교 자료 없음')}</td></tr>`).join('');
  const body=`${pageHead('기록','자료마다 만든 시각과 기준 게임 소스 커밋입니다. 배포 시각·자료 검수 시각·실제 게임 검증 기록과는 별개입니다.')}
<div class="table-wrap"><table class="table"><thead><tr><th scope="col">자료</th><th scope="col">만든 시각</th><th scope="col">소스 커밋</th><th scope="col">바뀐 수</th></tr></thead><tbody>${rows}</tbody></table></div>
${ch.previous?`<section class="log-section"><h2>스킬 묶음 변경</h2><p class="minor">직전 ${esc(ch.previous.createdAt)}(${esc(short(ch.previous.sourceCommit))}) → 이번 ${esc(atlas.createdAt)}(${esc(short(atlas.sourceCommit))})</p>
<div class="log-grid">
<div><h3>이름 바뀜 <span class="count">${ren.length}</span></h3>${ren.length?`<ul class="plain">${ren.map(r=>`<li><a href="/skills/${enc(r.id)}/">${esc(r.to)}</a> <span class="minor">← ${esc(r.from)}</span></li>`).join('')}</ul>`:'<p class="minor">없음</p>'}</div>
<div><h3>아이콘 교체 <span class="count">${ic.length}</span></h3>${ic.length?`<ul class="plain">${ic.map(r=>`<li>${esc(nameOf(r.id))}</li>`).join('')}</ul>`:'<p class="minor">없음</p>'}<h3>신규 <span class="count">${add.length}</span></h3>${add.length?`<ul class="plain">${add.map(r=>`<li>${esc(r.name)}</li>`).join('')}</ul>`:'<p class="minor">없음</p>'}<h3>삭제 <span class="count">${rem.length}</span></h3>${rem.length?`<ul class="plain">${rem.map(r=>`<li>${esc(r.name)} <span class="minor">${esc(r.kind==='node'?'노드':'스킬')}</span></li>`).join('')}</ul>`:'<p class="minor">없음</p>'}</div>
</div></section>`:''}
<section class="log-section"><h2>이 사이트 빌드</h2><table class="spec"><tbody><tr><th scope="row">생성 시각</th><td>${esc(fmtTime(ctx.builtAt))}</td></tr><tr><th scope="row">웹 소스 커밋</th><td><code>${esc(short(ctx.webCommit))}</code></td></tr><tr><th scope="row">원본 목록</th><td><a href="/assets/catalog.json">스킬 목록 JSON</a> · <a href="/assets/audit-summary.json">대조 요약 JSON</a></td></tr></tbody></table></section>`;
  return layout(ctx,{path:'/changelog/',section:'changelog',title:'기록',description:'자료별 스냅샷 시각·소스 커밋과 스킬 묶음 변경 내역.',body});
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
  add('/changelog/',changelogPage(ctx));
  add('/404.html',notFoundPage(ctx));
  return pages;
}
