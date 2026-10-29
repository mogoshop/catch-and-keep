-- I08 첫 장비 관측 ↔ 의뢰 크레딧 분리 (10-30 코덱스 D-GROWTH-01): 실제 QuestSystem 「MonsterKilled」 처리(OnBeginPlay 구독 본문 · CreditSet · WithWholeParty)와
--   PlayerQuest(GearChangedSlot · TraceGearUse · NoteGearAtCredit)로, 공동 보스 크레딧만 받은 마을·다른 맵·죽은 파티원은 gearUse가 아니고
--   막타 주인이 그 맵에서 살아서 새 장비를 낀 채 싸웠을 때만 gearUse인지 본다. 의뢰 진행(OnKill 등)은 대역
-- @source QuestSystem Quest/QuestSystem.mlua OnBeginPlay,WithWholeParty,CreditSet,QuestOf
-- @source PlayerQuest Quest/PlayerQuest.mlua GearChangedSlot,TraceGearUse,NoteGearAtCredit
function isvalid(x) return x ~= nil end
local handlers = {}
_GameEvents = { Subscribe = function(_, name, _, fn) handlers[name] = fn end }
_Telemetry = { First = function(_, e, stage) e.tel[stage] = (e.tel[stage] or 0) + 1 end }
local credits = {}
PlayerQuest.OnKill = function(self) credits[self.Entity.PlayerComponent.UserId] = (credits[self.Entity.PlayerComponent.UserId] or 0) + 1 end
PlayerQuest.Current = function() return nil end
PlayerQuest.OnNamedKilled = function() end
local bossMap = { Name = "cellar2", players = {} }
local town = { Name = "town", players = {} }
local party = {}
_PartySystem = { Members = function(_, p) return party end }
_Util = { PlayersInMap = function(_, m) return m.players end, IsAlive = function(_, e) return e.alive end }
local function player(id, map, equip)
  local e = { PlayerComponent = { UserId = id }, CurrentMap = map, alive = true, tel = {}, inv = { Equip = equip } }
  e.quest = setmetatable({ Entity = e, GearWatch = true, GearMark = { weapon = "old" } }, { __index = PlayerQuest })
  e.GetComponent = function(_, t) if t == "script.PlayerQuest" then return e.quest elseif t == "script.PlayerInventory" then return e.inv end end
  table.insert(map.players, e)
  return e
end
local A = player("A", bossMap, { weapon = "new" })     -- 막타 주인 · 새 장비
local B = player("B", town, { weapon = "new" })        -- 마을에 있는 파티원 · 장비만 바꿈
local C = player("C", bossMap, { weapon = "new" })     -- 같은 맵 파티원 · 막타 아님
local D = player("D", bossMap, { weapon = "old" })     -- 바꿨다가 되돌림
party = { A, B, C, D }
QuestSystem:OnBeginPlay()
local kill = handlers["MonsterKilled"]
local function bossKill(by) kill({ map = bossMap, player = by, players = { by }, boss = true, sourceId = "morg", named = "" }) end
-- ① 공동 보스(맵 전원 + 파티 전원 크레딧): 크레딧은 4명 모두 그대로, gearUse는 막타 주인 A만
bossKill(A)
assert(credits.A == 1 and credits.B == 1 and credits.C == 1 and credits.D == 1, "party credit policy unchanged")
assert(A.tel.gearUse == 1 and not A.quest.GearWatch, "killer with new gear")
assert(B.tel.gearUse == nil and B.tel.gearChangedAtCredit == 1 and B.quest.GearWatch, "town credit is not use")
assert(C.tel.gearUse == nil and C.tel.gearChangedAtCredit == 1 and C.quest.GearWatch, "same-map credit without last hit is not use")
assert(D.tel.gearUse == nil and D.tel.gearChangedAtCredit == nil and D.quest.GearWatch, "reverted gear: nothing")
-- ② 죽은 막타 주인 · 다른 맵 이벤트는 사용 아님
C.alive = false; bossKill(C); assert(C.tel.gearUse == nil and C.quest.GearWatch, "dead killer"); C.alive = true
kill({ map = town, player = C, players = { C }, boss = false, sourceId = "x", named = "" }); assert(C.tel.gearUse == nil, "event map ~= player map")
-- ③ B가 실제로 와서 새 장비로 싸우면 그때 gearUse 한 번
B.CurrentMap = bossMap; table.insert(bossMap.players, B)
kill({ map = bossMap, player = B, players = { B }, boss = false, sourceId = "skel", named = "" })
assert(B.tel.gearUse == 1 and not B.quest.GearWatch, "actual post-equip fight")
-- ④ D가 다시 새 장비를 끼고 막타 → gearUse
D.inv.Equip.weapon = "new2"; kill({ map = bossMap, player = D, players = { D }, boss = false, sourceId = "skel", named = "" })
assert(D.tel.gearUse == 1, "re-equipped then fought")
print("[quality/growth] D-GROWTH-01: 공동 보스 크레딧 4/4 그대로 · gearUse는 막타 주인만(마을·같은 맵 비막타·되돌림·사망·다른 맵 0) · 크레딧 때 달라짐은 gearChangedAtCredit · 실제 이후 전투 양성 2")
