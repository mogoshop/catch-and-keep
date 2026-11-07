-- 녹화용 HUD·이름표 숨김 (maker_execute_script 클라이언트에서 실행, 11-07 녹화 레인 원본)
-- 11-07 5차: 메이커 갱신 뒤 UITransformComponent.ActivePlatform 쓰기가 「no such field」 오류 → 그 줄을 뺌(UIScale 0만으로 숨김)
if _G.REC_HUD then _TimerService:ClearTimer(_G.REC_HUD) _G.REC_HUD=nil end
local hide={"/ui/GameHUD/XP","/ui/GameHUD/LifeOrb","/ui/GameHUD/ManaOrb","/ui/GameHUD/Bottom","/ui/GameHUD/Buffs","/ui/GameHUD/BtnMenu","/ui/GameHUD/BtnJae","/ui/GameHUD/BtnJournal","/ui/GameHUD/Party","/ui/GameHUD/Tip","/ui/GameHUD/Target","/ui/GameHUD/MFrame","/ui/GameHUD/OfferBand","/ui/GameHUD/NpcMark","/ui/GameHUD/ShrineBuff","/ui/GameHUD/WarnPop","/ui/GameHUD/GatePrompt","/ui/AimHUD/Direction",
"/ui/NavigationHUD/SafeArea","/ui/ChatHUD/Chat","/ui/ShadowHUD/Status","/ui/ShadowHUD/Hint","/ui/RewardHUD/Feed","/ui/CompanionHUD/SafeArea","/ui/InteractionHUD/SafeArea","/ui/JournalHUD/SafeArea/BtnOpen","/ui/CoopHUD/RescueBar"}
for i=1,8 do table.insert(hide,"/ui/GameHUD/Gate"..i) table.insert(hide,"/ui/GameHUD/CheerMark"..i) end
if _G.REC_EXTRA then for _,p in ipairs(_G.REC_EXTRA) do table.insert(hide,p) end end
local keep={} if _G.REC_KEEP then for _,p in ipairs(_G.REC_KEEP) do keep[p]=true end end
local ents={}
for _,p in ipairs(hide) do local e=_EntityService:GetEntityByPath(p) if e~=nil and isvalid(e.UITransformComponent) then local t=e.UITransformComponent if keep[p] then t.UIScale=Vector3(1,1,1) else table.insert(ents,e) end end end
_G.REC_ENTS=ents
local tick=0
_G.REC_HUD=_TimerService:SetTimerRepeat(function()
  tick=tick+1
  for _,e in ipairs(ents) do if isvalid(e) then local t=e.UITransformComponent if t.UIScale.x~=0 then t.UIScale=Vector3(0,0,1) end end end
  local me=_UserService.LocalPlayer
  if tick%3==0 and isvalid(me) and isvalid(me.CurrentMap) then
    for _,t in ipairs(me.CurrentMap:GetChildComponentsByTypeName("NameTagComponent",true)) do if t.Enable then t.Enable=false end end
    if isvalid(me.NameTagComponent) and me.NameTagComponent.Enable then me.NameTagComponent.Enable=false end
  end
end,0.1)
log("[VRF] REC hud3 n="..#ents.."/"..#hide)
