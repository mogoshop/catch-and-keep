# 몬스터 그림 「까끌함」 수치 — 액트 1 그림(기준)과 비교한다 (10-21 사용자: 액트 3·4가 까끌하고 과하다)
#   python3 tools/art_metrics.py <png 또는 폴더> [...]
# 칸: 명암 거칠기(이웃 픽셀 밝기 차 평균) · 잔점%(좌우 이웃 둘 다와 40 넘게 다른 점) · 색 수(8단계 묶음) · 채도 · 밝기
# 액트 1 평균 (claude-act1-tone-b, 17종): 거칠기 21 · 잔점 4.8% · 색 170 · 채도 0.28 · 밝기 68
import glob, os, sys
import numpy as np
from PIL import Image

ACT1 = {"grad": 21.2, "speck": 4.8, "colors": 171, "sat": 0.28}


def metric(path):
    img = Image.open(path).convert("RGBA")
    im = np.asarray(img).astype(float)
    a = im[..., 3] > 128
    if a.sum() == 0:
        return None
    L = 0.3 * im[..., 0] + 0.59 * im[..., 1] + 0.11 * im[..., 2]
    gx, gy = np.abs(np.diff(L, axis=1)), np.abs(np.diff(L, axis=0))
    m, n = a[:, :-1] & a[:, 1:], a[:-1, :] & a[1:, :]
    grad = (gx[m].mean() + gy[n].mean()) / 2
    c = L[:, 1:-1]
    sp = (np.abs(c - L[:, :-2]) > 40) & (np.abs(c - L[:, 2:]) > 40) & a[:, 1:-1] & a[:, :-2] & a[:, 2:]
    cols = len(set(map(tuple, (im[a][:, :3] // 8).astype(int))))
    sat = np.asarray(img.convert("RGB").convert("HSV"))[..., 1][a].mean() / 255
    return {"grad": grad, "speck": sp.sum() / a.sum() * 100, "colors": cols, "sat": sat, "lum": L[a].mean()}


def main():
    files = []
    for arg in sys.argv[1:]:
        files += sorted(glob.glob(os.path.join(arg, "**/*.png"), recursive=True)) if os.path.isdir(arg) else [arg]
    print("파일 | 거칠기 · 잔점% · 색 · 채도 · 밝기 | 액트 1 대비 (거칠기·잔점·채도)")
    for f in files:
        r = metric(f)
        if r is None:
            continue
        ratio = " ".join(f"{r[k] / ACT1[k]:.1f}" for k in ("grad", "speck", "sat"))
        print(f"{f} | {r['grad']:.1f} · {r['speck']:.1f} · {r['colors']} · {r['sat']:.2f} · {r['lum']:.0f} | {ratio}")


main()
