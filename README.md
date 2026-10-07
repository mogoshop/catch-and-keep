# 잡으면 내편

메이플스토리 월드(MSW) 월드 로컬 워크스페이스. 네크로맨서가 처치한 몬스터를 그림자로 추출해 군단을 꾸리는 디아블로2풍 탑다운 게임이다.

## 폴더

| 위치 | 내용 |
| --- | --- |
| `RootDesk/MyDesk/` | mLua 스크립트 (구조: `docs/architecture.md`) |
| `map/` `ui/` `RootDesk/MyDesk/Models/` `Global/DefaultPlayer.model` | 월드 파일. 대부분 `npm run build`가 만든다 (타일·지형은 메이커에서 직접) |
| `data/` | 콘텐츠·밸런스 CSV — 수치는 여기만 고친다 |
| `tools/` | 데이터 생성·월드 빌드·오프라인 검사·시뮬레이터 (Node 18+, 의존성 없음) |
| `tests/` | 검사기 자가 테스트용 픽스처 |
| `docs/` | 설계·구조·진행 문서 |
| `Environment/NativeScripts/` | 메이커가 생성한 MSW API 선언(`.d.mlua`). 수정하지 않는다 |

## 명령

```bash
npm run build
```

```bash
npm test
```

빌드 뒤 메이커에서 플레이 중지 → refresh 2번 → 플레이, 로그에서 `[SelfTest] 통과 n / 실패 0`을 확인한다.

## 작업 규칙

- 메이커가 열려 있는 동안 `.map`, `.model`, `.ui` 파일은 빌드로만 바꾸고, 바꾼 뒤 메이커에서 refresh 한다.
- 메이커에서 맵·엔티티를 바꿨으면 저장 후 먼저 커밋한다 (빌드는 타일을 건드리지 않지만, 관리 대상 엔티티는 CSV 기준으로 맞춘다).
- 커밋 전에 `npm test`.
- MSW 공통 규칙은 `AGENTS.md`, 이 게임의 규칙은 `docs/project-rules.md`.
- Codex·Claude 역할 분담과 메이커 작업 절차는 `docs/codex-claude-roles.md`.
