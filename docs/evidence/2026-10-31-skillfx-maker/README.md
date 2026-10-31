# 스킬 그림 메이커 회차 (2026-10-31)

대상: 골편 20 (`2026-10-31-skillfx-shard20`) · 9계열 88 (`2026-10-31-skillfx-nine88`) · 거인 메테오 L2 32 (`2026-10-31-giant-meteor-L2`) · C 7종 28 (`2026-10-31-skillfx-C7`) · HEAD d015924a → 805dd2c7(LEA-1102 수정)

판독 방법: 클립(ffmpeg avfoundation 「Capture screen 1」 · 게임 화면만 잘라 1600×900 · 각 4초)에서 프레임 시트를 뽑아 눈으로 판독 (shots/). 클라이언트에서 투사체 엔티티를 찾는 탐침은 실패(목록 0)해서 방향은 **영상 판독만** 근거다. 시간·배율은 `[VRF]` 로그(logs-vrf-excerpt.txt). 줌 100 = 화면 가로 12.8칸 → 클립 1칸 ≈ 125px.

## 1. 반영 · 빌드

| 단계 | 결과 | 근거 |
|---|---|---|
| refresh 1회 · touch 후 1회 더 | ❌ LEA-1102 2건 (MonsterStatus 781·832 `KeyFrames(…, (string.gsub(…)))`) | build-errors.log |
| 코디네이터 지시로 두 줄 수정 + 재발 검사 → refresh | ✅ build 13:35:31 · Error 0 · Warning 102 | 커밋 805dd2c7 · npm-test-after-fix.log 18/18 · quality-all-after-fix.log |
| play SelfTest | ✅ 410/0 (의도한 boom 1줄) | RUN-log 13:38:20 |
| 게임 코드 LEA-/LWA- (세션 전체) | ✅ 0건 | logs-vrf-excerpt.txt |

## 2. 장면표

| # | 장면 | 판정 | 근거 |
|---|---|---|---|
| **투사체 방향** | | | |
| P1 | 골편 투척 3발 부채꼴 · 오른쪽/왼쪽/왼쪽 위 — 촉이 진행 방향, 왼쪽에서 위아래 안 뒤집힘 | ✅ | shots/P1-right-shard-flame-closeup-30fps · P1-left-shard-closeup-30fps · P1-upleft-15fps · `bone shard volley n=3 spread=15` · `shard frames start n=4 ms=100 left=true` |
| P1 | 골편 명중 4장 · 1.2배 | ⚠️ 로그만 | `shard hit frames n=4 ms=100 scale=1.20` — 명중 순간이 몬스터 몸·피격 반짝임과 겹쳐 크기 판독 못 함 |
| P1 | 튕긴 골편 | ⚠️ | 오른쪽 클립에서 부채꼴 아래쪽으로 꺾여 나가는 골편 1발이 보임(P1-right closeup 1.00~1.07s) — 튕김인지 부채꼴 아래 발인지 구분 못 함 |
| P1 | 저주 불꽃(불꽃탄) 좌·우·왼쪽 위 — 밝은 핵이 앞, 불꽃 꼬리 뒤 | ✅ | 같은 시트 · `c7 projectile school=fire art=true n=4 scale=1.20` |
| P1 | 서리 혼 좌·왼쪽 위 — 밝은 결정 머리가 앞 · 명중 뒤 서리 파편 위/아래로 갈라짐 | ✅ | P1-left-shard-flame-frost-15fps(1.30~1.63s) · P1-upleft-15fps · `school=cold 1.60` · `cold_shard 1.07` · `frost split 3` |
| P1 | 영혼 격류 시전 4장 · 투사체 몸은 예전 혼 구슬 | ⚠️ 로그 위주 | `torrent cast frames n=4 scale=0.80` · `projectile hit fx style=torrent` ×4 — 클립 P1-downleft는 습격 몬스터에 가려 시전·명중 그림 판독 못 함 |
| M1 | 해골 마법사 불꽃탄(왼쪽) · 교단 광신 석궁병 몬스터 화살(오른쪽) | ✅ | shots/M1-mage-firebolt-left-vs-monster-arrow-right-30fps |
| R3 | 의식 3기 뼈 화살(왼쪽 표적) — 촉 왼쪽, 보라 꼬리 오른쪽 | ✅ | shots/R3-rite-arrows-left-30fps · `rite arrow 1/3…3/3 lock=true` · `projectile hit fx style=rite kind=bone art=true` |
| S1 | 원거리 그림자 중립 뼈 화살(왼쪽) — 보라 촉 왼쪽 · 속성 Tint 보라 · 명중 분홍 X 파열 | ✅ | clips/S1-shadow-ranged-bone-arrow 2.78~3.12s · `bone arrow skin n=4 scale=0.70 Shadow_cult_archer` |
| G | 거인 화염 구슬(불꽃탄 2.13배) | ⚠️ 로그만 | `mage bolt school=fire … giant=true` 1줄 — 화면에서 거인 구슬과 일반 불 마법사 탄을 구분 못 함 |
| — | 서리 마법사 · 저주 마법사 · 오른쪽 아래·오른쪽 위 대각 | 미확인 | 오른쪽 위 클립은 습격 몬스터가 가림 · 마법사 속성은 무작위(불·뼈만 나옴) |
| **9계열** | | | |
| B3 | 뼈 갑옷 두름 4장 → 몸 고리 | ✅ | shots/B3-armor-cast-drain-vortex-10fps(0.9~1.1s 몸 둘레 보라 빛 → 고리 유지) · `bone armor cast frames n=4` · `ring art layers=2 frames=8` |
| B3 | 흡수 3장 | ⚠️ 로그만 | `bone armor absorb frames n=3` 4회(294→286) — 그 시각 클립 없음 |
| — | 깨짐 4장 | 미확인 | 흡수량을 다 쓰는 장면을 만들지 못함 |
| B1 | 머리 위 표식 — 약화·쇠약·공포·가시 4개 한 줄(빨강 방울·초록 화살·주황 별·보라 해골), 밝은 바닥에서 읽힘 | ✅ | shots/B1-curse-circles-marks-5fps 1.50~2.30s · `curse marker … plate=true outline=true` (amp·weaken·terror·thorn·lifetap·resist·poison·chill) |
| — | 표식 어두운 바닥 · hex(저주 속성) 표식 | 미확인 | 저주 속성 마법사 미배정 · 어두운 바닥 표식 장면 없음 |
| B1/B2 | 저주 원형 판 6종 — 판정 원(분홍 범위 원)과 같은 크기 ≈2.7칸(설계 지름 3칸) | ✅ 크기 · ⚠️ 층 | B1 시트 1.30s 범위 원과 판 겹침 · `curse shape … circle=true` 6종 · 판이 플레이어·구울 몸 위로 흩날리는 조각처럼 보이는 장(1.70·1.90s)이 있어 「몸 안 덮음」 단정 못 함 |
| N4 | 망령 질주 왼쪽 잔상 — 길 위 망령 실루엣 2~3개 0.3초, 두건이 왼쪽(거울 맞음) | ✅ | shots/N4-dash-ghost-left-30fps · `dash ghost frames n=4 copies=4 mirror=true` · 오른쪽 질주·도약 도착 잔상 미확인 |
| R2 | 의식 2기 회오리 8장 반복 4초 · 범위 원 없이 읽힘 · 바닥 자국 | ✅ / ⚠️ 층 | clips/R2-rite2-whirl-at-archer-left · shots/R2-whirl-at-archer-consumed-dust-30fps · `rite whirl frames n=8 sec=4.0 scale=1.277 trace=true` — 회오리(몸 앞 층 5)가 표적 석궁병 몸을 대부분 덮음 |
| R2 | 소모 해골 뼛가루(발 자리) | ✅ | 같은 시트 흰 뼛조각 별이 해골 발 높이에서 0.3초 · `consumed dust frames n=4 scale=1.10 shared=true` |
| B3 | 생기 앗기 소용돌이 | ✅ | B3 시트 1.1~1.7s 표적 몸 빨강 소용돌이 + 분홍 혼 이동 · `drain vortex frames n=4 sec=0.70 scale=0.80` |
| P1 | 속성 명중 불·서리 | ✅ | P1-left 15fps 1.30~1.43s 빨강 파열·청백 파열 · `projectile hit fx kind=fire/frost art=true` · 뼈 명중은 R3 `kind=bone art=true` · 저주 명중 미확인 |
| **메테오 L2** (cellar1 · 액트 1 어두운 갈색 바닥) | | | |
| G4 | 예고 타원 대비 — 어두운 바닥에서 주황 불씨 타원이 분명 | ✅ | shots/G4-meteor-L2-left-target-2nd-use-4fps 0.25~1.0s |
| G4 | 왼쪽 표적 낙하 — 왼쪽 위에서 표적으로 비스듬히(FlipX) · 꼬리 방향 맞음 | ✅ | G4 1.25·1.50s · `meteor_fall … face=-1 flip=true travel=4.00` |
| G4 | 착지 → 잔불 → 옅어짐 이음 (1.75 착지 · 2.0~2.75 잔불 · 3.25 거의 사라짐) | ✅ | G4 시트 · `meteor_land … after=1.20` · `afterglow elapsed=1.218` |
| G4 | 착지 크기 3.6칸 | ⚠️ | 밝은 용암 부분 가로 ≈2.5칸(시트 판독) — 옅은 가장자리를 못 읽어 설계값과 같은지 단정 못 함 |
| G2 | **첫 사용**: 착지 1~7장·잔불 1~7장이 거의 안 보임 | ⚠️ | shots/G2-meteor-L2-left-target-first-use-15fps: 1.53s 착지 첫 장(작음) → 1.6~1.8s 빈 화면 → 1.87~1.93s 큰 용암 한두 장 → 2.0s부터 없음 (로그는 afterglow shown=9 elapsed=1.213로 정상 재생) — 같은 장면 3번째(G4)는 정상 |
| — | 액트 4 용암 바닥 대비 · 다른 플레이어 화면 | 미확인 | 액트 4 맵 이동 안 함 · 두 번째 클라이언트 없음. 서버 로그만으로는 「다른 화면에서 보이는지」 대체 불가(그리기·좌우 반전은 클라이언트 `GiantFxLocal`) |
| **C 7종** | | | |
| R1 | 해골 폭탄 뼈 폭발 — 발 자리 바닥 타원 + 빨강 폭발 · 몸 뒤 층(플레이어가 위에 그려짐) · 보이는 타원 ≈2.5칸 + 파편 | ✅ | clips/R1-rite1-skeleton-bomb-blast 1.2~1.6s · `c7 fx kind=blast scale=1.78 order=1 sec=1.20` |
| C7 | 제물 폭발 · 성찬 치유 고리 | ⚠️ 로그만 | `c7 fx kind=offering scale=0.80` · `kind=blast scale=1.07` — 클립 C7-offering-blast-heal은 플레이어·좀비·해골 몸이 겹쳐 판 판독 못 함 (층 1이라 몸에 가림 — 제안 참고) |
| B2b | 죽음의 파동 — 보라 가시 폭발 + 금빛 타원 0.75초 · 가시 끝 폭 ≈6.4칸 | ✅ | shots/C7-death-wave-12fps 0.97~1.38s · `kind=wave scale=2.62 sec=0.60` |
| B2 | 독 구름 반복 — 초록 바닥 2.0~3.8s 끊김 없음 | ✅ (4초 끝 미확인) | shots/B2-lifetap-resist-poison-4fps · `kind=poison loop=true sec=4.00` |
| C7 | 베기 플레이어 왼쪽 거울 · 흰 보라 초승달 | ✅ | clips/C7-slash-player-monster-summon 0.83~1.33s · `c7 slash player mirror=true` · 소환수 `c7 slash summon mirror=true`(로그) · 몬스터 베기 로그 없음 → 미확인 |
| **공통** | | | |
| — | 첫 사용 지연 | ⚠️ 메테오 L2 확인 · 나머지 미확인 | 위 G2/G4 비교. 회오리 첫 사용(14:15:54)은 플레이어 몸에 묻혀 비교 불가 |
| — | 뼈 폭풍 회전본 그대로 | 미확인 | 시전 안 함 |

## 3. ⚠️ 상세 · 제안 (코드 수정은 이 회차에서 안 함)

1. **메테오 L2 첫 사용에 착지·잔불이 비어 보임** — `RootDesk/MyDesk/Skill/SkillEffects.mlua` 309행 「메테오 L2: 4자리 첫 장」 미리 불러 두기가 자리마다 `Frames(...)[1]`만 넣는다. 제안: 착지·잔불(FxGiantMeteorImpact·FxGiantMeteorAfterglow)은 8장 모두 list에 넣기(예고·낙하도 같으면 32장). 9계열 297행·C 7종 304행도 같은 「첫 장만」 방식이라 회오리 8장·원형 판 4장도 같은 위험(이번에 비교 못 함).
2. **회오리가 표적을 덮음** — 회전 층 5(몸 앞). 표적 몸이 안 보여도 되는지 판단 필요. 바꾸려면 RiteWhirlFx의 회전 order를 1~2(몸 뒤)로.
3. **바닥 4계열 층 1** — 폭탄 폭발(3.25칸)은 보이지만 제물 폭발(1.95칸)·성찬 치유(1.46칸)는 작아서 몸에 거의 다 가림. README C7 제안대로 `SkillEffects.C7Orders` offering/blast=6 후보.
4. **원형 판 층** — 판 조각이 몸 위로 보이는 장이 있음(B1 1.70·1.90s). 원형 판 order 확인 권장.
5. 메테오 착지 크기 ≈2.5칸(밝은 부분) — 정밀 측정은 alpha 경계 보정 필요, 상수 변경 근거로는 부족.

## 4. 투사체 방향 전수 결과

거꾸로 나는 투사체 **없음** (본 범위 안에서). 확인: 골편 투척(→ ← ↖) · 불꽃탄(→ ← ↖ · 마법사 ←) · 서리탄(← ↖) · 서리 파편(위·아래) · 의식 3기 뼈 화살(←) · 중립 뼈 화살(←) · 몬스터 화살(→). 미확인: 오른쪽 대각선 두 방향 · 서리 마법사 · 저주 마법사 · 거인 화염 구슬 단독 판독 · 다른 플레이어 화면.

## 5. 저장 데이터 · 메이커 최종 상태

- 입장 전 13:38:45 readback 5/5 → 끝 14:31:53 before 0/5(방 입장·이동이 저장을 바꿈) → `slot4-restore-S48.lua` 본문(태그 SFM)으로 BatchSet ok 5 → 14:32:01 **after 5/5** (restore-SFM-readback.log)
- 메이커: 편집 모드 · map01

## 파일

- `RUN-log.txt` 시각·로그 짝 · 영상 sha256 / `logs-vrf-excerpt.txt` 세션 [VRF] 발췌 / `build-errors.log` 수정 전 빌드 오류 원문
- `clips/` 20개 (각 3.97초 · 0.4~1.2MB) / `shots/` 프레임 시트 17장 (jpg)
