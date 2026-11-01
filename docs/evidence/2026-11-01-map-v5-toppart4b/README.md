# 맵 v5 윗부분 앞층 그림 4b차 7장 업로드·연결 (2026-11-01 · 액트 3 발 조각 8건)

코덱스 납품 `assets/codex-map-v5-toppart4b-20261101`(`DELIVERY-TOPPART4B-7.txt` · `REVIEW-TOPPART4B-7.html` · 영수증 `map-v5-toppart4b-delivered.json` · zip sha256 `cd7ae670…22ba` 다시 계산 = 영수증)을 월드 리소스로 올렸다. 그 뒤 생성기 `-top` 훅으로 액트 3 맵 7장을 다시 지었다. 메이커는 쓰지 않았다. 방식은 4차(`../2026-11-01-map-v5-toppart4/README.md` · 커밋 7bf4694f)와 같다. **생성기 코드는 바꾸지 않았다** — 표 두 개(`data/art_sprites.csv` · `data/handmade/top_cutlines.csv`)에 행만 더했다.

4b차는 4차에서 「발 조각」으로 빠진 8건을 고치려고 코덱스가 자르는 선을 내린 `-top-high` 판 7장이다(예배당 기둥 1장이 seachapel 2건 공용). 정본 `-top` 7장은 그대로 두었다.

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. **중복 확인.** 업로드 전에 `asset_list_group_resources`(OJYYQ · sprite/object)로 원본 7종 이름을 조회했다. 같은 이름의 `-top-high`는 0이다(원본과 `-top`만 있음). 4차 `-top-high` 2종(부러진 돛대 · 지도 탁자)과도 겹치지 않는다. `art_sprites`·`top_cutlines`에도 없었다.
2. `assets/`는 읽기만 했다. 7장을 scratchpad 팩으로 복사했다.
   - 원본·사본·코덱스 `resource-mapping.csv` sha256이 7/7 같다.
   - PNG는 모두 RGBA이고, 크기는 원본 그림(`art_sprites` w·h)과 7/7 같다. 원본 RUID도 `art_sprites`와 7/7 같다.
   - 알파를 직접 디코드해 「첫 완전 투명 줄(그 아래 전부 투명)」을 쟀다. **7/7이 코덱스 값(resource-mapping · top_cutlines-import · 영수증 cut_rows 둘째 값 셋 다)과 같다. 불일치 0.**
3. 업로드 전에 원본 7 RUID의 실제 피벗을 `asset_get_group_resource_metadata_bulk`(OJYYQ · 1회)로 읽었다. 코덱스 `resource-properties.csv` 피벗과 **문자열까지 7/7 같다.** 팩 `resource-properties.csv`에는 이 값을 넣었다.
4. `node tools/msw_mcp_call.cjs upload-res <팩>`으로 올렸다(`asset_create_group_resource_storage_item` 2단계). 팩 표는 `key · upload_name(= key) · category(prop) · file · RUID`다. 결과는 그룹 OJYYQ · sprite/object · **7/7**이다. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot(원본 실제 값)·filter Point·wrap Clamp를 넣었다(피벗은 처음 불리기 전에 넣음).
5. `asset_get_group_resource_metadata_bulk`(새 7 GUID · 1회)로 대조했다. **7/7 일치**다.
   - resultCode 0 · displayName = key · resourceType sprite · sprite/object
   - pivot = 원본 실제 피벗(문자열 같음) · Point · Clamp
   - RUID 중복 0
6. `.mcp.json`은 업로드하는 동안만 워크트리에 복사했다가 지웠다(커밋 안 됨).

| 그림 | 원본 | 크기 | 첫 투명 줄 정본 → high (실측=코덱스) | 남김 | 피벗 x·y(원본 실제 값) | 새 RUID |
|---|---|---|---|---|---|---|
| a3-figurehead-bow-top-high | a3-figurehead-bow | 280x280 | 94 → 133 | 19/40 | 0.5 · 0.014285714285714285 | 51d88d59c3f24b9aa5a80ee054297c6d |
| a3-landmark-admiral-anchor-wreck-top-high | a3-landmark-admiral-anchor-wreck | 512x512 | 171 → 212 | 53/128 | 0.5 · 0.0234375 | d56a0c5e4d9f4803a5d03cac84357ad9 |
| a3-landmark-shell-mound-top-high | a3-landmark-shell-mound | 512x512 | 171 → 187 | 187/512 | 0.5 · 0.0234375 | 9fd5a4ae447749f29800eeaf920d057e |
| chapel-pillar-top-high | chapel-pillar | 112x176 | 118 → 122 | 61/88 | 0.5045045045045045 · 0.017142857142857144 | 87ba07e4609345b39163050e2920e116 |
| a3-landmark-mad-lens-workbench-top-high | a3-landmark-mad-lens-workbench | 512x512 | 256 → 265 | 265/512 | 0.5 · 0.0234375 | cf4816f6edc54d9d9048528508acb696 |
| a3-landmark-broken-lens-stand-top-high | a3-landmark-broken-lens-stand | 512x512 | 171 → 178 | 89/256 | 0.5 · 0.0234375 | 0f7e2aa6d80948dfaceef0bee52c9682 |
| a3-landmark-salt-crystal-spire-top-high | a3-landmark-salt-crystal-spire | 512x512 | 171 → 176 | 11/32 | 0.5 · 0.0234375 | dfeca02316fc49159ab99582d47e2b48 |

## 2. 표 갱신

- `data/art_sprites.csv`: 7행을 4차 블록 끝(`a3-landmark-smuggler-map-table-top-high`) 바로 뒤(1489~1495행)에 넣었다. kind·w·h는 원본과 같다(모두 prop-1x). 1627 → 1634줄.
- `data/handmade/top_cutlines.csv`: 7행을 끝에 넣었다. `first_clear_row`는 실측 값(= 코덱스 7/7), `pivot_y`는 원본 실제 값, `keep_upper`·`cut_class`·`pack`은 코덱스 `top_cutlines-import.csv` 그대로다. 107 → 114줄.
- 생성기 코드는 그대로다. `-top-high`는 같은 원본의 배치 변형 후보로 자동으로 잡힌다(`topCandidates`). 생성기는 규칙(발 조각 없음 · 앞 머리 안 덮음)을 지키는 후보 중 자르는 선이 가장 높은 것을 고른다.

## 3. 다시 짓기 결과 (`build-maps.log` · `top-count-by-map.csv` · `mapdiff.log` · `compare.log`)

`node tools/build/handmade/build.cjs wreckcoast stormeye crabcave1 seachapel keeperhouse lighthouse2 saltflat`(난이도 복제 포함)의 결과: **액트 3 맵 파일 Top 엔티티 30 → 38.** 노말·_nm·_hell 합은 90 → 114다.

- 작업 전에 HEAD 표·생성기로 `--out` 지은 결과가 HEAD 맵 파일과 7/7 바이트 같았다(누락분 없음).
- 바뀐 맵 파일은 21개 = 7장 × 3이다.
- 다시 짓지 않은 액트 3 9장을 이번 표로 `--out` 지어 보니 맵 파일과 9/9 바이트 같았다. 즉 이번 표는 그 맵들을 바꾸지 않는다.
- **나머지 맵 190파일은 바이트 불변**이다(작업 전후 sha256 같음 · 액트 1·2·4 150파일 포함).
- HEAD ↔ 이번 맵 파일 대조(211파일): 없어진 것 0 · 새 Top 24 · Top 아닌 새 엔티티 0 · 바뀐 엔티티 0(displayOrder 제외).

| 맵 | Top 전→후 | 놓음 | 앞 머리 | 발 조각 | 막힘 없음 | 새 Top 그림 |
|---|---|---|---|---|---|---|
| saltflat | 1→2 | 2 | 0 | 1→0 | 0 | 소금 결정 기둥 `-top-high` |
| wreckcoast | 2→3 | 3 | 3 | 1→0 | 0 | 뱃머리 `-top-high` |
| lighthouse2 | 2→3 | 3 | 3 | 1→0 | 0 | 깨진 렌즈 받침 `-top-high` |
| stormeye | 0→1 | 1 | 6 | 1→0 | 0 | 제독의 닻 `-top-high` |
| crabcave1 | 0→1 | 1 | 0 | 1→0 | 0 | 껍질 무더기 `-top-high` |
| seachapel | 3→5 | 5 | 0 | 2→0 | 0 | 예배당 기둥 `-top-high` 2 |
| keeperhouse | 1→2 | 2 | 0 | 1→0 | 0 | 렌즈 작업대 `-top-high` |
| 다른 액트 3 9장 | 21→21 | 21 | 10 | 0 | 1 | — |
| **합** | **30→38** | **38** | **22** | **8→0** | **1** | |

## 4. 놓음 / 건너뜀 (`cutline-check.csv` 61행 · `front-head-cells.txt`)

액트 3에서 `-top` 후보가 있는 장식 인스턴스 61개를 생성기 판정 그대로 적었다. 판정은 생성기 파일을 바꾸지 않고, 메모리에서 기록 한 줄만 끼운 `--out` 빌드로 뽑았다(그 출력이 맵 파일과 16/16 바이트 같음). 칸 구성은 4차와 같다.

| 판정 | 4차 | 4b차 | 내용 |
|---|---|---|---|
| 놓음 | 30 | **38** | 4차 30 + 발 조각이던 8건 |
| 건너뜀 · 앞 머리 | 22 | **22** | 등불 기둥 22 — 그대로(남벽 밀착 14 · 앞뒤 바닥 8 · 이번 레인 범위 밖) |
| 건너뜀 · 발 조각 | 8 | **0** | — |
| 건너뜀 · 막힘 없음 | 1 | **1** | harbor 묶인 배 |

**발 조각 8건의 결과 — 8/8 놓음, 모두 `-top-high`가 뽑혔다.** 「자르는 선 − 막힘 꼭대기」는 0 이하(발 조각 없음)이고, 앞 머리 여유는 모두 1.24칸 이상이다. 앞 머리 규칙에 새로 걸린 것은 없다.

| 맵 | 장식 | 그림 | 자르는 선 정본 → high | 막힘 꼭대기 | 자르는 선 − 막힘 꼭대기 | 앞 머리 여유 | 뒤 칸 |
|---|---|---|---|---|---|---|---|
| wreckcoast | ArtProp5 | 뱃머리 | 13.557 → 12.987 | 13 | −0.013칸 | 2.237칸 | 바닥 |
| stormeye | ArtProp1 | 제독의 닻 | 11.294 → 10.996 | 11 | −0.004칸 | 2.246칸 | 벽 |
| crabcave1 | ArtSet1_1 | 껍질 무더기 | 9.103 → 8.996 | 9 | −0.004칸 | 2.246칸 | 바닥 |
| seachapel | ArtProp2 | 예배당 기둥(북열) | −2.918 → −3.000 | −3 | **−0.000008칸** | 1.250칸 | 바닥 |
| seachapel | ArtProp4 | 예배당 기둥(북열) | −2.918 → −3.000 | −3 | **−0.000008칸** | 1.250칸 | 바닥 |
| keeperhouse | ArtProp1 | 렌즈 작업대 | 13.063 → 12.998 | 13 | −0.002칸 | 1.248칸 | 벽 |
| lighthouse2 | ArtSet2_1 | 깨진 렌즈 받침 | 16.041 → 15.995 | 16 | −0.005칸 | 2.245칸 | 바닥 |
| saltflat | ArtSet2_1 | 소금 결정 기둥 | −5.974 → −6.006 | −6 | −0.006칸 | 2.244칸 | 바닥 |

- 예배당 남열 기둥 2개(ArtProp3·ArtProp5)는 정본 `-top`이 그대로 뽑혔다(정본 자르는 선 3.282가 high 3.2보다 높고 규칙도 지킴). 영수증의 「다른 예배당 2개는 정본 유지」와 같다. seachapel 기둥은 4개 모두 Top이 있다.
- 예배당 기둥 `-top-high`는 「자르는 선 − 막힘 꼭대기」가 −0.000008칸이다(생성기 허용 오차 1e-6에 기댄 것이 아니라 실제로 0보다 아래). 코덱스도 「very tight 0.000008 cell」이라고 적었다. 메이커에서 뒤에 선 발끝이 경계에 닿는지 가장 먼저 볼 자리다.
- 놓은 38개는 모두 아래가 0이다: 원본과 위치·배율·뒤집기·색이 다름 · 그림 ≠ 고른 후보 · 층/순서 ≠ Default/5 · 놓았는데 맵 파일에 Top 없음 · 안 놓았는데 맵 파일에 Top.
- `front-head-cells.txt`(등불 앞 머리 22 · 놓은 등불 10)는 4차와 같다: 앞 칸 벽 14 · 앞뒤 바닥 8.

## 5. 검사 (`check-map-composition.log`·`.json` · `npm-test.log`)

- `node tools/check_map_composition.cjs --all`: 맵 66장(v5 66) · **v5 위반 0** · 엔티티 **39471 / 47900**(4차 39463 + 8).
- tallNoTop 전체: 22종 33개 그대로(액트 3 0).
- topSkipped 전체: 17종 78개 → **10종 70개**(액트 3은 등불 22 · 묶인 배 1만 남음).
- 바뀐 7장 밖 59장의 검사기 맵 보고는 4차 증거 JSON과 같다.
- `--selftest`: 입력 33 · 심은 위반 41건 모두 검출 · 오탐 0.
- `npm test`: **21/21 통과.**

## 6. 남은 것

1. 등불 앞 머리 22 · 묶인 배 1은 4차 README §6 그대로다(생성기 결정 · 그림 재작업 아님).
2. 런타임(가려짐 · 이름표 · 두 겹 짙어짐 · 옆 잘림 · 2줄 깃털 경계 · 메이커 반영)은 확인하지 않았다(메이커 금지 · 코덱스도 runtime_verified false).

## 7. 메이커 확인 자리

- `../2026-11-01-map-v5-act3/CAPTURE-PLAN-act3.txt`: 지문 줄(Art · ArtTop · 맵 자식)을 바뀐 7장만 이번 맵 파일 값으로 고쳤다(16/16 = 맵 파일 값). 끝에 「윗부분 앞층 4b차」 절을 붙였다. 절은 8건마다 뒤에 설 자리 `(발 x, 막힘 꼭대기 + 0.3)` 또는 「뒤 칸 벽 — 옆에서」, 윗부분 시작 y, 정본이었을 때 자르는 선, 앞 머리 여유를 담는다.
- 반영하려면 바뀐 `.map` 21파일에 대해 Maker 멈춤 → 5초 → touch → 5초 → refresh 1회.
