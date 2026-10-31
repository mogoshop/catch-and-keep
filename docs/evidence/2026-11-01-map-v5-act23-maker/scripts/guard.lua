-- A23M guard (방 서버): 저장 끔(IsLoadSuccess=false) · 무적(타이머 0.2초, 스크립트는 바로 끝남 — 뒤 스크립트 줄 세우지 않게)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local sv=p:GetComponent('script.PlayerSave') sv.IsLoadSuccess=false
local vit=p:GetComponent('script.PlayerVitals')
_TimerService:SetTimerRepeat(function() if isvalid(p) then vit.InvincibleUntil=1e9 local pc=p.PlayerComponent if pc.Hp<pc.MaxHp then pc.Hp=pc.MaxHp end end end,0.2)
local tr=p:GetComponent('script.PlayerTravel')
log('[VRF] A23M guard load='..tostring(sv.IsLoadSuccess)..' map='..tostring(p.CurrentMapName)..' hp='..tostring(p.PlayerComponent.Hp)..'/'..tostring(p.PlayerComponent.MaxHp)..' known='..tostring(tr.Known)..' act='..tostring(tr.Act))
