// 「장면 보기」 자료 생성: content/scene/scene.json · scene-manifest.json · media/*.png (모두 Git 제외).
//
//   npm run scene -- --game <게임 체크아웃> [--ref origin/main]
//
// 게임 체크아웃은 읽기만 한다(git show로 정본 커밋의 상수 선언 · 증거 영상/스크린숏 파일 읽기). 그쪽에 아무것도 쓰지 않는다.
// 1) scripts/scene-defs.mjs의 자리별 배치 규칙에 정본 커밋의 property 값을 채운다(값마다 출처: 읽음/코드 옮김/추정).
// 2) scripts/scene-actors.mjs의 배우·맵 바탕을 ffmpeg로 잘라 PNG로 저장한다(배경 지우기는 근사).
// 3) 메이플 클립 프레임 피벗(npm run slots가 받아 둔 content/assets/slots-cache)을 모아 둔다.
import {readFile, writeFile, mkdir, rm, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readJSON, assertSanitized} from './lib.mjs';
import {SLOTS} from './slot-defs.mjs';
import {SCENE_RULES} from './scene-defs.mjs';
import {SCENE_ACTORS, SCENE_MAPS} from './scene-actors.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'content/scene');
const argv = process.argv.slice(2); const opts = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i].replace(/^--/, ''); if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts[k] = argv[++i]; else opts[k] = true; }
if (!opts.game) throw new Error('Usage: npm run scene -- --game <game checkout> [--ref origin/main]');
const GAME = path.resolve(opts.game); const REF = opts.ref || 'origin/main';
const sh = (cmd, args, extra = {}) => execFileSync(cmd, args, {maxBuffer: 1e9, ...extra});
const git = (...args) => sh('git', ['-C', GAME, ...args], {encoding: 'utf8'});
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const warnings = [];

// ---------- 정본 커밋의 상수 ----------
const SOURCES = {
  GameConst: 'RootDesk/MyDesk/Common/GameConst.mlua', SkillEffects: 'RootDesk/MyDesk/Skill/SkillEffects.mlua', Util: 'RootDesk/MyDesk/Common/Util.mlua',
  Projectile: 'RootDesk/MyDesk/Combat/Projectile.mlua', PlayerAttack: 'RootDesk/MyDesk/Combat/PlayerAttack.mlua', MageBolts: 'RootDesk/MyDesk/Undead/MageBolts.mlua',
  PlayerStats: 'RootDesk/MyDesk/Player/PlayerStats.mlua', ShadowUnit: 'RootDesk/MyDesk/Shadow/ShadowUnit.mlua', MonsterAttack: 'RootDesk/MyDesk/Monster/MonsterAttack.mlua',
  MonsterStatus: 'RootDesk/MyDesk/Monster/MonsterStatus.mlua', Monster: 'RootDesk/MyDesk/Monster/Monster.mlua', UndeadSystem: 'RootDesk/MyDesk/Undead/UndeadSystem.mlua',
  RiteGiantMoves: 'RootDesk/MyDesk/Undead/RiteGiantMoves.mlua'
};
const sourceCommit = git('rev-parse', REF).trim();
const sourceDate = git('show', '-s', '--format=%cI', sourceCommit).trim();
const props = new Map();
for (const [file, rel] of Object.entries(SOURCES)) {
  let text = '';
  try { text = git('show', `${sourceCommit}:${rel}`); } catch { warnings.push(`${rel} 없음 (${sourceCommit.slice(0, 8)})`); continue; }
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*property\s+(?:string|integer|number)\s+(\w+)\s*=\s*(?:"([^"]*)"|([-\d.]+))/);
    if (m) props.set(`${file}.${m[1]}`, {value: m[2] ?? m[3], at: `${rel}:${i + 1}`});
  });
}
const config = new Map();
try {
  git('show', `${sourceCommit}:data/config.csv`).split('\n').forEach((line, i) => { const c = line.split(','); if (c.length > 1 && /^[\w]+$/.test(c[0])) config.set(c[0], {value: c[1], at: `data/config.csv:${i + 1}`}); });
} catch { warnings.push('data/config.csv 없음'); }

// ---------- 배치 규칙 채우기 ----------
function accessor(uses, field) {
  const rec = (t, key, v, at, why) => { uses.push({f: field.f, t, key: key || null, v, at: at || null, why: why || null}); return v; };
  const part = (p, name) => p && p.value.split(';').find(x => x.split('=')[0].trim() === name);
  return {
    c(key, fb) { const p = props.get(key); return p && p.value !== '' && Number.isFinite(+p.value) ? rec('read', key, +p.value, p.at) : rec('est', key, fb, null, `${key} 선언을 ${sourceCommit.slice(0, 8)}에서 못 찾음`); },
    kv(key, name, fb) { const p = props.get(key), s = part(p, name), v = s ? Number(s.split('=').slice(1).join('=')) : NaN;
      return Number.isFinite(v) ? rec('read', `${key}:${name}`, v, p.at) : rec('est', `${key}:${name}`, fb, null, '선언을 못 찾음'); },
    kvList(key, name) { const p = props.get(key), s = part(p, name);
      if (!s) { rec('est', `${key}:${name}`, [], null, '선언을 못 찾음'); return []; }
      const list = s.split('=').slice(1).join('=').split(',').map(Number).filter(Number.isFinite); rec('read', `${key}:${name}`, list.join(','), p.at); return list; },
    list(key) { const p = props.get(key); if (!p) { rec('est', key, [], null, '선언을 못 찾음'); return []; }
      const list = String(p.value).split(',').map(Number).filter(Number.isFinite); rec('read', key, list.join(','), p.at); return list; },
    cfg(name, fb) { const c = config.get(name); return c && Number.isFinite(+c.value) ? rec('read', `config.${name}`, +c.value, c.at) : rec('est', `config.${name}`, fb, null, 'config.csv에서 못 찾음'); },
    code(v, src) { return rec('code', null, v, src); },
    est(v, why) { return rec('est', null, v, null, why); }
  };
}
const round = v => typeof v === 'number' ? Math.round(v * 10000) / 10000 : Array.isArray(v) ? v.map(round) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, round(b)])) : v;
function resolveRule(def) {
  const uses = [], field = {f: ''}, k = accessor(uses, field);
  const val = (name, v) => { field.f = name; return typeof v === 'function' ? round(v(k)) : v; };
  const r = {};
  for (const [name, v] of Object.entries(def)) {
    if (name === 'proj' && v) { r.proj = {}; for (const [pn, pv] of Object.entries(v)) r.proj[pn] = val(`proj.${pn}`, pv); }
    else r[name] = val(name, v);
  }
  r.uses = uses;
  r.estimated = [...new Set(uses.filter(u => u.t === 'est').map(u => u.f))];
  return r;
}
const ruleById = new Map(SCENE_RULES.map(r => [r.id, r]));
const rules = {};
for (const s of SLOTS) {
  const def = ruleById.get(s.id);
  if (!def) { warnings.push(`장면 규칙 없음: ${s.id}`); continue; }
  rules[s.id] = resolveRule(def);
}
for (const id of ruleById.keys()) if (!SLOTS.find(s => s.id === id)) warnings.push(`자리 목록에 없는 장면 규칙: ${id}`);

// ---------- 배우·맵 그림 ----------
function probeSize(abs) { const o = sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', abs], {encoding: 'utf8'}); return o.trim().split('\n')[0].split(',').map(Number); }
function decode(abs, t, crop) {
  const [W, H] = crop ? [crop[2], crop[3]] : probeSize(abs);
  const args = ['-v', 'error', ...(t != null ? ['-ss', String(t)] : []), '-i', abs, '-frames:v', '1', ...(crop ? ['-vf', `crop=${crop[2]}:${crop[3]}:${crop[0]}:${crop[1]}`] : []), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'];
  const data = sh('ffmpeg', args);
  if (data.length !== W * H * 4) throw new Error(`decode size mismatch ${abs}`);
  return {w: W, h: H, data};
}
// 가장자리에서 시작해 이웃 화소와 색 차이가 tol보다 작으면 바닥으로 보고 지운다(바닥이 고르게 밝고 배우 외곽선이 진할 때 잘 맞음).
function floodMatte(img, tol, tolRef = Infinity) {
  const {w, h, data} = img, bg = new Uint8Array(w * h), q = [];
  // tolRef: 가장자리 화소의 가운데값(바닥색)과도 이만큼 가까워야 지운다 - 바닥과 다른 색(머리카락 등)이 가장자리에 닿아도 남김
  const edge = []; for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) edge.push(y * w, y * w + w - 1);
  const med = [0, 1, 2].map(c => edge.map(i => data[i * 4 + c]).sort((a, b) => a - b)[edge.length >> 1]);
  const near = n => Math.abs(data[n * 4] - med[0]) + Math.abs(data[n * 4 + 1] - med[1]) + Math.abs(data[n * 4 + 2] - med[2]) < tolRef;
  const diff = (a, b) => Math.abs(data[a * 4] - data[b * 4]) + Math.abs(data[a * 4 + 1] - data[b * 4 + 1]) + Math.abs(data[a * 4 + 2] - data[b * 4 + 2]);
  for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
  for (const i of q) if (near(i)) bg[i] = 1;
  for (let j = q.length - 1; j >= 0; j--) if (!bg[q[j]]) q.splice(j, 1);
  while (q.length) {
    const i = q.pop(), x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx; if (!bg[n] && diff(n, i) < tol && near(n)) { bg[n] = 1; q.push(n); }
    }
  }
  for (let i = 0; i < w * h; i++) if (bg[i]) data[i * 4 + 3] = 0;
}
// 가장 큰 덩어리의 4% 미만인 떨어진 조각(바닥 무늬 부스러기)은 지운다.
function keepMain(img, frac = 0.04) {
  const {w, h, data} = img, label = new Int32Array(w * h), sizes = [0];
  for (let i = 0; i < w * h; i++) {
    if (label[i] || data[i * 4 + 3] < 8) continue;
    const id = sizes.length, st = [i]; label[i] = id; let n = 0;
    while (st.length) { const j = st.pop(); n++; const x = j % w, y = (j / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const m = ny * w + nx; if (!label[m] && data[m * 4 + 3] >= 8) { label[m] = id; st.push(m); } } }
    sizes.push(n);
  }
  const big = Math.max(0, ...sizes);
  for (let i = 0; i < w * h; i++) if (label[i] && sizes[label[i]] < big * frac) data[i * 4 + 3] = 0;
}
function trim(img) {
  const {w, h, data} = img; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error('배우 그림이 비었음(배경 지우기 값 확인)');
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1, out = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < nh; y++) data.copy(out, y * nw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + nw) * 4);
  return {w: nw, h: nh, data: out, offset: [x0, y0]};
}
function flip(img) {
  const {w, h, data} = img, out = Buffer.alloc(data.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.copy(out, (y * w + (w - 1 - x)) * 4, (y * w + x) * 4, (y * w + x) * 4 + 4);
  return {...img, data: out};
}
// 발 = 불투명 화소 맨 아랫줄 · 가로는 아래 10% 줄 불투명 화소의 가운데.
function feetOf(img) {
  const {w, h, data} = img; let bottom = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= 8) bottom = y;
  let sx = 0, n = 0; const top = Math.max(0, bottom - Math.max(2, Math.round(h * 0.1)));
  for (let y = top; y <= bottom; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] >= 8) { sx += x; n++; }
  return [n ? Math.round(sx / n) : Math.round(w / 2), bottom + 1];
}
const manifest = []; const shaOf = new Map();
async function encode(img, name) {
  const file = `media/${name}.png`, abs = path.join(out, file);
  sh('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${img.w}x${img.h}`, '-i', '-', abs], {input: img.data});
  const buf = await readFile(abs); const h = sha256(buf); manifest.push({file, sha256: h}); shaOf.set(file, h); return file;
}

// 다시 만들 결과만 지운다 — content/scene/incoming/(정식 배우 PNG 받는 곳)은 남긴다.
for (const f of ['media', 'scene.json', 'scene-manifest.json']) await rm(path.join(out, f), {recursive: true, force: true});
await mkdir(path.join(out, 'media'), {recursive: true});
const catalog = await readJSON(path.join(root, 'content/assets/catalog.json'));
async function sourceImage(src) {
  if (src.kind === 'capture') {
    const abs = path.join(GAME, src.file);
    return {img: decode(abs, src.t ?? null, src.crop), meta: {file: src.file, t: src.t ?? null, crop: src.crop, zoom: src.zoom ?? null, matte: src.matte || null, tol: src.tol ?? null, sha256: sha256(await readFile(abs))}};
  }
  if (src.kind === 'atlas') {
    const g = catalog.groups.find(x => x.id === src.group); if (!g) throw new Error(`atlas group 없음: ${src.group}`);
    const rel = g.frames[src.frame || 0], abs = path.join(root, 'content/assets', rel);
    return {img: decode(abs, null, null), meta: {group: src.group, frame: src.frame || 0, catalogFrame: rel, original: (g.originalFrames || [])[src.frame || 0] || null, sha256: sha256(await readFile(abs))}};
  }
  if (src.kind === 'png') {
    const abs = path.join(root, src.file);
    return {img: decode(abs, null, src.crop || null), meta: {file: src.file, crop: src.crop || null, matte: src.matte || null, tol: src.tol ?? null, sha256: sha256(await readFile(abs))}};
  }
  throw new Error(`알 수 없는 source.kind ${src.kind}`);
}
const actors = [];
for (const a of SCENE_ACTORS) {
  try {
    const {img, meta} = await sourceImage(a.source);
    if (a.source.matte === 'flood') { floodMatte(img, a.source.tol || 40, a.source.tolRef || Infinity); keepMain(img); }
    let pic = trim(img); if (a.flip) pic = flip(pic);
    const feet = a.source.feet ? [a.source.feet[0] - pic.offset[0], a.source.feet[1] - pic.offset[1]] : feetOf(pic);
    if (a.source.feet && a.flip) feet[0] = pic.w - feet[0];
    const file = await encode(pic, `actor-${a.id}`);
    actors.push({id: a.id, role: a.role, pose: a.pose, label: a.label, file, v: shaOf.get(file).slice(0, 12), size: [pic.w, pic.h], feet, pxPerCell: round(a.source.pxPerCell), kind: a.source.kind,
      approx: a.source.kind === 'capture' || !!a.source.matte, flip: !!a.flip, source: meta, note: a.note || ''});
  } catch (e) { warnings.push(`배우 ${a.id}: ${e.message}`); }
}
const maps = [];
for (const m of SCENE_MAPS) {
  try {
    const {img, meta} = await sourceImage(m.source);
    const file = await encode(img, `map-${m.id}`);
    maps.push({id: m.id, label: m.label, file, v: shaOf.get(file).slice(0, 12), size: [img.w, img.h], pxPerCell: round(m.source.pxPerCell), source: meta, note: m.note || ''});
  } catch (e) { warnings.push(`맵 ${m.id}: ${e.message}`); }
}

// ---------- 메이플 클립 피벗 (위에서 잰 px · 저장된 썸네일 크기 기준) ----------
const pivots = {};
let slotsData = null;
try { slotsData = await readJSON(path.join(root, 'content/assets/slots.json')); } catch { warnings.push('content/assets/slots.json 없음 — 메이플 피벗 생략'); }
if (slotsData) for (const s of slotsData.slots) for (const c of [s.current, ...s.maple]) {
  if (!c || !(c.source === 'maple' || c.kind === 'maple') || !c.ruids?.[0] || pivots[c.ruids[0]]) continue;
  try {
    const res = await readJSON(path.join(root, 'content/assets/slots-cache', `res-${c.ruids[0]}.json`));
    const fr = res.payload?.frames || [];
    if (fr.length !== c.frames.length || !fr.every(f => f.pivot)) continue;
    pivots[c.ruids[0]] = fr.map((f, i) => { const [sw, shh] = c.sizes?.[i] || [f.width, f.height]; return [round(f.pivot.x * sw / f.width), round((f.height - f.pivot.y) * shh / f.height)]; });
  } catch {}
}

const scrub = s => String(s).split(GAME).join('<game>').replace(/\/(?:Users|private)\/[^\s'"]*/g, '<local>');
const est = Object.values(rules).reduce((n, r) => n + (r.estimated.length ? 1 : 0), 0);
const data = {createdAt: new Date().toISOString(), sourceRef: REF, sourceCommit, sourceDate,
  counts: {rules: Object.keys(rules).length, rulesWithEstimate: est, actors: actors.length, maps: maps.length, maplePivots: Object.keys(pivots).length},
  rules, actors, maps, pivots, warnings: warnings.map(scrub),
  notes: ['웹 합성 근사 — 메이커 실녹화가 아니다. 배치 규칙은 정본 커밋의 상수 선언(읽음)·코드 지역 값(옮김)·추정으로 나눠 적었다.',
    '배우 그림은 증거 영상·스크린숏에서 잘라 배경을 근사로 지웠다(capture) 또는 에셋 도감 몸 프레임(atlas)이다. 다음 메이커 회차의 정식 PNG로 바꿀 수 있다.',
    '피격 번쩍임은 배우 그림에 흰빛을 덮어 흉내 낸 근사치다.']};
assertSanitized(data, 'scene');
await writeFile(path.join(out, 'scene.json'), JSON.stringify(data));
await writeFile(path.join(out, 'scene-manifest.json'), JSON.stringify(manifest));
console.log(`Scene rules ${data.counts.rules} (추정 포함 ${est}) · actors ${actors.length} · maps ${maps.length} · maple pivots ${data.counts.maplePivots} · files ${manifest.length} · game ${sourceCommit.slice(0, 8)}`);
if (warnings.length) console.log('Warnings:\n- ' + data.warnings.join('\n- '));
