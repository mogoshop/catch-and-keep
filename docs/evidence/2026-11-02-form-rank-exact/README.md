# 11-02 해골 전사 변이 수 = 노드 랭크 (교체 순간 포함) — 메이커 확인

사용자 결정 「찍은 만큼 나오게」: UndeadSystem.PlanNext가 교체로 무너질 기록(victims)을 뺀 생존 편성에서 PickForm을 부른다.

- 메이커: 편집 모드 map01 · PC · refresh → 빌드 Error 0 → play · SelfTest 통과 412(로비)/413(게임 방) · 실패 0
- 인꾸(슬롯 1) 혼자 하기 → 피 묻은 황무지(PlayerTravel.Go) · 서버 임시 랭크 raise_skeleton 6 · 대검 2 · 쌍칼 1 (정원 4)
- 혼 1개 생성 → SkillBook.Cast("raise_skeleton") × 8 (실제 시전 경로 · 마나·재사용 초기화만)

| 시전 | 교체 | 시전 뒤 편성 |
|---|---|---|
| 1 | 0 | 대검 1 |
| 2 | 0 | 대검 2 |
| 3 | 0 | 대검 2 · 쌍칼 1 |
| 4 | 0 | 일반 1 · 대검 2 · 쌍칼 1 |
| 5 | 1 (대검 → 대검) | 일반 1 · 대검 2 · 쌍칼 1 |
| 6 | 1 (대검 → 대검) | 일반 1 · 대검 2 · 쌍칼 1 |
| 7 | 1 (쌍칼 → 쌍칼) | 일반 1 · 대검 2 · 쌍칼 1 |
| 8 | 1 (일반 → 일반) | 일반 1 · 대검 2 · 쌍칼 1 |

이전(4ffee2b8) 같은 방법 5번째 시전 = 일반 2 · 대검 1 · 쌍칼 1 → 이제 교체 4회 모두 정확히 대검 2 · 쌍칼 1.
`[VRF] roster rank exact before … victims … after …` 줄이 교체 전·후 변이 수 (출시 서버에서는 꺼짐).
확인 뒤 원복(raise_skeleton 4 · skeleton_mastery 3 · 변이 노드 없음 · 해골 해산) → stop. maker_save 하지 않음.
vrf-log.txt: 걸러낸 [VRF]·SelfTest 줄.
