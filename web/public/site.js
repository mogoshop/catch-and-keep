// 사이트 공용 동작: 접힘 메뉴 · 옛 해시 주소 옮기기 · 목록 필터(?q= ?act= ?role= ?cat=) · 맵 그림 고르기. 화면은 빌드가 미리 만든다.
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
    const apply = push => {
      const q = (input ? input.value : '').trim().toLowerCase();
      let shown = 0;
      for (const el of items) {
        const ok = keys.every(k => !state[k] || el.dataset[k] === state[k]) && (!q || (el.dataset.text || '').includes(q));
        el.hidden = !ok; if (ok) shown++;
      }
      document.querySelectorAll('[data-group]').forEach(g => { g.hidden = !g.querySelector('[data-item]:not([hidden])'); });
      root.querySelectorAll('[data-filter]').forEach(a => { if (a.dataset.value === state[a.dataset.filter]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
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
})();
