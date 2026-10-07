local ck=function(n,ok) if ok then log("[VRF-P7G] PASS "..n) else log_error("[VRF-P7G] FAIL "..n) end end
for _,suffix in ipairs({"","_nm","_hell"}) do
 local town=_EntityService:GetEntityByPath("/maps/town"..suffix)
 local field=_EntityService:GetEntityByPath("/maps/map01"..suffix)
 local t=town:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
 local f=field:GetFirstChildComponentByTypeName("RectTileMapComponent",true)
 for _,cell in ipairs({Vector2Int(-1,2),Vector2Int(0,2)}) do local tile=t:GetTile(cell) ck("well barrier "..suffix.." "..tostring(cell),tile~=nil and tile.IsCollidable) end
 for _,cell in ipairs({Vector2Int(2,3),Vector2Int(2,4),Vector2Int(3,3),Vector2Int(3,4),Vector2Int(5,3),Vector2Int(5,4),Vector2Int(6,3),Vector2Int(6,4)}) do local tile=f:GetTile(cell) ck("abyss barrier "..suffix.." "..tostring(cell),tile~=nil and tile.IsCollidable) end
 for _,cell in ipairs({Vector2Int(4,3),Vector2Int(4,4)}) do local tile=f:GetTile(cell) ck("bridge walkable "..suffix.." "..tostring(cell),tile~=nil and not tile.IsCollidable) end
end
