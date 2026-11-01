# 메이커 실화면(10-31 증거 캡처)의 캐릭터 「새내기」를 잘라 바탕을 지운다 — 랭킹 창 오프라인 미리보기의 아바타 대역
import sys, colorsys
from collections import deque
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').crop((1090, 427, 1200, 584))
w, h = im.size
px = im.load()
def groundish(c):
    r, g, b = [v / 255 for v in c]
    hh, s, v = colorsys.rgb_to_hsv(r, g, b)
    # 바닥 = 갈색(색상 0.03~0.16 · 채도 0.12~0.6) · 머리(연어색)는 r−g가 커서 빠진다 · 옷(회색)은 채도가 낮아 빠진다
    return v > 0.18 and 0.12 < s < 0.6 and 0.025 < hh < 0.17 and (r - g) < 0.24
mask = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    for y in (0, h - 1): q.append((x, y))
for y in range(h):
    for x in (0, w - 1): q.append((x, y))
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or mask[y][x]: continue
    if not groundish(px[x, y]): continue
    mask[y][x] = True
    q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
outim = Image.new('RGBA', (w, h))
op = outim.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        op[x, y] = (r, g, b, 0 if mask[y][x] else 255)
outim = outim.crop(outim.getbbox())
outim.save(out)
view = Image.new('RGBA', outim.size, (30, 25, 35, 255))
view.alpha_composite(outim)
view.resize((outim.width * 3, outim.height * 3), Image.NEAREST).save(out.replace('.png', '_view.png'))
print(out, outim.size)
