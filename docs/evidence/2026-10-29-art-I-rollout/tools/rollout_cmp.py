# I-2 확대 적용 바닥 외 보존 비교 — 커밋본(HEAD) map vs 새 map, 30쌍
#   사용: python3 rollout_cmp.py <before_dir> <after_dir> <out.json> <id>...   (각 id × ["", "_nm", "_hell"])
#   바닥 섞기 조각 = 맵 루트 자식 이름 ArtZone<n>_<m> (cmpmap.py와 같은 규칙)
import json, sys, re, math
from collections import Counter
S = 1.28
MIX = re.compile(r'/ArtZone\d+_\d+$')
RUID = {"0c0475e236704ca0ae9f52a47473577f": "r2", "8740df7f8f304fb3b80c0162a4658339": "v2",
        "5bf0d63ce6a848a98e1e3775ee7ac3c7": "v3", "1cb8bebbd6eb466a8097e70df9e361fc": "v4"}
def js(e):
    j = e.get('jsonString'); return json.loads(j) if isinstance(j, str) else j
def comps(j): return {c['@type']: c for c in j.get('@components', [])}
def pieces(ents):
    out = []
    for e in ents:
        if not MIX.search(e['path']): continue
        c = comps(js(e)); sr = c['MOD.Core.SpriteRendererComponent']; tr = c['MOD.Core.TransformComponent']
        pos = tr['Position']; w = sr['TiledSize']['x'] * S; h = sr['TiledSize']['y'] * S
        fx = sr.get('FlipX', False); fy = sr.get('FlipY', False)
        L = pos['x'] + S/2 - w if fx else pos['x'] - S/2; B = pos['y'] + S/2 - h if fy else pos['y'] - S/2
        out.append(dict(L=L, R=L+w, B=B, T=B+h, ruid=sr['SpriteRUID'], fx=fx, fy=fy, z=pos['z'],
                        color=json.dumps(sr.get('Color'), sort_keys=True), scale=json.dumps(tr.get('Scale'), sort_keys=True),
                        layer=sr.get('SortingLayer'), oil=sr.get('OrderInLayer')))
    return out
def covunion(ps):
    pts = {}
    for p in ps:
        for x in range(math.floor(p['L']), math.ceil(p['R'])):
            for y in range(math.floor(p['B']), math.ceil(p['T'])):
                for i in range(4):
                    for j in range(4):
                        px = x + (i+.5)/4; py = y + (j+.5)/4
                        if p['L'] <= px <= p['R'] and p['B'] <= py <= p['T']: pts.setdefault((x, y), set()).add((i, j))
    return {k for k, v in pts.items() if len(v) == 16}
def cmp(fa, fb):
    da = json.load(open(fa, encoding='utf-8')); db = json.load(open(fb, encoding='utf-8'))
    top_same = all(da[k] == db[k] for k in da if k != 'ContentProto') and set(da) == set(db) and da['ContentProto'].get('Use') == db['ContentProto'].get('Use')
    ea = da['ContentProto']['Entities']; eb = db['ContentProto']['Entities']
    na = [e for e in ea if not MIX.search(e['path'])]; nb = [e for e in eb if not MIX.search(e['path'])]
    ma = {e['path']: e for e in na}; mb = {e['path']: e for e in nb}
    r = dict(nonmix_before=len(na), nonmix_after=len(nb), nonmix_same_paths=set(ma) == set(mb))
    idcomp_diff = 0; full_equal = 0; only_order_diff = 0; other_diff = []
    for p in ma.keys() & mb.keys():
        a, b = ma[p], mb[p]; ja, jb = js(a), js(b)
        same_core = a['id'] == b['id'] and a.get('componentNames') == b.get('componentNames') and \
            json.dumps(ja.get('@components'), sort_keys=True) == json.dumps(jb.get('@components'), sort_keys=True)
        if not same_core: idcomp_diff += 1; continue
        if json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True): full_equal += 1; continue
        ka = {k: v for k, v in ja.items() if k != 'displayOrder'}; kb = {k: v for k, v in jb.items() if k != 'displayOrder'}
        if json.dumps(ka, sort_keys=True) == json.dumps(kb, sort_keys=True): only_order_diff += 1
        else: other_diff.append(p)
    r.update(nonmix_id_components_differ=idcomp_diff, nonmix_entity_fully_equal=full_equal,
             nonmix_displayOrder_only_differ=only_order_diff, nonmix_other_field_differ=len(other_diff), nonmix_other_examples=other_diff[:5])
    # 생성 순서: 바닥 외 엔티티의 상대 순서 · 파일 안 절대 위치
    r['nonmix_relative_order_same'] = [e['path'] for e in na] == [e['path'] for e in nb]
    ia = {e['path']: i for i, e in enumerate(ea)}; ib = {e['path']: i for i, e in enumerate(eb)}
    r['nonmix_absolute_index_moved'] = sum(1 for p in ma.keys() & mb.keys() if ia[p] != ib[p])
    # 바닥 외 엔티티 텍스트(직렬화) 바이트 동일 — 엔티티 객체 하나씩 다시 직렬화해 비교 (displayOrder 포함)
    r['nonmix_bytes_equal_count'] = full_equal
    # RectTileMap
    tm = []
    for p in ma:
        c = comps(js(ma[p]))
        if 'MOD.Core.RectTileMapComponent' in c:
            cb = comps(js(mb[p])) if p in mb else {}
            tm.append(json.dumps(c['MOD.Core.RectTileMapComponent'], sort_keys=True) == json.dumps(cb.get('MOD.Core.RectTileMapComponent'), sort_keys=True))
    r['recttilemap_count'] = len(tm); r['recttilemap_same'] = all(tm) and len(tm) > 0
    r['top_level_fields_same'] = top_same
    pa, pb = pieces(ea), pieces(eb)
    def st(ps):
        return dict(pieces=len(ps), flipX=sum(p['fx'] for p in ps), flipY=sum(p['fy'] for p in ps),
                    by_sheet=dict(Counter(RUID.get(p['ruid'], p['ruid']) for p in ps)),
                    z=sorted(set(p['z'] for p in ps)), colors=len(set(p['color'] for p in ps)),
                    scales=sorted(set(p['scale'] for p in ps)), layers=sorted(set(str(p['layer'])+'/'+str(p['oil']) for p in ps)))
    sa, sb = st(pa), st(pb)
    r['mix_before'] = {k: sa[k] for k in ('pieces', 'flipX', 'flipY', 'by_sheet')}
    r['mix_after'] = {k: sb[k] for k in ('pieces', 'flipX', 'flipY', 'by_sheet')}
    r['mix_z_same'] = sa['z'] == sb['z']; r['mix_scale_same'] = sa['scales'] == sb['scales']; r['mix_layer_same'] = sa['layers'] == sb['layers']
    r['mix_color_set_same'] = set(p['color'] for p in pa) == set(p['color'] for p in pb)
    r['mix_unknown_ruid_after'] = [k for k in sb['by_sheet'] if k not in ('r2', 'v2', 'v3', 'v4')]
    ca, cb = covunion(pa), covunion(pb)
    r['full_cells_before'] = len(ca); r['full_cells_after'] = len(cb); r['cells_covered_before_not_after'] = sorted(ca - cb)
    return r
bd, ad, out = sys.argv[1], sys.argv[2], sys.argv[3]
res = {}
for i in sys.argv[4:]:
    for s in ("", "_nm", "_hell"):
        f = f"{i}{s}.map"; res[f] = cmp(f"{bd}/{f}", f"{ad}/{f}")
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for f, r in res.items():
    print(f"{f:24s} 바닥외 {r['nonmix_before']}/{r['nonmix_after']} 경로같음 {r['nonmix_same_paths']} id·컴포넌트다름 {r['nonmix_id_components_differ']} "
          f"엔티티완전동일 {r['nonmix_entity_fully_equal']} displayOrder만다름 {r['nonmix_displayOrder_only_differ']} 기타필드다름 {r['nonmix_other_field_differ']} "
          f"상대순서같음 {r['nonmix_relative_order_same']} 절대위치이동 {r['nonmix_absolute_index_moved']} 타일맵 {r['recttilemap_same']}({r['recttilemap_count']}) 머리 {r['top_level_fields_same']} | "
          f"조각 {r['mix_before']['pieces']}→{r['mix_after']['pieces']} FX {r['mix_before']['flipX']}→{r['mix_after']['flipX']} FY {r['mix_before']['flipY']}→{r['mix_after']['flipY']} 장 {r['mix_after']['by_sheet']} "
          f"z·배율·층·색 {r['mix_z_same']}/{r['mix_scale_same']}/{r['mix_layer_same']}/{r['mix_color_set_same']} 덮개 {r['full_cells_before']}→{r['full_cells_after']} 빠진칸 {len(r['cells_covered_before_not_after'])}")
