-- 11-04 아군 외곽선 · 준비 스크립트 (서버 인스턴스). 그림자 「보관」까지만 스크립트, 소환은 실제 Z 키 · 이동은 방향키
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
for i=1,5 do local e=_SpawnService:SpawnByModelId('hellhound','LANE_F'..i,Vector3(me.x+0.6+0.3*i,me.y,0),map) table.insert(fod,e) end
wait(1)
for _,e in ipairs(fod) do if isvalid(e) then local m=e:GetComponent('script.Monster') if m then m:TakeDamage(1e9,p) end end wait(0.1) end
wait(1.5)
local raised,sh=0,0
local sc=p:GetComponent('script.ShadowCommander') local o=sc:Owner()
for _,c in ipairs(map:GetChildComponentsByTypeName('script.SoulOrb',true)) do
  if c.OwnerUserId==uid and not c.Consumed then
    local pos=_Util:Pos2(c.Entity)
    if sh<3 then
      local id=o:AddShadow(c.SourceId,c.Grade,5,c.Variant,c.StandRUID,c.MoveRUID)
      if id~=nil then sh=sh+1 end
      _EntityService:Destroy(c.Entity)
    elseif raised<2 then
      if _UndeadSystem:Raise(p,'skeleton',10,pos,nil,nil) then raised=raised+1 end
      wait(0.7)
    end
  end
end
local st=p:GetComponent('script.PlayerStats') if st then st.Mana=st.MaxMana or st.Mana end
log(string.format('[VRF] F setup stored=%d skel=%d me=%.2f,%.2f',sh,raised,me.x,me.y))
