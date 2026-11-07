#!/usr/bin/env python3
"""5차 「옛날 메이플 VS 메이플 리저렉션」 비교 쇼츠 — 사전 합성 + 컷 목록 2편 생성.

  python3 tools/promo/cuts/v5/make_v5.py            # 사전 합성(rec/v5-*-pre.mp4) + JSON 두 개
  node tools/promo/build_ad.mjs tools/promo/cuts/v5/v5-compare-60s.json
  node tools/promo/build_ad.mjs tools/promo/cuts/v5/v5-compare-30s.json

재료 (assets/ — 커밋 제외)
  · 옛날: rec/v5-old-snail-take2(달팽이 처치) · take3(느릿한 노가다) — 메이플 공식 맵 「Snail Park」(000020000)을
          메이커에서 불러와 아바타 NPC(초보자 복장·몽둥이) + 달팽이(초록·파랑)로 재현해 녹화(옆보기, 줌 120)
  · 지금: play.mp4(사용자 실플레이) + rec/v5-now-mage-nova-take1(마법사 거인 화염 노바) · v5-now-melee-take2(혼전)
          · rec/scene-05-boss-patterns-take2(보스 패턴, 4차 녹화 재사용)
사전 합성 (build_ad는 컷마다 1080p 원본의 가운데 540×770 창을 2배로 키움 → 그 창 자리에 맞춰 만든다)
  · v5-old-grind-pre.mp4 : take3를 (950,575) 중심 1.25배 확대(노가다 장면을 세로 화면에서 크게)
  · v5-split-pre.mp4     : 위 옛날(take3) / 아래 지금(melee take2) 각 540×300 + 가운데 4px 줄 → 1920×1080 검정 바탕 (690,205)
레이아웃 (세로 1080×1920 · 4차 B 띠 배치)
  · 위 검정 띠 0~380: 장 라벨 — 옛날=흰색 「옛날 메이플」, 지금=노랑 「메이플 리저렉션」.
    장이 시작되면 1.2초 큰 글자(76) → 같은 자리 작은 글자(52)로 유지. 첫 장만 둘째 줄(44): 「달팽이 잡던 그 시절」 / 「지금은 군단을 이끕니다」
  · 아래 검정 띠 1600~1920(4차 B와 같은 자리 — 실플레이 화면의 스킬 막대를 가림): 검색 배지 줄(4차 아웃트로와 같은 구성)
  · 엔드카드 3초: 4차 최종본과 같은 코덱스 아웃트로(make_final.py 좌표 그대로)
"""
import json, os, subprocess, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
REC = os.path.join(ROOT, 'assets/maple_maketing_video/rec')
EV = 'docs/evidence/2026-11-07-marketing-video-compare'
CX = 'assets/codex-promo-shorts-v1'
T = 0.25          # 컷 사이 디졸브
TOP, BAND_Y = 380, 1600
WHITE, YELLOW = [255, 255, 255, 255], [255, 214, 0, 255]

def ff(args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, check=True)

def precompose(force=False):
    enc = ['-c:v', 'libx264', '-crf', '12', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-an']
    grind = os.path.join(REC, 'v5-old-grind-pre.mp4')
    if force or not os.path.exists(grind):
        # 1.25배: 1536×864 창을 (950,575) 중심으로 잘라 1920×1080으로
        ff(['-i', os.path.join(REC, 'v5-old-snail-take3.mp4'), '-vf',
            'crop=1536:864:182:143,scale=1920:1080:flags=lanczos,fps=30', *enc, grind])
    split = os.path.join(REC, 'v5-split-pre.mp4')
    if force or not os.path.exists(split):
        ff(['-ss', '1.6', '-t', '3.6', '-i', os.path.join(REC, 'v5-old-snail-take3.mp4'),
            '-ss', '13.4', '-t', '3.6', '-i', os.path.join(REC, 'v5-now-melee-take2.mp4'),
            '-filter_complex',
            '[0:v]crop=540:300:681:345,setpts=PTS-STARTPTS[a];'
            '[1:v]crop=540:300:630:210,setpts=PTS-STARTPTS[b];'
            'color=c=white:s=540x4:r=30:d=3.6[l];'
            '[a][l][b]vstack=inputs=3[s];'
            'color=c=black:s=1920x1080:r=30:d=3.6[bg];'
            '[bg][s]overlay=690:205:shortest=1,fps=30[v]', '-map', '[v]', '-t', '3.6', *enc, split])

def label(name, text, color, big, sub=None):
    items = [{'type': 'text', 'text': text, 'cx': 540, 'cy': 175 if sub else 195, 'size': 76 if big else 52,
              'weight': 'ExtraBold', 'max_w': 1000, 'color': color, 'stroke': 3, 'stroke_color': [0, 0, 0, 200]}]
    if sub:
        items.append({'type': 'text', 'text': sub, 'cx': 540, 'cy': 285, 'size': 44, 'weight': 'Bold', 'max_w': 1000,
                      'color': [255, 255, 255, 230]})
    return {'name': name, 'items': items}

def base_items():
    row = 1760
    return [
        {'type': 'rect', 'x': 0, 'y': 0, 'w': 1080, 'h': TOP, 'color': [0, 0, 0, 255]},
        {'type': 'rect', 'x': 0, 'y': BAND_Y, 'w': 1080, 'h': 1920 - BAND_Y, 'color': [0, 0, 0, 235], 'fade_top': 40},
        {'type': 'image', 'path': f'{CX}/badge-search-300.png', 'cx': 312, 'cy': row, 'w': 80},
        {'type': 'text', 'text': '메이플스토리 월드에서 검색', 'align': 'left', 'x': 364, 'cy': row, 'size': 39,
         'weight': 'Regular', 'max_w': 760, 'color': [255, 255, 255, 190]},
    ]

def end_card():
    return {'bg': [8, 6, 12, 255], 'items': [
        {'type': 'image', 'path': f'{CX}/outro-1080x1920.png', 'cx': 540, 'cy': 960, 'w': 1080},
        {'type': 'image', 'path': f'{CX}/logo-maple-resurrection-900.png', 'cx': 540, 'cy': 880, 'w': 900},
        {'type': 'text', 'text': '메이플 핵앤슬래쉬', 'cx': 540, 'cy': 1330, 'size': 46, 'weight': 'Regular', 'max_w': 900,
         'color': [255, 255, 255, 190]},
        {'type': 'image', 'path': f'{CX}/badge-search-300.png', 'cx': 220, 'cy': 1430, 'w': 80},
        {'type': 'text', 'text': '메이플스토리 월드에서 검색', 'align': 'left', 'x': 272, 'cy': 1430, 'size': 39,
         'weight': 'Regular', 'max_w': 760, 'color': [255, 255, 255, 190]}]}

OLD_AUDIO = {'src': 'play.mp4', 'start': 760.0, 'gain': -8}   # 12:40 항구 창고 앞 대기(조용한 마을 소리)

def build(spec_id, cuts, sections, split_tags=None):
    """sections: [(시작 컷 번호, 끝 컷 번호(포함), 'old'|'now', 첫 장인가)] → 라벨 timeline"""
    starts, acc = [], 0.0
    for c in cuts:
        starts.append(acc); acc += c['dur'] - T
    main_end = acc + T            # 마지막 컷 끝(엔드카드 디졸브 전)
    tl = [{'name': 'bands', 'items': base_items(), 'from': 0, 'to': 0, 'fade': 0.01}]
    for k, (a, b, kind, first) in enumerate(sections):
        t0 = starts[a] + (T / 2 if a > 0 else 0)
        t1 = starts[b] + cuts[b]['dur'] - (T / 2 if b < len(cuts) - 1 else 0.3)   # 마지막 장 = 엔드카드 디졸브(0.3) 전에 끈다
        txt, col = ('옛날 메이플', WHITE) if kind == 'old' else ('메이플 리저렉션', YELLOW)
        sub = ('달팽이 잡던 그 시절' if kind == 'old' else '지금은 군단을 이끕니다') if first else None
        big = label(f'{kind}{k}-big', txt, col, True, sub)
        big.update({'from': round(t0, 3), 'to': round(min(t1, t0 + 1.4), 3), 'fadeIn': 0.15, 'fadeOut': 0.15})
        tl.append(big)
        if t1 - t0 > 1.6:
            small = label(f'{kind}{k}-small', txt, col, False, sub)
            small.update({'from': round(t0 + 1.25, 3), 'to': round(t1, 3), 'fadeIn': 0.15, 'fadeOut': 0.15})
            tl.append(small)
    if split_tags is not None:
        i = split_tags
        t0, t1 = starts[i] + T / 2, starts[i] + cuts[i]['dur'] - T / 2
        tl.append({'name': 'split', 'from': round(t0, 3), 'to': round(t1, 3), 'fadeIn': 0.12, 'fadeOut': 0.12, 'items': [
            {'type': 'rect', 'x': 0, 'y': 0, 'w': 1080, 'h': TOP, 'color': [0, 0, 0, 255]},
            {'type': 'text', 'text': '옛날 메이플', 'cx': 540, 'cy': 150, 'size': 64, 'weight': 'ExtraBold', 'max_w': 1000, 'color': WHITE},
            {'type': 'text', 'text': '메이플 리저렉션', 'cx': 540, 'cy': 262, 'size': 64, 'weight': 'ExtraBold', 'max_w': 1000, 'color': YELLOW},
            {'type': 'text', 'text': '옛날 메이플', 'align': 'left', 'x': 36, 'cy': TOP + 52, 'size': 38, 'weight': 'Bold', 'max_w': 600,
             'color': WHITE, 'pill': {'pad_x': 18, 'pad_y': 8, 'color': [0, 0, 0, 150], 'radius': 12}},
            {'type': 'text', 'text': '메이플 리저렉션', 'align': 'left', 'x': 36, 'cy': TOP + 2 * 304 + 52, 'size': 38, 'weight': 'Bold', 'max_w': 600,
             'color': YELLOW, 'pill': {'pad_x': 18, 'pad_y': 8, 'color': [0, 0, 0, 150], 'radius': 12}}]})
    total = main_end + 3.0 - 0.3
    spec = {'id': spec_id, 'style': 'fixed', 'format': 'vertical', 'transition': T, 'endTransition': 0.3, 'audio': 'game',
            'endDur': 3.0, 'noCaptions': True, 'layout': {'videoTop': TOP, 'scale': 2, 'sy': 205},
            'endCard': end_card(), 'timeline': tl, 'cuts': cuts,
            'contact': f'{EV}/contact-{spec_id}.jpg', 'out': f'assets/maple_maketing_video/out/{spec_id}.mp4',
            'plannedDuration': round(total, 2)}
    # 띠 판: to 0 = 엔드카드 시작까지(본편 내내)
    json.dump(spec, open(os.path.join(HERE, spec_id + '.json'), 'w'), ensure_ascii=False, indent=2)
    print('ok', spec_id, 'cuts', len(cuts), 'planned', round(total, 2), 's')
    return spec

def rec(src, start, dur, note, audio, **kw):
    c = {'src': f'rec/{src}', 'start': start, 'dur': dur, 'note': note, 'audioFrom': audio}
    c.update(kw); return c

def play(start, dur, note, **kw):
    c = {'start': start, 'dur': dur, 'note': note}; c.update(kw); return c

def main():
    precompose()
    A_COMBAT = {'src': 'play.mp4', 'start': 887.3, 'gain': -2}
    A_PINK = {'src': 'play.mp4', 'start': 1117.6, 'gain': -2}
    A_BOSS = {'src': 'play.mp4', 'start': 401.0, 'gain': -2}
    c60 = [
        rec('v5-old-snail-take2.mp4', 0.8, 7.8, '옛날 (a) 초보자가 달팽이 쪽으로 걸어가 몽둥이로 3번 → 초록 달팽이 처치(5.3) → 파란 달팽이로', OLD_AUDIO, cx=930),
        play(887.3, 3.6, '지금 14:47 난파선 해안 COMBO 14→15 · 검은 폭발'),
        rec('v5-now-melee-take2.mp4', 13.2, 4.6, '지금 (d) 메이커 혼전 — 해골 군단·뼈 쐐기·본 노바 COMBO 15→32', A_COMBAT, cx=900, sy=80),
        play(1117.6, 3.2, '지금 18:37 집게 동굴 분홍 대폭발 + 군단'),
        rec('v5-split-pre.mp4', 0, 3.6, '분할 화면 — 위 옛날(노가다 take3 1.6s~) / 아래 지금(혼전 take2 13.4s~)', OLD_AUDIO),
        rec('v5-old-grind-pre.mp4', 1.2, 6.4, '옛날 (b) 달팽이 셋 사이 느릿한 노가다 — 6 · MISS · 7 · 돌아서 5 (take3 ×1.25)', OLD_AUDIO),
        rec('v5-now-mage-nova-take1.mp4', 15.6, 6.0, '지금 (c) 해골 마법사 5기 → 마법사 거인 · 19.4 화염 노바 대폭발', A_PINK, cx=990, sy=60),
        play(25.4, 3.0, '지금 0:25 잊힌 사원 「E 그림자 추출」 → 보라 혼불 솟음 → 군단 합류'),
        play(317.0, 3.2, '지금 5:17 리바이브 큰 폭발 + 군단 돌진', sy=210),
        play(406.5, 2.6, '지금 6:46 보스방 대각선 섬광', sy=0),
        play(398.5, 3.0, '지금 6:38 보스 + 용암 + 군단', sy=0),
        play(211.0, 3.4, '지금 3:31 잊힌 사원 대혼전 — 군단으로 마무리', sy=210),
    ]
    build('v5-compare-60s', c60, [(0, 0, 'old', True), (1, 3, 'now', True), (5, 5, 'old', False), (6, 11, 'now', False)], split_tags=4)
    c30 = [
        rec('v5-old-snail-take2.mp4', 1.8, 6.2, '옛날 — 몽둥이로 달팽이 처치(5.3) → 다음 달팽이', OLD_AUDIO, cx=930),
        rec('v5-now-melee-take2.mp4', 13.6, 4.2, '지금 — 혼전 COMBO 15→32', A_COMBAT, cx=900, sy=80),
        play(887.3, 3.0, '지금 14:47 COMBO 15'),
        rec('v5-now-mage-nova-take1.mp4', 17.0, 4.6, '지금 — 마법사 거인 화염 노바(19.4)', A_PINK, cx=990, sy=60),
        play(1117.6, 3.0, '지금 18:37 분홍 대폭발'),
        play(398.5, 3.0, '지금 6:38 보스 + 용암 + 군단', sy=0),
        play(317.0, 3.0, '지금 5:17 리바이브 + 군단 돌진', sy=210),
    ]
    build('v5-compare-30s', c30, [(0, 0, 'old', True), (1, 6, 'now', True)])

if __name__ == '__main__':
    main()
