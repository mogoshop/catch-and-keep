# 스킬 효과 통일 공정 보정 재출력 25장 업로드·교체 (2026-10-31)

코덱스 통일 공정 납품 `assets/codex-skill-fx-v3/unify-remake7-20261031` 38행 중 **보정 재출력 25행**(새 기하 없음)만 월드 리소스로 올리고, 이미 연결돼 있던 슬롯 5곳(21장)의 RUID를 새 것으로 **교체**했다. 정점 샘플 13장(`fx-unify-*-peak-00`)은 전체 제작 대기라 올리지 않았다. 메이커 도구는 쓰지 않음 (확인은 액트 4 회차). 선례: `2026-10-31-skillfx-C7` · `2026-10-31-skillfx-nine88`.

핸드오프 `skillfx-unify-samples-delivered.json`: `existing_geometry_correction_outputs 25` · `correction_new_geometry 0` · correction_methods = soul-drain·bone-armor·arise-flame은 **알파 그대로 RGB만 보정**, rite-bone-whirl·frost-shot은 **고해상도 원본을 더 큰 native로 다운샘플**(작은 판을 키운 것 아님).

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. `assets/`는 읽기만. `resource-mapping.csv`에서 `peak`가 아닌 25행을 scratchpad 팩으로 복사 — 원본·사본 sha256 = 표 sha256 · PNG 헤더 크기 = 표 크기 = `resource-properties.csv` 크기 · 모두 RGBA(색 형식 6) · 표 피벗 = properties 피벗.
2. 팩 표: `resource-mapping.csv`(key · resource_name = key · file · ruid · category effect · width · height · sha256) + `resource-properties.csv`(name · pivot · wrap Clamp). 피벗은 코덱스 표 그대로 — 소용돌이·두름·회오리·자국·서리탄 21장 0.5/0.5 · arise-flame 4장 0.5/0.1 (표의 `0.09999999999999998`을 0.1로 적음).
3. `.mcp.json`을 워크트리에 잠시 복사 → `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **25/25**. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot·filter Point·wrap Clamp (처음 불리기 전). 오류 없음. 끝나고 `.mcp.json` 삭제 (커밋 안 됨).
4. `asset_get_group_resource_metadata_bulk`(25 GUID 1회) 대조: displayName = key · pivot · Point · Clamp · sprite/object · resultCode 0 — **25/25 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **25행** 추가. 옛 행(fx-B 17 · fx-C 서리탄 4)은 되돌림 기록으로 남겼다.

## 2. 교체 (`connect-changes.csv`)

`Common/GameConst.mlua` 값만 바꾸고 각 줄 주석 끝에 `옛: <옛 RUID들>`을 남겼다. 부르는 곳·빈 자리 되돌림·장 간격(100ms)·층·[VRF]는 바꾸지 않았다. 미리 불러 두기는 슬롯의 모든 장을 읽는 기존 길(`SkillEffects.OnBeginPlay`)이라 새 RUID 전 장이 그대로 들어간다(검사 확인).

| 자리 | 장 | 옛 RUID (첫 장 …) | 새 RUID (첫 장 …) | 캔버스 전 → 후 | 내용 폭 전 → 후 (알파>16) |
|---|---|---|---|---|---|
| FxSkillDrainVortex | 4 | e00c6e7f… | f90daed5… | 128² → 128² | 78~112px 그대로 |
| FxSkillArmorCast | 4 | 98b2832f… | 0299ee0c… | 128² → 128² | 최대 109×104 그대로 |
| FxSkillRiteWhirl | 8 | d0e492d0… | c57d3229… | 256² → 384² | 235 → 353 |
| FxSkillRiteWhirlTrace | 1 | 7012e327… | 5a608e67… | 256² → 384² | 240 → 360 |
| FxSkillFrostShot | 4 | 3b69d4cd… | f1db276b… | 128×64 → 256×128 | 117×43 → 235×84 |

전체 RUID는 `connect-changes.csv`·`upload.json`.

### 치수 상수 (native가 커진 2계열)

| 상수 | 전 | 후 | 보이는 크기 |
|---|---|---|---|
| `SkillEffects.RiteWhirlContentPx` | 235 | **353** | 내용 폭 = 판정 지름 3칸 그대로 (반경 1.5 배율 1.277 → 0.850) |
| `SkillEffects.RiteWhirlTraceContentPx` | 240 | **360** | 지름 3칸 그대로 (배율 1.25 → 0.833) |
| `MageBolts.FrostShotArtScale` | 1.6 | **0.796** | 1.872 → 1.871칸 (×0.67칸) — 서리 혼·서리 마법사 |
| `MageBolts.FrostShardArtScale` | 1.07 | **0.533** | 1.252 → 1.253칸 (×0.45칸) — 서리 파편 |

소용돌이·두름은 캔버스·알파가 같아 배율 그대로(`DrainVortexScale 0.8` · `ArmorCastArtScale 1.0`).

장별 실측 (px · 00→):
- 회오리 384²: 339×332 · 347×312 · 340×333 · 350×315 · **353**×340 · 352×308 · 345×336 · 329×302 · 자국 360×340
- 서리탄 256×128: 166×52 · 176×70 · **235**×84 · 207×63
- 소용돌이 128²: 88×77 · 86×75 · 78×75 · 112×63 · 두름 128²: 100×75 · 109×104 · 104×99 · 99×104
- arise-flame 256×320: 158×230 · 154×235 · 164×228 · 156×226

### arise-flame 4장 — 연결 보류

업로드·art_sprites 등록만 했다 (C 보강 5종 사용자 결정 대기). `GameConst.FxAriseFlame` 위 주석에 4장 RUID만 적어 두었고, 그림자 추출 불꽃은 예전 `146a0683…` 그대로다.

## 3. 검사

- `tests/quality/skillfx_nine.lua` **675개 통과**: 두름·회오리·자국·소용돌이 슬롯 = `fx-unify-*` 이름·크기(384²)·순서 · 옛 fx-B 17행은 자리에서 빠지고 GameConst 주석에 RUID가 남음 · fx-B 행 82개 그대로 · 교체 17/17 · 회오리 353px·자국 360px = 지름 3칸 · 배율 0.850/0.833 · arise-flame 4행 256×320 등록·연결 없음·주석에만 · 미리 불러 두기 전 장.
- `tests/quality/skillfx_c7.lua` **293개 통과**: 서리탄 슬롯 = `fx-unify-frost-shot-00~03` 256×128 · 옛 fx-C 서리탄 4행 남김·자리에서 빠짐·주석 · 내용 폭 235px로 보이는 길이 1.87/1.25칸(예전 audit 1.88/1.26 ±0.03) · 배율 0.796/0.533.
- `skillfx_e` 560 · `mage_school` 99 · `skillfx_shard` 220 · `giant_meteor_l2` 405 그대로 통과. `quality-all.log` = `python3 tests/quality/run.py --lua …` 전체 그룹 통과(exit 0).
- `npm-test.log` **20/20 통과**.

## 4. 메이커 회차(액트 4)에서 볼 장면

1. **의식 2기 뼈 회오리**: 384px 판 8장이 0.850배로 판정 원(지름 3칸)과 같은 크기인지 · 다운샘플판이 예전보다 덜 뭉개 보이는지 · 바닥 자국 0.833배 · 몸 뒤 층 1 그대로.
2. **서리 혼·서리 마법사·서리 파편**: 256×128 그림이 0.796/0.533배로 예전 길이(1.87/1.25칸)인지 · 머리가 진행 방향 · 왼쪽 FlipY · 0.1초 순환 · Tint(0.85·0.95·1) 느낌.
3. **생기 앗기 소용돌이·뼈 갑옷 두름**: 크기·자리 같은지, 색만 통일 공정 쪽으로 바뀌었는지.
4. 처음 쓰는 순간 비는 장이 없는지 (미리 불러 두기 전 장).
