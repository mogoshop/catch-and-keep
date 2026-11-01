-- 진단만 (client · 파일 안 고침): ◀▶·닫기 단추가 메이커 maker_mouse_input에 반응하는 자리 재기
-- ① 단추마다 ButtonClickEvent 로그 · 화면 터치(ScreenTouchEvent) 로그
local base=_RankWindow.Win..'/Paper/ActBar/'
_UIKit:Get(base..'Next'):ConnectEvent(ButtonClickEvent,function() log('[VRF] DMARW raw click Next') end)
_UIKit:Get(base..'Prev'):ConnectEvent(ButtonClickEvent,function() log('[VRF] DMARW raw click Prev') end)
_InputService:ConnectEvent(ScreenTouchEvent,function(ev) log('[VRF] DMARW touch '..tostring(ev.TouchPoint)..' overUI='..tostring(_InputService:IsPointerOverUI())) end)
-- ② 누른 점(1459,812)을 단추 로컬로: _UILogic:ScreenToLocalUIPosition(Vector2(1459,812), e.UITransformComponent) → Next (-44,0) = 88×88 한가운데
-- ③ GameHUD 전체를 돌며 그 점을 담는 요소(DMHIT): RankWin(바탕 ray) · Rim · Paper · ActBar · NextArt(ray 끔) · Next(ray·단추) — 가리는 것 없음
-- ④ 정렬값(DMSORT): Next · TabDepth · BtnClose 모두 OverrideSorting=false/UI/0 · Selectable · ColorTint — 같은 구성
-- ⑤ (일시 실험 · 되돌림) Next 색 알파 0 → 0.01 → 0.3 + 틀 그림 RUID 복사: 가운데 클릭 여전히 무반응 → 알파·그림 문제 아님 → 원래 값(2860136c… · 알파 0)으로 되돌림
-- ⑥ x 쓸기 결과: 랭킹 ▶(논리 사각 x 1415~1503) 1380·1400·1420 반응 / 1440·1459·1480·1500·1520 무반응 · ◀(1083~1171) 1070~1130 반응 / 1050·1150·1170 무반응
--    랭킹 창 닫기 X(1450~1538 · 88×88): 가운데 1496 무반응 / 1440(사각 밖) 반응 · 플레이어 창 ▶(1341~1429): 가운데 1385 무반응 / 1350 반응 · ◀ 1173(계획 점) 반응
