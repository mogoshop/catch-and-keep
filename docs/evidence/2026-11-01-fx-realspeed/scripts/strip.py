import sys, subprocess, numpy as np, json
from PIL import Image
# usage: strip.py video lanesjson f0 f1 step out.png [cell]
vid=sys.argv[1]; spec=json.loads(sys.argv[2]); f0,f1,st=int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5]); out=sys.argv[6]
cell=int(sys.argv[7]) if len(sys.argv)>7 else 90
W,H=960,540
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3)
k=W/1920.0; R=int(spec.get('r',150)*k)
idx=list(range(f0,min(f1,len(fr)-1)+1,st))
names=list(spec['lanes'].keys())
img=Image.new('RGB',(cell*len(idx)+4*len(idx),cell*len(names)+4*len(names)),(40,40,40))
for li,nm in enumerate(names):
    x,ysc=spec['lanes'][nm]; cx=int(x*k); cy=int((1080-ysc)*k)
    for ci,f in enumerate(idx):
        a=fr[f][max(0,cy-R):cy+R, max(0,cx-R):cx+R]
        im=Image.fromarray(np.ascontiguousarray(a)).resize((cell,cell))
        img.paste(im,(ci*(cell+4),li*(cell+4)))
img.save(out); print(out, img.size, 'frames', idx[0], '..', idx[-1])
