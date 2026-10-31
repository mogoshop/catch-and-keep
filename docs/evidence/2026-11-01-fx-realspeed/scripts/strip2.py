import sys, subprocess, numpy as np, json
from PIL import Image
# usage: strip2.py video spec.json marks(comma) pre post step out.png cell
vid=sys.argv[1]; spec=json.load(open(sys.argv[2])); marks=[int(x) for x in sys.argv[3].split(',')]
pre,post,st=int(sys.argv[4]),int(sys.argv[5]),int(sys.argv[6]); out=sys.argv[7]; cell=int(sys.argv[8])
W,H=960,540
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3)
k=W/1920.0
names=list(spec['lanes'].keys())
cols=list(range(-pre,post+1,st))
rows=[(mk,nm) for nm in names for mk in marks]
img=Image.new('RGB',(len(cols)*(cell+3),len(rows)*(cell+3)),(30,30,60))
for ri,(mk,nm) in enumerate(rows):
    x,ysc,R,dy=spec['lanes'][nm]; cx=int(x*k); cy=int((1080-ysc-dy)*k); r=int(R*k)
    for ci,o in enumerate(cols):
        f=mk+o
        if f<0 or f>=len(fr): continue
        a=fr[f][max(0,cy-r):cy+r, max(0,cx-r):cx+r]
        img.paste(Image.fromarray(np.ascontiguousarray(a)).resize((cell,cell)),(ci*(cell+3),ri*(cell+3)))
img.save(out); print(out,img.size,'rows',[f'{nm}@{mk}' for mk,nm in rows])
