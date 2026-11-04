# 퀘스트 완료 보상 연출 D안 — 적용 · 메이커 검증 (11-04)

사용자 11-04 지시 「의뢰 보상 D안 연출도 적용한 뒤 검수할 수 있도록 전후 화면·실속도 영상으로 보고」의 적용분.
**적용 ≠ 승인** — 아래 영상·캡처로 사용자가 눈으로 최종 판단한다.

## 분류 (24개 · 큰 13 / 보통 11)

큰 = reward에 gen·unique·skp가 있거나 액트 마지막 의뢰. 부위 고르기 = 1·3·7·13·19, 액트 끝 = 6·12·18·24.

| # | 의뢰 | 액트 | reward | 분류 | 덧붙임 |
|---|---|---|---|---|---|
| 1 | 굶주린 굴 | 1 | skp:2,gen:3 | 큰 | 부위 고르기 |
| 2 | 가라앉은 지하실의 수장 | 1 | deploy:1,unique:1,choice:1 | 큰 | — |
| 3 | 사라진 병사의 유물 | 1 | gen:3,socket:1 | 큰 | 부위 고르기 |
| 4 | 피의 제단 | 1 | stp:5 | 보통 | — |
| 5 | 목 없는 처형인 | 1 | runes:1,choice:2 | 보통 | — |
| 6 | 묘지기 여왕 | 1 | unique:1 | 큰 | 액트 끝 연출 |
| 7 | 모래에 묻힌 대상 | 2 | gen:3 | 큰 | 부위 고르기 |
| 8 | 독침 여왕 | 2 | respoison:15 | 보통 | — |
| 9 | 메마른 우물의 혼 | 2 | skp:2,choice:3 | 큰 | — |
| 10 | 왕들의 봉인 | 2 | stp:5 | 보통 | — |
| 11 | 사원의 두 문지기 | 2 | runes:1 | 보통 | — |
| 12 | 모래 폐허의 대사제 | 2 | unique:1 | 큰 | 액트 끝 연출 |
| 13 | 난파선의 망자들 | 3 | gen:3 | 큰 | 부위 고르기 |
| 14 | 바위 집게 왕 | 3 | reslight:15 | 보통 | — |
| 15 | 선창에 갇힌 혼 | 3 | skp:2 | 큰 | — |
| 16 | 밀수꾼의 보물 | 3 | stp:5 | 보통 | — |
| 17 | 꺼진 등불 | 3 | runes:1 | 보통 | — |
| 18 | 익사한 제독 | 3 | unique:1 | 큰 | 액트 끝 연출 |
| 19 | 행군을 막아라 | 4 | gen:3 | 큰 | 부위 고르기 |
| 20 | 유황 여왕 | 4 | resfire:15 | 보통 | — |
| 21 | 갇힌 혼들 | 4 | skp:2 | 큰 | — |
| 22 | 악마의 모루 | 4 | stp:5 | 보통 | — |
| 23 | 잿불의 사제 | 4 | runes:1 | 보통 | — |
| 24 | 재의 왕 | 4 | unique:1 | 큰 | 액트 끝 연출 |

## 흐름

- **보통**: 대화 마지막 쪽 단추 줄 왼쪽에 보상 칩 줄(골드 · EXP · 그 밖) + 주 단추 「받기」. 받기 순간 서버 지급(PlayerQuest.RequestTurnIn) → 칩 아이콘이 가방 단추로 0.4초 곡선 비행 + 골드 숫자 굴림 + drop_gold → 지급 확인 뒤 대화 창 닫힘 → 다음 의뢰 표시.
- **큰**: 마지막 쪽 「완료」 → 결산 판 「퀘스트 완료 · 제목」(ui_raid_repelled_plate 틀 + 어두운 바탕) · 카드 최대 4장 0.15초 간격 1.15→1.0 · 카드별 소리 · 경험치 막대(lib progressBar) · 레벨이 오르면 LEVEL UP → 「받기」 → 카드가 실제 받은 물건 그림·이름으로 바뀌고 가방으로 비행 → 「확인」.
- **부위 고르기(1·3·7·13·19)**: 결산 판 「받기」 → 기존 보상 고르기 창(GearChoiceWindow) → 고른 뒤 지급 · 화면 가운데에서 가방으로 비행.
- **액트 끝(6·12·18·24)**: 판 앞 0.6초 어두워짐 + 금빛 빛기둥(fx_levelup_1~8 · fx_loot_beam · fx_loot_glow) + drop_unique → 결산 판 → 확인 → 이야기 카드(end·scene). 카메라 줌 없음.
- **유실 방지**: 띠·판을 띄운 순간 서버가 그 의뢰를 기억(ClaimArmed, 저장 안 함). 받지 않고 닫기·멀어짐·Esc → RequestAutoClaim(서버 자동 지급), 맵 이동 → 서버 OnMapLeave 자동 지급. 자동 지급은 비행 대신 알림 판 1개(「퀘스트 보상 · 제목」). 부위 고르기 의뢰는 고르기 전이라 자동 지급하지 않고 보관.
- 띠·판을 띄우지 않은 보고(예전 경로)는 안내 줄 + 알림 판 그대로.

## 메이커 확인 (슬롯 3 「핏빛망령」 · 저장 끔 · 의뢰 상태만 치트, 보고·받기·닫기는 실제 Space/Enter/Esc)

| 항목 | 결과 | 근거 |
|---|---|---|
| 빌드 Error 0 (Info 257 · Warning 104, 이전과 같은 종류) | 통과 | 새로고침 4회 모두 |
| 보통 q4 피의 제단 띠 → 받기 → 지급·비행·골드 굴림 → 창 닫힘 → 다음 의뢰 | 통과 | vrf.log `reward band claim q=4` → `granted … gold 1760->1904`, 영상 rec/normal-q4.mp4 |
| 큰 q1 굶주린 굴 (부위 고르기) 판 → 받기 → 고르기 창 → 투구 → 지급 | 통과 | `reward plate handoff q=1` → `gear choice done … slot=helm` → `granted q=1 … goldTotal=1800` |
| 큰 q2 가라앉은 지하실의 수장 (비고르기) 판 → 받기 → 유니크 카드가 실제 이름으로 → 확인 | 통과 | `reward plate claim q=2` → `granted … items=1`, 영상 rec/big-q2.mp4 |
| 액트 끝 q6 묘지기 여왕 어두워짐·빛기둥 → 판 → 확인 → 이야기 카드 end1·scene1 | 통과 | `reward plate intro (act end) q=6` → `story queued end1` (판 닫힌 뒤 shown), 영상 rec/actend-q6.mp4 |
| 받지 않고 닫기(Esc) — 띠 q5 · 판 q2(모바일) | 통과 | `reward band closed -> auto claim q=5` · `reward plate closed -> auto claim q=2` · 알림 판 |
| 맵 이동 자동 지급 q4 | 통과 | `quest reward granted q=4 mode=leave` → `ux show kind=quest 퀘스트 보상 · 피의 제단` |
| 모바일 미리보기(메이커 mobile = iPad 5세대 설정 그대로) 띠·판 배치 | 통과 | mobile-1·2·3.jpg — 왼쪽 HUD 잘림은 iPad 미리보기의 기존 현상 |
| PC 복귀 | 통과 | maker_set_platform pc (FHD) |

## 메이커에서 고친 것 (이전 차선 스크래치 대비)

1. 보상 띠가 초상화 칸부터 깔려 오렌 발치를 덮음 → 대사 칸 왼쪽(287)부터 (QuestRewardWindow.ShowBand).
2. 결산 판 틀 위 금빛 띠가 제목을 가로지름 → 제목·부제·카드·경험치 줄을 띠 아래로 (titleTop 58 · subTop 104 · cardsTop 146 · EXP 446).
3. 맵 이동 자동 지급이 띠 비행으로 처리돼 이동 화면에 가려 안 보임 → 자동 지급(auto·leave)은 띠·판을 거두고 알림 판으로.
4. 대사를 Space로 넘기던 연타가 판이 뜨자마자 받기까지 누름(카드 4장 + 경험치 0이면 0.8초 만에 ready) → 판이 뜬 뒤 0.8초는 받기 무시.
5. 판 제목 이름 Title → Heading: 공용 창 틀 검사(check_ui_tokens, 제목 26)의 대상이 아니라 습격 격퇴 판 계열이라.

## 추천값으로 정한 것 (되돌릴 수 있음)

- 받기 대기 0.8초(위 4) · 띠 시작 x=287 · 판 안 세로 배치(위 2).
- 판 「받기」·「확인」은 Space/Enter로도 누른다(대화 창과 같은 손).
- 액트 보스 유니크가 그 보스 전용 풀에 없으면 가방으로 들어가고 카드에 실제 이름이 뜬다(발밑 빛기둥은 전용 유니크일 때만 · 기존 TurnIn 규칙 그대로).

## 자료

- 전/후 비교: compare-normal-q4.jpg · compare-normal-q4-after-claim.jpg · compare-big-dialog.jpg · compare-actend.jpg
- 전(HEAD 64ee618a): before-normal-1-dialog · before-normal-2-after · before-actend-1-dialog · before-actend-2-storycard (부위 고르기 「전」은 docs/evidence/2026-11-03-release-smoke/shots/e4~e7)
- 후: after-normal-1-band-q5 · after-normal-2-band-q4 · after-normal-3-claimed-gold-roll · after-big-1~6 · after-actend-1~3 · after-auto-1-closed-without-claim · after-auto-2-map-leave
- 모바일: mobile-1-band-q4 · mobile-2-plate-q2 · mobile-3-plate-esc-autoclaim
- 실속도 영상(커밋 안 함, 로컬 rec/): normal-q4.mp4(11초) · big-q2.mp4(15초) · actend-q6.mp4(19초) — 앞뒤 1~3초 여유 포함, 각 *.start.txt = 녹화 시작 시각
- VRF 로그: vrf.log

## 못 한 것

- 실제 보스 처치·실제 의뢰 수행 경로는 이번 범위 밖(의뢰 상태는 치트로 「목표 달성」을 만듦, 보고부터는 실제 키).
- 판 틀 9조각 좌우 가장자리가 큰 판에서 늘어나 보이는 점은 그림 문제라 손대지 않음 — 사용자 눈 검수 대상.
- 메이커 키 입력이 녹화 중 50ms 짧은 누름을 놓친 적이 있어(게임 쪽 문제 아님) 액트 끝 영상은 120~150ms 누름으로 다시 찍음.
