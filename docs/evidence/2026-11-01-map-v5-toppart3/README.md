# 맵 v5 윗부분 앞층 그림 3차 32장 업로드·연결 (2026-11-01)

코덱스 납품 `assets/codex-map-v5-toppart3-20261031`(요청 `claude-map-v5-toppart-request3-2350.txt` · 핸드오프 `map-v5-toppart3-delivered.json` · zip sha256 `7c9c5b8b…e26d` 다시 계산해 같음)을 월드 리소스로 올렸다. 그 뒤 생성기 `-top` 훅으로 v5 맵 50장(액트 1 15 · 액트 2 15 · 액트 4 18 · 표본 2)을 다시 지었다. 메이커는 쓰지 않았다. 방식은 2차(`../2026-10-31-map-v5-toppart2/README.md`)와 같다. **생성기 코드는 바꾸지 않았다** — 표 두 개(`data/art_sprites.csv` · `data/handmade/top_cutlines.csv`)에 행만 더했다.

32장의 구성:

| 묶음 | 수 | 내용 |
|---|---|---|
| 액트 1 정본 `-top` | 21 | 요청 3차 대상 21종 (tallNoTop 액트 1 전부) |
| 열린 바닥 변형 `-top-openfloor` | 5 | 같은 원본을 위 1/3로 자른 판(술통 선반 · 형장 부러진 기둥 · 처형 발판 · 썩은 우물 · 해골 탑) — 2차 향로 계단 `-top-feature-half`와 같은 배치 변형 |
| 보정판 `-top-high` | 6 | 2차에서 발 조각으로 못 놓은 6종(잉걸 기둥 · 돌아온 심장 제단 · 대주교 피의 설교대 · 베르카 모루 · 박쥐 여왕 뼈 둥지 · 마른 나무) |

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. `assets/`는 읽기만 했다. 32장을 scratchpad 팩으로 복사했다.
   - 원본·사본·코덱스 `resource-mapping.csv` sha256이 32/32 같다.
   - PNG는 모두 RGBA8이고, 크기는 원본 그림(`art_sprites` w·h)과 32/32 같다. 원본 RUID도 `art_sprites`와 32/32 같다.
   - 알파를 직접 디코드해 「첫 완전 투명 줄(그 아래 전부 투명)」을 쟀다. **32/32가 코덱스 `first_clear_row`(resource-mapping · top_cutlines-import 둘 다)와 같다.**
2. 업로드 전에 원본 27 RUID의 실제 피벗을 `asset_get_group_resource_metadata_bulk`(OJYYQ · 1회)로 읽었다.
   - 코덱스 `resource-properties.csv` 피벗과 **숫자로 32/32 같다.**
   - 문자열은 21/32만 같다. prop 11장은 코덱스 표가 `.5`, 실제 값은 `0.5`다. 그래서 팩 `resource-properties.csv`에는 원본 실제 값 문자열을 넣었다.
3. `node tools/msw_mcp_call.cjs upload-res <팩>`으로 올렸다. 팩 표는 `key · upload_name(= key) · category(prop) · file · RUID`다. 결과는 그룹 OJYYQ · sprite/object · **32/32**다. RUID를 받은 직후 같은 루프에서 pivot(원본 실제 값)·filter Point·wrap Clamp를 넣었다.
4. `asset_get_group_resource_metadata_bulk`(새 32 GUID · 1회)로 대조했다. **32/32 일치**다.
   - resultCode 0
   - displayName = key
   - pivot = 원본 실제 피벗
   - Point · Clamp · sprite/object
   - RUID 중복 0
5. `data/art_sprites.csv`에 32행을 넣었다(1430~1461행 · 2차 블록 바로 뒤). kind·w·h는 원본과 같다.
6. `data/handmade/top_cutlines.csv`에 32행을 넣었다(코덱스 `top_cutlines-import.csv` 그대로 · `pivot_y`는 원본 실제 값). 표는 48 → 80행이다.
7. `.mcp.json`은 업로드하는 동안만 워크트리에 복사했다가 지웠다(커밋 안 됨).

### `-top-high`의 방향 (이름과 실제가 반대)

- 요청서는 「자르는 선을 올린 판」이라고 썼다. 하지만 발 조각(자르는 선 > 막힘 꼭대기)을 고치려면 자르는 선을 **내려야** 한다.
- 코덱스는 내린 판을 만들고, 이름만 요청서대로 `-top-high`로 지었다(`records/cut-direction-explanation.json`: 「increasing image first_clear_row lowers world cut line」). 예: 베르카 모루는 정본 `-top`이 첫 투명 줄 256(자르는 선 = 높이 1/2)이고, `-top-high`는 352(= 높이 0.31)다.
- 생성기는 이름과 상관없이 「규칙(발 조각 없음 · 앞 머리 안 덮음)을 지키는 후보 중 자르는 선이 가장 높은 것」을 고른다. 그래서 정본이 규칙을 지키면 정본이 남고, 어기면 `-top-high`가 뽑힌다. 코드 변경은 필요 없었다.

## 2. 다시 짓기 결과 (`top-count-by-map.csv` · `build-maps.log` · `mapdiff.log` · `compare-66.log`)

`node tools/build/handmade/build.cjs <v5 50장>`(난이도 복제 포함)의 결과: **맵 파일 Top 엔티티 238 → 326 (+88).**

- 3차 그림으로 생긴 것: **68개**(액트 1 58 · 액트 4 `-top-high` 10)
- 액트 2 2차 반영 누락분: **20개**(아래 「액트 2」)

| 맵 | 액트·종류 | Top 전→후 | 새 Top 그림 |
|---|---|---|---|
| queentomb | 1 v5 | 13→22 | 여왕의 피 깃발 6 · 큰 촛대 2 · 여왕 석관 제단 1 |
| cellar2 | 1 v5 | 4→12 | 해골 깃발 6 · 술통 선반(openfloor) 1 · 썩은 우물(openfloor) 1 |
| crypt2 | 1 v5 | 2→10 | 형장 부러진 기둥 5 · 해골 깃발 2 · 뼈 탑 1 |
| gallows | 1 keep | 0→8 | 사슬 기둥 2 · 해골 깃발 2 · 처형 발판 · 숲 교수대 · 교수목 · 뼈 탑 각 1 |
| execution | 1 keep | 0→7 | 해골 깃발 2 · 부러진 기둥 2 · 처형 발판(openfloor) · 머리 없는 왕 석상 · 처형대 각 1 |
| pit1 | 1 keep | 0→4 | 해골 깃발 2 · 뼈 탑 1 · 뼈 도르래 기중기 1 |
| town | 1 keep | 0→3 | 천막 3 (무너진 성문은 안 놓음 · 4절) |
| cellar1 · rotmarsh · wasteland | 1 | 0→2씩 | 술통 선반(openfloor)+썩은 우물 / 썩은 우물(openfloor)+가라앉은 망루 / 해골 탑+썩은 우물(openfloor) |
| crypt1 · crypt3 | 1 v5 | 6→7 · 10→11 | 납골 벽감 기둥 1씩 |
| cave · hollow · pit2 | 1 keep | 0→1씩 | 시체 매단 기둥 / 해골 탑 / 뼈 도르래 기중기 |
| throne | 4 v5 | 21→27 | 잉걸 기둥 `-top-high` 5 · 돌아온 심장 제단 `-top-high` 1 |
| abyssgate3 · forge2 · pit · sulfurcave2 | 4 | +1씩 | 대주교 설교대 · 베르카 모루 · 마른 나무 · 박쥐 여왕 뼈 둥지 (모두 `-top-high`) |
| kingtomb1 · kingtomb2 · stormwaste · temple1 · temple2 · temple3 | 2 | 2→6 · 2→6 · 0→7 · 14→15 · 5→7 · 10→12 | 바람 비석 17 · 사원 기둥 2 · 향로 계단 1 (2차 그림 · 누락분) |

- **액트 1:** 15장 모두 Top이 있다(전 5장 → 후 15장 · 처음 생긴 맵 10장). Top은 35 → 93이다.
- **액트 4:** Top 117 → 127이다. `-top-high` 채택은 **10개**다.
  - 잉걸 기둥 10개 중 5개는 정본 `-top`이 그대로다(규칙을 지키고 자르는 선이 더 높음). 나머지 5개가 `-top-high`다.
  - sulfurmarsh 마른 나무도 정본이 그대로다. pit 마른 나무만 `-top-high`다.
- **액트 2(누락분 20):**
  - 액트 2 v5 재구성 커밋(2f70dc57)의 맵 파일에는 2차 그림 Top 20개가 없었다. 원인은 2차 레인보다 먼저 지었기 때문으로 보인다. 해당 그림은 `wind-stele-top` 17 · `temple-column-top` 2(temple3) · 향로 계단 1(temple1)이다.
  - HEAD 표·생성기로 `--out` 지은 결과(`out-before`)에도 이 20개가 있다. 즉 HEAD 생성기 출력과 맵 파일이 어긋나 있었다. 이번에 50장을 다시 지으면서 함께 들어갔다.
  - 3차 그림을 쓰는 액트 2 장식은 없다.
- **맵 파일 대조**(`mapdiff.log` · HEAD ↔ 이번 · 211파일): 없어진 것 0 · 새 Top 264(= 88 × 노말·_nm·_hell) · Top 아닌 새 엔티티 0 · 바뀐 엔티티 0(displayOrder 제외).
- **설계도 66장 두 번 짓기**(`compare-66.log`): 같은 것 40장, 다른 것 26장이다. 다른 26장은 3차 Top이 더해진 20장과, id(무작위)만 다른 액트 2 6장이다.
- **액트 3 불변:** 액트 3 16장은 두 빌드의 바이트가 같다. `map/` 액트 3 파일 48개는 작업 전후 sha256이 같다(다시 짓지 않음 · 설계서·맵 안 건드림).

## 3. 자르는 선 vs 충돌 높이 (`cutline-check.csv` 373행 · `cutline-summary.txt`)

v5 50장에서 -top 후보가 있는 장식 인스턴스마다 2차와 같은 칸을 적었다. 칸은 아래와 같다.

- 후보 · 고른 그림
- 자르는 선 = 실제 줄 − 피벗
- 막힘 꼭대기 · 차이 · 판정
- 원본과 위치·배율·뒤집기·색·그림이 같은지
- 층/순서
- 맵 파일 Top 대조
- 앞 머리 여유
- 뒤에 설 자리와 그 칸을 걸을 수 있는지

**3차 그림 인스턴스 75개.** 코덱스 `source_layout_cases 75 · arithmetic_eligible 74`와 같다.

| 판정 | 수 | 내용 |
|---|---|---|
| 놓음 · 가리는 쪽(자르는 선이 막힘 꼭대기보다 0.3칸 넘게 아래) | **48** | 해골 깃발 14 · 피 깃발 6 · 부러진 기둥 5 · 잉걸 기둥 정본 5 · 천막 3 · 뼈 탑 3 등 |
| 놓음 · ±0.3칸 일치 | **26** | 512 랜드마크 8(−0.02~−0.05칸) · `-top-high` 10(−0.01~−0.05칸) · 썩은 우물 3 · 부러진 기둥 2 · 처형 발판 1 · 해골 탑 1 · sulfurmarsh 마른 나무 정본 1 |
| 놓지 않음 · 발 조각(막힌 칸 없음) | **1** | town 무너진 성문(ArtProp4) — 가운데 열이 남문 길이라 막지 않는다(코덱스도 「조건부 안 놓음」) |
| 놓지 않음 · 앞 머리 | 0 | |

- 전체(1·2·3차) 373개는 놓음 326 · 발 조각 18 · 앞 머리 29다. **놓음 326 = 맵 파일 Top 326**이다.
- 놓은 326개는 아래 조건에서 모두 0이다.
  - 원본과 위치·배율·뒤집기·색이 다르거나, 그림 ≠ 고른 후보
  - 층/순서 ≠ Default/5
  - 맵 파일 Top 불일치(Transform+SpriteRenderer만 · 같은 값)
  - 안 놓았는데 맵 파일에 Top
  - 앞 머리 여유 음수
- 3차 그림의 앞 머리 여유는 최소 +0.22칸(해골 깃발)이다.
- 열린 바닥 변형 `-top-openfloor` 채택은 6개다(술통 선반 2 · 썩은 우물 3 · 처형 발판 1). 부러진 기둥·해골 탑 openfloor 판은 정본이 규칙을 지키며 더 높아 쓰인 곳이 0이다(표에만 둠).
- 뒤 칸이 벽인 것(벽 밀착)은 옆에서만 가린다: 해골 깃발 6(cellar2) · 천막 3 · 납골 벽감 기둥 2 · 술통 선반 1 · 사슬 기둥 1 · 설교대 · 모루 · 심장 제단.

## 4. 검사 (`check-map-composition.log`·`.json` · `npm-test.log`)

- `node tools/check_map_composition.cjs --all`: **v5 위반 0** · 엔티티 **41228 / 47900**(직전 41160 + 68).
  - 검사기는 생성기 출력으로 센다. 그래서 액트 2 누락분 20은 직전 값에 이미 들어 있다.
  - 맵 파일 엔티티 합(v5 50장 노말)은 25888 → 25976(+88)이다.
- **tallNoTop: 43종 92개 → 22종 33개.** 액트 1은 0이 됐다. 남은 것은 아래 둘이다.
  - 액트 2 **21종 31개**: buried-caravan · lion-twin-stair-gate · guardian-king-sarcophagus · scorpion-egg-nest · palm ×6 · venom-pool-rock · sunken-triumph-arch · caravan-well · golden-mask-wall · dry-waterwheel · dry-well-pulley · coiled-serpent-column · singing-sand-altar · wind-tomb-pillar · giant-beast-skull · tent · crowned-colossus-head ×3 · tomb-door ×2 · rib-arch ×2 · market-stall ×2 · well. 다음 요청 후보다.
  - `a4-molten-channel-v` ×2(코덱스 제외 · 바닥 수로)
- **topSkipped: 13종 56개 → 8종 47개.** `-top-high` 6종 10개가 빠지고, 무너진 성문 1이 새로 들어왔다. 남은 것은 아래와 같다.
  - 앞 머리 29: 혼 우리 16 · 창살 13. 벽 밀착이라 그대로 둔다(요청서 「재작업 불필요」).
  - 발 조각 18:
    - 사원 기둥 12(kingtomb2 2 · archive 2 · temple2 2 · sanctum 6 · +0.104칸)
    - 녹은 거인 갑옷 2(+0.15)
    - 검 무덤 1(pit · +0.171)
    - 막힘 없음 3: 초소 문 · 부러진 기둥(sunkenroad) · 무너진 성문(town)
- 자가 테스트(npm test 안): 입력 29 · 심은 위반 38건 모두 검출 · 오탐 0.
- `npm test`: **20/20 통과.**

## 5. 메이커 확인 자리

메이커 레인에 넘길 확인 자리다. 세 계획서 모두 지문 줄(Art · ArtTop · 맵 자식)을 이번 맵 파일 값으로 고쳤고, 옛 값은 26/26이 HEAD 맵 파일 값과 같았다. 끝에 붙인 절은 맵마다 그림별 놓음 수, 뒤에 설 자리 `(발 x, 막힘 꼭대기 + 0.3)`, 윗부분 시작 y, 고른 판, 놓지 않은 것을 담는다.

- `../2026-10-31-map-v5-act1/CAPTURE-PLAN-act1.txt`: 「윗부분 앞층 3차」 절을 넣었다(15장).
- `../2026-10-31-map-v5-act4/CAPTURE-PLAN-act4.txt`: 「윗부분 앞층 3차」 절을 넣었다(`-top-high` 5장).
- `../2026-10-31-map-v5-act2/CAPTURE-PLAN-act2.txt`: 「2차 반영 누락분」 절을 넣었다(6장).
- 런타임(가려짐 · 이름표 · 두 겹 짙어짐 · 옆 잘림 · 메이커 반영)은 확인하지 않았다(메이커 금지). 반영하려면 바뀐 `.map` 78파일에 대해 Maker 멈춤 → 5초 → touch → 5초 → refresh 1회.
