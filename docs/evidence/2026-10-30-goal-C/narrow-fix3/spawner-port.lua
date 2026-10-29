-- Plain-Lua port of the MonsterSpawner members the fix3 hold touches (RootDesk/MyDesk/Monster/MonsterSpawner.mlua, sha256 085e328e…).
-- Mock only: no engine. Line refs: PendingCount 93-98 · WakeTick 115-130 · WakePacks 133-151 · WakeAll 154-166 · QueuePack 169-172 ·
-- StartQueue 175-180 · Poll clear block 365-402 · Sleep 438-474 (queue/generation part) · SpawnAll 559-716 (generation part) · RunQueue 719-734 · StopQueue 737-740.
-- spawnWakeRadius = 18 · spawnWakeEverySec = 0.5 · spawnBatch = 8 (data/config.csv 352·353·274). Poll rewards are counted, not granted.
local M = {}

function M.timers()
  local T = { now = 0, list = {}, id = 0, created = 0, cleared = 0 }
  function T:SetTimerRepeat(fn, sec) self.id = self.id + 1 self.created = self.created + 1 self.list[self.id] = { fn = fn, every = sec, next = self.now + sec, rep = true } return self.id end
  function T:SetTimerOnce(fn, sec) self.id = self.id + 1 self.created = self.created + 1 self.list[self.id] = { fn = fn, every = sec, next = self.now + sec, rep = false } return self.id end
  function T:ClearTimer(id) if self.list[id] then self.cleared = self.cleared + 1 end self.list[id] = nil end
  function T:live() local n = 0 for _ in pairs(self.list) do n = n + 1 end return n end
  function T:advance(sec)
    local stop = self.now + sec
    while true do
      local bestId, best = nil, nil
      for id, t in pairs(self.list) do if t.next <= stop and (best == nil or t.next < best.next or (t.next == best.next and id < bestId)) then bestId, best = id, t end end
      if best == nil then break end
      self.now = best.next
      if best.rep then best.next = best.next + best.every else self.list[bestId] = nil end
      best.fn()
    end
    self.now = stop
  end
  return T
end

local function dist(a, b) local dx, dy = a.x - b.x, a.y - b.y return math.sqrt(dx * dx + dy * dy) end
M.dist = dist

-- map: { players = { {x,y} }, monsters = { {Name, IsDead, Horde, Entity={valid}} } }
function M.spawner(map, T, o)
  o = o or {}
  local sp = { SpawnedAt = o.spawnedAt or 42, InflowOn = o.inflowOn == true, ClearMode = o.clearMode ~= false, Cleared = false, Total = o.total or 0, Remaining = 0,
    PendingPacks = o.pending, SpawnQueue = o.queue, SpawnQueueTimer = 0, Dormant = false, rewards = 0, mapClearedEvents = 0, wakeAlls = 0, spawned = 0, wakeEvents = 0 }
  sp.Entity = o.rootEntity and map or { valid = true, CurrentMap = map }
  function sp:PendingCount()
    local n = 0
    for _, pack in ipairs(self.PendingPacks or {}) do n = n + #pack.list end
    return n + #(self.SpawnQueue or {})
  end
  function sp:WakeTick()
    if self.SpawnedAt <= 0 or self.Dormant then return end
    if #map.players == 0 then return end
    if self.PendingPacks ~= nil and #self.PendingPacks > 0 then self:WakePacks(map.players, true) end
  end
  function sp:WakePacks(players, start)
    local keep, woke = {}, 0
    for _, pack in ipairs(self.PendingPacks or {}) do
      local best = 999
      for _, p in ipairs(players) do best = math.min(best, dist(p, pack.center)) end
      if best <= 18 then self:QueuePack(pack) woke = woke + #pack.list self.wakeEvents = self.wakeEvents + 1 else table.insert(keep, pack) end
    end
    self.PendingPacks = keep
    if woke > 0 and start then self:StartQueue() end
    return woke
  end
  function sp:WakeAll(why)
    local n = 0
    for _, pack in ipairs(self.PendingPacks or {}) do self:QueuePack(pack) n = n + #pack.list end
    self.PendingPacks = {}
    if n > 0 then self:StartQueue() self.wakeAlls = self.wakeAlls + 1 end
  end
  function sp:QueuePack(pack)
    if self.SpawnQueue == nil then self.SpawnQueue = {} end
    for _, job in ipairs(pack.list) do table.insert(self.SpawnQueue, job) end
  end
  function sp:StartQueue()
    if o.startQueueError then error('injected StartQueue failure') end
    if self.SpawnQueueTimer ~= 0 or self.SpawnQueue == nil or #self.SpawnQueue == 0 then return end
    self:RunQueue()
    if #self.SpawnQueue > 0 then self.SpawnQueueTimer = T:SetTimerRepeat(function() self:RunQueue() end, 0.05) end
  end
  function sp:RunQueue()
    if self.SpawnQueue == nil then self:StopQueue() return end
    local n = 0
    while #self.SpawnQueue > 0 and n < 8 do
      local job = table.remove(self.SpawnQueue, 1)
      if map.spawnNative then map.spawnNative(job) else table.insert(map.monsters, { Name = job.id, IsDead = false, Entity = { valid = true }, native = true }) end
      self.spawned = self.spawned + 1
      n = n + 1
    end
    if #self.SpawnQueue == 0 then self:StopQueue() end
  end
  function sp:StopQueue()
    if self.SpawnQueueTimer ~= 0 then T:ClearTimer(self.SpawnQueueTimer) end
    self.SpawnQueueTimer = 0
  end
  function sp:Poll()
    -- clear block only (365-402): rewards/MapCleared are counted here instead of granted
    if self.SpawnedAt <= 0 then return end
    if self.ClearMode and T.now - self.SpawnedAt > 2 then
      local alive = 0
      for _, m in ipairs(map.monsters) do if (map.isLive and map.isLive(m) or (not map.isLive and m.Entity.valid and not m.IsDead)) and not m.Horde then alive = alive + 1 end end
      if alive == 0 and #(self.SpawnQueue or {}) == 0 and self.PendingPacks ~= nil and #self.PendingPacks > 0 then self:WakeAll('clear-empty') end
      alive = alive + self:PendingCount()
      self.Total = math.max(self.Total, alive)
      self.Remaining = alive
      if alive == 0 and self.Total > 0 and not self.Cleared then
        self.Cleared = true
        self.rewards = self.rewards + 1
        self.mapClearedEvents = self.mapClearedEvents + 1
      end
    end
  end
  function sp:Sleep()
    self:StopQueue()
    self.PendingPacks = nil
    self.SpawnQueue = nil
    self.SpawnedAt = 0
    self.Dormant = true
  end
  function sp:SpawnAll()
    self.Dormant = false
    self:StopQueue()
    self.SpawnQueue = {}
    self.PendingPacks = {}
    self.ClearMode = true
    self.Cleared = false
    self.Total = 0
    self.SpawnedAt = T.now
  end
  return sp
end

function M.pack(cx, cy, n, tag)
  local list = {}
  for i = 1, n do list[i] = { id = (tag or 'native') .. i, p = { x = cx, y = cy } } end
  return { center = { x = cx, y = cy }, list = list }
end

return M
