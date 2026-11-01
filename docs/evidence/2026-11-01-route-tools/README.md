# 길 재기 도구를 빌드된 맵 칸 기준으로 (11-01 · 사용자 결정 7-A·8-A)

출발점: `claude-routes-mismatch-act23-0338.json`(routes.csv ↔ 메이커 「입구→다음 포털」 어긋남 판정). `route_lengths.cjs`·`check_map_composition.cjs` keepFloor가 **설계도 글자 바닥**만 보고 빌드 때 그림 충돌로 막히는 칸(`art.blocked`)·갇힌 칸(`sealed`)을 보지 않아 실제 맵(= 메이커 서버 칸)보다 길을 짧게 쟀다. 맵·설계도는 건드리지 않았다(계산만 실제 칸 기준으로).

## 1. route_lengths.cjs (7-A)

- 걷는 칸 = 빌드된 맵 칸 = 설계도 바닥 − `art.blocked` − `sealed`. `lib.cjs build()`가 RectTileMap 충돌 타일(269)로 쓰는 정의를 **같은 함수**(`maps.desiredEntities` → `hm.artEntities` → `hm.check`)로 계산한다 — `builtCells()` (lib.cjs는 고치지 않음 · 마을 작업자와 겹치지 않게).
- 검증: 빌드 계산 걷는 칸 = `map/<id>.map` 충돌 칸 **66/66** (설계도 맵 전부 · AshCampTiles.tileset IsCollidable). 맵 파일 = 메이커 서버 칸은 0338 판정 30/30.
- 시작(W→G)·목표(E → extra end@ → fixed 첫 자리) 규칙 그대로. 목표·시작 칸이 막혔거나 길이 없으면 이제 오류로 멈춘다(예전엔 조용히 0).
- `--check`(쓰지 않고 다르면 종료 코드 1) · `--near=built`(아래 B안) 추가.

### routes.csv 바뀐 행 (HEAD 6eed5d72 → 이 커밋) — 3행, route +2만

| 맵 | 목표 | route 전→후 | near·floor | 원인 (한 칸만 풀면 전 값) |
|---|---|---|---|---|
| wreckcoast | E (33,4) | 75 → 77 | 그대로 0.366 · 1224 | (-6,2) ArtSet1_1 a3-broken-mast — v5 전부터(3c759419^ 맵 파일도 77) |
| keeperhouse | end@ (-22,7) | 58 → 60 | 그대로 0.512 · 652 | (-18,7) ArtProp8 a3-adjunct-salt-sack-r2 — 3c759419(액트 3 keep)에서 생김 |
| heartbridge | E (33,0) | 69 → 71 | 그대로 0.685 · 631 | (-14,0)/(-14,-1) ArtProp7 a4-chain-pillar — 8b8540b7(액트 4 keep)에서 생김 |

나머지 59행 바이트 그대로. (sanctum·demonroad 낡은 2행은 이미 a7da39c1에서 갱신됨.)

### near·floor 기준 — 결정: 옛 정의(설계도 바닥) 유지 · B안은 승인 대기

빌드 칸으로 near·floor까지 재면(B안 · `--near=built`) **62행 전부** 바뀐다: floor는 맵마다 정확히 장식 막힘 칸 수만큼 준다(3~220칸 · 합 3206 · sealed 0), near는 61/62행이 −0.026(apostate)~+0.075(sanctum) · 평균 +0.0105 움직인다(목록 `near_built_rows.txt`). 몬스터는 충돌 칸에 나오지 않으므로(MonsterSpawner → `Util.TileBlocked`) **뜻은 B안이 맞다**. 그러나

| 안 | routes.csv | sim_balance P60 보통/악몽/지옥 (거인 점검 기준선) | 끝 레벨 | npm test |
|---|---|---|---|---|
| HEAD | — | 147:00 / 123:58 / 123:59 | 41·68·90 | 20/20 |
| **D (채택)** route만 빌드 칸 · near·floor 옛 정의 | 3행 route +2 | 147:07 / 124:05 / 124:06 (+7초 · +0.08%) | 41·68·90 | **20/20** |
| C route·길은 빌드 칸 · near는 설계도 바닥 | 15행 (같은 길이 길의 갈래가 바뀌어 near ±0.04) | 147:15 / 124:07 / 124:06 | 41·68·90 | 20/20 |
| B 전부 빌드 칸 (`--near=built`) | 62행 | 147:24 / 124:11 / 123:54 | **41·68·91** | **19/20** — 「거인 끝 레벨 (46-7)」 실패 |

- D를 고른 근거: (1) 사용자 지적의 본질(길 걸음이 실제 맵과 다름)은 D로 다 풀린다 (2) B는 시뮬 지옥 끝 레벨을 90→91로 옮겨 기획서 46 부록 A-3 관문(npm test)을 깬다 — 밸런스 기준 변경이라 부모·사용자 승인 사항 (3) near는 같은 길이 길이 여럿일 때 BFS 이웃 순서가 고른 길에 따라 ±0.04 흔들리는 근사치(C안에서 temple2 0.527→0.570이 길 길이 변화 없이 갈래만 바뀌어 생김)라 B의 평균 +0.01 이동은 그 오차 폭 안이다.
- B로 바꾸려면: `node tools/route_lengths.cjs --near=built` (또는 `NEAR_BASIS = "built"`) + 46-7 관문 기준선(지옥 90→91) 결정.

## 2. 소비처 영향 (오프라인 · 게임 데이터 재생성 단계 없음)

`sim_balance.py`·`sim_clear.py`는 routes.csv를 읽기만 하고 데이터를 쓰지 않는다(출현 수 등 자동 재생성 단계 없음 — routes.csv를 읽는 곳은 이 둘 + `tools/review/zone_sheet.py`(route 열 표시) + `check_decisions38.cjs`(파일 존재)). 작업트리 밖 복사본(스크래치)에서 HEAD·D·C·B 네 벌을 돌려 비교했다 — `sim_impact.txt`.

- **D (이 커밋)**: 바뀌는 맵 3장 · 이동 시간만 — 난파선 해안 +2.0~2.3% · 등대지기의 집 +1.6~2.7% · 심장의 다리 +1.4~2.4% (프로필·난이도별). 합계(거인 점검 기준선) 보통·악몽·지옥 각 +7초(+0.08~0.09%) · P100 보통 +9초(+0.12%). 끝 레벨·의식 점검 41·68·90 그대로. sim_clear 벽 표 P100 액트3 34:38→34:42.
- **B (승인 대기)**: 바뀌는 맵 36~42장/58 · 맵별 −4.3%(뼈 구덩이 2층)~+3.4%(난파선 해안, P60 보통) · 합계 보통 +24초(+0.27%) · 악몽 +13초 · 지옥 −5초 · 지옥 끝 Lv 90→91 · 보통 액트 3 끝 Lv 29→30 · sim_clear 벽 표 「익사한 제독 도착 Lv28→29 · 벽 사냥 3분→0분」.
- `sim_clear.py`는 HEAD에서도 `KeyError: 'corpse_blast'`(skills.csv에 없는 스킬)로 첫 표 뒤 멈춘다 — 이 작업과 무관한 기존 결함, 고치지 않음(벽 표 P100 첫 줄만 비교).

## 3. check_map_composition keepFloor (8-A)

- (a) 목표에 maps.csv extra **end@**(끝방) 추가 — 설계도 글자 길도 end@까지 잰다.
- (b) **빌드된 맵 칸** 길 비교 추가: 기준 = `git show <ref>:map/<id>.map` 충돌 타일(그때 지은 맵 · 그때 tileset) · 지금 = `builtCells`(메모리). 입구→목표(E·X·H·end@) 길이 **늘거나 끊기면** 위반, 줄어든 것(옛 흩뿌림이 막던 길이 열림)은 자세히에만.
- `layoutOf`도 `builtCells`를 쓰게 바꿨다(같은 계산 한 곳). 기본 `--all` 출력은 옛 검사기와 **바이트 같음**(66장 위반 0).

### keeperhouse 증명 (`--map keeperhouse --keep-ref 3c759419^`)

- 옛 검사기(HEAD): `위반 0` — `keepFloor: 걷는 칸 652→652 · 문 길 X@-25,3 65→65` (end@를 안 보고 설계도 글자만)
- 새 검사기: `위반 1` — `문 길 end@-22,7 58→58 · 실제 칸 길 X@-25,3 65→65 · 실제 칸 길 end@-22,7 58→60 (늘어남 · 위반)`

### 자가 테스트 (29 → 33개 · 모두 통과 · 심은 위반 41)

| 입력 | 내용 | 기대 | 옛 검사 |
|---|---|---|---|
| 29-keepend | 설계도 그대로 · 끝방 길 위 칸을 장식이 막아 빌드 칸 길 13→15 | keepFloor 1 | 0 (놓침) |
| 30-keepshort | 기준에서 막혔던 끝방 길이 열려 15→13 (깨끗한 입력) | 0 | 0 |
| 31-keepend-bp | 설계도 글자 변경으로 끝방 길만 15→11 (문 E 길·잃은 칸 없음) | keepFloor 1 | 0 (놓침) |
| 32-keeperhouse-3c759419 | 실제 keeperhouse 스냅숏(3c759419^ 설계도·맵 파일 ↔ 지금) | keepFloor 1 | 0 (놓침) |

29~31은 `make_fixtures.cjs`가 만들고(기존 29개는 바이트 그대로), 32는 `export_keep_fixture.cjs keeperhouse '3c759419^' …`로 떴다.

### `--all --keep-ref` 새로 걸리는 맵 (`keep_ref_runs.txt` · 맵은 고치지 않음)

| 기준 | 위반 | 걸린 것 |
|---|---|---|
| `3c759419^` (= 2f70dc57 · 액트 3 keep 직전) | 2 | keeperhouse end@ 58→60 · wreckcoast H(16,14) 68→70 |
| `7c9b2570` (액트 2 keep 직전) · `8b8540b7` (액트 1 keep 직전) | 2 | 위 두 장(액트 3)만 — 액트 1·2 keep 맵은 늘어난 길 없음 |
| `3e8f41f2` (액트 4 keep 직전) | 4 | 위 두 장 + pit X(-25,5) 65→67 · heartbridge E(33,0) 69→71 |

막은 칸 (`blockers.cjs` · 한 칸만 풀면 기준 길): keeperhouse (-18,7) ArtProp8 a3-adjunct-salt-sack-r2 · wreckcoast (-6,2) ArtSet1_1 a3-broken-mast(v5 keep 소품이 우회길을 막아 드러남) · pit (-19,6) ArtProp3 a4-chain-pillar · heartbridge (-14,0)/(-14,-1) ArtProp7 a4-chain-pillar.
routes.csv에 들어가는 목표는 keeperhouse end@·heartbridge E 두 개(위 3행 표에 반영) — wreckcoast H·pit X는 곁가지 입구·되돌아가는 문이라 routes.csv 대상이 아니다.
줄어든 길(위반 아님): saltflat H 59→57 · canyon H 68→66 · pit1 E 65→63.

과거 액트 요약(act1·2·4 summary, act3 summary)의 「`--keep-ref` 위반 0」은 옛 정의(설계도 글자 · 문 E·X·H) 기준 값이다.

## 재현

```
node tools/route_lengths.cjs --check                     # routes.csv = 지금 맵 (종료 0)
node tools/route_lengths.cjs --near=built --check        # B안이면 62행 바뀜 (종료 1)
node tools/check_map_composition.cjs --map keeperhouse --keep-ref '3c759419^' --verbose
node tools/check_map_composition.cjs --all --keep-ref 3e8f41f2
node tools/check_map_composition.cjs --selftest
node docs/evidence/2026-11-01-route-tools/blockers.cjs 3e8f41f2 pit,heartbridge
npm test                                                  # 20/20
```
