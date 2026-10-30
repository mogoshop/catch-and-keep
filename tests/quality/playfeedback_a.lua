-- 10-31 사용자 실플레이 피드백 갈래 A: 실제 본문으로 반례를 본다 (엔진 서비스·엔티티는 대역)
--   A-2 MonsterSpawner — 한 무리 정리 뒤 숨 고르기 12초(파티 단위) · 처음부터 빈 곳은 숨 고르기 없음 · 동시 추격 상한 10 · InflowTick이 보류 동안 실제로 0마리
--   A-3 MonsterAttack — 추격 시작 뒤 1.5초 유지 · 놓치는 거리 = 감지 × 1.4 · 놓친 뒤 0.6초 정지 · 감지 경계에서 흔들리는 플레이어에게 끊김 0 ·
--       떼·유입(감지 40)은 손대지 않음 · 사거리 안에서는 물러나기(-1)·다가감 없이 멈춤
--   A-4 PetSystem — 서 있기(2~4초마다 0.3칸 미세 이동만, 주인 2칸 안) · 2~3칸은 그대로 · 3칸 넘으면 따라가 2칸 안에서 정지 · 8칸 줍기 뒤 돌아옴 · 목표 전환 0.4초
--   실제 AIChase 움직임·동기화·그림은 메이커 몫
--@pre local V = {} V.__index = V
--@pre V.__add = function(a, b) return setmetatable({ x = a.x + b.x, y = a.y + b.y }, V) end
--@pre V.__sub = function(a, b) return setmetatable({ x = a.x - b.x, y = a.y - b.y }, V) end
--@pre V.__mul = function(a, k) if type(a) == "number" then a, k = k, a end return setmetatable({ x = a.x * k, y = a.y * k }, V) end
--@pre function V:Magnitude() return math.sqrt(self.x * self.x + self.y * self.y) end
--@pre function V:Normalize() local m = self:Magnitude() return setmetatable({ x = self.x / m, y = self.y / m }, V) end
--@pre function V:Dot(o) return self.x * o.x + self.y * o.y end
--@pre function Vector2(x, y) return setmetatable({ x = x, y = y }, V) end
--@pre function Vector3(x, y, z) return { x = x, y = y, z = z } end
-- @source MonsterSpawner Monster/MonsterSpawner.mlua InflowTick,UpdateRest,InflowHold,NoteHold,RestGroups,ChaseCounts,PoolCount,ReturnToPool
-- @source MonsterAttack Monster/MonsterAttack.mlua ChaseDecide,SpacingDecide,UpdateChaseHold,WriteDetect,ResumeChase,ResetChaseHold,IsLiveDefender,Body
-- @source PetSystem Player/PetSystem.mlua PetDecide,StandSpot,DrawPet,ShowFetch,TickOwner,Wants,Frame
local fails = 0
local function check(cond, msg)
  if cond then print("통과  " .. msg) else fails = fails + 1 print("실패  " .. msg) end
end
local logs = {}
function log(s) table.insert(logs, s) end
function isvalid(x) return x ~= nil and x.dead ~= true end
_UtilLogic = { ElapsedSeconds = 0, seq = {}, RandomDouble = function(self) self.i = (self.i or 0) + 1 return self.seq[self.i] or 0.5 end }
_GameData = { inflowAlivePerPlayer = 8, inflowLeash = 20, inflowLeashSec = 6, arrivalShieldSec = 3 }
local MAP = { Name = "wasteland", Id = "m1" }
_Util = {
  Pos2 = function(_, e) return e.pos end,
  IsAlive = function() return true end,
  NearestPlayerDistance = function() return 0 end,
}
local function player(uid, x, y, party)
  local p = { Name = uid, pos = Vector2(x, y), Enable = true, CurrentMap = MAP, PlayerComponent = { UserId = uid, Hp = 100 } }
  local social = { PartyId = party or 0 }
  p.GetComponent = function(_, k) if k == "script.PlayerSocial" then return social end return nil end
  return p
end
local function monster(id, x, y, opt)
  opt = opt or {}
  local attack = { ChaseState = opt.state or 0 }
  local e = { Id = id, Name = id, pos = Vector2(x, y), Enable = true, AIChaseComponent = { Enable = opt.chaseOff ~= true, DetectionRange = opt.detect or 4 } }
  local m = { Entity = e, IsDead = opt.dead == true, Inflow = opt.inflow == true, Horde = opt.horde == true }
  e.GetComponent = function(_, k) if k == "script.MonsterAttack" then return attack elseif k == "script.Monster" then return m end return nil end
  return m
end
local function spawner()
  local s = setmetatable({ RestUntil = {}, RestBusy = {}, HoldLogged = {}, InflowAlive = {}, InflowReturns = {}, Borrowed = {}, InflowPool = { { id = "fallenimp", level = 1, n = 50 } } }, { __index = MonsterSpawner })
  return s
end

-- ───────── A-2 숨 고르기 · 상한 ─────────
do
  local S = spawner()
  check(S.InflowShare == 0.15 and S.InflowRestSec == 12 and S.InflowRestRadius == 8 and S.ChaseCap == 10, "A-2 기본값 InflowShare 0.15 · InflowRestSec 12 · InflowRestRadius 8 · ChaseCap 10")
  S:UpdateRest("u1", 3, 0)
  check(S:InflowHold("u1", 0, 0) == "", "A-2 둘레에 몬스터가 있는 동안은 유입 보류 없음")
  S:UpdateRest("u1", 0, 1.5)
  check(S:InflowHold("u1", 0, 1.5) == "rest", "A-2 무리를 다 잡아 둘레 8칸이 0이 되면 숨 고르기 시작")
  check(S:InflowHold("u1", 0, 13.4) == "rest", "A-2 정리 뒤 11.9초에도 유입 금지")
  S:UpdateRest("u1", 0, 13.6)
  check(S:InflowHold("u1", 0, 13.6) == "", "A-2 정리 뒤 12.1초에는 유입 재개 (빈 채로 있어도 다시 걸지 않음)")
  S:UpdateRest("u2", 0, 0)
  check(S:InflowHold("u2", 0, 0) == "", "A-2 처음부터 비어 있던 곳(아직 못 만남)은 숨 고르기 없음 — 유입이 첫 만남을 만든다")
  check(S:InflowHold("u3", 9, 0) == "", "A-2 쫓는 몬스터 9마리면 유입 계속")
  check(S:InflowHold("u3", 10, 0) == "cap" and S:InflowHold("u3", 14, 0) == "cap", "A-2 쫓는 몬스터 10마리 이상이면 새 유입 보류 (유입으로 10을 넘기지 않는다)")
  local S2 = spawner() S2.InflowRestSec = 0 S2.ChaseCap = 0
  S2:UpdateRest("u1", 2, 0) S2:UpdateRest("u1", 0, 1)
  check(S2:InflowHold("u1", 99, 1) == "", "A-2 InflowRestSec 0 · ChaseCap 0이면 예전처럼(되돌림 가능)")
end

-- 파티 기준 · 추격 수 세기
do
  local S = spawner()
  local p1, p2, p3 = player("u1", 0, 0, 7), player("u2", 30, 0, 7), player("u3", -30, 0, 0)
  local mons = { monster("a", 3, 0) }
  _Util.MonstersNear = function(_, map, c, r)
    local out = {}
    for _, m in ipairs(mons) do if not m.IsDead and (m.Entity.pos - c):Magnitude() <= r then table.insert(out, m) end end
    return out
  end
  local g = S:RestGroups(MAP, { p1, p2, p3 })
  check(g.of.u1.key == "p7" and g.of.u2.key == "p7" and g.of.u2.awake == 1 and g.of.u3.key == "u3" and #g.list == 2, "A-2 파티원은 한 무리(파티 키) — 멀리 있는 파티원도 둘레 수를 함께 쓴다")
  for _, x in ipairs(g.list) do S:UpdateRest(x.key, x.awake, 0) end
  mons[1].IsDead = true
  g = S:RestGroups(MAP, { p1, p2, p3 })
  for _, x in ipairs(g.list) do S:UpdateRest(x.key, x.awake, 1.5) end
  check(S:InflowHold("p7", 0, 2) == "rest" and S:InflowHold(g.of.u2.key, 0, 2) == "rest", "A-2 파티 둘레가 비면 무리를 안 만난 파티원(u2)도 함께 숨 고르기")
  check(S:InflowHold("u3", 0, 2) == "", "A-2 다른 파티·혼자인 사람은 영향 없음")

  local list = {}
  for i = 1, 12 do table.insert(list, monster("c" .. i, 2 + i * 0.1, 0, { state = 1 })) end
  table.insert(list, monster("idle", 1, 0, { state = 0 }))
  table.insert(list, monster("dead", 1, 0, { state = 1, dead = true }))
  table.insert(list, monster("far", 9, 0, { state = 1 }))
  table.insert(list, monster("inflow", 15, 0, { inflow = true, detect = 40 }))
  table.insert(list, monster("p2side", 29, 0, { state = 1 }))
  _Util.ListOf = function() return list end
  local cnt = S:ChaseCounts(MAP, { p1, p2 })
  check(cnt.u1 == 13 and cnt.u2 == 1, "A-2 추격 수 = 추격 중(1)·유입·떼 중 가장 가까운 사람·추격 범위 안 (u1 13 · u2 1, 평소·죽음·범위 밖 제외) — 실제 " .. tostring(cnt.u1) .. "/" .. tostring(cnt.u2))
end

-- InflowTick 통합: 숨 고르기 12초 동안 실제 유입 0 · 상한에서 보류 · [VRF] 사유 로그
do
  local S = spawner()
  S.RespawnSec = 60
  local spawned = 0
  S.SpawnInflow = function() spawned = spawned + 1 return true end
  _RaidDirector = { State = function() return nil end }
  local p1 = player("u1", 0, 0, 0)
  local mons = { monster("a", 3, 0), monster("b", 4, 0) }
  _Util.MonstersNear = function(_, map, c, r)
    local out = {}
    for _, m in ipairs(mons) do if not m.IsDead and (m.Entity.pos - c):Magnitude() <= r then table.insert(out, m) end end
    return out
  end
  local chasers = {}
  _Util.ListOf = function() return chasers end
  logs = {}
  _UtilLogic.ElapsedSeconds = 0 S:InflowTick(MAP, { p1 })
  check(spawned == 1, "A-2 InflowTick: 무리와 싸우는 동안은 유입 1마리")
  mons[1].IsDead = true mons[2].IsDead = true
  local during = 0
  for t = 1.5, 13.5, 1.5 do
    _UtilLogic.ElapsedSeconds = t
    local before = spawned
    S:InflowTick(MAP, { p1 })
    if t < 13.5 then during = during + (spawned - before) end
  end
  check(during == 0, "A-2 InflowTick: 정리 뒤 12초 동안 유입 0마리 (실제 " .. during .. ")")
  check(spawned == 2, "A-2 InflowTick: 12초가 지나면 다시 들어온다")
  local sawHold, sawResume = false, false
  for _, l in ipairs(logs) do
    if l:find("%[VRF%] inflow hold .*why=rest") then sawHold = true end
    if l:find("%[VRF%] inflow resume") then sawResume = true end
  end
  check(sawHold and sawResume, "A-2 [VRF] inflow hold why=rest · inflow resume 로그")
  for i = 1, 10 do table.insert(chasers, monster("c" .. i, 2, 0, { state = 1 })) end
  logs = {}
  local before = spawned
  _UtilLogic.ElapsedSeconds = 30 S:InflowTick(MAP, { p1 })
  local sawCap = false
  for _, l in ipairs(logs) do if l:find("why=cap") then sawCap = true end end
  check(spawned == before and sawCap, "A-2 InflowTick: 쫓는 몬스터 10이면 유입 보류 · [VRF] why=cap")
end

-- ───────── A-3 추격 이력 ─────────
local function attacker(opt)
  opt = opt or {}
  local A = setmetatable({}, { __index = MonsterAttack })
  local chase = { Enable = true, DetectionRange = opt.detect or 4 }
  local state = { CurrentStateName = "MOVE", ChangeState = function(self, s) self.CurrentStateName = s end }
  local body = { IsDead = false, Inflow = opt.inflow == true, Horde = opt.horde == true }
  local moved = {}
  A.Entity = { Name = "mob", pos = Vector2(0, 0), Enable = true, CurrentMap = MAP, AIChaseComponent = chase, StateComponent = state,
    MovementComponent = { MoveToDirection = function(_, d) table.insert(moved, d) end } }
  A.Entity.GetComponent = function(_, k) if k == "script.Monster" then return body end return nil end
  return A, chase
end
do
  local A = attacker()
  A.ChaseBaseDetect = 4
  check(A.ChaseHoldSec == 1.5 and A.LoseMul == 1.4 and A.WanderPauseSec == 0.6, "A-3 기본값 ChaseHoldSec 1.5 · LoseMul 1.4 · WanderPauseSec 0.6")
  check(A:ChaseDecide(3.9, 0) == "engage", "A-3 감지 4칸 안이면 추격 시작")
  check(A:ChaseDecide(9, 0.2) == "" and A:ChaseDecide(9, 1.4) == "" and A.ChaseState == 1, "A-3 시작 1.5초 안에는 질주로 9칸 벗어나도 놓치지 않음")
  check(A:ChaseDecide(5.5, 1.6) == "settle" and A.ChaseState == 1, "A-3 1.5초 뒤 5.5칸(감지 4 < 5.5 ≤ 5.6)은 계속 추격 — 예전엔 4.1칸에서 끊겼다")
  check(A:ChaseDecide(5.7, 2.0) == "lose" and A.ChaseState == 2, "A-3 감지×1.4=5.6칸을 넘으면 놓침")
  check(A:ChaseDecide(5.0, 2.3) == "" and A.ChaseState == 2, "A-3 놓친 뒤 0.6초 안에는 감지 밖(5칸)이면 멈춰 있음")
  check(A:ChaseDecide(5.0, 2.61) == "resume" and A.ChaseState == 0, "A-3 0.6초 뒤 원래 동작으로")
  check(A:ChaseDecide(3.0, 2.8) == "engage", "A-3 다시 감지 안이면 바로 추격")
  -- 경계에서 흔들리는 플레이어: 감지 4칸 ±0.4로 0.2초마다 오락가락 20초
  local B = attacker() B.ChaseBaseDetect = 4
  local loses, t = 0, 0
  for i = 1, 100 do
    t = t + 0.2
    local d = (i % 2 == 0) and 3.6 or 4.4
    if B:ChaseDecide(d, t) == "lose" then loses = loses + 1 end
  end
  check(loses == 0 and B.ChaseState == 1, "A-3 감지 경계(3.6↔4.4칸)를 오가는 플레이어에게 20초 동안 끊김 0번 (예전 네이티브는 0.2초마다 추격↔멈춤)")
end
do
  -- UpdateChaseHold: 실제 감지 범위 쓰기·멈춤·재개
  local A, chase = attacker()
  local P = player("u1", 3.5, 0)
  _Util.PlayersNear = function(_, map, c, r) if (P.pos - c):Magnitude() <= r then return { P } end return {} end
  _UtilLogic.ElapsedSeconds = 10
  A:UpdateChaseHold(1)
  check(A.ChaseState == 1 and math.abs(chase.DetectionRange - 8.4) < 1e-9, "A-3 추격 시작: 감지 범위 4 → 8.4 (1.5초 유지 동안)")
  _UtilLogic.ElapsedSeconds = 11.6 P.pos = Vector2(5, 0)
  A:UpdateChaseHold(1)
  check(math.abs(chase.DetectionRange - 5.6) < 1e-9 and chase.Enable, "A-3 1.5초 뒤 감지 범위 5.6 (놓치는 거리 = 4 × 1.4)")
  _UtilLogic.ElapsedSeconds = 12 P.pos = Vector2(7, 0)
  logs = {}
  A:UpdateChaseHold(1)
  check(A.ChaseState == 2 and chase.Enable == false and chase.DetectionRange == 4 and A.Entity.StateComponent.CurrentStateName == "IDLE", "A-3 놓치면 추적 끄고 서기 · 감지 범위 4로")
  check(#logs == 1 and logs[1]:find("%[VRF%] chase lose"), "A-3 [VRF] chase lose 로그")
  _UtilLogic.ElapsedSeconds = 12.4 A:UpdateChaseHold(1)
  check(chase.Enable == false, "A-3 0.6초 정지 중")
  _UtilLogic.ElapsedSeconds = 12.7 A:UpdateChaseHold(1)
  check(chase.Enable == true and A.ChaseState == 0, "A-3 0.6초 뒤 추적 다시 켬 (원래 동작)")
  A:ResetChaseHold()
  check(A.ChaseState == 0 and chase.DetectionRange == 4, "A-3 리스폰 때 추격 이력·감지 범위 처음으로")
  -- 떼·유입·다른 곳이 바꾼 범위는 손대지 않는다
  local H, hc = attacker({ inflow = true, detect = 40 })
  H:UpdateChaseHold(1)
  check(H.ChaseExternal and hc.DetectionRange == 40, "A-3 유입 몬스터(감지 40)는 손대지 않음")
  local R, rc = attacker()
  P.pos = Vector2(2, 0)
  _UtilLogic.ElapsedSeconds = 20 R:UpdateChaseHold(1)
  rc.DetectionRange = 40   -- 길 위 사건(RoadAltar)이 나중에 raidHordeDetect로
  _UtilLogic.ElapsedSeconds = 20.4 R:UpdateChaseHold(1)
  check(R.ChaseExternal and rc.DetectionRange == 40, "A-3 다른 곳이 감지 범위를 바꾸면 손 뗀다")
end
do
  -- 사거리 안 정지: AttackRange 0.8 → reach 0.95
  local A = attacker() A.AttackRange = 0.8 A.SpacingMode = 0
  local seq = { 0.5, 0.3, 0.05, 0.9, 0.94 }
  local ok = true
  for _, d in ipairs(seq) do if A:SpacingDecide(d) ~= 0 then ok = false end end
  check(ok, "A-3 사거리 안(0.05~0.94칸)에서는 늘 멈춤 — 물러나기(-1)·다가감 없음 (예전 0.3칸에서 물러남)")
  check(A:SpacingDecide(1.2) == 1 and A:SpacingDecide(0.9) == 1 and A:SpacingDecide(0.84) == 0, "A-3 사거리 밖에서만 다가가고 사거리 −0.1(0.85)에 닿으면 멈춤")
  check(A:SpacingDecide(0.94) == 0 and A:SpacingDecide(0.96) == 1, "A-3 멈춘 뒤엔 사거리를 벗어나야(0.96) 다시 다가감")
  local neg = false
  for i = 0, 400 do if A:SpacingDecide(i * 0.005) < 0 then neg = true end end
  check(not neg, "A-3 어떤 거리에서도 물러남(-1) 0번")
end

-- ───────── A-4 펫 ─────────
local function petSys()
  local P = setmetatable({ Vis = {}, Jobs = {}, NextJobAt = {}, Skip = {} }, { __index = PetSystem })
  return P
end
local PET = { idle = "i1,i2", run = "r1,r2", scale = 1 }
local function petVis(P, uid, pos, now)
  local e = { TransformComponent = {}, SpriteRendererComponent = { SpriteRUID = "" } }
  P.Vis[uid] = { e = e, pos = pos, goal = nil, goalUntil = 0, speed = P.Speed, flip = 1, last = nil, map = MAP, moving = false,
    dest = nil, mode = "stand", nudgeAt = now + 2, ownerVel = Vector2(0, 0) }
  return P.Vis[uid]
end
_Util.ReachablePoint = function(_, map, from, to) return to end
do
  local P = petSys()
  check(P.Reach == 8 and P.FollowStart == 3 and P.FollowStop == 2 and P.NudgeDist == 0.3 and P.RetargetSec == 0.4, "A-4 기본값 Reach 8 · FollowStart 3 · FollowStop 2 · NudgeDist 0.3 · RetargetSec 0.4")
  local owner = player("u1", 0, 0)
  local v = petVis(P, "u1", Vector2(-1.75, -0.1), 0)
  v.last = owner.pos
  local seq = {}
  for i = 1, 400 do seq[i] = ((i * 37) % 100) / 100 end
  _UtilLogic.seq = seq _UtilLogic.i = 0
  local maxD, path, nudges, lastNudgeAt, minGap, moveFrames = 0, 0, 0, nil, 99, 0
  local prevMode = v.mode
  local t, dt = 0, 1 / 30
  local prev = v.pos
  for i = 1, 30 * 60 do
    t = t + dt
    _UtilLogic.ElapsedSeconds = t
    P:DrawPet("u1", owner, MAP, t, dt, PET)
    maxD = math.max(maxD, (v.pos - owner.pos):Magnitude())
    path = path + (v.pos - prev):Magnitude()
    prev = v.pos
    if v.moving then moveFrames = moveFrames + 1 end
    if v.mode == "nudge" and prevMode ~= "nudge" then
      nudges = nudges + 1
      if lastNudgeAt then minGap = math.min(minGap, t - lastNudgeAt) end
      lastNudgeAt = t
    end
    prevMode = v.mode
  end
  check(maxD <= 2.0 + 1e-6, string.format("A-4 주인이 서 있는 60초 동안 펫은 주인 2칸 안 (최대 %.2f)", maxD))
  check(nudges >= 12 and nudges <= 30 and minGap >= 2 - 1e-6, string.format("A-4 미세 이동은 2~4초 간격 (60초에 %d번 · 최소 간격 %.2f초)", nudges, minGap))
  check(path <= nudges * 0.3 + 1e-6, string.format("A-4 배회 없음: 60초 이동 거리 %.2f칸 ≤ 미세 이동 %d × 0.3", path, nudges))
  check(moveFrames < 30 * 60 * 0.25, string.format("A-4 하루 종일 뛰지 않음: 움직인 시간 %.0f%%", moveFrames / (30 * 60) * 100))

  -- 따라가기: 2~3칸은 그대로 · 3칸 넘으면 따라가 2칸 안에서 정지
  local P2 = petSys()
  local o2 = player("u2", 0, 0)
  local v2 = petVis(P2, "u2", Vector2(-2, 0), 0)
  v2.nudgeAt = 1e9
  v2.last = o2.pos
  o2.pos = Vector2(0.8, 0)    -- 거리 2.8
  local still = true
  t = 0
  for i = 1, 30 do
    t = t + dt
    local before = v2.pos
    P2:DrawPet("u2", o2, MAP, t, dt, PET)
    if (v2.pos - before):Magnitude() > 1e-9 then still = false end
  end
  check(still and v2.mode == "stand", "A-4 주인과 2.8칸(3칸 이하)이면 따라가지 않고 서 있음")
  o2.pos = Vector2(1.3, 0)    -- 거리 3.3
  local followed, stopD = false, nil
  for i = 1, 30 * 4 do
    t = t + dt
    P2:DrawPet("u2", o2, MAP, t, dt, PET)
    if v2.mode == "follow" then followed = true end
  end
  stopD = (v2.pos - o2.pos):Magnitude()
  check(followed and v2.mode == "stand" and stopD <= 2.0 + 1e-6 and stopD >= 1.5, string.format("A-4 3칸 넘으면 따라가 1.5~2칸 안에서 정지 (멈춘 거리 %.2f)", stopD))

  -- 줍기: 6칸 떨어진 전리품으로 가서 줍고 돌아옴
  local P3 = petSys()
  local o3 = player("u3", 0, 0)
  local v3 = petVis(P3, "u3", Vector2(-1.75, 0), 0)
  v3.nudgeAt = 1e9
  v3.last = o3.pos
  t = 100 _UtilLogic.ElapsedSeconds = t
  P3:ShowFetch("u3", 6, 0, 0.15 + 7.75 / P3.Speed)
  local reached, returned = false, false
  for i = 1, 30 * 6 do
    t = t + dt
    _UtilLogic.ElapsedSeconds = t
    P3:DrawPet("u3", o3, MAP, t, dt, PET)
    if (v3.pos - Vector2(6, 0)):Magnitude() < 0.05 then reached = true end
    if reached and v3.mode == "stand" then returned = true break end
  end
  local back = (v3.pos - o3.pos):Magnitude()
  check(reached and returned and back <= 2.0 + 1e-6, string.format("A-4 줍기: 전리품 자리까지 갔다가 주인 2칸 안으로 돌아와 섬 (돌아온 거리 %.2f)", back))
end
do
  -- 서버 줍기: 8칸 안 · 목표 전환 0.4초
  local P = petSys()
  local inv = { Pickup = function(_, drop) drop.Taken = true end }
  local save = { PetFilter = 1 }
  local owner = player("u1", 0, 0)
  owner.GetComponent = function(_, k) if k == "script.PlayerInventory" then return inv elseif k == "script.PlayerSave" then return save end return nil end
  local function drop(id, x)
    local d = { Kind = "gold", Taken = false, ItemString = "", Rarity = 0 }
    d.Entity = { Id = id, pos = Vector2(x, 0), GetComponent = function() return d end }
    d.CanTake = function() return not d.Taken end
    return d
  end
  local drops = { drop("far", 8.5), drop("d75", 7.5) }
  MAP.GetChildComponentsByTypeName = function() local out = {} for _, d in ipairs(drops) do if not d.Taken then table.insert(out, d) end end return out end
  owner.CurrentMap = MAP
  P:TickOwner("u1", owner, 0)
  local job = P.Jobs.u1
  check(job ~= nil and job.drop.Id == "d75", "A-4 주인 8칸 안(7.5칸) 전리품을 주우러 감 — 예전 Reach 6이면 안 갔다 · 8.5칸은 안 감")
  table.insert(drops, drop("next", 3))
  local at = job.at
  P:TickOwner("u1", owner, at)
  check(drops[2].Taken and P.Jobs.u1 == nil, "A-4 도착하면 줍는다 (가방 판단은 기존 PlayerInventory.Pickup)")
  P:TickOwner("u1", owner, at + 0.2)
  check(P.Jobs.u1 == nil, "A-4 다음 목표는 0.4초 안에 정하지 않음 (목표 전환 최소 간격)")
  P:TickOwner("u1", owner, at + 0.41)
  check(P.Jobs.u1 ~= nil and P.Jobs.u1.drop.Id == "next", "A-4 0.4초 뒤 다음 전리품으로")
end

print(string.format("[playfeedback_a] 실패 %d", fails))
if fails > 0 then os.exit(1) end
