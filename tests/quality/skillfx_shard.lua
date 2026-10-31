-- 10-31 골편 계열 20장 (코덱스 assets/codex-skill-fx-v2/shard-full-20261031 · docs/evidence/2026-10-31-skillfx-shard20) — 실제 본문으로:
--   ① GameConst 골편 5자리 × 4장 · 32자리 hex · RUID 중복 0 · data/art_sprites.csv 20행(이름·kind effect·크기·RUID)과 일치 · 장 간격 ms 양수
--   ② Projectile.MirrorSkin·FrameSec·FaceMirror·AdvanceFrame: 골편 투사체 4계열만 100ms 순환 · 왼쪽으로 날면 FlipY(가로 거울) · 다른 프레임 그림 0.08초·FlipY 끔 (반례)
--   ③ SkillEffects.ShardSkinRuid/Scale·ShardHit·ShardHitFrames·StormOrbit: 채우면 새 그림 · 비우면 예전 FxShardShot/FxShardHit 그대로 (빈 자리 되돌림)
--   ④ 부르는 곳: 채운 자리마다 부르는 곳 · 창 골편은 쓸 자리 미정 · 골편 경로에 예전 보라 궤적/파열 직접 호출이 남지 않음 · 의식 화살은 rite-bone-arrow 대기
--   ⑥ 11-01 통일 공정 골편 3종 전체 14장(docs/evidence/2026-11-01-skillfx-unify-shard3): 골편 투척 192×96·중립 뼈 화살 256×128(길이 1.4배 큰 캔버스 판) 4장 × 70ms ·
--      골편 명중 native96 6장 장별 ms 40·50·50·80·100·130 · 의식 화살 = 중립 화살 RUID · 뼛가루·뼈 명중 = 골편 명중 6장 RUID · 보이는 길이 1.4배(투사체)·그대로(명중) ·
--      옛 fx-B 12행 남김·자리에서 빠짐·GameConst 주석 「옛:」 · ms 개수가 장 수와 다르면 예전 길
-- 엔진 효과·스프라이트는 대역 — 실제 화면(크기·색·뒤집힘)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames,KeyFrames,MsCount
-- @source Projectile Combat/Projectile.mlua MirrorSkin,FrameSec,FaceMirror,SkinFrame,AdvanceFrame
-- @source SkillEffects Skill/SkillEffects.mlua OnBeginPlay,ShardSkinRuid,ShardSkinScale,ShardHit,ShardHitFrames,StormOrbit
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local NL=string.char(10)
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function isvalid(x) return x~=nil and x~=false end
Environment={IsPublishedPlay=function() return false end}
local logs={}
function log(s) table.insert(logs,s) end
_UtilLogic={ElapsedSeconds=0}

-- 실제 GameConst 값
_GameConst={}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local k,v=line:match('^%s*property string (%w+) = "([^"]*)"')
 if k then _GameConst[k]=v end
 local ki,vi=line:match('^%s*property integer (%w+) = (%-?%d+)')
 if ki then _GameConst[ki]=tonumber(vi) end
end
-- art_sprites 표
local art,artRuidCount={},{}
local first=true
for line in io.lines('data/art_sprites.csv') do
 if first then first=false else
  local name,kind,w,h,ruid=line:match('^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$')
  if name then art[name]={kind=kind,w=tonumber(w),h=tonumber(h),ruid=ruid} artRuidCount[ruid]=(artRuidCount[ruid] or 0)+1 end
 end
end

-- ① 골편 5자리 · art_sprites (11-01 통일 공정: 투척·중립 화살 4장 큰 캔버스 · 명중 6장 · 창·폭풍 골편은 10-31 fx-B 그대로)
local SLOTS={
 {'FxSkillShardThrow','fx-unify-shard-throw-',192,96,4},
 {'FxSkillSpearShard','fx-B-spear-shard-sample-',128,64,4},
 {'FxSkillStormShard','fx-B-storm-shard-sample-',128,64,4},
 {'FxSkillBoneArrow','fx-unify-bone-arrow-neutral-',256,128,4},
 {'FxSkillShardHit','fx-unify-shard-hit-',96,96,6}}
local RETIRED_PREFIX={'fx-B-shard-throw-sample-','fx-B-bone-arrow-neutral-sample-','fx-B-shard-hit-sample-'}
do
 local seen,total={},0
 for _,s in ipairs(SLOTS) do
  local key,prefix,w,h,nf=s[1],s[2],s[3],s[4],s[5]
  ok(_GameConst[key]~=nil and _GameConst[key]~='',key..' 채움')
  local list=Util:Frames(_GameConst[key])
  ok(#list==nf,key..' '..nf..'장 ('..#list..')')
  for i,r in ipairs(list) do
   ok(#r==32 and r:match('^%x+$')~=nil,key..' '..i..' 32자리 hex')
   ok(not seen[r],key..' '..i..' RUID 중복 없음') seen[r]=true
   local name=prefix..string.format('%02d',i-1)
   local a=art[name]
   ok(a~=nil and a.ruid==r,name..' art_sprites RUID 일치')
   ok(a.kind=='effect' and a.w==w and a.h==h,name..' art_sprites effect '..w..'×'..h)
   ok(artRuidCount[r]==1,name..' art_sprites 행 1개')
   total=total+1
  end
 end
 ok(total==22,'골편 계열 22장 (투척 4 · 창 4 · 폭풍 4 · 중립 화살 4 · 명중 6)')
 local rows=0
 for name,_ in pairs(art) do
  for _,s in ipairs(SLOTS) do if name:sub(1,#s[2])==s[2] then rows=rows+1 end end
 end
 ok(rows==22,'art_sprites 골편 자리 행 22개 ('..rows..')')
 -- 옛 fx-B 투척·중립 화살·명중 12행: art_sprites에 남기고(되돌림 기록) 자리에서는 빠지고 GameConst 주석 「옛: …」에 RUID
 local gcSrc=io.open('RootDesk/MyDesk/Common/GameConst.mlua'):read('a')
 local retired=0
 for name,a in pairs(art) do
  for _,p in ipairs(RETIRED_PREFIX) do
   if name:sub(1,#p)==p then
    retired=retired+1
    ok(not seen[a.ruid],name..' 옛 행은 자리에서 빠짐')
    ok(gcSrc:find('옛[^\n]*'..a.ruid)~=nil,name..' 옛 RUID는 GameConst 주석 「옛: …」에 남김')
   end
  end
 end
 ok(retired==12,'옛 fx-B 골편 3종 행 12개 남김 ('..retired..')')
 ok(type(_GameConst.FxSkillShardFrameMs)=='number' and _GameConst.FxSkillShardFrameMs>0,'골편 장 간격 ms 양수')
 ok(_GameConst.FxSkillShardFrameMs==100,'폭풍·창 골편·예전 길 100ms 그대로')
 ok(_GameConst.FxSkillShardThrowMs==70 and _GameConst.FxSkillBoneArrowMs==70 and _GameConst.FxSkillRiteArrowMs==70,'투척·중립 화살·의식 화살 4장 × 70ms = 280ms 순환 (코덱스 proposal)')
 ok(_GameConst.FxSkillShardHitMs=='40,50,50,80,100,130' and Util:MsCount(_GameConst.FxSkillShardHitMs)==#Util:Frames(_GameConst.FxSkillShardHit),'명중 장별 ms 개수 = 장 수 6 (시작 1·정점 2·잦아듦 3)')
 local sum=0 for v in _GameConst.FxSkillShardHitMs:gmatch('[^,]+') do sum=sum+tonumber(v) end
 ok(sum==450,'명중 합 450ms (예전 4 × 100 = 400)')
 ok(_GameConst.FxSkillRiteArrow==_GameConst.FxSkillBoneArrow,'의식 3기 뼈 화살 = 중립 뼈 화살 같은 RUID 4장 (따로 그린 판 없음)')
 ok(_GameConst.FxSkillConsumedDust==_GameConst.FxSkillShardHit and _GameConst.FxSkillHitBone==_GameConst.FxSkillShardHit,'뼛가루·뼈 명중 = 골편 명중 6장 같은 RUID')
end

-- ② Projectile: 골편 투사체 4계열 순환·뒤집기
local function proj(skin,dx,dy)
 local sprite={FlipY=false,SpriteRUID='',Enable=true}
 local p=setmetatable({SkinRuid=skin,ViewDir={x=dx,y=dy or 0},ViewT0=0,ViewFrame=0,ViewHidden=false,Entity={SpriteRendererComponent=sprite}},{__index=Projectile})
 return p,sprite
end
do
 local SEC={FxSkillShardThrow=0.07,FxSkillSpearShard=0.1,FxSkillStormShard=0.1,FxSkillBoneArrow=0.07}   -- 11-01: 투척·중립 화살 70ms · 창·폭풍 골편 100ms 그대로
 for _,k in ipairs({'FxSkillShardThrow','FxSkillSpearShard','FxSkillStormShard','FxSkillBoneArrow'}) do
  local p,s=proj(_GameConst[k],-1)
  ok(p:MirrorSkin(),k..' 골편 투사체 그림')
  ok(near(p:FrameSec(),SEC[k]),k..' 장 간격 '..SEC[k]..'초')
  p:FaceMirror() ok(s.FlipY==true,k..' 왼쪽으로 날면 FlipY (회전 180° + FlipY = 가로 거울)')
  p.ViewDir={x=1,y=0} p:FaceMirror() ok(s.FlipY==false,k..' 오른쪽은 그대로')
  p.ViewDir={x=-0.2,y=0.98} p:FaceMirror() ok(s.FlipY==true,k..' 왼쪽 위로 비스듬히도 FlipY')
  p.ViewDir={x=0.2,y=-0.98} p:FaceMirror() ok(s.FlipY==false,k..' 오른쪽 아래는 그대로')
 end
 local p=proj(_GameConst.FxSkillShardHit,-1)
 ok(not p:MirrorSkin(),'명중 파편은 투사체 그림이 아니다')
 local q,qs=proj('a1|a2|a3',-1)
 ok(not q:MirrorSkin() and near(q:FrameSec(),0.08),'반례: 다른 프레임 그림은 예전 0.08초')
 qs.FlipY=true q:FaceMirror() ok(qs.FlipY==false,'다른 그림은 FlipY를 끈다 (재사용 투사체)')
 local r,rs=proj('423983c3b393414c8a8d91578b1fab9c',-1)
 ok(not r:MirrorSkin() and r:SkinFrame()=='423983c3b393414c8a8d91578b1fab9c','한 장 그림(예전 보라 궤적)은 그대로')
 r:FaceMirror() ok(rs.FlipY==false,'예전 보라 궤적은 뒤집지 않는다')
 local e=proj('',-1) ok(not e:MirrorSkin(),'빈 그림')
 -- 순환: 장 = floor(t / 0.07) % 4 + 1 (11-01 골편 투척 70ms · 경계 밖 시각만)
 local s,ss=proj(_GameConst.FxSkillShardThrow,1)
 local list=Util:Frames(_GameConst.FxSkillShardThrow)
 ss.SpriteRUID=s:SkinFrame()
 ok(ss.SpriteRUID==list[1],'첫 장')
 for _,tm in ipairs({0.03,0.1,0.17,0.24,0.31,0.38,0.52}) do
  _UtilLogic.ElapsedSeconds=tm
  s:AdvanceFrame()
  ok(ss.SpriteRUID==list[math.floor(tm/0.07)%4+1],'t='..tm..' 장 '..(math.floor(tm/0.07)%4+1))
 end
 ok(math.floor(0.24/0.1)%4+1~=math.floor(0.24/0.07)%4+1,'반례 확인: 예전 0.1초였다면 0.24초에 다른 장')
 local rite=proj(_GameConst.FxSkillRiteArrow,-1)
 ok(rite:MirrorSkin() and near(rite:FrameSec(),0.07),'의식 화살(= 중립 화살 RUID)도 오른쪽 기준 · 70ms')
 _UtilLogic.ElapsedSeconds=0
end

-- ③ SkillEffects: 채움/빈 자리 되돌림
local saved={}
for _,s in ipairs(SLOTS) do saved[s[1]]=_GameConst[s[1]] end
saved.FxSkillBoneStorm=_GameConst.FxSkillBoneStorm
local function restore() for k,v in pairs(saved) do _GameConst[k]=v end end
do
 local fx=setmetatable({Entity={}},{__index=SkillEffects})
 ok(fx:ShardSkinRuid()==_GameConst.FxSkillShardThrow,'골편 투사체 = 골편 투척 4장')
 ok(near(fx:ShardSkinScale(0.55),SkillEffects.ShardThrowScale),'예측·서버 배율 = ShardThrowScale')
 ok(near(fx:ShardSkinScale(0.5),SkillEffects.ShardThrowScale*0.5/0.55),'튕김 배율 = 예전 비(0.5/0.55)')
 local calls={}
 fx.ClipFx=function(_,...) table.insert(calls,{'clip',...}) end
 fx.ShardHitFrames=function(_,...) table.insert(calls,{'frames',...}) end
 fx:ShardHit(Vector3(1,2,0),0.5,0.6)
 ok(#calls==1 and calls[1][1]=='frames' and calls[1][3]==0.5,'명중 = 골편 명중 4장 (Multicast ShardHitFrames)')
 -- 빈 자리: 예전 그대로
 _GameConst.FxSkillShardThrow='' _GameConst.FxSkillShardHit=''
 ok(fx:ShardSkinRuid()==SkillEffects.FxShardShot,'비면 예전 보라 궤적 FxShardShot')
 ok(fx:ShardSkinScale(0.55)==0.55 and fx:ShardSkinScale(0.5)==0.5,'비면 예전 배율 0.55 · 0.5')
 calls={}
 fx:ShardHit(Vector3(1,2,0),0.45,0.5)
 ok(#calls==1 and calls[1][1]=='clip' and calls[1][2]==SkillEffects.FxShardHit and calls[1][4]==0.45 and calls[1][5]==0.5 and calls[1][6]==0,'비면 예전 보라 파열 ClipFx(FxShardHit, 0.45, 0.5초)')
 restore()
end
do
 local played={}
 Util.PlayFrames=function(_,ruids,inst,pos,rot,scale,frameSec,tint,order) table.insert(played,{ruids=ruids,inst=inst,pos=pos,scale=scale,frameSec=frameSec,tint=tint,order=order}) end
 Util.PlayFramesMs=function(_,ruids,inst,pos,rot,scale,ms,holdSec,fadeSec,tint,order) table.insert(played,{ruids=ruids,inst=inst,pos=pos,scale=scale,ms=ms,holdSec=holdSec,fadeSec=fadeSec,tint=tint,order=order}) end
 local me={CurrentMap='m1'}
 _UserService={LocalPlayer=me}
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 logs={}
 fx:ShardHitFrames(Vector3(3,4,0),0.5)
 local p=played[1]
 ok(p~=nil and p.ruids==_GameConst.FxSkillShardHit,'명중 6장을 한 번')
 ok(p.ms==_GameConst.FxSkillShardHitMs and p.holdSec==0 and p.fadeSec==0 and near(p.scale.x,SkillEffects.ShardHitScale) and p.scale.x==p.scale.y,'장별 ms 40·50·50·80·100·130 · 마지막 장 뒤 바로 지움(hold·fade 0) · 옛 0.5 = ShardHitScale')
 ok(p.order==SkillEffects.ShardHitOrder and p.tint==SkillEffects.ShardHitTint and p.pos.x==3 and p.pos.y==4,'층·뼈 흰빛·자리')
 ok(#logs==1 and logs[1]:find('[VRF] shard hit frames n=6 ms=40,50,50,80,100,130',1,true)~=nil,'[VRF] 명중 재생 한 줄')
 fx:ShardHitFrames(Vector3(0,0,0),0.45)
 ok(near(played[2].scale.x,SkillEffects.ShardHitScale*0.9),'옛 0.45 호출(의식 화살 뼛가루)은 비례 0.9배')
 local other=setmetatable({Entity={CurrentMap='m2'}},{__index=SkillEffects})
 other:ShardHitFrames(Vector3(0,0,0),0.5)
 ok(#played==2,'다른 맵 클라이언트는 그리지 않는다')
 _GameConst.FxSkillShardHit=''
 fx:ShardHitFrames(Vector3(0,0,0),0.5)
 ok(#played==2,'빈 자리면 그리지 않는다')
 -- 옛 4장 판으로 되돌리면(ms 개수 6 ≠ 장 수 4) 예전 길: 장마다 FxSkillShardFrameMs
 _GameConst.FxSkillShardHit='ce229a7c4c404dd8a16e46850e8d0b49|96e5b3e02fa7473087a3d70db10a8597|ff9b933599ef4b7985249eab24a60dc8|0076e17e8500400f969a2511a634b04e'
 logs={}
 fx:ShardHitFrames(Vector3(0,0,0),0.5)
 ok(#played==3 and played[3].ms==nil and near(played[3].frameSec,0.1),'옛 4장이면 예전 길 (장마다 0.1초)')
 ok(logs[1]:find('[VRF] shard hit frames n=4 ms=100',1,true)~=nil,'[VRF] 예전 길 한 줄')
 restore()
 -- 크기 환산 (알파>16 실측 · 4장/6장 중 가장 큰 장): 투사체 보이는 길이 = 옛 판 × 1.4 · 명중 보이는 크기 = 옛 판 그대로
 local suSrc=io.open('RootDesk/MyDesk/Shadow/ShadowUnit.mlua'):read('a')
 local boneArrowScale=tonumber(suSrc:match('property number BoneArrowScale = ([%d%.]+)'))
 ok(near(145*SkillEffects.ShardThrowScale,1.4*116*0.65,0.5),'골편 투척 보이는 몸 145px × '..SkillEffects.ShardThrowScale..' = 옛 116px × 0.65의 1.4배 (1.056칸)')
 ok(near(145*SkillEffects.ShardThrowScale*0.5/0.55,1.4*116*0.65*0.5/0.55,0.5),'튕김도 같은 비 (0.96칸)')
 ok(boneArrowScale~=nil and near(235*boneArrowScale,1.4*94*0.7,0.5),'중립 뼈 화살 235px × '..tostring(boneArrowScale)..' = 옛 94px × 0.7의 1.4배 (0.921칸)')
 ok(near(235*SkillEffects.RiteArrowScale,1.4*94*1.2,0.5),'의식 화살 235px × '..SkillEffects.RiteArrowScale..' = 옛 94px × 1.2의 1.4배 (1.579칸)')
 ok(near(84*SkillEffects.ShardHitScale,77*1.2,0.6),'골편 명중 가장 큰 내용 84px × '..SkillEffects.ShardHitScale..' = 옛 77px × 1.2 (0.92칸 그대로)')
 ok(near(84*SkillEffects.DustScale,77*1.1,0.6),'뼛가루 84px × '..SkillEffects.DustScale..' = 옛 77px × 1.1 (0.85칸 그대로)')
end
do
 -- 뼈 폭풍 도는 골편 6개 (회전본이 빈 때의 길)
 _GameConst.FxSkillBoneStorm=''
 local storm=Util:Frames(_GameConst.FxSkillStormShard)
 local shards={}
 for i=1,6 do shards[i]={TransformComponent={},SpriteRendererComponent={OrderInLayer=5,SpriteRUID='init',FlipY=false}} end
 local fx=setmetatable({Entity={TransformComponent={Scale={x=1,y=1,z=1}}},StormShards=shards,StormOrbitAt=0,StormOrbitUntil=99},{__index=SkillEffects})
 _UtilLogic.ElapsedSeconds=0.25
 fx:StormOrbit()
 local spin=2*math.pi*0.25/math.max(0.2,SkillEffects.StormSpinSeconds)
 local flips={[true]=0,[false]=0}
 for i,e in ipairs(shards) do
  local sp=e.SpriteRendererComponent
  ok(sp.SpriteRUID==storm[(2+i-1)%4+1],'도는 골편 '..i..' = 폭풍 골편 장 (골편마다 한 칸씩 어긋남)')
  local a=spin+(i-1)*2*math.pi/6
  ok(sp.FlipY==(math.cos(a+math.pi/2)<0),'도는 골편 '..i..' 접선이 왼쪽이면 FlipY')
  flips[sp.FlipY]=flips[sp.FlipY]+1
 end
 ok(flips[true]>0 and flips[false]>0,'궤도 반쪽씩 뒤집힘')
 -- 빈 자리: 장도 뒤집기도 건드리지 않는다 (예전 보라 궤적 그대로)
 _GameConst.FxSkillStormShard=''
 for _,e in ipairs(shards) do e.SpriteRendererComponent.SpriteRUID='old' e.SpriteRendererComponent.FlipY=false end
 fx:StormOrbit()
 for i,e in ipairs(shards) do ok(e.SpriteRendererComponent.SpriteRUID=='old' and e.SpriteRendererComponent.FlipY==false,'폭풍 골편이 비면 예전 그대로 '..i) end
 restore()
 _UtilLogic.ElapsedSeconds=0
end

-- ④ 부르는 곳 (grep)
do
 local function read(f) local h=assert(io.open('RootDesk/MyDesk/'..f)) local s=h:read('a') h:close() return s end
 local se,pj,su,us,mb,sr,ma=read('Skill/SkillEffects.mlua'),read('Combat/Projectile.mlua'),read('Shadow/ShadowUnit.mlua'),read('Undead/UndeadSystem.mlua'),read('Undead/MageBolts.mlua'),read('Undead/SkeletonResonance.mlua'),read('Monster/MonsterAttack.mlua')
 local all=se..pj..su..us..mb..sr..ma
 local function count(s,pat) local n,i=0,1 while true do local a,b=s:find(pat,i,true) if not a then return n end n=n+1 i=b+1 end end
 for _,k in ipairs({'FxSkillShardThrow','FxSkillStormShard','FxSkillBoneArrow','FxSkillShardHit','FxSkillShardFrameMs'}) do
  ok(all:find('_GameConst.'..k,1,true)~=nil,k..' 부르는 곳 있음')
 end
 ok(count(all,'_GameConst.FxSkillSpearShard')==1 and count(pj,'_GameConst.FxSkillSpearShard')==1,'창 골편은 쓸 자리 미정 (Projectile.MirrorSkin 목록에만)')
 -- 골편 경로: 예측·서버·튕김은 ShardSkinRuid · 명중·뼛가루는 ShardHit
 ok(count(se,'self:ShardSkinRuid(), self:ShardSkinScale(0.55)')==2 and count(se,'self:ShardSkinRuid(), self:ShardSkinScale(0.5))')==1,'골편 예측·서버(0.55)·튕김(0.5)')
 ok(se:find('PlayLocal(self.Entity, d, 12, 6.5, self.FxShardShot',1,true)==nil and se:find('proj:Skin(self.FxShardShot, 0.55)',1,true)==nil and se:find('proj:Skin(self.FxShardShot, 0.5)',1,true)==nil,'골편 경로에 예전 보라 궤적 직접 호출 없음')
 ok(count(se..us,'ClipFx(self.FxShardHit')==1 and count(se..us,'ClipFx(fx.FxShardHit')==0,'보라 파열 직접 호출은 ShardHit 빈 자리 되돌림 한 곳뿐')
 ok(count(se,'self:ShardHit(')==2 and count(us,'fx:ShardHit(')==0 and count(us,'fx:ConsumedDust(')==2,'골편 명중 1 + 뼛가루 빈 자리 되돌림 1 (10-31 9계열: 의식 2기·3기·거인 합체 뼛가루는 ConsumedDust)')
 ok(se:find('if _GameConst.FxSkillShardHit == "" then'..NL..'            self:ClipFx(self.FxShardHit, pos, clipScale, seconds, 0)',1,true)~=nil,'빈 명중 자리 → 예전 ClipFx 분기')
 ok(se:find('if _GameConst.FxSkillShardThrow ~= "" then return _GameConst.FxSkillShardThrow end'..NL..'        return self.FxShardShot',1,true)~=nil,'빈 투척 자리 → 예전 보라 궤적 분기')
 ok(se:find('or (shardArt and _Util:Frames(_GameConst.FxSkillStormShard)[1] or self.FxShardShot)',1,true)~=nil,'빈 폭풍 골편 자리 → 예전 보라 궤적 분기')
 ok(su:find('if _GameConst.FxSkillBoneArrow ~= "" then',1,true)~=nil and su:find('proj:Skin(_GameConst.SpriteArrow, 1.2)',1,true)~=nil,'빈 뼈 화살 자리 → 예전 몬스터 화살 SpriteArrow 1.2')
 ok(se:find('proj:Skin(self.FxShardShot, last and 1.38 or 1.1)',1,true)~=nil,'의식 3기 뼈 화살: 예전 그림은 FxSkillRiteArrow 빈 자리 되돌림으로 남음 (10-31 9계열 rite-bone-arrow 연결)')
 ok(ma:find('FxSkillBoneArrow',1,true)==nil,'몬스터 화살(교단 석궁병·사제·뱀장어)은 그대로')
 ok(se:find('_GameConst.FxSkillShardThrow, _GameConst.FxSkillStormShard, _GameConst.FxSkillBoneArrow, _GameConst.FxSkillShardHit',1,true)~=nil,'처음 쓸 때 늦지 않게 미리 불러 둠')
 ok(pj:find('/ self:FrameSec())',1,true)~=nil and pj:find('self:FaceMirror()',1,true)~=nil,'투사체 순환 간격·뒤집기 연결')
 ok(count(pj,'[VRF] shard frames start')==1,'[VRF] 순환 시작 한 줄')
 ok(pj:find('math.floor(self:FrameSec() * 1000 + 0.5), tostring(self.Dir.x < 0)',1,true)~=nil,'[VRF] 순환 시작 ms = 실제 장 간격(투척·화살 70 · 폭풍 100)')
 -- 11-01 통일 공정 골편 3종: 명중·뼛가루·뼈 명중은 장별 ms 개수 = 장 수일 때만 새 길 (서버 타이머 없음 · 클라이언트 PlayFramesMs)
 ok(count(se,'_Util:MsCount(_GameConst.FxSkillShardHitMs) == n')==2 and count(pj,'_Util:MsCount(_GameConst.FxSkillShardHitMs) == #_Util:Frames(art)')==1,'명중·뼛가루·뼈 명중 장별 ms 분기 3곳')
 ok(count(se,'_GameConst.FxSkillShardHitMs, 0, 0, self.ShardHitTint, self.ShardHitOrder)')==2 and count(pj,'_GameConst.FxSkillShardHitMs, 0, 0, color, 6)')==1,'장별 ms 길은 hold·fade 0 (잦아듦이 그림 알파에)')
 for _,m in ipairs({'ShardHitFrames','DustFrames'}) do
  local body=se:match('method [^\n]- '..m..'%(.-\n    end\n')
  ok(body~=nil and body:find('SetTimer',1,true)==nil and se:find('@ExecSpace%("Multicast"%)\n    method void '..m)~=nil,m..' 클라이언트 재생 · 타이머 없음 (서버는 Multicast 한 번)')
 end
end

-- ⑤ 10-31 스킬 그림 후속: 골편 4자리 × 4장 모두 미리 불러 둠 (창 골편은 부르는 곳이 없어 뺀다) · 층 값
do
 local saveV3=Vector3
 Vector3=setmetatable({zero={x=0,y=0,z=0}},{__call=function(_,x,y,z) return {x=x,y=y,z=z} end})   -- OnBeginPlay가 Vector3.zero를 쓴다
 local pre={}
 local saveE,saveT,saveU=_EffectService,_TimerService,_UserService
 _EffectService={PlayEffectAttached=function(_,ruid) table.insert(pre,ruid) return #pre end,RemoveEffect=function() end}
 _TimerService={SetTimerOnce=function() return 1 end}
 local me2={CurrentMap='m1'}
 _UserService={LocalPlayer=me2}
 logs={}
 local fx=setmetatable({Entity=me2,VisualTimers={}},{__index=SkillEffects})
 fx:OnBeginPlay()

 local got,dup={},0
 for _,r in ipairs(pre) do if got[r] then dup=dup+1 end got[r]=true end
 ok(#pre>0 and dup==0,'미리 불러 두기 RUID 중복 없음 ('..#pre..'장)')
 local function all(list,name) local n=0 for _,r in ipairs(list) do if got[r] then n=n+1 end end ok(#list>0 and n==#list,name..' 모든 장 미리 불러 둠 ('..n..'/'..#list..')') end
 local NF={FxSkillShardThrow=4,FxSkillStormShard=4,FxSkillBoneArrow=4,FxSkillShardHit=6,FxSkillRiteArrow=4,FxSkillConsumedDust=6,FxSkillHitBone=6}
 for _,k in ipairs({'FxSkillShardThrow','FxSkillStormShard','FxSkillBoneArrow','FxSkillShardHit','FxSkillRiteArrow','FxSkillConsumedDust','FxSkillHitBone'}) do local l=Util:Frames(_GameConst[k]) ok(#l==NF[k],k..' '..NF[k]..'장') all(l,k) end
 local spear=0 for _,r in ipairs(Util:Frames(_GameConst.FxSkillSpearShard)) do if got[r] then spear=spear+1 end end
 ok(spear==0,'창 골편은 미리 불러 두지 않음 (부르는 곳 없음)')

 local line=nil for _,l in ipairs(logs) do if l:find('[VRF] preload n=',1,true) then line=l end end
 ok(line~=nil and tonumber(line:match('n=(%d+)'))==#pre and tonumber(line:match('started=(%d+)'))==#pre,'[VRF] preload n = 실제 미리 부른 장 수 '..#pre..' (한 줄)')
 local src=io.open('RootDesk/MyDesk/Skill/SkillEffects.mlua'):read('a'):match('method void OnBeginPlay%(%)(.-)\n    end\n')
 ok(src~=nil and src:find(')[1]',1,true)==nil,'OnBeginPlay에 첫 장만 넣는 길(…)[1]) 없음')
 ok(SkillEffects.ShardHitOrder==6,'명중 파편 층 6 (몸 앞) 그대로')
 _EffectService,_TimerService,_UserService=saveE,saveT,saveU
 Vector3=saveV3
end

print(string.format('skillfx_shard: %d checks passed', checks))
