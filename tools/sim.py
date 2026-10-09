#!/usr/bin/env python3
"""밸런스 시뮬레이터 (표준 라이브러리만 사용). 모든 수치는 data/*.csv 의 [가정] 값.

사용:
  python3 tools/sim.py exp                       레벨 곡선 표
  python3 tools/sim.py fight --level 10 --monster skelwarrior --rank elite --count 5 --shadows 5 --shadow-level 3
  python3 tools/sim.py economy --monster hellhound --kills 200
"""
import argparse, csv, pathlib, random

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def load(name, key):
    with (DATA / name).open(encoding="utf-8", newline="") as f:
        return {r[key]: r for r in csv.DictReader(f)}


CFG = {k: float(v["value"]) for k, v in load("config.csv", "key").items()}
MON = load("monsters.csv", "id")
RANK = load("monster_ranks.csv", "rank")


def exp_to_next(n):
    return round(CFG["expCurveCoef"] * n ** CFG["expCurveExp"])


def def_reduction(defense, attacker_level):
    return defense / (defense + CFG["defConstPerLevel"] * attacker_level)


def monster_stats(mid, level, rank):
    m, r = MON[mid], RANK[rank]
    d = level - float(m["baseLevel"])
    hp = float(m["baseHp"]) * (1 + CFG["monsterHpPerLevel"] * max(level - 1, 0)) / (1 + CFG["monsterHpPerLevel"] * max(float(m["baseLevel"]) - 1, 0))
    dmg = float(m["baseDmg"]) * (1 + CFG["monsterDmgPerLevel"] * max(level - 1, 0)) / (1 + CFG["monsterDmgPerLevel"] * max(float(m["baseLevel"]) - 1, 0))
    return {"hp": hp * float(r["hpMul"]), "dmg": dmg * float(r["dmgMul"]),
            "interval": float(m["atkIntervalSec"]), "def": float(m["def"])}


def shadow_stats(src_hp, src_dmg, shadow_level):
    # 게임(ShadowConfig.GetAtkScale/GetHpScale)과 같은 곡선: 생명 shadowHpMul, 공격 shadowStatMul × 몬스터 성장
    n = max(shadow_level, 1) - 1
    return (src_hp * CFG["shadowHpMul"] * (1 + CFG["monsterHpPerLevel"] * n),
            src_dmg * CFG["shadowStatMul"] * (1 + CFG["monsterDmgPerLevel"] * n))


def cmd_exp(a):
    total = 0
    print("레벨  다음필요경험치  누적")
    for n in range(1, int(CFG["levelCap"])):
        e = exp_to_next(n)
        total += e
        if n in (1, 5, 10, 15, 20, 30, 40, 50, 60, 70, 79):
            print("%3d  %13d  %12d" % (n, e, total))


def cmd_fight(a):
    base = MON[a.monster]
    mlv = a.mlevel or a.level
    ms = monster_stats(a.monster, mlv, a.rank)
    # 그림자 원본은 같은 종 일반 등급 기준
    src = monster_stats(a.monster, mlv, "normal")
    s_hp, s_dmg = shadow_stats(src["hp"], src["dmg"], a.shadow_level)
    p_dps = CFG["playerBaseDps"] * (1 + CFG["playerDpsPerLevel"] * (a.level - 1))
    p_hp = CFG["playerBaseHp"] + CFG["playerHpPerLevel"] * (a.level - 1) + a.vitality * 3
    s_dps = s_dmg / src["interval"]
    wins = 0
    ttk, lost, p_dead = [], [], 0
    dt = CFG["aiTickSec"]
    for _ in range(a.runs):
        shadows = [s_hp] * a.shadows
        mons = [ms["hp"]] * a.count
        php, t = p_hp, 0.0
        while mons and t < 300:
            t += dt
            # 아군 공격: 앞 몬스터 하나에 집중
            dmg = (p_dps + s_dps * len(shadows)) * dt * random.uniform(0.85, 1.15)
            while dmg > 0 and mons:
                take = min(dmg, mons[0])
                mons[0] -= take
                dmg -= take
                if mons[0] <= 1e-9:
                    mons.pop(0)
            # 몬스터 공격: 살아있는 몬스터가 그림자/플레이어 중 무작위 대상
            for _m in mons[:4]:
                targets = len(shadows) + 1
                hit = ms["dmg"] * dt / ms["interval"]
                i = random.randrange(targets)
                if i < len(shadows):
                    shadows[i] -= hit
                else:
                    php -= hit * (1 - def_reduction(a.defense, mlv))
            shadows = [h for h in shadows if h > 0]
            if php <= 0:
                p_dead += 1
                break
        if not mons:
            ttk.append(t)
            lost.append(a.shadows - len(shadows))
            wins += 1
    print("몬스터: %s %s x%d (Lv%d)  HP %.0f 공격 %.1f/%.1fs" % (base["name"], a.rank, a.count, mlv, ms["hp"], ms["dmg"], ms["interval"]))
    print("플레이어: Lv%d HP %.0f DPS %.1f / 그림자 %d기 (Lv%d) HP %.0f DPS %.1f" % (a.level, p_hp, p_dps, a.shadows, a.shadow_level, s_hp, s_dps))
    print("승률 %.1f%%  플레이어 사망 %.1f%%" % (100 * wins / a.runs, 100 * p_dead / a.runs))
    if ttk:
        print("평균 처치 시간 %.1fs  평균 그림자 손실 %.2f기" % (sum(ttk) / len(ttk), sum(lost) / len(lost)))


def cmd_economy(a):
    r = RANK[a.rank]
    p, grade = float(r["extractChance"]), int(r["shadowGrade"])
    yield_ = CFG["disassembleYield_g%d" % grade] if grade < 3 else 0
    got = sum(1 for _ in range(a.kills) if random.random() < p)
    print("%s(%s) %d회 처치 -> 그림자 %d기 (기대 %.1f)" % (MON[a.monster]["name"], a.rank, a.kills, got, a.kills * p))
    print("전부 분해 시 그림자 정수 %d (등급%d 기준)" % (got * yield_, grade))
    print("기대 처치 수/그림자 1기: %.1f" % (1 / p))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("exp").set_defaults(fn=cmd_exp)
    f = sp.add_parser("fight")
    f.add_argument("--level", type=int, default=10)
    f.add_argument("--mlevel", type=int)
    f.add_argument("--monster", default="cinder_soldier", choices=list(MON))
    f.add_argument("--rank", default="normal", choices=list(RANK))
    f.add_argument("--count", type=int, default=5)
    f.add_argument("--shadows", type=int, default=5)
    f.add_argument("--shadow-level", type=int, default=1)
    f.add_argument("--vitality", type=int, default=0)
    f.add_argument("--defense", type=float, default=0)
    f.add_argument("--runs", type=int, default=500)
    f.set_defaults(fn=cmd_fight)
    e = sp.add_parser("economy")
    e.add_argument("--monster", default="wild_dog", choices=list(MON))
    e.add_argument("--rank", default="normal", choices=list(RANK))
    e.add_argument("--kills", type=int, default=200)
    e.set_defaults(fn=cmd_economy)
    a = ap.parse_args()
    random.seed(1)
    a.fn(a)


if __name__ == "__main__":
    main()
