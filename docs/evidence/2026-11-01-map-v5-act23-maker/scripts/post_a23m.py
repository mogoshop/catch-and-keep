import sys, os, csv
import numpy as np
from PIL import Image, ImageDraw, ImageFont
REPO="/Users/leeinguk/Desktop/hoho/잡으면 내편"; S=os.path.dirname(os.path.abspath(__file__))
OUT=f"{REPO}/docs/evidence/2026-11-01-map-v5-act23-maker"
P="/Users/leeinguk/Library/Application Support/com.nexon.mod.inhouse/McpScreenshots"
G=f"{REPO}/docs/evidence/2026-10-31-map-capture-guide"
def font(n): return ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", n)
maps={r["id"]:r for r in csv.DictReader(open(f"{REPO}/data/maps.csv",encoding="utf-8"))}
modes={r["id"]:r["mode"] for r in csv.DictReader(open(f"{REPO}/data/handmade/v5_modes.csv",encoding="utf-8"))}
rows=[l.split('\t') for l in open(f'{S}/raw.tsv').read().strip().split('\n')]
crops={}; idx=["no\tid\tact\tw\th\ts\tshot\tcrop_px\tcrop_box(l,t,r,b)\tmean_brightness"]
for no,mid,ts in rows:
    src=f"{P}/maker_play_20261101_{ts}.png"; im=Image.open(src).convert("RGB"); a=np.asarray(im).astype(int)
    Hh,W=a.shape[:2]; PPU=W/(1280/30)
    w,h=int(maps[mid]["w"]),int(maps[mid]["h"]); s=min(42/(w+1),23.4/(h+1))*0.97
    ew,eh=int(round(w*s*PPU)),int(round(h*s*PPU))
    m=a.sum(2)>30; m[:int(Hh*0.12),int(W*0.88):]=False
    ys,xs=np.where(m); x0,y1=xs.min(),ys.max()
    box=(int(x0),int(y1+1-eh),int(x0+ew),int(y1+1)); crops[mid]=im.crop(box); im.save(f"{OUT}/raw/{no}-{mid}.jpg",quality=88)
    br=float(np.asarray(crops[mid]).mean())
    idx.append(f"{no}\t{mid}\t{maps[mid]['act']}\t{w}\t{h}\t{s:.3f}\tmaker_play_20261101_{ts}.png\t{ew}x{eh}\t{box}\t{br:.1f}")
open(f"{OUT}/maps-index.tsv","w").write("\n".join(idx)+"\n")
BG,GOLD,TXT,DIM=(16,14,20),(230,200,138),(236,228,210),(150,142,132)
def scaled(mid,K): w,h=int(maps[mid]["w"]),int(maps[mid]["h"]); return crops[mid].resize((w*K,h*K),Image.LANCZOS)
nos={r[1]:r[0] for r in rows}
grows={l.split("\t")[1]:l.rstrip("\n").split("\t") for l in open(f"{G}/maps-index.tsv").readlines()[1:]}
def oldcrop(mid):
    r=grows[mid]; box=eval(r[10]); return Image.open(f"{G}/raw/{r[0]}-{mid}.png").convert("RGB").crop(box)
for act,title in ((2,"액트 2 · 모래 왕국"),(3,"액트 3 · 얕은 바다")):
    ids=[r[1] for r in rows if maps[r[1]]["act"]==str(act)]
    nv=sum(1 for m in ids if modes.get(m)=="v5"); nk=len(ids)-nv
    K,maxw,gap,lab,fs=11,1800,24,58,24
    items=[(m,scaled(m,K)) for m in ids]; rws,cur,cw=[],[],0
    for m,t in items:
        if cur and cw+gap+t.width>maxw-2*gap: rws.append(cur); cur,cw=[],0
        cur.append((m,t)); cw+=(gap if cw else 0)+t.width
    if cur: rws.append(cur)
    top=120; Ht=top+sum(max(t.height for _,t in r)+lab+gap for r in rws)+gap
    sh=Image.new("RGB",(maxw,Ht),BG); d=ImageDraw.Draw(sh)
    d.text((gap,22),f"{title} — 맵 v5 메이커 캡처 {len(ids)}장 (v5 {nv} + keep {nk})",fill=GOLD,font=font(44))
    d.text((gap,78),"메이커 클라이언트 11-01 04:41~04:46 · HEAD a7da39c1(코드·맵 = 176ededa) · 같은 축척 1칸 = 11px · 맵 그림만 줄여 찍음(몬스터·플레이어·UI·어둠 끔) · 번호 = maps.csv 순서",fill=DIM,font=font(20))
    y=top
    for r in rws:
        x=gap
        for m,t in r:
            rr=maps[m]; d.text((x,y),f"{nos[m]} {rr['name']}",fill=TXT,font=font(fs))
            d.text((x,y+fs+4),f"{m} · {rr['w']}×{rr['h']} · {modes.get(m,'')}",fill=DIM,font=font(19))
            sh.paste(t,(x,y+lab)); x+=t.width+gap
        y+=max(t.height for _,t in r)+lab+gap
    sh.save(f"{OUT}/sheets/sheet-act{act}-maker.png",optimize=True); print("sheet",act,sh.size)
    K=6; gap=20; lab=46; pairs=[]
    for m in ids:
        if m not in grows: print('no old',m); continue
        w,h=int(maps[m]["w"]),int(maps[m]["h"]); pairs.append((m,oldcrop(m).resize((w*K,h*K),Image.LANCZOS),scaled(m,K)))
    W=1800; colw=max(a.width*2+12 for _,a,_ in pairs)+gap; cols=max(1,(W-gap)//colw)
    rowsl=[pairs[i:i+cols] for i in range(0,len(pairs),cols)]
    Ht=130+sum(max(p[1].height for p in r)+lab+26+gap for r in rowsl)
    sh=Image.new("RGB",(max(W,cols*colw+gap),Ht),BG); d=ImageDraw.Draw(sh)
    d.text((gap,22),f"{title} — 원래(길 안내판) ↔ 최종(맵 v5) 비교 ({len(pairs)}장)",fill=GOLD,font=font(40))
    d.text((gap,76),"왼쪽 = 10-31 12:28 길 안내판 캡처(map-capture-guide raw) · 오른쪽 = 11-01 04:41~04:46 메이커 캡처(v5 반영) · 같은 축척 1칸 = 6px",fill=DIM,font=font(20))
    y=130
    for r in rowsl:
        x=gap
        for m,a,b in r:
            rr=maps[m]; d.text((x,y),f"{nos[m]} {rr['name']} · {m} · {modes.get(m,'')}",fill=TXT,font=font(20))
            d.text((x,y+24),"원래",fill=DIM,font=font(16)); d.text((x+a.width+12,y+24),"최종",fill=GOLD,font=font(16))
            sh.paste(a,(x,y+lab)); sh.paste(b,(x+a.width+12,y+lab)); x+=colw
        y+=max(p[1].height for p in r)+lab+26+gap
    sh.save(f"{OUT}/compare/compare-act{act}-guide-vs-v5.png",optimize=True); print("compare",act,sh.size)
