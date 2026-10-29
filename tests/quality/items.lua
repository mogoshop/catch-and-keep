-- @source PlayerQuest Quest/PlayerQuest.mlua TurnIn,RewardBagSlots,ParseGearOffer
-- @source GameData Data/GameData.mlua Ensure,GetDifficulty
-- @source ItemTables Data/ItemTables.mlua Ensure
-- @source ItemData Item/ItemData.mlua T,GetBase,Parse,Serialize,OldWeight,WeightedPick,PickBase,Generate,GenerateWithMinimum,GenerateQuestReward,GenerateEquipment,GetDropTable,RollRarity,PickSetPiece,PickUnique,MakeUnique,FillAffixes,PickAffix,RollAffix,TierOfLevel,LevelProgress,IsCountStat,AddModsRolled,RareName,RerollMods,AffixPool,ProvenanceMeta,DecodeMeta,EncodeMeta,AffixRow,NewItemUid,Base36
_ItemTables:Ensure()
_GameData:Ensure()
math.randomseed(20261029)
_UtilLogic = { RandomDouble = function() return math.random() end, RandomIntegerRange = function(_,lo,hi) return math.random(lo,hi) end }
DateTime={UtcNow={Elapsed=63900000000000}}   -- 10-30 I01: 출처 id(NewItemUid)는 시각만 쓴다 (추첨 없음)
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
-- Sparse/corrupt data terminates with existing minimal fallback; no invalid affix is invented to fake 3~5.
local affixes=_ItemTables.Affixes
_ItemTables.Affixes={}
local empty={mods={}};_ItemData:FillAffixes(empty,{slot='boots',name='fixture'},42,2)
assert(count(empty.mods)==1 and empty.mods.life~=nil)
_ItemTables.Affixes={{stat='def',prefix=false,ilvl=1,tier=0,slots='boots',name='fixture',min=1,max=2}}
local single={mods={}};_ItemData:FillAffixes(single,{slot='boots',name='fixture'},1,2)
assert(count(single.mods)==1 and single.mods.def~=nil)
_ItemTables.Affixes=affixes
-- Magic's one/two-affix branches keep their previous policy.
local randomDouble=_UtilLogic.RandomDouble
for _,roll in ipairs({0,0.9}) do
 _UtilLogic.RandomDouble=function() return roll end
 local magic={mods={}};_ItemData:FillAffixes(magic,{slot='boots',name='fixture'},42,1)
 assert(count(magic.mods)==(roll==0 and 1 or 2))
end
_UtilLogic.RandomDouble=randomDouble
local baseId=nil
for _,id in ipairs(_ItemTables.BaseOrder) do if _ItemTables.Bases[id].slot=='helm' then baseId=id break end end
local originalItem=_ItemData:Serialize({base=baseId,rarity=2,ilvl=42,name='saved',mods={life=10},sockets=1,runes={'el'}})
local rerolled=_ItemData:Parse(_ItemData:RerollMods(originalItem))
assert(rerolled.base==baseId and rerolled.rarity==2 and rerolled.ilvl==42 and rerolled.sockets==1 and rerolled.runes[1]=='el')
assert(count(rerolled.mods)>=3 and originalItem==_ItemData:Serialize(_ItemData:Parse(originalItem)))
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
 PlayerQuest:TurnIn("")
 assert(#inv.Bag==1 and st.Gold>0 and st.Exp==100 and PlayerQuest.Index==2)
 assert(_ItemData:GetBase(_ItemData:Parse(inv.Bag[1]).base).reqLv<=40)
 local gold=st.Gold;PlayerQuest:TurnIn("");assert(st.Gold==gold and #inv.Bag==1)
end
PlayerQuest.State=2;PlayerQuest.Index=1
for i=1,60 do inv.Bag[i]='held' end
local gold=st.Gold;local exp=st.Exp
PlayerQuest:TurnIn("")
assert(PlayerQuest.State==2 and PlayerQuest.Index==1 and st.Gold==gold and st.Exp==exp and #inv.Bag==60)
print('[quality/items] quest report: wearable reward, no duplicate, full-bag all-or-nothing passed')

-- Actual act4 source pool: lv40 ash_king only yields the req33/35/40 special bases and keeps ground-drop presentation.
local spawned={}
_LootSystem={Spawn=function(_,pos,uid,kind,made) table.insert(spawned,made) end}
_Util.Pos2=function() return {x=0,y=0} end
_GameData.GetMonsterName=function() return 'fixture' end
q.reward='unique:1';q.target='ash_king'
local reqs={}
for i=1,120 do
 PlayerQuest.Index=24;PlayerQuest.State=2;inv.Bag={}
 PlayerQuest:TurnIn("")
 assert(#inv.Bag==0,'boss unique should keep ground presentation')
 local it=_ItemData:Parse(spawned[#spawned]);local req=_ItemData:GetBase(it.base).reqLv
 assert((req==33 or req==35 or req==40) and it.rarity==3 and it.ilvl==42)
 reqs[req]=true
end
assert(reqs[33] and reqs[35] and reqs[40])
-- No boss-specific candidate falls back to general pool; no uniques at all falls back to wearable rare.
q.target='no_source_fixture';PlayerQuest.Index=1;PlayerQuest.State=2;inv.Bag={}
PlayerQuest:TurnIn("");assert(#inv.Bag==1)
_ItemTables.UniqueList={};PlayerQuest.Index=1;PlayerQuest.State=2;inv.Bag={}
PlayerQuest:TurnIn("")
local fallback=_ItemData:Parse(inv.Bag[1]);assert(fallback.rarity>=2 and _ItemData:GetBase(fallback.base).reqLv<=40)
print('[quality/items] sparse pools, magic branches, reroll save fields, ash_king ground reward and missing-source fallback passed')
