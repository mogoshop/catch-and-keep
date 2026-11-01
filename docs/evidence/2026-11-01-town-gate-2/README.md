# 마을 남문 2차 — 4-A 넘어가는 칸 3칸 · 6-A 오른쪽 막힌 두 칸에 보이는 그림 (11-01)

기준 HEAD 6eed5d72 (d4dcd1d8 남문 통로 3칸 뒤). 메이커를 쓰지 않은 레인 — 실화면 확인은 아래 「메이커 확인 절차」.

## 4-A 넘어가는 칸을 문 줄 세 칸 모두로

### 지금 판정 방식 (찾은 곳)
- `RootDesk/MyDesk/World/WarpGate.mlua` — 서버 타이머 0.3초마다 `Check()` → `_Util:PlayersNear(맵, 포털 자리, Radius)` = **포털 엔티티 자리에서 반경 Radius(기본 0.6) 원 안**의 살아 있는 플레이어를 `Warp()` (트리거 컴포넌트·칸 판정 아님 · 엔진 포털 아님).
- 마을 남문 `GateToField` = (0.5, −9.5) · Radius 0.6 → 문 줄 y −10에서 x 0 칸 가운데 폭 약 1.2만 반응. x −1·+1 칸은 문 줄 바닥(y −9.99)까지 내려가도 거리 1.11이라 안 넘어갔다(메이커 기록 d4dcd1d8 README 2절과 같음 · 오프라인 계산 `trigger_sim.md` 「전」).

### 바꾼 것 — 마을 남문에만 적용되는 「옵트인」
| 파일 | 내용 |
|---|---|
| `RootDesk/MyDesk/World/WarpGate.mlua` | `property Vector2 TriggerBox = Vector2(0, 0)` 추가. 반폭·반높이가 둘 다 양수일 때만 **원 안 또는 사각형 안**이면 넘어간다. 0(기본)이면 `reach = Radius`·원 판정 식이 예전과 같은 값 → 다른 포털 동작 그대로. `[VRF] WarpGate box ready …`(맵 시작 · 사각 쓰는 포털만) · `[VRF] WarpGate box warp … d=(dx,dy) circle=true/false -> 대상`(사각 쓰는 포털로 넘어갈 때만) |
| `data/handmade/specs/act1.cjs` | town `gateBox: { G: [1.5, 0.5] }` = 포털 (0.5, −9.5) 둘레 x −1~2 · y −10~−9 = 문 줄 세 칸만 |
| `tools/build/handmade/compose.cjs` | 설계서 `gateBox` → 설계도 `;gatebox G 1.5 0.5` 한 줄 (글자가 gates에 없으면 오류) |
| `tools/build/handmade/lib.cjs` | `;gatebox` 지시문 읽기 · `markers(id).gateBox` |
| `tools/build/maps.cjs` | `withGateBox(d, "G", …)` — 설계도에 그 줄이 있을 때만 `GateToField`의 `script.WarpGate`에 `TriggerBox` (마을 분기) |
| `data/handmade/town.txt` · `map/town*.map` | compose·build 결과 |

- 공용 코드(WarpGate)를 바꾼 근거: 판정이 컴포넌트 코드의 원 반경 하나뿐이라 맵 값만으로는 「옆 칸 포함 · 위 줄 제외」를 못 만든다(Radius를 1.6까지 키우면 문 줄 위 y −9 줄 가운데와 양옆 막힌 칸 위까지 빨려 들어간다). 그래서 기본값이 「끔」인 사각 구역을 더하고, 값은 설계서에 gateBox를 적은 마을 남문 하나만 받는다.
- 원 판정은 그대로라 가운데 칸은 예전과 같은 자리(y −8.9)에서, 옆 두 칸은 문 줄에 들어서는 순간(y −9.0)에 넘어간다.
- 「다른 맵 포털 동작 불변」: act1~4 compose·build 65장(+난이도 복제) 다시 지어도 바뀐 맵 파일은 town·town_nm·town_hell 셋뿐(`build-maps.log` 뒤 `git status`) · 사각 구역 값이 들어간 포털은 세 맵의 GateToField 3개뿐(`map-diff.log`).

### 오프라인 계산 (`trigger_sim.md` · 맵 파일 값 + WarpGate와 같은 식)
| 문 줄 칸 | 전 | 후 |
|---|---|---|
| x −1 (x −0.99·−0.5) | 못 넘어감 | y −9.0에서 넘어감 |
| x 0 (가운데) | y −8.9 | y −8.9 (그대로) |
| x +1 (x 1.5·1.99) | 못 넘어감 | y −9.0에서 넘어감 |
- 넘어가면 안 되는 자리 7곳(위 줄 y −8.5 셋 · 양옆 막힌 칸 위 · 오른쪽 열린 (4,−10) · 왼쪽 (−4,−10)) 모두 안 넘어감 · town_nm·town_hell 같은 값(대상 wasteland_nm·wasteland_hell 그대로).

### 포털 관련 표시
- 「출구: … — 들어서면 이동」(HudMap `ShouldShowGatePrompt`): 출구에서 max(1.8, Radius+0.8)=1.8 안 · 몬스터 없으면 표시. 사각 구역의 가장 먼 점 1.58 < 1.8 → 세 칸 어디서나 안내가 뜬 상태에서 들어서면 바로 넘어간다(전에는 x ±1에서 안내만 뜨고 안 넘어가 어긋났다). Radius 0.6은 그대로라 안내 거리·이름표(▼ 라벨) 불변. HudMap 손대지 않음.
- 미니맵: 포털 표식은 WarpGate 엔티티 자리(0.5, −9.5) 그대로 · GameData MapInfo town features 불변(`gen_data --check` 통과 = 생성 데이터 그대로) → GameData.mlua 손대지 않음.
- 길 안내: 마을은 v5 keep(길 안내 도장 0) — 해당 없음.

## 6-A 오른쪽 막힌 두 칸 (2,−10)·(3,−10)에 보이는 그림

- 놓은 그림: **`mp-stake-spikes` 뾰족 말뚝 묶음 1개 — 새 장면 세트 `a1_gate_east_stakes`**(`data/map_sets.csv` 한 줄 · a1_lm_ruined_gate 바로 아래) · 배치표 `set,a1_gate_east_stakes,3.1,-10.15,…,ok=cliff`(설계서 town put).
  - 엔티티 `ArtSet1_1` · 자리 (3.1, −9.696) = 발 y −10.15(남쪽 목책 윗단에 등 댐 → ok=cliff) · 배율 0.756 → 폭 1.72칸(x 2.24~3.96) · 키 0.91칸(꼭대기 y −9.24) · 뾰족한 끝은 성문 오른쪽 기둥 쪽.
  - `MapLayer0` · OrderInLayer 1 · z −0.034(다른 장식과 같은 규칙) — 플레이어(Default 층)는 늘 위에 그려지고, 꼭대기가 y −9.24라 바로 위 칸 (2,−9)에 선 플레이어 발(y ≥ −9.0)과 겹치지 않는다 · 오른쪽 열린 칸 (4,−10)·왼쪽 문 칸 (1,−10)에 걸치지 않음.
  - 통과(pass·floor) 그림이라 충돌은 그대로 성문 발밑 padr=2 두 칸뿐 — 장식 막힘 칸 36 → 36 · 서버 칸 BFS 447/447 · 도착 자리 8걸음 · 걸음 바뀐 칸 0(`gate_bfs.md`, nm·hell 같음).
- 고른 근거 (`candidates.png` · 말뚝 / 말뚝 뒤집기 / 방책 / 까마귀 담):
  - 목책(나무 말뚝)·성문 들보·성문 꼭대기 말뚝과 같은 나무 말뚝이라 「목책과 기둥 사이 틈을 말뚝으로 막아 둔 자리」로 읽힌다 — 남문의 일부. 액트 1 맵에서 이미 쓰는 그림(처형장·교수대 숲).
  - `mp-barricade`(코덱스 성문 세트 a1_lm_ruined_gate의 방책 조각): 짙은 남색이 성문 돌·목책 나무와 어긋나 뺌.
  - `a1-crow-fence`·`mp-ruin-wall`(돌 담 조각): 역할표 facing north(정면 그림 = 북벽 전용) → 남쪽 목책 앞이면 검사기 facing 위반 → 역할표는 이 레인 것이 아니라 뺌.
  - `execution-broken-column`: 기둥 낱개(pillarSingle) 위반 · 푸른 돌색. 석상(`a1-adjunct-kneeling-stone-statue`): 두 칸을 못 채우고 키가 커 뒤(북쪽)에 선 플레이어와 겹침.
- 세트 줄로 넣은 이유: 배치표 prop 줄로 넣으면 손으로 고른 자리 뒤 v5 소품(ArtProp9·10 장작)의 이름이 한 칸씩 밀린다 → 세트(ArtSet1)는 따로 번호라 다른 장식 이름 불변. 그림 크기는 세트 조각 배율(0.84)로 — 메이플 그림이라 art_scale.csv가 아니라 maple_sprites.csv 기본 배율 × 역할 배율 × 세트 배율.

## diff 범위 증명 (`map-diff.log` · `map_diff.cjs <전> <후>`)
세 맵 모두 같음:
- 추가 1: `ArtSet1_1` (3.1, −9.696) — 남문 오른쪽
- 내용 바뀜 1: `GateToField` (0.5, −9.5) — `TriggerBox` (1.5, 0.5) 추가만
- 삭제 0 · 맵 머리 같음 · 타일(루트 엔티티) 같음
- 나머지 79개는 계층 순서 번호(displayOrder)만 +1(세트가 장식 줄 사이에 끼어서) — 자리·그림·색·크기 변경 0 · 기존 엔티티끼리 순서 그대로
- 다른 맵 파일 바이트 불변 — act1~4 compose 4번 + build 65장(난이도 복제 포함) 뒤 `git status`에 바뀐 맵은 town·town_nm·town_hell뿐 · 배치표 csv도 town.csv뿐(`compose-all.log` · `build-maps.log`)

그림: `town-gate2-before-after.png` (위: 전·후 그림 / 아래: 빨강 = 장식 충돌 칸 · 파랑 원 = 원 반경 0.6 · 초록 = 더한 사각 구역 · 칸 번호 = 문 줄 x).
- 주의: 메이플 그림(말뚝)은 assets에 64px 미리보기만 있어 그것을 원래 가로세로비로 늘려 그렸다(실제 게임 그림 216/228px보다 흐림 · 색·자리·크기는 같음).

## 검사
| 명령 | 결과 | 로그 |
|---|---|---|
| `node tools/check_map_composition.cjs --map town` (`--keep-ref HEAD`도) | v5 위반 0 | `check-town.log` |
| `node tools/check_map_composition.cjs --all` | 66장 v5 위반 0 · 엔티티 39433/47900 | `check-all.log` |
| `node tools/check_map_composition.cjs --selftest` | 29/29 · 심은 위반 38 검출 · 오탐 0 | `check-selftest.log` |
| `npm test` | 20/20 통과 | `npm-test.log` |
| `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua` | 실패 0 | `quality.log` |
| mlua LSP diagnose WarpGate.mlua | 오류 0 · 경고 1(56줄 StartMist `string.match` 3값 — 예전부터) · 정보 3(PartyId — 예전부터) | `lsp-warpgate.log` |
- town_nm·town_hell은 검사기 `--map`이 복제본 id를 받지 않아 BFS(`gate_bfs.md`)·`trigger_sim.md`·`map-diff.log`로 같음을 확인.
- routes.csv: town 행 없음 · 충돌 칸 그대로 → 변경 필요 없음(손대지 않음).

## 메이커 확인 절차 (메이커 담당)
1. `stop` → `refresh` (WarpGate.mlua 새 속성 → .codeblock 재생성 · town 3장) → 빌드 로그 오류 0. refresh 전에는 TriggerBox가 무시되어 예전처럼 가운데만 넘어간다.
2. 플레이 → 마을. 서버 로그 `[VRF] WarpGate box ready gate=GateToField map=town at=(0.50,-9.50) half=(1.50,0.50) radius=0.60 -> wasteland` (town_nm·town_hell도 들어가면 각자 한 줄) — 다른 맵 포털에서는 이 줄이 나오면 안 된다.
3. x −1·0·+1 각각: 준비 = 서버 `PlayerTravel.Go`로 (−0.5|0.5|1.5, −6.5)에 세움 → **실제 아래 방향키만** 길게(약 3초) → 옆으로 비키지 않고 황무지 도착.
   - 기대 로그: x −1 `[VRF] WarpGate box warp gate=GateToField map=town d=(-1.00,…) circle=false -> wasteland` · x 0 `d=(0.00,…) circle=true` · x +1 `d=(1.00,…) circle=false` (d.y는 0.6 이하 — 0.3초 검사라 들어선 뒤 조금 더 내려간 자리일 수 있다) → 이어서 기존 `map transition cover → wasteland` · 황무지 (−32.1, 0.5) 근처 도착.
   - 악몽·지옥 마을에서 한 칸 이상 같은 확인(대상 wasteland_nm / wasteland_hell).
4. 6-A: 줌 100에서 남문 오른쪽 — 기둥과 목책 사이 (2~4, −10)에 말뚝 묶음이 보이는가 · (4.5, −9.8)에서 왼쪽 → x≈4.01에서 멈춤(3,−10 막힘) · (2.5, −8.5)에서 아래 → y≈−9.0에서 멈춤(2,−10 막힘) · (2.5, −9.0)·(4.5, −9.99)에 서서 말뚝이 캐릭터를 가리거나 캐릭터가 말뚝 위에 올라선 것처럼 보이지 않는가 · 기둥 발 돌무더기와 말뚝 끝 겹침(같은 z −0.034 — 어느 쪽이 앞인지 엔진 순서) 확인.
5. 황무지에서 GateBack으로 돌아와 마을 도착 (0, −1.6) 그대로 · 도착 직후 2.5초 유예로 다시 빨려 나가지 않는가.

## 위험
- 말뚝 그림 실물은 오프라인에서 64px 미리보기로만 봤다 — 메이커에서 어색하면 세트 줄 하나(`map_sets.csv` a1_gate_east_stakes · 설계서 put 한 줄) 교체·삭제로 되돌린다. 충돌·다른 그림 영향 없음.
- 사각 구역 위 경계가 y −9.0이라, 위 줄(y −9) 바닥 맨 아래에 붙어 x −1~2를 옆으로 걸으면 넘어갈 수 있다(문 줄에 발을 들인 것과 같음 · 위 줄 가운데 y −8.5는 안 넘어감).
- 전투 중(근처 몬스터 4칸 안) 안내는 Radius+0.4=1.0 안에서만 — 마을엔 몬스터가 없어 해당 없음. 다른 맵에 gateBox를 쓰면 HudMap 안내 거리도 함께 볼 것.
- 공용 빌드 도구(compose·lib·maps.cjs)와 공용 표(map_sets.csv 한 줄 추가)를 건드렸다 — 지시된 소유 목록 밖. 다른 맵 출력은 바이트 불변으로 확인.
- 계층 순서 번호 79개 +1은 화면 영향이 없지만 메이커 Hierarchy 순서 표시는 한 칸씩 밀린다.

## 재현
```
node tools/build/handmade/compose.cjs act1 town && node tools/build/handmade/build.cjs town
git show 6eed5d72:map/town.map > /tmp/town-head.map
node docs/evidence/2026-11-01-town-gate-2/map_diff.cjs /tmp/town-head.map map/town.map
node docs/evidence/2026-11-01-town-gate-2/trigger_sim.cjs map/town.map
node tools/preview/export_map.cjs town before.json /tmp/town-head.map && node tools/preview/export_map.cjs town after.json
node docs/evidence/2026-11-01-town-gate/gate_bfs.cjs before.json after.json
```
