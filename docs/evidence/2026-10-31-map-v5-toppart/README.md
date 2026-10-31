# 맵 v5 키 큰 특징 윗부분 그림 13장 업로드·앞층 연결 (2026-10-31)

코덱스 납품 `assets/codex-map-v5-toppart-20261031` (요청 `claude-map-v5-toppart-art-request-1724.txt` · 원본과 같은 캔버스·피벗 · 아래 투명 · 자르는 선 = 특징 1/2 · 구조 1/3)을 월드 리소스로 올리고, 맵 v5 생성기의 `<그림>-top` 앞층 훅을 실제로 동작시켜 표본 2장(sanctum 대사제의 성소 · sulfurmarsh 유황 늪)을 다시 지었다. 메이커는 쓰지 않았다(다른 레인 소유 — 확인 자리는 `../2026-10-31-map-v5-sample/CAPTURE-PLAN.txt` 3-2). 선례: `../2026-10-31-skillfx-C7`.

## 1. 업로드 (`upload-toppart.json` · `upload-res.log`)

1. `assets/`는 읽기만. 13장을 scratchpad 팩으로 복사 — 원본·사본·코덱스 표 sha256 같음 · PNG 헤더 크기 = 표 크기 · 모두 RGBA(색 형식 6).
2. **업로드 전 원본 13 RUID의 실제 피벗**을 `asset_get_group_resource_metadata_bulk`(OJYYQ · 1회)로 읽었다 — 코덱스 `resource-properties.csv` 피벗과 13/13 문자열까지 같음(crypt-candlestand 0.5/0 포함 · 코덱스가 「owner live readback 필요」라고 한 항목).
3. `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **13/13**. RUID를 받은 직후 같은 루프에서 pivot(원본과 같은 값)·filter Point·wrap Clamp.
4. `asset_get_group_resource_metadata_bulk`(새 13 GUID 1회) 대조: displayName = key · pivot = 원본 실제 피벗 · Point · Clamp · sprite/object · resultCode 0 — **13/13 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `<원본>-top` **13행**(kind = 원본과 같음: crypt-candlestand만 prop · 나머지 prop-1x · w·h = 원본).
6. `.mcp.json`은 업로드 동안만 워크트리에 복사했다가 지웠다(커밋 안 됨).

## 2. 생성기 훅 (`tools/build/handmade/lib.cjs` place 안 · 코드 변경 없음, 주석만 갱신)

훅은 이미 있었고 그림이 없어 돌지 않던 상태였다. 읽고 실제 출력으로 확인한 결과 고칠 곳은 없었다.

| 요구 | 코드 | 실제 출력 (sanctum 23 · sulfurmarsh 8) |
|---|---|---|
| (a) 같은 위치·배율·뒤집기 | 위치 = 원본 `[x, py, zOf(y)]` · Scale = 원본 sc · FlipX = 원본 flip · Color = 원본 tint | 31/31 원본 엔티티와 Position·Scale·FlipX·Color 같음 · 그림 = 원본 이름 + `-top` |
| (b) 플레이어보다 위 층 | SortingLayer MapLayer1 · OrderInLayer 1 | 31/31 MapLayer1 · 순서 1 (원본·플레이어는 MapLayer0 — 정렬 1순위가 층이라 아바타 순서 3·4보다 위) |
| (c) 충돌·클릭 없음 | `place()`의 blocked·pieces를 거치지 않고 out에만 넣음 · 모델 artsprite | 컴포넌트 Transform + SpriteRenderer 둘뿐 · 타일 막힘 변화 0 · Top이 아닌 엔티티는 displayOrder 말고 바뀐 것 0 |

조건: v5 맵(설계도 `;v5`) · 바닥 무늬 아님 · `art_sprites.csv`에 `<그림>-top` 행이 있을 때만.

### 자르는 선 대조 (`cutline-check.csv` · 31 인스턴스)

코덱스 PNG 알파를 직접 디코드해 잼: 13종 모두 **첫 완전 투명 줄 = 코덱스 표 값**(특징 256/512 · 300→150 · 260→130 = 1/2 · 구조 208→139 · 200→134 · 160→107 · 144→96 = 위 2/3 남김).
생성기 발밑 충돌은 `footprintRole`: 줄 수 = max(2, ceil(그림 높이 × 비율)) 칸 · 발 칸(floor(y))부터 · 열린 바닥 랜드마크는 `foot=0.67`.

| 그림 | 역할·비율 | 윗부분 시작(발 위 칸) | 막힘 꼭대기(발 위 칸) | 차이 | 판정 |
|---|---|---|---|---|---|
| 해 원반 제단 | feature · foot 0.67 | 2.05 | 2.60 | -0.55 | 불일치 |
| 불타는 책장 탑 | feature · foot 0.67 | 1.53 | 2.70 | -1.17 | 불일치 |
| 책장 ×3 | structure 1/3 | 0.59 | 1.80 | -1.21 | 불일치 |
| 부러진 기둥 ×4 | structure 1/3 | 0.97 | 1.70 | -0.73 | 불일치 |
| 열주 북열 ×6 (y 3.16) | structure 1/3 | 1.14 | 1.84 | -0.70 | 불일치 |
| 열주 남열 ×6 (y -3.04) | structure 1/3 | 1.14 | 1.04 | +0.10 | 맞음 |
| 촛대 ×2 | structure 1/3 | 1.06 | 2.00 | -0.94 | 불일치 |
| 용암 둔덕 | feature · foot 0.67 | 1.50 | 2.90 | -1.40 | 불일치 |
| 간헐천 | feature · foot 0.67 | 1.54 | 2.10 | -0.56 | 불일치 |
| 큰 용광로 | feature · foot 0.67 | 1.61 | 2.70 | -1.09 | 불일치 |
| 쓰러진 거인 | feature · foot 0.67 | 1.25 | 1.10 | +0.15 | 맞음 |
| 불박쥐 고목 | feature · foot 0.67 | 1.54 | 2.70 | -1.16 | 불일치 |
| 기사의 검 무덤 | feature · foot 0.67 | 1.63 | 2.70 | -1.07 | 불일치 |
| 사슬 기둥 ×2 | structure 1/3 | 0.97 | 1.70 | -0.73 | 불일치 |

**불일치(>0.3칸) 24/31 — 모두 「윗부분이 막힘 꼭대기보다 아래에서 시작」 쪽.** 원인: 코덱스 자르는 선은 캔버스 높이의 고정 비율인데, 생성기 막힘은 ① 최소 2줄 ② 올림 ③ 칸 경계(floor(y)) 정렬 ④ 열린 바닥 랜드마크 `foot=0.67`(코덱스 요청 1724 이후 5·6차 표본에서 바뀐 값)로 더 높다.
영향: 막힌 칸 바로 뒤에 서도 몸 전체가 윗부분 쪽이라 「뒤에 서면 가려짐」은 성립한다(가리는 쪽으로 남음). 남쪽(앞)에 선 플레이어 머리(키 0.75 가정)와 윗부분 시작 사이 여유는 0.04(책장)~1.70칸으로 앞 머리 겹침은 없다는 계산이다. 남는 위험은 옆(동·서)에 붙은 플레이어 머리가 윗부분 가장자리에 잘려 보이는 것과, 원본 반투명 픽셀이 두 겹이라 더 짙어지는 것 — 메이커 확인 자리 3-2.

## 3. 표본 다시 짓기 · 검사

- `node tools/build/handmade/build.cjs sanctum sulfurmarsh` (`build-samples.log`): sanctum 엔티티 325 → 348 · sulfurmarsh 1225 → 1233 (검사기 셈). **-top 엔티티 sanctum 23 (열주 12 · 부러진 기둥 4 · 책장 3 · 촛대 2 · 제단 1 · 불타는 책장 탑 1) · sulfurmarsh 8 (사슬 기둥 2 · 간헐천·용광로·거인·고목·검 무덤·용암 둔덕 각 1)** = 표본에서 쓰인 13종 인스턴스 31개 전부(그 그림을 쓴 장식 31개와 1:1). 악몽·지옥 복제 4장도 같은 수.
- 검사기 `node tools/check_map_composition.cjs --map sanctum,sulfurmarsh` (`check-map-composition.log`·`.json`): **v5 위반 0** · 자가 테스트 26/26.
- 엔티티 예산: **46935 / 47900** (직전 46904 + 31).
- 다른 맵 불변: 설계도 맵 65장을 `--out`으로 두 번 지어(새 art_sprites / HEAD art_sprites) 비교 → **63장 바이트 동일 · 다른 것은 sanctum·sulfurmarsh 2장뿐**. `map/`에서 바뀐 파일도 표본 2장과 그 악몽·지옥 복제 4장뿐.
- `npm test` (`npm-test.log`): **20/20 통과**.

## 4. 검사기 경고 「키 큰 특징인데 -top 그림 없음」 (위반 아님)

`tools/check_map_composition.cjs`에 `tallNoTop` 경고 추가 — 지어진 그림 엔티티(장식·세트·흩뿌림) 중 역할 feature·structure(바닥 분류·포털·겹친 빛 제외), 화면 높이(그림 px × 배율 ÷ 100) ≥ 2칸인데 `<그림>-top` 행이 없는 것을 그림 종류별로 출력하고 `--json`의 `tallNoTop`에 넣는다. 종료 코드·ITEMS에는 넣지 않는다.

- 표본 2장: **3종 11개** — `a2-landmark-temple-stair-censer`(향로 계단 · 3.48칸 · sanctum 1) · `wind-stele`(비석 · 3.12칸 · sanctum 9) · `a4-dead-tree`(마른 나무 · 2.59칸 · sulfurmarsh 1).
- 66장 참고(`--all --legacy` · `tallnotop-all-legacy.txt`): **104종 198개**. v4 맵은 역할 배율(asset_roles base_cells)이 아니라 예전 배율이라 v5로 바꾸면 높이가 달라진다 — 3단계 확대 때 v5로 지은 뒤 다시 뽑아 코덱스 2차 요청 목록으로 쓴다(2차는 코덱스 쪽 「not authorized · 확대 목록 대기」).

## 5. 메이커 확인 자리

`../2026-10-31-map-v5-sample/CAPTURE-PLAN.txt` 3-2 — 제단 북 · 간헐천 북 · 둔덕 · 거인 · 용광로 · 고목 · 검 무덤 · 부러진 기둥 · 책장 · 비석(대조) · 열주 · 촛대의 「뒤에 설 자리」 좌표와 반영 지문(Top 엔티티 sanctum 23 / sulfurmarsh 8).
