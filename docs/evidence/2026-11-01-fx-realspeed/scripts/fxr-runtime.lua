-- 11-01 FX 실속도 조사 — 메이커 maker_execute_script로 넣은 런타임 스크립트 모음 (게임 파일 아님 · 재현용)
-- ① 이전 담당(01:50) 클라 도우미 _G.FXR (lanes · F.swap(f) · F.prespawn/F.alpha(e) · HUD 끄기 · ZoomTo 100) — A1·A2·B1 세트가 이 위에서 돌았다
-- FXR 실속도 대조 실험 도우미 (클라이언트 · 런타임만 · 파일 아님)
local F={}
_G.FXR=F
local me=_UserService.LocalPlayer
F.map=me.CurrentMap
_CameraService:ZoomTo(100,0)
F.hl={"AimHUD","NavigationHUD","CompanionHUD","InteractionHUD","GameHUD","ChatHUD","ShadowHUD","JournalHUD","QuestJournalHUD","CoopHUD","RewardHUD","StoryHUD","ConfirmHUD"}
function F.hud(on) for _,n in ipairs(F.hl) do local e=_EntityService:GetEntityByPath("/ui/"..n) if e~=nil then e.Enable=on end end end
F.hud(false)
local c=_UILogic:ScreenToWorldPosition(Vector2(960,540))
F.c=c
F.lanes={}
local xs={-4.6,-1.55,1.55,4.6}
for i=1,8 do local row=(i<=4) and 1.8 or -1.2 local x=xs[(i-1)%4+1] F.lanes[i]=Vector3(c.x+x,c.y+row,0) end
local s=""
for i=1,8 do local sp=_UILogic:WorldToScreenPosition(Vector2(F.lanes[i].x,F.lanes[i].y)) s=s..string.format("L%d=(%.2f,%.2f)->(%.0f,%.0f) ",i,F.lanes[i].x,F.lanes[i].y,sp.x,sp.y) end
local u1=_UILogic:WorldToScreenPosition(Vector2(c.x+1,c.y))
log(string.format("[VRF] FXR setup c=(%.2f,%.2f) px/unit=%.1f %s me=%s",c.x,c.y,u1.x-960,s,tostring(me.TransformComponent.WorldPosition)))
function F.now() return _UtilLogic.ElapsedSeconds end
-- (f) 한 렌더러 RUID 교체
function F.swap(list,pos,scale,ms,order,tag)
  local e=_SpawnService:SpawnByModelId("artsprite","FXR_"..tag,pos,F.map)
  if not isvalid(e) then log("[VRF] FXR swap spawn fail "..tag) return end
  local sr=e.SpriteRendererComponent
  sr.SortingLayer="MapLayer0" sr.OrderInLayer=order sr.Color=Color(1,1,1,1)
  e.TransformComponent.WorldPosition=pos e.TransformComponent.Scale=Vector3(scale,scale,1)
  local plan=_Util:FramePlanMs(ms,#list,0,0)
  local t0=F.now() local i=1
  sr.SpriteRUID=list[plan.steps[1].idx]
  local step=nil
  step=function()
    i=i+1
    if i>#plan.steps then e:Destroy() log(string.format("[VRF] FXR swap %s done dt=%.3f",tag,F.now()-t0)) return end
    sr.SpriteRUID=list[plan.steps[i].idx]
    local due=i<#plan.steps and plan.steps[i+1].at or plan.clearAt
    _TimerService:SetTimerOnce(step,math.max(0.01,t0+due-F.now()))
  end
  _TimerService:SetTimerOnce(step,math.max(0.01,plan.steps[2].at))
end
-- (e) 장마다 엔티티 하나 · 알파만
function F.prespawn(list,pos,scale,order,tag)
  local es={}
  for k,r in ipairs(list) do
    local e=_SpawnService:SpawnByModelId("artsprite","FXR_"..tag..k,pos,F.map)
    local sr=e.SpriteRendererComponent sr.SortingLayer="MapLayer0" sr.OrderInLayer=order sr.SpriteRUID=r sr.Color=Color(1,1,1,0)
    e.TransformComponent.WorldPosition=pos e.TransformComponent.Scale=Vector3(scale,scale,1)
    es[k]=e
  end
  return es
end
function F.alpha(es,ms,tag)
  local plan=_Util:FramePlanMs(ms,#es,0,0)
  local t0=F.now() local i=1 local cur=es[plan.steps[1].idx]
  cur.SpriteRendererComponent.Color=Color(1,1,1,1)
  local step=nil
  step=function()
    i=i+1
    cur.SpriteRendererComponent.Color=Color(1,1,1,0)
    if i>#plan.steps then for _,e in ipairs(es) do e:Destroy() end log(string.format("[VRF] FXR alpha %s done dt=%.3f",tag,F.now()-t0)) return end
    cur=es[plan.steps[i].idx] cur.SpriteRendererComponent.Color=Color(1,1,1,1)
    local due=i<#plan.steps and plan.steps[i+1].at or plan.clearAt
    _TimerService:SetTimerOnce(step,math.max(0.01,t0+due-F.now()))
  end
  _TimerService:SetTimerOnce(step,math.max(0.01,plan.steps[2].at))
end

-- ② 세트 C (밝은 자리 4칸 · 같은 장면 두 번) — 클라
-- FXR 세트 C (클라이언트 · 런타임만): 밝은 자리 4칸 + 같은 장면 두 번(차가운/따뜻한) 비교
local F=_G.FXR
local c=F.c
F.P={Vector3(c.x-2.4,c.y+1.07,0),Vector3(c.x+2.4,c.y+1.07,0),Vector3(c.x-2.4,c.y-1.2,0),Vector3(c.x+2.4,c.y-1.2,0)}
local s="" for i=1,4 do local sp=_UILogic:WorldToScreenPosition(Vector2(F.P[i].x,F.P[i].y)) s=s..string.format("L%d(%.0f,%.0f) ",i,sp.x,sp.y) end
log("[VRF] FXR C lanes "..s)
local g=_EntityService:GetEntityByPath("/ui/GameHUD")
for _,ch in ipairs(g.Children) do if ch.Name~="ManaOrb" then ch.Enable=false end end
g.Enable=false
F.g=g
-- 표식 켜고 지정 함수를 같은 틱에 부른다
function F.fire(tag,fn)
  F.g.Enable=true
  local t0=_UtilLogic.ElapsedSeconds
  fn()
  log(string.format("[VRF] FXR fire %s t0=%.3f",tag,t0))
  _TimerService:SetTimerOnce(function() F.g.Enable=false end,3.5)
end
-- 세트 C1/C2: 새 장별 PlayEffect 4종
function F.C()
  local P=F.P local m=F.map local W=Color(1,1,1,1)
  _Util:PlayFramesMs(_GameConst.FxSkillDeathWave,m,P[1],0,Vector3(0.3,0.3,1),_GameConst.FxSkillDeathWaveMs,0,0,W,6)
  _Util:PlayFramesMs(_GameConst.FxSkillBlast,m,P[2],0,Vector3(0.6,0.6,1),_GameConst.FxSkillBlastMs,0,0,W,6)
  _Util:PlayFramesLoopMs(_GameConst.FxSkillPoisonCloud,m,P[3],0,Vector3(0.6,0.6,1),_GameConst.FxSkillPoisonCloudMs,2,0.8,0.3,W,6)
  _Util:PlayFramesLoopMs(table.concat(_Util:KeyFrames(_GameConst.FxSkillCurseCircles,"amp"),"|"),m,P[4],0,Vector3(0.6,0.6,1),_GameConst.FxSkillCurseCircleFrameMs,2,0.8,0.3,W,6)
end
log("[VRF] FXR C ready")

-- ③ F8 큐 (execute_script 시작이 최대 ~60초 늦어 녹화와 맞추려고 실제 키 입력 maker_keyboard_input F8로 쏜다) — 클라
local F=_G.FXR
if F.keyH~=nil then _InputService:DisconnectEvent(KeyDownEvent,F.keyH) end
F.q={}
function F.push(tag,fn) table.insert(F.q,{tag=tag,fn=fn}) log("[VRF] FXR queued "..tag.." n="..#F.q) end
F.keyH=_InputService:ConnectEvent(KeyDownEvent,function(e)
  if e.key==KeyboardKey.F8 then
    local it=table.remove(F.q,1)
    if it==nil then log("[VRF] FXR F8 empty") return end
    F.fire(it.tag,it.fn)
  end
end)
F.push("C1cold",F.C)
F.push("C2warm",F.C)

-- ④ 세트 C3/C4: 이번 세션에 한 번도 안 불린(미리 불러 두기 목록에도 없는) 옛 RUID 4계열 — 클라 (본문은 GameConst 「옛:」 주석에서 코드로 뽑음 · len 656 확인)
local F=_G.FXR
F.OLD={whirl="d0e492d0835d4f20b4d4d146e9556258|d95110ca8499440aa9fe6e6c05397532|8924b8f6faf242cba000e0cfcd9f468f|500c80639e8f4d098906ce479b6ac77d|636268d8650f4efd90e59a2b9ffc0a32|ddcb12fac64944e88225da7609e0dc24|bd84405e57aa4a6488f5728d9ea56751|63b816cdf11d4ac0af7581f7d2989a49",amp="49ebbb02b9a84974adb4ec418e96c03e|d79939c49b6242b7b2e042564796bd6c|b7eb149a9def4d77bb143160bcbe6397|5a82b5a70f1a4258a960a7749755d2c0",vortex="e00c6e7f8e8d4060916fad8c255de7b2|5da567d8dba94bc58ca14d8d7ae3f645|bb988b6fd6f346adade8cd8c80695845|60356b7c678f431daeb7ea60189e5a03",frost="3b69d4cd311d4c7ba2ca4d5a2bac6544|d25d3dd1604448569e5fa6fc6d6eee22|39b02492ddb1474e86678d7610591cd3|1ea9ceb580fc4ebbaaab556aa1db6f7d"}
function F.Cold()
  local P=F.P local m=F.map local W=Color(1,1,1,1) local O=F.OLD
  _Util:PlayFramesMs(O.whirl,m,P[1],0,Vector3(0.5,0.5,1),"100",0,0,W,6)
  _Util:PlayFramesMs(O.amp,m,P[2],0,Vector3(0.6,0.6,1),"100",0.4,0.3,W,6)
  _Util:PlayFramesMs(O.vortex,m,P[3],0,Vector3(0.6,0.6,1),"100",0.4,0.3,W,6)
  _Util:PlayFramesMs(O.frost,m,P[4],0,Vector3(0.6,0.6,1),"100",0.4,0.3,W,6)
end
F.push("C3cold",F.Cold)
F.push("C4warm",F.Cold)
log("[VRF] FXR cold set ready len="..(#F.OLD.whirl+#F.OLD.amp+#F.OLD.vortex+#F.OLD.frost))
-- ⑤ 세트 C5: 실제 시전 경로 — 서버(server_instance_game)에서 플레이어 SkillEffects의 Multicast 진입점을 4초마다 9번 (중간에 maker_screenshot 6장)
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local fx=p:GetComponent("script.SkillEffects")
local P={Vector3(-2.4,-0.905,0),Vector3(2.4,-0.905,0),Vector3(-2.4,-3.175,0),Vector3(2.4,-3.175,0)}
local sac=_GameConst.FxSkillSacrifice
local sk=2*1.8/(fx.SacrificeContentPx/100)
for i=1,9 do
  fx:C7Fx("wave",P[1],0.86,0.6)
  fx:C7Fx("blast",P[2],0.97,1)
  fx:FramesFxMs(sac,P[3],sk,_GameConst.FxSkillSacrificeMs,0,0,fx.SacrificeOrder)
  fx:Fx("resist",P[4],1.5)
  log(string.format("[VRF] FXR C5 cycle %d t=%.3f",i,_UtilLogic.ElapsedSeconds))
  wait(4)
end
-- (E1 = 같은 본문 · refresh 뒤 새 플레이 · wait(3) 뒤 3번 · 스틸 없음)

-- ⑥ T1: maker_screenshot 5장 동안 클라 게임 루프 틱 간격 (1/60 반복 타이머 · 9초) — 클라 (F8로 시작)
function F.Tick8()
  F.gaps={} local last=_UtilLogic.ElapsedSeconds local t0=last local maxg=0 local cnt=0 local big=0
  local id=0
  id=_TimerService:SetTimerRepeat(function()
    local now=_UtilLogic.ElapsedSeconds local g=now-last last=now cnt=cnt+1
    if g>maxg then maxg=g end
    if g>0.1 then big=big+1 table.insert(F.gaps,string.format("%.2f@%.2f",g,now-t0)) end
    if now-t0>9 then _TimerService:ClearTimer(id) log(string.format("[VRF] FXR tick cnt=%d max=%.3f big=%d %s",cnt,maxg,big,table.concat(F.gaps," "))) end
  end,1/60)
end

-- ⑦ D1: 녹화하면서 F8 직후 maker_screenshot 12장 연속 — 클라
function F.D1()
  local P=F.P local m=F.map local W=Color(1,1,1,1)
  local r=_Util:KeyFrames(_GameConst.FxSkillCurseCircles,"terror")
  local s=_EffectService:PlayEffect(r[3],m,P[2],0,Vector3(0.6,0.6,1),true,{SortingLayer="MapLayer0",OrderInLayer=6})
  _TimerService:SetTimerOnce(function() _EffectService:RemoveEffect(s) end,4.0)
  _Util:PlayFramesMs(_GameConst.FxSkillBlast,m,P[1],0,Vector3(0.6,0.6,1),_GameConst.FxSkillBlastMs,0,0,W,6)
  _Util:PlayFramesLoopMs(table.concat(_Util:KeyFrames(_GameConst.FxSkillCurseCircles,"thorn"),"|"),m,P[4],0,Vector3(0.6,0.6,1),_GameConst.FxSkillCurseCircleFrameMs,2,3.0,0.3,W,6)
  _Util:PlayFramesMs(_GameConst.FxSkillDeathWave,m,P[3],0,Vector3(0.3,0.3,1),_GameConst.FxSkillDeathWaveMs,0,0,W,6)
end
