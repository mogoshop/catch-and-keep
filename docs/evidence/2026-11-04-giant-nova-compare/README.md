# 마법사 거인 화염 노바 — 반경 5.5 · 연출 3안 실제 적용 비교 (11-04)

사용자 요청(디아블로 2 노바·PoE 불 고리 참고): 범위를 훨씬 넓게(원거리 후방 기술), 효과를 강하게 — 「작게 시작 → 엄청 커짐 → 사라짐」, 프레임 더 많이.

## 반경 변경 (사용자 결정 · 커밋 값)
- `data/rite_giants.csv` mage `s1Radius` **3.75 → 5.5** (표시 지름 7.5 → 11) — 기획 48 §4-1 초안값(3.75)을 11-04 사용자 결정으로 교체. 피해 배율(s1Mul 1 · novaAmpMul 1.5)·쿨(8초)·영창 불변.
- 영향: 자동 발동 조건 「둘레 적 2 이상」도 같은 반경으로 봄 → 더 자주·멀리서 발동. 노드 「폭발 증폭」 줄 = 「노바 폭발 피해 ×1.5 · 반경 5.5칸」. 면적 2.15배라 무리 사냥 기대 피해 증가(배율은 그대로).
- 함께 바꾼 곳: `tools/check_data.cjs` 상한 3.75 → 5.5 · `tests/quality/giant_skills.lua`(5.45 맞음 · 5.6 없음 · 지름 11) · `tests/quality/skills.lua` 요약 줄 · GameData 재생성. `npm test` 21/21.
- [VRF] 실측: `nova single hits=6 mul=1.00 radius=5.50 … maxd=4.80` (적 6기 거리 4.2~4.8칸 모두 맞음 · 네 안 모두 같은 판정).

## 변형 키 (런타임 전환 · 기본값 = 지금 그림)
`GameConst.GiantNovaFx` = `""`(현재) · `"grow"` · `"maple"` · `"ring"` — **서버·클라이언트 둘 다** 바꾼다(서버 = 타격 시각, 클라 = 그림). `GameConst.GiantNovaFxOpts` = `"grow=0.3;fade=0.6;s0=0.25;s2=1.15;yr=1;ringDy=-43;…"` 덮어쓰기.
구현: `SkillEffects.NovaVariantFx` / `TweenLayer`(클라 artsprite 엔티티 · 장은 시각표대로 SpriteRUID 교체 · 배율·알파·위치는 1/60초 틱 보간 · 맵 이동·사망 때 `ClearLocalVisuals`가 지움). 변형이면 서버 타격 = 정점(grow 0.3초)(`GiantFxImpactSec`).

| 안 | 키 | 그림 | 크기·시간 |
|---|---|---|---|
| 현재 | `""` | 코덱스 V2 16장(FxGiantNovaV2) | 지름 11(ref 7.5 → ×1.47) · 장별 20~90ms · 0.82초 · 타격 0.16초 |
| 1 현재 그림 강화 | `grow` | V2 16장 + 같은 그림 좌우 반전 겹고리 | 배율 0.25 → 1.0(0.3초 ease-out 3차 · 1~6장) → 1.15(0.6초 · 7~16장) · 알파 정점 뒤 1→0 · 겹고리 120ms 늦게 ×1.1 · α0.6 · 총 0.9초 |
| 2 메이플 2141500 | `maple` | 2d4f6df1 클립의 8장 sprite를 직접 넘김(원래 150ms씩 1.2초) + 중앙 V2 6~8장 섬광 | 지름 11 = 220px 기준(배율 5.0) · 0.25 → 1 → 1.15 · 정점 = 3장 · 섬광 ×0.4 · 정점 앞뒤 0.24초 |
| 3 고리 + 폭발 | `ring` | 바깥: 메이플 불 고리 082f57d7(17장 중 빈 첫 장 뺀 16장) · 안쪽: V2 | 고리 0.3 → 1 → 1.05 · 세로 0.55(지면 원근 · V2 타원과 맞춤) · 바깥 지름 165px 기준 · 중심 보정 ringDy −43px · 안쪽 V2 ×0.55 |

안 3 고리 후보(msw-search animationclip/skill): **082f57d7**(불꽃이 둘러싼 고리 · 17장 · 채택 — 디아 2 노바처럼 테두리만 타는 고리) · b489c39d(별 섬광 → 고리 8장 · 중앙 섬광이 강해 폭발과 겹침) · 5c122731(옅은 분홍 고리 10장 · 88px 작고 불 느낌 약함). 비교 시트: 검색 결과 14개를 스크래치에서 확인.
안 2의 「흰 섬광」: B 전체 프레임 V2는 앞 층(흰 섬광)이 없는 한 층 납품이라, 가장 밝은 V2 6~8장을 작게 얹었다(새 그림 생성 없음).

## 조건 (네 안 공통)
- 메이커 플레이 · 피 묻은 황무지(솔로 방) · 슬롯 4 Lv40 · 저장 끔(IsLoadSuccess=false) · 무적
- 해골 마법사 5 → `StartGiant`로 마법사 거인(지속 99999초 · 제자리 GiantCastUntil) · 노바는 거인 AI 자연 발동(RiteGiantMoves.Tick)에서 쿨만 당겨(s1At) 시전
- 적 6기(구울·들개)를 거인 기준 15°/165°/195°/345°/115°/250° · 4.8/4.6/4.4/4.2/4.0/4.5칸에 고정(이동 0 · 공격 0 · 생명 ×1000) · 끼어든 몬스터는 시전 직전 제거
- 카메라 줌 55 · 같은 자리 · 바닥 층 MapLayer0(몸 뒤) · 각 안은 한 번 미리 재생해 그림 로드 뒤 녹화(첫 재생은 로딩으로 안 보임 — 0-current 첫 녹화에서 확인)

## 메이커 증거 ([VRF])
- `nova variant=grow … s0=0.25 s2=1.15` → `nova layer grow done ticks=46 frames=16/16 maxScale=3.00 t=0.910` · `grow_outer … maxScale=3.30`
- `nova variant=maple` → `nova layer maple done ticks=45 frames=8/8 maxScale=5.74` · `maple_flash frames=3/3`
- `nova variant=ring … yr=0.55` → `nova layer ring done ticks=46 frames=16/16 maxScale=7.00` · `ring_inner maxScale=1.51`
- 매 시전 `nova single hits=6 mul=1.00 radius=5.50 burst=0.30(변형) / 0.16(현재) maxd=4.80`
- 오류 0 · maker_save 0 · refresh 1회
- 녹화한 ring은 런타임 덮어쓰기 `ringDy=-43`(처음 +43은 고리 중심이 거인 위로 떠 안쪽 V2와 어긋남) — 그 값을 코드 기본값으로 반영(반영 뒤 메이커 재확인은 안 함 · 같은 값).

## 파일
- `compare-4.png` — 4분할(각 안 정점 프레임 · 안 이름·설정값)
- `shots/*-peak.png`(녹화 정점 프레임 1920×1080) · `shots/*-zoom.png`(가운데 확대)
- `contact/*-0.1s.png` — 녹화 1.7~3.2초 0.1초 간격 16장(시전 ≈2.0초 · 팽창→소멸)
- `rec/*.mp4` — 실속도 6초 녹화(30fps · 녹화 중 maker_screenshot 0) · 커밋 안 함

## 게임 기본값
반경 5.5 + 현재 그림(`GiantNovaFx = ""`). 사용자가 안을 고르면 키 기본값만 바꾸면 된다.
