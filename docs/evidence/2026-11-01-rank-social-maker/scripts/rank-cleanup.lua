-- DM 랭킹 저장소 정리 (server_main): 가상 계정(ProfileCode 4LxSEC<숫자>) 캐릭터 줄만 — rank_progress_0_c1(정렬) · rank_names_c1 · rank_looks_c1. APPLY=false면 찾기만
local APPLY=__APPLY__
local board='rank_progress_0_c1'
local sd=_DataStorageService:GetSortableDataStorage(board)
local code,pages=sd:GetSortedAndWait(SortDirection.Descending,0,2000000000)
local vp={} local all={}
if code==0 then local ds=pages:GetCurrentPageDatas() for i=1,#ds do local k=ds[i].KeyInfo.Key table.insert(all,k..'='..tostring(ds[i].Value)) if string.match(k,'^4LxSEC%d+_') then table.insert(vp,k) end end end
log('[VRF] DMRC board='..board..' code='..tostring(code)..' rows='..#all..' '..table.concat(all,' '))
log('[VRF] DMRC vp keys='..table.concat(vp,','))
if APPLY and #vp>0 then
 local c1,o1=sd:BatchDeleteAndWait(vp)
 local c2,o2=_DataStorageService:GetGlobalDataStorage('rank_names_c1'):BatchDeleteAndWait(vp)
 local c3,o3=_DataStorageService:GetGlobalDataStorage('rank_looks_c1'):BatchDeleteAndWait(vp)
 log('[VRF] DMRC delete sortable='..tostring(c1)..' names='..tostring(c2)..' looks='..tostring(c3))
 local code2,pages2=sd:GetSortedAndWait(SortDirection.Descending,0,2000000000)
 local after={} if code2==0 then local ds=pages2:GetCurrentPageDatas() for i=1,#ds do table.insert(after,ds[i].KeyInfo.Key..'='..tostring(ds[i].Value)) end end
 log('[VRF] DMRC after rows='..#after..' '..table.concat(after,' '))
end
