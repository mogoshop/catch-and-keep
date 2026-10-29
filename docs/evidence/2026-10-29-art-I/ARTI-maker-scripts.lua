-- ART-I (I-1 · I-2) — 메이커 maker_execute_script로 실행한 스크립트 모음 (재현용). 게임 소스는 고치지 않음.
-- 「준비」 = 상태를 만드는 조작(검증 아님) · 「검증」 = 실제 단추 ButtonClickEvent · 실제 키보드 입력(maker_keyboard_input) · 그 결과 엔티티 값/로그/캡처

-- ===== 로비 (client): 새 RUID가 데이터에 올라왔는지 + 입장 =====
log("[VRF] ARTI lobby mark_resist="..tostring(_GameData:GetUiIcon("mark_resist")).." amp="..tostring(_GameData:GetUiIcon("mark_amp")).." chill="..tostring(_GameData:GetUiIcon("mark_chill")))
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] ARTI click "..p) else log("[VRF] ARTI click MISSING "..p) end end
click("CharSelect/Box/S4") wait(0.4) click("CharSelect/Box/BtnEnter")
-- (6초 뒤 별도 스크립트) click("RoomWin/Box/Home/Solo")

-- ===== I-1 준비 (server_instance_game:…): 저장 끄기 · 무적 · HP · 저주 레벨/칸 · 소금 갯벌 =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
p:GetComponent("script.PlayerSave").IsLoadSuccess=false
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+3600
p.PlayerComponent.MaxHp=999999 p.PlayerComponent.Hp=999999
local book=p:GetComponent("script.SkillBook")
book.Levels.resist_break=20 book.Levels.mark_weakness=20 book.Levels.frost_soul=5 book:RefreshDigest()
book:SetSlot(1,"resist_break") book:SetSlot(2,"mark_weakness") book:SetSlot(3,"frost_soul")
book:SetSlot(4,"raise_skeleton")   -- 안내 띠(「해골 전사를 스킬 칸에」)가 화면 위 표식을 가리지 않게 (ICON18과 같은 준비)
p:GetComponent("script.PlayerTravel"):Go("saltflat", Vector2(-2.5,-0.5))
-- 게 무리 옆으로: Go("saltflat", Vector2(-6.9,10.1))

-- ===== I-1 준비 (client): 선택 보상·웨이포인트 창 닫기(ButtonClickEvent) · 줌 100 · 키보드 조준 =====
-- 첫 두 시도는 MouseMode=true(커서 조준 · 범위 원 dist=6.00)라 「저주할 적이 범위 안에 없습니다」 → 마나·쿨다운 보존. ICON18과 같이 키보드 모드로:
local me=_UserService.LocalPlayer
me:GetComponent("script.ClickControl"):SetMouseMode(false)
-- 가장 가까운 stormcrab을 클라이언트 PlayerAttack.SelectedTarget으로 (ClickControl:SelectAttackTarget은 서버 값만 바꿔 클라 조준이 못 봄 — ICON18 주석)
-- → GetAimPoint("resist_break") = (-6.659, 10.717) = 게 자리
-- 검증: maker_keyboard_input A(저항 붕괴) · S(약화의 낙인) · D(서리 혼 → 둔화) 탭 120ms = 땅 찍기(누르면 범위 원 dist=0.57 → 떼면 시전)

-- ===== I-1 검증 (client): 몬스터 자식 표식 엔티티의 SpriteRUID·위치·배율 =====
local s="" local n=0
for _,c in ipairs(me.CurrentMap.Children) do if isvalid(c) and (c.Name=="stormcrab" or c.Name=="stormgulls") then
  local parts="" local k=0
  for _,x in ipairs(c.Children) do if isvalid(x) and string.sub(x.Name,1,6)=="Curse_" and x.SpriteRendererComponent~=nil then
    k=k+1 local wp=x.TransformComponent.WorldPosition
    parts=parts..string.sub(x.Name,7).."="..string.sub(x.SpriteRendererComponent.SpriteRUID,1,8).."@"..string.format("%.2f,%.2f",wp.x,wp.y).." sc="..string.format("%.2f",x.TransformComponent.Scale.x).."; " end end
  if k>0 then n=n+1 s=s..c.Name.."#"..string.sub(c.Id,1,6).." child="..k.." ["..parts.."] || " end end end
log("[VRF] ARTI markers n="..n.." :: "..s)
-- (MonsterStatus.CurseMarkers를 pairs로 도는 첫 판은 게임이 표를 고치는 중이라 「invalid key to 'next'」 — 자식 엔티티를 직접 읽는 위 판으로 바꿈)

-- ===== I-2 준비 (server): 같은 카메라 점으로 Go =====
p:GetComponent("script.PlayerTravel"):Go("crabcave1", Vector2(-14.8,-8.8))   -- 폭풍의 눈은 Go("stormeye", Vector2(-12.0,2.4))
-- ===== I-2 촬영 (client): 줌 80 · 바닥 섞기 조각 세기 · HUD 끔 ~12초 → 켬 ~9초 · 0.3초마다 이 맵 몬스터 Enable=false(이 클라이언트만, 촬영 가림 방지) =====
_CameraService:ZoomTo(80,0)
local map=me.CurrentMap
local nz,fy,fx=0,0,0 local rset={}
for _,c in ipairs(map.Children) do if isvalid(c) and string.sub(c.Name,1,7)=="ArtZone" and string.find(c.Name,"_") and c.SpriteRendererComponent~=nil then
  local sr=c.SpriteRendererComponent nz=nz+1 if sr.FlipY then fy=fy+1 end if sr.FlipX then fx=fx+1 end
  local r=string.sub(sr.SpriteRUID,1,8) rset[r]=(rset[r] or 0)+1 end end
local rs="" for k,v in pairs(rset) do rs=rs..k.."="..v.." " end
log("[VRF] ARTI floor "..map.Name.." mixPieces="..nz.." FlipY="..fy.." FlipX="..fx.." ruids: "..rs)
local huds={"GameHUD","NavigationHUD","CompanionHUD","ChatHUD","InteractionHUD","AimHUD","ShadowHUD","RewardHUD","JournalHUD","CoopHUD"}
local function hud(on) for _,nm in ipairs(huds) do local e=_EntityService:GetEntityByPath("/ui/"..nm) if e~=nil then e.Enable=on end end log("[VRF] ARTI hud "..tostring(on)) end
local function hide() for _,c in ipairs(map.Children) do if isvalid(c) and c:GetComponent("script.MonsterStatus")~=nil and c.Enable then c.Enable=false end end end
hide() hud(false)
for i=1,40 do hide() wait(0.3) end
hud(true)
for i=1,30 do hide() wait(0.3) end
