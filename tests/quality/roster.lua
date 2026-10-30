-- I03 편성 미리보기 대조: UndeadSystem.RosterPreview(읽기 전용)가 실제 일으키기(Raise → MakeRecord·ApplyForm → SlotPlan·TrimOldest)와 같은 답을 내는가
-- @source GameData Data/GameData.mlua Ensure,GetUiIcon,GetMonsterStats,GetMonsterFrames,GetGiant
-- @source SkillData Data/SkillData.mlua Ensure,Get,Mains,NodesOf,TreeName
-- @source SkillBook Skill/SkillBook.mlua GetPowerLevel+,PowerLevelAt+,GetLevel+,Node+,GetCommandAura+,UseHint+,FormHint+,RosterLine+,AutoHope+,HasHope+,RequestFormMode+,RequestFormHope+,SaveFormHope+,RequestShardHold,GetSaveData,LoadSaveData+,RequestRiteBanner,RiteUnits5+,GiantStanding,RiteBestStage+
-- @source UndeadSystem Undead/UndeadSystem.mlua Raise+,MakeRecord+,TrimOldest+,RefreshSummary+,RosterPreview+,PreviewFrom+,SteadyRoster+,ExtraSlotsFor+,EncodeRoster,DecodeRoster,RosterOf+,FormName,NodeForm+,GiantReserved,PlanList,RosterView+,NotReady,ListOf,Remove+,PlanNext+,PlanFor+,ParseHope+,EncodeHope+,HopeOf+,PlaceQuota+,SamePlan,PickForm+,SlotCount,TrimVictims,RemoveRec,FormOrder,LiveUnits,GiantFallback,GiantKey,GiantPool,GiantPoolCount,GiantPlan+,GiantCountsText,GiantPlanFor+
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
 local u={}
 for _,f in ipairs({'','shield','greatsword','twin','aura','hex','pierce','blast'}) do if (p.units[f] or 0)>0 then table.insert(u,f..'='..p.units[f]) end end
 return string.format('lv=%d max=%d have=%d res=%d full=%s keep=%d counts=%s units=%s bodies=%d next=%s replaces=%s idle=%s',p.level,p.max,p.have,p.reserved,tostring(p.full),p.keep,
  table.concat(c,' '),table.concat(u,' '),p.bodies,p.nextForm,table.concat(rep,','),table.concat(idle,' '))
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
   for _,r in ipairs(UndeadSystem:ListOf(player)) do if r.kind==kind and not r.giant then now[r.form or '']=(now[r.form or '']or 0)+1 end end   -- 46-0: 거인 몸은 서 있는 수가 아니다
   for f,n in pairs(now) do if n>(seen[f] or 0) then seen[f]=n end end
  end
 end
 return seen
end
local function sameSteady(name,kind)
 total=total+1
 local p=UndeadSystem:RosterPreview(player,kind)
 local sim=UndeadSystem:SteadyRoster(kind,p.max,p.quota,p.hope,{},0)
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
-- INT1725-OBS-02: 방패 모습의 거인 몸은 「방패」로 세지 않고 「거인 본체」 · 분모 섞인 「6/6」 대신 「정원 6기」 (have·counts는 진단 그대로 거인 몸을 센다)
assert(p4.counts.shield==1 and p4.bodies==1 and (p4.units.shield or 0)==0 and p4.units['']==1,digest(p4))
--   check가 실제로 한 번 일으킨 뒤(일반 교체 → 대검)의 줄: 방패 몸은 끝까지 「방패」로 세지 않는다
assert(book:RosterLine('raise_skeleton')=='편성: 대검 1·거인 본체 1·거인에 4 · 정원 6기 · 다음 소환: 해골 전사(가장 오래된 대검 해골 교체)',book:RosterLine('raise_skeleton'))
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
-- 46-0 R1: 거인 몸(방패)·합쳐진 넷(방패 2 · 대검 2)이 변이 자리를 쓴다 → 방패 3자리가 모두 거인 몫이라 거인 동안 서는 방패 0 (대검은 남은 1자리로 선다)
assert(table.concat(pg.idleNow,' ')=='shield','idleNow='..table.concat(pg.idleNow,' '))
-- 46-0 R1: 쌍칼은 남은 1자리를 대검과 번갈아 쓴다(무너질 개체를 센 채 고르는 규칙) → 0기 경고 없음 · 방패는 거인 몫으로 다 차 「거인 동안 0기」
local tw=book:UseHint('skel_twin')
assert(not string.find(tw,'0기',1,true),'tw='..tw)
local sh=book:UseHint('skel_shield')
assert(string.find(sh,'뼈 거인이 서 있는 동안 0기',1,true) and not string.find(sh,'정원 6기로는',1,true),'sh='..sh)
passed=passed+1
-- 거인 유지 중 실제 반복 소환 = steadyNow (거인 몸 고정 · 합쳐진 넷 「~」) · 방패는 거인 몫으로 다 찼다
for _,twin in ipairs({0,1}) do
 total=total+1
 giantState();book.Levels.skel_twin=twin
 local pn=UndeadSystem:RosterPreview(player,'skeleton')
 local real=steadyByRaise('skeleton',60,true)
 for _,f in ipairs({'','shield','greatsword','twin'}) do
  assert((pn.steadyNow[f] or 0)==(real[f] or 0),'giant steadyNow '..f..' sim='..tostring(pn.steadyNow[f])..' raise='..tostring(real[f]))
 end
 assert((real.shield or 0)==0,'shield stood while giant held (slots held by giant body + merged)')
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
check('14 giant held, twin invested','skeleton',{max=6,reserved=4,full=true,nextForm='greatsword',replaces=1})
UndeadSystem.Giants={}
-- 46-0 R1 (RB-OBS-03): 거인 몸이 쌍칼·대검·일반 어느 것이든 「서 있는 수」에서 빠져 같은 규칙으로 「거인 동안 0기」가 뜬다.
--   정원 5 · 방패·대검·쌍칼 1랭크 · 목록 = 거인 몸 하나 · 합쳐진 넷 일반 → 남는 1자리는 늘 방패 (예전: 몸이 쌍칼·대검이면 그 변이를 「1기 서 있다」로 세어 경고가 빈칸)
--   (쌍칼 몸 = RB-OBS-03 관찰 장면: 쌍칼 카드 경고 · 대검·일반 몸: 그 모습이 「서 있다」로 잡히지 않음 — 예전엔 셋 다 1기로 셌다)
for _,body in ipairs({{'twin','skel_twin'},{'greatsword',nil},{'',nil}}) do
 total=total+1
 book.Levels={raise_skeleton=9,skel_shield=1,skel_greatsword=1,skel_twin=1};book.FormHope=''
 local hb=rec('skeleton',body[1],{giant=true})
 setList({hb})
 UndeadSystem.Giants={u1={host=hb,mates={rec('skeleton',''),rec('skeleton',''),rec('skeleton',''),rec('skeleton','')},epoch=1}}
 if body[2] then
  local hint=book:UseHint(body[2])
  assert(string.find(hint,'뼈 거인이 서 있는 동안 0기',1,true),'body='..body[1]..' hint='..hint)
 end
 local pb=UndeadSystem:RosterPreview(player,'skeleton')
 assert(pb.giant and pb.reserved==4 and (pb.steadyNow[body[1]] or 0)==0,'body '..body[1]..' counted as standing')
 passed=passed+1
end
-- 46-0 R1: 거인 동안 일으켜도 합쳐진 넷의 변이 자리를 다시 쓰지 않는다 → 갈라진 뒤 변이 수 ≤ 랭크 (예전: 넷이 비운 방패 자리에 새 방패가 서 갈라진 뒤 방패 4)
total=total+1
book.Levels={raise_skeleton=12,skel_shield=2,skel_greatsword=1};book.FormHope=''
do
 local hs=rec('skeleton','',{giant=true})
 setList({hs})
 local mates={rec('skeleton','shield'),rec('skeleton','shield'),rec('skeleton',''),rec('skeleton','')}
 UndeadSystem.Giants={u1={host=hs,mates=mates,epoch=1}}
 steadyByRaise('skeleton',12,true)
 UndeadSystem.Giants={};hs.giant=nil
 for _,m in ipairs(mates) do m.merged=nil table.insert(UndeadSystem:ListOf(player),m) end
  local n={}
 for _,r in ipairs(UndeadSystem:ListOf(player)) do n[r.form or '']=(n[r.form or ''] or 0)+1 end
 assert((n.shield or 0)<=2 and (n.greatsword or 0)<=1,'variant over quota after split shield='..tostring(n.shield)..' greatsword='..tostring(n.greatsword))
end
passed=passed+1
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
-- 46-0: 합쳐짐 「~」 · 아직 못 바침 「?」 왕복
local text2=UndeadSystem:EncodeRoster({rec('skeleton','twin',{giant=true}),rec('mage','hex',{notReady=true}),rec('skeleton','shield',{merged=true}),rec('mage','aura',{merged=true})},0)
assert(text2=='s:twin!,m:hex?,s:shield~,m:aura~|0',text2)
local back2=UndeadSystem:DecodeRoster(text2)
assert(back2.list[2].notReady and back2.list[3].merged and back2.list[3].form=='shield' and back2.list[4].kind=='mage' and back2.reserved==0,'decode marks')
-- ───────── I03 단계 2 희망 편성 (10-30 갈래 B · goal-roster-input-review-plan-0035 B-T01~B-T03) ─────────
senderUserId='u1'
UndeadSystem.Giants={}
local function hopeCase(name,fn) total=total+1 fn() passed=passed+1 end
local function legacyPlan(kind,max,quota,list,reserved)
 -- 고정 4ba51d5e 규칙 그대로: 무너질 개체를 센 채 PickForm → SlotCount.keep → TrimVictims
 local form=UndeadSystem:PickForm(kind,quota,list,nil)
 return form,UndeadSystem:TrimVictims(list,kind,UndeadSystem:SlotCount(max,kind,list,reserved).keep)
end
local function raiseOnce(kind)
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() end}
 local ok=nil
 assert(UndeadSystem:Raise(player,kind,book:GetPowerLevel(kind=='mage' and 'raise_mage' or 'raise_skeleton'),Vector2(0,0),function(s) ok=s end),'raise refused')
 local list=UndeadSystem:ListOf(player)
 return list[#list],ok
end
local function tally(kind)
 local c={}
 for _,r in ipairs(UndeadSystem:ListOf(player)) do if r.kind==kind then c[r.form or '']=(c[r.form or ''] or 0)+1 end end
 return c
end
hopeCase('H0 parse/encode',function()
 local t=UndeadSystem:EncodeHope(UndeadSystem:ParseHope('s:d:shield=2,bogus=3,twin=1/x:y/m:a:aura=1'))
 assert(t=='s:d:shield=2,twin=1/m:a:aura=1',t)
 assert(UndeadSystem:EncodeHope(UndeadSystem:ParseHope(''))=='','old save stays empty')
 local h=UndeadSystem:ParseHope('s:d:/m:d:hex=0')
 assert(h.skeleton.direct and next(h.skeleton.want)==nil and h.mage.direct and h.mage.want.hex==0,'explicit zero kept')
end)
hopeCase('H1 auto = pinned rule (3000 random states)',function()
 local seed=12345
 local function rnd(n) seed=(seed*1103515245+12345)%2147483648 return seed%n end
 for i=1,3000 do
  local kind=(i%2==0) and 'mage' or 'skeleton'
  local forms={''}
  for _,f in ipairs(UndeadSystem:FormOrder(kind)) do table.insert(forms,f) end
  local quota={}
  for _,f in ipairs(UndeadSystem:FormOrder(kind)) do quota[f]=rnd(4) end
  local max=1+rnd(8)
  local list={}
  for j=1,rnd(10) do table.insert(list,rec(kind,forms[1+rnd(#forms)],{giant=(kind=='skeleton' and j==1 and rnd(4)==0) or nil})) end
  local reserved=kind=='skeleton' and rnd(5) or 0
  local hope=(i%3==0) and {direct=false,want={shield=rnd(3),aura=rnd(3)}} or {direct=false,want={}}
  local plan=UndeadSystem:PlanNext(kind,max,quota,hope,list,reserved)
  local f,v=legacyPlan(kind,max,quota,list,reserved)
  assert(plan.form==f and #plan.victims==#v,'auto parity #'..i..' '..plan.form..' vs '..f)
  for k=1,#v do assert(plan.victims[k]==v[k],'auto victim #'..i) end
  assert(not plan.direct and not plan.clipped)
 end
end)
-- H2 직접 편성: 정원 4 · 희망 방패1 쌍칼2 대검0 → 30번 일으키는 동안 매번 미리보기 = 실제, 끝 편성 = 희망 (일반 1)
book.Levels={raise_skeleton=6,skel_shield=3,skel_greatsword=3,skel_twin=3}
book.FormHope='s:d:shield=1,greatsword=0,twin=2'
setList({})
for i=1,30 do check('H2 direct sequence #'..i,'skeleton') end
hopeCase('H2 direct converges to hope',function()
 local c=tally('skeleton')
 assert(c.shield==1 and c.twin==2 and (c.greatsword or 0)==0 and c['']==1,'tally shield='..tostring(c.shield)..' twin='..tostring(c.twin)..' normal='..tostring(c['']))
 assert(string.find(book:RosterLine('raise_skeleton'),'직접 편성 4/4',1,true),book:RosterLine('raise_skeleton'))
end)
sameSteady('H2 direct steady = repeated raise','skeleton')
-- H3 희망 수와 세기 분리 (B-R01): 강화 3랭크 · 희망 1 → 방패 방어·쌍칼 속도·저주 세기는 3랭크 그대로
hopeCase('H3 power stays node rank',function()
 book.Levels={raise_skeleton=6,skel_shield=3,skel_twin=3}
 book.FormHope='s:d:shield=1,twin=1'
 setList({})
 local a=raiseOnce('skeleton')
 assert(a.form=='shield' and a.guard==15+5*3 and a.taunt==true,'shield guard '..tostring(a.guard))
 local b=raiseOnce('skeleton')
 assert(b.form=='twin' and math.abs(b.cooldown-_GameData.skeletonCooldown/(1.2+0.1*3))<1e-9,'twin cd '..tostring(b.cooldown))
 book.FormHope=''
 setList({})
 local auto=raiseOnce('skeleton')
 assert(auto.form=='shield' and auto.guard==a.guard,'auto guard '..tostring(auto.guard))
 setList({a,b})
 book.FormHope='s:d:shield=0,twin=0'
 local p=UndeadSystem:RosterPreview(player,'skeleton')
 assert(p.nextForm=='' and a.guard==30 and a.form=='shield' and UndeadSystem:ListOf(player)[1]==a,'existing unit changed')
 local c=raiseOnce('skeleton')
 assert(c.form=='' and a.guard==30 and #UndeadSystem:ListOf(player)==3,'next only')
 book.Levels={raise_mage=6,mage_hex=3,mage_twin=2}
 book.FormHope='m:d:hex=1,twin=0'
 setList({})
 local m=raiseOnce('mage')
 assert(m.form=='hex' and m.hex==4+4*3,'mage hex '..tostring(m.hex))
 local m2=raiseOnce('mage')
 assert(m2.form=='','mage twin hope 0 → normal')
end)
-- H4 장비로 정원이 줄어도 희망 수는 그대로 · 표시만 잘림 (B-R02)
hopeCase('H4 gear cap shrink keeps wishes',function()
 book.Levels={raise_skeleton=3,skel_shield=2,skel_twin=2}
 book.FormHope='s:d:shield=2,twin=1'
 setList({rec('skeleton','shield'),rec('skeleton','twin')})
 local before=book.FormHope
 local p=UndeadSystem:RosterPreview(player,'skeleton')
 assert(p.max==3 and not p.clipped and p.nextForm=='shield',p.nextForm)
 bonus=-2
 local q=UndeadSystem:RosterPreview(player,'skeleton')
 assert(q.max==1 and q.clipped and q.cut.shield==1 and q.cut.twin==1,'clip')
 assert(book.FormHope==before,'wish overwritten')
 assert(string.find(book:RosterLine('raise_skeleton'),'희망 중 2기는 정원·랭크를 넘어 일반형으로 섭니다',1,true),book:RosterLine('raise_skeleton'))
 check('H4 lowered cap direct','skeleton',{max=1,full=true,replaces=2})
 bonus=0
 local r=UndeadSystem:RosterPreview(player,'skeleton')
 assert(r.max==3 and not r.clipped and book.FormHope==before,'restore')
end)
-- H5 저장: 옛 저장 = 자동·끔 · 왕복 보존 · 모르는 형식 버림
hopeCase('H5 save round trip',function()
 local keepSan,keepDig,keepMig=book.SanitizeSlots,book.RefreshDigest,book.MigrateLevels
 book.SanitizeSlots=function() end
 book.RefreshDigest=function() end
 book.MigrateLevels=function() end
 book.Levels={raise_skeleton=3}
 book.FormHope='s:d:shield=1/m:a:hex=2'
 book.ShardHold=true
 local d=book:GetSaveData()
 assert(d.hope=='s:d:shield=1/m:a:hex=2' and d.shardHold==true and d.sv==4,'save fields')
 book.FormHope='x'
 book.ShardHold=false
 book:LoadSaveData(d)
 assert(book.FormHope=='s:d:shield=1/m:a:hex=2' and book.ShardHold==true,'restore')
 book:LoadSaveData({levelCount=1,levels={raise_skeleton=3},slots=',,,',right='',sv=4})
 assert(book.FormHope=='' and book.ShardHold==false,'old save → auto/off')
 local d2=book:GetSaveData()
 assert(d2.hope==nil and d2.shardHold==nil,'default writes no new fields')
 book:LoadSaveData({levelCount=0,sv=4,hope='s:q:junk/m:d:aura=9,zzz=1'})
 assert(book.FormHope=='m:d:aura=9','sanitize '..book.FormHope)
 book.SanitizeSlots=keepSan
 book.RefreshDigest=keepDig
 book.MigrateLevels=keepMig
 book.FormHope=''
 book.ShardHold=false
end)
-- H6 서버 요청 검사: 주인만 · 아는 종류·변이 · ±1 · 0~배운 랭크 · 합은 정원 안 · 자동이면 자동 모습에서 직접으로
hopeCase('H6 request validation',function()
 book.Levels={raise_skeleton=3,skel_shield=2,skel_greatsword=1,skel_twin=1}
 book.FormHope=''
 setList({})
 local auto=book:AutoHope('skeleton')
 local sum=0
 for _,n in pairs(auto) do sum=sum+n end
 assert(sum<=3,'seed within cap')
 book:RequestFormMode('skeleton',true)
 local h=UndeadSystem:ParseHope(book.FormHope).skeleton
 assert(h.direct and h.want.shield==auto.shield and h.want.twin==auto.twin,'seeded '..book.FormHope)
 book:RequestFormMode('skeleton',false)
 local back=UndeadSystem:ParseHope(book.FormHope).skeleton
 assert(back.direct==false and back.want.shield==auto.shield,'auto keeps wishes')
 book.FormHope='s:d:shield=2,greatsword=0,twin=0'
 notices={}
 book:RequestFormHope('skeleton','shield',1)
 assert(book.FormHope=='s:d:shield=2,greatsword=0,twin=0' and #notices==1 and string.find(notices[1],'배운 강화 랭크(2)',1,true),'rank cap')
 book:RequestFormHope('skeleton','greatsword',1)
 assert(book.FormHope=='s:d:shield=2,greatsword=1,twin=0','gs +1 '..book.FormHope)
 notices={}
 book:RequestFormHope('skeleton','twin',1)
 assert(book.FormHope=='s:d:shield=2,greatsword=1,twin=0' and string.find(notices[1] or '','정원 3기가 찼습니다',1,true),'sum cap')
 book:RequestFormHope('skeleton','twin',-1)
 assert(book.FormHope=='s:d:shield=2,greatsword=1,twin=0','minus at 0')
 book:RequestFormHope('skeleton','shield',-1)
 assert(book.FormHope=='s:d:shield=1,greatsword=1,twin=0','minus')
 book:RequestFormHope('skeleton','aura',1)
 book:RequestFormHope('revive','shield',1)
 book:RequestFormHope('skeleton','twin',2)
 assert(book.FormHope=='s:d:shield=1,greatsword=1,twin=0','invalid ignored')
 senderUserId='intruder'
 book:RequestFormHope('skeleton','twin',1)
 book:RequestFormMode('skeleton',false)
 book:RequestShardHold(true)
 senderUserId='u1'
 assert(book.FormHope=='s:d:shield=1,greatsword=1,twin=0' and book.ShardHold==false,'foreign sender')
 book.Levels={raise_skeleton=3,skel_shield=1}
 book.FormHope='s:d:shield=3,greatsword=0,twin=0'
 assert(UndeadSystem:RosterPreview(player,'skeleton').cut.shield==2)
 book:RequestFormHope('skeleton','shield',-1)
 assert(book.FormHope=='s:d:shield=0,greatsword=0,twin=0',book.FormHope)
 local owned=UndeadSystem.Owned.u1 or {}
 assert(#owned==0,'requests touched units')
end)
-- H7 거인 유지 + 직접 편성: 몸 보호·예약 4 · 미리보기 = 실제
book.Levels={raise_skeleton=12,skel_shield=3,skel_greatsword=3,skel_twin=1}
do
 local gh=rec('skeleton','shield',{giant=true})
 setList({gh,rec('skeleton',''),rec('skeleton','twin')})
 UndeadSystem.Giants={u1={host=gh,mates={rec('skeleton',''),rec('skeleton',''),rec('skeleton',''),rec('skeleton','')},epoch=1}}
 book.FormHope='s:d:shield=0,greatsword=1,twin=1'
 for i=1,6 do check('H7 giant direct #'..i,'skeleton',{reserved=4}) end
 assert(UndeadSystem:ListOf(player)[1]==gh,'giant host trimmed')
 UndeadSystem.Giants={}
end
-- H8 생성 대기 중 계획이 바뀌면 (B-DRAFT-01) 확정 전에 거절: 혼·마나 소비 0 · 옛 개체 그대로 · 이후 미리보기는 새 계획 / 대조군: 그대로면 계획대로 확정
hopeCase('H8 async plan revalidation',function()
 local realSpawn=UndeadSystem.SpawnUnit
 local pending=nil
 UndeadSystem.SpawnUnit=function(_,_,r,_,onReady) r.entity=nil pending=onReady return true end
 book.Levels={raise_skeleton=3,skel_shield=1}
 book.FormHope='s:d:shield=1'
 -- 대조군: 목록 그대로 → 방패 A 교체 · 새 방패
 local A,B,C=rec('skeleton','shield'),rec('skeleton',''),rec('skeleton','')
 setList({A,B,C})
 local consumed=0
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() consumed=consumed+1 end}
 local done=nil
 assert(UndeadSystem:Raise(player,'skeleton',3,Vector2(0,0),function(s) done=s end))
 pending()
 local list=UndeadSystem:ListOf(player)
 assert(done==true and consumed==1 and #list==3 and list[1]==B and list[3].form=='shield','control commit')
 -- B-DRAFT-01: 같은 준비에서 생성 대기 중 C가 죽는다 → 거절
 A,B,C=rec('skeleton','shield'),rec('skeleton',''),rec('skeleton','')
 setList({A,B,C})
 consumed=0
 done=nil
 notices={}
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() consumed=consumed+1 end}
 assert(UndeadSystem:Raise(player,'skeleton',3,Vector2(0,0),function(s) done=s end))
 UndeadSystem:RemoveRec(UndeadSystem:ListOf(player),C)
 pending()
 list=UndeadSystem:ListOf(player)
 assert(done==false and consumed==0 and orb.Reserved==false,'stale plan consumed soul')
 assert(#list==2 and list[1]==A and list[2]==B and A.form=='shield','old units changed')
 assert(UndeadSystem:RosterPreview(player,'skeleton').nextForm=='','preview after reject')
 -- 희망 편성이 바뀐 경우도 같은 거절 (형태가 달라짐)
 setList({rec('skeleton',''),rec('skeleton','')})
 consumed=0
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() consumed=consumed+1 end}
 assert(UndeadSystem:Raise(player,'skeleton',3,Vector2(0,0),nil))
 book.FormHope='s:d:shield=0'
 pending()
 assert(consumed==0 and #UndeadSystem:ListOf(player)==2,'hope change during spawn')
 -- canCommit false (마나 부족 등) → 소비 0
 book.FormHope='s:d:shield=1'
 orb={Entity={CurrentMap=map},Rank='normal',Reserved=false,Consume=function() consumed=consumed+1 end}
 assert(UndeadSystem:Raise(player,'skeleton',3,Vector2(0,0),nil,function() return false end))
 pending()
 assert(consumed==0 and #UndeadSystem:ListOf(player)==2 and orb.Reserved==false,'canCommit false consumed')
 UndeadSystem.SpawnUnit=realSpawn
end)
-- H9 희망 0 = 명시한 일반형 · 「0기」 경고 대신 직접 편성 안내
hopeCase('H9 explicit zero',function()
 book.Levels={raise_skeleton=6,skel_shield=3,skel_greatsword=3,skel_twin=3}
 book.FormHope='s:d:shield=0,greatsword=0,twin=0'
 setList({})
 for _=1,8 do
  local r=raiseOnce('skeleton')
  assert(r.form=='','zero hope raised '..tostring(r.form))
 end
 local hint=book:UseHint('skel_shield')
 assert(string.find(hint,'직접 편성 희망 0기',1,true) and not string.find(hint,'정원',1,true),hint)
 assert(#UndeadSystem:RosterPreview(player,'skeleton').idle==0,'zero hope is not idle warning')
 assert(string.sub(book:RosterLine('raise_skeleton'),1,13)=='직접 편성',book:RosterLine('raise_skeleton'))
end)
-- H10 전사·마법사 따로: 전사 직접이어도 마법사는 자동 규칙 그대로
hopeCase('H10 kinds independent',function()
 book.Levels={raise_skeleton=3,skel_shield=2,raise_mage=2,mage_aura=1,mage_hex=1,mage_twin=1}
 book.FormHope='s:d:shield=0'
 setList({rec('mage','aura'),rec('mage','hex')})
 local p=UndeadSystem:RosterPreview(player,'mage')
 local f=legacyPlan('mage',p.max,p.quota,UndeadSystem:ListOf(player),0)
 assert(not p.direct and p.nextForm==f and f=='twin','mage auto '..p.nextForm)
 assert(UndeadSystem:RosterPreview(player,'skeleton').direct)
end)
book.FormHope=''
-- ───────── 46-1 거인 고르기 (기획서 46 §2-7 · §10-1) ─────────
do
 local G=0
 local function key(s) local k,f=string.match(s,'^(%a+):?(%a*)$') return k,f end
 local function roster(spec)   -- 'basic,greatsword,shield,mage:hex,mage' → EncodeRoster 모양 기록 (오래된 순)
  local out={}
  for item in string.gmatch(spec,'[^,]+') do
   if item=='basic' then table.insert(out,{kind='skeleton',form=''})
   elseif string.sub(item,1,4)=='mage' then table.insert(out,{kind='mage',form=string.match(item,'^mage:?(%a*)$') or ''})
   else table.insert(out,{kind='skeleton',form=item}) end
  end
  return out
 end
 local function plan(spec,banner) return UndeadSystem:GiantPlan(roster(spec),banner or '') end
 local cases={
  {'basic,greatsword,shield,mage,mage:aura','shield','mage','2가 유일 최다 (사용자 예시 · 마법사 변이도 mage)'},
  {'greatsword,greatsword,greatsword,mage,mage','mage','greatsword','분명한 최다는 깃발 무시'},
  {'shield,shield,greatsword,greatsword,twin','','shield','동률 → fallback 첫째'},
  {'shield,shield,greatsword,greatsword,twin','greatsword','greatsword','깃발이 동률 안'},
  {'shield,shield,greatsword,greatsword,twin','twin','shield','깃발이 동률 밖 → fallback'},
  {'basic,basic,mage,mage:hex,twin','','mage','fallback에서 마법사가 기본보다 앞'},
  {'basic,shield,greatsword,twin,mage','basic','basic','다섯 모두 동률 · 깃발 안'},
  {'greatsword,greatsword,greatsword,shield,mage,mage,mage,mage,mage,basic','mage','greatsword','투표는 참여 다섯만 · 무리 전체는 보지 않음'},
 }
 for i,c in ipairs(cases) do
  G=G+1
  local p=plan(c[1],c[2])
  assert(p~=nil and p.type==c[3],'giant case '..i..' ('..c[4]..'): got '..tostring(p and p.type))
  assert(#p.picks==5,'picks')
 end
 -- 동률·깃발 표시
 assert(plan('shield,shield,greatsword,greatsword,twin','greatsword').tie and plan('shield,shield,greatsword,greatsword,twin','greatsword').bannerUsed,'tie/banner flags')
 assert(not plan('greatsword,greatsword,greatsword,mage,mage','mage').tie,'clear winner is not tie')
 -- 4기 · 거인 몸·합쳐짐·아직 못 바침은 후보가 아니다 · 일시 소환(되살림)은 기록 모양에 없다
 G=G+1
 assert(plan('shield,shield,twin,basic')==nil,'4 units must not plan')
 local r=roster('twin,shield,shield,basic,basic,greatsword')
 r[1].giant=true
 local p=UndeadSystem:GiantPlan(r,'')
 assert(p.type=='shield' and p.picks[1]==r[2],'giant host skipped, order kept')
 r[2].notReady=true
 r[3].merged=true
 assert(UndeadSystem:GiantPlan(r,'')==nil and UndeadSystem:GiantPoolCount(r)==3,'not ready/merged skipped')
 -- 마법사만 다섯 → 마법사 거인
 G=G+1
 assert(plan('mage:aura,mage:hex,mage:twin,mage:pierce,mage:blast').type=='mage','mage only')
 -- 생명만 바뀌면 계획 불변 · 서버(실제 기록 → RosterView) = 클라이언트(동기화 문자열) type·picks·counts
 G=G+1
 local hpOf={}
 local function unitRec(kind,form)
  local rr=rec(kind,form)
  local u={Dead=false,Hp=50,MaxHp=100,Bombing=false,Giant=false}
  hpOf[rr.id]=u
  rr.entity={GetComponent=function() return u end}
  return rr
 end
 local live={unitRec('skeleton','greatsword'),unitRec('mage','hex'),unitRec('skeleton',''),unitRec('skeleton','greatsword'),unitRec('mage',''),unitRec('skeleton','shield'),unitRec('skeleton','twin')}
 setList(live)
 UndeadSystem.Giants={}
 book.RiteBanner='mage'
 local sp=UndeadSystem:GiantPlanFor(player)
 for id,u in pairs(hpOf) do u.Hp=(tonumber(string.match(id,'%d+'))*37)%100+1 end
 local sp2=UndeadSystem:GiantPlanFor(player)
 assert(sp.type==sp2.type and UndeadSystem:GiantCountsText(sp)==UndeadSystem:GiantCountsText(sp2),'hp changed plan')
 for i=1,5 do assert(sp.picks[i].rec==sp2.picks[i].rec,'hp changed picks') end
 UndeadSystem:RefreshSummary(player)
 server=false
 local cp=UndeadSystem:GiantPlanFor(player)
 server=true
 assert(cp.type==sp.type and UndeadSystem:GiantCountsText(cp)==UndeadSystem:GiantCountsText(sp) and cp.tie==sp.tie,'client plan '..cp.type..' '..UndeadSystem:GiantCountsText(cp)..' vs server '..sp.type..' '..UndeadSystem:GiantCountsText(sp))
 for i=1,5 do assert(UndeadSystem:GiantKey(cp.picks[i])==UndeadSystem:GiantKey(sp.picks[i]),'pick '..i..' key differs') end
 -- 참여 다섯 = 대검 2 · 마법사 2 · 기본 1 (뒤의 방패·쌍칼은 참여 밖) · 깃발 마법사가 동률 안 → 마법사
 assert(sp.type=='mage' and sp.tie and sp.bannerUsed and sp.counts.greatsword==2 and sp.counts.mage==2 and sp.counts.basic==1,'tie greatsword2 mage2 + banner mage got '..sp.type)
 book.RiteBanner=''
 -- 아직 못 바침(엔티티 없음)은 「?」로 클라이언트도 같이 거른다
 G=G+1
 live[1].entity=nil
 UndeadSystem:RefreshSummary(player)
 assert(string.find(cmd.UndeadRoster,'s:greatsword?',1,true)==1,'notReady sync '..cmd.UndeadRoster)
 local s3=UndeadSystem:GiantPlanFor(player)
 server=false
 local c3=UndeadSystem:GiantPlanFor(player)
 server=true
 assert(s3.picks[1].rec==live[2] and c3.type==s3.type and UndeadSystem:GiantCountsText(c3)==UndeadSystem:GiantCountsText(s3),'notReady parity')
 -- 5기 단계: 거인이 서 있으면 3으로 내린다 · 재료 = 전사 + 마법사
 G=G+1
 live[1].entity={GetComponent=function() return hpOf[live[1].id] end}
 stats.MaxDifficulty=1;stats.Mana=999
 book.Levels={bone_rite=5,raise_skeleton=12,raise_mage=6}
 book.ReadyAt={}
 assert(book:RiteUnits5()==7,'units5 '..book:RiteUnits5())
 assert(book:RiteBestStage(5,-1)==5,'stage 5 available')
 UndeadSystem.Giants={u1={host=live[7],mates={},epoch=9,kind='twin'}}
 assert(book:GiantStanding() and book:RiteBestStage(5,-1)==3,'giant standing must drop to 3, got '..book:RiteBestStage(5,-1))
 UndeadSystem:RefreshSummary(player)
 server=false;book.IsServer=function() return false end
 local oldCd=book.CooldownLeft
 book.CooldownLeft=function() return 0 end
 assert(cmd.GiantKind=='twin' and book:GiantStanding(),'client giant kind '..tostring(cmd.GiantKind))
 book.CooldownLeft=oldCd
 server=true;book.IsServer=function() return true end
 UndeadSystem.Giants={}
 UndeadSystem:RefreshSummary(player)
 assert(cmd.GiantKind=='','giant kind cleared')
 -- 깃발 요청 검사 · 저장 왕복
 G=G+1
 senderUserId='u1'
 book:RequestRiteBanner('greatsword');assert(book.RiteBanner=='greatsword')
 book:RequestRiteBanner('bogus');assert(book.RiteBanner=='greatsword','unknown kind ignored')
 senderUserId='intruder';book:RequestRiteBanner('mage');senderUserId='u1'
 assert(book.RiteBanner=='greatsword','foreign sender')
 book:RequestRiteBanner('');assert(book.RiteBanner=='','clear')
 total=total+G;passed=passed+G
 print('[quality/roster] 46-1 giant plan: §10-1 8 cases, tie/banner, 4 units, skip !/~/?, mage only, hp-invariant, server == client (type/picks/counts), stage 5 units=skel+mage, giant standing → 3, banner request')
end
print(string.format('[quality/roster] I03 step2 hope: parse/encode, auto=pinned rule x3000, direct 30-raise sequence + convergence + steady, power=node rank, gear cap clip keeps wishes, save round trip/old save, request validation, giant+direct, async plan revalidation (B-DRAFT-01), explicit zero, kinds independent'))
print(string.format('[quality/roster] preview == live raise %d/%d (states: plain, full 3 forms, starved form + legion, giant reserve, temp summons, mage 5 forms, lowered cap, quest slot, mage boundary, 20-raise sequence, steady combos, giant-held 0기 vs split, first lookup keeps Owned, encode)',passed,total))
