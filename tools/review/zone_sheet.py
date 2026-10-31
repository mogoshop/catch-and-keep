#!/usr/bin/env python3
"""맵 구성 v5 1단계 — 66장 공간 구획도 · 전수 검수표 (읽기 전용).

저장소 맨 위에서:
  node tools/review/dump_map_layout.cjs /tmp/layout.json          # 빌더가 실제로 놓는 장식·길 안내를 덤프
  python3 tools/review/zone_sheet.py /tmp/layout.json [--capture DIR ...] [--only id,id]

산출:
  docs/review/map-audit-20261031/zones/NN-id.png       설계도 격자 + 공간 색 + 골격 + 출입구 | 현재 캡처
  docs/review/map-audit-20261031/zones-sheet-act{1..4}.png   (1800px 폭)
  docs/review/map-audit-20261031/metrics.json          맵별 공간·골격·위반 수치 (검수표 원자료)
  docs/review/map-audit-20261031.md                    전수 검수표

공간 = 설계도 구역 글자(바탕 '.' 제외). '.'·길 글자는 공간 사이 연결(통로).
역할 = data/handmade/asset_roles.csv. 수치 정의는 검수표 머리말에 적는다.
"""
import csv, json, math, os, re, sys, collections
from PIL import Image, ImageDraw, ImageFont

ROOT = os.getcwd()
OUT = os.path.join(ROOT, 'docs/review/map-audit-20261031')
MD = os.path.join(ROOT, 'docs/review/map-audit-20261031.md')
CELL = 8
TOP5 = ['canyon', 'gallows', 'dunes', 'saltflat', 'stormcliff']   # 계획표 P6 상위 5 맵 (최소 수정)
FONT_PATH = '/System/Library/Fonts/AppleSDGothicNeo.ttc'

def font(sz, bold=False):
    try: return ImageFont.truetype(FONT_PATH, sz, index=6 if bold else 0)
    except Exception: return ImageFont.load_default()

# ───────── 입력 ─────────
args = sys.argv[1:]
if not args: sys.exit(__doc__)
layout_path = args[0]
captures, only = [], None
i = 1
while i < len(args):
    if args[i] == '--capture': captures.append(args[i + 1]); i += 2
    elif args[i] == '--only': only = set(args[i + 1].split(',')); i += 2
    else: i += 1
captures += [os.path.join(ROOT, 'docs/evidence/2026-10-31-map-capture-guide'), os.path.join(ROOT, 'docs/evidence/2026-10-31-map-capture-all')]
L = json.load(open(layout_path))
roles = {r['name']: r for r in csv.DictReader(open(os.path.join(ROOT, 'data/handmade/asset_roles.csv')))}
maps_csv = {r['id']: r for r in csv.DictReader(open(os.path.join(ROOT, 'data/maps.csv')))}
routes_csv = {r['map']: r for r in csv.DictReader(open(os.path.join(ROOT, 'data/handmade/routes.csv')))}

def role_of(name):
    r = roles.get(name)
    return r['role'].rstrip('?') if r else ('floor' if 'decal' in name else 'prop')
PILLAR_WORDS = ('기둥', '깃대', '선돌', '촛대', '말뚝')
def is_pillar(name):
    r = roles.get(name)
    return bool(r) and r['role'].startswith('structure') and any(w in r['notes'] for w in PILLAR_WORDS)

def capture_for(m):
    for d in captures:
        idx = os.path.join(d, 'maps-index.tsv')
        if not os.path.exists(idx): continue
        for row in csv.DictReader(open(idx), delimiter='\t'):
            if row['id'] != m['id']: continue
            p = os.path.join(d, 'raw', f"{row['no']}-{row['id']}.png")
            if not os.path.exists(p): continue
            box = tuple(int(v) for v in re.findall(r'-?\d+', row['crop_box(l,t,r,b)']))
            return p, box, os.path.basename(d)
    return None, None, None

# ───────── 격자 도우미 ─────────
class Grid:
    def __init__(s, m):
        s.m = m; s.W = m['w']; s.H = m['h']; s.g = m['grid']
        s.walls = set(m['walls']); s.roads = set(m['roads']); s.zones = {k for k in m['zones'] if k != '.'}
    def cell(s, x, y):   # 월드 → (c, r)
        return int(math.floor(x + s.W / 2)), int(s.H / 2 - math.floor(y))
    def world(s, c, r):  # 칸 가운데 월드 좌표
        return c - s.W / 2 + 0.5, s.H / 2 - r + 0.5
    def ch(s, c, r):
        if 0 <= r < s.H and 0 <= c < s.W: return s.g[r][c]
        return None
    def floor(s, c, r):
        x = s.ch(c, r); return x is not None and x not in s.walls
    def cells(s):
        for r in range(s.H):
            for c in range(s.W): yield c, r

def bfs_dist(G, sources, passable):
    dist = {p: 0 for p in sources}; q = collections.deque(sources)
    while q:
        c, r = q.popleft()
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c + dc, r + dr)
            if n not in dist and passable(*n): dist[n] = dist[(c, r)] + 1; q.append(n)
    return dist

def shortest(G, a, b):
    """칸 경로 (8방향 · 벽 곁 비용↑) — 입구→전진 출구 골격"""
    import heapq
    near_wall = {}
    def nw(c, r):
        k = (c, r)
        if k not in near_wall:
            near_wall[k] = sum(1 for dc in (-1, 0, 1) for dr in (-1, 0, 1) if not G.floor(c + dc, r + dr))
        return near_wall[k]
    dist = {a: 0}; prev = {}; h = [(0, a)]
    while h:
        d, p = heapq.heappop(h)
        if p == b: break
        if d > dist[p]: continue
        c, r = p
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            n = (c + dc, r + dr)
            if not G.floor(*n): continue
            if dc and dr and not (G.floor(c + dc, r) and G.floor(c, r + dr)): continue
            nd = d + (1.414 if dc and dr else 1) * (1 + 0.6 * nw(*n))
            if nd < dist.get(n, 1e18): dist[n] = nd; prev[n] = p; heapq.heappush(h, (nd, n))
    if b not in dist: return []
    out = [b]
    while out[-1] != a: out.append(prev[out[-1]])
    return out[::-1]

# ───────── 공간 기능 ─────────
KW = [
    ('의식터', ('제단', '의식', '성소', '예배', '신전', '사원', '설교', '성당', '교회', '기도', '봉인', '종탑', '예배당', '사제', '혼의', '룬', '심장')),
    ('몬스터 캠프', ('둥지', '소굴', '야영', '진지', '병영', '캠프', '사냥', '무리', '막사', '감옥', '구덩이', '우리', '굴', '알', '군단', '전초', '망루', '보루', '포대')),
    ('보물·곁길', ('보물', '창고', '금고', '밀수', '서고', '보고', '곳간', '납골', '비밀', '숨은', '무덤', '묘지', '난파', '화물', '서재', '문서')),
]
COLORS = [(230, 90, 70), (70, 150, 230), (90, 190, 90), (230, 180, 50), (170, 100, 220), (40, 190, 190), (230, 120, 180), (150, 150, 60), (120, 120, 230)]

def analyze(m):
    G = Grid(m)
    func = m['func']
    fc = lambda f: G.cell(*f['pos'])
    gates = {f['name']: fc(f) for f in func if f['name'].startswith('Gate')}
    wp = next((fc(f) for f in func if f['name'] == 'Waypoint'), None)
    floor_cells = [p for p in G.cells() if G.floor(*p)]
    # 구역 칸 → 공간, 길·바탕·표식 칸은 가까운 공간(벽 안 넘기)
    zcells = collections.defaultdict(list)
    for c, r in floor_cells:
        x = G.ch(c, r)
        if x in G.zones: zcells[x].append((c, r))
    zones = [z for z in sorted(zcells) if len(zcells[z]) >= 8]
    owner = {}
    q = collections.deque()
    for z in zones:
        for p in zcells[z]: owner[p] = z; q.append(p)
    while q:
        c, r = q.popleft()
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c + dc, r + dr)
            if n not in owner and G.floor(*n): owner[n] = owner[(c, r)]; q.append(n)
    # 입구·전진 출구
    start = gates.get('GateBack') or gates.get('GateToField')
    goal = gates.get('GateNext') or gates.get('GateReturn')
    if m['kind'] == 'town':   # 마을: 들판 문 → 웨이포인트
        start, goal = gates.get('GateToField'), wp
    path = shortest(G, start, goal) if start and goal else []
    seq = []
    for p in path:
        z = owner.get(p)
        if z and (not seq or seq[-1] != z): seq.append(z)
    seq = list(dict.fromkeys(seq))   # 처음 지나는 순서 (큰길이 같은 공간 조각을 들락날락해도 한 번)
    on_skel = set(seq)
    exits = [n for n in gates if n not in ('GateBack', 'GateToField')]
    branch_exits = [n for n in gates if n.startswith('Gate_')]
    # 기능
    places = m['places']
    def place_text(z):
        nm = m['zones'][z]['name']
        for p in places:
            if p['text'].split(' — ')[0].strip() and p['text'].split(' — ')[0].strip() in nm or nm.split(' (')[0] in p['text']:
                return p['text']
        return nm
    boss = next((f for f in func if not f['name'].startswith(('Gate', 'Torch', 'Waypoint', 'Art', 'Town', 'Shop', 'Elder', 'Smith', 'Merchant', 'Stash', 'Caravan')) and m['kind'] != 'town'), None)
    feat_by_zone = collections.Counter()
    for p in m['pieces']:
        if p['decal'] or role_of(p['s']) != 'feature': continue
        z = owner.get(G.cell(p['x'], p['y']))
        if z: feat_by_zone[z] += 1
    spaces = []
    for z in zones:
        nm = m['zones'][z]['name']; txt = place_text(z)
        f = None
        zs = set(zcells[z])
        has = lambda cell: cell is not None and owner.get(cell) == z
        if m['kind'] == 'town':
            if has(gates.get('GateToField')): f = '입구 마당'
            elif has(wp): f = '랜드마크 마당'
            else: f = 'NPC 마당'
        else:
            if has(start): f = '입구 마당'
            elif boss and has(G.cell(*boss['pos'])): f = '보스 아레나'
            elif has(goal): f = '출구 관문'
            elif any(has(gates[n]) for n in branch_exits): f = '보물·곁길'
            elif has(wp): f = '랜드마크 마당'
            else:
                for fn, words in KW:
                    if any(w in txt for w in words): f = fn; break
            if f is None: f = '몬스터 캠프' if z in on_skel else '보물·곁길'
        cs = zcells[z]
        cx = sum(c for c, r in cs) / len(cs); cy = sum(r for c, r in cs) / len(cs)
        # 무게중심이 공간 밖이면 가장 가까운 공간 칸
        if (int(cx), int(cy)) not in zs:
            cx, cy = min(cs, key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2)
        spaces.append(dict(glyph=z, name=nm, text=txt, func=f, cells=len(cs), on_skel=z in on_skel,
                           centroid=(cx, cy), features=feat_by_zone[z],
                           gate=[n for n in gates if has(gates[n])]))
    sp = {s['glyph']: s for s in spaces}
    # ── 위반 수치 ──
    wallcells = [p for p in G.cells() if not G.floor(*p)]
    wall_d = bfs_dist(G, [p for p in floor_cells if any(not G.floor(p[0] + a, p[1] + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))], G.floor)
    def near_wall(x, y):   # 칸 단위 벽까지 거리
        return wall_d.get(G.cell(x, y), 0)
    solid = [p for p in m['pieces'] if not p['decal'] and role_of(p['s']) not in ('floor',)]
    by = collections.defaultdict(list)
    for p in solid: by[p['s']].append(p)
    scattered, scattered_kinds = 0, []
    rowsok = 0
    for s, ps in by.items():
        if len(ps) < 3: continue
        # 같은 그림끼리 4.5칸 안을 묶는다 → 묶음이 3개 이상이고 한 줄(직선)·벽 따라(테두리)면 축 있는 반복
        groups, used = [], set()
        for i0, p in enumerate(ps):
            if i0 in used: continue
            st = [i0]; used.add(i0); grp = []
            while st:
                k = st.pop(); grp.append(ps[k])
                for j, o in enumerate(ps):
                    if j not in used and math.hypot(o['x'] - ps[k]['x'], o['y'] - ps[k]['y']) <= (7 if is_pillar(s) else 4.5): used.add(j); st.append(j)
            groups.append(grp)
        bad = 0
        for grp in groups:
            ok = False
            if len(grp) >= 3:
                mx = sum(p['x'] for p in grp) / len(grp); my = sum(p['y'] for p in grp) / len(grp)
                sxx = sum((p['x'] - mx) ** 2 for p in grp); syy = sum((p['y'] - my) ** 2 for p in grp); sxy = sum((p['x'] - mx) * (p['y'] - my) for p in grp)
                tr = sxx + syy; det = sxx * syy - sxy * sxy
                lmin = tr / 2 - math.sqrt(max(0, tr * tr / 4 - det))
                if math.sqrt(lmin / len(grp)) <= 0.5: ok = True                     # 한 줄
                elif all(near_wall(p['x'], p['y']) <= 1 for p in grp): ok = True   # 벽 따라 테두리
            elif len(grp) == 2 and is_pillar(s): ok = True                          # 기둥 쌍
            if ok: rowsok += len(grp)
            else: bad += len(grp)
        if bad >= 3 or (bad and bad == len(ps)):
            scattered += bad; scattered_kinds.append((s, bad))
    # 기둥 낱개: 같은 기둥 그림이 5칸 안에 하나도 없는 것
    pillars = [p for p in solid if is_pillar(p['s'])]
    def partner(p, o):   # 5칸 안 같은 기둥 · 또는 12칸 안 같은 가로/세로 줄(대칭 짝)
        if o is p or o['s'] != p['s']: return False
        dd = math.hypot(o['x'] - p['x'], o['y'] - p['y'])
        return dd <= 5 or (dd <= 12 and (abs(o['x'] - p['x']) <= 0.6 or abs(o['y'] - p['y']) <= 0.6))
    single_pillars = sum(1 for p in pillars if not any(partner(p, o) for o in pillars))
    feat_spaces = sum(1 for s in spaces if s['features'] >= 2)
    # 빈 바닥: 바탕 '.' 칸 중 바닥 무늬(데칼) 1.5칸 밖
    decals = [(p['x'], p['y']) for p in m['pieces'] if p['decal']]
    base_cells = [p for p in floor_cells if G.ch(*p) == '.']
    def patched(p):
        x, y = G.world(*p)
        return any(abs(dx - x) <= 1.5 and abs(dy - y) <= 1.5 for dx, dy in decals)
    empty = sum(1 for p in base_cells if not patched(p))
    empty_pct = 100 * empty / max(1, len(floor_cells))
    base_pct = 100 * len(base_cells) / max(1, len(floor_cells))
    # 넓은 빈 바닥: 바탕 칸 중 공간 구역에서 3칸 넘게 떨어진 칸 (길 띠 폭 1~2를 넘는 빈 마당)
    zd = bfs_dist(G, [p for z in zones for p in zcells[z]], G.floor)
    wide_empty = sum(1 for p in base_cells if zd.get(p, 99) > 3)
    # 길 안내: v4 고리 · 막다른 방으로 가는 고리 · 샛길
    loops = [c for c in m['curves'] if c['kind'] == 'loop']
    dead_loops = []
    for c in loops:
        z = c['target'].split(':')[-1]
        s = sp.get(z)
        if s and not s['on_skel'] and not s['gate']: dead_loops.append(z)
    side = [k for k in m['roads'] if k != '=']
    skel_set = set(path)
    side_dead = 0
    if side:
        sidecells = [p for p in floor_cells if G.ch(*p) in side]
        seen = set()
        for p in sidecells:
            if p in seen: continue
            comp = []; st = [p]; seen.add(p)
            while st:
                c0 = st.pop(); comp.append(c0)
                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                    n = (c0[0] + a, c0[1] + b)
                    if n not in seen and G.ch(*n) in side: seen.add(n); st.append(n)
            if not any(abs(c0[0] - q0[0]) <= 1 and abs(c0[1] - q0[1]) <= 1 for c0 in comp for q0 in skel_set):
                zs = {owner.get(c0) for c0 in comp}
                if all(z and not sp[z]['gate'] for z in zs if z in sp): side_dead += 1
    # 구획 고리: 공간·통로 그래프 순환 수 (E - V + C)
    node = {}
    for p in floor_cells:
        x = G.ch(*p)
        node[p] = ('z', x) if x in zones else None
    # 통로(바탕·길·표식) 연결 성분마다 노드
    cid = 0
    for p in floor_cells:
        if node[p] is not None: continue
        cid += 1; st = [p]; node[p] = ('c', cid)
        while st:
            c0 = st.pop()
            for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (c0[0] + a, c0[1] + b)
                if n in node and node[n] is None: node[n] = ('c', cid); st.append(n)
    edges = set()
    for p in floor_cells:
        for a, b in ((1, 0), (0, 1)):
            n = (p[0] + a, p[1] + b)
            if n in node and node[n] != node[p]:
                # 통로 성분이 너무 작으면(3칸 미만) 무시하지 않는다 — 문턱도 연결
                edges.add(tuple(sorted([node[p], node[n]])))
    V = set(node.values()); adj = collections.defaultdict(set)
    for a, b in edges: adj[a].add(b); adj[b].add(a)
    comps, seen = 0, set()
    for v in V:
        if v in seen: continue
        comps += 1; st = [v]; seen.add(v)
        while st:
            u = st.pop()
            for w in adj[u]:
                if w not in seen: seen.add(w); st.append(w)
    cycles = max(0, len(edges) - len(V) + comps)
    # 랜드마크 밀도: 16×16 구역에 특징 2개 이상
    blocks = collections.Counter()
    for p in m['pieces']:
        if p['decal'] or role_of(p['s']) != 'feature': continue
        c, r = G.cell(p['x'], p['y']); blocks[(c // 16, r // 16)] += 1
    dense = sum(1 for v in blocks.values() if v >= 2)
    nfeat = sum(blocks.values())
    viol = dict(scattered=scattered, feat_spaces=feat_spaces, single_pillars=single_pillars, dead_guides=len(dead_loops) + side_dead,
                guide_loops=len(loops), space_cycles=cycles, dense_blocks=dense)
    total = sum(viol.values())
    return dict(G=G, path=path, seq=seq, spaces=spaces, owner=owner, exits=exits, branch_exits=branch_exits, start=start, goal=goal,
                wp=wp, viol=viol, total=total, empty_pct=empty_pct, base_pct=base_pct, wide_empty=wide_empty, floor=len(floor_cells),
                scattered_kinds=sorted(scattered_kinds, key=lambda t: -t[1]), dead_loops=dead_loops, side_dead=side_dead, loops=loops,
                nfeat=nfeat, rowsok=rowsok, pillars=len(pillars))

# ───────── 등급 ─────────
def grade(m, a):
    v = a['viol']
    if m['id'] in TOP5:
        return 'C', f"계획표 P6 상위 5 맵 — 최소 수정. 단 산발 복제 {v['scattered']}·길 안내 고리 {v['guide_loops']}는 생성기 v5 공통 처리(복제 상한·고리 제거)로 정리"
    big = v['scattered'] + v['single_pillars'] + 3 * v['feat_spaces'] + 3 * v['dense_blocks']
    if m['kind'] in ('town',) and big <= 6:
        return 'C', '마을 — 공간·기능이 분명(NPC 마당 구획), 소품 산발만 소폭'
    reasons = []
    if a['empty_pct'] >= 20: reasons.append(f"빈 바닥 {a['empty_pct']:.0f}%")
    if big >= 14: reasons.append(f'배치 위반 가중 {big}')
    if v['guide_loops'] + v['space_cycles'] >= 6: reasons.append(f"고리 {v['guide_loops'] + v['space_cycles']}")
    if len(a['spaces']) > 7 or len(a['spaces']) < 3: reasons.append(f"공간 {len(a['spaces'])}개")
    if len(reasons) >= 2 or a['empty_pct'] >= 25 or big >= 20:
        return 'A', '전면 — ' + ' · '.join(reasons or [f'배치 위반 가중 {big}'])
    if big <= 4 and a['empty_pct'] < 12 and v['space_cycles'] <= 1:
        return 'C', f"위반 적음(가중 {big}·빈 바닥 {a['empty_pct']:.0f}%) — 상위 5에 준함"
    return 'B', '부분 — ' + (' · '.join(reasons) if reasons else f"배치 위반 가중 {big} · 빈 바닥 {a['empty_pct']:.0f}%")

# ───────── 재구성 제안 ─────────
STRUCT = {
    1: dict(pillar='a1-skull-banner', pair='execution-chain-pillar', ring='a1-crow-fence', camp='camp-tent', grave='a1-grave-markers', wall='mp-barricade'),
    2: dict(pillar='temple-column', pair='wind-stele', ring='a2-spear-skull-fence', camp='tent', grave='broken-column', wall='a2-sandstone-wall-broken-e/w'),
    3: dict(pillar='chapel-pillar', pair='harbor-lantern', ring='a3-adjunct-seaweed-post-r2', camp='drowned-hut', grave='broken-boardwalk', wall='harbor-lantern'),
    4: dict(pillar='a4-chain-pillar', pair='a4-demon-banner', ring='a4-ruined-wall-low', camp='a4-army-tent', grave='a4-sigil-stone', wall='a4-prison-bars-h'),
}
STRUCT_IN = {
    1: dict(pillar='crypt-candlestand', pair='queen-great-candelabra', ring='a1-open-coffin', camp='crypt-sarcophagus', grave='a1-grave-markers', wall='a1-open-coffin'),
    2: dict(pillar='temple-column', pair='wind-stele', ring='broken-column', camp='broken-column', grave='wind-stele', wall='broken-column'),
    3: dict(pillar='chapel-pillar', pair='harbor-lantern', ring='a3-adjunct-seaweed-post-r2', camp='harbor-lantern', grave='chapel-pillar', wall='harbor-lantern'),
    4: dict(pillar='a4-chain-pillar', pair='a4-demon-banner', ring='a4-prison-bars-h', camp='a4-soul-cage', grave='a4-sigil-stone', wall='a4-prison-bars-h'),
}
def propose(m, a):
    indoor = not m['roads'] and m['kind'] != 'town'   # 길 글자 없는 맵 = 실내(묘실·사원·등대·동굴)
    st = (STRUCT_IN if indoor else STRUCT)[m['act']]
    sp = sorted(a['spaces'], key=lambda s: -s['cells'])
    lines = []
    parts = []
    for s in sp[:3]:
        f = s['func']
        if f == '입구 마당': parts.append(f"「{s['name']}」 관문 양옆 {st['pair']} 쌍")
        elif f == '출구 관문': parts.append(f"「{s['name']}」 출구로 모이는 {st['pillar']} 양옆 열")
        elif f == '의식터': parts.append(f"「{s['name']}」 {st['grave']} 테두리(ring)")
        elif f == '몬스터 캠프': parts.append(f"「{s['name']}」 {st['camp']} 줄 + {st['ring']} " + ('경계' if indoor else '울타리'))
        elif f in ('랜드마크 마당', '보스 아레나'): parts.append(f"「{s['name']}」 {st['pillar']} 열주 2열")
        elif f == 'NPC 마당': parts.append(f"「{s['name']}」 {st['camp']}·좌판 줄로 골목")
        else: parts.append(f"「{s['name']}」 {st['ring']} 경계 + 소품 묶음 1")
    lines.append('공간·반복 구조: ' + ' · '.join(parts))
    feats = [p for p in a['G'].m['pieces'] if not p['decal'] and role_of(p['s']) == 'feature']
    lm = [p for p in feats if '-landmark-' in p['s']] or feats
    target = next((s for s in a['spaces'] if s['func'] in ('랜드마크 마당', '보스 아레나')), None) or (sp[0] if sp else None)
    if lm and target:
        best = max(lm, key=lambda p: float(roles.get(p['s'], {}).get('base_cells', 3) or 3))
        rest = len(feats) - 1
        cur = roles.get(best['s'], {}).get('notes', '')
        mm = re.search(r'현재 ([\d.]+)칸 → 기준 ([\d.]+)칸', cur)
        size = f"({mm.group(1)}→{mm.group(2)}칸)" if mm else ''
        lines.append(f"특징: {best['s']}{size} 하나를 「{target['name']}」 중심에" + (f", 나머지 특징 {rest}개는 다른 공간에 1개씩만 남기고 소품 묶음으로" if rest > 0 else ''))
    elif target:
        lines.append(f"특징: 특징 에셋 없음 — 액트 {m['act']} 랜드마크 하나를 「{target['name']}」 중심에 새로 (역할표 feature)")
    else:
        lines.append('특징: 미확인')
    bounds = []
    for x, y in zip(a['seq'], a['seq'][1:]):
        bounds.append(f"{a['G'].m['zones'][x]['name'].split(' (')[0]}|{a['G'].m['zones'][y]['name'].split(' (')[0]}")
    extra = []
    if a['viol']['guide_loops']: extra.append(f"고리 {a['viol']['guide_loops']}개 걷기")
    if a['side_dead']: extra.append(f"막다른 샛길 {a['side_dead']}줄 걷기")
    if '=' in m['roads']: extra.append('큰길(=)은 띠 폭 1~1.5칸으로')
    lines.append('길 띠: ' + (' → '.join(bounds[:5]) + (' …' if len(bounds) > 5 else '') + ' 구역 경계' if bounds else '입구→출구 한 공간 안 — 공간 둘로 나눠 경계 띠') + (' · ' + ' · '.join(extra) if extra else ''))
    return lines

# ───────── 그림 ─────────
def draw_map(m, a, grade_):
    G = a['G']; W, H = G.W * CELL, G.H * CELL
    img = Image.new('RGB', (W, H), (24, 22, 26))
    d = ImageDraw.Draw(img, 'RGBA')
    gl = {s['glyph']: i for i, s in enumerate(a['spaces'])}
    for c, r in G.cells():
        x = G.ch(c, r); box = [c * CELL, r * CELL, c * CELL + CELL - 1, r * CELL + CELL - 1]
        if x in G.walls: d.rectangle(box, fill=(52, 48, 54)); continue
        base = (205, 198, 186) if x == '.' else (176, 170, 160)
        if x == '=': base = (150, 128, 98)
        elif x in G.roads: base = (178, 156, 120)
        d.rectangle(box, fill=base)
        if x in gl:
            col = COLORS[gl[x] % len(COLORS)]; d.rectangle(box, fill=col + (120,))
    # 현재 길 안내 고리(골격 밖) — 파란 점선
    for c in a['loops']:
        pts = [((x + G.W / 2) * CELL, (G.H / 2 - y) * CELL) for x, y in c['pts']]
        for k in range(0, len(pts) - 1, 2):
            d.line([pts[k], pts[k + 1]], fill=(40, 90, 230, 230), width=2)
    # 골격
    if a['path']:
        pts = [(c * CELL + CELL / 2, r * CELL + CELL / 2) for c, r in a['path']]
        d.line(pts, fill=(200, 20, 20, 255), width=5, joint='curve')
    # 특징 에셋(◆) · 산발 복제(×)
    bad = {s for s, n in a['scattered_kinds']}
    for p in G.m['pieces']:
        if p['decal']: continue
        c, r = G.cell(p['x'], p['y']); px, py = c * CELL + 4, r * CELL + 4
        if role_of(p['s']) == 'feature':
            d.polygon([(px, py - 5), (px + 5, py), (px, py + 5), (px - 5, py)], fill=(250, 220, 40, 255), outline=(0, 0, 0))
        elif p['s'] in bad:
            d.line([(px - 3, py - 3), (px + 3, py + 3)], fill=(20, 20, 20), width=2); d.line([(px - 3, py + 3), (px + 3, py - 3)], fill=(20, 20, 20), width=2)
    # 출입구
    f_sm = font(11, True)
    def mark(cell, col, label):
        if not cell: return
        c, r = cell; px, py = c * CELL + 4, r * CELL + 4
        d.ellipse([px - 7, py - 7, px + 7, py + 7], fill=col, outline=(255, 255, 255), width=2)
        right_side = px < W - 70
        d.text((px + 9, py - 7) if right_side else (px - 9, py - 7), label, anchor='la' if right_side else 'ra', fill=(255, 255, 255), font=f_sm, stroke_width=2, stroke_fill=(0, 0, 0))
    gates = {f['name']: G.cell(*f['pos']) for f in G.m['func'] if f['name'].startswith('Gate')}
    for n, cell in gates.items():
        if n in ('GateBack', 'GateToField'): mark(cell, (40, 170, 60), '입구' if n == 'GateBack' else '들판 문')
        elif n in ('GateNext', 'GateReturn'): mark(cell, (220, 60, 40), '전진 출구' if n == 'GateNext' else '귀환 출구')
        else: mark(cell, (150, 60, 200), '곁길 ' + n[5:])
    if a['wp']: mark(a['wp'], (40, 140, 230), 'WP')
    # 공간 라벨
    f1, f2 = font(12, True), font(10)
    for i, s in enumerate(a['spaces']):
        cx, cy = s['centroid']; px, py = cx * CELL, cy * CELL
        t1 = f"{i + 1} {s['name'].split(' (')[0]}"; t2 = s['func']
        d.text((px, py - 7), t1, fill=(255, 255, 255), font=f1, anchor='mm', stroke_width=2, stroke_fill=(0, 0, 0))
        d.text((px, py + 7), t2, fill=(255, 240, 160), font=f2, anchor='mm', stroke_width=2, stroke_fill=(0, 0, 0))
    # 오른쪽 현재 캡처
    cap, box, src = capture_for(G.m)
    right = Image.new('RGB', (W, H), (10, 10, 10))
    if cap:
        im = Image.open(cap).convert('RGB').crop(box).resize((W, H), Image.LANCZOS); right.paste(im, (0, 0))
    head = 46
    out = Image.new('RGB', (W * 2 + 12, H + head), (16, 16, 18))
    out.paste(img, (0, head)); out.paste(right, (W + 12, head))
    od = ImageDraw.Draw(out)
    v = a['viol']
    od.text((6, 4), f"{a['no']} {G.m['id']} · {G.m['name']} · 액트 {G.m['act']} · {G.m['w']}×{G.m['h']} · 등급 {grade_}", fill=(255, 230, 160), font=font(15, True))
    od.text((6, 25), f"구획안: 빨강=골격(입구→전진 출구) · 파란 점선=현재 길 안내 고리 · ◆특징 · ×산발 복제 | 오른쪽=현재 캡처({src or '없음'})  위반 {a['total']} · 빈 바닥 {a['empty_pct']:.0f}%", fill=(200, 200, 200), font=font(11))
    return out

def sheet(imgs, path, title):
    Wt = 1800; pad = 10; col = 2
    tw = (Wt - pad * (col + 1)) // col
    tiles = [im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS) for im in imgs]
    rows = [tiles[i:i + col] for i in range(0, len(tiles), col)]
    Ht = 50 + sum(max(t.height for t in rw) + pad for rw in rows) + pad
    out = Image.new('RGB', (Wt, Ht), (12, 12, 14))
    d = ImageDraw.Draw(out); d.text((pad, 12), title, fill=(255, 230, 160), font=font(22, True))
    y = 50
    for rw in rows:
        x = pad
        for t in rw: out.paste(t, (x, y)); x += tw + pad
        y += max(t.height for t in rw) + pad
    out.save(path)

# ───────── 실행 ─────────
os.makedirs(os.path.join(OUT, 'zones'), exist_ok=True)
results = []
per_act = collections.defaultdict(list)
for m in sorted(L, key=lambda m: m['order']):
    if only and m['id'] not in only: continue
    a = analyze(m); g, why = grade(m, a)
    a['grade'], a['why'] = g, why
    a['proposal'] = propose(m, a)
    # 번호 = 기준선 캡처(docs/evidence/2026-10-31-map-capture-all/raw/NN-id.png)와 같은 0~65
    no = next((r['no'] for d in captures[::-1] if os.path.exists(os.path.join(d, 'maps-index.tsv')) for r in csv.DictReader(open(os.path.join(d, 'maps-index.tsv')), delimiter='\t') if r['id'] == m['id']), f"{m['order']:02d}")
    a['no'] = no
    im = draw_map(m, a, g)
    im.save(os.path.join(OUT, 'zones', f"{no}-{m['id']}.png"))
    per_act[m['act']].append(im)
    results.append((m, a))
ACTN = {1: '액트 1 · 재의 황무지', 2: '액트 2 · 모래 왕국', 3: '액트 3 · 얕은 바다', 4: '액트 4 · 심연의 땅'}
if not only:
    for act, ims in per_act.items():
        sheet(ims, os.path.join(OUT, f'zones-sheet-act{act}.png'), f"{ACTN.get(act, act)} — 공간 구획안 ↔ 현재 ({len(ims)}장 · v5 1단계 검수 2026-10-31)")

def j(m, a):
    return dict(id=m['id'], no=a['no'], name=m['name'], act=m['act'], kind=m['kind'], w=m['w'], h=m['h'], grade=a['grade'], why=a['why'],
                viol=a['viol'], total=a['total'], empty_pct=round(a['empty_pct'], 1), base_pct=round(a['base_pct'], 1), wide_empty=a['wide_empty'],
                spaces=[{k: s[k] for k in ('glyph', 'name', 'func', 'cells', 'on_skel', 'features', 'gate')} for s in a['spaces']],
                skeleton=a['seq'], exits=a['exits'], scattered_kinds=a['scattered_kinds'], dead_loops=a['dead_loops'], side_dead=a['side_dead'],
                proposal=a['proposal'], entities=m['entities'])
json.dump([j(m, a) for m, a in results], open(os.path.join(OUT, 'metrics.json'), 'w'), ensure_ascii=False, indent=1)

# ───────── 검수표 ─────────
if only: sys.exit(0)
KIND = {'field': '사냥터', 'side': '곁길', 'town': '마을'}
BOSS = {'queentomb', 'sanctum', 'stormeye', 'throne'}
def kind_of(m): return '보스방' if m['id'] in BOSS else KIND.get(m['kind'], m['kind'])
DIR = lambda G, cell: ('-' if not cell else ('서' if cell[0] < G.W * 0.2 else '동' if cell[0] > G.W * 0.8 else '북' if cell[1] < G.H * 0.3 else '남' if cell[1] > G.H * 0.7 else '가운데'))
md = []
P = md.append
P('# 맵 구성 v5 1단계 — 66장 전수 검수표 (2026-10-31)')
P('')
P('> 읽기 전용 분석. 근거 = 설계도(`data/handmade/<id>.txt`) + 빌더가 실제로 놓는 장식·길 안내(`tools/review/dump_map_layout.cjs`로 덤프, 맵 파일 미사용) + 역할표(`data/handmade/asset_roles.csv`) + 캡처. 구획도: `docs/review/map-audit-20261031/zones/NN-id.png` · 액트 시트 `zones-sheet-act1..4.png`. 다시 만들기: `node tools/review/dump_map_layout.cjs /tmp/layout.json && python3 tools/review/zone_sheet.py /tmp/layout.json`.')
P('')
P('> 구획도 오른쪽 캡처 = `2026-10-31-map-capture-guide`(길 안내 v4·코덱스 타일 반영 뒤, 정본 체크아웃에서 읽음)가 있으면 그것, 없으면 기준선 `2026-10-31-map-capture-all`. 번호 NN = 기준선 캡처 번호(0~65). 공간 기능·재구성 제안은 규칙으로 뽑은 초안이라 승인 때 사람이 고친다. 캡처로만 보이는 것(그림 색·겹침)은 수치에 넣지 않았다.')
P('')
P('## 역할표 요약 (`data/handmade/asset_roles.csv`)')
rc = collections.Counter(r['role'] for r in roles.values())
P('| 역할 | 개수 |')
P('|---|---|')
for k, n in sorted(rc.items(), key=lambda t: -t[1]): P(f'| {k} | {n} |')
P(f"| 합계 | {len(roles)} (크기 조정 필요 {sum(1 for r in roles.values() if '→ 기준' in r['notes'])}) |")
P('')
P('## 수치 정의')
P('| 항목 | 정의 |')
P('|---|---|')
P('| 공간 | 설계도 구역 글자(바탕 `.` 제외, 8칸 이상). `.`·길 글자 칸은 공간 사이 통로. 기능은 출입구·웨이포인트·보스 자리 → 장소 이름 낱말(제단·둥지·창고 …) → 골격 위면 몬스터 캠프, 밖이면 보물·곁길 순으로 정함 (초안 — 승인 때 고침) |')
P('| 골격 | 입구(GateBack, 마을은 들판 문)→전진 출구(GateNext, 없으면 GateReturn · 마을은 웨이포인트) 칸 최단 경로(벽 곁 비용↑). 지나는 공간 순서 |')
P('| 산발 복제 | 막는·서 있는 장식(역할 floor 제외) 중 같은 그림이 3개 이상인데, 4.5칸 안 묶음이 「한 줄(직교 편차 ≤0.5칸)」도 「벽 따라(벽 1칸 안)」도 아닌 개수. 장면 세트가 여러 번 놓여 생긴 복제도 셈 |')
P('| 특징 과밀 공간 | 역할 feature 장식이 2개 이상 놓인 공간 수 |')
P('| 기둥 낱개 | 역할표 notes에 기둥·깃대·선돌·촛대·말뚝인 구조물 중 같은 그림이 5칸 안에 없는 것 |')
P('| 빈 바닥 % | 걷는 칸 중 바탕 `.` 칸이면서 바닥 무늬(데칼) 1.5칸 밖인 칸의 비율. 넓은 빈 바닥 = 바탕 칸 중 공간 구역에서 3칸 넘게 떨어진 칸(길 띠 폭을 넘는 빈 마당) |')
P('| 막다른 길 안내 | 길 안내 v4 고리 중 골격 밖·출구 없는 공간으로 들어가는 것 + 골격에 닿지 않는 샛길(`-`) 줄 |')
P('| 고리 | 길 안내 v4 고리 갈래 수 + 구획 고리(공간·통로 그래프 순환 수 E−V+C) |')
P('| 랜드마크 과밀 | 16×16칸 구역 중 feature 장식 2개 이상인 구역 수 |')
P('| 위반 합계 | 위 정수 항목 합(빈 바닥 % 제외) |')
P('| 등급 | C = 상위 5(P6) 또는 배치 위반 가중(산발+기둥 낱개+3×특징 과밀+3×랜드마크 과밀) ≤4·빈 바닥 <12%·구획 고리 ≤1 / A = 빈 바닥 ≥25% 또는 가중 ≥20 또는 사유 2개 이상(빈 바닥 ≥20%·가중 ≥14·고리 ≥6·공간 수 3~7 밖) / 나머지 B |')
P('')
# 요약표
P('## 요약표 (66행)')
P('| 번호 | id | 이름 | 액트 | 종류 | 등급 | 위반 합계 | 빈 바닥 % | 공간 | 골격 공간 | 산발 | 특징과밀 | 기둥낱개 | 막다른 안내 | 고리(안내+구획) | 랜드마크과밀 |')
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for m, a in results:
    v = a['viol']
    P(f"| {a['no']} | {m['id']} | {m['name'].split(' (')[0]} | {m['act']} | {kind_of(m)} | **{a['grade']}** | {a['total']} | {a['empty_pct']:.0f} | {len(a['spaces'])} | {len(set(a['seq']))} | {v['scattered']} | {v['feat_spaces']} | {v['single_pillars']} | {v['dead_guides']} | {v['guide_loops']}+{v['space_cycles']} | {v['dense_blocks']} |")
P('')
P('## 액트별 통계')
P('| 액트 | 맵 | A | B | C | 위반 합계 평균 | 빈 바닥 % 평균 | 산발 합 | 기둥 낱개 합 | 고리 합(안내+구획) | 막다른 안내 합 |')
P('|---|---|---|---|---|---|---|---|---|---|---|')
for act in sorted(per_act):
    rs = [(m, a) for m, a in results if m['act'] == act]
    gc = collections.Counter(a['grade'] for m, a in rs)
    P(f"| {act} | {len(rs)} | {gc['A']} | {gc['B']} | {gc['C']} | {sum(a['total'] for m, a in rs) / len(rs):.1f} | {sum(a['empty_pct'] for m, a in rs) / len(rs):.1f} | {sum(a['viol']['scattered'] for m, a in rs)} | {sum(a['viol']['single_pillars'] for m, a in rs)} | {sum(a['viol']['guide_loops'] for m, a in rs)}+{sum(a['viol']['space_cycles'] for m, a in rs)} | {sum(a['viol']['dead_guides'] for m, a in rs)} |")
gc = collections.Counter(a['grade'] for m, a in results)
P(f"| 전체 | {len(results)} | {gc['A']} | {gc['B']} | {gc['C']} | {sum(a['total'] for m, a in results) / len(results):.1f} | {sum(a['empty_pct'] for m, a in results) / len(results):.1f} | {sum(a['viol']['scattered'] for m, a in results)} | {sum(a['viol']['single_pillars'] for m, a in results)} | {sum(a['viol']['guide_loops'] for m, a in results)}+{sum(a['viol']['space_cycles'] for m, a in results)} | {sum(a['viol']['dead_guides'] for m, a in results)} |")
P('')
P('## 작업 순서 제안 (액트 4 → 2 → 1 → 3, 액트 안에서는 A 먼저 · 위반 합계 큰 순)')
order = {4: 0, 2: 1, 1: 2, 3: 3}
seqd = sorted(results, key=lambda t: (order[t[0]['act']], {'A': 0, 'B': 1, 'C': 2}[t[1]['grade']], -t[1]['total']))
for act in (4, 2, 1, 3):
    items = [f"{m['id']}({a['grade']}·{a['total']})" for m, a in seqd if m['act'] == act]
    P(f"- 액트 {act}: " + ' → '.join(items))
P('- 표본(2.5단계): 대사제의 성소(sanctum) + 액트 4 사냥터 1장 — 액트 4 A 등급 첫 맵 권장.')
P('')
P('## 맵별 검수')
for m, a in results:
    G = a['G']; v = a['viol']
    rc = routes_csv.get(m['id'], {})
    P(f"### {a['no']} {m['id']} · {m['name']} — 등급 **{a['grade']}**")
    P(f"- 기본: 액트 {m['act']} · {kind_of(m)} · {m['w']}×{m['h']} · 걷는 칸 {a['floor']} · 엔티티(그림+기능) {m['entities']} · 입구 {DIR(G, a['start'])} → 전진 출구 {DIR(G, a['goal'])}" + (f" · 실측 길 {rc['route']}칸(routes.csv)" if rc else ' · routes.csv 행 없음'))
    P(f"- 등급 근거: {a['why']}")
    P('- 공간 구획 초안:')
    for i, s in enumerate(a['spaces']):
        P(f"  - {i + 1}. `{s['glyph']}` {s['name']} — **{s['func']}** · {s['cells']}칸{' · 골격' if s['on_skel'] else ''}{' · 특징 ' + str(s['features']) if s['features'] else ''}{' · ' + ','.join(s['gate']) if s['gate'] else ''}")
    names = {s['glyph']: s['name'].split(' (')[0] for s in a['spaces']}
    P(f"- 골격: {' → '.join(names.get(z, z) for z in a['seq']) or '미확인'} · 출구 {len(a['exits'])}개({', '.join(a['exits'])}) · 갈래(곁길 입구) {len(a['branch_exits'])}")
    diff = []
    if a['loops']: diff.append(f"길 안내 고리 {len(a['loops'])}개({', '.join(c['target'].split(':')[-1] for c in a['loops'])}) — 골격 밖")
    if a['dead_loops']: diff.append(f"막다른 공간 고리 {', '.join(a['dead_loops'])}")
    if a['side_dead']: diff.append(f"골격에 안 닿는 샛길 {a['side_dead']}줄")
    if m['mode'] == 'collide': diff.append('길 안내 없음(마을·보스방 정책)')
    P(f"- 현재 길 안내 ↔ 골격: {' · '.join(diff) if diff else '차이 없음'}")
    sk = ', '.join(f"{s}×{n}" for s, n in a['scattered_kinds'][:5])
    P(f"- 위반: 산발 복제 {v['scattered']}{' (' + sk + ')' if sk else ''} · 특징 과밀 공간 {v['feat_spaces']} · 기둥 낱개 {v['single_pillars']}/{a['pillars']} · 빈 바닥 {a['empty_pct']:.0f}% (바탕 {a['base_pct']:.0f}%, 넓은 빈 바닥 {a['wide_empty']}칸) · 막다른 길 안내 {v['dead_guides']} · 고리 {v['guide_loops']}+{v['space_cycles']} · 랜드마크 과밀 {v['dense_blocks']} (특징 {a['nfeat']}개) → 합계 **{a['total']}**")
    P('- 재구성 제안:')
    for ln in a['proposal']: P(f"  - {ln}")
    P('')
open(MD, 'w').write('\n'.join(md) + '\n')
print('done', len(results), collections.Counter(a['grade'] for m, a in results))
