#!/usr/bin/env python3
"""출시 전 수정 5건 오프라인 미리보기 (메이커 없이): 빌드된 GameHUD 배치(tests/quality/release_fix5_dump.cjs · 87f8cdf2 / 지금) → 전·후 확대 PNG.
그림: 단추 틀 = assets/codex-ui-v2 button-frame(9조각 48/20 어림) · 칩 테 = assets/codex-feel-fx-v2 ui-loot-label(9조각 12) · 캐릭터 = 랭킹 2차 미리보기 대역(avatar-standin.png).
gauge_fill 그림 색 = 메이커 11-01 실측 곱(띠 픽셀 ÷ 설정 색 ≈ 0.745·0.172·0.255). 아바타 몸 = ui-tokens avatarFill(메이커 실측 비율)로 칸 안 자리를 잡는다.
초록 점선 = 누르는 칸(ButtonComponent) · 노랑 점선 = 제목·쪽 글 칸. 실제 화면(엔진 9조각·UI 아바타·글꼴)은 메이커에서만 확인된다.
사용: python3 render.py <before.lua> <after.lua> <out_dir>
"""
import json, re, sys, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[4]
MAIN = ROOT
for p in [ROOT] + list(ROOT.parents):
    if (p / 'assets/codex-feel-fx-v2/png/ui-loot-label.png').exists():
        MAIN = p
        break
BTN = Image.open(MAIN / 'assets/codex-ui-v2/png/button-frame.png').convert('RGBA')
PLATE = Image.open(MAIN / 'assets/codex-feel-fx-v2/png/ui-loot-label.png').convert('RGBA')
AV = Image.open(ROOT / 'docs/evidence/2026-11-01-rank-window-2/preview/avatar-standin.png').convert('RGBA')
FONT = '/Library/Fonts/Pretendard-Regular.otf'
FONTB = '/Library/Fonts/Pretendard-Bold.otf'
S = 3
GAUGE_TINT = (0.745, 0.172, 0.255)
WIN = (13, 11, 15)
FILL = (0.56, 0.68, 0.02)

def parse(path):
    out = dict()
    for line in pathlib.Path(path).read_text().splitlines():
        m = re.match(r'\["(.+?)"\]=\x7b(.*)\x7d,$', line)
        if not m:
            continue
        props = dict()
        for k, v in re.findall(r'(\w+)=("(?:[^"\\]|\\.)*"|[^,]+)', m.group(2)):
            if v.startswith('"'):
                props[k] = json.loads(v)
            elif v in ('true', 'false'):
                props[k] = v == 'true'
            else:
                props[k] = float(v)
        out[m.group(1)] = props
    return out

def rect(e, pw, ph):
    l = e['ax'] * pw + e['x'] - e['px'] * e['w']
    b = e['ay'] * ph + e['y'] - e['py'] * e['h']
    return (l, b, l + e['w'], b + e['h'])

_f = dict()
def font(px, bold=False):
    k = (int(round(px)), bold)
    if k not in _f:
        _f[k] = ImageFont.truetype(FONTB if bold else FONT, max(6, k[0]))
    return _f[k]

def nine(img, w, h, l, t, r, b, sc=1.0):
    w, h = max(1, int(w)), max(1, int(h))
    W, H = img.size
    dl, dr = min(int(l * sc), w // 2), min(int(r * sc), w // 2)
    dt, db = min(int(t * sc), h // 2), min(int(b * sc), h // 2)
    out = Image.new('RGBA', (w, h))
    xs = [(0, l, 0, dl), (l, W - r, dl, w - dr), (W - r, W, w - dr, w)]
    ys = [(0, t, 0, dt), (t, H - b, dt, h - db), (H - b, H, h - db, h)]
    for sx0, sx1, dx0, dx1 in xs:
        for sy0, sy1, dy0, dy1 in ys:
            if sx1 <= sx0 or sy1 <= sy0 or dx1 <= dx0 or dy1 <= dy0:
                continue
            out.alpha_composite(img.crop((sx0, sy0, sx1, sy1)).resize((dx1 - dx0, dy1 - dy0)), (dx0, dy0))
    return out

def tint(img, rgb, a=1.0):
    im = img.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = px[x, y]
            px[x, y] = (int(r * rgb[0]), int(g * rgb[1]), int(b * rgb[2]), int(al * a))
    return im

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

class Panel:
    """부모 좌표(왼쪽 아래 0,0 · y 위로) w×h를 S배로 · 둘레 여백 m(부모 밖으로 넘치는 누르는 칸을 보이려고)"""
    def __init__(self, w, h, m=16, bg=WIN):
        self.w, self.h, self.m = w, h, m
        self.img = Image.new('RGBA', (int((w + 2 * m) * S), int((h + 2 * m) * S)), bg + (255,))
        self.d = ImageDraw.Draw(self.img)

    def box(self, r):
        l, b, rr, t = r
        return (int((l + self.m) * S), int((self.h - t + self.m) * S), int((rr + self.m) * S), int((self.h - b + self.m) * S))

    def fill(self, r, rgba):
        layer = Image.new('RGBA', self.img.size)
        ImageDraw.Draw(layer).rectangle(self.box(r), fill=rgba)
        self.img.alpha_composite(layer)

    def paste(self, im, r):
        x0, y0, x1, y1 = self.box(r)
        if x1 - x0 < 1 or y1 - y0 < 1:
            return
        self.img.alpha_composite(im.resize((x1 - x0, y1 - y0)), (x0, y0))

    def dashed(self, r, color, width=2):
        x0, y0, x1, y1 = self.box(r)
        step = 6
        for x in range(x0, x1, step * 2):
            self.d.line([(x, y0), (min(x + step, x1), y0)], fill=color, width=width)
            self.d.line([(x, y1), (min(x + step, x1), y1)], fill=color, width=width)
        for y in range(y0, y1, step * 2):
            self.d.line([(x0, y), (x0, min(y + step, y1))], fill=color, width=width)
            self.d.line([(x1, y), (x1, min(y + step, y1))], fill=color, width=width)

    def text(self, r, lines, px, color, bold=False, align='center'):
        x0, y0, x1, y1 = self.box(r)
        f = font(px * S, bold)
        lh = px * S * 1.25
        total = lh * len(lines)
        y = (y0 + y1) / 2 - total / 2
        for ln in lines:
            tw = self.d.textlength(ln, font=f)
            x = x0 + 2 if align == 'left' else (x0 + x1) / 2 - tw / 2
            self.d.text((x, y), ln, font=f, fill=color)
            y += lh

    def frame_nine(self, r, img, l, t, rr, b, sc, rgb=(1, 1, 1)):
        x0, y0, x1, y1 = self.box(r)
        im = nine(img, x1 - x0, y1 - y0, l, t, rr, b, sc * S)
        if rgb != (1, 1, 1):
            im = tint(im, rgb)
        self.img.alpha_composite(im, (x0, y0))

def wrap(text, px, room):
    """글 칸 room에 한 글자씩 채워 꺾는다 (BestFit 없음 · 한글 1자 = px 어림)"""
    out, cur, w = [], '', 0
    for ch in text:
        cw = px if ord(ch) > 127 else px * 0.55
        if cur and w + cw > room + 0.01:
            out.append(cur)
            cur, w = '', 0
        cur += ch
        w += cw
    out.append(cur)
    return out

GREEN, YELLOW, GRAY = (90, 230, 120), (240, 210, 80), (130, 130, 130)
TITLE_C, GOLD_C, DIM_C = (246, 227, 176), (230, 220, 198), (156, 148, 136)
PLATE_RUID = '2e3042c545244a4097cea6d601b31202'

def draw_arrows(U, bar, label_key, label, label_px, m):
    B = U[bar]
    P = Panel(B['w'], B['h'], m=m)
    if bar.endswith('ActBar'):
        P.fill((0, 0, B['w'], B['h']), (0, 0, 0, 77))
    for side, glyph in (('Prev', '◀'), ('Next', '▶')):
        h = U[bar + '/' + side]
        hr = rect(h, B['w'], B['h'])
        art = U.get(bar + '/' + side + 'Art')
        P.frame_nine(rect(art, B['w'], B['h']) if art else hr, BTN, 48, 20, 48, 20, 1)
        tb = (hr[0] + h.get('padl', 0), hr[1] + h.get('padb', 0), hr[2] - h.get('padr', 0), hr[3] - h.get('padt', 0))
        P.text(tb, [glyph], 24, TITLE_C)
        P.dashed(hr, GREEN, 3)
    t = U[bar + '/' + label_key]
    tr = rect(t, B['w'], B['h'])
    P.text(tr, [label], label_px, TITLE_C if label_key == 'Title' else GOLD_C, bold=label_key == 'Title')
    P.dashed(tr, YELLOW, 2)
    return P.img

def body_box(av, ar):
    side = round((av['w'] - av['w'] * FILL[0]) / 2)
    return (ar[0] + side, ar[1] + av['h'] * FILL[2], ar[2] - side, ar[1] + av['h'] * (FILL[2] + FILL[1]))

def draw_cell(U, path, rank, name, value, mine, shade):
    C = U[path]
    P = Panel(C['w'], C['h'], m=24)
    bg = (245, 217, 89, 56) if mine else (255, 255, 255, 13)
    P.fill((0, 0, C['w'], C['h']), bg)
    av = U[path + '/Avatar']
    ar = rect(av, C['w'], C['h'])
    im = AV.crop(AV.getbbox())
    if shade:
        im = tint(im, shade[:3], shade[3])
    P.paste(im, body_box(av, ar))
    P.dashed(ar, GRAY, 1)
    P.dashed((0, 0, C['w'], C['h']), (90, 80, 60), 1)
    for key, txt, px, col, bold in (('Rank', rank, 22, (255, 212, 90), True), ('Name', name, 18, (244, 237, 131) if mine else GOLD_C, True), ('Value', value, 16, (211, 204, 204), False)):
        e = U.get(path + '/' + key)
        if e:
            P.text(rect(e, C['w'], C['h']), [txt], px, col, bold=bold, align='center' if key == 'Rank' else 'left')
    return P.img

def draw_row(U, r, color_hex, tag, name, sub, buttons, gauge):
    R = U['SocialWin/' + r]
    P = Panel(R['w'], R['h'], m=8)
    c = hexrgb(color_hex)
    t = GAUGE_TINT if gauge else (1, 1, 1)
    shown = tuple(int(c[i] * t[i]) for i in range(3))
    P.fill((0, 0, R['w'], R['h']), shown + (41,))
    mk = U['SocialWin/' + r + '/Mark']
    P.fill(rect(mk, R['w'], R['h']), shown + (255,))
    P.text(rect(U['SocialWin/' + r + '/Tag'], R['w'], R['h']), [tag], 16, c, bold=True, align='left')
    nr = rect(U['SocialWin/' + r + '/Name'], R['w'], R['h'])
    P.text((nr[0], nr[1] + 22, nr[2], nr[3]), [name], 18, c, align='left')
    P.text((nr[0], nr[1], nr[2], nr[1] + 24), [sub], 15, DIM_C, align='left')
    for key, label, dim in buttons:
        e = U['SocialWin/' + r + '/' + key]
        er = rect(e, R['w'], R['h'])
        col = (122, 114, 104) if dim else GOLD_C
        if e.get('ruid') == PLATE_RUID:
            P.frame_nine(er, PLATE, 12, 12, 12, 12, 1, rgb=(0.72, 0.68, 0.60))
        else:
            P.frame_nine(er, BTN, 48, 20, 48, 20, 1)
        room = e['w'] - e.get('padl', 0) - e.get('padr', 0)
        tb = (er[0] + e.get('padl', 0), er[1], er[2] - e.get('padr', 0), er[3])
        P.text(tb, wrap(label, 17, room), 17, col)
    return P.img

def column(U, title):
    parts = []
    parts.append(('① 랭킹 창 심연 액트 막대 ◀ ▶ (초록 = 누르는 칸 · 노랑 = 제목 칸)', draw_arrows(U, 'RankWin/Paper/ActBar', 'Title', '액트 1 · 무덤 왕국', 23, 16)))
    parts.append(('① 플레이어 창 쪽 넘김 ◀ ▶', draw_arrows(U, 'SocialWin/Pager', 'Label', '1 / 2', 20, 34)))
    parts.append(('③④ 내 파티 줄 (하늘 #6CC4FF) · 같은 방 파티원', draw_row(U, 'R1', '#6CC4FF', '내 파티 · 2명', '가상셋  Lv1', '잿불 야영지 · 같은 곳', (('Party', '파티원', True), ('Duel', '결투', False), ('Trade', '거래', False), ('Inspect', '살펴보기', False)), U.get('SocialWin/R1/Mark', dict()).get('ruid') != WHITE_RUID)))
    parts.append(('③④ 다른 파티 줄 (호박 #FFB45A) · 다른 게임', draw_row(U, 'R8', '#FFB45A', '파티 · 2명', '가상둘  Lv1', '다른 게임 · 노말', (('Party', '초대', False),), U.get('SocialWin/R8/Mark', dict()).get('ruid') != WHITE_RUID)))
    old = U['RankWin/Paper/List/R1/Avatar']['w'] < 60
    shade = (0.13, 0.12, 0.16, 0.9) if old else (0.5, 0.48, 0.62, 0.95)
    parts.append(('⑤ 랭킹 칸 · 내 칸 (외형 있음)', draw_cell(U, 'RankWin/Paper/List/R1', '1', '새내기', 'Lv40 · 노말 액트 4', True, None)))
    parts.append(('⑤ 랭킹 칸 · 외형 없는 옛 줄 (그림자 모습)', draw_cell(U, 'RankWin/Paper/List/R2', '2', '인꾸', 'Lv17 · 지옥 액트 1', False, shade)))
    pad = 14
    W = max(im.width for _, im in parts) + pad * 2
    H = sum(im.height + 44 for _, im in parts) + 70
    out = Image.new('RGBA', (W, H), (28, 26, 30, 255))
    d = ImageDraw.Draw(out)
    d.text((pad, 14), title, font=font(30, True), fill=(255, 255, 255))
    y = 70
    for cap, im in parts:
        d.text((pad, y), cap, font=font(22), fill=(220, 210, 190))
        out.alpha_composite(im, (pad, y + 32))
        y += im.height + 44
    return out

WHITE_RUID = 'f8c7c91bc5054280a7fb0e6ddffa66e3'

def main():
    before, after, out_dir = parse(sys.argv[1]), parse(sys.argv[2]), pathlib.Path(sys.argv[3])
    a = column(before, '전 (87f8cdf2)')
    b = column(after, '후 (출시 전 수정 5건)')
    out = Image.new('RGBA', (a.width + b.width + 20, max(a.height, b.height)), (60, 56, 60, 255))
    out.alpha_composite(a, (0, 0))
    out.alpha_composite(b, (a.width + 20, 0))
    out.convert('RGB').save(out_dir / 'before-after-x3.png')
    print('[render] ' + str(out_dir / 'before-after-x3.png') + ' %dx%d' % out.size)

main()
