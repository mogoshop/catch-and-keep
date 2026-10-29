-- I05 개발용 전투 계측 (goal C): 실제 Monster 피해 두 경로(HandleHitEvent·TakeDamage)가 공통 원장 ApplyHpDamage를 한 번씩만 지나고,
-- 표시용 숫자 모음(QueueSummonDamage·FlushSummonDamage)·처치 보상(MonsterKilled·RewardPlayers)이 원장 합계를 바꾸지 않는지,
-- 계측이 꺼져 있으면 버퍼·타이머·구독이 없고 게임 결과(HP·보호막)가 켜진 때와 같은지, 기존 Telemetry.Flush 저장에 전투 버퍼가 섞이지 않는지 본다.
-- 엔진(HitEvent 배달·타이머·저장소)은 대신하고 MSW 동기화·실제 투사체·AI는 흉내 내지 않는다.
-- @source Monster Monster/Monster.mlua ApplyHpDamage,TakeDamage,TakeDamageAs,HandleHitEvent,RiteAbsorb,DpsTag,RestoreHp,SetPlayerHpMul,ResetForEmptyMap,Respawn,Die,QueueSummonDamage,FlushSummonDamage,NoteContributor,RewardPlayers
-- @source Util Common/Util.mlua OwnerPlayerOf
-- @source Telemetry Progress/Telemetry.mlua DpsFresh,DpsStart,DpsStop,DpsFinish,DpsHalt,DpsLive,DpsWants,DpsUnsubscribe,DpsTaken,DpsOwner,DpsSummonKey,DpsTakeTag,DpsLifeOf,DpsNewLife,DpsRecord,DpsHit,DpsNote,DpsOnEvent,DpsSample,DpsSampleOwner,DpsNum,DpsRel,DpsFlush,Flush,Active,Minutes,CopyFirsts,Say

local fails = 0
local function check(name, ok, detail)
  if ok then print('PASS dps ' .. name) else fails = fails + 1 print('FAIL dps ' .. name .. ' ' .. tostring(detail)) end
end

-- ── 엔진 대역 ──
local logs = {}
function log(text) table.insert(logs, text) end
function log_warning(text) table.insert(logs, 'W:' .. text) end
function log_error(text) table.insert(logs, 'E:' .. text) end
function isvalid(x) return x ~= nil and x ~= false and not (type(x) == 'table' and x.destroyed) end
function Vector3(x, y, z) return { x = x, y = y, z = z } end
function DataStorageKeyInfo(k, a, b) return { key = k } end
Environment = { IsPublishedPlay = function() return false end, IsMakerPlay = function() return true end }
DateTime = { UtcNow = { Elapsed = (62135596800 + 1800000000) * 1000 } }
_UtilLogic = { ElapsedSeconds = 100 }
local timers = { once = 0, rep = 0, cleared = 0, nextId = 0 }
_TimerService = {
  SetTimerOnce = function(_, fn, t) timers.once = timers.once + 1 timers.nextId = timers.nextId + 1 return timers.nextId end,
  SetTimerRepeat = function(_, fn, t) timers.rep = timers.rep + 1 timers.nextId = timers.nextId + 1 timers.repFn = fn return timers.nextId end,
  ClearTimer = function(_, id) timers.cleared = timers.cleared + 1 end,
}
local emitted = {}
_GameEvents = { subs = {},
  Subscribe = function(self, name, key, fn) self.subs[name .. '/' .. key] = fn end,
  Unsubscribe = function(self, name, key) self.subs[name .. '/' .. key] = nil end,
  Emit = function(self, name, payload) table.insert(emitted, name) for k, fn in pairs(self.subs) do if k:sub(1, #name + 1) == name .. '/' then fn(payload) end end end }
_GameConst = { LevelOf = function(_, e) return 0 end, LevelGapDealt = function() return 1 end }
_GameData = { heavyHitPct = 0.25, telemetryEndUnix = 0 }
local party = {}
_PartySystem = { NearbyMembers = function() return party end }
_Telemetry = Telemetry
_Util = Util
local function sortedKeys(t) local k = {} for key in pairs(t) do table.insert(k, tostring(key)) end table.sort(k) return k end
local function enc(v)
  if type(v) == 'table' then
    local parts = {}
    for _, k in ipairs(sortedKeys(v)) do table.insert(parts, k .. ':' .. enc(v[k] ~= nil and v[k] or v[tonumber(k)])) end
    return '{' .. table.concat(parts, ',') .. '}'
  end
  return tostring(v)
end
_HttpService = { JSONEncode = function(_, v) return enc(v) end }
local stored = {}
_DataStorageService = { GetGlobalDataStorage = function() return { SetByInfoAsync = function(_, info, json, cb) table.insert(stored, json) end } end }
_UserService = { UserEntities = {} }

-- 엔티티
local function entity(name, comps)
  local e = { Name = name, comps = comps or {}, Id = name }
  e.GetComponent = function(self, key) return self.comps[key] end
  e.SetEnable = function() end
  e.SetVisible = function() end
  e.Destroy = function(self) self.destroyed = true end
  return e
end
local map = entity('map01')
local function player(uid)
  local p = entity(uid)
  p.PlayerComponent = { UserId = uid, Hp = 100 }
  p.CurrentMap = map
  p.comps['script.PlayerAttack'] = { RegisterBasicContact = function() end }
  p.comps['script.PlayerStats'] = { Mana = 50 }
  return p
end
local p1, p2 = player('u1'), player('u2')
local function summon(owner, kind)
  local s = entity('unit_' .. kind)
  s.comps['script.ShadowUnit'] = { OwnerPlayer = owner, Kind = kind, Dead = false, Hp = 10 }
  return s
end
local skel = summon(p1, 'skeleton')

-- 몬스터 인스턴스: 실제 Monster 본문 + 연출·상태만 대신
local stub = function() end
for _, n in ipairs({ 'ShowTickDamage', 'ShowSummonDamage', 'LifeTapFor', 'HitReact', 'SpreadPoison', 'PlayDeathSound', 'Hide', 'TryRespawn', 'CheckEnrage', 'EnrageFx' }) do Monster[n] = stub end
Monster.GetDamageTakenMultiplier = function() return 1 end
Monster.Traits = function() return nil end
Monster.Status = function() return nil end
Monster.GetRank = function() return 'normal' end
Monster.GetVariant = function() return '' end
Monster.IsFieldBoss = function() return false end
Monster.ShownName = function(self) return self.SourceId end
Monster.Reroll = function(self) self.Hp = self.MaxHp end
local absorbCalls = 0
local realAbsorb = Monster.RiteAbsorb
Monster.RiteAbsorb = function(self, amount) absorbCalls = absorbCalls + 1 return realAbsorb(self, amount) end
local mobSerial = 0
local function monster(hp, shield)
  mobSerial = mobSerial + 1
  local e = entity('mob' .. mobSerial)
  e.CurrentMap = map
  e.TransformComponent = { WorldPosition = { x = 0, y = 0 } }
  local m = setmetatable({ Entity = e, Hp = hp, MaxHp = hp, RiteShield = shield or 0, Contributors = {}, DpsTags = {}, IsDead = false,
    SourceId = 'hellhound', Grade = 1, Level = 5, RespawnDelay = 10, SummonDmgTimer = 0, SummonDmgAcc = 0, SummonDmgHits = 0, SummonDmgLogged = 0,
    TickAccum = 0, TickShownAt = -99, LastAttacker = nil, RiteReflect = 0, PlayerHpMul = 1, DpsRun = 0, DpsLife = 0, DpsSeq = 0, DpsAttempt = 1, DpsLastHp = 0 }, { __index = Monster })
  e.comps['script.Monster'] = m
  return m
end
local function hit(m, attacker, dmg) m:HandleHitEvent({ AttackerEntity = attacker, TotalDamage = dmg }) end
local function ring()
  local d = Telemetry.Dps
  local list = {}
  for i = math.max(1, d.n - math.min(d.n, Telemetry.DpsRawCap) + 1), d.n do
    local e = d.ring[(i - 1) % Telemetry.DpsRawCap + 1]
    table.insert(list, { n = e.n, kind = e.kind, life = e.life, seq = e.seq, owner = e.owner, ak = e.ak, src = e.src, b = e.b, a = e.a, raw = e.raw, ab = e.ab, eff = e.eff, ov = e.ov, att = e.att })
  end
  return list
end
local function dmgEvents(list) local out = {} for _, e in ipairs(list) do if e.kind == 'hit' or e.kind == 'tick' then table.insert(out, e) end end return out end

-- ── C01 기본 꺼짐 · 비간섭 ──
check('default off', Telemetry.DpsOn == false and Telemetry.Dps == nil, Telemetry.DpsOn)
local function scenario()
  -- 같은 입력열: 보호막 흡수 · 일반 타격 · 틱 · 과잉 피해
  local m = monster(100, 15)
  hit(m, p1, 10); m:TakeDamage(20, p1); hit(m, skel, 30); hit(m, p1, 200)
  return m
end
absorbCalls = 0
local offM = scenario()
local offAbsorb = absorbCalls
check('off: no buffer/timer/subscription', Telemetry.Dps == nil and timers.rep == 0 and next(_GameEvents.subs) == nil, timers.rep)
check('off: RiteAbsorb once per HP change (4 hits)', offAbsorb == 4, offAbsorb)
Telemetry:DpsStart('c01')
absorbCalls = 0
local onM = scenario()
check('on: game result identical (Hp, shield, dead)', onM.Hp == offM.Hp and onM.RiteShield == offM.RiteShield and onM.IsDead == offM.IsDead, onM.Hp .. ' vs ' .. offM.Hp)
check('on: RiteAbsorb call count unchanged', absorbCalls == offAbsorb, absorbCalls)
check('on: sampler timer and subscriptions exist only while on', timers.rep == 1 and _GameEvents.subs['PlayerDied/TelemetryDps'] ~= nil, timers.rep)
Telemetry:DpsStop()
check('stop: buffer freed, timer cleared, unsubscribed', Telemetry.Dps == nil and Telemetry.DpsOn == false and timers.cleared >= 1 and next(_GameEvents.subs) == nil, timers.cleared)

-- ── C02 오라클 ──
Telemetry:DpsStart('oracle')
local m1 = monster(100, 10)
Telemetry:DpsNote(m1, 'spawn', -1)
hit(m1, p1, 30)
local ev = dmgEvents(ring())
check('oracle1 before100 in30 shield10 → after80 eff20 abs10 over0, one ledger row', #ev == 1 and m1.Hp == 80 and ev[1].eff == 20 and ev[1].ab == 10 and ev[1].ov == 0 and ev[1].b == 100 and ev[1].a == 80, enc(ev[1]))
local m2 = monster(10, 0)
Telemetry:DpsNote(m2, 'spawn', -1)
hit(m2, p1, 50)
local ev2 = dmgEvents(ring())[2]
local deaths = 0
for _, e in ipairs(ring()) do if e.kind == 'death' and e.life == m2.DpsLife then deaths = deaths + 1 end end
check('oracle2 before10 in50 → after-40 (no clamp, current policy) eff10 over40 death1', m2.Hp == -40 and ev2.eff == 10 and ev2.ov == 40 and deaths == 1 and m2.IsDead, enc(ev2))
local m3 = monster(100, 20)
Telemetry:DpsNote(m3, 'spawn', -1)
hit(m3, p1, 10)
local ev3 = dmgEvents(ring())[3]
check('oracle3 before100 in10 shield20 → HP100 eff0 abs10, not killed', m3.Hp == 100 and ev3.eff == 0 and ev3.ab == 10 and not m3.IsDead, enc(ev3))
hit(m2, p1, 50)
check('C02 dead target: later hit is a no-op (no ledger row)', #dmgEvents(ring()) == 3, #dmgEvents(ring()))

-- ── C03 같은 시각 합법 다중 타격 보존 ──
local m4 = monster(100, 0)
Telemetry:DpsNote(m4, 'spawn', -1)
hit(m4, p1, 10); hit(m4, p1, 10)
local same = {}
for _, e in ipairs(dmgEvents(ring())) do if e.life == m4.DpsLife then table.insert(same, e) end end
check('oracle4 same time 100→90→80: two rows, distinct HPseq, eff 20', #same == 2 and same[1].seq ~= same[2].seq and same[1].eff + same[2].eff == 20 and m4.Hp == 80, #same)

-- ── 표시 Queue · 처치 보상은 원장이 아니다 ──
local m5 = monster(10, 0)
Telemetry:DpsNote(m5, 'spawn', -1)
party = { p2 }
local effBefore = Telemetry.Dps.eff
hit(m5, skel, 10)   -- 소환수 타격: QueueSummonDamage(표시) + 사망 → FlushSummonDamage + MonsterKilled(보상: u1 + 파티 u2)
local emittedKill = false
for _, n in ipairs(emitted) do if n == 'MonsterKilled' then emittedKill = true end end
check('oracle5 ledger 10 stays 10 after summon number flush + MonsterKilled', Telemetry.Dps.eff - effBefore == 10 and emittedKill and m5.SummonDmgAcc == 0, Telemetry.Dps.eff - effBefore)
check('C04 owner = summon owner u1 with source summon.skeleton (identity kept)', Telemetry.Dps.owners.u1.src['summon.skeleton'] ~= nil and Telemetry.Dps.owners.u1.src['summon.skeleton'].eff == 10, enc(Telemetry.Dps.owners.u1.src))
check('C04 party reward receiver u2 gets no damage attribution', Telemetry.Dps.owners.u2 == nil, Telemetry.Dps.owners.u2)
party = {}

-- ── C04 출처: 틱 · 꼬리표 정확 일치만 · 무주체 ──
local m6 = monster(1000, 0)
Telemetry:DpsNote(m6, 'spawn', -1)
m6:TakeDamage(5, p1)
m6:DpsTag(p1, 'skill.bone_shard', 48)
hit(m6, p1, 48)
m6:DpsTag(p1, 'skill.bone_shard', 48)
hit(m6, p1, 47)                       -- 피해가 다르면 미상
m6:DpsTag(p1, 'skill.bone_shard', 30); m6:DpsTag(p1, 'player.basic', 30)
hit(m6, p1, 30)                       -- 같은 공격자·같은 피해에 이름이 둘 → 미상
hit(m6, nil, 7)                       -- 공격자 없음
local srcs = {}
for _, e in ipairs(dmgEvents(ring())) do if e.life == m6.DpsLife then table.insert(srcs, e.owner .. ':' .. e.ak .. ':' .. e.src) end end
check('C04 sources: tick.unknown / exact tag / mismatch unknown / ambiguous unknown / none',
  table.concat(srcs, ',') == 'u1:player:tick.unknown,u1:player:skill.bone_shard,u1:player:player.unknown,u1:player:player.unknown,none:none:hit.none', table.concat(srcs, ','))
check('C04 tag counters (hit 1, miss 2 for tagged player hits; ambiguous counts as miss)', Telemetry.Dps.tagHit == 1 and Telemetry.Dps.tagMiss >= 2, Telemetry.Dps.tagHit .. '/' .. Telemetry.Dps.tagMiss)

-- ── C05 생명·시도 경계 · heal/scale/reset/drift ──
local m7 = monster(100, 0)
Telemetry:DpsNote(m7, 'spawn', -1)
_UtilLogic.ElapsedSeconds = 101
hit(m7, p1, 20)                       -- 100 → 80
m7:SetPlayerHpMul(0.5)                -- 인원 보정 80 → 40 (피해 아님)
m7:RestoreHp(10, 'aura')              -- 40 → 50
m7.Hp = m7.Hp + 5                     -- 원장 밖 회복 (의식 회복 등 · 패치 전 경로) → 다음 기록에서 drift +5
hit(m7, p1, 10)
local effLife = 0
local kinds = {}
for _, e in ipairs(ring()) do if e.life == m7.DpsLife then effLife = effLife + e.eff table.insert(kinds, e.kind) end end
local l7a = Telemetry.Dps.lives[m7.DpsLife]
check('oracle6 scale/heal/drift are not damage (eff 30 = 20 + 10)', effLife == 30 and l7a.scale == -40 and l7a.heal == 10 and l7a.drift == 5, effLife .. ' ' .. table.concat(kinds, ','))
check('C05 event kinds in order', table.concat(kinds, ',') == 'spawn,hit,scale,heal:aura,drift,hit', table.concat(kinds, ','))
m7:ResetForEmptyMap()
check('C05 reset starts new attempt and clears first hit', m7.DpsAttempt == 2 and Telemetry.Dps.lives[m7.DpsLife].firstHit == -1, m7.DpsAttempt)
_UtilLogic.ElapsedSeconds = 104
hit(m7, p1, 10); hit(m7, p1, 10)
_UtilLogic.ElapsedSeconds = 106
hit(m7, p1, 100)
local oldLife = m7.DpsLife
local l7 = Telemetry.Dps.lives[oldLife]
check('C08 TTK from first effective hit of the attempt (104 → 106 = 2s)', m7.IsDead and l7.death - l7.firstHit == 2 and l7.deathAttempt == 2, l7.death - l7.firstHit)
_UtilLogic.ElapsedSeconds = 120
m7:Respawn()
check('oracle7 respawn → new life id, old life keeps its death', m7.DpsLife ~= oldLife and Telemetry.Dps.lives[oldLife].death == 106 and Telemetry.Dps.lives[m7.DpsLife].death == -1, m7.DpsLife)
hit(m7, p1, 5)
check('C05 respawned life gets its own seq from 1', m7.DpsSeq == 2 and Telemetry.Dps.lives[m7.DpsLife].eff == 5, m7.DpsSeq)
local m8 = monster(50, 0)
hit(m8, p1, 10)
check('C05 adopt for monsters spawned before start (born unknown)', Telemetry.Dps.lives[m8.DpsLife].born == -1 and Telemetry.Dps.lives[m8.DpsLife].startHp == 50, enc(Telemetry.Dps.lives[m8.DpsLife]))
m8.IsDead = true
Telemetry:DpsNote(m8, 'death', m8.Hp)
m8.IsDead = false
m8.Hp = 50
local lifeBefore = m8.DpsLife
hit(m8, p1, 10)
check('C05 revived without Respawn → new life (not attached to dead life)', m8.DpsLife ~= lifeBefore and Telemetry.Dps.lives[lifeBefore].eff == 10, m8.DpsLife)

-- ── 사망·혼 (기존 게임 이벤트) · 표본 ──
_GameEvents:Emit('PlayerDied', { player = p1 })
_GameEvents:Emit('UndeadRaised', { player = p1, kind = 'mage' })
check('C09 player death / soul raise counted from existing events', Telemetry.Dps.owners.u1.deaths == 1 and Telemetry.Dps.owners.u1.raised == 1 and Telemetry.Dps.owners.u1.raisedMage == 1, Telemetry.Dps.owners.u1.deaths)
_UserService.UserEntities = { u1 = p1 }
map.GetChildComponentsByTypeName = function() return { skel.comps['script.ShadowUnit'] } end
_UtilLogic.ElapsedSeconds = 130
Telemetry:DpsSample()
p1.comps['script.PlayerStats'].Mana = 30
skel.comps['script.ShadowUnit'].Dead = true
_UtilLogic.ElapsedSeconds = 130.25
Telemetry:DpsSample()
p1.comps['script.PlayerStats'].Mana = 40
skel.comps['script.ShadowUnit'].Dead = false
_UtilLogic.ElapsedSeconds = 131.5
Telemetry:DpsSample()
local o1 = Telemetry.Dps.owners.u1
check('C09 sampled mana drop/rise and legion wipe→recover', o1.manaDrop == 20 and o1.manaRise == 10 and o1.wipes == 1 and #o1.recover == 1 and math.abs(o1.recover[1] - 1.25) < 1e-9, enc({ o1.manaDrop, o1.manaRise, o1.wipes, o1.recover[1] }))
check('C09 sampler lateness proxy (1.25s gap > 0.35s)', Telemetry.Dps.sampleLate == 1 and Telemetry.Dps.sampleN == 2, Telemetry.Dps.sampleLate)

-- ── 요약 줄 · 미지원 표기 ──
logs = {}
Telemetry:DpsFlush(10)
local text = table.concat(logs, '\n')
check('flush window line', text:find('%[DPS%] window run=%d+ scene=oracle') ~= nil, logs[1])
check('flush unsupported metrics are labelled, not zero', text:find('mana_spent=unsupported') and text:find('hits_taken=unsupported') and text:find('legion_loss_reason=unsupported') and text:find('soul_other=unsupported'), '')
local evCount = select(2, text:gsub('%[DPS%] ev|', ''))
check('flush prints 10 ledger rows + end', evCount == 10 and text:find('%[DPS%] end run=') ~= nil, evCount)
local outPath = os.getenv('DPS_LOG_OUT')
if outPath and outPath ~= '' then
  local f = io.open(outPath, 'w')
  f:write(text .. '\n')
  f:close()
end
-- 전체 원장 덤프도 집계 도구 자체 시험용으로
logs = {}
Telemetry:DpsFlush(4000)
local fullPath = os.getenv('DPS_LOG_FULL')
if fullPath and fullPath ~= '' then
  local f = io.open(fullPath, 'w')
  f:write(table.concat(logs, '\n') .. '\n')
  f:close()
end
Telemetry:DpsStop()

-- ── C06 상한 · C07 저장 분리 ──
Telemetry.DpsRawCap = 5
Telemetry:DpsStart('cap')
local m9 = monster(1000, 0)
Telemetry:DpsNote(m9, 'spawn', -1)
local i = 0
while i < 8 do
  hit(m9, p1, 10)
  i = i + 1
end
check('oracle8 ring cap: kept 5, dropped 4 (9 rows incl. spawn), aggregates keep all 8 hits', Telemetry.Dps.n == 9 and Telemetry.Dps.dropped == 4 and Telemetry.Dps.eff == 80 and Telemetry.Dps.owners.u1.hits == 8, Telemetry.Dps.dropped)
local ringSize = 0
for _ in pairs(Telemetry.Dps.ring) do ringSize = ringSize + 1 end
check('C06 ring table never grows past cap', ringSize == 5, ringSize)
Telemetry.DpsOwnerCap = 1
local p3 = player('u3')
hit(m9, p3, 10)
check('C06 owner cap: extra owner counted as overflow, run total still includes it', Telemetry.Dps.owners.u3 == nil and Telemetry.Dps.ownerOverflow == 1 and Telemetry.Dps.eff == 90, Telemetry.Dps.ownerOverflow)
Telemetry.DpsOwnerCap = 16
_UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + Telemetry.DpsMaxSec + 1
hit(m9, p1, 10)
check('C06 max run length halts recording (HP still applied)', Telemetry.Dps.stopped and Telemetry.Dps.eff == 90 and m9.Hp == 1000 - 100, m9.Hp)
Telemetry.Sessions = { u1 = { uid = 'u1', start = 1, t0 = 0, lv0 = 1, lv = 2, kills = 3, levels = {}, deaths = {}, quests = {}, maps = {}, loot = {} } }
stored = {}
Telemetry:Flush('u1', false)
local savedOn = stored[1] or ''
Telemetry:DpsStop()
stored = {}
Telemetry:Flush('u1', false)
local savedOff = stored[1] or ''
check('C07 Telemetry.Flush payload identical with DPS on/off and has no DPS keys', savedOn ~= '' and savedOn == savedOff and not savedOn:find('ring') and not savedOn:find('Dps') and not savedOn:find('eff'), savedOn)
Telemetry.DpsRawCap = 4000

-- ── 중간 검토 0047 재확인 ──
-- C-IF-02: 같은 공격자·같은 피해에 이름이 다른 후보 A/B → 첫 타격도 둘째 타격도 미상 (남은 B로 거짓 확정 금지) · 만료 단일 후보도 미상
Telemetry:DpsStart('review')
local mA = monster(1000, 0)
Telemetry:DpsNote(mA, 'spawn', -1)
mA:DpsTag(p1, 'skill.bone_shard', 30)
mA:DpsTag(p1, 'player.basic', 30)
hit(mA, p1, 30)
hit(mA, p1, 30)
local tagSrc = {}
for _, e in ipairs(dmgEvents(ring())) do if e.life == mA.DpsLife then table.insert(tagSrc, e.src) end end
check('C-IF-02 ambiguous A/B: both hits unknown, no leftover promotion', table.concat(tagSrc, ',') == 'player.unknown,player.unknown' and #mA.DpsTags == 0, table.concat(tagSrc, ','))
mA:DpsTag(p1, 'skill.bone_shard', 40)
_UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.6
hit(mA, p1, 40)
local lastSrc = dmgEvents(ring())
check('C-IF-02 expired single candidate is unknown', lastSrc[#lastSrc].src == 'player.unknown' and #mA.DpsTags == 0, lastSrc[#lastSrc].src)
mA:DpsTag(p1, 'skill.bone_shard', 40)
hit(mA, p1, 40)
lastSrc = dmgEvents(ring())
check('C-IF-02 fresh exact single candidate is confirmed', lastSrc[#lastSrc].src == 'skill.bone_shard', lastSrc[#lastSrc].src)
-- C-IF-OBS-01: 보상 귀속(kill_credit_owner)과 마지막 HP 원장 owner(terminal_damage_owner)를 따로
local mK = monster(30, 0)
Telemetry:DpsNote(mK, 'spawn', -1)
hit(mK, p1, 10)
hit(mK, nil, 25)                      -- 무효 공격자의 마지막 타격: LastAttacker는 그대로 p1
local lK = Telemetry.Dps.lives[mK.DpsLife]
check('C-IF-OBS-01 terminal damage owner from ledger, kill credit from existing LastAttacker', lK.lastOwner == 'none' and lK.killCredit == 'u1' and lK.death >= 0, lK.lastOwner .. '/' .. lK.killCredit)
-- C-IF-03: 줄 상한에 잘리면 ev_printed = 실제 ev 줄 수, ev_omitted > 0
Telemetry.DpsFlushLineCap = 6
logs = {}
Telemetry:DpsFlush(50)
local evLines = 0
for _, l in ipairs(logs) do if l:find('%[DPS%] ev|') then evLines = evLines + 1 end end
local endLine = logs[#logs]
local printed = tonumber(endLine:match('ev_printed=(%d+)'))
local omitted = tonumber(endLine:match('ev_omitted=(%d+)'))
check('C-IF-03 truncated flush reports actual ev lines and omitted count', printed == evLines and omitted > 0 and tonumber(endLine:match('truncated=(%d+)')) > 0, endLine)
Telemetry.DpsFlushLineCap = 2000
-- C-IF-01: 피해 없이 상한을 넘겨도 표본·HP 사건·게임 이벤트가 더 쌓이지 않고 종료 시각이 고정된다
Telemetry.DpsMaxSec = 10
local d0 = Telemetry.Dps
local t0 = d0.t0
_UtilLogic.ElapsedSeconds = t0 + 11
local nBefore, sampleBefore, deathsBefore = d0.n, d0.sampleN, d0.owners.u1.deaths
Telemetry:DpsSample()
Telemetry:DpsNote(mA, 'heal:aura', mA.Hp)
_GameEvents:Emit('PlayerDied', { player = p1 })
_UtilLogic.ElapsedSeconds = t0 + 50
Telemetry:DpsSample()
check('C-IF-01 halted at t0+MaxSec without damage: no new samples/rows/events', d0.stopped and d0.n == nBefore and d0.sampleN == sampleBefore and d0.owners.u1.deaths == deathsBefore and d0.stoppedAt == t0 + 10, d0.stoppedAt)
check('C-IF-01 halt releases sampler timer and subscriptions', Telemetry.DpsSampleTimer == 0 and _GameEvents.subs['PlayerDied/TelemetryDps'] == nil, Telemetry.DpsSampleTimer)
logs = {}
Telemetry:DpsFlush(0)
check('C-IF-01 flush duration fixed at MaxSec after halt', logs[1]:find('dur=10.00') ~= nil and logs[1]:find('halted=maxSec') ~= nil, logs[1])
Telemetry:DpsStop()
Telemetry.DpsMaxSec = 1800

-- 시험 대상 거르기: DpsFilter 접두어가 맞는 몬스터만 원장에 · 나머지는 filtered 수로만
Telemetry.DpsFilter = 'C05_'
Telemetry:DpsStart('filter')
local mIn = monster(100, 0)
mIn.Entity.Name = 'C05_target'
local mOut = monster(100, 0)
Telemetry:DpsNote(mIn, 'spawn', -1)
Telemetry:DpsNote(mOut, 'spawn', -1)
hit(mIn, p1, 10)
hit(mOut, p1, 10)
check('filter: only prefixed targets recorded, others counted as filtered', Telemetry.Dps.eff == 10 and Telemetry.Dps.filtered == 2 and Telemetry.Dps.lives[mIn.DpsLife].name == 'C05_target' and mOut.DpsLife == 0, Telemetry.Dps.filtered)
check('filter: HP still applied to filtered monster (game unchanged)', mOut.Hp == 90, mOut.Hp)
Telemetry:DpsStop()
check('stop clears filter', Telemetry.DpsFilter == '', Telemetry.DpsFilter)

-- 패치 요청 대비 창구: TakeDamageAs 고정 출처 · 피격(DpsTaken) · 소환수 손실 이유(SummonLost) · 기타 혼 손실(SoulLost)
Telemetry:DpsStart('hooks')
local mP = monster(500, 0)
Telemetry:DpsNote(mP, 'spawn', -1)
mP:TakeDamageAs(12, p1, 'tick.poison')
mP:TakeDamage(3, skel)
local tickSrc = {}
for _, e in ipairs(dmgEvents(ring())) do table.insert(tickSrc, e.kind .. ':' .. e.src .. ':' .. e.owner) end
check('TakeDamageAs keeps kind tick with declared source; plain TakeDamage stays tick.unknown (summon owner kept)', table.concat(tickSrc, ',') == 'tick:tick.poison:u1,tick:tick.unknown:u1', table.concat(tickSrc, ','))
check('TakeDamage == TakeDamageAs(tick) for HP (no behaviour change)', mP.Hp == 500 - 15, mP.Hp)
logs = {}
Telemetry:DpsFlush(0)
check('before hooks: hits_taken / legion_loss_reason / soul_other stay unsupported', table.concat(logs, '\n'):find('hits_taken=unsupported') ~= nil and table.concat(logs, '\n'):find('legion_loss_reason=unsupported') ~= nil, '')
Telemetry:DpsTaken(p1, 20)
Telemetry:DpsTaken(skel, 7)
_GameEvents:Emit('SummonLost', { player = p1, kind = 'skeleton', reason = 'died' })
_GameEvents:Emit('SummonLost', { player = p1, kind = 'skeleton', reason = 'trimmed' })
_GameEvents:Emit('SoulLost', { player = p1, reason = 'expired' })
logs = {}
Telemetry:DpsFlush(0)
local hookText = table.concat(logs, '\n')
check('after hooks: taken split player/summon, loss reasons, soul other', hookText:find('hits_taken=1 taken=20.00 summon_hits_taken=1 summon_taken=7.00', 1, true) ~= nil and hookText:find('legion_loss_reason=died:1,trimmed:1', 1, true) ~= nil and hookText:find('soul_other=1', 1, true) ~= nil, hookText)
Telemetry:DpsStop()
check('stop unsubscribes SummonLost/SoulLost too', _GameEvents.subs['SummonLost/TelemetryDps'] == nil and _GameEvents.subs['SoulLost/TelemetryDps'] == nil, '')

-- ── DpsFinish · 꺼진 뒤 Flush ──
Telemetry:DpsStart('finish')
logs = {}
Telemetry:DpsFinish(0)
check('DpsFinish flushes then stops', Telemetry.DpsOn == false and Telemetry.Dps == nil and table.concat(logs, '\n'):find('%[DPS%] end') ~= nil, #logs)
logs = {}
Telemetry:DpsFlush(5)
check('flush while off is a labelled no-op', logs[1] == '[DPS] flush skipped (off)', logs[1])

if fails > 0 then error('dps failures: ' .. fails) end
print('dps: all checks passed')
