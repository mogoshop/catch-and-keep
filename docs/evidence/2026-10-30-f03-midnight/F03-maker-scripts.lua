-- F03 실제 Maker KST 자정 경계 관찰 — maker_execute_script에 블록 단위로 붙여 넣는 조각 (2026-10-30 준비 · HEAD 7fd51bbe)
-- 대상: PlayerJournal 일일 의뢰 (RootDesk/MyDesk/Progress/PlayerJournal.mlua)
--   Today() 374-377 = floor((DateTime.UtcNow.Elapsed + 9h) / 86400000) → KST 자정 기준 날짜 번호 (0001-01-01=0 · 2026-10-30=739918 · 10-31=739919)
--   EnsureDaily() 399-427 = 날짜가 바뀌면 목록 비우고 가능한 후보 pool[(today+i)%#pool+1] 앞 3개 · 같은 날은 진행/완료 보존
--   Flush() 432-471 = 서버 1초 타이머가 EnsureDaily를 불러 자정 직후 교체 · CompleteDaily 80-97 = 달성 즉시 골드+경험치 (따로 「받기」 없음)
--   저장 GetSaveData 475-490 {dd, d=[{id,p,done}], c} → PlayerSave Char_4.journal · LoadSaveData 494-547 끝에 EnsureDaily
-- 규칙: OS 시계 변경·DateTime/Today 대체(시간 주입) 금지. 이 파일은 읽기 + 실제 게임 함수 호출만 한다(S05 GM 준비만 상태를 바꿈 · S90 복원).
-- 각 블록은 do ... end 하나. 컨텍스트: S00·S90 = server_main(로비) · S05/S10/S20/S25/S30 = 그때의 server_instance_game:* · S11/S21/S31 = client.
-- execute_script 출력은 수 초 늦게 로그에 뜬다 → 실행 뒤 5초 기다렸다 maker_logs(search "[F03]")로 읽는다.
-- execute_script 안에서 잰 경과 시간은 ×1000 부풀므로 쓰지 않는다. 시각은 DateTime.UtcNow.Elapsed 절대값과 로그 타임스탬프만.

-- ===================== S00 · 사전 백업 (server_main · 로비 캐릭터 선택 화면 · 슬롯 4 「입장」 누르기 전) =====================
-- 5키 원문 len/djb2 + 16진 조각 로그. 조각(`[F03] bak 키 i/n 16진`)은 F03-make-restore.py가 S90 복원본으로 다시 만든다.
-- match_S48=5/5 이면 지금 저장 = 10-30 14:53 S48 복원본 → S90 대신 ../2026-10-30-summon48-maker/slot4-restore-S48.lua 를 그대로 써도 된다.
do
  local F='[F03]'
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local SV=p:GetComponent('script.PlayerSave')
  local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
  local function hex(s) return (string.gsub(s,'.',function(c) return string.format('%02x',string.byte(c)) end)) end
  local keys={'Account','Char_4','Inv_4','Shadow_4','Stash'}
  local S48={Account='615/1340525624',Char_4='1126/1554558725',Inv_4='1838/694193390',Shadow_4='40/923051497',Stash='83/2144937209'}
  local code,pages=SV:Storage():BatchGetAndWait(keys)
  local got={}
  if code==0 and pages~=nil then local ds=pages:GetCurrentPageDatas() for i=1,#ds do got[ds[i].KeyInfo.Key]=ds[i].Value end end
  local m48=0
  for _,k in ipairs(keys) do
    local v=got[k] or ''
    if S48[k]==(#v..'/'..h(v)) then m48=m48+1 end
    log(F..' backup key='..k..' len='..#v..' hash='..h(v)..' present='..tostring(got[k]~=nil))
  end
  log(F..' backup code='..tostring(code)..' match_S48='..m48..'/5 slot='..tostring(SV.Slot)..' load='..tostring(SV.IsLoadSuccess))
  local ok,c4=pcall(function() return _HttpService:JSONDecode(got['Char_4'] or '') end)
  if ok and type(c4)=='table' and type(c4.journal)=='table' then
    local t={} for _,s in ipairs(c4.journal.d or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end
    log(F..' backup Char_4 journal dd='..tostring(c4.journal.dd)..' d='..table.concat(t,',')..' gold='..tostring(type(c4.stats)=='table' and c4.stats.gold or '?')..' lv='..tostring(type(c4.stats)=='table' and c4.stats.lv or '?'))
  else log(F..' backup Char_4 journal ?') end
  local W=360
  for _,k in ipairs(keys) do
    local hx=hex(got[k] or '') local n=math.max(1,math.ceil(#hx/W))
    for i=1,n do log(F..' bak '..k..' '..i..'/'..n..' '..string.sub(hx,(i-1)*W+1,i*W)) end
  end
end

-- ===================== S05 · (선택) 자정 전 1칸 완료 준비 (게임 방 server · 23:50~23:57) =====================
-- 「전날 완료 보상 재지급 0」을 보려면 자정 전에 완료(=즉시 보상 지급)된 칸이 있어야 한다. 실제 처치·일으키기로 못 채우면 이 블록:
-- 오늘 미완료 칸 중 내일 목록에도 다시 나오는 칸을 우선(같은 id가 다음 날 0/미완료로 새로 시작하는지 보려고), raise/kill/kill_elite/capture 종류만,
-- 실제 PlayerJournal:Record → CompleteDaily 경로로 채운다. 날짜는 건드리지 않는다(시간 주입 아님). GM 준비이므로 limits에 적는다.
-- 23:58 이후에는 돌리지 말 것(경계와 겹침).
do
  local F='[F03]'
  local MS=86400000
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local J=p:GetComponent('script.PlayerJournal')
  local ST=p:GetComponent('script.PlayerStats')
  local IV=p:GetComponent('script.PlayerInventory')
  local SV=p:GetComponent('script.PlayerSave')
  local G=_G if type(G)~='table' then G={} end
  -- 시각: 게임과 같은 DateTime.UtcNow.Elapsed(ms, 0001-01-01 기준)만 찍는다. execute_script 안에서 잰 "걸린 시간"은 ×1000 부풀어 쓰지 않는다.
  local function now()
    local e=DateTime.UtcNow.Elapsed
    local k=(e+9*3600000)%MS
    return e, string.format('%02d:%02d:%02d.%03d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60, math.floor(k%1000))
  end
  local function listkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end return table.concat(t,',') end
  local function idkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id) end return table.concat(t,',') end
  -- 새 날(빈 목록)에서 PlayerJournal.EnsureDaily가 고를 3칸 = 가능한 후보 pool[(day+i)%#pool+1] 앞 3개 (읽기 전용 재현 · EnsureDaily는 부르지 않는다)
  local function pred(day)
    local pool={} for _,d in ipairs(_JournalData:GetDailies()) do if J:DailyAvailable(d) then pool[#pool+1]=d end end
    local out={} for i=0,#pool-1 do if #out>=3 then break end out[#out+1]=pool[(day+i)%#pool+1].id end
    return table.concat(out,','), #pool
  end
  local function stored()
    local key='Char_'..tostring(SV.Slot)
    local code,pages=SV:Storage():BatchGetAndWait({key})
    if code~=0 or pages==nil then return 'key='..key..' code='..tostring(code) end
    local ds=pages:GetCurrentPageDatas() local v=(ds~=nil and ds[1]~=nil) and ds[1].Value or ''
    local ok,d=pcall(function() return _HttpService:JSONDecode(v) end)
    if not ok or type(d)~='table' or type(d.journal)~='table' then return 'key='..key..' nojournal len='..tostring(#v) end
    local c=type(d.journal.c)=='table' and d.journal.c or {}
    return 'key='..key..' len='..tostring(#v)..' dd='..tostring(d.journal.dd)..' d='..listkey(d.journal.d)..' gold='..tostring(type(d.stats)=='table' and d.stats.gold or '?')..' exp='..tostring(type(d.stats)=='table' and d.stats.exp or '?')..' c.daily='..tostring(c.daily)
  end
  local function snap()
    local e,k=now()
    local s={el=math.floor(e),kst=k,today=J:Today(),dd=J.DailyDay,list=listkey(J.Daily),ids=idkey(J.Daily),gold=ST.Gold,exp=ST.Exp,lv=ST.Level,
      daily=J.Counters.daily or 0,daily0=J.Counters['daily@0'] or 0,claims=J.ClaimCount,bag=#IV.Bag,slot=SV.Slot,load=SV.IsLoadSuccess}
    s.predToday,s.pool=pred(s.today)
    s.predNext=pred(s.today+1)
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    s.left=(ok and type(v)=='table') and v.left or '?'
    local okr,rk=pcall(function() return _GameConst:RoomKind() end)
    s.room=okr and rk or '?'
    return s
  end
  local function dump(tag,s)
    log(F..' '..tag..' time elapsed='..tostring(s.el)..' kst='..s.kst..' today='..tostring(s.today)..' dd='..tostring(s.dd)..' slot='..tostring(s.slot)..' load='..tostring(s.load)..' room='..tostring(s.room))
    log(F..' '..tag..' daily '..s.list..' digest_left_min='..tostring(s.left))
    log(F..' '..tag..' wallet gold='..tostring(s.gold)..' exp='..tostring(s.exp)..' lv='..tostring(s.lv)..' c.daily='..tostring(s.daily)..' c.daily@0='..tostring(s.daily0)..' claims='..tostring(s.claims)..' bag='..tostring(s.bag))
    log(F..' '..tag..' pred pool='..tostring(s.pool)..' today('..tostring(s.today)..')='..s.predToday..' next('..tostring(s.today+1)..')='..s.predNext)
    log(F..' '..tag..' storage '..stored())
    log(F..' '..tag..' paste {dd='..tostring(s.dd)..',ids=\''..s.ids..'\',list=\''..s.list..'\',gold='..tostring(s.gold)..',exp='..tostring(s.exp)..',daily='..tostring(s.daily)..',predNext=\''..s.predNext..'\'}')
  end
  local nextIds=pred(J:Today()+1)
  local okKind={raise=true,kill=true,kill_elite=true,capture=true}
  local best=nil
  for _,s in ipairs(J.Daily) do
    local d=_JournalData:GetDaily(s.id)
    if d~=nil and not s.done and okKind[d.kind] then
      local inNext=string.find(','..nextIds..',', ','..s.id..',', 1, true)~=nil
      local rem=d.count-s.p
      local score=(inNext and 0 or 100000)+rem
      if best==nil or score<best.score then best={slot=s,def=d,rem=rem,inNext=inNext,score=score} end
    end
  end
  if best==nil then log(F..' prep SKIP no completable slot list='..listkey(J.Daily))
  else
    local g0,e0,c0=ST.Gold,ST.Exp,J.Counters.daily or 0
    local _,k=now()
    J:Record(best.def.kind,'',best.rem)
    log(F..' prep kst='..k..' completed id='..best.def.id..' kind='..best.def.kind..' +'..best.rem..' in_next='..tostring(best.inNext)..' done='..tostring(best.slot.done)..' gold '..g0..'->'..tostring(ST.Gold)..' exp '..e0..'->'..tostring(ST.Exp)..' c.daily '..c0..'->'..tostring(J.Counters.daily)..' list='..listkey(J.Daily))
  end
end

-- ===================== S10 · 자정 전 스냅샷 + 경계 감시 (게임 방 server · 23:55 전후, 늦어도 23:58) =====================
-- `[F03] before ...` 6줄. 마지막 `[F03] before paste {...}` 줄을 복사해 두면 S20 BEFORE 칸에 붙일 수 있다(_G가 이어지지 않을 때 대비).
-- 감시 타이머: 1초마다 DailyDay·후보 id가 바뀌는 순간을 `[F03] edge #n ...`로 남긴다(관찰만 · 25분 뒤 스스로 멈춤). 기대 = 자정 직후 edge #1 한 번.
do
  local F='[F03]'
  local MS=86400000
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local J=p:GetComponent('script.PlayerJournal')
  local ST=p:GetComponent('script.PlayerStats')
  local IV=p:GetComponent('script.PlayerInventory')
  local SV=p:GetComponent('script.PlayerSave')
  local G=_G if type(G)~='table' then G={} end
  -- 시각: 게임과 같은 DateTime.UtcNow.Elapsed(ms, 0001-01-01 기준)만 찍는다. execute_script 안에서 잰 "걸린 시간"은 ×1000 부풀어 쓰지 않는다.
  local function now()
    local e=DateTime.UtcNow.Elapsed
    local k=(e+9*3600000)%MS
    return e, string.format('%02d:%02d:%02d.%03d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60, math.floor(k%1000))
  end
  local function listkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end return table.concat(t,',') end
  local function idkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id) end return table.concat(t,',') end
  -- 새 날(빈 목록)에서 PlayerJournal.EnsureDaily가 고를 3칸 = 가능한 후보 pool[(day+i)%#pool+1] 앞 3개 (읽기 전용 재현 · EnsureDaily는 부르지 않는다)
  local function pred(day)
    local pool={} for _,d in ipairs(_JournalData:GetDailies()) do if J:DailyAvailable(d) then pool[#pool+1]=d end end
    local out={} for i=0,#pool-1 do if #out>=3 then break end out[#out+1]=pool[(day+i)%#pool+1].id end
    return table.concat(out,','), #pool
  end
  local function stored()
    local key='Char_'..tostring(SV.Slot)
    local code,pages=SV:Storage():BatchGetAndWait({key})
    if code~=0 or pages==nil then return 'key='..key..' code='..tostring(code) end
    local ds=pages:GetCurrentPageDatas() local v=(ds~=nil and ds[1]~=nil) and ds[1].Value or ''
    local ok,d=pcall(function() return _HttpService:JSONDecode(v) end)
    if not ok or type(d)~='table' or type(d.journal)~='table' then return 'key='..key..' nojournal len='..tostring(#v) end
    local c=type(d.journal.c)=='table' and d.journal.c or {}
    return 'key='..key..' len='..tostring(#v)..' dd='..tostring(d.journal.dd)..' d='..listkey(d.journal.d)..' gold='..tostring(type(d.stats)=='table' and d.stats.gold or '?')..' exp='..tostring(type(d.stats)=='table' and d.stats.exp or '?')..' c.daily='..tostring(c.daily)
  end
  local function snap()
    local e,k=now()
    local s={el=math.floor(e),kst=k,today=J:Today(),dd=J.DailyDay,list=listkey(J.Daily),ids=idkey(J.Daily),gold=ST.Gold,exp=ST.Exp,lv=ST.Level,
      daily=J.Counters.daily or 0,daily0=J.Counters['daily@0'] or 0,claims=J.ClaimCount,bag=#IV.Bag,slot=SV.Slot,load=SV.IsLoadSuccess}
    s.predToday,s.pool=pred(s.today)
    s.predNext=pred(s.today+1)
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    s.left=(ok and type(v)=='table') and v.left or '?'
    local okr,rk=pcall(function() return _GameConst:RoomKind() end)
    s.room=okr and rk or '?'
    return s
  end
  local function dump(tag,s)
    log(F..' '..tag..' time elapsed='..tostring(s.el)..' kst='..s.kst..' today='..tostring(s.today)..' dd='..tostring(s.dd)..' slot='..tostring(s.slot)..' load='..tostring(s.load)..' room='..tostring(s.room))
    log(F..' '..tag..' daily '..s.list..' digest_left_min='..tostring(s.left))
    log(F..' '..tag..' wallet gold='..tostring(s.gold)..' exp='..tostring(s.exp)..' lv='..tostring(s.lv)..' c.daily='..tostring(s.daily)..' c.daily@0='..tostring(s.daily0)..' claims='..tostring(s.claims)..' bag='..tostring(s.bag))
    log(F..' '..tag..' pred pool='..tostring(s.pool)..' today('..tostring(s.today)..')='..s.predToday..' next('..tostring(s.today+1)..')='..s.predNext)
    log(F..' '..tag..' storage '..stored())
    log(F..' '..tag..' paste {dd='..tostring(s.dd)..',ids=\''..s.ids..'\',list=\''..s.list..'\',gold='..tostring(s.gold)..',exp='..tostring(s.exp)..',daily='..tostring(s.daily)..',predNext=\''..s.predNext..'\'}')
  end
  local s=snap()
  dump('before',s)
  G.F03=G.F03 or {}
  G.F03.before=s
  if G.F03.timer~=nil then _TimerService:ClearTimer(G.F03.timer) G.F03.timer=nil end
  G.F03.edges={}
  local edges=G.F03.edges
  local last=tostring(J.DailyDay)..'|'..idkey(J.Daily)
  local n=0
  local id
  id=_TimerService:SetTimerRepeat(function()
    n=n+1
    if not isvalid(p) then _TimerService:ClearTimer(id) return end
    local cur=tostring(J.DailyDay)..'|'..idkey(J.Daily)
    if cur~=last then
      local e,k=now()
      edges[#edges+1]=k
      log(F..' edge #'..#edges..' kst='..k..' elapsed='..tostring(math.floor(e))..' '..last..' -> '..cur..' list='..listkey(J.Daily)..' gold='..tostring(ST.Gold)..' exp='..tostring(ST.Exp)..' c.daily='..tostring(J.Counters.daily))
      last=cur
    end
    if n>=1500 then _TimerService:ClearTimer(id) log(F..' edge watcher stop n='..n..' edges='..#edges) end
  end, 1)
  G.F03.timer=id
  log(F..' before watcher on id='..tostring(id)..' start='..last)
end

-- ===================== S11 / S21 / S31 · 화면 쪽 (client 컨텍스트 · 각 서버 블록 바로 뒤) =====================
-- TAG만 바꿔 쓴다: S11='before' · S21='after' · S31='reconnect'. 일지 창을 일일 탭으로 열고(이미 열려 있으면 그대로) 본인 Digest의 일일 3줄을 남긴다.
-- 실행 뒤 5초 기다려 screenshot 1장(F03-<TAG>_journal.png). Digest.left(남은 분)는 서버 Flush가 Dirty일 때만 다시 계산돼 몇 분 묵을 수 있다.
do
  local TAG='before'
  local F='[F03]'
  local me=_UserService.LocalPlayer
  local J=(me~=nil) and me:GetComponent('script.PlayerJournal') or nil
  local okT,kst=pcall(function() local k=(DateTime.UtcNow.Elapsed+9*3600000)%86400000 return string.format('%02d:%02d:%02d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60) end)
  if J==nil then log(F..' client '..TAG..' no journal component')
  else
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    local rows={}
    if ok and type(v)=='table' then for _,r in ipairs(v.daily or {}) do rows[#rows+1]=tostring(r.n)..' '..tostring(r.p)..'/'..tostring(r.c)..((r.d==true) and ' 완료' or '') end end
    if not _UIKit:IsOpen(_JournalWindow.Win) then _JournalWindow:Toggle() end
    _JournalWindow:SetTab('daily')
    log(F..' client '..TAG..' kst='..tostring(okT and kst or '?')..' open='..tostring(_UIKit:IsOpen(_JournalWindow.Win))..' tab='.._JournalWindow.Tab..' left_min='..tostring(ok and type(v)=='table' and v.left or '?')..' rows='..#rows..' '..table.concat(rows,' | '))
  end
end

-- ===================== S20 · 자정 뒤 스냅샷 + 비교 (같은 게임 방 server · 00:02, 입력 없이 마을에 서 있던 상태) =====================
-- `[F03] after ...` 6줄 + `[F03] after check ...` 관찰값(yes/no · 판정은 코덱스). BEFORE가 nil이면 S10이 남긴 _G.F03.before를 쓴다.
-- _G가 이어지지 않으면 S10 로그의 `[F03] before paste {...}`의 {...}를 아래 BEFORE= 뒤에 붙여 다시 실행.
do
  local BEFORE=nil
  local F='[F03]'
  local MS=86400000
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local J=p:GetComponent('script.PlayerJournal')
  local ST=p:GetComponent('script.PlayerStats')
  local IV=p:GetComponent('script.PlayerInventory')
  local SV=p:GetComponent('script.PlayerSave')
  local G=_G if type(G)~='table' then G={} end
  -- 시각: 게임과 같은 DateTime.UtcNow.Elapsed(ms, 0001-01-01 기준)만 찍는다. execute_script 안에서 잰 "걸린 시간"은 ×1000 부풀어 쓰지 않는다.
  local function now()
    local e=DateTime.UtcNow.Elapsed
    local k=(e+9*3600000)%MS
    return e, string.format('%02d:%02d:%02d.%03d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60, math.floor(k%1000))
  end
  local function listkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end return table.concat(t,',') end
  local function idkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id) end return table.concat(t,',') end
  -- 새 날(빈 목록)에서 PlayerJournal.EnsureDaily가 고를 3칸 = 가능한 후보 pool[(day+i)%#pool+1] 앞 3개 (읽기 전용 재현 · EnsureDaily는 부르지 않는다)
  local function pred(day)
    local pool={} for _,d in ipairs(_JournalData:GetDailies()) do if J:DailyAvailable(d) then pool[#pool+1]=d end end
    local out={} for i=0,#pool-1 do if #out>=3 then break end out[#out+1]=pool[(day+i)%#pool+1].id end
    return table.concat(out,','), #pool
  end
  local function stored()
    local key='Char_'..tostring(SV.Slot)
    local code,pages=SV:Storage():BatchGetAndWait({key})
    if code~=0 or pages==nil then return 'key='..key..' code='..tostring(code) end
    local ds=pages:GetCurrentPageDatas() local v=(ds~=nil and ds[1]~=nil) and ds[1].Value or ''
    local ok,d=pcall(function() return _HttpService:JSONDecode(v) end)
    if not ok or type(d)~='table' or type(d.journal)~='table' then return 'key='..key..' nojournal len='..tostring(#v) end
    local c=type(d.journal.c)=='table' and d.journal.c or {}
    return 'key='..key..' len='..tostring(#v)..' dd='..tostring(d.journal.dd)..' d='..listkey(d.journal.d)..' gold='..tostring(type(d.stats)=='table' and d.stats.gold or '?')..' exp='..tostring(type(d.stats)=='table' and d.stats.exp or '?')..' c.daily='..tostring(c.daily)
  end
  local function snap()
    local e,k=now()
    local s={el=math.floor(e),kst=k,today=J:Today(),dd=J.DailyDay,list=listkey(J.Daily),ids=idkey(J.Daily),gold=ST.Gold,exp=ST.Exp,lv=ST.Level,
      daily=J.Counters.daily or 0,daily0=J.Counters['daily@0'] or 0,claims=J.ClaimCount,bag=#IV.Bag,slot=SV.Slot,load=SV.IsLoadSuccess}
    s.predToday,s.pool=pred(s.today)
    s.predNext=pred(s.today+1)
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    s.left=(ok and type(v)=='table') and v.left or '?'
    local okr,rk=pcall(function() return _GameConst:RoomKind() end)
    s.room=okr and rk or '?'
    return s
  end
  local function dump(tag,s)
    log(F..' '..tag..' time elapsed='..tostring(s.el)..' kst='..s.kst..' today='..tostring(s.today)..' dd='..tostring(s.dd)..' slot='..tostring(s.slot)..' load='..tostring(s.load)..' room='..tostring(s.room))
    log(F..' '..tag..' daily '..s.list..' digest_left_min='..tostring(s.left))
    log(F..' '..tag..' wallet gold='..tostring(s.gold)..' exp='..tostring(s.exp)..' lv='..tostring(s.lv)..' c.daily='..tostring(s.daily)..' c.daily@0='..tostring(s.daily0)..' claims='..tostring(s.claims)..' bag='..tostring(s.bag))
    log(F..' '..tag..' pred pool='..tostring(s.pool)..' today('..tostring(s.today)..')='..s.predToday..' next('..tostring(s.today+1)..')='..s.predNext)
    log(F..' '..tag..' storage '..stored())
    log(F..' '..tag..' paste {dd='..tostring(s.dd)..',ids=\''..s.ids..'\',list=\''..s.list..'\',gold='..tostring(s.gold)..',exp='..tostring(s.exp)..',daily='..tostring(s.daily)..',predNext=\''..s.predNext..'\'}')
  end
  local a=snap()
  dump('after',a)
  local B=BEFORE or (G.F03 and G.F03.before)
  if B==nil then log(F..' after check SKIP no BEFORE (paste S10 before paste line)')
  else
    local fresh,uniq,seen=true,true,{}
    for _,s in ipairs(J.Daily) do
      if s.p~=0 or s.done then fresh=false end
      if seen[s.id] then uniq=false end seen[s.id]=true
    end
    -- 전날 완료 칸: before 목록에서 done=true였던 id → 지금 상태
    local carried={}
    for id in string.gmatch(B.list or '','([%w_]+):%d+:true') do
      local now_='absent' for _,s in ipairs(J.Daily) do if s.id==id then now_=tostring(s.p)..':'..tostring(s.done) end end
      carried[#carried+1]=id..'->'..now_
    end
    local yn=function(b) return b and 'yes' or 'no' end
    log(F..' after check dd '..tostring(B.dd)..'->'..tostring(a.dd)..' dd_plus1='..yn(a.dd==B.dd+1)..' dd_is_today='..yn(a.dd==a.today)
      ..' ids_changed='..yn(a.ids~=B.ids)..' ids_eq_before_predNext='..yn(a.ids==B.predNext)..' ids_eq_pred_today='..yn(a.ids==a.predToday)..' fresh_p0_undone='..yn(fresh)..' unique='..yn(uniq)..' count='..#J.Daily)
    log(F..' after check wallet gold '..tostring(B.gold)..'->'..tostring(a.gold)..' exp '..tostring(B.exp)..'->'..tostring(a.exp)..' c.daily '..tostring(B.daily)..'->'..tostring(a.daily)
      ..' no_repay='..yn(a.gold==B.gold and a.exp==B.exp and a.daily==B.daily)..' prev_done='..(#carried>0 and table.concat(carried,',') or 'none'))
  end
  local edges=(G.F03 and G.F03.edges) or nil
  log(F..' after check edges='..(edges and (#edges..' at '..table.concat(edges,',')) or 'n/a(_G 없음 → edge 로그 줄 수로 셈)'))
  if G.F03 and G.F03.timer~=nil then _TimerService:ClearTimer(G.F03.timer) G.F03.timer=nil log(F..' after watcher off') end
  G.F03=G.F03 or {}
  G.F03.after=a
end

-- ===================== S25 · 멈추기 전 저장 확인 (같은 게임 방 server · S20 뒤 · 00:03 전후) =====================
-- 자동 저장(PlayerSave.AutoSaveInterval 120초)이 새 날 목록을 Char_4에 썼는지 읽기만 한다. 강제 저장(Save(true))은 하지 않는다.
-- 최대 60초(5초 간격) 기다린다. still_old면 1~2분 뒤 한 번 더 돌리고, 그래도 old면 그대로 재접속(= 전날 저장을 경계 뒤 불러오는 경우)으로 기록.
do
  local F='[F03]'
  local MS=86400000
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local J=p:GetComponent('script.PlayerJournal')
  local ST=p:GetComponent('script.PlayerStats')
  local IV=p:GetComponent('script.PlayerInventory')
  local SV=p:GetComponent('script.PlayerSave')
  local G=_G if type(G)~='table' then G={} end
  -- 시각: 게임과 같은 DateTime.UtcNow.Elapsed(ms, 0001-01-01 기준)만 찍는다. execute_script 안에서 잰 "걸린 시간"은 ×1000 부풀어 쓰지 않는다.
  local function now()
    local e=DateTime.UtcNow.Elapsed
    local k=(e+9*3600000)%MS
    return e, string.format('%02d:%02d:%02d.%03d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60, math.floor(k%1000))
  end
  local function listkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end return table.concat(t,',') end
  local function idkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id) end return table.concat(t,',') end
  -- 새 날(빈 목록)에서 PlayerJournal.EnsureDaily가 고를 3칸 = 가능한 후보 pool[(day+i)%#pool+1] 앞 3개 (읽기 전용 재현 · EnsureDaily는 부르지 않는다)
  local function pred(day)
    local pool={} for _,d in ipairs(_JournalData:GetDailies()) do if J:DailyAvailable(d) then pool[#pool+1]=d end end
    local out={} for i=0,#pool-1 do if #out>=3 then break end out[#out+1]=pool[(day+i)%#pool+1].id end
    return table.concat(out,','), #pool
  end
  local function stored()
    local key='Char_'..tostring(SV.Slot)
    local code,pages=SV:Storage():BatchGetAndWait({key})
    if code~=0 or pages==nil then return 'key='..key..' code='..tostring(code) end
    local ds=pages:GetCurrentPageDatas() local v=(ds~=nil and ds[1]~=nil) and ds[1].Value or ''
    local ok,d=pcall(function() return _HttpService:JSONDecode(v) end)
    if not ok or type(d)~='table' or type(d.journal)~='table' then return 'key='..key..' nojournal len='..tostring(#v) end
    local c=type(d.journal.c)=='table' and d.journal.c or {}
    return 'key='..key..' len='..tostring(#v)..' dd='..tostring(d.journal.dd)..' d='..listkey(d.journal.d)..' gold='..tostring(type(d.stats)=='table' and d.stats.gold or '?')..' exp='..tostring(type(d.stats)=='table' and d.stats.exp or '?')..' c.daily='..tostring(c.daily)
  end
  local function snap()
    local e,k=now()
    local s={el=math.floor(e),kst=k,today=J:Today(),dd=J.DailyDay,list=listkey(J.Daily),ids=idkey(J.Daily),gold=ST.Gold,exp=ST.Exp,lv=ST.Level,
      daily=J.Counters.daily or 0,daily0=J.Counters['daily@0'] or 0,claims=J.ClaimCount,bag=#IV.Bag,slot=SV.Slot,load=SV.IsLoadSuccess}
    s.predToday,s.pool=pred(s.today)
    s.predNext=pred(s.today+1)
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    s.left=(ok and type(v)=='table') and v.left or '?'
    local okr,rk=pcall(function() return _GameConst:RoomKind() end)
    s.room=okr and rk or '?'
    return s
  end
  local function dump(tag,s)
    log(F..' '..tag..' time elapsed='..tostring(s.el)..' kst='..s.kst..' today='..tostring(s.today)..' dd='..tostring(s.dd)..' slot='..tostring(s.slot)..' load='..tostring(s.load)..' room='..tostring(s.room))
    log(F..' '..tag..' daily '..s.list..' digest_left_min='..tostring(s.left))
    log(F..' '..tag..' wallet gold='..tostring(s.gold)..' exp='..tostring(s.exp)..' lv='..tostring(s.lv)..' c.daily='..tostring(s.daily)..' c.daily@0='..tostring(s.daily0)..' claims='..tostring(s.claims)..' bag='..tostring(s.bag))
    log(F..' '..tag..' pred pool='..tostring(s.pool)..' today('..tostring(s.today)..')='..s.predToday..' next('..tostring(s.today+1)..')='..s.predNext)
    log(F..' '..tag..' storage '..stored())
    log(F..' '..tag..' paste {dd='..tostring(s.dd)..',ids=\''..s.ids..'\',list=\''..s.list..'\',gold='..tostring(s.gold)..',exp='..tostring(s.exp)..',daily='..tostring(s.daily)..',predNext=\''..s.predNext..'\'}')
  end
  local today=J:Today()
  local st=stored()
  local tries=0
  while string.find(st,' dd='..tostring(today)..' ',1,true)==nil and tries<12 do wait(5) tries=tries+1 st=stored() end
  local _,k=now()
  local fresh=string.find(st,' dd='..tostring(today)..' ',1,true)~=nil
  log(F..' presave kst='..k..' today='..tostring(today)..' storage_is_today='..tostring(fresh)..' polls='..tries..' mem='..listkey(J.Daily)..' storage '..st)
end

-- ===================== S30 · 재접속 뒤 (stop → play → 로비 → 슬롯 4 입장 → Solo 뒤 새 게임 방 server · 00:05 전후) =====================
-- 서버가 새로 떴으므로 _G는 비어 있다. S20 로그의 `[F03] after paste {...}`의 {...}를 AFTER= 뒤에 붙여 실행.
do
  local AFTER=nil
  local F='[F03]'
  local MS=86400000
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local J=p:GetComponent('script.PlayerJournal')
  local ST=p:GetComponent('script.PlayerStats')
  local IV=p:GetComponent('script.PlayerInventory')
  local SV=p:GetComponent('script.PlayerSave')
  local G=_G if type(G)~='table' then G={} end
  -- 시각: 게임과 같은 DateTime.UtcNow.Elapsed(ms, 0001-01-01 기준)만 찍는다. execute_script 안에서 잰 "걸린 시간"은 ×1000 부풀어 쓰지 않는다.
  local function now()
    local e=DateTime.UtcNow.Elapsed
    local k=(e+9*3600000)%MS
    return e, string.format('%02d:%02d:%02d.%03d', math.floor(k/3600000), math.floor(k/60000)%60, math.floor(k/1000)%60, math.floor(k%1000))
  end
  local function listkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id)..':'..tostring(s.p)..':'..tostring(s.done) end return table.concat(t,',') end
  local function idkey(daily) local t={} for _,s in ipairs(daily or {}) do t[#t+1]=tostring(s.id) end return table.concat(t,',') end
  -- 새 날(빈 목록)에서 PlayerJournal.EnsureDaily가 고를 3칸 = 가능한 후보 pool[(day+i)%#pool+1] 앞 3개 (읽기 전용 재현 · EnsureDaily는 부르지 않는다)
  local function pred(day)
    local pool={} for _,d in ipairs(_JournalData:GetDailies()) do if J:DailyAvailable(d) then pool[#pool+1]=d end end
    local out={} for i=0,#pool-1 do if #out>=3 then break end out[#out+1]=pool[(day+i)%#pool+1].id end
    return table.concat(out,','), #pool
  end
  local function stored()
    local key='Char_'..tostring(SV.Slot)
    local code,pages=SV:Storage():BatchGetAndWait({key})
    if code~=0 or pages==nil then return 'key='..key..' code='..tostring(code) end
    local ds=pages:GetCurrentPageDatas() local v=(ds~=nil and ds[1]~=nil) and ds[1].Value or ''
    local ok,d=pcall(function() return _HttpService:JSONDecode(v) end)
    if not ok or type(d)~='table' or type(d.journal)~='table' then return 'key='..key..' nojournal len='..tostring(#v) end
    local c=type(d.journal.c)=='table' and d.journal.c or {}
    return 'key='..key..' len='..tostring(#v)..' dd='..tostring(d.journal.dd)..' d='..listkey(d.journal.d)..' gold='..tostring(type(d.stats)=='table' and d.stats.gold or '?')..' exp='..tostring(type(d.stats)=='table' and d.stats.exp or '?')..' c.daily='..tostring(c.daily)
  end
  local function snap()
    local e,k=now()
    local s={el=math.floor(e),kst=k,today=J:Today(),dd=J.DailyDay,list=listkey(J.Daily),ids=idkey(J.Daily),gold=ST.Gold,exp=ST.Exp,lv=ST.Level,
      daily=J.Counters.daily or 0,daily0=J.Counters['daily@0'] or 0,claims=J.ClaimCount,bag=#IV.Bag,slot=SV.Slot,load=SV.IsLoadSuccess}
    s.predToday,s.pool=pred(s.today)
    s.predNext=pred(s.today+1)
    local ok,v=pcall(function() return _HttpService:JSONDecode(J.Digest) end)
    s.left=(ok and type(v)=='table') and v.left or '?'
    local okr,rk=pcall(function() return _GameConst:RoomKind() end)
    s.room=okr and rk or '?'
    return s
  end
  local function dump(tag,s)
    log(F..' '..tag..' time elapsed='..tostring(s.el)..' kst='..s.kst..' today='..tostring(s.today)..' dd='..tostring(s.dd)..' slot='..tostring(s.slot)..' load='..tostring(s.load)..' room='..tostring(s.room))
    log(F..' '..tag..' daily '..s.list..' digest_left_min='..tostring(s.left))
    log(F..' '..tag..' wallet gold='..tostring(s.gold)..' exp='..tostring(s.exp)..' lv='..tostring(s.lv)..' c.daily='..tostring(s.daily)..' c.daily@0='..tostring(s.daily0)..' claims='..tostring(s.claims)..' bag='..tostring(s.bag))
    log(F..' '..tag..' pred pool='..tostring(s.pool)..' today('..tostring(s.today)..')='..s.predToday..' next('..tostring(s.today+1)..')='..s.predNext)
    log(F..' '..tag..' storage '..stored())
    log(F..' '..tag..' paste {dd='..tostring(s.dd)..',ids=\''..s.ids..'\',list=\''..s.list..'\',gold='..tostring(s.gold)..',exp='..tostring(s.exp)..',daily='..tostring(s.daily)..',predNext=\''..s.predNext..'\'}')
  end
  local r=snap()
  dump('reconnect',r)
  local yn=function(b) return b and 'yes' or 'no' end
  log(F..' reconnect check dd_is_today='..yn(r.dd==r.today)..' ids_eq_pred_today='..yn(r.ids==r.predToday))
  if AFTER==nil then log(F..' reconnect check SKIP no AFTER (paste S20 after paste line)')
  else
    log(F..' reconnect check dd '..tostring(AFTER.dd)..'->'..tostring(r.dd)..' same_dd='..yn(r.dd==AFTER.dd)..' same_list='..yn(r.list==AFTER.list)..' same_ids='..yn(r.ids==AFTER.ids)
      ..' gold '..tostring(AFTER.gold)..'->'..tostring(r.gold)..' exp '..tostring(AFTER.exp)..'->'..tostring(r.exp)..' c.daily '..tostring(AFTER.daily)..'->'..tostring(r.daily)
      ..' no_repay='..yn(r.gold==AFTER.gold and r.exp==AFTER.exp and r.daily==AFTER.daily))
  end
end

-- ===================== S90 · 슬롯 4 복원 (server_main · 마지막 stop → play 뒤 로비 캐릭터 선택 화면 · 입장 누르지 않음) =====================
-- 경우 A: S00 로그가 match_S48=5/5 → 이 블록 대신 ../2026-10-30-summon48-maker/slot4-restore-S48.lua 를 그대로 실행(같은 guard/readback).
-- 경우 B: 그 밖 → python3 F03-make-restore.py <S00 로그 파일> 가 아래 E·HEX 두 줄을 채운 F03-S90-filled.lua 를 만든다. 그 파일을 실행.
-- guard: 16진을 푼 본문 5개의 len/djb2가 모두 S00 backup 줄과 같을 때만 BatchSetAndWait. 뒤에 다시 읽어 match=5/5 확인.
do
  local F='[F03]'
  local E={} --@@E@@
  local HEX={} --@@HEX@@
  local p for _,u in pairs(_UserService.UserEntities) do p=u end
  local SV=p:GetComponent('script.PlayerSave')
  local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
  local function unhex(x) return (string.gsub(x,'%x%x',function(b) return string.char(tonumber(b,16)) end)) end
  local keys={'Account','Char_4','Inv_4','Shadow_4','Stash'}
  local B={} local good=0 local gl={}
  for _,k in ipairs(keys) do
    if HEX[k]~=nil then B[k]=unhex(HEX[k]) end
    local s=B[k]~=nil and (#B[k]..'/'..h(B[k])) or 'missing'
    if E[k]~=nil and s==E[k] then good=good+1 end
    gl[#gl+1]=k..'='..s
  end
  local function rb(tag)
    local code,pages=SV:Storage():BatchGetAndWait(keys) local out={} local m=0
    if code==0 and pages~=nil then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key local s=#ds[i].Value..'/'..h(ds[i].Value) if E[k]==s then m=m+1 end out[#out+1]=k..'='..s end end
    log(F..' restore '..tag..' code='..tostring(code)..' match='..m..'/5 '..table.concat(out,' '))
  end
  log(F..' restore slot='..tostring(SV.Slot)..' (0이어야 함 · 입장 전)')
  rb('before')
  log(F..' restore guard body match='..good..'/5 '..table.concat(gl,' '))
  if good==5 and SV.Slot==0 then
    local code,okKeys=SV:Storage():BatchSetAndWait(B)
    local n=0 if okKeys~=nil then for _ in pairs(okKeys) do n=n+1 end end
    log(F..' restore BatchSetAndWait code='..tostring(code)..' ok_keys='..n)
    wait(1) rb('after')
  else log(F..' restore SKIPPED guard failed (good='..good..' slot='..tostring(SV.Slot)..')') end
end
