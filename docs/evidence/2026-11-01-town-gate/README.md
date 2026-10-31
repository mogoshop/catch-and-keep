# 마을 남문 통로 2칸 이상 보완 (11-01 · 맵 생성기 레인)

## 문제
- 689cbc0e에서 무너진 성문(`a1-landmark-ruined-gate`, 마을 `town` 남문) 발밑 막힘이 기둥 발 칸 (−1,−10)·(1,−10)이 되어,
  출구 포털 `GateToField`(0.5,−9.5 → 칸 (0,−10) · 대상 `wasteland` (−32.1, 0.5)) 줄의 열린 폭이 **1칸**이었다(메이커 f2e3e269 「남문 문 칸 1칸 폭」).
- 계획표 `docs/design/map-composition-v5-plan.md`는 골격 너비 2칸 이상.

## 바꾼 것
| 파일 | 내용 |
|---|---|
| `tools/build/handmade/lib.cjs` | `footprintRole`에 `opts.hole` 추가 — 발밑 줄(padl·padr로 넓힌 뒤) 가운데 그 칸 수만큼 열을 비운다. `hole`이 0·없음이면 그 블록을 건너뛰어 예전과 같은 칸. 배치표 args `hole=` 해석(`artEntities`의 prop 줄) |
| `tools/build/handmade/v5.cjs` | compose의 `rowOpt`가 `hole=`도 읽어 벽감·막다른 줄 계산 때 빌더와 같은 칸을 쓰게 함(주석 포함 2줄) |
| `data/handmade/specs/act1.cjs` | town 성문 줄 args `ok=cliff;foot=0.3` → `ok=cliff;foot=0.3;padl=1;padr=2;hole=3` + 판단 주석 |
| `data/handmade/town.csv` | compose 결과(성문 줄 args만) |
| `map/town.map` · `map/town_nm.map` · `map/town_hell.map` | build 결과 — `RectTileMap` 타일 5칸의 `tileIndex`만 바뀜(그림 엔티티·자리·배율 변경 0) |

옵션 뜻 (성문 발밑 기본 칸 = 그림 가로 60% → x −1·0·1, 줄 y −11·−10):
- `padl=1` → 왼쪽 x −2 추가, `padr=2` → 오른쪽 x 2·3 추가 → 발밑 줄 x −2~3
- `hole=3` → 그 줄 가운데 3칸(x −1·0·1)을 비움 → 막는 열 = x −2 · 2 · 3 (각 2줄, y −11은 원래 벽)
- 오른쪽만 `padr=2`인 이유: (2,−10)을 막으면 꺼진 화로 받침(3,−9)·남쪽 벽 사이 (3,−10)이 막다른 벽감이 되어
  검사기가 `niches (3,-10)~1칸` · `deadLines (3,-10)~3칸` 위반 2건을 냈다(`padr=1` 시도). v5 생성기 6차 규칙(벽감 곁 그림 발밑을 그쪽으로 넓힘)과 같은 처리로 한 칸 더 막아 위반 0.

## 전후 막힌 칸 (세 맵 같음 · 타일 269 = 충돌)
| 칸 | 전 (HEAD 8558cf5b) | 후 |
|---|---|---|
| (−2,−10) | 열림 (266) | 막힘 (269) |
| (−1,−10) | 막힘 (269) | 열림 (265) |
| (0,−10) 출구 포털 칸 | 열림 | 열림 |
| (1,−10) | 막힘 (269) | 열림 (266) |
| (2,−10) | 열림 (266) | 막힘 (269) |
| (3,−10) | 열림 (266) | 막힘 (269) |

- y −10 줄 x 0을 지나는 열린 폭: **1칸 (x 0) → 3칸 (x −1~1)** · y −9: 7칸 그대로 · y −8: 9칸 그대로
- 장식 막힘 칸 35 → 36 · 열린 바닥 448 → 447
- 상세 표·격자: `gate_bfs.md` (만든 스크립트 `gate_bfs.cjs`)
- 그림: `town-gate-before-after.png`(남문 확대 · 빨강 = 장식 충돌 칸 · 노랑 = 기능 자리) · `town-whole-before-after.png`(마을 전체)

## 서버 칸 BFS (설계도 바닥 − 충돌 타일 · 4방향 · `route_lengths.cjs`와 같은 이웃 규칙)
| | 전 | 후 |
|---|---|---|
| G(0,−10)에서 닿는 칸 / 열린 칸 | 448 / 448 | 447 / 447 |
| G → 황무지에서 온 도착 자리 (0,−1.6 → 칸 0,−2) | 8걸음 | 8걸음 |
| G에서 가장 먼 칸 | 34걸음 | 34걸음 |
| 걸음 수가 바뀐 칸 | — | (4,−10) 6→8 하나 |
- town_nm·town_hell 충돌 칸 = town과 같음(417) · 둘 다 447/447 닿음 · 도착 자리 8걸음
- 황무지 쪽 `GateBack`(→ town (0,−1.6))이 있는 `map/wasteland.map`은 바이트 불변

## routes.csv
- 변경 없음. `tools/route_lengths.cjs`는 설계도 바닥만 쓰고(장식 충돌 무시) town은 목표(E·끝방·보스)가 없어 행을 만들지 않는다(`grep -c '^town,'` = 0).
- 참고: 이 레인에서 `node tools/route_lengths.cjs`를 돌리면 town과 무관한 `sanctum`(79→77)·`demonroad`(near 0.538→0.516 · floor 889→953) 두 줄이 바뀐다 —
  HEAD의 routes.csv가 그 두 맵에서 이미 낡아 있던 것이라 범위 밖으로 보고 되돌렸다(커밋에 없음).

## 다른 맵 불변
- `node tools/build/handmade/compose.cjs act1..act4` → `node tools/build/handmade/build.cjs act1 act2 act3 act4`(65장, `build-maps.log`) 뒤 `git status`:
  바뀐 맵 파일은 town·town_nm·town_hell 셋뿐(나머지 바이트 불변). 배치표 csv도 town.csv만.
- `hole=`을 쓰는 배치표는 town 성문 한 줄뿐(`grep -rln "hole=" data/handmade/` = town.csv · specs/act1.cjs).
- 성문 윗부분(-top) 미배치 경고(`자르는 선 y -9.331 > 막힘 꼭대기 없음`)는 HEAD 증거 `docs/evidence/2026-11-01-map-v5-toppart3/build-maps.log:88`과 같은 문구 — 기존 상태(발 열 x 0은 포털 칸이라 막힘에서 빠짐).

## 검사
| 명령 | 결과 | 로그 |
|---|---|---|
| `node tools/check_map_composition.cjs --map town` | v5 위반 0 (padr=1 때는 2) | `check-town.log` |
| `node tools/check_map_composition.cjs --all` | 66장 v5 위반 0 · 엔티티 39432/47900 | `check-all.log` |
| `node tools/check_map_composition.cjs --selftest` | 29/29 · 심은 위반 38 검출 · 오탐 0 | `check-selftest.log` |
| `npm test` | 20/20 통과 | `npm-test.log` |

## 한계
- 메이커 실화면 확인은 별도 담당(이 레인은 메이커를 쓰지 않음).
- 미리보기에서 전(HEAD)의 막힌 칸 (−1,−10)·(1,−10)은 그림의 두 기둥 바닥과 정확히 겹쳤고, 그림의 아치 틈은 x 0 한 칸 남짓이다.
  지금은 문 칸이 3칸이라 플레이어가 x −1·1에서 기둥 바닥 그림 뒤(북쪽 y가 발보다 위라 그림이 앞)로 들어가 보일 수 있다 — 메이커에서 보기 확인 필요.
  문 칸을 2칸(한쪽 기둥만 겹침)으로 줄이는 pad·hole 조합도 있을 수 있으나 시험하지 않았다 — 이번엔 지시(x −1·0·1)를 따랐다.

## 재현
```
node tools/build/handmade/compose.cjs act1 && node tools/build/handmade/build.cjs town
git show HEAD~1:map/town.map > /tmp/town-head.map   # 이 커밋 기준 전
node tools/preview/export_map.cjs town before.json /tmp/town-head.map
node tools/preview/export_map.cjs town after.json
node docs/evidence/2026-11-01-town-gate/gate_bfs.cjs before.json after.json
python3 tools/preview/render_map.py --assets <assets> --out x.png --ppu 48 --crop -7 -12 8 -4 --overlay before.json after.json --labels 전 후
```
