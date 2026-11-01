-- 11-01 사용자 결정 1-B 「랭킹판 전체를 캐릭터 단위로」 회귀 검사 (docs/evidence/2026-11-01-rank-per-character/README.md) — 실제 mLua 본문으로:
--   키 = ProfileCode_c<슬롯>_<만든 시각 ms>(슬롯 요약 created · 실수로 읽혀도 같은 글자) · 판 이름 끝 _c1 · 이름 저장소 rank_names_c1 = 캐릭터 이름(계정 닉네임 아님) ·
--   예전 계정 키 판(rank_<kind>_<diff>)·이름(rank_names)은 읽기·쓰기 0 · 같은 계정 두 캐릭터가 따로 줄 · 「내 순위」 = 지금 캐릭터(반례: 예전엔 같은 계정 Lv60 지옥 줄) ·
--   연타 5초·Known은 캐릭터마다 · 캐릭터를 안 골랐으면 기록 안 함 · 슬롯 삭제(계정 저장 성공 때만) → 이름 감춤 · 기록 줄은 남김 · 같은 칸 새 캐릭터는 이어받지 않음 ·
--   감춘 줄이 상위 10에 섞이면 25줄까지 한 번 더 읽어 10줄 채움(평소 이름 조회 1번) · 내 순위에서 위 감춘 줄 빼기 · 보스·심연·이번 주 판도 캐릭터 단위 · [VRF] 형식
-- 엔진 DataStorage·UI는 대역 (정렬은 값 → 키 순) — 실제 저장소 정렬·동기화 지연은 메이커 확인(README 「메이커 확인 절차」)
-- @source RankingSystem Endgame/RankingSystem.mlua BoardName,DepthKind,CharId,RankKey,CharIdOf,CharName,Record,HideCharacter,ReadSorted,ReadNames,GetTop,MineDigest,RequestBoard,ShowBoard,ProgressValue,RecordProgress,ProgressText,RecordBossTime,RecordDepth,RecordDepthRun,RecordWeekRun
-- @source PlayerSave Player/PlayerSave.mlua RequestDeleteSlot,SlotInfo,PublishSlots,LookOf,AccountJson,Storage,CharName,DefaultName
-- @source RankWindow UI/Windows/RankWindow.mlua OnData,ValueText,MineText
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function read(path) local f=assert(io.open(path,'r')) local s=f:read('a') f:close() return s end
local function has(s,needle) return s:find(needle,1,true)~=nil end
function isvalid(x) return x~=nil and x~=false end
local logs={}
function log(s) table.insert(logs,s) end
function log_warning(s) table.insert(logs,'WARN '..s) end
function log_error(s) table.insert(logs,'ERR '..s) end
local function countLog(prefix) local n=0 for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then n=n+1 end end return n end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end

-- ───────── 대역: 게임 상수·의뢰·창 ─────────
_GameConst={ActCount=4,FinalBossSourceId='ash_king'}
local DIFF={[0]='노말','악몽','지옥'}
function _GameConst:DifficultyName(d) return DIFF[d] end
local QUEST_ACT={[1]=1,[5]=2,[9]=3,[12]=4}
_QuestData={Get=function(_,i) return {act=QUEST_ACT[i] or 1} end}
_GameData={GetMonsterName=function(_,id) return '재의 왕 고르바스' end}
_WeeklyRules={BoardKind=function(_,act,week) return 'weekrun_a'..act..'_w'..week end}
_UtilLogic={ElapsedSeconds=1000}
SortDirection={Descending=0,Ascending=1}
local ui={}
_UIKit={SetText=function(_,p,t) ui[p]=t end}
local notes={}
_Util={Notify=function(_,msg,uid) table.insert(notes,msg) end}
_HttpService={JSONEncode=function(_,t) return 'json' end}

-- ───────── 대역: DataStorage (이름별 저장소 · 모든 요청을 ops에 남긴다) ─────────
local sortable,globals,ops={}, {}, {}
local function sstore(name) sortable[name]=sortable[name] or {} return sortable[name] end
local function gstore(name) globals[name]=globals[name] or {} return globals[name] end
local function opsOn(name) local n=0 for _,o in ipairs(ops) do if o.name==name then n=n+1 end end return n end
local function opsOf(kind,name) local n=0 for _,o in ipairs(ops) do if o.kind==kind and (name==nil or o.name==name) then n=n+1 end end return n end
_DataStorageService={}
function _DataStorageService:GetSortableDataStorage(name)
 local s=sstore(name)
 return {
  GetAndWait=function(_,key) table.insert(ops,{kind='sget',name=name,key=key}) if s[key]~=nil then return 0,s[key] end return 1000002,0 end,
  SetAsync=function(_,key,value,cb) table.insert(ops,{kind='sset',name=name,key=key}) s[key]=value if cb then cb(0,key) end end,
  GetSortedAndWait=function(_,dir,lo,hi)
   table.insert(ops,{kind='sorted',name=name})
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
  SetAsync=function(_,key,value,cb) table.insert(ops,{kind='gset',name=name,key=key}) g[key]=value if cb then cb(0,key) end end,
  BatchGetAndWait=function(_,keys)
   table.insert(ops,{kind='gbatch',name=name,n=#keys})
   assert(#keys<=25,'이름 묶음 조회는 한 쪽(25) 안')
   local d={}
   for _,k in ipairs(keys) do if g[k]~=nil then d[#d+1]={KeyInfo={Key=k},Value=g[k]} end end
   return 0,{GetCurrentPageDatas=function() return d end}
  end,
 }
end
local accountSaveCode=0
function _DataStorageService:GetUserDataStorage(profile)
 return {BatchSetAndWait=function(_,kv) table.insert(ops,{kind='uset',name='user:'..profile}) return accountSaveCode,{} end}
end

-- ───────── 대역: 플레이어 (실제 PlayerSave.SlotInfo·CharName 본문을 쓴다) ─────────
local users={}
_UserService={GetUserEntityByUserId=function(_,uid) return users[uid] end}
local function makePlayer(profile,nick,uid,slots)
 local p={PlayerComponent={ProfileCode=profile,Nickname=nick,UserId=uid},comps={}}
 p.GetComponent=function(self,t) return self.comps[t] end
 local save=setmetatable({Entity=p,Slot=0,Account={slots=slots},LastSaved={},Grail={},GuideSeen=false,InputMode=0,GuideCards='',IsLoadSuccess=false,Selecting=false},{__index=PlayerSave})
 p.comps['script.PlayerSave']=save
 users[uid]=p
 return p,save
end
local function play(p,slot,level,maxDiff,questIndex)
 p.comps['script.PlayerSave'].Slot=slot
 p.comps['script.PlayerStats']={Level=level,MaxDifficulty=maxDiff,Difficulty=maxDiff}
 p.comps['script.PlayerQuest']={Diff=maxDiff,Index=questIndex,ByDiff={}}
end

-- 예전(11-01 전) 계정 키 기록: 같은 계정 「인꾸」가 Lv60 지옥 성장 · 지옥 보스 95초 (메이커에서 「새내기」로 열어도 이 줄이 내 순위로 나왔다)
sstore('rank_progress_0').ACC_A=6025
sstore('rank_boss_ash_king_2').ACC_A=95
gstore('rank_names').ACC_A='인꾸'

-- ───────── 1. 캐릭터 id ─────────
local RS=RankingSystem
ok(RS.NameStore=='rank_names_c1' and RS.BoardSuffix=='_c1' and RS.HiddenName=='|hidden' and RS.NameScanMax==25,'새 이름 저장소·판 접미·감춤 표시·이름 조회 상한')
ok(RS:CharId(4,{created=63928683821328})=='c4_63928683821328','id = c<슬롯>_<만든 시각 ms>')
ok(RS:CharId(4,{created=6.3928683821328e13})=='c4_63928683821328','JSON에서 실수로 읽혀도 같은 id (14자리 < 2^53)')
ok(RS:CharId(4,{created='63928683821328'})=='c4_63928683821328','글자로 읽혀도 같은 id')
ok(RS:CharId(0,{created=1})=='' and RS:CharId(2,nil)=='' and RS:CharId(2,{})=='' and RS:CharId(2,{created=0})=='','슬롯 0 · 요약 없음 · created 없음 → 빈 id (기록 안 함)')
ok(RS:CharId(1,{created=63928683821328})~=RS:CharId(4,{created=63928683821328}),'슬롯이 다르면 다른 id')
ok(RS:CharId(4,{created=63928683821328})~=RS:CharId(4,{created=63929000000000}),'같은 칸에 새로 만들면(새 시각) 다른 id')
ok(RS:RankKey('ACC_A','c4_1')=='ACC_A_c4_1','키 = 계정 ProfileCode_캐릭터 id')
ok(RS:BoardName('progress',0)=='rank_progress_0_c1' and RS:BoardName('boss_ash_king',2)=='rank_boss_ash_king_2_c1','판 이름 끝 _c1')

-- ───────── 2. 같은 계정 두 캐릭터 + 다른 계정 · 성장 기록 ─────────
local A,AS=makePlayer('ACC_A','인꾸','uA',{
 ['1']={name='인꾸',lv=17,diff=0,created=63927142517160},
 ['4']={name='새내기',lv=40,diff=0,created=63928683821328,look='m-3-1-2-2'},
})
local B=makePlayer('ACC_B','남','uB',{['1']={name='해골왕',lv=25,diff=1,created=63927000000000}})
local A4='ACC_A_c4_63928683821328'
local A1='ACC_A_c1_63927142517160'
local B1='ACC_B_c1_63927000000000'
play(A,4,40,0,9)
RS:RecordProgress(A)
ok(sstore('rank_progress_0_c1')[A4]==4003,'새내기 Lv40 노말 액트 3 → 캐릭터 키 줄 4003')
ok(gstore('rank_names_c1')[A4]=='새내기','이름 = 캐릭터 이름 (계정 닉네임 「인꾸」 아님)')
ok(lastLog('[VRF] rank record')=='[VRF] rank record board=rank_progress_0_c1 char=c4_63928683821328 name=새내기 value=4003 prev=nil','[VRF] rank record 형식 (새 판 첫 기록 prev=nil)')
play(A,1,17,0,5)
RS:RecordProgress(A)
ok(sstore('rank_progress_0_c1')[A1]==1702 and gstore('rank_names_c1')[A1]=='인꾸','같은 계정 1번 캐릭터 「인꾸」는 따로 줄 1702')
play(B,1,25,1,9)
RS:RecordProgress(B)
ok(sstore('rank_progress_0_c1')[B1]==2513,'다른 계정 해골왕 Lv25 악몽 액트 3')
local before=opsOf('sget','rank_progress_0_c1')
play(A,4,40,0,9)
RS:RecordProgress(A)
ok(opsOf('sget','rank_progress_0_c1')==before and opsOf('sset','rank_progress_0_c1')==3,'같은 값 다시: Known(캐릭터 키)로 조회·쓰기 0')
play(A,4,41,0,9)
RS:RecordProgress(A)
ok(sstore('rank_progress_0_c1')[A4]==4103 and opsOf('gset','rank_names_c1')==3,'레벨 오름 → 값만 다시 씀 (이름은 세션에 한 번)')
ok(has(lastLog('[VRF] rank record'),'value=4103 prev=4003'),'prev = 이전 기록')
local noChar=makePlayer('ACC_C','고른적없음','uC',{})
local n0=#ops
RS:Record(noChar,RS:BoardName('progress',0),500,false)
ok(#ops==n0 and lastLog('[VRF] rank record skip')=='[VRF] rank record skip board=rank_progress_0_c1 reason=nochar','캐릭터를 안 골랐으면(슬롯 0) 저장소 요청 0 + skip 로그')

-- ───────── 3. 랭킹 창 (실제 RequestBoard → GetTop·MineDigest → ShowBoard → RankWindow.OnData) ─────────
local function open(uid,kind,diff)
 senderUserId=uid
 RankWindow.Kind=kind
 RS:RequestBoard(kind,diff)
 return ui['RankWin/Paper/List'],ui['RankWin/Paper/Mine']
end
local g0=opsOf('gbatch','rank_names_c1')
local list,mine=open('uA','progress',0)
ok(has(list,' 1.  새내기   Lv41 · 노말 액트 3') and has(list,' 2.  해골왕   Lv25 · 악몽 액트 3') and has(list,' 3.  인꾸   Lv17 · 노말 액트 2'),'상위 목록: 같은 계정 두 캐릭터가 따로 줄 · 캐릭터 이름')
ok(not has(list,'Lv60'),'예전 계정 키 줄(인꾸 Lv60 지옥)은 새 판에 없음')
ok(mine=='내 순위  1위 · Lv41 · 노말 액트 3','「내 순위」 = 지금 캐릭터 새내기 (반례: 예전엔 같은 계정 Lv60 지옥 줄)')
ok(opsOf('gbatch','rank_names_c1')==g0+1,'감춘 줄이 없으면 이름 조회 1번 (예전과 같은 비용)')
ok(lastLog('[VRF] rank top')=='[VRF] rank top board=rank_progress_0_c1 rows=3 shown=3 hidden=0 names=3','[VRF] rank top 형식')
ok(lastLog('[VRF] rank char')=='[VRF] rank char board=rank_progress_0_c1 char=c4_63928683821328 name=새내기 hiddenAbove=0','[VRF] rank char 형식 (지금 캐릭터 id·이름)')
ok(lastLog('[VRF] rank mine')=='[VRF] rank mine board=rank_progress_0_c1 rank=1 value=4103','[VRF] rank mine 형식 그대로 (판 이름만 _c1)')
-- 같은 계정, 캐릭터를 1번 「인꾸」로 바꿔 1초 뒤 다시 연다: 연타 방지(5초)는 캐릭터마다라 새내기 답을 돌려주지 않는다
_UtilLogic.ElapsedSeconds=1001
play(A,1,17,0,5)
local s0=opsOf('sorted','rank_progress_0_c1')
list,mine=open('uA','progress',0)
ok(mine=='내 순위  3위 · Lv17 · 노말 액트 2','캐릭터를 바꾸면 「내 순위」도 그 캐릭터 (5초 안이어도)')
ok(opsOf('sorted','rank_progress_0_c1')==s0+1,'목록은 60초 캐시 · 내 순위는 정렬 첫 쪽 새로 1번')
local m0=countLog('[VRF] rank mine')
_UtilLogic.ElapsedSeconds=1003
open('uA','progress',0)
ok(countLog('[VRF] rank mine')==m0 and opsOf('sorted','rank_progress_0_c1')==s0+1,'같은 캐릭터 5초 안 연타 → 방금 답 그대로 (조회·로그 0)')

-- ───────── 4. 보스·심연·이번 주 판 ─────────
play(A,4,41,2,12)
RS:RecordBossTime(A,2,120)
ok(sstore('rank_boss_ash_king_2_c1')[A4]==120 and gstore('rank_names_c1')[A4]=='새내기','보스 처치 시간: 캐릭터 단위 판에 새내기 120초')
RS:RecordBossTime(A,2,130)
ok(sstore('rank_boss_ash_king_2_c1')[A4]==120,'보스는 짧을수록 좋음 — 130초는 안 씀')
RS:RecordDepthRun(A,0,1,7,185)
ok(sstore('rank_depthrun_a1_0_c1')[A4]==7*100000+99999-185,'심연 도전 판 rank_depthrun_a1_0_c1')
RS:RecordWeekRun(A,0,1,2901,7,185)
ok(sstore('rank_weekrun_a1_w2901_0_c1')[A4]~=nil,'이번 주 판 rank_weekrun_a1_w2901_0_c1')
RS:RecordDepth(A,0,1,7)
ok(sstore('rank_depth_a1_0_c1')[A4]==7,'최고 층 판 rank_depth_a1_0_c1')
_UtilLogic.ElapsedSeconds=1100
play(A,1,17,0,5)
list,mine=open('uA','boss_ash_king',2)
ok(has(list,' 1.  새내기   120초') and mine=='내 순위  기록 없음','1번 「인꾸」로 보스 탭: 목록엔 새내기 120초 · 내 순위는 기록 없음 (예전 계정 95초도, 새내기 기록도 이어받지 않음)')
ok(lastLog('[VRF] rank mine')=='[VRF] rank mine board=rank_boss_ash_king_2_c1 rank=0 value=0','보스 기록 없음 로그')
play(A,4,41,2,12)
list,mine=open('uA','boss_ash_king',2)
ok(mine=='내 순위  1위 · 120초','4번 새내기로 보스 탭: 1위 · 120초')

-- ───────── 5. 예전 계정 키 기록은 그대로 (읽기·쓰기 0) ─────────
ok(opsOn('rank_progress_0')==0 and opsOn('rank_boss_ash_king_2')==0 and opsOn('rank_names')==0,'예전 판·이름 저장소 요청 0')
ok(sstore('rank_progress_0').ACC_A==6025 and sstore('rank_boss_ash_king_2').ACC_A==95 and gstore('rank_names').ACC_A=='인꾸','예전 기록 값 그대로 (되돌리기용)')

-- ───────── 6. 캐릭터 삭제 (실제 PlayerSave.RequestDeleteSlot) ─────────
AS.Slot=0
AS.Selecting=true
senderUserId='uA'
accountSaveCode=1000004
AS:RequestDeleteSlot(4)
ok(gstore('rank_names_c1')[A4]=='새내기' and countLog('[VRF] rank hide')==0,'계정 저장 실패 → 감추지 않음 (다음 접속에 슬롯이 돌아온다)')
AS.Account.slots['4']={name='새내기',lv=41,diff=2,created=63928683821328}
accountSaveCode=0
AS:RequestDeleteSlot(4)
ok(gstore('rank_names_c1')[A4]=='|hidden' and lastLog('[VRF] rank hide')=='[VRF] rank hide char=c4_63928683821328','저장 성공 → 이름 자리 감춤 + [VRF] rank hide')
ok(AS:SlotInfo(4)==nil and notes[#notes]=='캐릭터 「새내기」 삭제','슬롯 삭제 자체는 예전 그대로')
ok(sstore('rank_progress_0_c1')[A4]==4103 and sstore('rank_boss_ash_king_2_c1')[A4]==120,'기록 줄은 지우지 않는다 (Delete 요청 0)')
ok(opsOf('sdel')==0,'Delete 요청 0')
_UtilLogic.ElapsedSeconds=1110
list,mine=open('uB','progress',0)
ok(not has(list,'새내기') and has(list,' 1.  해골왕   Lv25 · 악몽 액트 3') and has(list,' 2.  인꾸   Lv17 · 노말 액트 2'),'지운 캐릭터 줄은 목록에서 빠지고 순위가 당겨짐 (60초 캐시도 비움)')
ok(mine=='내 순위  1위 · Lv25 · 악몽 액트 3' and lastLog('[VRF] rank char')=='[VRF] rank char board=rank_progress_0_c1 char=c1_63927000000000 name=해골왕 hiddenAbove=1','내 순위도 위 감춘 줄을 빼고 1위')
-- 같은 칸 4번에 새 캐릭터 (같은 이름 「새내기」라도 새 만든 시각 → 새 id)
AS.Account.slots['4']={name='새내기',lv=1,diff=0,created=63929000000000}
AS.Selecting=false
play(A,4,1,0,1)
_UtilLogic.ElapsedSeconds=1120
list,mine=open('uA','progress',0)
ok(mine=='내 순위  기록 없음','새 캐릭터는 옛 「새내기」 기록을 이어받지 않음 (이번 답은 기록 없음 + 성장 기록 한 번)')
ok(sstore('rank_progress_0_c1')['ACC_A_c4_63929000000000']==101 and gstore('rank_names_c1')['ACC_A_c4_63929000000000']=='새내기','내 순위 조회가 새 캐릭터 성장 기록을 한 번 적음 (새 키)')
ok(gstore('rank_names_c1')[A4]=='|hidden','옛 캐릭터 감춤 그대로')
_UtilLogic.ElapsedSeconds=1200
list,mine=open('uA','progress',0)
ok(mine=='내 순위  3위 · Lv1 · 노말 액트 1' and not has(list,'Lv41'),'다시 열면 새 캐릭터 순위 · 옛 줄은 계속 감춤')
list,mine=open('uA','boss_ash_king',2)
ok(mine=='내 순위  기록 없음' and has(list,'아직 기록이 없습니다'),'보스 판: 지운 캐릭터 120초 줄 감춤 · 새 캐릭터 기록 없음')

-- ───────── 7. 감춘 줄이 상위 10에 섞이면 25줄까지 더 읽어 채움 ─────────
local board=RS:BoardName('boss_ash_king',0)
local bs=sstore(board)
local gn=gstore('rank_names_c1')
for i=1,14 do local k='P'..i..'_c1_1' bs[k]=100+i gn[k]='P'..i end
gn['P2_c1_1']='|hidden'
gn['P5_c1_1']='|hidden'
local C=makePlayer('P7','칠','u7',{['1']={name='P7',created=1}})
play(C,1,50,0,12)
local gb=opsOf('gbatch','rank_names_c1')
_UtilLogic.ElapsedSeconds=1300
list,mine=open('u7','boss_ash_king',0)
local shown=0 for _ in string.gmatch(list,'\n%s*%d+%.  ') do shown=shown+1 end
ok(shown==10 and not has(list,'P2 ') and not has(list,'P5 ') and has(list,'10.  P12   112초'),'감춘 2줄을 건너뛰고 11·12번째 줄로 10줄 채움')
ok(opsOf('gbatch','rank_names_c1')==gb+2,'이름 조회 2번 (첫 10줄 + 나머지 25줄까지)')
ok(lastLog('[VRF] rank top')=='[VRF] rank top board=rank_boss_ash_king_0_c1 rows=14 shown=10 hidden=2 names=14','[VRF] rank top hidden=2')
ok(mine=='내 순위  5위 · 107초','내 순위 = 7번째 줄 − 위 감춘 2줄 = 5위')

-- ───────── 8. 이름 구분 문자 · 소스 확인 ─────────
local D,DS=makePlayer('ACC_D','닉','uD',{['1']={name='a|b;c',created=5}})
DS.Slot=1
ok(RS:CharName(D)=='abc','이름의 | ; 는 걸러 다이제스트를 깨지 않는다 (감춤 표시 |hidden과 겹칠 수 없음)')
local rs=read('RootDesk/MyDesk/Endgame/RankingSystem.mlua')
ok(not has(rs,'local key = pc.ProfileCode') and not has(rs,'local key = player.PlayerComponent.ProfileCode\n'),'계정 키만으로 기록·조회하던 줄 없음')
local codeLines=0
for line in rs:gmatch('[^\n]+') do
 local code=line:gsub('%-%-.*$','')
 if code:find('ProfileCode',1,true) then
  codeLines=codeLines+1
  ok(has(code,'self:RankKey(player.PlayerComponent.ProfileCode, id)'),'ProfileCode는 캐릭터 id와 묶어서만 키로: '..code)
 end
end
ok(codeLines==2,'ProfileCode 코드 줄 = Record·MineDigest 2곳 ('..codeLines..')')
ok(not has(rs,'DeleteAsync') and not has(rs,'DeleteAndWait'),'기록을 지우는 요청 없음')
local ps=read('RootDesk/MyDesk/Player/PlayerSave.mlua')
ok(has(ps,'if code == 0 then\n            self.LastSaved["Account"] = json\n') and has(ps,'_RankingSystem:HideCharacter(self.Entity.PlayerComponent.ProfileCode, slot, info)'),'PlayerSave 삭제: 계정 저장 성공 안에서만 감춤')
ok(has(ps,'created = DateTime.UtcNow.Elapsed, look = safeLook') and has(ps,'created = DateTime.UtcNow.Elapsed, legacy = 1'),'만들기·예전 저장 옮기기 둘 다 created를 적는다 (캐릭터 id 바탕)')
print(string.format('[rank_per_character] 통과 %d', checks))
