# 골편 계열 20장 업로드·연결 (2026-10-31)

코덱스 납품 `assets/codex-skill-fx-v2/shard-full-20261031` (사용자 승인 11:40 · `stage approved1140_full20`) 5계열 × 4장을 월드 리소스로 올리고 게임 코드에 연결했다. 메이커 확인 전 (메이커 도구는 쓰지 않음 — 별도 회차).

## 1. 업로드 절차 (선례 `docs/evidence/2026-10-31-skillfx-full33`와 같음)

1. `assets/`는 읽기만. 20장을 scratchpad 팩으로 복사하고 원본·사본 sha256이 같은지, PNG 헤더 크기가 표(128×64 / 96×96)와 같은지 확인 (모두 RGBA).
2. 팩에 `upload-res`가 읽는 표를 만들었다: `resource-mapping.csv`(key · resource_name · file · ruid · category …) + `resource-properties.csv`(name · pivot_x 0.5 · pivot_y 0.5 · wrap Clamp).
3. `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · 20/20 (`upload-res.log`). RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot 0.5/0.5 · filter Point · wrap Clamp (처음 불리기 전). "unexpected error" 없음 → MCP 단계별 우회는 쓰지 않았다.
4. `asset_get_group_resource_metadata_bulk`(20 GUID 한 번)로 대조: displayName = key · pivot 0.5/0.5 · Point · Clamp · subCategory object — **20/20 일치 · RUID 중복 0** (`upload-shard20.json`).
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` 20행 추가.

## 2. 연결 (`connect-changes.csv`)

| 계열 | 자리 | 연결 지점 | 전 → 후 |
|---|---|---|---|
| 골편 투척 | `GameConst.FxSkillShardThrow` | `SkillEffects` 565 PredictBoneShard(PlayLocal) · 650 ShardBounce(Skin) · 734 BoneShard(Skin) → `ShardSkinRuid/ShardSkinScale` | 메이플 보라 궤적 한 장(FxShardShot 0.55/0.5) → 골편 4장 100ms 순환 0.65/0.59배 · 왼쪽 비행 FlipY |
| 골편 명중 | `GameConst.FxSkillShardHit` | `SkillEffects` 665 BoneShardImpact → `ShardHit`(서버) → `ShardHitFrames`(Multicast · Util.PlayFrames) | 보라 파열 ClipFx 0.5·0.6초 → 4장 한 번 0.4초 · 1.2배 · MapLayer0 6 |
| 〃 (뼛가루) | 〃 | `UndeadSystem` 141(의식 2기) · 198(거인 합체) · `SkillEffects` 1710(의식 3기 쏜 해골) | 보라 파열 0.5/0.45 → 골편 명중 4장 1.2/1.08배 |
| 폭풍 골편 | `GameConst.FxSkillStormShard` | `SkillEffects` 296~311 StormClipFx · 350~366 StormOrbit (회전본이 빈 때의 길) | 도는 보라 궤적 6개 → 폭풍 골편 4장 순환(골편마다 한 칸 어긋남) · 접선 왼쪽 FlipY · 0.55배 |
| 중립 뼈 화살 | `GameConst.FxSkillBoneArrow` | `ShadowUnit` 1517~1522 ShootOneBolt 속성 없음 분기 | 몬스터 화살 SpriteArrow 1.2 → 뼈 화살 4장 0.7배 · 속성 색 Tint 그대로 |
| 창 골편 | `GameConst.FxSkillSpearShard` | 없음 (등록만) | — |
| 공통 | `GameConst.FxSkillShardFrameMs = 100` | `Projectile` 292 MirrorSkin · 299 FrameSec · 306 FaceMirror · 212 DrawFlight · 279 DropGhost · 326 AdvanceFrame · 184 [VRF] | 「|」 그림 장 간격: 골편 계열만 100ms (나머지 예전 0.08초) |

모든 새 경로는 그림 칸이 `""`이면 예전 연출(FxShardShot · FxShardHit ClipFx · SpriteArrow)로 그대로 돌아간다 (`tests/quality/skillfx_shard.lua` ③에서 빈 자리로 바꿔 확인).

프레임 순환·뒤집기·명중 재생은 모두 클라이언트에서만 돈다 (서버 타이머 추가 0 — 명중은 서버가 Multicast 한 번, 장 넘김은 각 클라이언트 Util.PlayFrames). `[VRF]` 한 줄씩: `shard frames start`(내가 쏜 골편 · 출시 서버 끔) · `shard hit frames`(내 명중) · `bone arrow skin`(서버 · 첫 발과 25발마다) · `bone storm orbit … shardArt=`.

## 3. 판단 근거

- **방향**: 코덱스 조건 「right canonical, horizontal mirror permitted」. Projectile은 진행 각으로 ZRotation을 돌리므로 왼쪽으로 날면 그림이 위아래로 뒤집힌다 → 진행 방향 x < 0이면 `SpriteRendererComponent.FlipY` (회전 180° + FlipY = 가로 거울). 다른 그림(예전 궤적·뼈 창 몸 등)은 FlipY를 늘 끈다 (재사용 투사체 대비). 잔상(EffectService)은 FlipY가 없어 세로 배율을 음수로 — 메이커에서 확인할 장면.
- **크기**: audit(`2026-10-31-skillfx-audit/skillfx-inventory.csv`) P02 보라 궤적 0.55배 = 0.78×0.24칸 · P03 보라 파열 0.5배 = 1.14×1.08칸. 새 그림 알파>16 실측: 투척 보이는 몸 110~116px · 명중 가장 큰 장 76px(캔버스 96px) · 뼈 화살 93~94px · 폭풍 골편 90~116px. 투척 0.65배 = 보이는 몸 약 0.73칸, 명중 1.2배 = 캔버스 1.15칸(옛 캔버스 1.14칸과 같게).
- **창 골편**: 뼈 창 몸은 이미 `FxSkillSpear`. 창에서 갈라지는 골편·관통 파편 투사체 경로는 코드에 없다(`spear_twin`은 두 번째 창 · 「쪼개짐」은 서리 혼 전용) → 등록·슬롯만 (FxSkillCurseBreak 선례).
- **폭풍 골편**: 뼈 폭풍이 골편을 내던지는 경로는 없다(BoneStorm은 반경 판정 반복뿐). `FxSkillBoneStorm`(8장 회전본)은 지시대로 그대로 두었으므로 도는 골편 6개 길은 지금 화면에 나오지 않는다 — 회전본을 비우면 바로 폭풍 골편이 돈다.
- **중립 뼈 화살**: `RiteArrows`(의식 3기)는 주석상 코덱스 「뼈 화살」(G-15) 전용 그림 대기 자리이고 9계열 `rite-bone-arrow`가 후속 납품 예정 → 건드리지 않았다. 「해골 궁수」 몬스터는 없다(`data/monsters.csv` 원거리 = 교단 광신 석궁병·불꽃 사도·사제·마녀·뱀장어 등 사람·짐승 — 몬스터 화살 `MonsterAttack.ShootBolt`는 그대로). 해골·되살린 망자 쪽에서 「화살」을 쏘는 코드 경로는 `ShadowUnit.ShootOneBolt`의 속성 없음 분기(원거리 그림자·되살림 = 화살 1발)뿐이라 거기에 붙였다. 이 분기는 이미 속성 색 Tint를 쓰므로 무채색 중립 그림의 용도와 맞는다.
- **시간**: 코덱스 `engine_interval_ms` null · `proposal_interval_ms` 100 → 상수 하나(`FxSkillShardFrameMs`)로 두어 메이커 회차에서 한 곳만 바꾸면 된다.

## 4. 검사

- `tests/quality/skillfx_shard.lua` 207개 (슬롯 5 × 4 RUID · 32자리 hex · art_sprites 20행 · 100ms · 순환·FlipY·반례 · 빈 자리 되돌림 · 명중 크기 비례 · 도는 골편 어긋남·뒤집기 · 부르는 곳 grep) — `quality-all.log`(전체 그룹 통과).
- `npm test` 18/18 (`npm-test.log`).

## 5. 메이커 회차에서 볼 장면

1. 골편 투척 3발 부채꼴: 날개 4장이 0.1초씩 넘어가는지 · 머리가 진행 방향인지 · 왼쪽 발사 때 위아래가 뒤집히지 않는지(FlipY) · 잔상(음수 세로 배율)이 보이는지/사라지는지 · 쏜 사람 화면(예측)과 다른 사람 화면(서버 투사체) 둘 다.
2. 골편 명중: 4장 0.4초 · 크기(1.15칸 캔버스)가 몬스터 대비 과하지 않은지 · 뼈 흰빛이 바닥에서 보이는지 · 튕김 「튀는 뼛조각」 비행 그림.
3. 뼈 의식 2기·3기·거인 합체: 해골이 무너질 때 골편 명중 4장(뼛가루 자리).
4. 원거리 그림자·되살림 화살: 뼈 화살 4장 · 속성 색 Tint(기본 보라·불·냉·번개·독) 가독성 · 왼쪽으로 쏠 때 뒤집힘.
5. 뼈 폭풍: 지금은 회전본(FxSkillBoneStorm) 그대로인지 확인 (폭풍 골편은 회전본을 비웠을 때만).
6. 처음 쓰는 순간 그림이 늦게 뜨지 않는지 (프리로드 16장 추가).
