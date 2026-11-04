# 노말 유니크 무기 「피해 +%」 상한 30% (11-05 사용자 결정)

사용자 원문: 「액트 1-1 퀘스트에서 유니크 무기가 나왔는데 피해가 70%네 너무쎄다 노말은 30%로 제한둬도될거같은데.」

## 사실 확인

- 액트 1에서 `unique:1` 보상이 있는 퀘스트는 2개: **2번 「가라앉은 지하실의 수장」**(Lv5 · `deploy:1,unique:1,choice:1`)과 6번 「묘지기 여왕」. 1번 「굶주린 굴」은 `skp:2,gen:3`(유니크 보장 없음). 「1-1」은 액트 1의 첫 유니크 보상인 2번으로 판단.
- 2번 대상 `morg`(썩은 사제 모르그)는 전용 유니크가 없어 `PickUnique(lv−3, "", lv, "")` 일반 풀로 떨어짐(PlayerQuest.TurnIn). Lv4~7에서 후보는 계열 1:1:1:1 → 소환 「망자의 손길」(낫 · dmgPct 80) / 저주 「속삭이는 가지」(40) / 영혼 「골편 반지」(반지) / 범용 「거지의 지팡이」·「해진 망토 신」 → **망자의 손길 25%**.
- 수치: `MakeUnique` → `AddModsRolled(mods, uniqueStatMul)` = 80 × gearMult 0.7 × uniqueStatMul 1.4 × roll(0.75~1) = **59~78**. 70%는 망자의 손길만 가능, roll ≈ 0.887~0.899(약 5% 구간). 속삭이는 가지 최대 39라 70은 불가.
- 유니크 뽑기 조건: `source`(빈 칸 = 어디서나 / 몬스터 id = 그 보스 전용) · `weight`(희귀도) · `tree`(계열 균등) · 베이스 요구 레벨. **난이도 조건은 없고**, 수치 굴림도 난이도와 무관했음(아이템 레벨 구간은 레어 접사만 영향).
- 퀘스트 보상 유니크와 드롭 유니크는 같은 `ItemData.MakeUnique`를 씀(드롭: LootSystem → Generate/MakeUnique, 보상: PlayerQuest.TurnIn · GenerateQuestSlotReward).

## 구현 (추천안)

- `data/difficulty.csv` 열 `uniqueDmgPctCap` 추가: 노말 30 · 악몽 0 · 지옥 0(0 = 제한 없음) → `tools/gen_data.cjs`가 `GameData.Difficulties[*].uniqueDmgPctCap`으로 생성.
- `ItemData.MakeUnique` 끝에서 `CapUniqueWeapon(item, UniqueDiff(ilvl))`: 베이스 부위가 `weapon`이고 dmgPct가 상한을 넘으면 상한으로 자름. 무기 밖(반지 등)·다른 수치는 그대로.
- 난이도 판정 `UniqueDiff(ilvl)` = max(몬스터 드롭 난이도 `DropDiff`, 의뢰 보상 난이도 `RewardDiff`, 아이템 레벨 구간 `TierOfLevel(ilvl)`). 아이템 문자열에는 난이도 흔적이 없어 **생성 시점의 드롭 맵 난이도(LootSystem.DropDiff)·의뢰 난이도(PlayerQuest.Diff)**를 씀. 플레이어 MaxDifficulty는 쓰지 않음(악몽을 연 캐릭터가 노말에서 얻는 것도 노말 규칙).
- `PlayerQuest.TurnIn`이 보상 생성 동안 `_ItemData.RewardDiff = self.Diff`, 끝나면(중간 return 포함) 0.
- 이미 가진 아이템은 다시 굴리지 않음(저장 이관 없음).
- 도감·툴팁 범위 표기: `JournalWindow` 아이템 도감은 이름·계열·「찾음」/「악몽부터」만, `NightmarePreview`는 처음 나오는 난이도만 계산 — 유니크 수치 범위(「피해 +59~78%」 같은) 표기가 없어 바꿀 곳 없음. 툴팁은 실제 굴린 값을 보여 줌.
- SelfTest 1줄 추가: 노말 ilvl10 망자의 손길 ≤ 30 · 악몽 ilvl50 > 30 (메이커 SelfTest 408/0).

## 메이커 확인 (01:08~01:12)

- MAKER-FREE 01:08:06 삭제 → 01:12:41 재생성. `maker_save` 안 함. 녹화·screencapture·osascript 안 씀.
- 빌드 Error 0 (Warning 110 · Info 266, 기존 종류). 런타임 LEA- 0. Error 2건은 SelfTest의 의도한 실패(GameEvents boom).
- 슬롯 3 핏빛망령 Lv4: 슬롯 고르기는 `_CharSelectWindow:PickSlot(3)` 직접 호출, 「입장」·「솔로 플레이」는 마우스 클릭. 메인 서버에서 저장 끔(01:08:58) → 솔로 방으로 옮기며 다시 불러와 `IsLoadSuccess=true`로 약 39초(01:08:58~01:09:37, 마을 대기 · 변화 없음) → 방 서버에서 다시 끔.
- 서버 스크립트로 당긴 것: 의뢰 상태 2번·보고 대기(Index=2 · State=2 · Diff=0), 무적, 오렌 곁으로 이동(PlayerTravel:Go). 소리 0(SetVolumes) 플레이 시작·방 이동 뒤.
- 실제 입력: Space로 오렌 대화 → 3쪽 넘김 → 「완료」 → 결산 판 「받기」(Space) → 「확인」(Space) → I 키 인벤토리.
- 함수 호출 대체: 가방 칸 선택(설명 보기)은 마우스 클릭이 칸 단추에 먹지 않아 `_InventoryWindow:OnBagSlot(6)` 호출.
- 결과: 보상 유니크 = 망자의 손길, 굴림 62 → **30** (`[VRF] unique dmgPct cap 망자의 손길 62 -> 30 (diff=0)`), 툴팁 「피해 +30%」 (after-3).
- 분포 200회: distribution.md.

## 대안 (구현 안 함)

| 안 | 내용 | 예상 영향 | 위험 |
|---|---|---|---|
| (a) 노말 퀘스트 보상 유니크 후보를 dmgPct 낮은 것으로 제한 | 2번 보상 풀에서 망자의 손길·혼을 거두는 낫·사신의 장난감 제외 | 퀘스트 보상만 약해짐(가지 29~39가 최대), 드롭 유니크는 그대로 59~78 | 소환 계열이 첫 유니크로 계열 무기를 못 받음(계열 균등 원칙 깨짐) · 드롭으로는 여전히 70%대 |
| (b) 노말 전체 유니크 수치 배율(gearMult/uniqueStatMul) 하향 | 예: 노말만 ×0.4 | 무기 피해뿐 아니라 생명·소환수·저항 등 모든 유니크 수치가 같이 줄어 30%대 | 유니크 특색(생명 +18, 소환수 +15%)까지 약해져 「유니크가 레어보다 세다」(10-10 QA) 원칙과 충돌 · 악몽 진입 시 체감 낙차 커짐 |

## 한계

- 상한에 걸리는 유니크는 노말에서 굴림 편차가 사라짐(망자의 손길·혼을 거두는 낫·사신의 장난감 항상 30).
- 악몽 캐릭터가 레벨 40 이하에서 상점·도박 등 난이도 표식 없는 경로로 유니크를 얻으면 아이템 레벨 구간으로 노말 규칙이 적용될 수 있음(드롭·의뢰 보상은 난이도를 직접 씀).
- 이미 가진 70%대 유니크는 그대로.
