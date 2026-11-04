# 2막 중앙 5곳 — 현재(wall=1) vs 뒤통행 안 비교 (11-04)

**정본 미변경 · 선택 뒤 반영.** 이 폴더는 비교 자료만이다. `map/` · `data/` 정본은 그대로이고, 뒤통행 안은 스크래치 작업 트리에서 지어 메이커 확인 때만 맵 15개(5맵 × 노말·악몽·지옥)를 잠시 바꿔 끼운 뒤 `git checkout`으로 되돌리고 refresh했다. 사용자가 맵별로 고르면 그때 정본에 반영한다.

대상: dunes 짐승 두개골 · canyon 물레방아 · scorpnest1 독 웅덩이 바위 · scorpnest2 알 둥지 · drywell 우물 도르래 (입구 2·벽 대신 2는 대상 아님).

## 무엇을 바꿨나 (뒤통행 안)
- 배치표 args `wall=1` 제거 + `foot=0.67` → 특징 기본 발밑 충돌(그림 폭 60% × 아래 1/2, 5.5칸 그림 = 3줄). scorpnest2만 서쪽 막다른 벽감 2칸을 `fill=-22/7,-21/7`로 막음(없으면 검사기 wallNiche 1).
- 바꾼 곳은 `data/handmade/specs/hero_rollout.cjs`의 맵별 `h.hero(...)` args (설계서 act2.cjs가 아님 · compose가 이 줄을 배치표에 씀). 설계도 글자(벽)는 그대로 · 충돌만 바뀜 · 북쪽 벽 홈은 되살리지 않음.
- `-top-hero` 윗부분 5장 새로 자름: 원본 PNG 같은 캔버스·피벗에서 자르는 선 아래를 투명으로. 자르는 선 = 막힘 꼭대기 − 0.3칸(막힘 꼭대기보다 아래 · 앞에 선 머리보다 위). 그룹 OJYYQ에 Point·Clamp·원본 피벗으로 올림. `art_sprites.csv` · `top_cutlines.csv` 줄은 작업 트리에만 있다.

## 파일
- `compare-<map>.png` (5장): 현재 | 뒤통행 안(같은 자리·같은 줌 60·같은 조명) | 뒤통행 안에서 뒤에 선 모습. 메이커 실화면(Solo 방 · 슬롯 4 · 몬스터 정리 · 저장 끔).
- `summary.csv`: 5곳 표(자리 · 현재/뒤통행 충돌 칸 · 뒤로 지나는 칸 · -top 자르는 선 · RUID · 닿는 바닥 · droppedOnRoute · routes · 검사기).
- `frames.jpg`: 영상 10개 프레임 띠(1초 1장 · 줄 순서 dunes 현재/뒤통행 → canyon → scorpnest1 → scorpnest2 → drywell).
- `rec/*.mp4` (커밋 제외): 실제 방향키로 중심물 둘레를 도는 영상 — 현재 6초 · 뒤통행 8초 (ffmpeg avfoundation 30fps · 녹화 중 스크린샷 0).

## 보는 법 · 부작용
- 뒤에 서면 윗부분이 반투명(DarkVision TopFade 0.35)이 된다 — 기존 규칙이라 완전히 가려지기보다 "그림 뒤로 들어간" 모습으로 보인다.
- 고리로 돌아가는 곳: dunes · scorpnest1 · drywell. **canyon · scorpnest2는 뒤가 한 줄짜리 막다른 홈**(한쪽으로 들어갔다 되돌아 나옴) — 북벽이 가까워 고리가 안 생긴다.
- 길 안내·출현: routes.csv 그대로(npm test 「맵 길 표 최신」 통과) · droppedOnRoute 0 · 출현 구역(spawn_zones.csv)·Spawner 값 그대로 · 닿는 바닥 +4~+14칸.
- 엔티티: 맵마다 +1(윗부분) · 검사기 v5 위반 0(5맵) · npm test 21/21(작업 트리).
