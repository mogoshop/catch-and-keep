# -*- coding: utf-8 -*-
"""플레이어 창(SocialWin) 오프라인 미리보기 — 빌드된 배치(layout.json) + 실제 SocialWindow.Render가 넣은 글·색·켜짐(five.json · twenty.json).
게임 그림(창 테두리 9조각·단추 그림)은 없고 같은 자리에 단색으로 그린다. 글꼴은 맥 기본 한글 글꼴 (게임 글꼴과 폭이 조금 다르다).
다시 만들기:
  node docs/evidence/2026-11-01-channel-players/export_layout.cjs > docs/evidence/2026-11-01-channel-players/layout.json
  CHANNEL_PREVIEW_OUT=$PWD/docs/evidence/2026-11-01-channel-players python3 tests/quality/run.py --lua <lua> channel_roster
  python3 docs/evidence/2026-11-01-channel-players/render_preview.py
"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
def font(size, bold=False):
    return ImageFont.truetype(FONT, int(size), index=6 if bold else 0)

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

BG = (13, 11, 15)
GOLD = '#E6DCC6'

def runs(text, size, color):
    """간단한 서식 글 해석: <color=#..> · <size=N> · 줄바꿈 → 줄마다 [(글, 크기, 색)]"""
    lines = [[]]
    stack_c, stack_s = [color], [size]
    for tok in re.split(r'(<[^>]+>|\n)', text or ''):
        if not tok:
            continue
        if tok == '\n':
            lines.append([]); continue
        m = re.match(r'<color=(#[0-9A-Fa-f]{6})>', tok)
        if m: stack_c.append(m.group(1)); continue
        if tok == '</color>': stack_c.pop() if len(stack_c) > 1 else None; continue
        m = re.match(r'<size=(\d+)>', tok)
        if m: stack_s.append(int(m.group(1))); continue
        if tok == '</size>': stack_s.pop() if len(stack_s) > 1 else None; continue
        if tok.startswith('<'): continue
        lines[-1].append((tok, stack_s[-1], stack_c[-1]))
    return lines

def draw_text(d, box, text, size, color, align='left', bold=False):
    x, y, w, h = box
    lines = runs(text, size, color)
    heights = [max([s for _, s, _ in ln] or [size]) * 1.25 for ln in lines]
    total = sum(heights)
    scale = 1.0
    widths = []
    for ln in lines:
        widths.append(sum(d.textlength(t, font=font(s, bold)) for t, s, _ in ln))
    if widths and max(widths) > w - 4:
        scale = max(0.6, (w - 4) / max(widths))
    cy = y + (h - total * scale) / 2
    for ln, lh, lw in zip(lines, heights, widths):
        cx = x + 2 if align == 'left' else x + (w - lw * scale) / 2
        for t, s, c in ln:
            f = font(s * scale, bold)
            d.text((cx, cy + (lh - s * 1.25) * scale), t, font=f, fill=hexrgb(c) if c.startswith('#') else c)
            cx += d.textlength(t, font=f)
        cy += lh * scale

def render(state_file, out_file, caption):
    layout = json.load(open(os.path.join(HERE, 'layout.json'), encoding='utf-8'))['items']
    st = json.load(open(os.path.join(HERE, state_file), encoding='utf-8'))
    def en(it):
        k = 'en:' + it['path']
        return st[k] if k in st else it['enable']
    win = layout[0]
    M = 40
    img = Image.new('RGB', (int(win['w']) + M * 2, int(win['h']) + M * 2 + 44), (40, 38, 44))
    d = ImageDraw.Draw(img, 'RGBA')
    ox, oy = M, M
    d.rectangle([ox, oy, ox + win['w'], oy + win['h']], fill=BG)
    d.rounded_rectangle([ox - 14, oy - 14, ox + win['w'] + 14, oy + win['h'] + 14], radius=18, outline=(138, 107, 62), width=4)
    paths = {it['path']: it for it in layout}
    def visible(p):
        while p:
            it = paths.get(p)
            if it is not None and not en(it):
                return False
            p = p.rsplit('/', 1)[0] if '/' in p else ''
        return True
    for it in layout[1:]:
        p = it['path']
        if p.endswith('/Rim') and p.count('/') == 1:
            continue
        if p.startswith('SocialWin/Inspect') or not visible(p):
            continue
        x, y, w, h = ox + it['x'], oy + it['y'], it['w'], it['h']
        if it['kind'] == 'sprite':
            c = st.get('color:' + p)
            if c:
                d.rectangle([x, y, x + w, y + h], fill=(int(c[0] * 255), int(c[1] * 255), int(c[2] * 255), int(c[3] * 255)))
            else:
                d.rectangle([x, y, x + w, y + h], fill=(255, 255, 255, 9))
        elif it['kind'] == 'button':
            if p.endswith('BtnClose'):
                d.rectangle([x + 18, y + 18, x + w - 18, y + h - 18], outline=(170, 140, 100), width=3)
                d.line([x + 30, y + 30, x + w - 30, y + h - 30], fill=(220, 200, 160), width=4)
                d.line([x + w - 30, y + 30, x + 30, y + h - 30], fill=(220, 200, 160), width=4)
                continue
            clickable = st.get('click:' + p, True)
            d.rounded_rectangle([x + 1, y + 2, x + w - 1, y + h - 2], radius=8, fill=(36, 30, 26, 255), outline=(150, 118, 70) if clickable else (80, 70, 60), width=2)
            label = st.get('text:' + p, it['text'] or '')
            draw_text(d, (x + 6, y, w - 12, h), label, it['fontSize'] or 17, GOLD if clickable else '#7A7268', align='center')
        elif it['kind'] == 'text':
            label = st.get('text:' + p, it['text'] or '')
            if p == 'SocialWin/Title':
                label = '파티플레이'
            align = 'center' if (it['hAlign'] == 2 and not p.endswith(('/Tag', '/Name', 'Summary'))) else 'left'
            draw_text(d, (x, y, w, h), label, it['fontSize'] or 18, it['fontColor'] or GOLD, align=align, bold=it['bold'])
    d.text((M, img.height - 36), caption, font=font(18), fill=(200, 195, 185))
    img.save(os.path.join(HERE, out_file))
    return img

a = render('five.json', 'preview-five.png', '예: 파티 2개(각 2명) + 혼자 1명 = 5명 · 보는 사람 = 나리(게임 방 A) — 실제 SocialWindow.Render 결과 · 그림 대신 단색')
b = render('twenty.json', 'preview-twenty.png', '20명 (채널 상한) · 1쪽 / 3 — 파티 묶음은 쪽 사이에서 갈라지지 않음 · ◀ ▶ 쪽 넘김')
both = Image.new('RGB', (a.width + b.width + 20, max(a.height, b.height)), (40, 38, 44))
both.paste(a, (0, 0)); both.paste(b, (a.width + 20, 0))
both.save(os.path.join(HERE, 'offline-preview.png'))
print('saved', os.path.join(HERE, 'offline-preview.png'))
