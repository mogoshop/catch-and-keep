-- s48v2-A 거인 몸 재생 경계 (10-30 사용자 「거인이 이번 만든 에셋 완전 적용 안 된 듯 · 프레임 아끼지 말 것」): 실제 본문
--   MotionSmoother(FrameClip·FramePick) · UndeadSystem(GiantStateOrder·GiantExtraStates·GiantLook) · ShadowUnit(GiantPlay·GiantMotionKey·GiantRoarBody)로
--   ① 12·16장(그리고 64장) 몸이 60·50·30Hz 갱신(흔들림 포함)에서 중간 칸 누락 0 · 길이 늘어남 0 (6장 하드캡 없음)
--   ② 루프 이음: 끝 칸 → 반복 시작 칸(ls) · 준비 칸은 한 번 ③ 한 번 동작은 hold가 길어도 되감지 않고 마지막 칸 · 연속 베기(평타 그림)는 hold 동안 반복
--   ④ 타격 칸(impact → s)은 긴 프레임(멈칫)에도 건너뛰지 않음 ⑤ 표의 새 몸 키(skill3 등)는 코드 수정 없이 재생·외형에 실림
--   ⑥ 실제 표: 거인 지속 ≥ 1/30초(30Hz 갱신에서도 칸 누락 0) · 첫 칸 겹침 0 · 상태 전환(대기→이동→평타→피격→소멸→기술→함성)에서 외형군 하나
--      (외형군 = docs/evidence/2026-10-30-s48v2-A/frames-remap.csv · 구형 J203 / 최종 V4 · 업로드 전엔 알려진 혼용만 허용, GIANT_BODY_STRICT=1이면 실패)
--   ⑦ 방패 함성 몸(키 shield skill1 = C 검증표): 그림이 있을 때만 · 기술 중 생략 · 맞음은 덮음 · 평타 중이면 끝난 뒤 · 함성 FX는 몸 시작 콜백(onStart)에 (A-ROAR-01)
--   ※ 지속 1/30초는 필수 규칙이 아니다(코덱스 정정): 30Hz는 화면 표본일 뿐 — 실제 표는 경고로만 보고, 16장 0.4초(25ms)는 60Hz에서 누락·늘어남 0을 확인
-- @source GameData Data/GameData.mlua Ensure,GetMonsterFrames
-- @source MotionSmoother World/MotionSmoother.mlua FrameClip,FramePick
-- @source UndeadSystem Undead/UndeadSystem.mlua GiantStateOrder,GiantExtraStates,GiantLook
-- @source ShadowUnit Shadow/ShadowUnit.mlua GiantPlay,GiantMotionKey,GiantRoarBody
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b,e) return math.abs(a-b)<=(e or 1e-6) end
function isvalid(x) return x~=nil and x~=false and x.dead~=true end
Environment={IsPublishedPlay=function() return false end}
_UtilLogic={ElapsedSeconds=0,ServerElapsedSeconds=0}
local timers={}
_TimerService={SetTimerOnce=function(_,fn,delay) table.insert(timers,{at=_UtilLogic.ElapsedSeconds+delay,fn=fn}) return #timers end}
local function advance(sec)
 local stop=_UtilLogic.ElapsedSeconds+sec
 table.sort(timers,function(a,b) return a.at<b.at end)
 while #timers>0 and timers[1].at<=stop+1e-9 do
  local t=table.remove(timers,1)
  _UtilLogic.ElapsedSeconds=t.at _UtilLogic.ServerElapsedSeconds=t.at
  t.fn()
 end
 _UtilLogic.ElapsedSeconds=stop _UtilLogic.ServerElapsedSeconds=stop
end
_GameData:Ensure()
local MS=MotionSmoother
local MIN_FRAME=1/30   -- 경고 기준만 (필수 규칙·엔진 상한 아님 · 코덱스 정정 10-30): 이보다 짧은 칸은 30Hz 화면에서 표본에 안 잡힐 수 있다

local function seq(prefix,n,d,loop,extra)
 local f={r={},d={},loop=loop}
 for i=1,n do f.r[i]=prefix..i f.d[i]=type(d)=='table' and d[i] or d end
 for k,v in pairs(extra or {}) do f[k]=v end
 return f
end
local function sum(f) local s=0 for _,d in ipairs(f.d) do s=s+d end return s end
-- 갱신 주기 fps(흔들림: 짝·홀 틱 0.8/1.2배)로 dur초 동안 고른 칸이 바뀐 순서와 바뀐 시각
local function render(f,fps,dur,looping,jitter)
 local shown,at={},{}
 local last,t,k=nil,0,0
 while t<=dur+1e-9 do
  local i=MS:FramePick(f,t,looping)
  if i~=last then table.insert(shown,i) at[#shown]=t last=i end
  k=k+1
  t=t+(1/fps)*(jitter and (k%2==0 and 1.2 or 0.8) or 1)
 end
 return shown,at
end
local function inOrder(shown,from,to)
 if #shown~=to-from+1 then return false end
 for i,v in ipairs(shown) do if v~=from+i-1 then return false end end
 return true
end

-- ① 12·16·64장 한 번 동작: 칸 누락 0 · 길이 그대로 (갱신 주기와 무관)
local bodies={
 {name='대검 회전 몸 16장',f=seq('S',16,0.05,false)},
 {name='회전 몸 16장 0.4초(25ms · 60Hz 재생 가능)',f=seq('W',16,0.025,true)},
 {name='땅 가르기 몸 12장(지속 제각각)',f=seq('R',12,{0.08,0.07,0.06,0.05,0.04,0.04,0.05,0.06,0.07,0.08,0.1,0.12},false)},
 {name='방패 함성 몸 10장',f=seq('H',10,0.06,false)},
 {name='상한 없음 확인 64장',f=seq('X',64,0.04,false)},
}
for _,b in ipairs(bodies) do
 local total=sum(b.f)
 for _,fps in ipairs({60,50,30}) do
  for _,jit in ipairs({false,true}) do
   local tick=(1/fps)*(jit and 1.2 or 1)
   local mind=math.huge for _,d in ipairs(b.f.d) do mind=math.min(mind,d) end
   if mind>=tick-1e-9 then
    local shown,at=render(b.f,fps,total+0.5,false,jit)
    ok(inOrder(shown,1,#b.f.r),string.format('%s @%dHz%s: 1..%d 순서대로 누락 0',b.name,fps,jit and '±20%' or '',#b.f.r))
    local lastStart=total-b.f.d[#b.f.d]
    ok(at[#shown]>=lastStart-1e-9 and at[#shown]<=lastStart+tick+1e-9,string.format('%s @%dHz: 마지막 칸 시작 %.3f초(표 %.3f) — 늘어남 없음',b.name,fps,at[#shown],lastStart))
   end
  end
 end
 ok(MS:FramePick(b.f,total+3,false)==#b.f.r,b.name..': 끝나면 마지막 칸 유지')
end
-- 지속이 화면 갱신 한 번보다 짧으면 그 화면에선 칸이 표본에 안 잡힌다 (코드 상한이 아니라 화면 주기 · 경고만)
do
 local f=seq('Q',16,0.01,false)
 local shown=render(f,60,0.3,false,false)
 ok(#shown<16,'지속 0.01초 × 16장은 60Hz에서 칸을 건너뛴다 (그래서 거인 표는 1/30초 이상)')
end

-- ② 루프 이음
do
 local f=seq('L',16,0.05,true)
 local shown=render(f,60,0.8*2-0.01,true,false)
 local ok2=#shown==32
 for i=1,32 do if shown[i]~=((i-1)%16)+1 then ok2=false end end
 ok(ok2,'16장 루프 두 바퀴: 16 → 1로 이음 · 같은 칸 두 번 없음')
 local g=seq('G',12,0.06,true,{ls=5})
 local s2=render(g,60,0.72+0.48*2-0.001,true,false)
 local want={} for i=1,12 do want[#want+1]=i end for _=1,2 do for i=5,12 do want[#want+1]=i end end
 local same=#s2==#want for i=1,#want do if s2[i]~=want[i] then same=false end end
 ok(same,'반복 시작 칸 ls=5: 준비 1~4는 한 번, 그 뒤 5~12 반복')
 ok(MS:FramePick(g,0.72+0.001,true)==5,'끝 칸 다음은 반복 시작 칸')
end

-- ③④⑤ FrameClip: 표 주도 · hold · 타격 칸
do
 local zz={
  stand=seq('zS',4,0.18,true), move=seq('zM',6,0.12,true), attack=seq('zA',6,0.09,false,{s=4}),
  skill=seq('zK',6,0.1,false), hit=seq('zH',2,0.15,false), split=seq('zP',6,0.1,false),
  skill1=seq('z1_',16,0.05,true), skill2=seq('z2_',12,0.06,false,{s=6}), skill3=seq('zR',10,0.06,false),
 }
 _GameData.MonsterFrames['giant_zz']=zz
 MS.FrameIndex=nil
 local unit={GiantHoldUntil=0}
 local r={unit=unit}
 local function frames(clip,dur,fps)
  local shown={} local last=nil
  local t0=_UtilLogic.ElapsedSeconds
  while _UtilLogic.ElapsedSeconds<=t0+dur+1e-9 do
   local c=MS:FrameClip(r,clip)
   if c~=last then table.insert(shown,c) last=c end
   _UtilLogic.ElapsedSeconds=_UtilLogic.ElapsedSeconds+1/(fps or 60)
   _UtilLogic.ServerElapsedSeconds=_UtilLogic.ElapsedSeconds
  end
  return shown
 end
 _UtilLogic.ElapsedSeconds=10 _UtilLogic.ServerElapsedSeconds=10
 local s=frames('z2_1',0.72+0.5)
 ok(#s==12 and s[1]=='z2_1' and s[12]=='z2_12','기술 몸 12장 한 번: 12칸 모두 · 끝 칸에서 멈춤')
 local r16=frames('z1_1',0.8-0.001,50)
 ok(#r16==16 and r16[16]=='z1_16','기술 몸 16장(50Hz): 16칸 모두')
 local rr=frames('zR1',0.6+0.3)
 ok(#rr==10 and rr[10]=='zR10','새 몸 키 skill3(10장)도 코드 수정 없이 재생 (표 주도)')
 -- hold: 한 번 동작은 되감지 않고 마지막 칸
 r.frameAct=nil
 unit.GiantHoldUntil=_UtilLogic.ServerElapsedSeconds+3
 local h=frames('z2_1',2.0)
 ok(#h==12 and h[#h]=='z2_12','hold 2초 > 몸 0.72초: 한 번 동작은 처음으로 되감지 않음 (준비 자세 두 번 0)')
 -- hold: 평타 그림 반복(연속 베기 = attack 첫 칸)은 반복
 r.frameAct=nil
 unit.GiantHoldUntil=_UtilLogic.ServerElapsedSeconds+3
 local a=frames('zA1',0.54*2-0.01)
 ok(#a==12 and a[7]=='zA1','hold 중 평타 그림 반복(쌍칼 연속 베기): 6칸 두 바퀴')
 unit.GiantHoldUntil=0
 -- 루프 동작(회전)은 hold 없어도 표의 loop대로
 r.frameAct=nil
 local sp=frames('z1_1',1.6-0.001)
 ok(#sp==32,'회전 몸 16장 loop: 1.6초 = 두 바퀴 32칸')
 -- 타격 칸: 한 갱신이 0.2초 넘게 멈칫해도 타격 칸(6)을 보인다
 r.frameAct=nil
 local c1=MS:FrameClip(r,'z2_1')
 _UtilLogic.ElapsedSeconds=_UtilLogic.ElapsedSeconds+0.45   -- 0.45초 = 8번째 칸 시각
 local c2=MS:FrameClip(r,'z2_1')
 _UtilLogic.ElapsedSeconds=_UtilLogic.ElapsedSeconds+1/60
 local c3=MS:FrameClip(r,'z2_1')
 ok(c1=='z2_1' and c2=='z2_6' and c3=='z2_8','멈칫으로 타격 칸을 넘으면 그 갱신은 타격 칸 · 다음은 시간대로 (길이 늘어남 없음)')
 -- 공격 타격 칸 그림(서버 AttackRUID)은 예전처럼 타격 칸이 AttackWindup에 오게
 r.frameAct=nil
 local t0=_UtilLogic.ElapsedSeconds
 local first=MS:FrameClip(r,'zA4')
 _UtilLogic.ElapsedSeconds=t0+MS.AttackWindup+0.001
 ok(first=='zA1' and MS:FrameClip(r,'zA4')=='zA4','평타: 타격 칸이 서버 피해 시점(AttackWindup)에 (기존 규칙 보존)')
 _GameData.MonsterFrames['giant_zz']=nil
 MS.FrameIndex=nil
end

-- ⑥ 실제 표: 지속 하한 · 첫 칸 겹침 · GiantLook · 외형군
local fam,applied,pending,replaceRows={},0,0,0
do
 local fh=io.open('docs/evidence/2026-10-30-s48v2-A/frames-remap.csv')
 ok(fh~=nil,'외형 연결표 frames-remap.csv 있음')
 local head=nil
 for line in fh:lines() do
  line=line:gsub('\r$','') local cols={} for c in (line..','):gmatch('([^,]*),') do table.insert(cols,c) end
  if head==nil then head={} for i,c in ipairs(cols) do head[c]=i end
  else
   local old,new,ch=cols[head.old_ruid],cols[head.new_ruid],cols[head.change]
   if ch=='keep' then fam[old]='V4'
   else
    fam[old]='J203' replaceRows=replaceRows+1
    if new:sub(1,15)=='PENDING_UPLOAD:' then pending=pending+1 else fam[new]='V4' end
   end
  end
 end
 fh:close()
end
local forms={'basic','shield','greatsword','twin','mage'}
MS.FrameIndex=nil
MS:FrameClip({},'')   -- 색인 만들기
local giantRows,shortest,warnShort=0,math.huge,0
for key,set in pairs(_GameData.MonsterFrames) do
 if key:sub(1,6)=='giant_' then
  for act,f in pairs(set) do
   giantRows=giantRows+1
   ok(#f.r==#f.d,key..'.'..act..': 칸 수 = 지속 수')
   for _,d in ipairs(f.d) do shortest=math.min(shortest,d) if d<MIN_FRAME-1e-9 then warnShort=warnShort+1 print(string.format('[quality/giant_body_playback] 경고: %s.%s 칸 지속 %.3f < 1/30초 — 30Hz 화면에선 표본에 안 잡힐 수 있음(필수 규칙 아님)',key,act,d)) end ok(d>0,key..'.'..act..' 지속 양수') end
   if #f.r>1 then
    local hit=MS.FrameIndex[f.r[1]]
    ok(hit~=nil and hit.f==set[act],key..'.'..act..': 첫 칸이 다른 동작과 겹치지 않음 (자기 동작으로 재생)')
   end
   for _,ru in ipairs(f.r) do if fam[ru]=='V4' and set==set then end end
  end
 end
end
ok(giantRows>=36,'거인 표 줄 36개 이상 (기본 30 + 기술 6)')
local mixed={}
for _,form in ipairs(forms) do
 local look=UndeadSystem:GiantLook(form)
 ok(look~=nil and look.stand~=nil and look.split~=nil,form..': GiantLook 완전 (기본 6동작)')
 local set=_GameData:GetMonsterFrames('giant_'..form)
 local seen={}
 -- 대기 → 이동 → 평타 → 피격 → 소멸 → 기술(skill·skill1·skill2) → 함성 → 대기
 for _,st in ipairs({'stand','move','attack','hit','split','skill','skill1','skill2','stand'}) do
  local f=set[st]
  if f~=nil then for _,ru in ipairs(f.r) do local fm=fam[ru] or 'unknown' seen[fm]=(seen[fm] or 0)+1 if fm=='V4' and fam[ru]=='V4' then applied=applied end end end
 end
 local n=0 for _ in pairs(seen) do n=n+1 end
 ok(seen.unknown==nil,form..': 거인 몸 RUID 모두 연결표에 있음 (출처 모름 0)')
 if n>1 then table.insert(mixed,form) end
end
local strict=os.getenv('GIANT_BODY_STRICT')=='1'
local remapApplied=false
for _,set in pairs({_GameData:GetMonsterFrames('giant_basic')}) do if fam[set.stand.r[1]]=='V4' then remapApplied=true end end
if remapApplied or strict then
 ok(#mixed==0,'상태 전환 외형군 하나 (V4 기본 150 + 기술 몸): 섞인 종 '..table.concat(mixed,','))
 print('[quality/giant_body_playback] 외형군: 5종 모두 V4 한 외형군')
else
 -- 업로드(메이커 담당) 전: 알려진 결함 S48-V4-BASE-BODY-BINDING-GAP 그대로인지만 (기본 150 = J203 · 기술 33 = V4). 새 혼용이 생기면 실패
 ok(replaceRows==150,'V4 기본 150 교체 행 150 (frames-remap.csv · 업로드 RUID '..(150-pending)..' · 대기 '..pending..')')
 for _,form in ipairs(forms) do
  local set=_GameData:GetMonsterFrames('giant_'..form)
  for _,st in ipairs({'stand','move','attack','skill','hit','split'}) do for _,ru in ipairs(set[st].r) do ok(fam[ru]=='J203',form..'.'..st..' = 구형 J203 (교체 대기)') end end
  for _,st in ipairs({'skill1','skill2'}) do if set[st] then for _,ru in ipairs(set[st].r) do ok(fam[ru]=='V4',form..'.'..st..' = V4 계열') end end end
 end
 print('[quality/giant_body_playback] 외형군: 연결 전 — 기본 150 J203 · 기술 33 V4 혼용(알려진 결함 · 연결표 frames-remap-sequences.csv를 monster_frames에 넣으면 자동 엄격 검사 · GIANT_BODY_STRICT=1이면 지금 실패) 섞인 종 '..table.concat(mixed,','))
end
-- 타격 칸 시간 (impact → s → GiantLook <동작>Hit)
do
 local real=_GameData.MonsterFrames['giant_shield']
 local copy={} for k,v in pairs(real) do copy[k]=v end
 copy.skill2={r=real.skill2.r,d=real.skill2.d,loop=real.skill2.loop,s=4}
 _GameData.MonsterFrames['giant_shield']=copy
 local look=UndeadSystem:GiantLook('shield')
 ok(look.skill2Hit~=nil and near(look.skill2Hit,real.skill2.d[1]+real.skill2.d[2]+real.skill2.d[3]),'몸 타격 칸 시간 = 앞 칸 지속 합 (GiantLook skill2Hit)')
 copy.skill1=seq('rr',9,0.07,false)
 look=UndeadSystem:GiantLook('shield')
 ok(look.skill1=='rr1' and near(look.skill1Sec,0.63),'방패 함성 몸 줄(shield skill1 · C 검증표 키)이 오면 외형에 실림')
 copy.skill3=seq('k3_',8,0.05,false)
 local ex=UndeadSystem:GiantExtraStates(copy)
 ok(ex[1]=='skill1' and ex[2]=='skill2' and ex[3]=='skill3' and #ex==3,'새 키는 이름 순서로 뒤에 (기본 6동작 제외 · roar 별칭 없음)')
 look=UndeadSystem:GiantLook('shield')
 ok(look.skill3=='k3_1' and look.roar==nil,'표의 새 키 skill3도 외형에 · roar 키는 쓰지 않음')
 _GameData.MonsterFrames['giant_shield']=real
end

-- ⑦ 방패 함성 몸 (키 skill1 · onStart = 몸이 실제로 시작하는 순간 → 함성 FX 같이 시작 · A-ROAR-01)
do
 local function su()
  local u=setmetatable({},{__index=ShadowUnit})
  u.Giant=true u.GiantKind='shield' u.Dead=false u.GiantLookToken=1
  u.GiantLook={form='shield',stand='S',skill2='K2',skill2Sec=0.5,hit='H',hitSec=0.3}
  u.GiantClipUntil=0 u.GiantClipState='' u.AttackAnimationUntil=0 u.GiantHitAt=-99 u.GiantHoldUntil=0 u.CurrentClip='S'
  u.Entity={Id='su',SpriteRendererComponent={SpriteRUID='S'}}
  return u
 end
 local function roarable() local u=su() u.GiantLook.skill1='R' u.GiantLook.skill1Sec=0.6 return u end
 local calls
 local function cb(started) table.insert(calls,{at=_UtilLogic.ElapsedSeconds,started=started}) end
 _UtilLogic.ElapsedSeconds=200 _UtilLogic.ServerElapsedSeconds=200
 local u=su() calls={}
 local r=u:GiantRoarBody(cb)
 ok(r==-1 and #calls==0 and u.CurrentClip=='S','함성 몸 그림(skill1) 미등록: -1 → 부른 쪽이 FX 바로 · 몸 동작 없음 · 일반 skill로 대신 안 함')
 u=roarable() calls={}
 r=u:GiantRoarBody(cb)
 ok(r==0 and u.CurrentClip=='R' and u.GiantClipState=='skill1' and near(u.GiantClipUntil,200.6),'함성 몸 등록: 지금 0.6초 몸 동작')
 ok(#calls==1 and calls[1].started==true and near(calls[1].at,200),'몸 시작 순간 onStart(true) → 함성 FX 같이 시작')
 u=roarable() calls={}
 u:GiantPlay('skill2',0)
 r=u:GiantRoarBody(cb)
 ok(r==-1 and u.CurrentClip=='K2' and #calls==0,'기술 동작 중엔 몸 생략(기술 몸 보존) · -1 → FX 바로')
 u=roarable() calls={}
 u:GiantPlay('hit',0)
 r=u:GiantRoarBody(cb)
 ok(r==0 and u.CurrentClip=='R' and #calls==1,'맞음 그림은 함성 몸이 덮는다')
 u=roarable() calls={}
 u.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+0.3
 r=u:GiantRoarBody(cb)
 ok(near(r,0.3) and u.CurrentClip=='S' and #calls==0,'평타 중: 0.3초 뒤 예약 · 평타 그림 보존 · FX도 아직')
 advance(0.31)
 ok(u.CurrentClip=='R' and #calls==1 and calls[1].started==true and near(calls[1].at,200.3),'평타가 끝난 순간 몸과 FX가 같이 시작')
 u=roarable() calls={}
 u.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+0.9
 r=u:GiantRoarBody(cb) advance(1)
 ok(r==-1 and u.CurrentClip=='S' and #calls==0,'평타가 0.6초 넘게 남으면 몸 생략 · -1 → FX 바로')
 u=roarable() calls={}
 u.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+0.3
 u:GiantRoarBody(cb) advance(0.1) u.AttackAnimationUntil=0 u:GiantPlay('skill2',0) advance(0.3)
 ok(u.CurrentClip=='K2' and #calls==1 and calls[1].started==false,'예약 사이 기술이 시작되면 몸은 안 걸고 onStart(false) — FX만 그때')
 u=roarable() calls={}
 u.AttackAnimationUntil=_UtilLogic.ElapsedSeconds+0.3
 u:GiantRoarBody(cb) u.GiantLookToken=2 advance(0.4)
 ok(u.CurrentClip=='S' and #calls==0,'기다리는 사이 거인이 바뀌면(차례 다름) 몸·FX 모두 없음')
 local fh=io.open('RootDesk/MyDesk/Shadow/ShadowUnit.mlua') local src=fh:read('a') fh:close()
 ok(src:find('self:GiantRoarBody(',1,true)==nil,'ShadowUnit은 함성 몸을 직접 걸지 않는다 (RiteGiantMoves.Roar 한 곳에서 GiantRoarBody(onStart) — 이중 재생 방지)')
end
-- 정적: 6장 하드캡·고정 장 수 코드 없음
do
 local fh=io.open('RootDesk/MyDesk/World/MotionSmoother.mlua') local src=fh:read('a') fh:close()
 ok(src:find('method integer FramePick(table f, number t, boolean looping)',1,true)~=nil,'FramePick 누적 시간 선택')
 ok(src:find('#f.r > 6',1,true)==nil and src:find('math.min(6',1,true)==nil and src:find('math.min(#f.r, 6',1,true)==nil,'6장 상한 코드 없음')
 local fu=io.open('RootDesk/MyDesk/Undead/UndeadSystem.mlua') local us=fu:read('a') fu:close()
 ok(us:find('method table GiantExtraStates(table set)',1,true)~=nil,'추가 동작 키 표 주도')
end
if warnShort>0 then print('[quality/giant_body_playback] 짧은 칸 경고 '..warnShort..'개 (필수 규칙 아님)') end
print(string.format('[quality/giant_body_playback] s48v2-A %d checks: 12·16·64 frames no skip/no stretch @60/50/30Hz · loop seam ls · hold no rewind · impact kept · data-driven keys · real table 1/30s warn-only (min %.3f) · first-frame unique · roar body skill1 + onStart FX sync',checks,shortest))
