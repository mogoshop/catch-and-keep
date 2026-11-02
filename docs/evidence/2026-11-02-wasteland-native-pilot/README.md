# 기획 61 황무지 파일럿 — 메이커 내장 기능 0~6단계 (11-02 · 코덱스 그림 0장)

기준 문서: `docs/design/61-maker-native-map-composition-20261102.md` §4 · §6. 대상 `map/wasteland`(노말 · RectTile `TileMapMode 1`) + 악몽·지옥 복제(빌드 공정으로만).
메이커: 표식 `MAKER-FREE` 확인 뒤 14:28~14:56 혼자 사용 · 플레이 6회(A 기준 PC · B 기준 iPad + 레이어 시험 · C 적용 iPad · D 적용 PC · E 불꽃 수정 뒤 캡처 · F 안개·바람선 알파 수정 뒤 확인) · `maker_save` 0 · 끝에 편집 모드·PC 미리보기로 원복.
시험 캐릭터: 슬롯 3 「핏빛망령」 Lv4 노말 · 방 입장 직후 방 서버에서 `PlayerSave.IsLoadSuccess=false`(저장 끔) + 무적 타이머 → 캐릭터 값 변화 저장 0.
측정 방법: 로딩 = 게임 로그 `[VRF] map transition shown Xs → wasteland`(덮개~맵 표시) · FPS 대용 = 클라이언트 `_TimerService:SetTimerRepeat(…, 0.001)` 5초 호출 수/초(스크립트 갱신 빈도 — 메이커는 로직이 약 60Hz라 실제 렌더 FPS가 아니다 · 같은 방법 전후 비교만 의미) · 엔티티 = MapBuilder 파일 수(기준) + 실행 중 맵 자식 재귀 수(몬스터 포함 · 참고).
로그 원문은 `logs/`(게임 로그에서 [VRF]·오류만 추린 것), 캡처는 `before/`·`after/`·`layer/`.

## 0. 기준 측정 (변경 없음 · 플레이 A·B)

| 항목 | 값 | 근거 |
|---|---|---|
| 엔티티 (파일) | **853** (MapBuilder `getMapInfo`) | 기획 60 값과 같음 |
| 엔티티 (실행 중 맵 자식 재귀) | 873 (몬스터 29 소환 포함 · 참고값) | `logs/0-baseline.txt` 14:33:19 |
| 첫 입장 로딩 | PC **1.63초** · iPad 미리보기 **1.62초** (방마다 첫 입장) | 0-baseline 14:32:46 · 1-session-B 14:40:02 |
| 두 번째 입장 (마을 → 황무지) | PC 1.74초 | 0-baseline 14:35:33 |
| 같은 맵 이동(캡처용) | 1.15~1.16초 ×5 | 0-baseline |
| FPS 대용 (PC FHD · 줌 80) | 51.3 · 52.8 /초 | 0-baseline 14:33:19 · 14:35:54 |
| FPS 대용 (iPad 5세대 미리보기 · 줌 80) | 52.6 /초 | 1-session-B 14:40:21 |
| 전체 조명 | 밝기 0.32 · 시야 5.0 · 색 = 액트 1~3 기본 (0.55,0.6,0.85) | `[VRF] DarkVision wasteland 밝기 0.32` |

같은 자리 캡처 6장(플레이어를 `PlayerTravel:Go`로 세우고 줌 80 · PC FHD) — 전후 비교는 같은 좌표:

| # | 자리 | 좌표 | 파일 |
|---|---|---|---|
| 1 | 서문 (화로 Torch1 곁) | (-29.5, 0.5) | `before/1-westgate-x-29.5-y0.5-z80.png` (+ iPad `before/ipad-1-…`) |
| 2 | 장면판 | (-22.5, 1.5) | `before/2-plate-x-22.5-y1.5-z80.png` |
| 3 | 교차로 | (0.5, 0.5) | `before/3-crossroad-x0.5-y0.5-z80.png` |
| 4 | 예배당 (묘지 고원) | (4.5, 16.5) | `before/4-chapel-x4.5-y16.5-z80.png` |
| 5 | 시체 구덩이 (해골 탑) | (-1.5, -12.5) | `before/5-pit-x-1.5-y-12.5-z80.png` |
| 6 | 동문 | (30.5, 0.5) | `before/6-eastgate-x30.5-y0.5-z80.png` |

몬스터 위치·무리는 매번 다르다(같은 자리지만 몬스터는 비교 대상 아님).

## 1. 맵 레이어 시험 (격리 · 판정 B)

- 시험 맵: `layer-test.cjs`가 `map/wasteland`를 `MapBuilder.fromTemplate`로 복사한 `map/layertest61.map`(856 엔티티 · 생성기 빼고) — **원본 불변**. 맵 레이어 2(`MapleMapLayer2` · `MapLayerName Layer2` · `LayerSortOrder 1`) + `RectTileMap2`(SortingLayer `MapLayer1` · 큰길 x -24~-19 · y -1~1 = 18칸 바닥 타일 266) + 레이어 2 석상(MapLayer1/0 · (-21.5, 2.1)) · 비교 석상(MapLayer0/0 · (-27.5, 2.1)).
- 들어가기: 시험 맵은 데이터에 없다 → 메이커 서버 스크립트로 `_GameData.MapInfo`에 임시 행을 넣고(실행 중만) 새 게임 방을 열어 `PlayerTravel:Go('layertest61', …)`. (`_RoomService:CreateInstanceRoom`·`MoveUserToInstanceRoom`을 메이커 스크립트에서 직접 부르면 nil이 돌아와 방이 안 열렸다 — 깊이 맵 `depth`도 같음.)
- 걷기: 실제 방향키 입력(오른쪽 2.2초 → 위 0.7초 → 오른쪽 2.5초 → 왼쪽 4초) + 같은 맵 이동으로 띠 가운데 (-21.5, 0.5)에 세워 3초 · 클라이언트 0.1초 기록기가 `AvatarRendererComponent.SortingLayer/OrderInLayer`와 그 칸에 레이어 2 타일이 있는지(`RectTileMap2:GetTile`)를 바뀔 때만 찍음.
- 결과 (`logs/1-session-B-ipad-layer.txt`):
  - `[VRF] NP layer start map=layertest61 ar=Default/4 ign=false tm1=MapLayer0 tm2=true tm2layer=MapLayer1 st2=MapLayer1 st1=MapLayer0` — 레이어 2 타일맵·석상은 실행 중 MapLayer1로 실렸다
  - `pos=(-23.89,1.50) cell=(-24,1) ar=Default/4 on2=true t2=true` — **레이어 2 타일 위에서도 아바타는 Default/4**
  - `pos=(-21.50,0.50) cell=(-22,0) ar=Default/4 t2=true` · `hold 3s … ar=Default/4` — 띠 한가운데 3초 서도 그대로
  - 화면(`layer/ipad-c-…`·`ipad-d-…`): 레이어 2 타일은 숨긴 레이어 1 타일과 달리 회색 타일 그림 그대로 보였고(MapLayer1이 MapLayer0 맵 그림 위), 아바타는 늘 그 위(Default)에 그려졌다. 레이어 2 석상 앞뒤도 바뀌지 않음.
- **판정 B — RectTile + `KinematicbodyComponent` 아바타는 밟은 타일의 맵 레이어로 SortingLayer가 바뀌지 않는다(Default 고정).** 지금 `-top` 잘라 붙이기(Default/5) + TopFade가 엔진 한계 안의 정답이다. 기획 61 §6-1 미확인 → 확인됨. `-top`·TopFade·앞 머리 규칙 제거 검토안은 쓰지 않는다(전제가 성립하지 않음). §6-2(레이어 여럿일 때 Global 빛)는 시험 맵에서도 전체 조명이 레이어 2 타일을 같이 어둡게 했다(화면) — 판정 B라 더 볼 이유는 없음.
- (참고 · 비권장 그대로) 스크립트로 아바타 SortingLayer를 칸마다 바꾸는 대안은 이번에 시험하지 않았다.
- 정리: 시험 맵은 끝나고 `layer-test.cjs --rm`으로 지운 뒤 refresh(14:49) — 저장소에 남는 것은 이 도구뿐.

## 2~6. 적용 (그림 0 · 황무지 3판만 빌드 공정으로)

바꾼 파일: `data/maps.csv`(열 3개 tint·tintMix·weather — wasteland만 `#A9C6FF`·0.16·wind, 나머지 빈칸) · `data/handmade/specs/native_pilot.cjs`(새 파일 — 파일럿 맵 표) · `data/handmade/wasteland.csv`(kind fog 1줄 · kind sound 1줄) · `tools/build/handmade/lib.cjs`(파일럿 표 읽기 · 발밑 그림자 훅 · fog/sound 행 · 화로 OverlayLightComponent · ambience 열) · `tools/build/maps.cjs`(ambience weather·tint 같은 규칙) · `RootDesk/MyDesk/Ambience/{TorchLight,MapAmbience,DarkVision}.mlua` · `map/wasteland{,_nm,_hell}.map`(`node tools/build/handmade/build.cjs wasteland` 결과 · 엔티티 id 불변, displayOrder만 다시 매김) · `tests/quality/native_pilot.lua`(새 · 53 검사) + `run.py`·`README.md`.

| 단계 | 결과 | 검증 (로그·캡처) | 롤백 단위 |
|---|---|---|---|
| 2-1 화로 깜빡임 | **했음** — 화로 11개 인스턴스에 `OverlayLightComponent`(색 1/0.55/0.25 · 세기 0.9 · 반경 0.66~2.2) + `TorchLight.Flicker 0.15`. DarkVision은 그 화로엔 서비스 빛을 만들지 않고 컴포넌트 세기를 0.12~0.3초 난수 간격으로 base×(1−0.15)~base 사이에서 바꾼다(9칸 안만) | `[VRF] torch flicker n=1..11` · `NP torch1 light=true I=0.811 r=0.66/2.20` · 5초 동안 세기 **0.767~0.898** (`logs/3-…` 14:47:42) · 연속 캡처 3장 화로 둘레 평균 밝기 141.6/143.6/146.9 (`after/1b`·`1c`) | `native_pilot.cjs`에서 `torchFlicker` 지우고 빌드 → 서비스 빛 · 깜빡임 0 |
| 2-1 불꽃 입자 | **했음** — 9칸 안 화로에 `ToonFireTorch`(높이 0.3 · 0.45배 · 색 1/0.62/0.3/0.85). 첫 값(높이 0.55 · 기본 색)은 그림 불꽃 위에 창백한 푸른 흰 덩어리로 떠서 고쳤다(플레이 D→E) | `after/1-westgate…` 화로 크롭 = 그림 불꽃 위로 주황 불꽃이 흔들림 | 위와 같음 (Flicker 0이면 불꽃도 없음) |
| 2-2 전체 빛 색 | **했음** — `maps.csv tint/tintMix` → MapAmbience.Tint/TintMix → EnterMap: 기존색×(1−0.16) + 틴트×0.16 (액트 4 → 틴트 → 각성 → 심도 순으로 뒤가 덮음) | `[VRF] DarkVision mood wasteland #A9C6FF sG 0.16 → (0.568,0.628,0.874)` (C·D·E·F 매번) · 화면은 어두운 가장자리가 조금 더 푸름(교차로 비교) | `maps.csv` tint 빈칸 + 빌드 |
| 2-3 불 소품 빛 | **안 함(문서대로)** — 황무지엔 켜진 불 소품이 없음(§4 단계 2-3) | — | — |
| 3 발밑 그림자 | **했음** — 역할표 feature·structure 장식 9개 발밑에 `FOOT_SHADOW`(가로 = 그림 폭×0.7 · 세로 0.9배 · 색 알파 0.55 × 그림 최대 알파 0.55 ≈ 화면 0.3 · 장식보다 z +0.002 뒤 · 이름 `ArtShadow1..9`) | 엔티티 853 → **862 (+9 ≤ +30)** · `[VRF] DarkVision … 맵 그림 836개 뒤로`(전 827 · +9) · 구덩이 해골 탑 전후 차이 그림에 타원(탑 발 아래로 반쯤 보임 · 어두운 바닥이라 옅다) | `native_pilot.cjs` footShadow 지우고 빌드 |
| 4-a 바람선 | **했음** — `maps.csv weather=wind` → `Windlines`(맵 전체 · 개수 2 · MapLayer0/39). 알파 0.15는 밝기 0.32 어둠에서 안 보여 **0.3**으로 올림(플레이 F) | `[VRF] weather wind on wasteland n=1` | `maps.csv` weather 빈칸 + 빌드 |
| 4-b 묘지 고원 안개 | **했음** — 배치표 `fog,FogCalm,0.5,17.5 … w=31;h=11` → MapAmbience.Fog → `FogCalm` 영역 1개(엔티티 0). 알파 0.3은 거의 안 보여 **0.5**로 올림 | `[VRF] fog zones 1 on wasteland (FogCalm/0.5/17.5/31/11/0.5)` · 예배당 전후 차이 그림에 안개 덩어리(밝기 차 몇 단계 · 눈으로는 옅다) | 배치표 fog 줄 지우고 빌드 |
| 5-a 위치 환경음 | **했음** — 서문 화로 Torch1에 `SoundComponent`(장작 타닥 `302b0b35a3424b7bafd59abced9bae00` = msw-search effect `audioclip-7674` · 거리 4 · Loop · PlayOnEnable · 카메라 리스너 · 음량 0.5 × 설정 환경음 음량) · 새 엔티티 0 | `[VRF] amb sound Torch1 base 0.50 dist 4.0 playing=true` · `NP torch1 … sound=true playing=true vol=0.50` (소리 자체는 메이커 미리보기에서 귀로 확인 못 함 — 아래 미확인) | 배치표 sound 줄 지우고 빌드 |
| 5-b GrassMovement 머티리얼 | **건너뜀 — 사용자 손 필요.** 셰이더 속성 이름이 문서에 없다(`mlua_document_retriever` 2회: UVEffect 목록·설명만). `material.md` §3.3대로 메이커 Workspace `[+]` → Material → Shader `UVEffect/GrassMovement`로 샘플 1개를 만들어야 속성 이름을 읽을 수 있다(메이커 UI 조작 · 이 레인 범위 밖) | — | — |
| 6 성능 | 아래 표 — **통과** | | |

### 6. 통과선 판정

| 지점 | 기준(단계 0) | 적용 뒤 | 통과선 | 판정 |
|---|---|---|---|---|
| 첫 입장 로딩 | PC 1.63 · iPad 1.62 (평균 1.625초) | iPad 1.63 · PC 1.66 · 1.62 · 1.67 (평균 **1.645초 · +0.02**) · 두 번째 입장 1.74 → 1.71 | +0.15초 이내 | ✅ |
| 엔티티 (파일) | 853 | **862** | ≤ 900 | ✅ |
| FPS 대용 PC (줌 80) | 51.3 · 52.8 | 52.5 · 52.4 · 52.5 | 30 이상 · 감소 ≤10% | ✅ (변화 −0.6% ~ +2%) |
| FPS 대용 iPad 미리보기 | 52.6 | 53.1 | 같음 | ✅ |
| 오버레이 빛 | 서비스 Spot 화로 11 + 플레이어 등 | 화로 11은 엔티티 컴포넌트(같은 수) · 깜빡임은 9칸 안만 | 컬링 | 화면 밖 화로는 세기 고정·불꽃 없음(FlickerStep) |
| 파티클 | 맵 0 | 영역 2(바람선 1 · 안개 1) + 9칸 안 화로 불꽃 | Engine FPS | 위 FPS 대용 변화 없음 (메이커 Profiler는 UI 조작이라 못 봄) |

- 실행 중 맵 자식 수는 873 → 911이었지만 몬스터 무리 구성(매 입장 다름)이 섞인 값이라 판정에 쓰지 않았다. 파일 기준 +9.
- 오류: 플레이 C~F 로그에 Error·LEA·LWA 0 (SelfTest 의도 실패 1줄 제외) · 메이커 build 로그 Error 0(14:28 · 14:49 · 14:53 재컴파일).

### 전후 캡처 6쌍

`compare-6pairs.png`(왼쪽 전 · 오른쪽 뒤) · 원본 `before/<n>` ↔ `after/<n>` 같은 파일 이름. 3·4번 뒤 캡처는 알파 상향(플레이 F) 뒤 것, 1·2·5·6번은 불꽃 수정(플레이 E) 뒤 것. iPad 한 쌍 `before/ipad-1-…` ↔ `after/ipad-1-…`(불꽃 수정 전 C).
눈으로 본 차이: 화로 불꽃이 움직이고 빛이 미세하게 흔들린다(가장 잘 보임) · 어두운 가장자리 색이 조금 푸르다 · 발밑 그림자·안개·바람선은 밝기 0.32 어둠에서 옅다(전후 차이 그림으로만 뚜렷) — 더 진하게 하려면 다음 회차에 안개 알파·그림자 알파를 사용자와 같이 정한다.

## 남은 것 · 사용자 손

1. **GrassMovement 샘플 머티리얼** — 메이커에서 `RootDesk/MyDesk/Materials/`에 GrassMovement 셰이더 머티리얼 1개 생성(이름 예 `GrassSway`) → 그 파일을 읽어 속성 이름 확보 → 생성기가 `waste-dry-shrub`·장면판 풀 소품에 `MaterialId` 한 줄(단계 5-b).
2. 소리를 귀로 듣는 확인(서문 화로 4칸 안에서 장작 소리 · 멀어지면 줄어듦) — MCP로는 `IsPlaying=true`까지만.
3. 실제 iPad 기기 FPS·발열(이번 값은 맥 메이커의 iPad 5세대 미리보기).

## 미확인

- FPS 대용은 스크립트 갱신 빈도(메이커 로직 약 60Hz 상한) — 렌더 FPS·메이커 Profiler Engine FPS는 못 봄.
- SoundComponent `SetCameraAsListener` 거리 감쇠가 줌 80 카메라 기준으로 맞는지.
- 엔티티에 붙인 OverlayLightComponent의 빛 중심은 화로 발(서비스 빛은 0.4칸 위였음) — 화면에선 차이가 작았다.
- 레이어 시험은 RectTile만(MapleTile·SideView는 대상 아님).
