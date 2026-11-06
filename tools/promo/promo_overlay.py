#!/usr/bin/env python3
"""글자 겹칠 그림(투명 PNG) 만들기 — ffmpeg에 drawtext가 없어서 Pillow로 그린다.

python3 promo_overlay.py spec.json out.png
spec = {"size":[W,H], "bg":[r,g,b,a]?, "items":[
  {"type":"rect","x":0,"y":0,"w":W,"h":300,"color":[0,0,0,140], "fade_top":60?, "fade_bottom":40?},
  {"type":"text","text":"...","cx":540,"cy":200,"size":80,"weight":"ExtraBold","color":[255,255,255,255],
   "hl":["단어"],"hl_color":[255,214,0,255],"max_w":1000,"stroke":4,"stroke_color":[0,0,0,255],
   "pill":{"pad_x":36,"pad_y":18,"color":[0,0,0,150],"radius":24}}
]}
글꼴: Pretendard (~/Library/Fonts 또는 /Library/Fonts) → 없으면 Apple SD Gothic Neo.
표준 출력에 실제 쓴 글꼴 경로와 글자 크기(자동 축소 후)를 JSON 한 줄로 남긴다.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

WEIGHTS = ['Black', 'ExtraBold', 'Bold', 'SemiBold', 'Medium', 'Regular']

def find_font(weight):
    for d in [os.path.expanduser('~/Library/Fonts'), '/Library/Fonts']:
        p = os.path.join(d, f'Pretendard-{weight}.otf')
        if os.path.exists(p):
            return p, 0
    return '/System/Library/Fonts/AppleSDGothicNeo.ttc', {'Black': 8, 'ExtraBold': 7, 'Bold': 6}.get(weight, 2)

def load(weight, size):
    p, idx = find_font(weight)
    return ImageFont.truetype(p, size, index=idx), p

def segments(text, hl):
    """강조 단어 위치로 [(조각, 강조?)] 나누기."""
    marks = [False] * len(text)
    for w in hl or []:
        s = 0
        while True:
            i = text.find(w, s)
            if i < 0: break
            for k in range(i, i + len(w)): marks[k] = True
            s = i + len(w)
    out = []
    for ch, m in zip(text, marks):
        if out and out[-1][1] == m: out[-1][0] += ch
        else: out.append([ch, m])
    return out

def draw_text(img, it, log):
    d = ImageDraw.Draw(img)
    size = it.get('size', 72)
    weight = it.get('weight', 'ExtraBold')
    stroke = it.get('stroke', 0)
    max_w = it.get('max_w', img.width - 80)
    while True:
        f, path = load(weight, size)
        bb = d.textbbox((0, 0), it['text'], font=f, stroke_width=stroke)
        tw = bb[2] - bb[0]
        if tw <= max_w or size <= 20: break
        size -= 2
    asc, desc = f.getmetrics()
    th = asc + desc
    x = it['cx'] - tw / 2
    y = it['cy'] - th / 2
    pill = it.get('pill')
    if pill:
        px, py = pill.get('pad_x', 32), pill.get('pad_y', 16)
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle([x - px, y - py + 4, x + tw + px, y + th + py], radius=pill.get('radius', 20), fill=tuple(pill['color']))
        img.alpha_composite(layer)
        d = ImageDraw.Draw(img)
    base = tuple(it.get('color', [255, 255, 255, 255]))
    hlc = tuple(it.get('hl_color', [255, 214, 0, 255]))
    sc = tuple(it.get('stroke_color', [0, 0, 0, 255]))
    cx = x - bb[0]
    for seg, m in segments(it['text'], it.get('hl')):
        d.text((cx, y), seg, font=f, fill=hlc if m else base, stroke_width=stroke, stroke_fill=sc)
        cx += d.textlength(seg, font=f)
    log.append({'text': it['text'], 'size': size, 'font': os.path.basename(path), 'width': tw})

def draw_rect(img, it):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y, w, h = it['x'], it['y'], it['w'], it['h']
    r, g, b, a = it['color']
    ft, fb = it.get('fade_top', 0), it.get('fade_bottom', 0)
    for yy in range(h):
        k = 1.0
        if ft and yy < ft: k = yy / ft
        if fb and yy > h - fb: k = min(k, (h - yy) / fb)
        d.line([(x, y + yy), (x + w - 1, y + yy)], fill=(r, g, b, int(a * k)))
    img.alpha_composite(layer)

def main():
    spec = json.load(open(sys.argv[1]))
    W, H = spec['size']
    img = Image.new('RGBA', (W, H), tuple(spec.get('bg', [0, 0, 0, 0])))
    log = []
    for it in spec['items']:
        if it['type'] == 'rect': draw_rect(img, it)
        elif it['type'] == 'text': draw_text(img, it, log)
    img.save(sys.argv[2])
    print(json.dumps(log, ensure_ascii=False))

if __name__ == '__main__':
    main()
