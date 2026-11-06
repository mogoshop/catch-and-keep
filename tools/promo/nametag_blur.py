#!/usr/bin/env python3
"""흐림 영역 처리 — 고정 상자 · 키프레임 상자 · 추적 상자(이름표처럼 움직이는 글자).

두 단계로 쓴다 (build_ad.mjs가 부른다):
  1) track : ffmpeg rgb24 rawvideo 입력(안에서 흰 정도 채널로 바꿈) → 프레임마다 상자 목록 JSON
     ffmpeg ... -pix_fmt rgb24 -f rawvideo - | python3 nametag_blur.py track W H FPS regions.json boxes.json
  2) apply : ffmpeg rgb24 rawvideo 입력 → 상자 자리를 강하게 흐린 rgb24 출력
     ffmpeg ... -pix_fmt rgb24 -f rawvideo - | python3 nametag_blur.py apply W H boxes.json | ffmpeg -f rawvideo ...
  probe  : 한 장에 좌표 격자를 그려 상자 시작 자리를 고르는 용도
     python3 nametag_blur.py probe in.png out.png X0 Y0 [scale]

regions.json (자른 화면 기준 좌표 · 컷 안 시각 초):
  {"x":..,"y":..,"w":..,"h":..,"t0":0,"t1":3}                  고정
  {"keys":[[t,x,y],...],"w":..,"h":..}                          키프레임 사이 직선 이동
  {"track":true,"t":0.5,"x":..,"y":..,"w":..,"h":..,"r":18}      t 시각 상자에서 앞뒤로 추적
                                                               (t0/t1로 범위 제한, 기본 컷 전체)
자동 감지(어두운 상자+글씨)는 바닥 타일 경계에 너무 많이 걸려서 버렸다 (11-07 시험).
"""
import json, sys
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

import os
PAD = int(os.environ.get('PROMO_BLUR_PAD', '4'))
# 3차(v3): 'blank' = 모자이크 대신 이름표 상자를 상자 바탕색으로 덮어 「글자 없는 이름표」처럼 (혼전 컷의 회색 조각이 지저분하다는 지적)
STYLE = os.environ.get('PROMO_BLUR_STYLE', 'mosaic')
# 3차(v3): 견본 일치 뒤 「어두운 상자 + 흰 글씨」인지 한 번 더 확인 — 데미지 숫자·흰 펫·섬광 오검출 제거
VERIFY = os.environ.get('PROMO_TAG_VERIFY', '0') == '1'

def looks_like_tag(wch, lum, x, y, w, h):
    H, W = wch.shape
    if x < 0 or y < 0 or x + w > W or y + h > H:
        return False
    a = wch[y:y + h, x:x + w]; l = lum[y:y + h, x:x + w]
    white = (a > 185).mean(); dark = (l < 115).mean()
    return 0.05 <= white <= 0.4 and dark >= 0.35

def read_frames(w, h, ch):
    size = w * h * ch
    inp = sys.stdin.buffer
    while True:
        buf = inp.read(size)
        if len(buf) < size:
            return
        yield np.frombuffer(buf, np.uint8).reshape((h, w) if ch == 1 else (h, w, ch))

def track_one(frames, reg, fps):
    n = len(frames)
    H, W = frames[0].shape
    w, h = int(reg['w']), int(reg['h'])
    r = int(reg.get('r', 18))
    a = min(n - 1, max(0, round(reg.get('t', 0) * fps)))
    i0 = max(0, round(reg.get('t0', 0) * fps))
    i1 = min(n - 1, round(reg['t1'] * fps) if 't1' in reg else n - 1)
    pos = {}
    x0 = int(np.clip(reg['x'], 0, W - w)); y0 = int(np.clip(reg['y'], 0, H - h))
    pos[a] = (x0, y0)
    base = frames[a][y0:y0 + h, x0:x0 + w].astype(np.float32)
    for step, rng in ((1, range(a + 1, i1 + 1)), (-1, range(a - 1, i0 - 1, -1))):
        tpl = base.copy(); x, y = x0, y0
        for i in rng:
            f = frames[i]
            sx0, sy0 = max(0, x - r), max(0, y - r)
            sx1, sy1 = min(W, x + w + r), min(H, y + h + r)
            area = f[sy0:sy1, sx0:sx1].astype(np.float32)
            if area.shape[0] < h or area.shape[1] < w:
                pos[i] = (x, y); continue
            win = sliding_window_view(area, (h, w))
            ssd = ((win - tpl) ** 2).mean(axis=(2, 3))
            gy, gx = np.mgrid[0:ssd.shape[0], 0:ssd.shape[1]]
            dist = (gx + sx0 - x) ** 2 + (gy + sy0 - y) ** 2
            score = ssd + 0.6 * dist
            by, bx = np.unravel_index(np.argmin(score), score.shape)
            x, y = int(bx + sx0), int(by + sy0)
            pos[i] = (x, y)
            tpl = 0.85 * tpl + 0.15 * f[y:y + h, x:x + w].astype(np.float32)
    return pos

def fast_len(n):
    """2·3·5 곱으로만 된 n 이상 가장 작은 수 (FFT 빠른 크기)."""
    while True:
        m = n
        for p in (2, 3, 5):
            while m % p == 0: m //= p
        if m == 1: return n
        n += 1

class NCC:
    """한 프레임 FFT·적분영상을 여러 견본에 같이 쓴다."""
    def __init__(self, F, hmax, wmax):
        self.F = F
        H, W = F.shape
        self.fs = (fast_len(H + hmax), fast_len(W + wmax))
        self.FF = np.fft.rfft2(F, self.fs)
        Fd = F.astype(np.float64)
        self.c1 = np.pad(Fd, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
        self.c2 = np.pad(Fd * Fd, ((1, 0), (1, 0))).cumsum(0).cumsum(1)

    def map(self, T, TT=None):
        H, W = self.F.shape; h, w = T.shape
        N = h * w
        Tz = T - T.mean()
        tn = np.sqrt((Tz ** 2).sum()) + 1e-6
        if TT is None: TT = np.conj(np.fft.rfft2(Tz, self.fs))
        corr = np.fft.irfft2(self.FF * TT, self.fs)[:H - h + 1, :W - w + 1]
        c1, c2 = self.c1, self.c2
        s1 = c1[h:, w:] - c1[:-h, w:] - c1[h:, :-w] + c1[:-h, :-w]
        s2 = c2[h:, w:] - c2[:-h, w:] - c2[h:, :-w] + c2[:-h, :-w]
        var = s2 - s1 * s1 / N
        flat = var < N * 100  # 화면 쪽 표준편차 10 미만(하얗게 날아간 곳·단색)은 글씨가 있을 수 없음
        r = corr / (np.sqrt(np.maximum(var, N * 100)) * tn)
        r[flat] = 0
        return r

def ncc_map(F, T):
    return NCC(F, *T.shape).map(T)

def detect_tags(frames, tags, lums=None):
    """이름표 견본(같은 글자는 같은 그림)과 정규화 상호상관으로 모든 프레임에서 찾기."""
    from PIL import Image
    tpls = []
    for t in tags:
        T = np.array(Image.open(t['png']).convert('RGB')).min(axis=2).astype(np.float32)
        tpls.append((T, t.get('thr', 0.62), t.get('grow', [3, 3, 3, 3])))
    ltpls = []
    for t in tags:
        rgb = np.array(Image.open(t['png']).convert('RGB')).astype(np.float32)
        ltpls.append((rgb[:, :, 0] * 0.3 + rgb[:, :, 1] * 0.6 + rgb[:, :, 2] * 0.1, t.get('thr_lum', 0.68), t.get('grow', [3, 3, 3, 3])))
    hits = []
    hmax = max(T.shape[0] for T, _, _ in tpls); wmax = max(T.shape[1] for T, _, _ in tpls)
    cache = {}
    for fi, f in enumerate(frames):
        out = []
        chans = [('w', f, tpls)] + ([('l', lums[fi], ltpls)] if lums is not None else [])
        for cname, img, tl in chans:
            F = img.astype(np.float32)
            nc = NCC(F, hmax, wmax)
            if cname not in cache:
                cache[cname] = [np.conj(np.fft.rfft2(T - T.mean(), nc.fs)) for T, _, _ in tl]
            for k, (T, thr, (gl, gt, gr, gb)) in enumerate(tl):
                h, w = T.shape
                if F.shape[0] < h or F.shape[1] < w:
                    continue
                m = nc.map(T, cache[cname][k])
                ys, xs = np.nonzero(m >= thr)
                order = np.argsort(-m[ys, xs])
                taken = []
                for j in order[:200]:
                    y, x = int(ys[j]), int(xs[j])
                    if any(abs(y - ty) < h // 2 and abs(x - tx) < w // 2 for ty, tx in taken):
                        continue
                    taken.append((y, x))
                    if VERIFY and lums is not None and not looks_like_tag(f, lums[fi], x, y, w, h):
                        continue
                    out.append([x - gl, y - gt, w + gl + gr, h + gt + gb])
        hits.append(out)
    return hits

def lerp_keys(keys, t):
    if t <= keys[0][0]:
        return keys[0][1], keys[0][2]
    for (ta, xa, ya), (tb, xb, yb) in zip(keys, keys[1:]):
        if ta <= t <= tb:
            u = 0 if tb == ta else (t - ta) / (tb - ta)
            return xa + (xb - xa) * u, ya + (yb - ya) * u
    return keys[-1][1], keys[-1][2]

def cmd_track(w, h, fps, regions_path, out_path):
    regions = json.load(open(regions_path))
    # 흰 정도(RGB 중 최솟값) 한 채널로 보관 — 이름표 글씨는 흰색/회색, 모래·효과는 한 채널이 낮다 (11-07 실험: 회색 밝기보다 오검출이 훨씬 적음)
    frames, lums = [], []
    for f in read_frames(w, h, 3):
        frames.append(f.min(axis=2))
        # 밝기 채널도 따로 — 피격 섬광으로 이름표가 주황·빨강으로 물들면 흰 정도 채널에서 놓친다 (11-07 v1 6.6초)
        lums.append(((f[:, :, 0].astype(np.uint16) * 77 + f[:, :, 1].astype(np.uint16) * 154 + f[:, :, 2].astype(np.uint16) * 25) >> 8).astype(np.uint8))
    n = len(frames)
    boxes = [[] for _ in range(n)]
    for reg in regions:
        if 'tags' in reg:
            hits = detect_tags(frames, reg['tags'], lums)
            K = int(reg.get('hold', 4))  # 앞뒤 K프레임 동안 같은 자리 유지 (가려져서 놓친 프레임 메우기)
            cnt = 0
            for i in range(n):
                seen = []
                for j in range(max(0, i - K), min(n, i + K + 1)):
                    for b in hits[j]:
                        if not any(abs(b[0] - s[0]) < 6 and abs(b[1] - s[1]) < 6 for s in seen):
                            seen.append(b)
                boxes[i].extend(seen); cnt += len(hits[i])
            print(f'[track] tag hits total={cnt} avg/frame={cnt / max(1, n):.1f}', file=sys.stderr)
        elif reg.get('track'):
            for i, (x, y) in track_one(frames, reg, fps).items():
                boxes[i].append([x, y, reg['w'], reg['h']])
        elif 'keys' in reg:
            keys = sorted(reg['keys'])
            t0 = reg.get('t0', keys[0][0]); t1 = reg.get('t1', keys[-1][0])
            for i in range(n):
                t = i / fps
                if t0 - 1e-6 <= t <= t1 + 1e-6:
                    x, y = lerp_keys(keys, t)
                    boxes[i].append([round(x), round(y), reg['w'], reg['h']])
        else:
            t0 = reg.get('t0', 0); t1 = reg.get('t1', 1e9)
            for i in range(n):
                if t0 - 1e-6 <= i / fps <= t1 + 1e-6:
                    boxes[i].append([reg['x'], reg['y'], reg['w'], reg['h']])
    json.dump({'w': w, 'h': h, 'fps': fps, 'boxes': boxes}, open(out_path, 'w'))
    print(f'[track] frames={n} regions={len(regions)}', file=sys.stderr)

def blur_patch(p):
    """작게 줄였다 늘리는 모자이크 + 상자 흐림 — 글씨 형태가 남지 않게."""
    h, w = p.shape[:2]
    k = 6
    sh, sw = max(1, h // k), max(1, w // k)
    small = p[:sh * k, :sw * k].reshape(sh, k, sw, k, 3).mean(axis=(1, 3)) if sh * k <= h and sw * k <= w else p.mean(axis=(0, 1), keepdims=True)
    big = np.repeat(np.repeat(small, k, 0), k, 1)
    out = np.empty_like(p, dtype=np.float32)
    out[:] = p.mean(axis=(0, 1))
    out[:big.shape[0], :big.shape[1]] = big
    # 가장자리 부드럽게: 3번 상자 평균
    for _ in range(6):
        q = np.pad(out, ((1, 1), (1, 1), (0, 0)), mode='edge')
        out = (q[:-2, :-2] + q[:-2, 1:-1] + q[:-2, 2:] + q[1:-1, :-2] + q[1:-1, 1:-1] + q[1:-1, 2:] + q[2:, :-2] + q[2:, 1:-1] + q[2:, 2:]) / 9
    return out.astype(np.uint8)

def blank_patch(p):
    """이름표 바탕색(상자 안 어두운 쪽 절반의 중앙값)으로 채운다 → 글자만 지운 빈 이름표처럼 보인다."""
    q = p.reshape(-1, 3).astype(np.float32)
    lum = q[:, 0] * 0.3 + q[:, 1] * 0.59 + q[:, 2] * 0.11
    dark = q[lum <= np.percentile(lum, 50)]
    out = np.empty_like(p, dtype=np.float32)
    out[:] = np.median(dark, axis=0)
    # 가장자리 한 줄은 원본과 반반 섞어 경계를 덜 딱딱하게
    out[0, :] = (out[0, :] + p[0, :]) / 2; out[-1, :] = (out[-1, :] + p[-1, :]) / 2
    out[:, 0] = (out[:, 0] + p[:, 0]) / 2; out[:, -1] = (out[:, -1] + p[:, -1]) / 2
    return out.astype(np.uint8)

def soft_patch(p):
    """상자 안만 부드럽게 흐림(반경 작게) — 이름표 상자 모양·색은 남고 글자만 읽히지 않게."""
    out = p.astype(np.float32)
    for _ in range(4):
        q = np.pad(out, ((2, 2), (2, 2), (0, 0)), mode='reflect')
        out = sum(q[dy:dy + out.shape[0], 2:2 + out.shape[1]] for dy in range(5)) / 5
        q = np.pad(out, ((0, 0), (2, 2), (0, 0)), mode='reflect')
        out = sum(q[:, dx:dx + out.shape[1]] for dx in range(5)) / 5
    return out.astype(np.uint8)

def cmd_apply(w, h, boxes_path):
    data = json.load(open(boxes_path))
    boxes = data['boxes']
    outp = sys.stdout.buffer
    for i, f in enumerate(read_frames(w, h, 3)):
        img = f.copy()
        for (x, y, bw, bh) in (boxes[i] if i < len(boxes) else (boxes[-1] if boxes else [])):
            x0, y0 = max(0, int(x) - PAD), max(0, int(y) - PAD)
            x1, y1 = min(w, int(x + bw) + PAD), min(h, int(y + bh) + PAD)
            if x1 - x0 > 2 and y1 - y0 > 2:
                img[y0:y1, x0:x1] = ({'blank': blank_patch, 'soft': soft_patch}.get(STYLE, blur_patch))(img[y0:y1, x0:x1])
        outp.write(img.tobytes())
    outp.flush()

def cmd_probe(src, out, X0, Y0, scale=1.5):
    from PIL import Image, ImageDraw, ImageFont
    im = Image.open(src).convert('RGB')
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
    d = ImageDraw.Draw(im)
    try:
        f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 13)
    except Exception:
        f = ImageFont.load_default()
    for gx in range(0, int(im.width / scale), 25):
        X = int(gx * scale); c = (255, 0, 0) if gx % 100 == 0 else (255, 255, 0) if gx % 50 == 0 else (90, 90, 90)
        if gx % 50 == 0 or True:
            d.line([(X, 0), (X, im.height)], fill=c, width=1)
        if gx % 50 == 0:
            d.text((X + 2, 2), str(gx + X0), fill=c, font=f)
    for gy in range(0, int(im.height / scale), 25):
        Y = int(gy * scale); c = (255, 0, 0) if gy % 100 == 0 else (255, 255, 0) if gy % 50 == 0 else (90, 90, 90)
        d.line([(0, Y), (im.width, Y)], fill=c, width=1)
        if gy % 50 == 0:
            d.text((2, Y + 2), str(gy + Y0), fill=c, font=f)
    im.save(out)

def main():
    a = sys.argv[1:]
    if a[0] == 'track':
        cmd_track(int(a[1]), int(a[2]), float(a[3]), a[4], a[5])
    elif a[0] == 'apply':
        cmd_apply(int(a[1]), int(a[2]), a[3])
    elif a[0] == 'probe':
        cmd_probe(a[1], a[2], int(a[3]), int(a[4]), float(a[5]) if len(a) > 5 else 1.5)

if __name__ == '__main__':
    main()
