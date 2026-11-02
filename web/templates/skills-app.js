// /skills/ 아래 화면들의 브라우저 동작. 앞에 templates/skills-views.js(공용 조각 · esc)가 붙어 /skills/app.js 한 파일이 된다.
// 화면 = <body data-view>: audit(대조표) · icons · skill(상세) · fx · summon · pick. 해시 대신 하위 경로와 ?view= 쿼리를 쓴다.
const $=s=>document.querySelector(s);
const ICON_CHECK='<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
function readJSONBlock(id){try{const el=document.getElementById(id);return el?JSON.parse(el.textContent||'null'):null}catch(e){return null}}
let DATA=readJSONBlock('catalog-data')||{createdAt:'',sourceCommit:'',summary:{},skills:[],groups:[],engineEffects:[],proceduralEffects:[]};
let SLOTS=readJSONBlock('slots-data');
const PICK_KEY='ckl.effectPicks.v1';const PICK={view:'current',group:'',slot:null,picks:{}};
function loadPicks(){try{const raw=typeof localStorage!=='undefined'?localStorage.getItem(PICK_KEY):null;const v=raw?JSON.parse(raw):{};PICK.picks=v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){PICK.picks={}}}
function savePicks(){try{if(typeof localStorage!=='undefined')localStorage.setItem(PICK_KEY,JSON.stringify(PICK.picks))}catch(e){}}
const STATE={tab:'fx',query:'',scope:'current',play:!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches),speed:1,time:0,last:performance.now(),visible:new Set(),players:[],detail:null};
const CACHE=new Map();function img(src){if(!CACHE.has(src)){const i=new Image();i.src=src;CACHE.set(src,i)}return CACHE.get(src)}
function drawBox(canvas,g,n){if(!canvas.width)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);const im=img(g.frames[n]);if(!im.complete||!im.naturalWidth){ctx.fillStyle='#aab4c4';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('불러오는 중',canvas.width/2,canvas.height/2);return}const W=g.box[0]||im.naturalWidth,H=g.box[1]||im.naturalHeight;const o=(g.offsets&&g.offsets[n])||[(W-im.naturalWidth)/2,(H-im.naturalHeight)/2];const s=Math.min((canvas.width-24)/W,(canvas.height-20)/H,6);ctx.imageSmoothingEnabled=false;const x0=(canvas.width-W*s)/2,y0=(canvas.height-H*s)/2;ctx.drawImage(im,x0+o[0]*s,y0+o[1]*s,im.naturalWidth*s,im.naturalHeight*s)}
function draw(canvas,g,n){if(g.box&&!g.crop)return drawBox(canvas,g,n);if(!canvas.width)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);const im=img(g.frames[n]);if(!im.complete||!im.naturalWidth){ctx.fillStyle='#aab4c4';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('불러오는 중',canvas.width/2,canvas.height/2);return}let b=g.bounds||g.crop||[0,0,im.naturalWidth,im.naturalHeight];let w=b[2]-b[0],h=b[3]-b[1];const scale=Math.min((canvas.width-28)/w,(canvas.height-22)/h,g.category==='icons'?2.2:8);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,b[0],b[1],w,h,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale)}
function frameAt(g,t){if(g.frames.length<2)return 0;const total=g.durations.reduce((a,b)=>a+b,0);let p=t%(total+(g.loop?0:650));if(p>=total)return g.frames.length-1;for(let n=0;n<g.durations.length;n++){p-=g.durations[n];if(p<0)return n}return 0}
function matches(g){const q=STATE.query.toLowerCase();if(q&&!`${g.title} ${g.id} ${g.skillNames||''} ${g.resourceKeys||''}`.toLowerCase().includes(q))return false;return groupScope(g,STATE.scope)}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{const p=STATE.players.find(p=>p.el===e.target);if(p){p.visible=e.isIntersecting;if(p.visible)p.g.frames.forEach(img);if(p.release){if(p.visible&&!p.canvas.width){p.canvas.width=p.scene?SC.W:420;p.canvas.height=p.scene?SC.H:270;p.last=-1}else if(!p.visible&&p.canvas.width){p.canvas.width=0;p.canvas.height=0}}}}),{rootMargin:'160px'});
function render(){observer.disconnect();STATE.players=[];const grid=$('#grid');if(!grid)return;if(STATE.tab==='pick'){grid.className='pick';renderPick();return}grid.className='grid';const all=DATA.groups.filter(g=>g.category===STATE.tab);const groups=all.filter(matches);const cnt=$('#count');if(cnt)cnt.textContent=`${groups.length}개 묶음 표시 · 총 ${all.length}개`;grid.innerHTML=groups.map(groupCard).join('')||'<div class="empty">해당 조건의 에셋이 없습니다.</div>';grid.querySelectorAll('.card').forEach((el,i)=>{const p={el,g:groups[i],canvas:el.querySelector('canvas'),visible:false,last:-1};STATE.players.push(p);observer.observe(el);el.querySelector('[data-open]').onclick=()=>openDetail(groups[i])})}
function skvCountText(kind,n){return kind==='icons'?`메인 스킬 ${n}개와 그 노드 아이콘 · 전체 ${DATA.skills.length}개`:`메인 스킬 ${n}개 · 전체 ${DATA.skills.length}개(강화 노드 포함) 대조`}
function renderAudit(root){root=root||$('#skv-root');renderSkillAudit(root,DATA,{onOpenGroup:openDetail,onCount:n=>{const c=$('#count');if(c)c.textContent=skvCountText('audit',n)}})}
function renderIcons(root){root=root||$('#skv-root');renderSkillIcons(root,DATA,{onOpenGroup:openDetail,onCount:n=>{const c=$('#count');if(c)c.textContent=skvCountText('icons',n)}})}
function openDetail(g){STATE.detail={g,time:0,play:true,last:performance.now()};$('#detailTitle').textContent=g.title;$('#scrub').max=g.frames.length-1;$('#scrub').value=0;$('#detailPlay').textContent='일시정지';$('#detailMeta').textContent=`${g.statusLabel||status(g)[0]} · ${g.frames.length}장 · ${g.timingLabel} · 각 카드 자동 맞춤`;$('#detailNote').textContent=g.notes||'';$('#sourceText').textContent=typeof g.source==='string'?JSON.stringify({runtimeKey:g.runtimeKey,ruids:g.ruids,frameRuids:g.frameRuids,resourceType:g.resourceType,mediaKind:g.mediaKind,package:g.package,alsoIn:g.alsoIn,since:g.since,period:g.period,firstUse:g.firstUse,sourceRef:g.source_ref,comment:g.comment,frames:g.frames},null,2):JSON.stringify({package:g.package,resourceKeys:g.resourceKeys,timingSource:g.timingSource,connectionEvidence:g.connectionEvidence,source:g.source,frames:g.originalFrames,sha256:g.sha256},null,2);$('#frames').innerHTML=g.frames.map((s,i)=>`<button data-frame="${i}" aria-label="${i+1}번째 프레임"><img loading="lazy" src="${esc(s)}" alt="${i+1}"></button>`).join('');$('#frames').querySelectorAll('button').forEach(b=>b.onclick=()=>scrub(Number(b.dataset.frame)));g.frames.forEach(img);$('#detail').showModal();drawDetail(0)}
function drawDetail(n){const d=STATE.detail;if(!d)return;draw($('#detailCanvas'),d.g,n);$('#scrub').value=n;$('#detailFrame').textContent=`${n+1} / ${d.g.frames.length}`;$('#frames').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('active',i===n))}
function scrub(n){if(!STATE.detail)return;STATE.detail.play=false;STATE.detail.time=STATE.detail.g.durations.slice(0,n).reduce((a,b)=>a+b,0)+1;$('#detailPlay').textContent='재생';drawDetail(n)}
function tick(now){const dt=Math.min(now-STATE.last,150);STATE.last=now;if(STATE.play)STATE.time+=dt*STATE.speed;for(const p of STATE.players){if(!p.visible)continue;if(p.scene){drawScene(p);continue}const n=frameAt(p.g,STATE.time);if(n!==p.last||!CACHE.get(p.g.frames[n])?.complete){draw(p.canvas,p.g,n);p.last=n;const l=p.el.querySelector('.frame-label');l.textContent=`${n+1} / ${p.g.frames.length}`}else if(CACHE.get(p.g.frames[n])?.complete){draw(p.canvas,p.g,n)}}if(STATE.detail&&$('#detail').open){if(STATE.detail.play)STATE.detail.time+=dt*STATE.speed;drawDetail(frameAt(STATE.detail.g,STATE.detail.time))}requestAnimationFrame(tick)}
function bindControls(){const on=(sel,ev,fn)=>{const el=$(sel);if(el)el[ev]=fn};
 on('#closeExport','onclick',()=>$('#exportDialog').close());on('#copyExport','onclick',()=>{const t=$('#exportText');$('#exportStatus').textContent=copyFromBox(t)?'다시 복사했습니다.':'자동 복사가 막혔습니다. 선택된 글을 직접 복사하세요.'});
 on('#search','oninput',e=>{STATE.query=e.target.value;setQuery();render()});on('#scope','onchange',e=>{STATE.scope=e.target.value;render()});
 on('#playAll','onclick',()=>{STATE.play=!STATE.play;$('#playAll').textContent=STATE.play?'전체 일시정지':'전체 재생';$('#playAll').setAttribute('aria-pressed',String(STATE.play))});
 on('#speed','onchange',e=>STATE.speed=Number(e.target.value));on('#background','onchange',e=>{document.body.classList.remove('body-mid','body-light');if(e.target.value!=='dark')document.body.classList.add('body-'+e.target.value)});
 on('#detailPlay','onclick',()=>{STATE.detail.play=!STATE.detail.play;$('#detailPlay').textContent=STATE.detail.play?'일시정지':'재생'});on('#restart','onclick',()=>{STATE.detail.time=0;STATE.detail.play=true;$('#detailPlay').textContent='일시정지'});
 on('#scrub','oninput',e=>scrub(Number(e.target.value)));on('#closeDetail','onclick',()=>$('#detail').close());
 on('#detail','onclick',e=>{if(e.target===$('#detail')){let r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}})}
// ---- 효과 고르기: 자리(슬롯)별 현재 / FX / 메이플 비교와 선택 ----
const PICK_VIEWS=[['current','현재 사용 중'],['fx','FX'],['maple','메이플 에셋 · 추천'],['reco','추천 장면'],['compare','자리별 비교']];
const fmtDate=d=>d?String(d).slice(5,16).replace('T',' '):'';
const short=r=>String(r||'').slice(0,8);
function slotsAll(){return SLOTS&&Array.isArray(SLOTS.slots)?SLOTS.slots:[]}
function pickOf(id){const p=PICK.picks[id];return p&&typeof p==='object'?p:null}
function choiceId(c){return c.source==='current'?'current':c.id}
function candsOf(s,view){const cur=s.current?[s.current]:[];if(view==='current')return cur;if(view==='fx')return[...(s.current&&s.current.kind==='codex'?cur:[]),...s.fx];if(view==='maple')return[...(s.current&&s.current.kind==='maple'?cur:[]),...s.maple];return[...cur,...s.fx,...s.maple]}
function findCand(s,id){if(id==='current')return s.current;return[...s.fx,...s.maple].find(c=>c.id===id)||null}
function srcTag(c){if(c.source==='current')return c.kind==='maple'?['현재 · 메이플','src-current']:['현재 사용 중','src-current'];return c.source==='fx'?['FX','src-fx']:c.origin==='search'?['메이플 후보 · 검색','src-search']:c.origin==='recommend'?['메이플 후보 · 재검색','src-search']:['메이플','src-maple']}
function choiceKind(c){return c.source==='current'?'현재 유지':c.source==='fx'?'FX 후보':c.origin==='search'?'메이플 후보(검색)':c.origin==='recommend'?'메이플 후보(재검색)':'메이플 에셋'}
function provenance(c){const out=[];if(c.since)out.push(`연결 ${fmtDate(c.since.date)} ${c.since.commit}`);if(c.period)out.push(`연결 ${c.period.from?fmtDate(c.period.from.date)+' '+c.period.from.commit:'?'} → 교체 ${c.period.to?fmtDate(c.period.to.date)+' '+c.period.to.commit:'?'}`);if(c.firstUse)out.push(`처음 사용 ${fmtDate(c.firstUse.date)} ${c.firstUse.commit}`);return out.join(' · ')}
function mediaNote(c){return c.mediaKind==='frame-thumbnails'?'프레임 썸네일(원본 크기와 다름)':c.mediaKind==='thumbnail'?'썸네일만 · 프레임 없음':c.mediaKind==='sprite'?'정지 스프라이트':''}
function slotMatches(s){const q=STATE.query.trim().toLowerCase();if(PICK.group&&s.group!==PICK.group)return false;if(!recoFilterOk(s))return false;if(!q)return true;return[s.title,s.id,s.runtime||'',...candsOf(s,'compare').map(c=>`${c.title} ${c.runtimeKey||''} ${c.package||''} ${(c.ruids||[]).join(' ')}`)].join(' ').toLowerCase().includes(q)}
function viewCount(view){if(view==='reco')return slotsAll().length;return slotsAll().reduce((n,s)=>n+(view==='current'?(s.current&&s.current.use==='connected'?1:0):candsOf(s,view).length),0)+(view==='fx'&&SLOTS?SLOTS.unassigned.length:0)}
function choiceSummary(s){const p=pickOf(s.id);if(!p||!p.choice)return'<span class="minor">아직 고르지 않음</span>';const c=findCand(s,p.choice);const t=c?c.title:(p.snap&&p.snap.title)||p.choice;return`고름 <b>${esc(p.choice==='current'?'현재 유지':choiceKind(c||{source:p.snap&&p.snap.source}))}</b> · ${esc(t)}${c?'':' <span class="tag pending">자료에서 사라짐</span>'}`}
function candCard(s,c,view){const chosen=(pickOf(s.id)||{}).choice===choiceId(c);const rk=recoRankOf(s,c);const shown=rk&&rk.shown;const sc=sceneOn()&&!!ruleOf(s.id);const kept=keepsOf(s.id).includes(choiceId(c));const st=srcTag(c);const total=(c.durations||[]).reduce((a,b)=>a+b,0);const prov=provenance(c);const mn=mediaNote(c);
 const ruid=c.ruids&&c.ruids.length?`RUID ${c.ruids.map(short).slice(0,2).join(' ')}${c.ruids.length>2?` 외 ${c.ruids.length-2}`:''}`:'RUID 없음(미업로드)';
 return`<article class="card pick-card${chosen?' chosen':''}${kept?' kept':''}${shown?' reco-shown':''}" data-card-slot="${esc(s.id)}" data-card="${esc(choiceId(c))}"><button class="stage${sc?' scene-stage':''}" data-detail aria-label="${esc(c.title)} 크게 보기"><canvas width="0" height="0" aria-label="${esc(c.title)} ${sc?'장면 ':''}재생"></canvas><span class="frame-label">${sc?'장면':c.frames.length+'장'}</span></button><div class="card-content"><div class="tags">${rk?`<span class="tag reco">${rk.keep?'코덱스 커스텀 유지':`추천 ${rk.rank}순위 · ${esc(rk.row.score)}점`}</span>`:''}<span class="tag ${st[1]}">${st[0]}</span>${c.isNew?'<span class="tag new">새 FX · 10-31 이후</span>':''}<span class="tag ${esc(c.tone||(c.source==='maple'?'maple':c.use==='connected'?'current':'pending'))}">${esc(c.statusLabel||'')}</span>${mn?`<span class="tag pending">${esc(mn)}</span>`:''}</div><h2>${esc(c.title)}</h2><div class="meta">${c.frames.length===1?'정지 그림':c.frames.length+'장 · '+(total/1000).toFixed(2)+'초 · '+esc(c.timingLabel||'')}${c.box?` · ${esc(c.box[0])}×${esc(c.box[1])}px`:''}</div>${c.reason?`<div class="caption reason">고른 이유 · ${esc(c.reason)}</div>`:''}${shown&&!rk.keep&&rk.row.reasons&&rk.row.reasons.length?`<ul class="reco-why">${rk.row.reasons.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<div class="id">${esc(c.runtimeKey||c.package||c.resourceName||'')}</div><div class="id">${esc(ruid)}</div>${prov?`<div class="caption">${esc(prov)}</div>`:''}<label class="keep"><input type="checkbox" data-keep-slot="${esc(s.id)}" data-keep="${esc(choiceId(c))}"${kept?' checked':''}> 후보 남기기 (실녹화)</label><button class="pick-btn" data-slot="${esc(s.id)}" data-cand="${esc(choiceId(c))}" aria-pressed="${chosen}">${chosen?ICON_CHECK+'고름':(c.source==='current'?'현재 유지로 고르기':'이걸로 고르기')}</button></div></article>`}
function memoBox(s,open){const p=pickOf(s.id)||{};return`<details class="memo"${open||p.memo?' open':''}><summary>메모${p.memo?' · 작성됨':''}</summary><textarea data-memo="${esc(s.id)}" maxlength="500" rows="2" placeholder="예: 초록이 더 잘 보여서 메이플로">${esc(p.memo||'')}</textarea></details>`}
function emptyText(s,view){if(view==='current')return s.currentNote||'현재 쓰는 그림 없음';if(view==='fx')return'이 자리의 코덱스 FX 후보 없음';if(view==='maple')return s.mapleExcluded?`해골 관련 자리라 메이플 검색 후보를 넣지 않음 — ${s.mapleExcluded}`:'이 자리의 메이플 클립 없음';return'후보 없음'}
function slotSection(s,view){const n=slotsAll().indexOf(s)+1;const cands=orderCands(s,candsOf(s,view),view);let body;
 if(view==='compare'){const notes=[s.current?'':`현재: ${s.currentNote||'쓰는 그림 없음'}`,s.fx.length?'':'코덱스 FX 후보 없음',s.maple.length?'':(s.mapleExcluded?'해골 관련 자리라 메이플 검색 후보 없음':'메이플 클립 없음')].filter(Boolean);body=`<div class="sub-label">현재 ${s.current?1:0} · FX 후보 ${esc(s.fx.length)} · 메이플 ${esc(s.maple.length)}${s.maple.some(c=>c.origin==='search')?`(검색 ${esc(s.maple.filter(c=>c.origin==='search').length)})`:''} — 같은 시각부터 나란히 재생</div>${notes.length?`<p class="slot-empty">${esc(notes.join(' · '))}</p>`:''}<div class="cards${sceneOn()?' scene-cards':''}">${cands.map(c=>candCard(s,c,view)).join('')}</div>`}
 else body=cands.length?`<div class="cards${sceneOn()?' scene-cards':''}">${cands.map(c=>candCard(s,c,view)).join('')}</div>`:`<p class="slot-empty">${esc(emptyText(s,view))}</p>`;
 const warn=view==='current'&&s.current&&s.current.use!=='connected'?`<span class="tag pending">${esc(s.current.statusLabel)}</span>`:'';
 const excl=(view==='maple'||view==='compare')&&s.mapleExcluded?`<span class="tag legacy">메이플 검색 제외 · 해골 관련</span>`:'';
 const rb=view==='maple'||view==='compare'?recoBox(s):'';
 return`<section class="slot" id="slot-${esc(s.id)}"><header class="slot-head"><div class="slot-title"><h3><span class="slot-no">${n}</span>${esc(s.title)}</h3><div class="slot-key">${esc(s.runtime||'정하는 상수 없음')} ${warn}${excl}</div></div><div class="slot-side"><div class="slot-choice" data-choice-for="${esc(s.id)}">${choiceSummary(s)}</div>${view==='compare'?'':`<button class="small" data-compare="${esc(s.id)}">나란히 비교 ${esc(s.fx.length+s.maple.length+(s.current?1:0))}</button>`}</div></header>${rb}${memoBox(s,view==='compare')}${sceneOn()&&cands.length?sceneRuleBox(s):''}${body}</section>`}
function pickedCount(){return slotsAll().filter(s=>{const p=pickOf(s.id);return p&&p.choice}).length}
function pickBar(){const memos=slotsAll().filter(s=>(pickOf(s.id)||{}).memo).length;return`<div class="pick-bar"><span id="pickCount" aria-live="polite">고른 자리 <b>${pickedCount()}</b> / ${slotsAll().length} · 메모 ${memos}</span><span class="pick-actions"><button id="pickExport" class="primary">선택 내보내기</button><button id="keepExport">실녹화 목록 내보내기 <b id="keepCount">${keptCount()}</b></button><button id="pickClear">모두 지우기</button></span></div>`}
function renderPick(){const grid=$('#grid');
 if(!SLOTS||!slotsAll().length){$('#count').textContent='효과 자리 비교 자료 없음';grid.innerHTML='<div class="empty">효과 자리 비교 자료가 이 배포에 없습니다. <code>npm run slots</code>로 만든 뒤 다시 빌드하세요.</div>';return}
 const view=PICK.view;const list=slotsAll().filter(slotMatches);
 const tabs=`<nav class="subtabs" aria-label="후보 출처">${PICK_VIEWS.map(([v,l])=>`<button data-view="${v}" aria-pressed="${v===view}">${esc(l)} <b>${v==='compare'?esc(slotsAll().length)+'곳':esc(viewCount(v))}</b></button>`).join('')}</nav>`;
 const groups=`<label class="select-label">분류<select id="pickGroup"><option value="">전체 ${esc(slotsAll().length)}곳</option>${SLOTS.groups.map(g=>`<option value="${esc(g.id)}"${PICK.group===g.id?' selected':''}>${esc(g.title)} ${esc(slotsAll().filter(s=>s.group===g.id).length)}</option>`).join('')}</select></label>`;
 const stamp=`<p class="minor">자리 기준: 게임 정본 <b>${esc(String(SLOTS.sourceCommit).slice(0,8))}</b> (${esc(fmtDate(SLOTS.sourceDate))} · ${esc(SLOTS.sourceRef)}) · 코덱스 FX 목록은 카탈로그 ${esc(String(SLOTS.catalog.sourceCommit).slice(0,8))}(${esc(SLOTS.catalog.createdAt)}) + 그 뒤 새 통일 공정 FX · 메이플 그림은 MSW 리소스 검색 API 프레임 · 「메이플 후보 · 검색」은 고정 목록(scripts/maple-picks.mjs)으로 넣은 검색 결과 · 자료 생성 ${esc(fmtDate(SLOTS.createdAt))} UTC</p>`;
 let main='';
 if(view==='compare'){const cur=list.find(s=>s.id===PICK.slot)||list[0];if(cur)PICK.slot=cur.id;const idx=cur?list.indexOf(cur):-1;
  main=`<div class="cmp-nav"><button id="cmpPrev"${idx<=0?' disabled':''} aria-label="앞 자리">앞 자리</button><select id="cmpSlot" aria-label="비교할 자리">${list.map(s=>`<option value="${esc(s.id)}"${cur&&s.id===cur.id?' selected':''}>${esc(slotsAll().indexOf(s)+1)}. ${esc(s.title)} · 후보 ${esc(s.fx.length+s.maple.length+(s.current?1:0))}</option>`).join('')}</select><button id="cmpNext"${idx<0||idx>=list.length-1?' disabled':''} aria-label="다음 자리">다음 자리</button><button id="cmpSync">처음부터 같이 재생</button></div>${cur?slotSection(cur,'compare'):'<div class="empty">조건에 맞는 자리가 없습니다.</div>'}`;
  $('#count').textContent=cur?`${slotsAll().indexOf(cur)+1}번 자리 · 후보 ${cur.fx.length+cur.maple.length+(cur.current?1:0)}개를 한 화면에서 비교`:'조건에 맞는 자리 없음'}
 else if(view==='reco'){let last='';main=list.map(s=>{const g=SLOTS.groups.find(x=>x.id===s.group);const h=s.group!==last?`${last?'</div>':''}<h2 class="group-title">${esc(g?g.title:s.group)}</h2><div class="cards${sceneOn()?' scene-cards':''}">`:'';last=s.group;return h+recoCard(s)}).join('')+(list.length?'</div>':'')||'<div class="empty">조건에 맞는 자리가 없습니다.</div>';
  $('#count').textContent=`추천 장면 · 자리 ${list.length}곳 — 자리마다 추천 1순위(해골 4자리는 코덱스 그림)를 ${sceneOn()?'장면에 올려':'그대로'} 재생`}
 else{let last='';main=list.map(s=>{const g=SLOTS.groups.find(x=>x.id===s.group);const h=s.group!==last?`<h2 class="group-title">${esc(g?g.title:s.group)}</h2>`:'';last=s.group;return h+slotSection(s,view)}).join('')||'<div class="empty">조건에 맞는 자리가 없습니다.</div>';
  if(view==='fx'&&!PICK.group&&!STATE.query&&SLOTS.unassigned.length)main+=`<h2 class="group-title">자리 미정 · 기타 코덱스 그림 ${esc(SLOTS.unassigned.length)}</h2><p class="minor">UI 조각·아이콘·쓰지 않는 샘플처럼 정해진 효과 자리가 없는 그림입니다. 고를 수는 없고 보기만 합니다.</p><div class="cards">${SLOTS.unassigned.map(c=>candCard({id:'_'},c,view).replace(/<label class="keep">[^]*?<\/label>/,'').replace(/<button class="pick-btn"[^]*?<\/button>/,'')).join('')}</div>`;
  const cards=list.reduce((n,s)=>n+candsOf(s,view).length,0);$('#count').textContent=`${PICK_VIEWS.find(v=>v[0]===view)[1]} · 자리 ${list.length}곳 · 카드 ${cards}개`}
 grid.innerHTML=`<div class="pick-head">${tabs}<div class="pick-filters">${groups}${view==='maple'||view==='reco'||view==='compare'?recoFilter():''}${sceneControls()}<span class="minor">카드 아래 단추로 자리마다 하나를 고르고, 메모를 남긴 뒤 「선택 내보내기」로 복사해 붙여 넣으세요. 「장면 보기」로 맵 위 실제 자리에서 비교하고, 실제 게임에서 다시 찍어 볼 후보는 여러 개 「후보 남기기」 → 「실녹화 목록 내보내기」. 이 브라우저에만 저장됩니다.</span></div>${stamp}${view==='maple'||view==='reco'||view==='compare'?recoSummary():''}${sceneNote()}</div>${main}${pickBar()}`;
 bindPick(grid)}
function bindPick(grid){
 grid.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{PICK.view=b.dataset.view;setQuery();render();if(typeof window!=='undefined')window.scrollTo({top:Math.min(window.scrollY,$('.toolbar').offsetTop)})});
 const pg=grid.querySelector('#pickGroup');if(pg)pg.onchange=e=>{PICK.group=e.target.value;render()};
 grid.querySelectorAll('[data-compare]').forEach(b=>b.onclick=()=>{PICK.view='compare';PICK.slot=b.dataset.compare;setQuery();render();if(typeof window!=='undefined')window.scrollTo({top:$('.toolbar').offsetTop})});
 const sel=grid.querySelector('#cmpSlot');if(sel)sel.onchange=e=>{PICK.slot=e.target.value;setQuery();render()};
 const move=d=>{const list=slotsAll().filter(slotMatches);const i=list.findIndex(s=>s.id===PICK.slot);const n=list[i+d];if(n){PICK.slot=n.id;setQuery();render()}};
 const prev=grid.querySelector('#cmpPrev'),next=grid.querySelector('#cmpNext');if(prev)prev.onclick=()=>move(-1);if(next)next.onclick=()=>move(1);
 const sync=grid.querySelector('#cmpSync');if(sync)sync.onclick=()=>{STATE.time=0;STATE.play=true;$('#playAll').textContent='전체 일시정지';$('#playAll').setAttribute('aria-pressed','true')};
 grid.querySelectorAll('.pick-btn').forEach(b=>b.onclick=()=>choose(b.dataset.slot,b.dataset.cand));
 grid.querySelectorAll('[data-memo]').forEach(t=>t.oninput=()=>setMemo(t.dataset.memo,t.value));
 const ex=grid.querySelector('#pickExport');if(ex)ex.onclick=exportPicks;
 const cl=grid.querySelector('#pickClear');if(cl)cl.onclick=()=>{if(!pickedCount()&&!Object.keys(PICK.picks).length)return;if(typeof confirm==='function'&&!confirm('고른 것과 메모를 모두 지울까요?'))return;PICK.picks={};savePicks();render()};
 const tg=grid.querySelector('#sceneToggle');if(tg)tg.onclick=()=>{if(!sceneReady())return;SV.on=!SV.on;saveSV();STATE.time=0;render()};
 const sm=grid.querySelector('#sceneMap');if(sm)sm.onchange=e=>{SV.map=e.target.value;saveSV()};
 const ss=grid.querySelector('#sceneSize');if(ss)ss.onchange=e=>{SV.size=SIZES.includes(e.target.value)?e.target.value:'auto';saveSV()};
 const sf=grid.querySelector('#sceneFlip');if(sf)sf.onchange=e=>{SV.flipMaple=!!e.target.checked;saveSV()};
 const sz=grid.querySelector('#sceneClose');if(sz)sz.onchange=e=>{SV.close=!!e.target.checked;saveSV()};
 grid.querySelectorAll('[data-keep]').forEach(b=>b.onchange=()=>toggleKeep(b.dataset.keepSlot,b.dataset.keep,b.checked));
 grid.querySelectorAll('[data-reco-ok]').forEach(b=>b.onclick=()=>confirmReco(b.dataset.recoOk));
 grid.querySelectorAll('[data-reco-next]').forEach(b=>b.onclick=()=>nextReco(b.dataset.recoNext));
 const rf=grid.querySelector('#recoFilter');if(rf)rf.onchange=e=>{PICK.recoFilter=e.target.value;render()};
 const ke=grid.querySelector('#keepExport');if(ke)ke.onclick=exportShortlist;
 const cards=[...grid.querySelectorAll('.pick-card')];
 cards.forEach(el=>{const s=slotsAll().find(x=>x.id===el.dataset.cardSlot);const c=s?findCand(s,el.dataset.card):(SLOTS.unassigned.find(x=>x.id===el.dataset.card)||null);if(!c)return;const scn=!!s&&sceneOn()&&!!ruleOf(s.id);const p={el,g:c,canvas:el.querySelector('canvas'),visible:false,last:-1,release:true,scene:scn,slot:s,cycle:scn?sceneCycle(s):0};STATE.players.push(p);observer.observe(el);el.querySelector('[data-detail]').onclick=()=>openDetail(c)})}
function refreshSlot(id){const s=slotsAll().find(x=>x.id===id);if(!s)return;const p=pickOf(id)||{};
 document.querySelectorAll(`.pick-btn[data-slot="${id}"]`).forEach(b=>{const on=p.choice===b.dataset.cand;b.setAttribute('aria-pressed',String(on));b.innerHTML=on?ICON_CHECK+'고름':(b.dataset.cand==='current'?'현재 유지로 고르기':'이걸로 고르기');const card=b.closest('.pick-card');if(card)card.classList.toggle('chosen',on)});
 document.querySelectorAll(`[data-choice-for="${id}"]`).forEach(el=>el.innerHTML=choiceSummary(s));
 const sr=shownReco(s);const ron=!!sr&&p.choice===sr.row.candidateId;document.querySelectorAll(`[data-reco-ok="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',String(ron));b.innerHTML=ron?ICON_CHECK+'확인함':(sr&&sr.keep?'확인 (현재 그림 유지)':'확인')});document.querySelectorAll(`.reco-card[data-card-slot="${id}"]`).forEach(el=>el.classList.toggle('chosen',ron));
 const memos=slotsAll().filter(x=>(pickOf(x.id)||{}).memo).length;const pc=$('#pickCount');if(pc)pc.innerHTML=`고른 자리 <b>${pickedCount()}</b> / ${slotsAll().length} · 메모 ${memos}`;
 const keeps=keepsOf(id);document.querySelectorAll(`[data-keep-slot="${id}"]`).forEach(b=>{const on=keeps.includes(b.dataset.keep);b.checked=on;const card=b.closest('.pick-card');if(card)card.classList.toggle('kept',on)});const kc=$('#keepCount');if(kc)kc.textContent=String(keptCount())}
function snapOf(s,c){return{title:c.title,source:c.source,origin:c.origin||null,reason:c.reason||null,kind:c.kind||null,ruids:c.ruids||[],runtimeKey:c.runtimeKey||null,package:c.package||null,statusLabel:c.statusLabel||'',frames:c.frames.length}}
function choose(slotId,candId){const s=slotsAll().find(x=>x.id===slotId);if(!s)return;const c=findCand(s,candId);if(!c)return;const p=pickOf(slotId)||{};
 if(p.choice===candId){delete p.choice;delete p.snap}else{p.choice=candId;p.snap=snapOf(s,c);p.at=new Date().toISOString()}
 if(!p.choice&&!p.memo)delete PICK.picks[slotId];else PICK.picks[slotId]=p;savePicks();refreshSlot(slotId)}
function setMemo(slotId,value){const p=pickOf(slotId)||{};p.memo=String(value).slice(0,500);if(!p.memo)delete p.memo;if(!p.choice&&!p.memo)delete PICK.picks[slotId];else PICK.picks[slotId]=p;savePicks();refreshSlot(slotId)}
function buildExport(){const rows=slotsAll().map((s,i)=>({s,n:i+1,p:pickOf(s.id)})).filter(x=>x.p&&(x.p.choice||x.p.memo));
 const now=new Date();const picks=rows.map(({s,n,p})=>{const c=p.choice?findCand(s,p.choice):null;const d=c?snapOf(s,c):p.snap||null;
  return{no:n,slotId:s.id,slotTitle:s.title,slotRuntimeKey:s.runtime,choice:p.choice?(p.choice==='current'?'current':d&&d.source==='maple'?'maple':'fx'):null,candidateId:p.choice||null,candidateTitle:d?d.title:null,candidateStatus:d?d.statusLabel:null,candidateOrigin:d?d.origin||null:null,reason:d?d.reason||null:null,sourceKey:d?d.runtimeKey:null,package:d?d.package:null,ruids:d?d.ruids:[],frameCount:d?d.frames:null,missingFromData:!!(p.choice&&!c),memo:p.memo||'',pickedAt:p.at||null}});
 const lines=[`[효과 고르기] 메이플 리저렉션 — ${now.toLocaleString('ko-KR',{hour12:false})} 내보냄`,`자료 기준: 게임 ${String(SLOTS.sourceCommit).slice(0,8)} (${fmtDate(SLOTS.sourceDate)}) · 카탈로그 ${String(SLOTS.catalog.sourceCommit).slice(0,8)}`,`고른 자리 ${picks.filter(x=>x.choice).length}곳 · 메모만 ${picks.filter(x=>!x.choice).length}곳`,''];
 for(const x of picks){lines.push(`${x.no}. ${x.slotTitle} (${x.slotRuntimeKey||'정하는 상수 없음'})`);
  if(!x.choice)lines.push('   → 고르지 않음');
  else{const kind=x.choice==='current'?'현재 유지':x.choice==='maple'?(x.candidateOrigin==='search'?'메이플 후보(검색)':x.candidateOrigin==='recommend'?'메이플 후보(재검색)':'메이플 에셋'):'FX 후보';lines.push(`   → ${kind}: ${x.candidateTitle}${x.candidateStatus?' · '+x.candidateStatus:''}${x.missingFromData?' (지금 자료에는 없음)':''}`);
   if(x.ruids.length)lines.push(`     RUID ${x.ruids.length}개: ${x.ruids.slice(0,3).join(', ')}${x.ruids.length>3?` 외 ${x.ruids.length-3}개(JSON에 전체)`:''}`);else if(x.choice!=='current')lines.push('     RUID 없음 — 아직 업로드 안 된 그림');
   if(x.sourceKey||x.package)lines.push(`     출처: ${[x.sourceKey,x.package].filter(Boolean).join(' · ')}`);if(x.reason)lines.push(`     고른 이유: ${x.reason}`)}
  if(x.memo)lines.push(`   메모: ${x.memo.replace(/\s+/g,' ')}`)}
 const json={kind:'catch-and-keep/effect-picks',version:1,exportedAt:now.toISOString(),data:{gameRef:SLOTS.sourceRef,gameCommit:SLOTS.sourceCommit,catalogCommit:SLOTS.catalog.sourceCommit,generatedAt:SLOTS.createdAt},picks};
 return lines.join('\n')+'\n\n```json\n'+JSON.stringify(json,null,1)+'\n```\n'}
function copyFromBox(box){try{box.focus();box.select();const ok=typeof document.execCommand==='function'&&document.execCommand('copy');box.scrollTop=0;return ok}catch(e){return false}}
async function exportPicks(){const text=buildExport();const box=$('#exportText');box.value=text;$('#exportTitle').textContent='선택 내보내기';$('#exportStatus').textContent='복사하는 중…';$('#exportDialog').showModal();
 let ok=copyFromBox(box);
 if(!ok){try{if(typeof navigator!=='undefined'&&navigator.clipboard&&navigator.clipboard.writeText){await Promise.race([navigator.clipboard.writeText(text),new Promise((_,no)=>setTimeout(()=>no(new Error('timeout')),2000))]);ok=true}}catch(e){ok=false}}
 $('#exportStatus').textContent=ok?'클립보드에 복사했습니다. 작업 요청 창에 그대로 붙여 넣으세요.':'자동 복사가 막혔습니다. 아래 글이 선택되어 있으니 직접 복사(⌘C / Ctrl+C)하세요.';
 if(!ok){box.focus();box.select()}}
// 주소 = /skills/pick/?view=compare&slot=<자리> · 검색어는 ?q= (해시 쓰지 않음)
function queryString(){const p=new URLSearchParams();if(STATE.tab==='pick'&&PICK.view&&PICK.view!=='current')p.set('view',PICK.view);if(STATE.tab==='pick'&&PICK.view==='compare'&&PICK.slot)p.set('slot',PICK.slot);if(STATE.query)p.set('q',STATE.query);const q=p.toString();return q?'?'+q:''}
function setQuery(){try{if(typeof history!=='undefined'&&history.replaceState&&typeof location!=='undefined')history.replaceState(null,'',location.pathname+queryString())}catch(e){}}
function readQuery(){try{if(typeof location==='undefined')return;const p=new URLSearchParams(location.search);const v=p.get('view');if(['current','fx','maple','reco','compare'].includes(v))PICK.view=v;const sl=p.get('slot');if(sl&&/^[\w-]+$/.test(sl))PICK.slot=sl;const q=p.get('q');if(q){STATE.query=q.slice(0,80);const i=$('#search');if(i)i.value=STATE.query}}catch(e){}}
// ---- 장면 보기: 맵 바탕 위에 배우(캐릭터·몬스터·거인·소환수)와 효과를 코드 배치 규칙대로 겹쳐 재생 (웹 합성 근사) ----
let SCENE=readJSONBlock('scene-data');
const SCENE_KEY='ckl.sceneView.v1';const SV={on:true,map:'',size:'auto',flipMaple:false,close:false};
// 후보 크기: auto = 원형판 자리(규칙에 판정 지름 judgeD)는 판정 원에 맞춤 · 그 밖은 코드 배율 / code / fit = 지금 그림 폭 / circle = 판정 원(원형판 자리만 · 그 밖은 코드 배율)
const SIZES=['auto','code','fit','circle'];
function loadSV(){try{const raw=typeof localStorage!=='undefined'?localStorage.getItem(SCENE_KEY):null;const v=raw?JSON.parse(raw):null;if(v&&typeof v==='object'){if(v.sv>=3)SV.on=!!v.on;if(typeof v.map==='string')SV.map=v.map;if(v.sv>=2&&SIZES.includes(v.size))SV.size=v.size;else if(v.size==='fit')SV.size='fit';SV.flipMaple=!!v.flipMaple;SV.close=!!v.close}}catch(e){}}
function saveSV(){try{if(typeof localStorage!=='undefined')localStorage.setItem(SCENE_KEY,JSON.stringify({...SV,sv:3}))}catch(e){}}
// 장면 그림 주소 = 파일 + 내용 해시(?v=) — 같은 이름으로 다시 배포해도 옛 그림이 남지 않게
const sceneSrc=x=>'/assets/scene/'+x.file+(x.v?'?v='+encodeURIComponent(x.v):'');
function sceneReady(){return!!(SCENE&&SCENE.rules&&typeof SCENE.rules==='object'&&Array.isArray(SCENE.actors)&&SCENE.actors.length)}
function ruleOf(id){return sceneReady()&&SCENE.rules[id]&&typeof SCENE.rules[id]==='object'?SCENE.rules[id]:null}
function sceneOn(){return(SV.on||PICK.view==='reco')&&sceneReady()}
function actorOf(role,pose){const A=sceneReady()?SCENE.actors:[];return A.find(a=>a.role===role&&a.pose===pose)||A.find(a=>a.role===role&&a.pose==='stand')||null}
// VIEW 9.6칸 = 모바일 화면 폭(게임 그대로) · 가까이 보기 6칸
const SC={W:640,H:360,VIEW:9.6,CLOSE:6,GROUND:0.64};const scPX=()=>SC.W/(SV.close?SC.CLOSE:SC.VIEW);
const toScreen=(x,y)=>[SC.W/2+x*scPX(),SC.H*SC.GROUND-y*scPX()];
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
const isMapleCand=c=>c.source==='maple'||c.kind==='maple';
function sceneLayout(r){const dist=num(r.dist,3.8);const c=-dist/2-0.2;return{dist,c,t:c+dist,behind:c-1.4}}
// 기준점(칸 · 월드 좌표, 위가 +)
function scenePoint(name,r,L){const P={casterFeet:[L.c,0],casterBody:[L.c,0.3],casterHand:[L.c+0.35,0.3],targetFeet:[L.t,0],targetBody:[L.t,0.3],targetHead:[L.t,0],aim:[L.t,0],targetHand:[L.t-0.3,0.4],targetSoul:[L.t,0.9]};
 if(name==='meteorSky'){const s=(r.proj&&r.proj.sky)||[2,3.46];return[L.t+num(s[0],2),num(s[1],3.46)]}return P[name]||[L.t,0]}
function frameDurs(c,r){const pr=num(r.playRate,1)||1;const fs=num(r.frameSec,0);return(c.durations||[]).map(d=>fs>0&&!isMapleCand(c)?fs:Math.max(0.01,num(d,100)/1000/pr))}
const sum=a=>a.reduce((x,y)=>x+y,0);
function releaseOf(c,r,N){const rel=num(r.release,0);return rel>0&&N>=rel+4&&!isMapleCand(c)?rel:0}
// 효과가 시작된 뒤 u초의 장 번호·투명도 (안 보이면 null)
function fxState(c,r,u){if(u<0)return null;const d=frameDurs(c,r),N=d.length;if(!N)return null;const hold=num(r.hold,0),fade=num(r.fade,0);
 const tail=(n,v)=>v<hold?{n,a:1}:v<hold+fade?{n,a:1-(v-hold)/fade}:null;
 if(N===1){const show=r.loop?num(r.dur,1):Math.max(hold,0.6);return u<show?{n:0,a:1}:u<show+fade?{n:0,a:1-(u-show)/fade}:null}
 if(r.loop){const rel=releaseOf(c,r,N),body=N-rel,bodyT=sum(d.slice(0,body))||0.1,dur=num(r.dur,1);
  if(u<dur){let p=u%bodyT;for(let n=0;n<body;n++){p-=d[n];if(p<0)return{n,a:1}}return{n:body-1,a:1}}
  let v=u-dur;for(let n=body;n<N;n++){v-=d[n];if(v<0)return{n,a:1}}return v<fade?{n:N-1,a:1-v/fade}:null}
 let p=u;for(let n=0;n<N;n++){p-=d[n];if(p<0)return{n,a:1}}return tail(N-1,p)}
function fxLength(c,r){const d=frameDurs(c,r),N=d.length;const hold=num(r.hold,0),fade=num(r.fade,0);if(N<=1)return(r.loop?num(r.dur,1):Math.max(hold,0.6))+fade;
 if(r.loop){const rel=releaseOf(c,r,N);return num(r.dur,1)+sum(d.slice(N-rel))+fade}return sum(d)+hold+fade}
function projFlight(r,L){const p=r.proj||{};const a=scenePoint(p.from,r,L),b=scenePoint(p.to,r,L);const len=Math.hypot(b[0]-a[0],b[1]-a[1]);return{a,b,len,T:num(p.time,0)>0?p.time:len/Math.max(0.5,num(p.speed,8))}}
function sceneStart(r){return 0.15+num(r.start,0)}
function sceneCycle(s){const r=ruleOf(s.id);if(!r)return 2;const L=sceneLayout(r);const cands=[s.current,...s.fx,...s.maple].filter(Boolean);
 const len=r.proj?projFlight(r,L).T+0.6:Math.max(0.6,...cands.map(c=>fxLength(c,r)));const extra=r.copies&&r.copies.length?num(r.copies[r.copies.length-1].delay,0):0;
 return Math.max(1.6,sceneStart(r)+len+extra+0.6)}
function visibleW(c){return c.crop&&c.crop.length===4?c.crop[2]-c.crop[0]:(c.box&&c.box[0])||((c.sizes&&c.sizes[0]&&c.sizes[0][0])||100)}
const isCircleRule=r=>!!r&&num(r.judgeD,0)>0;
function sizeMode(s){const circ=isCircleRule(ruleOf(s.id));return SV.size==='auto'||SV.size==='circle'?(circ?'circle':'code'):SV.size}
const REACH=new Map();let REACH_CV=null;
// 원형판의 보이는 반경(px) — 게임 CurseCircleFitPx와 같은 정의: 피벗에서 알파>16 화소까지 가장 먼 거리(모든 장 중 최대). 그림이 다 오기 전이면 null(다음 장면에서 다시 잼)
function reachPx(s,c,r){const key=s.id+'|'+c.id;if(REACH.has(key))return REACH.get(key);if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
 const ims=c.frames.map(img);if(!ims.length||ims.some(im=>!im.complete||!im.naturalWidth))return null;
 if(!REACH_CV)REACH_CV=document.createElement('canvas');const cv=REACH_CV;const x=cv.getContext?cv.getContext('2d',{willReadFrequently:true}):null;if(!x)return null;let best=0;
 for(let n=0;n<ims.length;n++){const im=ims[n];const iw=im.naturalWidth,ih=im.naturalHeight;cv.width=iw;cv.height=ih;x.drawImage(im,0,0);
  let d;try{d=x.getImageData(0,0,iw,ih).data}catch(e){REACH.set(key,null);return null}const pv=pivotOf(c,r,n,iw,ih);
  for(let y=0;y<ih;y++){const dy=y+0.5-pv[1];for(let px=0;px<iw;px++)if(d[(y*iw+px)*4+3]>16){const dx=px+0.5-pv[0];const q=dx*dx+dy*dy;if(q>best)best=q}}}
 const v=best>0?Math.sqrt(best):null;REACH.set(key,v);return v}
// 후보 배율에 곱할 값: 판정 원 = 보이는 지름을 판정 지름(judgeD칸)에 맞춤(현재 그림은 코드 배율이 이미 판정 원과 같게 계산됨) · 그림 폭 = 지금 그림의 보이는 폭에 맞춤
function fitFactor(s,c,r){const m=sizeMode(s);
 if(m==='circle'){if(c===s.current)return 1;const rad=reachPx(s,c,r)||visibleW(c)/2;const k=num(r.judgeD,3)/2*100/rad/num(r.scale,1);return isFinite(k)&&k>0?k:1}
 if(m!=='fit'||!s.current||c===s.current)return 1;const k=visibleW(s.current)/visibleW(c);return isFinite(k)&&k>0?k:1}
function pivotOf(c,r,n,iw,ih){if(isMapleCand(c)){if(Array.isArray(c.pivots)&&Array.isArray(c.pivots[n]))return c.pivots[n];const pv=SCENE.pivots&&c.ruids&&SCENE.pivots[c.ruids[0]];if(pv&&pv[n])return pv[n];const o=c.offsets&&c.offsets[n];if(o&&c.box)return[c.box[0]/2-o[0],c.box[1]/2-o[1]];return[iw/2,ih/2]}
 const p=Array.isArray(r.pivot)?r.pivot:[0.5,0.5];return[num(p[0],0.5)*iw,(1-num(p[1],0.5))*ih]}
const FLASH=new Map();
// 피격 번쩍임(근사): 배우 그림 위에 흰빛을 덮은 사본
function flashed(a,im){if(FLASH.has(a.file))return FLASH.get(a.file);if(typeof document==='undefined'||typeof document.createElement!=='function')return im;const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const x=cv.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(255,255,255,0.78)';x.fillRect(0,0,cv.width,cv.height);FLASH.set(a.file,cv);return cv}
function drawActor(ctx,a,x,flash){if(!a)return;const im=img(sceneSrc(a));if(!im.complete||!im.naturalWidth)return;const k=scPX()/num(a.pxPerCell,100);const [sx,sy]=toScreen(x,0);const f=a.feet||[im.naturalWidth/2,im.naturalHeight];ctx.drawImage(flash?flashed(a,im):im,Math.round(sx-f[0]*k),Math.round(sy-f[1]*k),Math.round(im.naturalWidth*k),Math.round(im.naturalHeight*k))}
function sceneMap(){const maps=sceneReady()&&Array.isArray(SCENE.maps)?SCENE.maps:[];return maps.find(x=>x.id===SV.map)||maps[0]||null}
function drawMapBg(ctx){ctx.fillStyle='#1b2630';ctx.fillRect(0,0,SC.W,SC.H);const m=sceneMap();if(!m)return;const im=img(sceneSrc(m));if(!im.complete||!im.naturalWidth)return;const k=scPX()/num(m.pxPerCell,100),w=im.naturalWidth*k,h=im.naturalHeight*k;
 for(let iy=0,y=0;y<SC.H;iy++,y+=h)for(let ix=0,x=0;x<SC.W;ix++,x+=w){ctx.save();ctx.translate(x+(ix%2?w:0),y+(iy%2?h:0));ctx.scale(ix%2?-1:1,iy%2?-1:1);ctx.drawImage(im,0,0,w,h);ctx.restore()}}
function drawFx(ctx,s,c,r,n,wx,wy,alpha,angle){const im=img(c.frames[n]);if(!im.complete||!im.naturalWidth)return;const iw=im.naturalWidth,ih=im.naturalHeight;const f=fitFactor(s,c,r);const sc=num(r.scale,1)*f,scy=(r.scaleY!=null?num(r.scaleY,1):num(r.scale,1))*f;const kx=sc/100*scPX(),ky=scy/100*scPX();const pv=pivotOf(c,r,n,iw,ih);
 const flip=(!!r.flipX)!==(SV.flipMaple&&isMapleCand(c));const [sx,sy]=toScreen(wx,wy);ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha*num(r.alpha,1)));ctx.translate(sx,sy);if(angle){ctx.rotate(-angle);if(Math.cos(angle)<0)ctx.scale(1,-1)}ctx.scale(flip?-1:1,1);ctx.drawImage(im,-pv[0]*kx,-pv[1]*ky,iw*kx,ih*ky);ctx.restore()}
const orderAt=(r,n,N)=>Array.isArray(r.orders)&&r.orders.length?num(r.orders[Math.min(n,r.orders.length-1)],0):num(r.order,0);
function sceneItems(s,c,r,t,L){const items=[];const st=sceneStart(r);let flashAt=st;
 if(r.proj){const F=projFlight(r,L);const u=t-st;flashAt=st+F.T;const p=u/F.T;
  if(p>=0&&p<=1&&c.frames.length){const d=frameDurs(c,r),tot=sum(d)||0.1;let q=u%tot,n=0;for(;n<d.length;n++){q-=d[n];if(q<0)break}n=Math.min(n,c.frames.length-1);
   const base=Math.atan2(F.b[1]-F.a[1],F.b[0]-F.a[0]);const cnt=Math.max(1,num(r.proj.count,1)),spr=num(r.proj.spread,0)*Math.PI/180,arc=num(r.proj.arc,0);
   for(let i=0;i<cnt;i++){const a=base+(cnt>1?(i/(cnt-1)-0.5)*spr:0);const x=F.a[0]+Math.cos(a)*F.len*p,y=F.a[1]+Math.sin(a)*F.len*p+arc*4*p*(1-p);items.push({o:num(r.order,0),draw:ctx=>drawFx(ctx,s,c,r,n,x,y,1,r.proj.rotate===false?0:a)})}}}
 else{const base=scenePoint(r.anchor,r,L);const copies=Array.isArray(r.copies)&&r.copies.length?r.copies:[{}];const N=c.frames.length;
  for(const cp of copies){const f=fxState(c,r,t-st-num(cp.delay,0));if(!f)continue;const off=Array.isArray(r.offsets)&&r.offsets.length?r.offsets[Math.min(f.n,r.offsets.length-1)]:[0,0];
   const x=base[0]+num(r.dx,0)+num(cp.dx,0)+num(off[0],0),y=base[1]+num(r.dy,0)+num(cp.dy,0)+num(off[1],0);items.push({o:orderAt(r,f.n,N),draw:ctx=>drawFx(ctx,s,c,r,f.n,x,y,f.a,0)})}}
 return{items,flashAt}}
// 그리는 순서: 맵 바탕 → 뒤층(층 1 이하) → 몬스터 → 사이층(2~4) → 캐릭터(·소환수·거인) → 앞층(5 이상)
function drawScene(p){const cv=p.canvas;if(!cv.width)return;const ctx=cv.getContext('2d');const s=p.slot,c=p.g,r=ruleOf(s.id);if(!r)return;const L=sceneLayout(r);const cyc=p.cycle||2;const t=((STATE.time/1000)%cyc+cyc)%cyc;
 ctx.imageSmoothingEnabled=false;drawMapBg(ctx);const {items,flashAt}=sceneItems(s,c,r,t,L);const fl=!!r.flash&&((t>=flashAt&&t<flashAt+0.07)||(t>=flashAt+0.14&&t<flashAt+0.21));
 const castOn=r.scene==='player'&&!!(r.cast||(r.proj&&r.proj.from==='casterHand'))&&t<sceneStart(r)+0.35;
 const band=(lo,hi)=>items.filter(i=>i.o>=lo&&i.o<=hi).forEach(i=>i.draw(ctx));
 band(-1e9,1);
 drawActor(ctx,actorOf('monster',fl&&r.scene!=='monster'?'hit':'stand'),L.t,fl&&r.scene!=='monster'&&!SCENE.actors.some(a=>a.role==='monster'&&a.pose==='hit'));
 band(2,4);
 if(r.scene==='summon'||r.scene==='giant'){drawActor(ctx,actorOf('player','stand'),L.behind,false);drawActor(ctx,(r.scene==='giant'&&r.giant&&actorOf('giant-'+r.giant,'stand'))||(r.caster&&actorOf(r.caster,'stand'))||actorOf(r.scene,'stand'),L.c,false)}
 else drawActor(ctx,actorOf('player',castOn?'cast':'stand'),L.c,fl&&r.scene==='monster');
 band(5,1e9);
 const circ=sizeMode(s)==='circle';if(circ){const b=scenePoint(r.anchor,r,L);const [cx,cy]=toScreen(b[0]+num(r.dx,0),b[1]+num(r.dy,0));ctx.save();ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.beginPath();ctx.arc(cx,cy,num(r.judgeD,3)/2*scPX(),0,Math.PI*2);ctx.stroke();ctx.restore()}
 const lbl=p.el.querySelector('.frame-label');if(lbl)lbl.textContent=`장면 ${t.toFixed(1)} / ${cyc.toFixed(1)}초${circ?` · 판정 원 ${num(r.judgeD,3)}칸 맞춤`:''}`}
const ANCHOR_KO={casterFeet:'시전자 발',targetFeet:'표적 발',targetBody:'표적 몸',targetHead:'표적 머리 위',aim:'조준점 바닥'};
const CASTER_KO={player:'캐릭터',summon:'소환수',giant:'거인',monster:'캐릭터(맞는 쪽)'};
const FIELD_KO={scale:'배율',judgeD:'판정 지름',scaleY:'세로 배율',order:'층',orders:'층',dx:'가로 위치',dy:'높이',dur:'지속',copies:'복사본 위치',start:'시작 시각','proj.speed':'투사체 속도','proj.time':'비행 시간','proj.sky':'낙하 시작점','proj.arc':'곡선',offsets:'장별 위치',hold:'유지',fade:'옅어짐',alpha:'투명도',playRate:'재생 빠르기',frameSec:'장 간격',release:'잦아듦'};
const layerKo=o=>o<=1?'뒤층(바닥)':o<=4?'몸 사이':'앞층';
function ruleSummary(r){const parts=[];
 if(r.proj){const p=r.proj;parts.push(`${CASTER_KO[r.scene]||'시전자'} 쪽 투사체 ${p.time?p.time+'초':p.speed+'칸/초'}${p.count>1?` · ${p.count}발 ${p.spread||0}°`:''}`)}
 else{const who=String(r.anchor||'').startsWith('caster')?(CASTER_KO[r.scene]||'시전자')+' ':'';parts.push(`${who}${ANCHOR_KO[r.anchor]||r.anchor||''}${num(r.dy,0)?` +${r.dy}칸`:''}${num(r.dx,0)?` · 앞 ${r.dx}칸`:''}`)}
 parts.push(`배율 ${r.scale}${r.scaleY!=null?'×'+r.scaleY:''}`);
 parts.push(Array.isArray(r.orders)&&r.orders.length?`${layerKo(r.orders[0])}→${layerKo(r.orders[r.orders.length-1])}(${r.orders[0]}→${r.orders[r.orders.length-1]})`:`${layerKo(num(r.order,0))}(${num(r.order,0)})`);
 if(isCircleRule(r))parts.push(`판정 지름 ${r.judgeD}칸`);
 parts.push(r.loop?`반복 ${r.dur}초`:'1회');if(r.follow)parts.push('몸을 따라감');return parts.join(' · ')}
function ruleUses(r){return(r.uses||[]).map(u=>`${u.t==='read'?'읽음':u.t==='code'?'코드 옮김':'추정'} · ${FIELD_KO[u.f]||u.f} = ${Array.isArray(u.v)?u.v.join(','):u.v}${u.key?' · '+u.key:''}${u.at?' · '+u.at:''}${u.why?' · '+u.why:''}`).join('\n')}
function sceneRuleBox(s){const r=ruleOf(s.id);if(!r)return'<p class="slot-empty">이 자리의 장면 규칙이 자료에 없습니다.</p>';const est=[...new Set((r.estimated||[]).map(f=>FIELD_KO[f]||f))];
 return`<div class="scene-rule"><span>장면 규칙 · ${esc(ruleSummary(r))}</span> ${est.length?`<span class="tag pending">추정: ${esc(est.join('·'))}</span>`:'<span class="tag current">모두 코드 값</span>'}${r.note?`<div class="caption">${esc(r.note)}</div>`:''}<details class="sources"><summary>근거 ${esc((r.src||[]).length)}곳 · 값 ${esc((r.uses||[]).length)}개</summary><pre>${esc((r.src||[]).join('\n')+'\n\n'+ruleUses(r))}</pre></details></div>`}
function sceneControls(){if(!sceneReady())return'<button class="small" id="sceneToggle" disabled title="장면 자료 없음 — npm run scene">장면 자료 없음</button>';
 const maps=Array.isArray(SCENE.maps)?SCENE.maps:[];const m=sceneMap();
 return`${PICK.view==='reco'?'':`<button class="small" id="sceneToggle" aria-pressed="${SV.on}">${SV.on?ICON_CHECK:''}장면 보기</button>`}${sceneOn()?`<label class="select-label">바탕<select id="sceneMap">${maps.map(x=>`<option value="${esc(x.id)}"${m===x?' selected':''}>${esc(x.label)}</option>`).join('')}</select></label><label class="select-label">후보 크기<select id="sceneSize">${[['auto','기본 (원형판 = 판정 원 · 그 밖 = 코드 배율)'],['code','코드 배율 그대로'],['fit','지금 그림 폭에 맞춤'],['circle','판정 원에 맞춤 (원형판 자리만)']].map(([v,t])=>`<option value="${v}"${SV.size===v?' selected':''}>${t}</option>`).join('')}</select></label><label class="select-label"><input type="checkbox" id="sceneFlip"${SV.flipMaple?' checked':''}> 메이플 클립 좌우 반전</label><label class="select-label"><input type="checkbox" id="sceneClose"${SV.close?' checked':''}> 가까이 보기 (화면 6칸)</label>`:''}`}
function actorLine(a){const s=a.source||{};const where=a.kind==='capture'?`증거에서 잘라냄(배경 지우기 근사) ${s.file}${s.t!=null?' @'+s.t+'s':''} crop ${(s.crop||[]).join(',')} · 줌 ${s.zoom}`:a.kind==='atlas'?`에셋 도감 몸 프레임 ${s.group}`:`정식 PNG ${s.file||''}`;return`${a.label} — ${where} · ${a.pxPerCell}px/칸${a.note?' · '+a.note:''}`}
function sceneNote(){if(!sceneOn())return'';const A=SCENE.actors,M=Array.isArray(SCENE.maps)?SCENE.maps:[];
 return`<div class="scene-note"><b>장면 보기 · 웹 합성(근사)</b> — 메이커 실녹화가 아닙니다. 배치 규칙은 게임 ${esc(String(SCENE.sourceCommit).slice(0,8))}(${esc(fmtDate(SCENE.sourceDate))})의 상수 선언을 읽고, 코드에서 못 읽은 값은 「추정」으로 표시했습니다. 피격 번쩍임은 배우 그림에 흰빛을 덮은 흉내입니다. 한 자리의 후보는 모두 같은 장면에서 같은 시각부터 재생됩니다.<details class="sources"><summary>배우·바탕 출처 ${esc(A.length+M.length)}개</summary><pre>${esc([...A.map(actorLine),...M.map(m=>`바탕 ${m.label} — ${(m.source||{}).file}${(m.source||{}).t!=null?' @'+m.source.t+'s':''} crop ${((m.source||{}).crop||[]).join(',')} · ${m.pxPerCell}px/칸`)].join('\n'))}</pre></details></div>`}
// 후보 남기기(여러 개) → 실녹화 목록
function keepsOf(id){const p=pickOf(id);return p&&Array.isArray(p.keep)?p.keep.filter(x=>typeof x==='string'):[]}
function keptCount(){return slotsAll().reduce((n,s)=>n+keepsOf(s.id).length,0)}
function keptSlots(){return slotsAll().filter(s=>keepsOf(s.id).length).length}
function toggleKeep(slotId,candId,on){const s=slotsAll().find(x=>x.id===slotId);if(!s||!findCand(s,candId))return;const p=pickOf(slotId)||{};const set=new Set(keepsOf(slotId));if(on)set.add(candId);else set.delete(candId);p.keep=[...set];if(!p.keep.length)delete p.keep;if(!p.choice&&!p.memo&&!p.keep)delete PICK.picks[slotId];else PICK.picks[slotId]=p;savePicks();refreshSlot(slotId)}
function buildShortlist(){const rows=slotsAll().map((s,i)=>({s,n:i+1,keep:keepsOf(s.id)})).filter(x=>x.keep.length);
 const list=rows.map(({s,n,keep})=>{const p=pickOf(s.id)||{};const r=ruleOf(s.id);return{no:n,slotId:s.id,slotTitle:s.title,runtimeKey:s.runtime,
  keep:keep.map(id=>{const c=findCand(s,id);const d=c?snapOf(s,c):null;return{candidateId:id,title:d?d.title:null,source:d?d.source:null,origin:d?d.origin:null,status:d?d.statusLabel:null,ruids:d?d.ruids:[],frameCount:d?d.frames:null,sourceKey:d?d.runtimeKey:null,package:d?d.package:null,missingFromData:!c}}),
  chosen:p.choice||null,memo:p.memo||'',sceneRule:r?{scene:r.scene,anchor:r.anchor||null,proj:r.proj||null,dx:r.dx??null,dy:r.dy??null,scale:r.scale,order:r.order??null,orders:r.orders||null,loop:!!r.loop,dur:r.dur??null,estimated:r.estimated||[]}:null}});
 return JSON.stringify({kind:'catch-and-keep/effect-shortlist',version:1,purpose:'메이커 실녹화 입력 — 자리마다 남긴 후보를 실제 게임에서 찍어 비교',exportedAt:new Date().toISOString(),
  data:{gameRef:SLOTS.sourceRef,gameCommit:SLOTS.sourceCommit,catalogCommit:SLOTS.catalog.sourceCommit,generatedAt:SLOTS.createdAt,sceneRulesCommit:SCENE?SCENE.sourceCommit||null:null},
  counts:{slots:list.length,candidates:list.reduce((n,x)=>n+x.keep.length,0)},slots:list},null,1)}
async function exportShortlist(){const text=buildShortlist();const box=$('#exportText');box.value=text;$('#exportTitle').textContent='실녹화 목록 내보내기';$('#exportStatus').textContent='복사하는 중…';$('#exportDialog').showModal();
 let ok=copyFromBox(box);if(!ok){try{if(typeof navigator!=='undefined'&&navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);ok=true}}catch(e){ok=false}}
 $('#exportStatus').textContent=ok?`클립보드에 복사했습니다 — 자리 ${keptSlots()}곳 · 후보 ${keptCount()}개. 다음 메이커 실녹화 요청에 그대로 붙여 넣으세요.`:'자동 복사가 막혔습니다. 아래 글을 직접 복사(⌘C / Ctrl+C)하세요.';if(!ok){box.focus();box.select()}}
// ---- 추천: 자리마다 메이플 후보 1순위(점수 규칙 scripts/recommend-defs.mjs · npm run recommend) · 확인 = 「이걸로 고르기」와 같은 저장 · 다른 것 = 다음 순위 ----
let RECO=readJSONBlock('reco-data');
const RECO_IDX={};PICK.recoFilter='';const CONF_KO={high:'확신 높음',mid:'확신 보통',low:'확신 낮음',keep:'코덱스 유지'};
function recoReady(){return!!(RECO&&RECO.slots&&typeof RECO.slots==='object')}
function recoOf(id){return recoReady()&&RECO.slots[id]&&typeof RECO.slots[id]==='object'?RECO.slots[id]:null}
// 재검색 후보(자리 3위 안)를 그 자리 메이플 후보 끝에 붙인다 — 카드·고르기·내보내기가 다른 후보와 똑같이 동작
function mergeReco(){if(!recoReady()||!RECO.extras||typeof RECO.extras!=='object')return;for(const s of slotsAll()){const ex=RECO.extras[s.id];if(!Array.isArray(ex))continue;for(const c of ex)if(c&&typeof c.id==='string'&&Array.isArray(c.frames)&&!s.maple.some(m=>m.id===c.id))s.maple.push(c)}}
function rankedOf(s){const r=recoOf(s.id);return r&&Array.isArray(r.ranked)?r.ranked.filter(x=>x&&findCand(s,x.candidateId)).slice(0,5):[]}
function shownReco(s){const r=recoOf(s.id);if(!r)return null;if(r.status==='codex-keep')return s.current?{keep:true,rank:1,row:{candidateId:'current',score:null,reasons:Array.isArray(r.reasons)?r.reasons:[]},list:[],r}:null;const list=rankedOf(s);if(!list.length)return null;const i=(RECO_IDX[s.id]||0)%list.length;return{keep:false,rank:i+1,row:list[i],list,r}}
function recoRankOf(s,c){const sr=shownReco(s);if(!sr)return null;const id=choiceId(c);if(sr.row.candidateId===id)return{...sr,shown:true};if(sr.keep)return null;const i=sr.list.findIndex(x=>x.candidateId===id);return i>=0?{keep:false,rank:i+1,row:sr.list[i],shown:false}:null}
function orderCands(s,cands,view){if(view!=='maple'&&view!=='compare')return cands;const sr=shownReco(s);if(!sr)return cands;const lead=cands.find(c=>choiceId(c)===sr.row.candidateId);if(!lead)return cands;
 if(view==='compare'){const cur=cands.filter(c=>c.source==='current'&&c!==lead);return[...cur,lead,...cands.filter(c=>c!==lead&&!cur.includes(c))]}return[lead,...cands.filter(c=>c!==lead)]}
const recoOn=(s,sr)=>{const p=pickOf(s.id)||{};return!!sr&&p.choice===sr.row.candidateId};
function recoButtons(s,sr,compare){if(!sr)return'';const on=recoOn(s,sr);return`<div class="reco-actions"><button data-reco-ok="${esc(s.id)}" aria-pressed="${on}">${on?ICON_CHECK+'확인함':(sr.keep?'확인 (현재 그림 유지)':'확인')}</button>${!sr.keep&&sr.list.length>1?`<button data-reco-next="${esc(s.id)}">다른 것 · 지금 ${esc(sr.rank)}/${esc(sr.list.length)}</button>`:''}${compare?`<button data-compare="${esc(s.id)}">나란히 비교</button>`:''}</div>`}
function recoBox(s){const r=recoOf(s.id);if(!r)return'';const sr=shownReco(s);
 if(!sr)return'<div class="reco-box"><span class="tag conf-low">추천 없음</span> 점수를 매길 메이플 후보가 없습니다.</div>';
 if(sr.keep)return`<div class="reco-box"><span class="tag reco">추천</span> <span class="tag conf-keep">코덱스 커스텀 유지</span> <b>${esc(s.current.title)}</b><ul>${sr.row.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${recoButtons(s,sr,false)}</div>`;
 const c=findCand(s,sr.row.candidateId)||{};const x=sr.row;const warn=sr.rank===1&&r.confidence==='low'?[...(Array.isArray(r.lowWhy)?r.lowWhy:[]).map(w=>'확신 낮음 · '+w),...(x.cautions||[]).slice(0,2)]:(x.cautions||[]).slice(0,1);(Array.isArray(x.bonus)?x.bonus:[]).filter(b=>/같은/.test(b)).forEach(b=>warn.push('덧점 · '+b));
 return`<div class="reco-box"><span class="tag reco">추천 ${esc(sr.rank)}순위</span>${sr.rank===1?` <span class="tag conf-${esc(r.confidence)}">${esc(CONF_KO[r.confidence]||'')}</span>`:''} <b>${esc(c.title||x.title)}</b> · ${esc(x.score)}점 <span class="minor">· ${esc(r.roleKo)}·${esc(r.elementKo)} 자리${sr.rank===1&&typeof r.margin==='number'&&r.margin<90?` · 2순위와 ${esc(r.margin)}점 차`:''} · ${esc(srcTag(c)[0])}</span><ul>${(x.reasons||[]).slice(0,3).map(w=>`<li>${esc(w)}</li>`).join('')}${warn.map(w=>`<li class="warn">${esc(w)}</li>`).join('')}</ul>${recoButtons(s,sr,false)}</div>`}
function recoCard(s){const n=slotsAll().indexOf(s)+1;const sr=shownReco(s);const r=recoOf(s.id);const c=sr?findCand(s,sr.row.candidateId):(s.current||null);
 if(!c)return`<article class="card reco-card"><div class="card-content"><h2><span class="slot-no">${esc(n)}</span>${esc(s.title)}</h2><p class="minor">추천할 후보 없음</p></div></article>`;
 const sc=sceneOn()&&!!ruleOf(s.id);const on=recoOn(s,sr);const st=srcTag(c);
 const tags=sr?(sr.keep?'<span class="tag conf-keep">코덱스 커스텀 유지</span>':`<span class="tag reco">추천 ${esc(sr.rank)}순위 · ${esc(sr.row.score)}점</span>${sr.rank===1?`<span class="tag conf-${esc(r.confidence)}">${esc(CONF_KO[r.confidence]||'')}</span>`:''}`):'<span class="tag conf-low">추천 자료 없음</span>';
 return`<article class="card pick-card reco-card${on?' chosen':''}" data-card-slot="${esc(s.id)}" data-card="${esc(choiceId(c))}"><button class="stage${sc?' scene-stage':''}" data-detail aria-label="${esc(s.title)} · ${esc(c.title)} 크게 보기"><canvas width="0" height="0" aria-label="${esc(c.title)} ${sc?'장면 ':''}재생"></canvas><span class="frame-label">${sc?'장면':esc(c.frames.length)+'장'}</span></button><div class="card-content"><div class="tags">${tags}<span class="tag ${st[1]}">${st[0]}</span></div><h2><span class="slot-no">${esc(n)}</span>${esc(s.title)}</h2><div class="meta">→ <b>${esc(c.title)}</b> · ${esc(c.frames.length)}장${r?` · ${esc(r.roleKo)}·${esc(r.elementKo)} 자리`:''}</div>${sr&&sr.row.reasons&&sr.row.reasons.length?`<ul class="reco-why">${sr.row.reasons.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${recoButtons(s,sr,true)}</div></article>`}
function confirmReco(id){const s=slotsAll().find(x=>x.id===id);if(!s)return;const sr=shownReco(s);if(!sr)return;const p=pickOf(id)||{};if(p.choice!==sr.row.candidateId)choose(id,sr.row.candidateId);else refreshSlot(id)}
function nextReco(id){const s=slotsAll().find(x=>x.id===id);if(!s)return;const sr=shownReco(s);if(!sr||sr.keep||sr.list.length<2)return;RECO_IDX[id]=sr.rank%sr.list.length;const y=typeof window!=='undefined'?window.scrollY:0;render();if(typeof window!=='undefined'&&window.scrollTo)window.scrollTo(0,y)}
function recoFilterOk(s){const f=PICK.recoFilter;if(!f||!recoReady()||!['maple','reco','compare'].includes(PICK.view))return true;const r=recoOf(s.id);if(!r)return false;if(f==='low')return r.confidence==='low';if(f==='keep')return r.status==='codex-keep';if(f==='open'){const p=pickOf(s.id);return!(p&&p.choice)}return true}
function recoFilter(){if(!recoReady())return'';const all=slotsAll().map(s=>recoOf(s.id)).filter(Boolean);const low=all.filter(r=>r.confidence==='low').length,keep=all.filter(r=>r.status==='codex-keep').length;
 return`<label class="select-label">추천<select id="recoFilter">${[['','전체'],['low',`확신 낮음만 ${low}`],['open','아직 고르지 않은 자리'],['keep',`코덱스 유지 ${keep}`]].map(([v,t])=>`<option value="${v}"${PICK.recoFilter===v?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`}
function recoSummary(){if(!recoReady())return'';const c=RECO.counts||{};const n=v=>esc(typeof v==='number'?v:0);const w=(RECO.rule&&RECO.rule.weights)||{};const cf=(RECO.rule&&RECO.rule.confidence)||{};const bn=(RECO.rule&&RECO.rule.bonus)||{};
 const mine=slotsAll().filter(s=>{const r=recoOf(s.id);const p=pickOf(s.id);if(!r||!p||!p.choice)return false;return r.status==='codex-keep'?p.choice==='current':rankedOf(s).some(x=>x.candidateId===p.choice)}).length;
 const WK={part:'역할',color:'색',shape:'모양',size:'크기',frames:'장 수·길이',keyword:'태그 낱말',theme:'어두운 계열',tone:'톤'};
 return`<div class="reco-summary"><p>추천 · 메이플 <b>${n(c.maple)}</b>자리 (확신 높음 ${n(c.high)} · 보통 ${n(c.mid)} · 낮음 ${n(c.low)}) · 코덱스 커스텀 유지 <b>${n(c.codexKeep)}</b> · 1순위 출처: 검색 후보 ${n(c.fromSearch)} · 재검색 ${n(c.fromResearch)} · 코드 클립 ${n(c.fromCode)} · 지금 쓰는 메이플 ${n(c.fromCurrent)} · 추천 후보로 고른 자리 <b>${esc(mine)}</b>/${esc(slotsAll().length)}. 「확인」은 「이걸로 고르기」와 같은 저장이라 「선택 내보내기」에 그대로 들어갑니다.</p><details class="sources"><summary>점수 규칙</summary><pre>${esc(['점수(0~100) = '+Object.entries(w).map(([k,v])=>`${WK[k]||k} ${Math.round(v*100)}%`).join(' + ')+' (어두운 계열은 저주·그림자·뼈·혼·독·피 자리만 · 아니면 톤에 줌) + 덧점',
  '역할 = 메이플 리소스 태그의 부분(hit 타격·ball 투사체·tile 바닥 장판·affected 상태 효과·effect 시전·special 특수)이 자리 역할과 맞는 정도',
  '색 = 지금 그림과 색 칸(색상환 12칸 + 흰빛·회색·검정) 겹침 60% + 자리 속성 색 비율 40%',
  '모양 = 장별 면적 변화(퍼졌다 사라짐 / 고른 반복)와 가로세로 비율 · 크기 = 같은 배율일 때 지금 그림 대비(1.5배 안 만점) · 원형판은 판정 원 맞춤이라 제외',
  '장 수·길이 = 장 수 + 한 번 재생 자리는 지금 그림 길이 대비 · 태그 낱말 = 메이플 AI 태그에 속성·역할 낱말 · 어두운 계열 = 어두운 낱말 + 원작 직업(다크나이트·나이트워커·데몬·배틀메이지·아크·루미너스)',
  `톤 = 어두운 게임에 맞게 흰빛·아주 밝은 그림·분홍을 깎음 · 덧점 = 지금 연결된 메이플 +${bn.currentMaple} · 코드 클립 +${bn.codeMaple} · 다른 자리 1순위와 같은 클립 ${bn.dupe} · 같은 원작 스킬 ${bn.dupeName} · 프레임 없는 썸네일 ${bn.thumbOnly}`,
  `확신 높음 = ${cf.high}점 이상이고 2순위와 ${cf.highMargin}점 이상 차 · 낮음 = ${cf.low}점 미만 · 2순위와 ${cf.lowMargin}점 미만 차 · 색 ${cf.lowColor} 미만 · 역할 ${cf.lowPart} 미만 · 크기 ${cf.lowSize} 미만 중 하나`,
  RECO.search?`재검색 = 자리마다 검색어 2개 × ${RECO.search.topK}개(animationclip·sprite · skill) + 지금 클립과 비슷한 것 → 메타·태그로 거른 상위 3개를 같은 규칙으로 잼 · 그 자리 3위 안이면 「메이플 후보 · 재검색」 카드로 넣음`:'재검색 없음',
  `자료 ${String(RECO.createdAt||'').slice(0,16)} UTC · 효과 자리 자료 ${String(RECO.slotsCommit||'').slice(0,8)}`].join('\n'))}</pre></details></div>`}
// ---- 시작: 화면별로 미리 만든 HTML에 동작을 붙인다 ----
mergeReco();loadPicks();loadSV();
const SKILL_DATA_URL=()=>document.body.dataset.skills||'';
let SKILL_LOAD=null;
// 대조표·아이콘·상세는 HTML이 미리 만들어져 있고, 효과 크게 보기·검색에 필요한 자료(/skills/data/skills.json)를 뒤에 받는다
function loadSkillData(){if(!SKILL_LOAD)SKILL_LOAD=fetch(SKILL_DATA_URL()).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(d=>{DATA=d;return d});return SKILL_LOAD}
function hydrateSkillDetail(root){if(!root)return;root.querySelectorAll('[data-skv-zoom]').forEach(b=>b.onclick=()=>b.classList.toggle('big'));root.querySelectorAll('[data-skv-wrap]').forEach(b=>b.onclick=()=>b.setAttribute('aria-expanded',String(b.getAttribute('aria-expanded')!=='true')));
 root.querySelectorAll('[data-skv-group]').forEach(b=>b.onclick=()=>loadSkillData().then(d=>{const g=(d.groups||[]).find(x=>x.id===b.dataset.skvGroup);if(g)openDetail(g)}).catch(()=>{}))}
function boot(){const view=document.body.dataset.view||'';STATE.tab=view==='summon'?'summon':view;
 readQuery();bindControls();
 if(view==='pick'){render()}
 else if(view==='fx'||view==='summon'){const g=$('#grid');fetch(document.body.dataset.src).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(d=>{DATA.groups=d.groups||[];render()}).catch(()=>{const c=$('#count');if(c)c.textContent='재생 자료를 불러오지 못했습니다. 새로고침해 주세요.'})}
 else if(view==='audit'||view==='icons'){const root=$('#skv-root');loadSkillData().then(()=>view==='icons'?renderIcons(root):renderAudit(root)).catch(()=>{const c=$('#count');if(c)c.textContent='검색 자료를 불러오지 못했습니다. 새로고침해 주세요.'})}
 else if(view==='skill')hydrateSkillDetail($('.skv-detail'));
 requestAnimationFrame(tick)}
if(typeof document!=='undefined'&&document.body&&document.body.dataset&&typeof fetch==='function')boot();
