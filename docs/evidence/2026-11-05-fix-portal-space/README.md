# 포털 개선 3건 (11-05 사용자 결정)

사용자 원문: 「마을에서 포탈위치가 너무 불편해 누구의 포탈인지도 3명이 넘어가면 보기힘들고 … 포탈도 마을에서든 사냥터에서든 스페이스바 눌러서 이동하게해줘 지나가다 이동하는 경우가 너무많아.」

## 1) 포털은 Space(PC)·「들어가기」(모바일)로만
- `World/WarpGate.mlua`: 0.3초 자동 이동 검사(`Check`) 삭제 → `InZone(p, slack)`(원 Radius·사각 TriggerBox + 여유 0.35) · `TryEnter(player)`(서버 여유 +0.6 · 재사용 2초 · `CanUse` 그대로 · `Warp` 그대로). `ArrivalGrace`(도착 직후 튕김 방지)는 자동 이동이 없어져 뺐다.
- `Endgame/DepthGate.mlua`: 「2초 머무르기」 대신 같은 규칙. 문 위에 처음 서면 무엇인지(레벨대·열쇠·이번 주) 안내만, 이동은 `TryEnter`. 입구 해금·열쇠 경고는 그대로(`CanEnter`).
- `Player/PlayerTravel.mlua` `RequestGate(Entity)`(Server RPC · senderUserId 확인) → WarpGate/DepthGate `TryEnter`.
- `UI/Windows/NpcWindow.mlua`: NPC 대화 안내 단추(`InteractionHUD/SafeArea/Talk`)를 그대로 써서 구역 안이면 「Space · 가는 곳 (주인)」(모바일 「가는 곳 · 들어가기」). Space·B·단추 터치 → `Talk()`가 포털을 먼저 본다.
- 안내 문구: GuideWindow 조작(PC) 「Space 질주 (마을에서는 대화) · 포털 위에서는 들어가기」, 모바일 「포털 위에서 들어가기 버튼으로 이동」. 위 배너는 맵 출구만 「출구: X — Space로 이동」(모바일 「들어가기로 이동」).
- 키 바인딩 전용 창은 이 프로젝트에 없다(조작 안내는 GuideWindow 한 곳).

### Space 우선순위
| 자리 | Space |
|---|---|
| 포털·심도 문 구역 안(반경+0.35) | 포털 진입 (질주 안 함) |
| 마을 NPC·제단·웨이포인트 곁 | 대화 (예전 그대로 — 마을에서는 `SkillBook.CastMove`가 질주를 안 함) |
| 그 밖 사냥터 | 질주 |
- 구현: 질주 막기는 `SkillBook.mlua`를 고치지 않고(다른 차선 작업 중) 안내가 0.2초마다 `SkillBook.MovePredictAt`(질주 연타 막이 시각)을 0.1초 앞으로 민다 → 구역 안에서는 질주가 나가지 않고, 나가면 0.4초 안에 돌아온다. 모바일 질주 단추도 같은 길이라 구역 안에서는 「들어가기」만.
- 참고: `Input/ClickControl.mlua`는 Space에서 점프 묶음만 떼고 Space를 직접 처리하지 않는다. 「NPC 곁 Space 우선」은 실제로는 마을에서 질주가 꺼지고 NpcWindow가 Space를 받는 구조였다 → 같은 NpcWindow 경로에 포털을 넣었다.

### 게이트 전수 (모두 적용)
| 종류 | 위치 | 수 | 적용 |
|---|---|---|---|
| 맵 출입구 WarpGate (맵 파일에 놓인 것) | 199개 맵 | 444개 (사각 구역 3 · 봉인 문 3) — `gates-all.tsv` | 예 (컴포넌트 공통) |
| 귀환 두루마리 짝 (FieldGate·TownGate) | `PlayerTravel.OpenTownPortal` → `SpawnPortal(ModelWarpGate)` | 사람마다 2 | 예 |
| 보스 처치 포털 | `PlayerTravel.OpenBossPortal` (Monster.mlua 731) | 60초 | 예 |
| 심도 문 DepthGate (다음 층·귀환·철수) | `DepthDirector.OpenDoor(ModelDepthGate)` | 층마다 | 예 (같은 규칙) |
| 마을 심도 입구 DepthGate | `tools/build/maps.cjs` (depthEnabled일 때만 놓음 — 지금 맵에 0개) | 0 | 코드 적용 |
- `GameConst.ModelWarpGate` 호출처는 `PlayerTravel.SpawnPortal` 한 곳. 강제 이동(사망 부활·시체·웨이포인트·`PlayerTravel:Go`)은 포털을 거치지 않아 그대로.

## 2) 마을 포털 자리와 이름표
- 추천안(적용): **광장 남쪽 가장자리 한 줄** — 줄 왼쪽 끝 (-4.5, 0.5), 6칸, 간격 1.8칸, 가운데부터 채움(3~4개면 도착 자리 정면 x -2.7~2.7). 넘치면 큰길 남쪽(y -3.0) 다음 줄. NPC·웨이포인트·심도 문과 1.6칸 미만이거나 막힌 칸은 건너뛴다. 네 마을이 같은 배치라 한 값(`PlayerTravel.TownPortalOrigin/Gap/RowGap/Cols/NpcClear`). 맵 파일은 고치지 않았다. 메이커에서 마을 y 0.5 줄(x -8~8)이 전부 걸을 수 있는 칸임을 확인(TOWNGRID).
  - 장점: 마을 도착 자리(0,-1.6) 바로 북쪽 2칸이라 도착하자마자 화면에 줄이 보인다 · 광장 가장자리라 남문 길·큰길 동선 밖 · 밟아도 이동하지 않아 지나다녀도 된다.
  - 단점: 광장 화로 앞을 일부 가린다 · 7개부터는 큰길 남쪽 둘째 줄이라 도착 화면 아래 HUD에 이름표가 가린다(다가가면 보임).
- 대안: **웨이포인트 바로 옆**(서쪽 광장 y 0.5, x -9.9~-4.5) — 장점: D2처럼 「떠나는 곳」이 한데 모임 · 단점: 도착 자리에서 5~10칸이라 도착 화면 밖, 상인(-8.5,2.5)과 가깝다.
- 이름표(`UI/Hud/HudMap.mlua`): 귀환 포털은 두 줄 「**주인**」/「가는 곳」을 포털 **아래**(캐릭터 이름표처럼)에. 내 것 하늘색 #7FD4FF(내 편 색) · 파티원 것 흰색 · 못 쓰는 남의 것 회색 #C4C4C4(투명도 0.88). 맵 출구는 예전처럼 위에 「▼ 가는 곳」. 이름표 최대 8개(Gate1~4는 GameHUD, 5~8은 Gate1을 런타임 복제 — UI 파일 수정 없음). 남의 포털은 미니맵엔 그대로 안 뜨고 이름표만 뜬다.
- 첫 시도(위에 달기)는 도착 화면에서 이름표가 위 HUD 쪽 한계(ui.y 380) 밖으로 밀려 안 보였다(`shots/6-…`) → 아래로 옮겼다. 위 큰 배너가 이름표를 가려(`shots/2-…`) 배너는 맵 출구만.

## 메이커 확인 (map01 · 슬롯 3 「핏빛망령」 Lv4 · 저장 끔 · 소리 0 · maker_save 0회)
- 01:12:43 MAKER-FREE 삭제 → 01:25:36 재생성. 플레이 4회(1회 기능 · 2~4회 표시 다듬기). 빌드 Error 0 (Warning 110 · 내 파일 0) · LEA- 0 · [SelfTest] 통과 409 / 실패 0 · npm test 21/21.
- 슬롯 고르기만 `_CharSelectWindow:PickSlot(3)` 직접 호출, 「입장」·「솔로 플레이」는 마우스 클릭. 매 플레이 서버 `PlayerSave.IsLoadSuccess=false` · 클라 `_SoundDirector:SetVolumes(0,0,0)`.

| 확인 | 입력 | 결과 (key-lines.txt) |
|---|---|---|
| 귀환 두루마리로 포털 열기 | **실제 키 3**(벨트 칸) | 01:14:24 `town portal slot=0 at=(-0.9,0.5)` · 사냥터 (6.3,-2.8) |
| 사냥터 포털 위를 걸어 올라가 3초 서 있기 | **실제 방향키** | `WALK1 d=0.01 inZone=true` → `WALK1+3s map=wasteland` (이동 없음) · `shots/1-…` |
| 구역 밖 Space | **실제 Space** | `dash charge used` · 마나 46→42.56 · 위치 이동 (질주) |
| 구역 안 Space | **실제 Space** | `WarpGate enter by input … -> town` · 질주 로그 없음 · 마나 그대로 |
| 마을 포털에서 Space로 복귀 | **실제 방향키+Space** | 01:16:27 `-> wasteland` · 주인이 지나가 짝 포털 닫힘(OwnerCloses 그대로) |
| 보스 처치 포털 | 포털 열기는 **서버 함수 호출**(`OpenBossPortal` — 보스 처치 대체), 진입은 **실제 방향키+Space** | 01:17:04 `-> town` · `shots/3-…` |
| 맵 출입구 (마을 남문 · 사각 구역) | **실제 방향키 5.5초**로 문까지 → 2.5초 서 있음 → **실제 Space** | `EXIT-PRE (0.00,-9.54) gate=GateToField` → 01:17:23 `-> wasteland` · `shots/4-…` |
| 심도 문(다음 층) | 문 놓기는 **서버 스폰**(심도 방 대체), 진입은 **실제 방향키+Space** | 안내 「더 깊은 층」 · `DepthGate enter by input action=next` |
| 마을 이름표 3~4개 | 다른 주인 3명은 **서버 스폰으로 흉내**(표시만) · 내 포털은 실제 키 3 | `styles=other,other,mine,other` · `compare-town-portals.png` |
| 포털 8개 | 서버 스폰 흉내 | 6칸 첫 줄 + 큰길 남쪽 2칸 · `gate label cloned i=5…8` · `shots/11-…` |
- 「전」 그림은 같은 빌드에서 예전 규칙을 서버 스크립트로 재현(예전 `FreeSpot((4,-3.6), 간격 2.6)` 자리 · 「가는 곳 - 주인」 한 줄 이름표). 예전 코드는 남의 포털 이름표를 아예 띄우지 않았는데, 전 그림은 파티원처럼 띄운 가장 좋은 경우다.

## 못 한 것 · 한계
- 파티원 포털(흰색) 화면: 사람 한 명으로는 파티를 만들 수 없어 못 찍었다(코드 분기만).
- 모바일 「들어가기」 단추 실제 터치·실기기: 못 했다(같은 Talk 단추 경로 · PC에서 「Space · …」 표시만 확인).
- 실제 보스 처치로 연 보스 포털·실제 심도 방 문: 함수 호출·스폰으로 대체.
- 질주 막기는 `SkillBook.MovePredictAt`에 기대는 우회라, 다른 차선이 질주 코드를 바꾸면 깨질 수 있다. SkillBook 작업이 끝나면 `HandleKeyDownEvent` Space 분기에 `_NpcWindow.ActiveGate` 확인 한 줄을 넣는 것이 정석.
- Space를 누른 그 순간 구역에 막 들어온(0.2초 안) 경우는 질주가 먼저 나갈 수 있다(안내 갱신 0.2초).
- 7개 이상일 때 둘째 줄 이름표는 도착 화면에서 아래 HUD 영역(ui.y < -230)이라 숨는다 — 다가가면 보인다.
- 사냥터에서는 내가 포털 위에 서면 아래 「Space · …」 안내 단추가 포털 아래 이름표를 가린다(`shots/10-…`은 한 걸음 옆).
- 녹화 없음(지시대로 maker_screenshot만).
