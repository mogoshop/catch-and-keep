#!/usr/bin/env python3
"""랭킹 창 오프라인 미리보기 3/3: dump_ui.cjs(빌드된 RankWin 자리·부품) + export_state.py(실제 mLua가 창을 연 뒤 상태)를 합쳐 그린다.
화면 1920×1080 기준(가운데 0) — PC 하단 메뉴 줄(Bottom/Menu)·퀵슬롯(Bottom/Slots)·버프 줄(Buffs) 자리를 함께 그려 창 아래 끝과의 간격을 보인다.
부품 그림: 창 테두리·단추 = assets/codex-ui-v2(실제 업로드 원본 · 9조각 어림) · 안쪽 판·칸 = 색 상자 어림 · 캐릭터 그림 = 메이커 실화면(10-31 캡처)에서 잘라 낸 「새내기」를
외형마다 머리색만 돌린 대역 (실제는 UI 아바타 — 메이커 확인). 글 = Pretendard(메이커 기본 글꼴과 폭이 비슷한 어림).
사용: python3 render.py <ui_before> <state_before> <ui_after> <state_after> <avatar.png> <out_dir>
"""
import colorsys, json, re, sys, pathlib, hashlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[4]
ui_b, st_b, ui_a, st_a, avatar_png, out_dir = sys.argv[1:7]
out_dir = pathlib.Path(out_dir)
FONT = '/Library/Fonts/Pretendard-Regular.otf'
FONTB = '/Library/Fonts/Pretendard-Bold.otf'
ART = ROOT / 'assets/codex-ui-v2/png'
RUID = {}
for line in (ROOT / 'data/ui_icons.csv').read_text().splitlines()[1:]:
    f = line.split(',')
    if len(f) > 2: RUID[f[1]] = f[0]
_fonts = {}
def font(px, bold=False):
    k = (round(px * 2) / 2, bold)
    if k not in _fonts: _fonts[k] = ImageFont.truetype(FONTB if bold else FONT, max(6, int(round(k[0]))))
    return _fonts[k]

def col(c, a=None):
    if c is None: return (255, 255, 255, 255)
    return (int(c.get('r', 1) * 255), int(c.get('g', 1) * 255), int(c.get('b', 1) * 255), int((c.get('a', 1) if a is None else a) * 255))

def nine(img, w, h, l, t, r, b, sc=1.0):
    # 9조각: 원본 테두리(l t r b · 그림 픽셀)를 잘라 sc배로 붙이고 가운데만 늘린다
    w, h = max(1, int(w)), max(1, int(h))
    W, H = img.size
    dl, dr = min(int(l * sc), w // 2), min(int(r * sc), w // 2)
    dt, db = min(int(t * sc), h // 2), min(int(b * sc), h // 2)
    out = Image.new('RGBA', (w, h))
    xs = [(0, l, 0, dl), (l, W - r, dl, w - dr), (W - r, W, w - dr, w)]
    ys = [(0, t, 0, dt), (t, H - b, dt, h - db), (H - b, H, h - db, h)]
    for sx0, sx1, dx0, dx1 in xs:
        for sy0, sy1, dy0, dy1 in ys:
            if sx1 <= sx0 or sy1 <= sy0 or dx1 <= dx0 or dy1 <= dy0: continue
            out.alpha_composite(img.crop((sx0, sy0, sx1, sy1)).resize((dx1 - dx0, dy1 - dy0)), (dx0, dy0))
    return out

FRAME = Image.open(ART / 'panel-frame.png').convert('RGBA')
BTN = Image.open(ART / 'button-frame.png').convert('RGBA')
SKEL = Image.open(ART / 'skill-raise-skeleton.png').convert('RGBA')
AV = Image.open(avatar_png).convert('RGBA')

def recolor(look, tint):
    # 머리색만 돌린 대역: 외형 문자열로 색상 회전 · 그림자 색(tint)이면 곱한다
    im = AV.copy()
    shift = (int(hashlib.md5(look.encode()).hexdigest(), 16) % 7) / 7.0 if look else 0
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.3 and v > 0.3 and (h < 0.1 or h > 0.9) and shift:
                r, g, b = [int(c * 255) for c in colorsys.hsv_to_rgb((h + shift) % 1, s, v)]
            if tint is not None:
                r, g, b, a = int(r * tint['r']), int(g * tint['g']), int(b * tint['b']), int(a * tint.get('a', 1))
            px[x, y] = (r, g, b, a)
    return im

TAG = re.compile(r'<color=(#[0-9A-Fa-f]{6})>(.*?)</color>|<size=\d+>|</size>|<[^>]+>')
def runs(text, base):
    out, pos = [], 0
    for m in TAG.finditer(text):
        if m.start() > pos: out.append((text[pos:m.start()], base))
        if m.group(1): out.append((m.group(2), tuple(int(m.group(1)[i:i + 2], 16) for i in (1, 3, 5)) + (255,)))
        pos = m.end()
    if pos < len(text): out.append((text[pos:], base))
    return out

def draw_text(d, rect, t, sc):
    text = t['text'] or ''
    if not text: return
    pad = t.get('pad') or {}
    l, top, r, bot = rect
    l += pad.get('left', 0) * sc; r -= pad.get('right', 0) * sc; top += pad.get('top', 0) * sc; bot -= pad.get('bottom', 0) * sc
    size = t['max'] if t.get('best') else t['size']
    base = col(t.get('color'))
    lines = text.split('\n')
    while True:
        f = font(size * sc, t.get('bold'))
        widths = [sum(d.textlength(s, font=f) for s, _ in runs(ln, base)) for ln in lines]
        lh = size * sc * 1.25
        if not t.get('best') or size <= t['min'] or (max(widths) <= (r - l) + 0.5 and lh * len(lines) <= (bot - top) + 0.5): break
        size -= 0.5
    total = lh * len(lines)
    v = t.get('v', 512)
    y = top if v == 256 else (bot - total if v == 1024 else (top + bot - total) / 2)
    for ln, w in zip(lines, widths):
        hz = t.get('h', 2)
        x = l if hz == 1 else (r - w if hz == 4 else (l + r - w) / 2)
        for s, c in runs(ln, base):
            if t.get('outline'): d.text((x, y), s, font=f, fill=c, stroke_width=max(1, int(sc)), stroke_fill=(30, 26, 24, 255))
            else: d.text((x, y), s, font=f, fill=c)
            x += d.textlength(s, font=f)
        y += lh

def tree(dump):
    ents = {e['path']: e for e in dump['entities']}
    kids = {}
    for p in ents:
        par = p.rsplit('/', 1)[0] if '/' in p else ''
        kids.setdefault(par, []).append(p)
    for v in kids.values(): v.sort(key=lambda p: ents[p].get('order', 0))   # 엔진과 같은 형제 순서로 그린다
    return ents, kids

def draw_entity(canvas, d, ents, kids, path, prect, sc, st):
    e = ents[path]
    en = st['en'].get(path, e['enable'])
    if not en: return
    size = st['size'].get(path, {'x': e['size'][0], 'y': e['size'][1]})
    pos = st['pos'].get(path, {'x': e['pos'][0], 'y': e['pos'][1]})
    w, h = size['x'] * sc, size['y'] * sc
    pl, pt, pr, pb = prect
    ax, ay = pl + e['anchor'][0] * (pr - pl), pb - e['anchor'][1] * (pb - pt)
    cx, cy = ax + pos['x'] * sc, ay - pos['y'] * sc
    l, top = cx - e['pivot'][0] * w, cy - (1 - e['pivot'][1]) * h
    rect = (l, top, l + w, top + h)
    sp = e['sprite']
    color = st['color'].get(path, sp['color'] if sp else None)
    if sp and w >= 1 and h >= 1:
        key = RUID.get(sp['ruid'], '')
        c = col(color)
        if key == 'win_frame':
            canvas.alpha_composite(nine(FRAME, w, h, 64, 86, 64, 60, sc), (int(l), int(top)))
        elif key == 'btn_frame':
            im = nine(BTN, w, h, 44, 18, 44, 18, sc)
            canvas.alpha_composite(tint_img(im, color), (int(l), int(top)))
        elif key == 'gauge_fill':
            d.rectangle(rect, fill=c)
        elif key == 'win_content':
            d.rounded_rectangle(rect, radius=max(2, int(6 * sc)), fill=(0, 0, 0, 77), outline=(92, 78, 58, 200), width=max(1, int(sc)))
        elif key == 'btn_close':
            m = w * 0.28
            d.line((l + m, top + m, l + w - m, top + h - m), fill=(235, 235, 235, 255), width=max(2, int(5 * sc)))
            d.line((l + w - m, top + m, l + m, top + h - m), fill=(235, 235, 235, 255), width=max(2, int(5 * sc)))
        elif key == 'dot':
            d.ellipse(rect, fill=c)
        elif key == 'ui_loot_label':
            d.rounded_rectangle(rect, radius=max(2, int(6 * sc)), fill=(0, 0, 0, 120), outline=c, width=max(1, int(3 * sc)))
        elif key in ('q_avail', 'skill_locked'):
            pass
        elif sp['ruid'] and c[3] > 0:
            d.rounded_rectangle(rect, radius=max(1, int(5 * sc)), fill=c)
    if e['avatar']:
        look = st['dressed'].get(path)
        if look is not None:
            im = recolor(look, st['tint'].get(path) if st['tint'].get(path, {}).get('r', 1) < 0.5 else None)
            k = min(w / im.width, h / im.height)
            im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
            canvas.alpha_composite(im, (int(l + (w - im.width) / 2), int(top + (h - im.height) / 2)))
    if e['text']:
        t = dict(e['text'])
        if path in st['text']: t['text'] = st['text'][path]
        draw_text(d, rect, t, sc)
    for k in kids.get(path, []): draw_entity(canvas, d, ents, kids, k, rect, sc, st)

def tint_img(im, color):
    if not color: return im
    r, g, b, a = [x / 255 for x in col(color)]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3]: px[x, y] = (int(p[0] * r), int(p[1] * g), int(p[2] * b), int(p[3] * a))
    return im

def screen(dump, st, sc, title, note):
    # 화면 1920×1080 (가운데 0) — 바탕 · HUD 기준 상자 · 창
    W, H = int(1920 * sc), int(1080 * sc)
    canvas = Image.new('RGBA', (W, H + int(56 * sc) + 30), (24, 22, 26, 255))
    d = ImageDraw.Draw(canvas)
    head = 30 + int(56 * sc)
    d.text((10, 6), title, font=font(26, True), fill=(246, 227, 176, 255))
    d.text((10, 38), note, font=font(17), fill=(200, 192, 176, 255))
    scr = Image.new('RGBA', (W, H), (58, 50, 42, 255))
    sd = ImageDraw.Draw(scr)
    for i in range(0, W, max(8, int(40 * sc))): sd.line((i, 0, i, H), fill=(64, 56, 47, 255))
    ents, kids = tree(dump)
    full = (0, 0, W, H)
    def hud(path, label, fill):
        e = ents[path]
        par = (0, 0, W, H) if '/' not in path else hud_rect[path.rsplit('/', 1)[0]]
        w, h = e['size'][0] * sc, e['size'][1] * sc
        ax, ay = par[0] + e['anchor'][0] * (par[2] - par[0]), par[3] - e['anchor'][1] * (par[3] - par[1])
        l, t = ax + e['pos'][0] * sc - e['pivot'][0] * w, ay - e['pos'][1] * sc - (1 - e['pivot'][1]) * h
        hud_rect[path] = (l, t, l + w, t + h)
        if label:
            sd.rectangle(hud_rect[path], fill=fill, outline=(255, 255, 255, 140))
            sd.text((l + 6, t + 4), label, font=font(max(11, 18 * sc)), fill=(255, 255, 255, 230))
    hud_rect = {}
    hud('Bottom', None, None)
    hud('Bottom/Slots', '퀵슬롯 (PC)', (40, 60, 120, 150))
    hud('Bottom/Menu', '하단 메뉴 줄 (PC)', (150, 60, 40, 170))
    hud('Buffs', '버프 줄', (60, 120, 70, 150))
    sd = ImageDraw.Draw(scr)
    draw_entity(scr, sd, ents, kids, 'RankWin', full, sc, st)
    # 창 테두리 아래 끝 ↔ 메뉴 줄 위 끝 간격 표시
    win = ents['RankWin']
    size = st['size'].get('RankWin', {'x': win['size'][0], 'y': win['size'][1]})
    pos = st['pos'].get('RankWin', {'x': win['pos'][0], 'y': win['pos'][1]})
    rim_bottom = pos['y'] - size['y'] / 2 - 20
    menu_top = 540 - (hud_rect['Bottom/Menu'][1] / sc)
    gap = rim_bottom - menu_top
    yb = H / 2 - rim_bottom * sc
    ym = hud_rect['Bottom/Menu'][1]
    x = W / 2 + 380 * sc
    colr = (120, 255, 140, 255) if gap >= 12 else (255, 90, 90, 255)
    sd.line((x, yb, x, ym), fill=colr, width=max(2, int(3 * sc)))
    sd.text((x + 8, (yb + ym) / 2 - 10), f'테두리 아래 ↔ 메뉴 줄 {gap:+.0f}', font=font(max(12, 20 * sc), True), fill=colr)
    canvas.alpha_composite(scr, (0, head))
    return canvas

def chip(dump, sc, label, picked=True):
    ents, kids = tree(dump)
    st = {'en': {}, 'pos': {}, 'size': {}, 'color': {}, 'dressed': {}, 'tint': {}, 'text': {
        'SkillWin/Choice/C1/Name': '해골 하나 더', 'SkillWin/Choice/C1/Tier': '노말'}}
    st['color']['SkillWin/Choice/C1/Rim'] = {'r': 0.44, 'g': 0.85, 'b': 0.76, 'a': 1}
    st['en']['SkillWin/Choice/C1/Tag'] = True
    e = ents['SkillWin/Choice/C1']
    w, h = e['size'][0] * sc, e['size'][1] * sc
    canvas = Image.new('RGBA', (int(w) + 20, int(h) + 52), (14, 12, 16, 255))
    d = ImageDraw.Draw(canvas)
    d.text((10, 6), label, font=font(17, True), fill=(246, 227, 176, 255))
    inner = Image.new('RGBA', (int(w), int(h)), (0, 0, 0, 0))
    idr = ImageDraw.Draw(inner)
    fake = dict(e); fake['anchor'] = [0, 1]; fake['pivot'] = [0, 1]; fake['pos'] = [0, 0]
    ents['SkillWin/Choice/C1'] = fake
    draw_entity(inner, idr, ents, kids, 'SkillWin/Choice/C1', (0, 0, w, h), sc, st)
    ic = ents.get('SkillWin/Choice/C1/Icon')
    if ic:
        s = ic['size'][0] * sc
        inner.alpha_composite(SKEL.resize((int(s), int(s))), (int(ic['pos'][0] * sc), int((h - s) / 2)))
        draw_entity(inner, idr, ents, kids, 'SkillWin/Choice/C1/Tag', (0, 0, w, h), sc, st)
        draw_entity(inner, idr, ents, kids, 'SkillWin/Choice/C1/Name', (0, 0, w, h), sc, st)
        draw_entity(inner, idr, ents, kids, 'SkillWin/Choice/C1/Tier', (0, 0, w, h), sc, st)
    tag, tier = ents['SkillWin/Choice/C1/Tag'], ents['SkillWin/Choice/C1/Tier']
    gap = tier['pos'][0] - (tag['pos'][0] + tag['size'][0])
    canvas.alpha_composite(inner, (10, 40))
    d.text((int(w) - 150, 6), f'꼬리표 ↔ 「노말」 {gap:.0f}px', font=font(17, True), fill=(120, 255, 140, 255) if gap >= 6 else (255, 90, 90, 255))
    return canvas

before, after = json.load(open(ui_b)), json.load(open(ui_a))
sb = {s['name']: s for s in json.load(open(st_b))}
sa = {s['name']: s for s in json.load(open(st_a))}
SC = 0.6
panels = [
    screen(before, sb['before_boss_2tabs'], SC, '전 (edd367b7) · 보스 탭 · 탭 둘', '탭 아래 빈 띠 = 심연 탭에서만 쓰는 액트 막대 자리 · 상위 10 · 그림 없음'),
    screen(before, sb['before_depth_4tabs'], SC, '전 · 심연 켬 · 탭 넷(둘씩 두 줄) · 창 752', '메이커 관찰 2: 창 아래 테두리가 하단 메뉴 줄에 닿을 듯'),
    screen(after, sa['after_progress_2tabs'], SC, '후 · 성장 탭 · 탭 둘 (지금 배포 상태)', '기록 판이 탭 바로 아래 · 상위 20 = 칸 4 × 5 · 칸마다 캐릭터 그림 · 3칸마다 옛 줄(그림자 모습)'),
    screen(after, sa['after_boss_2tabs'], SC, '후 · 보스 탭 · 탭 둘', '막대 없음 → 성장 탭과 같은 높이 · 내 칸 노란 빛 · 아래 내 순위 줄(그림 포함)'),
    screen(after, sa['after_depth_4tabs'], SC, '후 · 심연 켬 · 심연 탭 · 탭 넷 한 줄', '머리 줄 = 제목 | 오른쪽 액트 막대 · 창은 아래로만 36 늘어남 (위 끝 고정)'),
    screen(after, sa['after_week_4tabs'], SC, '후 · 심연 켬 · 이번 주 탭 · 탭 넷', '머리 줄 왼쪽 세 줄(규칙 제목 · 규칙 둘) · 가장 긴 배치도 메뉴 줄·버프 줄 위'),
]
pw, ph = panels[0].size
chips = [chip(before, 3, '전 · 선택 보상 칸 (고름) ×3'), chip(after, 3, '후 · 선택 보상 칸 (고름) ×3')]
cw, ch = chips[0].size
sheet = Image.new('RGBA', (pw * 2 + 30, ph * 3 + 40 + ch + 20), (12, 11, 14, 255))
for i, p in enumerate(panels): sheet.alpha_composite(p, ((i % 2) * (pw + 10) + 10, (i // 2) * (ph + 10) + 10))
for i, c in enumerate(chips): sheet.alpha_composite(c, (10 + i * (cw + 20), ph * 3 + 40))
out_dir.mkdir(parents=True, exist_ok=True)
sheet.convert('RGB').save(out_dir / 'offline-preview.png', optimize=True)
one = screen(after, sa['after_progress_2tabs'], 1.0, '후 · 성장 탭 1:1 (창 부분)', '')
win = after['entities'][0]
crop = one.crop((int(960 - 640), 86 + int(540 - 142 - 374), int(960 + 640), 86 + int(540 - 142 + 374)))
crop.convert('RGB').save(out_dir / 'offline-preview-window-1x.png', optimize=True)
print('[render] →', out_dir / 'offline-preview.png', sheet.size, '·', out_dir / 'offline-preview-window-1x.png', crop.size)
