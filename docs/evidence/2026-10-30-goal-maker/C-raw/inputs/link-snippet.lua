local p = nil
for _, u in pairs(_UserService.UserEntities) do p = u break end
_Telemetry.DpsFilter = 'C05_'
_Telemetry:DpsStart('link')
local me = _Util:Pos2(p)
local e = _SpawnService:SpawnByModelId('hellhound', 'C05_link', Vector3(me.x + 2, me.y, 0), p.CurrentMap)
_Util:AfterSpawn(e, 'script.Monster', function(m) m.RespawnDelay = -1 m:ApplyLevel(5, false) end, nil)
local linkRun = _Telemetry.DpsRunId
_Telemetry.DpsCollection = { stop = function(reason)
  if _Telemetry.DpsOn and _Telemetry.Dps ~= nil and _Telemetry.Dps.run == linkRun then _Telemetry:DpsFinish(4000) end
  if isvalid(e) then e:Destroy() end
end }
log('[DPS-RUN] link spawned — 기본 공격·스킬·소환으로 몇 대 친 뒤 [S90]')
