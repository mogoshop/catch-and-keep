# 결정 2103 통합·대표 화면 — DEC-20261029-2203

정본: 공유 폴더 `codex-decisions-response-2103.txt`(결정 0~7) · `quality-feedback-remaining-2118.txt`(종료된 검수 — 반복 안 함) · `quality-feedback-decisions-2157.txt`(9ae7e413 코드 범위 수용). 결과 전체는 `maker-results-decisions.json`(공유 폴더에 같은 파일), 결정 상태는 `decisions-status.json`(공유 폴더 `decisions-status-2103.json`).
상태 칸의 「통과/부분확인」은 **Claude 판정**이다. 코덱스 독립 판정은 별도.

## 1. 통합 (메이커 멈춘 상태)

- 병합 `9ae7e413` = `git merge --no-ff wip/decisions-2103` (6baaf0c3·25159c74·a6c4206c·c4727bed·b0b207a8, 부모 ff4ad1c9). 충돌은 인수인계 §4 한 곳 — 본류 10번(REM)을 두고 작업 브랜치 10번을 11번으로 둘 다 보존.
- UI 재생성 `node tools/build.cjs ui`(본 폴더 빌더): ShadowHUD·CharSelectHUD·NavigationHUD가 바뀌었으나 **컴포넌트(UITouchReceive·FaceDilate 포함)·엔티티 배열 순서·형제 상대 순서는 커밋본과 모두 같고** displayOrder 번호(100·80·8개)와 id(0·2·12개)만 다시 매겨졌다 → 세 파일 모두 커밋본으로 되돌림. 그래서 「바이트 같음」은 아니고 「번호만 다름」. GameHUD 등은 바뀌지 않음. UI 재생성 커밋은 없다.
- 검사: `npm test` 12/12 · `check_data` 표 26개 문제 0 · `check_scripts` 142개 문제 0 · `check_mobile_layout -v` 문제 0(I04 BasicAtk↔Attack 10.0 · BasicAtk↔S4 8.0) · LSP SkillWindow·SkillOffer 오류 0 경고 0 · `tests/quality/run.py` skills 통과 · roster 43/43 · mobile_input 88/88.
- 보존 diff(63520f13→9ae7e413): MobilePad.mlua·SkillBook.mlua(GetRankSummary·NotifyLearned)·*.csv(아이콘 RUID)·OfferBand 경로 0줄 · mlua는 SkillWindow(StatLine 두 줄 + DropHintDup)·SkillOffer(NodeChange 앞 DropHintDup)뿐 · RB04 시간선(MobileX0 100) 그대로 · ShadowHUD는 BasicAtk·S3·S4 UITransform 3개뿐 · `map/` 30맵 0줄.

## 2. 메이커 반영·실행 (KST)

| 시각 | 일 |
|---|---|
| 22:03:23 | 멈춤 상태에서 SkillOffer·SkillWindow.mlua·ShadowHUD touch (멈춤 뒤 6초+, touch 뒤 6초) |
| 22:03:29 | refresh 1회 → build 22:03:32 **Error 0** · Warning 96 · Info 435 (새 경고 1 = LWA-1111 DropHintDup `string.gsub` 반환값 2→1, 영향 없음) — `build-log-summary.json` |
| 22:04 · 22:05:42 | set_platform mobile(Apple iPad (5th gen), safeArea 끔) → play → 22:06:22 방 `game:s1b89cc56009`(마지막 초소) → 22:06:53 저장 끔 |
| 22:08~22:11 | I04 대표 화면·런타임 사각형·「취소」 표시 |
| 22:11 | stop → set_platform pc(FHD) → 시범 맵 2장 `map/`에 빌드 → 22:11:57 refresh 1회 (build 그대로 Error 0) |
| 22:12:19 | play → 22:13:11 방 `game:s1b89e4defec` → 22:13:12 저장 끔 → 53·54 → 바닥 두 맵 |
| 22:20:57 | stop → `git checkout -- map/crabcave1.map map/stormeye.map` → `git status map/` 깨끗 → touch → 22:21:12 refresh 1회 |
| 22:21:29 | 확인 play(로비만) → 22:21:40 슬롯 4 원문 조회 → 22:21:54 stop |

HEAD = 9ae7e413. 컨텍스트 `server_main`·`client`·위 두 방. 이 담당 혼자 메이커를 썼고 Edit/Write 도구는 쓰지 않았다(파일은 Bash). 스크립트는 `DEC-maker-scripts.lua`, 로그 발췌는 `RUN-log.txt`, 캡처 대응은 `capture-map.txt`.

**준비와 검증**: 준비 = 저장 끄기 · 슬롯 배치(SetSlot) · 망령 질주 레벨 0/3 · 스킬 포인트 1 · 카드 셋째 칸 주입 · HP 999999 · 무적 시간 · `PlayerTravel:Go` · 몬스터 숨김. 검증 = 실제 단추 ButtonClickEvent(메뉴·스킬 창·시간선 칸·노드 칸·창 닫기·캐릭터 선택), MobilePad 처리 함수(손가락 down/hold/up), `RequestLearn` RPC, 그리고 그 결과 UI 글·로그·캡처.

## 3. 결정별 상태 (Claude 판정)

| 결정 | 코드 | 통합 | 실화면 | 요지 |
|---|---|---|---|---|
| 0 옛 저장 배너 | 63520f13 | 본류 | **2118 수용·종료(ff4ad1c9)** | 다시 시험하지 않음 |
| 1 글귀 확정 + 53·54 | 6baaf0c3 | 9ae7e413 | **통과** | 글귀 확정은 구현량 아님 · 53·54 표시 경로만 |
| 2 바닥 시범 | a6c4206c | 9ae7e413(옵션·격리만) | **시범 — 확대 여부 코덱스 결정 대기** | 메이커 시범 화면 확인(부분확인), 통과·확대 승인 아님 |
| 3 오라 소리 | 없음 | 해당없음 | 해당없음 | 기존 BtnLearn 확인음 경로 — 구현량 아님 |
| 4 I03 효과 칸 | 없음 | 해당없음 | 해당없음 | 현행 유지 — 구현량 아님 |
| 5 I04 ㉠ | 25159c74 | 9ae7e413 | **통과**(iPad 프리셋) | 간격 10/8/8/11.6 · 「취소」 표시 |
| 6 그림 요청서 | c4727bed | 9ae7e413(문서) | 해당없음 | 후보 제작·비교는 다음 단계 |
| 7 테스트 슬롯 | 없음 | 해당없음 | **2118 수용·종료(ff4ad1c9)** | 이번엔 저장 끄고 진행, 끝 확인 = REM 백업과 같음 |

### 5 · I04 ㉠ (iPad 프리셋 2048x1536)

- 고급 배치: 준비로 1~3칸(해골 전사·해골 마법사·뼈 의식)과 5번 칸=뼈 창을 넣고 입장 때 뜬 선택 보상 창을 닫음 → `BasicAtk.Enable=true`, 큰 단추 「뼈 창」. `I04-A_M_advanced_basicatk(_zoom).png` — 작은 「공격」 단추가 S4(빈 칸)·S3·큰 단추 사이에 붙지 않고 보인다. 4번 칸은 배운 액티브가 3개뿐이라 빈 칸.
- 런타임 사각형(패드 1920x1440 UI 단위): Attack x1640~1860 y60~280 · BasicAtk x1812~1908 y290~386 · S3 x1556~1676 y335~455 · S4 x1684~1804 y370~490 · S2 x1465~1585 y240~360.
  - **BasicAtk↔Attack 10.0 · BasicAtk↔S4 8.0 · S3↔S4 8.0 · S2↔S3 둥근 기준 11.6** — 2103 기록값·check_mobile_layout과 같음. 크기 Attack 220·BasicAtk 96·S1~4 120·Dash 96·AimCancel 92 그대로. (참고: Dash↔S1 사각형 2.0은 이번 변경 밖 기존 값)
- 끌기 「취소」 표시: `BeginGesture(S1)` → 8단계로 「취소」 위 → 유지 중 촬영 `I04-B_M_drag_cancel(_zoom).png`(빨간 「취소」, hover RGBA 0.88,0.20,0.18,0.92) → 그 위에서 놓음 → `[VRF] mobile aim cancel slot=1`, 서버 시전 줄 없음.
- 한계: 실기기·물리 터치·휴대폰 프리셋 미확인. 핸들러 본문 그대로라 홀드/줍기/취소 동작 재시험 안 함. `maker_mouse_input` 안 씀. iPad `maker_screenshot`은 모서리를 잘라 `_mcp`로만 두고 창 캡처(`wincap/`)에서 잘라 씀.

### 1 · 글귀 53·54 (PC FHD)

- 준비: 망령 질주 3→0(뼈 갑옷은 원래 0) · 스킬 포인트 1.
- 53 잔걸음 공방(`C53_PC_workshop_step_gale(_zoom).png`): Stat 「배우면: 질주 뒤 1.5초간 이동 속도 +15%」 **괄호 없음** · Desc 둘째 줄 「망령 질주를 배워야 발동합니다」.
- 54 뼈 껍질 공방(`C54_PC_workshop_dash_ghost(_zoom).png`): Stat 「배우면: 질주 끝에 뼈 갑옷 최대치의 10% 채움」 **괄호 없음** · Desc 둘째 줄 「뼈 갑옷을 배워야 회복합니다」.
- 53 혼의 제물 강화 카드(`C53_PC_offer_card_step_gale(_zoom).png`): 카드3 「강화 0→1 · 잔걸음」 초록 줄 「질주 뒤 1.5초간 이동 속도 +15%」(괄호 없음) + 호박색(#F4D27A) 「망령 질주를 배워야 발동합니다」. 준비: 선택 보상 대기 1칸 때문에 띠가 선택 보상을 먼저 여는 상태라 `SkillOffer.Open()`의 혼의 제물 분기를 그대로 실행하고 셋째 카드에 잔걸음을 주입(RB 회차와 같은 방식).
- 학습 알림 경로(로그 1줄): 망령 질주 0→3 복원 뒤 `RequestLearn("dash_ghost")` → `NotifyLearned` 알림 「새 스킬 · 뼈 껍질 Lv1 / 질주 끝에 뼈 갑옷 최대치의 10% 채움 **(뼈 갑옷을 배우면)** · 자동 적용」 — 공용 요약의 괄호는 학습 알림에서 유지된다.

### 2 · 바닥 시범 2맵 (PC FHD, 줌 80)

- 교체 확인: crabcave1 빌드 결과는 격리 산출(`../2026-10-29-floor-trial/maps/`)과 바이트 같음, stormeye는 새 경로 조각 `ArtZone12_2` id 1개만 다름(그 README 기재대로). 런타임 맵 그림 세기 — 집게 동굴 1층 ArtZone 스프라이트 132 · **FlipY 0** · FlipX 53 / 폭풍의 눈 238 · **FlipY 125** · FlipX 114 → 오프라인 시범(103→0 · 126→125)과 같다.
- 「전」 = 현재 871b60b4 메이커 캡처(`../2026-10-29-codex-apply/*-floormix-before-after-zoom80.jpg` 오른쪽 판)를 그대로 연결, 「시범」 = 이번 메이커 캡처. 나란히 놓은 판 `F2_crabcave1_before871b_vs_trial_zoom80.jpg` · `F2_stormeye_before871b_vs_trial_zoom80.jpg`. 원본 HUD 끔/켬 각 1장 `F2_*_trial_zoom80_hudoff/hudon.png`.
- 관찰(점수 없음):
  - **집게 동굴 1층**: 줄끼리 위아래로 맞물려 생기던 네 갈래 꽃·마름모 꼴은 보이지 않는다. 좌우 뒤집기 축마다 생기는 좌우 대칭 나비·세로 기둥 꼴은 그대로 남는다. 같은 돌 줄이 1.28칸마다 위아래로 되풀이되어 가로 띠가 보인다. 바닥 안 구멍·곧은 금은 보이지 않는다.
  - **폭풍의 눈**: 오프라인 비교에서처럼 거의 변화가 없다 — 담 윗면 맵이라 경계 보정이 줄 방향을 정해 꽃·마름모 꼴과 세로 대칭이 현재와 거의 같게 남는다(FlipY 126→125). 구멍·곧은 금은 보이지 않는다.
- 준비 한계: 촬영 가림을 막으려 그 맵 몬스터를 숨김 · HP 999999(HUD 켬 화면 왼쪽 아래 999999 표시). 첫 시도(22:18)는 무적 시간을 걸었는데도 Go 직후 Lv23 무리에 사망해 그 캡처는 버렸다(DEC-OBS-02). 카메라는 871b60b4 캡처와 같은 점으로 Go — 장식 기준 수 px 어긋남.
- 원복: `git checkout -- map/crabcave1.map map/stormeye.map` → refresh → `git status map/` 깨끗. 확대 여부는 코덱스 결정.

## 4. 테스트 캐릭터

슬롯 4 「새내기」 Lv40. 두 방 모두 입장 직후 `IsLoadSuccess=false`(저장 끔), 백업·복원은 하지 않았다. 22:06:10 로비 값은 REM FINAL-CHECK와 길이·가중합이 같음. 22:12:42 로비 값은 가중합만 달라 원문을 열어 보니 JSON 키 순서만 바뀌었고 내용은 REM 백업과 같았다(같은 값 재기록 흔적, 원인 미조사). 22:21:40 끝 확인도 같은 원문 — 이번 준비값(칸 배치·망령 질주 0/3·뼈 껍질 1·포인트·HP·사망)은 저장되지 않았다. `slot4-state-DEC.json`.

## 5. 새 관찰 (고치지 않음)

- DEC-OBS-01: build 새 Warning LWA-1111 — `SkillWindow.DropHintDup` 6줄 `local out = string.gsub(...)`(반환값 2개를 1개에 받음). 동작 영향 없음, 9ae7e413 수용분이라 그대로 둠.
- DEC-OBS-02: `PlayerTravel:Go` 직후 무적 시간(+3600)을 건 Lv40(생명 155) 캐릭터가 Lv23 무리에 사망. 시험 준비 방법 한계로만 기록(게임 결함 단정 안 함).
- M18-OBS-01 재현: iPad 방 입장 직후 OfferWin 기준 알림 자리 한 프레임 `side=below y=1427156` → 같은 초 `above y=1153`. 기존 관찰과 같음.

## 6. 함께 고친 기록

- `../2026-10-29-remaining/maker-results-remaining.json` F06-D에 `note_2118` 한 줄(코덱스 2118 구분 요구: scroll=true 표기 뒤 실제 스크롤 0→0 · 화면 밖 칸 이벤트 직접 전송 · 실제 사용자 스크롤/포인터 접근은 도구 제약). 공유 폴더 같은 파일도 같은 내용으로 맞춤.

## 7. 메이커 마지막 상태

편집 모드 · map01 · 플랫폼 PC(FHD). `map/`·`ui/` 작업 트리 깨끗(커밋본과 같음).
