# 스킬 효과 9계열 B 88키 업로드·연결 (2026-10-31)

코덱스 납품 `assets/codex-skill-fx-v2/B-nine-full-20261031` (사용자 승인 11:40 · `stage actual_user_approved1140_full`) 논리 88키 · 물리 86장을 월드 리소스로 올리고 게임 코드에 연결했다. 메이커 확인 전 (메이커 도구는 쓰지 않음 — 별도 회차). 선례: `2026-10-31-skillfx-shard20` · `2026-10-31-skillfx-full33`.

## 1. 업로드 (`upload-nine.json` · `upload-res.log`)

1. `assets/`는 읽기만. `resource-mapping.csv` 88행 중 별칭(`alias_of`)이 없는 82장을 scratchpad 팩으로 복사 — 원본·사본 sha256 같음 · PNG 헤더 크기 = 표 크기(48² · 96² · 128² · 128×64 · 256²) · 모두 RGBA(색 형식 6).
2. 팩 표: `resource-mapping.csv`(key · resource_name · file · ruid · category effect · width · height) + `resource-properties.csv`(name · pivot · wrap Clamp) — 피벗은 코덱스 표 그대로: 78장 0.5/0.5 · 망령 잔상 4장 0.5/0.1(발).
3. `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **82/82**. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot·filter Point·wrap Clamp (처음 불리기 전). 오류 없음.
4. `asset_get_group_resource_metadata_bulk`(50개씩 2회 · 새 82 + 재사용 4 = 86 GUID)로 대조: displayName = key · pivot · Point · Clamp · subCategory object — **새 82/82 일치 · 재사용 4/4(6키) 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **82행** 추가 (재사용 키는 새 행을 만들지 않음).
6. `.mcp.json`은 업로드 동안만 워크트리에 복사했다가 지웠다 (커밋 안 됨).

### 재사용 (중복 업로드 안 함)

| 논리 키 | 코덱스 파일 | 같은 파일 (골편 레인 업로드) | sha256 | 피벗 | 결과 |
|---|---|---|---|---|---|
| fx-B-consumed-skeleton-dust-sample-00 | shared-neutral-hit/png/fx-B-shard-hit-sample-00 | fx-B-shard-hit-sample-00 | c87aef1d… 동일 | 0.5/0.5 = 0.5/0.5 | RUID ce229a7c… 공유 |
| …-dust-sample-01 | …sample-01 | fx-B-shard-hit-sample-01 | 8547f20d… 동일 | 동일 | 96e5b3e0… 공유 |
| …-dust-sample-02 | …sample-02 | fx-B-shard-hit-sample-02 | 93e847d0… 동일 | 동일 | ff9b9335… 공유 |
| …-dust-sample-03 | …sample-03 | fx-B-shard-hit-sample-03 | 04e18946… 동일 | 동일 | 0076e17e… 공유 |
| fx-B-projectile-hit-bone-sample-00 | …shard-hit-sample-01 | fx-B-shard-hit-sample-01 | 8547f20d… 동일 | 동일 | 96e5b3e0… 공유 |
| fx-B-projectile-hit-bone-sample-01 | …shard-hit-sample-03 | fx-B-shard-hit-sample-03 | 04e18946… 동일 | 동일 | 0076e17e… 공유 |

뼛가루의 「발 앵커」(`world-registration-conditions` anchor_proposal `ground_below_actor_at_feet`)는 놓는 자리 제안이고 피벗은 표에서도 0.5/0.5 → 피벗이 같으므로 별도 업로드 없이 코드에서 놓는 자리(`SkillEffects.DustDy` = 해골 발 + 0.3칸)로 처리했다.

## 2. 연결 (`connect-changes.csv`)

`Common/GameConst.mlua` 115~142행에 9계열 자리(「|」 목록 · 표식·원형 판은 「kind=…;」)와 계열별 ms 상수 9개(모두 100 · 코덱스 `proposal_interval_ms`)를 두었다. 모든 새 길은 자리가 `""`이면 예전 연출로 돌아간다 (`tests/quality/skillfx_nine.lua`에서 자리를 비워 확인).

| 계열 | 자리 | 연결 지점 (파일:행) | 전 → 후 |
|---|---|---|---|
| 1 뼈 갑옷 두름 | FxSkillArmorCast | `SkillEffects.mlua:2485` StatusFx armor | Buff 입자 1.4배 0.5초 → 4장 0.4초 몸 가운데·몸 앞 1.0배 |
| 1 흡수 | FxSkillArmorAbsorb | `PlayerStats.mlua:688` OnSyncProperty → `:714` ArmorHitFx | (없음) → 흡수량이 줄면 3장 0.3초 · 0.25초 간격 |
| 1 깨짐 | FxSkillArmorBreak | 같은 길 (흡수량 0) | (없음 · 「터지는 갑옷」 노드 입자만) → 4장 0.4초 + 노드 입자 그대로 |
| 2 표식 12 | FxSkillMarks | `MonsterStatus.mlua:779~783` MarkerIcon | ui_icons 32px 11종 · 저주 속성은 스킬 아이콘 축소 → 48px 외곽선 보강판 11 + hex 새 표식 (배율 0.9 그대로) |
| 3 저주 원형 판 6×4 | FxSkillCurseCircles | `SkillEffects.mlua:2316` CurseShape · `:2355` CurseCircleScale | 세로로 긴 문장(가로 2.1×세로 2.8칸 → 보이는 반경 맞춤) → 원형 판 4장 · 보이는 반경 = 저주 반경(지름 3칸) |
| 4 망령 질주 잔상 | FxSkillDashGhost | `SkillEffects.mlua:1631` WraithDash → `:1553` DashGhostFx | 떠난 자리 푸른 고리 FxBlink 0.6초(+도약 도착 고리) → 길 위 0·1/3·2/3 잔상 4장씩 0.05초 시차(+도약 도착 자리) |
| 5 회오리 8 + 자국 | FxSkillRiteWhirl · FxSkillRiteWhirlTrace | `SkillEffects.mlua:1802` RiteWhirl → `:1813` RiteWhirlFx | 보라 회오리 고리 3.7×1.18칸 + 범위 원 → 회전 8장 반복 4초(내용 폭 = 지름 3칸) + 바닥 자국 |
| 6 의식 3기 뼈 화살 | FxSkillRiteArrow | `SkillEffects.mlua:1872` RiteArrows · `Projectile.mlua:299` MirrorSkin · `:305` FrameSec | 보라 궤적 1.1/1.38배 → 뼈 화살 4장 순환 1.2/1.5배 · 왼쪽 FlipY |
| 6 소모 해골 뼛가루 | FxSkillConsumedDust | `UndeadSystem.mlua:141`·`:198` · `SkillEffects.mlua:1852` → `:741` ConsumedDust → `:752` DustFrames | 골편 명중 4장(해골 자리 +0.4) → 같은 RUID 4장을 발 앵커(+0.3)로 1.1배 |
| 7 생기 앗기 소용돌이 | FxSkillDrainVortex | `SkillEffects.mlua:1683`·`:1690` → `:1643` DrainVortex → `:1653` DrainVortexFrames | 메이플 보라 소용돌이 FxDrain 0.6 → 4장 반복 0.7초 0.8배 |
| 8 투사체 속성 명중 | FxSkillHitBone/Curse/Fire/Frost | `Projectile.mlua:432` HitFx · `:444` HitArt · HitKind ← `MageBolts.mlua:114·119·124·150` · `SkillEffects.mlua:1881` · `ShadowUnit.mlua:1520` | 공용 작은 불꽃 → 속성 2장 0.2초 (불 = 저주 불꽃·불꽃 마법사 · 서리 = 서리 혼·파편·서리 마법사 · 저주 = 저주 마법사 · 뼈 = 의식 화살 앞 두 발·중립 뼈 화살) |
| 9 영혼 격류 시전 | FxSkillTorrentCast | `SkillEffects.mlua:2290` Fx torrent | 혼 구슬 입자 0.6 → 4장 0.4초 몸 가운데 0.8배 |
| 9 영혼 격류 명중 | FxSkillTorrentHit | `Projectile.mlua:420` HitFx torrent | 혼 구슬 + 불꽃 입자 → 4장 0.4초 0.75배 |
| 공통 | 미리 불러 두기 | `SkillEffects.mlua:280~295` OnBeginPlay | 자리마다 첫 장 13 + 원형 판 6 + 표식 12 |

프레임 순환은 모두 클라이언트(Util.PlayFrames·Hold·Loop · 잔상 시차만 클라이언트 SetTimerOnce). 서버 타이머 추가 0 · 흡수·깨짐은 이미 동기화되는 `BoneArmor` 값 비교라 통신도 늘지 않는다 (서버→클라 Multicast는 예전 ClipFx 자리를 1:1로 바꾼 것뿐). `[VRF]` 계열당 한 줄(출시 서버 끔): `bone armor cast frames` · `bone armor %s frames` · `curse marker … outline=` · `curse shape … circle=` · `dash ghost frames` · `rite whirl frames` · `projectile hit fx … kind= art=` · `consumed dust frames … shared=` · `drain vortex frames` · `torrent cast frames`.

## 3. 판단 근거

- **영혼 격류 자리 (지시와 다름)**: 지시는 시전 4장을 `FxSkillTorrent`에 넣으라 했지만, 이 자리는 `MageBolts.Configure` soul 분기의 **투사체 몸 그림**(`proj:Skin(_GameConst.FxSkillTorrent, 0.55)`)이다. 시전 그림(128×128 몸 폭발)을 넣으면 영혼 격류 투사체가 시전 그림으로 날아간다 → `FxSkillTorrent`는 비행 몸 납품 대기로 비워 두고(주석 갱신) 시전 `FxSkillTorrentCast` · 명중 `FxSkillTorrentHit` 두 자리를 새로 두었다.
- **뼈 갑옷 흡수·깨짐 자리**: 흡수·깨짐은 서버 `PlayerStats.SoakBoneArmor`에서 일어나지만 Multicast를 늘리지 않으려고 이미 동기화되는 `BoneArmor` 값이 줄어드는 것을 각 클라이언트 `OnSyncProperty`(몸 고리가 이미 쓰는 곳)에서 본다. `BoneArmor`를 줄이는 곳은 SoakBoneArmor 하나뿐이라(grep: 대입 4곳 — SkillEffects 623 두름 · 2461 뼈 껍질은 늘리고 · 감소는 PlayerStats 663·666행) 오탐이 없다. 몰려 맞을 때 겹쳐 쌓이지 않게 흡수만 0.25초 간격.
- **표식 크기**: 새 48px 판의 문양 높이 30px(알파>16 실측 · 11종 모두 y9~38) ≈ 예전 32px 판 28px(y2~29) → `MarkerScale` 0.9 그대로 (0.27칸 · 예전 0.25칸). 원판(48px×0.83 = 40px)도 그대로. 서리 표식(frostmark)은 납품에 없어 `ui_icons mark_frost` 유지.
- **원형 판 크기**: 문장과 같은 계산(보이는 반경 = 저주 반경)을 원형 판 실측(가운데에서 알파>16 가장 먼 화소 · 4장 중 최대: amp 58.5 · weaken 56.7 · terror 62.2 · thorn 57.7 · lifetap 55.5 · resist 58.7px)으로. 원형이라 가로세로 같은 배율이 그대로 지름 3칸 원이 된다. 문장 자리는 원형 판이 빌 때의 되돌림으로 남겼다.
- **잔상 구조**: 코덱스 조건 「departure-to-arrival trajectory owned by Claude; position copies in scene not extra authored frames」 + 알파 0.45가 그림에 이미 들어 있음. 질주는 클라이언트가 이미 0.16초에 옮긴 뒤 서버 WraithDash가 불리므로 「도착 자리 4장 순차」보다 「길 위 복사본이 지나간 순서대로」가 이동을 읽히게 한다 → 0·1/3·2/3 자리 · 0.05초 시차 · 강화 「망령 도약」이면 도착 자리(예전에도 도착 섬광이 있던 자리) 하나 더. 방향은 가로 배율 음수(EffectService에 FlipX가 없음 — 메이커 확인 장면).
- **회오리 크기·층**: 판정 지름 3칸 = 256px 그림 내용 폭(회전 8장 최대 235px · 자국 240px)으로 배율(1.277 · 1.25). 그림이 판정 원과 같은 크기라 임시 범위 원(P42 · 「전용 그림 전 임시」 주석)은 새 길에서 깔지 않는다 (비면 예전 FxStorm + 범위 원). 회전 층 5(몸 앞 · 도는 골편 아래 반원과 같은 층) · 자국 층 1.
- **의식 3기 화살**: 골편 레인이 비워 둔 `RiteArrows` 자리. 128×64 오른쪽 기준 → `Projectile.MirrorSkin` 목록에 넣어 순환·FlipY를 그대로 쓰고, 장 간격은 `FrameSec`에서 이 그림만 `FxSkillRiteArrowMs`. 앞 두 발 명중은 뼈 명중 2장(`HitKind = "bone"`), 마지막 발은 기존 「rite_push」 큰 충격 그대로.
- **속성 명중 대상**: `Projectile.Info`는 동기화되지 않아 Multicast HitFx에서 알 수 없다 → 서버 전용 `HitKind`를 투사체에 두고 HitFx 인자로 넘긴다. 「불」은 캐릭터 저주 불꽃(HexFlame이 `Configure "fire"`)과 불꽃 마법사, 「서리」는 서리 혼·서리 파편·서리 마법사, 「저주」는 저주 마법사 마력탄, 「뼈」는 의식 화살 앞 두 발 + 원거리 그림자 중립 뼈 화살. 골편 투척은 지시대로 `FxSkillShardHit` 그대로(HitKind 없음 → 공용 불꽃 + 골편 명중 4장 예전과 같음). 뼈 창(spear)·영혼 격류(torrent)는 자기 명중 분기.
- **생기 앗기**: 메이플 원본 `FxDrain`을 쓰는 곳은 SoulDrain의 표적 몸 소용돌이 2곳(결투 상대·몬스터)뿐 — 거기만 교체. 연결 궤적 입자(P21)·혼 사슬(P22) 입자는 그대로.
- **미리 불러 두기**: 지시대로 자리마다 첫 장만 (회오리 8장 중 1장 등 — 나머지 장이 처음 늦게 뜨는지는 메이커 확인 장면).

## 4. 미연결 계열

없음 — 88키 모두 부르는 곳이 있다. (등록만 하고 부르는 곳이 없는 자리는 이번에 만들지 않았다. `FxSkillTorrent`는 예전부터 있던 비행 몸 자리로 계속 비어 있음.)

## 5. 검사

- `tests/quality/skillfx_nine.lua` **595개** — 슬롯별 RUID 수 · 32자리 hex · art_sprites 82행(이름·effect·크기·RUID · 회오리 끼움 순서) · RUID 중복 0 · 계열별 100ms · 재사용 일관성(뼛가루 = 골편 명중 · 뼈 명중 = 골편 명중 2·4번째 · 새 행 없음) · 채움/빈 자리 되돌림(계열마다) · 원형 판·회오리 크기 = 판정 지름 · 잔상 자리·시차·거울 · 흡수 간격·깨짐 · Configure 속성 · 미리 불러 두기 · 부르는 곳 grep · 반복 타이머 없음 · [VRF] 한 줄.
- 기존 검사 갱신: `skillfx_e.lua`(원형 판을 비우고 문장 되돌림 길을 본다 · 560개) · `skillfx_shard.lua`(뼛가루 부르는 곳이 ConsumedDust로 · 207개).
- `quality-all.log` 전체 그룹 통과 · `npm-test.log` 18/18 통과.

## 6. 메이커 회차에서 볼 장면

1. 뼈 갑옷 두름: 4장이 몸 가운데에 맞는지 · 뒤이어 몸 고리(두 층)로 자연스럽게 넘어가는지.
2. 뼈 갑옷 흡수(몬스터에게 맞기)·깨짐(흡수량 다 씀): 3장·4장 · 몰려 맞을 때 0.25초 간격이 과하거나 모자라지 않은지 · 다른 플레이어 화면에서도 보이는지.
3. 머리 위 표식 12: 외곽선 보강판 가독성(어두운 바닥·밝은 바닥) · 저주 속성(hex)이 새 표식으로 · 원판과의 크기 비율 · 여러 개 한 줄 간격.
4. 저주 6종 원형 판: 지름 3칸 원과 판정이 맞는지 · 노드로 커진 반경 · 바닥 층(몸을 덮지 않는지).
5. 망령 질주: 잔상 3개 시차 · 왼쪽 질주 때 가로 거울(음수 배율)이 그려지는지 · 도약 강화 도착 잔상 · 0.45 알파가 너무 옅지 않은지.
6. 의식 2기: 회오리 8장 반복 0.8초 한 바퀴의 부드러움(승인/중간 끼움) · 내용 폭 = 판정 원 · 바닥 자국 · 몸 앞 층이 몬스터를 가리지 않는지 · 범위 원 없이도 범위가 읽히는지.
7. 의식 3기: 뼈 화살 4장 순환·왼쪽 FlipY · 마지막 발 크기 · 쏜 해골 뼛가루(발 앵커).
8. 의식 2기·거인 합체: 소모 해골 뼛가루가 발 자리에 앉는지.
9. 생기 앗기: 소용돌이 4장 반복 0.7초 · 크기.
10. 투사체 명중: 저주 불꽃(불) · 서리 혼·파편(서리) · 저주 마법사(저주) · 의식 화살·원거리 그림자(뼈 · 화살 색 Tint) · 골편 투척은 예전 그대로.
11. 영혼 격류: 시전 4장(몸) · 명중 4장(표적) · 투사체 몸은 예전 혼 구슬 그대로.
12. 처음 쓰는 순간 그림이 늦게 뜨지 않는지 (자리마다 첫 장만 미리 불러 둠 — 회오리 등 여러 장 그림).
