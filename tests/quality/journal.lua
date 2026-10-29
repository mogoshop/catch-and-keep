-- @source GameData Data/GameData.mlua Ensure,GetDifficulty
-- @source JournalData Data/JournalData.mlua Ensure,GetDailies,GetDaily,GetMonsters,GetAchievement
-- @source ItemTables Data/ItemTables.mlua Ensure
-- @source PlayerJournal Progress/PlayerJournal.mlua DailyAvailable,EnsureDaily,Record,DailyIndex,Diff,CompleteDaily,DailyGold,MonsterCount,Progress,RequestClaim,AchGold,CountClaims,PickBonusRune,LoadSaveData,SetTitle
-- @source PlayerInventory Item/PlayerInventory.mlua PutBagItems
_GameData:Ensure();_JournalData:Ensure();_ItemTables:Ensure()
math.randomseed(20261029)
_UtilLogic={RandomIntegerRange=function(_,lo,hi) return math.random(lo,hi) end}
_Util={Notify=function() end,Banner=function() end}
_Supporter={ApplyTag=function() end}
_ItemData={GetRune=function(_,id) return _ItemTables.Runes[id] end,MakeRuneString=function(_,id) return 'rune:'..id end}
local quest={Diff=0,Index=1,ByDiff={}}
local stats={MaxDifficulty=0,Gold=5,ExpToNext=100,Exp=0,GainExp=function(self,n) self.Exp=self.Exp+n end,AddGold=function(self,n) self.Gold=self.Gold+n end}
local inv=PlayerInventory; inv.RefreshDigest=function() end; inv.Bag={};inv.BagSize=60;inv.SocketTokens=4
local entity={PlayerComponent={UserId='owner'},GetComponent=function(_,key)
 if key=='script.PlayerStats' then return stats elseif key=='script.PlayerQuest' then return quest elseif key=='script.PlayerInventory' then return inv end end}
PlayerJournal.Entity=entity
_QuestData={Count=function() return 25 end}
local day=20700
PlayerJournal.Today=function() return day end
local function reset() PlayerJournal.DailyDay=0;PlayerJournal.Daily={};PlayerJournal.Dirty=false end
local function key() local keys={} for _,slot in ipairs(PlayerJournal.Daily) do table.insert(keys,slot.id) end return table.concat(keys,',') end
local function includes(id) for _,slot in ipairs(PlayerJournal.Daily) do if slot.id==id then return true end end return false end
for _,depth in ipairs({0,1}) do
 _GameData.depthEnabled=depth
 reset();local seen={};local all={}
 for d=20700,20713 do
  day=d;PlayerJournal:EnsureDaily()
  assert(#PlayerJournal.Daily==3)
  local uniq={} for _,s in ipairs(PlayerJournal.Daily) do assert(not uniq[s.id]);uniq[s.id]=true;all[s.id]=true end
  seen[key()]=true
  local stable=key();PlayerJournal.Daily[1].p=7;PlayerJournal:EnsureDaily()
  assert(key()==stable and PlayerJournal.Daily[1].p==7,'same-day progress reset')
 end
 local n=0 for _ in pairs(seen) do n=n+1 end
 assert(n==(depth==0 and 7 or 8),'daily rotation degenerated')
 local covered=0 for _ in pairs(all) do covered=covered+1 end
 assert(covered==(depth==0 and 7 or 8),'candidate never selected')
end
-- All available difficulties completed, current state wins over stale ByDiff.
_GameData.depthEnabled=0;stats.MaxDifficulty=2
quest.Index=26;quest.ByDiff={['0']={i=1},['1']={i=26},['2']={i=26}}
assert(not PlayerJournal:DailyAvailable(_JournalData:GetDaily('d_quest1')))
PlayerJournal.DailyDay=day
PlayerJournal.Daily={{id='d_kill60',p=59,done=false},{id='d_quest1',p=0,done=false},{id='d_capture2',p=2,done=true}}
PlayerJournal:EnsureDaily()
assert(#PlayerJournal.Daily==3 and not includes('d_quest1'))
assert(PlayerJournal.Daily[1].p==59 and PlayerJournal.Daily[2].done)
local fixed=key();PlayerJournal:EnsureDaily();assert(key()==fixed)
quest.Index=25;quest.ByDiff['0']={i=26};assert(PlayerJournal:DailyAvailable(_JournalData:GetDaily('d_quest1')))
quest.Index=26;stats.MaxDifficulty=0;quest.ByDiff={};assert(not PlayerJournal:DailyAvailable(_JournalData:GetDaily('d_quest1')))
stats.MaxDifficulty=1;assert(PlayerJournal:DailyAvailable(_JournalData:GetDaily('d_quest1')))
PlayerJournal.Daily={{id='d_quest1',p=1,done=true},{id='d_kill30',p=30,done=true},{id='d_raise10',p=10,done=true}}
quest.ByDiff['1']={i=26};PlayerJournal:EnsureDaily()
assert(includes('d_quest1') and PlayerJournal.Daily[1].done,'completed reward made repeatable')
local oldPool=_JournalData.GetDailies
_JournalData.GetDailies=function() return {} end;day=day+1;PlayerJournal:EnsureDaily();assert(#PlayerJournal.Daily==0)
_JournalData.GetDailies=oldPool
-- Every candidate count 0..8, including old stride failures at 3 and 6.
quest.Index=1;stats.MaxDifficulty=0;_GameData.depthEnabled=1
local definitions=oldPool(_JournalData)
for size=0,8 do
 local pool={} for i=1,size do pool[i]=definitions[i] end
 _JournalData.GetDailies=function() return pool end
 reset();local covered={}
 for d=21000,21015 do
  day=d;PlayerJournal:EnsureDaily();assert(#PlayerJournal.Daily==math.min(3,size))
  for _,slot in ipairs(PlayerJournal.Daily) do covered[slot.id]=true end
 end
 local n=0 for _ in pairs(covered) do n=n+1 end assert(n==size)
end
_JournalData.GetDailies=oldPool;_GameData.depthEnabled=0
-- Last report emits before Index advances: the final quest daily completes, stays done, never repays.
quest.Index=25;quest.Diff=0;quest.ByDiff={['1']={i=26},['2']={i=26}};stats.MaxDifficulty=2
PlayerJournal.DailyDay=day;PlayerJournal.Daily={{id='d_quest1',p=0,done=false},{id='d_kill30',p=5,done=false},{id='d_raise10',p=2,done=false}}
PlayerJournal.CheckAchievements=function() end;PlayerJournal.MaybePulse=function() end
local goldBefore=stats.Gold
PlayerJournal:Record('quest','',1)
assert(PlayerJournal.Daily[1].id=='d_quest1' and PlayerJournal.Daily[1].done and stats.Gold>goldBefore)
quest.Index=26;local goldAfter=stats.Gold
PlayerJournal:EnsureDaily();PlayerJournal:EnsureDaily()
assert(PlayerJournal.Daily[1].done and PlayerJournal.Daily[2].p==5 and stats.Gold==goldAfter)
-- Exact thirteen core species; extras and all other acts cannot fill missing core entries.
local achievement=_JournalData:GetAchievement('a_codex')
local members={};for id in string.gmatch(achievement.target,'[^|]+') do members[id]=true end
local n=0;for _ in pairs(members) do n=n+1 end;assert(n==achievement.count and n==13)
PlayerJournal.Kills={};PlayerJournal.Captures={}
for _,m in ipairs(_JournalData:GetMonsters()) do
 assert(m.sourceId~=nil and m.region~=nil)
 if not members[m.sourceId] then PlayerJournal.Kills[m.sourceId]=1 end
end
assert(PlayerJournal:Progress(achievement)==0,'unrelated species counted')
for _,m in ipairs(_JournalData:GetMonsters()) do
 if members[m.sourceId] then assert(m.region==1);PlayerJournal.Kills[m.sourceId]=1 end
end
assert(PlayerJournal:Progress(achievement)==13,'canonical source IDs not counted')
PlayerJournal.Kills={}
for _,m in ipairs(_JournalData:GetMonsters()) do
 if members[m.sourceId] then PlayerJournal.Kills[m.id]=2 end
end
assert(PlayerJournal:Progress(achievement)==13,'legacy IDs not compatible')
local mon=nil;for _,m in ipairs(_JournalData:GetMonsters()) do if m.id=='ashendead' then mon=m end end
assert(mon and mon.sourceId=='ashen_dead')
PlayerJournal.Kills.ashen_dead=3;assert(PlayerJournal:MonsterCount(PlayerJournal.Kills,mon)==3,'alias counts doubled')
-- Existing earned and pending flags survive, including legacy unqualified achievement keys.
PlayerJournal:LoadSaveData({a={'a_codex@0','a_level10'},ac={'a_codex@0'},k=PlayerJournal.Kills,dd=day,d={}})
assert(PlayerJournal.AchDone['a_codex@0'] and PlayerJournal.AchDone['a_level10@0'] and PlayerJournal.AchClaim['a_codex@0'])
-- Full and overfull bag: no gold/rune/token/title/claim changes; one free slot: exactly once.
senderUserId='owner'
for _,size in ipairs({59,60,61}) do
 inv.Bag={} for i=1,size do inv.Bag[i]='held' end
 inv.SocketTokens=4;stats.Gold=5
 PlayerJournal.AchClaim={['a_kill1000@2']=true};PlayerJournal.Titles={};PlayerJournal.TitlePick=''
 PlayerJournal:RequestClaim('a_kill1000@2')
 if size>=60 then
  assert(stats.Gold==5 and #inv.Bag==size and inv.SocketTokens==4 and PlayerJournal.Titles.a_kill1000==nil and PlayerJournal.AchClaim['a_kill1000@2'])
 else
  assert(stats.Gold>5 and #inv.Bag==60 and inv.SocketTokens==4 and PlayerJournal.Titles.a_kill1000==2 and not PlayerJournal.AchClaim['a_kill1000@2'])
  local gold=stats.Gold;PlayerJournal:RequestClaim('a_kill1000@2');assert(stats.Gold==gold and #inv.Bag==60)
 end
end
PlayerJournal.AchClaim={['a_kill1000@1']=true};stats.Gold=5
PlayerJournal:RequestClaim('a_kill1000@1');assert(stats.Gold>5 and inv.SocketTokens==5 and #inv.Bag==61)
PlayerJournal.AchClaim={['a_kill1000@2']=true};inv.Bag={};stats.Gold=5
local pick=PlayerJournal.PickBonusRune;PlayerJournal.PickBonusRune=function() return '' end
PlayerJournal:RequestClaim('a_kill1000@2');assert(stats.Gold==5 and PlayerJournal.AchClaim['a_kill1000@2'])
PlayerJournal.PickBonusRune=pick
senderUserId='stranger';PlayerJournal:RequestClaim('a_kill1000@2');assert(stats.Gold==5 and #inv.Bag==0)
print('[quality/journal] daily 7/8-pool rotation, 0-pool, completion replacement/progress preservation, canonical/legacy core13, saved awards, bags59/60/61 and duplicate claims passed')
