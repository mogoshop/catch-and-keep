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
