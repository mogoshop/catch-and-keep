# 61 메이커 내장 기능으로 맵 끌어올리기 — 「넥슨 권장·관행 vs 우리 방식」 격차와 황무지 파일럿 (2026-11-02 · 조사·기획 레인)

> 사용자 문제의식(11-02 14:2x 요지): 「메이커가 주는 기능보다 너무 투박하게 작업한다. 조명·레이어·그림자부터 넥슨이 권장하는 맵 구성 방식이 있을 텐데, 코덱스로 타일·에셋을 만들 수 있다고 메이커 기능을 등한시하는 것 아닌가?」
> 이 문서는 **답**이다. 수단 조사는 기획 60(`60-msw-map-tooling-survey-20261102.md`)에서 끝났고 여기서는 인용만 한다. 게임 파일·맵·메이커는 바꾸지 않았다(`maker_*` 호출 0).
> 출처 표기: 「문서 제목 › 소제목」 = msw-mcp `mlua_document_retriever` 공식 가이드(발췌 `docs/evidence/2026-11-02-maker-native/doc-excerpts.txt`) · `파일:줄` = 저장소 · `.d.mlua` = `Environment/NativeScripts/`. 문서에서 못 찾은 것은 **관행 추정**, 확인 안 된 것은 **미확인**이라고 적는다.
> 사용 실태 수치: `docs/evidence/2026-11-02-maker-native/native-usage.json`(MapBuilder 읽기 API로 맵 211파일 전체 컴포넌트 집계 · 스크립트 `native-usage.cjs`).

---

## 0. 답 — 한 화면 요약

**사용자 지적은 절반 맞다.** 조명은 이미 메이커 기능을 쓰고 있다(공식 가이드가 「부하가 적다」고 한 서비스 방식 그대로). 틀린 것은 「조명이 없다」가 아니라 **「조명을 아주 좁게만 쓴다」**는 점이다. 반면 **레이어·머티리얼·위치 소리·맵 장식용 파티클은 정말로 0**이다. 우리는 이 자리를 전부 「그림(엔티티)을 더 깔기」로 메워 왔다 — 앞뒤는 `-top` 잘라 붙이기, 그림자·그늘은 검게 칠한 조각, 벽 구분은 색 곱하기, 길 경계는 띠 조각.

| 영역 | 메이커가 주는 것 (공식 근거) | 우리 지금 | 판정 |
|---|---|---|---|
| ① 레이어 | 맵 레이어 최대 10 · 아바타는 밟은 타일의 레이어로 이동 → 앞뒤를 레이어로 (「Map Layer › Example 2」) | 66장 전부 레이어 1개(`Layer1`) · 앞뒤는 `-top` 그림을 Default/5에 겹침 — 가이드가 「3 이상 넣지 말라」한 순서를 일부러 넘김 | **× 안 씀** (단 RectTile 몸에서 동작하는지 미확인 → 시험 1회) |
| ② 조명 | Spot·Freeform·Global·Sprite 4종 · 서비스 방식이 컴포넌트보다 가벼움 (「Controlling Overlay Lights」) | DarkVision이 OverlayLightService로 Global 1 + 플레이어·파티·소환수·혼·보스·**화로(Brazier) Spot** — 황무지 화로 11개는 이미 빛남 | **△ 쓰지만 좁다** — 깜빡임 0 · Freeform/Sprite 0 · 액트 1~3 전체 빛 색은 기본 푸른빛 하나 · 불 그림 소품 약 224줄은 빛 없음 |
| ③ 그림자 | 몸 발밑 타원(`EnableShadow`)뿐 · 조명은 그림자 없음 · `DropShadow` 셰이더는 「TargetColor 색에 그림자 효과」(드리운 그림자라는 설명 없음) | 몸 타원은 끄고 픽셀 타원 · NPC 발밑 그림 · 장식 그림자는 그림 안(방향 제각각) · 벽 그늘 검은 조각 | **엔진에 「통일 그림자」 기능이 없다** — 우리 방식이 틀린 게 아니라, 같은 발밑 그림자 한 장을 재사용하는 규칙이 없다 |
| ④ 머티리얼 | 셰이더 65종 · UVScroll·GrassMovement·Outline·Blend·카메라 Vignette (「Designing Materials › Shader Type」) | `.material` 파일 0 · 맵 211파일 `MaterialId` 0 | **× 안 씀** |
| ⑤ 파티클 | AreaParticle 12종(비·눈·안개 3·별 3·바람선 3) · BasicParticle 57종(횃불 불꽃·반딧불·먼지폭풍…) (`AreaParticleType`·`BasicParticleType.d.mlua`) | 맵 파일에 파티클 컴포넌트 0 · 실행 중 날씨는 **액트 3만**(비·안개) + 모래폭풍 맵 먼지 | **△ 액트 3만** — 액트 1·2·4 맵 장식 파티클 0 |
| ⑥ 배경·카메라 | 배경 Template/Gradient/Sprite + ScrollRate · 카메라 `MaterialId`에 Vignette | 배경 211장 단색 · 카메라 셰이더 0 | **× (배경은 탑뷰라 거의 무관 · 비네트는 작은 후보)** |
| ⑦ 타일 | 64px 타일을 타일셋 팔레트로 칠하기 · 연결 타일 12장 · 높이 타일 64×2 (「RectTile Creation」) | 타일은 통행 판정용으로 숨기고 바닥·벽 화면은 Tiled 스프라이트 엔티티(86%) · 1칸 100px · 그림 128px | **의도된 이탈** — 득실 있음(§3-⑦). 바꿀 근거는 약함 |
| ⑧ 소리 | SoundComponent를 물체에 붙여 거리 음량(HearingDistance · SetCameraAsListener) (「Creating Sound Effects › SoundComponent」) | 맵 SoundComponent 0 · 바람 루프·까마귀는 화면 전체 2D 소리(`SoundDirector.mlua:77,300`) | **× 안 씀** |

**끌어올리는 길(코덱스 그림 0장으로 되는 것)**: 화로 깜빡임 + 불꽃 파티클 · 불 그림 소품에 빛 · 액트·맵별 전체 빛 색(기획 51) · 맵 장식 파티클(바람선·안개·불티) · 위치 환경음 · 물·용암 바닥 UVScroll · 덤불 GrassMovement · 발밑 그림자 한 장 재사용 · 레이어 시험. 코덱스 그림이 꼭 필요한 곳은 「같은 빛 방향 그림자가 그려진 장식」과 「레이어 경계 절벽 앞면」뿐이다(§4-6).

**성능 여유**: 공식 기준은 모바일 엔티티 **5,000 이하**·FPS 30 이상·메모리 1GB(「Analyzing World Performance with Profiler › Data Analysis」). 우리 최대 맵 stormcliff 1,958 · 황무지 853(기획 60 §2-3). 엔티티 수로는 여유가 크다. 우리를 묶는 것은 **첫 입장 로딩 시간**(그늘 띠 7,003개로 1.49→3.05초 · 기획 60 §2-3)이다. 그래서 「엔티티를 늘리지 않는」 내장 기능(조명·셰이더·파티클 서비스·소리)이 가장 싸다.

---

## 1. 「넥슨이 권장하는 맵 구성」 — 공식 가이드가 실제로 말하는 것

표기: 우리 적용 ○ 그대로 / △ 일부·다른 방식 / × 안 씀. 「관행 추정」 = 공식 문서를 못 찾음.

| # | 가이드 (제목 › 소제목) | 권장 내용 한 줄 | 우리 | 근거(우리 파일) |
|---|---|---|---|---|
| 1 | Map Layer › Relationship Between Map Layer and Player Avatar › Example 2 | 타일·오브젝트를 4개 레이어로 나누면 아바타가 밟은 타일 레이어를 따라 나무 뒤/장난감 앞으로 자동 이동. 불길·덤불 통과 연출에 쓰라 | × | `native-usage.json` mapLayerNames `{"Layer1": 211}` · `lib.cjs:262-265` (`TOP_LAYER = "Default", TOP_ORDER = 5`) |
| 2 | Map Layer › Understanding Map Layer › Model's Layer Order | 오브젝트 0 · 타일 1 · 몬스터 2 · 남 아바타 3 · 내 아바타 4. 3 이상 넣지 말 것 | △ — 맵 그림은 0~1로 지킴, `-top`만 5 | `DarkVision.mlua:276-288`(맵 그림 순서 0) · `lib.cjs:265` |
| 3 | Utilizing RectTileMap › Layer Setting › Adding a Layer / Applying Tile Set by Layer | 레이어 추가 = RectTileMap 하나 더 · 레이어마다 다른 타일셋 권장 | × | RectTileMap 맵당 1개(`native-usage.json` RectTileMapComponent 211) |
| 4 | RectTile Creation › Preparation / Tile Type / Connection Tiles / Wall Tiles | 64×64 타일 · 길은 연결 타일 최소 12장 · 벽은 64px 두 칸·위아래 4~6px 여백·윗면 밝게 아래 어둡게 | △ — 칸 128px 그림을 Tiled 엔티티로. 벽 9조각·밝기 규칙은 비슷하게 따름 | `lib.cjs:37`(`S = 1.28`) · `:40-44`(벽 속 0.3 · 바닥 닿은 쪽 0.68) |
| 5 | Using LitMode and Light Sources › Applying Light Sources / LitMode | LightComponent 4종 · Lit/Unlit · `TargetSortingLayers`는 층마다 빛 텍스처라 「모바일에 부담」 | △ — Unlit 유지(`UseLitDefaultMaterial: false`) + 오버레이 빛 | `Global/WorldConfig.config` · 맵 LightComponent 0 |
| 6 | Controlling Overlay Lights › Controlling Light Sources (OverlayLightService) | 서비스로 만든 빛은 엔티티가 없어 OverlayLightComponent보다 부하가 적다 | ○ | `DarkVision.mlua:183-186,517-523,557-565` |
| 7 | Designing Materials › Shader Type (ColorEffect·Outline·UVEffect·BlendColor·AlphaBlend·Screen) | 머티리얼 = 셰이더 + 값. Screen(Vignette·LensDistortion)은 카메라 전용 | × | `.material` 0 · `materialIds {}` (`native-usage.json`) |
| 8 | Designing Materials › Shader Type › ColorEffect › DropShadow | 「TargetColor로 지정한 색에 그림자 효과」 — 바닥에 드리우는 그림자라는 설명은 없음 | × (쓸 근거도 약함) | — |
| 9 | Set Background › Setting a Template Background / Gradient | 메이플 배경 프리셋 + ScrollRate · 4색 그라데이션 | △ — 단색(Type 2)만 · 탑뷰라 맵 밖 바탕만 칠함 | `lib.cjs:1297-1300` · `native-usage.json` backgroundTypes `{"2": 211}` |
| 10 | Using Particles › Types of Particle Components › AreaParticleComponent | 생성 영역으로 비·눈·먼지 · 영역을 키우면 개수도 같이 키워 밀도 유지 | △ — 실행 중 서비스로 액트 3 비·안개만 | `DarkVision.mlua:94-108` · `lib.cjs:1270`(액트 3만 Weather) |
| 11 | Creating Sound Effects › SoundComponent | 물체에 소리를 붙여 가까이 가면 들리게 · HearingDistance · SetCameraAsListener | × | 맵 SoundComponent 0 · `SoundDirector.mlua:77,300`(2D 전역 소리) |
| 12 | Analyzing World Performance with Profiler › Data Analysis | FPS ≥30 · 모바일 엔티티 ≤5,000 · 모바일 메모리 1GB 넘으면 강제 종료 가능 · 엔티티·효과·파티클이 많으면 Engine FPS 하락 | ○ (최대 1,958) | 기획 60 §2-3 |
| 13 | Creating and Managing Maps › Summary | 맵 크기·놓인 오브젝트 수를 적절히(로딩 지연) | ○ (자체 예산 47,900/66장 · 그늘 띠 철회 선례) | `data/handmade/specs/decor_policy.cjs:96` |
| — | SortingLayer 목록 설계 · 맵 장식 그림자 · 맵용 Tiled DrawMode · MapObject 애니메이션 장식 | **공식 문서 못 찾음** — 이 문서에서 이 주제로 쓰는 내용은 관행 추정 | | `doc-excerpts.txt` 「못 찾은 것」 |

**정리**: 넥슨 가이드가 말하는 「맵 구성 방식」은 한 편으로 묶인 절차가 아니라 조각들이다. ① 64px 타일을 팔레트로 칠하고 ② 앞뒤는 **맵 레이어**로 나누고 ③ 오브젝트는 순서 0~2에 두고 ④ 빛·머티리얼·파티클·소리를 컴포넌트/서비스로 얹는다. 우리는 ①을 의도적으로 바꿨고(§3-⑦), ②를 안 썼고(`-top`으로 대신), ③은 `-top`만 어겼고, ④는 조명만 썼다.

---

## 2. 메이커 내장 부품 — 우리가 한 번도 안 쓴 것

### 2-1. 맵 관련 템플릿 (`.claude/skills/msw-general/models/` — 워크스페이스에 `Global/NativeModel/` 폴더는 없음)

| 템플릿 | 하는 일 | 우리 맵 211파일 사용 |
|---|---|---|
| MapObject | 그림 1장 오브젝트 | 자작 모델로 대체(`Objects/ArtSprite` 등) |
| MapleMapLayer | 맵 레이어 | 맵당 1개(기본) — **추가 레이어 0** |
| RectTileMap | 타일맵(레이어마다 1개) | 맵당 1개 |
| ParticleMapObject · AreaParticle · BasicParticle · SpriteParticle | 맵에 놓는 파티클 | **0** |
| AnimationPlayer | 애니메이션 클립 재생 오브젝트 | **0** |
| SkeletonMapObject | Spine 애니 오브젝트 | **0** |
| Sound · SoundEffect | 위치 소리 | **0** |
| Portal · Foothold · Ladder · Rope · TileMap | 이동 지형(대부분 횡스크롤용) | 포털만 자작 WarpGate |

### 2-2. 맵 연출 컴포넌트 (`Environment/NativeScripts/Component/`)

| 컴포넌트 | 근거 | 우리 사용 | 표시 |
|---|---|---|---|
| `LightComponent` (Spot/Freeform/Global/Sprite · `TargetSortingLayers` · `PlayRate` · `SpriteRUID`) | `LightComponent.d.mlua:8-88` | 0 (Unlit이라 효과 없음) | **안 씀** |
| `OverlayLightComponent` (엔티티에 붙는 오버레이 빛 · 속성 실시간 변경 가능) | `OverlayLightComponent.d.mlua:8-73` | 0 (서비스 방식만) | **안 씀** |
| `_OverlayLightService` Freeform · Sprite 타입 | `OverlayLightService.d.mlua:19-54` | Global·Spot만 | **Freeform·Sprite 안 씀** |
| `AreaParticleComponent` (`LitMode`·`SortingLayer`·`Prewarm`) | `AreaParticleComponent.d.mlua:8-98` | 0 (서비스 `PlayAreaParticle`로 Rain·FogLively 2종만) | 컴포넌트 **안 씀** · 종류 12 중 2 사용 |
| `BasicParticleComponent` / `SpriteParticleComponent` | 같은 폴더 | 맵 0 (스킬 효과는 서비스로 25종 사용) | 맵 장식에 **안 씀** |
| `SoundComponent` (`HearingDistance 15`·`SetCameraAsListener`·`Loop`·`PlayOnEnable`) | `SoundComponent.d.mlua:8-53` | 0 | **안 씀** |
| `CameraComponent.MaterialId` (화면 셰이더) | `CameraComponent.d.mlua:37` | 빈 값 | **안 씀** |
| `SpriteRendererComponent.MaterialId` | `SpriteRendererComponent.d.mlua:43` | 0 | **안 씀** |
| `PolygonRendererComponent` + `PolygonSprite` · `LineRendererComponent` + `SpritePattern` | 기획 60 §1-2 | 0 | **안 씀** |
| `SkeletonRendererComponent` | 같은 폴더 | 맵 0 | **안 씀** |
| `TweenFloatingComponent` (둥실거림) | 같은 폴더 | 맵 0 | **안 씀** |
| `BackgroundComponent` Template/Gradient/Sprite | 기획 60 §1-2 | 단색만 | 대부분 **안 씀** |
| `MapLayerComponent` 2번째 이상 | `MapLayerComponent.d.mlua:11` | 0 | **안 씀** |
| `KinematicbodyComponent.EnableShadow` | 기획 60 §1-3 | 끄고 픽셀 타원으로 대체(`MotionSmoother.mlua:651-662`) | 일부러 끔(동기화 문제 · 메모 「움직임 동기화」) |

**한 번도 안 쓴 내장 기능 목록(맵 연출 기준)**: 추가 맵 레이어 · 레이어별 RectTileMap/타일셋 · LightComponent · OverlayLightComponent · Freeform/Sprite 오버레이 빛 · 머티리얼 전부(맵 그림·카메라) · 맵 배치 파티클(Area·Basic·Sprite · ParticleMapObject) · AreaParticle 중 Snow·FogCalm·FogHeavy·별 3종·Windlines 3종 · BasicParticle 중 맵용(ToonFireTorch·FireFlies·RisingSteam 맵 배치) · SoundComponent(위치 소리) · AnimationPlayer · SkeletonMapObject · TweenFloating · Polygon/Line 그림 반복 · 배경 Template/Gradient · 카메라 화면 셰이더(Vignette·LensDistortion).

---

## 3. 격차 분석 (핵심 표)

비용 표기: 코드 · 데이터 · **코덱스 그림(0이면 「그림 0」)**. 위험은 모바일 성능·DarkVision 충돌 중심.

| 영역 | 메이커 권장/제공 | 우리 지금 | 격차 | 끌어올리는 법 (내장 기능만) | 비용 | 위험 | 기대 효과 |
|---|---|---|---|---|---|---|---|
| ① 레이어 | 맵 레이어 ≤10 · 아바타 = 밟은 타일 레이어(Map Layer › Example 2) · 레이어마다 RectTileMap(Utilizing RectTileMap › Adding a Layer) | 레이어 1 · `-top`을 Default/5에 · TopFade로 옅게(`DarkVision.mlua:309-414`) | 앞층이 「늘 아바타 위」라 앞 머리 덮기 규칙(`lib.cjs:274`)·TopFade 땜질이 필요했다(기획 60 §2-4) | 높은 지형(절벽 윗면·담 위)과 키 큰 장식을 위 레이어로, 그 앞 걷는 칸을 아래 레이어 타일로 칠해 칸 단위 앞뒤 | 코드: lib.cjs 타일맵 2개 쓰기 · DarkVision 층 이름 규칙 / 데이터: 설계도 높이 글자 / **그림 0** | **RectTile·Kinematicbody에서 아바타 레이어가 바뀌는지 문서에 없다**(MapleTile·Rigidbody 예시만 · 기획 60 미확인 5). 10-31 probe에서 아바타 런타임 층이 Default였다(`lib.cjs:262-263`) → 안 바뀔 가능성 있음. 레이어가 늘면 OverlayLight Global 규칙(「한 SortingLayer에 Global 여럿 불가」) 재확인 필요 | 동작하면 `-top` 잘라 붙이기·TopFade·앞 머리 규칙을 걷어낼 수 있다. 동작 안 하면 지금 방식이 엔진 한계 안의 정답임이 확인된다 |
| ② 조명 | Spot·Freeform·Global·Sprite · Additive/AlphaBlend · 서비스가 가벼움 | Global 1(액트 1~3 같은 푸른 밤빛 `MapAmbience.mlua:8` · 액트 4·각성·심도만 예외 `DarkVision.mlua:232-237`) + Spot(화로 반경 2.2·세기 0.9 고정 `TorchLight.mlua:5-7` · `DarkVision.mlua:151-155`) | 깜빡임 0 · 화로 그림은 정지 그림 1장(`Objects/Brazier` = Transform·Sprite·TorchLight) · 불 그림 소품(등불·촛대·용암 샘 등) 배치표·세트 표 **약 224줄에 빛 0**(crypt-candlestand 47 · harbor-lantern 39 · a4-soul-lantern 38 · a4-adjunct-soul-candle-cluster 23 · a4-small-lava-fount 19 · a4-brazier 18 · a4-ember-pillar 13 · a4-adjunct-ember-brazier 11 · 기타) · 액트 1~3 맵 빛 색 구분 없음 | (a) 화로 깜빡임 (b) 불 소품에 TorchLight 자동 부착(이름표 규칙) (c) 기획 51 안 B의 맵별 전체 빛 색(황무지 `#A9C6FF` 0.16) (d) 용암 강·물웅덩이는 Freeform 빛으로 땅이 빛나게 | 코드: DarkVision 수십 줄 · 빌더 소품→TorchLight / 데이터: 표 1장 / **그림 0** | 빛 수가 늘면 오버레이 렌더 비용(공식 수치 없음 · **미확인**) → 화면 안 빛만 켜는 컬링 필요. 서비스에는 빛 속성을 바꾸는 메서드가 없다(`OverlayLightService.d.mlua:9-54`) → 깜빡임은 OverlayLightComponent(속성 실시간) 또는 지우고 다시 만들기 | 「그림만 있는 불」이 사라짐. 어두운 맵에서 길잡이가 빛으로 읽힘. 기획 51의 장면 색이 조명 쪽으로 그대로 들어감 |
| ③ 그림자 | 몸 발밑 타원뿐 · 조명 그림자 없음 · DropShadow는 색 대상 효과(문서 설명) | 몸: 픽셀 타원 · NPC: 발밑 그림 `FOOT_SHADOW`(`maps.cjs:158`) · 장식: 그림 안(빛 방향 규격 없음) · 벽: 검은 조각 | **엔진 차이가 아니라 규칙 부재.** 장식마다 그림자 방향·진하기가 다르다 | 이미 있는 발밑 그림자 그림 **한 장(`FOOT_SHADOW`)** 을 장식 역할별 크기로 깔고(타원 · 알파 0.25~0.35), 그림 안 그림자가 강한 것은 표에서 끈다 · 타원이라 빛 방향은 「위에서 수직」 하나로 통일 | 코드: 빌더 place 훅 1개 · 역할표에 shadow 열 / **그림 0** | 엔티티가 장식 수만큼 늘어남(황무지 +최대 43 · 66장 +최대 약 4,700 = ArtProp 4,695 기준) → 로딩 증가 위험(그늘 띠 선례). 큰 장식(역할 feature·structure)만이면 그보다 훨씬 적음(추정) | 장식이 바닥에 「놓인」 느낌. 그림마다 다른 그림자는 남지만 접지감은 통일 |
| ④ 머티리얼 | 65종 · UVScroll·GrassMovement·Outline·Additive·Blend·Vignette | 0 | 물·용암 바닥이 정지 그림 · 덤불·풀이 정지 · 발광 소품이 Additive 아님 | (a) 용암·물 바닥 Tiled 그림에 UVScroll(느린 흐름) (b) 마른 덤불·풀 장식에 GrassMovement (c) 발광 겹침 층(배치표 `over=1` · `lib.cjs:957` 주석)에 Additive (d) 카메라 Vignette | 코드: 빌더 `MaterialId` 한 줄 · 카메라는 클라이언트 1줄 / 데이터: 머티리얼 3~4개 / **그림 0** / **메이커에서 샘플 머티리얼 1회 생성 필요**(속성 이름이 문서에 없음 · `material.md` §3.3) | 머티리얼 하나 = 쓰는 엔티티 전부 같이 바뀜(`material.md` §1) — 맵 장식엔 오히려 장점. DarkVision `Color` 곱과 겹침 **미확인** · Tiled + UVScroll 이음 모양 **미확인** · 모바일 셰이더 비용 **미확인** | 「움직이는 맵」. 용암·물·풀이 살아 있다. 엔티티 추가 0 |
| ⑤ 파티클·날씨 | AreaParticle 12종(바람선 3·안개 3·눈·비·별 3) · BasicParticle 57종(ToonFireTorch·FireFlies·RisingSteam·DustStorm) · 파티클도 LitMode 개별 | 액트 3 비·안개만(`lib.cjs:1270`) · 모래폭풍 맵만 먼지(`DarkVision.mlua:538-543`) · 화로에 불꽃 없음 | 액트 1·2·4 맵에 공기가 없다 — 황무지는 `wind=true`인데 바람이 「소리」로만 있다 | (a) 바람 부는 바깥 맵 = Windlines(옅게) (b) 묘지·구덩이 = FogCalm (c) 화로 = ToonFireTorch 붙임 (d) 액트 4 = 불티(SparkLoop/FireFlies 붉게) | 코드: DarkVision `StartWeather` 확장 · maps.csv `weather` 열 / **그림 0**(재 낱알 모양을 원하면 SpriteParticle + 작은 그림 1장 · 선택) | Engine FPS는 「엔티티·효과·파티클이 많으면 크게 떨어진다」(Profiler 문서) → 맵당 영역 파티클 ≤2 · 화로 불꽃은 화면 안만. 어둠(황무지 밝기 0.32) 속에서 안 보일 수 있음 → 알파 조정 | 「바람 부는 황무지」가 눈으로 보인다. 비용 대비 효과 큼 |
| ⑥ 배경·카메라 | Template·Gradient 배경(횡스크롤 중심) · 카메라 `MaterialId`(Vignette) | 단색 · 줌 80(`GameData.mlua:215`) · 어둠·시야는 DarkVision 오버레이 | DarkVision이 이미 「가장자리 어둠」을 빛으로 한다 — 비네트는 **겹치는 기능** | 비네트는 DarkVision을 대신하지 못한다(어둠은 플레이어 빛 반경 = 게임 규칙, 비네트는 화면 고정). 쓸 곳은 보스 국면·각성 붉은 하늘의 화면 가장자리 색 정도 | 코드: 클라이언트 카메라 머티리얼 교체 / 그림 0 | 시야 규칙과 이중 어둠 → 모바일 작은 화면에서 답답(추정) | 작다. 「색보정을 카메라 셰이더로」는 기대만큼 크지 않다 — 맵 색은 Global 빛 색(②-c)이 맞는 손잡이 |
| ⑦ 타일 크기·타일셋 | 64px 타일 · 팔레트로 칠하기 · 연결 타일 12장 손그림 · 2048² 아틀라스 자르기 | 1칸 100px · 타일은 숨겨 통행용(265/266/269) · 화면은 128px Tiled 엔티티 | 이중 구조. 엔티티 대부분이 바닥·벽 그림(211파일 합 ArtWall 42,521 · ArtZone 24,540) | 「진짜 타일로 바닥 칠하기」면 바닥 엔티티 0(로딩 이득). 그러나 칸 그림 연결 방식이 파일에 안 보이고(`Id·Name·IsCollidable`뿐 · 기획 60 §1-1) 1.28칸 반복·뒤집기 섞기(`;floormix`)·칸별 색 곱을 잃는다 | 코드: 빌더 대수술 / 타일셋 메이커 수작업 / 그림 0~(64px 재출력이면 코덱스 다시) | 66장 재빌드 · DarkVision 이름 규칙(`ArtWall*` 어둡게) 깨짐 · 바닥 쌍마다 연결 타일 12장 손그림(공식 방식) | 이득은 로딩뿐이고 잃는 것이 많다 → **지금은 바꾸지 않는다**. 단 엔티티가 로딩 병목이 되면 「바탕 바닥 한 종만 진짜 타일」은 시험할 가치가 있다 |
| ⑧ 소리 | SoundComponent 위치 소리 · HearingDistance · SetCameraAsListener | 바람 루프·까마귀 전역 2D(`SoundDirector.mlua:77,300`) · 화로·물·용암·종 위치 소리 0 | 장소가 소리로 구분되지 않는다 | 화로 = 장작 타닥(거리 4) · 예배당 = 낮은 바람·종 · 구덩이 = 파리 · 늪 = 물방울. 맵 빌더가 표대로 SoundComponent 엔티티를 놓음(맵당 ≤6) | 코드: 빌더 + 설정 음량 연결 / 데이터: 표 / **그림 0**(소리 RUID는 `msw-search` 리소스 검색 — 코덱스 아님) | 동시 재생 수·모바일 소리 채널 한도 **미확인** · 설정의 환경음 음량(`SoundDirector` AmbienceVolume)과 연결 필요 | 「들어가면 들리는 장소」. 비용 대비 효과 큼 |

---

## 4. 적용안 — 황무지 1장 파일럿 (실행은 다음 레인이 메이커로)

대상: `map/wasteland`(노말) · RectTile(`TileMapMode 1` · 기획 60 `mapstats.json` modes `{"1": 211}`) · 엔티티 853 · 화로 11(`data/maps.csv` torches) · 장면판 1구역 · `Weather ""` · `wind true · crows true` · 전체 밝기 0.32.
원칙: 각 단계 = **변경 파일 · 검증 · 롤백** 한 묶음. 메이커는 한 번에 하나(메모 「위임 규칙」). 0 → 1(시험) → 2~5 한 번에 → 6 측정 순으로 메이커 2~3회.

### 단계 0 — 기준 측정 (변경 없음)
- 잴 것: 첫 입장 로딩 2회 이상(같은 맵도 1.49/3.05초로 흔들린 기록 · 기획 60 §2-3) · 엔티티 수(MapBuilder 853) · FPS(PC · iPad 줌 80) · 같은 6자리 캡처(서문·장면판·교차로·예배당·구덩이·동문 — 메모 「맵 전수 캡처」 방식).
- 산출: `docs/evidence/<날짜>-wasteland-native/baseline/`.

### 단계 1 — 맵 레이어 시험 (격리 · 그림 0)
- 목적: 「RectTile + Kinematicbody 아바타가 밟은 타일 레이어로 바뀌는가」 하나만 확인(문서 없음 · 기획 60 미확인 5).
- 방법: 빌더 격리 출력(`build(d, …, { outFile })` · `lib.cjs` build 주석)으로 시험 맵 사본에 **MapLayer 2 + RectTileMap 2**를 추가하고, 북쪽 절벽 줄 몇 칸을 레이어 2 타일로 칠한다. 레이어 2에 키 큰 장식 1개. 클라이언트 [VRF] 로그로 내 아바타 렌더러 `SortingLayer`를 0.5초마다 찍으며 걷기.
- 판정 A(바뀜): 다음 회차에 키 큰 장식·`-top`을 레이어로 옮기는 설계(별도 문서) — `-top`·TopFade·앞 머리 규칙 제거 후보.
- 판정 B(안 바뀜 · Default 고정): 지금 `-top` 방식이 엔진 한계 안의 정답임을 기록하고 닫는다. (대안인 「스크립트로 아바타 SortingLayer를 칸마다 바꾸기」는 엔진이 덮어쓰는지 **미확인**이고 동기화 위험이 있어 비권장)
- 변경 파일: 시험 출력 파일 1개만(본 맵 불변) · 롤백 = 시험 파일 삭제.

### 단계 2 — 빛 (그림 0)
1. **화로 깜빡임 + 불꽃**: `TorchLight`에 `Flicker`(세기 폭 0.15 · 주기 0.12~0.3초 난수) 속성 추가. 구현 두 갈래:
   - (가) 클라이언트에서 화로 엔티티에 `OverlayLightComponent`를 붙여 `Intensity`만 흔든다 — 속성 실시간 변경 · 새 엔티티 없음(컴포넌트만). 가이드는 컴포넌트가 서비스보다 무겁다고만 말함(수치 없음).
   - (나) 서비스 빛을 0.2초마다 지우고 다시 만든다 — 선례 `TickHeartbeat`(`DarkVision.mlua:505-514`)는 Global 1개뿐. 화로 수만큼 매번 다시 만들면 부담(추정).
   - 화로가 많은 맵(액트 4)을 생각하면 (가)가 맞다(추정). 불꽃 = `_ParticleService:PlayBasicParticleAttached(BasicParticleType.ToonFireTorch, 화로, …)` 화면 안 화로만.
2. **전체 빛 색**: 기획 51 안 B 황무지 값 `#A9C6FF` · 섞기 0.16을 `maps.csv` 새 열(`tint`)로 받아 `EnterMap`의 `color`에 섞는다(`DarkVision.mlua:227-239`). 우선순위는 51 문서 그대로(각성 > 심도 > 틴트 > 기본).
3. **불 소품에 빛**: 황무지에는 켜진 불 소품이 없다(솥·모닥불 자국은 「꺼진」 연출 — 배치표 주석). → 황무지에서는 하지 않고, 규칙(그림 이름 → TorchLight 자동 부착 · 표: 그림 이름·색·반경)만 만들어 액트 3·4에서 쓴다.
- 변경 파일: `RootDesk/MyDesk/Ambience/TorchLight.mlua` · `DarkVision.mlua` · `data/maps.csv`(열 추가) · `tools/gen_data.cjs`(열 읽기).
- 검증: [VRF] 화로 깜빡임 수 로그(n=11) · 틴트 적용 로그 · 캡처 2장(밤 색 차이) · FPS 단계 0 대비.
- 롤백: `maps.csv` tint 빈칸 · `Flicker` 기본 0 → 지금과 같음.

### 단계 3 — 발밑 그림자 통일 (그림 0)
- 이미 있는 `FOOT_SHADOW`(NPC 발밑 그림 · `maps.cjs:158`)를 역할 feature·structure 장식 발밑에 깐다(가로 = 그림 폭 × 0.7 · 알파 0.3 · 순서 0 · 장식보다 뒤 z). 그림 안 그림자가 이미 진한 장식은 `data/handmade/asset_roles.csv`에 `shadow=0`.
- 이름 = `ArtShadow<n>` — DarkVision `Art*` 규칙(순서 0 · 뒤로 밀기)을 그대로 받는다. 장식보다 뒤 유지 여부는 확인 필요.
- 변경 파일: `tools/build/handmade/lib.cjs`(place 훅) · `data/handmade/asset_roles.csv`(열) → 황무지만 빌드.
- 검증: 엔티티 증가(목표 ≤ +30) · 로딩 단계 0 대비 +0.1초 이내 · 캡처 비교.
- 롤백: 열 끄기 → 다시 빌드.

### 단계 4 — 파티클 2곳 (그림 0)
- (a) 맵 전체 `AreaParticleType.Windlines` 옅게(색 알파 0.15 · `ParticleCount` 2 · `MapLayer0` 순서 39) — 「바람 부는 황무지」 (b) 묘지 고원 구역에 `FogCalm` 한 덩어리(AreaSize = 구역 크기). 둘 다 `DarkVision.StartWeather`(`:94-108`)에 종류를 늘리는 방식(지금 rain/mist만).
- 데이터: `maps.csv` `weather` 열(지금은 빌더가 액트 3만 정함 `lib.cjs:1270`) + 구역 안개는 배치표 새 kind(`fog`) 또는 설계도 지시문.
- 검증: [VRF] 날씨 로그 · FPS · 캡처(어둠 0.32 속에서 보이는지 — 안 보이면 알파 상향).
- 롤백: 열 빈칸.

### 단계 5 — 위치 환경음 1곳 + 머티리얼 1종 (그림 0)
- 환경음: 화로 11개 중 서문 화로 1개에 `SoundComponent`(장작 소리 · `HearingDistance 4` · `SetCameraAsListener true` · `Loop` · `PlayOnEnable`). RUID는 `msw-search`로 리소스 검색. 음량은 `SoundDirector.AmbienceVolume`에 맞춰 클라이언트에서 조정.
- 머티리얼: 마른 덤불(`waste-dry-shrub` 배치 2곳 + 장면판 풀 소품 6장)에 `GrassMovement`. **선행: 메이커에서 GrassMovement 샘플 머티리얼 1개 생성 → 파일을 읽어 속성 이름 확보**(`material.md` §3.3) → `RootDesk/MyDesk/Materials/GrassSway.material` → 빌더가 그 그림들에 `MaterialId` 한 줄.
- 검증: 흔들림이 도트 그림에서 뭉개지지 않는지(눈 판정 · 메모 「맵 품질은 눈으로」) · DarkVision 어둡게·TopFade 색 쓰기와 같이 동작하는지.
- 롤백: MaterialId 빈칸 · SoundComponent 엔티티 삭제(빌더 표 행).

### 단계 6 — 성능 측정 지점
| 지점 | 기준 | 통과선 |
|---|---|---|
| 첫 입장 로딩 | 단계 0 값(2회 평균) | +0.15초 이내 |
| 엔티티 | 853 | ≤ 900 (공식 모바일 5,000 대비 여유 · 우리 병목은 로딩) |
| FPS (PC / iPad 줌 80) | 단계 0 | 30 이상 · 감소 ≤10% |
| 오버레이 빛 수(동시) | 플레이어 1 + 화로 화면 안 n | 화면 밖 화로 빛 끄기 컬링 뒤 다시 잼 |
| 파티클 | 0 → 영역 2 + 화로 불꽃(화면 안) | 메이커 Profiler Engine FPS |

### 4-6. 코덱스 그림 0장으로 되는 범위 / 그림이 꼭 필요한 곳
- **그림 0으로 됨**: 단계 1~6 전부 — 레이어 시험 · 깜빡임 · 불꽃 파티클 · 전체 빛 색 · 발밑 그림자(기존 `FOOT_SHADOW` 재사용) · 바람선·안개 · 위치 환경음(리소스 검색) · GrassMovement. 액트 3·4로 넓힐 때의 물·용암 UVScroll · Additive 발광 · 불 소품 빛도 그림 0.
- **그림이 필요한 곳**:
  1. 레이어 방식이 동작할 때 **절벽 앞면**(높은 레이어 가장자리 = 공식 「높이 타일 64×2 · 윗면 밝게」 규격의 앞면 그림). 지금 9조각 테두리(`border-atlas`)로 임시 대체는 가능하나 레이어 경계에서 어색할 수 있다(추정).
  2. **같은 빛 방향 그림자가 들어간 장식** — 엔진 그림자가 없으므로 「통일된 그림자 방향」은 그림 규격으로만 된다(기획 59 §5 요청서 항목 2 · 기획 60 §2-4).
  3. 재 낱알 같은 **전용 입자 모양**을 원하면 SpriteParticle용 작은 그림 1~2장(선택).
  4. Sprite 오버레이 빛(창살 빛·문틈 빛 모양)을 원하면 빛 모양 그림 1장씩(선택).

---

## 5. 왜 이렇게 됐나 (짧게 · 재발 방지용)
- 66장을 **빌더(코드)로 결정적으로 다시 짓는 공정**이라, 메이커 UI에서 손으로 하는 기능(타일 팔레트 칠하기·레이어 패널·머티리얼 만들기)은 공정 밖에 있었다. 엔티티로 표현할 수 있는 것은 전부 빌더로 끌어왔고, 그 결과 「그림을 더 깐다」가 기본 해법이 됐다.
- 머티리얼은 속성 이름이 문서에 없어 **메이커에서 샘플 1회**가 필요하다(`material.md` §3.3). 빌더 공정에 넣으려면 이 1회가 선행 조건이다. 이 문턱 때문에 0이었다(추정).
- 조명은 DarkVision이 게임 규칙(시야)으로 먼저 들어와 「연출용 빛」 층이 따로 없었다. 연출 빛(깜빡임·색·소품 빛)은 같은 서비스·컴포넌트에 얹으면 된다.
- 재발 방지 제안: 새 맵 연출 요구가 오면 「그림을 더 깔기」 전에 이 문서 §3 표의 내장 기능부터 검토한다(엔티티를 늘리지 않으므로 로딩 위험이 작다).

## 6. 미확인 · 메이커로 확인할 것
1. RectTile + `KinematicbodyComponent` 아바타가 밟은 타일의 맵 레이어로 SortingLayer가 바뀌는지(단계 1).
2. 맵 레이어가 여럿일 때 OverlayLight Global 1개가 모든 층에 걸리는지(「한 SortingLayer에 Global 여럿 불가」 문장만 있음).
3. GrassMovement·UVScroll·Additive·Vignette 머티리얼 속성 이름(메이커 샘플) · Tiled 스프라이트에 UVScroll을 걸었을 때 이음 · DarkVision `Color` 곱과의 겹침.
4. DropShadow 셰이더가 실제로 그리는 모양(문서 설명은 「TargetColor 색에 그림자」뿐).
5. OverlayLight 수가 늘 때 모바일 비용(공식 수치 없음) · Sprite 타입 빛에 animationclip을 쓸 수 있는지(`PlayRate` 속성은 있음).
6. 동시 위치 소리 수 한도 · 클라이언트 재생과 설정 음량 연결 방식.

## 근거 파일
- 공식 가이드 발췌: `docs/evidence/2026-11-02-maker-native/doc-excerpts.txt`
- 사용 실태: `docs/evidence/2026-11-02-maker-native/native-usage.json` · `native-usage.cjs`(MapBuilder 읽기 전용)
- 엔진 정의: `Environment/NativeScripts/Component/{LightComponent,OverlayLightComponent,AreaParticleComponent,SoundComponent,CameraComponent,SpriteRendererComponent,MapLayerComponent}.d.mlua` · `Service/OverlayLightService.d.mlua` · `Enum/{AreaParticleType,BasicParticleType,ShaderType}.d.mlua`
- 스킬 참고: `.claude/skills/msw-general/references/{platform-rect,tile,material,entity}.md` · `.claude/skills/msw-general/models/`
- 우리 공정: `tools/build/handmade/lib.cjs`(:37 · :262-274 · :343 · :955-958 · :1263-1272 · :1297-1300) · `tools/build/maps.cjs:133,158` · `RootDesk/MyDesk/Ambience/{DarkVision,TorchLight,MapAmbience,SoundDirector}.mlua` · `RootDesk/MyDesk/Models/Objects/Brazier`(ModelBuilder snapshot: Transform·Sprite·TorchLight 3개) · `RootDesk/MyDesk/Data/GameData.mlua:215` · `Global/WorldConfig.config` · `data/maps.csv`(wasteland 행) · `data/handmade/wasteland.{txt,csv}` · `data/art_sprites.csv`
- 선행 문서: 기획 51(`51-mood-tint-20261101.md` 안 B 색 표) · 기획 59 · 기획 60
