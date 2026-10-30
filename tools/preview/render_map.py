#!/usr/bin/env python3
"""맵 미리보기 2단계 (메이커 없이 · 10-31 실플레이 피드백 C) — export_map.cjs JSON을 그림으로.
사용: python3 tools/preview/render_map.py --assets <assets 폴더> --out 파일.png [--ppu 20] [--crop x0 y0 x1 y1] [--overlay] 앞.json [뒤.json]
  · JSON이 둘이면 나란히(앞 | 뒤). --overlay: 장식이 막은 충돌 칸(빨강)·설계도 밖 충돌·기능 자리(노랑 점)를 덧그린다
  · 엔진 규칙 근사: 반복 그리기(DrawMode 2)는 첫 장을 왼쪽·아래에 두고 TiledSize만큼 깐다(뒤집으면 첫 장 가운데가 축).
    피벗은 팩의 resource-properties*.csv, 없으면 장식 0.5/0 · 메이플 0.5/ny · 바닥·벽·띠 0.5/0.5. z가 작을수록 앞
  · 그림 원본은 assets/(커밋 제외)에서 이름으로 찾는다 — 없으면 회색 상자
"""
import argparse, csv, json, os, glob
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--assets', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--ppu', type=float, default=20)
ap.add_argument('--crop', nargs=4, type=float)
ap.add_argument('--overlay', action='store_true')
ap.add_argument('--labels', nargs='*')
ap.add_argument('jsons', nargs='+')
a = ap.parse_args()

# 이름 → png (같은 이름이 여러 곳이면 /png/ 아래 우선)
index = {}
for root, _, files in os.walk(a.assets):
    for fn in files:
        if fn.endswith('.png'):
            index.setdefault(fn[:-4], []).append(os.path.join(root, fn))
pivots = {}
for f in glob.glob(os.path.join(a.assets, '**', 'resource-properties*.csv'), recursive=True):
    try:
        for r in csv.DictReader(open(f, encoding='utf-8-sig')):
            n = r.get('name') or r.get('key')
            if n and r.get('pivot_x') not in (None, '') and r.get('pivot_y') not in (None, ''):
                pivots[n] = (float(r['pivot_x']), float(r['pivot_y']))
    except Exception:
        pass
# RUID → 파일 (팩의 *mapping*.csv: RUID·file 열 — 9조각 묶음처럼 이름과 파일 이름이 다른 그림)
by_ruid = {}
for f in glob.glob(os.path.join(a.assets, '**', '*mapping*.csv'), recursive=True):
    try:
        for r in csv.DictReader(open(f, encoding='utf-8-sig')):
            rid = (r.get('RUID') or r.get('ruid') or '').strip()
            fn = (r.get('file') or r.get('path') or '').strip()
            if rid and fn:
                full = os.path.join(os.path.dirname(f), fn)
                if os.path.exists(full):
                    by_ruid.setdefault(rid, full)
    except Exception:
        pass
tex = {}
def texture(p):
    n = p['name']
    if n not in tex:
        cands = index.get(n, []) + ([by_ruid[p['ruid']]] if p.get('ruid') in by_ruid else [])
        best = None
        for c in cands:
            try:
                im = Image.open(c)
            except Exception:
                continue
            score = (0 if im.size == (p['w'], p['h']) else 1, 0 if '/png/' in c else 1)
            if best is None or score < best[0]:
                best = (score, c)
        tex[n] = Image.open(best[1]).convert('RGBA') if best else None
    return tex[n]

def tinted(im, c):
    if not c:
        return im
    r, g, b, al = im.split()
    r = r.point(lambda v: min(255, v * c.get('r', 1))); g = g.point(lambda v: min(255, v * c.get('g', 1))); b = b.point(lambda v: min(255, v * c.get('b', 1)))
    if c.get('a', 1) < 1:
        al = al.point(lambda v: v * c['a'])
    return Image.merge('RGBA', (r, g, b, al))

def render(data):
    W, H = data['w'], data['h']
    x0, y0, x1, y1 = a.crop if a.crop else (-W / 2, -H / 2 + 1, W / 2, H / 2 + 1)
    P = a.ppu
    cw, ch = round((x1 - x0) * P), round((y1 - y0) * P)
    canvas = Image.new('RGBA', (cw, ch), (18, 17, 22, 255))
    to_px = lambda wx, wy: ((wx - x0) * P, (y1 - wy) * P)
    order = sorted(enumerate(data['pieces']), key=lambda q: (-q[1]['pos'].get('z', 0), q[0]))
    for _, p in order:
        t = texture(p)
        sx, sy = p['scale'].get('x', 1), p['scale'].get('y', 1)
        tw, th = p['w'] / 100 * sx, p['h'] / 100 * sy
        px, py = p['pos']['x'], p['pos']['y']
        if p['drawMode'] == 2 and p['tiled']:
            tx, ty = p['tiled']['x'], p['tiled']['y']
            L = px + tw / 2 - tx * tw if p['flipX'] else px - tw / 2
            B = py + th / 2 - ty * th if p['flipY'] else py - th / 2
            rw, rh = tx * tw, ty * th
            if L > x1 or L + rw < x0 or B > y1 or B + rh < y0:
                continue
            pw, ph = max(1, round(rw * P)), max(1, round(rh * P))
            if t is None:
                im = Image.new('RGBA', (pw, ph), (90, 90, 90, 255))
            else:
                tp = t.resize((max(1, round(tw * P)), max(1, round(th * P))), Image.BILINEAR)
                im = Image.new('RGBA', (pw, ph))
                nx, ny = int(tx) + 2, int(ty) + 2
                for j in range(ny):
                    top = ph - (j + 1) * tp.height
                    for i in range(nx):
                        im.paste(tp, (i * tp.width, top))
                if p['flipX']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
                if p['flipY']: im = im.transpose(Image.FLIP_TOP_BOTTOM)
            im = tinted(im, p['color'])
            rot = p.get('rot', 0) or 0
            if abs(rot) > 0.01:
                # 돌린 반복 그림: 첫 장 가운데(엔티티 자리)를 축으로 돈다 (길 안내 곡선 토막 · 45° 모서리 조각)
                C = int((pw ** 2 + ph ** 2) ** 0.5) + 4
                big = Image.new('RGBA', (2 * C, 2 * C))
                ax, ay = tw / 2 * P, ph - th / 2 * P
                big.paste(im, (round(C - ax), round(C - ay)))
                big = big.rotate(rot, resample=Image.BILINEAR, center=(C, C))
                ox, oy = to_px(px, py)
                canvas.paste(big, (round(ox - C), round(oy - C)), big)
                continue
            ox, oy = to_px(L, B + rh)
            canvas.paste(im, (round(ox), round(oy)), im)
            continue
        if p['kind'] in ('floor', 'border-atlas', 'effect'):
            pv = pivots.get(p['name'], (0.5, 0.5))
        elif p['kind'] == 'maple':
            pv = (0.5, p.get('ny', 0.5))
        else:
            pv = pivots.get(p['name'], (0.5, 0.5) if 'decal' in p['name'] else (0.5, 0.0))
        L, B = px - pv[0] * tw, py - pv[1] * th
        if L > x1 or L + tw < x0 or B > y1 or B + th < y0:
            continue
        pw, ph = max(1, round(tw * P)), max(1, round(th * P))
        im = t.resize((pw, ph), Image.BILINEAR) if t is not None else Image.new('RGBA', (pw, ph), (120, 120, 120, 200))
        if p['flipX']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        if p['flipY']: im = im.transpose(Image.FLIP_TOP_BOTTOM)
        im = tinted(im, p['color'])
        ox, oy = to_px(L, B + th)
        canvas.paste(im, (round(ox), round(oy)), im)
    if a.overlay:
        over = Image.new('RGBA', canvas.size)
        d = ImageDraw.Draw(over)
        walls = set(map(tuple, data.get('bpWalls', [])))
        for x, y in data['tiles']:
            if (x, y) in walls:
                continue
            ox, oy = to_px(x, y + 1)
            d.rectangle([ox, oy, ox + P - 1, oy + P - 1], outline=(255, 60, 60, 230), fill=(255, 40, 40, 70))
        for f in data['func']:
            ox, oy = to_px(f['x'], f['y'])
            d.ellipse([ox - 5, oy - 5, ox + 5, oy + 5], fill=(255, 220, 40, 255))
        canvas.alpha_composite(over)
    return canvas

ims = [render(json.load(open(j))) for j in a.jsons]
try:
    font = ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', 26)
except Exception:
    font = ImageFont.load_default()
gap, head = 16, 44
out = Image.new('RGB', (sum(i.width for i in ims) + gap * (len(ims) - 1), max(i.height for i in ims) + head), (14, 13, 18))
d = ImageDraw.Draw(out)
x = 0
labels = a.labels or [os.path.basename(j) for j in a.jsons]
for im, lab in zip(ims, labels):
    out.paste(im.convert('RGB'), (x, head))
    d.text((x + 10, 8), lab, font=font, fill=(236, 230, 214))
    x += im.width + gap
out.save(a.out)
print(f'{a.out}: {out.width}×{out.height}')
