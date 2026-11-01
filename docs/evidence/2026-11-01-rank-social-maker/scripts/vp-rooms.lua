-- 준비 (server_main · 로비): 가상 플레이어로 「채널 하나에 방 여러 개」 만들기 — 가상하나·가상둘 = 다른 게임 방 하나(둘이 같은 방 → 자동 파티), 가상셋 = 캐릭터를 고른 채 로비, 가상넷 = 캐릭터 선택 화면(빈 계정)
--   캐릭터 고르기 = PlayerSave:LoadSlot(1) (선택 창 「입장」의 서버 함수) · 방 = RoomSystem:Enter (혼자 하기·방 목록 「들어가기」와 같은 서버 함수 · id는 NewId라 혼자 하기 접두 "s" 없음)
local U={}
for _,u in pairs(_UserService.UserEntities) do U[u.PlayerComponent.UserId]=u end
local v1,v2,v3=U['203721000107795931'],U['203721000107795932'],U['203721000107795933']
for _,v in ipairs({v1,v2,v3}) do
 local sv=v:GetComponent('script.PlayerSave')
 sv:LoadSlot(1)
 log('[VRF] DMVP load uid='..v.PlayerComponent.UserId..' slot='..tostring(sv.Slot)..' load='..tostring(sv.IsLoadSuccess)..' name='..sv:CharName()..' lobby='..tostring(_RoomSystem:LobbyPlayer(v.PlayerComponent.UserId)~=nil))
end
local id=_RoomSystem:NewId()
log('[VRF] DMVP room id='..id)
local ok1=_RoomSystem:Enter(v1,id,0,true)
log('[VRF] DMVP enter v1 ok='..tostring(ok1))
local ok2=_RoomSystem:Enter(v2,id,0,false)
log('[VRF] DMVP enter v2 ok='..tostring(ok2))
