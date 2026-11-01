-- 11-01 사용자 결정 2건 회귀 검사 (docs/evidence/2026-11-01-ui-tabs-chip) — 실제 mLua 본문으로:
--   2-C 랭킹 탭 폭 넓히기 RankWindow.LayoutTabs: 글귀·글자 16 그대로 탭 넷이 각자 한 줄(글 폭 어림 = UIKit.TextWidth 규칙 · 양쪽 단추 장식 안쪽 비움) ·
--       심연을 숨긴 동안 둘 = 한 줄 가운데 · 11-01 2차: 창 1188이라 넷도 한 줄 가운데 · 어느 쪽이든 탭·닫기·기록 판 겹침 0 · 창 안 (세로 쌓기·칸은 rank_window_2)
--   3-A 스킬 창 머리 줄 「선택 보상」 칸 테 SkillWindow.RenderChoices: 네 상태 모두 장식 없는 판(ui_loot_label) 하나 + 테 색(고름 트리색 · 고를 차례 초록 ·
--       의뢰 전 남회색 · 설명 중 금빛) · 아이콘·꼬리표·이름·단계·「고르기」·잠금 그대로 · 노드 테(sk_ws_node_frame_*)를 더는 쓰지 않음
-- 엔진 UI는 대역 — 실제 글꼴 폭·9조각 그림은 메이커 확인 (보고서 절차). 빌드된 .ui 값 대조는 tools/check_ui_tokens.cjs · tools/check_mobile_layout.cjs
-- @source RankWindow UI/Windows/RankWindow.mlua LayoutTabs
-- @source SkillWindow UI/Windows/SkillWindow.mlua RenderChoices,ChoiceTierName,TreeColor
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function read(path) local f=assert(io.open(path,'r')) local s=f:read('a') f:close() return s end
local function has(s,needle) return s:find(needle,1,true)~=nil end
function isvalid(x) return x~=nil and x~=false end
local logs={}
function log(s) table.insert(logs,s) end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end

local ui={pos={},size={},icon={},color={},en={},text={}}
_UIKit={
 SetPos=function(_,p,v) ui.pos[p]=v end,
 SetSize=function(_,p,v) ui.size[p]=v end,
 SetIcon=function(_,p,v) ui.icon[p]=v end,
 SetColor=function(_,p,c) ui.color[p]=c end,
 SetEnabled=function(_,p,v) ui.en[p]=v end,
 SetText=function(_,p,t) ui.text[p]=t end,
 Colored=function(_,hex,t) return '<color='..hex..'>'..t..'</color>' end,
}

-- ───────── 2-C 랭킹 탭 ─────────
-- 글 폭 어림 = UIKit.TextWidth 규칙 (한글·기호 = 글자 크기 · 영문·숫자·빈칸 = 0.55배) · 양쪽 비움 = ui-tokens BUTTON.artEdge + SPACE/2
local tok=read('tools/build/ui-tokens.cjs')
local artEdge=tonumber(tok:match('artEdge: (%d+)'))
local space=tonumber(tok:match('const SPACE = (%d+)'))
local padX=tonumber(tok:match('const INSET = { top: %d+, side: (%d+)')) + space   -- 창 안쪽 여백 FRAME.padX = INSET.side + SPACE (51)
local side=artEdge+space/2
local closeSize,closeX,closeY=tok:match('close: { size: (%d+), x: (%-?%d+), y: (%-?%d+) }')
closeSize,closeX,closeY=tonumber(closeSize),tonumber(closeX),tonumber(closeY)
local kit=read('RootDesk/MyDesk/UI/Core/UIKit.mlua')
ok(has(kit,'w = w + (string.len(ch) > 1 and fontPx or fontPx * 0.55)'),'UIKit.TextWidth 규칙 그대로 (한글 1 · 그 밖 0.55)')
local function textW(s,px) local w=0 for ch in s:gmatch('[\0-\127\194-\244][\128-\191]*') do w=w+(#ch>1 and px or px*0.55) end return w end
local R=RankWindow
local labels={'성장 순위','보스 처치 시간','심연 최고 층','이번 주 심연'}
for _,t in ipairs(labels) do ok(textW(t,16)<=R.TabW-2*side,'탭 글 「'..t..'」 '..textW(t,16)..' ≤ 탭 '..R.TabW..' − 양쪽 장식 안쪽 '..(2*side)) end
ok(textW('보스 처치 시간',16)>148-2*30,'반례: 예전 폭 148(글 칸 88)엔 「보스 처치 시간」('..textW('보스 처치 시간',16)..')이 안 들어가 두 줄로 꺾였다')
local rw=read('RootDesk/MyDesk/UI/Windows/RankWindow.mlua')
ok(has(rw,'_UIKit:SetText(self.Win .. "/TabQueen", "보스 처치 시간")'),'글귀 그대로 「보스 처치 시간」')
ok(has(rw,'self:LayoutTabs(_GameData.depthEnabled >= 1)'),'OnBeginPlay가 심연 표시와 같은 조건으로 배치')

local W='RankWin/'
local function rectTab(n) local p=ui.pos[W..n] return {l=p.x-R.TabW/2,r=p.x+R.TabW/2,t=p.y,b=p.y-R.TabH,name=n} end
local function overlap(a,b) return math.min(a.r,b.r)-math.max(a.l,b.l)>0.5 and math.min(a.t,b.t)-math.max(a.b,b.b)>0.5 end
local function check(mode,names)
 local rects={}
 for _,n in ipairs(names) do rects[#rects+1]=rectTab(n) end
 rects[#rects+1]={l=R.WinW/2+closeX-closeSize,r=R.WinW/2+closeX,t=closeY,b=closeY-closeSize,name='BtnClose'}   -- 닫기 단추 (오른쪽 위 모서리 · ui-tokens FRAME.close)
 rects[#rects+1]={l=-R.PaperW/2,r=R.PaperW/2,t=R.PaperTop,b=R.PaperTop-100,name='Paper'}   -- 기록 판 위 끝 (11-01 2차: 탭 바로 아래 — 자세한 세로 쌓기는 rank_window_2)
 for i=1,#rects do for j=i+1,#rects do ok(not overlap(rects[i],rects[j]),mode..': '..rects[i].name..' × '..rects[j].name..' 겹치지 않음') end end
 for _,r in ipairs(rects) do
  if r.name:sub(1,3)=='Tab' then ok(r.l>=-(R.WinW/2-padX) and r.r<=R.WinW/2-padX,mode..': '..r.name..' 창 안쪽(padX '..padX..') 안') end
 end
end
-- 11-01 2차: 창 바탕 1188이라 넷도 한 줄 (예전 640 창은 둘씩 두 줄 + 막대·기록 칸을 내리고 창을 늘렸다 — 메이커 관찰 2 「창 아래 테가 하단 메뉴 줄에 닿을 듯」)
R:LayoutTabs(false)
ok(ui.pos[W..'TabProgress'].x==-109 and ui.pos[W..'TabQueen'].x==109 and ui.pos[W..'TabProgress'].y==-86 and ui.pos[W..'TabQueen'].y==-86,'심연 숨김: 두 탭 한 줄 가운데 (±109 · 위 −86)')
ok(ui.pos[W..'TabDepth']==nil and ui.pos[W..'TabWeek']==nil,'심연 숨김: 심연 탭 자리 안 건드림 (꺼져 있음)')
ok(R.TabRows==1,'심연 숨김: 탭 한 줄')
ok(lastLog('[VRF] rank tabs')=='[VRF] rank tabs shown=2 rows=1 w=202 x=-109,109','[VRF] rank tabs (둘)')
check('탭 둘',{'TabProgress','TabQueen'})
local gapX=ui.pos[W..'TabQueen'].x-ui.pos[W..'TabProgress'].x-R.TabW
ok(gapX==R.TabGapX,'탭 사이 '..gapX..' = TabGapX')
local leftMargin=(R.WinW/2-padX)+ui.pos[W..'TabProgress'].x-R.TabW/2
local rightMargin=(R.WinW/2-padX)-(ui.pos[W..'TabQueen'].x+R.TabW/2)
ok(leftMargin==rightMargin,'탭 둘 좌우 여백 같음 ('..leftMargin..')')

ui.pos={} ui.size={}
R:LayoutTabs(true)
ok(ui.pos[W..'TabProgress'].x==-327 and ui.pos[W..'TabQueen'].x==-109 and ui.pos[W..'TabDepth'].x==109 and ui.pos[W..'TabWeek'].x==327,'심연 켬: 넷 한 줄 가운데 (−327 · −109 · 109 · 327)')
ok(ui.pos[W..'TabProgress'].y==-86 and ui.pos[W..'TabWeek'].y==-86 and R.TabRows==1,'심연 켬: 모두 위 −86 · 한 줄')
ok(lastLog('[VRF] rank tabs')=='[VRF] rank tabs shown=4 rows=1 w=202 x=-327,-109,109,327','[VRF] rank tabs (넷)')
check('탭 넷',{'TabProgress','TabQueen','TabDepth','TabWeek'})
ok(4*R.TabW+3*R.TabGapX<=R.WinW-2*padX,'넷 한 줄 '..(4*R.TabW+3*R.TabGapX)..' ≤ 창 안쪽 '..(R.WinW-2*padX))
ok(4*R.TabW+3*R.TabGapX>640-2*padX,'반례: 예전 창 640에서는 넷 한 줄('..(4*R.TabW+3*R.TabGapX)..')이 창 안쪽 '..(640-2*padX)..'을 넘었다')

-- ───────── 3-A 선택 보상 칸 테 ─────────
local icons={raise_skeleton='IC_SKEL'}
_SkillData={Get=function(_,id) if icons[id] then return {icon=icons[id]} end return nil end}
_GameData={GetUiIcon=function(_,k) return 'UI_'..k end}
_GameConst={DifficultyName=function(_,d) return ({[0]='노말','악몽','지옥'})[d] end}
local Q={picks={[1]='command'},tiers={2,1,0},titles={'목 없는 처형인','모래 전갈 여왕','폭풍의 눈'}}
function Q:PickOf(slot) return self.picks[slot] or '' end
function Q:TierOfSlot(slot) return self.tiers[slot] end
function Q:ChoiceDef(slot,axis) if axis=='command' then return {name='해골 하나 더',skill='raise_skeleton'} end return nil end
function Q:ChoiceQuestTitle(slot) return self.titles[slot] end
local S=SkillWindow
local C='SkillWin/Choice/C'
local function col(p) local c=ui.color[p] return c and string.format('%.2f,%.2f,%.2f',c.r,c.g,c.b) or 'nil' end
S.ChoiceSlot=0
S:RenderChoices(Q)
for i=1,3 do ok(ui.icon[C..i..'/Rim']=='UI_ui_loot_label','칸 '..i..' 테 = 장식 없는 판 (ui_loot_label)') end
ok(col(C..'1/Rim')=='0.44,0.85,0.76','고른 칸 테 = 트리색 (군단 청록) '..col(C..'1/Rim'))
ok(col(C..'2/Rim')=='0.62,0.92,0.62','고를 차례 칸 테 = 초록')
ok(col(C..'3/Rim')=='0.55,0.60,0.71','의뢰 전 칸 테 = 남회색 (잠긴 제목 글색 #8C99B4)')
ok(ui.text[C..'1/Name']=='해골 하나 더' and ui.text[C..'1/Tier']=='악몽' and ui.icon[C..'1/Icon']=='IC_SKEL' and ui.en[C..'1/Tag']==true,'고른 칸: 아이콘·이름·단계·꼬리표 그대로')
ok(has(ui.text[C..'2/Name'],'고르기') and ui.text[C..'2/Tier']=='모래 전갈 여왕' and ui.en[C..'2/Tag']==false and ui.icon[C..'2/Icon']=='UI_q_avail','고를 차례: 「고르기」 + 의뢰 제목 · 꼬리표 없음')
ok(has(ui.text[C..'3/Name'],'폭풍의 눈') and ui.text[C..'3/Tier']=='의뢰 전' and ui.icon[C..'3/Icon']=='UI_skill_locked' and ui.color[C..'3/Icon'].a==0.9,'의뢰 전: 잠금 아이콘(흐리게) + 의뢰 제목')
ok(lastLog('[VRF] skill choice row slot=1')=='[VRF] skill choice row slot=1 axis=command tier=2 rim=picked' and lastLog('[VRF] skill choice row slot=3')=='[VRF] skill choice row slot=3 axis=locked tier=0 rim=locked','[VRF] skill choice row … rim=상태')
S.ChoiceSlot=1
S:RenderChoices(Q)
ok(col(C..'1/Rim')=='0.90,0.78,0.54' and ui.icon[C..'1/Rim']=='UI_ui_loot_label','설명 중인 칸 = 같은 판 + 금빛 테 (#E6C88A)')
ok(lastLog('[VRF] skill choice row slot=1')=='[VRF] skill choice row slot=1 axis=command tier=2 rim=shown','[VRF] 설명 중 rim=shown')
local sw=read('RootDesk/MyDesk/UI/Windows/SkillWindow.mlua')
local body=sw:match('method void RenderChoices%(PlayerQuest quest%)\n(.-)\n    end\n')
ok(body~=nil and not has(body,'sk_ws_node_frame'),'RenderChoices가 공방 노드 테(가시·자물쇠 장식)를 더는 쓰지 않음')
local gen=read('tools/build/ui.cjs')
local choice=gen:match('const row = "SkillWin/Choice";(.-)\n  }\n')
ok(choice~=nil and has(choice,'...part(PL.key)') and not has(choice,'sk_ws_node_frame'),'생성기: 선택 보상 칸 테 = PLATE.key · 노드 테 없음')
ok(has(tok,"const PLATE = { key: 'ui_loot_label'") and S.ChoiceRimKey=='ui_loot_label','ui-tokens PLATE.key = SkillWindow.ChoiceRimKey = ui_loot_label')
local csv=read('data/ui_icons.csv')
ok(has(csv,'ui_loot_label,2e3042c545244a4097cea6d601b31202,#FFFFFF,1,') and has(read('RootDesk/MyDesk/Data/GameData.mlua'),'self.UiIcons["ui_loot_label"] = "2e3042c545244a4097cea6d601b31202"'),'판 그림 등록됨 (ui_icons.csv · GameData — 새 그림 없음)')
print(string.format('[ui_tabs_chip] 통과 %d', checks))
