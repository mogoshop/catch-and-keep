-- M18 재개(18:20~18:42)에서 메이커 maker_execute_script로 실행한 스크립트 모음 (재현용). 게임 소스는 고치지 않음.
-- 실행 컨텍스트: client / server_main / server_instance_game:s1b8686bc8fd(iPad) · server_instance_game:s1b86c4acac1(PC 보완)

-- ===================== i04_1_edit =====================
-- I04-1 (client): 스킬 창 「스킬 편집」 → 편집 중 큰 공격 단추 누름(손가락 down/up 순서로 MobilePad 처리 함수) → 스킬 지정 창에서 5번(공격 버튼)=뼈 창, 1번=해골 전사 → 닫기 → 「편집 끝」
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] M18 click "..p) return true end log("[VRF] M18 click MISSING/disabled "..p) return false end
local R=_MobilePad.Root
local function screenOf(path)
  local t=_UIKit:Get(path).UITransformComponent
  local l0=_UILogic:ScreenToLocalUIPosition(Vector2(0,0),t)
  local l1=_UILogic:ScreenToLocalUIPosition(Vector2(100,0),t)
  local l2=_UILogic:ScreenToLocalUIPosition(Vector2(0,100),t)
  local ax=(l1.x-l0.x)/100 local ay=(l1.y-l0.y)/100 local bx=(l2.x-l0.x)/100 local by=(l2.y-l0.y)/100
  local det=ax*by-bx*ay
  return Vector2((-l0.x*by+bx*l0.y)/det, (-ax*l0.y+ay*l0.x)/det)
end
local book=_UserService.LocalPlayer:GetComponent("script.SkillBook")
local function st(tag) local b=_UIKit:Get(R.."/BasicAtk") log(string.format("[VRF] M18 I04-1 %s edit=%s right=%s slots=%s BasicAtk.Enable=%s Attack/Label=%s anyWin=%s", tag, tostring(_MobilePad.EditMode), book.RightSkill, book.Slots, tostring(isvalid(b) and b.Enable), _UIKit:Get(R.."/Attack/Label").TextGUIRendererComponent.Text, tostring(_UIKit:AnyWindowOpen()))) end
st("before")
click("BtnMenu") wait(0.5) click("MenuWin/Skill") wait(0.8)
click("SkillWin/BtnEdit") wait(0.8)
st("edit-start")
local ap=screenOf(R.."/Attack")
log(string.format("[VRF] M18 I04-1 attack finger point=(%.1f,%.1f) local=%s", ap.x, ap.y, tostring(_UILogic:ScreenToLocalUIPosition(ap,_UIKit:Get(R.."/Attack").UITransformComponent))))
_MobilePad:BeginGesture(5, 21, ap) wait(0.1) _MobilePad:EndGesture(21, ap) wait(0.6)
log("[VRF] M18 I04-1 picker open="..tostring(_UIKit:IsOpen("SkillPick")).." slot="..tostring(_SkillPicker.Slot))
local idx=0 for i=1,18 do if _SkillPicker.Picks[i]=="bone_spear" then idx=i end end
click("SkillPick/Grid/Pick"..idx) wait(0.8)
st("after-pick slot5=bone_spear")
click("SkillPick/Tab1") wait(0.5)
local idx2=0 for i=1,18 do if _SkillPicker.Picks[i]=="raise_skeleton" then idx2=i end end
click("SkillPick/Grid/Pick"..idx2) wait(0.8)
click("SkillPick/BtnClose") wait(0.5)
st("picker-closed (편집 중)")
click(R.."/BtnSkillEdit") wait(0.8)
st("edit-end")

-- ===================== i04_rect =====================
-- I04 터치 대상 크기·간격 (client): 런타임 UITransform 값으로 패드 안 사각형(1920 기준 UI 단위, 왼쪽 아래 원점)을 계산하고, 화면 좌표(ScreenToLocalUIPosition 역산) 중심도 함께 남긴다
local R=_MobilePad.Root
local pad=_UIKit:Get(R) local pt=pad.UITransformComponent local ps=pt.RectSize
local function rectIn(e)
  local t=e.UITransformComponent
  local par=e.Parent
  local px,py,pw,ph
  if par==pad then px,py,pw,ph=0,0,ps.x,ps.y else local cx,cy,w,h=rectIn(par) px,py,pw,ph=cx-w/2,cy-h/2,w,h end
  local a0,a1=t.AnchorsMin,t.AnchorsMax
  local w,h=t.RectSize.x,t.RectSize.y
  local ax=px+pw*(a0.x+a1.x)/2 local ay=py+ph*(a0.y+a1.y)/2
  return ax+t.anchoredPosition.x+(0.5-t.Pivot.x)*w, ay+t.anchoredPosition.y+(0.5-t.Pivot.y)*h, w, h
end
local function screenOf(path)
  local t=_UIKit:Get(path).UITransformComponent
  local l0=_UILogic:ScreenToLocalUIPosition(Vector2(0,0),t)
  local l1=_UILogic:ScreenToLocalUIPosition(Vector2(100,0),t)
  local l2=_UILogic:ScreenToLocalUIPosition(Vector2(0,100),t)
  local ax=(l1.x-l0.x)/100 local ay=(l1.y-l0.y)/100 local bx=(l2.x-l0.x)/100 local by=(l2.y-l0.y)/100
  local det=ax*by-bx*ay
  return Vector2((-l0.x*by+bx*l0.y)/det, (-ax*l0.y+ay*l0.x)/det), ax
end
log(string.format("[VRF] M18 RECT pad=%s size=%.0fx%.0f scale=%s screen=%dx%d", R, ps.x, ps.y, tostring(pt.UIScale), _UILogic.ScreenWidth, _UILogic.ScreenHeight))
local names={"Attack","BasicAtk","Skills/S1","Skills/S2","Skills/S3","Skills/S4","Dash","AimCancel","Extract","BtnSkillEdit","Shadow/Toggle"}
local R2={}
for _,n in ipairs(names) do
  local e=_UIKit:Get(R.."/"..n)
  if isvalid(e) then
    local cx,cy,w,h=rectIn(e) R2[n]={cx,cy,w,h}
    local sc,k=screenOf(R.."/"..n)
    local t=e.UITransformComponent
    log(string.format("[VRF] M18 RECT %s enable=%s anchors=(%.2f,%.2f) pivot=(%.2f,%.2f) pos=(%.1f,%.1f) size=%.0fx%.0f uiScale=%s → padRect x=%.1f~%.1f y=%.1f~%.1f center=(%.1f,%.1f) | screenCenter=(%.1f,%.1f) localPerScreenPx=%.3f min88=%s", n, tostring(e.Enable), t.AnchorsMin.x,t.AnchorsMin.y,t.Pivot.x,t.Pivot.y,t.anchoredPosition.x,t.anchoredPosition.y,w,h,tostring(t.UIScale), cx-w/2,cx+w/2,cy-h/2,cy+h/2,cx,cy, sc.x,sc.y,k, tostring(math.min(w,h)>=88)))
  end
end
local function gap(a,b)
  local A,B=R2[a],R2[b] if A==nil or B==nil then return end
  local dx=math.abs(A[1]-B[1])-(A[3]+B[3])/2 local dy=math.abs(A[2]-B[2])-(A[4]+B[4])/2
  local edge = (dx>0 and dy>0) and math.sqrt(dx*dx+dy*dy) or math.max(dx,dy)
  local cdist=math.sqrt((A[1]-B[1])^2+(A[2]-B[2])^2)
  log(string.format("[VRF] M18 GAP %s↔%s dx=%.1f dy=%.1f edgeGap=%.1f centerDist=%.1f (1920 기준 UI 단위, 음수=겹침)", a,b,dx,dy,edge,cdist))
end
gap("BasicAtk","Attack") gap("BasicAtk","Skills/S4") gap("BasicAtk","Skills/S3") gap("BasicAtk","Skills/S2") gap("BasicAtk","Skills/S1") gap("BasicAtk","Dash") gap("BasicAtk","BtnSkillEdit") gap("BasicAtk","Shadow/Toggle")
gap("Attack","Skills/S4") gap("Attack","Skills/S1") gap("AimCancel","Skills/S1") gap("AimCancel","Dash")

-- ===================== i04_2_client =====================
-- I04-2 (client): 손가락 11이 작은 기본 공격 단추(BasicAtk, 제스처 칸 6)를 누른 채 26초 유지 — MobilePad.BeginGesture → (0.1초마다 UpdateGesture = ScreenTouchHoldEvent와 같은 처리) → EndGesture
local pad=_MobilePad local R=pad.Root
local function screenOf(path)
  local t=_UIKit:Get(path).UITransformComponent
  local l0=_UILogic:ScreenToLocalUIPosition(Vector2(0,0),t)
  local l1=_UILogic:ScreenToLocalUIPosition(Vector2(100,0),t)
  local l2=_UILogic:ScreenToLocalUIPosition(Vector2(0,100),t)
  local ax=(l1.x-l0.x)/100 local ay=(l1.y-l0.y)/100 local bx=(l2.x-l0.x)/100 local by=(l2.y-l0.y)/100
  local det=ax*by-bx*ay
  return Vector2((-l0.x*by+bx*l0.y)/det, (-ax*l0.y+ay*l0.x)/det)
end
local p=_UserService.LocalPlayer
local book=p:GetComponent("script.SkillBook") local st=p:GetComponent("script.PlayerStats")
local bp=screenOf(R.."/BasicAtk")
local t0=_UtilLogic.ElapsedSeconds
local function status(tag) log(string.format("[VRF] M18 I04-2 %s t=%.1f touch=%d slot=%d holding=%s basic=%s pick=%s bigLabel=%s basicAtk.Enable=%s right=%s cd(bone_spear)=%.2f mana=%.1f cancelShown=%s", tag, _UtilLogic.ElapsedSeconds-t0, pad.GestureTouchId, pad.GestureSlot, tostring(pad.Holding), tostring(pad.GestureBasic), tostring(pad.PickMode), _UIKit:Get(R.."/Attack/Label").TextGUIRendererComponent.Text, tostring(_UIKit:Get(R.."/BasicAtk").Enable), book.RightSkill, book:CooldownLeft("bone_spear"), st.Mana, tostring(pad.CancelShown))) end
log(string.format("[VRF] M18 I04-2 finger point=(%.1f,%.1f) local=%s anyWin=%s", bp.x, bp.y, tostring(_UILogic:ScreenToLocalUIPosition(bp,_UIKit:Get(R.."/BasicAtk").UITransformComponent)), tostring(_UIKit:AnyWindowOpen())))
status("pre")
pad:BeginGesture(6, 11, bp)
status("down")
local lastPick=pad.PickMode local nextLog=2
for i=1,260 do
  wait(0.1)
  pad:UpdateGesture(11, bp)
  if pad.PickMode ~= lastPick then lastPick=pad.PickMode status("PICK-SWITCH") end
  if _UtilLogic.ElapsedSeconds-t0 >= nextLog then nextLog=nextLog+2 status("hold") end
  if pad.GestureTouchId ~= 11 then status("GESTURE-LOST") break end
end
pad:EndGesture(11, bp)
status("up")
wait(1.5)
status("after-up")

-- ===================== i04_2_server =====================
-- I04-2 (server): 기본 공격 요청 수(AimRequestCount)·확정 휘두르기(StrikeCount)·5번 스킬 재사용/마나를 2초마다 기록. t=4 근처 전리품(일반 짚신) 생성 + 3.5칸 안 살아 있는 몬스터 잠깐 숨김(준비) → t=11 적 재등장(숨긴 몬스터 다시 보이기 + 2마리 생성) → t=28 끝
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local atk=p:GetComponent("script.PlayerAttack") local book=p:GetComponent("script.SkillBook") local st=p:GetComponent("script.PlayerStats")
local uid=p.PlayerComponent.UserId
atk.DebugCombat=true
local t0=_UtilLogic.ElapsedSeconds
local function near(r) local n=0 local me=_Util:Pos2(p) for _,c in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do if isvalid(c.Entity) and c.Entity.Enable and not c.IsDead and (_Util:Pos2(c.Entity)-me):Magnitude()<=r then n=n+1 end end return n end
local function loot(r) local n=0 local me=_Util:Pos2(p) for _,d in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.LootDrop", false)) do if d.Kind=="item" and not d.Taken and (_Util:Pos2(d.Entity)-me):Magnitude()<=r then n=n+1 end end return n end
local function s(tag) log(string.format("[VRF] M18 I04-2S %s t=%.1f aimReq=%d strikes=%d epoch=%d phase=%s mana=%.1f cd(bone_spear)=%.2f right=%s mon3=%d loot1.5=%d hp=%d", tag, _UtilLogic.ElapsedSeconds-t0, atk.AimRequestCount, atk.StrikeCount, atk.AttackEpoch, atk.AttackPhase, st.Mana, book:CooldownLeft("bone_spear"), book.RightSkill, near(3), loot(1.5), p.PlayerComponent.Hp)) end
s("start")
for i=1,2 do wait(2) s("tick") end
local hidden={}
local me=_Util:Pos2(p)
for _,c in ipairs(p.CurrentMap:GetChildComponentsByTypeName("script.Monster", true)) do if isvalid(c.Entity) and c.Entity.Enable and not c.IsDead and (_Util:Pos2(c.Entity)-me):Magnitude()<=3.5 then c.Entity.Enable=false table.insert(hidden,c.Entity) end end
_LootSystem:Spawn(me, uid, "item", "boots1|0|1|짚신||0|", 1, 0)
s("LOOT spawned item=boots1 rarity=0 hiddenMonsters="..tostring(#hidden))
for i=1,3 do wait(2) s("tick") end
wait(1)
for _,e in ipairs(hidden) do if isvalid(e) then e.Enable=true end end
local map=p.CurrentMap me=_Util:Pos2(p) local made=0
for i=1,2 do local e=_SpawnService:SpawnByModelId("fallenimp","fallenimp",Vector3(me.x+(i==1 and 2.2 or -2.2),me.y+0.4,0),map) if isvalid(e) then made=made+1 end end
s("ENEMY RETURN unhidden="..tostring(#hidden).." spawned="..tostring(made))
for i=1,8 do wait(2) s("tick") end
s("end")
atk.DebugCombat=false

-- ===================== rest =====================
-- ===== 준비(server_main, 로비): 슬롯4 저장값 PRE 조회 (18:22:07) =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local sv=p:GetComponent("script.PlayerSave")
local code,pages=sv:Storage():BatchGetAndWait({"Account","Char_4","Inv_4","Shadow_4"})
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do log("[VRF] M18 PRE "..ds[i].KeyInfo.Key.." "..ds[i].Value) end end

-- ===== 입장(client): 캐릭터 선택 S4 → 입장 → 혼자 (ButtonClickEvent) =====
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] M18 click "..p) end end
click("CharSelect/Box/S4") wait(0.4) click("CharSelect/Box/BtnEnter") wait(4) click("RoomWin/Box/Home/Solo")

-- ===== 준비(server_instance_game): 저장 끄기 =====
p:GetComponent("script.PlayerSave").IsLoadSuccess=false
-- 황무지 이동 (PlayerTravel:Go) · 무리 옆으로 다시 이동
p:GetComponent("script.PlayerTravel"):Go("wasteland", Vector2(5.97,1.61))
-- 사망 방지(두 번 죽은 뒤): 무적 시간
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+3600

-- ===== I04-3 (client) 끌기 「취소」 · (server) 전후 마나/재사용/언데드 =====
-- client: BeginGesture(1,12,S1 중심) → UpdateGesture(12, S1→AimCancel 8단계) → 그 위 30회 UpdateGesture → EndGesture(12, AimCancel 중심)
--         대조: BeginGesture(1,13,S1) → UpdateGesture(13, S1+(-140,90) 5단계) → EndGesture(13, 그 점)
--         (화면 좌표는 ScreenToLocalUIPosition을 거꾸로 풀어 지역 좌표 (0,0)이 되는 점 — IsOverCancel과 같은 함수)
-- server post: log(mana, CooldownLeft("raise_skeleton"), #_UndeadSystem:ListOf(p), Slots, RightSkill)

-- ===== UI-6 (client, iPad) / UI-2 F06-C 보완 (client, PC) =====
click("BtnJournal") wait(1.0)
local jw=_JournalWindow local row=0
for i=1,jw.Rows do local a=jw.RowAct[i] if a~=nil and a.kind=="claim" and a.key=="a_queen@2" then row=i end end
if row>0 then click("JournalWin/List/R"..row.."/BtnAct") end
for k=1,12 do wait(0.5) log(string.format("feed t=%.1f lines=%d newestH=%.1f", k*0.5, #_NoticeFeed.Lines, _NoticeFeed:NewestLineHeight())) end

-- ===== F09-M 준비(server): Lv45까지 (호령 해금 Lv45) =====
local st=p:GetComponent("script.PlayerStats") local g=0
while st.Level<45 and g<10 do st:GainExp(st.ExpToNext-st.Exp) g=g+1 end
-- F09-M (client): BtnMenu → MenuWin/Skill → _SkillWindow:SlotPathOf("command_aura") (NextPage 두 번) → 칸 클릭 → SkillWin/BtnLearn → WS/Stat·BtnLearn 글자 기록

-- ===== 끝(server): 슬롯4 저장값 POST 재조회 (PRE와 비교) =====
