#!/usr/bin/env python3
"""4차 B안 최종본 컷 목록 — python3 tools/promo/cuts/v4/make_final.py → v4-shorts-60s-B-final.json
사용자 결정(11-07): 전환 띠 없는 B-codex가 기준(-tr 폐기) · 글귀 「메이플 그림체 핵앤슬래시」→「메이플 핵앤슬래쉬」(copy.json ad3b)
· 본편 내내 검색 배지 줄(아웃트로와 같은 구성: 배지 폭 80 + 「메이플스토리 월드에서 검색」 Regular 39 흰 190)을 가로 가운데로 고정.

배지 줄 자리 (B 레이아웃: videoTop 380 · scale 2 · 아래 검정 띠 y 1600~1920(위 60px 페이드) · 브랜드 줄 cy 1718(Bold 50, 글자 y≈1698~1742)):
  · 브랜드 줄 위(y 1640~1693)는 57px뿐이고, 「스킬 추천 — 고르기」 판(y≈1540~1636)이 본편 표본 30장 중 13장에 떠서 80px 배지가 들어갈 수 없음.
  · 그래서 브랜드 줄 바로 아래 cy 1810(배지 실제 그림 y 1784~1835) — 이 자리는 원래 띠 아래로 흐리게 비치던 HUD 메뉴 이름 줄(y≈1790~1820)·
    단축칸 숫자(y≈1855~1880)뿐이라, 배지 줄 뒤에 y 1760부터 검정 판(알파 210, 위 24px 페이드)을 한 겹 더 깔아 HUD 글자를 지우고 그 위에 얹음
    (게임 글자와 겹쳐 보이는 곳 없음 · 브랜드 줄과 간격 ≈42px).
  · 가로 가운데: 배지 PNG(300) 실제 그림 x 56~248 → 폭 80일 때 왼쪽 여백 15·그림 51 / 글자 폭 428 · 배지-글자 간격은 아웃트로와 같은 26(그림 끝~글자 시작)
    → 보이는 묶음 287~793(가운데 540) = 배지 cx 312, 글자 x 364.
"""
import json, os, copy
HERE = os.path.dirname(os.path.abspath(__file__))
EV = 'docs/evidence/2026-11-07-marketing-video-shorts-v4'
CX = 'assets/codex-promo-shorts-v1'
s = copy.deepcopy(json.load(open(os.path.join(HERE, 'v4-shorts-60s-B-codex.json'))))
s['id'] = 'v4-shorts-60s-B-final'
s['copySet'] = 'ad3b'
for it in s['endCard']['items']:
    if it['type'] == 'text' and it['text'] == '메이플 그림체 핵앤슬래시':
        it['text'] = '메이플 핵앤슬래쉬'
assert any(it.get('text') == '메이플 핵앤슬래쉬' for it in s['endCard']['items'])
ROW_Y = 1810
s['baseItems'] = [
    {'type': 'rect', 'x': 0, 'y': 1760, 'w': 1080, 'h': 160, 'color': [0, 0, 0, 210], 'fade_top': 24},
    {'type': 'image', 'path': f'{CX}/badge-search-300.png', 'cx': 312, 'cy': ROW_Y, 'w': 80},
    {'type': 'text', 'text': '메이플스토리 월드에서 검색', 'align': 'left', 'x': 364, 'cy': ROW_Y, 'size': 39, 'weight': 'Regular', 'max_w': 760,
     'color': [255, 255, 255, 190]},
]
s['contact'] = f'{EV}/contact-{s["id"]}.jpg'
s['out'] = f'assets/maple_maketing_video/out/{s["id"]}.mp4'
keys = ['id'] + [k for k in s if k != 'id']
json.dump({k: s[k] for k in keys}, open(os.path.join(HERE, s['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print('ok', s['id'])
