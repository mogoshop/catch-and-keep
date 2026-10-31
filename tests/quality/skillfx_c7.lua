-- 10-31 메이플 원본 교체 C 묶음 승인 7종 × 4장 (assets/codex-skill-fx-v2/C-approved7-full-20261031 · 사용자 「7 승인·5 보강」 · docs/evidence/2026-10-31-skillfx-C7) — 실제 본문으로:
--   ① GameConst 7자리(FxSkillBlast·OfferingHeal·DeathWave·FlameShot·FrostShot·PoisonCloud·Slash) × 4장 · 32자리 hex · data/art_sprites.csv 28행(이름·effect·크기·RUID·순서) 일치 · RUID 중복 0 · FxSkillC7FrameMs 100(양수)
--   ② 채우면 새 그림 / 비우면 예전 메이플 원본: 바닥 4계열 C7Clip(발 = 지면 원점 · 크기 = 예전 보이는 폭) · 독 구름 반복 · 투사체 2종 MirrorSkin(순환·FlipY·진행 각 보정 0) · MageBolts 배율 · 중립 베기 Util.SkillSlashFx(가로 거울·Tint)
--   ③ 부르는 곳 grep · 미리 불러 두기 · 새 길에 반복 타이머 없음 · [VRF] 계열당 한 줄
--   ④ 10-31 통일 공정 5종 전체(docs/evidence/2026-10-31-skillfx-unify-full5): 폭발·파동·독 구름 = fx-unify-* 10장(384×288 · 768×512 · 384×320) · 장별 ms 개수 = 장 수 ·
--      한 번 계열 hold·fade 0 · 독 구름 반복 → 잦아듦 2장 → 옅어짐(전체 ≈ 지속 시간) · 내용 폭 335/743/342px로 보이는 폭 그대로 · 옛 C 4장 판으로 되돌리면 예전 길(되돌림 검사)
-- 엔진 효과·타이머는 대역 — 실제 화면(크기·층·거울·색)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames,KeyFrames,SkillSlashFx,MsCount,MsTailSec,FramePlanMs,FramePlanLoopMs
-- @source SkillEffects Skill/SkillEffects.mlua OnBeginPlay,C7Opt,C7Ruids,C7OldRuid,C7Ms,C7Scale,C7Clip,C7Fx
-- @source Projectile Combat/Projectile.mlua MirrorSkin,FrameSec,ViewAngleOffset,FaceMirror
-- @source MageBolts Undead/MageBolts.mlua Configure,C7Log
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
Vector3=setmetatable({},{__call=function(_,x,y,z) return {x=x,y=y,z=z} end})
Vector3.zero=Vector3(0,0,0)
function isvalid(x) return x~=nil and x~=false end
local published=false
Environment={IsPublishedPlay=function() return published end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}
_TimerService={SetTimerOnce=function() return 1 end,SetTimerRepeat=function() error('C 7종 새 길은 반복 타이머를 쓰지 않는다') end,ClearTimer=function() end}
local effects={}
_EffectService={PlayEffect=function(_,ruid,inst,pos,rot,scale,loop,opt) table.insert(effects,{ruid=ruid}) return #effects end,
 PlayEffectAttached=function(_,ruid) table.insert(effects,{ruid=ruid,attached=true}) return #effects end,RemoveEffect=function() end}
-- 프레임 재생 대역 (Util.PlayFramesMs·Loop 본문은 skillfx_e에서 따로 본다)
local plays={}
function Util:PlayFramesMs(ruids,inst,pos,rot,scale,ms,holdSec,fadeSec,tint,order) table.insert(plays,{fn='ms',ruids=ruids,inst=inst,pos=pos,rot=rot,scale=scale,ms=ms,holdSec=holdSec,fadeSec=fadeSec,tint=tint,order=order}) end
function Util:PlayFramesLoop(ruids,inst,pos,rot,scale,frameSec,seconds,tint,order) table.insert(plays,{fn='loop',ruids=ruids,inst=inst,pos=pos,rot=rot,scale=scale,frameSec=frameSec,seconds=seconds,tint=tint,order=order}) end
function Util:PlayFramesLoopMs(ruids,inst,pos,rot,scale,ms,releaseN,loopSec,fadeSec,tint,order) table.insert(plays,{fn='loopms',ruids=ruids,inst=inst,pos=pos,rot=rot,scale=scale,ms=ms,releaseN=releaseN,loopSec=loopSec,fadeSec=fadeSec,tint=tint,order=order}) end
local function reset() plays={} effects={} logs={} end

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
local art,artRuidCount={},{}
local first=true
for line in io.lines('data/art_sprites.csv') do
 if first then first=false else
  local name,kind,w,h,ruid=line:match('^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$')
  if name then art[name]={kind=kind,w=tonumber(w),h=tonumber(h),ruid=ruid} artRuidCount[ruid]=(artRuidCount[ruid] or 0)+1 end
 end
end

-- ① 자리 · art_sprites
-- 10-31 통일 공정 5종 전체: 자리 → 코덱스 묶음 · 캔버스 · 장별 ms 자리 · 옛 fx-C 이름
local UNIFY={FxSkillBlast={'bone-blast',384,288,'FxSkillBlastMs','FxBlast'},FxSkillDeathWave={'death-wave',768,512,'FxSkillDeathWaveMs','FxWave'},FxSkillPoisonCloud={'poison-cloud',384,320,'FxSkillPoisonCloudMs','FxPoisonCloud'}}
local SLOTS={ -- 자리 · 코덱스 logical_id · 캔버스
 {'FxSkillBlast','FxBlast',192,192},{'FxSkillOfferingHeal','FxOffering',192,192},{'FxSkillDeathWave','FxWave',256,256},
 {'FxSkillFlameShot','FxFlameShot',128,64},{'FxSkillFrostShot','FxFrostShot',128,64},{'FxSkillPoisonCloud','FxPoisonCloud',256,256},{'FxSkillSlash','FxSlash',128,96}}
do
 local seen={}
 for _,s in ipairs(SLOTS) do
  local list=Util:Frames(_GameConst[s[1]] or '')
  local u=UNIFY[s[1]]
  ok(#list==(u and 10 or 4),s[1]..' '..(u and 10 or 4)..'장 ('..#list..')')
  for i,r in ipairs(list) do
   local name='fx-C-'..s[2]..'-core-0'..(i-1)
   local w,h=s[3],s[4]
   -- 10-31 통일 공정 보정 재출력: 서리탄은 fx-unify-frost-shot-00~03 256×128(고해상도 원본 다운샘플)로 교체 · 옛 fx-C-FxFrostShot 행은 남김
   if s[1]=='FxSkillFrostShot' then name='fx-unify-frost-shot-0'..(i-1) w,h=256,128 end
   -- 10-31 통일 공정 5종 전체: 폭발·파동·독 구름은 fx-unify-* 10장 (옛 fx-C 4장 행은 남김)
   if u then name=string.format('fx-unify-%s-%02d',u[1],i-1) w,h=u[2],u[3] end
   ok(#r==32 and r:match('^%x+$')~=nil,s[1]..' '..i..' 32자리 hex')
   local a=art[name]
   ok(a~=nil and a.ruid==r,name..' art_sprites RUID 일치 (순서 포함)')
   ok(a.kind=='effect' and a.w==w and a.h==h,name..' effect '..w..'×'..h)
   ok(artRuidCount[r]==1,name..' art_sprites 행 1개 (다른 그림과 RUID 중복 없음)')
   ok(seen[r]==nil,name..' 자리끼리 중복 없음') seen[r]=true
  end
 end
 local rows=0 for name in pairs(art) do if name:match('^fx%-C%-') then rows=rows+1 end end
 ok(rows==28,'art_sprites C 7종 행 28개 ('..rows..')')
 local gcSrc=io.open('RootDesk/MyDesk/Common/GameConst.mlua'):read('a')
 for i=0,3 do
  local a=art['fx-C-FxFrostShot-core-0'..i]
  ok(a~=nil and a.w==128 and a.h==64 and not seen[a.ruid],'옛 서리탄 core-0'..i..' 행 남김 · 자리에서 빠짐')
  ok(gcSrc:find('옛: ',1,true)~=nil and gcSrc:find(a.ruid,1,true)~=nil,'옛 서리탄 core-0'..i..' RUID는 GameConst 주석 「옛: …」에')
 end
 -- 10-31 통일 공정 5종 전체: 옛 fx-C 4장 행 남김 · 자리에서 빠짐 · 주석 「옛: …」 · 장별 ms 개수 = 장 수
 local ONCE,LOOP='70,70,70,70,100,110,120,130,140,150','100,100,100,100,100,100,100,100,130,150'
 for slotName,u in pairs(UNIFY) do
  for i=0,3 do
   local a=art['fx-C-'..u[5]..'-core-0'..i]
   ok(a~=nil and a.w==(u[5]=='FxBlast' and 192 or 256) and not seen[a.ruid],'옛 '..u[5]..' core-0'..i..' 행 남김 · 자리에서 빠짐')
   ok(gcSrc:find(a.ruid,1,true)~=nil,'옛 '..u[5]..' core-0'..i..' RUID는 GameConst 주석 「옛: …」에')
  end
  local ms=_GameConst[u[4]]
  ok(type(ms)=='string' and Util:MsCount(ms)==#Util:Frames(_GameConst[slotName]) and Util:MsCount(ms)==10,u[4]..' 개수 = 장 수 10')
  ok(ms==(slotName=='FxSkillPoisonCloud' and LOOP or ONCE),u[4]..' = 코덱스 animation-timing 제안')
 end
 ok(near(Util:FramePlanMs(ONCE,10,0,0).clearAt,1.03),'한 번 계열 = 시작 2·정점 2·잦아듦 6 · 합 1030ms (상승 140 : 잦아듦 750 ≥ 1:2)')
 ok(near(Util:MsTailSec(LOOP,2),0.28) and _GameConst.FxSkillUnifyReleaseN==2,'지속 계열 잦아듦 2장 = 130+150ms')
 local unifyRows=0 for name in pairs(art) do if name:match('^fx%-unify%-bone%-blast%-') or name:match('^fx%-unify%-death%-wave%-') or name:match('^fx%-unify%-poison%-cloud%-') then unifyRows=unifyRows+1 end end
 ok(unifyRows==30,'art_sprites 통일 공정 폭발·파동·독 구름 행 30개 ('..unifyRows..')')
 ok(type(_GameConst.FxSkillC7FrameMs)=='number' and _GameConst.FxSkillC7FrameMs==100,'FxSkillC7FrameMs 100 (코덱스 제안 · 양수)')
end

local me={CurrentMap='m1',TransformComponent={WorldPosition=Vector3(0,0,0)}}
_UserService={LocalPlayer=me}

-- ② 크기: 새 그림 보이는 폭 = 예전 클립 보이는 폭 (audit 크기w칸) · 새 내용 폭 = 10-31 실측(알파>16 · 4장 중 최대)
local FIT={blast=335,offering=183,wave=743,poison=342}   -- 10-31 통일 공정 5종 전체 10장 중 최대 (폭발 03 · 파동 03 · 독 구름 03) · 성찬은 C 그대로
local OLDFIT={blast=183,wave=243,poison=244}   -- 옛 C 4장 판 (되돌릴 때 C7FitPx 값 · 주석에 남김)
local AUDIT={ -- 예전 배율 → 예전 보이는 폭 (skillfx-inventory 크기w칸)
 {'blast',0.75,3.25,'P38 해골 폭탄 (BombRadius 1.6)'},{'blast',0.45,1.95,'P36 제물 폭발'},{'offering',1.1,1.46,'P35 뼈 성찬 (반경 4)'},
 {'wave',2.6,6.37,'P29 죽음의 파동'},{'poison',1.25,2.68,'P12 독안개 (반경 1.3)'}}
do
 for k,v in pairs(FIT) do ok(near(SkillEffects:C7Opt(SkillEffects.C7FitPx,k,0),v),k..' 내용 폭 표 = 실측 '..v..'px') end
 for _,a in ipairs(AUDIT) do
  local s=SkillEffects:C7Scale(a[1],a[2])
  ok(near(FIT[a[1]]*s/100,a[3],0.01),a[4]..' 새 내용 폭 '..string.format('%.2f',FIT[a[1]]*s/100)..' = 예전 '..a[3]..'칸')
 end
 ok(near(SkillEffects:C7Scale('blast',0.75*2.0/1.6)/SkillEffects:C7Scale('blast',0.75),1.25),'폭탄 반경이 커지면 같은 비율 (BombRadius 2.0)')
 ok(near(SkillEffects:C7Scale('poison',1.25*1.95/1.3)/SkillEffects:C7Scale('poison',1.25),1.5),'독안개 반경이 커지면 같은 비율')
 ok(SkillEffects:C7Scale('nothing',0.7)==0.7,'표에 없는 종류는 예전 배율 그대로')
 -- 통일 공정 배율 (보이는 폭 그대로 · 큰 캔버스라 배율은 작아짐) · 옛 4장 판 배율 대비
 local NEWS={{'wave',2.6,0.857},{'blast',0.75,0.970},{'blast',0.45,0.582},{'poison',1.25,0.784}}
 for _,v in ipairs(NEWS) do
  local sc=SkillEffects:C7Scale(v[1],v[2])
  ok(near(sc,v[3],0.001),v[1]..' 예전 배율 '..v[2]..' → 새 배율 '..string.format('%.3f',sc))
  local old=v[2]*SkillEffects:C7Opt(SkillEffects.C7OldW,v[1],0)*100/OLDFIT[v[1]]
  ok(near(OLDFIT[v[1]]*old/100,FIT[v[1]]*sc/100,0.001),v[1]..' 옛 4장 판('..string.format('%.3f',old)..')과 보이는 폭 같음')
 end
 local seSrc=io.open('RootDesk/MyDesk/Skill/SkillEffects.mlua'):read('a')
 ok(seSrc:find('옛 C7 4장 판: blast=183;wave=243;poison=244',1,true)~=nil,'옛 내용 폭은 C7FitPx 주석에 (되돌림용)')
 local ORD={blast=6,offering=6,wave=1,poison=1}   -- 10-31 메이커 회차: 제물 폭발·성찬 치유는 몸에 가려 판독 불가 → 6(몸 앞) · 파동·독 구름은 1
 for k,v in pairs(ORD) do ok(SkillEffects:C7Opt(SkillEffects.C7Orders,k,0)==v,k..' 층 MapLayer0 '..v) end
 ok(near(SkillEffects:C7Opt(SkillEffects.C7OldW,'blast',0),4.333) and near(SkillEffects:C7Opt(SkillEffects.C7OldW,'offering',0),1.327),'제물 폭발 1.95칸·성찬 1.46칸 크기 표 그대로 (층만 바꿈)')
 ok(near(SkillEffects.C7HoldSec,0.2) and near(SkillEffects.C7FadeSec,0.25),'한 번 계열 마지막 장 0.2초 + 옅어짐 0.25초')
end

-- ② C7Clip: 채우면 새 4장(발) · 비우면 예전 ClipFx(발 + 예전 높이 · 예전 배율 · 시간)
do
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 local calls={}
 fx.ClipFx=function(_,...) table.insert(calls,{'clip',...}) end
 fx.C7Fx=function(_,...) table.insert(calls,{'c7',...}) end
 local OLD={blast='FxBlast',offering='FxOffering',wave='FxWave',poison='FxPoisonCloud'}
 local SLOT={blast='FxSkillBlast',offering='FxSkillOfferingHeal',wave='FxSkillDeathWave',poison='FxSkillPoisonCloud'}
 for kind,old in pairs(OLD) do
  calls={}
  fx:C7Clip(kind,Vector3(2,3,0),0.4,0.5,1.2)
  local c=calls[1]
  ok(#calls==1 and c[1]=='c7' and c[2]==kind and c[3].x==2 and c[3].y==3 and near(c[4],SkillEffects:C7Scale(kind,0.5)) and c[5]==1.2,kind..' 채우면 새 4장 · 발 그대로(지면 원점 피벗) · 새 배율')
  _GameConst[SLOT[kind]]=''
  calls={}
  fx:C7Clip(kind,Vector3(2,3,0),0.4,0.5,1.2)
  c=calls[1]
  ok(#calls==1 and c[1]=='clip' and c[2]==SkillEffects[old] and c[3].x==2 and near(c[3].y,3.4) and c[4]==0.5 and c[5]==1.2 and c[6]==0,kind..' 비면 예전 메이플 원본 '..old..' (발 + 0.4 · 예전 배율·시간)')
  restore()
 end
 ok(SkillEffects.FxBlast=='22444db0645d47f48f300f36b3d90e4b' and SkillEffects.FxOffering=='b92b4c5e6a8a47f7867204509ba9e4fe' and SkillEffects.FxWave=='19fd8c7d47ec44aeb467bad744659899' and SkillEffects.FxPoisonCloud=='71898bc523f441e39f00f25ac4989166','예전 메이플 원본 RUID는 되돌림용으로 그대로')
end

-- ② C7Fx (클라이언트 재생)
do
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 -- 10-31 통일 공정 5종 전체: 폭발·파동 = 10장 장별 ms 한 번 (잦아듦이 그림에 들어 있어 hold·fade 0)
 for _,kind in ipairs({'blast','wave'}) do
  reset() fx:C7Fx(kind,Vector3(1,2,0),1.5,0.9)
  local p=plays[1]
  local ms=SkillEffects:C7Ms(kind)
  ok(#plays==1 and p.fn=='ms' and p.ruids==SkillEffects:C7Ruids(kind) and p.ms==ms and ms=='70,70,70,70,100,110,120,130,140,150' and p.inst=='m1',kind..' 10장 한 번 · 장별 ms · 맵에 붙임')
  ok(p.holdSec==0 and p.fadeSec==0 and p.order==(kind=='wave' and 1 or 6) and p.scale.x==1.5 and p.scale.y==1.5 and p.pos.y==2 and p.rot==0,kind..' hold·fade 0 (잦아듦 6장이 그림 알파) · 층(폭발 6 몸 앞 · 파동 1) · 가로=세로 · 발 자리')
  ok(p.tint.r==1 and p.tint.g==1 and p.tint.b==1 and p.tint.a==1,kind..' 그림 자기 색')
  ok(#logs==1 and logs[1]:find('[VRF] c7 fx kind='..kind..' n=10 ms='..ms,1,true)~=nil and logs[1]:find('loop=false',1,true)~=nil and logs[1]:find('unify=true total=1.03',1,true)~=nil,kind..' [VRF] 한 줄 (n=10 · 1.03초)')
  ok(logs[1]:find('order='..(kind=='wave' and 1 or 6),1,true)~=nil,kind..' [VRF] order 값')
 end
 -- 성찬 치유는 C 4장 그대로 (예전 길)
 reset() fx:C7Fx('offering',Vector3(1,2,0),1.5,0.9)
 local p=plays[1]
 ok(#plays==1 and p.fn=='ms' and p.ms=='100' and near(p.holdSec,SkillEffects.C7HoldSec) and near(p.fadeSec,SkillEffects.C7FadeSec) and p.order==6,'성찬 치유 4장 100ms · 마지막 장 유지·옅어짐 · 몸 앞 (예전 길)')
 ok(#logs==1 and logs[1]:find('[VRF] c7 fx kind=offering n=4 ms=100 ',1,true)~=nil and logs[1]:find('unify=false',1,true)~=nil,'성찬 [VRF] unify=false')
 -- 독 구름 = 반복 8장 → 잦아듦 2장 → 옅어짐 · 전체 ≈ 지속 시간
 reset() fx:C7Fx('poison',Vector3(1,2,0),1.1,5)
 p=plays[1]
 ok(#plays==1 and p.fn=='loopms' and p.ruids==_GameConst.FxSkillPoisonCloud and p.ms==_GameConst.FxSkillPoisonCloudMs and p.releaseN==2 and p.order==1 and p.pos.y==2,'독 구름 = 장별 ms 반복 + 잦아듦 2장 (Util.PlayFramesLoopMs) · 층 1')
 ok(near(p.loopSec,5-0.28-SkillEffects.C7FadeSec) and near(p.fadeSec,SkillEffects.C7FadeSec),'반복 시간 = 지속 5초 − 잦아듦 0.28 − 옅어짐 '..SkillEffects.C7FadeSec)
 local plan=Util:FramePlanLoopMs(p.ms,10,2,p.loopSec,p.fadeSec)
 ok(plan~=nil and math.abs(plan.clearAt-5)<=0.1,'독 구름 전체 '..string.format('%.2f',plan.clearAt)..'초 ≈ 지속 5초')
 ok(#logs==1 and logs[1]:find('loop=true',1,true)~=nil and logs[1]:find('unify=true',1,true)~=nil,'독 구름 [VRF] 한 줄')
 _GameConst.FxSkillC7FrameMs=50
 reset() fx:C7Fx('offering',Vector3(0,0,0),1,0.6)
 ok(plays[1].ms=='50','예전 길 장 간격은 FxSkillC7FrameMs 하나만 바꾸면')
 restore()
 -- 되돌림: 자리에 옛 C 4장을 넣으면 (ms 개수 10 ≠ 4) 예전 길 그대로
 local function oldC(id) local t={} for i=0,3 do t[#t+1]=art['fx-C-'..id..'-core-0'..i].ruid end return table.concat(t,'|') end
 _GameConst.FxSkillDeathWave=oldC('FxWave') _GameConst.FxSkillBlast=oldC('FxBlast') _GameConst.FxSkillPoisonCloud=oldC('FxPoisonCloud')
 for _,kind in ipairs({'blast','wave'}) do
  reset() fx:C7Fx(kind,Vector3(1,2,0),1.5,0.9)
  ok(plays[1].fn=='ms' and plays[1].ms=='100' and near(plays[1].holdSec,SkillEffects.C7HoldSec) and near(plays[1].fadeSec,SkillEffects.C7FadeSec) and logs[1]:find('n=4 ms=100 ',1,true)~=nil,kind..' 옛 4장으로 되돌리면 100ms + 유지 + 옅어짐')
 end
 reset() fx:C7Fx('poison',Vector3(1,2,0),1.1,5)
 ok(plays[1].fn=='loop' and near(plays[1].frameSec,0.1) and plays[1].seconds==5,'독 구름 옛 4장으로 되돌리면 4장 0.1초 반복')
 restore()
 local other=setmetatable({Entity={CurrentMap='m2'}},{__index=SkillEffects})
 reset() other:C7Fx('wave',Vector3(0,0,0),1,0.6)
 ok(#plays==0,'다른 맵이면 그리지 않는다')
 local someone=setmetatable({Entity={CurrentMap='m1'}},{__index=SkillEffects})
 reset() someone:C7Fx('wave',Vector3(0,0,0),1,0.6)
 ok(#plays==1 and #logs==0,'다른 플레이어 시전도 그리고 [VRF]는 내 시전만')
 published=true reset() fx:C7Fx('wave',Vector3(0,0,0),1,0.6)
 ok(#plays==1 and #logs==0,'출시 서버는 [VRF] 끔')
 published=false
 _GameConst.FxSkillDeathWave=''
 reset() fx:C7Fx('wave',Vector3(0,0,0),1,0.6)
 ok(#plays==0,'칸이 비면 C7Fx는 아무것도 안 그림')
 restore()
end

-- ② 투사체 2종: MirrorSkin(순환·FlipY) · 진행 각 보정 0 · 비면 예전 메이플 원본(보정 180)
do
 for _,k in ipairs({'FxSkillFlameShot','FxSkillFrostShot'}) do
  local p=setmetatable({SkinRuid=_GameConst[k],AngleOffset=180},{__index=Projectile})
  ok(p:MirrorSkin() and near(p:FrameSec(),0.1),k..' = 오른쪽 기준 그림 · 0.1초 순환 (FxSkillC7FrameMs)')
  ok(p:ViewAngleOffset()==0,k..' 진행 각 보정 0 (모델 값 180을 더하면 거꾸로 난다)')
  local sprite={FlipY=false}
  p.Entity={SpriteRendererComponent=sprite}
  p.ViewDir={x=-1,y=0} p:FaceMirror()
  ok(sprite.FlipY==true,k..' 왼쪽으로 날면 FlipY (회전 180° + FlipY = 가로 거울)')
  p.ViewDir={x=1,y=0.2} p:FaceMirror()
  ok(sprite.FlipY==false,k..' 오른쪽이면 FlipY 끔')
 end
 _GameConst.FxSkillC7FrameMs=80
 ok(near(setmetatable({SkinRuid=_GameConst.FxSkillFlameShot},{__index=Projectile}):FrameSec(),0.08),'투사체 장 간격도 FxSkillC7FrameMs')
 restore()
 local old=setmetatable({SkinRuid='40f0991c2e204ee888670cb3006382e5',AngleOffset=180},{__index=Projectile})
 ok(not old:MirrorSkin() and old:ViewAngleOffset()==180 and near(old:FrameSec(),0.08),'예전 메이플 불꽃(한 장 클립)은 보정 180 · 순환 없음 그대로')
 local shard=setmetatable({SkinRuid=_GameConst.FxSkillShardThrow,AngleOffset=180},{__index=Projectile})
 ok(shard:MirrorSkin() and shard:ViewAngleOffset()==0 and near(shard:FrameSec(),_GameConst.FxSkillShardThrowMs/1000),'골편 투척(오른쪽 기준)도 보정 0 · 간격은 자기 상수(11-01 FxSkillShardThrowMs 70)')
 _GameConst.FxSkillFlameShot='' _GameConst.FxSkillFrostShot=''
 local empty=setmetatable({SkinRuid='',AngleOffset=180},{__index=Projectile})
 ok(not empty:MirrorSkin(),'칸이 비어도 빈 그림을 오른쪽 기준으로 잘못 보지 않는다')
 restore()
end

-- ② MageBolts.Configure: 채우면 새 4장 · 보이는 폭 = 예전 · Tint 유지 · 비면 예전 메이플 원본·배율
do
 local function fake()
  local p={HitKind=''}
  function p:Skin(r,s) self.ruid=r self.sx=s end
  function p:SkinXY(r,x,y) self.ruid=r self.sx=x end
  function p:Tint(c) self.tint=c end
  return p
 end
 -- 서리탄 내용 폭 = 10-31 통일 공정 보정 재출력 256×128 실측 235px (예전 128×64 판 117px)
 local AUD={fire={'FxSkillFlameShot',115,1.38,'P06 저주 불꽃',{1,0.75,0.55}},cold={'FxSkillFrostShot',235,1.88,'P08 서리 혼',{0.85,0.95,1}},cold_shard={'FxSkillFrostShot',235,1.26,'P09 서리 파편',{0.85,0.95,1}}}
 local OLDS={fire={'40f0991c2e204ee888670cb3006382e5',0.45},cold={'d5a9e48c2d654726811db8b127699233',0.6},cold_shard={'d5a9e48c2d654726811db8b127699233',0.4}}
 reset()
 for school,a in pairs(AUD) do
  local p=fake() MageBolts:Configure(p,school)
  ok(p.ruid==_GameConst[a[1]],school..' 새 4장 '..a[1])
  ok(near(a[2]*p.sx/100,a[3],0.03),a[4]..' 보이는 폭 '..string.format('%.2f',a[2]*p.sx/100)..' ≈ 예전 '..a[3]..'칸')
  ok(near(p.tint.r,a[5][1]) and near(p.tint.g,a[5][2]) and near(p.tint.b,a[5][3]),school..' 속성 색 Tint 그대로')
  ok(p.HitKind==(school=='fire' and 'fire' or 'frost'),school..' 명중 속성 그대로 (9계열 FxSkillHit*)')
 end
 ok(#logs==3,'[VRF] 속성마다 한 줄 ('..#logs..')')
 local p=fake() MageBolts:Configure(p,'fire')
 ok(#logs==3,'같은 속성 두 번째는 [VRF] 없음')
 ok(near(115*MageBolts.GiantFlameArtScale/100,2.45,0.03),'마법사 거인 화염 구슬: 예전 0.8배 = 2.45칸 그대로')
 ok(near(MageBolts.FrostShotArtScale,0.796) and near(MageBolts.FrostShardArtScale,0.533),'서리탄 배율 0.796 · 파편 0.533 (128×64 판 1.6 · 1.07)')
 ok(near(235*MageBolts.FrostShotArtScale/100,117*1.6/100,0.005) and near(235*MageBolts.FrostShardArtScale/100,117*1.07/100,0.005),'보정 재출력 보이는 길이 = 128×64 판 때 그대로 (1.87 · 1.25칸)')
 _GameConst.FxSkillFlameShot='' _GameConst.FxSkillFrostShot=''
 for school,o in pairs(OLDS) do
  local q=fake() MageBolts:Configure(q,school)
  ok(q.ruid==o[1] and q.sx==o[2],school..' 비면 예전 메이플 원본 · 배율 '..o[2])
 end
 restore()
 ok(MageBolts.FxFlameShot=='40f0991c2e204ee888670cb3006382e5' and MageBolts.FxFrostShot=='d5a9e48c2d654726811db8b127699233','예전 RUID는 되돌림용으로 그대로 (mage_school 같은지 검사 유지)')
end

-- ② 중립 베기 Util.SkillSlashFx
do
 Util.SlashLogged={}
 reset()
 local tint=Color(0.75,0.7,1,0.9)
 ok(Util:SkillSlashFx('m1',Vector3(1,2,0),30,0.55,true,tint,'player')==true,'채우면 true (부르는 쪽은 예전 FxSlash를 안 그림)')
 local p=plays[1]
 ok(p.fn=='ms' and p.ruids==_GameConst.FxSkillSlash and p.ms=='100' and p.holdSec==0 and p.fadeSec==0 and p.inst=='m1','베기 4장 한 번 100ms · 맵에 붙임')
 ok(near(p.scale.x,0.55*Util.SlashArtPerOld) and near(p.scale.y,0.55*Util.SlashArtPerOld) and p.rot==30 and p.tint==tint and p.order==Util.SlashArtOrder,'오른쪽: 거울 없음 · rot 그대로 · 부르는 쪽 Tint · 몸 앞')
 ok(near(113*0.55*Util.SlashArtPerOld/100,1.18,0.01),'플레이어 평타 보이는 폭 1.18칸 = 예전 (audit P01)')
 Util:SkillSlashFx('m1',Vector3(1,2,0),-30,0.55,false,tint,'player')
 ok(near(plays[2].scale.x,-plays[2].scale.y) and plays[2].scale.y>0 and plays[2].rot==-30,'왼쪽: 가로 배율 음수(가로 거울) · rot 그대로')
 ok(#logs==1 and logs[1]:find('[VRF] c7 slash player n=4 ms=100',1,true)~=nil,'[VRF] 부르는 쪽마다 처음 한 번')
 Util:SkillSlashFx('m1',Vector3(0,0,0),0,0.45,true,Color(1,0.45,0.4,0.85),'monster')
 Util:SkillSlashFx('m1',Vector3(0,0,0),0,0.25,true,Color(0.75,0.7,0.8,0.65),'summon')
 ok(#logs==3,'몬스터·소환수 각 한 줄')
 ok(near(113*0.25*Util.SlashArtPerOld/100,0.54,0.01) and near(113*0.45*Util.SlashArtPerOld/100,0.97,0.03),'소환수 0.54칸 · 몬스터 0.97칸 ≈ 예전 (S05 0.54 · B21 1.0)')
 _GameConst.FxSkillSlash=''
 reset()
 ok(Util:SkillSlashFx('m1',Vector3(0,0,0),0,0.55,true,tint,'player')==false and #plays==0,'비면 false · 그리지 않음 (부르는 쪽이 예전 FxSlash)')
 restore()
end

-- ③ 미리 불러 두기: 자리마다 모든 장 (10-31 스킬 그림 후속 · 메이커 회차 README 3-1)
do
 local fx=setmetatable({Entity=me,VisualTimers={}},{__index=SkillEffects})
 reset() fx:OnBeginPlay()
 local pre={} for _,e in ipairs(effects) do if e.attached then table.insert(pre,e.ruid) end end

 local got,dup={},0
 for _,r in ipairs(pre) do if got[r] then dup=dup+1 end got[r]=true end
 ok(#pre>0 and dup==0,'미리 불러 두기 RUID 중복 없음 ('..#pre..'장)')
 local function all(list,name) local n=0 for _,r in ipairs(list) do if got[r] then n=n+1 end end ok(#list>0 and n==#list,name..' 모든 장 미리 불러 둠 ('..n..'/'..#list..')') end
 for _,s in ipairs(SLOTS) do local l=Util:Frames(_GameConst[s[1]]) ok(#l==(UNIFY[s[1]] and 10 or 4),s[1]..' 장 수') all(l,s[1]) end

 local line=nil for _,l in ipairs(logs) do if l:find('[VRF] preload n=',1,true) then line=l end end
 ok(line~=nil and tonumber(line:match('n=(%d+)'))==#pre and tonumber(line:match('started=(%d+)'))==#pre,'[VRF] preload n = 실제 미리 부른 장 수 '..#pre..' (한 줄)')
 local src=io.open('RootDesk/MyDesk/Skill/SkillEffects.mlua'):read('a'):match('method void OnBeginPlay%(%)(.-)\n    end\n')
 ok(src~=nil and src:find(')[1]',1,true)==nil,'OnBeginPlay에 첫 장만 넣는 길(…)[1]) 없음')
end

-- ③ 부르는 곳 (grep)
do
 local function read(f) local h=assert(io.open('RootDesk/MyDesk/'..f)) local s=h:read('a') h:close() return s end
 local se,su,us,pa,ma,mb,pj=read('Skill/SkillEffects.mlua'),read('Shadow/ShadowUnit.mlua'),read('Undead/UndeadSystem.mlua'),read('Combat/PlayerAttack.mlua'),read('Monster/MonsterAttack.mlua'),read('Undead/MageBolts.mlua'),read('Combat/Projectile.mlua')
 local function count(s,pat) local n,i=0,1 while true do local a,b=s:find(pat,i,true) if not a then return n end n=n+1 i=b+1 end end
 ok(count(se,'self:C7Clip("poison", Vector3(target.x, target.y, 0), 0.3, 1.25 * radius / 1.3, seconds)')==1,'독안개 PoisonMist → C7Clip poison (예전 높이 0.3 · 배율 · 지속 시간)')
 ok(count(se,'self:C7Clip("wave", Vector3(p.x, p.y, 0), 0.3, 2.6, 0.6)')==1,'죽음의 파동 DeathWave → C7Clip wave')
 ok(count(su,'fx:C7Clip("blast", Vector3(p.x, p.y, 0), 0.5, 0.75 * self.BombRadius / 1.6, 1.2)')==1,'해골 폭탄 BombExplode → C7Clip blast')
 ok(count(us,'fx:C7Clip("offering", Vector3(center.x, center.y, 0), 0.2, 1.1 * radius / 4, 0.9)')==1 and count(us,'fx:C7Clip("blast", Vector3(from.x, from.y, 0), 0.4, 0.45, 0.8)')==1,'뼈 성찬 → 치유 고리 offering + 제물 폭발 blast')
 for _,pat in ipairs({'ClipFx(self.FxPoisonCloud','ClipFx(self.FxWave','ClipFx(fx.FxBlast','ClipFx(fx.FxOffering','ClipFx(self.FxBlast','ClipFx(self.FxOffering'}) do
  ok(count(se,pat)+count(su,pat)+count(us,pat)==0,pat..' 직접 부름 없음 (예전 길은 C7Clip 안 되돌림 하나뿐)')
 end
 ok(count(se,'self:ClipFx(self:C7OldRuid(kind)')==1,'예전 ClipFx 되돌림 = C7Clip 안 한 곳')
 for _,c in ipairs({{pa,'"player")','Color(0.75, 0.7, 1, 0.9)'},{su,'"summon")','Color(0.75, 0.7, 0.8, 0.65)'},{ma,'"monster")','Color(1, 0.45, 0.4, 0.85)'}}) do
  ok(count(c[1],'_Util:SkillSlashFx(self.Entity.CurrentMap')==1 and count(c[1],c[2])==1,c[2]..' 베기 → Util.SkillSlashFx')
  ok(count(c[1],'_EffectService:PlayEffect(_GameConst.FxSlash')>=1 and count(c[1],c[3])>=2,c[2]..' 비면 예전 FxSlash · 같은 Tint')
 end
 ok(su:find('if _GameConst.FxSkillFlameShot ~= "" then proj:Skin(_GameConst.FxSkillFlameShot, _MageBolts.GiantFlameArtScale)',1,true)~=nil and su:find('else proj:Skin(_MageBolts.FxFlameShot, 0.8) end',1,true)~=nil,'마법사 거인 화염 구슬 → 불꽃탄 4장 · 비면 예전')
 ok(count(mb,'proj:Skin(_GameConst.FxSkillFlameShot, self.FlameShotArtScale)')==1 and count(mb,'proj:Skin(_GameConst.FxSkillFrostShot, self.FrostShotArtScale)')==1 and count(mb,'proj:Skin(_GameConst.FxSkillFrostShot, self.FrostShardArtScale)')==1,'MageBolts fire·cold·cold_shard 학파 분기 3곳')
 ok(count(pj,'+ self:ViewAngleOffset()')==2 and count(pj,'+ self.AngleOffset')==0,'Projectile 진행 각(서버 Launch·클라이언트 그림) 모두 ViewAngleOffset')
 ok(count(pj,'s == _GameConst.FxSkillFlameShot or s == _GameConst.FxSkillFrostShot')==1,'MirrorSkin 목록에 불꽃탄·서리탄')
 -- 바꾸지 않은 되돌림 전용 길 (그림 칸이 차 있어 실행되지 않음)
 ok(count(se,'else self:ClipFx(self.FxFlameShot, Vector3(at.x, at.y + 0.35, 0), 0.45 * radius, 0.45, 0) end')==1 and count(se,'else self:ClipFx(self.FxFrostShot, Vector3(at.x, at.y + 0.4, 0), 0.5, 0.5, 0) end')==1,'저주 불꽃 폭발·파쇄는 FxSkillHexBurst·Shatter 빈 때의 길 그대로')
 ok(count(se,'self:ClipFxLocal(self.FxFlameShot, Vector3(pos.x, pos.y + 1.4, 0), 1.1, seconds, -90, tint)')==1,'거인 메테오 낙하 그림 없을 때 길 그대로')
 -- 새 길은 반복 타이머를 늘리지 않는다
 for _,m in ipairs({'C7Clip','C7Fx','C7Scale'}) do
  local body=se:match('method [^\n]- '..m..'%(.-\n    end\n')
  ok(body~=nil and body:find('SetTimer',1,true)==nil,m..' 타이머 없음 (장 넘김은 Util 클라이언트)')
 end
 ok(se:match('method void C7Clip%(.-\n    end\n'):find('ExecSpace',1,true)==nil and se:find('@ExecSpace("ServerOnly")\n    method void C7Clip(',1,true)~=nil and se:find('@ExecSpace("Multicast")\n    method void C7Fx(',1,true)~=nil,'C7Clip 서버 → C7Fx Multicast (예전 ClipFx 1:1)')
 -- [VRF] 계열당 한 줄
 ok(count(se,'[VRF] c7 fx kind=')==1 and count(mb,'[VRF] c7 projectile school=')==1 and count(read('Common/Util.mlua'),'[VRF] c7 slash ')==1,'[VRF] 바닥 4계열 · 투사체 · 베기 각 한 줄')
end

print(string.format('skillfx_c7: %d checks passed', checks))
