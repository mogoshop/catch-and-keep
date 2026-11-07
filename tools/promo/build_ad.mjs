#!/usr/bin/env node
// 홍보 영상 조립기 — 컷 목록(JSON) + 글귀 세트 → 1080×1920(세로) / 1920×1080(가로) 30fps H.264 mp4
//
// 사용:
//   node tools/promo/build_ad.mjs tools/promo/cuts/ad1-fixed.json
//   node tools/promo/build_ad.mjs <컷목록.json> [--copy tools/promo/copy.json] [--set ad1] [--style fixed|narrative|loop|trailer]
//                                  [--src-root assets/maple_maketing_video] [--out 경로.mp4] [--contact 경로.jpg] [--keep]
//
// 새 녹화 재료로 다시 돌리기: 컷 목록의 "src"만 "rec/scene-03.mp4"처럼 바꾸고 start/dur/cx/cy를 맞춘 뒤 같은 명령.
// 해상도가 1080p가 아니어도 크롭 창은 세로 비율로 맞춰진다(좌표 cx·cy·blur는 그 원본 화소 기준).
//
// 처리 순서 (컷마다):
//   ffmpeg 자르기+크롭 → (흐림 영역 있으면) python3 nametag_blur.py track/apply → 중간 파일 cut-N.mkv
// 그다음 한 번에: 확대(lanczos) · 세로면 위쪽 흐린 바탕 · 글자 PNG 겹치기 · 컷 사이 디졸브(xfade) · 엔드카드
// 소리: 컷 소리를 acrossfade로 잇고 loudnorm 2단계(I=-16 LUFS, TP=-1.5) → 엔드카드 전 0.6초 페이드아웃
// 글자: ffmpeg에 drawtext가 없어 promo_overlay.py(Pillow)로 투명 PNG를 그려 overlay
// 3차(v3): 글귀 세트에 "style": "minimal"이면 띠 없이 작은 흰 글자 한 줄(그림자만) — tag(고정 한 줄) · perCut(컷마다) · 짧은 검정 엔드카드.
//   세로 전체 화면은 layout.videoTop 0(540×960 → 정확히 2배). 무음 재료 컷은 "audioFrom": {src, start}로 다른 녹화의 게임 소리를 그 컷 길이만큼 이어 붙인다.
// 4차(v4): "timeline": [{name, items, from, to, fade}] — 컷과 상관없이 영상 전체 시각으로 켜고 끄는 글자 판(디졸브 뒤에 겹침).
//   from/to가 음수면 엔드카드 시작 시각 기준(-5 = 엔드카드 5초 전). "atCut": k + "dur" = k번째 컷 시작부터 dur초. "endCard": {items, bg} — 엔드카드를 직접 그림(로고 그림은 items의 type "image").
//   "endTransition": 0.3 = 본편 → 엔드카드 디졸브만 따로(기본은 transition). timeline 항목 "fadeIn"/"fadeOut"(초)으로 등장·소멸을 따로, items에 "image"(그림 레이어)도 가능.
//   "baseItems": [...] — 위·아래 띠 판(base)에 덧붙이는 고정 항목(본편 처음~끝, 엔드카드 디졸브 때 컷과 함께 사라짐).
//   "noCaptions": true면 글귀 세트의 장면 자막(captions/perCut)을 쓰지 않는다. 이름표 흐림은 tagTemplates를 빼면 꺼진다.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PY = 'python3';

// ---------- 인자 ----------
const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n'));
  process.exit(0);
}
const specPath = path.resolve(argv[0]);
const opt = {};
for (let i = 1; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '');
  if (k === 'keep' || k === 'no-tags') opt[k] = true;
  else opt[k] = argv[++i];
}
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const id = spec.id || path.basename(specPath, '.json');
const style = opt.style || spec.style || 'fixed';
const format = spec.format || (style === 'trailer' || style === 'loop' ? 'landscape' : 'vertical');
const srcRoot = path.resolve(ROOT, opt['src-root'] || spec.srcRoot || 'assets/maple_maketing_video');
const outPath = path.resolve(ROOT, opt.out || spec.out || `assets/maple_maketing_video/out/${id}.mp4`);
const contactPath = opt.contact || spec.contact ? path.resolve(ROOT, opt.contact || spec.contact) : null;
const copyPath = path.resolve(ROOT, opt.copy || spec.copy || 'tools/promo/copy.json');
const copySetName = opt.set || spec.copySet;
const copy = copySetName ? JSON.parse(fs.readFileSync(copyPath, 'utf8'))[copySetName] : {};
if (copySetName && !copy) throw new Error(`글귀 세트 없음: ${copySetName}`);
const FPS = 30;
const T = spec.transition ?? 0.2;
const TE = spec.endTransition ?? T; // 본편 → 엔드카드 디졸브 길이(기본은 컷 사이와 같음)
const W = format === 'vertical' ? 1080 : 1920;
const H = format === 'vertical' ? 1920 : 1080;
const videoTop = format === 'vertical' ? (spec.layout?.videoTop ?? 380) : 0;
const vScale = spec.layout?.scale ?? 2; // 세로: 원본 1080p 기준 몇 배로 키울지 (2 = 540폭 크롭)
const zoomDefault = spec.landscape?.zoom ?? 1;
const endDur = style === 'loop' ? 0 : (spec.endDur ?? copy.endDur ?? 1.5);
const audioMode = style === 'loop' ? 'none' : (spec.audio || 'game');
const work = path.resolve(ROOT, 'assets/maple_maketing_video/out/work', id);
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const log = (...a) => console.log(`[${id}]`, ...a);
function run(cmd, args, { quiet = true } = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    console.error(r.stderr?.slice(-4000));
    throw new Error(`${cmd} 실패 (${r.status})`);
  }
  if (!quiet) process.stdout.write(r.stdout);
  return r;
}
function pipeline(stages) {
  // stages: [[cmd,args], ...] — 앞 표준출력을 뒤 표준입력으로
  return new Promise((resolve, reject) => {
    const procs = stages.map(([c, a]) => spawn(c, a, { stdio: ['pipe', 'pipe', 'pipe'] }));
    const errs = procs.map(() => []);
    procs.forEach((p, i) => {
      p.stderr.on('data', (d) => errs[i].push(d));
      if (i < procs.length - 1) p.stdout.pipe(procs[i + 1].stdin);
      p.stdin.on('error', () => {});
    });
    procs[0].stdin.end();
    let left = procs.length, failed = null;
    procs.forEach((p, i) => p.on('close', (code) => {
      if (code !== 0 && !failed) failed = `${stages[i][0]} 종료 ${code}\n${Buffer.concat(errs[i]).toString().slice(-3000)}`;
      if (--left === 0) (failed ? reject(new Error(failed)) : resolve());
    }));
  });
}
const probeCache = {};
function probe(file) {
  if (probeCache[file]) return probeCache[file];
  const r = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file]);
  const s = JSON.parse(r.stdout).streams[0];
  const a = run('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file]).stdout.trim();
  return (probeCache[file] = { w: s.width, h: s.height, audio: a.length > 0 });
}
const even = (v) => Math.max(2, Math.round(v / 2) * 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const evenOff = (v) => Math.max(0, Math.floor(v / 2) * 2);

// ---------- 컷 길이 맞추기 ----------
const cuts = spec.cuts.map((c) => ({ ...c }));
if (style === 'loop') {
  const xf = spec.loop?.crossfade ?? 1;
  cuts[0].dur = (spec.targetDuration ?? cuts[0].dur) + xf;
}
const nClips = cuts.length + (endDur > 0 ? 1 : 0);
if (spec.targetDuration && style !== 'loop') {
  const others = cuts.slice(0, -1).reduce((s, c) => s + c.dur, 0);
  const need = spec.targetDuration - others - endDur + (nClips - 1) * T + (endDur > 0 ? TE - T : 0);
  if (need < 0.6) throw new Error(`targetDuration에 비해 컷이 너무 김 (마지막 컷 ${need.toFixed(2)}초)`);
  cuts[cuts.length - 1].dur = +need.toFixed(3);
}

// ---------- 0) 이름표 견본 (원본에 이름표가 찍힌 녹화만) ----------
let tagDefs = null;
if (spec.tagTemplates && c0NoTagsOff()) {
  const tp = JSON.parse(fs.readFileSync(path.resolve(ROOT, spec.tagTemplates), 'utf8'));
  const dir = path.join(work, 'tags');
  fs.mkdirSync(dir, { recursive: true });
  const src = path.resolve(srcRoot, tp.src);
  tagDefs = { src: tp.src, list: tp.tags.map((t) => {
    const png = path.join(dir, `${t.name}.png`);
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(t.t), '-i', src, '-frames:v', '1', '-vf', `crop=${t.w}:${t.h}:${t.x}:${t.y}`, png]);
    return { png, thr: t.thr ?? spec.tagThreshold ?? 0.6, thr_lum: t.thr_lum ?? 0.65, grow: t.grow ?? [3, 3, 3, 3] };
  }) };
}
function c0NoTagsOff() { return !opt['no-tags']; }

// ---------- 1) 컷 중간 파일 ----------
async function makeCut(c, i) {
  const src = path.resolve(srcRoot, c.src || 'play.mp4');
  const info = probe(src);
  const f = info.h / 1080;
  let cw, ch;
  if (c.fit === 'width') {
    cw = info.w; ch = info.h; // 화면 전체(로딩 그림·보상 판처럼 양옆이 잘리면 안 되는 컷)
  } else if (format === 'vertical') {
    cw = even((1080 / vScale) * f);
    ch = even(((1920 - videoTop) / vScale) * f);
  } else {
    const z = c.zoom ?? zoomDefault;
    cw = even(info.w / z); ch = even(info.h / z);
  }
  const cx = c.cx ?? info.w / 2, cy = c.cy ?? info.h / 2;
  if (c.fit === 'width' && c.box && format === 'vertical') { [, , cw, ch] = c.box.map((v) => even(v * 1)); } // 판 둘레만 잘라 폭에 맞춤
  const x0 = c.fit === 'width' && c.box && format === 'vertical' ? evenOff(c.box[0]) : evenOff(clamp(cx - cw / 2, 0, info.w - cw));
  const syDefault = format === 'vertical' ? (spec.layout?.sy ?? 205) * f : cy - ch / 2; // 세로: 위 안내 글줄(원본 y≈170~200)을 피해 조금 아래부터
  const y0 = c.fit === 'width' && c.box && format === 'vertical' ? evenOff(c.box[1]) : evenOff(clamp(c.sy != null ? c.sy * 1 : (c.cy != null ? cy - ch / 2 : syDefault), 0, info.h - ch));
  c._crop = { x0, y0, cw, ch };
  const out = path.join(work, `cut-${i}.mkv`);
  const seek = ['-ss', String(c.start), '-t', String(c.dur), '-i', src];
  const vf = `crop=${cw}:${ch}:${x0}:${y0},fps=${FPS}`;
  const regions = (c.blur || []).map((r) => {
    const o = { ...r };
    if (o.keys) o.keys = o.keys.map(([t, x, y]) => [t, x - x0, y - y0]);
    else { o.x -= x0; o.y -= y0; }
    return o;
  }).filter((r) => (r.keys ? true : r.x + r.w > 0 && r.y + r.h > 0 && r.x < cw && r.y < ch));
  if (tagDefs && (c.src || 'play.mp4') === tagDefs.src && c.tags !== false) {
    // 컷별 문턱 낮추기(섬광·혼잡 컷): c.tagThr = {w, l} → 견본 문턱과 비교해 낮은 쪽
    const g0 = spec.tagGrow;
    const list0 = g0 ? tagDefs.list.map((t) => ({ ...t, grow: g0 })) : tagDefs.list;
    const thrO = c.tagThr ?? spec.tagThr; // spec.tagThr: 전체 컷 문턱 낮추기(3차 — tagVerify로 오검출을 거르니 낮춰도 됨)
    const list = thrO ? tagDefs.list.map((t) => ({ ...t, thr: Math.min(t.thr, thrO.w ?? 1), thr_lum: Math.min(t.thr_lum, thrO.l ?? 1), grow: c.tagGrow ?? g0 ?? t.grow })) : list0;
    regions.push({ tags: list, hold: c.tagHold ?? spec.tagHold ?? 6 });
  }
  const audioArgs = info.audio ? ['-map', '1:a:0', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2'] : [];
  if (!info.audio && c.audioFrom) {
    // 무음 재료(rec/) 컷: 다른 녹화의 게임 소리를 같은 길이만큼 따로 뽑아 둔다 → 소리 잇기에서 이 컷 소리로 쓴다
    c._audioFile = path.join(work, `cut-${i}-audio.wav`);
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.audioFrom.start), '-t', String(c.dur), '-i', path.resolve(srcRoot, c.audioFrom.src),
      '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', ...(c.audioFrom.gain ? ['-af', `volume=${c.audioFrom.gain}dB`] : []), c._audioFile]);
  }
  const enc = ['-c:v', 'libx264', '-crf', '10', '-preset', 'fast', '-pix_fmt', 'yuv420p'];
  if (!regions.length) {
    run('ffmpeg', ['-v', 'error', '-y', ...seek, ...(info.audio ? ['-ss', String(c.start), '-t', String(c.dur), '-i', src] : []),
      '-map', '0:v:0', '-vf', vf, ...enc, ...audioArgs, out]);
  } else {
    const regPath = path.join(work, `cut-${i}-regions.json`);
    const boxPath = path.join(work, `cut-${i}-boxes.json`);
    fs.writeFileSync(regPath, JSON.stringify(regions));
    if (spec.blurPad != null) process.env.PROMO_BLUR_PAD = String(spec.blurPad);
    if (spec.blurStyle) process.env.PROMO_BLUR_STYLE = spec.blurStyle; // 'blank' = 빈 이름표로 덮기
    if (spec.tagVerify) process.env.PROMO_TAG_VERIFY = '1';
    const blurPy = path.join(HERE, 'nametag_blur.py');
    await pipeline([
      ['ffmpeg', ['-v', 'error', ...seek, '-an', '-vf', vf, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']],
      [PY, [blurPy, 'track', String(cw), String(ch), String(FPS), regPath, boxPath]],
    ]);
    await pipeline([
      ['ffmpeg', ['-v', 'error', ...seek, '-an', '-vf', vf, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']],
      [PY, [blurPy, 'apply', String(cw), String(ch), boxPath]],
      ['ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${cw}x${ch}`, '-r', String(FPS), '-i', '-',
        ...(info.audio ? ['-ss', String(c.start), '-t', String(c.dur), '-i', src] : []),
        '-map', '0:v:0', ...enc, ...audioArgs, '-shortest', out]],
    ]);
  }
  c._file = out;
  c._audio = info.audio;
  log(`컷 ${i + 1}/${cuts.length} ${c.src || 'play.mp4'} @${c.start}s ${c.dur}s crop ${cw}x${ch}+${x0}+${y0} 흐림 영역 ${regions.length}${regions.some((r) => r.tags) ? '(이름표 감지 포함)' : ''}`);
}

// ---------- 2) 글자 PNG ----------
const fontLog = [];
function overlay(name, items, bg) {
  const sp = path.join(work, `${name}.json`);
  const png = path.join(work, `${name}.png`);
  fs.writeFileSync(sp, JSON.stringify({ size: [W, H], bg, items }));
  const r = run(PY, [path.join(HERE, 'promo_overlay.py'), sp, png]);
  fontLog.push(...JSON.parse(r.stdout.trim() || '[]'));
  return png;
}
const S = spec.text || {};
const MIN = copy.style === 'minimal';
// 3차 글자: 작고 흰 한 줄 · 얇은 그림자(띠·외곽선·노랑 강조 없음)
function minimalText(text, pos) {
  const v = format === 'vertical';
  const size = S.minSize ?? (v ? 44 : 40);
  const it = { type: 'text', text, size, weight: S.minWeight ?? 'SemiBold', max_w: W - 2 * (S.minMargin ?? 64), color: [255, 255, 255, 240],
    shadow: { dx: 0, dy: 2, blur: 3, spread: 2, color: [0, 0, 0, 190] },
    pill: S.minPill === false ? undefined : { pad_x: 18, pad_y: 8, color: [0, 0, 0, S.minPillAlpha ?? 56], radius: 12 } };
  if (pos === 'top') return { ...it, cx: W / 2, cy: S.topY ?? (v ? 330 : 90) };
  return { ...it, align: 'left', x: S.minMargin ?? 72, cy: S.bottomLeftY ?? (v ? 1220 : 960) };
}
function baseOverlay() {
  if (MIN) return copy.tag ? overlay('base', [minimalText(copy.tag.text, copy.tag.pos)]) : null;
  if (format !== 'vertical' || !copy.hook) return null;
  const items = [];
  const top = videoTop;
  items.push({ type: 'rect', x: 0, y: 0, w: W, h: top, color: [0, 0, 0, S.hookAlpha ?? 150] });
  const [l1, l2] = copy.hook;
  const hs = S.hookSize ?? 84;
  const y1 = top * 0.47, y2 = top * 0.47 + hs * 1.32;
  items.push({ type: 'text', text: l1, cx: W / 2, cy: y1, size: hs, weight: 'ExtraBold', max_w: 1000, color: [255, 255, 255, 255], hl: copy.hookHl1 || [], stroke: 3, stroke_color: [0, 0, 0, 200] });
  if (l2) items.push({ type: 'text', text: l2, cx: W / 2, cy: y2, size: hs, weight: 'ExtraBold', max_w: 1000, color: copy.hookLine2Color || [255, 214, 0, 255], hl: copy.hookHl2 || [], stroke: 3, stroke_color: [0, 0, 0, 200] });
  if (copy.bottom) {
    const by = S.bottomY ?? 1600;
    items.push({ type: 'rect', x: 0, y: by, w: W, h: H - by, color: [0, 0, 0, S.bottomAlpha ?? 228], fade_top: 60 });
    items.push({ type: 'text', text: copy.bottom, cx: W / 2, cy: by + 118, size: S.bottomSize ?? 50, weight: 'Bold', max_w: 1000, color: [255, 255, 255, 255], hl: copy.bottomHl || [], hl_color: [255, 214, 0, 255] });
  }
  if (spec.baseItems?.length) items.push(...resolveItems(spec.baseItems)); // 최종본: 본편 내내 고정으로 얹는 판(검색 배지 줄 등) — 컷마다 같은 그림이라 디졸브에도 그대로
  return overlay('base', items);
}
function captionOverlay(text, k) {
  if (MIN) return overlay(`cap-${k}`, [minimalText(text, copy.perCutPos || 'bottom')]);
  const cy = format === 'vertical' ? (S.captionY ?? 1395) : 900;
  return overlay(`cap-${k}`, [{ type: 'text', text, cx: W / 2, cy, size: S.captionSize ?? (format === 'vertical' ? 76 : 64), weight: 'Black', max_w: W - 120,
    color: [255, 255, 255, 255], stroke: 5, stroke_color: [0, 0, 0, 255], hl: copy.captionHl || [], pill: { pad_x: 40, pad_y: 18, color: [0, 0, 0, 120], radius: 26 } }]);
}
const resolveItems = (items) => items.map((it) => (it.type === 'image' ? { ...it, path: path.resolve(ROOT, it.path) } : it));
function endOverlay() {
  if (spec.endCard) return overlay('end', resolveItems(spec.endCard.items), spec.endCard.bg || [0, 0, 0, 255]);
  const e = copy.end || { title: '메이플 리저렉션', sub: copy.bottom };
  const items = [];
  const v = format === 'vertical';
  if (MIN) {
    items.push({ type: 'text', text: e.title, cx: W / 2, cy: v ? 920 : 500, size: v ? 92 : 96, weight: 'Bold', max_w: W - 160, color: [255, 255, 255, 255] });
    if (e.sub) items.push({ type: 'text', text: e.sub, cx: W / 2, cy: v ? 1030 : 610, size: v ? 40 : 42, weight: 'Regular', max_w: W - 160, color: [255, 255, 255, 170] });
    return overlay('end', items, [0, 0, 0, 255]);
  }
  items.push({ type: 'text', text: e.title, cx: W / 2, cy: v ? 880 : 470, size: v ? 118 : 120, weight: 'Black', max_w: W - 120, color: e.titleColor || [255, 255, 255, 255] });
  if (e.sub) items.push({ type: 'text', text: e.sub, cx: W / 2, cy: v ? 1030 : 630, size: v ? 50 : 64, weight: e.subWeight || 'Bold', max_w: W - 140, color: e.subColor || [255, 214, 0, 255], hl: e.subHl || [] });
  return overlay('end', items, [0, 0, 0, 255]);
}

// ---------- 3) 소리 ----------
function buildAudio(mainLen, total) {
  const wav = path.join(work, 'audio.wav');
  const ins = [], fc = [];
  cuts.forEach((c, i) => {
    ins.push('-i', c._audioFile || c._file);
    fc.push(c._audio || c._audioFile ? `[${i}:a]atrim=0:${c.dur},asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=stereo[a${i}]`
      : `anullsrc=r=48000:cl=stereo,atrim=0:${c.dur}[a${i}]`);
  });
  let last = 'a0';
  for (let i = 1; i < cuts.length; i++) {
    const o = `ax${i}`;
    fc.push(T > 0 ? `[${last}][a${i}]acrossfade=d=${T}:c1=tri:c2=tri[${o}]` : `[${last}][a${i}]concat=n=2:v=0:a=1[${o}]`);
    last = o;
  }
  const rawWav = path.join(work, 'audio-raw.wav');
  const bed = spec.bed && !cuts.some((c) => c._audio) ? spec.bed : null;
  if (bed) {
    // 무음 재료: 다른 녹화의 게임 소리(배경음 위주 구간)를 바닥 소리로 — 화면과 효과음이 맞지 않으니 낮게
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(bed.start), '-t', mainLen.toFixed(3), '-i', path.resolve(srcRoot, bed.src),
      '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', rawWav]);
  } else {
    run('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', fc.join(';'), '-map', `[${last}]`, '-c:a', 'pcm_s16le', rawWav]);
  }
  const I = bed?.lufs ?? -16;
  // loudnorm 1단계: 측정
  const m = spawnSync('ffmpeg', ['-hide_banner', '-i', rawWav, '-af', `loudnorm=I=${I}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const js = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=${I}:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
  const fadeAt = Math.max(0, mainLen - 0.6);
  run('ffmpeg', ['-v', 'error', '-y', '-i', rawWav, '-af', `${ln},aresample=48000,afade=t=out:st=${fadeAt.toFixed(3)}:d=0.6,apad=whole_dur=${total.toFixed(3)}`, '-c:a', 'pcm_s16le', wav]);
  const post = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const pj = JSON.parse(post.stderr.slice(post.stderr.lastIndexOf('{'), post.stderr.lastIndexOf('}') + 1));
  log(`소리 원본 ${js.input_i} LUFS (최대 ${js.input_tp} dBTP) → 결과 ${pj.input_i} LUFS / ${pj.input_tp} dBTP`);
  return { wav, before: +js.input_i, after: +pj.input_i, tp: +pj.input_tp, bed };
}

// ---------- 4) 조립 ----------
async function main() {
  for (let i = 0; i < cuts.length; i++) await makeCut(cuts[i], i);
  const base = baseOverlay();
  const capTexts = [];
  if (spec.noCaptions) {
    cuts.forEach(() => capTexts.push(null));
  } else if (copy.perCut) {
    cuts.forEach((c) => capTexts.push(c.cap == null || c.cap < 0 ? null : copy.perCut[c.cap]));
  } else if (style === 'narrative' && copy.captions) {
    cuts.forEach((c, i) => {
      const k = c.cap ?? (cuts.length === copy.captions.length ? i : null);
      capTexts.push(k == null || k < 0 ? null : copy.captions[k]);
    });
  }
  const caps = capTexts.map((t, i) => (t ? captionOverlay(t, i) : null));
  const end = endDur > 0 ? endOverlay() : null;

  const ins = [], fc = [];
  let n = 0;
  const addIn = (...a) => { ins.push(...a); return n++; };
  const baseIdx = base ? addIn('-loop', '1', '-framerate', String(FPS), '-i', base) : -1;
  const clipLabels = [];
  if (baseIdx >= 0) fc.push(`[${baseIdx}:v]format=rgba,split=${cuts.length}${cuts.map((_, i) => `[bs${i}]`).join('')}`);
  cuts.forEach((c, i) => {
    const vi = addIn('-i', c._file);
    const L = `c${i}`;
    const tail = `,fps=${FPS},format=yuv420p,setsar=1,settb=AVTB`;
    if (format === 'vertical' && c.fit === 'width') {
      const gh = H - videoTop;
      const fh = even((W * c._crop.ch) / c._crop.cw);
      fc.push(`[${vi}:v]trim=0:${c.dur},setpts=PTS-STARTPTS,scale=${W}:${fh}:flags=lanczos,split[g${i}][gb${i}]`);
      fc.push(`[gb${i}]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,gblur=sigma=10,eq=brightness=${c.bgBrightness ?? -0.12}:saturation=0.75,scale=${W}:${H}:flags=bilinear[bg${i}]`);
      fc.push(`[bg${i}][g${i}]overlay=0:${c.box ? videoTop + (c.boxTop ?? 150) : Math.round(videoTop + (gh - fh) / 2)}[v${i}]`);
    } else if (format === 'vertical') {
      const gh = H - videoTop;
      fc.push(`[${vi}:v]trim=0:${c.dur},setpts=PTS-STARTPTS,scale=${W}:${gh}:flags=lanczos,split[g${i}][gb${i}]`);
      fc.push(`[gb${i}]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,gblur=sigma=10,eq=brightness=-0.12:saturation=0.75,scale=${W}:${H}:flags=bilinear[bg${i}]`);
      fc.push(`[bg${i}][g${i}]overlay=0:${videoTop}[v${i}]`);
    } else {
      fc.push(`[${vi}:v]trim=0:${c.dur},setpts=PTS-STARTPTS,scale=${W}:${H}:flags=lanczos[v${i}]`);
    }
    let cur = `v${i}`;
    if (baseIdx >= 0) {
      fc.push(`[bs${i}]trim=0:${c.dur},setpts=PTS-STARTPTS[b${i}]`);
      fc.push(`[${cur}][b${i}]overlay=0:0:shortest=1[vb${i}]`); cur = `vb${i}`;
    }
    if (caps[i]) {
      const ci = addIn('-loop', '1', '-framerate', String(FPS), '-i', caps[i]);
      fc.push(`[${ci}:v]trim=0:${c.dur},setpts=PTS-STARTPTS,format=rgba[k${i}]`);
      fc.push(`[${cur}][k${i}]overlay=0:0:shortest=1[vk${i}]`); cur = `vk${i}`;
    }
    fc.push(`[${cur}]null${tail}[${L}]`);
    clipLabels.push({ L, dur: c.dur });
  });
  if (end) {
    const ei = addIn('-loop', '1', '-framerate', String(FPS), '-t', String(endDur), '-i', end);
    fc.push(`[${ei}:v]trim=0:${endDur},setpts=PTS-STARTPTS,fps=${FPS},format=yuv420p,setsar=1,settb=AVTB[cend]`);
    clipLabels.push({ L: 'cend', dur: endDur });
  }
  let outLabel;
  let total;
  if (style === 'loop') {
    const xf = spec.loop?.crossfade ?? 1;
    const Lr = cuts[0].dur - xf;
    fc.push(`[c0]split[lm][lh]`);
    fc.push(`[lm]trim=${xf}:${cuts[0].dur},setpts=PTS-STARTPTS[lmain]`);
    fc.push(`[lh]trim=0:${xf},setpts=PTS-STARTPTS[lhead]`);
    fc.push(`[lmain][lhead]xfade=transition=fade:duration=${xf}:offset=${(Lr - xf).toFixed(3)}[vout]`);
    outLabel = 'vout'; total = Lr;
  } else if (T > 0) {
    let acc = clipLabels[0].dur, last = clipLabels[0].L;
    for (let k = 1; k < clipLabels.length; k++) {
      const o = k === clipLabels.length - 1 ? 'vout' : `x${k}`;
      const d = clipLabels[k].L === 'cend' ? TE : T;
      fc.push(`[${last}][${clipLabels[k].L}]xfade=transition=fade:duration=${d}:offset=${(acc - d).toFixed(3)}[${o}]`);
      acc += clipLabels[k].dur - d; last = o;
    }
    if (clipLabels.length === 1) fc.push(`[${last}]null[vout]`);
    outLabel = 'vout'; total = acc;
  } else {
    fc.push(`${clipLabels.map((c) => `[${c.L}]`).join('')}concat=n=${clipLabels.length}:v=1:a=0[vout]`);
    outLabel = 'vout'; total = clipLabels.reduce((s, c) => s + c.dur, 0);
  }
  if (spec.timeline?.length) {
    // 영상 전체 시각 기준 글자 판: 투명 PNG를 반복 입력으로 넣고 알파 페이드로 켜고 끈다
    const endStart = total - endDur;
    let cur = outLabel;
    spec.timeline.forEach((tl, k) => {
      let a, b;
      if (tl.atCut != null) {
        // 컷 k가 시작하는 시각부터 dur초 (장이 바뀔 때마다 잠깐 켜는 글자)
        a = cuts.slice(0, tl.atCut).reduce((s, c) => s + c.dur - T, 0) + (tl.from ?? 0);
        b = a + tl.dur;
      } else {
        a = tl.from < 0 ? endStart + tl.from : tl.from;
        b = tl.to == null ? endStart : tl.to <= 0 ? endStart + tl.to : tl.to;
      }
      const fi = tl.fadeIn ?? tl.fade ?? 0.3, fo = tl.fadeOut ?? tl.fade ?? 0.3; // 등장·소멸 길이를 따로 줄 수 있음(전환 띠 100/140ms)
      const png = overlay(`tl-${tl.name || k}`, resolveItems(tl.items)); // 같은 그림을 여러 번 써도 이름이 같으면 한 번만 그려짐 · image 항목 가능
      const ti = addIn('-loop', '1', '-framerate', String(FPS), '-t', total.toFixed(3), '-i', png);
      fc.push(`[${ti}:v]format=rgba,fade=t=in:st=${a.toFixed(3)}:d=${fi}:alpha=1,fade=t=out:st=${(b - fo).toFixed(3)}:d=${fo}:alpha=1[tlk${k}]`);
      fc.push(`[${cur}][tlk${k}]overlay=0:0:eof_action=pass[tlo${k}]`);
      cur = `tlo${k}`;
      tl._at = [+a.toFixed(2), +b.toFixed(2)];
    });
    outLabel = cur;
  }
  const mainLen = total - endDur + (end ? TE : 0);
  let audio = null;
  if (audioMode === 'game') audio = buildAudio(mainLen, total);
  const args = ['-v', 'error', '-y', ...ins];
  if (audio) args.push('-i', audio.wav);
  args.push('-filter_complex', fc.join(';\n'), '-map', `[${outLabel}]`);
  if (audio) args.push('-map', `${n}:a`, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
  else args.push('-an');
  args.push('-t', total.toFixed(3), '-r', String(FPS), '-c:v', 'libx264', '-crf', String(spec.crf ?? 18), '-preset', 'slow', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath);
  fs.writeFileSync(path.join(work, 'filter.txt'), fc.join(';\n'));
  run('ffmpeg', args);
  const dur = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outPath]).stdout.trim();
  log(`완성 ${path.relative(ROOT, outPath)} ${W}x${H} ${(+dur).toFixed(2)}초 (계획 ${total.toFixed(2)}초)`);
  if (contactPath) {
    fs.mkdirSync(path.dirname(contactPath), { recursive: true });
    run(PY, [path.join(HERE, 'contact.py'), '--video', outPath, '--out', contactPath, '--n', '16', '--cols', '8', '--cell-w', format === 'vertical' ? '240' : '320']);
    log(`접촉판 ${path.relative(ROOT, contactPath)}`);
  }
  const summary = {
    id, style, format, out: path.relative(ROOT, outPath), duration: +(+dur).toFixed(2), copySet: copySetName || null,
    cuts: cuts.map((c) => ({ src: c.src || 'play.mp4', start: c.start, dur: c.dur, crop: c._crop, caption: capTexts[cuts.indexOf(c)] || null, blur: (c.blur || []).length })),
    audio: audio ? { mode: audio.bed ? `bed ${audio.bed.src}@${audio.bed.start}s` : 'game', beforeLUFS: audio.before, afterLUFS: audio.after, truePeak: audio.tp } : { mode: 'none' },
    fonts: [...new Set(fontLog.map((f) => f.font))],
    textSizes: fontLog.map((f) => ({ text: f.text, size: f.size })),
    timeline: (spec.timeline || []).map((tl) => ({ name: tl.name, at: tl._at })),
  };
  fs.writeFileSync(path.join(work, 'summary.json'), JSON.stringify(summary, null, 2));
  if (!opt.keep) for (const c of cuts) fs.rmSync(c._file, { force: true });
}
main().catch((e) => { console.error(e.message); process.exit(1); });
