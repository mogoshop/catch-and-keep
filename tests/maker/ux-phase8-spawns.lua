local pass,fail=0,0
local ck=function(n,ok,v) if ok then pass=pass+1 log("[VRF-P8-SPAWN] PASS "..n.." "..tostring(v)) else fail=fail+1 log_error("[VRF-P8-SPAWN] FAIL "..n.." "..tostring(v)) end end
local p=_UserService:GetUsersByMapName("town")[1] if not isvalid(p) then return end
local sv=p:GetComponent("script.PlayerSave") local loaded=sv.IsLoadSuccess sv.IsLoadSuccess=false
local tr=p:GetComponent("script.PlayerTravel") local oldmap=p.CurrentMap.Name local oldpos=_Util:Pos2(p) local hp=p.PlayerComponent.Hp local mana=p:GetComponent("script.PlayerStats").Mana
local visits={}
for base,info in pairs(_GameData.MapInfo) do local d=_GameData:GetMapSpawns(base) if d~=nil and d.entries~="" then for _,suffix in ipairs({"","_nm","_hell"}) do table.insert(visits,{base=base,info=info,suffix=suffix}) end end end
table.sort(visits,function(a,b) return a.base..a.suffix<b.base..b.suffix end)
local index=0 local nextMap=function() end
nextMap=function()
 index=index+1
 if index>#visits then
  tr:Go(oldmap,oldpos) p.PlayerComponent.Hp=hp p:GetComponent("script.PlayerStats").Mana=mana sv.IsLoadSuccess=loaded
  log("[VRF-P8-SPAWN] restored player; total "..tostring(pass).." passed / "..tostring(fail).." failed") return
 end
 local visit=visits[index] local base=visit.base local info=visit.info local suffix=visit.suffix
 local x,y=0,0 for _,f in ipairs(info.features) do if f.kind=="portal" then x=f.x+(f.x<0 and 1.4 or -1.4) y=f.y break end end
 tr:Go(base..suffix,Vector2(x,y))
 _TimerService:SetTimerOnce(function()
 local map=p.CurrentMap
 ck(base..suffix.." activated",map.Name==base..suffix,map.Name)
  local sp=map:GetFirstChildComponentByTypeName("script.MonsterSpawner",true)
  if sp~=nil then
   local count=0 local invalid=0 local stuck=0 local tiles=map:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
   for _,m in ipairs(map:GetChildComponentsByTypeName("script.Monster",true)) do
    if not m.Unique then
     count=count+1 local p=m.SpawnPosition
     for _,f in ipairs(info.features) do if f.kind=="portal" or f.kind=="waypoint" then local radius=f.kind=="portal" and 6 or 5.5 if (p-Vector2(f.x,f.y)):Magnitude()<radius-0.01 then invalid=invalid+1 end end end
     if tiles~=nil and _Util:TileBlocked(tiles.Entity,p) then stuck=stuck+1 end
    end
   end
   local expected=0 for _,n,_ in string.gmatch(sp.Entries,"([%w_]+):(%d+):(%d+)") do expected=expected+tonumber(n) end
   ck(base..suffix.." pack count",count==expected,tostring(count).."/"..tostring(expected))
   ck(base..suffix.." clear entrances",invalid==0,invalid)
   ck(base..suffix.." walkable spawns",stuck==0,stuck)
  end
 nextMap()
 end,2)
end
nextMap()
