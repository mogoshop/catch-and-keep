-- 서버: 캐릭터 백업/저장 중지/600초 자동 복원. 물리 클릭 처치 → A 소환 검증용.
-- 조기 복원: 모든 플레이어 PlayerSave.LastSaved.UXJourneyRestore() 호출.
local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P8] missing player") return end
local sv=p:GetComponent("script.PlayerSave") local loaded=sv.IsLoadSuccess
local copy=function(v) return v end
copy=function(v) if type(v)~="table" then return v end local r={} for k,x in pairs(v) do r[k]=copy(x) end return r end
local backups={} for _,sec in ipairs(sv:Sections()) do for _,part in ipairs(sec.parts) do local c=p:GetComponent(part[2]) if c~=nil then table.insert(backups,{c=c,data=copy(c:GetSaveData())}) end end end
local pos=_Util:Pos2(p) local map=p.CurrentMap.Name local hp=p.PlayerComponent.Hp local mana=p:GetComponent("script.PlayerStats").Mana
sv.IsLoadSuccess=false
local q=p:GetComponent("script.PlayerQuest") q.Index=1 q.State=1 q.Progress=0
local sk=p:GetComponent("script.SkillBook") sk.Levels={raise_skeleton=1} sk.Slots="raise_skeleton,,," sk.RightSkill="" sk:RefreshDigest()
local st=p:GetComponent("script.PlayerStats") st.Level=1 st.Exp=0 st.ExpToNext=st:CalcExpToNext(1) st.SkillPoints=0 st.StatPoints=0 st:Recalculate(true)
p:GetComponent("script.PlayerTravel"):Go("town",Vector2(0,-3.6))
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
_TimerService:SetTimerOnce(function() local f=sv.LastSaved.UXJourneyRestore if f~=nil then f() end end,600)
p:GetComponent("script.PlayerTravel"):Go("map01",Vector2(-19.6,0))
_TimerService:SetTimerOnce(function()
 local e=_SpawnService:SpawnByModelId("hellhound","UX_Input_Target",Vector3(-17.6,0,0),p.CurrentMap)
 _Util:AfterSpawn(e,"script.Monster",function(m)
  e.AIChaseComponent.Enable=false e:GetComponent("script.MonsterAttack").Enable=false m.RespawnDelay=-1
  local previous=sv.LastSaved.UXJourneyRestore
  sv.LastSaved.UXJourneyRestore=function() if isvalid(e) then e:Destroy() end previous() end
  _TimerService:SetTimerOnce(function() if isvalid(e) then e:Destroy() end end,590)
local p=_UserService:GetUsersByMapName("map01")[1]
local old={}
for _,m in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster",true)) do
 if m.Entity.Name~="UX_Input_Target" then
 local e=m.Entity local a=e:GetComponent("script.MonsterAttack")
 table.insert(old,{e=e,ai=e.AIChaseComponent.Enable,atk=a.Enable})
 e.AIChaseComponent.Enable=false a.Enable=false e.MovementComponent:MoveToDirection(Vector2(0,0),0)
 end
end
p.PlayerComponent.Hp=p.PlayerComponent.MaxHp
local sv=p:GetComponent("script.PlayerSave") local previous=sv.LastSaved.UXJourneyRestore
sv.LastSaved.UXJourneyRestore=function() for _,r in ipairs(old) do if isvalid(r.e) then r.e.AIChaseComponent.Enable=r.ai r.e:GetComponent("script.MonsterAttack").Enable=r.atk end end previous() end
log("[VRF-P8-INPUT] background combat paused for physical input fixture")

  log("[VRF-P8-INPUT] isolated physical input fixture ready")
 end,nil)
end,2)
log("[VRF-P8] fresh journey begun; saves disabled for 600 seconds")
