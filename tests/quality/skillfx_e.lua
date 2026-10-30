-- 10-31 실플레이 피드백 갈래 E (스킬 효과 연결·가시성 보정 · docs/evidence/2026-10-31-skillfx-audit 제안 A·B·C·D) — 실제 본문으로:
--   ① Util.PlayFramesHold·PlayFrames: 첫 장이 frameSec 동안 보인다 · 마지막 장을 hold까지 잡는다 · 장 건너뜀 0 · 늦은 타이머에도 밀림이 쌓이지 않음 · 옅어짐 단계 · instigator가 사라지면 지움
--      반례: 예전 SetTimerRepeat 판(첫 호출이 바로 와 첫 장을 지움 · 메이커 10-30 S48-SPIN-PLAYBACK-01)을 같은 타이머 대역에서 돌리면 첫 장 0초 · 4장×0.08 = 0.24초
--   ② 저주 바닥 문장(M14~M19): 6종 × 4장 연결 · 0.7초 + 마지막 장 0.3초 + 옅어짐 · 층 MapLayer0 1 · 문장 없는 혼란·쇠퇴 입자에도 SortingLayer · 혼란 0.8칸 · 쇠퇴 녹 주황
--   ③ 머리 위 표식 배율 0.9(약 44px) · 저주 직후 0.3초 1.3배 → 1배 · 스킬 아이콘 대체도 같은 크기 · 낙인 몸 색(옅은 자홍)·둔화와 겹침·풀림
--   ④ 쌍칼 돌진 자취 크기 = 지금 쓰는 그림(GameConst.FxGiantDash)의 등록 크기(art_sprites) · ⑤ 뼈 갑옷 고리 최저 투명도 0.55 · ⑥ 납품 61장 GameConst·표 연결과 RUID 중복 0
-- 엔진 효과·입자·타이머는 대역 — 실제 화면(크기·색·층)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames,KeyFrames,FramePlan,PlayFramesHold,PlayFrames,PlayFramesLoop
-- @source SkillEffects Skill/SkillEffects.mlua FxOpts,GiantFxSpec,FramesFx,CurseShape,CurseSigilScale
-- @source MonsterStatus Monster/MonsterStatus.mlua MarkerScaleAt,IsAmpShown,IsChillShown
-- @source MonsterTraits Monster/MonsterTraits.mlua TintTick
-- @source PlayerStats Player/PlayerStats.mlua ArmorRingAlpha
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local TICK=1/60
local V3M={} V3M.__add=function(a,b) return Vector3(a.x+b.x,a.y+b.y,a.z+b.z) end V3M.__sub=function(a,b) return Vector3(a.x-b.x,a.y-b.y,a.z-b.z) end
function Vector3(x,y,z) return setmetatable({x=x,y=y,z=z},V3M) end
function isvalid(x) return x~=nil and x~=false and x.dead~=true end
Environment={IsPublishedPlay=function() return false end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}
-- 타이머 대역: 예정 시각 뒤 첫 화면(60Hz)에 온다 · SetTimerRepeat는 첫 호출이 바로(다음 화면) 온다 (메이커 10-30 실측)
local timers={}
timerShift=nil
local function addTimer(fn,delay,rep)
 local due=_UtilLogic.ElapsedSeconds+delay
 if timerShift then due=timerShift(due) end
 local t={at=math.ceil(due/TICK-1e-9)*TICK,fn=fn,rep=rep,id=#timers+1}
 table.insert(timers,t) return t.id
end
local cleared={}
_TimerService={
 SetTimerOnce=function(_,fn,delay) return addTimer(fn,delay,nil) end,
 SetTimerRepeat=function(_,fn,interval) return addTimer(fn,TICK,interval) end,
 ClearTimer=function(_,id) cleared[id]=true end}
local function run(sec)
 local stop=_UtilLogic.ElapsedSeconds+sec
 while true do
  local best,bi=nil,nil
  for i,t in ipairs(timers) do if t.at<=stop+1e-9 and (best==nil or t.at<best.at-1e-12) then best,bi=t,i end end
  if best==nil then break end
  table.remove(timers,bi)
  _UtilLogic.ElapsedSeconds=math.max(_UtilLogic.ElapsedSeconds,best.at)
  if not cleared[best.id] then
   if best.rep then local nt={at=best.at+math.max(TICK,math.ceil(best.rep/TICK-1e-9)*TICK),fn=best.fn,rep=best.rep,id=best.id} table.insert(timers,nt) end
   best.fn()
  end
 end
 _UtilLogic.ElapsedSeconds=stop
end
-- 효과 대역: 건 시각·지운 시각
local plays,bySerial,serialN={},{},0
_EffectService={
 PlayEffect=function(_,ruid,parent,pos,angle,scale,loop,opt) serialN=serialN+1 local p={ruid=ruid,pos=pos,scale=scale,opt=opt,at=_UtilLogic.ElapsedSeconds,off=nil,serial=serialN} table.insert(plays,p) bySerial[serialN]=p return serialN end,
 RemoveEffect=function(_,s) local p=bySerial[s] if p and p.off==nil then p.off=_UtilLogic.ElapsedSeconds end end}
local particles={}
_ParticleService={PlayBasicParticle=function(_,kind,parent,pos,rot,scale,loop,opt) table.insert(particles,{kind=kind,pos=pos,scale=scale,opt=opt}) return #particles end,RemoveParticle=function() end}
BasicParticleType=setmetatable({},{__index=function(_,k) return k end})
local function reset() plays={} bySerial={} particles={} logs={} timers={} cleared={} _UtilLogic.ElapsedSeconds=0 timerShift=nil end
local function shownFor(p) return (p.off or 99)-p.at end
local map={}
local function seq(prefix,n) local t={} for i=1,n do t[i]=prefix..i end return table.concat(t,'|') end
local function f3(x) return string.format("%.3f", x or -1) end

-- ① FramePlan (순수 계산)
do
 local p=Util:FramePlan(4,0.175,0.475,0.3)
 ok(#p.steps==4+Util.FrameFadeSteps,'4장 + 옅어짐 단계')
 ok(near(p.steps[1].at,0) and near(p.steps[2].at,0.175) and near(p.steps[4].at,0.525),'장 i는 (i-1)×frameSec — 첫 장이 0~0.175초 동안 보인다')
 ok(near(p.holdAt,0.525) and near(p.clearAt,0.525+0.475+0.3),'마지막 장 0.475초 잡고 0.3초 옅어짐 → 1.3초에 지움')
 ok(p.steps[5].idx==4 and p.steps[5].alpha<1 and p.steps[#p.steps].alpha<p.steps[5].alpha and near(p.steps[5].at,1.0),'옅어짐은 마지막 장 그대로 · 투명도만 내려간다')
 local one=Util:FramePlan(1,0.08,0.08,0)
 ok(#one.steps==1 and near(one.clearAt,0.08),'한 장짜리도 frameSec 동안 보인다 (예전 0초)')
 local short=Util:FramePlan(4,0.1,0.02,0)
 ok(near(short.clearAt,0.4),'hold가 frameSec보다 짧으면 마지막 장도 frameSec')
end
local function windows()
 -- 장마다 보인 구간: 다음 장이 뜰 때까지 · 마지막 장은 지울 때까지
 local w={}
 for i,p in ipairs(plays) do
  local nxt=plays[i+1]
  local stop=p.off or 99
  if nxt and nxt.at<stop then stop=nxt.at end
  w[i]={ruid=p.ruid,from=p.at,len=stop-p.at}
 end
 return w
end

-- 예전 판 (반례 기준 · 10-30까지의 Util.PlayFrames 본문 그대로 · SetTimerRepeat 첫 호출이 바로 온다)
local function OldPlayFrames(ruids, instigator, pos, rot, scale, frameSec, tint, order)
 local list = Util:Frames(ruids)
 if #list == 0 or not isvalid(instigator) then return end
 local i = 1
 local serial = _EffectService:PlayEffect(list[1], instigator, pos, rot, scale, true, { SortingLayer = "MapLayer0", OrderInLayer = order, Color = tint })
 local timer = 0
 timer = _TimerService:SetTimerRepeat(function()
  if serial ~= 0 then _EffectService:RemoveEffect(serial) serial = 0 end
  i = i + 1
  if i > #list or not isvalid(instigator) then _TimerService:ClearTimer(timer) return end
  serial = _EffectService:PlayEffect(list[i], instigator, pos, rot, scale, true, { SortingLayer = "MapLayer0", OrderInLayer = order, Color = tint })
 end, frameSec)
end

-- ① 반례: 예전 판은 첫 장이 0초 · 전체 (장 수 − 1) × 간격
do
 reset()
 OldPlayFrames(seq('s',4),map,Vector3(0,0,0),0,Vector3(1,1,1),0.08,Color(1,1,1,1),20)
 run(2)
 local w=windows()
 ok(w[1].len<TICK+1e-6,'반례 확인: 예전 판 첫 장은 한 화면도 안 남는다 ('..f3(w[1].len)..'초)')
 local total=(plays[#plays].off or 0)-plays[1].at
 ok(total<=0.24+2*TICK,'반례 확인: 예전 판 혼 먹힘 4장×0.08 = 0.24초 안팎 ('..f3(total)..')')
end

-- ① 새 판: PlayFrames(4장 0.08) — 모든 장 0.08초 · 순서 · 건너뜀 0 · 마지막 장도 0.08
do
 reset()
 Util:PlayFrames(seq('s',4),map,Vector3(0,0,0),0,Vector3(1,1,1),0.08,Color(1,1,1,1),20)
 run(2)
 local w=windows()
 ok(#plays==4,'4장 모두 건다 (장 건너뜀 0)')
 for i=1,4 do ok(plays[i].ruid=='s'..i,'순서 '..i) end
 ok(w[1].len>=0.08-1e-6,'첫 장이 frameSec(0.08) 이상 보인다 ('..f3(w[1].len)..')')
 for i=2,3 do ok(w[i].len>=0.08-TICK-1e-6 and w[i].len<=0.08+TICK+1e-6,'가운데 장 '..i..' ≈ 0.08 (±1화면)') end
 ok(w[4].len>=0.08-1e-6,'마지막 장도 frameSec 이상')
 ok(plays[4].off~=nil and plays[4].off<=0.32+TICK+1e-6,'4장 × 0.08 = 0.32초에 지움 (±1화면)')
 for i=1,3 do ok(plays[i].off~=nil and plays[i].off>=plays[i+1].at-1e-9,'앞 장은 다음 장이 뜬 뒤에 지운다 (빈 화면 없음) '..i) end
end

-- ① PlayFramesHold: 저주 문장 계약(0.175 · 잡기 0.475 · 옅어짐 0.3) · 마지막 장 유지 · 옅어짐 단계 · 층
do
 reset()
 Util:PlayFramesHold(seq('g',4),map,Vector3(1,2,0),0,Vector3(2,2,1),0.175,0.475,0.3,Color(1,1,1,1),1)
 run(3)
 local w=windows()
 ok(#plays==4+Util.FrameFadeSteps,'4장 + 옅어짐 '..Util.FrameFadeSteps..'단계')
 ok(w[1].len>=0.175-1e-6,'첫 장 0.175초 이상')
 local lastShown=plays[5].at-plays[4].at
 ok(lastShown>=0.475-TICK-1e-6 and lastShown<=0.475+TICK+1e-6,'마지막 장(옅어지기 전) 0.475초 ±1화면 ('..f3(lastShown)..')')
 ok(plays[5].ruid=='g4' and plays[#plays].ruid=='g4','옅어짐도 마지막 장 그림 그대로')
 ok(plays[5].opt.Color.a<1 and plays[#plays].opt.Color.a<plays[5].opt.Color.a,'옅어짐 단계마다 투명도가 내려간다')
 local endAt=plays[#plays].off
 ok(endAt~=nil and near(endAt,1.3,TICK+1e-6),'1.3초에 모두 지움 ('..f3(endAt)..')')
 for _,p in ipairs(plays) do ok(p.opt.SortingLayer=='MapLayer0' and p.opt.OrderInLayer==1,'층 MapLayer0 1') end
 local beforeFade=plays[5].at-plays[1].at
 ok(beforeFade>=0.6+0.3-1e-6 and beforeFade<=0.8+0.3+TICK,'바닥 문장 0.6~0.8초 + 마지막 장 0.3초 (옅어지기 전 '..f3(beforeFade)..'초)')
end

-- ① 늦은 타이머(예정 + 0.03초): 장 건너뜀 0 · 끝 시각 밀림이 쌓이지 않음
do
 reset()
 timerShift=function(due) return due+0.03 end
 Util:PlayFramesHold(seq('d',6),map,Vector3(0,0,0),0,Vector3(1,1,1),0.09,0.29,0,Color(1,1,1,1),6)
 run(3)
 ok(#plays==6,'늦어도 6장 모두')
 for i=1,6 do ok(plays[i].ruid=='d'..i,'늦어도 순서 '..i) end
 local endAt=plays[6].off or 99
 ok(endAt<=0.45+0.29+0.03+2*TICK+1e-6,'끝 시각 밀림이 장마다 쌓이지 않는다 ('..f3(endAt)..')')
end

-- ① instigator가 사라지면 다음 장을 걸지 않고 지운다
do
 reset()
 local inst={}
 Util:PlayFramesHold(seq('x',4),inst,Vector3(0,0,0),0,Vector3(1,1,1),0.1,0.1,0,Color(1,1,1,1),6)
 run(0.15)
 inst.dead=true
 run(1)
 ok(#plays==2,'사라진 뒤엔 새 장 0')
 ok(plays[2].off~=nil and plays[2].off<0.25,'떠 있던 장은 지운다')
end

-- ① PlayFramesLoop(부르는 곳 없음 · 같은 방식): 첫 장 frameSec · seconds 동안 반복 · 끝나면 지움
do
 reset()
 Util:PlayFramesLoop(seq('l',3),map,Vector3(0,0,0),0,Vector3(1,1,1),0.1,0.6,Color(1,1,1,1),6)
 run(2)
 local w=windows()
 ok(w[1].len>=0.1-1e-6,'반복판 첫 장도 frameSec')
 ok(#plays==6 and plays[4].ruid=='l1','0.6초 = 6장 (3장 두 바퀴)')
 ok(plays[#plays].off~=nil and plays[#plays].off<=0.6+TICK+1e-6,'seconds에 지움')
end

-- 실제 GameConst 문자열 속성 (연결한 RUID 그대로)
_GameConst={}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local k,v=line:match('^    property string (%w+) = "([^"]*)"')
 if k then _GameConst[k]=v end
end
local function csvRows(path)
 local rows={}
 for line in io.lines(path) do table.insert(rows,line) end
 return rows
end
local art={}
local artRuidCount={}
for i,line in ipairs(csvRows('data/art_sprites.csv')) do
 if i>1 then
  local name,kind,w,h,ruid=line:match('^([^,]+),([^,]+),([^,]+),([^,]+),([0-9a-f]+)')
  if name then art[ruid]={name=name,kind=kind,w=tonumber(w),h=tonumber(h)} artRuidCount[ruid]=(artRuidCount[ruid] or 0)+1 end
 end
end
local icons={}
for _,line in ipairs(csvRows('data/ui_icons.csv')) do
 local key,ruid=line:match('^([^,]+),([0-9a-f]+),')
 if key then icons[key]=ruid end
end
local me={CurrentMap=map,TransformComponent={WorldPosition=Vector3(0,0,0)}}
_UserService={LocalPlayer=me}
_Util=Util

-- ⑥ 납품 61장 연결: GameConst 6자리 + 바닥 문장 6종×4 + 서리 표식 · RUID 중복 0 · 표 등록
do
 local all={}
 local function take(list,n,name)
  ok(#list==n,name..' '..n..'장 ('..#list..')')
  for _,r in ipairs(list) do ok(r:match('^[0-9a-f]+$') and #r==32,name..' RUID 형식') table.insert(all,r) end
 end
 take(Util:Frames(_GameConst.FxSkillHexBurst),6,'저주 불꽃 폭발')
 take(Util:Frames(_GameConst.FxSkillShatter),6,'파쇄')
 take(Util:Frames(_GameConst.FxSkillBoneStorm),8,'뼈 폭풍')
 take(Util:Frames(_GameConst.FxSkillShadowRise),6,'그림자 솟음')
 take(Util:Frames(_GameConst.FxSkillElitePromote),6,'정예 승격')
 take(Util:Frames(_GameConst.FxSkillCurseBreak),4,'저주 깨짐')
 for _,k in ipairs({'amp','weaken','terror','thorn','lifetap','resist'}) do take(Util:KeyFrames(_GameConst.FxSkillCurseSigils,k),4,'바닥 문장 '..k) end
 ok(#Util:KeyFrames(_GameConst.FxSkillCurseSigils,'confuse')==0 and #Util:KeyFrames(_GameConst.FxSkillCurseSigils,'decay')==0,'혼란·쇠퇴는 문장 그림 없음 (입자 그대로)')
 ok(icons.mark_frost~=nil and #icons.mark_frost==32,'서리 표식 mark_frost ui_icons 등록')
 table.insert(all,icons.mark_frost)
 local seen={}
 for _,r in ipairs(all) do ok(not seen[r],'RUID 중복 0') seen[r]=true end
 ok(#all==61,'연결 61장 ('..#all..')')
 for i=1,60 do local a=art[all[i]] ok(a~=nil and a.kind=='effect' and artRuidCount[all[i]]==1,'art_sprites 효과 행 1개 '..all[i]) end
 ok(icons.mark_backplate~=nil and #icons.mark_backplate==32 and not seen[icons.mark_backplate],'표식 뒤판 mark_backplate 등록 (61장과 겹치지 않음)')
end

-- ② 저주 시전: 바닥 문장(낙인) · 혼란·쇠퇴 입자 층·크기·색
SkillEffects.Entity=me
do
 reset()
 SkillEffects:CurseShape('amp',Vector3(3,1,0),1.5)
 run(3)
 local sig=Util:KeyFrames(_GameConst.FxSkillCurseSigils,'amp')
 ok(#plays==4+Util.FrameFadeSteps,'낙인 문장 4장 + 옅어짐')
 for i=1,4 do ok(plays[i].ruid==sig[i],'낙인 문장 장 '..i..' = 연결 RUID') end
 for _,p in ipairs(plays) do ok(p.opt.SortingLayer=='MapLayer0' and p.opt.OrderInLayer==SkillEffects.CurseSigilOrder and SkillEffects.CurseSigilOrder==1,'문장 층 MapLayer0 1') end
 ok(near(plays[1].scale.x,plays[1].scale.y) and near(plays[1].scale.x,SkillEffects:CurseSigilScale('amp',1.5)),'문장 배율 가로=세로 · 보이는 반경 = 저주 반경 (아래 ② 크기)')
 local w=windows()
 ok(w[1].len>=SkillEffects.CurseSigilFrameSec-1e-6,'문장 첫 장도 보인다')
 local beforeFade=plays[5].at-plays[1].at
 ok(beforeFade>=0.9-1e-6 and beforeFade<=1.1+TICK,'문장 0.7초 + 마지막 장 0.3초 ('..f3(beforeFade)..')')
 ok(#particles==0,'문장이 있으면 예전 입자 없음')
end
do
 reset()
 SkillEffects:CurseShape('confuse',Vector3(0,0,0),1.5)
 local p=particles[1]
 ok(p~=nil and p.kind=='StarVortex' and near(p.scale.x,0.8,0.01),'혼란 별 0.6 → 0.8칸 ('..f3(p and p.scale.x)..')')
 ok(p.opt.SortingLayer=='MapLayer0' and p.opt.OrderInLayer==SkillEffects.CurseFxOrder,'저주 시전 입자 층 명시')
 reset()
 SkillEffects:CurseShape('decay',Vector3(0,0,0),1.5)
 ok(#particles==2,'쇠퇴 = 김 + 먼지')
 local c=particles[1].opt.Color
 ok(c.r>c.g and c.g>c.b and c.r>=0.75,'쇠퇴 김 녹슨 주황 (예전 흙빛 0.56,0.46,0.3)')
 local d=particles[2].opt.Color
 ok(math.abs(d.r-d.g)<0.05 and math.abs(d.g-d.b)<0.05,'쇠퇴 먼지 회색')
 for _,q in ipairs(particles) do ok(q.opt.SortingLayer=='MapLayer0','쇠퇴 입자 층 명시') end
end

-- ② 저주 불꽃 폭발(P07): 6장 × 0.09 + 마지막 장 0.29 + 옅어짐 0.2 — 첫 장 포함
do
 reset()
 local f=SkillEffects.HexBurstFrameSec
 SkillEffects:FramesFx(_GameConst.FxSkillHexBurst,Vector3(0,0,0),2,f,f+SkillEffects.HexBurstHoldSec,SkillEffects.HexBurstFadeSec)
 run(3)
 local list=Util:Frames(_GameConst.FxSkillHexBurst)
 ok(plays[1].ruid==list[1] and plays[6].ruid==list[6],'폭발 6장 첫 장부터')
 local beforeFade=plays[7].at-plays[1].at
 ok(beforeFade>=0.5 and beforeFade<=0.6+0.2+TICK,'폭발 0.5~0.6초 + 마지막 장 유지 ('..f3(beforeFade)..')')
end

-- ③ 머리 위 표식 배율 · 처음 뜰 때 1.3배 → 0.3초에 1배
do
 local k0=MonsterStatus:MarkerScaleAt(true,0)
 ok(near(k0,0.9*1.3),'처음 = 0.9 × 1.3')
 ok(MonsterStatus:MarkerScaleAt(true,0.15)<k0 and MonsterStatus:MarkerScaleAt(true,0.15)>0.9,'0.15초 = 줄어드는 중')
 ok(near(MonsterStatus:MarkerScaleAt(true,0.3),0.9) and near(MonsterStatus:MarkerScaleAt(true,5),0.9),'0.3초 뒤 0.9')
 local px=32*MonsterStatus:MarkerScaleAt(true,1)/100*150
 ok(px>=40 and px<=48,'문양 화면 크기 약 44px (줌100 · '..f3(px)..'px · 예전 0.56 = 27px)')
 ok(near(128*MonsterStatus.MarkerIconScale,32*MonsterStatus.MarkerScale),'스킬 아이콘 대체도 같은 크기')
 ok(MonsterStatus.MarkerGap>=32*MonsterStatus.MarkerScale/100,'커진 표식이 줄지어도 겹치지 않는 간격')
end

-- ③ 낙인 몸 색 (둔화와 같은 경로 · 거리 제한 없음)
do
 local status=setmetatable({CurseMask=1},{__index=MonsterStatus})
 local sprite={Color=Color(1,1,1,1)}
 MonsterTraits.Entity={Name='mob',SpriteRendererComponent=sprite,GetComponent=function(_,n) if n=='script.MonsterStatus' then return status end return nil end}
 _GameData={GetMonsterState=function() return nil end}
 MonsterTraits.AppliedTint='' MonsterTraits.FlashUntil=0 MonsterTraits.TintSync=''
 ok(status:IsAmpShown() and not status:IsChillShown(),'낙인 비트 1')
 MonsterTraits:TintTick()
 ok(near(sprite.Color.r,1) and near(sprite.Color.g,0.7) and near(sprite.Color.b,0.92),'낙인 = 옅은 자홍 곱')
 status.CurseMask=1+2048
 MonsterTraits:TintTick()
 ok(near(sprite.Color.r,0.62) and near(sprite.Color.g,0.8*0.7) and near(sprite.Color.b,0.92),'낙인 + 둔화 = 두 색 곱')
 status.CurseMask=0
 MonsterTraits:TintTick()
 ok(near(sprite.Color.r,1) and near(sprite.Color.g,1) and near(sprite.Color.b,1),'풀리면 흰색으로')
 MonsterTraits.AmpTint=''
 status.CurseMask=1
 MonsterTraits:TintTick()
 ok(near(sprite.Color.g,1),'AmpTint 빈 값이면 끔 (되돌리기)')
 MonsterTraits.AmpTint='1,0.7,0.92'
end

-- ④ 쌍칼 돌진 자취(S16): 계약 크기 = 지금 쓰는 그림의 등록 크기
do
 local spec=SkillEffects:GiantFxSpec('dash')
 local b=SkillEffects.FxGiantDashSeq~=''   -- 10-31 갈래 F: B 전체 프레임 12장이 차 있으면 그 그림 (비면 GameConst 48 연속본 4장)
 local list=Util:Frames(spec.ruids)
 ok(#list==(b and 12 or 4) and spec.ruids==(b and SkillEffects.FxGiantDashSeq or _GameConst.FxGiantDash),'돌진 자취 '..#list..'장 (B면 12 · 옛 4)')
 for _,r in ipairs(list) do
  local a=art[r]
  ok(a~=nil,'돌진 자취 RUID가 art_sprites에 있다 '..r)
  ok(a.w==spec.w and a.h==spec.h,'계약 w·h = 실제 그림 '..a.w..'×'..a.h..' (계약 '..spec.w..'×'..spec.h..')')
 end
 if b then ok(spec.stretch==true and spec.px==0 and spec.rev==true and spec.upright==true and spec.durs~=nil and #spec.durs==12,'B: 길 전체로 늘임 · 피벗(그림 오른끝 1.0) = 시작점(px 0) · 그림 앞쪽 -x(rev) · 세운 채 좌우(upright) · 장별 ms 12')
 else ok(spec.stretch==true and spec.px==1,'길 전체로 늘임 · 머리 피벗 그대로') end
end

-- ⑤ 뼈 갑옷 고리 투명도
do
 ok(near(PlayerStats:ArmorRingAlpha(1),0.55) and near(PlayerStats:ArmorRingAlpha(4),0.85),'1단계 0.55 · 4단계 0.85 (예전 0.30 · 0.75)')
 ok(PlayerStats:ArmorRingAlpha(2)>PlayerStats:ArmorRingAlpha(1) and PlayerStats:ArmorRingAlpha(3)<PlayerStats:ArmorRingAlpha(4),'단계가 오를수록 진하게')
 ok(PlayerStats:ArmorRingAlpha(0)==0,'0단계 = 없음')
end


-- ⑥ 연결 확인: 채운 FxSkill* 자리마다 실제로 부르는 곳이 있다 (저주 깨짐은 쓸 자리 미정 · 등록만)
do
 local files={'Skill/SkillEffects.mlua','Shadow/ShadowCommander.mlua','Shadow/ShadowUnit.mlua'}
 local src=''
 for _,f in ipairs(files) do local h=io.open('RootDesk/MyDesk/'..f) src=src..h:read('a') h:close() end
 for _,key in ipairs({'FxSkillHexBurst','FxSkillCurseSigils','FxSkillBoneStorm','FxSkillShatter','FxSkillShadowRise','FxSkillElitePromote'}) do
  ok(_GameConst[key]~='' and src:find('_GameConst.'..key,1,true)~=nil,key..' 채움 + 부르는 곳 있음')
 end
 ok(src:find('_GameConst.FxSkillCurseBreak',1,true)==nil,'저주 깨짐은 아직 부르는 곳 없음 (쓸 자리 결정 대기)')
end

-- ② 저주 바닥 문장 크기 (메이커 a023c3e1 후속): 캔버스 128px를 지름으로 늘이면 가로 2.1 × 세로 2.8칸 — 보이는 반경을 저주 반경에 맞춰 같은 배율로
--   실측(알파>16 · 4장 중 최대 · sigil-fit-measure.txt): 피벗에서 가장 먼 화소 maxR · 가로 반폭 halfW · 세로 반폭 halfH (px)
local SIGIL={amp={60.9,51.5,59.5},weaken={62.6,40.5,59.5},terror={59.7,51.5,59.5},thorn={72.0,59.5,59.5},lifetap={60.3,30.5,59.5},resist={59.5,49.5,59.5}}
do
 for kind,m in pairs(SIGIL) do
  local fit=nil
  for k,v in SkillEffects.CurseSigilFitPx:gmatch('(%w+)=([%d%.]+)') do if k==kind then fit=tonumber(v) end end
  ok(fit~=nil and fit>=m[1] and fit<m[1]+1,kind..' 보이는 반경 표 = 실측 ('..tostring(fit)..' / '..m[1]..')')
  for _,r in ipairs({1.5,1.5*1.3,2.4}) do
   local k=SkillEffects:CurseSigilScale(kind,r)
   local reach=m[1]*k/100
   ok(reach<=r+1e-6 and reach>=r-0.02,kind..' r='..f3(r)..' 문양 끝이 판정 원에 닿는다 (가장 먼 화소 '..f3(reach)..'칸)')
   ok(2*m[3]*k/100<=2*r+1e-6,kind..' 세로가 지름 안')
  end
  ok(near(SkillEffects:CurseSigilScale(kind,1.95)/SkillEffects:CurseSigilScale(kind,1.5),1.3),kind..' 반경이 1.5 → 1.95(저주 범위 노드 2)면 1.3배로 같이 커진다')
  -- 반례: 예전 배율(캔버스 128px = 지름)
  local old=2*1.5/1.28
  if kind=='thorn' then ok(m[1]*old/100>1.5+0.1,'반례 확인: 예전 배율이면 가시 문양 모서리가 원 밖으로 ('..f3(m[1]*old/100)..'칸)')
  else ok(2*m[3]*old/100<3.0-0.15,'반례 확인: 예전 배율이면 '..kind..' 세로 '..f3(2*m[3]*old/100)..'칸 < 지름 3') end
 end
 ok(near(SkillEffects:CurseSigilScale('confuse',1.5),1.5/0.64),'표에 없는 종류는 캔버스 반폭 64px 기준')
 -- 실제 시전: 가로세로 같은 배율 · 노드로 커진 반경을 그대로
 for _,r in ipairs({1.5,1.95}) do
  reset()
  SkillEffects:CurseShape('amp',Vector3(0,0,0),r)
  local s=plays[1].scale
  ok(near(s.x,s.y) and near(s.x,SkillEffects:CurseSigilScale('amp',r)),'시전 배율 가로=세로 = CurseSigilScale (r='..f3(r)..')')
  ok(near(SIGIL.amp[1]*s.x/100,r,0.02),'낙인 문장 가장 먼 끝 = 저주 반경 '..f3(r))
 end
end

print(string.format('[skillfx_e] %d checks OK', checks))
