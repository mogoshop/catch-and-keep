# 마법사 거인 메테오 L2 32장 업로드·연결 (2026-10-31)

코덱스 납품 `assets/codex-skill-fx-v2/meteor-L2-full-20261031` (사용자 「메테오는 멈춰 → 디아2 미감 → L2로 진행」) 예고·낙하·착지·잔불 4계열 × 8장 = 32장을 월드 리소스로 올리고 마법사 거인 「기도 메테오」 연출에 연결했다. 짝수 0/2/4/6 = 승인 샘플 · 홀수 1/3/5/7 = 새 중간 장이고 자리 순서는 0..7 그대로다. 메이커 확인 전 (메이커 도구는 쓰지 않음 — 별도 회차). 선례: `2026-10-31-skillfx-nine88` · `2026-10-31-skillfx-shard20`.

## 1. 업로드 (`upload-meteor-L2.json` · `upload-res.log`)

1. `assets/`는 읽기만. `resource-mapping.csv` 32행을 scratchpad 팩으로 복사 — 원본·사본 sha256 같음 · PNG 헤더 크기 = 표 크기(바닥 640×512 · 낙하 256×384) · 모두 RGBA(색 형식 6).
2. 팩 표: `resource-mapping.csv`(key · resource_name · file · RUID · category effect · width · height · sha256) + `resource-properties.csv`(name · pivot · wrap Clamp) — 피벗은 코덱스 표 그대로: 바닥 3계열 24장 0.5/0.35(지면 원점 320,332.8) · 낙하 8장 0.5/0.08333333333333333(앞 핵 접점 128,352).
3. `node tools/msw_mcp_call.cjs upload-res <팩>` → 그룹 OJYYQ · sprite/object · **32/32**. RUID를 받은 직후 같은 루프에서 `asset_update_resource_storage_info`로 pivot·filter Point·wrap Clamp (처음 불리기 전). 오류 없음.
4. `asset_get_group_resource_metadata_bulk`(32 GUID 1회)로 대조: displayName = key · pivot · Point · Clamp · subCategory object · resultCode 0 — **32/32 일치 · RUID 중복 0**.
5. `data/art_sprites.csv`에 `name,effect,w,h,ruid` **32행** 추가.
6. `.mcp.json`은 업로드 동안만 워크트리에 복사했다가 지웠다 (커밋 안 됨).

## 2. 치수 측정 (알파 > 16 · 코덱스 원본 PNG)

| 계열 | 캔버스 | 장별 내용 폭×높이 (px · 00→07) | 최대 내용 폭 |
|---|---|---|---|
| 예고 telegraph | 640×512 | 244×186 · 304×166 · 404×233 · 491×221 · 547×288 · 527×276 · 521×267 · 560×289 | 560 (07) |
| 낙하 fall | 256×384 | 139×176 · 139×197 · 142×208 · 143×207 · 142×196 · 138×194 · 148×204 · 140×210 | 148×210 (06·07) |
| 착지 impact | 640×512 | 347×190 · 461×246 · 554×239 · 556×256 · 540×207 · 520×225 · 542×216 · 518×228 | 556 (03) |
| 잔불 afterglow | 640×512 | 549×300 · 559×312 · 560×260 · 551×269 · 532×235 · 549×269 · 522×198 · 540×218 | 560 (02) |

- **바닥 3계열 공통 배율**: 세 계열이 같은 캔버스·같은 원점이라 한 배율로 겹친다. 기준 = 최대 내용 폭 560px(코덱스 max_native_visible_width 560과 같음) → `SkillEffects.MeteorL2LandRef = 10.0`(560 ÷ 56) · 배율 (100/56) × 지름 ÷ 10.0 = 지름 3.6일 때 0.643 → 내용 560px = 3.6칸(판정 지름 반경 1.8 × 2) · 캔버스 640×512 = 4.11×3.29칸 (코덱스 ground_world_sprite 4.114×3.291과 같음). 착지 최대 556px = 3.57칸. 큰 메테오(반경 2.0)는 같은 비율로 4.0칸.
- **낙하**: 암석 폭 = `MeteorL2FallCoreW` 0.8 × `MeteorFallMul` 1.5(ec625a91 그대로) = 1.2칸 (코덱스 fall_boulder_world_width 1.2 · 원본 암석 proxy 62.449px) → 배율 1.922 · 내용 최대 148×210px = 2.84×4.04칸.
- 예전 B 메테오 자리(`FxGiantFireMeteor` 12장 · `MeteorLandRef` 3.39 · `MeteorFallMul` 1.5 · `MeteorTelegraphOnly`)는 L2 자리가 빌 때의 되돌림 길로 값 그대로 둔다.

## 3. 연결 (`connect-changes.csv`)

| 단계 | 자리 | 연결 지점 (파일:행) | 전 | 후 |
|---|---|---|---|---|
| 예고 | `GameConst.FxGiantMeteorTelegraph` (146) · `…TelegraphMs` 75 (150) | `RiteGiantMoves.mlua:552` warn_fire → `SkillEffects.mlua:1302` GiantFxLocal → `:1402` MeteorL2Fx → PlaySeq | Util.Telegraph 화염 테두리·차오름 (용암 바닥 그림 지움) | 바닥 타원 8장 75ms 반복 · 영창+낙하(기본 1.5초) 동안 · 몸 뒤 · Util.Telegraph 원은 `MeteorL2Rim` true일 때만 함께 |
| 낙하 | `FxGiantMeteorFall` (147) · `…FallMs` 40 (151) | `RiteGiantMoves.mlua:546~547` side → `:555` angle=side → `:1302` → `:1405` → PlaySeq travel(`:1206`) | B 12장 중 1~6장 (giant-b-full-mage-meteor-fx-00~05 · 표적 위 고정 · ×1.5) | 8장 40ms 순환 · 표적 + 60° 축 4칸 오른쪽 위에서 낙하 0.5초 동안 표적으로 · 표적이 시전자 왼쪽이면 왼쪽 위에서·FlipX · 몸 앞 |
| 착지 | `FxGiantMeteorImpact` (148) · `…ImpactMs` 40 (152) | `RiteGiantMoves.mlua:565` meteor_land → `:1302` → `:1417` → PlaySeq | B 7~12장 (giant-b-full-mage-meteor-fx-06~11 · ref 3.39 · 마지막 장 scorch 끝까지) | 8장 40ms 한 번(0.32초) · 몸 뒤 |
| 잔불 | `FxGiantMeteorAfterglow` (149) · `…AfterglowMs` 150 (153) | `:1417` 착지 0.32초 뒤 클라이언트 SetTimerOnce → PlaySeq 반복 → 반복 끝 `Util.PlayFramesHold`(`:1438`) | (없음) | 8장 150ms 반복 · 길이 max(1.2초, 불바닥 − 0.32) → 마지막 장(07) 0.3초 옅어짐 |
| 공통 | 미리 불러 두기 | `SkillEffects.mlua:297` OnBeginPlay | — | 4자리 첫 장 |

- **좌우**: 그림은 오른쪽 위 → 왼쪽 아래(60°)로 그려져 있다. 지시대로 표적이 시전자 왼쪽이면 반전한다. 서버 `FireMeteor`가 시전 순간 `at.x < 시전자 x`이면 `side = 180`을 이미 있던 `GiantMoveFx`의 angle 칸으로 보낸다 (통신 횟수·인자 수 그대로 · 서버 타이머 추가 0). 클라이언트는 L2 낙하에서만 angle을 좌우 표시로 읽고, 예전 연출 길은 angle을 0으로 되돌린다 (B 그림이 뒤집히지 않게).
- **장 순환은 모두 클라이언트**: PlaySeq(장마다 SetTimerOnce · 시작 시각 기준) · 잔불 이음·옅어짐도 클라이언트 SetTimerOnce. 맵을 옮기면 잔불을 잇지 않는다.
- **장 간격**: 코덱스 animation-timing-proposals proposed_interval_ms 그대로(75/40/40/150 · `GameConst.FxGiantMeteor*Ms`). 코덱스 play_mode는 「once」지만 Fable 연결 설계대로 예고·낙하는 그 단계 시간 동안 반복, 잔불은 불바닥 동안 반복 뒤 옅어짐.
- **불투명도**: 새 그림 관례 0.85 대신 `MeteorL2Alpha` 1 (코덱스가 어두운 바닥 대비로 불씨 밝기만 올린 판).
- **0700 샘플 16 · 0800 방향 보드**: 코드·`art_sprites.csv`에 참조 없음(grep) → 지울 것·바꿀 것 없음. 메테오 자리는 L2 새 4자리가 맡고 B 12장 자리는 되돌림으로 남김.
- `[VRF] meteor L2 kind=… n ms scale order face flip loop travel after sec w` 단계마다 한 줄 (출시 서버 끔).

## 4. 바꾸지 않은 것

피해 판정 반경(1.8 · 랭크당 +0.15 · 상한 2.0) · 영창(1.0 − 랭크당 0.1) · 낙하 0.5초 · 불바닥 1.5초 · 피해 ×3.0 · 착지 피해 시각(영창+낙하) · 서버 타이머 2개(`FireMeteor` 안 SetTimerOnce 2) · `rite_giants.csv` 마법사 줄 · 임시 보정 값(`MeteorLandRef` 3.39 · `MeteorFallMul` 1.5 · `MeteorTelegraphOnly` true).

## 5. 검사

- 새 `tests/quality/giant_meteor_l2.lua` **393개** — 4자리 × 8 RUID · 32자리 hex · RUID 중복 0 · art_sprites 32행 = 자리 순서 0..7 · ms 75/40/40/150 · 예고 20장 반복(75ms · Util.Telegraph 없음 · Rim이면 함께) · 낙하 60° 축 4칸 이동·순환·몸 앞·왼쪽 표적 FlipX·끝 = 표적 0.4칸 안 · 착지 8장 → 잔불 0.32초 뒤 8장 → 0.32+1.2초에 07 옅어짐 · 불바닥 3초면 잔불 2.68초 반복 · 지름 4.0이면 같은 비율 · 맵 이동 뒤 잔불 없음 · 출시 [VRF] 끔 · 자리마다 비우면 예전 연출 · 반경·시간 상수·서버 타이머 2개 grep · 반복 타이머 없음 · 미리 불러 두기 grep.
- 기존 검사 갱신: `giant_fx_playback.lua`(MeteorL2Fx 본문 포함 · L2 자리를 비워 B 메테오 검사가 빈 자리 되돌림 길로 · 117개 그대로) · `giant_skills.lua`(낙하 부름 angle: 오른쪽 표적 0 · 왼쪽 표적 180 · 왼쪽 표적도 판정·시각 그대로 · 120 → 126개).
- `quality-all.log` 전체 그룹 통과 · `npm-test.log` 18/18 통과.

## 6. 메이커 회차에서 볼 장면

1. **예고 대비**: 어두운 바닥(액트 1 갈색 · 액트 3 남색 · 액트 4 용암)에서 바닥 타원·불씨가 읽히는지 · 0.6초 한 바퀴 반복이 「차오름」 없이도 착지 시점을 알려 주는지 (모자라면 `MeteorL2Rim` true로 Util.Telegraph 원 함께).
2. **낙하 축**: 60° 오른쪽 위 → 표적으로 내려오는 궤적이 그림 꼬리 방향과 맞는지 · 4칸 시작 높이(`MeteorL2FallDist`)가 화면 안인지 · 40ms마다 자리 바꿈이 끊겨 보이지 않는지 · 암석 1.2칸 크기 · 몸 앞 층이 표적 얼굴을 너무 가리지 않는지.
3. **착지 크기**: 내용 폭이 판정 원(3.6칸 · 큰 메테오 4.0칸)과 맞는지 · 지면 원점(0.35)이 표적 발에 앉는지 · 몸 뒤 층.
4. **불바닥 지속**: 착지 0.32초 → 잔불 1.2초 → 07 장 0.3초 옅어짐이 불바닥 1.5초와 자연스럽게 이어지는지 · 끝 장 밝기 보정판 가독성.
5. **왼쪽 표적 반전**: 거인 왼쪽 적을 고르면 낙하가 왼쪽 위에서 오른쪽 아래로 FlipX로 그려지는지 (EffectService FlipX가 피벗 0.5 기준으로 뒤집히는지 · 다른 플레이어 화면도 같은지).
6. 처음 쓰는 순간 늦게 뜨는 장이 없는지 (자리마다 첫 장만 미리 불러 둠).
