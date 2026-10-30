-- I06 출현 구역 (10-30): 실제 MonsterSpawner.SpawnAll 본문을 대상 4맵 × 난이도 3 × 시드 200으로 돌려, 구역을 켜도
--   요청 수 = 배치 + 유입 풀 (구역 끔과 같은 배치 수) · 무리 중심이 그 구역 안 · 안전 반경·벽 칸 위 0 · fallback 수를 본다.
--   벽 = 설계도(data/handmade/<id>.txt) 칸 · 입구 = 설계도 표식(W E H X S) · 구역 = data/spawn_zones.csv · 출현 = data/maps.csv
--   깨우기·유입 소환·엔티티 생성·이벤트는 대신한다(대기열만 센다). 실제 엔진의 무리 깨우기·끈 회수·리젠은 메이커 몫
--@pre local V = {} V.__index = V
--@pre V.__add = function(a, b) return setmetatable({ x = a.x + b.x, y = a.y + b.y }, V) end
--@pre V.__sub = function(a, b) return setmetatable({ x = a.x - b.x, y = a.y - b.y }, V) end
--@pre function V:Magnitude() return math.sqrt(self.x * self.x + self.y * self.y) end
--@pre function Vector2(x, y) return setmetatable({ x = x, y = y }, V) end
-- @source MonsterSpawner Monster/MonsterSpawner.mlua SpawnAll,LoadFromData,ZoneMatches,ZoneFor,PickPackCenterIn,RandomPointIn,ClampIn,Clamp,PickPackCenter,RandomPoint,ValidSpawn,BuildSafeZones,EntryDistance,PoolCount,PendingCount,QueuePack,PickEscort
function isvalid(x) return x ~= nil end
local function csv(path)
  local rows, header = {}, nil
  local f = assert(io.open(path, "r")); local text = f:read("a"); f:close()
  local i, n, row, field, q = 1, #text, {}, {}, false
  while i <= n do
    local c = text:sub(i, i)
    if q then
      if c == '"' then if text:sub(i + 1, i + 1) == '"' then table.insert(field, '"') i = i + 1 else q = false end else table.insert(field, c) end
    elseif c == '"' then q = true
    elseif c == "," then table.insert(row, table.concat(field)) field = {}
    elseif c == "\n" then table.insert(row, table.concat(field)) field = {}
      if header == nil then header = row else local r = {} for k, h in ipairs(header) do r[h] = row[k] or "" end table.insert(rows, r) end
      row = {}
    elseif c ~= "\r" then table.insert(field, c) end
    i = i + 1
  end
  return rows
end
local maps, mons, zonesCsv = {}, {}, csv("data/spawn_zones.csv")
for _, r in ipairs(csv("data/maps.csv")) do maps[r.id] = r end
for _, r in ipairs(csv("data/monsters.csv")) do mons[r.id] = r end
local function blueprint(id)
  local walls, rows, w, h = {}, {}, 0, 0
  for line in io.lines("data/handmade/" .. id .. ".txt") do
    if line:sub(1, 1) == ";" then
      local a, b, c = line:match("^;(%S+)%s+(%S+)%s*(%S*)")
      if a == "size" then w, h = tonumber(b), tonumber(c) end
      if a == "wall" then walls[b] = true end
    elseif #line > 0 then table.insert(rows, line) end
  end
  local cells, feats = {}, {}
  for r, row in ipairs(rows) do
    for c = 1, #row do
      local ch = row:sub(c, c)
      local x, y = c - 1 - w // 2, h // 2 - (r - 1)
      cells[x .. "," .. y] = ch
      if ch:match("[WEHXS]") then table.insert(feats, { kind = ch == "S" and "waypoint" or "portal", x = x + 0.5, y = y + 0.5 }) end
    end
  end
  return { w = w, h = h, cells = cells, walls = walls, feats = feats }
end
local cur
_GameConst = {
  BaseMapName = function(_, n) return (string.gsub(n, "_nm$", ""):gsub("_hell$", "")) end,
  DifficultyOfMap = function(_, n) if n:match("_nm$") then return 1 elseif n:match("_hell$") then return 2 end return 0 end,
  ScaleLevel = function(_, lv) return lv end,
  EntrySafeRadius = function() return math.min(8, math.max(6, math.min(cur.w, cur.h) * 0.4)) end,
}
_GameData = { hordeChance = 0.06, packLeaderChance = 0.2, packMixChance = 0.35, packRadius = 1.4, packSpacing = 6, variantChance = 0.02,
  RollVariant = function() return "v" end, RollEliteVariant = function() return "" end,
  SourceOfModel = function(_, id) return mons[id] and mons[id].sourceId or id end,
  GetMonsterStats = function(_, src) for _, m in pairs(mons) do if m.sourceId == src then return { arch = m.archetype, behavior = m.behavior } end end return nil end,
  GetMapInfo = function(_, id) return { kind = maps[id].kind, features = cur.feats, w = cur.w, h = cur.h } end,
}
local useZones = true
_GameData.GetMapSpawns = function(_, id)
  local m = maps[id]
  local w, h = tonumber(m.w), tonumber(m.h)
  local d = { entries = m.spawns, entriesNm = m.spawnsNm, entriesHell = m.spawnsHell, pack = tonumber(m.packSize), elite = tonumber(m.eliteChance) or 0,
    variant = tonumber(m.variantChance) or -1, respawn = tonumber(m.respawnSec), minX = -(w / 2) + 3, maxX = w / 2 - 3, minY = -(h / 2) + 2.5, maxY = h / 2 - 1.5 }
  if useZones then
    for _, z in ipairs(zonesCsv) do
      if z.map == id then
        d.zones = d.zones or {}
        table.insert(d.zones, { name = z.zone, minX = tonumber(z.x0), maxX = tonumber(z.x1), minY = tonumber(z.y0), maxY = tonumber(z.y1), match = z.match, share = tonumber(z.share) })
      end
    end
  end
  return d
end
_UtilLogic = { ElapsedSeconds = 0, RandomDouble = function() return math.random() end, RandomIntegerRange = function(_, lo, hi) return math.random(lo, hi) end }
_Util = { PlayersInMap = function() return {} end, NearestPlayerDistance = function() return 999 end,
  TileBlocked = function(_, _, p) local ch = cur.cells[math.floor(p.x) .. "," .. math.floor(p.y)]; return ch == nil or cur.walls[ch] == true end }
_MapEvents = { Populate = function() end }
_TimerService = { SetTimerRepeat = function() return 0 end, ClearTimer = function() end }
local logs = {}
function log(s) table.insert(logs, s) end
local sp = MonsterSpawner
sp.StopQueue = function() end
sp.RunQueue = function() end
sp.PlaceNamed = function() end
sp.DetectBossMap = function() return false end
sp.WakePacks = function() return 0 end
local function run(id, diff, seed, zonesOn)
  useZones = zonesOn
  math.randomseed(seed)
  local name = id .. (diff == 1 and "_nm" or diff == 2 and "_hell" or "")
  local mapEnt = { Name = name, Id = name,
    GetComponent = function(_, t) if t == "script.MapAmbience" then return { Difficulty = diff } end return nil end,
    GetChildComponentsByTypeName = function() return {} end,
    GetFirstChildComponentByTypeName = function() return { Entity = {} } end }
  sp.Entity = { CurrentMap = mapEnt }
  sp.FixedIds = nil; sp.Dormant = false; sp.EventsDone = true; sp.Zones = nil
  logs = {}
  sp:SpawnAll()
  local jobs = {}
  for _, j in ipairs(sp.SpawnQueue or {}) do table.insert(jobs, j) end
  for _, pk in ipairs(sp.PendingPacks or {}) do for _, j in ipairs(pk.list) do table.insert(jobs, j) end end
  local want = 0
  for c in string.gmatch(sp.Entries, "[%w_]+:(%d+):%d+") do want = want + tonumber(c) end
  local zl
  for _, s in ipairs(logs) do if s:find("spawner zones", 1, true) then zl = s end end
  return jobs, want, sp:PoolCount(), zl, sp.Zones
end
local summary = {}
for _, id in ipairs({ "crypt2", "temple2", "lighthouse1", "demonroad" }) do
  cur = blueprint(id)
  local safeR = math.min(8, math.max(6, math.min(cur.w, cur.h) * 0.4))
  for diff = 0, 2 do
    local agg = { runs = 0, units = 0, inZone = 0, zonedPacks = 0, fallback = 0, bad = 0 }
    for seed = 1, 200 do
      local onJobs, want, pool, zl, onZones = run(id, diff, seed * 7919 + diff, true)
      local offJobs, want2, pool2 = run(id, diff, seed * 7919 + diff, false)
      assert(want == want2 and pool == pool2, id .. ": pool differs")
      assert(#onJobs + pool == want, string.format("%s d%d seed %d: placed %d + pool %d ~= want %d", id, diff, seed, #onJobs, pool, want))
      assert(#onJobs == #offJobs, id .. ": zones changed placed count")
      assert(zl and zl:find("same=true", 1, true), id .. ": zone log " .. tostring(zl))
      agg.zonedPacks = agg.zonedPacks + tonumber(zl:match("zonedPacks=(%d+)"))
      agg.fallback = agg.fallback + tonumber(zl:match("fallback=(%d+)"))
      for _, j in ipairs(onJobs) do
        agg.units = agg.units + 1
        for _, z in ipairs(onZones) do if j.p.x >= z.minX and j.p.x <= z.maxX and j.p.y >= z.minY and j.p.y <= z.maxY then agg.inZone = agg.inZone + 1 break end end
        -- 무리 중심·무리 안 자리 모두 ValidSpawn을 거친다: 벽·입구 안전 반경 위 0
        local ch = cur.cells[math.floor(j.p.x) .. "," .. math.floor(j.p.y)]
        local blocked = ch == nil or cur.walls[ch]
        for _, f in ipairs(cur.feats) do if math.sqrt((j.p.x - f.x) ^ 2 + (j.p.y - f.y) ^ 2) < safeR then blocked = true end end
        if blocked then agg.bad = agg.bad + 1 end
      end
      agg.runs = agg.runs + 1
    end
    assert(agg.bad == 0, id .. ": unit on wall/entry " .. agg.bad)
    table.insert(summary, string.format("%s/%d 구역 무리 %.1f · fallback %.2f · 구역 안 %.0f%%", id, diff, agg.zonedPacks / agg.runs, agg.fallback / agg.runs, 100 * agg.inZone / agg.units))
  end
end
-- 구역 없는 맵은 예전과 같다: Zones nil → ZoneFor nil
sp.Zones = nil; assert(sp:ZoneFor("skelwarrior", {}) == nil)
-- 몫: share 0.35 → 무리 6개 중 2개, share 0.5 → 4개 중 2개 (처음 0.5 반올림)
sp.Zones = { { name = "c", match = "@guard", share = 0.35 } }
local credit, hit = {}, 0
for i = 1, 6 do if sp:ZoneFor("skelwarrior", credit) then hit = hit + 1 end end
assert(hit == 2, "share 0.35 of 6 → " .. hit)
assert(sp:ZoneFor("starvedwraith", {}) == nil, "archetype mismatch")
print("[quality/spawn_zones] I06 구역 선택 4맵×3난이도×200시드: 요청 = 배치 + 풀 · 구역 켬/끔 배치 수 같음 · 벽·입구 위 0 — " .. table.concat(summary, " | "))
