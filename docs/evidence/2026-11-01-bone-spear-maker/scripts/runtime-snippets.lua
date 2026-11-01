-- 이번 회차에 보낸 나머지 런타임 스크립트 요지 (모두 「준비」 또는 「관찰」 · 게임 파일은 고치지 않음)

-- [server_instance_game:…] 관찰 6: 동쪽 같은 줄 1.8/3.0/4.2칸에 임프 3마리(준비) → 실제 S 키 골편 → Projectile.DebugLog로 「[Projectile] end … hits=N」
--   결과 17:56:50 hits=2 traveled=0.3 (노말 = 2마리 맞히고 멈춤)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local pp=p.TransformComponent.WorldPosition local map=p.CurrentMap
for i,dx in ipairs({1.8,3.0,4.2}) do local e=_SpawnService:SpawnByModelId('fallenimp','vrf_imp'..i,Vector3(pp.x+dx,pp.y,0),map) _Util:AfterSpawn(e,'script.Monster',function(c) c.RespawnDelay=-1 c:ApplyLevel(1,false) end) end
-- (관찰 루프는 shard-observer.lua와 같음)

-- [server_instance_game:…] 관찰 7(준비): ChoiceTiers '1,1,1' → '1,2,1'(악몽 단계) GetShardHits=3 · '1,3,1'(지옥 단계) GetShardHits=4 → 지옥 단계로 실제 S 키 → 투사체 MaxHits=4 · 3마리 맞히고 사거리 끝까지(멈추지 않음) → 끝에 '1,1,1'로 되돌림
local q=p:GetComponent('script.PlayerQuest') local book=p:GetComponent('script.SkillBook')
local old=q.ChoiceTiers q.ChoiceTiers='1,2,1' local h2=book:GetShardHits() q.ChoiceTiers='1,3,1' local h3=book:GetShardHits()
-- … 쏜 뒤 q.ChoiceTiers=old

-- [server_instance_game:…] 대체(해골 마법사 일으키기 — 혼 구슬·커서 조준이 메이커 도구로 안 돼서): UndeadSystem.MakeRecord('mage',3) 뒤 rec.school='bone' → SpawnUnit
local rec=_UndeadSystem:MakeRecord(p,'mage',3,nil) rec.school='bone' rec.element=_MageBolts:ElementOf('bone')
table.insert(_UndeadSystem:ListOf(p),rec) _UndeadSystem:SpawnUnit(p,rec,Vector2(pp.x-0.8,pp.y-0.6),nil,nil)
-- 결과 17:59:58 「[VRF] mage bolt school=bone element=magic rank=3 n=1 trait=2.00」 · 오류 0

-- [server_main] 대체(두건 툴팁 — 옛 장비를 가진 저장이 없어서): 옛 문자열 → ItemData.Parse → Serialize → DescribeDetailed
local it=_ItemData:Parse('helm4|3|30|창술사의 두건|def=50,ene=15,mana=40,sk_bone_spear=2,spellDmg=15|0|')
-- 결과 name=투척수의 두건 · sk_bone_shard=2 · 설명 「★ 고유 효과 · 골편 투척 레벨 +2」

-- [client] 대체(시간선 48×48 칸 실제 클릭이 안 닿아서): _UIKit:Get(_SkillWindow.Win..'/TL/C1/S2'):SendEvent(ButtonClickEvent())  -- 골편 투척 고르기
