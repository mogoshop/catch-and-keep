local pass,fail=0,0
local ck=function(n,ok,v) if ok then pass=pass+1 log("[VRF-P8-UI] PASS "..n.." "..tostring(v)) else fail=fail+1 log_error("[VRF-P8-UI] FAIL "..n.." "..tostring(v)) end end
local p=_UserService.LocalPlayer
local dismissed=_NpcWindow.Dismissed
_TimerService:ClearTimer(_NpcWindow.TimerId)
local click=p:GetComponent("script.ClickControl")
local registered=false for _,n in ipairs(_UIKit.Windows) do if n=="NpcWin" then registered=true end end
ck("NPC registered as modal",registered,nil)
click.HasDestination=true
_UIKit:Open("NpcWin")
ck("NPC cancels residual movement",not click.HasDestination,nil)
ck("NPC included in window predicate",_UIKit:AnyWindowOpen(),nil)
ck("NPC ignores itself in window predicate",not _UIKit:AnyOtherWindowOpen("NpcWin"),nil)
_HudMain:Poll() _HudMap:RenderGates(p) _HudMap:RenderNpcMark(p)
ck("NPC hides quest tracker",not _UIKit:Get("QuestTrack").Enable,nil)
ck("NPC hides onboarding",not _UIKit:Get("Tip").Enable,nil)
ck("NPC hides exit hint",not _UIKit:Get("GatePrompt").Enable,nil)
local body=_UIKit:Get("NpcWin/Paper/Body").TextGUIRendererComponent
local worst=0
for i=1,6 do
 local q=_QuestData:Get(i)
 local texts=_NpcWindow:Lines(q.intro)
 for _,line in ipairs(_NpcWindow:Lines(q.outro)) do table.insert(texts,line.."\n\n".._NpcWindow:RewardText(q)) end
 table.insert(texts,"의뢰 「"..q.title.."」\n"..q.desc.."\n\n".._NpcWindow:RewardText(q))
 table.insert(texts,"「"..q.title.."」  진행 0 / "..tostring(q.count).."\n"..q.desc.."\n어서 다녀오게.")
 local maxh=0 for _,t in ipairs(texts) do maxh=math.max(maxh,body:GetPreferredHeight(t,952)) end
 worst=math.max(worst,maxh) ck("quest dialogue fits "..tostring(i),maxh<=220,maxh)
end
local track=_UIKit:Get("QuestTrack/Body").TextGUIRendererComponent
for i=1,6 do local q=_QuestData:Get(i) local h=track:GetPreferredHeight(q.zone.."\n"..q.objective,342) ck("objective fits "..tostring(i),h<=112,h) end
_UIKit:Open("SkillWin") _NpcWindow:Poll()
ck("skill menu replaces NPC dialogue",_UIKit:IsOpen("SkillWin") and not _UIKit:IsOpen("NpcWin"),nil)
ck("dismissal retained until leaving",_NpcWindow.Dismissed or _NpcWindow:FindNpc(p)==nil,nil)
for _,n in ipairs(_UIKit.Windows) do _UIKit:Close(n) end
_NpcWindow.Dismissed=dismissed
_NpcWindow.TimerId=_TimerService:SetTimerRepeat(function() _NpcWindow:Poll() end,0.2)
log("[VRF-P8-UI] total "..tostring(pass).." passed / "..tostring(fail).." failed")
