# 스킬 그림 메이커 회차 (2026-10-31) — 빌드 오류로 중단

대상: 골편 20 (`2026-10-31-skillfx-shard20`) · 9계열 88 (`2026-10-31-skillfx-nine88`) · 거인 메테오 L2 32 (`2026-10-31-giant-meteor-L2`) · C 7종 28 (`2026-10-31-skillfx-C7`) · HEAD d015924a

## 결과: 플레이 전 중단

| 단계 | 결과 | 근거 |
|---|---|---|
| refresh 1회 | ❌ build Error 2 (LEA-1102) | `build-errors.log` refresh 1 · `RUN-log.txt` |
| 부르는 파일 touch → 5초 → refresh 1회 더 | ❌ 같은 Error 2 | `build-errors.log` refresh 2 |
| play · 장면 확인 | 하지 않음 (지시: 두 번째 refresh도 Error면 중단) | — |
| 저장 데이터 · 슬롯 4 | 손대지 않음 (play 안 함) | — |
| 메이커 최종 상태 | 편집 모드 · map01 | — |

장면표(골편·투사체 방향 전수·9계열·메테오·C 7종·첫 사용 지연)는 전부 **미확인 — 빌드 오류로 play 안 함**.

## 오류

```
LEA-1102 table KeyFrames(string list, string key)
  MonsterStatus.MarkerIcon +4      = RootDesk/MyDesk/Monster/MonsterStatus.mlua:781
  MonsterStatus.UpdateCurseMarker +41 = RootDesk/MyDesk/Monster/MonsterStatus.mlua:832
```

두 줄 모두 `_Util:KeyFrames(_GameConst.FxSkillMarks, (string.gsub(markKey, "^mark_", "")))` 꼴 (0f6e877e 9계열 88키에서 들어옴). 같은 `KeyFrames`를 부르는 HudMain·SkillEffects 6곳은 오류가 없고 함수 모양도 그대로라 「옛 모양이 남은」 stale 오류가 아니다. mlua 컴파일러가 괄호로 감싼 `string.gsub`(반환 2개)를 인자 3개로 세는 것으로 보인다. 로컬 Lua 검사(`tests/quality`)는 괄호 규칙대로 잘라 통과해서 못 잡았다.

영향(추정): `MonsterStatus`가 컴파일되지 않으면 몬스터 상태(저주 표식·머리 위 문양 등) 전체가 깨질 수 있다. 9계열 「머리 위 표식 12」 장면은 이 오류가 풀려야 볼 수 있다.

## 제안 (코드 레인 몫 · 이 회차는 고치지 않음)

`MonsterStatus.mlua` 781행·832행의 인자를 값 하나만 돌려주는 식으로:

```lua
local markKind = string.match(markKey, "^mark_(.+)$") or markKey   -- 또는 local markKind = string.gsub(...) 로 먼저 받기
... _Util:KeyFrames(_GameConst.FxSkillMarks, markKind) ...
```

(832행은 `markKey or ""` 를 먼저 감싼다.) 고친 뒤 refresh → build Error 0을 보고 이 회차를 다시 연다. 다시 열 때 이 폴더를 그대로 이어 쓴다.
