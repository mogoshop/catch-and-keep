-- DM 최종 재조회 (새 PC 플레이 · server_main · 캐릭터 선택 화면 · 입장 전): 실제 사용자 8키 · 가상 계정 4개 · 랭킹 성장 판 (비동기 동시)
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local E={Account='615/1340525624',Char_4='1126/1554558725',Inv_4='1838/694193390',Shadow_4='40/923051497',Stash='83/2144937209',Char_1='3190/857729665',Inv_1='3938/1790454507',Shadow_1='9335/1552983935'}
local keys={'Account','Char_4','Inv_4','Shadow_4','Stash','Char_1','Inv_1','Shadow_1'}
_DataStorageService:GetUserDataStorage('4LxSEC'):BatchGetAsync(keys,function(code,ks,pages)
 local m=0 local out={} if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value local s=v and (#v..'/'..h(v)) or 'nil' if E[ds[i].KeyInfo.Key]==s then m=m+1 end table.insert(out,ds[i].KeyInfo.Key..'='..s) end end
 log('[VRF] DMFINAL main code='..tostring(code)..' match='..m..'/8 '..table.concat(out,' '))
end)
local VE={['4LxSEC1']='Char=292/412299513 Inv=202/1615270711 Shadow=46/1394043070',['4LxSEC2']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC3']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC4']=''}
local k17={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3','4LxSEC4'}) do
 _DataStorageService:GetUserDataStorage(prof):BatchGetAsync(k17,function(code,ks,pages)
  local now={} if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value if v~=nil then table.insert(now,ds[i].KeyInfo.Key..'='..#v..'/'..h(v)) end end end
  local s=table.concat(now,' ') log('[VRF] DMFINAL '..prof..' code='..tostring(code)..' match='..tostring(s==VE[prof])..' now='..s)
 end)
end
_DataStorageService:GetSortableDataStorage('rank_progress_0_c1'):GetSortedAsync(SortDirection.Descending,0,2000000000,function(code,pages)
 local all={} if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do table.insert(all,ds[i].KeyInfo.Key..'='..tostring(ds[i].Value)) end end
 log('[VRF] DMFINAL rank_progress_0_c1 code='..tostring(code)..' rows='..#all..' '..table.concat(all,' '))
end)
log('[VRF] DMFINAL dispatched')
