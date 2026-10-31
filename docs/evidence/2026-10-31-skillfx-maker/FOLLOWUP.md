# 스킬 그림 후속 수정 (2026-10-31 · 메이커 회차 README 3절 ⚠️ 1~4)

기반 HEAD b967115a · 메이커 도구는 쓰지 않음(코드·오프라인 테스트만) · 화면 확인은 다음 메이커 회차 몫.

## 수정 표

| # | 항목 | 파일:행 | 전 | 후 | 테스트 |
|---|---|---|---|---|---|
| 1 | 여러 장짜리 그림 미리 불러 두기 (README 3-1 · G2 메테오 L2 첫 사용 착지·잔불 빈 장) | `RootDesk/MyDesk/Skill/SkillEffects.mlua:286-333` (OnBeginPlay) | 9계열 13자리·C 7종 7자리·메테오 L2 4자리·원형 판 6종·표식 12종은 자리마다 `Frames(...)[1]` 첫 장만 · 중복 RUID도 그대로 넣음 (약 129장) | 모든 자리 **모든 장** (9계열 15자리 = 뼛가루·뼈 명중 포함 · C 7종 × 4 · 메테오 L2 × 8 · 원형 판 6 × 4 · 표식 12) · `add()`로 중복 RUID 한 번만 → **229장** · 방식은 그대로(`_EffectService:PlayEffectAttached` 0.1배·알파 0 → 3초 뒤 지움, 클라이언트·내 캐릭터만, 타이머 1개 그대로) · `[VRF] preload n=%d started=%d` 한 줄(출시 끔) | nine ②·c7 ③·meteor ⑤·shard ⑤: 자리마다 「미리 부른 장 수 = 그 자리 장 수」 · RUID 중복 0 · `[VRF] preload n` = 실제 부른 장 수 · OnBeginPlay에 `)[1]` 0건 · 회오리 8 · 원형 판 24 · 표식 12 · 메테오 32 · 창 골편은 제외 |
| 2 | 의식 2기 회오리 층 (R2 · 표적 몸을 덮음) | `SkillEffects.mlua:157-158` | `RiteWhirlOrder = 5`(몸 앞) · `RiteWhirlTraceOrder = 1` | `RiteWhirlOrder = 1`(몸 뒤) · `RiteWhirlTraceOrder = 0`(회오리보다 아래) — 근거: MSW 기본 OrderInLayer 몬스터·NPC 2 · 다른 아바타 3 · 내 아바타 4(문서 「Map Layer · Model's Layer Order」) → 2는 몬스터와 같은 순서라 앞뒤가 배치 순서에 달림 · 0은 DarkVision이 맵 그림 Art*를 순서 0 · z +0.05 뒤로 내린 층이라 자국(z 0)은 맵 그림 위·회오리 아래 | nine: 회전 loop order = 1 · 자국 hold order = 0 · 자국 < 회오리 < 2 |
| 3 | C 7종 성찬 치유·뼈 폭발 층 (C7 · 몸에 가려 판독 불가) | `SkillEffects.mlua:172` | `C7Orders = "blast=1;offering=1;wave=1;poison=1"` | `"blast=6;offering=6;wave=1;poison=1"` · 크기 표(C7OldW·C7FitPx) 그대로 → 제물 폭발 1.95칸·성찬 1.46칸 유지 · **주의**: 해골 폭탄 폭발(3.25칸)도 같은 blast 칸이라 함께 몸 앞으로 감 | c7: C7Orders 표 값 · C7Fx blast/offering = 6 · wave = 1 · poison loop = 1 · `[VRF] c7 fx … order=` 값 · 크기 표 그대로 |
| 4 | 저주 원형 판 층 (B1 · 판 조각이 몸 위로 보이는 장) | `SkillEffects.mlua:148`(새 상수) · `:2508`(CurseShape) | 원형 판이 문장 상수 `CurseSigilOrder`(1)를 빌려 씀 | 원형 판 전용 `CurseCircleOrder = 1`(바닥 층 · 몸 뒤)로 고정 · 피벗·크기(CurseCircleFitPx·CurseCircleScale) 그대로 · 문장 `CurseSigilOrder` 1 그대로 | nine: 원형 판 hold order = `CurseCircleOrder` = 1 |

값은 이미 1이었으므로 4번은 「층을 따로 고정」이지 화면 변화가 아니다. 메이커에서 판 조각이 여전히 몸 위로 보이면 층이 아닌 원인(그림 안 위로 튀는 조각 · 다른 효과와 혼동)을 의심할 것.

## 테스트

- `npm test` 20/20 통과
- `python3 tests/quality/run.py --lua …/lua-5.4.8` 전체 통과 — skillfx_shard 207→220 · skillfx_nine 597→613 · giant_meteor_l2 393→405 · skillfx_c7 269→283 · skillfx_e 560 그대로

## 메이커에서 다시 볼 장면

1. **메테오 L2 첫 사용**(새 방 입장 직후 첫 시전): 착지 1~7장·잔불이 G4(3번째 사용)처럼 이어지는지 · `[VRF] preload n=229 started=229`
2. **의식 2기 회오리**: 회전 그림이 표적 몸 뒤로 가고 몸이 보이는지 · 바닥 자국이 회오리 아래·맵 그림 위에 보이는지
3. **뼈 성찬**: 성찬 치유 고리·제물 폭발이 몸 앞에서 읽히는지 · 해골 폭탄 폭발(같은 blast)이 몸 앞으로 와도 괜찮은지
4. **저주 원형 판 6종**: 판이 플레이어·구울 몸 아래로만 보이는지 (B1 1.70·1.90s 장면)
