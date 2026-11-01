# 11-01 결정 1-B·2-C·3-A·4-A·6-A — 메이커 확인 (11:09 ~ 11:49)

원본 체크아웃 HEAD fabb9c22(= origin/main). 메이커 단일 담당. 게임 코드·맵·ui 파일은 고치지 않았다. `maker_save` 한 번도 안 부름.
스크립트는 모두 실행 중 메이커에 넣은 런타임 스크립트(`scripts/`). 로그는 `logs/all.txt`(모든 줄, 시각 · S=서버/C=클라 · I/W/E) · `logs/key-lines.txt`(판정에 쓴 줄만) · 화면 `shots/`.

**표기**: 「준비」 = 상태를 만드는 조작(검증 대상 아님 · 서버 `PlayerTravel.Go` 등) · 「실제 입력」 = `maker_keyboard_input`(L·K·M·Esc·방향키) / `maker_mouse_input`(탭·칸·단추 클릭).

## 판정 요약

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | 새내기 입장 → `rank record … prev=nil` | 기대와 같음 | `rank_progress_0_c1 char=c4_63928683821328 name=새내기 value=4004 prev=nil` |
| 2 | L 성장 탭 「내 순위」 = Lv40 노말 | 기대와 같음 | 「내 순위 1위 · Lv40 · 노말 액트 4」 · `rank char … name=새내기` · `rank mine … rank=1 value=4004` |
| 3 | 보스 탭 기록 없음 · 5초 연타 | 기대와 같음 | 「내 순위 기록 없음」 · `rank mine board=rank_boss_ash_king_0_c1 rank=0 value=0` · 연타 7번 → `rank mine`은 판마다 첫 1번(직전 요청 5초 넘음)만, 나머지 5번 0 |
| 4 | 캐릭터 선택으로 → 인꾸 | 기대와 같음 | `name=인꾸 value=1721 prev=nil` · 목록 새내기·인꾸 따로 두 줄 · 「내 순위 2위 · Lv17 · 지옥 액트 1」 · 보스 탭 기록 없음 |
| 5 | 랭킹 탭 한 줄 · 장식 안 닿음 · 보스 탭 클릭 | 기대와 같음 | `rank tabs shown=2 rows=1 w=202 x=-109,109 …` · `rank show kind=boss_ash_king` · 확대 캡처 |
| 6 | 스킬 창 선택 보상 3칸 테 | 기대와 같음 (관찰 1) | rim=pending/picked/shown/locked 네 상태 모두 · `skill choice detail` · 테 두께 정상 |
| 7 | iPad 미리보기 5·6 | 기대와 같음 (클릭은 대체) | `windowfit screen=2048x1536 visibleW=1440.0 narrow=true` · 탭 한 줄 · 머리 줄 잘림 없음 · 탭/칸 클릭은 단추 사건으로 대신(사유 아래) |
| 8 | (선택) 탭 넷 배치 | 기대와 같음 (관찰 2) | `rank tabs shown=4 rows=2 w=202 x=-109,109,-109,109 actTop=-222 paperTop=-310 winH=752` |
| 9 | 남문 x −1·0·+1 아래만 | 기대와 같음 | `d=(-1.00,0.01) circle=false` · `d=(0.00,0.44) circle=true` · `d=(1.00,0.42) circle=false` → wasteland |
| 10 | 악몽·지옥 마을 | 기대와 같음 | town_nm x −1 `d=(-1.00,0.11) circle=false -> wasteland_nm` · town_hell x +1 `d=(1.00,0.20) circle=false -> wasteland_hell` |
| 11 | 6-A 말뚝 묶음 | 기대와 같음 (관찰 3) | 줌 100 캡처 · (4.5,−9.8) 왼쪽 → x 4.01 · (2.5,−8.5) 아래 → y −8.99 · 두 자리 겹침 없음 |
| 12 | 황무지 → 마을 (0,−1.6) | 기대와 같음 (관찰 4) | `DM at town (0.00, -1.60)` · 그 뒤 포털 이동 없음 |

## 0. 반영

- 시작: 편집 모드 · map01(`5a29ca07…` = `map/map01.map` 루트) · 원본 미커밋 tracked 47.
- 11:09:52 (편집 모드 확인 뒤) 6초 → `ui/GameHUD.ui`·`map/town.map`·`town_nm.map`·`town_hell.map`·바뀐 mlua 5개(RankingSystem·PlayerSave·RankWindow·SkillWindow·WarpGate) mtime만 갱신(node utimes · 내용 불변) → 6초 → `maker_refresh_workspace` 1번.
- 빌드 로그 11:10:08 · 365줄 · **Error 0 · LEA-1102 0** (`logs/build-1110-summary.txt`). WarpGate 줄은 예전부터 있던 StartMist LWA-1111 1 · PartyId LIA-1114 3뿐.
- 반영 확인 로그(refresh 1번으로 나옴 · 다시 refresh 안 함):
  - 클라 11:12:00 `[VRF] rank tabs shown=2 rows=1 w=202 x=-109,109 actTop=-166 paperTop=-218 winH=660`
  - 서버 11:15:09 `[VRF] WarpGate box ready gate=GateToField map=town at=(0.50,-9.50) half=(1.50,0.50) radius=0.60 -> wasteland` — 방(맵 66장)마다 이 줄은 마을 남문 하나만(악몽·지옥 방은 town_nm·town_hell 각 1줄). 다른 포털 줄 0.
- 매 플레이 SelfTest 410/0 · 런타임 오류는 SelfTest 의도 오류 1줄과 내 MakerScript 타이머 LEA-3051뿐(게임 코드 오류 0).
- `.codeblock`: refresh가 5개를 다시 썼지만(11:10:06) 내용 변화 0(이 확장 형식 codeblock에는 속성 목록이 없어 WarpGate.TriggerBox도 글자로 안 나옴) → **커밋할 .codeblock 없음**.

## 슬롯 백업 (시작)

- 11:12:26~11:13:01 server_main · 캐릭터 선택 화면 · 입장 전 `scripts/backup.lua`: 8키 BatchGet → `s48match=5/5`(슬롯 4 = S48 기준 그대로) · 슬롯 1 Char_1 3190/857729665 · Inv_1 3938/1790454507 · Shadow_1 9335/1552983935.
- 원문은 hex 조각 로그 → 오프라인으로 이어 붙여 len/djb2 8/8 대조 → `slots-at-start.json`.

## A. 랭킹 캐릭터 단위 (결정 1-B)

### 1. 새내기 입장
실제 입력: 캐릭터 선택에서 슬롯 4 칸 클릭(`selected=4`) → 「새내기」 입장 클릭 → 방 창 「솔로 플레이」 클릭.
- 11:15:10 서버 `[VRF] rank record board=rank_progress_0_c1 char=c4_63928683821328 name=새내기 value=4004 prev=nil` (4004 = Lv40·노말·액트 4 — S48 의뢰 기록 `act4`).
- 11:15:29 준비: 방 서버 guard(`scripts/guard.lua`) `slot=4 load=false`(저장 끔)·무적. 입장 때 선택 보상 카드 창(칸 1)이 자동으로 열려 **Esc 실제 입력**으로 닫음.

### 2. L 성장 탭 (`shots/A2-rank-progress-saenaegi.jpg` · `A2-rank-mine-crop.png`)
- 화면: 「1. 새내기 Lv40 · 노말 액트 4」 · 금빛 「내 순위 1위 · Lv40 · 노말 액트 4」 (Lv60 지옥 아님).
- 11:16:07 `rank show kind=progress` → 서버 `rank top board=rank_progress_0_c1 rows=1 shown=1 hidden=0 names=1` · `rank char … char=c4_63928683821328 name=새내기 hiddenAbove=0` · `rank mine board=rank_progress_0_c1 rank=1 value=4004`.

### 3. 보스 탭 + 연타 (`shots/A3-rank-boss-saenaegi.jpg`)
- 마우스 클릭 11:16:33 `rank show kind=boss_ash_king` → `rank mine board=rank_boss_ash_king_0_c1 rank=0 value=0` · 화면 「재의 왕 고르바스 최단 처치 (노말) / 아직 기록이 없습니다 / 내 순위 기록 없음」.
- 연타: 11:16:56~59 탭 7번(0.45초 간격, 성장↔보스) — `rank show` 7줄 · `rank mine`은 처음 성장 1·보스 1(각 판 직전 요청에서 5초 넘게 지남)만, 나머지 5번 0 ✅.

### 4. 인꾸 (`shots/A4-rank-progress-inkku.jpg` · `A4-rank-boss-inkku.jpg`)
- 준비: 슬롯 4를 지옥 방에 둔 채(C10) 방 서버 `IsLoadSuccess=true`(메뉴 이동은 저장 성공이 조건).
- 실제 입력: **M**(메뉴) → 「캐릭터 선택」 클릭 → 확인 창 「이동」 클릭 → 선택 창에서 슬롯 1 칸 클릭 → 「인꾸」 입장 클릭 → 「솔로 플레이」 클릭. (HUD 오른쪽 「메뉴」 그림 클릭은 단추에 안 닿고 캐릭터가 그 자리로 걸어감 → M 키로 열었다.)
- 11:35:26 `[VRF] rank record board=rank_progress_0_c1 char=c1_63927142517160 name=인꾸 value=1721 prev=nil` (인꾸 maxDiff 2 → 「지옥 액트 1」).
- L: 「1. 새내기 Lv40 · 노말 액트 4 / 2. 인꾸 Lv17 · 지옥 액트 1」 따로 두 줄 · 「내 순위 2위 · Lv17 · 지옥 액트 1」 · `rank top … rows=2 shown=2` · `rank char … char=c1_63927142517160 name=인꾸` · `rank mine … rank=2 value=1721`.
- 보스 탭: 기록 없음 · `rank mine board=rank_boss_ash_king_0_c1 rank=0 value=0`.
- 캐릭터 삭제 경로 · 슬롯 2 「인꾸 2」는 하지 않음.

## B. UI (결정 2-C·3-A)

### 5. 랭킹 탭 (`shots/B5-rank-tabs-crop.png`)
- 「성장 순위」·「보스 처치 시간」 모두 한 줄, 글이 양쪽 해골·마름모 장식 안쪽 — 닿지 않음. 보스 탭 클릭 `rank show kind=boss_ash_king` (3과 같은 클릭).

### 6. 스킬 창 머리 줄 「선택 보상」
| 상태 | 화면 | 로그 |
|---|---|---|
| 고를 차례 ×3 (새내기 입장 직후) | 초록 테 · 「고르기」 + 의뢰 이름 (`B6-header-pending-crop.png` · `B6-skillwin-saenaegi-pending3.jpg`) | `skill choice row slot=1..3 axis=pending tier=1 rim=pending` |
| 고를 차례 칸 클릭 | 스킬 창 닫히고 카드 창(칸 1) | `skill choice open reward slot=1` · 카드 「해골 하나 더」 → 확인 「고르기」(마우스) `choice pick slot=1 axis=command tier=1` |
| 고름 | 군단 트리색(청록) 테 · 아이콘 · 「선택 보상」 꼬리표 · 「노말」 (`B6-header-picked-crop.png` · `B6-slot1-picked-x4.png`) | `slot=1 axis=command tier=1 rim=picked` |
| 고른 칸 클릭 | 금빛 테 + 아래 공방 자리에 설명(이름 · 「선택 보상 · 가라앉은 지하실의 수장 · 노말」 · 지금/다음 단계) (`B6-header-shown-crop.png` · `B6-skillwin-slot1-shown-detail.jpg`) | `skill choice pick slot=1 shown=1` · `rim=shown` · `skill choice detail slot=1 axis=command tier=1` |
| 고름 ×3 (인꾸: 주문 보라 · 군단 청록 · 저주 빨강) | `B6-header-inkku-crop.png` | `axis=soul/command/curse rim=picked` |
| 의뢰 전 | 자물쇠 · 남회색 이름 「메마른 우물의 혼」 · 「의뢰 전」 · 남회색 테 (`B6-header-locked-crop.png` · `B6-slot3-locked-x4.png`) | `slot=3 axis=locked tier=0 rim=locked` |
- 의뢰 전 상태는 메이커 캐릭터(새내기·인꾸)에 없어서 **준비**: 인꾸 방 서버에서(저장 끔 상태) `ChoiceTiers 1,1,1 → 1,1,0` · `ChoicePicks`에서 칸 3 지움(런타임만 · 저장 안 됨 · 슬롯 1은 끝에 복원).
- 이름이 장식 위로 지나가는 곳 없음(칸에 장식 자체가 없음). 새 테(ui_loot_label 9조각)는 4배 확대에서도 가는 선 — 두껍게 늘어난 곳 없음.

### 7. iPad 미리보기 (`maker_set_platform mobile` = Apple iPad (5th gen) · 해상도 2048×1536)
- `[VRF] windowfit screen=2048x1536 visibleW=1440.0 narrow=true` ✅.
- 랭킹: 탭 한 줄 · 장식 안 닿음 (`B7-ipad-rank.jpg` · `B7-ipad-rank-tabs-crop.png`) · 보스 탭 (`B7-ipad-rank-boss.jpg`, 지옥 판 `rank_boss_ash_king_2_c1 rank=0`).
- 스킬 창: 머리 줄 「남은 포인트 4 숙련 6/93」 · 「선택 보상」 3칸 · 「초기화」 단추 모두 화면 안, 서로 안 겹침 (`B7-ipad-skillwin.jpg` · `B7-ipad-skill-header-crop.jpg`) · 칸 1 설명 금빛 테 (`B7-ipad-skillwin-slot1-shown.jpg`) · `rim=picked/pending` → `rim=shown` · `skill choice detail slot=1`.
- **대체(사유)**: iPad 미리보기에서 `maker_mouse_input` 클릭이 캐릭터 칸·탭에 닿지 않았다(메모리 함정 그대로 — 화면이 잘려 좌표 어긋남). 캐릭터 고르기·입장·솔로는 `_CharSelectWindow:PickSlot/Enter`·`_RoomWindow:Solo`(준비), 탭·칸 클릭은 그 단추에 `ButtonClickEvent` 보내기로 대신. L·K·Esc는 실제 키 입력.
- 끝나고 `maker_set_platform pc` (FHD) 되돌림.

### 8. 탭 넷 배치 (선택 · `shots/B8-rank-four-tabs.jpg`)
- 클라 준비 스크립트(지시 그대로) → 11:19:37 `[VRF] rank tabs shown=4 rows=2 w=202 x=-109,109,-109,109 actTop=-222 paperTop=-310 winH=752` · `rank show kind=depth`.
- 화면: 둘씩 두 줄 · 액트 넘김 막대와 기록 칸이 탭 아래 · 닫기 단추와 안 겹침. 그 플레이에서 바로 `LayoutTabs(false)`로 되돌림(`rank tabs shown=2 … winH=660`).

## C. 마을 남문 (결정 4-A·6-A)

### 9. 문 줄 세 칸 (노말 town · 줌 100)
준비: 방 서버 `PlayerTravel:Go('town', (x, −6.5))` → 도착 유예(2.5초) 지나 → **실제 입력 아래 방향키 3초만**.
| 칸 | 서버 로그 | 클라 |
|---|---|---|
| x −1 (−0.5) | 11:20:49 `WarpGate box warp gate=GateToField map=town d=(-1.00,0.01) circle=false -> wasteland` | `map transition cover → wasteland` · `DM at wasteland (-32.10, 0.50)` |
| x 0 (0.5) | 11:21:34 `d=(0.00,0.44) circle=true -> wasteland` | 같음 |
| x +1 (1.5) | 11:22:03 `d=(1.00,0.42) circle=false -> wasteland` | 같음 |
- 세 칸 모두 d.x가 출발 x 그대로(옆으로 안 비킴) · 마을 안 멈춤 0 · d.y ≤ 0.5.

### 10. 악몽·지옥 마을
- 같은 방(노말 방)에서 `Go('town_nm')`은 실패(방 맵이 난이도별 — 노말 방에 town_nm 없음) → 준비: 방 서버 저장 켬 → 클라 `_RoomSystem:RequestLeaveGame()`(메뉴 「게임 나가기」 확인과 같은 호출) → 로비 server_main에서 `_RoomSystem:Enter(p, 새 id, 1|2, true)`(혼자 하기와 같은 서버 함수 · 난이도 맞추기 포함).
- 악몽 방 11:29:05 `WarpGate box ready gate=GateToField map=town_nm … -> wasteland_nm` → x −1: 11:30:08 `WarpGate box warp gate=GateToField map=town_nm d=(-1.00,0.11) circle=false -> wasteland_nm` ✅
- 지옥 방 11:31:20 `… map=town_hell … -> wasteland_hell` → x +1: 11:32:22 `WarpGate box warp gate=GateToField map=town_hell d=(1.00,0.20) circle=false -> wasteland_hell` ✅
- 두 방 모두 입장 때 선택 보상 카드 창이 열려 Esc(실제)로 닫고 걸었다.
- 랭킹 영향 없음: 성장 값은 MaxDifficulty 기준이라 새 기록 줄 0(새내기 4004 그대로).

### 11. 6-A 오른쪽 말뚝 묶음 (줌 100 확인 `CameraComponent.ZoomRatio=100`)
- `C11-gate-right-stakes-zoom100-4.01.jpg`(지난 회차 `gate-right-niche-padr2.jpg`와 같은 구도 · 캐릭터 (4.01, −9.80)): 오른쪽 기둥과 캐릭터 사이 (2~4, −10)에 뾰족 말뚝 묶음이 보인다. 끝은 기둥 쪽.
- (4.5, −9.8) → 왼쪽 1.5초: `DM stop town from=(4.50, -9.80) end=(4.01, -9.80)` ✅
- (2.5, −8.5) → 아래 1.5초: `end=(2.50, -8.99)` ✅
- (2.5, −9.0) (`C11-at-2.5_-9.0-above-stakes.jpg` · `-crop-x2.jpg`): 캐릭터 발 아래로 말뚝 끝 — 말뚝이 캐릭터를 가리지 않고, 올라선 것처럼 보이지 않음 ✅.
- (4.5, −9.99) (위 자리에서 아래 실제 입력 → `end=(4.50, -9.99)` · `C11-at-4.5_-9.99-*.jpg`): 말뚝 오른쪽 끝(x≈3.96) 옆에 캐릭터 — 겹침 없음 ✅.
- 기둥 발 돌무더기 ↔ 말뚝 끝 (`C11-stakes-pillar-crop-x2.jpg`): **기둥·돌무더기가 앞, 말뚝 첫 끝이 기둥 뒤로 들어간다** — 말뚝이 기둥에 기대 놓인 모양.

### 12. 황무지 → 마을
- 준비: 황무지 도착 자리 (−32.1, 0.5) → 실제 입력 왼쪽 1.2초 → GateBack(−33.5, 0.5) → 11:24:11 `DM at town (0.00, -1.60)` ✅ → 그 뒤 포털 이동 0(다시 빨려 나가지 않음) ✅ (`C12-back-in-town-0_-1.6.jpg`).

## 슬롯 복원 · 끝 상태

- 11:43 새 플레이(PC) · 캐릭터 선택 화면(server_main) · 어느 캐릭터로도 입장하지 않음.
- 복원 전 조회 `match=0/8` (8키 모두 입장·이동 저장으로 바뀜 — 슬롯 4 diff 2 · Char_1 3191 등).
- `scripts/restore.lua` = `slots-at-start.json` 원문을 사전 치환으로 줄인 본문(코드 생성 · 로컬 Lua 5.4 모의 실행으로 guard 8/8 확인 뒤 전송).
  - 11:47:47 `[VRF] DM restore guard body match=8/8 …` → `BatchSetAndWait code=0 ok_keys=8`
  - **11:48:24 `[VRF] DM restore after code=0 match=8/8 Account=615/1340525624 Char_4=1126/1554558725 Inv_4=1838/694193390 Shadow_4=40/923051497 Stash=83/2144937209 Char_1=3190/857729665 Inv_1=3938/1790454507 Shadow_1=9335/1552983935`** → 슬롯 4 = S48 기준 5/5 · 슬롯 1 = 시작 원문 3/3.
- 11:48 `maker_stop` → `maker_get_current_map` = map01 · edit · 플랫폼 PC(FHD).
- 랭킹 저장소(정렬 판)는 되돌리지 않음: 새 판 `rank_progress_0_c1`에 새내기 4004 · 인꾸 1721 두 줄이 남는다(이번 확인의 기대 결과 · 옛 계정 판은 손대지 않음).
- `maker_save` 0회 · refresh 1회(11:10) · 원본 미커밋 tracked 47 유지.

## 관찰 (판정 아님 · 사용자 판단)

1. **선택 보상 「고름」 칸**: 아이콘 위 금빛 「선택 보상」 꼬리표 오른쪽 끝이 단계 글 「노말」 바로 앞에 붙어 「선택 보상노말」처럼 붙어 보인다(겹치지는 않음 · 간격 1~2px) — `B6-slot1-picked-x4.png`. PC·iPad 같음.
2. **탭 넷 배치(752)**: 창 아래 테두리 장식이 하단 메뉴 줄(인벤토리…그림자 추출) 바로 위에 닿을 듯 붙는다 — `B8-rank-four-tabs.jpg`. 심연이 꺼져 있는 동안은 보이지 않는 배치.
3. **6-A**: (2.5, −9.0)에 서면 캐릭터 왼쪽 절반이 오른쪽 기둥 그림 앞에 겹쳐 그려진다(지난 회차 x +1 관찰과 같은 모양 · 말뚝과는 무관). 말뚝 묶음은 캐릭터 대비 꽤 크다(폭 1.7칸).
4. **맵 이동 중 키 떼기 지연**: GateBack으로 마을에 들어갈 때 클라이언트가 맵을 불러오며 약 3.6초 멈췄고(0.25초 타이머 공백 t 3.1→4.75→6.8), 1.2초만 누른 왼쪽 키의 「뗌」이 4.8초 뒤에 전달되어 도착 뒤 (−5.3, −1.6)까지 걸어갔다(두 번 — 11:24 첫 번째 (−5.56)·11:27 재현은 `scripts/keytrace.lua` · `logs/all.txt` 11:27:24~37 `DM key down/up` · `DM trace`). 도구 입력 시각 문제일 수도 있으나 실제 손도 같은 멈춤을 겪는다. 다시 빨려 나가지는 않음.
5. iPad 미리보기 `windowfit over SkillWin outer=1440 limit=1408`(외곽 32 넘침 · 화면에선 잘림 없음) · `over CharSelect/RoomWin/AudioWin outer≈1960` · StoryHUD Card 4040 — 기존 경고.
6. 노말 방에서 `PlayerTravel.Go('town_nm')`은 「map transition cover → town_nm」 뒤 8초 만에 황무지로 돌아왔다(방에 맵이 없음 · 오류 줄 없음). 시험 도구에서만 생기는 경로.
7. 황무지 첫 입장 때 클라 `LWA-3010 두 개의 Global Overlay Light`(예전 회차 DarkVision 관찰과 같음).
8. 로그 지우기 때 읽은 수보다 1줄 많이 지워진 적 2번(11:37 247/246 · 11:42 270/269) — 그 사이 들어온 줄 2개 원문 없음(판정 줄은 모두 읽은 뒤).
