# 뼈 쐐기 효과 3안 실제 적용 비교 (11-04)

사용자 요청: 암살·블레스 오브 다크니스는 키워서, 스킬 63141501은 가시를 여러 개 흩어서 실제 게임 화면으로 비교.
게임 값은 **현재(다크니스 오멘) 그대로** — 비교는 클라이언트 런타임에서 `_GameConst` 값만 바꿔 실제 D 키로 시전했다(커밋 값 변경 없음).

## 조건 (네 안 공통)
- 메이커 플레이 · 피 묻은 황무지 · 슬롯 4 Lv40 · 저장 끔 · 뼈 쐐기 랭크 1(노드 0) · 키 D
- 적 6기(굶주린 구울 5 · 잿불 들개 1)를 캐릭터에서 3.2칸 왼쪽 아래(−3.2, −0.6)에 고정(이동 0 · 공격 0 · 생명 ×1000) — 가시가 캐릭터 몸과 겹치지 않음
- 조준 = 무리 가운데 들개(고른 적) · 판정 반지름 1.2칸 → 매번 hits=5 (가장 바깥 1기는 1.3칸이라 밖)
- 같은 카메라 줌 · 같은 자리 · 바닥 층 `MapLayer0` order 1(몸 뒤) 유지

## 안별 설정값
| 안 | 이름 | RUID | 배율 (가로×세로) | 복제 | 간격 | 클립 지움 |
|---|---|---|---|---|---|---|
| 현재 | 다크니스 오멘 | 17432944a5e141a78cd3e9f64b0ec304 | 0.41×0.54 (지름 2.4칸 / ClipPx 580 · Tall 1.3) | 1 | — | 1.2초 |
| A | 암살 (키움) | ceba149628214e589b67b563a776544f | 0.53×0.53 (ClipPx 452 = 클립 폭 → 보이는 폭 ≈ 지름 100%) | 1 | — | 1.2초 |
| B | 블레스 오브 다크니스 (키움) | b052086675a047b1a1f3d1eb5c295508 | 1.88×2.63 (ClipPx 128 = 클립 폭 → 폭 100% · Tall 1.4) | 1 | — | 1.0초 |
| C | 스킬 63141501 다중 가시 | 0fdbad343a9449aa8e99f6d1b2290378 | 기본 0.38 × 개별 0.8~1.5 (가시 키 ≈ 1.5~2.9칸) · 좌우 반전 무작위 | 8 | 반지름 1.2칸 원(세로 ½ 납작) 황금각 흩음 · 시작 0~0.15초 어긋남 | 1.5초 |

처음 시도값(기록): A ClipPx 475(폭 95%) · B ClipPx 135 Tall 1.15 · C 기본 0.28 × 7개 — 몬스터 몸에 거의 가려 「키워서」 위 값으로 다시 찍음(rec/*.mp4는 최종값).

## 런타임 전환 방법 (클라이언트 `maker_execute_script`)
`SkillEffects.BoneSpikesFx`에 변형 키 속성(GameConst) 추가 — 기본값이면 지금 동작과 같다.
`FxSkillBoneSpikesCopies`(1) · `FxSkillBoneSpikesSpread`(1.0) · `FxSkillBoneSpikesCopyMin/Max`(1.0) · `FxSkillBoneSpikesStaggerSec`(0) · `FxSkillBoneSpikesFixedScale`(0 = 지름 계산)
```lua
-- C 예
local g=_GameConst g.FxSkillBoneSpikes="0fdbad343a9449aa8e99f6d1b2290378" g.FxSkillBoneSpikesTall=1.0 g.FxSkillBoneSpikesClipSec=1.5
g.FxSkillBoneSpikesCopies=8 g.FxSkillBoneSpikesFixedScale=0.38 g.FxSkillBoneSpikesCopyMin=0.8 g.FxSkillBoneSpikesCopyMax=1.5 g.FxSkillBoneSpikesStaggerSec=0.15
```

## 메이커 증거 ([VRF])
- `fxpick bone-spikes ruid=ceba1496 scale=0.53x0.53 copies=1` · `ruid=b0520866 scale=1.88x2.62 copies=1` · `ruid=0fdbad34 scale=0.38x0.38 copies=8 k=0.80~1.50 stagger=0.15` · 현재 `ruid=17432944 scale=0.41x0.54`
- 매 시전 `bone spikes lv=1 hits=5 stunned=5 stun=1.00` · 끝에 `variant restored current ruid=17432944…` · 빌드 Error 0 · maker_save 0 · 저장 끔

## 파일
- `compare-4.png` — 4분할(각 안 가장 큰 장 · 무리 확대) + 이름·RUID·배율·복제
- `shots/*-full.png`(전체 화면) · `shots/*-zoom.png`(무리 확대)
- `contact/*-0.25s.png` — 실속도 녹화 6초를 0.25초 간격 24장(시전 ≈1.2~1.5초)
- `rec/*.mp4` — 실속도 6초 녹화(30fps · 녹화 중 maker_screenshot 0) · 커밋 안 함

## 추가 (11-04 사용자 피드백) — C안 가시 8개 묶음 2회 반복
「크기와 시차를 달리한 가시 8개, 이게 루프로 두 번 정도 반복되면 좋겠다」 → 변형 키 2개 추가(기본은 반복 없음 · 게임 값은 여전히 다크니스 오멘).
- `FxSkillBoneSpikesLoops` (기본 1) — 묶음 재생 횟수. C 반복안 = **2**
- `FxSkillBoneSpikesLoopGapSec` (기본 **0.35** · Loops ≥ 2일 때만 씀) — 회차 사이 시작 간격
- 2회차는 흩는 각을 무작위로 돌리고 자리·좌우 반전·배율(0.8~1.5)·개별 시차(0~0.15초)를 모두 새로 뽑는다(1회차 가운데 고정 가시도 2회차는 흩음)
- 피해·기절 판정은 서버 `BoneSpikes`에서 시전당 1회 그대로(매 시전 `bone spikes … hits=5` 한 줄) · 피해량·범위·재사용 불변 — 연출만 클라이언트에서 반복

| 간격 | 겹침 | 0.1초 띠 판정 | 파일 |
|---|---|---|---|
| 0.9초 (클립 1.2 × 0.75) | 없음 | 1회차가 0.6초쯤 사라진 뒤 **0.4초 빈 틈** → 끊겨 보임(기각) | rec/C-loop2-gap0.9.mp4 · contact/C-loop2-gap0.9-0.1s.png |
| 0.5초 | 적게 | 두 박자가 또렷, 경계에 0.1초 옅은 연기 장 | rec/C-loop2-gap0.5.mp4 · contact/C-loop2-gap0.5-0.1s.png · shots/C-loop2-gap0.5-loop1/2.png |
| **0.35초 (추천 · 기본값)** | 많이 | 빈 장 없이 이어지며 2회차가 다른 자리에서 다시 솟음 | rec/C-loop2-gap0.35.mp4 · contact/C-loop2-gap0.35-0.1s.png · shots/C-loop2-gap0.35-loop1/2.png |

클립 길이는 8장 × 0.15초 = 1.2초지만 눈에 보이는 몫은 앞 0.5~0.6초(뒤는 옅은 회색 연기)라, 요청서 예시(클립 × 0.6~0.75 = 0.72~0.9초)로는 틈이 생겨 실측으로 줄였다.
비교 시트: `compare-C-loop.png` (두 간격 × 1·2회차 정점). 조건은 위와 같음(적 6기 = 들개 3 · 구울 3, 캐릭터에서 3.2칸 · 같은 자리 · 같은 줌 · 실제 D 키).

C 반복안 켜기(클라이언트):
```lua
local g=_GameConst g.FxSkillBoneSpikes="0fdbad343a9449aa8e99f6d1b2290378" g.FxSkillBoneSpikesTall=1.0 g.FxSkillBoneSpikesClipSec=1.5
g.FxSkillBoneSpikesCopies=8 g.FxSkillBoneSpikesFixedScale=0.38 g.FxSkillBoneSpikesCopyMin=0.8 g.FxSkillBoneSpikesCopyMax=1.5 g.FxSkillBoneSpikesStaggerSec=0.15
g.FxSkillBoneSpikesLoops=2 g.FxSkillBoneSpikesLoopGapSec=0.35
```

## 확정 (11-04 사용자) — C안을 게임 기본값으로
- `GameConst.FxSkillBoneSpikes` = 0fdbad343a9449aa8e99f6d1b2290378 · Copies 8 · Spread 1.0 · FixedScale 0.38 · CopyMin 0.8 · CopyMax 1.5 · StaggerSec 0.15 · Loops 2 · LoopGapSec 0.35 · Tall 1.0 · ClipSec 1.5 (다크니스 오멘 17432944…는 주석 이력)
- 미리 불러오기: `FxSkillBoneSpikesFrames`(8장 sprite) → SkillEffects 미리 불러오기 목록 (`[VRF] preload n=242`)
- 메이커(새 플레이 세션 · 변수 덮어쓰기 없이 기본값): `[VRF] PROBE defaults ruid=0fdbad34… copies=8 loops=2 gap=0.35 fixed=0.38 k=0.80~1.50 stagger=0.15` · 세션 첫 시전부터 `fxpick … copies=8 … loops=2 gap=0.35` · 판정 `bone spikes … hits=N` 시전당 1줄
- 캡처: `shots/final-default-ingame.png` (기본값 시전 — 가시 뒤쪽 장). 화면 녹화는 다른 창이 메이커를 가려 이번엔 못 씀(mp4 삭제)
