# 드롭 시뮬레이션 (docs/design/19 5단계). LootSystem.RollDrops · ItemData(Generate·RollRarity·PickBase·PickUnique·PickSetPiece·MakeRune)를 그대로 옮겨
# 난이도별 10만 처치에서 무엇이 얼마나 나오는지 센다. 사용:
#   python3 tools/sim_drops.py                → 지금 data/
#   python3 tools/sim_drops.py --draft        → data/ 위에 docs/design/19-drafts/*.csv를 덮어 (3단계 초안)
#   --out <파일.md> 로 결과를 마크다운으로 남긴다
import csv, io, os, random, sys
from collections import Counter, defaultdict

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DRAFT = '--draft' in sys.argv
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
random.seed(19)

def load(name):
    p = os.path.join(ROOT, 'docs/design/19-drafts', name + '.csv')
    if not (DRAFT and os.path.exists(p)): p = os.path.join(ROOT, 'data', name + '.csv')
    return list(csv.DictReader(open(p, encoding='utf-8')))

num = lambda v, d=0: float(v) if v not in (None, '') else d
cfg = {r['key']: r['value'] for r in load('config')}
diff = {int(r['index']): int(r['levelBonus']) for r in load('difficulty')}
bases = {r['id']: r for r in load('item_bases')}
base_order = [r['id'] for r in load('item_bases') if r.get('drop') != 'false']
uniques = load('item_uniques')
sets = {r['id']: r for r in load('item_sets')}
pieces = load('item_set_pieces')
runes = load('runes')
runewords = load('runewords')
drops = {r['rank']: r for r in load('drop_tables')}
density = num(cfg['densityRewardMult']); boss_excl = num(cfg['bossExclusiveShare'])

def old_weight(item_lv, ilvl, gap): return 1 if item_lv >= ilvl - gap else 0.3
def wpick(items, weights):
    t = sum(weights)
    if not items or t <= 0: return None
    r = random.random() * t
    for it, w in zip(items, weights):
        r -= w
        if r <= 0: return it
    return items[-1]

def pick_base(ilvl):
    l, w = [], []
    for b in base_order:
        lv = int(bases[b]['reqLv'])
        if lv <= ilvl + 3 and lv >= ilvl - 40: l.append(b); w.append(old_weight(lv, ilvl, 15))
    return wpick(l, w) or base_order[0]

def roll_rarity(rank, mf):
    d = drops[rank]; m = 1 + min(1.5, mf / (mf + 100) * 2.5); r = random.random() * 100
    u, s, ra, ma = num(d['unique']), num(d['set']), num(d['rare']), num(d['magic'])
    if r < u * m: return 3
    if r < (u + s) * m: return 4
    if r < (u + s + ra) * m: return 2
    if r < (u + s + ra) * m + ma * m: return 1
    return 0

def pick_unique(ilvl, source):
    by = defaultdict(lambda: ([], []))
    for u in uniques:
        b = bases.get(u['base'])
        if u['source'] == source and b and int(b['reqLv']) <= ilvl + 3:
            l, w = by[u.get('tree') or 'any']; l.append(u); w.append(old_weight(int(b['reqLv']), ilvl, 25) * num(u.get('weight'), 1))
    if not by: return None
    if source != '':
        # 보스 전용: 그 난이도에서 나올 수 있는 가장 높은 등급만 (ItemData.PickUnique와 같다)
        allu = [(u, w) for l, ws in by.values() for u, w in zip(l, ws)]
        top = max(int(bases[u['base']].get('grade') or 0) for u, _ in allu)
        allu = [(u, w) for u, w in allu if int(bases[u['base']].get('grade') or 0) == top]
        return wpick([u for u, _ in allu], [w for _, w in allu])
    l, w = by[random.choice(list(by))]
    return wpick(l, w)

def pick_set_piece(ilvl):
    by = defaultdict(lambda: ([], []))
    for p in pieces:
        b = bases.get(p['base'])
        if b and int(b['reqLv']) <= ilvl + 3 and int(b['reqLv']) >= ilvl - 40:
            l, w = by[p['set']]; l.append(p); w.append(old_weight(int(b['reqLv']), ilvl, 25))
    if not by: return None
    l, w = by[random.choice(list(by))]
    return wpick(l, w)

def make_rune(lv):
    l = [r for r in runes if int(r['minLevel']) <= lv]
    return wpick(l, [num(r['dropWeight']) for r in l])

# 처치 구성 (10만 처치 가정): 일반 88% · 정예 8% · 변종 우두머리 3% · 최상위 0.8% · 보스 0.2%
MIX = [('normal', 88000), ('elite', 8000), ('champion', 3000), ('unique', 800), ('boss', 200)]
BOSSES = ['grave_queen', 'skel_captain', 'headsman', 'high_priest', 'admiral']   # 보스 처치는 액트 보스 5종을 고르게

def run(level, mf):
    out = Counter(); uniq = Counter(); setp = Counter(); setc = Counter(); rune = Counter(); trees = Counter(); grades = Counter()
    for rank, n in MIX:
        d = drops[rank]; special = rank in ('boss', 'unique'); keep = 1 if special else density
        ws = [num(d['none']), num(d['gold']), num(d['potion']), num(d['item']), num(d['rune'])]
        for _ in range(n):
            for _ in range(int(num(d['picks']))):
                r = random.random() * sum(ws)
                if random.random() >= keep: r = 0
                if r < ws[0] + ws[1] + ws[2]: continue
                if r < sum(ws[:4]):
                    rar = roll_rarity(rank, mf)
                    b = pick_base(level); grades[int(bases[b].get('grade') or 0)] += 1
                    if rar == 4:
                        p = pick_set_piece(level)
                        if p: out['set'] += 1; setp[p['name']] += 1; setc[p['set']] += 1; continue
                        rar = 2
                    if rar == 3:
                        u = None
                        if special and random.random() < boss_excl: u = pick_unique(level, random.choice(BOSSES) if rank == 'boss' else '__none__')
                        u = u or pick_unique(level, '')
                        if u: out['unique'] += 1; uniq[u['name']] += 1; trees[u.get('tree') or 'any'] += 1; continue
                        rar = 2
                    if rar == 0 and num(bases[b]['dmg']) <= 0 and num(bases[b]['def']) <= 0: rar = 1
                    out[{0: 'normal', 1: 'magic', 2: 'rare'}[rar]] += 1
                else:
                    ru = make_rune(level); rune[ru['name']] += 1; out['rune'] += 1
    return out, uniq, setp, setc, rune, trees, grades

lines = []
P = lines.append
P(f"# 드롭 시뮬레이션 — {'3단계 초안' if DRAFT else '지금 데이터'} (tools/sim_drops.py)\n")
P("- 처치 10만 마리: 일반 88% · 정예 8% · 변종 우두머리 3% · 최상위 0.8% · 보스 0.2% (보스는 액트 보스 5종을 고르게)")
P("- 아이템 레벨: 보통 15 · 악몽 45 · 지옥 75 (난이도 가산 포함). 아이템 발견 0%와 200%")
P(f"- 유니크 {len(uniques)}종 · 세트 {len(sets)}개 / {len(pieces)}조각 · 룬워드 {len(runewords)}\n")
names = {0: '보통', 1: '악몽', 2: '지옥'}
for tier, level in ((0, 15), (1, 45), (2, 75)):
    for mf in (0, 200):
        out, uniq, setp, setc, rune, trees, grades = run(level, mf)
        P(f"## {names[tier]} (아이템 레벨 {level}) · 아이템 발견 {mf}%\n")
        P("| 일반 | 마법 | 레어 | 유니크 | 세트 | 룬 |\n| ---: | ---: | ---: | ---: | ---: | ---: |")
        P(f"| {out['normal']} | {out['magic']} | {out['rare']} | {out['unique']} | {out['set']} | {out['rune']} |\n")
        g = sum(grades.values()) or 1
        P(f"- 베이스 등급: 일반형 {grades[0]*100//g}% · 강화형 {grades[1]*100//g}% · 정예형 {grades[2]*100//g}%")
        if out['unique']:
            top = uniq.most_common(3); share = sum(c for _, c in top) * 100 // out['unique']
            P(f"- 유니크 {len(uniq)}종이 나옴 · 가장 많이 나온 3종이 {share}% ({', '.join(f'{n} {c}' for n, c in top)})")
            P(f"- 유니크 계열: " + ' · '.join(f"{ {'command':'소환','soul':'영혼','curse':'저주','any':'범용'}[k]} {v}" for k, v in sorted(trees.items())))
        if out['set']:
            P(f"- 세트 {len(setc)}개에서 조각 {out['set']}개: " + ' · '.join(f"{sets[k]['name']} {v}" for k, v in setc.most_common()))
        if out['rune']:
            P(f"- 룬 {len(rune)}종 · 가장 드문 것: " + ', '.join(f'{n} {c}' for n, c in sorted(rune.items(), key=lambda x: x[1])[:3]))
        P("")
text = '\n'.join(lines)
print(text)
if OUT: open(OUT, 'w', encoding='utf-8').write(text + '\n')
