-- GOAL-MAKER-20261030-INT · maker_execute_script로 실행한 조각 (재현용 · 게임 소스는 고치지 않음)
-- 컨텍스트: server_main(캐릭터 선택 화면) · client · server_instance_game:<방>
-- 공통 client 도우미
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] GM click "..p) return true end log("[VRF] GM click MISSING "..p) return false end
local function txt(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then return e.TextGUIRendererComponent.Text end return "(off)" end

-- ===== 백업 + 해시 (server_main) =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local sv=p:GetComponent("script.PlayerSave")
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local code,pages=sv:Storage():BatchGetAndWait({"Account","Char_4","Inv_4","Shadow_4","Stash"})
-- 각 값 log("[VRF] INT slot4 backup <key> len=<n> <value>") + hash 줄

-- ===== 입장 (client) =====
click("CharSelect/Box/S4") wait(0.5) click("CharSelect/Box/BtnEnter") wait(4) _RoomWindow:Solo()

-- ===== ITEM-Q1 준비 (server instance) =====
sv.IsLoadSuccess=false
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+36000
local q=p:GetComponent("script.PlayerQuest") q.Index=1 q.State=2 q.Progress=1 q.Goal=0 q.GearOffers={} q.GearOffer=""
p:GetComponent("script.PlayerInventory"):AddItem("boots1|0|1|짚신||0|")    -- 가방 60/60
p:GetComponent("script.PlayerTravel"):Go("town", Vector2(3.5,4.3))          -- 오렌(3.5,5.5) 아래
-- K Space (실제 키) → client: NpcWin/Btn4 ButtonClickEvent 반복(다음 ▶ … 보상 받기)
local nw=_NpcWindow local n=0
while n<20 and nw.PendingIndex==0 and _UIKit:IsOpen(nw.Win) and not _UIKit:IsOpen("GearPickWin") do _UIKit:Get(nw.Win.."/Btn4"):SendEvent(ButtonClickEvent()) n=n+1 wait(0.3) end
-- 한 칸 비우기: K I → click("InvWin/Bag/Bag60") click("InvWin/BtnSell") click("/ui/ConfirmHUD/SafeArea/Dim/Box/BtnYes") click("InvWin/BtnClose")
-- 카드: click("GearPickWin/BtnClose") → (다시 보고) → click("GearPickWin/Pick2") → K Return → (받음) click("GearPickWin/Pick2") → click("InvWin/BtnEquip")

-- ===== D-M6 (client / server) =====
-- client: click("InvWin/BtnEquip")(해제) · _UserService.LocalPlayer:GetComponent("script.ClickControl"):SetMouseMode(false)
-- server: Go("cellar1", Vector2(-3,0)) · _SpawnService:SpawnByModelId("rotzombie","INT_dm6_a",Vector3(me.x+1.3,me.y,0),map) + ApplyLevel(5)
-- K Right 탭 · K Ctrl 1.5초 → (음성) · K I → Bag60 → BtnEquip → K Ctrl 1.2초 → (양성)

-- ===== ITEM-R1 (client) =====
-- server Go("town", Vector2(10.5,0.4)) · K Space(하르크) → click(nw.Win.."/Btn4") → click("InvWin/Bag/Bag60")
click("InvWin/BtnLock")                                    -- 다음 줄 ▶ → line 2
_UIKit:Get("InvWin/DescBox").ScrollLayoutGroupComponent:SetScrollNormalizedPosition(UITransformAxis.Vertical, 1)  -- 설명 칸 아래로(표시만)
click("InvWin/BtnMulti") click("/ui/ConfirmHUD/SafeArea/Dim/Box/BtnNo")   -- 취소
click("InvWin/BtnMulti") click("/ui/ConfirmHUD/SafeArea/Dim/Box/BtnYes")  -- 1차
click("InvWin/BtnSell")                                                    -- 기존 유지
click("InvWin/BtnMulti") click("/ui/ConfirmHUD/SafeArea/Dim/Box/BtnYes")  -- 2차(대기)

-- ===== ITEM-R2 =====
-- server Go("town", Vector2(2.5,-3.4)) · K Space(창고) → click("StashWin/Bag/B60")   -- 거부
local inv=_UserService.LocalPlayer:GetComponent("script.PlayerInventory") local s=inv:GetBagList()[60]
inv:RequestEquip(60, s) inv:RequestLockBag(60, s, true)                  -- 서버 RPC 직접 · 거부
-- server: sv.IsLoadSuccess=true sv:Save(true) wait(2) BatchGet Inv_4 → sv.IsLoadSuccess=false
-- 멈춤 → maker_set_platform mobile → 플레이 → 입장 → server 저장 끔 · RELOGIN 줄 · Go 하르크 곁
-- client(iPad): click(_NpcWindow.Prompt) click(nw.Win.."/Btn4") click("InvWin/Bag/Bag"..idx) click("InvWin/BtnEquip")(새 옵션 채택)
-- boots28 선택(출처 없음 안내) · 창고: click(_NpcWindow.Prompt) click("StashWin/Bag/B"..idx) click("StashWin/Stash/S"..si)

-- ===== RUNE-A1 =====
-- server: 짚신 4 TakeBagItem · AddItem(_ItemData:MakeRuneString("r_wen",40)) · AddItem(_ItemData:MakeRuneString("r_baen",40)) · AddItem("armor2|0|20|뼈 갑옷||2|")
--         판정 대조: Parse→runes={"r_wen","r_baen"}→Serialize→GetRuneword · 마법 rarity=1 mods={def=5}
-- client: click("BtnMenu") click("MenuWin/Rune") → RuneWin/BtnNext 반복으로 「망자의 행진」 쪽 → Bottom/Menu/BtnInv → Bag(갑옷) → BtnEquip → 다시 룬워드 창
