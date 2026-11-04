# 망령 도약 문구 · 조작 키 안내 (11-05 후속)

사용자 질문 「망령 질주는 스페이스를 사용해야 된다를 안내해 주고 있나?」 · 결정 「7랭크 문턱은 그대로, 문구만」.
e3c3a9be 뒤로 도약은 PC 마우스 조작 = 커서 자리, 키보드 조작·모바일 = 바라보는 방향인데 문구는 「조준점」뿐이었고 키 안내가 없었다.

## 바뀐 문구

| 위치 | 전 | 후 |
|---|---|---|
| `data/skills.csv` dash_blink desc (스킬 창 설명 칸 · `SkillData.mlua` 재생성) | 질주가 조준점으로 순간이동으로 바뀝니다. 벽을 넘습니다 (최대 6칸 · 잠긴 문은 넘지 못합니다) | 질주가 순간이동으로 바뀝니다. PC 마우스 조작은 커서 자리로, 키보드 조작·모바일은 바라보는 방향으로 최대 6칸 · 벽을 넘습니다 (잠긴 문은 넘지 못합니다). 질주와 같은 키 — PC 스페이스 · 모바일 질주 단추 |
| `SkillBook.GetRankSummary` dash_blink (스킬 창 「지금:」 줄) | 질주가 조준점(최대 6칸) 순간이동으로 · 벽을 넘음 (잠긴 문은 못 넘음) | 질주가 순간이동으로 · {스페이스 / 질주 단추} · {커서 자리로 / 바라보는 방향으로} 최대 6칸 · 벽을 넘음 (잠긴 문은 못 넘음) |
| `SkillBook.GetRankSummary` wraith_dash (도약 배운 뒤 질주 요약) | 최대 6칸 순간이동 · 무적 … | {키} · {자리} 최대 6칸 순간이동 · 무적 … |
| `SkillBook.NotifyLearned` 도약 배움 알림 | 1줄 요약 서버 문자열 + 「자동 적용」 (PC에서 3줄로 넘쳐 판 테두리에 걸림) | 1줄 「{자리} 최대 6칸 순간이동 · 벽을 넘음」 · 2줄 「질주와 같은 키 · {스페이스 / 질주 단추}로 사용」 |
| `SkillBook.NotifyLearned` wraith_dash 힌트 | (같은 뜻 인라인 분기) | `DashKeyName()` 공용 |

- 키 이름 `DashKeyName()`: 모바일 = 질주 단추 · 그 밖 = 스페이스 (HudMain 질주 칸 툴팁과 같은 분기).
- 자리 `BlinkWhereText()`: `BlinkAimPoint`와 같은 조건 (PC + `ClickControl.MouseMode`) → 커서 자리로 · 그 밖 바라보는 방향으로.
- 서버(`RequestLearn`)가 만든 요약 문자열은 플랫폼·조작을 모르므로 알림은 내 화면에서 다시 만든다 (도약 · 도약 보유 중 질주 랭크업).

## Space(질주 키) 안내가 있는 곳
기존: `skills.csv` wraith_dash 설명 · `HudMain` 질주 칸 툴팁(245행, 사냥터 PC만) · `GuideWindow` 조작 카드(556행) · `SkillBook.NotifyLearned` 질주 배움 알림(「스페이스로 사용」).
추가: `skills.csv` dash_blink 설명 · 스킬 창 도약 「지금:」 줄 · 도약 보유 시 질주 「지금/다음 랭크」 줄 · 도약 배움 알림 2줄.
없음: `GuideCoach`·`skill_choices.csv`에는 도약·질주 안내 카드가 없다(손대지 않음).

## 메이커 (슬롯 3 핏빛망령 · 솔로 · 저장 끔 · 소리 0 · maker_save 0 · 빌드 Error 0 · LEA- 0)
- 회차 1 PC: Lv24·질주 7 → 실제 RPC `RequestLearn(dash_blink)` → 알림 3줄(before-pc-learn-notice-3lines) · 스킬 창 노드·질주 요약(after-pc-skillwin-*).
- 회차 2 PC: 알림 2줄로 줄임(after-pc-learn-notice-2lines) · 키보드 조작 `SetMouseMode(false)` 요약 = 「스페이스 · 바라보는 방향으로」 로그.
- 회차 3 모바일(`maker_set_platform mobile`): 스킬 창 「질주 단추 · 바라보는 방향으로」(after-mobile-skillwin-*) · 알림이 두 줄을 넘음(before-mobile-learn-notice-wraps) → 잠긴 문 괄호를 알림에서 빼고 스킬 창에만 둠.
- 회차 4 모바일: 알림 2줄(after-mobile-learn-notice-2lines · iPad 미리보기라 판 왼쪽이 화면 밖 — 알려진 iPad UI 잘림).
- 끝나고 플랫폼 PC로 되돌림.
- 입력: 캐릭터 「입장」·「솔로 플레이」·스킬 창 열기·노드 고르기는 함수 호출(`Enter`·`Solo`·`UIKit:Toggle`·`SkillWindow:Pick` — 마우스 도구가 엔진 UI 단추를 못 누름), K 실제 키 1회는 열기 타이밍이 어긋나 함수로 대체. 레벨·질주 7은 서버 치트. 알림 재표시는 `NotifyLearned` 타이머 재호출(4초 표시라 캡처 타이밍용).
- 핵심 로그: `key-lines.txt`.

## 한계
- 스킬 창 설명 칸은 엔진 줄바꿈이 글자 단위라 「넘습/니다」처럼 끊긴다(다른 스킬 설명과 같은 기존 현상).
- 설계 문서 `docs/design/62-skill-rank-audit-20261103.md`(241·368·723·825·829행) · `54-skill-names-A-20261101.md`(170·290·560행)의 옛 표현(「조준점 최대 5칸」 등)은 손대지 않음.
