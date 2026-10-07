-- 단독 메이커 server_main에서 실행. 7초 후 플레이어·검사 타일 복구.
local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P3] FAIL missing player") return end
local tr=p:GetComponent("script.PlayerTravel")
local sv=p:GetComponent("script.PlayerSave")
local atk=p:GetComponent("script.PlayerAttack")
local old={map=p.CurrentMap.Name,pos=_Util:Pos2(p),save=sv.IsLoadSuccess}
local fixtures={} local edited={} local tiles=nil
local ck=function(n,ok,v) if ok then log("[VRF-P3] PASS "..n.." "..tostring(v)) else log_error("[VRF-P3] FAIL "..n.." "..tostring(v)) end end
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function()
 for _,e in ipairs(fixtures) do if isvalid(e) then e:Destroy() end end
 if tiles~=nil then
  for _,c in ipairs(edited) do if c.name~=nil then tiles:SetTile(c.name,c.pos) else tiles:RemoveTile(c.pos) end end
 end
 tr:Go(old.map,old.pos) sv.IsLoadSuccess=old.save log("[VRF-P3] restored player and terrain")
end,7)
tr:Go("map01",Vector2(-19,9))
_TimerService:SetTimerOnce(function()
 local map=p.CurrentMap local me=_Util:Pos2(p)
 tiles=map:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
 if tiles==nil then log_error("[VRF-P3] FAIL missing terrain") return end
 local startCell=tiles:ToCellPosition(Vector3(me.x,me.y,0))
 local floor=tiles:GetTile(startCell).Name
 local edit=function(cell,index)
  local t=tiles:GetTile(cell) table.insert(edited,{pos=cell,name=t~=nil and t.Name or nil}) tiles:SetTile(index,cell)
 end
 -- 검사용 두 레인. 검사 종료 시 원래 타일을 복원한다.
 for y=0,2,2 do for x=1,6 do edit(Vector2Int(startCell.x+x,startCell.y+y),floor) end end
 edit(Vector2Int(startCell.x+2,startCell.y),1)
 local wall=tiles:ToWorldPosition(startCell.x+2,startCell.y)
 ck("collidable tile recognized",_Util:TileBlocked(tiles.Entity,Vector2(wall.x,wall.y)),wall)
 ck("wall blocks line of sight",not _Util:HasLineOfSight(map,me,me+Vector2(4,0)),nil)
 local spawnMonster=function(id,name,pos,onReady)
  local e=_SpawnService:SpawnByModelId(id,name,Vector3(pos.x,pos.y,0),map) table.insert(fixtures,e)
  _Util:AfterSpawn(e,"script.Monster",function(m)
   m.RespawnDelay=-1 e.AIChaseComponent.Enable=false e.MovementComponent.InputSpeed=0 e:GetComponent("script.MonsterAttack").Enable=false e.KinematicbodyComponent:SetWorldPosition(pos)
   if id=="fallenimp" then e:GetComponent("script.MonsterBehavior").Enable=false end
   onReady(m)
  end,nil)
 end
 local fire=function(pos,callback)
  local e=_SpawnService:SpawnByModelId(_GameConst.ModelProjectile,"P3_shot",Vector3(pos.x,pos.y+0.3,0),map) table.insert(fixtures,e)
  _Util:AfterSpawn(e,"script.Projectile",function(shot)
   shot.DebugLog=true
   shot:Launch(p,Vector2(1,0),60,6,11,"skill.bone_shard",false) callback(shot)
  end,nil)
 end
 spawnMonster("hellhound","P3_behind_wall",me+Vector2(3.2,0),function(m)
  m.MaxHp=1000 m.Hp=1000
  fire(me,function(shot)
   shot:OnUpdate(0.1)
   ck("fast projectile stops at wall",not isvalid(shot),isvalid(shot))
   ck("enemy behind wall unharmed",m.Hp==1000,m.Hp)
  end)
 end)
 spawnMonster("hellhound","P3_sweep_hit",me+Vector2(2.5,2),function(m)
  m.MaxHp=1000 m.Hp=1000
  fire(me+Vector2(0,2),function(shot)
   shot:OnUpdate(0.1)
   ck("fast projectile cannot skip enemy",m.Hp<1000 and not isvalid(shot),m.Hp)
   ck("nonpiercing hits once",m.Hp>=980,m.Hp)
  end)
 end)
 for _,id in ipairs({"hellhound","fallenimp"}) do
  spawnMonster(id,"P3_health_"..id,me+Vector2(5,2),function(m)
   local dmg=atk:CalcDamage(p,m.Entity,"player.basic")
   ck("early "..id.." requires three basic hits",math.ceil(m.MaxHp/dmg)>=3,math.ceil(m.MaxHp/dmg))
   ck("model health "..id,m.BaseHp==_GameData:GetMonsterStats(m.SourceId).hp,m.BaseHp)
  end)
 end
 spawnMonster("hellhound","P3_windup",me+Vector2(4,0),function(m)
  local attack=m.Entity:GetComponent("script.MonsterAttack")
  attack.Enable=true attack.CooldownTimer=999
  local uent=_SpawnService:SpawnByModelId(_GameConst.ModelShadowUnit,"P3_training_shadow",Vector3(me.x+4.6,me.y,0),map)
  table.insert(fixtures,uent)
  _Util:AfterSpawn(uent,"script.ShadowUnit",function(unit)
   unit:Setup(p,"p3fixture",0,1000,"","",Vector2(4.6,0))
   unit.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+10
   uent.KinematicbodyComponent:SetWorldPosition(me+Vector2(4.6,0))
   attack:BeginAttack(uent)
   ck("monster enters attack animation",m.Entity.StateComponent.CurrentStateName=="ATTACK",m.Entity.StateComponent.CurrentStateName)
   ck("windup deals no immediate damage",unit.Hp==1000,unit.Hp)
   _TimerService:SetTimerOnce(function() uent.KinematicbodyComponent:SetWorldPosition(me+Vector2(4.6,2)) end,0.1)
   _TimerService:SetTimerOnce(function() ck("moving during windup dodges melee",unit.Hp==1000,unit.Hp) end,0.3)
   _TimerService:SetTimerOnce(function()
    uent.KinematicbodyComponent:SetWorldPosition(me+Vector2(4.6,0))
    _TimerService:SetTimerOnce(function() attack:BeginAttack(uent) end,0.05)
   end,0.5)
   _TimerService:SetTimerOnce(function() ck("stationary target hit after windup",unit.Hp<1000,unit.Hp) end,0.8)
   _TimerService:SetTimerOnce(function()
    local hp=unit.Hp
    attack:BeginAttack(uent) m:Status():Stagger()
    _TimerService:SetTimerOnce(function() ck("stagger interrupts prepared attack",unit.Hp==hp,unit.Hp) end,0.3)
   end,1)
  end,nil)
 end)

end,1)
