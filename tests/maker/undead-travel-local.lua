-- server_main; 아래 room-enter/floor/return 검사와 연속 실행. 마지막 return 스크립트가 저장값을 복원한다.
local p = _UserService.UserEntities.Values[1]
assert(isvalid(p), "player")
local save = p:GetComponent("script.PlayerSave")
local uid = p.PlayerComponent.UserId
local c, memory = _RoomService:GetSharedMemory("CodexTravelVerification")
assert(c == SharedMemoryResultCode.OK)
local backup = { sections = save:Collect(), db = save:BatchGet({ "Char", "Inv", "Shadow" }) }
assert(memory:SetVariableAndWait(uid, _HttpService:JSONEncode(backup)).Code == SharedMemoryResultCode.OK)
save.IsLoadSuccess = false
for _, mapName in ipairs({"map01", "town"}) do
 local map = _EntityService:GetEntityByPath("/maps/" .. mapName)
 for _, m in ipairs(map:GetChildComponentsByTypeName("script.Monster", true)) do m.Entity.Enable = false end
end
_UndeadSystem:DismissAll(p)
local function check(ok, name)
 if ok then log("[VRF-UD] PASS " .. name) else log_error("[VRF-UD] FAIL " .. name) end
end
local kinds = { "skeleton", "mage", "revive" }
local list = _UndeadSystem:ListOf(p)
for i, kind in ipairs(kinds) do
 local rec = _UndeadSystem:MakeRecord(p, "skeleton", 2, nil)
 rec.kind = kind
 rec.hp = 100
 rec.currentHp = 20 + i
 rec.atk = 0
 if kind == "revive" then rec.expireAt = _UtilLogic.ElapsedSeconds + 55 end
 if kind == "mage" then rec.element = "cold" rec.range = 3.5 end
 table.insert(list, rec)
 assert(_UndeadSystem:SpawnUnit(p, rec, _Util:Pos2(p), nil, nil))
end
wait(0.3)
check(#list == 3 and isvalid(list[1].entity), "spawn all three kinds")
local snapshot = _UndeadSystem:TravelSnapshot(p, "other_room")
local round = _HttpService:JSONDecode(_HttpService:JSONEncode(snapshot))
check(#round.units == 3 and round.units[1].entity == nil and round.units[1].currentHp == 21, "serializable living HP snapshot")
check(round.units[3].expires > DateTime.UtcNow.Elapsed, "revive UTC expiry")
local originalExpiry = list[3].expireAt
local travel = p:GetComponent("script.PlayerTravel")
travel:Go("map01", Vector2(0, -6))
wait(0.2)
travel:Go("town", Vector2(0, 0))
wait(1.6)
local live = _UndeadSystem:ListOf(p)
local units = p.CurrentMap:GetChildComponentsByTypeName("script.ShadowUnit", true)
local n = 0
for _, u in ipairs(units) do if u.OwnerPlayer == p and u.Kind ~= "shadow" then n = n + 1 end end
check(#live == 3 and n == 3, "rapid map travel exactly three units")
check(live[1].entity:GetComponent("script.ShadowUnit").Hp == 21, "map travel preserves HP")
check(math.abs(live[3].expireAt - originalExpiry) < 0.01, "map travel does not reset revive timer")
local mana = p:GetComponent("script.PlayerStats").Mana
check(_UndeadSystem:StashForRoomTravel(p, "other_room"), "native shared-memory write")
_UndeadSystem:RestoreRoomTravel(p)
local mc, tm = _RoomService:GetSharedMemory(_UndeadSystem.TravelMemoryName)
check(tm:GetVariableAndWait(uid).Code == SharedMemoryResultCode.OK and #_UndeadSystem:ListOf(p) == 3, "wrong room does not consume")
check(_UndeadSystem:StashForRoomTravel(p, _RoomService.RoomKey), "same-room ticket setup")
_UndeadSystem:RestoreRoomTravel(p)
_UndeadSystem:RestoreRoomTravel(p)
wait(1.5)
check(#_UndeadSystem:ListOf(p) == 3 and tm:GetVariableAndWait(uid).Code == SharedMemoryResultCode.NotFound, "ticket consumed once")
check(p:GetComponent("script.PlayerStats").Mana == mana, "travel has no mana cost")
local stale = _UndeadSystem:TravelSnapshot(p, _RoomService.RoomKey)
stale.created = DateTime.UtcNow.Elapsed - 121000
tm:SetVariableAndWait(uid, _HttpService:JSONEncode(stale))
_UndeadSystem:RestoreRoomTravel(p)
check(#_UndeadSystem:ListOf(p) == 3 and tm:GetVariableAndWait(uid).Code == SharedMemoryResultCode.NotFound, "stale ticket discarded without resurrection")
log("[VRF-UD] local travel scenarios complete")
