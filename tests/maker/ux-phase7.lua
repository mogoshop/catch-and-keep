-- server_main: 저장을 잠시 막고 12초 후 장비를 원상 복구한다.
local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P7] FAIL missing player") return end
local inv=p:GetComponent("script.PlayerInventory") local sv=p:GetComponent("script.PlayerSave")
local old=inv:GetSaveData() local loaded=sv.IsLoadSuccess local costume=p.CostumeManagerComponent
local ck=function(n,ok,v) if ok then log("[VRF-P7] PASS "..n.." "..tostring(v)) else log_error("[VRF-P7] FAIL "..n.." "..tostring(v)) end end
ck("personal avatar captured",inv.AppearanceReady and costume.UseCustomEquipOnly,inv.AppearanceReady)
local body=costume.CustomBodyEquip local hair=costume.CustomHairEquip local face=costume.CustomFaceEquip
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function() inv:LoadSaveData(old) sv.IsLoadSuccess=loaded log("[VRF-P7] restored equipment") end,12)
for _,id in ipairs({"scythe1","scythe2","scythe3","staff1","staff2","staff3","helm1","helm2","helm3","armor1","armor2","armor3","gloves1","gloves2","boots1","boots2"}) do
 local b=_ItemData:GetBase(id) local s=id.."|0|1|test||0|"
 ck("icon matches wearable "..id,b.avatar==b.icon and _ItemData:IconFor(s)=="thumbnail://"..b.avatar,b.avatar)
end
local apply=function(tier)
 inv.Equip={weapon="staff"..tier.."|0|1|test||0|",helm="helm"..tier.."|0|1|test||0|",armor="armor"..tier.."|0|1|test||0|",gloves="gloves1|0|1|test||0|",boots="boots1|0|1|test||0|"} inv:RefreshDigest() inv:ApplyEquipment()
 ck("weapon appearance tier "..tier,costume.CustomOneHandedWeaponEquip==_ItemData:GetBase("staff"..tier).avatar,costume.CustomOneHandedWeaponEquip)
 ck("robe appearance tier "..tier,costume.CustomLongcoatEquip==_ItemData:GetBase("armor"..tier).avatar,costume.CustomLongcoatEquip)
 ck("hood appearance tier "..tier,costume.CustomCapEquip==_ItemData:GetBase("helm"..tier).avatar,costume.CustomCapEquip)
 ck("personal face and hair preserved",costume.CustomBodyEquip==body and costume.CustomHairEquip==hair and costume.CustomFaceEquip==face,nil)
 ck("longcoat has no coat pants conflict",costume.CustomCoatEquip=="" and costume.CustomPantsEquip=="",nil)
 ck("weapon has no two handed conflict",costume.CustomTwoHandedWeaponEquip=="" and costume.CustomSubWeaponEquip=="",nil)
end
apply(1)
_TimerService:SetTimerOnce(function() apply(3) end,4)
_TimerService:SetTimerOnce(function()
 inv:StripEquipment()
 ck("death unequips weapon",costume.CustomOneHandedWeaponEquip=="",nil)
 ck("death keeps modest basic robe",costume.CustomLongcoatEquip==_ItemData:GetBase("armor1").avatar,nil)
 inv:LoadSaveData(old)
 ck("restore equips original weapon",costume.CustomOneHandedWeaponEquip==inv:EquippedAvatar("weapon"),nil)
end,9)
