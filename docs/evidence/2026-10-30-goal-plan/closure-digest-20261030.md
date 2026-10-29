# I01~I08 마감 조사 요약 (2026-10-30, HEAD 4ba51d5e, 읽기 전용)
근거: docs/design/47 · 공유 improvement-design.txt(=47 + I03 단계1 단락만 차이) · parallel-analysis/{combat,items,progression} report·handoff · scope-audit-0012 · art/map-issues.json
표기: 크기 소/중/대 · 메이커 = 관찰만 / 입력 흐름 · 「별도」 = 코덱스가 이번 마감 범위에서 뺄 후보

## I01 레어·부위 선택·부분 재련
- 단위 A 「중요 보상 부위 1회 선택」: CSV gen:3 토큰(q1 굶주린 굴 `skp:2,gen:3` · q3 유물 `gen:3,socket:1` · q7 자칼 `gen:3` 등) → `PlayerQuest.TurnIn` gen 분기(Quest/PlayerQuest.mlua:383-386) → `ItemData:GenerateQuestReward`(Item/ItemData.mlua:398, 지금 부위 인자 없음) + 부위 선택 저장 필드(ChoicePicks·ChoiceTiers PlayerQuest.mlua:37과 따로) + 선택 UI(SkillOffer 카드 참고). 크기 중~대 · 메이커 입력 흐름(만석·중복 클릭·재접속).
- 단위 B 「레어 한 줄 재련」: `ItemData:RerollMods`(:513, 지금 mods 전체 재생성) · `CanReroll`(:497) · `RerollCost`(:505, 40+ilvl×12, 레어 ×3) · 서버 `PlayerInventory:RequestReroll`(Item/PlayerInventory.mlua:860) · 대장장이 UI `InventoryWindow`(:271-284, :746). 줄 정체성: mods가 stat 합산 표이지만 앞·뒤 같은 stat이 없어 지금은 stat 키 = 한 줄. 「대상 줄 고정」을 기록하려면 아이템 문자열 10번째 칸 추가(9번째 = 잠금 "L", Parse/Serialize :82-104) → 창고·거래·저장 왕복 검사 필요. 크기 대 · 메이커 입력 흐름.
- 결정: ① 순서 A먼저 / B먼저 / 둘 다 → **추천 A먼저**: 아이템 문자열을 안 바꿔 이관 위험 0, 퀘스트 토큰만 되돌리면 원복. ② B 비용 = 현행 RerollCost 그대로 / 별도 가격 → **추천 현행 그대로**(설계 「측정 없이 새 가격 확정 안 함」). ③ B 범위 = 아이템당 한 줄 고정 / 매번 아무 줄 → **추천 한 줄 고정**(설계 권장, 완벽 장비 루프 방지). 모두 되돌릴 수 있음(B는 새 칸 기본값으로 옛 문자열 읽기 유지 시).
- 측정(도구 가능): 분포는 items/analyze.py로 이미 끝(216행·144000표본). 골드 흐름은 Telemetry에 골드·재련·장착 카운터가 없음(Progress/Telemetry.mlua grep 0건) → 카운터 추가 후 메이커 자동 진행으로 수치만.
- 측정(사용자만): 「유효 업그레이드」 체감·교체 이유·다음 전투 사용 — 실사용자 관찰.
- 별도 후보: B(부분 재련)는 설계상 「작은 실험 후 채택」 → 이번 마감은 A까지만으로 닫는 안.

## I02 룬워드 허용 등급
- 사실: 판정 `ItemData:GetRuneword`(:25-32) 등급 제한 없음 · `PunchSockets`(:534~) 일반 2~최대/마법 1~2/레어 이상 1 → 신규 제작 가능 레시피 일반35·마법4·그 외0. 플레이어 글귀엔 「일반 장비만」이 없음(RuneWindow.mlua:98 · GuideWindow.mlua:613-615 등급 언급 없음). 「일반 장비에 룬을 끼워」는 코드 주석 ItemData.mlua:338뿐.
- 단위(A안): 대장장이 소켓 안내(InventoryWindow:278-279)·룬워드 창 Hint(:98)·안내서(:615)에 「등급별 소켓 수 → 만들 수 있는 룬워드」 한 줄 · 주석 :338 정정 · docs/design 정합. 크기 소 · 메이커 관찰만(글자 잘림).
- 결정: A 현행 유지+안내 정합 / B 신규 일반 전용+레거시 기록 / C 기존 해제·너프 → **추천 A**: 이관 0·기존 자산 보존·설계 「즉시 권장안」, 글귀만이라 되돌림 쉬움. C는 scope-audit상 승인 아님.
- 측정: 없음(오프라인 175조건 검사 완료). 글귀는 게임 글귀 말투 규칙 적용 후 코덱스 승인.

## I03 소환 편성
- 단계1 완료·통합(UndeadSystem.PickForm/SlotPlan/TrimVictims · RosterPreview · SkillBook.FormHint). 남은 것 = 실제 입력/기기 → 사용자 체크리스트(F10 항목에 포함).
- **별도**: 단계2 직접 편성(군단 창 자동/직접, 전사·마법사별 저장) · 역할 통합/축소(B·C안) — 설계 47 §4·scope-audit 모두 「제안, 이번 최소안과 별도」. 크기 대 · 저장 이관 필요.
- 결정: 단계2를 이번 마감에서 뺄지 → **추천 뺀다**(설계가 별도로 분류, 저장 형식·편성 UI 신규).

## I04 모바일 기본 공격
- 구현·통합 완료(BasicAtk 칸6 · 홀드 · 끌기 「취소」 · 간격 10/8/8/11.6, docs/evidence/2026-10-29-decisions-2103 §5).
- 남은 것 = 실기기 물리 터치(16:9·19.5:9·4:3·좁은 화면, 오탭·엄지 거리·손가림·취소 쉬움·조이스틱 동시) → **사용자만**. 체크리스트 초안 별도 파일.
- **별도**: 선택 주력 반복 시전 확대(설계 「선택 옵션부터」, scope-audit 「별도 제안」).

## I05 빌드별 DPS
- 단위 A 「HP 확정 원장(개발용)」: `Monster:HandleHitEvent`(Monster/Monster.mlua:550, 흡수 :559 뒤 Hp 감소 :560) · `Monster:TakeDamage`(:483, 독·흡수 경로 Hp 감소 :494) 두 곳에서 before/after·흡수·과잉·owner/source·시각을 세션/대상/순번 키로 서버 메모리 합산 · 반사(RiteReflectTo :561)는 별도 source. Monster 밖 Hp 감소 경로가 더 있는지 전수 grep 필요(이번 조사 범위 밖). 크기 중 · 메이커 관찰만(로그 일치 검사).
- 단위 B 「고정 시나리오 실행」: 같은 맵·대상·빌드 3계열 × Lv 하나, 저주 on/off 짝, 군단 전멸 후 복구 구간. 시전은 maker_execute_script 반복 입력으로 근사. 크기 중 · 메이커 입력 흐름.
- 결정: 원장 켜는 방식 = 개발 플래그+로그 요약만 / Telemetry 저장 확장 → **추천 개발 플래그+`[VRF]` 요약 로그, 저장 0**(설계 「매 타격 DataStorage 쓰기 금지」, 끄면 원복).
- 측정(도구 가능): combat/analyze.py(한 타격·마나, 완료) + 원장 기반 실효 DPS·처치 시간·저주 기여(메이커 자동). 측정(사용자만): 편안/숙련 조작 차이·PC↔모바일 입력 피로·입력/분.

## I06 대표 4맵 동선
- 위치: crypt2 `data/handmade/specs/act1.cjs:281` · temple2 `act2.cjs:328` · lighthouse1 `act3.cjs:277` · demonroad `act4.cjs:138`.
- **함정(remix 연쇄)**: crypt2를 바꾸면 temple1(act2:321)·lighthouse2(act3:283)·abyssgate1(act4:322)이 같이 바뀐다(kit.cjs remix는 base 자리를 복사, o로 덮어쓰기 가능). temple2 = remix(crypt3), lighthouse1 = remix(crypt1) → 이 둘은 자기 spec에 places/paths를 덮어써야 원본·형제 맵이 안 바뀐다.
- 스폰 구역 제한(곁방 c/e에 적 역할 고정)은 현재 지원 확정 안 됨(progression report §3) → 작은 배치 기능 필요. 맵 변경 시 route_lengths 재계산·출현 수 재산정(맵 개편 규칙).
- 단위: crypt2 1맵 시안(방·길·스폰, 3난이도 .map) 크기 중 / 4맵 전부 크기 대 · 메이커 입력 흐름(통행·출구·전투).
- 결정: ① 범위 crypt2 1맵만 / 4맵 → **추천 crypt2 1맵만, 나머지 3맵 「별도」**(설계 「대표 맵 하나씩」). ② remix 처리 = 형제 3맵에 현 형상 고정 사본 / 같이 바꾸기 → **추천 고정 사본**(형제 맵 회귀 0, 되돌림 쉬움).
- 측정(도구): progression/route_audit.py(격자 최단칸·예산 26검사)·적 예산 전후 표. 측정(사용자만): 길 선택 이유·지루함·판단 변화.

## I07 재질 접합 (악마의 행군로·난파선 해안)
- 기록: 공유 art/map-issues.json ART-03 demonroad material_join(observed) · ART-04 wreckcoast material_join(observed). I-1·I-2 종료분은 다른 결함군(저항 표식·액트3 바닥 섞기)이며, 리포 handoff·요청서·art-I-rollout README에 ART-03/04 종료 근거 **못 찾음**. 후보 그림 `art/a4-ash-paving-transition-source.png`(코덱스 폴더, 미등록).
- 단위: ART-03 = demonroad 존 재질 경계(zones a 현무암/b 그을린 판석/c 현무암, act4.cjs:146-150) 내부 접점 1~2칸 완화 시범 · ART-04 = 기존 salt/tide/foam 자산 재배치(map-issues 권고). 각 크기 소~중 · 메이커 관찰만(전후 캡처).
- 결정: A 이번 마감에서 「관찰 기록 유지·미술 후속 별도」로 종료 / B spec 재질·기존 자산만으로 시범(그림 0) / C 전이 띠 새 그림(샘플 승인제) → **추천 B**: 새 그림 없이 되돌릴 수 있고 전후 캡처가 곧 종료 근거. 추가 5위치(ART-05~09 가설)는 **별도**.

## I08 액트 1 왕복·보상 배열
- 단위 A 「q4 현장 보고·q5 현장 수락 파일럿」: `PlayerQuest:NearGiver`(:317)에 q4 State2/q5 State0·같은 난이도 gallows·생존·제단 반경·expectedIndex 한정 대체 허용 → RequestAccept(:322)/RequestTurnIn(:342)/TurnIn(:352) 방어 그대로 · 제단 명시적 상호작용(World/AltarRitual.mlua) · q5 처형인 선처치 미소급 안내. CSV·Index·저장 형식 불변. 크기 중 · 메이커 입력 흐름(진행 중/보고 완료 저장 포함).
- 결정: 파일럿 채택 / 현행 유지 → **추천 채택**: 저장·보상 이관 없음, 대체 허용 조건만 지우면 원복. 문구는 글귀 승인.
- 측정(도구): route_audit로 왕복 수(제안 계약) · Telemetry에 「첫 실제 장착 뒤 전투 사용」 이벤트 없음(FirstStages :303-311에 장비 항목 없음).
- 측정(사용자만): 2h/4h·다음 날·3일 관찰, 이탈자 포함 → 실사용자 데이터 필요.
- **별도**: 보상 배열 실험·효과 측정(실사용자 관찰이 전제, CSV 재정렬은 ByDiff·Sealed·ChoicePicks 이관표 선행).

## 요약
① 결정 없이 바로 Opus: I05 단위 A(원장 코드, Monster.mlua) → I05 단위 B(메이커). I02 A안 글귀·I08 파일럿·I01 A·I07 B는 코덱스 추천 승인만 나면 바로. 코드 파일이 겹치지 않아(Monster / UI 창 / PlayerQuest / specs) 작성은 병렬 가능, 메이커 검증은 한 번에 하나(I05 B → I08 → I01 A → I07 → I06 순).
② 코덱스 결정: I01(A먼저·가격·한 줄 범위) · I02(A 확정) · I06(crypt2만·remix 고정 사본·스폰 구역 방식) · I07(ART-03/04 처리 B) · I08(파일럿 채택) · 별도 분류 확인(I03 단계2 · I04 반복 시전 · I06 나머지 3맵 · I07 추가 5위치 · I08 보상 배열 실험 · I01 B).
③ 사용자만: 실기기 물리 터치(F01·F02·F07~F11·I04, 선택 F06 스크롤) · 실사용자 체감/관찰(I01 업그레이드 체감 · I05 숙련/모바일 조작 차이 · I08 2h/4h/다음 날/3일).
