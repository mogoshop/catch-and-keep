-- 진단만 (client · 맵에 다시 들어오면 원래대로): 윗부분 반투명(DarkVision.TopFades · 알파 0.35)을 끄고 가림을 그대로 보기
_DarkVision.TopFades={}
local map=_UserService.LocalPlayer.CurrentMap
for _,n in ipairs({'ArtProp2Top','ArtProp4Top'}) do local e=map:GetChildByName(n,true) if e then local c=e.SpriteRendererComponent.Color e.SpriteRendererComponent.Color=Color(c.r,c.g,c.b,1) end end
-- 맵의 윗부분 엔티티 목록(DMTOP): 이름에 Top이 든 자식의 위치·배율·층·알파·RUID 앞 8자리
