-- DM 가상 계정 저장 되돌리기 (server_main): vp-slots-at-start.json 기준 — 시작 때 없던 키는 지우고, 있던 키(Char·Inv·Shadow 이전 저장)는 원문과 다르면 원문으로. APPLY=false면 차이만 로그
local APPLY=__APPLY__
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local keys={'Account','Stash','Char','Inv','Shadow','Char_1','Inv_1','Shadow_1','Char_2','Inv_2','Shadow_2','Char_3','Inv_3','Shadow_3','Char_4','Inv_4','Shadow_4'}
local B={}
B['4LxSEC1']={['Char']=[==[{"travel":{"tp":2,"known":"camp"},"v":2,"settings":{"bgm":55,"ambience":100,"effects":100},"stats":{"fk":"","gold":8,"vit":15,"ene":25,"sp":0,"str":15,"exp":10,"maxDiff":0,"diff":0,"skp":1,"lv":1,"dex":25},"skills":{"levelCount":0,"sv":2,"slots":",,,","right":""},"quest":{"i":1,"p":0,"s":0}}]==],['Inv']=[==[{"corpses":{"entries":[{"y":-2,"x":2.1,"items":[{"s":"scythe1|0|1|단낫||0|","slot":"weapon"}],"map":"town","exp":0}],"count":1},"belt":{"rv":0,"hp":3,"mp":2},"inv":{"bagCount":0,"equipCount":0},"v":2}]==],['Shadow']=[==[{"shadow":{"essence":0,"shadowCount":0},"v":2}]==]}
B['4LxSEC2']={['Char']=[==[{"travel":{"tp":2,"known":"camp"},"v":2,"settings":{"bgm":55,"ambience":100,"effects":100},"stats":{"fk":"","gold":0,"vit":15,"ene":25,"sp":0,"str":15,"exp":0,"maxDiff":0,"diff":0,"skp":1,"lv":1,"dex":25},"skills":{"levelCount":0,"sv":2,"slots":",,,","right":""},"quest":{"i":1,"p":0,"s":0}}]==],['Inv']=[==[{"corpses":{"count":0},"belt":{"rv":0,"hp":3,"mp":2},"inv":{"bagCount":0,"equip":{"weapon":"scythe1|0|1|단낫||0|"},"equipCount":1},"v":2}]==],['Shadow']=[==[{"shadow":{"essence":0,"shadowCount":0},"v":2}]==]}
B['4LxSEC3']={['Char']=[==[{"travel":{"tp":2,"known":"camp"},"v":2,"settings":{"bgm":55,"ambience":100,"effects":100},"stats":{"fk":"","gold":0,"vit":15,"ene":25,"sp":0,"str":15,"exp":0,"maxDiff":0,"diff":0,"skp":1,"lv":1,"dex":25},"skills":{"levelCount":0,"sv":2,"slots":",,,","right":""},"quest":{"i":1,"p":0,"s":0}}]==],['Inv']=[==[{"corpses":{"count":0},"belt":{"rv":0,"hp":3,"mp":2},"inv":{"bagCount":0,"equip":{"weapon":"scythe1|0|1|단낫||0|"},"equipCount":1},"v":2}]==],['Shadow']=[==[{"shadow":{"essence":0,"shadowCount":0},"v":2}]==]}
B['4LxSEC4']={}
for _,prof in ipairs({'4LxSEC1','4LxSEC2','4LxSEC3','4LxSEC4'}) do
 local st=_DataStorageService:GetUserDataStorage(prof)
 local code,pages=st:BatchGetAndWait(keys)
 local del={} local set={} local same=0 local now={}
 if code==0 then
  local ds=pages:GetCurrentPageDatas()
  for i=1,#ds do local k=ds[i].KeyInfo.Key local v=ds[i].Value local orig=B[prof][k]
   if v~=nil then table.insert(now,k..'='..#v..'/'..h(v)) end
   if orig==nil then if v~=nil then table.insert(del,k) end
   elseif v==orig then same=same+1 else set[k]=orig end
  end
 end
 local ns=0 for _ in pairs(set) do ns=ns+1 end
 log('[VRF] DMVPR '..prof..' code='..tostring(code)..' keep='..same..' del='..table.concat(del,',')..' set='..ns..' now='..table.concat(now,' '))
 if APPLY then
  if #del>0 then local c,ok=st:BatchDeleteAndWait(del) log('[VRF] DMVPR '..prof..' delete code='..tostring(c)..' n='..tostring(ok and #ok)) end
  if ns>0 then local c,ok=st:BatchSetAndWait(set) log('[VRF] DMVPR '..prof..' set code='..tostring(c)) end
 end
end
log('[VRF] DMVPR done apply='..tostring(APPLY))