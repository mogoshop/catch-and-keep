-- 준비 확인 (server_main · 가상 플레이어 9명 추가 직후 · 방에 들어가기 전): 사용자 목록 + 가상 계정 1~4 저장 17키 len/djb2를 지난 회차 시작 상태(../../2026-11-01-rank-social-maker/vp-slots-at-start.json · vp-restore-apply의 E)와 대조
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local out={} for _,u in pairs(_UserService.UserEntities) do local pc=u.PlayerComponent table.insert(out,pc.UserId..'/'..tostring(pc.ProfileCode)..'/'..tostring(pc.Nickname)) end
log('[VRF] DMVP main users='..#out..' '..table.concat(out,' ; '))
local VE={['4LxSEC1']='Char=292/412299513 Inv=202/1615270711 Shadow=46/1394043070',['4LxSEC2']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC3']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC4']=''}
local k17={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3','4LxSEC4'}) do
 local code,pages=_DataStorageService:GetUserDataStorage(prof):BatchGetAndWait(k17)
 local now={} if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value if v~=nil then table.insert(now,ds[i].KeyInfo.Key..'='..#v..'/'..h(v)) end end end
 local s=table.concat(now,' ') log('[VRF] DMVP start '..prof..' code='..tostring(code)..' match='..tostring(s==VE[prof])..' now='..s)
end
