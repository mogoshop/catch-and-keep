-- GOAL-MAKER-20261030-B · maker_execute_script로 실행한 조각 모음 (재현용 · 게임 소스는 고치지 않음)
-- 컨텍스트: server_main · client · server_instance_game:s1b8c805bfe0(PC FHD, B-M01·B-M02) · server_instance_game:s1b8cb9cc8e4(iPad 프리셋, B-M01 재입장·B-M03)

-- ===== 백업 (server_main, 캐릭터 선택 화면) =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local sv=p:GetComponent("script.PlayerSave")
local code,pages=sv:Storage():BatchGetAndWait({"Account","Char_4","Inv_4","Shadow_4"})
log("[VRF] slot4 backup code="..tostring(code))
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do log("[VRF] slot4 backup "..ds[i].KeyInfo.Key.." "..ds[i].Value) end end

-- ===== 입장 (client) =====
-- PC: ButtonClickEvent CharSelect/Box/S4 → maker_mouse_input (1368,236) 「입장」 → _RoomWindow:Solo()
-- iPad: click("CharSelect/Box/S4") wait(0.4) click("CharSelect/Box/BtnEnter") wait(4) _RoomWindow:Solo()

-- ===== B-M01 (client) 편성 칸 조작 =====
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] GM click "..p) return true end log("[VRF] GM click MISSING/disabled "..p) return false end
local sw=_SkillWindow local book=_UserService.LocalPlayer:GetComponent("script.SkillBook")
-- (K 키는 maker_keyboard_input으로 실제 입력)
click(sw:SlotPathOf("raise_skeleton")) wait(0.8)
local idx=0 for i=1,8 do if sw.NodeIds[i]=="skel_shield" then idx=i end end
click("SkillWin/WS/N"..idx) wait(0.8)
click("SkillWin/WS/Form/Plus")   -- 자동 상태: 랭크 상한이라 Warn·저장 없음
click("SkillWin/WS/Form/Mode")   -- why=direct
click("SkillWin/WS/Form/Minus")  -- why=shield-1
click("SkillWin/WS/Form/Plus")   -- why=shield+1
-- 마법사: click(sw:SlotPathOf("raise_mage")) → WS/N(mage_hex) → WS/Form/Minus → why=hex-1

-- ===== B-M01 (server) GM 처치로 혼 만들기 =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local me=_Util:Pos2(p) local n=0
for _,c in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do if n<3 and isvalid(c.Entity) and c.Entity.Enable and not c.IsDead and (_Util:Pos2(c.Entity)-me):Magnitude()<=4 then c:TakeDamage(99999,p) n=n+1 end end

-- ===== B-M01 (client) 소환: 키 A는 PC 마우스 모드 조준(OS 커서)이라 혼을 못 겨눔 → 같은 서버 RPC를 혼 위치로 =====
local p=_UserService.LocalPlayer local book=p:GetComponent("script.SkillBook")
local orbs={} for _,o in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.SoulOrb", true)) do if isvalid(o.Entity) and o.Entity.Enable and (_Util:Pos2(o.Entity)-_Util:Pos2(p)):Magnitude()<4.5 then table.insert(orbs,_Util:Pos2(o.Entity)) end end
for i,t in ipairs(orbs) do if i>3 then break end log("[VRF] GM M01 raise#"..i.." preview next="..tostring(_UndeadSystem:RosterPreview(p,"skeleton").nextForm)) book:RequestCast("raise_skeleton", t) wait(2.5) end

-- ===== B-M01 (server→client) 시험 장비: 소환 계열 +3 부적 =====
-- server: inv:AddItem("amulet1|2|40|GM 시험 부적|treeCommand=3|0|")
-- client: inv:RequestEquip(60, s) / inv:RequestUnequip("amulet", s) ×2 (전후 RosterPreview.max·clipped·FormHope 기록)
-- server: inv:TakeBagItem(idx) (저장 전에 제거)

-- ===== B-M01 (server) 저장·확인 =====
sv:Save(true) wait(2)
local code,pages=sv:Storage():BatchGetAndWait({"Char_4"})  -- hope·slots·shardHold 칸 추출 로그

-- ===== B-M02 (server) =====
p:GetComponent("script.PlayerSave").IsLoadSuccess=false   -- 저장 끔
-- 해골 5기: 처치 → book:Cast("raise_skeleton", 혼) (서버 시전 경로 직접)
st.MaxDifficulty=1   -- 5기 거인 해금 조건(RiteGiantUnlocked) · 저장 꺼짐
-- 혼을 먼저 확보한 뒤:
local ok=book:CastRite(5, _Util:Pos2(p)+Vector2(1.5,0))
log("[VRF] GM M02b rite5 ok="..tostring(ok).." reserved="..tostring(_UndeadSystem:GiantReserved(p,"skeleton")).." line="..book:RosterLine("raise_skeleton"))
book:Cast("raise_skeleton", orbPos)   -- 거인 유지 중 직접 편성 소환

-- ===== B-M03 준비 (server, iPad) =====
p:GetComponent("script.PlayerSave").IsLoadSuccess=false
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+36000
book.Levels["bone_shard"]=5 book:RefreshDigest()
p:GetComponent("script.PlayerTravel"):Go("wasteland", Vector2(5.97,1.61))
-- client: book:RequestSetSlot(2,"bone_shard") · book:RequestSetSlot(5,"bone_spear") · 메뉴→스킬→골편→WS/Form/Mode(켜기)

-- ===== B-M03 장면 (client) =====
-- B-M03 (client, iPad 프리셋): MobilePad 손가락 처리 함수(BeginGesture/UpdateGesture/EndGesture)를 직접 불러 골편 칸 누름·끌기·놓기를 흉내 낸다. Poll(0.1초 타이머)의 ShardTick은 게임이 스스로 돈다
local pad=_MobilePad local R=pad.Root
local p=_UserService.LocalPlayer local book=p:GetComponent("script.SkillBook") local st=p:GetComponent("script.PlayerStats")
local function screenOf(path)
  local t=_UIKit:Get(path).UITransformComponent
  local l0=_UILogic:ScreenToLocalUIPosition(Vector2(0,0),t)
  local l1=_UILogic:ScreenToLocalUIPosition(Vector2(100,0),t)
  local l2=_UILogic:ScreenToLocalUIPosition(Vector2(0,100),t)
  local ax=(l1.x-l0.x)/100 local ay=(l1.y-l0.y)/100 local bx=(l2.x-l0.x)/100 local by=(l2.y-l0.y)/100
  local det=ax*by-bx*ay
  return Vector2((-l0.x*by+bx*l0.y)/det, (-ax*l0.y+ay*l0.x)/det)
end
local function click(path) local e=_UIKit:Get(path) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] GM M03 click "..path) end end
local function hold(touch, pt, sec) local t0=_UtilLogic.ElapsedSeconds while _UtilLogic.ElapsedSeconds-t0<sec do wait(0.1) pad:UpdateGesture(touch, pt) end end
local function s(tag) log(string.format("[VRF] GM M03 %s t=%.2f active=%s rep=%s sent=%d reason=%s touch=%d mana=%.1f cd=%.2f s2=%s hold=%s", tag, _UtilLogic.ElapsedSeconds, tostring(pad.ShardActive), tostring(pad.ShardRepeating), pad.ShardSent, pad.ShardStopReason, pad.GestureTouchId, st.Mana, book:CooldownLeft("bone_shard"), book:GetSlotSkill(2), tostring(book.ShardHold))) end
local p2=screenOf(R.."/Skills/S2") local pb=screenOf(R.."/BasicAtk")
-- ① 켬: 2초 누르고 떼기
s("A0 pre") pad:BeginGesture(2, 41, p2) s("A1 down") hold(41, p2, 2.0) s("A2 before-up") pad:EndGesture(41, p2) s("A3 up") wait(1.5) s("A4 after-up 1.5s")
wait(1.0)
-- ② 누른 채 기본 공격: 두 번째 손가락(작은 기본 공격 단추) · 작은 단추 처리 함수 · 공통 입구
pad:BeginGesture(2, 42, p2) hold(42, p2, 1.0) s("B1 holding")
pad:BeginGesture(6, 43, pb) s("B2 second finger BasicAtk down (owner 유지 기대)") pad:EndGesture(43, pb)
pad:BasicAttack() s("B3 BasicAttack() handler")
p:GetComponent("script.PlayerAttack"):SubmitBasicInput() s("B4 SubmitBasicInput()")
hold(42, p2, 0.6) pad:EndGesture(42, p2) s("B5 up") wait(1.0)
-- ③ 누른 채 메뉴 열기
pad:BeginGesture(2, 44, p2) hold(44, p2, 1.0) s("C1 holding") click("BtnMenu") wait(0.5) pad:UpdateGesture(44, p2) wait(0.3) s("C2 menu open="..tostring(_UIKit:AnyWindowOpen())) pad:EndGesture(44, p2) s("C3 up")
if _UIKit:IsOpen("MenuWin") then _UIKit:Close("MenuWin") end wait(1.0)
-- ④ 누른 채 「취소」 위로 끌기
pad:BeginGesture(2, 45, p2) hold(45, p2, 1.0) s("D1 holding")
local pc=screenOf(R.."/AimCancel") log(string.format("[VRF] GM M03 AimCancel screen=(%.0f,%.0f) shown=%s", pc.x, pc.y, tostring(pad.CancelShown)))
for i=1,8 do local q=Vector2(p2.x+(pc.x-p2.x)*i/8, p2.y+(pc.y-p2.y)*i/8) wait(0.1) pad:UpdateGesture(45, q) end
hold(45, pc, 0.5) s("D2 over cancel hover="..tostring(pad.CancelHover)) pad:EndGesture(45, pc) s("D3 up on cancel") wait(1.0)
-- ⑤ B-IN-02: 짧게 누른 사이 칸 스킬을 바꾸고 놓기
pad:BeginGesture(2, 46, p2) s("E1 down") book:RequestSetSlot(2, "raise_skeleton")
local w=0 while book:GetSlotSkill(2)=="bone_shard" and w<60 do wait(0.05) w=w+1 end
s("E2 slot changed") pad:EndGesture(46, p2) s("E3 up") wait(1.0)
book:RequestSetSlot(2, "bone_shard") local w2=0 while book:GetSlotSkill(2)~="bone_shard" and w2<60 do wait(0.05) w2=w2+1 end s("E4 slot restored")
-- ⑥ 설정 끔 → 누르고 떼기 (놓을 때 한 번)
book:RequestShardHold(false) local w3=0 while book.ShardHold and w3<60 do wait(0.05) w3=w3+1 end s("F0 toggle off")
pad:BeginGesture(2, 47, p2) hold(47, p2, 1.0) s("F1 holding (off)") pad:EndGesture(47, p2) s("F2 up") wait(1.5) s("F3 end")

-- ===== B-M03 (server) 기본 공격 회계 =====
local atk=p:GetComponent("script.PlayerAttack")
log(string.format("[VRF] GM M03S pre/post aimReq=%d strikes=%d mana=%.1f", atk.AimRequestCount, atk.StrikeCount, st.Mana))
