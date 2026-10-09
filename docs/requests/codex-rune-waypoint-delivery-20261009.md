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
- `UPLOAD-MAPPING.csv`: 연결 대상·실제 이미지 너비·업로드 카탈로그에서 확인한 RUID 26개.
- `MyResourcesCatalog_20261009174203.csv`: 사용자가 전달한 업로드 결과 원본.
- `runtime-probe.lua`, `runtime-verification.json`: 공식 Maker MCP 실행 검사와 결과.
- `CLAUDE-HANDOFF.md`: RUID 연결 및 메이커 확인 절차.
- `checks.json`: 26장 크기·알파·파일 해시 검사 결과.
- `contact-sheet.png`: 전체 이미지 미리보기. 게임 실행 스크린샷이 아니다.

## 검증

26장 모두 RGBA, 지정 크기, 투명 모서리, 알파 범위 0~255, 서로 다른 파일 해시를 확인했다. 전체 미리보기에서 24개 각인과 4단계 색상, 웨이포인트 꺼짐/켜짐을 확인했다. 룬 키·이름·단계는 현재 data/runes.csv의 24행과 대조해 일치함을 확인했다. ZIP 무결성과 업로드 PNG 26개 포함 여부도 검사했다.

## 업로드·적용 결과 (2026-10-09)

사용자가 업로드한 카탈로그의 26개 파일명과 RUID가 모두 고유하며, 룬 id 24개와 웨이포인트 키 2개가 일치함을 확인했다.

- `data/runes.csv`: icon 24개 연결, iconPx=128. 기존 효과·등급·드롭 확률은 유지.
- `data/ui_icons.csv`: waypoint_off/on을 #FFFFFF, 알파 1로 연결.
- `npm run gen`: `RootDesk/MyDesk/Data/ItemTables.mlua`, `GameData.mlua` 생성.
- `npm test`: 6/6 통과.
- 공식 Maker MCP 새로고침 후 실제 클라이언트에서 `_ResourceService:LoadSpriteAndWait`로 룬 24/24 (128×128), 웨이포인트 2/2 (256×160) 로딩 완료 확인. 룬별 IconFor 연결과 IconPixels=128도 확인.
- 기존 Waypoint.Look의 꺼짐·켜짐 양쪽 분기에서 실제 SpriteRenderer의 RUID가 새 이미지와 일치함을 확인. 임시 WaypointId는 원래 값으로 복구.
- 빌드 로그: 오류 0건, 경고 39건. 일반 로그의 오류 1건은 기존 `SelfTest.TestEvents`의 의도적인 오류 (`SelfTest.mlua`의 error 호출). 이번 이미지 검사 실패는 0건.

가방·소켓·바닥 드롭 전체의 시각적 배치 및 모바일 화면 검수, 공개 출시는 이번 검증 범위에 포함하지 않았다. Claude의 구현·스킬 변경과 맵·UI는 이 작업에서 수정하지 않았다.
