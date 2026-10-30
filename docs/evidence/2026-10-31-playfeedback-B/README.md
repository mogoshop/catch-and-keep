# 10-31 실플레이 피드백 갈래 B — 흐름·글귀·알림 UI

기준 `539f6b07`(origin/main) → 브랜치 `wip/pf-B-flow-ui`. 메이커는 쓰지 않았다(사용자 플레이 중) — 아래 「메이커로 확인할 장면」은 통합 뒤 메이커 담당.

## B-1 Lv1 첫 처치 맛보기 그림자 제거
- `ShadowSystem.TryFirstTaste` · `UndeadSystem.SpawnTaste` · 되살림 임시 칸 경로(rec.taste · 만료 안내 · 상태줄 「그림자(잠시)」 · 방 이동 필드) · `ShadowUnit.Taste` · `ClickControl` 예외 · config `firstTasteSec` 삭제.
- 옛 저장 `PlayerStats.FirstKills`의 `taste_shadow`는 남아 있어도 읽지 않는다(새로 쓰지 않음). 기획서 39 결정 #3A에 「10-31 사용자 결정으로 제거」.
- Lv5 그림자 소환 강제 습득·스킬 추천 창 재활용은 하지 않았다(사용자 거절) — 자연 습득 흐름 그대로.

## B-2 그림자 소환을 배우면 게임 안내 창
- 창: **게임 안내 창 `GuideWindow`(GameHUD/GuideWin)** 「군단」 책갈피 2쪽 「그림자 추출」. 여는 쪽은 `GuideCoach.MaybeShadowGuide`.
- 조건: 그림자 소환 랭크 > 0(레벨 무관) · 이 캐릭터가 아직 안 봄(`SkillBook.ShadowGuide`, 저장 `skills.shadowGuide`) · 첫 진입 둘러보기가 끝남(`GuideWindow.AutoDone`) · 창·이야기 카드·큰 알림·6칸 안 적이 없는 상태 1.5초.
- 이미 배운 기존 캐릭터는 저장에 표시가 없으니 다음 접속 때 한 번. 첫 입장 자동 둘러보기는 그대로.

## B-3 「혼의 제물」 → 「스킬 추천」
- 화면 글: HUD 띠 「스킬 추천 — 고르기 (N)」 · 창 제목 「스킬 추천」 · 안내 「추천 스킬 중 하나를 고르세요」(예전 「포인트를 바칠 곳을 고르세요」).
- 보스 처치 뒤: 보스 처치 띠(채널 A) 30초 안에 포인트가 늘었거나, 보스 퀘스트(boss·chest·gate·ritual)의 선택 보상이면 「보스 처치 보상입니다. 추천 스킬 중 하나를 고르세요.」(선택 보상은 뒤에 「다시 고를 수 없습니다.」). 「스킬 포인트」라는 말은 쓰지 않는다.
- 저장 키·스킬 ID·창 경로(`OfferWin`·`OfferBand`)·내부 식별자는 그대로. 주석·`data/ui_icons.csv` 메모·`docs/ui`·`docs/design`의 「혼의 제물」도 바꿈(옛 기록 `docs/evidence`·`docs/handoff`·`docs/requests`는 그대로). NPC 대사·`data/*.csv` 본문에는 「혼의 제물」이 없었다.

## B-4 알림 채널 — [notice-channels.md](notice-channels.md)
- A 상단 띠(`HudMap.TopPush`) · B 왼쪽 알림 더미(`NoticeFeed`) · C 오른쪽 추적기(일지 줄) · D 줍기 표시(발밑 글씨). 규칙 상수와 부르는 곳 전수(141곳) 표.
- 파티 목록(PC)은 한 줄로 접고 마우스 올림·누름으로 펼침 / 모바일은 예전처럼 펼친 채(알림 더미가 오른쪽이라 겹치지 않음).
- 되돌리기: `HudMap.TopChannelOn` · `NoticeFeed.HomeOn`·`KeepLines`·`MergeSec`·`LimitSec`·`LimitPatterns` · `JournalWindow.PulseToTracker` · `HudMain.Pick*`·`JournalTrackSec`.

## 검사
- `npm-test.log` 17/17 (새 단계 「알림 채널 배정」 = `node tools/notice_channels.cjs --check`) · `quality-all.log` 18그룹 통과(새 `notice_channels` 47 checks · `notice_text`는 ×N 합치기 새 규칙으로 갱신) · `mlua-lsp.log` 바뀐 28파일 errors 0(경고는 원래 있던 deprecated 등) · `ui_lint.log` error 0, 새 경고는 Party 단추 높이 28(L007 · PC 마우스용)과 창끼리 겹침 L023(동시에 안 뜨는 창) · `ui-entity-diff.log` 바뀐 엔티티만(빌드가 다시 매긴 displayOrder·id 흔들림은 되돌림 — CharSelectHUD·ShadowHUD는 원본, NavigationHUD는 원본 + Journal 한 줄만).

## 메이커로 확인할 장면 (통합 뒤)
1. **사냥 중 알림 질서 (PC)**: 파티 2명 이상 · 채팅 접힘/펼침 각각에서 습격 → 격퇴 → 보스 처치를 연달아. 위 가운데 띠가 한 번에 하나씩(「습격이 온다」 붉은 글 → 「습격 격퇴 · N마리」 → 「○○ 처치!」+「5분 뒤 다시 나타납니다」 한 띠), 왼쪽 알림 더미가 채팅 바로 위에서 최대 3줄 · 위가 최신 · 해골 상한 글이 ×N으로 합쳐지는지, 파티 한 줄·큰 알림 판과 겹치지 않는지. 로그 `[VRF] top band show` · `[VRF] feed home bottom=` (채팅을 펼쳤을 때 bottom이 오르지 않으면 `NoticeFeed.ChatOpenExtra`를 실측으로).
2. **줍기·추적기**: 골드·장비를 연달아 주워 발밑 작은 글씨(골드 합침, COMBO와 안 겹침) · 업적 진행이 오를 때 퀘스트 추적기 맨 아래 「업적 · 이름 n/N」 제자리 갱신(일지 말풍선 없음) · 업적 달성은 위 가운데 띠 한 줄. 파티 목록에 마우스를 올려 펼침/내림.
3. **그림자 소환 습득 → 안내 창 · 스킬 추천 글귀**: Lv5 캐릭터가 스킬 창에서 「그림자 소환」을 배우고 창을 닫으면 1.5초 뒤 게임 안내 「군단 · 그림자 추출」이 한 번 열리고 다시 접속해도 안 뜸(`[VRF] shadow guide window opened`) · 기존(이미 배운) 캐릭터는 첫 접속에 한 번. HUD 띠 「스킬 추천 — 고르기」 · 창 제목 「스킬 추천」 · 보스 처치 직후 레벨 업으로 연 창의 안내 「보스 처치 보상입니다. …」. Lv1 첫 처치 때 임시 그림자가 일어나지 않는지.
