# I07 재질 접합 시범 — 업로드 1장 + 등록·맵 변경 패치 (2026-10-30 · 비메이커 담당)

근거: 코덱스 `goal-I07-material-decision-0045` · 0457 · 갈래 D `../README.md` §4. 기준 HEAD `7ae14a86`(브랜치 `codex/player-experience-polish`).
메이커 MCP는 한 번도 부르지 않았다. 등록·맵 변경은 **작업 트리에 남기지 않고** `../I07-registration.patch`로만 넘긴다 — 메이커 담당이 「반영 전 장면」(demonroad 서문 카메라 (-31.5,0.5)·동문 (31.5,2.5)·wreckcoast 같은 자리·줌)을 먼저 찍은 뒤 적용한다.

## 1. 업로드 (1장 · 1회)

| 항목 | 값 |
|---|---|
| RUID | **`6d4f6518fa94465392d3347f06cc8c90`** |
| 원본 | `assets/codex-material-joins-v1/png/a4-decal-ash-paving-join-candidate-v1.png` |
| png sha256 | `d3b4ab3a43136aca4f18872af45e034341b1541a44b9986ad40cc5e5c6774d3d` (`shasum -a 256` 직접 확인) |
| 크기 | 256×96 · 8-bit RGBA (`file` · PNG IHDR 직접 확인) |
| 그룹 · 분류 | `OJYYQ` · sprite / object · 이름 `a4-decal-ash-paving-join-candidate-v1` · 설명 `codex-material-joins-v1 local-transition-comparison-candidate` |
| 피벗 | resource-properties.csv의 key 줄 → pivot 0.5 / 0.5 · filter Point · wrap Clamp (uploadRes가 업로드 직후 `asset_update_resource_storage_info`로 넣음) |

실행 (저장소 루트):

```
node tools/msw_mcp_call.cjs upload-res assets/codex-material-joins-v1 --dry
  → 올릴 그림 1장 (건너뜀: - · -)
node tools/msw_mcp_call.cjs upload-res assets/codex-material-joins-v1        # 2026-10-30T05:02:14+0900 시작 → 05:02:15 끝, exit 0
  → 올릴 그림 1장 (건너뜀: - · -)
  →   1/1 a4-decal-ash-paving-join-candidate-v1
```

- 올리기 전 resource-mapping.csv의 ruid 칸은 비어 있었다(sha256 `d41fae8b11c7c8b82a15c12c2bea58979319cf70bb9206d1d7bc4ab7c127b3c8`, 따옴표 없는 원본). 저장소 data·docs·tools에도 이 그림의 RUID 흔적 없음.
- 업로드 뒤 uploadRes가 표를 따옴표 CSV로 다시 썼다 → `resource-mapping.csv`(이 폴더, 원본과 바이트 동일 · sha256 `964b6fd15ff431c891fa7e13f53ccb1197819619f3c2b95845f9d7d3c9b0eb5b`). `resource-properties.csv`는 바뀌지 않음(sha256 `a4cc6d35ef3c2c09a0d0cb46360931f8babc0dc2fa4fa3d319af79ef093edd06`, 바이트 동일 복사).
- **피벗 설정 응답 요지**: uploadRes는 `asset_update_resource_storage_info` 응답을 찍지 않는다(성공 시 예외 없이 지나감 · exit 0). 그래서 업로드 직후 msw-mcp `asset_get_group_resource_metadata_bulk`(groupCode OJYYQ, 메이커 무관 읽기)로 확인 → `resultCode 0` · resourceType `sprite` · subCategory `object` · properties `pivot_x=0.5 · pivot_y=0.5 · filter_mode=Point · wrap_mode=Clamp` · win.mod 18246 B md5 `444f0a0a7f832038463be736283c9e0f` · versionString `6ae3a647c62d5f0b654a7e8c`. 원문: `resource-metadata.json`.
- 이 RUID는 아직 어느 맵·메이커에서도 불린 적 없다(피벗이 처음 부르기 전에 들어감).

## 2. 등록·맵 변경 패치 — `../I07-registration.patch`

| | |
|---|---|
| sha256 | `d8e9cd2c97b1f212e4ae938d703f1c5e7cca4b458136b0fcb792e74ba52eb360` (39849 B) |
| 내용 | 7파일 · **1207줄 추가 · 0줄 삭제** |
| 확인 | 되돌린 작업 트리에서 `git apply --check -v` 통과(7파일) · HEAD 사본에 실제 적용하면 아래 「후」 해시와 7파일 모두 같음 |
| 적용 | `git apply docs/evidence/2026-10-30-goal-D/I07-registration.patch` → 메이커 refresh (메이커 담당) |
| 노말만 | `git apply --exclude='map/*_nm.map' --exclude='map/*_hell.map' docs/evidence/2026-10-30-goal-D/I07-registration.patch` (`--check` 통과 확인 · art_sprites + 노말 2맵) |

| 파일 | 전 sha256 (HEAD) | 후 sha256 (패치 적용) |
|---|---|---|
| data/art_sprites.csv | `90eec9a1abf31f0be4fb9c92ca677154546c8ba0e1ebc72e00d87db4ecb2d766` | `3dc56cd01e796dc30f8f4e4a43474c3210e8422c2de04f6dacb623450ef2c63c` |
| map/demonroad.map | `262354372684e17bebbc147e0143de43bc5dbb2673dd3ed46e7846ced7ed010d` | `8c83eb90d54856ca5d8b298a9512b5cdb8b625b2f2d8d92f6768ad208f4eb160` |
| map/demonroad_nm.map | `8bead5629183d3bc44b42eb22fe4e08acb71aed624af50fd0d04aaa7737e8b6c` | `ee2928e54acb9edc72fb2d46084b340c4f34bb13273b0d8ec11c04f1d29de7c2` |
| map/demonroad_hell.map | `1439049c5a1b8cfd69b74f1b706f769d9ebb9bce51054358afbfe1aace3dd748` | `666c12866728e9a10d0bfac135ea208a758e58e5a110ea40b2ea28d2b85b9b78` |
| map/wreckcoast.map | `329c0bf4f3ec62d7a4c35768a96d575a3c41d0a85f67c9af608c6ed82f748163` | `c31e6cb8e00f91ab4cbb40364a3c28d1db93c4f90ed4a896386c510bca56433a` |
| map/wreckcoast_nm.map | `32b7edfbc2dbf872825029e8b94c43bf60145d4f7d2da56068e11b09db51aba0` | `d8452ce38f5db56e5a330c0563bb58fd21759f79a71d917b42552d2927a87d4f` |
| map/wreckcoast_hell.map | `aae32a5aeff183d35b4079acf7f19c84a241ced8fda0c89498b5eb1be2a47645` | `c474960ecd874382331fd6a5de8546f073032389638721926bfd4d5ee66ab20d` |
| RootDesk/MyDesk/Data/GameData.mlua | `35672360952f10e49e2cc5e9959ffb6583cedb18b7e630245f4e92c2b93dfa0e` | **무변경** (패치에 없음) |

- art_sprites.csv: `a4-decal-hoofprints` 줄 바로 뒤(a4-decal 묶음 끝)에 한 줄 — `a4-decal-ash-paving-join-v1,prop-1x,256,96,6d4f6518fa94465392d3347f06cc8c90`. 키는 material_joins.cjs가 기대하는 `a4-decal-ash-paving-join-v1`(업로드 이름의 `-candidate`는 뺀 등록 키), kind는 이웃 a4-decal·a3-decal-salt-crust와 같은 prop-1x.
- **GameData 무변경**: gen_data.cjs는 art_sprites.csv를 직접 읽지 않는다(미니맵 정보용 `maps.cjs minimapFeatures`가 `context()`로 표를 불러오지만 그림 줄은 출력에 쓰이지 않음). 줄을 넣은 상태에서 `node tools/gen_data.cjs --check` → 7개 생성 파일 모두 「같음」, exit 0.
- 대상 맵 TileMapMode = 1(RectTile, `MapBuilder.read().getTileMapMode()`로 6파일 확인). ArtJoin은 Body 없는 바닥 무늬(z −0.015 · 충돌·통행 없음).

### 맵 변경 = 끝에 덧붙은 ArtJoin뿐 (합격)

`map_entity_diff.json`(HEAD vs 패치 적용, `map_diff.py`):

| 맵 | 엔티티 | 더해짐 (배열 맨 끝 · displayOrder) | 빠짐 | 기존 엔티티 바뀜 | 엔티티 밖 최상위 필드 |
|---|---|---|---|---|---|
| demonroad / _nm / _hell | 621 → 625 | ArtJoin1·2·3·4 (620~623) | 0 | **0** | 0 |
| wreckcoast / _nm / _hell | 825 → 827 | ArtJoin1·2 (824·825) | 0 | **0** | 0 |

- 기존 엔티티의 순서도 그대로, 벽(ArtWall)·타일(RectTileMap tileMap)·기존 장식·Spawner·기능 엔티티 모두 바이트 동일. 같은 displayOrder 0이 두 개(맵 루트와 그 자식 Background)인 것은 HEAD에도 있던 것.
- ArtJoin 값: demonroad = 새 RUID `6d4f6518…` · (-28.5,1.0)×0.75 · (-29.0,-0.9)×0.65 뒤집기 · (28.0,2.0)×0.7 · (27.6,3.05)×0.6 뒤집기 · wreckcoast = 기존 `a3-decal-salt-crust` `0742d8a2…` · (-7.3,3.15) · (6.5,2.9) 뒤집기 (배율 0.6 × art_scale → 0.72). 모두 z −0.015, `modelId artsprite`, componentNames·path·origin.root_entity_id 일관(검사함).
- 6파일의 ArtJoin `@components`는 설계도 빌더 전체 빌드(`--out` 격리) 결과와 **완전히 같다** — 다른 것은 id·displayOrder·origin.root_entity_id뿐.

### 왜 전체 빌드가 아니라 덧붙이기인가 (원인)

D 통합 방식대로 `node tools/build/handmade/build.cjs demonroad wreckcoast --out=<scratch>`로 격리 빌드해 비교했다:
- 등록 전: demonroad는 HEAD와 **바이트 동일**(재현 확인) · wreckcoast는 이미 ArtJoin1·2가 생긴다(소금 껍질은 등록돼 있었으나 그 맵은 material_joins 이후 다시 지은 적이 없음).
- 등록 후: 두 맵 모두 ArtJoin이 **그림 엔티티 끝 · 기능 엔티티 앞**(배열 가운데)에 끼고, 기능 엔티티 12개의 `displayOrder`가 밀린다 — demonroad +4: GateBack·GateNext·Gate_soulprison·Torch1~7·Waypoint·Spawner(608~619 → 612~623) / wreckcoast +2: GateBack·GateNext·Gate_wreckhold·Torch1~7·Waypoint·Spawner(812~823 → 814~825). 벽·타일·컴포넌트 값은 안 바뀜.
- 원인: `tools/build/handmade/lib.cjs` `build()`가 `art.entities`(ArtJoin 포함)를 먼저, `func`(문·화로·웨이포인트)와 Spawner를 나중에 placeModel한다. 이것만으로도 「기존 엔티티가 하나라도 바뀌면 적용 금지」 기준에 걸린다.
- `tools/build/art-patch.cjs`는 기존 장식 크기·색만 고치고 엔티티를 덧붙이는 기능이 없다. 그래서 `append_joins.cjs`(이 폴더)로: ArtJoin 값은 빌더와 같은 `handmade.artEntities`로 계산하고, 기존 맵을 `MapBuilder.read` → 끝에 `placeModel("ArtJoin<n>", Objects/ArtSprite, {pos, componentOverrides})` → `write`. MapBuilder read→write 왕복이 6파일 모두 바이트 동일함을 먼저 확인했다. 재현: art_sprites 줄을 넣은 HEAD 트리에서 `node docs/evidence/2026-10-30-goal-D/I07-upload-pack/append_joins.cjs demonroad wreckcoast` (줄이 없거나 이미 ArtJoin이 있으면 멈춤 · id는 새 UUID라 해시는 달라진다).
- 난이도 복제(_nm·_hell): D 통합 때처럼 맵 하나 = 노말+악몽+지옥 3파일로 다룬다(buildCopies는 노말을 그대로 복제하고 MapAmbience·WarpGate만 고친다 → ArtJoin 컴포넌트는 노말과 같다). 다른 맵은 만들지 않았다. 노말만 원하면 위 `--exclude` 적용.
- 나중에 이 맵을 전체 빌드하면 ArtJoin id는 경로로 보존되고(preserveIds), 기능 엔티티 displayOrder만 위처럼 밀린다(계층 순서일 뿐 그리기 순서는 SortingLayer·OrderInLayer·z).

## 3. 검사 (패치 상태의 작업 트리에서, 되돌리기 전)

- `node tools/build/handmade/build.cjs demonroad wreckcoast --check` → demonroad `joins:4` · wreckcoast `joins:2` · 「등록 필요」 경고 없음 · 크기 경고 0
- `node tools/test.cjs` → 14/14 통과 · `node tools/check_data.cjs` → 문제 0 · `node tools/check_assets.cjs` → 모델 99 · 맵 211, 문제 0
- 그 뒤 `git checkout -- <7파일>` → 7파일 + GameData 해시가 「전」과 같음 확인(작업 트리 원상태).

## 4. 하지 않은 것

- 메이커 반영·플레이·캡처·걷기(전/후 장면) — 메이커 담당 몫. 실제 화면에서 접합 띠의 이음·밝기·피벗 가운데 정렬은 미확인.
- assets/codex-material-joins-v1/resource-mapping.csv(RUID 적힘)는 assets/ 커밋 제외 관례대로 커밋하지 않았다 — 같은 내용이 이 폴더에 있다.

파일: `resource-mapping.csv` · `resource-properties.csv` · `resource-metadata.json` · `append_joins.cjs`(패치 생성) · `map_diff.py`(비교) · `map_entity_diff.json`(비교 결과).
