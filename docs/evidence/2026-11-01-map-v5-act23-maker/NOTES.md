# 맵 v5 액트 2·3 메이커 원조건 2회차 (11-01 03:39 ~ ) — 부딪혀 보기 · 웨이포인트 · 보스 기믹 자리 · 캡처 · 액트 1 Top

HEAD 176ededa(코드·맵 변경 없음)에서 메이커 단일 담당 2회차가 확인했다. 게임 코드·맵·데이터는 고치지 않았다. 스크립트는 모두 실행 중 메이커에 넣은 런타임 스크립트(`scripts/`). 1회차(03:29 끝)가 한 반영 지문 32/32 · 서버 칸 BFS 32/32(`../2026-11-01-map-v5-act3/maker/ACT23-SERVER.md`)는 다시 하지 않았다.

## 0. 반영·입력·저장

- refresh 안 함(지시대로). 메이커 편집 모드·map01에서 시작(`maker_get_current_map` = map01 `5a29ca07…`). build 로그 366줄 · **Error 0 · LEA-1102 0**(빌드 시각 03:34:39).
- 03:39:16 play → `[SelfTest] 통과 410 / 실패 0`(방 입장 뒤 409/0) · `[VRF] preload n=291 started=291`.
- 슬롯 4 「새내기」 입장 전 백업 재조회(server_main) **match 5/5 = S48 기준**(`logs/slot4-backup-at-start.txt`에 5키 원문).
- 03:40:24 BtnEnter → `[PlayerSave] 불러오기 완료 (슬롯 4)` → 03:40:34 `room enter game:s1bb8e21b5c7 town` (클라 `_RoomWindow:Solo()`).
- ⚠️ 방 이동 직후 보낸 클라 `execute_script`(로그 패딩 한 줄) 하나가 **30분 응답 없음**(03:40:4x → 04:10:53, 메모리 함정 그대로). 이후 클라 스크립트는 방 이동이 끝난 뒤에만 보냈다.
- 04:11:09 방 서버 guard: `IsLoadSuccess=false`(저장 끔) · 무적(타이머 0.2초 — 스크립트는 바로 끝나 뒤 스크립트를 줄 세우지 않음) · `known=camp,wasteland act=1`. 그 사이(03:40:46~04:11) 게임이 저장했을 수 있음 → 끝에 S48 본문 복원(아래 「슬롯 4」).
- 클라 기록기(`scripts/logger.lua`, 0.1초): 맵 도착 `at` · 움직였다 0.4초 멈추면 `stop from→end` · 웨이포인트 Known 변화 `known A -> B at (x, y)`.
- 선택 보상 창(칸 1 고를 차례)이 입장 때 자동으로 열림 → **Esc 실제 입력**으로 닫음(띠는 남음 · 이동 막지 않음).
- **키보드 입력 정상**(방향키 `maker_keyboard_input` tap). 모든 밀기·걷기는 실제 방향키 입력. 「준비」 = 서버 `PlayerTravel:Go`로 시작 칸에 세움(검증 대상 아님).

## 1. 부딪혀 보기 (액트 2 15장 · 액트 3 16장 · 맵마다 2곳 = 62 + 닻 옆 1)

**대상 고르기(오프라인 · `scripts/plan.cjs` → `scripts/plan.json`)**: 빌더와 같은 계산(`hm.artEntities`)으로 놓인 장식 조각 중 막는 조각(`block`)만 · 입구·계단 그림 제외 · 우선순위 = 랜드마크(`*landmark*`·`_lm_`) > 역할표 feature > structure > prop, 배치표 「손으로 고른 자리」 가산 · 맵마다 서로 다른 조각 2개. 막힌 칸은 **맵 파일 RectTileMap 충돌 칸(tileIndex 269)**과 같은 칸을 썼고, 그 칸 앞(밀기 방향 반대쪽) 3칸이 열려 있고 시작 칸이 포털·웨이포인트·NPC에서 3.2칸 밖인 줄만 골랐다.
**예상 멈춤**: 위로 → 막힌 칸 아래 변 −0.01 · 아래로 → 위 변 +0.01 · 왼쪽 → 오른 변 +0.01 · 오른쪽 → 왼 변 −0.01 (액트 1·4 회차와 같은 규칙). 시작은 막힌 칸에서 3칸 떨어진 칸 가운데(2.49칸 걷기) · 방향키 2.5초.
**판정**: 클라 기록기 `stop` 끝 좌표 = 예상(±0.02).

**결과: 62/62 예상 칸에서 멈춤 ✅** (+ 폭풍의 눈 닻 옆면 1 ✅). 원문 `logs/a23m-vrf.txt` · 화면 `shots/HHMMSS-<맵>-P1-*.jpg`(맵마다 첫 밀기 1장).

| 액트 | 맵 | 모드 | # | 방향 | 시작(준비) | 예상 | 멈춘 좌표(실제 입력) | 판정 | 근거(그림 · 역할 · 조각 · 막힌 칸 · 배치표 메모) |
|---|---|---|---|---|---|---|---|---|---|
| 2 | oasis 오아시스 시장 | keep | P1 | ← | (-8.50, -2.50) | (-10.99, -2.50) | (-10.99, -2.50) | ✅ | a2-landmark-caravan-well (feature) ArtProp7 막힌 칸 (-12, -3) · 천막 거리 · v5 특징 [foot=0.67] |
| 2 | oasis 오아시스 시장 | keep | P2 | ↑ | (-6.50, 6.50) | (-6.50, 8.99) | (-6.50, 8.99) | ✅ | palm (structure) ArtProp2 막힌 칸 (-7, 9) · 손으로 고른 자리 [padl=3] |
| 2 | dunes 뜨거운 모래 언덕 (Lv 13~14) | keep | P1 | ↑ | (13.50, -11.50) | (13.50, -9.01) | (13.50, -9.01) | ✅ | a2-landmark-buried-caravan (feature) ArtSet3_1 막힌 칸 (13, -9) |
| 2 | dunes 뜨거운 모래 언덕 (Lv 13~14) | keep | P2 | ↑ | (-11.50, 9.50) | (-11.50, 11.99) | (-11.50, 11.99) | ✅ | a2-giant-beast-skull (feature) ArtSet1_1 막힌 칸 (-12, 12) |
| 2 | canyon 메마른 협곡 (Lv 14~15) | keep | P1 | ↑ | (13.50, 12.50) | (13.50, 14.99) | (13.50, 14.99) | ✅ | a2-landmark-dry-waterwheel (feature) ArtProp3 막힌 칸 (13, 15) · 갈라진 바위턱 · v5 특징 · a2_lm_dry_waterwheel 조각 [foot=0.67] |
| 2 | canyon 메마른 협곡 (Lv 14~15) | keep | P2 | ↑ | (11.50, -14.50) | (11.50, -12.01) | (11.50, -12.01) | ✅ | well (feature) ArtProp1 막힌 칸 (11, -12) · 손으로 고른 자리 |
| 2 | stormwaste 바람 무덤 사막 (Lv 15~16) | keep | P1 | ↑ | (1.50, 15.50) | (1.50, 17.99) | (1.50, 17.99) | ✅ | a2-landmark-wind-tomb-pillar (feature) ArtSet3_1 막힌 칸 (1, 18) |
| 2 | stormwaste 바람 무덤 사막 (Lv 15~16) | keep | P2 | ↑ | (-9.50, 9.50) | (-9.50, 11.99) | (-9.50, 11.99) | ✅ | wind-stele (structure) ArtProp6 막힌 칸 (-10, 12) · 손으로 고른 자리 |
| 2 | sunkenroad 가라앉은 대로 (Lv 16~17) | keep | P1 | ↑ | (28.50, 5.50) | (28.50, 7.99) | (28.50, 7.99) | ✅ | a2-landmark-sunken-triumph-arch (feature) ArtProp19 막힌 칸 (28, 8) · 사원 문 앞 성벽 · v5 특징 [foot=0.67] |
| 2 | sunkenroad 가라앉은 대로 (Lv 16~17) | keep | P2 | ← | (6.50, 2.50) | (4.01, 2.50) | (4.01, 2.50) | ✅ | a2-crowned-colossus-head (feature) ArtProp15 막힌 칸 (3, 2) · 거상 보루 · v5 특징 · a2_colossus 조각 [foot=0.67] |
| 2 | scorpnest1 전갈 굴 1층 (Lv 14) | keep | P1 | ↑ | (1.50, 4.50) | (1.50, 6.99) | (1.50, 6.99) | ✅ | a2-landmark-venom-pool-rock (feature) ArtSet1_1 막힌 칸 (1, 7) |
| 2 | scorpnest1 전갈 굴 1층 (Lv 14) | keep | P2 | ↑ | (14.50, -11.50) | (14.50, -9.01) | (14.50, -9.01) | ✅ | a2-rib-arch (feature) ArtSet2_1 막힌 칸 (14, -9) |
| 2 | scorpnest2 전갈 굴 2층 (Lv 15) | keep | P1 | ↑ | (-18.50, 2.50) | (-18.50, 4.99) | (-18.50, 4.99) | ✅ | a2-landmark-scorpion-egg-nest (feature) ArtSet1_1 막힌 칸 (-19, 5) |
| 2 | scorpnest2 전갈 굴 2층 (Lv 15) | keep | P2 | ↑ | (-15.50, 1.50) | (-15.50, 3.99) | (-15.50, 3.99) | ✅ | a2-adjunct-sandstone-fragments (prop) ArtSet1_3 막힌 칸 (-16, 4) |
| 2 | drywell 버려진 우물 (Lv 15) | keep | P1 | ↑ | (16.50, 6.50) | (16.50, 8.99) | (16.50, 8.99) | ✅ | a2-landmark-dry-well-pulley (feature) ArtSet1_1 막힌 칸 (16, 9) |
| 2 | drywell 버려진 우물 (Lv 15) | keep | P2 | ↑ | (-21.50, -1.50) | (-21.50, 0.99) | (-21.50, 0.99) | ✅ | a2-adjunct-broken-waterjug (prop) ArtProp1 막힌 칸 (-22, 1) · 우물 바닥 · v5 소품 묶음 |
| 2 | kingtomb1 왕들의 묘실 1층 (Lv 16) | v5 | P1 | ↑ | (-11.50, -12.50) | (-11.50, -10.01) | (-11.50, -10.01) | ✅ | a2-landmark-golden-mask-wall (feature) ArtProp6 막힌 칸 (-12, -10) · 부장품 방 · v5 특징 [foot=0.67] |
| 2 | kingtomb1 왕들의 묘실 1층 (Lv 16) | v5 | P2 | ↑ | (17.50, 0.50) | (17.50, 2.99) | (17.50, 2.99) | ✅ | a2-crowned-colossus-head (feature) ArtProp7 막힌 칸 (17, 3) · 석관 방 · v5 특징 [foot=0.67] |
| 2 | kingtomb2 왕들의 묘실 2층 (Lv 17) | v5 | P1 | ↑ | (16.50, 7.50) | (16.50, 9.99) | (16.50, 9.99) | ✅ | a2-landmark-guardian-king-sarcophagus (feature) ArtSet1_1 막힌 칸 (16, 10) |
| 2 | kingtomb2 왕들의 묘실 2층 (Lv 17) | v5 | P2 | ↑ | (22.50, -5.50) | (22.50, -3.01) | (22.50, -3.01) | ✅ | tomb-door (structure) ArtProp1 막힌 칸 (22, -3) · 손으로 고른 자리 |
| 2 | archive 잊힌 서고 (Lv 18) | v5 | P1 | ↑ | (20.50, 5.50) | (20.50, 7.99) | (20.50, 7.99) | ✅ | a2-landmark-burning-bookshelf-tower (feature) ArtProp13 막힌 칸 (20, 8) · 불탄 금서실 · v5 특징 [wall=1] |
| 2 | archive 잊힌 서고 (Lv 18) | v5 | P2 | ↑ | (-3.50, 12.50) | (-3.50, 14.99) | (-3.50, 14.99) | ✅ | bookshelf (structure) ArtProp2 막힌 칸 (-4, 15) · 북쪽 열람실 · v5 벽 따라 열 [wall=1] |
| 2 | vipernest 독사의 둥지 (Lv 17) | keep | P1 | ← | (0.50, -5.50) | (-1.99, -5.50) | (-1.99, -5.50) | ✅ | a2-landmark-coiled-serpent-column (feature) ArtProp1 막힌 칸 (-3, -6) · 독사의 둥지 · v5 특징 · a2_lm_serpent_column 조각 [foot=0.67] |
| 2 | vipernest 독사의 둥지 (Lv 17) | keep | P2 | ↑ | (-3.50, 9.50) | (-3.50, 11.99) | (-3.50, 11.99) | ✅ | desert-rock (prop) ArtProp11 막힌 칸 (-4, 12) · 허물 굴 · v5 소품 묶음 |
| 2 | temple1 잊힌 사원 1층 (Lv 17~18) | v5 | P1 | ↑ | (15.50, 10.50) | (15.50, 12.99) | (15.50, 12.99) | ✅ | bookshelf (structure) ArtProp10 막힌 칸 (15, 13) · 필사실 · v5 벽 따라 열 [wall=1] |
| 2 | temple1 잊힌 사원 1층 (Lv 17~18) | v5 | P2 | ↑ | (20.50, 10.50) | (20.50, 12.99) | (20.50, 12.99) | ✅ | bookshelf (structure) ArtProp13 막힌 칸 (20, 13) · 필사실 · v5 벽 따라 열 [wall=1] |
| 2 | temple2 잊힌 사원 2층 (Lv 18~19) | v5 | P1 | ↑ | (-3.50, 5.50) | (-3.50, 7.99) | (-3.50, 7.99) | ✅ | wind-stele (structure) ArtProp4 막힌 칸 (-4, 8) · 갈림 방 · v5 벽 따라 열 [wall=1;padr=1] |
| 2 | temple2 잊힌 사원 2층 (Lv 18~19) | v5 | P2 | ↑ | (-0.50, 5.50) | (-0.50, 7.99) | (-0.50, 7.99) | ✅ | wind-stele (structure) ArtProp5 막힌 칸 (-1, 8) · 갈림 방 · v5 벽 따라 열 [wall=1] |
| 2 | temple3 잊힌 사원 3층 (Lv 21~22) | v5 | P1 | ↑ | (2.50, 2.50) | (2.50, 4.99) | (2.50, 4.99) | ✅ | a2-landmark-singing-sand-altar (feature) ArtProp11 막힌 칸 (2, 5) · 태양 제단실 · v5 특징 · a2_lm_singing_altar 조각 [wall=1] |
| 2 | temple3 잊힌 사원 3층 (Lv 21~22) | v5 | P2 | ↑ | (13.50, 12.50) | (13.50, 14.99) | (13.50, 14.99) | ✅ | bookshelf (structure) ArtProp4 막힌 칸 (13, 15) · 필사실 · v5 벽 따라 열 [wall=1] |
| 3 | harbor 소금바람 항구 | keep | P1 | ← | (14.50, 6.50) | (12.01, 6.50) | (12.01, 6.50) | ✅ | a3-landmark-harbor-anchor-monument (feature) ArtProp1 막힌 칸 (11, 6) · 손으로 고른 자리 |
| 3 | harbor 소금바람 항구 | keep | P2 | → | (1.50, 8.50) | (3.99, 8.50) | (3.99, 8.50) | ✅ | harbor-lantern (structure) ArtProp6 막힌 칸 (4, 8) · 손으로 고른 자리 [ok=gate] |
| 3 | saltflat 소금 갯벌 (Lv 22~23) | keep | P1 | ↑ | (17.50, -11.50) | (17.50, -9.01) | (17.50, -9.01) | ✅ | a3-landmark-salt-crystal-spire (feature) ArtSet2_1 막힌 칸 (17, -9) |
| 3 | saltflat 소금 갯벌 (Lv 22~23) | keep | P2 | ↑ | (-10.50, 9.50) | (-10.50, 11.99) | (-10.50, 11.99) | ✅ | a3-leviathan-bones (feature) ArtSet1_1 막힌 칸 (-11, 12) |
| 3 | wreckcoast 난파선 해안 (Lv 23~24) | keep | P1 | ↑ | (9.50, 10.50) | (9.50, 12.99) | (9.50, 12.99) | ✅ | a3-landmark-ship-wheel-graveyard (feature) ArtProp8 막힌 칸 (9, 13) · 선창 어귀 · v5 특징 · a3_lm_wheel_graveyard 조각 [foot=0.67] |
| 3 | wreckcoast 난파선 해안 (Lv 23~24) | keep | P2 | ↑ | (-14.50, 7.50) | (-14.50, 9.99) | (-14.50, 9.99) | ✅ | a3-figurehead-bow (feature) ArtProp5 막힌 칸 (-15, 10) · 뱃머리 난파선 · v5 특징 · a3_bow_wreck 조각 [foot=0.67] |
| 3 | stormcliff 번개 절벽 (Lv 24~25) | keep | P1 | ← | (2.50, 4.50) | (0.01, 4.50) | (0.01, 4.50) | ✅ | a3-landmark-lightning-totem (feature) ArtProp5 막힌 칸 (-1, 4) · 번개 맞은 바위 · v5 특징 · a3_lm_lightning_totem 조각 [foot=0.67] |
| 3 | stormcliff 번개 절벽 (Lv 24~25) | keep | P2 | ↑ | (-15.50, 14.50) | (-15.50, 16.99) | (-15.50, 16.99) | ✅ | a3-fallen-lighthouse-top (feature) ArtProp2 막힌 칸 (-16, 17) · 무너진 등대 꼭대기 · v5 특징 · a3_lighthouse_fall 조각 [foot=0.67] |
| 3 | drownedvillage 가라앉은 어촌 (Lv 25~26) | keep | P1 | ↑ | (-7.50, 9.50) | (-7.50, 11.99) | (-7.50, 11.99) | ✅ | a3-landmark-drowned-belfry-roof (feature) ArtSet2_1 막힌 칸 (-8, 12) |
| 3 | drownedvillage 가라앉은 어촌 (Lv 25~26) | keep | P2 | ↑ | (-12.50, -16.50) | (-12.50, -14.01) | (-12.50, -14.01) | ✅ | a3-leviathan-bones (feature) ArtSet3_1 막힌 칸 (-13, -14) |
| 3 | crabcave1 집게 동굴 1층 (Lv 23) | keep | P1 | ↑ | (-1.50, 3.50) | (-1.50, 5.99) | (-1.50, 5.99) | ✅ | a3-landmark-shell-mound (feature) ArtSet1_1 막힌 칸 (-2, 6) |
| 3 | crabcave1 집게 동굴 1층 (Lv 23) | keep | P2 | ↑ | (-4.50, 2.50) | (-4.50, 4.99) | (-4.50, 4.99) | ✅ | a3-kelp-rock (prop) ArtSet1_3 막힌 칸 (-5, 5) |
| 3 | crabcave2 집게 동굴 2층 (Lv 24) | keep | P1 | ↑ | (17.50, 5.50) | (17.50, 7.99) | (17.50, 7.99) | ✅ | a3-landmark-crab-king-shell-throne (feature) ArtProp1 막힌 칸 (17, 8) · 손으로 고른 자리 [wall=1] |
| 3 | crabcave2 집게 동굴 2층 (Lv 24) | keep | P2 | ↑ | (20.50, 4.50) | (20.50, 6.99) | (20.50, 6.99) | ✅ | a3-kelp-rock (prop) ArtProp3 막힌 칸 (20, 7) · 손으로 고른 자리 |
| 3 | wreckhold 난파선 선창 (Lv 24) | keep | P1 | ↑ | (3.50, 2.50) | (3.50, 4.99) | (3.50, 4.99) | ✅ | a3-landmark-chained-cargo-souls (feature) ArtProp1 막힌 칸 (3, 5) · 짐칸 · v5 특징 · a3_lm_cargo_souls 조각 [foot=0.67;fill=3/8,2/8,1/8] |
| 3 | wreckhold 난파선 선창 (Lv 24) | keep | P2 | ↑ | (-10.50, 5.50) | (-10.50, 7.99) | (-10.50, 7.99) | ✅ | a3-kelp-rock (prop) ArtSet2_1 막힌 칸 (-11, 8) |
| 3 | smuggler1 밀수꾼 동굴 1층 (Lv 25) | keep | P1 | ↑ | (12.50, -10.50) | (12.50, -8.01) | (12.50, -8.01) | ✅ | a3-landmark-contraband-crate-tower (feature) ArtSet1_1 막힌 칸 (12, -8) |
| 3 | smuggler1 밀수꾼 동굴 1층 (Lv 25) | keep | P2 | ↑ | (-20.50, 2.50) | (-20.50, 4.99) | (-20.50, 4.99) | ✅ | harbor-lantern (structure) ArtProp2 막힌 칸 (-21, 5) · 등불 우물방 · v5 벽 따라 열 [wall=1;padr=1] |
| 3 | smuggler2 밀수꾼 동굴 2층 (Lv 26) | keep | P1 | ↑ | (-17.50, 8.50) | (-17.50, 10.99) | (-17.50, 10.99) | ✅ | a3-landmark-smuggler-map-table (feature) ArtSet1_1 막힌 칸 (-18, 11) |
| 3 | smuggler2 밀수꾼 동굴 2층 (Lv 26) | keep | P2 | ↑ | (-14.50, 7.50) | (-14.50, 9.99) | (-14.50, 9.99) | ✅ | a3-drift-crates (prop) ArtSet1_2 막힌 칸 (-15, 10) |
| 3 | seachapel 물에 잠긴 예배당 (Lv 26) | v5 | P1 | ↑ | (-20.50, 4.50) | (-20.50, 6.99) | (-20.50, 6.99) (첫 시도 -20.50, 6.88 — 아래 ⚠️) | ✅ | a3-landmark-blue-flame-pulpit (feature) ArtProp1 막힌 칸 (-21, 7) · 물에 잠긴 제단 · v5 특징 · a3_lm_blue_pulpit 조각 [wall=1] |
| 3 | seachapel 물에 잠긴 예배당 (Lv 26) | v5 | P2 | ↑ | (-15.50, -7.50) | (-15.50, -5.01) | (-15.50, -5.01) | ✅ | chapel-pillar (structure) ArtProp4 막힌 칸 (-16, -5) · 물에 잠긴 제단 · v5 열주 |
| 3 | keeperhouse 등대지기의 집 (Lv 28) | keep | P1 | ↑ | (-21.50, 8.50) | (-21.50, 10.99) | (-21.50, 10.99) | ✅ | a3-landmark-mad-lens-workbench (feature) ArtProp1 막힌 칸 (-22, 11) · 손으로 고른 자리 [fill=-24/12,-24/11,-25/11] |
| 3 | keeperhouse 등대지기의 집 (Lv 28) | keep | P2 | ↑ | (9.50, -12.50) | (9.50, -10.01) | (9.50, -10.01) | ✅ | keeper-desk (feature) ArtProp2 막힌 칸 (9, -10) · 서재 굴 · v5 특징 [foot=0.67] |
| 3 | lighthouse1 폭풍 등대 1층 (Lv 26~27) | v5 | P1 | ← | (-1.50, -3.50) | (-3.99, -3.50) | (-3.99, -3.50) | ✅ | harbor-lantern (structure) ArtProp5 막힌 칸 (-5, -4) · 등대 홀 · v5 벽 따라 열 |
| 3 | lighthouse1 폭풍 등대 1층 (Lv 26~27) | v5 | P2 | ↓ | (-7.50, -0.50) | (-7.50, -2.99) | (-7.50, -2.99) | ✅ | harbor-lantern (structure) ArtProp4 막힌 칸 (-8, -4) · 등대 홀 · v5 벽 따라 열 |
| 3 | lighthouse2 폭풍 등대 2층 (Lv 29~30) | v5 | P1 | ↑ | (-1.50, 10.50) | (-1.50, 12.99) | (-1.50, 12.99) | ✅ | a3-landmark-broken-lens-stand (feature) ArtSet2_1 막힌 칸 (-2, 13) |
| 3 | lighthouse2 폭풍 등대 2층 (Lv 29~30) | v5 | P2 | ↑ | (-9.50, 0.50) | (-9.50, 2.99) | (-9.50, 2.99) | ✅ | harbor-lantern (structure) ArtProp1 막힌 칸 (-10, 3) · 긴 나선 회랑 · v5 벽 따라 열 [wall=1;padr=1] |
| 3 | lighthouse3 폭풍 등대 3층 (Lv 30~31) | v5 | P1 | ↑ | (-19.50, 2.50) | (-19.50, 4.99) | (-19.50, 4.99) | ✅ | a3-landmark-storm-bell (feature) ArtSet1_1 막힌 칸 (-20, 5) |
| 3 | lighthouse3 폭풍 등대 3층 (Lv 30~31) | v5 | P2 | ↑ | (-21.50, 6.50) | (-21.50, 8.99) | (-21.50, 8.99) | ✅ | harbor-lantern (structure) ArtProp4 막힌 칸 (-22, 9) · 렌즈 홀 · v5 벽 따라 열 [wall=1;padr=1] |
| 3 | stormeye 폭풍의 눈 (등대 꼭대기) | v5 | P1 | ↑ | (-17.50, 5.50) | (-17.50, 7.99) | (-17.50, 7.99) | ✅ | a3-landmark-admiral-anchor-wreck (feature) ArtProp1 막힌 칸 (-18, 8) · 폭풍의 눈 · v5 특징 · a3_lm_admiral_anchor 조각 [foot=0.67] |
| 3 | stormeye 폭풍의 눈 (등대 꼭대기) | v5 | P2 | ↑ | (-3.50, -5.50) | (-3.50, -3.01) | (-3.50, -3.01) | ✅ | harbor-lantern (structure) ArtProp2 막힌 칸 (-4, -3) · 폭풍의 눈 · v5 열주 |
| 3 | stormeye 폭풍의 눈 (등대 꼭대기) | v5 | P1옆 | ← | (-13.50, 8.50) | (-15.99, 8.50) | (-15.99, 8.50) | ✅ | a3-landmark-admiral-anchor-wreck (feature) ArtProp1 막힌 칸 (-16, 8) · 같은 닻 동쪽 면(보스 자리 비켜서) |

- ⚠️ seachapel P1 첫 시도는 (−20.50, 6.88)에서 다음 준비 이동(04:29:07)이 끼어 끝 좌표가 텔레포트 직전 값으로 찍혔다. 그 자리는 끝방 우두머리 「물에 잠긴 사제 세드릭」과 졸개가 선 곳이라 냉기 둔화(`speed restored 1.04 → 1.73` 로그)로 2.5초에 다 못 걸은 것. 같은 입력을 4초로 다시 → **(−20.50, 6.99)** ✅ (`shots/043040-seachapel-P1-retry-*`).
- 폭풍의 눈 P1(닻 위로)은 보스 기믹 걷기(아래 3) 중엔 제독 둔화로 (−17.60, 5.65)에서 입력이 끝났고, 따로 (−17.50, 5.50)에서 다시 밀어 **(−17.50, 7.99)** ✅. 같은 닻 동쪽 면 옆 밀기도 **(−15.99, 8.50)** ✅.
- stormcliff P1(피뢰 토템 왼쪽) 끝 (0.01, 4.50)은 그 맵 웨이포인트(−1.5, 3.5) 반경 2.0 안이라 거기서 활성화 로그가 같이 찍혔다(옮긴 웨이포인트 맵 아님 · 저장 끔).

## 2. 옮긴 웨이포인트 도달 (액트 2 3곳 · 액트 3 3곳)

방법: 준비 = 웨이포인트 칸에서 서쪽 7칸(같은 줄 · 10칸 연속 열린 길)에 세움(반경 2.0 밖 · 아직 모르는 웨이포인트) → **실제 입력 → 방향키 4.85초** 걷기. 활성 = 클라 기록기 `known` 변화(그 순간 발 좌표) + 서버 `srv known` 재조회 + 화면 배너 「웨이포인트 활성화 · <맵>」. 시작 Known = `camp,wasteland`.

| 액트 | 맵 | 옮긴 자리(요약 근거) | 웨이포인트 칸 | 시작(준비) | 활성 로그(시각 · 발) | 멈춘 좌표(실제 입력) | 칸 안 |
|---|---|---|---|---|---|---|---|
| 2 | dunes 뜨거운 모래 언덕 | (1,1)→(0,−1) 묻힌 옛길 바로 북쪽 | (0,−1) = 0.5/−0.5 | (−6.50, −0.50) | 04:13:10 `→ …,dunes` 발 (−1.05, −0.50) · 서버 known 04:13:11 | 첫 걷기(4.3초) (−0.28, −0.50) 반경 안·칸 앞 → 4.85초로 다시 **(0.51, −0.50)** (04:35:31) | ✅ |
| 2 | canyon 메마른 협곡 | (−2,1)→(−2,2) 협곡 입구→분지 골격 곁 | (−2,2) = −1.5/2.5 | (−8.50, 2.50) | 04:14:32 `→ …,canyon` 발 (−2.94, 2.50) | **(−1.49, 2.50)** | ✅ |
| 2 | sunkenroad 가라앉은 대로 | (3,−3)→(1,−3) 거상 보루 골격 곁 | (1,−3) = 1.5/−2.5 | (−5.50, −2.50) | 04:16:07 `→ …,sunkenroad` 발 (0.17, −2.50) | 첫 걷기 끝 좌표는 다음 준비 이동이 0.4초 안에 와 안 찍힘(화면 `041608` 문양 위) → 다시 **(1.54, −2.50)** (04:35:17) | ✅ |
| 3 | saltflat 소금 갯벌 | 둑길 바로 북쪽 | (−4,−3) = −3.5/−2.5 | (−10.50, −2.50) | 04:23:35 `→ …,saltflat` 발 (−4.59, −2.50) | **(−3.46, −2.50)** | ✅ |
| 3 | wreckcoast 난파선 해안 | 해안길 바로 북쪽 | (0,−1) = 0.5/−0.5 | (−6.50, −0.50) | 04:24:50 `→ …,wreckcoast` 발 (−1.05, −0.50) | **(0.51, −0.50)** | ✅ |
| 3 | drownedvillage 가라앉은 어촌 | x 3 샛길 바로 곁 | (2,1) = 2.5/1.5 | (−4.50, 1.50) | 04:25:38 `→ …,drownedvillage` 발 (1.02, 1.50) | **(2.57, 1.50)** | ✅ |

- 6/6 걸어서 웨이포인트 칸 안 도달 · 활성 로그 6/6(활성은 모두 반경 2.0 안에 들어선 순간 — 서버 0.5초 검사). 화면: `shots/*-WP-walk-end.jpg`(문양 위 「Space · 웨이포인트」 안내 · 켜진 문양).
- 걷기 속도 실측 ≈ 1.45칸/초(4.3초 6.22칸 · 4.85초 7.04칸).

## 3. 보스 기믹 자리 도달 (전투 없음 · 공격 입력 0)

| 맵 | 보스 자리(파일 = 런타임) | 걷기(실제 입력) | 도달 | 기믹 반응(로그) |
|---|---|---|---|---|
| temple2 잊힌 사원 2층 (v5 보스) | 창의 문지기 아슈 (14.50, −1.50) · 방패의 문지기 나슈 (14.50, 4.50) — 도착 시 서버 위치 = 파일 · `quest gate show gate_brother(_shield) quest 11` | 준비: 문지기의 전당 서쪽 (6.50, 2.50) → → 5.6초 → ↑ 4초 | → **(14.52, 2.50)** 쌍둥이 문지기 사이(04:22:06) → ↑ **(14.52, 6.99)** 사자 쌍 계단 문(14.5, 7.55 wall=1) 발밑 막힌 줄 7에서 멈춤(04:22:11) | 04:21:57 `boss move charge #1` 두 문지기 · 04:22:10 `#2` (보스 공용 패턴 돌진) — 맞아도 무적·공격 안 함 |
| stormeye 폭풍의 눈 (v5 보스) | 익사한 제독 바렌 (−17.50, 4.50) = 파일 · `quest gate show admiral quest 18` | 준비: 폭풍의 눈 축 (−6.50, 0.50) → ← 7.7초 → ↑ 5초 | ← **(−17.60, 0.50)** 제독 남쪽 축(04:32:43) → ↑ (−17.60, 5.65) 제독 자리(냉기 둔화 1.04로 입력 끝) | 04:32:37 `boss totems 2 minion=drownedsailor form=totem_a3`(보스방 토템 기믹) · 04:32:41 `boss move wall #1` · 04:32:52 `charge #2` · 닻(−17.5, 8.9) 뒤 칸: 위 1절 P1 (−17.50, 7.99) · 옆 (−15.99, 8.50) |

- 화면: `shots/042200-temple2-BOSS-arrive-hall-west` · `042205-…-between-wardens` · `042211-…-lion-gate-front`(문지기 나슈·미라 매복 상자) · `043235-stormeye-BOSS-arrive-axis` · `043243-…-south-of-admiral` · `043251-…-up-toward-anchor`(제독과 겹침).
