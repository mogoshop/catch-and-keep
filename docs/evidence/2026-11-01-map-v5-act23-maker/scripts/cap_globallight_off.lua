-- 캡처 보조 (act 4 회차와 같은 처리): DarkVision 전역 조명(GlobalSerial)을 런타임에서만 지운다 · 0.3초 · 맵마다 1번 로그
local G={map=''}
_TimerService:SetTimerRepeat(function()
 local me=_UserService.LocalPlayer if not isvalid(me) or not isvalid(me.CurrentMap) then return end
 if _DarkVision.GlobalSerial ~= 0 then _OverlayLightService:DestroyOverlayLight(_DarkVision.GlobalSerial) _DarkVision.GlobalSerial = 0
  if G.map ~= me.CurrentMap.Name then G.map = me.CurrentMap.Name log('[CAP] DarkVision global light removed (runtime only) map='..G.map) end end
end,0.3)
log('[CAP] global light remover installed')
