# 설치·연결 체크리스트

## A. 회사에서 (본인, 약 15분)

- [ ] NGM 설치 → MSW 클라이언트 설치 → 넥슨 로그인
- [ ] 메이커에서 **빈 월드** 생성 (이름 예: `shadow-legion`)
- [ ] 월드를 **로컬 워크스페이스**로 내려받기 ([문서](https://maplestoryworlds-creators.nexon.com/ko/docs?postId=1165))
- [ ] 내려받은 폴더 경로 확인
- [ ] 폴더 안을 한 번 열어 보고 구조를 캡처하거나 `ls -R` 결과를 메모 (`.gitignore` 보완용)

## B. GitHub로 공유

회사 PC에서 개인 프로젝트를 올려도 되는지(회사 보안·계약 정책)는 본인이 먼저 확인한다. 로컬 워크스페이스에는 월드의 에셋이 들어 있어서, 용량이 크거나 공개 저장소로 두면 안 되는 자료가 섞일 수 있다.

1. GitHub에 **Private** 저장소 생성 (예: `msw-shadow-legion`)
2. 워크스페이스 폴더에 이 프로젝트의 파일을 합친다.
   - `AGENTS.md`, `README.md`, `docs/`, `.gitignore`, `.mcp.json.example`, `.env.example`
3. `git init` → 첫 커밋(**메이커가 만든 상태 그대로**) → push
   - 첫 커밋 메시지 예: `chore: 빈 월드 로컬 워크스페이스 초기 커밋`
4. 저장소 주소를 Claude에게 전달 (접근 권한은 별도 확인)

## C. 작업 규칙 (양쪽 머신 동기화)

- 한쪽에서 작업하는 동안 다른 쪽에서 push하지 않는다.
- Claude가 `.mlua`를 수정하고 push → 메이커 PC에서 **메이커를 닫고** pull → 메이커에서 다시 불러오기
- 메이커에서 맵·엔티티를 수정했으면 **저장 후 먼저 commit/push** 하고 Claude에게 알린다. Claude는 항상 최신 pull 후 작업한다.
- Claude는 `.map`, `.model`, `.ui` 같은 JSON 계열 파일을 수정하지 않는다. (`AGENTS.md` 절대 규칙)

## D. MCP 연결 (퇴근 후, 본인 Mac)

두 가지 방식이 있고, 먼저 서버 MCP로 시도한다. 자세한 설치는 [MSW MCP 문서](https://maplestoryworlds-creators.nexon.com/en/docs?postId=1368)를 따른다.

### 서버 MCP (HTTP + API 키)
1. MSW WorldInsight 로그인 → PERSONAL → Credentials → API KEY 발급
2. `.env.example`을 `.env`로 복사하고 `MSW_MCP_API_KEY`에 키 입력
3. `.mcp.json.example`을 `.mcp.json`으로 복사 (키는 `${MSW_MCP_API_KEY}`로 참조되며 파일에 직접 넣지 않는다)
4. Claude Code 실행 전에 `.env`를 셸에 로드 (`set -a; source .env; set +a`)
5. Claude Code에서 `/mcp`로 연결 확인

### Maker MCP (클라이언트 기반)
- 메이커 앱이 설치되면 함께 들어 있는 실행 파일을 사용한다.
- macOS: `/Applications/MapleStory Worlds.app/Contents/MacOS/MakerMCP`
- Windows: `%LOCALAPPDATA%\Nexon\MapleStory Worlds\MakerMCP\msw-maker-mcp.bat`
- 이 방식은 **메이커가 켜져 있는 같은 머신**에서만 동작한다. 실행 인자는 문서 확인 후 `.mcp.json`에 등록한다. (아직 미확인)

### 연결 후 가장 먼저 할 일
- MCP가 노출하는 **도구 목록을 확인**하고 `AGENTS.md` "테스트와 검증"과 "미확인 항목"을 갱신한다.
- 플레이 실행·로그 조회가 가능한지 확인한다. 가능하면 이후 검증 방식이 크게 바뀐다.

## E. Windows 사용 시 주의

- Windows에서 Claude Code와 MSW MCP를 쓰려면 **Git for Windows** 설치가 필요하다. (공식 안내)
- 회사 Windows와 집 Mac 사이에서 줄바꿈이 섞이지 않도록, 첫 커밋 후 `git config core.autocrlf` 정책을 정한다. (`.gitattributes`로 `*.mlua text eol=lf` 고정 권장, 실제 파일 확인 후 결정)

## F. 연결 후 순서

1. 로컬 워크스페이스 구조 확인 → `.gitignore` 보완
2. `AGENTS.md` 미확인 항목 1~6 확인
3. `docs/phase0-core-loop-design.md` 8장 0-1 조사
4. 0-2 이후 구현 시작
