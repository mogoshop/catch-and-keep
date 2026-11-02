import os, csv
import numpy as np
from PIL import Image, ImageDraw, ImageFont
REPO="/Users/leeinguk/Desktop/hoho/잡으면 내편"; S=os.path.dirname(os.path.abspath(__file__))
OUT=f"{REPO}/docs/evidence/2026-11-02-map-capture-v5"
P="/Users/leeinguk/Library/Application Support/com.nexon.mod.inhouse/McpScreenshots"
G=f"{REPO}/docs/evidence/2026-10-31-map-capture-guide"
def font(n): return ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", n)
maps={r["id"]:r for r in csv.DictReader(open(f"{REPO}/data/maps.csv",encoding="utf-8"))}
modes={r["id"]:r["mode"] for r in csv.DictReader(open(f"{REPO}/data/handmade/v5_modes.csv",encoding="utf-8"))}
shots=dict(l.rstrip('\n').split('\t') for l in open(f"{S}/shots.tsv"))
grows={l.split("\t")[1]:l.rstrip("\n").split("\t") for l in open(f"{G}/maps-index.tsv").readlines()[1:]}
order=sorted(grows, key=lambda m:int(grows[m][0]))
crops={}; idx=["no\tid\tact\tkind\tw\th\ts\tshot\tcrop_px\tbbox_px\tcrop_box(l,t,r,b)\tmean_brightness\tprev_brightness_1031"]
warn=[]
def oldcrop(mid):
    r=grows[mid]; box=eval(r[10]); return Image.open(f"{G}/raw/{r[0]}-{mid}.png").convert("RGB").crop(box)
for mid in order:
    no=grows[mid][0]; ts=shots[mid]
    src=f"{P}/maker_play_20261102_{ts}.png"; im=Image.open(src).convert("RGB"); a=np.asarray(im).astype(int)
    Hh,W=a.shape[:2]; PPU=W/(1280/30)
    w,h=int(maps[mid]["w"]),int(maps[mid]["h"]); s=min(42/(w+1),23.4/(h+1))*0.97
    ew,eh=int(round(w*s*PPU)),int(round(h*s*PPU))
    m=a.sum(2)>30; m[:int(Hh*0.12),int(W*0.88):]=False
    ys,xs=np.where(m); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    bw,bh=x1-x0+1,y1-y0+1
    if abs(bw-ew)>2 or abs(bh-eh)>2: warn.append(f"{mid} bbox {bw}x{bh} vs {ew}x{eh}")
    box=(int(x0),int(y1+1-eh),int(x0+ew),int(y1+1)); c=im.crop(box); crops[mid]=c
    c.save(f"{OUT}/raw/{no}-{mid}.png",optimize=True)
    br=float(np.asarray(c).mean()); pb=float(np.asarray(oldcrop(mid)).mean())
    idx.append(f"{no}\t{mid}\t{maps[mid]['act']}\t{maps[mid]['kind']}\t{w}\t{h}\t{s:.3f}\tmaker_play_20261102_{ts}.png\t{ew}x{eh}\t{bw}x{bh}\t{box}\t{br:.1f}\t{pb:.1f}")
open(f"{OUT}/maps-index.tsv","w").write("\n".join(idx)+"\n")
print("\n".join(warn) or "bbox all ok")
BG,GOLD,TXT,DIM=(16,14,20),(230,200,138),(236,228,210),(150,142,132)
def scaled(img,mid,K): w,h=int(maps[mid]["w"]),int(maps[mid]["h"]); return img.resize((w*K,h*K),Image.LANCZOS)
TITLES={1:"액트 1 · 무덤 왕국",2:"액트 2 · 모래 왕국",3:"액트 3 · 얕은 바다",4:"액트 4 · 불타는 심연"}
for act,title in TITLES.items():
    ids=[m for m in order if maps[m]["act"]==str(act)]
    K,maxw,gap,lab,fs=11,1800,24,58,24
    items=[(m,scaled(crops[m],m,K)) for m in ids]; rws,cur,cw=[],[],0
    for m,t in items:
        if cur and cw+gap+t.width>maxw-2*gap: rws.append(cur); cur,cw=[],0
        cur.append((m,t)); cw+=(gap if cw else 0)+t.width
    if cur: rws.append(cur)
    top=120; Ht=top+sum(max(t.height for _,t in r)+lab+gap for r in rws)+gap
    sh=Image.new("RGB",(maxw,Ht),BG); d=ImageDraw.Draw(sh)
    d.text((gap,22),f"{title} — 맵 메이커 재촬영 {len(ids)}장 (11-02)",fill=GOLD,font=font(44))
    d.text((gap,78),"메이커 클라이언트 11-02 10:26~10:39 · HEAD 86789485 · 같은 축척 1칸 = 11px · 맵 그림만 줄여 찍음(몬스터·플레이어·UI·어둠 끔) · 번호 = maps.csv 순서",fill=DIM,font=font(20))
    y=top
    for r in rws:
        x=gap
        for m,t in r:
            rr=maps[m]; d.text((x,y),f"{grows[m][0]} {rr['name']}",fill=TXT,font=font(fs))
            d.text((x,y+fs+4),f"{m} · {rr['w']}×{rr['h']} · {rr['kind']} · {modes.get(m,'')}",fill=DIM,font=font(19))
            sh.paste(t,(x,y+lab)); x+=t.width+gap
        y+=max(t.height for _,t in r)+lab+gap
    sh.save(f"{OUT}/sheet-act{act}.png",optimize=True); print("sheet",act,sh.size)
    K=6; gap=20; lab=46; pairs=[(m,scaled(oldcrop(m),m,K),scaled(crops[m],m,K)) for m in ids]
    W=1800; colw=max(a.width*2+12 for _,a,_ in pairs)+gap; cols=max(1,(W-gap)//colw)
    rowsl=[pairs[i:i+cols] for i in range(0,len(pairs),cols)]
    Ht=130+sum(max(p[1].height for p in r)+lab+26+gap for r in rowsl)
    sh=Image.new("RGB",(max(W,cols*colw+gap),Ht),BG); d=ImageDraw.Draw(sh)
    d.text((gap,22),f"{title} — 10-31 ↔ 11-02 비교 ({len(pairs)}장)",fill=GOLD,font=font(40))
    d.text((gap,76),"왼쪽 = 10-31 12:28 길 안내판 캡처(map-capture-guide raw · 자료실 지금 사진의 원본) · 오른쪽 = 11-02 10:26~10:39 메이커 재촬영 · 같은 축척 1칸 = 6px",fill=DIM,font=font(20))
    y=130
    for r in rowsl:
        x=gap
        for m,a,b in r:
            rr=maps[m]; d.text((x,y),f"{grows[m][0]} {rr['name']} · {m} · {rr['w']}×{rr['h']}",fill=TXT,font=font(20))
            d.text((x,y+24),"10-31",fill=DIM,font=font(16)); d.text((x+a.width+12,y+24),"11-02",fill=GOLD,font=font(16))
            sh.paste(a,(x,y+lab)); sh.paste(b,(x+a.width+12,y+lab)); x+=colw
        y+=max(p[1].height for p in r)+lab+26+gap
    sh.save(f"{OUT}/compare-act{act}.png",optimize=True); print("compare",act,sh.size)
