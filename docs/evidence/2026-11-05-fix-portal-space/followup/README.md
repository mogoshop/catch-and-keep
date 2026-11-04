# 포털 구역 안 Space 질주 차단 — 정식 경로로 (11-05 후속)

앞 차선(16bed341·be5b21ca)은 `SkillBook.mlua`를 건드릴 수 없어, 포털 안내(`NpcWindow.Poll`, 0.2초마다)가 질주 연타 막이 시각 `SkillBook.MovePredictAt`을 앞으로 밀어 질주를 막았다. 한계: 구역에 막 들어선 0.2초 안의 Space는 질주가 먼저 나갈 수 있음 · 질주 코드가 바뀌면 깨짐.

## 바꾼 것
- `Skill/SkillBook.mlua` `CastMove` (Space·모바일 질주 단추·슬롯에 넣은 질주가 모두 지나는 한 곳, 마을 검사 바로 뒤): `_NpcWindow:FindGate(self.Entity)`가 있으면 그대로 return — 마나·질주 칸·쿨다운을 건드리기 전이라 아무것도 쓰지 않는다. 판정은 안내 단추와 같은 `NpcWindow.FindGate`(포털·심도 문 `InZone(p, 0)`, 게이트 목록만 1초 캐시 · 위치는 매번)라 새 판정 없음. 안내 갱신 주기(0.2초)와 상관없이 누른 그 프레임의 위치로 본다.
- `UI/Windows/NpcWindow.mlua`: 임시 `HoldDash`(MovePredictAt 밀기) 메서드와 호출 2곳(`Talk`·`Poll`) 삭제, 머리 주석 갱신.
- `data/config.csv`·`Data/GameData.mlua`: 쓰지 않는 `depthEnterDwell` 줄 삭제(`node tools/gen_data.cjs` 재생성 · 다른 참조는 `DepthGate.mlua` 머리 주석의 옛 규칙 설명 한 군데뿐).

## 메이커 확인 (02:03~02:10 · 슬롯 3 핏빛망령 Lv4 · 솔로 방 · 저장 끔 · 소리 0 · maker_save 0회)
모든 입력은 실제 키(방향키·Space·3). 슬롯 고르기·입장·솔로는 마우스 클릭. 관측은 클라이언트 PROBE 스크립트(구역 출입 시각·Space 순간의 마나/질주 칸·0.6초 뒤 값) — `key-lines.txt`.

| 확인 | 입력 | 결과 |
|---|---|---|
| **사냥터 귀환 포털, 들어선 지 0.2초 안 Space** | 귀환 두루마리 실제 키 3 → → 누른 채 0.3초 뒤 Space | 진입 **0.121초** 뒤 Space · `dash held by gate=ReturnGate` · 서버 `dash charge used` 없음 · 마나 46.0→46.0 · 질주 칸 1→1 · `-> town` |
| 사냥터 출구(GateBack) 걸으며 Space ×2 | ← 누른 채 Space | 진입 0.260·0.276초 뒤 · 질주 막힘 · 마나·칸 그대로 · `-> town` |
| 구역 밖 Space | ← 누르자마자 Space(구역 0.7칸 앞) | `dash charge used` · 마나 46.0→42.6 · 칸 1→0 · 1.5칸 질주 |
| 마을 귀환 포털 | ↑·← 걸어가 Space | `-> wasteland` (캡처 2) |
| 마을 남문(맵 출입구·사각 구역) ×3 | ↓ 5초 → Space (한 번은 진입 0.156초 뒤) | `-> wasteland` |
- 빌드 Error 0 (Warning 110 · 바꾼 파일 0) · LEA- 0 · [SelfTest] 통과 409 / 실패 0 · `npm test` 21/21.
- 캡처: `1-field-gate-prompt-no-dash.png`(사냥터 출구 구역 안 「Space · 잿불 야영지」, 마나 46/46) · `2-town-portal-prompt.png`(마을 귀환 포털 「Space · 피 묻은 황무지 (핏빛망령)」).

## 못 한 것 · 한계
- 모바일 질주 단추(MobilePad → `CastMove`)는 같은 함수를 지나 코드상 같이 막히지만, 모바일 플랫폼 실제 터치는 하지 않았다(PC로만).
- 심도 문(DepthGate)은 이번에 다시 돌리지 않았다 — 같은 `FindGate` 목록(WarpGate+DepthGate)에 들어 있어 경로는 같다.
- 판정 기준은 클라이언트 반경 그대로(여유 0). 서버 진입 여유(+0.6)보다 좁아, 구역 가장자리 바깥 0~0.6칸에서 Space를 누르면 질주가 나간다(예전과 같음 · 안내 단추가 뜨는 범위와 일치).
- PROBE의 `promptGate`는 이번 시험들에서 모두 이미 갱신돼 있었다(안내가 늦은 프레임을 일부러 만들지는 않음). 정식 경로는 안내 갱신과 무관하게 누른 순간 위치로 판정한다.
