# tests/quality — Codex 품질 회귀 검사 (10-29 감사 F01~F11)

실제 mLua 메서드 본문(`RootDesk/MyDesk`)을 뽑아 Lua 5.4에서 돌린다. 엔진 서비스는 각 fixture(`items.lua`·`journal.lua`·`skills.lua`·`notice_text.lua`)가 대신하고, MSW 동기화·UI 배치·저장 원자성은 흉내 내지 않는다.

1. Lua 5.4 실행 파일 준비 — 이 맥은 `/private/tmp/lua-5.4.8/src/lua` (재부팅 등으로 없으면 lua.org의 5.4.8 소스를 받아 `make macosx`로 다시 빌드)
2. `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua items journal skills notice_text` (그룹 하나만 줘도 된다 · 실패하면 0이 아닌 값으로 끝남)
3. 실패 원인은 `--dump /절대경로/fixture.lua`로 만든 fixture를 읽어 본다. 평범한 Lua라 mLua 예약어(`member` 등)·타입 오류는 못 잡으니 바꾼 `.mlua`는 LSP 진단과 `npm test`도 같이 돌린다.

`notice_text.lua` (10-29 UI-20261029-01/02): 실제 재련 카드(ItemData.DescribeDetailed) → UXFeedback.LineText → UIKit.Clip 경로에서 결과 글에 열린·잘린 서식 태그가 없고 보이는 글자 수가 상한 안인지, 태그 없는 글은 예전 Clip과 같은지, 선택 보상 띠 폭 어림이 태그를 세지 않는지 본다. 바꾸기 전 코드로 돌리면 「신발 · 요구 레벨 28</color..」(F01-A 캡처와 같은 글)로 실패한다.
