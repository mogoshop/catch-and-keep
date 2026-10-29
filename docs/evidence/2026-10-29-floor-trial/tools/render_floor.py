#!/usr/bin/env python3
"""바닥 시범 비교판 2단계 — export_floor.cjs JSON 두 개(현재·시범)를 같은 카메라로 그려 나란히 놓는다.
엔진 반복 그리기 규칙(tools/build/handmade/lib.cjs 871b60b4 주석): 첫 장(왼쪽·아래)부터 TiledSize만큼 깔고,
FlipX/FlipY면 첫 장 가운데(Position)를 축으로 통째로 뒤집는다. 그림 한 장 = 1.28칸 × Scale.
그리는 것: 바닥 그림 조각(ArtFloor·ArtZone*)만, 먼 z부터. 설계도(data/handmade/<id>.txt) 벽 글자 칸은 어두운 덮개
(--blueprint 없으면 RectTileMap 충돌 칸 269 — 장식이 막은 칸까지 어두워진다). 장식·세트·조명·캐릭터는 그리지 않는다.
사용: python3 render_floor.py --cur a.json --trial b.json --center X Y --title 이름 --out 파일.png --assets 폴더 [폴더…] --sprites data/art_sprites.csv [--blueprint data/handmade/<id>.txt]
"""
import argparse, csv, json, pathlib
from PIL import Image, ImageDraw, ImageFont

S = 1.28
WALL = 269
ap = argparse.ArgumentParser()
ap.add_argument('--cur', required=True); ap.add_argument('--trial', required=True)
ap.add_argument('--center', nargs=2, type=float, required=True)
ap.add_argument('--zoom', type=float, default=0.8)          # 메이커 줌 80 = PC 화면 12.8×7.2칸 / 0.8 = 16×9칸
ap.add_argument('--title', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--assets', nargs='+', required=True); ap.add_argument('--sprites', required=True)
ap.add_argument('--blueprint')
ap.add_argument('--label-cur', default='현재 (871b60b4 · 열 좌우 + 줄 상하 의사난수)')
ap.add_argument('--label-trial', default='시범 (상하 의사난수 섞기 중지 + 경계 이음 보정 유지)')
a = ap.parse_args()

names = {r['ruid']: r['name'] for r in csv.DictReader(open(a.sprites, encoding='utf-8'))}
tex_cache = {}
def texture(ruid):
    if ruid not in tex_cache:
        name = names.get(ruid)
        found = None
        for root in a.assets:
            hits = sorted(pathlib.Path(root).glob(f'**/png/{name}.png')) if name else []
            if hits: found = hits[0]; break
        tex_cache[ruid] = Image.open(found).convert('RGBA') if found else None
    return tex_cache[ruid]

PPU = 100                                   # 1칸 = 100px로 그린 뒤 줌 배율로 줄인다
VW, VH = 12.8 / a.zoom, 7.2 / a.zoom
cx, cy = a.center
x0, y1 = cx - VW / 2, cy + VH / 2
W, H = round(VW * PPU), round(VH * PPU)
def to_px(wx, wy): return (wx - x0) * PPU, (y1 - wy) * PPU

def strip(tex, tx, ty, tile_px):
    # 첫 장을 왼쪽·아래에 두고 tx×ty장 반복 (끝 장은 잘림) — 이미지 좌표는 위가 0
    sw, sh = max(1, round(tx * tile_px)), max(1, round(ty * tile_px))
    t = tex.resize((round(tile_px), round(tile_px)), Image.LANCZOS)
    im = Image.new('RGBA', (sw, sh))
    nx, ny = int(tx) + 2, int(ty) + 2
    for j in range(ny):
        top = sh - (j + 1) * t.height
        for i in range(nx):
            im.paste(t, (i * t.width, top))
    return im

def render(data):
    canvas = Image.new('RGBA', (W, H), (20, 19, 24, 255))
    pieces = sorted(enumerate(data['pieces']), key=lambda p: (-(p[1]['pos'] or {}).get('z', 0), p[0]))
    for _, p in pieces:
        tex = texture(p['ruid'])
        if tex is None or p.get('drawMode') != 2: continue
        sc = (p.get('scale') or {}).get('x', 1)
        tile = S * sc
        tx, ty = p['tiled']['x'], p['tiled']['y']
        px, py = p['pos']['x'], p['pos']['y']
        L = px + tile / 2 - tx * tile if p['flipX'] else px - tile / 2
        B = py + tile / 2 - ty * tile if p['flipY'] else py - tile / 2
        if L > x0 + VW or L + tx * tile < x0 or B > y1 or B + ty * tile < y1 - VH: continue
        im = strip(tex, tx, ty, tile * PPU)
        if p['flipX']: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        if p['flipY']: im = im.transpose(Image.FLIP_TOP_BOTTOM)
        c = p.get('color')
        if c:
            r, g, b, al = im.split()
            r = r.point(lambda v: v * c['r']); g = g.point(lambda v: v * c['g']); b = b.point(lambda v: v * c['b'])
            im = Image.merge('RGBA', (r, g, b, al))
        ox, oy = to_px(L, B + ty * tile)
        canvas.paste(im, (round(ox), round(oy)), im)   # 알파를 가림으로 (바닥 그림은 불투명)
    over = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(over)
    for x, y, t in (bp_walls if a.blueprint else data['tiles']):
        if t != WALL: continue
        ox, oy = to_px(x, y + 1)
        if ox > W or oy > H or ox + PPU < 0 or oy + PPU < 0: continue
        d.rectangle([ox, oy, ox + PPU - 1, oy + PPU - 1], fill=(14, 13, 17, 200))
    canvas.alpha_composite(over)
    return canvas.resize((round(VW * PPU * a.zoom), round(VH * PPU * a.zoom)), Image.LANCZOS)

bp_walls = []
if a.blueprint:
    # 설계도: ;size W H · ;wall <글자> … · 나머지 줄이 격자 (칸 (c, r) → 월드 칸 x = c − W/2, y = H/2 − r)
    lines = open(a.blueprint, encoding='utf-8').read().splitlines()
    size = next(l.split()[1:3] for l in lines if l.startswith(';size'))
    bw, bh = int(size[0]), int(size[1])
    wall_ch = {l.split()[1] for l in lines if l.startswith(';wall')}
    grid = [l for l in lines if l and not l.startswith(';')]
    bp_walls = [(c - bw // 2, bh // 2 - r, WALL) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch in wall_ch]
cur, trial = render(json.load(open(a.cur))), render(json.load(open(a.trial)))
font = ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', 26)
gap, head = 12, 46
out = Image.new('RGB', (cur.width * 2 + gap, cur.height + head), (16, 15, 20))
d = ImageDraw.Draw(out)
for i, (im, label) in enumerate([(cur, a.label_cur), (trial, a.label_trial)]):
    x = i * (cur.width + gap)
    out.paste(im.convert('RGB'), (x, head))
    d.text((x + 12, 9), f'{a.title} · {label}', font=font, fill=(236, 230, 214))
out.save(a.out)
print(f'{a.out}: {out.width}×{out.height} · 카메라 중심 ({cx}, {cy}) · 보이는 칸 {VW:.1f}×{VH:.1f} (줌 {a.zoom:.0%})')
