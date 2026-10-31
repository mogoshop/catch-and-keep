-- 10-31 마법사 거인 메테오 L2 (코덱스 assets/codex-skill-fx-v2/meteor-L2-full-20261031 · 사용자 「L2로 진행」 · docs/evidence/2026-10-31-giant-meteor-L2) — 실제 본문으로:
--   ① GameConst 4자리(예고·낙하·착지·잔불) × 8장 · 32자리 hex · RUID 중복 0 · data/art_sprites.csv 32행(이름·effect·크기·RUID)과 자리 순서 0..7 그대로(짝수 = 승인 샘플 · 홀수 = 새 중간 장) · 장 간격 ms = 코덱스 75/40/40/150
--   ② SkillEffects.GiantMoveFx → GiantFxLocal → MeteorL2Fx → PlaySeq: 예고 반복(Util.Telegraph 없음 · MeteorL2Rim이면 함께) · 낙하 60° 축 이동·순환·몸 앞·왼쪽 표적 FlipX ·
--      착지 한 번 → 잔불 반복(불바닥 끝까지) → 마지막 장 옅어짐 · 바닥 3계열 같은 배율(내용 560px = 판정 지름) · 낙하 암석 1.2칸 · [VRF] meteor L2 한 줄(출시 끔)
--   ③ 빈 자리 되돌림: 자리마다 ""이면 그 단계만 예전 연출(Util.Telegraph · B 메테오 12장) · 잔불만 비면 착지 마지막 장을 불바닥 끝까지
--   ④ 바꾸지 않은 것: 피해 반경·영창·낙하·불바닥 시간 상수 · 서버 타이머 수 · 반복 타이머 없음 · 부르는 곳·미리 불러 두기 grep
-- 엔진 효과·타이머는 대역 — 실제 화면(크기·층·좌우·밝기)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames
-- @source SkillEffects Skill/SkillEffects.mlua FxOpts,SpinCycle,GiantFxSpec,GiantFxImpactSec,GiantFxFrameSec,BodySign,PlaySeq,GiantFxTint,GiantMoveFx,GiantFxLocal,MeteorL2Fx,SeqFx,ClipFxLocal
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local TICK=1/60
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
function isvalid(x) return x~=nil and x~=false and x.dead~=true end
local published=false
Environment={IsPublishedPlay=function() return published end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}
local timers={}
local repeats=0
_TimerService={SetTimerOnce=function(_,fn,delay) local due=_UtilLogic.ElapsedSeconds+delay table.insert(timers,{at=math.ceil(due/TICK-1e-9)*TICK,fn=fn}) return #timers end,
 SetTimerRepeat=function() repeats=repeats+1 return 0 end}
local function run(sec)
 local stop=_UtilLogic.ElapsedSeconds+sec
 while true do
  local best,bi=nil,nil
  for i,t in ipairs(timers) do if t.at<=stop+1e-9 and (best==nil or t.at<best.at-1e-12) then best,bi=t,i end end
  if best==nil then break end
  table.remove(timers,bi)
  _UtilLogic.ElapsedSeconds=math.max(_UtilLogic.ElapsedSeconds,best.at)
  best.fn()
 end
 _UtilLogic.ElapsedSeconds=stop
end
local plays,live,serialN={},{},0
_EffectService={
 PlayEffect=function(_,ruid,parent,pos,angle,scale,loop,opt) serialN=serialN+1 table.insert(plays,{ruid=ruid,pos=pos,angle=angle,scale=scale,opt=opt,at=_UtilLogic.ElapsedSeconds,serial=serialN}) live[serialN]=true return serialN end,
 RemoveEffect=function(_,s) live[s]=nil end}
_ParticleService={PlayBasicParticle=function() end}
BasicParticleType={}
local map={}
local me={CurrentMap=map}
_UserService={LocalPlayer=me}
SkillEffects.Entity={CurrentMap=map}
_MotionSmoother={VisOf=function(_,e) return e end}
-- Util 대역: 예고 원 · 잔불 옅어짐 기록
local tele,holds={},{}
_Util.Telegraphs={}
_Util.Telegraph=function(_,inst,c,r,el,sec) table.insert(tele,{c=c,r=r,el=el,sec=sec}) _Util.Telegraphs[#tele]={rim=901,fill=902,decal=903,timer=0} return #tele end
_Util.PlayFramesHold=function(_,ruids,inst,pos,rot,scale,fs,hs,fade,tint,order) table.insert(holds,{ruid=ruids,inst=inst,pos=pos,scale=scale,fade=fade,order=order,at=_UtilLogic.ElapsedSeconds,tint=tint}) end
local function reset() plays={} live={} logs={} timers={} tele={} holds={} _Util.Telegraphs={} end

-- 실제 GameConst · art_sprites
_GameConst={}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local k,v=line:match('^%s*property string (%w+) = "([^"]*)"')
 if k then _GameConst[k]=v end
 local ki,vi=line:match('^%s*property integer (%w+) = (%-?%d+)')
 if ki then _GameConst[ki]=tonumber(vi) end
end
local art={}
local first=true
for line in io.lines('data/art_sprites.csv') do
 if first then first=false else
  local name,kind,w,h,ruid=line:match('^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$')
  if name then art[name]={kind=kind,w=tonumber(w),h=tonumber(h),ruid=ruid} end
 end
end
local function read(p) local f=assert(io.open(p)) local t=f:read('a') f:close() return t end

-- ① 4자리 × 8장
local SLOTS={ {key='FxGiantMeteorTelegraph',s='telegraph',w=640,h=512,ms='FxGiantMeteorTelegraphMs',v=75},
 {key='FxGiantMeteorFall',s='fall',w=256,h=384,ms='FxGiantMeteorFallMs',v=40},
 {key='FxGiantMeteorImpact',s='impact',w=640,h=512,ms='FxGiantMeteorImpactMs',v=40},
 {key='FxGiantMeteorAfterglow',s='afterglow',w=640,h=512,ms='FxGiantMeteorAfterglowMs',v=150} }
local seen,total={},0
local L={}
for _,sl in ipairs(SLOTS) do
 local list=Util:Frames(_GameConst[sl.key] or '')
 L[sl.s]=list
 ok(#list==8,sl.key..' 8장 '..#list)
 for i,r in ipairs(list) do
  ok(r:match('^[0-9a-f]+$')~=nil and #r==32,sl.key..' '..i..' 32자리 hex '..r)
  ok(seen[r]==nil,'RUID 중복 없음 '..r) seen[r]=true total=total+1
  local name=string.format('fx-meteor-L2-%s-%02d',sl.s,i-1)
  local a=art[name]
  ok(a~=nil and a.kind=='effect' and a.w==sl.w and a.h==sl.h and a.ruid==r,'art_sprites '..name..' = 자리 '..i..'번째 (0..7 순서 · 짝수 승인 · 홀수 중간)')
 end
 ok(_GameConst[sl.ms]==sl.v and _GameConst[sl.ms]>0,sl.ms..' = 코덱스 '..sl.v..'ms')
end
ok(total==32,'L2 32장')
local artRows=0 for name in pairs(art) do if name:find('^fx%-meteor%-L2%-') then artRows=artRows+1 end end
ok(artRows==32,'art_sprites fx-meteor-L2 32행 '..artRows)
local function idxOf(list,r) for i,x in ipairs(list) do if x==r then return i end end return nil end
local function only(list) local t={} for _,p in ipairs(plays) do if idxOf(list,p.ruid) then table.insert(t,p) end end return t end
local function vrf(kind) local n,line=0,nil for _,x in ipairs(logs) do if x:find('[VRF] meteor L2 kind='..kind..' ',1,true) then n=n+1 line=x end end return n,line end
local K=(100/56)*3.6/SkillEffects.MeteorL2LandRef

-- ② 예고: 바닥 타원 반복 (영창 1.0 + 낙하 0.5 = 1.5초) · Util.Telegraph 없음
do
 ok(near(SkillEffects.MeteorL2LandRef,10.0) and near(560*K/100,3.6) and near(640*K/100,4.114,0.001),'바닥 배율: 내용 560px = 지름 3.6칸 · 캔버스 640px = 4.11칸 (코덱스 ground_world_sprite)')
 reset() local t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('warn_fire',Vector3(1,0.5,0),3.6,3.6,0,1.5) run(2)
 local f=only(L.telegraph)
 ok(#tele==0,'L2 예고가 있으면 Util.Telegraph 원은 그리지 않음 (MeteorL2Rim false)')
 ok(#f==20,'예고 1.5초 ÷ 75ms = 20장 '..#f)
 for i,p in ipairs(f) do ok(p.ruid==L.telegraph[(i-1)%8+1],'예고 순서 0..7 반복 '..i) ok(near(p.at-t0,(i-1)*0.075,TICK+1e-9),'예고 장 간격 75ms '..i) ok(p.opt.OrderInLayer==1 and p.opt.FlipX==false and p.angle==0,'예고 몸 뒤 · 뒤집기 없음') ok(near(p.scale.x,K) and near(p.scale.y,K),'예고 배율 = 바닥 공통') ok(near(p.pos.x,1) and near(p.pos.y,0.5),'예고 자리 = 표적 바닥') ok(near(p.opt.Color.a,1),'불투명도 MeteorL2Alpha 1') end
 local n,line=vrf('warn_fire') ok(n==1 and line:find('loop=1.50',1,true)~=nil,'[VRF] meteor L2 예고 한 줄 '..tostring(line))
 local alive=0 for _ in pairs(live) do alive=alive+1 end ok(alive==0,'예고 끝나면 지움')
 SkillEffects.MeteorL2Rim=true
 reset() SkillEffects:GiantMoveFx('warn_fire',Vector3(1,0.5,0),3.6,3.6,0,1.5) run(2)
 ok(#tele==1 and #only(L.telegraph)==20,'MeteorL2Rim true → 그림 + Util.Telegraph 원 함께')
 SkillEffects.MeteorL2Rim=false
end
-- ② 낙하: 60° 축 · 4칸 위에서 표적으로 · 0.5초 순환 · 몸 앞 · 오른쪽 표적 = 그대로 / 왼쪽 표적(angle 180) = FlipX·왼쪽 위
do
 local function fall(angle)
  reset() local t0=_UtilLogic.ElapsedSeconds
  SkillEffects:GiantMoveFx('meteor_fall',Vector3(2,0,0),3.6,3.6,angle,0.5) run(1)
  return only(L.fall),t0
 end
 local KF=SkillEffects.MeteorFallMul*SkillEffects.MeteorL2FallCoreW*(100/SkillEffects.MeteorL2FallCorePx)
 ok(near(SkillEffects.MeteorFallMul,1.5) and near(KF*SkillEffects.MeteorL2FallCorePx/100,1.2),'낙하 암석 폭 = 0.8 × MeteorFallMul 1.5 = 1.2칸 (코덱스 fall_boulder_world_width)')
 local f,t0=fall(0)
 ok(#f>=12 and #f<=13,'낙하 0.5초 ÷ 40ms 순환 '..#f)
 for i,p in ipairs(f) do ok(p.ruid==L.fall[(i-1)%8+1],'낙하 순서 0..7 순환 '..i) ok(p.opt.OrderInLayer==6 and p.opt.FlipX==false and p.angle==0,'낙하 몸 앞 · 오른쪽 표적 뒤집기 없음 · 회전 없음') ok(near(p.scale.x,KF) and near(p.scale.y,KF),'낙하 배율') end
 local d=SkillEffects.MeteorL2FallDist
 ok(near(f[1].pos.x,2+0.5*d,1e-6) and near(f[1].pos.y,math.sqrt(3)/2*d,1e-6),'낙하 시작 = 표적 + 축 60° 오른쪽 위 4칸 '..f[1].pos.x..','..f[1].pos.y)
 for i=2,#f do ok(f[i].pos.x<f[i-1].pos.x and f[i].pos.y<f[i-1].pos.y,'낙하: 장마다 표적 쪽으로 (오른쪽 위 → 왼쪽 아래) '..i) ok(near((f[i].pos.y)/(f[i].pos.x-2),math.tan(math.rad(60)),1e-6),'낙하 축 60° 위 '..i) end
 local last=f[#f] ok(math.sqrt((last.pos.x-2)^2+last.pos.y^2)<0.4,'마지막 낙하 장 = 표적 바로 위 (0.4칸 안)')
 local n,line=vrf('meteor_fall') ok(n==1 and line:find('face=1 flip=false',1,true)~=nil,'[VRF] meteor L2 낙하 한 줄 '..tostring(line))
 local alive=0 for _ in pairs(live) do alive=alive+1 end ok(alive==0,'낙하 끝나면 지움')
 f=fall(180)
 ok(#f>=12 and f[1].opt.FlipX==true and near(f[1].pos.x,2-0.5*d,1e-6) and near(f[1].pos.y,math.sqrt(3)/2*d,1e-6) and f[1].angle==0,'왼쪽 표적(angle 180): 왼쪽 위에서 · FlipX · 회전 없음')
 for i=2,#f do ok(f[i].pos.x>f[i-1].pos.x and f[i].opt.FlipX==true,'왼쪽 표적: 왼쪽 위 → 오른쪽 아래 '..i) end
 n,line=vrf('meteor_fall') ok(n==1 and line:find('face=-1 flip=true',1,true)~=nil,'[VRF] 왼쪽 표적 face=-1')
end
-- ② 착지 한 번 → 잔불 반복 → 마지막 장 옅어짐 (불바닥 scorch 1.5초)
do
 reset() local t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('meteor_land',Vector3(3,1,0),3.6,3.6,0,1.5) run(3)
 local im=only(L.impact)
 ok(#im==8,'착지 8장 한 번 '..#im)
 for i,p in ipairs(im) do ok(p.ruid==L.impact[i],'착지 순서 0..7 '..i) ok(near(p.at-t0,(i-1)*0.04,TICK+1e-9),'착지 40ms '..i) ok(p.opt.OrderInLayer==1 and near(p.scale.x,K) and near(p.pos.x,3) and near(p.pos.y,1),'착지 몸 뒤 · 바닥 공통 배율 · 표적 바닥') end
 local ag=only(L.afterglow)
 ok(#ag==8,'잔불 = 불바닥 남은 1.18초 → 적어도 한 바퀴 8장 '..#ag)
 ok(near(ag[1].at-t0,0.32,TICK+1e-9),'잔불은 착지 8장 뒤(0.32초)에 이어서 '..(ag[1].at-t0))
 for i,p in ipairs(ag) do ok(p.ruid==L.afterglow[i],'잔불 순서 0..7 '..i) ok(near(p.at-ag[1].at,(i-1)*0.15,TICK+1e-9),'잔불 150ms '..i) ok(p.opt.OrderInLayer==1 and near(p.scale.x,K) and near(p.pos.x,3),'잔불 몸 뒤 · 같은 배율·자리') end
 ok(#holds==1 and holds[1].ruid==L.afterglow[8] and near(holds[1].fade,SkillEffects.MeteorL2FadeSec) and holds[1].order==1 and near(holds[1].scale.x,K) and holds[1].inst==map,'잔불 마지막 장(07) 옅어짐 '..SkillEffects.MeteorL2FadeSec..'초')
 ok(near(holds[1].at-t0,0.32+1.2,TICK*2+1e-9),'옅어짐 = 잔불 한 바퀴 뒤 '..(holds[1].at-t0))
 local n,line=vrf('meteor_land') ok(n==1 and line:find('after=1.20',1,true)~=nil,'[VRF] meteor L2 착지 한 줄 '..tostring(line))
 -- 불바닥이 길면 잔불을 그만큼 반복
 reset() t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('meteor_land',Vector3(3,1,0),3.6,3.6,0,3.0) run(5)
 ag=only(L.afterglow)
 ok(#ag==18 and ag[9].ruid==L.afterglow[1],'불바닥 3초 → 잔불 2.68초 반복 (18장 · 9번째 = 처음으로) '..#ag)
 ok(#holds==1 and near(holds[1].at-t0,3.0,TICK*2+1e-9),'옅어짐 = 불바닥 끝 (3.0초)')
 -- 지름이 커지면(큰 메테오 반경 2.0) 같은 비율
 reset() SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),4.0,4.0,0,1.5) run(3)
 ok(near(only(L.impact)[1].scale.x,(100/56)*4.0/10.0) and near(560*only(L.impact)[1].scale.x/100,4.0),'반경 2.0 → 내용 폭 = 지름 4.0칸')
 -- 맵을 옮기면 잔불 이음 안 함
 reset() SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5) me.CurrentMap={} run(3) me.CurrentMap=map
 ok(#only(L.afterglow)==0 and #holds==0,'맵 이동 뒤 잔불·옅어짐 없음')
 -- 출시 서버: [VRF] 끔
 published=true reset() SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5) run(3) published=false
 ok(vrf('meteor_land')==0 and #only(L.impact)==8,'출시: [VRF] meteor L2 없음 · 그림은 그대로')
end
-- ③ 빈 자리 되돌림 (자리마다)
do
 local save={} for _,sl in ipairs(SLOTS) do save[sl.key]=_GameConst[sl.key] end
 local B=Util:Frames(SkillEffects.FxGiantFireMeteor)
 ok(#B==12,'예전 B 메테오 12장 자리 그대로')
 _GameConst.FxGiantMeteorTelegraph=''
 reset() SkillEffects:GiantMoveFx('warn_fire',Vector3(1,0.5,0),3.6,3.6,0,1.5) run(2)
 ok(#tele==1 and #plays==0 and vrf('warn_fire')==0 and _Util.Telegraphs[1].decal==0,'예고 자리 "" → Util.Telegraph 원(용암 바닥 그림 지움) 그대로')
 _GameConst.FxGiantMeteorFall=''
 reset() SkillEffects:GiantMoveFx('meteor_fall',Vector3(2,0,0),3.6,3.6,180,0.5) run(1)
 local bf=only(B)
 ok(#bf==6 and bf[1].ruid==B[1] and #only(L.fall)==0 and bf[1].angle==0 and bf[1].opt.FlipX==false and near(bf[1].scale.x,(100/56)*3.6/4.0*1.5),'낙하 자리 "" → B 1~6장 · 각 0(표적 쪽 180은 L2에서만) · 크기 ×1.5 그대로')
 _GameConst.FxGiantMeteorAfterglow=''
 reset() local t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5) run(3)
 local pl=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=meteor_l2_meteor_land',1,true) then pl=x end end
 ok(#only(L.impact)==8 and #holds==0 and pl~=nil and near(tonumber(pl:match('elapsed=([%d%.]+)')),1.5,TICK+0.031),'잔불만 "" → 착지 8장 뒤 마지막 장을 불바닥 1.5초 끝까지 '..tostring(pl))
 _GameConst.FxGiantMeteorImpact=''
 reset() SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5) run(3)
 local bl=only(B)
 ok(#bl==6 and bl[1].ruid==B[7] and near(bl[1].scale.x,(100/56)*3.6/SkillEffects.MeteorLandRef) and #only(L.impact)==0,'착지 자리 "" → B 7~12장 · MeteorLandRef 3.39 그대로')
 for k,v in pairs(save) do _GameConst[k]=v end
end
-- ④ 바꾸지 않은 것 · 부르는 곳
do
 local rg=read('RootDesk/MyDesk/Undead/RiteGiantMoves.mlua')
 local se=read('RootDesk/MyDesk/Skill/SkillEffects.mlua')
 local csv=read('data/rite_giants.csv')
 ok(rg:find('property number MeteorRadiusCap = 2.0',1,true)~=nil,'반경 상한 2.0 그대로')
 ok(rg:find('(opt.radius or 1.8) + 0.15 * self:NodeOf(unit, "giant_mage_meteor")',1,true)~=nil,'반경 1.8 + 랭크당 0.15 그대로')
 ok(rg:find('(opt.chant or 1) - 0.1 * self:NodeOf(unit, "giant_mage_meteor")',1,true)~=nil,'영창 1.0 − 랭크당 0.1 그대로')
 ok(rg:find('local fall = opt.fall or 0.5',1,true)~=nil and rg:find('opt.scorch or 1.5',1,true)~=nil,'낙하 0.5초 · 불바닥 1.5초 그대로')
 ok(csv:find('meteor,기도 메테오,3,12,single,6,radius=1.8;radiusMax=2;chant=1;fall=0.5;scorch=1.5',1,true)~=nil,'rite_giants.csv 마법사 메테오 ×3 · 쿨 12 · 반경·시간 그대로')
 local body=rg:match('method void FireMeteor%(.-\n    end\n')
 ok(body~=nil,'FireMeteor 본문')
 local nt=0 for _ in body:gmatch('SetTimerOnce') do nt=nt+1 end
 ok(nt==2 and body:find('SetTimerRepeat',1,true)==nil,'서버 타이머 2개 그대로 (낙하·착지) · 반복 없음')
 ok(body:find('if at.x < _Util:Pos2(unit.Entity).x then side = 180 end',1,true)~=nil and body:find('GiantMoveFx("meteor_fall", Vector3(at.x, at.y, 0), radius * 2, radius * 2, side, fall)',1,true)~=nil,'낙하 부름: 표적이 시전자 왼쪽이면 angle 180')
 ok(body:find('GiantMoveFx("warn_fire", Vector3(at.x, at.y, 0), radius * 2, radius * 2, 0, chant + fall)',1,true)~=nil and body:find('GiantMoveFx("meteor_land", Vector3(at.x, at.y, 0), radius * 2, radius * 2, 0, opt.scorch or 1.5)',1,true)~=nil,'예고·착지 부름 그대로 (지름 = 반경×2 · 시간 그대로)')
 local m=se:match('@ExecSpace%("ClientOnly"%)\n    method boolean MeteorL2Fx%(.-\n    end\n')
 ok(m~=nil and m:find('SetTimerRepeat',1,true)==nil,'MeteorL2Fx 클라이언트 전용 · 반복 타이머 없음')
 ok(se:find('if self:MeteorL2Fx(kind, pos, width, angle, seconds) then return end',1,true)~=nil,'GiantFxLocal → MeteorL2Fx (예고·낙하·착지)')
 local pre=se:match('method void OnBeginPlay%(%)(.-)\n    end\n')
 ok(pre~=nil and pre:find('_GameConst.FxGiantMeteorTelegraph, _GameConst.FxGiantMeteorFall, _GameConst.FxGiantMeteorImpact, _GameConst.FxGiantMeteorAfterglow',1,true)~=nil,'미리 불러 두기: 4자리 첫 장')
 ok(near(SkillEffects.MeteorLandRef,3.39) and near(SkillEffects.MeteorFallMul,1.5) and SkillEffects.MeteorTelegraphOnly==true,'임시 보정(ec625a91) 값 그대로 (B 되돌림 길)')
 ok(repeats==0,'재생 중 SetTimerRepeat 0')
end
print(string.format('[quality/giant_meteor_l2] %d checks: 4 slots x8 (32 hex · art_sprites 32 · order 0..7 · 75/40/40/150ms) · telegraph loop no rim · fall 60deg travel 4 · left FlipX · impact once → afterglow loop → last fade · shared ground scale 560px=diameter · boulder 1.2 · empty-slot fallback x4 · damage/time/timers unchanged · preload', checks))
