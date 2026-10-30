-- 48-5 거인 기술 개편 · 48-6 거인 모션 (기획서 48 §4 · §6 · 리뷰 결정 Q4·Q7·Q1 · 메테오 반경 2.0 상한 정정): 실제 본문
--   RiteGiantMoves(Tick·FireS1·FireS2·NovaWave·FireRift·FireDash·FireMeteor·Roar) · ShadowUnit(TauntTick·GiantPlay·GiantMotionKey)로
--   ① 기본 거인 기술 0 · 도발 없음 ② 마법사 노바 = 저절로(둘레 적 2 이상) · 반경 2.5 얇은 고리 · 한 적 한 번 ③ 기도 메테오 = 명령만 · 영창 1초 제자리 · 반경 1.8
--   ④ 큰 메테오 3랭크 = 반경 2.0 상한(타격·효과 모두) · 영창 0.7 ⑤ 대검 회전 반경 1.6 · 4번 · 이동 ×0.6 ⑥ 땅 가르기 4토막 · 한 적 한 번
--   ⑦ 방패 도발 함성 = 몸 동작 없음 ⑧ 모션: 공격 중 맞음 생략 · 0.5초 한 번 · 기술 동작 반복(GiantHoldUntil) · skill1/skill2 → 없으면 skill · 쌍칼 연속 베기 = 평타 그림
--   ⑨ 거인 물러서기 없음 · GiantImprint 기본 true
-- 표 값: data/rite_giants.csv의 48 요청 줄(C 담당 · results csv_requests)을 아래에서 덮어 쓴다 — C가 반영하면 같은 값
-- @source GameData Data/GameData.mlua Ensure,GetGiant
-- @source RiteGiantMoves Undead/RiteGiantMoves.mlua StateOf,Clear,GiantImprint,NodeOf,Opt,HasMoves,Tick,S1Radius,MeteorRadius,MeteorChant,Hold,FireS1,NovaWave,MageResist,OnFocus,ValidTarget,InReach,FireS2,FireRift,FireDash,FireMeteor,Roar,HitOne,HitArea,LineMonsters,HitLine,RiftFx,Fx,LogCast,LogSkill,LogS2
-- @source ShadowUnit Shadow/ShadowUnit.mlua TauntTick,GiantPlay,GiantMotionKey
_GameData:Ensure()
local G=_GameData.RiteGiants
-- 갈래 C(e9639aae) rite_giants.csv 줄과 같은 값 (C 반영 전 판에서도 같은 조건으로 돌게)
G.basic.s1='' G.basic.s1Name='' G.basic.s1Mul=0 G.basic.s1Cd=0 G.basic.s1Radius=0 G.basic.s1Opts={} G.basic.s2='' G.basic.s2Name='' G.basic.s2Mul=0 G.basic.s2Cd=0 G.basic.s2Shape='' G.basic.s2Reach=0 G.basic.s2Opts={} G.basic.tauntSec=0 G.basic.tauntRadius=0
G.greatsword.s1Radius=1.6 G.greatsword.s1Mul=0.5
G.mage.s1='nova' G.mage.s1Name='화염 노바' G.mage.s1Mul=1 G.mage.s1Cd=8 G.mage.s1Radius=2.5 G.mage.s1Opts={min=2,chant=0.3,grow=0.5,inner=0.5,ring=0.4}
G.mage.s2='meteor' G.mage.s2Name='기도 메테오' G.mage.s2Mul=3 G.mage.s2Cd=12 G.mage.s2Shape='single' G.mage.s2Reach=6 G.mage.s2Opts={radius=1.8,radiusMax=2,chant=1,fall=0.5,scorch=1.5}
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b) return math.abs(a-b)<1e-6 end
Environment={IsPublishedPlay=function() return false end}
_UtilLogic={ElapsedSeconds=0,ServerElapsedSeconds=0}
local V={} V.__index=V
V.__add=function(a,b) return setmetatable({x=a.x+b.x,y=a.y+b.y},V) end
V.__sub=function(a,b) return setmetatable({x=a.x-b.x,y=a.y-b.y},V) end
V.__mul=function(a,b) if type(a)=='number' then a,b=b,a end return setmetatable({x=a.x*b,y=a.y*b},V) end
function V:Magnitude() return math.sqrt(self.x*self.x+self.y*self.y) end
function V:Normalize() local m=self:Magnitude() return setmetatable({x=self.x/m,y=self.y/m},V) end
function V:Dot(o) return self.x*o.x+self.y*o.y end
function Vector2(x,y) return setmetatable({x=x,y=y},V) end
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function isvalid(x) return x~=nil and x~=false and x.dead~=true end
local logs={}
function log(s) table.insert(logs,s) end
-- 타이머: 시각 순서대로
local timers={}
_TimerService={SetTimerOnce=function(_,fn,delay) table.insert(timers,{at=_UtilLogic.ElapsedSeconds+delay,fn=fn}) return #timers end}
local function advance(sec)
 local stop=_UtilLogic.ElapsedSeconds+sec
 while true do
  local best,bi=nil,nil
  for i,t in ipairs(timers) do if t.at<=stop+1e-9 and (best==nil or t.at<best.at) then best,bi=t,i end end
  if best==nil then break end
  table.remove(timers,bi)
  _UtilLogic.ElapsedSeconds=math.max(_UtilLogic.ElapsedSeconds,best.at)
  _UtilLogic.ServerElapsedSeconds=_UtilLogic.ElapsedSeconds
  best.fn()
 end
 _UtilLogic.ElapsedSeconds=stop _UtilLogic.ServerElapsedSeconds=stop
end
local mons={}
local function monster(name,x,y)
 local m={Name=name,IsDead=false,Hp=100,Grade=1,dead=false}
 m.Entity={Id=name,Name=name,pos=Vector2(x,y or 0),GetComponent=function(_,k) if k=='script.Monster' then return m end if k=='script.MonsterAttack' then return {TauntBy=function() m.taunted=true end} end end}
 m.st={ApplyRoot=function() end,Stagger=function() end,ApplyChill=function() end,ApplyCurseFrom=function(_,k,v,s) m.resist=v end}
 function m:Status() return self.st end
 table.insert(mons,m)
 return m
end
_Util={IsAlive=function() return true end,Pos2=function(_,e) return e.pos end,
 MonstersNear=function(_,map,c,r) local out={} for _,m in ipairs(mons) do if not m.IsDead and (m.Entity.pos-c):Magnitude()<=r+1e-9 then table.insert(out,m) end end return out end}
local hitsLog,fxLog={},{}
local function resetLogs() hitsLog={} fxLog={} logs={} end
local owner={Name='owner',pos=Vector2(0,0)}
local nodes={}
owner.GetComponent=function(_,k)
 if k=='script.PlayerAttack' then return {SkillHitOne=function(_,t,info,dmg) table.insert(hitsLog,{t=t.Name,info=info,dmg=dmg,at=_UtilLogic.ElapsedSeconds}) end} end
 if k=='script.SkillEffects' then return {GiantMoveFx=function(_,kind,pos,w,h,a,sec) table.insert(fxLog,{kind=kind,w=w,h=h,sec=sec,at=_UtilLogic.ElapsedSeconds}) end} end
 if k=='script.SkillBook' then return {Node=function(_,id) return nodes[id] or 0 end} end
end
local plays={}
local function giant(kind,atk)
 local u={Giant=true,Dead=false,GiantKind=kind,Atk=atk,OwnerPlayer=owner,AttackRange=kind=='mage' and 4.5 or 1.2,OwnerCombatRange=7,FocusExtraRange=2,FocusUntil=0,Target=nil,
  AttackTimer=0,GiantCastUntil=0,GiantSlowUntil=0,GiantGuardUntil=0,
  Entity={Id='g_'..kind,pos=Vector2(0,0),Name='giant',CurrentMap='map',MovementComponent={SetWorldPosition=function(_,p) end}}}
 function u:IsLiveTarget(e) return e~=nil and e.dead~=true end
 function u:IsOwnerCombatTarget(e,range) return (e.pos-owner.pos):Magnitude()<=range end
 function u:GiantPlay(state,hold) table.insert(plays,{state=state,hold=hold}) end
 function u:SwingFx() end
 return u
end
local function cast(name) local n=0 for _,l in ipairs(logs) do if l:find('giant skill cast',1,true) and l:find('name='..name..' ',1,true) then n=n+1 end end return n end
local function hitNames(info) local t={} for _,h in ipairs(hitsLog) do if h.info==info then t[h.t]=(t[h.t] or 0)+1 end end return t end
local function tick(u,sec) for _=1,math.floor(sec/0.0667+0.5) do advance(0.0667) RiteGiantMoves:Tick(u,0.0667) end end
local function clearMons() mons={} end

-- ① 기본 거인: 기술 0 · 명령 none
do
 clearMons() resetLogs() plays={}
 local u=giant('basic',110)
 local m=monster('m',1) u.Target=m.Entity
 tick(u,25)
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6 RiteGiantMoves:OnFocus(u,m.Entity)
 ok(#hitsLog==0 and #fxLog==0 and #plays==0,'기본 거인: 기술 판정·효과·동작 0')
 ok(logs[#logs]:find('reason=none',1,true)~=nil,'기본 거인 명령 → reason=none')
 RiteGiantMoves:Clear(u)
end
-- ② 마법사 노바 = 저절로 · 둘레 적 2 이상 · 반경 2.5 얇은 고리 · 한 적 한 번
do
 clearMons() resetLogs() plays={}
 local u=giant('mage',100)
 monster('a',0.4)
 tick(u,10)
 ok(cast('nova')==0,'둘레 적 1 → 노바 안 나감')
 monster('b',1.5) monster('c',-2.4) monster('far',2.7)
 tick(u,7)
 ok(cast('nova')==1,'둘레 적 2 이상 → 노바 저절로 '..cast('nova'))
 local h=hitNames('skill.giant_nova')
 ok(h.a==1 and h.b==1 and h.c==1 and h.far==nil,'고리가 2.5 안 적 한 번씩 · 2.7 밖 없음')
 local nfx=nil for _,f in ipairs(fxLog) do if f.kind=='nova' then nfx=f end end
 ok(nfx~=nil and near(nfx.w,5) and near(nfx.sec,0.5),'노바 효과 지름 5(반경 2.5) · 0.5초에 퍼짐 (채워진 면 아님: kind nova = 얇은 고리)')
 local p=plays[#plays]
 ok(p.state=='skill1' and near(p.hold,0.8),'노바 동작 skill1 · 영창 0.3 + 퍼짐 0.5')
 ok(cast('meteor')==0,'명령 없으면 메테오 0 (메테오는 스킬 2 명령만)')
 local dmg=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' then dmg=x.dmg end end
 ok(near(dmg,100/0.8*1),'노바 ×1.0 (다섯 공격 합 기준)')
 RiteGiantMoves:Clear(u)
end
-- ③ 기도 메테오 = 명령 · 영창 1초 제자리 · 반경 1.8
do
 clearMons() resetLogs() plays={} nodes={}
 local u=giant('mage',100)
 local t=monster('t',3) local edge=monster('edge',3+1.75) local out=monster('out',3+1.9)
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6
 RiteGiantMoves:OnFocus(u,t.Entity)
 ok(cast('meteor')==1,'명령 → 메테오')
 ok(near(u.GiantCastUntil-_UtilLogic.ElapsedSeconds,1.0),'영창 1.0초 동안 제자리 (GiantCastUntil)')
 ok(plays[#plays].state=='skill2' and near(plays[#plays].hold,1.0),'기도 동작 skill2 · 1초 반복')
 advance(1.4)
 ok(next(hitNames('skill.giant_meteor'))==nil,'착지 전(1.4초) 피해 없음')
 advance(0.2)
 local h=hitNames('skill.giant_meteor')
 ok(h.t==1 and h.edge==1 and h.out==nil,'착지 반경 1.8: 1.75 맞음 · 1.9 안 맞음')
 local w,l=nil,nil for _,f in ipairs(fxLog) do if f.kind=='warn_fire' then w=f end if f.kind=='meteor_land' then l=f end end
 ok(w~=nil and near(w.w,3.6) and l~=nil and near(l.w,3.6),'예고·착지 효과 지름 3.6')
 local d=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_meteor' then d=x.dmg end end
 ok(near(d,100/0.8*3),'메테오 ×3.0')
 RiteGiantMoves:Clear(u)
end
-- ④ 큰 메테오 3랭크: 반경 2.0 상한(타격·효과) · 영창 0.7
do
 clearMons() resetLogs() plays={} nodes={giant_mage_meteor=3}
 local u=giant('mage',100)
 local t=monster('t',3) local a=monster('a',3+1.95) local b=monster('b',3-2.1)
 ok(near(RiteGiantMoves:MeteorRadius(u,G.mage),2.0),'반경 1.8+0.45=2.25 → 2.0 상한')
 ok(near(RiteGiantMoves:MeteorChant(u,G.mage),0.7),'영창 감소는 보존 (0.7초)')
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6
 RiteGiantMoves:OnFocus(u,t.Entity)
 advance(1.3)
 local h=hitNames('skill.giant_meteor')
 ok(h.t==1 and h.a==1 and h.b==nil,'타격 반경 2.0: 1.95 맞음 · 2.1 안 맞음')
 for _,f in ipairs(fxLog) do if f.kind=='warn_fire' or f.kind=='meteor_land' then ok(f.w<=4.0+1e-9,'효과 지름 4.0 이하 '..f.kind..' '..f.w) end end
 ok(logs[#logs]:find('radius=2.00',1,true)~=nil,'[VRF] giant skill hit radius=2.00')
 nodes={} RiteGiantMoves:Clear(u)
end
-- ⑤ 대검 회전: 반경 1.6 · 4번 · ×0.5 · 이동 ×0.6 표시
do
 clearMons() resetLogs() plays={}
 local u=giant('greatsword',120)
 local a=monster('a',1.5) local b=monster('b',1.7)
 u.Target=a.Entity
 tick(u,3.2)
 ok(cast('spin')==1,'회전 베기 저절로')
 ok(u.GiantSlowUntil>_UtilLogic.ElapsedSeconds,'도는 동안 이동 ×0.6 (GiantSlowUntil)')
 advance(2)
 local h=hitNames('skill.giant_spin')
 ok(h.a==4 and h.b==nil,'반경 1.6: 1.5 = 4번 · 1.7 = 0')
 local s1=nil for _,p in ipairs(plays) do if p.state=='skill1' then s1=p end end
 ok(s1~=nil and near(s1.hold,1.6),'회전 동작 1.6초 반복')
 local d=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_spin' then d=x.dmg end end
 ok(near(d,120/1.2*0.5),'회전 한 번 ×0.5')
 RiteGiantMoves:Clear(u)
end
-- ⑥ 땅 가르기: 꽂기 0.3초 → 4토막 · 한 적 한 번 · 6칸 끝 밖 없음
do
 clearMons() resetLogs() plays={}
 local u=giant('greatsword',120)
 local ms={monster('p1',1),monster('p2',2.6),monster('p3',4.2),monster('p4',5.8),monster('p5',6.6)}
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6
 RiteGiantMoves:OnFocus(u,ms[2].Entity)
 ok(near(u.GiantCastUntil-_UtilLogic.ElapsedSeconds,0.55),'꽂고 솟는 동안 제자리 0.55초')
 advance(0.29)
 ok(next(hitNames('skill.giant_rift'))==nil,'꽂는 0.3초 동안 피해 없음')
 advance(0.3)
 local h=hitNames('skill.giant_rift')
 ok(h.p1==1 and h.p2==1 and h.p3==1 and h.p4==1 and h.p5==nil,'4토막 · 한 적 한 번 · 6칸 밖 없음')
 local n=0 for _,f in ipairs(fxLog) do if f.kind=='rift' then n=n+1 ok(near(f.w,1.5),'토막 길이 1.5') end end
 ok(n==4,'균열 효과 4토막')
 RiteGiantMoves:Clear(u)
end
-- ⑦ 쌍칼 돌진 잔상 0.4초 · 연속 베기 동작
do
 clearMons() resetLogs() plays={}
 local u=giant('twin',100)
 local t=monster('t',3)
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6
 RiteGiantMoves:OnFocus(u,t.Entity)
 local d=nil for _,f in ipairs(fxLog) do if f.kind=='dash' then d=f end end
 ok(d~=nil and near(d.sec,0.4),'돌진 길 잔상 0.4초')
 ok(plays[#plays].state=='skill2','돌진 동작 skill2')
 RiteGiantMoves:Clear(u)
end

-- ⑧ 방패 도발 함성 = 몸 동작 없음 · 기본 거인 도발 없음 (ShadowUnit.TauntTick 본문)
local function su(kind)
 local u=setmetatable({},{__index=ShadowUnit})
 u.Giant=true u.GiantKind=kind u.Dead=false u.Taunt=true u.TauntTimer=0 u.TauntEvery=3 u.TauntRadius=3
 u.OwnerPlayer=owner u.GiantLook={} u.GiantClipUntil=0 u.AttackAnimationUntil=0 u.GiantHitAt=-99 u.GiantHoldUntil=0 u.CurrentClip=''
 u.Entity={Id='su_'..kind,Name='su',pos=Vector2(0,0),CurrentMap='map',SpriteRendererComponent={SpriteRUID='stand'}}
 u.swing=0 u.played={}
 function u:SwingFx() self.swing=self.swing+1 end
 return u
end
do
 clearMons() resetLogs() plays={}
 local m=monster('m',1)
 local s=su('shield')
 local realPlay=ShadowUnit.GiantPlay
 s.GiantPlay=function(self,st,h) table.insert(self.played,st) end
 s:TauntTick(0.1)
 ok(m.taunted==true,'방패 거인 도발 함성: 끌어당김')
 ok(#s.played==0 and s.swing==0,'도발 함성 = 몸 동작 없음 (기술 그림으로 평타를 덮지 않음)')
 local roar=false for _,f in ipairs(fxLog) do if f.kind=='roar' then roar=true end end
 ok(roar and cast('roar')==1,'머리 위 강철 고리 · [VRF] cast roar')
 m.taunted=nil
 local b=su('basic')
 b:TauntTick(0.1)
 ok(m.taunted==nil,'기본 거인 도발 없음 (옛 tauntSec이 남아 있어도)')
 ShadowUnit.GiantPlay=realPlay
end
-- ⑨ 모션: 맞음 생략 · 0.5초 한 번 · 기술 반복 · skill1/skill2 대체 · 쌍칼 = 평타 그림
do
 _UtilLogic.ElapsedSeconds=100 _UtilLogic.ServerElapsedSeconds=100
 local g=su('mage')
 g.GiantLook={form='mage',stand='S',attack='A',attackFirst='A1',attackFirstSec=0.6,skill='K',skillSec=0.6,hit='H',hitSec=0.2}
 g.AttackAnimationUntil=100.3
 g:GiantPlay('hit',0)
 ok(g.CurrentClip=='','공격 동작 중엔 맞음 그림 생략')
 g.AttackAnimationUntil=0
 g:GiantPlay('hit',0)
 ok(g.CurrentClip=='H','공격 아니면 맞음 그림')
 g.GiantClipUntil=0 g.CurrentClip=''
 _UtilLogic.ElapsedSeconds=100.3
 g:GiantPlay('hit',0)
 ok(g.CurrentClip=='','맞음은 0.5초에 한 번까지')
 g:GiantPlay('skill2',1.0)
 ok(g.CurrentClip=='K' and near(g.GiantClipUntil,101.3) and near(g.GiantHoldUntil,_UtilLogic.ServerElapsedSeconds+1.0),'skill2 그림 없으면 skill · 1초 동안 반복(GiantHoldUntil)')
 g.GiantClipUntil=0
 g:GiantPlay('skill1',0)
 ok(g.GiantHoldUntil==0,'그림 길이 안이면 반복 아님')
 g.GiantLook.skill2='M' g.GiantLook.skill2Sec=0.6
 g.GiantClipUntil=0 g:GiantPlay('skill2',1.0)
 ok(g.CurrentClip=='M','skill2 그림이 오면 그 그림 (K-4 등록 뒤)')
 local tw=su('twin') tw.GiantLook=g.GiantLook
 ok(tw:GiantMotionKey('skill1')=='attackFirst','쌍칼 연속 베기 = 평타 그림 반복 (새 몸 그림 없음)')
 local none=su('shield') none.GiantLook={}
 none:GiantPlay('skill2',1)
 ok(none.CurrentClip=='' and none.Entity.SpriteRendererComponent.SpriteRUID=='stand','그림 미등록이면 아무 일 없음 (빈 RUID 금지)')
end
-- ⑩ 정적: 거인 물러서기 없음 · 영창 중 제자리 · 회전 중 ×0.6 · 각인 기본 true
do
 local fh=io.open('RootDesk/MyDesk/Shadow/ShadowUnit.mlua') local src=fh:read('a') fh:close()
 ok(src:find('if self.Kind == "mage" and not self.Giant and toTarget:Magnitude() < safeRange',1,true)~=nil,'거인은 물러서지 않는다 (④)')
 ok(src:find('if self.Giant and _UtilLogic.ElapsedSeconds < self.GiantCastUntil then',1,true)~=nil,'영창·꽂기 중 제자리')
 ok(src:find('self.GiantSlowUntil) and 0.6 or self:TwinHuntSpeedMult())',1,true)~=nil,'회전 중 이동 ×0.6 (그 밖 = 쌍칼 사냥 배율 · 48 통합)')
 ok(src:find('self:GiantPlay("skill")',1,true)==nil,'옛 도발 기술 그림 호출 없음 (①)')
 ok(RiteGiantMoves:GiantImprint({})==true,'거인 각인 기본 = 모두 각인 (Q1)')
 local fr=io.open('RootDesk/MyDesk/Undead/RiteGiantMoves.mlua') local rg=fr:read('a') fr:close()
 for _,id in ipairs({'giant_quake','giant_basic_split','giant_basic_return','bonethrow','hexfield','"quake"'}) do ok(rg:find(id,1,true)==nil,'지운 기술·노드 참조 없음: '..id) end
end
print(string.format('[quality/giant_skills] 48-5·48-6 %d checks: basic 0 · nova auto ring 2.5 · meteor command chant 1s r1.8 · big meteor cap 2.0 · spin 1.6×4 · rift 4 pieces · dash trail · roar no body · motion hit skip/hold loop/fallback · no retreat · imprint true', checks))
