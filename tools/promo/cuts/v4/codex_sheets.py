#!/usr/bin/env python3
"""코덱스 레이어 확인판 — python3 tools/promo/cuts/v4/codex_sheets.py
① endcard-B-codex.png: v4-shorts-60s-B-codex 엔드카드 정지 1장(1080×1920 원본 크기, 끝 0.5초 전)
② transitions-B-codex-tr.jpg: -tr 편의 혼불 띠 4곳, 띠가 가장 진한 순간(등장 시작 +0.3초) 나란히(540폭) + 같은 시각 띠 없는 편(위 줄 비교용 아래 줄)"""
import json, os, subprocess
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
EV = os.path.join(ROOT, 'docs/evidence/2026-11-07-marketing-video-shorts-v4')
OUT = os.path.join(ROOT, 'assets/maple_maketing_video/out')
def summ(i): return json.load(open(os.path.join(OUT, 'work', i, 'summary.json')))
def grab(video, t, png, w=None):
    vf = ['-vf', f'scale={w}:-2:flags=lanczos'] if w else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', *vf, png], check=True)
    return Image.open(png).convert('RGB')
s = summ('v4-shorts-60s-B-codex')
grab(os.path.join(OUT, 'v4-shorts-60s-B-codex.mp4'), s['duration'] - 0.5, os.path.join(EV, 'endcard-B-codex.png'))
tr = summ('v4-shorts-60s-B-codex-tr')
times = [x['at'][0] + 0.3 for x in tr['timeline']]
tmp = os.path.join(OUT, 'work', 'v4-shorts-60s-B-codex-tr')
cw, ch = 540, 960
sheet = Image.new('RGB', (cw * 4, ch * 2 + 40), (16, 14, 20))
d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype(os.path.expanduser('~/Library/Fonts/Pretendard-SemiBold.otf'), 24)
except OSError: f = ImageFont.load_default()
for k, t in enumerate(times):
    a = grab(os.path.join(OUT, 'v4-shorts-60s-B-codex-tr.mp4'), t, os.path.join(tmp, f'tr-{k}.png'), cw)
    b = grab(os.path.join(OUT, 'v4-shorts-60s-B-codex.mp4'), t, os.path.join(tmp, f'no-{k}.png'), cw)
    sheet.paste(a, (k * cw, 40)); sheet.paste(b, (k * cw, 40 + ch))
    d.text((k * cw + 12, 8), f'{k + 2}장 시작 · {t:.2f}초 (위: 혼불 띠 · 아래: 띠 없음)', font=f, fill=(235, 235, 235))
sheet.save(os.path.join(EV, 'transitions-B-codex-tr.jpg'), quality=88)
print('endcard', s['duration'] - 0.5, 'transitions', [round(t, 2) for t in times])
