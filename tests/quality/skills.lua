-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats,GetGiant
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName,GroupOf
-- @source SkillBook Skill/SkillBook.mlua MigrateLevels+,GetSaveData,LoadSaveData+,MageSchoolAt+,SkelGuardPct,GiantCount,GiantCapReached,GiantStanding,RosterLine+,GetRankSummary+,PowerLevelAt+,GetPowerLevel+,GetManaCost+,SkillCooldown+,GetCommandAura+,UseHint+,RankCap,CanLearn+,StageRanks+,NextStage+,IsComplete+,StageReachedAt+,RankStages+,GearRanks+,NextRankLevel+
-- @source UndeadSystem Undead/UndeadSystem.mlua MaxFor+,GetBaseStats,MakeRecord+,NodeForm+,ParseHope+,EncodeHope+,GiantFallback,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,FormName,RosterOf+,GiantPlanFor+,GiantCountsText,GiantCount+,GiantStandingAny+,GiantCapReached+,ShownForms+
-- @source MageBolts Undead/MageBolts.mlua Schools,PickSchool+,ElementOf,BodyTint
-- @source SkillWindow UI/Windows/SkillWindow.mlua StatLine,RosterText,WrapLines+,DropHintDup,Pick,VisibleNodes+,RenderBanner+,RenderWorkshop+,RenderForm+,RenderTimeline+,SplitColumns,DisplayColumns+,SlotPathOf+,Flip+
-- @source UIKitReal UI/Core/UIKit.mlua PlainText,TextWidth
-- @source SkillOffer UI/Windows/SkillOffer.mlua Pick+,Render+
-- @source HudMain UI/Hud/HudMain.mlua GiantCountsLine,GiantShort
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
 SetPos=function() end,SetSize=function() end,Get=function() return nil end}
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
local worstSM,worstSMId=0,''   -- S48-UI-DETAIL-PIPS-01 해골 전사·마법사 (관찰된 겹침 범위)
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
     if (id=='raise_skeleton' or id=='raise_mage') and #ls>worstSM then worstSM,worstSMId=#ls,id..'@'..L..'/'..lv..'+'..b end
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
-- S48-UI-DETAIL-PIPS-01: 편성 줄을 뺀 효과 칸은 크기 맞춤 하한 13px(줄 높이 1.48배)에서도 칸 94 + 큰 랭크 점까지 틈 3 안 — 점 줄을 덮지 않는다
assert(worstSM*13*1.48<=94+3,'stat box overflows onto rank pips: '..worstSM..' lines ('..worstSMId..')')
print('[quality/skills] OBS-01 stat wrap: '..'worst '..worst..' lines ('..worstId..') · skeleton/mage worst '..worstSM..' ('..worstSMId..', 13px '..string.format('%.1f',worstSM*13*1.48)..' ≤ 97), cost line separate, breaks only at separators')
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
 -- RB-OBS-04: 첫 열은 넘김 단추 칸(Prev x 24~68) 오른쪽에서 시작 — 열 왼쪽 MobileX0, 열 간격 130
 assert(pos['SkillWin/TL/C1'].x==SkillWindow.MobileX0 and pos['SkillWin/TL/Bar'].x==SkillWindow.MobileX0,'mobile first column x '..tostring(pos['SkillWin/TL/C1'].x))
 if en['SkillWin/TL/C2'] then assert(pos['SkillWin/TL/C2'].x-pos['SkillWin/TL/C1'].x==130,'mobile column step') end
end
assert(table.concat(seen,',')==table.concat(a,','),'paging lost skills: '..table.concat(seen,','))
assert(SkillWindow:SlotPathOf('frost_soul')~='','guide path for split column')
Environment.IsMobilePlatform=function() return false end
SkillWindow.MobileColumns=nil;SkillWindow.Page=1;pos={}
SkillWindow:RenderTimeline(book,stats)
assert(pos['SkillWin/TL/Bar'].y==-304 and pos['SkillWin/TL/C1/S2'].y==-88 and pos['SkillWin/TL/C1'].x==44 and pos['SkillWin/TL/Bar'].x==44,'PC timeline unchanged')
print('[quality/skills] OBS-02 mobile timeline: '..#split..' columns, '..pages..' pages, rows 2 at step '..SkillWindow.MobileStepY..', bar '..SkillWindow.MobileBarY..', first column x '..SkillWindow.MobileX0..' (RB-OBS-04), PC unchanged')
-- INT1725-OBS-01 (PC Lv40 혼의 제물 셋째 카드): 강화 카드 초록 줄(Card{i}/Change 222×72 · BestFit 12~16)에 편성 경고를 뜻·숫자 그대로 자기 줄로.
--   줄은 「 · 」·「 (」·띄어쓰기 경계에서만 나뉘고(띄어쓰기·「·」를 빼고 다시 이으면 원문 글자 그대로) 줄마다 폭 222 안 — 폭은 넉넉한 어림 UIKit.TextWidth 16px(칸 최대 글꼴)
--   캡처 장면 4개(대검 0기 · 방패 세기만 · 자리 없어짐 · 거인 중 0기)는 3줄 = 16px 그대로 · 모든 변이 노드 × 랭크 × 경고 꼴(두 자리 정원)의 최악도 4줄 = 12px 이상으로 칸 안
local cardSrc=io.open('tools/build/ui.cjs'):read('a')
local chH=tonumber(string.match(cardSrc,'/Change`, "", {[^\n]-rect_size: %[CARD%.text, (%d+)%]'))
local chMax=tonumber(string.match(cardSrc,'/Change`, "", {[^\n]-max_size: (%d+)'))
local chMin=tonumber(string.match(cardSrc,'/Change`, "", {[^\n]-min_size: (%d+)'))
local cardW=tonumber(string.match(cardSrc,'const CARD = {[^\n]-text: (%d+)'))
assert(chH==72 and chMax==SkillOffer.ChangeFont and cardW==SkillOffer.ChangeW and chMin==12,'card Change box '..tostring(chH)..' '..tostring(chMax)..' '..tostring(cardW))
local lineH=function(px) return 1.48*px end   -- 메이커 로그 prefH: 16px 한 줄 23.7 · 17px 25.2
assert(SkillOffer.ChangeLines*lineH(chMax)<=chH and SkillOffer.ChangeMaxLines*lineH(chMin)<=chH,'Change box cannot hold its line budget')
local function strip(s) return (string.gsub(string.gsub(string.gsub(s,'<[^<>]*>',''),'·',''),'[\n ]','')) end
local oldColored=_UIKit.Colored
_UIKit.Colored=function(_,hex,text) return '<color='..hex..'>'..text..'</color>' end
local cmdRoster={UndeadRoster='|0'}
local oldGet=entity.GetComponent
entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return cmdRoster end return oldGet(self,key) end
stats.Level=40;bonus=0;choices={}
local function cardChange(levels,roster,id)
 book.Levels=levels;cmdRoster.UndeadRoster=roster;values={}
 SkillOffer.Offer={id}
 SkillOffer:Render(book,stats)
 return values['OfferWin/Card1/Change'] or ''
end
local function wrapOk(orig,wrapped)
 -- 줄바꿈은 경계에서만: 줄을 차례로 원문에서 찾아 이어 붙이고, 줄 사이에서 빠진 것은 「 · 」 또는 띄어쓰기 하나뿐 (「 (」은 괄호가 다음 줄 머리로)
 local pos=1
 for i,l in ipairs(lines(wrapped)) do
  assert(string.sub(orig,pos,pos+#l-1)==l,'wrap changed text at line '..i..': '..l..'\n'..orig)
  pos=pos+#l
  if pos<=#orig then
   if string.sub(orig,pos,pos+#' · '-1)==' · ' then pos=pos+#' · ' else assert(string.sub(orig,pos,pos)==' ','break inside a word: '..l..' | '..orig) pos=pos+1 end
  end
 end
 assert(pos==#orig+1,'wrap dropped tail: '..orig)
end
local function checkCard(name,text,hint,maxLines)
 local ls=lines(text)
 assert(#ls<=maxLines,name..': '..#ls..' lines > '..maxLines..'\n'..text)
 local warn={}
 for _,l in ipairs(ls) do
  local w=_UIKit:TextWidth(plain(l),SkillOffer.ChangeFont)
  assert(w<=SkillOffer.ChangeW or not string.find(plain(l),'%S %S'),name..': line '..w..' > '..SkillOffer.ChangeW..': '..l)
  if string.find(l,'<color='..SkillOffer.WarnHex..'>',1,true) then table.insert(warn,plain(l)) end
 end
 if hint~='' then
  -- 경고는 뜻·숫자 그대로 자기 줄(경고 색)에만 · 요약 줄과 섞이지 않는다
  wrapOk(hint,table.concat(warn,'\n'))
  assert(warn[1]==plain(ls[#ls-#warn+1]),name..': warning lines not at the end\n'..text)
 else assert(#warn==0,name..': warning colour without hint') end
 return ls
end
local scenes={
 {'쌍칼 0기 (I03-3 · 48)',{raise_skeleton=2,skel_greatsword=3,skel_twin=1},'s:greatsword,s:greatsword|0','skel_twin','정원 2기로는 0기 · 정원 +1(뼈 군단)부터 섭니다','쌍칼 해골 2기',SkillOffer.ChangeMaxLines},
 {'대검 세기만 (I03-5 · 48)',{raise_skeleton=2,skel_greatsword=2},'s:greatsword,s:greatsword|0','skel_greatsword','다음 랭크는 세기만 오릅니다 (정원이 차 2기 그대로)','대검 해골 3기',SkillOffer.ChangeMaxLines},
 {'자리 없어짐 (I03-4 · 48)',{raise_skeleton=2,skel_twin=1,skel_greatsword=2},'s:greatsword,s:greatsword|0','skel_greatsword','찍으면 쌍칼 해골 자리가 없어집니다 · 정원 2기','대검 해골 3기',SkillOffer.ChangeMaxLines},
 {'거인 중 0기 (I03-6 · 48)',{bone_rite=1,raise_skeleton=7,skel_greatsword=2,skel_twin=1},'s:!,s:greatsword|4','skel_twin','뼈 거인이 서 있는 동안 0기 · 거인이 갈라진 뒤 섭니다','쌍칼 해골 2기'},}
local sceneLog={}
for _,sc in ipairs(scenes) do
 local text=cardChange(sc[2],sc[3],sc[4])
 assert(book:UseHint(sc[4])==sc[5],sc[1]..' hint '..book:UseHint(sc[4]))
 local ls=checkCard(sc[1],text,sc[5],sc[7] or SkillOffer.ChangeLines)
 assert(string.find(ls[1],sc[6],1,true)==1,sc[1]..': first line '..ls[1])
 table.insert(sceneLog,sc[1]..' '..#ls..'줄')
end
-- CARD-E1E-R01 (대검 0기 장면): 경고 때 요약을 줄여도 카드 설명(Effect)에 값이 없는 「반경 ×1.8」은 초록 줄에 남는다 — Effect+Change를 합쳐 다음 랭크 수치와 경고 원문이 모두 읽힌다.
--   설명에 값이 있는 「피해 ×0.95」(설명 「×0.8/0.95/1.1」)만 빠질 수 있다
do
 -- 48-0: 방패 변이가 없어져(대검이 첫 순서) 대검 0기 경고는 실제 편성으로 만들 수 없다 → 같은 경고 글을 UseHint로 넣어 카드 그리기(R01)만 본다
 local keepHint=book.UseHint
 book.UseHint=function(b,id) if id=='skel_greatsword' then return '정원 2기로는 0기 · 정원 +1(뼈 군단)부터 섭니다' end return keepHint(b,id) end
 local gsText=cardChange({raise_skeleton=2,skel_greatsword=1},'s:greatsword,s:greatsword|0','skel_greatsword')
 book.UseHint=keepHint
 local eff=values['OfferWin/Card1/Effect'] or ''
 local both=plain(eff)..'\n'..plain(gsText)
 assert(not string.find(eff,'반경',1,true),'Effect now carries radius — R01 check is moot: '..eff)
 assert(string.find(strip(plain(gsText)),strip('반경 ×1.8'),1,true),'R01: radius dropped from card\n'..gsText)
 assert(string.find(strip(both),strip('정원 2기로는 0기 · 정원 +1(뼈 군단)부터 섭니다'),1,true),'R01: warning not intact\n'..gsText)
 assert(string.find(eff,'0.95',1,true),'R01: damage value missing from Effect '..eff)
 for _,frag in ipairs(_SkillWindow:SplitPlain(book:GetRankSummary('skel_greatsword',2),' · ')) do
  local nums={} for n in string.gmatch(frag,'%d+%.?%d*') do table.insert(nums,n) end
  for _,n in ipairs(nums) do assert(string.find(both,n,1,true),'R01: value '..n..' of 「'..frag..'」 missing on card\n'..both) end
 end
 table.insert(sceneLog,'R01 대검 반경 유지 '..#lines(gsText)..'줄')
end
-- 경고가 없을 때: 설명(Effect)에 이미 그대로 적힌 고정 수치만 빠지고 랭크마다 바뀌는 수치·설명에 없는 수치(대검 반경)는 남는다
local gs=cardChange({raise_skeleton=5,skel_greatsword=1},'|0','skel_greatsword')
assert(book:UseHint('skel_greatsword')=='' and strip(gs)==strip('대검 해골 2기 · 범위 베기 피해 ×0.95 · 반경 ×1.8'),gs)
assert(not string.find(gs,'공격 간격',1,true) and string.find(values['OfferWin/Card1/Effect'],'공격 간격 ×1.4',1,true),gs)
-- 새 스킬·랭크 업 카드는 요약 글자 그대로 (줄만 경계에서)
local rs=cardChange({raise_skeleton=2},'|0','raise_skeleton')
assert(strip(rs)==strip(book:GetRankSummary('raise_skeleton',book:PowerLevelAt('raise_skeleton',3))),rs)
checkCard('raise_skeleton rank-up',rs,'',SkillOffer.ChangeLines)
wrapOk(book:GetRankSummary('raise_skeleton',book:PowerLevelAt('raise_skeleton',3)),plain(rs))
-- 모든 변이 노드 × 배울 랭크 × 경고 꼴 (정원·필요 수 두 자리 · 가장 긴 변이 이름) — 4줄 이하 = 칸 72에 12px 이상, 경고 전부
local worstN,worstCase=0,''
local valueKept,valueFallback=0,0
for _,kind in ipairs({'skeleton','mage'}) do
 local legion=kind=='mage' and '마법사 증원' or '뼈 군단'
 local others=kind=='mage' and {'광기 마법사','저주 마법사','쌍발 마법사','관통 마법사','폭발 마법사'} or {'방패 해골','대검 해골','쌍칼 해골'}
 local hints={}
 for _,N in ipairs({2,12}) do
  for _,k in ipairs({1,12}) do
   table.insert(hints,string.format('배워도 정원 %d기로는 0기 · 정원 +%d(%s)부터 섭니다',N,k,legion))
   table.insert(hints,string.format('정원 %d기로는 0기 · 정원 +%d(%s)부터 섭니다',N,k,legion))
  end
  for _,o in ipairs(others) do table.insert(hints,string.format('찍으면 %s 자리가 없어집니다 · 정원 %d기',o,N)) end
  table.insert(hints,string.format('다음 랭크는 세기만 오릅니다 (정원이 차 %d기 그대로)',N))
 end
 if kind=='skeleton' then table.insert(hints,'뼈 거인이 서 있는 동안 0기 · 거인이 갈라진 뒤 섭니다') end
 for _,form in ipairs(_UndeadSystem:FormOrder(kind)) do
  local id=(kind=='mage' and 'mage_' or 'skel_')..form
  local def=_SkillData:Get(id)
  -- 48-0: 변이 노드가 없는 변이(지운 skel_shield · mage_*)는 건너뛴다 — 갈래 A가 FormOrder를 줄이기 전에도 같은 검사
  for lv=0,(def and def.maxLv or 0)-1 do
   for _,hint in ipairs(hints) do
    local summ,eff=book:GetRankSummary(id,lv+1),SkillOffer:CardText(def)
    local t=SkillOffer:NodeChange(summ,hint,eff,nil)
    local ls=checkCard(id..' '..lv,t,hint,SkillOffer.ChangeMaxLines)
    -- CARD-E1E-R01: 설명(Effect)에 값이 없는 요약 토막은 줄여도 남는다 (4줄을 넘어 첫 토막만 남기는 경우는 세어서 0건이어야)
    local compact=SkillOffer:DropValueShown(SkillOffer:DropShown(summ,eff),eff)
    if string.find(strip(t),strip(compact),1,true) then valueKept=valueKept+1
    else
     -- 첫 토막만 남는 경우: 넉넉한 어림 폭(UIKit.TextWidth)으로 줄인 요약+경고가 4줄을 넘을 때뿐 · 경고 수가 두 자리(합성 「정원 +12」)일 때만 허용
     assert(#lines(SkillOffer:CardWrap(compact,SkillOffer.ChangeW,nil))+#lines(SkillOffer:CardWrap(hint,SkillOffer.ChangeW,nil))>SkillOffer.ChangeMaxLines,id..' '..lv..': value dropped though it fits')
     assert(string.find(hint,'%d%d'),'CARD-E1E-R01: value not in Effect dropped with a one-digit warning: '..id..' '..lv..' '..hint..'\n'..t)
     valueFallback=valueFallback+1
    end
    if #ls>worstN then worstN,worstCase=#ls,id..' '..lv..'→'..(lv+1)..' '..hint end
   end
  end
 end
end
-- 카드 줄바꿈: 칸 폭 안 · 경계에서만 (긴 조각은 띄어쓰기에서) · 글자 그대로
local longOrig='다음 랭크는 '..string.rep('뼛조각 ',30)..'끝 · 짧은 끝 (괄호는 다음 줄로 가는 꽤 긴 꼬리 글입니다)'
local longCard=SkillOffer:CardWrap(longOrig,SkillOffer.ChangeW,nil)
wrapOk(longOrig,longCard)
for _,l in ipairs(lines(longCard)) do assert(_UIKit:TextWidth(l,SkillOffer.ChangeFont)<=SkillOffer.ChangeW,l) end
entity.GetComponent=oldGet;_UIKit.Colored=oldColored
print(string.format('[quality/skills] INT1725-OBS-01 offer card Change %dx%d (16px %d줄 · 12px %d줄): %s · all form nodes worst %d lines (%s) · R01 values kept %d/%d (첫 토막만: 두 자리 합성 경고 %d)',SkillOffer.ChangeW,chH,SkillOffer.ChangeLines,SkillOffer.ChangeMaxLines,table.concat(sceneLog,', '),worstN,worstCase,valueKept,valueKept+valueFallback,valueFallback))
-- 글귀 53·54 (10-29 저녁 코덱스 위임 승인 · approval-copy-review-2103): 잔걸음·뼈 껍질은 선행 스킬이 없을 때
--   UseHint 조건 줄이 같은 화면에 보이는 표시 경로(스킬 창 공방 StatLine/RenderWorkshop · 제물 강화 카드 NodeChange)에서만 요약 끝 「(…를 배우면)」을 뺀다.
--   공용 요약 GetRankSummary는 그대로 — RequestLearn→NotifyLearned 학습 알림(UseHint 줄 없음)은 이 괄호로 선행 조건을 알린다
do
 stats.Level=99;bonus=0;choices={}
 local bookSrc=io.open('RootDesk/MyDesk/Skill/SkillBook.mlua'):read('a')
 assert(string.find(bookSrc,'self:NotifyLearned(id, self:GetLevel(id), self:GetRankSummary(id, self:GetLevel(id)), slot, pc.UserId)',1,true),'53/54: learn notice must keep the raw shared summary (condition tail)')
 local dupLog={}
 for _,c in ipairs({{'step_gale','wraith_dash','(망령 질주를 배우면)','망령 질주를 배워야 발동합니다','질주 뒤 '},{'dash_ghost','bone_armor','(뼈 갑옷을 배우면)','뼈 갑옷을 배워야 회복합니다','질주 끝에 뼈 갑옷'}}) do
  local id,pre,tail,hintText,main=c[1],c[2],c[3],c[4],c[5]
  local parent=_SkillData:Get(id).parent
  for _,lv in ipairs({0,1}) do
   -- UseHint 있음(선행 스킬 없음): 공용 요약·학습 알림 쪽은 괄호 유지, 표시 경로는 괄호 없음 + 조건 줄은 그대로
   book.Levels={[parent]=1,[id]=lv}
   assert(book:UseHint(id)==hintText,id..' hint '..book:UseHint(id))
   local shared=book:GetRankSummary(id,math.max(1,lv))
   assert(string.sub(shared,-#(' '..tail))==' '..tail,'53/54: shared summary lost its condition tail '..shared)
   if lv>0 then assert(string.find(book:GetRankSummary(id,book:GetLevel(id)),tail,1,true),'53/54: learn notice summary lost tail') end
   local sl=SkillWindow:StatLine(book,stats,id)
   assert(not string.find(sl,'배우면)',1,true) and string.find(sl,main,1,true),'53/54: stat line still duplicates hint\n'..sl)
   assert(string.find(sl,(lv==0 and '배우면: ' or '지금: ')..string.sub(shared,1,#shared-#(' '..tail)),1,true),'53/54: main effect changed\n'..sl)
   SkillWindow.SelMain=parent;SkillWindow.Selected=id;values={}
   SkillWindow:RenderWorkshop(book,stats)
   assert(string.find(values['SkillWin/WS/Desc'],hintText,1,true),'53/54: workshop lost the UseHint line')
   assert(not string.find(values['SkillWin/WS/Stat'],tail,1,true) and string.find(values['SkillWin/WS/Stat'],main,1,true),'53/54: workshop stat\n'..values['SkillWin/WS/Stat'])
   local card=plain(cardChange({[parent]=1,[id]=lv},'|0',id))
   assert(not string.find(strip(card),strip(tail),1,true) and string.find(strip(card),strip(main),1,true) and string.find(strip(card),strip(hintText),1,true),'53/54: offer card\n'..card)
   -- UseHint 없음(선행 스킬 배움): 요약에 괄호가 없고 표시 경로도 요약 글자 그대로
   book.Levels={[parent]=1,[id]=lv,[pre]=1}
   assert(book:UseHint(id)=='' and not string.find(book:GetRankSummary(id,math.max(1,lv)),'배우면',1,true))
   assert(string.find(SkillWindow:StatLine(book,stats,id),book:GetRankSummary(id,math.max(1,lv)),1,true),'53/54: no-hint stat line changed')
   if lv==0 then table.insert(dupLog,id..' 「'..string.sub(shared,1,#shared-#(' '..tail))..'」') end
  end
  -- 표시 경로라도 조건 줄이 없으면(hint="") 괄호 유지 · 다른 노드는 손대지 않음
  local raw=book:GetRankSummary(id,1)..' '..tail
  assert(SkillWindow:DropHintDup(id,raw,'')==raw)
  assert(SkillWindow:DropHintDup('shard_multi','골편 모임 '..tail,'x')=='골편 모임 '..tail)
 end
 print('[quality/skills] copy 53/54 hint dup: display paths drop tail only beside UseHint ('..table.concat(dupLog,' · ')..'), shared summary/learn notice keep it')
end
-- INT1725-OBS-02 (I03-6 거인 유지 중 편성 줄): 거인 몸(s:!)은 「일반」이 아니라 「거인 본체」, 합쳐진 넷은 「거인에 4」, 분모 섞인 「6/5」 대신 「정원 5기」.
--   정원 계산·진단 수는 그대로 (have 6 = 예약 4 + 기록 2 · counts는 거인 몸을 센다) — 표시만 나눈다
entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return cmdRoster end return oldGet(self,key) end
-- 48-0: 방패 변이 노드가 없어져 대검 · 쌍칼로 같은 장면 (랭크 7 + 뼈 군단 1 = 정원 5 · 진화 랭크 8 전이라 갈래 A 전후가 같다)
book.Levels={bone_rite=1,raise_skeleton=7,skel_legion=1,skel_greatsword=2,skel_twin=1};stats.Level=40;bonus=0
cmdRoster.UndeadRoster='s:!,s:greatsword|4'
local gline=book:RosterLine('raise_skeleton')
assert(gline=='편성: 대검 1·거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 대검 해골(가장 오래된 대검 해골 교체)',gline)
local gp=_UndeadSystem:RosterPreview(entity,'skeleton')
assert(gp.have==6 and gp.max==5 and gp.reserved==4 and gp.counts['']==1 and gp.counts.greatsword==1 and gp.bodies==1 and (gp.units[''] or 0)==0 and gp.units.greatsword==1,'raw have/counts or display split')
cmdRoster.UndeadRoster='s:!|4'
assert(book:RosterLine('skel_twin')=='편성: 거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 대검 해골',book:RosterLine('skel_twin'))
cmdRoster.UndeadRoster='s:greatsword,s:greatsword,s:twin,s:,s:|0'   -- 거인이 갈라진 뒤: 예전 꼴 그대로
assert(book:RosterLine('skel_twin')=='편성 5/5: 일반 2·대검 2·쌍칼 1 · 다음 소환: 해골 전사(가장 오래된 대검 해골 교체)',book:RosterLine('skel_twin'))
entity.GetComponent=oldGet
print('[quality/skills] INT1725-OBS-02 giant roster line: '..gline)
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
-- I03 단계 2 · I04 편성 조작 칸 (SkillWindow.RenderForm, 10-30 갈래 B): 해골 전사·마법사 트리에서만 · 직접/자동 머리 글 · ± 는 변이 노드만 · 골편 홀드 설정은 모바일만
do
 local en={}
 local keepEn=_UIKit.SetEnabled
 local keepMobile=Environment.IsMobilePlatform
 _UIKit.SetEnabled=function(_,path,on) en[path]=on end
 Environment.IsMobilePlatform=function() return false end
 book.Levels={raise_skeleton=6,skel_greatsword=3,skel_twin=2,bone_shard=1,bone_armor=1}   -- 48-0: 방패 변이 노드 → 대검
 stats.Level=99
 book.FormHope='s:d:greatsword=1,twin=0'
 SkillWindow.SelMain='raise_skeleton'
 SkillWindow.Selected='skel_greatsword'
 values={}
 SkillWindow:RenderWorkshop(book,stats)
 local head=values['SkillWin/WS/Form/Head']
 assert(en['SkillWin/WS/Form']==true and head=='대검 희망 1/3' and values['SkillWin/WS/Form/Mode']=='자동으로 되돌리기' and en['SkillWin/WS/Form/Plus']==true and en['SkillWin/WS/Form/Minus']==true,'form node '..tostring(head))
 assert(SkillWindow.FormKind=='skeleton' and SkillWindow.FormForm=='greatsword')
 -- S48-UI-DETAIL-PIPS-01: 편성 줄은 효과 칸이 아니라 WS/Roster (랭크 점 줄과 떨어진 칸)
 assert(string.find(values['SkillWin/WS/Roster'],'직접 편성',1,true) and not string.find(values['SkillWin/WS/Stat'],'편성',1,true),values['SkillWin/WS/Roster'])
 SkillWindow.Selected='raise_skeleton'
 values={}
 SkillWindow:RenderWorkshop(book,stats)
 assert(values['SkillWin/WS/Form/Head']=='편성: 직접' and en['SkillWin/WS/Form/Plus']==false and SkillWindow.FormForm=='','main node')
 book.FormHope=''
 SkillWindow.Selected='skel_twin'
 values={}
 SkillWindow:RenderWorkshop(book,stats)
 assert(string.find(values['SkillWin/WS/Form/Head'],'쌍칼 자동 ',1,true) and values['SkillWin/WS/Form/Mode']=='직접 정하기','auto '..tostring(values['SkillWin/WS/Form/Head']))
 SkillWindow.SelMain='bone_shard'
 SkillWindow.Selected='bone_shard'
 values={}
 SkillWindow:RenderWorkshop(book,stats)
 assert(en['SkillWin/WS/Form']==false and SkillWindow.FormKind=='','PC: no shard hold control')
 Environment.IsMobilePlatform=function() return true end
 book.ShardHold=false
 SkillWindow:RenderWorkshop(book,stats)
 assert(en['SkillWin/WS/Form']==true and values['SkillWin/WS/Form/Head']=='누르고 있으면 반복: 끔' and values['SkillWin/WS/Form/Mode']=='켜기' and en['SkillWin/WS/Form/Minus']==false,'mobile shard toggle')
 book.ShardHold=true
 SkillWindow:RenderWorkshop(book,stats)
 assert(values['SkillWin/WS/Form/Mode']=='끄기')
 SkillWindow.SelMain='bone_armor'
 SkillWindow.Selected='bone_armor'
 SkillWindow:RenderWorkshop(book,stats)
 assert(en['SkillWin/WS/Form']==false,'other trees hide')
 book.ShardHold=false
 _UIKit.SetEnabled=keepEn
 Environment.IsMobilePlatform=keepMobile
 print('[quality/skills] I03 step2/I04 form control: direct node head 대검 희망 1/3, main 편성: 직접, auto head, shard toggle mobile-only, other trees hidden')
end
-- 46-5 거인 강화: 악몽 잠김 · 택일(둘 중 하나 · 다시 고르기 불가) · 보류(방패 갈림 쌍) · 열림 레벨(10→42 · 14→50 · 17→56 · 20→62) · 공방 두 묶음
do
 local keepLv,keepPts=stats.Level,stats.SkillPoints
 local fakeNodes,fakeMains,fakeGet=_SkillData.NodesOf,_SkillData.Mains,_SkillData.Get
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=oldNodes,oldMains,oldGet   -- 위 8조합 검사가 바꿔 둔 가짜 표를 실제 표로
 stats.Level=99;stats.SkillPoints=20
 book.Levels={bone_rite=20}
 stats.MaxDifficulty=0
 -- 48-0: 기본 거인 노드 3줄(giant_quake · giant_basic_split · giant_basic_return)이 없어져 같은 필요 랭크의 방패 · 대검 노드로 본다
 assert(book:CanLearn('giant_shield_wall',99,20)=='악몽부터','nightmare lock: '..book:CanLearn('giant_shield_wall',99,20))
 assert(book:CanLearn('bomb_wide',99,20)=='','bomb nodes stay open in normal')
 stats.MaxDifficulty=1
 assert(book:CanLearn('giant_shield_wall',99,20)=='','open after nightmare: '..book:CanLearn('giant_shield_wall',99,20))
 assert(book:NodeLevel('giant_shield_wall',1)==42 and book:NodeLevel('giant_shield_wall',2)==46 and book:NodeLevel('giant_shield_wall',3)==50,'wall levels')
 assert(book:NodeLevel('giant_gs_scar',1)==56 and book:NodeLevel('giant_twin_echo',1)==56 and book:NodeLevel('giant_mage_pull',1)==62,'choice levels')
 assert(book:CanLearn('giant_shield_wall',41,20)=='캐릭터 Lv42에 다음 랭크','Lv42 gate')
 book.Levels={bone_rite=16}
 assert(string.find(book:CanLearn('giant_gs_scar',99,20),'17랭크부터',1,true),'need 17')
 book.Levels={bone_rite=20,giant_gs_scar=1}
 local r=book:CanLearn('giant_gs_twice',99,20)
 assert(r=='이미 「갈라진 땅」을(를) 골랐습니다',r)
 assert(book:CanLearn('giant_twin_echo',99,20)=='','other group independent')
 book.Levels={bone_rite=20}
 assert(book:CanLearn('giant_shield_alt',99,20)~='' and book:CanLearn('giant_shield_phalanx',99,20)~='','shield pair on hold')
 assert(book:CanLearn('giant_shield_wall',99,20)=='','shield normal node open')
 -- 공방: 뼈 의식 = 폭탄 3 + 펼친 거인 노드만 · 보류 줄 없음 · 칸(8)·열(6) 안
 book.RiteBanner=''
 SkillWindow.ShowGiant='shield';SkillWindow.Selected=''
 local vis=SkillWindow:VisibleNodes(book,'bone_rite')
 assert(table.concat(vis,',')=='bomb_wide,bomb_marrow,bomb_pair,giant_shield_wall','shield view '..table.concat(vis,','))
 SkillWindow.ShowGiant='twin'
 vis=SkillWindow:VisibleNodes(book,'bone_rite')
 assert(#vis==6 and vis[4]=='giant_twin_flurry' and vis[6]=='giant_twin_echo','twin view '..table.concat(vis,','))
 local cols={}
 for _,nid in ipairs(vis) do cols[book:NodeNeed(nid,1)]=true end
 local nc=0 for _ in pairs(cols) do nc=nc+1 end
 assert(nc<=6 and #vis<=8,'fits builder slots')
 SkillWindow.ShowGiant=''
 assert(#SkillWindow:VisibleNodes(book,'raise_skeleton')==#_SkillData:NodesOf('raise_skeleton'),'other mains unchanged')
 -- 요약 줄 (지금 / 다음)
 assert(book:GetRankSummary('giant_shield_wall',3)=='도발 3.9칸 · 받는 피해 -39%','summary '..book:GetRankSummary('giant_shield_wall',3))
 -- 48 (리뷰 정정): 큰 메테오 반경은 실제 타격과 같은 상한 2.0칸 — 현재/다음 줄도 상한 반영 · 영창 감소는 그대로
 assert(book:GetRankSummary('giant_mage_meteor',1)=='메테오 반경 1.95칸 · 영창 0.9초',book:GetRankSummary('giant_mage_meteor',1))
 assert(book:GetRankSummary('giant_mage_meteor',2)=='메테오 반경 2.00칸(최대) · 영창 0.8초',book:GetRankSummary('giant_mage_meteor',2))
 assert(book:GetRankSummary('giant_mage_meteor',3)=='메테오 반경 2.00칸(최대) · 영창 0.7초',book:GetRankSummary('giant_mage_meteor',3))
 assert(book:GetRankSummary('giant_mage_resist',1)=='노바·메테오에 맞은 적 화염 저항 -15 · 4초' and book:GetRankSummary('giant_mage_pull',1)=='노바 폭발 피해 ×1.5 · 반경 3.75칸','mage choice summary '..book:GetRankSummary('giant_mage_pull',1))
 -- 48 V2 「폭발 증폭」(giant_mage_pull 옛 id): 이름·설명·현재/다음 = 실제 단발 ×1.5 · 반경 3.75 (두 겹·흡인 글귀 없음)
 do local d=_SkillData:Get('giant_mage_pull') assert(d.name=='폭발 증폭' and not string.find(d.desc,'두 겹',1,true) and not string.find(d.desc,'흡인',1,true) and string.find(d.desc,'×1.5',1,true),'pull copy '..d.name..' / '..d.desc)
  assert(not string.find(_SkillData:Get('giant_mage_resist').desc,'두 겹',1,true),'resist cross-ref')
  assert(_GameData:GetGiant('mage').s1Radius==3.75 and _GameData:GetGiant('mage').s1Opts.novaAmpMul==1.5 and _GameData:GetGiant('mage').s1Opts.ring==nil,'nova data') end
 -- 48-0: 기본 거인은 노드가 없다 — 펼치면 폭탄 3칸만
 SkillWindow.ShowGiant='basic'
 assert(table.concat(SkillWindow:VisibleNodes(book,'bone_rite'),',')=='bomb_wide,bomb_marrow,bomb_pair','basic view '..table.concat(SkillWindow:VisibleNodes(book,'bone_rite'),','))
 SkillWindow.ShowGiant=''
 stats.Level,stats.SkillPoints=keepLv,keepPts
 stats.MaxDifficulty=nil
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=fakeNodes,fakeMains,fakeGet
 print('[quality/skills] 46-5 giant nodes: nightmare lock, Lv42/50/56/62, choice pair exclusive, shield pair on hold, workshop = bombs + one giant row')
end
-- 46-6 HUD 글: 고리 둘째 줄 · 공방 「지금 무리라면」 · 깃발 줄 (동기화된 편성 = 클라이언트 GiantPlan)
do
 local keepGet=entity.GetComponent
 local roster={UndeadRoster='s:greatsword,s:greatsword,m:,m:hex,s:,s:twin|0',GiantKind=''}
 entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return roster end return keepGet(self,key) end
 local fakeNodes,fakeMains,fakeGet=_SkillData.NodesOf,_SkillData.Mains,_SkillData.Get
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=oldNodes,oldMains,oldGet
 _HudMain=HudMain
 book.Levels={bone_rite=5};stats.MaxDifficulty=1
 book.RiteBanner=''
 local plan=_UndeadSystem:GiantPlanFor(entity)
 assert(plan.type=='greatsword' and plan.tie and not plan.bannerUsed,'fallback greatsword over mage')
 assert(HudMain:GiantCountsLine(plan)=='대검 2 · 마법사 2 · 기본 1 (동률)',HudMain:GiantCountsLine(plan))
 book.RiteBanner='mage'
 plan=_UndeadSystem:GiantPlanFor(entity)
 assert(plan.type=='mage' and HudMain:GiantCountsLine(plan)=='대검 2 · 마법사 2 · 기본 1 (동률 · 깃발)',HudMain:GiantCountsLine(plan))
 local sum=book:GetRankSummary('bone_rite',5)
 assert(string.find(sum,'거인 20초 · 지금 무리라면 마법사 거인',1,true),sum)
 roster.UndeadRoster='s:greatsword,s:greatsword,m:|0'
 assert(not string.find(book:GetRankSummary('bone_rite',5),'지금 무리라면',1,true),'fewer than 5 → no giant line')
 stats.MaxDifficulty=0
 assert(string.find(book:GetRankSummary('bone_rite',5),'거인 악몽부터',1,true),'normal lock text')
 -- 깃발 줄: 뼈 의식에서만 · 칸 순서 = fallback · 노말 머리 글
 values={}
 SkillWindow.SelMain='bone_rite';SkillWindow.Selected='bone_rite';SkillWindow.ShowGiant=''
 SkillWindow:RenderBanner(book,stats)
 assert(values['SkillWin/WS/Banner/Head']=='거인 악몽부터 · 동률이면' and values['SkillWin/WS/Banner/K1/Label']=='방패' and values['SkillWin/WS/Banner/K4/Label']=='마법사' and values['SkillWin/WS/Banner/K6/Label']=='안 고름','banner '..tostring(values['SkillWin/WS/Banner/Head']))
 stats.MaxDifficulty=1
 values={}
 SkillWindow:RenderBanner(book,stats)
 assert(values['SkillWin/WS/Banner/Head']=='동률이면','banner head unlocked')
 book.RiteBanner=''
 stats.MaxDifficulty=nil
 entity.GetComponent=keepGet
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=fakeNodes,fakeMains,fakeGet
 print('[quality/skills] 46-6 HUD text: ring sub line (tie · banner), workshop 「지금 무리라면」 (client plan), banner row order + normal head')
end
-- 48 소환물 정리 (갈래 C · 48-0 / 48-3 / UI): 노드 21개 · 환급 한 번만 · 조용히 · 희망 편성 칸 호환 · 상세 글귀(현재/다음 · 메테오 상한) · 거인 수 어댑터
do
 local fNodes,fMains,fGet=_SkillData.NodesOf,_SkillData.Mains,_SkillData.Get
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=oldNodes,oldMains,oldGet
 local keepLv,keepPts,keepDiff=stats.Level,stats.SkillPoints,stats.MaxDifficulty
 stats.Level=99;stats.MaxDifficulty=1;bonus=0;choices={}
 -- 48-0 노드 수: 해골 전사 6 · 해골 마법사 3 · 거인 12 = 21 (지운 9 · 더한 저주 속성 1)
 local giants=0
 for _,nid in ipairs(_SkillData:NodesOf('bone_rite')) do if string.sub(nid,1,6)=='giant_' then giants=giants+1 end end
 local nSk,nMg=#_SkillData:NodesOf('raise_skeleton'),#_SkillData:NodesOf('raise_mage')
 assert(nSk==6 and nMg==3 and giants==12,'node counts '..nSk..'/'..nMg..'/'..giants)
 for _,gone in ipairs({'skel_shield','mage_aura','mage_twin','mage_pierce','mage_blast','mage_hex','giant_quake','giant_basic_split','giant_basic_return'}) do assert(_SkillData:Get(gone)==nil,gone) end
 assert(_SkillData:Get('mage_curse').name=='저주 속성' and _SkillData:Get('mage_curse').parent=='raise_mage','curse node')
 -- 48-3 환급 (알림 없음 · 로그만)
 local notices,logs=0,{}
 local keepNotify=book.NotifyLearned
 book.NotifyLearned=function() notices=notices+1 end
 local keepLog=log
 log=function(m) table.insert(logs,m) end
 local function load(d) book.Levels={};book.Slots=',,,';book.RightSkill='';book:LoadSaveData(d) end
 local old={sv=4,levelCount=8,slots=',,,',right='',levels={raise_skeleton=12,skel_shield=3,raise_mage=8,mage_twin=2,mage_hex=3,bone_rite=20,giant_quake=2,giant_mage_pull=1}}
 stats.SkillPoints=0
 load(old)
 assert(stats.SkillPoints==11,'48-3 refund '..stats.SkillPoints)
 assert(book.Levels.skel_shield==nil and book.Levels.mage_twin==nil and book.Levels.mage_hex==nil and book.Levels.giant_quake==nil and book.Levels.giant_mage_pull==nil,'removed')
 assert(book.Levels.raise_skeleton==12 and book.Levels.raise_mage==8 and book.Levels.bone_rite==20,'mains kept')
 local saved=book:GetSaveData()
 assert(saved.sv==5 and saved.levels.skel_shield==nil,'saved sv '..tostring(saved.sv))
 load(saved)
 assert(stats.SkillPoints==11,'48-3 double refund after save '..stats.SkillPoints)
 book:MigrateLevels(4)
 assert(stats.SkillPoints==11,'48-3 double refund on second migrate '..stats.SkillPoints)
 stats.SkillPoints=0;load(old)
 assert(stats.SkillPoints==11,'48-3 same old save reloaded '..stats.SkillPoints)
 -- 현행 sv 5 저장: 새 효과로 찍은 마법사 거인 갈림은 돌려주지 않는다 · sv 4 저장의 갈림은 한 번
 stats.SkillPoints=0;load({sv=5,levelCount=2,levels={bone_rite=20,giant_mage_resist=1}})
 assert(stats.SkillPoints==0 and book.Levels.giant_mage_resist==1,'sv5 kept')
 -- 48 V2: 현행 sv 5 저장의 「폭발 증폭」(옛 「두 겹 고리」 투자)은 그대로 · 환급 0 · 다시 저장해도 sv 5 그대로 (재학습·중복 환급 없음)
 stats.SkillPoints=0;load({sv=5,levelCount=2,levels={bone_rite=20,giant_mage_pull=1}})
 assert(stats.SkillPoints==0 and book.Levels.giant_mage_pull==1,'sv5 amp kept '..stats.SkillPoints)
 do local again=book:GetSaveData() assert(again.sv==5 and again.levels.giant_mage_pull==1,'sv5 amp resave') load(again) assert(stats.SkillPoints==0 and book.Levels.giant_mage_pull==1,'sv5 amp reload no refund') end
 stats.SkillPoints=0;load({sv=4,levelCount=2,levels={bone_rite=20,giant_mage_resist=1}})
 assert(stats.SkillPoints==1 and book.Levels.giant_mage_resist==nil,'sv4 resist refund')
 -- sv 3 옛 저장: 44 결정 4 교체(질풍 걸음 2)와 48(폭발 마법사 3 · 세 갈래 뼈 1)이 각각 한 번
 stats.SkillPoints=0;load({sv=3,levelCount=4,levels={step_gale=2,raise_mage=5,mage_blast=3,bone_rite=20,giant_basic_split=1}})
 assert(stats.SkillPoints==6,'sv3 '..stats.SkillPoints)
 -- 현행 저장(지운 노드 없음 · sv 4): 0
 stats.SkillPoints=3;load({sv=4,levelCount=3,levels={raise_skeleton=9,skel_greatsword=2,skel_twin=1}})
 assert(stats.SkillPoints==3 and book.Levels.skel_greatsword==2,'current save untouched')
 -- 갈래 B 희망 편성(skills.hope): 옛 shield 희망은 FormOrder에 없으면 버리고(갈래 A 규칙) 대검 · 쌍칼 희망은 그대로
 load({sv=4,levelCount=1,levels={raise_skeleton=5},hope='s:d:shield=2,greatsword=1,twin=0/m:d:aura=1'})
 local hasShield=false
 for _,f in ipairs(_UndeadSystem:FormOrder('skeleton')) do if f=='shield' then hasShield=true end end
 assert(string.find(book.FormHope,'s:d:',1,true) and string.find(book.FormHope,'greatsword=1',1,true) and string.find(book.FormHope,'twin=0',1,true),'hope '..book.FormHope)
 assert(hasShield or not string.find(book.FormHope,'shield',1,true),'hope shield '..book.FormHope)
 assert(book:GetSaveData().hope==book.FormHope and book:GetSaveData().sv==5,'hope saved')
 assert(notices==0,'48-3 notices '..notices)
 local refundLogs=0
 for _,m in ipairs(logs) do if string.find(m,'skill migrate refund=',1,true) then refundLogs=refundLogs+1 end end
 log=keepLog;book.NotifyLearned=keepNotify
 -- UI 글귀 (§9 추천 1): 해골 전사 랭크 8 진화 · 마법사 구간 1·6·11·16 · 저주 속성 · 단계 점
 book.Levels={raise_skeleton=7}
 assert(string.find(book:GetRankSummary('raise_skeleton',7),'일반형 공격',1,true),book:GetRankSummary('raise_skeleton',7))
 for lv,pct in pairs({[8]=20,[13]=20,[14]=25,[20]=30}) do
  local t=book:GetRankSummary('raise_skeleton',lv)
  assert(string.find(t,'방패 해골 공격',1,true) and string.find(t,'받는 피해 -'..pct..'%',1,true) and string.find(t,'4초마다 도발',1,true),t)
 end
 local st=book:RankStages('raise_skeleton')
 assert(#st==1 and st[1].lv==8 and st[1].text=='방패 해골','skel stage')
 local ms=book:RankStages('raise_mage')
 assert(#ms==3 and ms[1].lv==6 and ms[2].lv==11 and ms[3].lv==16 and ms[1].text=='마법 강화','mage stages')
 book.Levels={raise_mage=5}
 local want={[1]='관통 2 · 파편 1 · 폭발 0.8칸 · 영혼 2발',[6]='관통 3 · 파편 2 · 폭발 1.0칸 · 영혼 3발',[11]='관통 4 · 파편 3 · 폭발 1.2칸 · 영혼 4발',[16]='관통 5 · 파편 4 · 폭발 1.4칸 · 영혼 5발',[20]='관통 5 · 파편 4 · 폭발 1.4칸 · 영혼 5발'}
 for lv,frag in pairs(want) do
  local t=book:GetRankSummary('raise_mage',lv)
  assert(string.find(t,frag,1,true) and not string.find(t,'낙인',1,true) and not string.find(t,'일반형',1,true),lv..': '..t)
 end
 book.Levels={raise_mage=20,mage_curse=1}
 assert(string.find(book:GetRankSummary('raise_mage',1),'낙인 +8%',1,true) and string.find(book:GetRankSummary('raise_mage',20),'낙인 +19.4%',1,true),book:GetRankSummary('raise_mage',20))
 assert(book:GetRankSummary('mage_curse',1)=='저주 속성 · 맞은 적 4초 받는 피해 +19.4% (약화의 낙인과 겹치면 큰 쪽)',book:GetRankSummary('mage_curse',1))
 book.Levels={raise_mage=10}
 local mline=SkillWindow:StatLine(book,stats,'raise_mage')
 assert(string.find(mline,'관통 3',1,true) and string.find(mline,'다음 랭크: ',1,true) and string.find(mline,'관통 4 · 파편 3 · 폭발 1.2칸 · 영혼 4발',1,true),mline)
 -- 마법사 편성 칸 (48 §2-5): 변이가 없으면(FormOrder 빈 표 · 갈래 A) 숨김 · 갈래 A 전에는 예전처럼 보임
 do
  local en2={}
  local keepEn=_UIKit.SetEnabled
  _UIKit.SetEnabled=function(_,path,on) en2[path]=on end
  book.Levels={raise_mage=3};SkillWindow.SelMain='raise_mage';SkillWindow.Selected='raise_mage'
  local keepFO=UndeadSystem.FormOrder
  local preA=#keepFO(UndeadSystem,'mage')>0
  SkillWindow:RenderForm(book,'raise_mage')
  assert(en2['SkillWin/WS/Form']==preA,'mage form box pre-A '..tostring(en2['SkillWin/WS/Form']))
  UndeadSystem.FormOrder=function(self,kind) if kind=='mage' then return {} end return keepFO(self,kind) end
  SkillWindow:RenderForm(book,'raise_mage')
  assert(en2['SkillWin/WS/Form']==false and SkillWindow.FormKind=='','mage form box hidden without forms')
  UndeadSystem.FormOrder=keepFO;_UIKit.SetEnabled=keepEn
 end
 -- 거인 수 (48 통합: SkillBook 어댑터 → UndeadSystem 공개 API · 인자 = 플레이어 엔티티): 서버 목록 꼴 · 클라이언트 쉼표 목록 — 상한 2에서만 5기 건너뜀
 local keepUS=UndeadSystem.IsServer
 UndeadSystem.IsServer=function() return true end
 UndeadSystem.Giants={}
 assert(book:GiantCount()==0 and not book:GiantStanding() and not book:GiantCapReached())
 UndeadSystem.Giants.fixture={{host={}}}
 assert(book:GiantCount()==1 and book:GiantStanding() and not book:GiantCapReached(),'one giant (list)')
 UndeadSystem.Giants.fixture={{host={}},{host={}}}
 assert(book:GiantCount()==2 and book:GiantCapReached(),'two giants (list)')
 UndeadSystem.Giants={}
 UndeadSystem.IsServer=function() return false end
 local cmdG={GiantKind='shield'}
 local keepGet2=entity.GetComponent
 entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return cmdG end return keepGet2(self,key) end
 assert(book:GiantCount()==1 and not book:GiantCapReached(),'client one')
 cmdG.GiantKind='shield,mage'
 assert(book:GiantCount()==2 and book:GiantCapReached(),'client two')
 cmdG.GiantKind=''
 assert(book:GiantCount()==0 and not book:GiantStanding(),'client none')
 entity.GetComponent=keepGet2;UndeadSystem.IsServer=keepUS
 -- S48-UI-DETAIL-PIPS-01: 편성 줄은 WS/Roster에만 · 효과 칸에는 없음 · 경고까지 그대로 · 칸(474×112)에 13px로도 들어감
 do
  local keepGet3=entity.GetComponent
  local cmdR={UndeadRoster='s:greatsword,s:twin,s:|0'}
  entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return cmdR end return keepGet3(self,key) end
  local keepHope=book.FormHope
  for _,c in ipairs({{'raise_skeleton',{raise_skeleton=3,skel_greatsword=1,skel_twin=1},'s:d:greatsword=3,twin=3'},{'raise_mage',{raise_mage=10},''},{'skel_twin',{raise_skeleton=7,skel_legion=2,skel_greatsword=3,skel_twin=3},'s:d:greatsword=3,twin=3'}}) do
   book.Levels=c[2];book.FormHope=c[3];values={}
   SkillWindow.SelMain=(c[1]=='raise_mage') and 'raise_mage' or 'raise_skeleton';SkillWindow.Selected=c[1]
   SkillWindow:RenderWorkshop(book,stats)
   local full=book:RosterLine(c[1])
   local shown=values['SkillWin/WS/Roster'] or ''
   assert(full~='' and string.find(plain(shown),'편성',1,true),'roster missing '..c[1]..': '..shown)
   assert(not string.find(values['SkillWin/WS/Stat'] or '','편성',1,true),'roster still in stat box '..c[1])
   local back=string.gsub(string.gsub(plain(shown),'\n  · ',' · '),'\n  ',' ')
   assert(back==full,'roster text changed '..c[1]..'\n'..full..'\n--\n'..shown)
   local n=#lines(shown)
   assert(n*13*1.48<=112,'roster box overflow '..c[1]..' '..n)
   rosterLog=(rosterLog or '')..c[1]..' '..n..'줄 · '
  end
  book.FormHope=keepHope;entity.GetComponent=keepGet3
  print('[quality/skills] S48-UI-DETAIL-PIPS-01 roster line in WS/Roster only (text intact · fits 474×112 at 13px): '..rosterLog)
 end
 stats.Level,stats.SkillPoints,stats.MaxDifficulty=keepLv,keepPts,keepDiff
 _SkillData.NodesOf,_SkillData.Mains,_SkillData.Get=fNodes,fMains,fGet
 print('[quality/skills] 48 C: nodes 6/3/12=21 · refund old sv4 +11 once (save→reload 0 · re-migrate 0 · same old save 11) · sv5 0 · sv4 resist 1 · sv3 6 · current 0 · notices 0 · refund logs '..refundLogs..' · hope compat (shield '..(hasShield and 'kept pre-A' or 'dropped')..') · skeleton rank 8 shield copy · mage tiers 1/6/11/16 + curse 8→19.4% · giant count API server/client')
end
print('[quality/skills] effective rank/gear/choice, dash charge, nodes, aura preview, summon totals, selected-node detail/no-spend, use hints and 8 offer combinations passed')
