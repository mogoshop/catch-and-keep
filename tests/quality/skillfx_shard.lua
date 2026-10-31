-- 10-31 골편 계열 20장 (코덱스 assets/codex-skill-fx-v2/shard-full-20261031 · docs/evidence/2026-10-31-skillfx-shard20) — 실제 본문으로:
--   ① GameConst 골편 5자리 × 4장 · 32자리 hex · RUID 중복 0 · data/art_sprites.csv 20행(이름·kind effect·크기·RUID)과 일치 · 장 간격 ms 양수
--   ② Projectile.MirrorSkin·FrameSec·FaceMirror·AdvanceFrame: 골편 투사체 4계열만 100ms 순환 · 왼쪽으로 날면 FlipY(가로 거울) · 다른 프레임 그림 0.08초·FlipY 끔 (반례)
--   ③ SkillEffects.ShardSkinRuid/Scale·ShardHit·ShardHitFrames·StormOrbit: 채우면 새 그림 · 비우면 예전 FxShardShot/FxShardHit 그대로 (빈 자리 되돌림)
--   ④ 부르는 곳: 채운 자리마다 부르는 곳 · 창 골편은 쓸 자리 미정 · 골편 경로에 예전 보라 궤적/파열 직접 호출이 남지 않음 · 의식 화살은 rite-bone-arrow 대기
-- 엔진 효과·스프라이트는 대역 — 실제 화면(크기·색·뒤집힘)은 메이커 장면 확인
-- @source Util Common/Util.mlua Frames
-- @source Projectile Combat/Projectile.mlua MirrorSkin,FrameSec,FaceMirror,SkinFrame,AdvanceFrame
-- @source SkillEffects Skill/SkillEffects.mlua ShardSkinRuid,ShardSkinScale,ShardHit,ShardHitFrames,StormOrbit
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

-- ① 골편 5자리 × 4장 · art_sprites 20행
local SLOTS={
 {'FxSkillShardThrow','fx-B-shard-throw-sample-',128,64},
 {'FxSkillSpearShard','fx-B-spear-shard-sample-',128,64},
 {'FxSkillStormShard','fx-B-storm-shard-sample-',128,64},
 {'FxSkillBoneArrow','fx-B-bone-arrow-neutral-sample-',128,64},
 {'FxSkillShardHit','fx-B-shard-hit-sample-',96,96}}
do
 local seen,total={},0
 for _,s in ipairs(SLOTS) do
  local key,prefix,w,h=s[1],s[2],s[3],s[4]
  ok(_GameConst[key]~=nil and _GameConst[key]~='',key..' 채움')
  local list=Util:Frames(_GameConst[key])
  ok(#list==4,key..' 4장 ('..#list..')')
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
 ok(total==20,'골편 계열 20장')
 local rows=0
 for name,_ in pairs(art) do
  for _,s in ipairs(SLOTS) do if name:sub(1,#s[2])==s[2] then rows=rows+1 end end
 end
 ok(rows==20,'art_sprites 골편 행 20개 ('..rows..')')
 ok(type(_GameConst.FxSkillShardFrameMs)=='number' and _GameConst.FxSkillShardFrameMs>0,'골편 장 간격 ms 양수')
 ok(_GameConst.FxSkillShardFrameMs==100,'코덱스 제안 100ms')
end

-- ② Projectile: 골편 투사체 4계열 순환·뒤집기
local function proj(skin,dx,dy)
 local sprite={FlipY=false,SpriteRUID='',Enable=true}
 local p=setmetatable({SkinRuid=skin,ViewDir={x=dx,y=dy or 0},ViewT0=0,ViewFrame=0,ViewHidden=false,Entity={SpriteRendererComponent=sprite}},{__index=Projectile})
 return p,sprite
end
do
 for _,k in ipairs({'FxSkillShardThrow','FxSkillSpearShard','FxSkillStormShard','FxSkillBoneArrow'}) do
  local p,s=proj(_GameConst[k],-1)
  ok(p:MirrorSkin(),k..' 골편 투사체 그림')
  ok(near(p:FrameSec(),0.1),k..' 장 간격 0.1초')
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
 -- 순환: 장 = floor(t / 0.1) % 4 + 1 (경계 밖 시각만)
 local s,ss=proj(_GameConst.FxSkillShardThrow,1)
 local list=Util:Frames(_GameConst.FxSkillShardThrow)
 ss.SpriteRUID=s:SkinFrame()
 ok(ss.SpriteRUID==list[1],'첫 장')
 for _,tm in ipairs({0.05,0.15,0.25,0.35,0.45,0.55,0.75}) do
  _UtilLogic.ElapsedSeconds=tm
  s:AdvanceFrame()
  ok(ss.SpriteRUID==list[math.floor(tm/0.1)%4+1],'t='..tm..' 장 '..(math.floor(tm/0.1)%4+1))
 end
 ok(math.floor(0.45/0.08)%4+1~=math.floor(0.45/0.1)%4+1,'반례 확인: 예전 0.08초였다면 0.45초에 다른 장')
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
 local me={CurrentMap='m1'}
 _UserService={LocalPlayer=me}
 local fx=setmetatable({Entity=me},{__index=SkillEffects})
 logs={}
 fx:ShardHitFrames(Vector3(3,4,0),0.5)
 local p=played[1]
 ok(p~=nil and p.ruids==_GameConst.FxSkillShardHit,'명중 4장을 한 번')
 ok(near(p.frameSec,0.1) and near(p.scale.x,SkillEffects.ShardHitScale) and p.scale.x==p.scale.y,'장마다 0.1초 · 옛 0.5 = ShardHitScale')
 ok(p.order==SkillEffects.ShardHitOrder and p.tint==SkillEffects.ShardHitTint and p.pos.x==3 and p.pos.y==4,'층·뼈 흰빛·자리')
 ok(#logs==1 and logs[1]:find('[VRF] shard hit frames n=4 ms=100',1,true)~=nil,'[VRF] 명중 재생 한 줄')
 fx:ShardHitFrames(Vector3(0,0,0),0.45)
 ok(near(played[2].scale.x,SkillEffects.ShardHitScale*0.9),'옛 0.45 호출(의식 화살 뼛가루)은 비례 0.9배')
 local other=setmetatable({Entity={CurrentMap='m2'}},{__index=SkillEffects})
 other:ShardHitFrames(Vector3(0,0,0),0.5)
 ok(#played==2,'다른 맵 클라이언트는 그리지 않는다')
 _GameConst.FxSkillShardHit=''
 fx:ShardHitFrames(Vector3(0,0,0),0.5)
 ok(#played==2,'빈 자리면 그리지 않는다')
 restore()
 -- 크기 환산 (audit P02·P03 옛 그림)
 ok(near(96*SkillEffects.ShardHitScale/100,1.14,0.05),'명중 캔버스 '..(96*SkillEffects.ShardHitScale/100)..'칸 ≈ 옛 보라 파열 1.14칸')
 ok(near(113*SkillEffects.ShardThrowScale/100,0.78,0.08),'골편 보이는 몸 ≈ 옛 보라 궤적 0.78칸')
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
end

print(string.format('skillfx_shard: %d checks passed', checks))
