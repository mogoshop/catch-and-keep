-- @source GuideCoach UI/Hud/GuideCoach.mlua MaybeShadowGuide
-- @source ShadowSystem Shadow/ShadowSystem.mlua OnMonsterKilled
-- 10-31 실플레이 피드백 B-1·B-2 (메이커에서 새 캐릭터 슬롯이 없어 못 본 B3 장면을 코드 경로로):
--   B-1 Lv1 첫 일반 처치에도 맛보기 그림자가 서지 않는다 — 실제 ShadowSystem.OnMonsterKilled가 혼만 만들고 UndeadSystem에 임시 소환을 부르지 않는다
--   B-2 그림자 소환을 배운 캐릭터는 조용해진 뒤 게임 안내 창 「군단」 2쪽을 한 번 열고 저장 표시를 남긴다 — 둘러보기 전·이미 봄·안 배움·싸우는 중은 열지 않는다
local checks = 0
local function ok(c, m) checks = checks + 1; assert(c, m) end
local VMT = {}
VMT.__add = function(a, b) return Vector2(a.x + b.x, a.y + b.y) end
function Vector2(x, y) return setmetatable({ x = x, y = y }, VMT) end
function Vector3(x, y, z) return { x = x, y = y, z = z } end
function isvalid(v) return v ~= nil end
_UtilLogic = { ElapsedSeconds = 0 }

-- B-1 ------------------------------------------------------------------------------------
local undeadCalls, souls = 0, 0
_UndeadSystem = setmetatable({}, { __index = function() return function() undeadCalls = undeadCalls + 1 end end })
_GameConst = { NoSoul = function() return false end }
_ShadowConfig = { FrameLook = function() return { stand = "s", move = "m" } end }
ShadowSystem.SpawnSoul = function() souls = souls + 1 end
local monster = { TransformComponent = { WorldPosition = Vector3(1, 2, 0) } }
local stats = { Level = 1, HasFirstKill = function() return false end, MarkFirstKill = function() error("taste_shadow must not be written") end }
local player = { PlayerComponent = { UserId = "u1" }, GetComponent = function() return stats end }
ShadowSystem:OnMonsterKilled({ player = player, monster = monster, sourceId = "wilddog", grade = 1, map = {} })
ok(souls == 1 and undeadCalls == 0, "Lv1 first normal kill: one soul, no temporary shadow")
local src = io.open("RootDesk/MyDesk/Shadow/ShadowSystem.mlua"):read("a") .. io.open("RootDesk/MyDesk/Undead/UndeadSystem.mlua"):read("a")
ok(not string.find(src, "method void TryFirstTaste", 1, true) and not string.find(src, "method boolean SpawnTaste", 1, true), "taste code paths are gone")

-- B-2 ------------------------------------------------------------------------------------
local opened = {}
_GuideWindow = { AutoDone = true, ShowTabKey = function(_, key, page) table.insert(opened, key .. ":" .. page) end }
local windowOpen = false
_UIKit = { AnyWindowOpen = function() return windowOpen end }
_StoryCard = { Active = false, Queue = {} }
_UXFeedback = { Until = 0 }
local nearMonster = nil
_Util = { NearestMonster = function() return nearMonster end, Pos2 = function() return Vector2(0, 0) end }
local book = { ShadowGuide = false, lv = 0, asked = 0 }
function book:GetLevel(id) return id == "shadow_summon" and self.lv or 0 end
function book:RequestShadowGuide() self.asked = self.asked + 1 end
local me = { CurrentMap = {} }
local function run(sec) for _ = 1, math.floor(sec / 0.3 + 0.5) do GuideCoach:MaybeShadowGuide(me, book, 0.3) end end
run(3); ok(#opened == 0, "not learned yet → no window")
book.lv = 1; windowOpen = true; run(3); ok(#opened == 0, "skill window still open → waits")
windowOpen = false; nearMonster = {}; run(3); ok(#opened == 0, "enemy within 6 → waits")
nearMonster = nil; _GuideWindow.AutoDone = false; run(3); ok(#opened == 0, "first-entry tour not done → waits (tour untouched)")
_GuideWindow.AutoDone = true; run(1.2); ok(#opened == 0, "needs 1.5s calm")
run(0.6); ok(#opened == 1 and opened[1] == "legion:2" and book.asked == 1, "opens 군단 p2 once and saves the mark")
run(5); ok(#opened == 1, "does not open twice in the session")
GuideCoach.ShadowGuideAsked = false; book.ShadowGuide = true; run(5); ok(#opened == 1, "already-seen character (saved mark) never reopens")
GuideCoach.ShadowGuideAsked = false; book.ShadowGuide = false; book.lv = 3; run(2); ok(#opened == 2, "existing character that learned earlier but has no mark: once on next session")
print(string.format("[quality/flow_b] B-1 Lv1 첫 처치 임시 그림자 없음 · 맛보기 경로 없음 · B-2 그림자 소환 뒤 안내 창 군단 2쪽 1회(대기 조건 4종 · 저장 표시 · 기존 캐릭터 다음 접속 1회) (%d checks)", checks))
