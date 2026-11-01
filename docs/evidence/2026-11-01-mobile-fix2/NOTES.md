# 2026-11-01 모바일 수정 2차 — 메이커 검증 (미커밋 작업트리)

대상: `MobileLayout.mlua`(큰 알림 판 왼쪽 열) · `UXFeedback.mlua`(SlotBusy) · `HudMain.mlua`(판이 떠 있는 동안 파티 숨김) · `MobilePad.mlua`(PadDown/Drag/Up · ResolvePadSlot · 남은 제스처 버림).
코드 수정 없음 · 커밋 없음 · maker_save 부르지 않음. 관련 로그는 `key-lines.txt`.

## 절차
1. maker_stop(이미 편집) → 5초 → 네 .mlua touch → maker_refresh_workspace 1회 → build 로그 357줄: Info 254 · Warning 103(LWA 1110/1111, 네 파일 해당 0) · **Error 0**.
2. maker_set_platform mobile (Apple iPad 5th gen, 2048×1536) → play. `[VRF] MobileLayout toast left align=TopLeft pos=(24,-384) size=600x122 top=384 bottom=506` + `MobileLayout applied` 두 번(20:49:13 · 20:49:14). SelfTest 407/0.
3. 테스트 준비(직접 호출): 캐릭터 선택 1번 「인꾸」 Lv17 → 솔로 → 원래 배운 스킬이 `shadow_summon:1`뿐이라 서버에서 `Levels` mark_weakness 5 · raise_skeleton 3 · bone_shard 3, 칸 1=골편 · 3=해골 전사 · 5(큰 단추)=약화의 낙인 지정 → `PlayerTravel:Go("wasteland")`. BasicAtk 보임(en=true).
   - 주의: 이 테스트 상태가 메이커 로컬 DataStorage의 캐릭터 1 저장에 남았을 수 있음(PlayerSave 자동 저장).
4. A · B 검증 → maker_stop → maker_set_platform pc(FHD) → 편집 모드 확인.

## A. 큰 알림 판 위치
| 항목 | 기대 | 실측 | 판정 |
|---|---|---|---|
| 부팅 배치 로그 | TopLeft (24,-384) 600×122 top 384 bottom 506 ×2 | 같음 ×2 | ✅ |
| Show 중 Toast Transform | Enable · TopLeft · Pivot(0,1) · (24,-384) · 600×122 | en=true · TopLeft · (0.00,1.00) · (24,-384) · 600×122 | ✅ |
| `[VRF] ux show` | 나옴 | `ux show kind=notice … 시험` | ✅ |
| SlotBusy | 떠 있는 동안 true → 끝나면 false | t+0.5 true · t+2 true · t+6 false (해골 알림도 true → t+5 false) | ✅ |
| 파티 숨김 | 판이 떠 있는 동안 Party 꺼짐 | 솔로라 Party는 처음부터 꺼짐(en=false, 400×28) — **파티원 있는 상태로는 확인 못 함** | ⚠ 미확인 |
| 해골 사망 알림 | `companion loss hint kind=skeleton` → 같은 자리 | 서버에서 `_CompanionHUD:NotifyLoss` 호출(실제 전투 사망 대신) → 로그 나옴 · 같은 Transform · 제목 「해골 전사가 쓰러졌습니다」 | ✅ (실전 사망 아님) |
| 눈 확인 | 왼쪽 열 의뢰 추적 아래 | `a-skeleton-loss-toast-left-column.png`: 의뢰 추적 판 바로 아래, 캐릭터 머리 위 전투 구역과 안 겹침 | ✅ |

- 메이커 iPad 미리보기 화면 캡처는 좌우가 잘려 보임(판 왼쪽 글자 일부가 잘림). 기존에 알려진 「iPad UI 잘림」 미리보기 문제로 보이며 로그상 판 위치는 정상. 실기기 확인 필요.

## B. 모바일 패드 터치 판정
### 입력 경로
- `maker_mouse_input`: 화면 터치(ScreenTouchEvent)는 정확한 좌표로 들어옴(Attack 가운데 클릭 → atkLocal (0,0)). 하지만 **UI 단추의 UITouchDown/Up 이벤트가 거의 오지 않음**: 단일 클릭 9회 0건, 20점 격자에서 2건 왔는데 UI 점이 마우스 위치와 맞지 않음(마우스 (2030,60)인데 UI 점은 Attack 가운데 dist=2 · 마우스 (1560,420)인데 S4 dist=36). 보정 불가 → **판정 표는 `_MobilePad:PadDown/PadUp` 직접 호출로 확인 (실제 입력 경로로 확인 못 함)**.
- 참고: 20:57:38~57에 **제가 보내지 않은 실제 마우스 클릭**이 들어옴. 이것은 실제 UI 경로로 S1에 닿아 `uidown /Skills/S1 id=-1 pt=(1623,195)` → `pad hit src=1 slot=1 dist=34 r=64` → 골편 시전(서버 `cast committed bone_shard`). 실제 UI 이벤트의 TouchPoint가 화면 픽셀이고 PadDistance 계산이 맞다는 증거. 단, 메이커 실제 마우스는 한 번 누름에 UITouchDownEvent가 **두 번** 와서 `pad stale gesture cleared slot=1 old=-1 new=-1` 후 같은 칸으로 다시 시작함(결과는 정상: 한 발).

### 판정 표 (직접 호출, point = UI × 2048/1920)
| 점 (1920 기준) | 엔진 단추(src) | 기대 | 실측 로그 | 실제 시전 | 판정 |
|---|---|---|---|---|---|
| Attack 중심 (1750,170) | 5 | slot=5 dist≈0 r=123 · 낙인 1회 | `pad hit src=5 slot=5 dist=0 r=123` → `mobile aim release slot=5` | 서버 `mark_weakness 효과 없음 → 마나·쿨다운 보존`(몬스터 없음, 요청 도착) | ✅ |
| Attack 오른쪽 위 (1850,270) | 5 | slot=6 small=6 · 기본 공격만 | `pad hit src=5 slot=6 dist=141 r=123 small=6 sdist=69 sr=80` | `c7 slash player`(기본 공격) · slot5 release 없음 | ✅ |
| Attack 왼쪽 위 (1650,270) | 5 | slot=0 · 아무것도 | `pad hit src=5 slot=0 dist=141 r=123 small=0` | 없음 | ✅ |
| BasicAtk 중심 (1860,338) | 6 | src=6 slot=6 | `pad hit src=6 slot=6 dist=0 r=52` | 낙인 없음 (휘두름 로그는 이 회차엔 안 찍힘) | ✅ |
| BasicAtk 아래 큰 단추 네모 안 (1855,275) | 5 | src=5 slot=6 | `pad hit src=5 slot=6 dist=148 r=123 small=6 sdist=63 sr=80` | 낙인 없음 | ✅ |
| S3 중심 (1616,395) | 3 | src=3 slot=3 | `pad hit src=3 slot=3 dist=0 r=64` → `mobile aim release slot=3` | 서버 `summon rejected: no owned soul`(해골 전사 요청 도착, 혼 없음) | ✅ |
| S3 아래 틈 (1616,325) | 없음 | pad 로그 없음 | 계산: S3 네모 y 335~455 · S2 x 1465~1585 · Attack x 1640~ → 어느 단추에도 안 듦 | — | ✅ (계산, 입력 미실행) |
| 남은 제스처 7a: Attack 누름 → (1500,600) 끌기 · up 유실 → 같은 id로 S3 탭 | 5 → 3 | stale cleared slot=5 → src=3 slot=3 · 낙인 없음 | `pad stale gesture cleared slot=5 old=7 new=7` → `pad hit src=3 slot=3` → `release slot=3` | 해골 전사 요청만 · 낙인 없음 | ✅ |
| 7b: Attack 누른 채 다른 손가락 S3 탭 | 5 / 3 | S3 up 무시 · Attack 놓을 때 낙인 | S3 down 뒤에도 `gest=8 slot=5 src=5` → `release slot=5` | 낙인 요청 1회 | ✅ |
| 7c: Attack 끌기 · up 유실 → 1.4초 뒤 새 id로 S3 | 5 → 3 | 1초 소식 없음 → 버림 | `pad stale gesture cleared slot=5 old=10 new=11` → `src=3 slot=3` | 해골 전사 요청만 | ✅ |

## 못 한 것 · 의심
- B 전부 **직접 호출**: 메이커 마우스 도구가 UI 터치 이벤트를 안정적으로 만들지 못함. 실제 손가락(아이폰 17)으로 같은 점을 다시 눌러 볼 것.
- 파티원이 있을 때 판이 떠 있는 동안 파티 목록이 꺼지는지 미확인(솔로).
- 해골 실전 사망(몬스터에게 죽음) 경로 미실행 — 서버에서 같은 `NotifyLoss` RPC를 불러 대신 확인.
- BasicAtk 직접 탭(4번)·네모 안(5번)에서 기본 공격 휘두름 로그는 안 찍힘(2번에서만 `c7 slash`). 낙인이 안 나간 것은 확인, 기본 공격 실행 여부는 이 두 점에서 로그로 확정 못 함.
- 메이커 실제 마우스는 누름 한 번에 UITouchDownEvent 2회 → stale 정리 후 같은 칸 재시작(결과 정상). 실기기 터치에서도 2회 오는지는 모름.
- 테스트용 스킬 레벨·칸이 메이커 로컬 저장(캐릭터 1)에 남았을 수 있음.

## 메이커 최종 상태
편집 모드(stop · `already_stopped`) · 플랫폼 PC(FHD) · maker_save 안 함.

## 스크린샷
- `a-toast-left-column.png` — 「시험」 판(왼쪽 열 의뢰 추적 아래, 왼쪽 글자는 미리보기 잘림)
- `a-skeleton-loss-toast-left-column.png` — 「해골 전사가 쓰러졌습니다」 판, 같은 자리
