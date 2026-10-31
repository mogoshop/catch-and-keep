// 액트 3 「소금바람 해안」 장소 설계서 (10-28 맵 66장 전면 개편 · 기획서 38 F7). tools/build/handmade/compose.cjs가 설계도·배치표로 옮긴다.
// 항구·해안 사냥터 4장은 새로 설계, 등대 3층·폭풍의 눈·곁가지 7장은 액트 1·2 던전 자리를 앞 액트와 다른 방향으로 뒤집어 다시 쓴다 (부록 C B안).
"use strict";
const { E, R, P, rock, wall, remix } = require("./kit.cjs");
const A1 = require("./act1.cjs");
const A2 = require("./act2.cjs");

// 10-28 사용자 「액트 3 물에 젖은 느낌」: sand-floor(액트 2 사막 모래 그림)는 어둡고 차갑게 물들여 젖은 모래로 — 코덱스 a3-wet-sand-floor가 오면 바꾼다
const COAST = { "#": "coast-rock 0.72/0.92/0.95 해안 바위" };
const coastDecals = ["a3-decal-tide-puddle", "a3-decal-seaweed", "a3-decal-shells", "a3-decal-foam-line"];
const LIGHT = {
  base: "cellar-floor 0.78/0.84/0.86",
  walls: { "#": "lighthouse 1/1/1 등대 벽" },
  zones: {
    a: "cellar-floor 0.7/0.76/0.78 계단참",
    b: "execution-floor 0.72/0.8/0.84 창고 회랑",
    c: "cellar-floor 0.66/0.72/0.74 등유 저장고",
    d: "execution-floor 0.86/0.92/0.94 등대 홀",
    e: "cellar-floor 0.62/0.7/0.74 침수된 방",
    f: "ash-camp-floor 0.66/0.74/0.74 무너진 선반 방",
    g: "execution-floor 0.78/0.84/0.86 위층 계단",
  },
};
const lightDress = {
  a: { props: ["lighthouse-stairs", "harbor-lantern"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
  b: { props: ["harbor-barrels", "smuggler-crates", "a3-drift-crates", "fishing-net"], n: 9, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 5 },
  c: { props: ["harbor-barrels", "a3-drift-crates", "harbor-lantern"], n: 8, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 4 },
  d: { props: ["harbor-lantern", "lighthouse-lens", "a3-rusted-cannon"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps", "a3-decal-salt-crust"], dn: 6 },
  e: { props: ["tidal-pool", "a3-kelp-rock", "a3-broken-trap"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 6 },
  f: { props: ["a3-drift-crates", "a3-broken-mast", "smuggler-crates"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
  g: { props: ["lighthouse-stairs"], n: 1, decals: ["a3-decal-tide-puddle"], dn: 2 },
};
const WETCAVE = (floor, tint, name) => ({ base: `${floor} ${tint}`, walls: { "#": `wet-cave 1/1/1 ${name || "젖은 굴 벽"}` } });

module.exports = {
  harbor: {
    size: [36, 24],
    title: "소금바람 항구",
    story: ["바다에 면한 마지막 항구. 북쪽 부두에 배가 묶여 있고, 가운데 항구 광장을 어시장(서)·대장간(동)이 둘러싼다.", "남문 길이 소금 갯벌로 나가는 문. 돌아오면 광장 남쪽 끝(도착 자리)에 선다."],
    base: "execution-floor 0.78/0.86/0.88",
    walls: COAST,
    zones: {
      a: "execution-floor 0.86/0.92/0.94 항구 광장",
      b: "ash-road 0.72/0.66/0.56 부두",
      c: "ash-camp-floor 0.7/0.84/0.8 어시장",
      d: "execution-floor 0.74/0.8/0.82 대장간",
      e: "ash-camp-floor 0.72/0.84/0.8 남문 길",
    },
    roads: { "=": "ash-road 0.86/0.96/0.9 항구 큰길" },
    places: [
      E("a", "항구 광장", 0, 0, 8, 4.5, { torch: false }),
      R("b", "부두", -15, 6, 14, 9, { rough: 0.4, torch: false }),
      E("c", "어시장", -12, -1, 5, 5, { torch: false }),
      E("d", "대장간", 11, -1, 5, 5, { torch: false }),
      R("e", "남문 길", -4, -10, 4, -5, { rough: 0.6, torch: false }),
    ],
    paths: [P([[0, -11], [0, -1]], 4, "=", 2), P([[-15, -1], [14, -1]], 3, "=", 1), P([[0, 3], [0, 6]], 3)],
    gates: { G: [0, -10] },
    waypoint: [-6, 2],
    torches: [[-4, 1], [3, 1], [-12, 3], [12, -4], [-2, -8], [1, -8], [-7, 7], [6, 7]],
    extra: {
      // townboard: 10-29 마을 게시판 자리(maps.csv extra townboard@-1.5/3.5) — compose가 지우지 않게 설계서에도
      depthgate: [5, 2], townboard: [-2, 3], "npc:Captain": [-10, 7], "npc:ShopKeeper": [-4, 4], "npc:Harbormaster": [3, 4], "npc:Smith": [10, 1],
      "npc:KeeperDaughter": [8, 7], "npc:Stash": [2, -3], "npc:Elder": [-2, 6],
    },
    put: [
      ["prop", "a3-landmark-harbor-anchor-monument", 11, 6.3],   // 10-28 마을 랜드마크 — 맵 위 끝(24칸)에 닿지 않게 그림 전체가 보이는 자리
      ["prop", "moored-ship", -3, 10.6, 1, 0, "ok=cliff"], ["prop", "fishing-net", -13.5, 8.6], ["prop", "harbor-barrels", 12.5, 8.4],
      ["prop", "harbor-lantern", -6.5, 7.2, 1, 0, "ok=gate"], ["prop", "harbor-lantern", 4.5, 7.2, 1, 0, "ok=gate"], ["prop", "a3-capsized-boat", -14, -4.4],
    ],
    dress: {
      a: { decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 4 },
      c: { props: ["harbor-barrels", "a3-crab-in-bucket", "fishing-net"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-shells"], dn: 4 },
      d: { props: ["camp-weapon-rack", "harbor-barrels", "camp-firewood"], n: 3, decals: ["a3-decal-tide-puddle", "a1-decal-ash-campfire"], dn: 3 },
      e: { props: ["a3-drift-crates", "harbor-lantern", "mp-signpost"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
    },
  },

  saltflat: {
    size: [64, 44],
    title: "소금 갯벌",
    story: ["항구를 나서면 썰물에 드러난 갯벌. 둑길은 물웅덩이(웨이포인트)를 지나 동쪽 둑으로 이어진다.", "북서쪽 거대한 고래 뼈, 남서쪽 어부 야영지, 북동쪽 집게 동굴 어귀, 남동쪽 소금 결정 밭."],
    // 10-28 사용자 「액트 3은 바다인 게 확 느껴지게 — 얕은 바다」 → 코덱스 r2 샘플(a3-handmade-v1 *-r2): 바탕 = 얕은 바다,
    // 모래톱(고래 뼈 · 소금 결정 밭)·야영지·동굴 어귀 = 물 빠진 회청 모래, 어귀·둑 = 회청 갯벌, 벽 = 푸른 동굴 색 해안 바위.
    // 둑길은 얕은 물을 가르는 모래 둑, 갯골 길은 갯벌. 회청 모래는 채도가 낮아 횃불 빛에 하얗게 떠서(눈밭처럼) 한 단계 어둡고 차갑게 (메이커 비교)
    base: "a3-shallow-sea-floor-r2 1/1/1",
    walls: { "#": "a3-coast-rock-wall-r2 1/1/1 따개비 해안 바위" },
    zones: {
      a: "a3-tidal-flat-floor-r2 1/1/1 갯벌 어귀",
      b: "a3-wet-sand-floor-r2 0.74/0.8/0.86 고래 뼈 모래톱",
      c: "a3-shallow-sea-floor-r2 0.86/0.92/0.96 물웅덩이",
      d: "a3-wet-sand-floor-r2 0.7/0.74/0.78 어부 야영지",
      e: "a3-wet-sand-floor-r2 0.66/0.72/0.78 집게 동굴 어귀",
      f: "a3-wet-sand-floor-r2 0.84/0.88/0.92 소금 결정 밭",
      g: "a3-tidal-flat-floor-r2 1/1/1 동쪽 둑",
    },
    roads: { "=": "a3-wet-sand-floor-r2 0.8/0.84/0.88 둑길", "-": "a3-tidal-flat-floor-r2 0.92/0.96/0.98 갯골 길" },
    shore: "a3-shallow-sea-floor-r2+a3-tidal-flat-floor-r2 a3-decal-foam-line 0.9 0.92/0.96/1",   // 물(얕은 바다·갯벌)과 모래가 맞닿은 변을 따라 거품 띠 (코덱스 경계 거품 띠가 오면 바꾼다)
    places: [
      E("a", "갯벌 어귀", -25, 2, 6, 5),
      E("b", "고래 뼈 모래톱", -10, 12, 9, 6),
      E("c", "물웅덩이", -4, -4, 8, 6, { note: "웨이포인트" }),
      E("d", "어부 야영지", -16, -14, 7, 4),
      E("e", "집게 동굴 어귀", 13, 12, 8, 6, { note: "집게 동굴 입구" }),
      E("f", "소금 결정 밭", 14, -10, 9, 6),
      E("g", "동쪽 둑", 26, -2, 5, 5),
    ],
    paths: [
      P([[-32, 2], [-25, 2], [-16, -2], [-4, -4], [6, -1], [14, 2], [20, 0], [26, -2], [31, -2]], 4, "=", 2),
      P([[-20, 5], [-14, 10]], 3, "-", 1), P([[2, 1], [8, 8], [12, 10]], 3, "-", 1), P([[-8, -8], [-14, -12]], 3, "-", 1),
      P([[10, -4], [13, -7]], 3, "-", 1), P([[-6, 16], [4, 16], [8, 14]], 3),
    ],
    rocks: [rock(-27, 12, 3, 3), rock(-26, -11, 3, 3), rock(2, 10, 2.5, 2), rock(26, 10, 3, 3), rock(27, -14, 3, 3), rock(0, -16, 3, 2)],
    gates: { W: [-31, 2], E: [30, -2] },
    holes: { crabcave1: [14, 14] },
    waypoint: [-3, -1],
    // 예전 손 배치 「crab-cave-mouth」는 10-28 곁가지 입구 그림(entrance_art crabcave1 — 포털에 입을 맞춘다)과 겹쳐 동굴이 둘로 보였다 → 뺐다
    dress: {
      a: { props: ["scorched-rock", "salt-crystals", "a3-kelp-rock"], n: 6, decals: ["a3-decal-seaweed", "a3-decal-shells", "a3-decal-foam-line"], dn: 3 },
      b: { sets: ["a3_leviathan"], props: ["a3-kelp-rock", "a3-crab-shell-pile", "scorched-rock"], n: 6, decals: ["a3-decal-seaweed", "a3-decal-shells"], dn: 4 },
      c: { sets: ["a3_tidepool"], props: ["tidal-pool", "a3-kelp-rock"], n: 6, decals: ["a3-decal-foam-line", "a3-decal-seaweed"], dn: 5 },
      d: { sets: ["a3_fish_camp"], props: ["fishing-net", "harbor-barrels", "a3-broken-trap"], n: 5, decals: ["a3-decal-rope-scraps", "a3-decal-shells"], dn: 3 },
      e: { props: ["salt-crystals", "a3-crab-shell-pile", "a3-crab-in-bucket"], n: 6, decals: ["a3-decal-shells", "a3-decal-seaweed"], dn: 4 },
      f: { sets: ["a3_lm_salt_spire"], props: ["salt-crystals", "scorched-rock", "tidal-pool"], n: 8, decals: ["a3-decal-salt-crust"], dn: 5 },
      g: { props: ["a3-kelp-rock", "scorched-rock"], n: 5, decals: ["a3-decal-seaweed", "a3-decal-foam-line"], dn: 2 },
    },
  },

  wreckcoast: {
    size: [70, 50],
    title: "난파선 해안",
    story: ["폭풍에 밀려온 배들이 부서진 해안. 길은 뱃머리 난파선 아래로 올라갔다 부서진 부두(웨이포인트)로 내려온다.", "남서쪽 밀수꾼 은신처, 북동쪽 난파선 선창 입구, 남동쪽 어부 마을 터. 동쪽 절벽길이 번개 절벽으로."],
    base: "sand-floor 0.6/0.71/0.76",
    walls: COAST,
    zones: {
      a: "sand-floor 0.56/0.67/0.72 해안 어귀",
      b: "ash-road 0.7/0.66/0.58 뱃머리 난파선",
      c: "execution-floor 0.72/0.82/0.82 부서진 부두",
      d: "ash-cave-floor 0.68/0.74/0.74 밀수꾼 은신처",
      e: "cellar-floor 0.7/0.72/0.7 선창 어귀",
      f: "sand-floor 0.63/0.72/0.78 어부 마을 터",
      g: "sand-floor 0.58/0.69/0.76 동쪽 절벽길",
    },
    roads: { "=": "ash-road 0.86/0.96/0.9 해안길", "-": "ash-road 0.7/0.8/0.78 모래 샛길" },
    places: [
      E("a", "해안 어귀", -28, -4, 6, 5),
      E("b", "뱃머리 난파선", -14, 9, 9, 6),
      E("c", "부서진 부두", 0, -2, 9, 6, { note: "웨이포인트" }),
      E("d", "밀수꾼 은신처", -12, -15, 8, 5),
      E("e", "선창 어귀", 14, 12, 8, 6, { note: "난파선 선창 입구" }),
      E("f", "어부 마을 터", 16, -12, 9, 6),
      E("g", "동쪽 절벽길", 28, 4, 5, 5),
    ],
    paths: [
      P([[-35, -4], [-28, -4], [-20, 2], [-12, 4], [-4, 0], [0, -2], [8, 2], [16, 4], [22, 6], [28, 4], [34, 4]], 4, "=", 2),
      P([[-6, -4], [-10, -12]], 3, "-", 1), P([[6, -4], [14, -9]], 3, "-", 1), P([[10, 6], [13, 10]], 3, "-", 1),
      P([[-4, -16], [8, -16], [12, -14]], 3), P([[-6, 12], [4, 15], [8, 13]], 3),
    ],
    rocks: [rock(-29, 8, 3, 3), rock(-27, -14, 3, 3), rock(4, 8, 2.5, 2), rock(28, -10, 3, 3), rock(27, 14, 3, 2.5), rock(0, -10, 2, 1.5)],
    gates: { W: [-34, -4], E: [33, 4] },
    holes: { wreckhold: [16, 14] },
    waypoint: [1, 1],
    put: [["prop", "wreck-hull", 17.5, 16.6, 1]],
    dress: {
      a: { props: ["scorched-rock", "a3-kelp-rock", "a3-drift-crates"], n: 6, decals: coastDecals, dn: 3, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { sets: ["a3_bow_wreck"], props: ["a3-broken-mast", "wreck-anchor", "a3-drift-crates"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed", "a3-decal-rope-scraps"], dn: 6 },
      c: { props: ["broken-boardwalk", "harbor-lantern", "a3-drift-crates", "fishing-net"], n: 8, decals: ["a3-decal-foam-line", "a3-decal-tide-puddle"], dn: 6 },
      d: { sets: ["a3_smuggler_cache"], props: ["smuggler-crates", "harbor-barrels", "a3-rusted-cannon"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
      e: { sets: ["a3_lm_wheel_graveyard"], props: ["wreck-anchor", "a3-drift-crates", "scorched-rock"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 5 },
      f: { sets: ["a3_fish_camp"], props: ["drowned-hut", "fishing-net", "a3-capsized-boat"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-shells"], dn: 5 },
      g: { props: ["scorched-rock", "a3-kelp-rock"], n: 5, decals: coastDecals, dn: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
    },
  },

  // 10-29 「담 위」 액트 3판 (사용자 「액트 3·4도 같은 결로」 → Fable 선정): 바다 위 절벽 능선.
  //   걷는 칸 = 해안 바위 윗면(좁은 능선·둥근 바위 머리), '#' = 낮은 바다(못 지나감). 높이 2단(앞면 띠) + 바닷가 거품 띠.
  //   능선은 자연물이라 가장자리를 조금 깨문다(rough 0.6 · 길 wobble 0.5), 길 폭은 2~3
  stormcliff: {
    size: [70, 50],
    title: "번개 절벽",
    story: ["바다 위로 솟은 절벽 능선. 서쪽 어귀에서 좁은 능선이 구불구불 번개 맞은 바위(웨이포인트, 넓은 둥근 바위 머리)까지 이어지고, 거기서 갈라진다.", "북쪽 막다른 바위 머리에 무너진 등대 꼭대기, 남서쪽 네모 바위 턱에 밀수꾼 동굴 입구, 북동쪽 바위 머리에 봉화대, 남동쪽 능선 곁 낮은 턱에 조수 웅덩이. 동쪽 내리막이 가라앉은 어촌으로."],
    raised: "a3-coast-rock-wall-r2 1/1/1 절벽 능선 tiers=2 top=zone face=a3-coast-rock-wall-r2-borders low=a3-shallow-sea-floor-r2:0.5/0.58/0.66 edge=a3-decal-shore-foam-edge-h-r2:a3-decal-shore-foam-edge-v-r2:0.9",
    base: "execution-floor 0.62/0.72/0.74",
    walls: { "#": "coast-rock 0.6/0.72/0.78 낮은 바다" },
    zones: {
      a: "execution-floor 0.58/0.66/0.7 절벽길 어귀",
      b: "ash-camp-floor 0.62/0.7/0.72 무너진 등대 꼭대기",
      c: "execution-floor 0.7/0.78/0.82 번개 맞은 바위",
      d: "ash-cave-floor 0.6/0.66/0.68 밀수꾼 동굴 어귀",
      e: "marsh-floor 0.56/0.74/0.78 조수 웅덩이",
      f: "ash-camp-floor 0.66/0.7/0.7 봉화대",
      g: "execution-floor 0.64/0.72/0.76 동쪽 내리막",
    },
    roads: { "=": "ash-road 0.76/0.84/0.86 절벽길", "-": "ash-road 0.62/0.7/0.72 샛길" },
    places: [
      E("a", "절벽길 어귀", -29, 6, 5, 4, { rough: 0.6 }),
      E("b", "무너진 등대 꼭대기", -15, 17, 5.5, 4.5, { rough: 0.6, note: "북쪽 막다른 바위 머리" }),
      E("c", "번개 맞은 바위", -2, 3, 6, 6, { rough: 0.6, note: "웨이포인트 · 넓은 둥근 바위 머리" }),
      R("d", "밀수꾼 동굴 어귀", -21, -20, -8, -14, { rough: 0.3, note: "밀수꾼 동굴 입구 · 네모 바위 턱 — 입구(-14,-15) 바로 북쪽이 턱 끝(입구가 바다를 등진다), 남쪽 5줄이 앞마당" }),
      R("e", "조수 웅덩이", 11, -15, 20, -9, { rough: 0.3, note: "능선 곁 낮은 네모 턱" }),
      E("f", "봉화대", 17, 14, 5.5, 4.5, { rough: 0.6, note: "북동쪽 바위 머리" }),
      E("g", "동쪽 내리막", 29, -2, 4.5, 3.5, { rough: 0.6 }),
    ],
    paths: [
      P([[-30, 6], [-24, 11], [-18, 4.5], [-12, 8], [-7, 3]], 3, "=", 1, { wobble: 0.5 }),               // 서쪽 능선
      P([[4, 3], [9, -2.5], [14, 2.5], [20, -4], [25, 0.5], [30, -2]], 3, "=", 1, { wobble: 0.5 }),       // 동쪽 능선
      // 10-29 메이커: 폭 2.5 능선은 양쪽이 다 절벽 윗단 조각이라 길이 벽처럼 보였다 → 좁은 능선은 폭 3 (가운데 한 줄이 바닥)
      P([[-3, 5], [-5, 9.5], [-8, 12], [-12, 14]], 3, "-", 1, { wobble: 0.5 }),                                   // 등대 꼭대기로
      // 밀수꾼 턱으로 — 입구가 남쪽으로 열려 있어 북쪽에서 닿으면 입구 그림 지붕 위로 걸어 들어갔다 → 턱 동쪽 바다 위로 내려가 남동쪽에서 앞마당으로 (10-29)
      P([[-4.5, -3], [-4.5, -18.5], [-8, -18.5]], 3, "-", 1, { wobble: 0 }),   // 곧은 선은 칸 가운데(.5)를 지나야 폭 3이 3칸으로 파인다
      P([[14, 2.5], [15, 6], [16, 10]], 3, "-", 1, { wobble: 0.5 }),                                   // 봉화대로
      P([[16, 0.5], [15, -4], [15, -9]], 3, undefined, undefined, { wobble: 0.5 }),                 // 조수 웅덩이 턱으로
    ],
    gates: { W: [-34, 6], E: [33, -2] },
    holes: { smuggler1: [-14, -15] },
    waypoint: [-2, 3],
    put: [["set", "a3_lm_lightning_totem", 4.0, 2.6]],
    backdrop: "0.18/0.34/0.39",   // 10-29 맵 밖 = 어두운 바다 (메이커 캡처의 낮은 칸 바다 실측색 — 템플릿 갈색이 주황으로 떴다)
    dress: {
      a: { props: ["scorched-rock", "a3-kelp-rock"], n: 3, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 3 },
      b: { sets: ["a3_lighthouse_fall"], props: ["broken-beacon", "scorched-rock", "a3-drift-crates"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 4 },
      c: { props: ["scorched-rock", "salt-crystals", "harbor-lantern"], n: 7, decals: ["a3-decal-tide-puddle", "a4-decal-scorch", "a3-decal-salt-crust"], dn: 6 },   // 번개 토템은 put (웨이포인트 동쪽 — 그림이 웨이포인트를 가리지 않게)
      d: { sets: ["a3_smuggler_cache"], props: ["smuggler-crates", "harbor-barrels"], n: 5, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
      e: { sets: ["a3_tidepool"], props: ["tidal-pool", "a3-kelp-rock"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-foam-line"], dn: 4 },
      f: { props: ["broken-beacon", "a3-rusted-cannon", "scorched-rock"], n: 4, decals: ["a3-decal-tide-puddle", "a4-decal-scorch"], dn: 4 },
      g: { props: ["scorched-rock", "a3-kelp-rock"], n: 3, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 3 },
    },
  },

  drownedvillage: {
    size: [70, 50],
    title: "가라앉은 어촌",
    story: ["바다가 삼킨 어촌. 둑길이 반쯤 잠긴 집들 곁을 지나 마을 광장(웨이포인트)으로 나온다.", "북동쪽 물에 잠긴 예배당 입구, 남서쪽 고래 뼈 해변, 남동쪽 부서진 둑길. 동쪽 등대길이 폭풍 등대로."],
    base: "marsh-floor 0.66/0.9/0.78",
    walls: COAST,
    zones: {
      a: "marsh-floor 0.6/0.82/0.74 마을 어귀",
      b: "ash-camp-floor 0.62/0.76/0.72 가라앉은 집들",
      c: "execution-floor 0.74/0.84/0.82 마을 광장",
      d: "cellar-floor 0.66/0.76/0.78 예배당 어귀",
      e: "sand-floor 0.58/0.69/0.76 고래 뼈 해변",
      f: "marsh-floor 0.58/0.8/0.8 부서진 둑길",
      g: "marsh-floor 0.7/0.88/0.8 동쪽 등대길",
    },
    roads: { "=": "ash-road 0.72/0.64/0.52 판자 둑길", "-": "ash-road 0.62/0.58/0.5 판자 샛길" },
    places: [
      E("a", "마을 어귀", -28, 0, 6, 5),
      R("b", "가라앉은 집들", -21, 6, -4, 16, { rough: 1.3 }),
      E("c", "마을 광장", 0, -2, 8, 6, { note: "웨이포인트" }),
      E("d", "예배당 어귀", 14, 13, 8, 5, { note: "물에 잠긴 예배당 입구" }),
      E("e", "고래 뼈 해변", -12, -14, 9, 5),
      E("f", "부서진 둑길", 16, -12, 9, 6),
      E("g", "동쪽 등대길", 28, 2, 5, 5),
    ],
    paths: [
      P([[-35, 0], [-28, 0], [-18, 2], [-8, 0], [0, -2], [8, 0], [16, 2], [22, 3], [28, 2], [34, 2]], 4, "=", 2),
      P([[-14, 2], [-12, 6]], 3, "-", 1), P([[4, 4], [10, 10], [13, 12]], 3, "-", 1), P([[-6, -6], [-10, -12]], 3, "-", 1),
      P([[8, -4], [14, -8]], 3, "-", 1), P([[-2, -15], [8, -14]], 3),
    ],
    rocks: [rock(-28, 10, 3, 3), rock(-27, -12, 3, 3), rock(28, 12, 3, 3), rock(28, -12, 3, 3), rock(2, 8, 2.5, 2)],
    gates: { W: [-34, 0], E: [33, 2] },
    holes: { seachapel: [15, 14] },
    waypoint: [1, 1],
    put: [["prop", "drowned-hut", -16, 12.8], ["prop", "drowned-hut", -9, 13.2, 1, 1], ["prop", "drowned-hut", -13.5, 8.6, 0.9], ["prop", "chapel-pillar", 18.5, 15.6]],
    dress: {
      a: { props: ["a3-kelp-rock", "broken-boardwalk", "tidal-pool"], n: 6, decals: coastDecals, dn: 3, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { sets: ["a3_lm_belfry_roof"], props: ["broken-boardwalk", "fishing-net", "a3-drift-crates", "harbor-barrels"], n: 7, decals: ["a3-decal-seaweed", "a3-decal-tide-puddle"], dn: 6 },
      c: { sets: ["a3_fish_camp"], props: ["harbor-lantern", "harbor-barrels", "a3-crab-in-bucket"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-shells", "a3-decal-rope-scraps"], dn: 6 },
      d: { props: ["chapel-pillar", "tidal-pool"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
      e: { sets: ["a3_leviathan"], props: ["a3-kelp-rock", "a3-crab-shell-pile"], n: 5, decals: coastDecals, dn: 4, decals: ["a3-decal-tide-puddle"], dn: 2 },
      f: { sets: ["a3_smuggler_cache"], props: ["broken-boardwalk", "a3-capsized-boat", "tidal-pool"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-foam-line"], dn: 5 },
      g: { props: ["a3-kelp-rock", "harbor-lantern"], n: 5, decals: coastDecals, dn: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
    },
  },

  // 등대 3층 · 폭풍의 눈 — 액트 1 납골당·여왕의 무덤 자리를 좌우(+상하)로 뒤집어 다시 쓴다 (액트 2 사원은 상하만 뒤집음)
  lighthouse1: remix(A1.crypt1, Object.assign({}, LIGHT, {
    title: "폭풍 등대 1층",
    story: ["등대 아랫단. 기둥 넷이 받친 등대 홀(웨이포인트)을 창고 회랑·등유 저장고·침수된 방이 둘러싼다. 남쪽 저장고 바닥에 등대지기의 집으로 가는 문.", "(자리: 납골당 1층을 좌우·상하로 뒤집음 — 들어온 문이 동쪽)"],
    holes: { keeperhouse: [12, -8] },
    dress: Object.assign({}, lightDress, { d: Object.assign({}, lightDress.d, { sets: ["a3_lm_spiral_stair"] }) }),   // 10-28 랜드마크
  }), { fx: true, fy: true }),
  lighthouse2: remix(A1.crypt2, Object.assign({}, LIGHT, {
    title: "폭풍 등대 2층",
    story: ["기둥이 늘어선 긴 나선 회랑. 곁방마다 등유 통과 부서진 렌즈가 쌓였다. (자리: 납골당 2층을 좌우로 뒤집음)"],
    dress: Object.assign({}, lightDress, { d: Object.assign({}, lightDress.d, { sets: ["a3_lm_lens_stand"] }) }),   // 10-28 랜드마크
  }), { fx: true }),
  lighthouse3: remix(A1.crypt3, Object.assign({}, LIGHT, {
    title: "폭풍 등대 3층",
    story: ["불 꺼진 등롱실로 오르는 마지막 층. 넓은 렌즈 홀을 지나면 꼭대기 계단. (자리: 납골당 3층을 좌우·상하로 뒤집음)"],
    zones: Object.assign({}, LIGHT.zones, { e: "execution-floor 0.84/0.9/0.94 렌즈 홀" }),
    dress: Object.assign({}, lightDress, { e: { sets: ["a3_lm_storm_bell"], props: ["lighthouse-lens", "broken-beacon", "harbor-lantern"], n: 6, decals: ["a3-decal-salt-crust"], dn: 4 } }),
  }), { fx: true, fy: true }),
  stormeye: remix(A1.queentomb, {
    title: "폭풍의 눈",
    story: ["등대 꼭대기. 무너진 등롱 회랑과 선원들의 방을 지나 폭풍의 눈 — 익사한 제독 바렌이 부서진 돛대 앞에 선다.", "(자리: 여왕의 무덤을 좌우로 뒤집음 — 들어온 문이 동쪽 · 호위는 회랑에만)"],
    base: "execution-floor 0.66/0.9/0.78",
    walls: { "#": "lighthouse 0.72/0.92/0.95 등대 꼭대기 벽" },
    zones: {
      a: "execution-floor 0.62/0.78/0.76 꼭대기 계단",
      b: "cellar-floor 0.62/0.72/0.74 선원들의 방",
      c: "ash-camp-floor 0.6/0.72/0.72 부서진 등롱 회랑",
      d: "execution-floor 0.7/0.82/0.82 봉인된 문간",
      e: "execution-floor 0.76/0.92/0.9 폭풍의 눈",
    },
    fixed: { admiral: [-18, 4] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    put: [["set", "boss_admiral", -17.5, 4.5, 1, 1], ["set", "a3_lm_admiral_anchor", -17.5, 9.3]],
    dress: {
      a: { props: ["lighthouse-stairs", "harbor-lantern"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["harbor-barrels", "a3-drift-crates", "fishing-net"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 5 },
      c: { props: ["broken-beacon", "harbor-lantern", "a3-rusted-cannon"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 5 },
      d: { props: ["harbor-lantern"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      e: { props: ["a3-rusted-cannon", "harbor-lantern", "wreck-anchor"], n: 6, decals: ["a3-decal-foam-line", "a3-decal-tide-puddle"], dn: 8 },
    },
  }, { fx: true }),

  // 곁가지 7장
  crabcave1: remix(A1.pit1, Object.assign({}, WETCAVE("ash-cave-floor", "0.7/0.8/0.82"), {
    title: "집게 동굴 1층",
    story: ["갯벌 아래 바닷물이 드나드는 굴. 껍질 비탈을 내려가 집게 둥지 광장을 지나면 아래 굴. (자리: 뼈 구덩이 1층을 좌우·상하로 뒤집음)"],
    zones: { a: "ash-cave-floor 0.66/0.76/0.78 굴 어귀", b: "marsh-floor 0.6/0.76/0.78 껍질 비탈", c: "sand-floor 0.58/0.69/0.76 집게 둥지 광장", d: "ash-cave-floor 0.58/0.66/0.7 매복 굴", e: "marsh-floor 0.56/0.72/0.76 바닷물 고리길", f: "ash-cave-floor 0.66/0.74/0.76 아래 굴" },
    dress: {
      a: { props: ["salt-crystals"], n: 3, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["a3-crab-shell-pile", "salt-crystals"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-shells"], dn: 4 },
      c: { sets: ["a3_tidepool"], props: ["a3-crab-shell-pile", "a3-kelp-rock", "a3-crab-in-bucket"], n: 7, decals: ["a3-decal-shells", "a3-decal-tide-puddle"], dn: 6 },
      d: { sets: ["a3_lm_shell_mound"], props: ["a3-kelp-rock", "salt-crystals"], n: 5, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
      e: { props: ["tidal-pool", "a3-crab-shell-pile"], n: 5, decals: ["a3-decal-tide-puddle"], dn: 4 },
      f: { props: ["salt-crystals"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
    },
  }), { fx: true, fy: true }),
  crabcave2: remix(A1.pit2, Object.assign({}, WETCAVE("ash-cave-floor", "0.68/0.78/0.8"), {
    title: "집게 동굴 2층",
    put: [["set", "a3_lm_crab_throne", 17.5, 8.3]],
    extra: { end: [17, 5], return: [23, 7] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["굴 가장 깊은 곳, 바위 집게 왕 크라그의 웅덩이. 웅덩이 구석에 되돌아가는 문. (자리: 뼈 구덩이 2층을 위아래로 뒤집음)"],
    zones: { a: "ash-cave-floor 0.66/0.76/0.78 계단참", b: "marsh-floor 0.6/0.76/0.78 껍질 무더기 길", c: "ash-cave-floor 0.58/0.66/0.7 북쪽 굴", d: "marsh-floor 0.66/0.84/0.86 집게 왕의 웅덩이" },
    dress: {
      a: { props: ["salt-crystals"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["a3-crab-shell-pile", "salt-crystals", "a3-kelp-rock"], n: 8, decals: ["a3-decal-tide-puddle", "a3-decal-shells"], dn: 5 },
      c: { props: ["a3-kelp-rock", "tidal-pool"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
      d: { props: ["a3-crab-shell-pile", "tidal-pool", "a3-crab-in-bucket"], n: 9, decals: ["a3-decal-tide-puddle", "a3-decal-shells"], dn: 7 },
    },
  }), { fy: true }),
  wreckhold: remix(A1.hollow, Object.assign({}, {
    title: "난파선 선창",
    story: ["뒤집힌 난파선의 선창. 썩은 칸막이 사이 통로가 짐칸 한가운데로 모이고, 가장 깊은 선미 칸에 봉인 상자와 되돌아가는 문. (자리: 굶주린 굴을 위아래로 뒤집음)"],
    base: "cellar-floor 0.74/0.66/0.56",
    walls: { "#": "shiphold 1/1/1 선창 판자 벽" },
    zones: { a: "cellar-floor 0.7/0.62/0.52 갑판 구멍", b: "ash-road 0.62/0.56/0.48 칸막이 통로", c: "cellar-floor 0.64/0.58/0.5 물 찬 화물칸", d: "cellar-floor 0.8/0.7/0.58 짐칸", e: "ash-road 0.58/0.52/0.46 돛 창고", f: "cellar-floor 0.6/0.54/0.46 선미 칸" },
    dress: {
      a: { props: ["harbor-barrels"], n: 3, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["a3-drift-crates", "fishing-net"], n: 5, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 5 },
      c: { sets: ["a3_lm_cargo_souls"], props: ["harbor-barrels", "tidal-pool", "a3-kelp-rock"], n: 7, decals: ["a3-decal-tide-puddle"], dn: 4 },
      d: { sets: ["a3_smuggler_cache"], props: ["wreck-anchor", "harbor-barrels", "a3-drift-crates"], n: 9, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps", "a3-decal-seaweed"], dn: 7 },
      e: { props: ["fishing-net", "a3-broken-mast"], n: 5, decals: ["a3-decal-tide-puddle"], dn: 2 },
      f: { props: ["harbor-barrels", "harbor-lantern"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
    },
  }), { fy: true }),
  smuggler1: remix(A1.cellar1, Object.assign({}, WETCAVE("bone-floor", "0.7/0.76/0.76", "밀수꾼 동굴 벽"), {
    title: "밀수꾼 동굴 1층",
    story: ["절벽 밑 밀수꾼들의 동굴. 화물 창고 둘 사이 좁은 물길이 매복 길목, 고리길로 돌면 등불 걸린 우물방. (자리: 지하실 1층을 좌우·상하로 뒤집음)"],
    zones: { a: "bone-floor 0.64/0.7/0.7 굴 입구", b: "ash-camp-floor 0.66/0.7/0.68 화물 창고", c: "ash-camp-floor 0.62/0.68/0.68 술 창고", d: "marsh-floor 0.52/0.66/0.66 물길", e: "bone-floor 0.78/0.82/0.8 등불 우물방", f: "bone-floor 0.66/0.72/0.72 아래 굴" },
    put: [["prop", "harbor-lantern", -16, -1, 1, 0]],
    dress: {
      a: { props: ["smuggler-crates"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { sets: ["a3_lm_crate_tower"], props: ["smuggler-crates", "a3-drift-crates", "harbor-barrels"], n: 11, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 5 },
      c: { props: ["harbor-barrels", "smuggler-crates"], n: 9, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 4 },
      d: { decals: ["a3-decal-tide-puddle"], dn: 4 },
      e: { props: ["harbor-lantern", "smuggler-crates"], n: 4, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
      f: { props: ["harbor-barrels"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
    },
  }), { fx: true, fy: true }),
  smuggler2: remix(A1.cellar2, Object.assign({}, WETCAVE("bone-floor", "0.68/0.74/0.74", "밀수꾼 동굴 벽"), {
    title: "밀수꾼 동굴 2층",
    put: [["set", "a3_lm_map_table", -17.5, 11.3]],
    extra: { end: [-18, 8], return: [-25, 10] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["밀수꾼 두목 렌의 은신처. 장물 창고와 물 고인 방을 지나면 두목의 금고 방, 구석에 되돌아가는 문. (자리: 지하실 2층을 좌우·상하로 뒤집음)"],
    zones: { a: "bone-floor 0.64/0.7/0.7 계단참", b: "ash-camp-floor 0.66/0.7/0.68 장물 창고", c: "marsh-floor 0.52/0.66/0.66 물 고인 방", d: "bone-floor 0.7/0.74/0.72 갈림 방", e: "ash-camp-floor 0.78/0.76/0.7 두목의 금고 방" },
    dress: {
      a: { props: ["smuggler-crates"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["smuggler-crates", "a3-drift-crates", "harbor-barrels"], n: 9, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
      c: { props: ["tidal-pool", "a3-kelp-rock", "harbor-barrels"], n: 7, decals: ["a3-decal-tide-puddle"], dn: 5 },
      d: { props: ["harbor-lantern"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      e: { sets: ["a3_smuggler_cache"], props: ["smuggler-crates", "a3-rusted-cannon", "harbor-lantern"], n: 8, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps", "a3-decal-salt-crust"], dn: 7 },
    },
  }), { fx: true, fy: true }),
  seachapel: remix(A2.archive, {
    title: "물에 잠긴 예배당",
    put: [["set", "a3_lm_blue_pulpit", -20.5, 9.3]],
    extra: { end: [-21, 6], return: [-26, -8] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["바닷물이 차오른 예배당. 신도석 줄이 늘어선 기도실 셋이 회랑으로 이어지고, 가장 안쪽 제단에 물에 잠긴 사제 세드릭. 제단 구석에 되돌아가는 문.", "(자리: 잊힌 서고를 좌우로 뒤집음 — 서가 줄이 신도석 줄)"],
    base: "cellar-floor 0.7/0.8/0.82",
    walls: { "#": "chapel 1/1/1 예배당 벽", "%": "ruin-wall 0.7/0.76/0.76 신도석 줄" },
    zones: {
      a: "cellar-floor 0.62/0.72/0.74 무너진 문간",
      b: "execution-floor 0.68/0.78/0.8 서쪽 기도실",
      c: "execution-floor 0.66/0.76/0.78 북쪽 기도실",
      d: "marsh-floor 0.56/0.74/0.76 잠긴 회랑",
      e: "execution-floor 0.64/0.74/0.76 남쪽 기도실",
      f: "cellar-floor 0.8/0.9/0.92 물에 잠긴 제단",
    },
    dress: {
      a: { props: ["chapel-pillar"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["chapel-pillar", "tidal-pool", "harbor-lantern"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
      c: { props: ["chapel-pillar", "a3-kelp-rock"], n: 6, decals: ["a3-decal-tide-puddle"], dn: 4 },
      d: { props: ["tidal-pool"], n: 2, decals: ["a3-decal-tide-puddle", "a3-decal-foam-line", "a3-decal-seaweed"], dn: 5 },
      e: { props: ["chapel-pillar", "tidal-pool"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 4 },
      f: { props: ["chapel-pillar", "harbor-lantern", "a3-kelp-rock"], n: 8, decals: ["a3-decal-tide-puddle", "a3-decal-seaweed"], dn: 7 },
    },
  }, { fx: true }),
  keeperhouse: remix(A1.cave, Object.assign({}, {
    title: "등대지기의 집",
    put: [["prop", "a3-landmark-mad-lens-workbench", -21.5, 11.3, 1.15, 0]],   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["등대 아래 등대지기의 집과 이어진 지하 굴. 서재·작업장 굴을 지나 가장 깊은 곳에 미친 등대지기 하울. 구석에 되돌아가는 문. (자리: 목매단 동굴을 좌우·상하로 뒤집음)"],
    base: "cellar-floor 0.74/0.7/0.64",
    walls: { "#": "shiphold 0.9/0.9/0.9 판자 벽" },
    zones: { a: "cellar-floor 0.68/0.64/0.58 지하 문", b: "ash-road 0.64/0.6/0.54 서재 굴", c: "cellar-floor 0.66/0.64/0.6 작업장 굴", d: "cellar-floor 0.74/0.7/0.62 등유 굴", e: "cellar-floor 0.62/0.6/0.56 등대지기의 방" },
    dress: {
      a: { props: ["harbor-lantern"], n: 2, decals: ["a3-decal-tide-puddle"], dn: 2 },
      b: { props: ["keeper-desk", "bookshelf", "burnt-paper"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 4 },
      c: { props: ["a3-broken-trap", "harbor-barrels", "a3-drift-crates"], n: 7, decals: ["a3-decal-tide-puddle", "a3-decal-salt-crust"], dn: 4 },
      d: { props: ["harbor-barrels", "harbor-lantern"], n: 6, decals: ["a3-decal-tide-puddle"], dn: 2 },
      e: { props: ["keeper-desk", "lighthouse-lens", "harbor-lantern"], n: 6, decals: ["a3-decal-tide-puddle", "a3-decal-rope-scraps"], dn: 5 },
    },
  }), { fx: true, fy: true }),
};

// 설계 42 높이감 · 층 겹쌓기 (10-28 저녁 사용자): 등대 층 = 바다 위로 솟은 등대 바닥. 층이 높을수록 앞면(등대 벽) 띠가 깊고 아래 바다가 어둡다.
//   폭풍의 눈(보스 층)은 낮은 칸에 아래층 바닥이 작고 어둡게 내려다보인다
const LIGHT_HEIGHT = {
  lighthouse1: [1, "low=a3-shallow-sea-floor-r2:0.66/0.76/0.84"], lighthouse2: [2, "low=a3-shallow-sea-floor-r2:0.52/0.62/0.72"],
  lighthouse3: [3, "low=a3-shallow-sea-floor-r2:0.4/0.5/0.62"], stormeye: [3, "below=execution-floor:0.55:0.62:0.62/0.8/0.9"],
};
//   10-29 코덱스 폭풍 등대 전용 벽(walltop-v1 승인 · 전체 납품): 가장자리 9조각 a3-lighthouse-wall-borders-* · 앞면 a3-lighthouse-wall-face-s + 끊긴 끝 sw·se(lib.cjs가 띠 양끝에 자동)
//   10-29 사용자 결정(그림은 그대로 · 빌더로 먼저): seam= 앞면 첫 단 맨 위 0.5칸 그늘(턱 밑) · mix= 바탕(center)·북쪽 테두리(n) 칸 좌표 좌우 섞기 — 이 묶음에만
for (const [id, [t, low]] of Object.entries(LIGHT_HEIGHT)) module.exports[id].raised = `a3-lighthouse-wall 1/1/1 등대 층 바닥 tiers=${t} top=zone face=a3-lighthouse-wall-face back=a3-lighthouse-wall-borders-center seam=0.45:0.5 mix=center,n ${low}`;

// ───────── 10-28 밤 코덱스 액트 3 나머지 44장(assets/codex-a3-handmade-v1, r2 「얕은 바다」 결) ─────────
// 위 설계서의 액트 1 바닥(파란색을 칠해 쓰던 것)을 액트 3 그림으로 바꾼다. 자리·길·충돌은 그대로. 소금 갯벌은 이미 r2라 그대로.
//   그동안 깔아 둔 임시 젖은 효과(파랗게 칠한 바닥 · 웅덩이 무늬)는 걷어 낸다 — 새 그림이 이미 푸르고 젖어 있다
const A3_FLOOR = {
  "execution-floor": "a3-barnacle-stone-floor-r2", "cellar-floor": "a3-wet-plank-floor-r2", "ash-camp-floor": "a3-salt-crust-floor-r2",
  "ash-road": "a3-wet-cobble-road-r2", "sand-floor": "a3-wet-sand-floor-r2", "marsh-floor": "a3-tidal-flat-floor-r2",
  "ash-cave-floor": "a3-barnacle-stone-floor-r2", "bone-floor": "a3-salt-crust-floor-r2",
};
// 옛 색은 푸른빛을 입히던 값이라 밝기만 남기고(회색) 어둡게 하는 몫은 절반으로
const neutral = (t) => { const v = t.split("/").map(Number), m = (v[0] + v[1] + v[2]) / 3, k = Math.round((1 - (1 - m) * 0.5) * 100) / 100; return `${k}/${k}/${k}`; };
const a3Art = (line, swap) => {
  const [art, tint, ...name] = line.split(" ");
  const to = (swap && swap[art]) || A3_FLOOR[art];
  return to ? [to, neutral(tint), ...name].join(" ") : line;
};
const A3_WALL = {
  "coast-rock": "a3-coast-rock-wall-r2 1/1/1", "wet-cave": "a3-coast-rock-wall-r2 0.82/0.82/0.82", "shiphold": "a3-wreck-timber-wall-r2 1/1/1",
};
const A3_DECAL = {
  "a3-decal-tide-puddle": "a3-decal-seawater-puddle-r2", "a3-decal-seaweed": "a3-decal-seaweed-pile-r2", "a3-decal-foam-line": "a3-decal-wave-foam-line-r2",
  "a3-decal-salt-crust": "a3-decal-salt-band-r2", "a3-decal-shells": "a3-decal-tide-stain-r2", "a3-decal-rope-scraps": "a3-decal-wet-footprints-r2",
};
const A3_ADJUNCT = {
  "harbor-barrels": "a3-adjunct-drift-barrel-r2", "harbor-lantern": "a3-adjunct-broken-lantern-r2", "fishing-net": "a3-adjunct-wet-net-pile-r2",
  "a3-drift-crates": "a3-adjunct-salt-sack-r2", "a3-crab-shell-pile": "a3-adjunct-shell-pile-r2", "a3-broken-trap": "a3-adjunct-crab-pot-r2",
  "a3-kelp-rock": "a3-adjunct-seaweed-post-r2", "a3-broken-mast": "a3-adjunct-broken-oar-r2", "a3-capsized-boat": "a3-adjunct-broken-oar-r2",
  "a3-rusted-cannon": "a3-adjunct-rusty-hook-r2", "wreck-anchor": "a3-adjunct-barnacle-anchor-chain-r2", "smuggler-crates": "a3-adjunct-salt-sack-r2",
};
// 맵마다 바꿔 끼울 것: 부두·둑길은 판자, 예배당은 물에 잠긴 타일, 비 오는 바깥 맵은 빗물 고임 · 번개 절벽은 번개 그을음
const A3_SWAP = {
  harbor: { zones: { b: "a3-wet-plank-floor-r2" } },
  drownedvillage: { roads: { "=": "a3-plank-boardwalk-road-r2", "-": "a3-plank-boardwalk-road-r2" }, zones: { b: "a3-drowned-tile-floor-r2" } },
  seachapel: { all: { "cellar-floor": "a3-drowned-tile-floor-r2", "execution-floor": "a3-drowned-tile-floor-r2" } },
  wreckcoast: { zones: { a: "a3-tidal-flat-floor-r2", b: "a3-wet-plank-floor-r2", c: "a3-wet-plank-floor-r2" } },
  wreckhold: { all: { "ash-road": "a3-wet-plank-floor-r2" } },   // 배 안은 판자
  keeperhouse: { all: { "ash-road": "a3-wet-plank-floor-r2" } },
};
const A3_EXTRA_DECAL = { stormcliff: ["a3-decal-lightning-scorch-r2", "a3-decal-rain-puddles-r2"], wreckcoast: ["a3-decal-wet-sand-ripple-r2", "a3-decal-crab-tracks-r2"], drownedvillage: ["a3-decal-rain-puddles-r2"], harbor: ["a3-decal-rain-puddles-r2"] };
const SEA = new Set(["a3-shallow-sea-floor-r2", "a3-tidal-flat-floor-r2"]);
// 10-28 밤 곁 조각 10을 세트로 묶는다 (map_sets.csv a3_dock_cargo 부두 짐더미 · a3_anchor_chain 닻사슬 더미 · a3_tide_wrack 밀물이 남긴 것) — 세트가 없던 장소마다 하나씩
const MORE = {
  harbor: { b: ["a3_dock_cargo"] },   // 남문 길(e)은 좁아 광장 한가운데로 밀려났다 → 넣지 않는다
  saltflat: { a: ["a3_tide_wrack"], g: ["a3_anchor_chain"] },
  wreckcoast: { a: ["a3_tide_wrack"], c: ["a3_dock_cargo"], g: ["a3_anchor_chain"] },
  stormcliff: { a: ["a3_anchor_chain"], f: ["a3_dock_cargo"], g: ["a3_tide_wrack"] },
  drownedvillage: { a: ["a3_tide_wrack"], d: ["a3_anchor_chain"], g: ["a3_dock_cargo"] },
  lighthouse1: { b: ["a3_dock_cargo"], c: ["a3_anchor_chain"], e: ["a3_tide_wrack"] },
  lighthouse2: { b: ["a3_anchor_chain"], c: ["a3_dock_cargo"], f: ["a3_tide_wrack"] },
  lighthouse3: { b: ["a3_dock_cargo"], c: ["a3_anchor_chain"], f: ["a3_tide_wrack"] },
  stormeye: { b: ["a3_dock_cargo"], c: ["a3_anchor_chain"] },
  crabcave1: { b: ["a3_tide_wrack"], e: ["a3_anchor_chain"] },
  crabcave2: { b: ["a3_tide_wrack"], c: ["a3_anchor_chain"] },
  wreckhold: { b: ["a3_dock_cargo"], e: ["a3_anchor_chain"] },
  smuggler1: { c: ["a3_dock_cargo"], e: ["a3_anchor_chain"] },
  smuggler2: { b: ["a3_dock_cargo"], c: ["a3_tide_wrack"] },
  seachapel: { d: ["a3_tide_wrack"], b: ["a3_anchor_chain"] },
  keeperhouse: { c: ["a3_dock_cargo"], d: ["a3_anchor_chain"] },
};
for (const [id, zones] of Object.entries(MORE)) for (const [z, sets] of Object.entries(zones)) {
  const d = Object.assign({}, module.exports[id].dress[z] || {});
  d.sets = [...(d.sets || []), ...sets];
  module.exports[id].dress = Object.assign({}, module.exports[id].dress, { [z]: d });
}
// 10-29 길 위 사건 (기획서 39 #7 A): 사냥터 7장에 장치 하나씩 — 걷는 길(W→E)에서 1~5칸 · 장소 안 · 포털 6.5칸·웨이포인트 4.5칸 밖 (kit.cjs roadEvents)
//   신전 2 · 상자 2 · 둥지 1 · 의식 2 (액트 4와 합쳐 종류마다 4). 자리는 지금 설계도·배치표에서 경고 없이 서는 칸을 골랐다
require("./kit.cjs").roadEvents(module.exports, 3, {
  saltflat: ["shrine", 8, -6, 0],        // 소금 결정 밭 — 둑길에서 4칸, 소금 결정 사이 신전
  wreckcoast: ["chest", -8, 1, 1],       // 부서진 부두 — 해안길 바로 곁 난파 궤짝 (지나가면 열린다)
  stormcliff: ["nest", -7, 3, 0],        // 번개 맞은 바위 — 서쪽 능선이 바위 머리에 닿는 자리
  drownedvillage: ["ritual", 5, -5, 0],  // 마을 광장 남동쪽 — 익사자 의식
  lighthouse1: ["chest", -23, 11, 0],    // 무너진 선반 방 — 꼭대기 계단 가는 길
  lighthouse2: ["ritual", -1, 2, 0],     // 창고 회랑 가운데
  lighthouse3: ["shrine", -18, 3, 0],    // 렌즈 홀 — 등대 렌즈 받침 신전
});
for (const [id, sp] of Object.entries(module.exports)) {
  if (id === "saltflat") {   // 이미 r2 — 거품만 새 경계 띠(가로·세로)로
    sp.shore = "a3-shallow-sea-floor-r2+a3-tidal-flat-floor-r2 a3-decal-shore-foam-edge-h-r2 0.9 - a3-decal-shore-foam-edge-v-r2";
    sp.dress = Object.fromEntries(Object.entries(sp.dress || {}).map(([z, d]) => [z, Object.assign({}, d, { props: d.props ? [...new Set([...d.props, ...d.props.map((p) => A3_ADJUNCT[p]).filter(Boolean)])] : d.props, decals: d.decals ? [...new Set(d.decals.map((x) => A3_DECAL[x] || x))] : d.decals })]));
    continue;
  }
  const sw = A3_SWAP[id] || {};
  sp.base = a3Art(sp.base, sw.all);
  sp.zones = Object.fromEntries(Object.entries(sp.zones || {}).map(([k, v]) => {
    const z = sw.zones && sw.zones[k];
    return [k, z ? [z, neutral(v.split(" ")[1]), ...v.split(" ").slice(2)].join(" ") : a3Art(v, sw.all)];
  }));
  if (sp.roads) sp.roads = Object.fromEntries(Object.entries(sp.roads).map(([k, v]) => {
    const r = sw.roads && sw.roads[k];
    return [k, r ? [r, "1/1/1", ...v.split(" ").slice(2)].join(" ") : a3Art(v, sw.all)];
  }));
  sp.walls = Object.fromEntries(Object.entries(sp.walls || {}).map(([k, v]) => {
    const [art, , ...name] = v.split(" ");
    return [k, A3_WALL[art] ? `${A3_WALL[art]} ${name.join(" ")}${art === "shiphold" ? "" : " top=a3-coast-rock-top-r2"}` : v];
  }));
  const extra = A3_EXTRA_DECAL[id] || [];
  sp.dress = Object.fromEntries(Object.entries(sp.dress || {}).map(([z, d], i) => {
    const props = d.props ? [...new Set([...d.props, ...d.props.map((p) => A3_ADJUNCT[p]).filter(Boolean)])] : d.props;
    let decals = d.decals ? [...new Set(d.decals.map((x) => A3_DECAL[x] || x))] : d.decals;
    if (decals && extra.length) decals = [...new Set([...decals, extra[i % extra.length]])];
    return [z, Object.assign({}, d, props ? { props } : {}, decals ? { decals } : {})];
  }));
  // 물(얕은 바다·갯벌) 구역이 있는 맵은 물가 거품 경계 띠를 켠다 (등대는 높은 칸 맵이라 낮은 칸 바다와 거품을 겹치지 않는다)
  const arts = [sp.base, ...Object.values(sp.zones), ...Object.values(sp.roads || {})].map((v) => v.split(" ")[0]);
  if (!sp.raised && arts.some((a) => SEA.has(a)) && arts.some((a) => !SEA.has(a))) sp.shore = "a3-shallow-sea-floor-r2+a3-tidal-flat-floor-r2 a3-decal-shore-foam-edge-h-r2 0.9 - a3-decal-shore-foam-edge-v-r2";
}
// 10-29 메이커 번개 절벽: 장소 밖 능선 길(.)이 따개비 돌 바닥이라 절벽 윗단 조각과 결이 같아 벽처럼 보였다 → 바탕만 처형장 돌바닥(푸른빛)으로 남긴다
module.exports.stormcliff.base = "a3-barnacle-stone-floor-r2 0.95/1/1";   // 10-29 메이커 재캡처: 처형장 바닥(0.8/0.92/1)이 회색 바위 사이에서 진한 흙갈색 네모(구멍·진흙)로 보였다 → 바위 계열 밝은 회청 따개비 돌 (구역 바닥 0.82~0.88보다 밝게 — 능선 길이 벽 윗단과 섞이지 않게)

// 10-29 사용자 승인(「전부 추천대로」): 따개비 돌 바닥은 그림 한 장(1.28칸)마다 큰 조약돌이 같은 자리에 와 격자로 보였다 (폭풍의 눈 캡처) →
//   이 바닥을 쓰는 액트 3 맵 전부에서 그림 열마다 좌우 · 줄마다 상하 뒤집기를 칸 좌표로 섞는다 (lib.cjs ;floormix — 빌드마다 같다).
//   칸마다 따로 뒤집지 않는 까닭: 원본 PNG의 가장자리 줄이 상하 대칭이 아니라(거꾸로 맞댄 차 29 · 이웃 줄 차 18.5) 옆 칸과 금이 간다 — 열·줄 단위면 이음 차 0
// 10-29 23:22 코덱스 승인(I-2 · 사용자 위임): 뒤집기 대신 변형 3장(v2·v3·v4)을 현행과 섞어 그림 격자 칸마다 좌표 해시로 고른다 — 임의 좌우·상하 뒤집기 없음
//   (경계 보정 뒤집기만 남음 · lib.cjs floormixMode 기본 "variants" · FLOOR_VARIANTS). 이 루프가 고르는 10장 × 노말·악몽·지옥 30파일에 적용
const FLOOR_MIX = "a3-barnacle-stone-floor-r2";
for (const sp of Object.values(module.exports)) {
  const arts = [sp.base, ...Object.values(sp.zones || {})].map((v) => v.split(" ")[0]);
  if (arts.includes(FLOOR_MIX)) sp.floorMix = FLOOR_MIX;
}

// ───────── 11-01 맵 구성 v5 3단계 · 액트 3 적용 (마지막 액트 · 액트 4·1·2와 같은 생성기·규칙 · docs/review/v5-modes-20261031.md 배정표) ─────────
//   v5 = 골격 띠 + 구역 재적합 + 역할 배치 (성소형) · keep = 바닥·길 글자·이음새 그대로 + 역할 배치만 (유황 늪형). 맵별 공간 구획 = docs/review/map-audit-20261031.md 그 맵 절.
//   액트 3 정체성 = 얕은 바다(회청·남색 + 얕은 물이 덮인 바다 · 기준 = 소금 갯벌 푸른 동굴 색) — keep 맵의 물·소금·갯벌 바닥은 건드리지 않는다.
//   액트 3 맵은 다른 액트가 remix로 가져가지 않는다 — 자리 변경(고리 끊기·웨이포인트·바위)도 이 블록 안 (overrides.cjs 줄 없음).
//   보스·포털·NPC·퀘스트 오브젝트·스포너 자리는 옮기지 않는다 (maps.csv 기능 열은 compose가 설계서 자리 그대로 다시 쓴다).
//   이 블록은 위 「10-28 밤 코덱스 액트 3」 바닥·벽·꾸밈 바꿈 루프 뒤에 온다 — v5.dress의 그림 이름은 r2 그림을 바로 쓴다 (설계서 dress의 옛 그림 → r2 바꿈은 v5.dress에 적용되지 않는다).

// 1/16 소금바람 항구 (keep · 마을 · 등급 C 최소 수정): 부두 판자·항구 광장 돌바닥·큰길(=)·원래 이음새·NPC 7·상점·포털·화로·게시판·심연 문·도착 자리 모두 그대로 · 역할 배치(산발 정리)만
//   (잿불 야영지·오아시스 시장·마지막 초소와 같은 처리). 검수표 구획: 남문 길(입구) → 항구 광장(웨이포인트) · 곁 = 부두·어시장·대장간.
//   특징 공간당 1: 부두 = 닻 기념비(마을 랜드마크 · 손으로 고른 자리 그대로 — 북쪽 물가 묶인 배는 벽(바다) 위라 공간 밖) · 광장·어시장·대장간·남문 길은 특징 없이 소품 묶음.
//   검수표 「등불 산발 3 · 기둥 낱개 1」: 손으로 고른 부두 어귀 등불 둘(한 줄 쌍 — 광장 북쪽 부두 입구 양옆)만 남기고 남문 길 꾸밈 등불(낱개)은 뺐다.
//   꾸밈은 묶음 ≤3·같은 그림 맵당 ≤2 — 부두 = 통발·소금 자루 묶음(손으로 고른 그물·나무통 곁) · 어시장 = 그물·게 양동이·나무통 묶음 · 대장간 = 무기 걸이·장작·나무통 묶음 · 남문 길 = 이정표·소금 자루 묶음.
Object.assign(module.exports.harbor, {
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { decals: ["a3-decal-salt-band-r2", "a3-decal-rain-puddles-r2"], dn: 2 },
      b: { props: ["a3-adjunct-crab-pot-r2", "a3-adjunct-salt-sack-r2"], clusters: 1, decals: ["a3-decal-wet-footprints-r2"], dn: 1 },   // 부두 짐더미 세트(5칸 폭)는 NPC·화로 사이 좁은 부두에 들어가지 않아 통발·소금 자루 묶음으로
      c: { props: ["a3-adjunct-wet-net-pile-r2", "a3-crab-in-bucket", "a3-adjunct-drift-barrel-r2"], clusters: 1, decals: ["a3-decal-tide-stain-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { props: ["camp-weapon-rack", "camp-firewood", "harbor-barrels"], clusters: 1, decals: ["a1-decal-ash-campfire", "a3-decal-rain-puddles-r2"], dn: 2 },
      e: { props: ["mp-signpost", "a3-adjunct-salt-sack-r2"], clusters: 1, decals: ["a3-decal-wet-footprints-r2"], dn: 1 },
    },
  },
});

// 2/16 소금 갯벌 (keep · 상위 5 최소 수정 · 등급 C): 얕은 바다 바탕·회청 모래톱·갯벌·둑길(=)·갯골 길(-)·물가 거품 띠·원래 이음새·장소 세트 그대로 · 길 안내 0 · 산발 정리만
//   (검수표 구획: 갯벌 어귀 → 물웅덩이(웨이포인트) → 소금 결정 밭 → 동쪽 둑, 곁 = 고래 뼈 모래톱·어부 야영지·집게 동굴 어귀(굴 입구)).
//   장소 세트는 원래 설계서 그대로(특징 자리도 기준 배치표 그대로 featureAt) — 고래 뼈 모래톱 = 바다 괴물의 뼈 · 소금 결정 밭 = 소금 결정 기둥(랜드마크) ·
//   물웅덩이 = 조수 웅덩이 세트 · 어부 야영지 = 어부의 자리 세트 · 갯벌 어귀 = 밀물이 남긴 것 세트 · 동쪽 둑 = 닻사슬 더미 세트 · 집게 동굴 어귀 = 껍질·게 양동이 묶음.
//   검수표 「산발 15」(소금 결정 9 · 껍질 3 · 게 양동이 3)는 묶음 ≤3·같은 그림 맵당 ≤2로 (소금 결정은 길 위 사건 신전 세트 둘만).
// 길 위 사건 신전 세트(a3_road_shrine)의 해초 말뚝 하나는 짝 없는 낱개 말뚝(검사기 「기둥 낱개」) — 세트를 조각으로 풀어 말뚝만 뺀다 (신전 자리·소금 결정·등불·소금 띠 무늬는 그대로 · 등대 3층 신전도 같은 처리)
const roadShrineNoPost = (x, y) => [["prop", "salt-crystals", x - 1.6, y + 0.2], ["prop", "salt-crystals", x + 1.6, y + 0.4, 1, 1], ["prop", "a3-adjunct-broken-lantern-r2", x - 1.3, y - 0.8], ["decal", "a3-decal-salt-band-r2", x, y - 0.9, 1.1]];
const explodeShrine = (put) => put.flatMap((p) => (p[0] === "set" && p[1] === "a3_road_shrine" ? roadShrineNoPost(p[2], p[3]) : [p]));
Object.assign(module.exports.saltflat, {
  // 웨이포인트 (−3, −1) → (−4, −3): keep 골격(둑길을 따라 물웅덩이 남쪽 y −4를 지난다)에서 3칸 → 골격 바로 북쪽 칸 (둑길 글자 칸은 길 그림이 끊겨 피함 · waypoints.csv·WaypointData.mlua 함께 갱신)
  waypoint: [-4, -3],
  put: explodeShrine(module.exports.saltflat.put),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a3_tide_wrack"], decals: ["a3-decal-seaweed-pile-r2", "a3-decal-wave-foam-line-r2"], dn: 2 },
      b: { feature: "set:a3_leviathan", featureAt: [-10.5, 12.3], featureFlip: true, decals: ["a3-decal-seaweed-pile-r2", "a3-decal-tide-stain-r2"], dn: 2 },
      c: { sets: ["a3_tidepool"], decals: ["a3-decal-wave-foam-line-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      d: { sets: ["a3_fish_camp"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-tide-stain-r2"], dn: 2 },
      e: { props: ["a3-adjunct-shell-pile-r2", "a3-crab-in-bucket"], clusters: 1, decals: ["a3-decal-tide-stain-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      f: { feature: "set:a3_lm_salt_spire", featureAt: [18.5, -6.7], decals: ["a3-decal-salt-band-r2"], dn: 2 },
      g: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seaweed-pile-r2"], dn: 1 },
    },
  },
});

// 3/16 난파선 해안 (keep · 등급 A): 젖은 모래·갯벌·판자 바닥·해안길(=)·모래 샛길(-)·물가 거품·원래 이음새 그대로 · 길 안내 0 · 역할 배치
//   (검수표 구획: 해안 어귀 → 뱃머리 난파선 → 부서진 부두(웨이포인트) → 선창 어귀(난파선 선창 입구) → 동쪽 절벽길, 곁 = 밀수꾼 은신처·어부 마을 터).
//   검수표 「특징 과밀 2 · 랜드마크 과밀 2(특징 6)」: 뱃머리 세트(여신상 뱃머리 + 부러진 돛대) · 타륜 무덤 세트(랜드마크 + 부러진 돛대) · 선창 어귀 난파선 몸통이 겹쳤다 →
//   공간당 1 — 뱃머리 난파선 = 여신상 뱃머리 하나만 크게(×1.25 · 원래 세트 자리 · 부러진 돛대 뺌) · 선창 어귀 = 타륜 무덤(랜드마크 · 원래 자리 · 부러진 돛대 뺌) ·
//   손으로 고른 난파선 몸통(선창 어귀 · 난파선이 둘로 보였다)은 뺐다 (선창 입구 그림이 이미 뒤집힌 배 몸통이다).
//   부서진 부두 = 등불 기둥 열(부두 가장자리 일정 간격) + 부두 짐더미 세트 · 밀수꾼 은신처 = 밀수꾼 은닉처 세트 · 어부 마을 터 = 어부의 자리 세트 + 젖은 그물·부러진 노 묶음 (잠긴 집 열은 북벽 줄이 짧아 1채뿐이라 뺌) ·
//   해안 어귀 = 밀물이 남긴 것 세트 · 동쪽 절벽길 = 닻사슬 더미 세트. 상자·그물·노·돛대·젖은 그물 산발(5·5·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.wreckcoast, {
  // 웨이포인트 (1, 1) → (0, −1): keep 골격(해안길을 따라 부두 남쪽 y −2를 지난다)에서 3칸 → 골격 바로 북쪽 칸 (해안길 글자 칸은 피함 · waypoints.csv·WaypointData.mlua 함께 갱신)
  waypoint: [0, -1],
  put: module.exports.wreckcoast.put.filter((p) => p[1] !== "wreck-hull"),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a3_tide_wrack"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wet-sand-ripple-r2"], dn: 2 },
      b: { feature: "set:a3_bow_wreck", featureAt: [-14.5, 8.3], featureFlip: true, featureDrop: ["a3-broken-mast"], featureScale: 1.25, decals: ["a3-decal-seaweed-pile-r2", "a3-decal-wet-footprints-r2"], dn: 2 },
      c: { row: { name: "harbor-lantern" }, sets: ["a3_dock_cargo"], decals: ["a3-decal-wave-foam-line-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { sets: ["a3_smuggler_cache"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      e: { feature: "set:a3_lm_wheel_graveyard", featureAt: [9.5, 15.3], featureDrop: ["a3-broken-mast"], decals: ["a3-decal-crab-tracks-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      f: { sets: ["a3_fish_camp"], props: ["a3-adjunct-wet-net-pile-r2", "a3-adjunct-broken-oar-r2"], clusters: 2, decals: ["a3-decal-tide-stain-r2", "a3-decal-wet-sand-ripple-r2"], dn: 2 },
      g: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    },
  },
});

// 4/16 번개 절벽 (keep · 상위 5 최소 수정 · 등급 C): 바다 위 절벽 능선(;raised 2단 · 돌 잔교 길)·능선 길(=)·샛길(-)·낮은 바다·거품 띠·원래 이음새 그대로 · 길 안내 0 · 산발 정리만
//   (검수표 구획: 절벽길 어귀 → 번개 맞은 바위(웨이포인트) → 조수 웅덩이 → 동쪽 내리막, 곁 = 무너진 등대 꼭대기·밀수꾼 동굴 어귀(굴 입구)·봉화대).
//   빈 바닥 22%는 keep로 그대로 둔다(배정표 · 상위 5). 장소 세트는 원래 설계서 그대로 — 번개 맞은 바위 = 피뢰 토템(바위 머리 북쪽 — 아래) · 무너진 등대 꼭대기 = 떨어진 등대 꼭대기 세트(같은 바위 머리) ·
//   봉화대 = 꺼진 봉화(특징 하나) + 부두 짐더미 · 밀수꾼 동굴 어귀 = 밀수꾼 은닉처 · 조수 웅덩이 = 조수 웅덩이 세트 · 어귀 = 닻사슬 더미 · 내리막 = 밀물이 남긴 것.
//   해초 바위·꺼진 등불 산발(3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로 · 세트 안 낱개 등불 기둥·말뚝은 생성기가 뺀다.
//   피뢰 토템(손으로 고른 자리 4, 2.6)은 v5 역할 크기(3칸)로 줄며 발밑이 바위 머리 동쪽 능선 어귀(골격이 바위 머리를 나가는 곳)를 막아 골격 너비 <2칸·벽감이 생겼다 →
//   같은 바위 머리 북쪽 막다른 쪽(−0.5, 6.3)으로 토템 한 장만(세트 곁 해초 바위·대포는 좁은 바위 머리에 자리가 없어 뺌 · 웨이포인트 북동 · 웨이포인트는 그림 앞이라 가리지 않는다 · 사용자 확인 대상 랜드마크 이동).
//   떨어진 등대 꼭대기는 원래 세트 자리(−14.5, 17.3)면 바위 머리 북쪽 끝과 사이에 뒤 칸 5가 남아 생성기가 자리를 고르게 둔다(같은 바위 머리 안).
Object.assign(module.exports.stormcliff, {
  put: module.exports.stormcliff.put.filter((p) => p[1] !== "a3_lm_lightning_totem"),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a3_anchor_chain"], decals: ["a3-decal-rain-puddles-r2", "a3-decal-salt-band-r2"], dn: 2 },
      b: { feature: "set:a3_lighthouse_fall", decals: ["a3-decal-salt-band-r2", "a3-decal-lightning-scorch-r2"], dn: 2 },
      c: { feature: "set:a3_lm_lightning_totem", featureAt: [-0.5, 6.3], featureDrop: ["a3-kelp-rock", "a3-rusted-cannon"], decals: ["a3-decal-lightning-scorch-r2", "a3-decal-rain-puddles-r2", "a3-decal-salt-band-r2"], dn: 3 },
      d: { sets: ["a3_smuggler_cache"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-rain-puddles-r2"], dn: 2 },
      e: { sets: ["a3_tidepool"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wave-foam-line-r2"], dn: 2 },
      f: { feature: "prop:broken-beacon", sets: ["a3_dock_cargo"], decals: ["a3-decal-lightning-scorch-r2"], dn: 2 },
      g: { sets: ["a3_tide_wrack"], decals: ["a3-decal-rain-puddles-r2"], dn: 1 },
    },
  },
});

// 5/16 가라앉은 어촌 (keep · 등급 B): 갯벌 바탕·잠긴 타일 집터·판자 둑길(=·-)·물가 거품·원래 이음새 그대로 · 길 안내 0 · 역할 배치
//   (검수표 구획: 마을 어귀 → 가라앉은 집들 → 마을 광장(웨이포인트) → 동쪽 등대길, 곁 = 예배당 어귀(물에 잠긴 예배당 입구)·고래 뼈 해변·부서진 둑길).
//   특징 공간당 1: 가라앉은 집들 = 잠긴 종탑 지붕(랜드마크 · 같은 공간 — 북벽 집 열 앞) · 고래 뼈 해변 = 바다 괴물의 뼈(원래 자리) · 나머지는 소품 묶음.
//   손으로 고른 자리 손질: 잠긴 집 셋(산발 3 · 북쪽 둘은 북벽과 사이 뒤 칸 7~8)은 빼고 가라앉은 집들 북벽에 붙인 잠긴 집 열(반복 구조 · 벽까지 막음)로 · 예배당 입구 곁 낱개 예배당 기둥(기둥 낱개)은 뺌 (입구 그림이 예배당 문이다).
//   마을 광장 = 어부의 자리 세트(길 위 의식 제단 곁) · 예배당 어귀 = 닻사슬 더미 · 부서진 둑길 = 밀수꾼 은닉처 · 마을 어귀 = 밀물이 남긴 것 · 등대길 = 부두 짐더미.
//   등불·그물·널판 산발(3·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.drownedvillage, {
  // 웨이포인트 (1, 1) → (2, 1): keep 골격(광장을 남북으로 지나는 x 3 샛길)에서 2칸 → 1칸 동쪽, 골격 바로 곁 (waypoints.csv·WaypointData.mlua 함께 갱신)
  waypoint: [2, 1],
  put: module.exports.drownedvillage.put.filter((p) => p[1] !== "drowned-hut" && p[1] !== "chapel-pillar"),
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a3_tide_wrack"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-rain-puddles-r2"], dn: 2 },
      b: { row: { name: "drowned-hut", side: "n", step: 3.8, min: 2 }, feature: "set:a3_lm_belfry_roof", decals: ["a3-decal-seaweed-pile-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_fish_camp"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-tide-stain-r2", "a3-decal-rain-puddles-r2"], dn: 3 },
      d: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      e: { feature: "set:a3_leviathan", featureAt: [-12.5, -13.7], decals: ["a3-decal-tide-stain-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      f: { sets: ["a3_smuggler_cache"], decals: ["a3-decal-wave-foam-line-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      g: { sets: ["a3_dock_cargo"], decals: ["a3-decal-rain-puddles-r2"], dn: 1 },
    },
  },
});

// 6/16 집게 동굴 1층 (keep · 등급 B): 따개비 돌 굴 바닥·갯벌 웅덩이 구역·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (뼈 구덩이 1층·전갈 굴 1층과 같은 자리 — 같은 처리)
//   (검수표 구획: 굴 어귀 → 껍질 비탈 → 집게 둥지 광장 → 매복 굴 → 아래 굴, 곁 = 바닷물 고리길 — keep이라 고리길 통로는 그대로).
//   특징 공간당 1: 집게 둥지 광장 = 껍질 무더기(랜드마크 · 검수표 「광장 중심에」, 매복 굴에서 옮김 — 전갈 굴 1층 독 웅덩이 바위와 같은 판단) ·
//   매복 굴 = 조수 웅덩이 세트 · 껍질 비탈 = 밀물이 남긴 것 세트 · 바닷물 고리길 = 닻사슬 더미 · 굴 어귀·아래 굴 = 껍질·소금 결정 하나. 소금 결정·껍질 산발(4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.crabcave1, {
  places: module.exports.crabcave1.places.map((p) => Object.assign({}, p, { name: { a: "굴 어귀", b: "껍질 비탈", c: "집게 둥지 광장", d: "매복 굴", e: "바닷물 고리길", f: "아래 굴" }[p.z] || p.name })),   // 짝 맵(뼈 구덩이 1층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a3-adjunct-shell-pile-r2"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_tide_wrack"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-tide-stain-r2"], dn: 2 },
      c: { feature: "set:a3_lm_shell_mound", props: ["a3-crab-in-bucket", "a3-crab-shell-pile"], clusters: 1, decals: ["a3-decal-tide-stain-r2", "a3-decal-crab-tracks-r2", "a3-decal-seawater-puddle-r2"], dn: 3 },
      d: { sets: ["a3_tidepool"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      e: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      f: { props: ["salt-crystals"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    },
  },
});

// 7/16 집게 동굴 2층 (keep · 등급 B · 바위 집게 왕 크라그 보스 맵): 따개비 돌 굴 바닥·웅덩이 구역·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (뼈 구덩이 2층·전갈 굴 2층과 같은 자리 — 같은 처리)
//   (검수표 구획: 계단참 → 껍질 무더기 길 → 집게 왕의 웅덩이(끝방 · 되돌아가는 문), 곁 = 북쪽 굴).
//   집게 왕의 웅덩이 = 껍질 둥지 왕좌(랜드마크 · 보스 배경 — 손으로 고른 자리 그대로 · 북벽과 사이 뒤 칸 3·폭 1칸 막다른 줄이 남아 왕좌를 북벽에 붙여 막음 · 끝방 자리 뒤 · 보스 자리 그대로) + 게 양동이·껍질 묶음 + 웅덩이 바닥 패치 ·
//   껍질 무더기 길 = 밀물이 남긴 것 세트 + 껍질 묶음 · 북쪽 굴 = 닻사슬 더미 · 계단참 = 바닥 무늬만.
Object.assign(module.exports.crabcave2, {
  places: module.exports.crabcave2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "껍질 무더기 길", c: "북쪽 굴", d: "집게 왕의 웅덩이" }[p.z] || p.name })),   // 짝 맵(뼈 구덩이 2층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  // 껍질 둥지 왕좌 세트(손으로 고른 자리 17.5, 8.3)를 조각으로 풀어 왕좌를 북벽에 붙인다(wall=1 · 뒤 칸 0) — 세트 줄은 벽 밀착 막음을 못 적는다
  put: module.exports.crabcave2.put.flatMap((p) => (p[1] === "a3_lm_crab_throne" ? [["prop", "a3-landmark-crab-king-shell-throne", 17.5, 8.9, 1.15, 0, "wall=1"], ["prop", "a3-crab-shell-pile", 14.3, 7.7], ["prop", "a3-kelp-rock", 20.7, 7.9], ["decal", "a3-decal-tide-puddle", 17.5, 6.7]] : [p])),
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_tide_wrack"], props: ["a3-crab-shell-pile", "salt-crystals"], clusters: 2, decals: ["a3-decal-seawater-puddle-r2", "a3-decal-tide-stain-r2"], dn: 2 },
      c: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seaweed-pile-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { props: ["a3-crab-in-bucket", "a3-adjunct-shell-pile-r2"], floorProps: ["tidal-pool"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2", "a3-decal-crab-tracks-r2", "a3-decal-tide-stain-r2"], dn: 3 },
    },
  },
});

// 8/16 난파선 선창 (keep · `?` 맵 → keep · 등급 B): 젖은 판자 바닥·선창 판자 벽·칸막이 통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (굶주린 굴·독사의 둥지와 같은 자리 — 같은 처리)
//   배정표 `?`(실내 판자지만 방 윤곽이 둥근 굴 · 구역 6개가 모두 같은 판자 그림이라 v5 재적합 이득이 작음) → keep. 빈 바닥 11%(20% 밑)라 v5 비교본은 만들지 않았다.
//   (검수표 구획: 갑판 구멍 → 칸막이 통로 → 짐칸 → 선미 칸(봉인 상자 · 되돌아가는 문 · 끝방), 곁 = 물 찬 화물칸·돛 창고).
//   특징 공간당 1: 짐칸 = 쇠사슬 화물과 갇힌 혼(랜드마크 한 장 · 세트 곁 상자·대포는 뺌 · 물 찬 화물칸에서 옮김 · 짐칸 북쪽 — 가운데는 골격이 비스듬히 지나 골격 너비가 2칸 밑으로 줄었다) + 상자·소금 자루 묶음 · 물 찬 화물칸 = 조수 웅덩이 세트 ·
//   칸막이 통로 = 부두 짐더미 · 돛 창고 = 닻사슬 더미 + 젖은 그물·부러진 노 묶음 · 선미 칸 = 꺼진 등불·나무통 묶음 · 갑판 구멍 = 나무통 하나. 그물 산발(4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.wreckhold, {
  places: module.exports.wreckhold.places.map((p) => Object.assign({}, p, { name: { a: "갑판 구멍", b: "칸막이 통로", c: "물 찬 화물칸", d: "짐칸", e: "돛 창고", f: "선미 칸" }[p.z] || p.name })),   // 짝 맵(굶주린 굴) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a3-adjunct-drift-barrel-r2"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_dock_cargo"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_tidepool"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      d: { feature: "set:a3_lm_cargo_souls", featureAt: [2.5, 4.3], featureDrop: ["a3-drift-crates", "a3-rusted-cannon"], props: ["smuggler-crates", "a3-adjunct-salt-sack-r2"], clusters: 1, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 3 },
      e: { sets: ["a3_anchor_chain"], props: ["a3-adjunct-wet-net-pile-r2", "a3-adjunct-broken-oar-r2"], clusters: 2, decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      f: { props: ["a3-adjunct-broken-lantern-r2", "harbor-barrels"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
    },
  },
});

// 9/16 밀수꾼 동굴 1층 (keep · `?` 맵 → keep · 등급 A): 소금 굴 바닥·물길(갯벌)·밀수꾼 동굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (가라앉은 지하실 1층 자리 — 고리길 통로는 keep이라 그대로)
//   (검수표 구획: 굴 입구 → 술 창고 → 화물 창고 → 물길(매복 길목) → 등불 우물방 → 아래 굴).
//   특징 공간당 1: 화물 창고 = 밀수품 상자 탑(랜드마크) + 상자·자루 묶음 · 등불 우물방 = 벽 따라 등불 기둥 열(이름 그대로 「등불 걸린」) + 닻사슬 더미 ·
//   술 창고 = 부두 짐더미 + 나무통 묶음 · 물길 = 바닥 무늬만(물 바닥 그대로) · 굴 입구·아래 굴 = 상자·녹슨 갈고리 하나. 손으로 고른 낱개 등불(우물방 · 기둥 낱개)은 열로 대신.
//   배정표 `?`: keep 빈 바닥 28%(20% 넘음) → 악마의 행군로·가라앉은 대로처럼 v5 비교본만 만들어 둔다. 기본은 keep —
//   `V5_ALT=smuggler1 node tools/build/handmade/compose.cjs act3 smuggler1`로만 짓는다 (비교 미리보기·설계도: docs/evidence/2026-11-01-map-v5-act3/variants/smuggler1-v5.*)
const SMUGGLER1_KEEP = {
  mode: "keep",
  outdoor: false,
  dress: {
    a: { props: ["smuggler-crates"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    b: { feature: "set:a3_lm_crate_tower", props: ["a3-adjunct-salt-sack-r2", "a3-adjunct-drift-barrel-r2"], clusters: 1, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
    c: { sets: ["a3_dock_cargo"], props: ["harbor-barrels", "a3-adjunct-crab-pot-r2"], clusters: 2, decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
    d: { decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wave-foam-line-r2"], dn: 2 },
    e: { row: { name: "harbor-lantern", min: 2, minLine: 4 }, sets: ["a3_anchor_chain"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
    f: { props: ["a3-rusted-cannon"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
  },
};
const SMUGGLER1_V5 = Object.assign({}, SMUGGLER1_KEEP, { mode: undefined });
Object.assign(module.exports.smuggler1, {
  places: module.exports.smuggler1.places.map((p) => Object.assign({}, p, { name: { a: "굴 입구", b: "화물 창고", c: "술 창고", d: "물길", e: "등불 우물방", f: "아래 굴" }[p.z] || p.name })),   // 짝 맵(지하실 1층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  put: module.exports.smuggler1.put.filter((p) => p[1] !== "harbor-lantern"),
  v5: (process.env.V5_ALT || "").split(",").includes("smuggler1") ? SMUGGLER1_V5 : SMUGGLER1_KEEP,
});

// 10/16 밀수꾼 동굴 2층 (keep · `?` 맵 → keep · 등급 B · 두목 렌 보스 맵): 소금 굴 바닥·물 고인 방·동굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (가라앉은 지하실 2층 자리)
//   배정표 `?`(큰 네모 금고 방 — 1층과 함께 결정) → keep. 빈 바닥 12%(20% 밑)라 v5 비교본은 만들지 않았다.
//   (검수표 구획: 계단참 → 장물 창고 → 갈림 방 → 두목의 금고 방(끝방 · 되돌아가는 문), 곁 = 물 고인 방).
//   두목의 금고 방 = 보물 궤짝과 지도 탁자(랜드마크 · 보스 배경 — 손으로 고른 자리 그대로) + 바닥 무늬 (금고 방 가운데를 골격이 비스듬히 지나 소품 묶음은 골격 너비를 2칸 밑으로 줄였다 — 지도 탁자 세트의 상자·대포가 묶음 몫) · 장물 창고 = 부두 짐더미 (묶음을 더 넣으면 비스듬한 골격 곁을 좁혔다) ·
//   물 고인 방 = 밀물이 남긴 것 + 웅덩이 바닥 패치 · 갈림 방 = 꺼진 등불 하나 · 계단참 = 상자 하나. 세트 안 낱개 등불 기둥은 생성기가 뺀다.
Object.assign(module.exports.smuggler2, {
  places: module.exports.smuggler2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "장물 창고", c: "물 고인 방", d: "갈림 방", e: "두목의 금고 방" }[p.z] || p.name })),   // 짝 맵(지하실 2층) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  // 화로: v5 자동 자리 중 금고 방 화로(−17.5, 1.5)가 keep 골격(계단참→되돌아가는 문 최단 길) 칸 위라 골격이 끊겼다(표식 칸은 골격에서 빠진다 · 초소 고정 화로와 같은 경우) →
  //   자리를 적어 두고 그 하나만 골격 밖 동쪽(−14.5, 4.5)으로
  torches: [[25, 3], [13, -6], [13, 10], [0, 1], [-15, 4]],
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["smuggler-crates"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_dock_cargo"], clusters: 1, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_tide_wrack"], floorProps: ["tidal-pool"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      d: { props: ["a3-adjunct-broken-lantern-r2"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      e: { decals: ["a3-decal-wet-footprints-r2", "a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 3 },
    },
  },
});

// 11/16 등대지기의 집 (keep · `?` 맵 → keep · 등급 B · 미친 등대지기 하울 보스 맵): 젖은 판자 바닥·판자 벽·굴 윤곽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만 (목매단 동굴 자리)
//   배정표 `?`(방 이름이 모두 굴 · 동쪽은 둥근 물 굴 · 서쪽 큰 방만 네모 판자 실내) → keep. 빈 바닥 16%(20% 밑)라 v5 비교본은 만들지 않았다.
//   (검수표 구획: 지하 문 → 서재 굴 → 등유 굴 → 등대지기의 방(끝방 · 되돌아가는 문), 곁 = 작업장 굴).
//   등대지기의 방 = 미친 렌즈 작업대(랜드마크 · 보스 배경 — 손으로 고른 자리 그대로) + 소금 자루·불탄 종이 묶음 · 서재 굴 = 등대지기 책상(특징 하나) + 불탄 종이 (책장 줄은 굴 윤곽이 둥글어 곧은 북벽 줄이 없어 뺌) ·
//   작업장 굴 = 부두 짐더미 + 통발 · 등유 굴 = 나무통·녹슨 갈고리 묶음 (닻사슬 더미 세트는 비스듬한 골격 곁을 좁혀 뺌) · 지하 문 = 꺼진 등불 하나. 꺼진 등불 산발(4)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.keeperhouse, {
  places: module.exports.keeperhouse.places.map((p) => Object.assign({}, p, { name: { a: "지하 문", b: "서재 굴", c: "작업장 굴", d: "등유 굴", e: "등대지기의 방" }[p.z] || p.name })),   // 짝 맵(목매단 동굴) 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  // 화로: v5 자동 자리 중 등유 굴 화로(−7.5, −1.5)가 keep 골격(지하 문→되돌아가는 문 최단 길) 칸 위라 골격이 끊겼다 → 자리를 적어 두고 그 하나만 골격 밖 서쪽(−10.5, −2.5)으로
  // 미친 렌즈 작업대(손으로 고른 자리 그대로): v5 크기로 줄며 서쪽 벽과 사이 3칸 막다른 벽감이 남아 그 칸을 작업대 막힘에 더함(fill)
  put: module.exports.keeperhouse.put.map((p) => (p[1] === "a3-landmark-mad-lens-workbench" ? [p[0], p[1], p[2], p[3], p[4], p[5] || 0, "fill=-24/12,-24/11,-25/11"] : p)),
  torches: [[23, 1], [10, -7], [8, 8], [-11, -3], [-19, 9]],
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a3-adjunct-broken-lantern-r2"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { feature: "prop:keeper-desk", props: ["burnt-paper"], clusters: 1, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_dock_cargo"], props: ["a3-adjunct-crab-pot-r2"], clusters: 2, decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { props: ["harbor-barrels", "a3-rusted-cannon"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      e: { props: ["a3-adjunct-salt-sack-r2", "burnt-paper"], clusters: 1, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
    },
  },
});

// 12/16 물에 잠긴 예배당 (v5 · 물에 잠긴 사제 세드릭 보스 맵): 무너진 문간(E 28, 0) → 서쪽 기도실 → 잠긴 회랑 → 물에 잠긴 제단(끝방 −21, 6 · 되돌아가는 문 −26, −8)이 y 0 한 줄 — 축이 띠,
//   제단 안에서 x −19까지 곧게 간 뒤 남쪽 문 줄(y −8)로 (잊힌 서고를 좌우로 뒤집은 자리 — 서고와 같은 처리 · 서고의 고리 끊기는 overrides.cjs archive 줄이라 여기 따로 적는다).
//   고리 끊기(검수표 「고리 4+2」): 북쪽·남쪽 기도실 → 제단 통로를 막아 두 기도실이 잠긴 회랑에서만 들어가는 막다른 방 · 제단 1×1 바위 기둥 넷(낱개 기둥)은 뺐다 · 신도석 줄(담 글자 %)은 반복 구조라 그대로.
//   잠긴 회랑(검수표 「캡처로 확인」 · 갯벌 물 바닥): 회랑이 골격 위라 띠(마른 타일 · 폭 1~2)가 회랑 가운데 y 0을 지나고, 띠 양옆 회랑 칸은 물 바닥 그대로 남는다 —
//   재적합은 바탕과 같아 보이는 띠 곁 칸만 바꾸므로 물(갯벌) 칸은 패치되지 않는다. 마른 디딤길이 잠긴 회랑을 가로지르는 꼴 (물 칸 수는 summary 표).
//   물에 잠긴 제단 = 푸른 불 설교단(랜드마크 · 보스 배경 — 손으로 고른 자리를 v5 특징으로 · 한 장 · 끝방 뒤 북벽 · 세드릭은 그 앞) + 축 양옆 예배당 기둥 열주 ·
//   띠 북쪽 밝은 잠긴 타일 / 남쪽 어두운 잠긴 타일 (구역 바닥이 바탕과 같은 잠긴 타일이라 띠가 안 보였다 — 기도실들도 한 톤 어둡게).
//   북쪽·남쪽 기도실 = 신도석 두 줄(설계도 담 글자 — 반복 구조) + 꺼진 등불·해초 바위 / 조개·노 묶음 (북벽은 신도석 줄 사이라 기둥 열 자리가 1개뿐) · 서쪽 기도실 = 신도석 줄(설계도 담 글자) + 닻사슬 더미 · 잠긴 회랑 = 밀물이 남긴 것 · 문간 = 물 무늬만.
const SC_CUT = ["-8,12", "-8,-12"];
Object.assign(module.exports.seachapel, {
  paths: module.exports.seachapel.paths.filter((p) => !SC_CUT.includes(p.pts[0].join(","))),
  rocks: module.exports.seachapel.rocks.filter((r) => !r.e),
  places: module.exports.seachapel.places.map((p) => Object.assign({}, p, { name: { a: "무너진 문간", b: "서쪽 기도실", c: "북쪽 기도실", d: "잠긴 회랑", e: "남쪽 기도실", f: "물에 잠긴 제단" }[p.z] || p.name, note: p.z === "f" ? "물에 잠긴 사제 세드릭 · 봉인 상자 · 되돌아가는 문" : p.z === "d" ? "갯벌 물 바닥 — 띠는 가운데 마른 디딤길" : "" })),   // 서고 자리 이름을 그대로 물려받았었다
  put: [],   // 푸른 불 설교단 세트(손으로 고른 자리) → v5 특징(같은 자리 · 한 장)
  zones: Object.assign({}, module.exports.seachapel.zones, {
    a: "a3-drowned-tile-floor-r2 0.76/0.76/0.76 무너진 문간",
    b: "a3-drowned-tile-floor-r2 0.76/0.76/0.76 서쪽 기도실",
    c: "a3-drowned-tile-floor-r2 0.78/0.78/0.78 북쪽 기도실",
    e: "a3-drowned-tile-floor-r2 0.78/0.78/0.78 남쪽 기도실",
    f: "a3-drowned-tile-floor-r2 1/1/1 물에 잠긴 제단",          // 띠 북쪽 (바탕 0.89와 0.1 넘게 차이)
    h: "a3-drowned-tile-floor-r2 0.72/0.72/0.72 물에 잠긴 제단 남쪽",   // 띠 남쪽
  }),
  v5: {
    outdoor: false,
    via: [[4, 2], [-9, 2], [-19, 0], [-19, -8]],   // 축(y 0)을 제단 x −19까지 곧게 → 남쪽으로 꺾어 되돌아가는 문 줄(y −8) — 대각 띠가 제단을 비스듬히 가르지 않게 (서고 via를 좌우로 뒤집음)
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_anchor_chain"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      c: { props: ["a3-adjunct-broken-lantern-r2", "a3-kelp-rock"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      d: { sets: ["a3_tide_wrack"], decals: ["a3-decal-wave-foam-line-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      e: { props: ["a3-adjunct-shell-pile-r2", "a3-adjunct-broken-oar-r2"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      f: {
        feature: "set:a3_lm_blue_pulpit", featureAt: [-20.5, 9.3], featureDrop: ["a3-kelp-rock", "a3-crab-shell-pile"],
        colonnade: { name: "chapel-pillar", step: 2.6, minPairs: 2, off: 2.5, tight: true, axis: [[-11.5, 0.5], [-18.5, 0.5]] },
        sides: { left: "h", right: "f" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a3-decal-seaweed-pile-r2", "a3-decal-seawater-puddle-r2", "a3-decal-wave-foam-line-r2"], dn: 3,
      },
    },
  },
});

// 13/16 폭풍 등대 1층 (v5 · 등급 A): 계단참(E 28, 1) → 등유 저장고 → 등대 홀(웨이포인트 −3, 2) → 침수된 방 → 위층 계단(W −29, 1) — 띠 = 그 골격 한 줄 (등대 층 바닥 ;raised 그대로).
//   (지하 납골당 1층을 좌우·상하로 뒤집은 자리). 길은 10-30 I06 덮어쓰기(overrides.cjs lighthouse1 · 계단참에서 남 창고 회랑 / 북 등유 저장고 두 접근 → 홀 → 서쪽 곧은 퇴장로)가 정한다 —
//   두 접근은 설계 의도라 그대로 두고(사원 2층과 같은 판단) 그 줄에서 무너진 선반 방 → 위층 계단 통로만 막았다(곁방 고리) · 침수된 방 → 위층 계단 통로는 위층 계단 바닥으로.
//   등대 홀 1×1 바위 기둥 넷·창고 회랑 바위는 뺐다(낱개 기둥).
//   검수표 「빈 바닥 28%」: 띠·두 톤 바닥·벽 따라 열로 빈 바닥을 공간으로 나눈다.
//   등대 내부는 둥근 층이라 열주 대신 벽 따라 등불 기둥 열(액트 3 반복 구조): 등대 홀 = 웨이포인트 서북 북벽 나선 계단 기둥(북쪽 문턱 길 서쪽 — 문턱 길을 막지 않게)(랜드마크 · 한 장 · 북벽 밀착) + 남벽 등불 기둥 열 ·
//   띠 북쪽 밝은 따개비 돌 / 남쪽 어두운 따개비 돌 · 창고 회랑 = 부두 짐더미 · 등유 저장고 = 닻사슬 더미 + 나무통 · 침수된 방 = 밀물이 남긴 것 + 웅덩이 ·
//   무너진 선반 방 = 부러진 노·젖은 그물 묶음(길 위 저주 상자 곁) · 홀 북쪽 문턱 = 물 무늬 · 계단참·위층 계단 = 물 무늬만. 젖은 그물·꺼진 등불 산발(3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.lighthouse1, {
  rocks: [],
  // 길 위 저주 상자 세트(a3_road_chest)는 선반 방 → 위층 계단 통로를 막아 서쪽 부러진 돛대 조각 발이 벽 칸에 걸렸다 → 조각으로 풀어 돛대만 뺌 (상자 자리·동쪽 상자·그물·무늬 그대로)
  put: module.exports.lighthouse1.put.flatMap((p) => (p[1] === "a3_road_chest" ? [["prop", "a3-drift-crates", p[2] + 1.7, p[3] + 0.3, 1, 1], ["prop", "a3-adjunct-wet-net-pile-r2", p[2] + 1.3, p[3] - 0.8], ["decal", "a3-decal-wet-footprints-r2", p[2] + 0.2, p[3] - 1.0], ["decal", "a3-decal-seawater-puddle-r2", p[2] - 1.1, p[3] - 1.0, 0.8]] : [p])),
  places: module.exports.lighthouse1.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "창고 회랑", c: "등유 저장고", d: "등대 홀", e: "침수된 방", f: "무너진 선반 방", g: "위층 계단" }[p.z] || p.name, note: p.z === "d" ? "웨이포인트 · 나선 계단 기둥과 남벽 등불 기둥 열" : p.z === "b" ? "등대지기의 집 입구" : "" })),   // 납골당 1층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.lighthouse1.zones, {
    a: "a3-wet-plank-floor-r2 0.76/0.76/0.76 계단참",          // 바탕(젖은 판자 0.91)과 색 차이 <0.1이라 「같은 바닥」 — 한 톤 어둡게
    c: "a3-wet-plank-floor-r2 0.74/0.74/0.74 등유 저장고",
    e: "a3-wet-plank-floor-r2 0.72/0.72/0.72 침수된 방",
    h: "a3-barnacle-stone-floor-r2 0.76/0.76/0.76 등대 홀 남쪽",   // 띠 남쪽 (북쪽 d 0.95와 다른 톤)
    i: "a3-barnacle-stone-floor-r2 0.8/0.8/0.8 홀 북쪽 문턱",       // overrides.cjs lighthouse1 북쪽 문턱 길 (z: "i")
  }),
  v5: {
    outdoor: false,
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_dock_cargo"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_anchor_chain"], props: ["harbor-barrels", "a3-adjunct-salt-sack-r2"], clusters: 2, decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: {
        feature: "set:a3_lm_spiral_stair", featureAt: [-6.5, 5.4], featureDrop: ["a3-drift-crates"],
        row: [{ name: "harbor-lantern", side: "s", min: 2, minLine: 4 }],
        sides: { left: "h", right: "d" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wet-footprints-r2", "a3-decal-salt-band-r2"], dn: 3,
      },
      e: { sets: ["a3_tide_wrack"], floorProps: ["tidal-pool"], decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      f: { props: ["a3-adjunct-broken-oar-r2", "a3-adjunct-wet-net-pile-r2"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      g: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      i: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    },
  },
});

// 14/16 폭풍 등대 2층 (v5 · 등급 B): 계단참(E 28, 0) → 긴 나선 회랑(y 0) → 위층 계단(W −29, 0)이 한 줄 — 그 축이 띠 (등대 층 바닥 ;raised 그대로).
//   (지하 납골당 2층을 좌우로 뒤집은 자리 — 납골당 2층은 10-30 I06 덮어쓰기(overrides.cjs crypt2)로 곁방 고리를 이미 끊었는데 그 줄은 이 맵에 오지 않는다 → 같은 처리를 여기 적는다).
//   고리 끊기(검수표 「고리 5+2」): 등유 저장고 ↔ 등대 홀 · 침수된 방 ↔ 무너진 선반 방 통로를 막아 곁방 다섯이 회랑에서 한 번 들어갔다 나오는 막다른 방 · 회랑 1×1 바위 기둥 열 개(낱개 기둥)는 뺐다.
//   긴 나선 회랑 = 북벽 등불 기둥 열 2 · 남벽 3(열주 대신 액트 3 반복 구조 · 「기둥이 늘어선」 회랑) + 닻사슬 더미 · 띠 북쪽 따개비 돌 / 남쪽 어두운 따개비 돌 ·
//   등대 홀 = 깨진 렌즈 받침대(랜드마크 · 원래 설계서 그대로) · 등유 저장고 = 부두 짐더미 · 침수된 방 = 해초 바위·조개 묶음 + 웅덩이 · 무너진 선반 방 = 밀물이 남긴 것 ·
//   계단참·위층 계단 = 물 무늬만. 꺼진 등불·통발 산발(8·3)은 묶음 ≤3·같은 그림 맵당 ≤2로 (길 위 의식 제단 세트 등불 둘은 그 세트 몫).
const LH2_CUT = ["9,12", "0,-12"];
Object.assign(module.exports.lighthouse2, {
  paths: module.exports.lighthouse2.paths.filter((p) => !LH2_CUT.includes(p.pts[0].join(","))),
  rocks: [],
  places: module.exports.lighthouse2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "긴 나선 회랑", c: "등유 저장고", d: "등대 홀", e: "침수된 방", f: "무너진 선반 방", g: "위층 계단" }[p.z] || p.name, note: p.z === "b" ? "벽 따라 등불 기둥 열 · 주 경로" : p.z === "d" ? "깨진 렌즈 받침대" : "" })),   // 납골당 2층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.lighthouse2.zones, {
    a: "a3-wet-plank-floor-r2 0.76/0.76/0.76 계단참",          // 바탕(젖은 판자 0.91)과 색 차이 <0.1 — 한 톤 어둡게
    b: "a3-barnacle-stone-floor-r2 0.95/0.95/0.95 긴 나선 회랑",
    c: "a3-wet-plank-floor-r2 0.74/0.74/0.74 등유 저장고",
    e: "a3-wet-plank-floor-r2 0.72/0.72/0.72 침수된 방",
    h: "a3-barnacle-stone-floor-r2 0.74/0.74/0.74 긴 나선 회랑 남쪽",   // 띠 남쪽
  }),
  v5: {
    outdoor: false,
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: {
        row: [{ name: "harbor-lantern", side: "n", min: 2 }, { name: "harbor-lantern", side: "s" }],
        sets: ["a3_anchor_chain"],
        sides: { left: "h", right: "b" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wet-footprints-r2", "a3-decal-salt-band-r2"], dn: 3,
      },
      c: { sets: ["a3_dock_cargo"], decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { feature: "set:a3_lm_lens_stand", decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      e: { props: ["a3-kelp-rock", "a3-adjunct-shell-pile-r2"], floorProps: ["tidal-pool"], clusters: 1, decals: ["a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 2 },
      f: { sets: ["a3_tide_wrack"], decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      g: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    },
  },
});

// 15/16 폭풍 등대 3층 (v5 · 등급 B): 계단참(E 28, 1 · 웨이포인트 24, 3) → 회랑 → 등대 홀(갈림 방) → 렌즈 홀 → 꼭대기 계단(W −29, 1) — 띠 = 그 골격 한 줄 (등대 층 바닥 ;raised 그대로).
//   (지하 납골당 3층을 좌우·상하로 뒤집은 자리 — 납골당 3층의 고리 끊기는 overrides.cjs crypt3 줄이라 여기 따로 적는다 · 같은 처리).
//   고리 끊기(검수표 「고리 3+2」): 창고 회랑·등유 저장고 → 등대 홀 대각 통로를 막아 두 둥근 방이 회랑 x 20 갈림길에서만 닿는 막다른 방 · 렌즈 홀 1×1 바위 기둥 넷(낱개)은 뺐다.
//   렌즈 홀 = 폭풍 종(랜드마크 · 홀 서쪽 꼭대기 계단 앞 띠 북쪽 — 생성기 기본 자리는 남쪽 가운데라 이야기 자리로) + 열주 대신 북·남벽 등불 기둥 열(액트 3 반복 구조) · 띠 북쪽 밝은 따개비 돌 / 남쪽 어두운 따개비 돌 ·
//   길 위 신전(렌즈 받침 신전 · 자리 그대로)의 낱개 해초 말뚝은 소금 갯벌과 같이 조각으로 풀어 뺐다 ·
//   창고 회랑 = 부두 짐더미 · 등유 저장고 = 닻사슬 더미 · 등대 홀(갈림 방)·계단참·꼭대기 계단 = 물 무늬만. 꺼진 등불·젖은 그물 산발(4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
const LH3_CUT = ["8,-7", "8,11"];
Object.assign(module.exports.lighthouse3, {
  paths: module.exports.lighthouse3.paths.filter((p) => !LH3_CUT.includes(p.pts[0].join(","))),
  rocks: [],
  put: explodeShrine(module.exports.lighthouse3.put),
  places: module.exports.lighthouse3.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "창고 회랑", c: "등유 저장고", d: "등대 홀", e: "렌즈 홀", g: "꼭대기 계단" }[p.z] || p.name, note: p.z === "e" ? "폭풍 종과 벽 따라 등불 기둥 열" : "" })),   // 납골당 3층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.lighthouse3.zones, {
    a: "a3-wet-plank-floor-r2 0.76/0.76/0.76 계단참",          // 바탕(젖은 판자 0.91)과 색 차이 <0.1 — 한 톤 어둡게
    c: "a3-wet-plank-floor-r2 0.74/0.74/0.74 등유 저장고",
    g: "a3-barnacle-stone-floor-r2 0.8/0.8/0.8 꼭대기 계단",
    h: "a3-barnacle-stone-floor-r2 0.74/0.74/0.74 렌즈 홀 남쪽",   // 띠 남쪽
  }),
  v5: {
    outdoor: false,
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_dock_cargo"], decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_anchor_chain"], decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wet-footprints-r2"], dn: 2 },
      e: {
        feature: "set:a3_lm_storm_bell", featureAt: [-19.5, 4.4],
        row: [{ name: "harbor-lantern", side: "n", min: 2 }, { name: "harbor-lantern", side: "s", min: 2 }],
        sides: { left: "h", right: "e" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a3-decal-wave-foam-line-r2", "a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 3,
      },
      g: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
    },
  },
});

// 16/16 폭풍의 눈 (v5 · 보스방 · 익사한 제독 바렌): 꼭대기 계단(E 28, 0) → 선원들의 방 쪽 길 → 봉인된 문간 → 폭풍의 눈(y 0 축 · 제독 −18, 4 남쪽을 지나 서쪽 끝에서 북쪽으로) → 나가는 문(E −27, 8) — 띠 = 입구→폭풍의 눈 중심 축.
//   (여왕의 무덤을 좌우로 뒤집은 자리 — 여왕의 무덤 v5의 길 정리는 overrides.cjs queentomb 줄이라 여기 따로 적는다 · 같은 처리):
//   부서진 등롱 회랑 → 봉인된 문간 통로를 막아 등롱 회랑을 막다른 곁방으로(가지 간 추가 연결 0) · 폭풍의 눈 바위 구멍 넷(열주와 겹친다)은 뺐다 · 문간 → 홀 통로는 축 줄 그대로.
//   제독 자리(fixed admiral)·호위 구역(area)·출현 목록은 그대로 (보스 맵 — 출현 수 재산정 없음 · 여왕의 무덤과 같다).
//   폭풍의 눈 = 제독의 닻과 선장실 잔해(랜드마크 · 보스 배경 — 손으로 고른 자리 그대로 · 제독 등 뒤 북쪽 · 한 장, 곁 돛대·대포는 뺌) +
//   입구→중심 축 양옆 등불 기둥 열주(등대 꼭대기라 예배당 기둥 대신 액트 3 등불 기둥) · 띠 북쪽 밝은 따개비 돌 / 남쪽 어두운 따개비 돌.
//   손으로 고른 「익사한 제독의 갑판」 세트(돛대·등불·대포 둘·닻·상자·그물 — 특징 돛대와 랜드마크가 한 공간 · 낱개 등불 · 대포·상자 산발)는 뺐다 (제독 자리는 fixed 그대로).
//   선원들의 방 = 부두 짐더미 + 나무통 · 부서진 등롱 회랑 = 닻사슬 더미 + 꺼진 등불 · 봉인된 문간·꼭대기 계단 = 물 무늬만. 등불·대포·닻·상자 산발(7·6·4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
const { P: P3 } = require("./kit.cjs");
Object.assign(module.exports.stormeye, {
  paths: [P3([[30, 0], [17, 0]], 3), P3([[17, 0], [17, 6]], 3), P3([[15, 0], [15, -6]], 3), P3([[11, 10], [5, 10], [5, 3]], 3), P3([[2, 0], [-1, 0]], 4)],   // 여왕의 무덤 v5 길(overrides.cjs queentomb)을 좌우로 뒤집음 — 등롱 회랑 → 문간 통로(10, −10)만 없다
  rocks: [],
  put: [],
  places: module.exports.stormeye.places.map((p) => Object.assign({}, p, { name: { a: "꼭대기 계단", b: "선원들의 방", c: "부서진 등롱 회랑", d: "봉인된 문간", e: "폭풍의 눈" }[p.z] || p.name, note: p.z === "e" ? "익사한 제독 바렌 · 제독의 닻과 등불 기둥 열주" : "" })),   // 여왕의 무덤 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.stormeye.zones, {
    a: "a3-barnacle-stone-floor-r2 0.76/0.76/0.76 꼭대기 계단",      // 바탕(따개비 돌 0.89)과 색 차이 <0.1이라 「같은 바닥」 — 띠 곁 패치가 깔렸다 · 한 톤 어둡게
    d: "a3-barnacle-stone-floor-r2 0.76/0.76/0.76 봉인된 문간",
    e: "a3-barnacle-stone-floor-r2 1/1/1 폭풍의 눈",                  // 띠 북쪽 (바탕과 0.1 넘게)
    f: "a3-barnacle-stone-floor-r2 0.72/0.72/0.72 폭풍의 눈 남쪽",   // 띠 남쪽
  }),
  v5: {
    outdoor: false,
    via: [[-3, 0], [-23, 0], [-23, 8]],   // 축(y 0)을 제독 자리 남쪽으로 곧게 지나 서쪽 끝 x −23에서 북쪽으로 꺾어 나가는 문 줄(y 8)로 — 여왕의 무덤 via(x 12에서 꺾음)를 뒤집은 자리면 띠가 제독 등 뒤 닻 자리(y 8~9)를 지나 닻이 제독 자리 위로 밀려났다
    dress: {
      a: { decals: ["a3-decal-seawater-puddle-r2"], dn: 1 },
      b: { sets: ["a3_dock_cargo"], props: ["harbor-barrels"], clusters: 2, decals: ["a3-decal-wet-footprints-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      c: { sets: ["a3_anchor_chain"], decals: ["a3-decal-salt-band-r2", "a3-decal-seawater-puddle-r2"], dn: 2 },
      d: { decals: ["a3-decal-seawater-puddle-r2", "a3-decal-wave-foam-line-r2"], dn: 2 },
      e: {
        feature: "set:a3_lm_admiral_anchor", featureAt: [-17.5, 9.3], featureDrop: ["a3-broken-mast", "a3-rusted-cannon"],
        colonnade: { name: "harbor-lantern", step: 3, minPairs: 3, off: 2.5, tight: true, axis: [[-1.5, 0.5], [-11.5, 0.5]] },
        sides: { left: "f", right: "e" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a3-decal-wave-foam-line-r2", "a3-decal-seawater-puddle-r2", "a3-decal-seaweed-pile-r2"], dn: 3,
      },
    },
  },
});
