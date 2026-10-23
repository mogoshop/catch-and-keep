'use strict';
// 말투·용어 검사 (docs/design/32-voice-guide.md). 대사·이야기·지도 소개에 요즘 말·게임 말·숫자·옛 지명이 섞였는지,
// 인물별 말투(npcs.csv voice)를 지키는지 본다. 10-22 사용자: 「프롤로그·NPC 대사·퀘스트 모두 일관성」.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dataDir = process.env.GAME_DATA_DIR || path.join(root, 'data');

function parse(file) {
  const t = fs.readFileSync(path.join(dataDir, file), 'utf8');
  const rows = [];
  let row = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; continue; }
    if (ch === '"') { q = true; continue; }
    if (ch === ',') { row.push(c); c = ''; continue; }
    if (ch === '\n') { row.push(c); rows.push(row); row = []; c = ''; continue; }
    if (ch !== '\r') c += ch;
  }
  if (c || row.length) { row.push(c); rows.push(row); }
  const h = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] || ''])));
}

// 옛 이름·통일한 용어 (어디에도 쓰지 않는다) · 요즘 말·게임 말·수량 (대사·소개글에 쓰지 않는다)
const OLD = ['검은 돌', '검은 조각', '잿빛 변경', '불의 심연', '잿불 협곡'];
const BANNED = ['대박', '좋은 의미로', '소름', '공짜', '레벨', '퀘스트', '아이템', '스킬', '버프', '보스', '능력치', '경험치', '소켓권', '웨이포인트',
  '마리쯤', '마리만', ...OLD];
const VOICES = ['haera', 'hage', 'haeyo', 'hasipsio', 'hao'];
const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);

function scan(where, text, { digits = true } = {}) {
  for (const w of BANNED) if (text.includes(w)) bad(where, `쓰지 않는 말 「${w}」`);
  if (digits && /[0-9]/.test(text.replace(/<[^>]*>/g, '').replace(/[0-9]+층/g, ''))) bad(where, '대사에 숫자 (수량·시간은 목표 칸이나 흐린 안내 줄로)');
}

// 말투: 문장 끝을 본다 (따옴표 안 인용·말줄임은 빼고)
function endings(text) {
  return text.replace(/「[^」]*」/g, '').split(/[/^\n]/).flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((x) => x.trim().replace(/[.?!…~—\s]+$/, '')).filter((x) => x.length > 1);
}
const POLITE = /(요|니다|니까|십시오|시지요|지요|세요|죠)$/;
const HAO = /(오|소|시오|요)$/;
function voiceCheck(where, voice, text) {
  const ends = endings(text);
  if (voice === 'haeyo' || voice === 'hasipsio') {
    // 「…까지」「…에게」 같은 말줄임 조각은 끝맺음이 아니다
    const plain = ends.filter((e) => !POLITE.test(e) && !/(까지|에게)$/.test(e) && /(다|군|네|나|지|라|마|게|야|어|아|워|해|냐|자|래)$/.test(e));
    if (plain.length) bad(where, `존댓말 인물인데 반말 끝맺음 「${plain[0]}」`);
  } else if (voice === 'hao') {
    // 하오체도 명사 뒤에는 「~요」(「사디크요」「올 거요」)를 쓴다. 해요체 끝맺음만 걸러낸다
    const odd = ends.filter((e) => /(니다|세요|어요|아요|에요|예요|해요)$/.test(e));
    if (odd.length) bad(where, `하오체 인물인데 「${odd[0]}」`);
  } else {
    const odd = ends.filter((e) => /(니다|세요|어요|아요|에요|예요|해요)$/.test(e));
    if (odd.length) bad(where, `반말·하게체 인물인데 존댓말 끝맺음 「${odd[0]}」`);
  }
}

const npcs = parse('npcs.csv');
const voiceOf = {};
npcs.forEach((n) => {
  if (!VOICES.includes(n.voice)) bad(`npcs.csv ${n.kind}`, `voice '${n.voice}' — ${VOICES.join('/')} 중 하나`);
  voiceOf[n.kind] = n.voice;
});
voiceOf.qm = 'hasipsio';   // 카라반 보급관 자파르 (상점 자리, docs/design/31 §5)

// 이야기·마을 사람 한마디
const SPEAKER_VOICE = { 오렌: 'haera', 고르: 'hasipsio', 엘리안: 'haeyo' };
for (const r of parse('story.csv')) {
  const where = `story.csv ${r.key}`;
  if (/^lock_act|_title$|_sub$/.test(r.key)) { scan(where, r.text, { digits: false }); continue; }
  scan(where, r.text);
  // 「혼각」은 프롤로그가 이름을 붙일 때 한 번만 — 대사는 모두 「조각」 (10-23 사용자: 누구는 혼각, 누구는 조각)
  if (r.key !== 'prologue' && r.text.includes('혼각')) bad(where, '대사에 「혼각」 — 대사는 「조각」으로');
  const m = r.key.match(/^(?:idle|cheer_\d|shade)_([a-z]+)/);
  if (m && voiceOf[m[1]]) voiceCheck(where, voiceOf[m[1]], r.text);
  if (/^(scene\d|reveal)$/.test(r.key)) {
    for (const page of r.text.split('/')) {
      const [who, line] = page.includes('|') ? page.split('|') : ['', page];
      // 고르는 정체가 드러나는 reveal에서만 공손함을 버린다 (연출)
      if (SPEAKER_VOICE[who] && !(r.key === 'reveal' && who === '고르')) voiceCheck(`${where} ${who}`, SPEAKER_VOICE[who], line);
    }
  }
}

// 퀘스트 대사 (desc·objective는 시스템 안내라 숫자 허용)
for (const q of parse('quests.csv')) {
  for (const col of ['intro', 'outro']) {
    const where = `quests.csv 「${q.title}」 ${col}`;
    scan(where, q[col]);
    if (q[col].includes('혼각')) bad(where, '대사에 「혼각」 — 대사는 「조각」으로');
    if (voiceOf[q.giver]) voiceCheck(where, voiceOf[q.giver], q[col]);
  }
  for (const col of ['title', 'desc', 'objective', 'zone']) {
    for (const w of OLD) if (q[col].includes(w)) bad(`quests.csv 「${q.title}」 ${col}`, `옛 이름·금지 용어 「${w}」`);
  }
}

// 지도 소개 · 몬스터 설명
for (const m of parse('maps.csv')) {
  scan(`maps.csv ${m.id} flavor`, m.flavor);
  for (const w of OLD) if (m.name.includes(w)) bad(`maps.csv ${m.id} name`, `옛 이름 「${w}」`);
}
for (const m of parse('monsters.csv')) if (m.lore) scan(`monsters.csv ${m.id} lore`, m.lore);

for (const p of problems) console.log('  ✗ ' + p);
console.log(`[check_voice] 말투·용어 문제 ${problems.length}건`);
process.exit(problems.length ? 1 : 0);
