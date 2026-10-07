-- server_main; 테스트 전용 캐릭터에서 실행. 원본 저장은 공유 메모리에 보관한다.
local p = _UserService.UserEntities.Values[1]
local save = p:GetComponent("script.PlayerSave")
local code, memory = _RoomService:GetSharedMemory("CodexTravelVerification")
local existing = memory:GetVariableAndWait(p.PlayerComponent.UserId)
if existing.Code == SharedMemoryResultCode.NotFound then
    local backup = { sections = save:Collect(), db = save:BatchGet({ "Char", "Inv", "Shadow" }) }
    assert(memory:SetVariableAndWait(p.PlayerComponent.UserId, _HttpService:JSONEncode(backup)).Code == SharedMemoryResultCode.OK)
end
save.IsLoadSuccess = true
local gate = p.CurrentMap:GetFirstChildComponentByTypeName("script.DepthGate", true)
assert(gate ~= nil)
log("[VRF-UD] minimum level gate blocks=" .. tostring(not gate:Ready(p)))
_UndeadSystem:DismissAll(p)
local list = _UndeadSystem:ListOf(p)
for i, kind in ipairs({ "skeleton", "mage", "revive" }) do
 local rec = _UndeadSystem:MakeRecord(p, "skeleton", 2, nil)
 rec.kind = kind rec.hp = 5000 rec.currentHp = 2000 + i rec.atk = 0 rec.speed = 0 rec.range = 0
 if kind == "revive" then rec.expireAt = _UtilLogic.ElapsedSeconds + 180 end
 if kind == "mage" then rec.element = "cold" end
 table.insert(list, rec)
 assert(_UndeadSystem:SpawnUnit(p, rec, _Util:Pos2(p), nil, nil))
end
wait(0.3)
local code, mem = _RoomService:GetSharedMemory("CodexTravelVerification")
assert(mem:SetVariableAndWait("expected", _HttpService:JSONEncode(_UndeadSystem:TravelSnapshot(p,""))).Code == SharedMemoryResultCode.OK)
gate:Enter(p)
log("[VRF-UD] depth enter dispatched")
