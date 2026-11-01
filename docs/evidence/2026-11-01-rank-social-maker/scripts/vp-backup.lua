-- DM 가상 플레이어 저장 백업 (server_main · 캐릭터 선택 화면 · 방에 들어가기 전): 실제 사용자(20372100010779593) 밖의 모든 사용자 · 17키 원문을 hex 조각으로 (len/djb2 함께)
local MAIN='20372100010779593'
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local keys={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
for _,u in pairs(_UserService.UserEntities) do
 local pc=u.PlayerComponent
 if pc.UserId~=MAIN then
  local prof=pc.ProfileCode local nick=pc.Nickname local uid=pc.UserId
  _DataStorageService:GetUserDataStorage(prof):BatchGetAsync(keys,function(code,ks,pages)
   local out={} local n=0
   if code==0 then
    local ds=pages:GetCurrentPageDatas()
    for i=1,#ds do
     local k=ds[i].KeyInfo.Key local v=ds[i].Value
     if v==nil then table.insert(out,k..'=nil') else n=n+1
     table.insert(out,k..'='..#v..'/'..h(v))
     local hex=string.gsub(v,'.',function(c) return string.format('%02x',string.byte(c)) end)
     local parts=math.ceil(#hex/1000)
     for j=1,parts do log('[VRF] DMVPBK '..prof..' '..k..' '..j..'/'..parts..' '..string.sub(hex,(j-1)*1000+1,j*1000)) end
     end
    end
    if not pages.IsLastPage then log('[VRF] DMVPBK '..prof..' MORE PAGES') end
   end
   log('[VRF] DMVPBK done prof='..prof..' uid='..uid..' nick='..tostring(nick)..' code='..tostring(code)..' n='..n..' '..table.concat(out,' '))
  end)
 end
end
log('[VRF] DMVPBK dispatched')
