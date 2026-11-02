import json,csv,re,os,sys
R="/Users/leeinguk/Desktop/hoho/잡으면 내편"; ext='.'+'map'
G=f"{R}/docs/evidence/2026-10-31-map-capture-guide/maps-index.tsv"
ids=[l.split('\t')[:4] for l in open(G).read().strip().split('\n')[1:]]
maps={r['id']:r for r in csv.DictReader(open(f"{R}/data/maps.csv",encoding="utf-8"))}
out=[]
for no,mid,act,kind in ids:
    p=f"{R}/map/{mid}{ext}"
    E=json.load(open(p))['ContentProto']['Entities']
    pre=f"/maps/{mid}/"
    names=[e['path'][len(pre):] for e in E if e['path'].startswith(pre) and '/' not in e['path'][len(pre):]]
    art=[n for n in names if n.startswith('Art')]
    f=lambda rx: sum(1 for n in art if re.match(rx,n))
    out.append((no,mid,act,kind,maps[mid]['w'],maps[mid]['h'],len(art),f(r'^ArtProp\d+$'),sum(1 for n in art if n.endswith('Top')),f(r'^ArtRoad'),f(r'^ArtPlate'),f(r'^ArtGuide'),int(os.path.getmtime(p))))
with open(sys.argv[1],'w') as fo:
    fo.write("no\tid\tact\tkind\tw\th\tart\tprop\ttop\troad\tplate\tguide\tmtime\n")
    for o in out: fo.write("\t".join(map(str,o))+"\n")
print(len(out))
