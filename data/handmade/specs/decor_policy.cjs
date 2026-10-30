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
//        볼록 모서리는 45° 반칸 조각(CORNER). 막힌 칸 옆은 그늘 띠(SHADE) — 벽 모서리는 벽 9조각(ne·nw·se·sw)이 둥근 바위 모서리라 조각을 더하지 않는다.
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

  GUIDE_WIDTH: 2,              // 길 안내 폭 (칸) — 가운데 GUIDE_CORE는 불투명, 바깥 테는 GUIDE_EDGE_ALPHA
  GUIDE_CORE: 1.4,
  GUIDE_EDGE_ALPHA: 0.5,
  EXIT_WIDTH: 3, EXIT_CORE: 2.4, EXIT_LEN: 3,
  GUIDE_RADIUS: 1.5,           // 꺾이는 곳 둥글리기 반경 (짧은 토막이면 줄지만 1칸 아래로는 검사기가 센다)
  GUIDE_BRIGHT: 1.10,          // 길 안내 = 그 자리 바닥 색 × 1.10 (8~12%, 채도 그대로)
  FLOOR_TINT_CAP: 0.92,        // 바닥 색이 이보다 밝으면 길 안내가 밝아질 여유가 없다 → 바닥 색을 이 값까지 낮춘다 (세 채널 같은 비율 · 채도 그대로)
  GUIDE_STEP_DEG: 12,          // 곡선을 이 각도마다 다른 토막으로 (돌린 반복 그림 한 장 = 한 토막)
  MARKER: { 1: "camp-brazier", 2: "a2-adjunct-censer-base", 3: "harbor-lantern", 4: "a4-brazier" },
  MARKER_OFFSET: [2.3, 2.6, 3.0, 3.4],   // 길 가운데에서 옆으로 (길 폭 3칸 밖 · 양쪽 한 쌍)
  MARKER_ALONG: [0, -0.8, 0.8, -1.6, 1.6], // 자리가 막혔으면 길을 따라 앞뒤로 옮겨 본다 (출구 3칸 앞 기준)

  // 이음새 띠: [폭(칸), 불투명도] 경계에서 바깥으로. 기본 두 겹(그라데이션) · DECOR_BAND=single 환경 변수로 한 겹(엔티티 절약 후보 — 10-31 메이커 로딩 결과로 고른다)
  BAND: process.env.DECOR_BAND === "single" ? [[0.7, 0.36]] : [[0.5, 0.5], [0.5, 0.22]],
  CORNER: { size: 0.75, alpha: 0.42 }, // 볼록 모서리 45° 조각
  SHADE: [[0.45, 0.2]],                // 막힌 칸 옆 그늘 띠 (한 겹 — 두 겹은 바위 둘레가 검은 테처럼 보였다)
  // 회전한 반복 그림 축 (decor.cjs rotRect·rectPoint 한 곳) — 메이커 실화면이 가정과 다르면 이 두 값만 바꿔 다시 짓는다
  ROT_ANCHOR: "first-tile",            // "first-tile" = 첫 장(왼쪽 아래 장) 가운데가 엔티티 자리·회전축 (회전 없는 반복 그리기와 같은 가정) | "center"
  ROT_SIGN: 1,                         // 1 = QuaternionRotation z 양수가 반시계 · -1 = 시계
  SHADE_ART: "waste-borders-center",   // 그늘 그림 (검게 칠해 쓰는 기존 조각 — 담 윗면 맵 그림자와 같은 것)
};
