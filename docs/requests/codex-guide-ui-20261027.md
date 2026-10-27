# 코덱스 요청: 게임 안내 창(책갈피형) UI 그림 (2026-10-27, Claude)

사용자 결정 (10-27): 온보딩 가이드를 **왼쪽 책갈피 목차 + 오른쪽 큰 화면(움짤) + 설명** 형태로 바꾼다 (docs/design/35).
Claude가 창 구조·글·동작은 이미 만들었다 (`tools/build/ui.cjs` 게임 안내 블록 · `UI/Windows/GuideWindow.mlua`). 지금은 다른 창 그림을 빌려 쓰고 있어, 이 창에 맞는 그림만 받는다.

## 지금 화면 (기준)

- 창 1560×920, 테두리는 기존 `win_frame` 그대로.
- 왼쪽 책갈피 7칸: 칸 268×88, 그림 46×46 + 이름(시작하기 · 군단 · 성장 · 장비·파밍 · 모험 · 함께하기 · 위험 신호). 칸 그림은 기존 버튼(`btn_frame`), 고른 칸은 색만 밝게.
- 오른쪽 위 화면 칸 864×486 (16:9): 검은 바탕 + 얇은 칸 테두리(`slot_frame`). 여기에 메이커 녹화 움짤이 들어간다 (움짤은 Claude가 만든다 — 그림 요청 아님).
- 책갈피 그림은 지금 메뉴 아이콘을 빌려 씀 → **모험(웨이포인트 아이콘)만 흰 선 그림이라 다른 칸과 결이 다르다.**

## 그릴 것

| 이름 | 크기 | 내용 |
|---|---|---|
| `guide-tab-start` | 96×96 (게임에서 46) | 시작하기 — 펼친 낡은 책 + 보라 혼불 |
| `guide-tab-legion` | 96×96 | 군단 — 해골 셋이 나란히 (가운데 해골 크게) |
| `guide-tab-growth` | 96×96 | 성장 — 뼈 손이 쥔 보라 별, 위로 오르는 빛 |
| `guide-tab-gear` | 96×96 | 장비·파밍 — 바닥의 투구 + 위로 선 금빛 기둥 |
| `guide-tab-adventure` | 96×96 | 모험 — 말린 지도 + 붉은 표시 |
| `guide-tab-together` | 96×96 | 함께하기 — 두건 쓴 네크로맨서 둘 (기존 icon_party와 겹치지 않게 등 맞댄 모습 등) |
| `guide-tab-danger` | 96×96 | 위험 신호 — 바닥의 붉은 원 + 가운데 작은 해골 경고 |
| `guide-tab` | 320×88, 9-slice | 책갈피 칸 보통 — 오른쪽 끝이 살짝 접힌 책갈피 띠. 기존 `btn_frame` 결(청동 테두리·해골 장식)과 같은 세트 |
| `guide-tab-on` | 320×88, 9-slice | 책갈피 칸 고름 — 같은 모양, 테두리 금색 + 안쪽 은은한 보라 빛. 오른쪽으로 8px 더 튀어나온 느낌 |
| `guide-screen-frame` | 896×518, 9-slice | 화면 칸 테두리 — 얇은 청동 액자 + 네 모서리에 작은 해골·보라 혼불. 가운데는 완전히 비운다(투명) |

- 아이콘 7장은 기존 메뉴 아이콘(`icon_bag` · `icon_shadow` · `icon_skill` 등 코덱스 세트)과 **나란히 놓아 같은 결**: 같은 외곽선 굵기·명암·보라/뼈색 포인트.
- 46px로 줄였을 때도 무엇인지 읽혀야 한다 — 실루엣 굵게, 잔선 적게.
- 글자·숫자 넣지 않는다.
- 9-slice 그림 3장은 늘어나도 장식이 찌그러지지 않게 모서리 장식은 모서리 칸 안에만. `resource-mapping.csv`에 border(좌·우·위·아래 px)를 적어 준다.

## 돌려줄 것 — `assets/codex-guide-ui-v1/`

- `png/` 위 10장
- `resource-mapping.csv` (key,file,resource_name,category,ruid,border — ruid 빈칸)
- `previews/guide-window-mock.png` — 지금 게임 안내 창 캡처(아래)에 새 그림을 얹은 모습. 책갈피 한 칸 고른 상태
- `previews/tab-icons-lineup.png` — 아이콘 7장 + 기존 메뉴 아이콘 6장 나란히 (96px · 46px 두 크기)

참고 캡처: Claude가 이 요청서와 같이 보낸 게임 안내 창 화면 (`docs/requests/codex-guide-ui-20261027-ref.png`).

## 진행 방식 (샘플 승인제)

1. 먼저 **아이콘 1장(`guide-tab-legion`) + `guide-tab`·`guide-tab-on` 한 쌍**만 샘플로 → 사용자 승인
2. 승인되면 나머지 아이콘 6장 + `guide-screen-frame`
