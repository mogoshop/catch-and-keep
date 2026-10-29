# ART-I — I-1 「저항 붕괴」 새 표식 연결 · I-2 따개비 돌 바닥 3변형 두 노말 맵 격리 시범 (2026-10-29 밤)

근거: 코덱스 위임 승인 22:52 — 공유 폴더 `quality-feedback-art-I-2252.txt` · `quality-art-I-decision-2252.json`(I1 A 채택 · I2 v2/v3/v4 채택 · 두 노말 맵 시범까지만) + 요청서 `docs/requests/codex-next-20261029.md` I절.
실행: HEAD **8d8c452f**(= origin/main) + 미커밋 변경(아래 「바뀐 파일」). 메이커는 이 담당 혼자 썼다(23:08~23:19). 판정은 하지 않는다 — 결과를 보고 코덱스가 정한다. 오프라인 합성판을 실행 통과로 쓰지 않았다(아래 캡처는 모두 메이커 실화면).

## 1. 새 RUID (그룹 OJYYQ · 23:04 업로드 · 옛 RUID 재사용 없음)

| 키 | 원본 (해시로 확인) | 새 RUID | 속성 (업로드 직후, 처음 불리기 전) |
|---|---|---|---|
| `mark_resist` (I-1 A 「깨진 방어막 고리」) | `assets/codex-common-backlog-v1/samples/mark_resist-cand-a.png` sha256 `0dd8739d17075104ccd346a46a1e4e2b868b95134db54fbe2c533998c0abe70a` (= `png/mark_resist.png`) · 32×32 | `a268346042e644ec96ad359450167f76` (이름 `mark_resist_i1a`) | 피벗 0.5/0.5 · Point · Clamp |
| `a3-barnacle-stone-floor-r2-v2` | `assets/codex-a3-floor-variants-v1/png/…-v2.png` sha256 `61a0f20a…1af711` · 128×128 | `8740df7f8f304fb3b80c0162a4658339` | 0.5/0.5 · Point · Clamp (현행 r2 `0c0475e2…`와 같은 값) |
| `a3-barnacle-stone-floor-r2-v3` | `…-v3.png` sha256 `804c2d4f…4adb89` | `5bf0d63ce6a848a98e1e3775ee7ac3c7` | 같음 |
| `a3-barnacle-stone-floor-r2-v4` | `…-v4.png` sha256 `a416b1da…ebeb2a` | `1cb8bebbd6eb466a8097e70df9e361fc` | 같음 |

- 업로드: `tools/msw_mcp_call.cjs upload-res`에 scratchpad 복사본 팩(`resource-mapping.csv` · `resource-properties.csv`)을 넘김 — `assets/`는 읽기만. 같은 호출 안에서 RUID를 받자마자 `asset_update_resource_storage_info`로 피벗을 넣었고, `asset_get_group_resource_metadata_bulk`로 4장 모두 `pivot_x 0.5 · pivot_y 0.5 · filter Point · wrap Clamp` 확인(현행 r2 · 옛 `mark_resist`와 같은 네 값).
- 옛 `mark_resist` RUID `32d6d08928a0448db315fb8b6576ba62`는 데이터에서 빠지고 저장소에만 남는다(재사용 안 함). 다른 10개 표식 · 29장 · 피벗은 건드리지 않음.

## 2. 바뀐 파일 (커밋 안 함 — 조정자 몫)

| 파일 | 내용 |
|---|---|
| `data/ui_icons.csv` | `mark_resist` 한 줄만: RUID → `a2683460…` · 메모 |
| `data/art_sprites.csv` | `a3-barnacle-stone-floor-r2` 바로 아래 `-v2`·`-v3`·`-v4` 3줄 (floor 128×128) |
| `RootDesk/MyDesk/Data/GameData.mlua` | `node tools/gen_data.cjs` 생성 — `UiIcons["mark_resist"]` 한 줄만 바뀜 |
| `tools/build/handmade/lib.cjs` | `;floormix` 바닥 변형 정책 `variants`(opt-in) — 아래 3절 |
| `tools/build/handmade/build.cjs` | `--floormix=variants` 옵션 한 줄 + 사용법 주석 |
| `docs/evidence/2026-10-29-art-I/maps/crabcave1.map` · `stormeye.map` | 격리 산출 노말 2장 (sha256 `1b37d93a…5628` · `0241a1f7…cb64`) — `map/` 커밋본은 그대로 |

## 3. I-2 빌더 정책 「variants」 — 현행 + 변형을 격자 좌표로 안정적으로 고르는 혼합 · 임의 좌우/상하 반전 없음

- 고르기: `node tools/build/handmade/build.cjs crabcave1 stormeye --floormix=variants --out=docs/evidence/2026-10-29-art-I/maps` (또는 `FLOORMIX=variants`). **기본은 `flip`(지금 그대로)** — 전체 빌드(`tools/build.cjs maps`)·다른 맵은 바뀌지 않는다. 기본 모드로 두 맵을 다시 지어 `map/` 커밋본과 **바이트가 같음**을 확인했다.
- 대상: `FLOOR_VARIANTS`에 변형이 있는 그림만(지금은 `a3-barnacle-stone-floor-r2` → [r2, v2, v3, v4], 순서 = 해시 번호 0..3 · 코덱스 `I-tile-layout-policy.json` keys 순서).
- 끄는 것: 열 FlipX · 줄 FlipY의 **칸 좌표 의사난수 선택만**(`floorFlipX`·`floorFlipY` 자리에 「안 뒤집음」).
- 그대로 두는 것: 잘린 열·줄의 경계 방향(`decide`의 hard cut) · `segs`의 필요 뒤집기(`f = !f`)·끝부터 깐 조각(local) · 조각 위치 규칙(안 뒤집은 쪽은 첫 장 가운데, 뒤집은 쪽은 끝 장 가운데가 축) · 맵 전체 1.28칸 그림 격자 원점(MIX_OX/MIX_OY = 맵 왼쪽·아래 끝) · 부분 타일 정렬 · `MIX_Z` · 색(tint)·배율 · 통행/충돌 · 피벗 · Sprite 방향. 그래서 **경계 보정이 요구한 뒤집기는 남는다**(폭풍의 눈 — 담 윗면 맵).
- 장 고르기: 조각을 그림 격자 칸 단위로 나눠(안 뒤집은 조각은 L, 뒤집은 조각은 R이 칸 경계라 나눈 칸도 같은 위치 규칙을 지킴) 칸 (열 kx, 줄 ky)마다 코덱스 좌표 해시 `u=((kx*73856093)^(ky*19349663)^20261029)&0xffffffff; u^=u>>13; u=(u*0x85ebca6b)&0xffffffff; u^=u>>16; index=u&3`로 한 장. 같은 줄에서 같은 장·같은 뒤집기가 이어지면 `segs`와 같은 이어 붙이기 조건으로 합친다. 같은 격자 칸은 어느 사각형에서 늘려 덮어도 같은 장이 나온다(겹침도 같은 무늬).
  - 주의: kx·ky는 빌더 격자(원점 x0=-w/2 · y0=-h/2+1) 기준이다. 코덱스 오프라인 판의 원점 표기(-w/2, -h/2)와 줄 번호가 1 어긋날 수 있어 **칸마다 고른 장의 배치는 코덱스 합성판과 같지 않을 수 있다**(정책·해시식은 같음).
- 빌드 통계 (`MIXDEBUG=1 … --check`, 오프라인 = 메이커 런타임 세기와 같음):

| 맵 | 바닥 섞기 조각 (현행 → 시범) | FlipX 조각 | FlipY 조각 | 장별 조각 (r2 / v2 / v3 / v4) | 좌우 뒤집은 열(경계 보정) | 상하 뒤집은 줄(경계 보정) |
|---|---|---|---|---|---|---|
| 집게 동굴 1층 | 204 → 436 | 102 → **0** | 103 → **0** | 115 / 108 / 111 / 102 | 0/54 | 0/54 |
| 폭풍의 눈 | 231 → 605 | 114 → 155 | 126 → 205 | 161 / 135 / 150 / 159 | 26/58 | 43/82 |

  폭풍의 눈은 담 윗면 맵이라 섞는 조각을 같은 그림 칸 밖으로 늘릴 수 없어 잘린 열·줄의 방향을 경계 보정이 정한다(결정 2 시범 README와 같은 이유). 시범의 FlipX/FlipY는 전부 그 보정에서 나온 것이고, 칸 단위로 나눠 조각 수가 늘어 뒤집힌 「조각」 수가 커졌다(뒤집힌 열·줄 수는 35/73 → 26/58 · 44/82 → 43/82).
- 보존 확인(현행 `map/` 대비 · `cmpmap.py`): 바닥 섞기 조각(`ArtZone*_*`) 밖 엔티티 — 집게 동굴 500개 · 폭풍의 눈 576개 모두 id·컴포넌트 같음 · RectTileMap 칸 같음. 현행이 꽉 덮는 칸을 시범도 모두 꽉 덮음(칸마다 4×4점) — 집게 동굴은 벽(`#`) 칸 8개만 시범에서 덜 덮이는데 벽 그림(z -0.02)과 맵 전체 ArtFloor 아래라 보이지 않는다(걷는 칸은 사각형 구조상 항상 덮임). 「끝부터 깐 조각」 0.

## 4. I-1 장면 — 저항 붕괴 + 낙인 + 둔화를 한 몬스터에 (PC FHD · 줌 100 · 소금 갯벌 Lv23 · icons-18 M3와 같은 맵·줌·배율)

- 캡처: `I1_PC_resist_amp_chill_same_monster.jpg`(23:11:59 전체 화면) · `_zoom.png`(×3 무손실).
- 실제 입력: 키보드 A(저항 붕괴) · S(약화의 낙인) · D(서리 혼 → 둔화) 탭(땅 찍기: 누르면 범위 원 dist=0.57 → 떼면 시전). 준비: 저장 끔 · 무적 · 저주 레벨 · 칸 배치 · Go · 마우스 모드 끔 · 클라 `SelectedTarget`(ICON18과 같은 이유 — 서버 값만 바뀌는 조준).
- 런타임 확인(23:12:25): `stormcrab#29a3fc` · `#bae190` 자식 표식 3개 = `resist=a2683460` · `amp=eb4b5e35` · `chill=10eea948`, 셋 다 배율 0.56 · 같은 높이(몬스터 위 1.10칸) · 가로 0.26칸 간격. 나머지 15마리는 [resist · amp] 2개(서리 혼은 2마리만 맞음). 대상 칸 글 「약화의 낙인 · 저항 붕괴 · 둔화」.
- 크기: 청록 고리 칠(외곽선 빼고) 21×24px(캡처 2197폭 기준) — icons-18의 「약 23px」과 같은 크기대.
- 관찰(점수 없음): 빨강 깨진 방패 · 청록 끊긴 고리(가운데 빈) · 하늘 눈송이가 한 줄에 나란히 — 고리는 방패와 실루엣이 다르고(둥근 테 + 빈 가운데 vs 속이 찬 뾰족 방패), 눈송이와는 굵기·채움이 다르다. 게 17마리가 한데 겹쳐 표식 줄이 세로로 쌓이는 ICON18-OBS-03은 그대로(이번 범위 밖).
- 한계: 게가 플레이어에게 몰려 표식 줄이 겹친 장면이다(한 마리만 떨어진 깨끗한 장면은 못 만듦). 시전 순간 연출이 덮은 캡처 2장은 뺐다(capture-map.txt). 회색조·색맹 확인은 실화면에서 하지 않았다(코덱스 회색조 합성판 참조).

## 5. I-2 메이커 실화면 — 전(현행) / 후(3변형 혼합) · 같은 카메라 · 줌 80 · PC FHD

- 카메라: `PlayerTravel:Go`로 결정 2 시범과 같은 점 — 집게 동굴 1층 (-14.8, -8.8) · 폭풍의 눈 (-12.0, 2.4), 런타임 `me` 좌표가 정확히 그 값(로그). `_CameraService:ZoomTo(80, 0)` · 보이는 칸 16×9. 카메라 감쇠(0.8) 때문에 전/후 장식 위치가 십여 px 어긋날 수 있다.
- 캡처(HUD 끔 / 켬): `I2_crabcave1_before_hudoff_zoom80.png`(무손실) · `…_hudon_zoom80.jpg`(q92) · `I2_crabcave1_after_…` · `I2_stormeye_before_…` · `I2_stormeye_after_…` + 나란히 판 `I2_<맵>_before_vs_after_zoom80.jpg` · 가운데 1000×600 원본 픽셀 판 `I2_<맵>_before_vs_after_center_1x.png`.
- 런타임 세기(맵 루트 자식 `ArtZone*_*` SpriteRenderer): 전 crabcave1 204 · FlipY 103 · FlipX 102 · RUID 1종 / stormeye 231 · 126 · 114 · 1종 → 후 crabcave1 436 · **0 · 0** · 4종(115/108/111/102) / stormeye 605 · 205 · 155 · 4종(161/135/150/159) — 오프라인 빌드 통계와 같다(교체 맵이 실제로 올라옴).
- 화면 숫자(HUD 끔 화면 가운데 1000×600 · 장식·캐릭터 포함이라 참고): 밝기 crabcave1 0.451 → 0.454 · 명도 표준편차 48.6 → 48.0 / stormeye 0.512 → 0.513 · 49.7 → 48.7. 열·줄 인접 픽셀 차의 최대/중앙값 비(곧은 금이면 튐) crabcave1 열 2.70 → 2.58 · 줄 2.07 → 1.98 / stormeye 열 2.54 → 2.47 · 줄 2.10 → 1.76 — 시범에서 새로 튀는 선 없음(최댓값은 캐릭터·장식 가장자리).
- 관찰(점수 없음):
  - **집게 동굴 1층**: 현행의 마주 보는 꽃·마름모 · 좌우 대칭 나비 · 세로 기둥이 화면에서 사라지고, 크기가 다른 조약돌이 고르지 않게 깔린 돌바닥으로 보인다. 돌 대비·회청 색은 그대로. 큰 돌 무리가 1.28칸 간격으로 비슷하게 되풀이되는 자리는 군데군데 보인다(같은 장이 이웃 칸에 오면). 곧은 금·구멍은 보이지 않는다.
  - **폭풍의 눈**: 현행의 세로 대칭 기둥·꽃 꼴이 크게 줄었다 — 경계 보정 뒤집기(FlipX 155 · FlipY 205 조각)가 남아 있지만 칸마다 장이 달라 거울 짝이 맞지 않는다. 곧은 금·구멍은 보이지 않는다. 후 캡처 왼쪽 위에 보스(익사한 제독)가 보인다 — 숨김 스크립트는 `MonsterStatus`가 있는 몬스터만 끄는데 보스가 그 시각 화면 안에 들어왔다(전 캡처 땐 화면 밖).
- 한계: 같은 점·줌이지만 날씨(비·안개)·횃불 깜빡임은 매 프레임 다르다. 30맵 확대·악몽/지옥 복제는 하지 않았다(코덱스 결정 대기).

## 6. 원복 확인

- 23:17:05 stop → `git checkout -- map/crabcave1.map map/stormeye.map` → `git status --short map/` 빈 출력 → touch → 23:17:16 refresh 한 번.
- 23:17:33 확인 play → 두 맵에 실제로 들어가 런타임 세기: crabcave1 204 · FlipY 103 · FlipX 102 · RUID `0c0475e2` 1종 · stormeye 231 · 126 · 114 · 1종 = 교체 전과 같음 → 커밋본 복귀.
- 23:18:42 stop → 편집 모드 · map01(5a29ca07…) · 플랫폼 PC(FHD).

## 7. 테스트 캐릭터

슬롯 4 「새내기」 Lv40. 세 방 모두 입장 직후 `IsLoadSuccess=false`(저장 끔) — 저주 레벨·칸 배치·HP·위치 준비값은 저장되지 않는다. 백업·복원은 하지 않았다.

## 8. 파일

`README.md` · `RUN-log.txt`(시각순 발췌) · `capture-map.txt` · `ARTI-maker-scripts.lua` · `maps/`(격리 산출 2장) · I-1 캡처 2 · I-2 캡처 8 + 나란히 판 4.

## 9. 미확인

- I-1 회색조·색맹 조건 실화면, 액트 1·4 바닥 위 장면, 한 마리만 떨어진 깨끗한 장면.
- I-2 모바일·iPad 화면, 악몽/지옥 복제본, 다른 액트 3 맵 8장(확대는 코덱스 결정 뒤).
- `tools/build.cjs maps` 전체 재빌드는 돌리지 않았다(기본 모드 두 맵 바이트 같음만 확인).

## 10. 검사 (데이터·빌더 변경 뒤)

`npm test` 12/12 통과 · `node tools/check_data.cjs` 표 26개 문제 0건.
