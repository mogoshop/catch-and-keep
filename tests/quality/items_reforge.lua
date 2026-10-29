-- 10-30 갈래 A (I01 부분 재련 · 부위 고르기 보상 · I02 룬워드 안내) 오프라인 회귀 — goal-items-execution-0030 non_Maker_checks
-- 실제 mLua 본문(ItemData · PlayerInventory · PlayerQuest · RuneWindow)을 Lua 5.4로 돌린다. 메이커 동기화·UI 배치·저장 원자성은 흉내 내지 않는다.
-- @source GameData Data/GameData.mlua Ensure,GetDifficulty
-- @source ItemTables Data/ItemTables.mlua Ensure
-- @source QuestData Data/QuestData.mlua Ensure,Get,Count
-- @source ItemData Item/ItemData.mlua Generate+,GenerateQuestReward+,RerollMods+,Parse,Serialize,WithLock,IsLocked,SameItem+,PunchSockets,CanPunch+,CanReroll+,GetRuneword,GetTotalMods+,PartialState+,HasPendingReroll+,PartialRerollCost+,PartialPoolSize+,RollPartial+,ResolvePartial+,PartialText+,QuestGearRarity+,RewardSlotsFor+,GenerateQuestSlotReward+,SlotLabel,GetSlot,CanLock,IsRune,IsStack,IsSoulbound,Consumable,MakeStack,StackName,StackLimit,MakeRuneString
-- @source PlayerInventory Item/PlayerInventory.mlua IsOwnerRequest,Stats,RefreshDigest,RejectPending,RequestPartialReroll,RequestResolvePartial,RequestReroll,RequestEquip,RequestDeposit,RequestLockBag,RequestSell,RequestDiscard,GetSaveData,LoadSaveData,ResetStashPages,GetStashData,GetStashCounts,LoadStash,IsRetiredItem,EnsureAshenHoodGrant,ApplyEquipment,CountStack,GetBagList,GetEquipMap
-- @source PlayerQuest Quest/PlayerQuest.mlua TurnIn,RewardBagSlots,IsGearChoiceQuest,ParseGearOffer,GearOfferText,OfferHasSlot,MakeGearOffer,OfferGearChoice,RequestGearChoice,RequestTurnIn,NearGiver,GetSaveData,LoadSaveData,SwitchDifficulty
-- @source RuneWindow UI/Windows/RuneWindow.mlua BaseFits,ReadyText,WordList,OwnedRunes,GearList
_ItemTables:Ensure()
_GameData:Ensure()
_QuestData:Ensure()
_QuestData.RewardText = function() return "" end
_QuestData.ExpFor = function() return 100 end
_QuestData.LastOfAct = function() return -1 end
_QuestData.ActClosed = function() return false end
math.randomseed(20261030)
_UtilLogic = { RandomDouble = function() return math.random() end, RandomIntegerRange = function(_,lo,hi) return math.random(lo,hi) end }
DateTime = { UtcNow = { Elapsed = 63900000000000 } }
_SkillData = { Get = function() return nil end }
local warns = {}
_Util = { IsAlive = function() return true end, NearNpc = function() return true end, Notify = function() end, Banner = function() end,
  Warn = function(_, msg) table.insert(warns, msg) end }
_GameEvents = { Emit = function() end }
_UserService = { LocalPlayer = nil }
_LootSystem = { DropDiscarded = function() end, Spawn = function() end }
_UIKit = { Colored = function(_, hex, text) return "<color=" .. hex .. ">" .. text .. "</color>" end }
_GameData.GetUiIcon = function() return "" end
_GameData.GetShopItem = function() return nil end
_ItemData.IconFor = function() return "" end
_ItemData.StatValueText = function(_, k, v) return k .. " +" .. tostring(v) end
_ItemData.DescribeDetailed = function(_, s) return s end
_ItemData.DisplayName = function(_, s) return s end
local function count(t) local n = 0 for _ in pairs(t) do n = n + 1 end return n end
local checks = 0
local function ok(cond, msg) checks = checks + 1 assert(cond, msg) end

-- ① F01 추첨 순서 보존: 출처 기록 전(4ba51d5e) 코드와 같은 seed로 만든 물건의 보이는 칸(1~7)이 해시까지 같다
do
  local h, n = 0xcbf29ce484222325, 0
  local function add(s)
    local f = {}
    for part in string.gmatch(s .. "|", "([^|]*)|") do table.insert(f, part) end
    local v = table.concat({f[1],f[2],f[3],f[4],f[5],f[6],f[7]}, "|")
    for i = 1, #v do h = (h ~ string.byte(v, i)) * 0x100000001b3 end
    h = (h ~ 10) * 0x100000001b3
    n = n + 1
  end
  math.randomseed(20261029)
  for _, lv in ipairs({1, 12, 25, 40, 42, 70, 99}) do
    for _, rank in ipairs({"normal", "elite", "boss", "quest"}) do
      for _, mf in ipairs({0, 300}) do
        for i = 1, 25 do
          local s = _ItemData:Generate(lv, rank, mf)
          add(s)
          local it = _ItemData:Parse(s)
          if (it.rarity == 1 or it.rarity == 2) and i % 5 == 0 then add(_ItemData:RerollMods(s)) end
        end
      end
    end
    for i = 1, 25 do add(_ItemData:GenerateQuestReward(lv, "boss", 300, 2)) end
  end
  ok(n == 1760 and string.format("%016x", h) == "c16b7a608417728f", "F01 visible sequence changed: " .. n .. " " .. string.format("%016x", h))
  math.randomseed(20261030)
end
print("[quality/items_reforge] F01 seeded visible sequence identical to pre-provenance code (1760 items incl. full rerolls · quest rewards)")

-- ② 출처 칸: 새로 만든 마법·레어는 기록과 합산 옵션이 정확히 맞는다 · 줄마다 다른 능력치 · 문자열 왕복 · 구버전 문자열 그대로
local samples = {}
do
  local traced, total = 0, 0
  for _, lv in ipairs({5, 18, 30, 40, 42, 60, 90}) do
    for i = 1, 120 do
      local s = _ItemData:Generate(lv, "boss", 300)
      local it = _ItemData:Parse(s)
      if it.rarity == 1 or it.rarity == 2 then
        total = total + 1
        ok(_ItemData:Serialize(_ItemData:Parse(s)) == s, "roundtrip " .. s)
        local meta = _ItemData:DecodeMeta(it.meta)
        if meta ~= nil then
          traced = traced + 1
          ok(_ItemData:MetaMatches(it, meta) and meta.line == 0 and meta.pending == nil and meta.rev == 0 and #meta.affixes == count(it.mods), "meta mismatch " .. s)
          ok(not string.find(it.meta, ";", 1, true) and not string.find(it.meta, ">", 1, true) and not string.find(it.meta, "|", 1, true), "separator leak")
          table.insert(samples, s)
        end
      end
    end
  end
  ok(traced == total and total > 300, "all new magic/rare carry provenance " .. traced .. "/" .. total)
  -- 예전 문자열 (7·8·9칸): 읽고 쓰면 바이트까지 같고 출처는 없다
  for _, old in ipairs({ "scythe1|0|1|단낫||0|", "hp1|0|1|하급 생명 물약||0||3", "helm2|2|42|옛 레어 투구|def=30,life=12|1|r_el|1|L", "helm2|1|20|예리한 투구|def=8|0|" }) do
    ok(_ItemData:Serialize(_ItemData:Parse(old)) == old and _ItemData:Parse(old).meta == "", "legacy string changed " .. old)
  end
  -- 잠금·소켓 뚫기·룬 끼우기·소켓 바꾸기가 출처 칸을 보존한다
  local s = samples[1]
  local locked = _ItemData:WithLock(s, true)
  ok(_ItemData:Parse(locked).meta == _ItemData:Parse(s).meta and _ItemData:IsLocked(locked) and _ItemData:WithLock(locked, false) == s, "lock keeps meta")
  ok(string.find(locked, "|1|L|A1:", 1, true) ~= nil and string.find(s, "|1||A1:", 1, true) ~= nil, "meta field layout")
  for _, x in ipairs(samples) do
    if _ItemData:CanPunch(x) then
      local p = _ItemData:PunchSockets(x)
      ok(_ItemData:Parse(p).meta == _ItemData:Parse(x).meta, "punch keeps meta")
      local it = _ItemData:Parse(p); table.insert(it.runes, "r_el")
      ok(_ItemData:Parse(_ItemData:Serialize(it)).meta == _ItemData:Parse(x).meta, "socket keeps meta")
      break
    end
  end
  print(string.format("[quality/items_reforge] provenance %d/%d new magic/rare · legacy 7/8/9-field strings byte-identical · lock/punch/socket keep meta", traced, total))
end

-- ③ 한 줄 바꾸기: 고른 줄만 바뀌고 나머지(다른 옵션·베이스·등급·ilvl·레어 이름·소켓·룬·잠금·uid) 보존 · 줄 고정 · 대기 중 다른 작업 거부
do
  local rolled, accepted, kept, sameStat = 0, 0, 0, 0
  for _, s0 in ipairs(samples) do
    local s = _ItemData:WithLock(s0, true)
    local before = _ItemData:Parse(s)
    local meta0 = _ItemData:DecodeMeta(before.meta)
    for line = 1, #meta0.affixes do
      local size = _ItemData:PartialPoolSize(s, line)
      local after = _ItemData:RollPartial(s, line)
      ok((size > 0) == (after ~= ""), "pool size and roll agree")
      if after ~= "" then
        rolled = rolled + 1
        local it = _ItemData:Parse(after)
        local m = _ItemData:DecodeMeta(it.meta)
        ok(m.line == line and m.rev == meta0.rev + 1 and m.uid == meta0.uid and m.pending ~= nil, "pending recorded")
        -- 대기 중에는 옵션이 그대로 (채택 전) · 다른 작업 거부
        ok(_ItemData:Serialize({ base = it.base, rarity = it.rarity, ilvl = it.ilvl, name = it.name, mods = it.mods, sockets = it.sockets, runes = it.runes, locked = true, count = 1, meta = before.meta }) == s, "pending does not touch mods")
        ok(_ItemData:HasPendingReroll(after) and not _ItemData:CanReroll(after) and not _ItemData:CanPunch(after) and _ItemData:RollPartial(after, line) == "", "pending blocks")
        local newRow = _ItemData:AffixRow(m.pending.id)
        local oldRow = _ItemData:AffixRow(meta0.affixes[line].id)
        ok(newRow.prefix == oldRow.prefix, "same side")
        ok(newRow.ilvl <= it.ilvl and newRow.tier <= _ItemData:TierOfLevel(it.ilvl) and newRow.tier >= _ItemData:TierOfLevel(it.ilvl) - 1, "ilvl/tier rule")
        local slot = _ItemData:GetBase(it.base).slot
        ok(newRow.slots == "any" or string.find("," .. newRow.slots .. ",", "," .. slot .. ",", 1, true) ~= nil, "slot rule")
        for i, a in ipairs(meta0.affixes) do
          if i ~= line then ok(_ItemData:AffixRow(a.id).stat ~= newRow.stat, "no duplicate stat across lines") end
        end
        if newRow.stat == oldRow.stat then sameStat = sameStat + 1 end
        -- 다른 줄은 고정 뒤 바꿀 수 없다
        for other = 1, #meta0.affixes do
          if other ~= line then ok(_ItemData:RollPartial(after, other) == "", "other line refused") end
        end
        -- 기존 유지: 옵션 그대로 · 줄 고정 유지 · rev+1 · 같은 줄 다시 가능 · 다른 줄은 여전히 불가
        local keep = _ItemData:ResolvePartial(after, false)
        local ki = _ItemData:Parse(keep)
        local km = _ItemData:DecodeMeta(ki.meta)
        ok(km.line == line and km.pending == nil and km.rev == m.rev + 1 and ki.name == before.name and ki.locked, "keep resolve")
        for k, v in pairs(before.mods) do ok(ki.mods[k] == v, "keep mods") end
        ok(count(ki.mods) == count(before.mods) and keep ~= s, "keep differs only by meta rev/line")
        kept = kept + 1
        if #meta0.affixes > 1 then ok(_ItemData:RollPartial(keep, line % #meta0.affixes + 1) == "", "lock survives keep") end
        -- 채택: 그 줄의 능력치만 바뀐다
        local acc = _ItemData:ResolvePartial(after, true)
        local ai = _ItemData:Parse(acc)
        local am = _ItemData:DecodeMeta(ai.meta)
        ok(am.affixes[line].id == m.pending.id and am.affixes[line].val == m.pending.val and am.pending == nil and am.line == line, "accept meta")
        ok(ai.mods[newRow.stat] == m.pending.val and count(ai.mods) == count(before.mods), "accept mods count")
        for k, v in pairs(before.mods) do
          if k ~= oldRow.stat and k ~= newRow.stat then ok(ai.mods[k] == v, "other mods kept") end
        end
        ok(ai.base == before.base and ai.rarity == before.rarity and ai.ilvl == before.ilvl and ai.sockets == before.sockets and #ai.runes == #before.runes and ai.locked, "base/rarity/ilvl/socket/runes/lock kept")
        if before.rarity == 2 then ok(ai.name == before.name, "rare name kept") else ok(ai.name == _ItemData:MagicName(am, _ItemData:GetBase(ai.base).name), "magic name regenerated consistently") end
        ok(_ItemData:MetaMatches(ai, am) and _ItemData:ResolvePartial(acc, true) == "", "accept consistent, no second resolve")
        accepted = accepted + 1
        break
      end
    end
  end
  ok(rolled > 100, "enough partial rolls " .. rolled)
  print(string.format("[quality/items_reforge] partial reroll %d items: one line changes, others/base/ilvl/sockets/runes/lock kept, line lock across keep (%d) and accept (%d), same-stat value rerolls %d", rolled, kept, accepted, sameStat))
end

-- ④ 출처 없는 예전 물건·유니크·완성 룬워드는 부분 재련 불가 (이유 표시) · 전체 재련을 고르면 그 뒤부터 가능
do
  local legacy = "helm1|2|30|옛 레어 투구|def=20,life=9|0|"
  local st = _ItemData:PartialState(legacy)
  ok(not st.ok and st.reason == "legacy" and _ItemData:RollPartial(legacy, 1) == "" and _ItemData:PartialPoolSize(legacy, 1) == 0, "legacy refused")
  ok(string.find(_ItemData:PartialText(legacy, 1), "출처 기록이 없는", 1, true) ~= nil, "legacy reason text")
  local full = _ItemData:RerollMods(legacy)
  local fs = _ItemData:PartialState(full)
  ok(fs.ok and fs.meta.line == 0 and _ItemData:Parse(full).ilvl == 30, "voluntary full reroll adds provenance")
  -- 고정 줄이 있던 물건을 전체 재련하면 모든 옵션이 새로 바뀌고 고정이 풀린다 (uid 유지 · rev+1)
  local s = samples[2]
  local r = _ItemData:ResolvePartial(_ItemData:RollPartial(s, 1), false)
  if r ~= "" then
    local fr = _ItemData:RerollMods(r)
    local m1, m2 = _ItemData:DecodeMeta(_ItemData:Parse(r).meta), _ItemData:DecodeMeta(_ItemData:Parse(fr).meta)
    ok(m2 ~= nil and m2.uid == m1.uid and m2.rev == m1.rev + 1 and m2.line == 0, "full reroll resets lock, keeps uid")
  end
  local uniq = _ItemData:MakeUnique(_ItemTables.UniqueList[1], 30)
  ok(_ItemData:PartialState(uniq).reason == "grade", "unique refused")
  -- 완성 룬워드(마법 2소켓) 는 거부: 판정은 GetRuneword 그대로
  local rwKey, rw = nil, nil
  for key, w in pairs(_ItemTables.Runewords) do
    local n = 0
    for _ in string.gmatch(key, "[^,]+") do n = n + 1 end
    if n == 2 then rwKey, rw = key, w break end
  end
  local baseId = nil
  for _, id in ipairs(_ItemTables.BaseOrder) do
    local b = _ItemTables.Bases[id]
    if string.find("," .. rw.slots .. ",", "," .. b.slot .. ",", 1, true) and b.sockets >= 2 then baseId = id break end
  end
  local runes = {}
  for id in string.gmatch(rwKey, "[^,]+") do table.insert(runes, id) end
  local magicRw = _ItemData:Serialize({ base = baseId, rarity = 1, ilvl = 20, name = "m", mods = {}, sockets = 2, runes = runes, meta = "" })
  ok(_ItemData:PartialState(magicRw).reason == "runeword", "active runeword refused")
  print("[quality/items_reforge] legacy/unique/active-runeword refused with reason · voluntary full reroll enables · full reroll resets lock")
end

-- ⑤ 서버 요청 (PlayerInventory): 칸 + 문자열 전체(rev 포함)에 묶음 · 한 번만 받음 · 후보 없음/골드 부족/옛 요청/예전 물건 무소비 · 대기 중 다른 조작 거부 · 저장/창고 왕복
do
  local st = { Gold = 0, Level = 40, AddGold = function(self, n) self.Gold = self.Gold + n end }
  local entity = { PlayerComponent = { UserId = "me" }, GetComponent = function(_, key) if key == "script.PlayerStats" then return st end return nil end }
  local inv = PlayerInventory
  inv.Entity = entity
  inv.ApplyEquipment = function() end
  inv.EnsureAshenHoodGrant = function() end
  inv.NotifySmith = function() end
  senderUserId = "me"
  local s = nil
  for _, x in ipairs(samples) do if _ItemData:Parse(x).rarity == 2 and _ItemData:PartialPoolSize(x, 1) > 0 then s = x break end end
  inv.Bag = { "scythe1|0|1|단낫||0|", s }
  inv.Equip = {}
  inv:ResetStashPages()
  local cost = _ItemData:PartialRerollCost(s)
  ok(cost == _ItemData:RerollCost(s) and _GameData.partialRerollMul == 1, "cost = full reroll cost (1.0)")
  -- 골드 부족: 무소비
  st.Gold = cost - 1
  inv:RequestPartialReroll(2, s, 1)
  ok(inv.Bag[2] == s and st.Gold == cost - 1, "no gold no charge")
  -- 다른 사람의 요청 · 옛 문자열 · 없는 칸: 무소비
  st.Gold = cost * 3
  senderUserId = "other"; inv:RequestPartialReroll(2, s, 1); senderUserId = "me"
  inv:RequestPartialReroll(2, s .. "x", 1)
  inv:RequestPartialReroll(9, s, 1)
  ok(inv.Bag[2] == s and st.Gold == cost * 3, "stale/non-owner no charge")
  -- 정상: 한 번 받음 → 같은 요청 반복은 rev가 바뀌어 무시
  inv:RequestPartialReroll(2, s, 1)
  local pending = inv.Bag[2]
  ok(pending ~= s and _ItemData:HasPendingReroll(pending) and st.Gold == cost * 2, "charged once")
  inv:RequestPartialReroll(2, s, 1)
  inv:RequestPartialReroll(2, pending, 1)
  ok(inv.Bag[2] == pending and st.Gold == cost * 2, "duplicate/pending request ignored")
  -- 대기 중: 장착·창고·잠금·판매·버리기·전체 재련 거부 (가방 그대로)
  local n0 = #warns
  inv:RequestEquip(2, pending)
  inv:RequestDeposit(2, pending)
  inv:RequestLockBag(2, pending, true)
  inv:RequestSell(2, pending)
  inv:RequestDiscard(2, pending)
  inv:RequestReroll(2, pending)
  ok(inv.Bag[2] == pending and #inv.Bag == 2 and next(inv.Equip) == nil and #inv:GetStashData() == 0 and st.Gold == cost * 2 and #warns >= n0 + 5, "pending blocks other ops")
  -- 저장·불러오기·창고 왕복이 대기 후보를 그대로 둔다 (추가 결과·추가 비용 없음)
  local saved = inv:GetSaveData()
  inv.Bag = {}
  inv:LoadSaveData(saved)
  ok(inv.Bag[2] == pending and st.Gold == cost * 2, "save/load keeps pending")
  inv:LoadStash({ pending, s }, { 2, 0, 0, 0 })
  local back = inv:GetStashData()
  ok(back[1] == pending and back[2] == s, "stash load keeps strings")
  inv:ResetStashPages()
  -- 결과 고르기: 옛 문자열 무시 · 기존 유지 = 무료 · 같은 요청 반복 무시
  inv:RequestResolvePartial(2, s, false)
  ok(inv.Bag[2] == pending, "stale resolve ignored")
  inv:RequestResolvePartial(2, pending, false)
  local kept = inv.Bag[2]
  ok(kept ~= pending and not _ItemData:HasPendingReroll(kept) and st.Gold == cost * 2, "keep is free")
  inv:RequestResolvePartial(2, pending, true)
  ok(inv.Bag[2] == kept, "second resolve ignored")
  for k, v in pairs(_ItemData:Parse(s).mods) do ok(_ItemData:Parse(kept).mods[k] == v, "keep restores old mods") end
  -- 고정 줄 다시 → 채택 (시도마다 한 번씩만 받음)
  inv:RequestPartialReroll(2, kept, 2)
  ok(inv.Bag[2] == kept and st.Gold == cost * 2, "other line after lock refused without charge")
  inv:RequestPartialReroll(2, kept, 1)
  local p2 = inv.Bag[2]
  ok(_ItemData:HasPendingReroll(p2) and st.Gold == cost, "second attempt charged once")
  inv:RequestResolvePartial(2, p2, true)
  ok(not _ItemData:HasPendingReroll(inv.Bag[2]) and st.Gold == cost, "accept free")
  -- 예전 물건(출처 없음): 무소비
  inv.Bag[3] = "helm1|2|30|옛 레어 투구|def=20,life=9|0|"
  inv:RequestPartialReroll(3, inv.Bag[3], 1)
  ok(inv.Bag[3] == "helm1|2|30|옛 레어 투구|def=20,life=9|0|" and st.Gold == cost, "legacy no charge")
  -- 합법 후보 없음: 그 줄의 같은 종류 접사를 모두 다른 줄 능력치로 막은 데이터 → 무소비
  local cur = inv.Bag[2]
  local m = _ItemData:DecodeMeta(_ItemData:Parse(cur).meta)
  local side = _ItemData:AffixRow(m.affixes[m.line].id).prefix
  local saved = _ItemTables.Affixes
  local only = {}
  for _, a in ipairs(saved) do if a.prefix ~= side then table.insert(only, a) end end
  for _, a in ipairs(m.affixes) do table.insert(only, _ItemData:AffixRow(a.id)) end
  _ItemTables.Affixes = only
  -- 그 줄 자신의 행을 빼서 같은 종류 후보를 0으로
  for i = #_ItemTables.Affixes, 1, -1 do if _ItemTables.Affixes[i].id == m.affixes[m.line].id then table.remove(_ItemTables.Affixes, i) end end
  local g0 = st.Gold
  ok(_ItemData:PartialPoolSize(cur, m.line) == 0, "pool emptied by fixture")
  inv:RequestPartialReroll(2, cur, m.line)
  ok(inv.Bag[2] == cur and st.Gold == g0, "no candidate no charge")
  _ItemTables.Affixes = saved
  print("[quality/items_reforge] server: charge once per confirmed attempt · stale/duplicate/non-owner/no-gold/legacy/no-candidate no charge · pending blocks equip/stash/lock/sell/discard/full-reroll · save/load/stash keep pending · keep/accept free")
end

-- ⑥ 부위 고르기 보상: 기존 gen:3 의뢰 5개만 · 고정 등급(재사용·재접속에도 같은 제안) · 합법 부위만 · 같은 보고 트랜잭션 · 가방 선검사 · 중복/옛 요청 무시 · 다른 보상 그대로
do
  local idx = {}
  for i = 1, _QuestData:Count() do if PlayerQuest:IsGearChoiceQuest(_QuestData:Get(i)) then table.insert(idx, i) end end
  ok(table.concat(idx, ",") == "1,3,7,13,19", "gen:3 rows " .. table.concat(idx, ","))
  -- 모든 레벨·고정 등급·제시 부위에서: 그 등급·그 부위·착용 가능·ilvl = 레벨 + 2
  local made = 0
  for lv = 1, 40 do
    for rarity = 2, 4 do
      for _, slot in ipairs(_ItemData:RewardSlotsFor(lv, rarity)) do
        local it = _ItemData:Parse(_ItemData:GenerateQuestSlotReward(lv, slot, rarity))
        local b = _ItemData:GetBase(it.base)
        ok(b ~= nil and b.slot == slot and it.rarity == rarity and it.ilvl == lv + 2 and b.reqLv <= lv, "slot reward lv" .. lv .. " r" .. rarity .. " " .. slot)
        made = made + 1
      end
    end
    ok(#_ItemData:RewardSlotsFor(lv, 2) >= 2, "rare offers at least two slots at lv" .. lv)
  end
  ok(_ItemData:GenerateQuestSlotReward(1, "ring", 3) == "" or _ItemData:HasRewardPool(1, 3, "ring"), "no silent downgrade")
  -- 보고 흐름 (PlayerQuest 실제 본문)
  local st = { Level = 20, Difficulty = 0, SkillPoints = 0, StatPoints = 0, Gold = 0, Exp = 0, AddGold = function(self, n) self.Gold = self.Gold + n end, GainExp = function(self, n) self.Exp = self.Exp + n end }
  local bag = { Bag = {}, BagSize = 60, SocketTokens = 0, PutBagItems = function(self, items) for _, s in ipairs(items) do table.insert(self.Bag, s) end end }
  local entity = { PlayerComponent = { UserId = "me" }, GetComponent = function(_, key) if key == "script.PlayerStats" then return st elseif key == "script.PlayerInventory" then return bag end end }
  local opened = {}
  PlayerQuest.Entity = entity
  PlayerQuest.NotifyQuest = function() end
  PlayerQuest.RefreshPermanent = function() end
  PlayerQuest.SendStory = function() end
  PlayerQuest.OpenGearChoice = function(_, offer) table.insert(opened, offer) end
  PlayerQuest.Diff = 0; PlayerQuest.Index = 1; PlayerQuest.State = 2; PlayerQuest.GearOffers = {}; PlayerQuest.GearOffer = ""; PlayerQuest.GearOfferSeq = 0
  senderUserId = "me"
  local q1 = _QuestData:Get(1)
  -- 가방이 모자라면 제안도 만들지 않는다
  for i = 1, 60 do bag.Bag[i] = "held" end
  PlayerQuest:RequestTurnIn(1)
  ok(#opened == 0 and PlayerQuest.GearOffers["0"] == nil and PlayerQuest.State == 2, "full bag: no offer")
  bag.Bag = {}
  PlayerQuest:RequestTurnIn(1)
  local offer = PlayerQuest.GearOffers["0"]
  local o = PlayerQuest:ParseGearOffer(offer)
  ok(#opened == 1 and o ~= nil and o.index == 1 and o.lv == 20 and #o.slots >= 2 and #o.slots <= 3 and PlayerQuest.GearOffer == offer and PlayerQuest.State == 2 and #bag.Bag == 0, "offer made, nothing paid")
  for _, slot in ipairs(o.slots) do ok(_ItemData:HasRewardPool(o.lv, o.rarity, slot), "legal slot") end
  -- 다시 보고(취소 뒤 다시 열기) = 같은 제안 (다시 굴리지 않음) · 레벨이 올라도 고정
  st.Level = 21
  PlayerQuest:RequestTurnIn(1)
  ok(opened[2] == offer and PlayerQuest.GearOffers["0"] == offer, "reopen reuses frozen offer")
  -- 저장 → 불러오기 (재접속) 뒤에도 같은 제안
  local saved = PlayerQuest:GetSaveData()
  ok(saved.go0 == offer, "offer saved")
  PlayerQuest.GearOffers = {}; PlayerQuest.GearOffer = ""
  PlayerQuest:LoadSaveData(saved)
  ok(PlayerQuest.GearOffers["0"] == offer and PlayerQuest.GearOffer == offer and PlayerQuest.Index == 1 and PlayerQuest.State == 2, "offer restored")
  -- 옛 버전·없는 부위·다른 사람: 무시
  local bad = "weapon"
  for _, s in ipairs({ "weapon", "offhand", "helm", "armor", "gloves", "boots", "belt", "amulet", "ring" }) do if not PlayerQuest:OfferHasSlot(o, s) then bad = s break end end
  PlayerQuest:RequestGearChoice(0, 1, o.ver + 1, o.slots[1])
  PlayerQuest:RequestGearChoice(0, 1, o.ver, bad)
  senderUserId = "other"; PlayerQuest:RequestGearChoice(0, 1, o.ver, o.slots[1]); senderUserId = "me"
  ok(PlayerQuest.Index == 1 and #bag.Bag == 0 and st.Gold == 0, "stale/bad slot/non-owner ignored")
  -- 가방이 가득: 보고 트랜잭션 전체가 멈추고 제안 유지
  for i = 1, 60 do bag.Bag[i] = "held" end
  PlayerQuest:RequestGearChoice(0, 1, o.ver, o.slots[2])
  ok(PlayerQuest.Index == 1 and PlayerQuest.State == 2 and st.Gold == 0 and st.SkillPoints == 0 and PlayerQuest.GearOffers["0"] == offer, "full bag keeps everything")
  bag.Bag = {}
  -- 고르기: 장비 1개(고른 부위·고정 등급) + 다른 보상(skp:2·골드·경험치) 그대로 · 의뢰 한 번 넘어감 · 제안 소비
  PlayerQuest:RequestGearChoice(0, 1, o.ver, o.slots[2])
  local got = _ItemData:Parse(bag.Bag[1] or "")
  ok(#bag.Bag == 1 and _ItemData:GetBase(got.base).slot == o.slots[2] and got.rarity == o.rarity and got.ilvl == 22 and _ItemData:GetBase(got.base).reqLv <= 20, "chosen slot item")
  ok(st.SkillPoints == 2 and st.Gold == math.floor(q1.gold * (_GameData:GetDifficulty(0).questRewardMul or 1)) and PlayerQuest.Index == 2 and PlayerQuest.State == 0 and PlayerQuest.GearOffers["0"] == nil and PlayerQuest.GearOffer == "", "other rewards unchanged, offer consumed")
  -- 같은 요청 반복: 무시 (의뢰가 넘어갔다)
  PlayerQuest:RequestGearChoice(0, 1, o.ver, o.slots[2])
  ok(#bag.Bag == 1 and st.SkillPoints == 2 and PlayerQuest.Index == 2, "duplicate ignored")
  -- 영구 선택 보상(ChoicePicks)·다른 의뢰는 건드리지 않는다
  ok(PlayerQuest.ChoicePicks == ";" and not PlayerQuest:IsGearChoiceQuest(_QuestData:Get(2)), "choice picks untouched")
  -- 유니크·세트 고정 등급: 그 등급 후보가 있는 부위만 제시 · 고른 부위 그 등급 그대로 (몰래 레어로 낮추지 않음)
  local forcedDone = 0
  for _, forced in ipairs({ 3, 4 }) do
    local real = _ItemData.QuestGearRarity
    _ItemData.QuestGearRarity = function() return forced end
    PlayerQuest.Index = 3; PlayerQuest.State = 2; PlayerQuest.GearOffers = {}; bag.Bag = {}; st.Level = 30
    PlayerQuest:RequestTurnIn(3)
    local fo = PlayerQuest:ParseGearOffer(PlayerQuest.GearOffers["0"] or "")
    _ItemData.QuestGearRarity = real
    if fo ~= nil then
      for _, slot in ipairs(fo.slots) do ok(_ItemData:HasRewardPool(30, fo.rarity, slot), "forced legal") end
      PlayerQuest:RequestGearChoice(0, 3, fo.ver, fo.slots[1])
      local it = _ItemData:Parse(bag.Bag[1] or "")
      ok(it.rarity == fo.rarity and _ItemData:GetBase(it.base).slot == fo.slots[1] and PlayerQuest.Index == 4 and bag.SocketTokens >= 1, "forced rarity kept")
      if fo.rarity == forced then forcedDone = forcedDone + 1 end
    end
  end
  ok(forcedDone == 2, "unique and set frozen offers both exercised")
  print(string.format("[quality/items_reforge] gear choice: rows 1,3,7,13,19 only · %d slot rewards lv1-40 r2-4 legal/wearable · frozen offer across reopen/save-load · stale/bad/non-owner/full-bag ignored · one item + other rewards unchanged · duplicate ignored", made))
end

-- ⑦ I02 A안: 35 레시피 판정은 등급과 관계없이 그대로 (GetRuneword) · 룬워드 창 준비 표시가 룬만으로 「제작 가능」이라 하지 않는다
do
  local recipes, cond = 0, 0
  for key, rw in pairs(_ItemTables.Runewords) do
    recipes = recipes + 1
    local ids = {}
    for id in string.gmatch(key, "[^,]+") do table.insert(ids, id) end
    local baseId = nil
    for _, id in ipairs(_ItemTables.BaseOrder) do
      local b = _ItemTables.Bases[id]
      if string.find("," .. rw.slots .. ",", "," .. b.slot .. ",", 1, true) then baseId = id break end
    end
    ok(baseId ~= nil, "recipe has base " .. rw.name)
    for rarity = 0, 4 do
      local item = { base = baseId, rarity = rarity, ilvl = 30, name = "x", mods = {}, sockets = #ids, runes = ids }
      ok(_ItemData:GetRuneword(item) == rw, "recipe accepted at rarity " .. rarity)
      local short = { base = baseId, rarity = rarity, ilvl = 30, name = "x", mods = {}, sockets = #ids + 1, runes = ids }
      ok(_ItemData:GetRuneword(short) == nil, "incomplete socket rejected")
      if #ids > 1 then
        local rev = {}
        for i = #ids, 1, -1 do table.insert(rev, ids[i]) end
        local swapped = { base = baseId, rarity = rarity, ilvl = 30, name = "x", mods = {}, sockets = #ids, runes = rev }
        local w = _ItemData:GetRuneword(swapped)
        ok(w == nil or w == _ItemTables.Runewords[table.concat(rev, ",")], "wrong order not this recipe")
      end
      cond = cond + 1
    end
  end
  ok(recipes == 35, "35 recipes")
  -- 준비 표시: 룬만 있음 / 맞는 장비까지 / 이미 일부 끼운 장비 / 레벨 부족 / 소켓 수 다름 / 부위 다름
  local key, rw = nil, nil
  for k, w in pairs(_ItemTables.Runewords) do
    local n = 0
    for _ in string.gmatch(k, "[^,]+") do n = n + 1 end
    if n == 2 then key, rw = k, w break end
  end
  local ids = {}
  for id in string.gmatch(key, "[^,]+") do table.insert(ids, id) end
  local e = { key = key, rw = rw, ids = ids, need = 1, have = 2 }
  local owned = {}
  for _, id in ipairs(ids) do owned[id] = (owned[id] or 0) + 1 end
  local fit, wrongSlot = nil, nil
  for _, id in ipairs(_ItemTables.BaseOrder) do
    local b = _ItemTables.Bases[id]
    local inSlot = string.find("," .. rw.slots .. ",", "," .. b.slot .. ",", 1, true) ~= nil
    if inSlot and fit == nil and b.reqLv <= 10 then fit = id end
    if not inSlot and wrongSlot == nil then wrongSlot = id end
  end
  local function gear(base, rarity, sockets, runes) return _ItemData:Serialize({ base = base, rarity = rarity, ilvl = 10, name = "g", mods = {}, sockets = sockets, runes = runes }) end
  ok(RuneWindow:ReadyText(e, owned, {}, 40) == "<color=#E6C88A>룬 준비됨 · 맞는 장비 필요</color>", "runes only")
  ok(RuneWindow:ReadyText(e, owned, { gear(fit, 1, 2, {}) }, 40) == "제작 준비됨", "runes + magic base ready (rarity irrelevant)")
  ok(RuneWindow:ReadyText(e, owned, { gear(fit, 0, 3, {}) }, 40) ~= "제작 준비됨", "socket count mismatch")
  ok(RuneWindow:ReadyText(e, owned, { gear(wrongSlot, 0, 2, {}) }, 40) ~= "제작 준비됨", "wrong slot")
  ok(RuneWindow:ReadyText(e, owned, { gear(fit, 0, 2, {}) }, 0) ~= "제작 준비됨", "level gate")
  local one = { [ids[2]] = 1 }
  if ids[2] == ids[1] then one = { [ids[1]] = 1 } end
  ok(RuneWindow:ReadyText({ key = key, rw = rw, ids = ids, need = 1, have = 1 }, one, { gear(fit, 0, 2, { ids[1] }) }, 40) == "제작 준비됨", "half-socketed base needs only remaining rune")
  ok(RuneWindow:ReadyText({ key = key, rw = rw, ids = ids, need = 1, have = 0 }, {}, {}, 40) == "<color=#8A8478>룬 0 / 2</color>", "missing runes")
  print(string.format("[quality/items_reforge] I02: 35 recipes × rarity 0~4 = %d accepted unchanged · incomplete/wrong-order rejected · ready text separates runes-only / matching gear / partial socket", cond))
end
print(string.format("[quality/items_reforge] %d checks passed", checks))
