#!/usr/bin/env python3
"""프레임 접촉판 — 영상에서 시각마다 한 장씩 뽑아 라벨 붙인 격자 jpg를 만든다.

사용:
  python3 contact.py --video out.mp4 --out sheet.jpg [--n 16] [--cols 8] [--cell-w 270]
  python3 contact.py --video play.mp4 --times 9,10,11 --vf "crop=540:960:690:60" --out c.jpg
"""
import argparse, json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for p in [os.path.expanduser('~/Library/Fonts/Pretendard-Bold.otf'), '/Library/Fonts/Pretendard-Bold.otf',
              '/System/Library/Fonts/AppleSDGothicNeo.ttc']:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def duration(v):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', v])
    return float(json.loads(out)['format']['duration'])

def fmt(t):
    m = int(t // 60); s = t - m * 60
    return f'{m}:{s:05.2f}'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--n', type=int, default=16)
    ap.add_argument('--times', default='')
    ap.add_argument('--labels', default='', help='쉼표로 나눈 라벨(시각 대신)')
    ap.add_argument('--cols', type=int, default=8)
    ap.add_argument('--cell-w', type=int, default=270)
    ap.add_argument('--vf', default='')
    a = ap.parse_args()
    if a.times:
        times = [float(x) for x in a.times.split(',')]
    else:
        d = duration(a.video)
        times = [min(d - 0.05, (i + 0.5) * d / a.n) for i in range(a.n)]
    labels = a.labels.split(',') if a.labels else [fmt(t) for t in times]
    tmp = tempfile.mkdtemp()
    cells = []
    for i, t in enumerate(times):
        p = os.path.join(tmp, f'{i:03d}.png')
        cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', a.video, '-frames:v', '1']
        vf = (a.vf + ',' if a.vf else '') + f'scale={a.cell_w}:-2'
        cmd += ['-vf', vf, p]
        subprocess.run(cmd, check=True)
        im = Image.open(p).convert('RGB')
        d = ImageDraw.Draw(im)
        f = font(max(14, a.cell_w // 12))
        lab = labels[i] if i < len(labels) else fmt(t)
        bb = d.textbbox((0, 0), lab, font=f)
        d.rectangle([0, 0, bb[2] + 8, bb[3] + 6], fill=(0, 0, 0))
        d.text((4, 2), lab, font=f, fill=(255, 230, 0))
        cells.append(im)
    w, h = cells[0].size
    cols = min(a.cols, len(cells)); rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w + (cols - 1) * 4, rows * h + (rows - 1) * 4), (40, 40, 40))
    for i, im in enumerate(cells):
        sheet.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
    sheet.save(a.out, quality=85)
    print(a.out, sheet.size)

if __name__ == '__main__':
    main()
