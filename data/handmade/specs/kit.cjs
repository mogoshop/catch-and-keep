// 장소 설계서 공용 도우미 (10-28 맵 66장 전면 개편). 설계서 act<N>.cjs가 쓴다.
//   E(구역, 이름, cx, cy, rx, ry, 옵션)  타원 장소         R(구역, 이름, x0, y0, x1, y1, 옵션)  사각 장소 (던전 방)
//   P(점들, 폭, 포장글자, 포장폭, 옵션)  길               L(a, b, 폭, "h"|"v")                 꺾인 통로 (가로 먼저 h · 세로 먼저 v)
"use strict";
const E = (z, name, cx, cy, rx, ry, o) => Object.assign({ z, name, e: [cx, cy, rx, ry] }, o || {});
const R = (z, name, x0, y0, x1, y1, o) => Object.assign({ z, name, r: [x0, y0, x1, y1], rough: 0.7 }, o || {});
const P = (pts, w, road, rw, o) => Object.assign({ pts, w: w || 3, road, rw }, o || {});
const L = (a, b, w, first, o) => P(first === "v" ? [a, [a[0], b[1]], b] : [a, [b[0], a[1]], b], w || 3, undefined, undefined, Object.assign({ wobble: 0.3 }, o || {}));
// 바위 덩어리 · 담 줄
const rock = (cx, cy, rx, ry, ch) => ({ e: [cx, cy, rx, ry], ch });
const wall = (pts, ch, gaps, w) => ({ line: pts, ch, gaps: gaps || [], w: w || 1 });
module.exports = { E, R, P, L, rock, wall };

// 짝 맵 재사용 (부록 C B안): 다른 맵 설계서의 자리(장소·길·바위·기능 자리)를 좌우(fx)·상하(fy)로 뒤집어 가져오고, 바닥·벽·꾸밈은 새로 준다.
//   연속 좌표(타원 가운데·길 점·장식 자리)는 x → -x · y → 2 - y, 칸 좌표(사각 장소·포털·입구·기능 자리)는 x → -1 - x · y → 1 - y
function remix(base, o, opt) {
  const fx = !!(opt && opt.fx), fy = !!(opt && opt.fy);
  const cx = (x) => (fx ? -x : x), cy = (y) => (fy ? 2 - y : y);
  const kx = (x) => (fx ? -1 - x : x), ky = (y) => (fy ? 1 - y : y);
  const cell = (p) => [kx(p[0]), ky(p[1])];
  const rect = (r) => [Math.min(kx(r[0]), kx(r[2])), Math.min(ky(r[1]), ky(r[3])), Math.max(kx(r[0]), kx(r[2])), Math.max(ky(r[1]), ky(r[3]))];
  const shape = (s) => {
    const out = Object.assign({}, s);
    if (s.e) out.e = [cx(s.e[0]), cy(s.e[1]), s.e[2], s.e[3]];
    if (s.r) out.r = rect(s.r);
    if (s.line) out.line = s.line.map((p) => [cx(p[0]), cy(p[1])]);
    if (s.gaps) out.gaps = s.gaps.map((g) => [cx(g[0]), cy(g[1]), g[2]]);
    if (s.pts) out.pts = s.pts.map((p) => [cx(p[0]), cy(p[1])]);
    if (s.torchAt) out.torchAt = [fx ? -s.torchAt[0] : s.torchAt[0], fy ? -s.torchAt[1] : s.torchAt[1]];
    return out;
  };
  const mapObj = (m) => Object.fromEntries(Object.entries(m || {}).map(([k, p]) => [k, cell(p)]));
  const geo = {
    size: base.size,
    places: (base.places || []).map(shape),
    paths: (base.paths || []).map(shape),
    rocks: (base.rocks || []).map(shape),
    gates: mapObj(base.gates),
  };
  if (base.waypoint) geo.waypoint = cell(base.waypoint);
  if (base.extra) geo.extra = mapObj(base.extra);
  if (base.area) geo.area = rect(base.area);
  if (Array.isArray(base.torches)) geo.torches = base.torches.map(cell);
  return Object.assign(geo, o || {});
}
module.exports.remix = remix;
