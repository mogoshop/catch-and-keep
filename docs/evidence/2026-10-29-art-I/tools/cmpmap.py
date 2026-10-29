import json,sys,re,math
S=1.28
def load(p):
    d=json.load(open(p,encoding='utf-8'))
    ents=d['ContentProto']['Entities']
    out={}
    for e in ents:
        js=e.get('jsonString')
        if isinstance(js,str): js=json.loads(js)
        out[e['path']]=(e,js)
    return out
def comps(js):
    return {c['@type']:c for c in js.get('@components',[])}
def pieces(m):
    res=[]
    for p,(e,js) in m.items():
        name=p.rsplit('/',1)[-1]
        if not re.match(r'ArtZone\d+_\d+$',name): continue
        c=comps(js); sr=c.get('MOD.Core.SpriteRendererComponent'); tr=c.get('MOD.Core.TransformComponent')
        pos=tr['Position']; w=sr['TiledSize']['x']*S; h=sr['TiledSize']['y']*S
        fx=sr.get('FlipX',False); fy=sr.get('FlipY',False)
        L=pos['x']+S/2-w if fx else pos['x']-S/2; B=pos['y']+S/2-h if fy else pos['y']-S/2
        res.append((L,L+w,B,B+h,sr['SpriteRUID'],fx,fy))
    return res
a=load(sys.argv[1]); b=load(sys.argv[2])
na={p for p in a if not re.match(r'.*/ArtZone\d+_\d+$',p)}; nb={p for p in b if not re.match(r'.*/ArtZone\d+_\d+$',p)}
print('non-mix entities', len(na), len(nb), 'same set', na==nb)
diff=0
for p in na&nb:
    ea,ja=a[p]; eb,jb=b[p]
    ca=json.dumps(ja.get('@components'),sort_keys=True); cb=json.dumps(jb.get('@components'),sort_keys=True)
    if ca!=cb or ea.get('id')!=eb.get('id'): diff+=1
print('non-mix entities differing (components/id):', diff)
# tilemap
for p in na:
    c=comps(a[p][1])
    if 'MOD.Core.RectTileMapComponent' in c:
        print('tilemap', p, 'same', json.dumps(c['MOD.Core.RectTileMapComponent'],sort_keys=True)==json.dumps(comps(b[p][1])['MOD.Core.RectTileMapComponent'],sort_keys=True))
pa=pieces(a); pb=pieces(b)
def cov(ps):
    s=set()
    for (L,R,B,T,*_) in ps:
        for x in range(math.floor(L)-1, math.ceil(R)+1):
            for y in range(math.floor(B)-1, math.ceil(T)+1):
                if all(L-1e-6<=x+(i+.5)/4<=R+1e-6 and B-1e-6<=y+(j+.5)/4<=T+1e-6 for i in range(4) for j in range(4)): s.add((x,y))
    return s
# a cell is fully covered if union covers all 16 points
def covunion(ps):
    pts={}
    for (L,R,B,T,*_) in ps:
        for x in range(math.floor(L), math.ceil(R)):
            for y in range(math.floor(B), math.ceil(T)):
                for i in range(4):
                    for j in range(4):
                        px=x+(i+.5)/4; py=y+(j+.5)/4
                        if L<=px<=R and B<=py<=T: pts.setdefault((x,y),set()).add((i,j))
    return {k for k,v in pts.items() if len(v)==16}
ca=covunion(pa); cb=covunion(pb)
print('mix pieces', len(pa), len(pb), 'full cells', len(ca), len(cb), 'cur covered not in trial', len(ca-cb))
# grid alignment: unflipped pieces' L on grid; flipped pieces' R on grid
ox=min(p[0] for p in pb)
def ongrid(v,o): k=(v-o)/S; return abs(k-round(k))<1e-3
from collections import Counter
print('trial flipX', sum(1 for p in pb if p[5]), 'flipY', sum(1 for p in pb if p[6]), 'cur flipX', sum(1 for p in pa if p[5]), 'flipY', sum(1 for p in pa if p[6]))
print('ruids', Counter(p[4] for p in pb))
if len(sys.argv)>3:
    lines=[l.rstrip('\n') for l in open(sys.argv[3],encoding='utf-8') if not l.startswith(';')]
    W=len(lines[0]); H=len(lines)
    for (x,y) in sorted(ca-cb):
        # bounds: x0=-W/2, y1=H/2 ; row index from top: r = H/2 - y
        col=int(x+W/2); row=int(H/2-y)
        ch=lines[row][col] if 0<=row<H and 0<=col<W else '?'
        print('  missing cell',(x,y),'blueprint char',repr(ch))
