# 잡으면 내편

메이플스토리 월드(MSW) 월드 로컬 워크스페이스. 네크로맨서가 처치한 몬스터를 그림자로 추출해 군단을 꾸리는 게임이다.

## 폴더 역할

| 위치 | 내용 |
| --- | --- |
| 이 폴더 | 메이커가 관리하는 월드 파일(`map/`, `Global/`, `RootDesk/`)과 mLua 스크립트 |
| `~/Desktop/hoho/msw-shadow-legion/` | 설계 문서, 밸런스 CSV, 시뮬레이터, AI용 mLua 작업 규칙(`AGENTS.md`) |
| `Environment/NativeScripts/` | 메이커가 생성한 MSW API 선언 파일(`.d.mlua`). 수정하지 않는다. API 존재 여부는 여기서 먼저 확인한다 |

## 작업 규칙

- 메이커가 열려 있는 동안 `.map`, `.model`, `.ui` 등 JSON 계열 파일은 편집하지 않는다.
- 메이커에서 맵·엔티티를 바꿨으면 저장 후 먼저 커밋한다.
- 자세한 규칙은 `msw-shadow-legion/AGENTS.md`를 따른다.
