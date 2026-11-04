# 망령 도약(텔레포트) 안 됨 · 질주 충전 멈춤 · 본 골렘 노말 해제 (11-05)

사용자 보고 「텔레포트 사용이 안 되네 레벨 24인데」 · 「여분 숨을 강화했는데 1/2 이상 안 올라간다」 · 결정 「본 골렘 악몽부터 제한 해제」.

## 과제 1 — 망령 도약 원인 판정

| 가설 | 재현 (메이커 1회차, 수정 전) | 판정 |
|---|---|---|
| A 배움이 막힘 | Lv24 · 질주 1랭크(시작 무료)에서 `CanLearn(dash_blink)` = 「「질주」 7랭크부터」, 스킬 창 노드 카드에도 빨간 「7랭크부터」(before-1). `RankCap(wraith_dash,24)=8` · `NextRankLevel(7)=21` · `NodeLevel(dash_blink)=21` 모두 설계값. 질주 6랭크 올림 → 도약 1 배움 성공(before-2) | **설계 문턱** (버그 아님). 질주 7랭크 + 도약 1 = 포인트 7 (1랭크 무료) — Lv24 포인트 예산 30(1 + 레벨업 23 + 의뢰 2·15·24레벨 각 2, `tools/sim_balance.py skill_points`)의 23%, 가장 이른 Lv21에선 25의 28% |
| B 찍었는데 발동 안 함 | PC 마우스 모드: 커서 쪽 6칸 순간이동 정상 · 벽 넘기 `over=true` · 서버 거절 `[VRF] blink rejected` 0건. **키보드 모드(모바일과 같은 길)**: 조준점이 주문 조준(`GetAimPoint` — 앞쪽 가장 가까운 적)이라 곁에 붙은 적 자리로 0.08칸(아무 일 없음 · 0.3칸 미만은 조용히 무시) · 0.41칸(충전만 쓰고 제자리) 이동 | **버그** — 수정 |
| C 저장 이관 | 옛 저장 sv9(질주 14 + 도약 1 + 삭제 노드) → 질주 10 · 도약 1 유지 · refund 10. 질주 6 + 도약 1(옛 need 6) → 도약 유지 · `Node(dash_blink)=1`. sv10 다시 불러도 그대로 | **문제 없음** — 이관이 도약을 지우지 않음 |

수정: `SkillBook.BlinkAimPoint` — PC 마우스 모드는 커서(1칸보다 가까우면 커서 쪽 최대 거리), 키보드·모바일은 질주와 같은 방향(`MoveDirection` — 모바일 조준 끌기 → 방향키·마지막 이동 → 바라보는 쪽)으로 최대 6칸. 착지 규칙(`BlinkLanding` 벽 넘기·맵 밖 거부·잠긴 문)은 그대로.

## 과제 1-2 — 질주 충전 멈춤

원인: `UseDashCharge`가 쓸 때마다 「지금 충전 시각」에 타이머 하나만 걸고, 한 칸이 찬 뒤 다음 칸 타이머는 다시 걸지 않았다. 두 칸을 연달아 쓰면 두 타이머가 같은 시각에 터져 한 칸만 차고, 남은 칸은 다음 질주(`Cast → RefillDash`)가 올 때까지 멈춤 → HUD 「2/3」에서 16초 넘게 그대로(1회차 `T dash2 t=6.88~22.96 charges=2 max=3 rechargeAt=6.58` · before-3). 서버 값과 HUD 표시는 같았다(표시만 어긋난 것 아님). 가설 (2) 최대 칸 캐시·(4) 레벨 미달 노드 표시는 재현되지 않음(`max = 1 + Node(dash_charge)`가 매번 계산).
수정: `RefillDash` 끝에서 남은 칸이 있으면 `ScheduleDashRefill`로 다음 칸 시각에 타이머를 다시 건다(앞 타이머는 `ClearTimer`) · 가득이면 충전 시각 0 · `[VRF] dash charges=… max=… rechargeAt=…`.
2회차: 2칸 → 실제 Space 두 번 → 0 → +3.7초 1 → +3.8초 2 (시전 없음) · HUD 2/2 (after-3a/3b). 두 번 누름 사이(도구 지연 약 2.5초)가 재사용 2.25초보다 길어 이 확인에서만 질주 랭크를 1(재사용 3.75초)로 낮춤(서버 런타임 치트).

## 과제 2 — 본 골렘 「악몽부터」 해제

- `SkillBook`: `RiteGiantUnlocked` 삭제(호출처 6곳 — 거인 노드 배움 · 본 골렘 배움 · 요약 줄 「· 악몽부터」 · `GiantReason` · `CastGiant` 경고 · 스킬 창 깃발 줄뿐, 다른 쓰임 없음) · `SkillWindow` 깃발 줄 머리 「동률이면」 · 아이콘 흐림 제거 · `skills.csv` 설명 「(악몽부터)」 삭제 → `gen_data` → `SkillData.mlua`.
- `NightmarePreview`(악몽에서 새로 열리는 것 카드): 거인 실루엣 줄·「무리가 정하는 본 골렘 다섯」 감춤(노말에서도 배우므로 · after-7). 레벨 해금(Lv24)·충전 2칸·정원 2·노드 필요 랭크는 그대로.
- `tools/sim_balance.py --giant-check`: 거인 보정을 「악몽·지옥만」 → 「본 골렘 Lv24부터 모든 난이도」. 끝 레벨 42·70·93 그대로 · 보통 클리어 −95~−264초(+8~+26%).
- 2회차: MaxDifficulty 0 · Lv24에서 스킬 창 「배우기」 처리기로 본 골렘 1 → A 칸 → 해골 5기(서버 Raise) → **실제 A 키** → `cast bone_giant lv=1 … giants=1` · 방패 거인 섬(after-5·6a·6b).

## 입력 구분
- 실제 입력: 캐릭터 「입장」·「솔로 플레이」 클릭 · K(스킬 창) · Space(질주·도약) · →·↑ 방향키 · A(본 골렘).
- 함수 대체: 슬롯 고르기 `PickSlot(3)` · 스킬 창 단추(마우스 도구가 엔진 UI 단추를 못 누름 — `SkillWindow:Pick/Act/ActNode` 직접) · 레벨 24(`GainExp`) · 이동(`PlayerTravel:Go`) · 해골 5기(`UndeadSystem:Raise`) · 저장 이관(`LoadSaveData` 직접) · 키보드 모드(`SetMouseMode(false)`) · 미리보기 카드(`NightmarePreview:Show`).
- 1회차 `LEA-2007 'p' is nil`(00:50:38)은 방 이동 전 server_main에 보낸 내 점검 스크립트 오류 — 게임 코드 아님.
- 2회차 Lv24 치트 중 업적 Lv10·20 달성 알림이 떴다(저장 끔이라 남지 않음).

## 못 한 것
- 모바일 실기기·모바일 플랫폼 전환 플레이: 하지 않았다(키보드 모드가 같은 분기 — `MouseMode` 아님 → `MoveDirection`). 모바일 조준 끌기 방향 도약은 코드 경로로만 확인.
- `npm test` 21/21 통과(`check_data` 포함 · 01:1x 작업 트리 기준). `tests/quality skills`는 HEAD부터 실패하던 `nova data`(마법사 거인 s1Radius) 한 줄을 빼면 통과 — 새 「질주 충전 사슬」 검사 포함, 그 한 줄은 이번 범위 밖이라 그대로 둠.
