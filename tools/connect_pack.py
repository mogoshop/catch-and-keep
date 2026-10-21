# 코덱스 몬스터·NPC 그림 팩(올린 뒤)을 게임 데이터에 연결한다.
#   python3 tools/connect_pack.py <팩 폴더> <entity,...> [--npc=id,...] [--skip-hit]
# - animation-registration.csv의 ordered_sprite_RUIDs를 resource-mapping.csv(resource_name → ruid)로 채운다
# - data/monster_frames.csv는 tools/import_frames.cjs로 그 몬스터 행만 바꾼다
# - data/monsters.csv: stand~attack 첫 프레임, w·h(공통 캔버스), bodyH(서 있는 몸 높이), 피격 상자(몸 기준), portrait·pw·ph
# - data/npcs.csv: stand
import csv, io, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(__file__), "..")


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(path, rows, head):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=head, lineterminator="\n")
    w.writeheader()
    w.writerows(rows)
    open(path, "w", encoding="utf-8").write(buf.getvalue())


def main():
    pack = sys.argv[1]
    ids = [x for x in sys.argv[2].split(",") if x]
    npcs = next((a.split("=")[1].split(",") for a in sys.argv[3:] if a.startswith("--npc=")), [])
    P = os.path.join(ROOT, pack)
    ruid = {r["resource_name"]: r["ruid"] for r in read(os.path.join(P, "resource-mapping.csv"))}
    byfile = {r["file"]: r["ruid"] for r in read(os.path.join(P, "resource-mapping.csv"))}

    # 1. 등록표 RUID 채우기
    regf = os.path.join(P, "animation-registration.csv")
    reg = read(regf)
    head = list(reg[0].keys())
    first = {}
    for r in reg:
        names = r["ordered_sprite_names"].split(";")
        rs = [ruid.get(n, "") for n in names]
        if r["entity"] in ids and not all(len(x) == 32 for x in rs):
            raise SystemExit(f"{r['entity']} {r['state']}: 아직 안 올라간 그림 {sum(1 for x in rs if len(x) != 32)}장")
        r["ordered_sprite_RUIDs"] = ";".join(rs)
        r["group"] = r["group"] or "OJYYQ"
        first[(r["entity"], r["state"])] = rs[0]
    write(regf, reg, head)

    # 2. 프레임 표
    subprocess.check_call(["node", os.path.join(ROOT, "tools/import_frames.cjs"), pack, ",".join(f"{i}={i}" for i in ids)], cwd=ROOT)

    # 3. monsters.csv
    dims = {r["entity"]: r for r in read(os.path.join(P, "monster-dimensions.csv"))}
    mf = os.path.join(ROOT, "data/monsters.csv")
    mons = read(mf)
    mhead = list(mons[0].keys())
    from PIL import Image
    for m in mons:
        i = m["id"]
        if i not in ids:
            continue
        for s in ("stand", "move", "hit", "die", "attack"):
            if (i, s) in first:
                m[s] = first[(i, s)]
        d = dims[i]
        m["w"], m["h"] = d["frame_canvas_width"], d["frame_canvas_height"]
        vw, vh = float(d["stand_visible_width"]), float(d["stand_visible_height"])
        sc = float(m["scale"] or 1)
        m["bodyH"] = str(round(vh))
        if "--skip-hit" not in sys.argv:
            # 피격 상자 = 서 있는 몸 영역 기준 (넓은 무기·공격 캔버스는 넣지 않는다)
            m["hitW"] = f"{max(0.4, vw * 0.45 / 100 * sc):.2f}"
            m["hitH"] = f"{max(0.4, vh * 0.55 / 100 * sc):.2f}"
        pf = f"png/portrait/{i}.png"
        if byfile.get(pf):
            m["portrait"] = byfile[pf]
            m["pw"], m["ph"] = map(str, Image.open(os.path.join(P, pf)).size)
    write(mf, mons, mhead)

    # 4. npcs.csv
    if npcs:
        nf = os.path.join(ROOT, "data/npcs.csv")
        rows = read(nf)
        nhead = list(rows[0].keys())
        for n in rows:
            if n["id"] in npcs:
                hit = [v for k, v in byfile.items() if k.startswith("png/npc") and os.path.basename(k).startswith(n["id"] + ".")]
                if not hit or len(hit[0]) != 32:
                    raise SystemExit(f"NPC {n['id']} 그림 RUID 없음")
                n["stand"] = hit[0]
        write(nf, rows, nhead)
    print(f"연결: 몬스터 {len(ids)} · NPC {len(npcs)}")


main()
