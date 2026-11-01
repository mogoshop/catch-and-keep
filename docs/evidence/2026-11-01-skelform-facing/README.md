# 변이 해골·거인 뒤로 걷기 (11-01 아이폰 17 실기기 보고)

## 원인
- 좌우 규칙(`MotionSmoother.LookUnit` · `ShadowUnit.Face`)은 「그림은 왼쪽을 본다 → 오른쪽을 볼 때 Scale.x 음수」.
- 일반 해골(`skel_warrior`, `assets/claude-act1-tone-b/png/monsters/skelwarrior/move/0.png`)은 왼쪽을 보지만,
  코덱스 변이 프레임(`assets/codex-skeleton-forms-v1/png/frames/{greatsword,twin,shield}_*.png`)은 **오른쪽을 보고 납품**됐다
  (`DELIVERY-full-frames.txt` 「그림은 오른쪽을 보고 있습니다」 · 대검은 `records/greatsword-right-facing-prompt.json`으로 일부러 좌우 반전).
  뼈 의식 거인(`assets/codex-bone-giants-v1/v4-redesign-20261030/png/frames/giant-*-move-01.png`, 「right-facing 3/4 camera」)도 오른쪽.
  → 논리 좌우(visSignWant)는 맞는데 그림만 반대. 기존 점검(`StatLookWalk`)은 논리 좌우만 봐서 못 잡았다. 플랫폼(모바일·PC) 무관.
- 그림 비교: `art-direction-move1-basic-vs-forms.png`(왼쪽부터 일반·대검·쌍칼·방패) · `art-direction-giants-v4-move1.png`.

## 고침
- `MotionSmoother.ArtRightKeys = "skelform_,mageform_,giant_"` — 그 접두사 프레임 묶음(FrameIndex에 key·right 기록)은
  대역(MSVis) SpriteRenderer.FlipX를 한 번 더 뒤집는다. Scale 부호는 그대로(발밑 원·체력 막대·그림자·몸 부착 효과 규칙 불변,
  `SkillEffects.BodySign`은 FlipX까지 곱하므로 원 PNG 기준 부호가 그대로 맞음). 대역을 못 쓸 때 루트 그림 FlipX도 같은 규칙.
- `[VRF] face form=<키> vx=.. sign=.. flip=.. art=right on=..` (오른쪽 그림 소환수가 돌 때 · 최대 40줄 · 게시 플레이 제외)
- 점검: `StatLookArt/StatLookArtBase` (실제 그려진 얼굴 = 그림 방향 × 대역 거울) → `LookReport` 끝 `art=`. `ArtFlipOn=false`로 예전 동작 재현.
- 회귀: `tests/quality/facing.lua` ⑥ (21 checks). 문서: `docs/motion-sync.md` 표 1행 + 하지 말 것 10.

## 메이커 (11-01 22:15~22:20 · 모바일 iPad 미리보기 · 인꾸 Lv17 · 야영지 · 방향키로 주인 좌우 걷기)
| 측정 | 전 (ArtFlipOn=false = 예전) | 후 |
| --- | --- | --- |
| 전체 걷기 프레임 그려진 얼굴 반대 (대검·쌍칼·방패·일반) | 913/1238 (74%) | 111/1923 (5.8% = 돌기 0.15초 지연, 논리 반대 95와 같은 수준) |
| 대검 변이 | 173/180 (96%) | 3/101 |
| 방패 변이 | 170/179 (95%) | 4/103 |
| 거인 대검 | 173/180 (96%) | 3/103 |
| 일반 해골 (대조) | 8/183 (4%) | 3/101 |
- 쌍칼은 1차 묶음 측정(위 전체)과 스크린숏으로 확인(뒤 측정 때는 거인으로 바꿔 빠짐).
- 스크린숏: `before-walk-right-mobile-ArtFlipOff.png`(오른쪽으로 걷는데 쌍칼·대검이 왼쪽) · `after-walk-right-mobile.png`(모두 오른쪽) ·
  `before-giant-walk-right-ArtFlipOff.png` · `after-giant-walk-left.png`.
- 빌드 Error 0 · SelfTest 407/0. 로그: `maker-mobile-run1.log`. 끝에 maker_stop · PC(FHD) 복귀. 저장(maker_save) 안 함.
- 모바일 미리보기에서도 방향키 입력이 먹었다(가상 조이스틱 대신 사용).

## 검사
- `node tools/check_scripts.cjs` 146개 문제 0 · `tests/quality facing` 21 통과.
- `npm test` 18/21 — 실패 3은 맵 단계(장식 충돌·길 안내 · 맵 구성 v5 · 맵 길 표 최신)로 다른 레인의 맵 작업(작업 트리의 map/·data/handmade 변경) 영역, 이번 변경과 무관 (`npm-test.log`).

## 못 한 것
- 실기기(아이폰) 확인 · 실제 가상 조이스틱 입력 · 방패/쌍칼 외 나머지 거인 4종(기본·쌍칼·방패·마법사)은 같은 키 규칙(giant_)이라 코드·단위 시험으로만.
- 해골 마법사 변이(mageform_)는 48-2로 쓰지 않지만 그림이 오른쪽이라 같이 넣었다.
