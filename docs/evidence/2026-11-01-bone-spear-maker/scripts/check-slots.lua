-- DM 슬롯 대조 (server_main · 캐릭터 선택 화면 · 입장 전): 실제 사용자 8키 len/djb2를 S48 기준(../../2026-11-01-decisions-maker/slots-at-start.json)과 대조 + Char_4 skills 부분
local ST=_DataStorageService:GetUserDataStorage('4LxSEC')
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local E={Account='615/1340525624',Char_4='1126/1554558725',Inv_4='1838/694193390',Shadow_4='40/923051497',Stash='83/2144937209',Char_1='3190/857729665',Inv_1='3938/1790454507',Shadow_1='9335/1552983935'}
local keys={'Account','Char_4','Inv_4','Shadow_4','Stash','Char_1','Inv_1','Shadow_1'}
local code,pages=ST:BatchGetAndWait(keys)
local m=0 local out={}
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key local v=ds[i].Value local s=v and (#v..'/'..h(v)) or 'nil' if E[k]==s then m=m+1 end table.insert(out,k..'='..s..(E[k]==s and '' or '(!)'))
 if k=='Char_4' and v then log('[VRF] DMSLOT Char_4 skills='..tostring(string.match(v,'"skills":(%b{})'))..' stats='..tostring(string.match(v,'"stats":(%b{})'))) end
 if k=='Char_1' and v then log('[VRF] DMSLOT Char_1 skills='..tostring(string.match(v,'"skills":(%b{})'))) end
end end
log('[VRF] DMSLOT code='..tostring(code)..' match='..m..'/8 '..table.concat(out,' '))
