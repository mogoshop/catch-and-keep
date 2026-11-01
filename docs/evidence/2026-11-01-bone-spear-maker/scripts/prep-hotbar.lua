-- 준비 (server_main · 캐릭터 선택 화면 · 입장 전): 슬롯 4(새내기 · S48 기준 = bone_spear 5랭크)에 옛 스킬을 칸 2·우클릭에도 걸어 둔다 — LoadSaveData 칸 정리 확인용. 끝에 restore-main-5.lua(S48 5키)로 되돌린다
local ST=_DataStorageService:GetUserDataStorage('4LxSEC')
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local code,v=ST:GetAndWait('Char_4')
local base=(#v..'/'..h(v))
if base~='1126/1554558725' then log('[VRF] DMPREP skip base='..base) return end
local n1,n2
v,n1=string.gsub(v,'"right":""','"right":"bone_spear"',1)
v,n2=string.gsub(v,'"slots":"raise_skeleton,,,"','"slots":"raise_skeleton,bone_spear,,"',1)
local c2=ST:SetAndWait('Char_4',v)
local c3,v3=ST:GetAndWait('Char_4')
log('[VRF] DMPREP set code='..tostring(c2)..' n='..n1..'/'..n2..' now='..#v3..'/'..h(v3)..' skills='..tostring(string.match(v3,'"skills":(%b{})')))
