#!/usr/bin/env python3
"""4차 엔드카드 로고 — 월드 썸네일(1-thumbnail.jpg, 양피지 위 먹 붓글씨 「메이플 리저렉션 / 네크로맨서 편」)에서
로고 부분만 잘라 먹 → 밝은 색, 보라(단풍잎·부제) → 밝힌 보라로 바꾸고 바탕 양피지는 투명하게(배경 대비 밝기 차 = 알파).
네 귀퉁이 얼룩은 둥근 사각 마스크로 지움. 정식 로고 레이어는 코덱스 요청서(codex-promo-shorts-layers-20261107) ①로 교체 예정.
python3 tools/promo/cuts/v4/logo_ink.py assets/maple_maketing_video/out/work/v4-logo-ink.png
"""
import numpy as np, sys
from PIL import Image, ImageFilter
im=Image.open('assets/world-images-upload-20261023/1-thumbnail.jpg').convert('RGB')
box=(70,85,668,565)
c=im.crop(box)
bg=c.filter(ImageFilter.MedianFilter(31)).filter(ImageFilter.GaussianBlur(20))
a=np.asarray(c).astype(float); b=np.asarray(bg).astype(float)
lum=a.mean(2); bl=b.mean(2)
alpha=np.clip((bl-lum-18)/70,0,1)
mx=a.max(2); mn=a.min(2); sat=(mx-mn)/(mx+1)
purple=(a[...,2]>a[...,1]+12)&(sat>0.18)
out=np.zeros(a.shape[:2]+(4,))
ink=np.array([238,230,242.])
pc=np.clip(a*1.9+20,0,255)
pc=np.stack([np.clip(pc[...,0]*1.15,0,255),pc[...,1],np.clip(pc[...,2]*1.1,0,255)],-1)
out[...,:3]=np.where(purple[...,None],pc,ink)
h,w=alpha.shape
yy,xx=np.mgrid[0:h,0:w]
r=(np.abs((xx-w/2)/(w*0.5))**3+np.abs((yy-h*0.5)/(h*0.5))**3)**(1/3)
m=np.clip((1.0-r)/0.08,0,1)
out[...,3]=alpha*m*255
Image.fromarray(out.astype(np.uint8)).resize((int(598*1.5),int(480*1.5)),Image.LANCZOS).save(sys.argv[1])
