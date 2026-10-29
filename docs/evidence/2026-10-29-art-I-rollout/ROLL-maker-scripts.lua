-- I-2 확대 적용 메이커 최소 확인 — maker_execute_script로 실행한 스크립트 (재현용 · 게임 소스는 고치지 않음)
-- 이전 담당 ARTI-maker-scripts.lua의 세기·촬영 조각을 그대로 썼다. 「준비」 = 상태 만들기(검증 아님) · 「검증」 = 런타임 엔티티 값·캡처

-- ===== 1차 시도(실패 · 기록용): 로비 S4 → 입장(마우스 1368,236) → _RoomWindow:Solo() → 노말 방 game:s1b8b326f1d9 =====
-- server_instance_game:s1b8b326f1d9 — 저장 끔 · 무적 · Go("crabcave2_nm", Vector2(-4.5,-7.5))
--   → 이동 화면 8초 뒤 outpost로 되돌아옴. 확인: /maps/crabcave2_nm·lighthouse2_hell 없음 (방 맵 = GameRoomMaps(난이도 0)뿐 — 난이도는 방을 만들 때 정해짐, PlayerTravel 220행 주석)
--   같은 방에서 CreateInstanceRoom + MoveUserToInstanceRoom → res=nil (게임 방 → 게임 방 이동 안 됨)
--   Solo를 악몽/지옥으로 다시 하면 RoomSystem.Enter → PlayerSave:PrepareRoomMove가 저장(난이도 포함)을 해야 해 「저장 끔」과 맞지 않음 → 2차 방식

-- ===== 2차 (server_main · 새 play · 캐릭터 선택 전): 복제 맵 두 장만 담은 방을 열고 옮긴다 =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local uid=p.PlayerComponent.UserId
local sv=p:GetComponent("script.PlayerSave")
log("[VRF] ROLL lobby slot="..tostring(sv.Slot).." load="..tostring(sv.IsLoadSuccess).." map="..tostring(p.CurrentMap and p.CurrentMap.Name))
local ok,res=pcall(function()
  _RoomService:CreateInstanceRoom("game:vrfroll", {"crabcave2_nm","lighthouse2_hell"}, 60)
  return _RoomService:MoveUserToInstanceRoom("game:vrfroll", uid, "crabcave2_nm")
end)
log("[VRF] ROLL move nm/hell room ok="..tostring(ok).." res="..tostring(res))

-- ===== 준비 (server_instance_game:vrfroll): 카메라 점으로 Go (따개비 돌 바닥 칸 · 설계도에서 고름) =====
p:GetComponent("script.PlayerTravel"):Go("crabcave2_nm", Vector2(-4.5,-7.5))
-- 지옥 맵(Lv92)에서 캐릭터가 죽어 harbor로 돌아가려다 실패하는 반복 → 무적·HP·몬스터 끄기 뒤 다시 Go
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+3600
p.PlayerComponent.MaxHp=999999 p.PlayerComponent.Hp=999999
for _,c in ipairs(p.CurrentMap.Children) do if isvalid(c) and c:GetComponent("script.MonsterStatus")~=nil then c.Enable=false end end
p:GetComponent("script.PlayerTravel"):Go("lighthouse2_hell", Vector2(-6.5,-1.5))

-- ===== 검증 (client): 맵 루트 자식 ArtZone*_* SpriteRenderer 세기 · RUID 4종 분포 · FlipX/Y =====
local me=_UserService.LocalPlayer
_CameraService:ZoomTo(80,0)
local map=me.CurrentMap
local nz,fy,fx=0,0,0 local rset={}
for _,c in ipairs(map.Children) do if isvalid(c) and string.sub(c.Name,1,7)=="ArtZone" and string.find(c.Name,"_") and c.SpriteRendererComponent~=nil then
  local sr=c.SpriteRendererComponent nz=nz+1 if sr.FlipY then fy=fy+1 end if sr.FlipX then fx=fx+1 end
  local r=string.sub(sr.SpriteRUID,1,8) rset[r]=(rset[r] or 0)+1 end end
local rs="" for k,v in pairs(rset) do rs=rs..k.."="..v.." " end
local wp=me.TransformComponent.WorldPosition
log("[VRF] ROLL floor "..map.Name.." mixPieces="..nz.." FlipY="..fy.." FlipX="..fx.." ruids: "..rs..string.format(" me=(%.2f,%.2f)",wp.x,wp.y))

-- ===== 촬영 (client): 캐릭터 선택 창·HUD·이 맵 몬스터를 15초 동안 0.3초마다 끔 (이 클라이언트만) =====
local huds={"CharSelectHUD","GameHUD","NavigationHUD","CompanionHUD","ChatHUD","InteractionHUD","AimHUD","ShadowHUD","RewardHUD","JournalHUD","CoopHUD"}
local function hud(on) for _,nm in ipairs(huds) do local e=_EntityService:GetEntityByPath("/ui/"..nm) if e~=nil then e.Enable=on end end end
local function hide() for _,c in ipairs(map.Children) do if isvalid(c) and c:GetComponent("script.MonsterStatus")~=nil and c.Enable then c.Enable=false end end end
for i=1,50 do hide() hud(false) wait(0.3) end
log("[VRF] ROLL capture-hide end")
