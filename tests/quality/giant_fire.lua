-- 48 독립 코드 검토 FIRE-01~03 (summon48-independent-code-review.json · 10-30): 실제 본문으로 저항 계산 경로를 거친다
--   (giant_skills의 스칼라 저항 대역은 Monster:GetResist(element)를 안 거쳐 증거가 아님 — 이 묶음이 그 자리)
--   FIRE-01 원소 붕괴 노드: 노바·메테오 명중 → 화염 저항만 -15 · 4초 · 저항 붕괴 10과 겹치면 화염 15(25 아님) · 냉기·마법 10 · 만료 복원
--   FIRE-02 마법사 거인 평타 구슬·자리 폭발 = 몸 속성과 무관하게 fire · 갈라진 뒤 원래 속성 · 보통 마법사·다른 공격은 원래 속성
--   FIRE-03 skill.giant_nova · giant_nova2 · giant_meteor = fire · 기존 캐릭터·다른 거인 기술 속성 그대로
-- @source Monster Monster/Monster.mlua GetResist
-- @source MonsterStatus Monster/MonsterStatus.mlua ResistBreak,ResistBreakFor,ApplyFireBreak,AuraAmount
-- @source PlayerAttack Combat/PlayerAttack.mlua SkillElement
-- @source ShadowUnit Shadow/ShadowUnit.mlua CalcDamage,AttackElement,AttackElementRatio,DuelDamage,AuraAmount,AuraMult
-- @source RiteGiantMoves Undead/RiteGiantMoves.mlua GiantImprint,NodeOf,MageResist
local checks=0
local function ok(c,msg) assert(c,msg) checks=checks+1 end
local function near(a,b) return math.abs(a-b)<1e-6 end
function isvalid(x) return x~=nil and x~=false end
_UtilLogic={ElapsedSeconds=100,ServerElapsedSeconds=100,RandomDouble=function() return 0.99 end}
_GameConst={LevelOf=function() return 0 end,LevelGapDealt=function() return 1 end}
-- 한 대상: 화염 30 · 냉기 20 · 마법 10 (서로 다른 원래 저항)
local BASE={fire=30,cold=20,magic=10}
local function target()
 local st=setmetatable({ResistBreakUntil=0,ResistBreakPct=0,FireBreakUntil=0,FireBreakPct=0,AuraUntil=0,AuraVals={}},{__index=MonsterStatus})
 local mon=setmetatable({Level=1,IsDead=false},{__index=Monster})
 function mon:Traits() return {GetResist=function(_,e) return BASE[e] or 0 end} end
 function mon:Status() return st end
 function mon:GuardMult() return 1 end
 function mon:GetDamageTakenMultiplier() return 1 end
 mon.Entity={GetComponent=function(_,k) if k=='script.Monster' then return mon end end}
 return mon,st
end
local function res(mon) return mon:GetResist('fire'),mon:GetResist('cold'),mon:GetResist('magic') end

-- FIRE-01 ① 노드 켠 노바/메테오 명중 → 화염만 -15 · 4초
local owner={GetComponent=function(_,k) if k=='script.SkillBook' then return {Node=function(_,id) return id=='giant_mage_resist' and 1 or 0 end} end end}
local giantUnit={OwnerPlayer=owner}
do
 local mon,st=target()
 local f,c,m=res(mon)
 ok(f==30 and c==20 and m==10,'원래 저항 30/20/10')
 RiteGiantMoves:MageResist(giantUnit,mon)
 f,c,m=res(mon)
 ok(f==15 and c==20 and m==10,'fire_only_minus15: 화염만 -15 (냉기·마법 그대로) '..f..'/'..c..'/'..m)
 _UtilLogic.ElapsedSeconds=103.9
 ok(mon:GetResist('fire')==15,'4초 안 유지')
 _UtilLogic.ElapsedSeconds=104.01
 f,c,m=res(mon)
 ok(f==30 and c==20 and m==10,'fire_break_expiry_restores: 4초 뒤 복원')
 ok(st.ResistBreakPct==0 and st.ResistBreakUntil==0,'플레이어 저주(저항 붕괴)는 걸지 않음 — IsCursed·표식 밖')
end
-- FIRE-01 ② 저항 붕괴 10과 겹치면 화염 15(25 아님) · 냉기·마법 10 · 만료 순서대로 복원
do
 _UtilLogic.ElapsedSeconds=200
 local mon,st=target()
 st.ResistBreakPct=10 st.ResistBreakUntil=206
 local f,c,m=res(mon)
 ok(f==20 and c==10 and m==0,'저항 붕괴 10만: 모두 -10')
 RiteGiantMoves:MageResist(giantUnit,mon)
 f,c,m=res(mon)
 ok(f==15 and c==10 and m==0,'same_family_max_not_sum: 화염 15만 빠짐(25 아님) · 냉기·마법 10 '..f..'/'..c..'/'..m)
 _UtilLogic.ElapsedSeconds=204.5
 f,c,m=res(mon)
 ok(f==20 and c==10 and m==0,'화염 감소 만료 → 저항 붕괴 10으로')
 _UtilLogic.ElapsedSeconds=206.5
 f,c,m=res(mon)
 ok(f==30 and c==20 and m==0+10,'둘 다 만료 → 원래')
 -- 오오라(부식)는 따로 더해진다 (기존 그대로)
 st.AuraUntil=300 st.AuraVals={corrode=5}
 RiteGiantMoves:MageResist(giantUnit,mon)
 ok(mon:GetResist('fire')==10 and mon:GetResist('cold')==15,'부식 오오라 5는 그대로 더함 (화염 30-15-5 · 냉기 20-5)')
end
-- 노드 없으면 아무 것도 안 건다
do
 local mon=target()
 RiteGiantMoves:MageResist({OwnerPlayer={GetComponent=function(_,k) if k=='script.SkillBook' then return {Node=function() return 0 end} end end}},mon)
 ok(mon:GetResist('fire')==30,'노드 0이면 감소 없음')
end
-- FIRE-03 새 화염 기술 속성
do
 for _,info in ipairs({'skill.giant_nova','skill.giant_nova2','skill.giant_meteor'}) do ok(PlayerAttack:SkillElement(info)=='fire','giant_fire_skill_element: '..info..' = fire') end
 ok(PlayerAttack:SkillElement('skill.hex_flame')=='fire' and PlayerAttack:SkillElement('skill.frost_soul')=='cold' and PlayerAttack:SkillElement('skill.bone_spear')=='magic','기존 캐릭터 기술 속성 그대로')
 for _,info in ipairs({'skill.giant_spin','skill.giant_slam','skill.giant_rift','skill.giant_dash','skill.giant_flurry'}) do ok(PlayerAttack:SkillElement(info)=='magic','다른 거인 기술 그대로 magic: '..info) end
end
-- FIRE-02 마법사 거인 평타 구슬·폭발 = fire (실제 CalcDamage → Monster:GetResist)
local function mage(element,giant)
 local u=setmetatable({},{__index=ShadowUnit})
 u.Kind='mage' u.Giant=giant u.GiantKind=giant and 'mage' or '' u.Element=element u.ElementRatio=1 u.Atk=100
 u.BasicMult=1 u.BoltMult=1 u.ShotMul=1 u.BlastMult=0.3 u.AuraUntil=0 u.AuraVals={} u.Variant='' u.OwnerPlayer=nil u.Entity={}
 function u:GetArch() return '' end
 function u:IsServer() return false end
 return u
end
do
 _UtilLogic.ElapsedSeconds=400
 local mon=target()
 local cold=mage('cold',true)
 ok(cold:AttackElement('shadow.ranged')=='fire' and cold:AttackElement('shadow.blast')=='fire','giant_mage_orb_fire: 냉기 마법사가 몸이어도 구슬·폭발 = fire')
 ok(near(cold:CalcDamage(nil,mon.Entity,'shadow.ranged'),70),'구슬 피해 = 화염 저항 30 적용(100→70) · 냉기 20 아님')
 ok(near(cold:CalcDamage(nil,mon.Entity,'shadow.blast'),21),'자리 폭발 ×0.3도 화염 저항 (30×0.7=21)')
 ok(cold:AttackElement('shadow.basic')=='cold','다른 공격 정보는 원래 속성')
 local split=mage('cold',false)
 ok(split:AttackElement('shadow.ranged')=='cold' and near(split:CalcDamage(nil,mon.Entity,'shadow.ranged'),80),'갈라진 뒤(보통 마법사) 원래 냉기 · 저항 20 → 80')
 local bone=mage('magic',true)
 ok(near(bone:CalcDamage(nil,mon.Entity,'shadow.ranged'),70),'마법(뼈) 마법사 몸 거인도 화염 30')
 local other=mage('cold',true) other.GiantKind='shield'
 ok(other:AttackElement('shadow.ranged')=='cold','마법사 거인이 아니면 그대로')
 -- 노드로 화염 -15 걸린 대상에게 구슬도 그 값을 본다
 RiteGiantMoves:MageResist(giantUnit,mon)
 ok(near(cold:CalcDamage(nil,mon.Entity,'shadow.ranged'),85),'원소 붕괴 뒤 구슬 = 화염 15 (100→85)')
end
print(string.format('[quality/giant_fire] FIRE-01~03 %d checks: fire_only_minus15 · fire_break_expiry_restores · same_family_max_not_sum · giant_fire_skill_element · giant_mage_orb_fire (real Monster.GetResist · ShadowUnit.CalcDamage)', checks))
