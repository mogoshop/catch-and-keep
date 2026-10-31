-- 10-31 맵 v5 윗부분 반투명 (방안 B · docs/evidence/2026-10-31-map-v5-toppart/TOP-FADE.md) — 실제 DarkVision 본문으로:
--   ① GameConst TopFade* 상수(켬 스위치·0.35·0.15초·0.1초·6칸·30개) 존재와 값
--   ② TopRect·TopCovers: 뒤(발 y > 그림 발 · < 윗면 · 보이는 폭 안)만 가림 · 앞·옆·위·경계는 아님 · FlipX 좌우 거울 · 6칸 밖 생략
--   ③ ShadeWalls → BuildTopFade → TopFadeTick: Art…Top만 대상 · RUID마다 크기 한 번 · 뒤에 서면 두 틱(0.2초) 만에 0.35 · 벗어나면 원래 색 · 여럿 동시 · 앞은 그대로
--      [VRF] top fade n= 는 바뀔 때만 · 게시 플레이에서는 안 찍음 · 맵이 바뀌면 판정 멈춤 → RestoreTopFade 원래 색 · 상한 30 · 크기 못 읽으면 뺌 · 스위치 끄면 0
--   ④ 소스 검사: 반복 타이머는 OnBeginPlay 한 번·OnEndPlay 정리 짝 · 맵 진입/판정 본문에 새 타이머 없음 · 서버 ExecSpace·서버 타이머 없음 · 다른 플레이어 안 봄 · Top 이름 규칙(생성기 <원본>Top ↔ DarkVision 접두 Art·접미 Top)
-- 엔진 렌더러·스프라이트는 대역 — 실제 화면(비침 정도·이름표·보간 느낌)은 메이커 장면 확인
-- @source DarkVision Ambience/DarkVision.mlua ShadeWalls,BuildTopFade,TopSpriteInfo,TopRect,TopCovers,TopFadeStep,TopFadeTick,RestoreTopFade
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
local function read(path) local f=assert(io.open(path,'r')) local s=f:read('a') f:close() return s end
local BT,DL=string.char(96),string.char(36)
function Vector3(x,y,z) return {x=x,y=y,z=z} end
function isvalid(x) return x~=nil and x~=false end
local published=false
Environment={IsPublishedPlay=function() return published end}
local logs={}
function log(s) table.insert(logs,s) end
local function countLog(prefix) local n=0 for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then n=n+1 end end return n end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end

-- ① 실제 GameConst 값
_GameConst={}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local kn,vn=line:match('^%s*property number (%w+) = (%-?[%d%.]+)')
 if kn then _GameConst[kn]=tonumber(vn) end
 local ki,vi=line:match('^%s*property integer (%w+) = (%-?%d+)')
 if ki then _GameConst[ki]=tonumber(vi) end
 local kb,vb=line:match('^%s*property boolean (%w+) = (%a+)')
 if kb then _GameConst[kb]=(vb=='true') end
end
ok(_GameConst.TopFadeOn==true,'TopFadeOn 스위치 = true')
ok(near(_GameConst.TopFadeAlpha,0.35),'TopFadeAlpha 0.35')
ok(near(_GameConst.TopFadeSec,0.15),'TopFadeSec 0.15')
ok(near(_GameConst.TopFadeTick,0.1),'TopFadeTick 0.1')
ok(near(_GameConst.TopFadeRange,6),'TopFadeRange 6칸')
ok(_GameConst.TopFadeMax==30,'TopFadeMax 30')
ok(_GameConst.TopFadeWidthFrac>0.5 and _GameConst.TopFadeWidthFrac<=1,'TopFadeWidthFrac (0.5, 1]')

-- ② 사각형·겹침 판정 (200×300 캔버스 · 피벗 0.5/0.02 · 배율 1 → 폭 2 · 높이 3 · 발 -0.06)
do
 local info={w=200,h=300,px=0.5,py=0.02,ppu=100}
 local t=DarkVision:TopRect(0,0,1,1,info,false,0.9,6)
 ok(near(t.foot,-0.06) and near(t.top,2.94),'발 = 캔버스 아래 · 윗면 = 발 + 높이')
 ok(near(t.left,-0.9) and near(t.right,0.9),'보이는 폭 = 캔버스 폭 × 0.9')
 ok(near(t.reach,6),'검사 생략 거리 최소 6칸')
 ok(DarkVision:TopCovers(t,0,1.0),'뒤(발 위쪽 · 윗면 아래 · 폭 안) = 가림')
 ok(DarkVision:TopCovers(t,0.85,0.2),'뒤 가장자리 = 가림')
 ok(not DarkVision:TopCovers(t,0,-0.5),'앞(발 y < 그림 발) = 안 가림')
 ok(not DarkVision:TopCovers(t,0,-0.06),'발과 같은 y = 안 가림')
 ok(not DarkVision:TopCovers(t,1.0,1.0),'옆(폭 밖) = 안 가림')
 ok(not DarkVision:TopCovers(t,0,3.0),'윗면 위 = 안 가림')
 -- 배율 2 · FlipX · 피벗 0.3: 좌우가 피벗 기준으로 바뀐다
 local i2={w=100,h=100,px=0.3,py=0,ppu=100}
 local a=DarkVision:TopRect(10,5,2,2,i2,false,1,6)
 local b=DarkVision:TopRect(10,5,2,2,i2,true,1,6)
 ok(near(a.left,9.4) and near(a.right,11.4),'뒤집기 전 피벗 0.3 → 9.4~11.4')
 ok(near(b.left,8.6) and near(b.right,10.6),'FlipX → 8.6~10.6 (피벗 기준 거울)')
 ok(near(a.top-a.foot,2),'배율 2 → 높이 2칸')
 -- 큰 그림(16칸)은 reach가 그림 반 크기
 local big=DarkVision:TopRect(0,0,1,1,{w=1600,h=400,px=0.5,py=0,ppu=100},false,1,6)
 ok(near(big.reach,8),'그림이 6칸보다 크면 reach = 반 폭')
 ok(DarkVision:TopCovers(big,7.5,1),'큰 그림 가장자리도 판정')
 -- 6칸 밖 생략: 사각형을 일부러 넓혀도 reach 밖이면 false
 local far={left=-100,right=100,foot=-100,top=100,cx=0,cy=0,reach=6}
 ok(not DarkVision:TopCovers(far,6.5,0),'거리 6칸 밖은 검사 생략')
 ok(DarkVision:TopCovers(far,5.9,0),'6칸 안은 검사')
 -- 보간: 0.1초 틱 · 0.15초 → 두 틱 만에 0.35 / 1
 local s1=DarkVision:TopFadeStep(1,0.35,0.35,0.1,0.15)
 ok(near(s1,1-0.65/1.5),'첫 틱 1 → 0.567')
 ok(near(DarkVision:TopFadeStep(s1,0.35,0.35,0.1,0.15),0.35),'둘째 틱 0.35 (넘지 않음)')
 ok(near(DarkVision:TopFadeStep(0.35,1,0.35,0.1,0.15),0.35+0.65/1.5),'복원 첫 틱')
 ok(near(DarkVision:TopFadeStep(0.9,1,0.35,0.1,0.15),1),'복원은 1에서 멈춤')
end

-- ③ 맵 장면: 제단(512×512 · 배율 1.2) · 간헐천(512×512 · 배율 1.1 · 뒤집기) · 촛대 둘(같은 RUID) · 일반 그림 · 벽
local loads={}
local sprites={
 altar={Width=512,Height=512,Pivot={x=0.5,y=0.02},PixelPerUnit=100},
 geyser={Width=512,Height=512,Pivot={x=0.5,y=0.014},PixelPerUnit=100},
 candle={Width=120,Height=200,Pivot={x=0.5,y=0.02},PixelPerUnit=100},
}
local function loadSprite(self,ruid)
 loads[ruid]=(loads[ruid] or 0)+1
 if ruid=='broken' then error('load fail') end
 return sprites[ruid]
end
_ResourceService={LoadSpriteAndWait=loadSprite}
local nextId=0
local function ent(name,x,y,sc)
 nextId=nextId+1
 local id='e'..nextId
 local tr={WorldPosition=Vector3(x,y,0),Position=Vector3(x,y,-0.03),Scale=Vector3(sc,sc,1)}
 return {Name=name,Id=id,Enable=true,TransformComponent=tr}
end
local function rend(e,ruid,order,flip)
 local layer=order==5 and 'Default' or 'Layer1'
 return {Entity=e,SpriteRUID=ruid,FlipX=flip or false,Color=Color(0.9,0.8,0.7,1),SortingLayer=layer,OrderInLayer=order}
end
local list={}
local function add(name,x,y,sc,ruid,order,flip) table.insert(list,rend(ent(name,x,y,sc),ruid,order,flip)) end
add('ArtProp1',24.5,-0.5,1.2,'altarBase',1)
add('ArtProp1Top',24.5,-0.5,1.2,'altar',5)
add('ArtProp2Top',30.5,-0.5,1.1,'geyser',5,true)
add('ArtSet1_2Top',21.5,1.0,1,'candle',5)
add('ArtSet1_3Top',27.5,1.0,1,'candle',5)
add('ArtWall1',0.5,0.5,1,'wall',1)
add('DecorTop',5,5,1,'other',5)   -- Art로 시작하지 않으면 대상 아님
local function children(self,tn,rec) return list end
local map={} map.Name='sanctum' map.GetChildComponentsByTypeName=children
local mapB={} mapB.Name='sulfurmarsh'
local player={} player.TransformComponent={} player.CurrentMap=map
_UserService={} _UserService.LocalPlayer=player
local function at(x,y) player.TransformComponent.WorldPosition=Vector3(x,y,0) end
at(0,0)
local function tick(n) for i=1,(n or 1) do DarkVision:TopFadeTick() end end
local altarR,candleL,candleR=list[2],list[4],list[5]

DarkVision.CurrentMap=map
DarkVision:ShadeWalls(map)
ok(#DarkVision.TopFades==4,'Art…Top 4개만 대상 (DecorTop·ArtProp1·ArtWall1 제외) '..#DarkVision.TopFades)
ok(loads.candle==1 and loads.altar==1 and loads.geyser==1,'같은 RUID 크기는 한 번만 읽음')
ok(loads.altarBase==nil and loads.wall==nil,'Top이 아닌 그림 크기는 읽지 않음')
ok(altarR.OrderInLayer==5 and list[1].OrderInLayer==0,'ShadeWalls 기존 동작 유지 (Top 순서 5 · 일반 그림 0)')
ok(countLog('[VRF] DarkVision 윗부분 반투명 대상 4개')==1,'진입 [VRF] 대상 수 한 줄')

-- 제단 사각형: 폭 6.144 · 높이 6.144 · 발 -0.5 - 0.02×6.144
local alt=DarkVision.TopFades[1]
ok(alt.r==altarR and near(alt.foot,-0.5-0.12288) and near(alt.top,alt.foot+6.144),'제단 발·윗면')
ok(near(alt.right-alt.left,6.144*0.9),'제단 보이는 폭')

-- 앞에 서면 그대로 (8차 앞 좌표 24.50, -1.01)
at(24.5,-1.01) tick(3)
ok(altarR.Color.a==1 and countLog('[VRF] top fade n=')==0,'제단 앞(남쪽) = 불투명 · 로그 없음')
-- 제단 뒤 (8차 멈춘 좌표 24.50, 2.01)
at(24.5,2.01) tick(1)
ok(near(altarR.Color.a,1-0.65/1.5),'제단 뒤 첫 틱 0.567')
ok(near(altarR.Color.r,0.9) and near(altarR.Color.g,0.8) and near(altarR.Color.b,0.7),'색(물들임)은 그대로 · 알파만')
tick(1)
ok(near(altarR.Color.a,0.35),'두 틱(0.2초) 만에 0.35')
ok(countLog('[VRF] top fade n=')==1 and lastLog('[VRF] top fade n=')=='[VRF] top fade n=1','[VRF] top fade n=1 한 번')
tick(5)
ok(countLog('[VRF] top fade n=')==1,'상태가 같으면 로그 더 없음')
ok(candleL.Color.a==1 and candleR.Color.a==1,'촛대 둘 = 영향 없음')
-- 제단 오른쪽 밖 · 오른쪽 촛대 뒤로 옮기면 제단은 복원, 촛대만 옅게
at(27.9,2.01) tick(1)
ok(near(altarR.Color.a,0.35+0.65/1.5),'벗어난 첫 틱 0.783')
tick(1)
ok(altarR.Color.a==1,'두 틱 만에 1 (원래 알파)')
ok(near(candleR.Color.a,0.35),'오른쪽 촛대 뒤 = 촛대만 옅게')
-- 여럿 동시: 제단 오른쪽 가장자리(~27.27)와 오른쪽 촛대(26.96~)가 겹치는 자리
at(27.1,1.5) tick(2)
local n2=0 for _,t in ipairs(DarkVision.TopFades) do if near(t.r.Color.a,0.35) then n2=n2+1 end end
ok(n2==2 and near(altarR.Color.a,0.35) and near(candleR.Color.a,0.35) and lastLog('[VRF] top fade n=')=='[VRF] top fade n=2','겹친 둘 모두 옅게 · n=2 ('..n2..')')
-- 간헐천 뒤 (8차 멈춘 좌표를 옮긴 자리 · 뒤집힌 그림): 간헐천만
at(30.5,2.0) tick(2)
ok(near(list[3].Color.a,0.35) and altarR.Color.a==1 and candleR.Color.a==1,'간헐천 뒤 = 간헐천만 옅게 · 나머지 복원')
-- 간헐천 FlipX: 피벗 0.5라 사각형 가운데는 그대로
local gy=DarkVision.TopFades[2]
ok(near((gy.left+gy.right)/2,30.5),'간헐천 뒤집기 가운데 30.5')
-- 위로 벗어남(윗면 위)
at(24.5,alt.top+0.2) tick(2)
ok(altarR.Color.a==1,'제단 윗면 위 = 불투명')
ok(lastLog('[VRF] top fade n=')=='[VRF] top fade n=0','모두 벗어나면 n=0')

-- 게시 플레이에서는 로그 없음 (판정은 그대로)
published=true
local before=countLog('[VRF] top fade n=')
at(24.5,2.01) tick(2)
ok(near(altarR.Color.a,0.35) and countLog('[VRF] top fade n=')==before,'게시 플레이: 옅게는 하되 로그 없음')
published=false

-- 맵 이동: 내 아바타가 다른 맵이면 판정 멈춤 → EnterMap 짝(RestoreTopFade)이 원래 색으로
player.CurrentMap=mapB
at(0,0) tick(3)
ok(near(altarR.Color.a,0.35),'맵이 바뀐 뒤 옛 목록은 판정하지 않음')
DarkVision:RestoreTopFade()
ok(altarR.Color.a==1 and altarR.Color.r==0.9 and #DarkVision.TopFades==0 and DarkVision.TopFadeCount==0,'RestoreTopFade: 원래 색 · 목록 비움')
tick(2)
ok(altarR.Color.a==1,'비운 뒤 틱 = 아무것도 안 함')
player.CurrentMap=map

-- 다시 들어와도 원래 색을 옅어진 색으로 잡지 않는다 (TopBase)
altarR.Color=Color(0.9,0.8,0.7,0.35)   -- 옅어진 상태에서 다시 진입했다고 치자
DarkVision:BuildTopFade({altarR})
ok(DarkVision.TopFades[1].base.a==1,'재진입 원래 색 = 처음 색 (알파 1)')
DarkVision:RestoreTopFade()
altarR.Color=Color(0.9,0.8,0.7,1)

-- 상한 30 · 크기 못 읽음 · 스위치 끔
do
 local many={}
 for i=1,35 do many[i]=rend(ent('ArtProp'..i..'Top',i*10,0,1),'candle',5) end
 DarkVision:BuildTopFade(many)
 ok(#DarkVision.TopFades==30 and lastLog('[VRF] DarkVision 윗부분 반투명 대상'):find('빠짐 5',1,true)~=nil,'맵당 30개 상한 · 빠짐 5')
 local bad={}
 table.insert(bad,rend(ent('ArtProp9Top',0,0,1),'broken',5))
 table.insert(bad,rend(ent('ArtProp8Top',0,0,1),'missing',5))
 table.insert(bad,rend(ent('ArtProp7Top',0,0,1),'',5))
 DarkVision:BuildTopFade(bad)
 ok(#DarkVision.TopFades==0 and DarkVision.TopSprites.broken==false and DarkVision.TopSprites.missing==false,'크기 못 읽으면(오류·nil·빈 RUID) 대상에서 뺌')
 _GameConst.TopFadeOn=false
 DarkVision:BuildTopFade({altarR})
 ok(#DarkVision.TopFades==0,'스위치 끄면 대상 0')
 _GameConst.TopFadeOn=true
end

-- ④ 소스 검사
local src=read('RootDesk/MyDesk/Ambience/DarkVision.mlua')
local NL=string.char(10)
local function body(name)
 local b=src:match(NL..'    method [^'..NL..']- '..name..'%([^'..NL..']*%)'..NL..'(.-)'..NL..'    end'..NL)
 assert(b,name..' 본문') return b
end
local function annot(name)
 local a=src:match(NL..'([^'..NL..']*)'..NL..'    method [^'..NL..']- '..name..'%(')
 return a or ''
end
local function each(words) return words:gmatch('%S+') end
local begin,endp=body('OnBeginPlay'),body('OnEndPlay')
ok(select(2,begin:gsub('SetTimerRepeat%(function%(%) self:TopFadeTick%(%) end, _GameConst%.TopFadeTick%)',''))==1,'반복 타이머는 OnBeginPlay에 한 번 (주기 = GameConst.TopFadeTick)')
ok(begin:find('if _GameConst.TopFadeOn then',1,true)~=nil,'스위치 끄면 타이머를 만들지 않음')
ok(endp:find('_TimerService:ClearTimer(self.TopFadeTimerId)',1,true)~=nil and endp:find('self:RestoreTopFade()',1,true)~=nil,'OnEndPlay: 타이머 정리 + 원래 색 (LEA-3051 짝)')
ok(select(2,src:gsub('self%.TopFadeTimerId = _TimerService',''))==1,'TopFadeTimerId에 타이머 대입은 한 곳뿐')
for m in each('EnterMap ShadeWalls BuildTopFade TopSpriteInfo TopFadeTick RestoreTopFade TopRect TopCovers TopFadeStep') do
 ok(not body(m):find('_TimerService',1,true),m..' 본문에 타이머 없음 (맵마다 쌓이지 않음)')
end
local em=body('EnterMap')
local r1,s1=em:find('self:RestoreTopFade()',1,true),em:find('self:ShadeWalls(map)',1,true)
ok(r1~=nil and s1~=nil and r1<s1,'EnterMap: 이탈 짝(Restore) → 진입 짝(ShadeWalls → BuildTopFade) 순서')
ok(body('ShadeWalls'):find('self:BuildTopFade(tops)',1,true)~=nil,'ShadeWalls가 같은 순회에서 Top 목록을 넘김')
for m in each('BuildTopFade TopSpriteInfo TopFadeTick RestoreTopFade') do
 ok(annot(m)=='    @ExecSpace("ClientOnly")',m..' = ClientOnly')
end
for m in each('TopRect TopCovers TopFadeStep') do ok(not annot(m):find('ExecSpace',1,true),m..' = 순수 계산(ExecSpace 없음)') end
ok(not src:find('@ExecSpace("Server',1,true) and not src:find('@ExecSpace("Multicast',1,true),'DarkVision에 서버·멀티캐스트 ExecSpace 없음')
local tf=body('TopFadeTick')
ok(tf:find('_UserService.LocalPlayer',1,true)~=nil and not tf:find('GetUsersByMapComponent',1,true) and not tf:find('script.Monster',1,true),'판정은 내 아바타만 (다른 플레이어·몬스터 안 봄)')
ok(tf:find('if n ~= self.TopFadeCount then',1,true)~=nil and tf:find('not Environment:IsPublishedPlay()',1,true)~=nil,'[VRF] top fade 로그는 바뀔 때만 · 게시 플레이 아님')
-- TopFade를 쓰는 스크립트는 DarkVision · GameConst뿐 (서버 쪽 사용 없음)
local users={}
local p=io.popen('grep -rl "TopFade" RootDesk/MyDesk --include=*.mlua')
for line in p:lines() do users[#users+1]=line end p:close()
table.sort(users)
ok(#users==2 and users[1]:find('Ambience/DarkVision.mlua',1,true) and users[2]:find('Common/GameConst.mlua',1,true),'TopFade 사용처 = DarkVision · GameConst뿐 ('..table.concat(users,' ')..')')
-- Top 이름 규칙: 생성기 <원본>Top (원본 = ArtProp·ArtSet…) ↔ DarkVision 접두 Art · 접미 Top
local lib=read('tools/build/handmade/lib.cjs')
local pre=BT..'ArtProp'..DL
ok(lib:find('name: '..BT..DL..'{name}Top'..BT,1,true)~=nil,'생성기 윗부분 이름 = <원본>Top')
ok(lib:find('place('..pre..'{++propN}'..BT,1,true)~=nil and lib:find('tag = '..BT..'ArtSet'..DL..'{++setN}'..BT,1,true)~=nil,'원본 이름은 Art로 시작 (ArtProp·ArtSet)')
ok(lib:find('const TOP_LAYER = "Default", TOP_ORDER = 5;',1,true)~=nil,'생성기 Top 층 Default/5')
ok(src:find('string.sub(name, 1, 3) == "Art" and string.sub(name, -3) == "Top"',1,true)~=nil,'DarkVision Top 판별 = 접두 Art · 접미 Top')
print(string.format('[top_fade] 통과 %d', checks))
