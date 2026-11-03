#!/usr/bin/env python3
"""11-03 스킬 랭크 개편 전후 비교 (docs/design/62 §12). tools/sim_balance.py 두 판(옛 = git HEAD 추출본 · 새 = 작업 트리)의 build()를 그대로 불러
소환수 고점(P100·P60 · Lv40/68/90/99) · 본 노바 단계별 피해 · 공격 4종 R20 한 발을 같은 표로 찍는다.
사용: python3 sim_compare.py <옛 저장소 뿌리> <새 저장소 뿌리>"""
import math, runpy, sys, pathlib

def load(root):
    g = runpy.run_path(str(pathlib.Path(root) / "tools" / "sim_balance.py"), run_name="sim")
    return g

old, new = load(sys.argv[1]), load(sys.argv[2])

def runs_for(L):
    return 0 if L <= 40 else (1 if L <= 70 else 2)

print("== 소환수 고점 (군단 초당 피해 · build() · 장비 가정 GEAR 그대로) ==")
print(" 판 Lv  P100 합계(그림자/해골/마법사)        P60 합계(그림자/해골/마법사)")
peak = {}
for L in (40, 68, 90, 99):
    for tag, g in (("옛", old), ("새", new)):
        g["DONE"]["runs"] = runs_for(L)
        cols = []
        for prof in ("P100", "P60"):
            b = g["build"](prof, L)
            d = b["dps"]
            peak[(tag, L, prof)] = (d["그림자"] + d["해골"] + d["마법사"], d)
            cols.append("%7.0f (%6.0f/%6.0f/%6.0f)" % (d["그림자"] + d["해골"] + d["마법사"], d["그림자"], d["해골"], d["마법사"]))
        print(" %s Lv%-2d %s   %s" % (tag, L, cols[0], cols[1]))
    for prof in ("P100", "P60"):
        o, n = peak[("옛", L, prof)][0], peak[("새", L, prof)][0]
        print("    Lv%d %s 소환수 합 %+.1f%%" % (L, prof, 100 * (n / o - 1)))

print("\n== 본 노바 단계별 (P100 해골 1기 공격력 기준 · 한 적 · 캐릭터 Lv · 본 노바 랭크 = 그 레벨 상한) ==")
def rite_cap(g, L):
    return g["rank_cap"]("bone_rite", L, {})
for L in (53, 62, 90, 99):
    for tag, g in (("옛", old), ("새", new)):
        g["DONE"]["runs"] = runs_for(L)
        b = g["build"]("P100", L)
        atk = b["dps"]["해골"] * g["C"]["skeletonCooldown"] / max(1, b["n_sk"])   # 1기 공격력 (소환수% 포함)
        r = rite_cap(g, L)
        if tag == "옛":
            bomb = 2.5 + 0.15 * (r - 1)
            whirl = 0.45 * 8 * (1 + 0.03 * (r - 1)); wcd, wmana, wskel = 6, 15, 2
            arrow = 5 * 3 * (1 + 0.03 * (r - 1)); acd = 8
            print(" 옛 Lv%-2d R%-2d 해골 1기 %5.0f · 폭탄 ×%.2f = %6.0f (1초) · 회오리(2기) ×%.2f = %6.0f / %d초 = 초당 %5.0f · 화살(3기) ×%.2f = %6.0f / %d초 = 초당 %5.0f" % (
                L, r, atk, bomb, atk * bomb, whirl, atk * whirl, wcd, atk * whirl / wcd, arrow, atk * arrow, acd, atk * arrow / acd))
        else:
            C = g["C"]
            bomb = 2.5 + 0.25 * (r - 1)
            ticks = int(C["riteWhirlSeconds"] / C["riteWhirlTick"] + 1e-6)
            per = C["riteWhirlMul"] * (1 + C["riteRankPct"] / 100 * (r - 1))
            whirl = per * ticks
            for fork in (0, 2):
                extra = fork * C["riteWhirlForkMul"] * per * ticks
                print(" 새 Lv%-2d R%-2d 해골 1기 %5.0f · 폭탄 ×%.2f = %6.0f (1초) · 회오리(3기 · 갈래 %d) 한 적 ×%.2f(%d타) = %6.0f / %d초 = 초당 %5.0f%s" % (
                    L, r, atk, bomb, atk * bomb, fork, whirl, ticks, atk * whirl, C["riteWhirlCd"], atk * whirl / C["riteWhirlCd"],
                    (" · 갈래 합 +%.0f (다른 표적)" % (atk * extra)) if fork else ""))

print("\n== 공격 4종 R20 한 발 (Lv1 환산 = 랭크 몫 · 그 R20 최소 Lv에서 실제) ==")
ROLE = {"bone_storm": 0.3, "shadow_sacrifice": 2.0, "soul_torrent": 0.8, "death_wave": 2.5}
for sid, mul in ROLE.items():
    out = []
    for tag, g in (("옛", old), ("새", new)):
        C, S = g["C"], g["SKILL"]
        row = int(float(S[sid]["row"]))
        def curve(r):
            v = mul * (C["skillCurveBase"] + C["skillCurvePerLv"] * (r + (row - 1) // 2 - 1))
            if tag == "새" and row >= C.get("skillLateRow", 999):
                v *= 1 + C["skillLateRampPct"] / 100 * (r - 1)
            return v * C["skillPowerMult"] * C["skillDmgMult"]
        L20 = g["next_rank_level"](sid, 20) if "next_rank_level" in g else row + 38
        real = curve(20) * (1 + C["skillDmgPerCharLevel"] * (L20 - 1))
        out.append("%s R1 %.1f · R20 %.1f (×%.2f · 19→20 %.2f%%) · R20 최소 Lv%d 실제 %.0f" % (tag, curve(1), curve(20), curve(20) / curve(1), 100 * (curve(20) / curve(19) - 1), L20, real))
    print(" %-17s %s\n %-17s %s" % (sid, out[0], "", out[1]))
