# 11-01 랭킹 창 2차 · 플레이어 창(채널 전원·초대·파티 표시) — 메이커 확인 (12:34 ~ 13:2x)

원본 체크아웃 HEAD 1813c94f(= origin/main). 메이커 단일 담당. 게임 코드·맵·ui 파일은 고치지 않았다. `maker_save` 한 번도 안 부름.
스크립트는 모두 실행 중 메이커에 넣은 런타임 스크립트(`scripts/`). 로그: `logs/key-lines.txt`(판정에 쓴 줄 · 시각 · S=서버/C=클라) · `logs/all.txt`(큰 묶음만 파일로 받은 원문) · 빌드 로그 `logs/build-1234.json`(첫 refresh) · `logs/build-1235.json`(둘째 refresh). 화면 `shots/`.

**표기**: 「실제 입력」 = `maker_keyboard_input`(L·K·P·Esc) / `maker_mouse_input`(칸·탭·단추 클릭) · 「준비」 = 상태를 만드는 조작(검증 대상 아님) · 「대체」 = 실제 입력이 안 되어 같은 서버/클라 함수를 직접 부른 것(사유 적음).
**다중 클라이언트**: 메이커 MCP에는 클라이언트 여럿을 띄우는 길이 없어 명령 콘솔 `add_virtual_player`(가상 플레이어 · 서버에만 있는 사용자, uid = 내 uid 뒤 1~9, ProfileCode 4LxSEC1~9)로 「채널 하나에 방 여러 개」를 만들었다. 가상 플레이어의 캐릭터 고르기·방 들어가기·받은 요청 답은 같은 서버 함수를 부르는 준비/대체다. 보내는 쪽(초대 클릭)·받는 쪽(받은 요청 띠 클릭)은 실제 클라(새내기)로 했다.

## 판정 요약

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | 입장 시 rank tabs · rank layout | 기대와 같음 | `rank tabs shown=2 rows=1 w=202 x=-109,109` · `rank layout kind=progress paged=false head=40 listTop=64 paperH=478 winH=668 winY=142 rimBottom=-212` (로비·게임 방 모두) |
| 2 | L 성장 탭: 빈 띠 없음 · 4×5 칸 · 칸마다 그림 · 내 순위 줄 · 메뉴 줄과 간격 · 옛 줄 그림자 → 자기 모습 | 기대와 같음 (관찰 1·2) | `rank top … rows=2 … looks=0` → `rank look fill char=c4_63928683821328 look=m-3-1-2-2` → 클라 `rank rows kind=progress n=2 looks=1 shadow=1 myCell=1 mine=내 순위  1위 · Lv40 · 노말 액트 4` · 다시 열면 `looks=1`(저장소에서 읽음) |
| 3 | 보스 탭: winH 그대로 · 빈 띠 없음 | 기대와 같음 | `rank layout kind=boss_ash_king … winH=668 … rimBottom=-212` · 「재의 왕 고르바스 최단 처치 (노말)」 |
| 4 | (선택) 심연 탭 켬 | 기대와 같음 / ◀▶ 다름 (관찰 3) | `rank tabs shown=4 rows=1 w=202 x=-327,-109,109,327` · `rank layout kind=depth paged=true head=76 listTop=100 paperH=514 winH=704 winY=124 rimBottom=-248` · 머리 줄 오른쪽 ◀▶ **실제 클릭이 단추 사건을 못 냄**(ButtonClickEvent 대체로는 액트 2 넘김 정상) |
| 5 | K 스킬 창 「선택 보상」 꼬리표 ↔ 「노말」 간격 | 기대와 같음 | 실제 입력으로 칸 1 고름 → `rim=picked` · 4배 전/후 비교 `shots/A5-slot1-picked-x4-before-after.png` (예전 붙음 → 지금 떨어짐) |
| 6 | iPad 미리보기 | 기대와 같음 (진입은 대체) | `windowfit screen=2048x1536 visibleW=1440.0 narrow=true` · 랭킹 창·칸·그림 화면 안 · 스킬 머리 줄 잘림 없음 |
| 7 | 채널 하나에 방 여러 개 | 기대와 같음 (가상 플레이어로) | 내 혼자 하기 방 `game:s1bc0d6a080f` · 가상 방 `game:1bc0fdf555b`(가상하나·가상둘 자동 파티) · 로비 `__main__`(가상셋·가상넷) |
| 8 | 기대 [VRF] 흐름 | 대부분 기대와 같음 · **실제 클라 수락만 다름 (관찰 4)** | 아래 B 표 |
| 9 | 화면(색 묶음 · 내 파티 맨 위 · 「(나)」 · 다른 방 단추 · 「내 파티 · 4명」 · 쪽 넘김) | 대부분 기대와 같음 · 색 띠 색 다름(관찰 5) · 「파티원」 두 줄(관찰 6) · ▶ 클릭 다름(관찰 3) | 대표 `shots/B9-REPRESENTATIVE-social-two-parties-one-solo.jpg` |
| 10 | 방 사이 이벤트(RequestSendEventToRoomAsync) | 전달 됨 | 초대·거절·수락 답 모두 `result=delivered` / `sent=true` / `reply … code=` (실제 클라 수락 때 답 하나만 안 옴 — 관찰 4) |

## 0. 반영

- 시작: 편집 모드 · map01(`5a29ca07…` = `map/map01.map` 루트) · 원본 미커밋 tracked 47. `ChannelInviteEvent.codeblock`은 12:26(체크아웃 때)부터 untracked로 이미 있었다(메이커가 새 파일을 보고 만든 것으로 보임).
- 12:34:37 (편집 모드 6초 뒤) `ui/GameHUD.ui` + 바뀐 mlua 7개(RankingSystem·RankWindow·SocialWindow·PartySystem·TownBoard·PlayerSocial·ChannelInviteEvent) mtime만 갱신(node utimes · 내용 불변) → 6초 → refresh 1.
  - 빌드 12:34:47: Error 1 = `LEA-1102 void OnData(string kind, integer diff, string digest, string mine)` @ RankingSystem.ShowBoard — RankWindow.OnData가 5인자로 바뀐 걸 RankingSystem이 옛 시그니처로 본 것(교차 파일 순서). `LEA-1118 ChannelInviteEvent`는 없음.
- 12:35:35 RankingSystem.mlua + GameHUD.ui 다시 touch → 6초 → refresh 2. 빌드 12:35:45: **369줄 · Error 0 · LEA-1102 0 · LEA-1118 0** (`logs/build-1235.json`). 바뀐 7개 스크립트의 줄은 LIA-1113/1114·LWA-1111뿐(예전부터 있던 종류).
- GameHUD 반영 확인: 플레이 시작 클라 `rank layout … winH=668 …`(새 값) · 랭킹 창·플레이어 창 모두 새 배치로 그려짐.
- `.codeblock`: refresh가 7개를 다시 썼지만 tracked 6개는 내용 변화 0 · **새 파일 `RootDesk/MyDesk/Social/ChannelInviteEvent.codeblock`만 커밋**.
- 매 플레이 SelfTest 410/0 · 런타임 오류는 SelfTest 의도 오류 1줄과 내 스크립트 실수(LEA-2002·LEA-2011, 관찰용 스크립트)뿐.

## 슬롯 백업

- 실제 사용자(ProfileCode 4LxSEC): 12:39:21 server_main · 캐릭터 선택 화면 · 8키 BatchGet → `match=8/8`(지난 회차 시작 원문 `../2026-11-01-decisions-maker/slots-at-start.json`과 같음 · 슬롯 4 = S48 기준) → 그 파일을 이번 기준으로 씀.
- 가상 플레이어 4명(4LxSEC1~4): 12:42:27 17키(Account·Stash·Char·Inv·Shadow·Char_1~4·Inv_1~4·Shadow_1~4) → `vp-slots-at-start.json`(len/djb2 대조 9/9). 1~3은 예전 회차가 남긴 이전 저장(Char·Inv·Shadow)만 있고 나머지 키 없음 · 4는 빈 계정. 가상 5~9는 캐릭터 선택 화면에만 있어 저장 안 함.


## A. 랭킹 창 2차 (커밋 1813c94f)

### 1. 입장 시 배치
- 로비 12:37:02 · 혼자 하기 방 12:44:09 · (실제 수락으로 옮긴 방 13:04:04) · iPad 13:06:06 모두 클라 `[VRF] rank tabs shown=2 rows=1 w=202 x=-109,109` · `[VRF] rank layout kind=progress paged=false head=40 listTop=64 paperH=478 winH=668 winY=142 rimBottom=-212` ✅.
- 실제 입력: 캐릭터 선택 칸 4 클릭 → 「새내기」 입장 → 「솔로 플레이」 → 방 `game:s1bc0d6a080f`. 입장 때 `rank record` 줄 없음(새내기 4004 그대로 = 「좋아질 때만」 기대대로). 준비: 방 서버 guard(저장 끔·무적).

### 2. L 성장 탭 (`shots/A2-rank-progress-saenaegi.jpg` · `A2-cells-x3.png` · `A2-avatar-*-x8.png` · `A2-mine-row-x2.png` · `A2-window-bottom-vs-menu.png`)
- 화면: 탭 바로 아래 판 제목 「레벨 · 가장 멀리 간 난이도·액트」 → 칸(빈 띠 없음) · 한 줄에 칸 4개 자리(2개만 기록) · 칸 = 순위 | 캐릭터 그림 | 이름 / 기록 · 1위 칸 노란 바탕(내 칸) · 아래 「내 순위 | 1위 | (내 그림) 새내기 | Lv40 · 노말 액트 4」 · 창 아래 테와 하단 메뉴 줄(인벤토리…) 사이 떨어짐.
- 12:44:49 서버 `rank top board=rank_progress_0_c1 rows=2 shown=2 hidden=0 names=2 looks=0` → `rank look fill char=c4_63928683821328 look=m-3-1-2-2` → 클라 `rank rows kind=progress n=2 looks=1 shadow=1 myCell=1 mine=내 순위  1위 · Lv40 · 노말 액트 4` — 처음 연 답부터 내 칸이 내 모습(머리 색·모양), 인꾸 칸은 그림자 모습 ✅.
- 12:51:13 다시 열기: `rank top … looks=1`(FillLook가 쓴 외형을 저장소에서 읽음) ✅.
- 44×56 칸 아바타: 실제 화면에서 약 20×33(게임 px) — 머리 색·모양은 알아볼 수 있음(8배 확대 `A2-avatar-saenaegi-x8.png`). 관찰 1·2.

### 3. 보스 탭 (`shots/A3-rank-boss-saenaegi.jpg`)
- 실제 입력: 「보스 처치 시간」 탭 클릭 → 12:45:23 `rank layout kind=boss_ash_king paged=false head=40 listTop=64 paperH=478 winH=668 winY=142 rimBottom=-212` ✅(창 크기 그대로) · 판 제목 「재의 왕 고르바스 최단 처치 (노말)」 · 「아직 기록이 없습니다」 · 내 순위 줄 「- | 새내기 | 기록 없음」 · `rank rows kind=boss_ash_king n=0 … mine=내 순위  기록 없음`.

### 4. (선택) 심연 탭 켬 (`shots/A4-rank-depth-four-tabs.jpg`)
- 준비(클라): `_GameData.depthEnabled=1` · TabDepth/TabWeek 켬 · `LayoutTabs(true)` → 12:45:56 `rank tabs shown=4 rows=1 w=202 x=-327,-109,109,327` ✅.
- 실제 입력: 「심연 최고 층」 클릭 → 12:46:10 `rank layout kind=depth paged=true head=76 listTop=100 paperH=514 winH=704 winY=124 rimBottom=-248` ✅ · 탭 넷 한 줄 · 머리 줄 왼쪽 「최고 층 · 같은 층이면 빠른 순 (노말)」 · 오른쪽 「◀ 액트 1 · 무덤 왕국 ▶」+ 점 4개 · 창 아래 테가 메뉴 줄 위로 떨어짐.
- **◀▶ 다름(관찰 3)**: ▶ 실제 클릭 6번(좌표 단추 안 — 화면 환산 x 1401~1465·y 780~844) 모두 `ButtonClickEvent` 없음. 대체(ButtonClickEvent 보냄) → `rank show kind=depth` · `rank top board=rank_depthrun_a2_0_c1` (액트 2) — 넘김 코드는 정상.
- 끝에 되돌림(depthEnabled=0 · 두 탭 끔 · `rank tabs shown=2 … x=-109,109`).

### 5. K 스킬 창 「선택 보상」 고른 칸 (`shots/A5-skillwin-slot1-picked.jpg` · `A5-slot1-picked-x4.png` · `A5-slot1-picked-x4-before-after.png`)
- 실제 입력: K → 칸 1(고르기) 클릭 → 카드 「해골 하나 더」 「이것으로」 → 확인 「고르기」 → K. 서버 `choice pick slot=1 axis=command tier=1`(저장 끔) · 클라 `skill choice row slot=1 axis=command tier=1 rim=picked`.
- 4배: 꼬리표 「선택 보상」과 「노말」 사이 뚜렷한 틈 — 지난 회차(B6, 붙어서 「선택 보상노말」)와 나란히 비교 ✅.

### 6. iPad 미리보기 (`shots/A6-ipad-rank.jpg` · `A6-ipad-rank-cells-x2.png` · `A6-ipad-skillwin.jpg`)
- `windowfit screen=2048x1536 visibleW=1440.0 narrow=true`. 진입은 대체(`_CharSelectWindow:PickSlot(4)/Enter()` · `_RoomWindow:Solo()` — iPad 미리보기 클릭 어긋남, 지난 회차와 같음). L·K·Esc는 실제 키.
- 랭킹 창: 창·탭·칸·그림·내 순위 줄 모두 화면 안 · 잘림 없음 · 한 줄 4칸이 보임(그때 판에 가상 계정 줄 3개가 있어 5칸 — 끝에 지움) · `rank rows … n=5 looks=4 shadow=1`.
- 스킬 창 머리 줄: 「남은 포인트 4 숙련 6/93」 · 「선택 보상」 3칸(고름 1 · 고르기 2) · 「초기화 · 110000 골드」 모두 화면 안 · 안 겹침 · 고름 칸 꼬리표↔「노말」 틈 유지.
- 끝나고 PC로 되돌림(아래).

## B. 플레이어 창(P) — 채널 전원 · 초대 · 파티 표시 (커밋 dc00c235 · 03243284)

### 7. 방 구성
| 사람 | 방 | 방법 |
|---|---|---|
| 새내기 (실제 클라 · uid 20372100010779593) | `game:s1bc0d6a080f` 혼자 하기 | 실제 입력 |
| 가상하나·가상둘 (…931·…932) | `game:1bc0fdf555b` (접두 s 없음 = 「다른 게임」) · 자동 파티(pid 1) | 준비: `PlayerSave:LoadSlot(1)` → `RoomSystem:Enter` (`scripts/vp-rooms.lua`) |
| 가상셋 (…933) | 로비 `__main__` · 캐릭터 고름 | 준비: LoadSlot(1) |
| 가상넷 (…934) | 로비 · 캐릭터 선택 화면(빈 계정) | 그대로 |
| 가상다섯~아홉 (…935~939) | 로비 · 캐릭터 선택 화면 | 쪽 넘김용(12:59) |

### 8. [VRF] 흐름
| 기대 | 결과 | 줄 |
|---|---|---|
| 방마다 `channel roster on` | 같음 | `room=__main__`(12:37:01) · `room=game:s1bc0d6a080f`(12:43:50) · `room=game:1bc11e3bc68`(13:03:03). `game:1bc0fdf555b`의 줄은 내가 읽기 전에 로그를 지워 원문 없음(그 방 chCalls=2·자동 파티 pid 1은 12:54:38 확인) |
| 들어올 때 `channel write … why=urgent ok=true` | 같음 | `room=game:s1bc0d6a080f n=1 why=urgent ok=true calls=2` 등 · 사람 수가 바뀔 때마다 urgent · 그 밖 `beat`·`full` |
| P → `channel rows viewer=… n=…` → `social render n=… parties=… solo=…` | 같음 | 12:54:51 `n=5 ok=true calls=7` → `social render n=5 parties=1 solo=3 page=1/1 got=true` |
| 「초대」 → 보낸 방 `sent=true` · 받은 방 `recv … result=delivered` | 같음 | 12:55:40 `channel invite 20372100010779593 → 203721000107795931 room=game:1bc0fdf555b sent=true` · `channel invite recv to=…931 … result=delivered` · `board invite delivered` |
| 거절 → `answer … accept=false` → `reply … code=no` · 알림 | 같음 (가상하나 거절 = 대체) | 12:56:01 · 알림 「가상하나님이 거절했습니다」(`shots/B8-notice-rejected.png`) |
| 바로 다시 → `invite cooldown` | 같음 | 12:56:20 `invite cooldown kind=party … left=9` (12:56:09 두 번째는 첫 초대 29초 뒤라 그대로 보내짐 — 내 타이밍) |
| 수락(게임 방 사람) → `board invite accept … moved=1` → `room return` → `auto party join` | 같음 (가상둘·가상하나 수락 = 대체) | 12:57:51 `board invite accept uid=…932 → s1bc0d6a080f moved=1` · `reply … code=ok` · 12:57:52 `room return → s1bc0d6a080f` · 12:57:53 `auto party join …932 → 20372100010779593` (가상하나도 12:58:36~39 같음) |
| 로비 사람 수락 → `channel invite accept from lobby … entered=true` | 같음 (가상셋 수락 = 대체) | 12:56:58 `… uid=203721000107795933 → s1bc0d6a080f entered=true` · `reply code=ok` · `auto party join …933 → …593` |
| 실제 클라가 받는 쪽 — 띠 · 거절 | 같음 | 13:01:46 띠 「가상넷님으로부터 초대 - 수락 시 이동합니다」(`shots/B8-receive-band-real-client.jpg`) → 실제 「거절」 13:01:59 `channel invite answer uid=20372100010779593 accept=false`(RespondRequest 경유) → 로비 `reply to=…934 code=no` |
| 실제 클라가 받는 쪽 — 수락 | **다름 (관찰 4)** | 13:03:28 실제 「수락」 → 방 옮김은 됨(`room return → 1bc11e3bc68` · `auto party join …931 → …593` · 새 방 클라 다시 시작) · 그러나 **`board invite accept … moved=` 줄 없음 · 초대한 방에 `reply … code=ok` 없음**(13:04까지) |

(실제 클라가 받는 쪽은 보내는 가상 플레이어가 서버에서 이벤트만 보냄 = 준비 · `RequestChannelInvite` 끝부분 본문 · 가상하나의 경우 `InviteCode=g` 확인.)

### 9. 화면
- 대표 `shots/B9-REPRESENTATIVE-social-two-parties-one-solo.jpg`(12:57:11): 「이 채널 5명 · 파티 2 · 혼자 1」 · 맨 위 「내 파티 · 2명 | 새내기 Lv40 (나) | 잿불 야영지」 · 「내 파티 · 2명 | 가상셋 Lv1 | 잿불 야영지 · 같은 곳 · 레벨 차로 결투 불가」(파티원 흐림 · 거래 · 살펴보기) · 「파티 · 2명」 가상둘·가상하나 붙어서(「다른 게임 · 노말」 · 「초대」만 — 결투·거래·살펴보기 없음 ✅) · 「혼자 | 가상넷 Lv1 | 로비」.
- 글자색: 내 파티 하늘 · 다른 파티 호박 · 혼자 기본색 ✅. 왼쪽 색 띠·줄 바탕은 **설정 색과 다르게 보임**(관찰 5).
- 「내 파티 · 4명」 태그 칸 한 줄 ✅ (`shots/B9-my-party-four.jpg` · `B9-tag-my-party-4-x3.png`) · 내 게임 가득일 때 로비 줄 「초대」 흐림 + 「로비 · 내 게임 인원 가득」 ✅.
- 쪽 넘김: 10명 → `social render n=10 parties=1 solo=6 page=1/2` · 「1 / 2」 ◀(흐림) ▶ (`B9-page1-of-2.jpg`) · 내 파티 4줄 + 혼자 4줄 · ▶ **실제 클릭 안 됨**(관찰 3) → 대체로 `page=2/2`(`B9-page2-of-2.jpg`, 2줄).
- 같은 방 줄 「파티원」 단추 글이 두 줄로 접힘(관찰 6).

### 10. 방 사이 이벤트
- `RequestSendEventToRoomAsync` 초대 6번 · 답 5번 모두 전달(`result=delivered` · `sent=true` · `result=OK`). 고치지 않음. 실제 클라 수락 1번만 답이 안 감(관찰 4).

## 관찰 (판정 아님 · 사용자 판단) — 고치지 않음

1. **랭킹 칸 그림 크기**: 44×56 칸 안의 아바타는 실제 화면에서 약 20×33px. 머리 색·모양(새내기 붉은 머리 · 가상 계정 검은 머리)은 1배에서도 구분되지만 얼굴은 안 보인다. 더 크게 원하면 `RANK.avatar`만 바꾸면 된다(README §7).
2. **그림자 모습(외형 없는 옛 줄)**: 그림자 색(0.13, 0.12, 0.16)이 칸 바탕(어두운 갈색)과 대비가 낮아 1배에서 거의 안 보인다(`A2-avatar-inkku-shadow-x8.png` · 인꾸 칸). 「모르는 모습」 뜻은 전달되나 빈칸처럼 보일 수 있다.
3. **◀ ▶ 화살표 단추가 메이커 마우스 클릭을 못 받음** — 랭킹 창 심연 머리 줄(`RankWin/Paper/ActBar/Next`)·플레이어 창 쪽 넘김(`SocialWin/Pager/Next`) 둘 다. 클릭 좌표가 단추 사각형 가운데(화면 환산으로 확인)이고 그 점을 덮는 다른 요소 없음(레이캐스트 요소 = 창 바탕과 그 단추뿐) · 단추 Enable · 스프라이트 RaycastTarget true · CanvasGroup 없음(탭 단추와 같은 구성)인데 `ButtonClickEvent`가 안 온다. 같은 창의 탭·초대·수락/거절 단추는 같은 도구로 잘 눌렸다. 단추 사건을 직접 보내면 넘김은 정상(액트 2 · 쪽 2/2). **메이커 도구 한계인지 실제 버그인지 미확인 — 실제 마우스로 한 번 눌러 확인 필요.**
4. **실제 클라가 다른 방 초대를 「수락」했을 때 초대한 사람에게 답이 안 감**: 이동은 된다(로비 → `room return` → 그 방 → 자동 파티). 그러나 `TownBoard.AnswerInvite`의 `MoveUsersToStaticRoom` 뒤 줄 — `[VRF] board invite accept … moved=` 로그와 `Reply(…, "ok")` — 이 실행되지 않았다(초대한 방에 `reply … code=ok` 없음 · 「…님이 초대를 수락했습니다」 알림 없음). 같은 함수를 서버 스크립트로 부른 가상 플레이어 수락 3번은 둘 다 나왔다. 클라 RPC(`RespondRequest` @Server)로 불린 실행이 그 사용자가 방을 떠나는 순간 끊긴 것으로 보인다(추정). 고치려면 Reply를 이동 전에 보내거나 이동 실패 처리와 나눠야 할 듯 — 판단은 사용자/부모.
5. **파티 색 띠·줄 바탕 색이 설정과 다르게 보임**: 코드는 Mark 색 = 파티 색(내 파티 #6CC4FF · 다른 파티 #FFB45A), Bg = 파티 색 × 0.16을 넣는다(실행 중 값 확인). 그런데 화면 픽셀은 띠가 내 파티 (80,34,66) 보라 · 다른 파티 (190,31,23) 빨강 — Mark/Bg 스프라이트 그림 자체가 붉은색이라 곱해진 것으로 보인다(흰 그림이 아님). 글자색(태그·이름)은 설정대로라 묶음은 구분되지만, 「같은 색 띠」 의도와 다르고 파티가 많아지면 띠 색끼리 구분이 약해질 수 있다.
6. **같은 방 줄 「파티원」 단추 글이 「파티 / 원」 두 줄로 접힘**(`B9-partywon-button-x4.png`) — 단추 폭에 세 글자가 안 들어간다.
7. 가상 플레이어로 대신한 범위: 다른 방 사람의 캐릭터 고르기·방 들어가기(같은 서버 함수) · 받은 요청 답(`RespondRequest` 본문) · 실제 클라에게 보내는 초대 이벤트(`RequestChannelInvite` 끝부분 본문). 보내는 클릭·받는 클릭·P 창 화면은 실제 클라로 확인. 여러 실제 클라(다른 기기)의 화면은 확인 못 함.
8. 방을 옮기는 사람이 있으면 잠깐 채널 인원이 하나 적게 보인다(13:02:46 `n=9` — 가상하나가 로비→새 방 사이). 곧 `n=10`으로 돌아옴. README가 말한 설계 그대로.
9. 가상 플레이어도 Telemetry(PlayTelemetry 전역 저장소)에 「first join · pre-session」 기록을 남겼다(uid 2037…931~939). 게임 저장·랭킹은 되돌렸지만 텔레메트리 줄은 그대로 둠(메이커 시험 기록 · 실제 사용자 세션도 매번 남는 곳).
10. 실제 클라가 수락으로 옮길 때 저장을 켜 둬서(준비) 그 순간 새내기 저장이 됐고, 옮긴 방에서 칸 1 고름이 남아 카드 창이 칸 2부터 열렸다 — 끝에 S48 기준으로 되돌림(아래).
11. 내 실수로 로그를 읽기 전에 지운 적 3번(12:47 6줄 · 12:48 2줄 · 12:54 62줄 — 가상 방 부팅 줄 포함). 판정에 쓴 줄은 모두 다시 확인했다(위 표에 적음).

## 정리 · 슬롯 복원 · 끝 상태

- 랭킹 저장소: 가상 계정 캐릭터가 게임 방에 들어가며 성장 판에 줄 3개(`4LxSEC1/2/3_c1_…` = 101)가 생김 → `scripts/rank-cleanup.lua`로 찾기만 → 적용(정렬 판·`rank_names_c1`·`rank_looks_c1`에서 그 3키만 지움) → `after rows=2`(새내기 4004 · 인꾸 1721). 새내기 줄의 외형(`rank_looks_c1` · `m-3-1-2-2`)은 이번 확인의 기대 결과로 남김.
- 가상 계정 저장: 들어가며 생긴 Account·Stash·Char_1·Inv_1·Shadow_1(1~3)만 지움 → 4계정 모두 시작 상태와 같음(`vp-restore.lua` 찾기만 → `vp-restore-apply.lua`).
- 실제 사용자: 13:12 `scripts/restore-main-5.lua`(슬롯 4 = S48 기준 5키 · guard 5/5) → before 3/8(슬롯 1 3키는 그대로) → `BatchSetAndWait code=0 ok_keys=5` → **after 8/8**.
- **최종 재조회(새 PC 플레이 13:15 · 입장 전)**: 실제 사용자 8/8 · 가상 4계정 match=true · 성장 판 2줄 ✅. 그 뒤 정지.
- 끝: 플레이 중지 · 편집 모드 · map01(`5a29ca07…`) · PC(FHD) · `maker_save` 0회 · refresh 2회(12:34·12:35).
- 원본 미커밋 tracked: 시작 47 → **48** — `ui/GameHUD.ui`를 메이커가 12:36:27(두 번째 refresh 뒤, 첫 플레이 전)에 다시 써서(+135,210/−123,974줄, 내 손 수정 없음) 바뀜. 다른 미커밋 ui 17개와 같은 「메이커 재기록」으로 보임. 되돌리지 않고 커밋하지도 않음(부모 판단).
- 남은 것: 텔레메트리(PlayTelemetry)의 가상 플레이어 first/pre-session 기록(관찰 9) · 채널 공유 메모리 `ChannelRosterV1`의 방 칸(600초 지나면 스스로 지워짐).

## 파일
- `logs/key-lines.txt` — 판정 줄 전부(시각순) · `logs/all.txt` — 파일로 받은 큰 로그 묶음 2개 원문(방 입장·iPad) · `logs/build-1234.json`·`build-1235.json` — 빌드 로그 원문.
- `scripts/` — backup(실제 사용자 8키 대조) · vp-backup · vp-rooms · b-prep-snippets(B 준비·대체 원문) · guard · rank-cleanup · vp-restore(찾기만) · vp-restore-apply · restore-main-5 · final-check.
- `vp-slots-at-start.json` — 가상 계정 시작 원문(실제 사용자 원문은 `../2026-11-01-decisions-maker/slots-at-start.json` 그대로 = 이번 시작과 8/8).
- `shots/` — A2·A3·A4·A5·A6 · B8(알림·받은 띠) · B9(대표 · 넷 파티 · 쪽 1/2·2/2 · 색 띠·「파티원」 확대).
