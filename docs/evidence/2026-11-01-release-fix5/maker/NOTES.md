# 11-01 출시 전 수정 5건 — 메이커 3회차 확인 (17:24 ~ 18:29)

원본 체크아웃 HEAD c77eb35c(브랜치 codex/player-experience-polish). 메이커 단일 담당. 게임 코드·맵·ui 파일은 고치지 않았다. `maker_save` 0회.
절차 = `../VERIFY-PLAN.md` §0~§7. 로그 `key-lines.txt`(판정 줄 · S=서버/C=클라) · `all-session-logs.txt`(이번 회차 받은 로그 전부 · PAD 제외). 스크립트 `scripts/`.
표기: 「실제 입력」 = `maker_keyboard_input`/`maker_mouse_input` · 「준비」 = 상태 만들기 · 「대체」 = 실제 입력이 안 돼 같은 함수를 부름(사유 적음).

## 판정 요약

| § | 항목 | 판정 | 근거 |
|---|---|---|---|
| 0 | 반영 | 통과 | 17:25:08 touch(87f8cdf2 뒤 바뀐 mlua 21 · act3 맵 48 · GameHUD) → refresh 1회 → 빌드 17:25 Error 0 · LEA-1102 0(Info 254 · Warning 103 = 예전 종류) · 플레이 클라 `rank layout kind=progress … winH=668 … rimBottom=-212` · SelfTest 406/0 |
| 1 | 랭킹 심연 액트 막대 ◀▶ | **부분 통과 / ▶ 가운데 실패(도구 좌표 의심)** | 심연 탭 실제 클릭 → `rank layout kind=depth paged=true head=76 … winH=704 … rimBottom=-248` · ▶ 가운데 (1459,812) 실제 클릭 **무반응**(지난 회차와 같음) · ▶ 틀 밖 누르는 칸 (1420,852) → `arrow click rank next act=1` → `rank top board=rank_depthrun_a2_0_c1` · 화면 「액트 2 · 모래 폐허」·점 2번째 금색 · ◀ 가운데 (1127,812) → `arrow click rank prev act=2` · 흰 네모 없음 · 제목 안 겹침 |
| 2 | 플레이어 창 쪽 넘김 | **부분 통과 / ▶ 가운데 실패(같은 원인)** | 10명 → `social render n=10 parties=0 solo=10 page=1/2` · ▶ 가운데 (1385,302) **무반응** · ▶ 누르는 칸 왼쪽 (1350,302) → `arrow click social next page=1` → `social render … page=2/2` → `social turn step=1 page=2` · ◀ (1173,255)(계획 점) → `arrow click social prev page=2` → `page=1/2` · 8번째 줄 「초대」 클릭 → `social invite click uid=…938`(쪽 안 넘어감) |
| 3 | 다른 방 초대 → 실제 클라 「수락」 | **통과** | 받는 방: `channel invite reply send to=…931 code=ok room=game:1bc5b5a6e57 wait=true ok=true beforeMove=true` → `board invite accept moving uid=… → 1bc5b5a6e57` · 초대한 방: `channel invite reply to=…931 code=ok`(지난 회차엔 없던 줄) · `room return → 1bc5b5a6e57` · `auto party join 20372100010779593 → 203721000107795931` · 화면 띠 「가상하나님으로부터 초대 - 수락 시 이동합니다」(`r3-invite-band-real-client.jpg`) · 로비 길(가상셋 수락 = 대체): `reply send … code=ok … beforeMove=true` → `reply to=… code=ok` → `channel invite accept from lobby … entered=true repliedBeforeMove=true` |
| 4 | 파티 색 띠·줄 바탕 | **통과** | 픽셀(1920 기준): 내 파티 띠 (107,195,254) · 다른 파티 띠 (254,179,89) · 줄 바탕 내 파티 (27,33,46) · 다른 파티 (51,31,20) — 지난 회차 보라/빨강 아님 · 흰 판 `ui_white_square` 정상(색이 설정값 그대로) (`r4-social-two-parties-colors.jpg` · `r4-r5-rows-x2.png`) |
| 5 | 줄 단추 「파티원」 | **통과** | 같은 방 파티원 줄 「파티원」 한 줄 · 민무늬 테 · 가운데 어두운 띠 없음 · 거래·살펴보기 같은 테 · 4배에서 글이 테에 안 닿음(`r5-partywon-chips-x4.png`) · 「초대」 실제 클릭 2회 정상(`social invite click …`) |
| 6 | 랭킹 칸 아바타·그림자 | **통과** | `rank rows kind=progress n=2 looks=1 shadow=1 myCell=1 mine=내 순위  1위 · Lv40 · 노말 액트 4` · 3배 캡처 보이는 몸 약 32~36×52 · 칸 안·이름과 안 겹침 · 인꾸(옛 줄) 그림자 모습 1배에서 보임(어두운 보라) · 내 순위 줄 그림 줄 안 (`r6-cells-x3.png` · `r6-mine-row-x2.png`) · 성장/보스/심연 탭 실제 클릭 정상 |
| 7 | iPad 미리보기 | **통과(진입은 대체)** | `windowfit screen=2048x1536 visibleW=1440.0 narrow=true` · 랭킹 탭 넷 한 줄 · 심연 막대 ◀▶ 창·화면 안 · 성장 칸 4개 한 줄 · 플레이어 창 1/2 ◀▶ 화면 안 · 칩 잘림 없음 (`r7-*.jpg`) · 진입(캐릭터 고르기·혼자 하기·심연 탭)은 `_CharSelectWindow:PickSlot/Enter` · `_RoomWindow:Solo` · `_RankWindow:Show('depth')` 대체(iPad 클릭 어긋남) |

## ◀▶ 실제 클릭 — 이번 회차에서 새로 안 것 (관찰 · 판단은 사용자)

- 88×88 투명 단추 구성은 의도대로 깔렸다: 누른 점 (1459,812)을 단추 로컬로 바꾸면 Next (-44, 0) = 정가운데 · 그 점을 담는 UI는 창 바탕과 Next뿐(덮는 요소 없음) · 정렬값·Selectable·Transition이 잘 눌리는 탭과 같다 · 화면 터치(ScreenTouchEvent)는 (1459,812) 그대로 도착(overUI=true).
- 그런데 `maker_mouse_input`이 단추 사건을 내는 자리는 **화면 오른쪽일수록 보이는 자리보다 왼쪽으로 밀려 있다**(`scripts/arrow-diag.lua` ⑥):
  - 랭킹 ▶(논리 1415~1503): 1380·1400·1420 반응 · 1440~1520 무반응 / ◀(1083~1171): 1070~1130 반응 · 1150·1170 무반응
  - **랭킹 창 닫기 X(이번 변경과 무관한 기존 88×88 단추): 가운데 1496 무반응 · 사각 밖 1440 반응** / 플레이어 창 ▶: 가운데 1385 무반응 · 1350 반응
  - 알파 0 → 0.01 → 0.3, 틀 그림 RUID 복사로 바꿔도 가운데 무반응(실험 후 원래 값으로 되돌림) → 투명·그림 문제 아님.
- 결론(추정): 기존 닫기 X도 같은 증상이라 **◀▶ 단추 자체 문제보다 메이커 마우스 도구의 UI 적중 좌표 어긋남**일 가능성이 크다. 누르는 칸을 88로 키운 덕분에 계획의 「틀 밖 · 누르는 칸 안」 점은 반응했다. **실제 마우스 확인은 하지 않았다**(이번 레인은 osascript 금지 → JXA 커서 이동 불가) → 실기기/실제 마우스로 ▶ 가운데 한 번 눌러 보면 확정된다.
- 같은 원인으로 스킬 창 시간선 48×48 칸(골편 투척 아이콘)도 실제 클릭이 안 닿아 대체로 골랐다(뼈 창 레인 NOTES).

## 준비·정리 (저장소)

- 가상 플레이어 9명(`add_virtual_player -nickname …` · uid = 내 uid 뒤 1~9 · 4LxSEC1~9). `-user_id/-profile_code`를 함께 주면 「too many arguments」로 실패 → 닉네임만.
- 시작 대조 18:13 `DMVP start` 1~4 = 지난 회차 시작 상태 4/4 · 실제 사용자 8키 = S48 기준 8/8(17:29 `DMSLOT`).
- 가상하나·가상둘·가상셋 LoadSlot(1) · 가상하나·가상둘 = 새 게임 방 `game:1bc5b5a6e57`(자동 파티) — `vp-rooms.lua`와 같은 준비.
- 정리 18:25~18:28(새 PC 플레이 · 캐릭터 선택 화면): 가상 1~3의 새 키 5개(Account·Stash·Char_1·Inv_1·Shadow_1) 삭제 → `DMVPR recheck` 4/4 시작 상태 · 성장 판 가상 줄 삭제 → `DMRC recheck rows=2`(새내기 4004 · 인꾸 1721) · 실제 사용자 슬롯 4 = S48 기준 5키 되돌림(`restore-main-5.lua` 그대로) → `DM restore after match=8/8`.
- 18:34~18:41 배우 촬영 보충(표식 · 그림자 시도)으로 새내기에 다시 들어가 저장이 바뀜 → 18:42~18:44 새 플레이·캐릭터 선택 화면에서 같은 5키 다시 되돌림 → `DM restore2 after match=8/8`(최종).
- 내 실수: 정리 결과 일부 줄(가상 3·4 · DMRC delete)을 읽기 전에 지움 → 읽기 전용 재조회(`DMVPR recheck`·`DMRC recheck`)로 결과 확인.
- 남은 것: 텔레메트리 first/pre-session 기록(가상 플레이어 · 지난 회차와 같은 종류) · 채널 공유 메모리 칸(600초 뒤 스스로 지워짐).

## 끝 상태
플레이 중지 · 편집 모드 · map01 · PC(FHD) · `maker_save` 0회 · refresh 1회(17:25) · 플레이 5회(PC · iPad · PC 정리 · PC 보충 · PC 되돌림) · ui/GameHUD 메이커 재기록 없음(git 변경 없음) · 새 .codeblock 없음.
