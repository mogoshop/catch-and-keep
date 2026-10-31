import sys, subprocess, numpy as np
vid=sys.argv[1]
W,H=480,270
raw=subprocess.run(['ffmpeg','-v','error','-i',vid,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
fr=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16)
n=len(fr)
d=np.array([0]+[np.abs(fr[i]-fr[i-1]).mean() for i in range(1,n)])
still=d<0.05
runs=[];i=0
while i<n:
    if still[i]:
        j=i
        while j+1<n and still[j+1]: j+=1
        if j-i+1>=3: runs.append((i,j))
        i=j+1
    else: i+=1
print('frames',n,'median diff %.3f'%np.median(d))
print('static runs (>=3 frames):',[(a,b,round((b-a+1)/30,2)) for a,b in runs])
print(''.join('_' if x<0.05 else ('.' if x<0.3 else '|') for x in d))
