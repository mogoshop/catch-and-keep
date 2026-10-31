-- A23M 클라 기록기: 맵 도착 · 움직였다 멈춤(0.4초 정지) 시작/끝 좌표 · 웨이포인트 Known 변화 (0.1초 타이머)
local L={map='',lx=0,ly=0,moving=false,fx=0,fy=0,still=0,known=nil}
_TimerService:SetTimerRepeat(function()
 local me=_UserService.LocalPlayer if not isvalid(me) or not isvalid(me.CurrentMap) then return end
 local m=me.CurrentMap.Name local p=me.TransformComponent.WorldPosition local x,y=p.x,p.y
 if m~=L.map then L.map=m L.lx=x L.ly=y L.moving=false L.still=0 log(string.format('[VRF] A23M at %s (%.2f, %.2f)',m,x,y)) return end
 local d=math.abs(x-L.lx)+math.abs(y-L.ly)
 if d>0.003 then if not L.moving then L.moving=true L.fx=L.lx L.fy=L.ly end L.still=0
 elseif L.moving then L.still=L.still+1 if L.still>=4 then L.moving=false log(string.format('[VRF] A23M stop %s from=(%.2f, %.2f) end=(%.2f, %.2f)',m,L.fx,L.fy,x,y)) end end
 L.lx=x L.ly=y
 local tr=me:GetComponent('script.PlayerTravel')
 if tr~=nil then local k=tr.Known if L.known==nil then L.known=k elseif k~=L.known then log(string.format('[VRF] A23M known %s -> %s at %s (%.2f, %.2f)',L.known,k,m,x,y)) L.known=k end end
end,0.1)
log('[VRF] A23M logger installed')
