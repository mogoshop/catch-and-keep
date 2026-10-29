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
