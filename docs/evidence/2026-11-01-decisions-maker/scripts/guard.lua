-- DM guard (게임 방 서버 server_instance_game:…): 저장 끔(IsLoadSuccess=false) · 무적(타이머 0.2초 — 스크립트는 바로 끝나 뒤 스크립트를 막지 않음)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local sv=p:GetComponent('script.PlayerSave') sv.IsLoadSuccess=false
local vit=p:GetComponent('script.PlayerVitals')
_TimerService:SetTimerRepeat(function() if isvalid(p) then vit.InvincibleUntil=1e9 local pc=p.PlayerComponent if pc.Hp<pc.MaxHp then pc.Hp=pc.MaxHp end end end,0.2)
local tr=p:GetComponent('script.PlayerTravel')
log('[VRF] DM guard slot='..tostring(sv.Slot)..' load='..tostring(sv.IsLoadSuccess)..' map='..tostring(p.CurrentMapName)..' known='..tostring(tr.Known)..' act='..tostring(tr.Act))
