# Codex 요청 — 액트 3 그림 수정 (2026-10-11, Claude)

근거: [codex-act3-review-20261011](codex-act3-review-20261011.md). 사용자 결정(10-11): 아래 항목은 코덱스가 고치고, **나머지 그림은 Claude가 먼저 올려 게임에 연결한다.**

## 이미 올라간 것 (다시 올리지 말 것)

Claude가 그룹 OJYYQ에 **298장**을 올리고 RUID를 `assets/codex-act3-v1/resource-mapping.csv`의 RUID 칸에 적었다 (status = `uploaded`).
- 몬스터 11종 프레임(갈매기 제외) · NPC 3 · 장식 18 · 벽 45 · 이펙트 12 · 상태 칩 6 · 의뢰 그림 12
- 몬스터·NPC·장식·바닥 장판은 발밑 가운데 피벗(0.5, 0), 나머지는 기본 피벗

**올리지 않은 것 (아래 수정 대상)**: 바닥 11장, 폭풍 갈매기 18프레임. RUID 칸이 비어 있다.

## 1. 바닥 11장 — 명도만 올리기 (최우선)

| 항목 | 내용 |
| --- | --- |
| 대상 | `png/terrain/` 바닥 11장: wet-sand · saltflat-floor · dock-floor · black-sand · coast-rock-floor · storm-water · wet-cave-floor · shiphold-floor · smuggler-floor · chapel-floor · lighthouse-floor |
| 문제 | 휘도 평균 34~83 (액트 2 바닥 55~128). 몬스터 35~64와 거의 같아 몬스터가 바닥에 묻힌다. 게임에서는 맵 어둠(밝기 0.1~0.14)까지 더해진다 |
| 예시 | 밀수꾼 두목 43 ↔ 밀수꾼 동굴 바닥 43 · 익사한 선원 41 ↔ 검은 모래 34 · 난파선 골렘 46 ↔ 선창 바닥 42 |
| 요청 | **무늬·색조·이음매는 그대로, 명도만** 올려 휘도 평균 **70~100**. 몬스터보다 한 단계 밝게. 물(storm-water)은 통행 불가 표시라 바닥보다 약간 어둡게 유지해도 된다 |
| 확인 | 바닥 위에 몬스터 stand 0번 프레임을 올린 대조 시트 1장 (`previews/qa-contrast-floor.png`) |

## 2. 폭풍 갈매기 18프레임 — 다시 그리기

| 항목 | 내용 |
| --- | --- |
| 문제 | 검은 까마귀처럼 보이고(휘도 35) 44×50으로 작다. 바닥 위 검은 점이 되고 액트 1 「시체 까마귀」와 헷갈린다 |
| 요청 | **흰빛·잿빛 바다갈매기**: 몸은 밝은 회백색, 날개 끝만 검게, 눈은 청백으로 빛남. 폭풍에 젖은 깃털 |
| 규격 | 지금과 같은 상태·프레임 수 (stand4 · move4 · attack4 · hit2 · die4), 왼쪽을 봄, 발밑 기준. 캔버스 **약 70×50** (날개를 편 attack 기준) |
| 연결 | 파일명 `a3-stormgulls-<상태>-<번호>` 그대로. `animation-registration.csv`의 stormgulls 행도 새 크기로 |

## 3. 그대로 쓰는 것 (참고)

- **게 껍질 오버레이**: 몸 실루엣과 맞지 않아 겹쳐 쓰지 않는다. 껍질이 닫힌 동안은 코드로 몸에 푸른 색조, 이 그림은 닫히는 순간 한 번 터지는 고리 이펙트로 쓴다. **다시 그릴 필요 없음.**
- **벽 이음매**: 해안 바위 벽 5×5 미리보기의 칸 경계선은 메이커에서 칠한 뒤 다시 본다. 지금 고치지 않는다.

## 끝나면

1. 고친 바닥 11장 · 갈매기 18장만 그룹 OJYYQ에 올리고 Catalog CSV를 남기거나, `resource-mapping.csv` RUID 칸에 직접 적는다. 또는 Claude에게 `node tools/msw_mcp_call.cjs upload-res assets/codex-act3-v1`를 맡긴다 (RUID가 빈 줄만 올린다).
2. 처리 결과는 `docs/requests/codex-act3-fix-delivery-YYYYMMDD.md`.
3. 바닥이 오면 Claude가 `map_art.csv` 16맵 행을 만들어 지형을 바꾼다 (지금은 임시 지형). 칠하기·충돌 확인은 그 뒤 코덱스.
