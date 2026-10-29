-- fix3 lifecycle fixture (mock only, NOT an engine run). Usage: lua lifecycle-fixture.lua <candidate S10 file> [more files...]
-- The code under test (inflowStates … finish, and begin) is cut byte-for-byte out of the candidate file, then run against
-- harness/spawner-port.lua (a plain-Lua port of the MonsterSpawner members it touches) with a fake clock.
local here = arg[0]:match('^(.*)/[^/]*$') or '.'
package.path = here .. '/?.lua;' .. package.path
local port = require('spawner-port')

local function slurp(p) local f = assert(io.open(p, 'rb')) local s = f:read('a') f:close() return s end
local function cut(src)
  local a = assert(src:find('local inflowStates = {}\n', 1, true), 'inflowStates marker')
  local b = assert(src:find('collection.stop = finish\n', a, true), 'collection.stop marker')
  local c = assert(src:find('local function begin()\n', b, true), 'begin marker')
  local d = assert(src:find('\nend\n', c, true), 'begin end marker')
  return src:sub(a, b - 1), src:sub(c, d + 4)
end

local files = { ... }
assert(#files >= 1, 'usage: lua lifecycle-fixture.lua <file> [...]')
local segA, segB = cut(slurp(files[1]))
for i = 2, #files do
  local a2, b2 = cut(slurp(files[i]))
  assert(a2 == segA and b2 == segB, 'segment differs from first file: ' .. files[i])
  print('SAME SEGMENT ' .. files[i])
end
print('SEGMENT lines=' .. select(2, (segA .. segB):gsub('\n', '')) .. ' from ' .. files[1])

local HEADER = [[
local ctx = ...
local CFG, isvalid, log, log_warning, log_error = ctx.CFG, ctx.isvalid, ctx.log, ctx.log_warning, ctx.log_error
local metadata, liveTargets, liveUnits = ctx.metadata, ctx.liveTargets, ctx.liveUnits
local _Telemetry, _TimerService, collection, timers = ctx.tel, ctx.T, ctx.collection, ctx.timers
local function beginUnsafe(...) return ctx.beginUnsafe(...) end -- dynamic: tests may replace ctx.beginUnsafe after load (C2-NARROW-FIXTURE-01)
local S = ctx.S
local finished = false
]]
local FOOTER = '\nreturn { pause = pauseArenaInflow, restore = restoreArenaInflow, finish = finish, begin = begin }\n'
local chunk = HEADER .. segA .. segB .. FOOTER

local pass, total = 0, 0
local function check(ok, msg)
  total = total + 1
  if not ok then error('FAIL ' .. msg, 2) end
  pass = pass + 1
  print('PASS ' .. msg)
end

local function make(o)
  o = o or {}
  local T = port.timers()
  local map = { valid = true, players = { { x = -3, y = 1 } }, monsters = {} }
  local logs = {}
  local lg = function(t) table.insert(logs, t) end
  local orig = o.noTables and nil or { port.pack(-27, 1, 3, 'a'), port.pack(25, 1, 3, 'f') }
  local queue = o.noTables and nil or (o.queue or {})
  local sp = port.spawner(map, T, { pending = (o.nilPending and nil) or orig, queue = queue, spawnedAt = o.spawnedAt, inflowOn = o.inflowOn, clearMode = o.clearMode, rootEntity = o.rootEntity, startQueueError = o.startQueueError })
  if o.nilPending then sp.PendingPacks = nil end
  if o.rootEntity then map.CurrentMap = nil end
  local child = o.child and port.spawner(map, T, { pending = { port.pack(0, -12, 3, 'b') }, queue = {}, spawnedAt = 43, inflowOn = true }) or nil
  function map:GetComponent(kind) if kind == 'script.MonsterSpawner' and o.rootComponent then return sp end return nil end
  function map:GetChildComponentsByTypeName(kind)
    if kind ~= 'script.MonsterSpawner' then return {} end
    if o.rootComponent then return child and { sp, child } or { sp } end
    return child and { sp, child } or { sp }
  end
  local tel = { DpsOn = false, Dps = nil, DpsFlushLineCap = 500 }
  local collection = { entities = {}, run = 5 }
  tel.DpsCollection = collection
  local ctxTimers = {}
  local ctx = {
    CFG = { level = o.level or 15, scene = o.scene or 'narrow' },
    S = { map = o.map or 'kingtomb1' },
    isvalid = function(e) return type(e) == 'table' and e.valid ~= false end,
    log = lg, log_warning = function(t) lg('WARN ' .. t) end, log_error = function(t) lg('ERR ' .. t) end,
    metadata = function() return ' label=fixture run=5' end,
    liveTargets = function() return 0 end, liveUnits = function() return 0 end,
    tel = tel, T = T, collection = collection, timers = ctxTimers,
    beginUnsafe = function() error('unset') end,
  }
  local api = assert(load(chunk, '=candidate-segment', 't', _ENV))(ctx)
  local c = { T = T, map = map, sp = sp, child = child, orig = orig, queue = queue, tel = tel, logs = logs, ctx = ctx, api = api }
  c.pause = function() api.pause(map) end
  c.finish = function(r) api.finish(r) end
  c.last = function(prefix) for i = #logs, 1, -1 do if logs[i]:find(prefix, 1, true) then return logs[i] end end return '' end
  return c
end

-- 1) all finish reasons: hold → restore (same generation) → idempotent second finish
for _, reason in ipairs({ 'cleared', 'player_dead', 'left_map', 'player_left', 'observation_stopped', 'manual', 'replaced', 'timeout', 'duration', 'target_setup_timeout', 'travel_failed_after_pause' }) do
  local c = make({ child = true, inflowOn = true })
  local origRef, queueRef, origCount = c.sp.PendingPacks, c.sp.SpawnQueue, c.sp:PendingCount()
  c.pause()
  check(c.sp.PendingPacks ~= origRef and #c.sp.PendingPacks == 0 and c.sp.SpawnQueue ~= queueRef and #c.sp.SpawnQueue == 0 and c.sp.ClearMode == false and c.sp.InflowOn == false, 'hold installs empty stand-ins + ClearMode false + InflowOn false · ' .. reason)
  check(#origRef == 2 and #origRef[1].list == 3 and #origRef[2].list == 3, 'original pending tables are not mutated by the hold · ' .. reason)
  check(c.child.ClearMode == false and #c.child.PendingPacks == 0, 'child spawner of the same map also held · ' .. reason)
  c.finish(reason)
  check(c.sp.PendingPacks == origRef and c.sp.SpawnQueue == queueRef and c.sp.ClearMode == true and c.sp.InflowOn == true and c.sp:PendingCount() == origCount, 'restore puts back the exact original references · ' .. reason)
  check(c.child.ClearMode == true and #c.child.PendingPacks == 1 and c.child.InflowOn == true, 'child restored · ' .. reason)
  check(c.tel.DpsCollection == nil, 'collection ownership released · ' .. reason)
  c.finish('second')
  check(c.sp.PendingPacks == origRef and c.sp.ClearMode == true and select(2, table.concat(c.logs, '\n'):gsub('inflow restore', '')) == 1, 'second finish is a no-op (one restore line) · ' .. reason)
end

-- 2) during the hold: player standing next to a pending pack → WakeTick wakes nothing
do
  local c = make()
  c.pause()
  c.map.players[1] = { x = -26, y = 1 }   -- 1 unit from pack 'a'
  for _ = 1, 20 do c.T:advance(0.5) c.sp:WakeTick() end
  check(c.sp.spawned == 0 and c.sp.wakeEvents == 0, 'WakeTick during hold: 0 wake events, 0 spawns even with a pack 1 unit away')
  c.finish('timeout')
  c.sp:WakeTick()
  check(c.sp.wakeEvents == 1, 'after restore the game wakes that pack again (normal behaviour resumes)')
end

-- 3) NARROW-PRE-CLEAR-SIDE-EFFECT: arena emptied (alive 0) during hold → no clear-empty WakeAll, no floor-clear reward/MapCleared
do
  local c = make()
  c.T:advance(5)
  c.sp.SpawnedAt = 1
  c.sp.Total = 16
  c.pause()
  c.map.monsters = {}            -- arenaClear removed every live native mob
  for _ = 1, 10 do c.T:advance(1) c.sp:Poll() end
  check(c.sp.wakeAlls == 0 and c.sp.spawned == 0 and c.sp.rewards == 0 and c.sp.mapClearedEvents == 0 and c.sp.Cleared == false, 'hold: Poll with alive=0 issues no WakeAll, no spawn, no reward, no MapCleared')
  -- control A: same situation without the hold (non-narrow scene keeps only InflowOn) → clear-empty WakeAll spawns into the map
  local k = make({ scene = 'boss' })
  k.T:advance(5) k.sp.SpawnedAt = 1 k.sp.Total = 16
  k.pause()
  k.map.monsters = {}
  k.sp:Poll()
  check(k.sp.wakeAlls == 1 and k.sp.spawned == 6, 'control A (no hold): Poll with alive=0 + 6 pending → clear-empty WakeAll spawns 6')
  -- control B: tables emptied but ClearMode left on → Poll grants floor clear (why ClearMode is held as well)
  local z = make({ scene = 'boss' })
  z.T:advance(5) z.sp.SpawnedAt = 1 z.sp.Total = 16
  z.pause()
  z.sp.PendingPacks, z.sp.SpawnQueue = {}, {}
  z.map.monsters = {}
  z.sp:Poll()
  check(z.sp.rewards == 1 and z.sp.Cleared == true, 'control B (tables emptied, ClearMode on): Poll grants floor clear → ClearMode hold is required')
  -- after restore with one native leftover alive: the game counts live+pending again, nothing fires
  c.map.monsters = { { Name = 'leftover', IsDead = false, Entity = { valid = true } } }
  c.finish('cleared')
  c.T:advance(1) c.sp:Poll()
  check(c.sp.rewards == 0 and c.sp.wakeAlls == 0 and c.sp.Remaining == 7, 'after restore normal accounting resumes (Remaining = 1 live + 6 pending)')
end

-- 3b) game-source observation (port of Poll 365-402, outside fix3): clear-empty WakeAll with pending <= spawnBatch(8)
--     spawns synchronously (StartQueue → RunQueue), so PendingCount() is 0 and the same Poll grants the floor clear.
do
  local c = make({ scene = 'boss' })
  c.T:advance(5) c.sp.SpawnedAt = 1 c.sp.Total = 16
  c.sp.PendingPacks = { port.pack(-27, 1, 3, 'a') }
  c.map.monsters = {}
  c.sp:Poll()
  print(string.format('OBSERVATION port Poll: wakeAll=%d spawned=%d rewards=%d cleared=%s (live spawned this tick, alive was counted before WakeAll)', c.sp.wakeAlls, c.sp.spawned, c.sp.rewards, tostring(c.sp.Cleared)))
  check(c.sp.wakeAlls == 1 and c.sp.spawned == 3 and c.sp.rewards == 1, 'observation reproduced in port: WakeAll(3 pending) + floor clear in the same Poll')
end

-- 4) NARROW-PRE-QUEUE-RESUME: queue still draining at pause → timer stops itself on the stand-in; restore resumes via StartQueue, one timer
do
  local jobs = {}
  for i = 1, 20 do jobs[i] = { id = 'q' .. i, p = { x = 0, y = 0 } } end
  local c = make({ queue = jobs })
  c.sp:StartQueue()                              -- game started draining: 8 spawned, 12 left, timer on
  local spawned0, timer0 = c.sp.spawned, c.sp.SpawnQueueTimer
  check(spawned0 == 8 and timer0 ~= 0 and #jobs == 12, 'setup: queue draining with a live timer (8 spawned, 12 queued)')
  c.pause()
  c.T:advance(1)
  check(c.sp.spawned == spawned0 and c.sp.SpawnQueueTimer == 0 and c.T.list[timer0] == nil and #jobs == 12, 'hold: running RunQueue sees the empty stand-in and stops its own timer; no spawn; saved 12 jobs intact')
  local created = c.T.created
  c.finish('timeout')
  check(c.sp.SpawnQueue == jobs and c.sp.SpawnQueueTimer ~= 0 and c.T.created == created + 1 and c.T.list[timer0] == nil, 'restore: saved queue back + exactly one new timer via StartQueue (old id not revived)')
  c.T:advance(1)
  check(c.sp.spawned == 20 and c.sp.SpawnQueueTimer == 0, 'resumed queue drains all 12 remaining jobs, then stops')
  check(c.last('inflow restore'):find('queue_resumed=1', 1, true) ~= nil, 'restore log reports queue_resumed=1')
end

-- 5) restore in the same tick as pause (timer not yet stopped) → no duplicate timer
do
  local jobs = {}
  for i = 1, 20 do jobs[i] = { id = 'q' .. i, p = { x = 0, y = 0 } } end
  local c = make({ queue = jobs })
  c.sp:StartQueue()
  local timer0, created = c.sp.SpawnQueueTimer, c.T.created
  c.pause()
  c.finish('begin_failed')                       -- same tick: the old timer is still registered
  check(c.sp.SpawnQueue == jobs and c.sp.SpawnQueueTimer == timer0 and c.T.created == created, 'same-tick restore: StartQueue sees the live timer and adds none')
  c.T:advance(1)
  check(c.sp.spawned == 20, 'the original timer drains the restored queue')
end

-- 6) NARROW-PRE-REFERENCE-OWNERSHIP: new generation / foreign tables are never overwritten
do
  local c = make()
  c.pause()
  c.sp:Sleep()                                   -- map emptied & slept during the hold
  c.finish('left_map')
  check(c.sp.PendingPacks == nil and c.sp.SpawnQueue == nil and c.sp.SpawnedAt == 0, 'Sleep during hold: restore skips (generation 0 kept, tables stay nil)')
  check(c.last('inflow restore'):find('wake_restored=0 wake_skipped=2', 1, true) ~= nil, 'restore log shows wake_skipped=2')
  local d = make()
  d.pause()
  d.T:advance(10) d.sp:SpawnAll()                -- new generation during the hold
  local newP, newQ = d.sp.PendingPacks, d.sp.SpawnQueue
  d.finish('replaced')
  check(d.sp.PendingPacks == newP and d.sp.SpawnQueue == newQ and d.sp.ClearMode == true and d.sp.SpawnedAt == 10, 'SpawnAll during hold: new generation tables/ClearMode untouched')
  local e = make()
  e.pause()
  local foreign = { port.pack(1, 1, 2, 'x') }
  e.sp.PendingPacks = foreign                    -- someone else installed a table (same generation)
  e.finish('manual')
  check(e.sp.PendingPacks == foreign and #e.sp.SpawnQueue == 0 and e.sp.SpawnQueue == e.queue, 'foreign PendingPacks kept; our SpawnQueue stand-in still restored independently')
  local f = make()
  f.pause()
  table.insert(f.sp.SpawnQueue, { id = 'late', p = { x = 0, y = 0 } })   -- our stand-in was written into
  f.finish('manual')
  check(f.sp.SpawnQueue[1].id == 'late' and f.sp.PendingPacks == f.orig, 'non-empty stand-in is not overwritten (logged as skipped); pending still restored')
  local g = make({ clearMode = true })
  g.pause()
  g.sp.ClearMode = true                          -- someone re-enabled it
  g.finish('manual')
  check(g.sp.ClearMode == true and g.last('inflow restore'):find('clear_restored=0', 1, true) ~= nil, 'ClearMode re-set by others is left alone (clear_restored=0)')
end

-- 7) PendingPacks == nil with a valid generation; unspawned spawner (SpawnedAt 0) is not held
do
  local c = make({ nilPending = true })
  c.pause()
  c.sp:WakeTick() c.T:advance(3) c.sp:Poll()
  check(#c.sp.PendingPacks == 0 and c.sp.wakeEvents == 0, 'nil PendingPacks: stand-in installed, WakeTick/Poll run without error')
  c.finish('timeout')
  check(c.sp.PendingPacks == nil, 'nil PendingPacks restored as nil')
  local u = make({ spawnedAt = 0 })
  local p0, q0 = u.sp.PendingPacks, u.sp.SpawnQueue
  u.pause()
  check(u.sp.PendingPacks == p0 and u.sp.SpawnQueue == q0 and u.sp.ClearMode == true and u.sp.InflowOn == false, 'SpawnedAt 0: no table/ClearMode hold (only the existing InflowOn pause)')
  check(u.last('inflow pause'):find('wake_held=0', 1, true) ~= nil and u.last('inflow pause'):find('unspawned=1', 1, true) ~= nil, 'pause log reports wake_held=0 unspawned=1')
  u.finish('manual')
end

-- 8) map-root spawner (Entity == map, CurrentMap nil) + map:GetComponent root path
do
  local c = make({ rootEntity = true, rootComponent = true, inflowOn = true })
  local o = c.sp.PendingPacks
  c.pause()
  check(#c.sp.PendingPacks == 0 and c.sp.ClearMode == false, 'root spawner held')
  c.finish('manual')
  check(c.sp.PendingPacks == o and c.sp.ClearMode == true and c.sp.InflowOn == true, 'root spawner (Entity == map, CurrentMap nil) restored')
end

-- 9) non-narrow scene: behaviour identical to accepted 0500 InflowOn-only pause
do
  local c = make({ scene = 'horde', inflowOn = true })
  local o, q = c.sp.PendingPacks, c.sp.SpawnQueue
  c.pause()
  check(c.sp.PendingPacks == o and c.sp.SpawnQueue == q and c.sp.ClearMode == true and c.sp.InflowOn == false, 'non-narrow: only InflowOn paused (tables/ClearMode untouched)')
  check(c.last('inflow pause'):find('spawners=1', 1, true) ~= nil and c.last('inflow pause'):find('wake_held', 1, true) == nil, 'non-narrow pause log unchanged (no wake fields)')
  c.finish('timeout')
  check(c.sp.InflowOn == true and c.last('inflow restore'):sub(-21) == ' restored=1 skipped=0', 'non-narrow restore log unchanged: ends with restored=1 skipped=0')
end

-- 9b) C2-NARROW-SCOPE-01 (Codex 0625): only Lv15 kingtomb1 narrow holds; Lv5 cellar1 / Lv30 smuggler1 narrow behave like 0500
for _, case in ipairs({ { level = 5, map = 'cellar1' }, { level = 30, map = 'smuggler1' }, { level = 15, map = 'canyon' } }) do
  local c = make({ scene = 'narrow', level = case.level, map = case.map, inflowOn = true })
  local o, q = c.sp.PendingPacks, c.sp.SpawnQueue
  c.pause()
  check(c.sp.PendingPacks == o and c.sp.SpawnQueue == q and c.sp.ClearMode == true and c.sp.InflowOn == false and c.last('inflow pause'):find('wake_held', 1, true) == nil, 'scope: narrow Lv' .. case.level .. ' ' .. case.map .. ' → InflowOn-only pause (no table/ClearMode hold)')
  c.finish('timeout')
  check(c.sp.InflowOn == true and c.last('inflow restore'):sub(-21) == ' restored=1 skipped=0', 'scope: narrow Lv' .. case.level .. ' ' .. case.map .. ' restore log unchanged')
end

-- 10) begin error after pause; export failure; StartQueue failure — restore still completes
do
  local c = make()
  local o = c.sp.PendingPacks
  local heldSeen = false
  c.ctx.beginUnsafe = function() c.api.pause(c.map) heldSeen = c.sp.PendingPacks ~= o and #c.sp.PendingPacks == 0 and c.sp.ClearMode == false error('injected setup failure') end
  c.api.begin()
  check(heldSeen and c.last('inflow pause'):find('wake_held=1', 1, true) ~= nil and c.last('ERR'):find('injected setup failure', 1, true) ~= nil, 'begin error case: pause really happened (stand-in + ClearMode false seen, pause log wake_held=1) before the injected error')
  check(c.sp.PendingPacks == o and c.sp.ClearMode == true and c.tel.DpsCollection == nil, 'begin error after pause → finish(begin_failed) restores')
  local e = make()
  e.pause()
  e.tel.DpsOn = true e.tel.Dps = { run = 5 }
  function e.tel:DpsFinish() error('injected export failure') end
  function e.tel:DpsStop() self.DpsOn = false end
  e.finish('manual')
  check(e.sp.PendingPacks == e.orig and e.sp.ClearMode == true and e.tel.DpsFlushLineCap == 500 and e.tel.DpsOn == false, 'export failure happens after restoration')
  local jobs = { { id = 'q1', p = { x = 0, y = 0 } } }
  local s = make({ queue = jobs, startQueueError = true })
  s.pause()
  s.finish('manual')
  check(s.sp.SpawnQueue == jobs and s.sp.ClearMode == true and s.last('WARN'):find('spawn queue resume failed', 1, true) ~= nil and s.last('[DPS-RUN] end'):find('reason=manual', 1, true) ~= nil, 'StartQueue error is caught (warning), finish continues to its end line')
end

-- 11) geometry arithmetic for coords-fix3 (same serial formula as spawnPacks): distances from player (-3,1)
do
  local function ring(cx)
    local mn, mx = 1e9, -1
    for serial = 1, 8 do
      local ang = serial * 2.399
      local r = 1 * math.sqrt(serial / math.max(1, 4))
      local x, y = cx + math.cos(ang) * r, 1 + math.sin(ang) * r
      local d = math.sqrt((x + 3) ^ 2 + (y - 1) ^ 2)
      mn, mx = math.min(mn, d), math.max(mx, d)
    end
    return mn, mx
  end
  local a, b = ring(8)
  local c, d = ring(1)
  print(string.format('GEOMETRY centre8 %.3f..%.3f  centre1 %.3f..%.3f', a, b, c, d))
  check(math.abs(a - 10.016) < 0.001 and math.abs(b - 12.341) < 0.001 and math.abs(c - 3.019) < 0.001 and math.abs(d - 5.353) < 0.001 and d < 5.5, 'coords-fix3 arithmetic matches Codex 0618/0620 (all 8 within 5.5)')
end

print(string.format('TOTAL %d/%d passed (mock lifecycle — not an engine run)', pass, total))
