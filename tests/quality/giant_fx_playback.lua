-- 48 연출 V2 (10-30 · 갈래 B): 거인 기술 연속본 재생 경로 회귀 — 실제 SkillEffects 본문(GiantFxSpec·GiantFxFrameSec·PlaySeq·SeqFx·GiantFxLocal·GiantMoveFx(On))
--   ① 장 간격 규칙: spec 명시(sec·impact·cycle·span·fit)가 우선 · 없으면 옛 기본 max(0.04, seconds/n) (16~18장이면 길어짐을 기록)
--   ② 16장 노바: 타이머가 화면 주기(60Hz)로 늦게 와도 중간 칸 건너뜀 0 · 순서대로 · 타격 칸(impact)이 서버 타격 순간(burst) ±1화면 · 전체 길이 계획 ±1화면 · 타격 칸 불투명 1 뒤로 옅어짐
--   ③ 수평 회전 두 층(뒤 order 1 · 앞 order 6): 같은 시각 시작 · 한 바퀴 = gap · 1.6초 동안 4바퀴 반복 이음(칸 차이 항상 +1 순환) · 몸을 따라감 · angle 0 · 배율 양수(상하 뒤집기 없음)
--   ④ 앞 장 지움 0.03초 겹침 유지(빈 화면 없음) · 0.04초 간격이면 한 층 동시 ≤ 2 (0.025초 회전은 ≤ 3) · ⑤ 내려찍기 두 층 접점 앵커·좌우 대칭(FlipX만) ⑥ 새 그림이 비면 지금 그림 그대로(옛 66장 경로 불변)
-- 엔진 효과·타이머·화면 몸(MotionSmoother)은 대역 — 실제 화면 주기·그림 품질은 메이커 실녹화(maker_queue)
-- @source GameData Data/GameData.mlua Ensure,GetGiant
-- @source Util Common/Util.mlua Frames
-- @source SkillEffects Skill/SkillEffects.mlua FxOpts,SpinCycle,GiantFxSpec,GiantFxImpactSec,GiantFxFrameSec,BodySign,PlaySeq,GiantFxTint,GiantMoveFx,GiantMoveFxOn,GiantFxLocal,SeqFx,ClipFxLocal
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local TICK=1/60
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
function isvalid(x) return x~=nil and x~=false and x.dead~=true end
Environment={IsPublishedPlay=function() return false end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}
-- 타이머: 예정 시각 뒤 첫 화면(60Hz)에 온다 (실제 엔진처럼 늦게 올 수 있음)
local timers={}
timerShift=nil   -- 시험용: 예정 시각을 늦추는 함수 (지연 타이머 반례)
_TimerService={SetTimerOnce=function(_,fn,delay) local due=_UtilLogic.ElapsedSeconds+delay if timerShift then due=timerShift(due) end table.insert(timers,{at=math.ceil(due/TICK-1e-9)*TICK,fn=fn,seq=#timers}) return #timers end}
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
-- 효과 대역: 건 장·지운 장 기록
local plays,live,serialN,maxLive={},{},0,0
_EffectService={
 PlayEffect=function(_,ruid,parent,pos,angle,scale,loop,opt) serialN=serialN+1 table.insert(plays,{ruid=ruid,pos=pos,angle=angle,scale=scale,opt=opt,at=_UtilLogic.ElapsedSeconds,serial=serialN}) live[serialN]=opt and opt.OrderInLayer or 0
  local n=0 for _ in pairs(live) do n=n+1 end if n>maxLive then maxLive=n end return serialN end,
 RemoveEffect=function(_,s) live[s]=nil end}
_ParticleService={PlayBasicParticle=function() end}
BasicParticleType={}
local map={}
local me={CurrentMap=map}
_UserService={LocalPlayer=me}
SkillEffects.Entity={CurrentMap=map}
-- 화면 몸 대역: 거인이 걷는다 (VisOf = 그림 대역)
local giant={TransformComponent={WorldPosition=Vector3(0,0,0),Scale=Vector3(1,1,1)},SpriteRendererComponent={FlipX=false}}
_MotionSmoother={VisOf=function(_,e) return e end}
_GameConst={FxGiantSlam='s1|s2|s3|s4',FxGiantSpin='o1|o2|o3|o4|o5|o6',FxGiantRift='r1|r2|r3|r4',FxGiantDash='d1|d2|d3|d4',FxSlash='slash',FxSkillHexBurst=''}
_GameData:Ensure()
_GameData.RiteGiants.greatsword.s1Opts={hits=4,gap=0.4}
local DEF={spin=SkillEffects.FxGiantSpinOpts,rift=SkillEffects.FxGiantRiftOpts,slam=SkillEffects.FxGiantSlamOpts,slamF=SkillEffects.FxGiantSlamFrontOpts,roar=SkillEffects.FxGiantRoarOpts,novaV2=SkillEffects.FxGiantNovaV2,novaV2F=SkillEffects.FxGiantNovaV2Front}   -- 속성 기본값 = 코덱스 full 아트 계약
local function seq(prefix,n) local t={} for i=1,n do t[i]=prefix..i end return table.concat(t,'|') end
local function reset() plays={} live={} maxLive=0 logs={} timers={} end
local function idx(r) return tonumber(r:match('(%d+)$')) end

-- ① 장 간격 규칙
do
 local F=function(spec,n,s) return SkillEffects:GiantFxFrameSec(spec,n,s) end
 local t=F({},18,0.5) ok(t.rule=='floor' and near(t.sec,0.04),'옛 기본: 18장 0.5초 → 바닥 0.04 (= 0.72초로 늘어남 · 그래서 새 연속본은 명시)')
 t=F({},6,0.5) ok(t.rule=='floor' and near(t.sec,0.5/6),'옛 기본 6장 그대로 (meteor_fall·flurry 등 불변)')
 t=F({sec=0.1,impact=5},16,0.18) ok(t.rule=='sec' and near(t.sec,0.1),'sec 명시가 가장 우선')
 t=F({impact=5},16,0.18) ok(t.rule=='impact' and near(t.sec,0.045),'impact: 5번째 칸이 0.18초에 (16장 0.045초 · 바닥 0.04 우회)')
 t=F({cycle=0.4},16,1.6) ok(t.rule=='cycle' and near(t.sec,0.025),'cycle: 한 바퀴 0.4 ÷ 16 = 0.025 (바닥 0.04 아래도 그대로)')
 t=F({span=0.6},12,0.35) ok(t.rule=='span' and near(t.sec,0.05),'span: 0.6 ÷ 12')
 t=F({fit=true},16,0.65) ok(t.rule=='fit' and near(t.sec,0.65/16),'fit: 부르는 쪽 seconds ÷ 장 수')
 t=F({impact=20},16,0.18) ok(t.rule=='floor','impact 칸이 장 수보다 크면 무시')
 local o=SkillEffects:FxOpts('w=420; h=300 ;ref=7.5;impact=5;face=left;flip=false') ok(o.w==420 and o.h==300 and o.ref==7.5 and o.impact==5 and o.face=='left' and o.flip==false,'그림 계약 문자열 읽기')
end

-- ② 16장 노바 단일 폭발: 건너뜀 0 · 타격 칸 = burst · 타격 칸 진하게
do
 reset()
 SkillEffects.FxGiantNovaV2='' SkillEffects.FxGiantNovaV2Front=''   -- 48 V2 통합: 실제 V2 RUID가 차 있어도 ②③은 옛 경로(V2 비었을 때)를 본다
 SkillEffects.FxGiantNova=seq('n',16) SkillEffects.FxGiantNovaOpts='w=420;h=300;ref=7.5;impact=5'
 SkillEffects:GiantMoveFx('nova',Vector3(1,2,0),7.5,7.5,0,0.18)
 run(2)
 ok(#plays==16,'16장 모두 걸림 '..#plays)
 local inorder=true for i,p in ipairs(plays) do if p.ruid~='n'..i then inorder=false end end
 ok(inorder,'giant_fx_playback: 중간 칸 건너뜀 0 · 순서대로')
 ok(near(plays[5].at-plays[1].at,0.18,TICK+1e-9),'타격 칸(5) = 폭발 시작 + 0.18초 ±1화면 '..(plays[5].at-plays[1].at))
 local _,l=nil,nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=nova',1,true) then l=x end end
 local el,pl=tonumber(l:match('elapsed=([%d%.]+)')),tonumber(l:match('planned=([%d%.]+)'))
 ok(l:find('shown=16 n=16',1,true)~=nil and near(el,pl,TICK+1e-9) and near(pl,0.72),'[VRF] 16/16 · 계획 0.72초 ±1화면 · '..l)
 ok(plays[5].opt.Color.a==1 and plays[4].opt.Color.a==0.85 and plays[16].opt.Color.a<0.45 and plays[10].opt.Color.a>plays[16].opt.Color.a,'타격 칸 불투명 1 → 잔광 옅어짐 (긴 불투명 원판 아님)')
 ok(plays[1].opt.OrderInLayer==1 and plays[1].opt.SortingLayer=='MapLayer0' and near(plays[1].pos.y,2.1),'몸 뒤 바닥(order 1) · 땅에 고정 (지금 그림 계약 dy 0.1)')
 ok(near(plays[1].scale.x,(100/56)*7.5/7.5) and plays[1].scale.y>0,'새 그림 ref 7.5 = 지름 7.5 원본 크기 · 상하 뒤집기 없음')
 local sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=nova',1,true) then sf=x end end
 ok(sf:find('rule=impact',1,true)~=nil,'[VRF] rule=impact')
 ok(next(live)==nil,'끝나면 남은 장 0')
 -- 지금 6장(새 그림 전): 같은 경로 · 마지막 장 = 최대 반경 = 0.18초 · ref 5.0이면 지름 7.5에 1.5배
 reset()
 SkillEffects.FxGiantNova=seq('k',6) SkillEffects.FxGiantNovaOpts='impact=6'
 SkillEffects:GiantMoveFx('nova',Vector3(0,0,0),7.5,7.5,0,0.18)
 run(1)
 ok(#plays==6 and near(plays[6].at-plays[1].at,0.18,TICK+1e-9),'지금 6장: 6장 모두 · 최대 반경 칸 0.18초')
 ok(near(plays[1].scale.x,(100/56)*7.5/5.0),'지금 그림 ref 5.0 → 1.5배 (지름 5 → 7.5)')
end

-- ②-b 노바 V2 새 아트 (코덱스 nova/full): 16장 장별 시간 [20,20,25,25,35,35,25,25,40,50,80,80,90,90,90,90] 합 820ms · 정점 index 6(7번째) = 160ms ·
--   두 층(뒤 rear order 1 · 앞 front order 6) 같은 원점·시각 · 내용 지름 420px = 7.5칸 → 캔버스 640×512 = 11.43×9.14칸 · 균등화 없음
do
 reset()
 SkillEffects.FxGiantNovaV2=seq('nr',16) SkillEffects.FxGiantNovaV2Front=seq('nf',16)
 ok(near(SkillEffects:GiantFxImpactSec('nova'),0.16),'서버 타격 시각 = 정점 160ms (GiantFxImpactSec)')
 SkillEffects:GiantMoveFx('nova',Vector3(1,2,0),7.5,7.5,0,0.16)
 run(2)
 local rear,front={},{}
 for _,p in ipairs(plays) do if p.ruid:sub(1,2)=='nr' then table.insert(rear,p) else table.insert(front,p) end end
 ok(#rear==16 and #front==16,'두 층 16장씩 모두 (누락 0)')
 local inorder=true for i=1,16 do if rear[i].ruid~='nr'..i or front[i].ruid~='nf'..i then inorder=false end end
 ok(inorder,'순서대로')
 local MS={20,20,25,25,35,35,25,25,40,50,80,80,90,90,90,90}
 local okDur,acc=true,0
 for i=1,16 do if not near(rear[i].at-rear[1].at,acc/1000,TICK+1e-9) then okDur=false end acc=acc+MS[i] end
 ok(okDur and acc==820,'장별 시작 = 앞 장 지속 합 ±1화면 (균등 간격 아님) · 합 820ms')
 ok(near(rear[7].at-rear[1].at,0.16,TICK+1e-9),'정점(index 6) = 160ms ±1화면 = 서버 타격')
 ok(rear[1].at==front[1].at and rear[1].opt.OrderInLayer==1 and front[1].opt.OrderInLayer==6,'뒤 층 배우 뒤(order 1) · 앞 층 배우 앞(order 6) · 같은 순간')
 ok(near(rear[1].pos.x,1) and near(rear[1].pos.y,2) and near(front[1].pos.y,2),'지면 원점 = 부르는 자리(거인 발) · 피벗 0.5/0.375는 업로드 그림 설정')
 local k=rear[1].scale.x
 ok(near(k,100/56) and near(640*k/100,11.428571,1e-5) and near(512*k/100,9.142857,1e-5),'내용 420px = 7.5칸 → 캔버스 11.43×9.14칸 (640을 7.5로 줄이지 않음)')
 ok(rear[7].opt.Color.a==0.85 and rear[16].opt.Color.a==0.85,'강약은 그림 자체 (peak 0 · 코드 덧옅힘 없음)')
 local pl=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=nova ',1,true) then pl=x end end
 ok(pl:find('shown=16 n=16',1,true)~=nil and near(tonumber(pl:match('planned=([%d%.]+)')),0.82) and near(tonumber(pl:match('elapsed=([%d%.]+)')),0.82,TICK+1e-9),'[VRF] 16/16 · 계획 0.82초 · 실제 ±1화면 '..pl)
 local sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=nova ',1,true) then sf=x end end
 ok(sf:find('rule=durs',1,true)~=nil and sf:find('impact_at=0.160',1,true)~=nil,'[VRF] rule=durs · impact_at=0.160')
 local drift=false for _,x in ipairs(logs) do if x:find('impact drift',1,true) then drift=true end end
 ok(not drift,'서버 타격(0.16)과 그림 정점 어긋남 없음')
 -- 앞 층이 비면 원본 16장 한 층(배우 뒤)
 reset() SkillEffects.FxGiantNovaV2Front=''
 SkillEffects:GiantMoveFx('nova',Vector3(0,0,0),7.5,7.5,0,0.16) run(2)
 ok(#plays==16 and plays[1].opt.OrderInLayer==1,'앞 층 없으면 원본 16장 한 층 (배우 뒤)')
 SkillEffects.FxGiantNovaV2=''
 ok(SkillEffects:GiantFxImpactSec('nova')==-1,'새 아트 없으면 -1 (서버는 표 burst 0.18)')
end
-- ③ 수평 회전 두 층 · 4바퀴 · 몸을 따라감
do
 reset()
 SkillEffects.FxGiantSpinBack=seq('b',16) SkillEffects.FxGiantSpinFront=seq('f',16) SkillEffects.FxGiantSpinOpts='w=384;h=192;ref=3.2'
 giant.TransformComponent.WorldPosition=Vector3(0,0,0)
 SkillEffects:GiantMoveFxOn('spin',giant,Vector3(0,0.3,0),1,3.2,3.2,0,1.6)
 -- 걷는다: 0.1초마다 0.1칸
 for _=1,20 do run(0.1) local p=giant.TransformComponent.WorldPosition giant.TransformComponent.WorldPosition=Vector3(p.x+0.1,p.y,0) end
 local back,front={},{}
 for _,p in ipairs(plays) do if p.ruid:sub(1,1)=='b' then table.insert(back,p) else table.insert(front,p) end end
 ok(back[1].at==front[1].at and back[1].opt.OrderInLayer==1 and front[1].opt.OrderInLayer==6,'두 층 같은 시각 시작 · 뒤 order 1 · 앞 order 6')
 local function cont(list) for i=2,#list do local a,b=idx(list[i-1].ruid),idx(list[i].ruid) if b~=a%16+1 then return false end end return true end
 ok(cont(back) and cont(front),'반복 이음: 칸 차이 항상 +1 (16 → 1) · 건너뜀 0')
 ok(#front>=63 and #front<=65,'1.6초 = 4바퀴 ≈ 64장 '..#front)
 local laps=0 for _,p in ipairs(front) do if p.ruid=='f1' then laps=laps+1 end end
 ok(laps==4,'f1이 4번 = 4바퀴 (한 바퀴 = 타격 간격 0.4초)')
 ok(near(front[17].at-front[1].at,0.4,TICK+1e-9),'두 번째 바퀴 시작 = 0.4초 ±1화면')
 ok(near(front[49].at-front[1].at,1.2,TICK+1e-9),'네 번째 바퀴 시작 = 1.2초 ±1화면 (25ms 장이 60Hz에서 길어지지 않음 · 30fps 상한 없음)')
 local pl=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=spin_front',1,true) then pl=x end end
 ok(pl~=nil and near(tonumber(pl:match('elapsed=([%d%.]+)')),1.6,TICK+1e-9),'회전 앞 층 전체 1.6초 ±1화면 · '..tostring(pl))
 ok(front[#front].pos.x>front[1].pos.x+1,'걷는 몸을 따라감 '..front[1].pos.x..'→'..front[#front].pos.x)
 local flat=true for _,p in ipairs(plays) do if p.angle~=0 or p.scale.y<=0 or p.scale.x<=0 or p.opt.FlipX then flat=false end end
 ok(flat,'통째 회전·상하 뒤집기 없음 (angle 0 · 배율 양수 · FlipX 없음)')
 -- 장 간격 0.025초 < 지움 0.03초: 60Hz에서 한 층에 최대 3장이 한 화면 겹친다 (빈 화면 수정 0.03초를 지키는 대가 · results limits에 기록)
 ok(maxLive<=6,'두 층 겹침: 동시에 뜬 장 ≤ 6 (층당 ≤ 3 · 0.03초 지움 유지) '..maxLive)
 print('[giant_fx_playback] spin 0.025s/frame max live (2 layers) = '..maxLive)
 SkillEffects.FxGiantSpinBack='' SkillEffects.FxGiantSpinFront=''
end

-- ④ 0.03초 지움 겹침 유지 (지우고 거는 순서 아님) · 한 층 동시 ≤ 2
do
 reset()
 SkillEffects.FxGiantRiftSeq=seq('r',16) SkillEffects.FxGiantRiftOpts=''
 SkillEffects:GiantMoveFx('rift',Vector3(3,0,0),6,1,0,0.65)
 local gap=false
 for _=1,60 do run(TICK) if next(live)==nil and #plays<16 then gap=true end end
 ok(not gap,'균열 V2: 재생 중 빈 화면 0 (다음 장을 먼저 걸고 앞 장은 0.03초 뒤)')
 ok(#plays==16 and maxLive<=2,'16장 · 동시 ≤ 2 '..maxLive)
 ok(near(plays[1].pos.x,0),'시작 피벗 0: 직선 가운데 3 - 길이/2 = 0 (꽂은 자리)')
 local sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=rift',1,true) then sf=x end end
 ok(sf:find('rule=fit',1,true)~=nil and sf:find('n=16',1,true)~=nil,'균열 V2 rule=fit · rise+잔광 0.65초에 16장')
 SkillEffects.FxGiantRiftSeq=''
end

-- ⑤ 내려찍기 두 층: 접점 앵커(ax·ay) · 왼쪽 볼 때 좌우 대칭 · FlipX만
do
 reset()
 SkillEffects.FxGiantSlamSeq=seq('w',12) SkillEffects.FxGiantSlamFront=seq('c',12)
 SkillEffects.FxGiantSlamOpts='w=256;h=160;ref=3.2;ax=0.9;ay=0.05;span=0.5' SkillEffects.FxGiantSlamFrontOpts='w=128;h=128;ref=3.2;ax=0.9;ay=0.4;span=0.3'
 giant.TransformComponent.WorldPosition=Vector3(10,0,0)
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),-1,3.2,3.2,0,0.35)
 run(1)
 local w,c=nil,nil for _,p in ipairs(plays) do if p.ruid=='w1' then w=p end if p.ruid=='c1' then c=p end end
 ok(w~=nil and c~=nil and w.at==c.at,'분출·접점 광 같은 순간')
 ok(near(w.pos.x,10-0.9) and near(w.pos.y,0.05) and near(c.pos.y,0.4),'왼쪽 볼 때 접점 = 발 - 0.9 (계약 ax 대칭) · 높이 ay')
 ok(w.opt.OrderInLayer==1 and c.opt.OrderInLayer==6,'큰 분출 몸 뒤 · 접점 광 몸 앞')
 ok(w.opt.FlipX==true and w.scale.x>0 and w.scale.y>0 and w.angle==0,'왼쪽: FlipX만 (배율 양수 · 회전 없음)')
 local n=0 for _,p in ipairs(plays) do if p.ruid:sub(1,1)=='w' then n=n+1 end end
 ok(n==12,'분출 12장 모두')
 reset()
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35)
 run(1)
 ok(plays[1].opt.FlipX==false and near(plays[1].pos.x,10.9),'오른쪽: 뒤집기 없음 · 발 + 0.9')
 SkillEffects.FxGiantSlamSeq='' SkillEffects.FxGiantSlamFront=''
end

-- ⑦ 대검·방패 full 아트 계약(속성 기본값 그대로 · RUID만 채움): 회전 400ms 루프 · 균열 300ms 시작 · 슬램 120ms 정렬 · 함성 t0
do
 local function onlyMs(prefix) local t={} for _,p in ipairs(plays) do if p.ruid:match('^'..prefix..'%d+$') then table.insert(t,p) end end return t end
 -- 회전: 뒤/앞 16장 × 25ms = 0.4초 한 바퀴 · 지름 3.2 = 캔버스 352px(cw)
 reset()
 SkillEffects.FxGiantSpinOpts=DEF.spin SkillEffects.FxGiantSpinBack=seq('gb',16) SkillEffects.FxGiantSpinFront=seq('gf',16)
 giant.TransformComponent.WorldPosition=Vector3(0,0,0)
 giant.TransformComponent.Scale=Vector3(1,1,1)
 SkillEffects:GiantMoveFxOn('spin',giant,Vector3(0,0,0),1,3.2,3.2,0,1.6) run(2)
 local f=onlyMs('gf')
 local b=onlyMs('gb')
 ok(#f>=63 and near(f[17].at-f[1].at,0.4,TICK+1e-9) and near(f[2].at-f[1].at,0.025,TICK+1e-9),'회전 full: 한 바퀴 = 서버 타격 간격(시험 gap 0.4 → 25ms) · 4바퀴')
 ok(near(f[1].scale.x,3.2/3.52) and f[1].scale.y>0 and f[1].angle==0 and near(b[1].scale.x,3.2/3.52),'지름 3.2 = 캔버스 352px · 상하 그대로 · 두 층 같은 배율')
 -- 10-31 갈래 F B 휠윈드 두 층: 칼날(blade) = 몸 root + 80px 위 × 몸 배율 · 몸 앞 / 먼지(dust) = 몸 root · 몸 뒤 · 같은 시각
 ok(near(f[1].pos.x,0) and near(f[1].pos.y,0.8) and f[1].opt.OrderInLayer==6,'칼날 층: root + (0, 80px × 1/100) = 0.8칸 위 · 몸 앞 '..f[1].pos.y)
 ok(near(b[1].pos.x,0) and near(b[1].pos.y,0) and b[1].opt.OrderInLayer==1 and b[1].at==f[1].at,'먼지 층: root 그대로 · 몸 뒤 · 칼날과 같은 순간')
 reset() giant.TransformComponent.Scale=Vector3(-0.66,0.66,1)
 SkillEffects:GiantMoveFxOn('spin',giant,Vector3(0,0,0),-1,3.0,3.0,0,0.3) run(1)
 f=onlyMs('gf')
 ok(near(f[1].pos.y,80*0.66/100) and near(f[1].pos.x,0) and f[1].opt.FlipX==false,'거울 몸(Scale.x<0): 칼날 높이 = 80px × |0.66| · x 0 · 좌우 뒤집기 없음')
 giant.TransformComponent.Scale=Vector3(1,1,1)
 SkillEffects.FxGiantSpinBack='' SkillEffects.FxGiantSpinFront=''
 -- 균열: 강타(첫 토막) 순간 시작 · 0.65초에 16장 · 발자국 488px = 6칸 · 왼쪽은 FlipX(뒤집힘 없음) · 시작점 = 꽂은 자리
 reset()
 SkillEffects.FxGiantRiftOpts=DEF.rift SkillEffects.FxGiantRiftSeq=seq('rf',16)
 SkillEffects:GiantMoveFx('rift',Vector3(-3,0,0),6,1,180,0.65) run(1)
 ok(#plays==16 and near(plays[16].at-plays[1].at,0.025*15,TICK+1e-9),'균열 B: 16장 · 장별 25ms (코덱스 FX_ms · 0.4초)')
 ok(near(plays[1].scale.x,6/4.88) and near(plays[1].scale.y,6/4.88),'발자국 488px = 6칸 (가로세로 같은 배율)')
 local pad=12*(6/4.88)/100
 ok(plays[1].angle==0 and plays[1].opt.FlipX==true and near(plays[1].pos.x,pad),'왼쪽: 각 0 + FlipX(분출이 아래로 뒤집히지 않음) · 피벗 = 꽂은 자리 + 앞 빈 12px(보이는 균열 시작 = 꽂은 자리)')
 reset()
 SkillEffects:GiantMoveFx('rift',Vector3(3,0,0),6,1,0,0.65) run(1)
 ok(plays[1].angle==0 and plays[1].opt.FlipX==false and near(plays[1].pos.x,-pad),'오른쪽: 그대로 · 피벗 = 꽂은 자리 - 12px')
 SkillEffects.FxGiantRiftSeq=''
 -- 슬램 B(10-31 갈래 F): 한 층 16장 t0 · 0~2 축광 = 몸 앞(orders 6) · 3~15 분출 = 몸 뒤 · 4번째 장 = 120ms = 몸 index 6 접점 = 서버 피해 · 접점 = root + (-30,+2)px × 몸 배율 (코덱스 contact (-30,-2))
 reset()
 SkillEffects.FxGiantSlamOpts=DEF.slam SkillEffects.FxGiantSlamFrontOpts=DEF.slamF
 SkillEffects.FxGiantSlamSeq=seq('sw',16) SkillEffects.FxGiantSlamFront=''
 ok(near(SkillEffects:GiantFxImpactSec('slam'),0.12),'슬램 그림 접점 = 4번째 장 시작 120ms (= 몸 index 6)')
 giant.TransformComponent.WorldPosition=Vector3(5,0,0) giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 local t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35) run(1)
 local w=onlyMs('sw')
 ok(#w==16 and w[1].ruid=='sw1' and near(w[1].at,t0) and near(w[4].at-t0,0.12,TICK+1e-9),'한 층 16장 t0 시작 · 4번째 장 120ms ±1화면 (뒤 층 지연 없음)')
 local lay=true for i=1,16 do if w[i].opt.OrderInLayer~=(i<=3 and 6 or 1) then lay=false end end
 ok(lay,'축광 1~3장 몸 앞(order 6) · 분출 4~16장 몸 뒤(order 1)')
 ok(near(w[16].at-w[4].at,0.03*12,TICK+1e-9),'분출 30ms씩 장별 시간')
 ok(near(w[1].pos.x,5-30*1.2/100) and near(w[1].pos.y,2*1.2/100) and near(w[1].scale.x,1.2) and w[1].opt.FlipX==false,'접점 = 발 + (-30,+2)px × 몸 배율 1.2 (왼쪽 방패 아래 · 위 +) · 그림도 몸 화소 밀도 · 원 방향')
 reset() giant.TransformComponent.Scale=Vector3(-1.2,1.2,1)
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35) run(1)
 w=onlyMs('sw')
 ok(near(w[1].pos.x,5+30*1.2/100) and w[1].opt.FlipX==true and w[1].scale.x>0,'거울 몸(Scale.x<0 · 오른쪽 봄): 접점 +30px · FlipX 같은 부호 (facing 인자 무관)')
 giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 SkillEffects.FxGiantSlamSeq='' SkillEffects.FxGiantSlamFront=''
 -- 함성: 12장 × 50ms t0 · 축광 동안 몸을 따라가다 6번째 장(250ms)부터 방사 원점 고정
 reset()
 SkillEffects.FxGiantRoarOpts=DEF.roar SkillEffects.FxGiantRoarSeq=seq('ro',12)
 giant.TransformComponent.WorldPosition=Vector3(0,0,0)
 t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6)
 for _=1,12 do run(0.05) local p=giant.TransformComponent.WorldPosition giant.TransformComponent.WorldPosition=Vector3(p.x+0.1,0,0) end
 run(1)
 local r=onlyMs('ro')
 ok(#r==12 and near(r[1].at,t0) and near(r[12].at-t0,0.55,TICK+1e-9),'함성 full: 12장 × 50ms · t0 시작(몸 시작과 같은 순간)')
 ok(r[3].pos.x>r[1].pos.x and near(r[6].pos.x,r[12].pos.x) and near(r[7].pos.x,r[6].pos.x),'축광(1~5장) 동안 몸을 따라가고 6번째 장부터 방사 원점 고정')
 SkillEffects.FxGiantRoarSeq=''
end
-- ⑧ 코덱스 리뷰 ddf96c05 후속: 함성 문양 좌표표 추적→고정 · 함성 축광 앞/방사 뒤 층 · 슬램 예약 재생 맵 이동 시 생략
do
 local function onlyMs(prefix) local t={} for _,p in ipairs(plays) do if p.ruid:match('^'..prefix..'%d+$') then table.insert(t,p) end end return t end
 -- 문양 좌표표(장별 몸 화소 · 예시값): 0~5 장마다 바뀌는 문양 위치를 따라가고 250ms(6번째 장)에 그 장 자리로 고정
 reset()
 SkillEffects.FxGiantRoarOpts=DEF.roar..';gxpx=10,12,14,16,18,20;gypx=100,102,104,106,108,110'
 SkillEffects.FxGiantRoarSeq=seq('rg',12)
 giant.TransformComponent.WorldPosition=Vector3(0,0,0) giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6)
 run(1)
 local r=onlyMs('rg')
 local track=true for i=1,6 do if not near(r[i].pos.x,(8+2*i)*0.012) or not near(r[i].pos.y,(98+2*i)*0.012) then track=false end end
 ok(track,'문양 추적: 1~6번째 장이 좌표표(몸 화소 × 1.2 ÷ 100) 그대로')
 local fixed=true for i=7,12 do if not near(r[i].pos.x,r[6].pos.x) or not near(r[i].pos.y,r[6].pos.y) then fixed=false end end
 ok(fixed,'250ms(6번째 장 · 몸 index 5)에 그 자리로 방사 원점 고정')
 reset() giant.TransformComponent.Scale=Vector3(-1.2,1.2,1) SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6) run(1)
 r=onlyMs('rg') ok(near(r[1].pos.x,-10*0.012) and r[1].opt.FlipX==true,'거울 몸: 문양 좌표 좌우 대칭 · FlipX')
 giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 -- 층: 축광 0~4 = 앞(order 6) · 방사 5~11 = 뒤(order 1)
 local lay=true for i=1,12 do if r[i].opt.OrderInLayer~=(i<=5 and 6 or 1) then lay=false end end
 ok(lay,'함성 층: 축광 1~5장 앞층 · 방사 6~12장 뒤층 (정본 behind_radial)')
 SkillEffects.FxGiantRoarOpts=DEF.roar SkillEffects.FxGiantRoarSeq=''
 -- 슬램 뒤 층 120ms 예약(first=4 계약 · B 기본 계약은 한 층 t0라 예약 없음 — 예약 경로는 계약으로 남아 있음): 그 사이 맵을 옮기면 재생 안 함 (앞 축광은 t0에 이미)
 reset()
 SkillEffects.FxGiantSlamOpts=DEF.slam..';first=4' SkillEffects.FxGiantSlamFrontOpts=DEF.slamF
 SkillEffects.FxGiantSlamSeq=seq('mw',16) SkillEffects.FxGiantSlamFront=seq('ms',3)
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35)
 run(0.05)
 local other={} me.CurrentMap=other SkillEffects.Entity.CurrentMap=other
 run(1)
 ok(#onlyMs('ms')>=1 and #onlyMs('mw')==0,'맵 이동 뒤 예약된 뒤 층(지면 분출) 생성 0 — 새 맵에 옛 좌표로 생기지 않음')
 me.CurrentMap=map SkillEffects.Entity.CurrentMap=map
 reset() SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35) run(0.05) giant.dead=true run(1)
 ok(#onlyMs('mw')==0,'앵커(거인)가 사라지면 예약 재생 안 함')
 giant.dead=nil
 SkillEffects.FxGiantSlamSeq='' SkillEffects.FxGiantSlamFront='' SkillEffects.FxGiantSlamOpts=DEF.slam
end
-- ⑨ B 문양 좌표(기본값 그대로 · 10-31 갈래 F): index 5 = 코덱스 glyph_latch (-91,-97)→(-91,+97) · 0~4 = B 몸 그림 실측 · ×몸 배율/100 · 거울 몸 x만 반전 · 250ms 고정 · 슬램 (-30,+2)
do
 local function onlyMs(prefix) local t={ } for _,p in ipairs(plays) do if p.ruid:match('^'..prefix..'%d+$') then table.insert(t,p) end end return t end
 local GX={ -57.6,-43.0,-61.9,-89.0,-93.2,-91 } local GY={ 80.2,77.5,89.9,116.9,93.1,97 }
 reset()
 SkillEffects.FxGiantRoarOpts=DEF.roar SkillEffects.FxGiantRoarSeq=seq('rq',12)
 giant.TransformComponent.WorldPosition=Vector3(2,1,0) giant.TransformComponent.Scale=Vector3(-1.2,1.2,1)
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6) run(1)
 local r=onlyMs('rq') local okr=true
 for i=1,6 do if not near(r[i].pos.x,2-GX[i]*0.012) or not near(r[i].pos.y,1+GY[i]*0.012) then okr=false end end
 ok(okr,'B 문양 좌표 6장 적용 · 오른쪽 몸(Scale.x<0)은 x 반전 (몸 |배율| 1.2 · 위 + 그대로)')
 local fixed=true for i=7,12 do if not near(r[i].pos.x,2-GX[6]*0.012) or not near(r[i].pos.y,1+GY[6]*0.012) then fixed=false end end
 ok(fixed,'250ms: index 5 좌표(코덱스 latch -91,+97) 적용한 세계 자리로 고정 · 이후 추적 없음')
 reset() giant.TransformComponent.Scale=Vector3(1.2,1.2,1) SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6) run(1)
 r=onlyMs('rq')
 ok(near(r[1].pos.x,2+GX[1]*0.012) and near(r[1].pos.y,1+GY[1]*0.012) and near(r[12].pos.x,2+GX[6]*0.012),'왼쪽 몸(Scale.x>0 · 원 그림 방향): 원 PNG x 그대로(방패 = 왼쪽 -x) · y 그대로')
 -- 지연 타이머 반례: 5번째 장(index 4)이 250ms 뒤(260ms)에 와도 그 좌표로 고정하지 않고 6번째 장에서 index 5 좌표로 고정
 reset() giant.TransformComponent.Scale=Vector3(-1.2,1.2,1)
 local base=_UtilLogic.ElapsedSeconds
 timerShift=function(due) if due>base+0.19 and due<base+0.21 then return base+0.26 end return due end
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6) run(1) timerShift=nil
 r=onlyMs('rq')
 ok(r[5].at-base>0.25 and near(r[5].pos.x,2-GX[5]*0.012) and near(r[5].pos.y,1+GY[5]*0.012),'지연된 5번째 장(260ms)은 자기 좌표(index 4)로 · 고정 아님')
 ok(near(r[6].pos.x,2-GX[6]*0.012) and near(r[6].pos.y,1+GY[6]*0.012) and near(r[12].pos.x,r[6].pos.x) and near(r[12].pos.y,r[6].pos.y),'6번째 장 도달에서 index 5 좌표로 고정 (시간·장 중 늦은 쪽)')
 SkillEffects.FxGiantRoarSeq='' giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 ok(SkillEffects:FxOpts(DEF.slam).aypx==2 and SkillEffects:FxOpts(DEF.slamF).aypx==2 and SkillEffects:FxOpts(DEF.slam).axpx==-30 and SkillEffects:FxOpts(DEF.slamF).axpx==-30,'슬램 접점 B (-30, +2) — 뒤·앞 계약 같은 부호')
end
-- ⑩ 몸 부착 FX 좌우 부호 (코덱스 c4a6c285 · f502/f504): 실제 렌더 몸(대역 Scale.x 부호 × FlipX)이 기준 — 대상 방향(facing) 아님 (B 좌표로 10-31 갱신)
do
 local function onlyMs(prefix) local t={ } for _,p in ipairs(plays) do if p.ruid:match('^'..prefix..'%d+$') then table.insert(t,p) end end return t end
 local K=0.66
 local GX={ -57.6,-43.0,-61.9,-89.0,-93.2,-91 }
 SkillEffects.FxGiantRoarOpts=DEF.roar SkillEffects.FxGiantRoarSeq=seq('ro',12)
 SkillEffects.FxGiantSlamOpts=DEF.slam SkillEffects.FxGiantSlamFrontOpts=DEF.slamF SkillEffects.FxGiantSlamSeq=seq('sw',16) SkillEffects.FxGiantSlamFront=seq('ss',3)
 giant.TransformComponent.WorldPosition=Vector3(0,0,0)
 -- ① 오른쪽 몸(Scale.x<0): 문양(원 그림 -x) → 세계 +x (6장 -91 → +0.601) · FlipX true
 reset() giant.TransformComponent.Scale=Vector3(-K,K,1) giant.SpriteRendererComponent.FlipX=false
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6) run(1)
 local r=onlyMs('ro')
 ok(near(r[6].pos.x,-GX[6]*K/100) and near(-GX[6]*K/100,0.601,0.001) and r[2].pos.x>0 and r[6].opt.FlipX==true and r[1].opt.FlipX==true,'오른쪽 몸: 함성 6장 x +0.601 · 원 -x 문양이 세계 +x · FlipX 같은 부호 '..r[6].pos.x)
 -- ② 왼쪽 몸(Scale.x>0): 반대 (-0.601 · FlipX false) — facing 인자를 반대로 줘도 몸 기준
 reset() giant.TransformComponent.Scale=Vector3(K,K,1)
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),-1,6,6,0,0.6) run(1)
 r=onlyMs('ro')
 ok(near(r[6].pos.x,GX[6]*K/100) and r[2].pos.x<0 and r[6].opt.FlipX==false,'왼쪽 몸: 함성 6장 x -0.601 · FlipX false (facing -1 무시)')
 -- ③ 슬램 axpx -30 같은 규칙: 오른쪽 몸 +0.198 · 왼쪽 몸 -0.198 · 앞 별(계약이 있으면)·뒤 분출 같은 접점·같은 FlipX
 reset() giant.TransformComponent.Scale=Vector3(-K,K,1)
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35) run(1)
 local w,st=onlyMs('sw'),onlyMs('ss')
 ok(near(w[1].pos.x,30*K/100) and near(st[1].pos.x,30*K/100) and near(30*K/100,0.198,0.001) and w[1].opt.FlipX==true and st[1].opt.FlipX==true and near(w[1].pos.y,2*K/100),'오른쪽 몸 슬램: 접점 x +0.198 · 앞 별·뒤 분출 일치 · FlipX true · y +2px')
 reset() giant.TransformComponent.Scale=Vector3(K,K,1)
 SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),-1,3.2,3.2,0,0.35) run(1)
 w,st=onlyMs('sw'),onlyMs('ss')
 ok(near(w[1].pos.x,-30*K/100) and near(st[1].pos.x,-30*K/100) and w[1].opt.FlipX==false and st[1].opt.FlipX==false,'왼쪽 몸 슬램: 접점 x -0.198 · FlipX false')
 -- ④ FlipX 합성 반전: Scale.x<0 이면서 SpriteRenderer.FlipX=true → 원 그림 방향(+) · 추적 중 몸이 돌면 다음 장부터 반영 · 고정 뒤엔 고정
 reset() giant.TransformComponent.Scale=Vector3(-K,K,1) giant.SpriteRendererComponent.FlipX=true
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,0,0),1,6,6,0,0.6)
 run(0.06) giant.SpriteRendererComponent.FlipX=false run(1)
 r=onlyMs('ro')
 ok(r[1].pos.x<0 and r[1].opt.FlipX==false and near(r[1].pos.x,GX[1]*K/100),'Scale.x<0 × FlipX = 원 방향: 1장 x = 원 PNG -57.6 그대로 · FlipX false')
 ok(near(r[3].pos.x,-GX[3]*K/100) and r[3].opt.FlipX==true and near(r[12].pos.x,-GX[6]*K/100) and r[12].opt.FlipX==true,'추적 중 몸이 돌면 다음 장부터 새 부호 (위치·FlipX 함께) · 고정 뒤 유지')
 giant.SpriteRendererComponent.FlipX=false giant.TransformComponent.Scale=Vector3(1.2,1.2,1)
 SkillEffects.FxGiantRoarSeq='' SkillEffects.FxGiantSlamSeq='' SkillEffects.FxGiantSlamFront=''
end
-- ⑪ 10-31 갈래 F B 전체 프레임 새 계약: 메테오 낙하/착지 나눔·유지 · 돌진 시작점 피벗·좌우 · X 베기 장별 30ms · 노바 한 층
do
 local function onlyMs(prefix) local t={ } for _,p in ipairs(plays) do if p.ruid:match('^'..prefix..'%d+$') then table.insert(t,p) end end return t end
 local M0,MO=SkillEffects.FxGiantFireMeteor,SkillEffects.FxGiantFireMeteorOpts
 ok(MO~='' and #Util:Frames(M0)==12,'메테오 B 기본값: 12장 + 계약')
 SkillEffects.FxGiantFireMeteor=seq('mt',12)
 reset() local t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('meteor_fall',Vector3(0,0,0),3.6,3.6,0,0.5) run(2)
 local f=onlyMs('mt')
 local pl=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=meteor_fall',1,true) then pl=x end end
 ok(#f==6 and f[1].ruid=='mt1' and f[6].ruid=='mt6' and near(f[1].at,t0) and near(f[6].at-t0,0.25,TICK+1e-9) and f[1].opt.OrderInLayer==6,'메테오 낙하 = 1~6장(impact 7 앞) · 50ms씩 · t0 · 몸 앞')
 ok(pl~=nil and near(tonumber(pl:match('elapsed=([%d%.]+)')),0.5,TICK+0.031),'마지막 낙하 장을 착지 순간(fall 0.5초)까지 유지 '..tostring(pl))
 reset() t0=_UtilLogic.ElapsedSeconds
 SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5) run(3)
 f=onlyMs('mt')
 pl=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx play kind=meteor_land',1,true) then pl=x end end
 ok(#f==6 and f[1].ruid=='mt7' and f[6].ruid=='mt12' and near(f[1].at,t0) and f[1].opt.OrderInLayer==1,'메테오 착지 = 7~12장 · 부른 순간 바로(앞 장 시간만큼 늦추지 않음) · 몸 뒤')
 ok(pl~=nil and near(tonumber(pl:match('elapsed=([%d%.]+)')),1.5,TICK+0.031),'그을림 마지막 장을 scorch 1.5초까지 유지 '..tostring(pl))
 ok(near(f[1].scale.x,(100/56)*3.6/4.0),'크기 = ref 4.0칸 그림을 지름 3.6에 (옛 계약 그대로)')
 SkillEffects.FxGiantFireMeteor=M0
 -- 돌진: 피벗(그림 오른끝) = 시작점 · 그림 -x가 돌진 방향 · 세운 채 좌우만
 local D0=SkillEffects.FxGiantDashSeq
 ok(#Util:Frames(D0)==12,'돌진 B 기본값 12장')
 SkillEffects.FxGiantDashSeq=seq('ds',12)
 reset() SkillEffects:GiantMoveFx('dash',Vector3(-2,0,0),4,0.8,180,0.4) run(1)
 f=onlyMs('ds')
 ok(#f==12 and near(f[1].pos.x,0) and f[1].angle==0 and f[1].opt.FlipX==false and near(f[2].at-f[1].at,0.025,TICK+1e-9),'왼쪽 돌진(0 → -4): 피벗 = 시작점 x 0 · 각 0 · 뒤집기 없음(그림 원 방향 = 왼쪽) · 25ms')
 ok(near(f[1].scale.x,4/2.56) and near(f[1].scale.y,0.8/0.96),'길이 4칸·폭 0.8칸으로 늘임 (256×96)')
 reset() SkillEffects:GiantMoveFx('dash',Vector3(2,0,0),4,0.8,0,0.4) run(1)
 f=onlyMs('ds')
 ok(near(f[1].pos.x,0) and f[1].angle==0 and f[1].opt.FlipX==true and f[1].scale.x>0,'오른쪽 돌진(0 → 4): 피벗 = 시작점 · 각 0 + FlipX (상하 뒤집힘 없음)')
 reset() SkillEffects:GiantMoveFx('dash',Vector3(0,2,0),4,0.8,90,0.4) run(1)
 f=onlyMs('ds')
 ok(near(f[1].pos.x,0,1e-6) and near(f[1].pos.y,0,1e-6),'위로 돌진: 피벗 = 시작점 (0,0)')
 SkillEffects.FxGiantDashSeq=D0
 -- X 베기: 장별 30ms · 교차점 그대로
 local X0=SkillEffects.FxGiantFlurry
 ok(#Util:Frames(X0)==12,'X 베기 B 기본값 12장')
 SkillEffects.FxGiantFlurry=seq('xf',12)
 reset() SkillEffects:GiantMoveFx('flurry',Vector3(1,1,0),2.3,2.3,0,0.15) run(1)
 f=onlyMs('xf')
 ok(#f==12 and near(f[12].at-f[1].at,0.03*11,TICK+1e-9) and near(f[1].pos.x,1) and near(f[1].pos.y,1) and f[1].opt.OrderInLayer==6,'X 베기 12장 × 30ms · 접점 자리 그대로 · 몸 앞')
 SkillEffects.FxGiantFlurry=X0
 -- 노바 B: 앞 층 비움 → 한 층(몸 뒤) · 장별 ms · 정점 160ms
 local N0,NF=DEF.novaV2,DEF.novaV2F
 ok(NF=='' and #Util:Frames(N0)==16,'노바 B 기본값: 16장 한 층 · 앞 층 비움')
 SkillEffects.FxGiantNovaV2=seq('nb',16)
 ok(near(SkillEffects:GiantFxImpactSec('nova'),0.16),'노바 정점 = 160ms (index 6)')
 reset() SkillEffects:GiantMoveFx('nova',Vector3(0,0,0),7.5,7.5,0,0.16) run(2)
 f=onlyMs('nb')
 ok(#f==16 and f[1].opt.OrderInLayer==1 and near(f[7].at-f[1].at,0.16,TICK+1e-9),'노바 한 층 16장 · 몸 뒤 · 7번째 장 160ms')
 SkillEffects.FxGiantNovaV2=''
 -- 슬램 impact drift 검사(10-31 메이커 G3 오경보): 부르는 쪽 seconds = 실제 피해 시각 0.12면 로그 없음 · 다른 값(옛 0.35)이면 그대로 잡는다(반례)
 SkillEffects.FxGiantSlamOpts=DEF.slam SkillEffects.FxGiantSlamSeq=seq('dr',16) SkillEffects.FxGiantSlamFront=''
 local function drift() for _,x in ipairs(logs) do if x:find('[VRF] giant fx impact drift kind=slam',1,true) then return x end end return nil end
 reset() SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.12) run(1)
 f=onlyMs('dr')
 ok(drift()==nil and #f==16 and near(f[4].at-f[1].at,0.12,TICK+1e-9),'seconds = 피해 시각 0.12: impact drift 로그 없음 · 재생은 그대로 16장·접점 120ms')
 reset() SkillEffects:GiantMoveFxOn('slam',giant,Vector3(0,0,0),1,3.2,3.2,0,0.35) run(1)
 ok(drift()~=nil and drift():find('at=0.120 hit=0.350',1,true)~=nil,'반례: seconds 0.35(옛 유지 시간)면 그림 접점 0.120과 어긋남을 잡는다 '..tostring(drift()))
 SkillEffects.FxGiantSlamSeq=''
end
-- ⑥ 새 그림이 비면 지금 그림 그대로 (옛 66장 경로)
do
 reset()
 SkillEffects:GiantMoveFxOn('spin',giant,Vector3(0,0.3,0),1,3.2,3.2,0,1.6)
 run(2)
 local sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=spin ',1,true) then sf=x end end
 ok(plays[1].ruid=='o1' and sf:find('n=6 sec=0.067 rule=cycle',1,true)~=nil and plays[1].opt.OrderInLayer==6,'회전: 지금 6장 · 0.4/6 · 몸 앞 그대로')
 reset()
 SkillEffects:GiantMoveFx('slam',Vector3(1,0,0),3.2,3.2,0,0.35)
 run(1)
 sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=slam ',1,true) then sf=x end end
 ok(plays[1].ruid=='s1' and #plays==4 and sf:find('hold=true',1,true)~=nil,'내려찍기: 지금 4장 · 마지막 장 유지')
 reset()
 SkillEffects:GiantMoveFx('rift',Vector3(3,0,0),6,1,0,0.65)
 run(1)
 sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=rift ',1,true) then sf=x end end
 ok(#plays==4 and sf:find('sec=0.083 rule=sec',1,true)~=nil,'균열: 지금 4장 rise/3')
 reset()
 local M0,MO=SkillEffects.FxGiantFireMeteor,SkillEffects.FxGiantFireMeteorOpts
 SkillEffects.FxGiantFireMeteor=seq('m',6) SkillEffects.FxGiantFireMeteorOpts=''   -- 옛 6장 경로 (B 계약 없음)
 SkillEffects:GiantMoveFx('meteor_land',Vector3(0,0,0),3.6,3.6,0,1.5)
 run(2)
 SkillEffects.FxGiantFireMeteor=M0 SkillEffects.FxGiantFireMeteorOpts=MO
 sf=nil for _,x in ipairs(logs) do if x:find('[VRF] giant fx kind=meteor_land ',1,true) then sf=x end end
 ok(sf:find('n=4 sec=0.100 rule=sec',1,true)~=nil,'메테오 착지 3~6장 0.1초 그대로')
 reset()
 SkillEffects:GiantMoveFxOn('roar',giant,Vector3(0,1.7,0),1,0.8,0.8,0,0.5)
 run(1)
 ok(#plays==1 and plays[1].ruid==SkillEffects.FxGiantRoar,'함성: 새 그림 없으면 지금 고리 한 장')
end
print(string.format('[quality/giant_fx_playback] 48 V2 %d checks: frame rule spec-first (sec/impact/cycle/span/fit > floor 0.04) · nova 16/16 no skip impact@burst peak fade · spin 2 layers 4 laps continuous follow no vertical flip · 0.03 overlap no blank · slam contact anchor facing FlipX · legacy unchanged · B full216 (spin blade/dust anchors · slam one layer orders · glyph track · meteor split+hold · dash start pivot · flurry 30ms · nova one layer)', checks))
