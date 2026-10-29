-- I08 첫 장비 관측 ↔ 의뢰 크레딧 분리 (10-30 코덱스 D-GROWTH-01 → F AD0137 통합): 실제 QuestSystem 구독 본문(MonsterKilled · GearEquipped · PlayerDealtDamage)과
--   실제 발행 쪽(PlayerInventory.RequestEquip → GearEquipped · Telemetry.DealtDamage/ArmDealt → PlayerDealtDamage), 실제 PlayerQuest 받는 쪽
--   (NoteGearEquipped · TraceGearUse · NoteGearAtCredit)으로 본다. gearUse = 첫 장비 의뢰 뒤 「수동 장착 성공 → 그 장비를 낀 채 본인/소환수의 유효 피해」 한 번.
--   공동 크레딧(막타 포함)은 사용 증거가 아니다 — 크레딧 정책 4/4 그대로 · 크레딧 때 달라짐은 gearChangedAtCredit만. 의뢰 진행(OnKill 등)은 대역.
--   Monster.ApplyHpDamage가 「유효 피해 > 0 · 공격자 유효」일 때만 DealtDamage를 부르는 조건(흡수·빗나감 0)은 dps 그룹이 확인한다.
-- @source QuestSystem Quest/QuestSystem.mlua OnBeginPlay,WithWholeParty,CreditSet,QuestOf
-- @source PlayerQuest Quest/PlayerQuest.mlua GearChangedSlot,NoteGearEquipped,TraceGearUse,NoteGearAtCredit
-- @source PlayerInventory Item/PlayerInventory.mlua RequestEquip
-- @source Telemetry Progress/Telemetry.mlua GrowthOf,DealtDamage,ArmDealt
function isvalid(x) return x ~= nil end
local bus, emitted = {}, {}
_GameEvents = {
  Subscribe = function(_, name, key, fn) bus[name] = bus[name] or {}; bus[name][key] = fn end,
  Emit = function(_, name, e)
    emitted[name] = (emitted[name] or 0) + 1
    if name == "GearEquipped" then assert(e.base ~= nil and e.item == nil and e.prevBase ~= nil, "GearEquipped carries no full item string") end
    for _, fn in pairs(bus[name] or {}) do fn(e) end
  end,
}
_UtilLogic = { ElapsedSeconds = 10 }
_GameConst = { BaseMapName = function(_, n) return (string.gsub(n, "_nm$", ""):gsub("_hell$", "")) end }
_ItemData = {
  Parse = function(_, s) return { base = (string.match(s, "^(%w+)")), rarity = 2 } end,
  GetBase = function(_, b) return { slot = "weapon", reqLv = 1 } end,
}
_Telemetry = Telemetry
Telemetry.First = function(_, e, stage) e.tel[stage] = (e.tel[stage] or 0) + 1 end
local credits = {}
PlayerQuest.OnKill = function(self) credits[self.Entity.PlayerComponent.UserId] = (credits[self.Entity.PlayerComponent.UserId] or 0) + 1 end
PlayerQuest.Current = function() return nil end
PlayerQuest.OnNamedKilled = function() end
local bossMap = { Name = "cellar2", players = {} }
local town = { Name = "town", players = {} }
local party = {}
_PartySystem = { Members = function(_, p) return party end }
_Util = {
  PlayersInMap = function(_, m) return m.players end,
  IsAlive = function(_, e) return e.alive end,
  OwnerPlayerOf = function(_, a) return a.owner or a end,
  Warn = function() end,
}
local function player(id, map, weapon)
  local e = { PlayerComponent = { UserId = id }, CurrentMap = map, alive = true, tel = {} }
  local st = { Level = 40 }
  e.inv = setmetatable({ Entity = e, Bag = {}, Equip = { weapon = weapon } }, { __index = PlayerInventory })
  e.inv.IsOwnerRequest = function(_, s) return s == id end
  e.inv.RejectPending = function() return false end
  e.inv.Stats = function() return st end
  e.inv.RefreshDigest = function() end
  e.inv.ApplyEquipment = function() end
  e.inv.NotifyEquipped = function() end
  -- 첫 장비 의뢰 보고 직후 상태(StartGearWatch는 progression·items 그룹): 그때 낀 장비 기억 · 관측 중
  e.quest = setmetatable({ Entity = e, GearWatch = true, GearMark = { weapon = "old" }, GearArmed = {} }, { __index = PlayerQuest })
  e.GetComponent = function(_, t) if t == "script.PlayerQuest" then return e.quest elseif t == "script.PlayerInventory" then return e.inv end end
  table.insert(map.players, e)
  return e
end
local function equip(p, item)   -- 실제 RequestEquip(성공 경로): 가방 1칸에 넣고 본인이 요청
  p.inv.Bag = { item }
  senderUserId = p.PlayerComponent.UserId
  p.inv:RequestEquip(1, item)
end
local function mon(map) return { Entity = { CurrentMap = map }, SourceId = "skel" } end
local function hit(p, map, by)  -- Monster가 유효 피해 확인 뒤 부르는 지점 (by = 소환수면 주인 귀속)
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 2   -- 사용자당 1초 간격 밖
  Telemetry:DealtDamage(mon(map), by or p, "hit", "")
end
local A = player("A", bossMap, "new")    -- 막타 주인 · 새 장비를 이미 끼고 있음(수동 장착 성공 이벤트 없이)
local B = player("B", town, "new")       -- 마을에 있는 파티원 · 장비만 바뀜
local C = player("C", bossMap, "new")    -- 같은 맵 파티원 · 막타 아님
local D = player("D", bossMap, "old")    -- 바꿨다가 되돌림
party = { A, B, C, D }
QuestSystem:OnBeginPlay()
local kill = bus["MonsterKilled"]["QuestSystem"]
local function bossKill(by) kill({ map = bossMap, player = by, players = { by }, boss = true, sourceId = "morg", named = "" }) end
local checks = 0
local function ok(c, m) checks = checks + 1; assert(c, m) end
-- ① 공동 보스(맵 전원 + 파티 전원 크레딧): 크레딧 4/4 그대로 · 크레딧은 막타 주인 A를 포함해 누구에게도 사용 증거가 아니다
bossKill(A)
ok(credits.A == 1 and credits.B == 1 and credits.C == 1 and credits.D == 1, "party credit policy unchanged")
ok(A.tel.gearUse == nil and A.quest.GearWatch, "kill credit (even last hit) is not equipment use")
ok(B.tel.gearUse == nil and B.tel.gearChangedAtCredit == 1 and B.quest.GearWatch, "town credit is not use")
ok(C.tel.gearUse == nil and C.tel.gearChangedAtCredit == 1 and C.quest.GearWatch, "same-map credit is not use")
ok(D.tel.gearUse == nil and D.tel.gearChangedAtCredit == nil and D.quest.GearWatch, "reverted gear: nothing")
-- ② 장착 성공 이벤트 없이 낀 장비 + 유효 피해 = 사용 아님 (원시 장비 변경)
hit(A, bossMap); ok(A.tel.gearUse == nil and A.quest.GearWatch, "damage before manual equip success")
-- ③ 수동 장착 성공 → GearEquipped 한 번(전체 물건 글자 없음) → 장착 시각 기억 · 다음 유효 피해 간격 해제 → 그 맵 유효 피해 = gearUse 한 번
local before = emitted.GearEquipped or 0
equip(A, "sword2")
ok(emitted.GearEquipped == before + 1 and A.tel.gearEquip == 1 and A.quest.GearArmed.weapon ~= nil and A.quest.GearArmed.weapon.item == "sword2", "equip success emits once and arms the slot")
ok(Telemetry:GrowthOf("A").dealtAt == -100, "equip unthrottles the next effective damage")
Telemetry:DealtDamage(mon(bossMap), A, "hit", "")   -- 같은 시각 바로 다음 타격도 간격 해제로 통과
ok(A.tel.gearUse == 1 and not A.quest.GearWatch, "first effective damage with the newly equipped gear")
hit(A, bossMap); ok(A.tel.gearUse == 1, "gear use once")
-- ④ 다른 맵 유효 피해는 아님 · 그 맵으로 와서 싸우면 그때 (마을 장착 → 이동 → 전투도 인정)
equip(B, "axe3")
hit(B, bossMap); ok(B.tel.gearUse == nil and B.quest.GearWatch, "event map ~= player map")
B.CurrentMap = bossMap; table.insert(bossMap.players, B)
hit(B, bossMap); ok(B.tel.gearUse == 1 and not B.quest.GearWatch, "town equip then actual fight")
-- ⑤ 죽은 주인 · 다른 주인 · 소환수(주인 귀속)
equip(C, "bow4")
C.alive = false; hit(C, bossMap); ok(C.tel.gearUse == nil and C.quest.GearWatch, "dead owner"); C.alive = true
hit(D, bossMap); ok(C.tel.gearUse == nil, "other owner damage")
hit(C, bossMap, { owner = C }); ok(C.tel.gearUse == 1, "owned summon effective damage counts for its owner")
-- ⑥ 장착 뒤 되돌림(이벤트 없이) → 아님 · 기억한 옛 장비를 다시 장착(성공)하면 무장 해제 · 새 장비 다시 장착 → 인정
equip(D, "staff5"); D.inv.Equip.weapon = "old"
hit(D, bossMap); ok(D.tel.gearUse == nil and D.quest.GearWatch, "reverted before damage")
equip(D, "old"); ok(D.quest.GearArmed.weapon == nil, "re-equipping the remembered item clears the armed slot")
hit(D, bossMap); ok(D.tel.gearUse == nil, "still not use after manual revert")
equip(D, "staff6"); hit(D, bossMap); ok(D.tel.gearUse == 1, "re-equipped then fought")
print(string.format("[quality/growth] D-GROWTH-01 + F AD0137: %d checks · 공동 보스 크레딧 4/4 그대로(막타 포함 크레딧은 사용 아님) · gearUse = 수동 장착 성공(GearEquipped) 뒤 그 맵 유효 피해(PlayerDealtDamage) 한 번 · 마을 장착→이동 인정 · 원시 변경·다른 맵·사망·다른 주인·되돌림 0 · 소환수 주인 귀속 · 크레딧 때 달라짐은 gearChangedAtCredit", checks))
