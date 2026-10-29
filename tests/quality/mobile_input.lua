-- I04 모바일 입력 상태 기계 오프라인 검증 (Lua 5.4) — 실제 mLua 메서드 본문을 그대로 읽어 돌린다.
-- 실행: 저장소 루트에서 `lua tests/quality/mobile_input.lua` (또는 `python3 tests/quality/run.py --lua <lua> mobile_input`)
-- 읽는 본문: UI/Hud/MobilePad.mlua 전체 method · Skill/SkillBook.mlua의 GetSlotSkill·CastSlot·BeginRiteHold·ReleaseRite·CancelRiteHold.
-- 엔진·서비스·서버는 아래 가짜(fixture)다: 서버 요청(RequestCast/RequestRite)이 들어오면 가짜 서버가 마나·재사용·해골을 쓴다.
-- 그래서 「취소면 서버 요청 0 → 마나·재사용·해골 그대로」를 끝까지 확인한다.
-- 증명하지 않는 것: 실제 터치 이벤트 순서·UI 배치·손가락 가림·네트워크 지연 (메이커/실기기 후검수).

-- ───────── mLua → Lua 내보내기 ─────────
local function readfile(path)
  local f = assert(io.open(path, "r"), "파일 없음: " .. path)
  local s = f:read("a")
  f:close()
  return s
end

local function eval(expr)
  return assert(load("return " .. expr, "=default", "t", _ENV))()
end

-- 한 스크립트의 property 기본값과 method 본문을 obj에 붙인다. names가 nil이면 모든 method
local function export(obj, path, names, withProps)
  local src = readfile(path):gsub("\r\n", "\n")
  if withProps then
    for name, value in src:gmatch("\n    property %S+ (%w+) = ([^\n]*)") do
      value = value:gsub("%s+%-%-.*$", "")
      obj[name] = eval(value)
    end
  end
  local want = nil
  if names ~= nil then want = {} for _, n in ipairs(names) do want[n] = true end end
  local found, pos = {}, 1
  while true do
    local s, e, name, params = src:find("\n    method [^\n]- (%w+)%(([^\n]*)%)\n", pos)
    if s == nil then break end
    local bs, be = src:find("\n    end\n", e, true)
    assert(bs, path .. ": " .. name .. " 끝을 찾지 못함")
    local body = src:sub(e + 1, bs)
    pos = bs
    if want == nil or want[name] then
      local args, defaults = {}, {}
      for param in params:gmatch("[^,]+") do
        local decl, value = param:match("^(.-)=(.*)$")
        decl = decl or param
        local arg = decl:match("(%w+)%s*$")
        table.insert(args, arg)
        if value then table.insert(defaults, "if " .. arg .. " == nil then " .. arg .. " = " .. value .. " end") end
      end
      local code = "return function(self" .. (#args > 0 and ", " .. table.concat(args, ", ") or "") .. ")\n" .. table.concat(defaults, "\n") .. "\n" .. body .. "end"
      obj[name] = assert(load(code, "=" .. path:match("[^/]+$") .. ":" .. name, "t", _ENV))()
      found[name] = true
    end
  end
  if want ~= nil then for n in pairs(want) do assert(found[n], path .. ": method " .. n .. " 없음") end end
end

-- ───────── 엔진 가짜 ─────────
Vector2 = {}
Vector2.__index = Vector2
setmetatable(Vector2, { __call = function(_, x, y) return setmetatable({ x = x, y = y }, Vector2) end })
Vector2.__add = function(a, b) return Vector2(a.x + b.x, a.y + b.y) end
Vector2.__sub = function(a, b) return Vector2(a.x - b.x, a.y - b.y) end
Vector2.__mul = function(a, b)
  if type(a) == "number" then return Vector2(b.x * a, b.y * a) end
  return Vector2(a.x * b, a.y * b)
end
function Vector2:Magnitude() return math.sqrt(self.x * self.x + self.y * self.y) end
function Vector2:Normalize() local m = self:Magnitude() if m == 0 then return Vector2(0, 0) end return Vector2(self.x / m, self.y / m) end
function Color(r, g, b, a) return { r = r, g = g, b = b, a = a } end
function log(...) end
function log_warning(...) end
function isvalid(x) return x ~= nil end
Environment = {}
function Environment:IsMobilePlatform() return true end
function Environment:IsPCPlatform() return false end
function Environment:IsPublishedPlay() return false end
_UtilLogic = { ElapsedSeconds = 100 }
_UILogic = { ScreenWidth = 1920, ScreenHeight = 1080 }
-- 화면 좌표 = 1920×1080 UI 좌표(왼쪽 아래 0)로 둔다. 칸의 지역 좌표 = 점 − 칸 중심
function _UILogic:ScreenToLocalUIPosition(p, t) return p - t.center end
_GameData = { baseAttackInterval = 0.5, mobilePickRadius = 1.5, mobilePickSafeRadius = 4 }
function _GameData:GetUiIcon(k) return k end
_GameConst = {}
function _GameConst:IsTown(m) return false end
_HudMain = {}
function _HudMain:ShowWarn(t) end
_SkillData = {}
function _SkillData:Get(id) return { icon = id, name = id, cooldown = 0.5 } end
_UXFeedback = {}
function _UXFeedback:Show() end
_Util = {}
function _Util:Pos2(e) return e.pos end

-- 화면 (16:9, 오른쪽 아래 기준 빌드 좌표를 왼쪽 아래 기준 화면 좌표로: x = 1920 + px, y = py)
local function pad(px, py) return Vector2(1920 + px, py) end
local SCREEN = {
  S2 = pad(-395, 300), S3 = pad(-304, 395), Attack = pad(-170, 170), BasicAtk = pad(-60, 338),   -- tools/build/ui.cjs (I04 ㉠ 10-29: S3 -300→-304 · BasicAtk 330→338)
  Cancel = pad(-576, 545),   -- tools/build/ui.cjs MobilePad/AimCancel
}

-- 세계 상태 (테스트마다 Reset)
local W = {}
_UIKit = {}
function _UIKit:Get(path) return W.ents[path] end
function _UIKit:SetEnabled(path, on) local e = W.ents[path] if e == nil then e = {} W.ents[path] = e end e.Enable = on end
function _UIKit:SetColor(path, c) local e = W.ents[path] if e then e.Color = c end end
function _UIKit:SetText() end
function _UIKit:SetIcon() end
function _UIKit:Clip(s) return s end
function _UIKit:ShowCooldown() end
function _UIKit:ShowRiteStages() end
function _UIKit:AnyWindowOpen() return W.window end
function _UIKit:AnyWindowShown() return W.window end
function _UIKit:CanUseGameplayInput() return W.player.PlayerComponent.Hp > 0 and not W.window end
function _UIKit:Comp(name)
  if name == "script.SkillBook" then return W.book end
  if name == "script.PlayerStats" then return W.stats end
  return nil
end
_SkillPicker = {}
function _SkillPicker:Open(slot) W.pickers = W.pickers + 1 end
function _SkillPicker:OpenBelt(i) W.pickers = W.pickers + 1 end
_UserService = {}

-- ───────── 실제 스크립트 ─────────
MobilePad = {}
_MobilePad = MobilePad
export(MobilePad, "RootDesk/MyDesk/UI/Hud/MobilePad.mlua", nil, true)
local PadDefaults = {}
for k, v in pairs(MobilePad) do if type(v) ~= "function" then PadDefaults[k] = v end end
local BookMethods = {}
export(BookMethods, "RootDesk/MyDesk/Skill/SkillBook.mlua", { "GetSlotSkill", "CastSlot", "BeginRiteHold", "ReleaseRite", "CancelRiteHold" }, false)
-- I04 골편 홀드 반복 (10-30 갈래 B): 기본 공격 입구는 실제 PlayerAttack.SubmitBasicInput 본문 (단일 소유권 MobilePad.BlocksBasic)
local AttackMethods = {}
export(AttackMethods, "RootDesk/MyDesk/Combat/PlayerAttack.mlua", { "SubmitBasicInput" }, false)
function _Util:IsAlive(e) return e.PlayerComponent.Hp > 0 end
local CDLEN = { bone_shard = 0.5 }

-- 가짜 서버: 요청이 오면 검사하고 비용을 쓴다 (실제 서버 SkillBook.Cast/Rite가 하는 일의 요약)
local COST = { bone_prison = 12, curse_weak = 8, bone_rite = 20, bone_shard = 5 }
local function NewBook(player)
  local b = setmetatable({}, { __index = BookMethods })
  b.Entity = player
  b.Slots = "bone_shard,bone_prison,bone_rite,curse_weak"
  b.RightSkill = ""
  b.RiteHoldAt = -1
  b.ShardHold = false
  function b:GetManaCost(id, lv) return COST[id] or 0 end
  b.RiteHoldSlot = 0
  b.PredictedCastAt = 0
  b.DashShown = 0
  b.cd = {}
  function b:CooldownLeft(id) return math.max(0, (self.cd[id] or 0) - _UtilLogic.ElapsedSeconds) end
  function b:GetPowerLevel(id) return 1 end
  function b:GetLevel(id) return 1 end
  function b:GetAimPoint(id) return Vector2(1, 0) end
  function b:PredictBoneShard() end
  function b:PlayCastGesture() end
  function b:CastMove(id) W.requests = W.requests + 1 end
  function b:RiteGiantUnlocked() return false end
  function b:RiteStageForHold(held, giant) return held >= 1 and 2 or 1 end
  function b:RiteBestStage(want, mana) return want end
  function b:RiteSkeletons() return W.skeletons end
  function b:RequestCast(id, aim)
    W.requests = W.requests + 1
    table.insert(W.reqAt, _UtilLogic.ElapsedSeconds)
    if W.stats.Mana >= COST[id] and self:CooldownLeft(id) <= 0 then
      W.stats.Mana = W.stats.Mana - COST[id]
      self.cd[id] = _UtilLogic.ElapsedSeconds + (CDLEN[id] or 3)
      W.casts = W.casts + 1
    end
  end
  function b:RequestRite(want, aim)
    W.requests = W.requests + 1
    W.stats.Mana = W.stats.Mana - COST.bone_rite
    W.skeletons = W.skeletons - want
    self.cd.bone_rite = _UtilLogic.ElapsedSeconds + 5
    W.casts = W.casts + 1
  end
  return b
end

-- 맵: 전리품(LootDrop)·몬스터 목록은 W.loot·W.monsters (UpdatePickMode가 읽는다)
local function NewMap(name)
  local m = { name = name }
  function m:GetChildComponentsByTypeName(t, recursive)
    if t == "script.LootDrop" then return W.loot end
    if t == "script.Monster" then return W.monsters end
    return {}
  end
  return m
end
local MAP_A, MAP_B = NewMap("a"), NewMap("b")
local function Reset()
  for k, v in pairs(PadDefaults) do MobilePad[k] = v end
  W.window, W.pickers, W.requests, W.casts, W.basic, W.skeletons = false, 0, 0, 0, 0, 6
  W.loot, W.monsters = {}, {}
  W.reqAt = {}
  W.ents = {
    ["/ui/ShadowHUD/MobilePad/AimCancel"] = { Enable = false, UITransformComponent = { RectSize = Vector2(92, 92), center = SCREEN.Cancel } },
    ["/ui/ShadowHUD/MobilePad"] = { Enable = true },
  }
  W.stats = { Mana = 100 }
  function W.stats:GetAttackInterval(base) return base end
  function W.stats:GetCastCooldownMult() return 1 end
  local attack = { LocalAimActive = false, LocalAimDirection = Vector2(1, 0) }
  attack.LastLocalInputAt = -99
  attack.SubmitBasicInput = AttackMethods.SubmitBasicInput   -- 실제 본문 (I04 단일 소유권 입구)
  function attack:RequestBasicAttack(dir, manual) W.basic = W.basic + 1 end
  local player = { PlayerComponent = { Hp = 100, UserId = "u1" }, CurrentMap = MAP_A, PlayerControllerComponent = {}, pos = Vector2(0, 0) }
  W.inv = { BagDigest = "", BagSize = 40 }
  function player.PlayerControllerComponent:ActionAttack() end
  W.click = { AttackTimer = 0 }
  function player:GetComponent(name)
    if name == "script.PlayerAttack" then return attack end
    if name == "script.SkillBook" then return W.book end
    if name == "script.PlayerStats" then return W.stats end
    if name == "script.ClickControl" then return W.click end
    if name == "script.PlayerInventory" then return W.inv end
    return nil
  end
  W.player, W.attack = player, attack
  attack.Entity = player
  _UserService.LocalPlayer = player
  W.book = NewBook(player)
  _UtilLogic.ElapsedSeconds = 100
end

-- ───────── 검사 ─────────
local passed, total = 0, 0
local function check(cond, what)
  total = total + 1
  if cond then passed = passed + 1 else error("FAIL: " .. what, 2) end
end
local function snapshot() return { mana = W.stats.Mana, skel = W.skeletons, cd = (function() local t = {} for k, v in pairs(W.book.cd) do t[k] = v end return t end)() } end
local function unchanged(before, what)
  check(W.requests == 0, what .. ": 서버 요청 0 (실제 " .. W.requests .. ")")
  check(W.stats.Mana == before.mana, what .. ": 마나 그대로")
  check(W.skeletons == before.skel, what .. ": 해골 수 그대로")
  local same = true
  for k, v in pairs(W.book.cd) do if before.cd[k] ~= v then same = false end end
  check(same, what .. ": 재사용 그대로")
  check(W.pickers == 0, what .. ": 스킬 고르기 창 안 열림")
end
local function released(pad) return pad end
local scenarios = {}
local function scenario(name, fn) table.insert(scenarios, { name, fn }) end

scenario("시작→끌기→취소 (땅 찍기 칸 2)", function()
  local before = snapshot()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  check(MobilePad.CancelShown and W.ents["/ui/ShadowHUD/MobilePad/AimCancel"].Enable, "스킬 끌기에 취소 표시가 켜진다")
  MobilePad:UpdateGesture(7, SCREEN.S2 + Vector2(-60, 90))
  check(not MobilePad.CancelHover, "조준 중(취소 밖)에는 강조 없음")
  MobilePad:UpdateGesture(7, SCREEN.Cancel + Vector2(30, -20))
  check(MobilePad.CancelHover, "취소 위에 오면 강조")
  MobilePad:EndGesture(7, SCREEN.Cancel + Vector2(30, -20))   -- UI up
  MobilePad:EndGesture(7, SCREEN.Cancel + Vector2(30, -20))   -- 같은 손가락의 화면 release (중복 up)
  unchanged(before, "취소")
  check(W.casts == 0, "취소: 시전 0")
  check(MobilePad.GestureTouchId == 0 and not MobilePad.CancelShown and not MobilePad.CancelHover, "취소 뒤 제스처·표시 정리")
  check(not W.attack.LocalAimActive, "취소 뒤 수동 조준 꺼짐")
end)

scenario("취소 판정 가장자리 (표시 반지름 46 + 여유 16)", function()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  check(MobilePad:IsOverCancel(SCREEN.Cancel + Vector2(46 + 15, 0)), "여유 안(61px)은 취소")
  check(not MobilePad:IsOverCancel(SCREEN.Cancel + Vector2(46 + 17, 0)), "여유 밖(63px)은 취소 아님")
  MobilePad:ClearGesture()
  check(not MobilePad:IsOverCancel(SCREEN.Cancel), "표시가 꺼져 있으면 취소 판정 없음")
end)

scenario("시작→끌기→놓기 (시전)", function()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  MobilePad:UpdateGesture(7, SCREEN.S2 + Vector2(150, 40))
  check(W.attack.LocalAimActive, "데드존 밖으로 끌면 수동 조준")
  check(MobilePad.AimReach > 0.6 and MobilePad.AimReach < 0.9, "끈 길이 비율 " .. string.format("%.2f", MobilePad.AimReach))
  MobilePad:EndGesture(7, SCREEN.S2 + Vector2(150, 40))
  MobilePad:EndGesture(7, SCREEN.S2 + Vector2(150, 40))   -- 중복 up
  check(W.requests == 1 and W.casts == 1, "놓으면 한 번만 시전 (요청 " .. W.requests .. ")")
  check(W.stats.Mana == 100 - COST.bone_prison, "마나는 서버 시전에서 한 번")
  check(W.book:CooldownLeft("bone_prison") > 0, "재사용 시작")
end)

scenario("뼈 의식 모으다 취소 (칸 3)", function()
  local before = snapshot()
  MobilePad:BeginGesture(3, 7, SCREEN.S3)
  check(W.book.RiteHoldAt >= 0 and W.book.RiteHoldSlot == 3, "손가락이 닿으면 의식 모으기 시작")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 1.4
  MobilePad:UpdateGesture(7, SCREEN.Cancel)
  MobilePad:EndGesture(7, SCREEN.Cancel)
  unchanged(before, "의식 취소")
  check(W.book.RiteHoldAt < 0 and W.book.RiteHoldSlot == 0, "모으던 의식 버림")
end)

scenario("뼈 의식 모았다 놓기 (대조)", function()
  MobilePad:BeginGesture(3, 7, SCREEN.S3)
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 1.4
  MobilePad:EndGesture(7, SCREEN.S3 + Vector2(-80, 60))
  check(W.requests == 1 and W.skeletons == 6 - 2, "놓으면 모은 단계(2)로 한 번 — 해골 2 소모")
end)

scenario("홀드 중 창 열림 (Poll)", function()
  local before = snapshot()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  MobilePad:UpdateGesture(7, SCREEN.S2 + Vector2(120, 0))
  W.window = true
  MobilePad:Poll()
  check(MobilePad.GestureTouchId == 0 and not MobilePad.CancelShown, "창이 뜨면 제스처를 버린다")
  W.window = false
  MobilePad:EndGesture(7, SCREEN.S2 + Vector2(120, 0))   -- 창을 닫고 손가락을 뗌
  unchanged(before, "창 열림")
end)

scenario("의식 모으는 중 창 열림 (끌기 갱신에서)", function()
  local before = snapshot()
  MobilePad:BeginGesture(3, 7, SCREEN.S3)
  W.window = true
  MobilePad:UpdateGesture(7, SCREEN.S3 + Vector2(40, 40))
  W.window = false
  MobilePad:EndGesture(7, SCREEN.S3 + Vector2(40, 40))
  unchanged(before, "의식 중 창 열림")
  check(W.book.RiteHoldAt < 0, "의식 버림")
end)

scenario("홀드 중 사망 · 맵 이동 · 앱 전환", function()
  local before = snapshot()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  W.player.PlayerComponent.Hp = 0
  MobilePad:Poll()
  W.player.PlayerComponent.Hp = 100
  MobilePad:EndGesture(7, SCREEN.S2)
  MobilePad:BeginGesture(2, 8, SCREEN.S2)
  W.player.CurrentMap = MAP_B
  MobilePad:Poll()
  MobilePad:EndGesture(8, SCREEN.S2)
  W.player.CurrentMap = MAP_A
  MobilePad:BeginGesture(3, 9, SCREEN.S3)
  MobilePad:ClearGesture()   -- HandleApplicationFocusOutEvent 본문 = ClearGesture
  MobilePad:EndGesture(9, SCREEN.S3)
  unchanged(before, "사망·맵 이동·앱 전환")
  check(W.book.RiteHoldAt < 0, "앱 전환에 의식 버림")
end)

scenario("다른 손가락은 제스처를 뺏거나 시전하지 않는다", function()
  MobilePad:BeginGesture(2, 7, SCREEN.S2)
  MobilePad:BeginGesture(4, 8, SCREEN.S3)          -- 두 번째 손가락이 다른 칸을 누름
  check(MobilePad.GestureTouchId == 7 and MobilePad.GestureSlot == 2, "첫 손가락이 계속 소유")
  MobilePad:UpdateGesture(8, SCREEN.Cancel)        -- 두 번째 손가락이 취소 위로
  check(not MobilePad.CancelHover, "다른 손가락은 취소 강조를 바꾸지 않는다")
  MobilePad:EndGesture(8, SCREEN.S3)
  check(W.requests == 0, "다른 손가락 떼기: 시전 0")
  MobilePad:EndGesture(7, SCREEN.S2 + Vector2(100, 0))
  check(W.requests == 1 and W.casts == 1, "소유한 손가락만 시전 1")
end)

scenario("5칸 배치: 기본 공격 단추 칸 번호", function()
  W.book.RightSkill = "curse_weak"     -- 큰 단추(5번 칸)에 스킬
  local slot = MobilePad.BasicSlot
  check(slot == 6, "기본 공격 단추 = 제스처 칸 6")
  local taken = false
  for i = 1, 5 do if i == slot then taken = true end end
  check(not taken, "스킬 칸 1~5와 겹치지 않는다")
  check(W.book:GetSlotSkill(slot) == "", "칸 6에는 스킬이 묶이지 않는다")
end)

scenario("5칸 배치: 기본 공격 단추 누르고 있기", function()
  W.book.RightSkill = "curse_weak"
  local before = snapshot()
  MobilePad:BeginGesture(MobilePad.BasicSlot, 11, SCREEN.BasicAtk)
  check(MobilePad.GestureBasic, "기본 공격 제스처")
  check(not MobilePad.CancelShown, "기본 공격에는 취소 표시 없음")
  check(W.basic == 1 and MobilePad.Holding, "누르는 순간 기본 공격 1 + 반복 대기")
  for _ = 1, 4 do
    _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
    MobilePad:HoldTick()
  end
  check(W.basic == 5, "누르고 있는 동안 간격마다 반복 (" .. W.basic .. ")")
  MobilePad:EndGesture(11, SCREEN.BasicAtk)
  check(not MobilePad.Holding, "떼면 반복 멈춤")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 1
  MobilePad:HoldTick()
  check(W.basic == 5, "뗀 뒤 추가 공격 없음")
  unchanged(before, "기본 공격 단추")   -- 큰 단추 스킬은 나가지 않는다
end)

scenario("5칸 배치: 큰 단추는 그 스킬 (기본 공격 반복 없음)", function()
  W.book.RightSkill = "curse_weak"
  MobilePad:BeginGesture(5, 12, SCREEN.Attack)
  check(not MobilePad.GestureBasic and MobilePad.CancelShown, "큰 단추 = 스킬 끌기 (취소 표시)")
  check(W.basic == 0 and not MobilePad.Holding, "기본 공격 없음")
  MobilePad:EndGesture(12, SCREEN.Attack + Vector2(-90, 30))
  check(W.casts == 1 and W.basic == 0, "놓으면 5번 칸 스킬 1")
end)

scenario("4칸 배치: 큰 단추는 기본 공격, 기본 공격 단추와 같은 길", function()
  MobilePad:BeginGesture(5, 13, SCREEN.Attack)
  check(MobilePad.GestureBasic and not MobilePad.CancelShown, "빈 5번 칸 = 기본 공격")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
  MobilePad:HoldTick()
  MobilePad:EndGesture(13, SCREEN.Attack)
  check(W.basic == 2 and W.requests == 0, "기본 공격 2 · 스킬 요청 0")
end)

-- 전리품이 플레이어 곁에 떨어지고(일반 장비) 근처 몬스터가 없으면 큰 단추가 「줍기」로 바뀐다 · 몬스터가 다시 오면 되돌아온다
local function lootAppears()
  W.loot = { { Kind = "item", Rarity = 0, Taken = false, OwnerUserId = "", Entity = { pos = Vector2(0.5, 0) } } }
  W.monsters = {}
end
local function monsterReturns()
  W.monsters = { { IsDead = false, Entity = { Enable = true, pos = Vector2(1, 0) } } }
end
local function pickTick()
  MobilePad.PickCheckAt = 0   -- 0.25초 간격 검사를 바로 돌린다
  MobilePad:UpdatePickMode(W.player)
end

scenario("I04-R01 기본 공격 단추 홀드 중 전리품 등장 → 반복 계속", function()
  W.book.RightSkill = "curse_weak"
  local before = snapshot()
  MobilePad:BeginGesture(MobilePad.BasicSlot, 11, SCREEN.BasicAtk)
  check(W.basic == 1 and MobilePad.Holding, "누르는 순간 기본 공격 1")
  lootAppears()
  pickTick()   -- Poll 순서: UpdatePickMode → HoldTick
  check(MobilePad.PickMode, "큰 단추는 「줍기」로 바뀐다")
  check(MobilePad.Holding and MobilePad.GestureSlot == MobilePad.BasicSlot, "기본 공격 단추 홀드는 그대로")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
  MobilePad:HoldTick()
  check(W.basic == 2, "줍기 전환 뒤에도 반복 (" .. W.basic .. ", 기대 2)")
  monsterReturns()
  pickTick()
  check(not MobilePad.PickMode and MobilePad.Holding, "적이 다시 오면 공격 단추로 · 홀드 계속")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
  MobilePad:HoldTick()
  check(W.basic == 3, "적 재등장 뒤에도 반복 (" .. W.basic .. ")")
  MobilePad:EndGesture(11, SCREEN.BasicAtk)
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 1
  MobilePad:HoldTick()
  check(W.basic == 3 and not MobilePad.Holding, "떼면 멈춤")
  unchanged(before, "기본 공격 홀드 중 줍기 전환")   -- 5번 칸 스킬 오발·줍기 요청 없음
end)

scenario("I04-R01 대조: 큰 단추 기본 공격 홀드는 「줍기」 전환에서 멈춘다 (기존 정책)", function()
  MobilePad:BeginGesture(5, 13, SCREEN.Attack)
  check(MobilePad.GestureBasic and MobilePad.Holding and W.basic == 1, "빈 5번 칸 = 기본 공격 홀드")
  lootAppears()
  pickTick()
  check(MobilePad.PickMode and not MobilePad.Holding, "큰 단추가 「줍기」가 되면 그 단추의 반복은 멈춘다")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
  MobilePad:HoldTick()
  check(W.basic == 1, "추가 기본 공격 없음")
  MobilePad:EndGesture(13, SCREEN.Attack)
  check(W.requests == 0, "스킬 요청 0")
end)

scenario("편집 중 기본 공격 단추는 무시", function()
  W.book.RightSkill = "curse_weak"
  MobilePad.EditMode = true
  MobilePad:BeginGesture(MobilePad.BasicSlot, 14, SCREEN.BasicAtk)
  check(MobilePad.GestureTouchId == 0, "제스처를 잡지 않는다")
  MobilePad:EndGesture(14, SCREEN.BasicAtk)
  check(W.basic == 0 and W.pickers == 0, "공격·고르기 창 없음")
end)

scenario("빈 칸·「줍기」 큰 단추에는 취소 표시 없음", function()
  W.book.Slots = "bone_shard,,bone_rite,curse_weak"
  MobilePad:BeginGesture(2, 15, SCREEN.S2)
  check(not MobilePad.CancelShown, "빈 칸 (놓으면 고르기 창)")
  MobilePad:ClearGesture()
  W.book.RightSkill = "curse_weak"
  MobilePad.PickMode = true
  MobilePad:BeginGesture(5, 16, SCREEN.Attack)
  check(not MobilePad.CancelShown, "「줍기」로 바뀐 큰 단추")
  MobilePad:ClearGesture()
end)

-- ───────── I04 골편 홀드 반복 (10-30 갈래 B · review-plan B-T04/B-T05) ─────────
-- 골편 = 칸 1 (b.Slots 첫 칸). 반복은 실제 SkillBook.CastSlot → 가짜 서버 RequestCast(마나·재사용) 길만 쓴다
local function step(n)
  -- 0.1초씩 n번: Poll(멈춤 사유 확인) + ShardTick (가짜 UI는 벨트가 없어 Poll이 ShardTick 전에 끝나므로 직접 부른다)
  for _ = 1, n do
    _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.1
    MobilePad:Poll()
    MobilePad:ShardTick()
  end
end
local function shardOn() W.book.ShardHold = true end

scenario("I04 홀드 반복 기본 끔: 누르고 있어도 놓을 때 한 번", function()
  MobilePad:BeginGesture(1, 21, SCREEN.S2)
  check(not MobilePad.ShardActive, "설정 끔이면 반복 소유 없음")
  step(20)
  check(W.requests == 0, "누르는 동안 요청 0")
  MobilePad:EndGesture(21, SCREEN.S2 + Vector2(80, 0))
  MobilePad:EndGesture(21, SCREEN.S2 + Vector2(80, 0))
  check(W.requests == 1 and W.casts == 1, "놓을 때 한 번 (요청 " .. W.requests .. ")")
end)

scenario("I04 홀드 반복 켬: 재사용 간격마다 · 뗄 때·중복 up 추가 시전 0", function()
  shardOn()
  MobilePad:BeginGesture(1, 22, SCREEN.S2)
  check(MobilePad.ShardActive and not MobilePad.ShardRepeating, "누른 순간 소유 · 아직 반복 전")
  step(3)
  check(W.requests == 0, "ShardHoldDelay(0.35) 전 요청 0")
  step(17)   -- 누른 지 2.0초
  check(W.requests >= 3 and W.requests <= 4 and W.casts == W.requests, "2초 동안 재사용 0.5초 간격으로 3~4번 (요청 " .. W.requests .. ")")
  local gapOk = true
  for i = 2, #W.reqAt do if W.reqAt[i] - W.reqAt[i - 1] < 0.5 - 1e-6 then gapOk = false end end
  check(gapOk and W.reqAt[1] - 100 >= MobilePad.ShardHoldDelay - 1e-6, "요청 간격 ≥ 재사용 · 첫 요청은 누른 지 0.35초 뒤")
  check(W.stats.Mana == 100 - W.casts * COST.bone_shard, "마나는 서버 시전마다 한 번씩")
  local sentBefore = W.requests
  MobilePad:EndGesture(22, SCREEN.S2 + Vector2(80, 0))
  MobilePad:EndGesture(22, SCREEN.S2 + Vector2(80, 0))   -- 같은 손가락 화면 release
  check(W.requests == sentBefore, "떼도 한 발 더 안 나감")
  check(MobilePad.ShardStopReason == "release" and not MobilePad.ShardActive, "사유 release")
  step(20)
  check(W.requests == sentBefore, "뗀 뒤 요청 0")
end)

scenario("I04 짧게 누르면 놓을 때 한 번 (켬이어도)", function()
  shardOn()
  MobilePad:BeginGesture(1, 23, SCREEN.S2)
  step(2)
  MobilePad:EndGesture(23, SCREEN.S2 + Vector2(80, 0))
  check(W.requests == 1, "탭 = 놓기 시전 1")
  step(10)
  check(W.requests == 1, "뒤 반복 없음")
end)

scenario("I04 반복 중 기본 공격 입구 막힘 (네이티브·Ctrl·탭 접근 = SubmitBasicInput)", function()
  shardOn()
  MobilePad:BeginGesture(1, 24, SCREEN.S2)
  W.attack:SubmitBasicInput()
  check(W.basic == 0, "누른 순간부터 기본 공격 입력 막힘")
  step(6)
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.05
  W.attack:SubmitBasicInput()
  check(W.basic == 0 and W.requests >= 1, "반복 중 기본 공격 0 · 골편 요청 " .. W.requests)
  MobilePad:BeginGesture(MobilePad.BasicSlot, 25, SCREEN.BasicAtk)   -- 다른 손가락이 작은 기본 공격 단추
  check(MobilePad.GestureTouchId == 24 and not MobilePad.Holding and W.basic == 0, "두 번째 손가락은 소유를 못 뺏는다")
  MobilePad:EndGesture(25, SCREEN.BasicAtk)
  check(MobilePad.ShardActive, "남의 손가락 떼기가 반복을 멈추지 않는다")
  MobilePad:EndGesture(24, SCREEN.S2)
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.1
  W.attack:SubmitBasicInput()
  check(W.basic == 1 and not MobilePad.Holding, "뗀 뒤 기본 공격 입력 정상 · 저절로 반복하지 않음")
end)

scenario("I04 기본 공격 단추가 먼저면 골편 반복 시작 안 됨", function()
  shardOn()
  W.book.RightSkill = "curse_weak"
  MobilePad:BeginGesture(MobilePad.BasicSlot, 26, SCREEN.BasicAtk)
  MobilePad:BeginGesture(1, 27, SCREEN.S2)
  check(not MobilePad.ShardActive and MobilePad.Holding, "기본 공격 소유 · 골편 손가락 무시")
  _UtilLogic.ElapsedSeconds = _UtilLogic.ElapsedSeconds + 0.51
  MobilePad:HoldTick()
  MobilePad:ShardTick()
  check(W.basic == 2 and W.requests == 0, "기본 공격만 반복 · 골편 0")
  MobilePad:EndGesture(27, SCREEN.S2)
  MobilePad:EndGesture(26, SCREEN.BasicAtk)
  check(W.requests == 0 and not MobilePad.Holding, "정리")
end)

-- 멈춤 사유 표: 반복이 시작된 뒤 각 사유 → 그 뒤 요청 0 · 떼도 놓기 시전 0
local stops = {
  { "menu", function() W.window = true end, function() W.window = false end },
  { "dead", function() W.player.PlayerComponent.Hp = 0 end, function() W.player.PlayerComponent.Hp = 100 end },
  { "map", function() W.player.CurrentMap = MAP_B end, function() W.player.CurrentMap = MAP_A end },
  { "edit", function() MobilePad.EditMode = true end, function() MobilePad.EditMode = false end },
  { "slot", function() W.book.Slots = "bone_prison,bone_shard,bone_rite,curse_weak" end, function() end },
  { "toggle", function() W.book.ShardHold = false end, function() end },
  { "aim", function() MobilePad:UpdateGesture(28, SCREEN.Cancel) end, function() end },
  { "focus", function() MobilePad:StopShardHold("focus") MobilePad:ClearGesture() end, function() end },
}
for _, s in ipairs(stops) do
  scenario("I04 반복 멈춤 사유 " .. s[1], function()
    shardOn()
    MobilePad:BeginGesture(1, 28, SCREEN.S2)
    step(6)
    local sent = W.requests
    check(sent >= 1 and MobilePad.ShardRepeating, s[1] .. ": 반복 중")
    s[2]()
    if s[1] ~= "aim" and s[1] ~= "focus" then step(1) end
    check(not MobilePad.ShardActive and MobilePad.ShardStopReason == s[1], s[1] .. ": 사유 " .. tostring(MobilePad.ShardStopReason))
    s[3]()
    step(20)
    check(W.requests == sent, s[1] .. ": 멈춘 뒤 요청 0 (" .. W.requests .. ")")
    MobilePad:EndGesture(28, SCREEN.S2 + Vector2(80, 0))
    check(W.requests == sent, s[1] .. ": 떼도 놓기 시전 0")
    check(not MobilePad:BlocksBasic(), s[1] .. ": 기본 공격 소유 풀림")
  end)
end

scenario("I04 마나 부족이면 요청을 보내지 않는다 (경고 남발 없음)", function()
  shardOn()
  W.stats.Mana = COST.bone_shard - 1
  MobilePad:BeginGesture(1, 29, SCREEN.S2)
  step(20)
  check(W.requests == 0 and MobilePad.ShardRepeating, "반복 중이어도 요청 0")
  W.stats.Mana = 100
  step(1)
  check(W.requests == 1, "마나가 차면 다시 보낸다")
  MobilePad:EndGesture(29, SCREEN.S2)
end)

scenario("I04 반복 전 취소 위로 갔다 돌아와 놓으면 예전처럼 한 번 (반복 안 함)", function()
  shardOn()
  MobilePad:BeginGesture(1, 30, SCREEN.S2)
  MobilePad:UpdateGesture(30, SCREEN.Cancel)
  check(not MobilePad.ShardActive and MobilePad.ShardStopReason == "aim", "취소 위 = 반복 소유 끝")
  MobilePad:UpdateGesture(30, SCREEN.S2 + Vector2(80, 0))
  step(10)
  check(W.requests == 0, "다시 밖으로 와도 반복 이어 가지 않음")
  MobilePad:EndGesture(30, SCREEN.S2 + Vector2(80, 0))
  check(W.requests == 1, "놓기 시전 1 (기존 끌기 규칙)")
end)

for _, s in ipairs(scenarios) do
  Reset()
  local ok, err = pcall(s[2])
  if not ok then error("[" .. s[1] .. "] " .. tostring(err), 0) end
end
print(string.format("mobile_input: %d개 장면 · 검사 %d/%d 통과", #scenarios, passed, total))
