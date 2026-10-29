# goal C — I05 실전 계측 (2026-10-30)

브랜치 `wip/goal-C-dps` (기반 main 4ba51d5e). **계측·집계·시험 계획·자동 수집 준비 완료 / Maker 실행·실제 빌드 비교 미실시.**

## 구성

| 파일 | 내용 |
|---|---|
| `RootDesk/MyDesk/Monster/Monster.mlua` | `ApplyHpDamage` — HandleHitEvent·TakeDamage(TakeDamageAs)의 HP 감소를 한 곳으로 (보호막 RiteAbsorb 1회 · 게임 계산 불변). `DpsTag`·`RestoreHp`·생명 사건(spawn·respawn·rebase·scale·reset·death) · 유효 피해 > 0이면 `PlayerDealtDamage` |
| `RootDesk/MyDesk/Progress/Telemetry.mlua` | 「개발용 전투 계측」 절(DpsOn 기본 false · Sessions 밖 링 버퍼 · `[DPS]` 로그만) + 「성장 관측」 절(D P1·P3·P4·P5·P7) |
| `tools/dps/aggregate.cjs` | 로그 → 총구간·전투 구간 DPS · TTK · 출처·미상 비율 · 피격/사망 · 마나/혼 · 전멸/복구 · 설명 1타/가정 상한/실측 |
| `tools/dps/selftest.cjs` | 집계 도구 자체 시험 30개 (npm test 「DPS 집계 도구」) |
| `tools/dps/maker-blocks.cjs` | 메이커 붙여 넣기 조각 · 실행 순서표 · luac 문법 검사 |
| `tests/quality/dps.lua` | 실제 mLua 본문 오프라인 회귀 71개 (중복 귀속·상한·저장 분리·성장 관측) |
| `docs/evidence/2026-10-30-goal-C/test-plan.md` | 시험 계획 (빌드 예산·장면·순서·기대 로그·소요 시간·판정 규칙) |
| `docs/evidence/2026-10-30-goal-C/DPS-maker-scripts.lua` | 자동 수집 스크립트 (S00 점검 · S10 장면 · S90 마감) |
| `docs/evidence/2026-10-30-goal-C/logs/` | 회귀·자체 시험·문법 검사·대역 실행·예시 집계 출력 |

## 로그 키

- `[DPS] start|window|owner|src|life|sample|ev|…|end|halt|stop` — Telemetry.DpsStart/DpsFlush/DpsStop
- `[DPS-RUN] preflight|setup|queued|begin|targets|wipe|finishing|end|skip` — 수집 스크립트
- 원장 한 줄: `[DPS] ev|run|n|t|kind|life|seq|attempt|owner|attackerKind|src|before|after|raw|absorbed|effective|overkill`

## 다시 돌리기 (Maker 없이)

```
npm test
python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua
node tools/dps/selftest.cjs
node tools/dps/maker-blocks.cjs --check /private/tmp/lua-5.4.8/src/luac
node tools/dps/aggregate.cjs tools/dps/fixtures/oracle-full.log --calc <parallel-analysis/combat/results/comparison.csv>
```
