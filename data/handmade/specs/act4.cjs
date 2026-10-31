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

// ───────── 10-31 맵 구성 v5 3단계 · 액트 4 적용 (사용자 「승인, 액트 4 시작」 · 표본 2장과 같은 생성기·규칙 · docs/review/v5-modes-20261031.md 액트 4 순서표) ─────────
//   v5 = 골격 띠 + 구역 재적합 + 역할 배치 (성소형) · keep = 바닥·길 글자·이음새 그대로 + 역할 배치만 (유황 늪형). 맵별 공간 구획 = docs/review/map-audit-20261031.md 그 맵 절.
//   보스·포털·웨이포인트·화로 같은 기능 자리는 옮기지 않는다 (maps.csv 기능 열은 compose가 설계서 자리 그대로 다시 쓴다).

// 1/18 군주의 옥좌 (v5 · 보스방): 성소 표본을 좌우로 뒤집은 자리. 홀 입구(동쪽 문, y 1)에서 서쪽으로 곧은 축(신랑) — 양옆 불기둥 열주 2열,
//   축 끝 북벽 가운데에 돌아온 심장 제단(특징 1 · 4칸) + 북벽에 붙인 옥좌 깃발 한 쌍, 고르바스는 그 앞(maps.csv fixed ashking -17.5/5.5 그대로 · 옮기지 않음).
//   전진 출구(남서 -27, -7)로 가는 띠는 축 끝(-18, 1)에서 꺾인다. 띠 북쪽 = 밝은 그을린 판석(e) · 남쪽 = 어두운 판석(f) · 남벽 혼 등불 열.
//   손으로 고른 자리(재의 왕좌 세트·옥좌 단·사슬 닻·오벨리스크 둘·낱개 불기둥 넷·큰 문장 원)와 아레나 안 바위 구멍 넷은 뺐다 — 특징 과밀·기둥 낱개.
//   근위대의 방 = 남벽 뿔 석상 열(근위대) + 부러진 오벨리스크 · 제물의 방 = 북벽 혼 우리 열 + 배교 제단 · 봉인된 문간 = 소품 묶음 하나.
//   자리: 성소와 같이 제물의 방 → 봉인된 문간 통로를 막아 제물의 방을 막다른 곁방으로 · 문간 → 홀 통로를 축 줄(y 1)로
Object.assign(module.exports.throne, {
  v5: {
    outdoor: false,
    via: [[-3, 1], [-18, 1]],
    dress: {
      a: { props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], decals: ["a4-decal-ash-pile"], dn: 2 },
      b: { feature: "prop:a4-broken-obelisk", row: { name: "a4-horned-statue", side: "s" }, props: ["a4-helm-pile", "a4-adjunct-demon-skull-spear", "a4-melted-armor-pile"], clusters: 1, decals: ["a4-decal-broken-chain", "a4-decal-ash-pile"], dn: 2 },
      c: { feature: "prop:a4-apostate-altar", row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster", "a4-bone-heap"], clusters: 1, decals: ["a4-decal-blood-sigil-circle"], dn: 1 },
      d: { props: ["a4-adjunct-obsidian-shards", "a4-adjunct-soul-candle-cluster"], decals: ["a4-decal-cracked-obsidian"], dn: 1 },
      e: {
        feature: "set:a4_lm_heart_altar", featureDrop: ["a4-soul-crystal"], featureAt: [-17.5, 8.4], featureScale: 4 / 3,   // 성소 제단처럼 4칸 (역할 3칸 × 4/3)
        colonnade: { name: "a4-ember-pillar", step: 3, minPairs: 4, off: 2.5, tight: true, axis: [[-1.5, 1.5], [-15.5, 1.5]] },
        sides: { left: "f", right: "e" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        row: [{ name: "a4-soul-lantern", side: "s" }],
        decals: ["a4-decal-ember-scatter", "a4-decal-molten-metal-streak", "a4-decal-cracked-obsidian"], dn: 3,
      },
    },
  },
  paths: [P([[30, 2], [17, 2]], 3), P([[17, 2], [17, -4]], 3), P([[15, 2], [15, 8]], 3), P([[11, -8], [5, -8], [5, -1]], 3), P([[2, 1], [-1, 1]], 4)],
  rocks: [],
  places: module.exports.throne.places.map((p) => Object.assign({}, p, { name: { a: "옥좌 계단", b: "근위대의 방", c: "제물의 방", d: "봉인된 문간", e: "재의 옥좌" }[p.z] || p.name, note: p.z === "e" ? "아레나 · 고르바스 · 불기둥 열주와 돌아온 심장 제단" : p.note })),   // 여왕의 무덤 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.throne.zones, {
    d: "a4-cooled-lava-floor 0.84/0.8/0.78 봉인된 문간",              // 바탕(흑요석)과 같은 그림이라 띠가 안 보였다
    e: "a4-scorched-flagstone-floor 1/0.94/0.9 재의 옥좌",             // 띠(흑요석) 북쪽 — 따뜻한 판석
    f: "a4-scorched-flagstone-floor 0.78/0.7/0.66 재의 옥좌 남쪽",     // 띠 남쪽 (북쪽 e와 다른 톤)
  }),
  put: [["prop", "a4-throne-banner-ruin", -14, 8.5, 1, 0, "wall=1;padl=1"], ["prop", "a4-throne-banner-ruin", -21, 8.5, 1, 1, "wall=1;padr=1"]],   // 옥좌 깃발 한 쌍 — 정면 그림이라 북벽에 붙여 뒤 칸을 벽까지 막는다 (특징 양옆 쌍은 벽에서 떠 뒤 칸이 남았다) · 제단과의 1칸 틈은 padl·padr로 막음
});

// 2/18 심연의 문 1층 (v5): 동쪽 계단참(W 28, 1) → 혼등 회랑 → 웨이포인트(6, 1) → 서쪽 출구(E −29, 1)가 y 1 한 줄 — 그 축이 띠(신랑).
//   혼등 회랑 = 북·남벽 혼 등불 열 + 웨이포인트 뒤 북벽 숨 쉬는 문양 기둥(랜드마크 · 문장의 홀에서 옮김 · 검수표 「혼등 회랑 중심에」).
//   회랑 안 1×1 바위 기둥 열 개(설계도 바위 · 낱개 기둥 취급)는 뺐다 (성소와 같음). 띠 북쪽 = 밝은 판석 · 남쪽 = 어두운 판석.
//   계단참 = 소품 묶음(좁아 장식 계단 자리 없음) · 뼈 쌓인 방 = 북벽 창살 열 + 뼈 묶음 · 문장의 홀(구덩이 문) = 북벽 문장 비석 열 · 아래 계단 = 북벽(입구 동쪽)에 붙인 내려가는 계단 · 제물 방 = 혼 우리 열.
//   손으로 고른 자리(심연 벽·발광 층 · 길 위 사건 둥지 세트)는 그대로.
Object.assign(module.exports.abyssgate1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a4-brazier", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: {
        feature: "set:a4_lm_rune_pillar", featureAt: [6.5, 4.4],
        row: [{ name: "a4-soul-lantern", side: "n" }, { name: "a4-soul-lantern", side: "s" }],   // 「혼등 회랑」 — 북·남벽에 붙인 혼 등불 열 (회랑 폭 9칸이라 축 양옆 열주는 벽 2칸 안 → 뒤 칸이 남았다)
        sides: { left: "h", right: "b" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        decals: ["a4-decal-scorched-ring", "a4-decal-soul-mist-puddle"], dn: 2,
      },
      c: { row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-soul-candle-cluster", "a4-adjunct-chained-skull"], decals: ["a4-decal-soul-mist-puddle"], dn: 1 },
      d: { row: { name: "a4-sigil-stone", side: "n" }, props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], clusters: 1, decals: ["a4-decal-blood-sigil-circle", "a4-decal-broken-chain"], dn: 2 },
      e: { row: { name: "a4-prison-bars-h", contiguous: true, min: 2, minLine: 4 }, props: ["a4-bone-heap", "a4-helm-pile", "a4-adjunct-chained-skull"], decals: ["a4-decal-ash-pile"], dn: 2 },
      f: { props: ["a4-small-lava-fount", "a4-adjunct-lava-rubble", "a4-melted-armor-pile"], decals: ["a4-decal-molten-metal-streak", "a4-decal-cracked-obsidian"], dn: 2 },
      g: { feature: "prop:a4-stair-down", featureAt: [-16, -5.4], props: ["a4-adjunct-soul-candle-cluster", "a4-broken-ladder"], decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
  rocks: [],
  // 곁방 고리 끊기 (검수표 「고리 4+2」 · 가지 간 추가 연결): 뼈 쌓인 방 → 갈라진 방 통로와 제물 방 → 문장의 홀 통로를 막아 두 곁방을 막다른 방으로
  paths: module.exports.abyssgate1.paths.filter((p) => !(p.pts[0][0] === 9 && p.pts[0][1] === -10) && !(p.pts[0][0] === 0 && p.pts[0][1] === 14)),
  put: module.exports.abyssgate1.put.map((p) => (p[1] === "a4-abyss-wall" ? p.slice(0, 6).concat(["ok=cliff;padl=1"]) : p)),   // 심연 벽과 서쪽 벽 사이 1칸 벽감을 막는다
  places: module.exports.abyssgate1.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "혼등 회랑", c: "제물 방", d: "문장의 홀", e: "뼈 쌓인 방", f: "갈라진 방", g: "아래 계단" }[p.z] || p.name, note: p.z === "b" ? "웨이포인트 · 벽 따라 혼 등불 열과 숨 쉬는 문양 기둥" : p.note })),   // 납골당 2층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.abyssgate1.zones, {
    b: "a4-scorched-flagstone-floor 0.98/0.92/0.88 혼등 회랑",          // 띠(흑요석) 북쪽 — 밝은 판석
    h: "a4-scorched-flagstone-floor 0.78/0.72/0.7 혼등 회랑 남쪽",      // 띠 남쪽
    d: "a4-ash-drift-floor 0.86/0.84/0.9 문장의 홀",                    // 바탕(흑요석)과 같은 그림이라 구역이 안 보였다
  }),
});

// 3/18 악마의 행군로 (keep · `?` 맵): 성벽 윗면 바닥·행군로(=) 글자·이음새는 그대로 · 길 안내 0 · 역할 배치만 (검수표 구획: 어귀 보루 → 해골 관문 보루 → 전쟁 야영지 보루(웨이포인트) → 공성 장비 마당 보루 → 동쪽 행군로).
//   특징 공간당 1: 해골 관문 보루 = 뿔 해골 문(북벽에 붙임 · 세트의 깃발·화로는 뺌) · 전쟁 야영지 = 군막(손으로 고른 자리) + 공성 병기(행군로 남쪽) + 화로·창·임프 묶음 —
//   12×9 보루를 행군로가 가로질러 군기 랜드마크는 골격이 좁아지거나 정면 방향이 어긋났다 — 검수표 「군기를 야영지에」는 따르지 않음) · 공성 장비 마당 = 타락마족 군기(랜드마크 그대로) ·
//   (군막 줄은 두 보루 모두 벽면 6칸이 남지 않아 못 놓음) · 혼 감옥 망루 = 북벽 혼 우리 열 · 무너진 초소 = 폐벽 초소 세트 · 동쪽 행군로 = 출구 양옆 뿔 석상 쌍.
//   화로·투구·임프 산발 복제(8·6·3)는 묶음 ≤3·같은 그림 맵당 ≤2로. 빈 바닥(성벽 위 . 칸) 31%는 keep이라 그대로 — v5 비교본은 아래 DEMONROAD_V5 (V5_ALT=demonroad로 짓는다)
const DEMONROAD_KEEP = {
  mode: "keep",
  outdoor: true,
  dress: {
    a: { sets: ["a4_siege_wreck"], decals: ["a4-decal-ash-footprints", "a4-decal-scorched-ring"], dn: 2 },
    b: { feature: "set:a4_skull_gate", featureAt: [-16.5, 6.4], featureDrop: ["a4-brazier", "a4-demon-banner"], props: ["a4-adjunct-ember-brazier", "a4-helm-pile"], clusters: 1, decals: ["a4-decal-ash-footprints"], dn: 1 },
    c: { feature: "prop:a4-siege-engine", featureAt: [6.5, -7.4], props: ["a4-brazier", "a4-adjunct-demon-skull-spear", "a4-imp-on-barrel"], clusters: 1, decals: ["a4-decal-ash-footprints", "a4-decal-ash-pile"], dn: 2 },
    d: { row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-soul-candle-cluster", "a4-adjunct-chained-skull"], decals: ["a4-decal-broken-chain", "a4-decal-soul-mist-puddle"], dn: 2 },
    e: { sets: ["a4_ruined_post"], props: ["a4-adjunct-broken-siege-spike"], decals: ["a4-decal-ash-pile"], dn: 1 },
    f: { feature: "set:a4_lm_war_banner", props: ["a4-broken-ladder", "a4-adjunct-burning-cart", "a4-adjunct-broken-siege-spike"], clusters: 1, decals: ["a4-decal-ash-footprints"], dn: 2 },
    g: { pair: { name: "a4-horned-statue" }, decals: ["a4-decal-ash-footprints"], dn: 1 },
  },
};
// 웨이포인트 (3, -1) → (3, -3): keep 골격(행군로를 따라 야영지 보루 한가운데 y −4를 지난다)에서 3칸 떨어져 P5 「웨이포인트는 골격 위」 위반 —
//   2칸 남쪽, 골격 바로 곁으로 (유황 늪 표본과 같은 처리 · waypoints.csv·WaypointData.mlua 함께 갱신)
// v5 비교본 (성소형 — 골격 띠·구역 재적합·띠 곁 패치·섬): 같은 꾸밈. 기본은 keep — `V5_ALT=demonroad node tools/build/handmade/compose.cjs act4 demonroad`로만 짓는다
//   (비교 미리보기·설계도: docs/evidence/2026-10-31-map-v5-act4/variants/demonroad-v5.*)
const DEMONROAD_V5 = Object.assign({}, DEMONROAD_KEEP, { mode: undefined });
module.exports.demonroad.put = [...module.exports.demonroad.put, ["prop", "a4-army-tent", 1.5, -5.8, 1, 0]];   // 야영지 군막 하나 — 행군로 남쪽 · 남벽에서 3칸 (정면 그림이 벽 2칸 안에 붙지 않게) · 생성기 특징 자리 찾기는 정면 방향 때문에 남쪽 반을 못 썼다
Object.assign(module.exports.demonroad, { v5: (process.env.V5_ALT || "").split(",").includes("demonroad") ? DEMONROAD_V5 : DEMONROAD_KEEP, waypoint: [3, -3] });

// 4/18 불타는 성채 외곽 (keep): 재 더미 바탕·성채 길(=)·그을린 성벽 두 줄·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 성채 바깥길 → 무너진 성벽 틈 → 성채 앞마당(웨이포인트) → 해골 관문, 곁 = 수도원 어귀(구덩이 문)·거인 갑옷 터).
//   특징 공간당 1: 무너진 성벽 틈 = 용암 성벽 탑(랜드마크 그대로 — 이름이 「무너진 성벽」이라 그 자리가 맞다 · 검수표 「앞마당 중심에」는 따르지 않음) ·
//   성채 앞마당 = 공성 병기 + 임프·화로·사다리 묶음(야영지 세트는 군막 정면 방향·골격 비움으로 자리가 없었다 · v4 자리에 손으로 두면 군막 뒤 칸·벽감이 남았다) · 거인 갑옷 터 = 쓰러진 거인 + 폐벽 줄 · 해골 관문 = 북벽 뿔 해골 문 + 출구 양옆 뿔 석상 쌍 ·
//   수도원 어귀 = 폐벽 줄 + 불씨 제단 세트. 화로·투구·뼈 산발(6·5·3)은 묶음 ≤3·같은 그림 맵당 ≤2로. 길 위 사건 의식 세트는 그대로.
Object.assign(module.exports.burningkeep, {
  // 웨이포인트 (3, -3) → (3, -1): keep 골격(성채 길을 따라 앞마당 y 0을 지난다)에서 3칸 → 골격 곁 (waypoints.csv·WaypointData 갱신)
  waypoint: [3, -1],
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a4_siege_wreck"], decals: ["a4-decal-ember-scatter", "a4-decal-ash-pile"], dn: 2 },
      b: { feature: "set:a4_lm_lava_tower", props: ["a4-broken-ladder", "a4-lava-wall-ruin"], clusters: 1, decals: ["a4-decal-scorched-ring"], dn: 2 },
      c: { feature: "prop:a4-siege-engine", props: ["a4-imp-on-barrel", "a4-brazier", "a4-broken-ladder"], clusters: 1, decals: ["a4-decal-ash-footprints", "a4-decal-ash-pile"], dn: 2 },
      d: { row: { name: "a4-ruined-wall-low" }, sets: ["a4_ember_shrine"], decals: ["a4-decal-blood-sigil-circle", "a4-decal-scorched-ring"], dn: 2 },
      e: { feature: "set:a4_fallen_giant", row: { name: "a4-ruined-wall-low" }, props: ["a4-melted-armor-pile", "a4-adjunct-demon-skull-spear"], clusters: 1, decals: ["a4-decal-molten-metal-streak"], dn: 2 },
      f: { feature: "set:a4_skull_gate", featureAt: [21.5, 12.5], featureDrop: ["a4-demon-banner", "a4-brazier"], pair: { name: "a4-horned-statue" }, decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
});

// 5/18 심연의 문 2층 (v5): 동쪽 계단참(W 28, 0) → 동쪽 통로 → 문장의 홀 → 뼈 쌓인 방 → 아래 계단(E −29, 0). 띠 = 그 골격 한 줄.
//   고리 끊기(검수표 「고리 5+3」): 혼등 회랑 ↔ 홀 북쪽 통로 · 제물 방 ↔ 홀 남쪽 통로 · 갈라진 방 ↔ 아래 계단 통로를 막아 세 곁방을 막다른 방으로 (가지 간 추가 연결 0).
//   (갈라진 방 쪽을 막은 까닭: 홀 → 갈라진 방 통로 입구에 길 위 사건 상자(기능 자리 · 옮기지 않음)가 있어 골격으로 쓰면 통로가 1칸으로 좁아졌다)
//   홀 안 1×1 바위 기둥 넷·혼등 회랑 바위는 뺐다. 문장의 홀 = 북벽 문장 비석 열 + 띠 남쪽 재에 묻힌 석상(랜드마크 그대로) · 띠 북쪽 밝은 판석 / 남쪽 어두운 판석.
//   계단참 = 북벽 장식 계단 · 혼등 회랑 = 북벽 혼 등불 열 · 제물 방 = 북벽 혼 우리 열 · 뼈 쌓인 방(골격) = 뼈·투구 묶음 둘 · 갈라진 방(막다른 곁방) = 용암 흘러내린 바위 + 용암 샘 묶음 ·
//   아래 계단 = 바닥 무늬만(5칸 폭 방을 띠가 지나 계단 자리가 없다). 손으로 고른 자리(심연 벽·발광 층 · 길 위 사건 상자 세트)는 그대로.
Object.assign(module.exports.abyssgate2, {
  v5: {
    outdoor: false,
    dress: {
      a: { feature: "prop:a4-abyss-stairs", featureAt: [24.5, 1.4], props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { row: { name: "a4-soul-lantern", side: "n" }, props: ["a4-adjunct-soul-candle-cluster", "a4-soul-crystal"], decals: ["a4-decal-soul-mist-puddle"], dn: 2 },
      c: { row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster", "a4-bone-heap"], clusters: 1, decals: ["a4-decal-broken-chain"], dn: 1 },
      d: {
        feature: "set:a4_lm_ash_statue", featureAt: [-3.5, -4.6],   // 띠 남쪽 반 가운데 — 띠를 사이에 두고 북벽 비석 열과 마주 본다
        sides: { left: "h", right: "d" },   // 서쪽으로 가는 띠의 왼쪽 = 남쪽
        row: [{ name: "a4-sigil-stone", side: "n" }],
        decals: ["a4-decal-blood-sigil-circle", "a4-decal-cracked-obsidian"], dn: 2,
      },
      e: { props: ["a4-bone-heap", "a4-helm-pile", "a4-melted-armor-pile"], decals: ["a4-decal-ash-pile", "a4-decal-ember-scatter"], dn: 2 },
      f: { feature: "prop:a4-lava-fall-rock", props: ["a4-small-lava-fount", "a4-adjunct-lava-rubble", "a4-adjunct-obsidian-shards"], clusters: 1, decals: ["a4-decal-molten-metal-streak", "a4-decal-cracked-obsidian"], dn: 2 },
      g: { decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
  rocks: [],
  paths: module.exports.abyssgate2.paths.filter((p) => !["7,9", "8,-10", "-23,-11"].includes(p.pts[0].join(","))),
  places: module.exports.abyssgate2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "혼등 회랑", c: "제물 방", d: "문장의 홀", e: "뼈 쌓인 방", f: "갈라진 방", g: "아래 계단" }[p.z] || p.name, note: p.z === "d" ? "북벽 문장 비석 열과 재에 묻힌 석상" : p.note })),   // 납골당 1층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.abyssgate2.zones, {
    d: "a4-scorched-flagstone-floor 0.96/0.9/0.86 문장의 홀",        // 바탕(흑요석)과 같은 그림이라 띠가 안 보였다 — 띠 북쪽
    h: "a4-scorched-flagstone-floor 0.76/0.7/0.68 문장의 홀 남쪽",   // 띠 남쪽
  }),
});

// 6/18 용암 대장간 1층 (v5): 서쪽 입구(W −29, 0) → 풀무실 → 동쪽 아래 계단(E 28, 0)이 y 0 한 줄 — 그 축이 띠 (벽돌 격자 바탕 = 띠).
//   고리 끊기(검수표 「고리 5+2」): 주조실 ↔ 풀무실 북쪽 통로 · 석탄 창고 ↔ 풀무실 남쪽 통로를 막아 네 곁방(주조실·석탄 창고·담금질 방·연마실)이 모두 막다른 방.
//   주조실 = 용암 도랑·세로 쇳물 홈(손으로 고른 자리 그대로) + 모루·녹은 갑옷 묶음 · 풀무실 = 두 용암 도랑 사이 띠 + 문 양옆 사슬 기둥 + 모루·용암 샘 묶음 ·
//   담금질 방 = 거대 용광로(랜드마크 그대로 — 주조실 북쪽 반은 쇳물 홈 둘 사이가 좁아 벽감이 생겼다) + 북벽 용암 폐벽 줄 · 연마실 = 북벽 악마 깃발 열 + 모루·투구·창 묶음 ·
//   석탄 창고 = 부서진 공성 수레 세트 + 임프·사다리. 바닥: 주조실 식은 용암 · 풀무실 뼈 재(바탕 벽돌 격자와 같은 그림이라 띠가 안 보였다).
Object.assign(module.exports.forge1, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a4-brazier", "a4-adjunct-lava-rubble"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { props: ["a4-forge-anvil", "a4-melted-armor-pile", "a4-adjunct-burning-cart"], decals: ["a4-decal-molten-metal-streak", "a4-decal-scorched-ring"], dn: 2 },
      c: { sets: ["a4_siege_wreck"], props: ["a4-imp-on-barrel", "a4-broken-ladder"], decals: ["a4-decal-ash-pile"], dn: 2 },
      d: { pair: { name: "a4-chain-pillar" }, props: ["a4-forge-anvil", "a4-small-lava-fount", "a4-adjunct-ember-brazier"], clusters: 1, decals: ["a4-decal-molten-metal-streak"], dn: 1 },
      e: { feature: "set:a4_lm_great_smelter", row: { name: "a4-lava-wall-ruin" }, props: ["a4-small-lava-fount", "a4-melted-armor-pile", "a4-adjunct-lava-rubble"], clusters: 1, decals: ["a4-decal-cracked-obsidian", "a4-decal-ember-scatter"], dn: 2 },
      f: { row: { name: "a4-demon-banner" }, props: ["a4-forge-anvil", "a4-helm-pile", "a4-adjunct-demon-skull-spear"], decals: ["a4-decal-broken-chain"], dn: 1 },
      g: { decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
  paths: module.exports.forge1.paths.filter((p) => !["-6,10", "-8,-10"].includes(p.pts[0].join(","))),
  // 세로 쇳물 홈(손으로 고른 자리): v5 역할 배율(기준 1칸 → ×0.5 하한)이 홈을 반 길이로 줄여 북쪽 벽에 닿지 않았다 → 배율 2로 원래 길이(도랑 윗변 y 10 ~ 북쪽 벽 y 15) 유지
  //   (역할표 facing을 side → any로 고침: 바닥에 깔린 세로 수로라 옆벽 그림이 아니다 — 검사기 「정면 방향」이 아래 도랑 벽을 보고 어긋남으로 셌다)
  put: module.exports.forge1.put.map((p) => (p[1] === "a4-molten-channel-v" ? [p[0], p[1], p[2], p[3], 2] : p)),
  zones: Object.assign({}, module.exports.forge1.zones, {
    b: "a4-cooled-lava-floor 0.82/0.74/0.7 주조실",   // 바탕(벽돌 격자)과 같은 그림이라 구역이 안 보였다 — 식은 쇳물 바닥
    d: "a4-bone-ash-floor 0.88/0.84/0.8 풀무실",
  }),
});

// 7/18 재의 회랑 (v5): 동쪽 내려온 계단(W 28, 0) → 재의 통로 → 혼등 우물방 → 서쪽 아래 계단참(E −29, 0)이 y 0 한 줄 — 그 축이 띠.
//   고리 줄이기(검수표 「고리 3+2」): 갑옷 창고 → 우물방 남쪽 긴 통로를 막아 갑옷 창고를 막다른 방으로. 투구 창고 → 우물방 북쪽 긴 통로는 이야기의 「고리길」이라 남김
//   (가지 2 · 추가 연결 1 = 50% 이하 · 둘 다 막으면 걷는 칸이 779 → 566으로 사냥터가 너무 줄었다).
//   투구 창고 = 재의 강줄기(랜드마크 그대로) + 북벽 창살 열 + 투구·녹은 갑옷 묶음 · 갑옷 창고 = 북벽 창살 열 + 갑옷·창 묶음 ·
//   재의 통로(매복 길목) = 재 무늬만 · 혼등 우물방 = 문 양옆 혼 등불 쌍 + 혼 촛불 묶음(혼 수정·길 위 사건 신전 세트는 손으로 고른 자리 그대로).
Object.assign(module.exports.ashhall, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a4-brazier", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { feature: "set:a4_lm_ash_river", row: { name: "a4-prison-bars-h", contiguous: true, min: 2, minLine: 4 }, props: ["a4-helm-pile", "a4-melted-armor-pile"], clusters: 1, decals: ["a4-decal-ash-pile"], dn: 2 },
      c: { row: { name: "a4-prison-bars-h", contiguous: true, min: 2, minLine: 4 }, props: ["a4-melted-armor-pile", "a4-adjunct-demon-skull-spear", "a4-adjunct-ash-urn"], decals: ["a4-decal-ash-pile", "a4-decal-broken-chain"], dn: 2 },
      d: { decals: ["a4-decal-ash-pile", "a4-decal-ash-footprints", "a4-decal-scorched-ring"], dn: 3 },
      e: { pair: { name: "a4-soul-lantern" }, props: ["a4-adjunct-soul-candle-cluster", "a4-adjunct-chained-skull"], clusters: 1, decals: ["a4-decal-soul-mist-puddle"], dn: 2 },
      f: { decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
  paths: module.exports.ashhall.paths.filter((p) => !["8,-10"].includes(p.pts[0].join(","))),
  places: module.exports.ashhall.places.map((p) => Object.assign({}, p, { name: { a: "내려온 계단", b: "투구 창고", c: "갑옷 창고", d: "재의 통로", e: "혼등 우물방", f: "아래 계단참" }[p.z] || p.name, note: p.z === "b" ? "재의 강줄기" : p.z === "e" ? "혼 수정 우물" : p.note })),   // 지하실 1층 자리 이름을 그대로 물려받았었다
  // 길 위 사건 신전 세트(문장 비석 하나 + 혼 등불 둘)는 바닥 무늬만 남김 — 통로 북서 모서리라 비석·등불이 낱개 기둥·2칸 벽감·등불 산발(우물방 문 등불 쌍과 4개)로 걸렸다 (신전 자리 −10.5, 2.5와 extra는 그대로 · 신전은 런타임에 놓인다)
  put: [["prop", "a4-soul-crystal", -17.5, 2.4, 1, 0], ["decal", "a4-decal-cracked-obsidian", -10.5, 1.5, 0.9, 0]],
  zones: Object.assign({}, module.exports.ashhall.zones, {
    e: "a4-soul-stone-floor 0.86/0.82/0.88 혼등 우물방",   // 바탕(흑요석)과 같은 그림이라 띠가 안 보였다
  }),
});

// 8/18 불탄 협곡 (keep): 현무암 바탕·용암 섬·그을린 길(=)·샛길(-)·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 협곡 어귀 → 혼의 제단(웨이포인트) → 재 무더기 골 → 동쪽 오르막, 곁 = 용암 둔덕·무너진 초소·유황 동굴 어귀(구덩이 문)).
//   특징 공간당 1: 용암 둔덕 = 불박쥐 고목(랜드마크 그대로 · 용암 둔덕 세트는 같은 공간 특징 둘이라 뺌) · 혼의 제단 = 혼의 제단 세트(비석 쌍 사이 수정 · 등불 둘은 남쪽 벽감을 만들어 뺌 · 그을린 길 남쪽) ·
//   재 무더기 골 = 북벽 군막 열 + 뼈·투구 묶음 · 무너진 초소 = 폐벽 초소 세트 · 유황 동굴 어귀 = 유황 웅덩이 + 석순 묶음 · 동쪽 오르막 = 불씨 제단 세트.
//   투구·화로·뼈·흑요석 조각 산발(5·5·4·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.embercanyon, {
  // 웨이포인트 (-1, 3) → (1, 1): keep 골격(그을린 길 y 0)에서 4칸 → 골격 곁 (waypoints.csv·WaypointData 갱신)
  waypoint: [1, 1],
  // 길 위 사건 신전 세트(비석 하나 + 등불 둘)는 바닥 무늬만 — 비석이 낱개 기둥으로 걸렸다 (신전 자리·extra 그대로 · 재의 회랑과 같은 처리)
  put: module.exports.embercanyon.put.map((p) => (p[1] === "a4_road_shrine" ? ["decal", "a4-decal-cracked-obsidian", p[2], p[3] - 1, 0.9, 0] : p))
    .concat([["prop", "a4-soul-crystal", -0.5, -2.8, 2, 0]]),   // 혼의 제단 가운데 수정 — 역할 기준 1칸(소품)이 비석(3칸) 사이에서 너무 작아 배율 2로 따로 (세트 수정은 뺌)
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a4_lava_cairn"], decals: ["a4-decal-ember-scatter", "a4-decal-scorched-ring"], dn: 2 },
      b: { feature: "set:a4_lm_ember_tree", props: ["a4-sulfur-stalagmite", "a4-small-lava-fount"], clusters: 1, decals: ["a4-decal-molten-metal-streak", "a4-decal-ember-scatter"], dn: 2 },
      c: { feature: "set:a4_soul_altar", featureAt: [-0.5, -3.2], featureDrop: ["a4-soul-lantern", "a4-soul-crystal"], decals: ["a4-decal-scorched-ring", "a4-decal-cracked-obsidian"], dn: 2 },
      d: { sets: ["a4_ruined_post"], props: ["a4-adjunct-broken-siege-spike", "a4-broken-ladder"], decals: ["a4-decal-ash-pile"], dn: 1 },
      e: { props: ["a4-sulfur-stalagmite", "a4-adjunct-lava-rubble", "a4-adjunct-chained-skull"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      f: { row: { name: "a4-army-tent", side: "n" }, props: ["a4-bone-heap", "a4-helm-pile", "a4-adjunct-demon-skull-spear"], decals: ["a4-decal-ash-pile", "a4-decal-ash-footprints"], dn: 2 },
      g: { sets: ["a4_ember_shrine"], decals: ["a4-decal-ember-scatter"], dn: 1 },
    },
  },
});

// 9/18 혼 감옥 (v5): 서쪽 감옥 문(W −29, 0) → 감방 복도(y 0 한 줄) → 간수장의 방 → 되돌아가는 문(24, −9). 띠 = 복도 축 + 간수장의 방 안에서 동쪽 x 18까지 곧게 간 뒤 남쪽 문으로.
//   검수표 「구획 고리 6」: 감방 여섯이 한 구역 글자(c)라 복도와 여섯 군데로 닿아 고리로 셌다 → 감방마다 글자를 따로(c·h·i 북 / j·k·l 남 · 같은 바닥) — 각자 문 하나인 막다른 방.
//   고문실은 북쪽 감방 3을 거쳐 들어가던 통로를 막고 간수장의 방 북서 통로로만 (고문실 ↔ 간수장의 방 고리 끊기).
//   간수장의 방 = 혼 우리 탑(랜드마크 · 같은 자리를 v5 특징으로 · 북벽에 붙임) + 안쪽 축 양옆 사슬 기둥 열주(검수표 「출구로 모이는 사슬 기둥 열」) · 방 안 1×1 바위 넷은 뺐다.
//   감방 = 소품 묶음 하나씩 + 북쪽 감방 3 북벽 창살 열 · 고문실 = 북벽 혼 우리 열 + 사슬 제단 조각.
const PRISON_CELLS = { "북쪽 감방 1": "c", "북쪽 감방 2": "h", "북쪽 감방 3": "i", "남쪽 감방 1": "j", "남쪽 감방 2": "k", "남쪽 감방 3": "l" };
const CELL_BARS = { name: "a4-prison-bars-h", contiguous: true, min: 2, minLine: 4 };   // 북쪽 감방 3(간수장의 방 쪽) 안쪽 북벽 창살 열 하나 — 감방마다 두 개씩이면 같은 그림이 8칸 간격으로 흩어져 산발 복제로 셌다
const cellDress = (props) => ({ props, clusters: 1, decals: ["a4-decal-ash-pile"], dn: 1 });
Object.assign(module.exports.soulprison, {
  v5: {
    outdoor: false,
    via: [[18, 0]],
    dress: {
      a: { props: ["a4-brazier", "a4-adjunct-chained-skull"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { decals: ["a4-decal-broken-chain", "a4-decal-soul-mist-puddle", "a4-decal-scorched-ring"], dn: 3 },
      c: cellDress(["a4-adjunct-chained-skull", "a4-bone-heap"]),
      h: cellDress(["a4-adjunct-soul-candle-cluster", "a4-helm-pile"]),
      i: Object.assign(cellDress(["a4-adjunct-chained-skull", "a4-melted-armor-pile"]), { row: CELL_BARS }),
      j: cellDress(["a4-bone-heap", "a4-adjunct-ash-urn"]),
      k: cellDress(["a4-adjunct-soul-candle-cluster", "a4-adjunct-chained-skull"]),
      l: cellDress(["a4-helm-pile", "a4-adjunct-ash-urn"]),
      d: { row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster", "a4-melted-armor-pile"], clusters: 1, decals: ["a4-decal-blood-sigil-circle", "a4-decal-broken-chain"], dn: 2 },
      e: {
        feature: "set:a4_lm_soul_cage", featureAt: [19.5, 10.3], featureDrop: ["a4-chain-pillar", "a4-soul-lantern"],   // 손으로 고른 자리였던 랜드마크를 v5 특징으로 (같은 자리 · 세트 속 낱개 사슬 기둥·등불은 뺌 → 북벽에 붙인다)
        colonnade: { name: "a4-chain-pillar", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[9.5, 0.5], [17.5, 0.5]] },
        props: ["a4-adjunct-ember-brazier", "a4-adjunct-obsidian-shards"], clusters: 1,
        decals: ["a4-decal-soul-mist-puddle", "a4-decal-cracked-obsidian", "a4-decal-broken-chain"], dn: 3,
      },
    },
  },
  rocks: [],
  paths: module.exports.soulprison.paths.filter((p) => p.pts[0].join(",") !== "-0.5,9"),
  places: module.exports.soulprison.places.map((p) => Object.assign({}, p, PRISON_CELLS[p.name] ? { z: PRISON_CELLS[p.name] } : {})),
  // 손으로 고른 창살 8개(코덱스 감사 c-2 · 복도↔감방 벽 줄 가로 4 · 감방 사이 세로 4)는 뺐다 — 8칸 간격 낱개라 산발 복제 8 · 남쪽 줄 정면 방향 어긋남 2
  //   → 가로 창살은 북쪽 감방 3 북벽 열로 다시 쓴다 (세로 창살 a4-prison-bars-v는 이 맵에서 안 쓰게 됨)
  put: [],
  zones: Object.assign({}, module.exports.soulprison.zones, {
    b: "a4-bone-ash-floor 0.82/0.78/0.8 감방 복도",          // 바탕(혼석)과 같은 그림이라 띠가 안 보였다
    c: "a4-soul-stone-floor 0.7/0.66/0.72 감방", h: "a4-soul-stone-floor 0.7/0.66/0.72 감방", i: "a4-soul-stone-floor 0.7/0.66/0.72 감방",
    j: "a4-soul-stone-floor 0.7/0.66/0.72 감방", k: "a4-soul-stone-floor 0.7/0.66/0.72 감방", l: "a4-soul-stone-floor 0.7/0.66/0.72 감방",
    e: "a4-obsidian-floor 0.95/0.9/0.92 간수장의 방",
  }),
});

// 10/18 마지막 초소 (keep · 마을): 목책·바닥·초소 큰길·원래 이음새·NPC·포털·화로·게시판 자리 모두 그대로 · 역할 배치(산발 정리)만.
//   손으로 고른 자리(신호 화로 망루 랜드마크·군막 둘·망루 쌍·모루·문틀·붉은 하늘 띠)는 그대로. 꾸밈만 묶음 ≤3·같은 그림 맵당 ≤2로
//   (악마 해골 창 5·불타는 수레 3·공성 가시 3 산발 → 묶음) · 막사 줄 = 투구·임프 묶음 · 정찰대 마당 = 공성 수레 세트 · 대장간 = 불씨 제단 세트 · 남문 길 = 이정표.
// 손으로 고른 자리 손질: 군막 둘은 북쪽 목책에 붙여(정면 그림 · 뒤 칸 2줄이 남았다) 뒤 칸을 벽까지 막음 · 남문 문틀은 v5 역할 배율(기준 3칸 → ×1.29)을
//   되돌려(배율 1/1.293) 목책 틈에 맞춘 크기 그대로 · 문틀 역할표 facing north → any (마을 안쪽에서 보는 남쪽 목책 문 · 포털 그림과 같은 벽 등지기)
const OUTPOST_PUT = module.exports.outpost.put.map((p) => (p[1] === "a4-army-tent" ? [p[0], p[1], p[2], 8, p[4] || 1, p[5] || 0, "wall=1"]
  : p[1] === "a4-outpost-gate" ? [p[0], p[1], p[2], p[3], Math.round(1000 / 1.293) / 1000, p[5], p[6]] : p));
Object.assign(module.exports.outpost, {
  put: OUTPOST_PUT,
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { decals: ["a4-decal-ash-pile"], dn: 2 },
      b: { props: ["a4-helm-pile", "a4-imp-on-barrel", "a4-adjunct-demon-skull-spear"], clusters: 1, decals: ["a4-decal-ash-footprints"], dn: 2 },
      c: { sets: ["a4_siege_wreck"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      d: { sets: ["a4_ember_shrine"], props: ["a4-melted-armor-pile"], decals: ["a4-decal-scorched-ring"], dn: 1 },
      e: { props: ["mp-signpost", "a4-broken-ladder"], decals: ["a4-decal-ash-pile"], dn: 2 },
    },
  },
});

// 11/18 타락의 구덩이 (keep): 뼈 재 굴 바닥·둥근 굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 구덩이 어귀 → 갉힌 길목 → 뼈 둥지 → 기사의 굴(되돌아가는 문 · 끝방), 곁 = 투구 무더기 굴·갈라진 굴).
//   기사의 굴 = 부러진 검 무덤(랜드마크 · 손으로 고른 자리 그대로 — 끝방 자리 앞) + 문 양옆 사슬 기둥 쌍 · 뼈 둥지 = 마른 나무 하나(골격이 지나는 북서쪽을 피해 남쪽) + 뼈·사슬 해골 묶음
//   (쓰러진 거인 세트는 유황 늪·불타는 성채 외곽과 겹쳐 뺐다 — 맵마다 장소성) · 투구 무더기 굴 = 투구·녹은 갑옷·창 묶음 둘 · 갈라진 굴 = 용암 샘·돌무더기 · 갉힌 길목 = 용암 돌무더기 세트.
//   투구·녹은 갑옷·뼈 산발(4·3·3)은 묶음 ≤3·같은 그림 맵당 ≤2로.
Object.assign(module.exports.pit, {
  places: module.exports.pit.places.map((p) => Object.assign({}, p, { name: { a: "구덩이 어귀", b: "갉힌 길목", c: "투구 무더기 굴", d: "뼈 둥지", e: "갈라진 굴", f: "기사의 굴" }[p.z] || p.name })),   // 짝 맵 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  put: module.exports.pit.put.map((p) => (p[1] === "a4-landmark-fallen-knight-sword-grave" ? p.slice(0, 6).concat(["padl=2"]) : p)),   // 검 무덤과 서쪽 벽 사이 벽감(1~2칸)을 막는다
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a4-bone-heap", "a4-adjunct-chained-skull"], decals: ["a4-decal-ash-pile"], dn: 1 },
      b: { sets: ["a4_lava_cairn"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      c: { props: ["a4-helm-pile", "a4-melted-armor-pile", "a4-adjunct-demon-skull-spear"], decals: ["a4-decal-ash-pile"], dn: 2 },
      d: { feature: "prop:a4-dead-tree", featureAt: [-6.5, -2.6], props: ["a4-bone-heap", "a4-adjunct-chained-skull", "a4-helm-pile"], decals: ["a4-decal-scorched-ring", "a4-decal-ash-pile"], dn: 3 },
      e: { props: ["a4-small-lava-fount", "a4-adjunct-lava-rubble", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-molten-metal-streak"], dn: 2 },
      f: { pair: { name: "a4-chain-pillar" }, decals: ["a4-decal-broken-chain"], dn: 1 },
    },
  },
});

// 12/18 심연의 문 3층 (v5 · 대주교 보스 맵): 동쪽 계단참(W 28, 0) → 문장의 홀 → 대주교의 의식 홀 → 서쪽 아래 계단(E −29, 0)이 y 0 한 줄 — 그 축이 띠.
//   의식 홀 = 북벽 가운데 핏빛 설교대(랜드마크 · 같은 자리를 v5 특징으로 · 양옆 혼 등불 쌍) — 대주교는 그 앞(maps.csv fixed archbishop −14.5/3.5 그대로 · 옮기지 않음) ·
//   남벽 문장 비석 열 · 띠 북쪽 밝은 판석 / 남쪽 어두운 판석. 대주교의 성소 세트(배교 제단·비석·우리·등불 — 같은 공간 특징 둘)와 홀 안 바위 기둥 넷은 뺐다.
//   심연 벽·발광 층(손으로 고른 자리 · 코덱스 감사 c-2)은 그대로.
//   고리 끊기(검수표 「고리 3+2」): 혼등 회랑 ↔ 문장의 홀 · 제물 방 ↔ 문장의 홀 대각 통로를 막아 두 곁방은 계단참 쪽 갈림길에서만 (보스·웨이포인트 동선과 무관).
//   혼등 회랑 = 북벽 혼 등불 열 · 제물 방 = 북벽 혼 우리 열 · 문장의 홀 = 사슬 제단 조각 · 계단참 = 웨이포인트 곁 화로.
Object.assign(module.exports.abyssgate3, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { row: { name: "a4-soul-lantern", side: "n" }, props: ["a4-adjunct-soul-candle-cluster", "a4-soul-crystal"], decals: ["a4-decal-soul-mist-puddle"], dn: 2 },
      c: { row: { name: "a4-soul-cage", contiguous: true, min: 2, minLine: 4 }, props: ["a4-adjunct-chained-skull", "a4-bone-heap"], decals: ["a4-decal-broken-chain"], dn: 1 },
      d: { props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster"], decals: ["a4-decal-blood-sigil-circle"], dn: 1 },
      e: {
        feature: "set:a4_lm_blood_pulpit", featureAt: [-14.5, 8.3], featureScale: 4 / 3,   // 보스 배경 — 옥좌·성소 제단처럼 4칸
        sides: { left: "h", right: "e" },   // 서쪽으로 가는 축의 왼쪽 = 남쪽
        row: [{ name: "a4-sigil-stone", side: "s" }],
        decals: ["a4-decal-blood-sigil-circle", "a4-decal-cracked-obsidian", "a4-decal-ember-scatter"], dn: 3,
      },
      g: { decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
  rocks: [],
  paths: module.exports.abyssgate3.paths.filter((p) => !["8,9", "8,-9"].includes(p.pts[0].join(","))),
  put: module.exports.abyssgate3.put.filter((p) => p[1] !== "boss_archbishop" && p[1] !== "a4_lm_blood_pulpit"),
  places: module.exports.abyssgate3.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "혼등 회랑", c: "제물 방", d: "문장의 홀", e: "대주교의 의식 홀", g: "아래 계단" }[p.z] || p.name, note: p.z === "e" ? "보스 아레나 · 대주교 · 핏빛 설교대" : p.note })),   // 납골당 3층 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.abyssgate3.zones, {
    d: "a4-bone-ash-floor 0.84/0.8/0.78 문장의 홀",                       // 바탕(흑요석)과 같은 그림이라 띠가 안 보였다
    e: "a4-scorched-flagstone-floor 0.96/0.9/0.86 대주교의 의식 홀",      // 띠 북쪽
    h: "a4-scorched-flagstone-floor 0.76/0.7/0.68 대주교의 의식 홀 남쪽",  // 띠 남쪽
  }),
});

// 13/18 배교자의 수도원 (v5): 동쪽 수도원 문(W 28, 1) → 서쪽 기도실 → 회랑 → 심장의 제단(되돌아가는 문 −26, 9 · 끝방 −20.5, 7.5). 띠 = y 2 축 + 제단 홀 안에서 서쪽 x −19까지 곧게 간 뒤 북서 문으로.
//   고리 끊기(검수표 「고리 3+2」): 북쪽·남쪽 기도실 ↔ 심장의 제단 통로를 막아 두 기도실을 회랑에서만 들어가는 막다른 방으로 (끝방·되돌아가는 문은 제단 홀 안이라 동선 그대로).
//   심장의 제단 = 오렌이 무릎 꿇던 제단(랜드마크 · 같은 자리를 v5 특징으로 · 낱개 비석·등불은 뺌 · 북벽에 붙임) + 안쪽 축 양옆 사슬 기둥 열주 · 홀 안 1×1 바위 넷은 뺐다.
//   기도실 셋 = 신도석 줄(설계도 담 글자 — 그대로 · 반복 구조) + 혼 촛불·뼈 묶음 (남벽 뿔 석상 열은 벽에 붙지 않아 뒤 칸이 남았다) · 회랑 = 혼 등불 열 · 띠 북쪽 밝은 판석 / 남쪽 어두운 판석(회랑).
Object.assign(module.exports.apostate, {
  v5: {
    outdoor: false,
    via: [[-19, 2]],
    dress: {
      a: { props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { props: ["a4-adjunct-soul-candle-cluster", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-blood-sigil-circle"], dn: 1 },
      c: { props: ["a4-adjunct-soul-candle-cluster", "a4-bone-heap"], decals: ["a4-decal-blood-sigil-circle"], dn: 1 },
      d: { row: [{ name: "a4-soul-lantern", side: "n" }], decals: ["a1-decal-blood-pool", "a4-decal-scorched-ring"], dn: 2 },
      e: { props: ["a4-adjunct-chained-skull", "a4-adjunct-ash-urn"], decals: ["a4-decal-scorched-ring"], dn: 1 },
      f: {
        feature: "set:a4_lm_apostate_altar", featureAt: [-20.5, 10.3], featureFlip: true, featureDrop: ["a4-sigil-stone", "a4-soul-lantern"],
        colonnade: { name: "a4-chain-pillar", step: 3, minPairs: 2, off: 2.5, tight: true, axis: [[-12.5, 2.5], [-19.5, 2.5]] },
        decals: ["a1-decal-blood-pool", "a4-decal-blood-sigil-circle", "a4-decal-cracked-obsidian"], dn: 3,
      },
    },
  },
  rocks: module.exports.apostate.rocks.filter((r) => !r.e),
  paths: module.exports.apostate.paths.filter((p) => !["-8,-10", "-8,14"].includes(p.pts[0].join(","))),
  put: module.exports.apostate.put.filter((p) => p[1] !== "a4_lm_apostate_altar"),
  places: module.exports.apostate.places.map((p) => Object.assign({}, p, { name: { a: "수도원 문", b: "서쪽 기도실", c: "남쪽 기도실", d: "회랑", e: "북쪽 기도실", f: "심장의 제단" }[p.z] || p.name, note: p.z === "f" ? "오렌 · 무릎 꿇던 제단 · 되돌아가는 문" : p.note })),   // 잊힌 서고 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.apostate.zones, {
    d: "a4-obsidian-floor 0.84/0.8/0.82 회랑",                     // 바탕(그을린 판석)과 같은 그림이라 띠가 안 보였다
    f: "a4-soul-stone-floor 0.94/0.88/0.9 심장의 제단",
    b: "a4-bone-ash-floor 0.86/0.82/0.8 서쪽 기도실",
    c: "a4-ash-drift-floor 0.84/0.82/0.86 남쪽 기도실", e: "a4-ash-drift-floor 0.84/0.82/0.86 북쪽 기도실",
  }),
});

// 14/18 심장의 다리 (keep): 식은 용암 바탕·돌다리(=, 2칸 한 장)·흑요석 기둥참·곁다리·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 다리 어귀(웨이포인트) → 첫 기둥참 → 무너진 가운데참 → 둘째 기둥참 → 심장 쪽 다리 끝, 곁 = 혼의 제단 섬(북)·용암 섬(남)).
//   특징 공간당 1: 무너진 가운데참 = 심장을 든 석상(랜드마크 · 다리 북쪽 가운데 · 쓰러진 거인 세트는 같은 공간 특징 둘·16×16 과밀이라 뺌) · 혼의 제단 섬 = 혼의 제단(비석 쌍 + 수정) ·
//   용암 섬 = 용암 둔덕 세트 · 두 기둥참 = 다리 들어오는 문 양옆 사슬 기둥 쌍(낱개 기둥·깃발 정리) · 다리 끝 = 불씨 제단 세트 · 어귀 = 용암 돌무더기.
//   석순·뼈 산발(4·4)은 묶음 ≤3·같은 그림 맵당 ≤2로. 길 위 사건 둥지 세트는 그대로.
Object.assign(module.exports.heartbridge, {
  // 웨이포인트 (-30, -3) → (-31, 1): keep 골격(돌다리 y 0)에서 3칸 → 다리 곁 어귀 칸 (다리 길 글자 칸 위는 길 그림이 끊겨 피함 · waypoints.csv·WaypointData 갱신)
  waypoint: [-31, 1],
  // 혼의 제단 섬 수정 — 역할 기준 1칸(소품)이 비석 사이에서 작아 배율 2로 따로 (불탄 협곡과 같은 처리 · 세트 수정·등불은 뺌)
  put: [...module.exports.heartbridge.put, ["prop", "a4-soul-crystal", 0.5, 13.4, 2, 0]],
  v5: {
    mode: "keep",
    outdoor: true,
    dress: {
      a: { sets: ["a4_lava_cairn"], decals: ["a4-decal-ember-scatter"], dn: 1 },
      b: { pair: { name: "a4-chain-pillar" }, decals: ["a4-decal-scorched-ring"], dn: 1 },
      c: { feature: "set:a4_lm_heart_statue", featureAt: [0.5, 1.4], featureDrop: ["a4-soul-crystal"], props: ["a4-bone-heap", "a4-adjunct-chained-skull"], clusters: 1, decals: ["a4-decal-cracked-obsidian", "a4-decal-ember-scatter"], dn: 2 },
      d: { feature: "set:a4_soul_altar", featureAt: [0.5, 13.0], featureDrop: ["a4-soul-lantern", "a4-soul-crystal"], decals: ["a4-decal-soul-mist-puddle", "a4-decal-scorched-ring"], dn: 2 },
      e: { feature: "set:a4_lava_mound", props: ["a4-small-lava-fount"], decals: ["a4-decal-molten-metal-streak"], dn: 2 },
      f: { pair: { name: "a4-chain-pillar" }, decals: ["a4-decal-scorched-ring"], dn: 1 },
      g: { sets: ["a4_ember_shrine"], props: ["a4-brazier"], decals: ["a4-decal-ember-scatter"], dn: 1 },
    },
  },
});

// 15/18 유황 동굴 1층 (keep): 유황 껍질 굴 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 굴 어귀 → 유황 비탈 → 유황 기둥 광장 → 매복 굴 → 아래 굴, 곁 = 끓는 고리길).
//   특징 공간당 1: 유황 기둥 광장 = 유황 결정 무리(랜드마크 · 검수표 「광장 중심에」, 매복 굴에서 옮김 — 용암 둔덕 세트는 유황 늪·심장의 다리와 겹쳐 뺌) ·
//   매복 굴 = 뼈·사슬 해골 묶음 · 유황 비탈 = 유황 웅덩이 + 석순 · 끓는 고리길 = 사슬 제단 조각 + 웅덩이 · 굴 어귀 = 용암 돌무더기.
Object.assign(module.exports.sulfurcave1, {
  places: module.exports.sulfurcave1.places.map((p) => Object.assign({}, p, { name: { a: "굴 어귀", b: "유황 비탈", c: "유황 기둥 광장", d: "매복 굴", e: "끓는 고리길", f: "아래 굴" }[p.z] || p.name })),   // 짝 맵 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { props: ["a4-sulfur-stalagmite", "a4-adjunct-lava-rubble"], decals: ["a4-decal-sulfur-steam-vent"], dn: 1 },
      b: { props: ["a4-sulfur-stalagmite", "a4-adjunct-obsidian-shards"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      c: { feature: "set:a4_lm_sulfur_cluster", props: ["a4-bone-heap", "a4-small-lava-fount"], clusters: 1, decals: ["a4-decal-sulfur-steam-vent", "a4-decal-molten-metal-streak"], dn: 3 },
      d: { props: ["a4-bone-heap", "a4-adjunct-chained-skull", "a4-helm-pile"], decals: ["a4-decal-ash-pile"], dn: 2 },
      e: { props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      f: { decals: ["a4-decal-ash-footprints"], dn: 1 },
    },
  },
});

// 16/18 옥좌의 전실 (v5): 서쪽 전실 문(W −29, 1) → 서쪽 대기실 → 알현 복도 → 큰 전실 → 옥좌로 오르는 문(E 28, 1)이 y 2 축 한 줄 — 그 축이 띠.
//   고리 끊기(검수표 「고리 3+2」): 북쪽·남쪽 대기실 ↔ 큰 전실 통로를 막아 두 대기실을 알현 복도에서만 들어가는 막다른 방으로 (길 위 사건 의식 제단은 큰 전실 안이라 그대로).
//   큰 전실 = 무릎 꿇은 석상 셋(랜드마크) + 남벽 뿔 석상 열 · 홀 안 1×1 바위 넷은 뺐다. 대기실 셋 = 석상 줄(설계도 담 글자 — 그대로 · 반복 구조) + 소품 묶음.
//   알현 복도 = 북벽 악마 깃발 열 · 띠 북쪽/남쪽 판석 두 톤(큰 전실).
Object.assign(module.exports.throneante, {
  v5: {
    outdoor: false,
    dress: {
      a: { props: ["a4-brazier", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-ash-footprints"], dn: 1 },
      b: { props: ["a4-adjunct-ember-brazier", "a4-adjunct-ash-urn"], decals: ["a4-decal-scorched-ring"], dn: 1 },
      c: { props: ["a4-adjunct-soul-candle-cluster", "a4-adjunct-chained-skull"], decals: ["a4-decal-cracked-obsidian"], dn: 1 },
      d: { row: [{ name: "a4-demon-banner", side: "n" }], decals: ["a4-decal-broken-chain", "a4-decal-scorched-ring"], dn: 2 },
      e: { props: ["a4-adjunct-demon-skull-spear", "a4-helm-pile"], decals: ["a4-decal-ash-pile"], dn: 1 },
      f: {
        feature: "set:a4_lm_kneeling_row",
        row: [{ name: "a4-horned-statue", side: "s" }],   // 남벽 뿔 석상 열 (「뿔 달린 석상 줄」 · 옥좌 문 앞 열주는 길 위 사건 의식 제단과 겹쳐 1쌍뿐이라 뺐다)
        sides: { left: "h", right: "f" },   // 동쪽으로 가는 축의 왼쪽 = 북쪽 → 남쪽(오른쪽)이 f
        decals: ["a4-decal-blood-sigil-circle", "a4-decal-cracked-obsidian", "a4-decal-ember-scatter"], dn: 3,
      },
    },
  },
  rocks: module.exports.throneante.rocks.filter((r) => !r.e),
  paths: module.exports.throneante.paths.filter((p) => !["8,-10", "8,14"].includes(p.pts[0].join(","))),
  places: module.exports.throneante.places.map((p) => Object.assign({}, p, { name: { a: "전실 문", b: "서쪽 대기실", c: "남쪽 대기실", d: "알현 복도", e: "북쪽 대기실", f: "큰 전실" }[p.z] || p.name, note: p.z === "f" ? "무릎 꿇은 석상 셋 · 옥좌로 오르는 문" : p.z === "d" ? "" : "석상 줄 둘" })),   // 잊힌 서고 자리 이름을 그대로 물려받았었다
  zones: Object.assign({}, module.exports.throneante.zones, {
    c: "a4-scorched-flagstone-floor 0.9/0.87/0.86 남쪽 대기실", e: "a4-scorched-flagstone-floor 0.89/0.86/0.85 북쪽 대기실",
    d: "a4-bone-ash-floor 0.84/0.8/0.78 알현 복도",                   // 바탕(흑요석)과 같은 그림이라 띠가 안 보였다
    f: "a4-scorched-flagstone-floor 0.8/0.74/0.72 큰 전실",           // 띠 남쪽 (어두운 판석)
    h: "a4-scorched-flagstone-floor 0.98/0.92/0.88 큰 전실 북쪽",     // 띠 북쪽 (밝은 판석)
  }),
});

// 17/18 용암 대장간 2층 (keep · `?` 맵): 벽돌 격자·현무암 섬 바닥·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 계단참 → 광석 창고 → 갈림 방 → 베르카의 대장간(되돌아가는 문 · 끝방), 곁 = 용암 웅덩이 방).
//   베르카의 대장간 = 베르카의 모루(랜드마크 · 손으로 고른 자리 그대로 — 끝방 자리 뒤) + 큰 모루(손으로 고른 자리) + 녹은 갑옷·수레 묶음 (문 양옆 사슬 기둥 쌍은 keep 골격 너비를 2칸 밑으로 줄여 뺐다) ·
//   광석 창고 = 부서진 공성 수레 세트 + 임프 · 용암 웅덩이 방 = 용암 샘·돌무더기·흑요석 조각 · 계단참 = 화로. keep 빈 바닥 12.2%(20% 밑)라 v5 비교본은 짓지 않음.
const FORGE2_KEEP = {
  mode: "keep",
  outdoor: false,
  dress: {
    a: { props: ["a4-adjunct-ember-brazier", "a4-brazier"], decals: ["a4-decal-ash-footprints"], dn: 1 },
    b: { sets: ["a4_siege_wreck"], props: ["a4-imp-on-barrel"], decals: ["a4-decal-ash-pile"], dn: 2 },
    c: { props: ["a4-small-lava-fount", "a4-adjunct-lava-rubble", "a4-adjunct-obsidian-shards"], decals: ["a4-decal-molten-metal-streak", "a4-decal-ember-scatter"], dn: 3 },
    d: { decals: ["a4-decal-scorched-ring"], dn: 1 },
    e: { props: ["a4-melted-armor-pile", "a4-adjunct-burning-cart"], clusters: 1, decals: ["a4-decal-molten-metal-streak", "a4-decal-cracked-obsidian"], dn: 3 },
  },
};
Object.assign(module.exports.forge2, {
  places: module.exports.forge2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "광석 창고", c: "용암 웅덩이 방", d: "갈림 방", e: "베르카의 대장간" }[p.z] || p.name })),   // 지하실 2층 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: FORGE2_KEEP,
});

// 18/18 유황 동굴 2층 (keep): 유황 껍질 굴 바닥·굴 벽·통로·원래 이음새 그대로 · 길 안내 0 · 역할 배치만
//   (검수표 구획: 계단참 → 북쪽 굴 → 유황 여왕의 굴(되돌아가는 문 · 끝방), 곁 = 유황 무더기 길).
//   유황 여왕의 굴 = 네르사의 뼈 둥지(랜드마크 · 손으로 고른 자리 그대로 — 끝방 자리 뒤) + 유황 웅덩이·용암 샘 묶음 · 북쪽 굴 = 사슬 제단 조각 ·
//   유황 무더기 길 = 용암 돌무더기 세트 + 웅덩이 · 계단참 = 바닥 무늬만(좁은 계단참이라 소품이 골격을 좁혔다).
Object.assign(module.exports.sulfurcave2, {
  places: module.exports.sulfurcave2.places.map((p) => Object.assign({}, p, { name: { a: "계단참", b: "유황 무더기 길", c: "북쪽 굴", d: "유황 여왕의 굴" }[p.z] || p.name })),   // 뼈 구덩이 2층 자리 이름을 그대로 물려받았었다 (바닥·모양은 그대로)
  v5: {
    mode: "keep",
    outdoor: false,
    dress: {
      a: { decals: ["a4-decal-sulfur-steam-vent"], dn: 1 },
      b: { sets: ["a4_lava_cairn"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent"], dn: 2 },
      c: { props: ["a4-adjunct-chained-skull", "a4-adjunct-soul-candle-cluster", "a4-bone-heap"], decals: ["a4-decal-ash-pile"], dn: 2 },
      d: { props: ["a4-small-lava-fount", "a4-sulfur-stalagmite", "a4-adjunct-obsidian-shards"], floorProps: ["a4-sulfur-pool"], decals: ["a4-decal-sulfur-steam-vent", "a4-decal-molten-metal-streak"], dn: 3 },
    },
  },
});
