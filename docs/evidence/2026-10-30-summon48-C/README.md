# 기획서 48 갈래 C — 데이터 · 노드/UI · 포인트 환급 · 저장 호환 · 시뮬 (2026-10-30)

- 담당: 갈래 C (격리 worktree) · 브랜치 `wip/s48-C-data-ui` · 기반 `ca607845` · 메이커 실행 없음 (MCP 미사용)
- 정본: `docs/design/48-summon-cleanup.md` + 공유 폴더 `summon48-review-decisions.json` (본문과 다르면 결정 우선)
- 커밋: `6bb963db` 48-0 데이터 → `5b7d07ce` 48-3 환급 → `f005a17f` UI → 48-7 시뮬 → 이 증거

## 적용한 결정
| 결정 | 반영 |
|---|---|
| Q5 기본 거인 노드 3 삭제 · 조용한 환급 | `giant_quake` · `giant_basic_split` · `giant_basic_return` 줄 삭제 → `MigrateLevels` 본문(정의 없음)이 한 번 돌려줌 · 알림 없음 |
| 글귀 §9 추천 1 · 저주 노드 이름 후보 2 | 「저주 속성」 · 해골 전사/쌍칼/해골 마법사/큰 메테오/원소 붕괴/두 겹 고리 설명 · 변경 해명 알림 없음 |
| 정정: 메테오 반경 상한 2.0 | `rite_giants.csv` mage `s2Opts radius=1.8;radiusMax=2` · 현재/다음 줄 `메테오 반경 2.00칸(최대)` · 영창 감소는 그대로(0.9 → 0.8 → 0.7초) |
| Q4 노바 자동 · 메테오 명령 / Q7 노바 2.5 | mage `s1=nova`(2.5 · `min=2;chant=0.3;grow=0.5;inner=0.5;ring=0.4`) · `s2=meteor`(×3 · 쿨 12 · single 6칸) |
| Q1 획득/판매 정책 | 손대지 않음 (새 상품·드롭·잠금 없음) |
| 가드: 모의 끝 레벨 | 41 · 68 · 90은 균형·재미·물리 입력 완료 증거가 **아니다** |

## 48-0 데이터 (노드 29 → 21)
- 삭제 9: `skel_shield` · `mage_aura` · `mage_twin` · `mage_pierce` · `mage_blast` · `mage_hex` · `giant_quake` · `giant_basic_split` · `giant_basic_return` (+ `skill_choices.csv` 기본 거인 묶음 2줄)
- 추가 1: `mage_curse` 「저주 속성」 (raise_mage · 1랭크 · need 4 · 아이콘은 `mage_hex` 그림)
- 결과: 해골 전사 6 · 해골 마법사 3 · 거인 노드 12 = 21 (`check_data` 48 블록이 지킴)
- `rite_giants.csv`: basic 기술·도발 비움 · greatsword 회전 반경 1.6 · ×0.5 · mage 노바/메테오 (모두 초안)
- `config.csv` 초안 16줄: `riteGiantMax 2` · `mageTier2/3/4Lv 6/11/16` · `magePierceBase 2` · `mageShardsBase 1` · `mageBurstBase 0.8` · `mageBurstStep 0.2` · `mageTorrentBase 2` · `mageCursePct 8` · `mageCursePerRank 0.6` · `skelEvolveRank 8` · `skelEvolveGuardPct 20` · `skelEvolveGuardStep 5` · `skelEvolveGuardRank2 14` · `skelEvolveGuardRank3 20` (config는 숫자 칸뿐이라 「1;6;11;16」 목록 대신 줄을 나눔)
- `check_data`: 기술 없는 거인 줄은 basic만 · 비운 칸에 수치 남으면 오류 · 메테오 radius ≤ radiusMax ≤ 2.0

## 48-3 환급 (한 번만 · 조용히)
| 저장 | 결과 (오프라인 회귀 `skills` 48 블록) |
|---|---|
| sv 4 옛 저장: skel_shield 3 · mage_twin 2 · mage_hex 3 · giant_quake 2 · giant_mage_pull 1 | +11 · 지운 칸 없음 · 메인 랭크 그대로 · 저장 sv 5 |
| 그 저장을 다시 불러옴 / MigrateLevels 재호출 / 같은 옛 저장 재접속 | +0 / +0 / 다시 +11(포인트도 옛 값이라 중복 아님) |
| sv 5 + giant_mage_resist 1 | 0 (새 효과로 찍은 것) |
| sv 4 + giant_mage_resist 1 | +1 |
| sv 3: step_gale 2 · mage_blast 3 · giant_basic_split 1 | +6 (44 교체와 48이 각각 한 번) |
| 현행 저장(지운 노드 없음) | 0 |
| skills.hope `s:d:shield=2,greatsword=1,twin=0/m:d:aura=1` | 대검·쌍칼 희망 보존 · shield는 FormOrder에 없으면 버림(갈래 A 뒤) · 저장 hope 그대로 |
| 알림 | NotifyLearned 0회 · 로그 `[VRF] skill migrate refund=` 만 |
- 저장 판: `SkillBook.GetSaveData` `sv 4 → 5` (`PlayerSave.Version` 2는 캐릭터 판이라 그대로)
- 변이 3건 모두 검출: `mutation-48-3.log`

## UI (스킬 창)
- 노드 트리는 csv에서 그대로 세움 → 지운 자리 자동 정리 · 「저주 속성」 노드 표시 · 해골 전사 필요 랭크 6 열이 3줄 → 2줄
- 상세(지금/다음): 해골 전사 효과 레벨 8부터 `방패 해골 공격 · 생명(×1.1) · 받는 피해 -20/25/30% · 4초마다 도발` · 해골 마법사 `관통 · 파편 · 폭발 칸 · 영혼 발` (+저주 속성이면 `낙인 +8~19.4%`) · 큰 메테오 상한 표시
- 시간선 단계 점: 해골 전사 8 「방패 해골」 · 해골 마법사 6·11·16 「마법 강화」
- 마법사 편성 칸: 변이가 없으면 숨김(갈래 A의 `FormOrder("mage")` 빈 표 뒤)
- 거인 상태: `GiantCount` · `GiantCapReached` · `GiantStanding` 임시 어댑터(서버 옛 꼴/목록 꼴 · 클라이언트 쉼표 목록) — `RiteBestStage`는 상한 도달만 5기 건너뜀. 갈래 A API가 오면 어댑터 본문만 바꿈
- `tools/build/ui.cjs` 변경 없음 (칸 8 · 열 6 안 · Form 칸 자리 그대로) → UI 빌드 불필요

## 48-7 시뮬 (`sim-giant-check-P60.log` · `sim-giant-check-P100.log`)
- `build`에 해골 마법사 속성 구간(mage_school_mul · 무리 대상 기대 2) · `--giant-check`에 +26(거인 2마리 상한 가정)
- 끝 레벨 41 · 68 · 90 모두 그대로 (P60 · P100 · +8/+13.5/+20/+26), 종료 코드 0
- 새 기준선(P60): 보통 171분 17초 · 악몽 135분 06초(전 135분 34초) · 지옥 135분 19초(전 136분 00초)
- **이 값은 균형·재미 완료 증거가 아니다** (경험치 경로 모델의 안전 범위 확인)

## 검사
- `npm test` 15/15 · `check_data` 0 · `check_scripts` 0 · `check_mobile_layout` 0 · `check_ui_tokens` 0 · mLua LSP 진단 0(SkillBook · SkillWindow · GameData · SkillData)
- 오프라인 Lua: skills · items · items_reforge · journal · mobile_input · notice_text · progression · spawn_zones · growth · dps 통과
- **roster(갈래 A 소유) · giant_moves(갈래 B 소유) 실패 — 예상된 통합 의존**: roster.lua가 지운 `skel_shield`/`mage_*` 노드 랭크로 편성을 만들고, giant_moves.lua가 basic `quake`/`bonethrow`·mage `meteor(s1)`/`hexfield`를 기대한다. A·B 갈래가 각자 고친 뒤 부모 통합에서 다시 돌린다 (`quality-groups.log`)

## 메이커 대기 (단일 담당)
1. 옛 저장(slot4 Lv40: raise_skeleton 9 · skel_shield 2 · skel_twin 1 · raise_mage 3 · mage_hex 1 · mage_twin 1) 로드 → 포인트 +4 한 번 · 로그 `skill migrate refund=4` · 저장 뒤 재로드 +0
2. 스킬 창 해골 전사 6 · 해골 마법사 3(「저주 속성」 포함) · 뼈 의식 거인 줄 · 글귀 · 지금/다음 값 · 단계 점(8 · 6/11/16)
3. 「저주 속성」 배우기 전/후 마법사 상세 줄 `낙인 +N%` · 큰 메테오 3랭크 `2.00칸(최대) · 영창 0.7초`
4. PC · 모바일 폭에서 상세 줄바꿈
