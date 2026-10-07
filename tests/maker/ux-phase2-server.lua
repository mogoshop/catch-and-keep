-- 단독 메이커 세션 server_main에서 실행, 25초 후 복구.
local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P2] FAIL missing player") return end
local sv=p:GetComponent("script.PlayerSave")
local tr=p:GetComponent("script.PlayerTravel")
local atk=p:GetComponent("script.PlayerAttack")
local old={map=p.CurrentMap.Name,pos=_Util:Pos2(p),save=sv.IsLoadSuccess,dir=p.PlayerControllerComponent.LookDirectionX,last=atk.LastAttackAt}
local fixtures={}
local ck=function(n,ok,v) if ok then log("[VRF-P2] PASS "..n.." "..tostring(v)) else log_error("[VRF-P2] FAIL "..n.." "..tostring(v)) end end
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function()
 for _,e in pairs(fixtures) do if isvalid(e) then e:Destroy() end end
 tr:Go(old.map,old.pos) p.PlayerControllerComponent.LookDirectionX=old.dir atk.LastAttackAt=old.last sv.IsLoadSuccess=old.save
 log("[VRF-P2] restored player")
end,25)
tr:Go("map01",Vector2(-19,9))
_TimerService:SetTimerOnce(function()
 local me=_Util:Pos2(p)
 for name,offset in pairs({P2_selected=Vector2(1.1,0),P2_nearer=Vector2(-0.5,0),P2_far=Vector2(4,0)}) do
  local e=_SpawnService:SpawnByModelId("hellhound",name,Vector3(me.x+offset.x,me.y+offset.y,0),p.CurrentMap)
  fixtures[name]=e
  _Util:AfterSpawn(e,"script.Monster",function(m)
   m.MaxHp=1000 m.Hp=1000 m.RespawnDelay=-1 e.AIChaseComponent.Enable=false e.MovementComponent.InputSpeed=0 e:GetComponent("script.MonsterAttack").Enable=false
   e.KinematicbodyComponent:SetWorldPosition(me+offset)
  end,nil)
 end
 _TimerService:SetTimerOnce(function()
  p.PlayerControllerComponent.LookDirectionX=1
  atk:SetSelectedTarget(fixtures.P2_selected)
  ck("selected overrides nearer behind",atk:ResolveTarget()==fixtures.P2_selected,atk:ResolveTarget().Name)
  atk.LastAttackAt=-99 atk:DoAttack()
  _TimerService:SetTimerOnce(function()
   ck("selected enemy takes damage",fixtures.P2_selected:GetComponent("script.Monster").Hp<1000,fixtures.P2_selected:GetComponent("script.Monster").Hp)
   ck("nearer rear enemy not hit",fixtures.P2_nearer:GetComponent("script.Monster").Hp==1000,fixtures.P2_nearer:GetComponent("script.Monster").Hp)
   atk:SetSelectedTarget(fixtures.P2_far) atk.LastAttackAt=-99 atk:DoAttack()
   ck("far selected prevents retarget",atk:ResolveTarget()==nil and atk.LastAttackAt==-99,atk.LastAttackAt)
   atk:SetSelectedTarget(nil) p.PlayerControllerComponent.LookDirectionX=1
   ck("auto aim ignores rear",atk:ResolveTarget()==fixtures.P2_selected,atk:ResolveTarget().Name)
   fixtures.P2_far.KinematicbodyComponent:SetWorldPosition(_Util:Pos2(p)+Vector2(0.65,0.4))
   ck("auto aim keeps living target",atk:ResolveTarget()==fixtures.P2_selected,atk:ResolveTarget().Name)
   fixtures.P2_selected:GetComponent("script.Monster").IsDead=true
   ck("dead target replaced",atk:ResolveTarget()==fixtures.P2_far,atk:ResolveTarget().Name)
   fixtures.P2_selected:GetComponent("script.Monster").IsDead=false
   atk:CancelAttack()
   ck("cancel clears both targets",atk.SelectedTarget==nil and atk.AutoTarget==nil,atk.AttackEpoch)
   log("[VRF-P2] fixtures ready for client input probe")
  end,0.2)
 end,0.2)
end,1)
