# ICON18 — (다) 아이콘 18장 연결 메이커 확인 (교체 노드 6 · 뼈 공명 1 · 머리 위 표식 11)

- 소스: **a96d26c7** (`codex/player-experience-polish` = main) + 미커밋 4파일 `data/skills.csv`(노드 7개 icon) · `data/ui_icons.csv`(mark_* 11줄) · 생성 `RootDesk/MyDesk/Data/GameData.mlua`·`SkillData.mlua`(`node tools/gen_data.cjs`) — 이 커밋에 함께 들어간다
- 그림: 코덱스 H-9(교체 노드 6) · G-12(뼈 공명) · D-3(머리 위 표식 11) — 10-29 사용자 승인 뒤 그룹 저장소 업로드분. `assets/`는 커밋 안 함(RUID는 데이터 표로 옮김)
- 판정: Claude 자체 판정(메이커 1회 실행, Opus 단독). 로그 원문은 `RUN-log.txt`(추린 것), 빌드 로그 `maker-build-log.json`

## 1. 실행

| 시각 (10-29) | 일 |
|---|---|
| 20:24:12 | 편집 모드 확인 · map01 루트 id 일치 · 플랫폼 PC FHD |
| 20:24:24 | 멈춤 확인 6초 뒤 `GameData.mlua`·`SkillData.mlua` touch → 6초 |
| 20:24:34 | refresh 한 번 → build **530줄 Info 435 · Warning 95 · Error 0** (직전 RB 빌드와 같은 수) |
| 20:25:13 | play PC FHD (`[SelfTest] 통과 402 / 실패 0` · `UIKit 아이콘 미리 불러오기 351개 · 실패 0`) |
| 20:25:36 | 로비에서 런타임 데이터 확인 (아래 2·3절 첫 줄) |
| 20:26:06~18 | 캐릭터 선택 S4 → 입장 → 혼자 (실제 단추 엔티티에 `ButtonClickEvent`) → 방 `server_instance_game:s1b88559d19a` (outpost) |
| 20:26:47 | `PlayerSave.IsLoadSuccess=false` (저장 끔) |
| 20:28~20:31 | 스킬 창 노드 7개 |
| 20:32~20:45 | 소금 갯벌(Lv22~23)에서 저주 시전 · 머리 위 표식 |
| 20:46:41 | stop → **편집 모드 · map01 · PC(FHD)** |

## 2. 캐릭터 · 준비와 검증

- 슬롯4 「새내기」 Lv40 (직전 담당들이 쓴 상태 그대로). 입장 직후 digest `bone_rite:1;bone_spear:5;mage_hex:1;mage_twin:1;raise_mage:3;raise_skeleton:9;skel_shield:2;skel_twin:1;wraith_dash:3` · 칸 비어 있음. 입장 20초 뒤 저장 끔, 그 전 변경 없음. 되돌리지 않음(저장이 꺼져 있어 슬롯에는 안 남음).
- **준비(서버 스크립트, 검증 아님)**: `SkillBook.Levels` + `RefreshDigest`(노드 7개와 부모 스킬 · 저주 스킬 — 저주는 캡처 여유로 20레벨, 혼란 장면만 공포 1레벨=3초) · `SetSlot`(A S D F) · 마나 채움 · 무적 1시간 · `PlayerTravel:Go saltflat` · F칸 해골 전사(안내 띠 「스킬 칸에 넣으세요」가 표식을 가려서). 저항 붕괴는 Lv42 해금이라 Levels로만 넣음.
- **검증(실제 처리 경로)**: 스킬 창은 실제 단추 엔티티 `ButtonClickEvent`(Bottom/Menu/BtnSkill → 시간선 부모 칸 → `SkillWin/WS/N#`), 그려진 UI 엔티티의 `ImageRUID.DataId`를 읽음. 저주는 **키보드 입력**(`maker_keyboard_input` A·S·D·F 탭 = 땅 찍기: 누르면 범위 원 → 떼면 시전), 이동·바라보기도 방향키. 표식은 클라이언트 `MonsterStatus.CurseMarkers`의 실제 엔티티 `SpriteRendererComponent.SpriteRUID`를 읽음.
- 조준 주의: `ClickControl:SelectAttackTarget`은 서버 `PlayerAttack.SelectedTarget`만 바꾸고 클라이언트 값은 동기화되지 않는다 → 키보드 모드 땅 찍기는 **바라보는 방향 ±40° 안 가장 가까운 적**(`SkillBook.GetAimPoint`)으로 겨눔. 첫 시도는 바라보는 방향이 반대라 「저주할 적이 범위 안에 없습니다」×4(마나·쿨다운 보존) → 방향키를 짧게 눌러 몬스터 쪽을 보게 한 뒤 시전.

## 3. 스킬 창 노드 7개 (PC 1920×1080)

로비 데이터: `_SkillData:Get(id).icon` 7개 모두 새 RUID (20:25:36 `[VRF] ICON18 skill icons …`).
창 안: 노드 칸 아이콘(44×44)과 노드를 고른 뒤 큰 초상 아이콘 둘 다 새 RUID, `match=true` · 밝기 1.0(배움 테두리).

| 노드 (부모) | 전 RUID | 후 RUID | 창 확인 | 후 캡처 | 전 캡처(기존, 재촬영 안 함) |
|---|---|---|---|---|---|
| 뼈 가시 shard_spike (골편 투척) | e4b8c998789d4bf79ea36acdc7ba02ef | 21a4954a7c034f109fe468555d3307c1 | N3 · 초상 일치 | `N1_PC_after_shard_spike(_zoom).png` | `../2026-10-29-readability/QR1629-OBS-01_PC_after_shard_ring.png` |
| 뼈 껍질 dash_ghost (망령 질주) | d29107ce9bd049b5b1b2c0fd427114a8 | e9baa3e58b374464ad1bff2f8991c4ee | N1 · 초상 일치 | `N2_PC_after_dash_ghost(_zoom).png` | `../2026-10-29-quality-remediation/F07-C_dash_ghost.png` · `../2026-10-29-readability/QR1629-OBS-01_PC_after_dash_ring.png` |
| 터지는 갑옷 armor_thorns (뼈 갑옷) | b35535de07f14c91939fb7a403039914 | c7f1da8878b9416e859c6db6e41cac42 | N2 · 초상 일치 | `N3_PC_after_armor_thorns(_zoom).png` | 기존 캡처 없음 |
| 혼 사슬 drain_share (생기 앗기) | 4ea725131e6f4d7f9b545d18526daff2 | ce9dcbb1df5a427aa038c909722023b5 | N1 · 초상 일치 | `N4_PC_after_drain_share(_zoom).png` | 기존 캡처 없음 |
| 서리 표식 frost_long (서리 혼) | e794e3b3ab5347e2a8bcbd9d5057cd67 | 074898018bba41b190c2860f6b0d672c | N1 · 초상 일치 | `N5_PC_after_frost_long(_zoom).png` | 기존 캡처 없음 |
| 잔걸음 step_gale (가벼운 걸음) | dcba2b03af0f40e8aa361478fb3c9568 | 9c393c572eeb4732aceba7e760a17634 | N1 · 초상 일치 | `N6_PC_after_step_gale(_zoom).png` | `../2026-10-29-quality-remediation/F07-C_step_gale.png` |
| 뼈 공명 skel_resonance (해골 전사) | a124f12227964a73a25bfc42c040f50b | cb81765eb9a744c88ab0e6f44c31ad36 | N7 · 초상 일치 · 1/1 금 테두리 | `N7_PC_after_skel_resonance(_zoom).png` | `../2026-10-29-readability/QR1629-OBS-01_PC_after_roster_warrior.png` · `../2026-10-29-4445-integration/01-skillwin-open-levelup-held.jpg` |

판정: **7개 모두 새 그림으로 그려짐** (노드 칸·큰 초상). 어색한 점 없음.

## 4. 머리 위 표식 11개

로비 데이터: `_GameData:GetUiIcon("mark_…")` 11개 모두 빈 문자열 아님, `ui_icons.csv`와 같은 RUID (20:25:37 `[VRF] ICON18 marks empty=2 …` — 빈 2개는 `mark_hex`·`mark_frost`, 납품 없음 → 스킬 아이콘 대체, 기존 동작).
게임 안: 시전 뒤 감시 스크립트가 표식 엔티티 SpriteRUID를 읽음(`mark=true` = 32px 문양 경로, 배율 0.56). 대조 그림 `ref_D3_marks_delivered_x4.png`(납품 PNG 11장 ×4).

| 표식 (키) | RUID | 게임 안 표식 엔티티 로그 | 보이는 캡처 | 상태 |
|---|---|---|---|---|
| 약화의 낙인 mark_amp (빨강 깨진 방패) | eb4b5e35eb4a46fc851dbcb3e1e8e99b | 20:39:52 `amp=eb4b5e35` | M1 · M3 | 보임 |
| 쇠약 mark_weaken (초록 아래 화살) | 5e3b8231c42d4358ac845c5f822fa007 | (묶음 1 — 대상 칸 「쇠약」·캡처) | M1 | 보임 |
| 가시 저주 mark_thorn (주황 가시 별) | ff2a600148644efab642f160138b0b30 | (묶음 1 — 대상 칸 「가시 저주」·캡처) | M1 | 보임 |
| 공포 mark_terror (보라 해골) | abee4aa6f0ca44278bf88e134bd20795 | 20:37:22 `terror=abee4aa6…` | M2 · M3 | 보임 (시전 순간 보랏빛 연출이 1초 덮음) |
| 혼란 mark_confuse (노랑 소용돌이) | a64aac9af73545b4811bc6ebd1a58bb7 | 20:37:27 · 20:39:54 `confuse=a64aac9a` | M4 | 보임 (혼란 1.5초뿐 · 서로 친 피해 숫자와 겹침) |
| 생명 약탈 mark_lifetap (핏방울) | 4a9b4ce50f7a427ba09a00b7a581fdc6 | (묶음 1 — 대상 칸 「생명 약탈」·캡처) | M1 | 보임 |
| 쇠퇴 mark_decay (모래시계) | 1feea89372ec4eac896320e2e3dc93ca | (묶음 1 — 쇠약+강화 「쇠퇴」 · 대상 칸) | M1 | 보임 |
| 저항 붕괴 mark_resist (청록 깨진 방패) | 32d6d08928a0448db315fb8b6576ba62 | 20:37:22~30 `resist=32d6d089…` | M3 | 보임 |
| 골격 감옥 mark_root (갈비뼈) | 469da878e69743a580a934aad17bb680 | 20:37:22 · 20:39:52 `root=469da878` | M2 · M3 · M4 · M5 | 보임 |
| 독 mark_poison (초록 독방울) | ab8469f1d5b14fed873bca3266d212cb | 20:37:22 · 20:42:02 `poison=ab8469f1` | M5b · M5 | 보임 (독안개 틱 숫자가 자주 덮음) |
| 둔화 mark_chill (하늘색 눈송이) | 10eea948bc304f1aab6159a9b58178bf | 20:42:02 `chill=10eea948` (서리 혼 3초) | M5 · M5b | **부분 확인** — 화면에 있으나 독안개 숫자(M5)·안내 띠(M5b)에 반쯤 가림 |

덤: 서리 표식(frostmark, `mark_frost` 납품 없음)은 스킬 아이콘으로 대체되는데 그 아이콘이 이번에 바뀐 `frost_long` 새 그림(074898018bba…)으로 나온다 (20:42:02 `frostmark=07489801(skill)`). 저주 마법사(`mark_hex`)는 이번에 안 걸어 봄.
표식 엔티티 수: 20:42:02 `child=3` = 종류 3 (중복 엔티티 없음). 감시 스크립트가 20:39:52·53에 같은 종류를 두 번 읽은 줄은 게임이 표식을 추가하는 순간 표를 함께 순회한 측정 부작용으로 본다(엔티티 수·화면은 종류당 1개).

## 5. 크기·위치 수치 (고치지 않음)

- 표식 배율: 문양 0.56 (32px → 0.18칸) · 스킬 아이콘 대체 0.14 (128px → 0.18칸) — 둘 다 같은 크기.
- 화면 크기: PC 1080p·줌 100에서 1칸 ≈ 150px → 캔버스 ≈ 27px, 실제 그림(글리프) ≈ **23px**(M1 화살 높이 실측). 이름표 글자(≈13px)보다 크고 게 몸(≈110px 폭)의 1/5.
- 높이: 몬스터 발밑 + **1.10칸**(게·갈매기 히트박스 0.40 → `max(1.1, 0.40+0.55)`) = 히트박스 위 0.70칸(≈105px), 머리 위로 0.3칸쯤 떠 있어 머리에 묻히지 않음.
- 가로 간격: 가운데끼리 0.26칸 ≈ 39px → 글리프 사이 ≈ 15px. 5개 줄(M1) 폭 ≈ 1.3칸.
- 관찰(수정 안 함):
  - ICON18-OBS-01 피해 숫자(독안개 틱 54 · 혼란끼리 친 숫자)가 표식 줄 위로 떠올라 겹침 — M5에서 눈송이(둔화)가 반쯤 가림, M4도 숫자와 겹침.
  - ICON18-OBS-02 화면 위끝 몬스터의 표식은 상단 대상 정보 판·안내 띠(GuideCoach)에 가림 — M2b(공포로 달아난 게의 혼란 표식이 판 아래), M5b(둔화 눈송이가 띠 아래로 비침).
  - ICON18-OBS-03 몬스터가 겹쳐 서면 표식 줄이 세로로 겹겹이 쌓임 — M2·M3. 줄끼리는 구분되지만 어느 줄이 어느 몬스터인지는 위치로만 앎.
  - ICON18-OBS-04 낙인(빨강 깨진 방패)과 저항 붕괴(청록 깨진 방패)는 실루엣이 같고 색만 다름 — M3에서 나란히 보면 구분되지만 23px에서 색맹·어두운 바닥이면 헷갈릴 수 있음(그림 판단은 사용자 몫).
- 「전」 비교: `../2026-10-29-4445-integration/22-curse-marks-overhead.jpg` · `20-status-marks-terror-frost.jpg`(예전 스킬 아이콘 축소판).

## 6. 파일

`README.md` · `RUN-log.txt` · `capture-map.txt`(원본 McpScreenshots 파일명 ↔ 증거 이름 · 확대 범위) · `maker-build-log.json`(20:24:34 build 530줄) · `ref_D3_marks_delivered_x4.png` · 노드 `N1~N7_PC_after_*.png` + `_zoom.png` · 표식 `M1~M5b_PC_*.jpg`(전체 화면, q92) + `_zoom.png`(무손실 확대).
