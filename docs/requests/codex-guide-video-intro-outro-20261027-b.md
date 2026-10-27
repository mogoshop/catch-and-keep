# 코덱스 요청 (2차): 인트로 · 아웃트로 나머지 부품 (2026-10-27, Claude)

1차 요청서: `docs/requests/codex-guide-video-intro-outro-20261027.md`
1차 샘플(`io-logo-light` · `io-bg-intro` · `io-bg-outro` · `io-slot-video` · `io-slot-sub`) **사용자 승인 (10-27)**. 같은 결로 나머지를 확정본으로 받는다 (샘플 단계 없음).

> **고를 안(A/B) 없음.** 1차에 나온 「B안」은 영상 구성(인트로 4초 · 아웃트로 10초 · 배경음)을 고른 것이고 이미 정해졌다. 이번은 그림마다 **한 가지씩 확정본**만 만들면 된다 — 시안 여러 개 만들지 말고 바로 진행.

## ⚠ 돌려줄 곳

1차는 `~/Documents/New project/art-guide-intro-outro-20261027/delivery/`에 들어와 Claude가 옮겼다. 이번에는 **반드시 아래 폴더에 바로** 넣어 주기:

`/Users/leeinguk/Desktop/hoho/잡으면 내편/assets/codex-guide-video-intro-outro-v1/`
(1차분이 이미 들어 있다 — 1차 파일은 그대로 두고 `png/` · `previews/` · `resource-mapping.csv` · `README.md`에 **이어서** 추가)

## 지금 쓰는 모습 (참고)

- 초안 영상: `assets/claude-guide-video-v1/guide-video-v7.mp4` (109초 = 인트로 4 + 본편 95 + 아웃트로 10)
- 로고 뒤 보라 빛과 아웃트로 안내 띠는 Claude 임시 그림이다 → 이번 부품으로 바꾼다
- 글귀(Claude가 씀): 인트로 「게임 가이드」 · 아웃트로 「메이플월드에서 메이플 리저렉션을 검색하세요」 — **그림에는 글자를 넣지 않는다**

## 그릴 것 (17장, 투명 PNG, 글자 · 숫자 없음)

| 이름 | 크기 | 내용 |
|---|---|---|
| `io-logo-ink` | 1600×1252 · 투명 | 아웃트로 양피지 위 먹색 로고 — 1차 `sources/logo-ink-preview-only.png`를 **확정 납품용으로** (원래 먹색 획 · 남은 양피지 얼룩 정리 · 가장자리 깨끗하게). `io-logo-light`와 크기 · 위치가 1:1로 겹치게 |
| `io-glow` | 1400×800 · 투명 | 인트로 로고 뒤 보라 혼불 빛무리 — 가운데 밝고 가장자리로 부드럽게 사라짐. 어두운 바탕(`io-bg-intro`) 위에서 로고 획을 덮지 않을 만큼 은은하게 |
| `io-ember-1` ~ `io-ember-6` | 각 64~160 · 투명 | 재 조각 2 · 불씨 2 · 작은 보라 혼불 2 — 모양 · 크기 서로 다르게. 어두운 바탕 · 밝은 양피지 둘 다에서 보이게 (가는 어두운 테두리) |
| `io-ink-wipe-01` ~ `io-ink-wipe-08` | 각 2560×1440 · 투명 | 먹 번짐 닦기 8단계 — 01은 왼쪽 아래 구석의 작은 얼룩, 단계마다 번져 08은 화면 전체를 빈틈없이 덮음. 앞 단계의 먹이 뒤 단계에 그대로 남아 있게 (이어 붙이면 번지는 움직임이 되도록). 먹색은 보랏빛 검정(#1A1020 근처), 가장자리에 먹 튄 자국 |
| `io-cta-plate` | 1400×120 · 투명 · 9-slice | 아웃트로 안내 한 줄 띠 — 밝은 양피지와 바위 바닥 위에 얹히므로 **짙은 보랏빛 반투명 띠 + 얇은 금테**, 글씨는 Claude가 뼈색으로 쓴다. 본편 자막 띠(`assets/codex-guide-video-overlay-v1/png/ov-caption-plate.png`)보다 얇고 얌전하게. 양끝 작은 장식 |

- 크기 확인: 영상은 1280×720이라 모두 절반으로 줄어 보인다 — 줄여도 또렷하게.
- `resource-mapping.csv`에 `io-cta-plate` 9-slice border(좌;우;위;아래) 적어 주기.
- `previews/intro-final.png` — `io-bg-intro` + `io-glow` + `io-logo-light` + 불씨 몇 개를 겹친 예시
- `previews/outro-final.png` — `io-bg-outro` + `io-logo-ink` + `io-cta-plate`(빈 띠) + 두 칸을 겹친 예시
- `previews/ink-wipe-strip.png` — 먹 번짐 8단계를 작게 한 줄로 늘어놓은 것
