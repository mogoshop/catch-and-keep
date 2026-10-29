# 바닥 섞기 시범 — 상하 의사난수 섞기 중지 + 경계 이음 보정 유지 (2026-10-29 저녁)

근거: 10-29 21:03 코덱스 위임 승인 결정 2 (`codex-decisions-response-2103.txt` · `approval-floor-review-2103.json`).
범위: 집게 동굴 1층(`crabcave1`)·폭풍의 눈(`stormeye`) **노말 2장만** 격리 산출. `map/`·악몽/지옥 복제본·다른 맵은 바꾸지 않았다. 10맵×3난이도 확대는 코덱스가 이 결과를 보고 정한다.

## 시범 모드 정의 (`tools/build/handmade/lib.cjs` `FLOORMIX_Y_MODES`)

- 이름: **「상하 의사난수 섞기 중지 + 경계 이음 보정 유지」** (`--floormix-y=seam-only`). 기본은 `mix`(871b60b4 그대로) — 전체 빌드는 바뀌지 않는다.
- 끄는 것: 줄(행) FlipY를 칸 좌표 의사난수로 고르던 것(`floorFlipY`)만.
- 그대로 두는 것: 잘린 줄의 경계 방향(`decide`의 hard cut) · `segs`의 필요 뒤집기 · `py`(뒤집은 줄은 끝 장 가운데가 축) · 열 FlipX · 맵 전체 그림 격자 원점 · 부분 타일 정렬 · `MIX_Z` · 에셋/RUID/색/배율 · 통행/충돌/기능 엔티티 좌표.
- 그래서 **경계에서는 FlipY가 남는다 — 「모든 FlipY=0」이 아니다.**

## 산출물

| 파일 | 내용 |
|---|---|
| `maps/crabcave1.map` · `maps/stormeye.map` | 시범 모드 노말 맵 (엔티티 id·EntryKey는 `map/`의 것을 이어 받음 — 바로 바꿔 끼워 비교 가능) |
| `crabcave1-floortrial-zoom80.png` · `stormeye-floortrial-zoom80.png` | 오프라인 비교판 — 왼쪽 현재(871b60b4) · 오른쪽 시범, 같은 카메라·줌 80(16×9칸) |
| `tools/export_floor.cjs` · `tools/render_floor.py` | 비교판을 만든 스크립트 (아래 재현) |

- 다시 지으면 내용은 같고, 현재 `map/`에 없는 새 경로 조각(폭풍의 눈 `ArtZone12_2` 1개)만 빌드마다 새 id를 받는다.
- 메이커는 `map/` 밖 `.map`을 맵으로 등록하지 않는 것으로 알고 있으나(등록 경로 RootDesk·map·ui), refresh 뒤 맵 목록에 같은 이름이 둘 보이면 이 폴더의 `maps/`를 치우고 알린다.

빌드 통계 (`MIXDEBUG=1 … --check`):

| 맵 | 상하 뒤집은 줄 조각 (현재 → 시범) | FlipY 조각 (현재 → 시범) | 바닥 섞기 조각 | 경계 보정 없이 정책으로 정한 줄 (사각형별) | 끝부터 깐 조각(격자 밖) |
|---|---|---|---|---|---|
| 집게 동굴 1층 | 51/99 → 0/54 | 103 → 0 | 204 → 103 (안 뒤집은 줄이 이어져 합쳐짐) | 183 | 0 → 0 |
| 폭풍의 눈 | 44/82 → 43/82 | 126 → 125 | 231 → 231 | 28 | 0 → 0 |

시범에서 남은 FlipY는 모두 경계 보정(잘린 줄의 방향 · 필요 뒤집기)에서 나온다. 폭풍의 눈은 담 윗면 맵이라 섞는 조각을 같은 그림 칸 밖으로 늘릴 수 없어 잘린 그림 줄이 많고, 그 방향을 경계 보정이 정한다 — 시범에서 실제로 바뀐 것은 뒤집은 줄 조각 1개(FlipY 조각 126→125)뿐이다. 집게 동굴 1층은 담 윗면이 아니라 잘린 쪽을 벽·다른 구역 밑으로 늘릴 수 있어 경계 보정이 뒤집기를 요구한 줄이 없다(FlipY 0).

## 보존 확인 (현재 `map/` 대비)

- 통행·충돌: 두 맵 모두 RectTileMap 칸(2400칸) 같음.
- 바닥 섞기 조각(ArtZone*) 밖 엔티티: 폭풍의 눈 569개 모두 같음. 집게 동굴 1층 465개는 표시 순서 번호만 101 당겨짐(앞의 바닥 조각이 233→132로 줄어서) — 위치·컴포넌트·포털·화로·스포너 같음. 다른 바닥 그림 조각도 같음.
- 구멍: 현재 섞기 조각이 꽉 덮는 칸(집게 동굴 426칸 · 폭풍의 눈 779칸)을 시범 조각도 모두 꽉 덮음(칸마다 4×4점).
- 이음: 두 모드 모두 「끝부터 깐 조각」 0 — 모든 조각이 맵 전체 1.28칸 그림 격자에 맞는다(열·줄을 통째로 뒤집어 이음 없는 타일 가장자리가 그대로 맞닿음).
- 비대상 맵: 기본 모드로 액트 3 설계도 맵 16장을 임시 폴더에 지어 커밋본 `map/`과 바이트 비교 — 16장 모두 같음.

## 관찰 (오프라인 비교판 · 점수 없음)

**집게 동굴 1층** (`crabcave1-floortrial-zoom80.png`)
- 줄끼리 돌이 위아래로 마주 보며 만들던 네 갈래 꽃·마름모 꼴이 시범에서는 보이지 않는다.
- 좌우 뒤집기 축(그림 열 경계)마다 생기는 나비·세로 기둥 꼴은 그대로 남고, 줄 뒤집기가 없어져 같은 돌이 1.28칸마다 위아래로 똑같이 늘어서 세로 기둥이 화면 위아래로 길게 이어져 보인다.
- 뒤집기가 없던 원래 바닥(`../2026-10-29-codex-apply/floormix-modes-offline.png` 1번)의 뚜렷한 사선 줄은 돌아오지 않았다. 대신 같은 돌 줄이 위아래로 되풀이되어 가로 띠가 보인다.
- 바닥 안 구멍·곧은 금은 보이지 않는다.

**폭풍의 눈** (`stormeye-floortrial-zoom80.png`)
- 경계 보정이 줄 방향을 거의 다 정해 시범과 현재가 거의 같다 — 보스방 바닥의 세로 대칭·꽃 꼴도 그대로 보인다. 이 모드로는 폭풍의 눈 거울 무늬가 줄지 않는다.
- 구멍·곧은 금은 두 쪽 모두 보이지 않는다.

## 한계

- 오프라인 판은 바닥 그림(ArtFloor·ArtZone*)만 그린다 — 장식·세트·조명·캐릭터·벽 그림은 없고, 설계도 벽 칸은 어두운 덮개다. 엔진 반복 그리기 규칙(첫 장 왼쪽·아래부터, 뒤집으면 첫 장 가운데 축)은 871b60b4 메이커 확인으로 정한 lib.cjs 주석을 따랐다.
- 카메라 중심은 871b60b4 메이커 캡처(`../2026-10-29-codex-apply/*-floormix-before-after-zoom80.jpg`)의 장식 자리(바닷물 웅덩이·해초 더미·물거품 줄)로 맞춘 어림이다: 집게 동굴 1층 (-14.8, -8.8) · 폭풍의 눈 (-12.0, 2.4), 보이는 칸 16×9 (PC 12.8×7.2 ÷ 0.8).
- `floormix-modes-offline.png`를 만든 스크립트는 저장소에 남아 있지 않아(871b60b4에 그림만), 같은 원리(원본 PNG 반복·뒤집기)로 맵의 실제 조각을 그리는 스크립트를 `tools/`에 새로 두었다.
- 메이커 실화면 비교는 하지 않았다(다음 담당 — 아래).

## 재현

```
# 시범 맵 (map/은 그대로 · 노말만)
node tools/build/handmade/build.cjs crabcave1 stormeye --floormix-y=seam-only --out=docs/evidence/2026-10-29-floor-trial/maps
# 통계
MIXDEBUG=1 node tools/build/handmade/build.cjs crabcave1 stormeye --check [--floormix-y=seam-only]
# 비교판 (원본 PNG는 assets/codex-a3-handmade-v1 — 커밋 제외라 메인 작업 폴더 assets/를 가리킨다)
node docs/evidence/2026-10-29-floor-trial/tools/export_floor.cjs "$PWD" map/<id>.map cur.json
node docs/evidence/2026-10-29-floor-trial/tools/export_floor.cjs "$PWD" docs/evidence/2026-10-29-floor-trial/maps/<id>.map trial.json
python3 docs/evidence/2026-10-29-floor-trial/tools/render_floor.py --cur cur.json --trial trial.json --center -14.8 -8.8 --title "집게 동굴 1층" \
  --out docs/evidence/2026-10-29-floor-trial/crabcave1-floortrial-zoom80.png --assets <assets 폴더> --sprites data/art_sprites.csv --blueprint data/handmade/crabcave1.txt
```

## 메이커 실화면 (다음 담당 — 메이커는 한 번에 한 담당)

1. 플레이 중지 → 시범 맵을 `map/`에 끼운다: `node tools/build/handmade/build.cjs crabcave1 stormeye --floormix-y=seam-only --out=map` (노말만 · 악몽/지옥은 그대로).
2. 5초 뒤 touch → refresh 한 번 → 실제 방 입장으로 두 맵에 들어가 위 카메라 중심 근처에서 줌 80(`ZoomTo`)으로 871b60b4 캡처와 같은 자리 촬영.
3. 원복: `git checkout -- map/crabcave1.map map/stormeye.map` → refresh. `git status`로 `map/`이 깨끗한지 확인.
