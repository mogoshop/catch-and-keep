# 11-04 뼈 쐐기 아이콘 3종 패킹 — 승인본(claude-icons3-approved-sources-20261104.json) SHA 재대조 후 규격 검사.
# 원본이 이미 규격(메인 128 불투명 · 노드 96 RGBA, bbox 6~90, 여백>=6, 불투명 0.21~0.55)이면 픽셀 그대로 복사(재가공·재샘플 없음).
# 규격을 벗어날 때만 icons7 pack7.py와 같은 공정(알파 bbox → 84px 상자 Lanczos(프리멀티 알파) 축소 · 중앙)으로 맞춘다.
import json,hashlib,shutil,sys
from PIL import Image
import numpy as np
APP="/Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icons3-approved-sources-20261104.json"
G="/Users/leeinguk/Desktop/hoho/잡으면 내편"
OUTS=[G+"/assets/claude-icons3-20261104/png",G+"/docs/evidence/2026-11-04-icons3-apply/png"]
NAMES={"main-bone_spikes":("bone_spikes","뼈 쐐기"),"node-sudden_impact":("sudden_impact","급작스러운 충격"),"node-bone_pillars":("bone_pillars","뼈 기둥")}
def premul_resize(im,size):
    a=np.asarray(im).astype(np.float64)/255; rgb=a[...,:3]*a[...,3:4]
    pm=Image.fromarray(np.uint8(np.round(np.dstack([rgb,a[...,3:4]])*255)),'RGBA')
    r=np.asarray(pm.resize(size,Image.LANCZOS)).astype(np.float64)/255
    al=r[...,3:4]; out=np.clip(np.where(al>1e-4,r[...,:3]/np.maximum(al,1e-4),0),0,1)
    res=np.uint8(np.round(np.dstack([out,al])*255)); res[...,3][res[...,3]<3]=0; res[res[...,3]==0,:3]=0
    return Image.fromarray(res,'RGBA')
def fit(src,box,canvas):
    a=np.asarray(src); ys,xs=np.nonzero(a[...,3]>8); crop=src.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    w,h=crop.size; s=box/max(w,h); nw,nh=max(1,round(w*s)),max(1,round(h*s)); r=premul_resize(crop,(nw,nh))
    c=Image.new('RGBA',(canvas,canvas),(0,0,0,0)); c.alpha_composite(r,((canvas-nw)//2,(canvas-nh)//2)); return c
def stats(im):
    al=np.asarray(im.convert('RGBA'))[...,3]; ys,xs=np.nonzero(al>0); N=im.size[0]
    bb=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]
    return dict(size=list(im.size),mode=im.mode,bbox=bb,margin=min(bb[0],bb[1],N-1-bb[2],N-1-bb[3]),alpha_min=int(al.min()),opaque_any=round(float((al>0).mean()),3),opaque_128=round(float((al>128).mean()),3))
def ok(key,s):
    if key.startswith('main-'): return s['size']==[128,128] and s['alpha_min']==255
    return s['size']==[96,96] and 6<=min(s['bbox']) and max(s['bbox'])<=90 and s['margin']>=6 and 0.21<=s['opaque_any']<=0.55
rep=[]
for it in json.load(open(APP)):
    b=open(it['path'],'rb').read(); sha=hashlib.sha256(b).hexdigest(); assert sha==it['sha256'],it['key']
    src=Image.open(it['path']).convert('RGBA'); s0=stats(src); key=it['key']; name=key+'.png'
    if ok(key,s0):
        method='identity'
        for o in OUTS: shutil.copyfile(it['path'],o+'/'+name)
    else:
        method='lanczos-fit'
        out=src.resize((128,128),Image.LANCZOS) if key.startswith('main-') else fit(src,84,96)
        for o in OUTS: out.save(o+'/'+name,optimize=True)
    oim=Image.open(OUTS[0]+'/'+name); s=stats(oim); assert ok(key,s),(key,s)
    i,n=NAMES[key]
    r=dict(id=i,name=n,key=key,file=name,method=method,src=it['path'],src_sha256=sha,sha_match=True,out_sha256=hashlib.sha256(open(OUTS[0]+'/'+name,'rb').read()).hexdigest(),**s)
    rep.append(r); print(i,method,r['size'],r['bbox'],'margin',r['margin'],'alpha_min',r['alpha_min'],'opaque',r['opaque_any'],r['opaque_128'])
json.dump(rep,open(G+"/assets/claude-icons3-20261104/pack-report.json",'w'),ensure_ascii=False,indent=1)
