-- DM 관찰용 (클라): 방향키 Down/Up 사건 시각 + 0.25초마다 맵·자리 (10초 뒤 스스로 멈춤) — 맵 이동 중 키를 뗀 것이 전달되는지 보기
local t0=_UtilLogic.ElapsedSeconds
local hd=_InputService:ConnectEvent(KeyDownEvent,function(e) log(string.format('[VRF] DM key down %s t=%.2f',tostring(e.key),_UtilLogic.ElapsedSeconds-t0)) end)
local hu=_InputService:ConnectEvent(KeyUpEvent,function(e) log(string.format('[VRF] DM key up %s t=%.2f',tostring(e.key),_UtilLogic.ElapsedSeconds-t0)) end)
local n=0 local id=0
id=_TimerService:SetTimerRepeat(function()
 n=n+1
 local me=_UserService.LocalPlayer
 if isvalid(me) and isvalid(me.CurrentMap) then local p=me.TransformComponent.WorldPosition log(string.format('[VRF] DM trace t=%.2f %s (%.2f, %.2f)',_UtilLogic.ElapsedSeconds-t0,me.CurrentMap.Name,p.x,p.y)) end
 if n>=40 then _TimerService:ClearTimer(id) _InputService:DisconnectEvent(KeyDownEvent,hd) _InputService:DisconnectEvent(KeyUpEvent,hu) log('[VRF] DM trace end') end
end,0.25)
log('[VRF] DM keytrace installed')
