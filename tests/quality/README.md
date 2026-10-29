# tests/quality — Codex 품질 회귀 검사 (10-29 감사 F01~F11)

실제 mLua 메서드 본문(`RootDesk/MyDesk`)을 뽑아 Lua 5.4에서 돌린다. 엔진 서비스는 각 fixture(`items.lua`·`journal.lua`·`skills.lua`)가 대신하고, MSW 동기화·UI 배치·저장 원자성은 흉내 내지 않는다.

1. Lua 5.4 실행 파일 준비 — 이 맥은 `/private/tmp/lua-5.4.8/src/lua` (재부팅 등으로 없으면 lua.org의 5.4.8 소스를 받아 `make macosx`로 다시 빌드)
2. `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua items journal skills` (그룹 하나만 줘도 된다 · 실패하면 0이 아닌 값으로 끝남)
3. 실패 원인은 `--dump /절대경로/fixture.lua`로 만든 fixture를 읽어 본다. 평범한 Lua라 mLua 예약어(`member` 등)·타입 오류는 못 잡으니 바꾼 `.mlua`는 LSP 진단과 `npm test`도 같이 돌린다.
