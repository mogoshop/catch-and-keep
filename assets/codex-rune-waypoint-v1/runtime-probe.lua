local total, passed = 0, 0
_ItemTables:Ensure()
for _, id in ipairs(_ItemTables.RuneOrder) do
    total = total + 1
    local rune = _ItemData:GetRune(id)
    local icon = _ItemData:IconFor(_ItemData:MakeRuneString(id, 1))
    local sprite = _ResourceService:LoadSpriteAndWait(icon)
    local ok = rune ~= nil and icon == rune.icon and _ItemData:IconPixels(icon) == 128 and sprite ~= nil and sprite.IsLoadComplete and sprite.Width == 128 and sprite.Height == 128
    if ok then passed = passed + 1 end
    log("[VRF-RUNE] " .. id .. " ok=" .. tostring(ok) .. " icon=" .. icon .. " px=" .. tostring(_ItemData:IconPixels(icon)))
end
log("[VRF-RUNE] summary=" .. tostring(passed) .. "/" .. tostring(total))
for _, key in ipairs({"waypoint_off", "waypoint_on"}) do
    local icon = _GameData:GetUiIcon(key)
    local sprite = _ResourceService:LoadSpriteAndWait(icon)
    log("[VRF-WAYPOINT] " .. key .. " ok=" .. tostring(sprite ~= nil and sprite.IsLoadComplete and sprite.Width == 256 and sprite.Height == 160) .. " ruid=" .. icon)
end
local player = _UserService.LocalPlayer
local travel = player:GetComponent("script.PlayerTravel")
local entity = _EntityService:GetEntityByPath("/maps/town/Waypoint")
if isvalid(entity) then
    local wp = entity:GetComponent("script.Waypoint")
    local original = wp.WaypointId
    wp.WaypointId = "__codex_unknown_waypoint__"
    wp.ShownState = -1
    wp:Look()
    log("[VRF-WAYPOINT] Look(off) ok=" .. tostring(entity.SpriteRendererComponent.SpriteRUID == _GameData:GetUiIcon("waypoint_off")))
    local known = ""
    for _, w in ipairs(_WaypointData:GetList()) do if travel:IsKnown(w.id) then known = w.id break end end
    if known ~= "" then
        wp.WaypointId = known
        wp.ShownState = -1
        wp:Look()
        log("[VRF-WAYPOINT] Look(on) ok=" .. tostring(entity.SpriteRendererComponent.SpriteRUID == _GameData:GetUiIcon("waypoint_on")) .. " known=" .. known)
    else log("[VRF-WAYPOINT] Look(on) unavailable=no-known-waypoint") end
    wp.WaypointId = original
    wp.ShownState = -1
    wp:Look()
else log("[VRF-WAYPOINT] Look unavailable=town-not-loaded") end
