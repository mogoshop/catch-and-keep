# 스킬 효과 통일 공정 골편 3종 전체 14장 업로드·교체 (2026-11-01)

코덱스 통일 공정 골편 3종 납품 `assets/codex-skill-fx-v3/unify-shard3-full-20261031`(중립 뼈 화살 4 · 골편 투척 4 · 골편 명중 6 = 14장)을 월드 리소스로 올리고, 기존 슬롯 6곳(투척·중립 화살·의식 화살·명중·뼛가루·뼈 명중)의 RUID를 교체했다. 메이커 도구는 쓰지 않음 (확인은 다음 메이커 회차). 선례: `2026-10-31-skillfx-unify-full5`(장별 ms·배율 재맞춤·폴백·옛 RUID 주석) · `2026-10-31-skillfx-shard20`(골편 연결 지점).

근거: `skillfx-unify-shard3-full-delivered.json`(PNG 14 · zip sha256 `23ab8192…3d94` 다시 계산해 일치 · `optional_muzzle 0` · `neutral_and_rite_arrow_same4PNG true`) · 결정 `claude-shard3-approved-full-2348.txt`(사용자 「둘 다 승인」: 투사체 = 길이 1.4배 큰 캔버스 판 256×128 / 192×96, 명중 = 2차 native96 판).

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. 올리기 전 `asset_list_group_resources`(OJYYQ · `fx-unify-shard` · `fx-unify-bone-arrow`) → 0장 (검색 동작은 `fx-unify-death-wave-0`으로 확인) → 중복 없이 14장 전부 올림.
2. `assets/`는 읽기만. `resource-mapping.csv` 14행을 scratchpad 팩으로 복사: 원본·사본 sha256 = 표 sha256 · PNG 헤더 크기 = 표 = `resource-properties.csv` · 모두 RGBA(색 형식 6) · 표 피벗 = properties 피벗(모두 0.5/0.5) — **오류 0**.
3. `.mcp.json`을 워크트리에 잠시 복사 → `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **14/14**. RUID를 받은 직후 같은 루프에서 pivot 0.5/0.5 · filter Point · wrap Clamp(처음 불리기 전). 끝나고 `.mcp.json` 삭제.
4. `asset_get_group_resource_metadata_bulk`(14 GUID 한 번) 대조: displayName = key · pivot · Point · Clamp · sprite/object · resultCode 0 — **14/14 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **14행** 추가. 옛 행(fx-B 투척 4 · 중립 화살 4 · 명중 4 · 의식 화살 4)은 되돌림 기록으로 남겼다.

## 2. 교체 (`connect-changes.csv`)

`Common/GameConst.mlua` 값만 바꾸고 각 줄 주석 끝에 `옛: <옛 RUID들>`을 남겼다. 의식 3기 화살은 코덱스가 따로 그리지 않고 중립 화살 4장을 같이 쓰라고 했으므로 `FxSkillRiteArrow = FxSkillBoneArrow`(같은 RUID). 뼛가루·뼈 명중은 원래 골편 명중 RUID를 공유하던 자리라 새 6장으로 함께 바꿨다.

### 배율 재맞춤 — 투사체는 보이는 길이 1.4배, 명중은 그대로

알파>16 실측(옛 판은 `assets/codex-skill-fx-v2/shard-full-20261031`·`B-nine-full-20261031/rite-bone-arrow` 원본 PNG, 새 판은 납품 `png/` · 장 중 최대):

| 자리 | 캔버스 | 내용 길이 전 → 후 | 배율 전 → 후 | 보이는 길이 전 → 후 |
|---|---|---|---|---|
| 골편 투척 (예측·서버) | 128×64 → 192×96 | 116 → **145**px | `ShardThrowScale` 0.65 → **0.728** | 0.754 → **1.056**칸 (×1.40) |
| 〃 튕김 (0.5/0.55 비) | 〃 | 〃 | 0.591 → **0.662** | 0.685 → **0.960**칸 (×1.40) |
| 중립 뼈 화살 | 128×64 → 256×128 | 94 → **235**px | `ShadowUnit.BoneArrowScale` 0.7 → **0.392** | 0.658 → **0.921**칸 (×1.40) |
| 의식 3기 뼈 화살 | 128×64 → 256×128 | 94 → **235**px | `RiteArrowScale` 1.2 → **0.672** (마지막 발 ×1.25 그대로) | 1.128 → **1.579**칸 (×1.40) · 마지막 발 1.41 → 1.97칸 |
| 골편 명중 | 96 → 96 | 77 → **84**px (02번 장) | `ShardHitScale` 1.2 → **1.1** | 0.924 → **0.924**칸 그대로 (캔버스 1.152 → 1.056칸) |
| 뼛가루 | 〃 | 〃 | `DustScale` 1.1 → **1.01** | 0.847 → **0.848**칸 그대로 |
| 뼈 명중 | 〃 | 77(sample-01·03) → **84**px | `HitArtScale` 1.0 → 새 `Projectile.HitBoneArtScale` **0.92** | 0.770 → **0.773**칸 그대로 |

- 투사체 공식: 새 배율 = 옛 내용 px × 옛 배율 × 1.4 ÷ 새 내용 px. 명중 공식: 새 배율 = 옛 배율 × 옛 내용 ÷ 새 내용(캔버스가 그대로라 「1.4배」 대상 아님 — 1.15칸 기준 크기를 보이는 내용으로 유지).
- 뼈 명중은 다른 속성 명중(저주·불·서리 2장)과 `HitArtScale`을 같이 쓰므로, 6장 장별 ms 길에서만 쓰는 `HitBoneArtScale`을 따로 두었다.

### 시간 — 장별 ms · 개수가 다르면 예전 길

| 자리 | 전 → 후 | 상수 |
|---|---|---|
| 골편 투척 · 중립 화살 · 의식 화살 | 100ms × 4 순환(0.40s) → **70ms × 4(0.28s)** | 새 `FxSkillShardThrowMs`·`FxSkillBoneArrowMs` 70 · `FxSkillRiteArrowMs` 100 → 70 |
| 골편 명중 · 뼛가루 · 뼈 명중 | 100 × 4(0.40s) · 뼈 명중 100 × 2(0.20s) → **40,50,50,80,100,130 (0.45s)** | 새 `FxSkillShardHitMs` (시작 1·정점 2·잦아듦 3) |

- 명중 계열은 `Util.PlayFramesMs`(hold·fade 0 — 잦아듦이 그림 알파에 들어 있어 마지막 장 130ms 뒤 바로 지움 · full5 「한 번 계열」과 같은 방식). **ms 개수 = 그 자리 장 수(6)일 때만 새 길** — 옛 4장(뼈 명중 2장)으로 되돌리면 예전 길(`FxSkillShardFrameMs`·`FxSkillConsumedDustMs`·`FxSkillHitMs` 고른 간격)이 그대로 돈다(검사 확인).
- `FxSkillShardFrameMs` 100은 폭풍 골편·창 골편과 예전 길에만 남는다.
- 투사체 순환은 `Projectile.FrameSec`에서 그림 비교로 자기 상수(의식 화살 → 중립 화살 → 투척 순서 · 의식과 중립은 같은 RUID라 둘 다 70ms).

### 그대로 둔 것

- 오른쪽 기준 그림 → 왼쪽 비행 FlipY(`Projectile.MirrorSkin`/`FaceMirror`) · `ViewAngleOffset 0` · 잔상 거울 · 속성 색 Tint · 층(투사체 그대로 · 명중 MapLayer0 6).
- 빈 슬롯 폴백(보라 궤적 FxShardShot · 보라 파열 FxShardHit ClipFx · 몬스터 화살 SpriteArrow 1.2 · 공용 불꽃).
- 미리 불러 두기: `SkillEffects.OnBeginPlay` 목록에 이미 있는 자리라 새 14장 모두 들어간다(공유 RUID는 한 번 · 검사 확인).
- 서버 타이머 추가 0 — 명중·뼛가루는 서버가 Multicast 한 번, 장 넘김은 각 클라이언트 `PlayFramesMs`.
- 머즐: 코덱스 `optional_muzzle 0` → 발사 지점 재생은 붙이지 않음.
- `[VRF]`: `shard frames start … ms=`가 실제 장 간격(70/100)을 찍고 · `shard hit frames n=6 ms=40,50,50,80,100,130` · `consumed dust frames n=6 ms=… shared=true` · `projectile hit fx style= kind=bone art=true` 그대로.

## 3. 검사

- `tests/quality/skillfx_shard.lua` **278개 통과**: 슬롯 5(투척·중립 화살 4장 큰 캔버스 · 명중 6장 · 창·폭풍 골편 fx-B 그대로) 이름·크기·순서 · 옛 fx-B 12행 남김·자리에서 빠짐·주석 「옛」 · 70ms·명중 ms 개수 6·합 450 · 의식 화살 = 중립 화살 · 뼛가루·뼈 명중 = 명중 6장 · 투척 0.07초 순환(반례 0.1초) · 명중 PlayFramesMs(hold·fade 0) · **옛 4장이면 예전 길** · 보이는 길이 1.4배 4줄 · 명중·뼛가루 크기 그대로 · 장별 ms 분기 3곳 · 타이머 없음 · 미리 불러 두기 7자리 전 장.
- `tests/quality/skillfx_nine.lua` **874개 통과**: 의식 화살 슬롯 = fx-unify-bone-arrow-neutral 256×128 · 옛 rite 4행 남김(교체 41 → 45) · 뼛가루·뼈 명중 = 명중 6장 · 뼈 명중 옛 2장 RUID 주석 · 의식 화살 0.07초 · 뼛가루 6장 ms(옛 4장이면 0.1초) · 뼈 명중 6장 ms·HitBoneArtScale(옛 2장이면 예전 길).
- `tests/quality/skillfx_c7.lua` 427개(골편 투척 간격 = FxSkillShardThrowMs) · `skillfx_e` 610개.
- `quality-all.log` = `python3 tests/quality/run.py --lua …` 전체 그룹 통과(exit 0) · `npm-test.log` **20/20 통과**.

## 4. 메이커 회차에서 볼 장면

1. **골편 투척 3발 부채꼴(좌·우)**: 길이 ≈ 1.06칸(예전의 1.4배)이 과하지 않은지 · 4장이 0.07초씩 넘어가는지 · 머리가 진행 방향 · 왼쪽 발사 때 위아래 안 뒤집힘(FlipY) · 잔상 거울 · 쏜 사람 화면(예측)과 다른 사람 화면 둘 다 · 튕김 0.96칸.
2. **골편 명중**: 6장 0.45초(시작 0.04 · 정점 0.1 · 잦아듦 0.31) · 크기 0.92칸이 예전과 같은지 · 마지막 장이 갑자기 끊겨 보이지 않는지 · 뼈 흰빛.
3. **의식 3기 뼈 화살**: 중립 화살 그림 · 1.58칸(마지막 발 1.97칸) · 0.07초 순환 · 왼쪽 거울 · 앞 두 발 뼈 명중 6장.
4. **뼛가루**(의식 2기·3기 쏜 해골·거인 합체): 발 앵커 · 0.85칸 · 0.45초.
5. **원거리 그림자·되살림 뼈 화살**: 0.92칸 · 속성 색 Tint 가독성 · 뼈 명중 0.77칸 · 0.45초.
6. 처음 쓰는 순간 비는 장이 없는지 (미리 불러 두기 14장).
