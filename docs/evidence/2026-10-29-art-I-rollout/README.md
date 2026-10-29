# I-2 확대 적용 — 액트 3 따개비 돌 바닥 3변형 혼합 · 10장 × 노말·악몽·지옥 = 30 map 파일 (2026-10-29 23:37~23:50)

근거: 코덱스 23:22 승인(사용자 위임) — I-2 두 노말 맵 시범(`docs/evidence/2026-10-29-art-I/`) 수용 · 같은 바닥 액트 3 맵 30개로 확대. 실행 HEAD **c305f410** + 미커밋(아래). 커밋·판정은 하지 않았다(조정자·코덱스 몫). 메이커는 이 담당 혼자 썼다(23:40~23:50).

## 1. 범위 · 정책

- 대상 id: `data/handmade/specs/act3.cjs` 끝 `FLOOR_MIX = "a3-barnacle-stone-floor-r2"` 루프를 실제로 평가(`node -e require(...)`)해 `floorMix`가 붙은 맵 **10장** — `harbor wreckcoast stormcliff drownedvillage lighthouse1 lighthouse2 lighthouse3 stormeye crabcave1 crabcave2` (요청서 10장과 같음 · 설계도 `data/handmade/<id>.txt`의 `;floormix` 줄도 같은 10장). 난이도 복제 포함 30 파일.
- 정책: `variants` — 현행 r2 + v2/v3/v4를 그림 격자 칸 좌표 해시(`VARIANT_SEED` 20261029)로 고르고 열·줄 의사난수 뒤집기는 끈다. 경계 보정(decide hard cut · segs 필요 뒤집기 · 끝부터 깐 조각)·위치 규칙·격자 원점·MIX_Z·색·배율·피벗·통행/충돌·스폰·워프·기능 엔티티는 그대로(시범과 같은 코드 — 이번에 바꾼 건 기본값뿐).
- 다른 바닥 영향 없음: `variantsOf(art)`는 `FLOOR_VARIANTS`에 등록된 그림(지금은 따개비 돌 바닥 하나)에만 변형을 돌려준다. `;floormix`를 쓰는 맵 자체가 이 10장뿐이고, act3 `--check`에서 나머지 6장 요약 줄은 바뀌지 않았다.

## 2. 바뀐 파일 (커밋 안 함)

| 파일 | 내용 |
|---|---|
| `tools/build/handmade/lib.cjs` | 85행 `process.env.FLOORMIX \|\| "flip"` → `"variants"` · 정책 주석에 「10-29 코덱스 승인으로 기본 = variants · `--floormix=flip` / `FLOORMIX=flip`은 옛 정책 재현용 · FLOOR_VARIANTS 그림만」 · 고르기 줄 「전체 빌드도 기본 variants」 |
| `tools/build/handmade/build.cjs` | 머리 주석(사용 예를 `--floormix=flip` 재현용으로 · 기본 variants 설명) — 코드 줄 변화 없음 |
| `data/handmade/specs/act3.cjs` | FLOOR_MIX 주석 2줄 덧붙임(10-29 23:22 결정 · 변형 3장 혼합 · 임의 뒤집기 없음) — 코드 변화 없음 |
| `map/<10 id>{,_nm,_hell}.map` | 30개 — 빌드 산출 |
| `docs/requests/codex-next-20261029.md` | I-2 검수 표 줄(181행) 상태 칸·끝 칸만 |
| `docs/evidence/2026-10-29-art-I-rollout/` | 이 폴더 |

- 전체 빌드 강제 여부: `grep -rn "FLOORMIX\|setFloormixMode\|floormix=" tools` → `build.cjs` 옵션 파싱·`lib.cjs` 말고 없음. `tools/build.cjs maps`는 flip을 강제하지 않으므로 앞으로 전체 빌드도 variants를 쓴다(이번에는 돌리지 않음).
- 옛 정책 재현 확인: `FLOORMIX=flip`(= `--floormix=flip`) `--out` 재빌드 → 노말 8장 HEAD와 **바이트 동일**, crabcave1·crabcave2는 새 조각 UUID만 다르고 내용 동일.

## 3. 명령

```
node tools/build/handmade/build.cjs act3 --check                       # 변경 전 기준 (경고 14)
node tools/build/handmade/build.cjs harbor wreckcoast stormcliff drownedvillage lighthouse1 lighthouse2 lighthouse3 stormeye crabcave1 crabcave2
git status --short map/                                                # 정확히 30개
MIXDEBUG=1 node tools/build/handmade/build.cjs <10 id> --check          # 정책 통계 (FLOORMIX=flip 으로 전 통계)
python3 docs/evidence/2026-10-29-art-I-rollout/tools/rollout_cmp.py <HEAD 추출 폴더> map out.json <10 id>
npm test · node tools/check_data.cjs · node tools/build/handmade/build.cjs act3 --check
```

## 4. 맵별 표 — sha256(앞 12자) · 섞기 조각(`ArtZone<n>_<m>`) · 뒤집기 · 장별

뒤집기(후)는 모두 경계 보정에서 나온 것(variants는 의사난수 뒤집기를 끔). 「빌더 통계」 = `MIXDEBUG` variants 줄: 좌우 뒤집은 열 · 상하 뒤집은 줄 · 반대로 뒤집은 조각(segs 필요 뒤집기) · 끝부터 깐 조각 — flip 때와 같은 값(stormcliff 반대 49·끝부터 5 · lighthouse1~3 3/7/6 · stormeye 2). 난이도 복제는 노말과 같은 그림이라 세 파일 수치가 같다.

| 파일 | sha256 전 | sha256 후 | 조각 | FlipX | FlipY | 장별 r2 / v2 / v3 / v4 | 빌더 통계(열 · 줄 · 반대 · 끝부터) |
|---|---|---|---|---|---|---|---|
| `harbor.map` | `bceb664be380` | `d29d096c4258` | 111 → 233 | 55 → 0 | 61 → 0 | 61 / 53 / 61 / 58 | 0/20 · 0/20 · 반대 0 · 끝부터 0 |
| `harbor_nm.map` | `f239be253bb2` | `90b8211b1140` | 111 → 233 | 55 → 0 | 61 → 0 | 61 / 53 / 61 / 58 | 0/20 · 0/20 · 반대 0 · 끝부터 0 |
| `harbor_hell.map` | `db20ef5b8b8f` | `7cabaae011d7` | 111 → 233 | 55 → 0 | 61 → 0 | 61 / 53 / 61 / 58 | 0/20 · 0/20 · 반대 0 · 끝부터 0 |
| `wreckcoast.map` | `8234aca57e80` | `329c0bf4f3ec` | 53 → 122 | 30 → 0 | 23 → 15 | 30 / 41 / 27 / 24 | 0/8 · 7/20 · 반대 0 · 끝부터 0 |
| `wreckcoast_nm.map` | `c83daa237aac` | `32b7edfbc2db` | 53 → 122 | 30 → 0 | 23 → 15 | 30 / 41 / 27 / 24 | 0/8 · 7/20 · 반대 0 · 끝부터 0 |
| `wreckcoast_hell.map` | `b482a1d8c92b` | `aae32a5aeff1` | 53 → 122 | 30 → 0 | 23 → 15 | 30 / 41 / 27 / 24 | 0/8 · 7/20 · 반대 0 · 끝부터 0 |
| `stormcliff.map` | `0b6360fb2c94` | `10e79e0c283b` | 276 → 759 | 136 → 338 | 145 → 365 | 202 / 196 / 171 / 190 | 62/125 · 88/169 · 반대 49 · 끝부터 5 |
| `stormcliff_nm.map` | `179f51e11acc` | `a419945fc07f` | 276 → 759 | 136 → 338 | 145 → 365 | 202 / 196 / 171 / 190 | 62/125 · 88/169 · 반대 49 · 끝부터 5 |
| `stormcliff_hell.map` | `880b76cec48d` | `4d31271dfe64` | 276 → 759 | 136 → 338 | 145 → 365 | 202 / 196 / 171 / 190 | 62/125 · 88/169 · 반대 49 · 끝부터 5 |
| `drownedvillage.map` | `1dc3e7755555` | `3c4b0569a4e2` | 37 → 156 | 16 → 40 | 18 → 18 | 39 / 25 / 41 / 51 | 5/12 · 9/23 · 반대 0 · 끝부터 0 |
| `drownedvillage_nm.map` | `db1fa010eabc` | `b6f01ef0c034` | 37 → 156 | 16 → 40 | 18 → 18 | 39 / 25 / 41 / 51 | 5/12 · 9/23 · 반대 0 · 끝부터 0 |
| `drownedvillage_hell.map` | `cc5059b29878` | `f93b38913e07` | 37 → 156 | 16 → 40 | 18 → 18 | 39 / 25 / 41 / 51 | 5/12 · 9/23 · 반대 0 · 끝부터 0 |
| `lighthouse1.map` | `976414862323` | `adc2a8805189` | 143 → 286 | 70 → 106 | 86 → 152 | 92 / 51 / 69 / 74 | 24/49 · 35/59 · 반대 3 · 끝부터 0 |
| `lighthouse1_nm.map` | `43d6e93bfae4` | `98a5b5c5691f` | 143 → 286 | 70 → 106 | 86 → 152 | 92 / 51 / 69 / 74 | 24/49 · 35/59 · 반대 3 · 끝부터 0 |
| `lighthouse1_hell.map` | `05dc90ad22a2` | `c01d1362936a` | 143 → 286 | 70 → 106 | 86 → 152 | 92 / 51 / 69 / 74 | 24/49 · 35/59 · 반대 3 · 끝부터 0 |
| `lighthouse2.map` | `97aea697e9ac` | `d56f7b57d753` | 192 → 432 | 95 → 139 | 107 → 182 | 114 / 106 / 108 / 104 | 29/59 · 40/71 · 반대 7 · 끝부터 0 |
| `lighthouse2_nm.map` | `9c7c64351782` | `e4a118b1d8d7` | 192 → 432 | 95 → 139 | 107 → 182 | 114 / 106 / 108 / 104 | 29/59 · 40/71 · 반대 7 · 끝부터 0 |
| `lighthouse2_hell.map` | `75cb648f99d9` | `4d369f984946` | 192 → 432 | 95 → 139 | 107 → 182 | 114 / 106 / 108 / 104 | 29/59 · 40/71 · 반대 7 · 끝부터 0 |
| `lighthouse3.map` | `902e55aec50f` | `447afde63ef1` | 129 → 419 | 63 → 130 | 72 → 219 | 110 / 105 / 101 / 103 | 20/42 · 31/55 · 반대 6 · 끝부터 0 |
| `lighthouse3_nm.map` | `c3f40a040af4` | `d425bb29df00` | 129 → 419 | 63 → 130 | 72 → 219 | 110 / 105 / 101 / 103 | 20/42 · 31/55 · 반대 6 · 끝부터 0 |
| `lighthouse3_hell.map` | `46a5cdd21292` | `c6ffab573bd3` | 129 → 419 | 63 → 130 | 72 → 219 | 110 / 105 / 101 / 103 | 20/42 · 31/55 · 반대 6 · 끝부터 0 |
| `stormeye.map` | `72f68cfb08c2` | `4ae553b0a975` | 231 → 605 | 114 → 155 | 126 → 205 | 161 / 135 / 150 / 159 | 26/58 · 43/82 · 반대 2 · 끝부터 0 |
| `stormeye_nm.map` | `6757a242584c` | `73f7c29e3950` | 231 → 605 | 114 → 155 | 126 → 205 | 161 / 135 / 150 / 159 | 26/58 · 43/82 · 반대 2 · 끝부터 0 |
| `stormeye_hell.map` | `2972d8982a31` | `16b0776f31a6` | 231 → 605 | 114 → 155 | 126 → 205 | 161 / 135 / 150 / 159 | 26/58 · 43/82 · 반대 2 · 끝부터 0 |
| `crabcave1.map` | `c83390af6495` | `6e976c3ea698` | 204 → 436 | 102 → 0 | 103 → 0 | 115 / 108 / 111 / 102 | 0/54 · 0/54 · 반대 0 · 끝부터 0 |
| `crabcave1_nm.map` | `8127671259b0` | `fad7de062d4d` | 204 → 436 | 102 → 0 | 103 → 0 | 115 / 108 / 111 / 102 | 0/54 · 0/54 · 반대 0 · 끝부터 0 |
| `crabcave1_hell.map` | `c792c1a5f34f` | `1245c3522eff` | 204 → 436 | 102 → 0 | 103 → 0 | 115 / 108 / 111 / 102 | 0/54 · 0/54 · 반대 0 · 끝부터 0 |
| `crabcave2.map` | `3e803d1ea0ba` | `26744cdad90f` | 166 → 353 | 69 → 0 | 72 → 0 | 91 / 79 / 80 / 103 | 0/44 · 0/44 · 반대 0 · 끝부터 0 |
| `crabcave2_nm.map` | `f0d3cefb314d` | `163c1fc2add6` | 166 → 353 | 69 → 0 | 72 → 0 | 91 / 79 / 80 / 103 | 0/44 · 0/44 · 반대 0 · 끝부터 0 |
| `crabcave2_hell.map` | `21a137fdca20` | `79682fad081f` | 166 → 353 | 69 → 0 | 72 → 0 | 91 / 79 / 80 / 103 | 0/44 · 0/44 · 반대 0 · 끝부터 0 |
합계(30 파일): 조각 4,626 → 11,403 · FlipX 2,250 → 2,724 · FlipY 2,439 → 3,468 · 장별 r2 3,045 / v2 2,697 / v3 2,757 / v4 2,904. 범위(맵당 · 노말 기준): 조각 122~759 · FlipX 0~338 · FlipY 0~365 · 한 장 몫 16%~34%.
- 의사난수 뒤집기만 쓰던 맵(harbor · crabcave1 · crabcave2)은 FlipX/FlipY 0. wreckcoast FlipX 0 · FlipY 15(경계 보정 줄 7/20). 담 윗면(raised) 맵 lighthouse1~3 · stormeye · stormcliff와 drownedvillage는 경계 보정 뒤집기가 남고, 칸 단위로 조각을 나눠 뒤집힌 「조각」 수는 늘었다(빌더가 센 뒤집힌 열·줄 — 경계 보정 몫 — 은 flip 때와 비슷: 예 stormcliff 열 65/128 → 62/125 · 줄 85/163 → 88/169 · stormeye 열 35/73 → 26/58 · 줄 44/82 → 43/82).

## 5. 시범 산출과 교차 확인

- `map/crabcave1.map` vs `docs/evidence/2026-10-29-art-I/maps/crabcave1.map`: **바이트 동일 아님**. 엔티티 936개 경로·순서·컴포넌트·displayOrder 모두 같고, 다른 줄은 새로 생긴 섞기 조각 235개의 `id`·`origin.root_entity_id`(470줄)뿐 — 커밋본에 없던 조각 경로는 빌드마다 무작위 UUID를 받는다(시범 `--out` 빌드와 이번 `map/` 빌드가 각각 뽑음). 그 외 차이 0줄.
- `stormeye`: 같은 이유 — 엔티티 1181개 같음 · 새 조각 374개 UUID(748줄)만 다름.
- 결론적 사실: 같은 정책·같은 그림 배치. 바이트 동일을 요구한다면 시범 파일을 그대로 복사해야 하나, 그러면 30개 중 2개만 그 UUID가 되고 복제본(`_nm`·`_hell`)은 어차피 이번 빌드 UUID를 쓴다 — 그대로 두었다.

## 6. 바닥 외 보존 (커밋본 vs 새 파일 · `tools/rollout_cmp.py` = `cmpmap.py` 규칙 확장)

- 바닥 외 = 이름이 `ArtZone<n>_<m>`가 아닌 엔티티 전부(기능 · 포털 · 스폰 · 벽 · 구역 · 길 · 장식 · 세트 · 무늬 · 타일맵 · 맵 루트).
- 「id·컴포넌트 다름」 = 엔티티 id · componentNames · `@components` 중 하나라도 다름. 「기타 필드 다름」 = displayOrder 말고 jsonString의 다른 필드(name·path·enable·visible·modelId·origin 등)가 다름. 「완전 동일」 = 엔티티 객체 전체(displayOrder 포함)가 같음. **「displayOrder만 다름」은 바이트 동일과 따로 센 것** — 섞기 조각 수가 바뀌어 그 뒤에 생성된 엔티티의 생성 순서 번호(displayOrder)와 파일 안 절대 위치가 밀렸다. 바닥 외 엔티티끼리의 상대 순서는 30개 모두 같다.

| 파일 | 바닥 외 수 | 경로 같음 | id·컴포넌트 다름 | 기타 필드 다름 | 완전 동일 | displayOrder만 다름 | 상대 순서 같음 | RectTileMap | 섞기 z·배율·층·색 | 꽉 덮인 칸 전 → 후 |
|---|---|---|---|---|---|---|---|---|---|---|
| `harbor.map` | 191 | 예 | 0 | 0 | 6 | 185 | 예 | 같음 | 같음 | 223 → 227 (빠짐 11) |
| `harbor_nm.map` | 191 | 예 | 0 | 0 | 6 | 185 | 예 | 같음 | 같음 | 223 → 227 (빠짐 11) |
| `harbor_hell.map` | 191 | 예 | 0 | 0 | 6 | 185 | 예 | 같음 | 같음 | 223 → 227 (빠짐 11) |
| `wreckcoast.map` | 703 | 예 | 0 | 0 | 33 | 670 | 예 | 같음 | 같음 | 144 → 147 (빠짐 0) |
| `wreckcoast_nm.map` | 703 | 예 | 0 | 0 | 33 | 670 | 예 | 같음 | 같음 | 144 → 147 (빠짐 0) |
| `wreckcoast_hell.map` | 703 | 예 | 0 | 0 | 33 | 670 | 예 | 같음 | 같음 | 144 → 147 (빠짐 0) |
| `stormcliff.map` | 794 | 예 | 0 | 0 | 597 | 197 | 예 | 같음 | 같음 | 623 → 623 (빠짐 0) |
| `stormcliff_nm.map` | 794 | 예 | 0 | 0 | 597 | 197 | 예 | 같음 | 같음 | 623 → 623 (빠짐 0) |
| `stormcliff_hell.map` | 794 | 예 | 0 | 0 | 597 | 197 | 예 | 같음 | 같음 | 623 → 623 (빠짐 0) |
| `drownedvillage.map` | 850 | 예 | 0 | 0 | 21 | 829 | 예 | 같음 | 같음 | 176 → 176 (빠짐 0) |
| `drownedvillage_nm.map` | 850 | 예 | 0 | 0 | 21 | 829 | 예 | 같음 | 같음 | 176 → 176 (빠짐 0) |
| `drownedvillage_hell.map` | 850 | 예 | 0 | 0 | 21 | 829 | 예 | 같음 | 같음 | 176 → 176 (빠짐 0) |
| `lighthouse1.map` | 692 | 예 | 0 | 0 | 575 | 117 | 예 | 같음 | 같음 | 288 → 288 (빠짐 0) |
| `lighthouse1_nm.map` | 692 | 예 | 0 | 0 | 575 | 117 | 예 | 같음 | 같음 | 288 → 288 (빠짐 0) |
| `lighthouse1_hell.map` | 692 | 예 | 0 | 0 | 575 | 117 | 예 | 같음 | 같음 | 288 → 288 (빠짐 0) |
| `lighthouse2.map` | 755 | 예 | 0 | 0 | 639 | 116 | 예 | 같음 | 같음 | 459 → 459 (빠짐 0) |
| `lighthouse2_nm.map` | 755 | 예 | 0 | 0 | 639 | 116 | 예 | 같음 | 같음 | 459 → 459 (빠짐 0) |
| `lighthouse2_hell.map` | 755 | 예 | 0 | 0 | 639 | 116 | 예 | 같음 | 같음 | 459 → 459 (빠짐 0) |
| `lighthouse3.map` | 739 | 예 | 0 | 0 | 650 | 89 | 예 | 같음 | 같음 | 495 → 495 (빠짐 0) |
| `lighthouse3_nm.map` | 739 | 예 | 0 | 0 | 650 | 89 | 예 | 같음 | 같음 | 495 → 495 (빠짐 0) |
| `lighthouse3_hell.map` | 739 | 예 | 0 | 0 | 650 | 89 | 예 | 같음 | 같음 | 495 → 495 (빠짐 0) |
| `stormeye.map` | 576 | 예 | 0 | 0 | 490 | 86 | 예 | 같음 | 같음 | 779 → 779 (빠짐 0) |
| `stormeye_nm.map` | 576 | 예 | 0 | 0 | 490 | 86 | 예 | 같음 | 같음 | 779 → 779 (빠짐 0) |
| `stormeye_hell.map` | 576 | 예 | 0 | 0 | 490 | 86 | 예 | 같음 | 같음 | 779 → 779 (빠짐 0) |
| `crabcave1.map` | 500 | 예 | 0 | 0 | 6 | 494 | 예 | 같음 | 같음 | 426 → 439 (빠짐 8) |
| `crabcave1_nm.map` | 500 | 예 | 0 | 0 | 6 | 494 | 예 | 같음 | 같음 | 426 → 439 (빠짐 8) |
| `crabcave1_hell.map` | 500 | 예 | 0 | 0 | 6 | 494 | 예 | 같음 | 같음 | 426 → 439 (빠짐 8) |
| `crabcave2.map` | 468 | 예 | 0 | 0 | 6 | 462 | 예 | 같음 | 같음 | 356 → 333 (빠짐 28) |
| `crabcave2_nm.map` | 468 | 예 | 0 | 0 | 6 | 462 | 예 | 같음 | 같음 | 356 → 333 (빠짐 28) |
| `crabcave2_hell.map` | 468 | 예 | 0 | 0 | 6 | 462 | 예 | 같음 | 같음 | 356 → 333 (빠짐 28) |
- 맵 머리 필드(Id·EntryKey·CoreVersion 등 ContentProto 밖)도 30개 모두 같음.
- 「꽉 덮인 칸」(칸마다 4×4점 모두 섞기 조각 안) 중 후에 빠진 칸: harbor 11(벽 `#` 3 · 부두 `b`=젖은 판자 바닥 8) · crabcave1 8(벽 `#` 8 — 시범 README와 같음) · crabcave2 28(벽 `#` 26 · 껍질 무더기 길 `b`=갯벌 바닥 2). 모두 빌더 `hiddenAt`(벽, 또는 그림이 있는 다른 구역 — 섞기 조각 앞에 그려지는 칸)이라 옛 정책의 늘린 조각이 그 밑에 깔렸던 자리다. 걷는 따개비 돌 칸은 빠진 곳 0, 맵 전체 `ArtFloor`는 그대로.

## 7. 메이커 확인 (최소 · 난이도 복제 2장)

- 23:40:35 stop(이미 멈춤) → 6초 → 30개 touch → 6초 → refresh **한 번** → build 로그 531줄 Info 435 · Warning 96 · **Error 0**(23:08 빌드 그대로 — 스크립트는 안 바뀜).
- 1차: 로비 S4 → 마우스 (1368,236) 「입장」 → `_RoomWindow:Solo()` → 노말 방. 저장 끔·무적 뒤 `Go("crabcave2_nm")`이 8초 이동 화면 뒤 outpost로 돌아옴 — 게임 방은 만들 때 난이도가 정해져 노말 방에 `_nm`·`_hell` 맵이 없다(`/maps/crabcave2_nm` 없음 확인). 악몽/지옥 Solo는 `PrepareRoomMove`가 저장(난이도 포함)을 해야 해 「저장 끔」과 맞지 않아 쓰지 않음.
- 2차: 새 play · 캐릭터 선택 전(저장 불러오기 없음 `slot=0 load=false`)에 `server_main`에서 `CreateInstanceRoom("game:vrfroll", {crabcave2_nm, lighthouse2_hell})` + `MoveUserToInstanceRoom` → 들어간 뒤 `PlayerTravel:Go`. 캐릭터를 불러오지 않았으므로 저장은 일어나지 않는다(이름표가 기본 「인꾸」 아바타인 이유).

| 맵 | 런타임 (맵 루트 자식 `ArtZone*_*`) | 오프라인 | 같음 | 캡처 (PC FHD · 줌 80 · HUD·선택 창·몬스터 끔) |
|---|---|---|---|---|
| `crabcave2_nm` @(-4.5,-7.5) | 353 · FlipY 0 · FlipX 0 · r2 91 / v2 79 / v3 80 / v4 103 | 353 · 0 · 0 · 91/79/80/103 | 예 | `ROLL_crabcave2_nm_hudoff_zoom80.png` (23:47:37) |
| `lighthouse2_hell` @(-6.5,-1.5) | 432 · FlipY 182 · FlipX 139 · r2 114 / v2 106 / v3 108 / v4 104 | 432 · 182 · 139 · 114/106/108/104 | 예 | `ROLL_lighthouse2_hell_hudoff_zoom80.png` (23:48:59) |

- 관찰(점수 없음): crabcave2_nm은 뒤집기 0 — 회청 조약돌이 크기 다르게 깔리고 곧은 금·구멍은 보이지 않는다. lighthouse2_hell(담 윗면 맵)은 경계 보정 뒤집기(FlipX 139 · FlipY 182 조각)가 남아 화면 가운데 왼쪽 등 몇 곳에서 좌우·상하로 맞댄 거울 무늬가 보인다(시범 stormeye와 같은 성질). 판단은 코덱스 몫.
- 23:49 stop → 편집 모드 · map01 · PC(FHD) 확인. 30개 map sha256 = 빌드 직후 그대로.

## 8. 검사

- `npm test` **12/12 통과** · `node tools/check_data.cjs` 표 26개 **문제 0건**.
- `node tools/build/handmade/build.cjs act3 --check` 경고 **14 = 커밋본 14**(같은 줄) · 크기 경고 0 · 그림 수만 floorMix 증가로 바뀜(10621 → 12880), floormix 없는 6장 요약 줄 동일.

## 9. 한계 · 미확인

- 메이커는 복제 2장만 런타임 세기·캡처. 나머지 28개 실화면·기능 재시험·포인터 시험·모바일 화면은 하지 않았다(코덱스 지시 범위).
- 메이커 방은 정상 플레이 경로(악몽/지옥 Solo)가 아니라 맵 두 장만 담은 시험 방(`game:vrfroll`)이다 — 캐릭터를 불러오지 않은 상태라 HUD·퀘스트·스폰 흐름은 확인 대상이 아니다. 지옥 맵에서 무적 전 캐릭터가 한 번 죽었다(`first death` 텔레메트리 로그 · `first pre-session saved` 로그가 찍힘 — 게임 쪽 첫 세션 기록이며 캐릭터 저장(PlayerSave)은 일어나지 않음).
- 1차 시도 노말 방(`game:s1b8b326f1d9`)에서는 슬롯 4 캐릭터를 불러온 뒤 저장 끔·무적·HP 999999를 걸었다(이전 담당과 같은 방식 · 저장 안 됨).
- 시범 산출과는 새 조각 UUID 때문에 바이트가 다르다(5절).
- `tools/build.cjs maps` 전체 재빌드는 돌리지 않았다. 앞으로 전체 빌드는 기본 variants라 이 30개를 같은 내용으로 다시 만든다(새 조각 경로는 이제 커밋되면 id 보존).

## 10. 파일

`README.md` · `rollout-results.json`(맵별 경로·sha256 전/후·조각/뒤집기/장별·빌더 통계 전/후·바닥 외 보존·displayOrder 변화·빠진 칸 좌표·메이커 2장) · `RUN-log.txt` · `ROLL-maker-scripts.lua` · `tools/rollout_cmp.py` · `logs/`(빌드 · MIXDEBUG variants/flip · act3 check 전/후 · npm test · check_data · 메이커 로그 발췌) · 캡처 2장.
