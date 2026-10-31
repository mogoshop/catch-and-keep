// 손으로 지은 맵 (data/handmade/<id>.txt 설계도 + <id>.csv 배치표 → map/<id>.map).
// 10-28 사용자: 「전체 66개 맵 퀄리티가 들쭉날쭉 — 맵 하나를 진짜 사람이 한 땀 한 땀 만든 것처럼」.
// 자동 생성기(layout.cjs)를 쓰지 않고 설계도의 칸을 그대로 타일·벽 그림으로 옮기고, 배치표의 좌표에 세트·장식·바닥 무늬를 놓는다.
//
// 설계도(.txt): `;` 줄은 지시문/주석, 나머지 줄이 격자 (한 글자 = 한 칸, 위가 북쪽). 지시문:
//   ;size W H                      맵 크기 (maps.csv w·h와 같아야 한다)
//   ;base <바닥그림> <색>             맵 전체 바탕 바닥 (art_sprites.csv floor)
//   ;zone <글자> <바닥그림|-> <색|-> <이름>   구역 바닥 (-: 바탕 그대로). 길·표식 칸은 가장 가까운 구역 글자를 따른다
//   ;road <글자> <길그림> <색> <이름>  길 칸 (타일 265 + 길 그림)
//   ;wall <글자> <9조각 묶음> <색> <이름>  벽 칸 (충돌 타일 269 + 바위 9조각 그림)
//   ;raised <9조각 묶음> <색> <이름>  담 윗면 맵 (10-28 사용자 「담 위에서 플레이하는 느낌」 시안): 걷는 칸 전체를 이 9조각으로 덮고(가장자리 = 낮은 칸과 맞닿은 면),
//                                    첫 벽 글자 칸은 그림 없이 바탕을 낮은 모래로 두며, 담 남쪽 아래 한 칸에 앞면·그 아래 그림자를 그린다. 다른 벽 글자(기둥 등)는 담 위의 벽으로 그대로
//   ;markers W E H T S R             표식 글자 (바닥으로 친다). 배치표의 기능 엔티티가 표식 1칸 안에 있는지 검사한다
//   ;backdrop r/g/b                  맵 밖 배경(Background 단색) — 없으면 템플릿 색 그대로 (10-29 바다·용암 담 위 맵)
//   ;floormix <바닥그림>[,<바닥그림>…]  그 바닥 그림을 쓰는 구역(바탕 . 포함)을 그림 한 장(1.28칸) 단위로 좌우·상하 뒤집어 반복 격자를 깬다
//                                    (10-29 폭풍의 눈 따개비 돌 — 큰 조약돌이 1.28칸 격자로 보였다). 좌우는 그림 열마다 · 상하는 그림 줄마다 같은 값이라
//                                    이음 없는 타일이면 이음이 깨지지 않는다 (칸마다 따로 뒤집으면 옆 칸과 가장자리 줄이 거꾸로 맞닿아 금이 간다 — 원본 PNG로 잼).
//                                    열·줄은 맵 전체에 하나인 그림 격자라 구역 사각형 경계에서도 무늬가 이어진다 (2) 구역 바닥의 globalMix)
// 배치표(.csv) kind: gate(target=·arrive=town|left|right) · torch · waypoint(name=id) · set(map_sets.csv) · prop · decal ·
//   cluster(name=그림|그림…, args r=반경;n=개수;seed=씨앗 — 시드 고정 흩뿌림, 바닥이 아니거나 길이면 피한다)
// 크기 규칙은 maps.cjs와 같다: 코덱스 prop 0.8배 · prop-1x 1배 · 둘 다 ×art_scale.csv, 메이플(mp-*)은 data/handmade/maple_sprites.csv scale.
// 피벗: 코덱스 그림은 발밑, 메이플 그림은 maple_sprites.csv ny(아래에서 잰 피벗 비율)만큼 올려 발이 좌표에 오게 한다.
"use strict";
const fs = require("fs");
const path = require("path");
const { MapBuilder, readIfExists, preserveIds, P, load, num, bool } = require("../lib.cjs");
const layoutGen = require("../layout.cjs");

const ROOT = path.resolve(__dirname, "../../..");
const HM_DIR = path.join(ROOT, "data/handmade");
const MATERIAL_JOINS = require(path.join(HM_DIR, "specs", "material_joins.cjs"));   // 10-30 I07 재질 접합 (artEntities 끝)
const decor = require("./decor.cjs");   // 10-31 실플레이 피드백 C: 흩뿌림·충돌 분류·길 안내·이음새 (정책 맵만 — data/handmade/specs/decor_policy.cjs)
const tileClasses = require("./tile_classes.cjs");
const roles = require("./roles.cjs");   // 맵 구성 v5: 역할표 기준 크기 (;v5 맵만)
const S = 1.28;                       // 그림 한 장 = 1.28칸 (128px)
const TILE = { floor: 266, road: 265, wall: 269 };
const PROJECT_TILESET = JSON.parse(fs.readFileSync(path.join(ROOT, "RootDesk/MyDesk/AshCampTiles.tileset"), "utf8")).EntryKey;
const WALL_CENTER_SHADE = 0.3;        // 벽 속 조각은 어둡게 (maps.cjs와 같은 값)
const WALL_EDGE_SHADE = 0.68;         // 바닥에 닿은 center 조각 (얇은 벽·들판 안 바위) — 구멍이 아니라 바위 윗면으로 읽히게
const ROCK_DEPTH = 3;                 // 바닥에서 이 칸 수 안의 바위 속은 가장자리 그림으로 덮는다 (더 깊으면 검은 바깥)
const RAISED_FACE = 0.55;             // 담 윗면 맵: 담 남쪽 앞면(center 조각) 밝기
const RAISED_SHADOW = 0.32;           // 담 윗면 맵: 앞면 아래 그림자(검은 바위 속 조각) 불투명도
const TIER_SHADE = [1, 0.68, 0.46];   // 층 겹쌓기(설계 42): 앞면 띠 1·2·3단 밝기 — 아래 단일수록 어둡게
const TIER_SHADOW = 0.2;              // 층 겹쌓기: 마지막 띠 아래 그림자 (0.32는 메이커에서 네모 구멍처럼 보였다)
const SEAM_STEPS = 4;                 // ;raised seam= 그늘을 몇 줄로 나눠 옅어지게 하나 (줄마다 진하기 1 → 1/4)
// ;raised mix= 좌우 뒤집기: 칸 좌표로만 정하는 섞음 값(빌드마다 같다) — 홀수면 뒤집는다
const flipAt = (x, y) => {
  let h = (Math.imul(x + 4099, 0x27d4eb2d) ^ Math.imul(y + 8191, 0x165667b1)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13;
  return ((h >>> 16) & 1) === 1;
};
// ;floormix 그림 열(좌우)·줄(상하) 뒤집기: 그 열의 왼쪽 끝 x(또는 줄의 아래 끝 y)를 0.01칸 단위로 섞는다 — 좌우와 상하가 같은 값을 내지 않게 씨앗을 따로
const MIX_SEED_X = 7919, MIX_SEED_Y = 104729;
const floorFlipX = (wx) => flipAt(Math.round(wx * 100), MIX_SEED_X);
const floorFlipY = (wy) => flipAt(MIX_SEED_Y, Math.round(wy * 100));
// ;floormix 줄(상하) 정책 — 10-29 21:03 코덱스 위임 승인 바닥 시범 (approval-floor-review-2103 · 집게 동굴 1층·폭풍의 눈 노말만 격리 비교)
//   "mix" (기본 · 871b60b4 그대로): 줄마다 칸 좌표 의사난수로 상하 뒤집기
//   "seam-only" = 「상하 의사난수 섞기 중지 + 경계 이음 보정 유지」: 줄의 의사난수 FlipY 선택만 끈다.
//     잘린 줄의 경계 방향(decide의 hard cut)·segs의 필요 뒤집기(f = !f)·py(뒤집은 줄은 끝 장 가운데가 축)는 그대로라
//     경계에서는 FlipY가 남을 수 있다 — 「모든 FlipY=0」이 아니다. 열 FlipX·전역 격자 원점·부분 타일 정렬·MIX_Z·에셋/RUID/색/배율·통행/충돌은 모드와 무관
//   고르기: tools/build/handmade/build.cjs <맵id> --floormix-y=seam-only (또는 환경 변수 FLOORMIX_Y=seam-only). 전체 빌드(tools/build.cjs maps)는 기본 "mix"
const FLOORMIX_Y_MODES = ["mix", "seam-only"];
let floormixY = process.env.FLOORMIX_Y || "mix";
function setFloormixY(mode) {
  if (!FLOORMIX_Y_MODES.includes(mode)) throw new Error(`floormix 상하 모드 '${mode}' 모름 (가능: ${FLOORMIX_Y_MODES.join(", ")})`);
  floormixY = mode;
}
setFloormixY(floormixY);   // 환경 변수 값 검사
// ;floormix 바닥 변형 정책 — 10-29 22:52 코덱스 위임 승인 I-2 (quality-art-I-decision-2252 · 집게 동굴 1층·폭풍의 눈 노말만 격리 시범)
//   10-29 23:22 코덱스 승인(사용자 위임)으로 기본 = "variants" — 액트 3 따개비 돌 바닥 맵 10장(×노말·악몽·지옥 30파일)에 확대 적용.
//     variantsOf(art)는 FLOOR_VARIANTS에 등록된 그림(지금은 따개비 돌 바닥 하나)에만 변형을 돌려주므로 다른 ;floormix 바닥은 영향이 없다(아래 "flip" 그대로).
//     --floormix=flip / FLOORMIX=flip은 옛 정책 재현용
//   "flip" (옛 기본): 그림 열·줄마다 칸 좌표 의사난수로 좌우·상하 뒤집기 (위 floormixY 정책)
//   "variants" (기본) = 「현행 + 변형을 격자 좌표로 안정적으로 고르는 혼합 · 임의 좌우/상하 반전 없음」: FLOOR_VARIANTS에 변형이 있는 그림만
//     ① 열·줄의 의사난수 FlipX/FlipY 선택을 끈다 (floorFlipX·rowFlip → 뒤집지 않음)
//     ② 맵 전체 그림 격자 칸(열 kx · 줄 ky, 원점 MIX_OX/MIX_OY = 맵 왼쪽·아래 끝)마다 코덱스 좌표 해시(VARIANT_SEED)로 현행·변형 중 한 장을 고른다
//     그대로 두는 것: 잘린 열·줄의 경계 방향(decide의 hard cut)·segs의 필요 뒤집기(f = !f)·끝부터 깐 조각(local)·조각 위치 규칙(뒤집은 쪽은 끝 장 가운데가 축)·
//     전역 격자 원점·부분 타일 정렬·MIX_Z·색·배율·통행/충돌 — 경계 보정이 요구한 뒤집기는 남는다(「전부 FlipY 0」 같은 일괄 변경이 아님).
//     조각은 격자 칸 단위로 나눠 칸마다 장을 고르고, 같은 줄에서 같은 장·같은 뒤집기가 이어지면 segs와 같은 이어 붙이기 규칙으로 합친다.
//   고르기: tools/build/handmade/build.cjs <맵id> --floormix=flip|variants (또는 환경 변수 FLOORMIX=…). 전체 빌드(tools/build.cjs maps)도 기본 "variants"
const FLOORMIX_MODES = ["flip", "variants"];
const FLOOR_VARIANTS = {   // 순서 = 해시 번호 0..3 (코덱스 I-tile-layout-policy keys 순서)
  "a3-barnacle-stone-floor-r2": ["a3-barnacle-stone-floor-r2", "a3-barnacle-stone-floor-r2-v2", "a3-barnacle-stone-floor-r2-v3", "a3-barnacle-stone-floor-r2-v4"],
};
const VARIANT_SEED = 20261029;
// 코덱스 좌표 해시: u=((col*73856093)^(row*19349663)^seed)&0xffffffff; u^=u>>13; u=(u*0x85ebca6b)&0xffffffff; u^=u>>16; index=u&(n-1)
const variantAt = (col, row, n) => {
  let u = (Math.imul(col, 73856093) ^ Math.imul(row, 19349663) ^ VARIANT_SEED) >>> 0;
  u = (u ^ (u >>> 13)) >>> 0; u = Math.imul(u, 0x85ebca6b) >>> 0; u = (u ^ (u >>> 16)) >>> 0;
  return u % n;
};
let floormixMode = process.env.FLOORMIX || "variants";   // 10-29 코덱스 승인으로 기본 = variants (flip = 옛 정책 재현용)
function setFloormixMode(mode) {
  if (!FLOORMIX_MODES.includes(mode)) throw new Error(`floormix 정책 '${mode}' 모름 (가능: ${FLOORMIX_MODES.join(", ")})`);
  floormixMode = mode;
}
setFloormixMode(floormixMode);
const variantsOf = (art) => (floormixMode === "variants" && FLOOR_VARIANTS[art]) || null;
const noFlip = () => false;
const r3 = (v) => Math.round(v * 1000) / 1000;
const key = (x, y) => `${x},${y}`;
const tintOf = (t) => { const [r, g, b] = (t || "1/1/1").split("/").map(Number); return { r, g, b, a: 1 }; };
const vec3 = (v) => ({ "$type": "MOD.Core.MODVector3, MOD.Core", x: r3(Array.isArray(v) ? v[0] : v), y: r3(Array.isArray(v) ? v[1] : v), z: 1 });   // v = 배율 또는 [가로, 세로]
const NEAR_FUNC = [2.2, 1.4];         // 기능 자리(포털·화로·웨이포인트) 곁은 비운다 (maps.cjs placePieces와 같은 폭)
// 크기 검사 (10-29 코덱스 감사 「바로 고칠 것」 3): 192px 이상 그림이 art_scale.csv 줄 없이 배율 1(꾸밈 흔들기 0.85~1.15 포함)로 놓이면
//   원본 크기(256px → 2~2.6칸)로 그려진다 — 새 납품마다 사람이 표를 맞추던 일을 --check가 잡는다. 띠 그림은 배율을 ;shore·edge=에서 받으므로 예외
const SIZE_MIN_PX = 192, SIZE_MUL_TOL = 0.15;
const SIZE_EXEMPT = new Set(["a3-decal-shore-foam-edge-h-r2", "a3-decal-shore-foam-edge-v-r2", "a4-decal-lava-edge-h", "a4-decal-lava-edge-v"]);
// 가장자리 띠 그림의 불투명 몸통 (원본 px, 알파 ≥ 96 — 10-29 메이커 재캡처: 그림 두께의 절반만 띄우면 위·아래 투명 여백만큼 띠가 0.2칸 떠 보였다).
//   가로 그림 = [위, 아래) 줄 · 세로 그림 = [왼, 오른) 칸, 피벗은 가운데(0.5/0.5, resource-properties). 표에 없는 그림은 두께 전체를 몸통으로 친다
const EDGE_BODY = {
  "a3-decal-shore-foam-edge-h-r2": [24, 46], "a3-decal-shore-foam-edge-v-r2": [22, 47],
  "a4-decal-lava-edge-h": [16, 48], "a4-decal-lava-edge-v": [10, 45],
};

// ───────── 설계도 ─────────
function parseBlueprint(id) {
  const text = fs.readFileSync(path.join(HM_DIR, id + ".txt"), "utf8");
  const bp = { id, w: 0, h: 0, base: null, zones: {}, roads: {}, walls: {}, markers: new Set(), rows: [], floorMix: new Set() };
  for (const raw of text.split(/\r?\n/)) {
    if (raw.startsWith(";")) {
      const m = raw.slice(1).trim().split(/\s+/);
      if (m[0] === "size") { bp.w = Number(m[1]); bp.h = Number(m[2]); }
      else if (m[0] === "base") bp.base = { art: m[1], tint: m[2] };
      else if (m[0] === "zone") bp.zones[m[1]] = { art: m[2] === "-" ? null : m[2], tint: m[3] === "-" ? null : m[3], name: m.slice(4).join(" ") };
      else if (m[0] === "road") {
        // 이름 뒤 「wide=N」(선택): 길 그림이 N칸 폭 한 장(양쪽 난간이 든 다리 그림) — 세로로 N칸씩 묶어 N배 크기로 한 번만 그린다 (10-28 밤 심장의 다리 난간 겹침)
        const rest = m.slice(4), wide = Number((rest.find((t) => t.startsWith("wide=")) || "wide=1").slice(5)) || 1;
        bp.roads[m[1]] = { art: m[2], tint: m[3], name: rest.filter((t) => !t.startsWith("wide=")).join(" "), wide: Math.max(1, Math.min(3, Math.round(wide))) };
      }
      else if (m[0] === "wall") {
        // 이름 뒤 「top=<그림>[:r/g/b]」(선택): 바위 덩어리 속(바닥에 안 닿는 칸)을 가장자리(n) 대신 이 윗면 그림으로, 색은 따로 (10-28 코덱스 a2-sandstone-rock-top)
        const rest = m.slice(4), top = (rest.find((t) => t.startsWith("top=")) || "").slice(4).split(":");
        bp.walls[m[1]] = { atlas: m[2], tint: m[3], name: rest.filter((t) => !t.startsWith("top=")).join(" "), top: top[0] || "", topTint: top[1] || "" };
      }
      else if (m[0] === "raised") {
        // 이름 뒤 선택 칸 (10-28 저녁 설계 42 높이감·층 겹쌓기):
        //   tiers=1~3 앞면 띠 단 수 · top=zone 걷는 칸은 구역 바닥 그대로(가장자리만 9조각) · face=<묶음-borders> 앞면 조각(<이름>-s/sw/se)
        //   low=<그림>:<색> 낮은 칸 그림 · below=<그림>:<배율>:<밝기>:<안개색> 낮은 칸에 아래층을 작고 어둡게 (보스 층 내려다보기)
        //   back=<그림> 앞면 조각에 비치는 곳이 있으면 띠 뒤에 깔 바탕 (등대 벽 — 띠 사이로 바다가 보여 울타리처럼 읽혔다)
        //   edge=<가로 그림>:<세로 그림>[:<크기>[:<색>]] 높은 칸 ↔ 낮은 칸 경계를 따라 띠 그림 (10-28 밤 코덱스 용암 가장자리 띠 — 북·동·서는 절벽 윗단 바로 바깥, 남쪽은 앞면 띠 맨 아래)
        //   floor=zone (top=zone이 아닌 담 윗면 맵만) 담 속 칸(네 이웃이 모두 높은 칸)에 구역 바닥을 깐다 — 가장자리 9조각은 그대로 (10-29 바람 무덤 사막 「보루 안은 구역 바닥」)
        //   seam=<진하기>[:<높이>] (top=zone만) 앞면 첫 단 맨 위에 높이(칸, 기본 0.5) 안에서 위→아래로 옅어지는 그늘 — 밝은 테두리·바닥 밑에 어두운 앞면이
        //     직선으로 붙어 보이던 이음새를 턱 밑 그늘로 (10-29 사용자 결정 · 폭풍 등대만. 그림자 칸과 같은 검게 칠한 조각을 SEAM_STEPS줄로 나눠 깐다)
        //   mix=<조각,조각> (top=zone만) 그 조각(center = back 바탕 · n = 북쪽 테두리)을 칸 좌표로 정한 의사난수로 반쯤 좌우 뒤집어 반복 격자를 깬다
        //     — 빌드마다 같다. 뒤집은 칸은 따로 그린다(가로로 묶으면 묶음째 뒤집혀 자리가 어긋난다). n은 양옆이 같은 n인 칸만 (모서리 이음 그대로) (10-29 사용자 결정 · 폭풍 등대만)
        const rest = m.slice(3), opt = Object.fromEntries(rest.filter((t) => t.includes("=")).map((t) => t.split("=")));
        const lowO = (opt.low || "").split(":"), belowO = (opt.below || "").split(":"), edgeO = (opt.edge || "").split(":"), seamO = (opt.seam || "").split(":");
        bp.raised = {
          atlas: m[1], tint: m[2], name: rest.filter((t) => !t.includes("=")).join(" "),
          tiers: Math.max(1, Math.min(3, Number(opt.tiers || 1))), zoneTop: opt.top === "zone", face: opt.face || "", innerZone: opt.floor === "zone",
          low: opt.low ? { art: lowO[0], tint: lowO[1] || "1/1/1" } : null, back: opt.back || "",
          below: opt.below ? { art: belowO[0], scale: Number(belowO[1] || 0.55), bright: Number(belowO[2] || 0.42), fog: belowO[3] || "1/1/1" } : null,
          edge: opt.edge ? { h: edgeO[0], v: edgeO[1] || "", scale: Number(edgeO[2] || 1), tint: edgeO[3] || "" } : null,
          seam: opt.seam ? { a: Number(seamO[0] || 0.4), h: Number(seamO[1] || 0.5) } : null,
          mix: new Set((opt.mix || "").split(",").filter(Boolean)),
        };
      }
      else if (m[0] === "shore") bp.shore = { sea: new Set(m[1].split("+")), foam: m[2], scale: Number(m[3] || 1), tint: m[4] && m[4] !== "-" ? m[4] : "", foamV: m[5] || "" };
      else if (m[0] === "markers") for (const ch of m.slice(1)) bp.markers.add(ch);
      else if (m[0] === "backdrop") bp.backdrop = m[1];
      else if (m[0] === "floormix") for (const a of (m[1] || "").split(",").filter(Boolean)) bp.floorMix.add(a);
      else if (m[0] === "v5") bp.v5 = true;   // 맵 구성 v5 (compose.cjs 설계서 v5) — 아래 artEntities: 길 안내·흩뿌림 정책 없음 · 역할표 기준 크기
      continue;
    }
    if (raw.trim() === "") continue;
    bp.rows.push(raw);
  }
  if (!bp.w || !bp.h) throw new Error(`${id}.txt: ;size 지시문이 없음`);
  if (bp.rows.length !== bp.h) throw new Error(`${id}.txt: 격자 ${bp.rows.length}줄 — ;size 세로 ${bp.h}줄이어야 함`);
  bp.rows.forEach((row, r) => { if (row.length !== bp.w) throw new Error(`${id}.txt: ${r + 1}번째 줄 ${row.length}글자 — ;size 가로 ${bp.w}글자여야 함`); });
  for (const row of bp.rows) for (const ch of row) {
    if (!(ch in bp.zones) && !(ch in bp.roads) && !(ch in bp.walls) && !bp.markers.has(ch)) throw new Error(`${id}.txt: 알 수 없는 글자 '${ch}'`);
  }
  // 칸 (x, y) ↔ 격자 (c, r): x = c - w/2, y = h/2 - r (maps.cjs edges · layout.cjs bounds와 같은 기준)
  bp.bounds = { x0: -bp.w / 2, x1: bp.w / 2 - 1, y0: -bp.h / 2 + 1, y1: bp.h / 2 };
  bp.at = (x, y) => {
    const c = x + bp.w / 2, r = bp.h / 2 - y;
    if (c < 0 || c >= bp.w || r < 0 || r >= bp.h) return null;
    return bp.rows[r][c];
  };
  bp.isWall = (x, y) => { const ch = bp.at(x, y); return ch === null || ch in bp.walls; };
  bp.isFloor = (x, y) => !bp.isWall(x, y);
  bp.isRoad = (x, y) => { const ch = bp.at(x, y); return ch !== null && ch in bp.roads; };
  bp.cells = () => { const out = []; for (let y = bp.bounds.y1; y >= bp.bounds.y0; y--) for (let x = bp.bounds.x0; x <= bp.bounds.x1; x++) out.push([x, y]); return out; };
  // 길·표식 칸의 구역: 가장 가까운 구역 글자 (벽을 넘지 않고 퍼뜨린다)
  const zone = new Map();
  const q = [];
  for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (ch in bp.zones) { zone.set(key(x, y), ch); q.push([x, y]); } }
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i], z = zone.get(key(x, y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!bp.isFloor(nx, ny) || zone.has(key(nx, ny))) continue;
      zone.set(key(nx, ny), z); q.push([nx, ny]);
    }
  }
  bp.zoneOf = (x, y) => zone.get(key(x, y)) || null;
  return bp;
}

function loadRows(id) { return fs.existsSync(path.join(HM_DIR, id + ".csv")) ? load("handmade/" + id) : []; }
const hasBlueprint = (id) => fs.existsSync(path.join(HM_DIR, id + ".txt"));
// 설계도 표식 칸 → 엔티티 자리 (칸 가운데). 포털(W·E·G·X)·입구(H)를 maps.cjs가 이것으로 놓는다
const markerCache = new Map();
function markers(id) {
  if (!markerCache.has(id)) {
    const bp = parseBlueprint(id), out = {};
    for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (bp.markers.has(ch)) (out[ch] = out[ch] || []).push([x + 0.5, y + 0.5]); }
    markerCache.set(id, { list: out, w: bp.w, h: bp.h });
  }
  return markerCache.get(id);
}
// 포털 앞 도착 자리: 표식에서 가장 가까운 맵 가장자리의 안쪽으로 1.4칸
function inward(id, p) {
  const { w, h } = markers(id);
  const dl = p[0] + w / 2, dr = w / 2 - p[0], db = p[1] + h / 2, dt = h / 2 - p[1];
  const m = Math.min(dl, dr, db, dt);
  if (m > 6) return [p[0], p[1] - 1.4];
  return m === dl ? [p[0] + 1.4, p[1]] : m === dr ? [p[0] - 1.4, p[1]] : m === db ? [p[0], p[1] + 1.4] : [p[0], p[1] - 1.4];
}
function parseArgs(text) { return Object.fromEntries((text || "").split(";").filter(Boolean).map((kv) => { const [k, v] = kv.split("="); return [k.trim(), (v || "").trim()]; })); }

// ───────── 그림 표 ─────────
function spriteTable(ctx) {
  const table = Object.assign({}, ctx.sprites);
  for (const m of load("handmade/maple_sprites")) table[m.name] = Object.assign({ kind: "maple" }, m);
  return table;
}
function spriteOf(table, name, where) {
  const sp = table[name];
  if (!sp) throw new Error(`${where}: 그림 '${name}'이 art_sprites.csv·maple_sprites.csv에 없음`);
  return sp;
}
function baseScale(sp, propScale) {
  if (sp.kind === "maple") return num(sp.scale, 1);
  return (sp.kind === "prop-1x" ? 1 : 0.8) * (propScale[sp.name] || 1);
}
// 장식 발밑 칸: 그림 가로의 60% · 발밑 한 줄 (maps.cjs propFootprint과 같다)
function footprint(x, y, wPx, scale) {
  const hw = (num(wPx, 128) * scale / 100) * 0.3;
  const cy = Math.floor(y), out = [];
  for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw - 1e-6); cx++) {
    const cover = Math.min(x + hw, cx + 1) - Math.max(x - hw, cx);
    if (cover >= 0.35 || cx === Math.floor(x)) out.push(key(cx, cy));
  }
  return out;
}

// ───────── 기능 엔티티 (포털·화로·웨이포인트) — maps.cjs desiredEntities와 같은 꼴 {name, model, pos, overrides} ─────────
const edgesOf = (d) => { const w = num(d.w), h = num(d.h); return { left: -(w / 2) + 1, right: w / 2 - 1, bottom: -(h / 2) + 1, top: h / 2 }; };
function functionalEntities(d, maps, ctx, rows) {
  rows = rows || loadRows(d.id);
  const out = [];
  let torch = 0;
  for (const r of rows) {
    const x = num(r.x), y = num(r.y);
    if (r.kind === "gate") {
      const a = parseArgs(r.args);
      const target = maps.find((m) => m.id === a.target);
      if (!target) throw new Error(`${d.id}.csv ${r.name}: target '${a.target}'이 maps.csv에 없음`);
      const e = edgesOf(target);
      const at = a.arrive === "town" ? [ctx.townArrival.x, ctx.townArrival.y] : a.arrive === "right" ? [e.right - 1.4, 0] : [e.left + 1.4, 0];
      out.push({ name: r.name, model: "Objects/WarpGate", pos: [x, y, 0], overrides: { "script.WarpGate": { TargetMap: target.id, TargetPos: { x: at[0], y: at[1] }, Label: target.name } } });
    } else if (r.kind === "torch") {
      out.push({ name: `Torch${++torch}`, model: "Objects/Brazier", pos: [x, y, 0] });
    } else if (r.kind === "waypoint") {
      out.push({ name: "Waypoint", model: "Objects/Waypoint", pos: [x, y, 0], overrides: { "script.Waypoint": { WaypointId: r.name } } });
    }
  }
  return out;
}

// ───────── 그림 엔티티 ─────────
function artEntities(d, ctx, bp, rows, func, opts = {}) {
  // 10-31 C: 정책 맵(FULL)은 ① 흩뿌림·세트 줄이기 → ② 막는 장식만 먼저 놓아 길 경로를 재고 → ③ 길 안 흩뿌림을 비운 뒤 다시 짓는다
  // 맵 구성 v5 (;v5): 정책 맵이어도 「collide」 갈래만 — 충돌 분류·타일 계층·이음새는 그대로, 흩뿌림 줄이기·길 경로·길 안내 도장·출구 표식은 없다 (길 = 구역 경계의 빈 띠)
  const v5 = !!bp.v5;
  const mode = v5 ? "collide" : decor.modeOf(d.id);
  decor.setMap(d.id, v5);   // 바닥 색 상한 (v3 0.80 · v4 1 — 길 안내 v4는 액트 타일이라 바닥을 낮추지 않는다)
  if (mode === "full" && !opts.inner) {
    const planned = decor.planRows(d, rows);
    const pre = artEntities(d, ctx, bp, planned.rows.filter((r) => !r.scatter && r.kind !== "decal"), func, { inner: true, pre: true });
    const route = decor.routes(d, bp, pre.blocked, func);
    const fin = decor.finalizeRows(d, planned, route);
    const art = artEntities(d, ctx, bp, fin.rows, func, { inner: true, route });
    art.policy = Object.assign({}, planned.stats, { cleared: fin.cleared, rows: fin.rows });
    return art;
  }
  const classes = mode ? tileClasses.classesOf(d.id) : null;
  if (mode && !classes) throw new Error(`${d.id}: data/handmade/tile_classes.csv에 이 맵 줄이 없음 — node tools/build/handmade/tile_classes.cjs`);
  // 바닥 색 (정책 맵은 길 안내가 밝아질 여유를 남기려고 FLOOR_TINT_CAP까지 · 세 채널 같은 비율)
  const floorTint = (t) => (mode && t ? decor.capTint(t).join("/") : t);
  const funcCells = new Set(func.map((e) => key(Math.floor(e.pos[0]), Math.floor(e.pos[1]))));
  const table = spriteTable(ctx);
  const ruid = (name, where) => spriteOf(table, name, where).ruid;
  const out = [], warn = [], blocked = new Set(), feet = [], sizeWarn = new Map();
  const b = bp.bounds, w = bp.w, h = bp.h;
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2 + 1, y1 = h / 2 + 1;
  const funcSpots = func.map((e) => e.pos);
  const nearFunc = (x, y) => funcSpots.some(([fx, fy]) => Math.abs(fx - x) < NEAR_FUNC[0] && Math.abs(fy - y) < NEAR_FUNC[1]);
  const sprite = (rid, size, order) => ({
    "MOD.Core.SpriteRendererComponent": Object.assign({ SpriteRUID: rid, SortingLayer: "MapLayer0", OrderInLayer: order },
      size ? { DrawMode: 2, TiledSize: { x: r3(size[0]), y: r3(size[1]) } } : { DrawMode: 0 }),
  });
  // 중심 (cx, cy) · 크기 (rw, rh) 월드 사각형을 반복 그리기로 덮는다 (maps.cjs tiled와 같다)
  const tiled = (name, rid, cx, cy, rw, rh, z, tint) => {
    const o = sprite(rid, [rw / S, rh / S], 1);
    if (tint) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(tint);
    return { name, pos: [r3(cx - rw / 2 + S / 2), r3(cy - rh / 2 + S / 2), z], overrides: o };
  };
  // 1) 바탕 바닥 — 맵 전체. 담 윗면 맵의 low=·below=는 낮은 칸이 보이는 바탕을 그 그림으로 (걷는 칸은 구역 바닥이 덮는다)
  const RZ = bp.raised || {};
  if (RZ.below) {
    // 아래층 내려다보기: 아래층 바닥을 작게(배율) · 어둡게(밝기) · 안개색으로 — 칸 크기가 작아 멀리 아래로 보인다
    const tile = S * RZ.below.scale, ft = tintOf(RZ.below.fog), k = RZ.below.bright;
    const o = sprite(ruid(RZ.below.art, "raised below"), [w / tile, h / tile], 1);
    o["MOD.Core.SpriteRendererComponent"].Color = { r: r3(ft.r * k), g: r3(ft.g * k), b: r3(ft.b * k), a: 1 };
    o["MOD.Core.TransformComponent"] = { Scale: vec3(RZ.below.scale) };
    out.push({ name: "ArtFloor", pos: [r3(x0 + tile / 2), r3(y0 + tile / 2), 0], overrides: o });
  } else if (RZ.low) out.push(tiled("ArtFloor", ruid(RZ.low.art, "raised low"), (x0 + x1) / 2, (y0 + y1) / 2, w, h, 0, RZ.low.tint));
  else out.push(tiled("ArtFloor", ruid(bp.base.art, "base"), (x0 + x1) / 2, (y0 + y1) / 2, w, h, 0, floorTint(bp.base.tint)));
  // 같은 열쇠 칸을 큰 사각형으로 묶는다 (위 왼쪽부터 오른쪽으로 늘리고, 그 폭 그대로 아래로 늘릴 수 있는 만큼)
  //   (10-28 엔티티 예산: 시안 1장 벽 529개 — 큰 맵 66장 × 난이도 3본이라 벽 엔티티를 줄여야 한다)
  const mergeRects = (pk) => {
    const rects = [], done = new Set();
    for (let y = b.y1; y >= b.y0; y--) for (let x = b.x0; x <= b.x1; x++) {
      const p = pk.get(key(x, y));
      if (!p || done.has(key(x, y))) continue;
      let xe = x;
      while (pk.get(key(xe + 1, y)) === p && !done.has(key(xe + 1, y))) xe++;
      let yb = y;
      const rowOk = (yy) => { for (let xx = x; xx <= xe; xx++) if (pk.get(key(xx, yy)) !== p || done.has(key(xx, yy))) return false; return true; };
      while (rowOk(yb - 1)) yb--;
      for (let yy = yb; yy <= y; yy++) for (let xx = x; xx <= xe; xx++) done.add(key(xx, yy));
      rects.push({ p, x, y: yb, len: xe - x + 1, rows: y - yb + 1 });
    }
    return rects;
  };
  const cellScale = { "MOD.Core.TransformComponent": { Scale: vec3(1 / S) } };
  // 9조각 고르기: open(x, y)가 참인 이웃 쪽이 가장자리 (벽 칸이면 바닥 쪽, 담 윗면 칸이면 낮은 모래 쪽)
  // 10-28 2차 검수: 바위(waste) 묶음의 center 조각은 그림 자체가 검은 공간이라, 얇은 벽(양쪽 바닥)·튀어나온 끝을 center로 그리면
  //   밝기를 올려도 검은 막대였다 → 얇은 벽은 가장자리 조각(가로는 n · 세로는 w), 세 면이 바닥인 끝은 붙은 쪽 반대 조각으로
  const pieceBy = (open) => (x, y) => {
    const n = open(x, y + 1), s = open(x, y - 1), e = open(x + 1, y), ww = open(x - 1, y);
    const cnt = n + s + e + ww;
    if (cnt === 4) return "n";
    if (cnt === 3) return !n ? "s" : !s ? "n" : !e ? "w" : "e";
    if (n && s) return "n";
    if (e && ww) return "w";
    if (n) return e ? "ne" : ww ? "nw" : "n";
    if (s) return e ? "se" : ww ? "sw" : "s";
    if (e) return "e";
    if (ww) return "w";
    return "center";
  };
  // 띠 그림 깔기 (물가 거품 · 용암 가장자리): 가로 변 runs [[선 y, xa, xb]] · 세로 변 runs [[선 x, ya, yb]]를 step 간격으로 이어 깐다. 짧은 구간은 작게 하나.
  //   세로 그림(vName)이 있으면 돌리지 않고 세로 그림을 잇고, 없으면 작은 가로 조각을 0.55칸마다 좌우로 엇갈려 쌓는다 (90도 돌리면 번개·금처럼 보였다)
  //   fit(가장자리 띠 edge= 전용, 10-29 메이커 번개 절벽): 조각이 구간 끝을 넘지 않게 — 구간보다 긴 그림 한 장은 길이 방향으로만 줄이고,
  //   여러 장이면 첫·끝 조각의 끝을 구간 끝에 맞춘다. 계단 모서리마다 가로·세로 조각이 서로 넘어가 바다 한가운데 흰 「+」가 떴다
  let foamN = 0;
  const layRuns = (tag, hRuns, vRuns, hName, vName, scaleMul, tint, zz, fit) => {
    const fsp = spriteOf(table, hName, `${d.id} ${tag}`);
    const fsc = baseScale(fsp, ctx.propScale) * scaleMul;
    const flen = (num(fsp.w, 256) * fsc) / 100, step = flen * 0.72;
    const one = (rid, x, y, scale, flipKey) => {
      const o = sprite(rid, null, 1);
      o["MOD.Core.SpriteRendererComponent"][flipKey] = foamN % 2 === 1;
      if (tint) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(tint);
      o["MOD.Core.TransformComponent"] = { Scale: vec3(scale) };
      out.push({ name: `Art${tag}${++foamN}`, pos: [r3(x), r3(y), zz], overrides: o });
    };
    // 구간 [a, bEnd+1] 안에 len 길이 조각을 끝이 넘지 않게: 짧으면 한 장을 길이만 줄이고, 길면 양 끝에 맞춰 step 간격 이하로
    const fitRun = (a, n, len, stepLen, put) => {
      if (n <= len) { put(a + n / 2, n / len); return; }
      const cnt = Math.ceil((n - len) / stepLen) + 1;
      for (let k = 0; k < cnt; k++) put(a + len / 2 + ((n - len) * k) / (cnt - 1), 1);
    };
    for (const [line, a, bEnd] of hRuns) {
      const n = bEnd - a + 1;
      if (fit) { fitRun(a, n, flen, step, (c, k) => one(fsp.ruid, c, line, [fsc * k, fsc], "FlipX")); continue; }
      if (n < flen * 0.5) { one(fsp.ruid, (a + bEnd + 1) / 2, line, fsc * Math.max(0.45, n / flen), "FlipX"); continue; }
      const cnt = Math.max(1, Math.round(n / step));
      for (let k = 0; k < cnt; k++) one(fsp.ruid, a + (n * (k + 0.5)) / cnt, line, fsc, "FlipX");
    }
    if (vName) {
      const vsp = spriteOf(table, vName, `${d.id} 세로 ${tag}`);
      const vsc = baseScale(vsp, ctx.propScale) * scaleMul, vlen = (num(vsp.h, 256) * vsc) / 100;
      for (const [line, a, bEnd] of vRuns) {
        const n = bEnd - a + 1;
        if (fit) { fitRun(a, n, vlen, vlen * 0.72, (c, k) => one(vsp.ruid, line, c, [vsc, vsc * k], "FlipY")); continue; }
        if (n < vlen * 0.5) { one(vsp.ruid, line, (a + bEnd + 1) / 2, vsc * Math.max(0.45, n / vlen), "FlipY"); continue; }
        const cnt = Math.max(1, Math.round(n / (vlen * 0.72)));
        for (let k = 0; k < cnt; k++) one(vsp.ruid, line, a + (n * (k + 0.5)) / cnt, vsc, "FlipY");
      }
    } else for (const [line, a, bEnd] of vRuns) {
      const n = bEnd - a + 1, cnt = Math.max(1, Math.round(n / 0.55));
      for (let k = 0; k < cnt; k++) one(fsp.ruid, line + (k % 2 ? 0.12 : -0.12), a + (n * (k + 0.5)) / cnt, fsc * 0.42, "FlipX");
    }
  };
  // 2-1) 담 윗면 맵: 걷는 칸(+ 담 위 기둥 칸)을 담 9조각으로, 낮은 칸(첫 벽 글자)은 바탕 모래 그대로 + 담 앞면·그림자
  const lowCh = bp.raised ? Object.keys(bp.walls)[0] : null;
  const isLow = (x, y) => { const ch = bp.at(x, y); return ch === null || ch === lowCh; };
  let raisedN = 0;
  if (bp.raised && bp.raised.zoneTop) {
    // 10-28 저녁 설계 42 — 걷는 칸은 구역 바닥 그대로, 낮은 칸과 맞닿은 북·동·서 가장자리만 9조각(절벽 윗단),
    //   남쪽은 낮은 칸에 앞면 띠를 tiers단 쌓는다 (아래 단일수록 어둡게) + 마지막 단 아래 그림자. 층이 높을수록 아래가 깊어 보인다
    const A = bp.raised.atlas, T = bp.raised.tiers, F = bp.raised.face || `${A}-borders`;
    const rp = pieceBy(isLow), pk = new Map(), backK = new Map();
    // 끊긴 담 끝 (10-29 감사 「바로 고칠 것」 5): 담 위(2-1 아래 갈래)와 같은 판정 — 한 칸 너비 가로 담길이 끝나는 칸(위·아래가 낮음)의 e·w 가장자리.
    //   그 묶음에 <묶음>-broken-e/w 그림이 있을 때만 (해안 바위·성채처럼 없는 묶음은 예전 그대로 가장자리 조각)
    const brokenTop = !!table[`${A}-broken-e`] && !!table[`${A}-broken-w`];
    const distUp = (x, y) => {   // 낮은 칸에서 북쪽으로 몇 칸 위에 높은 칸이 있는가 (사이가 모두 낮은 칸일 때만)
      for (let k = 1; k <= T + 1; k++) { if (bp.at(x, y + k) === null) return 0; if (!isLow(x, y + k)) return k; }
      return 0;
    };
    // 낮은 칸 기둥(높은 칸 바로 아래부터 이어진 낮은 칸 수 n)이 좁으면 띠를 n-1단까지만 — 다 채우면 구덩이가 아니라 솟은 바위로 보였다 (메이커 10-28)
    const runDown = (x, y) => { let n = 0; while (n <= T + 1 && isLow(x, y - n) && bp.at(x, y - n) !== null) n++; return n; };
    const bandsAt = (x, y, d) => Math.min(T, runDown(x, y + d - 1) - 1);
    const isBand = (x, y) => { if (!isLow(x, y) || bp.at(x, y) === null) return false; const d = distUp(x, y); return d >= 1 && d <= bandsAt(x, y, d); };
    const RIM = { s: null, se: "e", sw: "w", center: null };
    let cut = 0;
    for (const [x, y] of bp.cells()) {
      if (isLow(x, y)) {
        const d = distUp(x, y);
        if (d < 1) continue;
        const nb = bandsAt(x, y, d);
        if (d === 1 && nb < T) cut++;   // 띠를 다 못 쌓은 기둥
        if (d <= nb) {
          pk.set(key(x, y), `band|${!isBand(x - 1, y) ? "sw" : !isBand(x + 1, y) ? "se" : "s"}|${d}`);
          if (bp.raised.back) backK.set(key(x, y), String(d));
        }
        else if (d === nb + 1) pk.set(key(x, y), "shadow||0");
        continue;
      }
      const piece = rp(x, y);
      let rim = piece in RIM ? RIM[piece] : piece;
      if (brokenTop && (piece === "e" || piece === "w") && isLow(x, y + 1) && isLow(x, y - 1)) rim = `broken-${piece}`;
      if (rim) pk.set(key(x, y), `rim|${rim}|0`);
    }
    if (cut) warn.push(`${d.id}: 높은 칸 아래 낮은 칸이 ${T + 1}칸보다 좁아 앞면 띠를 다 못 쌓은 기둥 ${cut}개 (낮은 칸 한 줄은 남긴다 · 오류 아님)`);
    // mix=: 뒤집을 칸은 열쇠 끝에 「|f<x>」를 붙인다 — 같은 열(x)끼리만 세로로 묶이고 가로로는 묶이지 않는다
    const MIX = bp.raised.mix || new Set();
    if (MIX.size) {
      const orig = new Map(pk);
      for (const [k, v] of orig) {
        const [kind, piece] = v.split("|");
        if (kind !== "rim" || !MIX.has(piece)) continue;
        const [x, y] = k.split(",").map(Number);
        if (orig.get(key(x - 1, y)) !== v || orig.get(key(x + 1, y)) !== v || !flipAt(x, y)) continue;
        pk.set(k, `${v}|f${x}`);
      }
      if (MIX.has("center")) for (const [k, v] of [...backK]) { const [x, y] = k.split(",").map(Number); if (flipAt(x, y)) backK.set(k, `${v}|f${x}`); }
    }
    const t = tintOf(bp.raised.tint);
    for (const r of mergeRects(pk)) {
      const [kind, piece, dd, fl] = r.p.split("|");
      // 앞면 끝 조각(sw·se)이 아직 없는 묶음은 가운데(s)로 잇는다 (10-29 코덱스 등대 앞면 샘플은 face-s 한 장 — 끝 조각은 전체 납품 대기)
      const band = (p) => (table[`${F}-${p}`] ? `${F}-${p}` : `${F}-s`);
      const name = kind === "shadow" ? "waste-borders-center" : kind === "band" ? band(piece) : piece.startsWith("broken-") ? `${A}-${piece}` : `${A}-borders-${piece}`;
      const o = sprite(ruid(name, "raised"), [r.len, r.rows], 1);
      const m = kind === "band" ? TIER_SHADE[Number(dd) - 1] : 1;
      o["MOD.Core.SpriteRendererComponent"].Color = kind === "shadow" ? { r: 0, g: 0, b: 0, a: TIER_SHADOW } : { r: r3(t.r * m), g: r3(t.g * m), b: r3(t.b * m), a: 1 };
      if (fl) o["MOD.Core.SpriteRendererComponent"].FlipX = true;
      out.push({ name: `ArtRaised${++raisedN}`, pos: [r.x + 0.5, r.y + 0.5, -0.007], overrides: Object.assign(o, cellScale) });
    }
    for (const r of mergeRects(backK)) {
      const [dd, fl] = r.p.split("|");
      const o = sprite(ruid(bp.raised.back, "raised back"), [r.len, r.rows], 1), m = TIER_SHADE[Number(dd) - 1] * 0.55;
      o["MOD.Core.SpriteRendererComponent"].Color = { r: r3(t.r * m), g: r3(t.g * m), b: r3(t.b * m), a: 1 };
      if (fl) o["MOD.Core.SpriteRendererComponent"].FlipX = true;
      out.push({ name: `ArtRaised${++raisedN}`, pos: [r.x + 0.5, r.y + 0.5, -0.006], overrides: Object.assign(o, cellScale) });
    }
    // seam=: 앞면 첫 단(높은 칸 바로 아래 띠) 맨 위 seam.h칸에 위→아래로 옅어지는 그늘 — 띠보다 앞(z −0.0075), 줄마다 진하기 a × (1 − k/SEAM_STEPS)
    if (bp.raised.seam) {
      const SM = bp.raised.seam, hs = SM.h / SEAM_STEPS, sk = new Map();
      for (const [k, v] of pk) if (v.startsWith("band|") && v.split("|")[2] === "1") sk.set(k, "seam");
      for (const r of mergeRects(sk)) for (let k = 0; k < SEAM_STEPS; k++) {
        const o = sprite(ruid("waste-borders-center", "raised seam"), [r.len, 1], 1);
        o["MOD.Core.SpriteRendererComponent"].Color = { r: 0, g: 0, b: 0, a: r3(SM.a * (1 - k / SEAM_STEPS)) };
        o["MOD.Core.TransformComponent"] = { Scale: vec3([1 / S, hs / S]) };
        out.push({ name: `ArtRaised${++raisedN}`, pos: [r.x + 0.5, r3(r.y + r.rows - hs * (k + 0.5)), -0.0075], overrides: o });
      }
    }
    // 2-2) 가장자리 띠 (edge=): 높은 칸 ↔ 낮은 칸 경계. 북·동·서는 절벽 윗단 바로 바깥, 남쪽은 앞면 띠 맨 아래 바로 아래.
    //   10-29 메이커 재캡처: 띠 안쪽 끝(그림의 불투명 몸통 EDGE_BODY)이 경계에 정확히 닿게 변마다 띄우는 거리를 따로 잰다
    //   (북 = 몸통 아래 끝 · 남 = 몸통 위 끝 · 동 = 몸통 왼 끝 · 서 = 몸통 오른 끝까지 그림 가운데에서 잰 거리).
    //   좁은 물 틈: 1칸 폭 틈은 양쪽 띠가 겹쳐 H·U 모양이 떴다 → 건너편 절벽까지 물이 1칸이면 긋지 않고, 2칸이면 한 줄만(남·동 쪽으로 긋는 변),
    //   변이 2칸 이하 좁은 물길의 막다른 끝이면 긋지 않는다
    if (bp.raised.edge) {
      const EG = bp.raised.edge, hM = new Map(), vM = new Map();
      const inset = (name, dim) => {   // [몸통 시작, 몸통 끝, 그림 가운데]을 월드 칸으로
        const sp = spriteOf(table, name, `${d.id} edge`), s = (baseScale(sp, ctx.propScale) * EG.scale) / 100, size = num(sp[dim], 64);
        const body = EDGE_BODY[name] || [0, size];
        return { a: body[0] * s, b: body[1] * s, mid: (size / 2) * s };
      };
      const ih = inset(EG.h, "h"), iv = EG.v ? inset(EG.v, "w") : ih;
      const OFF_N = r3(ih.b - ih.mid), OFF_S = r3(ih.mid - ih.a), OFF_E = r3(iv.mid - iv.a), OFF_W = r3(iv.b - iv.mid);
      const lowIn = (x, y) => isLow(x, y) && bp.at(x, y) !== null;   // 맵 밖은 경계로 치지 않는다
      const solidAt = (x, y) => bp.at(x, y) !== null && (!isLow(x, y) || isBand(x, y));   // 높은 칸 또는 앞면 띠(절벽 면)
      const span = (x, y, dx, dy) => {   // (x, y)부터 (dx, dy)로 이어진 물 칸 수 (3에서 멈춘다 · 맵 밖으로 열려 있으면 3)
        for (let k = 0; k < 3; k++) { const cx = x + dx * k, cy = y + dy * k; if (bp.at(cx, cy) === null) return 3; if (solidAt(cx, cy)) return k; }
        return 3;
      };
      // 물 칸 (wx, wy)로 (nx, ny) 방향 변을 그을지
      const open = (wx, wy, nx, ny) => {
        const k = span(wx, wy, nx, ny);
        if (k <= 1) return false;
        const l1 = span(wx, wy, ny, nx), l2 = span(wx, wy, -ny, -nx);
        if (l1 < 3 && l2 < 3 && l1 + l2 - 1 <= 2) return false;
        return k >= 3 || ny === -1 || nx === 1;
      };
      let narrowN = 0;
      const run = (map, line, t) => {   // 같은 선 위에서 이어진 구간으로 묶는다 (t는 선마다 오름차순으로 들어온다)
        const list = map.get(line) || [], last = list[list.length - 1];
        if (last && last[1] === t - 1) last[1] = t; else list.push([t, t]);
        map.set(line, list);
      };
      for (let y = b.y1; y >= b.y0; y--) for (let x = b.x0; x <= b.x1; x++) {   // 가로 변: 줄마다 x로 잇는다
        if (isLow(x, y)) continue;
        // 낮은 이웃이 다른 높은 칸의 앞면 띠면 물이 아니라 절벽 면 — 띠를 긋지 않는다 (10-29 계단 능선에서 앞면을 가로지르는 세로 줄이 떴다)
        if (lowIn(x, y + 1) && !isBand(x, y + 1)) { if (open(x, y + 1, 0, 1)) run(hM, r3(y + 1 + OFF_N), x); else narrowN++; }
        if (lowIn(x, y - 1)) {
          const nb = bandsAt(x, y - 1, 1);
          if (open(x, y - 1 - nb, 0, -1)) run(hM, r3(y - nb - OFF_S), x); else narrowN++;
        }
      }
      for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) {   // 세로 변: 칸 줄마다 y로 잇는다
        if (isLow(x, y)) continue;
        if (lowIn(x + 1, y) && !isBand(x + 1, y)) { if (open(x + 1, y, 1, 0)) run(vM, r3(x + 1 + OFF_E), y); else narrowN++; }
        if (lowIn(x - 1, y) && !isBand(x - 1, y)) { if (open(x - 1, y, -1, 0)) run(vM, r3(x - OFF_W), y); else narrowN++; }
      }
      if (narrowN) warn.push(`${d.id}: 좁은 물 틈이라 가장자리 띠를 뺀 변 ${narrowN}칸 (오류 아님)`);
      const flat = (map) => [...map.entries()].flatMap(([line, list]) => list.map(([a, bEnd]) => [line, a, bEnd]));
      layRuns("Edge", flat(hM), flat(vM), EG.h, EG.v, EG.scale, EG.tint, -0.012, true);
    }
  } else if (bp.raised) {
    const rp = pieceBy(isLow), pk = new Map();
    // 10-28 코덱스 담 위 추가 6장: 앞면 3조각(sw·s·se) · 끊긴 담 끝(e·w)이 있는 묶음이면 그 그림을, 없으면 예전처럼 center를 어둡게
    const has = (n) => !!table[n];
    const A = bp.raised.atlas;
    const faceArt = has(`${A}-face-s`) && has(`${A}-face-sw`) && has(`${A}-face-se`);
    const brokenArt = has(`${A}-broken-e`) && has(`${A}-broken-w`);
    const isFace = (x, y) => isLow(x, y) && bp.at(x, y) !== null && !isLow(x, y + 1);
    for (const [x, y] of bp.cells()) {
      if (isLow(x, y)) {
        // 바로 위(북쪽)가 담이면 앞면(왼끝·가운데·오른끝), 두 칸 위가 담이고 바로 위가 앞면이면 그림자
        if (!isLow(x, y + 1)) pk.set(key(x, y), !faceArt ? "face" : !isFace(x - 1, y) ? "face-sw" : !isFace(x + 1, y) ? "face-se" : "face-s");
        else if (isLow(x, y + 1) && bp.at(x, y + 1) !== null && !isLow(x, y + 2)) pk.set(key(x, y), "shadow");
        continue;
      }
      let piece = rp(x, y);
      // 한 칸 너비 담길이 가로로 끝나는 칸(위·아래·한쪽이 낮음) = 무너진 담 끝
      if (brokenArt && (piece === "e" || piece === "w") && isLow(x, y + 1) && isLow(x, y - 1)) piece = `broken-${piece}`;
      pk.set(key(x, y), piece);
    }
    const t = tintOf(bp.raised.tint);
    for (const r of mergeRects(pk)) {
      const face = r.p === "face", shadow = r.p === "shadow";
      const own = r.p.startsWith("face-") || r.p.startsWith("broken-");
      const name = shadow ? "waste-borders-center" : own ? `${A}-${r.p}` : `${A}-borders-${face ? "center" : r.p}`;
      const o = sprite(ruid(name, "raised"), [r.len, r.rows], 1);
      const m = face ? RAISED_FACE : 1;
      o["MOD.Core.SpriteRendererComponent"].Color = shadow ? { r: 0, g: 0, b: 0, a: RAISED_SHADOW } : { r: t.r * m, g: t.g * m, b: t.b * m, a: 1 };
      out.push({ name: `ArtRaised${++raisedN}`, pos: [r.x + 0.5, r.y + 0.5, -0.005], overrides: Object.assign(o, cellScale) });
    }
  }
  // 2) 구역 바닥 — 같은 구역 칸을 줄 단위 사각형으로 묶어(위에서부터, 아래로 늘릴 수 있는 만큼) 반복 그리기 (담 윗면 맵은 담이 덮으므로 그리지 않는다)
  const zoneDraw = (ch, z0) => {
    // top=zone 담 윗면 맵은 바탕(low·below)이 낮은 칸 그림이라, 바탕 바닥 구역(.)도 걷는 칸에 따로 깐다
    //   ;floormix가 바탕 그림을 섞는 맵(담 윗면 아님)도 바탕 구역(.) 칸을 따로 깐다 — 맵 전체 ArtFloor(벽 밑까지)는 그대로 두고 걷는 칸만 섞은 그림으로 덮는다
    const baseMix = !z0.art && !bp.raised && bp.floorMix.has(bp.base.art);
    const z = !z0.art && ((bp.raised && bp.raised.zoneTop) || baseMix) ? { art: bp.base.art, tint: bp.base.tint } : z0;
    const inner = !!(bp.raised && !bp.raised.zoneTop && bp.raised.innerZone);
    const skip = !z.art || (bp.raised && !bp.raised.zoneTop && !inner);
    const deep = (x, y) => !inner || (!isLow(x + 1, y) && !isLow(x - 1, y) && !isLow(x, y + 1) && !isLow(x, y - 1));
    return { z, skip, deep };
  };
  // ;floormix — 그 바닥 그림은 맵 전체에 하나로 정한 그림 격자(맵 왼쪽·아래 끝부터 1.28칸)에 맞춰 깐다 (10-29).
  //   어느 사각형에서나 같은 열(줄)은 같은 뒤집기·같은 무늬 자리 → 구역 사각형 경계에서도 무늬가 이어진다
  //   (사각형마다 첫 장부터 깔던 옛 방식은 이웃 사각형과 무늬 자리가 어긋나 곧은 금이 갔다 — 메이커 집게 동굴 x=-16, 시뮬레이션 칸 경계의 6~24%).
  //   이음 없는 타일은 뒤집기 조합이 어떻든 그림 경계에서 이어진다 (좌우·상하 끝 줄이 같은 그림 — 원본 PNG로 잼).
  //   엔진은 반복 그리기 사각형을 첫 장(왼쪽·아래)부터 깔고 모자란 장은 오른쪽·위 끝에 잘라 두며, 뒤집으면 첫 장 가운데를 축으로 통째로 거울처럼 뒤집는다
  //   (10-29 메이커 폭풍의 눈: k장 묶음을 뒤집자 k−1장 밀려 구멍) → 안 뒤집은 열은 그림 경계에서 시작해야 하고, 뒤집은 열은 그림 경계에서 끝나야 한다.
  //   그래서 사각형이 열 중간에서 시작하면(왼쪽이 잘림) 그 열은 뒤집거나, 안 뒤집으면 그림 경계까지 왼쪽 이웃 칸을 덮어야 한다 — 이웃이 같은 그림 칸이면 같은 무늬가 겹칠 뿐.
  //   이웃이 벽·다른 그림·낮은 칸이라 덮을 수 없는 자리가 있는 열은 뒤집기를 그쪽에 맞춰 정하고(칸 좌표 섞음보다 우선), 오른쪽 끝도 같은 식.
  //   한 열에 두 쪽 모두 걸리면(1칸 폭 틈 등) 그 사각형 조각만 반대로 뒤집거나 끝부터 깐다 — 남는 금은 그 조각 폭(1.28칸 미만)뿐.
  const zoneRects = (ch, deep) => {   // 같은 구역 칸을 줄 단위 사각형으로 묶는다 (위에서부터, 아래로 늘릴 수 있는 만큼) → [[x, xe, yb, y]]
    const covered = new Set(), rects = [];
    const inZone = (x, y) => bp.isFloor(x, y) && bp.zoneOf(x, y) === ch && !covered.has(key(x, y)) && deep(x, y);
    for (let y = b.y1; y >= b.y0; y--) for (let x = b.x0; x <= b.x1; x++) {
      if (!inZone(x, y)) continue;
      let xe = x;
      while (inZone(xe + 1, y)) xe++;
      let yb = y;
      const rowOk = (yy) => { for (let xx = x; xx <= xe; xx++) if (!inZone(xx, yy)) return false; return true; };
      while (rowOk(yb - 1)) yb--;
      for (let yy = yb; yy <= y; yy++) for (let xx = x; xx <= xe; xx++) covered.add(key(xx, yy));
      rects.push([x, xe, yb, y]);
    }
    return rects;
  };
  const MIX_OX = b.x0, MIX_OY = b.y0, EPS = 1e-6;
  const mixAt = new Map(), mixRects = new Map();   // 칸 → 그 칸을 덮는 ;floormix 그림 · "구역|x|y" → 사각형
  for (const [ch, z0] of Object.entries(bp.zones)) {
    const zd = zoneDraw(ch, z0);
    if (zd.skip || !bp.floorMix.has(zd.z.art)) continue;
    for (const [x, xe, yb, y] of zoneRects(ch, zd.deep)) {
      for (let yy = yb; yy <= y; yy++) for (let xx = x; xx <= xe; xx++) mixAt.set(key(xx, yy), zd.z.art);
      mixRects.set(`${ch}|${x}|${y}`, { art: zd.z.art, ax: x, bx: xe + 1, ay: yb, by: y + 1 });
    }
  }
  // 담 윗면 맵이 아니면 섞는 바닥을 다른 구역 바닥(-0.005)보다 한 겹 뒤(-0.004)에 깔아, 늘린 조각이 벽(-0.02)·다른 그림 구역 밑으로 들어가도 가려지게 한다.
  //   담 윗면 맵의 벽 글자는 낮은 칸(보이는 땅)이라 덮으면 안 된다 → 같은 그림 칸으로만 늘린다
  const MIX_Z = bp.raised ? -0.005 : -0.004;
  const hiddenAt = new Set();   // 늘린 조각이 들어가도 앞 그림에 가려지는 칸 (담 윗면 아닌 맵의 벽 · 그림 있는 다른 구역)
  if (!bp.raised) for (let y = b.y1 + 2; y >= b.y0 - 2; y--) for (let x = b.x0 - 2; x <= b.x1 + 2; x++) {
    if (bp.at(x, y) === null || mixAt.has(key(x, y))) continue;
    if (bp.isWall(x, y)) { hiddenAt.add(key(x, y)); continue; }
    const ch = bp.zoneOf(x, y), z0 = ch && bp.zones[ch];
    if (z0) { const zd = zoneDraw(ch, z0); if (!zd.skip && zd.z.art && !bp.floorMix.has(zd.z.art)) hiddenAt.add(key(x, y)); }
  }
  const same = (art, x0, x1, y0, y1) => {   // 월드 띠 [x0, x1) × [y0, y1)를 덮어도 되는가 — 걸친 칸이 모두 같은 ;floormix 그림(같은 무늬가 겹칠 뿐)이거나 앞 그림에 가려지는 칸
    for (let y = Math.floor(y0 + EPS); y < y1 - EPS; y++) for (let x = Math.floor(x0 + EPS); x < x1 - EPS; x++) {
      const k = key(x, y);
      if (mixAt.get(k) !== art && !hiddenAt.has(k)) return false;
    }
    return true;
  };
  const tileOf = (v, O) => Math.floor((v - O) / S + EPS);
  // 한 축: 사각형 [a, e]가 잘린 열에서 이웃을 덮을 수 없는 쪽을 모은다 → 열마다 뒤집기 결정
  const markCuts = (cuts, art, a, e, O, len, okBefore, okAfter) => {   // len = 그 사각형의 다른 축 길이 (어긋나면 금이 갈 길이)
    const k0 = tileOf(a, O), k1 = Math.ceil((e - O) / S - EPS) - 1;
    const at = (k) => { const id = `${art}|${k}`; if (!cuts.has(id)) cuts.set(id, { hardL: 0, hardR: 0 }); return cuts.get(id); };
    if (a > O + k0 * S + EPS && !okBefore(O + k0 * S)) at(k0).hardL += len;
    if (e < O + (k1 + 1) * S - EPS && !okAfter(O + (k1 + 1) * S)) at(k1).hardR += len;
  };
  const decide = (cuts, art, k, O, flipAt) => {
    const c = cuts.get(`${art}|${k}`);
    if (!c || (!c.hardL && !c.hardR)) return flipAt(r3(O + k * S));
    return c.hardL >= c.hardR;   // 왼쪽(아래)이 잘린 채 못 늘리는 쪽이 길면 뒤집어 오른쪽(위) 그림 경계에 맞춘다 — 양쪽 다 있으면 긴 쪽을 살린다
  };
  let mixForced = 0, mixLocal = 0;
  // 한 축의 조각들: [{ L, R, f, local }] — f면 R이 그림 경계, 아니면 L이 그림 경계 (local = 맞출 수 없어 사각형 끝부터 깐 조각)
  const segs = (a, e, O, F, okBefore, okAfter) => {
    const list = [], k0 = tileOf(a, O), k1 = Math.ceil((e - O) / S - EPS) - 1;
    for (let k = k0; k <= k1; k++) {
      const g0 = O + k * S, g1 = g0 + S, cutL = a > g0 + EPS, cutR = e < g1 - EPS;
      const unfOk = !cutL || okBefore(g0), flipOk = !cutR || okAfter(g1);
      let f = F(k), local = false;
      if (f ? !flipOk : !unfOk) { if (f ? unfOk : flipOk) { f = !f; mixForced++; } else { f = false; local = true; mixLocal++; } if (process.env.MIXDEBUG === "2") console.log(`    [floormix] ${O === MIX_OX ? "열" : "줄"} ${k} [${r3(a)}, ${r3(e)}] cutL=${cutL} cutR=${cutR} → ${local ? "local" : "forced " + f}`); }
      const L = local || f ? Math.max(a, g0) : g0, R = local || !f ? Math.min(e, g1) : g1;
      const last = list[list.length - 1];
      // 이어 붙이기: 안 뒤집은 묶음은 앞 조각이 그림 경계에서 끝났을 때, 뒤집은 묶음은 이 조각이 그림 경계에서 시작할 때만 (잘린 장이 묶음 끝에 오게)
      if (last && !local && !last.local && last.f === f && Math.abs(last.R - L) < EPS && Math.abs(L - g0) < EPS) last.R = R;
      else list.push({ L, R, f, local });
    }
    return list;
  };
  const cutsX = new Map(), cutsY = new Map();
  for (const m of mixRects.values()) markCuts(cutsX, m.art, m.ax, m.bx, MIX_OX, m.by - m.ay, (g0) => same(m.art, g0, m.ax, m.ay, m.by), (g1) => same(m.art, m.bx, g1, m.ay, m.by));
  for (const m of mixRects.values()) {
    m.cols = segs(m.ax, m.bx, MIX_OX, (k) => decide(cutsX, m.art, k, MIX_OX, variantsOf(m.art) ? noFlip : floorFlipX), (g0) => same(m.art, g0, m.ax, m.ay, m.by), (g1) => same(m.art, m.bx, g1, m.ay, m.by));
    m.cx0 = Math.min(...m.cols.map((c) => c.L)); m.cx1 = Math.max(...m.cols.map((c) => c.R));   // 좌우로 늘린 폭까지 위아래 이웃을 본다 (모서리 칸)
  }
  for (const m of mixRects.values()) markCuts(cutsY, m.art, m.ay, m.by, MIX_OY, m.cx1 - m.cx0, (g0) => same(m.art, m.cx0, m.cx1, g0, m.ay), (g1) => same(m.art, m.cx0, m.cx1, m.by, g1));
  // 줄: seam-only면 의사난수만 끄고(noFlip) decide의 경계 방향·segs의 필요 뒤집기는 그대로 (위 FLOORMIX_Y_MODES 주석)
  const rowFlip = floormixY === "seam-only" ? noFlip : floorFlipY;
  let freeRows = 0;   // 경계 보정 없이 정책(의사난수/끔)으로 정한 줄 수 (MIXDEBUG 줄)
  const rowPick = (wy) => { freeRows++; return rowFlip(wy); };
  const rowPickNo = (wy) => { freeRows++; return false; };   // variants 정책: 임의 상하 반전 없음 (경계 보정은 decide·segs가 그대로)
  for (const m of mixRects.values()) m.rows = segs(m.ay, m.by, MIX_OY, (k) => decide(cutsY, m.art, k, MIX_OY, variantsOf(m.art) ? rowPickNo : rowPick), (g0) => same(m.art, m.cx0, m.cx1, g0, m.ay), (g1) => same(m.art, m.cx0, m.cx1, m.by, g1));
  // variants 정책: 한 축의 조각을 그림 격자 칸 단위로 나눈다 — 안 뒤집은 조각은 L이, 뒤집은 조각은 R이 칸 경계라(segs) 나눈 칸도 같은 위치 규칙을 지킨다
  const cellsOf = (list, O) => list.flatMap((sg) => {
    if (sg.local) return [Object.assign({ k: tileOf((sg.L + sg.R) / 2, O) }, sg)];
    const out = [], k0 = tileOf(sg.L, O), k1 = Math.ceil((sg.R - O) / S - EPS) - 1;
    for (let k = k0; k <= k1; k++) out.push({ L: Math.max(sg.L, O + k * S), R: Math.min(sg.R, O + (k + 1) * S), f: sg.f, local: false, k });
    return out;
  });
  let variantCount = null;   // MIXDEBUG: 장별 조각 수
  const mixPieces = (name, rid, m, z, tint) => {
    const parts = [];
    const vs = variantsOf(m.art);
    if (vs) {
      const rows = cellsOf(m.rows, MIX_OY), cols = cellsOf(m.cols, MIX_OX);
      variantCount = variantCount || {};
      for (const rr of rows) {
        const runs = [];
        for (const cr of cols) {
          const vi = variantAt(cr.k, rr.k, vs.length), last = runs[runs.length - 1];
          // 이어 붙이기는 segs와 같은 조건: 같은 장·같은 뒤집기 · 앞 조각이 칸 경계에서 끝나고 이 조각이 칸 경계에서 시작
          if (last && !cr.local && !last.local && last.vi === vi && last.f === cr.f && Math.abs(last.R - cr.L) < EPS && Math.abs(cr.L - (MIX_OX + cr.k * S)) < EPS) last.R = cr.R;
          else runs.push({ L: cr.L, R: cr.R, f: cr.f, local: cr.local, vi });
        }
        for (const cr of runs) {
          const o = sprite(ruid(vs[cr.vi], `floormix ${vs[cr.vi]}`), [r3((cr.R - cr.L) / S), r3((rr.R - rr.L) / S)], 1), sr = o["MOD.Core.SpriteRendererComponent"];
          if (tint) sr.Color = tintOf(tint);
          if (cr.f) sr.FlipX = true;
          if (rr.f) sr.FlipY = true;
          const px = cr.f ? cr.R - S / 2 : cr.L + S / 2, py = rr.f ? rr.R - S / 2 : rr.L + S / 2;   // 뒤집은 쪽은 끝 장 가운데가 축 (위 주석)
          parts.push({ name: `${name}_${parts.length + 1}`, pos: [r3(px), r3(py), z], overrides: o });
          variantCount[vs[cr.vi]] = (variantCount[vs[cr.vi]] || 0) + 1;
        }
      }
      return parts;
    }
    for (const rr of m.rows) for (const cr of m.cols) {
      const o = sprite(rid, [r3((cr.R - cr.L) / S), r3((rr.R - rr.L) / S)], 1), sr = o["MOD.Core.SpriteRendererComponent"];
      if (tint) sr.Color = tintOf(tint);
      if (cr.f) sr.FlipX = true;
      if (rr.f) sr.FlipY = true;
      const px = cr.f ? cr.R - S / 2 : cr.L + S / 2, py = rr.f ? rr.R - S / 2 : rr.L + S / 2;   // 뒤집은 쪽은 끝 장 가운데가 축 (위 주석)
      parts.push({ name: `${name}_${parts.length + 1}`, pos: [r3(px), r3(py), z], overrides: o });
    }
    return parts;
  };
  let zoneN = 0, mixN = 0;
  for (const [ch, z0] of Object.entries(bp.zones)) {
    const { z, skip, deep } = zoneDraw(ch, z0);
    if (skip) continue;
    for (const [x, xe, yb, y] of zoneRects(ch, deep)) {
      const args = [`ArtZone${++zoneN}`, ruid(z.art, `zone ${ch}`), (x + xe + 1) / 2, (yb + y + 1) / 2, xe - x + 1, y - yb + 1, -0.005, floorTint(z.tint)];
      const m = bp.floorMix.has(z.art) && mixRects.get(`${ch}|${x}|${y}`);
      if (m) { const parts = mixPieces(args[0], args[1], m, MIX_Z, floorTint(z.tint)); out.push(...parts); mixN += parts.length; }
      else out.push(tiled(...args));
    }
  }
  if (process.env.MIXDEBUG && mixRects.size) {
    const rowsF = [...mixRects.values()].reduce((n, m) => n + m.rows.filter((r) => r.f).length, 0), rowsN = [...mixRects.values()].reduce((n, m) => n + m.rows.length, 0);
    const fxN = [...mixRects.values()].reduce((n, m) => n + m.cols.filter((c) => c.f).length, 0), fxAll = [...mixRects.values()].reduce((n, m) => n + m.cols.length, 0);
    console.log(`  [floormix] ${bp.id} 정책 ${floormixMode} · 좌우 뒤집은 열 ${fxN}/${fxAll}${variantCount ? " · 장별 조각 " + JSON.stringify(variantCount) : ""}`);
    console.log(`  [floormix] ${bp.id} 상하 ${floormixMode === "variants" ? "임의 없음(variants)" : floormixY} · 사각형 ${mixRects.size} · 반대로 뒤집은 조각 ${mixForced} · 끝부터 깐 조각 ${mixLocal} · 상하 뒤집은 줄 ${rowsF}/${rowsN} (경계 보정 없이 정한 줄 ${freeRows})`);
  }
  // 3) 길 — 줄마다 이어진 구간 (칸 크기 그림)
  let roadN = 0;
  const roadRect = (ch, x, y, len, rows, mul) => {   // (x, y) = 왼쪽 아래 칸, mul = 그림 한 장이 덮는 칸 수
    const rd = bp.roads[ch];
    const o = sprite(ruid(rd.art, `road ${ch}`), [len / mul, rows / mul], 1);
    o["MOD.Core.SpriteRendererComponent"].Color = tintOf(floorTint(rd.tint));
    o["MOD.Core.TransformComponent"] = { Scale: vec3(mul / S) };
    out.push({ name: `ArtRoad${++roadN}`, pos: [r3(x + mul / 2), r3(y + mul / 2), -0.01], overrides: o });
  };
  for (let y = b.y1; y >= b.y0; y--) {
    let cur = null;
    for (let x = b.x0; x <= b.x1 + 1; x++) {
      const ch = x <= b.x1 ? bp.at(x, y) : null;
      const on = ch !== null && ch in bp.roads && bp.roads[ch].wide <= 1 ? ch : null;
      if (cur && on === cur.ch) { cur.len++; continue; }
      if (cur) roadRect(cur.ch, cur.x, y, cur.len, 1, 1);
      cur = on ? { ch: on, x, len: 1 } : null;
    }
  }
  // 3-0) wide=N 길(양쪽 난간이 든 다리 그림): 세로로 이어진 길 칸을 위에서부터 N칸씩 묶어 N배 크기 한 장으로 — 한 칸씩 반복하면 난간이 가운데에 또 그려졌다 (10-28 심장의 다리)
  for (const [ch, rd] of Object.entries(bp.roads)) {
    if (rd.wide <= 1) continue;
    const N = rd.wide, pk = new Map();
    for (let x = b.x0; x <= b.x1; x++) {
      let y = b.y1;
      while (y >= b.y0) {
        if (bp.at(x, y) !== ch) { y--; continue; }
        let n = 0;
        while (n < N && bp.at(x, y - n) === ch) n++;
        if (n === N) { for (let k = 0; k < N; k++) pk.set(key(x, y - k), `g|${y - N + 1}`); y -= N; }
        else { pk.set(key(x, y), "s"); y--; }
      }
    }
    for (const r of mergeRects(pk)) {
      if (r.p === "s") roadRect(ch, r.x, r.y, r.len, r.rows, 1);
      else for (let k = 0; k < r.rows; k += N) roadRect(ch, r.x, r.y + k, r.len, N, N);
    }
  }
  // 3-1) 물가 거품 (;shore <물 그림[+물 그림…]> <거품 그림> [크기] [색] [세로 거품 그림]) — 10-28 액트 3 「얕은 바다」: 청록 바다와 모래가 칸 단위로 맞닿아
  //   네모 계단이 드러났다 → 바다 칸과 다른 바닥 칸이 맞닿은 변을 따라 거품 띠를 이어 깐다 (layRuns)
  if (bp.shore) {
    const floorArt = (x, y) => {
      const ch = bp.at(x, y);
      if (ch !== null && ch in bp.roads) return bp.roads[ch].art;
      const z = bp.zones[bp.zoneOf(x, y)];
      return (z && z.art) || bp.base.art;
    };
    // 물끼리(얕은 바다 ↔ 갯벌)는 거품 없이, 물 ↔ 뭍(모래) 변에만
    const isSea = (x, y) => bp.isFloor(x, y) && bp.shore.sea.has(floorArt(x, y));
    const isLand = (x, y) => bp.isFloor(x, y) && !bp.shore.sea.has(floorArt(x, y));
    const hRuns = [], vRuns = [];
    for (let y = b.y0; y < b.y1; y++) {   // (x, y) ↔ (x, y + 1) 사이 가로 변: 선 y + 1
      let st = null;
      for (let x = b.x0; x <= b.x1 + 1; x++) {
        const on = x <= b.x1 && ((isSea(x, y) && isLand(x, y + 1)) || (isLand(x, y) && isSea(x, y + 1)));
        if (on && st === null) st = x;
        if (!on && st !== null) { hRuns.push([y + 1, st, x - 1]); st = null; }
      }
    }
    for (let x = b.x0; x < b.x1; x++) {   // (x, y) ↔ (x + 1, y) 사이 세로 변: 선 x + 1
      let st = null;
      for (let y = b.y0; y <= b.y1 + 1; y++) {
        const on = y <= b.y1 && ((isSea(x, y) && isLand(x + 1, y)) || (isLand(x, y) && isSea(x + 1, y)));
        if (on && st === null) st = y;
        if (!on && st !== null) { vRuns.push([x + 1, st, y - 1]); st = null; }
      }
    }
    // 세로 변: 그림을 90도 돌리면 번개·금처럼 보였다(메이커 비교) → 세로로 그린 거품 그림(;shore 6번째 칸, 10-28 코덱스 a3 r2 64×256)을 세로로 잇는다
    layRuns("Foam", hRuns, vRuns, bp.shore.foam, bp.shore.foamV, bp.shore.scale, bp.shore.tint, -0.012);
  }
  // 4) 벽 — 바닥에 드러난 면의 조각 (layout.cjs wallRuns와 같은 규칙), 벽 글자마다 다른 9조각 묶음
  const f = (x, y) => bp.isFloor(x, y);
  const pieceAt = pieceBy(f);
  // 10-28 1차 검수: 얇은 벽(양쪽이 바닥)·들판 안 바위 덩어리가 「center」 0.3으로 검은 구멍처럼 보였다 →
  //   바닥에 닿은(8방향) center 조각은 WALL_EDGE_SHADE로 밝게, 바닥에서 떨어진 깊은 속만 어둡게
  const touchesFloor = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && f(x + dx, y + dy)) return true; return false; };
  // 10-28 3차 검수: 들판 안 두꺼운 바위(석상 뒤 5×4 등)의 속이 검은 구덩이처럼 보였다 →
  //   바닥에서 ROCK_DEPTH칸(8방향 거리) 안의 속 조각은 가장자리(n) 그림으로 덮어 바위 윗면으로, 그보다 깊은 바깥 덩어리만 검은 공간
  const depth = new Map(), dq = [];
  for (const [x, y] of bp.cells()) if (f(x, y)) { depth.set(key(x, y), 0); dq.push([x, y]); }
  for (let i = 0; i < dq.length; i++) {
    const [x, y] = dq[i], d0 = depth.get(key(x, y));
    if (d0 >= ROCK_DEPTH) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const k = key(x + dx, y + dy);
      if (depth.has(k) || bp.at(x + dx, y + dy) === null) continue;
      depth.set(k, d0 + 1); dq.push([x + dx, y + dy]);
    }
  }
  // 10-28 소금 갯벌 검수: 두꺼운 바위 속에 바닥에서 먼 칸이 몇 개만 고립되면 검은 구멍처럼 보였다 →
  //   깊은 칸끼리(4방향) 이은 덩어리가 4칸 이하이고 맵 테두리에 닿지 않으면 바깥 어둠이 아니라 바위 속 — 바위 윗면으로 덮는다
  const deepShallow = new Set();
  {
    const isDeep = (x, y) => { const ch = bp.at(x, y); return ch !== null && ch in bp.walls && ch !== lowCh && !depth.has(key(x, y)) && !f(x, y); };
    const seen = new Set();
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      if (seen.has(key(x, y)) || !isDeep(x, y)) continue;
      const comp = [[x, y]];
      seen.add(key(x, y));
      for (let i = 0; i < comp.length && comp.length <= 4; i++) {
        const [cx, cy] = comp[i];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < b.x0 || nx > b.x1 || ny < b.y0 || ny > b.y1 || seen.has(key(nx, ny)) || !isDeep(nx, ny)) continue;
          seen.add(key(nx, ny));
          comp.push([nx, ny]);
        }
      }
      const atEdge = comp.some(([cx, cy]) => cx <= b.x0 + 1 || cx >= b.x1 - 1 || cy <= b.y0 + 1 || cy >= b.y1 - 1);   // 맵 테두리 줄은 바깥 어둠 그대로
      if (comp.length <= 4 && !atEdge) for (const [cx, cy] of comp) deepShallow.add(key(cx, cy));
    }
  }
  // 칸마다 조각 열쇠 → 같은 열쇠 칸을 큰 사각형으로 덮는다 (담 윗면 맵의 낮은 칸은 그리지 않는다 — 바탕 모래가 보인다)
  // cut=x/y[+x/y…] (배치표 prop args, 10-29 마지막 초소 남문): 그 벽 칸은 그림만 비운다(충돌 타일은 그대로) — 담을 뚫은 문틀 사이로 목책 조각이 비치지 않게
  const cutCells = new Set();
  for (const r of rows) for (const c of String(parseArgs(r.args).cut || "").split("+").filter(Boolean)) {
    const [cx, cy] = c.split("/").map(Number);
    if (!bp.isWall(cx, cy)) warn.push(`${d.id}.csv ${r.name}: cut=${c}는 벽 칸이 아님`);
    cutCells.add(key(cx, cy));
  }
  const pk = new Map();
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    const ch = bp.at(x, y);
    if (ch === null || !(ch in bp.walls) || ch === lowCh || cutCells.has(key(x, y))) continue;
    let piece = pieceAt(x, y);
    if (piece === "center" && !touchesFloor(x, y) && (depth.has(key(x, y)) || deepShallow.has(key(x, y)))) piece = bp.walls[ch].top ? "top" : "n";
    pk.set(key(x, y), `${ch}|${piece}|${piece === "center" && touchesFloor(x, y) ? 1 : 0}`);
  }
  let wallN = 0;
  for (const r of mergeRects(pk)) {
    const [wch, wpiece, lit] = r.p.split("|");
    const wl = bp.walls[wch];
    const o = sprite(ruid(wpiece === "top" ? wl.top : `${wl.atlas}-borders-${wpiece}`, `wall ${wch}`), [r.len, r.rows], 1);
    const t = tintOf(wpiece === "top" && wl.topTint ? wl.topTint : wl.tint), m = wpiece !== "center" ? 1 : lit === "1" ? WALL_EDGE_SHADE : WALL_CENTER_SHADE;
    o["MOD.Core.SpriteRendererComponent"].Color = { r: t.r * m, g: t.g * m, b: t.b * m, a: 1 };
    out.push({ name: `ArtWall${++wallN}`, pos: [r.x + 0.5, r.y + 0.5, -0.02], overrides: Object.assign(o, cellScale) });
  }
  // 5) 장식·바닥 무늬: 아래(남쪽)에 있는 그림일수록 앞에 그린다 (z -0.034 ~ -0.026, 바닥 무늬는 -0.015)
  const zOf = (y, decal) => decal ? -0.015 : r3(-0.034 + ((y - b.y0) / (b.y1 - b.y0)) * 0.008);
  // ok: 배치표 args ok=cliff(일부러 절벽·담 위) · ok=gate(일부러 기능 자리 곁) · ok=gate+cliff(둘 다) — 그 경고를 끈다
  // over: 배치표 args over=1 — 같은 자리 그림 위에 겹치는 층(코덱스 a4-abyss-wall-pulse 발광 층)을 그 그림 바로 앞에 (z는 0.001 단위라 발 y를 조금 내려서는 앞뒤가 안 갈린다)
  const droppedOnRoute = [];   // 10-31 C-3: 길 안에 걸려 뺀 막는 조각
  const pieces = [];   // 10-31 C: 놓은 장식마다 {이름, 그림, 발, 막음, 막은 칸, 흩뿌림} — 검사기·전후 표
  const place = (name, spName, x, y, scaleMul, flip, tint, decal, where, ok, over, collide, scatter) => {
    const sp = spriteOf(table, spName, where);
    const sc = baseScale(sp, ctx.propScale) * num(scaleMul, 1) * (v5 && !decal ? roles.multOf(spName) : 1);   // v5: 크기는 역할이 정한다 (asset_roles.csv base_cells)
    if (sp.kind !== "maple" && Math.max(num(sp.w, 0), num(sp.h, 0)) >= SIZE_MIN_PX && !(sp.name in ctx.propScale) && !SIZE_EXEMPT.has(sp.name)
      && Math.abs(num(scaleMul, 1) - 1) <= SIZE_MUL_TOL) {
      const sw = sizeWarn.get(sp.name) || { n: 0, w: sp.w, h: sp.h, cells: r3((num(sp.w, 0) * sc) / 100), at: where };
      sw.n++;
      sizeWarn.set(sp.name, sw);
    }
    const cell = [Math.floor(x), Math.floor(y)];
    const okHas = (w) => String(ok || "").split("+").includes(w);   // ok=gate+cliff: 둘 다 일부러 (10-28 곁가지 올라가는 계단 — 벽에 붙고 포털 위)
    if (mode) {
      // 10-31 C-2: 키 큰 것(block)만 막는다 — 길 칸·기능 자리 곁이라고 봐주지 않는다(일관성). 기능 엔티티가 선 칸만은 비운다
      const blockIt = !decal && (collide || decor.classOf(spName).collide) === "block";
      if (!bp.isFloor(cell[0], cell[1]) && !okHas("cliff")) warn.push(`${where}: '${spName}' (${x}, ${y})의 발이 벽 칸 ${cell} 위 — 절벽 위 장식이면 args ok=cliff, 아니면 좌표를 고친다`);
      const cells = [];
      if (blockIt) for (const k of footprint(x, y, sp.w, sc)) { const [cx, cy] = k.split(",").map(Number); if (bp.isFloor(cx, cy) && !funcCells.has(k)) cells.push([cx, cy]); }
      // 10-31 C-3: 길 안내 폭 3칸 안에 발이 걸리는 막는 조각은 놓지 않는다 (세트면 그 조각만 빠진다)
      if (blockIt && opts.route && cells.some(([cx, cy]) => decor.cellTooClose(opts.route, cx, cy))) { droppedOnRoute.push(`${name} ${spName}`); return; }
      for (const [cx, cy] of cells) blocked.add(key(cx, cy));
      pieces.push({ name, sprite: spName, x, y, sc, decal: !!decal, block: blockIt, cells, scatter: !!scatter });
    } else if (!bp.isFloor(cell[0], cell[1])) { if (!okHas("cliff")) warn.push(`${where}: '${spName}' (${x}, ${y})의 발이 벽 칸 ${cell} 위 — 절벽 위 장식이면 args ok=cliff, 아니면 좌표를 고친다`); }
    else if (!decal && bp.isRoad(cell[0], cell[1])) warn.push(`${where}: '${spName}' (${x}, ${y})의 발이 길 칸 위 — 막지 않는다 (길을 막는 장식은 길 밖으로)`);
    else if (!decal && nearFunc(x, y)) { if (!okHas("gate")) warn.push(`${where}: '${spName}' (${x}, ${y})이 기능 자리(포털·화로·웨이포인트) 곁 — 막지 않는다 (일부러면 args ok=gate)`); }
    else if (!decal) for (const k of footprint(x, y, sp.w, sc)) { const [cx, cy] = k.split(",").map(Number); if (bp.isFloor(cx, cy) && !bp.isRoad(cx, cy)) blocked.add(k); }
    if (!decal) feet.push([x, y]);
    const o = sprite(sp.ruid, null, 1);
    o["MOD.Core.SpriteRendererComponent"].FlipX = !!flip;
    const c = tint || sp.tint;
    if (c) o["MOD.Core.SpriteRendererComponent"].Color = tintOf(c);
    o["MOD.Core.TransformComponent"] = { Scale: vec3(sc) };
    const py = y + (num(sp.ny, 0) * num(sp.h, 0) * sc) / 100;   // 발이 y에 오게 (메이플 피벗 보정)
    out.push({ name, pos: [r3(x), r3(py), over ? zOf(y, decal) - 0.0005 : zOf(y, decal)], overrides: o });
  };
  let propN = 0, decalN = 0, setN = 0, clN = 0;
  for (const r of rows) {
    const x = num(r.x), y = num(r.y), where = `${d.id}.csv ${r.kind} ${r.name || ""} @${r.x}/${r.y}`;
    if (r.kind === "prop") { const a = parseArgs(r.args); place(`ArtProp${++propN}`, r.name, x, y, r.scale, num(r.flip) === 1, r.tint, false, where, a.ok, num(a.over) === 1, null, !!r.scatter); }
    else if (r.kind === "decal") place(`ArtDecal${++decalN}`, r.name, x, y, r.scale, num(r.flip) === 1, r.tint, true, where);
    else if (r.kind === "set") {
      const pieces = ctx.sets[r.name];
      if (!pieces) throw new Error(`${where}: 세트 '${r.name}'이 map_sets.csv에 없음`);
      const mirror = num(r.flip) === 1 ? -1 : 1, tag = `ArtSet${++setN}`;
      const setOk = parseArgs(r.args).ok;   // ok=cliff: 세트를 일부러 낮은 칸(담 아래 모래 안뜰)에 장식으로 (10-29)
      pieces.forEach((pc, k) => {
        const decal = pc.piece.startsWith("d:"), name = decal ? pc.piece.slice(2) : pc.piece;
        const px = x + num(pc.dx) * mirror, py = y + num(pc.dy);
        if (mode && !["block", "pass"].includes(pc.collide)) throw new Error(`map_sets.csv ${r.name} 조각 '${pc.piece}': collide 열(block/pass)이 비었음`);
        place(`${tag}_${k + 1}`, name, r3(px), r3(py), num(pc.scale, 1) * num(r.scale, 1), (num(pc.flip) === 1) !== (mirror < 0), null, decal, `${where} 조각 ${k + 1} '${name}'`, setOk, false, mode ? pc.collide : null);
      });
    } else if (r.kind === "cluster") {
      const a = parseArgs(r.args), names = r.name.split("|"), radius = num(a.r, 3), n = num(a.n, 4);
      const rand = layoutGen.rng(num(a.seed, 1) * 131 + ++clN);
      let placed = 0;
      for (let tries = 0; tries < n * 40 && placed < n; tries++) {
        const ang = rand() * Math.PI * 2, dist = Math.sqrt(rand()) * radius;
        const px = r3(x + Math.cos(ang) * dist), py = r3(y + Math.sin(ang) * dist * 0.75);
        const cx = Math.floor(px), cy = Math.floor(py);
        if (!bp.isFloor(cx, cy) || bp.isRoad(cx, cy) || blocked.has(key(cx, cy)) || nearFunc(px, py)) continue;
        if (feet.some(([fx, fy]) => Math.hypot(fx - px, fy - py) < 1.3)) continue;
        if (decor.tooClose(opts.route, px, py)) continue;   // 10-31 C-1: 길 안내 둘레(출구 갈래 1.5칸 · 고리 1칸)는 비운다
        const name = names[Math.floor(rand() * names.length)], decal = /decal/.test(name);
        place(`ArtCl${clN}_${++placed}`, name, px, py, 0.85 + rand() * 0.3, rand() < 0.5, null, decal, `${where} 흩뿌림`, undefined, false, null, true);
      }
      if (placed < n) warn.push(`${where}: 흩뿌림 ${n}개 중 ${placed}개만 자리를 찾음`);
    } else if (!["gate", "torch", "waypoint"].includes(r.kind)) throw new Error(`${where}: kind '${r.kind}' 알 수 없음`);
  }
  // 10-30 I07 재질 접합 (specs/material_joins.cjs · 코덱스 0045): 내부 재질 접점의 짧은 바닥 무늬 몇 장을 맨 끝에 ArtJoin<n>으로 —
  //   기존 장식 이름·순서는 그대로. 그림이 art_sprites.csv에 아직 없으면(업로드 전 임시 키) 건너뛰고 「등록 필요」 경고 한 줄
  let joinN = 0;
  const joinMissing = new Set();
  for (const [jName, jx, jy, jScale, jFlip] of MATERIAL_JOINS[d.id] || []) {
    if (!table[jName]) { joinMissing.add(jName); continue; }
    place(`ArtJoin${++joinN}`, jName, jx, jy, jScale, jFlip === 1, null, true, `${d.id} 재질 접합 ${joinN} '${jName}'`);
  }
  for (const n of joinMissing) warn.push(`${d.id}: 재질 접합 '${n}' — art_sprites.csv 등록 필요 (등록 전이라 건너뜀)`);
  // 10-31 C-3·C-5·C-6: 출구 표식 · 길 안내 곡선 · 바닥 이음새 (정책 맵 · 길 경로를 잰 뒤의 본 빌드만)
  let markN = 0, guide = null, seam = null;
  if (mode && !opts.pre) {
    const PL = decor.POLICY;
    if (opts.route) {
      const spr = PL.MARKER[num(d.act, 1)] || PL.MARKER[1];
      const msp = spriteOf(table, spr, `${d.id} 표식`), msc = baseScale(msp, ctx.propScale);
      for (const c of opts.route.curves) {
        if (c.target === "end" || c.target === "entry" || c.kind === "loop" || c.pts.length < 2) continue;
        // 출구에서 EXIT_LEN칸 앞 (자리가 없으면 길을 따라 앞뒤로 조금씩 옮겨 본다)
        const at = (len) => {
          let acc = 0, i = c.pts.length - 1;
          while (i > 0 && acc < len) { acc += Math.hypot(c.pts[i].x - c.pts[i - 1].x, c.pts[i].y - c.pts[i - 1].y); i--; }
          return i;
        };
        for (const side of [1, -1]) search: for (const along of PL.MARKER_ALONG) for (const off of PL.MARKER_OFFSET) {
          const i = at(PL.EXIT_LEN + along), p = c.pts[i], q = c.pts[Math.min(c.pts.length - 1, i + 1)];
          const L = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = -(q.y - p.y) / L, ny = (q.x - p.x) / L;
          const mx = r3(p.x + nx * off * side), my = r3(p.y + ny * off * side);
          const cells = footprint(mx, my, msp.w, msc).map((k) => k.split(",").map(Number));
          const ok = cells.every(([cx, cy]) => bp.isFloor(cx, cy) && !blocked.has(key(cx, cy)) && !funcCells.has(key(cx, cy)) && !decor.cellTooClose(opts.route, cx, cy))
            && !nearFunc(mx, my) && !feet.some(([fx, fy]) => Math.hypot(fx - mx, fy - my) < 1.0);
          if (!ok) continue;
          place(`ArtMark${++markN}`, spr, mx, my, 1, side < 0, null, false, `${d.id} 출구 표식 ${c.target}`, undefined, false, null, false);
          break search;
        }
      }
      guide = decor.guideEntities(bp, classes, opts.route, (n) => ruid(n, "길 안내"), { id: d.id, act: num(d.act, 1) });
      out.push(...guide.entities);
    }
    seam = decor.seamEntities(bp, classes, (n) => ruid(n, "이음새"), { noShade: !!bp.raised });
    out.push(...seam.entities);
  }
  const size = [...sizeWarn.entries()].map(([n, s]) => `크기: '${n}' ${s.w}×${s.h}px — art_scale.csv 줄 없이 배율 1로 ${s.n}곳 (원본 크기 약 ${s.cells}칸 폭 · 첫 자리 ${s.at}) → art_scale.csv에 줄부터 넣는다`);
  if (droppedOnRoute.length) warn.push(`${d.id}: 길 안내 폭 3칸 안이라 뺀 막는 조각 ${droppedOnRoute.length}개 — ${droppedOnRoute.join(", ")}`);
  const extra = mode ? { droppedOnRoute: droppedOnRoute.length, marks: markN, guide: guide ? guide.entities.length : 0, bands: seam ? seam.bands : 0, shades: seam ? seam.shades : 0, corners: seam ? seam.corners : 0 } : {};
  return { entities: out, blocked, warn, size, pieces, route: opts.route || null, guide, seam, mode, counts: Object.assign({ props: propN, decals: decalN, sets: setN, clusters: clN, walls: wallN, roads: roadN, zones: zoneN, raised: raisedN, foam: foamN }, mixN ? { floorMix: mixN } : {}, joinN ? { joins: joinN } : {}, extra) };
}

// ───────── 검사: 표식 ↔ 기능 엔티티 · 이어짐 ─────────
function check(bp, func, art) {
  const warn = [...art.warn];
  const markerCells = [];
  for (const [x, y] of bp.cells()) { const ch = bp.at(x, y); if (bp.markers.has(ch)) markerCells.push({ ch, x, y }); }
  const feet = art.entities.filter((e) => /^Art(Prop|Set|Cl)/.test(e.name)).map((e) => e.pos);
  for (const m of markerCells) {
    const near = (list, dd) => list.some(([px, py]) => Math.abs(px - (m.x + 0.5)) <= dd && Math.abs(py - (m.y + 0.5)) <= dd);
    if (m.ch === "R") { if (!near(feet, 2.5)) warn.push(`표식 R (${m.x}, ${m.y}) 2.5칸 안에 장식이 없음`); continue; }
    const kind = { W: /^GateBack$/, E: /^GateNext$/, H: /^Gate_/, T: /^Torch/, S: /^Waypoint$/, G: /^GateToField$/, X: /^GateReturn$/ }[m.ch];
    const list = func.filter((e) => kind.test(e.name)).map((e) => e.pos);
    if (!near(list, 1.0)) warn.push(`표식 ${m.ch} (${m.x}, ${m.y}) 1칸 안에 해당 엔티티가 없음`);
  }
  // 기능 자리는 바닥이고 막히지 않아야 한다
  for (const e of func) {
    const k = key(Math.floor(e.pos[0]), Math.floor(e.pos[1]));
    if (!bp.isFloor(Math.floor(e.pos[0]), Math.floor(e.pos[1]))) throw new Error(`${e.name} (${e.pos[0]}, ${e.pos[1]})이 벽 칸`);
    if (art.blocked.has(k)) throw new Error(`${e.name} 자리 ${k}를 장식이 막음`);
  }
  // 모든 바닥은 서문에서 이어져야 한다 (장식 발밑 칸은 막힌 것으로)
  const start = func.find((e) => e.name === "GateBack") || func.find((e) => e.name === "GateToField") || func[0];
  const sx = Math.floor(start.pos[0]), sy = Math.floor(start.pos[1]);
  const seen = new Set([key(sx, sy)]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (seen.has(k) || !bp.isFloor(nx, ny) || art.blocked.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  // 장식 사이에 갇힌 바닥은 짓을 때 충돌 칸으로 막는다 (몬스터 출현·드롭이 못 가는 자리에 생기지 않게 · 바닥 그림은 그대로)
  const cut = [];
  for (const [x, y] of bp.cells()) if (bp.isFloor(x, y) && !art.blocked.has(key(x, y)) && !seen.has(key(x, y))) cut.push(key(x, y));
  for (const e of func) if (!seen.has(key(Math.floor(e.pos[0]), Math.floor(e.pos[1])))) throw new Error(`${e.name}까지 서문에서 길이 없음 — 설계도·장식 발밑을 고친다`);
  if (cut.length) warn.push(`장식 사이에 갇힌 바닥 ${cut.length}칸 — 충돌 칸으로 막는다: ${cut.slice(0, 16).map((k) => `(${k})`).join(" ")}${cut.length > 16 ? " …" : ""}`);
  return { warn, reachable: seen.size, cut: cut.length, sealed: new Set(cut) };
}

function ambience(d) {
  return {
    "@type": "script.MapAmbience", Enable: true,
    DisplayName: d.name, Ambient: num(d.ambient), PlayerLightRadius: num(d.lightRadius),
    Bgm: d.bgm, Wind: bool(d.wind), Crows: bool(d.crows), Difficulty: 0, LevelBonus: 0,
    Storm: num(d.storm, 0), StatMul: num(d.statMul, 1),
    // 날씨 (10-28 액트 3 「젖은 느낌」, maps.cjs와 같은 규칙): 바람 부는 바깥 맵 = 비, 그 밖의 액트 3 맵 = 옅은 안개
    Weather: num(d.act, 1) !== 3 ? "" : bool(d.wind) ? "rain" : "mist",
  };
}

// 맵 파일 하나를 설계도대로 다시 짓는다 (늘 템플릿에서 새로, 엔티티 id는 경로가 같으면 예전 것을 유지)
//   opts.outFile: map/ 대신 그 파일에 쓴다 (시범 산출물 격리 — id·EntryKey는 map/<id>의 것을 이어 받아 그대로 비교된다)
function build(d, maps, ctx, funcIn, opts = {}) {
  const bp = parseBlueprint(d.id);
  if (bp.w !== num(d.w) || bp.h !== num(d.h)) throw new Error(`${d.id}: 설계도 ${bp.w}×${bp.h} ≠ maps.csv ${d.w}×${d.h}`);
  const rows = loadRows(d.id);
  const func = funcIn || functionalEntities(d, maps, ctx, rows);
  const art = artEntities(d, ctx, bp, rows, func);
  const result = check(bp, func, art);

  const file = opts.outFile || P.map(d.id);
  const previous = readIfExists(P.map(d.id));
  const map = MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), d.id);
  // 10-31 C-4: 정책 맵은 tile_classes.csv의 block 계층만 벽 칸 — 설계도 벽 글자와 같아야 한다(벽 불변)
  const classes = decor.modeOf(d.id) || bp.v5 ? tileClasses.classesOf(d.id) : null;
  const isBlockCell = (x, y) => { const ch = bp.at(x, y); return ch === null || (classes ? classes[ch] === "block" : bp.isWall(x, y)); };
  if (classes) for (const [x, y] of bp.cells()) if (isBlockCell(x, y) !== bp.isWall(x, y)) throw new Error(`${d.id}: tile_classes block 계층이 설계도 벽 글자와 다름 (${x}, ${y})`);
  const tileMap = bp.cells().map(([x, y]) => ({
    type: 0, position: { x, y },
    tileIndex: isBlockCell(x, y) || art.blocked.has(key(x, y)) || result.sealed.has(key(x, y)) ? TILE.wall : bp.isRoad(x, y) ? TILE.road : TILE.floor,
  }));
  map.patchComponent("RectTileMap", "MOD.Core.RectTileMapComponent", { TileSetRUID: PROJECT_TILESET, tileMap });
  map.upsertComponent(d.id, "script.MapAmbience", ambience(d));
  if (bp.backdrop) {   // 맵 밖 배경 (10-29 메이커: 바다·용암 맵 양옆이 템플릿 갈색에 플레이어 빛이 비쳐 주황 그라데이션으로 떴다)
    const c = tintOf(bp.backdrop);
    map.patchComponent("Background", "MOD.Core.BackgroundComponent", { Type: 2, SolidColor: { r: c.r, g: c.g, b: c.b, a: 1 } });
  }
  const mc = Object.assign({}, map.component(d.id, "MOD.Core.MapComponent"));
  delete mc.InstanceMap;
  mc.IsInstanceMap = true;
  map.upsertComponent(d.id, "MOD.Core.MapComponent", mc);
  map.data.Usage = 1;   // 인스턴스 맵 (게임 방에 실린다) — maps.cjs buildNormal과 같다
  if (bp.v5) map.data.CoreVersion = decor.POLICY.V5.CORE_VERSION;   // v5 맵: 템플릿 26.7 대신 커밋본과 같은 값 (악몽·지옥 복제는 노말을 복사해 따라온다)
  for (const e of art.entities) map.placeModel(e.name, P.model("Objects/ArtSprite"), { pos: e.pos, componentOverrides: e.overrides });
  for (const e of func) map.placeModel(e.name, P.model(e.model), { pos: e.pos, componentOverrides: e.overrides || {} });
  if (d.spawns !== "") {
    map.empty("Spawner", { pos: [0, 0, 0], scripts: ["script.MonsterSpawner"] });
    const e = edgesOf(d);
    map.patchComponent("Spawner", "script.MonsterSpawner", {
      Entries: d.spawns, EliteChance: num(d.eliteChance),
      VariantChance: d.variantChance === "" ? -1 : num(d.variantChance),
      PackSize: Math.max(1, num(d.packSize, 1)), RespawnSec: num(d.respawnSec, 10),
      AreaMin: { x: e.left + 2, y: e.bottom + 1.5 }, AreaMax: { x: e.right - 2, y: e.top - 1.5 },
    });
  }
  map.write(file);
  preserveIds(file, previous);
  return Object.assign({ entities: art.entities.length + func.length + 1, blockedCells: art.blocked.size, art }, art.counts, result);
}

module.exports = { parseArgs, parseBlueprint, loadRows, functionalEntities, artEntities, check, build, hasBlueprint, markers, inward, spriteTable, baseScale, footprint, HM_DIR, setFloormixY, FLOORMIX_Y_MODES, setFloormixMode, FLOORMIX_MODES, FLOOR_VARIANTS, variantAt };
