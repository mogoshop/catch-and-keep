-- 11-01 랭킹 창 2차 (사용자 「랭킹창에 이 공백은 도대체 뭐여 줄이자 · 캐릭터도 작게 · 20위까지 · ui는 너가 판단」 · docs/evidence/2026-11-01-rank-window-2) 회귀 검사 — 실제 mLua 본문으로:
--   ① 공백: RankWindow.Layout — 막대 없는 탭(성장·보스)은 기록 판이 탭 바로 아래 · 머리 줄 한 줄(40) → 목록, 심연 탭은 머리 줄 = 막대 높이(76, 막대 오른쪽) ·
--      창 테두리 위 끝 고정(아래로만 늘고 줆) · 가장 긴 배치도 하단 메뉴 줄(−306)·버프 줄(−266) 위 (메이커 11-01 관찰 2) · 반례: 예전 배치는 탭 아래 76 빈 띠
--   ② 20위: RankingSystem.GetTop 칸 20 · 다이제스트 "이름|값|외형" · 옛 이름 줄(외형 없음)은 외형 칸 빈칸 · SortMax(예전 999999는 심연 10층부터 빠졌다)
--   ③ 캐릭터 그림: 외형 저장소 rank_looks_c1(세션에 캐릭터당 1번 쓰기 · 목록을 새로 만들 때 보이는 줄만 묶음 1번 읽기) · 이름 저장소 형식 그대로(되돌림·예전 인스턴스 안전) ·
--      FillLook(목록에 보이는 옛 줄만 · 창을 열 때 1번) · MeText ·
--      RankWindow.OnData — 칸마다 CharSelectWindow.Dress(외형) · 옛 줄은 기본 모습 + 그림자 색 · 내 칸 노란 빛(이름·값이 같을 때만) · 내 순위 줄 그림 · [VRF] rank rows/layout/look fill
-- 엔진 UI·저장소는 대역 — 실제 아바타 그림·글꼴·저장소 정렬은 메이커 확인 (README 「메이커 확인 절차」). 빌드된 .ui 값 대조는 tools/check_ui_tokens.cjs
-- @source RankingSystem Endgame/RankingSystem.mlua BoardName,DepthKind,CharId,RankKey,CharIdOf,CharName,CharLook,WriteLook,ReadLooks,FillLook,PatchLook,MeText,Record,ReadSorted,ReadNames,GetTop,MineDigest,RequestBoard,ShowBoard,ProgressValue,RecordProgress,ProgressText,RecordBossTime,RecordDepthRun
-- @source PlayerSave Player/PlayerSave.mlua SlotInfo,LookOf,Look,CharName
-- @source RankWindow UI/Windows/RankWindow.mlua OnBeginPlay+,Show+,OnData+,Toggle
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
local tok=read('tools/build/ui-tokens.cjs')

-- ───────── 대역 ─────────
_GameConst={ActCount=4,FinalBossSourceId='ash_king'}
local DIFF={[0]='노말','악몽','지옥'}
function _GameConst:DifficultyName(d) return DIFF[d] end
function _GameConst:ActRegionName(a) return ({'무덤 왕국','모래 폐허','소금 바다','잿빛 왕좌'})[a] end
local QUEST_ACT={[1]=1,[5]=2,[9]=3,[12]=4}
_QuestData={Get=function(_,i) return {act=QUEST_ACT[i] or 1} end}
_GameData={depthEnabled=0,GetMonsterName=function(_,id) return '재의 왕 고르바스' end}
_WeeklyRules={BoardKind=function(_,act,week) return 'weekrun_a'..act..'_w'..week end,CurrentWeek=function() return 2901 end,
 EndsIn=function() return '3일 14시간 뒤 바뀜' end,Describe=function(_,w,sep) return '망자의 주 — 정예 +50% · 그림자 추출 +5%p'..sep..'피의 달 — 몬스터 생명·공격 +15% · 이동 +10% · 그림자 추출 +8%p' end}
_UtilLogic={ElapsedSeconds=1000}
SortDirection={Descending=0,Ascending=1}
_RankingSystem=RankingSystem
-- UI: 글·켜짐·색·자리·크기 + 아바타(옷 입힘 기록 · 색)
local ui={text={},en={},color={},pos={},size={},pager={}}
local avatars={}
local function avatarAt(p) avatars[p]=avatars[p] or {AvatarGUIRendererComponent={Color=Color(1,1,1,1)}} return avatars[p] end
local dressed={}
_UIKit={
 RegisterWindow=function() end, Connect=function() end, Open=function(_,w) ui.open=w end, Close=function() end, IsOpen=function() return ui.open~=nil end,
 SetText=function(_,p,t) ui.text[p]=t end, SetEnabled=function(_,p,v) ui.en[p]=v end, SetColor=function(_,p,c) ui.color[p]=c end,
 SetPos=function(_,p,v) ui.pos[p]=v end, SetSize=function(_,p,v) ui.size[p]=v end,
 Colored=function(_,hex,t) return '<color='..hex..'>'..t..'</color>' end,
 Get=function(_,p) if p:sub(-7)=='/Avatar' then return avatarAt(p) end return nil end,
 Comp=function(_,name) if name=='script.PlayerStats' then return {Difficulty=0} end if name=='script.PlayerTravel' then return {Act=2} end end,
 SetActPager=function(_,bar,act,count,title) ui.pager={bar=bar,act=act,title=title} end,
}
_CharSelectWindow={Dress=function(_,p,look) dressed[p]=look end}

-- DataStorage (요청을 ops에 남긴다 · 정렬은 값 → 키 · 한 쪽 100)
local sortable,globals,ops={}, {}, {}
local function sstore(name) sortable[name]=sortable[name] or {} return sortable[name] end
local function gstore(name) globals[name]=globals[name] or {} return globals[name] end
local function opsOf(kind,name) local n=0 for _,o in ipairs(ops) do if o.kind==kind and (name==nil or o.name==name) then n=n+1 end end return n end
_DataStorageService={}
function _DataStorageService:GetSortableDataStorage(name)
 local s=sstore(name)
 return {
  GetAndWait=function(_,key) table.insert(ops,{kind='sget',name=name}) if s[key]~=nil then return 0,s[key] end return 1000002,0 end,
  SetAsync=function(_,key,value,cb) table.insert(ops,{kind='sset',name=name}) s[key]=value if cb then cb(0,key) end end,
  GetSortedAndWait=function(_,dir,lo,hi)
   table.insert(ops,{kind='sorted',name=name,hi=hi})
   local rows={}
   for k,v in pairs(s) do if v>=lo and v<=hi then rows[#rows+1]={k=k,v=v} end end
   table.sort(rows,function(a,b) if a.v==b.v then return a.k<b.k end if dir==SortDirection.Ascending then return a.v<b.v end return a.v>b.v end)
   local page={}
   for i=1,math.min(100,#rows) do page[i]={KeyInfo={Key=rows[i].k},Value=rows[i].v} end
   return 0,{GetCurrentPageDatas=function() return page end}
  end,
 }
end
function _DataStorageService:GetGlobalDataStorage(name)
 local g=gstore(name)
 return {
  SetAsync=function(_,key,value,cb) table.insert(ops,{kind='gset',name=name,key=key,value=value}) g[key]=value if cb then cb(0,key) end end,
  BatchGetAndWait=function(_,keys)
   table.insert(ops,{kind='gbatch',name=name,n=#keys})
   assert(#keys<=25,'이름 묶음 조회는 한 쪽(25) 안')
   local d={}
   for _,k in ipairs(keys) do if g[k]~=nil then d[#d+1]={KeyInfo={Key=k},Value=g[k]} end end
   return 0,{GetCurrentPageDatas=function() return d end}
  end,
 }
end
local users={}
_UserService={GetUserEntityByUserId=function(_,uid) return users[uid] end}
local function makePlayer(profile,nick,uid,slots,slot)
 local p={PlayerComponent={ProfileCode=profile,Nickname=nick,UserId=uid},comps={}}
 p.GetComponent=function(self,t) return self.comps[t] end
 local save=setmetatable({Entity=p,Slot=slot,Account={slots=slots}},{__index=PlayerSave})
 p.comps['script.PlayerSave']=save
 users[uid]=p
 return p
end
local function play(p,level,maxDiff,questIndex)
 p.comps['script.PlayerStats']={Level=level,MaxDifficulty=maxDiff,Difficulty=maxDiff}
 p.comps['script.PlayerQuest']={Diff=maxDiff,Index=questIndex,ByDiff={}}
end
local RS=RankingSystem
local W=RankWindow
local NS='rank_names_c1'
local LS='rank_looks_c1'

-- ───────── ① 공백 · 세로 쌓기 (RankWindow.Layout) ─────────
W:OnBeginPlay()
ok(lastLog('[VRF] rank tabs')=='[VRF] rank tabs shown=2 rows=1 w=202 x=-109,109','심연 숨김: 탭 둘 한 줄')
local rimTop=W.RimTop
local function rimBottom() return W.RimTop-ui.size['RankWin'].y-W.RimOut*2 end
local function state(kind)
 W:Layout(kind)
 local win,winY,paperY,paperH,head,list=ui.size['RankWin'],ui.pos['RankWin'].y,ui.pos['RankWin/Paper'].y,ui.size['RankWin/Paper'].y,ui.size['RankWin/Paper/Head'],ui.pos['RankWin/Paper/List']
 return {winH=win.y,winY=winY,paperY=paperY,paperH=paperH,headW=head.x,headH=head.y,listX=list.x,listY=list.y,bar=ui.en['RankWin/Paper/ActBar'],rim=ui.size['RankWin/Rim']}
end
local tabsBottom=W.TabTop-W.TabH   -- −142
local base=state('progress')
ok(base.paperY==tabsBottom-12,'성장 탭: 기록 판 위 끝 = 탭 아래 끝 − 12 (공백 없음) '..base.paperY)
ok(base.headH==40 and base.headW==1086 and base.listY==-(12+40+12) and base.bar==false,'성장 탭: 머리 줄 한 줄(40 · 판 폭) → 12 → 목록 · 막대 꺼짐')
ok(base.winH==668 and base.paperH==478 and base.winY==142 and base.rim.x==1228 and base.rim.y==708,'성장 탭: 창 1188×668 · 판 478 · 가운데 142 · 테두리 1228×708')
ok(base.winY+base.winH/2+W.RimOut==rimTop,'창 테두리 위 끝 = RimTop '..rimTop)
ok(lastLog('[VRF] rank layout')=='[VRF] rank layout kind=progress paged=false head=40 listTop=64 paperH=478 winH=668 winY=142 rimBottom=-212','[VRF] rank layout (성장)')
local boss=state('boss_ash_king')
ok(boss.winH==base.winH and boss.paperY==base.paperY and boss.bar==false,'보스 탭 = 성장 탭 배치 (막대 없음 · 공백 없음)')
local depth=state('depth')
ok(depth.bar==true and depth.headH==76 and depth.headW==1086-420-12 and depth.listY==-(12+76+12),'심연 탭: 머리 줄 = 막대 높이 76 · 제목 폭 = 판 − 막대 420 − 12 · 막대 켜짐')
ok(depth.winH==704 and depth.winY+depth.winH/2+W.RimOut==rimTop,'심연 탭: 창 704 · 위 끝 그대로(아래로만 36 늘어남)')
ok(rimBottom()==-248 and rimBottom()>=-266+12 and rimBottom()>=-306+12,'가장 긴 배치(심연 탭) 테두리 아래 −248 ≥ 버프 줄 −266 + 12 · 하단 메뉴 줄 −306 + 12 (메이커 관찰 2)')
local week=state('week')
ok(week.winH==depth.winH and week.bar==true,'이번 주 탭 = 심연 탭 배치 (규칙은 머리 줄 왼쪽 세 줄)')
-- 반례: 예전 배치(탭 한 줄일 때 막대 −166 · 기록 칸 −218)는 막대를 감춘 탭에서 탭 아래 76 빈 띠 + 넷이면 창 752가 메뉴 줄 −306 아래로
ok((-218)-(tabsBottom)<-70,'반례: 예전 기록 칸 위 끝 −218은 탭 아래 −142에서 76 아래 (막대를 감춘 탭에도 빈 띠)')
ok(60-752/2-20<-306,'반례: 예전 탭 넷 배치(가운데 60 · 창 752) 테두리 아래 '..(60-752/2-20)..'은 하단 메뉴 줄 −306 아래')
-- 탭 넷(심연 켬)도 한 줄 → 판 자리 그대로
_GameData.depthEnabled=1
W:LayoutTabs(true)
ok(W.TabRows==1,'심연 켬: 탭 넷 한 줄')
local d4=state('depth')
ok(d4.paperY==base.paperY and d4.winH==depth.winH,'탭 넷 × 막대 보임 = 탭 둘 × 막대 보임 (탭이 한 줄이라 판이 안 내려간다)')
_GameData.depthEnabled=0
W:LayoutTabs(false)

-- ───────── ② ③ 서버: 20위 · 이름|외형 · FillLook ─────────
ok(RS.TopCount==20 and RS.NameScanMax==45 and RS.SortMax>=2000000000,'상위 20 · 이름 45줄 · 정렬 상한')
local board='rank_progress_0_c1'
-- 다른 사람 22명 (옛 줄 = 외형 없는 이름 · 2차 줄 = 이름|외형 섞어서)
local bs,gn,gl=sstore(board),gstore(NS),gstore(LS)
for i=1,22 do
 local k='O'..i..'_c1_1'
 bs[k]=(60-i)*100+12   -- Lv59~38 · 악몽 액트 2
 gn[k]=(i%3==0) and ('옛'..i) or ('새'..i)
 if i%3~=0 then gl[k]=((i%2==0) and 'f' or 'm')..'-'..(i%5+1)..'-2-'..(i%7+1)..'-1' end   -- 3줄마다 외형 없는 옛 줄 (2차 전 기록)
end
-- 나: 새내기 (외형 m-3-1-2-2) · Lv41~43 노말 액트 3 → 18위 자리 (Lv44 이상 16줄 + Lv43 악몽 1줄 다음)
local me=makePlayer('ME','인꾸','uMe',{['4']={name='새내기',lv=41,diff=0,created=63928683821328,look='m-3-1-2-2'}},4)
local ME='ME_c4_63928683821328'
play(me,41,0,9)
local g0,l0=opsOf('gset',NS),opsOf('gset',LS)
RS:RecordProgress(me)
ok(gn[ME]=='새내기' and opsOf('gset',NS)==g0+1,'기록 → 이름 저장소에 이름 한 번 (형식·횟수 예전 그대로)')
ok(gl[ME]=='m-3-1-2-2' and opsOf('gset',LS)==l0+1,'기록 → 외형 저장소에 외형 한 번 (2차에 늘어난 쓰기 = 세션에 캐릭터당 1번)')
ok(lastLog('[VRF] rank record')=='[VRF] rank record board=rank_progress_0_c1 char=c4_63928683821328 name=새내기 value=4103 prev=nil look=m-3-1-2-2','[VRF] rank record … look=')
play(me,42,0,9)
RS:RecordProgress(me)
play(me,43,0,9)
RS:RecordProgress(me)
ok(opsOf('gset',NS)==g0+1 and opsOf('gset',LS)==l0+1 and bs[ME]==4303,'세션 안 레벨업 두 번 더: 기록만 다시 쓰고 이름·외형은 다시 쓰지 않음 (세션당 1번)')
local digest=RS:GetTop(board,false)
local n,looks,blank=0,0,0
local first=nil
for name,value,look in string.gmatch(digest,'([^|;]+)|(%d+)|([^|;]*)') do n=n+1 if n==1 then first={name,value,look} end if look~='' then looks=looks+1 else blank=blank+1 end end
ok(n==20,'다이제스트 20줄 ('..n..')')
ok(first[1]=='새1' and first[2]=='5912' and first[3]=='m-2-2-2-1','첫 줄 「새1|5912|m-2-2-2-1」 (이름|값|외형)')
ok(blank==6 and looks==14,'옛 줄(외형 없음) 6 · 외형 줄 14 (새내기 포함) — 옛 줄은 외형 칸이 빈다')
ok(lastLog('[VRF] rank top')=='[VRF] rank top board=rank_progress_0_c1 rows=23 shown=20 hidden=0 names=20 looks=14','[VRF] rank top … looks=14')
ok(opsOf('gbatch',NS)==1 and opsOf('gbatch',LS)==1,'이름 조회 1번 + 외형 조회 1번 (보이는 20줄 · 한 쪽 25 안)')
-- 옛 줄 캐릭터 「옛3」이 창을 연다 → 목록에 보이는 자기 줄을 한 번 「이름|외형」으로
local old=makePlayer('O3','옛3닉','uOld',{['1']={name='옛3',lv=50,diff=1,created=1,look='f-2-3-4-2'}},1)
ok(RS:MeText(old)=='옛3|f-2-3-4-2' and RS:MeText(nil)=='|','MeText = 지금 캐릭터 「이름|외형」 · 없으면 「|」')
local g1=opsOf('gset',LS)
senderUserId='uOld'
local shown=nil
RS.ShowBoard=function(_,kind,diff,dg,mine,meText) shown={kind=kind,digest=dg,mine=mine,me=meText} end
RS:RequestBoard('progress',0)
ok(gl['O3_c1_1']=='f-2-3-4-2' and gn['O3_c1_1']=='옛3' and opsOf('gset',LS)==g1+1,'FillLook: 목록에 보이는 옛 줄 → 창을 열 때 외형 한 번 채움 (이름은 그대로)')
ok(lastLog('[VRF] rank look fill')=='[VRF] rank look fill char=c1_1 look=f-2-3-4-2','[VRF] rank look fill')
ok(shown.me=='옛3|f-2-3-4-2' and shown.mine=='3|5712','ShowBoard에 내 순위 + 내 「이름|외형」')
local rowsOf=function(dg) local t={} for r in string.gmatch(dg..';','([^;]*);') do t[#t+1]=r end return t end
ok(rowsOf(shown.digest)[3]=='옛3|5712|f-2-3-4-2' and rowsOf(RS.Cache[board].digest)[3]=='옛3|5712|f-2-3-4-2','PatchLook: 처음 연 그 답부터 내 칸(3위)에 방금 채운 외형 · 60초 캐시도 같이 (저장소 요청 없이)')

_UtilLogic.ElapsedSeconds=1010
RS:RequestBoard('progress',0)
ok(opsOf('gset',LS)==g1+1,'다시 열어도 더 쓰지 않음 (세션에 한 번)')
ok(rowsOf(shown.digest)[3]=='옛3|5712|f-2-3-4-2' and opsOf('gbatch',LS)==1,'60초 안 다시 열기: 고친 캐시 그대로 (외형 조회 늘지 않음)')
ok(RS:PatchLook(board,'가|10|;나|9|','2|8','m-1-1')=='가|10|;나|9|' and RS:PatchLook(board,'가|10|','none','m-1-1')=='가|10|','PatchLook: 내 순위 자리 값이 다르거나 기록 없음이면 그대로')

-- 목록에 안 보이는 옛 줄(23위)은 손대지 않음 · 외형이 이미 맞는 줄도 손대지 않음
bs['L1_c1_1']=1
gn['L1_c1_1']='저아래'
local low=makePlayer('L1','저','uLow',{['1']={name='저아래',created=1,look='m-1-1'}},1)
senderUserId='uLow'
RS:RequestBoard('progress',0)
ok(gl['L1_c1_1']==nil and opsOf('gset',LS)==g1+1,'목록 밖 옛 줄은 쓰지 않음 (보이지 않는 줄에 요청 안 씀)')
senderUserId='uMe'
_UtilLogic.ElapsedSeconds=1100
RS:RequestBoard('progress',0)
ok(opsOf('gset',LS)==g1+1,'외형이 이미 맞는 내 줄은 쓰지 않음')
-- 지운 캐릭터 표시는 건드리지 않음
RS.StoredLook['HIDE_c1_1']=''
RS.Hidden['HIDE_c1_1']=true
local hid=makePlayer('HIDE','h','uHid',{['1']={name='숨김',created=1,look='m-1-1'}},1)
RS:FillLook(hid)
ok(opsOf('gset',LS)==g1+1,'지운 캐릭터는 외형을 채우지 않음')
-- 정렬 상한: 심연 12층(값 1,2xx,xxx) — 예전 상한 999999면 빠졌다
local dboard='rank_depthrun_a1_0_c1'
RS:RecordDepthRun(me,0,1,12,185)
local dv=sstore(dboard)[ME]
ok(dv==12*100000+99999-185 and dv>999999,'심연 12층 값 '..dv..' > 999999')
local drows=RS:ReadSorted(dboard,false)
ok(#drows==1 and drows[1].key==ME,'정렬 조회에 12층 줄이 든다 (SortMax)')
local hi=0 for _,o in ipairs(ops) do if o.kind=='sorted' then hi=o.hi end end
ok(hi==RS.SortMax and dv>999999,'반례: 예전 상한 999999로는 이 줄('..dv..')이 빠졌다')

-- ───────── ③ 창: 칸 20 · 그림 · 내 칸 · 내 순위 줄 (RankWindow.Show → OnData) ─────────
RS.ShowBoard=function(_,kind,diff,dg,mine,meText) W:OnData(kind,diff,dg,mine,meText) end
senderUserId='uMe'
_UtilLogic.ElapsedSeconds=1200
RS.Cache={}
W:Show('progress')
local L='RankWin/Paper/List/R'
local on,shadowN=0,0
for i=1,20 do if ui.en[L..i] then on=on+1 end end
ok(on==20,'칸 20 모두 켜짐')
ok(ui.text['RankWin/Paper/Head']=='레벨 · 가장 멀리 간 난이도·액트','머리 줄 = 성장 판 제목')
ok(ui.text[L..'1/Rank']=='<color=#FFD45A>1</color>' and ui.text[L..'2/Rank']=='<color=#DCE3EC>2</color>' and ui.text[L..'3/Rank']=='<color=#E39A5C>3</color>' and ui.text[L..'4/Rank']=='<color=#B8AE9A>4</color>','순위 숫자 1 금 · 2 은 · 3 동 · 그 밖 베이지')
ok(dressed[L..'1/Avatar']=='m-2-2-2-1' and avatars[L..'1/Avatar'].AvatarGUIRendererComponent.Color.r==1,'1위 칸 그림 = 그 캐릭터 외형 (흰 색 그대로)')
-- 3번째 줄 = 「옛3」 → 방금 FillLook으로 외형이 생겼지만 목록은 60초 캐시를 비웠으니 새로 읽어 외형 있음
ok(dressed[L..'3/Avatar']=='f-2-3-4-2','FillLook 뒤 새로 읽은 목록: 옛3 칸도 외형')
-- 그림자 색 = RankWindow.ShadowTint (11-01 메이커 2회차 관찰 2로 밝혔다 — release_fix5가 대비를 잰다)
for i=1,20 do local a=avatars[L..i..'/Avatar'] if a and a.AvatarGUIRendererComponent.Color==RankWindow.ShadowTint then shadowN=shadowN+1 end end
local sixth=nil
for i=1,20 do if has(ui.text[L..i..'/Name'] or '','옛6') then sixth=i end end
ok(sixth~=nil and dressed[L..sixth..'/Avatar']=='m-1-1' and avatars[L..sixth..'/Avatar'].AvatarGUIRendererComponent.Color==RankWindow.ShadowTint and RankWindow.ShadowTint.r<1,'옛 줄(외형 없음) 칸 = 기본 모습 + 그림자 색 (남의 모습을 기본 남자로 잘못 보이지 않게)')
ok(shadowN==5,'그림자 칸 5 (옛 줄 6 − 고쳐 쓴 옛3)')
local myCell=nil
for i=1,20 do if has(ui.text[L..i..'/Name'] or '','새내기') then myCell=i end end
ok(myCell==18 and ui.text[L..'18/Name']=='<color=#F4ED83>새내기</color>' and ui.color[L..'18'].a>0.2,'내 칸(18위) = 노란 이름 · 노란 바탕')
ok(ui.text['RankWin/Paper/Mine/Rank']=='18위' and ui.text['RankWin/Paper/Mine/Name']=='새내기' and ui.text['RankWin/Paper/Mine/Value']=='Lv43 · 노말 액트 3' and dressed['RankWin/Paper/Mine/Avatar']=='m-3-1-2-2','내 순위 줄 = 18위 · 새내기 그림 · 이름 · 기록')
ok(lastLog('[VRF] rank rows')=='[VRF] rank rows kind=progress n=20 looks=15 shadow=5 myCell=18 mine=내 순위  18위 · Lv43 · 노말 액트 3','[VRF] rank rows 형식')
ok(ui.en['RankWin/Paper/List/Empty']==false,'목록이 있으면 안내 줄 꺼짐')
-- 내 칸은 이름·값이 같을 때만 (목록 캐시가 옛것이면 칠하지 않음)
W:OnData('progress',0,'가|9000|m-1-1;나|8000|;다|7000|m-1-1','2|7999','새내기|m-3-1-2-2')
ok(not has(ui.text[L..'2/Name'],'<color') and ui.color[L..'2'].a<0.2,'내 순위 2위인데 2위 칸이 남(나 8000)이면 칠하지 않음')
ok(ui.en[L..'4']==false and ui.en[L..'20']==false,'기록 3줄이면 칸 3만 켜짐')
-- 기록 없음 · 100위 밖
W.Kind='boss_ash_king'
W:OnData('boss_ash_king',0,'','none','새내기|m-3-1-2-2')
ok(ui.en['RankWin/Paper/List/Empty']==true and ui.text['RankWin/Paper/List/Empty']=='아직 기록이 없습니다' and ui.en[L..'1']==false,'기록 없는 판: 칸 다 꺼짐 + 「아직 기록이 없습니다」')
ok(ui.text['RankWin/Paper/Mine/Rank']=='-' and ui.text['RankWin/Paper/Mine/Value']=='기록 없음' and ui.en['RankWin/Paper/Mine/Avatar']==true,'내 순위 줄: 「-」 · 「기록 없음」 · 내 그림은 그대로')
ok(ui.text['RankWin/Paper/Head']=='재의 왕 고르바스 최단 처치  (노말)','보스 판 제목')
W:OnData('boss_ash_king',0,'가|90|m-1-1','-1|300','새내기|m-3-1-2-2')
ok(ui.text['RankWin/Paper/Mine/Rank']=='100위 밖' and ui.text['RankWin/Paper/Mine/Value']=='300초','내 순위 줄: 100위 밖 · 값')
-- 늦게 온 다른 판 답은 버린다
local before=ui.text['RankWin/Paper/Mine/Value']
W:OnData('progress',0,'가|9000|m-1-1','1|9000','새내기|m-3-1-2-2')
ok(ui.text['RankWin/Paper/Mine/Value']==before,'보고 있는 판이 아닌 답(성장)은 버림')
-- 심연 탭: 막대 · 제목
_GameData.depthEnabled=1
W:Show('depth')
ok(ui.en['RankWin/Paper/ActBar']==true and ui.pager.bar=='RankWin/Paper/ActBar' and ui.pager.title=='액트 2 · 모래 폐허','심연 탭: 머리 줄 오른쪽 막대 (지금 액트 2)')
ok(ui.text['RankWin/Paper/Head']=='최고 층 · 같은 층이면 빠른 순  (노말)','심연 판 제목 (머리 줄 왼쪽)')
ok(ui.text['RankWin/Paper/List/Empty']=='아직 기록이 없습니다' and ui.en[L..'1']==false and lastLog('[VRF] rank rows')=='[VRF] rank rows kind=depthrun_a2 n=0 looks=0 shadow=0 myCell=0 mine=내 순위  기록 없음','심연 액트 2 판(빈 판): 안내 줄 · [VRF] rank rows')
ui.en[L..'1']=true
W:Clear('불러오는 중…')
ok(ui.en[L..'1']==false and ui.text['RankWin/Paper/List/Empty']=='불러오는 중…' and ui.en['RankWin/Paper/Mine/Avatar']==false,'Clear: 칸 끄고 「불러오는 중…」 · 내 그림 끔 (서버 답이 오면 OnData가 채운다)')
W:Show('week')
ok(ui.text['RankWin/Paper/Head']=='이번 주 규칙 (3일 14시간 뒤 바뀜)  ·  노말\n망자의 주 — 정예 +50% · 그림자 추출 +5%p\n피의 달 — 몬스터 생명·공격 +15% · 이동 +10% · 그림자 추출 +8%p','이번 주 머리 줄 세 줄 (규칙 제목 · 규칙 둘)')
W:Show('progress')
ok(ui.en['RankWin/Paper/ActBar']==false,'성장 탭으로 돌아오면 막대 꺼짐')
_GameData.depthEnabled=0

-- ───────── 소스 · 빌드 짝 ─────────
local rs=read('RootDesk/MyDesk/Endgame/RankingSystem.mlua')
ok(not has(rs,'999999)') and has(rs,'ds:GetSortedAndWait(dir, 1, self.SortMax)'),'정렬 조회 상한 = SortMax')
local nameWrites=0 for _ in rs:gmatch('GetGlobalDataStorage%(self%.NameStore%):SetAsync') do nameWrites=nameWrites+1 end
ok(nameWrites==2,'이름 저장소 쓰는 곳 = Record · HideCharacter 둘뿐 (2차에 늘지 않음 · '..nameWrites..')')
local lookWrites=0 for _ in rs:gmatch('GetGlobalDataStorage%(self%.LookStore%):SetAsync') do lookWrites=lookWrites+1 end
ok(lookWrites==1,'외형 저장소 쓰는 곳 = WriteLook 하나 ('..lookWrites..')')
local mixed=0 for _,v in pairs(gn) do if v~='|hidden' and has(v,'|') then mixed=mixed+1 end end
ok(mixed==0,'이름 저장소 값에 외형(|)을 섞지 않는다 — 되돌린 예전 코드·예전 인스턴스가 「m-2-2-2-1」을 이름으로 보이지 않게')
local rw=read('RootDesk/MyDesk/UI/Windows/RankWindow.mlua')
ok(has(rw,'_CharSelectWindow:Dress(path, known and look or "m-1-1")'),'칸 그림 = 캐릭터 선택 카드와 같은 Dress')
local gen=read('tools/build/ui.cjs')
ok(has(gen,'require("./char-card.cjs").avatarOf(b)') and has(gen,'avatar(`${c}/Avatar`') and has(gen,'avatar(`${M}/Avatar`'),'생성기: 칸·내 순위 그림 = char-card avatarOf (UI 아바타 + 옷장)')
ok(not has(gen,'k.actPager("RankWin/ActBar"') and has(gen,'k.actPager(`${P}/ActBar`, "top-right"'),'생성기: 막대는 기록 판 머리 줄 오른쪽 (탭 아래 따로 두지 않음)')
ok(has(tok,'top: 20, cols: 4, rows: 5') and has(tok,'rimTop: 496'),'ui-tokens RANK 칸 4 × 5 · 테두리 위 끝 496')
print(string.format('[rank_window_2] 통과 %d', checks))
