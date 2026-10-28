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
    b: "sandstone-road 0.86/0.8/0.68 기둥 회랑",
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
      b: "forest-floor 0.8/0.92/0.66 오아시스 물가",
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
      depthgate: [5, 2], "npc:Caravan": [-14, 0], "npc:ShopKeeper": [-4, 4], "npc:Apothecary": [3, 4], "npc:Smith": [10, 1],
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
    base: "sand-floor 0.98/0.9/0.76",
    walls: { "#": "dune 1/1/1 모래 언덕", "%": "canyon 0.95/0.85/0.72 바위 능선" },
    zones: {
      a: "sand-floor 0.94/0.86/0.7 언덕 어귀",
      b: "dry-ground 0.86/0.74/0.6 짐승 무덤",
      c: "sand-floor 1/0.94/0.8 마른 오아시스 터",
      d: "dry-ground 0.9/0.78/0.62 버려진 야영지",
      e: "sand-cave-floor 0.84/0.76/0.64 전갈 굴 어귀",
      f: "sand-floor 0.9/0.82/0.68 모래 웅덩이",
      g: "sand-floor 0.96/0.9/0.76 동쪽 바람길",
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
    put: [["prop", "cave-entrance", 16.5, 14.8, 1]],
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
    walls: { "#": "canyon 1/1/1 협곡 절벽" },
    zones: {
      a: "dry-ground 0.8/0.7/0.58 협곡 입구",
      b: "sand-floor 0.9/0.8/0.66 갈비뼈 고개",
      c: "dry-ground 0.94/0.82/0.68 거상의 분지",
      d: "well-floor 0.8/0.74/0.64 마른 우물 터",
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

  stormwaste: {
    size: [70, 50],
    title: "바람 무덤 사막",
    story: ["모래폭풍이 끊이지 않는 사막. 서쪽 바람 비석 들판에는 죽은 왕들의 이름이 새겨진 비석이 줄지어 섰다.", "가운데 묻힌 오아시스(웨이포인트), 북동쪽 왕들의 묘실 문, 남쪽 짐승 무덤과 모래에 묻힌 마을. 동쪽 모래길이 가라앉은 대로로."],
    base: "sand-floor 0.9/0.84/0.72",
    walls: { "#": "dune 0.92/0.88/0.8 모래 언덕" },
    zones: {
      a: "sand-floor 0.86/0.8/0.68 폭풍 어귀",
      b: "dry-ground 0.8/0.74/0.62 바람 비석 들판",
      c: "sand-floor 0.94/0.88/0.74 묻힌 오아시스",
      d: "tomb-floor 0.8/0.72/0.6 묘실 문 앞",
      e: "dry-ground 0.84/0.76/0.62 짐승 무덤",
      f: "sand-floor 0.88/0.84/0.74 모래에 묻힌 마을",
      g: "sand-floor 0.9/0.86/0.74 동쪽 모래길",
    },
    roads: { "=": "a2-broken-sandstone-road 0.92/0.88/0.78 모래에 묻힌 길", "-": "a2-caravan-road 0.82/0.76/0.66 샛길" },
    places: [
      E("a", "폭풍 어귀", -28, -3, 6, 5),
      R("b", "바람 비석 들판", -22, 4, -6, 14, { rough: 1.2, note: "왕들의 비석 줄" }),
      E("c", "묻힌 오아시스", 0, -4, 8, 6, { note: "웨이포인트" }),
      E("d", "묘실 문 앞", 13, 13, 8, 6, { note: "왕들의 묘실 입구" }),
      E("e", "짐승 무덤", -12, -15, 8, 5),
      E("f", "모래에 묻힌 마을", 14, -13, 8, 6),
      E("g", "동쪽 모래길", 28, 0, 5, 5),
    ],
    paths: [
      P([[-35, -3], [-28, -3], [-20, 0], [-10, -2], [0, -4], [8, 0], [16, 2], [22, 0], [28, 0], [34, 0]], 4, "=", 2),
      P([[-20, 0], [-15, 5]], 3, "-", 1), P([[4, 2], [8, 8], [12, 11]], 3, "-", 1), P([[-4, -8], [-10, -13]], 3, "-", 1), P([[10, -2], [14, -9]], 3, "-", 1), P([[-6, 10], [4, 14], [8, 14]], 3),
    ],
    rocks: [rock(-28, 10, 3, 4), rock(0, 10, 3, 2), rock(26, 12, 3, 3), rock(26, -11, 3, 3), rock(0, -16, 3, 2), rock(-26, -14, 3, 2)],
    gates: { W: [-34, -3], E: [33, 0] },
    holes: { kingtomb1: [14, 15] },
    waypoint: [1, -1],
    put: [
      ["prop", "tomb-door", 14.5, 17.8, 1], ["prop", "wind-stele", -18, 12.2], ["prop", "wind-stele", -13, 12.4, 1, 1], ["prop", "wind-stele", -18, 7.2, 1, 1],
      ["prop", "wind-stele", -13, 7.4], ["prop", "wind-stele", -8.5, 10.2], ["prop", "mp-house-ruin", 16, -11.4],
    ],
    dress: {
      a: { props: ["desert-rock", "desert-bones"], n: 5, decals: ["a2-decal-sand-ripples"], dn: 3 },
      b: { props: ["desert-bones", "desert-rock"], n: 4, decals: ["a2-decal-sand-drift", "a2-decal-bleached-bones"], dn: 4 },
      c: { sets: ["a2_oasis_ruin"], props: ["palm", "desert-rock"], n: 5, decals: ["a2-decal-dry-crack"], dn: 3 },
      d: { props: ["broken-column", "a2-broken-urns"], n: 5, decals: ["a2-decal-buried-road"], dn: 3 },
      e: { sets: ["a2_lm_wind_tomb", "a2_beast_grave"], props: ["desert-bones", "mp-beast-skull"], n: 5, decals: ["a2-decal-dry-blood", "a2-decal-bleached-bones"], dn: 4 },
      f: { props: ["a2-torn-awning", "a2-broken-urns", "mp-fence"], n: 6, decals: ["a2-decal-broken-tile", "a2-decal-broken-tiles"], dn: 3 },
      g: { props: ["desert-rock", "wind-stele"], n: 5, decals: ["a2-decal-sand-ripples"], dn: 2 },
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
      b: "sandstone-road 0.8/0.74/0.62 순례자의 방",
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
