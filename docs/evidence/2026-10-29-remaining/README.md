# 원래 수용표 잔여 빈칸 (F03~F06) — REM-20261029-2053

정본: 공유 폴더 `quality-feedback-remaining-2025.txt` · `acceptance-remaining-2025.json`(F03~F06 `remaining_core_maker`). 빈칸만 다뤘고 F01/F02/F07~F11·RB 재검사·새 UI·게임 코드 변경은 없다. 결과 전체는 `maker-results-remaining.json`(공유 폴더에 같은 파일 복사).

## 1단계 — 기존 자료로 메울 수 있는지 (메이커 없이)

| 빈칸 | 판정 | 근거 |
|---|---|---|
| F04 ① 완료·수령 완료 이웃 보존 | 없음 → F04-C | QR F04-A 이웃 둘 다 미완료. 오프라인 `tests/quality/journal.lua`만 있음(골드 검사 없음) |
| F04 ② 대체 뒤 재접속·반복 열기 | 없음 → F04-C | QR는 대체 뒤 상태 로그·두 번째 재접속이 없음 |
| F05 ① 수령 완료 legacy 저장 재접속 | 없음 → F05-C | a_codex@0을 수령한 회차가 없음. 오프라인 journal.lua는 일부만 |
| F05 ② 마지막 처치→sourceId/업적·중복 억제 | **기존 근거로 충족(재실행 아님)** | QR1540 전체 normal 로그(`QR1540-master-normal-log.txt`)와 연결 안 된 원본 2장(`F05-A_kill_160404/160427.png`): 16:04:33 업적 달성과 막타 `ashen_dead`가 같은 초. 같은 대상 막타 5번 더, 회차 전체에서 달성 줄 1번 (`F05-A-kill-log-excerpt.txt`) |
| F06 ① 받은 룬이 가방 칸/상세에 보임 | 없음 → F06-D | QR 16:18:31 인벤토리 원본은 1~30칸만 보임. 나머지는 일지·알림 화면 |
| F03-B KST 자정 경계 | 오프라인 격리만 / 메이커 잔여 | journal.lua 재통과(20:41)에 보충 검사 `F03-B-offline-addendum.lua`를 더함(같은 Today 주입 경로, 결과 `F03-B-offline-run.txt`). OS 시계 변경·새 우회·자정 대기는 하지 않음 |

## 2단계 — 메이커 최소 사례

- 실행 버전
  - 1회차(F04-C·F05-C·F06-D): e285732b. 20:53 refresh는 변경이 없었고 build는 20:24:34(Error 0, Warning 95).
  - 2회차(MIG-1·복원): 63520f13. `SkillBook.mlua` touch(21:10:12) → 6초 → refresh. build 21:10:23 Error 0, Warning 95, normal 로그에 변환 오류 없음.
  - 일지·인벤토리·저장 관련 파일 blob은 두 회차가 같다.
- 컨텍스트: `server_main`(로비), `server_instance_game:s1b88c08bdd7`(20:54), `s1b88cac237d`(20:57, 재접속 뒤), `s1b88fe54bc7`(21:11, MIG-1). PC FHD, HUD 켬.
- 준비와 검증을 나눴다.
  - 준비(서버 스크립트·로비 BatchSet): 일일 3칸, 퀘스트 Index, legacy Kills·AchDone, 옛 저장 sv=2, a_queen@2 수령.
  - 검증(실제 흐름): 일지·인벤토리·스킬 창 단추는 ButtonClickEvent로 눌렀고, 재접속은 메뉴 캐릭터 선택 → 로비 → 슬롯 4 → 솔로 순서로 했다.
- 입력 한계
  - 이번 실행에서 `maker_keyboard_input` KeyDown이 게임에 도달하지 않았다.
  - `maker_mouse_input` 클릭 공격은 피해로 이어지지 않았다(REM-OBS-01, 원인 미조사).
  - 그래서 F05-C 재처치는 서버 `Monster:TakeDamage(999999, 플레이어)`로 했다. 처치 이벤트 경로는 실제와 같다.

| 사례 | 판정(Claude) | 캡처 | state / log |
|---|---|---|---|
| F04-C | 통과: d_quest1만 d_boss1로 대체. d_kill30 완료와 d_capture2 1/2는 유지. 골드 200846·경험치·daily@0 1이 재접속과 일지 3회 열기 내내 같음. `daily complete` 0줄 | `F04-C_before/after/relogin_open1/relogin_reopen3.png` | `F04-C-state.json` · `F04-C-log.txt` |
| F05-C | 통과: legacy id 13종과 수령 완료 저장으로 재접속 → 청구권 다시 안 생김, ClaimCount 1, 골드 불변, 도감 13/13. 재처치는 sourceId 키로만 +1(legacy 3 유지)되고 달성 줄 0 | `F05-C_prep_ach/relogin_ach/relogin_codex/rekill_before/rekill_after/rekill_ach.png` | `F05-C-state.json` · `F05-C-log.txt` |
| F06-D | 통과(상세): #60 칸 룬을 선택해 연 상세가 보임. 60번 칸 그림 자체는 스크롤 아래라 화면 밖(도구 한계) | `F06-D_rune_detail.png` | `F06-D-state.json` · `F06-D-log.txt` |
| MIG-1 | 통과: `skill rework migrate skill=26+3 stat=0 → skp=29 statp=0 (banner off)`, 화면 배너 없음, UX 큐 show=0, 스킬 창 「남은 포인트 29」 | `MIG-1_PC_room_enter_offer/no_banner/skill_points.png` | `MIG-1-state.json` · `MIG-1-log.txt` |

원본 대응은 `capture-map.txt`(메이커 McpScreenshots 바이트 그대로)를 보면 된다. 전체 로그는 `REM-run1-log.txt`·`MIG-1-and-restore-log.txt`.

## 슬롯 4 백업·복원

- 전: 20:54:09 로비에서 BatchGet → `slot4-backup-before-REM.json`. Lv40, 17:50 저장과 같은 값이고, 로그 조각을 길이·가중합으로 대조해 복원했다.
- 후:
  1. 21:13 방에서 `IsLoadSuccess=false`로 저장을 끈 뒤 4키를 BatchSet → 다시 읽어 같음.
  2. Stash는 내용이 같고 키 순서만 달라서 백업 바이트로 다시 씀.
  3. stop → 새 play 로비에서 5키(Account·Char_4·Inv_4·Shadow_4·Stash) 모두 백업과 일치(`slot4-restore-check.json`).
- 슬롯 1~3은 읽기만 했다. 메이커는 편집 모드·map01·PC.

## 새 관찰 (고치지 않음)

- REM-OBS-01: `PlayerTravel:Go`로 무너진 형장에 간 뒤 클릭 공격이 들지 않았다.
  - 대상이 0.3초 안에 풀린다. 직접 넣으면 평타는 제출되지만 몬스터 HP는 그대로다.
  - 몬스터도 움직이거나 공격하지 않았다.
  - 키보드 미도달과 함께 메이커 포커스·도구 상태로 의심하지만 원인은 보지 않았다. QR 15:40 회차에서는 같은 경로로 처치됐다.
