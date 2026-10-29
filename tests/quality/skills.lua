-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName
-- @source SkillBook Skill/SkillBook.mlua RosterLine+,GetRankSummary+,PowerLevelAt+,GetPowerLevel+,GetManaCost+,SkillCooldown+,GetCommandAura+,UseHint+,RankCap,CanLearn+,StageRanks+,NextStage+,IsComplete+,RankStages+,GearRanks+,NextRankLevel+
-- @source UndeadSystem Undead/UndeadSystem.mlua MaxFor+,GetBaseStats,MakeRecord+,NodeForm+,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,FormName,RosterOf+
-- @source SkillWindow UI/Windows/SkillWindow.mlua StatLine,Pick,RenderWorkshop+,RenderTimeline+,SplitColumns,DisplayColumns+,SlotPathOf+,Flip+
-- @source UIKitReal UI/Core/UIKit.mlua PlainText,TextWidth
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
_UIKit.PlainText=function(_,t) return UIKitReal:PlainText(t) end
_UIKit.TextWidth=function(_,t,px) return UIKitReal:TextWidth(t,px) end
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
-- QR1629-OBS-01 (PC/iPad 골편 「마 / 나 8」): 비용 줄(마나·재사용/충전·추가 랭크)은 효과 줄과 따로 한 줄이고,
--   SkillWindow.WrapLines는 「 · 」·띄어쓰기 경계에서만 접는다 — 줄을 다시 이으면 원문 그대로 · 줄마다 효과 칸 폭(494−6) 안 (넉넉한 폭 어림 UIKit.TextWidth 17px)
stats.MaxDifficulty=0
UndeadSystem.IsServer=function() return false end   -- 편성 줄은 클라이언트 쪽(동기화된 빈 편성)으로 그린다
local function plain(s) return (string.gsub(s,'<[^<>]*>','')) end
local statW=494-6
local function lines(s) local t={} for l in string.gmatch(s..'\n','([^\n]*)\n') do table.insert(t,l) end return t end
local worst,worstId=0,''
for _,id in ipairs(_SkillData:Mains()) do
 local def=_SkillData:Get(id)
 for _,L in ipairs({1,20,50,99}) do
  stats.Level=L
  for _,lv in ipairs({0,1,4,10,19,20}) do
   if lv<=def.maxLv then
    book.Levels={[id]=lv}
    for _,b in ipairs({0,1,2}) do
     bonus=b
     local raw=SkillWindow:StatLine(book,stats,id)
     local wrapped=SkillWindow:WrapLines(raw,statW,nil)
     local back=string.gsub(string.gsub(wrapped,'\n  · ',' · '),'\n  ',' ')
     assert(back==raw,'wrap changed text '..id..'\n'..raw..'\n--\n'..wrapped)
     local ls=lines(wrapped)
     for _,l in ipairs(ls) do
      local w=_UIKit:TextWidth(l,17)
      assert(w<=statW or not string.find(plain(l),'%S %S'),'line wider than stat box '..id..' '..w..': '..l)
      if string.find(l,'마나 ',1,true) then
       assert(not string.find(l,'지금:',1,true) and not string.find(l,'다음 랭크',1,true) and not string.find(l,'배우면',1,true),'cost shares an effect line '..id..': '..l)
      end
     end
     for _,l in ipairs(lines(raw)) do
      if string.find(l,'마나 ',1,true) then assert(_UIKit:TextWidth(l,17)<=statW,'cost line must fit one line '..id..': '..l) end
     end
     if #ls>worst then worst,worstId=#ls,id..'@'..L..'/'..lv..'+'..b end
    end
   end
  end
 end
end
-- 캡처 장면: 골편 투척 랭크 4 · 장비 +1 · Lv20 → 비용 줄 하나에 「마나 · 재사용 · 추가 랭크 +1」
stats.Level=20;bonus=1;book.Levels={bone_shard=4}
local shard=lines(SkillWindow:WrapLines(SkillWindow:StatLine(book,stats,'bone_shard'),statW,nil))
local costLine=shard[#shard]
assert(string.find(costLine,'^마나 %d+ · 재사용 [%d.]+초 · 추가 랭크 %+1$'),'shard cost line: '..costLine)
book.Levels={wraith_dash=4};bonus=2
local dashL=lines(SkillWindow:WrapLines(SkillWindow:StatLine(book,stats,'wraith_dash'),statW,nil))
assert(string.find(dashL[#dashL],'^마나 %d+ · 충전 [%d.]+초 · 추가 랭크 %+2$'),'dash cost line: '..dashL[#dashL])
-- 조각 하나가 칸보다 길면 띄어쓰기 경계에서만 (단어 가운데 금지)
local long='다음 랭크: '..string.rep('뼛조각 ',40)..'끝'
local lw=SkillWindow:WrapLine(long,statW,nil)
assert(string.gsub(lw,'\n  ',' ')==long and not string.find(lw,'[^ ]\n[^ ]'),lw)
for _,l in ipairs(lines(lw)) do assert(_UIKit:TextWidth(l,17)<=statW,l) end
print('[quality/skills] OBS-01 stat wrap: '..'worst '..worst..' lines ('..worstId..'), cost line separate, breaks only at separators')
-- QR1629-OBS-02 (iPad 시간선): 모바일은 한 열 2칸까지 — 셋인 레벨(Lv18)은 같은 레벨의 이어진 열로. 해금 순서·칸 수 그대로
local logical=SkillWindow:BuildColumns()
local split=SkillWindow:SplitColumns(logical,SkillWindow.MobileRows)
local a,b2={},{}
for _,c in ipairs(logical) do for _,x in ipairs(c.ids) do table.insert(a,x) end end
for i,c in ipairs(split) do
 assert(#c.ids>=1 and #c.ids<=SkillWindow.MobileRows,'mobile column rows '..#c.ids)
 if i>1 then assert(c.row>=split[i-1].row,'unlock order') end
 assert((c.cont==true)==(i>1 and split[i-1].row==c.row),'cont flag')
 for _,x in ipairs(c.ids) do table.insert(b2,x) end
end
assert(table.concat(a,',')==table.concat(b2,','),'mobile split lost/reordered skills')
assert(#split==#logical+1,'only Lv18 (3 mains) should split: '..#split)
-- 모바일 시간선 실제 그리기: 쪽마다 칸 위치(1줄 −20 · 2줄 −20−112) · 3줄 없음 · 쪽을 다 넘기면 모든 메인이 한 번씩
Environment.IsMobilePlatform=function() return true end
SkillWindow.MobileColumns=nil;SkillWindow.Columns=nil
local pos,en={},{}
_UIKit.SetPos=function(_,p,v) pos[p]=v end
_UIKit.SetEnabled=function(_,p,on) en[p]=on end
_UIKit.SetBar=function() end
stats.Level=20;bonus=0;book.Levels={}
local seen,pages={},math.ceil(#SkillWindow:DisplayColumns()/SkillWindow:PageSize())
for page=1,pages do
 SkillWindow.Page=page;pos={};en={}
 SkillWindow:RenderTimeline(book,stats)
 for c=1,SkillWindow.MaxCols do
  local base='SkillWin/TL/C'..c
  if en[base] then
   assert(en[base..'/S3']==false,'mobile row 3 shown at '..base)
   for r=1,2 do if en[base..'/S'..r] then
    assert(pos[base..'/S'..r].y==-20-(r-1)*SkillWindow.MobileStepY,'row y')
    table.insert(seen,SkillWindow.SlotIds[c..':'..r])
   end end
  end
 end
 assert(pos['SkillWin/TL/Bar'].y==SkillWindow.MobileBarY,'mobile bar y')
end
assert(table.concat(seen,',')==table.concat(a,','),'paging lost skills: '..table.concat(seen,','))
assert(SkillWindow:SlotPathOf('frost_soul')~='','guide path for split column')
Environment.IsMobilePlatform=function() return false end
SkillWindow.MobileColumns=nil;SkillWindow.Page=1;pos={}
SkillWindow:RenderTimeline(book,stats)
assert(pos['SkillWin/TL/Bar'].y==-304 and pos['SkillWin/TL/C1/S2'].y==-88,'PC timeline unchanged')
print('[quality/skills] OBS-02 mobile timeline: '..#split..' columns, '..pages..' pages, rows 2 at step '..SkillWindow.MobileStepY..', bar '..SkillWindow.MobileBarY..', PC unchanged')
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
