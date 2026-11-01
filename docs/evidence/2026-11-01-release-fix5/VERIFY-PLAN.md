# 메이커 3회차 확인 절차 — 출시 전 수정 5건 (실제 입력 흐름)

원칙: 함수 직접 호출 말고 실제 입력(`maker_mouse_input` · `maker_keyboard_input`)으로. 대체(직접 호출)를 쓰면 사유를 적는다. 판정 = 아래 기대 `[VRF]` 줄 + 화면.
마우스 좌표 = PC(FHD 1920×1080) 화면 픽셀 · **아래가 0** (지난 회차 ▶ 옛 가운데 (1433, 812)와 같은 환산). 클릭 전 그 단추 `[VRF]` 줄로 좌표를 먼저 확인한다.

## 0. 반영
1. 편집 모드 · 플레이 중지 → 5초 → 바뀐 파일 touch → refresh **한 번** (메모리 「메이커 UI 함정」): ui 폴더 GameHUD · `UI/Core/UIKit.mlua` · `UI/Windows/RankWindow.mlua` · `UI/Windows/SocialWindow.mlua` · `Social/TownBoard.mlua` · `Social/RoomSystem.mlua` · `Data/GameData.mlua`.
2. 빌드 로그 Error 0. 특히 `LEA-1102`(교차 파일 시그니처 — TownBoard가 새 `RoomSystem.EnterWith`·`TownBoard.ReplyNow`를 부른다)가 남으면 TownBoard.mlua만 다시 touch → refresh 한 번(지난 회차 RankingSystem과 같은 순서 문제).
3. 플레이 시작 클라 `[VRF] rank layout kind=progress … winH=668 … rimBottom=-212`(창 크기 그대로) · SelfTest 실패 0.

## 1. 랭킹 창 심연 액트 막대 ◀ ▶ (관찰 3)
- 준비(클라 스크립트 · 검증 대상 아님): `_GameData.depthEnabled=1` · TabDepth/TabWeek 켬 · `_RankWindow:LayoutTabs(true)` (지난 회차 A4와 같다).
- 실제 입력: **L** → 「심연 최고 층」 탭 클릭 → `[VRF] rank layout kind=depth paged=true head=76 … winH=704 … rimBottom=-248`.
- 실제 입력: **▶ 가운데 (1459, 812)** 클릭 → 기대 `[VRF] arrow click rank next act=1` → `[VRF] rank show kind=depth` → 서버 `[VRF] rank top board=rank_depthrun_a2_0_c1 …` · 화면 「액트 2 · 모래 폐허」 · 점 2번째 금색.
- 실제 입력: **▶ 틀 밖 · 누르는 칸 안 (1420, 852)** 클릭(틀 64 바깥 · 누르는 칸 88 안) → `act=2` → 액트 3. (누르는 칸이 넓어진 것 확인)
- 실제 입력: **◀ 가운데 (1127, 812)** 클릭 → `[VRF] arrow click rank prev act=3` → 액트 2.
- 화면: ▶ 틀 모양·자리가 예전과 같은지(틀 64 · 막대 오른쪽 안쪽 12) · 제목 글이 ◀▶와 안 겹침 · 첫/끝 액트에서 틀만 흐리고 **흰 네모가 보이지 않음**(투명 누르는 칸에 색이 들어가면 흰 판이 보인다).
- 그래도 단추 사건이 안 오면: 맥 실제 마우스로 한 번 눌러(메모리 「메이커 측정 함정」 — 커서는 JXA) 도구 한계인지 가른다. 단추 사건 직접 보내기는 대체로만.
- 끝에 되돌림(depthEnabled=0 · 두 탭 끔 · `LayoutTabs(false)`).

## 2. 플레이어 창 쪽 넘김 ◀ ▶ (관찰 3)
- 준비: 명령 콘솔 `add_virtual_player`로 9명(지난 회차와 같다 · 채널 10명 → 2쪽).
- 실제 입력: **P** → `[VRF] social render n=10 … page=1/2` · 화면 「1 / 2」 · ◀ 틀 흐림.
- 실제 입력: **▶ 가운데 (1385, 302)** 클릭 → `[VRF] arrow click social next page=1` → `[VRF] social turn step=1 page=2` → `[VRF] social render … page=2/2`.
- 실제 입력: **◀ 틀 아래 · 누르는 칸 안 (1173, 255)** 클릭 → `[VRF] arrow click social prev page=2` → `page=1/2`.
- 화면: 쪽 넘김 틀이 예전 자리·크기(88×62) · 마지막 줄(8번째) 단추와 누르는 칸이 안 겹침(8번째 줄 「살펴보기」를 눌러 쪽이 넘어가지 않는지).

## 3. 다른 방 초대 → 실제 클라 「수락」 → 초대한 쪽 답 (관찰 4)
메이커 MCP는 실제 클라이언트가 하나라, 지난 회차처럼 **보내는 쪽 = 가상 플레이어(서버 스크립트로 초대 이벤트만 보냄 · 준비)** · **받는 쪽 = 실제 클라(새내기)**로 확인한다.
- 준비: 새내기 = 혼자 하기 방(`game:s…`) · 가상하나 = 다른 게임 방(`game:…` · 자동 파티)에서 새내기에게 `RequestChannelInvite` 끝부분 본문으로 초대 이벤트(지난 회차 `scripts/b-prep-snippets.lua`).
- 받는 방 서버 `[VRF] channel invite recv to=<새내기> … result=delivered` · 실제 클라 화면 받은 요청 띠 「가상하나님으로부터 초대 - 수락 시 이동합니다」.
- 실제 입력: 띠 「수락」 클릭 → 기대(받는 방 서버, 순서대로):
  1. `[VRF] channel invite reply send to=<가상하나 uid> code=ok room=game:<가상 방> wait=true ok=true beforeMove=true`
  2. `[VRF] board invite accept moving uid=<새내기> → <가상 방 id>`
  3. (끊길 수 있음 — 없어도 정상) `[VRF] board invite accept uid=… moved=1`
- 기대(초대한 방 서버): `[VRF] channel invite reply to=<가상하나 uid> code=ok` (지난 회차엔 이 줄이 없었다).
- 기대(로비 → 그 방): `[VRF] room return → <가상 방 id>` · `[VRF] auto party join <새내기> → <가상하나>`.
- (로비 길) 새내기가 로비(캐릭터 고른 뒤 방 창)에 있을 때 같은 초대 → 「수락」 → `[VRF] channel invite reply send … code=ok … beforeMove=true` → `[VRF] room enter game:<가상 방> …` → 초대한 방 `reply to=… code=ok`.
- **메이커에서 못 보는 것**: 실제 클라 둘(초대한 사람도 실제 클라)일 때 초대한 사람 화면의 알림 「…님이 초대를 수락했습니다」 — 실기기 두 대(또는 두 계정)로 확인.

## 4. 파티 색 띠·줄 바탕 (관찰 5)
- 2번 상태(새내기 파티 + 다른 파티)에서 P → 화면 픽셀: 내 파티 줄 왼쪽 띠 ≈ (108,196,255) 하늘 · 다른 파티 띠 ≈ (255,180,90) 호박 · 줄 바탕은 그 색을 아주 옅게(어두운 바탕 위 16%). 지난 회차 값(보라 (80,34,66) · 빨강 (190,31,23))이 아니면 통과.
- 흰 판 그림(`ui_white_square` = msw-ui-kit Tint_Square `f8c7c91b…`)이 메이커에서 실제로 흰 사각으로 불러와지는지(빈 칸·다른 모양이면 실패 — 이 RUID는 이 프로젝트에서 처음 씀).

## 5. 줄 단추 「파티원」 (관찰 6)
- 같은 방 파티원 줄: 「파티원」이 **한 줄** · 단추 테가 민무늬(장식 없음 · 가운데 어두운 띠 없음) · 결투·거래·살펴보기도 같은 테 · 「초대」·「파티」 누름 정상(실제 클릭 → `[VRF] social invite click …`).
- 4배 캡처로 글이 테 선에 닿지 않는지.

## 6. 랭킹 칸 아바타 · 그림자 모습 (관찰 1·2)
- L 성장 탭: 칸 그림이 예전(약 20×33)보다 크게 — 보이는 몸 약 36×54(칸 높이 62 안 · 머리 위·발 아래 여유 3~4) · 이웃 칸·이름 글과 안 겹침 · 1줄 칸 머리 위 빈 캔버스가 탭 누름을 막지 않음(성장·보스 탭 클릭 정상).
- 옛 줄(인꾸 · 외형 없음): 그림자 모습이 1배에서 보임(어두운 보라 · 내 칸의 원래 색과는 구분) · `[VRF] rank rows … shadow=1`.
- 내 순위 줄 그림(56×70 칸)도 줄 안 · 이름과 안 겹침.
- 실측 비율(`RANK.avatarFill` 0.56·0.68)이 다르게 보이면(몸이 칸 위로 잘림 · 너무 작음) 그 값만 고치고 다시 빌드(`check_ui_tokens`·`release_fix5`가 같은 값으로 잰다).

## 7. iPad 미리보기
- `maker_set_platform mobile`(iPad): 랭킹 창(심연 막대 포함)·플레이어 창(쪽 넘김) 화면 안 · ◀▶ 누르는 칸이 화면 안 · 줄 칩·아바타 잘림 없음. 진입은 지난 회차처럼 대체 가능(iPad 클릭 어긋남).

## 메이커에서만 확인되는 것 (오프라인 검사로 못 보는 것)
- ◀▶ 실제 마우스 클릭이 단추 사건을 내는지(엔진 적중 판정 — 관찰 3의 엔진 안쪽 원인) · 투명 누르는 칸이 보이지 않는지.
- 실제 클라 수락에서 답이 이동 전에 실제로 전달되는지(`RequestSendEventToRoomAndWait`가 RPC 안에서 기다리는지 · 이동 순간 끊김 동작).
- 흰 판 RUID가 흰 사각으로 그려지는지 · 파티 색 픽셀 값.
- 칩 테(ui_loot_label)의 9조각 모양 · 「파티원」 한 줄(엔진 글꼴 폭).
- UI 아바타가 64×80 칸에서 예상한 비율(몸 0.56×0.68 · 발 아래 0.02)로 그려지는지 · 그림자 색의 실제 보임.
- 두 실제 클라 사이 초대 수락 알림(실기기).
