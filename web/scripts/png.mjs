// 의존성 없는 PNG 해독(비월선 · 비트 깊이 1/2/4/8/16 · 색 형식 0/2/3/4/6) → {w, h, data: RGBA Uint8Array}.
// 추천 점수(색·크기·모양)를 재려고 쓴다. 월선(interlace) PNG는 지원하지 않고 오류를 낸다.
import {inflateSync} from 'node:zlib';

const SIG = '89504e470d0a1a0a';
export function decodePNG(buf) {
  if (buf.length < 8 || buf.subarray(0, 8).toString('hex') !== SIG) throw new Error('PNG 아님');
  let p = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, palette = null, trns = null; const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p), kind = buf.toString('ascii', p + 4, p + 8), body = buf.subarray(p + 8, p + 8 + len);
    if (kind === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === 'PLTE') palette = body;
    else if (kind === 'tRNS') trns = body;
    else if (kind === 'IDAT') idat.push(body);
    else if (kind === 'IEND') break;
    p += 12 + len;
  }
  if (!w || !h) throw new Error('IHDR 없음');
  if (interlace) throw new Error('월선 PNG 미지원');
  const channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[type];
  if (!channels) throw new Error(`색 형식 ${type} 미지원`);
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = Math.max(1, (channels * depth) >> 3), stride = (w * channels * depth + 7) >> 3;
  const lines = Buffer.alloc(stride * h); let prev = Buffer.alloc(stride);
  for (let y = 0, q = 0; y < h; y++) {
    const f = raw[q++], line = lines.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = raw[q++];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      line[x] = v & 255;
    }
    prev = line;
  }
  const out = new Uint8Array(w * h * 4);
  const sample = (line, i) => { // i번째 채널 값(0~255로 맞춤)
    if (depth === 8) return line[i];
    if (depth === 16) return line[i * 2];
    const per = 8 / depth, byte = line[(i / per) | 0], shift = 8 - depth * ((i % per) + 1); const v = (byte >> shift) & ((1 << depth) - 1);
    return type === 3 ? v : Math.round(v * 255 / ((1 << depth) - 1));
  };
  for (let y = 0; y < h; y++) {
    const line = lines.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, i = x * channels;
      if (type === 6) { out[o] = sample(line, i); out[o + 1] = sample(line, i + 1); out[o + 2] = sample(line, i + 2); out[o + 3] = sample(line, i + 3); }
      else if (type === 2) { out[o] = sample(line, i); out[o + 1] = sample(line, i + 1); out[o + 2] = sample(line, i + 2); out[o + 3] = 255;
        if (trns && trns.length >= 6 && out[o] === trns[1] && out[o + 1] === trns[3] && out[o + 2] === trns[5]) out[o + 3] = 0; }
      else if (type === 3) { const k = sample(line, i); out[o] = palette[k * 3]; out[o + 1] = palette[k * 3 + 1]; out[o + 2] = palette[k * 3 + 2]; out[o + 3] = trns && k < trns.length ? trns[k] : 255; }
      else if (type === 0) { const g = sample(line, i); out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255; }
      else { const g = sample(line, i); out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = sample(line, i + 1); }
    }
  }
  return {w, h, data: out};
}
