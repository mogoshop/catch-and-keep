local p=_UserService:GetUsersByMapName("town")[1]
if not isvalid(p) then log_error("[VRF-P5] FAIL missing player") return end
local ck=function(n,ok,v) if ok then log("[VRF-P5] PASS "..n.." "..tostring(v)) else log_error("[VRF-P5] FAIL "..n.." "..tostring(v)) end end
local sv=p:GetComponent("script.PlayerSave") local q=p:GetComponent("script.PlayerQuest") local st=p:GetComponent("script.PlayerStats") local inv=p:GetComponent("script.PlayerInventory")
local old={save=sv.IsLoadSuccess,quest=q:GetSaveData(),stats=st:GetSaveData(),bag=inv.Bag,hp=p.PlayerComponent.Hp,mana=st.Mana}
sv.IsLoadSuccess=false
_TimerService:SetTimerOnce(function() q:LoadSaveData(old.quest) st:LoadSaveData(old.stats) inv.Bag=old.bag inv:RefreshDigest() st.Mana=old.mana p.PlayerComponent.Hp=old.hp sv.IsLoadSuccess=old.save log("[VRF-P5] restored player") end,7)
q.Index=1 q.State=2 q.Progress=1 st.Level=1 st.Exp=0 st.ExpToNext=100 st.Gold=100
inv.Bag={} for i=1,inv.BagSize do table.insert(inv.Bag,inv.StarterWeapon) end inv:RefreshDigest()
q:TurnIn()
ck("full bag preserves completed quest",q.Index==1 and q.State==2,q.Index)
ck("full bag consumes no rewards",st.Gold==100 and st.Exp==0 and #inv.Bag==inv.BagSize,st.Gold)
table.remove(inv.Bag) table.remove(inv.Bag) q:TurnIn()
ck("all item rewards delivered",#inv.Bag==inv.BagSize and _ItemData:Parse(inv.Bag[inv.BagSize-1]).base=="lamp1" and _ItemData:IsRune(inv.Bag[inv.BagSize]),#inv.Bag)
ck("experience and gold delivered once",st.Exp==80 and st.Gold==150,tostring(st.Exp).."/"..tostring(st.Gold))
ck("quest advances only after reward",q.Index==2 and q.State==0,q.Index)
q:TurnIn() ck("duplicate turn-in gives nothing",q.Index==2 and st.Gold==150 and st.Exp==80,st.Gold)
q.State=1 q.Progress=9 q:OnKill("hellhound") ck("wrong monster gives no progress",q.Progress==9,q.Progress)
q:OnKill("graveworm") ck("last target completes objective",q.State==2 and q.Progress==10,q.Progress)
q:OnKill("graveworm") ck("complete quest stops counting",q.Progress==10,q.Progress)
local sp=st.SkillPoints local ap=st.StatPoints st:GainExp(20)
ck("level up grants points",st.Level==2 and st.SkillPoints==sp+_GameData.skillPerLevel and st.StatPoints==ap+_GameData.statPerLevel,st.Level)
ck("quest contains location and action",_QuestData:Get(1).zone=="피 묻은 황무지" and _QuestData:Get(1).objective~="",_QuestData:Get(1).zone)
ck("world loot uses equipment icon",_ItemData:IconFor(inv.StarterWeapon)==_ItemData:GetBase("scythe1").icon,_ItemData:IconFor(inv.StarterWeapon))
