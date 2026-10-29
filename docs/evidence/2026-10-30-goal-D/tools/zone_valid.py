#!/usr/bin/env python3
# 출현 구역별 안전 자리 칸 수 (MonsterSpawner.ValidSpawn 근사: 바닥 칸 가운데 · 입구 안전 반경 밖 · 구역 ∩ 출현 범위)
import csv, sys, math, os
ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
def grid(mid):
    walls, rows, w, h = set(), [], 0, 0
    for line in open(os.path.join(ROOT, "data/handmade", mid + ".txt"), encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith(";"):
            t = line[1:].split()
            if t and t[0] == "size": w, h = int(t[1]), int(t[2])
            if t and t[0] == "wall": walls.add(t[1])
        elif line: rows.append(line)
    cells = {}
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            cells[(c - w // 2, h // 2 - r)] = ch
    return cells, walls, w, h
maps = {r["id"]: r for r in csv.DictReader(open(os.path.join(ROOT, "data/maps.csv"), encoding="utf-8"))}
zones = list(csv.DictReader(open(os.path.join(ROOT, "data/spawn_zones.csv"), encoding="utf-8")))
for mid in sorted(set(z["map"] for z in zones)):
    cells, walls, w, h = grid(mid)
    m = maps[mid]
    feats = [(x + 0.5, y + 0.5) for (x, y), ch in cells.items() if ch in "WEGXH"]
    if m["waypoint"]:
        x, y = m["waypoint"].split("@")[1].split("/"); feats.append((float(x), float(y)))
    safe = min(8, max(6, min(w, h) * 0.4))
    ax0, ax1, ay0, ay1 = -(w / 2) + 3, w / 2 - 3, -(h / 2) + 2.5, h / 2 - 1.5
    def ok(px, py):
        if any(math.hypot(px - fx, py - fy) < safe for fx, fy in feats): return False
        for ox, oy in ((0, 0), (-0.25, 0), (0.25, 0), (0, -0.25), (0, 0.25)):
            ch = cells.get((math.floor(px + ox), math.floor(py + oy)))
            if ch is None or ch in walls: return False
        return True
    allv = sum(1 for (x, y) in cells if ax0 <= x + 0.5 <= ax1 and ay0 <= y + 0.5 <= ay1 and ok(x + 0.5, y + 0.5))
    print(f"{mid}: 안전 반경 {safe} · 맵 전체 안전 칸 {allv}")
    for z in (q for q in zones if q["map"] == mid):
        x0, y0, x1, y1 = (float(z[k]) for k in ("x0", "y0", "x1", "y1"))
        x0, x1, y0, y1 = max(x0, ax0), min(x1, ax1), max(y0, ay0), min(y1, ay1)
        n = sum(1 for (x, y) in cells if x0 <= x + 0.5 <= x1 and y0 <= y + 0.5 <= y1 and ok(x + 0.5, y + 0.5))
        print(f"   {z['zone']:3} {z['match']:28} share {z['share']:5} 안전 칸 {n}")
