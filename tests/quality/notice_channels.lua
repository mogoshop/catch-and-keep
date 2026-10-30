-- @source NoticeFeed UI/Hud/NoticeFeed.mlua Push+,Tick+,SyncEdge+,Render+,Fade,Bounds,NewestLineHeight
-- @source HudMap UI/Hud/HudMap.mlua TopPush+,TopPushFor+,TopMapEntry+,TickTop+,TopShow+,TopRender,TickBanner+,SetBannerAlpha,BannerShowing,RestartBanner,ShowAlert+
-- @source UXFeedback UI/Hud/UXFeedback.mlua TopRoute,Starts,GuessKind
-- @source HudMain UI/Hud/HudMain.mlua PickupPop+,RenderPicks,SetJournalTrack,JournalTrackOn,QuestTrackWanted
-- 10-31 실플레이 피드백 B-4 알림 채널 (docs/evidence/2026-10-31-playfeedback-B/notice-channels.md).
--   실제 NoticeFeed(채널 B) · HudMap 상단 띠(채널 A) · UXFeedback 경로 고르기 · HudMain 줍기 표시(채널 D)·추적기 일지 줄(채널 C) 본문을 돌려
--   ① B: 같은 글 10초 안 「×N」 한 줄 · 숫자만 다른 글도 한 줄 · 위가 최신 · 동시 최대 3줄(모바일 2) · 상한·경고류 60초에 1회 · 직접 누른 결과(가득 찼습니다)는 막지 않음
--   ② B 자리: 채팅 위 끝 + 12에서 시작, 파티 목록·큰 알림 판 아래 끝을 넘지 않는다 (넘치는 옛 줄은 숨김) · 채팅을 펼치면 위로
--   ③ A: 한 번에 하나 · 대기열 · 10초 안 같은 키 다시 안 띄움 · 같은 키는 한 띠로 합침(보스 처치 + 다시 나오는 때) · 급한 것이 맵 이름을 밀어냄 · 창이 떠 있으면 기다리고 오래된 것은 버림 · 맵 입장 1회
--   ④ 경로: 「목표 달성」·업적 달성·일일 퀘스트 완료만 A, 나머지 큰 알림은 판 그대로 · D: 골드 합침·최대 3개·창이 떠 있으면 B · C: 일지 줄이 있으면 닫았던 추적기를 다시
-- 엔진 글꼴 측정·실제 화면 겹침·마우스 올림은 흉내 내지 않는다 (메이커 후검수).
local VMT = {}
VMT.__index = VMT
VMT.__add = function(a, b) return Vector2(a.x + b.x, a.y + b.y) end
function Vector2(x, y) return setmetatable({ x = x, y = y }, VMT) end
function Color(r, g, b, a) return { r = r, g = g, b = b, a = a } end
function isvalid(v) return v ~= nil end
AlignmentType = { BottomLeft = 7, TopLeft = 4, Left = 1 }
_UtilLogic = { ElapsedSeconds = 0 }
local mobile = false
_ApplicationService = { IsMobilePlatform = function() return mobile end }
local logs = {}
function log(s) table.insert(logs, s) end

local function transform(w, h, x, y, align, px, py)
    return { RectSize = Vector2(w, h), Pivot = Vector2(px or 0, py or 0), anchoredPosition = Vector2(x or 0, y or 0), AlignmentOption = align or 7 }
end
local ents = {}
local function textComp(fixedH)
    return { FontColor = Color(1, 1, 1, 1), OutlineColor = Color(0, 0, 0, 1), GetPreferredHeight = function(_, text) return fixedH or 32 end }
end
ents["/ui/RewardHUD"] = { Enable = true, UITransformComponent = transform(1920, 1080) }
ents["/ui/RewardHUD"].UITransformComponent.GetWorldCorners = function() return { Vector2(0, 0), Vector2(0, 1080), Vector2(1920, 1080), Vector2(1920, 0) } end
ents["/ui/RewardHUD/Feed"] = { Enable = true, UITransformComponent = transform(620, 150, 24, 522) }
for i = 1, 4 do
    local path = "/ui/RewardHUD/Feed/Line" .. i
    ents[path] = { UITransformComponent = transform(620, 44) }
    ents[path .. "/Text"] = { UITransformComponent = transform(590, 40), TextGUIRendererComponent = textComp() }
end
local chat = { Enable = true, UITransformComponent = transform(520, 300, 16, 210, 7, 0, 0), ChatComponent = { Expand = false } }
ents["/ui/ChatHUD/Chat"] = chat
local party = { Enable = false, UITransformComponent = transform(400, 28, 24, -272, 4, 0, 1) }
ents["/ui/GameHUD/Party"] = party
local toast = { Enable = false, UITransformComponent = transform(600, 122, 24, 150, 1, 0, 0.5) }
ents["/ui/RewardHUD/Toast"] = toast
for _, p in ipairs({ "Banner", "Banner/Title", "Banner/Sub", "Banner/FlavorBg", "Banner/FlavorBg/Text" }) do ents[p] = { Enable = false, TextGUIRendererComponent = textComp(), SpriteGUIRendererComponent = { Color = Color(0, 0, 0, 1) } } end
for i = 1, 3 do ents["PickPop" .. i] = { Enable = false, TextGUIRendererComponent = textComp() } end
local windowShown = false
_UIKit = {
    Get = function(_, p) return ents[p] end,
    SetEnabled = function(_, p, v) if ents[p] then ents[p].Enable = v end end,
    SetText = function(_, p, t) if ents[p] then ents[p].Text = t end end,
    SetPos = function(_, p, v) if ents[p] then ents[p].Pos = v end end,
    Colored = function(_, hex, t) return "<color=" .. hex .. ">" .. t .. "</color>" end,
    AnyWindowShown = function() return windowShown end,
    AnyWindowOpen = function() return windowShown end,
    ShownWindowEntity = function() return nil end,
}
_UserService = { LocalPlayer = { feet = Vector2(10, 5) } }
_Util = { Pos2 = function(_, e) return Vector2(e.feet.x, e.feet.y) end }
HudMain.WorldToHud = function(_, w) return w end
local checks = 0
local function ok(cond, msg) checks = checks + 1; assert(cond, msg) end
local function at(t) _UtilLogic.ElapsedSeconds = t end
local function reset()
    NoticeFeed.Lines = {}; NoticeFeed.Recent = {}; NoticeFeed.LimitSeen = {}; NoticeFeed.Edge = false; NoticeFeed.Home = nil
    NoticeFeed.MaxHeight = 250; NoticeFeed.HomeLog = ""
    for i = 1, 4 do ents["/ui/RewardHUD/Feed/Line" .. i].Enable = false end
end
local function shownLines()
    -- 보이는 줄을 아래(y 작은 것)부터 { i, y }
    local out = {}
    for i = 1, 4 do
        local e = ents["/ui/RewardHUD/Feed/Line" .. i]
        if e.Enable then table.insert(out, { i = i, y = e.UITransformComponent.anchoredPosition.y, h = e.UITransformComponent.RectSize.y, text = ents["/ui/RewardHUD/Feed/Line" .. i .. "/Text"].Text }) end
    end
    table.sort(out, function(a, b) return a.y < b.y end)
    return out
end

-- ① B 합치기·최대 줄·위가 최신 -------------------------------------------------------------
reset(); at(0)
NoticeFeed:Push("가까운 혼이 없습니다"); at(1); NoticeFeed:Push("결투 신청을 보냈습니다"); at(2); NoticeFeed:Push("가까운 혼이 없습니다")
ok(#NoticeFeed.Lines == 2 and NoticeFeed.Lines[1].count == 2 and NoticeFeed.Lines[1].text == "가까운 혼이 없습니다", "same text within 10s merges into one line ×2 and moves to top")
local vis = shownLines()
ok(#vis == 2 and vis[#vis].i == 1 and string.find(vis[#vis].text, "×2", 1, true), "newest (merged) line is the top one with ×2")
-- 숫자만 다른 글 = 같은 글 (해골 상한)
reset(); at(0)
NoticeFeed:Push("해골 전사는 지금 최대 4기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다)")
at(1); NoticeFeed:Push("해골 전사는 지금 최대 5기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다)")
at(2); NoticeFeed:Push("해골 전사는 지금 최대 5기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다)")
ok(#NoticeFeed.Lines == 1 and NoticeFeed.Lines[1].count == 3, "digit-only differences merge (×3)")
-- 상한·경고류: 줄이 사라진 뒤 60초 안 같은 글은 버림, 60초 뒤엔 다시
at(30); NoticeFeed:Tick()
ok(#NoticeFeed.Lines == 0, "lines expire after 4s")
NoticeFeed:Push("해골 전사는 지금 최대 5기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다)")
ok(#NoticeFeed.Lines == 0 and NoticeFeed.DropCount >= 1, "limit text dropped inside 60s")
at(61); NoticeFeed:Push("해골 전사는 지금 최대 5기 — 가장 오래된 하나가 무너졌습니다 (스킬 레벨을 올리면 늘어납니다)")
ok(#NoticeFeed.Lines == 1 and NoticeFeed.Lines[1].count == 1, "limit text shows again after 60s (count restarts)")
-- 반례: 직접 누른 결과(방이 가득 찼습니다)는 상한류가 아니다 — 5초 뒤 다시 눌러도 보인다
reset(); at(0); NoticeFeed:Push("방이 가득 찼습니다"); at(5); NoticeFeed:Tick(); NoticeFeed:Push("방이 가득 찼습니다")
ok(#NoticeFeed.Lines == 1 and NoticeFeed.Lines[1].count == 2, "user-action failure is not throttled (shown again, ×2 within 10s)")
-- 줄이 사라진 뒤라도 10초 안이면 ×N 이어 세기 · 10초 지나면 처음부터
reset(); at(0); NoticeFeed:Push("거래를 취소했습니다"); at(6); NoticeFeed:Tick(); NoticeFeed:Push("거래를 취소했습니다")
ok(NoticeFeed.Lines[1].count == 2, "count continues within 10s after the line expired")
at(30); NoticeFeed:Tick(); NoticeFeed:Push("거래를 취소했습니다")
ok(NoticeFeed.Lines[1].count == 1, "count restarts after 10s")
-- 최대 3줄 (PC) · 2줄 (모바일)
reset(); at(0)
for k = 1, 6 do NoticeFeed:Push("서로 다른 글 " .. string.rep("가", k)) end
vis = shownLines()
ok(#vis == 3 and vis[3].i == 1 and vis[1].i == 3, "PC shows at most 3 lines, newest (Line1) on top")
ok(#NoticeFeed.Lines == 4, "keeps the 4 line entities worth of history")
mobile = true; NoticeFeed:Render(); vis = shownLines(); mobile = false
ok(#vis == 2 and vis[2].i == 1, "mobile shows at most 2 lines")

-- ② B 자리: 채팅 위 · 파티·큰 알림 판 아래 -------------------------------------------------------
reset(); at(0)
NoticeFeed:SyncEdge()
local feed = ents["/ui/RewardHUD/Feed"].UITransformComponent
ok(feed.anchoredPosition.y == 522, "feed bottom = chat top 510 + 12: " .. feed.anchoredPosition.y)
chat.UITransformComponent.RectSize = Vector2(520, 360); chat.ChatComponent.Expand = true
NoticeFeed:SyncEdge()
ok(feed.anchoredPosition.y == 582, "expanded (taller) chat pushes the feed up: " .. feed.anchoredPosition.y)
chat.UITransformComponent.RectSize = Vector2(520, 300); chat.ChatComponent.Expand = false
local function topOf()
    local top = 0
    for _, v in ipairs(shownLines()) do top = math.max(top, feed.anchoredPosition.y + v.y + v.h) end
    return top
end
-- 파티 4명을 펼친 높이(130)와 큰 알림 판이 함께 떠도 넘지 않는다
party.Enable = true; party.UITransformComponent.RectSize = Vector2(400, 130)
for k = 1, 5 do NoticeFeed:Push("파티 겹침 시험 " .. string.rep("나", k)) end
local partyBottom = 1080 - 272 - 130
ok(topOf() <= partyBottom - 12 and #shownLines() == 3, string.format("3 lines fit under expanded party: top %d <= %d", topOf(), partyBottom - 12))
toast.Enable = true
NoticeFeed:SyncEdge(); NoticeFeed:Render()
local toastBottom = 540 + 150 - 61
ok(topOf() <= toastBottom - 12 and #shownLines() == 2 and shownLines()[2].i == 1, string.format("toast showing: only 2 newest lines, top %d <= %d", topOf(), toastBottom - 12))
-- 판이 걷히면 다시 3줄
toast.Enable = false; NoticeFeed:SyncEdge(); NoticeFeed:Render()
ok(#shownLines() == 3, "toast gone: 3 lines again")
party.Enable = false; party.UITransformComponent.RectSize = Vector2(400, 28)

-- ③ A 상단 띠 ----------------------------------------------------------------------------
local function band() return ents["Banner/Title"].Text, ents["Banner/FlavorBg/Text"].Text, ents["Banner"].Enable end
local function tick(t) at(t); HudMap:TickBanner() end
HudMap.TopQueue = {}; HudMap.TopSeen = {}; HudMap.TopCurrent = nil; HudMap.BannerUntil = 0
at(100); HudMap:TopMapEntry("무너진 형장 (Lv 5~7)", "여왕의 이름으로 매단 자들이")
local title, line, on = band()
ok(on and title == "무너진 형장 (Lv 5~7)" and HudMap.BannerLength == 4, "map entry shows at once with flavor time 2.5+1.5")
HudMap:TopMapEntry("무너진 형장 (Lv 5~7)", "여왕의 이름으로 매단 자들이")
ok(HudMap.TopShownCount == 1, "same map entry is not shown twice")
-- 결과 줄은 맵 이름 뒤에 기다림 · 급한 습격은 맵 이름을 밀어냄
at(100.5); HudMap:TopPush("quest:목표 달성:x", "목표 달성", "유황 여왕 — 그레이브에게 보고", 1)
ok(band() == "무너진 형장 (Lv 5~7)" and #HudMap.TopQueue == 1, "result line waits behind the map name")
at(101); HudMap:TopPushFor("raid:warn", "습격이 온다", "", 2, 3)
title = band()
ok(string.find(title, "습격이 온다", 1, true) and string.find(title, "#FF5A46", 1, true), "urgent raid preempts the map name (red title)")
-- 습격이 끝나면 기다리던 결과 줄
tick(104.1)
title, line = band()
ok(title == "목표 달성" and line == "유황 여왕 — 그레이브에게 보고", "queued result shows after the raid band")
-- 보스 처치: 같은 키는 한 띠로 합침 (BossPattern 「처치!」 + Monster 다시 나오는 때)
tick(106.7)
at(107); HudMap:TopPush("boss:목 없는 처형인 고드릭", "목 없는 처형인 고드릭 처치!", "", 1)
at(107.2); HudMap:TopPush("boss:목 없는 처형인 고드릭", "목 없는 처형인 고드릭 처치!", "5분 뒤 다시 나타납니다", 1)
title, line = band()
ok(title == "목 없는 처형인 고드릭 처치!" and line == "5분 뒤 다시 나타납니다" and #HudMap.TopQueue == 0, "same boss key merges into one band")
ok(HudMap.BossKillAt == 107.2, "boss kill time recorded for the skill-offer boss reward text")
-- 10초 안 같은 키는 다시 안 띄움 · 10초 뒤엔 띄움
tick(109.8); at(110); HudMap:TopPush("boss:목 없는 처형인 고드릭", "목 없는 처형인 고드릭 처치!", "", 1)
ok(#HudMap.TopQueue == 0 and not ents["Banner"].Enable, "same key within 10s is dropped")
at(118); HudMap:TopPush("boss:목 없는 처형인 고드릭", "목 없는 처형인 고드릭 처치!", "", 1)
ok(ents["Banner"].Enable and band() == "목 없는 처형인 고드릭 처치!", "same key after 10s shows again")
-- 한 번에 하나: 셋을 넣으면 차례로
tick(120.6)
at(121); HudMap:TopPush("raid:done", "습격 격퇴 · 24마리", "골드 주머니가 발밑에 떨어졌습니다 · 300 골드", 1)
HudMap:TopPush("journal:업적 달성 · 첫 그림자", "업적 달성 · 첫 그림자", "일지에서 보상을 받으세요", 1)
HudMap:TopPush("bossup:재의 왕", "재의 왕이(가) 다시 나타났다", "", 2)
title = band()
ok(string.find(title, "다시 나타났다", 1, true) and #HudMap.TopQueue == 2, "urgent boss-appear jumps the queue; one band at a time")
tick(123.6); ok(band() == "습격 격퇴 · 24마리", "then the raid result")
tick(126.2); ok(band() == "업적 달성 · 첫 그림자", "then journal completion")
-- 창이 떠 있으면 기다리고, 8초 넘게 기다린 것은 버린다
tick(128.8); windowShown = true
at(129); HudMap:TopPush("quest:목표 달성:y", "목표 달성", "다른 퀘스트", 1)
tick(130); ok(not ents["Banner"].Enable and #HudMap.TopQueue == 1, "waits while a window is shown")
windowShown = false; tick(140)
ok(not ents["Banner"].Enable and #HudMap.TopQueue == 0 and HudMap.TopDropCount >= 2, "stale (>8s) item is dropped after the window closes")
-- 맵 이동 화면이 걷힐 때 다시 세기는 맵 이름일 때만
at(150); HudMap:TopPush("raid:done", "습격 격퇴 · 3마리", "", 1)
local untilBefore = HudMap.BannerUntil
at(151); HudMap:RestartBanner()
ok(HudMap.BannerUntil == untilBefore, "RestartBanner leaves non-map bands alone")

-- ④ 경로 · D · C ---------------------------------------------------------------------------
ok(UXFeedback:TopRoute("quest", "목표 달성"), "quest goal → A")
ok(not UXFeedback:TopRoute("quest", "퀘스트 보상 · 굶주린 굴"), "quest reward stays on the toast")
ok(UXFeedback:TopRoute(UXFeedback:GuessKind("업적 달성 · 첫 그림자"), "업적 달성 · 첫 그림자"), "achievement done → A")
ok(UXFeedback:TopRoute(UXFeedback:GuessKind("일일 퀘스트 완료 · 해골 30"), "일일 퀘스트 완료 · 해골 30"), "daily done → A")
ok(not UXFeedback:TopRoute(UXFeedback:GuessKind("업적 보상 · 첫 그림자"), "업적 보상 · 첫 그림자"), "achievement claim (window result) is not A")
ok(not UXFeedback:TopRoute(UXFeedback:GuessKind("레벨 업 · Lv 12"), "레벨 업 · Lv 12"), "level up stays on the toast")
-- D 줍기: 골드 합침 · 최대 3 · 발밑(콤보 1.35 위와 떨어짐) · 창이 떠 있으면 B
HudMain.Picks = {}
at(200); HudMain:PickupPop("골드 +52"); at(200.3); HudMain:PickupPop("골드 +10")
ok(#HudMain.Picks == 1 and HudMain.Picks[1].text == "골드 +62", "gold within 0.9s merges into one pop")
at(200.5); HudMain:PickupPop("망자의 장화"); HudMain:PickupPop("귀환 두루마리 +1"); HudMain:PickupPop("하급 생명 물약 +2")
ok(#HudMain.Picks == 3 and HudMain.Picks[1].text == "하급 생명 물약 +2", "at most 3 pops, newest first")
local p1 = ents["PickPop1"].Pos
ok(ents["PickPop1"].Enable and p1.y < 5 and p1.y - 5 > -0.6, "newest pop sits just below the feet: " .. p1.y)
ok(ents["PickPop3"].Pos.y > p1.y and ents["PickPop3"].Pos.y - 5 < 1.35, "older pops stack upward but stay below the COMBO height")
at(202.1); HudMain:RenderPicks()
ok(#HudMain.Picks == 0 and not ents["PickPop1"].Enable, "pops vanish after 1.5s")
reset(); windowShown = true; HudMain:PickupPop("골드 +7"); windowShown = false
ok(#HudMain.Picks == 0 and NoticeFeed.Lines[1] ~= nil and NoticeFeed.Lines[1].text == "골드 +7", "with a window open the pickup goes to the feed (B)")
-- C 추적기: 닫았던 퀘스트 카드도 일지 줄이 바뀌면 다시 · 30초 뒤 접힘
HudMain.QuestTrackKey = "3:1"; HudMain.QuestTrackSeen = "3:1"; HudMain.JournalTrack = ""; HudMain.JournalTrackAt = -999
at(300); ok(not HudMain:QuestTrackWanted(), "dismissed quest card stays hidden")
HudMain:SetJournalTrack("업적 해골 군단  7/24")
ok(HudMain:QuestTrackWanted() and HudMain:JournalTrackOn(), "journal progress brings the tracker back")
at(331); ok(not HudMain:QuestTrackWanted(), "journal line folds after 30s")

print(string.format("[quality/notice_channels] B merge×N·digit-shape·limit 60s·user-action not throttled·3/2 lines newest top · B place chat+12/expand/party/toast · A one-at-a-time·preempt·merge·dedup 10s·window hold·stale drop · route quest/journal → A · D gold merge/3 pops/feet/window→B · C tracker (%d checks)", checks))
