#!/usr/bin/env python3
"""Run real mLua method bodies in Lua 5.4; engine services are supplied by each fixture.
Usage: python3 tests/quality/run.py --lua /path/to/lua [items journal skills]
This does not emulate MSW replication, UI layout, or save-service atomicity.
"""
import argparse, pathlib, re, shutil, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--lua', default=shutil.which('lua') or shutil.which('lua5.4'))
p.add_argument('--dump', help='optional path for the last exported Lua fixture')
p.add_argument('groups', nargs='*', default=['items','journal','skills'])
a = p.parse_args()
if not a.lua: p.error('Lua 5.4 is required; pass --lua /path/to/lua (no game dependencies are changed)')

def export(script, filename, methods):
    src = (ROOT / 'RootDesk/MyDesk' / filename).read_text()
    out = [f'{script} = {{}}', f'_{script} = {script}']
    for typ, name, value in re.findall(r'^    property (\w+) (\w+) = (.*)$',src,re.M):
        value = value.split(' --')[0].rstrip()
        out.append(f'{script}.{name} = {value}')
    available = set(re.findall(r'^    method [^\n]+? (\w+)\(', src, re.M))
    selected = []
    def include(name, recursive=False):
        if name in selected: return
        selected.append(name)
        if recursive:
            body = re.search(r'^    method [^\n]+? '+re.escape(name)+r'\([^\n]*\)\n(.*?)^    end$',src,re.M|re.S)
            if not body: raise ValueError(f'{filename}: method {name} not found')
            for child in re.findall(r'self:(\w+)\(', body[1]):
                if child in available: include(child, True)
    for method in methods.split(','): include(method.rstrip('+'), method.endswith('+'))
    for name in selected:
        m = re.search(r'^    method [^\n]+? '+re.escape(name)+r'\(([^\n]*)\)\n(.*?)^    end$',src,re.M|re.S)
        if not m: raise ValueError(f'{filename}: method {name} not found')
        args, defaults = [], []
        for param in m[1].split(','):
            if not param.strip(): continue
            decl, sep, value = param.partition('=')
            arg = decl.split()[-1]; args.append(arg)
            if sep: defaults.append(f'if {arg} == nil then {arg} = {value} end')
        out.append(f'function {script}:{name}({",".join(args)})\n'+ '\n'.join(defaults)+'\n'+m[2]+'end')
    return '\n'.join(out)

for group in a.groups:
    fixture = ROOT / 'tests/quality' / (group+'.lua')
    text = fixture.read_text()
    # @source Name relative/path.mlua Method1,Method2
    modules = [export(*m) for m in re.findall(r'^-- @source (\w+) (\S+) (\S+)$', text,re.M)]
    script = 'function log(...) end\nfunction Color(...) return {...} end\n' + '\n'.join(modules) + '\n' + text
    if a.dump: pathlib.Path(a.dump).write_text(script)
    with tempfile.TemporaryDirectory(prefix='maple-quality-') as tmp:
        file = pathlib.Path(tmp)/'fixture.lua'; file.write_text(script)
        result = subprocess.run([a.lua,str(file)],cwd=ROOT)
        if result.returncode: raise SystemExit(result.returncode)
