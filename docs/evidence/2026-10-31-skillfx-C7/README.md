# 메이플 원본 교체 C 묶음 승인 7종 28장 업로드·연결 (2026-10-31)

코덱스 납품 `assets/codex-skill-fx-v2/C-approved7-full-20261031` (사용자 「7 승인·5 보강」 · stage `actual_user_approved1241_full4`) 7계열 × 4장 = 28장을 월드 리소스로 올리고, 지금까지 메이플 원본 한 장짜리 클립을 쓰던 자리(FxBlast·FxOffering·FxWave·FxFlameShot·FxFrostShot·FxPoisonCloud·FxSlash)에 연결했다. 메이커 확인 전 (메이커 도구는 쓰지 않음 — 별도 회차). 보강 대기 5종(추출 4종·죽음 연기)은 건드리지 않았다. 선례: `2026-10-31-skillfx-nine88` · `2026-10-31-giant-meteor-L2`.

## 1. 업로드 (`upload-C7.json` · `upload-res.log`)

1. `assets/`는 읽기만. `resource-mapping.csv` 28행을 scratchpad 팩으로 복사 — 원본·사본 sha256 같음 · PNG 헤더 크기 = 표 크기(192² · 256² · 128×64 · 128×96) · 모두 RGBA(색 형식 6) · 표 피벗 = `resource-properties.csv` 피벗.
2. 팩 표: `resource-mapping.csv`(key · resource_name = key · file · ruid · category effect · width · height · sha256) + `resource-properties.csv`(name · pivot · wrap Clamp) — 피벗은 코덱스 표 그대로: 바닥 4계열(폭발·성찬·파동·독 구름) 16장 0.5/0.25(= root 96,144 / 128,192 · 지면 원점) · 투사체 2계열·베기 12장 0.5/0.5.
3. `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **28/28**. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot·filter Point·wrap Clamp (처음 불리기 전). 오류 없음.
4. `asset_get_group_resource_metadata_bulk`(28 GUID 1회)로 대조: displayName = key · pivot · Point · Clamp · sprite/object · resultCode 0 — **28/28 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **28행** 추가.
6. `.mcp.json`은 업로드 동안만 워크트리에 복사했다가 지웠다 (커밋 안 됨).

## 2. 치수 측정 (알파 > 16 · 코덱스 원본 PNG)

| 계열 | 캔버스 · 피벗 | 장별 내용 폭×높이 (px · 00→03) | 최대 |
|---|---|---|---|
| 뼈 폭발 bone-blast | 192×192 · 0.5/0.25 | 100×129 · 183×123 · 174×122 · 156×115 | 183 (01) |
| 성찬 치유 bone-offering-heal | 192×192 · 0.5/0.25 | 140×130 · 164×111 · 183×127 · 181×126 | 183 (02) |
| 죽음의 파동 death-wave | 256×256 · 0.5/0.25 | 124×97 · 213×122 · 243×153 · 230×130 | 243 (02) |
| 독 구름 poison-cloud | 256×256 · 0.5/0.25 | 180×115 · 220×117 · 244×134 · 205×105 | 244 (02) |
| 불꽃탄 flame-shot | 128×64 · 0.5/0.5 | 84×28 · 104×33 · 115×43 · 106×30 | 115 (02) |
| 서리탄 frost-shot | 128×64 · 0.5/0.5 | 83×27 · 88×36 · 117×43 · 104×33 | 117 (02) |
| 중립 베기 neutral-slash | 128×96 · 0.5/0.5 | 75×33 · 108×63 · 113×67 · 104×51 | 113 (02) |

바닥 4계열은 내용이 root 아래 25~44px · 위 72~109px — root가 바닥 타원 가운데라 발 자리에 그대로 놓는다.

**크기 환산 (골편·9계열 선례 방식)**: 예전 클립의 보이는 폭 = audit(`2026-10-31-skillfx-audit/skillfx-inventory.csv` 「크기w칸」 — 메이플 클립 가장 큰 장 px ÷ 100 × 코드 배율)을 그대로 두고, 새 그림 내용 폭(위 최대)이 그 폭이 되게 배율을 정했다: `새 배율 = 예전 배율 × (예전 폭 ÷ 예전 배율) ÷ (새 내용 폭 / 100)`. 예전 배율에 반경이 들어 있는 자리(폭탄 BombRadius · 성찬 반경 · 독안개 반경)는 그대로 비례한다.

| 자리 | 예전 배율 → 보이는 폭 (audit) | 새 배율 | 새 내용 (칸) |
|---|---|---|---|
| 해골 폭탄 (R 1.6) | 0.75 → 3.25 (P38) | 1.78 | 3.25×2.18 · 캔버스 3.41 |
| 제물 폭발 | 0.45 → 1.95 (P36) | 1.07 | 1.95×1.31 |
| 성찬 치유 (반경 4) | 1.1 → 1.46 (P35) | 0.80 | 1.46×1.01 |
| 죽음의 파동 | 2.6 → 6.37 (P29) | 2.62 | 6.37×4.01 (판정 지름 7) |
| 독안개 (반경 1.3) | 1.25 → 2.68 (P12) | 1.10 | 2.68×1.47 |
| 저주 불꽃·불꽃 마법사 | 0.45 → 1.38 (P06) | 1.2 | 1.38×0.52 |
| 서리 혼·서리 마법사 | 0.6 → 1.88 (P08) | 1.6 | 1.87×0.69 |
| 서리 파편 | 0.4 → 1.26 (P09) | 1.07 | 1.25×0.46 |
| 마법사 거인 화염 구슬 | 0.8 → 2.45 | 2.13 | 2.45×0.92 |
| 플레이어 평타 | 0.55 → 1.18 (P01) | 1.045 | 1.18×0.70 |
| 소환수 베기 | 0.25 → 0.54 (S05) | 0.475 | 0.54×0.32 |
| 몬스터 베기 (일반·brute) | 0.45/0.72 → 1.0 (B21) | 0.855/1.368 | 0.97/1.55 |

## 3. 연결 (`connect-changes.csv`)

`Common/GameConst.mlua` 154~163행에 7자리(「|」 4장)와 `FxSkillC7FrameMs = 100`(코덱스 proposed_interval_ms)을 두었다. 모든 새 길은 자리가 `""`이면 예전 메이플 원본 연출로 돌아간다 (`tests/quality/skillfx_c7.lua`에서 자리마다 비워 확인). 예전 RUID 속성(`SkillEffects.FxBlast` 등 · `MageBolts.FxFlameShot` 등 · `GameConst.FxSlash`)은 되돌림용으로 그대로 둔다.

| 계열 | 자리 | 연결 지점 (파일:행) | 전 → 후 |
|---|---|---|---|
| 뼈 폭발 | FxSkillBlast | `ShadowUnit.mlua:939` BombExplode · `UndeadSystem.mlua:639` BoneOffering 제물 → `SkillEffects.mlua:383` C7Clip(서버) → `:394` C7Fx(Multicast) | 메이플 피 폭발 ClipFx(+0.5/+0.4 · 1.2/0.8초) → 4장 한 번 + 0.2초 유지 + 0.25초 옅어짐 · 발 자리 · 층 1 |
| 성찬 치유 | FxSkillOfferingHeal | `UndeadSystem.mlua:638` → C7Clip "offering" | 메이플 초록 고리(17장 중 0.9초) → 4장 0.75초 · 시전자 발 · 반경 원(갈래 E)은 그대로 |
| 죽음의 파동 | FxSkillDeathWave | `SkillEffects.mlua:2322` DeathWave → C7Clip "wave" | 메이플 마법진 폭발 2.6배 0.6초 → 4장 0.75초 · 시전자 발 |
| 독 구름 | FxSkillPoisonCloud | `SkillEffects.mlua:924` PoisonMist → C7Clip "poison" → Util.PlayFramesLoop | 메이플 독구름 반복 → 4장 0.1초 반복 · 지속 시간 동안 · 조준점 바닥 |
| 불꽃탄 | FxSkillFlameShot | `MageBolts.mlua:119` Configure fire (캐릭터 저주 불꽃 · 불꽃 마법사 공용) · `ShadowUnit.mlua:1532` 마법사 거인 화염 구슬 · `Projectile.mlua:300` MirrorSkin · `:313` FrameSec · `:303` ViewAngleOffset | 메이플 불꽃 화살 한 장 → 4장 비행 중 0.1초 순환 · 왼쪽 FlipY · Tint 유지 |
| 서리탄 | FxSkillFrostShot | `MageBolts.mlua:125` cold (서리 혼 · 서리 마법사) · `:131` cold_shard (서리 파편) · 같은 Projectile 길 | 메이플 서리 화살 한 장 → 4장 순환 · 왼쪽 FlipY · Tint 유지 |
| 중립 베기 | FxSkillSlash | `PlayerAttack.mlua:555` PlaySwing · `ShadowUnit.mlua:1670` SwingFx · `MonsterAttack.mlua:739` SwingFx → `Util.mlua:726` SkillSlashFx (클라이언트) | 메이플 베기 궤적(FlipX = 오른쪽) → 4장 한 번 0.4초 · 왼쪽은 가로 배율 음수 · rot·Tint 그대로 · 층 6 |
| 공통 | 미리 불러 두기 | `SkillEffects.mlua:304~308` OnBeginPlay | 7자리 첫 장 |

명중 효과는 9계열 `FxSkillHitFire/Frost`가 이미 있어 바꾸지 않았다 (Configure의 HitKind 그대로). 장 넘김은 모두 클라이언트(Util.PlayFramesMs·PlayFramesLoop · Projectile.AdvanceFrame) — 서버 타이머 추가 0 · Multicast는 예전 ClipFx 자리를 1:1로 바꾼 C7Fx뿐(통신 횟수 같음). `[VRF]` 계열당 한 줄(출시 서버 끔): `c7 fx kind=blast|offering|wave|poison`(내 시전만) · `c7 projectile school=fire|cold|cold_shard`(서버 · 속성마다 처음 한 번) · `c7 slash player|summon|monster`(부르는 쪽마다 처음 한 번).

### 판단 근거

- **자리(발)**: 바닥 4계열 피벗 0.5/0.25는 코덱스 root(그림 속 지면 원점)다. 예전 메이플 클립은 가운데 피벗이라 발 + 0.2~0.5칸에 놓았는데, 새 그림을 그 높이에 두면 지면 원점이 떠 버린다 → C7Clip은 발 자리를 받고, 예전 높이(oldDy)는 빈 자리 되돌림 길에서만 더한다.
- **층**: 코덱스 합성판의 기본이 「A1-A4-behind」(배우 뒤)이고 앞쪽은 「foreground-stress」 시험판이라 바닥 4계열은 MapLayer0 1(바닥과 몸 사이 · 원형 판·문장과 같은 층)로 두었다. `SkillEffects.C7Orders` 한 줄로 바꿀 수 있다 (메이커에서 다시 볼 값). 베기는 예전처럼 몸 앞(6).
- **시간**: 코덱스 제안 4장 × 100ms 그대로. 한 번 계열(폭발·성찬·파동)은 4장 0.4초만이면 예전 클립(0.6~1.2초)보다 짧아 「짧아서 안 보임」 지적을 되풀이하므로 마지막 장을 0.2초 잡고 0.25초 옅어지게 했다(합 0.75초 · `C7HoldSec`·`C7FadeSec`). 베기는 자주 나오는 평타라 0.4초 그대로(예전 약 0.36초).
- **투사체 진행 각 (지시 밖 수정 · 메이커 확인 필요)**: 투사체 모델(`Models/Effects/Projectile`)의 `AngleOffset` 값이 180(왼쪽을 보는 메이플 그림용)이라, 오른쪽 기준 그림을 그대로 넣으면 진행 방향 반대로 그려지고 `FaceMirror`(왼쪽으로 날 때 FlipY) 규칙도 거꾸로 맞는다. 새 `Projectile.ViewAngleOffset()`이 MirrorSkin 그림이면 0을 돌려주고 Launch(서버)·클라이언트 그림 두 곳 모두 이 값을 쓴다. 같은 이유로 **이미 연결된 골편 투척·창 골편·폭풍 골편·의식 3기 뼈 화살도 지금까지 거꾸로 날았을 가능성이 크다**(코드에서 `AngleOffset`을 0으로 바꾸는 곳은 ShadowUnit 중립 뼈 화살·MonsterAttack 화살 두 곳뿐 · grep). 이 수정으로 그 계열도 함께 0이 된다 — 메이커 회차에서 골편 투척 방향을 같이 본다.
- **Tint**: 지시대로 속성 색이 있던 자리(불꽃 1·0.75·0.55 · 서리 0.85·0.95·1 · 베기 3종)는 그대로 둔다. 불꽃탄은 그림 자체가 구리빛이라 Tint를 곱하면 한 단 더 짙어진다 — 메이커에서 볼 값.
- **베기 거울**: Util.PlayFramesPlan에 FlipX 옵션 칸이 없어 망령 잔상(9계열) 선례대로 가로 배율 음수로 거울을 만든다. rot은 예전 계산 그대로(예전 그림은 왼쪽을 봐서 오른쪽일 때 FlipX → 새 그림은 왼쪽일 때 거울 · 같은 rot이면 같은 방향).
- **크기 기준**: audit 「크기w칸」은 메이플 클립의 캔버스(가장 큰 장) 기준이라 실제 보이는 폭보다 클 수 있다. 골편·9계열 선례와 같이 그 값에 새 그림의 알파>16 내용 폭을 맞췄다 → 새 그림이 예전보다 「보이는 양」은 같거나 조금 크다.

## 4. 미연결 계열 · 바꾸지 않은 길

- 미연결 계열 없음 — 7계열 모두 부르는 곳이 있다.
- 그림 칸이 차 있어 실행되지 않는 되돌림 전용 길은 그대로 둠: `SkillEffects.HexBurst`·`FrostShatter`의 `ClipFx(FxFlameShot/FxFrostShot)`(FxSkillHexBurst·Shatter가 빌 때) · 거인 `meteor_fall` 그림 없을 때 `ClipFxLocal(FxFlameShot)` · 거인 `spin/flurry` 그림 없을 때 `FxSlash`.
- `DepthDirector.PoolFxRuid`(독구름 RUID · 10-11부터 안 씀)는 손대지 않음.

## 5. 검사

- 새 `tests/quality/skillfx_c7.lua` **269개** — 7자리 × 4 RUID · 32자리 hex · art_sprites 28행(이름·effect·크기·RUID·순서) · RUID 중복 0 · 100ms · 내용 폭 표 = 실측 · 새 보이는 폭 = 예전 audit 폭(자리 12곳) · 반경 비례 · C7Clip 채움(발·새 배율)/비움(예전 RUID·높이·배율·시간) 4계열 · C7Fx 한 번(유지·옅어짐·층·맵 부착)/독 구름 반복 · 다른 맵·다른 시전자·출시 [VRF] · 투사체 MirrorSkin·0.1초·보정 0·FlipY · 예전 메이플(보정 180) 반례 · Configure 3분기 크기·Tint·HitKind·빈 자리 · 베기 크기·거울·rot·Tint·빈 자리 · 미리 불러 두기 · 부르는 곳 grep · 직접 ClipFx 잔여 0 · 타이머 없음 · [VRF] 한 줄.
- 기존 검사 갱신: `mage_school.lua`(C7 칸을 비운 채 예전 외형·속도 검사 그대로 · `C7Log` 소스 추가 · 99개) · `skillfx_nine.lua`(`C7Log` 소스 추가 · 595개 그대로).
- `quality-all.log` 전체 그룹 통과 · `npm-test.log` 18/18 통과.

## 6. 메이커 회차에서 볼 장면

1. **투사체 방향**: 저주 불꽃·서리 혼·서리 파편·불꽃/서리 마법사·거인 화염 구슬이 오른쪽·왼쪽·대각선으로 쏠 때 머리(불씨·결정)가 진행 방향인지 · 왼쪽에서 위아래가 뒤집히지 않는지 · 4장 0.1초 순환 · 쏜 사람/다른 사람 화면. **골편 투척·의식 3기 화살도 같이** (ViewAngleOffset 수정으로 바뀜).
2. **불꽃탄 Tint**: 구리빛 그림 × 주황 Tint가 너무 짙지 않은지 (짙으면 Configure Tint를 흰색으로).
3. **해골 폭탄·제물 폭발**: 발 자리 지면 원점 · 3.25칸 크기가 판정(반경 1.6)과 맞는지 · 층 1(몬스터 뒤)로 충분히 보이는지 (안 보이면 C7Orders blast=6).
4. **뼈 성찬**: 치유 고리 1.46칸 + 반경 원 · 몸 뒤 층.
5. **죽음의 파동**: 6.37칸 파동이 판정 지름 7칸과 어울리는지 · 0.75초 길이.
6. **독안개**: 4장 반복이 4초 이상 끊김 없이 이어지는지(첫 장 0.1초 · 장 바꿈 겹침 0.03초) · 몬스터 뒤 층 · 끝날 때 옅어짐 없음.
7. **베기**: 플레이어 평타·소환수·몬스터(적색) — 왼쪽 거울(음수 배율 + rot)이 제 방향인지 · 무채색에 Tint가 예전 색과 같은 느낌인지 · 크기.
8. 처음 쓰는 순간 늦게 뜨는 장이 없는지 (자리마다 첫 장만 미리 불러 둠).
