# 48 연출 V2 — 갈래 B (노바 단발·범위 · 대검/방패 효과 재생·레이어) 10-30

기반 `83936d93` · 브랜치 `wip/s48v2-B-fx` · 메이커 미사용(비메이커 검사만) · csv는 갈래 C(`0f72d37f`) 값 · 몸 타격 칸은 갈래 A(`8877d73a`) `GiantLook.<동작>Hit`를 읽음(이 브랜치는 B 파일만)

## 바뀐 것

| 항목 | 전 | 후 |
|---|---|---|
| 노바 타격 | 0.5초 동안 6표본으로 퍼지는 고리 · 노드면 0.4초 뒤 ×0.5 둘째 파동(`skill.giant_nova2`) | 영창(몸 방출 칸 `skill1Hit` · 없으면 chant 0.3) → 폭발 그림 1번 → burst 0.18초 뒤 **한 번의 조회**로 반경 `s1Radius`(3.75) 안 적 **정확히 1회** · 계수 `s1Mul × novaAmpMul`(노드 시 1.5 · 미강화 1.0) · 둘째 파동·둘째 그림·지연 타격 0 · 흡인 없음 |
| 노바 보존 | — | 재사용 8 · 자동 발동 min 2(둘레 판정도 3.75 — 사용자 「범위 50%」 의도) · 화염(`skill.giant_nova`) · 원소 붕괴 맞은 뒤 · 평타 쉼 0.8/1.2초 · 몸 skill1 0.8초 · 메테오 반경 1.8/상한 2.0 불변 |
| `giant_nova2` | SkillElement fire | 경로 삭제(RiteGiantMoves·SkillElement 표) · nova·meteor fire 그대로 |
| FX 장 간격 | `spec.sec` 없으면 `max(0.04, seconds/n)` | `GiantFxFrameSec`: **sec > impact > cycle > span > fit > 옛 바닥** · `[VRF] giant fx … rule=` |
| PlaySeq | 장마다 `frameSec` 뒤 다음 장(밀림 누적) | 예정 시각 = 시작 + k × 간격(60Hz로 늦어도 밀림 0 · 장 건너뜀 0) · 0.03초 앞 장 지움 **유지** · peak 칸 불투명 1 → 잔광 옅어짐 · 끝에 `[VRF] giant fx play shown/n elapsed/planned` |
| 몸 따라가기 | 회전 그림은 시전 자리에 고정(×0.6로 걸으면 어긋남) | `GiantMoveFxOn(kind, anchor, offset, facing, …)` — 장마다 `MotionSmoother:VisOf` 화면 몸 위치 |
| 대검 회전 | GameConst 6장 1층 order 6 | V2 `FxGiantSpinBack`(order 1) + `FxGiantSpinFront`(order 6) 같은 시각·주기 · 한 바퀴 = `gap`(`SpinCycle`) · 임의 장 수(12~16) · angle 0 · 배율 양수(상하 회전·뒤집기 없음 — 코드에 원래도 없음) |
| 땅 쪼개기 | 첫 토막 시각에 4장(rise/3) | 첫 토막·균열 그림 = 몸 강타 칸 `skill2Hit`(없으면 plant 0.3) · V2 `FxGiantRiftSeq`: 그 시각에 rise+잔광 0.65초 동안 모든 장(fit) · 판정 4토막·6칸 그대로 · `[VRF] giant sync s=rift body= plant=` |
| 방패 내려찍기 | 피해 즉시 · 그림만 0.12초 뒤 | 피해·묶기·그림을 **몸 타격 칸 시각**에 함께(`BodyImpactSec` = A `skill2Hit` → monster_frames impact 앞 장 합 → 없으면 0.12 · 상한 0.4) · 그동안 제자리 · V2 두 층 `FxGiantSlamSeq`(분출 몸 뒤) + `FxGiantSlamFront`(접점 광 몸 앞) · 접점 = 발 + (ax × 방향, ay) · 왼쪽이면 FlipX만 |
| 방패 함성 | 몸 동작 없음 · 머리 위 작은 고리 | 몸 = A `GiantRoarBody`(`roar` 그림 있을 때 · Roar는 몸을 걸지 않음) · V2 `FxGiantRoarSeq`는 **몸 시작 신호**(A와 같은 규칙으로 예정 시각 + 한 화면 뒤 `CurrentClip` = roar 첫 칸 확인) + `roarHit` 뒤 몸을 따라 · 몸 생략·미시작이면 바로 · 도발 범위·보스 정책 불변 |
| 대검 회전 첫 타 | 즉시 | `skill1Hit`(지금 0) 뒤부터 gap마다 4번 |

새 그림이 비어 있으면 지금 그림(GameConst 66장 · FxGiantNova 6장 등) 경로 그대로 — `giant_fx_playback` ⑥.

## 그림 계약 (부모가 RUID와 함께 채움 · `SkillEffects.FxGiant*Opts` = 「키=값;…」)
`w·h`(원본 px) · `ref`(그림의 세계 지름 칸 · 56px=1칸) · `impact`(타격 칸 1부터 = register hitFrame + 1) · `sec`(고정 간격 · 최우선) · `span`(한 번 길이) · `order`(1 뒤/6 앞) · `ax·ay`(접점 앵커 칸 · 오른쪽 기준) · `face`(right/left 그려진 방향) · `flip`(true/false)
- 노바 16장 예: `FxGiantNovaOpts = "w=…;h=…;ref=7.5;impact=5"` → 간격 0.18/4 = 0.045 · 타격 칸 = 서버 타격 · `sec=`를 따로 적으면 우선(어긋나면 `[VRF] giant fx impact drift`)
- 회전 16장: 간격 = gap 0.4/16 = 0.025 (C 검증표 「0.04 미만 → spec 명시」 경고는 cycle 규칙이 명시에 해당)

## 검사
| 검사 | 결과 | 로그 |
|---|---|---|
| quality 전체 17그룹 | 통과 (giant_skills 105 · giant_fire 28 · **giant_fx_playback 45 새** · giant_moves 24) | `quality-all.log` |
| npm test | 15단계 통과 | `npm-test.log` |
| check_scripts | 145개 문제 0 | `check_scripts.log` |
| mLua LSP | 3파일 오류 0 (RiteGiantMoves info 1 = 기존 쌍칼 `fx` 겹침 · PlayerAttack 경고 2 = 기존 IsPCPlatform) | `mlua-lsp.log` |
| A(`8877d73a`)+C(`0f72d37f`) 임시 병합 + gen_data | quality 전체·A giant_body_playback 529·npm test 통과 · LSP 오류 0 (병합 되돌림 · csv·A 파일 커밋 없음) | `quality-merged-with-A-C.log` · `npm-test-merged-with-A-C.log` |

## 한계
- 메이커 미실행: 실제 화면 주기·EffectService FlipX·몸 대역 따라가기·겹침 밝기는 실녹화로 확인(maker_queue).
- 회전 0.025초/장(16장/0.4초) 60Hz 재생 허용: 4바퀴 1.6초 ±1화면 · 건너뜀 0 (30fps 상한 없음). 0.03초 지움 < 장 간격이 아니라 층당 최대 3장이 한 화면 겹침(대역 측정 2층 6) — 빈 화면 수정 유지의 대가.
- 몸 그림 재생(FrameClip 12~16장·루프 이음)은 갈래 A · monster_frames impact 열·RUID는 부모/C.
