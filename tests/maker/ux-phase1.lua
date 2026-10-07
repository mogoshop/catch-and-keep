-- Maker MCP server_main 회귀 검사. 단독 테스트 세션에서 실행; 6초 후 원래 캐릭터 상태 복구.
local p = _UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P1] FAIL missing player") return end
local st=p:GetComponent("script.PlayerStats")
local bk=p:GetComponent("script.SkillBook")
local fx=p:GetComponent("script.SkillEffects")
local sv=p:GetComponent("script.PlayerSave")
local atk=p:GetComponent("script.PlayerAttack")
local travel=p:GetComponent("script.PlayerTravel")
local inv=p:GetComponent("script.PlayerInventory")
local shadow=p:GetComponent("script.ShadowOwner")
local oldBag,oldEquip,oldStorage=inv.Bag,inv.Equip,shadow.Storage
local old={mana=st.Mana,levels=bk.Levels,slots=bk.Slots,right=bk.RightSkill,ready=bk.ReadyAt,len=bk.CdLen,digest=bk.CdDigest,save=sv.IsLoadSuccess,map=p.CurrentMap.Name,pos=_Util:Pos2(p),dir=p.PlayerControllerComponent.LookDirectionX}
local spawned={}
local check=function(n,ok,v) if ok then log("[VRF-P1] PASS "..n.." "..tostring(v)) else log_error("[VRF-P1] FAIL "..n.." "..tostring(v)) end end
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function()
 for _,e in ipairs(spawned) do if isvalid(e) then e:Destroy() end end
 travel:Go(old.map,old.pos)
 inv.Bag=oldBag inv.Equip=oldEquip shadow.Storage=oldStorage inv:RefreshDigest() inv:ApplyEquipment()
 st.Mana=old.mana bk.Levels=old.levels bk.Slots=old.slots bk.RightSkill=old.right bk.ReadyAt=old.ready bk.CdLen=old.len bk.CdDigest=old.digest bk:RefreshDigest()
 p.PlayerControllerComponent.LookDirectionX=old.dir sv.IsLoadSuccess=old.save
 log("[VRF-P1] restored player")
end,6)
bk.Levels={}
local encOk,raw=pcall(function() return _HttpService:JSONEncode(bk:GetSaveData()) end)
check("empty skill book encodes",encOk,raw)
if encOk then bk:LoadSaveData(_HttpService:JSONDecode(raw)) check("empty skill book loads",next(bk.Levels)==nil,bk:GetLevel("bone_shard")) end
inv.Bag={} inv.Equip={} shadow.Storage={}
local saved=sv:Collect()
local invRaw=saved.Inv and _HttpService:JSONDecode(saved.Inv)
local shRaw=saved.Shadow and _HttpService:JSONDecode(saved.Shadow)
check("empty bag equipment serialize",invRaw~=nil and invRaw.inv.bagCount==0 and invRaw.inv.equipCount==0,invRaw~=nil)
check("empty shadow storage serializes",shRaw~=nil and shRaw.shadow.shadowCount==0,shRaw~=nil)
if invRaw and invRaw.inv then inv:LoadSaveData(invRaw.inv) end
check("empty inventory roundtrip",next(inv.Bag)==nil and next(inv.Equip)==nil,next(inv.Equip))
inv.Bag=oldBag inv.Equip=oldEquip shadow.Storage=oldStorage inv:RefreshDigest() inv:ApplyEquipment()

check("all save sections present",saved.Char~=nil and saved.Inv~=nil and saved.Shadow~=nil,saved.Char~=nil)
bk.Levels={bone_shard=1,corpse_blast=1,soul_drain=1,mark_weakness=1,enfeeble=1,raise_skeleton=1}
bk.ReadyAt={} bk.CdLen={} bk.CdDigest="" bk:RefreshDigest()
travel:Go("map01",Vector2(-19,9))
_TimerService:SetTimerOnce(function()
 local me=_Util:Pos2(p)
 for _,id in ipairs({"corpse_blast","soul_drain","mark_weakness","enfeeble"}) do
  local mana=st.Mana
  local accepted=bk:Cast(id,me+Vector2(100,100))
  check("failure preserves cost "..id,not accepted and st.Mana==mana and bk.ReadyAt[id]==nil,st.Mana)
 end
 bk.PendingCasts.raise_skeleton=true bk.PendingMana=6
 bk:CancelPending()
 check("cancel releases reservations",next(bk.PendingCasts)==nil and bk.PendingMana==0,bk.PendingMana)
 local soul=_SpawnService:SpawnByModelId(_GameConst.ModelSoulOrb,"P1_reject_soul",Vector3(me.x-1,me.y,0),p.CurrentMap)
 table.insert(spawned,soul)
 _Util:AfterSpawn(soul,"script.SoulOrb",function(orb)
  local info=_GameData:GetMonsterStats("skel_warrior")
  orb:Setup(p.PlayerComponent.UserId,"skel_warrior",1,"normal",1,"",info.stand,info.move)
  local result=nil
  _UndeadSystem:Raise(p,"skeleton",1,_Util:Pos2(soul),function(ok) result=ok end,function() return false end)
  _TimerService:SetTimerOnce(function() check("rejected commit releases soul",result==false and not orb.Reserved and not orb.Consumed,result) end,0.2)
 end,nil)
 local mana=st.Mana
 local accepted=bk:Cast("bone_shard",me+Vector2(-5,0))
 _TimerService:SetTimerOnce(function()
  check("ready projectile costs once",accepted and st.Mana==mana-4 and bk.PendingMana==0,st.Mana)
 end,0.15)
 local dummy=_SpawnService:SpawnByModelId("hellhound","P1_cancel_attack",Vector3(me.x+0.6,me.y,0),p.CurrentMap)
 table.insert(spawned,dummy)
 _Util:AfterSpawn(dummy,"script.Monster",function(m)
  m.MaxHp=1000 m.Hp=1000 m.RespawnDelay=-1 dummy.AIChaseComponent.Enable=false dummy.MovementComponent.InputSpeed=0 dummy:GetComponent("script.MonsterAttack").Enable=false
  atk:DoAttack() atk:CancelAttack()
  _TimerService:SetTimerOnce(function() check("cancelled windup does no damage",m.Hp==1000,m.Hp) end,0.2)
 end,nil)
 _TimerService:SetTimerOnce(function()
  local map=p.CurrentMap
  fx:PoisonMist(me+Vector2(0,-3),6)
  fx:BoneStorm(1)
  check("effects active before travel",next(fx.MistTimers)~=nil and fx.StormTimer~=0,fx.StormTimer)
  travel:GoTown()
  check("travel clears effect timers",next(fx.MistTimers)==nil and fx.StormTimer==0,fx.StormTimer)
  local count=0
  for _,comp in ipairs(map:GetChildComponentsByTypeName("script.Projectile",true)) do if comp.Owner==p and isvalid(comp.Entity) then count=count+1 end end
  check("travel removes owned projectiles",count==0,count)
 end,0.5)
end,1)
