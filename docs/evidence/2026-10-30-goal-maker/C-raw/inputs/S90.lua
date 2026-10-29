-- ===================================================================== [S90] 강제 마감
-- Dps 원장이 이미 꺼지거나 교체되어도 별도 collection 소유권은 남아 정리할 수 있다.
if _Telemetry.DpsCollection ~= nil then
  _Telemetry:DpsCollectionStop('manual')
elseif _Telemetry.DpsOn then
  -- 옛 연결 확인처럼 소유 수집이 없는 관측만 마감. 이것을 시험 대상/캐릭터 원복으로 보고하지 않는다.
  local cap = _Telemetry.DpsFlushLineCap
  _Telemetry.DpsFlushLineCap = 4600
  _Telemetry:DpsFinish(4000)
  _Telemetry.DpsFlushLineCap = cap
  log('[DPS-RUN] end label=forced reason=manual_unowned')
end
