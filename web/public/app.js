(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const text = value => typeof value === 'object' && value !== null ? value.text || value.description || value.summary || value.label || JSON.stringify(value) : String(value ?? '');
  const count = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString('ko-KR') : '—';
  const date = value => {
    if (!value) return '기록 없음';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' }).format(d);
  };
  const dateTime = value => {
    if (!value) return '기록 없음';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(d) + ' KST';
  };
  const shortCommit = value => value ? String(value).slice(0, 8) : '기록 없음';
  const imagePath = value => {
    const raw = typeof value === 'object' && value ? value.src || value.path || value.url : value;
    if (!raw || typeof raw !== 'string') return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^\/(?!\/)/.test(raw)) return raw;
    if (/^(?:[a-z]+:|\/\/)/i.test(raw) || raw.includes('..')) return '';
    return '/maps/' + raw.replace(/^\.\//, '');
  };
  const kinds = { actual: '실제 캡처', 'actual-overview': '실제 전체맵 캡처', 'actual-player': '실제 플레이 화면', 'actual-comparison': '실제 캡처 비교', screenshot: '실제 캡처', runtime: '실행 화면', maker: 'Maker 캡처', offline: '오프라인 미리보기', render: '오프라인 미리보기', 'offline-render': '오프라인 미리보기', 'offline-preview': '오프라인 미리보기', 'offline-diagram': '오프라인 구조도', diagram: '구조도', schematic: '구조도', layout: '구조도', preview: '미리보기' };
  const kindLabel = value => kinds[String(value || '').toLowerCase()] || value || '미리보기';
  const statusLabel = value => ({ ready: '자료 준비됨', complete: '완료 기록', implemented: '구현 기록', approved: '승인된 정책', draft: '초안', planned: '계획', pending: '확인 대기', review: '검토 중', 'needs-review': '검토 필요', verified: '검증 기록', active: '적용 정책', current: '현재 정책', unknown: '확인 필요' }[value] || value || '상태 미기록');
  const actLabel = value => value === undefined || value === null || value === '' ? '기타' : /^\d+$/.test(String(value)) ? `ACT ${value}` : String(value);
  const state = { route: 'home', maps: [], policies: [], site: {}, mapData: {}, policyData: {}, errors: [], query: { maps: '', policies: '' }, filter: { maps: '', policies: '' }, ready: false };
  const pageNames = { home: '오버뷰', maps: '맵 아카이브', policies: '게임 정책', history: '스냅샷 기록' };
  const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>';
  const arrow = '<span aria-hidden="true">↗</span>';
  let lastFocused = null;

  function normalizeMap(map, index) {
    const screenshots = list(map.screenshots).map(s => typeof s === 'string' ? { src: s, kind: 'preview' } : s).filter(Boolean);
    const preview = map.preview || map.thumbnail || screenshots[0]?.src;
    const previewObject = typeof preview === 'object' && preview ? preview : { src: preview };
    const previewSrc = imagePath(previewObject);
    const previewKind = previewObject.kind || map.previewKind || map.thumbnailKind || screenshots.find(s => imagePath(s) === previewSrc)?.kind || screenshots[0]?.kind || 'preview';
    if (previewSrc && !screenshots.length) screenshots.push({ ...previewObject, src: previewSrc, label: map.previewLabel, kind: previewKind });
    return { ...map, id: String(map.id ?? `map-${index}`), name: map.name || map.title || map.id || '이름 없는 맵', actLabel: actLabel(map.act), previewSrc, previewKind, screenshots, notes: list(map.notes), sourceRefs: list(map.sourceRefs) };
  }
  function normalizePolicy(policy, index) {
    return { ...policy, id: String(policy.id ?? `policy-${index}`), title: policy.title || policy.name || '제목 없는 정책', category: policy.category || '일반', summary: text(policy.summary), sourceRefs: list(policy.sourceRefs) };
  }
  function latestDate() { return state.site.builtAt || state.site.updatedAt || state.mapData.updatedAt || state.policyData.updatedAt; }
  function errorBanner() {
    if (!state.errors.length) return '';
    return `<div class="error-banner" role="alert">${escape(state.errors.join(' · '))} 자료를 불러오지 못했습니다.<button type="button" data-action="retry">다시 시도</button></div>`;
  }
  function heading(eyebrow, title, description, showDate = true) {
    return `<div class="page-heading"><div><div class="eyebrow">${escape(eyebrow)}</div><h1>${escape(title)}</h1><p class="page-description">${escape(description)}</p></div>${showDate ? `<div class="snapshot-chip"><span>●</span> ${escape(date(latestDate()))} 스냅샷</div>` : ''}</div>`;
  }
  function mapCard(map) {
    return `<button class="map-card" type="button" data-map="${escape(map.id)}" aria-label="${escape(map.name)} 상세 보기"><div class="map-image">${map.previewSrc ? `<img src="${escape(map.previewSrc)}" alt="${escape(map.name)} ${escape(kindLabel(map.previewKind))}" loading="lazy">` : '<span class="placeholder-map" aria-hidden="true">▧</span>'}<span class="image-kind">${escape(map.previewSrc ? kindLabel(map.previewKind) : '미리보기 준비 전')}</span></div><div class="map-card-body"><div class="map-card-eyebrow">${escape(map.actLabel)} <span aria-hidden="true">/</span> ${escape(map.id)}</div><div class="map-card-title"><h3>${escape(map.name)}</h3>${arrow}</div><div class="map-card-meta"><span class="tag">${escape(statusLabel(map.status))}</span>${map.role ? `<span class="tag">${escape(map.role)}</span>` : ''}${map.difficulty ? `<span class="tag amber">${escape(map.difficulty)}</span>` : ''}</div></div></button>`;
  }
  function policyRow(policy) {
    return `<button class="policy-row" type="button" data-policy="${escape(policy.id)}"><span class="policy-icon" aria-hidden="true">≡</span><span class="policy-row-content"><h3>${escape(policy.title)}</h3><p>${escape(policy.category)} · ${escape(policy.summary || statusLabel(policy.status))}</p></span><span class="policy-row-arrow" aria-hidden="true">↗</span></button>`;
  }
  function empty(message, detail = '다른 검색어나 필터를 선택해 보세요.') { return `<div class="empty-state"><strong>${escape(message)}</strong>${escape(detail)}</div>`; }
  function home() {
    const site = state.site;
    const assets = site.asset || site.assets || {};
    const mapStats = site.map || {};
    const heroMap = state.maps.find(m => m.previewSrc && !/diagram|schematic|layout/.test(m.previewKind)) || state.maps.find(m => m.previewSrc);
    const featuredMaps = [...state.maps.filter(m => m.previewSrc), ...state.maps.filter(m => !m.previewSrc)].slice(0, 2);
    return `${heading('THE PROJECT, IN ONE PLACE', '게임을 이루는 모든 것.', 'Catch & Keep의 에셋, 맵, 게임 정책을 연결하는 프로젝트 라이브러리.')}
      <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><div class="hero-kicker">CATCH & KEEP ARCHIVE</div><h2 id="hero-title">작은 디테일부터,<br>하나의 세계까지.</h2><p>움직이는 에셋과 맵의 구성,<br>플레이를 만드는 규칙을 둘러보세요.</p><a class="button" href="/assets/">에셋 라이브러리 열기 ${arrow}</a></div><div class="hero-visual" aria-hidden="true">${heroMap ? `<img src="${escape(heroMap.previewSrc)}" alt=""><span class="hero-visual-label">${escape(heroMap.name)} · ${escape(kindLabel(heroMap.previewKind))}</span>` : '<div class="terrain-art"></div><span class="hero-visual-label">EXPLORE THE WORLD</span>'}</div></section>
      <section class="stats" aria-label="라이브러리 자료 현황"><div class="stat"><div class="stat-label">스킬 에셋 <span class="stat-symbol" aria-hidden="true">✦</span></div><div class="stat-value">${count(assets.skillCount)}<small>종</small></div><div class="stat-note">스킬 모션과 이펙트 아틀라스</div></div><div class="stat"><div class="stat-label">전체 맵 <span class="stat-symbol" aria-hidden="true">▧</span></div><div class="stat-value">${count(mapStats.total ?? state.maps.length)}<small>개</small></div><div class="stat-note">${count(mapStats.withPreview ?? state.maps.filter(m => m.previewSrc).length)}개 맵에 미리보기 포함</div></div><div class="stat"><div class="stat-label">게임 정책 <span class="stat-symbol" aria-hidden="true">≡</span></div><div class="stat-value">${count(site.policy?.count ?? state.policies.length)}<small>건</small></div><div class="stat-note">설계 문서에서 확인한 규칙</div></div><div class="stat"><div class="stat-label">고유 이미지 <span class="stat-symbol" aria-hidden="true">▦</span></div><div class="stat-value">${count(assets.uniqueImages)}<small>장</small></div><div class="stat-note">${assets.fxGroups !== undefined ? `FX ${count(assets.fxGroups)} · 소환수 ${count(assets.summonGroups)} 그룹` : '원본 에셋 이미지 모음'}</div></div></section>
      <div class="home-grid"><section><div class="section-title"><h2>맵 둘러보기</h2><a class="text-link" href="#maps">전체 맵 보기 <span aria-hidden="true">→</span></a></div><div class="map-grid">${featuredMaps.length ? featuredMaps.map(mapCard).join('') : empty('등록된 맵 자료가 없습니다.', '맵 스냅샷이 준비되면 이곳에서 볼 수 있어요.')}</div></section><section><div class="section-title"><h2>게임의 규칙</h2><a class="text-link" href="#policies">모든 정책 <span aria-hidden="true">→</span></a></div><div class="policy-list">${state.policies.length ? state.policies.slice(0, 4).map(policyRow).join('') : empty('등록된 정책이 없습니다.', '설계 문서의 정책을 이곳에 모읍니다.')}</div></section></div>
      <aside class="library-callout"><span class="callout-icon" aria-hidden="true">◷</span><div><h3>자료의 기준 시점을 함께 확인하세요.</h3><p>미리보기 종류와 출처, 스냅샷 날짜를 각 자료에 표시합니다.</p></div><a href="#history">스냅샷 기록 <span aria-hidden="true">→</span></a></aside>`;
  }
  function toolbar(type, categories, label, placeholder) {
    return `<div class="toolbar"><label class="search-box">${searchIcon}<input id="collection-search" type="search" aria-label="${escape(label)} 검색" placeholder="${escape(placeholder)}" value="${escape(state.query[type])}" autocomplete="off"></label><select id="collection-filter" aria-label="${escape(label)} 분류"><option value="">전체 ${escape(label)}</option>${categories.map(category => `<option value="${escape(category)}" ${state.filter[type] === category ? 'selected' : ''}>${escape(category)}</option>`).join('')}</select><div id="result-count" class="result-count" aria-live="polite"></div></div>`;
  }
  function mapsPage() {
    const summary = typeof state.mapData.summary === 'string' ? state.mapData.summary : state.mapData.summary?.text;
    return `${heading('WORLD ARCHIVE', '맵 아카이브', '맵의 구조와 미리보기를 살펴보고, 원본 자료의 확인 상태를 함께 확인하세요.')}${toolbar('maps', [...new Set(state.maps.map(m => m.actLabel))], '구역', '맵 이름, ID, 구역 검색…')}<p class="collection-note">${escape(summary || '구조도 · 오프라인 미리보기 · 실제 캡처를 구분해 표시합니다. 미리보기는 게임의 최종 실행 화면과 다를 수 있습니다.')}${state.mapData.summary?.scopeNote ? `<br>${escape(state.mapData.summary.scopeNote)}` : ''}</p><div id="collection-results" class="map-grid"></div>`;
  }
  function policyCard(policy) {
    return `<button type="button" class="policy-card" data-policy="${escape(policy.id)}"><span class="policy-card-top"><span class="tag">${escape(policy.category)}</span><span class="tag amber">${escape(statusLabel(policy.status))}</span></span><h3>${escape(policy.title)}</h3><p>${escape(policy.summary)}</p><span class="policy-card-bottom"><span>출처 ${policy.sourceRefs.length}건</span><span>내용 읽기 ↗</span></span></button>`;
  }
  function policiesPage() {
    return `${heading('RULES & DECISIONS', '게임 정책', '게임의 설계 의도와 주요 규칙을 원본 문서의 근거와 함께 읽어보세요.')}${toolbar('policies', [...new Set(state.policies.map(p => p.category))], '분류', '정책 제목, 규칙, 키워드 검색…')}<p class="collection-note">${escape(text(state.policyData.summary) || '문서에 기록된 정책을 정리한 자료입니다. 각 항목의 상태와 출처에서 적용 범위를 확인할 수 있습니다.')}</p><div id="collection-results" class="policy-grid"></div>`;
  }
  function historyPage() {
    let snapshots = list(state.site.snapshots);
    if (!snapshots.length) snapshots = [{ type: '맵 자료', date: state.mapData.updatedAt, sourceCommit: state.mapData.sourceCommit }, { type: '게임 정책', date: state.policyData.updatedAt, sourceCommit: state.policyData.sourceCommit }].filter(s => s.date || s.sourceCommit);
    const typeLabel = type => ({ map: '맵 자료', maps: '맵 자료', policy: '게임 정책', policies: '게임 정책', asset: '에셋 라이브러리', assets: '에셋 라이브러리', site: '라이브러리 빌드', build: '라이브러리 빌드' }[type] || type || '자료 스냅샷');
    return `${heading('SOURCE & SNAPSHOTS', '스냅샷 기록', '현재 라이브러리를 구성하는 자료의 기준 시점과 소스 버전을 확인하세요.', false)}<div class="history-notice"><strong>현재 공개된 자료의 기준 기록입니다.</strong>아래 날짜는 각 자료를 생성하거나 갱신한 시점을 나타냅니다. 실제 서비스 배포 이력이나 게임 실행 검증 기록은 별도로 관리됩니다.</div><div class="section-title"><h2>자료별 스냅샷</h2><span class="muted">${snapshots.length}개 기록</span></div>${snapshots.length ? `<div class="table-wrap"><table class="history-table"><thead><tr><th scope="col">자료</th><th scope="col">기준 날짜</th><th scope="col">소스 커밋</th><th scope="col">기록 유형</th></tr></thead><tbody>${snapshots.map(s => `<tr><td>${escape(typeLabel(s.type || s.name))}</td><td>${escape(date(s.date || s.updatedAt || s.builtAt))}</td><td><code class="code" title="${escape(s.sourceCommit || '')}">${escape(shortCommit(s.sourceCommit))}</code></td><td>${escape(s.description || '콘텐츠 스냅샷')}</td></tr>`).join('')}</tbody></table></div>` : empty('스냅샷 기록이 아직 없습니다.', '자료에 기준 날짜와 소스 커밋이 포함되면 표시됩니다.')}<div class="provenance"><div><strong>라이브러리 빌드</strong> ${escape(date(state.site.builtAt))}</div><div><strong>소스 버전</strong><code class="code">${escape(state.site.sourceCommit || '기록 없음')}</code></div></div>`;
  }
  function renderResults() {
    const type = state.route;
    if (type !== 'maps' && type !== 'policies') return;
    const query = state.query[type].trim().toLocaleLowerCase('ko-KR');
    const data = type === 'maps' ? state.maps : state.policies;
    const filtered = data.filter(item => {
      const category = type === 'maps' ? item.actLabel : item.category;
      const haystack = type === 'maps' ? [item.name, item.id, item.actLabel, item.role] : [item.title, item.category, item.summary, ...list(item.body).map(text)];
      return (!state.filter[type] || category === state.filter[type]) && (!query || haystack.join(' ').toLocaleLowerCase('ko-KR').includes(query));
    });
    $('#collection-results').innerHTML = filtered.length ? filtered.map(type === 'maps' ? mapCard : policyCard).join('') : empty(query || state.filter[type] ? '검색 결과가 없습니다.' : '등록된 자료가 없습니다.', query || state.filter[type] ? '다른 검색어나 필터를 선택해 보세요.' : '자료 스냅샷이 준비되면 이곳에서 볼 수 있어요.');
    $('#result-count').innerHTML = `<strong>${count(filtered.length)}</strong> / ${count(data.length)}개 ${type === 'maps' ? '맵' : '정책'}`;
  }
  function render() {
    const route = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || 'home';
    state.route = Object.hasOwn(pageNames, route) ? route : 'home';
    document.title = `${pageNames[state.route]} — Catch & Keep`;
    $('#breadcrumb-current').textContent = pageNames[state.route];
    document.querySelectorAll('[data-route]').forEach(link => {
      const active = link.dataset.route === state.route;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (!state.ready) return;
    const pages = { home, maps: mapsPage, policies: policiesPage, history: historyPage };
    $('#main').innerHTML = errorBanner() + pages[state.route]();
    renderResults();
  }
  function refsMarkup(refs) {
    return refs.length ? refs.map(ref => {
      const path = typeof ref === 'string' ? ref : ref.path || ref.file || ref.url || '';
      const section = typeof ref === 'object' ? ref.section || ref.label || '' : '';
      return `<div class="source-ref">${section ? `<span>${escape(section)}</span>` : ''}<code>${escape(path)}</code></div>`;
    }).join('') : '<p>연결된 원본 경로가 없습니다.</p>';
  }
  function showDialog(markup, className = '') {
    lastFocused = document.activeElement;
    const dialog = $('#detail-dialog');
    dialog.className = className;
    $('#dialog-content').innerHTML = markup;
    document.body.classList.add('dialog-open');
    dialog.showModal();
    dialog.scrollTop = 0;
    $('.dialog-close').focus();
  }
  function showMap(id) {
    const map = state.maps.find(item => item.id === id);
    if (!map) return;
    const shots = map.screenshots.filter(shot => imagePath(shot));
    showDialog(`<header class="dialog-header"><div class="eyebrow">${escape(map.actLabel)} / ${escape(map.id)}</div><h2 id="dialog-title">${escape(map.name)}</h2><div class="dialog-meta"><span class="tag">${escape(statusLabel(map.status))}</span>${map.role ? `<span class="tag">${escape(map.role)}</span>` : ''}${map.difficulty ? `<span class="tag amber">${escape(map.difficulty)}</span>` : ''}</div></header>${shots.length ? `<div id="map-shot"></div>${shots.length > 1 ? `<div class="image-tabs" aria-label="미리보기 선택">${shots.map((shot, i) => `<button type="button" class="image-tab${i === 0 ? ' active' : ''}" data-shot="${i}" data-shot-map="${escape(map.id)}" aria-pressed="${i === 0}">${escape(shot.label || kindLabel(shot.kind) + ' ' + (i + 1))}</button>`).join('')}</div>` : ''}` : '<div class="dialog-empty">이 맵의 미리보기는 아직 등록되지 않았습니다.</div>'}<section class="dialog-section"><h3>맵 노트</h3>${map.notes.length ? `<ul>${map.notes.map(note => `<li>${escape(text(note))}</li>`).join('')}</ul>` : '<p>추가 설명이 기록되지 않았습니다.</p>'}</section><section class="dialog-section"><h3>원본 자료</h3>${refsMarkup(map.sourceRefs)}<p class="muted" style="margin-top:14px;font-size:11px">자료 기준 ${escape(date(map.updatedAt || state.mapData.updatedAt))} · 소스 ${escape(shortCommit(map.sourceCommit || state.mapData.sourceCommit))}</p></section>`);
    if (shots.length) showShot(map.id, 0);
  }
  function showShot(id, index) {
    const map = state.maps.find(item => item.id === id);
    const shot = map?.screenshots.filter(s => imagePath(s))[index];
    if (!shot) return;
    $('#map-shot').innerHTML = `<figure class="dialog-image"><img src="${escape(imagePath(shot))}" alt="${escape(shot.label || map.name)}"><figcaption><span class="image-kind">${escape(kindLabel(shot.kind || map.previewKind))}</span>${escape(shot.label || map.name)}</figcaption></figure>`;
    document.querySelectorAll('[data-shot]').forEach(button => { const active = Number(button.dataset.shot) === index; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  }
  function bodyMarkup(body) {
    if (Array.isArray(body)) return `<ul class="body-list">${body.map(item => `<li>${escape(text(item))}</li>`).join('')}</ul>`;
    return `<div class="policy-body">${escape(text(body) || '상세 내용이 기록되지 않았습니다.')}</div>`;
  }
  function showPolicy(id) {
    const policy = state.policies.find(item => item.id === id);
    if (!policy) return;
    showDialog(`<header class="dialog-header"><div class="eyebrow">${escape(policy.category)}</div><h2 id="dialog-title">${escape(policy.title)}</h2><div class="dialog-meta"><span class="tag amber">${escape(statusLabel(policy.status))}</span><span class="tag">${escape(policy.id)}</span></div>${policy.summary ? `<p class="page-description">${escape(policy.summary)}</p>` : ''}</header><section class="dialog-section"><h3>정책 내용</h3>${bodyMarkup(policy.body || policy.content)}</section><section class="dialog-section"><h3>정책 근거</h3>${refsMarkup(policy.sourceRefs)}<p style="margin-top:14px;font-size:11px">자료 기준 ${escape(date(policy.updatedAt || state.policyData.updatedAt))} · 소스 ${escape(shortCommit(policy.sourceCommit || state.policyData.sourceCommit))}</p></section>`, 'dialog-policy');
  }
  async function load() {
    state.errors = [];
    const names = ['맵', '정책', '사이트'];
    const results = await Promise.allSettled(['/data/maps.json', '/data/policies.json', '/data/site.json'].map(async url => { const response = await fetch(url, { cache: 'no-cache' }); if (!response.ok) throw new Error(String(response.status)); return response.json(); }));
    results.forEach((result, index) => { if (result.status === 'rejected') state.errors.push(names[index]); });
    state.mapData = results[0].status === 'fulfilled' ? results[0].value : {};
    state.policyData = results[1].status === 'fulfilled' ? results[1].value : {};
    state.site = results[2].status === 'fulfilled' ? results[2].value : {};
    state.maps = list(Array.isArray(state.mapData) ? state.mapData : state.mapData.maps).map(normalizeMap);
    state.policies = list(Array.isArray(state.policyData) ? state.policyData : state.policyData.policies).map(normalizePolicy);
    state.ready = true;
    $('#nav-map-count').textContent = String(state.maps.length);
    $('#footer-updated').textContent = `스냅샷 기준 ${dateTime(latestDate())}`;
    render();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-map')) showMap(button.dataset.map);
    if (button.hasAttribute('data-policy')) showPolicy(button.dataset.policy);
    if (button.hasAttribute('data-shot')) showShot(button.dataset.shotMap, Number(button.dataset.shot));
    if (button.dataset.action === 'retry') { button.disabled = true; button.textContent = '불러오는 중…'; load(); }
    if (button.classList.contains('dialog-close')) $('#detail-dialog').close();
  });
  document.addEventListener('input', event => { if (event.target.id === 'collection-search') { state.query[state.route] = event.target.value; renderResults(); } });
  document.addEventListener('change', event => { if (event.target.id === 'collection-filter') { state.filter[state.route] = event.target.value; renderResults(); } });
  document.addEventListener('error', event => {
    const image = event.target;
    if (image.tagName !== 'IMG') return;
    image.hidden = true;
    if (image.closest('.map-image')) image.parentElement.insertAdjacentHTML('afterbegin', '<span class="placeholder-map" aria-hidden="true">▧</span>');
    else if (image.closest('.dialog-image')) image.insertAdjacentHTML('afterend', '<div class="image-error">이미지를 불러오지 못했습니다. 원본 자료 경로를 확인해 주세요.</div>');
  }, true);
  $('#detail-dialog').addEventListener('click', event => { if (event.target === $('#detail-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
  $('#detail-dialog').addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (lastFocused?.isConnected) lastFocused.focus(); });
  window.addEventListener('hashchange', () => { if ($('#detail-dialog').open) $('#detail-dialog').close(); render(); window.scrollTo({ top: 0 }); });
  render();
  load();
})();
