-- ===================================================================== [S10] 장면 실행
local CFG = { level = 15, build = 'magic', scene = 'sustain60', rep = 1, input = 'auto', capture_origin = 'GOAL-MAKER-INT-P9C2-20261030T0604' }   -- maker-blocks.cjs가 채움

-- 같은 레벨 = 같은 장비·같은 투자 총점 (parallel-analysis/combat/fixtures.json 그대로 · 퀘스트 추가 포인트·선택 보상 없음 · 보통 난이도)
local LAMP = 'lamp1|1|1|망자를 부르는 등불|minion=20|2|'
local BUILDS = {
  [5] = {
    weapon = 'staff1|0|5|대조용 일반 지팡이||0|',
    summon = { attr = { 35, 25, 15, 25 }, inv = { raise_skeleton = 3, skel_legion = 1, skeleton_mastery = 1 }, slots = { 'raise_skeleton' } },
    magic = { attr = { 15, 25, 15, 45 }, inv = { bone_shard = 3, shard_bounce = 1, bone_armor = 1 }, slots = { 'bone_shard', 'bone_armor' } },
    curse_mix = { attr = { 25, 25, 15, 35 }, inv = { mark_weakness = 2, bone_shard = 2, raise_skeleton = 1 }, slots = { 'mark_weakness', 'bone_shard', 'raise_skeleton' } },
  },
  [15] = {
    weapon = 'staff12|0|15|대조용 일반 지팡이||0|',
    summon = { attr = { 85, 25, 15, 25 }, inv = { raise_skeleton = 6, skeleton_mastery = 3, skel_legion = 2, raise_mage = 2, mage_legion = 1, bone_shard = 1 }, slots = { 'raise_skeleton', 'raise_mage', 'bone_shard' } },
    magic = { attr = { 15, 25, 15, 95 }, inv = { bone_shard = 8, shard_bounce = 2, shard_multi = 3, bone_armor = 2 }, slots = { 'bone_shard', 'bone_armor' } },
    curse_mix = { attr = { 50, 25, 15, 60 }, inv = { mark_weakness = 5, curse_power = 1, curse_duration = 2, hex_flame = 4, flame_hex = 2, raise_skeleton = 1 }, slots = { 'mark_weakness', 'hex_flame', 'raise_skeleton' } },
  },
  [30] = {
    weapon = 'staff25|0|30|대조용 일반 지팡이||0|',
    summon = { attr = { 160, 25, 15, 25 }, inv = { raise_skeleton = 12, skeleton_mastery = 5, skel_legion = 2, raise_mage = 7, mage_focus = 2, mage_legion = 2 }, slots = { 'raise_skeleton', 'raise_mage' } },
    magic = { attr = { 15, 25, 15, 170 }, inv = { bone_shard = 15, shard_bounce = 2, shard_spike = 3, shard_multi = 3, bone_armor = 4, armor_thick = 3 }, slots = { 'bone_shard', 'bone_armor' } },
    curse_mix = { attr = { 87, 25, 15, 98 }, inv = { mark_weakness = 10, curse_power = 3, curse_duration = 3, hex_flame = 10, flame_hex = 3, raise_skeleton = 1 }, slots = { 'mark_weakness', 'hex_flame', 'raise_skeleton' } },
  },
}

-- 장면: 맵 · 플레이어 자리 · 대상 (모델 id, 수, 자리, 퍼짐) · 제한 시간 · 정예 여부 · 생명 배율(60초 자원만)
-- 좌표 = data/handmade/<맵>.txt 구역 중심 (칸 → 월드: x = c - W/2, y = H/2 - r). 첫 실행에서 화면으로 벽 속이 아닌지 확인하고, 아니면 test-plan의 「좌표 보정」대로 이 표만 고친다
local SCENES = {
  boss = {
    [5] = { map = 'gallows', me = { 6, -3 }, packs = { { 'headsman', 1, { 15, -3 }, 0 } }, seconds = 150 },
    [15] = { map = 'sanctum', me = { 6, 1 }, packs = { { 'highpriest', 1, { 11, 1 }, 0 } }, seconds = 180 },  -- coords-fix1: 18→11 (12칸은 제자리·소환 교전 범위 밖)
    [30] = { map = 'stormeye', me = { -6, 0 }, packs = { { 'admiral', 1, { -18, 0 }, 0 } }, seconds = 180 },
  },
  horde = {
    [5] = { map = 'execution', me = { -16, -2 }, packs = { { 'ashendead', 7, { -7, -2 }, 2.5 }, { 'corpsecrow', 7, { -7, -2 }, 2.5 } }, seconds = 120 },
    [15] = { map = 'canyon', me = { -10, 4 }, packs = { { 'jackal', 6, { -5, 4 }, 2.5 }, { 'sandscorp', 4, { -5, 4 }, 2.5 }, { 'firecultist', 4, { -5, 4 }, 2.5 } }, seconds = 120 },  -- coords-fix1: 0→-5
    [30] = { map = 'lighthouse2', me = { 0, -12 }, packs = { { 'drownedsailor', 6, { 9, -12 }, 2.5 }, { 'stormcaller', 4, { 9, -12 }, 2.5 }, { 'wreckgolem', 4, { 9, -12 }, 2.5 } }, seconds = 120 },
  },
  narrow = {
    [5] = { map = 'cellar1', me = { -3, 0 }, packs = { { 'rotzombie', 4, { 8, 0 }, 1 }, { 'graveworm', 4, { 8, 0 }, 1 } }, seconds = 120 },
    [15] = { map = 'kingtomb1', me = { -3, 1 }, packs = { { 'mummy', 4, { 8, 1 }, 1 }, { 'sandscorp', 4, { 8, 1 }, 1 } }, seconds = 120 },
    [30] = { map = 'smuggler1', me = { 2, 1 }, packs = { { 'drownedsailor', 4, { -9, 1 }, 1 }, { 'stormcaller', 4, { -9, 1 }, 1 } }, seconds = 120 },
  },
  ranged = {
    [5] = { map = 'execution', me = { -16, -2 }, packs = { { 'cultarcher', 5, { -5, -2 }, 3 } }, seconds = 120 },
    [15] = { map = 'canyon', me = { -10, 4 }, packs = { { 'firecultist', 5, { 1, 4 }, 3 } }, seconds = 120 },
    [30] = { map = 'lighthouse2', me = { 0, -12 }, packs = { { 'brinewitch', 3, { 10, -12 }, 3 }, { 'stormcaller', 2, { 10, -12 }, 3 } }, seconds = 120 },
  },
  sustain60 = {
    [5] = { map = 'execution', me = { -16, -2 }, packs = { { 'skelwarrior', 3, { -11, -2 }, 1 } }, seconds = 60, hpMul = 40 },
    [15] = { map = 'canyon', me = { -10, 4 }, packs = { { 'sandscorp', 3, { -5, 4 }, 1 } }, seconds = 60, hpMul = 40 },
    [30] = { map = 'lighthouse2', me = { 0, -12 }, packs = { { 'wreckgolem', 3, { 5, -12 }, 1 } }, seconds = 60, hpMul = 40 },
  },
  wipe = {
    [5] = { map = 'execution', me = { -16, -2 }, packs = { { 'hellhound', 8, { -10, -2 }, 2 } }, seconds = 90, wipe = true },
    [15] = { map = 'canyon', me = { -10, 4 }, packs = { { 'jackal', 8, { -4, 4 }, 2 } }, seconds = 90, wipe = true },
    [30] = { map = 'lighthouse2', me = { 0, -12 }, packs = { { 'stormgulls', 8, { 6, -12 }, 2 } }, seconds = 90, wipe = true },
  },
}

local B = BUILDS[CFG.level] and BUILDS[CFG.level][CFG.build]
local S = SCENES[CFG.scene] and SCENES[CFG.scene][CFG.level]
local label = 'L' .. CFG.level .. '-' .. CFG.build .. '-' .. CFG.scene .. '-r' .. CFG.rep .. '-' .. CFG.input
if B == nil or S == nil then log_error('[DPS-RUN] bad CFG ' .. label) return end
if S.wipe and B.inv.raise_skeleton == nil then log('[DPS-RUN] skip label=' .. label .. ' reason=no-summon-build (전멸 복구는 소환을 쓰는 빌드만)') return end
-- 호스트가 정한 고유 세션 원점을 사용한다. 같은 원점을 다른 Play 세션에 재사용하지 않는다.
local origin = CFG.capture_origin
if type(origin) ~= 'string' or origin == '' or origin == 'SET_UNIQUE_CAPTURE_ORIGIN' or #origin > 80 or string.find(origin, '[^%w_.-]') ~= nil then
  log_error('[DPS-RUN] capture_origin required: maker-blocks.cjs S10 ... --origin <unique-session-id>') return
end
if _Telemetry.DpsCollection ~= nil then _Telemetry:DpsCollectionStop('replaced') end
if _Telemetry.DpsOn then log_error('[DPS-RUN] previous run still on — run [S90] first') return end
local p = nil
for _, u in pairs(_UserService.UserEntities) do p = u break end
if not isvalid(p) then log_error('[DPS-RUN] no player') return end
local uid = p.PlayerComponent.UserId
local st = p:GetComponent('script.PlayerStats')
local bk = p:GetComponent('script.SkillBook')
local inv = p:GetComponent('script.PlayerInventory')
local sv = p:GetComponent('script.PlayerSave')
local travel = p:GetComponent('script.PlayerTravel')
local atk = p:GetComponent('script.PlayerAttack')

local timers = {}
local targets = {}
local startAt = 0
local finished = false
local preWipe = 0
local collection = { timers = timers, targets = targets, entities = {}, run = 0, label = label }
local capture = origin .. '-' .. tostring(_Telemetry.DpsRunId + 1) .. '-' .. tostring(math.floor(_UtilLogic.ElapsedSeconds * 1000))
local rawFile = 'raw/' .. label .. '--' .. capture .. '.log'
local function metadata()
  return ' label=' .. label .. ' run=' .. collection.run .. ' input=' .. CFG.input .. ' capture_origin=' .. origin .. ' capture_id=' .. capture .. ' raw_file=' .. rawFile .. (CFG.device and (' device=' .. CFG.device) or '')
end
local function owns()
  return not finished and _Telemetry.DpsCollection == collection
end
local function observing()
  return owns() and _Telemetry.DpsOn and _Telemetry.Dps ~= nil and _Telemetry.Dps.run == collection.run and not _Telemetry.Dps.stopped
end
local function ownedEntity(e)
  if isvalid(e) then
    if #collection.entities >= 64 then e:Destroy() return false end
    table.insert(collection.entities, e)
    return true
  end
  return false
end

local function liveUnits()
  local n = 0
  if not isvalid(p) or not isvalid(p.CurrentMap) then return 0 end
  for _, c in ipairs(p.CurrentMap:GetChildComponentsByTypeName('script.ShadowUnit', true)) do
    if c.OwnerPlayer == p and not c.Dead and c.Hp > 0 then n = n + 1 end
  end
  return n
end

local function liveTargets()
  local n = 0
  for _, m in ipairs(targets) do if isvalid(m.Entity) and not m.IsDead then n = n + 1 end end
  return n
end

local function nearestTarget()
  local me = _Util:Pos2(p)
  local best, bestD = nil, 1e9
  for _, m in ipairs(targets) do
    if isvalid(m.Entity) and not m.IsDead then
      local d = (_Util:Pos2(m.Entity) - me):Magnitude()
      if d < bestD then best, bestD = m, d end
    end
  end
  return best
end

local inflowStates = {}
local function restoreArenaInflow()
  local saved = inflowStates
  inflowStates = {} -- idempotent: finish/S90/replaced may all converge here
  local restored, skipped = 0, 0
  for _, r in ipairs(saved) do
    local sp = r.spawner
    if isvalid(sp.Entity) and (sp.Entity == r.map or sp.Entity.CurrentMap == r.map) and sp.SpawnedAt == r.spawnedAt then
      -- Do not overwrite a newly established state from another lifecycle.
      if sp.InflowOn == false then sp.InflowOn = r.inflowOn restored = restored + 1
      else skipped = skipped + 1 end
    else skipped = skipped + 1 end
  end
  if #saved > 0 then log('[DPS-RUN] inflow restore' .. metadata() .. ' restored=' .. restored .. ' skipped=' .. skipped) end
end

local function pauseArenaInflow(map)
  local spawners = {}
  local root = map:GetComponent('script.MonsterSpawner')
  if root ~= nil then table.insert(spawners, root) end
  for _, sp in ipairs(map:GetChildComponentsByTypeName('script.MonsterSpawner', true)) do
    if sp ~= root then table.insert(spawners, sp) end
  end
  for _, sp in ipairs(spawners) do
    table.insert(inflowStates, { spawner = sp, map = map, spawnedAt = sp.SpawnedAt, inflowOn = sp.InflowOn })
    sp.InflowOn = false
  end
  log('[DPS-RUN] inflow pause' .. metadata() .. ' spawners=' .. #spawners)
end

local function finish(reason)
  if finished then return end
  finished = true
  restoreArenaInflow() -- restore before logging/export can fail
  if _Telemetry.DpsCollection == collection then _Telemetry.DpsCollection = nil end
  for _, id in ipairs(timers) do _TimerService:ClearTimer(id) end
  log('[DPS-RUN] finishing' .. metadata() .. ' reason=' .. reason .. ' alive_targets=' .. liveTargets() .. ' legion=' .. liveUnits())
  -- 자기 원장만 마감한다. DpsStop 뒤이거나 다른 run이 시작됐어도 소유 자원 정리는 가능하다.
  if _Telemetry.DpsOn and _Telemetry.Dps ~= nil and _Telemetry.Dps.run == collection.run then
    local cap = _Telemetry.DpsFlushLineCap
    _Telemetry.DpsFlushLineCap = 4600
    local ok, err = pcall(function() _Telemetry:DpsFinish(4000) end)
    _Telemetry.DpsFlushLineCap = cap
    if not ok then log_error('[DPS-RUN] finish failed ' .. tostring(err)) _Telemetry:DpsStop() end
  end
  for _, e in ipairs(collection.entities) do if isvalid(e) then e:Destroy() end end
  collection.entities = {}
  log('[DPS-RUN] end' .. metadata() .. ' reason=' .. reason)
end
collection.stop = finish
_Telemetry.DpsCollection = collection

-- 1) 저장 끔 · 빌드 세팅 (레벨·능력치·투자·장비·슬롯 · 맛보기 그림자 끔 · 기존 소환 정리)
sv.IsLoadSuccess = false
st.Difficulty = 0
st.Level = CFG.level
st.Exp = 0
st.Str, st.Dex, st.Vit, st.Ene = B.attr[1], B.attr[2], B.attr[3], B.attr[4]
st.StatPoints = 0
st.SkillPoints = 0
if not st:HasFirstKill('taste_shadow') then st:MarkFirstKill('taste_shadow') end
local levels = {}
for k, v in pairs(B.inv) do levels[k] = v end
bk.Levels = levels
bk.ReadyAt = {}
bk.CdLen = {}
bk.CdDigest = ''
for i = 1, 4 do bk:SetSlot(i, B.slots[i] or '') end
bk:SetSlot(5, '')
bk:RefreshDigest()
local equip = {}
equip.weapon = BUILDS[CFG.level].weapon
equip.offhand = LAMP
inv.Equip = equip
inv:RefreshDigest()
inv:ApplyEquipment()
st:Recalculate(true)
_UndeadSystem:DismissAll(p)
log('[DPS-RUN] setup label=' .. label .. ' lv=' .. st.Level .. ' mana=' .. math.floor(st.MaxMana) .. ' hp=' .. math.floor(p.PlayerComponent.MaxHp) .. ' slots=' .. bk.Slots)

-- 2) 이동 → 2.5초 뒤 장면 시작 (맵이 바뀌면 CurrentMap 엔티티가 새로 생긴다)
travel:Go(S.map, Vector2(S.me[1], S.me[2]))

local function spawnPacks()
  local map = p.CurrentMap
  local serial = 0
  for _, pack in ipairs(S.packs) do
    for i = 1, pack[2] do
      serial = serial + 1
      local ang = serial * 2.399
      local r = pack[4] * math.sqrt(serial / math.max(1, pack[2]))
      local pos = Vector3(pack[3][1] + math.cos(ang) * r, pack[3][2] + math.sin(ang) * r, 0)
      local e = _SpawnService:SpawnByModelId(pack[1], 'C05_' .. pack[1] .. '_' .. serial, pos, map)
      if ownedEntity(e) then
        _Util:AfterSpawn(e, 'script.Monster', function(m)
          if not owns() then if isvalid(e) then e:Destroy() end return end
          m.RespawnDelay = -1
          m:ApplyLevel(CFG.level, false)
          if S.hpMul ~= nil then
            m.MaxHp = m.MaxHp * S.hpMul
            m.Hp = m.MaxHp
          end
          table.insert(targets, m)
        end, function() log_warning('[DPS-RUN] spawn failed ' .. pack[1]) end)
      end
    end
  end
end

local function raiseKinds()
  local list = {}
  if B.inv.raise_skeleton then table.insert(list, 'skeleton') end
  if B.inv.raise_mage then table.insert(list, 'mage') end
  return list
end

local function capOf(kind)
  local id = 'raise_' .. kind
  return _UndeadSystem:MaxFor(p, kind, bk:GetPowerLevel(id))
end

local function liveOf(kind)
  local n = 0
  if not isvalid(p) or not isvalid(p.CurrentMap) then return 0 end
  for _, c in ipairs(p.CurrentMap:GetChildComponentsByTypeName('script.ShadowUnit', true)) do
    if c.OwnerPlayer == p and not c.Dead and c.Hp > 0 and c.Kind == kind then n = n + 1 end
  end
  return n
end

local function spawnSouls(count)
  -- 준비용 혼: 정원만큼 플레이어 둘레에 (ux-phase1과 같은 방식 · 일반 혼)
  local info = _GameData:GetMonsterStats('skel_warrior')
  local me = _Util:Pos2(p)
  for i = 1, count do
    local ang = i * 2.399
    local soul = _SpawnService:SpawnByModelId(_GameConst.ModelSoulOrb, 'C05soul_' .. i, Vector3(me.x + math.cos(ang) * 1.5, me.y + math.sin(ang) * 1.5, 0), p.CurrentMap)
    if ownedEntity(soul) then
      _Util:AfterSpawn(soul, 'script.SoulOrb', function(orb) if not owns() then if isvalid(soul) then soul:Destroy() end return end orb:Setup(uid, 'skel_warrior', 1, 'normal', CFG.level, '', info.stand, info.move) end, function() soul:Destroy() end)
    end
  end
end

-- 자동 입력 (input=auto): 0.35초마다 준비된 스킬을 순서대로 시도 — 뼈 갑옷(없을 때) → 저주(안 걸린 대상) → 일으키기(정원 미만·혼 있음) → 공격 스킬 → 기본 공격.
-- 플레이어는 서버에서 움직일 수 없다(클라이언트 소유) → 제자리 사격 기준선. 사람 조작(input=human)이면 이 루프를 돌리지 않고 메이커 담당이 직접 조작한다.
local casts = { ok = 0, fail = 0 }
local function autoTick()
  if not observing() or not _Util:IsAlive(p) then return end
  local me = _Util:Pos2(p)
  local target = nearestTarget()
  local tpos = target ~= nil and _Util:Pos2(target.Entity) or nil
  local acted = false
  local function try(id, pos)
    if pos == nil or acted then return end
    if bk:Cast(id, pos) then
      casts.ok = casts.ok + 1
      acted = true
    else
      casts.fail = casts.fail + 1
    end
  end
  for _, id in ipairs(B.slots) do
    if id == 'bone_armor' and (st.BoneArmor or 0) <= 0 then try(id, me) end
    if id == 'mark_weakness' and target ~= nil and not target:IsCursed() then try(id, tpos) end
    if id == 'raise_skeleton' or id == 'raise_mage' then
      local kind = id == 'raise_mage' and 'mage' or 'skeleton'
      if liveOf(kind) < capOf(kind) then
        local orb = _UndeadSystem:FindUsableSoul(p, me, 8)
        if orb ~= nil and isvalid(orb.Entity) then try(id, _Util:Pos2(orb.Entity)) end
      end
    end
  end
  for _, id in ipairs(B.slots) do
    if id == 'bone_shard' or id == 'hex_flame' then try(id, tpos) end
  end
  if not acted and target ~= nil then
    local dir = tpos - me
    if dir:Magnitude() > 0.01 then pcall(function() atk:RequestBasicAttack(dir:Normalize(), true) end) end
  end
end

local function arenaClear()
  -- 시험 자리 둘레(16칸)의 시험 밖 몬스터를 치운다 — 원장은 DpsFilter로 이미 거르지만 소환수·스킬이 엉뚱한 대상을 치지 않게
  local center = Vector2(S.packs[1][3][1], S.packs[1][3][2])
  local removed = 0
  for _, m in ipairs(p.CurrentMap:GetChildComponentsByTypeName('script.Monster', true)) do
    if isvalid(m.Entity) and string.find(m.Entity.Name, 'C05_', 1, true) ~= 1 and (_Util:Pos2(m.Entity) - center):Magnitude() < 16 then
      m.Entity:Destroy()
      removed = removed + 1
    end
  end
  return removed
end

local function beginUnsafe()
  if not owns() then return end
  if not isvalid(p) or not isvalid(p.CurrentMap) then finish('player_left') return end
  if _GameConst:BaseMapName(p.CurrentMap.Name) ~= S.map then
    log_error('[DPS-RUN] travel failed label=' .. label .. ' at=' .. p.CurrentMap.Name)
    finish('travel_failed') return
  end
  pauseArenaInflow(p.CurrentMap)
  local removed = arenaClear()
  st.Mana = st.MaxMana
  p.PlayerComponent.Hp = p.PlayerComponent.MaxHp
  _Telemetry.DpsFilter = 'C05_'
  _Telemetry:DpsStart(label)
  collection.run = _Telemetry.DpsRunId
  startAt = _UtilLogic.ElapsedSeconds
  log('[DPS-RUN] begin' .. metadata() .. ' map=' .. S.map .. ' cleared_others=' .. removed .. ' input=' .. CFG.input)
  local prep = 1
  local kinds = raiseKinds()
  if #kinds > 0 then
    local need = 0
    for _, k in ipairs(kinds) do need = need + capOf(k) end
    spawnSouls(need)
    prep = 10
  end
  if CFG.input == 'auto' then table.insert(timers, _TimerService:SetTimerRepeat(autoTick, 0.35)) end
  local spawnedAt = -1
  table.insert(timers, _TimerService:SetTimerOnce(function()
    if not observing() then return end
    if S.wipe then
      preWipe = liveUnits()
      for _, c in ipairs(p.CurrentMap:GetChildComponentsByTypeName('script.ShadowUnit', true)) do
        if c.OwnerPlayer == p and not c.Dead then c:Hurt(999999) end
      end
      log('[DPS-RUN] wipe label=' .. label .. ' before=' .. preWipe)
    end
    spawnPacks()
    spawnedAt = _UtilLogic.ElapsedSeconds
    log('[DPS-RUN] targets label=' .. label .. ' prep_s=' .. string.format('%.2f', spawnedAt - startAt) .. ' legion=' .. liveUnits())
  end, prep))
  table.insert(timers, _TimerService:SetTimerRepeat(function()
    if not owns() then return end
    if not observing() then finish('observation_stopped') return end
    if not isvalid(p) then finish('player_left') return end
    if not _Util:IsAlive(p) then finish('player_dead') return end
    if not isvalid(p.CurrentMap) or _GameConst:BaseMapName(p.CurrentMap.Name) ~= S.map then finish('left_map') return end
    if spawnedAt < 0 then
      if _UtilLogic.ElapsedSeconds - startAt > prep + 5 then finish('target_setup_timeout') end
      return
    end
    local t = _UtilLogic.ElapsedSeconds - spawnedAt
    if S.wipe and t > 1 and liveUnits() >= preWipe and preWipe > 0 then finish('recovered') return end
    if not S.wipe and S.hpMul == nil and t > 2 and #targets > 0 and liveTargets() == 0 then finish('cleared') return end
    if t >= S.seconds then finish(S.hpMul ~= nil and 'duration' or 'timeout') return end
  end, 0.5))
end

local function begin()
  local ok, err = pcall(beginUnsafe)
  if not ok then
    log_error('[DPS-RUN] begin failed ' .. tostring(err))
    finish('begin_failed')
  end
end

table.insert(timers, _TimerService:SetTimerOnce(begin, 2.5))
log('[DPS-RUN] queued label=' .. label .. ' map=' .. S.map .. ' (2.5초 뒤 시작 · 끝나면 「[DPS-RUN] end」)')
