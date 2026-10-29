-- I08 현장 보고 (10-30): 의식 의뢰 4 보고 · 의뢰 5 수락을 피의 제단 앞에서 — 실제 PlayerQuest 본문(NearGiver·FieldHandoff*·RequestAccept·RequestTurnIn)을 돌린다.
--   TurnIn(보상 지급)은 아이템 담당 구간이라 대신한다(지급 횟수·가방 거절만 흉내). 엔진 동기화·실제 제단 엔티티 생성·UI는 메이커 몫
-- @source PlayerQuest Quest/PlayerQuest.mlua Current,SameDifficulty,NearGiver,FieldHandoffQuest,FieldHandoffStep,FieldHandoffMarker,FieldHandoffOk,RequestAccept,RequestTurnIn,IsGearChoiceQuest,TraceQuestStep,FirstGearQuest,StartGearWatch,GearChangedSlot,NoteGearEquipped,TraceGearUse,NoteGearAtCredit,GetSaveData
function isvalid(x) return x ~= nil end
local Q = {
  [1] = { title = "빈 굴", kind = "clear", map = "hollow", map1 = "", giver = "quest", act = 1, reward = "skp:2,gen:3" },
  [2] = { title = "모르그", kind = "boss", map = "cellar2", map1 = "", giver = "quest", act = 1, reward = "deploy:1,unique:1,choice:1" },
  [3] = { title = "유물", kind = "boss", map = "pit2", map1 = "", giver = "smith", act = 1, reward = "gen:3,socket:1" },
  [4] = { title = "피의 제단", kind = "ritual", map = "gallows", map1 = "blood_altar", giver = "quest", act = 1, reward = "stp:5" },
  [5] = { title = "목 없는 처형인", kind = "chest", map = "cave", map1 = "gallows", giver = "quest", act = 1, reward = "runes:1,choice:2" },
  [6] = { title = "묘지기 여왕", kind = "kill", map = "queentomb", map1 = "", giver = "quest", act = 1, reward = "unique:1" },
}
_QuestData = { Get = function(_, i) return Q[i] end, Count = function() return 6 end }
_GameData = { questFieldHandoff = 4, questFieldHandoffRange = 2.5 }
_GameConst = {
  BaseMapName = function(_, n) return (string.gsub(n, "_nm$", ""):gsub("_hell$", "")) end,
  DifficultyOfMap = function(_, n) if n:match("_nm$") then return 1 elseif n:match("_hell$") then return 2 end return 0 end,
}
local tel = {}
local activity = 0
_Telemetry = { First = function(_, _, stage) tel[stage] = (tel[stage] or 0) + 1 end, NoteActivity = function() activity = activity + 1 end }
_UtilLogic = { ElapsedSeconds = 0 }
local altar = { pos = { 9.5, 16.5 } }
local markers = { { MarkerId = "blood_altar", Entity = altar }, { MarkerId = "other", Entity = { pos = { 0, 0 } } } }
local function map(name) return { Name = name, GetChildComponentsByTypeName = function(_, t) assert(t == "script.QuestMarker") return markers end } end
local inv = { Equip = { weapon = "scythe1" } }
local player = { PlayerComponent = { UserId = "owner" }, pos = { 9.5, 15 }, CurrentMap = map("gallows"),
  GetComponent = function(_, t) if t == "script.PlayerInventory" then return inv end end }
local alive, nearNpc = true, false
_Util = {
  NearNpc = function(_, e, giver) return nearNpc end,
  IsAlive = function() return alive end,
  Notify = function(_, text) notices = (notices or 0) + 1 end,
  Distance = function(_, a, b) return math.sqrt((a.pos[1] - b.pos[1]) ^ 2 + (a.pos[2] - b.pos[2]) ^ 2) end,
}
local pq = PlayerQuest
pq.Entity = player
pq.NotifyAccepted = function() end
pq.OfferGearChoice = function() return false end   -- 10-30 A 병합: 부위 고르기 제안은 items_reforge가 진짜 본문으로 확인 — 여기선 제안 없음 = 기존 보고 경로
local grants, bagFull = 0, false
pq.TurnIn = function(self, gearSlot)   -- 지급부 대역: 기존 TurnIn처럼 State 2·생존·가방을 보고 한 번만 넘긴다
  if self.State ~= 2 or not alive then return end
  local reportIndex = self.Index
  local reportField = not _Util:NearNpc(self.Entity, _QuestData:Get(reportIndex).giver)
  if bagFull then return end
  grants = grants + 1
  self.Index = self.Index + 1
  self.State = 0
  -- 10-30 통합(P8): 실제 TurnIn 공통 성공 경로 끝과 같은 후처리 (실제 본문은 items·items_reforge가 진짜 TurnIn으로 확인)
  self:TraceQuestStep(reportIndex, "report", reportField)
  _Telemetry:NoteActivity(self.Entity)
  if reportIndex == self:FirstGearQuest() and self.Diff == 0 then self:StartGearWatch() end
end
local saved = { ByDiff = pq.ByDiff, Sealed = pq.Sealed, ChoicePicks = pq.ChoicePicks, ChoiceTiers = pq.ChoiceTiers }
local function set(i, s, d, mapName, pos) pq.Index, pq.State, pq.Diff = i, s, d or 0; player.CurrentMap = map(mapName or "gallows"); player.pos = pos or { 9.5, 15 }; alive = true; nearNpc = false; bagFull = false end
local cases = 0
local function expectTurnIn(ok, why) local g, i = grants, pq.Index; senderUserId = senderUserId or "owner"; pq:RequestTurnIn(pq.Index); cases = cases + 1; assert((grants == g + 1) == ok, why .. ": turn-in " .. tostring(ok)); if not ok then assert(pq.Index == i, why .. ": index moved") end end
local function expectAccept(ok, why) local s = pq.State; pq:RequestAccept(pq.Index); cases = cases + 1; assert((pq.State == 1 and s == 0) == ok, why .. ": accept " .. tostring(ok)) end
senderUserId = "owner"

-- 정상: q4 완료(2) → 제단 보고 1회 → q5(0) 제단 수락 → 진행 중(1)
set(4, 2); expectTurnIn(true, "altar q4 report"); assert(pq.Index == 5 and pq.State == 0)
assert(tel.q4report == 1 and tel.q4reportField == 1, "telemetry field report")
-- 두 번째(재전송·동시 입력): 지급 없음 (expectedIndex 4는 이미 지난 번호)
local g = grants; pq:RequestTurnIn(4); pq:RequestTurnIn(4); assert(grants == g, "duplicate report paid"); cases = cases + 2
nearNpc = true; pq:RequestTurnIn(4); nearNpc = false; assert(grants == g, "NPC duplicate after altar report"); cases = cases + 1
expectAccept(true, "altar q5 accept"); assert(tel.q5accept == 1 and tel.q5acceptField == 1)
pq:RequestAccept(5); assert(pq.State == 1); cases = cases + 1
-- 거절: 차례가 아님 · 다른 의뢰 · 다른 맵 · 다른 난이도 · 거리 밖 · 사망 · 다른 보낸 사람 · 오래된 번호 · q5 최종 보고 · q6 수락
set(4, 1); expectTurnIn(false, "q4 not complete")
set(4, 0); expectAccept(false, "q4 accept is town only")
set(3, 2); expectTurnIn(false, "other quest q3")
set(4, 2, 0, "rotmarsh"); expectTurnIn(false, "other map")
set(4, 2, 0, "gallows_nm"); expectTurnIn(false, "other difficulty map")
set(4, 2, 1, "gallows_nm"); expectTurnIn(true, "nightmare altar on nightmare map")
set(4, 2, 0, "gallows", { 9.5, 13.9 }); expectTurnIn(false, "out of range 2.6")
set(4, 2); alive = false; expectTurnIn(false, "dead")
set(4, 2); senderUserId = "intruder"; expectTurnIn(false, "other sender"); senderUserId = "owner"
set(4, 2); g = grants; pq:RequestTurnIn(3); assert(grants == g, "stale expectedIndex"); cases = cases + 1
set(5, 2); expectTurnIn(false, "q5 final report stays in town")
set(6, 0); expectAccept(false, "q6 accept stays in town")
set(5, 0); markers[1].MarkerId = "moved"; expectAccept(false, "no altar entity on server"); markers[1].MarkerId = "blood_altar"
set(4, 2); _GameData.questFieldHandoff = 0; expectTurnIn(false, "config off"); _GameData.questFieldHandoff = 4
-- 가방 부족: 거절되면 진행·기록 그대로 (다시 시도 가능)
set(4, 2); bagFull = true; local t = tel.q4report; expectTurnIn(false, "bag full"); assert(pq.Index == 4 and pq.State == 2 and tel.q4report == t)
bagFull = false; expectTurnIn(true, "retry after bag")
-- 마을 의뢰인 경로는 어디서나 그대로 (맵·제단과 무관)
set(4, 2, 0, "town", { 0, 0 }); nearNpc = true; expectTurnIn(true, "town NPC report")
set(5, 0, 0, "town", { 0, 0 }); nearNpc = true; expectAccept(true, "town NPC accept")
set(5, 2, 0, "town", { 0, 0 }); nearNpc = true; expectTurnIn(true, "town q5 final report")
-- 저장 형식(ByDiff·Sealed·ChoicePicks·ChoiceTiers)은 손대지 않는다
assert(pq.ByDiff == saved.ByDiff and pq.Sealed == saved.Sealed and pq.ChoicePicks == saved.ChoicePicks and pq.ChoiceTiers == saved.ChoiceTiers)
-- 첫 장비 안내·관측: 장비를 주는 첫 의뢰(1) 보고에만 안내 한 번 · 기억한 뒤 새로 낀 장비로 처음 처치하면 gearUse 한 번
assert(pq:FirstGearQuest() == 1)
notices = 0
set(1, 2, 0, "town", { 0, 0 }); nearNpc = true; expectTurnIn(true, "q1 report"); assert(notices == 1 and pq.GearWatch and tel.gearReward == 1, "gear guidance once")
-- 10-30 F AD0137: gearUse = 수동 장착 성공(GearEquipped → NoteGearEquipped) 뒤 그 기본 맵의 유효 피해(PlayerDealtDamage → TraceGearUse(맵 이름)) — 연결은 growth 그룹
local here = "town"
pq:TraceGearUse(here); assert(tel.gearUse == nil, "same gear is not use")
inv.Equip.weapon = "scythe1"; inv.Equip.helm = nil; pq:TraceGearUse(here); assert(tel.gearUse == nil)
inv.Equip.armor = "rare-armor"; pq:NoteGearAtCredit(); assert(tel.gearChangedAtCredit == 1 and tel.gearUse == nil and pq.GearWatch, "credit only is not use")
pq:TraceGearUse(here); assert(tel.gearUse == nil and pq.GearWatch, "worn without a successful manual equip is not use")
pq:NoteGearEquipped("armor")
pq:TraceGearUse("cellar1"); assert(tel.gearUse == nil and pq.GearWatch, "damage on another map")
alive = false; pq:TraceGearUse(here); alive = true; assert(tel.gearUse == nil, "dead owner")
inv.Equip.armor = nil; pq:TraceGearUse(here); assert(tel.gearUse == nil and pq.GearWatch, "reverted before fight")
inv.Equip.armor = "rare-armor"; pq:TraceGearUse(here); assert(tel.gearUse == 1 and not pq.GearWatch, "first effective damage with new gear")
inv.Equip.boots = "x"; pq:TraceGearUse(here); assert(tel.gearUse == 1, "gear use once")
set(1, 2, 1, "town_nm", { 0, 0 }); nearNpc = true; notices = 0; expectTurnIn(true, "nightmare q1"); assert(notices == 0, "no guidance on replay difficulty")
set(3, 2, 0, "town", { 0, 0 }); nearNpc = true; notices = 0; expectTurnIn(true, "q3 report"); assert(notices == 0, "guidance only for first gear quest")
local sv = pq:GetSaveData(); for k in pairs(sv) do assert(({ i = 1, s = 1, p = 1, v = 1, d1 = 1, d2 = 1, sc0 = 1, sc1 = 1, sc2 = 1, st = 1, cp = 1, ch0 = 1, ch1 = 1, ch2 = 1 })[k], "save key " .. k) end
-- 클라이언트 안내: 난이도 확인 없이 제단만 찾는다 (서버가 다시 본다)
set(4, 2, 0, "gallows_nm"); assert(pq:FieldHandoffMarker(false) == altar and pq:FieldHandoffMarker(true) == nil)
print(string.format("[quality/progression] I08 현장 보고: %d 장면 · 지급 %d회 · 제단 보고/수락 · 중복·재전송·NPC 동시 0 · 거절 13종 · 가방 부족 재시도 · 마을 경로 · 저장 형식 그대로 · 첫 장비 안내 1회·gearUse 1회(같은 장비·악몽·다른 의뢰 0)", cases, grants))
