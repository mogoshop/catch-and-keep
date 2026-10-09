# 룬·웨이포인트 이미지 제작 결과 — 2026-10-09

요청: [codex-rune-waypoint-art-20261009.md](codex-rune-waypoint-art-20261009.md)

## 제작 결과

- 룬 24장: 회색 8 / 청동·녹슨 주황 8 / 검붉은 돌 5 / 검정·금빛 3. 같은 돌판 형태에 서로 다른 각인.
- 웨이포인트 2장: 같은 타원 석판의 무발광 / 푸른 각인 발광. 사람·NPC·칼 형태 없음.
- 룬 128×128, 웨이포인트 256×160. 모두 투명 배경 RGBA PNG.
- built-in imagegen으로 기준 룬·꺼진 웨이포인트를 생성하고, 각 룬과 켜진 웨이포인트는 기준 그림을 참조해 편집했다. 최종 내보내기는 알파를 보존한 크기 조정이다.

## 산출물

`assets/codex-rune-waypoint-v1/` 아래에 보관한다.

- `rune-waypoint-assets-20261009.zip`: 업로드용 PNG 26장, 연결표, 인계 안내, 검사 결과, 미리보기.
- `png/`: 업로드할 실제 파일. 파일명은 룬 id 또는 waypoint_off/on과 일치한다.
- `originals/`: 생성 원본. 업로드에는 사용하지 않는다.
- `generation-prompts.json`, `generation-results.json`: 실제 요청 프롬프트와 생성 원본 경로.
- `UPLOAD-MAPPING.csv`: 연결 대상·실제 이미지 너비. RUID는 업로드 전이므로 비어 있다.
- `CLAUDE-HANDOFF.md`: RUID 연결 및 메이커 확인 절차.
- `checks.json`: 26장 크기·알파·파일 해시 검사 결과.
- `contact-sheet.png`: 전체 이미지 미리보기. 게임 실행 스크린샷이 아니다.

## 검증

26장 모두 RGBA, 지정 크기, 투명 모서리, 알파 범위 0~255, 서로 다른 파일 해시를 확인했다. 전체 미리보기에서 24개 각인과 4단계 색상, 웨이포인트 꺼짐/켜짐을 확인했다. 룬 키·이름·단계는 현재 data/runes.csv의 24행과 대조해 일치함을 확인했다. ZIP 무결성과 업로드 PNG 26개 포함 여부도 검사했다.

## 남은 적용

이미지 제작 26/26. 사용자 리소스 업로드·RUID 연결·게임 실행 검증은 아직 수행하지 않았다.

1. ZIP의 png/ 파일 26장만 업로드한다.
2. 리소스 카탈로그 CSV를 전달받아 파일명과 RUID를 매칭한다.
3. data/runes.csv의 icon에 RUID, iconPx에 128을 넣는다. 큰 원본의 너비를 넣지 않는다.
4. data/ui_icons.csv에 waypoint_off/on을 연결한다. 색상 #FFFFFF, 알파 1.
5. 데이터 생성 및 공식 Maker MCP 새로고침 후 가방·소켓·바닥 드롭·웨이포인트를 실제 게임에서 확인한다.

Claude의 구현·스킬 변경과 기존 CSV·게임 코드·맵·UI는 이 작업에서 수정하지 않았다.
