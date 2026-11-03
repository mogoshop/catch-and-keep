// Builds the private "effect slot" comparison data for /assets/ (content/assets/slots.json).
//
//   npm run slots -- --game <game checkout> [--ref origin/main] [--atlas <atlas delivery>] [--offline]
//
// Reads the game checkout only (git show / git log / PNG reads). Never writes there.
// Codex PNGs are copied into content/assets/media/slots/ (or reuse the imported atlas media
// when the bytes are identical). MSW resource clips are fetched through the msw-search skill
// wrapper (getResource / getResourcesBatch) and their frame PNG thumbnails are stored the same way.
// Every stored file is listed with its SHA-256 in content/assets/slots-manifest.json.
import {readFile, writeFile, mkdir, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readJSON, assertSanitized} from './lib.mjs';
import {SLOT_GROUPS, SLOTS} from './slot-defs.mjs';
import {EXCLUDED as MAPLE_EXCLUDED, MAPLE_PICKS} from './maple-picks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'content/assets');
const argv = process.argv.slice(2); const opts = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts[k] = argv[++i]; else opts[k] = true; }
if (!opts.game) throw new Error('Usage: npm run slots -- --game <game checkout> [--ref origin/main] [--atlas <atlas folder>] [--offline]');
const GAME = path.resolve(opts.game); const REF = opts.ref || 'origin/main';
const SOURCES = {GameConst: 'RootDesk/MyDesk/Common/GameConst.mlua', SkillEffects: 'RootDesk/MyDesk/Skill/SkillEffects.mlua', MageBolts: 'RootDesk/MyDesk/Undead/MageBolts.mlua'};
const SOURCE_FILES = Object.values(SOURCES);
const git = (...args) => execFileSync('git', ['-C', GAME, ...args], {encoding: 'utf8', maxBuffer: 64e6});
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const exists = p => access(p).then(() => true, () => false);
const RUID = /[0-9a-f]{32}/g;
const warnings = [];

// ---------- game source at REF ----------
const sourceCommit = git('rev-parse', REF).trim();
const sourceDate = git('show', '-s', '--format=%cI', sourceCommit).trim();
const props = new Map();
for (const [file, rel] of Object.entries(SOURCES)) {
  git('show', `${sourceCommit}:${rel}`).split('\n').forEach((line, i) => {
    const m = line.match(/^\s*property\s+(?:string|integer|number)\s+(\w+)\s*=\s*(?:"([^"]*)"|([-\d.]+))\s*(?:--\s*(.*))?$/);
    if (m) props.set(`${file}.${m[1]}`, {value: m[2] ?? m[3], line: i + 1, path: rel, comment: (m[4] || '').trim()});
  });
}
function specRuids(spec) {
  const [key, kind] = spec.split(':'); const p = props.get(key);
  if (!p) return null;
  let value = p.value || '';
  if (kind) { const part = value.split(';').find(x => x.split('=')[0].trim() === kind); value = part ? part.split('=').slice(1).join('=') : ''; }
  return {key, kind, prop: p, ruids: value.match(RUID) || []};
}
function msList(key, count) {
  const name = key.split('.')[1]; const file = key.split('.')[0];
  const candidates = [`${file}.${name}Ms`, `${file}.${name}FrameMs`, name === 'FxSkillCurseCircles' ? `${file}.FxSkillCurseCircleFrameMs` : '', `${file}.${name}Opts`, `${file}.${name.replace(/Seq$/, '')}Opts`];
  for (const k of candidates) {
    const p = props.get(k); if (!p) continue;
    const raw = k.endsWith('Opts') ? (p.value.match(/(?:^|;)ms=([\d,]+)/) || [])[1] : p.value;
    if (!raw) continue;
    const list = String(raw).split(',').map(Number).filter(n => n > 0);
    if (list.length === count) return {durations: list, label: '코드 장별 간격', source: `${p.path}:${p.line}`};
    if (list.length === 1) return {durations: Array(count).fill(list[0]), label: '코드 장 간격', source: `${p.path}:${p.line}`};
  }
  return null;
}
const logCache = new Map();
function pickaxe(ruid, files = SOURCE_FILES) {
  const k = ruid + files.join(); if (logCache.has(k)) return logCache.get(k);
  const rows = git('log', '--format=%h%x09%cI%x09%s', `-S${ruid}`, sourceCommit, '--', ...files).trim().split('\n').filter(Boolean)
    .map(l => { const [commit, date, ...s] = l.split('\t'); return {commit, date, subject: s.join('\t').slice(0, 140)}; });
  logCache.set(k, rows); return rows;
}
// When did a constant start / stop holding these RUIDs (value only — old RUIDs often stay in comments)?
const showCache = new Map();
function valueAt(commit, spec) {
  const [key, kind] = spec.split(':'); const [file, name] = key.split('.'); const rel = SOURCES[file];
  const ck = `${commit}:${rel}`;
  if (!showCache.has(ck)) { let text = ''; try { text = git('show', ck); } catch {} showCache.set(ck, text); }
  const line = showCache.get(ck).split('\n').find(l => new RegExp(`^\\s*property\\s+string\\s+${name}\\s*=`).test(l));
  let value = line ? (line.match(/=\s*"([^"]*)"/) || [])[1] || '' : '';
  if (kind) { const part = value.split(';').find(x => x.split('=')[0].trim() === kind); value = part ? part.split('=').slice(1).join('=') : ''; }
  return (value.match(RUID) || []).join('|');
}
function period(spec, ruids) {
  const [key] = spec.split(':'); const [file, name] = key.split('.');
  const rows = git('log', '--reverse', '--format=%h%x09%cI%x09%s', `-G${name} *=`, sourceCommit, '--', SOURCES[file]).trim().split('\n').filter(Boolean)
    .map(l => { const [commit, date, ...s] = l.split('\t'); return {commit, date, subject: s.join('\t').slice(0, 140)}; });
  const want = ruids.join('|'); let from = null, to = null;
  for (const r of rows) { const has = valueAt(r.commit, spec) === want; if (has && !from) from = r; else if (!has && from && !to) to = r; }
  return {from, to};
}

// ---------- RUID → local PNG ----------
const lookup = new Map(); // ruid -> {file (relative to game), sha}
if (opts.atlas) {
  try {
    const lu = await readJSON(path.join(opts.atlas, 'ruid-image-lookup.json'));
    for (const [r, list] of Object.entries(lu)) { const e = list[0]; const n = String(e.path).normalize('NFC'); const marker = '잡으면 내편/'; if (n.includes(marker)) lookup.set(r, {file: n.split(marker).slice(1).join(marker), sha: e.sha256}); }
  } catch (e) { warnings.push(`atlas ruid lookup unavailable: ${e.message}`); }
}
const receipts = git('ls-tree', '-r', '--name-only', sourceCommit, 'docs/evidence').split('\n').filter(f => /upload[^/]*\.json$/.test(f));
for (const f of receipts) {
  let data; try { data = JSON.parse(git('show', `${sourceCommit}:${f}`)); } catch { continue; }
  (function walk(v) {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      const r = typeof v.ruid === 'string' ? v.ruid : typeof v.RUID === 'string' ? v.RUID : null;
      const file = typeof (v.file || v.path) === 'string' ? v.file || v.path : '';
      if (r && /^[0-9a-f]{32}$/.test(r) && !lookup.has(r) && (file.startsWith('assets/') || /^[0-9a-f]{64}$/.test(v.sha256 || ''))) lookup.set(r, {file: file.startsWith('assets/') ? file : null, sha: v.sha256 || null});
      Object.values(v).forEach(walk);
    }
  })(data);
}
const artSprites = new Map(); // ruid -> key
for (const line of git('show', `${sourceCommit}:data/art_sprites.csv`).split('\n').slice(1)) { const c = line.split(','); if (/^[0-9a-f]{32}$/.test(c[4]?.trim())) artSprites.set(c[4].trim(), c[0]); }

// ---------- media store ----------
const atlasManifest = await readJSON(path.join(out, 'media-manifest.json'));
const atlasBySha = new Map(atlasManifest.map(m => [m.sha256, m.file]));
const slotManifest = new Map();
await mkdir(path.join(out, 'media/slots'), {recursive: true});
async function store(buf, ext, origin) {
  const h = sha256(buf);
  if (atlasBySha.has(h) && await exists(path.join(out, atlasBySha.get(h)))) return {file: atlasBySha.get(h), sha: h};
  const file = `media/slots/${h.slice(0, 24)}.${ext}`;
  if (!slotManifest.has(file)) { await writeFile(path.join(out, file), buf); slotManifest.set(file, {file, sha256: h, origin}); }
  return {file, sha: h};
}
const pngSize = buf => buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG' ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : null;
async function localFrame(rel, expect) {
  const abs = path.join(GAME, rel); const buf = await readFile(abs);
  const h = sha256(buf); if (expect && expect !== h) throw new Error(`sha mismatch ${rel}`);
  return {...await store(buf, 'png', rel.split('/').slice(0, 3).join('/')), size: pngSize(buf)};
}

// ---------- MSW resource clips ----------
const require = createRequire(import.meta.url);
let api = null;
if (!opts.offline) {
  try { api = require(path.join(GAME, '.claude/skills/msw-search/scripts/msw_resource_api.cjs')); }
  catch (e) { warnings.push(`msw-search wrapper unavailable: ${e.message}`); }
}
const cacheDir = path.join(out, 'slots-cache'); await mkdir(cacheDir, {recursive: true});
async function cached(name, fn) {
  const f = path.join(cacheDir, name);
  try { return JSON.parse(await readFile(f, 'utf8')); } catch {}
  if (!api) return null;
  const v = await fn(); await writeFile(f, JSON.stringify(v)); return v;
}
async function download(url, name) {
  const f = path.join(cacheDir, name);
  try { return await readFile(f); } catch {}
  if (!api) return null;
  if (!/^https:\/\/[a-z0-9.-]+\.nexoncdn\.co\.kr\//.test(url)) throw new Error(`unexpected media host: ${url}`);
  const res = await fetch(url); if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer()); await writeFile(f, buf); return buf;
}
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
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=', 'base64'); // 1×1 transparent
const mapleCache = new Map();
async function mapleClip(ruid) {
  if (mapleCache.has(ruid)) return mapleCache.get(ruid);
  const result = (async () => {
    const detail = await cached(`res-${ruid}.json`, () => api.getResource(ruid));
    if (!detail?.payload) return null;
    const p = detail.payload;
    const base = {ruid, type: detail.type, category: detail.category, dname: detail.dname || '', apiSize: [p.width, p.height]};
    if (detail.type === 'animationclip' && p.frames?.length) {
      const ids = p.frames.map(f => f.spriteRuid);
      const sprites = await cached(`batch-${ruid}.json`, () => api.getResourcesBatch(ids));
      const byId = new Map((Array.isArray(sprites) ? sprites : sprites?.items || sprites?.resources || []).map(s => [s.id, s]));
      const frames = []; let exact = true;
      for (const f of p.frames) {
        const s = byId.get(f.spriteRuid); const url = s?.payload?.thumbnail;
        if (!url && f.width <= 8 && f.height <= 8) { // tiny empty spacer frame (no thumbnail exists): keep its timing as a blank frame
          frames.push({...await store(BLANK_PNG, 'png', 'blank-spacer'), size: [f.width, f.height], pivot: f.pivot, spriteRuid: f.spriteRuid, blank: true}); continue;
        }
        if (!url) { exact = false; break; }
        const buf = await download(url, `sprite-${f.spriteRuid}.png`);
        if (!buf) { exact = false; break; }
        const size = pngSize(buf);
        if (!size || size[0] !== f.width || size[1] !== f.height) exact = false;
        frames.push({...await store(buf, 'png', 'msw-resource-thumbnail'), size, pivot: f.pivot, spriteRuid: f.spriteRuid});
      }
      const gif = p.thumbnail ? await download(p.thumbnail, `clip-${ruid}.gif`).catch(() => null) : null;
      const delays = gifDelays(gif);
      if (frames.length === p.frames.length) {
        return {...base, mediaKind: exact ? 'frames' : 'frame-thumbnails', frames, durations: delays?.length === frames.length ? delays : frames.map(() => 100),
          timingLabel: delays?.length === frames.length ? '메이플 미리보기 GIF 간격' : '검수용 100ms/장'};
      }
      if (gif) { const s = await store(gif, 'gif', 'msw-resource-thumbnail'); return {...base, mediaKind: 'thumbnail', frames: [{...s, size: [320, 240]}], durations: [100], timingLabel: '썸네일 GIF 한 장(브라우저 캔버스는 첫 장만 그림)'}; }
      return null;
    }
    if (p.thumbnail) {
      const buf = await download(p.thumbnail, `sprite-${ruid}.png`);
      const size = pngSize(buf);
      return {...base, mediaKind: detail.type === 'sprite' ? 'sprite' : 'thumbnail', frames: [{...await store(buf, 'png', 'msw-resource-thumbnail'), size, pivot: p.pivot}], durations: [100], timingLabel: '정지 그림'};
    }
    return null;
  })().catch(e => { warnings.push(`maple ${ruid}: ${e.message}`); return null; });
  mapleCache.set(ruid, result); return result;
}
// 11-03 효과 고르기 3자리 더: 게임이 메이플 클립의 장 일부를 우리 그룹 스프라이트로 올려 장 목록으로 쓰는 자리 (그룹 RUID는 공개 검색 API에 없음 → 원본 클립 장을 잘라 보여 준다)
//   키 = 그 칸의 첫 그룹 RUID · clip = 원본 메이플 클립 · from/to = 원본 장 번호(0부터) · ms = 게임 장별 간격 · loop = 게임에서 반복하는지
const GROUP_FRAMES = {
  c3747bdcde0e49a49d8c59ced4f1dd7b: {clip: '00b9a2f368a84e9d8e6a5a3aa69d60c7', from: 2, to: 15, ms: 150, loop: false, title: '스킬 31141502 불기둥 (앞 2장 뺀 14장)'},
  c3be0d020fbd43bfadfbe32586b5cd5f: {clip: '5c6f1aad97e8420f8f36154be00f62e7', from: 4, to: 9, ms: 120, loop: true, title: '흰 회오리 (도는 4~9장 반복)'},
};
async function groupFramesCandidate(key, ruids) {
  const g = GROUP_FRAMES[ruids[0]]; if (!g) return null;
  const clip = await mapleClip(g.clip); if (!clip || clip.frames.length <= g.to) return null;
  const frames = clip.frames.slice(g.from, g.to + 1); const pv = pivotBox(frames);
  return {id: `maple:${g.clip}`, source: 'maple', title: g.title, runtimeKey: key, ruids, frameRuids: frames.map(f => f.spriteRuid).filter(Boolean), resourceType: 'sprite', resourceName: clip.dname,
    frames: frames.map(f => f.file), sizes: frames.map(f => f.size), box: pv.box, offsets: pv.offsets, durations: frames.map(() => g.ms), timingLabel: `게임 장별 ${g.ms}ms (원본 ${g.clip.slice(0, 8)} ${g.from}~${g.to}장)`, loop: g.loop,
    mediaKind: clip.mediaKind, groupOf: {clip: g.clip, from: g.from, to: g.to}};
}
function pivotBox(frames) {
  if (!frames.every(f => f.pivot && f.size)) { const W = Math.max(...frames.map(f => f.size?.[0] || 0)), H = Math.max(...frames.map(f => f.size?.[1] || 0)); return {box: [W, H]}; }
  // MSW pivots are measured from the bottom-left (same as the game's pivot_y = 0.25 → ground line).
  const ax = Math.max(...frames.map(f => f.pivot.x)), ay = Math.max(...frames.map(f => f.size[1] - f.pivot.y));
  const W = ax + Math.max(...frames.map(f => f.size[0] - f.pivot.x)), H = ay + Math.max(...frames.map(f => f.pivot.y));
  return {box: [W, H], offsets: frames.map(f => [ax - f.pivot.x, ay - (f.size[1] - f.pivot.y)])};
}
const engineById = new Map();
const catalog = await readJSON(path.join(out, 'catalog.json'));
for (const e of catalog.engineEffects || []) engineById.set(e.id, e);
const USAGE = {connected_static_path: ['코드 연결 경로 있음', 'connected'], fallback_currently_shadowed: ['코덱스 그림에 가려진 원래 클립', 'shadowed'], registered_no_current_skill_consumer: ['등록만 · 부르는 스킬 없음', 'registered'], registered_no_live_consumer_found: ['등록만 · 부르는 곳 없음', 'registered']};
async function mapleCandidate(key, ruid, role) {
  const clip = await mapleClip(ruid); if (!clip) return null;
  const history = pickaxe(ruid); const first = history[history.length - 1];
  const p = props.get(key); const eng = engineById.get(key);
  const usage = USAGE[eng?.usage_status] || null;
  const pv = pivotBox(clip.frames);
  return {id: `maple:${ruid}`, source: 'maple', title: p?.comment ? p.comment.split('(')[0].replace(/^[^:]*:\s*/, '').trim() : key, runtimeKey: key, ruids: [ruid],
    frameRuids: clip.frames.map(f => f.spriteRuid).filter(Boolean), resourceType: clip.type, resourceName: clip.dname,
    frames: clip.frames.map(f => f.file), sizes: clip.frames.map(f => f.size), box: pv.box, offsets: pv.offsets, durations: clip.durations, timingLabel: clip.timingLabel, loop: true,
    mediaKind: clip.mediaKind, status: usage ? usage[1] : 'maple', statusLabel: role || (usage ? usage[0] : '메이플 리소스'),
    source_ref: p ? `${p.path}:${p.line}` : null, comment: p?.comment || eng?.source_comment || '',
    firstUse: first ? {commit: first.commit, date: first.date, subject: first.subject} : null};
}

// ---------- catalog candidates ----------
const catalogGroups = catalog.groups.filter(g => g.category === 'fx' && !g.hiddenDuplicate);
// Constants renamed after the catalog snapshot (same RUIDs, same consumers): new name → catalog name.
// 11-01 f9049165: the player bone-spear skill was removed and the skeleton mage kept its art under FxBoneBolt*.
const RENAMED = {'GameConst.FxBoneBolt': 'GameConst.FxSkillSpear', 'GameConst.FxBoneBoltHit': 'GameConst.FxSkillSpearHit'};
const groupByKey = new Map(); for (const g of catalog.groups) if (g.shortId && g.id.startsWith('runtime--')) groupByKey.set(g.shortId, g);
function catalogCandidate(g) {
  const size = g.bounds ? [g.bounds[2] - g.bounds[0], g.bounds[3] - g.bounds[1]] : g.sizes?.[0];
  return {id: `fx:${g.id}`, source: 'fx', origin: 'catalog', title: g.title, runtimeKey: g.shortId || null, ruids: (g.resourceKeys || []).filter(r => /^[0-9a-f]{32}$/.test(r)),
    frames: g.frames, sizes: g.sizes, box: size, crop: g.bounds, durations: g.durations, timingLabel: g.timingLabel, loop: !!g.loop,
    package: g.package, sha: g.sha256, catalogStatus: g.status, catalogConnection: g.connection, haystack: `${g.id} ${g.shortId || ''} ${(g.originalFrames || []).join(' ')}`};
}
function catalogStatus(c) {
  const {catalogStatus: s, catalogConnection: k} = c;
  const now = c.runtimeKey ? specRuids(c.runtimeKey) : null;
  if (k === 'connected' && now && c.ruids.join() !== now.ruids.join()) return ['previous', '이전 연결본 · 지금은 교체됨', 'legacy'];
  if (k === 'connected' && now) return ['connected', `코드 연결 · ${c.runtimeKey}`, 'current'];
  if (k === 'connected') return ['connected', '코드 연결(카탈로그 기준)', 'current'];
  if (s === 'current_candidate') return ['candidate', '제작 후보 · 미연결', 'pending'];
  if (s === 'unapproved') return ['unapproved', '검토 후보 · 미승인', 'pending'];
  if (k === 'registered' && s !== 'legacy') return ['registered', '등록만 · 화면에 안 나옴', 'pending'];
  if (k === 'registered') return ['legacy-registered', '이전 버전 · 등록만', 'legacy'];
  if (k === 'reused') return ['legacy-reused', '이전 버전 · 다른 자리 재사용', 'legacy'];
  return ['legacy', '이전 버전 · 미연결', 'legacy'];
}

// ---------- Codex FX v3 (added after the atlas snapshot) ----------
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || []; return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
const v3Root = path.join(GAME, 'assets/codex-skill-fx-v3');
const receiptBySha = new Map(); for (const [r, v] of lookup) if (v.sha) receiptBySha.set(v.sha, r);
const v3 = []; const v3BySha = new Map();
if (await exists(v3Root)) {
  for (const pkg of (await readdir(v3Root, {withFileTypes: true})).filter(d => d.isDirectory()).map(d => d.name).sort()) {
    const dir = path.join(v3Root, pkg); let rows;
    try { rows = parseCSV(await readFile(path.join(dir, 'resource-mapping.csv'), 'utf8')); } catch { continue; }
    const timing = new Map(); let review = null;
    for (const name of ['animation-timing.json', 'animation-timing-proposals.json']) {
      try {
        const t = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
        (function walk(v) { if (Array.isArray(v)) return v.forEach(walk); if (v && typeof v === 'object') { if (v.key && Number(v.duration_ms_proposal) > 0) timing.set(v.key, Number(v.duration_ms_proposal)); if (Array.isArray(v.review_durations_ms)) review = v.review_durations_ms; Object.values(v).forEach(walk); } })(t);
      } catch {}
    }
    const fam = new Map();
    for (const r of rows) { if (!r.key || !r.file) continue; const stem = r.key.replace(/-\d+$/, ''); if (!fam.has(stem)) fam.set(stem, []); fam.get(stem).push(r); }
    for (const [stem, list] of fam) {
      list.sort((a, b) => (Number(a.index0 ?? NaN) - Number(b.index0 ?? NaN)) || a.key.localeCompare(b.key, 'en', {numeric: true}));
      const frames = [];
      try {
        for (const r of list) {
          let rel = path.posix.join('assets/codex-skill-fx-v3', pkg, r.file);
          if (!await exists(path.join(GAME, rel))) rel = path.posix.join('assets/codex-skill-fx-v3', pkg, 'png', path.posix.basename(r.file));
          const f = await localFrame(rel, r.sha256 || null); if (!v3BySha.has(f.sha)) v3BySha.set(f.sha, rel);
          frames.push({...f, key: r.key, ruid: receiptBySha.get(f.sha) || null});
        }
      } catch (e) { warnings.push(`v3 ${pkg}/${stem}: ${e.message}`); continue; }
      const durations = list.map(r => timing.get(r.key)); const known = durations.every(Boolean);
      const W = Math.max(...frames.map(f => f.size[0])), H = Math.max(...frames.map(f => f.size[1]));
      const kind = /-full/.test(pkg) ? '통일 공정 전체본' : /remake/.test(pkg) ? '통일 공정 보정 재출력' : /revised/.test(pkg) ? '통일 공정 수정안' : '통일 공정 샘플';
      const uploaded = frames.every(f => f.ruid);
      v3.push({id: `fx:v3:${pkg}:${stem}`, source: 'fx', origin: 'v3', isNew: true, title: stem.replace(/^fx-unify-/, ''), runtimeKey: null,
        ruids: uploaded ? frames.map(f => f.ruid) : [], frames: frames.map(f => f.file), sizes: frames.map(f => f.size), box: [W, H],
        durations: known ? durations : (review?.length === frames.length ? review : frames.map(() => 100)), timingLabel: known ? '코덱스 제안 간격' : review?.length === frames.length ? '코덱스 검수 간격' : frames.length > 1 ? '검수용 100ms/장' : '정지 그림',
        loop: /poison-cloud|curse-circle|drain-vortex|whirl|arrow|throw|frost-shot/.test(stem) && !/peak|trace/.test(stem), package: `codex-skill-fx-v3/${pkg}`,
        sha: frames.map(f => f.sha), status: 'new', statusLabel: `${kind} · ${uploaded ? '업로드됨' : '미업로드'}`, tone: 'new',
        haystack: `${stem} ${list[0].logical_group || ''}`});
    }
  }
} else warnings.push('codex-skill-fx-v3 folder not found');

// ---------- assemble slots ----------
const allFx = [...v3, ...catalogGroups.map(catalogCandidate)];
const assigned = new Map(SLOTS.map(s => [s.id, []])); const unassigned = [];
const matchers = SLOTS.map(s => [s.id, s.match ? new RegExp(s.match, 'i') : null]);
for (const c of allFx) {
  // Exact runtime key first (a sibling layer's file path can look like another slot), then the name patterns.
  const exact = c.runtimeKey && SLOTS.find(s => s.runtime === c.runtimeKey);
  const hit = exact ? [exact.id] : matchers.find(([, re]) => re && re.test(c.haystack));
  if (hit) assigned.get(hit[0]).push(c); else unassigned.push(c);
}
const tupleKey = c => (c.sha || []).join('|');
const slots = [];
for (const [order, def] of SLOTS.entries()) {
  let current = null, currentNote = '';
  let currentRuids = null;
  if (def.runtime?.startsWith('catalog:')) {
    const g = catalog.groups.find(x => x.id === def.runtime.slice(8));
    if (g) { current = {...catalogCandidate(g), id: 'current', source: 'current', kind: 'codex', status: 'connected', statusLabel: '현재 사용 중 · 코드 연결', use: 'connected', runtimeKey: typeof g.connectionEvidence === 'string' ? g.connectionEvidence.split(';')[0] : g.id, since: null, note: `카탈로그 ${catalog.sourceCommit.slice(0, 8)} 기준 연결 확인 (이 자리는 상수 파일 밖에서 연결)`}; }
  } else if (def.runtime) {
    const r = specRuids(def.runtime);
    if (!r) currentNote = `${def.runtime} 선언을 ${sourceCommit.slice(0, 8)}에서 찾지 못함`;
    else if (!r.ruids.length) {
      // 칸이 비면 게임은 그 자리의 메이플 폴백 칸(def.maple 순서)을 그린다 (11-03 효과 고르기: 코덱스 칸을 비우고 폴백 칸에 고른 클립) → 그 클립이 「현재 사용 중」
      for (const key of def.maple || []) {
        const fr = specRuids(key); if (!fr?.ruids.length) continue;
        const m = await mapleCandidate(fr.key, fr.ruids[0]); if (!m) continue;
        const since = period(key, fr.ruids).from;
        current = {...m, id: 'current', source: 'current', kind: 'maple', runtimeKey: key, ruids: fr.ruids, use: 'connected', status: 'connected',
          statusLabel: `코드 연결 확인 · 메이플 리소스 (${def.runtime} 비움 → ${key})`, source_ref: `${fr.prop.path}:${fr.prop.line}`, comment: fr.prop.comment,
          since: since ? {commit: since.commit, date: since.date, subject: since.subject} : null, firstUse: m.firstUse};
        break;
      }
      if (!current) currentNote = `비어 있음 — ${r.prop.comment.split('→')[1]?.split('·')[0]?.trim() || '대체 연출'}`;
    }
    else {
      currentRuids = r.ruids;
      const twin = groupByKey.get(def.runtime) || groupByKey.get(RENAMED[def.runtime]);
      const use = twin ? (twin.connection === 'connected' ? 'connected' : 'registered') : engineById.get(r.key) ? (USAGE[engineById.get(r.key).usage_status]?.[1] === 'connected' ? 'connected' : 'registered') : 'unknown';
      const useLabel = {connected: '코드 연결 확인', registered: '선언만 · 부르는 곳 없음', unknown: '선언됨 · 연결 확인 안 됨'}[use];
      const since = period(def.runtime, r.ruids).from;
      const common = {id: 'current', source: 'current', runtimeKey: def.runtime, ruids: r.ruids, use, status: use, statusLabel: useLabel, source_ref: `${r.prop.path}:${r.prop.line}`, comment: r.prop.comment,
        since: since ? {commit: since.commit, date: since.date, subject: since.subject} : null};
      if (twin && twin.resourceKeys.join() === r.ruids.join()) {
        current = {...catalogCandidate(twin), ...common, kind: 'codex', package: twin.package, title: RENAMED[def.runtime] ? def.title : twin.title};
      } else if (r.ruids.every(x => lookup.get(x)?.file || v3BySha.has(lookup.get(x)?.sha))) {
        try {
          const fileOf = x => lookup.get(x).file || v3BySha.get(lookup.get(x).sha);
          const frames = []; for (const x of r.ruids) frames.push(await localFrame(fileOf(x), lookup.get(x).sha));
          const W = Math.max(...frames.map(f => f.size[0])), H = Math.max(...frames.map(f => f.size[1]));
          const t = msList(r.key, frames.length);
          const pkgPath = fileOf(r.ruids[0]).split('/').slice(1, 3).join('/');
          current = {...common, kind: 'codex', title: twin?.title || def.title, variant: path.posix.basename(fileOf(r.ruids[0])).replace(/-\d+\.png$/, ''),
            frames: frames.map(f => f.file), sizes: frames.map(f => f.size), box: [W, H], sha: frames.map(f => f.sha),
            durations: t?.durations || frames.map(() => 100), timingLabel: t?.label || (frames.length > 1 ? '검수용 100ms/장' : '정지 그림'), loop: twin ? !!twin.loop : false, package: pkgPath};
        } catch (e) { currentNote = `현재 그림 파일을 읽지 못함: ${e.message}`; }
      } else if (GROUP_FRAMES[r.ruids[0]]) {
        const m = await groupFramesCandidate(r.key, r.ruids);
        if (m) current = {...m, ...common, kind: 'maple', title: m.title, statusLabel: `${useLabel} · 메이플 클립 장 일부(그룹 스프라이트 ${r.ruids.length}장)`};
        else currentNote = `현재 RUID ${r.ruids[0]}의 원본 클립 장을 찾지 못함`;
      } else {
        const m = await mapleCandidate(r.key, r.ruids[0]);
        if (m) current = {...m, ...common, kind: 'maple', title: m.title, statusLabel: `${useLabel} · 메이플 리소스`, firstUse: m.firstUse};
        else currentNote = `현재 RUID ${r.ruids[0]}의 그림을 찾지 못함`;
      }
    }
  } else currentNote = '이 자리를 정하는 상수 없음 — 후보만 비교';
  // FX candidates
  const seen = new Set(current?.sha ? [tupleKey(current)] : []);
  const fx = [];
  for (const c of assigned.get(def.id)) {
    const k = tupleKey(c);
    if (k && seen.has(k)) { if (current && c.package && !current.alsoIn) current.alsoIn = c.package; continue; }
    if (k) seen.add(k);
    if (c.origin === 'catalog') { const [status, label, tone] = catalogStatus(c); Object.assign(c, {status, statusLabel: label, tone}); if (status === 'previous') { c.period = period(c.runtimeKey, c.ruids); c.title = `${c.title} (이전 ${c.frames.length}장판)`; } }
    fx.push(c);
  }
  const rank = c => c.origin === 'v3' ? (/full/.test(c.package) ? 0 : 1) : ({previous: 2, connected: 3, candidate: 4, unapproved: 4, registered: 5}[c.status] ?? 6);
  fx.sort((a, b) => rank(a) - rank(b));
  // Maple candidates
  const maple = []; const mapleSeen = new Set(current?.kind === 'maple' ? current.ruids : []);
  for (const key of def.maple || []) {
    const r = specRuids(key); const ruid = r?.ruids[0] || engineById.get(key)?.frame_ruids?.[0];
    if (!ruid || mapleSeen.has(ruid)) continue; mapleSeen.add(ruid);
    const m = await mapleCandidate(key, ruid);
    if (m) maple.push(m); else warnings.push(`maple candidate missing for ${def.id} ${key}`);
  }
  // Searched MSW clips (fixed list in maple-picks.mjs): 「메이플 후보 · 검색」
  for (const pick of MAPLE_PICKS[def.id] || []) {
    if (mapleSeen.has(pick.ruid)) continue; mapleSeen.add(pick.ruid);
    const clip = await mapleClip(pick.ruid);
    if (!clip) { warnings.push(`search pick missing for ${def.id} ${pick.ruid}`); continue; }
    const pv = pivotBox(clip.frames);
    maple.push({id: `maple:${pick.ruid}`, source: 'maple', origin: 'search', title: pick.name || clip.dname, runtimeKey: null, ruids: [pick.ruid],
      frameRuids: clip.frames.map(f => f.spriteRuid).filter(Boolean), resourceType: clip.type, resourceName: clip.dname,
      frames: clip.frames.map(f => f.file), sizes: clip.frames.map(f => f.size), box: pv.box, offsets: pv.offsets, durations: clip.durations, timingLabel: clip.timingLabel, loop: true,
      mediaKind: clip.mediaKind, status: 'search', statusLabel: pick.part ? `${pick.part} 효과` : '메이플 효과', tone: 'maple', reason: pick.reason});
  }
  for (const c of [current, ...fx, ...maple]) if (c) delete c.haystack;
  slots.push({id: def.id, title: def.title, group: def.group, order, runtime: def.runtime || null, currentNote, current, fx, maple, mapleExcluded: MAPLE_EXCLUDED[def.id] || null});
}
for (const c of unassigned) { if (c.origin === 'catalog') { const [status, label, tone] = catalogStatus(c); Object.assign(c, {status, statusLabel: label, tone}); } delete c.haystack; }
const scrub = s => String(s).split(GAME).join('<game>').replace(/\/(?:Users|private)\/[^\s'"]*/g, '<local>');
warnings.splice(0, warnings.length, ...warnings.map(scrub));

const counts = {
  slots: slots.length,
  current: slots.filter(s => s.current && s.current.use === 'connected').length,
  currentDeclared: slots.filter(s => s.current).length,
  fx: slots.reduce((n, s) => n + s.fx.length + (s.current?.kind === 'codex' ? 1 : 0), 0) + unassigned.length,
  fxNew: slots.reduce((n, s) => n + s.fx.filter(c => c.origin === 'v3').length, 0),
  maple: slots.reduce((n, s) => n + s.maple.length + (s.current?.kind === 'maple' ? 1 : 0), 0),
  mapleSearch: slots.reduce((n, s) => n + s.maple.filter(c => c.origin === 'search').length, 0),
  mapleSearchSlots: slots.filter(s => s.maple.some(c => c.origin === 'search')).length,
  mapleClips: new Set(slots.flatMap(s => [...s.maple, ...(s.current?.kind === 'maple' ? [s.current] : [])].map(c => c.ruids[0]))).size,
  unassigned: unassigned.length
};
const data = {createdAt: new Date().toISOString(), sourceRef: REF, sourceCommit, sourceDate, catalog: {createdAt: catalog.createdAt, sourceCommit: catalog.sourceCommit},
  groups: SLOT_GROUPS, slots, unassigned, counts, warnings,
  notes: ['현재 사용 중 = 정본 커밋의 상수 선언과 카탈로그·엔진 효과 대조. 실제 플레이 녹화가 아니다.', '메이플 그림은 MSW 리소스 검색 API(getResource·getResourcesBatch)의 프레임 PNG 썸네일과 미리보기 GIF 간격으로 재생한다.', '카드마다 크기를 맞춘다. 게임 속 크기 비율이 아니다.']};
assertSanitized(data, 'slots');
await writeFile(path.join(out, 'slots.json'), JSON.stringify(data));
await writeFile(path.join(out, 'slots-manifest.json'), JSON.stringify([...slotManifest.values()]));
console.log(`Slots ${counts.slots} · current ${counts.current}/${counts.currentDeclared} · FX ${counts.fx} (new ${counts.fxNew}) · maple ${counts.maple} (${counts.mapleClips} clips, search ${counts.mapleSearch} in ${counts.mapleSearchSlots} slots) · unassigned ${counts.unassigned} · stored ${slotManifest.size} new files`);
if (warnings.length) console.log('Warnings:\n- ' + warnings.join('\n- '));
