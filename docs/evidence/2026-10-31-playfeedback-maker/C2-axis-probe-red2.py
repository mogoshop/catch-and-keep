import sys,math
from PIL import Image, ImageDraw
import numpy as np
im=Image.open(sys.argv[1]).convert('RGB').resize((1920,1080))
a=np.asarray(im).astype(int)
m=(a[...,0]>80)&(a[...,0]>2.2*np.maximum(a[...,1],a[...,2]))
A=[(670,1106),(1491,352),(1633,507),(812,1261)]
B=[(324,1411),(1145,657),(1287,812),(466,1566)]
def poly(P):
    mk=Image.new('L',(1920,1080),0); d=ImageDraw.Draw(mk); d.polygon([(x,1080-y) for x,y in P],fill=1); return np.asarray(mk).astype(bool)
pa,pb=poly(A),poly(B)
# exclude HUD: right panel x>1480 & y_top<820? keep simple: ignore bottom 150px and left 150px
valid=np.ones_like(m); valid[930:,:]=False; valid[:, :120]=False
mm=m&valid
for name,p in (('A first-tile pivot',pa),('B center pivot',pb)):
    pv=p&valid
    inter=(mm&pv).sum(); uni=(mm|pv).sum()
    print(name,'poly px',pv.sum(),'red in poly',inter,'IoU %.3f'%(inter/uni), 'red outside poly', (mm&~pv).sum())
ys,xs=np.nonzero(mm&pa)
X=xs; Y=1080-ys
cx,cy=X.mean(),Y.mean(); C=np.cov(np.vstack([X-cx,Y-cy])); w,v=np.linalg.eigh(C); vm=v[:,np.argmax(w)]
ang=math.degrees(math.atan2(vm[1],vm[0])); ang = ang-180 if ang>90 else ang+180 if ang<-90 else ang
print('red inside A: centroid (%.0f,%.0f) principal angle %.2f deg (screen y-up)'%(cx,cy,ang))
# farthest red pixel along band direction (lower-right end)
u=np.array([math.cos(math.radians(-42.55)),math.sin(math.radians(-42.55))])
pu=X*u[0]+Y*u[1]; i=np.argmax(pu); print('lower-right red end px (%d,%d)'%(X[i],Y[i]))
# edges: perpendicular offset distribution
n=np.array([-u[1],u[0]]); pn=X*n[0]+Y*n[1]
print('across-band red extent px %.0f (expect W 1.40 cells x 150 = 210)'%(np.percentile(pn,99)-np.percentile(pn,1)))
