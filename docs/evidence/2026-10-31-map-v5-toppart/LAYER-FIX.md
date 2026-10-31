# 맵 v5 윗부분 그림 층 수정 (2026-10-31 · 방안 A)

메이커 7차(`../2026-10-31-map-v5-sample/maker7/NOTES.md` (B))에서 윗부분 그림 13종 31개가 모두 뒤에 서도 가려지지 않았다(❌). 이 수정은 생성기·DarkVision·검사기만 고쳤다. 메이커는 쓰지 않았다. 결과 확인은 메이커 레인이 `../2026-10-31-map-v5-sample/CAPTURE-PLAN.txt` 3-2에서 한다. 기반 HEAD는 4c6dd556이다.

## 1. 원인 (7차 측정 · 코드 대조)

- 아바타는 런타임에 `AvatarRendererComponent.SortingLayer = Default`, `OrderInLayer = 4`로 그려진다(7차 RUN-log 38행 probe).
- 생성기는 윗부분을 `SortingLayer "MapLayer1"`, 순서 1로 지었다(`tools/build/handmade/lib.cjs` 옛 훅). 그런데 66장 맵에는 맵 층이 `Layer1` 하나뿐이고 `MapLayer1`이라는 층은 없다. 이 값은 아바타보다 아래에 그려졌다(probe1·2에서 순서를 10으로 올려도 앞에 그려짐).
- 여기에 `DarkVision.mlua` ShadeWalls가 이름이 `Art`로 시작하는 맵 그림 전부를 순서 0으로 내리고 z를 0.05 뒤로 밀었다. 윗부분도 여기에 포함됐다.
- probe3에서 런타임에 `Default`·순서 10으로 바꾸자 가려졌다. 정렬 기준이 층 → 순서 → z이므로 층부터 아바타와 같은 `Default`여야 한다.

## 2. 변경

| 파일:행 | 내용 |
|---|---|
| `tools/build/handmade/lib.cjs:253` | `TOP_LAYER = "Default"`, `TOP_ORDER = 5` 상수(이유 주석 포함) · `module.exports`에도 넣음(1157행) |
| `lib.cjs:926·940` | 그 그림이 막은 칸(`cells`)을 `topCells`로 넘김 |
| `lib.cjs:953-969` | `-top` 훅이 `Default`·순서 5로 짓는다(이름 `<원본>Top` 그대로). 자르는 선이 막힘 꼭대기보다 위면 놓지 않는다(3절) |
| `lib.cjs:914·1050·1052` | 놓지 않은 `-top` 목록을 빌드 경고와 `counts.topSkipped`로 남김 |
| `RootDesk/MyDesk/Ambience/DarkVision.mlua:213-222` | `Art…Top`은 순서 0 내림·z 밀기에서 뺀다. 색은 원본 장식처럼 그대로 둔다(ShadeWalls의 벽 어둡게 대상은 `ArtWall`·`ArtBorder`뿐이라 원래부터 아님). 전체 조명(Global overlay light)은 아바타와 같은 Default 층에 똑같이 걸린다 |
| `DarkVision.mlua:250` | `[VRF] DarkVision 윗부분 그림 N개는 순서 유지 (층/순서)`. `IsPublishedPlay()`가 아닐 때만 찍는다 |
| `tools/check_map_composition.cjs:35·50·53·60-61·418·500·547` | 항목 `topLayer`: `Art…Top` 엔티티의 층이 `Default`가 아니거나 순서가 5 미만이면 위반 |
| `tests/quality/map_composition/make_fixtures.cjs:64` → `28-toplayer.json` | 자가 테스트. MapLayer1/1 하나(위반)와 Default/5 하나(정상)를 넣고 기대값 1 |

## 3. 이름표 층 확인 값과 Top 순서 선택

- 이름표는 MSW 기본 `NameTagComponent`다(`Supporter.mlua:119`, `MotionSmoother.mlua:642` 등에서 Name·색만 쓴다). `Environment/NativeScripts/Component/NameTagComponent.d.mlua`에 있는 속성은 Bold·FontColor·FontOffset·FontSize·Name·NameTagRUID·OffsetY뿐이다. **SortingLayer·OrderInLayer 속성이 없다.** 그래서 이름표의 층·순서는 엔진 내부 값이고, 코드나 파일로는 읽을 수도 바꿀 수도 없다. MSW 문서(Map Layer 「Model's Layer Order」)에도 기본 순서는 오브젝트 0 · 타일 1 · 몬스터·NPC·아이템 2 · 남 아바타 3 · 내 아바타 4까지만 나오고 이름표 값은 없다.
- 프로젝트 코드에서 `Default` 층을 직접 쓰는 곳은 없다(`"Default"` 검색 0건). 효과·체력 막대·혼 구슬은 모두 `MapLayer0`이고 런타임에는 아바타보다 아래에 그려진다. 펫은 주인 아바타의 층·순서를 복사한다(`PetSystem.mlua:286-287`).
- 7차 실험(Default/10)에서는 사슬 기둥·검 무덤 뒤에서 이름표 가장자리가 가려졌다. 열주·거인 뒤에서는 이름표가 앞에 남았다. 따라서 엔진 이름표 순서는 10 미만이다.
- **선택은 순서 5다.** 내 아바타 4를 넘는 가장 낮은 값이다. 엔진 이름표 순서가 5 이상이면 이름표가 윗부분 위에 남는다. 이름표가 위에 남을 가능성이 가장 큰 값이다. 이름표 순서가 5 미만이면 층·순서로는 이름표를 앞에 둘 수 없다(API 없음). 이 경우는 메이커 판독(3-2) 결과로 결정한다.
- 같은 이유로 남 아바타(3)·몬스터(2)·MapLayer0 효과(혼 구슬 19 · 장판 예고 등)도 윗부분 뒤에 있으면 가려진다. 의도한 동작이다.

## 4. 열주 남열 「발 조각」 처리 — 놓지 않음

- 원인을 확인했다. 원본 그림이 발 아래까지 잘린 것이 아니다. **막힘 꼭대기가 자르는 선보다 아래**에 있다. 남열 열주(발 y -3.04)의 막힌 칸은 발 칸 floor(-3.04) = -4부터 2줄이라 꼭대기가 -2다. 자르는 선(구조 1/3)은 -3.04 + 208px × 1.734 × 1/3 ÷ 100 = **-1.837**이다(코덱스 PNG 실측 -1.90). 그래서 뒤에 붙어 서면 발(-1.99)이 자르는 선 아래로 0.09~0.16칸 나온다. 그 결과 원본 아랫부분 앞에 발이 그려지고 몸만 가려진다. 북열(3.16)은 막힘 꼭대기가 5, 자르는 선이 4.36이라 문제가 없다. 칸 경계 정렬(floor) 때문에 열마다 달라지는 것이다.
- 자르는 선 보정은 하지 않는다(코덱스 그림 그대로). 「자르는 선 위만 쓰는」 쪽은 지금 윗부분 그림이 이미 그 상태여서 발 조각이 그대로 남는다. 그래서 **놓지 않는** 쪽을 골랐다.
- 규칙은 일반화했다(`lib.cjs:957-963`). 자르는 선 y = 발 y + 그림 높이 × 배율 × 역할 비율(특징 1/2 · 구조 1/3, `roles.footFrac` = 코덱스 자르는 선과 같은 규칙)이다. 이 값이 발 칸 열의 막힘 꼭대기보다 위이거나 막힌 칸이 없으면 `-top`을 놓지 않는다. 피벗(0.014~0.023)은 빼지 않았다. 그만큼 자르는 선을 높게 잡으므로 놓지 않는 쪽으로 보수적이다. 남은 그림 중 가장 가까운 차이는 -0.55칸(제단)이라 영향이 없다.
- 결과: sanctum 열주 남열 6개(ArtProp29·31·33·35·37·39, 자르는 선 -1.837 > 막힘 꼭대기 -2), **sulfurmarsh 쓰러진 거인 1개(ArtProp10, 14.19 > 14)**. 거인도 같은 꼴(뒤에 서면 14.01 < 자르는 선 14.15, 실측)이라 같은 규칙에 걸렸다. 7차 실험에서 거인은 「몸 가려짐」 ✅이었다. 무릎 그림이 이어져 발 조각이 눈에 덜 띄었을 뿐 구조는 같다. 거인 뒤 가려짐을 살리려면 거인 막힘을 한 줄 늘리거나(args foot) 코덱스 자르는 선을 내리는 별도 결정이 필요하다.
- 엔티티: sanctum Top 23 → 17, sulfurmarsh 8 → 7(악몽·지옥 복제도 같음).

## 5. 테스트

- 표본 2장 다시 빌드(`layer-fix/build-samples.log`): sanctum 엔티티 348 → 342, sulfurmarsh 1233 → 1232. 놓지 않은 경고 6개·1개.
  - `map/`에서 바뀐 파일은 sanctum·sulfurmarsh와 그 `_nm`·`_hell` 6개뿐이다.
  - 맵 파일 읽기(MapBuilder): Top 17/7개가 모두 `Default/5`다. SortingLayer Default는 sanctum 18(= 17 + 원래 1) · sulfurmarsh 8(= 7 + 1)이고 MapLayer1은 0이다.
  - HEAD 빌드와 엔티티를 대조했다. 없어진 것은 위 Top 7개뿐이고 바뀐 것은 Top의 SpriteRenderer(층·순서)뿐이다. Top이 아닌 엔티티는 바뀐 것이 0이다.
- 검사기 `--map sanctum,sulfurmarsh`(`layer-fix/check-map-composition.log`·`.json`): **v5 위반 0**, 엔티티 합 46928/47900.
  - 같은 검사기를 HEAD 생성기로 돌리면 `topLayer` 위반이 sanctum 23 · sulfurmarsh 8로 나온다(`layer-fix/check-head-generator.log`). 옛 상태를 잡는다는 확인이다.
- 자가 테스트(`layer-fix/selftest.log`): 입력 29개 모두 통과, 심은 위반 38건 모두 검출, 오탐 0(28-toplayer 추가).
  - `make_fixtures.cjs`를 다시 돌렸을 때 기존 28개 json은 바이트 그대로다.
- 다른 64장 불변(`layer-fix/compare-66.log`): 설계도 맵 66장을 `--out`으로 두 번(HEAD lib.cjs / 수정 lib.cjs) 지어 바이트를 비교했다. **64장 같음**, 다른 것은 sanctum·sulfurmarsh 2장뿐이다.
- `npm test`(`layer-fix/npm-test.log`): **20/20 통과**.
- `.mlua` 빌드·런타임은 확인하지 않았다(메이커 금지). 메이커 레인이 refresh 뒤 build Error 0과 위 `[VRF]` 줄을 본다.

## 6. 메이커 확인 자리

`../2026-10-31-map-v5-sample/CAPTURE-PLAN.txt` 3-2(기대값 갱신).

- 반영 지문: Top 17/7 · 런타임 층/순서 Default/5 · `[VRF] DarkVision 윗부분 그림 17개는 순서 유지 (Default/5)`
- 11종 뒤에서 몸 가려짐 ✅
- 열주 남열·거인은 대조(앞에 그려짐)
- 이름표가 윗부분 위에 남는지(사슬 기둥·검 무덤 뒤)
- 앞 겹침·옆 잘림이 없는지
- 간헐천 두 겹은 그대로
