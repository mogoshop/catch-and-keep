#!/usr/bin/env python3
"""3차(v3) 컷 목록 생성기 — python3 tools/promo/cuts/v3/make.py → 같은 폴더에 v3-*.json 11개.
play.mp4(실제 파티 사냥 · HUD 켜짐)가 주재료, rec/는 거인·습격·보스·결산 보조컷.
세로: 540×960 크롭을 정확히 2배(1080×1920 전체 화면) · 파티 목록·미니맵은 크롭 밖 · 머리 위 이름표만 견본 흐림(여백 최소)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
EV = 'docs/evidence/2026-11-07-marketing-video-ads-v3'
P3 = {'x': 0, 'y': 268, 'w': 420, 'h': 42, 'note': '제3장 왼쪽 위 파티 한 줄 고정 흐림(가로만 해당)'}

def C(start, dur, note, **k):
    return {'start': start, 'dur': dur, 'note': note, **k}
def R(src, start, dur, note, afrom, **k):
    return {'src': src, 'start': start, 'dur': dur, 'note': note, 'audioFrom': {'src': 'play.mp4', 'start': afrom}, **k}

# play.mp4 컷 (세로 크롭은 캐릭터 중심 cx 960, 위에서 sy 120 → 아래 스킬 줄·단축키까지 HUD 그대로)
OPEN = C(888.0, 2.8, '14:48 난파선 해안 COMBO 15 · 검은 폭발 (가장 바쁜 혼전으로 시작)')
BOSS = C(406.0, 2.8, '6:46 보스 알하자르 + 용암 + 군단 (sy 0 = 위 보스 체력 막대 전체)', sy=0)
GATE = C(66.0, 2.4, '1:06 정예 쌍둥이 문지기 vs 군단 COMBO 4→5')
PINK = C(1117.6, 2.6, '18:37 집게 동굴 분홍 대폭발 + 군단')
SPIKE = C(256.5, 2.4, '4:16 뼈 쐐기 보라 탄 COMBO 7')
RAID = C(929.6, 2.2, '15:29 「습격 격퇴 · 20마리」')
KILL = C(422.0, 1.8, '7:02 「대사제 알하자르 처치!」 띠', cx=910,
         blur=[{'track': True, 't': 0.9, 'x': 868, 'y': 386, 'w': 64, 'h': 38, 'r': 14, 'note': '캐릭터 몸에 반쯤 가린 파티원 이름표+칭호(견본으로 못 찾음) — 추적 상자'}])
PBOARD = C(441.0, 2.3, '7:21 「퀘스트 완료」 결산 판(실제 플레이)', fit='width', box=[380, 205, 1160, 640], boxTop=560, bgBrightness=-0.3)
SOUL = C(423.5, 2.6, '7:03 「그림자 획득! 모래 미라」 보라 불꽃 (cx 910 = 「가까운 혼이 없습니다」 알림 첫 글자까지 크롭 안)', cx=910)
CRWD = C(892.0, 2.6, '14:52 난파선 혼전 COMBO 15 · 경험치 +1502')

# rec 보조컷 (무음 → play.mp4 비슷한 장면 소리를 그 길이만큼)
R_GIANT = R('rec/scene-04-golem-greatsword-take4.mp4', 2.2, 2.4, '대검 거인 일어섬(rec)', 888.0, cx=1020, sy=0)
R_RAIDW = R('rec/scene-03-raid-take4.mp4', 8.0, 2.0, '습격 첫 파도 솟아오름(rec)', 926.0, cx=930, sy=60)
R_BOARD = R('rec/scene-06-reward-gearpick-take3.mp4', 3.3, 1.8, '결산 판 카드 3장(rec)', 441.0, fit='width', box=[340, 196, 1240, 620], boxTop=600, bgBrightness=-0.3)
R_BKILL = R('rec/scene-05-boss-kill-take3.mp4', 13.6, 3.0, '보스 처치 섬광 → 「목표 달성」 → 폭발(rec)', 418.0, cx=1100, sy=0)

def vert(id_, cset, cuts, target=15, audio='game'):
    return {'id': id_, 'style': 'fixed', 'format': 'vertical', 'copy': 'tools/promo/copy-v3.json', 'copySet': cset,
            'targetDuration': target, 'transition': 0.15, 'audio': audio,
            'layout': {'videoTop': 0, 'scale': 2, 'sy': 120},
            'tagTemplates': 'tools/promo/tags-play.json', 'tagGrow': [0, 0, 0, 0], 'tagHold': 3, 'blurPad': 1, 'blurStyle': 'soft', 'tagVerify': True,
            'contact': f'{EV}/contact-{id_}.jpg', 'cuts': [dict(c) for c in cuts]}

REAL = [OPEN, BOSS, GATE, PINK, KILL, PBOARD]
MIX = [OPEN, R_GIANT, BOSS, R_RAIDW, dict(PINK, dur=2.8), R_BOARD]
specs = [
    vert('v3-real-T0', 'T0', REAL),
    vert('v3-real-T1', 'T1', REAL),
    vert('v3-real-T2', 'T2', REAL),
    vert('v3-real-T3', 'T3', [dict(OPEN, dur=3.0, cap=0), dict(SOUL, cap=1), dict(PINK, cap=2), dict(BOSS, dur=2.6, cap=2), dict(R_BKILL, cap=3)]),
    vert('v3-mix-T0', 'T0', MIX),
    vert('v3-mix-T2', 'T2', MIX),
    vert('v3-mix-T4', 'T4', MIX),
    vert('v3-real-T1-20s', 'T1', [OPEN, BOSS, GATE, SPIKE, PINK, RAID, KILL, PBOARD], target=20),
    vert('v3-real-T0-mute', 'T0', REAL, audio='none'),
]
def blur3(c):
    return dict(c, blur=[P3]) if c.get('start', 0) >= 880 and 'src' not in c else dict(c)
specs.append({'id': 'v3-trailer-mix', 'style': 'trailer', 'format': 'landscape', 'copy': 'tools/promo/copy-v3.json', 'copySet': 'TR',
    'targetDuration': 35, 'transition': 0.15, 'landscape': {'zoom': 1.6}, 'endDur': 2.0,
    'tagTemplates': 'tools/promo/tags-play.json', 'tagGrow': [0, 0, 0, 0], 'tagHold': 3, 'blurPad': 1, 'blurStyle': 'soft', 'tagVerify': True,
    'contact': f'{EV}/contact-v3-trailer-mix.jpg',
    'cuts': [blur3(c) for c in [
        dict(OPEN, dur=3.0, cx=880), dict(GATE, dur=2.8, cx=880), dict(SPIKE, dur=2.6, cx=880),
        dict(R_GIANT, dur=3.0, cx=None, sy=None, zoom=1.2), C(216.5, 3.0, '3:36 사원 3층 대혼전 COMBO 9→13', cx=880),
        C(317.0, 2.6, '5:17 리바이브 폭발', cx=880), dict(R_RAIDW, dur=2.6, cx=None, sy=None, zoom=1.0), dict(RAID, cx=880),
        C(403.0, 3.4, '6:43 보스전', cx=880), R('rec/scene-05-boss-patterns-take2.mp4', 7.0, 2.6, '보스 불꽃 고리(rec)', 406.0, zoom=1.2),
        dict(R_BKILL, dur=2.6, sy=None, zoom=1.2), dict(SOUL, dur=2.4, cx=880), dict(PINK, dur=3.0, cx=880)]]})
specs.append({'id': 'v3-loop-real', 'style': 'loop', 'format': 'landscape', 'targetDuration': 8, 'loop': {'crossfade': 1},
    'landscape': {'zoom': 1.6}, 'tagTemplates': 'tools/promo/tags-play.json', 'tagGrow': [0, 0, 0, 0], 'tagHold': 3, 'blurPad': 1, 'blurStyle': 'soft', 'tagVerify': True,
    'contact': f'{EV}/contact-v3-loop-real.jpg', 'cuts': [C(889.0, 8, '14:49 난파선 해안 혼전 8초 루프', cx=880, blur=[P3])]})
for s in specs:
    for c in s['cuts']:
        for k in [k for k, v in c.items() if v is None]: del c[k]
    json.dump(s, open(os.path.join(HERE, s['id'] + '.json'), 'w'), ensure_ascii=False, indent=2)
print(len(specs), 'specs')
