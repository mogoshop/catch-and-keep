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
