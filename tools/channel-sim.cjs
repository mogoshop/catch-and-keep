// 채널·방 배정 시뮬레이션 (docs/design/30 §3 근거 · 10-22). 사용: node tools/channel-sim.cjs
// 접속·퇴장이 이어지는 상태에서 「모여서 함께 출발」 vs 「바로 입장」 · 채널 상한별 친구 합류 실패율을 잰다.
// 엔진 흉내: 새로 온 사람은 빈자리 채널 중 가장 붐비는 곳(MSW 문서 World Instances), 가득 찬 채널로 워프 = 튕김.
// 「파티 먼저 모으고 함께 입장」: 친구들은 각자 아무 채널 로비에 도착 → 파티 코드로 모임 → 팀장이 시작하면
// 파티 전원이 들어갈 자리가 있는 채널(이미 거기 있는 사람 제외 필요 자리)을 골라 함께 옮기고 그 채널에 방을 만든다.
// 나중에 오는 친구(게임 도중 합류)는 따로 측정: 방 채널에 자리 있으면 바로, 없으면 「기다리는 친구 우선」으로 대기.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function sim(opt, seed) {
  const r = rng(seed);
  const { E, ccu, lateShare, hybrid } = opt;
  const T = 5 * 3600, warm = 3600, meanSession = 3600, rate = ccu / meanSession;
  const ch = []; let chId = 0; const rooms = new Map(); const users = new Map(); let uid = 0; const waiting = new Map();
  const st = { parties: 0, partyFail: 0, partyWait: 0, late: 0, lateFail: 0, kicks: 0, half: 0, hs: 0, chs: 0, extraMoves: 0, people: 0 };
  const now = { t: 0 }; const W = id => ch.find(w => w.id === id);
  const engine = () => { let b = null; for (const w of ch) if (w.cur < E && (!b || w.cur > b.cur)) b = w; if (!b) { b = { id: ++chId, cur: 0 }; ch.push(b); } b.cur++; return b.id; };
  const other = ex => { let b = null; for (const w of ch) if (w.id !== ex && w.cur < E && !(waiting.get(w.id) > 0) && (!b || w.cur > b.cur)) b = w; return b; };
  const move = (u, to) => { const w = W(to); if (!w || w.cur >= E) { st.kicks++; return false; } W(u.ch).cur--; w.cur++; u.ch = to; if (now.t > warm) st.extraMoves++; return true; };
  const events = []; const push = (t, fn) => events.push({ t, fn });
  const leave = id => { const u = users.get(id); if (!u) return; u.gone = true; W(u.ch).cur--; if (u.room) { const rm = rooms.get(u.room); if (rm) { rm.c--; if (rm.c <= 0) rooms.delete(u.room); } } users.delete(id); for (let i = ch.length - 1; i >= 0; i--) if (ch[i].cur === 0) { for (const [k, rm] of rooms) if (rm.ch === ch[i].id) rooms.delete(k); ch.splice(i, 1); } };
  const arrive = () => { const id = ++uid; const u = { ch: engine(), room: null }; users.set(id, u); if (now.t > warm) st.people++; push(now.t + -Math.log(1 - r()) * meanSession, () => leave(id)); if (waiting.get(u.ch) > 0) { const t = other(u.ch); if (t) move(u, t.id); } return u; };
  const newRoom = (u, x, kind) => { const id = 'r' + (++uid); rooms.set(id, { ch: u.ch, x, c: 1, kind }); u.room = id; return id; };
  const startParty = (members, size, start, tries) => {
    const alive = members.filter(m => !m.gone); if (alive.length === 0) return;
    // 이미 그 채널에 있는 사람은 자리가 필요 없다 → 필요 자리 = 다른 채널에 있는 인원. 가장 붐비는(채워 넣기) 곳 중 들어가는 곳
    let best = null, bestNeed = 0;
    for (const w of ch) { const need = alive.filter(m => m.ch !== w.id).length; if (w.cur + need <= E && (!best || w.cur > best.cur)) { best = w; bestNeed = need; } }
    if (!best) { if (now.t - start > 600) { if (start > warm) st.partyFail++; return; } push(now.t + 5, () => startParty(members, size, start, tries + 1)); return; }
    for (const m of alive) if (m.ch !== best.id) move(m, best.id);
    const id = newRoom(alive[0], size, 'private'); rooms.get(id).c = alive.length; for (const m of alive) m.room = id;
    if (start > warm) { st.parties++; st.partyWait += now.t - start; }
    return id;
  };
  const tryJoin = (u, id, start) => {
    if (u.gone) return; const rm = rooms.get(id);
    const done = () => { if (u.waitingOn) { waiting.set(u.waitingOn, waiting.get(u.waitingOn) - 1); u.waitingOn = null; } };
    if (!rm || rm.c >= rm.x) { done(); return; }
    if (rm.ch !== u.ch && W(rm.ch).cur >= E) {
      if (now.t - start >= 600) { done(); if (start > warm) st.lateFail++; return; }
      if (!u.waitingOn) { u.waitingOn = rm.ch; waiting.set(rm.ch, (waiting.get(rm.ch) || 0) + 1); }
      push(now.t + 5, () => tryJoin(u, id, start)); return;
    }
    done(); if (rm.ch !== u.ch && !move(u, rm.ch)) return; rm.c++; u.room = id;
  };
  let tNext = 0;
  const spawn = () => {
    const p = r();
    if (p < 0.2) newRoom(arrive(), 1, 'solo');
    else if (p < 0.7) { const u = arrive(); let best = null; for (const [id, rm] of rooms) if (rm.kind === 'public' && rm.c < rm.x && (rm.ch === u.ch || W(rm.ch).cur < E)) { if (!best || (rm.ch === u.ch && rooms.get(best).ch !== u.ch)) best = id; } if (best) tryJoin(u, best, now.t); else newRoom(u, 4, 'public'); }
    else {
      // 친구팀: 2~4명. 대부분은 1~2분 안에 모여 함께 시작, 일부(lateShare)는 게임 도중 0~10분 뒤 합류
      const size = 2 + Math.floor(r() * 3); const lead = arrive(); const members = [lead]; const start = now.t;
      if (hybrid) {
        let best = null; for (const w of ch) { const need = (w.id === lead.ch ? 0 : 1) + size - 1; if (w.cur + need <= E && (!best || w.cur > best.cur)) best = w; }
        if (best && best.id !== lead.ch) move(lead, best.id);
        const id = newRoom(lead, size, 'private'); if (now.t > warm) st.parties++;
        for (let k = 1; k < size; k++) { const late = r() < lateShare; push(now.t + (late ? 120 + r() * 600 : r() * 120), () => { const m = arrive(); if (now.t > warm) st.late++; tryJoin(m, id, now.t); }); }
        return;
      }
      let gathered = 1, lateCount = 0; const plan = [];
      for (let k = 1; k < size; k++) { const late = r() < lateShare; if (late) lateCount++; plan.push(late); }
      const onTime = plan.filter(x => !x).length; let roomId = null;
      const tryStart = () => { if (gathered === onTime + 1) roomId = startParty(members, size, start, 0); };
      if (onTime === 0) tryStart();
      for (const late of plan) {
        if (!late) push(now.t + r() * 120, () => { members.push(arrive()); gathered++; tryStart(); });
        else push(now.t + 120 + r() * 600, () => { const m = arrive(); if (now.t > warm) st.late++; if (roomId) tryJoin(m, roomId, now.t); });
      }
    }
  };
  while (now.t < T) {
    events.sort((a, b) => a.t - b.t);
    if (events.length && events[0].t < tNext) { const e = events.shift(); now.t = e.t; e.fn(); continue; }
    now.t = tNext; spawn(); tNext = now.t - Math.log(1 - r()) / rate;
    if (now.t > warm && r() < 0.05) { let h = 0; for (const rm of rooms.values()) if (rm.kind === 'public' && rm.c < rm.x && W(rm.ch) && W(rm.ch).cur >= E) h++; st.half += h; st.hs++; st.chs += ch.length; }
  }
  return st;
}
for (const lateShare of [0, 0.25]) { console.log(`--- 늦게 오는 친구 ${lateShare * 100}% (나머지는 2분 안)`);
for (const ccu of [30, 120, 300]) for (const E of [12, 16, 20]) for (const hybrid of [false, true]) {
  const a = {}; for (let seed = 1; seed <= 30; seed++) { const s = sim({ E, ccu, lateShare, hybrid }, seed); for (const k in s) a[k] = (a[k] || 0) + s[k]; }
  const name = hybrid ? '바로 입장+자리 고르기' : '모여서 함께 입장   ';
  console.log(`동접${String(ccu).padEnd(4)} 채널 ${String(E).padEnd(3)} ${name} 친구 못 만남 ${(100 * (a.partyFail + a.lateFail) / Math.max(1, (hybrid ? 0 : a.parties + a.partyFail) + a.late)).toFixed(2)}% · 튕김 ${a.kicks} · 1인당 추가 이동 ${(a.extraMoves / a.people).toFixed(2)} · 채널 ${(a.chs / a.hs).toFixed(1)}`);
}}
