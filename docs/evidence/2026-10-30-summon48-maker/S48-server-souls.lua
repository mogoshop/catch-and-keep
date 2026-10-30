-- S48 server: 플레이어 오른쪽에 몬스터 n마리를 세우고 플레이어 공격으로 처치해 내 혼을 만든다 (혼 준비용 · 시험 대상 아님)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local map=p.CurrentMap local me=_Util:Pos2(p)
local ms={}
for i=1,3 do local e=_SpawnService:SpawnByModelId('hellhound','S48_s'..i..'_'..math.floor(_UtilLogic.ElapsedSeconds),Vector3(me.x+1.0+0.5*i,me.y,0),map) table.insert(ms,e) end
wait(1)
for _,e in ipairs(ms) do if isvalid(e) then local m=e:GetComponent('script.Monster') if m~=nil then m:ApplyLevel(5,false) wait(0.2) m:TakeDamage(999999,p) end end end
local function roster() local t={} for _,r in ipairs(_UndeadSystem:ListOf(p)) do table.insert(t,(r.kind or '?')..':'..(r.form or '')) end return table.concat(t,',') end
log('[VRF] S48 souls ready · roster='..roster())
