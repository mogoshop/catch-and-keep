-- MCA v3 (Background도 끔 · 어둠 끔: OverlayLight off 매 틱 · /ui 자식 전부 끔 · 내 아바타·자식 끔)
-- MCA 맵 전수 캡처 (client) · 10-28 scratchpad/after/cap_client.lua 기반 + 새 이름(Gate·Waypoint·NPC) · 늦게 생긴 그림도 줄이고 나머지는 끔 · 안정 판정(자식 수 3틱 같음)
local KEEP = { TownBoard=1, ShopKeeper=1, Smith=1, Stash=1, Elder=1, Caravan=1, KeeperDaughter=1, Merchant=1, Apothecary=1, Scholar=1, Captain=1, Harbormaster=1, Scout=1, OutpostCaptain=1, Deserter=1, BloodAltar=1 }
local LEAVE = { MapleMapLayer=1 }
local cap = { last = "", ticks = 0, stable = 0, cnt = -1, done = true, s = 1, seen = {} }
local function keep(n)
  return string.sub(n, 1, 3) == "Art" or string.sub(n, 1, 5) == "Torch" or string.sub(n, 1, 4) == "Gate" or string.sub(n, 1, 8) == "Waypoint" or string.sub(n, 1, 6) == "Portal" or KEEP[n] ~= nil
end
local function sweep(map, me)
  for _, c in ipairs(map.Children) do
    if c ~= me and cap.seen[c] == nil then
      cap.seen[c] = true
      local n = c.Name
      if LEAVE[n] ~= nil then
      elseif keep(n) then
        local t = c.TransformComponent
        if t ~= nil then
          t.Position = Vector3(t.Position.x * cap.s, t.Position.y * cap.s, t.Position.z)
          t.Scale = Vector3(t.Scale.x * cap.s, t.Scale.y * cap.s, t.Scale.z)
        end
      else
        c.Enable = false
      end
    end
  end
end
_TimerService:SetTimerRepeat(function()
  local me = _UserService.LocalPlayer
  if not isvalid(me) or not isvalid(me.CurrentMap) then return end
  local map = me.CurrentMap
  local name = map.Name
  if name ~= cap.last then cap.last = name cap.ticks = 0 cap.stable = 0 cap.cnt = -1 cap.done = false cap.seen = {} return end
  if not cap.done then
    cap.ticks = cap.ticks + 1
    local n = #map.Children
    if n == cap.cnt then cap.stable = cap.stable + 1 else cap.stable = 0 cap.cnt = n end
    if cap.ticks < 6 or cap.stable < 3 then return end
    cap.done = true
    local info = _GameData:GetMapInfo(_GameConst:BaseMapName(name))
    local w = info ~= nil and info.w or 60
    local h = info ~= nil and info.h or 40
    cap.s = math.min(42 / (w + 1), 23.4 / (h + 1)) * 0.97
    sweep(map, me)
    local ui = _EntityService:GetEntityByPath("/ui")
    if isvalid(ui) then for _, u in ipairs(ui.Children) do u.Enable = false end end
    if me.AvatarRendererComponent ~= nil then me.AvatarRendererComponent.Enable = false end
    for _, c in ipairs(me.Children) do c.Enable = false end
    _CameraService:ZoomTo(30, 0)
    local tp,pr,gd,ar=0,0,0,0 for _,c in ipairs(map.Children) do local cn=c.Name if string.sub(cn,1,3)=="Art" then ar=ar+1 if string.sub(cn,-3)=="Top" then tp=tp+1 end if string.match(cn,"^ArtProp%d+$") then pr=pr+1 end if string.sub(cn,1,8)=="ArtGuide" then gd=gd+1 end end end log("[CAP] ready " .. name .. " s=" .. string.format("%.3f", cap.s) .. " n=" .. tostring(cap.cnt) .. " ticks=" .. tostring(cap.ticks) .. " art=" .. ar .. " prop=" .. pr .. " top=" .. tp .. " guide=" .. gd)
  end
  if cap.done then
    sweep(map, me)
    _OverlayLightService:SetOverlayLightEnabled(false)
    local p = me.TransformComponent.WorldPosition
    me.CameraComponent.CameraOffset = Vector2(0 - p.x, 0.5 * cap.s + 3.9 - p.y)
  end
end, 0.15)
log("[CAP] installed a23m act23")
