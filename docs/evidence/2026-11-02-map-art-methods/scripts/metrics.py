import sys, json, numpy as np
from PIL import Image

class nd:
    @staticmethod
    def binary_erosion(m, iterations=1):
        r=m.copy()
        for _ in range(iterations):
            p=np.pad(r,1,constant_values=False)
            r=p[1:-1,1:-1]&p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:]
        return r
    @staticmethod
    def laplace(L):
        p=np.pad(L,1,mode='edge'); return p[:-2,1:-1]+p[2:,1:-1]+p[1:-1,:-2]+p[1:-1,2:]-4*L
    @staticmethod
    def uniform_filter(L,k):
        p=np.pad(L,((0,k-1),(0,k-1)),mode='edge'); o=np.zeros_like(L)
        for dy in range(k):
            for dx in range(k): o+=p[dy:dy+L.shape[0],dx:dx+L.shape[1]]
        return o/(k*k)
    @staticmethod
    def zoom(a,f,order=1):
        return np.repeat(np.repeat(a,f,0),f,1)
    @staticmethod
    def median_filter(L,k):
        p=np.pad(L,k//2,mode='edge'); o=np.zeros_like(L)
        for dy in range(k):
            for dx in range(k): o+=p[dy:dy+L.shape[0],dx:dx+L.shape[1]]
        return o/(k*k)
def load(p, crop=None, scale=1.0):
    im = Image.open(p).convert('RGBA')
    if crop: im = im.crop(crop)
    if scale != 1.0: im = im.resize((round(im.width*scale), round(im.height*scale)), Image.LANCZOS)
    return np.asarray(im).astype(np.float64)
def metrics(a):
    rgb = a[..., :3]; m = a[..., 3] > 127
    L = 0.299*rgb[...,0]+0.587*rgb[...,1]+0.114*rgb[...,2]
    mx = rgb.max(-1); mn = rgb.min(-1); S = np.where(mx > 0, (mx-mn)/np.maximum(mx,1), 0); V = mx/255
    inner = nd.binary_erosion(m, iterations=2)
    # colours
    q = rgb.astype(np.int64); code = (q[...,0]<<16)|(q[...,1]<<8)|q[...,2]
    ncol = len(np.unique(code[m]))
    # colours per 8x8 block (fully opaque blocks)
    h, w = m.shape; cpb = []
    for y in range(0, h-7, 8):
        for x in range(0, w-7, 8):
            if m[y:y+8, x:x+8].all(): cpb.append(len(np.unique(code[y:y+8, x:x+8])))
    # laplacian variance on interior
    lap = nd.laplace(L)
    lapv = float(lap[inner].var()) if inner.any() else float('nan')
    # high-frequency share: energy removed by 2x down/up
    Ld = nd.zoom(nd.uniform_filter(L, 2)[::2, ::2], 2, order=1)[:h, :w]
    hf = L[:Ld.shape[0], :Ld.shape[1]] - Ld
    mm = inner[:Ld.shape[0], :Ld.shape[1]]
    hfs = float(hf[mm].var() / max(L[inner].var(), 1e-9)) if mm.any() else float('nan')
    # edge crispness: d1/d2 on strongest 10% d2 (horizontal+vertical)
    r = []
    for ax in (0, 1):
        d1 = np.abs(np.diff(L, axis=ax)); d2 = np.abs(L.take(range(2, L.shape[ax]), axis=ax) - L.take(range(0, L.shape[ax]-2), axis=ax))
        d1a = np.maximum(d1.take(range(0, d2.shape[ax]), axis=ax), d1.take(range(1, d2.shape[ax]+1), axis=ax))
        mk = inner.take(range(1, L.shape[ax]-1), axis=ax)
        if mk.sum() < 50: continue
        t = np.percentile(d2[mk], 90)
        sel = mk & (d2 >= t) & (d2 > 8)
        if sel.any(): r.append(np.median(d1a[sel]/d2[sel]))
    crisp = float(np.mean(r)) if r else float('nan')
    # outline: silhouette boundary darkness (sprites only)
    edge = m & ~nd.binary_erosion(m)
    has_alpha = (~m).any()
    if has_alpha and inner.any():
        ol_ratio = float(L[edge].mean() / max(L[inner].mean(), 1e-9))
        ol_dark = float((L[edge] < 60).mean())
    else:
        ol_ratio = ol_dark = float('nan')
    # internal dark-line density: pixel much darker than 5x5 median
    med = nd.median_filter(L, 5)
    dl = float(((med - L) > 35)[inner].mean()) if inner.any() else float('nan')
    # 32x16-style luminance std (floor flatness) on 0..1
    return dict(px=int(m.sum()), colors=ncol, cpb8=float(np.mean(cpb)) if cpb else float('nan'),
        sat=float(S[m].mean()), sat_p90=float(np.percentile(S[m], 90)), lum=float(V[m].mean()), lum_std=float(V[m].std()),
        lapvar=lapv, hf_share=hfs, crisp=crisp, outline_ratio=ol_ratio, outline_dark=ol_dark, darkline=dl)
if __name__ == '__main__':
    spec = json.load(open(sys.argv[1])); out = {}
    for name, d in spec.items():
        a = load(d['path'], tuple(d['crop']) if d.get('crop') else None, d.get('scale', 1.0))
        out[name] = metrics(a); out[name]['group'] = d.get('group', '')
        print(name, {k: (round(v, 3) if isinstance(v, float) else v) for k, v in out[name].items()}, flush=True)
    json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
