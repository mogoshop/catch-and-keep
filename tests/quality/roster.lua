-- I03 편성 미리보기 대조: UndeadSystem.RosterPreview(읽기 전용)가 실제 일으키기(Raise → MakeRecord·ApplyForm → SlotPlan·TrimOldest)와 같은 답을 내는가
-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats,GetMonsterFrames
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName
-- @source SkillBook Skill/SkillBook.mlua GetPowerLevel+,PowerLevelAt+,GetLevel+,Node+,GetCommandAura+,UseHint+,FormHint+,RosterLine+
-- @source UndeadSystem Undead/UndeadSystem.mlua Raise+,MakeRecord+,TrimOldest+,RefreshSummary+,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,EncodeRoster,DecodeRoster,RosterOf+,FormName,NodeForm+,GiantReserved,ListOf,Remove+
_GameData:Ensure();_SkillData:Ensure()
Environment={IsPublishedPlay=function() return true end}
_UtilLogic={ElapsedSeconds=0,RandomIntegerRange=function(_,lo,hi) return lo end}
local V={}
V.__index=V
V.__sub=function(a,b) return setmetatable({x=a.x-b.x,y=a.y-b.y},V) end
function V:Magnitude() return math.sqrt(self.x*self.x+self.y*self.y) end
function Vector2(x,y) return setmetatable({x=x,y=y},V) end
function isvalid(x) return x~=nil end
local notices={}
_Util={Pos2=function() return Vector2(0,0) end,IsAlive=function() return true end,
 Notify=function(_,text) table.insert(notices,text) end,Warn=function(_,text) table.insert(notices,'warn:'..text) end}
_TimerService={SetTimerOnce=function() end}
_GameEvents={Emit=function() end}
local choices={}
local quest={ChoiceTier=function(_,slot,axis) return choices[slot..':'..axis] or 0 end}
local bonus=0
local stats={Level=99,GetSkillLevelBonus=function() return bonus end,GetMinionPct=function() return 0 end}
local cmd={UndeadRoster='|0',UndeadSummary='',MinionCounts='0,0,0'}
local book=SkillBook
local player={Id='p1',PlayerComponent={UserId='u1'}}
local map={}
player.CurrentMap=map
player.GetComponent=function(_,key)
 if key=='script.PlayerStats' then return stats elseif key=='script.PlayerQuest' then return quest
 elseif key=='script.SkillBook' then return book elseif key=='script.ShadowCommander' then return cmd end end
_GameConst={LevelOf=function() return stats.Level end}
book.Entity=player;book.IsServer=function() return true end
local server=true
UndeadSystem.IsServer=function() return server end
-- 엔진 쪽만 대신한다: 혼 찾기·엔티티 생성·연출. 정원·변이·교체·알림 분기는 실제 Raise 본문 그대로
local orb
UndeadSystem.FindUsableSoul=function() return orb end
UndeadSystem.SpawnUnit=function(_,_,rec,_,onReady) rec.entity=nil if onReady then onReady() end return true end
UndeadSystem.PlaySummonFx=function() end
local serial=0
local function rec(kind,form,extra)
 serial=serial+1
 local r={id='t'..serial,kind=kind,form=form,hp=100,expireAt=0}
 for k,v in pairs(extra or {}) do r[k]=v end
 return r
end
local function setList(list) UndeadSystem.Owned={u1=list} end
local function forms(list,kind)
 local out={}
 for _,r in ipairs(list) do if r.kind==kind then table.insert(out,(r.form or '')..(r.giant and '!' or '')) end end
 return table.concat(out,',')
end
local function ids(list) local out={} for _,r in ipairs(list) do table.insert(out,r.id) end return table.concat(out,',') end
local function digest(p)
 local c={}
 for _,f in ipairs({'','shield','greatsword','twin','aura','hex','pierce','blast'}) do if (p.counts[f] or 0)>0 then table.insert(c,f..'='..p.counts[f]) end end
 local idle={}
 for _,x in ipairs(p.idle) do table.insert(idle,x.form..'+'..x.need) end
 local rep={}
 for _,r in ipairs(p.replaces) do table.insert(rep,(r.form or '')) end
 return string.format('lv=%d max=%d have=%d res=%d full=%s keep=%d counts=%s next=%s replaces=%s idle=%s',p.level,p.max,p.have,p.reserved,tostring(p.full),p.keep,
  table.concat(c,' '),p.nextForm,table.concat(rep,','),table.concat(idle,' '))
end
local passed,total=0,0
-- 한 상태: 서버 미리보기 = 동기화 문자열로 만든 클라이언트 미리보기 = 실제 Raise 결과
local function check(name,kind,expect)
 total=total+1
 local list=UndeadSystem:ListOf(player)
 local before=ids(list)..'#'..forms(list,'skeleton')..'#'..forms(list,'mage')
 local serialBefore=UndeadSystem.Serial
 local p=UndeadSystem:RosterPreview(player,kind)
 assert(ids(list)..'#'..forms(list,'skeleton')..'#'..forms(list,'mage')==before and UndeadSystem.Serial==serialBefore,name..': preview mutated roster')
 UndeadSystem:RefreshSummary(player)
 server=false
 local c=UndeadSystem:RosterPreview(player,kind)
 server=true
 assert(digest(p)==digest(c),name..': client '..digest(c)..' ~= server '..digest(p))
 if expect then for k,v in pairs(expect) do
  local got=k=='replaces' and #p.replaces or k=='idle' and table.concat((function() local t={} for _,x in ipairs(p.idle) do table.insert(t,x.form..'+'..x.need) end return t end)(),' ') or p[k]
  assert(got==v,name..': '..k..'='..tostring(got)..' expected '..tostring(v)..' | '..digest(p))
 end end
 local slvl=book:GetPowerLevel(kind=='mage' and 'raise_mage' or 'raise_skeleton')
 local victims={}
 for _,r in ipairs(p.replaces) do victims[r.id]=true end
 local old={}
 for _,r in ipairs(list) do old[r.id]=r end
 notices={}
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() end}
 local ok=nil
 assert(UndeadSystem:Raise(player,kind,slvl,Vector2(0,0),function(s) ok=s end),name..': raise refused')
 assert(ok==true,name..': raise not committed')
 local after=UndeadSystem:ListOf(player)
 local newest=after[#after]
 assert(newest.kind==kind and old[newest.id]==nil,name..': new record not appended')
 assert((newest.form or '')==p.nextForm,name..': raised '..tostring(newest.form)..' preview '..p.nextForm)
 local still={}
 for _,r in ipairs(after) do still[r.id]=true end
 for id,r in pairs(old) do assert((still[id]==nil)==(victims[id]==true),name..': trim mismatch on '..id..' ('..tostring(r.form)..')') end
 local notified=false
 for _,t in ipairs(notices) do if string.find(t,'가장 오래된 하나가 무너졌습니다',1,true) then notified=true end end
 assert(notified==p.full,name..': full notice '..tostring(notified)..' preview full='..tostring(p.full))
 passed=passed+1
 return p
end
local function steadyByRaise(kind,count,keepList)
 -- 실제 Raise를 count번 되풀이한 뒤 마지막 구간에 선 변이 (SteadyRoster 대조) · keepList면 지금 목록·거인 그대로에서 시작
 if not keepList then setList({}) end
 local seen={}
 for i=1,count do
  orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() end}
  UndeadSystem:Raise(player,kind,book:GetPowerLevel(kind=='mage' and 'raise_mage' or 'raise_skeleton'),Vector2(0,0),nil)
  if i>count/2 then
   local now={}
   for _,r in ipairs(UndeadSystem:ListOf(player)) do if r.kind==kind then now[r.form or '']=(now[r.form or '']or 0)+1 end end
   for f,n in pairs(now) do if n>(seen[f] or 0) then seen[f]=n end end
  end
 end
 return seen
end
local function sameSteady(name,kind)
 total=total+1
 local p=UndeadSystem:RosterPreview(player,kind)
 local sim=UndeadSystem:SteadyRoster(kind,p.max,p.quota,{},0)
 local real=steadyByRaise(kind,80)
 for _,f in ipairs({'',table.unpack(UndeadSystem:FormOrder(kind))}) do
  assert((sim[f] or 0)==(real[f] or 0),name..': steady '..f..' sim='..tostring(sim[f])..' raise='..tostring(real[f]))
 end
 passed=passed+1
end

-- 1. 일반형만 · 빈 목록 · 정원 1
book.Levels={raise_skeleton=1}
setList({})
check('1 plain empty','skeleton',{max=1,have=0,full=false,nextForm='',replaces=0})
-- 2. 세 변이 1랭크 · 정원 2 꽉 참 → 다음 쌍칼, 가장 오래된 방패 교체
book.Levels={raise_skeleton=2,skel_shield=1,skel_greatsword=1,skel_twin=1}
setList({rec('skeleton','shield'),rec('skeleton','greatsword')})
local p2=check('2 full three forms','skeleton',{max=2,have=2,full=true,nextForm='twin',replaces=1})
assert(p2.replaces[1].form=='shield')
-- 3. 앞 변이가 정원을 다 씀: 방패 3 · 대검 1 · 정원 2 → 대검 0기 (정원 +1부터) · 다음은 방패
book.Levels={raise_skeleton=2,skel_shield=3,skel_greatsword=1}
setList({rec('skeleton','shield'),rec('skeleton','shield')})
check('3 front form starves greatsword','skeleton',{max=2,nextForm='shield',replaces=1,idle='greatsword+1'})
local hint=book:UseHint('skel_greatsword')
assert(string.find(hint,'0기',1,true) and string.find(hint,'정원 +1',1,true),hint)
local line=book:RosterLine('raise_skeleton')
assert(string.find(line,'편성 2/2: 방패 2',1,true) and string.find(line,'다음 소환: 방패 해골(가장 오래된 방패 해골 교체)',1,true),line)
sameSteady('3 steady matches repeated raise','skeleton')
-- 3b. 뼈 군단 +1이면 대검이 실제로 선다 (안내한 「정원 +1」 확인)
book.Levels.skel_legion=1
local p3b=UndeadSystem:RosterPreview(player,'skeleton')
assert(#p3b.idle==0 and p3b.max==3,digest(p3b))
assert(not string.find(book:UseHint('skel_greatsword'),'0기',1,true),book:UseHint('skel_greatsword'))
sameSteady('3b legion lets greatsword stand','skeleton')
assert((steadyByRaise('skeleton',40).greatsword or 0)>0)
-- 4. 뼈 거인 예약: 거인 몸(방패) + 일반 1 · 거인에 넷 · 정원 6 → 꽉 참, 일반이 교체 · 거인 몸은 남는다
book.Levels={raise_skeleton=12,skel_shield=1,skel_greatsword=1}
local host=rec('skeleton','shield',{giant=true})
setList({host,rec('skeleton','')})
UndeadSystem.Giants={u1={host=host,mates={rec('skeleton',''),rec('skeleton',''),rec('skeleton',''),rec('skeleton','')},epoch=1}}
local p4=check('4 giant reserve','skeleton',{max=6,have=6,reserved=4,full=true,nextForm='greatsword',replaces=1})
assert(p4.replaces[1].giant==nil and UndeadSystem:ListOf(player)[1]==host,'giant host trimmed')
assert(string.find(book:RosterLine('raise_skeleton'),'거인에 4',1,true),book:RosterLine('raise_skeleton'))
UndeadSystem.Giants={}
-- 5. 일시 소환(첫 처치 그림자 · revive) 섞임: 해골 정원·교체에 끼지 않는다
book.Levels={raise_skeleton=3,skel_twin=1}
setList({rec('revive','',{taste=true,expireAt=30}),rec('skeleton',''),rec('revive','',{taste=true,expireAt=30}),rec('skeleton','twin'),rec('skeleton','')})
local p5=check('5 temporary summons ignored','skeleton',{max=3,have=3,full=true,nextForm='',replaces=1})
assert(p5.replaces[1].kind=='skeleton')
local revives=0
for _,r in ipairs(UndeadSystem:ListOf(player)) do if r.kind=='revive' then revives=revives+1 end end
assert(revives==2,'revive trimmed by skeleton raise')
-- 6. 마법사 다섯 변이 1랭크 · 정원 2 → 관통·폭발 0기 · 다음 쌍발 (광기 교체)
book.Levels={raise_mage=2,mage_aura=1,mage_hex=1,mage_twin=1,mage_pierce=1,mage_blast=1}
setList({rec('mage','aura'),rec('mage','hex')})
check('6 mage five forms cap 2','mage',{max=2,full=true,nextForm='twin',replaces=1,idle='pierce+1 blast+2'})
assert(string.find(book:UseHint('mage_blast'),'정원 +2(마법사 증원)',1,true),book:UseHint('mage_blast'))
sameSteady('6 mage steady matches repeated raise','mage')
-- 7. 장비를 벗어 정원이 줄었다: 해골 4기 · 정원 2 → 오래된 3기 교체
book.Levels={raise_skeleton=1,skel_shield=1};bonus=1
setList({rec('skeleton','shield'),rec('skeleton',''),rec('skeleton',''),rec('skeleton','')})
assert(string.find(book:RosterLine('skel_shield'),'오래된 3기 교체',1,true),book:RosterLine('skel_shield'))
check('7 lowered cap trims several','skeleton',{max=2,have=4,full=true,keep=1,replaces=3,nextForm=''})
bonus=0
-- 8. 선택 보상 「해골 하나 더」가 정원에 들어가고 빈자리면 교체 없음
book.Levels={raise_skeleton=2,skel_greatsword=2};choices['1:command']=1
setList({rec('skeleton','greatsword'),rec('skeleton','greatsword')})
check('8 quest choice slot, no trim','skeleton',{max=3,have=2,full=false,nextForm='',replaces=0})
choices={}
-- 9. 마법사 경계: 정원 -1 → 교체 없음, 광기 자리가 비어 다음 광기
book.Levels={raise_mage=3,mage_aura=1,mage_hex=2}
setList({rec('mage','hex'),rec('mage','hex')})
check('9 mage boundary below cap','mage',{max=3,have=2,full=false,nextForm='aura',replaces=0})
-- 10. 정원 경계에서 연속 20번: 매번 미리보기 = 실제
book.Levels={raise_skeleton=2,skel_shield=2,skel_greatsword=1,skel_twin=1}
setList({})
for i=1,20 do check('10 sequence #'..i,'skeleton') end
-- 11. 다음 랭크가 세기만 올리는 경우 / 앞 변이 투자가 뒤 변이를 밀어내는 경우 안내
book.Levels={raise_skeleton=2,skel_shield=2}
assert(string.find(book:UseHint('skel_shield'),'세기만',1,true),book:UseHint('skel_shield'))
book.Levels={raise_skeleton=2,skel_shield=2,skel_greatsword=1}
assert(string.find(book:UseHint('skel_shield'),'대검 해골 자리가 없어집니다',1,true),book:UseHint('skel_shield'))
-- 12. 여러 노드 조합에서 SteadyRoster = 실제 Raise 반복
for _,levels in ipairs({{raise_skeleton=1,skel_shield=1,skel_greatsword=1,skel_twin=1},{raise_skeleton=5,skel_shield=3,skel_greatsword=3,skel_twin=3},
  {raise_skeleton=3,skel_legion=2,skel_twin=3,skel_shield=1}}) do
 book.Levels=levels;sameSteady('12 steady combo','skeleton')
end
for _,levels in ipairs({{raise_mage=1,mage_aura=1,mage_blast=3},{raise_mage=6,mage_legion=2,mage_hex=3,mage_twin=2,mage_pierce=3,mage_blast=3}}) do
 book.Levels=levels;sameSteady('12 steady mage combo','mage')
end
-- 14. I03-R01 거인 유지 중 0기: 유효 raise_skeleton 12 → 정원 6 · 거인 방패 몸 1 + 예약 4 · 나머지 1 · 방패 3 / 대검 3 · 쌍칼 0→1 검토
local function giantState()
 book.Levels={raise_skeleton=12,skel_shield=3,skel_greatsword=3}
 local h=rec('skeleton','shield',{giant=true})
 setList({h,rec('skeleton','')})
 UndeadSystem.Giants={u1={host=h,mates={rec('skeleton','shield'),rec('skeleton','shield'),rec('skeleton','greatsword'),rec('skeleton','greatsword')},epoch=1}}
 return h
end
giantState()
total=total+1
local pg=UndeadSystem:RosterPreview(player,'skeleton')
assert(pg.giant and pg.max==6 and pg.reserved==4 and #pg.idle==0,digest(pg))
assert(table.concat(pg.idleNow,' ')=='greatsword','idleNow='..table.concat(pg.idleNow,' '))
local tw=book:UseHint('skel_twin')
assert(string.find(tw,'뼈 거인이 서 있는 동안 0기',1,true) and not string.find(tw,'정원 6기로는',1,true),tw)
passed=passed+1
-- 거인 유지 중 실제 반복 소환 = steadyNow (거인 몸 고정 · 예약 4) · 쌍칼 1을 찍어도 서지 못한다
for _,twin in ipairs({0,1}) do
 total=total+1
 giantState();book.Levels.skel_twin=twin
 local pn=UndeadSystem:RosterPreview(player,'skeleton')
 local real=steadyByRaise('skeleton',60,true)
 for _,f in ipairs({'','shield','greatsword','twin'}) do
  assert((pn.steadyNow[f] or 0)==(real[f] or 0),'giant steadyNow '..f..' sim='..tostring(pn.steadyNow[f])..' raise='..tostring(real[f]))
 end
 assert((real.twin or 0)==0 and (real.greatsword or 0)==0,'twin/greatsword stood while giant held')
 assert(UndeadSystem:ListOf(player)[1].giant==true,'giant host trimmed during repeated raise')
 passed=passed+1
end
-- 거인이 갈라진 뒤(예약 0 · 몸 풀림) 같은 투자로 실제 쌍칼이 선다 → 장기 판단은 0기 경고 없음
total=total+1
local h=giantState();book.Levels.skel_twin=1
UndeadSystem.Giants={};h.giant=nil
assert(not string.find(book:UseHint('skel_twin'),'0기',1,true),book:UseHint('skel_twin'))
local pr=UndeadSystem:RosterPreview(player,'skeleton')
assert(not pr.giant and #pr.idleNow==0,digest(pr))
assert((steadyByRaise('skeleton',80,true).twin or 0)>0,'twin never stood after giant split')
passed=passed+1
-- 거인 중 미리보기 = 실제 Raise (몸 고정 · 일반 교체) 한 번 더
giantState();book.Levels.skel_twin=1
check('14 giant held, twin invested','skeleton',{max=6,reserved=4,full=true,nextForm='shield',replaces=1})
UndeadSystem.Giants={}
-- 15. I03-R02 최초 조회는 Owned를 만들지 않는다 (서버 · 목록 없는 플레이어)
total=total+1
UndeadSystem.Owned={}
local serial0=UndeadSystem.Serial
book.Levels={raise_skeleton=3,skel_shield=1,skel_twin=2}
local p0=UndeadSystem:RosterPreview(player,'skeleton')
local _=book:RosterLine('raise_skeleton')..book:UseHint('skel_twin')..book:UseHint('skel_shield')
UndeadSystem:RosterPreview(player,'mage')
assert(next(UndeadSystem.Owned)==nil,'preview registered Owned entry')
assert(UndeadSystem.Serial==serial0 and p0.have==0 and p0.nextForm=='shield' and #p0.replaces==0,digest(p0))
passed=passed+1
-- 13. 인코딩 왕복: 변이·거인 표시·예약 수
local text=UndeadSystem:EncodeRoster({rec('skeleton','shield',{giant=true}),rec('revive',''),rec('mage','')},4)
assert(text=='s:shield!,m:|4',text)
local back=UndeadSystem:DecodeRoster(text)
assert(#back.list==2 and back.list[1].giant==true and back.list[2].kind=='mage' and back.list[2].form=='' and back.reserved==4)
print(string.format('[quality/roster] preview == live raise %d/%d (states: plain, full 3 forms, starved form + legion, giant reserve, temp summons, mage 5 forms, lowered cap, quest slot, mage boundary, 20-raise sequence, steady combos, giant-held 0기 vs split, first lookup keeps Owned, encode)',passed,total))
