-- server 검사 후 fixtures ready 로그가 보이면 25초 이내 client에서 실행.
local p=_UserService.LocalPlayer
local cc=p:GetComponent("script.ClickControl")
local check=function(n,ok,v) if ok then log("[VRF-P2C] PASS "..n.." "..tostring(v)) else log_error("[VRF-P2C] FAIL "..n.." "..tostring(v)) end end
local target=nil
for _,c in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster",true)) do if c.Entity.Name=="P2_selected" then target=c.Entity end end
if not isvalid(target) then log_error("[VRF-P2C] FAIL missing fixture") return end
local point=_UILogic:WorldToScreenPosition(_Util:Pos2(target)+Vector2(0,0.25))
cc:Pick(point)
check("click selects intended monster",cc.AttackTarget==target,cc.AttackTarget)
cc.SlideCount=2
cc:Pick(point)
check("holding same target preserves stuck count",cc.SlideCount==2,cc.SlideCount)
cc:Cancel()
local ground=_Util:Pos2(p)+Vector2(0,3)
local screen=_UILogic:WorldToScreenPosition(ground)
cc:Pick(screen) cc.SlideCount=2 cc:Pick(screen)
check("holding same ground preserves stuck count",cc.HasDestination and cc.SlideCount==2,cc.SlideCount)
cc.BlockedPick=true cc.BlockedPoint=ground cc:Cancel() cc:Pick(screen)
check("blocked hold does not restart",not cc.HasDestination and cc.AttackTarget==nil,cc.HasDestination)
cc.BlockedPick=false cc:Pick(screen)
check("fresh input restarts destination",cc.HasDestination,cc.HasDestination)
cc:Cancel()
_MobilePad.Holding=true
_MobilePad:HandleApplicationFocusOutEvent(ApplicationFocusOutEvent())
check("focus loss releases mobile attack",not _MobilePad.Holding,_MobilePad.Holding)
_MobilePad.Holding=true _MobilePad:ToggleEdit()
check("edit mode releases attack",not _MobilePad.Holding,_MobilePad.Holding)
_MobilePad:ToggleEdit()
local e=_UIKit:Get("/ui/ShadowHUD/MobilePad/Attack")
_MobilePad.Holding=true e:SendEvent(UITouchExitEvent(e,1,Vector2(0,0)))
check("touch exit releases attack",not _MobilePad.Holding,_MobilePad.Holding)
cc:Cancel()
