import json,hashlib,sys
from PIL import Image, ImageFilter
import numpy as np
APP="/Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icons7-approval-20261104.json"
OUT="/Users/leeinguk/Desktop/hoho/잡으면 내편/assets/claude-icons7-20261104/png"
m=json.load(open(APP))
def bbox(a,th=8):
    ys,xs=np.nonzero(a[...,3]>th); return xs.min(),ys.min(),xs.max()+1,ys.max()+1
def premul_resize(im,size):
    # Lanczos on premultiplied alpha to keep edges clean
    a=np.asarray(im).astype(np.float64)/255
    rgb=a[...,:3]*a[...,3:4]
    pm=Image.fromarray(np.uint8(np.round(np.dstack([rgb,a[...,3:4]])*255)),'RGBA')
    r=np.asarray(pm.resize(size,Image.LANCZOS)).astype(np.float64)/255
    al=r[...,3:4]; out=np.where(al>1e-4, r[...,:3]/np.maximum(al,1e-4),0)
    out=np.clip(out,0,1)
    res=np.dstack([out,al]); res=np.uint8(np.round(res*255))
    res[...,3][res[...,3]<3]=0
    res[res[...,3]==0,:3]=0
    return Image.fromarray(res,'RGBA')
def fit(src,box,canvas):
    a=np.asarray(src.convert('RGBA'))
    x0,y0,x1,y1=bbox(a); crop=src.crop((x0,y0,x1,y1))
    w,h=crop.size; s=box/max(w,h); nw,nh=max(1,round(w*s)),max(1,round(h*s))
    r=premul_resize(crop.convert('RGBA'),(nw,nh))
    c=Image.new('RGBA',(canvas,canvas),(0,0,0,0)); c.alpha_composite(r,((canvas-nw)//2,(canvas-nh)//2)); return c
rep=[]
for it in m['items']:
    b=open(it['file'],'rb').read(); assert hashlib.sha256(b).hexdigest()==it['sha256'],it['id']
    src=Image.open(it['file']).convert('RGBA')
    if it['id']=='wraith_dash':
        N=128
        yy,xx=np.mgrid[0:N,0:N]; d=np.sqrt(((xx-63.5)/63.5)**2+((yy-63.5)/63.5)**2)/1.4142
        cen=np.array([0x18,0x16,0x1a],float); edge=np.array([0x0b,0x0a,0x0c],float)
        t=np.clip(d,0,1)**1.6
        bg=(cen*(1-t)[...,None]+edge*t[...,None])
        bgim=Image.fromarray(np.uint8(np.dstack([bg,np.full((N,N),255)])),'RGBA')
        art=fit(src,int(sys.argv[1]) if len(sys.argv)>1 else 112,N)
        FR=np.asarray(Image.open('/Users/leeinguk/Desktop/hoho/잡으면 내편/assets/codex-skill-icons-v2-20261102/revision2-0640/png/main/main-enfeeble.png').convert('RGBA')).copy()
        e=np.minimum(np.minimum(xx,127-xx),np.minimum(yy,127-yy)); cx=np.minimum(xx,127-xx); cy=np.minimum(yy,127-yy)
        ring=(e<=4)|((cx+cy)<=13)&(cx<=10)&(cy<=10)
        bgim.alpha_composite(art); out=np.asarray(bgim).copy()
        # 프레임: 승인 v2 메인 세트 테두리를 그대로(밝은 금속 픽셀만) 덮음
        lum=FR[...,:3].astype(float).mean(-1); fm=ring&(lum>55)
        w=np.clip((lum-40)/40,0,1)[...,None]*fm[...,None]
        out[...,:3]=np.uint8(out[...,:3]*(1-w)+FR[...,:3]*w); out[ring&~fm,:3]=np.minimum(out[ring&~fm,:3],FR[ring&~fm,:3]+8)
        out=Image.fromarray(out,'RGBA'); name='main-wraith_dash.png'
    else:
        out=fit(src,84,96); name='node-%s.png'%it['id']
    out.save(OUT+'/'+name,optimize=True)
    a=np.asarray(out); al=a[...,3]
    ys,xs=np.nonzero(al>0)
    r=dict(id=it['id'],name=it['name'],file=name,size=list(out.size),src=it['file'],src_sha256=it['sha256'],out_sha256=hashlib.sha256(open(OUT+'/'+name,'rb').read()).hexdigest(),
      bbox=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())],alpha_min=int(al.min()),opaque_any=round(float((al>0).mean()),3),opaque_128=round(float((al>128).mean()),3))
    rep.append(r); print(r['id'],r['size'],r['bbox'],r['alpha_min'],r['opaque_any'],r['opaque_128'])
json.dump(rep,open(OUT+'/../pack-report.json','w'),ensure_ascii=False,indent=1)
