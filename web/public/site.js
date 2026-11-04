// 사이트 공용 동작: 접힘 메뉴 · 옛 해시 주소 옮기기 · 필터 서랍 · 목록 필터(?q= ?act= ?role= ?cat=) · 적용 칩 · 홈 키 아트·영상 · 맵 그림 고르기. 화면은 빌드가 미리 만든다.
(() => {
  'use strict';
  // 옛 주소 호환: /#maps → /maps/ · /assets/(→ /skills/)#pick/… → /skills/pick/?view=…
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash && hash !== 'main') {
    const page = { home: '/', maps: '/maps/', policies: '/rules/', history: '/changelog/', fx: '/skills/fx/', summon: '/skills/summons/', icons: '/skills/icons/', audit: '/skills/' };
    const pick = hash.match(/^pick(?:\/(current|fx|maple|reco|compare))?(?:\/([\w-]+))?/);
    const p = location.pathname;
    if ((p === '/' || p === '/index.html') && page[hash]) { location.replace(page[hash]); return; }
    if (p.startsWith('/skills/') || p.startsWith('/assets/')) {
      if (pick) { const q = new URLSearchParams(); if (pick[1]) q.set('view', pick[1]); if (pick[2]) q.set('slot', pick[2]); location.replace('/skills/pick/' + (q.toString() ? '?' + q : '')); return; }
      if (page[hash] && page[hash].startsWith('/skills/')) { location.replace(page[hash]); return; }
    }
  }
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('nav-open', open); });

  // 필터 서랍(3층): [data-drawer-open="id"] 단추로 열고 [data-drawer-close]·Esc·바깥 그늘로 닫는다. 내용이 다시 그려져도 동작하도록 문서에 한 번만 건다
  let opener = null;
  const shadeOf = d => d.previousElementSibling && d.previousElementSibling.classList.contains('drawer-shade') ? d.previousElementSibling : null;
  const closeDrawer = () => {
    document.querySelectorAll('.drawer:not([hidden])').forEach(d => { d.hidden = true; const sh = shadeOf(d); if (sh) sh.hidden = true; });
    document.querySelectorAll('[data-drawer-open][aria-expanded=true]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (opener) { opener.focus(); opener = null; }
  };
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-drawer-open]');
    if (o) { const d = document.getElementById(o.dataset.drawerOpen); if (!d) return; closeDrawer(); d.hidden = false; const sh = shadeOf(d); if (sh) sh.hidden = false; o.setAttribute('aria-expanded', 'true'); opener = o; const f = d.querySelector('button,select,input,a'); if (f) f.focus(); return; }
    if (e.target.closest('[data-drawer-close]')) closeDrawer();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.drawer:not([hidden])')) closeDrawer(); });

  // 홈 키 아트: 점 넘김(자동 넘김 없음)
  document.querySelectorAll('[data-keyart]').forEach(box => {
    const slides = [...box.querySelectorAll('[data-slide]')], cap = box.querySelector('[data-keyart-cap]');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-dot]'); if (!b) return;
      slides.forEach(img => { img.hidden = img.dataset.slide !== b.dataset.dot; });
      box.querySelectorAll('[data-dot]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      if (cap) cap.textContent = b.dataset.cap || '';
    });
  });
  // 플레이 영상: 누르면 그때 iframe을 싣는다(처음엔 썸네일만 · 자동 재생 없음)
  document.querySelectorAll('[data-yt]').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.dataset.yt) + '?autoplay=1&rel=0';
    f.title = '메이플 리저렉션 플레이 영상'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    const box = document.createElement('div'); box.className = 'yt'; box.appendChild(f); b.replaceWith(box);
  }));

  // 목록 필터: 링크(?act=1)는 JS 없이도 주소가 되고, JS가 있으면 새로 읽지 않고 거른다
  const root = document.querySelector('[data-filter-root]');
  if (root) {
    const params = new URLSearchParams(location.search);
    const keys = [...new Set([...root.querySelectorAll('[data-filter]')].map(a => a.dataset.filter))];
    const state = Object.fromEntries(keys.map(k => [k, params.get(k) || '']));
    const input = root.querySelector('input[type=search]');
    if (input) input.value = params.get('q') || '';
    const items = [...document.querySelectorAll('[data-item]')];
    const count = root.querySelector('[data-count]');
    const empty = document.querySelector('[data-empty]');
    const noun = root.dataset.noun || '';
    const drawerKeys = (root.dataset.drawerKeys || '').split(',').filter(Boolean);
    const apply = push => {
      const q = (input ? input.value : '').trim().toLowerCase();
      let shown = 0;
      for (const el of items) {
        const ok = keys.every(k => !state[k] || el.dataset[k] === state[k]) && (!q || (el.dataset.text || '').includes(q));
        el.hidden = !ok; if (ok) shown++;
      }
      document.querySelectorAll('[data-group]').forEach(g => { g.hidden = !g.querySelector('[data-item]:not([hidden])'); });
      root.querySelectorAll('[data-filter]').forEach(a => { if (a.dataset.value === state[a.dataset.filter]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      const applied = root.querySelector('[data-applied]');
      if (applied) {
        applied.innerHTML = drawerKeys.filter(k => state[k]).map(k => { const a = root.querySelector(`[data-filter="${k}"][data-value="${CSS.escape(state[k])}"]`); const label = a ? a.childNodes[0].textContent.trim() : state[k]; return `<button type="button" data-clear="${k}">${label.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))} <svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg><span class="sr-only">지우기</span></button>`; }).join('');
      }
      const n = drawerKeys.filter(k => state[k]).length;
      root.querySelectorAll('[data-filter-n]').forEach(el => { el.textContent = n ? String(n) : ''; });
      if (count) count.textContent = `${shown}${noun === '규칙' ? '건' : '개 ' + noun}${shown !== items.length ? ` / 전체 ${items.length}` : ''}`;
      if (empty) empty.hidden = shown > 0;
      if (push) {
        const p = new URLSearchParams();
        for (const k of keys) if (state[k]) p.set(k, state[k]);
        if (q) p.set('q', q);
        history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
      }
    };
    root.addEventListener('click', e => {
      const c = e.target.closest('[data-clear]');
      if (c) { state[c.dataset.clear] = ''; apply(true); return; }
      const a = e.target.closest('[data-filter]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); state[a.dataset.filter] = a.dataset.value; apply(true);
    });
    if (input) input.addEventListener('input', () => apply(true));
    apply(false);
  }

  // 맵 상세: 전체 캡처 · 구역 그림 등 고르기
  document.querySelectorAll('[data-shots]').forEach(box => {
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-shot]');
      if (!b) return;
      box.querySelectorAll('[data-shot]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      box.querySelectorAll('[data-shot-panel]').forEach(p => { p.hidden = p.dataset.shotPanel !== b.dataset.shot; });
    });
  });
  // 검수 자료실: [data-lightbox] 사진을 누르면 확대 창(←/→ 넘김 · Esc 닫기). 스크립트가 없으면 링크가 원본 JPEG를 연다
  const lb = document.querySelector('dialog.rv-lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const shots = [...document.querySelectorAll('a[data-lightbox]')];
    const img = lb.querySelector('[data-lb-img]'), cap = lb.querySelector('[data-lb-cap]'), num = lb.querySelector('[data-lb-n]');
    let at = 0;
    const show = i => { at = (i + shots.length) % shots.length; const a = shots[at]; img.src = a.href; img.alt = a.dataset.caption || ''; cap.textContent = a.dataset.caption || ''; num.textContent = (at + 1) + ' / ' + shots.length; };
    shots.forEach((a, i) => a.addEventListener('click', e => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); show(i); lb.showModal(); }));
    lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(at - 1));
    lb.querySelector('[data-lb-next]').addEventListener('click', () => show(at + 1));
    lb.querySelector('[data-lb-close]').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(at - 1); else if (e.key === 'ArrowRight') show(at + 1); });
  }
})();
