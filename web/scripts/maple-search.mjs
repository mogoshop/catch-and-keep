// Proposes MSW/MapleStory resource clips for each effect slot (draft for scripts/maple-picks.mjs).
//
//   node scripts/maple-search.mjs --game <game checkout> [--write]
//
// Uses the game checkout's msw-search wrapper (searchResources / findSimilarResources / getResourceTags).
// Without --write it only prints the proposal; with --write it rewrites scripts/maple-picks.mjs.
// The committed maple-picks.mjs is the fixed list `npm run slots` reads, so regenerating slot data
// never changes the picks unless this script is rerun deliberately (search results can drift).
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {SLOTS} from './slot-defs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2); const opts = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts[k] = argv[++i]; else opts[k] = true; }
if (!opts.game) throw new Error('Usage: node scripts/maple-search.mjs --game <game checkout> [--write]');
const api = createRequire(import.meta.url)(path.join(path.resolve(opts.game), '.claude/skills/msw-search/scripts/msw_resource_api.cjs'));

// Skeleton-centred slots are skipped on request (해골이 주인공인 자리).
export const EXCLUDED = {
  'blast': '해골 폭탄·제물 폭발 — 해골이 터지는 효과',
  'summon-ritual': '해골 소환 성공 바닥 문양 — 해골 소환 의식',
  'rite-whirl': '의식 2기 뼈 회오리 — 거인 소환 의식(뼈 의식) 단계',
  'rite-whirl-trace': '의식 회오리 바닥 자국 — 거인 소환 의식(뼈 의식) 단계'
};
// What each slot should look like + search phrases (Korean and English).
const Q = {
  'slash': ['검 베기 궤적 이펙트', 'sword slash arc effect'],
  'shard-throw': ['보라 파편 투사체 날아감', 'purple shard projectile flying'],
  'shard-hit': ['보라 파편 타격 파열', 'purple shard hit burst'],
  'bone-arrow': ['화살 투사체 하얀 뼈', 'white bone arrow projectile'],
  'hit-bone': ['하얀 파편 타격 튀김', 'white fragments hit impact'],
  'spear': ['창 투사체 날아감', 'spear lance projectile flying'],
  'spear-hit': ['창이 꽂히는 타격', 'spear impale hit'],
  'flame-shot': ['불꽃 화살 투사체', 'fireball flame projectile'],
  'hit-fire': ['불꽃 타격 작은 폭발', 'fire hit small explosion'],
  'frost-shot': ['푸른 얼음 투사체', 'blue ice shard projectile'],
  'hit-frost': ['얼음 파편 타격', 'ice hit shatter blue'],
  'hit-curse': ['보라 저주 타격', 'dark purple curse hit'],
  'hex-burst': ['보라 저주 불꽃 폭발', 'dark purple flame burst'],
  'shatter': ['얼음 파쇄 폭발 파편', 'ice shatter explosion frost'],
  'mage-bolt': ['마법 구슬 투사체', 'magic orb bolt projectile'],
  'monster-arrow': ['화살 날아감', 'arrow projectile flying'],
  'hit-spark': ['타격 불꽃 스파크', 'hit spark impact'],
  'offering': ['초록 회복 고리 치유', 'green healing ring heal'],
  'death-wave': ['보라 원형 충격파', 'purple shockwave ring explosion'],
  'poison-mist': ['초록 독 안개 구름', 'green poison gas cloud'],
  'drain-vortex': ['보라 소용돌이 흡수', 'purple vortex drain life'],
  'bone-storm': ['회오리 폭풍 파편 회전', 'whirlwind storm spinning debris'],
  'dash-ghost': ['푸른 유령 잔상 질주', 'blue ghost afterimage dash'],
  'sacrifice': ['어둠 그림자 폭발 희생', 'dark shadow sacrifice explosion'],
  'prison-hold': ['감옥 속박 우리 바닥', 'cage prison bind ground'],
  'prison-release': ['속박 해제 파열', 'bind release break burst'],
  'armor-cast': ['보호막 시전 버프', 'shield barrier cast buff'],
  'armor-ring-front': ['몸 주위 보호막 고리', 'protective aura ring around body'],
  'armor-ring-back': ['몸 뒤 보호 오라', 'guard aura behind body'],
  'armor-absorb': ['보호막 피해 흡수', 'shield absorb hit'],
  'armor-break': ['보호막 깨짐', 'shield break shatter'],
  'torrent-body': ['청록 혼 구슬 날아감', 'cyan soul orb projectile'],
  'torrent-cast': ['청록 혼 기운 시전', 'cyan soul energy cast'],
  'torrent-hit': ['청록 혼 타격', 'cyan soul hit'],
  'arise-ring': ['보라 바닥 고리 퍼짐', 'purple ground ring spread'],
  'arise-flame': ['검보라 불꽃 솟아오름', 'dark purple flame rising'],
  'arise-burst': ['보라 파열', 'purple burst explosion'],
  'arise-soul': ['보라 혼 구슬 날아감', 'purple soul orb flying'],
  'shadow-rise': ['그림자 솟아오름 소환', 'shadow rising summon dark'],
  'elite-promote': ['금빛 빛기둥 승급', 'golden pillar of light'],
  'death-smoke': ['쓰러질 때 연기', 'death smoke puff'],
  'elite-burst': ['금빛 파열 처치', 'golden burst explosion'],
  'curse-amp': ['붉은 낙인 마법진 바닥', 'red brand magic circle ground'],
  'curse-weaken': ['쇠약 저주 마법진 바닥', 'weaken curse magic circle'],
  'curse-thorn': ['가시 덩굴 바닥', 'thorn vines ground'],
  'curse-terror': ['공포 어둠 마법진', 'fear dark magic circle'],
  'curse-lifetap': ['피 흡수 붉은 마법진', 'blood drain red magic circle'],
  'curse-resist': ['깨지는 푸른 마법진', 'breaking blue magic circle'],
  'curse-break': ['저주 해제 파열', 'curse break burst'],
  'mark-amp': ['붉은 낙인 상태 표시', 'red mark debuff above head'],
  'mark-weaken': ['쇠약 상태이상 표시', 'weakness debuff above head'],
  'mark-thorn': ['가시 상태 표시', 'thorn debuff mark'],
  'mark-terror': ['공포 상태이상 머리 위', 'fear debuff above head'],
  'mark-confuse': ['혼란 상태 별 빙빙', 'confusion stars spinning above head'],
  'mark-lifetap': ['흡혈 상태 표시', 'life drain debuff mark'],
  'mark-decay': ['부패 상태 초록', 'decay rot debuff green'],
  'mark-resist': ['방어력 감소 상태', 'defense down debuff'],
  'mark-root': ['속박 상태 발 묶임', 'root bind status'],
  'mark-chill': ['냉기 상태 느려짐', 'chill slow status'],
  'mark-poison': ['중독 상태 초록 거품', 'poison status bubbles'],
  'mark-hex': ['저주 상태 보라 표시', 'curse status purple mark'],
  'mark-frost': ['빙결 상태 얼음', 'frozen status ice'],
  'giant-nova': ['화염 노바 원형 폭발', 'fire nova ring explosion'],
  'meteor-telegraph': ['낙하 예고 바닥 표시', 'falling warning ground marker'],
  'meteor-fall': ['메테오 운석 낙하', 'meteor falling fireball'],
  'meteor-impact': ['운석 착지 폭발', 'meteor impact explosion'],
  'meteor-afterglow': ['불타는 바닥 잔불', 'burning ground flames'],
  'giant-spin-front': ['회전 베기 칼날', 'spinning blade whirlwind slash'],
  'giant-spin-back': ['회전 먼지 바닥', 'spinning dust ground'],
  'giant-rift': ['땅 가르기 균열', 'ground crack rift'],
  'giant-slam': ['지면 내려찍기 충격', 'ground slam shockwave'],
  'giant-roar': ['함성 충격파 고리', 'roar shout shockwave'],
  'giant-dash': ['돌진 자취', 'dash trail charge'],
  'giant-flurry': ['연속 베기 엑스', 'multiple slash flurry'],
  'giant-quake': ['땅울림 지진', 'earthquake ground shake'],
  'giant-bone': ['던진 뼈 회전', 'thrown bone spinning'],
  'giant-hexfield': ['보라 저주 장판', 'purple curse field ground'],
  'levelup-ring': ['레벨업 빛 고리', 'level up light ring'],
  'levelup-pillar': ['레벨업 빛기둥', 'level up pillar of light']
};
const SMALL = id => id.startsWith('mark-');
// Reviewed on the contact sheet and rejected: characters/avatars rather than effects, or near-copies of another pick.
const REJECT = new Set(['331d795e', '2497ecc6c5', '33ad1326', '198f5c41', 'f17ea05a', '29497de8', '77866b65', '084e3125', '087d665a'].map(String));
const rejected = id => [...REJECT].some(p => id.startsWith(p.slice(0, 8)));
// Slots re-picked by hand after looking at the frames (kept on every rerun).
const OVERRIDES = {
 "poison-mist": [
  {
   "ruid": "3a6509634ee24b789f5446afb10fe357",
   "name": "독안개 바닥 장판 (스킬 2111003)",
   "part": "바닥 장판",
   "reason": "바닥 장판 · 연초록 독안개가 넓게 깔려 머무름 — 불·독 마법사 독안개 스킬(2111003)의 바닥판이라 오래 남는 독안개 자리에 가장 가까움 (검토 후 고정)"
  },
  {
   "ruid": "4e2d912d04df49fa98f01f87a64d7d90",
   "name": "불·독 계열 타격 (스킬 2141005)",
   "part": "타격",
   "reason": "타격 · 회녹색 독연기 속에 노란 불티가 번지는 구름 — 지금 메이플 독구름(스킬 2141503)과 같은 불·독 계열 (검토 후 고정)"
  },
  {
   "ruid": "dd25273aef974dcdb7c6380bb5bbb7c7",
   "name": "베놈 버스트",
   "part": "타격",
   "reason": "타격 「베놈 버스트」 · 짙은 초록 독 덩어리가 터지며 퍼짐 — 독안개가 깔리는 순간을 강조하는 시작 효과로 (검토 후 고정)"
  }
 ],
 "drain-vortex": [
  {
   "ruid": "f546c32ef27345759c160c5c55ff8c6c",
   "name": "몹 스킬 128 상태 효과",
   "part": "상태 효과",
   "reason": "상태 효과 · 연보라 나선이 안쪽으로 감겨 듦 — 몸 가운데 흡수 소용돌이와 모양이 가장 비슷 (검토 후 고정)"
  },
  {
   "ruid": "b7156ad96e5a4545a48d53a222a75e12",
   "name": "쉐도우 스티치",
   "part": "특수 효과",
   "reason": "특수 효과 「쉐도우 스티치」 · 검보라 구체 안에서 기운이 소용돌이침 — 더 진하고 큰 흡수 표현 (검토 후 고정)"
  },
  {
   "ruid": "d1d82bc597b14230814b18d0dffce04c",
   "name": "드레인 오라",
   "part": "특수 효과",
   "reason": "특수 효과 「드레인 오라」 · 연기·안개·파열·소용돌이·고리"
  }
 ],
 "mark-thorn": [
  {
   "ruid": "5eedda200e474c7bae4da720b43968fd",
   "name": "비홀더스 버프",
   "part": "상태 효과",
   "reason": "상태 효과 「비홀더스 버프」 · 푸른·보호막·장벽·오라"
  },
  {
   "ruid": "405eadf40dbf46ce8f9871eed7404203",
   "name": "데스 드로우",
   "part": "시전",
   "reason": "시전 「데스 드로우」 · 폭발·파열·고리·파편·그림자"
  },
  {
   "ruid": "8c4a18e070ce43f3a533335a066a7e6b",
   "name": "포비든 컨트랙트",
   "part": "시전",
   "reason": "시전 「포비든 컨트랙트」 · 뾰족한 초록 가시 문장 — 머리 위 가시 표식 모양과 비슷 (검토 후 고정)"
  }
 ],
 "offering": [
  {
   "ruid": "aff36148c9384a0582ae98bb93530c0d",
   "name": "웡키 옥",
   "part": "투사체",
   "reason": "투사체 「웡키 옥」 · 고리·원·파동·초록·빛"
  },
  {
   "ruid": "379efdfe540e47af8834af8e9b594243",
   "name": "스킬 400001066",
   "part": "특수 효과",
   "reason": "특수 효과 · 원·마법진·초록·붉은·빛"
  },
  {
   "ruid": "bdaf649b59f3401aab194ea33a167430",
   "name": "산의 씨앗",
   "part": "효과",
   "reason": "효과 「산의 씨앗」 · 연초록 고리 안에 반짝임이 맺혔다 퍼짐 — 뼈 성찬 치유 고리와 색·모양이 가까움 (검토 후 고정)"
  }
 ]
};
const PART = [[/\/hit\b/, '타격'], [/\/ball\b/, '투사체'], [/\/tile\b/, '바닥 장판'], [/affected/, '상태 효과'], [/\/effect\d*\b/, '시전'], [/screen/, '화면 효과'], [/prepare|keydown/, '모으기'], [/special/, '특수 효과'], [/mob\b|mobskill/, '몹 스킬']];
const WORDS = [['poison', '독'], ['venom', '독'], ['toxic', '독'], ['gas', '가스'], ['cloud', '구름'], ['smoke', '연기'], ['mist', '안개'], ['fog', '안개'], ['ice', '얼음'], ['frost', '서리'], ['freez', '빙결'], ['snow', '눈'], ['fire', '불'], ['flame', '불꽃'], ['burn', '불탐'], ['lava', '용암'], ['explo', '폭발'], ['burst', '파열'], ['vortex', '소용돌이'], ['swirl', '소용돌이'], ['whirl', '회오리'], ['tornado', '회오리'], ['spin', '회전'], ['ring', '고리'], ['circle', '원'], ['magic circle', '마법진'], ['rune', '문양'], ['shock', '충격파'], ['wave', '파동'], ['slash', '베기'], ['blade', '칼날'], ['sword', '검'], ['arrow', '화살'], ['spear', '창'], ['shard', '파편'], ['fragment', '파편'], ['crystal', '결정'], ['bone', '뼈'], ['skull', '해골'], ['ghost', '유령'], ['spirit', '영혼'], ['soul', '혼'], ['shadow', '그림자'], ['dark', '어둠'], ['purple', '보라'], ['violet', '보라'], ['green', '초록'], ['blue', '푸른'], ['cyan', '청록'], ['red', '붉은'], ['blood', '피'], ['gold', '금빛'], ['yellow', '노랑'], ['white', '흰'], ['light', '빛'], ['holy', '성스러운'], ['heal', '회복'], ['shield', '보호막'], ['barrier', '장벽'], ['aura', '오라'], ['pillar', '기둥'], ['beam', '광선'], ['lightning', '번개'], ['thunder', '번개'], ['meteor', '운석'], ['star', '별'], ['thorn', '가시'], ['vine', '덩굴'], ['chain', '사슬'], ['cage', '우리'], ['crack', '균열'], ['dust', '먼지'], ['rock', '바위'], ['orb', '구슬'], ['projectile', '투사체'], ['trail', '자취'], ['dash', '돌진'], ['confus', '혼란'], ['curse', '저주'], ['fear', '공포'], ['stun', '기절'], ['slow', '느려짐'], ['level up', '레벨업']];

const tagCache = new Map();
async function tags(id) {
  if (!tagCache.has(id)) tagCache.set(id, api.getResourceTags(id).then(r => r?.tags || {}).catch(() => ({})));
  return tagCache.get(id);
}
const resultsOf = r => Array.isArray(r) ? r : r?.results || [];
function describe(t) {
  const name = String((t.ko || []).find(Boolean) || '').replace(/\s+/g, ' ').trim();
  const sub = [...(t.subPath || []), ...(t.path || [])].join(' ');
  const part = (PART.find(([re]) => re.test(sub)) || [, '효과'])[1];
  const text = (t.AI_EN || []).join(' ').toLowerCase();
  const kw = [...new Set(WORDS.filter(([en]) => text.includes(en)).map(([, ko]) => ko))].slice(0, 5);
  return {name, part, kw, path: (t.path || [])[0] || '', sub: (t.subPath || [])[0] || ''};
}
function label(d) {
  const mob = d.path.match(/mobskill\/(\d+)/); if (mob) return `몹 스킬 ${mob[1]}`;
  if (/fieldskill/.test(d.path)) return '필드 스킬';
  const sk = (d.sub.match(/skill\/(\d+)/) || d.path.match(/skill\/(\d+)\.img/) || [])[1];
  return sk ? `스킬 ${sk}` : '메이플 이펙트';
}
const writePicks = async (excluded, picks) => {
  const body = `// Fixed MSW/MapleStory clip candidates per effect slot (메이플 후보 · 검색).\n// Generated by scripts/maple-search.mjs, then reviewed. npm run slots reads this list as-is.\nexport const EXCLUDED = ${JSON.stringify(excluded, null, 2)};\nexport const MAPLE_PICKS = ${JSON.stringify(picks, null, 1)};\n`;
  await writeFile(path.join(root, 'scripts/maple-picks.mjs'), body);
};
if (opts.enrich) { // add display names to an existing fixed list without searching again
  const cur = await import('./maple-picks.mjs');
  for (const list of Object.values(cur.MAPLE_PICKS)) for (const p of list) { const d = describe(await tags(p.ruid)); p.name = d.name || label(d); p.part = d.part; }
  await writePicks(cur.EXCLUDED, cur.MAPLE_PICKS); console.log('Enriched scripts/maple-picks.mjs'); process.exit(0);
}

const existing = new Map(); // slot id -> RUIDs already in the slot (code-declared clips / current maple)
try {
  const slots = JSON.parse(await readFile(path.join(root, 'content/assets/slots.json'), 'utf8'));
  for (const s of slots.slots) existing.set(s.id, new Set([...(s.current?.kind === 'maple' ? s.current.ruids : []), ...s.maple.filter(m => m.origin !== 'search').flatMap(m => m.ruids)]));
} catch {}
const used = new Set([...existing.values()].flatMap(s => [...s]));
const picks = {}; const report = [];
for (const slot of SLOTS) {
  if (EXCLUDED[slot.id] || !Q[slot.id]) continue;
  const pool = new Map();
  const add = (list, weight, via) => list.forEach((x, i) => { if (x.type !== 'animationclip') return; const e = pool.get(x.id) || {x, score: 0, via: []}; e.score += weight / (i + 3); e.via.push(via); pool.set(x.id, e); });
  for (const q of Q[slot.id]) add(resultsOf(await api.searchResources(q, {resourceTypeFilter: ['animationclip'], categoryFilter: ['skill'], topK: 20})), 1, q);
  for (const r of existing.get(slot.id) || []) add(resultsOf(await api.findSimilarResources(r, {topK: 12, resourceTypeFilter: ['animationclip'], categoryFilter: ['skill']})), 0.8, 'similar');
  const ranked = [];
  for (const e of [...pool.values()].sort((a, b) => b.score - a.score).slice(0, 18)) {
    const p = e.x.payload || {}; const frames = (p.frames || []).length; const w = p.width || 0, h = p.height || 0;
    if (existing.get(slot.id)?.has(e.x.id) || rejected(e.x.id)) continue;
    const t = await tags(e.x.id); const d = describe(t);
    if (d.path && !/^skill\//.test(d.path)) continue; // effects only — no mob/npc bodies or avatar parts
    let s = e.score;
    if (frames >= 4) s += 0.08; if (frames < 3 && !SMALL(slot.id)) s -= 0.12;
    if (!SMALL(slot.id) && Math.max(w, h) < 60) s -= 0.1; if (SMALL(slot.id) && Math.max(w, h) > 200) s -= 0.1;
    if (used.has(e.x.id)) s -= 0.15;
    // Full-screen or very long clips are poor fits for a slot effect (and heavy to preview): skip them.
    const maxDim = /^(giant|meteor|levelup|elite)/.test(slot.id) ? 900 : SMALL(slot.id) ? 220 : 640;
    if (Math.max(w, h) > maxDim || frames > 32) continue;
    ranked.push({id: e.x.id, s, frames, w, h, d, via: [...new Set(e.via)]});
  }
  ranked.sort((a, b) => b.s - a.s);
  // First pass: clips no other slot uses and that actually animate; then fill from the rest.
  const okFirst = c => !used.has(c.id) && (SMALL(slot.id) || c.frames >= 3);
  const chosen = [];
  for (const c of [...ranked.filter(okFirst), ...ranked.filter(c => !okFirst(c))]) {
    // Skip another layer of the same skill part already chosen here (e.g. affected/7·8·9 of one skill).
    if (chosen.some(x => x.d.path && x.d.path === c.d.path && x.d.part === c.d.part && x.d.name === c.d.name)) continue;
    chosen.push(c); if (chosen.length === 3) break;
  }
  chosen.forEach(c => used.add(c.id));
  picks[slot.id] = chosen.map(c => ({ruid: c.id, name: c.d.name || label(c.d), part: c.d.part, reason: `${c.d.part}${c.d.name ? ` 「${c.d.name}」` : ''}${c.d.kw.length ? ' · ' + c.d.kw.join('·') : ''}${c.via.includes('similar') ? ' · 지금 메이플 클립과 비슷' : ''}`}));
  report.push(`${slot.id}: ` + chosen.map(c => `${c.id.slice(0, 8)} ${c.frames}장 ${c.w}×${c.h} ${c.d.name || c.d.path + '/' + c.d.sub} [${c.d.kw.join(',')}]`).join(' | '));
  process.stdout.write('.');
}
console.log('\n' + report.join('\n'));
Object.assign(picks, OVERRIDES);
if (opts.write) { await writePicks(EXCLUDED, picks); console.log('Wrote scripts/maple-picks.mjs'); }
await mkdir(path.join(root, 'content/assets/slots-cache'), {recursive: true});
await writeFile(path.join(root, 'content/assets/slots-cache/maple-search-report.txt'), report.join('\n'));
