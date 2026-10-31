# 맵 구성 v5 3단계 — 액트 2 적용 요약 (2026-10-31)

기준 = 7c9b2570(액트 4 메이커 증거까지 포함한 정본 · 액트 1 15장 적용 후). 액트 4(8b8540b7)·액트 1(689cbc0e)과 같은 생성기(`tools/build/handmade/v5.cjs`)·규칙으로 액트 2 15장(표본 sanctum 제외)을 다시 지었다. 메이커는 쓰지 않았다(오프라인 미리보기만 · 액트 2 메이커 확인은 별도 회차 → `CAPTURE-PLAN-act2.txt`).

- 설계서: `data/handmade/specs/act2.cjs` 맨 끝 「v5 3단계 · 액트 2 적용」 블록(맵마다 근거 주석). 액트 2 맵 중 다른 액트가 remix로 가져가는 것은 **잊힌 서고(archive)뿐**(물에 잠긴 예배당·옥좌의 전실·배교자의 수도원) — 서고의 길·바위 자리 변경은 `specs/overrides.cjs` archive 줄. 사원 2층은 10-30 I06 덮어쓰기 줄(overrides.cjs temple2)이 자리를 정하므로 그 줄의 바위만 고쳤다. 나머지 맵의 자리 변경(고리 끊기·웨이포인트·바위)은 act2.cjs 블록 안.
- 생성기·검사기 코드는 고치지 않았다.
- 전후 시트: `sheet-act2-before-after.png` (1칸 = 6px 같은 축척, 16장 — sanctum은 표본이라 변화 없음)
- 맵마다 전후 1장 `<id>-before-after.png` · 가장 공들인 공간 확대 1장 `<id>-view.png` (왼쪽 = 기준 7c9b2570, 오른쪽 = 지금)
- `?` 맵 비교: `variants/sunkenroad-keep-vs-v5.png` · `variants/sunkenroad-v5.{txt,csv}`
- 메이커 레인 확인 계획: `CAPTURE-PLAN-act2.txt`

## 맵별 표

빈 바닥 % = 1단계 검수표 정의(바탕 `.` 칸 중 바닥 무늬 1.5칸 밖 ÷ 걷는 칸 · v5 맵은 띠가 바탕 칸이라 띠가 포함됨). 엔티티 = `dump_map_layout` 셈(그림+기능 · 검사기 셈은 +1). 길 = `routes.csv` 입구→출구 최단 걸음 · 근처 몫.

| # | 맵 | 모드 | 검사기 | 충돌 | 엔티티 전→후 | 빈 바닥 % 전→후 | 걷는 칸 | 길·근처 | 출현 수(노말/악몽/지옥 합) | tallNoTop | 커밋 | 공들인 공간 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | oasis 오아시스 시장 | keep(마을) | 0 | 0 | 284→273 | 2.1→2.1 | 466→466 | (마을) | — | 4종 6 | 488f4330 | 천막 거리 — 대상 우물(마을 랜드마크)을 물가에서 대상 NPC 곁 남쪽 막다른 자리로 · 천막 북쪽 언덕 밀착 |
| 2 | dunes 뜨거운 모래 언덕 | keep(C · 최소) | 0 | 0 | 1021→920 | 10.3→10.3 | 1150→1150 | 63 그대로 | 그대로 | 3종 4 | 96b18cb2 + 05ccef47 | 마른 오아시스 터 — 오아시스 폐허·웨이포인트 옛길 곁 (세트 자리 기준 그대로) |
| 3 | canyon 메마른 협곡 | keep(C · 최소) | 0 | 0 | 1026→939 | 17.8→17.4 | 1106→1106 | 80 그대로 | 그대로 | 4종 4 | 05ccef47 | 거상의 분지 — 거상 머리 세트·웨이포인트 골격 곁 |
| 4 | stormwaste 바람 무덤 사막 | keep(`?`) | 0 | 0 | 506→375 | 20.9→19.9 | 813→813 | 88 그대로 | 그대로 | 4종 11 | b4a57407 | 바람 비석 보루 — 둥근 담 비석 고리(벽감 막음) |
| 5 | sunkenroad 가라앉은 대로 | keep(`?`) | 0 | 0 | 510→345 | 21.6→21.6 | 1359→1359 | 89 그대로 | 그대로 | 2종 2 | 910e805d | 열주 회랑 — 북쪽 담 사원 기둥 열 6 |
| 6 | scorpnest1 전갈 굴 1층 | keep | 0 | 0 | 653→550 | 22.2→21.7 | 775→775 | 65 그대로 | 그대로 | 2종 2 | dc1d2cb7 | 껍질 광장 — 독 웅덩이 바위(매복 굴에서 옮김) |
| 7 | scorpnest2 전갈 굴 2층 | keep | 0 | 0 | 580→449 | 17.6→17.6 | 659→659 | 57 그대로 | 그대로 | 1종 1 | 528f61b4 | 독침 여왕의 알자리 — 알 둥지 |
| 8 | drywell 버려진 우물 | keep | 0 | 0 | 611→474 | 14.0→13.6 | 712→712 | 58 그대로 | 그대로 | 1종 1 | b70c9e4a | 마른 물웅덩이 터 — 우물 도르래 |
| 9 | kingtomb1 왕들의 묘실 1층 | v5 | 0 | 0 | 457→309 | 33.3→11.6 | 763→683 | 57 · 0.409→0.457 | ×0.90 하한 (17/25/29→15/23/27) | 3종 6 | 71cda911 | 석관 방 — 축 끝 왕관 쓴 거상 머리 + 기둥 쌍 · 그을린 사암 두 톤 |
| 10 | kingtomb2 왕들의 묘실 2층 | v5 | 0 | 0 | 482→348 | 11.0→10.6 | 833→814 | 52 · 0.435→0.432 | 그대로 | 3종 6 | 895316f5 | 수호왕의 석관실 — 석관 + 열주 2쌍 + 남벽 비석 열 |
| 11 | archive 잊힌 서고 | v5 | 0 | 0 | 543→386 | 10.9→11.7 | 889→862 | 55 · 0.466→0.487 | ×0.957 (16/22/27→16/21/26) | 0종 0 | 808606ee | 불탄 금서실 — 불타는 책장 탑 + 열주 2쌍 |
| 12 | vipernest 독사의 둥지 | keep | 0 | 0 | 613→489 | 10.9→11.2 | 670→670 | 64 그대로 | 그대로 | 1종 1 | 39327c15 | 독사의 둥지 — 뱀 기둥(둥지 남쪽 가운데) |
| 13 | temple1 잊힌 사원 1층 | v5 | 0 | 0 | 544→340 | 15.5→10.4 | 989→961 | 57 · 0.388→0.417 | ×0.930 (34/49/57→31/46/53) | 1종 1 | e6b8ef9b | 기둥 회랑 — 웨이포인트 뒤 향로 계단 + 남벽 기둥 열 |
| 14 | temple2 잊힌 사원 2층 | v5(보스) | 0 | 0 | 493→321 | 10.9→14.0 | 691→712 | 69 · 0.553→0.527 | 그대로 | 2종 3 | 4659dda1 | 문지기의 전당 — 사자 쌍 계단 문 + 열주 2쌍 · 문지기 자리 그대로 |
| 15 | temple3 잊힌 사원 3층 | v5 | 0 | 0 | 664→416 | 30.8→12.6 | 938→834 | 71→75 · 0.418→0.482 | ×0.90 하한 (35/50/58→32/45/53) | 1종 1 | 8c8efe66 | 태양 제단실 — 노래하는 모래 제단 + 기둥 쌍 · 띠 y 1 곧게 |
| — | sanctum 대사제의 성소 | v5(표본) | 0 | 0 | 341 | 12.4 | 938 | 79 | — | 2종 10 | (표본) | 변경 없음 (바이트 동일) |

출현 수는 「U8 전 원래 수 × clamp(0.85 ÷ min(0.85, 근처×1.6), 1, 1.8)」 규칙의 배율 변화만큼 기준 값에 곱해 반올림 — **액트 2는 ×0.9 하한**(묘실 1층 ×0.895·사원 3층 ×0.867 → 둘 다 ×0.90). 기준 근처 몫은 기준 설계도로 다시 잰 값(HEAD routes.csv의 temple2 줄 57/0.484/779는 설계도와 이미 어긋나 있었다 — 다시 재면 69/0.553/691 · 액트 1 레인 기록과 같음). keep 맵은 길이 그대로라 손대지 않음. 맵 파일 스포너와 `GameData.mlua` MapSpawns(gen_data)를 maps.csv와 맞췄다. 사원 2층 걷는 칸 691→712는 1×1 바위 기둥 10개를 뺀 몫. 사원 2층 빈 바닥이 10.9→14.0으로 오른 것은 띠(바탕 칸)가 셈에 들어간 몫(정의상).

## `?` 맵 · kingtomb2 처리

- **stormwaste (`?` → keep)**: 악마의 행군로 결론대로 keep. 산발(석상 머리·오벨리스크 3→2)·낱개 기둥·벽감 정리 뒤 빈 바닥 20.9 → **19.9%** — 20%를 넘지 않아 v5 비교본은 만들지 않았다.
- **sunkenroad (`?` → keep)**: keep 빈 바닥 **21.6%**(20% 넘음) → 행군로처럼 v5 비교본만 만들어 보관(`variants/`, `V5_ALT=sunkenroad node tools/build/handmade/compose.cjs act2 sunkenroad`로만 짓는다). 비교본은 빈 바닥 11.4%로 줄지만 띠(바탕 담 윗면)가 대로 포장(=)을 지워 대로가 사라지고, 검사기 0건이 아니다(check_decor_collision 1 — 비교본만). **keep 유지 추천**.
- **kingtomb2 모래 쏟아진 방(검수표 「캡처로 확인」)**: 고리 끊기(대각 통로 막음)로 골격 밖 막다른 방이 되어 띠가 지나지 않고, 재적합은 띠 곁 칸만 바꾸므로 모래 바닥(sand-floor)이 그대로 남는다(`kingtomb2-before-after.png` 북서 둥근 방). 구역 보존(keep 되돌림)은 필요 없었다.

## keep 맵 걷는 칸·문 길 (검사기 keepFloor `--keep-ref 7c9b2570`)

9장 모두 **걷는 칸 잃음 0 · 문 최단 길 변화 0** (oasis 466 · dunes 1150 E 63/H 60 · canyon 1106 E 80/H 66 · stormwaste 813 E 88/H 92 · sunkenroad 1359 E 89/H 41 · scorpnest1 775 E 65 · scorpnest2 659 X 62 · drywell 712 X 65 · vipernest 670 X 63).

keep 맵에서 바꾼 기능 자리는 웨이포인트 3곳뿐(골격 1칸 안 요구 · waypoints.csv·WaypointData.mlua·GameData.mlua 갱신):
- dunes (1, 1)→(0, −1) — 묻힌 옛길(골격 y −2) 바로 북쪽 (옛길 글자 칸은 길 그림이 끊겨 피함)
- canyon (−2, 1)→(−2, 2) — 골격(협곡 입구→분지 비스듬히 · y 3) 바로 곁
- sunkenroad (3, −3)→(1, −3) — 골격(거상 보루를 서북→남동으로 비스듬히) 바로 곁

## v5 맵 「고리 통로 막음」 근거 (P2/P5)

| 맵 | 막은 통로 | 근거 |
|---|---|---|
| kingtomb1 | 부장품 방 → 석관 방 남쪽 긴 통로 (북쪽 향료 방 고리길은 이야기라 남김) | 지하실 1층·재의 회랑과 같은 판단(가지 2 · 추가 연결 1). 남쪽을 남기면 향료 방 통로가 띠에 닿아 가지가 하나뿐이라 추가 연결 1 > 50%였다. 기능 엔티티 없음 |
| kingtomb2 | 무너진 보물 방·모래 쏟아진 방 → 갈림 방 대각 통로 | 지하실 2층과 같은 처리. 끝방·되돌아가는 문 동선 무관 · 두 방은 회랑 x −19 갈림길에서 닿음 |
| archive | 북쪽·남쪽 열람실 → 불탄 금서실 통로 (overrides.cjs) | 옥좌의 전실·배교자의 수도원과 같은 처리. 끝방·되돌아가는 문은 금서실 안 · 두 열람실은 필사실 복도에서 닿음 |
| temple1 | 제물 방 ↔ 태양 제단실 · 무너진 방 ↔ 필사실 | 심연의 문 1층과 같은 처리. 서고 입구(태양 제단실)는 회랑에서 바로 닿음 · 곁방에 NPC·퀘스트 없음 |
| temple2 | (없음 — 10-30 I06 「접근 두 갈래」 그대로) | 띠는 남쪽 기둥 회랑으로(via) — 북쪽 막사 굴·갈림 방이 가지 둘이라 추가 연결 1 ≤ 50%. 1×1 바위 기둥 10개만 overrides.cjs에서 뺌 |
| temple3 | 기둥 회랑 → 제단실 · 제물 방 → 제단실 · 필사실 → 아래 계단 | 납골당 1층·심연의 문 2층과 같은 처리. 이야기 줄을 「남쪽 무너진 방을 돌아야」로 고침 |

## 생성기·검사기·표 변경

- 생성기·검사기 코드는 고치지 않았다. `decor_policy.cjs` 그대로.
- 역할표 `asset_roles.csv` facing 1줄: market-stall north→any (역할 정의가 「마을 길 양옆 좌판 열」 — 길 양옆 열이라 정면 고정이 맞지 않음 · 사방이 트인 차양 좌판 · 오아시스·가라앉은 대로만 씀).
- `overrides.cjs`: archive 줄 추가(고리 끊기·바위) · temple2 줄 바위 → `[]`(I06 자리·출현 구역은 그대로).
- tile_classes: v5 맵 6장 줄을 규칙대로 다시 뽑음(keep 맵은 그대로).

## 불변 · 예산 · 테스트

- 설계도 맵 65장 `--out` 전체 빌드를 기준 7c9b2570 트리(git archive 사본)와 비교: **50장 바이트 동일**(액트 1·3·4 + sanctum), 다른 것은 액트 2 15장뿐. 같은 트리 두 번 빌드 결과 동일(결정적). map/ 변경은 액트 2 15장×3뿐이고 그 15장 = `--out` 빌드와 바이트 일치.
- remix 원형 보호: `compose act1`·`compose act4` 다시 돌려 변경 0 · `compose act3`는 기준에서도 있던 재현 차이 그대로(내용 동일 — 액트 1 레인 기록과 diff 본문 일치).
- 엔티티 예산 43096 → **41044** / 47900.
- `check_map_composition --all --keep-ref 7c9b2570` v5 50장 위반 0 · `--selftest` 29/29 · `check_decor_collision --all` 66장 문제 0 · `tile_classes --check` 문제 0 · `npm test` 20/20.
- 참고: 기준 HEAD의 액트 2 맵 파일은 노말·악몽·지옥 세 파일 모두 스포너 Entries가 지옥 값이었다(메이커 저장본). 다시 지은 15장은 빌더 규칙대로 세 파일 모두 maps.csv 노말 값(액트 1·4 재빌드 맵과 같음 · 난이도별 수는 GameData MapSpawns).

## tallNoTop 집계 (코덱스 윗부분 요청용 · 액트 2 15장 · 23종 49개)

키 큰 특징·구조(화면 높이 ≥2칸)인데 `<그림>-top`이 없는 그림. 액트 2에서 윗부분이 있는 것은 temple-column(사원 기둥).

| 그림 | 역할 | 원본 px | 최대 칸 | 개수 | 맵 |
|---|---|---|---|---|---|
| wind-stele | structure | 112×152 | 3.12 | 17 | stormwaste 7 · kingtomb1 4 · kingtomb2 4 · temple2 2 |
| palm | structure | 128×192 | 3.61 | 6 | oasis 2 · dunes 2 · stormwaste 2 |
| a2-crowned-colossus-head | feature | 300×260 | 3.1 | 3 | canyon · sunkenroad · kingtomb1 |
| a2-rib-arch | feature | 220×190 | 3.06 | 2 | canyon · scorpnest1 |
| market-stall | structure | 176×128 | 2.62 | 2 | oasis 2 |
| tomb-door | structure | 192×192 | 3.09 | 2 | stormwaste · kingtomb2 |
| a2-giant-beast-skull | feature | 340×240 | 3.13 | 1 | dunes |
| a2-landmark-buried-caravan | feature | 512×512 | 4.31 | 1 | dunes |
| a2-landmark-caravan-well | feature | 512×512 | 3.31 | 1 | oasis |
| a2-landmark-coiled-serpent-column | feature | 512×512 | 3.22 | 1 | vipernest |
| a2-landmark-dry-waterwheel | feature | 512×512 | 3.26 | 1 | canyon |
| a2-landmark-dry-well-pulley | feature | 512×512 | 3.25 | 1 | drywell |
| a2-landmark-golden-mask-wall | feature | 512×512 | 3.29 | 1 | kingtomb1 |
| a2-landmark-guardian-king-sarcophagus | feature | 512×512 | 3.75 | 1 | kingtomb2 |
| a2-landmark-lion-twin-stair-gate | feature | 512×512 | 3.76 | 1 | temple2 |
| a2-landmark-scorpion-egg-nest | feature | 512×512 | 3.72 | 1 | scorpnest2 |
| a2-landmark-singing-sand-altar | feature | 512×512 | 3.22 | 1 | temple3 |
| a2-landmark-sunken-triumph-arch | feature | 512×512 | 3.35 | 1 | sunkenroad |
| a2-landmark-temple-stair-censer | feature | 512×512 | 3.48 | 1 | temple1 |
| a2-landmark-venom-pool-rock | feature | 512×512 | 3.42 | 1 | scorpnest1 |
| a2-landmark-wind-tomb-pillar | feature | 512×512 | 3.22 | 1 | stormwaste |
| tent | structure | 192×144 | 3.13 | 1 | oasis |
| well | feature | 128×144 | 2.09 | 1 | canyon |

(맵별 종·개수는 위 맵별 표의 tallNoTop 열 · sanctum 2종 10은 표본이라 따로. 전체 v5 50장 합계 76종 221개.)
