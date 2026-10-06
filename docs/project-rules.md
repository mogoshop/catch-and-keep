# 잡으면 내편 — 프로젝트 고유 규칙

> MSW 공통 규칙(스킬 로딩, 빌더, 검증 절차)은 저장소 루트 `AGENTS.md`가 우선한다. 이 문서는 게임 설계에서 나온 추가 규칙만 다룬다.

메이플스토리 월드(MSW) 월드 프로젝트. 네크로맨서 + 그림자 군단(소환수) 중심 게임이다.
설계 문서 원본은 `docs/`에 있다. 이 파일은 AI가 mLua 코드를 쓸 때 따를 규칙이다.

## 작업 전 확인

1. `README.md`와 `docs/` 설계 문서를 먼저 읽는다.
2. 현재 단계를 확인한다. 지금은 **Phase 0 (룬 없이 코어 루프)** 이다. Phase 0 범위를 넘는 룬·룬워드 구현은 사용자가 요청할 때까지 하지 않는다. (`rune-system-draft.md` 6장)
3. `git status --short --branch`로 미커밋 변경을 확인한다.
4. 새 mLua 코드를 쓰기 전에 이 프로젝트에 이미 있는 `.mlua` 파일을 읽고 이름·구조 관례를 맞춘다.

## 절대 규칙

- **메이커가 열려 있는 동안 `.map`, `.model`, `.ui` 등 JSON 계열 파일을 편집하지 않는다.** 덮어쓰기 충돌로 파일이 깨질 수 있다. 맵·엔티티 구성은 사용자가 메이커에서 직접 하고, AI는 `.mlua`만 수정한다. 불가피하면 먼저 사용자에게 메이커를 닫아 달라고 요청하고 git 커밋으로 백업선부터 만든다.
- **존재가 확인되지 않은 API를 추측해서 쓰지 않는다.** 아래 "확인된 문법"에 없는 서비스·메서드·이벤트는 공식 API 레퍼런스(https://maplestoryworlds-creators.nexon.com/en/apiReference)를 사용자가 확인해 주거나, 프로젝트 안의 기존 코드에서 사용례를 찾은 뒤에만 쓴다. 불확실하면 코드에 `-- TODO(확인 필요): ...`로 남기고 보고한다.
- **스탯·확률·재화 계산은 서버에서만 한다.** 클라이언트는 표시와 입력 전달만 담당한다. (치트 방지)
- 하드 상한은 `StatCaps` 한 곳에서만 정의한다. (`rune-system-draft.md` 5장) 배치 한도 8, PvP 5를 코드 곳곳에 하드코딩하지 않는다.
- 커밋 메시지는 한국어로 쓴다. Conventional Commit 접두사(`feat:`, `fix:` 등)는 유지해도 되지만 제목과 설명은 한국어다.
- 새 작업 브랜치나 worktree는 사용자 요청 없이 만들지 않는다.

## 확인된 mLua 문법

아래는 넥슨 공개 예제 데이터셋(`msw-ai-tf/maplestory-worlds-creator-code-instruct`, CC BY 4.0) 영어판 979건을 분석해 확인한 것이다.

### 스크립트 구조

```lua
@Component
script ShadowUnit extends Component
    -- 속성
    property number Hp = 100
    property Entity Owner = nil
    property string Path = "/maps/map01/Something"   -- 경로 문자열로 엔티티 참조

    -- 동기화 속성 (서버가 쓰고 클라이언트가 받음)
    @Sync
    property number Power = 100

    @ExecSpace("ServerOnly")
    method void OnBeginPlay()
    end

    @ExecSpace("ClientOnly")
    method void ShowEffect()
    end

    @EventSender("Self")
    handler HandleTriggerEnterEvent(TriggerEnterEvent event)
    end
end
```

- 예제 979건이 전부 `@Component` + `script <이름> extends Component` 형태다. 메서드·핸들러·속성은 스크립트 블록 안에 둔다.
- 블록은 `end`로 닫는다. 메서드 반환 타입을 선언한다 (`method void`, `method number` 등).
- 속성 타입은 `number`, `integer`, `boolean`, `string`, `Entity`, `Vector2`, `Vector3` 등을 쓰는 것이 확인됐다.
- 속성 기본값 없이 선언할 때는 `property Entity target = nil` 형태로 쓴다.
- 접근: `self.Entity`, `self:메서드()`, `self.속성`. 컴포넌트는 `entity.TransformComponent` 같은 프로퍼티로 접근한다.

### 실행 공간 (ExecSpace)

| 데코레이터 | 용도 | 확인 |
| --- | --- | --- |
| `@ExecSpace("ServerOnly")` | 서버에서만 실행. 로직·스탯·확률·저장 | 확인 (예제 693건) |
| `@ExecSpace("ClientOnly")` | 클라이언트에서만 실행. UI·입력·이펙트 | 확인 (예제 264건) |
| `@ExecSpace("Server")`, `"Client"`, `"Multicast"` | 서버/클라 호출 양방향 | **예제에서 미확인.** 문서에 `"ClientOnly"` 대신 `"Client"` 언급 1건만 있음. 쓰기 전에 사용자 확인 필요 |

- 데코레이터를 안 붙인 메서드의 실행 위치는 이 데이터셋만으로 확정할 수 없다. 서버·클라이언트가 중요한 메서드에는 항상 명시한다.
- `self:IsServer()`, `self:IsClient()`로 현재 실행 위치를 분기하는 사례가 있다.
- 클라이언트 → 서버 요청을 어떻게 전달하는지는 예제에서 확정하지 못했다. 이 부분은 구현 전에 메이커에서 사용자와 함께 확인한다. (미확인 목록 참고)

### 이벤트

```lua
@EventSender("Self")
handler HandleTriggerEnterEvent(TriggerEnterEvent event)
    local body = event.TriggerBodyEntity
end

@ExecSpace("ClientOnly")
@EventSender("Service", "InputService")
handler HandleKeyDownEvent(KeyDownEvent event)
    local key = event.key
    if key == KeyboardKey.F1 then ... end
end
```

- 자신의 엔티티 이벤트는 `@EventSender("Self")`, 서비스 이벤트는 `@EventSender("Service", "<서비스명>")`이다.
- 확인된 서비스명: `InputService`, `UserService`, `WorldInstanceService`, `RoomService`, `RateLimitService`, `EntityService`, `EditorService`, `ResourceService`
- 핸들러 이름은 `Handle<이벤트명>`으로 짓는 것이 관례다.

### 생명주기 메서드

예제에서 확인된 이름: `OnBeginPlay` (가장 흔함), `OnUpdate`, `OnEndPlay`, `OnInitialize`, `OnSyncProperty`, `OnMapEnter(Entity enteredMap)`.
`OnUpdate`는 매 프레임 호출되므로 무거운 연산을 넣지 않는다. 그림자 AI는 `OnUpdate` 남용을 피하고 타이머 기반 틱을 쓴다.

### 서비스와 자주 쓰는 API (예제에서 확인)

| 용도 | 호출 |
| --- | --- |
| 모델로 엔티티 생성 | `_SpawnService:SpawnByModelId("model://이름", "엔티티이름", Vector3(x,y,z), 부모엔티티)` |
| 기존 엔티티 복제 | `_SpawnService:SpawnByEntity(entity, "이름", Vector3(...))` |
| 엔티티 삭제 | `entity:Destroy()` |
| 엔티티 활성/비활성 | `entity:SetEnable(true/false)` |
| 경로로 엔티티 찾기 | `_EntityService:GetEntityByPath(path)` |
| 컴포넌트 추가 | `entity:AddComponent(OverlayLightComponent)` |
| 유저 엔티티 | `_UserService:GetUserEntityByUserId(userId)`, `_UserService.LocalPlayer` |
| 1회 타이머 | `_TimerService:SetTimerOnce(function() ... end, 초)` |
| 반복 타이머 | `local id = _TimerService:SetTimerRepeat(함수, 초)` / `_TimerService:ClearTimer(id)` |
| 난수 | `_UtilLogic:RandomIntegerRange(1, 5)`, `_UtilLogic:RandomDouble()` |
| 데이터 저장(서버 전용) | `_DataStorageService:GetGlobalDataStorage("이름")` → `ds:SetAsync("키", 문자열값, nil)` |
| 충돌 | `_CollisionService:GetSimulator(entity)` → `simulator:Raycast(CollisionGroups.X, origin, direction, distance)` |
| 로그 | `log("메시지")` |

- 위치는 `entity.TransformComponent.WorldPosition` (Vector3)이다.
- `DataStorage`는 값을 **문자열**로 저장한다. 숫자는 `tostring()`으로 변환한다. 데이터 스토리지는 서버에서만 접근 가능하다.
- 타이머 콜백 안에서는 엔티티가 파괴됐을 수 있으므로 경로로 다시 조회하거나 `nil` 검사를 한다.
- 테이블 생성은 `table.create(n)`이 쓰였다. (일반 Lua 테이블 `{}`도 같이 쓰인다.)
- 타입 힌트 주석: `---@type OverlayLightComponent`

### 동기화 규칙

- `property`에 `@Sync`가 없으면 **서버에만 존재**하고 클라이언트로 전송되지 않는다.
- 클라이언트가 읽어야 하는 값(HP바, 개수 표시 등)에만 `@Sync`를 붙인다. 불필요한 `@Sync`는 패킷 낭비다.
- 일부 클라이언트에만 동기화하는 `@TargetUserSync`도 존재한다. (사용례 1건, 쓰기 전에 확인)
- `@Sync` 속성이 바뀌면 클라이언트에서 `OnSyncProperty` 콜백이 호출된다.

## 미확인 항목 (구현 전에 사용자와 확인)

2026-10-06에 월드 폴더의 `Environment/NativeScripts/*.d.mlua`(메이커 생성 API 선언)로 1~4번의 **선언**을 확인했다. 상세는 `phase0-core-loop-design.md` 10장. 선언 파일에 있는 API는 써도 되지만, 런타임 동작은 메이커에서 확인하기 전까지 "미실행"으로 보고한다.

1. 클라이언트 → 서버 호출: `@ExecSpace("Server")`, `@ExecSpace("Client")` 선언 확인. 호출자 식별 방법은 런타임 확인 필요
2. `@Logic`, `@Event` 문법 선언 확인. `@Struct`는 미확인
3. 처치 이벤트 `DeadEvent`(처치자 정보 없음), 피격 `HitEvent.AttackerEntity`, 추적 AI `AIChaseComponent` 선언 확인
4. 유저별 저장 `_DataStorageService:GetUserDataStorage(userId)` 선언 확인
5. 아이템·인벤토리 UI를 어디까지 기본 컴포넌트로 쓸 수 있는지 — 미확인
6. 외부에서 만든 `.mlua` 파일을 메이커가 인식하는 방식 — 미확인

API를 새로 쓸 때는 먼저 월드 폴더 `Environment/NativeScripts/`에서 선언을 찾는다.

## 코드 작성 관례

- 스크립트 이름은 PascalCase, 한 파일에 하나의 스크립트.
- 서버 로직 스크립트와 클라이언트 UI 스크립트를 파일 단위로 분리한다. 한 컴포넌트에 `ServerOnly`와 `ClientOnly`를 섞어야 할 때는 주석으로 구역을 나눈다.
- 설계 수치(확률, 배율, 쿨다운, 상한)는 데이터 테이블 한 곳에 모으고 로직 안에 매직 넘버를 넣지 않는다.
- 주석은 한국어로 쓴다. 의도와 서버/클라이언트 구분을 적고, 코드가 이미 말하는 내용은 반복하지 않는다.
- 신규 엔티티 생성(`Spawn`)은 서버 부하와 직결된다. 이 게임은 맵당 소환수 최대 32(8 × 4명)를 전제로 한다. 엔티티를 늘리는 설계가 필요하면 먼저 사용자에게 알린다.

## 테스트와 검증

- AI는 메이커의 플레이 버튼을 누르거나 런타임 로그를 직접 읽지 못한다. MCP가 연결돼 그 기능이 확인되기 전까지는 사용자가 플레이 테스트를 하고 오류 로그를 붙여 준다.
- 수정 후 보고할 때는 **정적으로 검증한 것**과 **메이커에서 실제로 돌려 확인한 것**을 구분한다. 후자가 없으면 "미실행"이라고 명시한다.
- mLua 문법은 VS Code mLua 확장의 경고로 일부 확인된다. 사용자 환경에서 확장이 켜져 있으면 경고 결과를 요청한다.

## 문서 위치

| 경로 | 내용 |
| --- | --- |
| `README.md` | 프로젝트 개요와 단계 |
| `design/00-index.md` | 기획 요소 전체 체크리스트와 01~12 설계 문서 인덱스 |
| `rune-system-draft.md` | 혼각 룬 & 룬워드 설계 v0.2 |
| `phase0-core-loop-design.md` | Phase 0 코어 루프 설계 |
| `docs/setup-checklist.md` | 설치·연결 체크리스트 |
| `.mcp.json.example`, `.env.example` | MCP 연결 템플릿 |
