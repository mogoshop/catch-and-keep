local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P4FX] FAIL missing player") return end
local ck=function(n,ok,v) if ok then log("[VRF-P4FX] PASS "..n.." "..tostring(v)) else log_error("[VRF-P4FX] FAIL "..n.." "..tostring(v)) end end
local sv=p:GetComponent("script.PlayerSave") local old=sv.IsLoadSuccess sv.IsLoadSuccess=false
local ids={} for _,r in ipairs(_UndeadSystem:ListOf(p)) do ids[r.id]=true end
local soul=nil
_TimerService:SetTimerOnce(function()
 local remove={} for _,r in ipairs(_UndeadSystem:ListOf(p)) do if not ids[r.id] then table.insert(remove,r.id) end end
 for _,id in ipairs(remove) do _UndeadSystem:Remove(p,id) end
 if isvalid(soul) then soul:Destroy() end sv.IsLoadSuccess=old log("[VRF-P4FX] restored player")
end,5)
local map=p.CurrentMap local pos=_Util:Pos2(p)+Vector2(-1,0)
local rings=function() local n=0 for _,e in ipairs(map.Children) do if e.Name=="SummonRitual" then n=n+1 end end return n end
local before=rings()
local reject=_UndeadSystem:Raise(p,"skeleton",1,pos+Vector2(100,100),nil,nil)
ck("failed summon has no ritual",not reject and rings()==before,rings())
soul=_SpawnService:SpawnByModelId(_GameConst.ModelSoulOrb,"P4FX_soul",Vector3(pos.x,pos.y,0),map)
_Util:AfterSpawn(soul,"script.SoulOrb",function(orb)
 local m=_GameData:GetMonsterStats("skel_warrior") orb:Setup(p.PlayerComponent.UserId,"skel_warrior",1,"normal",1,"",m.stand,m.move)
 local done=false
 _UndeadSystem:Raise(p,"skeleton",20,_Util:Pos2(soul),function(ok) done=ok end,nil)
 _TimerService:SetTimerOnce(function() ck("successful summon shows ritual",done and rings()==before+1,rings()) end,0.15)
 _TimerService:SetTimerOnce(function() ck("ritual expires",rings()==before,rings()) end,1)
end,nil)
