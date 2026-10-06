#!/usr/bin/env python3
"""data/*.csv -> data/lua/*.lua (mLua 모듈용 테이블). 표준 라이브러리만 사용."""
import csv, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "data", ROOT / "data" / "lua"


def lit(v: str) -> str:
    if v == "":
        return "nil"
    try:
        float(v)
        return v
    except ValueError:
        return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'


def convert(path: pathlib.Path) -> str:
    with path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    keycol = list(rows[0].keys())[0]
    out = ["-- 자동 생성: tools/csv_to_lua.py. 직접 수정 금지 (data/%s 를 수정)" % path.name,
           "return {"]
    for r in rows:
        fields = ", ".join("%s = %s" % (k, lit(v)) for k, v in r.items() if k != keycol and k != "note" and v != "")
        out.append('  ["%s"] = { %s },' % (r[keycol], fields))
    out.append("}")
    return "\n".join(out) + "\n"


def main() -> int:
    DST.mkdir(exist_ok=True)
    for p in sorted(SRC.glob("*.csv")):
        (DST / (p.stem + ".lua")).write_text(convert(p), encoding="utf-8")
        print("생성:", (DST / (p.stem + ".lua")).relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
