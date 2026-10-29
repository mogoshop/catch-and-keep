# tests/quality — Codex 품질 회귀 검사 (10-29 감사 F01~F11)

실제 mLua 메서드 본문(`RootDesk/MyDesk`)을 뽑아 Lua 5.4에서 돌린다. 엔진 서비스는 각 fixture(`items.lua`·`journal.lua`·`skills.lua`)가 대신하고, MSW 동기화·UI 배치·저장 원자성은 흉내 내지 않는다.

1. Lua 5.4 실행 파일 준비 — 이 맥은 `/private/tmp/lua-5.4.8/src/lua` (재부팅 등으로 없으면 lua.org의 5.4.8 소스를 받아 `make macosx`로 다시 빌드)
2. `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua items journal skills roster` (그룹 하나만 줘도 된다 · 실패하면 0이 아닌 값으로 끝남)
3. 실패 원인은 `--dump /절대경로/fixture.lua`로 만든 fixture를 읽어 본다. 평범한 Lua라 mLua 예약어(`member` 등)·타입 오류는 못 잡으니 바꾼 `.mlua`는 LSP 진단과 `npm test`도 같이 돌린다.
4. `roster.lua` (I03): 소환 편성 미리보기 `UndeadSystem.RosterPreview`가 실제 `Raise`(변이 고르기·정원·가장 오래된 개체 교체·거인 예약·일시 소환 무시)와 같은 답인지, 동기화 문자열로 만든 클라이언트 미리보기가 서버와 같은지, 「0기」 판정(`SteadyRoster` · 거인 없을 때와 뼈 거인 유지 중 둘 다)이 실제 반복 소환과 같은지, 최초 조회가 `Owned`·`Serial`을 바꾸지 않는지 본다. 혼 찾기·엔티티 생성·연출만 대신한다.
