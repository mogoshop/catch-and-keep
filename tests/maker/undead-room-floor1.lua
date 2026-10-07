-- server_instance_depth:1:*; context가 만들어진 직후 실행.
local p = _UserService.UserEntities.Values[1]
assert(isvalid(p))
for _, m in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do m.Entity.Enable = false end
local function check(ok, name) if ok then log("[VRF-UD] PASS " .. name) else log_error("[VRF-UD] FAIL " .. name) end end
local freeze = _TimerService:SetTimerRepeat(function()
    for _, m in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do m.Entity.Enable = false end
end, 0.1)
wait(3)
_TimerService:ClearTimer(freeze)
local list = _UndeadSystem:LiveRecords(p)
check(#list == 3, "depth 1 all three kinds followed")
for i, rec in ipairs(list) do
 local unit = rec.entity:GetComponent("script.ShadowUnit")
 check(unit.Hp == 2000 + i, "depth 1 HP preserved " .. rec.kind)
end
local c, mem = _RoomService:GetSharedMemory("CodexTravelVerification")
local expected = _HttpService:JSONDecode(mem:GetVariableAndWait("expected").Info.Value)
local remain = list[3] ~= nil and list[3].expireAt - _UtilLogic.ElapsedSeconds or -99
local want = (expected.units[3].expires - DateTime.UtcNow.Elapsed) / 1000
check(math.abs(remain - want) < 1, "depth revive time preserved across room clocks")
local director = p.CurrentMap:GetComponent("script.DepthDirector")
check(director.Floor == 1, "actual instance floor one")
mem:SetVariableAndWait("expected", _HttpService:JSONEncode(_UndeadSystem:TravelSnapshot(p, "")))
director.Moving = false
director.Cleared = true
_TimerService:SetTimerOnce(function() director:OnDoorUsed("next") end, 0.2)
log("[VRF-UD] next floor dispatched")
