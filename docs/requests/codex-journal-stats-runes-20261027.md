# 코덱스 요청: 일지 · 능력치 · 소켓 UI 그림 (2026-10-27, Claude)

설계: `docs/design/37-ui-overhaul-journal-stats-runes-20261027.md` (10-27 사용자 결정: 일지 보상 A+C · 일지 뱃지 · 능력치 개편 · 룬워드 A안).
결: 게임 안내 책갈피(`assets/codex-guide-ui-v1`) · 창 테두리 · 알림 점과 같은 결 (어두운 판 · 낡은 금테 · 보라 혼불). **글자 · 숫자 없음.**

> **샘플 먼저**: 아래 표에서 ★ 3장(`jr_row` 3상태 겹친 미리보기 1장 · `jr_badge` · `stat_res_fire`)만 먼저 → 사용자 승인 뒤 나머지. 고를 안(A/B) 없음.

## 돌려줄 곳 — 반드시 프로젝트 안
`/Users/leeinguk/Desktop/hoho/잡으면 내편/assets/codex-journal-stats-v1/` (`png/` · `previews/` · `resource-mapping.csv` · `README.md`). `~/Documents/New project/`에 두지 말 것.

## 일지
| 이름 | 크기 | 내용 |
|---|---|---|
| ★ `jr_row` / `jr_row_done` / `jr_row_claim` | 1200×96 · 9-slice | 일지 한 줄 칸 3상태 — 진행 중(어두운 판 · 얇은 금테) / 완료(금테 밝게 · 판 약간 따뜻하게) / 받을 보상(보라 혼불 테두리가 은은히 빛남). 왼쪽 96칸은 아이콘 자리라 장식 없이 |
| `jr_bar_bg` / `jr_bar_fill` | 400×20 · 9-slice | 진행 막대 바탕(홈) · 채움(보라→금 그라데이션) |
| `jr_chest` / `jr_chest_open` | 96×96 | 보상 상자 닫힘 · 열림(빛 새어 나옴) — 「받기」 버튼 위 |
| `jr_icon_kill` · `jr_icon_collect` · `jr_icon_explore` · `jr_icon_daily` | 96×96 | 업적 문양 4종 — 처치(낫과 해골) · 수집(펼친 도감) · 탐험(지도와 횃불) · 일일(모래시계) |
| `jr_diff_n` · `jr_diff_nm` · `jr_diff_hell` | 48×48 | 난이도 별 — 보통(은) · 악몽(보라) · 지옥(붉은 금). 업적 줄에 「어느 난이도까지 깼는지」 3개 나란히 |
| ★ `jr_badge` | 96×96 · 투명 | 메뉴 아래 「일지」 뱃지 그림 — **메뉴 단추 그림(menu_btn)처럼 96 칸 가운데 약 52px 크기의 흰 단순 그림**(펼친 책 + 책갈피). 빨간 점은 따로 얹는다 |

## 능력치 · 장비
| 이름 | 크기 | 내용 |
|---|---|---|
| `stat_sum_dmg` · `stat_sum_life` · `stat_sum_minion` | 64×64 | 요약 지표 아이콘 — 내 피해(낫 날) · 생존(심장 + 방패) · 소환수(해골 셋) |
| ★ `stat_res_fire` · `stat_res_cold` · `stat_res_light` · `stat_res_poison` | 48×48 | 저항 칩 원소 아이콘 — 화염(붉은 불꽃) · 냉기(푸른 눈꽃) · 번개(노란 번개) · 독(초록 해골 방울). 칩 바탕 없이 아이콘만 |
| `stat_group_bar` | 600×40 · 9-slice | 세부 분류 머리 띠(공격 · 소환수 · 방어 · 유틸) — 얇은 금선 + 어두운 띠 |
| `socket_empty` · `socket_ring` | 40×40 | 장비 소켓 칸 — 빈 칸(움푹한 어두운 원 + 금테) · 룬이 박힌 칸 테두리(룬 아이콘 위에 얹는 금테 고리) |
| `socket_glow` | 128×128 | 룬을 고르면 끼울 수 있는 장비 칸에 겹쳐 깜빡일 금빛 테두리 (장비 칸 96 + 여백) |

- `resource-mapping.csv`에 9-slice border(좌;우;위;아래).
- `previews/journal-row-sample.png` — 1200×96 줄 3상태를 세로로 쌓고, 왼쪽 아이콘 자리 · 막대 · 상자를 얹은 예시.
- `previews/stats-sample.png` — 저항 칩 4개 + 요약 아이콘 3개를 어두운 창 바탕 위에.
