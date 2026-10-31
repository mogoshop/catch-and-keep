// 맵 장식 정책 (10-31 사용자 실플레이 피드백 C — 「조형물이 너무 많다 · 흩뿌림이 난잡하다 · 밟히는 것과 안 밟히는 것이 제각각 ·
//   어디로 가야 할지 모르겠다 · 길 안내·바닥이 네모로 뚝뚝 끊긴다」). 빌더(tools/build/handmade/lib.cjs + decor.cjs)와
//   검사기(tools/check_decor_collision.cjs)가 이 값만 쓴다 — 밀도·폭·밝기를 바꾸려면 여기 숫자만 고치고 그 맵을 다시 짓는다.
//
//   C-1 흩뿌림: 배치표의 흩뿌림(장소 소품 = kind prop 중 「손으로 고른 자리」·args keep=1이 아닌 줄, kind cluster)은
//        바닥 장식(decor_collision.csv class floor)만 남기고 SCATTER_KEEP 비율로 줄인다. 길 안내 중심선 ROUTE_CLEAR칸 안은 흩뿌림·장소 바닥 무늬 0.
//        액트 1 세 맵(ACT1_TRIO)은 세트 수를 SET_KEEP로 줄이고 어울리지 않는 세트·그림(UNFIT_*)을 뺀다.
//   C-2 충돌: 키 큰 것(class tall) = 막음 · 바닥에 붙은 것(floor)·포털 그림(portal)·겹친 빛(overlay)·바닥 무늬 = 통과.
//        세트 조각은 map_sets.csv collide 열, 그 밖은 decor_collision.csv collide 열로만 충돌을 만든다.
//   C-3·C-6 길 안내: 들어오는 문 → 나가는 문·굴 입구·되돌아가는 문·끝방까지 실측 경로(벽·막는 장식을 피한 최단 + 벽에서 떨어지게)를
//        줄 당기기 → 모서리 둥글리기(반경 GUIDE_RADIUS) → 곡선으로 따라 그린다. 폭 GUIDE_WIDTH(출구 EXIT_LEN칸 앞부터 EXIT_WIDTH).
//        밝기는 그 자리 바닥 색 × GUIDE_BRIGHT (채도 그대로). 출구 EXIT_LEN칸 앞 양옆에 표식(MARKER) 한 쌍.
//   C-4 타일 4계층: data/handmade/tile_classes.csv (map · glyph · tile_class guide/base/terrain/block) — block만 충돌.
//   C-5 이음새: 걷는 칸끼리 바닥(그림·색)이 다른 경계마다 위 계층 그림을 1칸 폭 그라데이션 띠로 아래 칸에 번지게(BAND) +
//        볼록 모서리는 45° 반칸 조각(CORNER). 막힌 칸 옆은 벽 9조각 가장자리(바위 테두리)가 이음새(그늘 띠 SHADE는 10-31 로딩 실측으로 끔) — 벽 모서리는 벽 9조각(ne·nw·se·sw)이 둥근 바위 모서리라 조각을 더하지 않는다.
//        길 안내 그림은 그 자리 바닥 그림(구역 · 길 글자 칸은 그 길 그림) × GUIDE_BRIGHT — 다른 그림을 쓰면 바닥과 따로 논다.
"use strict";
module.exports = {
  // 이 정책을 적용하는 맵. FULL = C-1~C-6 (사냥터·곁길 58장) · COLLIDE_ONLY = C-2·C-4·C-5만 (마을 4 · 액트 끝 보스방 4)
  //   (10-31 1차 = 액트 1 세 맵 7281f92c → 2차 = 설계도 맵 전부. 목록에 없는 맵은 예전 빌더 그대로)
  FULL: ["wasteland", "rotmarsh", "execution", "gallows", "crypt1", "crypt2", "crypt3", "hollow", "cellar1", "cellar2", "pit1", "pit2", "cave",
    "dunes", "canyon", "stormwaste", "sunkenroad", "scorpnest1", "scorpnest2", "drywell", "kingtomb1", "kingtomb2", "archive", "vipernest", "temple1", "temple2", "temple3",
    "saltflat", "wreckcoast", "stormcliff", "drownedvillage", "crabcave1", "crabcave2", "wreckhold", "smuggler1", "smuggler2", "seachapel", "keeperhouse", "lighthouse1", "lighthouse2", "lighthouse3",
    "embercanyon", "demonroad", "sulfurmarsh", "burningkeep", "sulfurcave1", "sulfurcave2", "soulprison", "forge1", "forge2", "apostate", "pit", "abyssgate1", "abyssgate2", "abyssgate3", "ashhall", "heartbridge", "throneante"],
  COLLIDE_ONLY: ["town", "oasis", "harbor", "outpost", "queentomb", "sanctum", "stormeye", "throne"],

  SCATTER_KEEP: 0.25,          // 흩뿌림 밀도 (지금의 1/4)
  ROUTE_CLEAR: 1.5,            // 길 안내 중심선 좌우 이 거리 안은 흩뿌림 0 · 막는 조각 0 (폭 3칸)

  ACT1_TRIO: ["wasteland", "hollow", "rotmarsh"],
  SET_KEEP: 0.5,               // 액트 1 세 맵 세트 수 (절반)
  // 액트 1에 어울리지 않는 세트 — 회색 석벽·석상·뿔 제단·회색 묘비·십자가 묘지·종탑 (사막·재 톤 세트만 남긴다 · 액트 3 회청색 규칙과 무관)
  UNFIT_SETS: ["a1_graveyard", "a1_fallen_belfry", "a1_kings_rest", "hm_robbed_grave", "a1_bone_shrine", "a1_lm_rib_arch"],   // a1_lm_rib_arch = 뿔 달린 짐승 두개골을 모신 갈비뼈 제단
  // 같은 이유로 액트 1 세 맵의 낱개 장식에서 빼는 그림 (회색 묘비·십자가·묘지 울타리·회색 기둥·담 토막·석관·쇠 관)
  UNFIT_SPRITES: ["mp-grave-cross", "mp-grave-slab", "mp-grave-tall", "a1-grave-markers", "a1-crow-fence", "execution-broken-column",
    "mp-ruin-wall", "a1-chained-stake", "crypt-bone-urn", "mp-iron-coffin", "a1-headless-king-statue", "a1-fallen-bell-tower"],
  // 세트를 줄일 때 먼저 남기는 순서: 랜드마크(a1_lm_*) → 손으로 고른 자리 → 처음 나온 세트 이름 → 배치표 순서

  GUIDE_WIDTH: 2,              // 길 안내 폭 (칸) — 바깥 GUIDE_EDGE칸은 어두운 테 선, 안쪽은 밝은 길
  EXIT_WIDTH: 3, EXIT_LEN: 3,  // 출구 EXIT_LEN칸 앞부터 폭 3칸
  GUIDE_RADIUS: 1.5,           // 꺾이는 곳 둥글리기 반경 (짧은 토막이면 줄지만 1칸 아래로는 검사기가 센다)
  // 10-31 메이커 실측(012e07e2): ×1.10은 줌 130 근접에서도 안 보였다 → ×1.25 · 출구 앞 ×1.30 + 양 가장자리 0.07칸(1px) 어두운 테(×0.80). 채도 그대로
  GUIDE_BRIGHT: 1.25,
  EXIT_BRIGHT: 1.30,
  GUIDE_EDGE: 0.07,
  GUIDE_EDGE_DARK: 0.80,
  // 바닥 색이 이보다 밝으면 길 안내가 ×1.25만큼 밝아질 여유가 없다 → 바닥 색을 이 값까지 낮춘다 (세 채널 같은 비율 · 채도 그대로).
  //   0.80 × 1.25 = 1.0 — 이보다 밝던 바닥(색 값 0.8 초과)만 어두워진다. 출구 앞 ×1.30은 그런 바닥에서 1.0에 막혀 ×1.25
  FLOOR_TINT_CAP: 0.80,
  GUIDE_STEP_DEG: 22,          // 곡선을 이 각도마다 다른 토막으로 (돌린 반복 그림 한 장 = 한 토막 · 10-31 엔티티 절감으로 12→22, 이음매는 토막 끝을 폭에 맞춰 늘려 덮는다)
  // ───── 길 안내 v4 (10-31 사용자 전체 맵 캡처 피드백 C-7·C-8: 「아스팔트 도로처럼 한 줄로 다 깔려 단조롭다 · 너무 두껍다 ·
  //   출구가 여러 개면 여러 갈래로 · 액트/맵별 타일로」) — GUIDE_V4 맵만. 나머지 맵은 위 v3 값(폭 2 · 한 줄) 그대로 (승인 뒤 넓힌다)
  GUIDE_V4: null,   // null = FULL 맵 전부 (10-31 사용자 승인 「모양 승인, 63장 진행」 — 1차는 액트 1 세 맵만이었다). 목록을 주면 그 맵만
  BIG_ROAD_GLYPHS: ["="],      // 큰길 글자 — 큰길은 그 자체가 길이라 안내선을 겹치지 않는다(큰길 칸 0.55칸 안 점은 그리지 않음). 경로는 큰길을 따라가다(비용 ×ROAD_COST) 갈라진다
  V4: {
    WIDTH: 1.0, EXIT_WIDTH: 1.5,          // 폭 1칸 · 출구 EXIT_LEN칸 앞만 1.5칸
    BRIGHT: 1.18, EXIT_BRIGHT: 1.25,      // 밝은 발길(폭이 줄어 ×1.25보다 낮춤) · 출구 앞
    EDGE: 0.07, EDGE_DARK: 0.86,          // 어두운 바탕 띠(폭 전체, 테 선 역할)를 깔고 그 위에 밝은 발길 토막을 끊어 얹는다
    DASH: [3.0, 5.0], GAP_RATIO: 0.2,     // 끊긴 발길: 발길 토막 길이 3~5칸(의사 난수) · 빈틈은 전체의 20%
    ROAD_COST: 0.5,                       // 큰길 칸 경로 비용 배율 (큰길을 따라가다 갈라지게)
    LOOP_MIN_CELLS: 80,                   // 이 칸 수 이상인 설계도 구역마다 고리 갈래 하나 (작은 마당·길목은 고리 없이 갈래만)
    LOOP_CLEAR: 1.0,                      // 고리는 벽·막는 장식에서 1칸 이상 (출구 갈래는 ROUTE_CLEAR 1.5)
    LOOP_RING: [0.55, 2, 6],              // 고리 반경 = 구역 반경 × 0.55 (2~6칸) · 큰길 쪽에서 들어가 구역 뒤편을 돌아 나온다
    LOOP_ANGLES: [-80, 180, 80],          // 구역 가운데에서 본 들어온 쪽 방향 기준 고리 경유점 각도 (옆 → 뒤편 → 옆)
    MAP_VAR: 0.08,                        // 맵마다 명도 ±8% (맵 id 씨앗)
    FORK_LEN: 1.5,                        // 갈래 시작 1.5칸 = 갈림 조각
    END_ALPHA: 0.6,                       // 구간 시작·끝 뾰족한 끝 조각 불투명도 (띠 끝이 옅어지며 끝나게 · 코덱스 end 타일 오기 전 임시)
    STEP_DEG: 40,                         // 곡선 토막 각도 (엔티티 예산 43545 ± 10% 안으로)
    // 코덱스 타일 도장 (GUIDE_TILE stamp): 1칸(100px) 간격 · 빈틈 10%(타일 자체 빈틈이 있어 20%에서 낮춤) · 1칸 안 꺾임 25° 이상 = 곡선 타일 · 50° 이상 = 곡선 + 반 칸 뒤 직선 보정 (10-31 메이커 3차: 50°면 곡선 0장)
    STAMP: { PITCH: 1.0, GAP: 0.1, CURVE_DEG: 25, CURVE_FIX_DEG: 50, CORE_W: 0.45, VAR: 0.08 },
  },
  // C-8 액트별 길 안내 타일 슬롯 {straight, curve, fork, end}. 빌더는 조각마다 종류를 기록한다(guide.pieces.kind)
  //   stamp: true = 코덱스 길 안내 타일(128px 정사각 · 100px 피치 · 가운데 피벗 · 자체 가장자리·빈틈) — 1칸 간격 낱장 도장으로 찍는다
  //     (바탕 띠·테 선 없음 · 빈틈 STAMP.GAP). 타일 방향: 직선 N–S · 곡선 N–E(왼쪽으로 꺾임, 오른쪽은 좌우 반전) · 갈림 W–E + S(갈래) · 끝 N(그 반대쪽으로 옅어짐)
  //   stamp 없음 = 임시: 기존 바닥 그림 + 색 변형을 돌린 반복 그림 띠로 (바탕 띠 + 끊긴 발길)
  //   코덱스 타일이 오면: assets/codex-guide-tiles-v1/act<N>/를 그룹 OJYYQ에 올리고(RUID) data/art_sprites.csv에 4행 → 아래 그 액트 줄을 stamp 줄로 바꿔 다시 짓는다
  GUIDE_TILE: (() => {
    const t = (art, tint) => ({ straight: { art, tint }, curve: { art, tint }, fork: { art, tint }, end: { art, tint } });
    const s = (pre) => ({ straight: { art: `${pre}-straight`, tint: "1/1/1", stamp: true }, curve: { art: `${pre}-curve`, tint: "1/1/1", stamp: true },
      fork: { art: `${pre}-fork`, tint: "1/1/1", stamp: true }, end: { art: `${pre}-end`, tint: "1/1/1", stamp: true } });
    return {
      1: s("guide-act1"),                                   // 10-31 코덱스 액트 1 타일 (밟힌 흙길 + 자갈 가장자리 · 폭 약 0.3~0.5칸) — 임시였던 a1-mud-floor 0.74/0.64/0.52 대체
      2: s("guide-act2"),                                   // 10-31 코덱스 액트 2 타일 — 임시였던 a2-sandstone-paving-floor 0.76/0.68/0.54(돌판) 대체
      3: s("guide-act3"),                                   // 10-31 코덱스 액트 3 타일 — 임시였던 a3-wet-cobble-road-r2 0.62/0.68/0.7(젖은 조개 자갈) 대체
      4: s("guide-act4"),                                   // 10-31 코덱스 액트 4 타일 — 임시였던 a4-cooled-lava-floor 0.62/0.55/0.52(재·식은 용암) 대체 · t()는 fallback으로 남김
    };
  })(),
  MARKER: { 1: "camp-brazier", 2: "a2-adjunct-censer-base", 3: "harbor-lantern", 4: "a4-brazier" },
  MARKER_OFFSET: [2.3, 2.6, 3.0, 3.4],   // 길 가운데에서 옆으로 (길 폭 3칸 밖 · 양쪽 한 쌍)
  MARKER_ALONG: [0, -0.8, 0.8, -1.6, 1.6], // 자리가 막혔으면 길을 따라 앞뒤로 옮겨 본다 (출구 3칸 앞 기준)

  // 이음새 띠: [폭(칸), 불투명도] 경계에서 바깥으로. 두 겹(그라데이션)은 계층이 다른 경계만 · 같은 계층끼리(구역 ↔ 구역)는 첫 겹만 (decor.cjs seamEntities)
  //   DECOR_BAND=single 환경 변수로 모든 경계 한 겹 (엔티티 절약 후보)
  BAND: process.env.DECOR_BAND === "single" ? [[0.7, 0.36]] : [[0.5, 0.5], [0.5, 0.22]],
  CORNER: { size: 0.75, alpha: 0.42 }, // 볼록 모서리 45° 조각
  // 막힌 칸 옆 그늘 띠 — 10-31 메이커 로딩 실측(wasteland 첫 입장 1.49→3.05초)으로 뺐다(66장 7003개). 벽 9조각 가장자리(바위 테두리)가 이음새.
  //   되살리려면 [[0.45, 0.2]]
  SHADE: [],
  // 회전한 반복 그림 축 (decor.cjs rotRect·rectPoint 한 곳) — 메이커 실화면이 가정과 다르면 이 두 값만 바꿔 다시 짓는다
  ROT_ANCHOR: "first-tile",            // "first-tile" = 첫 장(왼쪽 아래 장) 가운데가 엔티티 자리·회전축 (회전 없는 반복 그리기와 같은 가정) | "center"
  ROT_SIGN: 1,                         // 1 = QuaternionRotation z 양수가 반시계 · -1 = 시계
  SHADE_ART: "waste-borders-center",   // 그늘 그림 (검게 칠해 쓰는 기존 조각 — 담 윗면 맵 그림자와 같은 것)

  // ───── 맵 구성 v5 (10-31 · docs/design/map-composition-v5-plan.md) — 설계도에 ;v5가 있는 맵만 (설계서 v5: true → compose.cjs가 적는다). 나머지 맵은 위 값 그대로
  //   길 = 바닥 구역 경계의 빈 띠(설계도 바탕 . 칸) · 길 안내 도장 없음 · 흩뿌림 정책 끔 · 역할표(asset_roles.csv) 기준 크기·배열
  V5: {
    SEAMS: false,                 // 10-31 사용자 판정(유황 늪 2차 반려 「반투명 네모 타일이 난잡」): v5 성소형 맵은 반투명 이음새 조각(ArtBand·ArtCorner·ArtShade) 없음 — 불투명 타일 가장자리만. v5 keep은 원래 이음새 그대로
    BAND_EDGE: [[0.3, 0.45]],     // SEAMS를 켤 때만: 띠(tile_class guide) ↔ 구역 경계 이음새 한 겹
    DILATE: { on: [2, 3], gap: [1, 2] },   // 띠 폭 1칸 골격에 한쪽씩 덧대기 — 위 2~3 · 빔 1~2 · 아래 2~3 · 빔 1~2 반복 (평균 폭 약 1.5 · 가장자리 직선 ≤6 · 폭 ≤2)
    CORE_VERSION: "26.10.0.0",   // v5 맵 파일 CoreVersion — 빌더 템플릿(.claude/skills, 26.7)이 아니라 메이커가 저장한 커밋본들과 같은 값 (v5 맵만 · 64장 빌드 결과 불변)
    DISTINCT_TINT: 0.1,           // 바탕과 같은 그림이면 색 차이가 이보다 커야 「다른 구역」 (아니면 띠 곁 빈 바닥으로 보고 패치)
    PATCH_DEPTH: [2, 3],          // 띠 곁 패치 깊이 (칸, 가장자리 잡음으로 2~3)
    FILL_RADIUS_OUTDOOR: 3,       // 야외 맵: 바탕 칸 중 띠에서 이 거리 안만 가까운 구역으로 채운다 (먼 빈 마당은 내부 경계 섬 자리)
    ISLAND_MIN: 36, ISLAND_FAR: 3, // 구역에서 3칸 넘게 떨어진 빈 바닥이 36칸 이상 뭉치면 섬 1개(90칸 이상 2개)
    // 띠 곁 패치 바닥 (액트별 · 앞에서부터 바탕·이웃 구역과 다른 그림을 고른다)
    PATCH: {
      1: ["a1-wet-gravel-floor 0.8/0.76/0.7", "a1-bonedust-floor 0.82/0.78/0.72", "a1-dead-grass-floor 0.82/0.76/0.66", "a1-scorched-floor 0.8/0.74/0.68"],   // 10-31 액트 1 적용: v5 맵이 모두 석재 실내(납골당·지하실·여왕의 무덤)라 마른 풀보다 젖은 자갈·뼈 흙을 먼저
      2: ["a2-sandstone-paving-floor 0.84/0.76/0.64", "tomb-floor 0.8/0.72/0.62", "a2-rippled-sand-floor 0.86/0.78/0.66"],
      3: ["a3-salt-crust-floor-r2 0.8/0.84/0.86", "a3-wet-sand-floor-r2 0.8/0.8/0.78", "a3-drowned-tile-floor-r2 0.78/0.82/0.84"],
      4: ["a4-cooled-lava-floor 0.84/0.8/0.76", "a4-bone-ash-floor 0.86/0.84/0.8", "a4-ash-drift-floor 0.86/0.84/0.82"],
    },
    // 내부 경계 섬: 그 액트 벽 토막(역할 structure · row) 한 줄 — 막는 세트 중 특징 조각이 없는 「벽·절벽」 세트가 없어 담 토막 줄로 (map_sets 막는 세트는 랜드마크·소품 세트뿐)
    ISLAND_WALL: { 1: "a1-crow-fence", 2: "broken-column", 3: "a3-adjunct-seaweed-post-r2", 4: "a4-ruined-wall-low" },
    ISLAND_LEN: [3, 4],           // 섬 하나 = 벽 토막 3~4개 한 줄
    PILLAR_FUNCS: ["의식터", "보스 아레나", "출구 관문", "랜드마크 마당"],   // 기둥류 열은 이 공간 기능에서만 (띠 양옆 2열 또는 특징 앞 열주)
    COLONNADE: { step: 3.5, off: 3.3, minPairs: 3, straight: 0.6, minLen: 7 },   // 열주: 간격 3.5 · 띠 가운데에서 3.3칸 · 3쌍 이상 · 곧은 띠 구간(현에서 0.6칸 안 · 7칸 이상)
    ROW: { step: 3, min: 3, minLine: 6 },     // 벽 따라 열: 간격 3칸 · 3개 이상 · 벽면 줄 6칸 이상
    RING: { r: 3.2, n: 6, min: 4 },           // 테두리: 특징 둘레 반경 3.2 · 6자리 중 4개 이상
    CLUSTER_MAX: 3, CLUSTERS_PER_SPACE: 2, SPRITE_MAX: 2, DECALS_PER_SPACE: 3,   // 소품 묶음 ≤3 · 공간당 ≤2묶음 · 같은 소품 그림 맵당 ≤2(축 없는 반복 3개 = 산발) · 바닥 무늬 공간당 ≤3
  },
};
