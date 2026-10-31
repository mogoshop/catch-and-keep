// 액트 4 「불타는 심연」 장소 설계서 (10-28 맵 66장 전면 개편 · 기획서 38 F7). tools/build/handmade/compose.cjs가 설계도·배치표로 옮긴다.
// 초소·사냥터 5장(불탄 협곡·행군로·유황 늪·성채 외곽·심장의 다리)·용암 대장간 1층·혼 감옥은 새로 설계,
// 심연의 문 3층·재의 회랑·옥좌의 전실·옥좌·곁가지 4장은 앞 액트에서 쓰지 않은 방향으로 뒤집어 다시 쓴다 (부록 C B안).
"use strict";
const { E, R, P, rock, wall, remix } = require("./kit.cjs");
const A1 = require("./act1.cjs");
const A2 = require("./act2.cjs");

const BASALT = { "#": "basalt-cliff 1/1/1 현무암 절벽" };
const hellDecals = ["a4-decal-lava-crack", "a4-decal-scorch", "a4-decal-ash-heap"];
const ABYSS = {
  base: "a4-abyss_rune 0.86/0.8/0.8",
  walls: BASALT,
  zones: {
    a: "a4-basalt 0.78/0.74/0.74 계단참",
    b: "a4-scorched_pavers 0.8/0.74/0.72 혼등 회랑",
    c: "a4-soul_prison 0.8/0.76/0.8 제물 방",
    d: "a4-abyss_rune 0.96/0.9/0.9 문장의 홀",
    e: "a4-bone_pit 0.78/0.72/0.7 뼈 쌓인 방",
    f: "a4-lava_crack 0.82/0.74/0.7 갈라진 방",
    g: "a4-basalt 0.84/0.8/0.8 아래 계단",
  },
};
const abyssDress = {
  a: { props: ["a4-abyss-stairs", "a4-brazier"], n: 2 },
  b: { props: ["a4-soul-lantern", "a4-demon-banner", "a4-chain-pillar"], n: 8, decals: ["a4-decal-scorch"], dn: 4 },
  c: { props: ["a4-soul-cage", "a4-soul-lantern", "a4-bone-heap"], n: 7, decals: ["a4-decal-ash-heap"], dn: 3 },
  d: { props: ["a4-sigil-stone", "a4-soul-crystal", "a4-brazier"], n: 6, decals: ["a4-decal-lava-crack", "a4-decal-scorch"], dn: 4 },
  e: { props: ["a4-bone-heap", "a4-helm-pile", "a4-melted-armor-pile"], n: 8, decals: ["a4-decal-ash-heap"], dn: 3 },
  f: { props: ["a4-small-lava-fount", "a4-sulfur-stalagmite", "a4-bone-heap"], n: 7, decals: ["a4-decal-lava-crack", "a4-decal-molten-drip"], dn: 3 },
  g: { props: ["a4-abyss-stairs"], n: 1 },
};
const SULFUR = (tint) => ({ base: `a4-sulfur_cave ${tint}`, walls: BASALT });

module.exports = {
  outpost: {
    size: [36, 24],
    title: "마지막 초소",
    story: ["심연을 마주한 마지막 초소. 목책 안 초소 광장을 막사 줄(북)·정찰대 마당(서)·대장간(동)이 둘러싸고, 양쪽 망루가 남쪽을 지킨다.", "남문 길이 불탄 협곡으로 나가는 문. 돌아오면 광장 남쪽 끝(도착 자리)에 선다."],
    base: "a4-basalt 0.9/0.86/0.84",
    walls: { "#": "palisade 1/1/1 목책" },
    zones: {
      a: "a4-scorched_pavers 0.9/0.86/0.82 초소 광장",
      b: "a4-basalt 0.8/0.76/0.74 막사 줄",
      c: "a4-basalt 0.76/0.72/0.7 정찰대 마당",
      d: "a4-scorched_pavers 0.8/0.74/0.7 대장간",
      e: "a4-basalt 0.82/0.78/0.76 남문 길",
    },
    roads: { "=": "a4-scorched_pavers 1/0.96/0.92 초소 큰길" },
    places: [
      E("a", "초소 광장", 0, 0, 8, 4.5, { torch: false }),
      R("b", "막사 줄", -15, 6, 14, 10, { rough: 0.6, torch: false }),
      E("c", "정찰대 마당", -12, -1, 5, 5, { torch: false }),
      E("d", "대장간", 11, -1, 5, 5, { torch: false }),
      R("e", "남문 길", -4, -10, 4, -5, { rough: 0.6, torch: false }),
    ],
    paths: [P([[0, -11], [0, -1]], 4, "=", 2), P([[-15, -1], [14, -1]], 3, "=", 1), P([[0, 3], [0, 7]], 3)],
    gates: { G: [0, -10] },
    waypoint: [-6, 2],
    torches: [[-4, 1], [3, 1], [-12, 3], [12, -4], [-2, -8], [1, -8], [-7, 7], [6, 7]],
    extra: {
      // townboard: 10-29 다른 작업(마을 게시판)이 maps.csv에 넣은 자리 — compose가 지우지 않게 설계서에도
      depthgate: [5, 2], townboard: [-2, 3], "npc:Scout": [-14, 0], "npc:ShopKeeper": [-4, 4], "npc:OutpostCaptain": [3, 4], "npc:Smith": [10, 1],
      "npc:Deserter": [-9, 3], "npc:Stash": [2, -3], "npc:KeeperDaughter": [-2, 7],
    },
    put: [
      ["prop", "a4-landmark-outpost-signal-brazier", 11, 6.3],   // 10-28 마을 랜드마크 — 맵 위 끝(24칸)에 닿지 않게 그림 전체가 보이는 자리
      ["prop", "a4-brazier", 0.5, 2.2, 1.3], ["prop", "a4-army-tent", -11, 8.6], ["prop", "a4-army-tent", 9, 8.6, 1, 1],
      ["prop", "a4-watchtower", -13.5, -3.6], ["prop", "a4-watchtower", 13.5, -3.6, 1, 1, "ok=gate"], ["prop", "a4-forge-anvil", 12.6, 2.2, 1, 0, "ok=gate"],
      // 10-29 코덱스 감사 c-2 — 안 쓰던 10-20 그림 자리: 남문(마을 출구 포털)을 목책 문틀이 감싸고, 남문 길 양옆은 세로 목책,
      //   북쪽 끝 목책 너머로 붉은 하늘 띠 (1024px 띠 4장을 엇갈려 뒤집어 맵 폭 36칸을 잇는다 · 발은 북쪽 벽 줄이라 ok=cliff)
      // 10-29 메이커 재캡처: 문틀이 남쪽 목책 줄 「앞」에 서 담을 뚫은 문으로 안 보였다 → 문틀 발을 목책 줄(맨 아래 벽 칸 y −11) 바닥에 맞추고,
      //   문 틈(칸 (0,−11)) 목책 조각을 비운다(cut= — lib.cjs 4 벽 그림만 빼고 충돌은 그대로). 세로 목책(±3.8)은 뒤 목책 담에 붙어 2조각씩 떠 보여 뺐다
      ["prop", "a4-outpost-gate", 0.5, -11, 1, 0, "ok=gate+cliff;cut=0/-11"],
      // 붉은 하늘 띠: 띠 위로 맨 윗줄 목책(y≈12.3)이 어둡게 남았다 — 하늘 그림은 피벗이 가운데(코덱스 resource-properties에 피벗 없음 = 기본 0.5/0.5)라
      //   11.05면 9.9~12.2만 덮는다 → +0.85(11.9) 올려 맵 위 끝(13)까지 덮는다 (+0.6이면 12.78 — 맨 윗줄 0.2칸이 남는다 · 맵 밖은 ;backdrop 어둠)
      ["prop", "a4-outpost-red-sky", -13.5, 11.9, 1, 0, "ok=cliff"], ["prop", "a4-outpost-red-sky", -4.5, 11.9, 1, 1, "ok=cliff"],
      ["prop", "a4-outpost-red-sky", 4.5, 11.9, 1, 0, "ok=cliff"], ["prop", "a4-outpost-red-sky", 13.5, 11.9, 1, 1, "ok=cliff"],
    ],
    backdrop: "0.2/0.11/0.1",   // 10-29 맵 밖(남문 밖·북쪽 하늘 위) = 어두운 밤색 — 템플릿 주황 평면이 문 밖에 보였다 (불탄 협곡·악마의 길과 같은 계열)
    dress: {
      a: { decals: ["a4-decal-ash-heap"], dn: 2 },
      b: { props: ["a4-wood-fence-h", "a4-helm-pile", "a4-imp-on-barrel"], n: 4, decals: ["a4-decal-hoofprints"], dn: 2 },
      c: { props: ["a4-wood-fence-h", "a4-helm-pile"], n: 3, decals: ["a4-decal-hoofprints"], dn: 1 },
      d: { props: ["a4-melted-armor-pile", "camp-firewood"], n: 3, decals: ["a4-decal-scorch"], dn: 1 },
      e: { props: ["mp-signpost", "a4-broken-ladder"], n: 2, decals: ["a4-decal-ash-heap"], dn: 2 },   // 세로 목책은 put으로 고정 (10-29)
    },
  },

  embercanyon: {
    size: [64, 44],
    title: "불탄 협곡",
    story: ["초소를 나서면 용암 균열이 갈라 놓은 협곡. 그을린 길이 혼의 제단(웨이포인트)을 지나 동쪽으로 오른다.", "북서쪽 용암 둔덕, 남서쪽 무너진 초소, 남동쪽 유황 동굴 어귀, 북동쪽 재 무더기 골."],
    base: "a4-basalt 0.92/0.86/0.84",
    walls: BASALT,
    zones: {
      a: "a4-basalt 0.84/0.8/0.78 협곡 어귀",
      b: "a4-lava_crack 0.88/0.8/0.76 용암 둔덕",
      c: "a4-scorched_pavers 0.9/0.84/0.82 혼의 제단",
      d: "a4-basalt 0.8/0.74/0.72 무너진 초소",
      e: "a4-sulfur_cave 0.86/0.82/0.7 유황 동굴 어귀",
      f: "a4-bone_pit 0.82/0.76/0.72 재 무더기 골",
      g: "a4-basalt 0.88/0.84/0.82 동쪽 오르막",
    },
    roads: { "=": "a4-scorched_pavers 1/0.94/0.9 그을린 길", "-": "a4-scorched_pavers 0.82/0.76/0.72 샛길" },
    places: [
      E("a", "협곡 어귀", -25, -3, 6, 5),
      E("b", "용암 둔덕", -12, 11, 8, 6),
      E("c", "혼의 제단", -2, 0, 8, 6, { note: "웨이포인트" }),
      E("d", "무너진 초소", -14, -13, 8, 5),
      E("e", "유황 동굴 어귀", 13, -12, 8, 6, { note: "유황 동굴 입구" }),
      E("f", "재 무더기 골", 14, 11, 9, 6),
      E("g", "동쪽 오르막", 26, 3, 5, 5),
    ],
    paths: [
      P([[-32, -3], [-25, -3], [-16, 1], [-2, 0], [6, 3], [14, 4], [20, 3], [26, 3], [31, 3]], 4, "=", 2),
      P([[-18, 4], [-14, 9]], 3, "-", 1), P([[-6, -4], [-12, -10]], 3, "-", 1), P([[6, -2], [12, -8]], 3, "-", 1),
      P([[8, 6], [12, 9]], 3, "-", 1), P([[-6, 15], [6, 15], [8, 13]], 3), P([[-4, -15], [8, -15]], 3),
    ],
    rocks: [rock(-26, 9, 3, 3), rock(-27, -13, 3, 2), rock(2, 8, 2, 2), rock(26, -10, 3, 3), rock(27, 13, 3, 3), rock(1, -10, 2, 1.5)],
    gates: { W: [-31, -3], E: [30, 3] },
    holes: { sulfurcave1: [14, -15] },
    waypoint: [-1, 3],
    dress: {
      a: { props: ["a4-dead-tree", "a4-bone-heap", "a4-sulfur-stalagmite"], n: 6, decals: hellDecals, dn: 3 },
      b: { sets: ["a4_lm_ember_tree", "a4_lava_mound"], props: ["a4-sulfur-stalagmite", "a4-small-lava-fount"], n: 6, decals: ["a4-decal-lava-crack", "a4-decal-molten-drip"], dn: 4 },
      c: { sets: ["a4_soul_altar"], props: ["a4-soul-lantern", "a4-sigil-stone"], n: 5, decals: ["a4-decal-scorch", "a4-decal-lava-crack"], dn: 4 },
      d: { sets: ["a4_ruined_post"], props: ["a4-wood-fence-h", "a4-helm-pile", "a4-broken-ladder"], n: 6, decals: ["a4-decal-ash-heap"], dn: 3 },
      e: { props: ["a4-sulfur-stalagmite", "a4-sulfur-pool", "a4-bone-heap"], n: 6, decals: ["a4-decal-sulfur-stain"], dn: 3 },
      f: { props: ["a4-bone-heap", "a4-dead-tree", "a4-helm-pile"], n: 7, decals: ["a4-decal-ash-heap", "a4-decal-scorch"], dn: 3 },
      g: { props: ["a4-dead-tree", "a4-lava-wall-ruin"], n: 4, decals: hellDecals, dn: 2 },
    },
  },

  // 10-29 「담 위」 액트 4판 (사용자 「액트 3·4도 같은 결로」 → Fable 선정): 용암 위 성채 성벽 행군로.
  //   걷는 칸 = 성채 성벽 윗면(구역 바닥 · 가장자리 성벽 9조각), '#' = 낮은 용암 바다(못 지나감). 높이 2단 + 용암 가장자리 띠.
  //   성벽은 사람이 쌓은 것이라 모서리를 곧게(rough 0 · wobble 0). 아래 HEIGHT 자동 규칙에서 빼고 여기서 직접 지정
  demonroad: {
    size: [70, 50],
    title: "악마의 행군로",
    story: ["용암 바다 위로 쌓은 성채 성벽이 그대로 행군로가 됐다. 서문 보루에서 폭 4 성벽을 따라 해골 관문 보루를 지나 큰 네모 보루의 전쟁 야영지(웨이포인트)로.", "야영지 서쪽 모서리에서 남쪽으로 뻗은 성벽은 중간이 무너져 좁은 성벽으로 돌아 혼 감옥 망루에 닿는다. 북동쪽 끊긴 성벽 끝에 무너진 초소 망루, 남동쪽 둥근 보루에 공성 장비 마당. 동쪽 행군로가 유황 늪으로."],
    raised: "a4-fortress-wall 1/1/1 성벽 윗면 tiers=2 top=zone face=a4-fortress-wall-borders low=a4-lava-sea-floor:0.6/0.48/0.46 edge=a4-decal-lava-edge-h:a4-decal-lava-edge-v:0.9",
    base: "a4-scorched_pavers 0.84/0.78/0.76",   // 10-29 메이커: 장소 밖 성벽 길(.)이 식은 용암 바닥이라 성가퀴 조각과 섞여 벽처럼 보였다 → 그을린 판석
    backdrop: "0.2/0.11/0.1",   // 10-29 맵 밖 = 어두운 용암 바다 (메이커 캡처의 낮은 칸 실측색 — 템플릿 갈색이 주황으로 떴다)
    walls: BASALT,
    zones: {
      a: "a4-basalt 0.82/0.78/0.76 행군로 어귀 보루",
      b: "a4-scorched_pavers 0.86/0.8/0.76 해골 관문 보루",
      c: "a4-basalt 0.9/0.84/0.8 전쟁 야영지 보루",
      d: "a4-soul_prison 0.82/0.78/0.82 혼 감옥 망루",
      e: "a4-basalt 0.78/0.74/0.72 무너진 초소 망루",
      f: "a4-scorched_pavers 0.8/0.74/0.7 공성 장비 마당 보루",
      g: "a4-basalt 0.86/0.82/0.8 동쪽 행군로",
    },
    roads: { "=": "a4-demon_march_ew 1/0.96/0.92 행군로" },
    places: [
      R("a", "행군로 어귀 보루", -34, -4, -28, 4, { rough: 0, note: "네모 보루" }),
      R("b", "해골 관문 보루", -21, 0, -13, 8, { rough: 0, note: "성벽 위 네모 보루 · 해골 관문" }),
      R("c", "전쟁 야영지 보루", -3, -8, 8, 0, { rough: 0, note: "웨이포인트 · 큰 네모 보루 12×9" }),
      R("d", "혼 감옥 망루", -16, -21, -4, -16, { rough: 0, note: "혼 감옥 입구 · 끊긴 성벽 끝 망루 — 입구(-10,-17) 바로 북쪽이 망루 끝(입구가 용암을 등진다), 남쪽 4줄이 앞마당" }),
      R("e", "무너진 초소 망루", 15, 12, 22, 18, { rough: 0, note: "끊긴 성벽 끝 막다른 망루" }),
      E("f", "공성 장비 마당 보루", 16, -16, 6.5, 5, { rough: 0, note: "둥근 보루" }),
      R("g", "동쪽 행군로", 27, -1, 33, 5, { rough: 0 }),
    ],
    paths: [
      P([[-28, 0], [-24, 0], [-24, 4], [-21, 4]], 4, "=", 2, { wobble: 0 }),             // 성벽 행군로 ① 어귀 → 해골 관문
      P([[-13, 4], [-9, 4], [-9, -4], [-3, -4]], 4, "=", 2, { wobble: 0 }),              // ② 관문 → 야영지
      P([[8, -4], [22, -4], [22, 2], [27, 2]], 4, "=", 2, { wobble: 0 }),                // ③ 야영지 → 동쪽 행군로
      P([[-9.5, -7.5], [-9.5, -8.5]], 3, undefined, undefined, { wobble: 0 }),         // 혼 감옥으로 — 망루 앞 3칸에서 무너져 끊긴 성벽
      // 무너진 자리를 돌아 망루로 내려가는 좁은 성벽 — 10-29: 북쪽에서 닿으면 입구 그림 지붕 위로 걸어 들어갔다 → 망루 서쪽 용암 위로 내려가 남서쪽에서 앞마당으로 · 폭 2는 양쪽이 다 성가퀴라 3
      P([[-11, -9.5], [-19.5, -9.5], [-19.5, -19.5], [-16, -19.5]], 3, undefined, undefined, { wobble: 0 }),
      P([[19.5, 5.5], [19.5, 6.5]], 3, undefined, undefined, { wobble: 0 }),           // 초소로 — 망루 앞 4칸에서 무너져 끊긴 성벽
      P([[18, 7], [14, 7], [14, 13], [15, 13]], 3, undefined, undefined, { wobble: 0 }),   // 무너진 자리를 돌아가는 좁은 성벽 (10-29 폭 2 → 3)
      P([[16, -6.5], [16, -10.5]], 3, undefined, undefined, { wobble: 0 }),            // 공성 장비 마당으로
    ],
    gates: { W: [-34, 0], E: [33, 2] },
    holes: { soulprison: [-10, -17] },
    waypoint: [3, -1],
    dress: {
      a: { props: ["a4-dead-tree", "a4-bone-heap", "a4-demon-banner"], n: 3, decals: ["a4-decal-hoofprints", "a4-decal-scorch"], dn: 2 },
      b: { sets: ["a4_skull_gate"], props: ["a4-demon-banner", "a4-ruined-wall-low"], n: 4, decals: ["a4-decal-hoofprints"], dn: 3 },
      c: { sets: ["a4_war_camp"], props: ["a4-army-tent", "a4-imp-on-barrel", "a4-demon-banner", "a4-helm-pile"], n: 8, decals: ["a4-decal-hoofprints", "a4-decal-ash-heap"], dn: 5 },
      d: { props: ["a4-soul-cage", "a4-prison-bars-h", "a4-soul-lantern"], n: 4, decals: ["a4-decal-scorch"], dn: 2 },
      e: { sets: ["a4_ruined_post"], props: ["a4-watchtower", "a4-wood-fence-h", "a4-helm-pile"], n: 4, decals: ["a4-decal-ash-heap"], dn: 2 },
      f: { sets: ["a4_lm_war_banner"], props: ["a4-siege-engine", "a4-broken-ladder", "a4-imp-on-barrel"], n: 6, decals: ["a4-decal-hoofprints"], dn: 3 },
      g: { props: ["a4-demon-banner", "a4-dead-tree"], n: 3, decals: ["a4-decal-hoofprints"], dn: 2 },
    },
  },

  sulfurmarsh: {
    size: [70, 50],
    title: "유황 늪",
    story: ["노란 김이 피어오르는 유황 늪. 길은 남쪽 유황 웅덩이로 내려갔다 혼의 제단(웨이포인트)으로 올라온다.", "북서쪽 거인 갑옷 무덤, 북동쪽 죽은 숲, 남동쪽 용암 대장간 입구. 동쪽으로 불타는 성채."],
    base: "a4-sulfur_mud 0.9/0.88/0.78",
    walls: BASALT,
    zones: {
      a: "a4-sulfur_mud 0.84/0.82/0.72 늪 어귀",
      b: "a4-sulfur_cave 0.92/0.88/0.72 유황 웅덩이",
      c: "a4-scorched_pavers 0.86/0.82/0.76 혼의 제단",
      d: "a4-molten_forge 0.82/0.76/0.7 대장간 어귀",
      e: "a4-basalt 0.82/0.78/0.74 거인 갑옷 무덤",
      f: "a4-sulfur_mud 0.76/0.74/0.66 죽은 숲",
      g: "a4-sulfur_mud 0.88/0.86/0.76 동쪽 둑",
    },
    roads: { "=": "a4-basalt 0.96/0.92/0.86 현무암 둑길", "-": "a4-basalt 0.8/0.76/0.72 샛길" },
    places: [
      E("a", "늪 어귀", -28, 4, 6, 5),
      E("b", "유황 웅덩이", -14, -8, 9, 6),
      E("c", "혼의 제단", 0, 2, 9, 6, { note: "웨이포인트" }),
      E("d", "대장간 어귀", 14, -13, 8, 6, { note: "용암 대장간 입구" }),
      E("e", "거인 갑옷 무덤", -10, 13, 9, 5),
      E("f", "죽은 숲", 15, 12, 8, 6),
      E("g", "동쪽 둑", 28, -1, 5, 5),
    ],
    paths: [
      P([[-35, 4], [-28, 4], [-20, -2], [-12, -6], [-4, -2], [0, 2], [8, 4], [16, 2], [22, 0], [28, -1], [34, -1]], 4, "=", 2),
      P([[-4, 6], [-8, 11]], 3, "-", 1), P([[6, 6], [12, 10]], 3, "-", 1), P([[8, 0], [14, -8]], 3, "-", 1),
      P([[-16, -14], [0, -16], [8, -15]], 3),
    ],
    rocks: [rock(-28, -10, 3, 4), rock(-26, 14, 3, 3), rock(4, -8, 2.5, 2), rock(28, 10, 3, 3), rock(27, -14, 3, 2.5), rock(2, 16, 3, 2)],
    gates: { W: [-34, 4], E: [33, -1] },
    holes: { forge1: [14, -16] },
    waypoint: [1, 5],
    dress: {
      a: { props: ["a4-dead-tree", "a4-sulfur-stalagmite"], n: 6, decals: ["a4-decal-sulfur-stain"], dn: 3 },
      b: { sets: ["a4_lm_sulfur_geyser", "a4_lava_mound"], props: ["a4-sulfur-pool", "a4-sulfur-stalagmite"], n: 8, decals: ["a4-decal-sulfur-stain", "a4-decal-molten-drip"], dn: 5 },
      c: { sets: ["a4_soul_altar"], props: ["a4-soul-lantern", "a4-sigil-stone"], n: 5, decals: ["a4-decal-scorch"], dn: 3 },
      d: { props: ["a4-lava-wall-ruin", "a4-molten-channel-h", "a4-forge-anvil"], n: 5, decals: ["a4-decal-molten-drip"], dn: 3 },
      e: { sets: ["a4_fallen_giant"], props: ["a4-helm-pile", "a4-melted-armor-pile", "a4-chain-pillar"], n: 6, decals: ["a4-decal-ash-heap"], dn: 3 },
      f: { props: ["a4-dead-tree", "a4-sulfur-pool", "a4-bone-heap"], n: 8, decals: ["a4-decal-sulfur-stain"], dn: 3 },
      g: { props: ["a4-sulfur-stalagmite", "a4-dead-tree"], n: 4, decals: ["a4-decal-sulfur-stain"], dn: 2 },
    },
  },

  burningkeep: {
    size: [70, 50],
    title: "불타는 성채 외곽",
    story: ["불타는 성채의 바깥 성벽. 무너진 성벽 틈을 지나면 성채 앞마당(웨이포인트)에 악마 야영지가 펼쳐져 있다.", "남서쪽 배교자의 수도원 입구, 남동쪽 거인 갑옷, 북동쪽 해골 관문 — 그 너머 심연의 문."],
    base: "a4-scorched_pavers 0.86/0.8/0.76",
    walls: { "#": "basalt-cliff 1/1/1 현무암 절벽", "%": "ruin-wall 0.62/0.52/0.48 그을린 성벽" },
    zones: {
      a: "a4-basalt 0.82/0.78/0.76 성채 바깥길",
      b: "a4-scorched_pavers 0.78/0.72/0.68 무너진 성벽 틈",
      c: "a4-scorched_pavers 0.94/0.88/0.82 성채 앞마당",
      d: "a4-apostate_chapel 0.82/0.76/0.76 수도원 어귀",
      e: "a4-lava_crack 0.84/0.76/0.72 거인 갑옷 터",
      f: "a4-abyss_rune 0.86/0.8/0.8 해골 관문",
    },
    roads: { "=": "a4-scorched_pavers 1/0.96/0.92 성채 길" },
    places: [
      E("a", "성채 바깥길", -28, -3, 6, 5),
      R("b", "무너진 성벽 틈", -20, -5, -8, 9, { rough: 1, note: "성벽 두 줄" }),
      E("c", "성채 앞마당", 2, 0, 9, 7, { note: "웨이포인트" }),
      E("d", "수도원 어귀", -8, -15, 8, 5, { note: "배교자의 수도원 입구" }),
      E("e", "거인 갑옷 터", 14, -12, 8, 6),
      E("f", "해골 관문", 22, 10, 8, 6),
    ],
    paths: [
      P([[-35, -3], [-28, -3], [-20, 0], [-12, 2], [-4, 1], [2, 0], [10, 4], [18, 9], [26, 10], [34, 10]], 4, "=", 2),
      P([[-4, -4], [-7, -12]], 3), P([[8, -4], [13, -9]], 3), P([[-14, 8], [-8, 14], [4, 14], [14, 12]], 3), P([[-2, -15], [8, -15]], 3),
    ],
    rocks: [
      wall([[-19, -6], [-19, 10]], "%", [[-19, 0, 2.2], [-19, 6, 1]]), wall([[-9, -6], [-9, 10]], "%", [[-9, 2, 2.2], [-9, 8, 1.4]]),
      rock(-27, 10, 3, 3), rock(-27, -14, 3, 3), rock(28, -2, 3, 3), rock(28, -14, 3, 2), rock(4, 9, 2, 2),
    ],
    gates: { W: [-34, -3], E: [33, 10] },
    holes: { apostate: [-8, -17] },
    waypoint: [3, -3],
    dress: {
      a: { props: ["a4-dead-tree", "a4-bone-heap", "a4-lava-wall-ruin"], n: 6, decals: hellDecals, dn: 3 },
      b: { sets: ["a4_lm_lava_tower"], props: ["a4-lava-wall-ruin", "a4-helm-pile", "a4-broken-ladder"], n: 6, decals: ["a4-decal-scorch"], dn: 3 },
      c: { sets: ["a4_war_camp"], props: ["a4-army-tent", "a4-demon-banner", "a4-soul-cage"], n: 8, decals: ["a4-decal-hoofprints", "a4-decal-ash-heap"], dn: 5 },
      d: { props: ["a4-horned-statue", "a4-soul-lantern", "a4-bone-heap"], n: 6, decals: ["a4-decal-scorch"], dn: 3 },
      e: { sets: ["a4_fallen_giant"], props: ["a4-melted-armor-pile", "a4-helm-pile"], n: 6, decals: ["a4-decal-molten-drip"], dn: 3 },
      f: { sets: ["a4_skull_gate"], props: ["a4-demon-banner", "a4-brazier"], n: 4, decals: ["a4-decal-hoofprints"], dn: 3 },
    },
  },

  heartbridge: {
    size: [70, 50],
    title: "심장의 다리",
    story: ["용암 협곡을 가로지르는 돌다리. 다리 위 기둥참과 무너진 가운데참을 지나 심장 쪽 다리 끝으로.", "가운데참에서 북쪽 혼의 제단 섬, 남쪽 용암 섬으로 좁은 곁다리가 뻗는다."],
    base: "a4-lava_crack 0.84/0.74/0.7",
    walls: { "#": "basalt-cliff 1/0.66/0.54 용암 협곡" },
    zones: {
      a: "a4-basalt 0.84/0.8/0.78 다리 어귀",
      b: "a4-scorched_pavers 0.86/0.8/0.76 첫 기둥참",
      c: "a4-scorched_pavers 0.92/0.84/0.78 무너진 가운데참",
      d: "a4-abyss_rune 0.86/0.8/0.8 혼의 제단 섬",
      e: "a4-lava_crack 0.9/0.78/0.7 용암 섬",
      f: "a4-scorched_pavers 0.86/0.8/0.76 둘째 기둥참",
      g: "a4-basalt 0.88/0.82/0.8 심장 쪽 다리 끝",
    },
    roads: { "=": "a4-scorched_pavers 1/0.96/0.92 돌다리" },
    places: [
      E("a", "다리 어귀", -28, 0, 5, 5),
      E("b", "첫 기둥참", -14, 2, 5, 4),
      E("c", "무너진 가운데참", 0, 0, 7, 5),
      E("d", "혼의 제단 섬", 0, 14, 6, 4),
      E("e", "용암 섬", 2, -13, 6, 4),
      E("f", "둘째 기둥참", 16, -2, 5, 4),
      E("g", "심장 쪽 다리 끝", 28, 0, 5, 5),
    ],
    paths: [
      P([[-35, 0], [-28, 0], [-14, 2], [-6, 0], [0, 0], [8, -2], [16, -2], [22, 0], [28, 0], [34, 0]], 4, "=", 2),
      P([[0, 4], [0, 11]], 3), P([[2, -4], [2, -10]], 3),
    ],
    gates: { W: [-34, 0], E: [33, 0] },
    waypoint: [-30, -3],   // 10-28 사용자: 옥좌로 가는 마지막 사냥터 웨이포인트 (다리 어귀)
    dress: {
      a: { props: ["a4-lava-wall-ruin", "a4-sulfur-stalagmite"], n: 4, decals: hellDecals, dn: 2 },
      b: { props: ["a4-chain-pillar", "a4-demon-banner"], n: 3, decals: ["a4-decal-scorch"], dn: 2 },
      c: { sets: ["a4_lm_heart_statue", "a4_fallen_giant"], props: ["a4-lava-wall-ruin", "a4-bone-heap"], n: 4, decals: ["a4-decal-lava-crack", "a4-decal-scorch"], dn: 4 },
      d: { sets: ["a4_soul_altar"], props: ["a4-soul-lantern"], n: 2, decals: ["a4-decal-scorch"], dn: 2 },
      e: { sets: ["a4_lava_mound"], props: ["a4-small-lava-fount"], n: 2, decals: ["a4-decal-lava-crack", "a4-decal-molten-drip"], dn: 3 },
      f: { props: ["a4-chain-pillar", "a4-demon-banner"], n: 3, decals: ["a4-decal-scorch"], dn: 2 },
      g: { props: ["a4-horned-statue", "a4-brazier"], n: 3, decals: hellDecals, dn: 2 },
    },
  },

  // 심연의 문 3층 · 재의 회랑 · 옥좌의 전실 · 옥좌
  abyssgate1: remix(A1.crypt2, Object.assign({}, ABYSS, {
    title: "심연의 문 1층",
    story: ["심연으로 내려가는 첫 층. 혼등이 늘어선 기둥 회랑(웨이포인트)과 곁방들. 남쪽 곁방 바닥에 타락의 구덩이로 가는 문.", "(자리: 납골당 2층을 좌우·상하로 뒤집음 — 들어온 문이 동쪽)"],
    waypoint: [6, 1],
    holes: { pit: [-2, -12] },
    // 10-29 코덱스 감사 c-2: 문양 기둥 곁방 북쪽 끝에 심연 벽 + 발광 층 (코덱스 INTEGRATION: pulse는 a4-abyss-wall과 같은 자리·원점에 겹치는 층 —
    //   맵 장식 프레임 재생 규칙이 아직 없어 한 프레임 정지 · 발광 층은 args over=1로 벽 바로 앞에 그린다 — lib.cjs place)
    //   10-29 메이커 재캡처(3층): 발이 북쪽 테두리 바깥(경계 +0.05)이라 허공에 떠 보였다 → 발을 테두리 윗단 위(경계 −0.4)로. 이 곁방 북쪽 테두리는 3칸(x −6~−3)뿐이라 한 장
    put: [["prop", "a4-abyss-wall", -4.6, -8.4, 1, 0, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-00", -4.6, -8.4, 1, 0, "ok=cliff;over=1"]],
    dress: Object.assign({}, abyssDress, { d: Object.assign({}, abyssDress.d, { sets: ["a4_lm_rune_pillar"] }) }),   // 10-28 랜드마크
  }), { fx: true, fy: true }),
  abyssgate2: remix(A1.crypt1, Object.assign({}, ABYSS, {
    title: "심연의 문 2층",
    waypoint: undefined,
    // 10-29 코덱스 감사 c-2: 재에 묻힌 석상 곁 북쪽 끝 심연 벽 + 발광 층 (1층 주석) · 메이커 재캡처: 테두리(경계 y 7) 바깥에 떠 있던 발을 테두리 윗단 위(6.6)로.
    //   테두리(x −9~−4) 동쪽 절반은 석상 랜드마크(−4.5, 5.3) 자리라 2장째를 놓으면 석상이 밀려났다 → 한 장 (서쪽 끝 −9에 붙인다)
    put: [["prop", "a4-abyss-wall", -7.85, 6.6, 1, 0, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-01", -7.85, 6.6, 1, 0, "ok=cliff;over=1"]],
    story: ["문장의 홀을 제물 방·뼈 쌓인 방·갈라진 방이 둘러싼다. 고리처럼 돌아 아래 계단으로. (자리: 납골당 1층을 좌우로 뒤집음)"],
    dress: Object.assign({}, abyssDress, { d: Object.assign({}, abyssDress.d, { sets: ["a4_lm_ash_statue"] }) }),   // 10-28 랜드마크
  }), { fx: true }),
  abyssgate3: remix(A1.crypt3, Object.assign({}, ABYSS, {
    title: "심연의 문 3층",
    story: ["심연의 문 앞 마지막 층. 넓은 의식의 홀에서 배교한 대주교가 문을 봉인하고 있다 — 쓰러뜨려야 재의 회랑으로 내려간다.", "(자리: 납골당 3층을 좌우로 뒤집음)"],
    zones: Object.assign({}, ABYSS.zones, { e: "a4-abyss_rune 1/0.9/0.88 대주교의 의식 홀" }),
    fixed: { archbishop: [-15, 3] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    put: [["set", "boss_archbishop", -14.5, 3.5, 1, 1], ["set", "a4_lm_blood_pulpit", -14.5, 8.3],
      // 10-29 코덱스 감사 c-2: 핏빛 설교대 양옆 북쪽 끝 심연 벽 + 발광 층 (1층 주석)
      // 메이커 재캡처: 발(y 10.05)이 북쪽 테두리(경계 y 10) 바깥 허공에 떠 보였다 → 발을 테두리 윗단 위(9.6)로, 양옆 2장씩 이어 벽 일부처럼
      //   (서쪽 테두리 끝 x −23 · 설교대 x −17~−12 · 동쪽 테두리 끝 x −6 사이에 맞춘다 — 한 장 폭 2.3칸)
      ["prop", "a4-abyss-wall", -21.85, 9.6, 1, 0, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-02", -21.85, 9.6, 1, 0, "ok=cliff;over=1"],
      ["prop", "a4-abyss-wall", -19.65, 9.6, 1, 1, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-03", -19.65, 9.6, 1, 1, "ok=cliff;over=1"],
      ["prop", "a4-abyss-wall", -9.35, 9.6, 1, 0, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-02", -9.35, 9.6, 1, 0, "ok=cliff;over=1"],
      ["prop", "a4-abyss-wall", -7.15, 9.6, 1, 1, "ok=cliff"], ["prop", "a4-abyss-wall-pulse-03", -7.15, 9.6, 1, 1, "ok=cliff;over=1"]],
    dress: Object.assign({}, abyssDress, { e: { props: ["a4-soul-lantern", "a4-sigil-stone"], n: 4, decals: ["a4-decal-lava-crack", "a4-decal-scorch"], dn: 5 } }),
  }), { fx: true }),
  ashhall: remix(A1.cellar1, Object.assign({}, ABYSS, {
    title: "재의 회랑",
    story: ["재가 무릎까지 쌓인 회랑. 투구 창고와 갑옷 창고 사이 좁은 재의 통로가 매복 길목, 고리길로 돌면 혼등 우물방. (자리: 지하실 1층을 좌우로 뒤집음)"],
    zones: { a: "a4-basalt 0.78/0.74/0.74 내려온 계단", b: "a4-scorched_pavers 0.78/0.72/0.7 투구 창고", c: "a4-scorched_pavers 0.74/0.68/0.66 갑옷 창고", d: "a4-bone_pit 0.7/0.66/0.64 재의 통로", e: "a4-abyss_rune 0.9/0.84/0.84 혼등 우물방", f: "a4-basalt 0.82/0.78/0.78 아래 계단참" },
    put: [["prop", "a4-soul-crystal", -17.5, 2.4, 1, 0]],
    dress: {
      a: { props: ["a4-brazier"], n: 2 },
      b: { sets: ["a4_lm_ash_river"], props: ["a4-helm-pile", "a4-melted-armor-pile", "a4-soul-lantern"], n: 10, decals: ["a4-decal-ash-heap"], dn: 3 },
      c: { props: ["a4-melted-armor-pile", "a4-helm-pile", "a4-chain-pillar"], n: 9, decals: ["a4-decal-ash-heap"], dn: 2 },
      d: { decals: ["a4-decal-ash-heap", "a4-decal-scorch"], dn: 3 },
      e: { props: ["a4-soul-lantern", "a4-sigil-stone"], n: 4, decals: ["a4-decal-scorch"], dn: 2 },
      f: { props: ["a4-brazier"], n: 2 },
    },
  }), { fx: true }),
  throneante: remix(A2.archive, {
    title: "옥좌의 전실",
    story: ["옥좌로 가는 마지막 전실. 뿔 달린 석상 줄이 선 대기실 셋이 알현 복도로 이어지고, 동쪽 큰 전실 끝이 옥좌로 오르는 문.", "(자리: 잊힌 서고를 위아래로 뒤집음 — 서가 줄이 석상 줄)"],
    base: "a4-abyss_rune 0.84/0.78/0.78",
    walls: { "#": "basalt-cliff 1/1/1 현무암 벽", "%": "ruin-wall 0.5/0.42/0.42 석상 줄" },
    zones: {
      a: "a4-basalt 0.78/0.74/0.74 전실 문",
      b: "a4-scorched_pavers 0.82/0.76/0.74 서쪽 대기실",
      c: "a4-scorched_pavers 0.8/0.74/0.72 북쪽 대기실",
      d: "a4-abyss_rune 0.86/0.8/0.8 알현 복도",
      e: "a4-scorched_pavers 0.78/0.72/0.7 남쪽 대기실",
      f: "a4-abyss_rune 0.96/0.88/0.86 큰 전실",
    },
    gates: { W: [-29, 1], E: [28, 1] },
    extra: undefined,
    dress: {
      a: { props: ["a4-brazier"], n: 2 },
      b: { props: ["a4-horned-statue", "a4-demon-banner", "a4-brazier"], n: 6, decals: ["a4-decal-scorch"], dn: 2 },
      c: { props: ["a4-horned-statue", "a4-soul-lantern"], n: 6, decals: ["a4-decal-ash-heap"], dn: 2 },
      d: { props: ["a4-demon-banner"], n: 2, decals: ["a4-decal-lava-crack"], dn: 2 },
      e: { props: ["a4-horned-statue", "a4-soul-lantern"], n: 6, decals: ["a4-decal-ash-heap"], dn: 2 },
      f: { sets: ["a4_lm_kneeling_row"], props: ["a4-horned-statue", "a4-demon-banner", "a4-brazier", "a4-sigil-stone"], n: 9, decals: ["a4-decal-lava-crack", "a4-decal-scorch"], dn: 5 },
    },
  }, { fy: true }),
  throne: remix(A1.queentomb, {
    title: "군주의 옥좌",
    story: ["옥좌로 오르는 마지막 길. 근위대의 방·제물의 방을 지나 봉인된 문간 너머 재의 옥좌 — 재의 왕 고르바스가 옥좌 앞에 선다.", "(자리: 여왕의 무덤을 좌우·상하로 뒤집음 — 들어온 문이 동쪽 · 호위는 회랑에만)"],
    base: "a4-abyss_rune 0.86/0.8/0.8",
    walls: { "#": "basalt-cliff 0.9/0.82/0.8 옥좌의 벽" },
    zones: {
      a: "a4-basalt 0.78/0.74/0.74 옥좌 계단",
      b: "a4-scorched_pavers 0.8/0.74/0.72 근위대의 방",
      c: "a4-soul_prison 0.78/0.74/0.78 제물의 방",
      d: "a4-abyss_rune 0.84/0.78/0.78 봉인된 문간",
      e: "a4-abyss_rune 1/0.9/0.86 재의 옥좌",
    },
    fixed: { ashking: [-18, 5] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    // 10-28 밤 코덱스 최종 보스 아레나 7장 (요청서 a4 5절): 심장 제단은 북쪽 벽까지 올리고 그 앞에 옥좌 단(계단) — 보스는 단 아래 선다.
    //   단 양옆 찢긴 군기, 북쪽 벽 양 끝 거대 사슬 고리, 북동·남동 구석 부러진 오벨리스크, 아레나 네 기둥(1×1 바위) 자리에 불기둥 화로, 한가운데 용암 문장 원
    put: [
      ["set", "boss_ashking", -17.5, 5.5, 1, 1], ["set", "a4_lm_heart_altar", -17.5, 11.3],
      ["prop", "a4-throne-dais", -17.5, 8.4], ["prop", "a4-throne-banner-ruin", -22.5, 8.9], ["prop", "a4-throne-banner-ruin", -12.5, 8.9, 1, 1],
      ["prop", "a4-giant-chain-anchor-left", -26.5, 11.3], ["prop", "a4-giant-chain-anchor-right", -8.5, 11.3],
      ["prop", "a4-broken-obelisk", -4.2, 10.6], ["prop", "a4-broken-obelisk", -4.6, -8.3, 1, 1],
      ["prop", "a4-ember-pillar", -24, 9.2, 1, 0, "ok=cliff"], ["prop", "a4-ember-pillar", -6, 7.2, 1, 1, "ok=cliff"],
      ["prop", "a4-ember-pillar", -24, -5.8, 1, 0, "ok=cliff"], ["prop", "a4-ember-pillar", -6, -4.8, 1, 1, "ok=cliff"],
      ["decal", "a4-decal-sigil-circle-large", -15, 1.6],
    ],
    dress: {
      a: { props: ["a4-brazier"], n: 2 },
      b: { sets: ["a4_ember_shrine"], props: ["a4-helm-pile", "a4-demon-banner", "a4-chain-pillar"], n: 7, decals: ["a4-decal-ash-heap", "a4-decal-broken-chain"], dn: 4 },
      c: { sets: ["a4_chain_shrine"], props: ["a4-soul-cage", "a4-soul-lantern", "a4-bone-heap"], n: 7, decals: ["a4-decal-scorch", "a4-decal-soul-mist-puddle", "a4-decal-blood-sigil-circle"], dn: 4 },
      d: { props: ["a4-brazier"], n: 2, decals: ["a4-decal-cracked-obsidian"], dn: 2 },
      e: { props: ["a4-demon-banner", "a4-brazier"], n: 3, decals: ["a4-decal-blood-sigil-circle", "a4-decal-cracked-obsidian", "a4-decal-lava-crack", "a4-decal-molten-drip"], dn: 8 },
    },
  }, { fx: true, fy: true }),

  // 곁가지 7장
  sulfurcave1: remix(A1.pit1, Object.assign({}, SULFUR("0.9/0.86/0.74"), {
    title: "유황 동굴 1층",
    story: ["협곡 아래 유황이 끓는 동굴. 비탈을 내려가 유황 기둥 광장을 지나면 아래 굴. (자리: 뼈 구덩이 1층을 좌우로 뒤집음 — 들어온 문이 동쪽)"],
    zones: { a: "a4-sulfur_cave 0.84/0.8/0.7 굴 어귀", b: "a4-sulfur_mud 0.82/0.8/0.7 유황 비탈", c: "a4-sulfur_cave 0.98/0.92/0.76 유황 기둥 광장", d: "a4-basalt 0.74/0.7/0.68 매복 굴", e: "a4-sulfur_mud 0.76/0.74/0.66 끓는 고리길", f: "a4-sulfur_cave 0.86/0.82/0.72 아래 굴" },
    dress: {
      a: { props: ["a4-sulfur-stalagmite"], n: 3 },
      b: { props: ["a4-sulfur-stalagmite", "a4-sulfur-pool"], n: 6, decals: ["a4-decal-sulfur-stain"], dn: 2 },
      c: { sets: ["a4_lava_mound"], props: ["a4-sulfur-stalagmite", "a4-sulfur-pool", "a4-bone-heap"], n: 7, decals: ["a4-decal-sulfur-stain", "a4-decal-molten-drip"], dn: 4 },
      d: { sets: ["a4_lm_sulfur_cluster"], props: ["a4-sulfur-stalagmite", "a4-bone-heap"], n: 5, decals: ["a4-decal-ash-heap"], dn: 2 },
      e: { props: ["a4-sulfur-pool"], n: 5, decals: ["a4-decal-sulfur-stain"], dn: 2 },
      f: { props: ["a4-sulfur-stalagmite"], n: 2 },
    },
  }), { fx: true }),
  sulfurcave2: remix(A1.pit2, Object.assign({}, SULFUR("0.88/0.84/0.72"), {
    title: "유황 동굴 2층",
    put: [["set", "a4_lm_bone_roost", -17.5, 7.3, 1, 1]],
    extra: { end: [-18, 4], return: [-24, 7] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["유황 여왕 네르사의 둥지. 끓는 웅덩이 사이로 여왕의 굴, 구석에 되돌아가는 문. (자리: 뼈 구덩이 2층을 좌우·상하로 뒤집음)"],
    zones: { a: "a4-sulfur_cave 0.84/0.8/0.7 계단참", b: "a4-sulfur_mud 0.8/0.78/0.68 유황 무더기 길", c: "a4-basalt 0.72/0.68/0.66 북쪽 굴", d: "a4-sulfur_cave 1/0.94/0.78 유황 여왕의 굴" },
    dress: {
      a: { props: ["a4-sulfur-stalagmite"], n: 2 },
      b: { props: ["a4-sulfur-stalagmite", "a4-sulfur-pool", "a4-bone-heap"], n: 8, decals: ["a4-decal-sulfur-stain"], dn: 3 },
      c: { props: ["a4-bone-heap", "a4-sulfur-stalagmite"], n: 6, decals: ["a4-decal-ash-heap"], dn: 2 },
      d: { props: ["a4-sulfur-pool", "a4-small-lava-fount", "a4-sulfur-stalagmite"], n: 9, decals: ["a4-decal-sulfur-stain", "a4-decal-molten-drip"], dn: 5 },
    },
  }), { fx: true, fy: true }),
  soulprison: {
    size: [60, 40],
    title: "혼 감옥",
    put: [
      ["set", "a4_lm_soul_cage", 19.5, 10.3],
      // 10-29 코덱스 감사 c-2: 창살은 꾸밈 무작위 말고 고정 — 복도와 감방 사이 벽 줄(문 사이)에 가로 창살, 감방끼리 나누는 벽에 세로 창살 (발은 벽 칸이라 ok=cliff)
      ["prop", "a4-prison-bars-h", -13, 3.05, 1, 0, "ok=cliff"], ["prop", "a4-prison-bars-h", -5, 3.05, 1, 1, "ok=cliff"],
      ["prop", "a4-prison-bars-h", -13, -2.95, 1, 0, "ok=cliff"], ["prop", "a4-prison-bars-h", -5, -2.95, 1, 1, "ok=cliff"],
      ["prop", "a4-prison-bars-v", -12, 6.1, 1, 0, "ok=cliff"], ["prop", "a4-prison-bars-v", -4, 6.1, 1, 0, "ok=cliff"],
      ["prop", "a4-prison-bars-v", -12, -8.9, 1, 0, "ok=cliff"], ["prop", "a4-prison-bars-v", -4, -8.9, 1, 0, "ok=cliff"],
    ],
    story: ["악마들이 혼을 가둬 둔 감옥. 긴 감방 복도 양쪽으로 감방 여섯, 북쪽 위로 고문실.", "복도 끝 간수장의 방에 간수장 그림달. 방 구석에 되돌아가는 문."],
    base: "a4-soul_prison 0.84/0.8/0.84",
    walls: { "#": "basalt-cliff 1/1/1 감옥 벽" },
    zones: {
      a: "a4-basalt 0.76/0.72/0.74 감옥 문",
      b: "a4-soul_prison 0.8/0.76/0.8 감방 복도",
      c: "a4-soul_prison 0.66/0.62/0.68 감방",
      d: "a4-bone_pit 0.76/0.68/0.66 고문실",
      e: "a4-soul_prison 0.96/0.9/0.94 간수장의 방",
    },
    places: [
      R("a", "감옥 문", -28, -3, -23, 3),
      R("b", "감방 복도", -21, -2, 5, 2, { rough: 0.3 }),
      R("c", "북쪽 감방 1", -19, 4, -14, 9, { torch: false }), R("c", "북쪽 감방 2", -11, 4, -6, 9, { torch: false }), R("c", "북쪽 감방 3", -3, 4, 2, 9, { torch: false }),
      R("c", "남쪽 감방 1", -19, -9, -14, -4, { torch: false }), R("c", "남쪽 감방 2", -11, -9, -6, -4, { torch: false }), R("c", "남쪽 감방 3", -3, -9, 2, -4, { torch: false }),
      R("d", "고문실", -10, 12, 6, 17),
      R("e", "간수장의 방", 9, -11, 26, 11, { rough: 0.5, note: "간수장 · 봉인 상자 · 되돌아가는 문" }),
    ],
    paths: [
      P([[-30, 0], [9, 0]], 3), P([[-16.5, 2], [-16.5, 4]], 2), P([[-8.5, 2], [-8.5, 4]], 2), P([[-0.5, 2], [-0.5, 4]], 2),
      P([[-16.5, -2], [-16.5, -4]], 2), P([[-8.5, -2], [-8.5, -4]], 2), P([[-0.5, -2], [-0.5, -4]], 2),
      P([[-0.5, 9], [-0.5, 12]], 3), P([[6, 14], [14, 14], [14, 11]], 3),
    ],
    rocks: [rock(13, 6, 1, 1), rock(13, -6, 1, 1), rock(22, 6, 1, 1), rock(22, -6, 1, 1)],
    gates: { W: [-29, 0] },
    extra: { end: [19, 7], return: [24, -9] },   // 10-28 랜드마크(코덱스 act234) 앞으로 (전에는 0)
    dress: {
      a: { props: ["a4-prison-gate"], n: 1 },
      b: { props: ["a4-soul-lantern"], n: 4, decals: ["a4-decal-scorch"], dn: 3 },
      c: { props: ["a4-soul-cage", "a4-bone-heap"], n: 2, decals: ["a4-decal-ash-heap"], dn: 1 },   // 창살은 put으로 고정 (10-29)
      d: { props: ["a4-chain-pillar", "a4-soul-cage", "a4-bone-heap"], n: 7, decals: ["a4-decal-scorch", "a1-decal-blood-pool"], dn: 3 },
      e: { props: ["a4-soul-cage", "a4-soul-lantern", "a4-chain-pillar"], n: 8, decals: ["a4-decal-scorch", "a4-decal-ash-heap"], dn: 5 },
    },
  },
  forge1: {
    size: [60, 40],
    title: "용암 대장간 1층",
    story: ["유황 늪 아래 악마들의 대장간. 용암 도랑이 흐르는 주조실과 석탄 창고 사이 풀무실이 한가운데.", "풀무실 동쪽 담금질 방과 연마실을 지나 아래 계단."],
    base: "a4-molten_forge 0.86/0.8/0.76",
    walls: { "#": "basalt-cliff 1/1/1 대장간 벽", "~": "basalt-cliff 1/0.5/0.3 용암 도랑" },
    zones: {
      a: "a4-basalt 0.78/0.74/0.72 입구",
      b: "a4-molten_forge 0.92/0.82/0.74 주조실",
      c: "a4-scorched_pavers 0.7/0.66/0.64 석탄 창고",
      d: "a4-molten_forge 1/0.9/0.8 풀무실",
      e: "a4-lava_crack 0.84/0.76/0.7 담금질 방",
      f: "a4-scorched_pavers 0.82/0.76/0.72 연마실",
      g: "a4-basalt 0.84/0.8/0.78 아래 계단",
    },
    places: [
      R("a", "입구", -28, -3, -23, 3),
      R("b", "주조실", -20, 5, -6, 14, { note: "용암 도랑" }),
      R("c", "석탄 창고", -20, -14, -8, -5),
      R("d", "풀무실", -3, -5, 9, 5, { note: "용암 도랑" }),
      R("e", "담금질 방", 12, -13, 24, -4),
      R("f", "연마실", 12, 4, 24, 13),
      R("g", "아래 계단", 25, -2, 28, 2),
    ],
    paths: [
      P([[-30, 0], [-3, 0]], 3), P([[-13, 0], [-13, 5]], 3), P([[-13, 0], [-13, -5]], 3), P([[9, 0], [28, 0]], 3),
      P([[18, 0], [18, 4]], 3), P([[18, 0], [18, -4]], 3), P([[-6, 10], [2, 10], [2, 5]], 3), P([[-8, -10], [2, -10], [2, -5]], 3),
      // 세로 쇳물 홈 자리(x −16·−10, y 10~14) 양옆 1칸은 장식을 두지 않는다 — 홈 그림 발이 한 칸이라 그 위로 갑옷 더미가 놓였다 (keep만 · 이미 바닥이라 파는 칸 없음)
      P([[-15.5, 11.5], [-15.5, 13.5]], 3, undefined, undefined, { wobble: 0 }), P([[-9.5, 11.5], [-9.5, 13.5]], 3, undefined, undefined, { wobble: 0 }),
    ],
    rocks: [wall([[-18, 9], [-8, 9]], "~", [[-13, 9, 1.3]]), wall([[-1, 3], [7, 3]], "~", [[3, 3, 1.3]]), wall([[-1, -3], [7, -3]], "~", [[3, -3, 1.3]])],
    gates: { W: [-29, 0], E: [28, 0] },
    // 10-29 코덱스 감사 c-2: 세로 쇳물 홈 — 주조실 북쪽 벽에서 두 용암 도랑(~)으로 쇳물이 흘러내린다
    //   메이커 재캡처: 1칸 조각(배율 1)은 홈이 0.08칸 선이라 안 보였다 → art_scale 4.9(홈 폭 ≈0.37칸 · 길이 5칸) 한 장으로 도랑 윗변(y 10)~북쪽 벽(y 15)을 잇는다
    put: [-16, -10].map((x) => ["prop", "a4-molten-channel-v", x, 10]),
    dress: {
      a: { props: ["a4-brazier"], n: 2 },
      // 가로 쇳물 홈(a4-molten-channel-h)은 뺐다 — 흩뿌린 1칸 조각 3개가 세로 홈과 이어지지 않고 잡동사니처럼 보였다 (10-29 메이커 재캡처)
      b: { props: ["a4-forge-anvil", "a4-melted-armor-pile"], n: 8, decals: ["a4-decal-molten-drip", "a4-decal-scorch"], dn: 4 },
      c: { props: ["a4-bone-heap", "a4-imp-on-barrel", "a4-helm-pile"], n: 8, decals: ["a4-decal-ash-heap"], dn: 3 },
      d: { props: ["a4-forge-anvil", "a4-brazier", "a4-small-lava-fount"], n: 6, decals: ["a4-decal-molten-drip"], dn: 3 },
      e: { sets: ["a4_lm_great_smelter"], props: ["a4-small-lava-fount", "a4-melted-armor-pile", "a4-lava-wall-ruin"], n: 7, decals: ["a4-decal-lava-crack"], dn: 3 },
      f: { props: ["a4-forge-anvil", "a4-helm-pile", "a4-chain-pillar"], n: 7, decals: ["a4-decal-scorch"], dn: 3 },
      g: { props: ["a4-brazier"], n: 1 },
    },
  },
  forge2: remix(A1.cellar2, {
    title: "용암 대장간 2층",
    extra: { end: [-20, 7], return: [-25, -9] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["대장간 아래층. 무너진 광석 창고와 용암 웅덩이 방을 지나면 대장장이 악마 베르카의 대장간. 구석에 되돌아가는 문. (자리: 지하실 2층을 좌우로 뒤집음 — 들어온 문이 동쪽)"],
    base: "a4-molten_forge 0.84/0.78/0.74",
    walls: { "#": "basalt-cliff 1/1/1 대장간 벽" },
    zones: { a: "a4-basalt 0.78/0.74/0.72 계단참", b: "a4-scorched_pavers 0.74/0.7/0.68 광석 창고", c: "a4-lava_crack 0.86/0.74/0.66 용암 웅덩이 방", d: "a4-basalt 0.8/0.76/0.74 갈림 방", e: "a4-molten_forge 1/0.9/0.8 베르카의 대장간" },
    put: [["prop", "a4-forge-anvil", -23, 4, 1.3, 0], ["set", "a4_lm_berka_anvil", -19.5, 10.3]],
    dress: {
      a: { props: ["a4-brazier"], n: 2 },
      b: { props: ["a4-bone-heap", "a4-helm-pile", "a4-imp-on-barrel"], n: 8, decals: ["a4-decal-ash-heap"], dn: 2 },
      c: { props: ["a4-small-lava-fount", "a4-sulfur-stalagmite"], n: 6, decals: ["a4-decal-lava-crack", "a4-decal-molten-drip"], dn: 4 },
      d: { props: ["a4-brazier"], n: 2 },
      e: { props: ["a4-forge-anvil", "a4-melted-giant-armor", "a4-brazier", "a4-chain-pillar"], n: 8, decals: ["a4-decal-molten-drip", "a4-decal-scorch"], dn: 5 },
    },
  }, { fx: true }),
  apostate: remix(A2.archive, {
    title: "배교자의 수도원",
    put: [["set", "a4_lm_apostate_altar", -20.5, 10.3, 1, 1]],
    extra: { end: [-21, 7], return: [-26, 9] },   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["심장을 섬기는 배교자들의 수도원. 신도석 줄 기도실 셋이 회랑으로 이어지고, 가장 안쪽 제단에 심장의 사도 오렌. 제단 구석에 되돌아가는 문.", "(자리: 잊힌 서고를 좌우·상하로 뒤집음 — 들어온 문이 동쪽)"],
    base: "a4-apostate_chapel 0.86/0.8/0.8",
    walls: { "#": "basalt-cliff 1/1/1 수도원 벽", "%": "ruin-wall 0.46/0.36/0.36 신도석 줄" },
    zones: {
      a: "a4-basalt 0.78/0.74/0.74 수도원 문",
      b: "a4-apostate_chapel 0.8/0.74/0.74 서쪽 기도실",
      c: "a4-apostate_chapel 0.78/0.72/0.72 북쪽 기도실",
      d: "a4-scorched_pavers 0.8/0.74/0.72 회랑",
      e: "a4-apostate_chapel 0.76/0.7/0.7 남쪽 기도실",
      f: "a4-apostate_chapel 1/0.88/0.86 심장의 제단",
    },
    dress: {
      a: { props: ["a4-soul-lantern"], n: 2 },
      b: { props: ["a4-horned-statue", "a4-soul-lantern"], n: 6, decals: ["a4-decal-scorch"], dn: 2 },
      c: { props: ["a4-horned-statue", "a4-sigil-stone"], n: 6, decals: ["a4-decal-ash-heap"], dn: 2 },
      d: { props: ["a4-soul-lantern"], n: 2, decals: ["a1-decal-blood-pool"], dn: 2 },
      e: { props: ["a4-horned-statue", "a4-soul-lantern"], n: 6, decals: ["a4-decal-scorch"], dn: 2 },
      f: { props: ["a4-apostate-altar", "a4-horned-statue", "a4-soul-lantern", "a4-sigil-stone"], n: 8, decals: ["a1-decal-blood-pool", "a4-decal-scorch"], dn: 5 },
    },
  }, { fx: true, fy: true }),
  pit: remix(A1.hollow, Object.assign({}, {
    title: "타락의 구덩이",
    put: [["prop", "a4-landmark-fallen-knight-sword-grave", -21.5, 12.3, 1.15, 0]],   // 10-28 랜드마크(코덱스 act234) — 보스가 그 앞에 선다
    story: ["심연의 문 아래 타락한 기사들이 떨어진 구덩이. 갈림 굴들이 뼈 둥지로 모이고, 가장 깊은 굴에 타락한 기사 이그나. 구석에 되돌아가는 문. (자리: 굶주린 굴을 좌우·상하로 뒤집음)"],
    base: "a4-bone_pit 0.82/0.76/0.72",
    walls: { "#": "basalt-cliff 0.9/0.84/0.82 구덩이 벽" },
    zones: { a: "a4-basalt 0.76/0.72/0.7 구덩이 어귀", b: "a4-bone_pit 0.74/0.68/0.66 갉힌 길목", c: "a4-bone_pit 0.68/0.62/0.6 투구 무더기 굴", d: "a4-bone_pit 0.86/0.8/0.76 뼈 둥지", e: "a4-lava_crack 0.76/0.68/0.64 갈라진 굴", f: "a4-bone_pit 0.7/0.64/0.62 기사의 굴" },
    dress: {
      a: { props: ["a4-bone-heap"], n: 3 },
      b: { props: ["a4-bone-heap", "a4-helm-pile"], n: 5, decals: ["a4-decal-ash-heap"], dn: 3 },
      c: { props: ["a4-helm-pile", "a4-melted-armor-pile", "a4-bone-heap"], n: 7, decals: ["a4-decal-ash-heap"], dn: 2 },
      d: { sets: ["a4_fallen_giant"], props: ["a4-bone-heap", "a4-dead-tree", "a4-helm-pile"], n: 9, decals: ["a4-decal-scorch", "a4-decal-ash-heap"], dn: 5 },
      e: { props: ["a4-small-lava-fount", "a4-bone-heap"], n: 5, decals: ["a4-decal-lava-crack"], dn: 2 },
      f: { props: ["a4-chain-pillar", "a4-bone-heap"], n: 4, decals: ["a4-decal-scorch"], dn: 2 },
    },
  }), { fx: true, fy: true }),
};

// ───────── 10-28 저녁 코덱스 액트 4 전체 묶음(assets/codex-a4-handmade-v1) + 설계 42 높이감 ─────────
// 위 설계서는 10-20 1차 그림 이름 그대로 두고, 여기서 새 그림으로 바꾼다 (자리·길·충돌은 그대로).
//   바닥 10 · 길 2 · 벽 3벌(현무암 절벽 r2 · 악마 성채 · 심연 혼 핏줄) · 바위 윗면 · 바닥 무늬 10 · 곁 조각 10
const NEW_ART = {
  "a4-basalt": "a4-ash-basalt-floor", "a4-lava_crack": "a4-cooled-lava-floor", "a4-scorched_pavers": "a4-scorched-flagstone-floor",
  "a4-abyss_rune": "a4-obsidian-floor", "a4-soul_prison": "a4-soul-stone-floor", "a4-sulfur_mud": "a4-sulfur-crust-floor",
  "a4-sulfur_cave": "a4-sulfur-crust-floor", "a4-bone_pit": "a4-bone-ash-floor", "a4-molten_forge": "a4-forge-grate-floor",
  "a4-apostate_chapel": "a4-scorched-flagstone-floor", "a4-demon_march_ew": "a4-march-road",
};
// 옛 그림은 어둡게 칠해 쓰던 색이라(밝기 0.23~0.29), 새 그림(0.32~0.42로 맞춰 옴)에는 어둡게 하는 몫을 절반으로
const soften = (t) => t.split("/").map((v) => String(Math.round((1 - (1 - Number(v)) * 0.5) * 100) / 100)).join("/");
const reArt = (line) => {
  const [art, tint, ...name] = line.split(" ");
  return NEW_ART[art] ? [NEW_ART[art], soften(tint), ...name].join(" ") : line;
};
const NEW_DECAL = {
  "a4-decal-lava-crack": "a4-decal-ember-scatter", "a4-decal-scorch": "a4-decal-scorched-ring", "a4-decal-ash-heap": "a4-decal-ash-pile",
  "a4-decal-molten-drip": "a4-decal-molten-metal-streak", "a4-decal-sulfur-stain": "a4-decal-sulfur-steam-vent", "a4-decal-hoofprints": "a4-decal-ash-footprints",
};
// 곁 조각(1~2칸 소품): 그 구역에 이미 있는 큰 소품과 어울리는 것을 같이 뿌린다
const ADJUNCT = {
  "a4-bone-heap": "a4-adjunct-chained-skull", "a4-brazier": "a4-adjunct-ember-brazier", "a4-soul-lantern": "a4-adjunct-soul-candle-cluster",
  "a4-helm-pile": "a4-adjunct-demon-skull-spear", "a4-melted-armor-pile": "a4-adjunct-ash-urn", "a4-sulfur-stalagmite": "a4-adjunct-lava-rubble",
  "a4-soul-cage": "a4-adjunct-small-iron-cage", "a4-sigil-stone": "a4-adjunct-obsidian-shards", "a4-wood-fence-h": "a4-adjunct-broken-siege-spike",
  "a4-forge-anvil": "a4-adjunct-burning-cart", "camp-firewood": "a4-adjunct-burning-cart", "a4-dead-tree": "a4-adjunct-lava-rubble",
};
const reDress = (dress) => Object.fromEntries(Object.entries(dress || {}).map(([z, d]) => {
  const props = d.props ? [...new Set([...d.props, ...d.props.map((p) => ADJUNCT[p]).filter(Boolean)])] : d.props;
  const decals = d.decals ? [...new Set(d.decals.map((x) => NEW_DECAL[x] || x))] : d.decals;
  return [z, Object.assign({}, d, props ? { props } : {}, decals ? { decals } : {})];
}));
const CLIFF = "a4-basalt-cliff-r2", FORT = "a4-fortress-wall", VEIN = "a4-abyss-vein-wall", TOP = "top=a4-basalt-top";
// 벽 묶음: 장소마다 다른 벽 (요청서 5절) — 성채 줄기·수도원 = 악마 성채, 심연의 문·혼 감옥 = 혼 핏줄, 나머지 = 현무암 절벽 r2
const WALL_SET = { burningkeep: FORT, ashhall: FORT, throneante: FORT, throne: FORT, apostate: FORT, abyssgate1: VEIN, abyssgate2: VEIN, abyssgate3: VEIN, soulprison: VEIN };
// 설계 42 높이감 (10-28 저녁 사용자 「액트 4도 높이감 · 2층 3층은 겹으로 쌓아 보이게」): 걷는 칸 = 용암 위 섬·성벽 윗면, 낮은 칸(첫 벽 글자) = 용암 바다.
//   tiers = 앞면 띠 단 수(층이 높을수록 깊다), below = 보스 층에서 아래층이 작고 어둡게 내려다보인다
// 낮은 칸은 멀리 아래라 어둡게 (메이커 첫 캡처: 1/1/1이면 걷는 바닥과 밝기가 같아 평지로 읽혔다)
// 용암 가장자리 띠 (10-28 밤 코덱스 a4-decal-lava-edge-h/v): 용암 바다와 맞닿은 섬·성벽 가장자리에 빛나는 껍질 테두리 — 북·동·서는 윗단 바깥, 남쪽은 앞면 띠 맨 아래 (lib.cjs 2-2)
const EDGE = " edge=a4-decal-lava-edge-h:a4-decal-lava-edge-v:0.9";
const LAVA = "low=a4-lava-sea-floor:0.7/0.56/0.52" + EDGE, VOID = "low=a4-lava-sea-floor:0.46/0.34/0.58", DEEP = "low=a4-lava-sea-floor:0.6/0.48/0.46" + EDGE;
const HEIGHT = {
  embercanyon: [CLIFF, 1, LAVA], sulfurmarsh: [CLIFF, 1, LAVA], heartbridge: [CLIFF, 1, LAVA],   // demonroad는 성채 성벽 2단을 설계서에 직접 (10-29 담 위)
  burningkeep: [FORT, 1, LAVA], ashhall: [FORT, 2, DEEP], throneante: [FORT, 2, DEEP],
  throne: [FORT, 3, "below=a4-scorched-flagstone-floor:0.55:0.62:1/0.62/0.5"],
  abyssgate1: [VEIN, 1, VOID], abyssgate2: [VEIN, 2, VOID], abyssgate3: [VEIN, 3, "below=a4-scorched-flagstone-floor:0.55:0.66:0.72/0.56/1"],
  forge2: [CLIFF, 2, LAVA],
};
// 10-28 밤 코덱스 남은 바닥 무늬 4 (피 문장 원 · 끊어진 사슬 · 금 간 흑요석 · 혼 안개 웅덩이) + 곁 조각 세트 4 (map_sets.csv a4_chain_shrine · a4_siege_wreck · a4_ember_shrine · a4_lava_cairn)
//   세트가 없던 장소(구역 글자)마다 하나씩 — 장소가 이야기를 갖게 (feedback-map-set-pieces)
const MORE = {
  outpost: { c: { sets: ["a4_siege_wreck"] }, d: { sets: ["a4_ember_shrine"] } },
  embercanyon: { a: { sets: ["a4_lava_cairn"] }, e: { sets: ["a4_lava_cairn"], decals: ["a4-decal-cracked-obsidian"] }, g: { sets: ["a4_ember_shrine"] } },
  demonroad: { a: { sets: ["a4_siege_wreck"] }, d: { sets: ["a4_chain_shrine"], decals: ["a4-decal-broken-chain", "a4-decal-soul-mist-puddle"] }, g: { sets: ["a4_siege_wreck"] } },
  sulfurmarsh: { a: { sets: ["a4_lava_cairn"] }, d: { sets: ["a4_lava_cairn"], decals: ["a4-decal-cracked-obsidian"] }, g: { sets: ["a4_ember_shrine"] } },
  burningkeep: { a: { sets: ["a4_siege_wreck"] }, d: { sets: ["a4_ember_shrine"], decals: ["a4-decal-blood-sigil-circle"] } },
  heartbridge: { a: { sets: ["a4_lava_cairn"] }, b: { decals: ["a4-decal-cracked-obsidian"] }, c: { decals: ["a4-decal-cracked-obsidian"] }, d: { decals: ["a4-decal-soul-mist-puddle"] }, f: { decals: ["a4-decal-cracked-obsidian"] }, g: { sets: ["a4_ember_shrine"] } },   // 둘째 기둥참(f)은 좁아 세트 자리가 없다
  abyssgate1: { b: { sets: ["a4_chain_shrine"] }, c: { sets: ["a4_chain_shrine"], decals: ["a4-decal-soul-mist-puddle"] }, e: { sets: ["a4_lava_cairn"] }, f: { decals: ["a4-decal-cracked-obsidian"] } },
  abyssgate2: { b: { sets: ["a4_ember_shrine"] }, c: { sets: ["a4_chain_shrine"], decals: ["a4-decal-soul-mist-puddle"] }, e: { sets: ["a4_lava_cairn"] }, f: { decals: ["a4-decal-cracked-obsidian"] } },
  abyssgate3: { b: { sets: ["a4_chain_shrine"] }, c: { sets: ["a4_ember_shrine"], decals: ["a4-decal-soul-mist-puddle"] }, e: { decals: ["a4-decal-blood-sigil-circle", "a4-decal-soul-mist-puddle"] }, f: { sets: ["a4_lava_cairn"], decals: ["a4-decal-cracked-obsidian"] } },
  ashhall: { c: { sets: ["a4_chain_shrine"], decals: ["a4-decal-broken-chain"] }, e: { sets: ["a4_ember_shrine"], decals: ["a4-decal-soul-mist-puddle"] } },
  throneante: { b: { sets: ["a4_siege_wreck"], decals: ["a4-decal-broken-chain"] }, c: { sets: ["a4_ember_shrine"] }, d: { decals: ["a4-decal-cracked-obsidian"] }, e: { sets: ["a4_chain_shrine"] }, f: { decals: ["a4-decal-cracked-obsidian", "a4-decal-blood-sigil-circle"] } },
  soulprison: { b: { decals: ["a4-decal-broken-chain"] }, c: { decals: ["a4-decal-soul-mist-puddle"] }, d: { sets: ["a4_chain_shrine"], decals: ["a4-decal-broken-chain"] }, e: { sets: ["a4_ember_shrine"], decals: ["a4-decal-broken-chain", "a4-decal-soul-mist-puddle"] } },
  forge1: { b: { decals: ["a4-decal-broken-chain"] }, c: { sets: ["a4_siege_wreck"] }, f: { sets: ["a4_lava_cairn"], decals: ["a4-decal-broken-chain"] } },
  forge2: { b: { sets: ["a4_siege_wreck"] }, e: { decals: ["a4-decal-broken-chain"] } },
  apostate: { b: { sets: ["a4_ember_shrine"] }, c: { sets: ["a4_chain_shrine"] }, d: { decals: ["a4-decal-blood-sigil-circle"] }, e: { sets: ["a4_ember_shrine"] }, f: { decals: ["a4-decal-blood-sigil-circle"] } },
  pit: { b: { sets: ["a4_lava_cairn"] }, c: { sets: ["a4_chain_shrine"] }, f: { decals: ["a4-decal-broken-chain"] } },
  sulfurcave1: { b: { sets: ["a4_lava_cairn"] }, e: { sets: ["a4_chain_shrine"] } },
  sulfurcave2: { b: { sets: ["a4_lava_cairn"] }, c: { sets: ["a4_chain_shrine"] } },
};
for (const [id, zones] of Object.entries(MORE)) for (const [z, add] of Object.entries(zones)) {
  const d = Object.assign({}, module.exports[id].dress[z] || {});
  if (add.sets) d.sets = [...(d.sets || []), ...add.sets];
  if (add.decals) { d.decals = [...new Set([...(d.decals || []), ...add.decals])]; d.dn = (d.dn || 0) + add.decals.length; }
  module.exports[id].dress = Object.assign({}, module.exports[id].dress, { [z]: d });
}
// 10-29 길 위 사건 (기획서 39 #7 A): 사냥터 9장에 장치 하나씩 — 걷는 길(W→E)에서 1~5칸 · 장소 안 · 포털 6.5칸·웨이포인트 4.5칸 밖 (kit.cjs roadEvents)
//   신전 2 · 상자 2 · 둥지 3 · 의식 2 (액트 3과 합쳐 종류마다 4). 보스 맵(심연의 문 3층 · 군주의 옥좌)은 뺐다
require("./kit.cjs").roadEvents(module.exports, 4, {
  embercanyon: ["shrine", -7, -3, 0],    // 혼의 제단 — 협곡 길 곁 흑요석 신전
  demonroad: ["chest", -21, 4, 0],       // 해골 관문 보루 서쪽 어귀 — 행군로 위 약탈품 궤
  sulfurmarsh: ["nest", -4, -2, 0],      // 혼의 제단 — 늪 길 곁 알집
  burningkeep: ["ritual", -2, -4, 0],    // 성채 앞마당 — 혼 사슬 의식
  abyssgate1: ["nest", -6, -1, 0],       // 혼등 회랑
  abyssgate2: ["chest", -9, -2, 1],      // 문장의 홀
  ashhall: ["shrine", -11, 2, 1],        // 재의 통로
  heartbridge: ["nest", -1, -2, 1],      // 무너진 가운데참 — 다리 한가운데 알집
  throneante: ["ritual", 17, 4, 0],      // 큰 전실 — 옥좌 앞 마지막 의식
});
for (const [id, sp] of Object.entries(module.exports)) {
  sp.base = reArt(sp.base);
  sp.zones = Object.fromEntries(Object.entries(sp.zones || {}).map(([k, v]) => [k, reArt(v)]));
  if (sp.roads) sp.roads = Object.fromEntries(Object.entries(sp.roads).map(([k, v]) => [k, reArt(v)]));
  sp.dress = reDress(sp.dress);
  const set = WALL_SET[id] || CLIFF;
  sp.walls = Object.fromEntries(Object.entries(sp.walls || {}).map(([k, v]) => {
    const [art, tint, ...name] = v.split(" ");
    if (art !== "basalt-cliff" || k === "~") return [k, k === "%" && set === FORT ? `${FORT} 1/1/1 ${name.join(" ")}` : v];   // 용암 도랑(~)·석상 줄 등은 그대로, 성채의 성벽 줄(%)은 성채 벽
    return [k, `${set} 1/1/1 ${name.join(" ")} ${TOP}`];
  }));
  const hgt = HEIGHT[id];
  if (hgt) sp.raised = `${hgt[0]} 1/1/1 ${hgt[1] === 1 ? "섬 윗면" : `${hgt[1]}층 윗면`} tiers=${hgt[1]} top=zone face=${hgt[0]}-borders ${hgt[2]}`;
}
// 성채 외곽 바탕 = 바람에 쌓인 재 · 심장의 다리 = 흑요석 기둥참 + 현무암 다리 (요청서 5절)
module.exports.burningkeep.base = "a4-ash-drift-floor 0.96/0.94/0.92";
module.exports.heartbridge.roads = { "=": "a4-basalt-bridge-road 1/1/1 돌다리 wide=2" };   // 다리 길은 2칸 폭 — 난간 그림이 가운데에 또 그려지지 않게 2칸을 한 장으로 (lib.cjs 3-0)
for (const z of ["b", "c", "f"]) module.exports.heartbridge.zones[z] = module.exports.heartbridge.zones[z].replace("a4-scorched-flagstone-floor", "a4-obsidian-floor");

// ───────── 10-31 맵 구성 v5 표본 (2.5단계 · docs/design/map-composition-v5-plan.md) — 유황 늪 (액트 4 A 1순위) ─────────
//   1단계 구획안: 늪 어귀(입구) → 유황 웅덩이(캠프) → 혼의 제단(랜드마크 마당 · 웨이포인트) → 동쪽 둑(출구), 대장간 어귀(굴 입구 갈래) · 거인 갑옷 무덤 · 죽은 숲(곁방).
//   3차 v5 keep: 띠를 새로 그리지 않고 설계도 바닥·길 글자(현무암 둑길)를 그대로 — 길 안내 도장 0 · 역할 배치만 (골격은 배치 비움·검사용)
//   특징(공간당 1 · 16×16당 1): 어귀 죽은 나무 · 웅덩이 용암 둔덕 · 제단 유황 간헐천 · 대장간 어귀 큰 용광로 · 무덤 쓰러진 거인 · 숲 불박쥐 고목 · 동쪽 둑 쓰러진 기사의 검 무덤.
//     세트는 같은 소품 상한을 넘는 조각·세트 안 낱개 기둥만 빼고 특징 조각과 나머지는 남긴다(v5.cjs trimGroup).
//   반복 구조: 간헐천 양옆 사슬 기둥 쌍(역할표 pair 「제단 양옆 쌍」) · 대장간 어귀 담 토막 줄 · 죽은 숲 용암 담 토막 줄 · 동쪽 둑 문 양옆 혼 등불 쌍.
Object.assign(module.exports.sulfurmarsh, {
  // 3차(10-31 사용자 판정 — 띠·구역 재적합판 반려 「기존 바닥 색이 더 좋았다 · 개선 전에서 길 안내만 없는 상태가 낫다」): v5 keep = 바닥·구역·색·길 글자는 길 안내판(5a3d5ee1) 그대로
  waypoint: [1, 3],   // 3차: 웨이포인트를 골격(현무암 둑길) 곁 구역 칸으로 — 둑길 칸 위에 두면 길 그림이 끊기고 이음새가 바뀐다 — (1, 5)는 골격에서 2칸 넘게 떨어져 P5 「웨이포인트는 골격 위」 위반
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { feature: "prop:a4-dead-tree", sets: ["a4_lava_cairn"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      b: { feature: "set:a4_lava_mound", props: ["a4-adjunct-lava-rubble", "a4-small-lava-fount"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent", "a4-decal-molten-metal-streak"], dn: 3 },
      c: { feature: "set:a4_lm_sulfur_geyser", featureDrop: ["a4-soul-crystal"], pair: { name: "a4-chain-pillar", around: "feature" },   // 5차: 사슬 기둥 쌍 자리를 위해 세트의 혼 수정은 뺀다
          decals: ["a4-decal-scorched-ring"], dn: 2 },
      d: { feature: "prop:a4-landmark-great-smelter", row: { name: "a4-ruined-wall-low", step: 2.7 }, props: ["a4-forge-anvil", "a4-adjunct-burning-cart"], decals: ["a4-decal-molten-metal-streak", "a4-decal-cracked-obsidian"], dn: 2 },
      e: { feature: "set:a4_fallen_giant", props: ["a4-adjunct-demon-skull-spear", "a4-helm-pile"], decals: ["a4-decal-ash-pile"], dn: 2 },
      f: { feature: "prop:a4-landmark-ember-bat-dead-tree", row: { name: "a4-lava-wall-ruin" }, props: ["a4-bone-heap", "a4-adjunct-chained-skull"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      g: { feature: "prop:a4-landmark-fallen-knight-sword-grave", pair: { name: "a4-soul-lantern" }, sets: ["a4_ember_shrine"], decals: ["a4-decal-sulfur-steam-vent"], dn: 1 },
    },
  },
});
