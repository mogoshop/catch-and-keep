-- @source UIKit UI/Core/UIKit.mlua Clip,PlainText,CharCount,TextWidth
-- @source UXFeedback UI/Hud/UXFeedback.mlua LineText
-- @source GameData Data/GameData.mlua Ensure,GetShopItem+
-- @source ItemTables Data/ItemTables.mlua Ensure
-- @source ItemData Item/ItemData.mlua Serialize,DescribeDetailed+
-- 10-29 UI-20261029-02: 창 안 결과(재련·소켓·업적 보상)를 안내 줄로 옮길 때 서식 태그가 잘려 「</color..」가 보였다.
--   실제 재련 카드(ItemData.DescribeDetailed) → UXFeedback.LineText → UIKit.Clip 경로를 그대로 돌려
--   ① 결과에 깨진·열린 태그가 없고 ② 보이는 글자 수가 상한 안이며 ③ 태그 없는 글은 예전과 똑같이 잘리는지 본다.
-- UI-20261029-01: 선택 보상 띠 글 폭 어림(TextWidth)이 태그를 세지 않는지도 본다.
_GameData:Ensure()
_ItemTables:Ensure()

local function visible(s) return (string.gsub(s, "<(/?)%a[%w%-]*[^<>]*>", "")) end
local function chars(s) local n = 0 for _ in string.gmatch(visible(s), "[\0-\127\194-\244][\128-\191]*") do n = n + 1 end return n end
-- 서식 태그(<글자…>)는 짝이 맞아야 하고, 태그가 아닌 '<'(예: 「<3」)는 그냥 글자다. 끝나지 않은 태그 조각은 check의 「</」·「<color」 검사가 잡는다
local function tagsBalanced(s)
    local stack = {}
    for closing, name in string.gmatch(s, "<(/?)(%a[%w%-]*)[^<>]*>") do
        if closing == "" then table.insert(stack, name)
        else
            if stack[#stack] ~= name then return false, "close " .. name .. " without open" end
            table.remove(stack)
        end
    end
    if #stack > 0 then return false, "unclosed " .. table.concat(stack, ",") end
    return true
end
local function check(label, s, limit)
    local ok, why = tagsBalanced(s)
    assert(ok, label .. ": " .. tostring(why) .. "\n  " .. s)
    assert(not string.find(visible(s), "</", 1, true) and not string.find(visible(s), "<%a"), label .. ": tag fragment visible\n  " .. s)
    assert(chars(s) <= limit + 2, label .. ": " .. chars(s) .. " visible chars > " .. limit .. "+2\n  " .. s)
end

-- 1) 실제 재련 결과 카드: F01-A 장면의 「해골의 손톱 묘지기의 장화」(boots28 · 요구 레벨 28 · 희귀) + 소켓
local item = _ItemData:Serialize({ base = "boots28", rarity = 2, ilvl = 31, name = "해골의 손톱 묘지기의 장화", mods = { life = 16, vit = 7, dmgFlat = 6, def = 60, fireRes = 10, lightRes = 15, poisonRes = 15 }, sockets = 2, runes = { "el" } })
local card = _ItemData:DescribeDetailed(item)
assert(string.find(card, "</color>", 1, true) and string.find(card, "요구 레벨 28", 1, true), "fixture card should carry tags + req level")
local full = _UXFeedback:LineText("옵션을 새로 새겼습니다", card, true)
check("reroll full", full, 90)
assert(not string.find(full, "─", 1, true), "card rule line should not be in a one-line notice")
assert(string.find(visible(full), "요구 레벨 28", 1, true), "req level should survive (was cut to 「28</color..」)\n  " .. full)
local short = _UXFeedback:LineText("옵션을 새로 새겼습니다", card, false)
check("reroll short", short, 40)
-- 소켓 뚫기 결과 (DisplayName 태그 + 안내)
check("punch", _UXFeedback:LineText("소켓 2개를 뚫었습니다", "<color=#F5C451>해골의 손톱 묘지기의 장화 [0/2]</color>\n이제 룬을 끼울 수 있습니다 (룬워드 조합은 메뉴 「룬워드」)", true), 90)

-- 2) 자르는 자리를 한 글자씩 옮겨도 태그가 깨지지 않는다 (태그 안·태그 직전·직후·여러 겹)
local samples = {
    card,
    "<color=#E8C66B>무덤 왕국</color> · <color=#A8A090><b>업적 보상</b> · 골드 +480</color> · 칭호 「무덤 왕국의 해방자」",
    "<color=#3CDC3C>세트 「망자」  2 / 5 착용</color>\n<color=#6E6A66>○ 망자의 장화</color>",
    "앞 <color=#fff>가<color=#f00>나</color>다</color> 뒤 <3 > 화살표 -> 그대로",
}
for si, s in ipairs(samples) do
    local total = chars(s)
    for limit = 0, total + 2 do
        local out = _UIKit:Clip(s, limit)
        check("sample" .. si .. "@" .. limit, out, limit)
        if limit >= total then assert(out == s, "no clip when it fits: sample" .. si .. "@" .. limit) end
    end
end

-- 3) 태그 없는 글은 예전 Clip과 같은 결과 (TownBoard·방 이름·추적판 제목 등 기존 호출)
local function oldClip(text, maxChars)
    local out, n = {}, 0
    for ch in string.gmatch(text, "[\0-\127\194-\244][\128-\191]*") do
        n = n + 1
        if n > maxChars then table.insert(out, "..") break end
        table.insert(out, ch)
    end
    return table.concat(out)
end
for _, s in ipairs({ "가라앉은 지하실의 수장", "외 알림 3개 · 레벨 업 · 새 스킬 · 그림자 획득", "abc def 123", "" }) do
    for limit = 0, 30 do assert(_UIKit:Clip(s, limit) == oldClip(s, limit), "plain clip changed: " .. s .. "@" .. limit) end
end

-- 4) 띠 글 폭 어림은 보이는 글자만 (UI-01: Colored 태그가 폭을 부풀리지 않게)
local long = "선택 보상 — 고르기  <color=#FFFFFF>(가라앉은 지하실의 수장)</color>"
assert(_UIKit:TextWidth(long, 24) == _UIKit:TextWidth(visible(long), 24))
assert(_UIKit:CharCount(long) == chars(long))
-- PC 띠 상한 720 · 여백 48 → 이 제목은 줄이지 않고 24로 들어가고, 모바일 600에선 하한 17 이상으로 줄어든다 (SkillOffer Band*)
local inner = function(maxW) return maxW - 48 * 2 end
local w = _UIKit:TextWidth(long, 24)
assert(w <= inner(720), "PC band should fit 24px: " .. w)
local mobileSize = math.max(17, math.floor(24 * inner(600) / w))
assert(mobileSize >= 19 and mobileSize < 24, "mobile band size " .. mobileSize)
-- 더 긴 제목(가상 20자)도 하한 17 이상 또는 말줄임 경로
local longer = "선택 보상 — 고르기  <color=#FFFFFF>(아주아주 길고 긴 가라앉은 지하실의 수장님)</color>"
local lw = _UIKit:TextWidth(longer, 24)
assert(lw > inner(720) and math.max(17, math.floor(24 * inner(720) / lw)) >= 17)
print(string.format("[quality/notice_text] reroll line %d chars, tags closed: %s", chars(full), visible(full)))
print(string.format("[quality/notice_text] offer band text width 24px=%d (PC inner %d, mobile font %d) · longer=%d", math.floor(w), inner(720), mobileSize, math.floor(lw)))
