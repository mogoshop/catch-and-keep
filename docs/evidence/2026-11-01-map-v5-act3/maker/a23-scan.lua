local M={{"oasis",{{0,-10}}},{"dunes",{{-31,-1},{30,1},{16,12}}},{"canyon",{{-34,3},{33,0},{15,-14}}},{"stormwaste",{{-34,-3},{33,0},{14,15}}},{"sunkenroad",{{-34,0},{33,6},{-9,-16}}},{"scorpnest1",{{-29,1},{28,1}}},{"scorpnest2",{{28,0},{-24,-6}}},{"drywell",{{-29,-1},{24,3}}},{"kingtomb1",{{-29,1},{28,1}}},{"kingtomb2",{{-29,1},{24,10}}},{"archive",{{-29,0},{25,-8}}},{"vipernest",{{28,0},{-25,-4}}},{"temple1",{{-29,1},{28,1},{1,-13}}},{"temple2",{{-29,1},{28,1}}},{"temple3",{{-29,1},{28,1}}},{"sanctum",{{-29,1},{26,-7}}},{"harbor",{{0,-10}}},{"saltflat",{{-31,2},{30,-2},{14,14}}},{"wreckcoast",{{-34,-4},{33,4},{16,14}}},{"stormcliff",{{-34,6},{33,-2},{-14,-15}}},{"drownedvillage",{{-34,0},{33,2},{15,14}}},{"crabcave1",{{28,1},{-29,1}}},{"crabcave2",{{-29,1},{23,7}}},{"wreckhold",{{-29,1},{24,5}}},{"smuggler1",{{28,1},{-29,1}}},{"smuggler2",{{28,1},{-25,10}}},{"seachapel",{{28,0},{-26,-8}}},{"keeperhouse",{{28,-1},{-25,3}}},{"lighthouse1",{{28,1},{-29,1},{12,-8}}},{"lighthouse2",{{28,0},{-29,0}}},{"lighthouse3",{{28,1},{-29,1}}},{"stormeye",{{28,0},{-27,8}}}}
local function cnt(map)
  local c={Art=0,Top=0,Prop=0,Torch=0,WP=0}
  for _,e in ipairs(map.Children:ToTable()) do local n=e.Name
    if string.sub(n,1,3)=="Art" then c.Art=c.Art+1 if string.sub(n,-3)=="Top" then c.Top=c.Top+1 end if string.sub(n,1,7)=="ArtProp" then c.Prop=c.Prop+1 end end
    if string.find(n,"Torch") then c.Torch=c.Torch+1 end
    if string.lower(string.sub(n,1,8))=="waypoint" then c.WP=c.WP+1 end
  end return c end
for _,m in ipairs(M) do
  local map=_EntityService:GetEntityByPath("/maps/"..m[1])
  if map==nil then log("[VRF] MK a23 "..m[1].." map=nil") else
    local c=cnt(map)
    local tm=map:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
    local open={} local n=0
    for _,v in ipairs(tm:GetAllTilePositions():ToTable()) do local t=tm:GetTile(v.x,v.y) if t~=nil and not t.IsCollidable then open[v.x..","..v.y]=true n=n+1 end end
    local P=m[2] local s0=P[1]
    local dist={} local q={s0} local h=1 local reach=0
    if s0~=nil and open[s0[1]..","..s0[2]] then dist[s0[1]..","..s0[2]]=0 else q={} end
    while h<=#q do local c0=q[h] h=h+1 reach=reach+1 local d=dist[c0[1]..","..c0[2]]
      for _,dd in ipairs({{1,0},{-1,0},{0,1},{0,-1}}) do local k=(c0[1]+dd[1])..","..(c0[2]+dd[2]) if open[k] and dist[k]==nil then dist[k]=d+1 table.insert(q,{c0[1]+dd[1],c0[2]+dd[2]}) end end end
    local ps="" for i=2,#P do ps=ps..tostring(dist[P[i][1]..","..P[i][2]]).." " end
    local p1=s0 and (open[s0[1]..","..s0[2]] and "open" or "BLOCK") or "none"
    log(string.format("[VRF] MK a23 %s Art=%d Top=%d Prop=%d Torch=%d WP=%d open=%d reach=%d p1=%s steps=%s",m[1],c.Art,c.Top,c.Prop,c.Torch,c.WP,n,reach,p1,ps))
  end
  wait(0.05)
end
log("[VRF] MK a23 done")