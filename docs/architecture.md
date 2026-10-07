# 코드 구조 (아키텍처)

「잡으면 내편」의 스크립트·데이터·빌드 구조. 새 기능을 넣기 전에 이 문서의 **의존 방향**과 **추가 절차**를 먼저 본다.

## 1. 한눈에 — 웹 개발에 빗대면

| 웹 | 이 프로젝트 | 위치 |
| --- | --- | --- |
| DB 스키마·시드 | 콘텐츠 표 (몬스터·아이템·룬·스킬·맵·상점…) | `data/*.csv` |
| ORM 모델 (생성 코드) | CSV에서 생성한 데이터 Logic | `RootDesk/MyDesk/Data/*.mlua` (직접 수정 금지) |
| 상수·유틸 모듈 | `_GameConst`, `_Util` | `Common/` |
| 이벤트 버스 / pub-sub | `_GameEvents` | `Common/GameEvents.mlua` |
| 도메인 모델 (엔티티별 상태+규칙) | 컴포넌트 (`PlayerStats`, `Monster`, `ShadowOwner`…) | `Player/` `Monster/` `Shadow/` `Item/` … |
| 서비스 / 이벤트 핸들러 | 시스템 Logic (`RewardSystem`, `ShadowSystem`, `QuestSystem`…) | `Progress/` `Shadow/` `Quest/` … |
| API 엔드포인트 | 컴포넌트의 `Request*` 메서드 (`@ExecSpace("Server")`, `senderUserId` 검증) | 각 컴포넌트 |
| 프런트 공통 컴포넌트 | `_UIKit` (경로 캐시·버튼 연결·창 열고 닫기) | `UI/Core/UIKit.mlua` |
| 레이아웃 (상시) | `HudMain` (오브·경험치·스킬바·벨트·대상·파티) | `UI/Hud/` |
| 페이지 / 모달 | 창 컨트롤러 9개 (능력치·소지품·스킬·퀘스트·사교·거래·웨이포인트·랭킹·NPC) | `UI/Windows/` |
| 마크업 | `.ui` 파일 (빌드가 생성) | `ui/` |
| 빌드 스크립트 (webpack 등) | 데이터 생성 + 모델·맵·UI 빌드 | `tools/build.cjs`, `tools/build/` |
| 린트·테스트 | 오프라인 검사 + 메이커 안 자가 진단 | `tools/test.cjs`, `Test/SelfTest.mlua` |

## 2. 의존 방향 (위가 아래를 부른다, 반대는 금지)

```
UI (UI/Hud, UI/Windows, UI/ShadowHUD)        클라이언트. 컴포넌트 @Sync 값을 읽고 Request*만 부른다
  ↓
시스템 Logic (RewardSystem, ShadowSystem,     서버. GameEvents를 구독해 여러 컴포넌트를 조율
  QuestSystem, ProgressionSystem, LootSystem,
  PartySystem, RankingSystem …)
  ↓                ↑ Emit
컴포넌트 (Player*, Monster*, Shadow*, Skill*,  엔티티 하나의 상태와 규칙
  World/*, Endgame/*)
  ↓
Common (_GameConst, _Util, _GameEvents) · Data (_GameData, _ItemTables, _SkillData, _QuestData, _WaypointData)
```

- **컴포넌트끼리 같은 엔티티 안**에서는 `GetComponent`로 직접 부른다 (예: `PlayerInventory` → `PlayerStats:ApplyEquipmentMods`).
- **다른 시스템에 알릴 일**은 직접 부르지 않고 이벤트로 낸다. 몬스터는 자기가 죽었다는 것만 알리고, 경험치·드롭·혼·의뢰 진행은 각 시스템이 듣는다.
- UI는 서버 코드를 부르지 않는다. 값은 `@Sync`/`@TargetUserSync` 속성으로 읽고, 동작은 `Request*`(Server RPC)로 보낸다.

### 이벤트 (`_GameEvents`, 서버)

| 이벤트 | 낸 곳 | 듣는 곳 | payload |
| --- | --- | --- | --- |
| `MonsterKilled` | `Monster:Die` | RewardSystem(경험치·드롭), ShadowSystem(혼), QuestSystem, ProgressionSystem | monster, player, sourceId, grade, level, map |
| `ShadowExtracted` | `SoulExtractor` | QuestSystem | player, sourceId, grade |
| `QuestMarkerReached` | `QuestMarker` | QuestSystem | player, markerId |
| `PlayerDied` | `PlayerVitals` | (확장용) | player, map |
| `UndeadRaised` | `UndeadSystem` | QuestSystem | player, kind |
| `DepthDoorUsed` | `DepthGate` | DepthDirector (같은 맵만) | player, action, map |

구독은 Logic의 `OnBeginPlay`(서버)에서, 키는 구독자 이름. 한 구독자의 오류는 `pcall`로 격리되어 다른 구독자를 막지 않는다 (`SelfTest`가 확인).

## 3. 폴더

| 폴더 | 역할 | 주요 파일 |
| --- | --- | --- |
| `Common/` | 상수·공용 함수·이벤트 버스 | `GameConst`(맵 이름·모델 id·효과음·난이도 규칙), `Util`(Notify·AfterSpawn·근처 플레이어/몬스터/NPC), `GameEvents` |
| `Data/` | **생성 파일**. CSV → Logic 표 | `GameData`, `ItemTables`, `SkillData`, `QuestData`, `WaypointData` |
| `Player/` | 캐릭터 상태·이동·저장 | `PlayerStats`, `PlayerTravel`, `PlayerCorpses`, `PlayerSave`(섹션 표 + 버전 이전) |
| `Combat/` | 플레이어 공격·피격·사망 | `PlayerAttack`, `PlayerVitals`(D2 사망 규칙) |
| `Monster/` | 몬스터 | `Monster`(파사드: 생명·레벨·사망) + `MonsterStatus`(저주·독·냉각) + `MonsterTraits`(저항·정예 수식어·색) + `MonsterAttack` / `MonsterBehavior` / `BossPattern` / `MonsterSpawner` |
| `Shadow/` | 그림자 군단 | `ShadowOwner`(보관함·저장) / `ShadowCommander`(소환·회수·대형) / `SoulExtractor`(추출) / `ShadowUnit` / `ShadowSystem`(처치 → 혼) / `ShadowConfig` |
| `Undead/` | D2식 언데드 | `UndeadSystem`(해골 전사·마법사·되살림, 혼 소모, D2 수 규칙, 맵 이동 따라옴) |
| `Skill/` | 스킬 | `SkillBook`(습득·슬롯·시전 조건) / `SkillEffects`(효과 실행) |
| `Item/` | 아이템 | `ItemData`(규칙: 생성·해석·룬워드) / `PlayerInventory`(가방·장비) / `PlayerBelt`(물약) / `PlayerShop` / `LootSystem`·`LootDrop` |
| `Quest/` `Progress/` | 의뢰·보상·진행 | `PlayerQuest`, `QuestSystem`, `QuestMarker` / `RewardSystem`, `ProgressionSystem` |
| `Social/` | 멀티 | `PartySystem`, `PlayerSocial`(요청·수락), `PlayerDuel`, `PlayerTrade` |
| `Endgame/` | 심도 던전·랭킹 | `DepthDirector`, `DepthGate`, `RankingSystem` |
| `World/` `Ambience/` `Input/` | 맵 오브젝트·분위기·조작 | `WarpGate`, `Waypoint`, `WorldNPC`, `PlayerCorpse` / `DarkVision`, `MapAmbience`, `SoundDirector`, `TorchLight` / `ClickControl` |
| `UI/` | 화면 | `Core/UIKit`, `Hud/HudMain`, `Windows/*Window`, `ShadowHUD` |
| `Test/` | 런타임 자가 진단 | `SelfTest` |

## 4. 데이터 파이프라인

```
data/*.csv ──gen_data──▶ RootDesk/MyDesk/Data/*.mlua   (런타임 표)
     │
     └──build──▶ Models/Region1·Objects·NPC (*.model)  (monsters·bosses·objects·npcs.csv)
               ▶ map/*.map                              (maps.csv + difficulty.csv → 보통 10 + 악몽·지옥 18)
               ▶ Global/DefaultPlayer                   (tools/build/player.cjs의 컴포넌트 목록)
               ▶ ui/GameHUD, ShadowHUD 문구             (tools/build/ui.cjs)
```

| CSV | 쓰는 곳 |
| --- | --- |
| `config` | `_GameData.<키>` — 곡선·확률·심도·사망 규칙 등 단일 수치 |
| `difficulty` | `_GameData:GetDifficulty` → `_GameConst`(맵 접미사·이름·저항 페널티·경험치 손실), 맵 빌드(어둠 배율·레벨 가산) |
| `monsters` `bosses` | 몬스터 모델 빌드, `_GameData`(이름·심도 출현) |
| `maps` | 맵 빌드(포털 연결·화로·스포너·웨이포인트·NPC·고정 몬스터·제단·BGM) |
| `objects` `npcs` | 오브젝트·NPC 모델 빌드 |
| `item_*` `runes` `runewords` `stats` | `_ItemTables` (`ItemData`가 규칙 적용) |
| `skills` `quests` `waypoints` `shop` `sounds` | `_SkillData` `_QuestData` `_WaypointData` `_GameData` |
| `monster_ranks` | 등급별 추출 확률·체력/피해 배율 (`_GameData:GetRank`, 시뮬레이터도 같은 값) |
| `variants` | 변종 우두머리·고유 능력 (`_GameData:GetVariant`) |
| `item_sets` `item_set_pieces` | 세트 (`_ItemTables.Sets`·`SetPieces`) |
| `regions` | 기획 표 (게임 미사용) |

`monsters.csv`의 `def` 열은 시뮬레이터(`tools/sim.py`) 전용이다. 표 데이터 Logic은 MSW에서 `OnInitialize`에 채운 표가 남지 않으므로 첫 조회 때 `Ensure()`로 채운다.

## 5. 명령

```bash
npm run build        # node tools/build.cjs — 데이터 생성 + 모델·플레이어·맵·UI (몇 번 돌려도 같은 결과)
npm test             # node tools/test.cjs — 오프라인 검사 5종
npm run test:full    # + 빌드 멱등성 (빌드를 두 번 돌려 비교)
npm run sim -- exp   # 밸런스 시뮬레이터
```

빌드 후 메이커: **플레이 중지 → refresh 2번**(새 모델·맵은 두 번째에 등록) → 플레이 → 로그에서 `[SelfTest] 통과 n / 실패 0` 확인.

### 오프라인 검사 (`npm test`)

| 검사 | 막는 것 |
| --- | --- |
| 생성 데이터 최신 | CSV만 고치고 생성을 잊음 |
| `check_data` | 표 사이 참조 끊김 (룬워드 → 없는 룬, 의뢰 → 없는 몬스터, 맵 → 없는 BGM 등), id 중복, 형식 오류 |
| `check_scripts` | 없는 Logic·메서드·속성 호출, 인자 개수, `"script.X"` 오타, ServerOnly ↔ ClientOnly 엇갈린 호출 (메이커 LSP는 새 스크립트를 refresh 전까지 모른다) |
| `check_assets` | 지운 스크립트를 붙인 모델·맵, 없는 모델 배치, 포털 → 없는 맵, 웨이포인트·스포너·BGM 참조 |
| 검사기 자가 테스트 | 검사기 자체의 회귀 (`tests/fixtures`의 `-- EXPECT` 줄을 정확히 잡는가) |

## 6. 추가 절차

| 하고 싶은 것 | 고칠 곳 |
| --- | --- |
| 몬스터 추가 | `monsters.csv` 한 줄 (RUID는 msw-search로) → 쓰는 맵의 `maps.csv` spawns/fixed → `npm run build` |
| 맵 추가 | `maps.csv` 한 줄 (order로 포털 순서) → 빌드 → 메이커에서 타일 칠하기 |
| 아이템 옵션 추가 | `stats.csv`(이름) + `item_affixes.csv` → `PlayerStats:ApplyEquipmentMods`에서 키 반영 |
| 룬·룬워드 | `runes.csv` / `runewords.csv` |
| 상점 품목·가격 | `shop.csv` (새 키면 `PlayerShop:Buy`·`NpcWindow`도) |
| 창 추가 | `tools/build/ui.cjs`에 레이아웃 → `UI/Windows/XxxWindow.mlua` (`_UIKit:RegisterWindow` + 0.2초 폴링, 열렸을 때만 그림, `RenderKey`로 변경 시에만 갱신) |
| 시스템 간 알림 | `GameEvents` 상단 주석에 이벤트 정의 → 낸 곳에서 `Emit`, 듣는 곳 Logic `OnBeginPlay`에서 `Subscribe` |
| 플레이어 컴포넌트 | 스크립트 작성 → `tools/build/player.cjs` 목록 → 저장이 필요하면 `PlayerSave:Sections()`에 등록 |

## 7. 규약

- **서버 권한**: 상태 변경은 서버. 클라이언트 요청은 `Request*` + `if senderUserId ~= self.Entity.PlayerComponent.UserId then return end`.
- **이름**: Logic은 `_파일이름`. 컴포넌트 메서드 중 서버 진입점은 `Request*`, 내부 처리는 동사(`Deploy`, `Buy`).
- **수치**: 밸런스 수치는 CSV로. 스크립트에는 표시 문구와 구조적 상수만 둔다.
- **UI**: 경로 문자열은 `_UIKit`으로. `.ui`는 빌더(`tools/build/ui.cjs`)로만 바꾼다 (직접 편집 금지).
- **스폰 직후 컴포넌트**: `_Util:AfterSpawn(e, "script.X", onReady)` — 같은 프레임에 컴포넌트가 없을 수 있다.
- **주석**: 메서드 설명은 본문 첫 줄 주석.
- **저장**: `PlayerSave` 섹션(Char/Inv/Shadow). 형식이 바뀌면 `Version`을 올리고 `Migrate`에 이전 규칙 추가.

## 8. MSW 함정 (실행하며 찾은 것)

- Logic 타입은 메서드 반환형으로 못 쓴다 ("type is unavailable") → `any`.
- `Shape`는 메서드 매개변수로 못 쓴다 (LEA-4002).
- 엔티티당 `AttackComponent` 하나 (LWA-3048).
- Logic의 표 속성을 `OnInitialize`에서 채우면 사라진다 → 첫 조회 때 `Ensure()`.
- `PlayerComponent.Hp`는 정수. 이름은 `PlayerComponent.Nickname`.
- Client RPC는 호출할 때 마지막 인자로 userId (선언에는 넣지 않는다).
- 맵 파일의 인스턴스 플래그 필드는 `IsInstanceMap` (스크립트 API는 `InstanceMap`).
- 새 스크립트는 refresh 전까지 LSP가 "type not found" — 오프라인 `check_scripts`로 대신 확인.
- **다중 반환 선언**(`method integer, integer F()`)이 있으면 메이커가 그 스크립트 전체를 조용히 등록하지 않는다 (codeblock이 안 생기고 `_X`가 nil, 컴포넌트면 모델에서 빠진다). `table`로 돌려준다 — `check_scripts`가 막는다.
- 스크립트가 한 번 등록에 실패한 동안 메이커가 읽은 모델에서는 그 컴포넌트가 빠진 채로 캐시된다. 고친 뒤에도 그대로면 모델 파일을 다시 쓰거나(빌드) 수정 시각을 바꿔 refresh.
- **플레이어 피격 생명 차감은 엔진이 한다** (HitEvent마다 `PlayerComponent.Hp`를 깎고, 0 이하면 자체 사망·제자리 부활). 스크립트에서 또 깎으면 두 배 피해. 무적·사망 중 차단은 공격 쪽 `IsAttackTarget`(PlayerVitals:CanBeHit)으로, 사망 판정은 생명 폴링(PlayerVitals:CheckDeath)으로 한다 — 엔진 차감이 우리 핸들러보다 늦게 올 수 있다.
- 지운 엔티티의 컴포넌트 속성은 nil이 된다 → `Destroy` 전에 필요한 값을 꺼내 둔다.
- 사람이 없는 맵에는 스폰할 수 없다 → 저장된 시체 같은 것은 주인이 그 맵에 들어왔을 때 만든다 (PlayerCorpses:EnsureSpawned).
- 지역 변수 이름 `member`는 쓸 수 없다 (빌드 오류 LEA-1001).
- 메이커 MCP의 키 입력(`maker_keyboard_input`)은 게임의 InputService KeyDownEvent로 오지 않을 수 있다 → 단축키 검증은 직접 누르거나 `maker_execute_script`로 `_UIKit:Toggle` 호출.
- 한글은 바이트로 자르면 깨진다 → `_UIKit:Clip` (UTF-8 글자 단위).
- UI 그룹 순서가 같으면 겹침이 불안정 → 창이 있는 GameHUD는 GroupOrder 5.
- `.mlua`를 옮길 때 `.codeblock`도 같이 `git mv`하면 스크립트가 유지된다 (codeblock에는 경로가 없다). 지운 스크립트의 codeblock은 refresh가 정리한다.
