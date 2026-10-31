import sys, subprocess, numpy as np, json
# usage: lanes2.py video.mp4 spec.json out_prefix
# spec: {"lanes":{name:[x,yFromBottom,R,dy]}, "win":frames, "thr":0.03}
vid=sys.argv[1]; spec=json.load(open(sys.argv[2])); out=sys.argv[3]
W,H=480,270
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16)
n=len(fr); k=W/1920.0
# 표식 = 오른쪽 아래 마나 구슬(GameHUD 켜짐) — 켜짐/꺼짐 경계
mx=fr[:,int(900*k):,int(1700*k):].mean(axis=(1,2,3))
base_m=np.median(mx)
on=np.abs(mx-np.percentile(mx,5))>8
marks=[i for i in range(1,n) if on[i] and not on[i-1]]
print('frames',n,'marks',marks)
win=spec.get('win',60); thr=spec.get('thr',0.03)
res={'marks':marks,'fires':[]}
for mk in marks:
    b0=max(0,mk-8); base=fr[b0:mk-1].mean(axis=0)
    fire={'mark':mk,'lanes':{}}
    for name,(x,ysc,R,dy) in spec['lanes'].items():
        cx=int(x*k); cy=int((1080-ysc-dy)*k); r=int(R*k)
        sl=(slice(max(0,cy-r),cy+r),slice(max(0,cx-r),cx+r))
        b=base[sl]
        vals=[float((np.abs(fr[i][sl]-b).sum(axis=2)>40).mean()) for i in range(mk-3,min(n,mk+win))]
        fire['lanes'][name]=vals
    res['fires'].append(fire)
    print('--- mark',mk,'t=%.2f'%(mk/30))
    for name,v in fire['lanes'].items():
        s=''.join('#' if x>0.08 else ('+' if x>thr else '.') for x in v)
        vis=[i-3 for i,x in enumerate(v) if x>thr and i>=3]
        first=vis[0] if vis else None; last=vis[-1] if vis else None
        gaps=0; run=0; mg=0
        if vis:
            for i in range(first+3,last+4):
                if v[i]<=thr: run+=1; mg=max(mg,run)
                else: run=0
        print(f'{name:12s} {s}  first={first} last={last} visN={len(vis)} maxGap={mg}')
json.dump(res,open(out+'.json','w'))
