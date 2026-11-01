# DarkVision EnterMap 직렬화 — 메이커 검증 (2026-11-02 01:31~01:39)

대상: RootDesk/MyDesk/Ambience/DarkVision.mlua (미커밋 · EnterSerial/Entering · 멈춤 뒤 isvalid 재확인 · SetGlobalLight)
절차: stop → 5초 → touch(01:31:28) → refresh 1회 (codeblock 01:31:30 재생성) · 빌드 콘솔 새 Error 0 (남은 항목은 00:12 Info 255·Warning 103뿐)
play → SelfTest `[SelfTest] 통과 410 / 실패 0` (01:31:57) · 슬롯 1 「인꾸」 Lv17 · 혼자 방 game:s1bcc2355a86 · town

## 되튕김 재현 (Go wasteland (−33.5,0.5) = GateBack 위 → 자동 town)
| 회차 | 시각 | waited | skipped | DarkVision.EnterMap Error | LWA-3010 | 이어지는 town |
|---|---|---|---|---|---|---|
| R1 | 01:35:38 | 3.45s | 0 | 0 | 0 | `[VRF] DarkVision town 밝기 0.40 시야 5.4` 01:35:43 |
| R2 | 01:36:08 | 1.50s | 0 | 0 | 0 | 같은 줄 01:36:12 |
| R3 (TopSprites 캐시 비우고 + 2.4s 강제 GoTown) | 01:36:41 | 1.55s | 0 | 0 | 0 | 같은 줄 01:36:47 |
| R4 (황무지 안 재진입 유도 + 자연 되튕김) | 01:37:19 | (<0.05) | 0 | 0 | 0 | 같은 줄 01:37:25 |
- 4회 모두 EnterMap이 되튕김(도착 +2.5초) 전에 끝나 `skipped: map not ready` 분기는 타지 않음 (경합 창 재현 안 됨 — 수정 후 Tick이 기다리므로 겹침 자체가 없었음)
- R2에 별개 클라 Error 1건: `Collection was modified; enumeration operation may not execute.` @ HudMap.LayoutTerrain:15 ← BuildTerrain:72 (DarkVision 아님)

## 회귀 (wasteland 머묾)
- `[VRF] darkvision entermap waited 3.60s` → `[VRF] DarkVision wasteland 밝기 0.82 시야 5.0 폭풍 0.00` (01:38:02, 해방 밝기 유지 · Cleared=true · DarkAmbient 0.32)
- 윗부분 반투명 대상 5개 (빠짐 0 · 알파 0.35) · ArtPlate1_F2Top 뒤 (−25,−1.6) 이동 → `[VRF] top fade n=2` · F2Top·WallCover1Top alpha 0.35 실측
- 맵 안 이동(같은 맵 Go) 전후 GlobalSerial 121 그대로 · LWA-3010 0
- 어둠 재현: 실행 중 전체 조명 0.32로 → `[VRF] DarkVision 어둠이 걷힌다 wasteland` → 3.5초 페이드 동안 serial 137→150 (틱마다 지우고 새로) · 끝난 뒤 150 고정 · LWA-3010 0 · 캡처 02
- 읽은 구간 LWA-3010: 0건 (수정 전 레인은 진입마다 반복) · 단 혼자 방 첫 town 도착 구간(01:34:20~01:35:30, 100줄)은 읽기 전에 지움

캡처: 01-wasteland-behind-F2Top.png · 02-dark-0.32-fade-start.png
