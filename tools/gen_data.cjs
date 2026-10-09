#!/usr/bin/env node
// data/*.csv → RootDesk/MyDesk/Data/*.mlua (게임이 읽는 데이터 스크립트).
// 콘텐츠 수치는 CSV만 고친다. 생성 파일은 직접 수정하지 않는다 (다시 생성하면 덮어쓴다).
// 사용: node tools/gen_data.cjs          → 생성 후 메이커 refresh
//       node tools/gen_data.cjs --check  → 쓰지 않고, 생성 파일이 CSV와 다르면 실패 (테스트용)
const fs = require("fs");
const path = require("path");
const { load, num, bool } = require("./lib/csv.cjs");
const { minimapFeatures } = require("./build/maps.cjs");

const OUT_DIR = path.resolve(__dirname, "../RootDesk/MyDesk/Data");
const CHECK = process.argv.includes("--check");
let stale = 0;
const HEADER = "-- 자동 생성 파일: tools/gen_data.cjs 가 data/%SRC% 에서 만든다. 직접 수정 금지 (CSV를 고치고 다시 생성).\n";

// Lua 리터럴
function s(v) { return JSON.stringify(String(v)); }
function n(v) { return String(num(v)); }
function b(v) { return bool(v) ? "true" : "false"; }

function write(file, src, body) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const text = HEADER.replace("%SRC%", src) + body;
  const full = path.join(OUT_DIR, file);
  const old = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  if (old !== text) {
    stale++;
    if (!CHECK) fs.writeFileSync(full, text);
  }
  console.log((old === text ? "  같음  " : CHECK ? "  낡음  " : "  생성  ") + file);
}

// 표 데이터는 OnInitialize 시점에 남지 않는 MSW 특성 때문에 첫 조회 때 채운다 (Ensure)
function logic(name, desc, ensureBody, extra = "", props = "") {
  return `-- ${desc}
@Logic
script ${name} extends Logic

    property boolean Built = false
${props}
    method void Ensure()
        if self.Built then return end
        self.Built = true
${ensureBody}
    end
${extra}
end
`;
}

// ── GameData: 설정값·난이도·배경음·몬스터 이름 ──
function genGameData() {
  const cfg = load("config");
  const props = cfg.map((r) => `    property number ${r.key} = ${n(r.value)}    -- ${r.note}`).join("\n");
  const diffs = load("difficulty");
  const sounds = load("sounds");
  const mons = load("monsters");
  const shop = load("shop");
  const appearance = load("player_appearance");
  const ranks = load("monster_ranks");
  const variants = load("variants");
  const mapRows = load("maps").sort((a, b) => num(a.order) - num(b.order));
  const body = [
    "        self.PlayerAppearance = {}",
    ...appearance.map((r) => `        self.PlayerAppearance[${s(r.slot)}] = ${s(r.ruid)}`),
    "        self.Variants = {}",
    "        self.VariantOrder = {}",
    ...variants.map((v) => `        self.Variants[${s(v.id)}] = { id = ${s(v.id)}, name = ${s(v.name)}, kind = ${s(v.kind)}, effect = ${s(v.effect)}, value = ${n(v.value)}, radius = ${n(v.radius)}, interval = ${n(v.interval)}, mult = ${n(v.mult)}, element = ${s(v.element)}, weight = ${n(v.weight)} }\n        table.insert(self.VariantOrder, ${s(v.id)})`),
    "        self.Ranks = {}",
    ...ranks.map((r) => `        self.Ranks[${s(r.rank)}] = { name = ${s(r.name)}, hpMul = ${n(r.hpMul)}, dmgMul = ${n(r.dmgMul)}, extract = ${n(r.extractChance)}, grade = ${n(r.shadowGrade)} }`),
    "        self.Shop = {}",
    ...shop.map((r) => `        self.Shop[${s(r.key)}] = { name = ${s(r.name)}, price = ${n(r.price)}, perLevel = ${n(r.pricePerLevel)}, hpPct = ${n(r.hpPct)}, manaPct = ${n(r.manaPct)}, hpFlat = ${n(r.hpFlat || 0)}, manaFlat = ${n(r.manaFlat || 0)}, kind = ${s(r.kind || r.key)}, tier = ${n(r.tier || 0)}, minLevel = ${n(r.minLevel || 1)}, icon = ${s(r.icon || "")}, iconPx = ${n(r.iconPx || 0)} }`),
    "        self.Difficulties = {}",
    ...diffs.map((d) => `        self.Difficulties[${n(d.index)}] = { id = ${s(d.id)}, name = ${s(d.name)}, suffix = ${s(d.mapSuffix)}, levelBonus = ${n(d.levelBonus)}, resistPenalty = ${n(-num(d.resistPenalty))}, deathExpLossPct = ${n(d.deathExpLossPct)}, questRewardMul = ${n(d.questRewardMul)} }`),
    "        self.Sounds = {}",
    ...sounds.map((r) => `        self.Sounds[${s(r.key)}] = ${s(r.ruid)}`),
    "        self.MonsterNames = {}",
    ...mons.map((m) => `        self.MonsterNames[${s(m.sourceId)}] = ${s(m.name)}`),
    "        self.MonsterSourceOf = {}",
    ...mons.map((m) => `        self.MonsterSourceOf[${s(m.id)}] = ${s(m.sourceId)}`),
    "        self.MonsterStats = {}",
    ...mons.map((m) => `        self.MonsterStats[${s(m.sourceId)}] = { level = ${n(m.baseLevel)}, hp = ${n(m.baseHp)}, dmg = ${n(m.baseDmg)}, interval = ${n(m.atkIntervalSec)}, speed = ${n(m.speed)}, range = ${n(m.attackRange || 0.8)}, element = ${s(m.element)}, ratio = ${n(m.elementRatio)}, resists = ${s(m.resists)}, behavior = ${s(m.behavior)}, stand = ${s(m.stand)}, move = ${s(m.move)}, attack = ${s(m.attack)}, innate = ${s(m.innate)}, rank = ${s(num(m.grade) >= 3 ? "boss" : bool(m.unique) ? "unique" : "normal")} }`),
    "        self.MapSpawns = {}",
    ...load("maps").filter((m) => m.spawns !== "").map((m) => {
      const w = num(m.w, 14), h = num(m.h, 8);
      const area = `minX = ${-(w / 2) + 3}, maxX = ${w / 2 - 3}, minY = ${-(h / 2) + 2.5}, maxY = ${h / 2 - 1.5}`;
      return `        self.MapSpawns[${s(m.id)}] = { entries = ${s(m.spawns)}, entriesNm = ${s(m.spawnsNm || "")}, entriesHell = ${s(m.spawnsHell || "")}, pack = ${n(m.packSize || 1)}, elite = ${n(m.eliteChance)}, variant = ${m.variantChance === "" ? -1 : n(m.variantChance)}, respawn = ${n(m.respawnSec || 10)}, ${area} }`;
    }),
    "        self.MapInfo = {}",
    ...mapRows.map((m) => {
      const feats = minimapFeatures(m, mapRows).map((f) => `{ kind = ${s(f.kind)}, x = ${n(f.x)}, y = ${n(f.y)}, label = ${s(f.label)}, targetMap = ${s(f.targetMap)} }`).join(", ");
      return `        self.MapInfo[${s(m.id)}] = { name = ${s(m.name)}, kind = ${s(m.kind)}, w = ${n(m.w)}, h = ${n(m.h)}, features = { ${feats} } }`;
    }),
    "        self.UiIcons = {}",
    ...load("ui_icons").map((r) => `        self.UiIcons[${s(r.key)}] = ${s(r.ruid)}`),
    "        self.DepthPool = {}",
    ...mons.filter((m) => m.depth === "pool").map((m) => `        table.insert(self.DepthPool, ${s(m.id)})`),
    "        self.DepthUniques = {}",
    ...mons.filter((m) => /^every\d+$/.test(m.depth)).sort((a, b) => num(b.depth.slice(5)) - num(a.depth.slice(5)))
      .map((m) => `        table.insert(self.DepthUniques, { every = ${n(m.depth.slice(5))}, id = ${s(m.id)} })`),
  ].join("\n");
  const extra = `
    method string GetPlayerAppearance(string slot)
        -- 월드 전용 기본 피부·머리·얼굴 (player_appearance.csv). 계정 옷장과 별개다.
        self:Ensure()
        return self.PlayerAppearance[slot] or ""
    end

    method any GetDifficulty(integer index)
        self:Ensure()
        return self.Difficulties[math.max(0, math.min(#self.Difficulties, index))]
    end

    method string GetSound(string key)
        self:Ensure()
        return self.Sounds[key] or ""
    end

    method any GetRank(string rank)
        -- 몬스터 등급 표 (monster_ranks.csv). 모르는 등급은 normal
        self:Ensure()
        return self.Ranks[rank] or self.Ranks["normal"]
    end

    method any GetVariant(string id)
        -- 변종 능력 (variants.csv). 없으면 nil
        self:Ensure()
        if id == nil or id == "" then return nil end
        return self.Variants[id]
    end

    method string RollVariant()
        -- 무작위 변종 (weight 비례, 0은 고유 전용)
        self:Ensure()
        local total = 0
        for _, id in ipairs(self.VariantOrder) do total = total + self.Variants[id].weight end
        if total <= 0 then return "" end
        local roll = _UtilLogic:RandomDouble() * total
        for _, id in ipairs(self.VariantOrder) do
            roll = roll - self.Variants[id].weight
            if roll <= 0 and self.Variants[id].weight > 0 then return id end
        end
        return ""
    end

    method any GetShopItem(string key)
        -- 상점 품목 (shop.csv). 없으면 nil
        self:Ensure()
        return self.Shop[key]
    end

    method any GetMonsterStats(string sourceId)
        -- 원본 몬스터 능력치 (monsters.csv, sourceId 기준). 그림자 개성의 원천. 없으면 nil
        self:Ensure()
        return self.MonsterStats[sourceId]
    end

    method any GetMapInfo(string mapId)
        -- 맵 이름·종류·크기와 미니맵 표시물(포털·웨이포인트·NPC·입구). 보통 난이도 맵 id. 없으면 nil
        self:Ensure()
        return self.MapInfo[mapId]
    end

    method string GetUiIcon(string key)
        -- UI 아이콘 RUID (ui_icons.csv). 없으면 ""
        self:Ensure()
        return self.UiIcons[key] or ""
    end

    method string SourceOfModel(string modelId)
        -- 출현 목록의 몬스터 id(skelwarrior) → 몬스터 표 sourceId(skel_warrior). 없으면 그대로
        self:Ensure()
        return self.MonsterSourceOf[modelId] or modelId
    end

    method any GetMapSpawns(string mapId)
        -- 맵별 몬스터 출현 (maps.csv spawns·무리·정예·변종·리스폰·출현 범위). 보통 난이도 맵 id. 없으면 nil
        self:Ensure()
        return self.MapSpawns[mapId]
    end

    method table GetDepthPool()
        -- 심도 던전에 나오는 몬스터 모델 id 목록 (monsters.csv depth=true)
        self:Ensure()
        return self.DepthPool
    end

    method string GetDepthUnique(integer floor)
        -- 이 층에 나올 최상위 몬스터 (monsters.csv depth=everyN, 큰 N 우선). 없으면 ""
        self:Ensure()
        for _, u in ipairs(self.DepthUniques) do
            if floor % u.every == 0 then return u.id end
        end
        return ""
    end

    method string GetMonsterName(string sourceId)
        self:Ensure()
        return self.MonsterNames[sourceId] or sourceId
    end
`;
  write("GameData.mlua", "config.csv, difficulty.csv, sounds.csv, monsters.csv, shop.csv, player_appearance.csv, monster_ranks.csv, variants.csv, maps.csv",
    logic("GameData", "게임 설정값(config.csv 각 행 = 속성), 난이도, 배경음, 몬스터 표시 이름", body, extra,
      props + "\n    property table PlayerAppearance = {}\n    property table Difficulties = {}\n    property table Sounds = {}\n    property table MonsterNames = {}\n    property table DepthPool = {}\n    property table MapSpawns = {}\n    property table MapInfo = {}\n    property table UiIcons = {}\n    property table Shop = {}\n    property table Variants = {}\n    property table VariantOrder = {}\n    property table MonsterSourceOf = {}\n    property table MonsterStats = {}\n    property table Ranks = {}\n    property table DepthUniques = {}\n"));
}

// ── ItemTables: 베이스·접사·유니크·룬·룬워드 ──
function genItems() {
  const bases = load("item_bases");
  const affixes = load("item_affixes");
  const uniques = load("item_uniques");
  const runes = load("runes");
  const runewords = load("runewords");
  const stats = load("stats");
  const sets = load("item_sets");
  const drops = load("drop_tables");
  const pieces = load("item_set_pieces");
  const body = [
    "        self.StatNames = {}",
    ...stats.map((r) => `        self.StatNames[${s(r.key)}] = ${s(r.name)}`),
    "        self.Bases = {}",
    "        self.BaseOrder = {}",
    ...bases.map((r) => `        self.Bases[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, slot = ${s(r.slot)}, reqLv = ${n(r.reqLv)}, dmg = ${n(r.dmg)}, def = ${n(r.def)}, sockets = ${n(r.sockets)}, icon = ${s(r.icon)}, avatar = ${s(r.avatar || "")}, iconPx = ${n(r.iconPx || 0)}, implicit = ${s(r.mods || "")} }${r.drop === "false" ? "" : `\n        table.insert(self.BaseOrder, ${s(r.id)})`}`),
    "        self.Affixes = {}",
    ...affixes.map((r) => `        table.insert(self.Affixes, { id = ${s(r.id)}, prefix = ${b(r.prefix)}, name = ${s(r.name)}, stat = ${s(r.stat)}, min = ${n(r.min)}, max = ${n(r.max)}, ilvl = ${n(r.minIlvl)}, slots = ${s(r.slots)} })`),
    "        self.UniqueList = {}",
    ...uniques.map((r) => `        table.insert(self.UniqueList, { id = ${s(r.id)}, base = ${s(r.base)}, name = ${s(r.name)}, mods = ${s(r.mods)}, source = ${s(r.source)} })`),
    "        self.Runes = {}",
    "        self.RuneOrder = {}",
    ...runes.map((r) => `        self.Runes[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, weapon = ${s(r.weapon)}, armor = ${s(r.armor)}, lamp = ${s(r.lamp)}, minLevel = ${n(r.minLevel)}, weight = ${n(r.dropWeight)}, icon = ${s(r.icon || "")}, iconPx = ${n(r.iconPx || 0)} }\n        table.insert(self.RuneOrder, ${s(r.id)})`),
    "        self.Drops = {}",
    ...drops.map((r) => `        self.Drops[${s(r.rank)}] = { picks = ${n(r.picks)}, none = ${n(r.none)}, gold = ${n(r.gold)}, potion = ${n(r.potion)}, item = ${n(r.item)}, rune = ${n(r.rune)}, unique = ${n(r.unique)}, set = ${n(r.set)}, rare = ${n(r.rare)}, magic = ${n(r.magic)} }`),
    "        self.Sets = {}",
    ...sets.map((r) => `        self.Sets[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, bonus2 = ${s(r.bonus2)}, bonus3 = ${s(r.bonus3)}, full = ${s(r.full)}, pieces = ${n(pieces.filter((p) => p.set === r.id).length)} }`),
    "        self.SetPieces = {}",
    "        self.SetPieceOrder = {}",
    ...pieces.map((r) => `        self.SetPieces[${s(r.base)}] = { set = ${s(r.set)}, base = ${s(r.base)}, name = ${s(r.name)}, mods = ${s(r.mods)} }\n        table.insert(self.SetPieceOrder, ${s(r.base)})`),
    "        self.Runewords = {}",
    ...runewords.map((r) => `        self.Runewords[${s(r.runes)}] = { name = ${s(r.name)}, slots = ${s(r.slots)}, mods = ${s(r.mods)} }`),
  ].join("\n");
  write("ItemTables.mlua", "item_bases.csv, item_affixes.csv, item_uniques.csv, item_sets.csv, drop_tables.csv, item_set_pieces.csv, runes.csv, runewords.csv, stats.csv",
    logic("ItemTables", "아이템 데이터 표 (규칙·생성 로직은 Item/ItemData)", body, "",
      "    property table StatNames = {}\n    property table Drops = {}\n    property table Sets = {}\n    property table SetPieces = {}\n    property table SetPieceOrder = {}\n    property table Bases = {}\n    property table BaseOrder = {}\n    property table Affixes = {}\n    property table UniqueList = {}\n    property table Runes = {}\n    property table RuneOrder = {}\n    property table Runewords = {}\n"));
}

// ── SkillData ──
function genSkills() {
  const rows = load("skills");
  const body = [
    "        self.Skills = {}",
    "        self.Order = {}",
    ...rows.map((r) => `        self.Skills[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, tree = ${s(r.tree)}, row = ${n(r.row)}, kind = ${s(r.kind)}, prereq = ${s(r.prereq)}, maxLv = ${n(r.maxLv)}, mana = ${n(r.mana)}, cooldown = ${n(r.cooldown)}, impl = ${b(r.impl)}, nextLv = ${n(r.nextLv || 0)}, desc = ${s(r.desc)}, icon = ${s(r.icon)} }\n        table.insert(self.Order, ${s(r.id)})`),
  ].join("\n");
  const extra = `
    method any Get(string id)
        self:Ensure()
        return self.Skills[id]
    end

    method table GetOrder()
        self:Ensure()
        return self.Order
    end

    method string TreeName(string tree)
        if tree == "command" then return "군령" end
        if tree == "soul" then return "혼술" end
        return "저주"
    end
`;
  write("SkillData.mlua", "skills.csv", logic("SkillData", "네크로맨서 스킬 정의 (docs/design/04 3장). impl=false는 트리에만 보이는 준비 중 스킬", body, extra,
    "    property table Skills = {}\n    property table Order = {}\n"));
}

// ── QuestData ──
function genQuests() {
  const rows = load("quests");
  const body = ["        self.List = {}",
    ...rows.map((r) => `        table.insert(self.List, { title = ${s(r.title)}, desc = ${s(r.desc)}, zone = ${s(r.zone || "")}, objective = ${s(r.objective || "")}, kind = ${s(r.kind)}, target = ${s(r.target)}, map = ${s(r.map || "")}, map1 = ${s(r.map1 || "")}, giver = ${s(r.giver || "quest")}, count = ${n(r.count)}, exp = ${n(r.exp)}, gold = ${n(r.gold)}, reward = ${s(r.reward)}, intro = ${s(r.intro || "")}, outro = ${s(r.outro || "")} })`)].join("\n");
  const extra = `
    method any Get(integer index)
        self:Ensure()
        return self.List[index]
    end

    method integer Count()
        self:Ensure()
        return #self.List
    end

    method integer IndexOf(string kind, string target)
        -- 그 종류·대상의 의뢰 번호 (없으면 0)
        self:Ensure()
        for i, q in ipairs(self.List) do
            if q.kind == kind and q.target == target then return i end
        end
        return 0
    end

    method string GiverName(string giver)
        -- 의뢰인 NPC 종류 → 이름 (npcs.csv와 같은 이름)
        if giver == "smith" then return "대장장이 하르크" end
        return "사제 오렌"
    end

    method string RewardText(string reward)
        -- 보상 문자열("rune:r_as,item:...,skp:1,stp:5,gen:2,deploy:1,runes:2,socket:1") → 표시용
        local parts = {}
        for key, val in string.gmatch(reward, "(%a+):([^,]+)") do
            if key == "rune" then
                local r = _ItemData:GetRune(val)
                table.insert(parts, (r ~= nil and r.name or val) .. " 룬")
            elseif key == "item" then table.insert(parts, _ItemData:Parse(val).name)
            elseif key == "skp" then table.insert(parts, "스킬 포인트 " .. val)
            elseif key == "stp" then table.insert(parts, "능력치 포인트 " .. val)
            elseif key == "deploy" then table.insert(parts, "그림자 배치 +" .. val .. " (영구 · 난이도마다)")
            elseif key == "runes" then table.insert(parts, "룬 " .. val .. "개")
            elseif key == "socket" then table.insert(parts, "소켓권 " .. val .. "장")
            elseif key == "gen" then table.insert(parts, val == "3" and "희귀 장비 (보장)" or "마법 장비") end
        end
        return table.concat(parts, ", ")
    end
`;
  write("QuestData.mlua", "quests.csv", logic("QuestData", "의뢰 목록 (순서대로 진행). kind: kill / extract / reach / raise / clear(맵 전멸) / boss(이름 있는 적) / ritual(제단 의식) / chest(열쇠 → 봉인 상자)", body, extra, "    property table List = {}\n"));
}

// ── NamedData: 곁가지 끝방의 이름 있는 적 · 봉인 상자 · 의식의 주인 ──
function genNamed() {
  const rows = load("named");
  const body = ["        self.List = {}",
    ...rows.map((r) => `        table.insert(self.List, { id = ${s(r.id)}, name = ${s(r.name)}, model = ${s(r.model)}, map = ${s(r.map)}, place = ${s(r.place)}, levelAdd = ${n(r.levelAdd)}, hpMul = ${n(r.hpMul)}, tint = ${s(r.tint)}, scale = ${n(r.scale)}, escort = ${s(r.escort)}, escortCount = ${n(r.escortCount)}, chest = ${b(r.chest)}, key = ${s(r.key)} })`)].join("\n");
  const extra = `
    method table ForMap(string mapId)
        -- 그 맵(보통 맵 id)의 행 목록
        self:Ensure()
        local out = {}
        for _, r in ipairs(self.List) do if r.map == mapId then table.insert(out, r) end end
        return out
    end

    method any Get(string id)
        self:Ensure()
        for _, r in ipairs(self.List) do if r.id == id and id ~= "" then return r end end
        return nil
    end
`;
  write("NamedData.mlua", "named.csv", logic("NamedData", "이름 있는 적 (곁가지 끝방 우두머리·의식의 주인)과 봉인 상자 배치. place: end(맵 끝방) / ritual(제단 의식 마지막)", body, extra, "    property table List = {}\n"));
}

// ── WaypointData ──
function genWaypoints() {
  const rows = load("waypoints");
  const body = ["        self.List = {}",
    ...rows.map((r) => `        table.insert(self.List, { id = ${s(r.id)}, name = ${s(r.name)}, map = ${s(r.map)}, x = ${n(r.x)}, y = ${n(r.y)} })`)].join("\n");
  const extra = `
    method any Get(string id)
        self:Ensure()
        for _, w in ipairs(self.List) do if w.id == id then return w end end
        return nil
    end

    method table GetList()
        self:Ensure()
        return self.List
    end
`;
  write("WaypointData.mlua", "waypoints.csv", logic("WaypointData", "웨이포인트 목록 (보통 난이도 맵 기준. 난이도 맵은 _GameConst:MapFor)", body, extra, "    property table List = {}\n"));
}

// ── JournalData: 일일 의뢰 후보·업적·도감 몬스터 순서 ──
function genJournal() {
  const dailies = load("dailies");
  const ach = load("achievements");
  const mons = load("monsters");
  const body = ["        self.Dailies = {}", "        self.Achievements = {}", "        self.Monsters = {}",
    ...dailies.map((r) => `        table.insert(self.Dailies, { id = ${s(r.id)}, name = ${s(r.name)}, kind = ${s(r.kind)}, target = ${s(r.target || "")}, count = ${n(r.count)}, gold = ${n(r.gold)}, expPct = ${n(r.expPct)} })`),
    ...ach.map((r) => `        table.insert(self.Achievements, { id = ${s(r.id)}, name = ${s(r.name)}, desc = ${s(r.desc)}, kind = ${s(r.kind)}, target = ${s(r.target || "")}, count = ${n(r.count)}, gold = ${n(r.gold)} })`),
    ...mons.map((r) => `        table.insert(self.Monsters, { id = ${s(r.id)}, name = ${s(r.name)}, grade = ${n(r.grade)}, unique = ${b(r.unique)} })`)].join("\n");
  const extra = `
    method table GetDailies()
        self:Ensure()
        return self.Dailies
    end

    method table GetAchievements()
        self:Ensure()
        return self.Achievements
    end

    method table GetMonsters()
        self:Ensure()
        return self.Monsters
    end

    method any GetDaily(string id)
        self:Ensure()
        for _, d in ipairs(self.Dailies) do if d.id == id then return d end end
        return nil
    end
`;
  write("JournalData.mlua", "dailies.csv·achievements.csv·monsters.csv", logic("JournalData", "일지 데이터: 일일 의뢰 후보, 업적, 도감 몬스터 순서", body, extra, "    property table Dailies = {}\n    property table Achievements = {}\n    property table Monsters = {}\n"));
}

genGameData();
genItems();
genSkills();
genQuests();
genNamed();
genWaypoints();
genJournal();

if (CHECK && stale > 0) {
  console.log(`\n[gen_data] 생성 파일 ${stale}개가 CSV와 다르다 → node tools/gen_data.cjs 실행`);
  process.exitCode = 1;
}
