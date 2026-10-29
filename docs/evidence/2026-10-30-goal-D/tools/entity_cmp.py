#!/usr/bin/env python3
# map 두 개 엔티티 비교: 경로 집합 · 같은 경로의 컴포넌트(JSON) 같음 · id만 다름 · 더해진/빠진 경로
import json, sys
def load(p):
    d = json.load(open(p, encoding="utf-8"))
    out = {}
    for e in d["ContentProto"]["Entities"]:
        j = e.get("jsonString"); j = json.loads(j) if isinstance(j, str) else j
        out[e["path"]] = (e, j)
    return d, out
da, a = load(sys.argv[1]); db, b = load(sys.argv[2])
added = sorted(set(b) - set(a)); removed = sorted(set(a) - set(b))
same_full = same_comp = diff = 0; diffs = []
for p in set(a) & set(b):
    (ea, ja), (eb, jb) = a[p], b[p]
    if json.dumps(ea, sort_keys=True) == json.dumps(eb, sort_keys=True): same_full += 1; continue
    ca = json.dumps(ja.get("@components"), sort_keys=True); cb = json.dumps(jb.get("@components"), sort_keys=True)
    if ca == cb and ea.get("componentNames") == eb.get("componentNames"): same_comp += 1
    else: diff += 1; diffs.append(p)
res = dict(before=sys.argv[1].split("/")[-1], entities_before=len(a), entities_after=len(b), added=added, removed=removed,
           same_bytes=same_full, same_components_other_fields_differ=same_comp, component_differ=diff, component_differ_examples=diffs[:6])
print(json.dumps(res, ensure_ascii=False))
