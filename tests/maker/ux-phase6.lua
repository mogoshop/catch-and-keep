-- 메이커 Client. 저장 데이터는 변경하지 않으며 검사 후 모든 창을 닫는다.
local pass,fail=0,0
local ck=function(n,ok,v) if ok then pass=pass+1 log("[VRF-P6] PASS "..n.." "..tostring(v)) else fail=fail+1 log_error("[VRF-P6] FAIL "..n.." "..tostring(v)) end end
local bounds=function(e)
 local cs=e.UITransformComponent:GetWorldCorners() local b={l=math.huge,r=-math.huge,d=math.huge,u=-math.huge}
 for _,c in ipairs(cs) do b.l=math.min(b.l,c.x) b.r=math.max(b.r,c.x) b.d=math.min(b.d,c.y) b.u=math.max(b.u,c.y) end return b
end
local apart=function(a,z) local x=bounds(a) local y=bounds(z) return x.r<=y.l or y.r<=x.l or x.u<=y.d or y.u<=x.d end
ck("terrain is drawn",_HudMap.TerrainUsed>0,_HudMap.TerrainUsed)
local drawable=0 for i=1,_HudMap.TerrainUsed do local e=_UIKit:Get("MiniMap/Area/Terrain/R"..tostring(i)) if e.Enable and e.PolygonGUIRendererComponent:IsDrawable() then drawable=drawable+1 end end
ck("terrain polygons render",drawable==_HudMap.TerrainUsed,drawable)
local n=0 for i=1,30 do local e=_UIKit:Get("InvWin/Bag/Bag"..tostring(i)) if isvalid(e) and e.UITransformComponent.RectSize.x>=88 and e.UITransformComponent.RectSize.y>=88 then n=n+1 end end
ck("30 large bag touch targets",n==30,n)
local oldSel=_SkillWindow.Selected
_UIKit:Open("SkillWin") _SkillWindow:Poll()
for t=1,3 do local e=_UIKit:Get("SkillWin/Col"..tostring(t)) ck("skill scroll column "..tostring(t),e.ScrollLayoutGroupComponent.UseScroll,e.ScrollLayoutGroupComponent.UseScroll) end
_SkillWindow:Select("T1_1") _SkillWindow:Poll()
ck("selection displays skill description",_SkillWindow.Selected==_SkillWindow.Rows.T1_1 and string.find(_UIKit:Get("SkillWin/DescBox/Desc").TextGUIRendererComponent.Text,"해골 전사",1,true)~=nil,_SkillWindow.Selected)
local text=_UIKit:Get("SkillWin/DescBox/Desc").TextGUIRendererComponent
ck("description fits actual text height",text:GetPreferredHeight(text.Text,936)<=180,text:GetPreferredHeight(text.Text,936))
ck("description separated from learning buttons",apart(_UIKit:Get("SkillWin/DescBox"),_UIKit:Get("SkillWin/BtnLearn")),nil)
if Environment:IsMobilePlatform() then
 ck("mobile slot label",_UIKit:Get("SkillWin/BtnA").TextGUIRendererComponent.Text=="1번 칸",nil)
 ck("quest panel separated from upper skill",apart(_UIKit:Get("QuestTrack"),_UIKit:Get("/ui/ShadowHUD/MobilePad/Skills/S4")),nil)
 _MobilePad.Holding=true _MobilePad:Poll()
 ck("window hides mobile combat pad",not _UIKit:Get(_MobilePad.Root).Enable and not _MobilePad.Holding,nil)
 local edit=_MobilePad.EditMode _MobilePad:ToggleEdit() ck("window blocks edit behind popup",_MobilePad.EditMode==edit,nil)
end
local maxHeight=0 local worst="" local oldChoice=_SkillWindow.Selected
local book=_UIKit:Comp("script.SkillBook") local stats=_UIKit:Comp("script.PlayerStats")
for _,id in ipairs(_SkillData:GetOrder()) do _SkillWindow.Selected=id local desc=_SkillWindow:Describe(book,stats) local h=text:GetPreferredHeight(desc,936) if h>maxHeight then maxHeight=h worst=id end end
_SkillWindow.Selected=oldChoice
ck("all skill descriptions fit",maxHeight<=180,tostring(maxHeight).." "..worst)
for t=1,3 do ck("navigation avoids description "..tostring(t),apart(_UIKit:Get("SkillWin/Scroll"..tostring(t).."Down"),_UIKit:Get("SkillWin/DescBox")),nil) end
local scroll=_UIKit:Get("SkillWin/Col1").ScrollLayoutGroupComponent
scroll:SetScrollNormalizedPosition(UITransformAxis.Vertical,0)
_TimerService:SetTimerOnce(function()
 _SkillWindow:Page(1,1)
 _TimerService:SetTimerOnce(function()
  local position=scroll:GetScrollNormalizedPosition(UITransformAxis.Vertical)
  ck("navigation button advances scroll",math.abs(position-0.45)<0.02,position)
_UIKit:Open("InvWin")
ck("opening another window closes skill tree",_UIKit:IsOpen("InvWin") and not _UIKit:IsOpen("SkillWin"),nil)
ck("inventory height fits preview",_UIKit:Get("InvWin/Rim").UITransformComponent.RectSize.y<=_UIKit:Get("/ui/GameHUD").UITransformComponent.RectSize.y,nil)
_HudMap:RenderGates(_UserService.LocalPlayer) ck("window suppresses exit prompt",not _UIKit:Get("GatePrompt").Enable,nil)
_UIKit:Open("CharWin")
local slots={"Str","Dex","Vit","Ene"} local separated=true
for i=1,3 do separated=separated and apart(_UIKit:Get("CharWin/"..slots[i].."/BtnAdd"),_UIKit:Get("CharWin/"..slots[i+1].."/BtnAdd")) end
ck("stat allocation buttons do not overlap",separated,nil)
for _,win in ipairs(_UIKit.Windows) do _UIKit:Close(win) end
_SkillWindow.Selected=oldSel _SkillWindow.RenderKey=""
if Environment:IsMobilePlatform() then _MobilePad:Poll() ck("closing popup restores mobile pad",_UIKit:Get(_MobilePad.Root).Enable,nil) end
ck("all windows close",not _UIKit:AnyWindowOpen(),nil)
log("[VRF-P6] total "..tostring(pass).." passed / "..tostring(fail).." failed")

 end,0.3)
end,0.1)
