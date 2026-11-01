# 51 분위기 색(mood tint) 미리보기 — 실제 게임 반영 아님. 메이커 캡처 위에 「조명 색 섞기」·「UI 판」을 근사 합성한다.
# 사용: python3 docs/design/51-mood-tint/previews/make_previews.py  (프로젝트 루트에서)
#
# 근사 모델 (docs/design/51-mood-tint-20261101.md §2·§6):
#   게임 화면 ≈ 그림 × 조명.  조명 = 전체 조명(Global, 색 G × 밝기 a) + 내 주변 빛(Spot, 색 P, 안 반경 3.02칸 · 밖 반경 5.04칸)
#   조명 색을 T 쪽으로 s만큼 섞으면(G' = G·(1-s) + T·s, P'도 같게) 화면은 그림 × (G'/G) 또는 × (P'/P)만큼 바뀐다.
#   → 캡처(이미 현재 조명이 걸린 화면)에 화소마다 비율 (가장자리 G'/G ↔ 플레이어 둘레 P'/P, 반경 무게로 섞음)을 곱한다.
#   조명 합이 1을 넘을 때 엔진이 자르는지(clamp)는 확인하지 않았다 → 자르면 밝은 맵에서 실제 효과는 이보다 옅다(§2 위험).
#   UI 판(수단 a)은 화면 전체에 알파 섞기: 화면 × (1-α) + T × α (UI·이름표까지 덮는다).
import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
EV = os.path.join(ROOT, "docs/evidence")
OUT = os.path.dirname(os.path.abspath(__file__))
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

P_LIGHT = (1.0, 0.92, 0.8)          # DarkVision.ApplyPlayerLight 기본 내 주변 빛 (DarkVision.mlua:493)
ACT4 = (0.9, 0.5, 0.4)              # 액트 4 전체 조명 색 (DarkVision.mlua:197)
CLEARED = (1.0, 0.97, 0.92)         # 해방된 뒤 색 (DarkVision.mlua:422)
AWAKE = (1.0, 0.14, 0.08)           # 각성 핏빛 (DarkVision.mlua:31)
AWAKE_P = (1.0, 0.58, 0.46)         # 각성 내 주변 빛 (DarkVision.mlua:33)


def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def lerp(a, b, s):
    return tuple(x * (1 - s) + y * s for x, y in zip(a, b))


def font(size):
    return ImageFont.truetype(FONT, size, index=0)


def radial_weight(w, h, cx, cy, ppu, inner=3.02, outer=5.04):
    # 1 = 내 주변 빛 안쪽, 0 = 빛이 닿지 않는 가장자리 (선형 감쇠 근사)
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / ppu
    return np.clip((outer - d) / (outer - inner), 0, 1)[..., None]


def light_tint(img, cx, cy, ppu, g_from, g_to, p_from, p_to, g_gain=1.0, mask=None):
    a = np.asarray(img).astype(np.float32) / 255
    h, w = a.shape[:2]
    wgt = radial_weight(w, h, cx, cy, ppu)
    re = np.array([t / max(f, 1e-3) for f, t in zip(g_from, g_to)], np.float32) * g_gain
    rc = np.array([t / max(f, 1e-3) for f, t in zip(p_from, p_to)], np.float32)
    ratio = re * (1 - wgt) + rc * wgt
    out = np.clip(a * ratio, 0, 1)
    if mask is not None:
        out = np.where(mask[..., None], a, out)
    return Image.fromarray((out * 255).astype(np.uint8))


def veil(img, color, alpha):
    a = np.asarray(img).astype(np.float32) / 255
    out = a * (1 - alpha) + np.array(color, np.float32) * alpha
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def ui_mask(size, rects):
    m = np.zeros((size[1], size[0]), bool)
    for l, t, r, b in rects:
        m[t:b, l:r] = True
    return m


def sheet(panels, title, path, width=None):
    # panels: [(Image, 제목, 부제)] 가로로 나란히, 위에 큰 제목
    width = width or 760
    imgs = []
    for im, _, _ in panels:
        k = width / im.width
        imgs.append(im.resize((width, int(im.height * k)), Image.LANCZOS))
    ph = max(i.height for i in imgs)
    pad, head, cap = 16, 64, 74
    W = pad + len(imgs) * (width + pad)
    H = head + ph + cap + pad
    s = Image.new("RGB", (W, H), (18, 16, 20))
    d = ImageDraw.Draw(s)
    d.text((pad, 16), title, fill=(240, 232, 214), font=font(28))
    for i, (im, (_, t, sub)) in enumerate(zip(imgs, panels)):
        x = pad + i * (width + pad)
        s.paste(im, (x, head))
        d.text((x, head + ph + 10), t, fill=(250, 214, 140), font=font(22))
        d.text((x, head + ph + 42), sub, fill=(190, 186, 176), font=font(17))
    s.save(path)
    print("wrote", os.path.relpath(path, ROOT), s.size)


def swatch(c, s):
    return f"#{int(c[0]*255):02X}{int(c[1]*255):02X}{int(c[2]*255):02X} · s {s:.2f}"


# ── 1. 수단 비교 (불탄 협곡 · 액트 4 어두운 맵 · 화면 전체, UI 포함) ──
src = Image.open(os.path.join(EV, "2026-10-31-map-v5-act4/maker/shots/embercanyon-T1-embertree-up.jpg")).convert("RGB")
W, H = src.size                       # 2197×1236 · 줌 80 = 가로 16칸 → 칸당 W/16 px
ppu = W / 16
px, py = 1060, 484                    # 내 아바타 발 근처 (캡처에서 읽음)
rects = [(836, 22, 1364, 154), (1562, 160, 2197, 715), (1694, 759, 2173, 952), (572, 880, 1628, 1236),
         (0, 990, 220, 1236), (1980, 990, 2197, 1236), (33, 649, 132, 748), (22, 924, 88, 990), (1980, 33, 2178, 121)]
mask = ui_mask(src.size, rects)
T = hexc("#7C8CE0")
a_img = veil(src, T, 0.15)
d_img = light_tint(src, px, py, ppu, ACT4, lerp(ACT4, T, 0.30), P_LIGHT, lerp(P_LIGHT, T, 0.30), mask=mask)
sheet([
    (src, "현재 · 액트 4 붉은 불빛", "전체 조명 (0.9,0.5,0.4)×0.24 + 내 주변 빛"),
    (a_img, "수단 a · 전체 화면 UI 판", "#7C8CE0 α 0.15 — HUD·체력 구슬·글자까지 물들고 검정이 뜬다"),
    (d_img, "수단 d · 조명 색 섞기 (추천)", "#7C8CE0 s 0.30 — 월드만, HUD는 그대로 (가장자리가 더 물든다)"),
], "51 미리보기 ① 수단 비교 — 같은 남보라를 UI 판으로 덮을 때 vs 조명 색에 섞을 때", os.path.join(OUT, "01-means-veil-vs-light.png"))


def crop_world(path, box, player):
    im = Image.open(os.path.join(EV, path)).convert("RGB")
    ppu = im.width / 16
    l, t, r, b = box
    return im.crop(box), player[0] - l, player[1] - t, ppu


# ── 2. 안 A · 배교자의 수도원 (오렌의 방) — 잿빛 탈색 → 핏빛 ──
im, cx, cy, ppu = crop_world("2026-10-31-map-v5-act4/maker/shots/apostate-V2-axis-walk-west8s.jpg", (140, 0, 1560, 880), (1018, 517))
ash = hexc("#A8A39C")
ash_img = light_tint(im, cx, cy, ppu, ACT4, lerp(ACT4, ash, 0.40), P_LIGHT, lerp(P_LIGHT, ash, 0.28))
awake_img = light_tint(im, cx, cy, ppu, ACT4, AWAKE, P_LIGHT, AWAKE_P, g_gain=(0.24 + 0.06) / 0.24)
sheet([
    (im, "현재 · 오렌 처치 전", "액트 4 기본 불빛 (모든 액트 4 맵 같음)"),
    (ash_img, "안 A-5 · 「꺼져 가는 불씨」", swatch(ash, 0.28) + " — 수도원만 잿빛으로 식힌다"),
    (awake_img, "현행 · 오렌 처치 뒤 각성 핏빛", "AwakeColor (1,0.14,0.08) + 내 빛 (1,0.58,0.46) 재현"),
], "51 미리보기 ② 안 A — 붉어지기 직전 한 맵만 색을 빼서 대비를 키운다", os.path.join(OUT, "02-planA-apostate-ash-to-blood.png"))

# ── 3. 안 B · 피 묻은 황무지 (액트 1 · 이 캡처는 액트 1 해방 뒤 밝기 0.82) — 새벽 / 해질녘 ──
im, cx, cy, ppu = crop_world("2026-10-31-map-v5-act1/maker/shots/wasteland-V2-hollow-entrance-skulltower.jpg", (100, 95, 1030, 520), (625, 300))
dawn, dusk = hexc("#A9C6FF"), hexc("#FFB070")
sheet([
    (im, "현재 · 해방 뒤 밝기", "전체 조명 (1,0.97,0.92)×0.82"),
    (light_tint(im, cx, cy, ppu, CLEARED, lerp(CLEARED, dawn, 0.16), P_LIGHT, lerp(P_LIGHT, dawn, 0.16)), "안 B · 새벽 (첫 사냥터)", swatch(dawn, 0.16)),
    (light_tint(im, cx, cy, ppu, CLEARED, lerp(CLEARED, dusk, 0.16), P_LIGHT, lerp(P_LIGHT, dusk, 0.16)), "안 B · 해질녘 (교수대 숲)", swatch(dusk, 0.16)),
], "51 미리보기 ③ 안 B — 액트 1 안에서 시간이 흐른다 (같은 바닥에 새벽 파랑 / 저녁 주황)", os.path.join(OUT, "03-planB-wasteland-dawn-dusk.png"))

# ── 4. 액트 3 · 소금 갯벌 (해방 뒤) — 회청 / 폭풍 남보라 ──
im, cx, cy, ppu = crop_world("2026-11-01-map-v5-act23-maker/shots/042336-saltflat-WP-walk-end.jpg", (530, 40, 1140, 550), (855, 385))
sea, storm = hexc("#9CC8E8"), hexc("#7C8CE0")
sheet([
    (im, "현재 · 해방 뒤 밝기", "바다 맵 원래 색"),
    (light_tint(im, cx, cy, ppu, CLEARED, lerp(CLEARED, sea, 0.14), P_LIGHT, lerp(P_LIGHT, sea, 0.14)), "안 B · 새벽 회청", swatch(sea, 0.14) + " — 액트 색과 겹쳐 차이가 작다"),
    (light_tint(im, cx, cy, ppu, CLEARED, lerp(CLEARED, storm, 0.20), P_LIGHT, lerp(P_LIGHT, storm, 0.20)), "안 A-4 · 폭풍 남보라", swatch(storm, 0.20) + " (폭풍의 눈 쪽 색)"),
], "51 미리보기 ④ 액트 3 — 이미 푸른 맵에 푸른 색을 더하면 거의 안 보인다 (색은 액트 색과 다른 쪽으로)", os.path.join(OUT, "04-act3-saltflat-sea-vs-storm.png"))
