import sys
from PIL import Image, ImageDraw, ImageFilter
S=sys.argv[1]
N=384
def figure(img, cx, top, scale, cloak, rim, eye):
    d=ImageDraw.Draw(img)
    s=scale
    # 망토 (어깨→아래 넓게)
    body=[(cx-70*s,top+300*s),(cx-58*s,top+170*s),(cx-36*s,top+120*s),(cx+36*s,top+120*s),(cx+58*s,top+170*s),(cx+70*s,top+300*s)]
    d.polygon(body,fill=cloak)
    # 두건
    d.ellipse([cx-50*s,top+20*s,cx+50*s,top+150*s],fill=cloak)
    d.polygon([(cx-50*s,top+90*s),(cx,top-6*s),(cx+50*s,top+90*s)],fill=cloak)
    # 얼굴 그늘
    d.ellipse([cx-30*s,top+62*s,cx+30*s,top+138*s],fill=(14,10,16,255))
    # 눈
    for ex in (-13,13):
        d.ellipse([cx+(ex-6)*s,top+92*s,cx+(ex+6)*s,top+104*s],fill=eye)
    # 망토 가운데 여밈선·테두리 빛
    d.line([(cx,top+150*s),(cx,top+300*s)],fill=rim,width=int(5*s))
    d.line([(cx-58*s,top+170*s),(cx-70*s,top+300*s)],fill=rim,width=int(4*s))
img=Image.new('RGBA',(N,N),(0,0,0,0))
# 뒤 동료 (보라 그림자)
back=Image.new('RGBA',(N,N),(0,0,0,0))
figure(back,238,40,0.92,(58,46,74,255),(110,86,140,255),(170,120,255,255))
# 앞 나 (갈색 망토 + 뼈빛 테두리)
front=Image.new('RGBA',(N,N),(0,0,0,0))
figure(front,150,66,1.0,(74,52,40,255),(196,170,128,255),(200,150,255,255))
def shade(layer, cx):
    # 왼쪽 위에서 비치는 빛: 왼쪽은 밝게, 오른쪽·아래는 어둡게, 망토 주름 두 줄
    px=layer.load()
    for y in range(N):
        for x in range(N):
            r,g,b,a=px[x,y]
            if a==0 or (r<30 and g<30): continue
            k=1.25-0.0028*(x-cx+60)-0.0011*y
            k=max(0.55,min(1.3,k))
            px[x,y]=(min(255,int(r*k)),min(255,int(g*k)),min(255,int(b*k)),a)
    fold=Image.new('RGBA',(N,N),(0,0,0,0));d=ImageDraw.Draw(fold)
    for off in (-34,30):
        d.line([(cx+off*0.6,250),(cx+off,372)],fill=(0,0,0,80),width=6)
    fa=fold.split()[3]
    from PIL import ImageChops
    fold.putalpha(ImageChops.multiply(fa,layer.split()[3]))
    layer.alpha_composite(fold)
shade(back,238); shade(front,150)
for layer in (back,front):
    a=layer.split()[3]
    outline=a.filter(ImageFilter.MaxFilter(13))
    o=Image.new('RGBA',(N,N),(10,8,10,255));o.putalpha(outline)
    img=Image.alpha_composite(img,o)
    img=Image.alpha_composite(img,layer)
# 눈 빛 번짐
glow=Image.new('RGBA',(N,N),(0,0,0,0));gd=ImageDraw.Draw(glow)
for cx,top,s in ((238,40,0.92),(150,66,1.0)):
    for ex in (-13,13): gd.ellipse([cx+(ex-14)*s,top+84*s,cx+(ex+14)*s,top+112*s],fill=(160,90,255,110))
glow=glow.filter(ImageFilter.GaussianBlur(8))
img=Image.alpha_composite(img,glow)
# 상단 빛 (위에서 비치는 하이라이트)
small=img.resize((96,96),Image.LANCZOS)
small.save(S+'/menu-party.png')
chk=Image.new('RGBA',(384,384),(40,34,30,255));chk.alpha_composite(small.resize((384,384),Image.NEAREST));chk.save(S+'/p_check.png')
