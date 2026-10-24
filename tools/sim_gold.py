#!/usr/bin/env python3
# 골드 흐름 어림 (보통 난이도): 액트마다 모든 사냥터·곁가지를 한 번씩 정리했을 때 들어오는 골드와, 쓰는 곳의 값.
# data/*.csv와 게임 공식(LootSystem·ItemData.SellValue·PlayerShop·SkillBook.RespecCost)을 그대로 옮긴다.
#   python3 tools/sim_gold.py            — 액트별 수입 (몬스터 골드 · 장비 판매 · 의뢰 · 층 정리) + 지출 표
#   python3 tools/sim_gold.py --sell 0.6 — 주운 장비 중 파는 비율 (기본 0.8, 유니크·세트는 팔지 않는다)
#   python3 tools/sim_gold.py --diff 1   — 악몽(1)·지옥(2): 몬스터 레벨 +levelBonus · 골드 가중치 dropGoldMul · 골드 양 goldAmountMul · 의뢰 questRewardMul
import csv, sys, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
def load(name):
    with open(os.path.join(ROOT, "data", name + ".csv"), encoding="utf-8") as f:
        return list(csv.DictReader(f))

cfg = {r["key"]: r["value"] for r in load("config")}
num = lambda v, d=0.0: float(v) if v not in (None, "") else d
C = lambda k: num(cfg.get(k))
sell_share = num(sys.argv[sys.argv.index("--sell") + 1]) if "--sell" in sys.argv else 0.8
DIFF = int(sys.argv[sys.argv.index("--diff") + 1]) if "--diff" in sys.argv else 0
dif = {int(num(r["index"])): r for r in load("difficulty")}[DIFF]
LV_BONUS = int(num(dif["levelBonus"]))
GOLD_W = num(dif.get("dropGoldMul"), 1)
GOLD_AMT = num(dif.get("goldAmountMul"), 1)
SELL_MULT = C("sellValueMult") if cfg.get("sellValueMult") else 1

drop = {r["rank"]: r for r in load("drop_tables")}
shop = {r["key"]: r for r in load("shop")}
maps = load("maps")
quests = load("quests")
GOLD_MULT = {"normal": 1, "elite": 2, "champion": 2, "unique": 3, "boss": 3}
keep = C("densityRewardMult")

def per_kill(rank, lv):
    # 처치 1회의 기대 골드 (바닥 골드 · 장비 판매 · 물약/룬 판매)
    d = drop[rank]
    w = {k: num(d[k]) for k in ("none", "gold", "potion", "item", "rune")}
    w["gold"] *= GOLD_W
    tot = sum(w.values())
    picks = num(d["picks"]) * (1 if rank in ("boss", "unique") else keep)
    gold = picks * w["gold"] / tot * (lv * 3 + 2 + lv * 8 + 5) / 2 * GOLD_MULT[rank] * GOLD_AMT
    # 장비: 희귀도 비율 (drop_tables의 unique·set·rare·magic은 장비 한 개가 그 등급일 확률 %, 나머지 일반)
    pu, ps, pr, pm = (num(d[k]) / 100 for k in ("unique", "set", "rare", "magic"))
    pw = max(0.0, 1 - pu - ps - pr - pm)
    base = 10 + lv * 3
    item_val = base * (pw * 1 + pm * 3 + pr * 5) * SELL_MULT   # 유니크·세트는 팔지 않는다 · 장비 판매가 배율 sellValueMult
    sales = picks * w["item"] / tot * item_val * sell_share
    sales += picks * w["rune"] / tot * (20 + lv * 2) * 0.3    # 룬은 대부분 모은다
    sales += picks * w["potion"] / tot * max(1, int(num(shop["hp1"]["price"]) / 4)) * 0.3
    return gold, sales

def map_kills(m):
    out = []
    for part in (m["spawns"] or "").split(";"):
        if not part:
            continue
        mid, cnt, lv = part.split(":")
        out.append((int(cnt), int(lv) + LV_BONUS))
    return out

rows = []
for act in ("1", "2", "3", "4"):
    g = s = floor = 0.0
    kills = 0
    for m in maps:
        if m["act"] != act or m["kind"] not in ("field", "side"):
            continue
        elite = num(m["eliteChance"]) + C("packLeaderChance") / max(1, num(m["packSize"], 3))
        for cnt, lv in map_kills(m):
            kills += cnt
            for rank, share in (("normal", 1 - elite), ("elite", elite)):
                a, b = per_kill(rank, lv)
                g += cnt * share * a
                s += cnt * share * b
        if m["kind"] == "side":
            lv = max([lv for _, lv in map_kills(m)] or [1])
            floor += C("floorClearGoldBase") + C("floorClearGoldPerLevel") * lv
    q = sum(num(x["gold"]) for x in quests if x["act"] == act) * num(dif.get("questRewardMul"), 1)
    rows.append((act, kills, g, s, q, floor))

print(dif["name"] + " 난이도 · 액트마다 모든 사냥터를 한 번씩 정리 (장비 판매 비율 %.0f%%)" % (sell_share * 100))
print("액트  처치    바닥골드  장비판매   의뢰   층정리    합계   누적")
acc = 0
for act, k, g, s, q, f in rows:
    t = g + s + q + f
    acc += t
    print("%-4s %5d  %8.0f  %8.0f  %5.0f  %6.0f  %7.0f %7.0f" % (act, k, g, s, q, f, t, acc))

print("\n지출 (지금 값)")
for lv in (16, 20, 30, 40):
    print("  스킬 초기화 Lv%d: %d" % (lv, 0 if lv <= C("respecFreeLevel") else int(C("respecGoldBase") + C("respecGoldPerLevel") * (lv - C("respecFreeLevel") - 1))))
for k in ("hp1", "hp2", "hp3", "mp1", "mp2", "mp3", "tp"):
    r = shop[k]
    print("  %s %s: %s (회복 %s)" % (k, r["name"], r["price"], r["hpFlat"] if r["kind"] == "hp" else r["manaFlat"]))
gb = shop["gamble"]
for lv in (10, 20, 30, 40):
    print("  도박 Lv%d: %d" % (lv, int(num(gb["price"]) + num(gb["pricePerLevel"]) * lv)))
