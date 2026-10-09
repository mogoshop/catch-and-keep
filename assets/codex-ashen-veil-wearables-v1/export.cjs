// 이미지 생성 결과의 분할·크기 내보내기·검사용 GIF 조립만 수행한다.
// 실제 avataritem의 자세별 PSD 레이어로 변환하는 도구는 아니다.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const deps = process.env.ASHEN_ART_NODE_MODULES || '/tmp/codex-avatar-tools/node_modules';
const sharp = require(path.join(deps, 'sharp'));
const root = __dirname;
const actions = ['idle', 'walk', 'attack', 'cast'];
const sources = {
  robe: 'robe-motion.png', gloves: 'gloves-motion-v2.png', boots: 'boots-motion.png',
  scythe: 'scythe-motion.png', lantern: 'lantern-motion-v2.png'
};
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
async function main() {
  for (const d of ['frames', 'sheets', 'previews']) fs.mkdirSync(path.join(root, d), { recursive: true });
  const checks = [], packs = [];
  for (const [part, source] of Object.entries(sources)) {
    const input = path.join(root, 'sources', source);
    const meta = await sharp(input).metadata();
    if (!meta.hasAlpha) throw new Error(part + ': alpha channel missing');
    // 생성 시트의 일부 그림이 명목 셀 경계를 조금 넘는다. 연결된 그림 조각을
    // 전역에서 찾고 무게중심이 속한 셀에 배정하여 칼날·소매를 자르지 않는다.
    const full = await sharp(input).ensureAlpha().raw().toBuffer();
    const seen = new Uint8Array(meta.width * meta.height);
    const grouped = Array.from({ length: 16 }, () => []);
    const queue = new Int32Array(seen.length);
    for (let start = 0; start < seen.length; start++) {
      if (seen[start] || full[start * 4 + 3] <= 32) continue;
      let n = 1, head = 0, sx = 0, sy = 0;
      queue[0] = start; seen[start] = 1;
      while (head < n) {
        const at = queue[head++], x = at % meta.width, y = Math.floor(at / meta.width);
        sx += x; sy += y;
        const neighbors = [];
        if (x > 0) neighbors.push(at - 1);
        if (x + 1 < meta.width) neighbors.push(at + 1);
        if (y > 0) neighbors.push(at - meta.width);
        if (y + 1 < meta.height) neighbors.push(at + meta.width);
        for (const next of neighbors) if (!seen[next] && full[next * 4 + 3] > 32) {
          seen[next] = 1; queue[n++] = next;
        }
      }
      const col = Math.min(3, Math.floor((sx / n) * 4 / meta.width));
      const row = Math.min(3, Math.floor((sy / n) * 4 / meta.height));
      grouped[row * 4 + col].push(...queue.subarray(0, n));
    }
    const clips = [];
    const sheetLayers = [];
    for (let row = 0; row < 4; row++) {
      const rawFrames = [], hashes = [];
      for (let col = 0; col < 4; col++) {
        const left = Math.floor(col * meta.width / 4), top = Math.floor(row * meta.height / 4);
        const width = Math.floor((col + 1) * meta.width / 4) - left;
        const height = Math.floor((row + 1) * meta.height / 4) - top;
        // 모든 셀에 공통 여백 64px. 개별 객체 trim/center로 동작 위치를 없애지 않는다.
        const pad = 64, paddedW = width + pad * 2, paddedH = height + pad * 2;
        const canvas = Buffer.alloc(paddedW * paddedH * 4);
        for (const at of grouped[row * 4 + col]) {
          const x = at % meta.width - left + pad, y = Math.floor(at / meta.width) - top + pad;
          if (x < 0 || x >= paddedW || y < 0 || y >= paddedH) throw new Error(part + ': source needs larger gutter');
          full.copy(canvas, (y * paddedW + x) * 4, at * 4, at * 4 + 4);
        }
        const frame = await sharp(canvas, { raw: { width: paddedW, height: paddedH, channels: 4 } })
          .resize(256, 256, { kernel: 'nearest', fit: 'fill' }).png().toBuffer();
        const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let count = 0, minX = 256, minY = 256, maxX = -1, maxY = -1;
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
          if (data[(y * 256 + x) * info.channels + 3] > 32) {
            count++; minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
        }
        if (!count || count === 65536) throw new Error(part + ': empty or opaque frame');
        const file = `frames/${part}-${actions[row]}-${col + 1}.png`;
        fs.writeFileSync(path.join(root, file), frame);
        hashes.push(digest(frame)); rawFrames.push(data);
        sheetLayers.push({ input: frame, left: col * 256, top: row * 256 });
        checks.push({ file, width: 256, height: 256, visiblePixels: count,
          bounds: [minX, minY, maxX, maxY], touchesCellEdge: minX === 0 || minY === 0 || maxX === 255 || maxY === 255,
          sha256: digest(frame) });
      }
      const preview = `previews/${part}-${actions[row]}.gif`;
      await sharp(Buffer.concat(rawFrames), { raw: { width: 256, height: 1024, channels: 4, pageHeight: 256 } })
        .gif({ delay: [180, 180, 180, 180], loop: 0, effort: 7 }).toFile(path.join(root, preview));
      const gm = await sharp(path.join(root, preview), { animated: true }).metadata();
      if (gm.pages !== 4 || gm.pageHeight !== 256) throw new Error(preview + ': animation export failed');
      clips.push({ action: actions[row], frameCount: 4, distinctFrameCount: new Set(hashes).size, preview });
    }
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } })
      .composite(sheetLayers).png().toFile(path.join(root, 'sheets', part + '-4x4.png'));
    packs.push({ part, source: 'sources/' + source, frames: 16, clips, nativeReady: false, uploaded: false });
  }
  const result = { generatedAt: new Date().toISOString(), parts: packs,
    motionFrameCount: checks.length, hoodDirectionFrameCount: 2,
    allFramesHaveTransparentPixels: true, edgeWarnings: checks.filter(c => c.touchesCellEdge), checks };
  fs.writeFileSync(path.join(root, 'checks.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ frames: checks.length, gifClips: packs.length * 4, edgeWarnings: result.edgeWarnings.map(x => x.file) }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
