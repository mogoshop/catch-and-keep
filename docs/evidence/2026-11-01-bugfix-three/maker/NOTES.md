# 11-01 실플레이 문제 3건 — 메이커 확인 (VERIFY-PLAN.md 절차)

반영: HEAD d4dcd1d8(8a008879 3건 + 남문) + e2760f2c(FX 보강) · 02:32 멈춤 → 6초 → 바뀐 mlua 8개 touch → 6초 → refresh → 6초 → refresh · 빌드 02:32:24 Error 0 · LEA-1102 0 · 새 플레이 SelfTest 409/0.
캐릭터: 슬롯 4 「새내기」 Lv40(의뢰 20번째까지 진행) · 입장 직후 저장 끔(IsLoadSuccess=false)·무적. 저장소는 끝에 S48 본문으로 복원(아래 「슬롯 4」).
로그 발췌 `logs/*.txt`(원문 덤프에서 `[VRF]`·오류만) · 화면 `shots/`.

**표기**: 「준비」 = 상태를 만드는 서버 조작(검증 대상 아님) · 「실제 입력」 = `maker_keyboard_input`(방향키·Space·Ctrl·K·L) / `maker_mouse_input`(화면 클릭·카드·단추). 키보드 입력이 이번엔 정상이었다.

## 판정 요약

| 항목 | 결과 | 근거 |
|---|---|---|
| 1-a 이 맵이 목표 (굶주린 굴) | ✅ | 아래 표 — 많음 → (대기 묶음 남음) 비율 → 비율 → 표시 |
| 1-b 목표가 다른 맵 (지하실 1층) | ✅ | 처음부터 끝까지 `goalElsewhere=true` · 살아 있는 1 · 비율 0.07에서 `hide:goal-elsewhere` · 미니맵 글 「다음 길: 가라앉은 지하실 2층」 |
| 2 선택 보상 줄·칸 2 상세·구분 문장 | ✅ (9 모바일 미실행) | 카드 꼬리표 · 스킬 창 3칸 · 칸 2 상세·되돌림 · 정예 승격 구분 문장 · 스킬 추천 카드엔 꼬리표 없음 · 고를 차례 칸 「고르기」 → 카드 창 |
| 3 랭킹 「내 순위」 | ✅ (4 저장소 초기화 경로 미실행 · 6 심연 탭 미실행) | 성장·보스 탭 「내 순위」 줄 = 서버 로그 값 · 탭 연타 5초 안 추가 조회 0 |

## 1. 미니맵 남은 망자 안내

### 1-a 굶주린 굴 (hollow) — 의뢰 1 「굶주린 굴」 진행 중

준비: 의뢰 Index 1 · State 1 · 황무지 굴 포털 2칸 위로 이동(`PlayerTravel.Go`). 선택 보상 카드 창(지하실 수장 칸 1 · 고를 차례)이 자동으로 열려 이동을 막아 실제 클릭으로 「해골 하나 더」를 골라 닫음(02:44 · 이때 tier=0은 의뢰 번호를 1로 되돌린 준비 탓).
실제 입력: 아래 방향키로 포털 → 굴 입장(02:44:58). 처치: 02:45~02:46 준비 처치(먼 것부터 `Monster.TakeDamage` · 깨우기 `WakeAll`), **문턱을 넘는 마지막 처치 3번은 실제 공격**(Ctrl 기본 공격 · 화면 클릭 이동).

| 시각 | 서버 `clear remaining` | 클라 `minimap remain focus` | 방법 |
|---|---|---|---|
| 02:45:03 | 13 (pending 8) live 5 total 13 | alive=5 ratio=1.00 → hide:many | 입장 |
| 02:45:25 | 12 (pending 8) live 4 | alive=4 ratio=0.92 → hide:many | 준비 |
| 02:45:29 | 11 (pending 8) live 3 | **alive=3 ratio=0.85 → hide:ratio** (대기 묶음 남음 · 절차 4) | 준비 |
| 02:45:46~02:46:06 | WakeAll 8 → live 11 → 4 | hide:many (11→4) | 준비 |
| 02:46:57 | 3 (pending 0) live 3 | **alive=3 ratio=0.23 → hide:ratio** | **Ctrl 실제 처치** |
| 02:47:56 | 2 live 2 | **alive=2 ratio=0.15 → show** | **실제 처치** |
| 02:47:57 | 1 live 1 | **alive=1 ratio=0.08 → show** | **실제 처치** |

화면(02:48:05 `shots/1a-hollow-remain1-show-minimap.png`): 미니맵 글 「남은 망자 1 — 가까운 곳 표시」 · 노란 고리가 바로 곁 몬스터 자리(플레이어 표식과 겹침). 남은 4일 때(`shots/1a-hollow-remain4-hide-many.jpg`) 글 「이 지역에서 퀘스트 진행」 · 몬스터 점 없음. 서버 live = 클라 alive, ratio = remaining/total 모든 줄 일치.

### 1-b 가라앉은 지하실 1층 (cellar1) — 의뢰 2 「가라앉은 지하실의 수장」(목표 cellar2)

준비: 의뢰 Index 2 · State 1 · 늪 지하실 포털 2칸 위로 이동. 실제 입력: 아래 방향키로 포털 → 지하실 1층 입장(02:48:53). 준비 처치 10(WakeAll 뒤 먼 것부터) · 미로라 걸어서 닿지 못해 남은 4마리를 플레이어 곁으로 옮김(준비 · 서버 Kinematicbody.SetWorldPosition) · **마지막 처치는 실제 입력**(화면 클릭 대상 지정 + 누름).

- 입장 02:48:54 `alive=0 total=0 ... goalElsewhere=true -> hide:none` → 02:48:57 `alive=3 total=14 ratio=1.00 goalElsewhere=true -> hide:ratio` → `alive=8 ... hide:many`.
- 02:49:20~02:49:47 준비 처치 14→4: 모두 `goalElsewhere=true -> hide:many`.
- 02:52:40 `alive=3 total=14 ratio=0.21 goalElsewhere=true -> hide:ratio` (실제 공격 처치).
- **02:53:02 `alive=1 total=14 ratio=0.07 goalElsewhere=true -> hide:goal-elsewhere`** (실제 공격 처치 · 서버 `clear remaining=1 live=1 total=14`). alive=2 줄은 로그를 비우는 사이 놓쳤다(같은 조건 · 1에서 확인).
- 화면(02:53:09 `shots/1b-cellar1-remain1-goal-elsewhere-minimap.png`): 미니맵 글 「다음 길: 가라앉은 지하실 2층」 · 몬스터로 점이 옮겨 가지 않음. 남은 4일 때도 같은 글(`shots` 02:51 촬영본은 미보관 · 로그 근거).

## 2. 정예 승격 혼동 (스킬 창 「선택 보상」 줄)

준비: 의뢰 Index 5 · State 2(완료 보고 대기) · 마을로 이동. **실제 입력**: 방향키로 오렌에게 걸어가 Space(대화) → Space(다음) → Space(보상 받기, 02:55:02).

1. 보고 직후 선택 보상 카드 창이 스스로 열림 `[VRF] choice reward open slot=2` · `render slot=2 tier=1` — 세 카드 아이콘 오른쪽 아래 「선택 보상」 꼬리표(금빛 판) (`shots/2-choice-card-slot2-headsman-tags.jpg` · 앞서 칸 1 카드 창도 같은 꼬리표 `2-choice-card-tags-slot1.jpg`).
2. 「정예로 서는 그림자」 이것으로 → 고르기(마우스) `choice reward choose slot=2 command` · 서버 `[VRF] choice pick slot=2 axis=command tier=1` ✅.
3. 스킬 추천 띠 클릭 → 스킬 추천 카드 3장: 꼬리표 없음 ✅ (`shots/2-skill-recommend-cards-no-tag.jpg`).
4. K → 머리 줄 가운데 「선택 보상」 + 3칸: 칸 1 해골 하나 더(꼬리표·노말) · 칸 2 정예로 서는 그림자(꼬리표·노말) · 칸 3 잠금 메마른 우물의 혼 · 의뢰 전 — `skill choice row slot=1 axis=command tier=1` · `slot=2 axis=command tier=1` · `slot=3 axis=locked tier=0` ✅. 트리색 범례는 「해금 시간선」 제목 오른쪽, 「다음 해금 …」과 안 겹침 · 머리 줄 칸이 남은 포인트 글·초기화 단추와 안 겹침 ✅ (`shots/2-skillwin-choice-row.jpg` · `2-skillwin-header-crop.png`).
5. 칸 2 클릭 → 아래 공방 = 아이콘 · 「정예로 서는 그림자」 · 「선택 보상 · 목 없는 처형인 · 노말」 · 설명 2줄 · 「지금 단계: 노말 / 다음 단계: 악몽 ×1.35 · 지옥 ×1.45 / 선택 보상 — 스킬과 별개로 늘 적용됩니다」 · 랭크 점·노드·배우기/스킬 칸 단추 없음 · 칸 2 금테 — `skill choice pick slot=2 shown=2` · `skill choice detail slot=2 axis=command tier=1` ✅ (`shots/2-skillwin-slot2-detail.jpg`).
6. 칸 2 다시 클릭 → 원래 공방(해골 전사 · 단추·노드) `pick slot=2 shown=0` ✅ (`2-skillwin-slot2-click-again-back.jpg`).
7. 시간선 Lv33 정예 승격 → 설명 끝 회색 줄 「선택 보상 「정예로 서는 그림자」와는 다른 스킬입니다」 ✅ · 영혼 격류(Lv36)엔 그 줄 없음 ✅ (`2-skillwin-elite-promote-distinct-line.jpg` · `2-skillwin-other-skill-no-line.jpg`).
8. 준비: 칸 1을 고를 차례로(ChoicePicks ";2:command;") → K → 칸 1 「고르기 · 가라앉은 지하실의 수장」(`skill choice row slot=1 axis=pending tier=1`) → 클릭 → 스킬 창이 닫히고 카드 창이 칸 1로 열림 `[VRF] skill choice open reward slot=1` · `choice reward render slot=1 tier=1` ✅ (`2-skillwin-slot1-pending-gorgi.jpg` · `2-skillwin-slot1-click-opens-card.jpg`). 다시 「해골 하나 더」로 골라 닫음(`choice pick slot=1 axis=command tier=1`).
9. 모바일(iPad 미리보기): **미실행**(플랫폼 전환에 멈춤·재시작이 필요해 이번 회차에서 뺌).

관찰(판정 아님): 머리 줄 칸 이름(「해골 하나 더」 등)이 칸 장식 테와 조금 겹쳐 보인다(`2-skillwin-header-crop.png`).

## 3. 랭킹 「내 순위」

입장 뒤 0.5초 이상 지난 시점. **실제 입력** L(02:58:37).

1. 성장 순위 탭: 목록(1. 인꾸 Lv60 · 지옥 액트 1) 아래 구분선 + 금빛 「내 순위 1위 · Lv60 · 지옥 액트 1」 · 서버 `[VRF] rank mine board=rank_progress_0 rank=1 value=6021` (6021 = Lv60×100 + 지옥 2×10 + 액트 1) ✅ (`shots/3-rank-progress-mine.jpg`).
   - 관찰: 메이커 계정 한 명의 기록이라 지금 고른 캐릭터(새내기 Lv40 노말)가 아니라 같은 계정의 이전 최고 기록(인꾸 Lv60 지옥)이 「내 순위」로 나온다 — 순위표가 계정 단위라 그런 것으로 보임(판정은 코덱스).
2. 보스 처치 시간 탭(마우스): 「재의 왕 고르바스 최단 처치 (노말)」 1. 인꾸 15초 · 「내 순위 1위 · 15초」 · 서버 `rank mine board=rank_boss_ash_king_0 rank=1 value=15` ✅ (`shots/3-rank-boss-mine.png`).
   - 관찰: 탭 단추 「보스 처치 시간」 글이 두 줄로 꺾여 「간」이 아래로 내려간다(이번 수정 범위 밖).
3. 기록 없음 경로(저장소 초기화): **미실행 — 사용자 승인 필요**(`maker_reset_data_storage`).
4. 연타: 02:59:37~42 탭 7번(0.45초 간격) — 첫 두 번(각 판 5초 넘게 지난 뒤)만 `rank mine` 한 줄씩, 나머지 5번은 `rank show`만 있고 `rank mine` 0 ✅.
5. 심연 탭(depthEnabled 1): **미실행**(설정 꺼짐).

## 슬롯 4

- 이번 회차 시작(02:34, 입장 전) readback이 S48 기준과 0/5 — 원문을 `slot4-found-at-start.json`(바이트·djb2·값 5키, 시작 해시와 5/5 일치)으로 보존. 내용은 S48 본문과 키 순서만 다르고(Account·Inv_4·Shadow_4·Stash 길이 같음) Char_4 1126→1035.
- 입장(02:35:08 불러오기 → 02:35:32 저장 끔) 사이에 게임이 한 번 더 저장 — `slot4-after-entry.json`(시작 상태와 의미상 같음 · Char_4는 업적 배열 순서만 다름).
- 끝에 S48 본문으로 복원 + 재조회 5/5 (결과는 이 파일 아래에 덧붙임).
