-- server_instance_depth:2:*; 복원 완료와 체력·수명 확인 후 귀환.
local p = _UserService.UserEntities.Values[1]
assert(isvalid(p))
local freeze = _TimerService:SetTimerRepeat(function() for _, m in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do m.Entity.Enable = false end end,0.1)
wait(3)
_TimerService:ClearTimer(freeze)
local function check(ok, name) if ok then log("[VRF-UD] PASS " .. name) else log_error("[VRF-UD] FAIL " .. name) end end
local list = _UndeadSystem:LiveRecords(p)
check(#list == 3, "actual floor 2 all three kinds followed")
local _, mem = _RoomService:GetSharedMemory("CodexTravelVerification")
local want = _HttpService:JSONDecode(mem:GetVariableAndWait("expected").Info.Value)
for i, rec in ipairs(list) do
 local u = rec.entity:GetComponent("script.ShadowUnit")
 check(u.Hp == want.units[i].currentHp, "floor 2 HP preserved " .. rec.kind)
end
if list[3] ~= nil then check(math.abs((list[3].expireAt - _UtilLogic.ElapsedSeconds) - (want.units[3].expires - DateTime.UtcNow.Elapsed) / 1000) < 1, "floor 2 revive lifetime") end
local d = p.CurrentMap:GetComponent("script.DepthDirector")
check(d.Floor == 2, "actual instance floor two")
d.Moving = false d.Cleared = true _TimerService:SetTimerOnce(function() d:OnDoorUsed("exit") end, 0.2)
log("[VRF-UD] return dispatched")
