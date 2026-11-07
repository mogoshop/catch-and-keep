#!/usr/bin/env python3
"""4차 B안 최종본 컷 목록 — python3 tools/promo/cuts/v4/make_final.py → v4-shorts-60s-B-final.json
사용자 결정(11-07): 전환 띠 없는 B-codex가 기준(-tr 폐기) · 글귀 「메이플 그림체 핵앤슬래시」→「메이플 핵앤슬래쉬」(copy.json ad3b)
· 본편 내내 검색 배지 줄(아웃트로와 같은 구성: 배지 폭 80 + 「메이플스토리 월드에서 검색」 Regular 39 흰 190)을 가로 가운데로 고정.

배지 줄 자리 (11-07 사용자가 짚은 곳 = 게임 화면 맨 아래 바닥, 「스킬 추천 — 고르기」 판(y≈1540~1636)보다 위):
  · 세로 중심 y 1475(배지 80 → y 1435~1515), 가로 가운데 — 배지 PNG(300) 실제 그림 x 56~248 → 폭 80일 때 왼쪽 여백 15·그림 51 / 글자 폭 428
    · 배지-글자 간격은 아웃트로와 같은 26 → 보이는 묶음 287~793(가운데 540) = 배지 cx 312, 글자 x 364.
  · 바닥 그림이 비치므로 줄 뒤에 옅은 검정 알약(알파 100, x 263~817 · y 1445~1505, 둥근 30).
  · 1460까지 올려도 아래 겹침(5장 안내 알림 띠 y≈1404~1520)은 그대로라 1475 유지(README 최종본 절).
  · 마지막 결산 판 컷은 boxTop 560→460으로 올려 「받기/확인」 단추(원래 y≈1430~1480)가 배지 줄 위로 가게 함(판 y 840~1436).
  · 이전 배치(브랜드 줄 아래 y 1810 + HUD 가림 판)는 v4-shorts-60s-B-final-alt.mp4로만 보존(컷 목록 없음).
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
ROW_Y = 1475
s['baseItems'] = [
    {'type': 'rect', 'x': 263, 'y': ROW_Y - 30, 'w': 554, 'h': 60, 'color': [0, 0, 0, 100], 'radius': 30},
    {'type': 'image', 'path': f'{CX}/badge-search-300.png', 'cx': 312, 'cy': ROW_Y, 'w': 80},
    {'type': 'text', 'text': '메이플스토리 월드에서 검색', 'align': 'left', 'x': 364, 'cy': ROW_Y, 'size': 39, 'weight': 'Regular', 'max_w': 760,
     'color': [255, 255, 255, 190]},
]
assert s['cuts'][-1].get('fit') == 'width'
s['cuts'][-1]['boxTop'] = 460
# 5장 안내 알림 띠가 배지 줄 자리(y≈1400~1495)에 걸리는 컷 2개:
#  · 컷 16(6:41 보스): 알림 「…물약은 15개까지…」가 6:42.0부터 뜸 → 같은 3.2초를 6:38.5~6:41.7로 당김(용암·군단 → 보스 체력판 등장, 알림 전)
#    (sy만 올리면 알림 아래 「E 그림자 추출」(y≈1535~1575)이 배지 줄로 올라오고 보스 체력판 머리가 잘림)
#  · 컷 19(6:58 목표 달성): 처치 알림 두 줄(y≈1350~1495) → sy 0→28(화면 56px 위로, 알림 끝 y≈1439 · 위쪽 몬스터 체력판 끝만 조금 잘림)
c15, c18 = s['cuts'][15], s['cuts'][18]
assert c15['start'] == 401.0 and c18['start'] == 418.6
c15['start'] = 398.5; c15['note'] += ' · 최종본: 6:42 물약 알림이 배지 줄과 겹쳐 6:38.5로 당김'
c18['sy'] = 28; c18['note'] += ' · 최종본: 처치 알림이 배지 줄과 겹쳐 sy 28'
s['contact'] = f'{EV}/contact-{s["id"]}.jpg'
s['out'] = f'assets/maple_maketing_video/out/{s["id"]}.mp4'
keys = ['id'] + [k for k in s if k != 'id']
json.dump({k: s[k] for k in keys}, open(os.path.join(HERE, s['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print('ok', s['id'])
