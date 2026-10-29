-- E-IF-01 only: direct engine-method visual reentry probe. NOT CastRite/input/cost/cooldown acceptance.
-- Sole Maker fills actual current Play origin, owner uid, existing settled skeleton record id and its form.
-- Do not run alongside the current E capture/combat sequence. No new summon, cooldown reset or save writes.
local CFG = { origin = 'SET_ACTUAL_PLAY_ORIGIN', owner_uid = 'SET_ACTUAL_OWNER_UID', record_id = 'SET_ACTUAL_RECORD_ID', form = 'SET_ACTUAL_FORM' }
if CFG.origin == 'SET_ACTUAL_PLAY_ORIGIN' or CFG.owner_uid == 'SET_ACTUAL_OWNER_UID' or CFG.record_id == 'SET_ACTUAL_RECORD_ID' then
  log_error('[E-IF01-PROBE] actual Play/owner/record context required; no mutation') return
end
if CFG.form ~= 'basic' and CFG.form ~= 'shield' and CFG.form ~= 'greatsword' and CFG.form ~= 'twin' then log_error('[E-IF01-PROBE] use one existing approved skeleton form; no mutation') return end
if Environment:IsPublishedPlay() then log_error('[E-IF01-PROBE] Maker only; no mutation') return end
-- Use only after the existing C run has finished and its cleanup completed; never contaminate C measurements.
if _Telemetry.DpsOn or _Telemetry.DpsCollection ~= nil then log_error('[E-IF01-PROBE] C observation/collection still active; no mutation') return end
local p = nil
for _, user in pairs(_UserService.UserEntities) do
  if tostring(user.PlayerComponent.UserId) == CFG.owner_uid then p = user break end
end
if not isvalid(p) or not _Util:IsAlive(p) then log_error('[E-IF01-PROBE] owner unavailable; no mutation') return end
local uid = p.PlayerComponent.UserId
if _UndeadSystem.Giants[uid] ~= nil then log_error('[E-IF01-PROBE] real giant sequence still active; no mutation') return end
local rec = nil
for _, item in ipairs(_UndeadSystem.Owned[uid] or {}) do
  if item.id == CFG.record_id then rec = item break end
end
local actualForm = rec ~= nil and (rec.form or '') or ''
if actualForm == '' then actualForm = 'basic' end
if rec == nil or rec.kind ~= 'skeleton' or actualForm ~= CFG.form or not isvalid(rec.entity) then log_error('[E-IF01-PROBE] exact existing record mismatch; no mutation') return end
local u = rec.entity:GetComponent('script.ShadowUnit')
if u == nil or u.Dead or u.Hp <= 0 or u.Giant or u.Bombing or u.OwnerPlayer ~= p or rec.entity.CurrentMap ~= p.CurrentMap then log_error('[E-IF01-PROBE] unit unavailable; no mutation') return end
local now = _UtilLogic.ElapsedSeconds
if u.GiantBase.sx ~= nil or u.GiantClipUntil > now or isvalid(u.Target) or u.StrikeTimer ~= 0 or u.AttackAnimationUntil > now then log_error('[E-IF01-PROBE] wait for existing unit to settle; no mutation') return end
local look = _UndeadSystem:GiantLook(CFG.form)
if look == nil or (look.split or '') == '' or (look.splitSec or 0) <= 0 then log_error('[E-IF01-PROBE] registered split unavailable; no mutation') return end
local t = rec.entity.TransformComponent
local base = { stand = u.StandRUID, move = u.MoveRUID, attack = u.AttackRUID, sx = math.abs(t.Scale.x), sy = t.Scale.y }
local function state(tag)
  log(string.format('[E-IF01-PROBE] %s origin=%s uid=%s rec=%s form=%s time=%.4f giant=%s token=%d stand=%s move=%s attack=%s absSx=%.6f sy=%.6f', tag, CFG.origin, CFG.owner_uid, rec.id, CFG.form, _UtilLogic.ElapsedSeconds, tostring(u.Giant), u.GiantLookToken, u.StandRUID, u.MoveRUID, u.AttackRUID, math.abs(t.Scale.x), t.Scale.y))
end
state('before')
local splitAt, reentryAt = nil, nil
-- No yield between first End and second Start: measured separation must be < splitSec.
-- Current unit stats are passed through; there is no five-unit merge, resource spend or timer-policy change.
local ok, why = pcall(function()
  u:StartGiant(u.Atk, u.MaxHp, u.Hp, look)
  state('entered1')
  u:EndGiant()
  splitAt = _UtilLogic.ElapsedSeconds
  state('split1_pending')
  u:StartGiant(u.Atk, u.MaxHp, u.Hp, look)
  reentryAt = _UtilLogic.ElapsedSeconds
  state('reentered2')
  log(string.format('[E-IF01-PROBE] second_base stand=%s move=%s attack=%s sx=%.6f sy=%.6f reentryDelay=%.6f splitSec=%.6f', u.GiantBase.stand or '', u.GiantBase.move or '', u.GiantBase.attack or '', u.GiantBase.sx or -1, u.GiantBase.sy or -1, reentryAt-splitAt, look.splitSec))
  u:EndGiant()
end)
if not ok then
  -- Complete only this direct unit transition. EndGiant owns its existing delayed visual restoration.
  if isvalid(rec.entity) and u.Giant then u:EndGiant() end
  log_error('[E-IF01-PROBE] incomplete direct sequence: '..tostring(why)) return
end
-- Both EndGiant calls already installed their original bounded restoration callbacks.
-- Only observe after those callbacks; never force RestoreLook to make a pass.
wait(look.splitSec + 0.2)
if not isvalid(rec.entity) or u.Dead or rec.entity.CurrentMap ~= p.CurrentMap then log_error('[E-IF01-PROBE] unit changed before final observation; inconclusive') return end
state('after_original_restore_delay')
local same = u.StandRUID == base.stand and u.MoveRUID == base.move and u.AttackRUID == base.attack and math.abs(math.abs(t.Scale.x)-base.sx) < 0.00001 and math.abs(t.Scale.y-base.sy) < 0.00001
log(string.format('[E-IF01-PROBE] result originalLookAndScale=%s reenteredWithinSplit=%s giantEnded=%s baseCleared=%s direct_method_only=true', tostring(same), tostring(reentryAt-splitAt < look.splitSec), tostring(not u.Giant), tostring(u.GiantBase.sx == nil)))
