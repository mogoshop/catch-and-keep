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
