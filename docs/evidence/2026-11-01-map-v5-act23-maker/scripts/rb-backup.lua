local p for _,u in pairs(_UserService.UserEntities) do p=u end
local sv=p:GetComponent('script.PlayerSave')
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local keys={'Account','Char_4','Inv_4','Shadow_4','Stash'}
local E={Account='615/1340525624',Char_4='1126/1554558725',Inv_4='1838/694193390',Shadow_4='40/923051497',Stash='83/2144937209'}
local code,pages=sv:Storage():BatchGetAndWait(keys) local out={} local m=0
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key local s=#ds[i].Value..'/'..h(ds[i].Value) if E[k]==s then m=m+1 end table.insert(out,k..'='..s) end end
log('[VRF] A23M backup readback code='..tostring(code)..' match='..m..'/5 '..table.concat(out,' ')..' load='..tostring(sv.IsLoadSuccess)..' map='..tostring(p.CurrentMapName))
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do log('[VRF] A23M backup val '..ds[i].KeyInfo.Key..' '..#ds[i].Value..' '..ds[i].Value) end end
