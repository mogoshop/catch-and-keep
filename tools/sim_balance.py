#!/usr/bin/env python3
"""보통 · 악몽 · 지옥 액트 1~4 전체 난이도 추정 (표준 라이브러리만, data/*.csv 직접 읽기). 2026-10-23 출시 전 최종 점검.

게임 코드 공식 (10-23 기준 — 출처는 docs/design/33-balance-final-20261023.md):
  몬스터 생명   baseHp × (1+0.3(L−1))/(1+0.3(bl−1)) × statMul × 정예 3 × 보스(L<13 2.7 · 그 위 4.5)        Monster.RecomputeMaxHp
  몬스터 공격   floor(baseDmg × (1+0.2(L−bl)) × statMul + 0.5) × 보스 1.3                                  MonsterAttack.ScaleToLevel
  해골 전사     floor(6 × (1+0.12(OL−1)) × (1+0.1(slv−1)) × (1+0.08·숙련)) × (1+소환수%)  · 1.1초             UndeadSystem.GetBaseStats
  그림자        floor(25(정예 50) × 공격비 × 0.6 × (1+0.12(L−1)) × statMul) · 원본 간격 × 0.67                ShadowConfig.GetProfile
                statMul = [1 + (3(그림자 소환−1) + 8·군령 + 소환수%)/100] × (1 + 0.06 × 강화)
  플레이어 생명 60 + 1.5(L−1) + 3(활력−15) + 장비 · 물리 ×100/(100+방어) · 속성 ×(1−저항)                       PlayerStats
  레벨 차       주는 피해 ×max(0.25, 1−0.035·over) · 받는 피해 ×(1+min(0.45, 0.015·over)) (over = 몬스터−나−1)  GameConst
  약화의 낙인   받는 피해 +(20+2(r−1))% — 10-23부터 소환수 피해에도 (ShadowUnit.CalcDamage)
  각성          4장 오렌 처치 뒤 몬스터 이동·공격 속도 ×1.2 · 운석 최대 생명 16% × (1−화염 저항) 약 11초마다

가정(코드에 없는 값)은 ASSUME · PROFILES에 모았다. 사용:
  python3 tools/sim_balance.py            # P100 · P60 비교 + P60 액트 1~4 진행 표
  python3 tools/sim_balance.py --eff 0.5  # 군단 전투 효율 가정만 바꿔 보기
  python3 tools/sim_balance.py --diff all  # 보통 → 악몽 → 지옥 이어서 (레벨·경험치 이어받기, 10-23 추가)

악몽·지옥 (difficulty.csv · 10-23 추가):
  몬스터 레벨  보통 1~40을 levelFrom~levelTo로 비율 이동 (GameConst.ScaleLevel) — 고정 보스·최상위도 같은 변환
  저항         장비 저항 − resistPenalty, 상한 resistCap (PlayerStats.RefreshResists)
  의뢰 경험치  그 난이도 레벨 필요 경험치의 같은 비율 (QuestData.ExpFor) · 스킬/능력치/배치 보상은 난이도마다 다시
  장비         Lv40 넘는 장비는 옵션 단계(item_affixes tier 1 = ilvl31 · tier 2 = ilvl61)를 따라 이은 가정값 (GEAR)
"""
import argparse, csv, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def rows(name):
    with (DATA / name).open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def num(v, d=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


C = {r["key"]: num(r["value"]) for r in rows("config.csv")}
MON = {r["id"]: r for r in rows("monsters.csv")}
BOSS = {r["id"]: r for r in rows("bosses.csv")}
SKILL = {r["id"]: r for r in rows("skills.csv")}
NAMED = {r["map"]: r for r in rows("named.csv")}
QUESTS = rows("quests.csv")
MAPS_ALL = sorted(rows("maps.csv"), key=lambda r: num(r["order"]))

ASSUME = {
    "speed": 1.5,        # 이동 u/s (메이커 실측 1.3~1.6)
    "routeMul": 2.2,     # 사냥터 한 판 경로 = 가로 × 이 값
    "killShare": 0.85,   # 지나가며 잡는 비율
    "eff": 0.6,          # 군단 전투 효율 (조준·이동·과잉 피해·재소환 공백)
    "bossEff": 0.5,      # 보스전 효율 (내려찍기에 소환수 손실·재소환)
    "overhead": 25,      # 맵당 줍기·정비(초)
    "aggroShare": 0.3,   # 일반 몬스터 공격 중 플레이어에게 오는 비율 (나머지는 소환수)
    "bossAggro": 0.35,   # 보스 기본 공격 중 플레이어에게 오는 비율
    "slamHit": 0.3,      # 보스 내려찍기·기술(예고 있음)을 맞는 비율
    "auraTime": 0.3,     # 보스 오오라(5칸) 안에 있는 시간 비율
    "potions": 8,        # 보스전에 쓸 물약 수
}

# 레벨대별 장비 (액트 끝 레벨 1·6·12·22·31·40 사이를 잇는다). 아이템 점검(공식 정리 ③)의 「60% 장비 모델」과 최대 투자 장비.
# 시작 등불(소환수 +20%)은 둘 다 낀다.
# Lv55·70·85·99 = 악몽·지옥 장비 가정 (옵션 단계가 보통 끝의 약 1.6배 · 2.6배 — item_affixes tier 1·2). res는 난이도 페널티 전 값
GEAR = {
    "P100": dict(minion=(20, 28, 45, 60, 75, 95, 120, 150, 185, 220), tree=(0, 1, 1, 2, 3, 3, 4, 4, 5, 5),
                 life=(5, 15, 30, 55, 80, 110, 150, 190, 240, 290), defense=(20, 40, 60, 90, 120, 170, 230, 300, 380, 460),
                 res=(10, 20, 30, 45, 55, 65, 85, 100, 120, 135), deploy=(0, 0, 1, 1, 1, 2, 2, 2, 2, 2)),
    "P60": dict(minion=(20, 22, 30, 40, 50, 62, 80, 100, 125, 150), tree=(0, 0, 0, 1, 1, 2, 2, 2, 3, 3),
                life=(0, 3, 10, 22, 35, 52, 72, 95, 122, 150), defense=(13, 25, 35, 50, 70, 110, 150, 200, 260, 320),
                res=(2, 6, 9, 15, 22, 30, 42, 55, 70, 85), deploy=(0, 0, 0, 0, 0, 1, 1, 1, 1, 1)),
}
GEAR_L = (1, 6, 12, 22, 31, 40, 55, 70, 85, 99)
DIFF = {int(num(r["index"])): r for r in rows("difficulty.csv")}


def scale_level(L, diff):
    # GameConst.ScaleLevel
    if diff <= 0:
        return L
    n, d = DIFF[0], DIFF[diff]
    span = max(1, num(n["levelTo"]) - 1)
    out = num(d["levelFrom"]) + math.floor((L - 1) * (num(d["levelTo"]) - num(d["levelFrom"])) / span + 0.5)
    return int(max(1, min(C["levelCap"], out)))


def quest_exp(q, diff):
    # QuestData.ExpFor
    e = num(q["exp"])
    if e <= 0 or diff <= 0:
        return e
    lv = max(1, int(num(q["level"], 1)))
    need = lambda l: C["expCurveCoef"] * l ** C["expCurveExp"]
    return math.floor(min(1, e / need(lv)) * need(scale_level(lv, diff)) + 0.5)

PROFILES = {
    # 최대 투자: 군단 위주 최적 순서 · 통솔 50 · 활력 40 · 민첩 10% · 좋은 원본(공격비 1.8) · 정예 그림자 2 · 강화 상한 · 낙인 상시
    "P100": dict(order=["raise_skeleton:3", "shadow_summon:1", "skeleton_mastery:5", "mark_weakness:1", "shadow_summon:3",
                        "command_mastery:5", "shadow_summon:5", "deploy_expand:3", "skel_legion:2", "bone_armor:1",
                        "raise_skeleton:cap", "shadow_summon:cap", "curse_power:3", "raise_mage:cap", "mage_legion:2",
                        "mage_focus:5", "mark_weakness:cap"],
                 stat=dict(str=0.5, vit=0.4, dex=0.1, ene=0.0), dmgRatio=1.8, hpRatio=1.5, elites=2, plus=1.0, markUp=0.7),
    # 60%: 군단 위주지만 골편·뼈 갑옷·독안개에 포인트를 흩고, 숙련·군령·배치 확장이 늦다 · 고른 능력치 · 보통 원본 · 강화 절반 · 낙인 가끔
    "P60": dict(order=["raise_skeleton:1", "bone_shard:2", "raise_skeleton:3", "shadow_summon:1", "bone_armor:2", "skeleton_mastery:3",
                       "shadow_summon:3", "mark_weakness:1", "command_mastery:3", "shadow_summon:5",
                       "deploy_expand:2", "skeleton_mastery:4", "raise_skeleton:cap-2", "bone_spear:3", "shadow_summon:cap-2",
                       "raise_mage:3", "command_mastery:5", "deploy_expand:3", "raise_skeleton:cap", "shadow_summon:cap"],
                stat=dict(str=0.35, vit=0.35, dex=0.15, ene=0.15), dmgRatio=1.6, hpRatio=1.25, elites=1, plus=0.75, markUp=0.55),
}

SKP_LEVELS = [int(num(q["level"])) for q in QUESTS if "skp:" in q["reward"]]
STP_LEVELS = [int(num(q["level"])) for q in QUESTS if "stp:" in q["reward"]]
DEPLOY_LEVELS = [int(num(q["level"])) for q in QUESTS if "deploy:" in q["reward"]]
RES_QUEST = [(int(num(q["level"])), q["reward"]) for q in QUESTS if q["reward"].startswith("res")]


def lerp_gear(prof, key, L):
    xs, ys = GEAR_L, GEAR[prof][key]
    if L <= xs[0]:
        return ys[0]
    for i in range(1, len(xs)):
        if L <= xs[i]:
            t = (L - xs[i - 1]) / (xs[i] - xs[i - 1])
            return ys[i - 1] + (ys[i] - ys[i - 1]) * t
    return ys[-1]


def rank_cap(sid, L, rk):
    s = SKILL[sid]
    if s["kind"] == "node":
        parent = s["parent"]
        if rk.get(parent, 0) < int(num(s["need"])):
            return 0
        return int(num(s["maxLv"]))
    row, mx = int(num(s["row"])), int(num(s["maxLv"]))
    if L < row:
        return 0
    return min(mx, 1 + (L - row) // 2)


DONE = {"runs": 0}   # 이미 끝낸 난이도 수 (의뢰 스킬·능력치·배치 보상은 난이도마다 다시 준다)


def skill_points(L):
    return 1 + int(C["skillPerLevel"]) * (L - 1) + 2 * (sum(1 for x in SKP_LEVELS if x <= L) + DONE["runs"] * len(SKP_LEVELS))


def allocate(order, L):
    pts = skill_points(L)
    rk = {}
    for item in order:
        sid, want = item.split(":")
        cap = rank_cap(sid, L, rk)
        if want.startswith("cap"):
            n = cap - (int(want[4:]) if "-" in want else 0)
        else:
            n = int(want)
        n = max(0, min(n, cap))
        add = max(0, min(n - rk.get(sid, 0), pts))
        rk[sid] = rk.get(sid, 0) + add
        pts -= add
    return rk, pts


def build(prof, L, act=1, diff=0):
    p = PROFILES[prof]
    rk, left = allocate(p["order"], L)
    sp = 5 * (L - 1) + 5 * (sum(1 for x in STP_LEVELS if x <= L) + DONE["runs"] * len(STP_LEVELS))
    st = {k: int(sp * v) for k, v in p["stat"].items()}
    Str, Vit, Dex, Ene = 15 + st["str"], 15 + st["vit"], 25 + st["dex"], 25 + st["ene"]
    minion = lerp_gear(prof, "minion", L) + (Str - 15) * C["strMinionPct"]
    tree = int(round(lerp_gear(prof, "tree", L)))
    # 해골 전사 · 마법사 (UndeadSystem)
    def undead(base_atk, base_hp, slv, mast):
        if slv <= 0:
            return 0, 0
        a = math.floor(base_atk * (1 + C["monsterDmgPerLevel"] * C["summonGrowthMul"] * (L - 1)) * (1 + 0.1 * (slv - 1)) * (1 + 0.08 * mast))
        h = math.floor(base_hp * (1 + C["monsterHpPerLevel"] * C["summonGrowthMul"] * (L - 1)) * (1 + 0.1 * (slv - 1)) * (1 + 0.08 * mast))
        return a * (1 + minion / 100), h * (1 + minion / 100)

    def count(slv, legion):
        if slv <= 0:
            return 0
        return (slv if slv <= 3 else min(8, 2 + slv // 3)) + legion

    sl = rk.get("raise_skeleton", 0) + (tree if rk.get("raise_skeleton", 0) else 0)
    sk_atk, sk_hp = undead(C["skeletonAtkBase"], C["skeletonHpBase"], sl, rk.get("skeleton_mastery", 0))
    n_sk = count(sl, rk.get("skel_legion", 0))
    ml = rk.get("raise_mage", 0) + (tree if rk.get("raise_mage", 0) else 0)
    mg_atk, _ = undead(C["mageAtkBase"], C["mageHpBase"], ml, rk.get("skeleton_mastery", 0))
    mg_atk *= 1 + 0.1 * rk.get("mage_focus", 0)
    n_mg = count(ml, rk.get("mage_legion", 0))
    # 그림자 (ShadowConfig · ShadowCommander)
    ss = rk.get("shadow_summon", 0) + (tree if rk.get("shadow_summon", 0) else 0)
    plus = min(math.floor(p["plus"] * (L // 3)), 10)
    sm = (1 + (3 * max(0, ss - 1) + 8 * rk.get("command_mastery", 0) + minion) / 100) * (1 + 0.06 * plus)
    grow_a = 1 + C["monsterDmgPerLevel"] * C["summonGrowthMul"] * (L - 1)
    grow_h = 1 + C["monsterHpPerLevel"] * C["summonGrowthMul"] * (L - 1)
    deploy_quest = sum(1 for x in DEPLOY_LEVELS if x <= L) + DONE["runs"] * len(DEPLOY_LEVELS)
    if ss <= 0:
        n_sh = 0
    elif L < C["shadowFullLevel"]:
        n_sh = int(C["shadowEarlyDeployLimit"]) + deploy_quest
    else:
        gear_dep = int(lerp_gear(prof, "deploy", L))
        n_sh = min(int(C["deployBase"]) + min(3, rk.get("deploy_expand", 0)) + min(2, gear_dep), int(C["hardCap"])) + deploy_quest
    n_el = min(p["elites"], n_sh)
    sh_iv = 1.6 * C["shadowCooldownMul"]
    sh_n = math.floor(25 * p["dmgRatio"] * 0.6 * grow_a * sm)
    sh_e = math.floor(50 * min(2.5, p["dmgRatio"] * 1.1) * 0.6 * grow_a * sm)
    sh_hp = math.floor(60 * p["hpRatio"] * 1.2 * grow_h * sm)
    # 플레이어: 평타 30% 가동 + (P60) 골편 · 뼈 창
    wpn = 6 if L < 8 else (11 if L < 18 else (18 if L < 33 else (40 if L < 55 else (70 if L < 80 else 110))))
    ias = min(75, Dex * 0.3)
    melee = (12 + wpn) * (1 + Dex * 0.005) / (0.45 / (1 + ias / 100))
    spell_pct = Ene + 0
    scale = C["skillPowerMult"] * (1 + C["skillDmgPerCharLevel"] * (L - 1)) * C["skillDmgMult"] * (1 + spell_pct / 100)
    spell = 0
    if rk.get("bone_shard"):
        spell += (10 + 6 * (rk["bone_shard"] - 1)) * C["boneShardDmgMul"] * scale * 1.5 / 0.75 * 0.25
    if rk.get("bone_spear"):
        spell += (30 + 12 * (rk["bone_spear"] - 1)) * scale * 2.0 / 1.2 * 0.25
    dps = {
        "그림자": ((n_sh - n_el) * sh_n + n_el * sh_e) / sh_iv,
        "해골": n_sk * sk_atk / C["skeletonCooldown"],
        "마법사": n_mg * mg_atk / C["mageCooldown"],
        "플레이어": melee * 0.3 + spell,
    }
    mark = rk.get("mark_weakness", 0)
    amp = (20 + 2 * max(0, mark - 1)) * (1 + 0.1 * rk.get("curse_power", 0)) / 100 if mark else 0
    taken_mul = 1 + p["markUp"] * amp
    hp = 60 + 1.5 * (L - 1) + 3 * (Vit - 15) + lerp_gear(prof, "life", L)
    defense = lerp_gear(prof, "defense", L) + Dex // 4
    res = {e: lerp_gear(prof, "res", L) for e in ("fire", "cold", "light", "poison")}
    for lv, rw in RES_QUEST:
        if lv <= L:
            el = {"respoison": "poison", "reslight": "light", "resfire": "fire"}[rw.split(":")[0]]
            res[el] += num(rw.split(":")[1])
    pen = num(DIFF[diff]["resistPenalty"]) if diff in DIFF else 0
    res = {k: min(C["resistCap"], v + pen) for k, v in res.items()}
    bone_armor = math.floor((20 + 10 * (rk.get("bone_armor", 0) - 1)) * (1 + 0.1 * (L - 1))) if rk.get("bone_armor") else 0
    return dict(L=L, rk=rk, left=left, pts=skill_points(L), dps=dps, total=sum(dps.values()) * taken_mul, hp=hp, defense=defense,
                res=res, n_sk=n_sk, n_mg=n_mg, n_sh=n_sh, n_el=n_el, plus=plus, minion=minion, sk_hp=sk_hp, sh_hp=sh_hp, sh_n=sh_n,
                bone_armor=bone_armor, amp=amp * p["markUp"], Str=Str, Vit=Vit)


DIFF_NOW = {"d": 0}


def diff_mul(key):
    # difficulty.csv monsterHpMul · monsterDmgMul (10-23 추가, 없으면 1)
    return num(DIFF[DIFF_NOW["d"]].get(key), 1) or 1


def mon_stats(mid, L, statMul, elite=False):
    m = MON[mid]
    bl = int(num(m["baseLevel"]))
    hp = num(m["baseHp"]) * (1 + C["monsterHpPerLevel"] * (L - 1)) / (1 + C["monsterHpPerLevel"] * (bl - 1))
    grade = int(num(m["grade"]))
    unique = m["unique"].lower() == "true"
    if (grade == 2 and not unique) or elite:
        hp *= C["eliteHpMul"]
    if grade >= 3:
        hp *= C["bossWallHpMul"] if L >= C["bossWallFromLevel"] else C["bossHpMul"]
    hp *= statMul * diff_mul("monsterHpMul")
    # MonsterAttack.ScaleToLevel — 10-23: 생명처럼 비율 (예전 1+0.2(L−bl)은 모델 레벨이 높은 보스가 악몽·지옥에서 생명 ×1.7인데 공격 ×7이 됐다)
    k = C["monsterDmgPerLevel"]
    dmg = math.floor(num(m["baseDmg"]) * (1 + k * (L - 1)) / (1 + k * (bl - 1)) * statMul * diff_mul("monsterDmgMul") + 0.5)
    if grade >= 3:
        dmg *= C["bossDmgMul"]
    if m["behavior"] == "phase":
        hp *= 1.3
    return hp, dmg, num(m["atkIntervalSec"], 1.6), (m["element"] or "phys"), num(m["elementRatio"]), grade


def gap_dealt(pl, ml):
    over = ml - pl - 1
    return 1 if over <= 0 else max(0.25, 1 - 0.035 * over)


def gap_taken(pl, ml):
    over = ml - pl - 1
    return 1 if over <= 0 else 1 + min(0.45, 0.015 * over)


def exp_next(n):
    return math.floor(C["expCurveCoef"] * n ** C["expCurveExp"] + 0.5)


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
    if pl < C["earlyExpLevel"]:
        b *= C["earlyExpMult"]
    if ml > C["expHighLevelFrom"]:
        b *= 1 + C["expHighLevelPct"] / 100 * (ml - C["expHighLevelFrom"])
    return b


def hit_taken(b, dmg, element, ratio, pl, ml):
    if element == "phys" or ratio <= 0:
        t = dmg * 100 / (100 + b["defense"])
    else:
        t = dmg * (1 - ratio) * 100 / (100 + b["defense"]) + dmg * ratio * (1 - b["res"].get(element, 0) / 100)
    return t * gap_taken(pl, ml)


# 보통 난이도 경로: 마을 제외 필드 사슬 + 의뢰가 가리키는 곁가지(앞 층 포함)
QUEST_MAPS = {q["map"] for q in QUESTS} | {q["map1"] for q in QUESTS if q["map1"]}


def in_route(m):
    if m["kind"] in ("town", "instance") or m["id"].endswith(("_nm", "_hell")):
        return False
    if m["kind"] == "field":
        return True
    # 곁가지: 의뢰 맵이거나 같은 던전의 앞 층
    if m["id"] in QUEST_MAPS:
        return True
    base = m["id"].rstrip("0123456789")
    return any(q.startswith(base) and q != m["id"] and q[-1:].isdigit() and m["id"][-1:].isdigit() and q[-1] > m["id"][-1] for q in QUEST_MAPS)


def ordered_route():
    out = []
    fields = [m for m in MAPS_ALL if in_route(m) and m["kind"] == "field"]
    sides = [m for m in MAPS_ALL if in_route(m) and m["kind"] == "side"]
    for f in fields:
        out.append(f)
        # 이 필드에 딸린 곁가지 (parent) — 첫 층의 parent를 따라 뒤 층까지
        firsts = [s for s in sides if s["parent"] == f["id"] and s["entry"] != ""]
        for s in firsts:
            chain = [s]
            idx = MAPS_ALL.index(s)
            for nxt in MAPS_ALL[idx + 1:]:
                if nxt["kind"] == "side" and nxt["entry"] == "" and nxt in sides:
                    chain.append(nxt)
                else:
                    break
            out += chain
    return out


def boss_fight(b, prof, bid, L, ml, statMul, hp_override=None, extra_hp=0, exposed=False, awaken=1.0):
    hp, dmg, iv, el, ratio, grade = mon_stats(bid, ml, statMul)
    if hp_override:
        hp = hp_override
    if exposed:
        hp = hp * 0.6 + hp * 0.4 / 1.3
    hp += extra_hp
    ttk = hp / (b["total"] * ASSUME["bossEff"] * gap_dealt(L, ml))
    bp = BOSS.get(bid, {})
    m = MON[bid]
    base_dmg = num(m["baseDmg"])
    k = C["monsterDmgPerLevel"]
    atk_dmg = math.floor(base_dmg * (1 + k * (ml - 1)) / (1 + k * (int(num(m["baseLevel"])) - 1)) * statMul * diff_mul("monsterDmgMul") + 0.5)
    slam = num(bp.get("slamDamage")) * atk_dmg / max(1, base_dmg) * (C["bossDmgMul"] if grade >= 3 else 1)
    slam_iv = max(1.0, num(bp.get("slamInterval"), 6))
    per_basic = hit_taken(b, dmg, el, ratio, L, ml)
    per_slam = hit_taken(b, slam, el, ratio if ratio > 0 else 0, L, ml)
    aura = atk_dmg * num(bp.get("auraMult")) * 2 * (1 - b["res"].get(bp.get("aura") or "fire", 0) / 100) if bp.get("aura") else 0
    incoming = (per_basic / iv * awaken * ASSUME["bossAggro"] + per_slam / slam_iv * ASSUME["slamHit"] + aura * ASSUME["auraTime"])
    heal = 60 if L < 10 else (150 if L < 30 else 360)
    pool = b["hp"] + b["bone_armor"] + ASSUME["potions"] * heal
    survive = pool / max(0.1, incoming)
    return dict(hp=hp, ttk=ttk, per_basic=per_basic, per_slam=per_slam, incoming=incoming, survive=survive,
                htd_slam=b["hp"] / max(1, per_slam), name=m["name"])


def run(prof, eff=None, diff=0, L=1, exp=0.0):
    if eff:
        ASSUME["eff"] = eff
    total = 0.0
    DIFF_NOW["d"] = diff
    out = []
    awakened = False
    for mp in ordered_route():
        sm = num(mp["statMul"], 1) or 1
        act = int(num(mp["act"], 1))
        b = build(prof, L, act, diff)
        awaken = 1.2 if (act == 4 and awakened) else 1.0
        t_combat, gained, worst = 0.0, 0.0, (999, "", 0)
        spawns = [t for t in mp["spawns"].split(";") if t]
        ec = num(mp["eliteChance"]) + 0.2 / max(1, num(mp["packSize"], 3))
        for tok in spawns:
            mid, n, ml = tok.split(":")
            n, ml = int(n), scale_level(int(ml), diff)
            hp, dmg, iv, el, ratio, grade = mon_stats(mid, ml, sm)
            ehp = mon_stats(mid, ml, sm, elite=True)[0]
            g2 = grade == 2
            avg_hp = hp if g2 else hp * (1 - ec) + ehp * ec
            kills = n * ASSUME["killShare"]
            t_combat += kills * avg_hp / (b["total"] * ASSUME["eff"] * gap_dealt(L, ml))
            gained += kills * kill_exp(L, ml, 2 if g2 else 1) * (1 + (2 * ec if not g2 else 0))
            per = hit_taken(b, dmg * (1.5 if g2 else 1), el, ratio, L, ml)
            htd = b["hp"] / max(1, per)
            if htd < worst[0]:
                worst = (htd, MON[mid]["name"], per)
        bosses = []
        nm = NAMED.get(mp["id"])
        if nm and nm["model"] in MON and nm["id"]:
            lvls = [int(t.split(":")[2]) for t in spawns] or [L]
            ml = scale_level(round(sum(lvls) / len(lvls)), diff) + int(num(nm["levelAdd"]))
            hp = mon_stats(nm["model"], ml, sm)[0] * num(nm["hpMul"], 1)
            if nm["model"] == "apostate":
                awakened = True
            f = boss_fight(b, prof, nm["model"], L, ml, sm, hp_override=hp)
            bosses.append((nm["name"], ml, f))
            gained += kill_exp(L, ml, 2)
        for tok in [t for t in mp["fixed"].split(";") if t]:
            bid = tok.split("@")[0]
            m = MON[bid]
            ml = scale_level(int(num(m["baseLevel"])), diff)
            extra = 0
            exposed = False
            if bid == "ashking":
                extra = 3 * mon_stats("shadesmith", scale_level(38, diff), sm)[0] if "shadesmith" in MON else 0
                exposed = True
            f = boss_fight(b, prof, bid, L, ml, sm, extra_hp=extra, exposed=exposed, awaken=1.2 if act == 4 and awakened else 1.0)
            bosses.append((m["name"], ml, f))
            gained += kill_exp(L, ml, int(num(m["grade"])))
        for _, _, f in bosses:
            t_combat += f["ttk"]
        travel = num(mp["w"]) * (ASSUME["routeMul"] if spawns else 1) / ASSUME["speed"]
        t = t_combat + travel + ASSUME["overhead"]
        total += t
        qexp = sum(quest_exp(q, diff) for q in QUESTS if q["map"] == mp["id"])
        exp += gained + qexp
        L0 = L
        while exp >= exp_next(L):
            exp -= exp_next(L)
            L += 1
        lv = [scale_level(int(t.split(":")[2]), diff) for t in spawns] or [scale_level(int(num(MON[t.split("@")[0]]["baseLevel"])), diff) for t in mp["fixed"].split(";") if t]
        meteor = 0
        if act == 4 and awakened and mp["kind"] != "town" and mp["id"] != "throne":
            meteor = b["hp"] * 0.16 * (1 - b["res"]["fire"] / 100)
        out.append(dict(mp=mp, act=act, L0=L0, L1=L, mlv=(min(lv), max(lv)) if lv else (0, 0), combat=t_combat, travel=travel, t=t,
                        total=total, worst=worst, bosses=bosses, b=b, meteor=meteor, exp=exp))
    return out


def fmt(s):
    return "%d분 %02d초" % (s // 60, s % 60)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eff", type=float)
    ap.add_argument("--profile", default="P60")
    ap.add_argument("--diff", default="0", help="0 보통 · 1 악몽 · 2 지옥 · all 이어서")
    a = ap.parse_args()
    diffs = [0, 1, 2] if a.diff == "all" else [int(a.diff)]
    print("== 빌드 비교 (군단 초당 피해 · 괄호는 P100 대비) ==")
    for L in (6, 12, 21, 30, 40):
        ref = build("P100", L)["total"]
        for prof in PROFILES:
            b = build(prof, L)
            print(" Lv%-2d %-4s DPS %6.0f (%3.0f%%) 포인트 %d 남음 %d · 그림자 %d(정예 %d, +%d) 해골 %d 마법사 %d · 소환수%% %3.0f · 생명 %4.0f 방어 %3.0f 저항 %2.0f · %s" % (
                L, prof, b["total"], 100 * b["total"] / ref, b["pts"], b["left"], b["n_sh"], b["n_el"], b["plus"], b["n_sk"], b["n_mg"],
                b["minion"], b["hp"], b["defense"], b["res"]["fire"], " ".join("%s %.0f" % kv for kv in b["dps"].items())))
    for prof in ([a.profile] if a.profile != "all" else list(PROFILES)):
      DONE["runs"] = 0
      L, exp = 1, 0.0
      for diff in ([0, 1, 2] if diffs[-1] > 0 else diffs):
        last = None
        if diff not in diffs:
            for r in run(prof, a.eff, diff, L, exp):
                last = r
            L, exp = last["L1"], last["exp"]
            DONE["runs"] += 1
            continue
        print("\n== %s · %s 액트 1~4 (의뢰 경로, 시작 Lv%d) ==" % (prof, DIFF[diff]["name"], L))
        acts = {}
        for r in run(prof, a.eff, diff, L, exp):
            last = r
            mp = r["mp"]
            acts.setdefault(r["act"], [0, r["L0"], 0])
            acts[r["act"]][0] += r["t"]
            acts[r["act"]][2] = r["L1"]
            line = " A%d %-18s 몬Lv %2d~%-2d 나Lv %2d→%2d 전투 %4.0f초 맵 %s 누적 %s | 가장 아픈 일반 %s %.0f (%.1f대)" % (
                r["act"], mp["name"][:18], r["mlv"][0], r["mlv"][1], r["L0"], r["L1"], r["combat"], fmt(r["t"]), fmt(r["total"]),
                r["worst"][1], r["worst"][2], r["worst"][0])
            if r["meteor"]:
                line += " · 운석 %.0f" % r["meteor"]
            print(line)
            for name, ml, f in r["bosses"]:
                print("     ▶ %s Lv%d 생명 %.0f · 처치 %.0f초 · 기본 %.0f 내려찍기 %.0f(%.1f대) · 받는 초당 %.0f → 버티는 시간 %.0f초 (%s)" % (
                    name, ml, f["hp"], f["ttk"], f["per_basic"], f["per_slam"], f["htd_slam"], f["incoming"], f["survive"],
                    "여유" if f["survive"] > f["ttk"] * 1.5 else ("빠듯" if f["survive"] > f["ttk"] else "위험")))
        print(" 액트별: " + " · ".join("A%d %s (Lv%d→%d)" % (k, fmt(v[0]), v[1], v[2]) for k, v in sorted(acts.items())))
        L, exp = last["L1"], last["exp"]
        DONE["runs"] += 1


if __name__ == "__main__":
    main()
