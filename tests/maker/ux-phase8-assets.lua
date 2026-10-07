-- 서버: 가방 백업/180초 자동 복원 + 20초/31초 혼 수명 검사.
local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P8-ASSET] missing player") return end
local sv=p:GetComponent("script.PlayerSave") local saved=sv.IsLoadSuccess sv.IsLoadSuccess=false
local inv=p:GetComponent("script.PlayerInventory") local old=inv:GetSaveData()
local items={} for _,id in ipairs({"belt1","belt2","lamp2","lamp3"}) do table.insert(items,_ItemData:Serialize({base=id,rarity=0,ilvl=1,name="",mods={},sockets=0,runes={}})) end
inv.Bag=items inv:RefreshDigest()
local restored=false
local restore=function() if restored then return end restored=true inv:LoadSaveData(old) sv.IsLoadSuccess=saved sv.LastSaved.UXAssetRestore=nil log("[VRF-P8-ASSET] inventory restored") end
sv.LastSaved.UXAssetRestore=restore _TimerService:SetTimerOnce(restore,180)
local soul=_SpawnService:SpawnByModelId(_GameConst.ModelSoulOrb,"P8_lifetime",Vector3(12,6,0),p.CurrentMap)
_Util:AfterSpawn(soul,"script.SoulOrb",function(o)
 o:Setup(p.PlayerComponent.UserId,"hellhound",1,"normal",1,"","","")
 log("[VRF-P8-SOUL] lifetime "..o.LifeSeconds)
 _TimerService:SetTimerOnce(function() if isvalid(soul) then log("[VRF-P8-SOUL] PASS readable after 20 seconds") else log_error("[VRF-P8-SOUL] FAIL expires too early") end end,20)
 _TimerService:SetTimerOnce(function() if not isvalid(soul) then log("[VRF-P8-SOUL] PASS expires after 30 seconds") else log_error("[VRF-P8-SOUL] FAIL never expires") soul:Destroy() end end,31)
end,nil)
log("[VRF-P8-ASSET] four custom inventory icons ready")
