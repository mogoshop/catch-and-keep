# 그림자 기본 한도 A안 — 메이커 검증 (2026-11-01 21:47~21:56)

대상: 미커밋 작업트리(config `shadowFullLevel`·`shadowEarlyDeployLimit` 삭제 · `deployBase` 1 · ShadowCommander `GetDeployLimit`/`LogDeployLimit` · GuideCoach 카드 6 · GuideWindow · SelfTest `deploy base`).
메이커: PC(FHD). maker_save 안 함 · 코드 수정·커밋 안 함.

## 절차
1. stop(이미 편집) → 5초 → .mlua 6개 touch → refresh 1회 → build 로그 358줄: **Error 0** (Warning 103 · Info 255, 기존 종류 LWA-1110/1111).
2. play → `[SelfTest] 통과 407 / 실패 0` (406→407, `deploy base` 포함 · Error 줄은 기존 의도된 `boom`).
3. 캐릭터 1 「인꾸」 Lv17 선택 → 솔로 방(game:s1bc8d9d34e5) 마을. 이 캐릭터는 의뢰 영구 보상 `quest=1` 때문에 원래 한도 2 → 서버에서 `PlayerQuest.DeployBonus=0`으로 잠시 내려 한도 1을 만듦. 보관 59기라 시험 그림자 추가는 필요 없었음.
4. 이후 단계는 서버 `maker_execute_script`로 상태(레벨·노드·지정·카드)만 바꾸고, 소환 요청은 **실제 키**(maker_keyboard_input Z / S)로 냄. 맵 이동은 서버 `PlayerTravel:Go`(웨이포인트 창 클릭 대신 · 소환 경로와 무관).

## 기대 / 실측
| # | 상황 | 기대 | 실측 | 판정 |
|---|---|---|---|---|
| 3 | Lv17·노드 0·quest 0, 지정 2, Z 두 번 | `node=0/0 … -> 1` ×2, 1기만, 두 번째 「그림자 소환 한도 1기에 도달했습니다」 | `lv=17 node=0/0 equip=0 cap=0 quest=0 deployed=0 -> 1` 소환 1 → `deployed=1 -> 1` 소환 없음. 화면 1기(01). **두 번째 Z에 알림 없음**(fail 소리 로그도 없음) | 한도 통과 · 알림 **불일치** |
| 3b | 같은 한도, 사냥터에서 스킬 칸 S(그림자 소환 스킬) | 거절 알림 | `deployed=1 -> 1` + `shadow_summon 효과 없음 → 마나·쿨다운 보존` + 화면 「그림자 소환 한도 1기에 도달했습니다」(04) | 통과 |
| 4a | Lv11 + deploy_expand 1랭크, Z | `node=0/1 -> 1` | `lv=11 node=0/0 … deployed=1 -> 1` (한도 1, 소환 없음) | 한도 통과 · 로그 「찍음」 칸 **불일치** |
| 4b | Lv12 + 1랭크, Z | `node=1/1 -> 2`, 2기 | `lv=12 node=1/1 equip=0 cap=0 quest=0 deployed=1 -> 2` 소환 → 화면 2기(02) | 통과 |
| 5 | legion 카드 안 봄 · 지정 1 · 보관 59 · Lv12+노드 | 안내 줄 + `guide card shown legion` | `guide step=legion` · 안내 줄 「함께 다니는 그림자가 2기로 늘었습니다 — 그림자(H)에서 「소환 지정」을 더 해주세요 (지금 1기)」 · `guide card shown legion` · 카드 「군단이 커졌습니다 / 이제 그림자를 2기까지 함께 거느릴 수 있습니다. …」(03) | 통과 |
| 6 | 지정 2·소환 2 → 노드 빼서 한도 1 → 맵 이동 | `shadows redeployed 1/2`, 보관 불변, 오류 0 | `shadows redeployed 1/2` · storage 59→59 · Error 0 · 남은 1기는 Wanted에 대기 · 지정 2개는 그대로(옛 저장 과다 지정 유지) | 통과 |

## 발견 (코드 수정 안 함 — 그대로 보고)
1. **Z 키(및 명령 버튼 `RequestDeploy("")`) 한도 거절이 조용함.** `ShadowCommander.RequestDeploy`는 `DeployNext()`가 0이어도 `DeployBlockReason()`을 알리지 않는다. 알림은 스킬 칸 시전(`SkillEffects.SummonShadow`)에서만 나온다. 이번 변경 이전부터 같은 구조(회귀 아님)지만, 한도가 1로 줄어 Z를 눌러도 반응 없는 순간이 늘어난다.
2. **`LogDeployLimit`의 `node=효력/찍음` 둘째 값이 「찍은 랭크」가 아님.** `GetSkillLevel` → `SkillBook.GetPowerLevel` → 노드는 이미 `NodeUsable`로 걸러 돌려주므로 Lv11에 1랭크를 찍어도 `0/0`. 찍은 랭크는 `book:GetLevel("deploy_expand")`여야 `0/1`. 한도 계산 자체는 맞다(로그 표시만 문제).
3. 「인꾸」(Lv17)는 의뢰 영구 보상 `DeployBonus=1`로 한도 2인 상태(정상 동작 · 노드 없이 2기). 저장된 지정이 3기(한도보다 많음)지만 소환은 한도까지만.

## 시험으로 바꾼 상태 · 되돌림
- 바꾼 것: `PlayerQuest.DeployBonus` 1→0, `SkillBook.Levels.deploy_expand` 0→1→없음, `PlayerStats.Level` 17→11→12, `SkillBook.Slots` S칸에 shadow_summon, `ShadowOwner.Assigned`, `PlayerSave.GuideCards`에서 legion 제거(카드가 다시 저장), 맵 town→wasteland.
- 되돌림(서버, 확인 로그 `[T] RESTORE`/`[T] FINAL`): Level 17 · quest 1 · deploy_expand 없음 · Slots `bone_shard,,raise_skeleton,` · Assigned `_28,_1,_12`(이 방의 원래 지정) · 소환 0 · Wanted 비움 · 마을(웨이포인트 자리 -5.5,1.2)로 이동 · GuideCards에 legion 있음(순서만 맨 뒤로), legion_open 없음(원래와 같음). 경험치 55935/89759 그대로.
- 남는 차이: GuideCards 안 legion 순서, 마을 안 위치(웨이포인트 자리). 게임 자체 자동 저장이 DataStorage에 쓸 수 있음(메이커 저장 maker_save는 안 함).

## 못 한 것
- Lv12 미만에서 장비 `BonusDeploy`·세트 `BonusShadowCap` 경로는 별도 확인 안 함(로그 칸은 0으로 출력 확인).
- 카드 6 뒤 그림자 창을 열었다 닫아 `legion_open`이 찍히는 흐름은 안 봄.
- 모바일 명령 버튼 소환 경로는 확인 안 함(PC만).

## 메이커 최종 상태
편집 모드(map01) · PC(FHD) · maker_save 없음.

## 파일
- key-lines.txt — 로그 원문
- 01-limit1-z-twice-one-shadow.png · 02-node1-lv12-two-shadows.png · 03-card6-legion.png · 04-old-save-redeploy-1of2-skill-warn.png · 05-z-key-limit-silent.png
