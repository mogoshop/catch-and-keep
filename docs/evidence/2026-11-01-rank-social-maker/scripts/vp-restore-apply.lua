-- DM 가상 계정 저장 되돌리기 (server_main · 적용 · 13:10): vp-restore.lua 찾기만 결과(1~3 = 새로 생긴 5키, 4 = 없음)대로 지우고 다시 읽어 시작 상태와 대조
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local keys={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
local E={['4LxSEC1']='Char=292/412299513 Inv=202/1615270711 Shadow=46/1394043070',['4LxSEC2']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC3']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC4']=''}
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3'}) do
 local st=_DataStorageService:GetUserDataStorage(prof)
 local c,ok=st:BatchDeleteAndWait({'Account','Stash','Char_1','Inv_1','Shadow_1'})
 log('[VRF] DMVPR '..prof..' delete code='..tostring(c)..' n='..tostring(ok and #ok))
end
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3','4LxSEC4'}) do
 local code,pages=_DataStorageService:GetUserDataStorage(prof):BatchGetAndWait(keys)
 local now={}
 if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value if v~=nil then table.insert(now,ds[i].KeyInfo.Key..'='..#v..'/'..h(v)) end end end
 local s=table.concat(now,' ')
 log('[VRF] DMVPR after '..prof..' code='..tostring(code)..' match='..tostring(s==E[prof])..' now='..s)
end
