# 잡으면 내편 — 문서

메이플스토리 월드(MSW) 네크로맨서/그림자 군단 게임 「잡으면 내편」의 문서 폴더.

> Maker는 `RootDesk/`만 읽으므로 이 폴더는 게임에 영향을 주지 않는다. mLua 코드는 `RootDesk/MyDesk/`에 있다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `architecture.md` | **코드 구조** — 레이어·의존 방향·이벤트·폴더·데이터 파이프라인·빌드/테스트·추가 절차·MSW 함정 |
| `progress.md` | 완성률 기준표 (메이커에서 확인한 것만 점수) |
| `design/00-index.md` | 기획 요소 체크리스트 (D2 벤치마크 기반, 01~12 문서 인덱스) |
| `phase0-core-loop-design.md` | Phase 0 코어 루프 설계와 구현 기록 (추출→소환→전투→분해) |
| `rune-system-draft.md` | 혼각 룬 & 룬워드 설계 v0.2 (실제 수치는 `data/runes.csv`·`runewords.csv`) |
| `archive/` | 지난 판 (변경 이력 보존용) |
| `project-rules.md` | 이 게임 고유의 설계·작업 규칙 (MSW 공통 규칙은 저장소 루트 `AGENTS.md`) |
| `setup-checklist.md` | 설치·GitHub 공유·MCP 연결 체크리스트 |

데이터와 도구는 저장소 루트에 있다:

| 경로 | 역할 |
| --- | --- |
| `data/*.csv` | 콘텐츠·밸런스 수치의 단일 원본 (`architecture.md` 4장) |
| `tools/build.cjs` | 월드 빌드 (`npm run build`) |
| `tools/test.cjs` | 오프라인 검사 (`npm test`) |
| `tools/sim.py` | 밸런스 시뮬레이터 (`exp`, `fight`, `economy`). Python 3 표준 라이브러리만 사용 |
