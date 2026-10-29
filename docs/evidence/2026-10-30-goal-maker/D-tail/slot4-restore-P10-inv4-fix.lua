-- 슬롯 4 Inv_4 재복원(1차 붙여넣기에서 짚신 2개가 더 들어가 1886바이트 → 백업 1838바이트로 다시 씀 · 짚신 53개는 string.rep으로 생성)
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local sv=p:GetComponent('script.PlayerSave')
local function h(s) local a=5381 for i=1,#s do a=(a*33+string.byte(s,i))%2147483647 end return a end
local keys={'Account','Char_4','Inv_4','Shadow_4','Stash'}
local prefix=[==[{"corpses":{"count":0},"inv":{"equip":{"armor":"armor3|2|42|철혼의 눈 망령 갑주|fireRes=10,life=16,vit=7|0|","weapon":"scythe1|0|1|단낫||0|"},"bagCount":59,"equipCount":2,"socketTokens":1,"bag":["hp1|0|1|하급 생명 물약||0||3","mp1|0|1|하급 마나 물약||0||2","tp|0|1|귀환 두루마리||0||2","ashen_hood|0|1|잿빛 장막 후드||0|","lamp1|1|1|망자를 부르는 등불|minion=20|2|","boots28|2|42|흉조의 눈 묘지기의 장화|coldRes=11,def=14,gf=15,lightRes=10,mf=7|0|"]==]
local boot=[==[,"boots1|0|1|짚신||0|"]==]
local suffix=[==[],"ashenHoodGranted":true},"v":2,"belt":{"v":2,"lay":"hp,mp,tp,"}}]==]
local inv=prefix..string.rep(boot,53)..suffix
log('[VRF] INT P10 slot4 Inv_4 재복원 값 len='..#inv..' hash='..h(inv)..' (기대 1838/694193390)')
if #inv ~= 1838 or h(inv) ~= 694193390 then log('[VRF] INT P10 slot4 Inv_4 값 불일치 — 쓰지 않음') return end
local code, okKeys = sv:Storage():BatchSetAndWait({ Inv_4 = inv })
local n=0 if okKeys~=nil then for _ in pairs(okKeys) do n=n+1 end end
log('[VRF] INT P10 slot4 Inv_4 BatchSetAndWait code='..tostring(code)..' ok_keys='..tostring(n))
wait(1)
local expect='Account=615/1340525624 Char_4=1126/1554558725 Inv_4=1838/694193390 Shadow_4=40/923051497 Stash=83/2144937209'
local got=sv:BatchGet(keys) local out={} for _,k in ipairs(keys) do local v=got and got[k] or nil table.insert(out, k..'='..(v and (tostring(#v)..'/'..tostring(h(v))) or 'nil')) end
local after=table.concat(out,' ')
log('[VRF] INT P10 slot4 readback-after2 '..after)
log('[VRF] INT P10 slot4 결과2 match='..tostring(after==expect))
