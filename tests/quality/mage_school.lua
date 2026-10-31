-- 48-2 해골 마법사 속성 5 · 캐릭터 투사체 재사용 (기획서 48 §2 · 리뷰 결정 Q8·Q9·Q10): 실제 본문 MageBolts · ShadowUnit(HitBolt·ShootBolt·OnAttack) · MonsterStatus.TakenMult로
--   ① 속성 분포(저주 노드 없으면 4종 각 25% · 저주 0 / 있으면 5종 각 20%) · 번개·독 없음 ② 랭크 1·6·11·16·20 특성 = §2-3 표
--   ③ 캐릭터 투사체 외형·속도 불변(예전 SkillEffects 값 그대로 · 그림 RUID 같음 · 캐릭터 4함수+파편이 Configure를 부름) ④ 마법사 세기는 마법사 것(관통·가시 5·파편·폭발·한 발 배율)
--   ⑤ 불꽃 폭발 늘 ×0.3 ⑥ 낙인 큰 값만(20 + 12 → 1.20, 곱 1.344 아님) ⑦ 저주 마법사 낙인 % · 서리 둔화 · 거인은 화염 구슬(속성 특성 없음) ⑧ 격류 n발 부채꼴 60°
-- @source MageBolts Undead/MageBolts.mlua Schools,PickSchool,ElementOf,SchoolOfElement,BodyTint,TierOf,Trait,ShotMul,Count,Pierces,Configure,MageTraits,C7Log
-- @source ShadowUnit Shadow/ShadowUnit.mlua HitOne,HitBolt,ShootBolt,BoltSchool,MageRankNow,OnAttack
-- @source MonsterStatus Monster/MonsterStatus.mlua TakenMult,ApplyHex
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b) return math.abs(a-b)<1e-6 end
function isvalid(x) return x~=nil and x~=false end
Environment={IsPublishedPlay=function() return false end}
_UtilLogic={ElapsedSeconds=0,RandomIntegerRange=function(_,a,b) return math.random(a,b) end,RandomDouble=function() return 0.99 end}
_GameConst={FxSkillSpear="",FxSkillTorrent="",FxSkillFlameShot="",FxSkillFrostShot="",FxAriseSoul="07e92bf63fa44ba5a74507f96cb4e18c",SpriteMageBolt="c78bbf04d1ab48a885884813eb59fce3",FxSkillHexBurst=""}
local V={} V.__index=V
V.__add=function(a,b) return setmetatable({x=a.x+b.x,y=a.y+b.y},V) end
V.__sub=function(a,b) return setmetatable({x=a.x-b.x,y=a.y-b.y},V) end
function V:Magnitude() return math.sqrt(self.x*self.x+self.y*self.y) end
function Vector2(x,y) return setmetatable({x=x,y=y},V) end
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function CircleShape(c,r) return {c=c,r=r} end
_MageBolts=MageBolts
math.randomseed(48)
-- config.csv 마법사 키(갈래 C · mageTier2Lv …)가 있으면 그 값을 읽는다 — 여기서는 C 판 값(= MageBolts 기본값)을 그대로 넣어 같은 표가 나오는지 본다
_GameData={mageTier2Lv=6,mageTier3Lv=11,mageTier4Lv=16,magePierceBase=2,mageShardsBase=1,mageBurstBase=0.8,mageBurstStep=0.2,mageTorrentBase=2,mageCursePct=8,mageCursePerRank=0.6}

-- ① 분포
do
 for _,curse in ipairs({false,true}) do
  local n,cnt=20000,{}
  for _=1,n do local k=MageBolts:PickSchool(curse) cnt[k]=(cnt[k] or 0)+1 end
  local kinds=curse and 5 or 4
  local seen=0
  for k,c in pairs(cnt) do seen=seen+1 ok(math.abs(c/n-1/kinds)<0.02,'속성 '..k..' 비율 '..c/n) end
  ok(seen==kinds,'속성 가짓수 '..seen)
  ok(cnt.light==nil and cnt.poison==nil,'번개·독 마법사 없음')
  if not curse then ok(cnt.curse==nil,'저주 노드 없으면 저주 0%') end
 end
 ok(MageBolts:ElementOf('fire')=='fire' and MageBolts:ElementOf('cold')=='cold' and MageBolts:ElementOf('bone')=='magic' and MageBolts:ElementOf('soul')=='magic' and MageBolts:ElementOf('curse')=='magic','피해 속성')
 ok(MageBolts:SchoolOfElement('light')=='soul' and MageBolts:SchoolOfElement('poison')=='bone' and MageBolts:SchoolOfElement('fire')=='fire','옛 기록 읽기')
end
-- ② §2-3 표 (랭크 → 관통 · 파편 · 폭발 반경 · 격류 · 낙인 %)
do
 local T={[1]={2,1,0.8,2,8},[5]={2,1,0.8,2,10.4},[6]={3,2,1.0,3,11},[11]={4,3,1.2,4,14},[15]={4,3,1.2,4,16.4},[16]={5,4,1.4,5,17},[20]={5,4,1.4,5,19.4}}
 for rank,row in pairs(T) do
  ok(MageBolts:Trait('bone',rank)==row[1],'관통 랭크 '..rank)
  ok(MageBolts:Trait('cold',rank)==row[2],'파편 랭크 '..rank)
  ok(near(MageBolts:Trait('fire',rank),row[3]),'폭발 반경 랭크 '..rank)
  ok(MageBolts:Trait('soul',rank)==row[4] and MageBolts:Count('soul',rank)==row[4],'격류 랭크 '..rank)
  ok(near(MageBolts:Trait('curse',rank),row[5]),'낙인 랭크 '..rank..' '..MageBolts:Trait('curse',rank))
 end
 ok(MageBolts:Count('fire',20)==1 and MageBolts:Count('bone',20)==1,'격류 말고는 1발')
end

-- ③ 캐릭터 외형·속도 불변 (예전 SkillEffects 본문 값 그대로)
local function fakeProj()
 local p={MaxHits=0,SpikePct=0,Splits=0,BurstRadius=0,MinionMul=1,Homing=0,Style=''}
 function p:Skin(r,sc) self.ruid=r self.sx=sc self.sy=sc end
 function p:SkinXY(r,x,y) self.ruid=r self.sx=x self.sy=y end
 function p:Tint(c) self.tint=c end
 return p
end
local function tint(p,r,g,b) return p.tint~=nil and near(p.tint[1],r) and near(p.tint[2],g) and near(p.tint[3],b) end
do
 local p=fakeProj() local sp=MageBolts:Configure(p,'bone')
 ok(sp==14 and p.ruid=='423983c3b393414c8a8d91578b1fab9c' and p.sx==1.32 and p.sy==0.6 and tint(p,0.95,0.9,0.78) and p.Style=='spear','뼈 창 외형·속도 (그림 없을 때)')
 _GameConst.FxSkillSpear='spearRUID'
 p=fakeProj() MageBolts:Configure(p,'bone')
 ok(p.ruid=='spearRUID' and p.sx==0.9 and p.sy==0.9 and p.tint==nil,'뼈 창 코덱스 그림이 오면 제 비율')
 _GameConst.FxSkillSpear=''
 p=fakeProj() sp=MageBolts:Configure(p,'fire')
 ok(sp==11 and p.ruid=='40f0991c2e204ee888670cb3006382e5' and p.sx==0.45 and tint(p,1,0.75,0.55) and p.Style=='','저주 불꽃 외형·속도')
 p=fakeProj() sp=MageBolts:Configure(p,'cold')
 ok(sp==9 and p.ruid=='d5a9e48c2d654726811db8b127699233' and p.sx==0.6 and tint(p,0.85,0.95,1),'서리 혼 외형·속도')
 p=fakeProj() sp=MageBolts:Configure(p,'cold_shard')
 ok(sp==10 and p.sx==0.4 and tint(p,0.85,0.95,1),'서리 파편 외형·속도')
 p=fakeProj() sp=MageBolts:Configure(p,'soul')
 ok(sp==7 and p.Homing==5 and p.ruid=='07e92bf63fa44ba5a74507f96cb4e18c' and p.sx==0.42 and tint(p,0.55,0.95,1) and p.Style=='torrent','영혼 격류 외형·속도')
 p=fakeProj() sp=MageBolts:Configure(p,'curse')
 ok(sp==7 and p.ruid=='c78bbf04d1ab48a885884813eb59fce3' and p.MaxHits==0 and p.MinionMul==1,'저주: 마력탄 · Configure는 세기를 건드리지 않음')
 for _,k in ipairs({'bone','fire','cold','soul'}) do p=fakeProj() MageBolts:Configure(p,k) ok(p.MaxHits==0 and p.SpikePct==0 and p.Splits==0 and p.BurstRadius==0,'Configure는 외형만: '..k) end
end

-- 정적: 캐릭터 함수가 공용 Configure를 부르고, 그림 RUID가 SkillEffects와 같다
do
 local fh=io.open('RootDesk/MyDesk/Skill/SkillEffects.mlua')
 local se=fh:read('a') fh:close()
 for _,pair in ipairs({{'BoneSpear','bone'},{'HexFlame','fire'},{'FrostSoul','cold'},{'FrostSplit','cold_shard'},{'SoulTorrent','soul'}}) do
  local body=se:match('method %w+ '..pair[1]..'%(.-\n    end\n')
  ok(body~=nil and body:find('_MageBolts:Configure(proj, "'..pair[2]..'")',1,true)~=nil,'캐릭터 '..pair[1]..' → Configure '..pair[2])
  ok(body:find('proj:Skin(',1,true)==nil and body:find('proj:SkinXY(',1,true)==nil,'캐릭터 '..pair[1]..'에 따로 그린 그림 없음')
 end
 for _,k in ipairs({'FxFlameShot','FxFrostShot','FxShardShot'}) do
  local v=se:match('property string '..k..' = "(%w+)"')
  ok(v==MageBolts[k],'그림 RUID 같음 '..k)
 end
 ok(se:find('proj.SpikePct = 10',1,true)~=nil and se:find('proj.MaxHits = self:PierceCap("bone_spear")',1,true)~=nil,'캐릭터 뼈 창 세기(가시 10 · 관통 상한) 그대로')
end
-- ④ 마법사 세기
do
 local p=fakeProj() MageBolts:MageTraits(p,'bone',11)
 ok(p.MaxHits==4 and p.SpikePct==5 and p.MinionMul==1 and MageBolts:Pierces('bone'),'뼈 창 마법사 랭크 11: 관통 4 · 가시 5%')
 p=fakeProj() MageBolts:MageTraits(p,'cold',16)
 ok(p.MaxHits==1 and p.Splits==4 and near(p.MinionMul,0.9),'서리 마법사 랭크 16: 파편 4')
 p=fakeProj() MageBolts:MageTraits(p,'fire',6)
 ok(near(p.BurstRadius,1.0) and p.MinionMul==1 and not MageBolts:Pierces('fire'),'불꽃 마법사 랭크 6: 폭발 1.0')
 p=fakeProj() MageBolts:MageTraits(p,'soul',1)
 ok(near(p.MinionMul,0.4) and p.BurstRadius==0,'격류 발당 0.4')
 p=fakeProj() MageBolts:MageTraits(p,'curse',1)
 ok(near(p.MinionMul,0.6),'저주 0.6')
end

-- ShadowUnit 대역
local hits
local function unit(school,rank)
 local u=setmetatable({},{__index=ShadowUnit})
 u.Kind='mage' u.Giant=false u.MageSchool=school u.MageRank=rank u.Element='' u.ShotMul=1 u.BoltMult=1 u.BlastMult=0 u.HexPct=0 u.ShotCount=0 u.LastInfo=''
 u.Entity={Name='mage1'} u.OwnerPlayer={GetComponent=function() return nil end}
 function u:IsLiveTarget(e) return e~=nil end
 function u:IsServer() return true end
 function u:GetArch() return '' end
 function u:AttackFast(shape,info) table.insert(hits,{info=info,mul=self.ShotMul,r=shape.r}) end
 function u:MageBurstFx() end
 function u:BlastPopFx() end
 function u:BoltColor() return {1,1,1,1} end
 return u
end
_Util={Pos2=function(_,e) return e.pos or Vector2(0,0) end}
-- ⑤ 불꽃 폭발 늘 ×0.3 (저주 안 걸린 적에게도)
do
 hits={}
 local u=unit('fire',6)
 u:HitBolt({pos=Vector2(1,0)},1,1.0)
 ok(#hits==2 and hits[1].info=='shadow.ranged' and hits[1].mul==1,'한 발 ×1')
 ok(hits[2].info=='shadow.mageburst' and near(hits[2].mul,0.3) and near(hits[2].r,1.0),'폭발 = 한 발 × 0.3 · 반경 1.0')
 ok(u.ShotMul==1,'적중 뒤 배율 되돌림')
 hits={}
 u:HitBolt({pos=Vector2(1,0)},0.9,0)
 ok(#hits==1 and near(hits[1].mul,0.9),'폭발 없는 속성은 한 번')
 hits={}
 u.Giant=true u.BlastMult=0.3 u.BlastRadius=1.0
 u:HitBolt({pos=Vector2(1,0)},1,1.4)
 ok(#hits==2 and hits[2].info=='shadow.blast','마법사 거인 = 거인 자리 폭발(rite_giants) · 마법사 폭발 특성 아님')
end
-- ⑥ 낙인 큰 값만
do
 local st=setmetatable({AmpPct=20,AmpUntil=99,HexPct=0,HexUntil=0},{__index=MonsterStatus})
 function st:AuraMult() return 1 end
 st:ApplyHex(12,4)
 ok(near(st:TakenMult(),1.2),'낙인 20 + 저주 12 → 1.20배 (곱 1.344 아님) '..st:TakenMult())
 st.AmpUntil=0
 ok(near(st:TakenMult(),1.12),'낙인 없으면 저주 12만')
 st:ApplyHex(8,4)
 ok(st.HexPct==12,'저주끼리는 센 값 유지')
end

-- ⑦ 저주 낙인 · 서리 둔화 (OnAttack)
do
 local applied,chill={},0
 local mon={IsDead=false}
 function mon:Status() return {ApplyHex=function(_,p,s) table.insert(applied,{p=p,s=s}) end} end
 function mon:ApplyChill(s) chill=s end
 local def={GetComponent=function(_,k) if k=='script.Monster' then return mon end end}
 local u=unit('curse',11)
 u.LastInfo='shadow.ranged' u:OnAttack(def)
 ok(#applied==1 and near(applied[1].p,14) and applied[1].s==4 and chill==0,'저주 마법사 랭크 11 낙인 14% 4초')
 applied={} u=unit('cold',1) u.LastInfo='shadow.ranged' u:OnAttack(def)
 ok(#applied==0 and chill==1.5,'서리 마법사 둔화 1.5초 · 낙인 없음')
 applied={} chill=0 u=unit('fire',1) u.LastInfo='shadow.ranged' u:OnAttack(def)
 ok(#applied==0 and chill==0,'불꽃 마법사는 낙인·둔화 없음')
 applied={} u=unit('curse',1) u.Giant=true u.LastInfo='shadow.ranged' u:OnAttack(def)
 ok(#applied==0,'거인은 속성 부가 효과 없음')
 local g=unit('curse',1) g.Giant=true
 ok(unit('curse',1):BoltSchool()=='curse' and g:BoltSchool()=='fire','거인 구슬 = 화염')
 local old=unit('',3) old.Element='light'
 ok(old:BoltSchool()=='soul','옛 번개 기록은 영혼으로')
end
-- ⑧ 격류 n발 부채꼴 60°
do
 local u=unit('soul',16)
 local dirs={}
 u.ShootOneBolt=function(self,d) table.insert(dirs,math.deg(math.atan(d.y,d.x))) end
 u.Entity.pos=Vector2(0,0)
 u:ShootBolt(Vector2(3,0))
 ok(#dirs==5 and near(dirs[1],-30) and near(dirs[5],30),'격류 랭크 16 = 5발 · ±30°')
 dirs={} u.MageSchool='bone' u:ShootBolt(Vector2(3,0))
 ok(#dirs==1 and near(dirs[1],0),'뼈 창 1발')
 dirs={} u.MageSchool='soul' u.Giant=true u:ShootBolt(Vector2(3,0))
 ok(#dirs==1,'거인은 한 발')
end
print(string.format('mage_school: %d checks passed', checks))
