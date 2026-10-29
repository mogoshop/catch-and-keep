-- @source PlayerQuest Quest/PlayerQuest.mlua TurnIn
-- @source GameData Data/GameData.mlua Ensure,GetDifficulty
-- @source ItemTables Data/ItemTables.mlua Ensure
-- @source ItemData Item/ItemData.mlua T,GetBase,Parse,Serialize,OldWeight,WeightedPick,PickBase,Generate,GenerateWithMinimum,GenerateQuestReward,GenerateEquipment,GetDropTable,RollRarity,PickSetPiece,PickUnique,MakeUnique,FillAffixes,PickAffix,RollAffix,TierOfLevel,LevelProgress,IsCountStat,AddModsRolled,RareName
_ItemTables:Ensure()
_GameData:Ensure()
math.randomseed(20261029)
_UtilLogic = { RandomDouble = function() return math.random() end, RandomIntegerRange = function(_,lo,hi) return math.random(lo,hi) end }
local function count(t) local n=0 for _ in pairs(t) do n=n+1 end return n end
local levels={1,12,25,40,41,42,70,71,99}
local cases,thin=0,0
for _,ilvl in ipairs(levels) do
    for _,slot in ipairs({'weapon','offhand','helm','armor','gloves','belt','boots','amulet','ring'}) do
        local eligible={}
        local tier=_ItemData:TierOfLevel(ilvl)
        for _,a in ipairs(_ItemTables.Affixes) do
            if a.ilvl<=ilvl and a.tier>=tier-1 and a.tier<=tier and
                (a.slots=='any' or string.find(','..a.slots..',',','..slot..',',1,true)) then eligible[a.stat]=true end
        end
        for wanted=3,5 do
            for split=math.max(1,wanted-3),math.min(3,wanted-1) do
                local realRandom=_UtilLogic.RandomIntegerRange
                local calls=0
                _UtilLogic.RandomIntegerRange=function(_,lo,hi)
                    calls=calls+1
                    if calls==1 then return wanted elseif calls==2 then return split end
                    return realRandom(_UtilLogic,lo,hi)
                end
                local item={mods={}}
                _ItemData:FillAffixes(item,{slot=slot,name='fixture'},ilvl,2)
                _UtilLogic.RandomIntegerRange=realRandom
                local expected=math.min(wanted,count(eligible))
                assert(count(item.mods)==expected,slot..'/'..ilvl..' wanted '..wanted..' got '..count(item.mods)..' expected '..expected)
                for stat in pairs(item.mods) do assert(eligible[stat], 'out-of-pool stat') end
                if expected<wanted then thin=thin+1 end
                cases=cases+1
            end
        end
    end
end
-- Every rarity branch is forced, not left to lucky sampling. Bounds use reqLv; ilvl stays lv+2.
local original=_ItemData.RollRarity
local generated=0
for _,lv in ipairs(levels) do
    for rarity=0,4 do
        _ItemData.RollRarity=function() return rarity end
        for i=1,60 do
            local item=_ItemData:Parse(_ItemData:GenerateQuestReward(lv,'boss',300,2))
            assert(item.ilvl==lv+2,'quest ilvl changed')
            assert(_ItemData:GetBase(item.base).reqLv<=lv,'unwearable quest reward at '..lv)
            assert(item.rarity>=2,'lost minimum rarity')
            generated=generated+1
        end
    end
end
-- Ordinary drops retain the old upper bound, and may exceed wearer level.
_ItemData.RollRarity=function() return 2 end
local future=false
for i=1,500 do
 local it=_ItemData:Parse(_ItemData:Generate(42,'boss',300))
 if _ItemData:GetBase(it.base).reqLv>40 then future=true end
end
assert(future,'ordinary drop pool was accidentally restricted')
-- Empty unique/set pools degrade to wearable rare rather than selecting an illegal piece.
local oldU,oldS,oldSO=_ItemTables.UniqueList,_ItemTables.SetPieces,_ItemTables.SetPieceOrder
_ItemTables.UniqueList={}; _ItemTables.SetPieces={}; _ItemTables.SetPieceOrder={}
for _,r in ipairs({3,4}) do
 _ItemData.RollRarity=function() return r end
 local it=_ItemData:Parse(_ItemData:GenerateQuestReward(40,'boss',300,2))
 assert(it.rarity==2 and _ItemData:GetBase(it.base).reqLv<=40)
end
_ItemTables.UniqueList=oldU;_ItemTables.SetPieces=oldS;_ItemTables.SetPieceOrder=oldSO
_ItemData.RollRarity=original
print(string.format('[quality/items] %d affix allocations (%d pool-limited); %d forced-rarity quest rewards; normal drop/fallback preserved',cases,thin,generated))

-- Exercise the quest entry point, including full-bag rollback and duplicate report protection.
_Util={IsAlive=function() return true end,Notify=function() end,Banner=function() end}
_GameEvents={Emit=function() end}
_GameData.GetUiIcon=function() return "" end
_ItemData.IconFor=function() return "" end
local st={Level=40,Difficulty=0,SkillPoints=3,StatPoints=2,Gold=0,Exp=0,
 AddGold=function(self,n) self.Gold=self.Gold+n end,GainExp=function(self,n) self.Exp=self.Exp+n end}
local inv={Bag={},BagSize=60,SocketTokens=0,PutBagItems=function(self,items) for _,s in ipairs(items) do table.insert(self.Bag,s) end end}
local entity={PlayerComponent={UserId='fixture'},GetComponent=function(_,key)
 if key=='script.PlayerStats' then return st elseif key=='script.PlayerInventory' then return inv end end}
PlayerQuest.Entity=entity; PlayerQuest.NotifyQuest=function() end;PlayerQuest.RefreshPermanent=function() end
local q={reward='gen:3',target='',act=4,gold=20,title='fixture'}
_QuestData={Get=function() return q end,Count=function() return 25 end,RewardText=function() return '' end,
 ExpFor=function() return 100 end,LastOfAct=function() return -1 end}
for _,reward in ipairs({'gen:3','unique:1'}) do
 q.reward=reward
 PlayerQuest.Index=1;PlayerQuest.State=2;PlayerQuest.Diff=0
 inv.Bag={};st.Gold=0;st.Exp=0
 PlayerQuest:TurnIn()
 assert(#inv.Bag==1 and st.Gold>0 and st.Exp==100 and PlayerQuest.Index==2)
 assert(_ItemData:GetBase(_ItemData:Parse(inv.Bag[1]).base).reqLv<=40)
 local gold=st.Gold;PlayerQuest:TurnIn();assert(st.Gold==gold and #inv.Bag==1)
end
PlayerQuest.State=2;PlayerQuest.Index=1
for i=1,60 do inv.Bag[i]='held' end
local gold=st.Gold;local exp=st.Exp
PlayerQuest:TurnIn()
assert(PlayerQuest.State==2 and PlayerQuest.Index==1 and st.Gold==gold and st.Exp==exp and #inv.Bag==60)
print('[quality/items] quest report: wearable reward, no duplicate, full-bag all-or-nothing passed')
