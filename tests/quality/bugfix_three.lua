-- 11-01 실플레이 문제 3건 A안 회귀 검사 (docs/evidence/2026-11-01-bugfix-three/VERIFY-PLAN.md) — 실제 mLua 본문으로:
--   ① 미니맵 남은 망자 안내 HudMap.RemainingFocus: GameConst MinimapRemainMax 3 · MinimapRemainRatio 0.2 · 살아 있는 수(Alive · 대기 묶음 제외) ≤ 3 이고
--      남은 수(Remaining · 대기 묶음 포함) ÷ 처음 총수(InitialTotal) ≤ 0.2 일 때만 · 퀘스트 목적지가 다른 맵이거나 목적지 점이 있으면 덮어쓰지 않음 ·
--      글귀 수 = 살아 있는 수 · [VRF] 판정 로그는 값이 바뀔 때만 · 반례: 예전 조건(남은 5 이하면 늘)이면 총 10에 5 남음도 안내했다
--   ② 스킬 창 머리 줄 「선택 보상」 3칸 SkillWindow.RenderChoices·RenderChoiceDetail·PickChoice + 실제 PlayerQuest(TierOfSlot·PickOf·ChoiceDef·ChoiceQuestTitle):
--      고름 = 축 아이콘·이름·단계·꼬리표 · 고를 차례 = 「고르기」(누르면 선택 보상 카드 창) · 의뢰 전 = 잠금 + 의뢰 제목 · 설명 자리 문장 · 배우기 단추 감춤 ·
--      스킬을 누르면 스킬 공방으로 · 정예 승격 상세에만 구분 문장 · 보상 카드·새 줄 꼬리표(생성기) · 동기화(@Sync ChoicePicks·ChoiceTiers)
--   ③ 랭킹 「내 순위」 RankingSystem.MineDigest·GetTop + RankWindow.OnData·MineText·ValueText: 첫 쪽 100줄 안 자리 · 밖이면 「100위 밖」 ·
--      기록 없으면 「기록 없음」 + 성장 기록 한 번 · 60초 캐시 대신 방금 읽은 첫 쪽 재사용(정렬 조회 1번) · 연타 5초 · [VRF] rank mine
-- 엔진 UI·DataStorage는 대역 — 실제 화면 배치·저장소 쪽 크기·동기화 지연은 메이커 확인(VERIFY-PLAN)
-- @source HudMap UI/Hud/HudMap.mlua RemainingFocus
-- @source PlayerQuest Quest/PlayerQuest.mlua TierOfSlot,PickOf,ChoiceTier,PendingChoice,ChoiceDef,ChoiceQuestTitle
-- @source SkillWindow UI/Windows/SkillWindow.mlua RenderChoices,RenderChoiceDetail,PickChoice,ChoiceTierName,TreeColor,TreeHex,Pick,Act
-- @source RankingSystem Endgame/RankingSystem.mlua ReadSorted,GetTop,MineDigest,ProgressText,RecordProgress
-- @source RankWindow UI/Windows/RankWindow.mlua OnData,ValueText,MineText
--@pre local VMT={} VMT.__index=VMT VMT.__sub=function(a,b) return Vector2(a.x-b.x,a.y-b.y) end function VMT:Magnitude() return math.sqrt(self.x*self.x+self.y*self.y) end function Vector2(x,y) return setmetatable({x=x,y=y},VMT) end
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function read(path) local f=assert(io.open(path,'r')) local s=f:read('a') f:close() return s end
local function has(s,needle) return s:find(needle,1,true)~=nil end
function isvalid(x) return x~=nil and x~=false end
local logs={}
function log(s) table.insert(logs,s) end
function log_warning(s) table.insert(logs,'WARN '..s) end
local function countLog(prefix) local n=0 for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then n=n+1 end end return n end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end

-- 실제 GameConst 숫자 상수
_GameConst={ActCount=4}
for line in io.lines('RootDesk/MyDesk/Common/GameConst.mlua') do
 local kn,vn=line:match('^%s*property number (%w+) = (%-?[%d%.]+)')
 if kn then _GameConst[kn]=tonumber(vn) end
 local ki,vi=line:match('^%s*property integer (%w+) = (%-?%d+)')
 if ki then _GameConst[ki]=tonumber(vi) end
end
local DIFF={[0]='노말','악몽','지옥'}
function _GameConst:DifficultyName(d) return DIFF[d] end

-- ───────── ① 미니맵 남은 망자 안내 ─────────
ok(_GameConst.MinimapRemainMax==3,'GameConst.MinimapRemainMax = 3')
ok(math.abs(_GameConst.MinimapRemainRatio-0.2)<1e-9,'GameConst.MinimapRemainRatio = 0.2')
_Util={Pos2=function(_,e) return Vector2(e.x,e.y) end}
local spawner={ClearMode=true,Alive=0,Remaining=0,Total=0}
function spawner:InitialTotal() return self.Total end
local monsters={}
local map={Id='m1',Name='crypt'}
function map:GetFirstChildComponentByTypeName(t) if t=='script.MonsterSpawner' then return spawner end end
function map:GetChildComponentsByTypeName(t) return monsters end
local player={x=0,y=0,CurrentMap=map}
local function setMobs(list) monsters={} for _,p in ipairs(list) do monsters[#monsters+1]={Entity={x=p[1],y=p[2]},IsDead=p[3]==true} end end
local function state(alive,remain,total) spawner.Alive,spawner.Remaining,spawner.Total=alive,remain,total end
setMobs({{10,0},{3,4},{-20,0},{1,1,true}})
state(2,2,40)
local r=HudMap:RemainingFocus(player,false,false)
ok(r~=nil and r.x==3 and r.y==4 and r.always==true,'살아 2 · 총 40 → 가장 가까운 산 몬스터(죽은 것 뺌) · 안개 예외')
ok(r.count==2,'글귀 수 = 살아 있는 수 (대기 묶음 제외)')
ok(lastLog('[VRF] minimap remain focus')=='[VRF] minimap remain focus alive=2 total=40 ratio=0.05 goalElsewhere=false -> show','판정 로그 형식')
local n0=countLog('[VRF] minimap remain focus')
HudMap:RemainingFocus(player,false,false)
ok(countLog('[VRF] minimap remain focus')==n0,'같은 판정이면 로그를 다시 찍지 않음')
state(4,4,40); ok(HudMap:RemainingFocus(player,false,false)==nil and has(lastLog('[VRF] minimap'),'-> hide:many'),'살아 4 → 안내 없음')
state(2,12,40); ok(HudMap:RemainingFocus(player,false,false)==nil and has(lastLog('[VRF] minimap'),'-> hide:ratio'),'살아 2라도 대기 묶음 10 남음(0.30) → 안내 없음')
state(3,3,10); ok(HudMap:RemainingFocus(player,false,false)==nil,'총 10에 3 남음(0.30) → 안내 없음')
state(3,3,15); ok(HudMap:RemainingFocus(player,false,false)~=nil,'총 15에 3 남음(0.20) → 안내')
state(5,5,10); ok(HudMap:RemainingFocus(player,false,false)==nil,'반례: 예전(남은 5 이하면 늘)엔 안내 · 지금은 없음')
state(1,1,30); ok(HudMap:RemainingFocus(player,true,false)==nil and has(lastLog('[VRF] minimap'),'goalElsewhere=true -> hide:goal-elsewhere'),'퀘스트 목적지가 다른 맵 → 출구 안내를 덮지 않음')
ok(HudMap:RemainingFocus(player,false,true)==nil and has(lastLog('[VRF] minimap'),'-> hide:goal-point'),'이 맵 안 목적지 점(NPC·제단)이 있으면 그대로')
state(0,0,30); ok(HudMap:RemainingFocus(player,false,false)==nil,'다 잡음 → 없음')
spawner.ClearMode=false; state(1,1,30); local before=#logs
ok(HudMap:RemainingFocus(player,false,false)==nil and #logs==before,'처치 전용 맵이 아니면 판정·로그 없음')
local hm=read('RootDesk/MyDesk/UI/Hud/HudMap.mlua')
ok(has(hm,'local goalElsewhere = goalBase ~= "" and goalBase ~= current') and has(hm,'self:RemainingFocus(player, goalElsewhere, focused ~= nil)'),'RenderFocus가 목표 맵 판단(goal·current)을 재사용해 넘김')
ok(has(hm,'"남은 망자 " .. tostring(remain.count) .. " — 가까운 곳 표시"'),'글귀 유지')
local ms=read('RootDesk/MyDesk/Monster/MonsterSpawner.mlua')
ok(has(ms,'@Sync\n    property integer Alive = 0') and has(ms,'self.Alive = liveCount') and has(ms,'method integer InitialTotal()'),'스포너: Alive 동기화(대기 묶음 제외) · InitialTotal 읽기')
ok(has(ms,'self.Remaining = alive\n'),'스포너 Remaining(대기 묶음 포함) 기존 동작 그대로')

-- ───────── ② 선택 보상 줄 ─────────
local quests={
 {title='목 없는 처형인',reward='gold:10,choice:1'},
 {title='모래 전갈 여왕',reward='choice:2'},
 {title='폭풍의 눈',reward='xp:5,choice:3'},
}
_QuestData={Count=function() return #quests end,Get=function(_,i) return quests[i] end}
local icons={raise_skeleton='IC_SKEL',elite_promote='IC_ELITE',bone_shard='IC_SHARD',bone_spear='IC_SPEAR'}
_SkillData={Get=function(_,id) if icons[id] then return {icon=icons[id],kind='active',tree='command',name=id} end return nil end}
_GameData={GetUiIcon=function(_,k) return 'UI_'..k end}
local ui={text={},en={},icon={},color={}}
local opened=nil
_UIKit={
 SetText=function(_,p,t) ui.text[p]=t end,
 SetEnabled=function(_,p,v) ui.en[p]=v end,
 SetIcon=function(_,p,v) ui.icon[p]=v end,
 SetColor=function(_,p,c) ui.color[p]=c end,
 Colored=function(_,hex,t) return '<color='..hex..'>'..t..'</color>' end,
 Close=function(_,w) ui.closed=w end,
 Comp=function(_,name) if name=='script.PlayerQuest' then return PlayerQuest end if name=='script.SkillBook' then return BOOK end end,
}
_SkillOffer={OpenReward=function(_,slot) opened=slot end}
local pq=PlayerQuest
pq.ChoicePicks=';1:command;'
pq.ChoiceTiers='2,1,0'
SkillWindow.ChoiceSlot=0
SkillWindow:RenderChoices(pq)
local C='SkillWin/Choice/C'
ok(ui.text[C..'1/Name']=='해골 하나 더' and ui.text[C..'1/Tier']=='악몽' and ui.icon[C..'1/Icon']=='IC_SKEL' and ui.en[C..'1/Tag']==true,'고른 칸: 축 아이콘·이름·단계(2 = 악몽)·꼬리표')
ok(has(ui.text[C..'2/Name'],'고르기') and ui.text[C..'2/Tier']=='모래 전갈 여왕' and ui.en[C..'2/Tag']==false,'고를 차례: 「고르기」 + 의뢰 제목 · 꼬리표 없음')
ok(has(ui.text[C..'3/Name'],'폭풍의 눈') and ui.text[C..'3/Tier']=='의뢰 전' and ui.icon[C..'3/Icon']=='UI_skill_locked','의뢰 전: 잠금 + 의뢰 제목')
ok(countLog('[VRF] skill choice row slot=1 axis=command tier=2')==1 and countLog('[VRF] skill choice row slot=2 axis=pending tier=1')==1 and countLog('[VRF] skill choice row slot=3 axis=locked tier=0')==1,'[VRF] skill choice row 칸마다')
SkillWindow:PickChoice(2)
ok(opened==2 and ui.closed=='SkillWin' and SkillWindow.ChoiceSlot==0,'고를 차례 칸 → 스킬 창 닫고 선택 보상 카드 창(2)')
pq.ChoicePicks=';1:command;2:command;'
SkillWindow:PickChoice(2)
ok(SkillWindow.ChoiceSlot==2 and SkillWindow.RenderKey=='','고른 칸 → 설명 자리로 (다시 그림)')
SkillWindow:RenderChoiceDetail(pq)
local WS='SkillWin/WS'
ok(ui.text[WS..'/Name']=='정예로 서는 그림자' and ui.icon[WS..'/Portrait/Icon']=='IC_ELITE','설명: 선택 보상 이름 · 그 아이콘')
ok(has(ui.text[WS..'/Info'],'선택 보상') and has(ui.text[WS..'/Info'],'모래 전갈 여왕') and has(ui.text[WS..'/Info'],'노말'),'설명 머리: 선택 보상 · 의뢰 · 단계')
ok(has(ui.text[WS..'/Desc'],'그림자 1기가 정예로 선다'),'설명 = desc')
ok(has(ui.text[WS..'/Stat'],'다음 단계: ') and has(ui.text[WS..'/Stat'],'악몽 ×1.35 · 지옥 ×1.45') and has(ui.text[WS..'/Stat'],'선택 보상 — 스킬과 별개로 늘 적용됩니다'),'다음 단계(next) + 「스킬과 별개로 늘 적용」 문장')
ok(ui.en['SkillWin/BtnLearn']==false and ui.en['SkillWin/BtnEdit']==false and ui.en[WS..'/N1']==false and ui.en[WS..'/Hub']==false and ui.icon[WS..'/Pip1']=='','배우기·칸 넣기·강화 노드·랭크 점 감춤')
ok(lastLog('[VRF] skill choice detail')=='[VRF] skill choice detail slot=2 axis=command tier=1','[VRF] skill choice detail')
SkillWindow:RenderChoices(pq)
ok(ui.icon[C..'2/Rim']=='UI_sk_ws_node_frame_max','설명 중인 칸 금테')
local learned=0
BOOK={RequestLearn=function() learned=learned+1 end,RequestSetSlot=function() learned=learned+1 end}
SkillWindow.Selected='bone_shard'
SkillWindow:Act(0)
ok(learned==0,'선택 보상 설명 중 배우기 요청 없음')
SkillWindow:PickChoice(2)
ok(SkillWindow.ChoiceSlot==0,'같은 칸 한 번 더 → 스킬 공방')
SkillWindow:PickChoice(1)
SkillWindow:Pick('bone_shard')
ok(SkillWindow.ChoiceSlot==0 and SkillWindow.RenderKey=='','같은 스킬을 눌러도 선택 보상 설명을 닫고 다시 그림')
SkillWindow:Act(0)
ok(learned==1,'스킬 공방으로 돌아오면 배우기 요청 그대로')
local sw=read('RootDesk/MyDesk/UI/Windows/SkillWindow.mlua')
local _,noteN=sw:gsub('self%.ElitePromoteNote','')
ok(has(sw,'property string ElitePromoteNote = "선택 보상 「정예로 서는 그림자」와는 다른 스킬입니다"') and noteN==1 and has(sw,'local note = detailId == "elite_promote" and'),'정예 승격 상세에만 구분 문장 (다른 스킬엔 없음)')
ok(has(sw,'quest.ChoicePicks .. "#" .. quest.ChoiceTiers') and has(sw,'"/TL/Legend"'),'다시 그림 열쇠에 선택 보상 · 범례는 시간선 머리 줄')
local pqs=read('RootDesk/MyDesk/Quest/PlayerQuest.mlua')
ok(has(pqs,'@Sync\n    property string ChoicePicks') and has(pqs,'@Sync\n    property string ChoiceTiers'),'클라이언트가 읽는 ChoicePicks·ChoiceTiers는 @Sync')
for _,m in ipairs({'TierOfSlot','PickOf','PendingChoice','ChoiceDef','ChoiceQuestTitle'}) do
 local pre=pqs:match('\n([^\n]*)\n    method [%w]+ '..m..'%(')
 ok(pre~=nil and not pre:find('@ExecSpace',1,true),'PlayerQuest.'..m..'은 ExecSpace 없음 (클라이언트에서 그 자리 실행)')
end
local so=read('RootDesk/MyDesk/UI/Windows/SkillOffer.mlua')
ok(has(so,'_UIKit:SetEnabled(c .. "/Tag", def ~= nil)') and has(so,'"/Card" .. tostring(i) .. "/Tag", false)'),'보상 카드 꼬리표: 보상 모드 켬 · 스킬 추천 끔')
local gen=read('tools/build/ui.cjs')
local _,tagN=gen:gsub('k%.choiceTag%(','')
ok(tagN==2 and has(gen,'pos: [50, -158], w: 72, h: 20') and has(gen,'pos: [2, 2], w: 52, h: 16') and has(gen,'"선택 보상"'),'생성기: 카드·새 줄 꼬리표 (같은 choiceTag)')
ok(has(gen,'const row = "SkillWin/Choice";') and has(gen,'part("sk_ws_node_frame_empty")') and not has(gen,'b.text("SkillWin/Legend"'),'생성기: 선택 보상 줄은 기존 노드 테두리 재사용 · 머리 줄 범례 자리 비움')

-- ───────── ③ 랭킹 내 순위 ─────────
_UtilLogic={ElapsedSeconds=100}
SortDirection={Descending=0,Ascending=1}
local store={}
local sortedReads,getReads=0,0
local function makeBoard(n,me,meAt)
 local rows={}
 for i=1,n do rows[i]={key='p'..i,value=10000-i} end
 if me and meAt then rows[meAt].key=me end
 return rows
end
local function sortedFor(b)
 sortedReads=sortedReads+1
 local page={}
 for i=1,math.min(100,#b) do page[i]={KeyInfo={Key=b[i].key},Value=b[i].value} end
 return 0,{GetCurrentPageDatas=function() return page end}
end
local function getFor(b,key)
 getReads=getReads+1
 for _,r in ipairs(b) do if r.key==key then return 0,r.value end end
 return 1000002,0
end
_DataStorageService={}
function _DataStorageService:GetSortableDataStorage(board)
 local b=store[board]
 return {GetSortedAndWait=function() return sortedFor(b) end,GetAndWait=function(_,key) return getFor(b,key) end}
end
local function namesPage(keys) local d={} for i,k in ipairs(keys) do d[i]={KeyInfo={Key=k},Value='N'..k} end return 0,{GetCurrentPageDatas=function() return d end} end
function _DataStorageService:GetGlobalDataStorage() return {BatchGetAndWait=function(_,keys) return namesPage(keys) end} end
local recorded=0
RankingSystem.RecordProgress=function() recorded=recorded+1 end
local me={PlayerComponent={ProfileCode='ME',Nickname='me'}}
store.rank_progress_0=makeBoard(150,'ME',37)
local digest=RankingSystem:GetTop('rank_progress_0',false)
local mine=RankingSystem:MineDigest(me,'rank_progress_0',false,true)
ok(mine=='37|9963','첫 쪽 37번째 → 37|값 ('..mine..')')
ok(sortedReads==1,'GetTop이 방금 읽은 첫 쪽을 재사용 (정렬 조회 1번)')
local _,semi=digest:gsub(';','')
ok(semi==9,'상위 10 다이제스트 그대로')
ok(lastLog('[VRF] rank mine')=='[VRF] rank mine board=rank_progress_0 rank=37 value=9963','[VRF] rank mine 형식')
_UtilLogic.ElapsedSeconds=110
RankingSystem:GetTop('rank_progress_0',false)
mine=RankingSystem:MineDigest(me,'rank_progress_0',false,true)
ok(sortedReads==2 and mine=='37|9963','캐시 중에도 내 순위는 정렬 첫 쪽을 새로 읽음 (60초 캐시 안 씀)')
_UtilLogic.ElapsedSeconds=112
RankingSystem:MineDigest(me,'rank_progress_0',false,true)
ok(sortedReads==2,'5초 안 같은 판 연타는 방금 답 그대로')
store.rank_boss_x_0=makeBoard(150,'ME',120)
mine=RankingSystem:MineDigest(me,'rank_boss_x_0',true,false)
ok(mine=='-1|9880' and getReads==1,'첫 쪽(100줄) 밖 → 순위 -1 · 값은 GetAndWait')
store.rank_progress_0=makeBoard(20)
RankingSystem.Known={}
RankingSystem.MineAt={}
_UtilLogic.ElapsedSeconds=200
mine=RankingSystem:MineDigest(me,'rank_progress_0',false,true)
ok(mine=='none' and recorded==1,'기록 없음 → none + RecordProgress 한 번')
_UtilLogic.ElapsedSeconds=300
RankingSystem:MineDigest(me,'rank_progress_0',false,true)
ok(recorded==1,'RecordProgress는 세션당 한 번')
ok(lastLog('[VRF] rank mine')=='[VRF] rank mine board=rank_progress_0 rank=0 value=0','기록 없음 로그 rank=0 value=0')
RankingSystem.Known['rank_boss_x_0|ME']=4242
RankingSystem.MineAt={}
store.rank_boss_x_0=makeBoard(150)
getReads=0
mine=RankingSystem:MineDigest(me,'rank_boss_x_0',true,false)
ok(mine=='-1|4242' and getReads==0,'첫 쪽에 없으면 Known 값 (GetAndWait 안 함)')
_RankingSystem=RankingSystem
ok(RankWindow:MineText('progress','37|4404')=='내 순위  37위 · Lv44 · 노말 액트 4','내 순위 N위')
ok(RankWindow:MineText('progress','-1|4404')=='내 순위  100위 밖 · Lv44 · 노말 액트 4','내 순위 100위 밖')
ok(RankWindow:MineText('progress','none')=='내 순위  기록 없음','내 순위 기록 없음')
ok(RankWindow:MineText('depthrun_a1','3|799814')=='내 순위  3위 · 7층 · 3분 05초','심연 판 값 글')
ok(RankWindow:MineText('boss_x','2|95')=='내 순위  2위 · 95초','보스 판 값 글')
ui.text={}
RankWindow.Kind='progress'
RankWindow:OnData('progress',0,'A|4404;B|4303','5|4101')
ok(has(ui.text['RankWin/Paper/List'],' 1.  A   Lv44 · 노말 액트 4') and ui.text['RankWin/Paper/Mine']=='내 순위  5위 · Lv41 · 노말 액트 1','성장 순위 목록 + 내 순위 줄')
local rs=read('RootDesk/MyDesk/Endgame/RankingSystem.mlua')
ok(has(rs,'method void ShowBoard(string kind, integer diff, string digest, string mine)') and has(rs,'self:ShowBoard(kind, diff, digest, mine, senderUserId)'),'ShowBoard에 내 순위 인자 · 대상 = 요청자')
ok(has(rs,'_UserService:GetUserEntityByUserId(senderUserId)'),'요청자 = senderUserId의 플레이어')
print(string.format('[bugfix_three] 통과 %d', checks))
