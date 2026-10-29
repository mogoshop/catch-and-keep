# 갈래 D — I06 대표 4맵 동선·출현 구역 · I08 현장 보고·첫 장비 관측 · I07 재질 접합 소스 준비 (2026-10-30)

근거: 코덱스 `goal-progression-execution-0030.json`(권위) · `goal-followup-decisions-0035.txt` 1~3항 · 0038 범위 답변 · `goal-I07-material-decision-0045.json`. 기준 main **4ba51d5e**, 브랜치 `wip/goal-D-maps-progress`. 메이커는 쓰지 않았다(관찰은 아래 maker_queue). 생성물(map 12개 · GameData · maps.csv 4줄)은 로컬 검증용이고 정본은 spec·CSV·코드 — 부모가 통합 때 다시 만든다.

## 1. I06 대표 4맵 — compose 최종 단계 맵 id 한정 덮어쓰기

- `data/handmade/specs/overrides.cjs` — `compose.cjs main`이 액트 설계서를 다 읽은 뒤 **그 id 하나에만** 적용. 원형 `A1.crypt1~3` 객체는 그대로라 remix 형제(사원 1층·등대 2층·심연의 문 1층 등)에 번지지 않는다.
- 증명 `logs/compose_all_A_vs_B.txt`: 기준 사본 A와 (기준 + compose.cjs·overrides.cjs) 사본 B에서 **액트 1~4 설계서 전부** compose → 다른 파일은 대상 4맵 txt·csv · maps.csv 4줄 · 새 spawn_zones.csv뿐 (나머지 62맵 설계도·배치표 바이트 동일). `logs/generated_scope.txt`: 기준 대비 생성물 변경은 4맵 설계도·배치표 + map **정확히 12개**. `tools/build.cjs maps` 전체 재빌드 안 함(4 id 빌드만).
- 주의(기준 상태): 커밋된 액트 3·4 설계도 다수는 지금 설계서로 fresh compose한 결과와 이미 다르다(장식·화로 자리 — 예전 compose/손 이동분). 대상 4맵은 다시 compose했으므로 장식·화로 자리도 새로 정해졌다(동선 변경에 따르는 것). 다른 맵은 compose하지 않았다.

| 맵 | 바뀐 동선 (전 → 후, 설계도 BFS 칸 — 시간 아님) | 보존 |
|---|---|---|
| crypt2 | W→E 57 → **57**(회랑 그대로) · 유물 곁방 c = 13×4 좁은 시험방(입구 폭 2) · 구덩이 e = 21×11 넓은 시험방(입구 폭 4) · 곁방끼리 고리(c↔d · e↔f) 제거 → 두 방 모두 막다른 선택 방 | W(-29,0)·E(28,0) · 출현 43/43/43 · 포털 2 · q6 경로(crypt1→2→3) |
| temple2 | 직선 W→전당 길 제거 → 남쪽 **긴 기둥 회랑**(b, 기둥 6) / 북쪽 **짧은 곁길**(막사 굴 c → 갈림 방 d) 두 접근이 전당에서 합류 · 아슈(14.5/-1.5)까지 남 52 · 북 58, 나슈(14.5/4.5)까지 북 52 · 남 58 (전 46 단일) · W→E 57 → 69 | 문지기 두 자리·처치 목표·분노 · 출현 40 · 포털 2 · 기둥은 길 좁힘(엄폐·LOS 주장 없음) |
| lighthouse1 | 계단참→홀 직선 제거 → 바깥 남(b)·북(c) 길 → 안쪽 등대 홀(웨이포인트) 48/50 · **홀→E 39 → 27**(곧은 퇴장, 곁방 없이 27) · W→E 71 → 73 | W·E·등대지기 집 입구 H(12.5,-7.5)·길 위 상자(-22.5,11.5)·웨이포인트 · floormix·바닥 정책 · 출현 44 |
| demonroad | 포장 행군로 주 전진로(W→E 79 그대로) + 야영지 동쪽에서 갈라지는 **보급 성벽 우회로**가 동쪽 행군로 어귀에서 합류 · 길 위 상자 (-20.5,4.5) → **(20.5,10.5)** (최단 경로까지 2.0 → 8.0칸, roadChestRadius 2 밖 · 상자 경유 W→상자→E 95) | 상자 수 1 · 출현 44 · 풀·리젠 60초 · q19 60처치 · 웨이포인트·혼 감옥 입구 · 재질 패치 미적용 |

- 수치: `logs/route_cmp.json`(맵별 전·후 바닥 칸·경로·포털/웨이포인트/스포너 엔티티 수 · 난이도 3파일). 엔티티 수의 `Monster` 칸은 `script.MonsterSpawner` 문자열도 세는 표기(고정 몬스터 수 변화 없음: temple2 문지기 2 그대로).
- `--check` 경고(`logs/check_acts_base_vs_work.txt`): 대상 4맵 줄만 다름. lighthouse1 「장식 사이 갇힌 바닥 2칸」, demonroad 「앞면 띠 3·가장자리 띠 36·갇힌 바닥 5칸·재질 접합 등록 필요」 — 모두 「오류 아님」류(자동 충돌 칸). 기준을 fresh compose해도 demonroad 갇힌 바닥 4칸이 나온다.

## 2. 출현 구역 (MonsterSpawner)

- 경로: 설계서 `spawnZones`(구역 글자 → 장소 칸 사각형 · 또는 `r`) → compose → `data/spawn_zones.csv`(맵 id 순) → `gen_data` → `GameData.MapSpawns[id].zones`(4맵만, 다른 맵 줄 바이트 동일) → `MonsterSpawner.LoadFromData`.
- 동작: 무리 수·크기·큰 무리·우두머리·섞임·유입 30% 분할은 **그대로 먼저 정하고**, 무리 중심만 `ZoneFor`(모델 id · `@원형` · `*`, 구역마다 share 몫 · 처음 0.5 반올림)로 고른 구역 ∩ 출현 범위에서 `ValidSpawn`(입구 안전 반경·벽 5점) 통과 자리로. 무리 안 자리도 구역 안으로 clamp + ValidSpawn. 자리가 없으면 맵 전체로 가고 `fallback`으로 센다. 구역 없는 맵은 `Zones = nil` → 예전과 같은 코드 경로.
- `[VRF] spawner zones map=… want=… placed=… pool=… same=true|false zonedPacks=… fallback=… units: c=… e=…`
- 구역 안전 칸 `logs/zone_valid.txt`: lighthouse1 홀(d)은 웨이포인트 안전 반경(8칸) 안이라 7칸뿐, 남쪽 창고 회랑(b)은 등대지기 집 입구 반경이라 0칸 → 홀 남·북 **문턱**(15·14칸)과 북쪽 저장고(105칸)로 바꿨다.
- 오프라인 `tests/quality/spawn_zones.lua`(실제 SpawnAll 본문 · 4맵×3난이도×200시드 · 벽=설계도): 모든 경우 **요청 = 배치 + 풀**, 구역 켬/끔 **배치 수 같음**, 벽·입구 반경 위 0, fallback 평균 0.00. 구역 무리/회: crypt2 4.0~4.7 · temple2 6.6~6.8 · lighthouse1 3.7~3.8 · demonroad 2.0. 종별 산 수가 요청과 같다고는 주장하지 않는다(섞임·유입 난수).

## 3. I08

- **현장 보고**: `PlayerQuest.NearGiver` = 기존 NPC 근처 **또는** `FieldHandoffOk` — config `questFieldHandoff`(4) 의식 의뢰의 `QuestMarker`(blood_altar)를 **서버가 맵에서 찾아** 거리 `questFieldHandoffRange`(2.5) 안 · `Index=4·State=2`(보고) 또는 `Index=5·State=0`(수락)만 · 두 의뢰 의뢰인 같음 · 맵 base gallows · 그 난이도(서버 Diff) · 생존. RequestAccept/RequestTurnIn의 소유자·expectedIndex·State 방어와 TurnIn 지급·가방 검사·저장 형식(ByDiff·Sealed·ChoicePicks·ChoiceTiers·저장 키)은 그대로. 마을 오렌 경로 유지. `questFieldHandoff=0` 한 줄로 끈다.
- **명시 상호작용**: `NpcWindow` — NPC가 없고 그 차례이고 제단 2.2칸·시야 안이면 같은 안내 단추(「Space · 피의 제단」/「피의 제단 · 대화」) → 의뢰인 대화 화면(초상화 오렌, 제목 「피의 제단」) 그대로. 자동 보고·자동 수락 없음. 클라이언트는 난이도를 모르므로(Diff 비동기화) 단추만 띄우고 서버가 다시 검증.
- **처형인 선처치 경계**: q5 수락 전에 처형인을 쓰러뜨리면 지금 규칙대로 소급 없음(OnKill은 진행 중 의뢰만). 고정 보스는 `bossRespawnSec=-1`(그 게임에서 한 번) → **새 게임을 열면 다시 나온다** — 영구 막힘 아님(기존 정책). 현장 수락은 오히려 처형인 앞에서 바로 q5를 받게 해 이 경계를 줄인다.
- **첫 장비 안내·관측**: 장비(gen·unique)를 주는 첫 의뢰(=1) 보통 난이도 보고 직후 안내 줄 한 번 「새 장비는 가방에서 지금 장비와 비교해 장착해 주세요. 장착하면 다음 전투부터 적용됩니다」(기존 Notify · 새 창·자동 장착·추가 지급 없음) + 낀 장비 기억 → 새로 낀 장비로 싸운 첫 처치 = `Telemetry.First(gearUse)`. 액트 1 의뢰 수락·보고 시각 `First(q<n>accept|report)`, 현장이면 `…Field`. 모두 기존 공개 함수 `_Telemetry:First`만 — Telemetry 내부는 C에 patch 요청.
- 오프라인 `tests/quality/progression.lua`(실제 PlayerQuest 본문): 28장면 — 제단 보고·수락, 재전송·NPC 동시 중복 0, 거절 13종(미완료·q4 수락·q3·다른 맵·다른 난이도·거리 2.6·사망·다른 보낸 사람·오래된 번호·q5 최종 보고·q6·제단 없음·설정 끔), 가방 부족 거절 뒤 재시도, 마을 경로, 저장 키, 첫 장비 안내 1회·gearUse 1회(같은 장비·악몽·다른 의뢰 0).
- **Lv15 이후 변형 시험 비용**: 구현하지 않음(0035 #2 · respecFreeLevel 15 · 5만 · +2500 보존). 비교표는 results `I08_lv15_proposal`.

## 4. I07 재질 접합 — 소스 준비만 (업로드·등록·생성 map 쓰기 없음)

- `data/handmade/specs/material_joins.cjs` + 빌더 `artEntities` 끝에 `ArtJoin<n>`(바닥 무늬 z) — 기존 장식 이름·순서·설계도·배치표 그대로, compose 다시 안 돌림. 그림이 art_sprites.csv에 없으면 건너뛰고 「등록 필요」 경고.
- demonroad(ART-03): 임시 키 `a4-decal-ash-paving-join-v1` 4장 — 서문 (-28.5,1.0)×0.75 직선 · (-29.0,-0.9)×0.65 직각 / 동문 (28.0,2.0)×0.7 직선 · (27.6,3.05)×0.6 직각. 행군로(a4-march-road)가 현무암 보루 바닥(a4-ash-basalt-floor)에 파고든 끝 — 외곽 성벽·용암 직각·전역 띠 손대지 않음.
- wreckcoast(ART-04): 기존 `a3-decal-salt-crust`(0742d8a2…) 2장 — (-7.3,3.15)×0.6 · (6.5,2.9)×0.6, 모래·해안길·부두 판자 세 재질 모서리(가운데 길·판자는 0.1~0.15칸만 걸침) · 물결·거품 없음 · 바닥 섞기 조각 그대로.
- 격리 `--out` 빌드 비교(`logs/joins_*.json`): wreckcoast 825 → 827(**ArtJoin1·2만 추가**, 813 바이트 동일 + 12 기능 엔티티 displayOrder만 +2) · demonroad 등록 전 = 작업 트리 map과 621 바이트 동일 · 임시 등록(가짜 RUID, 사본에서만) 625(**ArtJoin1~4만 추가**, 609 동일 + 12 displayOrder +4).

## 5. 검사

`npm test` 12/12 · `check_data` 0 · `check_scripts` 0(142개) · 오프라인 Lua 8그룹 통과(`logs/lua_quality.txt`) · `build.cjs act1~4 --check` 대상 맵 줄만 다름.

## 6. 하지 않은 것 · 한계

- 메이커 관찰 0건(전부 maker_queue) — 실제 통행·충돌·전투·LOS·카메라 가독성·소환 따라오기·깨우기 반경에서의 체감은 미확인.
- 신규 유저 2h/4h/day2/day3 실제 관찰은 사용자/실사용자 몫(조작 시험과 별개 · 미관찰).
- Telemetry 요약 라벨·장착 시각(gearEquip)·Act2 첫 10분 표본·초기화 사용 기록은 C·A·B 파일이라 patch_requests로만.
- 경로 칸 수는 설계도 BFS — 장식 충돌·실제 이동 시간이 아니다.
