local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
p:GetComponent("script.PlayerSave").IsLoadSuccess=false
p.PlayerComponent.MaxHp=999999 p.PlayerComponent.Hp=999999
p:GetComponent("script.PlayerTravel"):Go("wasteland", Vector2(5.97,1.61))
wait(6)
local map=p.CurrentMap local me=_Util:Pos2(p) local uid=p.PlayerComponent.UserId
local b=p:GetComponent('script.SkillBook') b.Levels.raise_skeleton=10 b.Levels.shadow_summon=5 b.Levels=b.Levels
local q=p:GetComponent('script.PlayerQuest') q.DeployBonus=q.DeployBonus+12
for _,c in ipairs(map:GetChildComponentsByTypeName('script.Monster',true)) do if isvalid(c.Entity) then _EntityService:Destroy(c.Entity) end end
wait(0.5)
local fod={}
for i=1,4 do local e=_SpawnService:SpawnByModelId('hellhound','LANE_F'..i,Vector3(me.x+0.6+0.3*i,me.y,0),map) table.insert(fod,e) end
wait(1)
for _,e in ipairs(fod) do if isvalid(e) then local m=e:GetComponent('script.Monster') if m then m:TakeDamage(1e9,p) end end wait(0.1) end
wait(1.5)
local raised,sh=0,0
local sc=p:GetComponent('script.ShadowCommander') local o=sc:Owner()
for _,c in ipairs(map:GetChildComponentsByTypeName('script.SoulOrb',true)) do
  if c.OwnerUserId==uid and not c.Consumed then
    local pos=_Util:Pos2(c.Entity)
    if sh<2 then
      local id=o:AddShadow(c.SourceId,c.Grade,5,c.Variant,c.StandRUID,c.MoveRUID)
      if id~=nil and sc:Deploy(id) then sh=sh+1 end
      _EntityService:Destroy(c.Entity)
    elseif raised<2 then
      if _UndeadSystem:Raise(p,'skeleton',10,pos,nil,nil) then raised=raised+1 end
      wait(0.7)
    end
  end
end
wait(1)
local kinds={'hellhound','hellhound','hellhound','hellhound','hellhound','fallenimp','fallenimp','fallenimp','fallenimp','hellhound'}
for i,k in ipairs(kinds) do
  local a=i/#kinds*6.283 local e=_SpawnService:SpawnByModelId(k,'LANE_T'..i,Vector3(me.x+math.cos(a)*0.8,me.y+math.sin(a)*0.5,0),map)
  wait(0.1) local m=e and e:GetComponent('script.Monster') if m then m:ApplyLevel(1,false) m.MaxHp=9999999 m.Hp=9999999 end
end
if _G.LANE_C then _TimerService:ClearTimer(_G.LANE_C) end
_G.LANE_C=_TimerService:SetTimerRepeat(function()
  if not isvalid(map) then return end
  for _,c in ipairs(map:GetChildComponentsByTypeName('script.Monster',true)) do
    local e=c.Entity
    if isvalid(e) and string.sub(e.Name,1,6)=='LANE_T' and not c.IsDead and c.Hp<c.MaxHp*0.6 then c.Hp=c.MaxHp end
  end
  for _,u in ipairs(map:GetChildComponentsByTypeName('script.ShadowUnit',true)) do if u.OwnerPlayer==p and u.Hp>0 and u.Hp<u.MaxHp*0.75 then u.Hp=u.MaxHp end end
  p.PlayerComponent.Hp=p.PlayerComponent.MaxHp
end,0.2)
log(string.format('[VRF] B setup shadows=%d skel=%d crowd=%d me=%.2f,%.2f',sh,raised,#kinds,me.x,me.y))
