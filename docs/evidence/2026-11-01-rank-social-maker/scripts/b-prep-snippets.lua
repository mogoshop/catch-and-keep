-- B(플레이어 창) 준비·대체 스크립트 원문 모음 — 각 블록을 따로 보냈다 (컨텍스트는 머리말)

-- [server_instance_game:<가상 방>] 대체: 가상 플레이어가 받은 요청 띠에서 「거절」/「수락」 — PlayerSocial.RespondRequest(game) 본문 그대로 (senderUserId 확인만 뺌)
local p=_UserService:GetUserEntityByUserId('203721000107795931')
local s=p:GetComponent('script.PlayerSocial')
log('[VRF] DM vp1 pending kind='..s.PendingKind..' from='..s.PendingFrom..' name='..s.PendingFromName)
local kind=s.PendingKind
s.PendingKind='' s.PendingFrom='' s.PendingFromName=''
if kind=='game' then _TownBoard:AnswerInvite(p,false) end   -- 수락은 true

-- [server_main] 준비: 가상넷(로비) → 새내기 초대 이벤트 (TownBoard.RequestChannelInvite 끝부분 본문 · 보낸 사람 확인·InviteCode 판단만 뺌)
local vp=_UserService:GetUserEntityByUserId('203721000107795934')
local entry=_PartySystem:FindChannelEntry('20372100010779593')
local ev=ChannelInviteEvent()
ev.Kind='invite' ev.ToUid='20372100010779593' ev.FromUid='203721000107795934'
ev.FromName=_TownBoard:Clean(_PartySystem:NameOf(vp),16) ev.FromRoom=_RoomService.RoomKey or '' ev.GameId='1bc0fdf555b' ev.Diff=0
_RoomService:RequestSendEventToRoomAsync(ev, entry.room, function(result, sent) log('[VRF] DM mimic invite sent result='..tostring(result)) end)

-- [server_instance_game:s1bc0d6a080f] 준비: 가상하나 「게임 나가기」(RoomSystem.RequestLeaveGame 본문) + 새내기 저장 켬
local uid='203721000107795931'
local p2=_UserService:GetUserEntityByUserId(uid)
_RoomSystem:ClearReturn(uid)
local ok=p2:GetComponent('script.PlayerSave'):PrepareRoomMove(_RoomService.StaticRoomKey)
_RoomSystem:WriteCount(_UserService:GetUserCount()-1)
local moved=_RoomService:MoveUsersToStaticRoom({uid}, _GameConst.MapLobby)
_UserService:GetUserEntityByUserId('20372100010779593'):GetComponent('script.PlayerSave').IsLoadSuccess=true

-- [server_main] 준비: 가상하나 새 게임 방 → [server_instance_game:1bc11e3bc68] 가상하나 → 새내기 초대 이벤트 (위와 같은 본문 · GameId = 그 방 · InviteCode 확인 = g)

-- [client] 대체: ◀▶ 단추에 ButtonClickEvent 보내기 (실제 클릭이 단추 사건을 못 냄 — NOTES 관찰 3)
-- _UIKit:Get(_SocialWindow.Win..'/Pager/Next'):SendEvent(ButtonClickEvent())
-- _UIKit:Get(_RankWindow.Win..'/Paper/ActBar/Next'):SendEvent(ButtonClickEvent())
