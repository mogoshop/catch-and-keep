-- 5차 「옛날 메이플」 재현 — 서버(server_main · 로비 정적 방) 준비 스크립트
-- 전제: 메이커에서 임시 MapleTile 맵 oldsnail에 메이플 공식 맵 Snail Park(000020000)를 불러와 둠(녹화 뒤 삭제).
-- 플레이어는 oldsnail에 있음(정적 방 시작 맵 = 메이커에서 연 맵). 저장 끔: PlayerSave.IsLoadSuccess=false
local map=_EntityService:GetEntityByPath("/maps/oldsnail")
-- 초보자 아바타 NPC (런타임 엔티티)
local e=_SpawnService:SpawnByModelId("mapempty","RecBeginner",Vector3(-2.7,-2.749,0),map)
e:AddComponent("AvatarRendererComponent")
local c=e:AddComponent("CostumeManagerComponent")
c.UseCustomEquipOnly=true
c.CustomCoatEquip="ae8d3590a96e48c3b7cd75d46ebd3f15"            -- 하얀 반팔 면티
c.CustomPantsEquip="e6ff0ea602e043f48a7e231ed4f95daf"           -- 블루 스키니진
c.CustomShoesEquip="202544d7095c42c5bfb3046619ab58cc"           -- 가죽 샌들
c.CustomHairEquip="29246028db7642baba92689a1ef777bb"            -- 검은색 토벤 머리
c.CustomFaceEquip="340ae5b8d37e4207afcfd32d5e9f7088"            -- 남자얼굴4
c.CustomOneHandedWeaponEquip="ce073997978f4248b03c628dad9bbe11" -- 몽둥이
-- 하늘(기본 스프라이트를 하늘색으로 크게 · 기본 크기 약 0.22칸) + 구름 2장, 정렬 MapLayer0 / -1·-2
local function put(name,ruid,x,y,sx,sy,ord,col)
  local s=_SpawnService:SpawnByModelId("mapobject",name,Vector3(x,y,0),map)
  local r=s.SpriteRendererComponent r.SpriteRUID=ruid r.SortingLayer="MapLayer0" r.OrderInLayer=ord if col then r.Color=col end
  s.TransformComponent.Scale=Vector3(sx,sy,1)
end
put("RecSky","1705e3c5b2c146ac9a699f96fb067408",2,6,200,100,-2,Color(0.47,0.74,0.98,1))
put("RecCloud1","1ef8075bad4044439fe735327ef0a947",-3.2,0.3,0.6,0.6,-1)
put("RecCloud2","9258d7ad17a347f8a293696c051d052f",2.0,0.6,0.55,0.55,-1)
-- 달팽이: AI·이동·물리 끄고 자리 고정 (불러온 monster-1224* = 초록 달팽이)
_G.SN=function() local t={} for _,c in ipairs(map:GetChildComponentsByTypeName("AIWanderComponent",true)) do table.insert(t,c.Entity) end table.sort(t,function(a,b) return a.Name<b.Name end) return t end
_G.SNSET=function(i,x,y,ai) local s=_G.SN()[i] if not s then return end s.AIWanderComponent.Enable=ai
  pcall(function() s.MovementComponent:Stop() end) s.MovementComponent.Enable=ai s.RigidbodyComponent.Enable=ai
  s.TransformComponent.Position=Vector3(x,y,s.TransformComponent.Position.z) end
-- 5번 달팽이를 파란 달팽이(mob/0100101.img)로
local b=_G.SN()[5] b.StateAnimationComponent.ActionSheet["stand"]="0c69164656d24f64bd1a1f6ee4019dff" b.SpriteRendererComponent.SpriteRUID="0c69164656d24f64bd1a1f6ee4019dff"
-- 장면 (a): 초록(3) -1.3 · 파랑(5) -0.4 / 장면 (b): 초록(3) -2.2 · 파랑(5) -0.85 · 초록(4) -0.3
_G.SNSET(3,-1.3,-2.749,false) _G.SNSET(5,-0.4,-2.749,false)
-- 카메라 기준점: 플레이어를 -1.4로 (투명 처리는 클라이언트)
local p=nil for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
_TeleportService:TeleportToMapPosition(p, Vector3(-1.4,-2.6,0), "oldsnail")
