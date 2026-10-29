# 갈래 B — I03 단계 2 희망 편성 · I04 골편 홀드 반복 (2026-10-30)

- 브랜치 `wip/goal-B-roster-input` · 기반 main `4ba51d5e` · 담당 Claude(Opus) · 메이커 MCP 사용 0 (메이커 확인은 아래 「메이커 대기열」로 제출)
- 계약: `goal-execution-contract-0030.txt` 갈래 B · 사전 검토 `goal-roster-input-review-plan-0035.json`(B-R01~R08 · B-T01~T06 · B-M01~M03) · 중간 검토 `goal-B-inflight-review-0047.json` B-DRAFT-01 반영
- 상태: **구현 · 비Maker 검사 통과 · 통합/메이커/독립 판정 대기**. 실제 터치·실기기·재접속은 확인하지 않았다.

## 1. 결정 (되돌릴 수 있는 선택 · 근거)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 희망 편성 저장 = `SkillBook.FormHope` 문자열(`s:d:shield=1,greatsword=0,twin=2/m:a:aura=1`) · 종류별 모드(a 자동/d 직접)+희망 수 · `@TargetUserSync` · 저장 `skills.hope` | SkillBook은 B 소유 · PlayerSave(공용) 무변경 · 옛 저장은 칸이 없어 빈 문자열 = 자동 · `sv` 4 그대로 |
| D2 | 자동 = 고정 4ba51d5e 규칙 그대로(무너질 개체를 센 채 PickForm) · 직접 = 무너질 가장 오래된 개체를 뺀 남은 편성에서 희망 수에 모자란 첫 변이 | 자동 결과 동일(무작위 3000상태 대조) · 직접은 정원이 찬 뒤에도 희망 수로 모임(옛 규칙대로면 교체될 방패를 세어 방패가 0↔1로 흔들림) |
| D3 | 배치 수 = `PlaceQuota`(min(희망, 노드 랭크), 변이 순서대로 정원 안) · **세기 = 노드 랭크(FormQuota) 그대로** | B-R01 · 희망을 낮춰도 방패 방어·쌍칼 속도·저주 세기 불변 |
| D4 | 하나의 순수 계획 `UndeadSystem.PlanNext` (입력: 정원·노드 랭크·희망·목록·거인 예약 → 출력: 다음 변이·keep·무너질 기록·배치 수·잘림) — 미리보기 `PreviewFrom`·실제 `MakeRecord`/`Raise`·장기 `SteadyRoster`가 모두 이것만 부름 | 계약 「동일 순수 계획」 |
| D5 | 생성 대기 중 계획(변이 + 무너질 기록 정체)이 바뀌면 **혼 소비 전에 거절**(`SamePlan` → 기존 fail: 혼 예약·PendingMana 해제 · 옛 개체 그대로 · 안내 「소환하는 사이 편성이 바뀌어 취소했습니다 · 다시 사용해 주세요」) | B-DRAFT-01 · 변이만 지키고 새 교체를 적용하지 않음 · 자동 모드에도 같은 확인(드문 경쟁에서 실패가 생길 수 있음 — 대신 계획 불일치 0) |
| D6 | 장비·노드·초기화로 정원/랭크가 줄어도 저장 희망 수는 그대로 · 계획에서만 자름 · 편성 줄 끝 「희망 중 n기는 정원·랭크를 넘어 일반형으로 섭니다」 | B-R02 · 계약 「덮어쓰기 금지」 |
| D7 | 자동→직접 첫 전환 시작값 = 지금 자동 편성의 장기 모습(SteadyRoster)을 변이 순서대로 정원 안에 담은 수 · 직접의 빈 칸은 0(명시 일반형) · 자동으로 되돌려도 희망 수 보관 | 바꾸자마자 편성이 엉뚱하게 달라지지 않게 |
| D8 | UI = 새 창 없이 스킬 창 공방 강화 트리 오른쪽 아래 빈자리 `SkillWin/WS/Form`(머리 글 + 큰 단추 + −/+) — 해골 전사·마법사·골편 트리에서만 켬. 변이 노드 선택 시 「방패 희망 1/3」(직접)·「방패 자동 n기」(자동) | 그 세 트리는 노드가 5열 첫 줄까지라 5열 둘째 줄~6열이 빔(검사기로 확인) · 단추 88 · 여백 ui-tokens(SPACE·BUTTON·SKPANEL) |
| D9 | I04 설정 = `SkillBook.ShardHold`(기본 끔 · 저장 `skills.shardHold`) · 토글은 같은 WS/Form(골편 공방 · **모바일에서만** 보임 — PC 영향 없음) | 계약 「설정 토글 기본 off」 · 새 창 금지 |
| D10 | 홀드 반복 = 골편 칸을 0.35초 이상 누르면 `ShardTick`이 **기존 `SkillBook.CastSlot`**을 재사용 간격마다 다시 부름(서버 Cast의 마나·재사용·PendingCasts·CastEpoch 그대로) · 마나 부족·재사용 중엔 요청 안 보냄 · 짧게 떼면 예전처럼 놓을 때 한 번 · **반복한 손가락은 뗄 때 한 발 더 쏘지 않음** | B-R07/R08 |
| D11 | 멈춤 사유: menu(창·안내 창)·edit·dead·map·aim(「취소」 위로 끌기)·focus(앱 전환)·slot(칸 바뀜)·toggle(설정 끔)·owner(손가락 소유권: 뗌 정리·큰 단추 줍기·기본 공격 반복)·release | 계약 「메뉴/사망/맵/조준/소유권 취소 즉시 중단」 |
| D12 | 기본 공격 동시 발동 금지 = **공통 입구 `PlayerAttack.SubmitBasicInput`**에서 `MobilePad.BlocksBasic()`(골편 홀드 소유 중)이면 막음 — 작은 단추·큰 단추·네이티브 반복(PlayerActionEvent)·Ctrl·ClickControl 탭 접근 모두 이 입구를 지남 · 제스처 소유권은 기존 한 손가락 | B-R06 · 조정자 지시(AttackTimer만으로 막지 않음) |

## 2. 구현 위치 (줄은 이 브랜치 HEAD 기준)

- `RootDesk/MyDesk/Undead/UndeadSystem.mlua` — `Raise` 367(확정 직전 PlanFor·SamePlan 거절 398~411) · `MakeRecord` 451(계획 스냅샷 planForm/planVictims) · `ApplySkeletonForm` 587 / `ApplyMageForm` 618(pick 인자 · 세기 FormQuota) · `ParseHope` 689 · `EncodeHope` 708 · `HopeOf` 725 · `PlaceQuota` 733 · **`PlanNext` 759** · `PlanFor` 786 · `SamePlan` 791 · `LogPlan` 802 · `PreviewFrom` 868 · `SteadyRoster` 911 · `ExtraSlotsFor` 941
- `RootDesk/MyDesk/Skill/SkillBook.mlua` — 속성 `FormHope`·`ShardHold` 38~41 · `FormHint` 734(직접 모드 안내) · `RosterLine` 782(「직접 편성」 머리말 · 잘림 안내) · `AutoHope` 818 · `RequestFormMode` 832 · `HasHope` 844 · `RequestFormHope` 853 · `SaveFormHope` 896 · `RequestShardHold` 903 · `GetSaveData` 1853 · `LoadSaveData` 1867 (진행 담당 D가 닿는 옛 1683~1712 구간 본문은 건드리지 않음 — 줄 번호만 밀림)
- `RootDesk/MyDesk/UI/Hud/MobilePad.mlua` — `BeginGesture` 118 · `UpdateGesture` 147 · `EndGesture` 170 · `ClearGesture` 191 · `HoldTick` 303 · `ShardStopCheck` 316 · `StopShardHold` 335 · `BlocksBasic` 347 · `ShardTick` 353 · `Poll` 530
- `RootDesk/MyDesk/Combat/PlayerAttack.mlua` — `SubmitBasicInput` 98(게이트 101~105, 5줄 · B 조정 작은 patch)
- `RootDesk/MyDesk/UI/Windows/SkillWindow.mlua` — `Poll` 147(키에 FormHope·ShardHold) · `RenderForm` 387 · `FormMode` 428 · `FormStep` 442
- `tools/build/ui.cjs` — SkillWin `WS/Form` 섹션(446~463) · 생성물 GameHUD에 엔티티 5개만 추가(다른 UI 파일의 빌더 버전 차이는 되돌림 — 부모가 최종 재생성)
- `tools/check_mobile_layout.cjs` — WS/Form이 세 트리 노드·필요 랭크 머리와 겹치지 않음·판 안·단추 88 검사(324~)

## 3. `[VRF]` 로그 키 (출시 서버에서는 끔)

| 키 | 쪽 | 뜻 |
|---|---|---|
| `[VRF] roster plan kind= form= direct= max= have= keep= victims= clipped=` | 서버 | MakeRecord가 정한 다음 소환 계획 |
| `[VRF] roster raised kind= form= planned= match=true trimmed= direct=` | 서버 | 확정된 소환 = 계획 |
| `[VRF] roster raise rejected stale plan kind= planned= now= victims=a/b` | 서버 | 대기 중 계획이 바뀌어 무소비 거절 |
| `[VRF] roster hope saved kind= why= hope=` / `[VRF] roster hope restored hope= shardHold=` | 서버 | 희망 수 저장 / 불러오기 |
| `[VRF] roster form ui kind= form= head= next=` | 클라이언트 | 스킬 창 편성 칸 표시 |
| `[VRF] shard hold setting on=` | 서버 | 홀드 반복 설정 |
| `[VRF] shard hold start slot= touch=` · `[VRF] shard hold cast n= slot=` · `[VRF] shard hold stop reason= sent= slot=` | 클라이언트 | 반복 시작·요청·중단 사유 |
| `[VRF] basic input blocked by shard hold` | 클라이언트 | 공통 입구에서 기본 공격 막음 |
| (기존) `[VRF] cast committed bone_shard mana=` | 서버 | 실제 확정 시전 (요청 수와 따로 셈) |

## 4. 비Maker 검사 (로그: 이 폴더 `quality-6groups.log` · `npm-test.log` · `check_mobile_layout-v.log` · `mutation.log`)

- `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua` 6그룹 exit 0 — roster 91/91(기존 43 + 새 48) · mobile_input 32장면 154/154(기존 17장면 88 + 새 15장면) · skills 새 편성 칸 블록 통과
- `npm test` 12/12 (데이터·스크립트 참조·모델/맵·움직임 불변식·창 가림·모바일 HUD 배치·공통 UI 규격·말투·결정 26·자가 테스트)
- 변이(mutation) 9건 중 8건을 검사가 잡음. `aim-stop`(ShardStopCheck의 CancelHover 줄 제거)은 UpdateGesture가 같은 순간 직접 멈추므로 이중 방어라 통과 — 결함 아님
- mLua LSP diagnose(훅 스크립트 직접 실행): UndeadSystem·SkillBook·MobilePad·SkillWindow 진단 0 · PlayerAttack은 기존 info 5·warning 2(IsPCPlatform deprecated)만 — 새 것 없음

| 새 케이스 | 검토 항목 |
|---|---|
| roster `H0` 문자열 왕복·모르는 형식 버림·명시 0 보존 | B-R02 · B-R05 |
| roster `H1` 자동 = 고정 규칙 무작위 3000상태(전사·마법사·거인 몸·예약·자동 모드에 남은 희망 수) | B-T01 · B-R03 |
| roster `H2 direct sequence #1~30` 매번 미리보기 = 실제 Raise · 끝 편성 = 희망 · `SteadyRoster` = 실제 반복 | B-T03 · 계약 「계획=실제」 |
| roster `H3` 희망 1·랭크 3 → 방어 30·쌍칼 간격·저주 16 그대로 · 희망 0으로 낮춰도 서 있는 개체 불변·다음만 일반 | B-R01 · B-T02 |
| roster `H4` 장비로 정원 3→1: 희망 문자열 불변·잘림 표시·미리보기=실제 · 장비 복구 시 원래 계획 | B-R02 · B-T02 |
| roster `H5` 저장 왕복·옛 저장 = 자동·끔·기본값은 새 칸을 쓰지 않음·형식 정리 | B-R05 · B-T02 |
| roster `H6` 요청 검사: 주인만·모르는 종류/변이/±2 무시·랭크 상한·정원 합 상한·0 아래 없음·초기화 뒤 넘친 희망 정리·요청이 개체를 건드리지 않음 | B-R05 · B-R02 |
| roster `H7 giant direct #1~6` 거인 몸 보호·예약 4·미리보기 = 실제 | B-R04 |
| roster `H8` B-DRAFT-01 재현(직접 max3·방패 희망1·[A방패,B,C] · 대기 중 C 사망 → 혼 0·A/B 불변·이후 미리보기 일반) + 대조군(목록 불변 → 계획대로) + 희망 변경 중 거절 + canCommit false 무소비 | B-R03 · B-T03 · B-DRAFT-01 |
| roster `H9` 희망 0 = 명시 일반형·「0기」 경고 대신 직접 편성 안내 · `H10` 전사 직접이어도 마법사 자동 그대로 | B-R02 |
| skills 편성 칸 블록: 변이 노드 「방패 희망 1/3」·메인 「편성: 직접」·자동 머리 글·골편 토글은 모바일만·다른 트리 숨김 | B-R05 · UI |
| mobile_input `I04 홀드 반복 기본 끔` · `켬: 재사용 간격마다(간격≥재사용·첫 요청 0.35초 뒤)·뗄 때·중복 up 추가 시전 0` · `짧게 누르면 놓을 때 한 번` | B-T04 · B-R07 |
| mobile_input `반복 중 기본 공격 입구 막힘`(실제 SubmitBasicInput 본문) · 두 번째 손가락 소유권 못 뺏음 · `기본 공격 단추가 먼저면 골편 반복 없음` · 뗀 뒤 기본 공격 정상·저절로 반복 없음 | B-R06 · B-T04 |
| mobile_input `반복 멈춤 사유` menu·dead·map·edit·slot·toggle·aim·focus (각각 멈춘 뒤 요청 0·뗄 때 시전 0·기본 공격 소유 풀림) · `마나 부족이면 요청 안 보냄` · `반복 전 취소 위로 갔다 돌아와 놓으면 한 번` | B-T05 · B-R07 · B-R08 |

**B-T06(서버 자원 회계)**: 반복은 새 서버 경로를 만들지 않고 기존 `RequestCast → Cast`(PendingCasts·PendingMana·CastEpoch·성공 후 확정)만 부른다. 오프라인 검사는 가짜 서버로 「요청 수 = 확정 수 = 마나 차감」만 보았고 실제 `SkillBook.Cast` 대기 시전·맵/사망 무효화는 기존 코드 그대로라 이번에 다시 돌리지 않았다 — 메이커 B-M03에서 요청/확정 시각과 마나·재사용으로 대조.

## 5. 메이커 대기열 (Maker 단일 담당용 · 결과 JSON `maker_queue`와 같음)

- **B-M01 PC 편성**: 슬롯4 Lv40 저장(raise_skeleton9·skel_shield2·skel_twin1·raise_mage3·mage_hex1·mage_twin1)에서 K → 해골 전사 → WS/Form 「편성: 자동」 → 방패 해골 노드 → 「+」 → `[VRF] roster hope saved kind=skeleton why=shield+1` · 효과 칸 「직접 편성 n/max … 다음 소환: X」 → 혼에 해골 전사 → `[VRF] roster plan … form=X` + `[VRF] roster raised … planned=X match=true` · 서 있던 개체 HP/방어 그대로 · 스킬 장비 벗기/끼기 → 희망 문자열 그대로, 편성 줄 잘림 안내가 나왔다 사라짐 · 마법사 저주 「−」로 따로 저장 · `PlayerSave:Save(true)` 뒤 재입장 `[VRF] roster hope restored`
- **B-M02 거인**: 해골 5기 → 뼈 의식 5기 → 거인 유지 중 직접 편성에서 다음 소환 미리보기 = 실제(몸 보호·「거인에 4」) · 갈라짐 뒤 원래 기록 복귀(정원 한도 그대로). 46 새 규칙은 보지 않는다
- **B-M03 iPad 프리셋 골편 홀드**: 골편 공방 「켜기」 → `[VRF] shard hold setting on=true` · 골편 칸 2초 누르기 → `shard hold start` → `shard hold cast n=1..` → 떼기 `stop reason=release sent=N` · 서버 `cast committed bone_shard` 수·마나·재사용과 요청 시각 대조 · 누르는 동안 작은 기본 공격 단추(큰 단추에 스킬) 탭 → 기본 공격 0 · 누르는 중 메뉴 열기 → `reason=menu` · 「취소」 위로 끌기 → `reason=aim` · 설정 끔에서 누르기 → 놓을 때 한 번. 지원 입력으로 안 되면 `maker_execute_script`로 `_MobilePad:BeginGesture`·`ShardTick`·`EndGesture`를 부른 핸들러 증거로 남기고 물리 터치 증거로 세지 않는다

## 6. 못 한 것 · 한계

- 메이커 실행·실화면·실기기 터치·재접속은 하지 않았다(규칙). 위 대기열로 넘김
- PC는 홀드 반복 없음(계약) · 의식·희생·지면 반복 없음
- 텔레메트리(갈래 C) 연결은 하지 않았다 — hook 자리만 결과 JSON `hook_points_for_C`
- 46 거인 R1(SteadyRoster가 거인 몸을 세는 RB-OBS-03)은 거인 작업 몫이라 그대로 — 고칠 때도 `PlanNext` 한 곳만 바꾸면 미리보기·실제·장기 편성이 함께 바뀐다

## 7. 후속 B-IN-02 (코덱스 0110 최종 독립 검토 · 비Maker 최소 보완)

- 결함: 홀드 켬·골편 칸을 누른 뒤 0.35초 전에 칸이 뼈 감옥으로 바뀌면, 반복이 없어 ShardUsed=false라 놓을 때 **새 칸 스킬(감옥)이 한 번 나갔다**(코덱스 재현 요청 0→1 · 마나 100→88).
- 보완(`MobilePad.mlua`): 손가락이 닿을 때 칸 스킬을 `GestureSkill`로 잡고, 놓을 때 `GestureSkillChanged()`(345)가 참이면 시전하지 않는다(`EndGesture` 174 · 다음 Poll 전에 바로 놓아도 · 설정 켬/끔 모두) — `[VRF] mobile aim release skipped slot= changed`. 편집·기본 공격 제스처는 제외. 정상 짧은 탭 1회 · 반복 뒤 놓기 0회 · 취소 위에 갔다 돌아온 짧은 탭 1회는 그대로.
- B-IN-OBS-01(견고성만): 닿을 때 캐릭터를 `GesturePlayer`로 잡고 `ShardStopCheck`(326)에서 엔티티가 바뀌면 `owner`로 반복을 끝낸다. 입력 소유권 통과 판정은 바꾸지 않음.
- 회귀(mobile_input 37장면 177/177): `B-IN-02 반복 전(0.35초 전) 칸 교체` · `반복 뒤 칸 교체` · `다음 Poll 전에 바로 놓기 (켬·끔)` · `보존: 짧은 탭 1회 · 다른 칸 끌기 1회` · `B-IN-OBS-01 엔티티 교체`. 변이 2건 모두 검출(`mutation-b-in-02.log`) · npm test 12/12 · LSP 오류 0(기존 info/deprecated 경고만)
