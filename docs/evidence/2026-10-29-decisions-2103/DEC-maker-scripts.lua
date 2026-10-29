-- DEC-20261029-2203 — 메이커 maker_execute_script로 실행한 스크립트 모음 (재현용). 게임 소스는 고치지 않음.
-- 컨텍스트: server_main · client · server_instance_game:s1b89cc56009(iPad 22:06) · server_instance_game:s1b89e4defec(PC 22:13)
-- 「준비」 = 상태를 만드는 서버/클라이언트 조작(검증 아님) · 「검증」 = 실제 단추 ButtonClickEvent·처리 함수 호출과 그 결과 로그

-- ===== 슬롯 4 저장값 조회 (server_main 로비 / 방 서버, 읽기만) =====
local p for _,u in ipairs(_UserService.UserEntities.Values) do p=u end
local sv=p:GetComponent("script.PlayerSave")
local code,pages=sv:Storage():BatchGetAndWait({"Account","Char_4","Inv_4","Shadow_4","Stash"})
local out=""
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value local s=0 for k=1,#v do s=s+string.byte(v,k)*((k%7)+1) end out=out..ds[i].KeyInfo.Key.." len="..#v.." sum="..s.."; " end end
log("[VRF] DEC2103 slot4 PRE (lobby) code="..tostring(code).." "..out)
-- (22:13:52 방 서버 · 22:21:40 로비에서는 값 원문을 그대로 log — 「DEC2103 DUMP/FINAL」)

-- ===== 입장 (client): 캐릭터 선택 S4 → 입장 → (4~5초 뒤 별도 스크립트) 혼자 =====
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] DEC2103 click "..p) else log("[VRF] DEC2103 click MISSING "..p) end end
click("CharSelect/Box/S4") wait(0.4) click("CharSelect/Box/BtnEnter")
-- 다음 스크립트: RoomWin/Box/Home/Solo ButtonClickEvent

-- ===== 준비 (server_instance_game): 저장 끄기 · 무적 시간 =====
local sv=p:GetComponent("script.PlayerSave") sv.IsLoadSuccess=false
p:GetComponent("script.PlayerVitals").InvincibleUntil=_UtilLogic.ElapsedSeconds+3600

-- ===================== I04 (iPad 프리셋) =====================
-- 준비 (server): 1~4칸에 배운 액티브, 5번 칸(큰 단추)=뼈 창 → 고급 배치(작은 기본 공격 단추 BasicAtk 표시)
local book=p:GetComponent("script.SkillBook")
local cands={"raise_skeleton","raise_mage","bone_rite","bone_shard","bone_prison","terror","plague_curse","mark_weakness","enfeeble","bone_armor","poison_spread"}
local s=1
for _,id in ipairs(cands) do if s<=4 and book:IsSlottable(id) then book:SetSlot(s,id) s=s+1 end end
book:SetSlot(5,"bone_spear")
-- 검증 (client): 입장 때 저절로 뜬 선택 보상 창 닫기(OfferWin/BtnClose ButtonClickEvent) → 패드 상태 로그
-- 측정 (client): 런타임 UITransform으로 패드 안 사각형(1920 기준 UI 단위) · 간격
--   rectIn(e) = 부모 사각형 + 앵커 가운데 + anchoredPosition + (0.5-Pivot)*크기 (M18-maker-scripts.lua i04_rect와 같은 식)
--   gap(a,b): dx=|중심x차|-(w합/2), dy=|중심y차|-(h합/2), rectEdgeGap = (dx>0 and dy>0) and √(dx²+dy²) or max(dx,dy), roundGap = 중심거리 - (wA+wB)/2
--   대상: BasicAtk↔Attack · BasicAtk↔S4 · S3↔S4 · S2↔S3 (+ 주변 BasicAtk↔S3 · Attack↔S4 · Attack↔S1 · Dash↔S1 · AimCancel↔S1 · AimCancel↔Dash · BasicAtk↔BtnSkillEdit)
-- 검증 (client): 끌기 「취소」 표시 — MobilePad 처리 함수(손가락 down/hold/up 순서, 본문 그대로)
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
local s1=screenOf(R.."/Skills/S1") local c=screenOf(R.."/AimCancel")
pad:BeginGesture(1, 12, s1)
for i=1,8 do wait(0.1) pad:UpdateGesture(12, s1+(c-s1)*(i/8)) end
-- 「취소」 위 유지 중 촬영 (maker_screenshot + screencapture -l <MapleStory Worlds 창>)
for i=1,250 do wait(0.1) pad:UpdateGesture(12, c) if pad.GestureTouchId~=12 then break end end
pad:EndGesture(12, c)   -- → [VRF] mobile aim cancel slot=1 (MobilePad.EndGesture)

-- ===================== 53·54 (PC FHD) =====================
-- 준비 (server): 망령 질주 3 → 0 (뼈 갑옷은 원래 0) · 스킬 포인트 1
local st=p:GetComponent("script.PlayerStats")
book.Levels.wraith_dash=nil st.SkillPoints=1 book:RefreshDigest()
-- 검증 (client): OfferWin/BtnClose → BtnMenu → MenuWin/Skill → 시간선 칸(_SkillWindow:SlotPathOf("swift_step")) → 공방 노드 칸 SkillWin/WS/N<잔걸음>
--   → SkillWin/WS/Name·Stat·Desc 글 로그 → 촬영 ; 같은 길로 SlotPathOf("wraith_dash") → WS/N<뼈 껍질> → 로그 → 촬영
-- 혼의 제물 카드 (client): SkillWin/BtnClose →
--   준비: 선택 보상 대기 1칸이 있어 띠(OfferBand)를 누르면 선택 보상 창이 먼저 열림 → SkillOffer.Open()의 혼의 제물 분기를 그대로 실행
local so=_SkillOffer
so.Mode="skill" so.OfferKey="" so.RenderKey="" _UIKit:Open(so.Win)
--   준비: 셋째 카드 주입 (가독성 RB 회차와 같은 방식) → 게임 Poll이 Render
so.Offer[3]="step_gale" so.RenderKey=""
--   → OfferWin/Card3/Name·Change 글 로그 → 촬영
-- 학습 알림 경로 (괄호 유지): 준비 (server) 망령 질주 0 → 3 복원 · RefreshDigest
book.Levels.wraith_dash=3 book:RefreshDigest()
--   검증 (client): OfferWin/BtnClose → book:RequestLearn("dash_ghost") (Server RPC → NotifyLearned) → _UXFeedback.Current.title/detail 로그

-- ===================== 바닥 시범 2맵 (PC FHD) =====================
-- 편집 모드: node tools/build/handmade/build.cjs crabcave1 stormeye --floormix-y=seam-only --out=map → 5초 → refresh 1회
-- 준비 (server): HP 999999 · 무적 시간 · PlayerTravel:Go(맵, 점) · 0.3초마다 그 맵 몬스터 Enable=false(촬영 가림 방지) 27초
p.PlayerComponent.MaxHp=999999 p.PlayerComponent.Hp=999999
p:GetComponent("script.PlayerTravel"):Go("crabcave1", Vector2(-14.8,-8.8))   -- 폭풍의 눈은 ("stormeye", Vector2(-12.0,2.4))
-- 확인 (client): 맵 루트 자식 중 ArtZone*·ArtFloor의 SpriteRenderer 수와 FlipY/FlipX 수 (시범 맵이 실제로 올라왔는지)
-- 촬영 (client): _CameraService:ZoomTo(80, 0) → HUD 그룹 10개(GameHUD·NavigationHUD·CompanionHUD·ChatHUD·InteractionHUD·AimHUD·ShadowHUD·RewardHUD·JournalHUD·CoopHUD) Enable=false → 촬영 → 다시 true → 촬영
-- 원복: 멈춤 → git checkout -- map/crabcave1.map map/stormeye.map → touch → refresh 1회 → git status map/ 깨끗함
