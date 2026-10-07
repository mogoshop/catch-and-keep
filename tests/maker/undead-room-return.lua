-- server_main; 귀환 후 실행. 검사 완료·원본 저장 복원 로그까지 기다린 뒤 플레이를 종료한다.
local p = _UserService.UserEntities.Values[1]
assert(isvalid(p))
wait(2)
local function check(ok, name) if ok then log("[VRF-UD] PASS " .. name) else log_error("[VRF-UD] FAIL " .. name) end end
local list = _UndeadSystem:LiveRecords(p)
check(p.CurrentMap.Name == "town" and #list == 3, "actual town return all three kinds followed")
for _, rec in ipairs(list) do check(isvalid(rec.entity) and rec.entity.CurrentMap == p.CurrentMap, "return unit in correct map " .. rec.kind) end
local _, mem = _RoomService:GetSharedMemory("CodexTravelVerification")
local backup = _HttpService:JSONDecode(mem:GetVariableAndWait(p.PlayerComponent.UserId).Info.Value)
local save = p:GetComponent("script.PlayerSave")
save.IsLoadSuccess = false
_UndeadSystem:DismissAll(p)
check(_UndeadSystem:StashForRoomTravel(p, _RoomService.RoomKey), "zero minion room transfer serializes")
_UndeadSystem:RestoreRoomTravel(p)
check(#_UndeadSystem:ListOf(p) == 0, "empty transfer does not resurrect")
for _, section in ipairs(save:Sections()) do
 local data = _HttpService:JSONDecode(backup.sections[section.key])
 for _, part in ipairs(section.parts) do
  local comp = p:GetComponent(part[2])
  if comp ~= nil then comp:LoadSaveData(data[part[1]]) end
 end
end
assert(save:Storage():BatchSetAndWait(backup.db) == 0)
local restored = save:BatchGet({"Char", "Inv", "Shadow"})
check(restored.Char == backup.db.Char and restored.Inv == backup.db.Inv and restored.Shadow == backup.db.Shadow, "original storage restored exactly")
local _, travelMem = _RoomService:GetSharedMemory(_UndeadSystem.TravelMemoryName)
travelMem:DeleteVariableAndWait(p.PlayerComponent.UserId)
log("[VRF-UD] cross-room suite complete")
