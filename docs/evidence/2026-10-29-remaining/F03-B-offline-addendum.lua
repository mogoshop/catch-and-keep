-- F03-B 오프라인 격리 검증 (메이커 실제 자정 아님)
-- tests/quality/journal.lua 가 이미 쓰는 시간 주입 경로(DateTime.UtcNow.Elapsed → 실제 PlayerJournal.Today)만 사용한다.
-- 게임 코드·시스템 시계·메이커를 바꾸지 않는다. journal.lua 를 끝까지 돌린 같은 Lua 청크 뒤에 붙여 실행한다.
local function deepcopy(o) if type(o) ~= 'table' then return o end local t = {} for k, v in pairs(o) do t[deepcopy(k)] = deepcopy(v) end return t end
local function listkey() local t = {} for _, s in ipairs(PlayerJournal.Daily) do table.insert(t, s.id .. ':' .. s.p .. ':' .. tostring(s.done)) end return table.concat(t, ',') end
local function ids() local t = {} for _, s in ipairs(PlayerJournal.Daily) do table.insert(t, s.id) end return t end
local function out(tag) print(string.format('[F03-B offline] %-34s DailyDay=%d Today=%d gold=%d exp=%d daily=%s c.daily=%s c.daily@0=%s', tag, PlayerJournal.DailyDay, PlayerJournal:Today(), stats.Gold, stats.Exp, listkey(), tostring(PlayerJournal.Counters.daily), tostring(PlayerJournal.Counters['daily@0']))) end

-- 앞 검사가 바꾼 상태를 실제 게임 기본값으로 되돌린다 (심연 숨김 · 보통만 열림 · 퀘스트 남음)
PlayerJournal.Today = actualToday
_GameData.depthEnabled = 0
stats.MaxDifficulty = 0; stats.Gold = 1000; stats.Exp = 0
quest.Index = 1; quest.Diff = 0; quest.ByDiff = {}
PlayerJournal.Counters = {}; PlayerJournal.Kills = {}; PlayerJournal.Captures = {}
PlayerJournal.AchDone = {}; PlayerJournal.AchClaim = {}; PlayerJournal.Titles = {}; PlayerJournal.TitlePick = ''
PlayerJournal.DailyDay = 0; PlayerJournal.Daily = {}; PlayerJournal.Dirty = false

local D = 739917   -- 메이커 로그의 DailyDay 739917 = KST 2026-10-29
local MS = 86400000
DateTime = { UtcNow = { Elapsed = (D + 1) * MS - 9 * 3600 * 1000 - 1 } }   -- KST 2026-10-29 23:59:59.999 (UTC 14:59:59.999)
assert(PlayerJournal:Today() == D, 'pre-boundary day')

-- ① 자정 전: 오늘 목록을 만들고 1칸 완료(보상 지급) + 1칸 일부 진행
PlayerJournal:EnsureDaily()
assert(#PlayerJournal.Daily == 3)
local before = ids()
local d1 = _JournalData:GetDaily(PlayerJournal.Daily[1].id)
local d2 = _JournalData:GetDaily(PlayerJournal.Daily[2].id)
PlayerJournal:Record(d1.kind, '', d1.count)
assert(PlayerJournal.Daily[1].done, 'slot1 completed')
if d2.count > 1 then PlayerJournal:Record(d2.kind, '', 1) end
local goldPaid, expPaid, dailyPaid = stats.Gold, stats.Exp, PlayerJournal.Counters.daily
assert(goldPaid > 1000 and dailyPaid == 1, 'pre-boundary completion paid once')
out('23:59:59.999 완료1·진행1')
PlayerJournal:EnsureDaily(); PlayerJournal:EnsureDaily()
assert(PlayerJournal.DailyDay == D and listkey() ~= '' and PlayerJournal.Daily[1].done, 'same day stays')
local saveBefore = deepcopy(PlayerJournal:GetSaveData())   -- 자정 전에 접속을 끊은 저장

-- ② 자정 경계 +1ms: 1회 교체 · 후보 중복 없음 · 전날 완료 재지급 없음
DateTime.UtcNow.Elapsed = DateTime.UtcNow.Elapsed + 1
assert(PlayerJournal:Today() == D + 1, 'KST midnight boundary')
PlayerJournal.Dirty = false
PlayerJournal:EnsureDaily()   -- 게임에선 Flush(1초 타이머)·Record가 부르는 같은 함수
assert(PlayerJournal.DailyDay == D + 1 and PlayerJournal.Dirty, 'replaced once at boundary')
assert(#PlayerJournal.Daily == 3)
local uniq = {} for _, s in ipairs(PlayerJournal.Daily) do assert(not uniq[s.id], 'duplicate candidate'); uniq[s.id] = true; assert(s.p == 0 and not s.done, 'new day starts fresh'); assert(PlayerJournal:DailyAvailable(_JournalData:GetDaily(s.id)), 'unavailable candidate') end
assert(stats.Gold == goldPaid and stats.Exp == expPaid and PlayerJournal.Counters.daily == dailyPaid, 'previous-day completion repaid')
local after = listkey()
out('00:00:00.000 교체 직후')
-- 같은 날 반복 호출(일지 반복 열기·1초 Flush)에서 다시 섞이지 않음
PlayerJournal.Dirty = false
for i = 1, 5 do PlayerJournal:EnsureDaily() end
assert(listkey() == after and not PlayerJournal.Dirty, 'reshuffled again on same day')

-- ③ 경계 직후 진행 → 정상 재접속(저장→불러오기)에서 목록·진행 유지
local n1 = _JournalData:GetDaily(PlayerJournal.Daily[1].id)
if n1.count > 1 then PlayerJournal:Record(n1.kind, '', 1) end
local progressed = listkey()
local goldNow = stats.Gold
local saveAfter = deepcopy(PlayerJournal:GetSaveData())
PlayerJournal.DailyDay = 0; PlayerJournal.Daily = {}; PlayerJournal.Counters = {}
PlayerJournal:LoadSaveData(deepcopy(saveAfter))
assert(listkey() == progressed and PlayerJournal.DailyDay == D + 1, 'relog after boundary lost list/progress')
assert(stats.Gold == goldNow, 'relog changed gold')
out('경계 뒤 재접속(저장→불러오기)')

-- ④ 자정 전에 끊은 저장을 자정 뒤 처음 불러옴: 1회 교체 결과가 ②와 같고 전날 완료를 다시 주지 않음
stats.Gold = goldPaid; stats.Exp = expPaid
PlayerJournal:LoadSaveData(deepcopy(saveBefore))
assert(PlayerJournal.DailyDay == D + 1 and listkey() == after, 'stale save not replaced to same new-day list')
assert(stats.Gold == goldPaid and stats.Exp == expPaid and PlayerJournal.Counters.daily == dailyPaid, 'stale save repaid')
out('전날 저장을 경계 뒤 불러옴')
print('[F03-B offline] before=' .. table.concat(before, ',') .. ' after=' .. after .. ' — 경계 1회 교체·중복 없음·전날 보상 재지급 없음·경계 뒤 재접속 유지 통과 (메이커 실제 자정 아님)')
