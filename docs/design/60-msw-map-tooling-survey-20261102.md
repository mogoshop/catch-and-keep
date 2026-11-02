# 60 MSW 맵 제작 수단 조사 — 메이커가 주는 것 · 우리가 써 온 방식 · 기획 59 방안별 엔진 요구 (2026-11-02 · 조사 레인)

> 기획 59(맵 미술 방법 A~F) 결정 전 **사실 조사**. 게임 파일 변경 없음. 메이커(`maker_*`)는 부르지 않았다(도구 설명 글만 참고).
> 출처 표기: `파일:줄` = 저장소 파일, 「문서: 제목 › 소제목」 = msw-mcp `mlua_document_retriever` 검색 결과(MSW 공식 가이드), `.d.mlua` = `Environment/NativeScripts/` 엔진 API 정의.
> 확인 못 한 것은 **미확인**으로 적는다.
> 표·수치 원본: `docs/evidence/2026-11-02-msw-map-tooling/` (`mapstats.json` 맵 211파일 통계 · `mapstats.cjs` MapBuilder 읽기 스크립트 · `resource-search.txt` 리소스 검색 기록).

---

## 0. 한눈 요약 — 있다/없다

| 기능 | 엔진에 있나 | 근거 | 우리 사용 |
|---|---|---|---|
| **오토타일(테두리 자동 연결 · rule tile)** | **RectTile에는 없음** (MapleTile 전용 MapleRuleTile만) | `tile.md` §TileMapMode 표 「MapleTile = MapleRuleTile」 · RectTile 타일은 `Id·Name·IsCollidable`뿐(`AshCampTiles.tileset` 2000칸 전부 이 3필드) · 공식 「RectTile Creation › Connection Tiles」는 전이 12장을 **손으로 그려** 놓으라고 함 | 안 씀. 전이는 9조각 테두리·띠·45° 조각을 생성기가 엔티티로 깐다 |
| **Y 정렬(아래일수록 앞)** | **없음** (SortingLayer → OrderInLayer → Z 3단만) | 「Map Layer › Layer Priority Rules」 · `platform.md` §6 · `.d.mlua` 전체에 sort 축 속성 없음(검색 0건) | 정적 장식끼리는 빌더가 y로 z를 매김(`lib.cjs:958`). 캐릭터↔장식은 **-top 앞층(Default/5)** 으로 흉내 |
| 맵 레이어로 앞뒤 바꾸기 | **있음** — 아바타는 **밟고 선 타일의 맵 레이어**로 그려짐 | 「Map Layer › Relationship Between Map Layer and Player Avatar › Example 2」 | 안 씀 (66장 모두 레이어 `Layer1` 하나) |
| **그림자** | 캐릭터 발밑 타원만(`KinematicbodyComponent.EnableShadow`) · 셰이더 `DropShadow` · 조명은 **그림자를 드리우지 않음**(Light에 그림자 속성 0) | `KinematicbodyComponent.d.mlua:23,47-62` · `ShaderType.d.mlua:124` · `LightComponent.d.mlua` 전체 | 발밑 타원은 픽셀 그림으로 대체(`MotionSmoother.mlua:648-662`), NPC 발밑은 그림(`maps.cjs:157`), 벽 그늘은 검게 칠한 조각, 프롭 그림자는 그림 안 |
| **2D 조명** | **있음** — `LightComponent`(Spot·Freeform·Global·Sprite) + `_OverlayLightService` | `LightComponent.d.mlua:1-88` · `LightType.d.mlua` · `OverlayLightService.d.mlua:9-54` | DarkVision이 OverlayLight Global 1개 + 붙인 Spot들(`DarkVision.mlua:183,522`) · 맵 파일의 LightComponent 0개 |
| **머티리얼/후처리** | **있음** — 셰이더 65종(외곽선·블러·픽셀화·블렌드·비네트 등) · 카메라 화면 셰이더 | `ShaderType.d.mlua:6-134` · `material.md` §5 | 맵 그림엔 안 씀(색 곱하기 `Color`만) |
| **반복 그리기(Tiled)·9분할(Sliced)** | **있음** — `SpriteRendererComponent.DrawMode` Simple/Sliced/Tiled + `TiledSize` | `SpriteRendererComponent.d.mlua:18,78` · `SpriteDrawMode.d.mlua` | 핵심 수단: 맵 스프라이트 121,863개 중 **104,249개(86%)가 Tiled** |
| **큰 그림 한 장 상한** | **미확인** (문서에 없음). 관련 수치만: 아틀라스 자르기 2048², 스켈레톤 PNG 4096², 실행 중 업로드 3MB | 「Utilizing Atlases › The Atlas Unpacker」 · 「Use Skeleton Resource › Notes」 · 「Screenshots and Dynamic Sprites › Learn more」 | 선례 2000×1000 PNG **3.1MB** 업로드 성공(`scene-plate-wasteland/ruid-table.csv`) |
| **원작 메이플 맵 가져오기** | **있음** — 9자리 맵 ID로 지금 맵에 가져옴(메뉴 Window › MapleStory Map) | `maker_import_maplestory_map` 도구 설명 · 「Creating the Forest of Patience › Placing Tiles › Learn more」 | 안 씀. 원작 맵은 횡스크롤(발판)이라 **탑뷰에 그대로 쓸 수 있는지는 미확인**(아래 §1-8) |
| **탑뷰 타일셋·절벽·프롭 팩** | **팩(resource_pack)은 없음** — 검색 색인의 팩은 mob/npc/skill/item뿐 | `random --resource-type resource_pack` 200건 = npc 107·mob 69·skill 22·item 2 (`resource-search.txt`) | 원작 맵 오브젝트는 **낱장 sprite**로 있음(`map/obj/*.img` · 횡스크롤 시점) — 우리는 묘비 등 34장만 씀 |

---

## 1. MSW 메이커가 주는 맵 제작 수단

### 1-1. 타일맵 (`MapComponent` · `RectTileMapComponent`)

**맵 방식.** `MapComponent.TileMapMode` = `MapleTile 0` / `RectTile 1` / `SideViewRectTile 2` (`MapComponent.d.mlua:44` · `TileMapMode.d.mlua`). 우리 211파일 전부 `1`(RectTile · 탑뷰 · `KinematicbodyComponent`) — `mapstats.json` modes `{"1": 211}`. 맵 경계는 `LeftBottom`/`RightTop`/`UseCustomBound`(`MapComponent.d.mlua:35-49`).

**`RectTileMapComponent` 속성 전부** (`RectTileMapComponent.d.mlua`):

| 속성 | 줄 | 뜻 |
|---|---|---|
| `GridSize = Vector2(1,1)` | 8 | 칸 크기(월드 단위). 공식 문서는 0.5×0.5 예시도 보여 줌(「Utilizing RectTileMap › Setting Tile Grid Size」) |
| `IgnoreMapLayerCheck` | 12 | 맵 레이어 이름 자동 치환 끄기 |
| `IsOddGridPosition` | 16 | 격자 기준점에서 반 칸 비켜 두기 |
| `OrderInLayer` / `SortingLayer = "Default"` | 21 / 29 | 타일 그림 그리기 순서 |
| `PhysicsInteractable` | 25 | 물리 강체(PhysicsRigidbody)와 충돌 |
| `TileCount` (읽기 전용) | 33 | |
| `TileSetRUID` | 38 | `tileset://…` |

**메서드**: `SetTile`·`BoxFill`(번호 또는 이름) · `RemoveTile`·`BoxRemove`·`Clear`·`Reset` · `GetTile`·`GetAllTilePositions` · `ToCellPosition`↔`ToWorldPosition` (`:42-110`). 실행 중 타일 바꾸기가 가능하다(동적 타일).

**타일셋(`.tileset`).** 한 칸 = `{Id, Name, IsCollidable}`(`tile.md` §TileDataSet · 우리 `RootDesk/MyDesk/AshCampTiles.tileset` 2000칸 · 키 3개뿐 실측). 칸마다 스프라이트를 바꾸는 건 **메이커 타일셋 팔레트**에서(「Utilizing RectTileMap › Setting Tile Properties › Editing Sprites」). 타일을 넣는 길은 ① 리소스 저장소 그림 ② 워크스페이스 그림 ③ 아틀라스 자르기 — 2048×2048 한 장을 최대 256조각(「Utilizing Atlases › The Atlas Unpacker」). 레이어마다 다른 타일셋을 쓰라는 권고(「Utilizing RectTileMap › Applying Tile Set by Layer」).
- 번호 주의: `RectTileInfo.Index` 설명은 「1부터 시작」(`RectTileInfo.d.mlua:6`)인데 `tile.md`는 JSON·`Index`가 0부터, `SetTile` 숫자 인자만 1부터라고 적는다. **서로 다르다 — 어느 쪽이 맞는지 미확인**(우리 빌더는 JSON에 265·266·269를 직접 쓰고 실행 중 `SetTile`은 안 씀).

**충돌 칸.** 타일 한 칸의 `IsCollidable`(`RectTileInfo.d.mlua:12` — 「true면 플레이어가 못 지나간다」) = 메이커의 「Movable 편집」(「…› Editing Movable Tiles」). 몸 쪽은 `KinematicbodyComponent.EnableTileCollision`(`:28`). 이벤트 `RectTileEnter/Leave/CollisionBegin/CollisionEnd`(`platform-rect.md` §4).

**타일 크기(픽셀).** 공식 권장 그림 = **64×64px**(「RectTile Creation › Preparation」), 높이 타일(벽)은 「64px 두 칸」(「…› Tile Type」). 한 칸 = 1월드 단위 = 100px(`platform.md` §5 · `tile.md` §RectTileMap ↔ World Units). 즉 64px 타일은 화면에서 1.5625배로 늘어난다. 그리기 도구: 붓·사각·원·전체 채우기(「…› Convenient Tile Placement」).

**오토타일.** RectTile에는 규칙 타일이 없다. 공식 가이드의 전이 방법은 「3×3 + 2×2 = 최소 12장을 그려 손으로 놓는다」(「RectTile Creation › Connection Tiles」). MapleTile만 face·corner `type`이 있는 MapleRuleTile을 쓴다(`tile.md` §2D Tile Array 표).

**AI 정책.** 스킬 문서는 타일 배열을 AI가 직접 쓰지 말고 사용자가 메이커에서 칠하게 하라고 하되, **사용자가 절차 생성을 명시 허락하면 예외**(`tile.md` §Policy). 우리는 설계도 빌더가 `tileMap`을 쓴다(`lib.cjs:1291-1295`) — 이 예외에 해당.

### 1-2. 그림 (`SpriteRendererComponent` 외)

**`SpriteRendererComponent`** (`SpriteRendererComponent.d.mlua`): `SpriteRUID`(sprite·animationclip, `:68`) · `DrawMode` Simple/**Sliced**/**Tiled**(`:18` · `SpriteDrawMode.d.mlua`) · `TiledSize`(「Tiled·Sliced일 때 그릴 영역 크기」 `:78`) · `Color`(곱하기 색 `:83`) · `FlipX/FlipY`(`:28,33`) · `SortingLayer`/`OrderInLayer`(`:63,48`) · `MaterialID`(`:43`) · `PlayRate`·`StartFrameIndex`·`EndFrameIndex`(애니 맵 오브젝트 `:53,73,23`) · `SetAlpha`·`ChangeMaterial`. **피벗·크기 속성은 없다** — 피벗은 리소스 메타(업로드 시 정함), 크기는 `TransformComponent.Scale`. 우리 메모 「피벗은 처음 불리기 전에(늦으면 새 RUID)」가 이 구조 때문.

**반복 그리기 실측** (`maps.cjs:272-273`): `TiledSize` 단위 = 그림 장 수, 엔티티 자리 = **첫 장(왼쪽 아래) 가운데**, 오른쪽·위로 펼쳐짐. 회전 반복 그림의 기준점은 「메이커 실화면 확인 전 가정」(`decor.cjs:578`) — **미확인**으로 남아 있음.

**기타 그리는 부품** (`Environment/NativeScripts/Component/`): `PolygonRendererComponent`(+`PolygonSprite` 셰이더 = 다각형 안에 그림 반복 · 그림 랩 모드 Repeat 필수 — `material.md` §4.6) · `LineRendererComponent`(+`SpritePattern` = 선 따라 그림 반복) · `PixelRendererComponent`(실행 중 픽셀 그림) · `SkeletonRendererComponent`(Spine 4.1 · PNG 4096² · 8장까지 — 「Use Skeleton Resource › Notes」) · `WebSpriteComponent` · `ClimbableSpriteRendererComponent`(사다리·줄). 맵 오브젝트 템플릿은 `MapObject`·`ParticleMapObject`·`SkeletonMapObject`(`model.md` §Map Objects).
- 지형을 「다각형 + 반복 그림」으로 칠하는 길(`PolygonSprite`)은 엔진에 있다. **우리는 안 써 봤다**(맵 파일 PolygonRenderer 0개 — `mapstats.json` comps).

**배경 `BackgroundComponent`** (`BackgroundComponent.d.mlua`): `Type` = Template(메이플 배경)·SolidColor·Web·Gradient·Sprite(`BackgroundType.d.mlua`) · `ScrollRate`(`:43` · 「Set Background › Setting a Template Background」 — 높을수록 빨리 흐름, 음수 반대) · `SetBackgroundPiece*`(조각별 색·켜기·위치·비율 · ClientOnly `:97-113`). 패럴랙스 전용 다층 부품은 없고 템플릿 배경 안의 조각과 `ScrollRate`가 그 역할. 우리는 211장 모두 `Type 2` 단색(예: 황무지 갈색) — 탑뷰라 바깥만 칠한다(`lib.cjs` `;backdrop`).

**큰 그림 한 장 상한.** 리소스 저장소 sprite 업로드의 가로·세로·용량 상한은 **문서에서 못 찾음(미확인)**. 찾은 수치: 가로·세로가 4의 배수면 업로드 때 자동 최적화(「UI Design Guide › Resource Optimization」 — 예시 2000×2000) · 아틀라스 자르기 2048² · 스켈레톤 4096² · 실행 중 동적 업로드 3MB(「Screenshots and Dynamic Sprites › Learn more」 — 저장소 업로드에는 해당 안 됨: 우리 3,135,915바이트 바닥판이 올라감, `ruid-table.csv`). 모바일 텍스처 메모리 한도도 **미확인**. 필터 Point/Bilinear는 리소스 상세에서 고름(같은 문서).

### 1-3. 그림자 · 조명 · 후처리

**그림자** (`.d.mlua`에서 `shadow` 검색 결과 전부):
- `KinematicbodyComponent.EnableShadow·ShadowColor·ShadowOffset·ShadowSize·ShadowScalingRatio`(`:23,47,52,62,57`) — 몸 발밑 타원(점프 때 줄어듦). **장식·벽에는 없다.**
- 글자·UI 그림의 `DropShadow*`(`TextComponent.d.mlua:27-39` · `SpriteGUIRendererComponent.d.mlua:68-80`).
- 셰이더 `DropShadow`(`ShaderType.d.mlua:124`) — 그림 모양의 그림자를 셰이더로(속성 이름은 문서 미확인 · `material.md` §3.2).
- 조명(Light/OverlayLight)에는 그림자 드리우기 속성이 **없다**(두 파일 전 속성 목록).

**조명.**
- `LightComponent`(`LightComponent.d.mlua`): `Type` Spot/Freeform/Global/Sprite(`:88` · `LightType.d.mlua` — Global은 「한 SortingLayer에 Global 여러 개가 동시에 걸리지 않는다」) · `Color`·`Intensity`·`Inner/OuterRadius`·`Spot*Angle`·`Falloff*`·`FreeformPoints`(≤2000점)·`LightOrder`·`OverlapOperation`(Additive/AlphaBlend)·`TargetAllSortingLayers`/`TargetSortingLayers`(`:78,83` — **층 골라 비추기 가능**).
- 엔티티가 빛을 받으려면 **Lit** 셰이더여야 한다. `WorldConfig.UseLitDefaultMaterial`이 켜지면 전부 Lit(「Using LitMode and Light Sources › Activating LitMode」 · `LitMode.d.mlua` Default/Unlit/Lit). 우리 `Global/WorldConfig.config` = `UseLitDefaultMaterial: false`.
- `_OverlayLightService`(`OverlayLightService.d.mlua:9-54`): Spawn{Spot·Freeform·Global·Sprite}TypeOverlayLight(+Attached) · `DestroyOverlayLight` · `SetOverlayLightEnabled`. 우리 DarkVision이 쓰는 것은 이쪽 — 맵 전체 Global 1개(`DarkVision.mlua:517-523`) + 플레이어·파티·횃불·보스에 붙인 Spot(`:151-154,183-185`). 맵 파일에 `LightComponent`는 0개(`mapstats.json`).

**머티리얼·후처리.** 셰이더 65종(`ShaderType.d.mlua:6-134`): 외곽선 3 · 색 효과(그라데이션·회색·홀로그램·포스터·림라이트·ColorGlow 등) · 블러·픽셀화(`Pixel`)·색수차·`KuwaharaFilter` · UV(물결·잔디 흔들림·스크롤·왜곡·Ripple) · 블렌드 20종(Multiply·Overlay…) · 알파 마스크·Additive · 화면(`Vignette`·`LensDistortion` — **카메라 전용**) · `PolygonSprite`/`SpritePattern`. 규칙: 머티리얼 한 개를 바꾸면 쓰는 모든 엔티티가 같이 바뀜 · `ChangeMaterialProperty`는 ClientOnly(`material.md` §1). 셰이더별 속성 이름은 대부분 문서로 안 나옴 → 메이커에서 한 번 만들어 읽어야 함(`material.md` §3.3). **맵 그림에 셰이더를 건 적은 없다.**

### 1-4. 충돌 · 이동 막기 (탑뷰)

| 수단 | 몸(Kinematicbody)을 막나 | 근거 |
|---|---|---|
| 타일 `IsCollidable`(Movable) | **막는다** | `RectTileInfo.d.mlua:12` · `platform-rect.md` §3 |
| `TriggerComponent`(Box·Circle·Polygon) | **막지 않음** — 들어감/머묾/나감 이벤트만 | `TriggerComponent.d.mlua:1,55-62` |
| `PhysicsColliderComponent` + PhysicsRigidbody | 물리 강체끼리. 타일맵은 `PhysicsInteractable`로 참여 | `PhysicsColliderComponent.d.mlua:1` · `RectTileMapComponent.d.mlua:25` |
| 엔티티(장식)로 막기 | 문서·API에 Kinematicbody를 엔티티 콜라이더로 막는 수단 **없음/미확인** | Kinematicbody 설명은 RectTile 충돌만 언급(`KinematicbodyComponent.d.mlua:1,28`) |
| 맵 경계 | `MapComponent.LeftBottom/RightTop/UseCustomBound` | `MapComponent.d.mlua:35-49` |

→ 탑뷰에서 확실한 벽은 **충돌 타일 칸뿐**이다. 칸은 정사각 1×1(또는 `GridSize`)이라, 자유 곡선 그림과 막힘이 최대 1칸 단위로 어긋난다. 어긋나면 ① 그림은 바위인데 걸어 들어가짐 ② 빈 바닥인데 보이지 않는 벽 — 우리 QA 선례: 선반 두 개가 8칸짜리 보이지 않는 벽(`maps.cjs:281-282` 주석 · 「9차 QA」), 그림 양옆 투명 여백까지 막음(80%→60% `maps.cjs:274-275`). `GridSize 0.5`로 칸을 잘게 하면 어긋남은 줄지만 칸 수 4배(설계도·길 측정·검사기 전부 1칸 전제) — 우리는 해 본 적 없음.

### 1-5. 레이어 · 정렬

- 그리기 순서: ① SortingLayer(맵 레이어) ② OrderInLayer(클수록 앞) ③ Z(작을수록 앞) — 「Map Layer › Layer Priority Rules」 · `platform.md` §6.
- 모델 종류별 기본 OrderInLayer: 오브젝트 0 · 타일 1 · 몬스터·NPC 등 2 · 남 아바타 3 · 내 아바타 4. 「3 이상은 넣지 말라 — 아바타가 가려질 수 있다」(「Map Layer › Model's Layer Order」).
- 맵 레이어: `MapLayerComponent.LayerSortOrder`(작을수록 뒤 · `MapLayerComponent.d.mlua:11`) · 최대 10개(「Understanding MapleStory Movement Concepts › Topography Layer」 · MapleTile 문서). SortingLayer에 맵 레이어 이름을 넣으면 자동 치환(`IgnoreMapLayerCheck`로 끔).
- **Y 정렬은 없다.** 대신 엔진이 주는 앞뒤 수단은 「아바타는 밟고 선 타일의 레이어에 속한다」 — 나무를 Layer4에 두고 그 앞 초록 타일을 낮은 레이어로 칠하면 그 타일 위 아바타가 나무 뒤로 간다(「Map Layer › Example 2」). 다른 엔티티는 처음 놓인 레이어에 고정(같은 문서 › Relationship…). **RectTile에서 칸 단위로 이걸 쓰려면 타일을 레이어별로 나눠 칠해야 한다** — 우리 빌더는 RectTileMap 1개 · 레이어 1개(`mapstats.json` MapleMapLayer 211 = 맵당 1 · `MapLayerName "Layer1"`).
- SortingLayer 목록: 맵 레이어(`MapLayer0`…)와 `Default`. 전체 목록 정의 파일은 워크스페이스에 없음(`Global/WorldConfig.config`에 층 목록 없음) — **목록은 미확인**. 우리 실측: 맵 레이어가 하나뿐이라 `MapLayer1`은 「없는 층」이 되어 아바타(Default/4) 아래로 그려졌다(`lib.cjs:262` · 10-31 메이커 7차 probe).

### 1-6. 메이커 도구 (설명 글만 읽음 · 실행 안 함)

- `maker_import_maplestory_map(id)`: 「9자리 맵 ID로 **지금 메이커 맵에** 가져온다 · 편집 모드만 · 실제 가져오기는 비동기로 계속」. `maker_list_maplestory_maps(search)`: id·지역·이름 목록. 메뉴는 Window › MapleStory Map(단축키 Ctrl+Alt+2 · 「MSW Shortcuts › Pop-Up」).
  - **무엇이 어떤 형식으로 들어오는지(타일·발판·오브젝트·배경 · TileMapMode)는 문서에서 못 찾음 — 미확인.** 원작 맵은 횡스크롤 발판 지형이고, 엔진 문서상 MapleTile ↔ RectTile 전환은 지형을 지운다(「Create a MapleStory TileMap › MapleStory-Formed Terrain」). 그래서 탑뷰 맵 바탕으로 쓰기는 어렵다고 **추정**한다. 원작 오브젝트 그림을 캐 오는 용도는 가능성 있음(확인하려면 빈 시험 맵에 1회 가져와 보기 — 메이커 사용 레인 필요).
- `maker_run_command(command)`: 메이커 명령 콘솔과 같은 명령(`help`·`find-entity`·`find-component`·`find-property`·`export`·`import`·**`upload-sprite`**·`snapshot-properties`·`add-virtual-player` …). 맵 전용 명령(타일 칠하기 등)이 있는지는 `help`를 돌려야 알 수 있다 — **미확인**.
- 타일 칠하기 UI(붓·사각·원·채우기)는 메이커 화면 기능이고 MCP 도구는 없다(`tile.md` §Workflow After RPC Removal).

### 1-7. 문서 검색 기록 (msw-mcp `mlua_document_retriever` · 주제당 1~3건)

| 질문 | 쓴 문서(제목 › 소제목) | 요지 |
|---|---|---|
| 타일맵 | Utilizing RectTileMap › Adding and Editing Tile Set / Setting Tile Properties / Setting Tile Grid Size / Convenient Tile Placement / Applying Tile Set by Layer | 타일셋 팔레트로 만들고, 칸마다 그림·이름·Movable · GridSize · 붓4종 · 레이어별 타일셋 권장 |
| 타일 크기 | RectTile Creation › Preparation / Tile Type / Connection Tiles / Wall Tiles | 64×64 기본 · 벽은 64 두 칸 · 위아래 4~6px 여백 · 전이 12장 수작업 |
| 레이어·정렬 | Map Layer › Layer Priority Rules / Example 2 / Model's Layer Order | 3단 정렬 · 아바타는 밟은 타일 레이어 · 기본 순서표 |
| 배경 | Set Background › Template / Gradient / Image | 템플릿 + ScrollRate · 그라데이션 · 웹 이미지 |
| 조명·그림자 | Using LitMode and Light Sources › Activating LitMode / Global / LitMode | 4종 광원 · Lit/Unlit · UseLitDefaultMaterial |
| 큰 그림·업로드 | UI Design Guide › More Design Tips · Utilizing Atlases › The Atlas Unpacker · Use Skeleton Resource · Screenshots and Dynamic Sprites | 4의 배수 최적화 · 2048² 자르기 · 4096² 스켈레톤 · 실행 중 3MB — **저장소 sprite 상한은 없음** |
| 원작 맵 | Creating the Forest of Patience › Placing Tiles · Create a MapleStory TileMap | Window › MapleStory Map으로 가져옴(세부 형식 없음) |

### 1-8. MSW 리소스에 탑뷰용 타일셋·절벽·프롭 팩이 있나

`msw-search` 래퍼(`.claude/skills/msw-search/scripts/msw_resource_api.cjs`)로 확인(`resource-search.txt`):
- `--resource-type resource_pack --category background|object|foothold` 검색·목록: **결과 0**(「top-down tile floor」「cliff rock wall」「dungeon」「graveyard ruins」 × 3분류 = 12회 · `list` 3회).
- `random --resource-type resource_pack` 200건: npc 107 · mob 69 · skill 22 · item 2 — **맵 팩 0**. 팩은 몬스터·NPC·스킬·아이템 묶음뿐이다.
- 맵 그림은 **낱장 sprite**로 있다(원작 `map/obj/*.img` · `map/back` 계열). 예:

| RUID | 이름 | 분류 | 크기 | 원본 경로(tags) |
|---|---|---|---|---|
| `9f47870995e14c6293415620922206e5` | sprite-5958 | foothold | 488×632 | `map/obj/dungeon.img` › blueCave/set1 (「절벽 위 광산 입구」) |
| `9dc8e9d616634f23901771329aeeb1bd` | sprite-162209 | foothold | 568×312 | (동굴 검색) |
| `d3179153f3dd479f9e0f21cf3f044bb7` | sprite-17995 | object | 400×296 | (폐허 검색) |
| `937bdd1230744267806dc88ece385a09` | sprite-9094899 | background | 1000×1000 | (dark forest 검색) |

  전부 **횡스크롤 시점**(정면 그림)이다. 탑뷰 3/4 시점 바닥 타일·전이·절벽 테두리 세트는 찾지 못했다(검색어 기준 · 전수 아님). 우리가 쓰는 원작 그림은 묘비 등 34장(`data/handmade/maple_sprites.csv`).

---

## 2. 지금까지 우리 방식

### 2-1. 공정 한눈에

```
장소 설계서 data/handmade/specs/act<N>.cjs   (장소·길·바위·포털·세트 · v5 옵션)
   │ tools/build/handmade/compose.cjs (+ v5.cjs: 골격 띠·구역 바닥 재적합·섬·역할표 배치)
   ▼
설계도 data/handmade/<id>.txt (한 글자 = 한 칸 · ;size ;base ;zone ;road ;wall ;plate …)  + 배치표 <id>.csv (gate·torch·set·prop·decal·cluster)
   │ tools/build/handmade/lib.cjs build  (← tools/build.cjs maps / build.cjs <id>)
   │   decor.cjs: 흩뿌림·충돌 분류·이음새 · roles.cjs: 역할 기준 크기 · tile_classes.cjs: 칸 4계층
   ▼
map/<id>.map (MapBuilder · 노말 + _nm · _hell 복제)  → 메이커 refresh
```
근거: `compose.cjs:1-25` · `v5.cjs:1-10` · `lib.cjs:1-30` · `build.cjs:1-10` · `decor.cjs:1-8`.

### 2-2. 단계마다 무엇을 만드나

| 단계 | 만드는 것 | 엔진 수단 | 근거 |
|---|---|---|---|
| 충돌·통행 | RectTileMap 1개에 칸마다 **265 길 · 266 바닥 · 269 벽(충돌)**. 장식 발밑·장면판 `blocks`도 269 | `tileMap` + `IsCollidable`(타일셋 2000칸 중 충돌 = 0·269 두 칸) | `lib.cjs:38,1291-1295` · `AshCampTiles.tileset` 실측 |
| 타일 칸 크기 | **1칸 = 1월드 단위 = 100px** (`GridSize` 기본값 · 211파일 모두 미기록 = 기본) | `GridSize (1,1)` | `mapstats.json` grid · `maps.cjs:270`(칸 (x,y) = [x,x+1]×[y,y+1]) |
| 그림 한 장 | **128px = 1.28칸** (바닥·벽 조각 원본 128×128) | Tiled `TiledSize` = 장 수 | `lib.cjs:37` `S = 1.28` · `art_sprites.csv` floor·border-atlas 행 |
| 바닥(바탕·구역·길) | `ArtFloor`(z 0)·`ArtZone`(−0.005)·`ArtRoad`(−0.01) — 사각형마다 Tiled 엔티티 1개 · `;floormix`로 장마다 좌우·상하 뒤집기/변형 | Tiled + FlipX/Y + `Color` 곱 | `lib.cjs:56-80` · z 실측 `one.cjs`(황무지) |
| 타일 그림 자체 | 타일맵(MapLayer0 · 순서 0)은 그 위를 `Art*`(순서 1)가 덮어 **화면에 안 보이게** 쓴다 — 통행 판정·미니맵용 | SortingLayer/Order | `maps.cjs:269` |
| 칸 4계층 | guide / base / terrain / block (설계도 글자 → 계층) · 1,147줄 | 빌더 규칙 | `tile_classes.cjs:2-9` · `tile_classes.csv` |
| 이음새 | 계층 경계 그라데이션 띠 `ArtBand`(−0.007) · 볼록 모서리 45° 반칸 `ArtCorner` · (막힌 칸 옆 그늘 `ArtShade`는 **로딩 때문에 끔**) | Tiled + 회전 | `decor.cjs:960-1009` · `decor_policy.cjs:96-98` |
| 벽 | 9조각 테두리(`<atlas>-borders-nw…se` · `border-atlas` 270장 = 30벌) → 같은 조각끼리 사각형 합쳐 `ArtWall`(−0.02) · 속은 어둡게(0.3 / 바닥 닿은 쪽 0.68) | Tiled + `Color` | `lib.cjs:41-44,950-955` |
| 담 위·층 겹쌓기 | `ArtRaised`·`ArtEdge`: 앞면 띠 1~3단(밝기 1/0.68/0.46) + 아래 그림자 조각(검정 알파 0.2·0.32) | Tiled + 검정 `Color` | `lib.cjs:47-50,486-549,632-649` |
| 장식 | 코덱스 prop ×0.8 · prop-1x ×1 · ×art_scale · 메이플 mp-* 별도 배율 · 발밑 피벗 · `ArtProp`·`ArtDecal`(−0.015) | Simple + Scale | `lib.cjs:27-28` · `art_sprites.csv` |
| 장식 앞뒤 | **아래(남쪽)일수록 앞**: z = −0.034 + (y 비율)×0.008 (장식끼리만) | Z | `lib.cjs:957-958` |
| 세트 | 장소처럼 묶은 조각 배치(`map_sets.csv` 670줄 · dx·dy·scale·flip·collide) → `ArtSet` | 엔티티 묶음 | `data/map_sets.csv` |
| 충돌 분류 | 장식마다 tall=막음 · floor/portal/overlay=통과(`decor_collision.csv` 352줄) · 발밑 = 그림 가로 60% × 발밑 줄(+역할별 높이 비율) | 269 칸으로 변환 | `decor.cjs:1-7` · `lib.cjs:286-300` · `maps.cjs:275-286` |
| 윗부분 앞층 | 키 큰 그림의 위쪽을 잘라 `<그림>-top`을 **Default 층 · 순서 5**로 겹침 → 뒤에 선 아바타(Default/4)를 가림. 자르는 선 = PNG 첫 투명 줄 − 피벗(`top_cutlines.csv`) · 내 아바타가 뒤에 서면 0.35로 옅게(TopFade) | SortingLayer/Order + 클라이언트 색 | `lib.cjs:262-273` · `DarkVision.mlua:34-40,270-274` |
| 장면판 | `;plate` 사각형: 2000×1000 바닥판 1장(z −0.012) + 특징물 2(+top) + 소품 24 · 벽 덮개 2000×1000(+top) · 구역 안 옛 장식·벽 그림 빼기 · `blocks` 칸 = 충돌 | Simple 큰 스프라이트 | `lib.cjs:13-17` · `scene_plates.csv` · `MAKER-CHECK*.txt` |
| 길 안내 | v4까지 곡선 토막 두 겹(회전 Tiled) — **v5 맵은 없앰** | – | `v5.cjs:2` · `decor.cjs:6` |
| 어둠·빛 | 맵 전체 Global OverlayLight 1개 + 플레이어·파티·횃불·보스 Spot · `ArtWall*`/`ArtBorder*` 색 ×0.5 · 맵 그림 전부 순서 0·z 뒤로(떨어진 물건이 그림 밑에 깔리던 문제) · `*Top`은 그대로 | OverlayLightService · `Color` | `DarkVision.mlua:1,260-300,517-523` |
| 그림자 | ① 캐릭터·몬스터: Kinematicbody 타원을 끄고 픽셀 타원으로 대역 밑에(서버 위치와 따로 놀던 문제) ② NPC 발밑 그림 `ArtShadow`(69개) ③ 벽·담 그늘 = 검게 칠한 조각 ④ 장식·장면판 그림자 = **그림 안에 그려 넣음**(빛 방향은 그림마다 다름 — 규격 없음) | Kinematicbody · PixelRenderer · `Color` | `MotionSmoother.mlua:648-662,740-745` · `maps.cjs:157-163` · `lib.cjs:47-50` |

### 2-3. 엔티티 수 · 로딩 (MapBuilder 읽기 실측 · `mapstats.json`)

- 맵 파일 211(노말 79 + 악몽·지옥 복제). **설계도 맵 노말 66장 합 = 39,872 엔티티** (자체 예산 47,900 — `check_map_composition.cjs:46` · 이 예산은 우리가 정한 값이고 **엔진 상한은 미확인**).
- 전체 스프라이트 121,863 중 `Art*` 119,732 · **Tiled 104,249(86%)**. 층/순서 분포: MapLayer0/1 118,550 · MapLayer0/2 1,903 · Default/5(윗부분) 1,173 · LightComponent 0 · Trigger 0.
- 이름별: ArtWall 42,521 · ArtZone 24,540 · ArtRaised 18,774 · ArtBand 13,842 · ArtEdge 5,103 · ArtProp 4,695 · ArtDecal 2,769 · ArtCorner 2,553 · ArtRoad 1,815 · ArtSet 1,596(211파일 합).

| 맵(노말) | 칸 | 엔티티 | 그중 Tiled | 윗부분 | 충돌 칸 |
|---|---|---|---|---|---|
| stormcliff(최대) | 70×50 | 1,958 | 1,673 | 2 | 2,695 / 3,500 |
| rotmarsh | 70×50 | 1,323 | 1,247 | 2 | 2,201 |
| wasteland(장면판) | 70×50 | 853 | 680 | 5 | 1,811 |
| harbor(중앙값) | 36×24 | 464 | 409 | 1 | 445 |
| archive | 60×40 | 380 | 255 | 35 | 1,623 |
| town | 36×24 | 248 | 197 | 3 | 417 |
노말 79장 중앙값 424 · 최소 32(map01).

- **로딩 실측**: 막힌 칸 옆 그늘 띠 66장 7,003개를 넣었더니 황무지 첫 입장 **1.49 → 3.05초** → 뺐다(`decor_policy.cjs:96`). 장면판 1구역(2000×1000 2장 + 26장) 뒤 1.60·1.63초, 벽 덮개 2장 더해 **1.64·1.67초**(`scene-plate-wasteland/maker-wall/logs/key-lines.txt:11,49`). 같은 맵도 방마다 1.49/3.05초로 흔들린 기록이 있어 2회 이상 재야 한다(`MAKER-CHECK.txt` 1항). → **엔티티 수가 큰 그림 장수보다 로딩에 더 민감했다**(관찰 2건 · 일반화는 미확인).

### 2-4. 우리 방식의 한계 ↔ 엔진 기능 대조

| 지금 방식 | 엔진이 주는 것 | 차이·함의 |
|---|---|---|
| 전이(흙↔풀)는 띠·45° 조각·9조각 엔티티를 생성기가 깐다 | RectTile 오토타일 **없음** · 공식도 손그림 12장 | 오토타일 쓰려면 우리가 생성기에 marching squares를 짜야 함(엔진 대신) — 기획 59 C의 「전이 원시형」 |
| 바닥을 타일이 아니라 **Tiled 스프라이트 엔티티**로 덮음(타일은 숨김) | 타일 칸마다 그림을 직접 줄 수 있음(타일셋 팔레트 · 64px 권장 · 2000칸 타일셋) | 바닥을 진짜 타일로 칠하면 엔티티 0으로 바닥·전이를 그릴 수 있다. 다만 ① 타일셋 칸 그림은 메이커 UI로만 지정(파일엔 `Id`만 — 그림 연결 방식 **미확인**) ② 칸 = 1×1 고정 격자라 1.28칸 그림 반복·뒤집기 섞기 불가 ③ 타일은 `Color` 곱이 칸마다 안 됨(타일맵 전체 하나 · 확인 필요) |
| Y 정렬 없음 → 장식끼리는 z로, 캐릭터↔장식은 `-top` 앞층(Default/5)으로 | 엔진은 SortingLayer→Order→Z뿐 · 아바타는 밟은 타일 레이어로 이동 | 앞층은 「뒤에 선 사람만 가림」이 아니라 **늘 아바타 위** → 앞에 선 머리 덮기 규칙·TopFade 같은 땜질이 필요했다(`lib.cjs:270-273`). 레이어 방식은 칸 단위로 정확하지만 RectTileMap을 레이어별로 나눠야 함(시험 안 함) |
| 그림자는 그림 안에 그려 넣음 · 벽 그늘은 검은 조각 | 엔진 조명은 그림자 없음 · `DropShadow` 셰이더 있음(속성 미확인) | 빛 방향 통일은 **그림 규격으로만** 가능. 지금 키트·장면판·메이플 그림은 빛 방향 규격이 없다 |
| 충돌 = 정사각 칸 | 탑뷰 몸을 막는 건 타일뿐 | 자유 곡선 그림(A·장면판)과 칸이 어긋나 보이는 문제는 엔진으로 못 없앤다 — 그림을 칸에 맞추거나 `GridSize`를 줄이는 수밖에 |
| DarkVision = OverlayLight Global + Spot · 색 곱하기 | Lit 셰이더 + LightComponent(층 골라 비추기 · Sprite 광원) | 지금은 Unlit(`UseLitDefaultMaterial false`)이라 OverlayLight가 화면에 얹히는 방식. Lit 전환 시 그림 밝기 전부 다시 맞춰야 함(시험 안 함) |
| 맵 그림에 셰이더 0 | 외곽선·포스터·블렌드·픽셀화 등 65종 | 기획 59 F의 「후처리」를 **실행 중 셰이더로** 걸 수도 있다(PNG 재업로드 대신). 셰이더 1개 = 그 머티리얼 쓰는 전부가 같이 바뀜 · 속성 이름은 메이커에서 한 번 만들어 봐야 앎 |

---

## 3. 기획 59 방안 A~F — 엔진에서 요구하는 것

표기: **가능**(엔진·선례로 확인) · **불가** · **미확인**.

| 안 | 쓰는 엔진 기능 | 스프라이트 상한 | 엔티티 수 | 조명(DarkVision) | 충돌 만드는 법 |
|---|---|---|---|---|---|
| **A 맵 전체 한 장 그림** | 큰 Simple 스프라이트 2000×1000 조각 × N + `-top` 앞층 | 2000×1000 **가능**(선례) · 더 큰 한 장은 **미확인** · 사냥터 20조각 ≈ VRAM 320MB(추정 8MB/장) — 모바일 한도 **미확인** | 조각 수만큼만(적음) — 바닥·벽 Tiled 엔티티를 빼면 오히려 줄어듦 **가능** | 이름 규칙으로 자동(`ArtWall*` 0.5배는 벽 덮개만) **가능** | 설계도 칸 그대로(269) — 그림 곡선과 1칸 어긋남은 **엔진으로 못 없앰** |
| **B 혼합 구역제** | 지금 그대로(Tiled 타일 바닥 + 장면판 큰 스프라이트) | 위와 같음 · 곳당 2000×1000 2장 **가능**(황무지 1.67초) | 곳당 +약 30 / 옛 장식 −15 정도 **가능** | **가능**(검증됨) | 칸 + 장면판 `blocks` **가능** |
| **C 칠한 타일 키트** | Tiled 스프라이트 + 생성기 전이(우리 코드) — 또는 진짜 타일 칠하기(타일셋 칸 그림) | 128px 조각 **가능** | 전이 조각만큼 늘어남 — 예산·로딩 **미확인**(그늘 띠 7,003개 = +1.6초 선례가 경고) · 진짜 타일로 바닥을 칠하면 엔티티 0이지만 칸 그림 연결 방식·칸별 색 **미확인** | **가능** | 칸 그대로 **가능** |
| **D 3D→스프라이트 키트** | 프롭 Simple 스프라이트 (빛 방향을 그림에 고정) · 접지 그림자는 그림 안 또는 별도 그림 | 128~512px **가능** | 프롭 수 그대로 **가능** | **가능**(Unlit 그대로) · Lit 노멀맵류 엔진 기능은 **없음/미확인** | 발밑 칸(`decor_collision`) **가능** |
| **E C + D2 + A 10곳** | C·D·A 합 | A와 같음 | C의 전이 증가분 **미확인** | **가능** | **가능** |
| **F B + 장면판 후처리** | ① PNG 후처리 후 새 RUID(피벗 함정) **가능** ② 또는 머티리얼 셰이더(포스터·블렌드·외곽선)로 실행 중 처리 — 속성 이름·장면판에 걸었을 때 모양 **미확인** | 그대로 | 그대로 | **가능** · 셰이더 쪽은 DarkVision `Color` 곱과의 겹침 **미확인** | 그대로 |

공통 사실: ① 탑뷰 몸을 막는 건 충돌 타일뿐(모든 안이 설계도 칸에 묶임) ② 엔진 그림자·Y 정렬이 없어 「같은 빛·앞뒤」는 그림 규격과 `-top` 앞층으로만 맞춘다 ③ 원작 메이플 맵 가져오기·탑뷰 맵 팩은 이 결정에 쓸 재료가 아님(횡스크롤 · 팩 없음 · 가져오기 형식 미확인).

---

## 4. 미확인 목록 (확인하려면)

1. 리소스 저장소 sprite 한 장 가로·세로·용량 상한, 모바일 텍스처 메모리 한도 — 공식 문서에 없음. 4096×2048 1장 시험 업로드로 확인 가능.
2. `maker_import_maplestory_map`이 가져오는 형식(TileMapMode·발판·오브젝트·배경)과 RectTile 맵에 가져오면 생기는 일 — 빈 시험 맵에서 1회 실행(메이커 레인).
3. `maker_run_command help`의 맵 관련 명령(타일 칠하기·내보내기).
4. 타일셋 칸의 그림 연결 방식(파일에 `Id`만 있음) · 타일맵에 칸별 색 곱이 되는지 · `RectTileInfo.Index` 0/1 시작 불일치.
5. RectTile에서 「아바타는 밟은 타일의 레이어」 규칙이 그대로 동작하는지(문서 예시는 타일 그림만 · 우리 단일 레이어) — 칸 단위 Y 정렬 대체 수단 후보.
6. 엔진 엔티티 수 상한(우리 47,900은 자체 예산), 회전 Tiled 기준점(`decor.cjs:578` 가정), `DropShadow`·`PolygonSprite` 셰이더 속성 이름.

## 근거 파일
- 엔진 정의: `Environment/NativeScripts/Component/{RectTileMapComponent,MapComponent,SpriteRendererComponent,BackgroundComponent,LightComponent,OverlayLightComponent,MapLayerComponent,KinematicbodyComponent,TriggerComponent,PhysicsColliderComponent}.d.mlua` · `Enum/{SpriteDrawMode,LightType,LitMode,ShaderType,BackgroundType,TileMapMode}.d.mlua` · `Misc/RectTileInfo.d.mlua` · `Service/OverlayLightService.d.mlua`
- 스킬 참고: `.claude/skills/msw-general/references/{platform,platform-rect,tile,entity,material,model}.md` · `.claude/skills/msw-sprite-ruid/SKILL.md`
- 우리 공정: `tools/build/handmade/{compose,v5,lib,decor,tile_classes,build}.cjs` · `tools/build/maps.cjs` · `data/{art_sprites,map_sets,decor_collision}.csv` · `data/handmade/{tile_classes,scene_plates,maple_sprites}.csv` · `data/handmade/specs/decor_policy.cjs` · `RootDesk/MyDesk/Ambience/DarkVision.mlua` · `RootDesk/MyDesk/World/MotionSmoother.mlua` · `tools/check_map_composition.cjs`
- 실측: `docs/evidence/2026-11-02-msw-map-tooling/` · `docs/evidence/2026-11-02-scene-plate-wasteland/`
