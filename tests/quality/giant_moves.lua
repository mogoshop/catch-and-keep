-- 46-4 거인 스킬 2 명령 규칙 (기획서 46 §10-3): 실제 RiteGiantMoves 본문(Tick·OnFocus·ValidTarget·InReach·StateOf·Clear)으로
--   명령 한 번에 한 번 · 무효 대상 버림 · 쿨 중 명령은 쓰지 않고 쿨이 돈 뒤에도 저절로 쓰지 않음 · 멀면 걸어가 닿을 때 · 걷는 중 다른 대상 = 대상만 바꿈 ·
--   걷는 중 무효·집중 끝 = 취소(쿨 안 씀) · 무명령이면 20초 동안 스킬 2 0번 · 스킬 1은 쿨마다 저절로(방패는 도발 함성 = TauntTick이라 0번) · 갈라짐 Clear.
--   피해·효과(FireS1·FireS2 본문)는 대역으로 기록만 — 피해 수치·연출은 메이커 46-8.
-- @source GameData Data/GameData.mlua Ensure,GetGiant,GetUiIcon
-- @source RiteGiantMoves Undead/RiteGiantMoves.mlua StateOf,Clear,NodeOf,Opt,Tick,OnFocus,ValidTarget,InReach,S1Radius,LogS2,LogSkill
_GameData:Ensure()
Environment={IsPublishedPlay=function() return false end}
_UtilLogic={ElapsedSeconds=0}
local V={}
V.__index=V
V.__sub=function(a,b) return setmetatable({x=a.x-b.x,y=a.y-b.y},V) end
function V:Magnitude() return math.sqrt(self.x*self.x+self.y*self.y) end
function Vector2(x,y) return setmetatable({x=x,y=y},V) end
function isvalid(x) return x~=nil and x.dead~=true end
local logs={}
function log(s) table.insert(logs,s) end
_Util={IsAlive=function() return true end,Pos2=function(_,e) return e.pos end}
local fired={}
RiteGiantMoves.FireS2=function(self,unit,st,spec,target) st.s2At=_UtilLogic.ElapsedSeconds+spec.s2Cd table.insert(fired,{s=2,target=target.Name,t=_UtilLogic.ElapsedSeconds}) end
RiteGiantMoves.FireS1=function(self,unit,st,spec,target) table.insert(fired,{s=1,target=target.Name,t=_UtilLogic.ElapsedSeconds}) end
local owner={Name='owner',pos=Vector2(0,0),GetComponent=function() return {Node=function() return 0 end} end}
local function monster(name,x) return {Name=name,pos=Vector2(x,0),GetComponent=function(_,k) if k=='script.Monster' then return {} end end} end
local function duelFoe(name,x) return {Name=name,pos=Vector2(x,0),GetComponent=function() return nil end} end
local function giant(kind,atk)
 local u={Giant=true,Dead=false,GiantKind=kind,Atk=atk,OwnerPlayer=owner,AttackRange=1.2,OwnerCombatRange=7,FocusExtraRange=2,FocusUntil=0,Target=nil,
  Entity={Id='g1',pos=Vector2(0,0),Name='giant'}}
 function u:IsLiveTarget(e) return e~=nil and e.dead~=true end
 function u:IsOwnerCombatTarget(e,range) return (e.pos-owner.pos):Magnitude()<=range end
 return u
end
local function focus(u,target,sec) u.FocusUntil=_UtilLogic.ElapsedSeconds+(sec or 6) RiteGiantMoves:OnFocus(u,target) end
local function count(s) local n=0 for _,f in ipairs(fired) do if f.s==s then n=n+1 end end return n end
local function lastReason() for i=#logs,1,-1 do local r=string.match(logs[i],'reason=(%a+)') if r then return r end end end
local function run(u,sec) for _=1,math.floor(sec/0.0667) do _UtilLogic.ElapsedSeconds=_UtilLogic.ElapsedSeconds+0.0667 RiteGiantMoves:Tick(u,0.0667) end end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end

-- 1. 무명령: 20초 동안 스킬 2 0번 · 스킬 1은 대상이 사거리 안이면 쿨(10초)마다
do
 local u=giant('basic',110)
 local m=monster('m1',1)
 u.Target=m
 run(u,20)
 ok(count(2)==0,'no command → s2 never fired')
 ok(count(1)==2,'basic s1 every 10s after 3s warmup: '..count(1))
 RiteGiantMoves:Clear(u);fired={}
end
-- 2. 명령: 사거리 안 유효 대상 → 한 번 · 같은 대상 거듭(쿨 중) → 안 씀 · 쿨이 돈 뒤 저절로 안 씀 · 새 명령 → 한 번
do
 local u=giant('basic',110)
 local m=monster('m1',3)
 focus(u,m)
 ok(count(2)==1 and fired[1].target=='m1','command fires once')
 focus(u,m)
 ok(count(2)==1 and lastReason()=='cd','repeat during cooldown → cd, not fired')
 run(u,13)
 ok(count(2)==1,'after cooldown no automatic s2')
 focus(u,m)
 ok(count(2)==2,'new command after cooldown fires')
 RiteGiantMoves:Clear(u);fired={}
end
-- 3. 무효 대상: 결투 상대(몬스터 아님) · 쓰러진 적 · 추격 범위(7+2) 밖 → 버림, 쿨 안 씀
do
 local u=giant('basic',110)
 focus(u,duelFoe('pvp',2))
 ok(count(2)==0 and lastReason()=='invalid','duel foe → invalid')
 local dead=monster('dead',2);dead.dead=true
 focus(u,dead)
 ok(count(2)==0 and lastReason()=='invalid','dead → invalid')
 focus(u,monster('far',9.5))
 ok(count(2)==0 and lastReason()=='invalid','beyond focus range → invalid')
 ok(RiteGiantMoves:StateOf(u).s2At==0,'invalid command keeps cooldown ready')
 RiteGiantMoves:Clear(u);fired={}
end
-- 4. 거리 밖(방패 내려찍기 사거리 1.6): 걸어가 닿는 순간 · 걷는 중 다른 대상 = 대상만 바꿈
do
 local u=giant('shield',70)
 local a,b=monster('a',5),monster('b',6)
 focus(u,a,6)
 ok(count(2)==0 and lastReason()=='walk','far target → walk')
 focus(u,b,6)
 ok(count(2)==0 and RiteGiantMoves:StateOf(u).pending.target==b,'retarget while walking')
 run(u,1)
 b.pos=Vector2(1.2,0)   -- 거인이 다가가 닿음
 run(u,0.2)
 ok(count(2)==1 and fired[1].target=='b','fires on reach at the new target')
 ok(count(1)==0,'shield s1 = roar via TauntTick (no RiteGiantMoves s1)')
 RiteGiantMoves:Clear(u);fired={}
end
-- 5. 걷는 중 대상이 죽음 · 집중 시간이 끝남 → 취소 (쿨 안 씀 · 이후 저절로 안 씀)
do
 local u=giant('greatsword',120)
 local m=monster('m',8)
 focus(u,m,6)
 ok(lastReason()=='walk','walk (rift reach 6)')
 m.dead=true
 run(u,0.2)
 ok(count(2)==0 and lastReason()=='cancel' and RiteGiantMoves:StateOf(u).s2At==0,'dead while walking → cancel, no cooldown')
 local n=monster('n',8)
 focus(u,n,1)
 run(u,1.5)
 ok(count(2)==0 and lastReason()=='cancel','focus expired → cancel')
 n.pos=Vector2(2,0)
 run(u,3)
 ok(count(2)==0,'no auto fire after cancel')
 RiteGiantMoves:Clear(u);fired={}
end
-- 6. 갈라짐(Clear) → 기다리던 명령 버림 · 새 거인은 새 상태
do
 local u=giant('mage',80)
 u.AttackRange=4.5
 local m=monster('m',6)
 focus(u,m,6)
 ok(lastReason()=='walk','mage field reach = attack range 4.5')
 RiteGiantMoves:Clear(u)
 ok(lastReason()=='cancel' and RiteGiantMoves.States['g1']==nil,'clear drops pending')
 m.pos=Vector2(3,0)
 run(u,0.2)
 ok(count(2)==0,'cleared command not fired')
 fired={}
end
-- 7. 쌍칼 돌진 거리 5 · 대검 가르기 6 · 던지기 6: 그 안이면 바로
do
 for _,c in ipairs({{'twin',4.9},{'greatsword',5.9},{'basic',5.9}}) do
  local u=giant(c[1],100)
  focus(u,monster('x',c[2]))
  ok(count(2)==1,c[1]..' instant within reach')
  RiteGiantMoves:Clear(u);fired={}
 end
end
print(string.format('[quality/giant_moves] 46-4 s2 command rules %d checks: no-command 0 · once per command · cd no queue · invalid (duel/dead/far) · walk + retarget · cancel on death/focus end · clear on split · reach per shape',checks))
