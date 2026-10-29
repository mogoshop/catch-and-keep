-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName
-- @source SkillBook Skill/SkillBook.mlua RosterLine+,GetRankSummary+,PowerLevelAt+,GetPowerLevel+,GetManaCost+,SkillCooldown+,GetCommandAura+,UseHint+,RankCap,CanLearn+,StageRanks+,NextStage+,IsComplete+,StageReachedAt+,RankStages+,GearRanks+,NextRankLevel+
-- @source UndeadSystem Undead/UndeadSystem.mlua MaxFor+,GetBaseStats,MakeRecord+,NodeForm+,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,FormName,RosterOf+
-- @source SkillWindow UI/Windows/SkillWindow.mlua StatLine,Pick,RenderWorkshop+,RenderTimeline+,SplitColumns,DisplayColumns+,SlotPathOf+,Flip+
-- @source UIKitReal UI/Core/UIKit.mlua PlainText,TextWidth
-- @source SkillOffer UI/Windows/SkillOffer.mlua Pick+,Render+
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
 {'대검 0기 (I03-3)',{raise_skeleton=2,skel_shield=3,skel_greatsword=1},'s:shield,s:shield|0','skel_greatsword','정원 2기로는 0기 · 정원 +1(뼈 군단)부터 섭니다','대검 해골 2기',SkillOffer.ChangeMaxLines},   -- CARD-E1E-R01: 반경 ×1.8을 남겨 어림 폭으로 4줄(12px 이상)
 {'방패 세기만 (I03-5)',{raise_skeleton=2,skel_shield=2},'s:shield,s:shield|0','skel_shield','다음 랭크는 세기만 오릅니다 (정원이 차 2기 그대로)','방패 해골 3기'},
 {'자리 없어짐 (I03-4)',{raise_skeleton=2,skel_greatsword=1,skel_shield=2},'s:shield,s:shield|0','skel_shield','찍으면 대검 해골 자리가 없어집니다 · 정원 2기','방패 해골 3기'},
 {'거인 중 0기 (I03-6)',{bone_rite=1,raise_skeleton=9,skel_shield=2,skel_twin=1},'s:!,s:shield|4','skel_twin','뼈 거인이 서 있는 동안 0기 · 거인이 갈라진 뒤 섭니다','쌍칼 해골 2기'},
}
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
 local gsText=cardChange({raise_skeleton=2,skel_shield=3,skel_greatsword=1},'s:shield,s:shield|0','skel_greatsword')
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
  for lv=0,def.maxLv-1 do
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
-- INT1725-OBS-02 (I03-6 거인 유지 중 편성 줄): 거인 몸(s:!)은 「일반」이 아니라 「거인 본체」, 합쳐진 넷은 「거인에 4」, 분모 섞인 「6/5」 대신 「정원 5기」.
--   정원 계산·진단 수는 그대로 (have 6 = 예약 4 + 기록 2 · counts는 거인 몸을 센다) — 표시만 나눈다
entity.GetComponent=function(self,key) if key=='script.ShadowCommander' then return cmdRoster end return oldGet(self,key) end
book.Levels={bone_rite=1,raise_skeleton=9,skel_shield=2,skel_twin=1};stats.Level=40;bonus=0
cmdRoster.UndeadRoster='s:!,s:shield|4'
local gline=book:RosterLine('raise_skeleton')
assert(gline=='편성: 방패 1·거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 방패 해골(가장 오래된 방패 해골 교체)',gline)
local gp=_UndeadSystem:RosterPreview(entity,'skeleton')
assert(gp.have==6 and gp.max==5 and gp.reserved==4 and gp.counts['']==1 and gp.counts.shield==1 and gp.bodies==1 and (gp.units[''] or 0)==0 and gp.units.shield==1,'raw have/counts or display split')
cmdRoster.UndeadRoster='s:!|4'
assert(book:RosterLine('skel_twin')=='편성: 거인 본체 1·거인에 4 · 정원 5기 · 다음 소환: 방패 해골',book:RosterLine('skel_twin'))
cmdRoster.UndeadRoster='s:shield,s:shield,s:twin,s:,s:|0'   -- 거인이 갈라진 뒤: 예전 꼴 그대로
assert(book:RosterLine('skel_twin')=='편성 5/5: 일반 2·방패 2·쌍칼 1 · 다음 소환: 해골 전사(가장 오래된 방패 해골 교체)',book:RosterLine('skel_twin'))
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
print('[quality/skills] effective rank/gear/choice, dash charge, nodes, aura preview, summon totals, selected-node detail/no-spend, use hints and 8 offer combinations passed')
