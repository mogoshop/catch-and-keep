# Codex 요청 — 액트 1 환경 그림 (바닥·벽·길·장식) (2026-10-10, Claude)

사용자 결정(10-10): 액트 1 지형을 액트 2(코덱스 환경 그림 77장) 수준으로 올린다. 그림은 **코덱스 신규**, 연결은 Claude가 한다.
지금 액트 1은 타일 그림이 잿빛 흙·자갈 2장뿐이라 모든 맵이 같은 회색 바닥 + 벽돌 길 띠이고, 테두리·벽이 없다.

## 0. 연결 방식 (액트 2와 같다 — 그대로 맞춰 주면 바로 붙는다)

- 납품: `assets/codex-act1-env-v1/` 아래 **`upload-environment-mapping.csv`**(upload_name, asset_key, category, canonical_file, upload_file, RUID, group) + **`resource-mapping.csv`**(RUID별 width·height).
  Claude가 `node tools/import_art.cjs assets/codex-act1-env-v1 --pivot …`로 `data/art_sprites.csv`에 넣고, 맵마다 `data/map_art.csv` 한 줄로 배치한다.
- 업로드: **그룹 저장소(OJYYQ)**, 분류(subcategory) `object`. 피벗은 Claude가 일괄로 맞춘다 (바닥·벽 = 가운데 + 반복, 장식 = 발밑).
- `category` 값: `floor` · `border-atlas` · `prop` · `effect` (액트 2와 같다).

| 종류 | 크기 | 규칙 |
|---|---|---|
| **floor** (바닥) | 128×128 | **이음매 없이 반복**되는 바닥. 큰 무늬 반복이 눈에 띄지 않게 |
| **border-atlas** (벽 9조각) | 조각마다 128×128 × 9장 (`<이름>-borders-nw/n/ne/w/center/e/sw/s/se`) | 액트 2 `cave-borders`와 같은 구성: **바위(벽) 덩어리 하나를 9칸으로 자른 것**. `center` = 꽉 찬 벽 안쪽(반복 가능), `n/s/e/w` = 그 쪽 바깥 가장자리(바깥은 투명, 거친 윤곽), 모서리 4장 = 바깥 모서리. 이 조각들로 **통로 던전의 벽을 칸마다** 그린다 (아래 1절) |
| **prop** (장식) | 표 크기 | 배경 투명, 발밑 기준. 길을 막지 않는 장식 (통행 판정은 타일이 한다) |
| **road** (길) | 128×128 | `floor`와 같은 반복 그림 (category는 `floor`로) |

- 시점·화풍: 지금 게임과 같은 **탑다운(위에서 비스듬히)**, 어두운 고딕 판타지. 액트 1 팔레트: 잿빛 흙 · 마른 핏자국 · 썩은 녹색 늪 · 차가운 회청 돌 · 화로 주황 불빛.
- 어둠 연출(맵 전체 어둡게 + 플레이어 주변만 밝게)이 그 위에 덮이므로 **바닥은 너무 어둡지 않게**(액트 2 `dry-ground` 밝기 정도).

## 1. 꼭 필요한 것 (먼저) — 통로 던전 벽

10-10부터 곁가지 던전을 디아블로 2 동굴처럼 **방 + 폭 2칸 굽은 통로(미로)**로 빌드가 자동 생성한다 (`data/map_layouts.csv`, 첫 시험: 굶주린 굴).
지금은 액트 2 `cave-borders`(모래색 바위)를 회색으로 덧칠해 쓰는 임시 상태다.

| upload_name | 종류 | 모습 |
|---|---|---|
| `ash-cave-borders-*` (9장) | border-atlas | 회청·잿빛 동굴 바위 덩어리. 바닥 쪽 가장자리는 거친 바위 윤곽 + 옅은 그림자 |
| `crypt-borders-*` (9장) | border-atlas | 납골당 돌벽 (회색 석회암 블록, 금 간 벽면, 해골 벽감 약간) |
| `ash-cave-floor` | floor | 잿빛 동굴 바닥 (자갈·뼛조각 드문드문) |
| `crypt-floor` | floor | 금 간 판석 바닥, 이끼·핏자국 약간 |

- 벽 조각은 **1칸(1월드 단위)에 한 장**으로 축소돼 칸마다 붙는다 → 가장자리 조각끼리 **위아래·좌우로 이어 붙였을 때 이음매가 맞아야** 한다 (`n`끼리 가로로, `w`끼리 세로로).

## 2. 맵별 바닥·벽·장식

| 맵 id | 이름 | 크기(칸) | 바닥 | 벽(테두리) | 장식 (각 1~2장 변형이면 좋다) |
|---|---|---|---|---|---|
| `town` | 잿불 야영지 (마을) | 24×14 | `ash-camp-floor` 다져진 잿빛 흙 + `ash-road` 자갈길 | `palisade-borders` 나무 말뚝 울타리 | 모닥불 화로, 낡은 천막, 짐수레, 장작더미, 무기 걸이 |
| `map01` | 피 묻은 황무지 | 44×24 | `blood-waste-floor` 핏자국 마른 흙 | `waste-borders` 바위 언덕 | 죽은 나무(이미 있음 — 대체 가능), 해골 무더기, 부러진 창, 마른 덤불 |
| `rotmarsh` | 썩은 갈대 늪 | 44×24 | `marsh-floor` 진흙 + 웅덩이 무늬 | `reed-borders` 빽빽한 갈대·늪물 | 썩은 통나무, 늪 웅덩이(장식), 갈대 덤불, 가라앉은 수레바퀴 |
| `execution` | 무너진 형장 | 52×28 | `execution-floor` 깨진 판석 + 흙 | `ruin-wall-borders` 무너진 석벽 | 처형대, 형틀, 쇠사슬 기둥, 무너진 기둥 |
| `gallows` | 교수대 숲 | 52×28 | `forest-floor` 낙엽·뿌리 흙 | `treeline-borders` 검은 나무숲 가장자리 | 교수대, 매달린 밧줄, 고목, 까마귀 앉은 그루터기 |
| `crypt1~3` | 지하 납골당 1~3층 | 36×20 | `crypt-floor` | `crypt-borders` | 석관, 뼈 단지, 촛대, 무너진 관 |
| `queentomb` | 여왕의 무덤 (보스방) | 20×12 | `queen-floor` 문양 새긴 검은 판석 | `crypt-borders` | 왕좌 석관, 핏빛 휘장, 큰 촛대 |
| `depth` | 심도 | 14×8 | `depth-floor` 균열에서 붉은빛 새는 바닥 | `ash-cave-borders` | (없어도 된다) |
| `hollow` | 굶주린 굴 | **32×20** (통로 미로) | `ash-cave-floor` | `ash-cave-borders` | 뼈 더미, 갉아먹힌 시체 |
| `cellar1~2` | 가라앉은 지하실 | 24×16 | `cellar-floor` 물 고인 벽돌 | `crypt-borders` | 썩은 술통, 무너진 선반 |
| `pit1~2` | 뼈 구덩이 | 28×16 | `bone-floor` 뼈가 깔린 흙 | `ash-cave-borders` | 뼈 무더기, 해골 탑 |
| `cave` | 목매단 동굴 | 28×18 | `ash-cave-floor` | `ash-cave-borders` | 매달린 밧줄·시체, 종유석 |

- 길(`ash-road`)은 마을·필드 가운데 가로 띠에 쓴다 (지금 벽돌 띠 자리).
- 장식 크기 기준(액트 2): 바위 180×140, 우물 160×180, 천막 240×180, 기둥 160×260, 책장 220×180.

## 3. 우선순위

1. **1절 통로 벽·바닥 4종** (`ash-cave-*`, `crypt-*`) — 통로 던전 확대(곁가지 6곳 + 납골당)의 전제
2. 마을·필드 바닥 5종 + 벽 4종 + 길
3. 장식

들어오면 Claude가 연결·빌드·메이커 확인까지 한다. 타일 배열(통행 판정)은 건드리지 않아도 된다 — 통로 던전은 빌드가 만들고, 필드는 지금 타일 그대로 위에 그림만 덮는다.
