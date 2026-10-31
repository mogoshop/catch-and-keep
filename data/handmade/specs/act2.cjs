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

// ───────── 10-31 맵 구성 v5 3단계 · 액트 2 적용 (액트 4·1과 같은 생성기·규칙 · docs/review/v5-modes-20261031.md 배정표) ─────────
//   v5 = 골격 띠 + 구역 재적합 + 역할 배치 (성소형) · keep = 바닥·길 글자·이음새 그대로 + 역할 배치만 (유황 늪형). 맵별 공간 구획 = docs/review/map-audit-20261031.md 그 맵 절.
//   ⚠ 잊힌 서고(archive)는 물에 잠긴 예배당(액트 3)·옥좌의 전실·배교자의 수도원(액트 4)이 remix로 자리를 가져간다 — 서고의 길·바위 같은 자리 변경은 specs/overrides.cjs archive 줄.
//   보스·포털·NPC·퀘스트 오브젝트·스포너 자리는 옮기지 않는다 (maps.csv 기능 열은 compose가 설계서 자리 그대로 다시 쓴다).

// 1/15 오아시스 시장 (keep · 마을): 모래 언덕·바닥·시장 큰길(=)·원래 이음새·NPC·상점·포털·화로·게시판·심연 문 자리 모두 그대로 · 역할 배치(산발 정리)만 (잿불 야영지·마지막 초소와 같은 처리).
//   검수표 구획: 남문 길(입구) → 시장 광장(웨이포인트) · 곁 = 오아시스 물가·천막 거리·대장간 마당.
//   특징 공간당 1 (검수표 「물가 특징 2 · 16×16 과밀(특징 3)」): 오아시스 물가 = 샘 + 야자수 둘(물가 이름 그대로) · 천막 거리 = 대상 우물(마을 랜드마크 — 물가에서 대상 NPC가 선 천막 거리
//   남쪽 막다른 자리로 옮김 · 그림 전체가 보이는 자리) · 대장간 마당 = 낱개 우물을 빼고(우물 둘·같은 16×16) 무기 걸이·장작·항아리 묶음.
//   꾸밈은 묶음 ≤3·같은 그림 맵당 ≤2로 (깨진 물동이 산발 3 → 묶음) · 천막 거리 = 대상 쉼터 세트 · 남문 길 = 이정표·바위 묶음.
// 손으로 고른 자리 손질: 천막(정면 그림)은 북쪽 언덕에 붙여 뒤 칸을 벽까지 막고 서쪽 1칸 벽감을 막음 · 야자수 둘과 물가 양끝 언덕 사이 벽감(3칸·1칸)을 막음 ·
//   좌판 둘은 시장 큰길 남쪽 그대로 (역할표 「마을 길 양옆 좌판 열」 — 길 양옆 열이라 facing north → any · 사방이 트인 차양 좌판)
Object.assign(module.exports.oasis, {
  put: module.exports.oasis.put.filter((p) => p[1] !== "a2-landmark-caravan-well" && p[1] !== "well")
    .map((p) => (p[1] === "tent" ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, "wall=1;padl=1"]
      : p[1] === "palm" && p[2] < 0 ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, "padl=3"]
      : p[1] === "palm" ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, "padr=1"] : p)),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { decals: ["a2-decal-broken-tiles"], dn: 2 },
      b: { decals: ["a2-decal-sand-ripples"], dn: 1 },
      c: { feature: "prop:a2-landmark-caravan-well", featureAt: [-12, -4.6], sets: ["a2_caravan_rest"], props: ["a2-broken-urns", "camp-firewood"], clusters: 1, decals: ["a2-decal-camel-tracks"], dn: 1 },
      d: { props: ["camp-weapon-rack", "camp-firewood", "a2-broken-urns"], clusters: 1, decals: ["a1-decal-ash-campfire"], dn: 1 },
      e: { props: ["mp-signpost", "desert-rock", "a2-dead-cactus"], clusters: 1, decals: ["a2-decal-camel-tracks", "a2-decal-sand-ripples"], dn: 2 },
    },
  },
});

// 2/15 뜨거운 모래 언덕 (keep · 상위 5 최소 수정 · 등급 C): 물결 모래 바탕·묻힌 옛길(=)·샛길(-)·모래 언덕·바위 능선·원래 이음새·장소 세트 그대로 · 길 안내 0 · 산발 정리만
//   (검수표 구획: 언덕 어귀 → 짐승 무덤 → 마른 오아시스 터(웨이포인트) → 동쪽 바람길, 곁 = 버려진 야영지·전갈 굴 어귀(굴 입구)·모래 웅덩이).
//   장소 세트는 원래 설계서 그대로(자리도 기준 배치표 그대로 featureAt) — 짐승 무덤 = 거대 짐승 두개골 세트 · 마른 오아시스 터 = 오아시스 폐허 세트 · 버려진 야영지 = 버려진 야영지 세트 · 모래 웅덩이 = 묻힌 대상 행렬(랜드마크) ·
//   전갈 굴 어귀 = 뱀 굴 세트 · 언덕 어귀·바람길 = 대상 쉼터 세트. 뼈·항아리·낙타 안장·차양 산발(11·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.dunes, {
  // 웨이포인트 (1, 1) → (0, −1): keep 골격(묻힌 옛길 = 글자를 따라 오아시스 터 가운데 y −2를 지난다)에서 3칸 → 옛길 바로 북쪽 칸 (옛길 글자 칸 위는 길 그림이 끊겨 피함 · waypoints.csv·WaypointData.mlua 함께 갱신)
  waypoint: [0, -1],
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a2_caravan_rest"], decals: ["a2-decal-camel-tracks", "a2-decal-sand-ripples"], dn: 2 },
      b: { feature: "set:a2_beast_grave", featureAt: [-11.5, 12.3], props: ["mp-beast-skull", "a2-dead-cactus"], clusters: 1, decals: ["a2-decal-bleached-bones", "a2-decal-sand-ripples"], dn: 2 },
      c: { feature: "set:a2_oasis_ruin", featureAt: [0.5, -5.7], props: ["desert-rock", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-dry-crack", "a2-decal-broken-tiles"], dn: 2 },
      d: { sets: ["a2_abandoned_camp"], props: ["a2-adjunct-fallen-awning", "desert-bones"], clusters: 2, decals: ["a2-decal-camel-tracks", "a2-decal-snake-trail"], dn: 2 },
      e: { sets: ["a2_serpent_den"], props: ["desert-rock", "a2-dead-cactus"], clusters: 1, decals: ["a2-decal-snake-trail"], dn: 2 },
      f: { feature: "set:a2_lm_buried_caravan", featureAt: [11.5, -6.7], props: ["a2-waving-skeleton", "desert-bones"], clusters: 1, decals: ["a2-decal-sand-drift", "a2-decal-bleached-bones"], dn: 2 },
      g: { sets: ["a2_caravan_rest"], decals: ["a2-decal-sand-ripples"], dn: 1 },
    },
  },
});

// 3/15 메마른 협곡 (keep · 상위 5 최소 수정 · 등급 C): 마른 땅 바탕·협곡 길(=)·협곡 절벽·바위·원래 이음새·장소 세트 그대로 · 길 안내 0 · 산발 정리만
//   (검수표 구획: 협곡 입구 → 갈비뼈 고개 → 거상의 분지(웨이포인트) → 마른 우물 터(버려진 우물 입구) → 동쪽 협곡 출구, 곁 = 절벽 아래 야영지·갈라진 바위턱).
//   장소 세트는 원래 설계서 그대로(자리도 기준 배치표 그대로 featureAt) — 갈비뼈 고개 = 갈비뼈 아치 세트 · 거상의 분지 = 왕관 쓴 거상 머리 세트 · 마른 우물 터 = 우물(손으로 고른 자리) + 무덤 제물 세트 ·
//   절벽 아래 야영지 = 버려진 야영지 세트 · 갈라진 바위턱 = 마른 물레방아(랜드마크) · 입구·출구 = 대상 쉼터 세트.
//   항아리·뼈·향로 받침·물동이·바위 산발(6·5·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.canyon, {
  // 웨이포인트 (−2, 1) → (−2, 2): keep 골격(협곡 입구→분지를 비스듬히 지나 y 3을 지난다)에서 2칸 → 1칸 북쪽, 골격 바로 곁 (waypoints.csv·WaypointData.mlua 함께 갱신)
  waypoint: [-2, 2],
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a2_caravan_rest"], decals: ["a2-decal-sand-drift", "a2-decal-dry-crack"], dn: 2 },
      b: { feature: "set:a2_rib_pass", featureAt: [-17.5, -7.7], props: ["desert-bones", "desert-rock"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 2 },
      c: { feature: "set:a2_colossus", featureAt: [-2.5, 7.3], props: ["a2-broken-urns", "desert-rock"], clusters: 1, decals: ["a2-decal-broken-sandstone", "a2-decal-buried-road", "a2-decal-broken-tiles"], dn: 3 },
      d: { sets: ["a2_tomb_offering"], props: ["desert-bones", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-dry-crack"], dn: 2 },
      e: { sets: ["a2_abandoned_camp"], props: ["camp-firewood", "a2-adjunct-fallen-awning"], clusters: 1, decals: ["a1-decal-ash-campfire"], dn: 2 },
      f: { feature: "set:a2_lm_dry_waterwheel", featureAt: [13.5, 16.3], props: ["a2-waving-skeleton", "desert-bones"], clusters: 1, decals: ["a2-decal-dry-crack"], dn: 2 },
      g: { sets: ["a2_caravan_rest"], decals: ["a2-decal-sand-ripples"], dn: 1 },
    },
  },
});

// 4/15 바람 무덤 사막 (keep · `?` 맵 — 악마의 행군로 결론을 따름): 모래 바다 바탕·사암 담 윗면(;raised)·긴 성벽 포장(=)·끊긴 담 끝·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 서문 망루 → 긴 성벽 → 묻힌 오아시스 성벽(웨이포인트) → 끊긴 자리 ②의 ㄷ자 → 동쪽 모래길, 곁 = 바람 비석 보루·짐승 무덤 망루·묘실 문 앞 보루(묘실 입구)·모래에 묻힌 마을 보루).
//   특징 공간당 1 (검수표 「짐승 무덤 망루 특징 2」): 짐승 무덤 망루 = 바람 무덤 기둥(랜드마크 · 짐승 두개골 세트는 같은 공간 특징 둘이라 뺌) ·
//   바람 비석 보루 = 둥근 보루 둘레 비석 고리(손으로 고른 자리 그대로 · 반복 구조) · 묘실 문 앞 보루 = 묘실 문(북쪽 담을 등짐 · 손으로 고른 자리) + 무덤 제물 세트 ·
//   모래에 묻힌 마을 보루 = 무너진 집터(손으로 고른 자리) + 차양·항아리 묶음 · 묻힌 오아시스 성벽 = 꺼진 안뜰 야자 폐허(손으로 고른 자리) + 바위 묶음.
//   모래 바다에 반쯤 묻힌 것들(석상 머리·오벨리스크·바위 — 손으로 고른 자리)은 둘씩만 남김(아래). 뼈·차양·향로 받침·석상 머리·항아리 산발(5·4·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
// 손으로 고른 자리 손질: 모래 바다 석상 머리·쓰러진 오벨리스크 셋씩(산발 복제) → 둘씩 (남서 모래의 석상 머리 · 북동 모래의 오벨리스크를 뺌) ·
//   끊긴 자리 ①의 낱개 무너진 기둥(기둥 낱개) → 사암 조각 소품 · 묘실 문과 서쪽 담 사이 2칸 벽감을 막음 ·
//   비석 고리 북쪽 세 비석과 둥근 담 사이 1칸 벽감(세로 2칸 둘 · 1칸 둘)을 그 비석 막힘에 더함 (fill)
const SW_FILL = { "-14,17.4": "fill=-16/18,-16/17,-13/18,-13/17", "-17.2,16.2": "fill=-19/16", "-10.8,16.2": "fill=-10/16" };
Object.assign(module.exports.stormwaste, {
  put: module.exports.stormwaste.put.filter((p) => !(p[1] === "a2-buried-statue-head" && p[2] === -12) && !(p[1] === "a2-fallen-obelisk" && p[2] === 26))
    .map((p) => (p[1] === "broken-column" && p[2] === -22 ? ["prop", "a2-adjunct-sandstone-fragments", p[2], p[3], 1, 0, "ok=cliff"]
      : p[1] === "tomb-door" ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, "padl=2"]
      : p[1] === "wind-stele" && SW_FILL[p[2] + "," + p[3]] ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, SW_FILL[p[2] + "," + p[3]]] : p)),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { decals: ["a2-decal-sand-ripples"], dn: 1 },
      b: { props: ["desert-bones", "desert-rock"], clusters: 1, decals: ["a2-decal-sand-drift", "a2-decal-bleached-bones"], dn: 2 },
      c: { props: ["desert-rock", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-dry-crack", "a2-decal-sand-drift"], dn: 2 },
      d: { sets: ["a2_tomb_offering"], decals: ["a2-decal-buried-road"], dn: 2 },
      e: { feature: "set:a2_lm_wind_tomb", props: ["mp-beast-skull", "desert-bones"], clusters: 1, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 2 },
      f: { props: ["a2-torn-awning", "a2-broken-urns", "a2-adjunct-broken-waterjug"], clusters: 1, decals: ["a2-decal-broken-tile", "a2-decal-broken-tiles"], dn: 2 },
      g: { decals: ["a2-decal-sand-ripples"], dn: 1 },
    },
  },
});

// 5/15 가라앉은 대로 (keep · `?` 맵 — 악마의 행군로 결론을 따름): 모래 바다 바탕·사암 담 윗면(;raised)·대로 포장(=)·열주 회랑 바닥·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 서문 망루와 대로 → 거상 보루(웨이포인트) → 모래에 잠긴 시장 성벽 → 사원 문 앞 성벽(전진 출구), 곁 = 열주 회랑·서남 보루(독사 둥지 입구)·서북 망루·북쪽 보루).
//   특징 공간당 1: 거상 보루 = 왕관 쓴 거상 머리 세트(원래 설계서 그대로) · 사원 문 앞 성벽 = 가라앉은 개선문(랜드마크 한 장 · 출구 북쪽 가운데 — 북쪽 담 3칸 안이면 뒤 칸이 남았다 · 사원 문 세트는 문 아치·기둥이 같은 공간 특징·낱개 기둥이라 뺌 · 출구 양옆 기둥 쌍은 골격 너비를 2칸 밑으로 줄여 뺌) ·
//   열주 회랑 = 북쪽 담 사원 기둥 열 + 항아리 묶음 · 모래에 잠긴 시장 = 대상 쉼터 세트 + 차양 묶음 · 서남 보루 = 뱀 굴 세트 · 북쪽 보루 = 무덤 제물 세트 ·
//   서문 망루 = 대상 쉼터 세트 · 서북 망루 = 뼈 묶음. 향로 받침·항아리·오벨리스크·태양 원판·붕대 산발(6·5·3·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
//   모래 바다에 반쯤 묻힌 것들(석상 머리·오벨리스크·바위)과 끊긴 대로 끝 무너진 기둥은 손으로 고른 자리 그대로.
// 손으로 고른 자리 손질: 열주 회랑 가운데 낱개 사원 기둥 셋(한 줄 · 담 사이 뒤 칸 4)은 빼고 북쪽 담에 붙인 사원 기둥 열로 · 끊긴 대로 끝 무너진 기둥과 담 사이 1칸 벽감을 막음
//   웨이포인트 (3, −3) → (1, −3): keep 골격(거상 보루를 서북→남동으로 비스듬히 지난다)에서 3칸 → 2칸 서쪽, 골격 바로 곁 (waypoints.csv·WaypointData.mlua 함께 갱신)
const SUNKENROAD_KEEP = {
  mode: "keep",
  outdoor: true,
  dress: {
    a: { sets: ["a2_caravan_rest"], decals: ["a2-decal-buried-road"], dn: 2 },
    b: { row: { name: "temple-column", side: "n" }, props: ["a2-broken-urns", "a2-adjunct-sandstone-fragments"], clusters: 1, decals: ["a2-decal-broken-tiles"], dn: 2 },
    c: { feature: "set:a2_colossus", props: ["a2-adjunct-sun-disc-plaque", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-broken-tiles"], dn: 2 },
    d: { sets: ["a2_serpent_den"], decals: ["a2-decal-snake-trail"], dn: 2 },
    e: { sets: ["a2_caravan_rest"], props: ["a2-torn-awning", "a2-adjunct-broken-waterjug"], clusters: 2, decals: ["a2-decal-sand-ripples"], dn: 2 },
    f: { feature: "prop:a2-landmark-sunken-triumph-arch", featureAt: [28.5, 8.6], props: ["a2-adjunct-censer-base", "a2-adjunct-bandage-bundle"], clusters: 1, decals: ["a2-decal-buried-road"], dn: 2 },
    g: { props: ["desert-bones", "mp-beast-skull"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 1 },
    h: { sets: ["a2_tomb_offering"], decals: ["a2-decal-broken-tiles"], dn: 1 },
  },
};
// 빈 바닥 21.6%(20% 넘음) — 악마의 행군로처럼 v5 비교본(성소형 — 골격 띠·구역 재적합·띠 곁 패치·섬 · 같은 꾸밈)만 만들어 둔다. 기본은 keep —
//   `V5_ALT=sunkenroad node tools/build/handmade/compose.cjs act2 sunkenroad`로만 짓는다 (비교 미리보기·설계도: docs/evidence/2026-10-31-map-v5-act2/variants/sunkenroad-v5.*)
const SUNKENROAD_V5 = Object.assign({}, SUNKENROAD_KEEP, { mode: undefined });
Object.assign(module.exports.sunkenroad, {
  waypoint: [1, -3],
  put: module.exports.sunkenroad.put.filter((p) => p[1] !== "temple-column").map((p) => (p[1] === "broken-column" && p[2] === 14.6 ? p.slice(0, 6).concat(["ok=gate;padr=1"]) : p)),
  v5: (process.env.V5_ALT || "").split(",").includes("sunkenroad") ? SUNKENROAD_V5 : SUNKENROAD_KEEP,
});

// 6/15 전갈 굴 1층 (keep): 모래 굴 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (뼈 구덩이 1층·유황 동굴 1층과 같은 자리 — 같은 처리)
//   (검수표 구획: 굴 어귀 → 모래 비탈 → 껍질 광장 → 매복 굴 → 아래 계단, 곁 = 남쪽 고리길 — keep이라 고리길 통로는 그대로).
//   특징 공간당 1: 껍질 광장 = 독 웅덩이 바위(랜드마크 · 검수표 「광장 중심에」, 매복 굴에서 옮김) · 매복 굴 = 갈비뼈 아치 세트(껍질 광장에서 옮김 — 매복 길목의 문) ·
//   모래 비탈 = 뱀 굴 세트 · 남쪽 고리길 = 뼈·손 흔드는 해골 묶음 · 어귀·아래 계단 = 바위 하나. 뼈·사암 조각 산발(8·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.scorpnest1, {
  places: module.exports.scorpnest1.places.map((p) => Object.assign({}, p, { name: { a: "굴 어귀", b: "모래 비탈", c: "껍질 광장", d: "매복 굴", e: "남쪽 고리길", f: "아래 계단" }[p.z] || p.name })),   // 짝 맵(뼈 구덩이 1층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a2-adjunct-sandstone-fragments"], decals: ["a2-decal-snake-trail"], dn: 1 },
      b: { sets: ["a2_serpent_den"], decals: ["a2-decal-snake-trail"], dn: 2 },
      c: { feature: "set:a2_lm_venom_pool", props: ["a3-crab-shell-pile", "desert-bones"], clusters: 1, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 3 },
      d: { feature: "set:a2_rib_pass", props: ["desert-rock", "a2-dead-cactus"], clusters: 1, decals: ["a2-decal-snake-trail"], dn: 2 },
      e: { props: ["desert-bones", "a2-waving-skeleton"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 1 },
      f: { props: ["desert-rock"], decals: ["a2-decal-snake-trail"], dn: 1 },
    },
  },
});

// 7/15 전갈 굴 2층 (keep): 모래 굴 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (뼈 구덩이 2층·유황 동굴 2층과 같은 자리 — 같은 처리)
//   (검수표 구획: 계단참 → 껍질 무더기 길 → 독침 여왕의 알자리(끝방 · 되돌아가는 문), 곁 = 북쪽 굴).
//   독침 여왕의 알자리 = 전갈 알 둥지(랜드마크 · 손으로 고른 자리 그대로 — 끝방 자리 뒤) + 껍질·창 울타리 묶음 · 껍질 무더기 길 = 껍질·뼈 묶음 둘 + 뱀 자국 ·
//   북쪽 굴 = 뱀 굴 세트 · 계단참 = 바닥 무늬만. 뼈·사암 조각 산발(5·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.scorpnest2, {
  places: module.exports.scorpnest2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "껍질 무더기 길", c: "북쪽 굴", d: "독침 여왕의 알자리" }[p.z] || p.name })),   // 짝 맵(뼈 구덩이 2층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { decals: ["a2-decal-snake-trail"], dn: 1 },
      b: { props: ["a3-crab-shell-pile", "desert-bones", "desert-rock"], clusters: 2, decals: ["a2-decal-snake-trail", "a2-decal-bleached-bones"], dn: 2 },
      c: { sets: ["a2_serpent_den"], props: ["a2-waving-skeleton"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 1 },
      d: { props: ["a3-crab-shell-pile", "a2-adjunct-bandage-bundle", "desert-bones"], clusters: 1, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 3 },
    },
  },
});

// 8/15 버려진 우물 (keep): 우물·이끼 굴 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (목매단 동굴과 같은 자리 — 같은 처리)
//   (검수표 구획: 우물 바닥 → 이끼 낀 굴 → 박쥐 굴 → 마른 물웅덩이 터(봉인 상자 · 되돌아가는 문 · 끝방), 곁 = 무너진 돌계단 — keep이라 두 굴로 갈라졌다 만나는 통로는 그대로).
//   특징 공간당 1: 마른 물웅덩이 터 = 마른 우물 도르래(랜드마크 · 원래 설계서 그대로 — 이름이 「물웅덩이 터」라 그 자리가 맞다 · 검수표 「무너진 돌계단 중심에」는 따르지 않음) ·
//   무너진 돌계단 = 무덤 제물 세트 + 사암 조각 · 이끼 낀 굴 = 뱀 굴 세트 · 박쥐 굴 = 뼈·항아리 묶음 · 우물 바닥 = 깨진 물동이 하나.
//   붕대·뼈·향로 받침 산발(4·4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.drywell, {
  places: module.exports.drywell.places.map((p) => Object.assign({}, p, { name: { a: "우물 바닥", b: "이끼 낀 굴", c: "무너진 돌계단", d: "박쥐 굴", e: "마른 물웅덩이 터" }[p.z] || p.name })),   // 짝 맵(목매단 동굴) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a2-adjunct-broken-waterjug"], decals: ["a2-decal-dry-crack"], dn: 1 },
      b: { sets: ["a2_serpent_den"], decals: ["a2-decal-dry-crack"], dn: 1 },
      c: { sets: ["a2_tomb_offering"], props: ["a2-adjunct-sandstone-fragments", "desert-rock"], clusters: 1, decals: ["a2-decal-broken-sandstone", "a2-decal-broken-tiles"], dn: 2 },
      d: { props: ["desert-bones", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 1 },
      e: { feature: "set:a2_lm_well_pulley", props: ["a2-waving-skeleton", "desert-bones"], clusters: 1, decals: ["a2-decal-mummy-bandage", "a2-decal-dry-crack"], dn: 2 },
    },
  },
});

// 9/15 왕들의 묘실 1층 (v5): 무너진 계단(W −29, 0) → 회랑 → 순장 통로(매복 길목) → 석관 방 → 아래 계단참(E 28, 0)이 y 0 한 줄 — 그 축이 띠
//   (가라앉은 지하실 1층을 위아래로 뒤집은 자리 · 재의 회랑과 같은 구조). 고리 줄이기(검수표 「고리 3+2」 · 지하실 1층·재의 회랑과 같은 판단):
//   부장품 방 → 석관 방 남쪽 긴 통로를 막아 부장품 방을 막다른 방으로 · 향료 방 → 석관 방 북쪽 고리길(이야기 「고리길로 돌면 왕의 석관 방」)은 남김 (남쪽을 남기면 향료 방 통로가 띠에 닿아 가지가 하나뿐이라 추가 연결 1 > 50%) (가지 2 · 추가 연결 1 = 50% 이하).
//   석관 방 = 축 끝 북쪽 왕관 쓴 거상 머리(특징 · 「왕들의」 묘실 · 손으로 고른 석상 머리 자리를 대신) + 양옆 사원 기둥 한 쌍 · 띠 북쪽 그을린 사암 / 남쪽 어두운 사암
//   (구역 바닥이 바탕과 같은 묘실 바닥이라 띠가 안 보였다). 부장품 방 = 황금 가면 벽(랜드마크) + 금화 무늬 · 향료 방 = 북벽 바람 비석 열 + 무덤 제물 세트 ·
//   순장 통로 = 붕대·뼈 무늬 · 계단참·아래 계단참 = 항아리 묶음 하나. 항아리·향로 받침·가면 조각·태양 원판 산발(5·4·3·3)은 묶음으로.
Object.assign(module.exports.kingtomb1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a2-broken-urns", "a2-adjunct-broken-waterjug"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: { feature: "prop:a2-landmark-golden-mask-wall", props: ["a2-adjunct-golden-mask-fragments", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-scattered-coins", "a2-decal-broken-tiles"], dn: 2 },
      c: { row: { name: "wind-stele", side: "n" }, sets: ["a2_tomb_offering"], decals: ["a2-decal-incense-ash"], dn: 2 },
      d: { decals: ["a2-decal-mummy-bandage", "a2-decal-bleached-bones"], dn: 2 },
      e: {
        feature: "prop:a2-crowned-colossus-head",
        pair: { name: "temple-column", around: "feature", d: 2.8 },   // 둥근 방이라 축 양옆 열주는 0쌍(띠 곁·특징 둘레) — 거상 머리 양옆 기둥 한 쌍
        sides: { left: "e", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        decals: ["a2-decal-scattered-coins", "a2-decal-broken-tiles", "a2-decal-mummy-bandage"], dn: 3,
      },
      f: { props: ["a2-adjunct-censer-base"], decals: ["a2-decal-broken-tiles"], dn: 1 },
    },
  },
  paths: module.exports.kingtomb1.paths.filter((p) => p.pts[0].join(",") !== "-6,-8"),
  places: module.exports.kingtomb1.places.map((p) => Object.assign({}, p, { name: { a: "무너진 계단", b: "부장품 방", c: "향료 방", d: "순장 통로", e: "석관 방", f: "아래 계단참" }[p.z] || p.name, note: p.z === "e" ? "왕관 쓴 거상 머리와 사원 기둥 한 쌍" : p.note })),   // 지하실 1층 자리 이름을 그대로 물려받았었다
  put: [],   // 석상 머리(손으로 고른 자리) → 석관 방 특징(거상 머리)으로
  zones: Object.assign({}, module.exports.kingtomb1.zones, {
    e: "a2-scorched-sandstone-floor 0.96/0.88/0.78 석관 방",         // 바탕(묘실 바닥)과 같은 그림이라 띠가 안 보였다 — 띠 북쪽
    h: "a2-scorched-sandstone-floor 0.76/0.68/0.6 석관 방 남쪽",     // 띠 남쪽
  }),
});

// 10/15 왕들의 묘실 2층 (v5): 계단참(W −29, 1) → 회랑(y 1) → 갈림 방 → 수호왕의 석관실(끝방 16, 8 · 되돌아가는 문 24, 10). 띠 = 회랑 축 + 석관실 안에서 x 21까지 곧게 간 뒤 북쪽으로 꺾어 문 줄(y 10)로
//   (가라앉은 지하실 2층을 위아래로 뒤집은 자리 — 같은 처리). 고리 끊기(검수표 「고리 3+2」): 무너진 보물 방 → 갈림 방 · 모래 쏟아진 방 → 갈림 방 대각 통로를 막아
//   두 둥근 방이 회랑 x −19 갈림길에서만 닿는 막다른 방 (끝방·되돌아가는 문 동선과 무관). 석관실 1×1 바위 기둥(낱개 기둥)은 뺐다 (사원 기둥 열주로 대신).
//   모래 쏟아진 방(검수표 「캡처로 확인」): 골격 밖이라 띠가 지나지 않고 모래 바닥(sand-floor) 그대로 — 재적합은 띠 곁 칸만 바꾼다.
//   수호왕의 석관실 = 수호왕 석관(랜드마크 · 손으로 고른 자리를 v5 특징으로 · 한 칸 내린 같은 자리 — 끝방 뒤 북벽) + 끝방으로 가는 축 양옆 사원 기둥 열주 + 남벽 바람 비석 열 ·
//   띠 북쪽 그을린 사암 / 남쪽 어두운 사암 (구역 바닥이 바탕과 같은 묘실 바닥이라 띠가 안 보였다).
//   무너진 보물 방 = 부서진 기둥 묶음 + 금화 무늬 · 모래 쏟아진 방 = 바위·뼈 묶음 + 모래 물결 · 갈림 방·계단참 = 바닥 무늬와 소품 하나.
Object.assign(module.exports.kingtomb2, {
  v5: {
    outdoor: false,
    via: [[21, 1], [21, 10]],   // 축(y 1)을 끝방 동쪽 x 21까지 곧게 (x 16이면 띠가 석관 자리를 지나 석관이 밀려났다) → 북쪽으로 꺾어 되돌아가는 문 줄(y 10) — 대각 계단 띠가 석관실을 비스듬히 가르지 않게
    dress: {
      a: { props: ["a2-broken-urns", "a2-adjunct-broken-waterjug"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: { props: ["a2-adjunct-sandstone-fragments", "a2-adjunct-golden-mask-fragments", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-scattered-coins", "a2-decal-broken-tiles"], dn: 2 },
      c: { props: ["desert-rock", "desert-bones"], clusters: 1, decals: ["a2-decal-sand-ripples", "a2-decal-sand-drift"], dn: 2 },
      d: { decals: ["a2-decal-broken-tiles", "a2-decal-mummy-bandage"], dn: 2 },
      e: {
        feature: "set:a2_lm_king_sarcophagus", featureAt: [16.5, 10.3],   // 손으로 고른 자리(16.5, 11.3)는 v5 역할 크기 발밑이 북벽에 걸려 한 칸 내림
        colonnade: { name: "temple-column", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[9.5, 1.5], [15.5, 1.5]] },
        row: [{ name: "wind-stele", side: "s" }],
        sides: { left: "e", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        props: ["a2-adjunct-censer-base", "a2-adjunct-bandage-bundle"], clusters: 1,
        decals: ["a2-decal-mummy-bandage", "a2-decal-scattered-coins", "a2-decal-bleached-bones"], dn: 3,
      },
    },
  },
  rocks: [],
  paths: module.exports.kingtomb2.paths.filter((p) => !["-8,-6", "-8,10"].includes(p.pts[0].join(","))),
  places: module.exports.kingtomb2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "무너진 보물 방", c: "모래 쏟아진 방", d: "갈림 방", e: "수호왕의 석관실" }[p.z] || p.name, note: p.z === "e" ? "수호왕 아메네트 · 봉인 상자 · 되돌아가는 문" : p.note })),   // 지하실 2층 자리 이름을 그대로 물려받았었다
  put: module.exports.kingtomb2.put.filter((p) => p[1] !== "a2_lm_king_sarcophagus"),   // 수호왕 석관 → v5 특징(같은 자리)
  zones: Object.assign({}, module.exports.kingtomb2.zones, {
    e: "a2-scorched-sandstone-floor 0.98/0.88/0.74 수호왕의 석관실",       // 띠 북쪽 (바탕 묘실 바닥과 다른 그림)
    h: "a2-scorched-sandstone-floor 0.76/0.68/0.58 수호왕의 석관실 남쪽",  // 띠 남쪽
  }),
});

// 11/15 잊힌 서고 (v5): 내려온 계단(W −29, 0) → 서쪽 열람실 → 필사실 복도 → 불탄 금서실(끝방 20, 6 · 되돌아가는 문 25, −8)이 y 0 한 줄 — 축이 띠, 금서실 안에서 x 18까지 곧게 간 뒤 남쪽 문 줄(y −8)로.
//   고리 끊기·금서실 바위 기둥은 specs/overrides.cjs archive (이 서고를 remix로 가져가는 예배당·전실·수도원은 그대로) — 북쪽·남쪽 열람실은 필사실 복도에서만 들어가는 막다른 방.
//   불탄 금서실 = 불타는 책장 탑(랜드마크 · 손으로 고른 자리를 v5 특징으로 · 끝방 뒤 북벽 · 불꽃 사서는 그 앞) + 축 양옆 사원 기둥 열주 + 북벽 책장 줄(빈틈 없이) ·
//   띠 북쪽 그을린 사암 / 남쪽 어두운 사암 (구역 바닥이 바탕과 같은 서고 바닥이라 띠가 안 보였다).
//   서쪽 열람실 = 서가 줄(설계도 담 글자 — 반복 구조) + 필사 구석 세트 · 북쪽·남쪽 열람실 = 북벽 책장 줄 + 타다 만 두루마리 묶음 · 필사실 복도 = 바닥 무늬만 · 계단 = 물동이 하나.
//   타다 만 두루마리·물동이·사암 조각·불탄 종이 산발(8·3·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.archive, {
  v5: {
    outdoor: false,
    via: [[18, 0], [18, -8]],   // 축(y 0)을 금서실 x 18까지 곧게 → 남쪽으로 꺾어 되돌아가는 문 줄(y −8) — 대각 띠가 금서실을 비스듬히 가르지 않게
    dress: {
      a: { props: ["a2-adjunct-broken-waterjug"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: { sets: ["a2_scribe_corner"], props: ["burnt-paper"], clusters: 1, decals: ["a2-decal-scorched-circle", "a2-decal-broken-tiles"], dn: 2 },
      c: { row: { name: "bookshelf", side: "n", contiguous: true, step: 1.6, min: 2, minLine: 4 }, props: ["a2-adjunct-burnt-scroll", "burnt-paper"], clusters: 1, decals: ["a2-decal-broken-tiles"], dn: 1 },
      d: { decals: ["a2-decal-buried-road", "a2-decal-scorched-circle"], dn: 2 },
      e: { row: { name: "bookshelf", side: "n", contiguous: true, step: 1.6, min: 2, minLine: 4 }, props: ["a2-adjunct-burnt-scroll", "a2-adjunct-sandstone-fragments"], clusters: 1, decals: ["a2-decal-dry-crack"], dn: 1 },
      f: {
        feature: "prop:a2-landmark-burning-bookshelf-tower", featureAt: [20.5, 9.3],
        colonnade: { name: "temple-column", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[12.5, 0.5], [17.5, 0.5]] },
        sides: { left: "f", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        props: ["a2-adjunct-censer-base", "burnt-paper"], clusters: 1,
        decals: ["a2-decal-scorched-circle", "a4-decal-scorch", "a2-decal-broken-tiles"], dn: 3,
      },
    },
  },
  put: [],   // 불타는 책장 탑 세트(손으로 고른 자리) → v5 특징(같은 자리)
  zones: Object.assign({}, module.exports.archive.zones, {
    b: "archive-floor 0.72/0.64/0.54 서쪽 열람실",                      // 바탕(서고 바닥)과 색 차이 0.06이라 「같은 바닥」 → 띠 곁 패치가 열람실을 띠에서 떼어 두 쪽이 가지로 셌다 — 한 톤 어둡게
    f: "a2-scorched-sandstone-floor 0.86/0.76/0.66 불탄 금서실",         // 바탕(서고 바닥)과 같은 그림이라 띠가 안 보였다 — 띠 북쪽
    h: "a2-scorched-sandstone-floor 0.68/0.6/0.52 불탄 금서실 남쪽",   // 띠 남쪽
  }),
});

// 12/15 독사의 둥지 (keep): 독사 굴 바닥·둥근 굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (굶주린 굴·타락의 구덩이와 같은 자리 — 같은 처리)
//   (검수표 구획: 굴 어귀 → 허물 벗은 길목 → 독사의 둥지 → 막힌 굴 끝(봉인 상자 · 되돌아가는 문), 곁 = 알 무더기 굴·허물 굴).
//   특징 공간당 1: 독사의 둥지 = 똬리 튼 뱀 기둥(랜드마크 · 원래 설계서 그대로 · 둥지 남쪽 가운데 — 북서 자리는 골격 너비를 2칸 밑으로 줄였다) + 허물·뼈 묶음 · 알 무더기 굴 = 뱀 굴 세트 · 허물 굴 = 뼈·손 흔드는 해골 묶음 ·
//   막힌 굴 끝 = 붕대·사암 조각 묶음 · 허물 벗은 길목·굴 어귀 = 바닥 무늬와 소품 하나. 뱀 허물 산발(10)·사암 조각·붕대(3·3)는 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.vipernest, {
  places: module.exports.vipernest.places.map((p) => Object.assign({}, p, { name: { a: "굴 어귀", b: "허물 벗은 길목", c: "알 무더기 굴", d: "독사의 둥지", e: "허물 굴", f: "막힌 굴 끝" }[p.z] || p.name })),   // 짝 맵(굶주린 굴) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["desert-rock"], decals: ["a2-decal-snake-trail"], dn: 1 },
      b: { props: ["a2-adjunct-snake-shed", "desert-bones"], clusters: 1, decals: ["a2-decal-snake-trail"], dn: 1 },
      c: { sets: ["a2_serpent_den"], decals: ["a2-decal-snake-trail", "a2-decal-bleached-bones"], dn: 2 },
      d: { feature: "set:a2_lm_serpent_column", featureAt: [-4.5, -3.4], props: ["a2-dead-cactus", "desert-bones"], clusters: 1, decals: ["a2-decal-snake-trail", "a2-decal-bleached-bones"], dn: 3 },
      e: { props: ["a2-waving-skeleton", "desert-rock"], clusters: 1, decals: ["a2-decal-bleached-bones"], dn: 1 },
      f: { props: ["a2-adjunct-bandage-bundle", "a2-adjunct-sandstone-fragments"], clusters: 1, decals: ["a2-decal-snake-trail"], dn: 2 },
    },
  },
});

// 13/15 잊힌 사원 1층 (v5): 계단참(W −29, 1) → 기둥 회랑(웨이포인트 −7, 1) → 동쪽 통로 → 아래층 계단(E 28, 1)이 y 1~2 한 줄 — 그 축이 띠 (사원 층 바닥 ;raised 그대로).
//   (지하 납골당 2층을 위아래로 뒤집은 자리 — 심연의 문 1층과 같은 처리). 고리 끊기(검수표 「고리 5+2」): 제물 방 ↔ 태양 제단실 · 무너진 방 ↔ 필사실 통로를 막아
//   곁방 다섯(제물 방·태양 제단실(서고 입구)·무너진 방·필사실·아래 계단)이 회랑·동쪽 통로에서 한 번 들어갔다 나오는 막다른 방 (가지 간 추가 연결 0).
//   기둥 회랑 = 웨이포인트 뒤 북벽 향로 계단(랜드마크 · 검수표 「기둥 회랑 중심에」, 태양 제단실에서 옮김) + 남벽 사원 기둥 열 (「기둥 회랑」 — 회랑 폭 9칸이라 축 양옆 열주는 벽 2칸 안 →
//   뒤 칸이 남는다 · 심연의 문 1층 혼등 회랑과 같은 판단 · 북벽은 향로 계단과 곁방 통로 둘로 끊겨 열 자리 없음) · 1×1 바위 기둥 열 개(낱개)는 뺐다.
//   태양 제단실(서고 입구) = 그을린 사암 바닥 + 향 재 무늬 (좁은 방 가운데로 서고 입구 띠가 지나 열·묶음 자리 없음) · 제물 방 = 항아리·석상 머리 묶음 + 핏자국 · 무너진 방 = 북벽 무너진 기둥 열 + 뼈·해골 묶음 ·
//   필사실 = 북벽 책장 줄(빈틈 없이) + 필사 구석 세트 · 아래 계단(촛불 방 자리) = 향로 받침 묶음 · 계단참 = 항아리 하나.
//   향로 받침·태양 원판·붕대·항아리 산발(6·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.temple1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a2-broken-urns"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: {
        feature: "prop:a2-landmark-temple-stair-censer", featureAt: [-6.5, 4.4],
        row: [{ name: "temple-column", side: "s" }],   // 북벽은 향로 계단·곁방 통로 둘로 끊겨 기둥 열 자리가 없다
        decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles", "a2-decal-buried-road"], dn: 3,
      },
      c: { props: ["a2-broken-urns", "a2-buried-statue-head", "desert-bones"], clusters: 1, decals: ["a1-decal-blood-pool"], dn: 2 },
      d: { decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles"], dn: 2 },
      e: { row: { name: "broken-column", side: "n" }, props: ["desert-bones", "a2-waving-skeleton", "a2-adjunct-bandage-bundle"], clusters: 1, decals: ["a2-decal-broken-tile", "a2-decal-dry-crack"], dn: 2 },
      f: { row: { name: "bookshelf", side: "n", contiguous: true, step: 1.6, min: 2, minLine: 4 }, sets: ["a2_scribe_corner"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      g: { props: ["a2-adjunct-censer-base", "a2-adjunct-sun-disc-plaque"], clusters: 1, decals: ["a2-decal-incense-ash"], dn: 1 },
    },
  },
  rocks: [],
  zones: Object.assign({}, module.exports.temple1.zones, {
    d: "a2-scorched-sandstone-floor 1/0.96/0.9 태양 제단실",   // 바탕(사원 바닥)과 색 차이 0.1이라 띠 곁 패치가 깔렸다 — 사원 3층 제단실과 같은 그을린 사암
  }),
  paths: module.exports.temple1.paths.filter((p) => !["-9,-10", "0,14"].includes(p.pts[0].join(","))),
  places: module.exports.temple1.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "기둥 회랑", c: "제물 방", d: "태양 제단실", e: "무너진 방", f: "필사실", g: "아래 계단" }[p.z] || p.name, note: p.z === "b" ? "웨이포인트 · 남벽 사원 기둥 열과 향로 계단" : p.z === "d" ? "잊힌 서고 입구" : "" })),   // 납골당 2층 자리 이름을 그대로 물려받았었다
});

// 14/15 잊힌 사원 2층 (v5 · 쌍둥이 문지기 보스 맵): 계단참(W −29, 1) → (남쪽 기둥 회랑 | 북쪽 막사 굴·갈림 방) → 문지기의 전당 → 아래층 계단(E 28, 1). 띠 = 입구→남쪽 기둥 회랑→전당→출구 골격 한 줄.
//   자리·출현 구역은 specs/overrides.cjs temple2 (10-30 I06 「접근 두 갈래」 그대로 — 두 접근이 전당에서 합류하는 것은 설계 의도라 고리로 두되 가지 간 추가 연결 50% 이하).
//   1×1 바위 기둥(회랑 여섯 · 전당 넷 — 낱개 기둥)은 overrides.cjs에서 뺐다.
//   문지기의 전당 = 사자 쌍 계단 문(랜드마크 · 손으로 고른 자리를 v5 특징으로 · 같은 자리 · 북벽 — 두 문지기는 그 앞, maps.csv fixed 그대로 · 옮기지 않음) + 축 양옆 사원 기둥 열주 ·
//   띠 북쪽 밝은 그을린 사암 / 남쪽 어두운 사암 (구역 바닥이 바탕과 같은 사원 바닥이라 띠가 안 보였다). 문지기 세트(사원 문 아치·낱개 기둥·석상 머리 — 같은 공간 특징 둘)와 사자 문 세트 양옆 기둥(열주와 섞임)은 뺐다.
//   기둥 회랑(남쪽 접근 · 골격) = 남벽 사원 기둥 열 · 막사 굴 = 뱀 굴 세트 · 갈림 방 = 북벽 바람 비석 열 · 계단참·아래 계단 = 소품 하나.
Object.assign(module.exports.temple2, {
  v5: {
    outdoor: false,
    via: [[-8, -6]],   // 띠는 남쪽 기둥 회랑으로 (두 접근 길이가 같다 — 남쪽을 골격으로 두면 북쪽 막사 굴·갈림 방이 가지 둘이라 추가 연결 1 ≤ 50% · 북쪽이 골격이면 회랑 하나가 가지라 0 허용)
    dress: {
      a: { props: ["a2-broken-urns"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: { row: [{ name: "temple-column", side: "s" }], decals: ["a2-decal-buried-road", "a2-decal-broken-tiles"], dn: 2 },   // 북벽 열은 3.5칸 기둥이 벽에 붙어 6칸 폭 회랑의 북쪽 반을 막았다
      c: { sets: ["a2_serpent_den"], props: ["desert-bones"], clusters: 1, decals: ["a2-decal-snake-trail"], dn: 2 },
      d: { row: { name: "wind-stele", side: "n", min: 2, minLine: 4 }, decals: ["a2-decal-incense-ash"], dn: 1 },
      e: {
        feature: "set:a2_lm_lion_gate", featureAt: [14.5, 9.3], featureDrop: ["temple-column"],   // 세트 양옆 기둥은 열주와 한 무리로 섞여 산발로 셌다
        colonnade: { name: "temple-column", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[6.5, 1.5], [22.5, 1.5]] },
        sides: { left: "e", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        decals: ["a2-decal-buried-road", "a2-decal-broken-tiles", "a2-decal-incense-ash"], dn: 3,
      },
      g: { props: ["a2-adjunct-censer-base"], decals: ["a2-decal-broken-tiles"], dn: 1 },
    },
  },
  put: [],   // 문지기 세트·사자 쌍 계단 문 세트(손으로 고른 자리) → 사자 문은 v5 특징(같은 자리) · 문지기 세트는 뺌
  zones: Object.assign({}, module.exports.temple2.zones, {
    e: "a2-scorched-sandstone-floor 1/0.94/0.86 문지기의 전당",         // 바탕(사원 바닥)과 색 차이 0.06 → 띠 북쪽 그을린 사암
    h: "a2-scorched-sandstone-floor 0.78/0.7/0.62 문지기의 전당 남쪽",  // 띠 남쪽
  }),
});

// 15/15 잊힌 사원 3층 (v5): 계단참(W −29, 1 · 웨이포인트 −26, 3) → 회랑(y 1~2) → 태양 제단실 → 남쪽 통로 → 무너진 방 → 아래 계단(E 28, 1). 띠 = 그 골격 한 줄
//   (지하 납골당 1층을 위아래로 뒤집은 자리 — 납골당 1층·심연의 문 2층과 같은 처리). 고리 끊기(검수표 「고리 5+3」): 기둥 회랑 → 제단실 남쪽 통로 · 제물 방 → 제단실 북쪽 통로 ·
//   필사실 → 아래 계단 통로를 막아 세 곁방(기둥 회랑·제물 방·필사실)이 막다른 방 (기둥 회랑·제물 방은 회랑 x −13 갈림길에서, 필사실은 제단실 동북 통로에서 닿는다).
//   검수표 「빈 바닥 31% — 가장 효과가 큼」: 띠·두 톤 바닥·열주로 빈 바닥을 공간으로 나눈다.
//   태양 제단실 = 북벽 노래하는 모래 제단(랜드마크 · 원래 설계서 그대로) + 양옆 사원 기둥 한 쌍 · 띠 북쪽 밝은 그을린 사암 / 남쪽 어두운 사암 · 1×1 바위 기둥 넷(낱개)은 뺐다.
//   무너진 방(골격) = 북벽 무너진 기둥 열 + 뼈·붕대 묶음 · 필사실 = 북벽 책장 줄(빈틈 없이) + 필사 구석 세트 · 제물 방 = 무덤 제물 세트 + 핏자국 · 기둥 회랑 = 북벽 사원 기둥 열 · 계단참·아래 계단 = 바닥 무늬와 소품 하나.
//   태양 원판·타다 만 두루마리·향로 받침·붕대·사암 조각 산발(4·4·3·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.temple3, {
  story: ["사원 가장 깊은 층. 회랑 끝 태양 제단실을 지나 남쪽 무너진 방을 돌아야 성소 계단에 닿는다.", "(자리: 납골당 1층을 위아래로 뒤집음)"],
  v5: {
    outdoor: false,
    via: [[-3, 1], [7, 1]],   // 회랑(y 1~3)에서 제단실을 y 1 한 줄로 곧게 지나 남쪽 통로(y −1~1)로 — 대각 띠가 제단실을 비스듬히 가르지 않게
    dress: {
      a: { props: ["a2-broken-urns"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      b: { row: { name: "temple-column", side: "n", min: 2, minLine: 4 }, props: ["a2-adjunct-sun-disc-plaque", "a2-broken-urns"], clusters: 1, decals: ["a2-decal-incense-ash"], dn: 2 },
      c: { sets: ["a2_tomb_offering"], decals: ["a1-decal-blood-pool", "a2-decal-broken-tiles"], dn: 2 },
      d: {
        feature: "set:a2_lm_singing_altar", featureAt: [2.5, 5.4], featureDrop: ["a2-adjunct-sun-disc-plaque", "a2-adjunct-sandstone-fragments"],   // 세트 곁 조각 자리에 양옆 기둥
        pair: { name: "temple-column", around: "feature", d: 2.8 },   // 축 양옆 열주는 화로·제단 자리와 엇갈려 간격이 고르지 않았다(3쌍 중 하나 빠짐) — 제단 양옆 기둥 한 쌍
        sides: { left: "d", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        decals: ["a2-decal-incense-ash", "a2-decal-broken-tiles", "a2-decal-sand-drift"], dn: 3,
      },
      e: { row: { name: "broken-column", side: "n", min: 2, minLine: 4 }, props: ["desert-bones", "a2-adjunct-bandage-bundle", "a2-waving-skeleton"], clusters: 1, decals: ["a2-decal-broken-tile", "a2-decal-dry-crack"], dn: 2 },
      f: { row: { name: "bookshelf", side: "n", contiguous: true, step: 1.6, min: 2, minLine: 4 }, sets: ["a2_scribe_corner"], decals: ["a2-decal-broken-tiles"], dn: 1 },
      g: { decals: ["a2-decal-broken-tiles"], dn: 1 },
    },
  },
  rocks: [],
  paths: module.exports.temple3.paths.filter((p) => !["-7,-7", "-8,12", "23,13"].includes(p.pts[0].join(","))),
  places: module.exports.temple3.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "기둥 회랑", c: "제물 방", d: "태양 제단실", e: "무너진 방", f: "필사실", g: "아래 계단" }[p.z] || p.name, note: p.z === "d" ? "노래하는 모래 제단과 양옆 사원 기둥" : "" })),   // 납골당 1층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.temple3.zones, {
    h: "a2-scorched-sandstone-floor 0.8/0.74/0.66 태양 제단실 남쪽",   // 띠 남쪽 (북쪽 d와 다른 톤)
  }),
});
