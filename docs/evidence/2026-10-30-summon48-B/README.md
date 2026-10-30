# 48 갈래 B — 마법사 투사체 · 거인 기술 · 거인 모션 · 좌우 수정(비메이커) (2026-10-30)

브랜치 `wip/s48-B-skills-motion` (기반 `ca607845`). 메이커는 쓰지 않았다 — 아래 「메이커 대기」는 단일 메이커 담당 몫.
**완료 판정 아님**: 코드·오프라인 검사까지. 화면·실제 입력·좌우 「후」 측정은 메이커에서.

## 커밋
| 커밋 | 내용 |
|---|---|
| `1e2b234d` | 좌우 수정 — wip.patch 적용 · 0.15초 유지 타이머를 바꾸지 않기로 한 프레임에 0으로 되돌리던 원인 제거 · 공격·넉백 중 서버 좌우 바로 · 보정 뺀 걸음(WalkStep) · 진단 계수기는 `LookAuditOn`(기본 꺼짐) · motion-sync 규칙 9 · 불변식 3 |
| `e3b40d2d` | 48-2 마법사 속성 5 — 새 `Undead/MageBolts.mlua`(캐릭터·마법사 공용 외형·속도) · 마법사 세기는 랭크 구간 · 불꽃 폭발 늘 ×0.3 · 낙인 큰 값만 |
| `0e7e17e5` | 48-2 보강 — 구간 수치를 config(갈래 C 키)에서 읽음 · 표식 노드 id `mage_curse` |
| `6ce9c375` | 48-5·48-6 거인 기술 개편 + 모션 ①~④ (ShadowUnit·RiteGiantMoves가 서로 새 신호를 써서 한 커밋) |

## 결정 반영
- Q4 마법사 거인 스킬 1 = 화염 노바(저절로) · 스킬 2 = 기도 메테오(명령).
- Q7 노바 반경 2.5 · 얇은 고리(반경 0.5 → 2.5로 0.5초에 퍼짐 · 한 적 한 번 · 효과는 속 빈 고리, 면 없음).
- Q8 마법사 몸 = 지금 기본 몸 + 속성 색 칠(`MageBolts.BodyTint` — 연결은 A).
- Q9 불꽃 마법사 폭발 늘 ×0.3 (`MageBolts.BurstMul`).
- Q10 낙인 큰 값만: `MonsterStatus.TakenMult` = 1 + max(AmpPct, HexPct)/100 · 마법사 낙인은 IsCursed(HasCurse)에 들어가지 않음.
- Q1 `RiteGiantMoves.GiantImprint` 기본 true (노드 읽기 `NodeOf`가 거침).
- 메테오 반경 = min(radiusMax 2.0, radius 1.8 + 0.15 × 큰 메테오) — 타격·예고·착지 효과 모두 같은 값 · 영창 1.0 − 0.1 × 랭크 보존(3랭크 0.7초).
- 가드: 외형·속도만 공유(`MageBolts.Configure`), 세기는 각자(캐릭터 = SkillBook 구간·가시 10 · 마법사 = `MageTraits`). 방패 함성 몸 0 · 쌍칼 연속 베기 = 평타 그림 · 노바 = 기도 앞 3장(그림 오기 전엔 skill 그림) · 기본 거인 기술 0·도발 0.

## 검사 (이 폴더 로그)
| 검사 | 결과 |
|---|---|
| `npm test` (브랜치 단독) | 14/15 — 「스크립트 참조」만 실패: MageBolts가 읽는 config 키(mageTier2Lv 등)가 갈래 C에만 있음 (`npm-test.log`) |
| `npm test` (C `e9639aae` 임시 병합) | **15/15** (`npm-test-merged-with-C.log`) — 임시 브랜치는 지움 |
| quality 15묶음 (단독) | 모두 통과 · 새 `giant_skills` 60 · `mage_school` 99 · `facing` 12 · `giant_moves` 24(48 기준으로 갱신) |
| quality (C 병합) | `roster`만 실패 — C 단독에서도 같은 실패(지운 노드 장면 · A 소유). 나머지 통과 (`quality-merged-with-C.log`) |
| check_scripts · check_data · check_motion(33) · register_giant_visuals check | 0건 (check_scripts는 C 병합 기준) |
| mLua LSP | 8파일 오류 0 (info만: 기존 동적 호출 · C 키) |

## 메이커 대기 (한 담당 · 순서)
1. REFRESH — 새 `Undead/MageBolts.mlua` 짝 codeblock 생성 + 고친 7개 mlua(ShadowUnit에 @Sync `GiantHoldUntil` 추가) · 빌드 로그 0.
2. 좌우 「전/후」 같은 장면(해골 전사·마법사·그림자 · 앞뒤 몬스터 · 걷다 멈추기): `_MotionSmoother.LookAuditOn = true` → `LookReset()` → 30초 → `LookReport("after")` — 기대 walk·attack mismatch ≈ 0 (전: 걷기 46% · 공격 44% · flip 0) · 녹화.
3. 마법사 5속성 각각(저주 노드 전/후): `[VRF] mage bolt school=… trait=` · 격류 n발 · 서리 파편 · 불꽃 폭발 `burst r=` · 저주 낙인 + 캐릭터 낙인 동시 → 받는 피해 큰 값.
4. 캐릭터 뼈 창·저주 불꽃·서리 혼·영혼 격류 그림·속도가 전과 같은지 (공용 Configure 회귀).
5. 거인 종류별 자동/명령: `[VRF] giant skill cast/hit … radius=` — 기본 0 · 노바 둘레 2 이상만 · 메테오 명령만 · 영창 중 이동 0.
6. 메테오 반경: 큰 메테오 0 / 3랭크 → radius 1.80 / 2.00 · 착지 효과 지름 4칸 이내.
7. 모션 ①~④ 다섯 거인 10초 녹화: 평타 사이 `giant look play state=skill|hit` 끼임 0 · 회전 1.6초 반복 · 마법사 거인 평타 사이 이동 0.1칸 아래.

## 그림 의존 (K-4 대기 · 임시 화면을 최종 아트로 보고 금지)
- 기술별 몸 동작 `skill1`/`skill2`: 없으면 지금 `skill` 6장을 기술 길이만큼 반복(대검 회전·마법사 기도/노바·방패 내려찍기·쌍칼 돌진). 쌍칼 연속 베기는 평타 그림(재사용 · 새 그림 0). 방패 함성은 몸 동작 0.
- 효과 새 그림 자리 `SkillEffects.FxGiantNova` · `FxGiantFireMeteor` · `FxGiantRoar` = "" → 있는 효과(보라 고리 그림에 주황·강철 칠 · 불꽃 화살 · 파열 입자)로 임시. 슬램·회전·균열·돌진은 지금 J-6 그림에 거인별 색 칠.
- 마법사 투사체 5종은 캐릭터 그림 그대로(새 그림 0). 저주는 마력탄 + 보라.
- 등록 도구 `tools/register_giant_visuals.cjs` `EXTRA_STATES`: skill1 대검 4~6 · skill2 방패 6·대검 6·쌍칼 4~6·마법사 6 · 나머지 0(재사용). 있을 때만 검사·등록.

## 한계
- 단독 브랜치는 C(config·rite_giants·GameData) 없이 npm test 14/15 — 통합 순서 C → B.
- ApplyMageForm·MakeRecord·SpawnUnit 연결(속성·랭크를 유닛에)은 A 소유 → results `patch_requests_A`. 연결 전엔 옛 Element로 속성을 읽음(번개 → 영혼 · 독 → 뼈), 랭크 1.
- 피해 배율·반경은 초안(튜닝 초기값) — 균형·재미 증거 아님.
