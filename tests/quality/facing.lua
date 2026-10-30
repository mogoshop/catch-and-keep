-- 10-30 소환수·몬스터 좌우 수정 (docs/evidence/2026-10-30-facing-fix): 실제 MotionSmoother 본문(LookUnit·LookMonster·WalkStep·MonsterActing)으로
--   ① 0.15초 넘게 걸으면 걸음 방향으로 돈다(예전: 유지 시간을 같은 프레임에 0으로 되돌려 60fps에선 영영 안 돎 → 걷기 46% 반대)
--   ② 0.15초 안의 한두 프레임 흔들림은 돌지 않는다(껌뻑임 방지 유지) ③ 공격 중(CommandState attack)은 서버 방향 바로
--   ④ 몬스터 대역도 같은 규칙(걷기 0.15초 · 넉백 바로) ⑤ 비스듬한 느린 가로 걸음(0.15칸/초)도 걸음 방향
-- @source MotionSmoother World/MotionSmoother.mlua LookUnit,LookMonster,WalkStep,MonsterActing
function isvalid(x) return x~=nil and x~=false end
_UtilLogic={ElapsedSeconds=0,ServerElapsedSeconds=0}
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local DT=1/60
local function unitRec(cmd)
 local sprite={SpriteRUID='stand'}
 local unit={StandRUID='stand',MoveRUID='move',CommandState=cmd or 'follow',Entity={SpriteRendererComponent=sprite}}
 return {unit=unit,moving=false,vx=0,vy=0}, {Scale={x=1,y=1,z=1}}
end
local function walk(r,t,vx,frames)
 local x=r.pix or 0
 for _=1,frames do
  x=x+vx*DT
  MotionSmoother:WalkStep(r,DT,x,0)
  MotionSmoother:LookUnit(r,t,DT)
 end
end
do
 local r,t=unitRec() MotionSmoother:WalkStep(r,DT,0,0)
 walk(r,t,1.6,6)
 ok(r.visSignWant==1,'걷기 시작 0.1초 안에는 아직 돌지 않는다')
 walk(r,t,1.6,30)
 ok(r.visSignWant==-1,'0.15초 넘게 오른쪽으로 걸으면 오른쪽을 본다 (같은 프레임 0 되돌림 버그 회귀)')
 ok(r.visClip=='move','걷는 그림')
end
do
 local r,t=unitRec() MotionSmoother:WalkStep(r,DT,0,0)
 walk(r,t,-1.6,40)
 local before=r.visSignWant
 ok(before==1,'왼쪽 걷기 = 왼쪽')
 for i=1,30 do walk(r,t,(i%6==0) and 1.6 or -1.6,1) end
 ok(r.visSignWant==before,'드문 반대 프레임은 좌우를 바꾸지 않는다')
end
do
 local r,t=unitRec() MotionSmoother:WalkStep(r,DT,0,0)
 walk(r,t,1.6,40)
 ok(r.visSignWant==-1,'오른쪽 걷기')
 r.unit.CommandState='attack' t.Scale.x=1
 MotionSmoother:LookUnit(r,t,DT)
 ok(r.visSignWant==1,'공격 중엔 서버 전투 방향을 같은 프레임에 바로 쓴다')
end
do
 local r,t=unitRec() MotionSmoother:WalkStep(r,DT,0,0)
 local x,y=0,0
 for _=1,40 do x=x+0.15*DT y=y+0.45*DT MotionSmoother:WalkStep(r,DT,x,y) MotionSmoother:LookUnit(r,t,DT) end
 ok(r.walking==true,'비스듬히 걷는 중')
 ok(r.visSignWant==-1,'가로 걸음이 느려도(0.15칸/초 · 예전 문턱 0.2) 걸음 방향')
end
do
 local sprite={FlipX=false}
 local r={monster=true,e={SpriteRendererComponent=sprite,GetComponent=function() return nil end},moving=true,vx=1.2,vy=0,lastDelta=DT}
 for _=1,6 do MotionSmoother:LookMonster(r) end
 ok(r.visFlip==false,'몬스터: 0.1초 안에는 그대로')
 for _=1,30 do MotionSmoother:LookMonster(r) end
 ok(r.visFlip==true,'몬스터: 0.15초 넘게 오른쪽 걸음 → 오른쪽 (같은 프레임 0 되돌림 회귀)')
 local st={KnockUntil=99}
 r.e.GetComponent=function(_,k) if k=='script.MonsterStatus' then return st end end
 r.mst=nil r.matk=nil r.rt=1
 MotionSmoother:LookMonster(r)
 ok(r.visFlip==false,'몬스터: 넉백 중엔 서버 좌우(때린 쪽) 바로')
end
print(string.format('facing: %d checks passed', checks))
