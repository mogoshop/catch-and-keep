// 「추천」 자료 생성: 자리마다 메이플 후보 중 1순위를 점수 규칙(scripts/recommend-defs.mjs)으로 고른다.
//
//   npm run recommend -- --game <게임 체크아웃> [--no-search] [--topK 20]
//
// 읽는 것: content/assets/slots.json(후보·프레임) · content/scene/scene.json(있으면 자리 규칙 참고) · scripts/maple-picks.mjs
// 게임 체크아웃은 msw-search 래퍼(msw_resource_api.cjs)를 빌려 쓰기만 한다(태그·재검색·프레임 썸네일). 그쪽에 아무것도 쓰지 않는다.
// 쓰는 것(모두 Git 제외): content/assets/recommend.json · recommend-manifest.json(재검색 후보 프레임 SHA-256) · media/slots/*.png
//
// 점수(0~100) = 역할(후보 부분 hit·ball·tile·affected…) · 색(지금 그림과 색 칸 겹침 + 속성 색) · 모양(장별 면적 변화·가로세로) ·
//   크기(같은 배율일 때 지금 그림 대비) · 장 수·길이 · 태그 낱말 · 어두운 계열(태그·원작 직업) · 톤(밝기·채도)의 가중합 + 덧점.
// 재검색: 자리마다 검색어 2개를 animationclip·sprite / category skill로 topK개씩, 지금 메이플 클립과 비슷한 것까지 모아
//   메타데이터로 먼저 거르고 상위 3개만 프레임을 받아 같은 규칙으로 잰다. 그 자리 3위 안에 들면 「메이플 후보 · 재검색」으로 넣는다.
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readJSON, assertSanitized} from './lib.mjs';
import {decodePNG} from './png.mjs';
import {EXCLUDED, Q} from './maple-queries.mjs';
import {MAPLE_PICKS} from './maple-picks.mjs';
import {RECO_SLOTS, ROLE_KO, LOOP_ROLES, PART_FIT, PART_DEFAULT, HUE_KO, ELEMENTS, ROLE_WORDS, DARK_WORDS, JOBS, WEIGHTS, CONFIDENCE, BONUS} from './recommend-defs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'content/assets');
const argv = process.argv.slice(2); const opts = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts[k] = argv[++i]; else opts[k] = true; }
const TOPK = Math.max(3, Math.min(50, Number(opts.topK) || 20));
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const exists = f => access(f).then(() => true, () => false);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const r2 = v => Math.round(v * 100) / 100;
const warnings = [];

const slotsData = await readJSON(path.join(out, 'slots.json'));
let scene = null; try { scene = await readJSON(path.join(root, 'content/scene/scene.json')); } catch {}
let api = null;
if (opts.game && !opts.offline) api = createRequire(import.meta.url)(path.join(path.resolve(opts.game), '.claude/skills/msw-search/scripts/msw_resource_api.cjs'));
else warnings.push('게임 체크아웃(--game) 없음 — 태그·재검색 없이 캐시만 사용');
const SEARCH = !!api && !opts['no-search'];

// ---------- 캐시 ----------
const cacheDir = path.join(out, 'slots-cache'); await mkdir(cacheDir, {recursive: true});
async function cached(name, fn) {
  const f = path.join(cacheDir, name);
  try { return JSON.parse(await readFile(f, 'utf8')); } catch {}
  if (!api) return null;
  let v = null; for (let i = 0; i < 3; i++) { try { v = await fn(); break; } catch (e) { if (i === 2) { warnings.push(`${name}: ${e.message}`); return null; } } }
  await writeFile(f, JSON.stringify(v)); return v;
}
async function download(url, name) {
  const f = path.join(cacheDir, name);
  try { return await readFile(f); } catch {}
  if (!api) return null;
  if (!/^https:\/\/[a-z0-9.-]+\.nexoncdn\.co\.kr\//.test(url)) throw new Error(`unexpected media host: ${url}`);
  const res = await fetch(url); if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer()); await writeFile(f, buf); return buf;
}
async function pool(items, n, fn) { const outv = new Array(items.length); let i = 0; await Promise.all(Array.from({length: Math.min(n, items.length)}, async () => { while (i < items.length) { const k = i++; outv[k] = await fn(items[k], k); } })); return outv; }
const resultsOf = r => Array.isArray(r) ? r : r?.results || [];

// ---------- 태그 → 부분·이름·낱말 ----------
const PART = [[/\/hit\b/, '타격'], [/\/ball\b/, '투사체'], [/\/tile\b/, '바닥 장판'], [/affected/, '상태 효과'], [/\/effect\d*\b/, '시전'], [/screen/, '화면 효과'], [/prepare|keydown/, '모으기'], [/special/, '특수 효과'], [/mob\b|mobskill/, '몹 스킬']];
const PART_EN = {'타격': 'hit', '투사체': 'ball', '바닥 장판': 'tile', '상태 효과': 'affected', '시전': 'effect', '화면 효과': 'screen', '모으기': 'prepare', '특수 효과': 'special', '몹 스킬': 'mob', '효과': '-'};
async function tagsOf(ruid) { const t = await cached(`tags-${ruid}.json`, () => api.getResourceTags(ruid)); return t?.tags || null; }
function describe(t) {
  if (!t) return null;
  const name = String((t.ko || []).find(Boolean) || '').replace(/\s+/g, ' ').trim();
  const sub = [...(t.subPath || []), ...(t.path || [])].join(' ');
  const part = (PART.find(([re]) => re.test(sub)) || [, '효과'])[1];
  const pathStr = (t.path || [])[0] || '';
  const img = Number((pathStr.match(/^skill\/(\d+)\.img/) || [])[1]);
  const job = Number.isFinite(img) && JOBS[img] ? {id: img, name: JOBS[img][0], dark: JOBS[img][1]} : null;
  const text = ' ' + [...(t.AI_EN || []), ...(t.en || [])].join(' ').toLowerCase().replace(/[^a-z ]+/g, ' ') + ' ';
  const d = {name, part, path: pathStr, sub: (t.subPath || [])[0] || '', job, text, skill: /^skill\//.test(pathStr)};
  if (!d.name) d.name = label(d);
  return d;
}
// 한국어 이름 태그가 없을 때: 원작 스킬 번호(subPath skill/<번호>) 또는 몹 스킬 번호
function label(d) {
  const mob = d.path.match(/mobskill\/(\d+)/); if (mob) return `몹 스킬 ${mob[1]}`;
  const sk = (d.sub.match(/skill\/(\d+)/) || d.path.match(/skill\/(\d+)\.img/) || [])[1];
  return sk ? `스킬 ${sk}` : '';
}
const hitWords = (text, words) => words.filter(w => text.includes(w.includes(' ') ? w : ' ' + w));

// ---------- 그림 재기(색·크기·모양) ----------
const featCache = new Map();
async function features(c) {
  const key = (c.frames || []).join('|');
  if (featCache.has(key)) return featCache.get(key);
  const p = (async () => {
    const files = (c.frames || []).filter(f => f.endsWith('.png'));
    if (!files.length) return null;
    const step = Math.max(1, Math.ceil(files.length / 16)); const pick = files.filter((_, i) => i % step === 0);
    const hist = new Float64Array(15); let wsum = 0, vsum = 0, ssum = 0; const areas = []; let maxW = 0, maxH = 0;
    for (const f of pick) {
      let img; try { img = decodePNG(await readFile(path.join(out, f))); } catch (e) { warnings.push(`그림 해독 실패 ${f}: ${e.message}`); continue; }
      const {w, h, data} = img; let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4, a = data[o + 3]; if (a <= 16) continue;
        n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        const r = data[o], g = data[o + 1], b = data[o + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, s = mx ? (mx - mn) / mx : 0, wt = a / 255;
        let bin;
        if (s < 0.2 || mx - mn < 18) bin = v > 0.72 ? 12 : v < 0.22 ? 14 : 13;
        else { let hh; const d = mx - mn; if (mx === r) hh = ((g - b) / d) % 6; else if (mx === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4; hh = (hh * 60 + 360) % 360; bin = Math.floor(((hh + 15) % 360) / 30); }
        hist[bin] += wt; wsum += wt; vsum += v * wt; ssum += s * wt;
      }
      areas.push(n); if (x1 >= 0) { maxW = Math.max(maxW, x1 - x0 + 1); maxH = Math.max(maxH, y1 - y0 + 1); }
    }
    if (!wsum) return null;
    const mean = areas.reduce((a, b) => a + b, 0) / areas.length, sd = Math.sqrt(areas.reduce((a, b) => a + (b - mean) ** 2, 0) / areas.length);
    const peak = areas.indexOf(Math.max(...areas));
    return {hist: [...hist].map(v => v / wsum), v: vsum / wsum, s: ssum / wsum, areas, cv: mean ? sd / mean : 0, peak: areas.length > 1 ? peak / (areas.length - 1) : 0,
      tail: Math.max(...areas) ? areas[areas.length - 1] / Math.max(...areas) : 1, maxW, maxH, n: (c.frames || []).length,
      dur: (c.durations || []).reduce((a, b) => a + b, 0) / 1000};
  })();
  featCache.set(key, p); return p;
}
const topHue = hist => { const i = hist.indexOf(Math.max(...hist)); return HUE_KO[i]; };
const histMix = (a, b) => a.reduce((s, v, i) => s + Math.min(v, b[i]), 0);

// ---------- 점수 ----------
function shapeScore(role, f) {
  const aspect = f.maxH ? f.maxW / f.maxH : 1, stable = clamp(1 - Math.max(0, f.cv - 0.3) * 1.6), fades = f.n > 1 ? clamp((0.85 - f.tail) / 0.45) : 0.3, early = f.n > 1 ? clamp((0.8 - f.peak) / 0.5) : 0.4;
  let s, why;
  switch (role) {
    case 'proj': s = 0.6 * stable + 0.4 * clamp((aspect - 0.8) / 0.6); why = `크기가 고르게 반복(장별 면적 변동 ${r2(f.cv)}) · 가로세로 ${r2(aspect)}`; break;
    case 'hit': case 'burst': s = 0.55 * fades + 0.45 * early; why = `퍼졌다 사라지는 모양(가장 클 때 ${Math.round(f.peak * 100)}% 지점 · 끝 면적 ${Math.round(f.tail * 100)}%)`; break;
    case 'ground': s = 0.55 * clamp((aspect - 1.0) / 0.8) + 0.45 * stable; why = `가로로 넓은 바닥형(가로세로 ${r2(aspect)}) · 반복 변동 ${r2(f.cv)}`; break;
    case 'ring': s = 0.5 * clamp((aspect - 1.0) / 0.6) + 0.5 * fades; why = `납작한 고리(가로세로 ${r2(aspect)}) · 끝 면적 ${Math.round(f.tail * 100)}%`; break;
    case 'aura': s = 0.7 * stable + 0.3 * clamp(1 - Math.abs(Math.log2(aspect)) / 1.5); why = `몸 둘레에 머무는 고른 반복(변동 ${r2(f.cv)})`; break;
    case 'mark': { const m = Math.max(f.maxW, f.maxH); s = m <= 110 ? 1 : m <= 170 ? 0.6 : 0.2; why = `머리 위 크기(${m}px)`; break; }
    case 'summon': s = 0.6 * clamp((1.25 - aspect) / 0.6) + 0.4 * early; why = `위로 솟는 세로형(가로세로 ${r2(aspect)})`; break;
    case 'slash': case 'trail': s = 0.6 * clamp((aspect - 0.9) / 0.7) + 0.4 * fades; why = `옆으로 긴 궤적(가로세로 ${r2(aspect)}) · 끝에 사라짐 ${Math.round((1 - f.tail) * 100)}%`; break;
    default: s = 0.6 + 0.4 * early; why = `시전 순간에 크게 피었다 줄어듦(가장 클 때 ${Math.round(f.peak * 100)}% 지점)`;
  }
  return {s: clamp(s), why};
}
function scoreCand(s, prof, c, f, d) {
  const role = prof.role, el = ELEMENTS[prof.element] || ELEMENTS.neutral, parts = {}, why = {};
  // 역할(후보 부분)
  const part = d?.part || (c.source === 'current' || c.runtimeKey ? '효과' : '효과');
  parts.part = (PART_FIT[role] || {})[part] ?? PART_DEFAULT; why.part = `${part} 부분(${PART_EN[part] || '-'})${d?.sub ? ' · ' + d.sub.split('/').slice(-2).join('/') : ''} — ${ROLE_KO[role]} 자리`;
  if (!f) { parts.color = parts.shape = parts.size = parts.frames = parts.tone = 0; }
  else {
    // 색: 지금 그림과 겹침 60% + 속성 색 40% (지금 그림이 없으면 속성 색만 · 무색 속성은 겹침만)
    const elShare = el.bins ? el.bins.reduce((a, i) => a + f.hist[i], 0) : null;
    const mix = prof.ref ? histMix(prof.ref.hist, f.hist) : null;
    parts.color = mix != null && elShare != null ? 0.6 * clamp(mix / 0.7) + 0.4 * clamp(elShare / 0.6) : mix != null ? clamp(mix / 0.7) : elShare != null ? clamp(elShare / 0.6) : 0.5;
    why.color = `${mix != null ? `지금 그림과 색 ${Math.round(mix * 100)}% 겹침 · ` : ''}${elShare != null ? `${el.ko} 색 ${Math.round(elShare * 100)}% · ` : ''}주색 ${topHue(f.hist)}`;
    const sh = shapeScore(role, f); parts.shape = sh.s; why.shape = sh.why;
    // 크기: 같은 배율이면 지금 그림의 몇 배인지(1.5배 안 = 만점 · 4배 = 0) · 원형판은 판정 원에 맞춰 늘이므로 너무 작지만 않으면 만점
    const m = Math.max(f.maxW, f.maxH);
    if (prof.fit) { parts.size = m >= 60 ? 1 : 0.5; why.size = `판정 원에 맞춰 늘임(그림 ${m}px)`; }
    else if (prof.ref) { const ratio = m / Math.max(1, Math.max(prof.ref.maxW, prof.ref.maxH)); parts.size = clamp(1 - Math.max(0, Math.abs(Math.log2(ratio)) - 0.6) / 1.4); why.size = `같은 배율이면 지금 그림의 ${r2(ratio)}배 크기`; }
    else { parts.size = role === 'mark' ? (m <= 140 ? 1 : 0.5) : clamp(m / 90); why.size = `그림 ${m}px`; }
    // 장 수·길이
    const nScore = role === 'mark' ? (f.n >= 2 ? 1 : 0.7) : f.n >= 6 ? 1 : f.n >= 4 ? 0.8 : f.n >= 2 ? 0.5 : 0.15;
    let tScore = 1;
    if (!LOOP_ROLES.has(role) && prof.ref && prof.ref.dur > 0 && f.dur > 0) tScore = clamp(1 - Math.max(0, Math.abs(Math.log2(f.dur / prof.ref.dur)) - 1) / 1.5);
    parts.frames = 0.6 * nScore + 0.4 * tScore; why.frames = `${f.n}장 ${r2(f.dur)}초${prof.ref && !LOOP_ROLES.has(role) ? `(지금 그림 ${r2(prof.ref.dur)}초)` : ''}`;
    // 톤: 어두운 게임에 맞게 — 흰빛이 많거나 아주 밝은 그림은 깎음(뼈·금빛·서리 속성은 흰빛 허용) · 자홍(분홍)은 피·저주 아니면 깎음
    const whiteOk = ['bone', 'gold', 'frost', 'neutral'].includes(prof.element), pinkOk = ['blood', 'curse'].includes(prof.element);
    parts.tone = clamp(1 - (whiteOk ? 0 : Math.max(0, f.hist[12] - 0.35) * 1.5) - Math.max(0, f.v - 0.85) * 3 - (pinkOk ? 0 : Math.max(0, f.hist[11] - 0.25) * 1.2));
    why.tone = `밝기 ${r2(f.v)} · 채도 ${r2(f.s)} · 흰빛 ${Math.round(f.hist[12] * 100)}%`;
  }
  // 태그 낱말 · 어두운 계열
  const text = d?.text || ''; const elHit = hitWords(text, el.words), roleHit = hitWords(text, ROLE_WORDS[role] || []);
  parts.keyword = d ? 0.5 * clamp(elHit.length / 2) + 0.5 * clamp(roleHit.length / 2) : 0.3;
  why.keyword = `태그 ${[...elHit, ...roleHit].slice(0, 4).join('·') || '맞는 낱말 없음'}`;
  const darkHit = hitWords(text, DARK_WORDS);
  parts.theme = d ? clamp(0.7 * clamp(darkHit.length / 3) + (d.job?.dark ? 0.3 : 0) + (d.job && !d.job.dark && el.words.some(w => d.name.includes(w)) ? 0.1 : 0)) : 0.3;
  why.theme = `${d?.job ? `원작 ${d.job.name} 스킬 · ` : ''}어두운 계열 태그 ${darkHit.length}개${darkHit.length ? `(${darkHit.slice(0, 3).join('·')})` : ''}`;
  const w = {...WEIGHTS}; if (!el.dark) { w.tone += w.theme; w.theme = 0; }
  let total = Object.entries(w).reduce((a, [k, v]) => a + v * (parts[k] ?? 0), 0) * 100;
  const bonus = [];
  if (c.source === 'current') { total += BONUS.currentMaple; bonus.push(`지금 게임에 연결된 메이플 클립(+${BONUS.currentMaple})`); }
  else if (c.runtimeKey && c.origin !== 'search' && c.origin !== 'recommend') { total += BONUS.codeMaple; bonus.push(`코드에 선언된 메이플 클립(+${BONUS.codeMaple})`); }
  if (c.mediaKind === 'thumbnail') { total += BONUS.thumbOnly; bonus.push(`프레임 없는 썸네일(${BONUS.thumbOnly})`); }
  // 이유 = 가중 기여가 큰 3개 · 주의 = 0.4 미만 항목
  const LABEL = {part: '역할', color: '색', shape: '모양', size: '크기', frames: '장 수', keyword: '태그', theme: '계열', tone: '톤'};
  const contrib = Object.keys(w).filter(k => w[k] > 0).map(k => ({k, c: w[k] * (parts[k] ?? 0), v: parts[k] ?? 0}));
  const reasons = contrib.filter(x => x.v >= 0.55).sort((a, b) => b.c - a.c).slice(0, 3).map(x => `${LABEL[x.k]} · ${why[x.k]}`);
  const cautions = contrib.filter(x => x.v < 0.4).sort((a, b) => a.v - b.v).slice(0, 3).map(x => `${LABEL[x.k]} 약함 · ${why[x.k] || '잴 자료 없음'}`);
  if (c.mediaKind === 'frame-thumbnails') cautions.push('프레임 썸네일 — 실제 크기와 다를 수 있음');
  return {score: r2(total), parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, r2(v)])), reasons, cautions, bonus};
}

// ---------- 메이플 클립 받기(재검색 후보) — slots.mjs와 같은 캐시 이름·저장 방식 ----------
const manifest = new Map();
const atlasManifest = await readJSON(path.join(out, 'media-manifest.json'));
const slotManifest = await readJSON(path.join(out, 'slots-manifest.json'));
const known = new Map([...atlasManifest, ...slotManifest].map(m => [m.sha256, m.file]));
async function store(buf) {
  const h = sha256(buf);
  if (known.has(h) && await exists(path.join(out, known.get(h)))) { const file = known.get(h); manifest.set(file, {file, sha256: h, origin: 'reuse'}); return file; }
  const file = `media/slots/${h.slice(0, 24)}.png`;
  if (!manifest.has(file)) { await writeFile(path.join(out, file), buf); manifest.set(file, {file, sha256: h, origin: 'msw-resource-thumbnail'}); }
  return file;
}
const pngSize = buf => buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG' ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : null;
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=', 'base64');
function gifDelays(b) {
  if (!b || b.toString('ascii', 0, 3) !== 'GIF') return null;
  let p = 13; const flags = b[10]; if (flags & 0x80) p += 3 * (1 << ((flags & 7) + 1));
  const delays = []; let gce = null;
  while (p < b.length) {
    const t = b[p];
    if (t === 0x21) { const label = b[p + 1]; p += 2; if (label === 0xF9) gce = b.readUInt16LE(p + 2) * 10; while (p < b.length && b[p] !== 0) p += b[p] + 1; p++; }
    else if (t === 0x2C) { const f = b[p + 9]; p += 10; if (f & 0x80) p += 3 * (1 << ((f & 7) + 1)); p++; while (p < b.length && b[p] !== 0) p += b[p] + 1; p++; delays.push(gce || 100); gce = null; }
    else break;
  }
  return delays;
}
async function fetchClip(ruid) {
  const detail = await cached(`res-${ruid}.json`, () => api.getResource(ruid)); const p = detail?.payload; if (!p) return null;
  const frames = [];
  if (detail.type === 'animationclip' && p.frames?.length) {
    const sprites = await cached(`batch-${ruid}.json`, () => api.getResourcesBatch(p.frames.map(f => f.spriteRuid)));
    const byId = new Map((Array.isArray(sprites) ? sprites : sprites?.items || sprites?.resources || []).map(s => [s.id, s]));
    for (const f of p.frames) {
      const url = byId.get(f.spriteRuid)?.payload?.thumbnail;
      if (!url && f.width <= 8 && f.height <= 8) { frames.push({file: await store(BLANK_PNG), size: [f.width, f.height], pivot: f.pivot, spriteRuid: f.spriteRuid}); continue; }
      if (!url) return null;
      const buf = await download(url, `sprite-${f.spriteRuid}.png`); if (!buf) return null;
      frames.push({file: await store(buf), size: pngSize(buf), pivot: f.pivot, spriteRuid: f.spriteRuid, exact: (pngSize(buf) || [])[0] === f.width});
    }
    const gif = p.thumbnail ? await download(p.thumbnail, `clip-${ruid}.gif`).catch(() => null) : null; const delays = gifDelays(gif);
    const ok = delays?.length === frames.length;
    return {detail, frames, durations: ok ? delays : frames.map(() => 100), timingLabel: ok ? '메이플 미리보기 GIF 간격' : '검수용 100ms/장', mediaKind: frames.every(f => f.exact !== false) ? 'frames' : 'frame-thumbnails'};
  }
  if (p.thumbnail) { const buf = await download(p.thumbnail, `sprite-${ruid}.png`); if (!buf || !pngSize(buf)) return null; return {detail, frames: [{file: await store(buf), size: pngSize(buf), pivot: p.pivot}], durations: [100], timingLabel: '정지 그림', mediaKind: 'sprite'}; }
  return null;
}
function pivotBox(frames) {
  if (!frames.every(f => f.pivot && f.size)) return {box: [Math.max(...frames.map(f => f.size?.[0] || 0)), Math.max(...frames.map(f => f.size?.[1] || 0))]};
  const ax = Math.max(...frames.map(f => f.pivot.x)), ay = Math.max(...frames.map(f => f.size[1] - f.pivot.y));
  return {box: [ax + Math.max(...frames.map(f => f.size[0] - f.pivot.x)), ay + Math.max(...frames.map(f => f.pivot.y))], offsets: frames.map(f => [ax - f.pivot.x, ay - (f.size[1] - f.pivot.y)])};
}
async function clipCandidate(ruid, d) {
  const clip = await fetchClip(ruid); if (!clip) return null;
  const pv = pivotBox(clip.frames); const fr = clip.detail.payload.frames || [];
  // 장면 보기용 피벗(저장된 썸네일 크기 기준 · 위에서 잰 px) — scene.mjs와 같은 계산
  const pivots = clip.frames.every(f => f.pivot && f.size) ? clip.frames.map((f, i) => { const src = fr[i] || {width: f.size[0], height: f.size[1]}; return [r2(f.pivot.x * f.size[0] / (src.width || f.size[0])), r2(((src.height || f.size[1]) - f.pivot.y) * f.size[1] / (src.height || f.size[1]))]; }) : null;
  return {id: `maple:${ruid}`, source: 'maple', origin: 'recommend', title: d?.name || clip.detail.dname || ruid.slice(0, 8), runtimeKey: null, ruids: [ruid],
    frameRuids: clip.frames.map(f => f.spriteRuid).filter(Boolean), resourceType: clip.detail.type, resourceName: clip.detail.dname || '',
    frames: clip.frames.map(f => f.file), sizes: clip.frames.map(f => f.size), box: pv.box, offsets: pv.offsets, pivots, durations: clip.durations, timingLabel: clip.timingLabel, loop: true,
    mediaKind: clip.mediaKind, status: 'search', statusLabel: d?.part && d.part !== '효과' ? `${d.part} 효과` : '메이플 효과', tone: 'maple',
    reason: `재검색 · ${d?.part || '효과'}${d?.name ? ` 「${d.name}」` : ''}${d?.job ? ` · 원작 ${d.job.name}` : ''}`};
}

// ---------- 자리마다 ----------
const ruleOf = id => scene?.rules?.[id] || null;
const pickPart = new Map(); for (const list of Object.values(MAPLE_PICKS)) for (const p of list) pickPart.set(p.ruid, p);
const result = {}; const extras = {}; const searchLog = {};
let n = 0;
for (const s of slotsData.slots) {
  n++; if (process.stdout.isTTY) process.stdout.write(`\r${n}/${slotsData.slots.length} ${s.id}                    `);
  const [role, element] = RECO_SLOTS[s.id] || ['cast', 'neutral'];
  if (!RECO_SLOTS[s.id]) warnings.push(`추천 표에 없는 자리: ${s.id} — 시전·무색으로 잼`);
  const rule = ruleOf(s.id);
  const ref = s.current ? await features(s.current) : null;
  const prof = {role, element, ref, fit: !!(rule && Number(rule.judgeD) > 0)};
  const cands = [...(s.current && s.current.kind === 'maple' ? [s.current] : []), ...s.maple];
  const scored = [];
  for (const c of cands) {
    const ruid = c.ruids?.[0]; const d = ruid ? describe(await tagsOf(ruid)) : null;
    if (d && !d.name && pickPart.get(ruid)?.name) d.name = pickPart.get(ruid).name;
    const f = await features(c); const sc = scoreCand(s, prof, c, f, d);
    scored.push({candidateId: c.source === 'current' ? 'current' : c.id, ruid: ruid || null, title: c.title, origin: c.source === 'current' ? 'current' : c.origin || 'code', ...sc});
  }
  // 재검색
  if (SEARCH && !EXCLUDED[s.id] && Q[s.id]) {
    const have = new Set(cands.flatMap(c => c.ruids || []));
    const pool_ = new Map();
    const add = (list, via) => list.forEach((x, i) => { if (!['animationclip', 'sprite'].includes(x.type) || have.has(x.id)) return; const e = pool_.get(x.id) || {x, rank: 0, via: []}; e.rank += 1 / (i + 3); e.via.push(via); pool_.set(x.id, e); });
    for (const q of Q[s.id]) add(resultsOf(await cached(`reco-search-${sha256(q + TOPK).slice(0, 16)}.json`, () => api.searchResources(q, {resourceTypeFilter: ['animationclip', 'sprite'], categoryFilter: ['skill'], topK: TOPK}))), q);
    for (const c of cands.filter(c => c.source === 'current' || (c.runtimeKey && c.origin !== 'search'))) {
      const r = c.ruids?.[0]; if (r) add(resultsOf(await cached(`reco-similar-${r}.json`, () => api.findSimilarResources(r, {topK: 12, resourceTypeFilter: ['animationclip'], categoryFilter: ['skill']}))), 'similar');
    }
    const maxDim = /^(giant|meteor|levelup|elite)/.test(s.id) ? 900 : role === 'mark' ? 220 : 640;
    const metaOk = [...pool_.values()].filter(e => { const p = e.x.payload || {}; const fr = (p.frames || []).length; return Math.max(p.width || 0, p.height || 0) <= maxDim && fr <= 32 && (fr >= 2 || role === 'mark' || e.x.type === 'sprite'); });
    const described = await pool(metaOk, 6, async e => ({e, d: describe(await tagsOf(e.x.id))}));
    const prelim = described.filter(x => x.d && x.d.skill).map(({e, d}) => {
      const p = e.x.payload || {}; const fr = (p.frames || []).length || 1; const m = Math.max(p.width || 0, p.height || 0);
      const el = ELEMENTS[element] || ELEMENTS.neutral;
      const part = (PART_FIT[role] || {})[d.part] ?? PART_DEFAULT;
      const kw = 0.5 * clamp(hitWords(d.text, el.words).length / 2) + 0.5 * clamp(hitWords(d.text, ROLE_WORDS[role] || []).length / 2);
      const th = clamp(hitWords(d.text, DARK_WORDS).length / 3) * (el.dark ? 1 : 0.3) + (d.job?.dark && el.dark ? 0.3 : 0);
      const frs = role === 'mark' ? 1 : fr >= 6 ? 1 : fr >= 4 ? 0.8 : 0.4;
      const sz = ref ? clamp(1 - Math.max(0, Math.abs(Math.log2(m / Math.max(1, Math.max(ref.maxW, ref.maxH)))) - 0.6) / 1.4) : 0.6;
      return {e, d, pre: 0.35 * part + 0.25 * kw + 0.15 * clamp(th) + 0.1 * frs + 0.1 * sz + 0.05 * clamp(e.rank * 2)};
    }).sort((a, b) => b.pre - a.pre);
    const take = prelim.slice(0, 3); const fresh = [];
    for (const {e, d} of take) {
      const c = await clipCandidate(e.x.id, d); if (!c) continue;
      const f = await features(c); const sc = scoreCand(s, prof, c, f, d);
      fresh.push({c, row: {candidateId: c.id, ruid: e.x.id, title: c.title, origin: 'recommend', ...sc}});
    }
    searchLog[s.id] = {queries: Q[s.id], topK: TOPK, pool: pool_.size, passedMeta: metaOk.length, skillTagged: prelim.length, measured: fresh.length};
    scored.push(...fresh.map(x => x.row));
    const top3 = new Set([...scored].sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.candidateId));
    const keep = fresh.filter(x => top3.has(x.c.id)).map(x => x.c);
    if (keep.length) extras[s.id] = keep;
    for (const x of fresh) if (!top3.has(x.c.id)) { const i = scored.indexOf(x.row); if (i >= 0) scored.splice(i, 1); }
  }
  scored.sort((a, b) => b.score - a.score);
  result[s.id] = {id: s.id, title: s.title, role, roleKo: ROLE_KO[role], element, elementKo: (ELEMENTS[element] || {}).ko || element, excluded: EXCLUDED[s.id] || null, ranked: scored};
}
process.stdout.write('\n');
// 쓰지 않는 재검색 프레임은 매니페스트에서 뺀다(지우지는 않음 — 캐시처럼 남김)
const used = new Set(Object.values(extras).flatMap(l => l.flatMap(c => c.frames)));
for (const f of [...manifest.keys()]) if (!used.has(f)) manifest.delete(f);

// ---------- 1순위 정하기(다른 자리 1순위와 같은 클립은 덧점 -6) ----------
const order = Object.values(result).filter(r => !r.excluded && r.ranked.length).sort((a, b) => (b.ranked[0]?.score || 0) - (a.ranked[0]?.score || 0));
const taken = new Map(), takenName = new Map();
const nameKey = t => /^(animationclip|sprite)-\d+$/.test(t || '') ? null : t || null; // 리소스 표시 이름(animationclip-123)은 스킬 이름이 아님
for (const r of order) {
  for (const x of r.ranked) {
    if (x.ruid && taken.has(x.ruid)) { x.score = r2(x.score + BONUS.dupe); x.bonus = [...(x.bonus || []), `「${taken.get(x.ruid)}」 1순위와 같은 클립(${BONUS.dupe})`]; }
    else if (nameKey(x.title) && takenName.has(nameKey(x.title))) { x.score = r2(x.score + BONUS.dupeName); x.bonus = [...(x.bonus || []), `「${takenName.get(nameKey(x.title))}」 1순위와 같은 원작 스킬(${BONUS.dupeName})`]; }
  }
  r.ranked.sort((a, b) => b.score - a.score);
  if (r.ranked[0]?.ruid) taken.set(r.ranked[0].ruid, r.title);
  if (nameKey(r.ranked[0]?.title)) takenName.set(nameKey(r.ranked[0].title), r.title);
}
const counts = {slots: 0, maple: 0, codexKeep: 0, high: 0, mid: 0, low: 0, fromSearch: 0, fromResearch: 0, fromCurrent: 0, fromCode: 0, extras: Object.values(extras).reduce((a, l) => a + l.length, 0)};
for (const r of Object.values(result)) {
  counts.slots++;
  if (r.excluded) { r.status = 'codex-keep'; r.pick = 'current'; r.reasons = [`해골 관련 자리 — 코덱스 커스텀 그림 유지 (${r.excluded})`]; r.confidence = 'keep'; counts.codexKeep++; continue; }
  const [a, b] = r.ranked; if (!a) { r.status = 'none'; continue; }
  const margin = b ? a.score - b.score : 99;
  const low = a.score < CONFIDENCE.low || margin < CONFIDENCE.lowMargin || a.parts.color < CONFIDENCE.lowColor || a.parts.part < CONFIDENCE.lowPart || a.parts.size < CONFIDENCE.lowSize;
  r.confidence = low ? 'low' : a.score >= CONFIDENCE.high && margin >= CONFIDENCE.highMargin ? 'high' : 'mid';
  r.status = 'maple'; r.pick = a.candidateId; r.ruid = a.ruid; r.score = a.score; r.margin = r2(margin); r.reasons = a.reasons; r.cautions = a.cautions;
  r.lowWhy = low ? [a.score < CONFIDENCE.low ? `점수 ${a.score} < ${CONFIDENCE.low}` : null, margin < CONFIDENCE.lowMargin ? `2순위와 ${r2(margin)}점 차` : null, a.parts.color < CONFIDENCE.lowColor ? `색 ${a.parts.color}` : null, a.parts.part < CONFIDENCE.lowPart ? `역할 ${a.parts.part}` : null, a.parts.size < CONFIDENCE.lowSize ? `크기 ${a.parts.size} — 배율을 크게 바꿔야 함` : null].filter(Boolean) : [];
  counts.maple++; counts[r.confidence]++;
  const key = {current: 'fromCurrent', search: 'fromSearch', recommend: 'fromResearch'}[a.origin] || 'fromCode'; counts[key]++;
}
const data = {createdAt: new Date().toISOString(), slotsCreatedAt: slotsData.createdAt, slotsCommit: slotsData.sourceCommit, search: SEARCH ? {topK: TOPK, types: ['animationclip', 'sprite'], category: 'skill'} : null,
  rule: {weights: WEIGHTS, confidence: CONFIDENCE, bonus: BONUS, summary: '역할·색·모양·크기·장 수·태그·어두운 계열·톤의 가중합(0~100) — scripts/recommend-defs.mjs'},
  counts, slots: result, extras, searchLog, warnings: [...new Set(warnings)].slice(0, 200)};
assertSanitized(data, 'recommend');
await writeFile(path.join(out, 'recommend.json'), JSON.stringify(data));
await writeFile(path.join(out, 'recommend-manifest.json'), JSON.stringify([...manifest.values()].map(({file, sha256}) => ({file, sha256}))));
console.log(`Recommend ${counts.slots} slots · maple ${counts.maple} (high ${counts.high} · mid ${counts.mid} · low ${counts.low}) · codex keep ${counts.codexKeep} · re-search extras ${counts.extras} (1순위 ${counts.fromResearch}) · media ${manifest.size}`);
if (data.warnings.length) console.log('Warnings:\n- ' + data.warnings.slice(0, 20).join('\n- '));
