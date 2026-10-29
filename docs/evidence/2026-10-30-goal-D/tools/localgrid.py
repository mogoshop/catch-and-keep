#!/usr/bin/env python3
# 설계도 국소 격자 출력: localgrid.py <txt> <x0> <x1> <y0> <y1>
import sys
path = sys.argv[1]
x0, x1, y0, y1 = map(int, sys.argv[2:6])
rows, w, h = [], 0, 0
for l in open(path, encoding="utf-8"):
    l = l.rstrip("\n")
    if l.startswith(";size"): w, h = map(int, l.split()[1:3])
    elif not l.startswith(";") and l.strip(): rows.append(l)
at = lambda x, y: rows[h // 2 - y][x + w // 2]
print("     " + "".join(str(abs(x) % 10) for x in range(x0, x1 + 1)))
for y in range(y1, y0 - 1, -1):
    print(f"{y:4} " + "".join(at(x, y) for x in range(x0, x1 + 1)))
