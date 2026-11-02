-- 11-02 기획 61 황무지 파일럿 (메이커 내장 기능 · 그림 0 · docs/evidence/2026-11-02-wasteland-native-pilot) — 실제 DarkVision 본문으로:
--   ① ParseTint: "#A9C6FF" → (169,198,255)/255 · 틀린 형식은 nil
--   ② 틴트 섞기 식(기획 51 안 B): 액트 1 기본 (0.55,0.6,0.85) × 0.84 + 틴트 × 0.16 — EnterMap 본문에 식·우선순위 순서(액트 4 → 틴트 → 각성 → 심도) 그대로인지 소스 검사
--   ③ StartWeather: wind = 바람선 1개만(옛 FogLively가 같이 깔리지 않음) · rain = 비 + 안개 2 · mist = 안개 1 · "" = 0
--   ④ StartFog: "FogCalm/0.5/17.5/31/11/0.3" → 영역 입자 1개(종류·가운데·크기·알파) · 여러 개 · 빈 값 0
--   ⑤ AttachFlicker·FlickerStep: 컴포넌트 값을 TorchLight로 맞춤 · 같은 화로 두 번 붙지 않음 · FlameRange 안만 불꽃 1개·세기 base×(1−amp)~base · 0.12~0.3초 간격 · 멀어지면 불꽃 떼고 세기 원래대로 · 사라진 화로 정리
--   ⑥ TuneAmbSound: 원래 음량 × 설정 환경음 음량 (끄면 0 · 다시 켜면 원래)
--   ⑦ 소스 검사: 깜빡임 반복 타이머는 OnBeginPlay 한 번 ↔ OnEndPlay 정리 짝(LEA-3051) · ClearAll이 불꽃 입자 정리 · 서비스 빛 대신(Flicker>0 + OverlayLightComponent)
-- @source DarkVision Ambience/DarkVision.mlua ParseTint,StartWeather,StartFog,AttachFlicker,FlickerStep,TuneAmbSound
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local function read(path) local f=assert(io.open(path,'r')) local s=f:read('a') f:close() return s end
function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function Vector2(x,y) local v={x=x,y=y} setmetatable(v,{__sub=function(p,q) return Vector2(p.x-q.x,p.y-q.y) end}) v.Magnitude=function(s) return math.sqrt(s.x*s.x+s.y*s.y) end return v end
function isvalid(x) return x~=nil and x~=false and not (type(x)=='table' and x.dead) end
Environment={IsPublishedPlay=function() return false end}
local logs={}
function log(s) table.insert(logs,s) end
AreaParticleType={Rain='Rain',FogCalm='FogCalm',FogHeavy='FogHeavy',FogLively='FogLively',Windlines='Windlines'}
BasicParticleType={ToonFireTorch='ToonFireTorch'}
local parts,serial={},0
_ParticleService={
 PlayAreaParticle=function(_,kind,size,map,at,rot,sc,loop,opt) serial=serial+1 parts[serial]={kind=kind,size=size,at=at,opt=opt} return serial end,
 PlayBasicParticleAttached=function(_,kind,e,at,rot,sc,loop,opt) serial=serial+1 parts[serial]={kind=kind,e=e,at=at,sc=sc,opt=opt} return serial end,
 RemoveParticle=function(_,id) parts[id]=nil end,
}
local function nparts() local n=0 for _ in pairs(parts) do n=n+1 end return n end
_GameConst={BaseMapName=function(_,n) return n end}
_GameData={GetMapInfo=function(_,n) return {w=70,h=50} end}

-- ① ParseTint
local t=DarkVision:ParseTint('#A9C6FF')
ok(t~=nil and near(t.r,169/255) and near(t.g,198/255) and near(t.b,1),'#A9C6FF → 169/198/255')
ok(DarkVision:ParseTint('')==nil and DarkVision:ParseTint('#12345')==nil and DarkVision:ParseTint('#GG0000')==nil,'틀린 형식 nil')

-- ② 섞기 식 (소스 검사 + 값)
local src=read('RootDesk/MyDesk/Ambience/DarkVision.mlua')
local enter=src:match('method void EnterMap%(.-\n    end\n')
ok(enter and enter:find('color.r %* %(1 %- sg%) %+ tint.r %* sg',1,false),'전체 조명 색 = 기존색 × (1 − sG) + 틴트 × sG')
local iAct4,iTint,iAwake,iDepth=enter:find('ActOfMap%(map.Name%) == 4 then color'),enter:find('self:ParseTint%(amb.Tint%)'),enter:find('if self:AwakeHere%(map%) then color'),enter:find('color = Color%(0.62, 0.48, 0.9, 1%)')
ok(iAct4 and iTint and iAwake and iDepth and iAct4<iTint and iTint<iAwake and iAwake<iDepth,'우선순위: 액트4 기본 → 틴트 → 각성 → 심도 (뒤가 덮는다)')
local sg=0.16
local mixed={0.55*(1-sg)+t.r*sg,0.6*(1-sg)+t.g*sg,0.85*(1-sg)+t.b*sg}
ok(near(mixed[1],0.5686,1e-3) and near(mixed[2],0.6282,1e-3) and near(mixed[3],0.874,1e-3),'황무지 밤빛 (0.569,0.628,0.874)')

-- ③ StartWeather
DarkVision.WeatherSerials={}
local map={Name='wasteland'}
DarkVision:StartWeather(map,'wind')
ok(#DarkVision.WeatherSerials==1 and parts[DarkVision.WeatherSerials[1]].kind=='Windlines','wind = 바람선 1개만')
ok(near(parts[DarkVision.WeatherSerials[1]].opt.Color.a,0.3) and parts[DarkVision.WeatherSerials[1]].opt.ParticleCount==2,'바람선 알파 0.3 · 개수 2')
DarkVision.WeatherSerials={} DarkVision:StartWeather(map,'rain')
ok(#DarkVision.WeatherSerials==2 and parts[DarkVision.WeatherSerials[1]].kind=='Rain' and parts[DarkVision.WeatherSerials[2]].kind=='FogLively','rain = 비 + 안개 (예전과 같음)')
DarkVision.WeatherSerials={} DarkVision:StartWeather(map,'mist')
ok(#DarkVision.WeatherSerials==1 and parts[DarkVision.WeatherSerials[1]].kind=='FogLively','mist = 안개 1 (예전과 같음)')
DarkVision.WeatherSerials={} DarkVision:StartWeather(map,'')
ok(#DarkVision.WeatherSerials==0,'빈 날씨 = 0')

-- ④ StartFog
DarkVision.WeatherSerials={}
DarkVision:StartFog(map,'FogCalm/0.5/17.5/31/11/0.3')
local f1=parts[DarkVision.WeatherSerials[1]]
ok(#DarkVision.WeatherSerials==1 and f1.kind=='FogCalm' and near(f1.at.x,0.5) and near(f1.at.y,17.5) and near(f1.size.x,31) and near(f1.size.y,11) and near(f1.opt.Color.a,0.3),'구역 안개 1개 = 종류·가운데·크기·알파')
DarkVision.WeatherSerials={} DarkVision:StartFog(map,'FogHeavy/1/2/3/4/0.5;FogCalm/0/0/5/5/0.2;bad')
ok(#DarkVision.WeatherSerials==2 and parts[DarkVision.WeatherSerials[1]].kind=='FogHeavy','여러 개 · 틀린 조각은 건너뜀')
DarkVision.WeatherSerials={} DarkVision:StartFog(map,'')
ok(#DarkVision.WeatherSerials==0,'빈 값 = 0')

-- ⑤ 깜빡임·불꽃
local now=100
_UtilLogic={ElapsedSeconds=0}
local seq={0.0,1.0,0.5,0.25}
local si=0
function _UtilLogic:RandomDouble() si=si%#seq+1 return seq[si] end
local function ent(id,x,y) return {Id=id,Name=id,pos={x=x,y=y}} end
_Util={Pos2=function(_,e) return Vector2(e.pos.x,e.pos.y) end}
local player=ent('me',0,0)
local curMap={}
player.CurrentMap=curMap
_UserService={LocalPlayer=player}
DarkVision.CurrentMap=curMap
DarkVision.Flickers={} DarkVision.FlickerCount=0
local torch={LightColor=Color(1,0.55,0.25,1),Intensity=0.9,Radius=2.2,Flicker=0.15}
local eNear,eFar=ent('Torch1',3,0),ent('Torch2',20,0)
local lNear,lFar={Intensity=1,InnerRadius=0,OuterRadius=1},{Intensity=1,InnerRadius=0,OuterRadius=1}
DarkVision:AttachFlicker(eNear,torch,lNear)
DarkVision:AttachFlicker(eNear,torch,lNear)
DarkVision:AttachFlicker(eFar,torch,lFar)
ok(DarkVision.FlickerCount==2,'같은 화로 두 번 붙지 않음 (n=2)')
ok(near(lNear.Intensity,0.9) and near(lNear.InnerRadius,0.66) and near(lNear.OuterRadius,2.2) and lNear.Color.g==0.55,'컴포넌트 = TorchLight 값 (세기 0.9 · 반경 0.66~2.2 · 색)')
_UtilLogic.ElapsedSeconds=now
DarkVision:FlickerStep()
local fN,fF=DarkVision.Flickers['Torch1'],DarkVision.Flickers['Torch2']
ok(fN.flame~=0 and parts[fN.flame].kind=='ToonFireTorch' and parts[fN.flame].e==eNear,'가까운 화로에 불꽃 입자')
ok(fF.flame==0 and near(lFar.Intensity,0.9),'먼 화로(20칸)는 불꽃 없음 · 세기 그대로')
local lo,hi,steps=1,0,0
for k=1,80 do
 _UtilLogic.ElapsedSeconds=now+k*0.06
 local before=fN.next
 DarkVision:FlickerStep()
 if fN.next~=before then steps=steps+1 local gap=fN.next-_UtilLogic.ElapsedSeconds ok(gap>=0.12-1e-9 and gap<=0.3+1e-9,'간격 0.12~0.3초') end
 lo=math.min(lo,lNear.Intensity) hi=math.max(hi,lNear.Intensity)
end
ok(lo>=0.9*(1-0.15)-1e-9 and hi<=0.9+1e-9 and hi-lo>0.05,'세기 0.765~0.9 사이에서 흔들림')
ok(steps>=12 and steps<=41,'4.8초에 바뀜 16~40번 (간격 난수)')
local flameBefore=fN.flame
for k=1,5 do DarkVision:FlickerStep() end
ok(fN.flame==flameBefore,'불꽃은 한 번만 붙인다')
player.pos={x=40,y=0}
DarkVision:FlickerStep()
ok(fN.flame==0 and parts[flameBefore]==nil and near(lNear.Intensity,0.9),'멀어지면 불꽃 떼고 세기 원래대로')
eFar.dead=true
DarkVision:FlickerStep()
ok(DarkVision.Flickers['Torch2']==nil and DarkVision.FlickerCount==1,'사라진 화로 정리')
player.CurrentMap={}
local cnt=nparts() DarkVision:FlickerStep()
ok(nparts()==cnt,'맵을 옮긴 사이에는 판정 멈춤')

-- ⑥ 환경음 음량
_SoundDirector={AmbienceVolume=1}
local sc={Volume=0.5,HearingDistance=4,IsPlaying=function() return true end}
local eS={Id='TorchS',Name='Torch1',SoundComponent=sc}
DarkVision.AmbSounds={}
DarkVision:TuneAmbSound(eS) ok(near(sc.Volume,0.5),'환경음 100% = 원래 0.5')
_SoundDirector.AmbienceVolume=0 DarkVision:TuneAmbSound(eS) ok(near(sc.Volume,0),'환경음 끔 = 0')
_SoundDirector.AmbienceVolume=0.6 DarkVision:TuneAmbSound(eS) ok(near(sc.Volume,0.3),'60% = 0.3 (원래 값 기준 · 곱이 겹치지 않음)')

-- ⑦ 소스 검사
local begin=src:match('method void OnBeginPlay%(%).-\n    end\n')
local endp=src:match('method void OnEndPlay%(%).-\n    end\n')
local clear=src:match('method void ClearAll%(%).-\n    end\n')
ok(select(2,begin:gsub('self.FlickerTimerId = _TimerService:SetTimerRepeat',''))==1,'깜빡임 반복 타이머 OnBeginPlay 한 번')
ok(endp:find('ClearTimer%(self.FlickerTimerId%)'),'OnEndPlay에서 정리 (LEA-3051 짝)')
ok(clear:find('RemoveParticle%(f.flame%)') and clear:find('self.Flickers = {}'),'ClearAll이 불꽃 정리')
local tick=src:match('method void Tick%(%).-\n    end\n')
ok(tick:find('t.Flicker > 0 and light ~= nil then self:AttachFlicker') and tick:find('else self:Attach%(c.Entity, t.LightColor'),'Flicker>0 + 컴포넌트면 서비스 빛 대신 · 아니면 예전 그대로')
for _,m in ipairs({'AttachFlicker','FlickerStep','TuneAmbSound','StartFog'}) do
 ok(src:find('@ExecSpace%("ClientOnly"%)\n    method void '..m..'%('),m..' ClientOnly')
end
local lib=read('tools/build/handmade/lib.cjs')
ok(lib:find('NATIVE_PILOT%[d.id%]'),'생성기: 파일럿 표에 있는 맵만')
print(('native_pilot ok — %d checks'):format(checks))
