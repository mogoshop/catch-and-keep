# 11-01 출시 전 수정 5건 — 메이커 2회차 「기대와 다름」 (랭킹 창 2차 · 플레이어 창)

근거: `../2026-11-01-rank-social-maker/NOTES.md` 관찰 1~6. 메이커는 쓰지 않았다(오프라인 검사·미리보기만). 실화면 확인은 `VERIFY-PLAN.md`.
기준 origin/main 87f8cdf2. UI는 생성기(`tools/build/ui.cjs` → UIBuilder)로만 다시 만들었다 — 커밋에 들어간 생성물은 ui 폴더의 GameHUD뿐(다른 HUD는 이 레인과 무관해 커밋 상태로 되돌림).

## 건별 원인 · 바꾼 곳

| # | 관찰 | 원인 | 바꾼 곳 |
|---|---|---|---|
| 1 | ◀▶ 실제 클릭이 단추 사건을 못 냄 (랭킹 심연 막대 · 플레이어 창 쪽 넘김) | 눌리지 않은 두 단추만 공통으로 ① 터치 칸이 88 미만(64×64 · 88×62) ② 폭이 btn_frame 9조각 좌우 테두리 합(48+48=96)보다 좁음 — 같은 창에서 눌린 단추(탭 202 · 초대 104 · 수락 180)는 모두 96보다 넓다 ③ 막대 제목 글 칸(w−170)이 ▶ 왼쪽 17px를 덮음(빌더 자동 피벗 때문에 단추가 설계보다 32px 안쪽). ButtonComponent·RaycastTarget은 있었다. 엔진 안쪽 원인(9조각이 접힌 판의 적중 판정 등)은 메이커에서만 확정된다 | 넘김 단추 = 보이는 틀 `…Art`(btn_frame 그대로 · RaycastTarget 끔 · 먼저 그림) + 그 위 **투명 단추 88×88**(ButtonComponent · Simple · RaycastTarget 켬 · ◀▶ 글) — `kit.arrow` · `kit.actPager` · 쪽 넘김. 제목 글 칸 = 두 누르는 칸 안쪽만(420 막대 232). 쪽 넘김 누르는 칸은 아래로만 넘침(위로 넘치면 마지막 줄과 1px 겹침). 흐리게는 틀에만(`UIKit.ArrowArt` · `SocialWindow.Render`). `[VRF] arrow click rank next/prev act=` · `[VRF] arrow click social next/prev page=` · `[VRF] social turn step= page=` |
| 2 | 실제 클라가 다른 방 초대를 수락하면 초대한 쪽이 답을 못 받음 | 수락 실행은 받는 사람의 `PlayerSocial.RespondRequest`(클라 RPC) 안 → `TownBoard.AnswerInvite` → `MoveUsersToStaticRoom`. 그 사람이 방을 떠나는 순간 실행이 끊겨 뒤의 로그·`Reply("ok")`가 돌지 않았다(가상 플레이어 = 서버 스크립트 호출은 실행 주체가 달라 끝까지 돌았다). 로비 길(`RoomSystem.Enter` → `MoveUserToInstanceRoom` 뒤 Reply)도 같은 위험 | **답을 방 이동 전에 보낸다.** 게임 방 길: `ReplyNow`(= `RequestSendEventToRoomAndWait` · 전달 끝까지 기다림) → 이동 → 실패면(실행이 이어짐) `Reply("cant")`. 로비 길: `RoomSystem.EnterWith(…, beforeMove)` — 저장 준비 뒤 · 이동 직전에 `ReplyNow("ok")`, 못 들어가면 `cant`. `[VRF] channel invite reply send to= code= room= wait=true ok= beforeMove=true` (보냄) · 기존 `[VRF] channel invite reply to= code=` (받음) · `[VRF] board invite accept moving uid=` |
| 3 | 파티 색 띠·줄 바탕이 설정 색과 다름 (하늘 → 보라 · 호박 → 빨강) | 색을 입히는 그림이 `gauge_fill`(붉은 게이지 채움 그림 · 표 기본색 #FF0000). 곱해져 틀어졌다(실측 곱 ≈ 0.745·0.172·0.255) | 흰 사각 판 `ui_white_square`(msw-ui-kit supersimple Tint_Square `f8c7c91b…` · `data/ui_icons.csv` 새 줄 · GameData 재생성)에 색만 입힘 — `SOCIAL.fillKey` |
| 4 | 「파티원」이 두 줄 · 좁은 장식 단추 가운데 어두운 띠 | 줄 단추 = btn_frame(좌우 장식 96)을 폭 104로 → 장식 사이 가운데 8px만 늘어나 어두운 띠 · 글 칸 104−2×30=44 < 「파티원」 51 | 사용자 결정 3-A와 같은 **민무늬 칩 테**(PLATE `ui_loot_label` 9조각 12 · 테 색 #B8AE9A) `kit.chip`. 글 칸 여백 = `chipInset`(테 선 5 + pad 6) · 한 줄 높이. 폭 = 올 수 있는 가장 긴 글 + 2×inset, 터치 하한 88 (`socialChipW` → 파티·결투·거래 88 · 살펴보기 90 · 사이 6 · 줄 오른쪽 끝부터). 이름 칸 330 → 402 |
| 5 | 랭킹 칸 아바타 약 20×33 · 옛 줄 그림자 모습이 거의 안 보임 | 44×56 칸에 PreserveAvatar 1 → 몸은 칸의 가로 0.56 · 세로 0.68뿐(머리 위 0.30이 빈 캔버스 · 메이커 캡처 실측). 그림자 색 (0.13,0.12,0.16)은 칸 바탕과 대비 약 1.1 | 아바타 칸 64×80(내 순위 줄 56×70)을 칸 **아래에 붙여** 키움 → 보이는 몸 약 36×54(칸 62 안 · 위아래 3~4 여유). 칸 위로 넘치는 건 빈 캔버스(누름 안 받음). 글은 보이는 몸 오른쪽 끝 + 6 (글 폭 164 → 160 · 가장 긴 기록 글 어림 159). `RANK.avatarFill`(실측 비율) · `rankAvatarBody`. 그림자 색 `RankWindow.ShadowTint` = (0.5, 0.48, 0.62, 0.95) — 피부 기준 칸 바탕 대비 3 이상 · 「모르는 모습」 색은 남김. 창 높이·자리·하단 메뉴 줄 간격 규칙(테두리 −212/−248 ≥ 메뉴 −306 + 12 · 버프 −266 + 12)은 그대로 |

## 검사
- `npm test` 21/21 (`check_ui_tokens` 랭킹 창 698 — 아바타는 보이는 몸 상자로 칸 안·글과 안 겹침 · 몸 높이 ≥ 칸×0.8 추가 · `check_mobile_layout` 0 · `check_scripts` 146개 0)
- `ui_lint` GameHUD 오류 0 (경고 587 — 넘김 단추 L007이 빠짐 · 줄 칩 높이 54 L007은 예전과 같은 종류)
- `tests/quality/run.py` 전체 통과 — 새 그룹 **`release_fix5` 53** (5건 모두 + 87f8cdf2 빌드 반례) · `channel_roster` 215(⑤-2 실제 클라 수락: 방 이동에서 실행을 끊어도 「수락」 도착 — 87f8cdf2 TownBoard로 돌리면 실패 확인) · `rank_window_2` 71 · `bugfix_three` 67 · `ui_tabs_chip` 62
- 미리보기 `before-after-x3.png` (왼쪽 87f8cdf2 · 오른쪽 지금 · 3배) — `preview/render.py`(빌드 배치 덤프 `preview/before.lua`·`after.lua` = `tests/quality/release_fix5_dump.cjs`)

## 미리보기 다시 만들기
```
node tests/quality/release_fix5_dump.cjs 87f8cdf2 > docs/evidence/2026-11-01-release-fix5/preview/before.lua
node tests/quality/release_fix5_dump.cjs > docs/evidence/2026-11-01-release-fix5/preview/after.lua
python3 docs/evidence/2026-11-01-release-fix5/preview/render.py docs/evidence/2026-11-01-release-fix5/preview/before.lua docs/evidence/2026-11-01-release-fix5/preview/after.lua docs/evidence/2026-11-01-release-fix5
```
그림은 원본 업로드 그림(assets — 커밋 제외 폴더라 원본 체크아웃에서 찾는다)의 9조각 어림 · 캐릭터는 랭킹 2차 미리보기 대역 · gauge_fill 색은 메이커 실측 곱. 엔진 9조각·UI 아바타·글꼴은 메이커에서만 확인된다.

## 남은 것 (이 레인 밖)
- 퀘스트 일지(QuestJournalHUD · `tools/build/quest-journal.cjs`)의 액트 넘김 ◀▶도 56×56 btn_frame이다(같은 위험). `UIKit.SetActPager`는 틀(…Art)이 없으면 예전처럼 단추 그림을 흐리게 하므로 그대로 동작한다 — 같은 `kit.arrow` 방식으로 바꾸려면 그 빌더 담당이 고친다.
- 모든 창 바탕(`windowFrame`)도 gauge_fill × 창 바탕 색이라 아주 약간 붉은 검정이다(어두워서 눈에 띄지 않음 · 손대지 않음).
