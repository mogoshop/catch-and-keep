-- 10-31 코덱스 스킬 효과 9계열 B 88키 (assets/codex-skill-fx-v2/B-nine-full-20261031 · 새로 올림 82장 + 골편 명중 4장 재사용 · docs/evidence/2026-10-31-skillfx-nine88) — 실제 본문으로:
--   ① GameConst 9계열 자리: 슬롯별 RUID 수 · 32자리 hex · data/art_sprites.csv 82행(이름·effect·크기·RUID) 일치 · RUID 중복 0 · 계열별 ms 100(양수) ·
--      재사용 일관성: 뼛가루 = 골편 명중 4장 그대로 · 뼈 명중 = 골편 명중 2·4번째 장 (art_sprites에 같은 RUID 새 행 없음)
--   ② 채우면 새 그림 / 비우면 예전 연출: 뼈 갑옷 두름·흡수·깨짐 · 머리 위 표식 12 · 저주 원형 판(원 지름 = 판정 지름) · 망령 잔상 · 회오리·자국 · 의식 화살 · 뼛가루 · 소용돌이 · 투사체 속성 명중 · 영혼 격류 시전·명중
--   ③ 부르는 곳 grep · 영혼 격류 비행 자리(FxSkillTorrent)는 비행 몸이라 비워 둠 · [VRF] 계열당 한 줄
-- 엔진 효과·입자·타이머는 대역 — 실제 화면(크기·색·층·거울)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames,KeyFrames
-- @source SkillEffects Skill/SkillEffects.mlua OnBeginPlay,StatusFx,CurseShape,CurseCircleScale,CurseSigilScale,DashGhostFx,DashGhostSpots,DrainVortex,DrainVortexFrames,RiteWhirlFx,RiteWhirlScale,ConsumedDust,DustFrames,ShardHit,Fx
-- @source Projectile Combat/Projectile.mlua MirrorSkin,FrameSec,HitFx,HitArt
-- @source MonsterStatus Monster/MonsterStatus.mlua MarkerIcon
-- @source PlayerStats Player/PlayerStats.mlua ArmorHitKind,ArmorHitFx
-- @source MageBolts Undead/MageBolts.mlua Configure,C7Log
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local V3M={}
V3M.__add=function(a,b) return Vector3(a.x+b.x,a.y+b.y,a.z+b.z) end
V3M.__sub=function(a,b) return Vector3(a.x-b.x,a.y-b.y,a.z-b.z) end
V3M.__mul=function(a,b) if type(a)=='number' then a,b=b,a end return Vector3(a.x*b,a.y*b,a.z*b) end
Vector3=setmetatable({},{__call=function(_,x,y,z) return setmetatable({x=x,y=y,z=z},V3M) end})
Vector3.zero=Vector3(0,0,0)
function isvalid(x) return x~=nil and x~=false end
Environment={IsPublishedPlay=function() return false end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}
local timers={}
_TimerService={SetTimerOnce=function(_,fn,delay) table.insert(timers,{fn=fn,delay=delay}) return #timers end,SetTimerRepeat=function() error('9계열 새 길은 반복 타이머를 쓰지 않는다') end,ClearTimer=function() end}
local function runTimers() local list=timers timers={} for _,t in ipairs(list) do t.fn() end end
local particles,effects={},{}
_ParticleService={PlayBasicParticle=function(_,kind,parent,pos,rot,scale,loop,opt) table.insert(particles,{kind=kind,pos=pos,scale=scale,opt=opt}) return #particles end,RemoveParticle=function() end}
_EffectService={PlayEffect=function(_,ruid,inst,pos,rot,scale,loop,opt) table.insert(effects,{ruid=ruid,pos=pos,scale=scale,opt=opt}) return #effects end,
 PlayEffectAttached=function(_,ruid,inst,pos,rot,scale,loop,opt) table.insert(effects,{ruid=ruid,attached=true}) return #effects end,RemoveEffect=function() end}
BasicParticleType=setmetatable({},{__index=function(_,k) return k end})
-- 프레임 재생 대역 (Util.PlayFrames·Hold·Loop 본문은 skillfx_e에서 따로 본다)
local plays={}
function Util:PlayFrames(ruids,inst,pos,rot,scale,frameSec,tint,order) table.insert(plays,{fn='once',ruids=ruids,inst=inst,pos=pos,rot=rot,scale=scale,frameSec=frameSec,tint=tint,order=order}) end
function Util:PlayFramesHold(ruids,inst,pos,rot,scale,frameSec,holdSec,fadeSec,tint,order) table.insert(plays,{fn='hold',ruids=ruids,inst=inst,pos=pos,scale=scale,frameSec=frameSec,holdSec=holdSec,fadeSec=fadeSec,tint=tint,order=order}) end
function Util:PlayFramesLoop(ruids,inst,pos,rot,scale,frameSec,seconds,tint,order) table.insert(plays,{fn='loop',ruids=ruids,inst=inst,pos=pos,scale=scale,frameSec=frameSec,seconds=seconds,tint=tint,order=order}) end
function Util:SkillShake() end
local function reset() plays={} particles={} effects={} logs={} timers={} end

-- 실제 GameConst 값
_GameConst={}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local k,v=line:match('^%s*property string (%w+) = "([^"]*)"')
 if k then _GameConst[k]=v end
 local ki,vi=line:match('^%s*property integer (%w+) = (%-?%d+)')
 if ki then _GameConst[ki]=tonumber(vi) end
end
local saved={} for k,v in pairs(_GameConst) do saved[k]=v end
local function restore() for k,v in pairs(saved) do _GameConst[k]=v end end
-- art_sprites 표
local art,artByRuid,artRuidCount={},{},{}
local first=true
for line in io.lines('data/art_sprites.csv') do
 if first then first=false else
  local name,kind,w,h,ruid=line:match('^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$')
  if name then art[name]={kind=kind,w=tonumber(w),h=tonumber(h),ruid=ruid} artByRuid[ruid]=name artRuidCount[ruid]=(artRuidCount[ruid] or 0)+1 end
 end
end
local function seq(prefix,n) local t={} for i=0,n-1 do t[#t+1]=prefix..string.format('%02d',i) end return t end

-- ① 슬롯 · art_sprites · 재사용
local NEW={}   -- RUID → 이름 (새로 올린 82장)
local function slot(key,names,w,h)
 local list=Util:Frames(_GameConst[key] or '')
 ok(#list==#names,key..' '..#names..'장 ('..#list..')')
 for i,r in ipairs(list) do
  ok(#r==32 and r:match('^%x+$')~=nil,key..' '..i..' 32자리 hex')
  local a=art[names[i]]
  ok(a~=nil and a.ruid==r,names[i]..' art_sprites RUID 일치 (순서 포함)')
  ok(a.kind=='effect' and a.w==w and a.h==h,names[i]..' effect '..w..'×'..h)
  ok(artRuidCount[r]==1,names[i]..' art_sprites 행 1개')
  ok(NEW[r]==nil,names[i]..' 다른 자리와 RUID 중복 없음') NEW[r]=names[i]
 end
end
do
 slot('FxSkillArmorCast',seq('fx-B-bone-armor-cast-sample-',4),128,128)
 slot('FxSkillArmorAbsorb',seq('fx-B-bone-armor-absorb-sample-',3),128,128)
 slot('FxSkillArmorBreak',seq('fx-B-bone-armor-break-sample-',4),128,128)
 slot('FxSkillDashGhost',seq('fx-B-spectral-dash-ghost-sample-',4),128,128)
 -- 회전 8장 = 승인 0/2/4/6 + 중간 1/3/5/7 끼움 (logical-mapping88 full_index0)
 local whirl={}
 for i=0,3 do whirl[#whirl+1]='fx-B-rite-bone-whirl-sample-'..string.format('%02d',i) whirl[#whirl+1]='fx-B-rite-bone-whirl-intermediate-'..string.format('%02d',i) end
 slot('FxSkillRiteWhirl',whirl,256,256)
 slot('FxSkillRiteWhirlTrace',{'fx-B-rite-bone-whirl-trace-sample-00'},256,256)
 slot('FxSkillRiteArrow',seq('fx-B-rite-bone-arrow-sample-',4),128,64)
 slot('FxSkillDrainVortex',seq('fx-B-soul-drain-vortex-sample-',4),128,128)
 slot('FxSkillHitCurse',seq('fx-B-projectile-hit-curse-sample-',2),96,96)
 slot('FxSkillHitFire',seq('fx-B-projectile-hit-fire-sample-',2),96,96)
 slot('FxSkillHitFrost',seq('fx-B-projectile-hit-frost-sample-',2),96,96)
 slot('FxSkillTorrentCast',seq('fx-B-soul-torrent-cast-sample-',4),128,128)
 slot('FxSkillTorrentHit',seq('fx-B-soul-torrent-hit-sample-',4),128,128)
 for _,k in ipairs({'amp','weaken','terror','thorn','lifetap','resist'}) do
  local list=Util:KeyFrames(_GameConst.FxSkillCurseCircles,k)
  local names=seq('fx-B-curse-circle-'..k..'-sample-',4)
  ok(#list==4,'원형 판 '..k..' 4장')
  for i,r in ipairs(list) do
   local a=art[names[i]]
   ok(#r==32 and a~=nil and a.ruid==r and a.kind=='effect' and a.w==128 and a.h==128 and artRuidCount[r]==1,names[i]..' art_sprites 일치')
   ok(NEW[r]==nil,names[i]..' 중복 없음') NEW[r]=names[i]
  end
 end
 ok(#Util:KeyFrames(_GameConst.FxSkillCurseCircles,'confuse')==0 and #Util:KeyFrames(_GameConst.FxSkillCurseCircles,'decay')==0,'혼란·쇠퇴는 원형 판 납품 없음')
 for _,k in ipairs({'amp','weaken','thorn','terror','confuse','lifetap','decay','resist','root','chill','poison','hex'}) do
  local list=Util:KeyFrames(_GameConst.FxSkillMarks,k)
  local name=k=='hex' and 'fx-B-mark-hex-sample-00' or 'fx-B-mark-'..k..'-outline-sample-00'
  local a=art[name]
  ok(#list==1 and a~=nil and a.ruid==list[1] and a.kind=='effect' and a.w==48 and a.h==48 and artRuidCount[list[1]]==1,'표식 '..k..' = '..name)
  ok(NEW[list[1]]==nil,'표식 '..k..' 중복 없음') NEW[list[1]]=name
 end
 local n=0 for _ in pairs(NEW) do n=n+1 end
 ok(n==82,'새로 올린 82장 = 자리에 연결된 서로 다른 RUID ('..n..')')
 local rows=0
 for name,a in pairs(art) do
  if name:match('^fx%-B%-bone%-armor%-[acb]') or name:match('^fx%-B%-mark%-') or name:match('^fx%-B%-curse%-circle%-') or name:match('^fx%-B%-spectral%-dash') or name:match('^fx%-B%-rite%-bone%-') or name:match('^fx%-B%-soul%-') or name:match('^fx%-B%-projectile%-hit%-') then
   rows=rows+1
   ok(NEW[a.ruid]==name,name..' art_sprites 행이 자리에 연결됨')
  end
 end
 ok(rows==82,'art_sprites 9계열 행 82개 ('..rows..')')
 -- 재사용: 뼛가루 4 = 골편 명중 4 · 뼈 명중 2 = 골편 명중 2·4번째 (sha256 동일 · 피벗 동일 → 새로 올리지 않음)
 local shard=Util:Frames(_GameConst.FxSkillShardHit)
 ok(#shard==4 and _GameConst.FxSkillConsumedDust==_GameConst.FxSkillShardHit,'뼛가루 = 골편 명중 4장 RUID 그대로')
 local bone=Util:Frames(_GameConst.FxSkillHitBone)
 ok(#bone==2 and bone[1]==shard[2] and bone[2]==shard[4],'뼈 명중 = 골편 명중 sample-01·03 RUID')
 for i,r in ipairs(shard) do ok(artByRuid[r]=='fx-B-shard-hit-sample-0'..(i-1) and artRuidCount[r]==1,'재사용 RUID는 골편 명중 행 하나뿐 '..i) end
 ok(art['fx-B-consumed-skeleton-dust-sample-00']==nil and art['fx-B-projectile-hit-bone-sample-00']==nil,'재사용 키는 art_sprites에 새 행을 만들지 않는다')
 for _,k in ipairs({'FxSkillArmorFxMs','FxSkillCurseCircleMs','FxSkillDashGhostMs','FxSkillRiteWhirlMs','FxSkillRiteArrowMs','FxSkillConsumedDustMs','FxSkillDrainVortexMs','FxSkillHitMs','FxSkillTorrentMs'}) do
  ok(type(_GameConst[k])=='number' and _GameConst[k]>0 and _GameConst[k]==100,k..' 100ms (코덱스 제안 · 양수)')
 end
 ok(_GameConst.FxSkillTorrent=='','영혼 격류 비행 몸 자리(FxSkillTorrent)는 비워 둔다 — 시전·명중 그림을 넣으면 투사체가 시전 그림으로 난다')
end

local me={CurrentMap='m1',TransformComponent={WorldPosition=Vector3(0,0,0)}}
_UserService={LocalPlayer=me}

-- ② 뼈 갑옷: 두름(StatusFx) · 흡수·깨짐(PlayerStats)
do
 local fx=setmetatable({Entity=me,BlastVisuals={},VisualTimers={}},{__index=SkillEffects})
 reset()
 fx:StatusFx('armor',Vector3(2,3,0),1)
 local p=plays[1]
 ok(p~=nil and p.fn=='once' and p.ruids==_GameConst.FxSkillArmorCast and near(p.frameSec,0.1),'두름 4장 한 번 0.1초')
 ok(near(p.pos.y,3+SkillEffects.ArmorArtDy) and p.order==SkillEffects.ArmorCastOrder and near(p.scale.x,SkillEffects.ArmorCastArtScale),'몸 가운데 · 몸 앞 층 · 배율')
 ok(#particles==0 and #logs==1 and logs[1]:find('[VRF] bone armor cast frames n=4 ms=100',1,true)~=nil,'그림이면 Buff 입자 없음 · [VRF] 한 줄')
 _GameConst.FxSkillArmorCast=''
 reset()
 fx:StatusFx('armor',Vector3(2,3,0),1)
 ok(#plays==0 and particles[1]~=nil and particles[1].kind=='Buff','비면 예전 Buff 입자')
 restore()
 -- 흡수량 변화
 ok(PlayerStats:ArmorHitKind(100,60)=='absorb' and PlayerStats:ArmorHitKind(60,0)=='break','줄었는데 남음 = 흡수 · 0 = 깨짐')
 ok(PlayerStats:ArmorHitKind(0,100)=='' and PlayerStats:ArmorHitKind(40,100)=='' and PlayerStats:ArmorHitKind(50,50)=='' and PlayerStats:ArmorHitKind(0,0)=='','두름·뼈 껍질(늘어남)·그대로 = 없음')
 local st=setmetatable({Entity=me,ArmorFxLast=0,ArmorAbsorbAt=-10},{__index=PlayerStats})
 reset()
 _UtilLogic.ElapsedSeconds=1
 st:ArmorHitFx(100)
 ok(#plays==0,'두름(0→100) 그림 없음 (두름은 StatusFx)')
 st:ArmorHitFx(60)
 ok(#plays==1 and plays[1].ruids==_GameConst.FxSkillArmorAbsorb and near(plays[1].frameSec,0.1) and near(plays[1].pos.y,PlayerStats.ArmorRingDy),'흡수 3장 한 번 · 몸 가운데')
 _UtilLogic.ElapsedSeconds=1.1
 st:ArmorHitFx(50)
 ok(#plays==1,'흡수 그림 간격 '..PlayerStats.ArmorAbsorbGapSec..'초 안에는 다시 그리지 않는다')
 _UtilLogic.ElapsedSeconds=1.4
 st:ArmorHitFx(40)
 ok(#plays==2,'간격이 지나면 다시 흡수')
 _UtilLogic.ElapsedSeconds=1.45
 st:ArmorHitFx(0)
 ok(#plays==3 and plays[3].ruids==_GameConst.FxSkillArmorBreak,'깨짐 4장은 간격과 상관없이')
 ok(#logs==3 and logs[3]:find('[VRF] bone armor break frames n=4 ms=100',1,true)~=nil,'[VRF] 흡수·깨짐 한 줄씩')
 _GameConst.FxSkillArmorAbsorb='' _GameConst.FxSkillArmorBreak=''
 reset()
 st:ArmorHitFx(100) _UtilLogic.ElapsedSeconds=5 st:ArmorHitFx(10) st:ArmorHitFx(0)
 ok(#plays==0,'비면 예전처럼 없음')
 restore()
 local other=setmetatable({Entity={CurrentMap='m2',TransformComponent={WorldPosition=Vector3(0,0,0)}},ArmorFxLast=100,ArmorAbsorbAt=-10},{__index=PlayerStats})
 reset() other:ArmorHitFx(0)
 ok(#plays==0 and other.ArmorFxLast==0,'다른 맵 플레이어는 그리지 않고 값만 따라간다')
 _UtilLogic.ElapsedSeconds=0
end

-- ② 머리 위 표식
do
 local icons={mark_amp='old_amp',mark_frost='old_frost'}
 _GameData={GetUiIcon=function(_,k) return icons[k] or '' end}
 _SkillData={Get=function(_,id) return {icon='skillicon_'..id} end}
 local ms=setmetatable({},{__index=MonsterStatus})
 ok(ms:MarkerIcon('mark_weakness','mark_amp')==Util:KeyFrames(_GameConst.FxSkillMarks,'amp')[1],'약화의 낙인 = 외곽선 보강판')
 ok(ms:MarkerIcon('mage_curse','mark_hex')==Util:KeyFrames(_GameConst.FxSkillMarks,'hex')[1],'저주 속성 = 새 표식 mark-hex (예전 스킬 아이콘)')
 ok(ms:MarkerIcon('frost_soul','mark_chill')==Util:KeyFrames(_GameConst.FxSkillMarks,'chill')[1],'둔화 = 외곽선 보강판')
 ok(ms:MarkerIcon('frost_long','mark_frost')=='old_frost','서리 표식은 납품 없음 → ui_icons mark_frost 그대로')
 _GameConst.FxSkillMarks=''
 ok(ms:MarkerIcon('mark_weakness','mark_amp')=='old_amp','비면 예전 ui_icons mark_amp')
 ok(ms:MarkerIcon('mage_curse','mark_hex')=='skillicon_mage_curse','비면 저주 속성은 예전 스킬 아이콘')
 restore()
 -- 크기: 48px 캔버스의 문양 높이 30px ≈ 예전 32px 판 28px → MarkerScale 그대로 (실측 alpha>16)
 ok(near(30*MonsterStatus.MarkerScale/100,28*MonsterStatus.MarkerScale/100,0.03),'문양 높이 0.27칸 ≈ 예전 0.25칸')
end

-- ② 저주 원형 판: 보이는 반경 = 저주 반경
local CIRCLE={amp=58.5,weaken=56.7,terror=62.2,thorn=57.7,lifetap=55.5,resist=58.7}   -- 10-31 실측 (가운데에서 알파>16 가장 먼 화소 · 4장 중 최대)
do
 SkillEffects.Entity=me
 for kind,far in pairs(CIRCLE) do
  local fit=nil
  for k,v in SkillEffects.CurseCircleFitPx:gmatch('(%w+)=([%d%.]+)') do if k==kind then fit=tonumber(v) end end
  ok(fit~=nil and near(fit,far,0.05),kind..' 원형 판 보이는 반경 표 = 실측')
  for _,r in ipairs({1.5,1.95,2.4}) do
   local k=SkillEffects:CurseCircleScale(kind,r)
   ok(near(far*k/100,r,0.01),kind..' r='..r..' 원 끝 = 판정 원')
  end
  ok(near(2*far*SkillEffects:CurseCircleScale(kind,1.5)/100,3,0.01),kind..' 지름 3칸 원에 맞음')
 end
 ok(near(SkillEffects:CurseCircleScale('confuse',1.5),1.5/0.64),'표에 없는 종류는 캔버스 반폭 64px')
 reset()
 SkillEffects:CurseShape('amp',Vector3(3,1,0),1.5)
 local p=plays[1]
 ok(#plays==1 and p.fn=='hold' and p.ruids==table.concat(Util:KeyFrames(_GameConst.FxSkillCurseCircles,'amp'),'|'),'낙인 = 원형 판 4장 한 번 (문장보다 먼저)')
 ok(near(p.frameSec,0.1) and near(p.holdSec,0.1+SkillEffects.CurseCircleHoldSec) and near(p.fadeSec,SkillEffects.CurseCircleFadeSec) and p.order==SkillEffects.CurseSigilOrder,'0.1초씩 · 마지막 장 0.3초 더 · 옅어짐 · 바닥 층')
 ok(near(p.scale.x,p.scale.y) and near(p.scale.x,SkillEffects:CurseCircleScale('amp',1.5)) and p.pos.x==3 and p.pos.y==1,'가로=세로 · 원 크기 · 자리')
 ok(#particles==0 and logs[1]:find('circle=true',1,true)~=nil,'입자 없음 · [VRF] curse shape circle=true')
 _GameConst.FxSkillCurseCircles=''
 reset()
 SkillEffects:CurseShape('amp',Vector3(3,1,0),1.5)
 ok(#plays==1 and plays[1].ruids==table.concat(Util:KeyFrames(_GameConst.FxSkillCurseSigils,'amp'),'|') and near(plays[1].scale.x,SkillEffects:CurseSigilScale('amp',1.5)),'원형 판이 비면 예전 바닥 문장')
 _GameConst.FxSkillCurseSigils=''
 reset()
 SkillEffects:CurseShape('amp',Vector3(3,1,0),1.5)
 ok(#plays==0 and #particles==1,'둘 다 비면 예전 입자')
 restore()
 reset()
 SkillEffects:CurseShape('confuse',Vector3(0,0,0),1.5)
 ok(#plays==0 and #particles==1,'혼란은 원형 판 없음 → 입자 그대로')
end

-- ② 망령 질주 잔상
do
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 local s=fx:DashGhostSpots(false)
 ok(#s==3 and near(s[1],0) and near(s[2],1/3) and near(s[3],2/3),'잔상 자리 0 · 1/3 · 2/3')
 local s2=fx:DashGhostSpots(true)
 ok(#s2==4 and near(s2[4],1),'도약 강화면 도착 자리 하나 더')
 reset()
 fx:DashGhostFx(Vector3(0,0,0),Vector3(3,0,0),false)
 ok(#plays==1 and #timers==2,'첫 잔상은 바로 · 나머지 둘은 타이머 (클라이언트)')
 ok(near(timers[1].delay,SkillEffects.DashGhostStepSec) and near(timers[2].delay,2*SkillEffects.DashGhostStepSec),'몸이 지나간 순서대로 0.05초씩')
 runTimers()
 ok(#plays==3,'잔상 3개')
 for i,p in ipairs(plays) do
  ok(p.ruids==_GameConst.FxSkillDashGhost and near(p.frameSec,0.1) and p.inst=='m1' and p.order==SkillEffects.DashGhostOrder,'잔상 '..i..' 4장 한 번 · 맵에 붙임')
  ok(near(p.pos.x,(i-1)*1) and near(p.pos.y,0) and p.scale.x>0,'잔상 '..i..' 길 위 자리 (발 피벗) · 오른쪽')
 end
 ok(#logs==1 and logs[1]:find('[VRF] dash ghost frames n=4 copies=3 ms=100 mirror=false',1,true)~=nil,'[VRF] 잔상 한 줄')
 reset()
 fx:DashGhostFx(Vector3(3,1,0),Vector3(0,1,0),true) runTimers()
 ok(#plays==4 and plays[1].scale.x<0 and near(plays[1].scale.x,-plays[1].scale.y) and near(plays[4].pos.x,0),'왼쪽으로 가면 가로 거울 · 도약이면 도착 자리까지')
 _GameConst.FxSkillDashGhost=''
 reset() fx:DashGhostFx(Vector3(0,0,0),Vector3(3,0,0),false) runTimers()
 ok(#plays==0 and #timers==0,'비면 그리지 않는다 (WraithDash가 예전 FxBlink로)')
 restore()
end

-- ② 생기 앗기 소용돌이
do
 local calls={}
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 fx.ClipFx=function(_,...) table.insert(calls,{'clip',...}) end
 fx.DrainVortexFrames=function(_,...) table.insert(calls,{'frames',...}) end
 fx:DrainVortex(Vector3(1,2,0))
 ok(#calls==1 and calls[1][1]=='frames','채우면 소용돌이 4장 (Multicast)')
 _GameConst.FxSkillDrainVortex=''
 calls={} fx:DrainVortex(Vector3(1,2,0))
 ok(#calls==1 and calls[1][1]=='clip' and calls[1][2]==SkillEffects.FxDrain and calls[1][4]==0.6 and calls[1][5]==0.7,'비면 예전 보라 소용돌이 ClipFx(FxDrain 0.6 · 0.7초)')
 restore()
 local real=setmetatable({Entity=me},{__index=SkillEffects})
 reset() real:DrainVortexFrames(Vector3(1,2,0))
 local p=plays[1]
 ok(p.fn=='loop' and p.ruids==_GameConst.FxSkillDrainVortex and near(p.frameSec,0.1) and near(p.seconds,SkillEffects.DrainVortexSec) and p.inst=='m1','4장 0.1초 반복 0.7초 · 맵에 붙임')
 ok(#logs==1 and logs[1]:find('[VRF] drain vortex frames n=4 ms=100',1,true)~=nil,'[VRF] 한 줄')
end

-- ② 의식 2기 뼈 회오리·자국
do
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 reset() fx:RiteWhirlFx(Vector3(4,5,0),1.5,4)
 local trace,whirl=plays[1],plays[2]
 ok(trace.fn=='hold' and trace.ruids==_GameConst.FxSkillRiteWhirlTrace and trace.order==SkillEffects.RiteWhirlTraceOrder,'바닥 자국 1장 · 바닥 층')
 ok(near(trace.holdSec+trace.fadeSec,4) and near(trace.fadeSec,SkillEffects.RiteWhirlTraceFadeSec),'자국은 회오리 시간 동안 · 끝에 옅어짐')
 ok(whirl.fn=='loop' and whirl.ruids==_GameConst.FxSkillRiteWhirl and near(whirl.frameSec,0.1) and near(whirl.seconds,4) and whirl.order==SkillEffects.RiteWhirlOrder,'회전 8장 0.1초 반복 4초 · 몸 앞')
 ok(near(SkillEffects.RiteWhirlContentPx*whirl.scale.x/100,3,0.001) and near(whirl.scale.x,whirl.scale.y),'회오리 내용 폭 235px = 판정 지름 3칸 (가로=세로 · 위에서 본 원)')
 ok(near(SkillEffects.RiteWhirlTraceContentPx*trace.scale.x/100,3,0.001),'자국 내용 폭 240px = 지름 3칸')
 ok(whirl.pos.x==4 and whirl.pos.y==5 and trace.pos.y==5,'조준점 그대로 (발 자리 원)')
 ok(#logs==1 and logs[1]:find('[VRF] rite whirl frames n=8 ms=100',1,true)~=nil,'[VRF] 한 줄')
 ok(near(fx:RiteWhirlScale(1.95,235)/fx:RiteWhirlScale(1.5,235),1.3),'반경이 커지면 같은 비율')
 _GameConst.FxSkillRiteWhirl=''
 reset() fx:RiteWhirlFx(Vector3(4,5,0),1.5,4)
 ok(#plays==0,'비면 그리지 않는다 (RiteWhirl이 예전 FxStorm·범위 원으로)')
 restore()
end

-- ② 의식 3기 뼈 화살 (Projectile 순환·뒤집기)
do
 local p=setmetatable({SkinRuid=_GameConst.FxSkillRiteArrow},{__index=Projectile})
 ok(p:MirrorSkin() and near(p:FrameSec(),0.1),'의식 뼈 화살 = 오른쪽 기준 그림 · 0.1초 (FxSkillRiteArrowMs)')
 _GameConst.FxSkillRiteArrowMs=50
 ok(near(p:FrameSec(),0.05),'의식 화살 간격은 FxSkillRiteArrowMs 하나만 바꾸면')
 local q=setmetatable({SkinRuid=_GameConst.FxSkillShardThrow},{__index=Projectile})
 ok(near(q:FrameSec(),0.1),'골편 투척은 FxSkillShardFrameMs 그대로')
 restore()
end

-- ② 소모 해골 뼛가루
do
 local calls={}
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 fx.DustFrames=function(_,...) table.insert(calls,{'dust',...}) end
 fx.ShardHitFrames=function(_,...) table.insert(calls,{'shard',...}) end
 fx.ClipFx=function(_,...) table.insert(calls,{'clip',...}) end
 fx:ConsumedDust({x=2,y=3},0.5,0.6)
 ok(#calls==1 and calls[1][1]=='dust' and near(calls[1][2].y,3+SkillEffects.DustDy) and calls[1][3]==0.5,'채우면 발 앵커 뼛가루 (해골 발 + DustDy)')
 _GameConst.FxSkillConsumedDust=''
 calls={} fx:ConsumedDust({x=2,y=3},0.45,0.5)
 ok(#calls==1 and calls[1][1]=='shard' and near(calls[1][2].y,3.4) and calls[1][3]==0.45,'비면 예전 길 = 골편 명중 (해골 자리 +0.4 · 옛 배율)')
 _GameConst.FxSkillShardHit=''
 calls={} fx:ConsumedDust({x=2,y=3},0.5,0.6)
 ok(#calls==1 and calls[1][1]=='clip' and calls[1][2]==SkillEffects.FxShardHit,'둘 다 비면 예전 보라 파열')
 restore()
 local real=setmetatable({Entity=me},{__index=SkillEffects})
 reset() real:DustFrames(Vector3(2,3.3,0),0.45)
 local p=plays[1]
 ok(p.fn=='once' and p.ruids==_GameConst.FxSkillShardHit and near(p.frameSec,0.1) and near(p.scale.x,SkillEffects.DustScale*0.9),'골편 명중 RUID 4장 한 번 · 옛 0.45 = 0.9배')
 ok(#logs==1 and logs[1]:find('shared=true',1,true)~=nil,'[VRF] 뼛가루 한 줄 · RUID 공유')
end

-- ② 투사체 속성 명중 · 영혼 격류 명중
do
 local shooter={}
 local function hit(style,kind,color)
  reset()
  local p=setmetatable({Entity={CurrentMap='m1'},Dir={x=1,y=0}},{__index=Projectile})
  p:HitFx(Vector3(1,1,0),color or Color(0.5,0.5,1,1),shooter,false,style,kind)
  return p
 end
 for _,c in ipairs({{'bone','FxSkillHitBone'},{'curse','FxSkillHitCurse'},{'fire','FxSkillHitFire'},{'frost','FxSkillHitFrost'}}) do
  local col=Color(0.9,0.8,0.7,1)
  hit('',c[1],col)
  ok(#plays==1 and plays[1].ruids==_GameConst[c[2]] and near(plays[1].frameSec,0.1) and #particles==0,c[1]..' 명중 2장 한 번 0.1초 (공용 불꽃 없음)')
  ok(near(plays[1].scale.x,Projectile.HitArtScale) and plays[1].order==6,c[1]..' 배율·몸 앞')
  if c[1]=='bone' then ok(plays[1].tint==col,'뼈 명중(무채색)은 투사체 색') else ok(plays[1].tint.r==1 and plays[1].tint.g==1,c[1]..' 명중은 그림 자기 색') end
 end
 hit('rite','bone')
 ok(#plays==1 and plays[1].ruids==_GameConst.FxSkillHitBone,'의식 화살 앞 두 발(rite) = 뼈 명중')
 hit('','')
 ok(#plays==0 and #particles==1 and particles[1].kind=='SparkExplosion','속성 없음(골편 투척·몬스터 화살) = 예전 공용 불꽃')
 hit('','poison')
 ok(#plays==0 and #particles==1,'그림 없는 속성 = 공용 불꽃')
 _GameConst.FxSkillHitFire=''
 hit('','fire')
 ok(#plays==0 and #particles==1,'불 명중 칸이 비면 공용 불꽃')
 restore()
 hit('torrent','')
 ok(#plays==1 and plays[1].ruids==_GameConst.FxSkillTorrentHit and near(plays[1].frameSec,0.1) and near(plays[1].scale.x,Projectile.TorrentHitArtScale) and #particles==0,'영혼 격류 명중 4장 한 번')
 _GameConst.FxSkillTorrentHit=''
 hit('torrent','')
 ok(#plays==0 and #particles==2,'비면 예전 혼 구슬 + 불꽃')
 restore()
 -- 속성 정하기 (MageBolts.Configure · 실제 본문)
 _MageBolts=MageBolts
 for _,c in ipairs({{'fire','fire'},{'cold','frost'},{'cold_shard','frost'},{'curse','curse'},{'bone',''},{'soul',''}}) do
  local proj={HitKind='',Skin=function() end,SkinXY=function() end,Tint=function() end}
  MageBolts:Configure(proj,c[1])
  ok(proj.HitKind==c[2],'Configure '..c[1]..' → HitKind '..(c[2]=='' and '(Style 자기 명중)' or c[2]))
 end
end

-- ② 영혼 격류 시전
do
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 reset() fx:Fx('torrent',Vector3(1,0.3,0),0.6)
 ok(#plays==1 and plays[1].ruids==_GameConst.FxSkillTorrentCast and near(plays[1].frameSec,0.1) and near(plays[1].pos.y,0.45) and #particles==0,'시전 4장 한 번 · 몸 가운데')
 ok(#logs==1 and logs[1]:find('[VRF] torrent cast frames n=4',1,true)~=nil,'[VRF] 한 줄')
 _GameConst.FxSkillTorrentCast=''
 reset() fx:Fx('torrent',Vector3(1,0.3,0),0.6)
 ok(#plays==0 and #particles==1 and particles[1].kind=='ChargeOrb','비면 예전 혼 구슬 입자')
 restore()
end

-- ② 미리 불러 두기: 자리마다 첫 장
do
 local fx=setmetatable({Entity=me,VisualTimers={}},{__index=SkillEffects})
 reset() fx:OnBeginPlay()
 local got={} for _,e in ipairs(effects) do got[e.ruid]=true end
 for _,k in ipairs({'FxSkillArmorCast','FxSkillArmorAbsorb','FxSkillArmorBreak','FxSkillDashGhost','FxSkillRiteWhirl','FxSkillRiteWhirlTrace','FxSkillRiteArrow','FxSkillDrainVortex','FxSkillHitCurse','FxSkillHitFire','FxSkillHitFrost','FxSkillTorrentCast','FxSkillTorrentHit','FxSkillConsumedDust','FxSkillHitBone'}) do
  ok(got[Util:Frames(_GameConst[k])[1]],k..' 첫 장 미리 불러 둠')
 end
 for _,k in ipairs({'amp','weaken','terror','thorn','lifetap','resist'}) do ok(got[Util:KeyFrames(_GameConst.FxSkillCurseCircles,k)[1]],'원형 판 '..k..' 첫 장') end
 for _,k in ipairs({'amp','hex','chill'}) do ok(got[Util:KeyFrames(_GameConst.FxSkillMarks,k)[1]],'표식 '..k) end
end

-- ③ 부르는 곳 (grep)
do
 local function read(f) local h=assert(io.open('RootDesk/MyDesk/'..f)) local s=h:read('a') h:close() return s end
 local se,pj,us,mb,su,ps,mst=read('Skill/SkillEffects.mlua'),read('Combat/Projectile.mlua'),read('Undead/UndeadSystem.mlua'),read('Undead/MageBolts.mlua'),read('Shadow/ShadowUnit.mlua'),read('Player/PlayerStats.mlua'),read('Monster/MonsterStatus.mlua')
 local function count(s,pat) local n,i=0,1 while true do local a,b=s:find(pat,i,true) if not a then return n end n=n+1 i=b+1 end end
 ok(count(us,'fx:ConsumedDust(')==2 and count(se,'self:ConsumedDust(from, 0.45, 0.5)')==1,'뼛가루: 의식 2기·거인 합체(UndeadSystem) + 의식 3기 쏜 해골')
 ok(count(se,'self:DrainVortex(')==2 and count(se,'self:ClipFx(self.FxDrain')==1,'생기 앗기 2곳 → DrainVortex · 예전 ClipFx는 빈 자리 되돌림 한 곳')
 ok(count(se,'self:DashGhostFx(')==1 and se:find('elseif book ~= nil and book:Node("dash_blink") > 0 then',1,true)~=nil and count(se,'self:ClipFxRate(self.FxBlink')==2,'질주: 잔상 · 비면 예전 FxBlink 두 갈래 그대로')
 ok(count(se,'self:RiteWhirlFx(')==1 and count(se,'self:ClipFx(self.FxStorm')==1 and count(se,'self:RangeRimFx(Vector3(center.x, center.y, 0), radius, seconds')==1,'회오리: 새 그림 · 비면 예전 FxStorm + 범위 원')
 ok(se:find('proj:Skin(_GameConst.FxSkillRiteArrow, self.RiteArrowScale * (last and self.RiteArrowLastMul or 1))',1,true)~=nil and se:find('proj:Skin(self.FxShardShot, last and 1.38 or 1.1)',1,true)~=nil,'의식 화살: 새 그림 · 비면 예전 보라 궤적')
 ok(se:find('if not last then proj.HitKind = "bone" end',1,true)~=nil and su:find('proj.HitKind = "bone"',1,true)~=nil,'뼈 명중: 의식 화살 앞 두 발 · 중립 뼈 화살')
 ok(count(pj,'self:ShakesOnHit(), self.Style, self.HitKind)')==4 and count(pj,'self:ShakesOnHit(), self.Style)')==0,'HitFx 부르는 4곳 모두 속성 전달')
 ok(count(mb,'proj.HitKind = "fire"')==1 and count(mb,'proj.HitKind = "frost"')==2 and count(mb,'proj.HitKind = "curse"')==1,'MageBolts 속성 3종')
 ok(mb:find('proj:Skin(_GameConst.FxSkillTorrent, 0.55)',1,true)~=nil,'FxSkillTorrent는 여전히 영혼 격류 비행 몸 자리 (시전 그림을 넣지 않은 이유)')
 ok(ps:find('if name == "BoneArmor" then self:ArmorHitFx(self.BoneArmor) end',1,true)~=nil,'흡수·깨짐 = 동기화 값 비교 (서버 일 없음)')
 ok(mst:find('_Util:KeyFrames(_GameConst.FxSkillMarks',1,true)~=nil,'표식 = FxSkillMarks 먼저')
 ok(se:find('local circle = _Util:KeyFrames(_GameConst.FxSkillCurseCircles, kind)',1,true)~=nil,'저주 = 원형 판 먼저')
 -- 새 길은 반복 서버 타이머를 늘리지 않는다: 새 메서드 본문에 SetTimerRepeat 없음
 for _,m in ipairs({'DashGhostFx','DrainVortex','DrainVortexFrames','RiteWhirlFx','ConsumedDust','DustFrames'}) do
  local body=se:match('method [^\n]- '..m..'%(.-\n    end\n')
  ok(body~=nil and body:find('SetTimerRepeat',1,true)==nil,m..' 반복 타이머 없음')
 end
 ok(ps:match('method void ArmorHitFx%(.-\n    end\n'):find('SetTimer',1,true)==nil,'흡수·깨짐 타이머 없음')
 -- [VRF] 계열당 한 줄
 for _,v in ipairs({'[VRF] bone armor cast frames','[VRF] dash ghost frames','[VRF] drain vortex frames','[VRF] rite whirl frames','[VRF] consumed dust frames','[VRF] torrent cast frames'}) do ok(count(se,v)==1,v..' 한 줄') end
 ok(count(ps,'[VRF] bone armor %s frames')==1 and count(pj,'[VRF] projectile hit fx style=')==1 and count(mst,'outline=%s')==1 and count(se,'circle=%s')==1,'흡수·깨짐 · 명중 · 표식 · 원형 판 [VRF]')
 ok(count(pj,'_GameConst.FxSkillRiteArrow')==3 and count(pj,'_GameConst.FxSkillRiteArrowMs')==1,'의식 화살 = MirrorSkin 목록 + FrameSec(그림 비교 · ms)')
end

print(string.format('skillfx_nine: %d checks passed', checks))
