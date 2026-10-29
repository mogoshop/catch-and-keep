#!/usr/bin/env python3
# 두 .map 비교: 엔티티 밖 최상위 필드 · 더해진/빠진 경로 · 같은 경로에서 바뀐 필드(키 경로) 목록
import json, sys
def load(p):
    d = json.load(open(p, encoding="utf-8"))
    ents = d["ContentProto"]["Entities"]
    by = {}
    for i, e in enumerate(ents):
        by[e["path"]] = (i, e)
    return d, ents, by
def flat(o, pre=""):
    out = {}
    if isinstance(o, dict):
        for k, v in o.items(): out.update(flat(v, f"{pre}.{k}" if pre else k))
    elif isinstance(o, list):
        for i, v in enumerate(o): out.update(flat(v, f"{pre}[{i}]"))
    else: out[pre] = o
    return out
def norm(e):
    e = dict(e)
    j = e.get("jsonString")
    if isinstance(j, str): e["jsonString"] = json.loads(j)
    return e
da, ea, a = load(sys.argv[1]); db, eb, b = load(sys.argv[2])
# 최상위(엔티티 밖)
ta = dict(da); tb = dict(db)
ta["ContentProto"] = {k: v for k, v in da["ContentProto"].items() if k != "Entities"}
tb["ContentProto"] = {k: v for k, v in db["ContentProto"].items() if k != "Entities"}
top = sorted(k for k in set(flat(ta)) | set(flat(tb)) if flat(ta).get(k) != flat(tb).get(k))
added = [p for p in b if p not in a]; removed = [p for p in a if p not in b]
changed = []
for p in a:
    if p not in b: continue
    fa, fb = flat(norm(a[p][1])), flat(norm(b[p][1]))
    keys = sorted(k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k))
    if keys: changed.append({"path": p, "fields": keys, "vals": {k: [fa.get(k), fb.get(k)] for k in keys[:4]}})
order_same = [p for p, _ in sorted(a.items(), key=lambda x: x[1][0])] == [p for p, _ in sorted(b.items(), key=lambda x: x[1][0]) if p in a]
tail = [p for p, _ in sorted(b.items(), key=lambda x: x[1][0])][-len(added):] if added else []
print(json.dumps({"a": sys.argv[1].split("/")[-1], "b": sys.argv[2], "entities": [len(a), len(b)], "top_level_diff": top,
  "added": added, "added_are_last_in_array": tail == added, "removed": removed, "existing_relative_order_same": order_same,
  "changed_n": len(changed), "changed": changed}, ensure_ascii=False, indent=1))
