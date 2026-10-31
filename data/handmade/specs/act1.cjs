// 액트 1 「무덤 왕국의 바깥」 장소 설계서 (10-28 맵 66장 전면 개편 · 기획서 38 F7). tools/build/handmade/compose.cjs가 설계도·배치표로 옮긴다.
// 좌표는 월드 칸 (가로 -w/2 ~ w/2-1 · 세로 -h/2+1 ~ h/2, 위가 북쪽). 장소 → 길 → 바위·담 → 기능 자리 → 꾸밈 순.
// 원칙(기획서 38 F7-3): 입구 마당 → 길목 → 광장(세트 2~3) → 샛길(랜드마크·보상) → 끝방. 웨이포인트는 맵 가운데 1/3. 길은 S/U자 척추.
// 피 묻은 황무지(wasteland)는 시안 설계도를 그대로 쓴다 (data/handmade/wasteland.txt — 손으로 그린 격자, 이 파일 밖).
"use strict";
const { E, R, P, L, rock, wall } = require("./kit.cjs");

// 액트 1 던전 공용 바닥·장식 (납골당 3층이 같은 팔레트를 나눠 쓴다 — 부록 C B안 「짝 맵 재사용」, 방 배치는 층마다 다르게)
const CRYPT = {
  base: "crypt-floor 0.84/0.82/0.8",
  walls: { "#": "crypt 1/1/1 납골당 벽" },
  zones: {
    a: "crypt-floor 0.7/0.68/0.66 계단참",
    b: "bone-floor 0.74/0.7/0.66 납골 회랑",
    c: "cellar-floor 0.7/0.66/0.62 촛불 예배실",
    d: "crypt-floor 0.94/0.92/0.88 중앙 납골당",
    e: "bone-floor 0.66/0.62/0.6 관 보관실",
    f: "cellar-floor 0.6/0.58/0.56 무너진 관실",
    g: "crypt-floor 0.76/0.76/0.74 아래 계단",
  },
};
const cryptDress = {
  a: { props: ["crypt-candlestand", "crypt-bone-urn"], n: 3 },
  b: { sets: ["a1_lm_ossuary"], props: ["crypt-sarcophagus", "crypt-bone-urn", "a1-grave-markers", "cave-burial-shroud"], n: 8, decals: ["a1-decal-ossuary-urn-shards", "a1-decal-scattered-bones"], dn: 4 },
  c: { sets: ["hm_robbed_grave"], props: ["crypt-candlestand", "crypt-broken-coffin", "a1-open-coffin", "crypt-bone-urn"], n: 8, decals: ["a1-decal-pooled-wax", "a1-decal-blood-pool"], dn: 3 },
  d: { props: ["crypt-sarcophagus", "crypt-candlestand"], n: 6, decals: ["a1-decal-pooled-wax", "a1-decal-cracked-earth"], dn: 4 },
  e: { props: ["crypt-sarcophagus", "crypt-broken-coffin", "pit-bone-heap", "mp-iron-coffin"], n: 9, decals: ["a1-decal-scattered-bones"], dn: 3 },
  f: { props: ["crypt-broken-coffin", "pit-bone-heap", "a1-open-coffin", "mp-bone-pile"], n: 8, decals: ["a1-decal-cracked-earth"], dn: 3 },
  g: { props: ["crypt-candlestand"], n: 2 },
};
const CAVE = {
  base: "ash-cave-floor 0.8/0.76/0.72",
  walls: { "#": "ash-cave 1/1/1 굴 벽" },
};

module.exports = {
  // 결정 #22-A: 마을도 설계도로 재건 (36×24 예외 · #20-A). 마을 도착 자리(config townArrival 0/-1.6)는 네 마을이 같이 쓴다 → 광장 남쪽 끝
  town: {
    size: [36, 24],
    title: "잿불 야영지",
    story: [
      "살아 있는 자가 남은 마지막 야영지. 목책 안 잿불 광장을 천막 줄(북)·카라반 마당(서)·대장간(동)이 둘러싼다.",
      "남문 길이 피 묻은 황무지로 나가는 문. 돌아오면 광장 남쪽 끝(도착 자리)에 선다.",
    ],
    base: "ash-camp-floor 0.82/0.78/0.72",
    walls: { "#": "a1-palisade 1/1/1 목책" },
    zones: {
      a: "ash-camp-floor 0.94/0.88/0.78 잿불 광장",
      b: "forest-floor 0.7/0.72/0.64 천막 줄",
      c: "a1-mud-floor 0.84/0.8/0.74 카라반 마당",
      d: "execution-floor 0.78/0.74/0.7 대장간",
      e: "a1-mud-floor 0.9/0.86/0.8 남문 길",
    },
    roads: { "=": "a1-cart-road 0.96/0.92/0.86 야영지 큰길" },
    places: [
      E("a", "잿불 광장", 0, 1, 8, 5, { torch: false }),
      R("b", "천막 줄", -15, 6, 14, 10, { rough: 0.6, torch: false }),
      E("c", "카라반 마당", -12, -1, 5, 5, { torch: false }),
      E("d", "대장간", 11, -1, 5, 5, { torch: false }),
      R("e", "남문 길", -4, -10, 4, -5, { rough: 0.6, torch: false }),
    ],
    paths: [P([[0, -11], [0, -1]], 4, "=", 2), P([[-15, -1], [14, -1]], 3, "=", 1), P([[0, 4], [0, 7]], 3)],
    gates: { G: [0, -10] },
    waypoint: [-6, 2],
    torches: [[-4, 1], [3, 1], [-12, 3], [12, -4], [-2, -8], [1, -8], [-8, 7], [6, 7]],
    extra: {
      // townboard: 10-29 마을 게시판 자리(maps.csv extra townboard@-1.5/3.5) — compose가 지우지 않게 설계서에도
      depthgate: [5, 2], townboard: [-2, 3], "npc:ShopKeeper": [-4, 4], "npc:Elder": [3, 5], "npc:Smith": [10, 1],
      "npc:Merchant": [-9, 2], "npc:Stash": [2, -3], "npc:Caravan": [-14, 0],
    },
    put: [
      ["prop", "camp-brazier", 0.5, 2.2, 1.15], ["decal", "a1-decal-ash-campfire", 0.5, 1.8, 1.3],
      ["prop", "camp-tent", -11, 8.4], ["prop", "camp-tent", -3.5, 8.8, 0.9, 1], ["prop", "camp-tent", 9.5, 8.4, 1, 1],
      ["prop", "camp-cart", -14.5, -4.6], ["prop", "camp-weapon-rack", 13.6, 1.6],
      ["prop", "a1-landmark-ruined-gate", 0.5, -10.6, 1, 0, "ok=cliff"], ["prop", "a1-adjunct-extinguished-brazier-base", 3.4, -8.4, 1, 0, "ok=gate"], ["decal", "a1-decal-broad-cold-ash", -2.5, 0.2, 1],
    ],
    dress: {
      a: { props: ["camp-firewood", "mp-tripod"], n: 2 },
      b: { props: ["camp-firewood", "cellar-rotten-barrel", "camp-weapon-rack"], n: 5, decals: ["a1-decal-cart-tracks"], dn: 2 },
      c: { props: ["cellar-rotten-barrel", "camp-firewood", "mp-tripod"], n: 3, decals: ["a1-decal-cart-tracks"], dn: 2 },
      d: { props: ["camp-firewood", "cellar-rotten-barrel", "mp-cauldron-fire"], n: 3, decals: ["a1-decal-ash-campfire"], dn: 1 },
      e: { props: ["mp-fence", "mp-barricade", "mp-signpost"], n: 4, decals: ["a1-decal-cart-tracks"], dn: 2 },
    },
  },

  rotmarsh: {
    size: [70, 50],
    title: "썩은 갈대 늪",
    story: [
      "썩은 갈대 사이로 거품이 오른다. 야영지에서 내려온 둑길은 늪 한가운데 썩은 나무다리 교차로에서 갈라진다.",
      "북쪽은 물에 잠긴 사당과 무너진 종탑, 남쪽은 습격당한 수레 행렬과 지하실이 가라앉은 농가. 둑길은 동쪽 형장으로 이어진다.",
    ],
    base: "marsh-floor 0.84/0.9/0.74",
    walls: { "#": "reed 1/1/1 갈대 숲", "%": "a1-ruinwall 0.9/0.9/0.88 무너진 담" },
    zones: {
      a: "a1-dead-grass-floor 0.86/0.92/0.78 늪 어귀 (둑길이 늪으로 내려서는 곳)",
      b: "forest-floor 0.62/0.72/0.66 가라앉은 사당 (이끼 낀 물가)",
      c: "a1-mud-floor 0.84/0.82/0.72 썩은 나무다리 교차로 (밟힌 진흙)",
      d: "a1-mud-floor 0.78/0.72/0.66 습격당한 수레 행렬",
      e: "bone-floor 0.74/0.74/0.68 무너진 종탑 묘지",
      f: "execution-floor 0.74/0.74/0.66 가라앉은 농가 마당",
      g: "a1-wet-gravel-floor 0.9/0.96/0.88 동쪽 둑길",
    },
    roads: { "=": "a1-cart-road 0.9/0.86/0.78 둑길 (바퀴 자국 난 흙길)", "-": "a1-cart-road 0.7/0.68/0.62 샛길" },
    places: [
      E("a", "늪 어귀", -27, 0, 6, 5),
      E("b", "가라앉은 사당", -17, 13, 9, 6, { note: "썩은 우물 사당 · 도굴된 무덤" }),
      E("c", "썩은 나무다리 교차로", -2, 3, 8, 6, { note: "웨이포인트 · 개울 난파 수레" }),
      E("d", "습격당한 수레 행렬", -14, -13, 9, 6, { note: "매복 야영 · 숨은 야영" }),
      E("e", "무너진 종탑 묘지", 13, 14, 10, 7, { note: "떨어진 종 · 까마귀 묘지" }),
      E("f", "가라앉은 농가", 14, -13, 9, 6, { note: "가라앉은 지하실 입구" }),
      E("g", "동쪽 둑길", 27, 2, 6, 5),
    ],
    paths: [
      P([[-35, 0], [-27, 0], [-19, -3], [-9, 1], [-2, 3], [6, 0], [14, 4], [21, 2], [27, 2], [34, 2]], 4, "=", 2),
      P([[-26, 3], [-22, 9], [-17, 12]], 3, "-", 1),
      P([[0, 7], [6, 12], [12, 13]], 3, "-", 1),
      P([[-4, -1], [-9, -7], [-14, -12]], 3, "-", 1),
      P([[21, 1], [18, -6], [14, -11]], 3, "-", 1),
      P([[-7, -14], [0, -17], [7, -14]], 3),
      P([[-9, 16], [-1, 19], [5, 17]], 3),
    ],
    rocks: [
      rock(-6, -5, 2.5, 1.5), rock(6, 7, 2, 1.6), rock(24, 11, 3, 2), rock(-25, -10, 3, 2),
      rock(-30, 12, 2, 3), rock(30, -12, 2.5, 2.5), rock(3, -8, 2, 1.5),
      wall([[7, -8], [7, -18]], "%", [[7, -12, 1.6]]),
      wall([[7, -8], [21, -8]], "%", [[17, -8, 1.8]]),
    ],
    gates: { W: [-34, 0], E: [33, 2] },
    holes: { cellar1: [16, -14] },
    waypoint: [-3, 6],
    put: [["prop", "mp-house-ruin", 13, -12.6, 1, 0]],
    dress: {
      a: { sets: ["hm_last_guard"], props: ["marsh-reeds", "marsh-rotten-log", "waste-dry-shrub"], n: 7, decals: ["a1-decal-dead-grass", "a1-decal-cart-tracks"], dn: 4 },
      b: { sets: ["a1_marsh_shrine", "hm_robbed_grave"], props: ["marsh-reeds", "mp-grave-cross", "mp-dead-tree", "marsh-pool"], n: 10, decals: ["a1-decal-dead-grass", "a1-decal-scattered-bones"], dn: 5 },
      c: { sets: ["hm_creek_wreck"], props: ["marsh-pool", "marsh-reeds", "marsh-rotten-log"], n: 8, decals: ["a1-decal-cart-tracks", "a1-decal-rotting-reed-puddle", "a1-decal-blood-pool"], dn: 5 },
      d: { sets: ["a1_ambush_camp", "hm_hidden_camp"], props: ["marsh-cartwheel", "cellar-rotten-barrel", "waste-broken-spears", "marsh-reeds"], n: 8, decals: ["a1-decal-broad-cold-ash", "a1-decal-shield-fragments", "a1-decal-blood-pool"], dn: 4 },
      e: { sets: ["a1_fallen_belfry", "a1_graveyard"], props: ["mp-grave-tall", "mp-grave-slab", "mp-dead-tree", "a1-grave-markers"], n: 9, decals: ["a1-decal-collapsed-grave-earth", "a1-decal-scattered-bones"], dn: 4 },
      f: { sets: ["hm_burnt_farm"], props: ["mp-fence", "cellar-rotten-barrel", "marsh-reeds", "mp-dead-tree"], n: 8, decals: ["a1-decal-dead-grass"], dn: 3 },
      g: { sets: ["a1_lm_watchtower"], props: ["marsh-reeds", "waste-dead-tree", "marsh-rotten-log"], n: 6, decals: ["a1-decal-rotting-reed-puddle", "a1-decal-dead-grass"], dn: 3 },
    },
  },

  execution: {
    size: [70, 50],
    title: "무너진 형장",
    story: [
      "여왕의 이름으로 매단 자들이 아직도 형틀 곁을 서성인다. 옛 돌길은 무너진 담으로 둘러친 처형 광장을 가로지른다.",
      "광장 북쪽은 머리 없는 왕의 쉼터, 남쪽은 죄수 우리. 동쪽 묘지와 뼈 구덩이를 지나 교수대 숲으로.",
    ],
    base: "execution-floor 0.86/0.84/0.8",
    walls: { "#": "a1-waste 0.92/0.88/0.86 바위 언덕", "%": "a1-ruinwall 0.92/0.9/0.88 형장 담" },
    zones: {
      a: "a1-scorched-floor 0.82/0.78/0.74 형장 바깥 길",
      b: "execution-floor 0.76/0.68/0.64 처형 광장 (피에 젖은 돌바닥)",
      c: "forest-floor 0.6/0.62/0.6 왕의 쉼터 (이끼)",
      d: "a1-bonedust-floor 0.86/0.82/0.76 죄수 우리",
      e: "marsh-floor 0.7/0.72/0.6 까마귀 묘지",
      f: "a1-bonedust-floor 0.78/0.74/0.68 뼈 구덩이 어귀",
      g: "a1-mud-floor 0.86/0.82/0.76 동문 길",
    },
    roads: { "=": "a1-broken-stone-road 0.94/0.92/0.88 옛 돌길", "-": "a1-cart-road 0.78/0.74/0.68 샛길" },
    places: [
      E("a", "형장 바깥 길", -28, -2, 6, 5),
      R("b", "처형 광장", -19, -10, 1, 8, { rough: 1.2, note: "담으로 둘러친 광장 · 처형대 · 웨이포인트" }),
      E("c", "머리 없는 왕의 쉼터", 7, 15, 9, 6),
      R("d", "죄수 우리", -12, -21, 0, -14, { rough: 1 }),
      E("e", "까마귀 묘지", 23, 13, 8, 6),
      E("f", "뼈 구덩이 어귀", 19, -14, 8, 6, { note: "뼈 구덩이 입구" }),
      E("g", "동문 길", 27, 1, 6, 5),
    ],
    paths: [
      P([[-35, -2], [-28, -2], [-19, -1], [-9, 0], [0, 3], [9, 0], [18, -2], [27, 1], [34, 1]], 4, "=", 2),
      P([[-8, 7], [-2, 11], [4, 14]], 3, "-", 1),
      P([[14, 15], [19, 14]], 3, "-", 1),
      P([[-7, -9], [-6, -14]], 3, "-", 1),
      P([[18, -2], [19, -9]], 3, "-", 1),
      P([[0, -17], [11, -15]], 3),
      P([[25, 5], [24, 8]], 3),
    ],
    rocks: [
      wall([[-17, -8], [-17, 6]], "%", [[-17, -1, 2.2], [-17, 4, 1]]),
      wall([[-1, -8], [-1, 6]], "%", [[-1, 2, 2.4], [-1, -5, 1]]),
      wall([[-17, 6], [-1, 6]], "%", [[-7, 6, 2.2], [-12, 6, 1]]),
      wall([[-17, -8], [-1, -8]], "%", [[-6.5, -8, 2.2], [-13, -8, 1]]),
      rock(-24, -12, 3, 2), rock(-28, 10, 3, 3), rock(10, -8, 2, 1.5), rock(29, -10, 3, 2), rock(15, 6, 2, 1.5), rock(-6, 18, 3, 2),
    ],
    gates: { W: [-34, -2], E: [33, 1] },
    holes: { pit1: [21, -16] },
    waypoint: [-6, -4],
    dress: {
      a: { props: ["waste-broken-spears", "mp-barricade", "waste-dry-shrub", "execution-broken-column"], n: 6, decals: ["a1-decal-cart-tracks", "a1-decal-blood-pool"], dn: 3 },
      b: { sets: ["a1_execution_square"], props: ["execution-pillory", "execution-chain-pillar", "a1-skull-banner", "waste-skull-pile", "mp-stake-spikes"], n: 10, decals: ["a1-decal-dragged-blood-smear", "a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 6 },
      c: { sets: ["a1_kings_rest"], props: ["execution-broken-column", "mp-ruin-wall", "a1-pot-helmet-skull", "mp-dead-tree"], n: 8, decals: ["a1-decal-cracked-earth"], dn: 3 },
      d: { sets: ["a1_lm_scaffold"], props: ["mp-cage-small", "a1-chained-stake", "mp-stake-spikes", "mp-cage-hanging", "waste-skull-pile"], n: 8, decals: ["a1-decal-chain-drag-marks", "a1-decal-blood-pool"], dn: 4 },
      e: { sets: ["a1_graveyard", "hm_robbed_grave"], props: ["mp-grave-tall", "mp-grave-cross", "forest-raven-stump"], n: 6, decals: ["a1-decal-collapsed-grave-earth", "a1-decal-dead-grass"], dn: 3 },
      f: { props: ["pit-bone-heap", "pit-skull-tower", "waste-skull-pile", "mp-bone-pile"], n: 7, decals: ["a1-decal-scattered-bones"], dn: 3 },
      g: { sets: ["hm_watch_post"], props: ["waste-dead-tree", "waste-dry-shrub", "mp-signpost"], n: 5, decals: ["a1-decal-cart-tracks"], dn: 2 },
    },
  },

  gallows: {
    size: [70, 50],
    title: "교수대 숲",
    story: [
      "바람이 불 때마다 빈 밧줄이 삐걱인다. 숲길은 교수대 언덕 아래 까마귀 숲길에서 갈라진다.",
      "북쪽 피의 제단에서는 사제가 의식을 기다리고, 동쪽 처형장에서는 망나니가 길을 막는다. 남쪽 골짜기에 목매단 동굴.",
    ],
    base: "forest-floor 0.78/0.82/0.76",
    walls: { "#": "treeline 1/1/1 죽은 나무 숲", "%": "a1-ruinwall 0.86/0.84/0.82 무너진 담" },
    zones: {
      a: "forest-floor 0.7/0.76/0.68 숲 어귀",
      b: "a1-scorched-floor 0.76/0.72/0.68 교수대 언덕",
      c: "a1-dead-grass-floor 0.74/0.8/0.7 까마귀 숲길",
      d: "bone-floor 0.66/0.56/0.54 피의 제단",
      e: "execution-floor 0.7/0.64/0.6 망나니의 처형장",
      f: "a1-mud-floor 0.68/0.68/0.64 목매단 동굴 어귀",
      g: "forest-floor 0.84/0.88/0.8 동쪽 숲길",
    },
    roads: { "=": "a1-cart-road 0.8/0.76/0.68 숲길", "-": "a1-cart-road 0.64/0.62/0.58 샛길" },
    places: [
      E("a", "숲 어귀", -28, 2, 6, 5),
      E("b", "교수대 언덕", -13, 12, 9, 6),
      E("c", "까마귀 숲길", -8, -7, 8, 6, { note: "웨이포인트 · 숨은 야영" }),
      E("d", "피의 제단", 8, 15, 8, 6, { note: "피의 사제 의식 자리" }),
      E("e", "망나니의 처형장", 14, -1, 9, 7, { note: "망나니가 동쪽 길을 막는다" }),
      E("f", "목매단 동굴 어귀", 15, -17, 7, 5),
      E("g", "동쪽 숲길", 28, 4, 5, 5),
    ],
    paths: [
      P([[-35, 2], [-28, 2], [-19, -3], [-9, -5], [0, -3], [7, -1], [14, -1], [21, 1], [28, 4], [34, 4]], 4, "=", 2),
      P([[-26, 5], [-20, 10], [-15, 12]], 3, "-", 1),
      P([[-6, 13], [0, 15], [4, 15]], 3, "-", 1),
      P([[9, 10], [11, 6]], 3, "-", 1),
      P([[14, -8], [15, -13]], 3, "-", 1),
      P([[-4, -12], [4, -16], [9, -17]], 3),
    ],
    rocks: [rock(-20, -13, 3, 2.5), rock(-30, 13, 2.5, 3), rock(0, 6, 2.5, 2), rock(25, 13, 3, 3), rock(27, -10, 3, 3), rock(-2, -20, 3, 1.5), rock(-24, 18, 3, 2)],
    gates: { W: [-34, 2], E: [33, 4] },
    holes: { cave: [17, -18] },
    waypoint: [-8, -4],
    fixed: { headsman: [15, -2] },
    extra: { "altar:blood_altar": [9, 16] },
    put: [["set", "boss_headsman", 15.5, -1.5]],
    dress: {
      a: { props: ["forest-dead-tree", "waste-dry-shrub", "forest-raven-stump"], n: 6, decals: ["a1-decal-dead-grass"], dn: 3 },
      b: { sets: ["a1_gallows_hill"], props: ["forest-hanging-rope", "forest-dead-tree", "mp-cage-hanging", "a1-crow-fence"], n: 8, decals: ["a1-decal-dead-grass", "a1-decal-scattered-bones"], dn: 4 },
      c: { sets: ["a1_lm_gallows_tree", "hm_hidden_camp"], props: ["forest-raven-stump", "forest-dead-tree", "waste-dead-tree"], n: 7, decals: ["a1-decal-rusted-arrow-bundle", "a1-decal-dead-grass"], dn: 3 },
      d: { sets: ["a1_bone_shrine"], props: ["a1-skull-banner", "a1-chained-stake", "waste-skull-pile"], n: 6, decals: ["a1-decal-dragged-blood-smear", "a1-decal-blood-pool"], dn: 4 },
      e: { props: ["a1-skull-banner", "mp-stake-spikes", "execution-pillory"], n: 5, decals: ["a1-decal-blood-pool"], dn: 3 },
      f: { props: ["forest-dead-tree", "forest-hanging-rope", "mp-bone-pile"], n: 6, decals: ["a1-decal-scattered-bones"], dn: 3 },
      g: { sets: ["a1_graveyard"], props: ["forest-dead-tree", "waste-dry-shrub"], n: 5, decals: ["a1-decal-dead-grass"], dn: 2 },
    },
  },

  crypt1: Object.assign({}, CRYPT, {
    size: [60, 40],
    title: "지하 납골당 1층",
    story: ["계단을 내려서면 곧은 회랑이 갈림길에서 북쪽 납골 회랑 · 남쪽 촛불 예배실로 갈라진다.", "기둥 넷이 받친 중앙 납골당(웨이포인트)을 지나, 관 보관실이나 무너진 관실을 돌아야 아래 계단에 닿는다."],
    places: [
      R("a", "계단참", -28, -3, -22, 3),
      R("b", "납골 회랑", -19, 5, -7, 13),
      R("c", "촛불 예배실", -19, -14, -8, -6),
      R("d", "중앙 납골당", -4, -6, 8, 6, { note: "웨이포인트 · 기둥 넷" }),
      R("e", "관 보관실", 11, 6, 23, 15),
      R("f", "무너진 관실", 11, -15, 23, -7),
      R("g", "아래 계단", 24, -3, 28, 3),
    ],
    paths: [
      P([[-30, 0], [-4, 0]], 3), P([[-13, 0], [-13, 5]], 3), P([[-13, 0], [-13, -6]], 3),
      L([8, 2], [17, 6]), L([8, -2], [17, -7]),
      P([[23, 10], [26, 10], [26, 3]], 3), P([[23, -11], [26, -11], [26, -3]], 3),
      P([[-7, 9], [2, 9], [2, 6]], 3), P([[-8, -10], [2, -10], [2, -6]], 3),
    ],
    rocks: [rock(-1, 3, 0.8, 0.8), rock(5, 3, 0.8, 0.8), rock(-1, -3, 0.8, 0.8), rock(5, -3, 0.8, 0.8), rock(-13, 9, 1.5, 1)],
    gates: { W: [-29, 0], E: [28, 0] },
    waypoint: [2, -1],
    dress: cryptDress,
  }),

  crypt2: Object.assign({}, CRYPT, {
    size: [60, 40],
    title: "지하 납골당 2층",
    story: ["기둥 열 개가 늘어선 긴 회랑. 북쪽으로 유물 곁방 둘, 남쪽 아래로 뼈가 쌓인 구덩이.", "회랑 끝 동쪽에서 무너진 방과 촛불 방이 고리로 이어진다."],
    places: [
      R("a", "위층 계단", -28, -3, -23, 3),
      R("b", "기둥 회랑", -20, -4, 10, 4, { rough: 0.4, note: "기둥 열 개" }),
      R("c", "유물 곁방", -19, 8, -9, 15),
      R("d", "석관 곁방", -4, 9, 6, 17),
      R("e", "뼈 쌓인 구덩이", -15, -17, 0, -8),
      R("f", "무너진 동쪽 방", 13, -13, 24, -4),
      R("g", "촛불 방", 14, 5, 24, 14),
    ],
    paths: [
      P([[-30, 0], [28, 0]], 3), P([[-14, 3], [-14, 8]], 3), P([[1, 3], [1, 9]], 3), P([[-7, -3], [-7, -8]], 3),
      P([[18, 0], [18, -4]], 3), P([[19, 0], [19, 5]], 3), P([[-9, 12], [-4, 12]], 3), P([[0, -12], [13, -10]], 3),
    ],
    rocks: [-16, -10, -4, 2, 8].flatMap((x) => [rock(x, 2.6, 0.7, 0.7), rock(x, -2.6, 0.7, 0.7)]),
    gates: { W: [-29, 0], E: [28, 0] },
    dress: Object.assign({}, cryptDress, {
      b: { props: ["crypt-candlestand", "crypt-bone-urn"], n: 6, decals: ["a1-decal-scattered-bones", "a1-decal-cracked-earth"], dn: 6 },
      e: { props: ["pit-bone-heap", "pit-skull-tower", "mp-bone-pile", "a1-open-coffin"], n: 10, decals: ["a1-decal-scattered-bones"], dn: 4 },
    }),
  }),

  crypt3: Object.assign({}, CRYPT, {
    size: [60, 40],
    title: "지하 납골당 3층",
    story: ["무너진 납골 동굴과 해골 병사 막사를 지나면 해골 대장의 전당.", "대장을 쓰러뜨려야 여왕의 무덤으로 내려가는 계단에 닿는다."],
    zones: Object.assign({}, CRYPT.zones, { e: "crypt-floor 0.78/0.7/0.66 해골 대장의 전당" }),
    places: [
      R("a", "계단참", -28, -3, -23, 3),
      E("b", "무너진 납골 동굴", -14, 9, 7, 5),
      E("c", "해골 병사 막사", -14, -9, 7, 5),
      R("d", "갈림 방", -6, -4, 2, 4),
      R("e", "해골 대장의 전당", 6, -9, 22, 9, { rough: 0.5, note: "해골 대장 · 기둥 넷" }),
      R("g", "여왕의 무덤 계단", 24, -2, 28, 2),
    ],
    paths: [
      P([[-30, 0], [-6, 0]], 3), P([[2, 0], [6, 0]], 4), P([[22, 0], [28, 0]], 3),
      P([[-20, 0], [-17, 5]], 3), P([[-20, 0], [-17, -5]], 3), P([[-8, 9], [-2, 4]], 3), P([[-8, -9], [-2, -4]], 3),
    ],
    rocks: [rock(9, 5.5, 0.9, 0.9), rock(9, -5.5, 0.9, 0.9), rock(20, 6.5, 0.9, 0.9), rock(20, -6.5, 0.9, 0.9)],
    gates: { W: [-29, 0], E: [28, 0] },
    waypoint: [-25, -2],   // 10-28 사용자: 보스 바로 앞 층에 웨이포인트 (입구 쪽 계단참 · 1·2층 건너뜀) — 등대 3층·심연의 문 3층이 remix로 같이 받는다
    fixed: { skelcaptain: [15, 0] },
    // 10-28 사용자: 보스 그림에 맞춰 보스 자리를 — 해골 벽감 기둥(액트 1 코덱스 랜드마크)을 대장 등 뒤 북쪽 벽에 (동쪽은 계단 길이라 비운다)
    put: [["set", "boss_skelcaptain", 15.5, 0.5], ["set", "a1_lm_ossuary", 15.5, 6.6]],
    dress: Object.assign({}, cryptDress, {
      b: { props: ["crypt-sarcophagus", "crypt-bone-urn", "a1-grave-markers", "cave-burial-shroud"], n: 8, decals: ["a1-decal-ossuary-urn-shards", "a1-decal-scattered-bones"], dn: 4 },
      c: { sets: ["hm_last_guard"], props: ["waste-broken-spears", "a1-abandoned-shields", "crypt-candlestand", "a1-skull-banner"], n: 8, decals: ["a1-decal-scattered-bones"], dn: 3 },
      e: { props: ["a1-skull-banner", "crypt-candlestand"], n: 4, decals: ["a1-decal-cracked-earth", "a1-decal-scattered-bones"], dn: 5 },
    }),
  }),

  queentomb: {
    size: [60, 40],
    title: "여왕의 무덤",
    story: ["무덤 문을 지나면 순장자들의 방과 시녀들의 방 — 둘 중 하나를 지나야 봉인된 문간에 닿는다 (호위 무리).", "문간 너머가 여왕의 안식처(아레나 27×21). 여왕은 석관 옥좌 앞에 선다. 동북 구석 문이 야영지로 돌아가는 길."],
    base: "queen-floor 0.84/0.8/0.8",
    walls: { "#": "crypt 0.92/0.86/0.86 무덤 벽" },
    zones: {
      a: "crypt-floor 0.7/0.66/0.66 무덤 문",
      b: "bone-floor 0.7/0.64/0.62 순장자들의 방",
      c: "cellar-floor 0.66/0.6/0.6 시녀들의 방",
      d: "crypt-floor 0.8/0.76/0.74 봉인된 문간",
      e: "queen-floor 1/0.94/0.94 여왕의 안식처",
    },
    places: [
      R("a", "무덤 문", -28, -3, -22, 3),
      R("b", "순장자들의 방", -22, 6, -11, 14),
      R("c", "시녀들의 방", -21, -14, -10, -6),
      R("d", "봉인된 문간", -8, -3, -2, 3),
      R("e", "여왕의 안식처", 1, -10, 27, 10, { rough: 0.5, note: "아레나 · 여왕 · 기둥 넷" }),
    ],
    paths: [
      P([[-30, 0], [-17, 0]], 3), P([[-17, 0], [-17, 6]], 3), P([[-15, 0], [-15, -6]], 3),
      P([[-11, 10], [-5, 10], [-5, 3]], 3), P([[-10, -10], [-5, -10], [-5, -3]], 3), P([[-2, 0], [1, 0]], 4),
    ],
    rocks: [rock(6, 6.5, 1, 1), rock(6, -6.5, 1, 1), rock(24, 7.5, 1, 1), rock(24, -7.5, 1, 1)],
    gates: { W: [-29, 0], E: [26, 8] },
    fixed: { gravequeen: [17, 0] },
    // 10-28 사용자: 보스 그림에 맞춰 보스 자리를 — 여왕 석관 제단(액트 1 코덱스 랜드마크)이 순장자들의 방에 있어 아레나가 비었다 → 여왕 등 뒤(동쪽)로. 출구는 동북 구석이라 북쪽은 비운다
    put: [["set", "boss_gravequeen", 17.5, 0.5], ["set", "a1_lm_queen_altar", 23.5, 0.5]],
    dress: {
      a: { props: ["crypt-candlestand", "queen-blood-banner"], n: 3 },
      b: { props: ["crypt-sarcophagus", "a1-open-coffin", "crypt-bone-urn", "pit-bone-heap"], n: 8, decals: ["a1-decal-pooled-wax", "a1-decal-scattered-bones"], dn: 3 },
      c: { props: ["crypt-broken-coffin", "crypt-candlestand", "cave-burial-shroud", "crypt-bone-urn"], n: 8, decals: ["a1-decal-blood-pool"], dn: 3 },
      d: { props: ["queen-great-candelabra"], n: 2 },
      e: { props: ["queen-blood-banner", "queen-great-candelabra", "crypt-bone-urn"], n: 6, decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 6 },
    },
    area: [-28, -16, -2, 16],
  },

  hollow: Object.assign({}, CAVE, {
    size: [60, 40],
    title: "굶주린 굴",
    story: ["황무지 시체 구덩이 바닥에서 이어지는 굴. 굶주린 것들이 갉아 놓은 길목이 둥지로 모인다.", "둥지 동남쪽 막힌 굴 끝에 봉인 상자와 되돌아가는 문."],
    zones: {
      a: "ash-cave-floor 0.7/0.66/0.62 굴 어귀",
      b: "bone-floor 0.7/0.64/0.6 갉아먹힌 길목",
      c: "a1-bonedust-floor 0.74/0.68/0.62 뼈 무더기 굴",
      d: "ash-cave-floor 0.66/0.6/0.56 굶주린 자들의 둥지",
      e: "bone-floor 0.6/0.54/0.5 해골 굴",
      f: "ash-cave-floor 0.56/0.5/0.48 막힌 굴 끝",
    },
    places: [
      E("a", "굴 어귀", -24, 0, 5, 4, { rough: 1.6 }),
      E("b", "갉아먹힌 길목", -12, 7, 6, 4, { rough: 1.6 }),
      E("c", "뼈 무더기 굴", -11, -9, 7, 5, { rough: 1.6 }),
      E("d", "굶주린 자들의 둥지", 5, 0, 9, 7, { rough: 1.6 }),
      E("e", "해골 굴", 7, 13, 6, 4, { rough: 1.6 }),
      E("f", "막힌 굴 끝", 21, -7, 6, 5, { rough: 1.6, note: "봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [
      P([[-30, 0], [-24, 0], [-15, 5], [-4, 3], [5, 0], [14, -4], [21, -7]], 3, undefined, undefined, { wobble: 1 }),
      P([[-22, -3], [-14, -8], [-4, -6]], 3, undefined, undefined, { wobble: 1 }),
      P([[2, 6], [6, 11]], 3, undefined, undefined, { wobble: 1 }),
    ],
    gates: { W: [-29, 0] },
    extra: { end: [21, -8], return: [24, -4] },
    dress: {
      a: { props: ["hollow-bone-pile", "hollow-gnawed-remains"], n: 4 },
      b: { props: ["hollow-gnawed-remains", "mp-bone-pile"], n: 5, decals: ["a1-decal-scattered-bones"], dn: 3 },
      c: { props: ["hollow-bone-pile", "pit-bone-heap", "mp-beast-skull"], n: 7, decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { sets: ["a1_lm_rib_arch", "hm_last_guard"], props: ["hollow-bone-pile", "hollow-gnawed-remains", "a1-pot-helmet-skull"], n: 8, decals: ["a1-decal-beast-footprints", "a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 5 },
      e: { props: ["mp-bone-pile", "hollow-gnawed-remains"], n: 5 },
      f: { props: ["hollow-bone-pile", "cave-stalactite"], n: 4, decals: ["a1-decal-blood-pool"], dn: 2 },
    },
  }),

  cellar1: {
    size: [60, 40],
    title: "가라앉은 지하실 1층",
    story: ["농가 아래 물이 스민 지하실. 술 창고와 곡물 창고 사이 좁은 물길 통로가 매복 길목이다.", "북·남쪽 고리길로 돌아가면 썩은 우물방 — 그 너머가 아래 계단."],
    base: "cellar-floor 0.82/0.8/0.76",
    walls: { "#": "crypt 0.9/0.86/0.8 지하실 벽" },
    zones: {
      a: "cellar-floor 0.7/0.68/0.64 무너진 계단",
      b: "cellar-floor 0.62/0.66/0.6 물 찬 술 창고",
      c: "crypt-floor 0.74/0.72/0.68 곡물 창고",
      d: "a1-wet-gravel-floor 0.7/0.76/0.66 물이 스민 통로",
      e: "cellar-floor 0.88/0.84/0.76 썩은 우물방",
      f: "cellar-floor 0.7/0.66/0.6 아래 계단참",
    },
    places: [
      R("a", "무너진 계단", -28, -3, -23, 3),
      R("b", "물 찬 술 창고", -20, 5, -6, 14),
      R("c", "곡물 창고", -20, -14, -8, -5),
      R("d", "물이 스민 통로", -4, -2, 10, 2, { rough: 0.3, note: "매복 길목" }),
      E("e", "썩은 우물방", 16, 0, 6, 6, { note: "랜드마크 우물" }),
      R("f", "아래 계단참", 23, -3, 28, 3),
    ],
    paths: [
      P([[-30, 0], [-4, 0]], 3), P([[-13, 0], [-13, 5]], 3), P([[-13, 0], [-13, -5]], 3), P([[-4, 0], [28, 0]], 3),
      P([[-6, 10], [16, 10], [16, 5]], 3), P([[-8, -10], [16, -10], [16, -5]], 3),
    ],
    gates: { W: [-29, 0], E: [28, 0] },
    put: [["prop", "a1-rotten-well", 16.5, 2.4, 1, 0]],
    dress: {
      a: { props: ["cellar-rotten-barrel"], n: 2 },
      b: { sets: ["a1_lm_barrel_shelf"], props: ["cellar-rotten-barrel", "cellar-broken-shelf"], n: 10, decals: ["a1-decal-rotting-reed-puddle", "a1-decal-cracked-earth"], dn: 3 },
      c: { props: ["cellar-broken-shelf", "cellar-rotten-barrel", "mp-tripod"], n: 9, decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { decals: ["a1-decal-blood-pool"], dn: 2 },
      e: { props: ["crypt-candlestand", "cellar-rotten-barrel"], n: 4, decals: ["a1-decal-cracked-earth"], dn: 2 },
      f: { props: ["cellar-rotten-barrel"], n: 2 },
    },
  },

  cellar2: {
    size: [60, 40],
    title: "가라앉은 지하실 2층",
    story: ["무너진 저장고와 썩은 물웅덩이 방을 지나면 썩은 사제 모르그의 제단실.", "제단실 남동쪽 구석에 되돌아가는 문."],
    base: "cellar-floor 0.78/0.76/0.72",
    walls: { "#": "crypt 0.86/0.82/0.78 지하실 벽" },
    zones: {
      a: "cellar-floor 0.7/0.68/0.64 계단참",
      b: "cellar-floor 0.66/0.62/0.58 무너진 저장고",
      c: "marsh-floor 0.56/0.62/0.5 썩은 물웅덩이 방",
      d: "crypt-floor 0.74/0.72/0.68 갈림 방",
      e: "bone-floor 0.7/0.62/0.6 썩은 사제의 제단실",
    },
    places: [
      R("a", "계단참", -28, -3, -23, 3),
      E("b", "무너진 저장고", -14, 8, 7, 5),
      E("c", "썩은 물웅덩이 방", -14, -8, 7, 5),
      R("d", "갈림 방", -6, -3, 4, 3),
      R("e", "썩은 사제의 제단실", 8, -11, 26, 11, { rough: 0.6, note: "모르그 · 봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [P([[-30, 0], [8, 0]], 3), P([[-19, 0], [-16, 4]], 3), P([[-19, 0], [-16, -4]], 3), P([[-8, 8], [-2, 3]], 3), P([[-8, -8], [-2, -3]], 3)],
    rocks: [rock(12, 6.5, 1, 1), rock(12, -6.5, 1, 1), rock(22, 8, 1, 1), rock(22, -8, 1, 1)],
    gates: { W: [-29, 0] },
    extra: { end: [19, 0], return: [24, -9] },
    put: [["prop", "a1-rotten-well", 23, 4, 1, 0]],
    dress: {
      a: { props: ["cellar-rotten-barrel"], n: 2 },
      b: { sets: ["a1_lm_barrel_shelf"], props: ["cellar-broken-shelf", "cellar-rotten-barrel"], n: 8, decals: ["a1-decal-cracked-earth"], dn: 2 },
      c: { props: ["marsh-reeds", "marsh-rotten-log", "cellar-rotten-barrel"], n: 7, decals: ["a1-decal-blood-pool"], dn: 3 },
      d: { props: ["crypt-candlestand"], n: 2 },
      e: { props: ["crypt-candlestand", "a1-skull-banner", "crypt-bone-urn", "cellar-rotten-barrel"], n: 8, decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 5 },
    },
  },

  pit1: Object.assign({}, CAVE, {
    size: [60, 40],
    title: "뼈 구덩이 1층",
    story: ["형장에서 버린 뼈가 쌓인 구덩이. 뼈 비탈을 내려가면 해골 탑이 선 광장.", "광장 북동쪽 매복 골짜기와 남쪽 고리길이 아래 계단에서 만난다."],
    base: "bone-floor 0.8/0.74/0.7",
    zones: {
      a: "ash-cave-floor 0.72/0.68/0.64 구덩이 어귀",
      b: "bone-floor 0.7/0.64/0.6 뼈 비탈",
      c: "a1-bonedust-floor 0.92/0.86/0.8 해골 탑 광장",
      d: "ash-cave-floor 0.62/0.58/0.56 매복 골짜기",
      e: "bone-floor 0.64/0.6/0.56 남쪽 고리길",
      f: "ash-cave-floor 0.7/0.66/0.62 아래 계단",
    },
    places: [
      E("a", "구덩이 어귀", -24, 0, 5, 4, { rough: 1.4 }),
      E("b", "뼈 비탈", -12, 6, 7, 5, { rough: 1.4 }),
      E("c", "해골 탑 광장", 0, -3, 9, 7, { rough: 1.2, note: "뼈 사당 세트" }),
      E("d", "매복 골짜기", 13, 9, 7, 5, { rough: 1.4 }),
      E("e", "남쪽 고리길", 14, -12, 6, 4, { rough: 1.4 }),
      E("f", "아래 계단", 23, 0, 5, 4, { rough: 1 }),
    ],
    paths: [
      P([[-30, 0], [-24, 0], [-14, 5], [-4, 1], [4, -2], [12, 4], [18, 2], [23, 0], [29, 0]], 3, undefined, undefined, { wobble: 1 }),
      P([[-20, -3], [-8, -12], [6, -12], [14, -12]], 3, undefined, undefined, { wobble: 1 }),
      P([[14, -12], [20, -4]], 3, undefined, undefined, { wobble: 1 }),
    ],
    gates: { W: [-29, 0], E: [28, 0] },
    dress: {
      a: { props: ["pit-bone-heap", "mp-bone-pile"], n: 4 },
      b: { props: ["pit-bone-heap", "mp-bone-pile", "waste-skull-pile"], n: 7, decals: ["a1-decal-scattered-bones"], dn: 3 },
      c: { sets: ["a1_bone_shrine"], props: ["pit-skull-tower", "pit-bone-heap", "a1-chained-stake"], n: 8, decals: ["a1-decal-scattered-bones", "a1-decal-blood-pool"], dn: 5 },
      d: { sets: ["a1_lm_pulley_crane"], props: ["pit-bone-heap", "mp-beast-skull", "waste-broken-spears"], n: 5, decals: ["a1-decal-chain-drag-marks", "a1-decal-scattered-bones"], dn: 2 },
      e: { props: ["pit-skull-tower", "mp-bone-pile"], n: 5 },
      f: { props: ["pit-bone-heap"], n: 2 },
    },
  }),

  pit2: Object.assign({}, CAVE, {
    size: [60, 40],
    title: "뼈 구덩이 2층",
    story: ["뼈 무더기 길과 북쪽 굴을 지나면 유물 지기 테오가 지키는 굴.", "굴 남동쪽에 되돌아가는 문."],
    base: "bone-floor 0.76/0.7/0.66",
    zones: {
      a: "ash-cave-floor 0.7/0.66/0.62 계단참",
      b: "bone-floor 0.68/0.62/0.58 뼈 무더기 길",
      c: "ash-cave-floor 0.62/0.58/0.56 북쪽 굴",
      d: "bone-floor 0.84/0.78/0.72 유물 지기의 굴",
    },
    places: [
      E("a", "계단참", -24, 0, 5, 4, { rough: 1.2 }),
      E("b", "뼈 무더기 길", -10, -8, 7, 5, { rough: 1.4 }),
      E("c", "북쪽 굴", -8, 9, 7, 5, { rough: 1.4 }),
      E("d", "유물 지기의 굴", 17, 0, 10, 9, { rough: 1.2, note: "유물 지기 · 봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [
      P([[-30, 0], [-24, 0], [-16, -5], [-6, -6], [4, -2], [10, 0], [17, 0]], 3, undefined, undefined, { wobble: 1 }),
      P([[-22, 3], [-12, 8], [-2, 8], [8, 4]], 3, undefined, undefined, { wobble: 1 }),
    ],
    rocks: [rock(12, 6, 1.2, 1), rock(12, -6, 1.2, 1), rock(23, 6, 1.2, 1)],
    gates: { W: [-29, 0] },
    extra: { end: [18, 0], return: [23, -6] },
    dress: {
      a: { props: ["pit-bone-heap"], n: 2 },
      b: { sets: ["a1_lm_pulley_crane"], props: ["pit-bone-heap", "mp-bone-pile", "waste-skull-pile"], n: 7, decals: ["a1-decal-chain-drag-marks", "a1-decal-scattered-bones"], dn: 3 },
      c: { sets: ["hm_robbed_grave"], props: ["pit-skull-tower", "mp-bone-pile"], n: 6, decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { props: ["pit-skull-tower", "crypt-bone-urn", "a1-skull-banner", "pit-bone-heap"], n: 9, decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 5 },
    },
  }),

  cave: Object.assign({}, CAVE, {
    size: [60, 40],
    title: "목매단 동굴",
    story: ["교수대 숲 남쪽 골짜기의 동굴. 수의 걸린 굴과 종유석 굴이 갈라졌다 다시 만난다.", "가장 깊은 막다른 굴에 망나니의 열쇠가 든 봉인 상자와 되돌아가는 문."],
    zones: {
      a: "ash-cave-floor 0.72/0.7/0.66 동굴 어귀",
      b: "a1-wet-gravel-floor 0.62/0.66/0.62 수의 걸린 굴",
      c: "ash-cave-floor 0.64/0.62/0.6 종유석 굴",
      d: "ash-cave-floor 0.74/0.7/0.66 박쥐 굴",
      e: "bone-floor 0.6/0.56/0.54 막다른 굴",
    },
    places: [
      E("a", "동굴 어귀", -24, 2, 5, 4, { rough: 1.4 }),
      E("b", "수의 걸린 굴", -10, 10, 7, 5, { rough: 1.4 }),
      E("c", "종유석 굴", -9, -6, 8, 6, { rough: 1.4 }),
      E("d", "박쥐 굴", 7, 4, 7, 6, { rough: 1.4 }),
      E("e", "막다른 굴", 20, -6, 7, 6, { rough: 1.4, note: "봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [
      P([[-30, 2], [-24, 2], [-16, 6], [-8, 8], [0, 6], [7, 4], [14, -2], [20, -6]], 3, undefined, undefined, { wobble: 1 }),
      P([[-20, 0], [-12, -5], [-2, -6], [10, -6], [14, -6]], 3, undefined, undefined, { wobble: 1 }),
    ],
    gates: { W: [-29, 2] },
    extra: { end: [21, -6], return: [24, -2] },
    dress: {
      a: { props: ["cave-stalactite"], n: 3 },
      b: { props: ["cave-burial-shroud", "forest-hanging-rope", "mp-bone-pile"], n: 8, decals: ["a1-decal-scattered-bones"], dn: 2 },
      c: { sets: ["a1_lm_corpse_pillar"], props: ["cave-stalactite", "pit-bone-heap"], n: 7, decals: ["a1-decal-dragged-blood-smear", "a1-decal-cracked-earth"], dn: 2 },
      d: { props: ["cave-stalactite", "cave-burial-shroud", "mp-beast-skull"], n: 7, decals: ["a1-decal-scattered-bones"], dn: 2 },
      e: { props: ["cave-burial-shroud", "crypt-bone-urn", "cave-stalactite"], n: 6, decals: ["a1-decal-blood-pool"], dn: 3 },
    },
  }),
};

// ───────── 10-31 맵 구성 v5 3단계 · 액트 1 적용 (사용자 「출시했으니 액트 1부터 순서대로」 · 액트 4와 같은 생성기·규칙 · docs/review/v5-modes-20261031.md 배정표) ─────────
//   v5 = 골격 띠 + 구역 재적합 + 역할 배치 (성소형) · keep = 바닥·길 글자·이음새 그대로 + 역할 배치만 (유황 늪형). 맵별 공간 구획 = docs/review/map-audit-20261031.md 그 맵 절.
//   ⚠ 이 파일의 맵은 액트 2~4가 remix로 자리(장소·길·바위·포털·웨이포인트·화로·extra)를 가져간다 — 여기서는 v5·구역 바닥·손으로 고른 자리(put)·꾸밈처럼
//     remix가 가져가지 않는 열만 바꾼다. 길(고리 끊기)·바위·장소 이름·웨이포인트 같은 자리 변경은 specs/overrides.cjs의 같은 id 줄 (compose가 그 맵에만 적용).
//   보스·포털·NPC·퀘스트 오브젝트·스포너 자리는 옮기지 않는다 (maps.csv 기능 열은 compose가 설계서 자리 그대로 다시 쓴다).

// 6/15 지하 납골당 1층 (v5): 계단참(W −29, 0) → 곧은 회랑(y 0) → 중앙 납골당(웨이포인트 2, −1) → 관 보관실 → 아래 계단(E 28, 0). 띠 = 그 골격 한 줄
//   (심연의 문 2층과 같은 자리 — 그 맵을 좌우로 뒤집기 전 원형). 고리 끊기(검수표 「고리 5+3」)·방 안 바위는 overrides.cjs crypt1.
//   중앙 납골당 = 웨이포인트 뒤 북벽 해골 벽감 기둥(랜드마크 · 납골 회랑에서 옮김 · 검수표 「중앙 납골당 중심에」) + 축 양옆 촛대 열주 · 띠 북쪽 밝은 무덤 판석 / 남쪽 어두운 판석
//   (바탕과 같은 납골당 바닥이라 띠가 안 보였다).
//   납골 회랑 = 북벽 열린 관 줄 + 뼈 단지 묶음 · 촛불 예배실 = 북벽 촛대 열 + 부서진 관 묶음 · 관 보관실(골격) = 북벽 석관 줄 + 뼈 묶음 · 무너진 관실 = 북벽 부서진 관 줄 + 뼈 무더기 ·
//   계단참·아래 계단 = 바닥 무늬와 소품 묶음 하나 (좁은 방이라 골격을 좁히지 않게).
Object.assign(module.exports.crypt1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["crypt-bone-urn", "a1-adjunct-collapsed-urn"], decals: ["a1-decal-pooled-wax"], dn: 1 },
      b: { row: { name: "a1-open-coffin", contiguous: true, min: 3, minLine: 4 }, props: ["crypt-bone-urn", "cave-burial-shroud", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-ossuary-urn-shards", "a1-decal-scattered-bones"], dn: 2 },
      c: { row: { name: "crypt-candlestand", side: "s", step: 2.4, min: 2, minLine: 4 }, props: ["crypt-broken-coffin", "a1-adjunct-collapsed-urn", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-pooled-wax", "a1-decal-blood-pool"], dn: 2 },
      d: {
        feature: "set:a1_lm_ossuary", featureAt: [2.5, 4.4], featureDrop: ["crypt-candlestand"],
        colonnade: { name: "crypt-candlestand", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[-1.5, 0.5], [8.5, 0.5]] },
        sides: { left: "d", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        decals: ["a1-decal-pooled-wax", "a1-decal-cracked-earth", "a1-decal-scattered-bones"], dn: 3,
      },
      e: { row: { name: "crypt-sarcophagus", min: 3, minLine: 4 }, props: ["pit-bone-heap", "mp-bone-pile", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      f: { row: { name: "crypt-broken-coffin", contiguous: true, min: 3, minLine: 4 }, props: ["pit-bone-heap", "hollow-bone-pile", "a1-abandoned-shields"], clusters: 1, decals: ["a1-decal-cracked-earth", "a1-decal-scattered-bones"], dn: 2 },
      g: { decals: ["a1-decal-pooled-wax"], dn: 1 },
    },
  },
  zones: Object.assign({}, module.exports.crypt1.zones, {
    d: "queen-floor 0.9/0.88/0.86 중앙 납골당",            // 바탕(납골당 바닥)과 같은 그림이라 띠가 안 보였다 — 띠 북쪽 밝은 무덤 판석
    h: "queen-floor 0.72/0.7/0.68 중앙 납골당 남쪽",       // 띠 남쪽 (북쪽 d와 다른 톤)
    g: "crypt-floor 0.66/0.64/0.62 아래 계단",              // 바탕과 색 차이 0.08이라 「같은 바닥」으로 보여 띠 곁 패치(마른 풀)가 깔렸다 — 한 톤 어둡게
  }),
});

// 7/15 지하 납골당 2층 (v5): 위층 계단(W −29, 0) → 기둥 회랑(y 0 한 줄) → 아래층 계단(E 28, 0). 띠 = 그 골격 한 줄 (자리·출현 구역은 overrides.cjs crypt2 — 10-30 I06 그대로).
//   다섯 곁방(유물 곁방·석관 곁방·뼈 쌓인 구덩이·무너진 동쪽 방·촛불 방)은 이미 회랑에서 한 번 들어갔다 나오는 막다른 방이라 고리 0 · 길 그대로.
//   기둥 회랑 = 설계도 1×1 바위 기둥 열 개(낱개 바위)를 남벽 부러진 돌기둥 열 + 북벽 뼈 선반 줄로 (「기둥 열 개가 늘어선 긴 회랑」 · 가운데 열주는 벽 2칸 안이라 뒤 칸이 남았다).
//   뼈 쌓인 구덩이 = 뼈 탑(특징 1 · 넓은 시험방 남벽 쪽) + 뼈 무더기 묶음 · 석관 곁방 = 북벽 석관 줄 · 촛불 방 = 북벽 촛대 열 · 무너진 동쪽 방 = 북벽 부서진 관 줄 ·
//   유물 곁방(좁은 시험방) = 방패·창 묶음 하나 · 계단참 = 소품 묶음.
Object.assign(module.exports.crypt2, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["crypt-bone-urn", "a1-adjunct-collapsed-urn"], decals: ["a1-decal-pooled-wax"], dn: 1 },
      b: {
        row: [{ name: "cellar-broken-shelf", side: "n", contiguous: true, min: 3, minLine: 4 }, { name: "execution-broken-column", side: "s" }],   // 북벽 뼈 선반 줄(벽 밀착) · 남벽 돌기둥 열 (가운데 열주는 벽 2칸 안이라 뒤 칸이 남았다 · 북벽 3칸 기둥은 띠 곁에 닿았다)
        decals: ["a1-decal-scattered-bones", "a1-decal-cracked-earth", "a1-decal-ossuary-urn-shards"], dn: 3,
      },
      c: { props: ["a1-abandoned-shields", "waste-broken-spears", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 1 },
      d: { row: { name: "crypt-sarcophagus", min: 3, minLine: 4 }, props: ["crypt-bone-urn", "cave-burial-shroud"], clusters: 1, decals: ["a1-decal-pooled-wax", "a1-decal-cracked-earth"], dn: 2 },
      e: { feature: "set:a1_bone_shrine", props: ["pit-bone-heap", "mp-bone-pile", "hollow-gnawed-remains"], clusters: 1, decals: ["a1-decal-scattered-bones", "a1-decal-blood-pool"], dn: 3 },
      f: { row: { name: "crypt-broken-coffin", contiguous: true, min: 3, minLine: 4 }, props: ["pit-bone-heap", "a1-open-coffin"], clusters: 1, decals: ["a1-decal-cracked-earth"], dn: 2 },
      g: { row: { name: "crypt-candlestand", side: "n", min: 2, minLine: 4 }, props: ["crypt-bone-urn", "a1-adjunct-collapsed-urn"], clusters: 1, decals: ["a1-decal-pooled-wax", "a1-decal-blood-pool"], dn: 2 },
    },
  },
  zones: Object.assign({}, module.exports.crypt2.zones, {
    g: "crypt-floor 0.66/0.64/0.62 촛불 방",          // 바탕과 색 차이 0.08이라 「같은 바닥」으로 보여 띠 곁 패치가 깔렸다 — 한 톤 어둡게
  }),
});

// 8/15 지하 납골당 3층 (v5 · 해골 대장 보스 층): 계단참(W −29, 0 · 웨이포인트 −25, −2) → 회랑(y 0) → 갈림 방 → 해골 대장의 전당 → 여왕의 무덤 계단(E 28, 0). 띠 = 그 골격 한 줄.
//   고리 끊기(검수표 「고리 3+2」 · 심연의 문 3층과 같은 자리)·전당 바위 기둥 넷은 overrides.cjs crypt3 — 무너진 납골 동굴·해골 병사 막사는 회랑 x −20 갈림길에서만 닿는 막다른 방.
//   둥근 두 굴(무너진 납골 동굴·막사, 검수표 「캡처로 확인」): 골격 밖이라 띠가 지나지 않고 두 굴 바닥(뼈 흙·벽돌)은 그대로 — 재적합은 띠 곁 칸만 바꾼다.
//   해골 대장의 전당 = 대장 등 뒤 북벽 해골 벽감 기둥(10-28 사용자 「보스 그림에 맞춰」 — 손으로 고른 자리를 v5 특징으로 · 같은 자리) + 축 양옆 촛대 열주 ·
//   띠 북쪽 밝은 돌길 / 남쪽 어두운 돌길. 대장은 그 앞(maps.csv fixed skelcaptain 15/0 그대로 · 옮기지 않음). 대장 세트(창·깃대·촛대 낱개)는 뺐다 — 낱개 기둥·특징 과밀.
//   무너진 납골 동굴 = 뼈 단지·수의 묶음 · 막사 = 마지막 파수꾼 세트(방패·창·통) · 갈림 방·계단참·무덤 계단 = 바닥 무늬.
Object.assign(module.exports.crypt3, {
  v5: {
    outdoor: false,
    dress: {
      a: { decals: ["a1-decal-pooled-wax"], dn: 1 },
      b: { props: ["crypt-bone-urn", "cave-burial-shroud", "a1-adjunct-collapsed-urn"], clusters: 1, decals: ["a1-decal-ossuary-urn-shards", "a1-decal-scattered-bones"], dn: 2 },
      c: { sets: ["hm_last_guard"], props: ["waste-broken-spears", "a1-abandoned-shields", "a1-pot-helmet-skull"], clusters: 2, decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { decals: ["a1-decal-cracked-earth", "a1-decal-scattered-bones"], dn: 2 },
      e: {
        feature: "set:a1_lm_ossuary", featureAt: [15.5, 6.6], featureDrop: ["crypt-candlestand"],
        colonnade: { name: "crypt-candlestand", step: 3, minPairs: 3, off: 2.5, tight: true, axis: [[6.5, 0.5], [22.5, 0.5]] },
        sides: { left: "e", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        decals: ["a1-decal-scattered-bones", "a1-decal-cracked-earth", "a1-decal-blood-pool"], dn: 3,
      },
      g: { decals: ["a1-decal-pooled-wax"], dn: 1 },
    },
  },
  zones: Object.assign({}, module.exports.crypt3.zones, {
    e: "execution-floor 0.84/0.8/0.76 해골 대장의 전당",        // 띠 북쪽 밝은 돌길 (바탕 납골당 바닥과 다른 그림)
    h: "execution-floor 0.66/0.62/0.6 해골 대장의 전당 남쪽",   // 띠 남쪽
    g: "crypt-floor 0.66/0.64/0.62 여왕의 무덤 계단",            // 바탕과 색 차이 0.08 → 띠 곁 패치가 깔렸다 — 한 톤 어둡게
  }),
  put: [],   // 대장 세트(창 둘·깃대·촛대 둘·방패)와 벽감 기둥 세트 줄 → 벽감 기둥은 v5 특징(같은 자리)으로
});

// 9/15 여왕의 무덤 (v5 · 보스방): 대사제의 성소(표본)·군주의 옥좌가 이 자리를 뒤집어 쓴다 — 같은 규칙으로. 무덤 문(W −29, 0) → 순장자들의 방 → 봉인된 문간 →
//   여왕의 안식처: 홀 입구(서쪽 문, y 0)에서 동쪽 여왕 석관 제단까지 곧은 축(신랑) = 띠 · 양옆 피 깃발 열주(역할표 「입구→목적지 통로 양옆 열」) ·
//   축 끝 동쪽 여왕 석관 제단(특징 1 · 4칸 · 손으로 고른 자리 그대로 23.5, 0.5) + 양옆 큰 촛대 한 쌍 · 여왕은 그 앞(maps.csv fixed gravequeen 17/0 그대로 · 옮기지 않음).
//   돌아가는 문(동북 26, 8)으로 가는 띠는 축 끝(12, 0)에서 북쪽으로 곧게 꺾여 문 줄(y 8)을 따른다. 띠(여왕 판석) 북쪽 = 밝은 무덤 바닥 · 남쪽 = 어두운 무덤 바닥 · 북벽 석관 줄 · 남벽 촛대 열.
//   여왕 세트(석관 옥좌·깃발 둘·큰 촛대 둘·뼈 단지 둘 — 같은 공간 특징 둘·낱개 기둥)는 뺐다. 자리 변경(시녀들의 방 → 봉인된 문간 통로 막기 · 아레나 바위 넷 · 홀 입구 줄)은 overrides.cjs queentomb.
//   순장자들의 방 = 북벽 열린 관 줄(순장) + 뼈 묶음 · 시녀들의 방(막다른 곁방) = 남벽 촛대 + 수의·단지 묶음 · 봉인된 문간·무덤 문 = 바닥 무늬와 소품 하나.
Object.assign(module.exports.queentomb, {
  v5: {
    outdoor: false,
    via: [[2, 0], [12, 0], [12, 8]],   // 축 끝에서 북쪽으로 곧게 꺾어 돌아가는 문 줄(y 8)로 — 대각 계단 띠가 홀 북쪽 반을 비스듬히 가르지 않게
    dress: {
      a: { props: ["a1-adjunct-collapsed-urn", "crypt-bone-urn"], decals: ["a1-decal-pooled-wax"], dn: 1 },
      b: { row: { name: "a1-open-coffin", contiguous: true, min: 3, minLine: 4 }, props: ["pit-bone-heap", "mp-bone-pile", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-scattered-bones", "a1-decal-pooled-wax"], dn: 2 },
      c: { row: { name: "crypt-candlestand", side: "s", min: 2, minLine: 4 }, props: ["cave-burial-shroud", "crypt-broken-coffin", "a1-adjunct-collapsed-urn"], clusters: 1, decals: ["a1-decal-blood-pool"], dn: 1 },
      d: { decals: ["a1-decal-pooled-wax", "a1-decal-cracked-earth"], dn: 2 },
      e: {
        feature: "set:a1_lm_queen_altar", featureAt: [23.5, 0.5], featureScale: 4 / 3, featureDrop: ["queen-great-candelabra"],   // 성소 제단처럼 4칸 (역할 3칸 × 4/3)
        colonnade: { name: "queen-blood-banner", step: 3, minPairs: 3, off: 2.5, tight: true, axis: [[1.5, 0.5], [11.5, 0.5]] },
        pair: { name: "queen-great-candelabra", around: "feature", d: 2.8 },
        sides: { left: "e", right: "f" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        row: [{ name: "crypt-sarcophagus", side: "n" }, { name: "crypt-candlestand", side: "s" }],
        decals: ["a1-decal-blood-pool", "a1-decal-pooled-wax", "a1-decal-scattered-bones"], dn: 3,
      },
    },
  },
  zones: Object.assign({}, module.exports.queentomb.zones, {
    e: "crypt-floor 0.92/0.86/0.86 여왕의 안식처",        // 띠(여왕 판석) 북쪽 — 밝은 무덤 바닥
    f: "crypt-floor 0.7/0.64/0.64 여왕의 안식처 남쪽",    // 띠 남쪽 (북쪽 e와 다른 톤)
  }),
  put: [],
});

// 11/15 가라앉은 지하실 1층 (v5): 무너진 계단(W −29, 0) → 회랑 → 물이 스민 통로(매복 길목) → 썩은 우물방 → 아래 계단참(E 28, 0)이 y 0 한 줄 — 그 축이 띠
//   (재의 회랑과 같은 자리 — 그 맵을 좌우로 뒤집기 전 원형). 고리 줄이기(검수표 「고리 3+2」)는 overrides.cjs cellar1 — 곡물 창고 → 우물방 남쪽 긴 통로만 막고
//   물 찬 술 창고 → 우물방 북쪽 「고리길」(이야기)은 남김 (가지 2 · 추가 연결 1 = 50% 이하 · 둘 다 막으면 사냥터가 너무 준다 — 재의 회랑과 같은 판단).
//   썩은 우물방 = 썩은 우물(특징 · 손으로 고른 자리를 v5 특징으로 · 띠 북쪽 · 촛대 쌍은 둥근 방 벽과 벽감을 만들어 뺐다) · 바닥 썩은 물이끼(바탕 지하실 바닥과 색 차이 0.06이라 띠가 안 보였다).
//   물 찬 술 창고 = 무너진 술통 선반(랜드마크 · 북벽) · 곡물 창고 = 북벽 부서진 선반 줄 + 장작 묶음 · 물이 스민 통로·계단참 = 바닥 무늬.
Object.assign(module.exports.cellar1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["cellar-rotten-barrel", "camp-firewood"], decals: ["a1-decal-rotting-reed-puddle"], dn: 1 },
      b: { feature: "set:a1_lm_barrel_shelf", props: ["mp-tripod", "camp-firewood"], clusters: 1, decals: ["a1-decal-rotting-reed-puddle", "a1-decal-cracked-earth"], dn: 2 },
      c: { row: { name: "cellar-broken-shelf", contiguous: true, min: 2, minLine: 3 }, props: ["a1-adjunct-rope-pile", "mp-wagon-wreck", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { decals: ["a1-decal-blood-pool", "a1-decal-rotting-reed-puddle"], dn: 2 },
      e: {
        feature: "prop:a1-rotten-well", featureAt: [16.5, 3.4], featureScale: 1.4,   // 역할 2칸 × 1.4 — 둥근 방 가운데 중심물로 (2칸은 방에 비해 작았다)
        props: ["marsh-rotten-log", "a1-adjunct-collapsed-urn"], clusters: 1,
        decals: ["a1-decal-rotting-reed-puddle", "a1-decal-blood-pool", "a1-decal-cracked-earth"], dn: 3,
      },
      f: { decals: ["a1-decal-rotting-reed-puddle"], dn: 1 },
    },
  },
  zones: Object.assign({}, module.exports.cellar1.zones, {
    e: "marsh-floor 0.54/0.58/0.48 썩은 우물방",   // 바탕(지하실 바닥)과 색 차이 0.06이라 「같은 바닥」 → 띠가 안 보였다 — 썩은 물이끼 바닥
  }),
  put: [],   // 썩은 우물 → v5 특징(같은 우물방 · 띠 북쪽)
});

// 12/15 가라앉은 지하실 2층 (v5): 계단참(W −29, 0) → 회랑(y 0) → 갈림 방 → 썩은 사제의 제단실(끝방 19, 0 · 되돌아가는 문 24, −9). 띠 = 회랑 축 + 제단실 안에서 남동 문으로.
//   띠는 축을 끝방 앞(16, 0)까지 곧게 간 뒤 남쪽으로 꺾어 문 줄(y −8)로. 고리 끊기(검수표 「고리 3+2」)·제단실 바위 기둥 넷은 overrides.cjs cellar2 — 무너진 저장고·썩은 물웅덩이 방은 회랑 x −19 갈림길에서만 닿는 막다른 방.
//   썩은 물웅덩이 방(검수표 「캡처로 확인」): 골격 밖이라 띠가 지나지 않고 물이끼 바닥(marsh) 그대로 — 둥근 두 방 모두 재적합 없이 원래 구역 바닥.
//   썩은 사제의 제단실 = 썩은 우물(특징 · 손으로 고른 자리 그대로 23, 4) + 끝방으로 가는 축 양옆 촛대 열주 + 북벽 해골 깃발 열 · 띠 북쪽 뼈 흙 / 남쪽 어두운 뼈 흙.
//   무너진 저장고 = 무너진 술통 선반(랜드마크 그대로) · 물웅덩이 방 = 썩은 통나무·갈대 묶음 + 웅덩이 · 갈림 방·계단참 = 바닥 무늬와 소품 하나.
Object.assign(module.exports.cellar2, {
  v5: {
    outdoor: false,
    via: [[16, 0], [16, -8]],   // 축(y 0)을 끝방 앞 x 16까지 곧게 → 남쪽으로 꺾어 되돌아가는 문 줄(y −8) — 대각 계단 띠가 제단실을 비스듬히 가르지 않게
    dress: {
      a: { props: ["cellar-rotten-barrel", "camp-firewood"], decals: ["a1-decal-cracked-earth"], dn: 1 },
      b: { feature: "prop:a1-landmark-collapsed-barrel-shelf", props: ["cellar-rotten-barrel", "a1-adjunct-burst-barrel", "mp-tripod"],   /* 한 장 특징 = 북벽 밀착 (세트로 두면 벽에서 떠 뒤 칸이 남았다) */ clusters: 1, decals: ["a1-decal-cracked-earth"], dn: 2 },
      c: { props: ["marsh-rotten-log", "marsh-reeds", "a1-pot-helmet-skull"], clusters: 1, floorProps: ["marsh-pool"], decals: ["a1-decal-rotting-reed-puddle", "a1-decal-blood-pool"], dn: 2 },
      d: { decals: ["a1-decal-pooled-wax", "a1-decal-scattered-bones"], dn: 2 },
      e: {
        feature: "prop:a1-rotten-well", featureAt: [23, 4], featureScale: 1.4,
        colonnade: { name: "crypt-candlestand", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[9.5, 0.5], [16.5, 0.5]] },
        row: [{ name: "a1-skull-banner", side: "n" }],
        sides: { left: "e", right: "h" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽
        props: ["crypt-bone-urn", "a1-adjunct-collapsed-urn"], clusters: 1,
        decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones", "a1-decal-pooled-wax"], dn: 3,
      },
    },
  },
  zones: Object.assign({}, module.exports.cellar2.zones, {
    a: "cellar-floor 0.6/0.58/0.54 계단참",                  // 바탕과 색 차이 0.08 → 띠 곁 패치가 깔렸다 — 한 톤 어둡게
    h: "bone-floor 0.56/0.5/0.48 썩은 사제의 제단실 남쪽",    // 띠 남쪽 (북쪽 e와 다른 톤)
  }),
  put: [],   // 썩은 우물 → v5 특징(같은 자리)
});

// 1/15 잿불 야영지 (keep · 마을): 목책·바닥·야영지 큰길·원래 이음새·NPC·상점·포털·화로·게시판 자리 모두 그대로 · 역할 배치(산발 정리)만 (마지막 초소와 같은 처리).
//   손으로 고른 자리(잿불 화로·무너진 성문 랜드마크·수레·무기 걸이·꺼진 화로 받침)는 그대로. 꾸밈만 묶음 ≤3·같은 그림 맵당 ≤2로
//   (장작 5·썩은 통 4·무기 걸이 3 산발 → 묶음) · 잿불 광장 = 장작·삼발이 묶음 · 천막 줄 = 북쪽 목책 천막 열 + 통·장작 묶음 · 카라반 마당 = 수레 곁 통 묶음 ·
//   대장간 = 솥·장작 묶음 · 남문 길 = 이정표·방책 묶음.
// 손으로 고른 자리 손질: 낱개 천막 셋(간격 7.5·13칸 — 산발 복제 3)은 빼고 천막 줄 북쪽 목책에 붙인 천막 열로 (검수표 「천막 줄 camp-tent 줄로 골목」) ·
//   천막 열 = 천막 줄 서쪽 북쪽 목책에 붙인 천막 셋(빈틈 없이 · 손으로 고른 자리) · 남문 무너진 성문·잿불 화로(이 마을 이름)·카라반 수레는 v5 역할 배율(×0.694·×0.725·×0.5)을 되돌려
//   원래 크기 그대로 (성문은 목책 틈에 맞춘 크기 — 발밑 막힘 2줄(foot=0.3)이라야 남문 길이 좁아지지 않는다) · 성문 역할표 facing north → any (마을 안쪽에서 보는 남쪽 목책 문 — 초소 문틀과 같은 처리) ·
//   무기 걸이(역할 배율로 작아져 동쪽 벽과 1칸 벽감)는 padr=1
Object.assign(module.exports.town, {
  put: module.exports.town.put.filter((p) => p[1] !== "camp-tent").map((p) => (p[1] === "a1-landmark-ruined-gate" ? [p[0], p[1], p[2], p[3], Math.round(1000 / 0.694) / 1000, p[5], "ok=cliff;foot=0.3"]
    : p[1] === "camp-brazier" ? [p[0], p[1], p[2], p[3], Math.round(1150 / 0.725) / 1000, p[5] || 0]
    : p[1] === "camp-cart" ? [p[0], p[1], p[2], p[3], 2, p[5] || 0]
    : p[1] === "camp-weapon-rack" ? [p[0], p[1], p[2], p[3], p[4] || 1, p[5] || 0, "padr=1"] : p))
    .concat([-13, -10.4, -7.8].map((x) => ["prop", "camp-tent", x, 8.3, 1, 0, "wall=1"])),   // 천막 열 셋 — 북쪽 목책에 붙여 빈틈 없이 (2.6칸 간격 · 3.5칸이면 천막 사이 1칸 벽감) (생성기 열은 거친 목책 윤곽에 갇힌 바닥을 만들어 못 놓았다)
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { props: ["camp-firewood", "mp-tripod"], clusters: 1, decals: ["a1-decal-broad-cold-ash"], dn: 1 },
      b: { props: ["cellar-rotten-barrel", "camp-firewood"], clusters: 1, decals: ["a1-decal-cart-tracks"], dn: 2 },
      c: { props: ["cellar-rotten-barrel", "mp-tripod"], clusters: 1, decals: ["a1-decal-cart-tracks"], dn: 1 },
      d: { props: ["mp-cauldron-fire", "camp-firewood"], clusters: 1, decals: ["a1-decal-ash-campfire"], dn: 1 },
      e: { props: ["mp-signpost", "mp-barricade"], clusters: 1, decals: ["a1-decal-cart-tracks"], dn: 2 },
    },
  },
});

// 10/15 굶주린 굴 (keep): 재 굴 바닥·둥근 굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (타락의 구덩이와 같은 자리 — 그 맵을 뒤집기 전 원형)
//   (검수표 구획: 굴 어귀 → 갉아먹힌 길목 → 굶주린 자들의 둥지 → 막힌 굴 끝(봉인 상자 · 되돌아가는 문), 곁 = 뼈 무더기 굴·해골 굴).
//   굶주린 자들의 둥지 = 해골 탑(특징 1 · 검수표 「둥지 중심에 액트 1 랜드마크 하나」 — 갈비뼈 제단 세트는 10-31 액트 1 세 맵 「어울리지 않는 세트」라 쓰지 않음) + 뼈·갉힌 잔해 묶음 ·
//   뼈 무더기 굴 = 뼈 무더기 묶음 둘 · 해골 굴 = 해골 더미 묶음 · 막힌 굴 끝 = 종유석·뼈 묶음 · 갉아먹힌 길목·굴 어귀 = 갉힌 잔해 하나.
//   갉힌 잔해 산발(5)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.hollow, {
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["hollow-bone-pile"], decals: ["a1-decal-scattered-bones"], dn: 1 },
      b: { props: ["hollow-gnawed-remains", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 1 },
      c: { props: ["pit-bone-heap", "hollow-bone-pile", "mp-beast-skull"], decals: ["a1-decal-scattered-bones"], dn: 2 },
      d: { feature: "prop:pit-skull-tower", featureAt: [4.5, 4.4], props: ["hollow-gnawed-remains", "a1-pot-helmet-skull", "pit-bone-heap"], clusters: 1, decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 3 },
      e: { props: ["waste-skull-pile", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 1 },
      f: { props: ["cave-stalactite", "hollow-bone-pile"], clusters: 1, decals: ["a1-decal-blood-pool"], dn: 2 },
    },
  },
});

// 13/15 뼈 구덩이 1층 (keep): 뼈 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (유황 동굴 1층과 같은 자리 — 그 맵을 뒤집기 전 원형)
//   (검수표 구획: 구덩이 어귀 → 뼈 비탈 → 해골 탑 광장 → 매복 골짜기 → 아래 계단, 곁 = 남쪽 고리길 — keep이라 고리길 통로는 그대로).
//   특징 공간당 1: 해골 탑 광장 = 뼈 사당(뼈 탑 + 해골 깃발 쌍 · 세트 속 낱개 사슬 말뚝은 뺌) · 매복 골짜기 = 뼈 도르래 기중기(랜드마크 그대로) ·
//   뼈 비탈 = 뼈 더미·해골 더미 묶음 · 남쪽 고리길 = 뼈 무더기 묶음 · 어귀·아래 계단 = 뼈 무더기 하나. 뼈 무더기 산발(7)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.pit1, {
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["pit-bone-heap"], decals: ["a1-decal-scattered-bones"], dn: 1 },
      b: { props: ["mp-bone-pile", "waste-skull-pile", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      c: { feature: "set:a1_bone_shrine", props: ["pit-bone-heap", "hollow-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones", "a1-decal-blood-pool"], dn: 3 },
      d: { feature: "set:a1_lm_pulley_crane", props: ["mp-beast-skull", "waste-broken-spears"], clusters: 1, decals: ["a1-decal-chain-drag-marks"], dn: 2 },
      e: { props: ["mp-bone-pile", "hollow-gnawed-remains"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 1 },
      f: { decals: ["a1-decal-scattered-bones"], dn: 1 },
    },
  },
});

// 14/15 뼈 구덩이 2층 (keep): 뼈 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (유황 동굴 2층과 같은 자리 — 그 맵을 뒤집기 전 원형)
//   (검수표 구획: 계단참 → 북쪽 굴 → 유물 지기의 굴(봉인 상자 · 되돌아가는 문 · 끝방), 곁 = 뼈 무더기 길).
//   유물 지기의 굴 = 뼈 도르래 기중기(특징 1 · 검수표 「유물 지기의 굴 중심에」 · 뼈 무더기 길에서 옮김 — 끝방 자리 둘레는 비운다) + 해골 탑 더미 묶음 ·
//   북쪽 굴(골격) = 뼈·투구·깨진 단지 묶음 (도굴당한 무덤 세트는 골격 너비를 1칸으로 좁혔다) · 뼈 무더기 길 = 뼈·해골 더미 묶음 + 끌린 사슬 자국 · 계단참 = 뼈 무더기 하나. 뼈 무더기 산발(6)은 묶음으로.
Object.assign(module.exports.pit2, {
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["pit-bone-heap"], decals: ["a1-decal-scattered-bones"], dn: 1 },
      b: { props: ["mp-bone-pile", "waste-skull-pile", "pit-bone-heap"], clusters: 2, decals: ["a1-decal-chain-drag-marks", "a1-decal-scattered-bones"], dn: 2 },
      c: { props: ["mp-bone-pile", "a1-pot-helmet-skull", "a1-adjunct-collapsed-urn"], clusters: 1,   /* 도굴당한 무덤 세트는 골격(북쪽 굴을 지난다) 너비를 1칸으로 좁혀 뺐다 */ decals: ["a1-decal-scattered-bones"], dn: 1 },
      d: { feature: "set:a1_lm_pulley_crane", props: ["crypt-bone-urn", "a1-skull-banner", "hollow-bone-pile"], clusters: 1, decals: ["a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 3 },
    },
  },
});

// 15/15 목매단 동굴 (keep): 재 굴 바닥·둥근 굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 동굴 어귀 → 종유석 굴 → 막다른 굴(봉인 상자 · 되돌아가는 문 · 끝방), 곁 = 수의 걸린 굴·박쥐 굴 — keep이라 두 굴로 갈라졌다 만나는 통로는 그대로).
//   종유석 굴 = 시체 매단 기둥(랜드마크 그대로 · 검수표 「종유석 굴 중심에」) · 수의 걸린 굴 = 수의·밧줄 묶음 · 박쥐 굴 = 종유석·짐승 두개골 묶음 ·
//   막다른 굴 = 수의·뼈 단지 묶음 · 어귀 = 종유석 하나. 뼈 무더기·짐승 두개골 산발(3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.cave, {
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["cave-stalactite"], decals: ["a1-decal-cracked-earth"], dn: 1 },
      b: { props: ["cave-burial-shroud", "forest-hanging-rope", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      c: { feature: "set:a1_lm_corpse_pillar", props: ["pit-bone-heap", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-dragged-blood-smear", "a1-decal-cracked-earth"], dn: 2 },
      d: { props: ["cave-stalactite", "mp-beast-skull", "hollow-gnawed-remains"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      e: { props: ["cave-burial-shroud", "crypt-bone-urn", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-blood-pool"], dn: 2 },
    },
  },
});

// 3/15 썩은 갈대 늪 (keep): 늪 바닥·둑길(=)·샛길(-)·갈대 숲 벽·무너진 담·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (유황 늪 표본과 같은 처리 — 같은 「어두운 물기 바닥」 부류)
//   (검수표 구획: 늪 어귀 → 썩은 나무다리 교차로(웨이포인트) → 동쪽 둑길(출구), 곁 = 가라앉은 사당·습격당한 수레 행렬·무너진 종탑 묘지·가라앉은 농가(지하실 입구)).
//   특징 공간당 1: 가라앉은 사당 = 썩은 우물 사당 세트 · 동쪽 둑길 = 반쯤 잠긴 망루(랜드마크 그대로) · 가라앉은 농가 = 무너진 집터(손으로 고른 자리 · 북쪽 담까지 막음) + 솥·삼발이·장작 묶음 ·
//   무너진 종탑 묘지 = 마른 고목 + 까마귀 그루터기·해골 더미 묶음 (종탑·회색 묘지 세트는 10-31 액트 1 세 맵 「어울리지 않는 세트」라 쓰지 않음) ·
//   교차로 = 개울에 빠진 수레 세트 · 수레 행렬 = 습격당한 짐수레 세트 + 숨은 야영 세트 · 어귀 = 마지막 파수꾼 세트.
//   썩은 통나무·갈대·화로 산발(6·4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.rotmarsh, {
  put: module.exports.rotmarsh.put.map((p) => (p[1] === "mp-house-ruin" ? p.slice(0, 6).concat(["wall=1"]) : p)),   // 가라앉은 농가 집터(정면 그림) — 북쪽 무너진 담까지 뒤 칸 4칸이 남았다 → 담까지 막음
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["hm_last_guard"], decals: ["a1-decal-dead-grass", "a1-decal-cart-tracks"], dn: 2 },
      b: { feature: "set:a1_marsh_shrine", props: ["marsh-rotten-log", "mp-dead-tree"], clusters: 1, floorProps: ["marsh-pool"], decals: ["a1-decal-dead-grass", "a1-decal-scattered-bones"], dn: 2 },
      c: { sets: ["hm_creek_wreck"], floorProps: ["marsh-pool"], decals: ["a1-decal-cart-tracks", "a1-decal-rotting-reed-puddle", "a1-decal-blood-pool"], dn: 3 },
      d: { sets: ["a1_ambush_camp", "hm_hidden_camp"], decals: ["a1-decal-broad-cold-ash", "a1-decal-shield-fragments", "a1-decal-blood-pool"], dn: 3 },
      e: { feature: "prop:mp-dead-tree", props: ["forest-raven-stump", "waste-skull-pile", "a1-pot-helmet-skull"], clusters: 1, decals: ["a1-decal-collapsed-grave-earth", "a1-decal-scattered-bones"], dn: 3 },
      f: { props: ["mp-cauldron-fire", "mp-tripod", "camp-firewood"], clusters: 1, decals: ["a1-decal-dead-grass", "a1-decal-ash-campfire"], dn: 2 },   // 불탄 농가 세트는 집터(손으로 고른 자리)·지하실 입구 곁에 자리가 없었다 → 솥·삼발이·장작 묶음
      g: { feature: "set:a1_lm_watchtower", featureDrop: ["a1-decal-rotting-reed-puddle"], props: ["marsh-rotten-log", "waste-dead-tree"],   /* 세트 바닥 무늬 조각 발이 남쪽 벽 칸이었다 */ clusters: 1, decals: ["a1-decal-rotting-reed-puddle", "a1-decal-dead-grass"], dn: 2 },
    },
  },
});

// 4/15 무너진 형장 (keep): 형장 바닥·옛 돌길(=)·샛길(-)·바위 언덕·형장 담·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 형장 바깥 길 → 처형 광장(웨이포인트) → 동문 길, 곁 = 머리 없는 왕의 쉼터·죄수 우리·까마귀 묘지·뼈 구덩이 어귀(구덩이 입구)).
//   특징 공간당 1: 처형 광장 = 처형대 세트(돌길 남쪽 광장 가운데 · 세트 속 낱개 사슬 기둥은 뺌) · 왕의 쉼터 = 머리 없는 왕의 석상 · 죄수 우리 = 처형 발판(랜드마크 그대로) ·
//   까마귀 묘지 = 묘지 세트(울타리·묘비 열) · 뼈 구덩이 어귀 = 뼈 무더기 묶음 · 동문 길 = 무너진 파수 자리 세트 · 바깥 길 = 창·방책 묶음.
//   묘비·해골 더미·투구 해골·말뚝 산발(5·4·4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.execution, {
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { props: ["waste-broken-spears", "mp-barricade", "waste-dry-shrub"], clusters: 1, decals: ["a1-decal-cart-tracks", "a1-decal-blood-pool"], dn: 2 },
      b: { feature: "set:a1_execution_square", featureAt: [-9.5, -5.3], props: ["execution-pillory", "waste-skull-pile"], clusters: 1, decals: ["a1-decal-dragged-blood-smear", "a1-decal-blood-pool", "a1-decal-scattered-bones"], dn: 3 },
      c: { feature: "set:a1_kings_rest", props: ["a1-pot-helmet-skull", "mp-dead-tree"], clusters: 1, decals: ["a1-decal-cracked-earth"], dn: 2 },
      d: { feature: "set:a1_lm_scaffold", props: ["mp-cage-hanging", "mp-stake-spikes"], clusters: 1, decals: ["a1-decal-chain-drag-marks", "a1-decal-blood-pool"], dn: 2 },
      e: { sets: ["a1_graveyard"], props: ["forest-raven-stump"], decals: ["a1-decal-collapsed-grave-earth", "a1-decal-dead-grass"], dn: 2 },
      f: { props: ["pit-bone-heap", "pit-skull-tower", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      g: { sets: ["hm_watch_post"], props: ["mp-signpost"], decals: ["a1-decal-cart-tracks"], dn: 1 },
    },
  },
});

// 5/15 교수대 숲 (keep · 상위 5 최소 수정 · 등급 C): 숲 바닥·숲길(=)·샛길(-)·죽은 나무 숲 벽·무너진 담·원래 이음새·장소 세트 그대로 · 길 안내 0 · 산발 정리만
//   (검수표 구획: 숲 어귀 → 까마귀 숲길(웨이포인트) → 망나니의 처형장(보스) → 동쪽 숲길, 곁 = 교수대 언덕·피의 제단·목매단 동굴 어귀).
//   교수대 언덕 세트는 언덕 남쪽 가운데(−11.5, 9.4 · 세트 속 고목은 같은 공간 특징 둘이라 뺌) · 나머지 장소 세트는 원래 설계서 그대로(교수 나무 랜드마크 · 숨은 야영 · 뼈 사당 · 묘지 · 망나니 세트 손으로 고른 자리) — 같은 공간 특징 둘·세트 속 낱개 기둥만 생성기 규칙으로 빠진다.
//   해골 더미·마른 덤불·뼈 무더기 산발(6·5·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
// 손으로 고른 자리 손질: 망나니 세트(보스 뒤 처형대)를 조각으로 풀고 해골 깃대 둘만 뺐다 — v5 역할 크기(3칸)로 커진 깃대가 동쪽 숲길(골격)을 1칸으로 좁히고 북쪽 깃대 뒤 칸이 남았다 ·
//   처형대는 1.8칸 남쪽(숲길 남쪽 · 발밑이 숲길 칸을 막아 골격 너비 1칸이었다) · 사슬 기둥 쌍·해골 더미·핏자국은 같은 자리 (망나니 자리 headsman 15/−2 그대로)
Object.assign(module.exports.gallows, {
  put: [["prop", "execution-platform", 18.5, -2.7, 1, 0], ["prop", "execution-chain-pillar", 17.1, 1.3, 1, 0], ["prop", "execution-chain-pillar", 17.1, -3.9, 1, 1],
    ["prop", "waste-skull-pile", 13.7, 0.7, 1, 0], ["prop", "waste-skull-pile", 13.9, -3.7, 1, 1],
    ["decal", "a1-decal-blood-pool", 15.5, -1.5, 1.5, 0], ["decal", "a1-decal-blood-pool", 13.7, -0.7, 0.8, 0], ["decal", "a1-decal-scattered-bones", 12.9, -2.4, 1, 0], ["decal", "a1-decal-scattered-bones", 16.7, -3.1, 1, 1]],
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { props: ["forest-raven-stump", "waste-dry-shrub"], clusters: 1, decals: ["a1-decal-dead-grass"], dn: 2 },
      b: { feature: "set:a1_gallows_hill", featureAt: [-11.5, 9.4], featureDrop: ["forest-dead-tree"], props: ["forest-hanging-rope", "mp-cage-hanging"], clusters: 1, decals: ["a1-decal-dead-grass", "a1-decal-scattered-bones"], dn: 2 },
      c: { feature: "set:a1_lm_gallows_tree", sets: ["hm_hidden_camp"], decals: ["a1-decal-rusted-arrow-bundle", "a1-decal-dead-grass"], dn: 2 },
      d: { feature: "set:a1_bone_shrine", props: ["a1-chained-stake", "waste-skull-pile"], clusters: 1, decals: ["a1-decal-dragged-blood-smear", "a1-decal-blood-pool"], dn: 3 },
      e: { props: ["mp-stake-spikes", "execution-pillory"], clusters: 1, decals: ["a1-decal-blood-pool"], dn: 2 },
      f: { props: ["forest-hanging-rope", "mp-bone-pile"], clusters: 1, decals: ["a1-decal-scattered-bones"], dn: 2 },
      g: { sets: ["a1_graveyard"], decals: ["a1-decal-dead-grass"], dn: 1 },
    },
  },
});
