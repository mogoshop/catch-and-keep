-- ===================================================================== [S00] 사전 점검
local ok = _Telemetry ~= nil and _Telemetry.DpsOn == false and _Telemetry.Dps == nil and _Telemetry.DpsCollection == nil
log("[DPS-RUN] preflight dpsOn=" .. tostring(_Telemetry.DpsOn) .. " buffer=" .. tostring(_Telemetry.Dps ~= nil) .. " collection=" .. tostring(_Telemetry.DpsCollection ~= nil) .. " cap=" .. tostring(_Telemetry.DpsRawCap) .. " gap=" .. tostring(_Telemetry.DpsGapSec) .. " ok=" .. tostring(ok))
local n = 0
for _, u in pairs(_UserService.UserEntities) do n = n + 1 end
log("[DPS-RUN] preflight users=" .. n .. " (시험은 사용자 1명 · 파티 시험은 별도)")
