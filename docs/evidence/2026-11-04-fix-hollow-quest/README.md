# 굶주린 굴 첫 퀘스트 막힘 — 원인 확인 · 수정 · 메이커 검증 (11-04 · 기획 65 P-6·P-7)

사용자 11-04 승인분. 원인을 먼저 확인하고 재현된 결함만 고쳤다. 잠복 규칙과 소환 규칙은 지우지 않았다.

## 원인 3건 판정

| # | 증상 (기획 65) | 원인 | 판정 | 수정 |
|---|---|---|---|---|
| 1 | 잠복 정예 「무덤 구더기」가 투명도 0.12로 숨은 채 2분 넘게 정체 | `MonsterBehavior` burrow는 방어자(플레이어·소환수)가 **2.2칸 안**에 와야만 나온다. 검수 때 거리는 약 4.1칸(18:22:11 `me(-4.91,-5.01)` · 구더기 `(-2.42,-1.76)`)이라 규칙대로 계속 숨어 있었다. 숨은 동안 피격 판정이 꺼져(HitComponent off) 플레이어·소환수 모두 칠 수 없다 | 규칙 자체는 정상(의도된 매복) · **곁에 서 있어도 끝없이 숨는 것, 「모두 처치」 남은 수에 숨은 적이 들어 있는데 안내가 없는 것은 결함** | 4.5칸 안에 3초 머물면 눈치채고 나온다(`why=aware`) · 정리 맵에서 남은 적이 모두 숨은 채(대기 무리 0)면 스포너가 끌어낸다(`ForceEmerge clear-last` · 다시 숨지 않음) · 추적기·퀘스트 창 남은 수 뒤에 「숨은 적 N」 |
| 2 | 남은 수 23 → 25 증가 (18:16:59~18:17:12) | 같은 때 대기 무리 수는 13 그대로, 서 있는 수만 10 → 12 → 10. 정리 집계(`MonsterSpawner.Poll`)가 맵의 모든 `script.Monster`를 세서 변종 「무리 부르기」(`skill_summon` · 같은 종류 졸개 **2마리**)로 나온 졸개까지 셌다 | **결함** — 기획 14 「정리 중 리젠 없음 · 남은 망자 n」, 기획 41 #8-A(떼가 섞이면 의뢰가 안 끝난다 → 떼 제외)와 같은 원칙: 「모두 처치」는 배치 무리(처음 + 깨움)만 센다 | 졸개에 `Monster.Summoned`(@Sync) 표시 · 정리 집계에서 제외(이름 `Summoned_` 검사로 스폰 직후 틈도 막음) · 미니맵 남은 망자 안내도 떼·졸개를 가리키지 않음. 부르기 기술 자체는 그대로 |
| 3 | 추적기를 한 번 누르면 접혀 굴 안에서 남은 수가 안 보임 | 10-21 사용자 결정 「화면 UI 줄이기」로 누르면 같은 퀘스트·같은 단계 동안 다시 뜨지 않는다(키 = 번호:단계). 접힌 상태는 저장되지 않는다(클라이언트 메모리). 검수 때 접힘은 탐침 땅 클릭이 카드를 누른 것(자동 입력 한계) | 누르면 접히는 것은 정상 규칙 · **남은 수를 볼 유일한 곳인 목표 맵 안에서도 계속 접혀 있는 것은 결함** | 「모두 처치」 목표 맵에 들어오면 키에 `:in`을 붙여 접어 둔 카드가 다시 펼쳐진다. 그 맵 안에서 다시 누르면 그 맵에서는 접힌다 |

## 메이커 검증 (11-04 20:04~20:34 · 한 번의 플레이)

- 슬롯 3 핏빛망령 Lv4 · 솔로 게임 방 · **저장 끔**(IsLoadSuccess=false) · **무적 치트 표본**(PlayerVitals.InvincibleUntil · 몬스터 체력·퀘스트 강제 없음) · 소리 0(SoundDirector 런타임만)
- 빌드 오류 0 · SelfTest 통과 408 / 실패 0 · 실행 중 오류 로그 0(의도한 SelfTest 실패 줄 제외)
- 흐름: 오렌에게 Space 대화 → 수락(`quest accepted 굶주린 굴`) → 황무지 굴 문 앞 → 아래 방향키로 입장 → 26마리 모두 처치 → `map cleared hollow total=26` · `quest goal 굶주린 굴` → 오렌 Space 대화 3쪽 → **D안 결산 판**(골드 40 · 경험치 1,500 · 스킬 포인트 2 · 희귀 장비 1 · LEVEL UP 5→6) → Space 받기(`reward plate claim q=1`) → 부위 고르기 창(등불·목걸이·반지)
- 남은 수 로그(한 번도 늘지 않음): 26 26 25 24 23 23 22 22 22 22 21 21 20 19 18 17 17 16 15 14 13 12 10 9 9 8 7 6 6 5 4 3 2 1 0
- 졸개 재현(원인 표본 · 서버 스크립트로 굴 구울 하나에 `CastSkill("skill_summon")` 한 번): `naive_live` 12 → 14(옛 집계면 남은 수 +2) · 스포너 남은 수 21 → 21 · `summon minions src=fallen_imp n=2 … (clear count excluded)`
- 잠복: 2.2칸 안 `why=near` 9건(같은 줄 3건은 key-lines에서 하나로 합침) · **눈치챔 `why=aware` near=2.9~4.3 7건**(검수 때 4.1칸에서 멈췄던 상황) · 끝방 정예 g2 구더기 포함 3마리가 3.3~3.6칸에서 나와 처치됨 · `clear-last` 끌어내기는 이번 흐름에서 조건(남은 적 전부 숨음 + 대기 0)이 오지 않아 발동하지 않음(미관찰)
- 추적기: 황무지에서 카드 클릭 처리기로 접힘 → 굴 입장 즉시 다시 펼쳐짐 「남은 망자 26 / 26 · 숨은 적 3」 → 「21 / 26 · 숨은 적 8」 → 「6 / 26」 → 완수 뒤 「보고」

### 대체·한계 (게임 결함과 분리)
- 메이커 창이 사용자 화면 어디에도 보이지 않아(사용자 수업 중 데스크톱 사용) OS 커서·실제 클릭·화면 녹화를 쓰지 않았다 → **실속도 영상 없음**, 캡처는 `maker_screenshot`(992×558).
- `maker_mouse_input`이 엔진 UI 단추를 누르지 못해 추적기 접기는 단추 처리기(`HudMain:OpenQuestFromTrack`)를 직접 불렀다.
- 이동: 마을 → 오렌 · 황무지 굴 문 앞 · 굴 안 4곳은 `PlayerTravel:Go`(이동 대체). 굴 안 클릭 이동 길찾기(`GroundPath` MaxExpanded 640)가 미로 구간에서 길을 못 찾는 자리가 있었다 — 이번 범위 밖, 따로 확인 필요.
- 공격: `ClickControl:SelectAttackTarget`(몬스터를 누른 것과 같은 길 · 다가가 평타) + 해골·그림자.
- 입장·대화·보상 받기는 실제 키(아래 방향키 · Space).

## 파일
- `RootDesk/MyDesk/Monster/MonsterBehavior.mlua` — AwareRange 4.5 · AwareSeconds 3 · `Emerge`/`ForceEmerge` · NoReburrow · `[VRF] burrow emerge why=…`
- `RootDesk/MyDesk/Monster/MonsterSpawner.mlua` — 정리 집계: 떼·졸개 제외 · 숨은 수 · 모두 숨은 채면 끌어내기 · 로그 `hidden=`
- `RootDesk/MyDesk/Monster/Monster.mlua` — `@Sync Summoned`
- `RootDesk/MyDesk/Monster/MonsterTraits.mlua` — 부르기 졸개 `Summoned = true` · `[VRF] summon minions`
- `RootDesk/MyDesk/Quest/PlayerQuest.mlua` — `@Sync ClearHidden` · `ShowClearProgress(…, hidden)`
- `RootDesk/MyDesk/UI/Hud/HudMain.mlua` — 목표 맵 진입 시 추적기 다시 펼침 · 「숨은 적 N」
- `RootDesk/MyDesk/UI/Windows/QuestWindow.mlua` — 퀘스트 창 상태 줄 「숨은 적 N」
- `RootDesk/MyDesk/UI/Hud/HudMap.mlua` — 남은 망자 안내가 떼·졸개를 가리키지 않음
- UI 레이아웃 파일 변경 없음
