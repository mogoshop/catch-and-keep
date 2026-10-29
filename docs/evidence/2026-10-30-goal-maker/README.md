# 통합·메이커 단일 담당 — 갈래 B 통합 + 메이커 B-M01~B-M03 (2026-10-30)

- 실행: Claude Opus 5.5(통합·메이커 담당) · 조정 Fable · 시각 KST · run_id `GOAL-MAKER-20261030-B`
- 판정은 하지 않는다(코덱스 몫). 아래는 입력 경로·로그·캡처·한계만.
- 자세한 시간순 기록: `RUN-log.txt` · 쓴 Lua 조각: `GOAL-maker-scripts.lua` · 저장 비교: `slot4-backup-pre.txt` · `slot4-save-diff.txt`

## 1. 통합

| 항목 | 결과 |
|---|---|
| 병합 1 | `git merge --no-ff wip/goal-B-roster-input`(83101bc7) → **3a4b64ca** · 충돌 0 |
| 생성물 | `node tools/build.cjs ui` → GameHUD 변화 0 · CharSelect/Navigation/ShadowHUD는 id 14개·displayOrder만 바뀜(내용 0줄 · 바뀐 옛 id를 RootDesk/map/Global에서 참조 0) → **63aabe43**로 커밋. 빌더를 다시 돌리면 같은 3파일 id가 또 바뀜(비결정 · 선례 f8d56708) · `gen_data.cjs` 변화 0 |
| 검사 | npm test 12/12 · check_data 표 26 문제 0 · check_scripts 142 문제 0 · check_mobile_layout 문제 0 · check_ui_tokens 어긋남 0 · quality 6그룹 exit 0(roster 91/91 · mobile_input 154/154) |
| 병합 2 (B 보완) | ae2ba7a2(B-IN-02) → **91698202** · 충돌 0 · npm test 12/12 · quality exit 0(mobile_input 37장면 177/177) · UI 재생성은 같은 id 흔들림뿐이라 되돌리고 커밋 안 함 |
| 푸시 | main · codex/player-experience-polish = 91698202 (이 증거 커밋 전) |
| 메이커 반영 | 멈춤 → 6초 → 바뀐 mlua 5·GameHUD·재생성 3 touch → 6초 → refresh 1회 → build Error 0 · Warning 98(직전 96 · +2 = SkillWindow.RenderForm `IsMobilePlatform` deprecated · UndeadSystem.ParseHope string.match 다중 반환 LWA-1111) · LEA-3015 0. 보완 병합 뒤 MobilePad만 touch → refresh 1회 → Error 0 · Warning 98 |

## 2. 케이스

시험 캐릭터: 슬롯 4 「새내기」 Lv40(raise_skeleton 9 · skel_shield 2 · skel_twin 1 · raise_mage 3 · mage_hex 1 · mage_twin 1 · bone_rite 1 · bone_spear 5). 무적 사용.

### B-M01 PC FHD — 희망 편성 · 소환 · 장비 · 저장/재입장
- 입력 경로: K = `maker_keyboard_input`(실제 키 → HudMain.HandleKeyDownEvent) · 창 안 단추 = `ButtonClickEvent`(UI 단추 처리 함수) · 소환 = client `SkillBook:RequestCast("raise_skeleton", 혼 위치)` · 장비 = client `PlayerInventory:RequestEquip/RequestUnequip` · 저장 = server `PlayerSave:Save(true)` · 재입장 = 멈춤→플레이→캐릭터 선택→입장
- 로그(발췌):
  - 자동 상태 방패 노드 「+」 → 서버 Warn(랭크 상한 2) · 저장 없음
  - `[VRF] roster hope saved kind=skeleton why=direct hope=s:d:shield=2,greatsword=0,twin=1` · `why=shield-1` · `why=shield+1 hope=s:d:shield=2,greatsword=0,twin=1`
  - `[VRF] roster form ui kind=skeleton form=shield head=방패 희망 2/2` (그리고 1/2) · Mode 글 「자동으로 되돌리기」
  - `[VRF] roster plan kind=skeleton form=shield direct=true max=5 have=0 keep=4 victims=0 clipped=false` → `[VRF] roster raised kind=skeleton form=shield planned=shield match=true trimmed=0 direct=true` (이후 방패·쌍칼·일반 소환도 모두 match=true)
  - 시험 부적(소환 계열 +3) 끼기/벗기 ×2: max 5↔6 · 「직접 편성 2/5」↔「2/6」 · FormHope 4번 모두 그대로 · clipped=false
  - `[VRF] roster hope saved kind=mage why=hex-1 hope=s:d:shield=2,greatsword=0,twin=1/m:d:aura=0,hex=0,twin=1,pierce=0,blast=0` · head 「저주 희망 0/1」 · 「다음 소환: 쌍발 마법사」
  - 저장 후 DataStorage 재조회 hope 같음 · 재입장 `[VRF] roster hope restored hope=s:d:shield=2,greatsword=0,twin=1/m:d:aura=0,hex=0,twin=1,pierce=0,blast=0 shardHold=false`(로비·방 입장 2번)
- 캡처: `B-M01-1-skillwin-direct-shield2of2.png` · `B-M01-2-skillwin-mage-hex0of1.png`
- 한계:
  - A 키 소환은 PC 마우스 모드라 조준점 = OS 커서 · `maker_mouse_input`이 게임 커서를 못 옮겨 혼을 겨누지 못함(실패음) → 같은 서버 RPC를 스크립트로 부름
  - 슬롯4는 희망 합 3 < 기본 정원 5라 장비를 벗어도 정원이 희망보다 작아지지 않음 → 「희망 중 n기는 정원·랭크를 넘어 일반형으로 섭니다」 줄은 **관찰 못 함**. 시험 부적은 GM이 만든 것(저장 전 제거)
  - 혼은 GM 처치(TakeDamage)로 만듦 · 첫 혼 3개는 시간이 지나 사라져 rejected 2회 · 로그 지우기 실수로 서버 줄 2개(why=shield+1 첫 회·raise#2) 유실 — 같은 동작을 다시 해서 남김
  - 재입장은 B 보완 병합 뒤 iPad 프리셋 세션에서 함(플랫폼과 무관한 저장 로드)
  - 관찰: Mode 단추 글 「자동으로 되돌리기」가 「되돌리 / 기」 두 줄로 갈림(캡처 1·B-M02 캡처)

### B-M02 PC FHD — 거인 유지 중 직접 편성 소환
- 입력 경로: 서버 `SkillBook:Cast("raise_skeleton", 혼)`·`SkillBook:CastRite(5, …)` 직접(RPC 발신자 검사만 건너뜀) · 저장 끔 · **GM `PlayerStats.MaxDifficulty=1`**(5기 거인 해금 조건 RiteGiantUnlocked — 슬롯4는 악몽 미해금이라 처음엔 `rite stage=3`으로 내려감)
- 로그(2차):
  - `[VRF] rite stage=5 skel=5 giant atk=363 hp=3799/3803 sec=20`
  - 거인 유지 중 미리보기: 「직접 편성: 거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 방패 해골」 · `GiantReserved=4`
  - `[VRF] roster plan kind=skeleton form=shield direct=true max=5 have=5 keep=0 victims=0 clipped=false` → `[VRF] roster raised kind=skeleton form=shield planned=shield match=true trimmed=0 direct=true`
  - 뒤: 「직접 편성: 방패 1·거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 방패 해골(가장 오래된 방패 해골 교체)」
  - `[VRF] rite giant split back=3/4 ratio=1.00 respawn=true` → 목록 [일반,방패,방패,일반,방패] · 「직접 편성 5/5: 일반 2·방패 3 · 다음 소환: 쌍칼 해골(가장 오래된 해골 전사 교체)」
  - 1차(거인 끝난 뒤 소환): `split back=4/4 respawn=false` → plan victims=1 → raised match=true trimmed=1
- 캡처: `B-M02-1-giant-held-rosterline.png`
- 한계: 거인 갈라짐 뒤 숫자(back=3/4 · 방패 3 > 희망 2)는 46 거인 규칙 영역 — 기록만

### B-M03 iPad 프리셋(Apple iPad 5th gen · 2048×1536) — 골편 홀드 반복
- 입력 경로: 설정 토글 = 메뉴→스킬→골편→WS/Form/Mode `ButtonClickEvent` · `maker_mouse_input` down/2초/up을 패드 S2에 → **제스처 로그 0(도구 한계)** → 이후 **`_MobilePad:BeginGesture/UpdateGesture/EndGesture` 직접 호출(input_path=handler_direct · 물리 터치 아님)** · ShardTick은 게임 Poll이 실행 · 준비 GM: bone_shard 랭크 5(미습득 캐릭터) · 칸2=골편 · 큰 단추=뼈 창 · 저장 끔
- 로그:
  - `[VRF] shard hold setting on=true` → A 2초 누름: `shard hold start slot=2 touch=41` · `shard hold cast n=1..3` · 서버 `cast committed bone_shard mana=8.0` ×3 · `shard hold stop reason=release sent=3` · 뗀 뒤 추가 0
  - B 누른 채 기본 공격: 두 번째 손가락 BasicAtk 무시 · `[VRF] basic input blocked by shard hold` ×3(BasicAttack 처리 함수 2 · SubmitBasicInput 1) · 서버 AimRequestCount/StrikeCount 5/5 → 5/5
  - C 누른 채 메뉴: 반복 멈춤(sent=1 · 뒤 요청 0) · **사유 로그 `reason=owner`(기대 menu)** — UIKit.Open이 먼저 `_MobilePad:ClearGesture()`를 불러 StopShardHold("owner")
  - D 「취소」 위로: `stop reason=aim sent=3` · `mobile aim cancel slot=2` · 시전 0
  - E B-IN-02(누른 사이 칸 → 해골 전사): `stop reason=slot sent=0` · `[VRF] mobile aim release skipped slot=2 changed bone_shard` · 요청·확정 0
  - F 설정 끔: `shard hold setting on=false` · 1초 누름 반복 0 · `mobile aim release slot=2 reach=0.00` · 확정 1
  - **요청 수 = 확정 수**: 반복 요청 10 + 놓기 1 = 11 · 서버 `cast committed bone_shard` 11
- 캡처: `B-M03-1-ipad-shard-toggle-on.png`(편성 칸 「누르고 있으면 반복: 켬」·「끄기」) · `B-M03-2-ipad-during-script.png`(반복 중 · 골편 칸 재사용 0.2 · 마나 96/118)
- 한계: 물리 터치·두 손가락 동시 입력은 지원 입력으로 재현 못 함 — 전부 처리 함수 직접 호출 증거 · 스크립트 wait가 실제 시간보다 늘어나는 현상(서버 wait(1) = ElapsedSeconds 6.18) 있음

## 3. 끝 상태 · 남은 것
- maker_stop → 편집 모드 · map01 · PC FHD
- 슬롯4 저장은 01:19 한 번만 바뀜(`slot4-save-diff.txt`: skills.hope 추가 · slots `raise_skeleton,,,` · travel.act 4→1 · exp +16 · 일지 카운터) — 되돌리지 않음
- 다음: 갈래 A(62736662) → D(4abd8884) → C(1e15df63) 통합(조정자 대기열)
