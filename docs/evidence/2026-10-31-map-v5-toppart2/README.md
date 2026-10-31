# 맵 v5 윗부분 앞층 그림 2차 33종 + 배치 변형 1 업로드·연결 (2026-10-31)

코덱스 납품 `assets/codex-map-v5-toppart2-20261031`(요청 `claude-map-v5-toppart-request2-2208.txt` · 핸드오프 `map-v5-toppart2-delivered.json` · zip sha256 `3cdcab87…37d7` 다시 계산해 같음)을 월드 리소스로 올렸다. 그 뒤 생성기 `-top` 훅으로 v5 맵 35장(액트 4 18장 · 액트 1 15장 · 표본 2장)을 다시 지어 앞층 엔티티를 만들었다. 메이커는 쓰지 않았다. 선례는 `../2026-10-31-map-v5-toppart/README.md`·`LAYER-FIX.md`(1차 13종)다.

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. `assets/`는 읽기만 했다. 34장(정본 33 + 배치 변형 1)을 scratchpad 팩으로 복사했다.
   - 원본·사본·코덱스 표 sha256이 같다.
   - PNG는 모두 RGBA8이고 크기는 원본 그림과 같다.
   - 알파를 직접 디코드해 「첫 완전 투명 줄(그 아래 전부 투명)」을 쟀다. **34/34가 코덱스 `first_fully_transparent_row`와 같다.** 구조는 위 2/3, 일반 특징은 위 1/2, 열린 바닥 특징은 위 1/3을 남긴다.
2. 업로드 전에 원본 33 RUID의 실제 피벗을 `asset_get_group_resource_metadata_bulk`(OJYYQ · 1회)로 읽었다. 코덱스 `resource-properties.csv` 피벗과 **33/33 문자열까지 같다.**
3. `node tools/msw_mcp_call.cjs upload-res <팩>`으로 올렸다. 팩 표에는 `upload_name`(= key)·`category`(prop) 칸을 더했다. 그룹 OJYYQ · sprite/object · **34/34**다. RUID를 받은 직후 같은 루프에서 pivot(원본 실제 값)·filter Point·wrap Clamp를 넣었다.
4. `asset_get_group_resource_metadata_bulk`(새 34 GUID · 1회)로 대조했다. 결과는 **34/34 일치**다.
   - resultCode 0
   - displayName = key
   - pivot = 원본 실제 피벗
   - Point · Clamp · sprite/object
   - RUID 중복 0
5. `data/art_sprites.csv`에 `<원본>-top` **34행**을 넣었다(1396~1429행 · 1차 블록 바로 뒤). kind·w·h는 원본과 같다.
6. `.mcp.json`은 업로드하는 동안만 워크트리에 복사했다가 지웠다(커밋 안 됨).
7. 코덱스가 뺀 것은 `a4-molten-channel-v` 1종이다. 바닥에 깔린 세로 수로라서 요청이 허용한 제외다. 그래서 검사기 tallNoTop에 남는다.

### 배치 변형 1 = `a2-landmark-temple-stair-censer-top-feature-half`

- **무엇:** 같은 원본(향로 계단)을 다른 선으로 자른 그림이다.
  - 정본 `-top`은 위 1/3만 남긴다(자르는 선 = 높이 2/3). sanctum 배치표가 `foot=0.67`(열린 바닥)이기 때문이다.
  - 변형은 위 1/2를 남긴다(자르는 선 = 높이 1/2). temple1 세트 `a2_lm_censer`는 foot 인자가 없어 역할 비율 1/2로 막기 때문이다.
  - 근거: `records/placement-variant1.json`의 `placement_use`.
- **어디:**
  - 지금 이 그림을 쓰는 v5 맵은 sanctum 1곳(ArtProp25)뿐이다. 생성기가 정본 `-top`을 골랐다(자르는 선 − 막힘 꼭대기 −0.46칸 · 아래 2절 규칙).
  - temple1은 v4 맵(설계도에 `;v5` 없음)이라 훅이 돌지 않는다. 그래서 **지금 쓰는 곳은 0이다.**
  - art_sprites·top_cutlines 행만 미리 넣어 두었다. 액트 2를 v5로 바꾸면 temple1(막힘 1/2)에서는 정본의 2/3 자르는 선이 막힘 꼭대기보다 위가 된다. 그때 생성기가 변형을 자동으로 고른다(후보 선택 규칙).

## 2. 생성기 변경 (`tools/build/handmade/lib.cjs` · `data/handmade/top_cutlines.csv` 새 표)

1차 훅(같은 위치·배율·뒤집기·색 · Default/5 · artsprite · 충돌 없음 · 「자르는 선 > 막힘 꼭대기면 놓지 않음」)은 그대로 두었다. 2차 그림에 맞춰 아래 네 가지만 바꿨다.

| 변경 | 이유 |
|---|---|
| **실제 자르는 선** — `top_cutlines.csv`(1차 13 + 2차 34행)에서 `(h − 첫 완전 투명 줄)/h − pivot_y`를 읽는다. 표에 없는 -top은 예전처럼 역할 비율을 쓴다. | 2차는 열린 바닥 특징의 위 1/3만 남긴다(자르는 선 = 2/3). 1차 훅의 역할 비율(특징 1/2)로 재면 자르는 선을 0.5칸 넘게 낮게 잡는다. 그러면 「발 조각」 규칙이 아무것도 거르지 못한다. |
| **피벗을 뺀다** — 그림 바닥은 발 y보다 `pivot_y × 화면 높이`만큼 아래에 있다. | 1차는 생성기에 피벗 값이 없어 빼지 않았다(보수적). 2차 열린 바닥 특징은 자르는 선과 막힘 꼭대기 차이가 +0.04~+0.2칸이다. 그래서 피벗(0.07~0.12칸)을 빼야 실제로 발 조각이 생기는지 맞게 판정된다. 피벗은 1의 업로드 직후 읽은 실제 값이다. |
| **배치 변형 선택** — 후보는 `<그림>-top`과 표에 있는 `<그림>-top-<변형>`이다. 규칙을 지키는 후보 중 자르는 선이 가장 높은 것을 쓴다. | 향로 계단 변형 (1절) |
| **앞 머리 규칙(새로 넣음)** — 앞(남쪽)에 붙어 선 플레이어의 머리(발 칸 아래 경계 + 0.75칸)가 자르는 선보다 위면 놓지 않는다. | 앞층은 y와 상관없이 아바타(순서 4) 위에 그려진다. 그래서 앞에 선 사람 머리를 덮는다. 원본만 있을 때는 y 정렬로 사람이 앞에 그려졌으므로, 놓으면 오히려 퇴보다. 해당은 2차 혼 우리 16(머리 − 자르는 선 +0.09칸)과 창살 13(+0.11칸) **29개**다. 모두 벽 밀착이라 뒤에 설 칸도 없어서, 놓아도 뒤 가림 이득이 0이다. 1차 92개는 해당 0이다(최소 여유 +0.04 책장). |

- 빌드 경고 문구에 「또는 앞에 선 머리를 덮음」을 더했다. `artEntities`는 `topSkipped` 목록(이름·그림·이유·자르는 선·막힘 꼭대기)을 돌려준다.
- **1차 판정은 그대로다.**
  - 액트 1 v5 15장(45파일)은 다시 지었지만 바이트가 같다.
  - sanctum 1차 Top 17개, 열주 남열 6개 놓지 않음(자르는 선 −1.896 > 막힘 꼭대기 −2)이 유지된다.
  - sulfurmarsh 쓰러진 거인 놓지 않음(14.15 > 14)도 유지된다.

## 3. 다시 짓기 결과 (`top-count-by-map.csv` · `build-maps.log` · `mapdiff.log`)

`node tools/build/handmade/build.cjs <v5 35장>` 결과: **Top 엔티티 83 → 179 (+96).** 맵별 전/후는 아래와 같다. Top 수가 그대로인 맵은 빠졌다.

| 맵 | 종류 | Top 전→후 | 새 Top 그림 |
|---|---|---|---|
| throne | v5 | 0→21 | 혼 등불 8 · 잉걸 기둥 5 · 뿔 석상 4 · 옥좌 깃발 2 · 오벨리스크 1 · 작은 배교자 제단 1 |
| abyssgate1 | v5 | 0→11 | 혼 등불 10 · 숨 쉬는 룬 기둥 1 |
| throneante | v5 | 2→10 | 뿔 석상 5 · 혼 등불 2 · 무릎 꿇은 석상 열 1 |
| abyssgate3 | v5 | 0→8 | 인장석 6 · 혼 등불 2 |
| abyssgate2 | v5 | 1→8 | 혼 등불 3 · 인장석 3 · 재에 묻힌 석상 1 |
| burningkeep | keep | 2→9 | 혼 등불 2 · 뿔 석상 2 · 용암 성벽 탑 · 공성 병기 · 뿔 해골 문 각 1 |
| demonroad | keep | 0→6 | 뿔 석상 2 · 군막 · 뿔 해골 문 · 공성 병기 · 악마 군기 각 1 |
| forge1 | v5 | 3→6 | 악마 깃발 3 |
| heartbridge | keep | 3→6 | 인장석 2 · 심장 다리 석상 1 |
| outpost | keep | 0→5 | 군막 2 · 망루 2 · 신호 화로 1 |
| embercanyon | keep | 1→3 | 인장석 2 |
| apostate · ashhall · soulprison · sulfurcave1 | v5·v5·v5·keep | +1씩 | 배교자 제단 · 재의 강 폭포 · 혼 우리 탑 · 유황 결정 |
| sanctum (표본) | v5 | 17→27 | 비석 9 · 향로 계단 1 |
| sulfurmarsh (표본) | keep | 7→8 | 마른 나무 1 |
| forge2 · pit · sulfurcave2 | keep | 0→0 · 2→2 · 0→0 | 놓지 않음(아래 「발 조각」) |
| 액트 1 15장 | — | 그대로(35) | 2차 그림을 쓰는 장식 없음 |

- **keep 맵에도 훅이 걸린다.** `;v5 keep`도 `bp.v5 = true`이고 장식은 역할 배치다. 그래서 keep 9장 중 6장에 Top이 생겼다.
  - forge2·pit·sulfurcave2는 훅이 돌았지만 규칙에 걸려 0이다. berka-anvil 자르는 선이 막힘 꼭대기보다 +0.70칸, bone-roost가 +0.66칸, pit 검 무덤이 +0.17칸, pit 마른 나무가 +0.08칸 높다.
  - sulfurcave2와 forge2의 랜드마크는 세트 조각(`foot` 인자 없음 = 막힘 1/2)이다. 그런데 코덱스는 이 둘을 「feature 1/2」로 잘랐다. 그래서 막힘(1/2 + 최소 2줄 + 칸 경계)과 엇갈렸다.
- 맵 파일을 HEAD와 대조했다(`mapdiff.log` · 노말·_nm·_hell 51파일). 없어진 것 0, Top이 아닌 새 엔티티 0, Top이 아닌 바뀐 엔티티 0(displayOrder 제외)이다. 새 Top은 모두 SortingLayer Default · OrderInLayer 5이고, Transform + SpriteRenderer만 있다.
- 메모리에서 지은 결과(검사기와 같은 계산)와 맵 파일의 Top 수·그림별 수가 35장 모두 같다(`cutline-check.csv` 생성 단계).

## 4. 자르는 선 vs 충돌 높이 (`cutline-check.csv` 228행 · `cutline-summary.txt`)

v5 맵 35장에서 -top 후보가 있는 장식 인스턴스마다 다음을 적었다.

- 자르는 선(발 위 칸): 실제 줄 − 피벗
- 막힘 꼭대기: 발 칸 열의 막힌 칸 위 경계
- 차이
- 판정
- 놓음 여부
- Top이 원본과 같은 위치·배율·뒤집기·색인지와 층/순서
- 앞(남쪽) 머리 여유
- 뒤에 설 자리와 그 칸을 걸을 수 있는지

**2차 그림 인스턴스 136개**:

| 판정 | 수 | 내용 |
|---|---|---|
| 놓음 · 가리는 쪽(자르는 선이 막힘 꼭대기보다 0.3칸 넘게 아래) | **85** | 막힌 칸 바로 뒤에 서도 몸 전체가 윗부분 쪽이다. 1차와 같은 꼴이다(최소 2줄 · 올림 · 칸 경계). |
| 놓음 · ±0.3칸 일치 | **11** | 열린 바닥 랜드마크 6(−0.02~−0.03칸) · 신호 화로 −0.15 · 뿔 석상 2 · 공성 병기 1 · 마른 나무(유황 늪) −0.02 |
| 놓지 않음 · 발 조각(자르는 선 > 막힘 꼭대기) | **11** | 잉걸 기둥 5(+0.055) · 귀환한 심장 제단 +0.069 · 대주교 설교대 +0.069 · berka 모루 +0.70 · 박쥐 여왕 뼈 둥지 +0.66 · pit 마른 나무 +0.084 · 초소 문(막힌 칸 없음 — 기능 자리 칸이라 안 막힘) |
| 놓지 않음 · 앞 머리 | **29** | 혼 우리 16 · 창살 13 (2절) |

- 놓은 96개는 모두 원본과 위치·배율·뒤집기·색이 같고, 그림 = 고른 -top, Default/5다.
- 앞 머리 여유는 최소 +0.03칸(혼 등불)이다. 놓은 것 중 음수는 0이다.
- 뒤에 설 칸이 벽인 것(벽 밀착 그림)은 옆에서만 가린다: 비석 9 · 악마 깃발 3 · 군막 2 · 뿔 해골 문 2 · 옥좌 깃발 2 · 혼 등불 일부 · 인장석 3 · 배교자 제단 · 혼 우리 탑 · 룬 기둥.
- 1차 그림 인스턴스 92개(액트 1 촛대 등 포함)는 놓음 83 · 놓지 않음 9로 이번 작업 전과 같다.

## 5. 검사 (`check-map-composition.log`·`.json` · `compare-65.log` · `npm-test.log`)

- `node tools/check_map_composition.cjs --all`: **v5 위반 0** · 엔티티 **43192 / 47900**(직전 43096 + 96).
- **tallNoTop(키 큰 특징·구조인데 -top 없음): 55종 172개 → 22종 61개.** 남은 것은 아래 둘이다.
  - 액트 1 **21종 59개** = 코덱스 3차 요청 후보(2차 납품 범위 밖): queen-sarcophagus-altar · ruined-gate · bone-pulley-crane ×2 · gallows-tree · collapsed-barrel-shelf ×2 · execution-scaffold · half-sunken-watchtower · hanging-corpse-pillar · ossuary-niche-pillar ×2 · camp-tent ×3 · execution-broken-column ×7 · execution-platform ×2 · queen-great-candelabra ×2 · a1-skull-banner ×14 · forest-gallows · queen-blood-banner ×6 · execution-chain-pillar ×2 · a1-bone-tower ×3 · a1-headless-king-statue · a1-rotten-well ×4 · pit-skull-tower ×2
  - `a4-molten-channel-v` ×2(코덱스 제외 · 바닥 수로)
- **새 경고 `topSkipped`(위반 아님):** -top은 있는데 안 놓은 장식으로 **12종 49개**다. 발 조각 20(1차 열주 남열 6 · 쓰러진 거인 2 · 검 무덤 1 포함)과 앞 머리 29로 나뉜다. 3차 후보는 아래 셋이다.
  - (a) 막힘을 한 줄 더 두거나(배치표 `foot`) 자르는 선을 0.1~0.2칸 내린 그림: 잉걸 기둥 · 심장 제단 · 설교대 · 마른 나무 · 검 무덤 · 거인 · 열주 남열
  - (b) 세트 랜드마크(berka 모루 · 뼈 둥지)를 위 1/3로 자르거나 세트에 `foot=0.67`
  - (c) 혼 우리·창살은 벽 밀착이라 앞층이 필요 없다(그대로 두는 것을 추천)
- 다른 맵 불변(`compare-65.log`):
  - 설계도 맵 65장을 `--out`으로 두 번 지었다(HEAD 생성기·art_sprites / 이번 것). **48장이 바이트가 같고**, 다른 17장은 정확히 위 Top이 바뀐 맵이다(이번 `--out` 결과 = `map/` 파일 17/17).
  - `map/` 액트 2·3 파일 93개(노말·_nm·_hell · sanctum 제외)는 전후 sha256이 같다.
- 자가 테스트(npm test 안): 입력 29 · 심은 위반 38건 모두 검출 · 오탐 0.
- `npm test`: **20/20 통과.**

## 6. 메이커 확인 자리

- `../2026-10-31-map-v5-act4/CAPTURE-PLAN-act4.txt`
  - 지문 줄(Art·ArtTop·맵 자식)을 이번 맵 파일 값으로 갱신했다. 옛 값 18/18이 HEAD 맵 파일 값과 같았다.
  - 끝에 「윗부분 앞층 2차」 절을 넣었다. 맵마다 그림별 놓음 수, 뒤에 설 자리, 윗부분 시작 y, 놓지 않은 것(대조)이 들어 있다.
- `../2026-10-31-map-v5-act1/CAPTURE-PLAN-act1.txt`: 바뀐 것이 없다는 메모를 넣었다(21종 = 3차 후보).
- `../2026-10-31-map-v5-sample/CAPTURE-PLAN.txt`: 「3-2 갱신」을 넣었다. 비석·향로 계단·유황 늪 마른 나무는 이제 대조가 아니다. Top 수는 sanctum 27 / sulfurmarsh 8이다.
- 런타임(가려짐·이름표·두 겹 짙어짐·옆 잘림)은 확인하지 않았다(메이커 금지).
