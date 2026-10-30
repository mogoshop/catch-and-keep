-- 48-5 거인 기술 개편 · 48-6 거인 모션 (기획서 48 §4 · §6 · 리뷰 결정 Q4·Q7·Q1 · 메테오 반경 2.0 상한 정정): 실제 본문
--   RiteGiantMoves(Tick·FireS1·FireS2·NovaBurst·FireRift·FireDash·FireMeteor·Roar·BodyImpactSec) · ShadowUnit(TauntTick·GiantPlay·GiantMotionKey)로
--   ① 기본 거인 기술 0 · 도발 없음 ② 마법사 노바 = 저절로(둘레 적 2 이상) · 48 연출 V2 단일 폭발 반경 3.75 · 한 적 정확히 1회 · 「폭발 증폭」 ×1.5 · 둘째 파동 0 ③ 기도 메테오 = 명령만 · 영창 1초 제자리 · 반경 1.8
--   ④ 큰 메테오 3랭크 = 반경 2.0 상한(타격·효과 모두) · 영창 0.7 ⑤ 대검 회전 반경 1.6 · 4번 · 이동 ×0.6 ⑥ 땅 가르기 4토막 · 한 적 한 번
--   ⑦ 방패 도발 함성 = 몸 동작 없음 ⑧ 모션: 공격 중 맞음 생략 · 0.5초 한 번 · 기술 동작 반복(GiantHoldUntil) · skill1/skill2 → 없으면 skill · 쌍칼 연속 베기 = 평타 그림
--   ⑨ 거인 물러서기 없음 · GiantImprint 기본 true
-- 표 값: data/rite_giants.csv의 48 요청 줄(C 담당 · results csv_requests)을 아래에서 덮어 쓴다 — C가 반영하면 같은 값
-- @source GameData Data/GameData.mlua Ensure,GetGiant,GetMonsterFrames
-- @source RiteGiantMoves Undead/RiteGiantMoves.mlua StateOf,Clear,GiantImprint,NodeOf,Opt,HasMoves,Tick,S1Radius,MeteorRadius,MeteorChant,Hold,FireS1,NovaBurst,MageResist,OnFocus,ValidTarget,InReach,FireS2,FireRift,FireDash,FireMeteor,Roar,Facing,BodyImpactSec,HitOne,HitArea,LineMonsters,HitLine,RiftFx,Fx,LogCast,LogSkill,LogS2
-- @source ShadowUnit Shadow/ShadowUnit.mlua TauntTick,GiantPlay,GiantMotionKey
_GameData:Ensure()
local G=_GameData.RiteGiants
-- 갈래 C(e9639aae) rite_giants.csv 줄과 같은 값 (C 반영 전 판에서도 같은 조건으로 돌게)
G.basic.s1='' G.basic.s1Name='' G.basic.s1Mul=0 G.basic.s1Cd=0 G.basic.s1Radius=0 G.basic.s1Opts={} G.basic.s2='' G.basic.s2Name='' G.basic.s2Mul=0 G.basic.s2Cd=0 G.basic.s2Shape='' G.basic.s2Reach=0 G.basic.s2Opts={} G.basic.tauntSec=0 G.basic.tauntRadius=0
G.greatsword.s1Radius=1.6 G.greatsword.s1Mul=0.5
-- 48 연출 V2 (갈래 C 0f72d37f rite_giants.csv): 노바 반경 3.75 · s1Opts novaAmpMul=1.5 · ring 삭제
G.mage.s1='nova' G.mage.s1Name='화염 노바' G.mage.s1Mul=1 G.mage.s1Cd=8 G.mage.s1Radius=3.75 G.mage.s1Opts={min=2,chant=0.3,grow=0.5,inner=0.5,novaAmpMul=1.5}   -- 갈래 C 0f72d37f 줄 (ring 삭제 · novaAmpMul 추가 · grow = 폭발 뒤 회복으로 읽음 · burst 없으면 0.18)
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
 m.st={ApplyRoot=function() end,Stagger=function() end,ApplyChill=function() end,ApplyCurseFrom=function(_,k,v,s) m.resist=v end,ApplyFireBreak=function(_,v,s) m.resist=v table.insert(order,'resist:'..name) end}   -- 저항 경로 증거는 giant_fire (실제 GetResist)
 function m:Status() return self.st end
 table.insert(mons,m)
 return m
end
_Util={IsAlive=function() return true end,Pos2=function(_,e) return e.pos end,
 MonstersNear=function(_,map,c,r) local out={} for _,m in ipairs(mons) do if not m.IsDead and (m.Entity.pos-c):Magnitude()<=r+1e-9 then table.insert(out,m) end end return out end}
local hitsLog,fxLog={},{}
fxRoarSeq=''
fxImpact=-1
fxSlamSeq=''
order={}   -- 맞힘·저항 순서 (노바: 맞은 뒤 원소 붕괴)
local function resetLogs() hitsLog={} fxLog={} logs={} end
local owner={Name='owner',pos=Vector2(0,0)}
local nodes={}
owner.GetComponent=function(_,k)
 if k=='script.PlayerAttack' then return {SkillHitOne=function(_,t,info,dmg) table.insert(hitsLog,{t=t.Name,info=info,dmg=dmg,at=_UtilLogic.ElapsedSeconds}) table.insert(order,'hit:'..t.Name) end} end
 if k=='script.SkillEffects' then return {FxGiantRoarSeq=fxRoarSeq,FxGiantSlamSeq=fxSlamSeq,GiantFxImpactSec=function(_,kind) if kind=='slam' then return fxSlamSeq~='' and 0.12 or -1 end return kind=='nova' and fxImpact or -1 end,
  GiantMoveFx=function(_,kind,pos,w,h,a,sec) table.insert(fxLog,{kind=kind,w=w,h=h,a=a,sec=sec,pos=pos,at=_UtilLogic.ElapsedSeconds}) end,
  GiantMoveFxOn=function(_,kind,anchor,off,facing,w,h,a,sec) table.insert(fxLog,{kind=kind,w=w,h=h,a=a,sec=sec,anchor=anchor,off=off,facing=facing,at=_UtilLogic.ElapsedSeconds}) end} end
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
-- ② 마법사 노바 (48 연출 V2) = 저절로 · 둘레 적 2 이상 · 영창 0.3 → 단일 폭발 반경 3.75 · 한 적 정확히 1회 · ×1.0 · 둘째 파동 0
local function novaFx() local t={} for _,f in ipairs(fxLog) do if f.kind=='nova' then table.insert(t,f) end end return t end
local function vrf(pat) local n,last=0,nil for _,l in ipairs(logs) do if l:find(pat,1,true) then n=n+1 last=l end end return n,last end
do
 clearMons() resetLogs() plays={} nodes={}
 local u=giant('mage',100)
 monster('a',0.4)
 tick(u,10)
 ok(cast('nova')==0,'둘레 적 1 → 노바 안 나감')
 monster('b',1.5) monster('c',-2.4) monster('edge',3.7) monster('far',3.85)
 local t0=nil
 for _=1,120 do advance(0.0667) RiteGiantMoves:Tick(u,0.0667) if cast('nova')==1 and t0==nil then t0=_UtilLogic.ElapsedSeconds end end
 ok(cast('nova')==1,'둘레 적 2 이상 → 노바 저절로 '..cast('nova'))
 local h=hitNames('skill.giant_nova')
 ok(h.a==1 and h.b==1 and h.c==1 and h.edge==1 and h.far==nil,'nova_single_hit: 반경 3.75 안 적 정확히 1회 (3.7 맞음 · 3.85 없음)')
 ok(next(hitNames('skill.giant_nova2'))==nil,'nova_no_second_wave: 둘째 파동 정보 giant_nova2 0')
 local nf=novaFx()
 ok(#nf==1 and near(nf[1].w,7.5) and near(nf[1].sec,0.18),'nova_fx_once: 폭발 그림 1번 · 지름 7.5(반경 3.75) · 타격까지 burst 0.18')
 local hitAt=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' then hitAt=hitAt or x.at end end
 ok(near(nf[1].at-t0,0.3) and near(hitAt-nf[1].at,0.18),'영창 0.3 → 폭발 그림 → 0.18초 뒤 한 번의 타격 (지연 타격 없음)')
 local all=true for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' and not near(x.at,hitAt) then all=false end end
 ok(all,'모든 적이 같은 순간 한 번에 (퍼지는 고리 6표본 아님)')
 local p=plays[#plays]
 ok(p.state=='skill1' and near(p.hold,0.8),'노바 동작 skill1 · 영창 0.3 + 회복 0.5')
 ok(cast('meteor')==0,'명령 없으면 메테오 0 (메테오는 스킬 2 명령만)')
 local dmg=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' then dmg=x.dmg end end
 ok(near(dmg,100/0.8*1),'노바 미강화 ×1.0 (다섯 공격 합 기준)')
 local n,l=vrf('[VRF] nova single')
 ok(n==1 and l:find('hits=4 mul=1.00 radius=3.75',1,true)~=nil,'[VRF] nova single hits=4 mul=1.00 radius=3.75 · '..tostring(l))
 RiteGiantMoves:Clear(u)
end
-- ②-a 노바 V2 그림 정점(GiantFxImpactSec 0.16)이 있으면 타격 = 폭발 시작 + 0.16 (표 burst 0.18 대신 그림 정점에 맞춤)
do
 clearMons() resetLogs() plays={} nodes={} fxImpact=0.16
 local u=giant('mage',100)
 monster('a',1) monster('b',-2)
 for _=1,120 do advance(0.0667) RiteGiantMoves:Tick(u,0.0667) if cast('nova')==1 then break end end
 advance(1.5)
 local nf=novaFx() local hitAt=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' then hitAt=hitAt or x.at end end
 ok(#nf==1 and near(hitAt-nf[1].at,0.16) and near(nf[1].sec,0.16),'타격 = 그림 시작 + 정점 0.16 · 한 번')
 local h=hitNames('skill.giant_nova') ok(h.a==1 and h.b==1,'여전히 한 적 1회')
 fxImpact=-1 RiteGiantMoves:Clear(u)
end
-- ②-b 「폭발 증폭」(옛 id giant_mage_pull) = 단발 ×1.5 · 여전히 한 적 1회 · 둘째 그림 0 · 평타 쉼 1.2초 보존 · 저항은 맞은 뒤
do
 clearMons() resetLogs() plays={} nodes={giant_mage_pull=1,giant_mage_resist=1} order={}
 local u=giant('mage',100)
 local a=monster('a',1) local b=monster('b',-3.5)
 for _=1,120 do advance(0.0667) RiteGiantMoves:Tick(u,0.0667) if cast('nova')==1 then break end end
 ok(near(u.AttackTimer,1.2),'노드: 평타 쉼 1.2초 그대로 (예전 두 겹 고리 길이 · 평타 횟수 불변)')
 advance(1.5)
 local h=hitNames('skill.giant_nova')
 ok(h.a==1 and h.b==1,'증폭도 한 적 정확히 1회')
 local d=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_nova' then d=x.dmg end end
 ok(near(d,100/0.8*1.5),'nova_amp_mul: 단발 ×1.5 (예전 ×1 + ×0.5 명목 합 · 두 배 아님)')
 ok(#novaFx()==1 and next(hitNames('skill.giant_nova2'))==nil,'증폭: 폭발 그림 1번 · 둘째 파동 0')
 local n,l=vrf('[VRF] nova single')
 ok(n==1 and l:find('mul=1.50',1,true)~=nil,'[VRF] nova single mul=1.50')
 ok(order[1]=='hit:a' and order[2]=='resist:a','원소 붕괴는 맞은 뒤 (hit → resist) '..table.concat(order,','))
 ok(a.resist==15 and b.resist==15,'원소 붕괴 화염 -15 한 번씩')
 nodes={} RiteGiantMoves:Clear(u)
end
-- ②-c 정적: 둘째 파동·흡인 코드 없음 · 메테오 반경 불변
do
 local fr=io.open('RootDesk/MyDesk/Undead/RiteGiantMoves.mlua') local rg=fr:read('a') fr:close()
 ok(rg:find('NovaWave',1,true)==nil and rg:find('skill.giant_nova2',1,true)==nil,'둘째 파동 함수·정보 없음')
 ok(rg:find('SetWorldPosition',1,true)~=nil and select(2,rg:gsub('SetWorldPosition',''))==1,'노바에 흡인(위치 이동) 없음 — 위치 이동은 돌진 하나뿐')
 ok(G.mage.s2Opts.radius==1.8 and G.mage.s2Opts.radiusMax==2,'메테오 반경 1.8 · 상한 2.0 그대로')
end
-- ②-d 몸 타격 칸 데이터(갈래 A GiantLook.<동작>Hit) — 노바 방출 · 땅 가르기 강타 · 회전 첫 타 · 내려찍기가 그 값을 읽는다 (하드코딩 아님)
do
 clearMons() resetLogs() plays={} nodes={}
 local u=giant('mage',100) u.GiantLook={form='mage',skill1='K1',skill1Hit=0.25}
 monster('a',1) monster('b',-1)
 local t0=nil
 for _=1,120 do advance(0.0667) RiteGiantMoves:Tick(u,0.0667) if cast('nova')==1 and t0==nil then t0=_UtilLogic.ElapsedSeconds end end
 local nf=novaFx()
 ok(#nf==1 and near(nf[1].at-t0,0.25),'노바 폭발 시작 = skill1Hit 0.25 (표 chant 0.3 대신)')
 RiteGiantMoves:Clear(u)
 clearMons() resetLogs() plays={}
 local g=giant('greatsword',120) g.GiantLook={form='greatsword',skill2='K2',skill2Hit=0.36}
 local p1=monster('p1',1)
 g.FocusUntil=_UtilLogic.ElapsedSeconds+6 t0=_UtilLogic.ElapsedSeconds
 RiteGiantMoves:OnFocus(g,p1.Entity)
 ok(near(g.GiantCastUntil-t0,0.36+0.25),'꽂고 솟는 동안 제자리 = skill2Hit + rise')
 advance(0.35) ok(next(hitNames('skill.giant_rift'))==nil,'강타 칸 전 피해 없음')
 advance(0.02) ok(hitNames('skill.giant_rift').p1==1,'첫 토막 = skill2Hit 0.36')
 local rf=nil for _,f in ipairs(fxLog) do if f.kind=='rift' then rf=f end end
 ok(rf~=nil and near(rf.at-t0,0.36),'균열 그림도 같은 순간')
 RiteGiantMoves:Clear(g)
 clearMons() resetLogs() plays={}
 local w=giant('greatsword',120) w.GiantLook={form='greatsword',skill1='S1',skill1Hit=0.1}
 local a=monster('a',1) w.Target=a.Entity
 t0=nil
 for _=1,60 do advance(0.0667) RiteGiantMoves:Tick(w,0.0667) if cast('spin')==1 and t0==nil then t0=_UtilLogic.ElapsedSeconds end end
 advance(2)
 local first=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_spin' then first=first or x.at end end
 ok(near(first-t0,0.1) and hitNames('skill.giant_spin').a==4,'회전 첫 타 = skill1Hit 0.1 · 그 뒤 gap · 4번 그대로')
 RiteGiantMoves:Clear(w)
 clearMons() resetLogs() plays={}
 local sh=giant('shield',70) sh.GiantLook={form='shield',skill2='K',skill2Hit=0.2}
 local t=monster('t',1.2)
 sh.FocusUntil=_UtilLogic.ElapsedSeconds+6 t0=_UtilLogic.ElapsedSeconds
 RiteGiantMoves:OnFocus(sh,t.Entity)
 advance(0.19) ok(next(hitNames('skill.giant_slam'))==nil,'내려찍기: skill2Hit 전 0')
 advance(0.02) ok(hitNames('skill.giant_slam').t==1,'내려찍기 피해 = skill2Hit 0.2 (A 몸 타격 칸)')
 RiteGiantMoves:Clear(sh)
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
 local sf=nil for _,f in ipairs(fxLog) do if f.kind=='spin' then sf=f end end
 ok(sf~=nil and sf.anchor==u.Entity and sf.a==0 and sf.facing==1 and near(sf.w,3.2) and near(sf.sec,1.6),'회전 그림 = 몸을 따라감(GiantMoveFxOn) · angle 0(통째 회전·상하 뒤집기 없음) · 지름 3.2 · 1.6초')
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
 -- 48 연속본(10-30): 균열 그림은 첫 토막 시각에 직선 전체 6칸으로 한 번 (4장이 토막 시각마다 한 장씩 솟음 · 판정은 여전히 4토막)
 local n=0 for _,f in ipairs(fxLog) do if f.kind=='rift' then n=n+1 ok(near(f.w,6) and near(f.sec,0.65),'균열 그림 한 번 · 길이 6 · 솟음 0.25+유지 0.4') end end
 ok(n==1,'균열 효과 한 번 (연속본 4장)')
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

-- ⑦-b 방패 내려찍기 (48 연출 V2): 몸 타격 칸 시각에 피해·묶기·그림이 함께 · 그동안 제자리 · 피해·묶기 값 그대로
do
 clearMons() resetLogs() plays={}
 local u=giant('shield',70)
 local t=monster('t',1.2) local back=monster('back',-1)
 local roots=0 t.st.ApplyRoot=function(_,sec) roots=roots+1 ok(near(sec,1),'묶기 1초 그대로') end
 u.FocusUntil=_UtilLogic.ElapsedSeconds+6
 RiteGiantMoves:OnFocus(u,t.Entity)
 ok(cast('slam')==1 and next(hitNames('skill.giant_slam'))==nil,'몸 타격 칸 전에는 피해 0 (그림 미등록 → 지금 규칙 0.12초)')
 ok(near(u.GiantCastUntil-_UtilLogic.ElapsedSeconds,0.12),'내려찍는 동안 제자리 0.12초')
 advance(0.119)
 ok(next(hitNames('skill.giant_slam'))==nil,'0.119초: 아직')
 advance(0.002)
 local h=hitNames('skill.giant_slam')
 ok(h.t==1 and h.back==nil and roots==1,'0.12초: 앞 반원 한 번 · 뒤 없음 · 묶기 1번')
 local sf=nil for _,f in ipairs(fxLog) do if f.kind=='slam' then sf=f end end
 local ht=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_slam' then ht=x.at end end
 ok(sf~=nil and near(sf.at,ht) and near(sf.w,3.2),'충격 그림 = 피해와 같은 순간 · 지름 3.2')
 local d=nil for _,x in ipairs(hitsLog) do if x.info=='skill.giant_slam' then d=x.dmg end end
 ok(near(d,70/0.7*1.5),'내려찍기 ×1.5 그대로')
 RiteGiantMoves:Clear(u)
 -- 방패 full(V2 그림): 그림은 몸과 t0에 함께(축광 포함) · 피해·묶기는 몸 접점 120ms — 그림 전체를 미루지 않음
 clearMons() resetLogs() plays={} fxSlamSeq='a|b'
 local q=giant('shield',70) q.GiantLook={form='shield',skill2='K',skill2Hit=0.12}
 local qt=monster('qt',1.2)
 q.FocusUntil=_UtilLogic.ElapsedSeconds+6 local q0=_UtilLogic.ElapsedSeconds
 RiteGiantMoves:OnFocus(q,qt.Entity)
 local qf=nil for _,f in ipairs(fxLog) do if f.kind=='slam' then qf=f end end
 ok(qf~=nil and near(qf.at,q0) and qf.anchor==q.Entity and qf.facing==1,'V2 슬램 그림 = t0 (몸과 동시 · 접점은 계약 데이터)')
 ok(next(hitNames('skill.giant_slam'))==nil,'t0에는 피해 아직')
 advance(0.121) ok(hitNames('skill.giant_slam').qt==1,'피해·묶기 = 몸 접점 120ms = 그림 4번째 장')
 local n0=0 for _,f in ipairs(fxLog) do if f.kind=='slam' then n0=n0+1 end end
 ok(n0==1,'V2 그림은 한 번 (접점 때 다시 그리지 않음)')
 local _,ls=vrf('[VRF] giant sync s=slam fx_t0') ok(ls~=nil and ls:find('art_contact=0.120 body_impact=0.120',1,true)~=nil,'[VRF] 그림 접점 = 몸 접점 0.120')
 fxSlamSeq='' RiteGiantMoves:Clear(q)
 -- 몸 그림 impact 열이 있으면 그 칸 시각 (앞 장 길이 합) · 0.4 상한
 _GameData.MonsterFrames['giant_shield']=_GameData.MonsterFrames['giant_shield'] or {}
 _GameData.MonsterFrames['giant_shield'].skill2={r={'1','2','3','4','5','6','7','8','9','10','11','12'},d={0.05,0.05,0.05,0.05,0.04,0.04,0.04,0.05,0.05,0.06,0.06,0.06},loop=false,s=6}
 local v=giant('shield',70) v.GiantLook={form='shield',skill2='1'}
 ok(near(RiteGiantMoves:BodyImpactSec(v,'skill2',0.12),0.24),'impact 열 6번째 칸 = 앞 5장 합 0.24초')
 _GameData.MonsterFrames['giant_shield'].skill2.s=12
 ok(near(RiteGiantMoves:BodyImpactSec(v,'skill2',0.12),0.4),'0.4초 상한')
 v.GiantLook={form='shield'}
 ok(near(RiteGiantMoves:BodyImpactSec(v,'skill2',0.12),0.12),'그 그림 미등록이면 지금 규칙')
 _GameData.MonsterFrames['giant_shield'].skill2=nil
end
-- ⑧ 방패 도발 함성 = 몸 동작 없음 · 기본 거인 도발 없음 (ShadowUnit.TauntTick 본문)
local function su(kind)
 local u=setmetatable({},{__index=ShadowUnit})
 u.Giant=true u.GiantKind=kind u.Dead=false u.Taunt=true u.TauntTimer=0 u.TauntEvery=3 u.TauntRadius=3
 u.OwnerPlayer=owner u.GiantLook={} u.GiantClipUntil=0 u.AttackAnimationUntil=0 u.GiantHitAt=-99 u.GiantHoldUntil=0 u.CurrentClip=''
 u.Entity={Id='su_'..kind,Name='su',pos=Vector2(0,0),CurrentMap='map',SpriteRendererComponent={SpriteRUID='stand'}}
 u.swing=0 u.played={} u.GiantClipState=''
 -- 갈래 A 79b1d425 ShadowUnit:GiantRoarBody(onStart) 계약 대역 (같은 규칙 · 이 브랜치에는 A 본문이 없다 — A 회귀 giant_body_playback이 실제 본문)
 function u:GiantRoarBody(onStart)
  if (self.GiantLook.skill1 or '')=='' then return -1 end
  local now=_UtilLogic.ElapsedSeconds
  if now<self.GiantClipUntil and self.GiantClipState~='hit' then return -1 end
  local wait=self.AttackAnimationUntil-now
  if wait>0.6 then return -1 end
  if wait<=0 then self:GiantPlay('skill1',0) self.GiantClipState='skill1' onStart(true) return 0 end
  _TimerService:SetTimerOnce(function()
   local okb=not (_UtilLogic.ElapsedSeconds<self.GiantClipUntil and self.GiantClipState~='hit')
   if okb then self:GiantPlay('skill1',0) self.GiantClipState='skill1' end
   onStart(okb)
  end,wait)
  return wait
 end
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
 -- 48 연출 V2 함성 계약(A 79b1d425): Roar → unit:GiantRoarBody(onStart) — 몸·그림이 같은 순간 시작 / 평타 뒤 미룸 / 걸 수 없음 3분기
 local function roarFx() local r=nil for _,f in ipairs(fxLog) do if f.kind=='roar' then r=f end end return r end
 local function bodyAt() for i,st in ipairs(s.played) do if st=='skill1' then return i end end end
 local s2=su('shield') s2.GiantLook={form='shield',skill1='R',skill1Hit=0.2} s2.Target=nil
 s2.GiantPlay=function(self,st,h) table.insert(self.played,{st=st,at=_UtilLogic.ElapsedSeconds}) end
 local function bodyTime() for _,x in ipairs(s2.played) do if x.st=='skill1' then return x.at end end end
 -- ① 지금 시작: 몸 skill1 즉시 · 그림 = 몸 시작 + skill1Hit 0.2 · 이중 재생 없음
 fxRoarSeq='x|y' fxLog={} logs={} s2.played={}
 local t0=_UtilLogic.ElapsedSeconds
 s2.TauntTimer=0 s2:TauntTick(0.1)
 ok(#s2.played==1 and near(bodyTime(),t0),'roar_now: 몸 skill1 한 번 즉시 (TauntTick이 몸을 따로 걸지 않음 · 이중 재생 0)')
 local rf=roarFx()
 ok(rf~=nil and near(rf.at,bodyTime()) and rf.anchor==s2.Entity and near(rf.w,6) and near(rf.sec,0.6),'방패 full: 몸·문양 그림 t0 동시 (skill1Hit 0.2가 있어도 다시 미루지 않음) · 몸을 따라감')
 advance(0.2)
 local n,l=vrf('[VRF] giant roar body=') ok(l~=nil and l:find('body=now fx=v2',1,true)~=nil,'[VRF] giant roar body=now fx=v2')
 -- ② 미룸: 평타 0.3초 남음 → 몸·그림 모두 평타 뒤 (몸 0.3 · 그림 0.5)
 fxLog={} logs={} s2.played={} s2.GiantClipState='' s2.GiantClipUntil=0 t0=_UtilLogic.ElapsedSeconds s2.AttackAnimationUntil=t0+0.3
 RiteGiantMoves:Roar(s2,2,3)
 ok(#s2.played==0 and roarFx()==nil,'roar_deferred: 평타 중 몸·그림 둘 다 아직')
 advance(0.31) ok(bodyTime()~=nil and near(bodyTime()-t0,0.3),'평타 끝(0.3)에 몸')
 ok(roarFx()~=nil and near(roarFx().at,bodyTime()),'그림도 몸 시작(0.3)과 같은 순간')
 -- ②-b 미룬 사이 기술이 시작 → onStart(false) → 몸 없음 · 그림만 그때
 fxLog={} s2.played={} t0=_UtilLogic.ElapsedSeconds s2.AttackAnimationUntil=t0+0.3 s2.GiantClipUntil=0 s2.GiantClipState=''
 RiteGiantMoves:Roar(s2,2,3) s2.GiantClipUntil=t0+1 s2.GiantClipState='skill2'
 advance(0.31) ok(#s2.played==0 and roarFx()~=nil and near(roarFx().at-t0,0.3),'미룬 사이 기술 시작: 몸 없음 · 그림만 그때(0.3)')
 n,l=vrf('[VRF] giant roar sync') ok(l~=nil and l:find('body_started=false',1,true)~=nil,'[VRF] giant roar sync body_started=false')
 -- ③ 걸 수 없음: 평타 0.6초 넘게 남음 / 기술 동작 중 / 몸 그림 없음 → 그림 바로
 advance(1)
 fxLog={} s2.played={} s2.GiantClipUntil=0 s2.GiantClipState='' s2.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+0.7
 RiteGiantMoves:Roar(s2,2,3) ok(#s2.played==0 and roarFx()~=nil,'roar_none: 평타 0.6초 넘게 남음 → 몸 없음 · 그림 바로')
 fxLog={} s2.AttackAnimationUntil=0 s2.GiantClipUntil=_UtilLogic.ElapsedSeconds+1 s2.GiantClipState='skill2'
 RiteGiantMoves:Roar(s2,2,3) ok(#s2.played==0 and roarFx()~=nil,'기술 동작 중 → 몸 없음 · 그림 바로')
 fxLog={} s2.GiantClipUntil=0 s2.GiantLook={form='shield'}
 RiteGiantMoves:Roar(s2,2,3) ok(#s2.played==0 and roarFx()~=nil,'함성 몸 그림 미등록 → 몸 없음(일반 skill 대체 없음) · 그림 바로')
 fxRoarSeq='' fxLog={} s2.GiantLook={form='shield',skill1='R',skill1Hit=0.2}
 RiteGiantMoves:Roar(s2,2,3) rf=roarFx()
 ok(rf~=nil and rf.anchor==nil and near(rf.w,0.8),'새 그림 없으면 머리 위 작은 고리 (몸 시작과 함께)')
 advance(1)
 fxRoarSeq=''
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
print(string.format('[quality/giant_skills] 48-5·48-6·48 V2 %d checks: basic 0 · nova single burst r3.75 once/enemy · amp x1.5 · no 2nd wave · slam body-impact sync · roar body+fx · meteor command chant 1s r1.8 · big meteor cap 2.0 · spin 1.6×4 · rift 4 pieces (art once ×6) · dash trail · roar no body · motion hit skip/hold loop/fallback · no retreat · imprint true', checks))
