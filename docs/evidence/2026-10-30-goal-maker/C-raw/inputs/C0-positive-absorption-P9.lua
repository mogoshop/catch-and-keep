-- Proposal only; root review and sole Maker scheduling required. Not executed.
-- Existing C0 missing boundary only. Direct HP-application probe, NOT a natural boss ritual or physical attack.
-- Use server_main after the current C run/collection has ended, before final backup restore.
-- Replace both placeholders with this actual test player's uid and the actual unique Play capture origin.
local CFG = { uid = '20372100010779593', capture_origin = 'GOAL-MAKER-INT-P9-20261030T0551' }
if CFG.uid == 'SET_TEST_UID' or CFG.capture_origin == 'SET_UNIQUE_CAPTURE_ORIGIN' or CFG.capture_origin == '' then
  log('[C0-ABSORB] refused placeholders') return
end
if _Telemetry.DpsOn or _Telemetry.Dps ~= nil or _Telemetry.DpsCollection ~= nil then
  log('[C0-ABSORB] refused active observation/collection') return
end
local p = nil
local count = 0
for _, u in pairs(_UserService.UserEntities) do
  count = count + 1
  if isvalid(u) and isvalid(u.PlayerComponent) and u.PlayerComponent.UserId == CFG.uid then p = u end
end
if count ~= 1 or not isvalid(p) or not isvalid(p.CurrentMap) then
  log('[C0-ABSORB] refused player context') return
end
local save = p:GetComponent('script.PlayerSave')
if save == nil or save.IsLoadSuccess ~= false or p.PlayerComponent:IsDead() then
  log('[C0-ABSORB] refused not existing SaveOff live test player') return
end
local map = p.CurrentMap
local previousFilter = _Telemetry.DpsFilter
local e = nil
local run = nil
local deadline = 0
local done = false
local collection = {}
local function finish(reason)
  if done then return end
  done = true
  if deadline ~= 0 then _TimerService:ClearTimer(deadline) deadline = 0 end
  if _Telemetry.DpsCollection == collection then _Telemetry.DpsCollection = nil end
  if run ~= nil and _Telemetry.DpsOn and _Telemetry.Dps ~= nil and _Telemetry.Dps.run == run then
    _Telemetry:DpsFinish(100)
    _Telemetry.DpsFilter = previousFilter
  end
  if isvalid(e) then e:Destroy() end
  log('[C0-ABSORB] end origin=' .. CFG.capture_origin .. ' run=' .. tostring(run) .. ' reason=' .. reason .. ' owned_target_removed=true')
end
collection.stop = finish
_Telemetry.DpsCollection = collection
-- This is the existing C0 model/position pattern; no original enemy or player build is changed.
local me = _Util:Pos2(p)
e = _SpawnService:SpawnByModelId('hellhound', 'C05_absorb_probe', Vector3(me.x + 2, me.y, 0), map)
deadline = _TimerService:SetTimerOnce(function() finish('ready_timeout') end, 8)
_Util:AfterSpawn(e, 'script.Monster', function(m)
  if done then return end
  if _Telemetry.DpsCollection ~= collection or _Telemetry.DpsOn or _Telemetry.Dps ~= nil then finish('ownership_changed') return end
  if not isvalid(p) or p.CurrentMap ~= map or p.PlayerComponent:IsDead() or save.IsLoadSuccess ~= false then finish('context_changed') return end
  if not isvalid(e) or m.IsDead or m.Hp <= 0 or m.RiteShield ~= 0 then finish('target_not_ready') return end
  m.RespawnDelay = -1
  _Telemetry.DpsFilter = 'C05_absorb_probe'
  _Telemetry:DpsStart('C0-positive-absorption')
  run = _Telemetry.DpsRunId
  local before = m.Hp
  -- Prepared state on this newly owned disposable target only; RiteAbsorb/game code is unchanged.
  -- Full absorption means no HP loss, death/reward, or PlayerDealtDamage growth event.
  m.RiteShield = 1
  log('[C0-ABSORB] begin origin=' .. CFG.capture_origin .. ' run=' .. tostring(run) .. ' uid=' .. CFG.uid .. ' direct_method=ApplyHpDamage prepared_shield=1 raw=1 hp=' .. tostring(before))
  m:ApplyHpDamage(1, p, 'tick.c0_absorb_probe')
  log('[C0-ABSORB] result hp_before=' .. tostring(before) .. ' hp_after=' .. tostring(m.Hp) .. ' shield_after=' .. tostring(m.RiteShield) .. ' expected_absorbed=1 expected_effective=0')
  finish('probe_complete')
end, function() finish('spawn_failed') end)
