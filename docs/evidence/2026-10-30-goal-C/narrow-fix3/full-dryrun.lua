-- Whole-S10 dry run of one fix3 TEMPLATE (mock only, NOT an engine run). Usage: lua full-dryrun.lua <fix3 TEMPLATE> <leftover|allclear>
-- Based on tools/dps/maker-dryrun.lua (same engine stand-ins) + harness/spawner-port.lua for the kingtomb1 MonsterSpawner
-- (Poll every 1 s, WakeTick every 0.5 s, ClearMode on, one pending pack of 3 far away). The template's placeholder capture_origin
-- is replaced in memory by 'OFFLINE-FIXTURE' (the guard would otherwise stop the run); the file on disk is not changed.
local here = arg[0]:match('^(.*)/[^/]*$') or '.'
package.path = here .. '/?.lua;' .. package.path
local port = require('spawner-port')
local variant = arg[2] or 'leftover'

local out = {}
local function say(kind, t) print(kind .. ' ' .. t) table.insert(out, kind .. ' ' .. t) end
function log(t) say('LOG', t) end
function log_warning(t) say('WARN', t) end
function log_error(t) say('ERR', t) end
function isvalid(x) return x ~= nil and not (type(x) == 'table' and x.destroyed) end
local VM = {}
VM.__index = VM
VM.__sub = function(a, b) return setmetatable({ x = a.x - b.x, y = a.y - b.y }, VM) end
VM.__add = function(a, b) return setmetatable({ x = a.x + b.x, y = a.y + b.y }, VM) end
VM.__mul = function(a, k) return setmetatable({ x = a.x * k, y = a.y * k }, VM) end
function VM:Magnitude() return math.sqrt(self.x * self.x + self.y * self.y) end
function VM:Normalize() local m = self:Magnitude() return setmetatable({ x = self.x / m, y = self.y / m }, VM) end
function Vector2(x, y) return setmetatable({ x = x, y = y }, VM) end
function Vector3(x, y, z) return { x = x, y = y, z = z } end
local T = port.timers()
_TimerService = T
_UtilLogic = { ElapsedSeconds = 0 }
local function ent(name, x, y)
  local e = { Name = name, comps = {}, Children = {}, pos = Vector2(x or 0, y or 0) }
  e.GetComponent = function(self, k) return self.comps[k] end
  e.Destroy = function(self) self.destroyed = true end
  return e
end
local map = ent('kingtomb1')
local mons, units, orbs = {}, {}, {}
local view = { players = { { x = -3, y = 1 } }, monsters = mons }
view.isLive = function(m) return isvalid(m.Entity) and not m.IsDead end
view.spawnNative = function(job)
  local e = ent(job.id, job.p.x, job.p.y)
  table.insert(mons, { Entity = e, IsDead = false })
end
local sp = port.spawner(view, T, { pending = { port.pack(25, 1, 3, 'f') }, queue = {}, spawnedAt = 0.5, inflowOn = false })
sp.Entity = { valid = true, CurrentMap = map }
-- native mobs already awake at arrival: 5 inside the 16-radius arena around (1,1); 'leftover' adds 3 outside it (room a, x≈-26)
for i, xy in ipairs({ { -5, 2 }, { -1, 0 }, { 4, 1 }, { 9, 2 }, { 12, 0 } }) do table.insert(mons, { Entity = ent('templeguard' .. i, xy[1], xy[2]), IsDead = false }) end
if variant == 'leftover' then for i = 1, 3 do table.insert(mons, { Entity = ent('mummy_a' .. i, -26, i - 1), IsDead = false }) end end
sp.Total = #mons + 3
map.GetComponent = function(self, k) return nil end
map.GetChildComponentsByTypeName = function(_, k)
  if k == 'script.Monster' then return mons end
  if k == 'script.ShadowUnit' then return units end
  if k == 'script.MonsterSpawner' then return { sp } end
  return {}
end
local p = ent('player', -3, 1)
p.PlayerComponent = { UserId = 'u1', Hp = 100, MaxHp = 100 }
p.CurrentMap = map
local slots = {}
p.comps['script.PlayerStats'] = { Level = 1, Mana = 10, MaxMana = 50, BoneArmor = 0,
  HasFirstKill = function() return false end, MarkFirstKill = function() end, Recalculate = function() end }
p.comps['script.SkillBook'] = { Levels = {}, Slots = ',,,',
  SetSlot = function(self, i, id) slots[i] = id self.Slots = table.concat({ slots[1] or '', slots[2] or '', slots[3] or '', slots[4] or '' }, ',') end,
  RefreshDigest = function() end, GetPowerLevel = function(_, id) return 3 end,
  Cast = function(_, id, pos) assert(pos ~= nil, 'nil target ') return true end }
p.comps['script.PlayerInventory'] = { RefreshDigest = function() end, ApplyEquipment = function() end }
p.comps['script.PlayerSave'] = { IsLoadSuccess = true }
p.comps['script.PlayerTravel'] = { Go = function(_, m, pos) map.Name = m end }
p.comps['script.PlayerAttack'] = { RequestBasicAttack = function() end }
_UserService = { UserEntities = { u1 = p } }
_UndeadSystem = { DismissAll = function() end, MaxFor = function() return 3 end, FindUsableSoul = function() return orbs[1] end }
_Util = { Pos2 = function(_, e) return e.pos or Vector2(1, 1) end, IsAlive = function() return true end,
  AfterSpawn = function(_, e, k, ok, fail) ok(e.comp) end }
_GameConst = { ModelSoulOrb = 'soulorb', BaseMapName = function(_, n) return n end }
_GameData = { GetMonsterStats = function() return { stand = 'a', move = 'b' } end }
local targetsSeen = {}
_SpawnService = { SpawnByModelId = function(_, id, name, pos, parent)
  assert(parent == map, 'spawn parent must be the map')
  local e = ent(name, pos.x, pos.y)
  if id == 'soulorb' then
    e.comp = { Entity = e, Setup = function() end }
    table.insert(orbs, e.comp)
  else
    local m = { Entity = e, IsDead = false, MaxHp = 100, Hp = 100, ApplyLevel = function() end, IsCursed = function() return false end }
    e.comp = m
    table.insert(mons, m)
    table.insert(targetsSeen, string.format('%s(%.2f,%.2f)', name, pos.x, pos.y))
  end
  return e
end }
_Telemetry = { DpsOn = false, Dps = nil, DpsRunId = 0, DpsCollection = nil, DpsRawCap = 4000, DpsGapSec = 3, DpsFlushLineCap = 2000,
  DpsStart = function(self, l) self.DpsRunId = self.DpsRunId + 1 self.Dps = { run = self.DpsRunId, stopped = false } self.DpsOn = true end,
  DpsFinish = function(self, n) self.DpsOn = false self.Dps = nil end,
  DpsStop = function(self) self.DpsOn = false self.Dps = nil end,
  DpsCollectionStop = function(self, reason) local c = self.DpsCollection self.DpsCollection = nil if c and c.stop then c.stop(reason) end end }

-- the spawner's own timers (MonsterSpawner.OnBeginPlay: Poll 1 s · WakeTick spawnWakeEverySec 0.5 s)
local inScene, sceneRewards, sceneWakeAll, sceneWake, sceneSpawn = false, 0, 0, 0, 0
T:SetTimerRepeat(function() sp:Poll() end, 1)
T:SetTimerRepeat(function() sp:WakeTick() end, 0.5)

local f = assert(io.open(arg[1], 'rb')) local src = f:read('a') f:close()
local n
src, n = src:gsub("capture_origin = 'SET_UNIQUE_CAPTURE_ORIGIN' }", "capture_origin = 'OFFLINE-FIXTURE' }", 1)
assert(n == 1, 'CFG line not found')
assert(load(src, '=' .. arg[1], 't'))()
for step = 1, 2000 do
  T:advance(0.1)
  _UtilLogic.ElapsedSeconds = T.now
  local collecting = _Telemetry.DpsCollection ~= nil and _Telemetry.DpsOn
  if collecting and not inScene then inScene = true sceneRewards, sceneWakeAll, sceneWake, sceneSpawn = sp.rewards, sp.wakeAlls, sp.wakeEvents, sp.spawned end
  if inScene and not collecting then
    inScene = false
    sceneRewards, sceneWakeAll, sceneWake, sceneSpawn = sp.rewards - sceneRewards, sp.wakeAlls - sceneWakeAll, sp.wakeEvents - sceneWake, sp.spawned - sceneSpawn
    say('SCENE', string.format('during collection: rewards=%d wakeAll=%d wakeEvents=%d nativeSpawned=%d', sceneRewards, sceneWakeAll, sceneWake, sceneSpawn))
  end
  if step == 300 then for _, m in ipairs(mons) do if m.Entity.Name:sub(1, 4) == 'C05_' then m.IsDead = true end end end
end
say('TARGETS', table.concat(targetsSeen, ' '))
local maxd = 0
for _, t in ipairs(targetsSeen) do local x, y = t:match('%(([%-%d.]+),([%-%d.]+)%)') maxd = math.max(maxd, math.sqrt((x + 3) ^ 2 + (y - 1) ^ 2)) end
say('AFTER', string.format('variant=%s ClearMode=%s pending=%d queueTimer=%d rewardsTotal=%d wakeAllTotal=%d nativeSpawnedTotal=%d maxTargetDist=%.3f',
  variant, tostring(sp.ClearMode), sp:PendingCount(), sp.SpawnQueueTimer, sp.rewards, sp.wakeAlls, sp.spawned, maxd))
local all = table.concat(out, '\n')
assert(all:find('inflow pause', 1, true) and all:find('wake_held=1 packs=1 jobs=3 unspawned=0', 1, true), 'pause line')
assert(all:find('wake_restored=2 wake_skipped=0 queue_resumed=0 clear_restored=1', 1, true), 'restore line')
assert(sceneRewards == 0 and sceneWakeAll == 0 and sceneWake == 0 and sceneSpawn == 0, 'no native wake/spawn/reward during collection')
assert(not all:find('\nERR ', 1, true) and not all:find('^ERR ', 1), 'no ERR lines')
assert(maxd < 5.5, 'targets within 5.5 of the player')
print('DRY OK ' .. arg[1] .. ' ' .. variant)
