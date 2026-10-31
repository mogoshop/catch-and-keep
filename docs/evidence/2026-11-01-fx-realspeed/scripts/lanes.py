import sys, subprocess, numpy as np, json, os
# usage: lanes.py video.mp4 lanesjson out_prefix
vid=sys.argv[1]; spec=json.loads(sys.argv[2]); out=sys.argv[3]
W,H=480,270
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16)
n=len(fr); fps=30.0
k=W/1920.0
# marker: bottom-right HUD orb
mx=fr[:,int(900*k):,int(1700*k):].mean(axis=(1,2,3))
d=np.abs(mx-mx[0])
mk=int(np.argmax(d>8)) if (d>8).any() else -1
print('frames',n,'marker frame',mk,'t=%.3f'%(mk/fps))
b0,b1=spec.get('base',[mk-10,mk-1])
base=fr[max(0,b0):max(1,b1)].mean(axis=0)
if 'marker' in spec: mk=spec['marker']
R=int(spec.get('r',130)*k)
res={}
for name,(x,ysc) in spec['lanes'].items():
    cx=int(x*k); cy=int((1080-ysc)*k)
    roi=lambda a: a[max(0,cy-R):cy+R, max(0,cx-R):cx+R]
    b=roi(base)
    vals=[]
    for i in range(n):
        diff=np.abs(roi(fr[i])-b).sum(axis=2)
        vals.append(float((diff>40).mean()))
    res[name]=vals
tl={'marker':mk,'fps':fps,'lanes':res}
json.dump(tl,open(out+'.json','w'))
# print compact timeline from marker-3 to marker+75
for name,v in res.items():
    s=''.join('#' if x>0.06 else ('+' if x>0.02 else '.') for x in v[max(0,mk-3):mk+75])
    print(f'{name:10s} {s}')
