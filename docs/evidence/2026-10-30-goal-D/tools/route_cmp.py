#!/usr/bin/env python3
# I06 대표 4맵 전→후 수치: 설계도 BFS(4방향 · 칸 수 — 시간 아님) · 기능 엔티티 수(map 파일) · 출현 요청(maps.csv)
#   사용: route_cmp.py <before_root> <after_root> <out.json>
import sys, json, csv, collections, math, os
B, A, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
def grid(root, mid):
    walls, rows, w, h = set(), [], 0, 0
    for line in open(os.path.join(root, "data/handmade", mid + ".txt"), encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith(";"):
            t = line[1:].split()
            if t and t[0] == "size": w, h = int(t[1]), int(t[2])
            if t and t[0] == "wall": walls.add(t[1])
        elif line: rows.append(line)
    cells = {}
    for r, row in enumerate(rows):
        for c, ch in enumerate(row): cells[(c - w // 2, h // 2 - r)] = ch
    return cells, walls
def bfs(cells, walls, start, banned=lambda xy, ch: False):
    floor = lambda xy: xy in cells and cells[xy] not in walls and not banned(xy, cells[xy])
    d = {start: 0}; q = collections.deque([start])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in d and floor(n): d[n] = d[(x, y)] + 1; q.append(n)
    return d
def path(cells, walls, start, goal, banned=lambda xy, ch: False):
    d = bfs(cells, walls, start, banned)
    if goal not in d: return None, d
    p = [goal]
    while p[-1] != start:
        x, y = p[-1]
        p.append(min(((x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + a, y + b) in d), key=lambda k: d[k]))
    return p[::-1], d
def marker(cells, ch): return next((xy for xy, c in cells.items() if c == ch), None)
def maprow(root, mid):
    for r in csv.DictReader(open(os.path.join(root, "data/maps.csv"), encoding="utf-8")):
        if r["id"] == mid: return r
def entities(root, mid):
    out = {}
    for suf in ("", "_nm", "_hell"):
        d = json.load(open(os.path.join(root, "map", mid + suf + ".map"), encoding="utf-8"))
        ents = d["ContentProto"]["Entities"]
        cnt = collections.Counter()
        for e in ents:
            names = e.get("componentNames") or ""
            for k in ("script.WarpGate", "script.Waypoint", "script.Monster", "script.QuestMarker", "script.MonsterSpawner", "MOD.Core.RectTileMapComponent"):
                if k in names: cnt[k] += 1
        out[suf or "normal"] = dict(total=len(ents), **{k.split(".")[-1]: v for k, v in cnt.items()})
    return out
def spawn_total(spec):
    return sum(int(t.split(":")[1]) for t in spec.split(";") if t)
def zone_of(cells, xy): return cells.get(xy)
res = {}
for mid in ("crypt2", "temple2", "lighthouse1", "demonroad"):
    r = {}
    for tag, root in (("before", B), ("after", A)):
        cells, walls = grid(root, mid)
        row = maprow(root, mid)
        W, E = marker(cells, "W"), marker(cells, "E")
        p, d = path(cells, walls, W, E)
        info = dict(floor_cells=sum(1 for c in cells.values() if c not in walls), W=W, E=E, route_W_E=len(p) - 1 if p else None,
                    reachable_floor=len(d), markers={k: sum(1 for c in cells.values() if c == k) for k in "WEHXST"},
                    spawns=row["spawns"], spawns_total=spawn_total(row["spawns"]), spawnsNm_total=spawn_total(row["spawnsNm"]) if row["spawnsNm"] else None,
                    spawnsHell_total=spawn_total(row["spawnsHell"]) if row["spawnsHell"] else None, packSize=row["packSize"], respawnSec=row["respawnSec"],
                    fixed=row["fixed"], waypoint=row["waypoint"], extra=row["extra"], torches=len([t for t in row["torches"].split(";") if t]),
                    entities=entities(root, mid))
        if mid == "crypt2":
            skip, _ = path(cells, walls, W, E, lambda xy, ch: ch in "ce")
            info["route_W_E_without_c_e"] = len(skip) - 1 if skip else None
            for z in "ce":
                zc = [xy for xy, ch in cells.items() if ch == z]
                info[f"detour_{z}_from_route"] = min(d2 for xy in zc for d2 in [bfs(cells, walls, W).get(xy, 9999) - 0]) if zc else None
        if mid == "temple2":
            for nm, xy in (("gatebrother", (14, -2)), ("gatebrother2", (14, 4))):
                full, _ = path(cells, walls, W, xy)
                south, _ = path(cells, walls, W, xy, lambda q, ch: ch in "cd")
                north, _ = path(cells, walls, W, xy, lambda q, ch: ch == "b")
                info[f"W_to_{nm}"] = dict(shortest=len(full) - 1 if full else None, via_south_b_only=len(south) - 1 if south else None, via_north_cd_only=len(north) - 1 if north else None)
            ee, _ = path(cells, walls, (14, 1), E)
            info["hall_to_E"] = len(ee) - 1 if ee else None
        if mid == "lighthouse1":
            S = marker(cells, "S")
            south, _ = path(cells, walls, W, S, lambda q, ch: ch == "c")
            north, _ = path(cells, walls, W, S, lambda q, ch: ch == "b")
            ex, _ = path(cells, walls, S, E)
            noside, _ = path(cells, walls, S, E, lambda q, ch: ch in "ef")
            H = marker(cells, "H"); hp, _ = path(cells, walls, W, H)
            chest = (-23, 11); cp, _ = path(cells, walls, W, chest)
            info.update(W_to_hall_via_south_b=len(south) - 1 if south else None, W_to_hall_via_north_c=len(north) - 1 if north else None,
                        hall_to_E=len(ex) - 1 if ex else None, hall_to_E_skip_side_rooms=len(noside) - 1 if noside else None,
                        W_to_keeperhouse=len(hp) - 1 if hp else None, W_to_chest=len(cp) - 1 if cp else None)
        if mid == "demonroad":
            ext = dict(t.split("@") for t in row["extra"].split(";") if "@" in t)
            cx, cy = (float(v) for v in ext["road:chest"].split("/"))
            info["chest"] = [cx, cy]
            info["chest_min_dist_to_shortest_W_E"] = round(min(math.hypot(x + 0.5 - cx, y + 0.5 - cy) for x, y in p), 2)
            avoid, _ = path(cells, walls, W, E, lambda q, ch: math.hypot(q[0] + 0.5 - cx, q[1] + 0.5 - cy) <= 2.0)
            info["route_W_E_outside_chest_radius2"] = len(avoid) - 1 if avoid else None
            ccell = (math.floor(cx), math.floor(cy)); cpth, _ = path(cells, walls, W, ccell); cE, _ = path(cells, walls, ccell, E)
            info["W_to_chest_to_E"] = (len(cpth) - 1 + len(cE) - 1) if cpth and cE else None
            H = marker(cells, "H"); hp, _ = path(cells, walls, W, H); info["W_to_soulprison"] = len(hp) - 1 if hp else None
            S = marker(cells, "S"); sp_, _ = path(cells, walls, W, S); info["W_to_waypoint"] = len(sp_) - 1 if sp_ else None
        r[tag] = info
    res[mid] = r
json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for mid, r in res.items():
    b, a = r["before"], r["after"]
    keys = [k for k in a if k not in ("entities", "markers", "spawns", "W", "E", "extra", "fixed", "waypoint")]
    print(mid, {k: (b.get(k), a.get(k)) for k in keys if b.get(k) != a.get(k) or k.startswith("spawn")})
    print("   markers", b["markers"], "->", a["markers"], "| entities", {s: (b["entities"][s], a["entities"][s]) for s in a["entities"]})
