#!/usr/bin/env python3
"""액트 2·3 클리어 속도 추정 (표준 라이브러리만). 게임 코드 공식을 그대로 옮기고 data/*.csv 를 직접 읽는다.

공식 출처 (2026-10-13 기준 코드)
  몬스터 생명·공격      Monster.RecomputeMaxHp · MonsterAttack.ScaleToLevel (메이커 실측: 가라앉은 대로 Lv17 미라 1320/55 일치)
  해골·마법사           UndeadSystem.GetBaseStats × (1 + 소환수 %)
  그림자                ShadowConfig.GetProfile · statMul = (1 + (그림자 소환 3%/랭크 + 군령 8%/랭크 + 소환수 %)/100) × 강화(+6%/단계)
  플레이어 생명·방어    PlayerStats (생명 60 + 1.5/레벨 + 활력×3, 물리 피해 ×100/(100+방어))
  레벨 차 보정·경험치   GameConst.LevelGap* · PlayerStats.ExpForKill

가정(코드에 없는 값)은 PROFILES 와 ASSUME 에 모았다. 사용:
  python3 tools/sim_clear.py            # 액트 2·3 전체 표
  python3 tools/sim_clear.py --eff 0.5  # 전투 효율 가정만 바꿔 보기
  python3 tools/sim_clear.py --walls --exp-k 0.08 --boss-hp 3.0   # 수정안: 액트 보스 「벽」 (도착 레벨·보스전·벽을 넘는 사냥 시간)
"""
import argparse, csv, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def rows(name):
    with (DATA / name).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


C = {r["key"]: float(r["value"]) for r in rows("config.csv") if r["value"].replace(".", "", 1).replace("-", "", 1).isdigit()}
MON = {r["id"]: r for r in rows("monsters.csv")}
MAPS = [r for r in rows("maps.csv") if r["act"] in ("2", "3")]
SKILL = {r["id"]: r for r in rows("skills.csv")}
BASES = rows("item_bases.csv")
QUEST_EXP = {}
QUEST_MAPS = set()
for q in rows("quests.csv"):
    if q["act"] in ("2", "3"):
        QUEST_EXP[q["map"]] = QUEST_EXP.get(q["map"], 0) + float(q["exp"] or 0)
        QUEST_MAPS.add(q["map"])
PARENT = {m["id"]: m["parent"] for m in MAPS}
for m in MAPS:
    if m["kind"] == "side" and not m["parent"]:
        PARENT[m["id"]] = PARENT.get(m["id"][:-1] + "1", "")
# 곁가지는 들어가는 필드 바로 뒤에 돈다
_ordered = []
for m in MAPS:
    if m["kind"] != "side":
        _ordered.append(m)
        _ordered += [x for x in MAPS if x["kind"] == "side" and PARENT[x["id"]] == m["id"]]
MAPS = _ordered
NAMED = {r["map"]: r for r in rows("named.csv") if r["id"]}

ASSUME = {
    "speed": 1.5,        # 이동 u/s (메이커 실측: InputSpeed 1.6 · 2초 입력에 2.6 이동 → 지연 포함 1.3~1.6)
    "routeMul": 2.2,     # 필드 한 판 경로 = 맵 가로 × 이 값 (두 번 훑기)
    "killShare": 0.85,   # 지나가며 잡는 몬스터 비율
    "eff": 0.6,          # 군단 전투 효율 (조준·이동·과잉 피해·재소환 공백)
    "overhead": 25,      # 맵당 줍기·창 열기·정비(초)
    "bossEff": 0.5,      # 보스전 효율 (슬램에 소환수 손실·재소환)
    "aggroShare": 0.3,   # 몬스터 공격 중 플레이어에게 오는 비율
}

# 60~70% 성능 = 「바로바로 쓰지만 최적은 아닌」 사람. 100%는 가능한 최고 투자, 40%는 대충 하는 사람.
PROFILES = {
    "P100": dict(order=["raise_skeleton:1", "skel_legion:2", "skeleton_mastery:5", "shadow_summon:cap", "command_mastery:5",
                        "deploy_expand:3", "raise_skeleton:cap", "raise_mage:cap", "mage_legion:2", "mage_focus:5", "mark_weakness:cap"],
                 stat=dict(str=0.5, vit=0.4, dex=0.1, ene=0.0), gearMinion=1.0, tree=(2, 3), plus=1.0, lvLag=0, ratio=1.43,
                 elites=2, gearTierLag=0, life=30, res=40, markUp=0.6),
    "P65": dict(order=["raise_skeleton:1", "skeleton_mastery:4", "shadow_summon:cap-1", "command_mastery:4", "deploy_expand:3",
                       "skel_legion:1", "bone_shard:4", "bone_armor:3", "raise_skeleton:cap-2", "corpse_blast:2", "raise_mage:2",
                       "poison_mist:3", "mark_weakness:3", "bone_spear:cap", "shadow_summon:cap", "raise_skeleton:cap"],
                stat=dict(str=0.35, vit=0.35, dex=0.15, ene=0.15), gearMinion=0.6, tree=(1, 1), plus=0.6, lvLag=1, ratio=1.3,
                elites=1, gearTierLag=1, life=15, res=20, markUp=0.25),
    "P40": dict(order=["raise_skeleton:1", "bone_shard:6", "shadow_summon:cap-4", "bone_armor:4", "corpse_blast:4",
                       "raise_skeleton:cap-4", "skeleton_mastery:1", "command_mastery:1", "deploy_expand:1", "poison_mist:5",
                       "soul_drain:4", "bone_spear:cap", "raise_skeleton:cap"],
                stat=dict(str=0.15, vit=0.3, dex=0.25, ene=0.3), gearMinion=0.0, tree=(0, 0), plus=0.0, lvLag=4, ratio=1.0,
                elites=0, gearTierLag=2, life=5, res=5, markUp=0.0),
}


def cap(sid, L):
    s = SKILL[sid]
    row, mx = int(s["row"]), int(s["maxLv"])
    if L < row:
        return 0
    if s["kind"] == "node":
        return mx
    return min(mx, 1 + (L - row) // 2)


def allocate(order, L):
    pts = 1 + int(C["skillPerLevel"]) * (L - 1)
    rk = {}
    for item in order:
        sid, want = item.split(":")
        c = cap(sid, L)
        if want.startswith("cap"):
            n = c - (int(want[4:]) if "-" in want else 0)
        else:
            n = int(want)
        n = max(0, min(n, c))
        add = max(0, min(n - rk.get(sid, 0), pts))
        rk[sid] = rk.get(sid, 0) + add
        pts -= add
    return rk, pts


def best_base(slot, L, lag, field):
    cand = sorted([b for b in BASES if b["slot"] == slot and int(b["reqLv"]) <= L and not b["id"].startswith("ashen")],
                  key=lambda b: int(b["reqLv"]))
    if not cand:
        return 0
    return float(cand[max(0, len(cand) - 1 - lag)][field])


def build(name, L):
    p = PROFILES[name]
    rk, left = allocate(p["order"], L)
    sp = 5 * (L - 1)
    st = {k: int(sp * v) for k, v in p["stat"].items()}
    Str, Vit, Dex, Ene = 15 + st["str"], 15 + st["vit"], 25 + st["dex"], 25 + st["ene"]
    gm = 0.42  # gearMult 0.7 × gearTierNormal 0.6
    minion_gear = p["gearMinion"] * (3 * 15 * gm if L < 25 else (2 * 30 + 15) * gm)
    minion = minion_gear + (Str - 15) * C["strMinionPct"]
    tree = p["tree"][0] if L < 25 else p["tree"][1]
    if L < 12:
        tree = 0
    # 해골 전사
    sl = rk.get("raise_skeleton", 0) + tree
    mast = 1 + C["skeletonMasteryPct"] * rk.get("skeleton_mastery", 0) / 100
    atkGrow = 1 + C["monsterDmgPerLevel"] * C["summonGrowthMul"] * (L - 1)
    hpGrow = 1 + C["monsterHpPerLevel"] * C["summonGrowthMul"] * (L - 1)
    def undead(base_atk, base_hp, lvl):
        sk = 1 + C["undeadSkillLvPct"] * max(0, lvl - 1) / 100
        return (math.floor(base_atk * atkGrow * sk * mast) * (1 + minion / 100),
                math.floor(base_hp * hpGrow * sk * mast) * (1 + minion / 100))
    def count(lvl, legion):
        if lvl <= 0:
            return 0
        return (lvl if lvl <= 3 else min(8, 2 + lvl // 3)) + legion
    sk_atk, sk_hp = undead(C["skeletonAtkBase"], C["skeletonHpBase"], sl)
    n_sk = count(sl, rk.get("skel_legion", 0))
    ml = rk.get("raise_mage", 0) + (tree if rk.get("raise_mage", 0) else 0)
    mg_atk, _ = undead(C["mageAtkBase"], C["mageHpBase"], ml)
    mg_atk *= 1 + 0.1 * rk.get("mage_focus", 0)
    n_mg = count(ml, rk.get("mage_legion", 0))
    # 그림자
    ss = rk.get("shadow_summon", 0) + (tree if rk.get("shadow_summon", 0) else 0)
    unit = 1 + (C["shadowSummonPerLvPct"] * max(0, ss - 1) + 8 * rk.get("command_mastery", 0) + minion) / 100
    plus = math.floor(p["plus"] * (L // 3))
    sm = unit * (1 + C["shadowPlusPct"] / 100 * plus)
    eff = max(1, L - p["lvLag"])
    atkScale = C["shadowStatMul"] * (1 + C["monsterDmgPerLevel"] * C["summonGrowthMul"] * (eff - 1))
    hpScale = C["shadowHpMul"] * (1 + C["monsterHpPerLevel"] * C["summonGrowthMul"] * (eff - 1))
    if ss <= 0:
        n_sh = 0
    elif L < C["shadowFullLevel"]:
        n_sh = 1
    else:
        n_sh = min(int(C["deployBase"]) + rk.get("deploy_expand", 0), int(C["hardCap"]))
    n_el = min(p["elites"], n_sh)
    sh_cd = 1.6 * C["shadowCooldownMul"]  # 원본 공격 간격 평균 1.6초
    sh_n = C["shadowSourceAtk_g1"] * p["ratio"] * atkScale * sm
    sh_e = C["shadowSourceAtk_g2"] * 1.3 * atkScale * sm
    sh_hp = C["shadowSourceHp_g1"] * 2.0 * hpScale * sm
    dps = {
        "해골": n_sk * sk_atk / C["skeletonCooldown"],
        "마법사": n_mg * mg_atk / C["mageCooldown"],
        "그림자": ((n_sh - n_el) * sh_n + n_el * sh_e) / sh_cd,
    }
    # 플레이어: 평타 30% 가동 + 마나가 허락하는 만큼 스킬
    wpn = best_base("weapon", L, p["gearTierLag"], "dmg")
    ias = min(C["iasCap"], Dex * C["dexIasPct"])
    melee = (C.get("playerBaseDamage", 12) + wpn) * (1 + Dex * C["dexMeleePct"] / 100) / (C["baseAttackInterval"] / (1 + ias / 100))
    spell_pct = Ene * C["eneSpellPct"]
    scale = C["skillPowerMult"] * (1 + C["skillDmgPerCharLevel"] * (L - 1)) * C["skillDmgMult"] * (1 + spell_pct / 100)
    max_mana = 40 + 2 * (L - 1) + (Ene - 25) * 2
    regen = max_mana * C["manaRegenPct"] + Ene * C["manaRegenPerEne"]
    spells = []
    if rk.get("bone_spear"):
        spells.append(((30 + 12 * (rk["bone_spear"] - 1)) * scale * 2.0, 14, 1.2))   # 관통 평균 2마리
    if rk.get("bone_shard"):
        spells.append(((10 + 6 * (rk["bone_shard"] - 1)) * C.get("boneShardDmgMul", 1) * scale * 1.5, 5, 0.75))
    spell_dps = 0
    budget = regen
    for dmg, mana, cd in sorted(spells, key=lambda s: -s[0] / s[1]):
        casts = min(1 / cd, budget / mana)
        spell_dps += dmg * casts
        budget -= casts * mana
    dps["플레이어"] = melee * 0.3 + spell_dps
    mark = rk.get("mark_weakness", 0)
    taken = 1 + p["markUp"] * (0.2 + 0.02 * mark) if mark else 1
    hp = 60 + 1.5 * (L - 1) + (Vit - 15) * 3 + p["life"]
    lag = p["gearTierLag"]
    defense = sum(best_base(s, L, lag, "def") for s in ("armor", "helm", "offhand")) + (6 if lag == 0 else 3) + Dex // 4
    return dict(L=L, rk=rk, left=left, dps=dps, total=sum(dps.values()) * taken, hp=hp, defense=defense, res=p["res"],
                n_sk=n_sk, n_mg=n_mg, n_sh=n_sh, plus=plus, minion=minion, sk_hp=sk_hp, sh_hp=sh_hp, sm=sm, taken=taken)


def mon(mid, L, statMul, elite=False):
    m = MON[mid]
    bl = int(m["baseLevel"])
    k = C["monsterHpPerLevel"]
    hp = float(m["baseHp"]) * (1 + k * (L - 1)) / (1 + k * (bl - 1))
    if int(m["grade"]) == 2 and m["unique"].lower() != "true":
        hp *= C["eliteHpMul"]
    elif elite:
        hp *= C["eliteHpMul"]
    if int(m["grade"]) >= 3:
        hp *= C.get("bossWallHpMul", C["bossHpMul"]) if L >= C.get("bossWallFromLevel", 99) else C["bossHpMul"]
    hp *= statMul
    dmg = float(m["baseDmg"]) * (1 + C["monsterDmgPerLevel"] * (L - bl)) * statMul
    if int(m["grade"]) >= 3:
        dmg *= C["bossDmgMul"]
    if m["behavior"] == "phase":
        hp *= 1.3  # 반투명 동안 받는 피해 -50% (대략 30% 시간)
    return hp, dmg, float(m["atkIntervalSec"]), m["element"] or "phys"


def gap_dealt(pl, ml):
    over = ml - pl - 1
    return 1 if over <= 0 else max(0.25, 1 - 0.035 * over)


def gap_taken(pl, ml):
    over = ml - pl - 1
    return 1 if over <= 0 else 1 + min(0.45, 0.015 * over)


def exp_next(n):
    return round(C["expCurveCoef"] * n ** C["expCurveExp"])


EXP_K = C.get("expHighLevelPct", 0) / 100   # Lv12 넘는 몬스터의 처치 경험치 +EXP_K × (몬스터 레벨 − 12) (config expHighLevelPct, 10-13 W1)


def kill_exp(pl, ml, grade):
    g = 1 if grade == 1 else (3 if grade == 2 else 12)
    b = C["killExpCoef"] * ml ** 1.3 * g
    d = pl - ml
    if d >= 10:
        b *= 0.05
    elif d >= 5:
        b *= 1 - (d - 4) * 0.15
    if ml > pl + 5:
        b *= (pl + 5) / ml
    return b * (1 + EXP_K * max(0, ml - C.get("expHighLevelFrom", 12)))


def hits_to_die(b, dmg, element, pl, ml):
    taken = dmg * gap_taken(pl, ml)
    if element == "phys":
        taken *= 100 / (100 + b["defense"])
    else:
        taken *= 1 - b["res"] / 100
    return b["hp"] / max(1, taken), taken


def in_route(mp, route):
    if mp["kind"] != "side":
        return True
    if route == "all":
        return True
    if route == "quest":
        # 퀘스트가 가리키는 곁가지와 그 앞 층
        return mp["id"] in QUEST_MAPS or any(PARENT.get(q) == mp["id"] or (q[:-1] == mp["id"][:-1] and q[-1:] > mp["id"][-1:]) for q in QUEST_MAPS)
    return False


def run(profile, start_level, start_exp, route):
    L, exp = start_level, start_exp
    out = []
    total = 0
    for mp in MAPS:
        if mp["kind"] == "town":
            continue
        if not in_route(mp, route):
            continue
        sm = float(mp["statMul"] or 1)
        b = build(profile, L)
        t_combat, gained, worst, wh = 0, 0, (99, ""), 0
        for tok in filter(None, mp["spawns"].split(";")):
            mid, n, ml = tok.split(":")
            n, ml = int(n), int(ml)
            ec = float(mp["eliteChance"] or 0) + 0.2 / max(1, float(mp["packSize"] or 3))
            hp, dmg, iv, el = mon(mid, ml, sm)
            ehp, _, _, _ = mon(mid, ml, sm, elite=True)
            g2 = int(MON[mid]["grade"]) == 2
            avg_hp = hp if g2 else hp * (1 - ec) + ehp * ec
            kills = n * ASSUME["killShare"]
            t_combat += kills * avg_hp / (b["total"] * ASSUME["eff"] * gap_dealt(L, ml))
            gained += kills * kill_exp(L, ml, 2 if g2 else 1) * (1 + (2 * ec if not g2 else 0))
            htd, per = hits_to_die(b, dmg, el, L, ml)
            if htd < worst[0]:
                worst = (htd, MON[mid]["name"])
                wh = per
        boss = ""
        nm = NAMED.get(mp["id"])
        if nm and nm["model"] in MON:
            ml = max(int(t.split(":")[2]) for t in mp["spawns"].split(";") if t) + int(nm["levelAdd"])
            hp, dmg, iv, el = mon(nm["model"], ml, sm)
            hp *= float(nm["hpMul"] or 1)
            bt = hp / (b["total"] * ASSUME["bossEff"] * gap_dealt(L, ml))
            t_combat += bt
            htd, per = hits_to_die(b, dmg, el, L, ml)
            boss += "%s %.0f초(생명 %.0f · 한 대 %.0f → %.1f대에 사망) " % (nm["name"], bt, hp, per, htd)
        for tok in filter(None, mp["fixed"].split(";")):
            bid = tok.split("@")[0]
            m = MON[bid]
            ml = int(m["baseLevel"])
            hp, dmg, iv, el = mon(bid, ml, sm)
            bt = hp / (b["total"] * ASSUME["bossEff"] * gap_dealt(L, ml))
            t_combat += bt
            htd, per = hits_to_die(b, dmg, el, L, ml)
            gained += kill_exp(L, ml, int(m["grade"]))
            boss += "%s %.0f초(생명 %.0f · 한 대 %.0f → %.1f대에 사망) " % (m["name"], bt, hp, per, htd)
        travel = float(mp["w"]) * ASSUME["routeMul"] / ASSUME["speed"] if mp["spawns"] else float(mp["w"]) / ASSUME["speed"]
        t = t_combat + travel + ASSUME["overhead"]
        total += t
        gained += QUEST_EXP.get(mp["id"], 0)
        exp += gained
        while exp >= exp_next(L):
            exp -= exp_next(L)
            L += 1
        lvls = [int(tok.split(":")[2]) for tok in mp["spawns"].split(";") if tok] or [int(MON[tok.split("@")[0]]["baseLevel"]) for tok in mp["fixed"].split(";") if tok]
        out.append(dict(id=mp["id"], kind=mp["kind"], act=mp["act"], name=mp["name"], mlv="%d~%d" % (min(lvls), max(lvls)),
                        pl=b["L"], combat=t_combat, travel=travel, t=t, total=total, worst=worst, wh=wh, boss=boss, b=b, L_after=L))
    return out


def farm_rate(prof, L, mapid):
    # 그 맵을 한 판 돌 때 초당 경험치 (벽 앞에서 앞 사냥터를 다시 도는 경우)
    mp = [m for m in MAPS if m["id"] == mapid][0]
    b = build(prof, L)
    t = g = 0
    for tok in mp["spawns"].split(";"):
        mid, n, ml = tok.split(":")
        n, ml = int(n), int(ml)
        hp, _, _, _ = mon(mid, ml, float(mp["statMul"] or 1))
        g2 = int(MON[mid]["grade"]) == 2
        mul = 1 if g2 else 1 + 2 * float(mp["eliteChance"] or 0)
        t += n * ASSUME["killShare"] * hp * mul / (b["total"] * ASSUME["eff"] * gap_dealt(L, ml))
        g += n * ASSUME["killShare"] * kill_exp(L, ml, 2 if g2 else 1) * mul
    t += float(mp["w"]) * ASSUME["routeMul"] / ASSUME["speed"] + ASSUME["overhead"]
    return g / t


def walls(route):
    # 액트 보스 앞: 한 번씩 돌고 도착한 레벨, 그 레벨의 보스전(초·몇 대에 죽나), 보스 레벨−1까지 앞 맵을 다시 도는 시간
    print("\n== 액트 보스 벽 (처치 경험치 보정 %.2f/레벨 · 액트 2·3 보스 생명 배율 %.1f) ==" % (EXP_K, C.get("bossWallHpMul", C["bossHpMul"])))
    for prof in PROFILES:
        rs = run(prof, 13, 0, route)
        d = {r["id"]: r for r in rs}
        out = []
        for bid, mapid, farm in (("highpriest", "sanctum", "temple3"), ("admiral", "stormeye", "lighthouse3")):
            L = d[mapid]["pl"]
            m = MON[bid]
            bl = int(m["baseLevel"])
            hp, dmg, _, el = mon(bid, bl, 1.3)
            b = build(prof, L)
            ttk = hp / (b["total"] * ASSUME["bossEff"] * gap_dealt(L, bl))
            htd, _ = hits_to_die(b, dmg, el, L, bl)
            sec, lv = 0, L
            while lv < bl - 1:
                sec += exp_next(lv) / farm_rate(prof, lv, farm)
                lv += 1
            out.append("%s 도착 Lv%d · %.0f초 · %.1f대에 사망 · 벽 사냥 %.0f분" % (m["name"], L, ttk, htd, sec / 60))
        print(" %-4s 액트2 %s 액트3 %s | %s" % (prof, fmt_time(d["sanctum"]["total"]), fmt_time(rs[-1]["total"] - d["sanctum"]["total"]), " / ".join(out)))


def fmt_time(s):
    return "%d분 %02d초" % (s // 60, s % 60)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eff", type=float)
    ap.add_argument("--start", type=int, default=13)
    ap.add_argument("--walls", action="store_true", help="액트 보스 벽 표만")
    ap.add_argument("--exp-k", type=float, help="Lv12 넘는 몬스터 처치 경험치 +k/레벨 (기본 config expHighLevelPct)")
    ap.add_argument("--boss-hp", type=float, help="액트 2·3 보스 생명 배율 bossWallHpMul (수정안)")
    ap.add_argument("--route", default="quest", choices=["main", "quest", "all"], help="main 필드만 · quest 퀘스트 곁가지 포함(기본) · all 곁가지 전부")
    a = ap.parse_args()
    global EXP_K
    if a.eff:
        ASSUME["eff"] = a.eff
    if a.exp_k is not None:
        EXP_K = a.exp_k
    if a.boss_hp:
        C["bossWallHpMul"] = a.boss_hp
    if a.walls:
        walls(a.route)
        return
    for L in (17, 21, 27, 30):
        print("== Lv%d 빌드 비교 ==" % L)
        ref = build("P100", L)["total"]
        for name in PROFILES:
            b = build(name, L)
            print(" %-4s 군단 DPS %5.0f (%3.0f%%) 해골 %d·마법사 %d·그림자 %d(+%d) 소환수%% %3.0f · 생명 %3.0f 방어 %3.0f · 내역 %s" % (
                name, b["total"], 100 * b["total"] / ref, b["n_sk"], b["n_mg"], b["n_sh"], b["plus"], b["minion"], b["hp"], b["defense"],
                " ".join("%s %.0f" % kv for kv in b["dps"].items())))
    for name in PROFILES:
        print("\n== %s · 액트 2 시작 Lv%d · 경로 %s ==" % (name, a.start, a.route))
        for r in run(name, a.start, 0, a.route):
            print(" A%s %-14s %-6s 몬Lv %-5s 나Lv %2d→%2d  전투 %4.0f초 이동 %3.0f초  맵 %s  누적 %s  가장 아픈 적 %s %.1f대%s" % (
                r["act"], r["name"], r["kind"], r["mlv"], r["pl"], r["L_after"], r["combat"], r["travel"], fmt_time(r["t"]),
                fmt_time(r["total"]), r["worst"][1], r["worst"][0], ("  보스: " + r["boss"]) if r["boss"] else ""))


if __name__ == "__main__":
    main()
