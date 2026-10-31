// 액트 2 「모래에 묻힌 왕국」 장소 설계서 (10-28 맵 66장 전면 개편 · 기획서 38 F7). tools/build/handmade/compose.cjs가 설계도·배치표로 옮긴다.
// 마을·사냥터 4장은 새로 설계, 사원 3층·성소·곁가지는 액트 1 던전의 자리를 뒤집어 다시 쓴다 (부록 C B안 「짝 맵 재사용」 — remix) — 바닥·벽·꾸밈은 사막 것으로.
"use strict";
const { E, R, P, rock, wall, remix } = require("./kit.cjs");
const A1 = require("./act1.cjs");

const TEMPLE = {
  base: "temple-floor 0.9/0.84/0.74",
  walls: { "#": "a2-temple-pillar-wall 1/1/1 무너진 사원 기둥벽" },
  zones: {
    a: "temple-floor 0.76/0.7/0.62 계단참",
    b: "a2-sun-tile-floor 0.7/0.78/1 기둥 회랑",   // 10-28 코덱스 후속 바닥: 태양 문양 타일(채도 0.80 → 빨강 낮추고 파랑 살려 사암 포장 0.67 쪽으로) · 모래 물결 · 젖은 오아시스 흙
    c: "temple-floor 0.82/0.74/0.62 제물 방",
    d: "temple-floor 1/0.94/0.82 태양 제단실",
    e: "tomb-floor 0.8/0.72/0.62 무너진 방",
    f: "archive-floor 0.82/0.76/0.66 필사실",
    g: "temple-floor 0.86/0.8/0.7 아래 계단",
  },
};
const templeDress = {
  a: { props: ["temple-column", "a2-broken-urns"], n: 3 },
  b: { props: ["temple-column", "broken-column", "a2-broken-urns"], n: 7, decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles", "a2-decal-buried-road"], dn: 6 },
  c: { props: ["a2-broken-urns", "desert-bones", "a2-buried-statue-head"], n: 7, decals: ["a1-decal-blood-pool"], dn: 2 },
  d: { props: ["temple-column", "wind-stele", "a2-fallen-obelisk"], n: 7, decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles"], dn: 5 },
  e: { props: ["broken-column", "desert-bones", "a2-waving-skeleton"], n: 7, decals: ["a2-decal-broken-tile", "a2-decal-dry-crack"], dn: 4 },
  f: { props: ["bookshelf", "burnt-paper", "a2-broken-urns"], n: 7, decals: ["a2-decal-broken-tiles"], dn: 2 },
  g: { props: ["temple-column"], n: 2 },
};
const SANDCAVE = (floor, tint) => ({
  base: `${floor} ${tint}`,
  walls: { "#": "cave 0.96/0.88/0.76 모래 굴 벽" },
});

module.exports = {
  oasis: {
    size: [36, 24],
    title: "오아시스 시장",
    story: ["모래 언덕에 둘러싸인 오아시스 시장. 북쪽 물가에 야자수와 샘, 가운데 포장된 시장 광장을 천막 거리(서)·대장간 마당(동)이 둘러싼다.", "남문 길이 뜨거운 모래 언덕으로 나가는 문. 돌아오면 광장 남쪽 끝(도착 자리)에 선다."],
    base: "sand-floor 0.96/0.9/0.78",
    walls: { "#": "dune 1/1/1 모래 언덕" },
    zones: {
      a: "sandstone-road 0.92/0.86/0.74 시장 광장",
      b: "a2-oasis-mud-floor 1/1/1 오아시스 물가",
      c: "sand-floor 0.9/0.82/0.68 천막 거리",
      d: "dry-ground 0.86/0.76/0.62 대장간 마당",
      e: "sand-floor 0.94/0.88/0.74 남문 길",
    },
    roads: { "=": "a2-caravan-road 1/0.97/0.9 시장 큰길 (대상 수레 자국)" },
    places: [
      E("a", "시장 광장", 0, 0, 8, 4.5, { torch: false }),
      E("b", "오아시스 물가", 0, 8, 10, 3.6, { torch: false }),
      E("c", "천막 거리", -12, 1, 5, 5, { torch: false }),
      E("d", "대장간 마당", 11, 1, 5, 5, { torch: false }),
      R("e", "남문 길", -4, -10, 4, -5, { rough: 0.6, torch: false }),
    ],
    paths: [P([[0, -11], [0, -1]], 4, "=", 2), P([[-15, -1], [14, -1]], 3, "=", 1), P([[0, 3], [0, 6]], 3)],
    gates: { G: [0, -10] },
    waypoint: [-6, 2],
    torches: [[-4, 1], [3, 1], [-12, 4], [12, -4], [-2, -8], [1, -8], [-7, 7], [6, 7]],
    extra: {
      // townboard: 10-29 마을 게시판 자리(maps.csv extra townboard@-1.5/3.5) — compose가 지우지 않게 설계서에도
      depthgate: [5, 2], townboard: [-2, 3], "npc:Caravan": [-14, 0], "npc:ShopKeeper": [-4, 4], "npc:Apothecary": [3, 4], "npc:Smith": [10, 1],
      "npc:Scholar": [-9, 3], "npc:Stash": [2, -3], "npc:Elder": [-2, 7],
    },
    put: [
      ["prop", "a2-landmark-caravan-well", -4, 6.3],   // 10-28 마을 랜드마크 — 맵 위 끝(24칸)에 닿지 않게 그림 전체가 보이는 자리
      ["prop", "oasis-pool", 0.5, 9.4, 1.3], ["prop", "palm", -6.5, 9.8], ["prop", "palm", 7.5, 9.8, 1, 1],
      ["prop", "market-stall", -6.5, -2.8], ["prop", "market-stall", 6.5, -2.8, 1, 1], ["prop", "tent", -14, 4.8], ["prop", "well", 13.5, 4.4],
    ],
    dress: {
      a: { decals: ["a2-decal-broken-tiles"], dn: 2 },
      c: { props: ["a2-broken-urns", "a2-torn-awning", "camp-firewood"], n: 4, decals: ["a2-decal-sand-ripples"], dn: 1 },
      d: { props: ["camp-weapon-rack", "a2-broken-urns", "camp-firewood"], n: 3, decals: ["a1-decal-ash-campfire"], dn: 1 },
      e: { props: ["desert-rock", "a2-dead-cactus", "mp-signpost"], n: 4, decals: ["a2-decal-camel-tracks", "a2-decal-sand-ripples"], dn: 3 },
    },
  },

  dunes: {
    size: [64, 44],
    title: "뜨거운 모래 언덕",
    story: ["오아시스를 나서면 묻힌 옛길이 모래 언덕 사이로 굽이친다. 길 가운데 마른 오아시스 터(웨이포인트).", "북서쪽 짐승 무덤, 남서쪽 버려진 야영지, 북동쪽 전갈 굴 어귀, 남동쪽 모래 웅덩이. 동쪽 바람길이 협곡으로."],
    base: "a2-rippled-sand-floor 0.98/0.9/0.76",
    walls: { "#": "dune 1/1/1 모래 언덕", "%": "canyon 0.95/0.85/0.72 바위 능선" },
    zones: {
      a: "a2-rippled-sand-floor 0.94/0.86/0.7 언덕 어귀",
      b: "dry-ground 0.86/0.74/0.6 짐승 무덤",
      c: "a2-rippled-sand-floor 1/0.94/0.8 마른 오아시스 터",
      d: "dry-ground 0.9/0.78/0.62 버려진 야영지",
      e: "sand-cave-floor 0.84/0.76/0.64 전갈 굴 어귀",
      f: "a2-rippled-sand-floor 0.9/0.82/0.68 모래 웅덩이",
      g: "a2-rippled-sand-floor 0.96/0.9/0.76 동쪽 바람길",
    },
    roads: { "=": "a2-broken-sandstone-road 0.96/0.92/0.84 묻힌 옛길", "-": "a2-caravan-road 0.86/0.8/0.7 샛길" },
    places: [
      E("a", "언덕 어귀", -25, -1, 6, 5),
      E("b", "짐승 무덤", -12, 10, 9, 6),
      E("c", "마른 오아시스 터", 0, -2, 8, 6, { note: "웨이포인트" }),
      E("d", "버려진 야영지", -11, -13, 8, 5),
      E("e", "전갈 굴 어귀", 14, 11, 8, 6, { note: "전갈 굴 입구" }),
      E("f", "모래 웅덩이", 15, -11, 8, 6),
      E("g", "동쪽 바람길", 25, 1, 6, 5),
    ],
    paths: [
      P([[-32, -1], [-25, -1], [-16, 2], [-6, -1], [0, -2], [8, 1], [16, 0], [25, 1], [31, 1]], 4, "=", 2),
      P([[-22, 3], [-16, 8], [-12, 10]], 3, "-", 1), P([[-4, -6], [-8, -10], [-11, -12]], 3, "-", 1),
      P([[6, 3], [10, 8], [14, 10]], 3, "-", 1), P([[17, -2], [16, -8]], 3, "-", 1), P([[-3, -14], [7, -14], [12, -12]], 3),
    ],
    rocks: [rock(-26, 10, 3, 4), rock(-3, 8, 3, 2), rock(4, -10, 2.5, 2), rock(26, -10, 3, 3), rock(26, 12, 3, 3), rock(-24, -12, 3, 2.5), wall([[-6, 15], [2, 18]], "%", [], 2)],
    gates: { W: [-31, -1], E: [30, 1] },
    holes: { scorpnest1: [16, 12] },
    waypoint: [1, 1],
    // 전갈 굴 입구 그림은 compose가 구멍(holes) 자리에 놓는다 (10-28 코덱스 a2-entrance-scorpion-burrow — 옛 cave-entrance 대신)
    dress: {
      a: { props: ["desert-rock", "a2-dead-cactus", "desert-bones"], n: 6, decals: ["a2-decal-camel-tracks", "a2-decal-sand-ripples"], dn: 4 },
      b: { sets: ["a2_beast_grave"], props: ["desert-bones", "a2-dead-cactus", "mp-beast-skull"], n: 7, decals: ["a2-decal-bleached-bones", "a2-decal-sand-ripples"], dn: 4 },
      c: { sets: ["a2_oasis_ruin"], props: ["palm", "desert-rock", "a2-broken-urns"], n: 6, decals: ["a2-decal-dry-crack", "a2-decal-broken-tiles"], dn: 4 },
      d: { sets: ["a2_abandoned_camp"], props: ["a2-torn-awning", "a2-spear-skull-fence", "a2-broken-urns"], n: 6, decals: ["a2-decal-camel-tracks", "a2-decal-snake-trail"], dn: 4 },
      e: { props: ["desert-rock", "desert-bones", "a2-dead-cactus"], n: 6, decals: ["a2-decal-snake-trail"], dn: 3 },
      f: { sets: ["a2_lm_buried_caravan"], props: ["desert-bones", "a2-waving-skeleton", "desert-rock"], n: 6, decals: ["a2-decal-sand-drift", "a2-decal-bleached-bones"], dn: 4 },
      g: { props: ["desert-rock", "wind-stele"], n: 5, decals: ["a2-decal-sand-ripples"], dn: 2 },
    },
  },

  canyon: {
    size: [70, 50],
    title: "메마른 협곡",
    story: ["좁은 협곡 길이 갈비뼈 고개를 지나 거상의 머리가 굴러떨어진 분지(웨이포인트)로 열린다.", "북쪽 절벽 아래 야영지와 갈라진 바위턱, 남동쪽 마른 우물 터(버려진 우물 입구). 동쪽 협곡 출구가 바람 무덤 사막으로."],
    base: "dry-ground 0.88/0.76/0.62",
    walls: { "#": "canyon 1/1/1 협곡 절벽 top=a2-sandstone-rock-top:0.9/0.66/0.54" },   // 절벽 덩어리 속 = 코덱스 사암 바위 윗면, 협곡 붉은 절벽 색으로 (10-28)
    zones: {
      a: "dry-ground 0.8/0.7/0.58 협곡 입구",
      b: "sand-floor 0.9/0.8/0.66 갈비뼈 고개",
      c: "dry-ground 0.94/0.82/0.68 거상의 분지",
      d: "a2-oasis-mud-floor 0.9/0.86/0.8 마른 우물 터",
      e: "dry-ground 0.76/0.66/0.56 절벽 아래 야영지",
      f: "sand-floor 0.86/0.78/0.64 갈라진 바위턱",
      g: "dry-ground 0.84/0.74/0.6 동쪽 협곡 출구",
    },
    roads: { "=": "a2-caravan-road 0.94/0.86/0.74 협곡 길" },
    places: [
      E("a", "협곡 입구", -28, 3, 5, 5),
      E("b", "갈비뼈 고개", -16, -6, 7, 5),
      E("c", "거상의 분지", -2, 4, 9, 7, { note: "웨이포인트 · 거상의 머리" }),
      E("d", "마른 우물 터", 14, -13, 7, 5, { note: "버려진 우물 입구" }),
      E("e", "절벽 아래 야영지", -14, 14, 8, 5),
      E("f", "갈라진 바위턱", 14, 14, 8, 5),
      E("g", "동쪽 협곡 출구", 28, 0, 5, 5),
    ],
    paths: [
      P([[-35, 3], [-28, 3], [-22, -3], [-16, -6], [-9, -1], [-2, 4], [6, 1], [14, -3], [22, 0], [28, 0], [34, 0]], 3, "=", 1),
      P([[-20, 7], [-14, 13]], 3), P([[2, 10], [8, 14], [14, 14]], 3), P([[14, -3], [14, -9]], 3), P([[-6, 15], [6, 15]], 3), P([[-16, -10], [-4, -14], [8, -14]], 3),
    ],
    rocks: [rock(-8, -6, 2, 2), rock(4, -6, 2.5, 2), rock(22, 8, 3, 3), rock(-26, -10, 3, 4), rock(26, -12, 3, 3), rock(0, 19, 4, 2)],
    gates: { W: [-34, 3], E: [33, 0] },
    holes: { drywell: [15, -14] },
    waypoint: [-2, 1],
    put: [["prop", "well", 11.5, -11.6]],
    dress: {
      a: { props: ["desert-rock", "broken-column", "a2-dead-cactus"], n: 6, decals: ["a2-decal-sand-drift", "a2-decal-dry-crack"], dn: 3 },
      b: { sets: ["a2_rib_pass"], props: ["desert-rock", "desert-bones"], n: 6, decals: ["a2-decal-bleached-bones"], dn: 3 },
      c: { sets: ["a2_colossus"], props: ["broken-column", "desert-rock", "a2-broken-urns"], n: 8, decals: ["a2-decal-broken-sandstone", "a2-decal-buried-road", "a2-decal-broken-tiles"], dn: 6 },
      d: { props: ["a2-broken-urns", "desert-rock", "desert-bones"], n: 6, decals: ["a2-decal-dry-crack"], dn: 3 },
      e: { sets: ["a2_abandoned_camp"], props: ["a2-torn-awning", "camp-firewood", "a2-spear-skull-fence"], n: 6, decals: ["a1-decal-ash-campfire"], dn: 2 },
      f: { sets: ["a2_lm_dry_waterwheel"], props: ["desert-bones", "a2-waving-skeleton", "desert-rock"], n: 6, decals: ["a2-decal-dry-crack"], dn: 3 },
      g: { props: ["desert-rock", "wind-stele"], n: 5, decals: ["a2-decal-sand-ripples"], dn: 2 },
    },
  },

  // 10-29 「담 위」 2호 (사용자 「담 위를 어떤 맵에 더 넣을지」 → Fable 선정): 모래폭풍에 반쯤 드러난 옛 성벽 잔해.
  //   가라앉은 대로가 온전한 대로라면 여기는 끊기고 묻힌 성벽 — 서문 망루에서 긴 성벽(폭 3)이 동쪽으로 가다 두 번 끊기고(모래 바다),
  //   끊긴 자리마다 폭 2 성벽이 ㄷ자로 돌아간다. 걷는 칸 = 사암 담 윗면, '#' = 낮은 모래 바다(못 지나감), 보루 안은 구역 바닥(floor=zone)
  stormwaste: {
    size: [70, 50],
    title: "바람 무덤 사막",
    story: ["모래폭풍에 반쯤 드러난 옛 성벽 잔해. 서문 망루에서 긴 성벽을 따라 동쪽으로 — 성벽은 모래에 두 번 끊겨, 끊긴 자리마다 좁은 성벽으로 돌아가야 한다.", "북서쪽 둥근 보루에 왕들의 비석이 둘레로 섰고, 가운데 묻힌 오아시스(웨이포인트)는 안뜰이 모래에 꺼진 네모 성벽. 북쪽 막다른 망루에 짐승 무덤, 북동쪽 보루에 왕들의 묘실 문, 남동쪽 둥근 보루에 모래에 묻힌 마을. 끊긴 성벽 끝에서 동쪽 모래길이 가라앉은 대로로."],
    raised: "a2-sandstone-wall 0.96/0.93/0.88 담 윗면 floor=zone",
    base: "a2-sand-sea-floor 0.86/0.82/0.78",
    walls: { "#": "dune 0.92/0.88/0.8 낮은 모래 바다" },
    zones: {
      a: "a2-sandstone-paving-floor 0.9/0.86/0.78 서문 망루",
      b: "dry-ground 0.8/0.74/0.62 바람 비석 보루",
      c: "a2-rippled-sand-floor 0.94/0.88/0.74 묻힌 오아시스 성벽",
      d: "tomb-floor 0.8/0.72/0.6 묘실 문 앞 보루",
      e: "dry-ground 0.84/0.76/0.62 짐승 무덤 망루",
      f: "a2-rippled-sand-floor 0.88/0.84/0.74 모래에 묻힌 마을 보루",
      g: "a2-sandstone-paving-floor 0.86/0.82/0.74 동쪽 모래길",
    },
    roads: { "=": "a2-sandstone-paving-floor 0.94/0.9/0.82 긴 성벽 (담 위 포장)" },
    places: [
      R("a", "서문 망루", -34, -4, -31, 0, { rough: 0, note: "막다른 망루" }),
      E("b", "바람 비석 보루", -14, 13, 6, 6, { rough: 0, note: "둥근 보루 · 왕들의 비석이 둘레로" }),
      R("c", "묻힌 오아시스 성벽", -6, -2, 8, 10, { rough: 0, note: "웨이포인트 · 안뜰이 꺼진 네모 성벽" }),
      R("d", "묘실 문 앞 보루", 11, 11, 22, 17, { rough: 0, note: "왕들의 묘실 입구 · 문은 북쪽 담을 등진다" }),
      R("e", "짐승 무덤 망루", -4, 15, 6, 21, { rough: 0, note: "북쪽 막다른 망루" }),
      E("f", "모래에 묻힌 마을 보루", 15, -14, 6.5, 6, { rough: 0, note: "둥근 보루" }),
      R("g", "동쪽 모래길", 27, -3, 33, 2, { rough: 0, note: "끊긴 성벽 끝 → 동문" }),
    ],
    paths: [
      P([[-30.5, -0.5], [-24.5, -0.5]], 3, "=", 1, { wobble: 0 }),        // 긴 성벽 ① (동쪽 끝이 끊겼다)
      P([[-18.5, -0.5], [-7.5, -0.5]], 3, "=", 1, { wobble: 0 }),         // 긴 성벽 ② → 오아시스 성벽
      P([[9.5, -0.5], [11.5, -0.5]], 3, "=", 1, { wobble: 0 }),           // 긴 성벽 ③ (동쪽 끝이 끊겼다)
      P([[17.5, -0.5], [25.5, -0.5]], 3, "=", 1, { wobble: 0 }),          // 긴 성벽 ④ → 동쪽 모래길
      P([[-25, -1.5], [-25, -7], [-19, -7], [-19, -1.5]], 2, undefined, undefined, { wobble: 0 }),   // 끊긴 자리 ① 남쪽으로 ㄷ자
      P([[11, -1.5], [11, -6], [17, -6], [17, -1.5]], 2, undefined, undefined, { wobble: 0 }),   // 끊긴 자리 ② 남쪽으로 ㄷ자
      P([[-13.5, 0.5], [-13.5, 7.5]], 3, undefined, undefined, { wobble: 0 }),   // 비석 보루로 오르는 성벽
      P([[1, 10.5], [1, 15.5]], 2, undefined, undefined, { wobble: 0 }),         // 짐승 무덤 망루로
      P([[19.5, 0.5], [19.5, 10.5]], 3, undefined, undefined, { wobble: 0 }),    // 묘실 문 앞 보루로
      P([[14, -6.5], [14, -8.5]], 2, undefined, undefined, { wobble: 0 }),       // 묻힌 마을 보루로
    ],
    rocks: [
      { r: [-3, 1, 5, 7], ch: "#", rough: 0, force: true },        // 오아시스 안뜰은 모래에 꺼졌다
    ],
    gates: { W: [-34, -3], E: [33, 0] },
    holes: { kingtomb1: [14, 15] },
    waypoint: [1, -1],
    put: [
      ["prop", "tomb-door", 14.5, 17.8, 1],
      // 비석 줄: 둥근 보루 둘레 (가운데 (-12, 12) · 반지름 4.6)
      ["prop", "wind-stele", -18.4, 12.6], ["prop", "wind-stele", -17.2, 16.2, 1, 1], ["prop", "wind-stele", -14, 17.4], ["prop", "wind-stele", -10.8, 16.2],
      ["prop", "wind-stele", -9.6, 12.6, 1, 1], ["prop", "wind-stele", -10.8, 9.2], ["prop", "wind-stele", -17.2, 9.2, 1, 1],
      ["prop", "mp-house-ruin", 16, -11.4],
      // 오아시스 안뜰(낮은 모래)의 야자 세트 — 담 아래 장식
      ["set", "a2_oasis_ruin", 1.5, 3.6, 1, 0, "ok=cliff"],
      // 끊긴 담 끝 (코덱스 a2-sandstone-wall-broken-e/w) — 바닥 무늬로 덮어 길을 막지 않는다
      ["decal", "a2-sandstone-wall-broken-e", -23.5, -1.5, 0.977], ["decal", "a2-sandstone-wall-broken-e", -23.5, -0.5, 0.977], ["decal", "a2-sandstone-wall-broken-e", -23.5, 0.5, 0.977],
      ["decal", "a2-sandstone-wall-broken-w", -19.5, -0.5, 0.977], ["decal", "a2-sandstone-wall-broken-w", -19.5, 0.5, 0.977],
      ["decal", "a2-sandstone-wall-broken-e", 12.5, -1.5, 0.977], ["decal", "a2-sandstone-wall-broken-e", 12.5, -0.5, 0.977], ["decal", "a2-sandstone-wall-broken-e", 12.5, 0.5, 0.977],
      ["decal", "a2-sandstone-wall-broken-w", 16.5, -0.5, 0.977], ["decal", "a2-sandstone-wall-broken-w", 16.5, 0.5, 0.977],
      ["prop", "a2-buried-statue-head", -22.5, -5.2, 1.2, 0, "ok=cliff"],
      ["prop", "a2-fallen-obelisk", 14.5, -1.4, 1.0, 1, "ok=cliff"],          // 끊긴 자리 ②에 쓰러진 오벨리스크
      ["prop", "broken-column", -22, -1.2, 1.0, 0, "ok=cliff"],               // 끊긴 자리 ①의 무너진 기둥
      ["set", "a2_caravan_rest", -29.5, -6.2, 1, 0, "ok=cliff"],              // 서문 밖 모래에 묻힌 대상 쉼터
      // 모래 바다에 반쯤 묻힌 것들 (남서쪽 빈 모래)
      ["prop", "a2-buried-statue-head", -12, -13.5, 1.3, 1, "ok=cliff"], ["prop", "desert-bones", -26, -15, 1.1, 0, "ok=cliff"],
      ["prop", "a2-fallen-obelisk", 0, -12, 1.2, 0, "ok=cliff"], ["prop", "desert-rock", -4, -19, 1.1, 1, "ok=cliff"],
      ["prop", "desert-rock", -28, 8, 1.2, 0, "ok=cliff"],
      ["prop", "a2-fallen-obelisk", 26, 10, 1.1, 0, "ok=cliff"],
    ],
    dress: {
      a: { props: ["desert-rock", "desert-bones"], n: 2, decals: ["a2-decal-sand-ripples"], dn: 1 },
      b: { props: ["desert-bones", "desert-rock"], n: 3, decals: ["a2-decal-sand-drift", "a2-decal-bleached-bones"], dn: 4 },
      c: { props: ["palm", "desert-rock"], n: 4, decals: ["a2-decal-dry-crack", "a2-decal-sand-drift"], dn: 4 },
      d: { props: ["broken-column", "a2-broken-urns"], n: 5, decals: ["a2-decal-buried-road"], dn: 3 },
      e: { sets: ["a2_lm_wind_tomb", "a2_beast_grave"], props: ["desert-bones", "mp-beast-skull"], n: 3, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 3 },
      f: { props: ["a2-torn-awning", "a2-broken-urns", "mp-fence"], n: 6, decals: ["a2-decal-broken-tile", "a2-decal-broken-tiles"], dn: 3 },
      g: { props: ["desert-rock", "wind-stele"], n: 3, decals: ["a2-decal-sand-ripples"], dn: 2 },
    },
  },

  // 10-28 사용자 시안 요청: 「사암 담 덩어리 위에 올라가 있는 느낌 — 액트 2에선 평지를 못 지나가게 막고 담을 키워 여러 모양으로, 담 위에서 플레이하는 느낌」
  //   raised: 걷는 칸 전부가 사암 담 윗면(코덱스 a2-sandstone-wall 9조각), 첫 벽 글자 '#'는 그림 없는 낮은 모래 바다(못 지나감). 담은 사람이 쌓은 것이라 모서리를 곧게(rough 0 · wobble 0)
  sunkenroad: {
    size: [70, 50],
    title: "가라앉은 대로",
    story: ["모래 바다에 잠긴 옛 왕국. 성벽 윗면만 남아 길이 됐다 — 서문 망루에서 큰 성벽(대로)을 따라 거상 보루(웨이포인트)까지, 대로는 그 동쪽에서 무너져 끊겼다.", "북쪽 성벽 길은 북쪽 보루를 돌아 사원 문 앞 성벽으로, 남쪽은 모래에 잠긴 시장(안뜰이 꺼진 네모 성벽)을 돌아 동쪽 성벽으로 이어진다. 서쪽에 열주 회랑·서북 망루, 서남 보루에 독사의 둥지 입구."],
    raised: "a2-sandstone-wall 1/1/1 담 윗면",
    base: "a2-sand-sea-floor 0.92/0.9/0.86",
    walls: { "#": "canyon 0.92/0.84/0.74 낮은 모래 바다", "%": "ruin-wall 0.95/0.88/0.76 열주" },
    zones: {
      a: "sandstone-road 0.86/0.78/0.64 서문 망루와 대로",
      b: "temple-floor 0.86/0.8/0.7 열주 회랑",
      c: "sandstone-road 0.95/0.88/0.74 거상 보루",
      d: "viper-floor 0.8/0.84/0.66 서남 보루 (독사 둥지 어귀)",
      e: "sand-floor 0.86/0.8/0.68 모래에 잠긴 시장 성벽",
      f: "temple-floor 0.92/0.86/0.74 사원 문 앞 성벽",
      g: "sandstone-road 0.86/0.78/0.64 서북 망루",
      h: "sandstone-road 0.9/0.82/0.7 북쪽 보루",
    },
    roads: { "=": "a2-sandstone-paving-floor 1/0.97/0.9 대로 (담 위 포장)" },
    places: [
      R("a", "서문 망루", -35, -4, -28, 4, { rough: 0 }),
      R("b", "열주 회랑", -25, 8, -7, 14, { rough: 0, note: "기둥 셋" }),
      E("c", "거상 보루", 0, 0, 9, 7, { rough: 0, note: "웨이포인트" }),
      R("d", "서남 보루", -16, -19, -4, -11, { rough: 0, note: "독사의 둥지 입구" }),
      R("e", "모래에 잠긴 시장", 6, -21, 24, -8, { rough: 0, note: "안뜰이 꺼진 네모 성벽" }),
      R("f", "사원 문 앞 성벽", 18, 2, 34, 13, { rough: 0 }),
      R("g", "서북 망루", -34, 15, -28, 21, { rough: 0 }),
      R("h", "북쪽 보루", -3, 15, 4, 21, { rough: 0 }),
    ],
    paths: [
      P([[-28.5, 0.5], [-6.5, 0.5]], 7, "=", 3, { wobble: 0 }),        // 큰 성벽 = 대로
      P([[9.5, 0.5], [13.5, 0.5]], 7, "=", 3, { wobble: 0 }),          // 무너진 대로 끝 (동쪽 3칸이 끊겼다)
      P([[-14.5, 3.5], [-14.5, 8.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[-25.5, 11.5], [-30.5, 11.5], [-30.5, 15.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[-9.5, -3.5], [-9.5, -11.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[0.5, 6.5], [0.5, 15.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[4.5, 18.5], [22.5, 18.5], [22.5, 13.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[4.5, -6.5], [4.5, -8.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[22.5, -8.5], [22.5, 2.5]], 3, undefined, undefined, { wobble: 0 }),
    ],
    rocks: [
      { r: [10, -18, 20, -11], ch: "#", rough: 0, force: true },        // 시장 안뜰은 모래에 꺼졌다
    ],
    gates: { W: [-34, 0], E: [33, 6] },
    holes: { vipernest: [-9, -16] },
    waypoint: [3, -3],
    put: [
      // 열주: 담 위라 벽 칸(검은 속)이 아니라 기둥 장식으로 세운다 (발 자리는 장식이 막는다)
      ["prop", "temple-column", -21, 11, 1.1], ["prop", "temple-column", -16, 11, 1.1], ["prop", "temple-column", -11, 11, 1.1],
      ["prop", "broken-column", 14.6, 2.4, 1.1, 0, "ok=gate"],
      ["prop", "broken-column", 17.2, 3.4, 1, 1, "ok=cliff"],
      ["prop", "a2-buried-statue-head", 15.5, -6.5, 1.3, 0, "ok=cliff"],
      ["prop", "a2-fallen-obelisk", -22, -8, 1.2, 0, "ok=cliff"],
      ["prop", "a2-buried-statue-head", 15, -14.5, 1.2, 1, "ok=cliff"],
      ["prop", "desert-rock", -2, -16, 1.2, 0, "ok=cliff"],
      ["prop", "a2-fallen-obelisk", 10, 10, 1.1, 1, "ok=cliff"],
    ],
    dress: {
      a: { props: ["broken-column", "a2-broken-urns"], n: 5, decals: ["a2-decal-buried-road"], dn: 3 },
      b: { props: ["temple-column", "broken-column", "a2-broken-urns"], n: 5, decals: ["a2-decal-broken-tiles"], dn: 3 },
      c: { sets: ["a2_colossus"], props: ["broken-column", "a2-fallen-obelisk"], n: 5, decals: ["a2-decal-broken-tiles"], dn: 4 },
      d: { props: ["viper-nest", "desert-bones"], n: 4, decals: ["a2-decal-snake-trail"], dn: 3 },
      e: { props: ["market-stall", "a2-torn-awning", "a2-broken-urns"], n: 6, decals: ["a2-decal-sand-ripples"], dn: 3 },
      f: { sets: ["a2_lm_triumph_arch", "a2_temple_gate"], props: ["temple-column", "broken-column"], n: 4, decals: ["a2-decal-buried-road"], dn: 3 },
      g: { props: ["broken-column", "desert-bones"], n: 2 },
      h: { props: ["wind-stele", "a2-broken-urns"], n: 3, decals: ["a2-decal-broken-tiles"], dn: 2 },
    },
  },

  // 사원 3층 · 성소 — 액트 1 납골당·여왕의 무덤 자리를 위아래로 뒤집어 다시 쓴다
  temple1: remix(A1.crypt2, Object.assign({}, TEMPLE, {
    title: "잊힌 사원 1층",
    story: ["모래에 묻힌 사원의 첫 층. 기둥 열 개가 선 긴 회랑(웨이포인트) 남북으로 제물 방·제단실이 붙어 있다.", "남쪽 태양 제단실 바닥에 잊힌 서고로 내려가는 입구. (자리: 납골당 2층을 위아래로 뒤집음)"],
    waypoint: [-7, 1],
    holes: { archive: [1, -13] },
    dress: Object.assign({}, templeDress, { d: Object.assign({}, templeDress.d, { sets: ["a2_lm_stair_censer"] }) }),   // 10-28 랜드마크
  }), { fy: true }),
  temple2: remix(A1.crypt3, Object.assign({}, TEMPLE, {
    title: "잊힌 사원 2층",
    story: ["사원 2층. 두 굴을 지나 갈림 방에서 넓은 전당으로 — 쌍둥이 문지기 아슈와 나슈가 아래층 계단을 지킨다.", "(자리: 납골당 3층을 위아래로 뒤집음)"],
    zones: Object.assign({}, TEMPLE.zones, { e: "temple-floor 0.96/0.88/0.74 문지기의 전당" }),
    waypoint: undefined,   // 납골당 3층(crypt3)에 붙인 보스 앞 웨이포인트를 이어받지 않는다 — 여기는 보스 맵 (10-28)
    fixed: { gatebrother: [14, -2], gatebrother2: [14, 4] },
    put: [["set", "boss_gatebrothers", 16.5, 1.5], ["set", "a2_lm_lion_gate", 14.5, 9.3]],
    dress: Object.assign({}, templeDress, { e: { props: ["temple-column", "a2-broken-urns"], n: 4, decals: ["a2-decal-broken-tiles"], dn: 5 } }),
  }), { fy: true }),
  temple3: remix(A1.crypt1, Object.assign({}, TEMPLE, {
    title: "잊힌 사원 3층",
    waypoint: [-26, 3],   // 10-28 사용자: 성소 바로 앞 층 웨이포인트 (입구 쪽)
    story: ["사원 가장 깊은 층. 기둥 넷이 받친 태양 제단실을 지나 고리처럼 돌아야 성소 계단에 닿는다.", "(자리: 납골당 1층을 위아래로 뒤집음)"],
    dress: Object.assign({}, templeDress, { d: Object.assign({}, templeDress.d, { sets: ["a2_lm_singing_altar"] }) }),   // 10-28 랜드마크
  }), { fy: true }),
  sanctum: remix(A1.queentomb, {
    title: "대사제의 성소",
    story: ["성소 문을 지나 순례자의 방·시종의 방 중 하나를 지나야 봉인된 문간 — 그 너머 대사제 알하자르의 성소(아레나).", "(자리: 여왕의 무덤을 위아래로 뒤집음 · 호위는 회랑에만)"],
    base: "temple-floor 0.9/0.84/0.74",
    walls: { "#": "a2-temple-pillar-wall 0.96/0.92/0.86 성소 기둥벽" },
    zones: {
      a: "temple-floor 0.76/0.7/0.62 성소 문",
      b: "a2-sun-tile-floor 0.66/0.74/0.96 순례자의 방",
      c: "tomb-floor 0.78/0.7/0.6 시종의 방",
      d: "temple-floor 0.86/0.8/0.7 봉인된 문간",
      e: "temple-floor 1/0.92/0.78 대사제의 성소",
    },
    fixed: { highpriest: [17, 5] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    put: [["set", "boss_highpriest", 17.5, 5.5], ["set", "a2_lm_sun_disc", 17.5, 10.3]],
    dress: {
      a: { props: ["temple-column", "a2-broken-urns"], n: 3 },
      b: { props: ["a2-broken-urns", "wind-stele", "desert-bones"], n: 7, decals: ["a2-decal-broken-tiles"], dn: 3 },
      c: { props: ["a2-broken-urns", "burnt-paper", "a2-buried-statue-head"], n: 7, decals: ["a2-decal-dry-blood", "a1-decal-blood-pool"], dn: 4 },
      d: { props: ["temple-column"], n: 2 },
      e: { props: ["temple-column", "wind-stele"], n: 6, decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles", "a1-decal-blood-pool"], dn: 7 },
    },
  }, { fy: true }),

  // 곁가지 7장 — 액트 1 곁가지 자리를 뒤집어 다시 쓴다
  scorpnest1: remix(A1.pit1, Object.assign({}, SANDCAVE("sand-cave-floor", "0.92/0.84/0.7"), {
    title: "전갈 굴 1층",
    story: ["모래 언덕 아래 전갈 굴. 비탈을 내려가면 전갈 껍질이 쌓인 광장, 북쪽 매복 굴과 남쪽 고리길이 아래로 이어진다. (자리: 뼈 구덩이 1층을 위아래로 뒤집음)"],
    zones: { a: "sand-cave-floor 0.84/0.76/0.64 굴 어귀", b: "sand-floor 0.84/0.76/0.62 모래 비탈", c: "sand-cave-floor 0.96/0.86/0.7 껍질 광장", d: "sand-cave-floor 0.74/0.66/0.56 매복 굴", e: "sand-floor 0.78/0.7/0.58 남쪽 고리길", f: "sand-cave-floor 0.86/0.78/0.66 아래 계단" },
    dress: {
      a: { props: ["desert-rock"], n: 3 },
      b: { props: ["desert-rock", "desert-bones"], n: 6, decals: ["a2-decal-snake-trail"], dn: 2 },
      c: { sets: ["a2_rib_pass"], props: ["desert-bones", "a3-crab-shell-pile", "a2-dead-cactus"], n: 7, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 5 },
      d: { sets: ["a2_lm_venom_pool"], props: ["desert-rock", "desert-bones"], n: 5, decals: ["a2-decal-snake-trail"], dn: 2 },
      e: { props: ["desert-bones", "a2-waving-skeleton"], n: 5 },
      f: { props: ["desert-rock"], n: 2 },
    },
  }), { fy: true }),
  scorpnest2: remix(A1.pit2, Object.assign({}, SANDCAVE("sand-cave-floor", "0.9/0.82/0.68"), {
    title: "전갈 굴 2층",
    put: [["set", "a2_lm_egg_nest", -18.5, 5.3]],
    extra: { end: [-19, 2], return: [-24, -6] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["굴 가장 깊은 곳, 독침 여왕 세르카의 알자리. 여왕 굴 구석에 되돌아가는 문. (자리: 뼈 구덩이 2층을 좌우로 뒤집음 — 들어온 문이 동쪽)"],
    zones: { a: "sand-cave-floor 0.84/0.76/0.64 계단참", b: "sand-floor 0.82/0.74/0.6 껍질 무더기 길", c: "sand-cave-floor 0.74/0.66/0.56 북쪽 굴", d: "sand-cave-floor 0.98/0.88/0.7 독침 여왕의 알자리" },
    dress: {
      a: { props: ["desert-rock"], n: 2 },
      b: { props: ["desert-bones", "a3-crab-shell-pile", "desert-rock"], n: 8, decals: ["a2-decal-snake-trail"], dn: 3 },
      c: { props: ["desert-bones", "a2-waving-skeleton"], n: 6, decals: ["a2-decal-bleached-bones"], dn: 2 },
      d: { props: ["a3-crab-shell-pile", "desert-bones", "a2-spear-skull-fence"], n: 9, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones", "a2-decal-snake-trail"], dn: 6 },
    },
  }), { fx: true }),
  drywell: remix(A1.cave, Object.assign({}, SANDCAVE("well-floor", "0.86/0.8/0.68"), {
    title: "버려진 우물",
    story: ["마른 우물 바닥에서 이어진 굴. 두 갈래 굴이 만나는 가장 깊은 물웅덩이 터에 봉인 상자와 되돌아가는 문. (자리: 목매단 동굴을 위아래로 뒤집음)"],
    zones: { a: "well-floor 0.8/0.74/0.64 우물 바닥", b: "well-floor 0.72/0.7/0.62 이끼 낀 굴", c: "sand-cave-floor 0.8/0.72/0.6 무너진 돌계단", d: "well-floor 0.86/0.8/0.68 박쥐 굴", e: "well-floor 0.7/0.72/0.66 마른 물웅덩이 터" },
    dress: {
      a: { props: ["a2-broken-urns"], n: 3 },
      b: { props: ["desert-rock", "a2-broken-urns", "desert-bones"], n: 7, decals: ["a2-decal-dry-crack"], dn: 2 },
      c: { props: ["broken-column", "desert-rock"], n: 7, decals: ["a2-decal-broken-sandstone", "a2-decal-broken-tiles"], dn: 3 },
      d: { props: ["desert-bones", "a2-broken-urns"], n: 6 },
      e: { sets: ["a2_lm_well_pulley"], props: ["a2-broken-urns", "desert-bones", "a2-waving-skeleton"], n: 6, decals: ["a2-decal-mummy-bandage", "a2-decal-dry-crack"], dn: 4 },
    },
  }), { fy: true }),
  kingtomb1: remix(A1.cellar1, Object.assign({}, {
    title: "왕들의 묘실 1층",
    story: ["묘실 문 아래 첫 층. 부장품 방과 향료 방 사이 좁은 순장 통로가 매복 길목. 고리길로 돌면 왕의 석관 방, 그 너머 아래 계단. (자리: 지하실 1층을 위아래로 뒤집음)"],
    base: "tomb-floor 0.88/0.8/0.68",
    walls: { "#": "tomb 1/1/1 묘실 벽" },
    zones: { a: "tomb-floor 0.76/0.68/0.58 무너진 계단", b: "tomb-floor 0.84/0.76/0.62 부장품 방", c: "sandstone-road 0.8/0.72/0.6 향료 방", d: "tomb-floor 0.7/0.62/0.54 순장 통로", e: "tomb-floor 0.96/0.86/0.7 석관 방", f: "tomb-floor 0.8/0.72/0.6 아래 계단참" },
    put: [["prop", "a2-buried-statue-head", 16.5, -1.6, 1, 0]],
    dress: {
      a: { props: ["a2-broken-urns"], n: 2 },
      b: { sets: ["a2_lm_mask_wall"], props: ["a2-broken-urns", "broken-column", "desert-bones"], n: 10, decals: ["a2-decal-mummy-bandage", "a2-decal-broken-tiles"], dn: 4 },
      c: { props: ["a2-broken-urns", "wind-stele"], n: 8, decals: ["a2-decal-dry-crack"], dn: 2 },
      d: { decals: ["a2-decal-bleached-bones"], dn: 2 },
      e: { props: ["temple-column", "a2-broken-urns"], n: 4, decals: ["a2-decal-scattered-coins", "a2-decal-broken-tiles"], dn: 3 },
      f: { props: ["a2-broken-urns"], n: 2 },
    },
  }), { fy: true }),
  kingtomb2: remix(A1.cellar2, Object.assign({}, {
    title: "왕들의 묘실 2층",
    extra: { end: [16, 8], return: [24, 10] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["무너진 보물 방과 모래가 쏟아진 방을 지나면 묘실 수호왕 아메네트의 석관실. 석관실 구석에 되돌아가는 문. (자리: 지하실 2층을 위아래로 뒤집음)"],
    base: "tomb-floor 0.84/0.76/0.64",
    walls: { "#": "tomb 0.96/0.92/0.86 묘실 벽" },
    zones: { a: "tomb-floor 0.76/0.68/0.58 계단참", b: "tomb-floor 0.8/0.72/0.6 무너진 보물 방", c: "sand-floor 0.8/0.72/0.58 모래 쏟아진 방", d: "tomb-floor 0.84/0.76/0.62 갈림 방", e: "tomb-floor 1/0.9/0.72 수호왕의 석관실" },
    put: [["prop", "tomb-door", 23, -2.4, 1, 0], ["set", "a2_lm_king_sarcophagus", 16.5, 11.3]],
    dress: {
      a: { props: ["a2-broken-urns"], n: 2 },
      b: { props: ["a2-broken-urns", "broken-column"], n: 9, decals: ["a2-decal-scattered-coins", "a2-decal-broken-tiles"], dn: 3 },
      c: { props: ["desert-rock", "desert-bones", "a2-broken-urns"], n: 7, decals: ["a2-decal-sand-ripples"], dn: 3 },
      d: { props: ["temple-column"], n: 2 },
      e: { props: ["temple-column", "a2-broken-urns", "wind-stele"], n: 8, decals: ["a2-decal-mummy-bandage", "a2-decal-broken-tiles", "a2-decal-bleached-bones"], dn: 6 },
    },
  }), { fy: true }),
  archive: {
    size: [60, 40],
    title: "잊힌 서고",
    put: [["set", "a2_lm_burning_shelf", 20.5, 9.3]],
    story: ["사원 제단실 아래 숨은 서고. 서가 줄이 늘어선 열람실 셋이 필사실 복도로 이어진다.", "가장 안쪽 불탄 금서실에서 불꽃 사서 이드리스가 기다린다. 금서실 구석에 되돌아가는 문."],
    base: "archive-floor 0.86/0.8/0.7",
    walls: { "#": "tomb 0.9/0.84/0.76 서고 벽", "%": "ruin-wall 0.8/0.7/0.58 서가 줄" },
    zones: {
      a: "archive-floor 0.74/0.68/0.58 내려온 계단",
      b: "archive-floor 0.84/0.76/0.64 서쪽 열람실",
      c: "archive-floor 0.8/0.74/0.62 북쪽 열람실",
      d: "sandstone-road 0.82/0.74/0.6 필사실 복도",
      e: "archive-floor 0.78/0.7/0.6 남쪽 열람실",
      f: "archive-floor 0.92/0.72/0.56 불탄 금서실",
    },
    places: [
      R("a", "내려온 계단", -28, -3, -23, 3),
      R("b", "서쪽 열람실", -20, -6, -9, 6, { note: "서가 줄 둘" }),
      R("c", "북쪽 열람실", -6, 7, 8, 16, { note: "서가 줄 둘" }),
      R("d", "필사실 복도", -6, -2, 8, 2, { rough: 0.3 }),
      R("e", "남쪽 열람실", -6, -16, 8, -7, { note: "서가 줄 둘" }),
      R("f", "불탄 금서실", 12, -10, 27, 10, { rough: 0.5, note: "불꽃 사서 · 봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [P([[-30, 0], [12, 0]], 3), P([[1, 2], [1, 7]], 3), P([[1, -2], [1, -7]], 3), P([[8, 12], [18, 12], [18, 10]], 3), P([[8, -12], [18, -12], [18, -10]], 3)],
    rocks: [
      wall([[-17, 4], [-12, 4]], "%"), wall([[-17, -4], [-12, -4]], "%"),
      wall([[-3, 13], [5, 13]], "%", [[1, 13, 1.2]]), wall([[-3, 10], [5, 10]], "%", [[1, 10, 1.2]]),
      wall([[-3, -13], [5, -13]], "%", [[1, -13, 1.2]]), wall([[-3, -10], [5, -10]], "%", [[1, -10, 1.2]]),
      rock(16, 6, 1, 1), rock(16, -6, 1, 1), rock(24, 6, 1, 1), rock(24, -6, 1, 1),
    ],
    gates: { W: [-29, 0] },
    extra: { end: [20, 6], return: [25, -8] },   // 10-28 랜드마크(코덱스 act234) 앞으로 (전에는 0)
    dress: {
      a: { props: ["bookshelf"], n: 2 },
      b: { props: ["bookshelf", "burnt-paper", "a2-broken-urns"], n: 7, decals: ["a2-decal-scorched-circle", "a2-decal-broken-tiles"], dn: 3 },
      c: { props: ["bookshelf", "burnt-paper"], n: 6, decals: ["a2-decal-broken-tiles"], dn: 2 },
      d: { props: ["burnt-paper"], n: 2, decals: ["a2-decal-buried-road"], dn: 2 },
      e: { props: ["bookshelf", "burnt-paper"], n: 6, decals: ["a2-decal-dry-crack"], dn: 2 },
      f: { props: ["burnt-paper", "bookshelf", "temple-column"], n: 8, decals: ["a2-decal-scorched-circle", "a4-decal-scorch", "a2-decal-broken-tiles"], dn: 6 },
    },
  },
  vipernest: remix(A1.hollow, Object.assign({}, SANDCAVE("viper-floor", "0.86/0.88/0.72"), {
    title: "독사의 둥지",
    story: ["대로 아래 독사들이 똬리 튼 굴. 갈림길 굴들이 둥지 한가운데로 모이고, 가장 깊은 막힌 굴에 봉인 상자와 되돌아가는 문. (자리: 굶주린 굴을 좌우로 뒤집음 — 들어온 문이 동쪽)"],
    zones: { a: "viper-floor 0.8/0.84/0.68 굴 어귀", b: "viper-floor 0.74/0.8/0.64 허물 벗은 길목", c: "sand-cave-floor 0.8/0.76/0.62 알 무더기 굴", d: "viper-floor 0.86/0.9/0.72 독사의 둥지", e: "viper-floor 0.7/0.74/0.6 허물 굴", f: "sand-cave-floor 0.72/0.68/0.56 막힌 굴 끝" },
    dress: {
      a: { props: ["viper-nest"], n: 2 },
      b: { props: ["viper-nest", "desert-bones"], n: 5, decals: ["a2-decal-snake-trail"], dn: 3 },
      c: { props: ["viper-nest", "desert-rock", "desert-bones"], n: 7, decals: ["a2-decal-snake-trail"], dn: 2 },
      d: { sets: ["a2_lm_serpent_column"], props: ["viper-nest", "a2-dead-cactus", "desert-bones"], n: 9, decals: ["a2-decal-snake-trail", "a2-decal-snake-trail", "a2-decal-bleached-bones"], dn: 6 },
      e: { props: ["viper-nest", "desert-bones"], n: 5 },
      f: { props: ["viper-nest", "a2-waving-skeleton"], n: 4, decals: ["a2-decal-snake-trail"], dn: 2 },
    },
  }), { fx: true }),
};

// 설계 42 높이감 · 층 겹쌓기 (10-28 저녁 사용자 「2층·3층은 겹으로 쌓아 보이게」): 사원 층 = 모래 바다 위에 남은 층 바닥.
//   걷는 칸은 구역 바닥 그대로, 가장자리만 기둥벽 9조각, 남쪽 아래로 사암 담 앞면 띠를 층수만큼(1·2·3단) — 층이 높을수록 아래 모래가 어둡다.
//   대사제의 성소(보스 층)는 낮은 칸에 아래층(사원 바닥)이 작고 어둡게 내려다보인다
const TEMPLE_HEIGHT = {
  temple1: [1, "low=a2-sand-sea-floor:0.8/0.76/0.7"], temple2: [2, "low=a2-sand-sea-floor:0.66/0.62/0.56"],
  temple3: [3, "low=a2-sand-sea-floor:0.54/0.5/0.46"], sanctum: [3, "below=temple-floor:0.55:0.6:1/0.86/0.66"],
};
for (const [id, [t, low]] of Object.entries(TEMPLE_HEIGHT)) module.exports[id].raised = `a2-temple-pillar-wall 1/1/1 사원 층 바닥 tiers=${t} top=zone face=a2-sandstone-wall-face ${low}`;

// 10-28 밤 코덱스 그을린 사암 r2 (assets/codex-a2-handmade-v1): 사원 3층 태양 제단실 · 대사제의 성소 두 방 바닥.
//   모서리 그을음이 칸마다 반복되는 것은 바닥 무늬(향 재 · 깨진 타일)를 더 뿌려 가린다 (요청서 a4 7-4)
module.exports.temple3.zones = Object.assign({}, module.exports.temple3.zones, { d: "a2-scorched-sandstone-floor 1/0.96/0.9 태양 제단실" });
module.exports.temple3.dress = Object.assign({}, module.exports.temple3.dress, { d: Object.assign({}, module.exports.temple3.dress.d, { decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles"], dn: 6 }) });
module.exports.sanctum.zones = Object.assign({}, module.exports.sanctum.zones, { e: "a2-scorched-sandstone-floor 1/0.94/0.86 대사제의 성소" });
module.exports.sanctum.dress = Object.assign({}, module.exports.sanctum.dress, { e: Object.assign({}, module.exports.sanctum.dress.e, { dn: 9 }) });

// 10-28 밤 액트 2 곁 조각 10(assets/codex-a2-handmade-v1 a2-adjunct-*)을 랜드마크 세트 밖에서도 쓴다 (액트 3·4와 같은 방식):
//   큰 소품 곁에 어울리는 곁 조각을 같이 뿌리고, 세트가 없던 장소마다 곁 조각 세트 하나씩 (map_sets.csv a2_caravan_rest · a2_tomb_offering · a2_scribe_corner · a2_serpent_den)
const A2_ADJUNCT = {
  "a2-broken-urns": "a2-adjunct-broken-waterjug", "a2-torn-awning": "a2-adjunct-fallen-awning", "broken-column": "a2-adjunct-sandstone-fragments",
  "temple-column": "a2-adjunct-censer-base", "wind-stele": "a2-adjunct-sun-disc-plaque", "viper-nest": "a2-adjunct-snake-shed",
  "bookshelf": "a2-adjunct-burnt-scroll", "burnt-paper": "a2-adjunct-burnt-scroll", "a2-waving-skeleton": "a2-adjunct-bandage-bundle",
  "a2-buried-statue-head": "a2-adjunct-golden-mask-fragments", "market-stall": "a2-adjunct-camel-saddle", "a2-fallen-obelisk": "a2-adjunct-sandstone-fragments",
  "tent": "a2-adjunct-camel-saddle", "a2-spear-skull-fence": "a2-adjunct-bandage-bundle",
};
const MORE = {
  oasis: { c: ["a2_caravan_rest"] },
  dunes: { a: ["a2_caravan_rest"], e: ["a2_serpent_den"], g: ["a2_caravan_rest"] },
  canyon: { a: ["a2_caravan_rest"], d: ["a2_tomb_offering"], g: ["a2_caravan_rest"] },
  stormwaste: { d: ["a2_tomb_offering"], f: ["a2_caravan_rest"] },   // 서문 망루(a)의 대상 쉼터는 망루 밖 모래에 손으로 (설계서 put — 망루가 4×5라 자리가 없다)
  sunkenroad: { a: ["a2_caravan_rest"], b: ["a2_tomb_offering"], d: ["a2_serpent_den"], e: ["a2_caravan_rest"], h: ["a2_tomb_offering"] },
  temple1: { b: ["a2_tomb_offering"], c: ["a2_tomb_offering"], e: ["a2_serpent_den"], f: ["a2_scribe_corner"] },
  temple2: { b: ["a2_tomb_offering"], c: ["a2_tomb_offering"], f: ["a2_scribe_corner"] },
  temple3: { b: ["a2_tomb_offering"], c: ["a2_tomb_offering"], e: ["a2_serpent_den"], f: ["a2_scribe_corner"] },
  sanctum: { b: ["a2_tomb_offering"], c: ["a2_scribe_corner"] },
  scorpnest1: { b: ["a2_serpent_den"], e: ["a2_serpent_den"] },
  scorpnest2: { b: ["a2_serpent_den"], c: ["a2_serpent_den"] },
  drywell: { b: ["a2_serpent_den"], c: ["a2_tomb_offering"], d: ["a2_serpent_den"] },
  kingtomb1: { c: ["a2_tomb_offering"], e: ["a2_tomb_offering"] },
  kingtomb2: { b: ["a2_tomb_offering"], c: ["a2_serpent_den"], e: ["a2_tomb_offering"] },
  archive: { b: ["a2_scribe_corner"], c: ["a2_scribe_corner"], e: ["a2_scribe_corner"] },
  vipernest: { b: ["a2_serpent_den"], c: ["a2_serpent_den"], e: ["a2_serpent_den"] },
};
for (const [id, sp] of Object.entries(module.exports)) {
  const more = MORE[id] || {};
  sp.dress = Object.fromEntries(Object.entries(sp.dress || {}).map(([z, d]) => {
    const props = d.props ? [...new Set([...d.props, ...d.props.map((p) => A2_ADJUNCT[p]).filter(Boolean)])] : d.props;
    const sets = more[z] ? [...(d.sets || []), ...more[z]] : d.sets;
    return [z, Object.assign({}, d, props ? { props } : {}, sets ? { sets } : {})];
  }));
  for (const z of Object.keys(more)) if (!sp.dress[z]) sp.dress[z] = { sets: more[z] };
}

// ───────── 10-31 맵 구성 v5 표본 (2.5단계 · docs/design/map-composition-v5-plan.md) — 대사제의 성소 ─────────
//   사용자 예시: 성소 문 → 순례자의 방 → 봉인된 문간 → 성소(아레나). 홀 입구(서쪽 문, y 1)에서 동쪽 벽 앞 제단까지 곧은 축 하나 = 띠(신랑 身廊),
//   그 양옆 temple-column 열주 2열(쌍 간격 3칸 · 두 열 간격 5칸 안팎 · 역할 기준 3.5칸) · 축 끝 동쪽 벽 앞 정중앙에 태양 원판 제단(4칸) + 양옆 촛대 한 쌍 · 대사제는 그 앞.
//   전진 출구(남동 26, -7)로 가는 띠는 제단 앞(17, 1)에서 갈라진다 (열주는 축을 따라 제단 앞까지). 띠 북쪽 = 그을린 사암(e) · 남쪽 = 어두운 사암(f) · 홀 북벽 바람 비석 열 · 남벽 향로 열.
//   왼쪽 세 방: 위 = 서고(불타는 책장 탑 + 벽 따라 책장 열 + 필사 구석) · 아래 = 순례자의 방(향로 계단 + 부러진 기둥 줄 + 제물 자리) · 가운데 문간 = 묻힌 석상 하나.
//   항아리·물동이·향로 복제와 홀 안 낱개 기둥(temple-column 넷 · 바람 비석 넷 · 대사제 제단 세트)은 뺐다.
//   자리: 시종의 방 → 봉인된 문간 통로를 막아 시종의 방을 막다른 곁방으로 (가지 간 추가 연결 0 · 띠 고리 없음) · 아레나 안 바위 구멍 넷을 뺐다 (열주와 겹친다) · 문간 → 홀 통로를 축 줄(y 1)로
Object.assign(module.exports.sanctum, {
  v5: {
    outdoor: false,
    via: [[2, 1], [17, 1]],   // 홀 입구 → 제단 앞까지 곧은 축 (경유점 사이는 직선에 붙는다) → 남동 출구로 꺾는다
    dress: {
      a: { props: ["a2-broken-urns", "a2-adjunct-bandage-bundle"], decals: ["a2-decal-broken-tiles"], dn: 2 },
      b: { feature: "prop:a2-landmark-temple-stair-censer", row: { name: "broken-column", step: 2.6 }, props: ["a2-adjunct-sun-disc-plaque", "a2-adjunct-golden-mask-fragments", "a2-adjunct-bandage-bundle"], clusters: 1, decals: ["a2-decal-broken-tiles"], dn: 2 },   // 5차: 제물 세트 대신 그 작은 세 조각을 소품 묶음 하나로 (세트 향로 받침은 홀 남벽 향로 열과 같은 그림 상한·세트 자리 없음으로 빠졌었다)
      c: { feature: "prop:a2-landmark-burning-bookshelf-tower", featureAt: [-19.5, 12.3],   // 4차: 북벽 책장 줄 앞을 가리지 않게 서쪽 · 정면 그림이라 북벽 3칸 안   // 3차: 반 칸 내림 — 아래에 선 플레이어 체력 막대에 가리지 않게
           row: { name: "bookshelf", contiguous: true, step: 1.6, min: 2, minLine: 4 }   /* 4차: 정면 그림이라 북벽에만 빈틈 없이 (역할표 facing north) */, sets: ["a2_scribe_corner"], decals: ["a2-decal-dry-blood"], dn: 1 },
      d: { props: ["a2-buried-statue-head"], decals: ["a2-decal-incense-ash"], dn: 1 },
      e: {
        feature: "prop:a2-landmark-sun-disc-altar", featureAt: [24.5, -0.6], featureScale: 4 / 3,   // 3차: 제단 4칸(역할 3칸 × 4/3) · 축(y 1.5) 끝 동쪽 벽 앞 — 그림 가운데가 축에 오게 발을 내림
        colonnade: { name: "temple-column", step: 3, minPairs: 6, off: 2.5, tight: true, axis: [[1.5, 1.5], [22.5, 1.5]] },   // 3차: 두 열 간격 5칸 안팎 (띠 바로 곁)
        pair: { name: "crypt-candlestand", around: "feature", d: 1.9 },   // 4차: 제단 쪽으로 1칸 당겨 대사제 자리(20.5, 1.5)에서 띄움   // 3차: 제단 양옆 촛대(횃불) 한 쌍
        sides: { left: "e", right: "f" },
        row: [{ name: "wind-stele", side: "n" }, { name: "a2-adjunct-censer-base", side: "s" }],   // 북벽 바람 비석(벽감) 열 · 남벽 향로(화로) 열
        decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles", "a1-decal-blood-pool"], dn: 3,
      },
    },
  },
  paths: [
    P([[-30, 2], [-17, 2]], 3), P([[-17, 2], [-17, -4]], 3), P([[-15, 2], [-15, 8]], 3),
    P([[-11, -8], [-5, -8], [-5, -1]], 3), P([[-2, 1], [1, 1]], 4),
  ],
  places: module.exports.sanctum.places.map((p) => Object.assign({}, p, { name: { a: "성소 문", b: "순례자의 방", c: "서고", d: "봉인된 문간", e: "대사제의 성소" }[p.z] || p.name, note: p.z === "e" ? "아레나 · 대사제 · 신랑 열주와 태양 원판 제단" : p.note })),   // 여왕의 무덤 자리 이름을 그대로 물려받았었다
  rocks: [],
  fixed: { highpriest: [20, 1] },
  zones: Object.assign({}, module.exports.sanctum.zones, {
    c: "tomb-floor 0.78/0.7/0.6 서고",
    d: "a2-sandstone-paving-floor 0.8/0.72/0.6 봉인된 문간",          // 바탕(사원 바닥)과 같은 그림이라 띠가 안 보였다
    f: "a2-scorched-sandstone-floor 0.84/0.76/0.66 대사제의 성소 남쪽",  // 띠 남쪽 (북쪽 e와 다른 톤)
  }),
  put: [],
});
