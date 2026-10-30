#!/usr/bin/env python3
"""F03 S90 복원본 만들기 (메이커 없이 · 읽기만).
사용: python3 F03-make-restore.py <S00 로그가 든 텍스트 파일> [출력 경로]
S00의 `[F03] backup key=K len=L hash=H` 줄과 `[F03] bak K i/n 16진` 조각을 모아 5키 원문을 되살리고,
len/djb2가 backup 줄과 같은지 확인한 뒤 F03-maker-scripts.lua의 S90 블록에 E·HEX를 채워 F03-S90-filled.lua로 쓴다.
하나라도 안 맞으면 파일을 쓰지 않고 1로 끝난다(그때는 복원하지 말고 보고).
"""
import pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
KEYS = ['Account', 'Char_4', 'Inv_4', 'Shadow_4', 'Stash']

def djb2(b):
    a = 5381
    for x in b:
        a = (a * 33 + x) % 2147483647
    return a

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    text = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8', errors='replace')
    out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'F03-S90-filled.lua'
    exp, parts, total = {}, {}, {}
    for m in re.finditer(r'\[F03\] backup key=(\w+) len=(\d+) hash=(\d+)', text):
        exp[m[1]] = f'{m[2]}/{m[3]}'
    for m in re.finditer(r'\[F03\] bak (\w+) (\d+)/(\d+) ([0-9a-f]*)', text):
        parts.setdefault(m[1], {})[int(m[2])] = m[4]
        total[m[1]] = int(m[3])
    hexes, ok = {}, True
    for k in KEYS:
        n = total.get(k)
        got = parts.get(k, {})
        if k not in exp or n is None or any(i not in got for i in range(1, n + 1)):
            print(f'{k}: 조각/backup 줄 부족 (backup={k in exp} n={n} have={sorted(got)})'); ok = False; continue
        hx = ''.join(got[i] for i in range(1, n + 1))
        body = bytes.fromhex(hx)
        s = f'{len(body)}/{djb2(body)}'
        print(f'{k}: backup={exp[k]} rebuilt={s} {"OK" if s == exp[k] else "MISMATCH"}')
        if s != exp[k]: ok = False
        hexes[k] = hx
    if not ok:
        sys.exit('복원본을 만들지 않음 (위 줄 확인)')
    src = (HERE / 'F03-maker-scripts.lua').read_text(encoding='utf-8')
    i = src.index('-- ===================== S90')
    block = src[i:]
    e_lua = 'local E={' + ','.join(f"{k}='{exp[k]}'" for k in KEYS) + '}'
    h_lua = 'local HEX={' + ','.join(f"{k}='{hexes[k]}'" for k in KEYS) + '}'
    block = block.replace('local E={} --@@E@@', e_lua).replace('local HEX={} --@@HEX@@', h_lua)
    if '--@@' in block:
        sys.exit('S90 자리표시를 못 찾음')
    out.write_text(block, encoding='utf-8')
    print(f'wrote {out} ({len(block)} bytes)')

main()
