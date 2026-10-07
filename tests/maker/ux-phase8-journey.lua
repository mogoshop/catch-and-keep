local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P8] missing player") return end
local sv=p:GetComponent("script.PlayerSave") local loaded=sv.IsLoadSuccess
local copy=function(v) return v end
copy=function(v) if type(v)~="table" then return v end local r={} for k,x in pairs(v) do r[k]=copy(x) end return r end
local backups={} for _,sec in ipairs(sv:Sections()) do for _,part in ipairs(sec.parts) do local c=p:GetComponent(part[2]) if c~=nil then table.insert(backups,{c=c,data=copy(c:GetSaveData())}) end end end
local pos=_Util:Pos2(p) local map=p.CurrentMap.Name local hp=p.PlayerComponent.Hp local mana=p:GetComponent("script.PlayerStats").Mana
sv.IsLoadSuccess=false
local q=p:GetComponent("script.PlayerQuest") q.Index=1 q.State=0 q.Progress=0
local sk=p:GetComponent("script.SkillBook") sk.Levels={} sk.Slots=",,," sk.RightSkill="" sk:RefreshDigest()
local st=p:GetComponent("script.PlayerStats") st.Level=1 st.Exp=0 st.ExpToNext=st:CalcExpToNext(1) st.SkillPoints=1 st.StatPoints=0 st:Recalculate(true)
local restored=false
local restore=function()
 if restored then return end
 restored=true
 _UndeadSystem:DismissAll(p)
 p:GetComponent("script.PlayerTravel"):Go(map,pos)
 for _,rec in ipairs(backups) do rec.c:LoadSaveData(rec.data) end
 p.PlayerComponent.Hp=hp st.Mana=mana sv.IsLoadSuccess=loaded
 sv.LastSaved.UXJourneyRestore=nil
 log("[VRF-P8] restored original character")
end
sv.LastSaved.UXJourneyRestore=restore
_TimerService:SetTimerOnce(restore,600)
log("[VRF-P8] fresh journey begun; saves disabled for 600 seconds")
