# F03 실제 KST 자정 경계 관찰 — 23:40 메이커 담당 순서표 (2026-10-30 → 10-31)

준비: Claude Opus 5.5 (비메이커 · 읽기+스크립트만, 메이커 미실행). 판정 없음 — 관찰 로그만 남기고 판정은 코덱스.
대상 조건(코덱스 F03): 실제 Maker 날짜 경계 전후 **후보 교체 · 전날 완료 보상 재지급 0 · 경계 뒤 재접속 유지**. 오프라인 시간 주입 검사는 끝남(`../2026-10-29-remaining/F03-B-offline-addendum.lua`).

## 금지
- OS 시계 변경, `DateTime`/`PlayerJournal.Today` 대체·시간 주입, 자정 대기 생략. 놓치면 다음 날 자정으로 미룬다.
- 게임 코드·데이터 수정, 커밋(부모가 함). `.codeblock` 손대지 않음.
- **23:40에 메이커가 이미 플레이 중이거나 최근 3분 안에 다른 세션 로그가 있으면(23:36 예약 세션 등) 아무것도 누르지 말고 중단·보고.** 메이커는 한 번에 하나.

## 코드 근거 (HEAD 7fd51bbe · blob = 10-29 REM 회차와 같음)
| 파일 | blob | 지점 |
|---|---|---|
| `RootDesk/MyDesk/Progress/PlayerJournal.mlua` | ccffa57e2ef2 | `Today` 374-377 (KST = UTC+9 · `DateTime.UtcNow.Elapsed` ms) · `EnsureDaily` 399-427 · `Flush` 432-471(서버 1초 타이머 36) · `CompleteDaily` 80-97(달성 즉시 지급) · 저장 475-547 |
| `RootDesk/MyDesk/Data/JournalData.mlua` | e2f3ebeee69a | 일일 후보 8종 17-24 (`d_depth1`은 `depthEnabled=0`이라 빠져 pool 7) |
| `RootDesk/MyDesk/Player/PlayerSave.mlua` | b46caf774616 | `Char_N.journal` 59 · 자동 저장 120초 16·72 · 나갈 때 `Save(true)` 803-815 · 캐릭터 선택 `Save(true)` 358 |
| `RootDesk/MyDesk/UI/Windows/JournalWindow.mlua` | 3dc170fff78f | Digest 그리기 82-100 · J 키 52-58 |
| `RootDesk/MyDesk/Social/TownBoard.mlua` | — | 같은 KST 날짜식 51-53 (참고만) |

## 예상 (슬롯 4 = 10-30 14:53 S48 복원본일 때)
- 10-30 = 739918: `d_capture2 0/2 · d_raise10 2/10 · d_quest1 0/1` (Char_4 저장값 = 계산값)
- 10-31 = 739919 예측: `d_raise10, d_quest1, d_kill30` — 회전식이라 **3개 중 2개 id가 겹치는 게 정상**. "교체" = 예측 목록과 같고 모든 칸 0/미완료로 새로 시작.
- S05로 `d_raise10`을 자정 전에 완료(골드 +60·경험치 지급)해 두면, 자정 뒤 같은 id가 0/10 미완료로 시작하고 골드·경험치·`c.daily`가 그대로여야 "재지급 0".

## 순서 (컨텍스트는 `maker_get_context_keys`로 확인 · 스크립트 실행 뒤 5초 기다렸다 `maker_logs` search `[F03]`)
| 시각 | 할 일 | 블록 |
|---|---|---|
| 23:40 | 메이커 상태 확인: 편집 모드인지, 최근 로그에 다른 세션 흔적 없는지. 있으면 **중단·보고**. `git log -1`·위 blob 확인. 마지막 build 뒤 RootDesk 변경이 있을 때만 touch → 5초 → refresh 한 번 | — |
| 23:42 | PC FHD 확인 → 저장 켠 채(IsLoadSuccess 건드리지 않음) `maker_play` | — |
| 23:44 | 로비 캐릭터 선택 화면에서 **입장 전에** S00 (server_main). `match_S48=5/5`인지 적어 둠. 로그 전체를 `raw-logs.txt`에 저장 | S00 |
| 23:45 | 슬롯 4 「새내기」 선택(필요하면 client `ButtonClickEvent` CharSelect/Box/S4) → 마우스 (1368,236) 「입장」 → client `_RoomWindow:Solo()` → 게임 방 컨텍스트 이름 기록 | — |
| 23:50 | (선택) S05 — 자정 전 1칸 완료. 23:58 넘기면 건너뜀 | S05 |
| 23:55 | S10 (server 방) → S11 (client, TAG='before') → 5초 → `screenshot` `F03-before_journal.png` | S10·S11 |
| 23:56~00:01 | **입력 없이 마을에 서 있기**(몬스터 처치·줍기·의뢰 보고 금지). 00:00:30쯤 `maker_logs` search `[F03] edge` 로 `edge #1` 확인 | — |
| 00:02 | S20 (같은 방 server) → S21 (client, TAG='after') → 5초 → `F03-after_journal.png` | S20·S21 |
| 00:03 | S25 — 자동 저장이 새 날 목록을 썼는지 읽기만. `storage_is_today=false`면 1~2분 뒤 한 번 더, 그래도 false면 그대로 진행하고 기록 | S25 |
| 00:04 | `maker_stop` → `maker_play` → 로비 → 슬롯 4 (1368,236) 입장 → `Solo()` (새 방 컨텍스트 기록) | — |
| 00:05+ | S30 (AFTER= 에 S20 `after paste {...}` 붙임) → S31 (TAG='reconnect') → `F03-reconnect_journal.png` | S30·S31 |
| 00:08 | `maker_stop` → `maker_play` → 로비 캐릭터 선택 화면(입장 금지)에서 복원: S00이 5/5면 `../2026-10-30-summon48-maker/slot4-restore-S48.lua`, 아니면 `python3 F03-make-restore.py raw-logs.txt` → `F03-S90-filled.lua` 실행. `restore after match=5/5` 확인 | S90 |
| 00:10 | `maker_stop` → 편집 모드 · map01 · PC FHD | — |

시간이 밀리면: S10은 늦어도 23:58, 23:52까지 방에 못 들어가면 이번 자정은 포기하고 보고(다음 날 다시).
S20에서 `_G`가 이어지지 않아 `after check SKIP`이 나오면 S10 로그 `before paste {...}`의 `{...}`를 S20 `local BEFORE=nil` 자리에 붙여 다시 실행.

## 기대 로그 키
- `[F03] backup key=K len= hash= present=` ×5 · `[F03] backup code=0 match_S48=n/5` · `[F03] backup Char_4 journal dd= d=` · `[F03] bak K i/n <16진>`
- `[F03] prep ... completed id= ... gold a->b exp a->b c.daily a->b` + 게임 로그 `[VRF] daily complete <id> exp=`
- `[F03] before|after|reconnect time/daily/wallet/pred/storage/paste` 각 6줄
- `[F03] before watcher on` → `[F03] edge #1 kst=00:00:0x ... 739918|... -> 739919|...` (한 줄이어야 함)
- `[F03] after check dd ... dd_plus1= dd_is_today= ids_changed= ids_eq_before_predNext= fresh_p0_undone= unique=` · `[F03] after check wallet ... no_repay= prev_done=` · `[F03] after check edges=`
- `[F03] presave ... storage_is_today=` · `[F03] reconnect check ... same_list= no_repay=`
- `[F03] client before|after|reconnect kst= open=true tab=daily left_min= rows=3 ...`
- `[F03] restore before/guard/BatchSetAndWait/after match=5/5`

## 판정 기준 (코덱스용 · 담당은 적기만)
1. 날짜 키 변경: after `dd_plus1=yes` · `dd_is_today=yes` (739918→739919), `edge` 정확히 1줄이고 KST 00:00:00~00:00:02.
2. 후보 교체: `ids_eq_before_predNext=yes` · `fresh_p0_undone=yes` · `unique=yes` · `count=3` · 화면 3줄이 서버 목록과 같음.
3. 전날 보상 재지급 0: `no_repay=yes`(골드·경험치·c.daily 그대로), `prev_done`의 id가 `0:false` 또는 absent, 00:00~00:02 사이 `[VRF] daily complete` 0줄.
4. 재접속 유지: `same_dd/same_list/same_ids=yes` · `no_repay=yes` · `ids_eq_pred_today=yes` · 화면 3줄 같음.

## 산출 `maker-results-f03-midnight.json` (판정 칸 없음)
```json
{
  "run_id": "F03M-20261030-2340",
  "agent": "", "timezone": "Asia/Seoul",
  "source": {"head": "", "blobs": {"PlayerJournal.mlua": "ccffa57e2ef2", "JournalData.mlua": "e2f3ebeee69a", "PlayerSave.mlua": "b46caf774616", "JournalWindow.mlua": "3dc170fff78f"}},
  "maker": {"platform": "PC FHD", "contexts": [], "sync": [], "play_stop": []},
  "backup": {"s00_lines": [], "match_S48": "", "raw_log": "raw-logs.txt"},
  "prep": {"used_s05": false, "lines": []},
  "before": {"time_kst": "", "lines": [], "client": "", "screenshot": "F03-before_journal.png"},
  "edges": [],
  "after": {"time_kst": "", "lines": [], "check": [], "client": "", "screenshot": "F03-after_journal.png"},
  "presave": {"lines": []},
  "reconnect": {"time_kst": "", "lines": [], "check": [], "client": "", "screenshot": "F03-reconnect_journal.png"},
  "restore": {"method": "slot4-restore-S48.lua | F03-S90-filled.lua", "lines": []},
  "limits": [], "unverified": []
}
```
`limits`에 넣을 것: S05를 썼다면 「자정 전 완료는 GM Record 준비(실제 CompleteDaily 경로, 날짜 무관)」, 재접속이 stop→play(=메이커 재시작)였음, 저장이 자동 저장인지(S25 `storage_is_today`) 여부, 화면 Digest `left_min`이 몇 분 묵을 수 있음, 실기기 아님.

## 파일
- `F03-maker-scripts.lua` — S00 · S05 · S10 · S11/S21/S31 · S20 · S25 · S30 · S90(틀). 블록마다 `do ... end` (첫 줄 `-- ===================== Sxx`부터 그 블록 `end`까지 복사)
- `F03-make-restore.py` — S00 로그 → `F03-S90-filled.lua` (len/djb2 5/5 안 맞으면 만들지 않음)
- 오프라인 확인(메이커 아님): luac 문법 통과 · `tests/quality/run.py --dump journal`의 실제 PlayerJournal 본문 + 대역으로 S00→S05→S10→자정→S20→S25→재접속 S30→S90 전 과정 실행, 위 기대값대로 나옴(edge 1 · no_repay yes · same_list yes · restore 5/5 · 입장 뒤 slot≠0이면 복원 거부)
