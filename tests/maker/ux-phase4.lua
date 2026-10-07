local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P4] FAIL missing player") return end
local sv=p:GetComponent("script.PlayerSave") local tr=p:GetComponent("script.PlayerTravel")
local old={map=p.CurrentMap.Name,pos=_Util:Pos2(p),save=sv.IsLoadSuccess}
local fixtures={} local tiles=nil local edited={}
local ck=function(n,ok,v) if ok then log("[VRF-P4] PASS "..n.." "..tostring(v)) else log_error("[VRF-P4] FAIL "..n.." "..tostring(v)) end end
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function()
 for _,e in ipairs(fixtures) do if isvalid(e) then e:Destroy() end end
 if tiles~=nil then for _,c in ipairs(edited) do if c.index~=nil then tiles:SetTile(c.index,c.pos) else tiles:RemoveTile(c.pos) end end end
 tr:Go(old.map,old.pos) sv.IsLoadSuccess=old.save log("[VRF-P4] restored player")
end,8)
tr:Go("map01",Vector2(-19,9))
_TimerService:SetTimerOnce(function()
 local map=p.CurrentMap local me=_Util:Pos2(p)
 tiles=map:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
 local c=tiles:ToCellPosition(Vector3(me.x,me.y,0)) local floor=tiles:GetTile(c).Index
 for x=0,5 do for y=0,2 do local cell=Vector2Int(c.x+x,c.y+y) local t=tiles:GetTile(cell) table.insert(edited,{pos=cell,index=t~=nil and t.Index or nil}) tiles:SetTile(floor,cell) end end
 local enemy=_SpawnService:SpawnByModelId("hellhound","P4_target",Vector3(me.x+2,me.y,0),map) table.insert(fixtures,enemy)
 _Util:AfterSpawn(enemy,"script.Monster",function(m)
  m.MaxHp=1000 m.Hp=1000 m.RespawnDelay=-1 enemy.AIChaseComponent.Enable=false enemy:GetComponent("script.MonsterAttack").Enable=false enemy.KinematicbodyComponent:SetWorldPosition(me+Vector2(2,0))
  local ent=_SpawnService:SpawnByModelId(_GameConst.ModelShadowUnit,"P4_mage",Vector3(me.x,me.y,0),map) table.insert(fixtures,ent)
  _Util:AfterSpawn(ent,"script.ShadowUnit",function(u)
   local def=_GameData:GetMonsterStats("skel_warrior")
   u:Setup(p,"p4fixture",20,1000,def.stand,def.move,Vector2(0,0))
   u.Kind="mage" u.Element="cold" u.ElementRatio=1 u.AttackRange=3 u.AttackRUID=def.attack
   ent.TransformComponent.Scale=Vector3(0.7,0.7,1)
   u.Target=enemy u.RetargetTimer=999 u.AttackTimer=999
   ent.KinematicbodyComponent:SetWorldPosition(me)
   _TimerService:SetTimerOnce(function()
    u:DoAttack(me,Vector2(2,0))
    ck("mage plays attack clip",u.CurrentClip==def.attack,u.CurrentClip)
    ck("mage has intended small scale",math.abs(math.abs(ent.TransformComponent.Scale.x)-0.7)<0.001,ent.TransformComponent.Scale.x)
    ck("ranged attack has no instant damage",m.Hp==1000,m.Hp)
    _TimerService:SetTimerOnce(function()
     local n=0 for _,shot in ipairs(map:GetChildComponentsByTypeName("script.Projectile",true)) do if shot.Owner==ent and shot.Team=="minion" then n=n+1 end end
     ck("mage launches real projectile",n==1,n)
     ck("damage waits for travel",m.Hp==1000,m.Hp)
    end,0.23)
    _TimerService:SetTimerOnce(function() ck("mage projectile delivers damage once",m.Hp==980,m.Hp) end,0.65)
   end,0.1)
   _TimerService:SetTimerOnce(function()
    m.Hp=1000 u:DoAttack(_Util:Pos2(ent),_Util:Pos2(enemy)-_Util:Pos2(ent))
    _TimerService:SetTimerOnce(function() enemy.KinematicbodyComponent:SetWorldPosition(me+Vector2(2,2)) end,0.25)
    _TimerService:SetTimerOnce(function() ck("ranged bolt can miss moved target",m.Hp==1000,m.Hp) end,0.8)
   end,1.2)
   _TimerService:SetTimerOnce(function()
    enemy.KinematicbodyComponent:SetWorldPosition(me+Vector2(2,0))
    _TimerService:SetTimerOnce(function()
     m.Hp=1000 u:DoAttack(_Util:Pos2(ent),_Util:Pos2(enemy)-_Util:Pos2(ent)) u:Rally(2.5)
     _TimerService:SetTimerOnce(function() ck("rally cancels prepared attack",m.Hp==1000,m.Hp) end,0.7)
    end,0.1)
   end,2.3)
   _TimerService:SetTimerOnce(function()
    u.RallyTimer=0
    u:ShootBolt(_Util:Pos2(enemy))
    _TimerService:SetTimerOnce(function()
     local before=0 for _,shot in ipairs(map:GetChildComponentsByTypeName("script.Projectile",true)) do if shot.Owner==ent then before=before+1 end end
     u:Rally(1)
     local after=0 for _,shot in ipairs(map:GetChildComponentsByTypeName("script.Projectile",true)) do if shot.Owner==ent then after=after+1 end end
     ck("rally removes launched bolts",before==1 and after==0,tostring(before).."→"..tostring(after))
    end,0.05)
   end,4)

  end,nil)
 end,nil)
end,1)
