# 48 연출 V2 · 갈래 A — 거인 외형 연결 · 몸 재생 경계 (10-30)

기반 `83936d93` · 브랜치 `wip/s48v2-A-body` · 메이커 조작 없음(그룹 자원 목록 조회만 · msw-mcp 읽기) · `data/monster_frames.csv`·`data/ui_icons.csv`는 수정하지 않음(부모 통합).

## 1. 외형 연결 대조 (예비 진단 확정)

| 묶음 | 지금 RUID 출처 | 그림 | 판정 |
| --- | --- | --- | --- |
| 기본 150 (5종 × stand4·move6·attack6·skill6·hit2·split6) | `docs/evidence/2026-10-30-goal-E/upload-pack` (J203 `png/frames`) 150/150 | 정본 V4와 sha 150/150 다름 | **구형 연결 (교체 대상)** |
| 기술 몸 33 (방패 skill2 6 · 대검 skill1 6 · skill2 6 · 쌍칼 skill2 6 · 마법사 skill1 3 · skill2 6) | `full-skills48-20261030/upload-48-66` + `upload-48-mage-skill1` 33/33 | full66 V4 계열 | 유지 |
| HUD 5 (`ui_icons` ui_giant_*) | goal-E 업로드(J7-HUD5) 5/5 | 정본 V4 HUD와 sha 5/5 다름 | **교체 대상** |

- 정본: `canon155-handoff.json`(sha f0fea663…) / `.csv` — 155/155 파일 sha 재계산 일치, V4 `records/final-delivery-verification.json`과도 150/150 일치.
- 그룹 OJYYQ 조회: 이번 업로드 전 V4 자원 0 (같은 이름 자원은 J203 한 벌, 생성 뒤 수정 0) → 「전부 미적용」·「엔진 캐시」가 아니라 **기본 150·HUD 5의 연결 누락**.
- 업로드(메이커 담당 bb3f8f63 · `summon48-spectacle-upload-V4-150.csv`): 155개 `<key>-V4` 신규 RUID — canon sha 155/155 대조 뒤 표에 채움. 추가 업로드 요청 0.
- 타이밍: canon `animation-timing.json`(stand 180 · move 120 · attack 90 · skill 100 · hit 150 · split 100ms · attack/skill 타격 칸 3)이 지금 표와 30줄 모두 같음 → **RUID만 바뀜**.

산출: `frames-remap.csv`(칸 183행: replace 150 · keep 33) · `frames-remap-sequences.csv`(거인 36줄 그대로 넣을 수 있는 줄 표) · `hud-remap.csv`(5행) · `monster_frames-proposed.diff`(34줄: 기본 30 + 기술 impact 4) · `body-binding-audit.json`/`-summary.json` · `scripts/`(재생성 스크립트).

## 2. 상태 전환 외형 유지 (코드 경로)

대기/이동/평타(`StandRUID`·`MoveRUID`·`AttackRUID` ← `UndeadSystem.GiantLook`) → 피격/소멸/기술(`ShadowUnit.GiantPlay` → `GiantLook[key]`) → 복귀(`SetClip`) 모두 같은 `giant_<form>` 표에서 온다. 어긋남의 원인은 표의 기본 RUID뿐 → remap을 넣으면 외형군 하나(로컬 적용 검사 `GIANT_BODY_STRICT=1` 통과: 「5종 모두 V4 한 외형군」). 쌍칼 연속 베기는 평타 첫 칸(attackFirst)이라 remap 뒤 V4.

## 3. 몸 재생 경계 (MotionSmoother)

- 6장 상한·고정 장 수 코드 없음(확인). `FrameClip`은 이미 누적 시간 선택 → `FramePick`으로 분리(표 주도 · 장 수 무제한).
- 보강: ① 거인 동작 색인을 이름 고정(skill·skill1·skill2·hit·split) → 표에 있는 모든 동작(새 키도) ② hold 중 반복은 표 loop 동작과 평타 반복(연속 베기)만 — 한 번 동작은 되감지 않고 마지막 칸(준비 자세 두 번 방지 · 지금 표에선 행동 변화 0) ③ 타격 칸(impact→s)은 긴 프레임(멈칫)에도 건너뛰지 않음 ④ 루프 이음: `f.ls`(반복 시작 칸) 지원 — 열은 아직 없음(필요 시 C/부모).
- 칸 누락 조건: 지속 < 화면 갱신 주기일 때만(그 화면의 표본 문제). **1/30초는 필수 규칙·엔진 상한이 아니다**(코덱스 정정) — 실제 표는 경고로만 보고하고, 16장 0.4초(25ms)가 60·50Hz에서 누락·늘어남 0인지를 검사한다. 30fps 하드캡·일괄 지연 없음.
- 서버 타격 시각: 클라이언트 시작 기준 재생이 피해 숫자(같은 지연으로 도착)와 정렬되므로 서버 시각 고정은 하지 않음(근거 기록).

## 4. 함성 몸 (ShadowUnit · A-ROAR-01 코덱스 확정)

- 키 = **shield `skill1`** (C 등록 검증표 함성 몸 8~12장과 같은 키 · `roar` 별칭 없음). 그림이 없으면 몸 동작 없음(일반 skill로 대신하지 않음).
- `ShadowUnit:GiantRoarBody(onStart) → number`: 0 = 지금 몸 시작 · >0 = 그 초 뒤 시작 예약(평타가 끝난 순간 · 0.6초 안일 때만) · -1 = 몸을 걸 수 없음(기술·소멸 중 · 평타 0.6초 초과 · 그림 없음). 맞음 그림은 덮는다.
- `onStart(bodyStarted)`는 몸이 실제로 시작하는 순간 불린다 → **함성 FX를 그때 시작**. 예약 사이 기술이 시작돼 몸을 못 걸면 `onStart(false)`(FX만 그때). -1이면 부른 쪽이 **FX를 바로**(지금 동작).
- 이중 재생 방지: ShadowUnit.TauntTick은 몸을 직접 걸지 않는다 — `RiteGiantMoves.Roar` 한 곳이 `GiantRoarBody`를 부른다(B 규격). 도발 대상·적용 시점·반경·보스 제외는 TauntTick 그대로.

B `Roar` 연결 예 (B 소유 · 지금 B 36888c4f의 `body`/`GiantPlay("skill1")`/`delay` 부분을 대신):

```lua
local function fxNow() ... 함성 FX(v2 FxGiantRoarSeq 또는 옛 고리) ... end
local r = unit:GiantRoarBody(function(started)
    local d = started and self:BodyImpactSec(unit, "skill1", 0) or 0
    if d > 0 then _TimerService:SetTimerOnce(fxNow, d) else fxNow() end
end)
if r < 0 then fxNow() end
```

## 5. 타격 칸(impact) 제안 — 기존 `impact` 열(0부터 · gen_data `s = impact+1`)

| 줄 | impact | 근거(지금 서버 시각) |
| --- | --- | --- |
| 대검 skill1 회전 | 0 | gap 0.4초마다 t=0부터 · 6칸 0.4초 루프 |
| 대검 skill2 땅 가르기 | 3 | 첫 토막 plant 0.3초 = 칸3 시작 |
| 방패 skill2 내려찍기 | 3 | FX 0.12초 = 칸3 시작 (피해는 지금 0초 → B 맞춤 요청) |
| 마법사 skill1 노바 | 2 | 영창 0.3초 뒤 폭발 = 칸2 시작 |
| 방패 skill1 함성 몸(새 그림) | C 검증표대로 필수 | 몸 시작 = FX 시작(onStart) · 함성 칸까지 지연은 impact |
| 쌍칼 skill2 돌진 · 마법사 skill2 기도 | 빈칸 | 즉시 피해·루프 기도 |

`GiantLook`에 `<동작>Hit`(타격 칸까지 초)를 실어 B가 피해 시각을 몸 칸에 맞출 수 있다. 새 아트(12~16장)가 오면 `frames-remap-sequences.csv`에 줄만 바꿔 넣는다.

## 6. 검사

`tests/quality/giant_body_playback.lua` 542 checks(12·16·64장 · 16장 0.4초(25ms) @60/50Hz ±20% 누락 0·늘어남 0 · 루프 이음·ls · hold 되감기 없음 · 타격 칸 · 새 키 표 주도 · 실제 표 짧은 칸 경고만·첫 칸 겹침 0 · 외형군 · 함성 몸 skill1+onStart 9) · `quality-all.log` 17그룹 통과 · `npm-test.log` 15/15 · `check_scripts.log` 0 · `mlua-lsp.log` 3파일 clean · remap 로컬 적용 상태(커밋 제외) npm test 15/15 · check_data 0 · 엄격 외형군 통과.

## 7. 메이커 확인 장면 (단일 담당)

remap 반영 + gen_data + refresh 뒤, 종마다 짧은 연속 녹화: 기본 대기 → 걷기 → 평타 → 기술(대검 회전·땅 가르기 / 방패 내려찍기·함성(몸과 FX가 같은 순간 시작하는지) / 쌍칼 돌진 / 마법사 노바·기도) → 대기 복귀. 같은 줌에서 몸통·두건·보라 천이 바뀌지 않아야 한다. 탐침: `[VRF] giant look play` 로그 + 대역 SpriteRUID가 V4 RUID 집합 안인지.

## 한계

- 실행 화면 미확인(메이커 미사용) — 「기본 몸 완료」 아님, 녹화로 확인할 것.
- 엔진 공식 프레임·텍스처 상한은 조사하지 않음(코드 상한 없음만 확인).
- `data/pending/giant-visuals-registration.csv`(J203 RUID 155줄)는 C/부모 검증표 소관 — V4 RUID로 함께 갱신 필요.
