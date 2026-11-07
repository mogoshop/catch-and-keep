#!/usr/bin/env python3
"""최종본 확인판 — python3 tools/promo/cuts/v4/final_sheets.py
① contact-v4-shorts-60s-B-final-text.jpg: 글자·배지 줄이 읽히는 540폭 5칸 — 0초 · 장 경계 2곳(3장·5장 첫 컷 +0.4초) · 본편 마지막(디졸브 0.2초 전) · 엔드카드
② endcard-B-final.png: 끝 0.5초 전 정지(1080×1920) ③ frame-B-final-badge.png: 본편 정지 1장(배지 줄 자리 확인용, 1080×1920)"""
import json, os, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
ID = 'v4-shorts-60s-B-final'
spec = json.load(open(os.path.join(ROOT, 'tools/promo/cuts/v4', ID + '.json')))
summ = json.load(open(os.path.join(ROOT, 'assets/maple_maketing_video/out/work', ID, 'summary.json')))
T = spec['transition']; video = os.path.join(ROOT, summ['out']); ev = os.path.dirname(os.path.join(ROOT, spec['contact']))
starts, t0 = [], 0.0
for s in summ['cuts']:
    starts.append(t0); t0 += s['dur'] - T
ch = [c['ch'] for c in spec['cuts']]
first = {c: starts[ch.index(c)] for c in sorted(set(ch))}
end_start = summ['duration'] - spec['endDur']
tt = [0.0, first[3] + 0.4, first[5] + 0.4, end_start - 0.2, summ['duration'] - 0.5]
labels = ['0초', f'3장 시작 {tt[1]:.1f}초', f'5장 시작 {tt[2]:.1f}초', f'본편 마지막 {tt[3]:.1f}초', f'엔드카드 {tt[4]:.1f}초']
py = os.path.join(ROOT, 'tools/promo/contact.py')
subprocess.run(['python3', py, '--video', video, '--out', os.path.join(ev, f'contact-{ID}-text.jpg'), '--times', ','.join(f'{x:.2f}' for x in tt),
                '--labels', ','.join(labels), '--cols', '5', '--cell-w', '540'], check=True)
def grab(t, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', os.path.join(ev, name)], check=True)
grab(summ['duration'] - 0.5, 'endcard-B-final.png')
grab(first[3] + 0.4, 'frame-B-final-badge.png')
print('text', [round(x, 2) for x in tt], 'chapters', {k: round(v, 2) for k, v in first.items()})
