#!/usr/bin/env python3
"""랭킹 창 오프라인 미리보기 2/3: 실제 RankWindow·RankingSystem mLua 본문(지금 작업트리 또는 git 리비전)을 Lua 5.4로 돌려
창을 연 뒤의 UI 상태(글·켜짐·자리·크기·색·입힌 외형)를 장면마다 JSON으로 남긴다. 저장소·엔진 UI는 대역 (tests/quality/run.py와 같은 export).
사용: python3 export_state.py --lua /path/to/lua <out.json> [git 리비전]
"""
import json, pathlib, re, subprocess, sys, tempfile, argparse
ROOT = pathlib.Path(__file__).resolve().parents[4]
ap = argparse.ArgumentParser()
ap.add_argument('--lua', required=True)
ap.add_argument('out')
ap.add_argument('rev', nargs='?')
a = ap.parse_args()

def source(rel):
    if a.rev: return subprocess.run(['git', 'show', f'{a.rev}:RootDesk/MyDesk/{rel}'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return (ROOT / 'RootDesk/MyDesk' / rel).read_text()

def export(script, src, methods):
    # tests/quality/run.py export와 같은 규칙 (속성 기본값 + 메서드 본문, 이름 끝 + = 본문이 부르는 self: 메서드까지)
    out = [f'{script} = {{}}', f'_{script} = {script}']
    for typ, name, value in re.findall(r'^    property (\w+) (\w+) = (.*)$', src, re.M):
        out.append(f'{script}.{name} = ' + value.split(' --')[0].rstrip())
    HEAD = r'^    (?:method [^\n]+? |handler )'
    available = set(re.findall(HEAD + r'(\w+)\(', src, re.M))
    selected = []
    def include(name, recursive=False):
        if name in selected or name not in available: return
        selected.append(name)
        if recursive:
            body = re.search(HEAD + re.escape(name) + r'\([^\n]*\)\n(.*?)^    end$', src, re.M | re.S)
            for child in re.findall(r'self:(\w+)\(', body[1]): include(child, True)
    for m in methods: include(m.rstrip('+'), m.endswith('+'))
    for name in selected:
        m = re.search(HEAD + re.escape(name) + r'\(([^\n]*)\)\n(.*?)^    end$', src, re.M | re.S)
        args = [p.split('=')[0].split()[-1] for p in m[1].split(',') if p.strip()]
        out.append(f'function {script}:{name}({",".join(args)})\n{m[2]}end')
    return '\n'.join(out)

rank = export('RankingSystem', source('Endgame/RankingSystem.mlua'), ['RequestBoard+', 'Record+', 'RecordProgress+', 'RecordBossTime+', 'RecordDepthRun+', 'DepthKind', 'ProgressText'])
win = export('RankWindow', source('UI/Windows/RankWindow.mlua'), ['OnBeginPlay+', 'LayoutTabs+', 'Show+', 'OnData+', 'Layout+'])
save = export('PlayerSave', source('Player/PlayerSave.mlua'), ['SlotInfo', 'LookOf', 'Look', 'CharName'])

SCENES = r'''
local function snap(name)
 local function enc(v)
  if type(v)=='table' then local p={} for k,x in pairs(v) do p[#p+1]=string.format('%q:%s',tostring(k),enc(x)) end return '{'..table.concat(p,',')..'}' end
  if type(v)=='string' then return (string.format('%q',v):gsub('\\\n','\\n')) end
  if type(v)=='boolean' then return tostring(v) end
  if v==nil then return 'null' end
  return string.format('%.4f',v)
 end
 scenes[#scenes+1]='{"name":'..enc(name)..',"text":'..enc(ui.text)..',"en":'..enc(ui.en)..',"pos":'..enc(ui.pos)..',"size":'..enc(ui.size)..',"color":'..enc(ui.color)..',"dressed":'..enc(dressed)..',"tint":'..enc(tint)..'}'
end
'''

FIX = r'''
function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
function Vector2(x,y) return {x=x,y=y} end
function isvalid(x) return x~=nil and x~=false end
function log() end function log_warning() end
scenes={}
_GameConst={ActCount=4,FinalBossSourceId='ash_king'}
local DIFF={[0]='노말','악몽','지옥'}
function _GameConst:DifficultyName(d) return DIFF[d] end
function _GameConst:ActRegionName(x) return ({'무덤 왕국','모래 폐허','소금 바다','잿빛 왕좌'})[x] end
local QA={[1]=1,[5]=2,[9]=3,[12]=4}
_QuestData={Get=function(_,i) return {act=QA[i] or 1} end}
_GameData={depthEnabled=0,GetMonsterName=function() return '재의 왕 고르바스' end}
_WeeklyRules={BoardKind=function(_,act,w) return 'weekrun_a'..act..'_w'..w end,CurrentWeek=function() return 2901 end,EndsIn=function() return '3일 14시간 뒤 바뀜' end,
 Describe=function(_,w,sep) return '망자의 주 — 정예 +50% · 그림자 추출 +5%p'..sep..'피의 달 — 몬스터 생명·공격 +15% · 이동 +10% · 그림자 추출 +8%p' end}
_UtilLogic={ElapsedSeconds=1000}
SortDirection={Descending=0,Ascending=1}
ui={text={},en={},pos={},size={},color={}}
dressed={} tint={}
local avatars={}
_UIKit={RegisterWindow=function() end,Connect=function() end,Open=function() end,Close=function() end,IsOpen=function() return true end,
 SetText=function(_,p,t) ui.text[p]=t end,SetEnabled=function(_,p,v) ui.en[p]=v end,SetColor=function(_,p,c) ui.color[p]=c end,
 SetPos=function(_,p,v) ui.pos[p]=v end,SetSize=function(_,p,v) ui.size[p]=v end,Colored=function(_,h,t) return '<color='..h..'>'..t..'</color>' end,
 Get=function(_,p) if p:sub(-7)=='/Avatar' then avatars[p]=avatars[p] or {AvatarGUIRendererComponent=setmetatable({},{__newindex=function(_,k,v) if k=='Color' then tint[p]=v end end})} return avatars[p] end end,
 Comp=function(_,n) if n=='script.PlayerStats' then return {Difficulty=0} end if n=='script.PlayerTravel' then return {Act=2} end end,
 SetActPager=function(_,bar,act,count,title) ui.text[bar..'/Title']=title ui.text[bar..'/Prev']='◀' ui.text[bar..'/Next']='▶' end}
_CharSelectWindow={Dress=function(_,p,l) dressed[p]=l end}
local S,G={}, {}
local function ss(n) S[n]=S[n] or {} return S[n] end
local function gs(n) G[n]=G[n] or {} return G[n] end
_DataStorageService={GetSortableDataStorage=function(_,n) local s=ss(n) return {
 GetAndWait=function(_,k) if s[k] then return 0,s[k] end return 1000002,0 end, SetAsync=function(_,k,v) s[k]=v end,
 GetSortedAndWait=function(_,dir,lo,hi) local r={} for k,v in pairs(s) do if v>=lo and v<=hi then r[#r+1]={k=k,v=v} end end
  table.sort(r,function(x,y) if x.v==y.v then return x.k<y.k end if dir==SortDirection.Ascending then return x.v<y.v end return x.v>y.v end)
  local pg={} for i=1,math.min(100,#r) do pg[i]={KeyInfo={Key=r[i].k},Value=r[i].v} end return 0,{GetCurrentPageDatas=function() return pg end} end} end,
 GetGlobalDataStorage=function(_,n) local g=gs(n) return {SetAsync=function(_,k,v) g[k]=v end,
  BatchGetAndWait=function(_,keys) local d={} for _,k in ipairs(keys) do if g[k] then d[#d+1]={KeyInfo={Key=k},Value=g[k]} end end return 0,{GetCurrentPageDatas=function() return d end} end} end}
local users={}
_UserService={GetUserEntityByUserId=function(_,u) return users[u] end}
_RankingSystem=RankingSystem
RankingSystem.ShowBoard=function(_,kind,diff,dg,mine,me) RankWindow:OnData(kind,diff,dg,mine,me) end
local me={PlayerComponent={ProfileCode='ME',Nickname='인꾸',UserId='uMe'},comps={}}
me.GetComponent=function(self,t) return self.comps[t] end
me.comps['script.PlayerSave']=setmetatable({Entity=me,Slot=4,Account={slots={['4']={name='새내기',lv=40,diff=0,created=63928683821328,look='m-3-1-2-2'}}}},{__index=PlayerSave})
me.comps['script.PlayerStats']={Level=40,MaxDifficulty=0,Difficulty=0}
me.comps['script.PlayerQuest']={Diff=0,Index=12,ByDiff={}}
users.uMe=me
senderUserId='uMe'
-- 다른 사람 (예시 이름 · 외형 섞음 · 3줄마다 외형 없는 옛 줄)
local NAMES={'해골군주','재의망령','모르그','숯고양이','검은로브','뼈피리','망자왕','소금바람','유황여왕','그레이브','잿빛손','혼불','고드릭','붉은달','달그림자','부서진왕관','묘지기','늪의혼','하르크','오렌'}
local nb,bb,db,gn,gl=ss('rank_progress_0_c1'),ss('rank_boss_ash_king_0_c1'),ss('rank_depthrun_a2_0_c1'),gs('rank_names_c1'),gs('rank_looks_c1')
for i,n in ipairs(NAMES) do
 local k='P'..i..'_c1_1'
 nb[k]=(62-i)*100+(i%3)*10+((i%4)+1)
 bb[k]=60+i*7
 if i<=9 then db[k]=(14-i)*100000+(99999-(120+i*37)) end
 gn[k]=n
 if i%3~=0 then gl[k]=((i%2==0) and 'f' or 'm')..'-'..(i%5+1)..'-'..(i%3+1)..'-'..(i%7+1)..'-'..(i%4+1) end
end
RankingSystem:RecordProgress(me)
RankingSystem:RecordBossTime(me,0,131)
'''

RUN_NEW = r'''
RankWindow:OnBeginPlay()
RankWindow:Show('progress') snap('after_progress_2tabs')
RankWindow:Show('boss_ash_king') snap('after_boss_2tabs')
_GameData.depthEnabled=1
RankWindow:LayoutTabs(true)
for _,t in ipairs({'TabDepth','TabWeek'}) do ui.en['RankWin/'..t]=true end
RankWindow:Show('progress') snap('after_progress_4tabs')
RankWindow:Show('depth') snap('after_depth_4tabs')
RankWindow:Show('week') snap('after_week_4tabs')
'''
RUN_OLD = r'''
RankWindow:OnBeginPlay()
RankWindow:Show('boss_ash_king') snap('before_boss_2tabs')
RankWindow:Show('progress') snap('before_progress_2tabs')
_GameData.depthEnabled=1
RankWindow:LayoutTabs(true)
for _,t in ipairs({'TabDepth','TabWeek'}) do ui.en['RankWin/'..t]=true end
RankWindow:Show('depth') snap('before_depth_4tabs')
'''
script = '\n'.join([FIX.split("local S,G")[0], rank, win, save, SCENES, 'local S,G' + FIX.split('local S,G')[1], RUN_OLD if a.rev else RUN_NEW, 'print("["..table.concat(scenes,",").."]")'])
with tempfile.TemporaryDirectory() as tmp:
    f = pathlib.Path(tmp) / 'scene.lua'
    f.write_text(script)
    r = subprocess.run([a.lua, str(f)], cwd=ROOT, capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr)
data = json.loads(r.stdout)
pathlib.Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=1))
print(f'[export_state] {a.rev or "worktree"} 장면 {len(data)}개 → {a.out}')
