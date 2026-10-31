# 스킬 효과 통일 공정 5종 전체 100장 업로드·교체 (2026-10-31)

코덱스 통일 공정 납품 `assets/codex-skill-fx-v3/unify-full5-20261031`(논리 5종 · 물리 10묶음 × 10장 = 100장)을 월드 리소스로 올리고, 기존 슬롯 5곳(원형 판은 6종)의 RUID를 교체했다. 큰 캔버스 재제작이라 **장수·장별 ms·배율**을 모두 다시 맞췄고, 층은 그대로 두었다. 메이커 도구는 쓰지 않음 (확인은 액트 1 회차). 선례: `2026-10-31-skillfx-unify-corrections` · `2026-10-31-skillfx-C7` · `2026-10-31-skillfx-nine88`.

근거: `skillfx-unify-full5-delivered.json`(PNG 100 · zip sha256 `3d9d1095…527a` 다시 계산해 일치) · 결정 `claude-fx-unify-5go-shard-revise-2108.txt`(샘플 기하 유지 · 배율 제안 0.85 몸 뒤 · 1회 재생 = 시작 2·정점 2·잦아듦 4~6, 지속 = 반복 6~8 + 잦아듦 2).

## 1. 업로드 (`upload.json` · `upload-res.log`)

1. 올리기 전 `asset_list_group_resources`(OJYYQ · `fx-unify-`)로 확인: 그룹에는 보정 재출력 25장만 있고 5종 전체 키는 0장 → 중복 없이 100장 전부 올림.
2. `assets/`는 읽기만. `resource-mapping.csv` 100행을 scratchpad 팩으로 복사: 원본·사본 sha256 = 표 sha256 · PNG 헤더 크기 = 표 크기 = `resource-properties.csv` 크기 · 모두 RGBA(색 형식 6) · 표 피벗 = properties 피벗 — **오류 0**.
3. 피벗(코덱스 표 그대로): 파동·희생·원형 판 6종 0.5/0.5 · 폭발 0.5/0.1666667(표의 `0.16666666666666663` · 지면 원점 192,240) · 독안개 0.5/0.25(지면 원점 192,240).
4. `.mcp.json`을 워크트리에 잠시 복사 → `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **100/100**. RUID를 받은 직후 같은 루프에서 pivot·filter Point·wrap Clamp(처음 불리기 전). 끝나고 `.mcp.json` 삭제.
5. `asset_get_group_resource_metadata_bulk`(50 GUID × 2회) 대조: displayName = key · pivot · Point · Clamp · sprite/object · resultCode 0 — **100/100 일치 · RUID 중복 0**.
6. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **100행** 추가. 옛 행(fx-C 폭발·파동·독 구름 12 · fx-B 희생 8 · fx-B 원형 판 24)은 되돌림 기록으로 남겼다.

## 2. 교체 (`connect-changes.csv`)

`Common/GameConst.mlua` 값만 바꾸고 각 줄 주석 끝에 `옛: <옛 RUID들>`을 남겼다. 장별 ms는 기존 관례(`FxSkillSpearHitMs`)처럼 ms 문자열 상수로 넣었고, **ms 개수 = 그 자리 장 수일 때만 새 길**이다 — 슬롯을 옛 4장(8장) 판으로 되돌리면 예전 길(고른 간격 + 유지 + 옅어짐)이 그대로 돈다(검사로 확인). 빈 슬롯 폴백(예전 메이플 원본·입자)·[VRF]·층은 그대로.

| 자리 | 장 | 캔버스 | 내용 폭 (알파>16 · 10장 중 최대) | 배율 전 → 후 | 보이는 크기 (그대로) | 장별 ms | 전체 길이 전 → 후 | 층 |
|---|---|---|---|---|---|---|---|---|
| FxSkillDeathWave | 4 → 10 | 256² → 768×512 | 243 → **743**px (03) | 2.621 → **0.857** | 가시 끝 폭 6.37칸 (판정 7칸) | 70×4 · 100·110·120·130·140·150 | 0.75 → **1.03**s | 1 |
| FxSkillBlast 해골 폭탄 | 4 → 10 | 192² → 384×288 | 183 → **335**px (03) | 1.776 → **0.970** | 3.25칸 (BombRadius 1.6 비례) | 〃 | 0.75 → **1.03**s | 6 |
| FxSkillBlast 제물 폭발 | 〃 | 〃 | 〃 | 1.066 → **0.582** | 1.95칸 | 〃 | 0.75 → **1.03**s | 6 |
| FxSkillPoisonCloud | 4 → 10 | 256² → 384×320 | 244 → **342**px (03) | 1.098 → **0.784** | 2.68칸 (반경 1.3 비례) | 반복 0~7 ×100 · 잦아듦 130·150 | 지속 시간 → 지속 시간 (5초 = 5.03s) | 1 |
| FxSkillSacrifice | 8 → 10 | 128² → 448² | 116 → **424**px (03) | 3.103 → **0.849** | 지름 3.6칸 (반경 1.8) | 70×4 · 100…150 | 0.85 → **1.03**s | 1 (배우 뒤) |
| FxSkillCurseCircles ×6 | 4 → 10 | 128² → 384² | 반경 아래 표 | r=1.5: 2.56 → **0.84** 안팎 | 보이는 반경 = 저주 반경 | 반복 0~7 ×100 · 잦아듦 130·150 | 1.00 → **1.38**s | 1 (바닥) |

원형 판 보이는 반경(`SkillEffects.CurseCircleFitPx` · 가운데에서 알파>16 가장 먼 화소 · 10장 중 최대): amp 58.5 → **179.5** · weaken 56.7 → **183.8** · terror 62.2 → **186.1** · thorn 57.7 → **180.5** · lifetap 55.5 → **186.6** · resist 58.7 → **201.7**(00번 장 문양 끝). 배율 = 반경 ÷ (반경px/100)이라 r=1.5에서 0.744(resist)~0.836(amp).

상수 변경: `SkillEffects.C7FitPx` blast 183→335 · wave 243→743 · poison 244→342(성찬 183 그대로 · 옛 값은 주석) · `SacrificeContentPx` 116→424 · `CurseCircleFitPx`(위) · 새 `CurseCircleLoopSec 0.8` · GameConst 새 `FxSkillBlastMs`·`FxSkillDeathWaveMs`·`FxSkillPoisonCloudMs`·`FxSkillSacrificeMs`·`FxSkillCurseCircleFrameMs`·`FxSkillUnifyReleaseN 2`. 보이는 크기 공식(`C7Scale` = 예전 배율 × 예전 폭 ÷ 새 내용 폭)은 그대로라 반경이 커지면 같은 비율로 커진다.

### 재생 방식

- **한 번 계열(파동·폭발·희생)**: `Util.PlayFramesMs`에 장별 ms를 그대로 — 잦아듦 6장이 그림 알파에 들어 있어(코덱스 「last_frame_then_hide」) 마지막 장 150ms 뒤 바로 지운다(hold·fade 0). 희생은 새 Multicast `SkillEffects.FramesFxMs`(FramesFx의 장별 ms판).
- **지속 계열(원형 판·독안개)**: 새 `Util.FramePlanLoopMs`(순수 계산) + `Util.PlayFramesLoopMs` — 반복 0~7을 loopSec 동안(장 단위 · 적어도 한 바퀴) → 잦아듦 8·9 한 번 → 마지막 장 옅어짐(예전 「마지막 장 페이드」 `FrameFadeSteps`와 같은 방식 · 메테오 잔불 → 옅어짐 구조). 재생은 기존 `PlayFramesPlan`(장마다 클라이언트 SetTimerOnce · 시작 시각 기준).
  - 독안개: loopSec = 지속 − 잦아듦 0.28 − `C7FadeSec` 0.25 → 전체가 지속 시간에 맞는다(5초면 반복 45장 → 5.03s).
  - 원형 판: loopSec = `CurseCircleLoopSec` 0.8(한 바퀴) → 0.28 → `CurseCircleFadeSec` 0.3 = 1.38s.
- 서버 타이머 추가 없음(C7Clip·ShadowSacrifice는 그대로 Multicast 한 번). 미리 불러 두기는 슬롯의 모든 장을 읽는 기존 길(`SkillEffects.OnBeginPlay`)이라 새 100장이 그대로 들어간다(검사 확인).
- 골편·화살(보강 샘플 대기)·성찬 치유(offering C 4장)는 건드리지 않음.

## 3. 검사

- `tests/quality/skillfx_c7.lua` **427개 통과**: 폭발·파동·독 구름 슬롯 = `fx-unify-*` 10장 이름·크기·순서 · 옛 fx-C 12행 남김·자리에서 빠짐·주석 · ms 개수 = 장 수 10 · 합 1030ms · 잦아듦 0.28s · 새 배율 0.857/0.970/0.582/0.784 = 옛 4장 판과 보이는 폭 같음 · C7Fx 한 번 계열 hold·fade 0 · 독 구름 loopSec 4.47 → 5.03s · 성찬은 예전 길 · **옛 4장으로 되돌리면 예전 길** · 미리 불러 두기 전 장.
- `tests/quality/skillfx_nine.lua` **860개 통과**: 원형 판 6종 × 10장 384² · 옛 fx-B 24행 남김·주석 · 연결 RUID 118 · 반경 표 = 실측 · r 1.5/1.95/2.4에서 원 끝 = 판정 원 · CurseShape = PlayFramesLoopMs(0.8 · 잦아듦 2 · 0.3 · 층 1) · 계획 1.38s · 옛 4장이면 예전 PlayFramesHold · 미리 불러 두기 60장.
- `tests/quality/skillfx_e.lua` **610개 통과**: 희생 10장 FramesFxMs(장 건너뜀 0 · 0.88s에 마지막 장 · 1.03s에 지움 · 424px = 3.6칸 · 층 1) · 옛 8장이면 예전 FramesFx(75ms × 8 + 옅어짐) · FramePlanLoopMs(한 바퀴·45장·짧은 loopSec·nil 반례) · PlayFramesLoopMs 실제 타이머 대역(1.38s · instigator 사라짐 · 계획 실패 시 PlayFramesLoop).
- `quality-all.log` = `python3 tests/quality/run.py --lua …` 전체 그룹 통과(exit 0) · `npm-test.log` **20/20 통과**.

## 4. 메이커 회차(액트 1)에서 볼 장면

1. **죽음의 파동**: 링 가운데가 시전자 발(피벗이 0.5/0.25 → 0.5/0.5로 바뀜 — 링이 발 위아래로 펼쳐지는지) · 가시 끝 폭 ≈ 6.37칸(판정 7칸 안) · 1.03초 한 번(시작 0.14 · 정점 0.14 · 잦아듦 0.75) · 몸 뒤 층 1.
2. **해골 폭탄·제물 폭발**: 지면 원점이 발에 닿는지 · 3.25칸 / 1.95칸 · 1.03초 · 몸 앞 층 6 · 잦아듦 끝장이 갑자기 끊겨 보이지 않는지.
3. **독안개**: 2.68칸(반경 1.3) · 지속 시간 동안 0~7 순환이 끊김 없이 이어지는지 · 끝에 잦아듦 2장 + 옅어짐으로 사라지는지 · 층 1.
4. **그림자 희생**: 보이는 지름 3.6칸 · 1.03초 · 배우 뒤 바닥.
5. **저주 원형 판 6종**: 보이는 반경 = 저주 반경(특히 resist가 문양 끝 때문에 한 단 작아 보이지 않는지) · 0.8초 반복 → 잦아듦 → 옅어짐 1.38초 · 바닥 층 1.
6. 처음 쓰는 순간 비는 장이 없는지 (미리 불러 두기 전 장) · [VRF] `c7 fx … unify=true total=…` · `frames fx ms n=10` · `curse shape … circleN=10`.
