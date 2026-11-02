// 스킬 화면 공용 조각 — 브라우저(/skills/app.js 앞부분)와 빌드(scripts/site.mjs, node:vm)가 함께 쓴다. DOM을 만지지 않는 순수 함수만 둔다.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ==== 스킬 화면 조각: 전체 스킬 대조표 · 스킬·강화 아이콘 (독립 함수 — 다른 틀로 옮길 때 이 블록과 CSS「skill views」블록만 가져가면 됨) ====
// 입력: root(요소) · data(catalog.json: skills·groups·changes·createdAt·sourceCommit) · opts{onOpenGroup(g)}. 전역 STATE·PICK을 읽지 않는다.
// 빌드(scripts/site.mjs)가 같은 함수로 HTML을 미리 만들고, 브라우저는 자료를 받은 뒤 같은 함수로 다시 그린다(검색·트리·펼치기).
const SKV={tree:'all',query:'',expand:false,changed:false,size:104};
const SKV_ICON_ENGINE='<svg class="ic" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>';
const skvHref=s=>'/skills/'+esc(encodeURIComponent(String(s&&s.id||'')))+'/';
const SKV_TREES=[['all','전부'],['command','소환'],['soul','혼'],['curse','저주'],['other','그 밖']];
function skvTreeOf(s){const t=s&&s.tree;return t==='command'||t==='soul'||t==='curse'?t:'other'}
function skvModel(data){
 const skills=Array.isArray(data&&data.skills)?data.skills:[];const groups=Array.isArray(data&&data.groups)?data.groups:[];
 const gmap=new Map(groups.map(g=>[g.id,g]));const ch=(data&&data.changes)||{};
 const renamed=new Map((ch.renamed||[]).map(r=>[r.id,r])),icon=new Map((ch.iconChanged||[]).map(r=>[r.id,r])),added=new Set((ch.added||[]).map(r=>r.id));
 const mains=skills.filter(s=>s.kind!=='node');const nodesOf=new Map();
 for(const s of skills)if(s.kind==='node'){const k=s.parent||'';if(!nodesOf.has(k))nodesOf.set(k,[]);nodesOf.get(k).push(s)}
 const orphan=skills.filter(s=>s.kind==='node'&&!mains.some(m=>m.id===s.parent));
 const order=(a,b)=>(Number(a.row)||0)-(Number(b.row)||0);
 const changedOf=s=>renamed.has(s.id)||icon.has(s.id)||added.has(s.id);
 return {skills,mains:mains.slice().sort(order),nodesOf,orphan,gmap,renamed,icon,added,removed:ch.removed||[],previous:ch.previous||null,changedOf}
}
function skvMatch(M,s){const q=SKV.query.trim().toLowerCase();if(!q)return true;const hay=s=>`${s.name||''} ${s.id||''} ${s.desc||''} ${(M.renamed.get(s.id)||{}).from||''}`.toLowerCase();return hay(s).includes(q)||(M.nodesOf.get(s.id)||[]).some(n=>hay(n).includes(q))}
function skvVisible(M){return M.mains.filter(s=>(SKV.tree==='all'||skvTreeOf(s)===SKV.tree)&&skvMatch(M,s)&&(!SKV.changed||M.changedOf(s)||(M.nodesOf.get(s.id)||[]).some(M.changedOf)))}
function skvStatus(g){if(g.connection==='connected'&&!(g.status==='legacy'||g.status==='superseded'))return['코드 연결','current'];if(g.status==='legacy'||g.status==='superseded')return['구버전','legacy'];if(g.connection==='registered')return['등록만','pending'];return['후보','pending']}
function skvTiming(g){const d=Array.isArray(g.durations)?g.durations:[];const n=(g.frames||[]).length;if(n<2)return'정지';const lo=Math.min(...d),hi=Math.max(...d);return`${n}장 · ${lo===hi?Math.round(lo)+'ms':Math.round(lo)+'~'+Math.round(hi)+'ms'}`}
function skvFxItem(g){const st=skvStatus(g);const f=(g.frames||[])[Math.floor(((g.frames||[]).length-1)/2)]||'';return`<button class="skv-fx" data-skv-group="${esc(g.id)}" title="${esc(g.title)} 크게 보기"><span class="skv-thumb"><img src="${esc(f)}" alt="" loading="lazy"></span><span class="skv-fx-name">${esc(g.title)}</span><span class="skv-fx-meta">${esc(skvTiming(g))}</span><span class="tag ${st[1]}">${st[0]}</span></button>`}
function skvEngineItem(e){return`<span class="skv-fx skv-engine" title="${esc(e.note||'')}"><span class="skv-thumb">${SKV_ICON_ENGINE}</span><span class="skv-fx-name">${esc(e.label||e.id)}</span><span class="skv-fx-meta">${esc(e.kind==='engine_clip'?'엔진 내장 클립':'입자·절차 효과')}</span><span class="tag skv-gray">엔진 생성</span></span>`}
function skvBadges(M,s){const out=[];const r=M.renamed.get(s.id),ic=M.icon.get(s.id);
 if(M.added.has(s.id))out.push('<span class="tag new">신규</span>');
 if(r)out.push(`<span class="tag skv-chg">이름 바뀜: ${esc(r.from)} → ${esc(r.to)}</span>`);
 if(ic)out.push(`<span class="tag skv-chg skv-iconchg" tabindex="0">아이콘 교체<span class="skv-pop" role="tooltip"><img src="${esc(ic.previousIcon)}" alt="옛 아이콘"><b>→</b><img src="${esc(s.icon)}" alt="새 아이콘"></span></span>`);
 return out.join('')}
function skvNode(M,n,parentGroups){const own=(n.ownGroups||[]).filter(id=>!parentGroups.includes(id)).map(id=>M.gmap.get(id)).filter(Boolean);
 const fx=own.length?own.map(g=>`<button class="skv-chip" data-skv-group="${esc(g.id)}">${esc(g.title)}</button>`).join(''):'<span class="skv-same">효과: 부모와 같음</span>';
 return`<li class="skv-node${M.changedOf(n)?' skv-changed':''}"><span class="skv-nframe${String(n.impl)==='false'||n.implementationEnabled===false?' off':''}"><img class="skv-nicon" src="${esc(n.icon)}" alt=""></span><div class="skv-nhead"><b>${esc(n.name)}</b>${skvBadges(M,n)}<span class="skv-nmeta">필요 랭크 ${esc(n.need??'-')} · 최대 ${esc(n.maxLv??'-')}${String(n.impl)==='false'||n.implementationEnabled===false?' · <span class="tag pending">비활성</span>':''}</span></div><button class="skv-ndesc" data-skv-wrap aria-expanded="false" title="${esc(n.desc)}">${esc(n.desc)}</button><div class="skv-nfx">${fx}</div></li>`}
function skvCard(M,s){const groups=(s.groups||[]).map(id=>M.gmap.get(id)).filter(Boolean);const eng=Array.isArray(s.engineEffectItems)?s.engineEffectItems:[];const nodes=M.nodesOf.get(s.id)||[];const n=groups.length+eng.length;
 const meta=[s.kindLabel||s.kind,s.row?`Lv ${s.row}`:'',s.mana&&s.mana!=='0'?`마나 ${s.mana}`:'',s.cooldown&&s.cooldown!=='0'?`쿨 ${s.cooldown}초`:''].filter(Boolean);
 return`<article class="skv-card${M.changedOf(s)?' skv-changed':''}" id="skv-${esc(s.id)}"><div class="skv-main"><button class="skv-icon" data-skv-zoom aria-label="${esc(s.name)} 아이콘 크게"><img src="${esc(s.icon)}" alt=""></button><div class="skv-head"><h3><a href="${skvHref(s)}">${esc(s.name)}</a></h3><p class="skv-meta">${esc(meta.join(' · '))}</p><code>${esc(s.id)}</code><div class="skv-badges">${s.implementationEnabled===false?'<span class="tag pending">비활성</span>':''}${skvBadges(M,s)}</div></div><p class="skv-desc">${esc(s.desc)}</p></div>`
 +`<details class="skv-fxbox"${SKV.expand?' open':''}><summary>효과 연결 ${n}개</summary>${n?`<div class="skv-strip">${groups.map(skvFxItem).join('')}${eng.map(skvEngineItem).join('')}</div>`:`<p class="minor">${esc(s.effectNote||'독립 프레임 효과 없음 · 아이콘·수치 강화')}</p>`}</details>`
 +(nodes.length?`<ul class="skv-nodes" aria-label="${esc(s.name)} 강화 노드 ${nodes.length}개">${nodes.map(x=>skvNode(M,x,s.groups||[])).join('')}</ul>`:'')+'</article>'}
// 도구 막대(2층) = 검색 + 트리 알약 칩 + 「필터 (n)」 + ⓘ · 서랍(3층) = 대조표: 효과 연결 펼치기·변경됨만 / 아이콘: 크기
const SKV_SVG=(d,n=20)=>`<svg class="ic" width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SKV_I={info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',filter:'<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>'};
function skvNChanged(M){return M.mains.filter(s=>M.changedOf(s)||(M.nodesOf.get(s.id)||[]).some(M.changedOf)).length}
function skvFilterN(kind){return kind==='audit'?(SKV.changed?1:0):(SKV.size!==104?1:0)}
function skvApplied(kind){const out=[];if(kind==='audit'&&SKV.changed)out.push(`<button type="button" data-skv-clear="changed">변경됨만 ${SKV_SVG(SKV_I.close,14)}<span class="sr-only">지우기</span></button>`);if(kind==='icons'&&SKV.size!==104)out.push(`<button type="button" data-skv-clear="size">크기 ${SKV.size}px ${SKV_SVG(SKV_I.close,14)}<span class="sr-only">지우기</span></button>`);return out.join('')}
function skvBar(M,withExtras){const cnt=t=>t==='all'?M.mains.length:M.mains.filter(s=>skvTreeOf(s)===t).length;const nch=skvNChanged(M);const kind=withExtras==='audit'?'audit':'icons';const id='skvDrawer';const n=skvFilterN(kind);
 const help=kind==='audit'?'<p>스킬 이름을 누르면 상세 화면, 효과를 누르면 프레임 재생입니다.</p><p>「코드 연결」은 소스·PNG 바이트 대조이며 실제 플레이 검수와 별개입니다. 아이콘 테는 게임 스킬 창 초상 테, 노드 테는 게임 노드 테입니다.</p>':'<p>104px = 스킬 창 초상 · 60px = 스킬 지정 창 · 40px = 핫바 칸(게임 칸 테). 메인 다음에 그 노드가 이어집니다.</p><p>아이콘을 누르면 크게 봅니다.</p>';
 const drawerBody=kind==='audit'?`<fieldset><legend>보기</legend><label class="skv-toggle"><input type="checkbox" data-skv-opt="expand"${SKV.expand?' checked':''}> 효과 연결 펼치기</label></fieldset><fieldset><legend>거르기</legend><label class="skv-toggle"><input type="checkbox" data-skv-opt="changed"${SKV.changed?' checked':''}> 변경됨만 <b>${nch}</b></label></fieldset>`:`<fieldset><legend>아이콘 크기</legend><div class="chips" role="group" aria-label="아이콘 크기">${[104,60,40].map(z=>`<button type="button" class="chip" data-skv-size="${z}" aria-pressed="${SKV.size===z}">${z}px</button>`).join('')}</div></fieldset>`;
 return`<div class="toolbar skv-bar"><div class="toolbar-inner"><input class="skv-search" type="search" value="${esc(SKV.query)}" placeholder="이름·id·설명 검색" aria-label="스킬 검색"><div class="chips" role="group" aria-label="트리">${SKV_TREES.map(([t,l])=>`<button type="button" class="chip" data-skv-tree="${t}" aria-pressed="${SKV.tree===t}">${l} <b>${cnt(t)}</b></button>`).join('')}</div><div class="tool-end"><button class="filter-btn" type="button" data-drawer-open="${id}" aria-controls="${id}" aria-expanded="false">${SKV_SVG(SKV_I.filter,18)}필터 <b data-filter-n>${n||''}</b></button><details class="info"><summary title="사용법">${SKV_SVG(SKV_I.info)}<span class="sr-only">사용법</span></summary><div class="info-pop">${help}</div></details></div></div></div><div class="applied" data-skv-applied aria-label="적용한 필터">${skvApplied(kind)}</div><div class="drawer-shade" data-drawer-close hidden></div><aside class="drawer" id="${id}" hidden aria-labelledby="${id}-t"><div class="drawer-head"><h2 id="${id}-t">필터</h2><button type="button" data-drawer-close aria-label="필터 닫기">${SKV_SVG(SKV_I.close,18)}</button></div><div class="drawer-body">${drawerBody}</div><div class="drawer-foot"><button type="button" data-skv-reset>초기화</button><button type="button" data-drawer-close>닫기</button></div></aside>`}
function skvStamp(data,M){const p=M.previous;return`<p class="minor skv-stamp">기준 게임 커밋 <b>${esc(String(data.sourceCommit||'').slice(0,8))}</b> · 자료 생성 ${esc(data.createdAt||'')}${p?` · 변경 비교: ${esc(p.createdAt)} 묶음(${esc(String(p.sourceCommit).slice(0,8))})`:' · 직전 묶음 비교 자료 없음'} · 「코드 연결」은 소스·PNG 바이트 대조이며 실제 플레이 검수와 별개</p>`}
function skvAuditList(data,M){const list=skvVisible(M);let html='';
 for(const [t,l] of SKV_TREES.slice(1)){const part=list.filter(s=>skvTreeOf(s)===t);if(!part.length)continue;if(SKV.tree==='all')html+=`<h2 class="group-title">${l} ${part.length}</h2>`;html+=part.map(s=>skvCard(M,s)).join('')}
 if(!list.length)html='<div class="empty">조건에 맞는 스킬이 없습니다.</div>';
 if(M.orphan.length&&!SKV.changed)html+=`<h2 class="group-title">부모 없는 노드 ${M.orphan.length}</h2><ul class="skv-nodes">${M.orphan.map(n=>skvNode(M,n,[])).join('')}</ul>`;
 if(M.removed.length)html+=`<details class="skv-removed"><summary>삭제됨 ${M.removed.length} · 직전 묶음에 있던 스킬</summary><ul class="skv-nodes">${M.removed.map(r=>`<li class="skv-node"><img class="skv-nicon" src="${esc(r.icon)}" alt=""><div class="skv-nhead"><b>${esc(r.name)}</b><span class="tag legacy">삭제됨</span><span class="skv-nmeta">${esc(r.id)}${r.parent?` · ${esc(r.parent)} 노드`:''}</span></div><span class="skv-ndesc">${esc(r.desc)}</span></li>`).join('')}</ul></details>`;
 const eng=(data.engineEffects||[]).filter(x=>x.usage_status==='connected_static_path'),gen=data.proceduralEffects||[];
 if(eng.length||gen.length)html+=`<details class="sources skv-sources"><summary>엔진 효과 원본 목록 · 내장 클립 ${eng.length} · 생성 효과 ${gen.length}</summary><p class="minor">카드의 「엔진 생성」 배지가 가리키는 원본입니다. PNG 도감에서 화면처럼 재현하지 않습니다.</p><pre>${esc(JSON.stringify({engine:eng,generated:gen.map(x=>({name:x.label_ko,description:x.description_ko,source:x.source}))},null,2))}</pre></details>`;
 return{html,count:list.length}}
function skvIconCell(M,s,size){const ch=M.icon.has(s.id),nw=M.added.has(s.id);return`<figure class="skv-ic${s.kind==='node'?' skv-ic-node':''}"><button class="skv-slot" data-skv-icon="${esc(s.id||'')}" style="width:${size+12}px;height:${size+12}px" aria-label="${esc(s.name)} 아이콘 크게 보기"><img src="${esc(s.icon)}" alt="" width="${size}" height="${size}"></button><figcaption>${esc(s.name)}${ch?' <span class="tag skv-chg">교체</span>':''}${nw?' <span class="tag new">신규</span>':''}</figcaption></figure>`}
function skvIconList(M){const list=skvVisible(M);let html='';const size=SKV.size;
 for(const [t,l] of SKV_TREES.slice(1)){const part=list.filter(s=>skvTreeOf(s)===t);if(!part.length)continue;html+=`<h2 class="group-title">${l} ${part.length}</h2>`+part.map(s=>`<div class="skv-family">${skvIconCell(M,s,size)}${(M.nodesOf.get(s.id)||[]).map(n=>skvIconCell(M,n,size)).join('')}</div>`).join('')}
 return{html:html||'<div class="empty">조건에 맞는 스킬이 없습니다.</div>',count:list.length}}
function skvBind(root,data,M,kind,opts,listFn){
 const listEl=root.querySelectorAll('.skv-list')[0];
 const chrome=()=>{root.querySelectorAll('[data-skv-applied]').forEach(el=>el.innerHTML=skvApplied(kind));root.querySelectorAll('[data-filter-n]').forEach(el=>el.textContent=skvFilterN(kind)||'');root.querySelectorAll('[data-skv-opt]').forEach(c=>c.checked=!!SKV[c.dataset.skvOpt]);root.querySelectorAll('[data-skv-size]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.skvSize)===SKV.size)));if(listEl&&kind==='icons')listEl.className='skv-list skv-icons skv-size-'+SKV.size};
 const redraw=()=>{chrome();if(!listEl)return;const r=listFn(data,M);listEl.innerHTML=r.html;bindList(listEl);if(opts.onCount)opts.onCount(r.count)};
 const bindList=el=>{
  el.querySelectorAll('[data-skv-group]').forEach(b=>b.onclick=()=>{const g=M.gmap.get(b.dataset.skvGroup);if(g&&opts.onOpenGroup)opts.onOpenGroup(g)});
  el.querySelectorAll('[data-skv-zoom]').forEach(b=>b.onclick=()=>b.classList.toggle('big'));
  el.querySelectorAll('[data-skv-wrap]').forEach(b=>b.onclick=()=>{const on=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(on))});
  el.querySelectorAll('[data-skv-icon]').forEach(b=>b.onclick=()=>{const g=M.gmap.get('icon-'+b.dataset.skvIcon);if(g&&opts.onOpenGroup)opts.onOpenGroup(g)})};
 root.querySelectorAll('[data-skv-tree]').forEach(b=>b.onclick=()=>{SKV.tree=b.dataset.skvTree;root.querySelectorAll('[data-skv-tree]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));redraw()});
 root.querySelectorAll('.skv-search').forEach(i=>i.oninput=e=>{SKV.query=e.target.value;redraw()});
 root.querySelectorAll('[data-skv-opt]').forEach(c=>c.onchange=()=>{SKV[c.dataset.skvOpt]=!!c.checked;redraw()});
 root.querySelectorAll('[data-skv-size]').forEach(b=>b.onclick=()=>{SKV.size=Number(b.dataset.skvSize)||104;redraw()});
 root.onclick=e=>{const c=e.target&&e.target.closest?e.target.closest('[data-skv-clear],[data-skv-reset]'):null;if(!c)return;if(c.dataset.skvClear==='changed'||c.hasAttribute('data-skv-reset'))SKV.changed=false;if(c.hasAttribute('data-skv-reset'))SKV.expand=false;if(c.dataset.skvClear==='size'||c.hasAttribute('data-skv-reset'))SKV.size=104;redraw()};
 if(listEl)bindList(listEl)}
function renderSkillAudit(root,data,opts={}){const M=skvModel(data);const r=skvAuditList(data,M);
 root.innerHTML=`<div class="skv">${skvBar(M,'audit')}<div class="skv-list">${r.html}</div></div>`;
 skvBind(root,data,M,'audit',opts,skvAuditList);if(opts.onCount)opts.onCount(r.count);return M}
function renderSkillIcons(root,data,opts={}){const M=skvModel(data);const r=skvIconList(M);
 root.innerHTML=`<div class="skv">${skvBar(M,'icons')}<div class="skv-list skv-icons skv-size-${SKV.size}">${r.html}</div></div>`;
 skvBind(root,data,M,'icons',opts,(d,m)=>skvIconList(m));if(opts.onCount)opts.onCount(r.count);return M}
// 스킬 상세(/skills/<id>/): 카드 한 장 확대 + 효과 스트립(늘 펼침) + 노드 전체 + 이 스킬이 바뀐 기록. 빌드가 미리 만든다.
function skvChangeRows(M,s){const rows=[];const r=M.renamed.get(s.id),ic=M.icon.get(s.id);
 if(M.added.has(s.id))rows.push(`<li><span class="tag new">신규</span> ${esc(s.name)} — 직전 묶음에 없던 ${s.kind==='node'?'노드':'스킬'}</li>`);
 if(r)rows.push(`<li><span class="tag skv-chg">이름 바뀜</span> ${esc(r.from)} → ${esc(r.to)}</li>`);
 if(ic)rows.push(`<li class="skv-iconrow"><span class="tag skv-chg">아이콘 교체</span> ${esc(s.name)} <img src="${esc(ic.previousIcon)}" alt="옛 아이콘" width="40" height="40" loading="lazy"> → <img src="${esc(s.icon)}" alt="새 아이콘" width="40" height="40" loading="lazy"></li>`);
 return rows}
function skvDetail(data,M,s){const groups=(s.groups||[]).map(id=>M.gmap.get(id)).filter(Boolean);const eng=Array.isArray(s.engineEffectItems)?s.engineEffectItems:[];const nodes=M.nodesOf.get(s.id)||[];const n=groups.length+eng.length;
 const meta=[s.kindLabel||s.kind,s.row?`Lv ${s.row}`:'',s.mana&&s.mana!=='0'?`마나 ${s.mana}`:'',s.cooldown&&s.cooldown!=='0'?`쿨 ${s.cooldown}초`:'',s.maxLv?`최대 ${s.maxLv}`:''].filter(Boolean);
 const tree=(SKV_TREES.find(t=>t[0]===skvTreeOf(s))||[,''])[1];
 const own=[...skvChangeRows(M,s),...nodes.flatMap(x=>skvChangeRows(M,x).map(h=>h.replace('<li','<li data-node="1"')))];
 const p=M.previous;
 return`<article class="skv-detail" id="skv-${esc(s.id)}"><div class="skv-detail-head"><button class="skv-icon big" data-skv-zoom aria-label="${esc(s.name)} 아이콘 크게"><img src="${esc(s.icon)}" alt="" width="104" height="104"></button><div class="skv-head"><p class="eyebrow">${esc(tree)} 트리</p><h1>${esc(s.name)}</h1><p class="skv-meta">${esc(meta.join(' · '))}</p><code>${esc(s.id)}</code><div class="skv-badges">${s.implementationEnabled===false?'<span class="tag pending">비활성</span>':''}${skvBadges(M,s)}</div></div></div><p class="skv-desc skv-desc-lg">${esc(s.desc)}</p>`
 +`<section class="skv-sec"><h2>효과 연결 <span class="count">${n}</span></h2>${n?`<div class="skv-strip">${groups.map(skvFxItem).join('')}${eng.map(skvEngineItem).join('')}</div>`:`<p class="minor">${esc(s.effectNote||'독립 프레임 효과 없음 · 아이콘·수치 강화')}</p>`}</section>`
 +`<section class="skv-sec"><h2>강화 노드 <span class="count">${nodes.length}</span></h2>${nodes.length?`<ul class="skv-nodes" aria-label="${esc(s.name)} 강화 노드 ${nodes.length}개">${nodes.map(x=>skvNode(M,x,s.groups||[])).join('')}</ul>`:'<p class="minor">강화 노드 없음</p>'}</section>`
 +`<section class="skv-sec"><h2>이 스킬이 바뀐 기록</h2><p class="minor">${p?`직전 묶음 ${esc(p.createdAt)}(${esc(String(p.sourceCommit).slice(0,8))}) → 이번 묶음 ${esc(data.createdAt||'')}(${esc(String(data.sourceCommit||'').slice(0,8))}) 비교`:'직전 묶음 비교 자료 없음'}</p>${own.length?`<ul class="skv-changes">${own.join('')}</ul>`:(p?'<p>직전 묶음 대비 바뀐 것 없음</p>':'')}</section></article>`}
// ==== 스킬 화면 조각 끝 ====
// ==== 효과·거인 카드 조각: /skills/fx/ · /skills/summons/ 격자 카드. 빌드가 미리 만들고, 브라우저가 자료를 받은 뒤 같은 함수로 다시 그려 재생한다 ====
function connected(g){return g.connection==='connected'}function legacy(g){return g.status==='legacy'||g.status==='superseded'}
function status(g){if(g.connection==='registered'&&!legacy(g))return['등록 · 현재 소비 별도','pending'];if(g.status==='unapproved')return['검토 후보','pending'];if(connected(g))return['코드 연결','current'];if(legacy(g))return['이전 버전','legacy'];return['제작본 · 연결 별도','pending']}
function groupCard(g){const st=status(g);return `<article class="card"><button class="stage" data-open="${esc(g.id)}" aria-label="${esc(g.title)} 크게 보기"><canvas width="560" height="360" aria-label="${esc(g.title)} 프레임 애니메이션"></canvas><span class="frame-label">${g.frames.length}장</span></button><div class="card-content"><div class="tags"><span class="tag ${st[1]}">${st[0]}</span>${g.variant?`<span class="tag">${esc(g.variant)}</span>`:''}</div><h2>${esc(g.title)}</h2><div class="meta">${g.frames.length===1?'정지 이미지':g.frames.length+' 프레임 · '+(g.durations.reduce((a,b)=>a+b,0)/1000).toFixed(2)+'초'}${g.frames.length>1?' · '+esc(g.timingLabel):''}</div><div class="id">${esc(g.shortId||g.id)}</div></div></article>`}
function groupScope(g,scope){if(g.hiddenDuplicate)return false;if(scope==='current'&&legacy(g)&&!connected(g))return false;if(scope==='connected'&&!connected(g))return false;if(scope==='pending'&&(connected(g)||legacy(g)))return false;return true}
// ==== 카드 조각 끝 ====
