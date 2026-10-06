# 잡으면 내편 — 설계 문서

메이플스토리 월드(MSW) 네크로맨서/그림자 군단 게임 「잡으면 내편」의 설계 문서 폴더.

> 월드 저장소의 `docs/`. Maker는 `RootDesk/`만 읽으므로 이 폴더는 게임에 영향을 주지 않는다. mLua 코드는 `RootDesk/MyDesk/`에 있다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `` | 기획·시스템 설계 문서 |
| `design/00-index.md` | 기획 요소 체크리스트 (D2 벤치마크 기반, 01~12 문서 인덱스) |
| `rune-system-draft.md` | 혼각 룬 & 룬워드 시스템 초안 v0.2 (현재본) |
| `rune-system-draft-v0.1.md` | v0.1 원본 (변경 이력 보존용) |
| `phase0-core-loop-design.md` | Phase 0 코어 루프 설계 (추출→소환→전투→분해) |
| `setup-checklist.md` | 설치·GitHub 공유·MCP 연결 체크리스트 |
| `data/*.csv` | 밸런스 데이터 표 (수정 원본). `tools/csv_to_lua.py`로 `data/lua/`에 변환 |
| `tools/sim.py` | 밸런스 시뮬레이터 (`exp`, `fight`, `economy`). Python 3 표준 라이브러리만 사용 |
| `project-rules.md` | 이 게임 고유의 설계·작업 규칙 (MSW 공통 규칙은 저장소 루트 `AGENTS.md`) |

## 상태 (2026-10-06)

- 게임 이름 확정: 「잡으면 내편」
- MSW 월드 생성 완료: `~/Desktop/hoho/잡으면 내편/` (CoreVersion 26.7.0.0), git 초기 커밋 완료
- 설계 문서를 저장소 `docs/`로 이동 (원본 `~/Desktop/hoho/msw-shadow-legion`은 더 이상 갱신하지 않음)
- Phase 0 0-1(메이커 기능 확인): API 선언 파일로 대부분 확인. 런타임 검증은 남음 (`docs/phase0-core-loop-design.md` 10장)

## 다음 단계

1. 메이커에서 0-1 런타임 검증 (몬스터 처치 시 `DeadEvent`, 클라→서버 호출)
2. 0-2 `ShadowConfig`, `ShadowOwner` 구현
3. GitHub Private 저장소 연결 (월드 폴더)
