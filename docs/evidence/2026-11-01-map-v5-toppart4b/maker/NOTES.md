# 맵 v5 윗부분 4차·4b차 (액트 3) — 메이커 런타임 확인 (18:07 ~ 18:12)

원본 HEAD c77eb35c. 반영: 17:25 act3 맵 48파일 touch → refresh 1회(`../../2026-11-01-release-fix5/maker/NOTES.md` §0). 이동은 `PlayerTravel:Go`(준비 · 이동 자체는 검증 대상 아님), 서기 자리는 `../../2026-11-01-map-v5-act3/CAPTURE-PLAN-act3.txt` 「4b차」 절 좌표. 줌 100 · UI 숨김(캡처용). 로그 `key-lines.txt`.

| 맵 · 장식 | 판정 | 근거 |
|---|---|---|
| 반영(런타임 Top 수) | 통과 | 들어갈 때 `[VRF] DarkVision 윗부분 반투명 대상 N개`: seachapel 5 · wreckcoast 3 · stormeye 1 = 4b차 표(5·3·1)와 같음 · seachapel `ArtProp2Top`·`ArtProp4Top` RUID 87ba07e4…(= chapel-pillar-top-high 새 그림) · `ArtProp3Top`·`ArtProp5Top` 8a949f91…(정본 -top) · 층 Default/5 · 아바타 Default/4 |
| seachapel 예배당 기둥 북열 ArtProp2(가장 빠듯 0.000008칸) · 뒤 (-13,-2.7) | 통과 | 기본(반투명 B안): `top fade n=1` · 윗부분 알파 0.35로 몸이 비쳐 보임 · 진단(반투명 끄고 불투명): 몸 전체가 기둥 뒤로 숨고 **발끝이 윗부분 아래로 나오지 않음 · 자르는 선 이음매·구멍 없음** (`seachapel-ArtProp2-behind-crop-fade-vs-opaque.png`) |
| seachapel ArtProp2 · 앞 (-13,-4.6) | 통과 | 머리가 기둥 그림에 덮이지 않음(`seachapel-ArtProp2-front*.`) |
| wreckcoast 뱃머리 ArtProp5 · 뒤 (-14.5,13.3) / 앞 (-14.5,10.2) | 통과 | 뒤: 반투명/불투명 둘 다 발 조각·이음매 없음(그 자리 위쪽은 그림이 거의 없어 몸이 크게 가려지지는 않음) · 앞: 머리와 배 그림 사이 여유 (`wreckcoast-figurehead-*`) |
| stormeye 제독의 닻 ArtProp1 · 옆 (-15.9,10.4) (뒤 칸 벽) | 통과 | 오른쪽 가장자리 사슬·판자와 겹치는 자리에서 깜빡임·구멍 없음 (`stormeye-admiral-anchor-side*`) |

- 「발 조각」(자르는 선 아래가 몸 위에 남는 것)은 세 자리 모두 안 보임. 깜빡임은 0.3초 간격 캡처 2~3장 비교에서 없음(실속도 깜빡임 판정은 녹화 대상).
- 진단 스크립트(`scripts-diag.lua`)는 내 화면 런타임 값만 바꿨고 맵에 다시 들어오면 원래대로 돌아감(이후 Go로 다시 들어감).
- 확인 안 한 것: 4b차 나머지 4장(crabcave1 껍질 무더기 · keeperhouse 렌즈 작업대 · lighthouse2 깨진 렌즈 받침 · saltflat 소금 결정 기둥) · seachapel 북열 ArtProp4 · 노말 외 _nm/_hell 복제 맵 · 이름표가 윗부분에 덮이는지(이번엔 이름표 끄고 찍음).
