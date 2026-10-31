import sys, subprocess, numpy as np, json
# 표식 없는 녹화: 픽셀 중앙값을 바탕으로 칸별 덮임 비율 → 켜짐 구간(onset) 찾기
vid=sys.argv[1]; spec=json.load(open(sys.argv[2])); out=sys.argv[3]
W,H=480,270
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16)
n=len(fr); k=W/1920.0; thr=spec.get('thr',0.03)
base=np.median(fr,axis=0)
res={}
for name,(x,ysc,R,dy) in spec['lanes'].items():
    cx=int(x*k); cy=int((1080-ysc-dy)*k); r=int(R*k)
    sl=(slice(max(0,cy-r),cy+r),slice(max(0,cx-r),cx+r))
    v=np.array([(np.abs(fr[i][sl]-base[sl]).sum(axis=2)>40).mean() for i in range(n)])
    res[name]=v.tolist()
    on=v>thr
    segs=[]; i=0
    while i<n:
        if on[i]:
            j=i
            while j+1<n and (on[j+1] or (j+2<n and on[j+2]) or (j+3<n and on[j+3])): j+=1
            segs.append((i,j)); i=j+1
        else: i+=1
    print(f'{name:10s}', ' '.join(f'[{a}-{b} {((b-a+1)/30):.2f}s]' for a,b in segs))
    print('           ', ''.join('#' if x>0.08 else ('+' if x>thr else '.') for x in v))
json.dump({'n':n,'lanes':res},open(out+'.json','w'))
