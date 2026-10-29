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

---

# 통합 스냅샷 뒤 메이커 단일 담당 — GOAL-MAKER-20261030-INT (2026-10-30 02:33~ · 누적)

- 실행: Claude Opus 5.5(메이커 단일 담당) · 판정 = Claude 자체 판정 · 최종 수용 = 코덱스
- 결과 원장: `maker-results-goal.json`(묶음마다 갱신 · 공유 폴더 같은 이름) · 시간순 기록: `RUN-log-INT.txt` · 조각: `GOAL-maker-scripts-INT.lua` · 전후 상태: `A-state-INT.json` · 캡처 원본 대응: `capture-map-INT.txt` · 슬롯4 백업: `slot4-backup-pre-INT.json`
- 입력 경로 표기: K = maker_keyboard_input · 창 단추 = ButtonClickEvent · handler_direct = 처리 함수 직접(물리 터치 아님) · script = 서버 RPC/함수 직접 · GM = 준비 상태 설정. maker_mouse_input은 쓰지 않음

## 반영 매니페스트

| 항목 | 값 |
|---|---|
| 기준 HEAD | 700d0c0f (= origin/main = origin/codex, 02:33 확인) · 메이커 map01 5a29ca07… = map/map01.map 루트 |
| 반영 1 | 02:33:45 6초 → 91698202..700d0c0f 바뀐 mlua 27 + map 12 + GameHUD UI touch → 6초 → refresh 02:33:58 → build Error 12(LEA-1102 옛 함수 모양) |
| 반영 2 | 부르는 LootSystem·PlayerQuest·SelfTest touch → refresh 02:35:20 → build 467줄 · Error 0 · Warning 100(+2 LWA-1111 DecodeMeta·ParseGearOffer) · LEA-3015 0 · GearChoiceWindow.codeblock 생성 |
| 플레이 1 | PC FHD · 02:38 · 방 server_instance_game:s1b8dcddb043 — ITEM-Q1 · D-M6 · ITEM-R1 · ITEM-R2 1부 |
| 플레이 2 | iPad 5th gen 프리셋 · 02:52 · 방 s1b8dffe91d3 — ITEM-R2 2부(재접속) · R1 채택 · RUNE-A1 |
| 반영 3 | 03:05 StashWindow(cd6f3bbb) touch → refresh → build Error 0 |
| 플레이 3~6 | PC FHD · 03:06~04:21 — A-OBS-02 확인·RUNE PC·D-M1~M5·ITEM-Q1 (a)(b)·D-M7/D-M7b (방 s1b8e3243fcd·s1b8eb58aa45·s1b8ecfa3228·s1b8edde4f42) |
| 반영 4 | 04:22 NpcWindow(9c6a5aa1)·StashWindow·GearChoiceWindow(50fed567) touch → refresh 04:22:20 → build 458줄 Error 0 · Warning 100 |
| 플레이 7 | PC FHD · 04:24~04:55 · 방 s1b8f56af280 — D-OBS-06 실화면 · A-OBS-05 실행 확인 · C0 연결 · C1 6장면 |
| 반영 5 | 04:55 GameData(24e861ab E155 연결)+UI 3 touch → refresh 04:55:50 → build 458줄 Error 0 · Warning 100 |
| 플레이 8 | PC FHD · 05:01~05:35(05:20 세션 한도 → 05:25 재개, 플레이 유지) · 방 s1b8fe2cf18e · 저장 끔·무적 — I07 전 장면 5 · E-M1 방패·대검·쌍칼 + 기본/마법사 조회 |
| 반영 6 | 05:38 SkillEffects(7ae14a86) touch + 맵 2(319efa00) → refresh 05:38:12 → build 421줄 Error 0 · Warning 100 |
| 플레이 9 | PC FHD · 05:38~ · 방 s1b907216770 · 저장 끔·무적 — I07 probe·후 장면·걷기 → C 영향 case 3 → C2 11 → D 끝조건 |

## A 묶음 (Claude 판정)

| case | 판정 | 핵심 근거 | 캡처 |
|---|---|---|---|
| REFRESH | 통과 | build 0 · gear choice window ready · InventoryWindow inspect-first ready | — |
| ITEM-Q1 | 통과 | 가방 가득 알림·무변화 → offer new → cancel → offer reuse(같은 카드) → confirm helm ver=1 → done quest=1 rarity=2 → received found=true → 「가방에서 보기」 1회 → open with reward selected=60 → 장착 first gearEquip · 「장착 완료 ▲6」 | A-Q1-1~6 |
| ITEM-R1 | 통과 | ①~⑤ · 다음 줄 ▶ line 2 · 취소 무료 · 1차 −1632 · 기존 유지 무료(mods 그대로) · 2차 −1632 · 채택 무료 → ② 마나 +12만 방어 +18로(다른 줄·등급·ilvl·소켓·잠금·이름 그대로) · 총 3264 | A-R1-1~4 · A-R2-3 |
| ITEM-R2 | 통과 | 대기 중 창고(UI)·장착·잠금(RPC 직접) 거부 + Warn · 저장 → 재접속 같은 대기 문자열·추가 비용 0 · 창고 왕복 바이트 같음(고정 줄 유지) · 예전 레어 「출처 기록이 없는 장비입니다」 | A-R2-1~4 |
| RUNE-A1 | 부분확인 | iPad: 「룬 준비됨 · 맞는 장비 필요」(금) → 2소켓 일반 갑옷 장착 「제작 준비됨」(초록) · 일반/마법 룬워드 판정·효과 같음(마법 +def 5만 더) · iPad에서 준비 전환·일반/마법 효과 대조, PC 03:08에서 준비 안내 추가 확인(GM 준비·입력 경로 한계는 유지) · 둘째 안내 줄이 첫 카드 위 테두리에 걸침(A-OBS-03) | A-RUNE-1~3 |

관찰(고치지 않음): A-OBS-01 카드 「아이템 레벨 42」 줄넘김 · A-OBS-02 창고 안내는 cd6f3bbb 수정 후 플레이 3 03:07 「넣기 요청: 짚신」으로 확인·종료 · A-OBS-03 룬워드 안내 둘째 줄 · A-OBS-04 「옵션 바꾸기 1632」 두 줄 · D-OBS-01 첫 장비 안내 Notify가 카드와 함께 뜸.

## D 묶음 (Claude 판정)

| case | 판정 | 핵심 근거 | 캡처 |
|---|---|---|---|
| D-M6 | 부분확인 | 되돌림(해제) 뒤 유효 피해 80 → gear used 0 · 다시 장착 뒤 유효 피해 → first gearUse t=513 · gear used after equip and effective damage slot=helm (1회) · 막타 크레딧만·다른 맵 음성 미시행 | — |
| D-M1 crypt2 | 통과 | zones want=43 placed=31 pool=12 same=true zonedPacks=4 fallback=0 (c=6 e=6) · 회랑 W→E 36.7초 · 유물 곁방 8.0초(입구 몰림·저주 상자 매복 5) · 구덩이 방 11.1초 · 해골 3기 처음 구간 따라옴 | D-M1-1~3 |
| D-M3 lighthouse1 | 부분확인 | zones want=44 placed=33 pool=11 fallback=0 (r1=6 r2=3 c=3) · 남쪽 길→홀 29.3초·41.9칸 / 북쪽 길→홀 27.9초·39.8칸 · 홀→서쪽 곧은 길 16.5초(+3칸 ≈ 설계 27) · 집 입구 곁 이동 없음 · 길 위 상자 8.5초 → 매복 5 · 상자 뒤 E 포털은 장판 사망으로 못 걸음 | D-M3-1~4 |
| D-M4 demonroad | 부분확인 | zones want=44 placed=32 pool=12 fallback=0 (b=4 r2=4) · 길 위 사건 1 · 행군로 W→동문 앞 52.6초·74.7칸(+3 ≈ 79) 상자 미발동 · 보급 성벽 우회로 35.9칸(행군로 같은 구간 22.4칸) → 상자 매복 5 · 신전 2 · q19 60처치 미시험 | D-M4-1~3 |
| D-M2 temple2 | 부분확인 | zones want=40 placed=31 pool=9 fallback=0 (b=9 c=6 d=4) · 남쪽 회랑→아슈 32.4초·45.4칸 / 북쪽 곁길 34.2초·47.3칸(역방향 · 길찾기 실패 3) · 아슈 GM 처치 → bond rage(1.5×, 크기 1.15×) · 나슈 처치 → quest goal 2/2 · E → temple3 | D-M2-1~3 |
| D-M5 gallows | 통과 | Space → npc field altar open → field report q4 · first q4reportField · 3칸 밖 단추 없음 · field accept q5 · 일지 열고 닫기 유지 · Save → 재접속 q5/1 유지 · 새 게임 처형인 재등장 · 마을 오렌 경로 q5 수락(현장 줄 없음) | D-M5-1~5 |
| D-M7 액트 2 첫 10분 | 통과 · 코덱스 0424 종료 | 1차(03:56~04:04 · 저장 끔): 조작·시간 관찰만 — Telemetry 세션이 IsLoadSuccess=false면 없어 A2 표본 무효(시험 준비 실수) · b 재실행(04:07~04:18 · 저장 켬): act2Enter t=931 → 수락 4.0초 → dunes 14초 → 습격 n=16 → 목표 4분 36초 → 귀환 54초 → 보고 거절(가방 60/60 · 「퀘스트와 보상은 보관됩니다」) → GM 1칸 → 카드 → 투구 수령 · A2 표본 120행 over 0(600초 완결) · 대기·준비 빼면 약 350초 (Lv40 과레벨·GM 생명 바닥 — 실제 Lv13 대표 아님) | D-M7-1~8 · D-M7b-A2-sample-rows.txt |

관찰(고치지 않음 · D·A 추가):
- D-OBS-02 큐 시작점이 포털 칸(crypt2·lighthouse1) — 도착 유예 뒤 이웃 맵으로 넘어감(시험 시작점 문제)
- D-OBS-03 몬스터가 벽·기둥 칸에 끼어 CoopRules unstuck으로 꺼내짐(lighthouse1 3 · temple2 1 · demonroad 2)
- D-OBS-04 temple2 문지기 하나만 쓰러져도 귀환 포털(→oasis) 열림
- D-OBS-05 temple2 북쪽 곁길 클릭 이동 길찾기 실패 잦음(3칸 넘는 경유점)
- D-OBS-06 제단 대화 초상화 빈 칸 → 코드 통합 9c6a5aa1 (통합 담당 · 코덱스 0354) / 실화면 확인 04:26 플레이 7 「피의 제단」 1/2 왼쪽에 오렌 그림(D-OBS06-gallows-altar-dialog-oren-portrait-after-9c6a5aa1.png) · 코덱스 0431 종료
- D-OBS-07 GM 무적은 장판 지속 피해를 막지 않음(시험 장치 한계) — lighthouse1 상자 매복 뒤 사망
- A-OBS-05 부위 카드 창이 첫 제안 때 열리자마자 닫힘(D-M7 의뢰 7 보고): Client RPC OpenGearChoice가 @Sync GearOffer보다 먼저 도착 → GearChoiceWindow.Poll 「quest.GearOffer ~= self.Offer」로 닫음 · 다시 Space로 열면(reuse) 유지 · 타이밍 의존(Q1에서는 안 남) → 코드 통합 50fed567 (통합 담당 · 코덱스 0420 v2) / 실행 확인 04:27 플레이 7 q13 새 제안 첫 보고: 카드 8.5초 표본 모두 유지 · 장갑 1회 지급 · 닫힌 창 추가 선택(Pick1 클릭+Choose(3)) 차단(A-OBS05-1~2) · 6초 지연 가지는 이번 Show가 이미 전체 합치라 오프라인 검증 범위 · 코덱스 0431 종료

## C 묶음 (I05 실전 계측 · Claude 판정 = 실행·원장만, 비교 판정은 코덱스)

- 방 Telemetry = 플레이어가 있는 Solo 방(server_instance_game:s1b8f56af280) · S00 preflight ok users=1 · 조각 원문·해시 `C-raw/inputs/` · 원장 `C-raw/*.log`, `C-raw/raw/*.log`
- C0 연결(test-plan §4 연결 조각 그대로 · execution · hellhound C05_link): run1 소환 3타(overkill 43.56) · run2 소환 2타(준비 스크립트 연속 전송으로 미실행 — 함정 기록) · run3 직접 player.basic 8타(overkill 5.56 · tag_hit 8) · 세 run 모두 end ev_omitted=0 · absorbed 0 → 코덱스 0440 부분 수용(흡수 경계만 미확인)
- C1 Lv15 6장면(auto · rep1 · origin GOAL-MAKER-INT-P7-20261030T0425): run4 summon boss 원 좌표 = 준비 실패 표본(보스 12칸 · timeout · 피해 0 · 성능 제외, 시전 33·마나 211·소환 5 계측 연결은 수용) → 좌표 보정 `C-raw/raw/coords-fix.txt`(보스 18→11 · 무리 0→-5, 코덱스 0441 수용)

| run | 장면 | 종료 | 유효 피해 | 비고 |
|---|---|---|---|---|
| 5 | L15-summon-boss | player_dead 15.8초 | 48 | 보스 curtain 6줄 · 받은 161/최대 81 · 보스 lv21 생명 47803 |
| 6 | L15-magic-boss | player_dead 16.4초 | 40159 | 골편 155타/시전 19 (C-OBS-01) |
| 7 | L15-curse_mix-boss | player_dead 9.1초 | 0 | 준비 10초 중 시험 밖 유입에 사망 · 대상 전 (C-OBS-02) |
| 8 | L15-summon-horde | player_dead 20.9초 | 2217 | 처치 3/14 · 해골 1772 · 마법사 383 |
| 9 | L15-magic-horde | cleared 11.2초 | 7409 | 14/14 · 피격 없음 |
| 10 | L15-curse_mix-horde | player_dead 15.3초 | 2135 | 처치 3/14 · 저주 92% |

집계 `C-raw/aggregate-P7-stage1.{md,json}` (원장 검사 7/7 ok · absorbed>0 run 없음). 관찰: C-OBS-01 magic 보스 시전당 ~8타 묶음(원인 미확인) · C-OBS-02 arenaClear 1회 뒤 유입이 준비 중 시험 캐릭터를 죽임 · C-OBS-03 L15 보스 장면의 대사제는 lv21·생명 47803, 생명 81 시험 캐릭터는 세 빌드 모두 16초 안 사망. C2(9+2)는 E·I07 뒤.

코덱스 검토 오버레이(0504·0509 · `C-raw/aggregate-P7-stage1.{md,json}`에 submission-review.patch 적용 → json f8d9276a · md 2688b8da): 원장 검사 7/7 ok는 산술·연결성 뜻(수집 유효성 아님) · 실제 교전 5건(run5·6·8·9·10) · run4/7 준비 실패는 서술 비교 제외 · run6/9는 C-OBS-01 수정 전 마법 진단(원값 보존 · 최종 성능 비교 미확정) · TTK는 피격 개체 기준(전체 생존 아님) · run8 표본 death0 ≠ 최종 사망 · 전체 창 vs 보정 교전(raw_active+구간 중앙값 보정) 시간 분모 구분 · 원 7run 값·raw·aggregate.cjs 무변경(재실행 없음). 후속(별도 통합·실행 수용과 구분): C-OBS-01 → 7ae14a86(SkillEffects 부모 HitIds 복사를 Launch 뒤로 · 코덱스 0457 · 다음 E refresh 반영 뒤 마법 case만 재실행) · C-OBS-02 → a9ad577b(현재 맵 InflowOn 저장/중지/원복 수집 준비 · fix2 입력 · 코덱스 0500 · E/I07 뒤 curse-boss 1건).

## E 묶음 (Claude 판정 · 155 연결 24e861ab 반영 뒤)

| case | 판정 | 핵심 근거 | 캡처 |
|---|---|---|---|
| E-M1 방패 | 통과 | 05:08:32/05:25:54 rite giant start atk=363 look=shield scale=1.20 · HUD 초상 ui_giant_shield · 05:26:02 공격 화면(05:25:57 hit/58 skill은 별도 시점 호출 로그) · 1차 05:08:52 split sec=0.60 → split back=4/4 respawn=true · 갈라진 뒤 일반 외형·HUD 방패 3/일반 2 부분 관찰(일반 20초 분리 뒤 복원 · 5개체 독립 계수 아님) (코덱스 0520: 원래 2장 + 05:08 run 부분 수용, 공격만 추가) | E-M1-1~3 |
| E-M1 대검 | 통과 | 05:27:20/05:32:18 look=greatsword hp=4067/4218 · 공격 중 대검 휘두르기 · 2차 05:32:38 split sec=0.60/back=4/4 로그 → 뼈 더미로 무너짐 → 숙주 원래 대검 해골 모습·HUD 대검 3/일반 2(일반 20초 분리 뒤 복원) | E-M1-4·5(겹침 후보)·10~12 |
| E-M1 쌍칼 | 통과 | 05:30:34 look=twin hp=3275/3426 · 공격 중 분홍 쌍칼 · 몸 유지 → 갈라짐 폭발 → 작은 빨간 쌍칼 숙주 모습·전환 중 HUD 부분 관찰(일반 20초 분리 · 이 발췌에는 쌍칼 back=4/4 로그 없음) | E-M1-6~9 |
| 기본/마법사 | 자리만 | 05:06:53·05:35:27 GiantLook basic/''/mage 6동작 6/6 · HUD ui_giant_basic c4c41598…/mage 8dacb199… · 마법사 자연 선발 없음(dormant) — 실화면 없음 | — |

- 입력: GM 편성 준비(DismissAll · 변이 랭크 목표 3·나머지 0 · FormHope '' · 혼 6 · MaxDifficulty 0→1) → script 서버 SkillBook.Cast raise_skeleton ×5 · CastRite(5)(마나 30 소비 · 재사용 27.9) · GM 더미 drownedsailor(생명 50000 유지) · 3차부터 유입 끔·둘레 정리 뒤 되돌림. 조각 `RUN-log-INT.txt` 플레이 8 구간.
- 정책 불변: 공격 363 = ATK 66×5×1.1 · 생명 = 다섯 합×1.2 · 20초 · 마나 30 · 재사용 30 · 반경 1.8 · GiantArtScale 1.2 · 숙주 = 가장 튼튼한 해골.
- 한계: 방패 갈라짐 0.6초는 스크린샷 지연(≈3초)으로 놓침(대검·쌍칼로 확인) · 쌍칼 2차(유입 켠 채)는 캡처 미사용.
- 근거 귀속(코덱스 0543 문서 후보 뜻만 병합 · 수치·RUN·PNG 무변경): split back=4/4 발췌는 방패 1차(05:08:52)·대검 2차(05:32:38) 것 · 방패 05:25:57 hit/58 skill 호출 로그와 05:26:02 공격 캡처는 별도 시점 · 쌍칼은 분리 효과·작은 숙주·전환 중 HUD까지의 부분 범위 · 정지 화면은 연속 전체 클립이나 독립 5개체 복원 증명이 아님 · E-M1-1 더미 drownedsailor ×200은 준비 의도였으나 적용되지 않아 05:08:34 두 더미가 각각 363 한 타에 쓰러짐(서기 촬영 전).
- E-IF-01 원조건(갈라짐 0.6초 안 재진입 뒤 원래 외형·크기 복구)은 위 일반 분리 복원과 다른 근거 — 코덱스 0538/0545: v2 템플릿(ba13cd13) 직접 엔진 메서드 probe 1회를 C run 끝 정리 뒤 쉬는 소유 해골이 있을 때 실행(별도 줄로 기록 예정).

## I07 (=D-M8) 접합 시범

- 전 장면(패치 전 · 플레이 8 · 반영 24e861ab): 05:03:16 I07-1 demonroad 서문 (-31.5,0.5) · 05:03:48 I07-2 동문 (31.5,2.5) · 05:05:25 I07-3a wreckcoast (-7.3,3.15)(캐릭터가 자리 가림) · 05:05:58 I07-3b (-5.3,3.15) · 05:06:28 I07-4b (8.5,2.9) — 보통 줌 · 카메라 = 플레이어 · GM 둘레 정리 · wreckcoast 유입 끔(촬영 뒤 되돌림). 커밋 2f59f95f. 등록 패치 319efa00(통합 담당) → 다음 refresh 뒤 같은 5자리 후 장면.
- 반영 6(05:38:12 · SkillEffects touch + 맵 2 · build 421줄 Error 0) → 플레이 9 probe 05:40:40 서버 ArtJoin 6/6(demonroad 4 · ruid 6d4f6518… / wreckcoast 2 · ruid 0742d8a2… · MapLayer0 order 1) · 05:43:05 클라이언트 vis true · order 0(DarkVision가 맵 그림을 뒤로 · 둘레 바닥 그림과 같은 층·순서·z).
- 후 장면(플레이 9 · 같은 5자리·줌·캐릭터·GM 준비): 05:43:31 I07-1 after · 05:44:14 I07-2 after · 05:45:12 I07-3a after · 05:45:48 I07-3b after · 05:46:24 I07-4b after. 보정 없음.
- 걷기(K 방향키): W1·W2 소금 딱지 2 (끝 6.87,2.90) · W3 소금 딱지 1 (끝 -6.91,3.15) · W4 demonroad ArtJoin1 (끝 -28.26,1.00) — 캐릭터·이름표가 접합 그림 위 · 막힘 없음.
- 관찰(판정은 코덱스): demonroad 두 문은 옅은 가로 포장 띠가 더해지고 세로 직선 경계는 그대로 · wreckcoast 두 곳은 하얀 소금 껍질(물보라 모양)이 경계·직각 안쪽 모서리 위에 얹힘 · 3b 상자 전리품 차이는 장면 차이(접합 무관).

### C 영향 case 재실행 (플레이 9 · origin GOAL-MAKER-INT-P9-20261030T0551 · SkillEffects 7ae14a86 05:38 반영 뒤)

| run | 장면 | 사용 입력(sha256) | 종료 | 유효 피해 | 비고 |
|---|---|---|---|---|---|
| 1 | L15-magic-boss | magic-boss-fix1-P9 957e389f… (fix1 + origin) | player_dead 17.8초 | 15822 | bone_shard 18시전 54타 = 시전당 3.0 (수정 전 run6 19시전 155타는 진단) |
| 2 | L15-magic-horde | magic-horde-fix1-P9-sent fd49b76a… (= horde-fix1-P9 c1c18895와 32행 보스 줄(horde 미사용 · 18→11)만 다름) | timeout 121초 | 7024 | 13/14 10.7초까지 · firecultist_13 한 번도 안 맞음(관찰) · 수정 전 run9 14/14 |
| 3 | L15-curse_mix-boss | curse_mix-boss-fix2-P9 c1e7ea8b… (fix2 ddf42c86 + origin · 보스 (11,1)) | player_dead 17.8초 | 2739 | inflow pause spawners=1 → 준비 10초 생존 → inflow restore restored=1 skipped=0 (수정 전 run7 준비 중 사망) |

집계 `C-raw/aggregate-P9-cobs-rerun.{md,json}`(원장 검사 3/3 ok) · preflight `C-raw/P9-S00-preflight.log`. 비교 판정은 코덱스.

코덱스 검토(0557·0603·0605·0607 · 해석만 · 위 수치·raw·입력·집계 json/md 무변경 · 재실행 없음): C-OBS-01 소스 수정(7ae14a86)과 수정 뒤 magic boss(18시전 54타 = 시전당 3.0 · player_dead)·magic horde(13/14 timeout)는 실제 원장으로 수용·국소 종료 — 처치 성공·빌드 우열/DPS 순위가 아니며, 수정 전 run6/9(P7)는 진단 표본. C-OBS-02 curse-boss fix2는 준비 10.01초 생존 → 대상 교전 11타/2739 → 유입 복원 1까지 연결 수용·종료(반복 실행 없음). 새 집계 3행 산술은 맞음(3행 모두 outcome=not_completed). 집계 md의 horde TTK `0 (13/0)`은 「피해를 받은 개체」 분모(피해 받은 13 개체 표본/미처치 0)이지 장면 전체 생존 0이 아님 — 한 번도 맞지 않은 C05_firecultist_13 1 생존(alive_targets 1). 집계 md 끝 주석의 unsupported는 「관측 없음」이지 hook 없음·수치 0 확정이 아님(0504 해석 그대로).

## B 편입 (재실행 없음)

dc44af6c의 B-M01~03 증거 10파일을 원장에 그대로 연결 — 코덱스 부분 수용(0140·0141·0210) 그대로, 실행 소스 63aabe43(PC)/91698202(iPad) 구분 · 포인터 미확인 · 슬롯4 01:19 저장 변경 미복원.

## 슬롯 4 「새내기」

- 02:38:34 캐릭터 선택 화면에서 BatchGet 5키 백업(Account 615 · Char_4 1126 · Inv_4 1838 · Shadow_4 40 · Stash 83 바이트) + 해시 → 로컬 사본 5/5 일치.
- 저장: 02:51:50 ITEM-R2 Save(true) · 03:47:01 D-M5 Save(true) · 03:51:15 ITEM-Q1 (a) Save(true) · 04:07:31~ 플레이 6 저장 켬(D-M7b · 퇴장 저장 q8/0 남음 — 플레이 7 시작 때 확인). 나머지는 저장 끔(플레이 7은 끔 · C S10도 저장 끔).
- 복원: 마지막 묶음 뒤 BatchSet + 재조회(대기).
