# 용어 통일 · 시스템 말투 정리 — 10-29 오후 사용자 결정 반영 (전 → 후)

> 원문 결정: `docs/handoff/2026-10-29-integration-todo.md` · 말투 정본: `docs/requests/copy-approval-20261029.md` 맨 위 「10-29 사용자 확정 결과」 · 「10-29 오후 추가 결정」
> 표의 `UI/…`·`Item/…`처럼 짧은 경로는 `RootDesk/MyDesk/` 아래다. 줄 번호는 바꾼 뒤 파일 기준(글만 바꿔 줄 수는 그대로). 표의 `{…}`는 게임이 채우는 자리, ` / `는 줄바꿈, ` ／ `는 같은 줄의 다른 글(갈래)이다.

## 집계

- **바꾼 줄 288줄 · 파일 64개** (+ 생성 파일 `RootDesk/MyDesk/Data/GameData.mlua`·`JournalData.mlua` · 다시 빌드한 UI 6개 `ui/CharSelectHUD` `ui/EquipmentHUD` `ui/GameHUD` `ui/JournalHUD` `ui/NavigationHUD` `ui/QuestJournalHUD`)
- ① 용어: 노말 **7** · 퀘스트 **41** (말투와 겹친 3줄 포함) · 인벤토리 **8** · 파티플레이 **3** (결투 안내 「플레이어 창(P)」 → 「파티플레이 창(P)」 1줄 포함 · 2줄은 말투와 겹침)
- ② 「-다」 → 「-습니다 / -해주세요 / 명사」: **228줄** (용어와 겹친 5줄 포함 — 퀘스트 3 · 파티플레이 2) + 같은 규칙 「잠시 뒤 다시 시도하세요 → 다시 시도해주세요」 **5줄** (이미 「-습니다」였던 줄)
- ③ 5번 글귀: **1줄**
- ④ 그대로 둔 줄: 판단이 애매해서 둔 줄 **37** (코드 10 · `data/quests.csv` desc 24 · `data/story.csv` lock_act 3) + 규칙상 그대로(연출·대사·스킬 설명·개발 도구) — 아래 표

판단 기준 — **바꿈**: 플레이어에게 일어난 결과·할 수 있는 것/없는 것·할 일을 알려 주는 글(알림 Notify·Warn·Banner·NotifyMap·Tell·안내 줄·창 안 빈 상태·안내 칸·상자 이름표·물건 사용법·상태 칸 설명). **둠**: 사건을 그리는 연출 줄 · 창 제목 한 마디 · 스킬 설명(노드·선택 보상 효과 포함) · NPC 대사 · 이야기·몬스터·지역 설명(세계 안 글) · 개발 검사 문구. 시스템 글의 「-하세요」 지시(예: 「다른 채널을 고르세요」)는 101줄 71번처럼 그대로 두었다.

## ① 용어 4종

### 「보통」(난이도 이름) → 노말

| 파일:줄 | 전 | 후 |
|---|---|---|
| `data/difficulty.csv:2` | 난이도 표시 이름 (normal 행 name 열) 보통 | 노말 (내부 키 normal 그대로) |
| `tools/build/ui.cjs:653` | 웨이포인트 창 난이도 단추 「보통」 (빌더 기본 글 · 실행 중에는 difficulty.csv 이름) | 「노말」 |
| `UI/Windows/ShopWindow.mlua:220` | 보통 · 하급 물약 | 노말 · 하급 물약 |
| `UI/Windows/JournalWindow.mlua:198` | 일지 업적 탭 난이도 이름 「보통 · 악몽 · 지옥」 | 「노말 · 악몽 · 지옥」 |
| `UI/Windows/JournalWindow.mlua:199` | (위 표의 기본값) 보통 | 노말 |
| `UI/Windows/GuideWindow.mlua:639` | 보통 → 악몽 → 지옥 (게임 안내 「난이도 — 악몽 · 지옥」) | 노말 → 악몽 → 지옥 |
| `Progress/NightmarePreview.mlua:187` | · 보통에서는 나오지 않는 | · 노말에서는 나오지 않는 |

난이도 내부 키(`normal`·`_nm`·`_hell`)는 그대로. 웨이포인트 난이도 단추·잠김 말풍선, 악몽 미리보기 카드 64(「{보통}에서 …」), 캐릭터 선택 칸, 능력치 창 머리줄, 방 목록 「[노말]」, 랭킹, 살펴보기, 마을 게시판은 모두 `GameConst:DifficultyName`(= `difficulty.csv` 이름)을 끼우는 자리라 데이터 한 칸으로 함께 바뀐다(뒤 조사는 「에서·부터·완료」뿐이라 받침 「ㄹ」로 어색해지는 곳 없음). 「(보통에서 나오는 것)」은 화면 글이 없고 `Progress/NightmarePreview.mlua:101` 주석에만 있다(못 찾은 도감 줄은 「???」·「악몽부터」·「지옥부터」).

### 「의뢰」 → 퀘스트

| 파일:줄 | 전 | 후 |
|---|---|---|
| `data/achievements.csv:14` | 무덤 왕국 의뢰 모두 완료 | 무덤 왕국 퀘스트 모두 완료 |
| `data/achievements.csv:16` | 일일 의뢰 10개 완료 | 일일 퀘스트 10개 완료 |
| `data/dailies.csv:9` | 의뢰 1개 완료 | 퀘스트 1개 완료 |
| `UI/Windows/JournalWindow.mlua:119` | 일일 의뢰 · | 일일 퀘스트 · |
| `UI/Windows/NpcWindow.mlua:508` | 의뢰 「 | 퀘스트 「 |
| `UI/Windows/CharWindow.mlua:116` | 초기화 · {N} 골드 (마을 의뢰인 곁) | 초기화 · {N} 골드 (마을 퀘스트 NPC 곁) |
| `UI/Windows/QuestWindow.mlua:76` | 의뢰 기록을 불러오는 중 | 퀘스트 기록을 불러오는 중 |
| `UI/Windows/QuestWindow.mlua:166` | 의뢰 없음 | 퀘스트 없음 |
| `UI/Windows/QuestWindow.mlua:172` | 앞선 의뢰 뒤에 수락 | 앞선 퀘스트 뒤에 수락 |
| `UI/Windows/QuestWindow.mlua:180` | 새로운 의뢰 | 새로운 퀘스트 |
| `UI/Windows/QuestWindow.mlua:184` | 의뢰인 · {마을}의 {이름} | 수락 위치 · {마을}의 {이름} (옆 칸 「보고 위치」·「목적지」와 같은 꼴) |
| `UI/Windows/QuestWindow.mlua:186` | 가까이 다가가 대화 버튼을 누르면 의뢰를 확인할 수 있습니다. | 가까이 다가가 대화 버튼을 누르면 퀘스트를 확인할 수 있습니다. |
| `UI/Windows/InventoryWindow.mlua:759` | (의뢰 보상 소켓권이 있으면 확실히 뚫립니다) | (퀘스트 보상 소켓권이 있으면 확실히 뚫립니다) |
| `UI/Windows/GuideWindow.mlua:555` | 의뢰 추적 | 퀘스트 추적 |
| `UI/Windows/GuideWindow.mlua:626` | 의뢰 따라가기 | 퀘스트 따라가기 |
| `UI/Windows/GuideWindow.mlua:627` | 의뢰{…}를 따라 나아갑니다. | 퀘스트{…}를 따라 나아갑니다. |
| `UI/Windows/GuideWindow.mlua:629` | · NPC 머리 위 표시 — 새 의뢰 / 완료 보고 | · NPC 머리 위 표시 — 새 퀘스트 / 완료 보고 |
| `UI/Windows/WaypointWindow.mlua:169` | {…} · 의뢰 | {…} · 퀘스트 |
| `UI/Hud/HudMain.mlua:902` | 완료 ／ 모든 의뢰 완료 | 완료 ／ 모든 퀘스트 완료 |
| `UI/Hud/HudMain.mlua:904` | 새 의뢰 | 새 퀘스트 |
| `UI/Hud/HudMain.mlua:906` | 의뢰 {…} | 퀘스트 {…} |
| `UI/Hud/HudMain.mlua:1011` | 에게 의뢰를 받으세요 | 에게 퀘스트를 받으세요 |
| `UI/Hud/HudMain.mlua:1015` | 사제 오렌(미니맵 의뢰 아이콘)에게 다가가 첫 의뢰를 받으세요 ／ 잿불 야영지의 사제 오렌에게 첫 의뢰를 받으세요 | 사제 오렌(미니맵 퀘스트 아이콘)에게 다가가 첫 퀘스트를 받으세요 ／ 잿불 야영지의 사제 오렌에게 첫 퀘스트를 받으세요 |
| `UI/Hud/HudMain.mlua:1036` | 사제 오렌에게 다음 의뢰를 받으세요 — 썩은 갈대 늪의 가라앉은 지하실로 ／ 잿불 야영지의 사제 오렌에게 다음 의뢰를 받으세요 | 사제 오렌에게 다음 퀘스트를 받으세요 — 썩은 갈대 늪의 가라앉은 지하실로 ／ 잿불 야영지의 사제 오렌에게 다음 퀘스트를 받으세요 |
| `UI/Hud/HudMain.mlua:1052` | — 첫 의뢰가 훨씬 쉬워집니다 | — 첫 퀘스트가 훨씬 쉬워집니다 |
| `UI/Hud/HudMap.mlua:895` | 이 지역에서 의뢰 진행 | 이 지역에서 퀘스트 진행 |
| `UI/Hud/UXFeedback.mlua:136` | 일일 의뢰 완료 · | 일일 퀘스트 완료 · |
| `Progress/PlayerJournal.mlua:95` | 일일 의뢰 완료 · | 일일 퀘스트 완료 · |
| `Progress/NightmarePreview.mlua:128` | %s에서 액트 %d 의뢰를 마치고 %s를 쓰러뜨리면 열립니다 | %s에서 액트 %d 퀘스트를 마치고 %s를 쓰러뜨리면 열립니다 |
| `Endgame/AbyssSystem.mlua:141` | 액트의 마지막 의뢰를 마치면 1개 · 이후 액트 최종 보스를 잡을 때마다 | 액트의 마지막 퀘스트를 마치면 1개 · 이후 액트 최종 보스를 잡을 때마다 |
| `Item/ItemData.mlua:194` | / 얻는 법: 액트의 마지막 의뢰를 마치면 1개 | / 얻는 법: 액트의 마지막 퀘스트를 마치면 1개 |
| `Quest/PlayerQuest.mlua:368` | 칸이 필요합니다. 의뢰와 보상은 보관됩니다 | 칸이 필요합니다. 퀘스트와 보상은 보관됩니다 |
| `Quest/PlayerQuest.mlua:425` | 의뢰 보상 · | 퀘스트 보상 · |
| `tools/build/journal.cjs:30` | 일일 의뢰 | 일일 퀘스트 |
| `tools/build/journal.cjs:68` | J 일지 · 일일 의뢰는 한국 시간 자정에 바뀝니다 | J 일지 · 일일 퀘스트는 한국 시간 자정에 바뀝니다 |
| `tools/build/quest-journal.cjs:29` | 의뢰 일지 | 퀘스트 일지 |
| `tools/build/navigation.cjs:21` | 범례 복원용 「● 의뢰」 | 「● 퀘스트」 |
| `tools/build/navigation.cjs:83` | 미니맵 범례 「출구 · 의뢰 · 웨이포인트 · NPC」 칸 x/폭 18/64 · 82/64 · 146/118 · 266/64 | 「출구 · 퀘스트 · 웨이포인트 · NPC」 칸 x/폭 18/60 · 78/79 · 157/117 · 274/58 (「퀘스트」 3자가 글 칸 61px에 들게) |
| `Endgame/DepthGate.mlua:66` | 아직 닫힌 심연이다 — {…}의 마지막 의뢰를 마쳐야 열린다 | 아직 닫힌 심연입니다 — {…}의 마지막 퀘스트를 마치면 열립니다 |
| `World/AltarRitual.mlua:162` | 제단이 잠잠해졌다 — 이제 피의 신전이다 (의뢰를 마친 사람이 다가가면 힘이 깃든다) · {…}은(는) {…} 뒤 다시 깨어난다 | 제단이 잠잠해졌습니다 — 이제 피의 신전입니다 (퀘스트를 마친 플레이어가 다가가면 힘이 깃듭니다) · {…}은(는) {…} 뒤 다시 깨어납니다 |
| `World/CoopRules.mlua:113` | 의뢰가 남은 사람이 왔다 — 쓰러진 적이 {…}초 안에 다시 나타난다 | 퀘스트가 남은 플레이어가 들어왔습니다 — 쓰러진 적이 {…}초 안에 다시 나타납니다 |

「일일 퀘스트 완료 · 」 접두어는 `UI/Hud/UXFeedback.mlua:136`의 Starts 비교와 `Progress/PlayerJournal.mlua:95` 알림을 같이 바꿨다. 조사는 「의뢰/퀘스트」 모두 받침이 없어 그대로(를·가·는·와). 「의뢰인」은 퀘스트 창 칸에서 「수락 위치」, 능력치 창 초기화 단추에서 「퀘스트 NPC」로 문맥에 맞췄다.

### 「소지품」 → 인벤토리

| 파일:줄 | 전 | 후 |
|---|---|---|
| `tools/build/ui.cjs:229` | 소지품 | 인벤토리 |
| `tools/build/ui.cjs:246` | 소지품 | 인벤토리 |
| `tools/build/ui.cjs:290` | 단축키  I 소지품 · U 능력치 | 단축키  I 인벤토리 · U 능력치 |
| `tools/build/equipment.cjs:14` | 소지품  ·  망자의 장비 | 인벤토리  ·  망자의 장비 |
| `UI/Windows/InventoryWindow.mlua:202` | 소지품  ·  망자의 장비 | 인벤토리  ·  망자의 장비 |
| `UI/Windows/GuideWindow.mlua:546` | 소지품 · 능력치 · 스킬 · 그림자 · 퀘스트 · 설정 | 인벤토리 · 능력치 · 스킬 · 그림자 · 퀘스트 · 설정 |
| `UI/Windows/GuideWindow.mlua:551` | 소지품 · {…} | 인벤토리 · {…} |
| `UI/Hud/HudMain.mlua:1030` | 메뉴 → 소지품에서 보상 등불을 장착하세요 | 메뉴 → 인벤토리에서 보상 등불을 장착하세요 |

**메뉴 칸 폭 판단** — 아래 메뉴 줄 `Bottom/Menu/BtnInv/Label`은 84×26 · 글자 20 굵게 · bestfit 15~20(`tools/build/ui.cjs:239`). 「인벤토리」 4자 ≈ 80px로 20 그대로 칸에 든다(3자 메뉴와 같은 크기 · 「파티플레이」 5자·「그림자 추출」 6자는 원래부터 bestfit으로 줄어든다). 메뉴 창 `MenuWin/Inv/Label` 200×34 · 26 → 약 104px로 여유. 메뉴 창 단축키 줄(740×56 · 17)은 「인벤토리」로 한 글자 늘어 약 700px. 인벤토리 창 제목 칸은 1140px. **글자 크기·칸 폭은 바꾸지 않았다.** 조사: 「소지품에서 → 인벤토리에서」만 있어 받침 차이로 바뀐 조사는 없다.

### 「파티 플레이」 → 파티플레이

| 파일:줄 | 전 | 후 |
|---|---|---|
| `tools/build/roompicker.cjs:71` | 파티 플레이 | 파티플레이 |
| `UI/Windows/RoomWindow.mlua:139` | 파티 플레이 | 파티플레이 |
| `Social/PlayerDuel.mlua:77` | …골드 {N}%를 떨군다 · 포기는 플레이어 창(P) | …골드 {N}%를 떨어뜨립니다 · 포기는 파티플레이 창(P) (P 창 이름은 101줄 69번에서 파티플레이로 확정) |

「솔로 플레이」 카드는 지시 대상이 아니라 그대로 두었다.

## ② 「-다」 시스템 알림 → 새 말투

10-29 오전 집계 63줄(17개 파일 `_Util:Notify/Warn/Banner`) + (가) 갈래가 Warn으로 옮긴 「안 된 이유」 33줄 + 통합으로 들어온 줄 + 같은 갈래의 안내 글(스킬 실패 `Fail` · 거래 취소 `Cancel` · 결투 `End` · 심연 안내 카드 · 상자 이름표 · 물건 설명의 사용법 · 상태 칸 설명 · 창 안 빈 상태 · 빌더 안내 글)을 모두 훑어 바꿨다. 다른 코드가 비교하는 문자열은 `UI/Hud/UXFeedback.mlua:134`(「 난이도가 열렸습니다!」 꼬리)를 같이 맞췄고, SelfTest·`tools/check_*`에는 이 글을 기대하는 곳이 없었다.

| 파일:줄 | 전 | 후 |
|---|---|---|
| `Combat/PlayerVitals.mlua:197` | 결투 중 다른 원인으로 쓰러져 결투가 중단됐다 | 결투 중 다른 원인으로 쓰러져 결투가 중단되었습니다 |
| `Combat/PlayerVitals.mlua:304` | 층에서 쓰러졌다 — 도전이 끝났다 (사망 벌칙 없음, 주운 것은 남는다) | 층에서 쓰러졌습니다 — 도전이 끝났습니다 (사망 벌칙 없음, 주운 것은 남습니다) |
| `Combat/PlayerVitals.mlua:305` | 쓰러지면 그 도전이 끝난다 · 사망 벌칙 없음 | 쓰러지면 그 도전이 끝납니다 · 사망 벌칙 없음 |
| `Combat/PlayerVitals.mlua:311` | 결투에서 패배했다... 골드 {…}을(를) 떨어뜨렸다. 장비는 시체에 남았다 | 결투에서 패배했습니다. 골드 {…}을(를) 떨어뜨렸습니다. 장비는 시체에 남았습니다 |
| `Combat/PlayerVitals.mlua:314` | 사망했다... 골드 {…} 손실. 장비는 시체에 남았다 | 사망했습니다. 골드 {…} 손실. 장비는 시체에 남았습니다 |
| `Endgame/AbyssSystem.mlua:55` | 해금 — 첫 심연 열쇠를 얻었다 (마을의 붉은 포탈) | 해금 — 첫 심연 열쇠를 얻었습니다 (마을의 붉은 포탈) |
| `Endgame/AbyssSystem.mlua:98` | 에게서 심연 열쇠를 얻었다 | 에게서 심연 열쇠를 얻었습니다 |
| `Endgame/AbyssSystem.mlua:138` | 은 액트의 끝에서 열리는 심연이다. 층을 내려갈수록 적이 강해지고 보상이 좋아진다. | 은 액트의 끝에서 열리는 심연입니다. 층을 내려갈수록 적이 강해지고 보상이 좋아집니다. |
| `Endgame/AbyssSystem.mlua:140` | 1개를 쓰고 들어간다. 근처 파티원도 함께 | 1개를 쓰고 들어갑니다. 근처 파티원도 함께 |
| `Endgame/AbyssSystem.mlua:143` | 쓰러지면 그 도전이 끝나고 마을로 돌아온다 (사망 벌칙 없음, 주운 것은 남는다) | 쓰러지면 그 도전이 끝나고 마을로 돌아옵니다 (사망 벌칙 없음, 주운 것은 남습니다) |
| `Endgame/AbyssSystem.mlua:144` | 「철수」를 고른다. 철수하면 큰 보상 상자를 받고 도전을 마친다 — 더 내려가면 상자가 커지지만, 다음 보스 층 전에 쓰러지면 못 받는다 | 「철수」를 고릅니다. 철수하면 큰 보상 상자를 받고 도전을 마칩니다 — 더 내려가면 상자가 커지지만, 다음 보스 층 전에 쓰러지면 받지 못합니다 |
| `Endgame/DepthDirector.mlua:135` | 몬스터 이동 속도 +35% — 거리를 벌리기 어렵다 | 몬스터 이동 속도 +35% — 거리를 벌리기 어렵습니다 |
| `Endgame/DepthDirector.mlua:136` | 정예 무리가 훨씬 자주 나온다 | 정예 무리가 훨씬 자주 나옵니다 |
| `Endgame/DepthDirector.mlua:137` | 발밑에 독 장판이 생긴다 — 초록 원이 보이면 벗어나라 | 발밑에 독 장판이 생깁니다 — 초록 원이 보이면 벗어나세요 |
| `Endgame/DepthDirector.mlua:138` | 내 주변 빛이 45% 줄어든다 — 횃불 근처가 안전하다 | 내 주변 빛이 45% 줄어듭니다 — 횃불 근처가 안전합니다 |
| `Endgame/DepthDirector.mlua:185` | 층 — 모든 적을 쓰러뜨려라 | 층 — 모든 적을 쓰러뜨리세요 |
| `Endgame/DepthDirector.mlua:458` | 층에서 도전을 마친다. 철수 보상 상자를 열고 왼쪽 문으로 귀환 | 층에서 도전을 마칩니다. 철수 보상 상자를 열고 왼쪽 문으로 귀환 |
| `Endgame/DepthDirector.mlua:576` | 적을 모두 쓰러뜨리면 보상 상자와 문이 열린다 | 적을 모두 쓰러뜨리면 보상 상자와 문이 열립니다 |
| `Endgame/DepthDirector.mlua:580` | 이어서 더 내려가거나 철수(철수 보상 상자)를 고른다 | 이어서 더 내려가거나 철수(철수 보상 상자)를 고릅니다 |
| `Endgame/DepthGate.mlua:78` | 심연 열쇠가 필요하다 (0/ | 심연 열쇠가 필요합니다 (0/ |
| `Endgame/DepthGate.mlua:78` | % 확률로 떨군다 | % 확률로 떨어뜨립니다 |
| `Endgame/DepthGate.mlua:87` | — 아직 위험하다! | — 아직 위험합니다! |
| `Endgame/DepthGate.mlua:88` | · 심연 열쇠 1개를 쓴다 · 이번 주: | · 심연 열쇠 1개 사용 · 이번 주: |
| `Endgame/DepthGate.mlua:90` | 철수 — 철수 보상 상자를 받고 이번 도전을 마친다 | 철수 — 철수 보상 상자를 받고 이번 도전을 마칩니다 |
| `Endgame/DepthGate.mlua:91` | 철수한다 ／ 이동한다 | 철수합니다 ／ 이동합니다 |
| `Item/ItemData.mlua:188` | / 그림자를 분해하면 얻고, 그림자 강화에 쓴다. / 귀속 — 거래·판매할 수 없고 버리면 파괴된다 | / 그림자를 분해하면 얻고, 그림자 강화에 씁니다. / 귀속 — 거래·판매할 수 없고 버리면 파괴됩니다 |
| `Item/ItemData.mlua:193` | 을 밟으면 하나를 쓰고 심도에 들어간다 (근처 파티원도 함께, 열쇠는 한 개만). | 을 밟으면 하나를 쓰고 심도에 들어갑니다 (근처 파티원도 함께, 열쇠는 한 개만). |
| `Item/ItemData.mlua:195` | 개까지만 가질 수 있다 | 개까지만 가질 수 있습니다 |
| `Item/ItemData.mlua:196` | / 귀속 — 거래·판매할 수 없고 버리면 파괴된다 | / 귀속 — 거래·판매할 수 없고 버리면 파괴됩니다 |
| `Item/ItemData.mlua:201` | / 마을로 가는 포털을 열고, 포털로 원래 자리에 돌아온다 / 「사용」하거나 벨트 칸에 넣어 숫자키(모바일은 물약 칸)로 쓴다 | / 마을로 가는 포털을 열고, 포털로 원래 자리에 돌아옵니다 / 「사용」하거나 벨트 칸에 넣어 숫자키(모바일은 물약 칸)로 씁니다 |
| `Item/ItemData.mlua:208` | 회복 / 벨트 칸에 넣으면 숫자키(모바일은 물약 칸)로 마신다 — 가방에서 낮은 등급부터 쓴다 (칸에 그 등급이 보인다) | 회복 / 벨트 칸에 넣으면 숫자키(모바일은 물약 칸)로 마십니다 — 가방에서 낮은 등급부터 씁니다 (칸에 그 등급이 보입니다) |
| `Item/PlayerBelt.mlua:156` | 이 없다 (가방) | 이 없습니다 (가방) |
| `Item/PlayerInventory.mlua:181` | 개까지 들 수 있다{…} | 개까지 들 수 있습니다{…} |
| `Item/PlayerInventory.mlua:196` | 개까지만 가질 수 있다 | 개까지만 가질 수 있습니다 |
| `Item/PlayerInventory.mlua:479, 805, 816` | 가방이 가득 찼다 | 가방이 가득 찼습니다 |
| `Item/PlayerInventory.mlua:496` | 귀속 물건은 팔 수 없다 | 귀속 물건은 팔 수 없습니다 |
| `Item/PlayerInventory.mlua:507, 703` | 판매는 마을 상인 곁에서만 할 수 있다 | 판매는 마을 상인 곁에서만 할 수 있습니다 |
| `Item/PlayerInventory.mlua:532` | 파괴했다: | 파괴: |
| `Item/PlayerInventory.mlua:537` | 버렸다: {…} (10초 뒤 누구나 주울 수 있다) | 버림: {…} (10초 뒤 누구나 주울 수 있습니다) |
| `Item/PlayerInventory.mlua:557` | 빈 소켓이 없다 | 빈 소켓이 없습니다 |
| `Item/PlayerInventory.mlua:742` | 버렸다 {…}개 (10초 뒤 누구나 주울 수 있다) | 버림 {…}개 (10초 뒤 누구나 주울 수 있습니다) |
| `Item/PlayerInventory.mlua:782` | 탭이 가득 찼다 — 다른 탭을 고르세요 | 탭이 가득 찼습니다 — 다른 탭을 고르세요 |
| `Item/PlayerInventory.mlua:853` | 물건이 없다 | 물건이 없습니다 |
| `Item/PlayerInventory.mlua:854` | 개 넣었다 | 개를 넣었습니다 |
| `Item/PlayerInventory.mlua:868, 891` | 골드가 부족하다 ({…} 필요) | 골드가 부족합니다 ({…} 필요) |
| `Item/PlayerInventory.mlua:875` | 옵션을 새로 새겼다 | 옵션을 새로 새겼습니다 |
| `Item/PlayerInventory.mlua:896` | 망치질이 빗나갔다… 장비는 그대로다. (골드 | 망치질이 빗나갔습니다. 장비는 그대로입니다 (골드 |
| `Item/PlayerInventory.mlua:903` | 개를 뚫었다{…} / 이제 룬을 끼울 수 있다 (룬워드 조합은 메뉴 「룬워드」) | 개를 뚫었습니다{…} / 이제 룬을 끼울 수 있습니다 (룬워드 조합은 메뉴 「룬워드」) |
| `Item/PlayerShop.mlua:57, 138` | 골드가 부족하다 | 골드가 부족합니다 |
| `Item/PlayerShop.mlua:61, 149, 165` | 가방이 가득 찼다 | 가방이 가득 찼습니다 |
| `Monster/BossMoves.mlua:585` | 둥지가 깨어났다 ／ 부수면 졸개가 멈춘다 | 둥지가 깨어났다 ／ 부수면 졸개가 멈춥니다 |
| `Monster/MonsterSpawner.mlua:395` | 이 발밑에 떨어졌다 | 이 발밑에 떨어졌습니다 |
| `Player/PetSystem.mlua:107` | 」가 곁에 왔다 — 메뉴 → 펫에서 주울 물건을 고르세요 | 」가 곁에 왔습니다 — 메뉴 → 펫에서 주울 물건을 고르세요 |
| `Player/PlayerCorpses.mlua:58` | 지난번에 쓰러진 시체가 마을에 있다 — 다가가면 장비를 되찾는다 (미니맵 「내 시체」) | 지난번에 쓰러진 시체가 마을에 있습니다 — 다가가면 장비를 되찾습니다 (미니맵 「내 시체」) |
| `Player/PlayerCorpses.mlua:170` | 시체를 되찾았다 | 시체를 되찾았습니다 |
| `Player/PlayerSave.mlua:355` | 쓰러진 상태에서는 캐릭터를 바꿀 수 없다 | 쓰러진 상태에서는 캐릭터를 바꿀 수 없습니다 |
| `Player/PlayerSave.mlua:361` | 저장에 실패해 캐릭터 선택으로 가지 않았다. 잠시 뒤 다시 시도하세요 | 저장에 실패해 캐릭터 선택으로 가지 않았습니다. 다시 시도해주세요 |
| `Player/PlayerSave.mlua:376, 391` | 캐릭터 선택으로 이동하지 못했다. 잠시 뒤 다시 시도하세요 | 캐릭터 선택으로 이동하지 못했습니다. 다시 시도해주세요 |
| `Player/PlayerSave.mlua:409` | 이동하지 못했다. 다시 골라 주세요 | 이동하지 못했습니다. 다시 골라 주세요 |
| `Player/PlayerSave.mlua:487` | 쓰러진 상태에서는 채널을 옮길 수 없다 | 쓰러진 상태에서는 채널을 옮길 수 없습니다 |
| `Player/PlayerSave.mlua:493` | 저장에 실패해 채널을 옮기지 않았다. 잠시 뒤 다시 시도하세요 | 저장에 실패해 채널을 옮기지 않았습니다. 다시 시도해주세요 |
| `Player/PlayerSave.mlua:506` | 채널을 옮기지 못했다 (가득 찼거나 닫히는 채널). 다른 채널을 고르세요 | 채널을 옮기지 못했습니다 (가득 찼거나 닫히는 채널). 다른 채널을 고르세요 |
| `Player/PlayerSave.mlua:594` | 저장에 실패해 이동하지 않았다. 잠시 뒤 다시 시도하세요 | 저장에 실패해 이동하지 않았습니다. 다시 시도해주세요 |
| `Player/PlayerSave.mlua:813` | 거래가 취소되었다 | 거래가 취소되었습니다 |
| `Player/PlayerStats.mlua:706` | 에 걸렸다 ( | 에 걸렸습니다 ( |
| `Player/PlayerStats.mlua:736` | 뼈 감옥에 갇혔다 | 뼈 감옥에 갇혔습니다 |
| `Player/PlayerTravel.mlua:134` | 아직 길이 열리지 않았다 — 묘지기 여왕 오르넬라를 쓰러뜨려야 사막길이 열린다 | 아직 길이 열리지 않았습니다 — 묘지기 여왕 오르넬라를 쓰러뜨리면 사막길이 열립니다 |
| `Player/PlayerTravel.mlua:135` | 아직 바다가 열리지 않았다 — 대사제 알하자르를 쓰러뜨려야 출항한다 | 아직 바다가 열리지 않았습니다 — 대사제 알하자르를 쓰러뜨리면 출항할 수 있습니다 |
| `Player/PlayerTravel.mlua:136` | 아직 북쪽 길이 열리지 않았다 — 익사한 제독 바렌을 쓰러뜨려야 떠난다 | 아직 북쪽 길이 열리지 않았습니다 — 익사한 제독 바렌을 쓰러뜨리면 떠날 수 있습니다 |
| `Player/PlayerTravel.mlua:169` | 웨이포인트에서 언제든 이곳으로 이동할 수 있다 | 웨이포인트에서 언제든 이곳으로 이동할 수 있습니다 |
| `Player/PlayerTravel.mlua:201, 228` | 다른 난이도는 「게임 나가기」 뒤 그 난이도로 방을 만들어 간다 | 다른 난이도는 「게임 나가기」 뒤 그 난이도로 방을 만들어주세요 |
| `Player/PlayerTravel.mlua:265` | 이미 마을이다 | 이미 마을입니다 |
| `Player/PlayerTravel.mlua:270` | 심연에서는 귀환 두루마리를 쓸 수 없다 — 층을 정복하고 왼쪽 문으로 나가라 | 심연에서는 귀환 두루마리를 쓸 수 없습니다 — 층을 정복하고 왼쪽 문으로 나가주세요 |
| `Player/PlayerTravel.mlua:276` | 지금은 마을 포털을 열 수 없다 | 지금은 마을 포털을 열 수 없습니다 |
| `Player/PlayerTravel.mlua:286` | 귀환 두루마리가 없다 (상인에게 구입) | 귀환 두루마리가 없습니다 (상인에게 구입) |
| `Player/PlayerTravel.mlua:318` | 처치 — 옆에 마을로 가는 포털이 1분 동안 열렸다 | 처치 — 옆에 마을로 가는 포털이 1분 동안 열렸습니다 |
| `Progress/ProgressionSystem.mlua:45` | 난이도가 열렸다! ／ 웨이포인트에서 난이도를 바꿀 수 있다 | 난이도가 열렸습니다! ／ 웨이포인트에서 난이도를 바꿀 수 있습니다 |
| `UI/Hud/UXFeedback.mlua:134` | 난이도가 열렸다! | 난이도가 열렸습니다! |
| `Progress/ProgressionSystem.mlua:88` | 」 토벌에 성공했다! | 」 토벌에 성공했습니다! |
| `Quest/PlayerQuest.mlua:270` | 봉인이 풀렸다 → | 봉인 해제 → |
| `Quest/PlayerQuest.mlua:397` | 이(가) 남긴 것 — 발밑에 떨어졌다 | 이(가) 남긴 것 — 발밑에 떨어졌습니다 |
| `Shadow/ShadowCommander.mlua:428` | 그림자가 지쳤다 — 마을에 들를 때까지 소환할 수 없다 ( | 그림자가 지쳤습니다 — 마을에 들를 때까지 소환할 수 없습니다 ( |
| `Shadow/ShadowCommander.mlua:430` | %s 그림자 쓰러짐 %d/%d — 한도가 차면 마을에 들를 때까지 못 부른다 | %s 그림자 쓰러짐 %d/%d — 한도가 차면 마을에 들를 때까지 부를 수 없습니다 |
| `Shadow/ShadowCommander.mlua:673` | 기에 도달했다 | 기에 도달했습니다 |
| `Shadow/ShadowCommander.mlua:684` | 지정한 그림자가 아직 회복 중이다 (지친 정예·보스는 마을에 들러야 한다) | 지정한 그림자가 아직 회복 중입니다 (지친 정예·보스는 마을에 들러야 합니다) |
| `Shadow/ShadowCommander.mlua:685` | 지정한 그림자가 모두 소환 중이다 — 보관함(H)에서 소환 지정을 바꿀 수 있다 | 지정한 그림자가 모두 소환 중입니다 — 보관함(H)에서 소환 지정을 바꿀 수 있습니다 |
| `Shadow/ShadowCommander.mlua:687` | 부를 그림자가 없다 — 혼을 추출해 그림자를 모으세요 | 부를 그림자가 없습니다 — 혼을 추출해 그림자를 모으세요 |
| `Shadow/ShadowCommander.mlua:688` | 그림자가 아직 회복 중이다 | 그림자가 아직 회복 중입니다 |
| `Shadow/ShadowCommander.mlua:689` | 지금은 그림자를 부를 수 없다 | 지금은 그림자를 부를 수 없습니다 |
| `Shadow/ShadowCommander.mlua:712, 741` | )을 배워야 한다 | )을 배워야 합니다 |
| `Shadow/ShadowOwner.mlua:71` | 가방이 가득 차 정수를 받을 수 없다 | 가방이 가득 차 정수를 받을 수 없습니다 |
| `Shadow/ShadowOwner.mlua:145` | 이미 최대 강화(+{…})다 | 이미 최대 강화(+{…})입니다 |
| `Shadow/ShadowOwner.mlua:151` | 까지 강화할 수 있다 (Lv | 까지 강화할 수 있습니다 (Lv |
| `Shadow/ShadowOwner.mlua:159` | 정수가 부족하다 | 정수가 부족합니다 |
| `Shadow/ShadowOwner.mlua:168` | 이상 룬 1개가 필요하다 | 이상 룬 1개가 필요합니다 |
| `Shadow/ShadowOwner.mlua:182` | %s +%d 그대로 — 정수 %d · %s 룬이 사라졌다 (성공 %d%%) | %s +%d 그대로 — 정수 %d · %s 룬이 사라졌습니다 (성공 %d%%) |
| `Shadow/ShadowOwner.mlua:207` | 마을에서 쉬어 지친 그림자가 다시 싸울 수 있다 | 마을에서 쉬어 지친 그림자가 다시 싸울 수 있습니다 |
| `Shadow/SoulExtractor.mlua:19` | )을 배워야 한다 | )을 배워야 합니다 |
| `Shadow/SoulExtractor.mlua:108` | )을 배운 뒤에 할 수 있다 | )을 배운 뒤에 할 수 있습니다 |
| `Shadow/SoulExtractor.mlua:114` | 가까운 혼이 없다 | 가까운 혼이 없습니다 |
| `Shadow/SoulExtractor.mlua:200` | % — 혼이 흩어졌다 | % — 혼이 흩어졌습니다 |
| `Skill/SkillBook.mlua:1608` | 부터는 마을의 사제 오렌·카라반 대장 무하드 곁에서 초기화할 수 있다 ( | 부터는 마을의 사제 오렌·카라반 대장 무하드 곁에서 초기화할 수 있습니다 ( |
| `Skill/SkillBook.mlua:1612` | 골드가 부족하다 ( | 골드가 부족합니다 ( |
| `Skill/SkillBook.mlua:1618` | 을 돌려받았다 | 을 돌려받았습니다 |
| `Skill/SkillBook.mlua:1642` | 스킬·능력치가 새로 바뀌었다 ／ 스킬 포인트 %d · 능력치 포인트 %d를 모두 돌려받았다 — | 스킬·능력치가 새로 바뀌었습니다 ／ 스킬 포인트 %d · 능력치 포인트 %d를 모두 돌려받았습니다 — |
| `Skill/SkillEffects.mlua:577` | 뼛조각을 만들지 못했다 | 뼛조각을 만들지 못했습니다 |
| `Skill/SkillEffects.mlua:675` | 불꽃을 날리지 못했다 | 불꽃을 날리지 못했습니다 |
| `Skill/SkillEffects.mlua:694` | 서리 혼을 날리지 못했다 | 서리 혼을 날리지 못했습니다 |
| `Skill/SkillEffects.mlua:846` | 흡수할 대상이 없다 | 흡수할 대상이 없습니다 |
| `Skill/SkillEffects.mlua:1100` | 저주할 적이 범위 안에 없다 | 저주할 적이 범위 안에 없습니다 |
| `Skill/SkillEffects.mlua:1152, 1170` | 가둘 적이 범위 안에 없다 | 가둘 적이 범위 안에 없습니다 |
| `Skill/SkillEffects.mlua:1240` | 영혼을 날리지 못했다 | 영혼을 날리지 못했습니다 |
| `Skill/SkillEffects.mlua:1273` | 희생할 그림자가 없다 — 그림자를 먼저 소환하세요 | 희생할 그림자가 없습니다 — 그림자를 먼저 소환하세요 |
| `Skill/SkillEffects.mlua:1305` | 승격할 그림자가 없다 — 그림자를 먼저 소환하세요 | 승격할 그림자가 없습니다 — 그림자를 먼저 소환하세요 |
| `Skill/SkillEffects.mlua:1331` | 따라올 소환수가 없다 | 따라올 소환수가 없습니다 |
| `Social/ChannelSystem.mlua:91` | 이미 이 채널에 있다 | 이미 이 채널에 있습니다 |
| `Social/ChannelSystem.mlua:95` | 심도·캐릭터 선택 중에는 채널을 옮길 수 없다 — 야영지나 사냥터에서 옮기세요 | 심도·캐릭터 선택 중에는 채널을 옮길 수 없습니다 — 야영지나 사냥터에서 옮기세요 |
| `Social/ChannelSystem.mlua:106` | 그 채널은 이제 없다 — 목록을 새로 불러오세요 | 그 채널은 이제 없습니다 — 목록을 새로 불러오세요 |
| `Social/ChannelSystem.mlua:111` | 그 채널은 가득 찼다 | 그 채널은 가득 찼습니다 |
| `Social/PlayerDuel.mlua:63` | 이(가) 결투를 포기했다 — 승리 | 이(가) 결투를 포기했습니다 — 승리 |
| `Social/PlayerDuel.mlua:65` | 결투를 포기했다 | 결투를 포기했습니다 |
| `Social/PlayerDuel.mlua:77` | …골드 {N}%를 떨군다 · 포기는 플레이어 창(P) | …골드 {N}%를 떨어뜨립니다 · 포기는 파티플레이 창(P) (P 창 이름은 101줄 69번에서 파티플레이로 확정) |
| `Social/PlayerDuel.mlua:84` | 결투가 끝났다 | 결투가 끝났습니다 |
| `Social/PlayerDuel.mlua:123` | 을(를) 쓰러뜨렸다 | 을(를) 쓰러뜨렸습니다 |
| `Social/PlayerSocial.mlua:29` | 같은 지역에 있어야 한다 | 같은 지역에 있어야 합니다 |
| `Social/PlayerSocial.mlua:33` | 마을에서는 결투할 수 없다 | 마을에서는 결투할 수 없습니다 |
| `Social/PlayerSocial.mlua:37` | 보다 크면 결투할 수 없다 | 보다 크면 결투할 수 없습니다 |
| `Social/PlayerSocial.mlua:41` | 상대가 다른 요청을 처리 중이다 | 상대가 다른 요청을 처리 중입니다 |
| `Social/PlayerSocial.mlua:48–49` | {파티 초대·결투 신청·거래 요청}를 보냈다: {이름} | {이름}님에게 {파티 초대를·결투 신청을·거래 요청을} 보냈습니다 |
| `Social/PlayerSocial.mlua:71` | 님이 거절했다 | 님이 거절했습니다 |
| `Social/PlayerSocial.mlua:83, 84` | 이미 결투 중이다 | 이미 결투 중입니다 |
| `Social/PlayerSocial.mlua:87, 88` | 레벨 차가 커서 결투할 수 없다 | 레벨 차가 커서 결투할 수 없습니다 |
| `Social/PlayerSocial.mlua:123` | 이 채널에 없다 | 이 채널에 없습니다 |
| `Social/PlayerTrade.mlua:61, 254` | 거래가 취소되었다 | 거래가 취소되었습니다 |
| `Social/PlayerTrade.mlua:92` | 귀속 아이템은 거래할 수 없다 | 귀속 아이템은 거래할 수 없습니다 |
| `Social/PlayerTrade.mlua:115` | 가방이 가득 차 되돌릴 수 없다 | 가방이 가득 차 되돌릴 수 없습니다 |
| `Social/PlayerTrade.mlua:142` | 상대가 거래 내용을 바꿨다 — 다시 보고 확인하라 | 상대가 거래 내용을 바꿨습니다 — 다시 보고 확인해주세요 |
| `Social/PlayerTrade.mlua:146` | 상대가 방금 내용을 바꿨다 — 잠시 뒤 확인할 수 있다 | 상대가 방금 내용을 바꿨습니다 — 잠시 뒤 확인할 수 있습니다 |
| `Social/PlayerTrade.mlua:157` | 거래를 취소했다 | 거래를 취소했습니다 |
| `Social/PlayerTrade.mlua:173, 174` | 가방 공간이 부족하다 | 가방 공간이 부족합니다 |
| `Social/PlayerTrade.mlua:181, 182` | 소지 상한을 넘어 거래하지 못했다 | 소지 상한을 넘어 거래하지 못했습니다 |
| `Social/PlayerTrade.mlua:187, 188` | 골드가 부족해 거래하지 못했다 | 골드가 부족해 거래하지 못했습니다 |
| `Social/PlayerTrade.mlua:227` | 개를 창고에 넣었다 | 개를 창고에 넣었습니다 |
| `Social/RoomSystem.mlua:262` | 방 목록에 쓰지 못했다. 잠시 뒤 다시 시도하세요 | 방 목록에 쓰지 못했습니다. 다시 시도해주세요 |
| `Social/RoomSystem.mlua:278` | 그 방은 이제 없다 — 목록을 새로 불러오세요 | 그 방은 이제 없습니다 — 목록을 새로 불러오세요 |
| `Social/RoomSystem.mlua:283` | 비밀번호가 맞지 않다 | 비밀번호가 맞지 않습니다 |
| `Social/RoomSystem.mlua:287` | 방이 가득 찼다 | 방이 가득 찼습니다 |
| `Social/RoomSystem.mlua:294` | 아직 열지 않은 난이도의 방이다 | 아직 열지 않은 난이도의 방입니다 |
| `Social/RoomSystem.mlua:313` | 모집에 끼지 못했다 (가득 찼거나 출발함) — 목록을 새로 불러오세요 | 모집에 끼지 못했습니다 (가득 찼거나 출발함) — 목록을 새로 불러오세요 |
| `Social/RoomSystem.mlua:379` | 출발하지 못했다. 잠시 뒤 다시 누르세요 | 출발하지 못했습니다. 다시 시도해주세요 |
| `Social/RoomSystem.mlua:440` | 그 방이 있던 채널이 닫혔다 — 다른 방을 고르세요 | 그 방이 있던 채널이 닫혔습니다 — 다른 방을 고르세요 |
| `Social/RoomSystem.mlua:445` | 그 방의 채널이 가득 찼다 — 자리가 나면 자동으로 들어갑니다 (최대 5분) | 그 방의 채널이 가득 찼습니다 — 자리가 나면 자동으로 들어갑니다 (최대 5분) |
| `Social/RoomSystem.mlua:467` | 모집이 끝났다 (팀장이 나갔거나 오래 소식이 없음) | 모집이 끝났습니다 (팀장이 나갔거나 오래 소식이 없음) |
| `Social/RoomSystem.mlua:479` | 함께 들어갈 채널을 찾지 못했다 — 잠시 뒤 다시 출발해 보세요 | 함께 들어갈 채널을 찾지 못했습니다. 다시 시도해주세요 |
| `Social/RoomSystem.mlua:494` | 기다리던 방이 닫혔거나 가득 찼다 — 다른 방을 고르세요 | 기다리던 방이 닫혔거나 가득 찼습니다 — 다른 방을 고르세요 |
| `Social/RoomSystem.mlua:498` | 5분 동안 자리가 나지 않았다 — 다른 방을 고르거나 다시 시도하세요 | 5분 동안 자리가 나지 않았습니다 — 다른 방을 고르거나 다시 시도해주세요 |
| `Social/RoomSystem.mlua:662` | 방에 들어가지 못했다. 잠시 뒤 다시 시도하세요 | 방에 들어가지 못했습니다. 다시 시도해주세요 |
| `Social/RoomSystem.mlua:692` | 그 방이 닫혔거나 가득 찼다 — 다른 방을 고르세요 | 그 방이 닫혔거나 가득 찼습니다 — 다른 방을 고르세요 |
| `Social/RoomSystem.mlua:744` | 쓰러진 상태에서는 나갈 수 없다 | 쓰러진 상태에서는 나갈 수 없습니다 |
| `Social/RoomSystem.mlua:757` | 로비로 나가지 못했다. 잠시 뒤 다시 시도하세요 | 로비로 나가지 못했습니다. 다시 시도해주세요 |
| `UI/Hud/HudMain.mlua:211` | 냉기 둔화 · 이동 속도 -40% (냉기 저항이 높을수록 짧다) | 냉기 둔화 · 이동 속도 -40% (냉기 저항이 높을수록 짧아집니다) |
| `UI/Hud/HudMain.mlua:214` | 부식 오오라 · 내 모든 저항 -%d (변종 몬스터 곁 — 벗어나면 풀린다) | 부식 오오라 · 내 모든 저항 -%d (변종 몬스터 곁 — 벗어나면 풀립니다) |
| `UI/Hud/HudMain.mlua:217` | 감전 · 번개 연쇄에 맞았다 (번개 저항이 높을수록 피해가 줄어든다) | 감전 · 번개 연쇄에 맞았습니다 (번개 저항이 높을수록 피해가 줄어듭니다) |
| `UI/Hud/HudMain.mlua:634` | 이 발밑에 떨어졌다 | 이 발밑에 떨어졌습니다 |
| `UI/ShadowHUD.mlua:365` | 본래 Lv%d — 지금은 내 레벨(Lv%d)만큼 힘을 낸다. 내가 크면 본래 레벨까지 함께 강해진다 | 본래 Lv%d — 지금은 내 레벨(Lv%d)만큼 힘을 냅니다. 내가 크면 본래 레벨까지 함께 강해집니다 |
| `UI/ShadowHUD.mlua:366` | 레벨 최대 (내 레벨까지) — 내가 레벨업하면 다시 자란다 | 레벨 최대 (내 레벨까지) — 내가 레벨업하면 다시 자랍니다 |
| `UI/ShadowHUD.mlua:367` | 경험치 %d%% — 소환해 데리고 다니며 처치하면 오른다 | 경험치 %d%% — 소환해 데리고 다니며 처치하면 오릅니다 |
| `UI/ShadowHUD.mlua:429` | 아직 고른 그림자가 없다 | 아직 고른 그림자가 없습니다 |
| `UI/ShadowHUD.mlua:430` | 소환 중인 그림자와 보스 그림자는 고를 수 없다 · 소환 지정·강화는 「선택 끝내기」 후 | 소환 중인 그림자와 보스 그림자는 고를 수 없습니다 · 소환 지정·강화는 「선택 끝내기」 후 |
| `UI/ShadowHUD.mlua:570` | 정예: 일반보다 기본 공격·생명이 높고 분해하면 정수를 더 준다 | 정예: 일반보다 기본 공격·생명이 높고 분해하면 정수를 더 줍니다 |
| `UI/ShadowHUD.mlua:572` | 특수 능력 없음 (정예·변종 우두머리에게서 추출하면 고유 능력이 붙는다) | 특수 능력 없음 (정예·변종 우두머리에게서 추출하면 고유 능력이 붙습니다) |
| `UI/Windows/CharSelectWindow.mlua:125` | 캐릭터 %d / 4  ·  창고는 모든 캐릭터가 함께 쓴다  ·  %s ／ 빈 칸을 누르면 새 캐릭터를 만든다 | 캐릭터 %d / 4  ·  창고는 모든 캐릭터가 함께 씁니다  ·  %s ／ 빈 칸을 누르면 새 캐릭터를 만듭니다 |
| `UI/Windows/JournalWindow.mlua:293` | 처치 기록이 쌓였다 | 처치 기록이 쌓였습니다 |
| `UI/Windows/NpcWindow.mlua:383` | 도박 — 안 쓰는 물건은 팔 수 있다 · 가진 골드 %d | 도박 — 안 쓰는 물건은 팔 수 있습니다 · 가진 골드 %d |
| `UI/Windows/NpcWindow.mlua:428` | · 옵션 바꾸기: 마법·레어 장비의 옵션을 새로 새긴다 (레벨이 높을수록 비쌈, 레어는 3배) | · 옵션 바꾸기: 마법·레어 장비의 옵션을 새로 새깁니다 (레벨이 높을수록 비쌈, 레어는 3배) |
| `UI/Windows/QuestWindow.mlua:211` | 진행 중 · 굴에 들어가면 남은 수가 보인다 | 진행 중 · 굴에 들어가면 남은 수 표시 |
| `UI/Windows/QuestWindow.mlua:213` | 진행 중 · 열쇠를 지닌 적을 찾아라 | 진행 중 · 열쇠를 지닌 적 찾기 |
| `UI/Windows/QuestWindow.mlua:215` | 진행 중 · 봉인이 풀렸다 → 옥좌로 ／ 진행 중 · 옥좌의 문지기를 쓰러뜨려라 | 진행 중 · 봉인 해제 → 옥좌로 ／ 진행 중 · 옥좌의 문지기 처치 |
| `UI/Windows/RankWindow.mlua:100` | 아직 기록이 없다 | 아직 기록이 없습니다 |
| `UI/Windows/RankWindow.mlua:130` | 아직 기록이 없다 | 아직 기록이 없습니다 |
| `UI/Windows/ShopWindow.mlua:188` | 야영지로 돌아가는 포털을 연다 — 가방에 들어가며, 「사용」하거나 벨트 칸에 넣어 쓴다 | 야영지로 돌아가는 포털을 엽니다 — 가방에 들어가며, 「사용」하거나 벨트 칸에 넣어 씁니다 |
| `UI/Windows/ShopWindow.mlua:237` | 누른 칸을 모두 판다 | 누른 칸 모두 판매 |
| `UI/Windows/ShopWindow.mlua:266` | 귀속 재료는 팔 수 없다 | 귀속 재료는 팔 수 없습니다 |
| `UI/Windows/SkillOffer.mlua:166` | 하나만 고른다 — 다시 고를 수 없다 | 하나만 고르세요 — 다시 고를 수 없습니다 |
| `UI/Windows/SkillWindow.mlua:229` | 모든 스킬이 열렸다 | 모든 스킬이 열렸습니다 |
| `UI/Windows/SocialWindow.mlua:134` | 착용한 장비가 없다 | 착용한 장비가 없습니다 |
| `UI/Windows/TradeWindow.mlua:192` | 방금 바뀌었다 | 방금 바뀜 |
| `Undead/UndeadSystem.mlua:72` | 터뜨릴 해골 전사가 없다 — 해골 전사를 먼저 일으키세요 | 터뜨릴 해골 전사가 없습니다 — 해골 전사를 먼저 일으키세요 |
| `Undead/UndeadSystem.mlua:222` | 바칠 해골이 없다 — 해골 전사·마법사를 먼저 일으키세요 | 바칠 해골이 없습니다 — 해골 전사·마법사를 먼저 일으키세요 |
| `Undead/UndeadSystem.mlua:371` | 혼이 너무 멀리 있다 | 혼이 너무 멀리 있습니다 |
| `Undead/UndeadSystem.mlua:376` | 근처에 내 혼이 없다 — 몬스터를 처치한 뒤 소환하세요 | 근처에 내 혼이 없습니다 — 몬스터를 처치한 뒤 소환하세요 |
| `Undead/UndeadSystem.mlua:381` | 최상위·보스는 되살릴 수 없다 | 최상위·보스는 되살릴 수 없습니다 |
| `Undead/UndeadSystem.mlua:408` | 기 — 가장 오래된 하나가 무너졌다 (스킬 레벨을 올리면 늘어난다) | 기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다) |
| `World/AltarRitual.mlua:68` | 피의 제단이 잠잠하다 — %d:%02d 뒤 다시 의식을 시작할 수 있다 | 피의 제단이 잠잠합니다 — %d:%02d 뒤 다시 의식을 시작할 수 있습니다 |
| `World/AltarRitual.mlua:111` | 피의 제단이 다시 꿈틀거린다 — 의식을 시작할 수 있다 | 피의 제단이 다시 꿈틀거립니다 — 의식을 시작할 수 있습니다 |
| `World/BossRespawn.mlua:79` | — 이 게임에서는 다시 나타나지 않는다 (새 게임을 열면 다시 나온다) | — 이 게임에서는 다시 나타나지 않습니다 (새 게임을 열면 다시 나옵니다) |
| `World/BossRespawn.mlua:80` | 뒤 다시 나타난다 | 뒤 다시 나타납니다 |
| `World/CursedChest.mlua:144` | 봉인되어 있다 — | 봉인되어 있습니다 — |
| `World/CursedChest.mlua:144` | 의 열쇠가 필요하다 | 의 열쇠가 필요합니다 |
| `World/CursedChest.mlua:165` | 봉인 상자를 열었다 | 봉인 상자를 열었습니다 |
| `World/CursedChest.mlua:170` | 봉인 상자를 열었다 | 봉인 상자를 열었습니다 |
| `World/CursedChest.mlua:185` | 심도 보상 상자를 열었다 ( | 심도 보상 상자를 열었습니다 ( |
| `World/CursedChest.mlua:199` | 저주받은 상자 · 다가가면 열린다 | 저주받은 상자 · 다가가면 열림 |
| `World/CursedChest.mlua:220` | 봉인 상자 · 열쇠가 필요하다 ／ 봉인 상자 · 다가가면 열린다 | 봉인 상자 · 열쇠 필요 ／ 봉인 상자 · 다가가면 열림 |
| `World/CursedChest.mlua:221` | 심도 보상 상자 · 다가가면 열린다 | 심도 보상 상자 · 다가가면 열림 |
| `World/WarpGate.mlua:82` | 옥좌로 가는 문이 봉인되어 있다 — {…}를 쓰러뜨려라 | 옥좌로 가는 문이 봉인되어 있습니다 — {…}를 쓰러뜨리면 열립니다 |
| `World/WarpGate.mlua:93` | 다른 사람의 귀환 포털이다 — 같은 파티여야 들어갈 수 있다 | 다른 사람의 귀환 포털입니다 — 같은 파티여야 들어갈 수 있습니다 |
| `tools/build/charselect.cjs:76` | 외형은 나중에 바꿀 수 없다 / 장비를 입으면 옷과 무기 모습이 바뀐다 | 외형은 나중에 바꿀 수 없습니다 / 장비를 입으면 옷과 무기 모습이 바뀝니다 |
| `tools/build/roompicker.cjs:70` | 나만의 게임 · 다른 사람은 들어오지 않는다 | 나만의 게임 · 다른 사람은 들어오지 않습니다 |
| `tools/build/roompicker.cjs:71` | 방에 들어가거나 직접 만든다 · 최대 4명 | 방에 들어가거나 직접 만듭니다 · 최대 4명 |

### 같은 규칙 — 「잠시 뒤 다시 시도하세요」 → 「다시 시도해주세요」 (이미 「-습니다」였던 줄)

| 파일:줄 | 전 | 후 |
|---|---|---|
| `Endgame/DepthDirector.mlua:527` | 다음 층 이동 준비에 실패했습니다. 잠시 뒤 다시 시도하세요 | 다음 층 이동 준비에 실패했습니다. 다시 시도해주세요 |
| `Endgame/DepthGate.mlua:163` | 심도 입장에 실패했습니다. 잠시 뒤 다시 시도하세요 | 심도 입장에 실패했습니다. 다시 시도해주세요 |
| `Player/PlayerTravel.mlua:114` | 마을로 돌아가지 못했습니다. 잠시 뒤 다시 시도하세요 | 마을로 돌아가지 못했습니다. 다시 시도해주세요 |
| `Undead/UndeadSystem.mlua:884, 890` | 소환수 이동 준비에 실패했습니다. 잠시 뒤 다시 시도하세요 | 소환수 이동 준비에 실패했습니다. 다시 시도해주세요 |

「-다」 줄 안의 「잠시 뒤 다시 시도하세요 / 다시 누르세요 / 다시 출발해 보세요」도 위 ② 표에서 모두 「다시 시도해주세요」로 맞췄다. 거래 「잠시 뒤 확인할 수 있습니다」는 실제 잠금 시간이 있는 안내라 「잠시 뒤」를 남겼다.

## ③ 5번 글귀 (일시 그림자가 사라질 때)

| 파일:줄 | 전 | 후 |
|---|---|---|
| `Undead/UndeadSystem.mlua:796` | 부터 직접 거두세요 | 부터 직접 획득 가능 |

- 뜨는 곳: `_Util:Notify` → `NoticeFeed` 안내 줄 = `ui/RewardHUD`의 `Feed/Line1~4/Text` (빌더 `tools/build/ux-feedback.cjs:41~46`) — **글 칸 590×40 · 글자 24 굵게 · bestfit 없음**, 칸 판 620×44 · 왼쪽 아래(PC) / 지도 아래(모바일) · 창이 열려 있으면 창 밖 가장자리. 넘치면 `GetPreferredHeight`로 두 줄 판이 된다(`NoticeFeed.TextWidth 590`).
- 길이 어림: 「그림자가 흩어졌습니다 · Lv5부터 직접 획득 가능」 ≈ 한글 18자 + Lv5·띄어쓰기·가운뎃점 ≈ 21~22자 폭 × 24px ≈ 520px → 590px 안. 지금의 「…직접 거두세요」보다 약 3자 폭 길고, 메이커에서 넘쳤던 「…직접 거둘 수 있습니다」보다 약 3자 폭 짧다. **한 줄 여부는 메이커에서 확인 필요.**

## ④ 그대로 둔 줄

### 판단이 애매해서 둔 줄 (37) — 바꿀지 결정이 필요하면 이 표에서

| 파일:줄 | 글 | 이유 |
|---|---|---|
| `UI/Hud/HudMain.mlua:855` | {변종} · 독안개가 남는다 | 그대로 · 몬스터 정보 칸의 몬스터 설명 (archetypes.csv 특성 글과 같은 갈래) |
| `UI/Hud/HudMain.mlua:868` | 광폭! 공격·이동이 빨라졌다 | 그대로 · 몬스터 정보 칸 상태 묘사 (연출 줄에 가까움) |
| `Monster/Monster.mlua:762` | {보스}이(가) 다시 나타났다 | 그대로 · 사건 묘사 (보스 재등장) |
| `Monster/MonsterSpawner.mlua:508` | {이름}이(가) 다시 나타났다 | 그대로 · 사건 묘사 (고정 보스 재등장) |
| `Monster/BossMoves.mlua:585` | 둥지가 깨어났다 (판 제목) | 그대로 · 사건 연출 제목 — 둘째 줄 「부수면 졸개가 멈춥니다」는 바꿈 |
| `Quest/PlayerQuest.mlua:537` | 옥좌의 봉인이 풀렸다 (판 제목) | 그대로 · 사건 연출 제목 (문지기 마지막 말과 함께) — 퀘스트 추적 줄의 「봉인이 풀렸다 →」는 「봉인 해제 →」로 바꿈 |
| `UI/Hud/UXFeedback.mlua:133` | 옥좌의 봉인이 풀렸다 (비교 문자열) | 그대로 · 위 제목과 짝 (바꾸면 둘 다 같이) |
| `World/CursedChest.mlua:103` | 저주받은 상자! 매복이 덮친다 — 보물을 지켜라 | 그대로 · 매복 시작 연출 줄 (안내 줄로 뜸) |
| `UI/Windows/NpcWindow.mlua:428` | %s 소지품에서 물건을 고르면 손봐 주지. | 그대로 · 대장장이 하르크 대사 — 대사에는 게임 용어를 쓰지 않는 말투 규칙(check_voice). 같은 칸 아래 안내 「옵션을 새로 새깁니다」는 바꿈 |
| `ui/ShadowHUD `Hint` 칸` | 클릭 이동·공격 | … I 소지품 … P 플레이어 L 랭킹 | 그대로 · 꺼진 옛 칸 (`tools/build/ui.cjs:804`가 enable:false, 스크립트도 안 켬) — 빌더에 글이 없어 바꾸려면 빌더에 patch 한 줄이 필요 |
| `data/quests.csv desc 24줄` | 「…를 쓰러뜨려라. …하나씩 는다.」 같은 임무 문체 | 그대로 · 퀘스트 창 본문 — 퀘스트 기록(세계 안 글)에 가까운 문체라 결정 필요 · 바꾸면 24줄 모두 「-하세요/-습니다」 |
| `data/story.csv lock_act2·3·4` | 「사막길은 아직 막혀 있다. …」 | 그대로 · 이야기 문체 (카라반 NPC 창에 뜨는 이야기 글) |

### 규칙상 그대로 (연출 · 창 제목 · 스킬 설명 · 대사 · 세계 글 · 개발 도구)

| 파일:줄 | 글 | 이유 |
|---|---|---|
| `Undead/UndeadSystem.mlua:533` | 쓰러뜨린 적이 잠시 그림자로 일어섰다 | 연출 줄 (101줄 3번 확정) |
| `Social/PartyRescue.mlua:134 · UI/Hud/RescueHUD.mlua:47 · tools/build/coop-hud.cjs:53` | 다시 일어났다 / 쓰러졌다 | 창 제목 한 마디 (101줄 8·14번 확정) |
| `World/AltarRitual.mlua:96` | 피의 의식이 깨어났다 — 제단으로 망자들이 몰려온다! | 사건 연출 (「~가 깨어났다 — …」) |
| `World/RoadAltar.mlua:117` | {의식}이 깨어났다 — 망자들이 제단으로 몰려온다 | 사건 연출 (같은 꼴) |
| `World/AltarRitual.mlua:150` | {제단의 주인}이(가) 모습을 드러냈다! | 보스 등장 연출 |
| `UI/Hud/HudMain.mlua:542` | 습격이 온다 | 습격 연출 줄 |
| `Story/AshAwakening.mlua:265` | 하늘이 핏빛으로 물든다 (제목) | 연출 제목 (둘째 줄은 이미 「…됩니다」) |
| `Story/ActClearFx.mlua:45` | {보스} 처치 · 사냥터의 어둠이 걷혔다. 마을 사람들이 너를 기다린다 | 장 마무리 연출 (이야기 말투) |
| `Progress/ProgressionSystem.mlua:21` | {그림자 인형} — 주인에게 돌아갔다 + 「대사」 | 이야기 연출 (story.csv shade_ 대사와 한 판) |
| `Monster/AshKingRite.mlua:183` | 「네가 아끼던 자들의 그림자다. …」 | 보스 대사 |
| `UI/Windows/NpcWindow.mlua:288·289·410·482·500` | NPC 기본 대사 (「지금은 할 이야기가 없다.」 등) | NPC 대사 |
| `Quest/PlayerQuest.mlua:583·584·587·588` | 그림자 1기가 정예로 선다 · 뼈 창 1랭크를 미리 쓴다 · … 튄다 · … 옮는다 | 선택 보상 효과 = 스킬 노드 설명과 같은 갈래 |
| `data/skills.csv desc · Skill/SkillBook.mlua 노드 수치 줄` | 스킬 설명 | 스킬 설명 (「-다」 허용) |
| `data/archetypes.csv monster · monster_states.csv desc · monsters.csv lore · maps.csv flavor` | 몬스터 특성·지역 소개 | 세계 안 글·설명 (check_voice 대상) |
| `Test/SelfTest.mlua:58·68·72·73·77·174·185·222·223·224·261·262·293` | 검사 문구 (「보통」·「의뢰」·「-다」) | 개발 검사 로그 — 플레이어에게 안 보임 |
| `Progress/Telemetry.mlua:516` | 기록 저장소를 열지 못했다 | 개발 도구 결과 (메이커 서버 스크립트용 FirstSummary) |
| `tools/check_decisions38.cjs · check_mobile_layout.cjs · gen_data.cjs · build/maps.cjs · sim_*.py` | 「의뢰」·「보통」 | 개발 도구 문구 · 생성 코드 주석 |
| `data/*.csv note 열 · npcs.csv note · 모든 주석` | 「의뢰」·「보통」·「소지품」 | 지시대로 그대로 (화면에 안 보임) |

### 참고 — 바꿨지만 결정이 필요할 수 있는 줄

- `Skill/SkillBook.mlua:1642` 「스킬·능력치가 새로 바뀌었습니다 / 스킬 포인트 N · 능력치 포인트 N를 모두 돌려받았습니다 — …다시 찍으세요」: 옛 저장 이전(NeedRework) 안내 알림이다. 말투만 바꿨다 — 101줄 49·50처럼 알림 자체를 지울지는 기능 변경이라 손대지 않았다.

## 결정 4 — PC Enter 채팅

코드 변경 없음. 엔진 기본 채팅(「/」 키)을 그대로 둔다 — 엔진 ChatComponent에 입력 칸을 여는 API가 없다(101줄 83번 보류와 같은 결론).

## 검사

- `node tools/gen_data.cjs` — GameData.mlua(난이도 이름) · JournalData.mlua(일일 퀘스트·업적 설명) 다시 생성
- `node tools/build.cjs ui` — ui_lint clean · ShadowHUD는 글 변화 없이 id 순서만 바뀌어 되돌림
- `npm test` 12/12 통과 (check_voice 0건 · check_decisions38 26/26 · check_ui_tokens · check_mobile_layout 포함)
- `node tools/check_data.cjs` 표 26개 문제 0건
- 바꾼 mlua 56개 LSP 진단 오류 0 (TOTAL errors 0)

## 메이커에서 눈으로 볼 곳

1. **PC 아래 메뉴 줄** 「인벤토리」 칸(다른 칸과 같은 글자 크기인지) → I 키 창 제목 「인벤토리 · 망자의 장비」 → M 메뉴 창 「인벤토리」 칸과 아래 단축키 줄 「I 인벤토리 …」 한 줄.
2. **오른쪽 위 미니맵 범례** 「출구 · 퀘스트 · 웨이포인트 · NPC」 간격(PC) + 그 아래 퀘스트 추적 뱃지 「새 퀘스트」·「퀘스트 12/24」(뱃지 글 칸 128px · 20 굵게).
3. **일시 그림자 5번 줄** — Lv5 전 캐릭터로 몬스터 첫 처치 → 60초 뒤 왼쪽 아래 안내 줄 「그림자가 흩어졌습니다 · Lv5부터 직접 획득 가능」이 한 줄인지(590px · 24 굵게).
4. **웨이포인트 창** 난이도 단추 「노말」 · 잠긴 「악몽」에 마우스 → 말풍선 「노말에서 액트 4 퀘스트를 마치고 … 쓰러뜨리면 열립니다」(520×104) · 지금 갈 줄 「{웨이포인트} · 퀘스트」.
5. **방 고르기 첫 화면** 카드 「파티플레이」와 두 카드 설명 줄 · 캐릭터 만들기 화면 왼쪽 아래 안내 2줄(420px · 19: 「장비를 입으면 옷과 무기 모습이 바뀝니다」).
6. (여유 되면) J 일지 탭 「일일 퀘스트」·아래 안내 줄 · Q 퀘스트 창 제목 「퀘스트 일지」·「수락 위치 · …」 · 게임 안내 「퀘스트 따라가기」·「노말 → 악몽 → 지옥」 · 상인 거래 창 가방 줄 「누른 칸 모두 판매」 · 봉인 상자 이름표 「봉인 상자 · 열쇠 필요」.

## 바꾼 파일

`Combat/PlayerVitals.mlua`, `Endgame/AbyssSystem.mlua`, `Endgame/DepthDirector.mlua`, `Endgame/DepthGate.mlua`, `Item/ItemData.mlua`, `Item/PlayerBelt.mlua`, `Item/PlayerInventory.mlua`, `Item/PlayerShop.mlua`, `Monster/BossMoves.mlua`, `Monster/MonsterSpawner.mlua`, `Player/PetSystem.mlua`, `Player/PlayerCorpses.mlua`, `Player/PlayerSave.mlua`, `Player/PlayerStats.mlua`, `Player/PlayerTravel.mlua`, `Progress/NightmarePreview.mlua`, `Progress/PlayerJournal.mlua`, `Progress/ProgressionSystem.mlua`, `Quest/PlayerQuest.mlua`, `Shadow/ShadowCommander.mlua`, `Shadow/ShadowOwner.mlua`, `Shadow/SoulExtractor.mlua`, `Skill/SkillBook.mlua`, `Skill/SkillEffects.mlua`, `Social/ChannelSystem.mlua`, `Social/PlayerDuel.mlua`, `Social/PlayerSocial.mlua`, `Social/PlayerTrade.mlua`, `Social/RoomSystem.mlua`, `UI/Hud/HudMain.mlua`, `UI/Hud/HudMap.mlua`, `UI/Hud/UXFeedback.mlua`, `UI/ShadowHUD.mlua`, `UI/Windows/CharSelectWindow.mlua`, `UI/Windows/CharWindow.mlua`, `UI/Windows/GuideWindow.mlua`, `UI/Windows/InventoryWindow.mlua`, `UI/Windows/JournalWindow.mlua`, `UI/Windows/NpcWindow.mlua`, `UI/Windows/QuestWindow.mlua`, `UI/Windows/RankWindow.mlua`, `UI/Windows/RoomWindow.mlua`, `UI/Windows/ShopWindow.mlua`, `UI/Windows/SkillOffer.mlua`, `UI/Windows/SkillWindow.mlua`, `UI/Windows/SocialWindow.mlua`, `UI/Windows/TradeWindow.mlua`, `UI/Windows/WaypointWindow.mlua`, `Undead/UndeadSystem.mlua`, `World/AltarRitual.mlua`, `World/BossRespawn.mlua`, `World/CoopRules.mlua`, `World/CursedChest.mlua`, `World/WarpGate.mlua`, `data/achievements.csv`, `data/dailies.csv`, `data/difficulty.csv`, `tools/build/charselect.cjs`, `tools/build/equipment.cjs`, `tools/build/journal.cjs`, `tools/build/navigation.cjs`, `tools/build/quest-journal.cjs`, `tools/build/roompicker.cjs`, `tools/build/ui.cjs`

