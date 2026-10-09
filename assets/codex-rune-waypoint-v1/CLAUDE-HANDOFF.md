# 룬·웨이포인트 이미지 인계 — 2026-10-09

요청 원본: `docs/requests/codex-rune-waypoint-art-20261009.md`.

## 업로드와 연결

### 현재 적용 상태 (2026-10-09 17:50 KST)

- 사용자 카탈로그 `MyResourcesCatalog_20261009174203.csv`의 26개 파일명·RUID를 대조해 연결 완료. `UPLOAD-MAPPING.csv`에는 실제 RUID가 채워져 있다.
- `data/runes.csv`: 룬 24개 icon 연결, iconPx=128. `data/ui_icons.csv`: waypoint_off/on 연결. `npm run gen`으로 ItemTables/GameData 생성 완료.
- `npm test` 6/6 통과. 공식 Maker MCP 새로고침 후 실제 클라이언트에서 룬 24개 및 웨이포인트 2개 리소스 로딩·크기 검사 통과.
- 기존 Waypoint.Look의 꺼짐·켜짐 분기에서 SpriteRUID가 각각 새 이미지로 바뀌는 것도 확인했다. 검증용 임시 WaypointId는 원래 값으로 복구했다. 인벤토리·저장 데이터는 변경하지 않았다.
- 증거: `runtime-probe.lua`, `runtime-verification.json`. 빌드 오류 0건, 경고 39건. 일반 로그 오류 1건은 기존 SelfTest.TestEvents가 의도적으로 발생시키는 오류이며, 이미지 검증 오류는 없다.
- 이 검증은 실제 리소스 로딩·연결·상태 분기 확인이다. 가방·소켓·바닥 드롭 전체의 시각적 배치 및 모바일 화면 검수, 공개 출시는 별도다.

### 재연결 절차

1. `png/`의 룬24개·웨이포인트2개만 리소스 보관함에 업로드한다. 파일명은 유지한다.
2. 재업로드 후 메이커가 제공하는 리소스 카탈로그 CSV를 전달한다. `UPLOAD-MAPPING.csv`의 ruid를 새 카탈로그와 대조 후 갱신한다. RUID를 임의로 만들지 않는다.
3. 룬은 `data/runes.csv`에서 id가 같은 행의 icon 칸에 RUID를 넣고, iconPx는 업로드한 PNG의 실제 너비인 128로 채운다. originals/의 큰 원본을 업로드하지 않는다. 웨이포인트는 `data/ui_icons.csv`의 waypoint_off/on 키로 연결하며 색상 #FFFFFF, 알파 1을 사용한다.
4. 사용자 업로드 카탈로그 확보 전에는 기존 CSV·게임 코드·맵·UI를 수정하지 않는다.
5. 연결 후 데이터 생성, 메이커 플레이 중지, 공식 MCP `maker_refresh_workspace`, 빌드/일반 로그 확인, 플레이로 실제 표시를 검증한다. File 메뉴의 Refresh를 찾도록 안내하지 않는다.

## 검수 기준

- 룬은 128×128 RGBA. 4단계 색상은 회색8 / 청동·녹슨 주황8 / 검붉은색5 / 검정·금빛3. 같은 돌판 형태, 24개 서로 다른 굵은 각인.
- 룬 이름이나 등급 글자는 PNG에 넣지 않는다. 이름은 기존 게임 툴팁에서 표시한다.
- 웨이포인트는 256×160 RGBA, 같은 바닥 석판·타원 원근·위치. 꺼짐은 무발광, 켜짐은 푸른 각인 발광. 사람/NPC/칼 형태 없음.
- `contact-sheet.png`는 생성 자산 미리보기다. 게임 실행 검증 화면이 아니다.
- 최종 크기로 내보내는 과정은 원본 알파를 보존한 리사이즈이며, 그림과 변형은 built-in imagegen으로 제작한다. 원본과 프롬프트는 별도 보관한다.
- 업로드 뒤 가방·소켓·바닥 드롭의 80px 안팎 가독성, 밝고 어두운 바닥에서 waypoint 켜짐/꺼짐, 플레이어가 올라섰을 때 레이어와 위치를 확인한다.

## 협업 범위

이미지 자산·인계 문서·연결 CSV 및 생성 데이터만 변경했다. Claude의 `.claude`, AGENTS, 다른 게임 구현 변경은 보존한다. 이미지 제작 완료와 업로드·RUID 연결·실제 게임 검증은 구분해 보고한다.
