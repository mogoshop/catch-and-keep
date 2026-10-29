# INT-20261029-1725 실행 매니페스트 — I03·I04·UI 보완 통합 메이커 검증

- 실행 묶음: **INT-20261029-1725** (17:25~17:50 직전 담당 PC) + **재개 M18** (18:20~18:42 이어받은 담당, iPad 프리셋 + PC 보완 1장)
- 소스: **ad2d080e90afb20bb41eac83452740c92569b203** (2026-10-29 17:19:10 +0900, `codex/player-experience-polish` = main)
- 결과 인계: `maker-results-integration.json` (이 폴더 + 공유 폴더 `/Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/maker-results-integration.json`)
- 판정 구분: 아래 표의 상태는 **Claude 자체 case 판정**이다. **코덱스 독립 최종 판정은 모두 대기**. 코덱스 집계(바꾸지 않음): 코드 11/11 · 원본 통합 11/11 · 메이커 전체 요건 0/11 · 독립 최종 통과 0/11 · 대표 화면/기능 11/11 (F01~F11 기준 — I03/I04/UI case는 그 분모에 넣지 않음).
- 소스는 고치지 않았다. 찾은 결함은 기록만 했다(아래 「열린 관찰」).

## 1. 소스 고정

`git status`: 추적 파일 중 바뀐 것은 `.claude/` 아래·`AGENTS.md`·`RootDesk/MyDesk/Shop.directory`(메이커 refresh 산출물)뿐 — 게임 소스 변경 0. 18:20 기준 `RootDesk`·`ui`·`map`·`Global`에 17:26 뒤 바뀐 파일 없음. 아래 파일은 작업 트리 = HEAD 블롭.

| 파일 | sha256 | HEAD 블롭 |
|---|---|---|
| `RootDesk/MyDesk/Skill/SkillBook.mlua` | `1b566df24c085e476bb2a6f42cee8bb90723e1622e97e6b3577c50e6e6b5da57` | `12f434ee7eb4` 일치 |
| `RootDesk/MyDesk/UI/Windows/SkillWindow.mlua` | `056811667096d236e220e1bb4fed1c5a1f92097d5e3aaf58f7d18488695f34a7` | `6463efbb6cb0` 일치 |
| `RootDesk/MyDesk/UI/Windows/SkillOffer.mlua` | `7a0df6528edc02b3a3abbd1ba15c18ad55ea43d24a2367ba44a87a908ff2c61f` | `a6160afcf0b2` 일치 |
| `RootDesk/MyDesk/Undead/UndeadSystem.mlua` | `30b78e328e63029f2ea0418cc4f91229cce5e621a999160bdff1b986390f2277` | `ea228af4b374` 일치 |
| `RootDesk/MyDesk/UI/Hud/MobilePad.mlua` | `1fcd36cc34da510baed2c655f484135b12edc691dc16c006dbd05796017503eb` | `4aed635ced5b` 일치 |
| `RootDesk/MyDesk/UI/Hud/MobileLayout.mlua` | `398e7151b52e34a6454614c80b054931275aa3a12bf1a97538aebdf0761417f4` | `f23af4d70812` 일치 |
| `RootDesk/MyDesk/UI/Hud/HudMain.mlua` | `bf50a78bbd030478d7c3190277426116121babab13db62290e1e5c56f737d48a` | `87a4ec5c7700` 일치 |
| `RootDesk/MyDesk/UI/Hud/UXFeedback.mlua` | `7006eac0a85a4ce75f76df70d063d15b5e03f89a2181bcd3ea98e7142c7e0e35` | `c23fb25425dc` 일치 |
| `RootDesk/MyDesk/UI/Hud/NoticeFeed.mlua` | `eee565456015db1f12c554c8935bff5a6869d0561f5ec38beb755cde2f484420` | `a684bf711889` 일치 |
| `RootDesk/MyDesk/Item/ItemData.mlua` | `e29774cc28ed4b21a793b20a190530dc495eec9859a635640add232e48c3f18e` | `c890669d3e16` 일치 |
| `RootDesk/MyDesk/Progress/PlayerJournal.mlua` | `18322197971ee425ba1536a97145e605598686f40794dafe5178e59665407f61` | `ccffa57e2ef2` 일치 |
| `RootDesk/MyDesk/Quest/PlayerQuest.mlua` | `ccfaac8c0e350f037053c1a914f4b4599eaa7c4cf8189b0e94b8fb3a9eebecf4` | `920cd093c24b` 일치 |
| `RootDesk/MyDesk/Input/ClickControl.mlua` | `71ff6da041b8f00c4dfd5e9131ef157ad0df7bfb3a901939345862711d81374a` | `0b847f48cb15` 일치 |
| `RootDesk/MyDesk/UI/Core/UIKit.mlua` | `dff58bd81f5ae17c1659d237df5483bdf2d6e55e1700f290fcaf73184c45c611` | `31cb90e2b71c` 일치 |
| `ui/GameHUD.ui` | `d36b25e21ee8cd35af0a6b283575c655bf3d4db9cf6ebc6935211d921aa07605` | `69e584ec2cae` 일치 |
| `ui/ShadowHUD.ui` | `4e97ea61c104bd9356542cf81a03e687dfe4c33c4ecfee9a00714a21cd742b94` | `f5d8f4a39018` 일치 |

## 2. 메이커 시각표 (KST)

| 시각 | 일 | 근거 |
|---|---|---|
| 17:25:52 | refresh·build (547줄: Info 453 · Warning 94 · Error 0) | `maker-build-log-1725.json` |
| 17:30:58 | play PC FHD → 17:31:28 I03/I04/UI 함수 등록 확인 → 17:32:07 방 `game:s1b85c875f5d` | RUN-log 1-12 |
| 17:33~17:49 | I03-1~6 · UI-1~5 촬영 (직전 담당) | RUN-log 13-257, capture-map |
| 17:50:00 | `PlayerSave:Save(true)` 슬롯4 저장 (직전 담당) | RUN-log 258 |
| 17:50:38 | 직전 담당 모바일 play 재시작 → 17:50:59 방 `game:s1b860f35f13` → 한도로 끊김 (그 play는 18:10:07까지 이어짐, 촬영 없음) | 재개 전 normal 로그 |
| 18:20:36 | **재개** refresh(편집 모드) → build 547줄 같은 구성·시각 17:25:52 그대로(스크립트 변경 없음) | RUN-log 260-262 |
| 18:20:43 | `maker_set_platform mobile` → already_current (Apple iPad (5th gen), safeArea 끔) | |
| 18:21:41 | play — 컨텍스트 `server_main` · `client` · `server_instance_game:s1b8686bc8fd`(18:22:51 방 입장, outpost) | RUN-log 263-300 |
| 18:26~18:38 | I04-1~3 · UI-6 · F09-M (iPad) | RUN-log 301-446 |
| 18:38:42 | stop → 18:38:50 `set_platform pc` (FHD, previous=mobile) → 18:39:07 play → `server_instance_game:s1b86c4acac1` | RUN-log 447-450 |
| 18:40:35 | UI-2 F06-C 긴 복합 알림 표시 중 PC 프레임 보완 | RUN-log 451-475 |
| 18:41:3x | stop → 18:41:44 편집 모드 map01 · 플랫폼 PC(FHD) | |

재개 중 다른 세션의 refresh는 없었다(이 담당 혼자 메이커 사용, Edit/Write 도구 안 씀 → 훅 refresh 없음). 재개 첫 refresh 뒤 build 로그가 17:25 것과 바이트 동일.

## 3. 테스트 캐릭터와 저장 상태

- 슬롯4 「새내기」(외형 m-3-1-2-2).
- **INT 시작 전**(`slot4-pre-INT.json`, 17:31:28): Lv1 · 골드 0 · 스킬 없음 · 가방 5칸(물약·두루마리·후드·등불) · 장비 단낫 · 퀘스트 1 · 업적 수령 없음.
- **지금 저장값**(`slot4-pre-M1822.json`, 18:22:07 = 17:50 직전 담당 `Save(true)` 결과): Lv40 · 경험치 219975 · 골드 200846 · 스킬 포인트 0 · 스킬 bone_spear5·raise_skeleton9·raise_mage3·wraith_dash3·skel_shield2·skel_twin1·mage_hex1·mage_twin1·bone_rite1 · 칸 비어 있음 · 퀘스트 20(`;prologue;act1;act4;nmpreview;`) · 업적 a_level10@0·a_level20@0 수령, a_queen@2 보관(`ac`), 칭호 「무덤 왕국의 해방자」 착용 · 장비 철혼의 눈 망령 갑주 + 단낫 · 가방 59/60(짚신 53개 채움) · 소켓권 1 · 이동 기록 camp·wasteland / map01·wasteland·outpost · 계정 슬롯 요약 Lv40 · 안내 카드에 `shadow` 추가.
- **INT 전과 다른 점**: 위 전부(레벨·골드·스킬·장비·가방·퀘스트·업적·칭호·이동 기록·계정 카드). 되돌리지 않았다 — 되돌릴지는 사용자/조정 담당 판단(직전 담당의 복원 스크립트 방식으로 `slot4-pre-INT.json` 값을 BatchSet하면 됨).
- **이번 재개는 저장을 껐다**: 두 방 모두 입장 직후 `PlayerSave.IsLoadSuccess=false`. 18:38:25(iPad)·18:41:19(PC) 재조회로 저장값이 18:22 값과 같음을 확인 — 이번 실행의 고급 배치·사망 2번·Lv45·호령·업적 수령은 저장되지 않았다.

## 4. 준비와 검증의 구분

- **준비(서버 스크립트, 검증 아님)**: 저장 끄기 · `PlayerTravel:Go` 이동 · 무적 시간(`PlayerVitals.InvincibleUntil`, Lv40 생명 155로 황무지 무리 옆에서 두 번 죽은 뒤) · I04-2 전리품 생성(`LootSystem.Spawn` 짚신 Rarity0)·3.5칸 안 몬스터 숨김/다시 보이기·fallenimp 2마리 생성 · `PlayerAttack.DebugCombat` 켬 · F09-M용 `GainExp`(Lv40→45). 사망 때 장비 2개가 시체에 남아 재개 뒤로는 장비 없이 진행(저장 꺼짐).
- **검증(실제 UI 입력·처리 함수)**: 단추는 실제 단추 엔티티에 `ButtonClickEvent` (메뉴·스킬 창·스킬 편집·스킬 지정 창·편집 끝·일지·받기·배우기). 모바일 패드는 `MobilePad.BeginGesture → UpdateGesture(0.1초마다, ScreenTouchHoldEvent 처리와 같음) → EndGesture`를 손가락 down/hold/up 순서로 직접 호출(touchId 11·12·13·21 — 실제 마우스 -1/1과 겹치지 않게). 화면 점은 `_UILogic:ScreenToLocalUIPosition`을 거꾸로 풀어 그 단추 지역 (0,0)이 되는 점(「취소」 판정 `IsOverCancel`과 같은 함수). 결과는 서버/클라이언트 상태 로그와 캡처로 대조.
- **모바일은 iPad 프리셋이며 실기기가 아니다. 물리 터치는 없다.** 손 가림·엄지 거리·오탭·실제 끌기 거리는 대기.
- 실행한 스크립트: `M18-maker-scripts.lua`.

## 5. 캡처 방법

- `maker_screenshot` 원본은 McpScreenshots에서 바이트 그대로 복사(`_mcp`·접미사 없는 PC 파일).
- **iPad 프리셋의 `maker_screenshot`은 모서리를 잘라 찍는다**(패드 오른쪽의 작은 기본 공격 단추·위쪽 알림 줄이 빠짐). 그래서 메이커 편집기 Play (Preview) 창을 macOS `screencapture -l <MapleStory Worlds 창>`으로 함께 찍었다 — 원본 `wincap/*.png`(3840x2110), 게임 화면 사각형만 잘라낸 것이 `*_M_*.png`(배율 그대로), 부분 확대가 `_zoom`. 매핑은 `capture-map.txt` 끝.
- 창 캡처 가운데의 「Error — An error occurred during mlua conversion」 상자는 메이커 편집기 대화상자다(게임 화면 아님, 18:29 첫 창 캡처부터 있었음). 메모리 규칙대로 건드리지 않았다 — 사용자가 닫기.

## 6. case별 Claude 자체 판정 (코덱스 독립 판정은 전부 대기)

| case | 화면 | 상태 | 요지 | 로그 |
|---|---|---|---|---|
| I03-1 | PC | **부분확인** | 해골 전사 편성 줄 — 1/2 → 2/2와 교체 안내 (스킬 창) | RUN-log.txt 13-27 |
| I03-2 | PC | **부분확인** | 해골 마법사 편성 줄 — 저주 1 · 다음 소환 쌍발 | RUN-log.txt 76-80 |
| I03-3 | PC | **실패** | 대검 노드 0기 안내 — 스킬 창 안내 + 혼의 제물 카드 | RUN-log.txt 28-50 |
| I03-4 | PC | **실패** | 방패 노드 — 찍으면 대검 자리가 없어짐 안내 | RUN-log.txt 51-67 |
| I03-5 | PC | **실패** | 방패 노드 — 정원이 차 세기만 오름 안내 | RUN-log.txt 68-75 |
| I03-6 | PC | **부분확인** | 쌍칼 노드 — 뼈 거인이 서 있는 동안 0기 안내와 해제 | RUN-log.txt 81-120 |
| UI-1 | PC | **통과** | 재련 결과 알림 — 서식 태그 조각 없음 (F01-A) | RUN-log.txt 121-158 (직전 담당이 같은 구간을 두 번 덧붙여 121-139는 중복) |
| UI-2 | PC | **통과** | 업적 보상 알림 — 가방 거절(F06-A) · 긴 복합 보상(F06-C) · 골드만 | RUN-log.txt 159-216, RUN-log.txt 447-476 (18:40 보완) |
| UI-3 | PC | **통과** | 선택 보상 띠 한 줄 (F02-A) · 띠 클릭으로 보상 창 | RUN-log.txt 239-250 |
| UI-4 | PC | **통과** | 알림 줄 합치기·만료 뒤 높이 (UI-NOTICE-R01) | RUN-log.txt 217-238 |
| UI-5 | PC | **부분확인** | 스킬 창 비용·재사용 줄 (F08 뼈 창·망령 질주) | RUN-log.txt 251-257 |
| I04-1 | iPad 프리셋 | **부분확인** | 고급 배치(5번 칸=큰 단추에 스킬)에서 작은 기본 공격 단추(BasicAtk, 칸 6) 표시·숨김 · 터치 대상 크기·간격 | RUN-log.txt 301-344 |
| I04-2 | iPad 프리셋 | **통과** | I04-R01 장면 — 작은 기본 공격 단추를 누른 채 큰 단추가 「줍기」로 바뀌고 적이 다시 와도 홀드 유지 · 5번 스킬 오발 없음 | RUN-log.txt 345-396 |
| I04-3 | iPad 프리셋 | **통과** | 스킬 칸 끌기 중 「취소」 표시 · 그 위에서 떼면 시전 없음 | RUN-log.txt 397-416 |
| UI-6 | iPad 프리셋 | **통과** | iPad에서 결과 알림이 떠 있는 프레임 | RUN-log.txt 417-429 |
| F09-M | iPad 프리셋 | **통과** | iPad 스킬 창 호령 현재/다음 줄 (원래 계약의 모바일 미관찰 항목) | RUN-log.txt 430-444 |
| WAIT-PHYS | 실기기 | **대기** | 물리 터치·실기기(16:9·19.5:9·4:3·좁은 화면) — BasicAtk 오탭·엄지 거리·손가림, 취소 끌기 쉬움·오취소, 조이스틱 동시 조작 | — |
| WAIT-RELOGIN | — | **대기** | 재접속 뒤 고급 배치·보관 보상·편성 표시 유지 | — |

세부(사전 상태·단계·기대·실제·증거 절대경로·미확인 경계·4항목 판정)는 JSON `cases`.

### 이번 재개에서 새로 확인한 것 (요약)

- **I04-1**: 5번 칸이 비면 작은 단추 숨김 → 「스킬 편집」 중 5번 칸에 뼈 창을 넣어도 숨김 → 「편집 끝」에 표시(`BasicAtk.Enable=true`, 큰 단추 「뼈 창」). 크기 BasicAtk 96·Attack 220·S1~S4 120·Dash 96·AimCancel 92 (모두 88 이상). 간격 BasicAtk↔Attack 2.0 · BasicAtk↔S4 2.0 (1920 기준 UI 단위) — 기존 결정 대기 사항 그대로.
- **I04-2 (I04-R01 장면)**: 작은 단추 홀드 중 전리품 → 큰 단추 「줍기」(18:32:42)여도 holding=true 유지·기본 공격 요청 계속(aimReq 9→23), 적 재등장 → 「뼈 창」 복귀(18:32:49)·요청 계속(26→63), 손 떼면 요청 정지(3초 증가 0). 5번 스킬 시전·줍기 요청·놓기 시전 로그 0, 뼈 창 재사용 0·마나 118 그대로.
- **I04-3**: 끌기 시작에 「취소」 표시 → 위에서 진해짐(0.88,0.20,0.18,0.92) → 그 위에서 떼면 `mobile aim cancel slot=1`, 서버 줄 없음, 마나·재사용·언데드 그대로. 대조(밖에서 뗌)는 요청이 서버까지 가서 「no owned soul」로 거절.
- **UI-6**: iPad에서 긴 복합 업적 알림 2줄이 표시 중인 프레임 확보(약 4초). 대상 몬스터 정보 틀을 덮는 점은 관찰로 기록.
- **F09-M**: iPad 스킬 창 호령 「배우면」 → 배운 뒤 「지금 +7%·+5%·+5 / 다음 랭크 +8.4%·+5.5%·+6」·버튼 상태가 한 화면에서 읽힘.
- **UI-2 F06-C 보완(PC)**: 원래 17:45 긴 복합 알림 표시 중 원본 프레임은 McpScreenshots에 없음(17:45:12 다음이 17:45:33) → 18:40 PC에서 보관 업적(여왕의 몰락·지옥: 골드+룬+칭호) 받는 순간을 촬영 `UI-2_PC_F06-C_reward_visible.png`. 원래 보상(골드+소켓권+칭호)과 문자열은 다르나 같은 길이의 복합 알림. 전체 업적 지급 재실험은 하지 않음.

## 7. 열린 관찰 (수정은 하지 않음)

- **INT1725-OBS-01** (P2, 코덱스(observation-i03-cards-1739.json)): 소환 추천(혼의 제물) 카드 셋째 장의 편성 경고 마지막 줄이 카드 아래 장식으로 넘침 — I03-3 대검·I03-5 방패 세기만 + (이번 정리에서 확인) I03-4 방패 교체 카드 「정원 2기」도 같은 증상 — 수정: 다른 담당 — 가독성 격리 브랜치(카드 내부 효과/경고 영역). 이 실행에서 소스 수정 없음
- **INT1725-OBS-02** (P3, 코덱스(observation-i03-giant-1759.json · quality-feedback-int1725-1759.txt)): 거인 유지 중 편성 줄이 거인 본체(s:!)를 「일반 1」로 세고 「편성 6/5: 일반 1·방패 1·거인에 4」처럼 혼합 합계를 정원처럼 표시 (전투 정원 규칙 결함 아님) — 수정: 다른 담당 — 가독성 브랜치(SkillBook.RosterLine/UndeadSystem.PreviewFrom 표시만). 이 실행에서 수정 없음
- **QR1629-OBS-01** (기존, 코덱스): 비용·재사용 줄이 값만 다음 줄로 끊김 — 이번 PC 캡처에서도 「재사용 / 0.47초」(I03-1·I03-2), 「사거리 / 9.0」(UI-5) — 수정: 가독성 브랜치 306a8f66(ad2d080e 미통합)
- **M18-OBS-01** (관찰(결함 단정 안 함), Claude M18): iPad에서 방 입장 직후 저절로 뜨는 선택 보상 창(OfferWin) 기준 알림 자리 계산이 한 프레임 「side=below y=1427156」(화면 밖) → 같은 초에 「above y=1153」으로 바로잡힘. 2회 재현(17:51:27 직전 담당 · 18:23:17). 그때 알림 0줄이라 화면 영향 확인 안 됨 — 수정: 없음(기록만)
- **M18-OBS-02** (관찰(P3 후보), Claude M18): iPad에서 창(일지)을 연 채 결과 알림이 뜨면 알림 상자(위 above 자리)가 화면 위쪽 대상 몬스터 정보 틀(이름·HP 막대)을 약 4초 덮음 — UI-6_M_notice_visible_zoom.png — 수정: 없음(기록만, 수정 요청 아님)
- **M18-OBS-03** (관찰(글귀 P3 후보), Claude M18): 스킬 창 「랭크 2은 Lv47부터」 — 숫자 2(이) 뒤 조사는 「는」 — F09-M_aura_ipad_zoom.png — 수정: 없음(기록만)
- **M18-NOTE-04** (기존 결정 대기와 같음, Claude M18 측정): 런타임 간격 BasicAtk↔Attack 2.0 · BasicAtk↔S4 2.0 (UI 단위) — improvement-parallel-results I04 decisions_needed(A 스킬 호 재배치 / B 5번 스킬 작은 칸)와 같은 사항, 새 결함 아님 — 수정: 사용자 결정 대기
- **MAKER-ENV-01** (환경, Claude M18): 메이커 편집기에 「Error — An error occurred during mlua conversion」 대화상자가 18:29 첫 창 캡처부터 떠 있음(원인 미확인, 진단 스크립트 오류 때 뜨는 상자로 추정). 게임 화면 밖 편집기 상자라 maker_screenshot에는 없고 창 캡처에만 보임 — 사용자가 닫기(메모리 규칙) — 수정: 사용자

## 8. 못 한 것 / 대기

- 물리 터치·실기기·휴대폰 프리셋(도구 한계)
- 재접속
- 땅 찍기 범위 원 꺼짐·뼈 의식 취소·큰 단추 홀드 대조(범위 밖 — 지시대로 넓히지 않음)
- 슬롯4 되돌리기(지시대로 하지 않고 보고만)
- F01~F11 재실험 안 함
- 직전 담당 RUN-log 121-139 등은 같은 로그를 두 번 덧붙인 중복 블록이다(같은 사건).

## 9. 이 폴더의 새 파일 (재개 M18)

sha256 전체 목록은 JSON `evidence_sha256`. 이번에 더한 것: `README.md` · `maker-results-integration.json` · `slot4-pre-M1822.json` · `M18-maker-scripts.lua` · `RUN-log.txt` 259-476줄 · `capture-map.txt` 끝 블록 · `I04-1_M_*` · `I04-2_M_*` · `I04-3_M_*` · `UI-6_M_*` · `F09-M_*` · `UI-2_PC_F06-C_reward_visible*` · `wincap/` 8장.

## 10. 메이커 마지막 상태

편집 모드 · map01 · 플랫폼 PC(FHD). 편집기 Error 대화상자는 그대로(사용자가 닫기).
