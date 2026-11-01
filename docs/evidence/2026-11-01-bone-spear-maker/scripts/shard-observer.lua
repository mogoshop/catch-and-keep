-- 관찰만 (DebugLog만 켬 → Projectile.Finish가 「[Projectile] end … hits=N」을 남김) (server_instance_game:…): 이 맵의 골편 투사체(Projectile.ViewKind = bone_shard)마다 MaxHits · 맞힌 적 수(HitIds)를 기록해 사라질 때 한 줄. 시전은 실제 S 키
local p for _,u in pairs(_UserService.UserEntities) do p=u end
local book=p:GetComponent('script.SkillBook')
log('[VRF] DMSHARD observer start GetShardHits='..tostring(book:GetShardHits())..' diff='..tostring(p:GetComponent('script.PlayerStats').Difficulty))
local seen={} local done=0
local t0=_UtilLogic.ElapsedSeconds
while _UtilLogic.ElapsedSeconds-t0<45 do
 local map=p.CurrentMap
 if isvalid(map) then
  for _,pr in ipairs(map:GetChildComponentsByTypeName('script.Projectile',true)) do
   if pr.ViewKind=='bone_shard' then
    local id=pr.Entity.Id
    local n=0 for _ in pairs(pr.HitIds) do n=n+1 end
    local r=seen[id]
    if r==nil then r={e=pr.Entity,max=pr.MaxHits,hits=0} seen[id]=r pr.DebugLog=true end
    if n>r.hits then r.hits=n end
   end
  end
 end
 for id,r in pairs(seen) do
  if not r.logged and not isvalid(r.e) then r.logged=true done=done+1 log(string.format('[VRF] DMSHARD shot#%d MaxHits=%d hit=%d',done,r.max,r.hits)) end
 end
 wait(0.03)
end
log('[VRF] DMSHARD observer end shots='..done)
