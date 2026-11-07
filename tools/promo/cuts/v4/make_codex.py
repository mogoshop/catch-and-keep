#!/usr/bin/env python3
"""4차 B안 + 코덱스 레이어(assets/codex-promo-shorts-v1) 최종 후보 2편 컷 목록 — python3 tools/promo/cuts/v4/make_codex.py
B안(v4-shorts-60s-B.json)의 컷·글자를 그대로 두고:
  · 엔드카드 = 코덱스 아웃트로 판(1080×1920 불투명) + 로고 900px(중심 540,880) + 부제 46px(540,1330, B와 같은 글꼴·색)
    + 검색 배지 80px(중심 220,1430) + 오른쪽 「메이플스토리 월드에서 검색」 39px(배지와 세로 중심 맞춤) · 3.0초 · 본편→엔드카드 디졸브 0.3초
  · -tr: 장 경계 4곳(2·3·4·5장 시작)에 혼불 띠 transition-soul.png 0.6초(등장 0.1 / 유지 0.36 / 소멸 0.14)
    위치 중심 y 580(코덱스 제안 720에서 위로): 띠 실제 그림 y 441~729 — B 위 띠(0~380) 아래, 화면 가운데 캐릭터(머리 y≈790~)를 피함.
    시각: 경계 0.2초 전 등장 → 컷 디졸브(0.15초)가 유지 구간 안에 들어감.
  · 총 길이 targetDuration 59.85 — 엔드카드 +0.5초 · 엔드 디졸브 겹침 +0.15초를 더해도 마지막 결산 컷은 B와 같은 2.9초(판이 7:23.9까지라 상한).
"""
import json, os, copy
HERE = os.path.dirname(os.path.abspath(__file__))
EV = 'docs/evidence/2026-11-07-marketing-video-shorts-v4'
CX = 'assets/codex-promo-shorts-v1'
B = json.load(open(os.path.join(HERE, 'v4-shorts-60s-B.json')))
SUB = next(it for it in B['endCard']['items'] if it['type'] == 'text')  # B 부제(Regular 46 · 흰 190)

END = {'bg': [8, 6, 12, 255], 'items': [
    {'type': 'image', 'path': f'{CX}/outro-1080x1920.png', 'cx': 540, 'cy': 960, 'w': 1080},
    {'type': 'image', 'path': f'{CX}/logo-maple-resurrection-900.png', 'cx': 540, 'cy': 880, 'w': 900},
    dict(SUB),
    {'type': 'image', 'path': f'{CX}/badge-search-300.png', 'cx': 220, 'cy': 1430, 'w': 80},
    {'type': 'text', 'text': '메이플스토리 월드에서 검색', 'align': 'left', 'x': 272, 'cy': 1430, 'size': 39, 'weight': 'Regular', 'max_w': 760,
     'color': [255, 255, 255, 190]},
]}
CH_START = [i for i, c in enumerate(B['cuts']) if i and c['ch'] != B['cuts'][i - 1]['ch']]
BAND = [{'type': 'image', 'path': f'{CX}/transition-soul.png', 'cx': 540, 'cy': 580, 'w': 1000}]
TL = [{'name': 'soul', 'atCut': k, 'from': -0.2, 'dur': 0.6, 'fadeIn': 0.1, 'fadeOut': 0.14, 'items': BAND} for k in CH_START]

for sfx, tl in [('', None), ('-tr', TL)]:
    s = copy.deepcopy(B)
    s['id'] = f'v4-shorts-60s-B-codex{sfx}'
    s.update(targetDuration=59.85, endDur=3.0, endTransition=0.3, endCard=END,
             contact=f'{EV}/contact-{s["id"]}.jpg', out=f'assets/maple_maketing_video/out/{s["id"]}.mp4')
    if tl: s['timeline'] = tl
    s['cuts'][-1].pop('dur', None); s['cuts'][-1]['dur'] = 2.4  # targetDuration으로 자동
    keys = ['id'] + [k for k in s if k != 'id']
    json.dump({k: s[k] for k in keys}, open(os.path.join(HERE, s['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print('2 specs · 장 경계 컷', CH_START)
