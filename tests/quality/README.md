# tests/quality — Codex 품질 회귀 검사 (10-29 감사 F01~F11)

실제 mLua 메서드 본문(`RootDesk/MyDesk`)을 뽑아 Lua 5.4에서 돌린다. 엔진 서비스는 각 fixture(`items.lua`·`journal.lua`·`skills.lua`·`roster.lua`·`mobile_input.lua`·`notice_text.lua`)가 대신하고, MSW 동기화·UI 배치·저장 원자성은 흉내 내지 않는다.

1. Lua 5.4 실행 파일 준비 — 이 맥은 `/private/tmp/lua-5.4.8/src/lua` (재부팅 등으로 없으면 lua.org의 5.4.8 소스를 받아 `make macosx`로 다시 빌드)
2. `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua items journal skills roster mobile_input notice_text` (기본값이 이 여섯 그룹 전부 · 그룹 하나만 줘도 된다 · 실패하면 0이 아닌 값으로 끝남)
3. 실패 원인은 `--dump /절대경로/fixture.lua`로 만든 fixture를 읽어 본다. 평범한 Lua라 mLua 예약어(`member` 등)·타입 오류는 못 잡으니 바꾼 `.mlua`는 LSP 진단과 `npm test`도 같이 돌린다.
4. `roster.lua` (I03): 소환 편성 미리보기 `UndeadSystem.RosterPreview`가 실제 `Raise`(변이 고르기·정원·가장 오래된 개체 교체·거인 예약·일시 소환 무시)와 같은 답인지, 동기화 문자열로 만든 클라이언트 미리보기가 서버와 같은지, 「0기」 판정(`SteadyRoster` · 거인 없을 때와 뼈 거인 유지 중 둘 다)이 실제 반복 소환과 같은지, 최초 조회가 `Owned`·`Serial`을 바꾸지 않는지 본다. 혼 찾기·엔티티 생성·연출만 대신한다.
5. `mobile_input.lua` (I04): 모바일 입력 상태 기계(`MobilePad` 전체 method + `SkillBook` GetSlotSkill·CastSlot·BeginRiteHold·ReleaseRite·CancelRiteHold)를 실제 본문으로 돌려, 고급 배치 기본 공격 단추 홀드·스킬 끌기 「취소」(취소면 서버 요청 0 → 마나·재사용·해골 그대로)·「줍기」 전환 중 기본 공격 단추 홀드 유지(R01)를 본다. 실제 터치 순서·UI 배치·손가락 가림은 메이커/실기기 후검수.
6. `notice_text.lua` (10-29 UI-20261029-01/02): 실제 재련 카드(ItemData.DescribeDetailed) → UXFeedback.LineText → UIKit.Clip 경로에서 결과 글에 열린·잘린 서식 태그가 없고 보이는 글자 수가 상한 안인지, 태그 없는 글은 예전 Clip과 같은지, 선택 보상 띠 폭 어림이 태그를 세지 않는지 본다. 바꾸기 전 코드로 돌리면 「신발 · 요구 레벨 28</color..」(F01-A 캡처와 같은 글)로 실패한다.
7. `progression.lua` (I08 · 10-30): 실제 `PlayerQuest` 본문(NearGiver·FieldHandoff*·RequestAccept·RequestTurnIn·첫 장비 관측)으로 피의 제단 현장 보고(q4 보고·q5 수락)·거절 13종(다른 의뢰·맵·난이도·거리·사망·보낸 사람·오래된 번호·q5 최종 보고·q6·설정 끔)·중복/재전송 0·가방 부족 재시도·마을 경로·저장 키 그대로·첫 장비 안내 1회와 gearUse 1회를 본다. 보상 지급(TurnIn)은 대역 — 지급 내용은 items 그룹.
8. `spawn_zones.lua` (I06 · 10-30): 실제 `MonsterSpawner.SpawnAll`을 대상 4맵 × 난이도 3 × 시드 200으로 구역 켬/끔 돌려 요청 = 배치 + 유입 풀 · 배치 수 같음 · 벽·입구 안전 반경 위 0 · 구역 무리·fallback 평균을 낸다 (벽 = 설계도 칸 · 입구 = 표식 W E H X S). 종별 산 수가 요청과 같다고 주장하지 않는다(섞임·유입 난수).
