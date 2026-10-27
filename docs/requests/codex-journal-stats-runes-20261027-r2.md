# 코덱스 요청: 일지 · 능력치 · 소켓 UI 그림 — 샘플 승인 · 수정 · 나머지 제작 (2026-10-27, Claude)

1차 샘플(`assets/codex-journal-stats-v1/`, 5장) **승인**. 아래 두 가지만 고친 뒤, 같은 기준으로 나머지 21장을 만든다.
처음 요청서: `docs/requests/codex-journal-stats-runes-20261027.md` (크기 · 내용 · 결은 그대로).

## 돌려줄 곳 — 반드시 프로젝트 안
`/Users/leeinguk/Desktop/hoho/잡으면 내편/assets/codex-journal-stats-v1/` 그대로 (`png/` 덮어쓰기 · `previews/` · `resource-mapping.csv` · `README.md` 갱신).

## 1. 샘플 수정 (2가지)
| 이름 | 고칠 점 |
|---|---|
| `jr_row_done` | 금테 밝기를 지금보다 **약 20% 낮춘다**. 완료 줄이 여러 개 쌓여도 화면이 금빛으로 꽉 차지 않고, **받을 보상(`jr_row_claim`, 보라)이 가장 눈에 띄게**. 판의 따뜻한 색은 유지 |
| `jr_row` · `jr_row_done` · `jr_row_claim` | 판 안쪽 알파가 253(약 1% 비침) → **테두리 안쪽은 모두 255(완전 불투명)**. 바깥 모서리 안티에일리어싱만 반투명 |

- 세 줄의 윤곽 · 위치 · 9-slice border(112;48;16;16)는 그대로.
- `jr_badge` · `stat_res_fire`는 그대로 확정 (다시 만들지 않는다).

## 2. 나머지 21장 (샘플 승인 기준으로)
| 이름 | 크기 | 기준 |
|---|---|---|
| `jr_bar_bg` / `jr_bar_fill` | 400×20 · 9-slice | 줄 판과 같은 결. 채움은 보라 → 금 그라데이션 |
| `jr_chest` / `jr_chest_open` | 96×96 | 줄 오른쪽 「받기」 위. 열림은 빛이 새어 나옴 |
| `jr_icon_kill` · `jr_icon_collect` · `jr_icon_explore` · `jr_icon_daily` | 96×96 | 줄 왼쪽 96 아이콘 자리. 처치(낫과 해골) · 수집(펼친 도감) · 탐험(지도와 횃불) · 일일(모래시계) |
| `jr_diff_n` · `jr_diff_nm` · `jr_diff_hell` | 48×48 | 난이도 별 — 보통(은) · 악몽(보라) · 지옥(붉은 금) |
| `stat_sum_dmg` · `stat_sum_life` · `stat_sum_minion` | 64×64 | 요약 지표 — 내 피해(낫 날) · 생존(심장 + 방패) · 소환수(해골 셋) |
| `stat_res_cold` · `stat_res_light` · `stat_res_poison` | 48×48 | **`stat_res_fire`와 같은 높이(최대 40px) · 같은 어두운 윤곽 굵기 · 칩 바탕 없음**. 냉기(푸른 눈꽃) · 번개(노란 번개) · 독(초록 해골 방울) |
| `stat_group_bar` | 600×40 · 9-slice | 세부 분류 머리 띠 — 얇은 금선 + 어두운 띠 |
| `socket_empty` · `socket_ring` | 40×40 | 장비 소켓 칸 — 빈 칸(움푹한 어두운 원 + 금테) · 룬 위에 얹는 금테 고리 |
| `socket_glow` | 128×128 | 룬을 고르면 끼울 수 있는 장비 칸에 겹쳐 깜빡일 금빛 테두리 (장비 칸 96 + 여백) · 가운데는 투명 |

- 공통: **글자 · 숫자 없음**. 9-slice 그림은 안쪽 알파 255. `resource-mapping.csv`에 border(좌;우;위;아래).
- 확인판: `previews/journal-row-v2.png`(수정한 줄 3상태 + 막대 · 상자 · 아이콘 · 별을 얹은 예시), `previews/stats-v2.png`(저항 4 · 요약 3 · 머리 띠), `previews/socket-v2.png`(소켓 빈 칸 · 고리 · 금빛 테두리를 장비 칸 위에).
