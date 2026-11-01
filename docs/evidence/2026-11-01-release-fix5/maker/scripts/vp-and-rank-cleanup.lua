-- 정리 (server_main · 새 PC 플레이 · 캐릭터 선택 화면): ① 가상 계정 1~3에 이번 회차가 새로 만든 키만 지움(시작 상태 = Char·Inv·Shadow 3키 · 그 3키는 len/djb2 대조만) ② 성장 판 rank_progress_0_c1 · rank_names_c1 · rank_looks_c1에서 가상 계정(4LxSEC<숫자>_) 줄 지움
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local k17={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
local BASE={Char=true,Inv=true,Shadow=true}
local VE={['4LxSEC1']='Char=292/412299513 Inv=202/1615270711 Shadow=46/1394043070',['4LxSEC2']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC3']='Char=291/544327054 Inv=139/817364422 Shadow=46/1394043070',['4LxSEC4']=''}
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3','4LxSEC4'}) do
 local st=_DataStorageService:GetUserDataStorage(prof)
 local code,pages=st:BatchGetAndWait(k17)
 local extra={} local now={}
 if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key local v=ds[i].Value if v~=nil then table.insert(now,k..'='..#v..'/'..h(v)) if not BASE[k] then table.insert(extra,k) end end end end
 log('[VRF] DMVPR before '..prof..' extra='..table.concat(extra,','))
 if #extra>0 then local c=st:BatchDeleteAndWait(extra) log('[VRF] DMVPR delete '..prof..' code='..tostring(c)) end
 local code2,pages2=st:BatchGetAndWait(k17)
 local after={} if code2==0 then local ds=pages2:GetCurrentPageDatas() for i=1,#ds do local v=ds[i].Value if v~=nil then table.insert(after,ds[i].KeyInfo.Key..'='..#v..'/'..h(v)) end end end
 local s=table.concat(after,' ') log('[VRF] DMVPR after '..prof..' match='..tostring(s==VE[prof])..' now='..s)
end
local board='rank_progress_0_c1'
local sd=_DataStorageService:GetSortableDataStorage(board)
local code,pages=sd:GetSortedAndWait(SortDirection.Descending,0,2000000000)
local vp={} local all={}
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key table.insert(all,k..'='..tostring(ds[i].Value)) if string.match(k,'^4LxSEC%d+_') then table.insert(vp,k) end end end
log('[VRF] DMRC board='..board..' rows='..#all..' '..table.concat(all,' '))
if #vp>0 then
 local c1=sd:BatchDeleteAndWait(vp)
 local c2=_DataStorageService:GetGlobalDataStorage('rank_names_c1'):BatchDeleteAndWait(vp)
 local c3=_DataStorageService:GetGlobalDataStorage('rank_looks_c1'):BatchDeleteAndWait(vp)
 log('[VRF] DMRC delete n='..#vp..' sortable='..tostring(c1)..' names='..tostring(c2)..' looks='..tostring(c3))
end
local code2,pages2=sd:GetSortedAndWait(SortDirection.Descending,0,2000000000)
local after={} if code2==0 then local ds=pages2:GetCurrentPageDatas() for i=1,#ds do table.insert(after,ds[i].KeyInfo.Key..'='..tostring(ds[i].Value)) end end
log('[VRF] DMRC after rows='..#after..' '..table.concat(after,' '))
