#!/usr/bin/env python3
# 10-30 갈래 A (I01 부분 재련) 비용·골드 흐름 비교 — 오프라인 어림 (메이커·실플레이 측정 아님)
#   수입: tools/sim_gold.py (노말 · 액트마다 모든 사냥터 한 번씩 정리 · 장비 판매 80%) 액트별 합계를 그대로 읽는다
#   비용: ItemData.RerollCost (마법 40+12×ilvl · 레어 ×3) × partialRerollMul (data/config.csv)
#   후보 풀: ItemData.AffixPool 규칙 (아이템 레벨 이하 · 난이도 단계 t-1~t · 15 넘게 낮으면 0.3 · 이전 단계 0.25 · 신발 이동 속도 bootsMoveMult)
#     — 같은 줄의 다른 줄 능력치 제외는 장비마다 달라 여기서는 빼지 않았다 (실제 후보는 이보다 조금 적다 → 목표 하나까지 시도 수는 약간 적다)
#   사용: python3 docs/evidence/2026-10-30-goal-A/gold_flow.py
import csv, os, re, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
def load(name):
    with open(os.path.join(ROOT, "data", name + ".csv"), encoding="utf-8") as f:
        return list(csv.DictReader(f))
cfg = dict((r["key"], r["value"]) for r in load("config"))
mul_now = float(cfg.get("partialRerollMul", "1"))
boots = float(cfg["bootsMoveMult"])
diff = load("difficulty")
def tier_of(ilvl):
    if ilvl >= int(diff[2]["levelFrom"]): return 2
    if ilvl >= int(diff[1]["levelFrom"]): return 1
    return 0
affixes = load("item_affixes")
def pool(prefix, slot, ilvl):
    t = tier_of(ilvl); out = []
    for a in affixes:
        if (a["prefix"] == "true") != prefix: continue
        ai, at = int(a["minIlvl"]), int(a["tier"])
        if ai > ilvl or at < t - 1 or at > t: continue
        slots = a["slots"]
        if slots != "any" and slot not in slots.split(","): continue
        w = 1.0 if ai >= ilvl - 15 else 0.3
        if at < t: w *= 0.25
        if a["stat"] == "ms" and slot == "boots": w *= boots
        out.append((a["id"], a["stat"], w))
    return out
def cost(rarity, ilvl, mul):
    c = 40 + ilvl * 12
    if rarity == 2: c *= 3
    return max(1, int(c * mul + 0.5))
# 액트별 수입 (sim_gold.py 표의 합계 열)
out = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "sim_gold.py")], capture_output=True, text=True, cwd=ROOT).stdout
acts = {}
for line in out.splitlines():
    m = re.match(r"^(\d)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)", line.strip())
    if m: acts[int(m.group(1))] = (int(m.group(2)), int(m.group(7)))
rows = [(15, 2), (30, 3), (40, 4)]   # 대표 레벨 → 그 레벨을 보내는 액트 (quests.csv level: 액트2 13~ · 액트3 23~ · 액트4 32~)
SLOTS = ["weapon", "offhand", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring"]
print("## 후보 풀 (같은 종류 한 줄 · 다른 줄 제외 전)")
print("| Lv(ilvl) | 접두 후보 수 (부위 최소~최대) | 접미 후보 수 | 목표 접사 1개까지 평균 시도 (중앙 접사 가중치 기준) |")
print("|---|---|---|---|")
tries = {}
for lv, act in rows:
    ilvl = lv
    pc = [len(pool(True, s, ilvl)) for s in SLOTS]; sc = [len(pool(False, s, ilvl)) for s in SLOTS]
    att = []
    for s in SLOTS:
        for side in (True, False):
            p = pool(side, s, ilvl)
            if not p: continue
            tot = sum(w for _, _, w in p)
            ws = sorted(w / tot for _, _, w in p)
            att.append(1 / ws[len(ws) // 2])
    att.sort(); med = att[len(att) // 2]; tries[lv] = med
    print("| %d (%d) | %d~%d | %d~%d | %.1f회 |" % (lv, ilvl, min(pc), max(pc), min(sc), max(sc), med))
print()
print("## 비용·골드 흐름 (레어 기준 · 마법은 1/3)")
print("| 안 | 배율 | Lv15 1회 | Lv30 1회 | Lv40 1회 | 액트 한 바퀴 수입으로 시도 수 (액트2/3/4) | 처치당 골드로 1회 = 처치 수 (액트2/3/4) | 목표 1개 평균 비용 ÷ 액트 수입 (액트2/3/4) |")
print("|---|---|---|---|---|---|---|---|")
for name, mul in (("A 권장(현행 전체 재련 값 그대로)", 1.0), ("B 절반", 0.5), ("C 1.5배", 1.5)):
    c = [cost(2, lv, mul) for lv, _ in rows]
    per = [acts[a][1] / c[i] for i, (_, a) in enumerate(rows)]
    kills = [c[i] / (acts[a][1] / acts[a][0]) for i, (_, a) in enumerate(rows)]
    share = [tries[lv] * c[i] / acts[a][1] for i, (lv, a) in enumerate(rows)]
    print("| %s | ×%.1f | %d | %d | %d | %.0f / %.0f / %.0f | %.0f / %.0f / %.0f | %.0f%% / %.0f%% / %.0f%% |" % ((name, mul) + tuple(c) + tuple(per) + tuple(kills) + tuple(x * 100 for x in share)))
print()
print("현재 config partialRerollMul = %.2f · 레어 ilvl42 전체 재련 = %d (설계 47 원안 1632)" % (mul_now, cost(2, 42, 1.0)))
print("액트 수입(노말 한 바퀴): " + " · ".join("액트%d %d골드/%d처치" % (a, acts[a][1], acts[a][0]) for a in sorted(acts)))
