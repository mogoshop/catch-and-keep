-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName
-- @source SkillBook Skill/SkillBook.mlua RosterLine+,GetRankSummary+,PowerLevelAt+,GetPowerLevel+,GetManaCost+,SkillCooldown+,GetCommandAura+,UseHint+,RankCap,CanLearn+,StageRanks+,NextStage+,IsComplete+
-- @source UndeadSystem Undead/UndeadSystem.mlua MaxFor+,GetBaseStats,MakeRecord+,NodeForm+,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,FormName,RosterOf+
-- @source SkillWindow UI/Windows/SkillWindow.mlua StatLine,Pick,RenderWorkshop+
-- @source SkillOffer UI/Windows/SkillOffer.mlua Pick+
_GameData:Ensure();_SkillData:Ensure()
Environment={IsPublishedPlay=function() return true end}
_SkeletonResonance={AtkMult=1,Radius=1,Cooldown=1}
_UtilLogic={ElapsedSeconds=0,RandomIntegerRange=function(_,lo,hi) return lo end}
local choices={}
local quest={ChoiceTier=function(_,slot,axis) return choices[slot..':'..axis] or 0 end}
local bonus=1
local stats={Level=99,SkillPoints=20,BonusCurseDur=0,BonusCurseEff=0,
 GetSkillLevelBonus=function() return bonus end,GetMinionPct=function() return 25 end,
 GetSpellPowerPct=function() return 0 end,GetCastCooldownMult=function() return 0.5 end}
local book=SkillBook
local entity={Id='fixture',PlayerComponent={UserId='fixture'},GetComponent=function(_,key)
 if key=='script.PlayerStats' then return stats elseif key=='script.PlayerQuest' then return quest elseif key=='script.SkillBook' then return book end end}
_GameConst={LevelOf=function() return stats.Level end}
book.Entity=entity;book.IsServer=function() return true end
local values={}
_UIKit={Colored=function(_,_,text) return text end,Comp=function(_,key) return entity:GetComponent(key) end,
 SetText=function(_,path,text) values[path]=text end,SetIcon=function() end,SetColor=function() end,SetEnabled=function() end,
 SetPos=function() end,Get=function() return nil end}
function isvalid(x) return x~=nil end
function Vector2(x,y) return {x=x,y=y} end
-- Gear crosses projectile/mana tiers; preview and cast use precisely the same effective rank.
book.Levels={bone_shard=4,wraith_dash=4,bone_spear=4}
local text=SkillWindow:StatLine(book,stats,'bone_shard')
assert(book:GetPowerLevel('bone_shard')==5)
assert(string.find(text,'마나 '..book:GetManaCost('bone_shard',book:GetPowerLevel('bone_shard')),1,true),text)
assert(string.find(text,'뼛조각 2발',1,true),text)
local dash=SkillWindow:StatLine(book,stats,'wraith_dash')
assert(string.find(dash,string.format('충전 %.2f초',book:DashCooldown(book:GetPowerLevel('wraith_dash'))),1,true),dash)
assert(not string.find(dash,'충전 1.80초',1,true),'dash incorrectly affected by FCR')
choices['2:soul']=3;book.Levels.bone_spear=3
assert(book:GetLevel('bone_spear')==4 and book:GetPowerLevel('bone_spear')==7 and book:PowerLevelAt('bone_spear',5)==8)
local spear=SkillWindow:StatLine(book,stats,'bone_spear')
assert(string.find(spear,'마나 '..book:GetManaCost('bone_spear',7),1,true),spear)
-- Free quest rank is counted once; bonus label does not misattribute quest ranks to equipment.
book.Levels.bone_spear=0
assert(book:GetPowerLevel('bone_spear')==4)
local freeSpear=SkillWindow:StatLine(book,stats,'bone_spear')
assert(string.find(freeSpear,'마나 15',1,true) and not string.find(freeSpear,'장비 +',1,true),freeSpear)
-- Node ranks never receive gear bonuses, and legacy early investments use NodeUsable.
book.Levels={armor_thick=2,bone_armor=5};stats.Level=99;bonus=9
assert(book:GetPowerLevel('armor_thick')==2 and book:PowerLevelAt('armor_thick',3)==3)
local node=SkillWindow:StatLine(book,stats,'armor_thick')
assert(string.find(node,'+40%',1,true) and string.find(node,'+60%',1,true),node)
assert(not string.find(node,'추가 랭크',1,true),node)
stats.Level=3
assert(book:GetPowerLevel('armor_thick')==1)
node=SkillWindow:StatLine(book,stats,'armor_thick')
assert(string.find(node,'+20%',1,true) and string.find(node,'+60%',1,true),node)
-- Locked, unlearned node still previews hypothetical rank1 while stating its learn condition.
book.Levels={raise_skeleton=1};stats.Level=1;bonus=9
local locked=SkillWindow:StatLine(book,stats,'skeleton_mastery')
assert(string.find(locked,'배우면:',1,true) and string.find(locked,'+8%',1,true),locked)
assert(book:CanLearn('skeleton_mastery',1,1)~='')
-- Aura unlearned/current/next preview depends on the supplied level, with current node modifiers.
stats.Level=99;bonus=0;book.Levels={aura_deep=2,dash_legion=1}
assert(book:GetCommandAura().atk==0 and book:GetCommandAura().speed==5 and book:GetCommandAura().resist==0)
local before=book:GetRankSummary('command_aura',1)
assert(string.find(before,'+9.8%',1,true),before)
book.Levels.command_aura=4
assert(book:GetRankSummary('command_aura',1)==before,'preview reads learned rank instead of argument')
local current=book:GetRankSummary('command_aura',4);local nextRank=book:GetRankSummary('command_aura',5)
assert(current~=nextRank)
assert(book:GetCommandAura().atk==book:CommandAuraAt(4).atk)
-- Common FCR still applies once to ordinary skills; gear removal restores prior mana/charge.
book.Levels={bone_shard=4,wraith_dash=1};bonus=0
local naked=SkillWindow:StatLine(book,stats,'bone_shard')
assert(string.find(naked,'마나 6',1,true) and string.find(naked,'재사용 0.38초',1,true),naked)
bonus=2
local charged=SkillWindow:StatLine(book,stats,'wraith_dash')
assert(string.find(charged,'마나 4',1,true) and string.find(charged,'충전 3.80초',1,true),charged)
bonus=0
assert(string.find(SkillWindow:StatLine(book,stats,'wraith_dash'),'충전 4.00초',1,true))
-- Summon caps include nodes and quest reward; ordinary-form next-spawn values share the live base calculations.
book.Levels={raise_skeleton=5,raise_mage=5,skel_legion=2,mage_legion=2,skeleton_mastery=3,mage_focus=2,command_aura=4}
choices['1:command']=3
local summary=book:GetRankSummary('raise_skeleton',5)
assert(string.find(summary,'최대 '.._UndeadSystem:MaxFor(entity,'skeleton',5)..'기',1,true),summary)
assert(string.find(summary,'일반형',1,true) and string.find(summary,'다음 소환 기준',1,true),summary)
local mage=book:GetRankSummary('raise_mage',5)
assert(string.find(mage,'최대 '.._UndeadSystem:MaxFor(entity,'mage',5)..'기',1,true),mage)
local base=_UndeadSystem:GetBaseStats('mage',5,book:GetPowerLevel('skeleton_mastery'),stats.Level)
local equipment=1.25*(1+book:GetCommandAura().atk/100)
local expected=math.floor(base.atk*(1+_GameData.mageFocusPct/100*book:Node('mage_focus'))*equipment)
assert(string.find(mage,'공격 '..expected,1,true),mage)
for _,kind in ipairs({'skeleton','mage'}) do
 for _,rank in ipairs({1,2,3,5,6,18,20,24}) do
  local id=kind=='mage' and 'raise_mage' or 'raise_skeleton'
  local txt=book:GetRankSummary(id,rank)
  assert(string.find(txt,'최대 '.._UndeadSystem:MaxFor(entity,kind,rank)..'기',1,true),txt)
 end
end
local record=_UndeadSystem:MakeRecord(entity,'mage',5,nil)
assert(record.atk==expected and record.hp==math.floor(base.hp*equipment),'summary/live ordinary-form record diverged')
-- Selecting a node changes name/description/current-next effect; selecting twice cannot spend points.
book.Levels={bone_armor=5,armor_thick=1}
SkillWindow.SelMain='bone_armor';SkillWindow.Selected='armor_thick'
SkillWindow:RenderWorkshop(book,stats)
assert(values['SkillWin/WS/Name']==_SkillData:Get('armor_thick').name)
assert(string.find(values['SkillWin/WS/Desc'],_SkillData:Get('armor_thick').desc,1,true))
assert(string.find(values['SkillWin/WS/Stat'],'+20%',1,true) and string.find(values['SkillWin/WS/Stat'],'+40%',1,true))
local calls=0;SkillWindow.Act=function() calls=calls+1 end
SkillWindow:Pick('armor_thick');SkillWindow:Pick('armor_thick');assert(calls==0)
SkillWindow:Pick('bone_armor');assert(SkillWindow.SelMain=='bone_armor')
-- No-current-effect guidance does not change point/refund/prerequisite policy.
book.Levels={bone_shard=1};bonus=0;choices={}
assert(book:UseHint('shard_multi')~='')
assert(book:UseHint('step_gale')~='' and book:UseHint('dash_ghost')~='')
book.Levels.bone_shard=5;book.Levels.wraith_dash=1;book.Levels.bone_armor=1
assert(book:UseHint('shard_multi')=='' and book:UseHint('step_gale')=='' and book:UseHint('dash_ghost')=='')
book.Levels={bone_shard=4,armor_thick=2};book.SkillDigest='bone_shard:4;armor_thick:2;';bonus=1
book.IsServer=function() return false end
assert(book:GetPowerLevel('bone_shard')==5 and book:GetPowerLevel('armor_thick')==2)
book.IsServer=function() return true end
-- All eight category-presence combinations, including missing first/middle category.
local oldMains,oldNodes,oldGet=_SkillData.Mains,_SkillData.NodesOf,_SkillData.Get
_SkillData.Mains=function() return {'new','rank'} end
_SkillData.NodesOf=function(_,id) return id=='rank' and {'node'} or {} end
local fake={GetSlotSkill=function() return '' end,GetLevel=function(_,id) return id=='new' and 0 or 1 end}
SkillOffer.Shuffle=0
for mask=0,7 do
 local bits={new=mask%2==1,rank=math.floor(mask/2)%2==1,node=math.floor(mask/4)%2==1}
 fake.CanLearn=function(_,id) return bits[id] and '' or 'locked' end
 local offer=SkillOffer:Pick(fake,stats);local expected={}
 for _,id in ipairs({'new','rank','node'}) do if bits[id] then table.insert(expected,id) end end
 assert(table.concat(offer,',')==table.concat(expected,','),'candidate category lost at mask '..mask)
end
print('[quality/skills] effective rank/gear/choice, dash charge, nodes, aura preview, summon totals, selected-node detail/no-spend, use hints and 8 offer combinations passed')
