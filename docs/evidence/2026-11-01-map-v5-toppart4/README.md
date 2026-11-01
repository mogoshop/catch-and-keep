# 맵 v5 윗부분 앞층 그림 4차 27장 업로드·연결 (2026-11-01 · 액트 3)

코덱스 납품 `assets/codex-map-v5-toppart4-20261101`(`DELIVERY-TOPPART4-27.txt` · `REVIEW-TOPPART4-27.html` · zip sha256 `d6d251b8…6c32` 다시 계산)을 월드 리소스로 올렸다. 그 뒤 생성기 `-top` 훅으로 액트 3 v5 맵 16장을 다시 지었다. 메이커는 쓰지 않았다. 방식은 3차(`../2026-11-01-map-v5-toppart3/README.md` · 커밋 8558cf5b)와 같다. **생성기 코드는 바꾸지 않았다** — 표 두 개(`data/art_sprites.csv` · `data/handmade/top_cutlines.csv`)에 행만 더했다.

27장의 구성:

| 묶음 | 수 | 내용 |
|---|---|---|
| 액트 3 정본 `-top` | 25 | 액트 3 tallNoTop 25종 전부(랜드마크 16 · 등불 기둥 · 예배당 기둥 · 잠긴 집 · 바다 괴물 뼈 · 뱃머리 · 부러진 돛대 · 부서진 봉화 · 묶인 배 · 등대지기 책상) |
| 반발 보정 `-top-high` | 2 | 부러진 돛대 · 밀수꾼 지도 탁자 — 코덱스가 「half-foot set」 자리용으로 자르는 선을 내린 판 |

- 등불 기둥 `harbor-lantern-top`은 매단 등불 **갓만** 남긴 알파 판이다(첫 투명 줄 106 · 기둥·사슬 알파는 뺐다 · 유리를 가로질러 자르지 않음).
- 코덱스는 저장된 배치 기준으로 「적격 30/61(등불 10/32 통과 · 22 앞 머리 탈락 · 그 외 8 발 탈락 · 묶인 배 1 막힘 없음)」이라고 봤다. **아래 결과도 같은 30/61이다. 61개 전부 해결된 것이 아니다.**

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. `assets/`는 읽기만 했다. 27장을 scratchpad 팩으로 복사했다.
   - 원본·사본·코덱스 `resource-mapping.csv` sha256이 27/27 같다.
   - PNG는 모두 RGBA이고, 크기는 원본 그림(`art_sprites` w·h)과 27/27 같다. 원본 RUID도 `art_sprites`와 27/27 같다.
   - 알파를 직접 디코드해 「첫 완전 투명 줄(그 아래 전부 투명)」을 쟀다. **27/27이 코덱스 `first_clear_row`(resource-mapping · top_cutlines-import 둘 다)와 같다. 불일치 0.**
2. 업로드 전에 원본 25 RUID의 실제 피벗을 `asset_get_group_resource_metadata_bulk`(OJYYQ · 1회)로 읽었다.
   - 코덱스 `resource-properties.csv` 피벗과 **문자열까지 27/27 같다**(3차의 「.5」 같은 표기 차이 없음). 팩 `resource-properties.csv`에는 이 값을 넣었다.
3. `node tools/msw_mcp_call.cjs upload-res <팩>`으로 올렸다. 팩 표는 `key · upload_name(= key) · category(prop) · file · RUID`다. 결과는 그룹 OJYYQ · sprite/object · **27/27**이다. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot(원본 실제 값)·filter Point·wrap Clamp를 넣었다(피벗은 처음 불리기 전에 넣음).
4. `asset_get_group_resource_metadata_bulk`(새 27 GUID · 1회)로 대조했다. **27/27 일치**다.
   - resultCode 0 · displayName = key · resourceType sprite · sprite/object
   - pivot = 원본 실제 피벗(문자열 같음) · Point · Clamp
   - RUID 중복 0
5. `.mcp.json`은 업로드하는 동안만 워크트리에 복사했다가 지웠다(커밋 안 됨).

| 그림 | 원본 | 크기 | 첫 투명 줄(실측=코덱스) | 남김 | 피벗 x·y(원본 실제 값) | 새 RUID |
|---|---|---|---|---|---|---|
| harbor-lantern-top | harbor-lantern | 80x128 | 106 | 53/64 | 0.5063291139240507 · 0.023622047244094488 | 652a3acafd0b46199930c48f17dc9907 |
| chapel-pillar-top | chapel-pillar | 112x176 | 118 | 59/88 | 0.5045045045045045 · 0.017142857142857144 | 8a949f91d1e74a99862c78c8c18b9b85 |
| drowned-hut-top | drowned-hut | 240x208 | 139 | 139/208 | 0.502092050209205 · 0.014492753623188406 | d70e3cbaefaa484ea4d011656f002798 |
| a3-leviathan-bones-top | a3-leviathan-bones | 380x220 | 74 | 37/110 | 0.5 · 0.01818181818181818 | 97b6905b5d4843de81eab9119574d3a0 |
| a3-figurehead-bow-top | a3-figurehead-bow | 280x280 | 94 | 47/140 | 0.5 · 0.014285714285714285 | 562bb141650843b19845029ee4eb307b |
| a3-broken-mast-top | a3-broken-mast | 120x220 | 110 | 1/2 | 0.5 · 0.01818181818181818 | daf061a715eb43fa9dae91ac907fb1a2 |
| broken-beacon-top | broken-beacon | 208x192 | 64 | 1/3 | 0.5024154589371981 · 0.015706806282722512 | b10d9f8511b84161a009aa279a65fc30 |
| moored-ship-top | moored-ship | 288x208 | 104 | 1/2 | 0.5017421602787456 · 0.014492753623188406 | 540e242d01d94c63b2ef79c7354aaa94 |
| keeper-desk-top | keeper-desk | 144x120 | 40 | 1/3 | 0.5034965034965035 · 0.025210084033613446 | 681fb69948c645538720e8450ed7c48f |
| a3-landmark-admiral-anchor-wreck-top | a3-landmark-admiral-anchor-wreck | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 7fc70443d9324895a2afdcbb334eea54 |
| a3-landmark-blue-flame-pulpit-top | a3-landmark-blue-flame-pulpit | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | fd395d5c71234e828d53ef35b58852bc |
| a3-landmark-broken-lens-stand-top | a3-landmark-broken-lens-stand | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 52ec8395b7d74589a7c543d9140db975 |
| a3-landmark-chained-cargo-souls-top | a3-landmark-chained-cargo-souls | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | d3fc739107bb43c494d60da2020621fd |
| a3-landmark-contraband-crate-tower-top | a3-landmark-contraband-crate-tower | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | b38b8a15ca6d4fc981a016c159632188 |
| a3-landmark-crab-king-shell-throne-top | a3-landmark-crab-king-shell-throne | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | 0346d4fe53904c09a238bae105571c3c |
| a3-landmark-drowned-belfry-roof-top | a3-landmark-drowned-belfry-roof | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 7cd014b700d545a5909ff1a81205b2b0 |
| a3-landmark-harbor-anchor-monument-top | a3-landmark-harbor-anchor-monument | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | 98d3e75c0e7f4cd99f6b6bc21f926118 |
| a3-landmark-lightning-totem-top | a3-landmark-lightning-totem | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 94d0894c5ad54016ae52f14c621aa603 |
| a3-landmark-mad-lens-workbench-top | a3-landmark-mad-lens-workbench | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | c98d34fef3394479b39bd1c41c526e2b |
| a3-landmark-salt-crystal-spire-top | a3-landmark-salt-crystal-spire | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | d950ac734e274a63b4c7c72ba6f3b1f3 |
| a3-landmark-shell-mound-top | a3-landmark-shell-mound | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | b37bce7f3cd4433b9017a1d61c5f948c |
| a3-landmark-ship-wheel-graveyard-top | a3-landmark-ship-wheel-graveyard | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 87ecec83faff408da566c712c7e3bcdb |
| a3-landmark-smuggler-map-table-top | a3-landmark-smuggler-map-table | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | 0ccbc077231a4ab798414050f85c98da |
| a3-landmark-spiral-stair-column-top | a3-landmark-spiral-stair-column | 512x512 | 256 | 1/2 | 0.5 · 0.0234375 | c7ed087505094c04b6980bc39f6f3d48 |
| a3-landmark-storm-bell-top | a3-landmark-storm-bell | 512x512 | 171 | 171/512 | 0.5 · 0.0234375 | 66bf690e98c34ed1882edd58d3757b24 |
| a3-broken-mast-top-high | a3-broken-mast | 120x220 | 142 | 71/110 | 0.5 · 0.01818181818181818 | 999d9076ca3b4141a69e05e479bee8cc |
| a3-landmark-smuggler-map-table-top-high | a3-landmark-smuggler-map-table | 512x512 | 352 | 11/16 | 0.5 · 0.0234375 | 8ee24a14136c454087bb94852bd64f90 |

## 2. 표 갱신

- `data/art_sprites.csv`: 27행을 3차 블록(`a4-dead-tree-top-high`) 바로 뒤(1462~1488행)에 넣었다. kind·w·h는 원본과 같다(모두 prop-1x). 1600 → 1627줄.
- `data/handmade/top_cutlines.csv`: 27행을 끝에 넣었다. `first_clear_row`는 실측 값(= 코덱스 27/27), `pivot_y`는 원본 실제 값, `keep_upper`·`cut_class`·`pack`은 코덱스 `top_cutlines-import.csv` 그대로다. 80 → 107줄.
- 생성기 코드는 그대로다. `-top-high`는 같은 원본의 배치 변형 후보로 자동으로 잡힌다(`topCandidates`).

### `-top-high`의 방향 (3차와 같음)

- 이름은 「high」지만 실제로는 첫 투명 줄을 키운 판이다. 즉 자르는 선이 발 쪽으로 내려온다. 부러진 돛대 110 → 142, 지도 탁자 256 → 352다.
- 생성기는 「규칙(발 조각 없음 · 앞 머리 안 덮음)을 지키는 후보 중 자르는 선이 가장 높은 것」을 고른다. 두 곳 모두 정본은 발 조각(+0.38 · +0.71칸)이라 `-top-high`가 뽑혔다.
  - wreckcoast 부러진 돛대: 정본 자르는 선 3.379 · `-top-high` 2.993 / 막힘 꼭대기 3 → −0.007칸
  - smuggler2 지도 탁자: 정본 13.713 · `-top-high` 13.0 / 막힘 꼭대기 13 → 0칸

## 3. 다시 짓기 결과 (`build-maps.log` · `top-count-by-map.csv` · `mapdiff.log` · `compare.log`)

`node tools/build/handmade/build.cjs harbor saltflat wreckcoast stormcliff drownedvillage lighthouse1 lighthouse2 lighthouse3 stormeye crabcave1 crabcave2 wreckhold smuggler1 smuggler2 seachapel keeperhouse`(난이도 복제 포함)의 결과: **액트 3 맵 파일 Top 엔티티 0 → 30.** 노말·_nm·_hell 합은 0 → 90이다.

- 작업 전에 HEAD 표·생성기로 `--out` 지은 결과가 HEAD 맵 파일과 16/16 바이트 같았다(누락분 없음 · 3차 액트 2 같은 어긋남 없음).
- 바뀐 맵 파일은 42개 = 14장 × 3이다. crabcave1·stormeye는 후보가 모두 탈락해 Top 0이라 다시 지어도 바이트가 같다.
- **다른 액트(1·2·4) 맵 150파일은 바이트 불변**이다(작업 전후 sha256 같음).
- HEAD ↔ 이번 맵 파일 대조(211파일): 없어진 것 0 · 새 Top 90 · Top 아닌 새 엔티티 0 · 바뀐 엔티티 0(displayOrder 제외).

| 맵 | Top 전→후 | 놓음 | 앞 머리 | 발 조각 | 막힘 없음 | 새 Top 그림 |
|---|---|---|---|---|---|---|
| harbor | 0→1 | 1 | 2 | 0 | 1 | 닻 기념비 |
| saltflat | 0→1 | 1 | 0 | 1 | 0 | 바다 괴물 뼈 |
| wreckcoast | 0→2 | 2 | 3 | 1 | 0 | 부러진 돛대 `-top-high` · 타륜 무덤 |
| stormcliff | 0→2 | 2 | 0 | 0 | 0 | 피뢰 토템 · 부서진 봉화 |
| drownedvillage | 0→4 | 4 | 0 | 0 | 0 | 잠긴 집 2 · 종탑 지붕 · 바다 괴물 뼈 |
| lighthouse1 | 0→1 | 1 | 2 | 0 | 0 | 나선 계단 기둥 |
| lighthouse2 | 0→2 | 2 | 3 | 1 | 0 | 등불 기둥 2 |
| lighthouse3 | 0→7 | 7 | 6 | 0 | 0 | 등불 기둥 6 · 폭풍 종 |
| stormeye | 0→0 | 0 | 6 | 1 | 0 | — |
| crabcave1 | 0→0 | 0 | 0 | 1 | 0 | — |
| crabcave2 | 0→1 | 1 | 0 | 0 | 0 | 집게왕 껍질 왕좌 |
| wreckhold | 0→1 | 1 | 0 | 0 | 0 | 쇠사슬 화물 |
| smuggler1 | 0→3 | 3 | 0 | 0 | 0 | 등불 기둥 2 · 밀수 상자 탑 |
| smuggler2 | 0→1 | 1 | 0 | 0 | 0 | 지도 탁자 `-top-high` |
| seachapel | 0→3 | 3 | 0 | 2 | 0 | 푸른 불 설교단 · 예배당 기둥 2 |
| keeperhouse | 0→1 | 1 | 0 | 1 | 0 | 등대지기 책상 |
| **합** | **0→30** | **30** | **22** | **8** | **1** | |

## 4. 놓음 / 건너뜀 (`cutline-check.csv` 61행 · `front-head-cells.txt`)

액트 3에서 `-top` 후보가 있는 장식 인스턴스 61개를 생성기 판정 그대로 적었다. 판정은 생성기 파일을 바꾸지 않고, 메모리에서 기록 한 줄만 끼운 `--out` 빌드로 뽑았다(그 출력이 맵 파일과 16/16 바이트 같음). 칸은 후보·고른 그림·발·배율·발 칸·막힘 꼭대기·후보별 자르는 선·차이·앞 머리 y·여유·결과·맵 파일 Top 대조다.

| 판정 | 수 | 내용 |
|---|---|---|
| 놓음 | **30** | 랜드마크 11(지도 탁자 `-top-high` 포함) · 등불 10 · 잠긴 집 2 · 예배당 기둥 2 · 바다 괴물 뼈 2 · 부서진 봉화 · 등대지기 책상 · 부러진 돛대 `-top-high` |
| 건너뜀 · 앞 머리(`topSkipped` front) | **22** | 등불 기둥 22 — 자르는 선이 발보다 0.297칸 위라, 발이 칸 아래쪽(+0.2~0.3)에 있으면 앞에 선 머리(발 칸 + 0.75)가 더 높다(+0.15 · +0.25칸) |
| 건너뜀 · 발 조각(`topSkipped` foot) | **8** | 뱃머리 +0.557 · 제독의 닻 +0.294 · 껍질 무더기 +0.103 · 예배당 기둥 2 +0.082 · 렌즈 작업대 +0.063 · 깨진 렌즈 받침 +0.041 · 소금 결정 기둥 +0.026칸 |
| 건너뜀 · 막힘 없음 | **1** | harbor 묶인 배(물 위 · ok=cliff라 막힌 칸이 없음) |

- **코덱스 「30/61 · 등불 10/32 · 22 앞 머리 · 8 발 · 배 1」과 칸 하나까지 같다.**
- 놓은 30개는 모두 아래가 0이다: 원본과 위치·배율·뒤집기·색이 다름 · 그림 ≠ 고른 후보 · 층/순서 ≠ Default/5 · 놓았는데 맵 파일에 Top 없음 · 안 놓았는데 맵 파일에 Top.
- 앞 머리 여유 최소는 등불 +0.047칸(10개 모두)이다. 다음은 돛대 `-top-high` +0.243 · 예배당 기둥 +0.532칸이다.
- 놓은 등불 10개(lighthouse2 2 · lighthouse3 6 · smuggler1 2)는 **모두 북벽 밀착**이다(뒤 칸 벽). 옆에서만 가린다.
- 앞 머리로 빠진 등불 22개의 앞(남쪽) 칸:
  - **14개는 벽**이다(wreckcoast 3 · lighthouse1 2 · lighthouse2 3 · lighthouse3 6 — 모두 남벽 밀착 · 뒤(북쪽) 칸은 바닥). 앞에 설 자리가 없는데 앞 머리 규칙(발 칸 아래 경계에 선 사람)으로 빠졌다.
  - **8개는 앞뒤 모두 바닥**이다(harbor 부두 어귀 등불 쌍 2 · stormeye 열주 6).
- 검사기 `tallNoTop`(액트 3): **25종 61개 → 0.** `topSkipped`(액트 3): 0 → 31(17종 78개 중 액트 3 9종 31).

## 5. 검사 (`check-map-composition.log`·`.json` · `npm-test.log`)

- `node tools/check_map_composition.cjs --all`: 맵 66장(v5 66) · **v5 위반 0** · 엔티티 **39463 / 47900**(직전 39433 + 30).
- tallNoTop 전체: 47종 94개 → **22종 33개**(액트 2 21종 31 · `a4-molten-channel-v` 2 — 3차 뒤와 같은 목록).
- topSkipped 전체: 8종 47개 → **17종 78개**(+ 액트 3 9종 31: 등불 22 · 예배당 기둥 2 · 뱃머리 · 제독의 닻 · 껍질 무더기 · 렌즈 작업대 · 깨진 렌즈 받침 · 소금 결정 기둥 · 묶인 배).
- 액트 3 밖 50장의 검사기 맵 보고는 작업 전과 JSON이 같다.
- `--selftest`: 입력 33 · 심은 위반 41건 모두 검출 · 오탐 0.
- `npm test`: **21/21 통과.**

## 6. 코덱스에 되돌릴 관찰

1. **앞 머리 탈락 22 — 그림 재작업은 필요 없다고 본다.**
   - 남벽 밀착 14개는 앞 칸이 벽이라 실제로 머리가 덮일 사람이 없다. 생성기 규칙이 「앞 칸이 벽이면 앞 머리 검사를 건너뛰기」로 바뀌면 지금 그림 그대로 놓인다(Claude 쪽 생성기 결정 · 이번 레인은 코드 변경 금지라 안 바꿈). 북쪽(뒤)이 바닥이라, 놓으면 실제로 가리는 효과가 큰 쪽은 오히려 이 14개다.
   - 앞뒤가 바닥인 8개(harbor 2 · stormeye 6)는 자르는 선을 앞 머리보다 올리려면 첫 투명 줄을 약 89 이하로 낮춰야 한다. 이는 등불 갓(64~105행)을 가로지르는 것이라 코덱스 의도(유리를 가로지르지 않음)와 맞지 않는다. 대신 배치(발 y를 칸 +0.5 근처로)를 고치거나 그대로 두는 것이 낫다(Claude 쪽).
2. **발 조각 8 — `-top-high`(자르는 선을 내린 판)로 고칠 수 있다.** 이번 돛대·지도 탁자처럼 발 쪽으로 내리면 된다. 넘친 양은 뱃머리 +0.557 · 제독의 닻 +0.294 · 껍질 무더기 +0.103 · 예배당 기둥 +0.082(2곳 같음) · 렌즈 작업대 +0.063 · 깨진 렌즈 받침 +0.041 · 소금 결정 기둥 +0.026칸이다(`cutline-check.csv`의 발·배율로 줄 수 환산 가능).
3. **묶인 배 1 — 막힌 칸이 없는 물 위 장식이라 그림으로는 못 고친다.** 놓지 않는 것이 맞다.
4. 런타임(가려짐 · 이름표 · 두 겹 짙어짐 · 옆 잘림 · 메이커 반영)은 확인하지 않았다(메이커 금지 · 코덱스도 runtime_verified false).

## 7. 메이커 확인 자리

- `../2026-11-01-map-v5-act3/CAPTURE-PLAN-act3.txt`: 지문 줄(Art · ArtTop · 맵 자식)을 이번 맵 파일 값으로 고쳤다. 옛 값은 16/16이 HEAD 맵 파일 값과 같았고, 바뀐 맵은 14장이다. 끝에 「윗부분 앞층 4차」 절을 붙였다. 절은 맵마다 그림별 놓음 수, 뒤에 설 자리 `(발 x, 막힘 꼭대기 + 0.3)`, 윗부분 시작 y, 앞 머리 여유, 고른 판, 놓지 않은 것과 사유를 담는다.
- 반영하려면 바뀐 `.map` 42파일에 대해 Maker 멈춤 → 5초 → touch → 5초 → refresh 1회.
