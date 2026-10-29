-- 메이커 장면 스크립트(S10) 대역 실행: 엔진 서비스만 흉내 내 nil·오타·흐름 오류를 잡는다 (게임 동작 시험 아님 · node tools/dps/maker-blocks.cjs --dryrun <lua>)
local logs = {}
function log(t) print('LOG ', t) end
function log_warning(t) print('WARN ', t) end
function log_error(t) print('ERR ', t) end
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
local timers, tid = {}, 0
_TimerService = {
  SetTimerOnce = function(_, fn, t) tid = tid + 1 timers[tid] = { fn = fn, rep = false, t = t } return tid end,
  SetTimerRepeat = function(_, fn, t) tid = tid + 1 timers[tid] = { fn = fn, rep = true, t = t } return tid end,
  ClearTimer = function(_, id) timers[id] = nil end }
_UtilLogic = { ElapsedSeconds = 0 }
local function ent(name)
  local e = { Name = name, comps = {}, Children = {} }
  e.GetComponent = function(self, k) return self.comps[k] end
  e.Destroy = function(self) self.destroyed = true end
  return e
end
local map = ent('gallows')
local mons, units, orbs = {}, {}, {}
map.GetChildComponentsByTypeName = function(_, k)
  if k == 'script.Monster' then return mons end
  if k == 'script.ShadowUnit' then return units end
  return {}
end
local p = ent('player')
p.PlayerComponent = { UserId = 'u1', Hp = 100, MaxHp = 100 }
p.CurrentMap = map
p.pos = Vector2(0, 0)
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
_SpawnService = { SpawnByModelId = function(_, id, name, pos, parent)
  local e = ent(name)
  e.pos = Vector2(pos.x, pos.y)
  if id == 'soulorb' then
    e.comp = { Entity = e, Setup = function() end }
    table.insert(orbs, e.comp)
  else
    local m = { Entity = e, IsDead = false, MaxHp = 100, Hp = 100, ApplyLevel = function() end, IsCursed = function() return false end }
    e.comp = m
    table.insert(mons, m)
  end
  return e
end }
_Telemetry = { DpsOn = false, Dps = nil, DpsRunId = 0, DpsCollection = nil, DpsRawCap = 4000, DpsGapSec = 3, DpsFlushLineCap = 2000,
  DpsStart = function(self, l) self.DpsRunId=self.DpsRunId+1 self.Dps={run=self.DpsRunId,stopped=false} self.DpsOn = true print('START ', l) end,
  DpsFinish = function(self, n) self.DpsOn = false self.Dps=nil print('FINISH ', n, self.DpsFlushLineCap) end,
  DpsStop = function(self) self.DpsOn=false self.Dps=nil end,
  DpsCollectionStop = function(self, reason) local c=self.DpsCollection self.DpsCollection=nil if c and c.stop then c.stop(reason) end end }
local chunk = assert(loadfile(arg[1]))
chunk()
-- 타이머 돌리기: 시간 0.1초씩 200초
for step = 1, 2000 do
  _UtilLogic.ElapsedSeconds = step * 0.1
  local ids = {}
  for id in pairs(timers) do ids[#ids + 1] = id end
  for _, id in ipairs(ids) do
    local t = timers[id]
    if t then
    t.next = t.next or t.t
    if _UtilLogic.ElapsedSeconds >= t.next then
      if t.rep then t.next = t.next + t.t else timers[id] = nil end
      t.fn()
    end
    end
  end
  if step == 300 then for _, m in ipairs(mons) do m.IsDead = true end end
end
print('DRY OK')
