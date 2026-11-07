#!/usr/bin/env python3
"""4차 접촉판 — python3 tools/promo/cuts/v4/sheets.py v4-shorts-60s-A
① contact-<id>-cuts.jpg: 컷마다 가운데 한 장 + 엔드카드(라벨 = 장·play 시각) ② contact-<id>-text.jpg: 글자가 읽히는 크기(540폭)로 훅·브랜드·엔드카드 시각."""
import json, os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
id_ = sys.argv[1]
spec = json.load(open(os.path.join(ROOT, 'tools/promo/cuts/v4', id_ + '.json')))
summ = json.load(open(os.path.join(ROOT, 'assets/maple_maketing_video/out/work', id_, 'summary.json')))
T = spec['transition']; video = os.path.join(ROOT, summ['out']); ev = os.path.dirname(os.path.join(ROOT, spec['contact']))
t0, times, labels = 0.0, [], []
for c, s in zip(spec['cuts'], summ['cuts']):
    times.append(t0 + s['dur'] / 2)
    m, sec = divmod(c['start'], 60)
    labels.append(f"{c['ch']}장 {int(m)}:{sec:04.1f}")
    t0 += s['dur'] - T
times.append(summ['duration'] - 0.6); labels.append('엔드카드')
py = os.path.join(ROOT, 'tools/promo/contact.py')
subprocess.run(['python3', py, '--video', video, '--out', os.path.join(ev, f'contact-{id_}-cuts.jpg'), '--times', ','.join(f'{x:.2f}' for x in times),
                '--labels', ','.join(labels), '--cols', '11', '--cell-w', '270'], check=True)
tl = {x['name']: x['at'] for x in summ.get('timeline', [])}
tt = [2.5, 8.0, 30.0]
if 'hook-end' in tl: tt.append(tl['hook-end'][0] + 2.5)
else: tt.append(summ['duration'] - 5.0)
tt.append(summ['duration'] - 0.6)
subprocess.run(['python3', py, '--video', video, '--out', os.path.join(ev, f'contact-{id_}-text.jpg'), '--times', ','.join(f'{x:.2f}' for x in tt),
                '--cols', '5', '--cell-w', '540'], check=True)
