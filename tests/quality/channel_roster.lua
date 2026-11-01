-- 11-01 사용자 요청 「같은 채널이면 전부 보이게 · 누구에게나 파티 · 이미 파티인 사람 표시」 회귀 검사 (docs/evidence/2026-11-01-channel-players) — 실제 mLua 본문으로:
--   ① 원인 재현 · 채널 목록: 방마다 따로 도는 PartySystem은 _UserService(같은 방 사람)만 안다 → 방마다 자기 칸을 채널 공유 메모리 ChannelRosterV1/roster에
--      쓰고(WriteChannel · ETag 다시 시도) 창이 열린 방만 읽어(SendChannel) 모든 방 사람을 보인다. 오래된 칸·없는 방·두 칸 중복 정리 · 빈 표 JSON 실패 피하기.
--   ② 쓰기 시점(ChannelWriteDue): 사람·파티 바뀜 3초 · 레벨만 60초 모아서 · 그대로면 300초 · 나가면 칸 지우기 · 실패하면 30초 쉼.
--   ③ 화면(SocialWindow): 파티끼리 같은 색·붙여 정렬·「파티 · N명」 · 내 파티 맨 위 · 혼자 기본색 · 8줄 쪽 넘김(묶음 안 갈라짐) · 다른 방 줄 결투·거래·살펴보기 없음.
--   ④ 초대: 같은 방 = 파티 초대(PlayerSocial) · 다른 방 = 방 사이 이벤트(ChannelInviteEvent) → 받은 요청 창(game) → 수락(게임 방 = 로비 거쳐 · 로비 = 바로)/거절 →
--      초대한 사람에게 결과 · 못 하는 경우(게임 밖·쓰러짐·심연·가득·난이도·같은 파티) · 같은 상대 20초 쿨다운 · 바쁨·없음 답.
--   ⑤ 색 토큰(ui-tokens PARTY ↔ SocialWindow) 대비·구분 · 배치(SOCIAL) · ⑥ 공유 메모리 호출 수 (월드 분당 1000번 한도의 몇 %) — 표를 찍는다.
-- 엔진은 대역: 공유 메모리(ETag)·방 사이 이벤트·타이머·JSON·UI·방 이동. 실제 이벤트 전달·화면·방 이동은 메이커 (docs/evidence/2026-11-01-channel-players/README.md).
-- @source GameConst Common/GameConst.mlua RoomKind,InGameRoom,ParseDepthKey,DifficultyName
-- @source PartySystem Social/PartySystem.mlua RefreshRoster,NameOf,PlaceName,Social,Join,Leave,Refresh,HandleUserLeaveEvent,ChannelLive,ChannelDigests,ChannelWriteDue,MaybeWriteChannel,WriteChannel,ChannelSection,ChannelMemoryObj,EncodeChannel,ReadChannel,MutateChannel,RoomAliveFn,RoomState,PruneChannel,CleanName,ChannelEntries,WhereText,InviteContext,InviteCode,InviteRefusal,ChannelRowsFor,ChannelNow,FindChannelEntry,RequestChannel,SendChannel,InviteCooling,MarkInvite
-- @source PlayerSocial Social/PlayerSocial.mlua RequestAction,SendRequest,RespondRequest,LevelOf,DuelLevelOk,RequestLeaveParty
-- @source TownBoard Social/TownBoard.mlua RequestChannelInvite+,OnChannelEvent+,AnswerInvite+,ReplyText
-- @source SocialWindow UI/Windows/SocialWindow.mlua Social,Poll,PollInterval,Ask,OnChannel,ParseRows,Colors,BuildView,Paginate,SummaryText,RowState,HexColor,SetClickable,Render,Turn,Act,Respond,RenderRequest
local checks=0
local function ok(c,msg) if not c then error('FAIL: '..msg,2) end checks=checks+1 end
local function eq(a,b,msg) if a~=b then error('FAIL: '..msg..' — got ['..tostring(a)..'] want ['..tostring(b)..']',2) end checks=checks+1 end
local function read(p) local f=assert(io.open(p,'r')) local s=f:read('a') f:close() return s end
local function has(s,needle) return s~=nil and s:find(needle,1,true)~=nil end
local logs={}
function log(s) table.insert(logs,s) end
function log_warning(s) end
function isvalid(x) return x~=nil and x~=false end
function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end
local function countLog(prefix) local n=0 for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then n=n+1 end end return n end

-- ───────── 엔진 대역: 시계 · 타이머 · 공유 메모리 · JSON · 방 · 사람 ─────────
local clock=0
_UtilLogic=setmetatable({},{__index=function(_,k) if k=='ElapsedSeconds' then return clock end end})
DateTime=setmetatable({},{__index=function(_,k) if k=='UtcNow' then return {Elapsed=1.7e12+clock*1000} end end})
SharedMemoryResultCode={OK=0,NotFound=1000002,AlreadyExists=1000007,PreconditionFailed=1000008,ResourceExhausted=1000005}
SendEventRequestResultCode={OK=0,BadRequest=1000003}
function SharedVariableKeyInfo(name,etag) return {Name=name,ETag=etag} end
local function deep(t) if type(t)~='table' then return t end local o={} for k,v in pairs(t) do o[k]=deep(v) end return o end
-- 방 사이 이벤트 = 실제 ChannelInviteEvent 속성 그대로 (이름 오타·빠진 속성이면 여기서 걸린다)
local eventProps={}
for typ,name,val in read('RootDesk/MyDesk/Social/ChannelInviteEvent.mlua'):gmatch('\n    property (%w+) (%w+) = ([^\n]-)%s*%-%-') do eventProps[name]=(typ=='integer') and tonumber(val) or val:match('^"(.*)"$') end
function ChannelInviteEvent() return setmetatable(deep(eventProps),{__newindex=function(_,k) error('ChannelInviteEvent에 없는 속성 '..tostring(k)) end}) end
ok(eventProps.Kind=='' and eventProps.Diff==0 and eventProps.Code=='' and eventProps.FromRoom=='','ChannelInviteEvent 속성 8개 읽음')

local queue={}
local ctx=nil
local use
local function newMemory(name)
 local m={name=name,vars={},calls=0,seq=0,hook=nil,fail=nil}
 function m:GetVariableAndWait(n) self.calls=self.calls+1 local v=self.vars[n] and {etag=self.vars[n].etag,value=self.vars[n].value} or nil
  local h=self.hook self.hook=nil if h then h() end   -- 다른 방이 이 사이에 쓴다 (ETag 다시 시도)
  if self.fail then return {Code=self.fail} end
  if v==nil then return {Code=SharedMemoryResultCode.NotFound} end
  return {Code=0,Info={ETag=v.etag,Value=v.value,Name=n}} end
 function m:CreateVariableAndWait(n,value) self.calls=self.calls+1 if self.vars[n] then return {Code=SharedMemoryResultCode.AlreadyExists} end
  self.seq=self.seq+1 self.vars[n]={value=value,etag='e'..self.seq} return {Code=0,Info={ETag='e'..self.seq}} end
 function m:UpdateVariableAndWait(key,value) self.calls=self.calls+1 local v=self.vars[key.Name]
  if v==nil or v.etag~=key.ETag then return {Code=SharedMemoryResultCode.PreconditionFailed} end
  self.seq=self.seq+1 v.value=value v.etag='e'..self.seq return {Code=0,Info={ETag=v.etag}} end
 function m:SetVariableAndWait(n,value) self.calls=self.calls+1 self.seq=self.seq+1 self.vars[n]={value=value,etag='e'..self.seq} return {Code=0} end
 return m
end
local memories={}
local function memoryOf(name) memories[name]=memories[name] or newMemory(name) return memories[name] end
-- JSON: 표를 그대로 보관 (MSW처럼 빈 표가 하나라도 있으면 실패 — 메이커 실측 LEA-3001)
local jstore,jn={},0
local function noEmpty(t) for k,v in pairs(t) do if type(v)=='table' then if next(v)==nil then error('LEA-3001 빈 표 '..tostring(k)) end noEmpty(v) end end end
_HttpService={JSONEncode=function(_,t) if next(t)==nil then error('LEA-3001 빈 표') end noEmpty(t) jn=jn+1 local id='json#'..jn jstore[id]=deep(t) return id end,
 JSONDecode=function(_,s) if s=='{"v":1}' then return {v=1} end local t=jstore[s] if t==nil then error('JSON 아님 '..tostring(s)) end return deep(t) end}
local function stored(name) local v=memoryOf(name).vars.roster return v and _HttpService:JSONDecode(v.value) or nil end

local notices={}
_Util={Notify=function(_,text,uid) notices[uid]=notices[uid] or {} table.insert(notices[uid],text) end,
 Warn=function(_,text,uid) notices[uid]=notices[uid] or {} table.insert(notices[uid],'warn:'..text) end,
 IsAlive=function(_,p) return p~=nil and p.alive~=false end}
local function lastNotice(uid) local l=notices[uid] return l and l[#l] or nil end
_GameData={GetDifficulty=function(_,d) return {name=({'노말','악몽','지옥'})[d+1]} end,duelMaxLevelGap=10}
_GameConst=GameConst
local function clip(s,n) local out,i={},0 for ch in tostring(s):gmatch('[\0-\127\194-\244][\128-\191]*') do i=i+1 if i>n then break end out[#out+1]=ch end return table.concat(out) end
local baseKit={Clip=function(_,s,n) return clip(s,n) end,Colored=function(_,c,t) return '<color='..c..'>'..t..'</color>' end}
local roomCalls={}
_RoomSystem={ReturnMemory='RoomReturnV1',lobbyOk={},
 LobbyPlayer=function(_,uid) return _RoomSystem.lobbyOk[uid] and _UserService:GetUserEntityByUserId(uid) or nil end,
 Forget=function(_,uid) table.insert(roomCalls,'forget:'..uid) end,
 Enter=function(_,p,id,d,fresh) table.insert(roomCalls,'enter:'..p.PlayerComponent.UserId..':'..id..':'..d) return true end,
 WriteCount=function(_,n) table.insert(roomCalls,'count:'..n) end, ClearReturn=function(_,uid) table.insert(roomCalls,'clear:'..uid) end}

local rooms={}
local instanceRooms={}
local clients={}
local sentEvents={}
local moved={}
local function swap(set)
 local s={_RoomService,_UserService,_PartySystem,_TownBoard,_UIKit,senderUserId,ctx}
 set()
 return function() _RoomService,_UserService,_PartySystem,_TownBoard,_UIKit,senderUserId,ctx=s[1],s[2],s[3],s[4],s[5],s[6],s[7] end
end
local function asServer(room,uid,fn) local restore=swap(function() use(room) _UIKit=baseKit senderUserId=uid end) local r=fn() restore() return r end
_TimerService={SetTimerOnce=function(_,fn,d) table.insert(queue,{t=clock+(d or 0),fn=fn,room=ctx}) return #queue end,SetTimerRepeat=function() return 1 end,ClearTimer=function() end}
local function run(untilT)
 while true do
  local best=nil
  for i,q in ipairs(queue) do if q.t<=untilT and (best==nil or q.t<queue[best].t) then best=i end end
  if best==nil then break end
  local q=table.remove(queue,best)
  if q.t>clock then clock=q.t end
  asServer(q.room,nil,q.fn)
 end
 if untilT>clock then clock=untilT end
end
local shown={}
local function newRoom(key)
 local r={key=key,users={}}
 r.ps=setmetatable({Parties={},Known={},OptOut={},ChAsk={},ChShown={},ChGone={},InviteAt={}},{__index=PartySystem})
 r.tb=setmetatable({LocalLfg={},Invites={},LastAsk={}},{__index=TownBoard})
 r.ps.ShowChannel=function(self,digest,okv,uid)
  shown[uid]={digest=digest,ok=okv,n=(shown[uid] and shown[uid].n or 0)+1}
  local c=clients[uid] if c then c.deliver(digest,okv) end
 end
 r.rs={RoomKey=key,StaticRoomKey='__main__',InstanceRooms=instanceRooms,
  IsInstanceRoom=function() return key~='__main__' end,
  GetSharedMemory=function(_,name) return SharedMemoryResultCode.OK,memoryOf(name) end,
  RequestSendEventToRoomAsync=function(_,ev,target,cb)
   local sent=deep(ev) table.insert(sentEvents,{ev=sent,to=target,from=key})
   _TimerService:SetTimerOnce(function()
    local dest=rooms[target]
    if dest==nil then cb(SendEventRequestResultCode.BadRequest,ev) return end
    asServer(dest,nil,function() dest.tb:OnChannelEvent(sent) end)
    cb(SendEventRequestResultCode.OK,ev)
   end,0.01)
  end,
  MoveUsersToStaticRoom=function(_,uids,map) table.insert(moved,uids[1]..'>'..map) return 1 end}
 r.us={UserEntities=r.users,GetUserEntityByUserId=function(_,uid) return r.users[uid] end,
  GetUserCount=function() local n=0 for _ in pairs(r.users) do n=n+1 end return n end}
 rooms[key]=r
 if key~='__main__' then instanceRooms[key]={GetUserCount=function() return r.us:GetUserCount() end} end
 return r
end
use=function(r) ctx=r if r==nil then return end _RoomService=r.rs _UserService=r.us _PartySystem=r.ps _TownBoard=r.tb end
local function newPlayer(room,uid,name,lv,o)
 o=o or {}
 room.maps=room.maps or {}
 local mapName=o.map or 'town1'
 local map=room.maps[mapName] or {Name=mapName,GetComponent=function(_,n) if n=='script.MapAmbience' then return {DisplayName=o.place or '잿불 야영지'} end return nil end}
 room.maps[mapName]=map
 local p={PlayerComponent={UserId=uid,Nickname=name,Hp=100,IsDead=function() return false end},CurrentMap=map,alive=true}
 local stats={Level=lv,Difficulty=o.d or 0,MaxDifficulty=o.m or 0}
 local social=setmetatable({Entity=p,PartyId=0,PartyDigest='',PendingKind='',PendingFrom='',PendingFromName='',PendingUntil=0},{__index=PlayerSocial})
 local save={CharName=function() return name end,PrepareRoomMove=function() return true end,CancelRoomMove=function() end}
 local comps={['script.PlayerStats']=stats,['script.PlayerSocial']=social,['script.PlayerSave']=save}
 p.GetComponent=function(_,n) return comps[n] end
 p.stats,p.social=stats,social
 room.users[uid]=p
 return p
end
local function tick(room) asServer(room,nil,function() room.ps:RefreshRoster() end) end
local function tickAll() for _,r in pairs(rooms) do tick(r) end end
local function party(room,a,b) asServer(room,nil,function() room.ps:Join(a,b) end) end
local function leave(room,uid) room.users[uid]=nil asServer(room,nil,function() room.ps:HandleUserLeaveEvent({UserId=uid}) end) end

-- 플레이어 창 클라이언트 (UI 대역 · 서버 호출은 RPC처럼 그 사람 방 문맥에서)
local function newClient(room,player)
 local c={room=room,player=player,uid=player.PlayerComponent.UserId,ui={text={},en={},color={},click={},size={}}}
 local ui=c.ui
 c.win=setmetatable({Slots={}},{__index=SocialWindow})
 local social=setmetatable({},{__index=function(_,k)
  if k=='RequestAction' then return function(_,kind,id) asServer(c.room,c.uid,function() c.player.social:RequestAction(kind,id) end) end end
  if k=='RespondRequest' then return function(_,acc) asServer(c.room,c.uid,function() c.player.social:RespondRequest(acc) end) end end
  if k=='DuelLevelOk' then return function(_,a,b) return c.player.social:DuelLevelOk(a,b) end end
  return c.player.social[k] end})
 c.kit={Clip=baseKit.Clip,Colored=baseKit.Colored,
  IsOpen=function(_,n) return ui.en[n]==true end,SetText=function(_,p,t) ui.text[p]=t end,SetEnabled=function(_,p,v) ui.en[p]=v end,
  SetColor=function(_,p,v) ui.color[p]=v end,
  Get=function(_,p) return {ButtonComponent=setmetatable({},{__index=function(_,k) if k=='Enable' then return ui.click[p]~=false end end,__newindex=function(_,k,v) if k=='Enable' then ui.click[p]=v end end})} end,
  Comp=function(_,n) if n=='script.PlayerSocial' then return social elseif n=='script.PlayerDuel' then return {Opponent=c.foe or ''} end end}
 local function globals()
  _UIKit=c.kit
  _UserService={LocalPlayer=c.player}
  _PartySystem={RequestChannel=function(_,force) asServer(c.room,c.uid,function() c.room.ps:RequestChannel(force) end) end}
  _TownBoard={RequestChannelInvite=function(_,id) asServer(c.room,c.uid,function() c.room.tb:RequestChannelInvite(id) end) end}
 end
 c.call=function(fn) local restore=swap(globals) fn() restore() end
 c.deliver=function(digest,okv) c.call(function() c.win:OnChannel(digest,okv) end) end
 c.open=function() ui.en['SocialWin']=true c.call(function() c.win:Poll() end) end
 c.poll=function() c.call(function() c.win:Poll() end) end
 c.click=function(i,kind) c.call(function() c.win:Act(i,kind) end) end
 clients[c.uid]=c
 return c
end
local W='SocialWin/'
local function row(c,i,part) return c.ui.text[W..'R'..i..'/'..part] end
local function plain(s) return (tostring(s or ''):gsub('<[^>]*>','')) end
local function colorOf(s) return tostring(s or ''):match('^<color=(#%x+)>') end

-- 오프라인 미리보기 (CHANNEL_PREVIEW_OUT=폴더 · docs/evidence/2026-11-01-channel-players/render_preview.py가 그린다)
local function jsonStr(v) return '"'..tostring(v):gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n')..'"' end
local function dumpUi(c,file)
 local dir=os.getenv('CHANNEL_PREVIEW_OUT') if not dir then return end
 local parts={}
 for k,v in pairs(c.ui.text) do if k:sub(1,#W)==W or k==W:sub(1,-2) then parts[#parts+1]=jsonStr('text:'..k)..':'..jsonStr(v) end end
 for k,v in pairs(c.ui.en) do parts[#parts+1]=jsonStr('en:'..k)..':'..tostring(v) end
 for k,v in pairs(c.ui.click) do parts[#parts+1]=jsonStr('click:'..k)..':'..tostring(v) end
 for k,v in pairs(c.ui.color) do parts[#parts+1]=jsonStr('color:'..k)..':['..v.r..','..v.g..','..v.b..','..v.a..']' end
 table.sort(parts)
 local f=assert(io.open(dir..'/'..file,'w')) f:write('{\n'..table.concat(parts,',\n')..'\n}\n') f:close()
end

-- ───────── ① 원인: 예전 목록(_UserService.UserEntities)은 같은 방 사람만 ─────────
-- 사용자 예: 한 채널에 파티 2개(각 2명) + 혼자 1명 = 5명. 나·팀원 = 게임 방 A, 다른 파티 = 게임 방 B, 낯선 사람 = 혼자 하기 방
local A=newRoom('game:aaa')
local B=newRoom('game:bbb')
local S=newRoom('game:sccc')
local L=newRoom('__main__')
local me=newPlayer(A,'u1','나리',12,{map='town1'})
local mate=newPlayer(A,'u2','동료',11,{map='town1'})
local b1=newPlayer(B,'u3','해골왕',30,{map='field3',place='모래 폐허',d=0,m=1})
local b2=newPlayer(B,'u4','별빛',28,{map='field3',place='모래 폐허',m=1})
local solo=newPlayer(S,'u5','낯선이',9,{map='field1',place='무덤 길',m=0})
party(A,'u1','u2')
party(B,'u3','u4')
ok(me.social.PartyId~=0 and me.social.PartyId==mate.social.PartyId and b1.social.PartyId~=0,'파티 2개 결성 (실제 PartySystem.Join)')
tick(A)
local sameRoom=0 for _ in A.ps.Roster:gmatch('[^;]+') do sameRoom=sameRoom+1 end
eq(sameRoom,2,'원인 재현: 방 A의 예전 목록(Roster = UserEntities)은 같은 방 2명뿐 — 혼자 하기 낯선 사람·방 B 파티가 안 보였다')

-- ───────── ② 쓰기: 방마다 자기 칸 · 빈 표 피하기 · 지문 ─────────
clock=10
tickAll() run(clock+1)
local mem=memoryOf('ChannelRosterV1')
local data=stored('ChannelRosterV1')
ok(data~=nil and data.v==1,'roster 변수 생성 (Create → 이후 Update)')
ok(data.rooms['game:aaa'] and #data.rooms['game:aaa'].p==2 and data.rooms['game:bbb'] and data.rooms['game:sccc'] and #data.rooms['game:sccc'].p==1,'방 칸 3개 (A 2명 · B 2명 · 혼자 1명)')
ok(data.rooms['__main__']==nil,'빈 로비는 칸을 쓰지 않는다 (사람 0 = nil)')
eq(data.rooms['game:aaa'].k,'game','칸 종류 = RoomKind')
local secA=data.rooms['game:aaa'].p
ok(secA[1].u=='u1' and secA[1].n=='나리' and secA[1].l==12 and secA[1].y==me.social.PartyId and secA[2].y==me.social.PartyId,'칸 = 이름 · 레벨 · 파티 번호 (userId 순)')
eq(countLog('[VRF] channel write room='),3,'세 방이 한 번씩 씀')
ok(has(lastLog('[VRF] channel write room=game:sccc'),'why=urgent ok=true calls=2'),'처음 쓰기 = urgent · Get+Create/Update 2번')
local writes0=mem.calls

-- 바뀐 게 없으면 다시 쓰지 않는다 · 레벨만 바뀌면 ChFullGap(180초) 모아서 · 사람이 바뀌면 3초 · 300초마다 한 번
local FG,UG,BG,HOLD=PartySystem.ChFullGap,PartySystem.ChUrgentGap,PartySystem.ChBeatSec,PartySystem.ChFailHold
eq(FG,180,'레벨만 바뀌면 180초 모아서') eq(UG,3,'사람·파티 3초') eq(BG,300,'그대로면 300초') eq(HOLD,30,'실패 뒤 30초')
local wrote=10.05
clock=20 tickAll() run(clock+1)
eq(mem.calls,writes0,'그대로면 쓰지 않음 (2초마다 RefreshRoster)')
me.stats.Level=13
clock=30 tick(A) run(clock+1)
eq(mem.calls,writes0,'레벨만 바뀜: 모으는 동안 쓰지 않음')
clock=wrote+FG-1 tick(A) run(clock+1)
eq(mem.calls,writes0,'레벨만 바뀜: 마지막 쓰기 '..FG..'초 전까지 쓰지 않음')
clock=wrote+FG+0.5 tick(A) run(clock+1)
eq(mem.calls,writes0+2,'레벨만 바뀜: '..FG..'초 뒤 full 한 번 (2번)')
ok(has(lastLog('[VRF] channel write room=game:aaa'),'why=full'),'[VRF] why=full')
eq(stored('ChannelRosterV1').rooms['game:aaa'].p[1].l,13,'레벨 13 반영')
wrote=clock-0.95
local friend=newPlayer(A,'u6','새친구',5)
clock=wrote+1.5 tick(A) run(clock+1)
eq(mem.calls,writes0+2,'사람이 들어옴: 마지막 쓰기 3초 안이면 기다림')
clock=wrote+3.5 tick(A) run(clock+1)
eq(mem.calls,writes0+4,'사람이 들어옴: 3초 지나 urgent')
leave(A,'u6') run(clock+1)
clock=clock+4 tick(A) run(clock+1)
eq(#stored('ChannelRosterV1').rooms['game:aaa'].p,2,'나간 사람 빠짐 (HandleUserLeaveEvent → ChGone · 곧 다시 씀)')
local t0=clock
clock=t0+BG-2 tickAll() run(clock+1)
local beatsBefore=countLog('[VRF] channel write')
clock=t0+BG+5 tickAll() run(clock+1)
ok(countLog('[VRF] channel write')>beatsBefore and has(lastLog('[VRF] channel write'),'why=beat'),'그대로여도 300초마다 beat')

-- 쓰기 실패 → 30초 쉼 (한도 보호)
mem.fail=SharedMemoryResultCode.ResourceExhausted
me.stats.Level=14 b1.stats.Level=31
clock=clock+FG+1 tick(A) run(clock+1)
ok(has(lastLog('[VRF] channel write room=game:aaa'),'ok=false calls=1'),'읽기 실패면 쓰지 않고 1번으로 끝')
local c1=mem.calls
mem.fail=nil
clock=clock+HOLD+5 tick(A) run(clock+1)
eq(mem.calls,c1,'레벨만 바뀐 것은 실패한 시도에서 다시 '..FG..'초 모아 (쉼 30초가 지나도)')
clock=clock+FG tick(A) run(clock+1)
ok(mem.calls>c1 and has(lastLog('[VRF] channel write room=game:aaa'),'ok=true'),'모으는 시간이 지나 다시 씀')
mem.fail=SharedMemoryResultCode.ResourceExhausted
local tmp=newPlayer(A,'u6','새친구',5)
clock=clock+5 tick(A) run(clock+1)
local c2=mem.calls
mem.fail=nil
clock=clock+10 tick(A) run(clock+1)
eq(mem.calls,c2,'사람이 바뀌었어도 실패 뒤 30초는 쉼')
clock=clock+21 tick(A) run(clock+1)
ok(mem.calls>c2 and #stored('ChannelRosterV1').rooms['game:aaa'].p==3,'30초 뒤 다시 씀 (사람 3명)')
leave(A,'u6') clock=clock+5 tick(A) run(clock+1)

-- ETag: 읽고 쓰는 사이 다른 방이 쓰면 다시 읽어 둘 다 남는다
b2.stats.Level=40
clock=clock+70
mem.hook=function() asServer(B,nil,function() B.ps:WriteChannel('full') end) end
asServer(A,nil,function() A.ps:WriteChannel('urgent') end)
local d2=stored('ChannelRosterV1')
ok(d2.rooms['game:bbb'].p[2].l==40 and d2.rooms['game:aaa'].p[1].l==14,'ETag 충돌 → 다시 읽어 B의 새 레벨과 A 칸 모두 남음')
ok(has(logs[#logs-1] or '','[VRF] channel write retry 1') or countLog('[VRF] channel write retry')>=1,'[VRF] write retry')

-- 빈 표: 방이 다 비면 칸이 사라지고, 마지막 칸이 지워져도 JSON이 실패하지 않는다
local E=newRoom('game:empty')
newPlayer(E,'u9','잠깐',3)
clock=clock+10 tick(E) run(clock+1)
ok(stored('ChannelRosterV1').rooms['game:empty']~=nil,'잠깐 방 칸')
leave(E,'u9') clock=clock+4 tick(E) run(clock+1)
ok(stored('ChannelRosterV1').rooms['game:empty']==nil,'빈 방 → 칸 지움')
eq(asServer(E,nil,function() return E.ps:EncodeChannel({rooms={}}) end),'{"v":1}','방 칸이 하나도 없으면 고정 글 (빈 표 JSONEncode 실패 피함)')
rooms['game:empty']=nil instanceRooms['game:empty']=nil

-- ───────── ③ 읽기 · 정리 (순수 ChannelEntries) ─────────
local nowMs=1.7e12+clock*1000
local fake={rooms={
 ['game:old']={t=nowMs-601000,k='game',p={{u='z1',n='옛',l=1,m=0,d=0,y=0}}},           -- 10분 넘게 소식 없음
 ['game:dead']={t=nowMs-40000,k='game',p={{u='z2',n='닫힘',l=1,m=0,d=0,y=0}}},         -- 방이 없어졌고 30초 지남
 ['game:new']={t=nowMs-5000,k='game',p={{u='z3',n='새방',l=1,m=0,d=0,y=0}}},           -- 방 목록에 아직 없지만 막 씀
 ['game:dup1']={t=nowMs-20000,k='game',p={{u='z4',n='옮기는중',l=1,m=0,d=0,y=0}}},
 ['game:dup2']={t=nowMs-2000,k='lobby',p={{u='z4',n='옮기는중',l=2,m=0,d=0,y=0}}},
 ['depth:3:0:1:ab']={t=nowMs-1000,k='depth',p={{u='z5',n='심연인',l=20,m=0,d=0,y=0}}},
}}
instanceRooms['game:dup1']={GetUserCount=function() return 1 end} instanceRooms['game:dup2']={GetUserCount=function() return 1 end} instanceRooms['depth:3:0:1:ab']={GetUserCount=function() return 1 end}
local ents=asServer(A,nil,function() return A.ps:ChannelEntries(fake,'game:aaa',A.ps:ChannelLive(),nowMs,A.ps:RoomAliveFn()) end)
local byU={} for _,e in ipairs(ents) do byU[e.u]=e end
ok(byU.z1==nil,'10분 넘은 칸 버림 (ChStaleSec)')
ok(byU.z2==nil,'없어진 방(InstanceRooms에 없음 · 30초 지남) 버림')
ok(byU.z3~=nil,'막 쓴 방은 목록에 아직 없어도 둠 (ChRoomGrace)')
ok(byU.z4~=nil and byU.z4.room=='game:dup2' and byU.z4.l==2,'두 칸에 있으면 새 칸 (방 옮기는 중)')
eq(asServer(A,nil,function() return A.ps:WhereText(byU.z5) end),'심연 3층','심연 방 = 「심연 N층」 (방 키에서)')
ok(byU.u1.here and byU.u1.place=='잿불 야영지' and byU.u1.map=='town1','같은 방 = 지금 값(위치·맵)')
-- 내 방이 InstanceRooms에 없으면(목록을 못 믿는 환경) 시간으로만
instanceRooms['game:aaa']=nil
ok(asServer(A,nil,function() return A.ps:RoomAliveFn() end)==nil,'내 방이 목록에 없으면 alive=nil (시간으로만 판단)')
local ents2=asServer(A,nil,function() return A.ps:ChannelEntries(fake,'game:aaa',A.ps:ChannelLive(),nowMs,A.ps:RoomAliveFn()) end)
local z2=false for _,e in ipairs(ents2) do if e.u=='z2' then z2=true end end
ok(z2,'못 믿는 목록으로는 지우지 않음')
instanceRooms['game:aaa']={GetUserCount=function() return A.us:GetUserCount() end}
for _,k in ipairs({'game:dup1','game:dup2','depth:3:0:1:ab'}) do instanceRooms[k]=nil end

-- ───────── ④ 화면: 5명 예 (파티 2개 각 2명 + 혼자 1명) ─────────
-- 실제로는 모든 방이 2초마다 RefreshRoster를 돈다 (300초마다 beat로 칸이 오래되지 않는다)
clock=clock+1 tickAll() run(clock+1)
for _,k in ipairs({'game:aaa','game:bbb','game:sccc'}) do ok(stored('ChannelRosterV1').rooms[k]~=nil,'칸 살아 있음 '..k) end
local cMe=newClient(A,me)
local readsBefore=mem.calls
clock=clock+30
cMe.open()
ok(shown.u1~=nil and shown.u1.ok,'창을 열면 바로 목록 (force)')
eq(mem.calls-readsBefore,1,'창 열기 = 공유 메모리 읽기 1번')
local ui=cMe.ui
eq(plain(ui.text[W..'Summary']),'이 채널 5명 · 파티 2 · 혼자 1','요약 한 줄: 5명 · 파티 2 · 혼자 1')
eq(plain(row(cMe,1,'Tag')),'내 파티 · 2명','1줄 = 내 파티 (맨 위)')
ok(has(plain(row(cMe,1,'Name')),'나리  Lv14  (나)'),'1줄 = 나 (나)')
eq(plain(row(cMe,2,'Tag')),'내 파티 · 2명','2줄 = 팀원도 내 파티')
ok(has(plain(row(cMe,2,'Name')),'동료  Lv11'),'2줄 = 동료')
eq(plain(row(cMe,3,'Tag')),'파티 · 2명','3줄 = 다른 파티')
eq(plain(row(cMe,4,'Tag')),'파티 · 2명','4줄 = 다른 파티 (붙어 있음)')
ok(has(plain(row(cMe,3,'Name')),'다른 게임 · 노말') and has(plain(row(cMe,4,'Name')),'다른 게임 · 노말'),'다른 방 위치 = 다른 게임 · 난이도')
eq(plain(row(cMe,5,'Tag')),'혼자','5줄 = 혼자')
ok(has(plain(row(cMe,5,'Name')),'낯선이  Lv9') and has(plain(row(cMe,5,'Name')),'혼자 하기 · 노말'),'혼자 하기 방 = 「혼자 하기 · 노말」')
ok(ui.en[W..'R6']==false and ui.en[W..'R8']==false,'남는 줄 숨김')
local cMine,cOther=colorOf(row(cMe,1,'Name')),colorOf(row(cMe,3,'Name'))
eq(cMine,'#6CC4FF','내 파티 이름 색 = 첫 색')
eq(colorOf(row(cMe,2,'Name')),cMine,'내 파티원 같은 색')
eq(cOther,'#FFB45A','다른 파티 = 둘째 색')
eq(colorOf(row(cMe,4,'Name')),cOther,'다른 파티원 같은 색')
eq(colorOf(row(cMe,5,'Name')),'#E6DCC6','혼자 = 기본색')
ok(ui.en[W..'R1/Mark']==true and ui.en[W..'R3/Mark']==true and ui.en[W..'R5/Mark']==false,'색 띠: 파티만')
ok(math.abs(ui.color[W..'R1/Bg'].a-0.16)<1e-9 and math.abs(ui.color[W..'R1/Bg'].b-1)<1e-9,'파티 줄 바탕 = 파티 색 × 0.16')
-- 단추
ok(ui.en[W..'R1/Party']==false,'나: 파티 단추 없음')
ok(ui.en[W..'R2/Party']==true and plain(row(cMe,2,'Party'))=='파티원' and ui.click[W..'R2/Party']==false,'같은 파티: 「파티원」 · 누를 수 없음')
ok(plain(row(cMe,3,'Party'))=='초대' and ui.click[W..'R3/Party']~=false,'다른 방: 「초대」')
ok(plain(row(cMe,5,'Party'))=='초대' and ui.click[W..'R5/Party']~=false,'혼자 하기 사람도 「초대」')
ok(ui.en[W..'R2/Trade']==true and ui.en[W..'R2/Inspect']==true and ui.en[W..'R2/Duel']==true,'같은 방·같은 곳: 결투(레벨 차 10 이하 · 마을 거절은 서버 그대로)·거래·살펴보기 — 예전 조건 그대로')
ok(ui.en[W..'R3/Duel']==false and ui.en[W..'R3/Trade']==false and ui.en[W..'R3/Inspect']==false and ui.en[W..'R5/Inspect']==false,'다른 방: 결투·거래·살펴보기 숨김')
ok(ui.en[W..'Pager']==false,'한 쪽이면 쪽 넘김 숨김')
ok(has(lastLog('[VRF] social render'),'n=5 parties=2 solo=1 page=1/1 got=true'),'[VRF] social render n=5 parties=2 solo=1')
dumpUi(cMe,'five.json')

-- 창이 열려 있는 동안만 · 연 뒤 1분은 8초 · 그 뒤 20초마다 묻고 · 읽기는 7초 모아서
eq(SocialWindow:PollInterval(0),8,'연 직후 8초') eq(SocialWindow:PollInterval(59),8,'1분 안 8초') eq(SocialWindow:PollInterval(61),20,'1분 뒤 20초')
ok(PartySystem.ChReadCache<SocialWindow.PollSec,'서버 모아 읽기 '..PartySystem.ChReadCache..'초 < 묻는 간격 '..SocialWindow.PollSec..'초 (묻는 때마다 새 목록)')
local r0,s0=mem.calls,shown.u1.n
clock=clock+3 cMe.poll()
eq(mem.calls,r0,'3초 뒤: 아직 묻지 않음')
clock=clock+5.1 cMe.poll()
eq(mem.calls,r0+1,'8초 뒤: 한 번 읽음')
eq(shown.u1.n,s0,'목록이 그대로면 다시 보내지 않음 (ChShown)')
for _=1,7 do clock=clock+8.1 cMe.poll() end
local r2=mem.calls
for _=1,3 do clock=clock+8.1 cMe.poll() end
ok(mem.calls-r2<=2,'1분 넘게 그냥 띄워 두면 20초마다 (24초 동안 '..(mem.calls-r2)..'번)')
ui.en['SocialWin']=false cMe.poll()
local r1=mem.calls
for _=1,10 do clock=clock+6 cMe.poll() end
eq(mem.calls,r1,'창을 닫으면 읽지 않음')

-- ───────── ⑤ 초대 ─────────
ui.en['SocialWin']=true cMe.poll()
local cSolo=newClient(S,solo)
-- 다른 방 혼자 하기 사람에게 「초대」 → 방 사이 이벤트 → 받은 요청 창(game)
clock=clock+1
cMe.click(5,'party')
run(clock+1)
local ev=sentEvents[#sentEvents]
ok(ev and ev.to=='game:sccc' and ev.ev.Kind=='invite' and ev.ev.ToUid=='u5' and ev.ev.FromUid=='u1' and ev.ev.GameId=='aaa' and ev.ev.FromRoom=='game:aaa' and ev.ev.Diff==0,'초대 이벤트 = 받는 사람의 방으로 (게임 id · 보낸 방)')
eq(solo.social.PendingKind,'game','받는 쪽: 받은 요청 창 kind game (게시판 초대와 같은 길)')
eq(solo.social.PendingFromName,'나리','받는 쪽: 보낸 사람 이름')
eq(lastNotice('u1'),'낯선이님에게 초대를 보냈습니다','보낸 쪽 알림')
cSolo.call(function() cSolo.win:RenderRequest() end)
eq(cSolo.ui.text['/ui/ConfirmHUD/SafeArea/Request/Text'],'나리님으로부터 초대 - 수락 시 이동합니다','받은 요청 띠 글 = 10-29 확정 글귀 그대로')
ok(has(lastLog('[VRF] channel invite recv'),'result=delivered') and has(lastLog('[VRF] channel invite u1'),'sent=true'),'[VRF] channel invite · recv')
-- 거절 → 그대로 혼자 · 보낸 사람에게 결과
cSolo.call(function() cSolo.win:Respond(false) end)
run(clock+1)
eq(solo.social.PendingKind,'','거절하면 요청 사라짐')
ok(S.users.u5~=nil and #moved==0,'거절하면 그대로 혼자 하기 방')
eq(lastNotice('u1'),'낯선이님이 거절했습니다','보낸 사람에게 「거절」 알림 (방 사이 답)')
-- 같은 상대 쿨다운 (연타 막기 1초 + 같은 상대 20초)
clock=clock+0.5 cMe.click(5,'party') run(clock+1)
eq(#sentEvents,2,'1초 안 연타는 무시 (답 이벤트 1개만 늘었음)')
clock=clock+2 cMe.click(5,'party') run(clock+1)
ok(has(lastNotice('u1'),'같은 플레이어에게는') and has(lastNotice('u1'),'초 뒤에 다시 보낼 수 있습니다'),'같은 상대 20초 쿨다운 알림')
ok(has(lastLog('[VRF] invite cooldown'),'kind=party u1 → u5'),'[VRF] invite cooldown')
-- 쿨다운 뒤 다시 → 수락 → 로비를 거쳐 초대한 방으로 (돌아올 방 RoomReturnV1)
clock=clock+20 cMe.click(5,'party') run(clock+1)
eq(solo.social.PendingKind,'game','20초 뒤 다시 초대')
cSolo.call(function() cSolo.win:Respond(true) end)
run(clock+1)
ok(moved[#moved]=='u5>map01','수락: 로비로 (게임 나가기와 같은 순서)')
local ret=memoryOf('RoomReturnV1').vars.u5
ok(ret and _HttpService:JSONDecode(ret.value).id=='aaa','돌아올 방 = 초대한 게임 (RoomSystem.OnLobbyReady가 넣는다)')
eq(lastNotice('u1'),'낯선이님이 초대를 수락했습니다','보낸 사람에게 「수락」')
ok(has(lastLog('[VRF] board invite accept uid=u5'),'→ aaa moved=1'),'[VRF] board invite accept')
-- 로비에 있는 사람: 바로 그 방으로 (RoomSystem.Enter)
local lob=newPlayer(L,'u7','로비인',15,{m=1})
_RoomSystem.lobbyOk.u7=true
clock=clock+5 tickAll() run(clock+1)
clock=clock+7 cMe.poll()
local lobbyRow=nil for i=1,8 do if has(plain(row(cMe,i,'Name')),'로비인') then lobbyRow=i end end
ok(lobbyRow and has(plain(row(cMe,lobbyRow,'Name')),'로비') and plain(row(cMe,lobbyRow,'Party'))=='초대','로비 사람 = 「로비」 · 초대 가능')
cMe.click(lobbyRow,'party') run(clock+1)
local cLob=newClient(L,lob)
cLob.call(function() cLob.win:Respond(true) end)
run(clock+1)
ok(roomCalls[#roomCalls-1]=='forget:u7' and roomCalls[#roomCalls]=='enter:u7:aaa:0','로비 수락: 모집·대기 지우고 바로 입장 (RoomSystem.Forget → Enter)')
ok(has(lastLog('[VRF] channel invite accept from lobby'),'entered=true'),'[VRF] 로비 수락')
-- 바쁨 · 없음
local function rowOf(c,name) for i=1,8 do if has(plain(row(c,i,'Name')),name) then return i end end end
eq(rowOf(cMe,'별빛'),3,'같은 파티 안은 이름 순 (별빛 · 해골왕)')
b1.social.PendingKind='trade' b1.social.PendingUntil=clock+15
clock=clock+1 cMe.click(rowOf(cMe,'해골왕'),'party') run(clock+1)
eq(lastNotice('u1'),'상대가 다른 요청을 처리 중입니다','받는 사람이 다른 요청 처리 중 → 답 busy')
B.users.u4=nil   -- 방을 옮겨 아직 목록이 낡음
clock=clock+1.5 cMe.click(rowOf(cMe,'별빛'),'party') run(clock+1)
eq(lastNotice('u1'),'그 플레이어를 찾지 못했습니다. 목록을 다시 확인해주세요','그 방에 이제 없음 → 답 gone')
B.users.u4=b2 b1.social.PendingKind=''
-- 수락 때 초대한 방이 가득 → full
for i=1,2 do newPlayer(A,'f'..i,'친구'..i,10) end
eq(A.us:GetUserCount(),4,'방 A 4명')
local inv={id='aaa',d=0,f='나리',fu='u1',fr='game:aaa'}
asServer(S,nil,function() S.tb.Invites.u5=deep(inv) end)
S.users.u5=solo
asServer(S,nil,function() S.tb:AnswerInvite(solo,true) end)
run(clock+1)
eq(lastNotice('u5'),'이 게임은 이미 가득 찼습니다','수락했는데 가득 → 받는 사람 안내')
eq(lastNotice('u1'),'게임 인원이 가득 차 낯선이님이 들어오지 못했습니다','보낸 사람에게 full')

-- 못 하는 초대 (InviteCode ↔ 서버 거절 글)
local P=A.ps
local function code(ctxv,e) return asServer(A,nil,function() return P:InviteCode(ctxv,e) end) end
local base={uid='u1',diff=1,inGame=true,alive=true,count=2,max=4,party='game:aaa#1'}
local function with(t,k,v) local o=deep(t) o[k]=v return o end
eq(code(base,{u='u1',here=true,party=''}),'me','나')
eq(code(base,{u='u2',here=true,party='game:aaa#1'}),'m','같은 파티')
eq(code(base,{u='x',here=true,party=''}),'p','같은 방 다른 사람 = 파티 초대')
eq(code(base,{u='x',here=false,kind='game',m=1}),'g','다른 방 = 내 게임에 초대')
eq(code(with(base,'inGame',false),{u='x',here=false,kind='game',m=2}),'xl','내가 로비·심연 = 못 함')
eq(code(with(base,'alive',false),{u='x',here=false,kind='game',m=2}),'xk','내가 쓰러짐')
eq(code(base,{u='x',here=false,kind='depth',m=2}),'xd','상대 심연')
eq(code(base,{u='x',here=false,kind='charsel',m=2}),'xd','상대 캐릭터 선택')
eq(code(with(base,'count',4),{u='x',here=false,kind='game',m=2}),'xf','내 게임 가득')
eq(code(base,{u='x',here=false,kind='lobby',m=0}),'xu:악몽','상대가 내 난이도를 안 열었음')
local refusals={xl='게임 안에서만 초대할 수 있습니다',xk='쓰러진 상태에서는 초대할 수 없습니다',xd='심연이나 캐릭터 선택 중인 플레이어는 초대할 수 없습니다',
 xf='이 게임은 이미 가득 찼습니다',['xu:악몽']='그 사람은 아직 악몽 난이도를 열지 않았습니다',m='이미 같은 파티입니다'}
for k,v in pairs(refusals) do eq(asServer(A,nil,function() return P:InviteRefusal(k) end),v,'거절 글 '..k) end
for k,v in pairs(refusals) do ok(v:match('니다$'),'시스템 안내는 -습니다/-입니다 ('..k..')') end
for _,c in ipairs({'ok','no','busy','gone','full','locked','cant'}) do
 local t=asServer(A,nil,function() return A.tb:ReplyText(c,'별빛') end)
 ok(t:match('니다$') or t:match('해주세요$'),'답 글 말투 '..c..': '..t)
end
-- 서버도 같은 규칙으로 거절 (화면을 우회해도): 내가 로비에서 다른 방 사람에게
local cLob2=newClient(L,lob)
L.users.u7=lob
local ev0=#sentEvents
asServer(L,'u7',function() L.tb:RequestChannelInvite('u5') end)
eq(lastNotice('u7'),'게임 안에서만 초대할 수 있습니다','서버 재확인: 로비에서는 다른 방 초대 안 됨')
eq(#sentEvents,ev0,'거절이면 이벤트 없음')
-- 같은 방 사람은 기존 파티 초대로 · 같은 파티면 보내지 않음
local x=newPlayer(L,'u8','로비친구',3)
asServer(L,'u7',function() L.tb:RequestChannelInvite('u8') end)
eq(x.social.PendingKind,'','1초 안 두 번째 초대는 무시 (연타)')
clock=clock+1.1
asServer(L,'u7',function() L.tb:RequestChannelInvite('u8') end)
eq(x.social.PendingKind,'party','같은 방 = 기존 파티 초대 (PlayerSocial.SendRequest)')
asServer(A,'u1',function() me.social:RequestAction('party','u2') end)
eq(lastNotice('u1'),'이미 같은 파티입니다','이미 같은 파티면 보내지 않음 (예전엔 파티를 풀고 다시 만들었다)')
-- 결투·거래도 같은 상대 쿨다운
asServer(A,'u1',function() me.social:RequestAction('trade','u2') end)
eq(mate.social.PendingKind,'trade','거래 요청')
mate.social.PendingKind=''
clock=clock+3
asServer(A,'u1',function() me.social:RequestAction('trade','u2') end)
ok(has(lastNotice('u1'),'초 뒤에 다시 보낼 수 있습니다') and mate.social.PendingKind=='','거래 연타 → 같은 상대 쿨다운')

-- ───────── ⑥ 20명: 8줄 쪽 넘김 · 묶음이 쪽 사이에서 안 갈라짐 · 색 돌림 ─────────
local SW=SocialWindow
local function mk(uid,name,partyKey,rel) return {uid=uid,name=name,lv=10,party=partyKey,rel=rel,where='',map='',act='g'} end
local rows20={}
local groups={{'mine',3,'room'},{'g2',4,'other'},{'g3',3,'other'},{'g4',2,'other'},{'g5',2,'other'}}
local n=0
for gi,g in ipairs(groups) do for i=1,g[2] do n=n+1 table.insert(rows20,mk(gi==1 and i==1 and 'me' or ('p'..n),'이름'..string.format('%02d',n),g[1],gi==1 and i==1 and 'me' or g[3])) end end
for i=1,6 do n=n+1 table.insert(rows20,mk('s'..n,'혼자'..string.format('%02d',n),'',i<=2 and 'room' or 'other')) end
eq(#rows20,20,'채널 상한 20명')
local view=SW:BuildView(rows20,'me')
eq(view.total,20,'20명') eq(view.parties,5,'파티 5') eq(view.solo,6,'혼자 6')
eq(view.list[1].row.uid,'me','나 맨 위')
eq(view.list[1].tag,'내 파티 · 3명','내 파티 태그')
local pages=SW:Paginate(view.list,8)
eq(#pages,3,'20명 = 3쪽')
local seen,gpage={},{}
for pi,pg in ipairs(pages) do
 ok(#pg<=8,'쪽 '..pi..' 8줄 이하')
 for _,it in ipairs(pg) do
  seen[#seen+1]=it
  if it.gsize>1 then ok(gpage[it.gkey]==nil or gpage[it.gkey]==pi,'파티 '..it.gkey..'가 쪽 사이에서 갈라지지 않음') gpage[it.gkey]=pi end
 end
end
eq(#seen,20,'모든 사람이 한 번씩')
local prevKey,prevColor=nil,nil
for _,it in ipairs(view.list) do
 if it.gkey~=prevKey and it.gsize>1 and prevColor and it.color==prevColor then error('이웃한 파티 같은 색 '..it.gkey) end
 if it.gsize>1 then prevColor=it.color else prevColor=nil end
 prevKey=it.gkey
end
ok(true,'이웃한 파티 묶음끼리 다른 색')
ok(view.list[#view.list].tag=='혼자' and view.list[15].row.rel=='room' and view.list[16].row.rel=='room' and view.list[17].row.rel=='other','혼자: 파티 뒤 · 같은 방 먼저')
-- 쪽 넘김 화면 (실제 Render): 가짜 목록으로
local c20=newClient(A,me)
c20.ui.en['SocialWin']=true
local dig={}
for _,r in ipairs(rows20) do
 local act=r.uid=='me' and 'me' or (r.party=='mine' and 'm') or (r.rel=='room' and 'p') or 'g'
 local where=r.rel~='other' and '잿불 야영지' or (r.party=='' and '혼자 하기 · 노말' or '다른 게임 · 노말')
 dig[#dig+1]=table.concat({r.uid=='me' and 'u1' or r.uid,r.name,'10',r.party,r.rel,where,r.rel~='other' and 'town1' or '',act},'|')
end
c20.call(function() c20.win.WasOpen=true c20.win:OnChannel(table.concat(dig,';'),true) end)
eq(c20.ui.text[W..'Pager/Label'],'1 / 3','쪽 표시 1 / 3') ok(c20.ui.en[W..'Pager']==true,'쪽 넘김 보임')
ok(has(c20.ui.text[W..'Pager/Prev'],'#7A7268') and c20.ui.text[W..'Pager/Next']=='▶','첫 쪽: ◀ 흐리게')
c20.call(function() c20.win:Turn(1) end) eq(c20.ui.text[W..'Pager/Label'],'2 / 3','▶ → 2쪽')
c20.call(function() c20.win:Turn(5) end) eq(c20.ui.text[W..'Pager/Label'],'3 / 3','끝을 넘지 않음')
ok(c20.ui.text[W..'Pager/Next']~='▶','마지막 쪽: ▶ 흐리게')
eq(SW:Paginate({},8)[1] and #SW:Paginate({},8)[1],0,'빈 목록 = 빈 한 쪽')
c20.call(function() c20.win:Turn(-5) end)
dumpUi(c20,'twenty.json')

-- ───────── ⑦ 토큰 · 색 대비 · 배치 ─────────
local tok=read('tools/build/ui-tokens.cjs')
local colorsTok=tok:match("const PARTY = { colors: %[([^%]]+)%]")
local list={} for c in colorsTok:gmatch("'(#%x+)'") do list[#list+1]=c end
eq(table.concat(list,','),SocialWindow.PartyColors,'ui-tokens PARTY.colors = SocialWindow.PartyColors')
eq(tok:match("solo: '(#%x+)'"),SocialWindow.SoloColor,'PARTY.solo = SoloColor')
eq(tok:match("dim: '(#%x+)'"),SocialWindow.DimColor,'PARTY.dim = DimColor')
eq(tonumber(tok:match('rowAlpha: ([%d.]+)')),SocialWindow.RowAlpha,'PARTY.rowAlpha = RowAlpha')
eq(tonumber(tok:match('perPage: (%d+)')),SocialWindow.PerPage,'SOCIAL.perPage = PerPage')
ok(#list>=4 and #list<=6,'파티 색 4~6개')
local function lin(c) return c<=0.04045 and c/12.92 or ((c+0.055)/1.055)^2.4 end
local function rgb(h) local v=tonumber(h:sub(2),16) return {((v>>16)&255)/255,((v>>8)&255)/255,(v&255)/255} end
local function lum(c) return 0.2126*lin(c[1])+0.7152*lin(c[2])+0.0722*lin(c[3]) end
local function contrast(a,b) local x,y=lum(a),lum(b) if x<y then x,y=y,x end return (x+0.05)/(y+0.05) end
local function lab(c) local r,g,b=lin(c[1]),lin(c[2]),lin(c[3])
 local X=(0.4124*r+0.3576*g+0.1805*b)/0.95047 local Y=0.2126*r+0.7152*g+0.0722*b local Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883
 local f=function(t) return t>0.008856 and t^(1/3) or 7.787*t+16/116 end
 return {116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))} end
local function dE(a,b) local p,q=lab(a),lab(b) return math.sqrt((p[1]-q[1])^2+(p[2]-q[2])^2+(p[3]-q[3])^2) end
local bg={0.05,0.045,0.06}   -- COLOR.windowBg
eq(tok:match("windowBg: { r: ([%d.]+), g: ([%d.]+), b: ([%d.]+)"),'0.05','창 바탕 = COLOR.windowBg')
local minC,minD=99,999
for i,h in ipairs(list) do
 local c=rgb(h) local row={} for k=1,3 do row[k]=bg[k]*(1-SocialWindow.RowAlpha)+c[k]*SocialWindow.RowAlpha end
 minC=math.min(minC,contrast(c,bg),contrast(c,row))
 minD=math.min(minD,dE(c,rgb(SocialWindow.SoloColor)),dE(c,rgb(SocialWindow.DimColor)))
 for j=i+1,#list do minD=math.min(minD,dE(c,rgb(list[j]))) end
 local L1=lab(c) ok(not (L1[2]< -20 and math.abs(L1[3])<60 and L1[2]< -L1[3]*0.0 and h=='#00FF00'),'초록 단색 아님')
end
ok(minC>=4.5,string.format('파티 색 대비 (창 바탕·자기 색 줄 바탕) 최소 %.2f ≥ 4.5',minC))
ok(minD>=30,string.format('파티 색끼리·혼자·흐린 글자색과 ΔE 최소 %.1f ≥ 30',minD))
-- 배치: 단추가 줄 안 · 요약이 닫기 단추와 안 겹침 · 좁은 화면(NARROW) 안
local winW=tonumber(tok:match('const SOCIAL = { winW: (%d+)'))
local padX=tonumber(tok:match('const INSET = { top: %d+, side: (%d+)'))+tonumber(tok:match('const SPACE = (%d+)'))
local lastX,lastW=tok:match("{ name: 'Inspect', label: '살펴보기', x: (%d+), w: (%d+) }")
eq(tonumber(lastX)+tonumber(lastW),winW-2*padX,'살펴보기 단추 끝 = 줄 폭 (창 안쪽 여백 안)')
local ui_cjs=read('tools/build/ui.cjs')
ok(has(ui_cjs,'const summaryW = S.winW + T.FRAME.close.x - T.FRAME.close.size - T.SPACE / 2 - padX;'),'요약 줄은 닫기 단추 왼쪽에서 끝 (ui_lint L023)')
local narrowW=1440-16*2-20*2
ok(winW<=narrowW,'창 폭 '..winW..' ≤ 좁은 화면 바탕 상한 '..narrowW)
ok(not has(read('RootDesk/MyDesk/UI/Windows/SocialWindow.mlua'),'MouseScroll'),'PC 휠에 기대지 않음 (◀ ▶)')

-- ───────── ⑧ 공유 메모리 호출 수 (월드 분당 1000번 한도) ─────────
-- 한 채널(20명)을 실제 PartySystem 본문으로 12분 돌려 마지막 10분의 호출을 센다. 결정적 일정(난수 없음).
local function simulate(cfg)
 rooms={} instanceRooms={} memories={} queue={} clients={} shown={} logs={} notices={}
 local start=clock
 local rs={}
 local pid=0
 for ri,spec in ipairs(cfg.rooms) do
  local r=newRoom(spec.key)
  r.spec=spec
  for i=1,spec.n do pid=pid+1 newPlayer(r,'s'..pid,'사람'..pid,10) end
  if spec.party and spec.n>=2 then local ids={} for uid in pairs(r.users) do ids[#ids+1]=uid end table.sort(ids) for i=2,#ids do party(r,ids[1],ids[i]) end end
  rs[#rs+1]=r
 end
 local warm=start+120
 local m=memoryOf('ChannelRosterV1')
 local calls0=nil
 local t=start
 local viewers={}
 for i=1,math.min(cfg.viewers,#rs) do viewers[#viewers+1]=rs[i] end
 local nextAsk={}
 while t<start+720 do
  t=t+2 clock=t
  if calls0==nil and t>=warm then calls0=m.calls end
  for ri,r in ipairs(rs) do
   local k=0
   for uid,p in pairs(r.users) do k=k+1
    local phase=(tonumber(uid:sub(2))*37)%cfg.levelEvery
    if (t-start)%cfg.levelEvery==phase-phase%2 then p.stats.Level=p.stats.Level+1 end
   end
   if cfg.churnEvery>0 and ri%2==1 and math.floor(t-start)%cfg.churnEvery==(ri*14)%cfg.churnEvery-((ri*14)%cfg.churnEvery)%2 then
    -- 한 명이 나갔다가 30초 뒤 다시 들어옴 (사람 바뀜 = urgent 2번)
    local uid=next(r.users)
    if uid then local p=r.users[uid] leave(r,uid) table.insert(queue,{t=t+30,fn=function() r.users[uid]=p end,room=r}) end
   end
   tick(r)
  end
  for _,r in ipairs(viewers) do
   local uid=next(r.users)
   if uid and (nextAsk[r.key]==nil or t>=nextAsk[r.key]) then
    asServer(r,uid,function() r.ps:RequestChannel(nextAsk[r.key]==nil) end)
    nextAsk[r.key]=t+SocialWindow:PollInterval(t-start)   -- 창을 연 채 그대로 (실제 간격 규칙)
   end
  end
  run(t+1.9)
 end
 local perMin=(m.calls-calls0)/10
 return perMin
end
local function roomsOf(list) local out={} for i,s in ipairs(list) do out[i]={key=s[1],n=s[2],party=s[3]} end return out end
-- T 보통: 로비 2 · 파티 방 4·3·2·2 · 혼자 하기 6 · 심연 1 (12방) · 레벨 4분에 1 · 방마다 10분에 1명 들락 · 창 연 방 1
local typical=roomsOf({{'__main__',2,false},{'game:g1',4,true},{'game:g2',3,true},{'game:g3',2,true},{'game:g4',2,true},
 {'game:s1',1},{'game:s2',1},{'game:s3',1},{'game:s4',1},{'game:s5',1},{'game:s6',1},{'depth:2:0:1:x',1}})
-- H 많음: 20명 모두 혼자 하기 (20방) · 레벨 1분에 1 · 5분에 1명 들락 · 창 연 방 6 (30%)
local heavyList={} for i=1,20 do heavyList[i]={'game:h'..i,1} end
local heavy=roomsOf(heavyList)
local tPer=simulate({rooms=typical,levelEvery=240,churnEvery=600,viewers=1})
local hPer=simulate({rooms=heavy,levelEvery=60,churnEvery=300,viewers=6})
local xPer=simulate({rooms=heavy,levelEvery=60,churnEvery=300,viewers=20})
local function pct(perCh,ch) return perCh*ch/1000*100 end
print(string.format('[channel_roster] 공유 메모리 호출/분 (채널 하나 20명) — 보통 %.1f · 많음 %.1f · 극단(20방 모두 창 열림) %.1f',tPer,hPer,xPer))
print(string.format('[channel_roster] 월드 한도 1000/분 대비 — 채널 5개(100명): 보통 %.0f%% · 많음 %.0f%% · 극단 %.0f%% / 채널 10개(200명): 보통 %.0f%% · 많음 %.0f%%',
 pct(tPer,5),pct(hPer,5),pct(xPer,5),pct(tPer,10),pct(hPer,10)))
ok(pct(tPer,5)<=8,'보통 · 채널 5개 ≤ 8% ('..string.format('%.1f',pct(tPer,5))..'%)')
ok(pct(hPer,5)<=22,'많음 · 채널 5개 ≤ 22% ('..string.format('%.1f',pct(hPer,5))..'%)')
ok(pct(xPer,5)<=45,'극단 · 채널 5개 ≤ 45% ('..string.format('%.1f',pct(xPer,5))..'%)')
local out=os.getenv('CHANNEL_BUDGET_OUT')
if out then local f=assert(io.open(out,'w')) f:write(string.format('{"typicalPerChannel":%.2f,"heavyPerChannel":%.2f,"extremePerChannel":%.2f,"limit":1000}\n',tPer,hPer,xPer)) f:close() end
print('[channel_roster] '..checks..' checks passed')
