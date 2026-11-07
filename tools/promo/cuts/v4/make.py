#!/usr/bin/env python3
"""4차(v4) 세로 쇼츠 60초 컷 목록 생성기 — python3 tools/promo/cuts/v4/make.py → v4-shorts-60s-A.json · -B.json
사용자 결정(11-07): 글귀 = copy.json ad3 · 흐름 = 1차 2안(몹 잡고 → 혼 뽑고 → 해골 깔고 → 템 줍고 → 보스) · 재료 play.mp4만 ·
장면 자막 없음 · 이름 흐림 없음(tagTemplates 안 씀) · 55~62초.
A = 3차 글자(흰색·얇은 그림자·띠 없음): 훅 2줄은 첫 5초 + 엔드카드 직전 5초 위쪽 가운데, 브랜드 줄은 왼쪽 아래 44px 내내.
B = 같은 컷, 1차 글자(v1-ad3-fixed: 위 검정 띠 훅 고정 · 노랑 둘째 줄 · 아래 띠 브랜드 줄) — 1차 배치라 영상은 y 380부터.
엔드카드 2.5초 = 월드 썸네일의 붓글씨 로고(logo_ink.py로 투명화) + 「메이플 그림체 핵앤슬래시」.
다시 만들기:
  python3 tools/promo/cuts/v4/logo_ink.py assets/maple_maketing_video/out/work/v4-logo-ink.png
  python3 tools/promo/cuts/v4/make.py
  node tools/promo/build_ad.mjs tools/promo/cuts/v4/v4-shorts-60s-A.json
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
EV = 'docs/evidence/2026-11-07-marketing-video-shorts-v4'
LOGO = 'assets/maple_maketing_video/out/work/v4-logo-ink.png'

def C(ch, start, dur, note, **k):
    return {'ch': ch, 'start': start, 'dur': dur, 'note': note, **k}

# sy: 세로 크롭 시작 높이(원본 1080 기준). 기본 120 = 아래 스킬 줄·단축키까지.
# tut=True: 위 안내 글줄(「…를 배우면 추출한 그림자를 곁에 세울…」, 원본 y 160~195)이 걸리는 컷 → A는 sy 0(글줄 통째), B는 sy 210(글줄 밖 — 원본 글줄은 y 160~195).
CUTS = [
    # 1장 몹 잡고 — 콤보가 오르는 혼전
    C(1, 887.3, 4.6, '14:47 난파선 해안 COMBO 14→15 · 검은 폭발 (14:47 전은 위 안내 글줄이 반쯤 잘려 뺌)'),
    C(1, 891.9, 2.8, '14:51 난파선 혼전 COMBO 15 · 정예 · 데미지 숫자'),
    C(1, 66.0, 3.0, '1:06 정예 「회상의 쌍둥이 문지기」 vs 군단 COMBO 4→5'),
    C(1, 258.0, 2.8, '4:18 뼈 쐐기 보라 탄 부채꼴 COMBO 7'),
    # 2장 혼 뽑고 — 그림자 추출
    C(2, 25.4, 4.8, '0:25 잊힌 사원 「E 그림자 추출」 → 보라 혼불 솟음 → 군단 합류 · Lv 22'),
    C(2, 872.8, 2.6, '14:33 난파선 해안 「E 그림자 추출」 → 보라 혼불 솟음'),
    C(2, 424.0, 2.6, '7:04 「그림자 획득! 모래 미라」 연속 추출 · 보라 불꽃 (7:06.7부터 「추출 실패」 글이 떠서 그 전까지)', cx=910),
    # 3장 해골 깔고 — 군단이 쓸어 담는 장면
    C(3, 1117.6, 3.2, '18:37 집게 동굴 분홍 대폭발 + 군단'),
    C(3, 317.0, 3.2, '5:17 리바이브 큰 폭발 + 군단 돌진', tut=True),
    C(3, 936.0, 3.0, '15:36 「해골 회오리」 소용돌이 COMBO 4'),
    C(3, 211.0, 3.0, '3:31 잊힌 사원 대혼전 COMBO 2→6', tut=True),
    # 4장 템 줍고 — 골드·상자·습격 보상
    C(4, 11.3, 2.6, '0:11 「습격 격퇴 · 24마리」 · 골드 주머니 164 골드'),
    C(4, 215.6, 3.2, '3:35 금화 더미 · 골드 +316', tut=True),
    C(4, 1338.8, 2.7, '22:18 얕은 물 지대 봉인 상자 열기 · 금화', cx=900),
    C(4, 929.4, 2.6, '15:29 「습격 격퇴 · 20마리」 · 골드 주머니 212 골드'),
    # 5장 보스 → 처치 → 결산
    C(5, 401.0, 3.2, '6:41 보스 대사제 알하자르 Lv21 + 용암 + 군단', sy=0),
    C(5, 406.5, 2.6, '6:46 보스방 대각선 섬광', sy=0),
    C(5, 421.8, 2.0, '7:02 「대사제 알하자르 처치!」 띠', cx=910),
    C(5, 418.6, 2.6, '6:58 「목표 달성」 배너 (처치 띠 뒤로 순서 바꿈 — 마지막 5초 훅이 처치 띠 아랫줄과 겹쳐서)', sy=0),
    C(5, 441.0, 2.4, '7:21 「퀘스트 완료」 결산 판 (마지막 컷 — 길이는 targetDuration으로 자동, 판은 7:23.9까지만)', fit='width', box=[380, 205, 1160, 640], boxTop=560, bgBrightness=-0.3),
]

SH = {'dx': 0, 'dy': 2, 'blur': 3, 'spread': 2, 'color': [0, 0, 0, 190]}
PILL = {'pad_x': 18, 'pad_y': 8, 'color': [0, 0, 0, 56], 'radius': 12}
def t(text, cy, size, weight='SemiBold', **k):
    it = {'type': 'text', 'text': text, 'size': size, 'weight': weight, 'max_w': 952, 'color': [255, 255, 255, 240], 'shadow': SH, 'pill': PILL, 'cy': cy}
    if k.get('left'):
        it.update(align='left', x=72)
    else:
        it['cx'] = 540
    return it

HOOK = ['그 시절 네크로맨서 키우던 거 기억나세요?', '해골 끌고 템 줍던 그 느낌 그대로']
BRAND = '메이플 그림체 핵앤슬래시 — 메이플 리저렉션'
# 훅: 위쪽 가운데 y 170·242 — 첫 컷(14:47) COMBO 숫자(y 340~480)보다 위, 마지막 5초(6:58 목표 달성 배너 y ~460 · 결산 판 y 560~)보다 위.
# 첫 훅은 첫 컷 안에서만(4.4초) — 둘째 컷(14:51)은 COMBO·경험치 줄이 y ~160에 있어서.
HOOK_ITEMS = [t(HOOK[0], 170, 48), t(HOOK[1], 242, 48)]
BRAND_ITEMS = [t(BRAND, 1220, 44, left=True)]
# 브랜드 줄: 내내 켜 두면 sy 0 컷(5:17·3:31·3:35)에서 「E 그림자 추출」 안내와 겹쳐서 → 첫 5초 · 장이 바뀔 때마다 3초 · 마지막 5초
CH_START = [i for i, c in enumerate(CUTS) if i and c['ch'] != CUTS[i - 1]['ch']]
TIMELINE_A = [
    {'name': 'brand', 'from': 0, 'to': 4.4, 'fade': 0.3, 'items': BRAND_ITEMS},
    *[{'name': 'brand', 'atCut': k, 'from': 0.1, 'dur': 3.0, 'fade': 0.3, 'items': BRAND_ITEMS} for k in CH_START],
    {'name': 'brand', 'from': -5.0, 'to': 0, 'fade': 0.3, 'items': BRAND_ITEMS},
    {'name': 'hook-open', 'from': 0, 'to': 4.4, 'fade': 0.3, 'items': HOOK_ITEMS},
    {'name': 'hook-end', 'from': -5.0, 'to': 0, 'fade': 0.3, 'items': HOOK_ITEMS},
]
END = {'bg': [8, 6, 12, 255], 'items': [
    {'type': 'image', 'path': LOGO, 'cx': 540, 'cy': 880, 'w': 897},
    {'type': 'text', 'text': '메이플 그림체 핵앤슬래시', 'cx': 540, 'cy': 1330, 'size': 46, 'weight': 'Regular', 'max_w': 900, 'color': [255, 255, 255, 190]},
]}

def spec(id_, variant):
    cuts = []
    for c in CUTS:
        c = dict(c)
        tut = c.pop('tut', False)
        if tut:
            c['sy'] = 0 if variant == 'A' else 210
        cuts.append(c)
    s = {'id': id_, 'style': 'fixed', 'format': 'vertical', 'targetDuration': 59.5, 'transition': 0.15, 'audio': 'game',
         'endDur': 2.5, 'endCard': END, 'noCaptions': True, 'contact': f'{EV}/contact-{id_}.jpg', 'out': f'assets/maple_maketing_video/out/{id_}.mp4'}
    if variant == 'A':
        s.update(layout={'videoTop': 0, 'scale': 2, 'sy': 120}, timeline=TIMELINE_A)
    else:
        s.update(copy='tools/promo/copy.json', copySet='ad3', layout={'videoTop': 380, 'scale': 2, 'sy': 205})
    s['cuts'] = cuts
    return s

for v in 'AB':
    s = spec(f'v4-shorts-60s-{v}', v)
    json.dump(s, open(os.path.join(HERE, s['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print('2 specs', sum(c['dur'] for c in CUTS[:-1]), '초 + 마지막 컷 자동')
