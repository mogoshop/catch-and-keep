# RB-20261029-1903 — 가독성 4커밋 + 검사기 오탐 main 통합 · 바뀐 장면만 메이커 「후」 재검증

- 실행 묶음: **RB-20261029-1903** (19:03 refresh · 19:06~19:38 플레이 4번, Claude M2 단독 메이커)
- 소스: **6e0b8e8a81d70dbe358bc2445eacd02f19d3990f** (`codex/player-experience-polish` = main) — 메이커가 읽은 파일 = 이 HEAD 블롭(JSON `source.files`)
  - c3979f70 merge `wip/ui-readability-1709`(e1e3c10b: 306a8f66 · e97507fd · fabebfdc · e1e3c10b)
  - 83848dfb merge `wip/checker-ad2-01`(fea8c686)
  - ad3a693e fix(ui): **CARD-E1E-R01** — 경고 때 강화 카드 요약에서 설명에 없는 값(대검 「반경 ×1.8」)을 지우던 축약
  - 6e0b8e8a fix(ui): 숫자 뒤 조사 — 스킬 창 「랭크 2은」(**M18-OBS-03**) 외 같은 꼴 5곳 (글귀 승인 전, copy-review 62~67 · I03-8)
- 판정 구분: 아래 상태는 **Claude 자체 case 판정**이다. **코덱스 독립 판정은 별도(대기)**. 결과 JSON: `maker-results-readability.json`(공유 폴더에도 같은 파일).

## 1. 통합·검사 (메이커 멈춘 상태)

| 항목 | 결과 |
|---|---|
| 병합 | 충돌 없음(ort) — 두 병합 커밋 |
| `node tools/build.cjs ui` | GameHUD 바이트 = 브랜치 결과(blob cd5e001f · sha256 7dfba6be… = 코덱스 e1e3c10b 검수 값) · CharSelectHUD·NavigationHUD·ShadowHUD는 id/displayOrder만 흔들려 되돌림(커밋 안 함) |
| `npm test` | 12/12 통과 (검사기 자가 테스트 14건 검출·오탐 0 — fea8c686 포함) |
| `check_data` / `check_scripts` / `check_mobile_layout -v` | 문제 0 / 스크립트 142개 문제 0 / 요소 37·화면 4종 문제 0 (시간선 줄 2·간격 112·마지막 글 −306·막대 −318) |
| LSP diagnose | SkillBook·SkillOffer·SkillWindow·UndeadSystem·ShadowHUD(mlua) 오류 0·경고 0 |
| `tests/quality/run.py` (items journal skills roster mobile_input notice_text) | 전부 통과 · skills에 CARD-E1E-R01 의미 보존 검사 추가(대검 장면 Effect+Change에 반경 ×1.8·경고 원문·다음 랭크 수치 / 변이 노드 453건 중 441 값 유지, 나머지 12건은 두 자리 합성 경고만) · 음성 대조: e1e3c10b NodeChange로 돌리면 「R01: radius dropped from card」 실패 |

**보존 확인(ad2d080e → HEAD diff·메서드 비교)**: SkillBook 105메서드 중 RosterLine만(I03 의도) + 조사 2줄 · UndeadSystem 62메서드 중 PreviewFrom만 · SkillOffer는 Render + 카드 줄 새 메서드(NodeChange·DropShown·DropValueShown·CardWrap·PackCard·CardW) · SkillWindow는 StatLine·RenderWorkshop·RenderTimeline·Flip·SlotPathOf + 줄바꿈 도우미 · FormHint·RosterPreview·PowerLevelAt·CommandAuraAt·UseHint 그대로 · ItemData(GenerateQuestReward)·PlayerJournal(DailyAvailable·MonsterCount) 안 바뀜 · MobilePad·MobileLayout·ShadowHUD UI 파일 안 바뀜(I04) · GameHUD 엔티티 1623개 그대로, 바뀐 35개는 OfferWin 카드 Icon/Name/Effect/Change 12개 + SkillWin/WS Stat·Pip1~20·RankNote·Reason — OfferBand·BasicAtk·AimCancel 0 · INT-02(기본 인자 없음) check_scripts 통과 · 테스트 러너(run.py·test.cjs·package.json) 안 바뀜.

## 2. 메이커 시각표 (KST)

| 시각 | 일 | 근거 |
|---|---|---|
| 18:29~ | 편집기 「Error — An error occurred during mlua conversion」 대화상자(MAKER-ENV-01). refresh 전 `maker_logs build` = 547줄 전부 17:25:52(Info 453·Warning 94·**Error 0**) · normal 로그 0줄(직전 담당이 지움) → **원인 줄 못 찾음**. 사용자가 닫은 뒤 refresh·play 정상 | 이 README |
| 19:03:40 | 멈춤 확인 → 6초 → 바뀐 mlua 5개(SkillBook·SkillOffer·SkillWindow·UndeadSystem·ShadowHUD)+GameHUD touch → 6초 | RUN-log 머리 |
| 19:03:52 | refresh 한 번 → build 530줄(Info 435·Warning 95·**Error 0**) · 새 경고 1개 LWA-1110 IsMobilePlatform @SkillWindow.DisplayColumns(기존 경고와 같은 종류) | `maker-build-log-RB.json` |
| 19:06:04 | play PC FHD → 19:06:50 방 `server_instance_game:s1b872b181a5` → 19:07:08 저장 끔 | RUN-log |
| 19:08~19:25 | QR1629-OBS-01 PC · 편성 줄 · 카드 4종 · 거인 5주기 · 선택 보상 | RUN-log |
| 19:26:17 | stop → set_platform mobile(Apple iPad (5th gen), safeArea 끔) → 19:26:28 play → 방 `s1b8776d89f8` | RUN-log |
| 19:27~19:33 | iPad 골편 · 시간선 Lv20(1·2·3쪽)·Lv10 · 대검 카드 · 저장 POST 재조회 | RUN-log |
| 19:34:15 | set_platform pc(FHD) → 19:34:28 play → 방 `s1b8794e90f6` (마법사 r3) | RUN-log |
| 19:37:09 | play → 방 `s1b879eff8b1` (UI-5 뼈 창 — 준비 없음) → 19:38:30 stop | RUN-log |

마지막 상태: **편집 모드 · map01 · 플랫폼 PC(FHD)** · 플레이 멈춤.

## 3. 테스트 캐릭터와 저장

- 슬롯4 「새내기」 — 직전 담당들이 남긴 **Lv40** 상태(원래 Lv1)를 그대로 썼다. 되돌리지 않음.
- 네 방 모두 입장 직후 `PlayerSave.IsLoadSuccess=false`. 로비 PRE(19:06:35)와 iPad 방 POST(19:33:42) 재조회 값이 같다 → `slot4-pre-post-RB.json` (Lv40 · 경험치 219975 · 골드 200846 · 스킬 9종 · 가방 59 · 장비 갑주+단낫). 마지막 두 PC 방(19:35·19:37)은 POST 재조회를 안 했다 — 입장 직후 저장을 껐고 그 전 변경 없음.

## 4. 준비와 검증의 구분

- **준비(서버 스크립트, 검증 아님)**: 레벨·Exp 표시값·스킬 투자(`SkillBook.Levels` + `RefreshDigest`)·선택 보상(`ChoicePicks`/`ChoiceTiers`)·시험 반지/시험 낫 `AddItem`·`MaxDifficulty`·무적 시간·`PlayerTravel:Go` · 혼 마련(근처에 `fallenimp` 생성 후 `Monster:TakeDamage`로 처치) · 일으키기/뼈 의식은 서버 시전 함수 `SkillBook:Cast`·`CastRite(5)` · 의식 재사용 `ReadyAt` 0 · 셋째 카드 주입(`_SkillOffer.Offer[3]` + `RenderKey` 비움 → 게임 `Poll`이 `Render`).
- **검증(실제 UI 처리 함수)**: 단추는 실제 엔티티에 `ButtonClickEvent`(Bottom/Menu/BtnSkill · BtnMenu → MenuWin/Skill · 시간선 칸 · WS/N# · TL/Prev·NextPage · OfferBand · OfferWin/BtnClose) · 장비는 클라 `PlayerInventory:RequestEquip/RequestUnequip` · 화면 글은 게임 `Poll`이 그린 것만 증거로 씀 · 배치는 런타임 `anchoredPosition`·`RectSize` 산술(iPad 미리보기는 모서리를 잘라 찍고, 자식 `GetWorldCorners`가 부모와 어긋나게 나와 판정에 안 씀).
- 모바일은 **iPad 프리셋이며 실기기가 아니다**. 물리 클릭·터치 없음.
- 주의: 처음 대검 카드는 스크립트에서 `_SkillOffer:Render`를 직접 불러 execute_script 안 `GetPreferredWidth` 경로가 수 초씩 걸려 그리기 전 화면이 찍혔다(증거로 안 씀). 게임 Poll이 그리게 바꾼 뒤엔 즉시.

## 5. 장면별 전 → 후 (Claude 자체 판정 · 코덱스 독립 판정 대기)

| ID | 장면 | 전(INT1725·QR1629 판정) | 후 | 상태 | 대표 캡처 |
|---|---|---|---|---|---|
| RB-01 | QR1629-OBS-01 PC 골편(반지 착용·해제)·질주 | 「마/나 8」 접힘 | 비용 줄 자기 줄 · 「 · 」 경계 줄바꿈 · 칸 안 | **통과** | `QR1629-OBS-01_PC_after_shard_ring_zoom.png` |
| RB-02 | 같은 Stat 칸 편성+교체 안내 (전사 r2 · 대검 노드 · 마법사 r3 · 전사 r9) | (I03-1·2 「재사용 / 0.47초」 끊김) | 4·5·4·5줄 전부 칸 안 · **RB-OBS-01 없음** | **통과** | `QR1629-OBS-01_PC_after_roster_greatsword_node_zoom.png` |
| RB-03 | QR1629-OBS-01 iPad 골편 | F08-M_shard_ipad 접힘 | PC와 같은 5줄 칸 안 | **통과** | `QR1629-OBS-01_M_after_shard_ipad_zoom.png` |
| RB-04 | UI-5 뼈 창 「사거리 / 9.0」 | **부분확인**(QR1629-OBS-01) | 「사거리 9.0」 붙음 · 비용 줄 따로 | **통과** | `UI-5_PC_after_bone_spear_costline_zoom.png` |
| RB-05 | QR1629-OBS-02 iPad 시간선 Lv10·Lv20 | 「1/10」「배우기」가 둘째 행 아이콘에 가림 | 런타임 간격 +2 · 막대 4 · 넘김 1→2→3(끝 멈춤)→2 · 선택 시 상세 갱신 | **통과** | `QR1629-OBS-02_M_after_timeline_lv20_p1_ipad_zoom.png` |
| RB-06 | INT1725-OBS-01 PC 카드: 대검 0기 · 자리 없어짐 · 세기만 · 거인 중 0기 | I03-3·I03-4·I03-5 **실패**(경고 장식 밖) | 4장 모두 lines=3 · 경고 호박색 · 장식 안 · 「이 카드로」 그대로 | **통과** | `INT1725-OBS-01_PC_after_card_greatsword_zoom.png` |
| RB-07 | INT1725-OBS-01 iPad 대검 카드 | (PC 전 캡처) | lines=3 카드 안 | **통과** | `INT1725-OBS-01_M_after_card_greatsword_ipad_zoom.png` |
| RB-08 | 선택 보상 카드(UI-3 prep) | UI-3 autoopen | 세 축 카드 초록 줄 카드 안 | **통과** | `UI-3_PC_after_choice_reward_cards_zoom.png` |
| RB-09 | INT1725-OBS-02 거인 편성 줄 | I03-6 **부분확인**(「편성 6/5: 일반 1·방패 1·거인에 4」) | 「편성: 방패 1·거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 방패 해골(가장 오래된 방패 해골 교체)」 · 갈라진 뒤 「편성 5/5: 일반 2·방패 2·쌍칼 1 …」 · 서버 진단 have6/max5/reserved4/bodies1 | **통과** | `INT1725-OBS-02_PC_after_twin_giant_raise1_zoom.png` |
| RB-10 | CARD-E1E-R01 반경 ×1.8 | (코드 결함 확정) | 「대검 해골 2기 · 반경 ×1.8」 + 경고 2줄(16px 3줄) | **통과** | `INT1725-OBS-01_PC_after_card_greatsword_zoom.png` |
| RB-11 | M18-OBS-03 「랭크 2은」 | 관찰 | 「랭크 7 · Lv21부터」·「랭크 16 · Lv42부터」·iPad 「랭크 6 · Lv11부터」 | **통과**(글귀 승인 전) | `QR1629-OBS-01_PC_after_dash_ring_zoom.png` |
| RB-UI2 | UI-2 F06-C 복합 알림 표시 프레임 | 자료 공백 | INT1725 담당 보완·코덱스 확인 — **다시 찍지 않음** | 통과(연결만) | `../2026-10-29-integration-i03-i04-ui/UI-2_PC_F06-C_reward_visible.png` |

세부(사전 상태·단계·기대·실제·전/후 절대경로·미확인 경계)는 JSON `cases`.

## 6. 새 관찰 (수정 안 함 — 보고 뒤 결정)

- **RB-OBS-01**: 없음 — 같은 Stat 칸 편성 장면 넘침 없음(코덱스 오프라인 보수 추정 6~7줄보다 실제 4~5줄).
- **RB-OBS-02** (P3 후보, 기존): 혼의 제물 카드 **설명(Effect)** 칸은 엔진 줄바꿈이라 「방패를 든/다」「4초/마다」「쌍칼을/든다」처럼 단어 가운데서 끊김 — QR1629-OBS-01과 같은 종류. Change 칸만 CardWrap으로 고쳐진 상태. (`INT1725-OBS-01_PC_after_card_shield_loses_gs_zoom.png`)
- **RB-OBS-03** (관찰, I03 규칙 영역): 거인 몸이 변이 기록(쌍칼 `s:twin!` · 방패 `s:shield!`)이면 쌍칼 노드·카드의 「뼈 거인이 서 있는 동안 0기」 경고가 빈칸(몸이 일반 `s:!`일 때만 보임). 거인 몸 = 목록의 마지막 기록. 방패 몸 때 서버 진단 「다음 소환: 해골 전사(오래된 5기 교체)」(로그 시각이 갈라짐 뒤라 섞였을 수 있음). 오프라인 roster 검사(방패 몸 거인)는 preview==raise 통과 — 결함 단정 안 함. (`INT1725-OBS-02_PC_after_twin_giant_on_twinbody_zoom.png` · `INT1725-OBS-01_PC_after_card_twin_shieldbody_nohint_zoom.png`)
- **RB-OBS-04** (P3 후보, 기존 배치): iPad 시간선 넘김 단추 `TL/Prev`(44×88, 판 x24~68·y−136~−224)가 첫 열 고리 왼쪽 아래(x26~68·y−136~−176)와 겹침 — 글은 읽히나 터치 대상 겹침 가능. (`QR1629-OBS-02_M_after_timeline_lv20_p2_pick_ipad_zoom.png`)
- **MAKER-ENV-01**: 위 2절 — 원인 줄 못 찾음(로그에 없음).

## 7. 못 한 것 / 대기

- 실기기·물리 터치·휴대폰 프리셋 · 재접속.
- 숫자 조사 고친 5곳 중 ShadowHUD 강화 한도·분해 창, SkillBook 초기화·옛 저장 이전 알림은 메이커 화면 확인 안 함(LSP·npm test만).
- iPad 방 입장·Lv20 준비·골편 Stat 로그 원문은 clear 실수로 잃음(화면·POST 재조회로 대조). 거인 셋째 주기 진단 줄도 같은 이유로 잃고 다섯째 주기 값을 씀.
- 5줄 Stat 장면은 BestFit 최소 13px 근처로 그려짐(설정 13~17은 그대로) — 코덱스 「글자 축소」 판정 필요.

## 8. 이 폴더 파일

`README.md` · `maker-results-readability.json` · `RUN-log.txt`(추린 로그) · `capture-map.txt`(원본 McpScreenshots 파일명 ↔ 증거 이름 · 확대 범위) · `maker-build-log-RB.json`(19:03:52 build 530줄) · `slot4-pre-post-RB.json` · 캡처 `<ID>_<PC|M>_after_*.png` + `_zoom.png` 25쌍. sha256은 JSON `evidence_sha256`.
