# 2026-10-30 갈래 A — 아이템 I01 · I02 실행 증거

- 담당: Claude Opus 5.5 (갈래 A 실행) · 브랜치 `wip/goal-A-items` · 기반 `main 4ba51d5e`
- 권위: 공유 폴더 `goal-items-execution-0030.json`(코덱스 보완 결정, 계약과 충돌 시 우선) · `goal-followup-decisions-0035.txt` 4·5항 · 설계 47 §2·§3
- 메이커 미사용 (실화면·실입력 검증은 goal-results-A.json maker_queue로 넘김). 오프라인 Lua 5.4 회귀는 mLua 엔진 빌드·동기화·저장 원자성을 증명하지 않는다.

## 범위와 결정

| id | 결정 | 근거 |
|---|---|---|
| I02 | A안: 룬워드 판정·삽입 등급 제한 없음 그대로 · 기존 활성 룬워드·아이템 불변 · 게임 안 안내만 정합 | 계약 · JSON I02_runeword_A |
| I01-a | 부위 고르기 = 기존 gen:3 중요 스토리 보상 5개(의뢰 1·3·7·13·19)의 장비 1개만. 추가 지급 없음 · 영구 선택(ChoicePicks/Tiers)과 별도 저장 · quests.csv 무변경(보상 칸 술어) | JSON I01_reward_slot_choice · 0035 4항 |
| I01-a 등급 고정 | 처음 보고할 때 등급(boss 표 · mf300 · 레어 하한)을 한 번 굴려 제안에 고정 → 취소·다시 열기·재접속에도 같은 카드. 그 등급 후보가 있는 부위만 최대 3장. 유니크·세트 후보가 어느 부위에도 없을 때만 원래 생성처럼 레어. 고를 부위가 둘 미만이면 예전 무작위 보상 | 몰래 낮추지 않기 · 원래 무작위 보상 보존 |
| I01-a 레벨 | 제안 때 캐릭터 레벨도 고정(ilvl = 레벨+2 · 요구 레벨 ≤ 레벨) | 원래 등급·ilvl·착용 상한 유지 |
| I01-b 출처 | 아이템 문자열 10번째 칸 `A1:uid:rev:line:id*값+…:id*값` (세미콜론·꺾쇠·세로줄 없음). 새로 만든 마법·레어와 사용자가 고른 전체 재련 뒤에만 생김. 예전 물건은 바이트 그대로 · 부분 재련 불가 안내(전체 재련 강제 없음). 합산 mods를 접사로 쪼개 추정하지 않음 | JSON schema · 0035 4항 |
| I01-b 규칙 | 한 아이템에서 고정한 한 줄만 반복 교체 · 같은 접두/접미·부위·ilvl·난이도 단계·드롭과 같은 가중치 · 다른 줄 능력치 제외 · 다른 mods/베이스/등급/ilvl/레어 이름/소켓/룬/잠금 보존 · 결과는 기존 유지/새 옵션 채택 · 합법 후보 없으면 무소비 · 전체 재련은 모든 옵션을 새로 바꾸고 고정 줄을 푼다(같은 uid · rev+1) | JSON candidate_rules · transaction |
| I01-b 요청 묶기 | 소유자 + 가방 칸 + 그 칸의 문자열 전체(rev 포함). 시도·결정마다 rev+1 → 같은 요청이 두 번 와도 두 번째는 문자열 불일치로 무시 | JSON transaction |
| I01-b 대기 중 | 장착·창고(한꺼번에 넣기 포함)·잠금·판매(여러 개 포함)·버리기·거래 올리기·전체 재련·소켓 뚫기를 거부. 저장·불러오기·창고 왕복은 문자열째 보존 | JSON transaction · 0035 4항 |
| I01-b 비용 | **권장 A ×1.0 = 현행 전체 재련 값 그대로**(마법 40+12×ilvl · 레어 ×3 · 레어 ilvl42 1632). `data/config.csv partialRerollMul` 한 줄로 바꿀 수 있음. 확인 창에서 값을 보인 뒤에만 요청 · 후보를 만든 뒤 한 번에 차감 · 기존을 남겨도 환불 없음 | JSON cost_and_confirmation · 아래 표 |
| UI | 새 창 없이 대장간(인벤토리 대장장이 모드)에서 「여러 개 선택」 자리 = 한 줄 바꾸기 · 「잠금」 자리 = 다음 줄 ▶ · 결과 대기 물건은 어느 모드에서든 「장착」 자리 = 새 옵션 채택 · 「버리기」 자리 = 기존 유지. 부위 카드는 혼의 제물 카드와 같은 양식의 별도 창 GearPickWin | 새 창 남발 금지 · 별도 선택 뷰 |

## 비용·골드 흐름 비교 (오프라인 어림 — `gold_flow.py`, 수입은 `tools/sim_gold.py`)

gold-flow.md 전문. 요약 (레어 기준, 마법은 1/3):

| 안 | 배율 | Lv15 · Lv30 · Lv40 1회 | 노말 액트 한 바퀴 수입으로 시도 (액트2/3/4) | 목표 접사 1개 평균 비용 ÷ 액트 수입 |
|---|---|---|---|---|
| **A 권장** | ×1.0 | 660 · 1200 · 1560 | 42 / 33 / 41 | 21% / 43% / 28% |
| B | ×0.5 | 330 · 600 · 780 | 84 / 66 / 81 | 11% / 22% / 14% |
| C | ×1.5 | 990 · 1800 · 2340 | 28 / 22 / 27 | 32% / 65% / 42% |

권장 A 근거: 코덱스 보완 결정이 현행 값 재사용을 보수적 초기값으로 지정. 목표 한 줄을 맞추는 데 액트 한 바퀴 수입의 약 1/5~2/5 — 의무 비용이 되지 않으면서 드롭을 볼 이유를 남긴다. B는 드롭 탐색 동기를 깎을 위험, C는 액트3에서 한 줄 맞추기가 한 바퀴 수입의 2/3. 실측(텔레메트리) 없이 바꾸지 않는다 — 실제 골드 흐름 측정 뒤 config 한 줄로 조정.

## I02 어긋남 전 → 후

| 자리 | 전 | 후 |
|---|---|---|
| 룬워드 창 줄 오른쪽 (RuneWindow) | 룬만 다 있으면 「만들 수 있음」 | 「제작 준비됨」(남은 룬 + 부위·소켓 수·이미 끼운 룬 순서·착용 레벨이 맞는 장비가 가방/착용에 있음) / 「룬 준비됨 · 맞는 장비 필요」 / 「룬 n / m」 |
| 룬워드 창 안내 줄 | 소켓 수가 룬 개수와 같은 장비에 순서대로 | + 부위 · 장비 등급과 관계없음 · 대장장이 소켓 상한(일반 2~최대 · 마법 1~2 · 레어·유니크·세트 1) · 룬은 착용 장비에 끼움 (두 줄) |
| 게임 안내 「룬과 룬워드」 | 소켓 수가 맞는 장비에만 들어갑니다 | 부위·소켓 수가 맞으면 등급과 관계없이 완성 + 대장장이 소켓 상한 |
| ItemData.RollRarity 주석 | 룬워드는 일반 장비에 룬을 끼워 만든다 | 등급과 관계없이 부위·소켓 수 (GetRuneword) |
| 설계 05 등급 표 | 룬워드 = 엔드 아이템·가장 강함 · 일반 아이템에 삽입 · 6종 | 계획하는 제작 목표 · 등급 제한 없음 · 35종 + 새 소켓으로 완성 가능 일반35/마법4/그 외0 |
| 설계 19 §1 | 일반(흰) 장비만 · 마법·레어·유니크는 룬워드 안 됨 | 정정: 판정은 등급 무관, 새 소켓 상한 때문에 실제 새 제작은 일반35/마법4 |
| 판정·삽입·효과·기존 장비 | — | 변경 없음 (35 레시피 × 등급 0~4 = 175 조건 회귀 동일) |

## 바뀐 파일 (소스가 정본 · 생성물은 부모가 통합 때 재생성)

- `RootDesk/MyDesk/Item/ItemData.mlua` — 10번째 칸 Parse/Serialize · FillAffixes 출처 기록(추첨 수 그대로) · AffixPool 분리 · 부분 재련(PartialState/RollPartial/ResolvePartial/PartialText …) · 부위 보상(QuestGearRarity/HasRewardPool/RewardSlotsFor/GenerateQuestSlotReward) · Pick* 명시 부위 인자 · 대기 중 CanReroll/CanPunch 거부 · SameItem uid
- `RootDesk/MyDesk/Item/PlayerInventory.mlua` — RequestPartialReroll · RequestResolvePartial · RejectPending 및 장착/창고/잠금/판매/버리기 거부
- `RootDesk/MyDesk/Quest/PlayerQuest.mlua` — 보상 구간만: RequestTurnIn 분기 · TurnIn(gearSlot) · RewardBagSlots · 부위 제안(OfferGearChoice/MakeGearOffer/RequestGearChoice/OpenGearChoice) · 저장 go0~go2 · SwitchDifficulty/LoadSaveData 동기화
- `RootDesk/MyDesk/UI/Windows/GearChoiceWindow.mlua` (새 Logic — codeblock은 메이커 refresh 필요) · `InventoryWindow.mlua` · `RuneWindow.mlua` · `GuideWindow.mlua`
- `RootDesk/MyDesk/Social/PlayerTrade.mlua` (대기 물건 거래 올리기 거부 2줄) · `Item/LootSystem.mlua`·`Test/SelfTest.mlua` (PickUnique/PickBase/PickSetPiece 명시 부위 인자)
- `data/config.csv` partialRerollMul · `GameData.mlua`(gen_data 생성) · `tools/build/ui.cjs` (GearPickWin · RuneWin 안내 두 줄/준비 글 줄이기) · GameHUD UI 파일(빌드 생성 — 기존 엔티티 id 1623개 그대로 · 26개 추가)
- `tests/quality/items_reforge.lua`(새 그룹) · `tests/quality/items.lua`(TurnIn 인자·DateTime) · `tests/quality/run.py`(기본 그룹 추가)
- `docs/design/05-items-and-economy.md` · `docs/design/19-item-expansion.md` (I02 정합)

## 검사 (로그: npm-test.log · checks.log · lua-regression.log)

- `npm test` 12/12 통과 · check_data 0건 · check_scripts 143개 0건 · check_mobile_layout 0건 · check_ui_tokens 창 틀 24개 0건 · check_ui_layers 가림 0 · check_voice 0
- 오프라인 Lua 회귀 전 그룹 통과. 새 `items_reforge` 19,380 검사:
  - F01: 출처 기록 전(4ba51d5e) 코드와 같은 seed로 1,760개(드롭·전체 재련·퀘스트 보상) 보이는 칸 해시 동일 `c16b7a608417728f`
  - 새 마법·레어 671/671 출처 칸 · 구버전 7/8/9칸 문자열 바이트 동일 · 잠금/소켓 뚫기/룬 끼우기 보존
  - 부분 재련 671개: 고른 줄만 변경 · 다른 줄 능력치 중복 없음 · 같은 종류·부위·ilvl·단계 · 줄 고정(유지·채택 모두) · 마법 이름 일관 재생성 · 레어 이름 보존
  - 서버: 1회 차감 · 옛/중복/남의/골드 부족/예전 물건/후보 없음 무소비 · 대기 중 6종 조작 거부 · 저장·창고 왕복 보존 · 결정 무료
  - 부위 보상: gen:3 = 1,3,7,13,19 · Lv1~40 × 등급 2~4 제시 부위 903개 모두 그 부위·그 등급·착용 가능 · 제안 고정(다시 열기·저장/불러오기) · 옛 버전/없는 부위/남/가방 가득 무시 · 다른 보상(skp·소켓권·골드·경험치) 그대로 · 중복 무시 · 유니크·세트 고정 등급 유지
  - I02: 35 레시피 × 등급 0~4 판정 동일 · 준비 표시 구분

## 한계

- 메이커 실행·LSP·codeblock 생성 없음 (GearChoiceWindow 새 Logic 등록은 refresh 필요). 실기기 터치·화면 글 줄바꿈 미확인.
- 오프라인 골드 표는 sim_gold 어림 — 실플레이 수입/지출 측정 아님. 밸런스·재미 개선 주장 없음.
- 예전 물건(출처 없음)은 부분 재련 불가 — 전체 재련을 고르면 그 뒤부터 가능.
- 부위 보상은 레벨을 제안 때 고정 — 보고 전 레벨업해도 제안의 레벨 기준 (원래 보상은 보고 순간 레벨).
