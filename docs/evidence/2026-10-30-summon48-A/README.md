# 48 갈래 A — 소환·인구 (10-30 · Opus 실행 · 메이커 미검증)

기반 main `ca607845` · 브랜치 `wip/s48-A-summon` · 결정 정본 `summon48-review-decisions.json` (Q2 C2 · Q3 · Q6 · 가드).
메이커 MCP는 쓰지 않았다(부모 통합 담당). 아래 「통과」는 모두 오프라인 검사다 — 실제 입력 흐름 검증은 maker_queue로 넘긴다.

## 바뀐 것

| 절 | 내용 | 파일 |
|---|---|---|
| 48-1 진화 | `raise_skeleton` 효과 레벨(장비 +스킬 포함 · Q6) `skelEvolveRank`(8) 이상 → 기본형 = 방패 해골 · 받는 피해 `skelEvolveGuardPct` + `skelEvolveGuardStep` × (단계-1) = 20/25/30 (단계 효과 레벨 8 · `skelEvolveGuardRank2` 14 · `skelEvolveGuardRank3` 20) · 도발 · 생명 x1.1. 기록 `form="shield"` → 거인 투표 키·편성 미리보기·동기화가 그대로 방패로 읽는다 | US `ApplySkeletonForm` · `BaseForm` · `EvolveStep` · `EvolveGuard` · `PlanFor` · `PreviewFrom` |
| 48-1 스냅샷 | 이미 선 해골은 일으킨 순간의 기록 그대로 (진화해도 재생성·처형 없음 · 다음 일으키기부터 방패) | 회귀 「rank 7 → 8」 |
| 48-1 변이 | `FormOrder("skeleton")` = 대검 · 쌍칼 · 옛 저장 희망 `shield=N`은 `ParseHope`가 버리고 그 몫은 기본형(진화 뒤 방패)으로 선다 · `FormName` 「방패 해골」 · `ShownForms` · `EvolveRank` | US |
| 48-1 쌍칼 | 후열 사냥: `FindNearestMonster` 순서 ① 저 적을 ② 주인이 고른 적 ③ **쌍칼 사냥** ④ 지금 교전 ⑤ 가까운 적. 후보 = 주인 경계 5.5칸 안 · `Arch == "ranged"` · 보스(등급 3) 제외 · 시야 · 가장 가까운 것 · 같은 대상 쌍칼 `twinHuntCap`(2)기까지. 돌아오기 = 쓰러짐(dead) · 주인 교전 범위 7칸 밖(range) · `twinHuntStuck`(4)초 동안 공격 거리 안에 닿지 못함(stuck) → 그 대상 `twinHuntBan`(4)초 금지. 수동 조준이 잡으면 사냥을 놓는다(manual). 판단은 순수 함수 `UndeadSystem.TwinHuntDecide` | SU `FindNearestMonster` · `TwinHuntPick` · `TwinHuntYield` · `TwinHuntSpeedMult` · US `TwinHunt*` |
| 48-4 인구 | `Giants[uid]` = 거인 목록(비면 nil) · 상한 `riteGiantMax`(2) · 종류별 정원 보존 + 혼합 둘째 허용(Q3) · `EndGiant(epoch)` 거인별(0 = 모두) · 갈라질 때 정원은 남은 거인의 합쳐진 넷까지 센다 · `OnUnitDied`/`DismissRecords` 목록 · `GiantReserved` 삭제(호출처 없음 · 전사만 세던 함정) | US |
| 48-4 추가 소환 없음 | 정원이 거인 몸·합쳐진 넷뿐이라 교체할 개체가 없으면 `PlanNext.blocked` → `Raise`가 혼·마나 쓰기 전에 거절(「정원이 모두 거인에 들어가 있습니다」 · 승인 전 후보) · `SteadyRoster`도 같은 규칙 | US |
| 48-4 상태줄 | 「해골 n/max · 마법사 n/max」에 합쳐진 넷을 종류별로 더함 · 거인 이름 「방패 거인 · 마법사 거인」 · `MinionCounts`는 몸 둘 다 뺌 · `GiantKind` 쉼표 목록 「shield,mage」 · 덤: 거인 + 맛보기 그림자가 함께면 거인 이름이 「그림자(잠시)」로 덮이던 옛 줄 고침 | US `RefreshSummary` |
| Q2 C2 | 5기만 `riteGiantCharges`(2)칸 · 한 번에 한 칸씩 직렬 충전 · 칸 길이 = `riteGiantCd`(30) × `PlayerStats.GetCastCooldownMult`(예전 재사용 계산 그대로). 하위 단계(1기 bone_rite · 2기 rite_whirl · 3기 rite_arrow) 덮개와 섞지 않고, 저장하지 않는다(메모리만 · 재사용 덮개와 같음). `StartGiant`가 서기 전에 칸을 확인하고 선 뒤 한 칸 쓴다 | US `GiantCharge*` |

### 초기 버스트와 장기 가동률 (Q2)
- 장기 가동률: 예전과 같다 — 칸 길이(시전 속도 0%면 30초)마다 거인 하나. 지속 20초라 평균 서 있는 거인 수 ≈ 0.67 (예전 그대로).
- 초기 버스트: 모아 둔 두 칸으로 연달아 둘 (정원 10 이상 · 재료 10). 두 칸을 다 쓰면 한 칸씩 30초 · 60초 뒤에 찬다(동시에 둘이 차지 않는다).
- 방 이동(심연·귀환) 뒤에는 서버가 바뀌어 칸이 가득 찬 상태로 시작한다 — 지금 재사용 덮개(ReadyAt)도 같은 성질이라 새 구멍은 아니지만 메이커에서 확인 필요.

## 되돌릴 수 있는 선택 (추천 + 근거)
1. 「추가 소환 없음」을 거인 하나일 때도 적용(정원 5 · 거인 1 · 전사만 → 막힘). 근거: 기획서 3-1 「거인 몸·넷은 무너뜨리지 않음 → 추가 소환 없음」과 같은 규칙이고, 예전처럼 정원을 넘겨 세운 뒤 갈라질 때 잘라내면 혼만 낭비된다.
2. 쌍칼 「4초 동안 한 번도 못 침」 = 4초 동안 공격 거리(+0.2칸) 안·시야에 들지 못함. 근거: 타격 시점(OnAttack)은 B 소유라 손대지 않았다. 닿으면 대개 친다.
3. 5기 충전 칸 수 표시용 동기화 속성은 만들지 않았다 — 클라이언트 예측은 SkillBook이 `rite_giant` 덮개에 `GiantChargeCover`를 걸면 지금 `CooldownLeft`로 그대로 된다.

## 검사 (C 브랜치 `e9639aae`의 csv · SkillBook · SkillWindow · skills.lua · check_data · sim을 작업 트리에 임시로 겹쳐 통합 상태로 실행 · csv·생성물은 커밋 안 함)
- `quality-integrated-with-C.log`: roster 120/120 · 48 A 10케이스 · items · items_reforge · journal · skills(C) · mobile_input 177/177 · dps 통과. **giant_moves 실패**(basic s1 — C csv가 기본 거인 기술을 비움 · RiteGiantMoves/giant_moves는 B 몫 · C 로그도 같은 실패).
- `npm-test-integrated-with-C.log`: 15/15 통과(거인 끝 레벨 41·68·90 포함).
- `sim-giant-check.log`: `--giant-check` 끝 레벨 41·68·90 그대로(+8 · +13.5 · +20 · +26). A 변경은 시뮬 입력이 아니다(확인만).
- `check_scripts.log` 0건 · `check_data.log` 0건(통합 상태) · `mlua-lsp.log` UndeadSystem · ShadowUnit 진단 0.
- 이 브랜치만 단독으로는 config 줄(riteGiantMax · skelEvolve* · riteGiantCharges · twinHunt*)이 없어 check_scripts가 `_GameData` 멤버 없음을 낸다 — C csv + 아래 csv 요청 5줄과 함께 통합해야 한다.
