import os, json
from PIL import Image, ImageDraw, ImageFont
R = "/Users/leeinguk/Desktop/hoho/잡으면 내편"
A = R + "/assets/claude-scene-plate-wasteland-20261102"; REF = R + "/docs/design/53-scene-plate/refs"
S = "/private/tmp/claude-502/-Users-leeinguk-Desktop-hoho-------/996d49f7-49cf-4627-8ae2-6c4e2c8354ba/scratchpad"
P62, P75 = S + "/plate-pp/png", S + "/plate-pp-075/png"
M62 = json.load(open(S + "/plate-pp/metrics-before-after.json")); M75 = json.load(open(S + "/plate-pp-075/metrics-before-after.json"))
EV = R + "/docs/evidence"; OUTD = EV + "/2026-11-02-sample-plate-room-sat075"
f = lambda s: ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", s)
F, Fs = f(26), f(19)
TXT, SUB = (235, 225, 200), (170, 168, 155)
def tile(img, w, h):
    t = Image.open(img).convert("RGB"); o = Image.new("RGB", (w, h))
    for y in range(0, h, t.height):
        for x in range(0, w, t.width): o.paste(t, (x, y))
    return o
def ms(d): return f"채도 {d['sat']:.3f} · 밝기 {d['lum']:.3f} · 잔결 {d['hf_share']:.3f}"

# ---- 1) 소스 비교판 0.62 | 0.75 | 원본
Wd = 2000; cv = Image.new("RGB", (Wd, 2400), (18, 17, 22)); d = ImageDraw.Draw(cv); y = 12
d.text((16, y), "황무지 장면판 후처리 A — 채도 계수 0.62 대 0.75 (명암 0.78 등 나머지 동일) · 원본·타일 참조", fill=TXT, font=F); y += 44
fl = [("채도 0.62", Image.open(P62 + "/plate-floor.png").convert("RGB"), M62["plate-floor.png"]["after"]),
      ("채도 0.75", Image.open(P75 + "/plate-floor.png").convert("RGB"), M75["plate-floor.png"]["after"]),
      ("원본 (후처리 전)", Image.open(A + "/plate-floor.png").convert("RGB"), M75["plate-floor.png"]["before"])]
cw = 662
for i, (lab, im, m) in enumerate(fl):
    x = 8 + i * (cw + 4)
    d.text((x, y), f"바닥판 {lab} (2000×1000 → ½)", fill=TXT, font=Fs); d.text((x, y + 24), ms(m), fill=SUB, font=Fs)
    cv.paste(im.resize((cw, 331), Image.BOX), (x, y + 52))
y += 52 + 331 + 20
crop = (500, 400, 900, 700)
pieces = [("길 부분 0.62 1:1", fl[0][1].crop(crop), M62["plate-floor.png#path400x300"]["after"]),
          ("길 부분 0.75 1:1", fl[1][1].crop(crop), M75["plate-floor.png#path400x300"]["after"]),
          ("타일 마른 풀 (결·색 기준)", tile(REF + "/floor-a1-dead-grass-floor.png", 400, 300), M75["TILE floor-a1-dead-grass-floor.png"]["tile"])]
for i, (lab, im, m) in enumerate(pieces):
    x = 8 + i * (cw + 4)
    d.text((x, y), lab, fill=TXT, font=Fs); d.text((x, y + 24), ms(m), fill=SUB, font=Fs)
    cv.paste(im.resize((600, 450), Image.NEAREST), (x, y + 52))
y += 52 + 450 + 24
props = ["prop-split-brown-rock.png", "prop-broken-femur.png", "prop-dead-grass-fan.png", "prop-east-signpost.png", "prop-dried-blood.png", "prop-sparse-straw.png"]
d.text((10, y), "소품 6종 — 위: 채도 0.62 / 아래: 채도 0.75 (×3 점 확대 · 마른 풀 타일 바닥 위) · 그다음 두 줄: 특징물 0.62 / 0.75 (×1)", fill=TXT, font=Fs); y += 30
pw = 330
for row, (src, M, lab) in enumerate([(P62, M62, "0.62"), (P75, M75, "0.75")]):
    for i, p in enumerate(props):
        x = 10 + i * pw; im = Image.open(src + "/" + p).convert("RGBA"); im3 = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        bg = tile(REF + "/floor-a1-dead-grass-floor.png", pw - 10, 250).convert("RGBA")
        bg.alpha_composite(im3, ((pw - 10 - im3.width) // 2, (250 - im3.height) // 2)); cv.paste(bg.convert("RGB"), (x, y))
        mm = M[p]["after"]
        d.text((x + 4, y + 2), f"{p[5:-4]} {lab}", fill=(250, 240, 210), font=Fs)
        d.text((x + 4, y + 226), f"채도 {mm['sat']:.2f} 밝기 {mm['lum']:.2f} 잔결 {mm['hf_share']:.2f}", fill=(250, 240, 210), font=Fs)
    y += 258
for src, M, lab in [(P62, M62, "0.62"), (P75, M75, "0.75")]:
    x = 10
    for p in ["feature-raven-deadtree.png", "feature-fallen-watchpost.png"]:
        im = Image.open(src + "/" + p).convert("RGBA"); bg = tile(REF + "/floor-a1-dead-grass-floor.png", im.width, im.height).convert("RGBA"); bg.alpha_composite(im)
        cv.paste(bg.convert("RGB"), (x, y)); mm = M[p]["after"]
        d.text((x + 4, y + 2), f"{p[8:-4]} {lab}", fill=(250, 240, 210), font=Fs)
        d.text((x + im.width + 8, y + 40), f"채도 {mm['sat']:.2f}\n밝기 {mm['lum']:.2f}\n잔결 {mm['hf_share']:.2f}", fill=SUB, font=Fs)
        x += im.width + 150
    y += 232
cv = cv.crop((0, 0, Wd, y + 6)); cv.save(OUTD + "/compare-sat062-vs-075.png", optimize=True); print("src", cv.size)

# ---- 2) 메이커 실촬영 공정 비교 (1920×1080 기준으로 맞춘 뒤 가운데 잘라 나란히)
RB = EV + "/2026-11-02-wasteland-plate-rollback/maker"; P1 = EV + "/2026-11-02-sample-plate-room/maker"; P2 = OUTD + "/maker"
def shot(p, box=(360, 140, 1560, 940)):
    return Image.open(p).convert("RGB").resize((1920, 1080), Image.LANCZOS).crop(box).resize((640, 427), Image.LANCZOS)
RB = EV + "/2026-11-02-roster-random-maker"
rows = [("게이트 x -30.5 · 줌 48 · 밝기 0.40", [("롤백 옛 타일 wasteland (0.40 강제)", RB + "/wasteland-0.40-gate-x-30.5-z48.png"), ("표본 방 채도 0.62", P1 + "/pc-gate-x-30.5-z60.png"), ("표본 방 채도 0.75", P2 + "/pc-gate-x-30.5-z48.png")]),
        ("입구 x -20.5 · 줌 48 · 밝기 0.40", [("롤백 옛 타일 wasteland (0.40 강제)", RB + "/wasteland-0.40-entry-x-20.5-z48.png"), ("표본 방 채도 0.62", P1 + "/pc-entry-x-20.5-z60.png"), ("표본 방 채도 0.75", P2 + "/pc-entry-x-20.5-z48.png")]),
        ("무리 x -17.5 y -2.5 · 줌 60 · 밝기 0.40 (0.62·롤백 기록이 줌 60이라 0.75도 줌 60)", [("롤백 옛 타일 wasteland (0.40 강제)", RB + "/wasteland-0.40-pack-x-17.5-y-2.5-z60.png"), ("표본 방 채도 0.62", P1 + "/pc-pack-on-plate-x-17.5-y-2.5-zoom60.png"), ("표본 방 채도 0.75", P2 + "/pc-pack-on-plate-x-17.5-y-2.5-z60.png")]),
        ("화로1 x -25.5 y 2.5 · 줌 60 · 밝기 0.40 (롤백 쪽 같은 장면 기록 없음)", [("표본 방 채도 0.62", P1 + "/pc-torch1-x-25.5-y2.5-zoom60.png"), ("표본 방 채도 0.75", P2 + "/pc-torch1-x-25.5-y2.5-z60.png")])]
W2 = 8 + 3 * 648; cv = Image.new("RGB", (W2, 70 + 4 * (30 + 28 + 427 + 18)), (18, 17, 22)); d = ImageDraw.Draw(cv); y = 12
d.text((12, y), "메이커 실촬영 공정 비교 — 같은 좌표 · 밝기 0.40(DarkVision 강제) · UI 숨김 · 화면 1920×1080 정규화 후 가운데 1200×800", fill=TXT, font=F); y += 52
for title, cells in rows:
    d.text((12, y), title, fill=TXT, font=Fs); y += 30
    for i, (lab, p) in enumerate(cells):
        x = 8 + i * 648; d.text((x, y), lab, fill=SUB, font=Fs); cv.paste(shot(p), (x, y + 28))
    y += 28 + 427 + 18
cv = cv.crop((0, 0, W2, y)); cv.save(OUTD + "/compare-fair-0.40-sat075.png", optimize=True); print("fair", cv.size)
