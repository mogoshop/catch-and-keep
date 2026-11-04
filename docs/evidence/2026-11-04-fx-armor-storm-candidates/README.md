# 본 아머 · 본 스톰 · 본 오퍼링 효과 후보 (11-04)

메이플 원본 애니메이션 클립(animationclip · category skill)만 사용. 코덱스 생성 없음. 게임 파일·메이커·웹은 건드리지 않음.

## 산출물
- A.png — 본 오퍼링 치유: 지금(코덱스 C7) vs 산의 씨앗(bdaf649b59f3401aab194ea33a167430)
- B-armor-cast.png — 본 아머 「시전 순간」 후보 8
- C-armor-ring.png — 본 아머 「유지 고리」 후보 8
- D-storm.png — 본 스톰 대체(도는 날) 후보 8
- candidates.csv — 계열·번호·이름·RUID·장 수·ms·루프·크기·추천

## 판 읽는 법
- 맨 윗줄 = 지금 쓰는 효과(코덱스 그림 · 게임 코드 배율 반영: 오퍼링 ×0.80, 아머 ×1.0, 스톰 ×1.875).
- 띠 = 대표 4장(첫·⅓·⅔·끝). 장면 = 11-04 질주 HUD 캡처(docs/evidence/2026-11-04-dash-rename/03-after-space-dash-hud.png)를 1칸=100px로 줄이고(캐릭터 키 118화면px = 0.75칸 → 1.573배) 효과를 배율 1로 합성 후 판 전체를 ×1.6 확대 표시. 가장 많이 찬 장 하나를 씀.
- 피벗: 리소스 API 피벗은 아래쪽 기준(산의 씨앗 장별 확인). ball/shootobj/hit/atom/hold 부위는 몸 가운데(발+0.45칸), 나머지는 발에 둠.
- ms: 리소스 API가 장별 delay를 주지 않아 썸네일 gif의 장 간격(전부 150ms)을 적음 → 실제 속도는 메이커에서 다시 확인 필요.
- 루프: 부위 이름(loop·repeat·hold·keydown·affected·state·ball·shootobj·atom)이면 반복형, effect·hit·end·special 등은 한 번.

## 질의 (msw_resource_api search · animationclip · skill · topK 10)
- B: 보호막, 실드, 가드, 아이언 바디, 스톤 스킨, 뼈 갑옷, 해골 방패, bone shield, barrier, 갑옷, bone armor, dark shield, earth shield stone barrier, skeleton guard, 어둠의 보호막, 돌 갑옷, 뼈, 해골, 스컬, skull, bone, skeleton, 언데드, 리치, 돌 방패, rock shield, 흙 보호막, 다크 오라, 어둠 갑옷, dark armor
- C: 회전, 오비탈, 링, 토네이도, 블레이드 회전, 뼈 고리, orbit, spin around body, 수호, 정령 고리, 주위를 도는, orbiting skulls, rotating rocks around character, circling blades, aura loop, 해골 회전, 돌이 몸 주위를 돈다, rock debris orbit, 영혼 회전, soul orbit, spirit circling, 사신, 망령, dark aura ring, orbiting stones gray, floating rocks, magic circle under feet dark, 회전 고리 보라, 공전, 위성, 궤도, orbiting orbs around player, floating rocks circling, 몸 주변을 맴도는 구슬, rotating shields around, spirit wisps circling
- D: 회전하는 칼날, bone storm, 뼈 폭풍, blade storm, spinning blades orbit, 가시 회전, orbiting swords, 블레이드 퓨리, 칼날 소용돌이, whirling bones, sawblade orbit, 뼈 칼날, 낫 회전, scythe spin, spinning scythes, bone spikes orbit, 가시, thorn, rotating daggers, flying swords circle, 칼날 회전 보라, shuriken orbit, 오더, 에테르, 에테르 블레이드, floating swords around player, 검 공전, 칼이 주위를 돈다, bone blades orbit, rotating sickles
- 고유 클립 485개 → 썸네일 한눈판으로 1차 → 약 60개 전 장 띠로 2차 → 계열별 8개.

## 추천
- B ① 싸이킥 인스팅트 3c022a4a28814662a55bcde364ee408c — 아이보리 뼈 뿔 두 개가 몸 양옆에서 솟음 · 1.44칸 · 뼈 느낌 최상
- B ② 다크 리벤지 ff9bf9c0d2974e8496832a85941cdbd8 — 검은 날개가 몸을 감싸 닫혔다 흐려짐 · 1.6칸 · 초록 끼·첫 장 흰 번쩍임은 Color 보정
- C ① 다크니스 오라(repeat) 80aef397c5cb49e9b90d99558a941597 — 검은 연기가 몸을 감싸 도는 12장 반복 · 2.24칸 → ×0.5~0.6
- C ② 싸이킥 그랩2(hold) 392c47a376b34aaabf555360c07a4b13 — 회색 돌 껍질 구 8장 반복 · 0.92칸(지금 고리 0.96칸) · 피벗만 몸 가운데로
- D ① 데빌 사이더(keydown) eb75ed2d245d4488bcadc08c22b50921 — 검붉은 낫날 회전 6장 반복 · ×1.07이면 지름 2.4칸 · 피벗 재정렬 필요
- D ② 14101028 ball 1615c0292d0a4660a9472f122291c9a0 — 보라·검정 회전 톱날 3장 · 3~4개를 ×0.5~0.7로 몸 둘레에 돌리는 지금 StormOrbit 방식에 그대로

## 제외 사유(대표)
- 금빛·성스러운 계열: 로얄 가드(51001xxx)·전장의 방패·블리츠 실드·51141xxx 방패 문양 — 색 규칙(금빛 뒤로).
- 파란 마법 계열: 아이언 월·리프랙트 이블·안티 매직쉘·디바인 실드·쉘터(벌집 돔)·프리징 브레스 — 색 규칙.
- 아이콘·상태 표식(작은 mob/level affected 40px 안팎: 아머 스플릿·아머 브레이크 해골·홍주박 해골 등) — 몸을 감싸지 않는 머리 위 표식.
- 소환수·캐릭터 그림(동행자·무르무르·로봇 런처 등) — 효과가 아님.
- 너무 큰 화면 효과(10칸 이상: 요회권 screen·블리자드 템페스트·체인아츠 퓨리) — 몸 둘레 효과로 쓰기 어려움(요회권은 D6에 비교용으로만 남김).
- 붉은 피·불 계열(블레이드 토네이도·블레이드 스톰·블레이드 퓨리·블러디 스톰) — 공격형이지만 뼈/어둠 색에서 멂.
- 이미 본 기존 추천(래피드 스로우·101141007·보라 회오리 고리·63141004 / 로얄 가드·65001004·안티 매직쉘) — 판 아래 한 줄로만.

## 못 찾은 것
- 「몸 둘레를 실제로 공전하는 뼈·해골」 반복 클립: 없음. 공전형 반복은 암살(4221014 state loop · 붉은 구슬 호)뿐. → 공전은 코드로 조각을 돌리고 그림만 메이플 클립으로 하는 조합 권장.
- 뼈·해골 소재 보호막 시전 클립: 메이플에 직접적인 것 없음 → 뼈 느낌은 싸이킥 인스팅트(뿔/파편)가 가장 근접.
- 원본 장별 delay: 리소스 API 미제공(gif 150ms 고정) → 메이커 재생으로 확인 필요.
