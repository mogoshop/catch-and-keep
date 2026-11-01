-- DM backup (server_main · 캐릭터 선택 화면 · 입장 전): S48 5키 대조 + 슬롯 1 3키 · 8키 원문을 hex 조각으로 남김 (len/djb2 함께)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local sv=p:GetComponent('script.PlayerSave')
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local E={Account='615/1340525624',Char_4='1126/1554558725',Inv_4='1838/694193390',Shadow_4='40/923051497',Stash='83/2144937209'}
local keys={'Account','Char_4','Inv_4','Shadow_4','Stash','Char_1','Inv_1','Shadow_1'}
local code,pages=sv:Storage():BatchGetAndWait(keys)
local m=0 local out={} local n=0
if code==0 then
 local ds=pages:GetCurrentPageDatas()
 n=#ds
 for i=1,#ds do
  local k=ds[i].KeyInfo.Key local v=ds[i].Value local s=#v..'/'..h(v)
  if E[k]==s then m=m+1 end
  table.insert(out,k..'='..s)
  local hex=string.gsub(v,'.',function(c) return string.format('%02x',string.byte(c)) end)
  local parts=math.ceil(#hex/1000)
  for j=1,parts do log('[VRF] DMBK '..k..' '..j..'/'..parts..' '..string.sub(hex,(j-1)*1000+1,j*1000)) end
 end
end
log('[VRF] DMBK readback code='..tostring(code)..' n='..n..' s48match='..m..'/5 '..table.concat(out,' '))
log('[VRF] DMBK slot='..tostring(sv.Slot)..' selecting='..tostring(sv.Selecting)..' load='..tostring(sv.IsLoadSuccess)..' map='..tostring(p.CurrentMapName))
