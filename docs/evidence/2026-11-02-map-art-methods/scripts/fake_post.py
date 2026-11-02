import numpy as np, json, sys
from PIL import Image, ImageFilter, ImageDraw, ImageFont
sys.path.insert(0,'.')
from metrics import metrics, nd
R="/Users/leeinguk/Desktop/hoho/잡으면 내편"
EV=R+"/docs/evidence/2026-11-02-scene-plate-wasteland"
REF=R+"/docs/design/53-scene-plate/refs"
A=R+"/assets/codex-scene-plate-wasteland-20261101"
W=R+"/assets/codex-scene-plate-wasteland-wall-20261102"
plate=Image.open(EV+"/offline-wall-after.png").convert("RGB").crop((0,44,2000,1044))  # 1px = 1/100 칸, 구역 x -35~-15, y 6~-4
# --- 타일 띠(오른쪽 8칸): 마른 풀 바탕 + 수레길 3줄 (원본 128px = 1.28칸 = 128px)
def tile(img, w, h):
    t=Image.open(img).convert("RGB"); o=Image.new("RGB",(w,h))
    for y in range(0,h,t.height):
        for x in range(0,w,t.width): o.paste(t,(x,y))
    return o
strip=tile(REF+"/floor-a1-dead-grass-floor.png",800,1000)
road=tile(REF+"/floor-a1-cart-road.png",800,384); strip.paste(road,(0,330))
# --- 장면판 마스크(구조물 경계): 벽 덮개 알파 + 특징물 알파
mask_feat=np.zeros((1000,2000),bool)
wc=np.asarray(Image.open(W+"/wall-cover.png"))[...,3]>127
def place(fn,wx,wy,px,py):
    im=np.asarray(Image.open(A+"/"+fn).convert("RGBA")); h,w=im.shape[:2]
    x0=int(round((wx+35)*100-px*w)); y0=int(round((6-wy)*100-(1-py)*h))
    m=np.zeros((1000,2000),bool); ys=slice(max(y0,0),min(y0+h,1000)); xs=slice(max(x0,0),min(x0+w,2000))
    m[ys,xs]=im[ys.start-y0:ys.stop-y0, xs.start-x0:xs.stop-x0,3]>127; return m
mask_feat|=place("feature-raven-deadtree.png",-29,4.05,0.5,0.0454545)
mask_feat|=place("feature-fallen-watchpost.png",-25,-2.55,0.5,0.0454545)
struct=wc|mask_feat
def outline(arr, m, k=0.28):
    edge=m & ~nd.binary_erosion(m)
    out=arr.copy(); out[edge]=out[edge]*k; return out
def post(img, pix2=False):
    a=np.asarray(img).astype(np.float64)
    L=(0.299*a[...,0]+0.587*a[...,1]+0.114*a[...,2])[...,None]
    # 1) 채도 ×0.62 · 명암 폭 ×0.78 (타일 바닥 채도 0.10 · 밝기 0.32 쪽으로)
    a=L+(a-L)*0.62
    mean=L.mean(); a=mean*0.95+(a-mean)*0.78
    # 2) 결 이식: 타일(마른 풀) 바닥의 고주파(원본 − 5×5 평균)를 깔아 1px 잔결을 타일 수준으로
    t=tile(REF+"/floor-a1-dead-grass-floor.png",2000,1000); ta=np.asarray(t).astype(np.float64)
    tl=0.299*ta[...,0]+0.587*ta[...,1]+0.114*ta[...,2]; hf=tl-nd.uniform_filter(tl,5)
    a=a+(hf*0.55)[...,None]*(~struct)[...,None]
    a=np.clip(a,0,255)
    img2=Image.fromarray(a.astype(np.uint8))
    if pix2:
        img2=img2.resize((1000,500),Image.BOX).resize((2000,1000),Image.NEAREST)
    # 3) 가장자리 선명: 언샤프(반경 1 · 80%)
    img2=img2.filter(ImageFilter.UnsharpMask(radius=1,percent=50,threshold=3))
    # 4) 1px 짙은 외곽선: 벽 덮개·특징물 경계
    a=outline(np.asarray(img2).astype(np.float64), struct)
    img2=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    # 5) 팔레트: 256색 + 플로이드-스타인버그 디더 (PIL 한도 256 — 코덱스 공정 700색 이하와 같은 방향)
    img2=img2.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert("RGB")
    return img2
variants={"현재":plate,"후처리 A":post(plate),"후처리 B (A + 2배 도트화)":post(plate,True)}
char=Image.open(REF+"/char-player-standing-62px.png").convert("RGBA")
g=Image.open(REF+"/monster-fallenimp-stand-0(굶주린구울).png").convert("RGBA")
h=Image.open(REF+"/monster-hellhound-stand-0(잿불들개).png").convert("RGBA")
res={}
panels=[]
for name,img in variants.items():
    c=Image.new("RGB",(2800,1000)); c.paste(img,(0,0)); c.paste(strip,(2000,0))
    # 배우: 장면판 위(구울·들개) · 경계(캐릭터) · 타일 위(들개)
    c.paste(g,(1620,470),g); c.paste(h,(1760,560),h); c.paste(char,(1985,500),char); c.paste(h,(2200,520),h)
    pa=np.asarray(img.convert("RGBA")).astype(np.float64)
    m=metrics(pa[400:700,500:900]); m2=metrics(pa)
    res[name]={"길 400×300":m,"장면판 전체":m2}
    crop=c.crop((1200,250,2600,850))   # 14×6칸 · 1px=1/100칸
    panels.append((name,crop))
st=metrics(np.asarray(strip.convert("RGBA")).astype(np.float64)); res["타일 띠(비교)"]={"전체":st}
json.dump(res,open("fake_post_metrics.json","w"),ensure_ascii=False,indent=1)
# 비교판
try: font=ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc",30); fs=ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc",22)
except Exception: font=fs=ImageFont.load_default()
Wd=1400; Hp=600; out=Image.new("RGB",(Wd,len(panels)*(Hp+90)+40),(18,17,22)); d=ImageDraw.Draw(out)
for i,(name,crop) in enumerate(panels):
    y=i*(Hp+90)+20
    m=res[name]["길 400×300"]
    d.text((16,y),f"{name}",fill=(235,225,200),font=font)
    d.text((300,y+4),f"장면판 길: 채도 {m['sat']:.2f} · 밝기 {m['lum']:.2f} · 잔결 {m['hf_share']:.2f} · 라플라시안 {m['lapvar']:.0f} · 선명도 {m['crisp']:.2f}",fill=(200,195,180),font=fs)
    d.text((300,y+38),f"타일 띠:     채도 {st['sat']:.2f} · 밝기 {st['lum']:.2f} · 잔결 {st['hf_share']:.2f} · 라플라시안 {st['lapvar']:.0f} · 선명도 {st['crisp']:.2f}",fill=(150,150,145),font=fs)
    out.paste(crop,(0,y+76))
    d.line([(800,y+76),(800,y+76+Hp)],fill=(255,80,60),width=1)
d.text((16,out.height-30),"왼쪽=장면판(offline-wall-after) · 빨간 선 오른쪽=기존 타일 원본 · 배우=원본 서기 그림 · 1px=1/100칸 · 게임 파일 변경 없음",fill=(150,145,140),font=fs)
out.save("compare-postprocess.png")
print(json.dumps({k:{kk:{x:round(y,3) for x,y in vv.items() if isinstance(y,float)} for kk,vv in v.items()} for k,v in res.items()},ensure_ascii=False,indent=0))
