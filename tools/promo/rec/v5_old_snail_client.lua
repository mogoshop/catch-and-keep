-- 5차 「옛날 메이플」 재현 — 클라이언트 연출 (maker_execute_script client). 정의 뒤 _G.TAKEA() / _G.TAKEB()
-- 불러온 맵엔 MapAmbience가 없어 화면이 검다 → 전체 조명을 직접 켠다
local m=_UserService.LocalPlayer.CurrentMap
_OverlayLightService:SetOverlayLightEnabled(true)
_G.REC_LIGHT=_OverlayLightService:SpawnGlobalTypeOverlayLight(GlobalTypeOverlayLightInfo(m, 0, Color(1,1,1,1), 1))
local me=_UserService.LocalPlayer me.AvatarRendererComponent:SetAlpha(0) if isvalid(me.NameTagComponent) then me.NameTagComponent.Enable=false end
_GameData.cameraZoom=120 _CameraService:ZoomTo(120,0.2) _CameraService:GetCurrentCameraComponent().CameraOffset=Vector2(0,0.6)
local N=function() return _EntityService:GetEntityByPath("/maps/oldsnail/RecBeginner") end
_G.R={N=N}
R.face=function(d) local e=N() local s=e.TransformComponent.Scale e.TransformComponent.Scale=Vector3(d>0 and -math.abs(s.x) or math.abs(s.x),s.y,1) end
R.act=function(name,rate,loop) local b=N().AvatarRendererComponent:GetBodyEntity() local ev=ActionStateChangedEvent() ev.CoreActionName=name ev.PartsActionName=name ev.PlayRate=rate or 1 ev.PlayType=loop and SpriteAnimClipPlayType.Loop or SpriteAnimClipPlayType.Onetime b:SendEvent(ev) end
R.walk=function(x1,spd) local e=N() local p=e.TransformComponent.Position local dir=x1>p.x and 1 or -1 R.face(dir) R.act("walk1",1.3,true)
  local x=p.x while (x1-x)*dir>0 do wait(1/60) x=x+dir*spd/60 if (x1-x)*dir<0 then x=x1 end e.TransformComponent.Position=Vector3(x,p.y,p.z) end R.act("stand1",1,true) end
R.SK="6ba67548f43f48f29eb23dafd0766383"
R.clips={g={stand="17b55730c26f4fd6b8fcfa288da388de",hit="eac48e84a9fc4580a4018de5cf52ddb3",die="51c2f4b59a2c413db26035aa57002fc8"},
         b={stand="0c69164656d24f64bd1a1f6ee4019dff",hit="938c814d2142406c8a6480ee2b025ac3",die="af2e35a7899d4cc18e4f4aec7f8e9f06"}}
R.S=function(n) return _EntityService:GetEntityByPath("/maps/oldsnail/"..n) end
R.hit=function(sn,k,dmg,miss) local s=R.S(sn) local sr=s.SpriteRendererComponent sr.SpriteRUID=R.clips[k].hit
  if miss then _DamageSkinService:PlayTextDamage(s,R.SK,DamageSkinTextType.Miss,DamageSkinTweenType.Default) else _DamageSkinService:Play(s,R.SK,0,{dmg},DamageSkinTweenType.Default,false) end
  _TimerService:SetTimerOnce(function() if isvalid(s) and sr.SpriteRUID==R.clips[k].hit then sr.SpriteRUID=R.clips[k].stand end end,0.45) end
R.die=function(sn,k) local sr=R.S(sn).SpriteRendererComponent sr.SpriteRUID=R.clips[k].die _TimerService:SetTimerOnce(function() sr.Enable=false end,0.75) end
R.reset=function(sn,k) local sr=R.S(sn).SpriteRendererComponent sr.Enable=true sr.SpriteRUID=R.clips[k].stand end
R.swing=function(n) R.act(n or "swingO1",1.0,false) end
-- (a) 걸어가 때리고 처치 — 주의: 스크립트가 끝나면 남은 타이머가 취소되니 마지막 die 뒤 1초 이상 기다릴 것
_G.TAKEA=function()
  R.reset("monster-1224_2","g") R.reset("monster-1224_4","b")
  local e=N() local p=e.TransformComponent.Position e.TransformComponent.Position=Vector3(-2.7,p.y,p.z) R.face(1) R.act("stand1",1,true) wait(1.0)
  R.walk(-1.85,1.1) wait(0.25)
  for i,d in ipairs({12,9,14}) do R.swing(i==2 and "swingO2" or "swingO1") wait(0.28) R.hit("monster-1224_2","g",d) wait(0.5) end
  R.die("monster-1224_2","g") wait(1.0) R.walk(-0.95,1.1) wait(0.25)
  for i,d in ipairs({11,0,13,10}) do R.swing(i%2==0 and "swingO2" or "swingO1") wait(0.28) R.hit("monster-1224_4","b",d,d==0) wait(0.5) end
  R.die("monster-1224_4","b") wait(1.2) R.act("stand1",1,true)
end
-- (b) 달팽이 셋 사이 느릿한 노가다 (처치 없음)
_G.TAKEB=function()
  R.reset("monster-1224_2","g") R.reset("monster-1224_4","b") R.reset("monster-1224_3","g") R.S("monster-1224_2").SpriteRendererComponent.FlipX=true
  local e=N() local p=e.TransformComponent.Position e.TransformComponent.Position=Vector3(-1.45,p.y,p.z) R.face(1) R.act("stand1",1,true) wait(0.9)
  local seq={{1,"monster-1224_4","b",6},{1,"monster-1224_4","b",0},{1,"monster-1224_4","b",7},{-1,"monster-1224_2","g",5},{-1,"monster-1224_2","g",8},{1,"monster-1224_4","b",6},{1,"monster-1224_4","b",0}}
  local gaps={1.1,1.0,0.9,0.9,1.0,1.0,0.8}
  for i,s in ipairs(seq) do R.face(s[1]) R.swing(i%2==0 and "swingO2" or "swingO1") wait(0.28) R.hit(s[2],s[3],s[4],s[4]==0) wait(gaps[i]) R.act("stand1",1,true) wait(0.15) end
end
log("[VRF] REC old snail director ready")
