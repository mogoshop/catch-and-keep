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
// 소환수(그림자·되살린 언데드) 배율: 필드에서의 키(그림 높이 × 배율)를 0.7~1.15칸으로 맞춘다 —
// 보스(묘지의 여왕 2.7칸)도 소환하면 다른 소환수와 비슷한 크기, 큰 몹은 조금만 더 크게 (10-10 QA)
function summonScale(m) {
  // 몸 키(bodyH)가 있으면 그것으로 (메이플식 프레임은 공격·사망 자세 때문에 캔버스가 몸보다 크다)
  const h = num(m.bodyH, 0) > 0 ? num(m.bodyH) / 100 : num(m.h, 0) / 100, sc = num(m.scale, 1);
  if (h <= 0) return Math.min(1, sc);
  const fieldH = h * sc;
  const want = Math.max(0.7, Math.min(1.15, fieldH));
  return Math.round((want / h) * 1000) / 1000;
}

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
  const archetypes = load("archetypes");
  const monsterStates = load("monster_states");
  const weekly = load("weekly");
  const mapRows = load("maps").sort((a, b) => num(a.order) - num(b.order));
  // 프레임 애니메이션 (data/monster_frames.csv, 몬스터 id → sourceId 기준). 클립 RUID가 있는 동작은 클립을 쓴다
  const sourceOf = Object.fromEntries(mons.map((m) => [m.id, m.sourceId]));
  const frames = {};
  for (const f of load("monster_frames")) {
    const src = sourceOf[f.monster] || f.monster.replace(/^form_/, "");   // form_<키>: 변신 모습 (몬스터 행 없음)
    (frames[src] = frames[src] || {})[f.state] = f;
  }
  const firstFrame = (src, state, fallback) => (frames[src] && frames[src][state] ? frames[src][state].frames.split(";")[0] : fallback);
  // 소환수 공격 그림: 코덱스 프레임 몬스터는 공격 프레임 가운데(타격 순간) 한 장. csv attack 칸은 다른 몬스터의 대체값이라 쓰지 않는다 (10-11 그림 감사 C-4)
  const strikeFrame = (src, fallback) => {
    const f = frames[src] && frames[src].attack ? frames[src].attack.frames.split(";") : null;
    if (!f) return fallback;
    const imp = frames[src].attack.impact;
    return f[imp !== undefined && imp !== "" ? Math.min(f.length - 1, Number(imp)) : Math.floor(f.length / 2)];
  };
  const body = [
    "        self.PlayerAppearance = {}",
    ...appearance.map((r) => `        self.PlayerAppearance[${s(r.slot)}] = ${s(r.ruid)}`),
    "        self.PlayerAppearanceName = {}",
    ...appearance.map((r) => `        self.PlayerAppearanceName[${s(r.slot)}] = ${s(r.name)}`),
    "        self.BossSkills = {}",
    ...load("bosses").filter((b) => (b.skills || "") !== "").map((b) => {
      const src = (mons.find((m) => m.id === b.id) || {}).sourceId || b.id;
      // 무리 부르기: 보스는 자기 복제가 아니라 bosses.csv의 졸개(minion)를 부른다 (sourceId로 바꿔 둔다)
      const minion = b.minion ? (mons.find((m) => m.id === b.minion) || {}).sourceId || "" : "";
      // 레이드 강화 (10-21): 몸 주위 오라(aura·반경·공격력 배율/0.5초) · 생명 25% 궁극기(ult 모양·이름·배율·횟수)
      return `        self.BossSkills[${s(src)}] = { skills = ${s(b.skills)}, interval = ${n(b.skillInterval || 5)}, minion = ${s(minion)}, aura = ${s(b.aura || "")}, auraR = ${n(b.auraRadius || 0)}, auraMult = ${n(b.auraMult || 0)}, ult = ${s(b.ult || "")}, ultName = ${s(b.ultName || "")}, ultMult = ${n(b.ultMult || 0)}, ultWaves = ${n(b.ultWaves || 1)} }`;
    }),
    "        self.Variants = {}",
    "        self.VariantOrder = {}",
    ...variants.map((v) => `        self.Variants[${s(v.id)}] = { id = ${s(v.id)}, name = ${s(v.name)}, kind = ${s(v.kind)}, effect = ${s(v.effect)}, value = ${n(v.value)}, radius = ${n(v.radius)}, interval = ${n(v.interval)}, mult = ${n(v.mult)}, element = ${s(v.element)}, weight = ${n(v.weight)} }\n        table.insert(self.VariantOrder, ${s(v.id)})`),
    "        self.Archetypes = {}",
    ...archetypes.map((a) => `        self.Archetypes[${s(a.id)}] = { id = ${s(a.id)}, name = ${s(a.name)}, trait = ${s(a.trait)}, monster = ${s(a.monster)}, shadow = ${s(a.shadow)} }`),
    "        self.MonsterStates = {}",
    ...monsterStates.map((m) => `        self.MonsterStates[${s(m.id)}] = { id = ${s(m.id)}, name = ${s(m.name)}, speedPct = ${n(m.speedPct)}, attackPct = ${n(m.attackPct)}, tint = ${s(m.tint)}, color = ${s(m.color)}, desc = ${s(m.desc)} }`),
    "        self.Weeklies = {}",
    "        self.WeeklyOrder = {}",
    ...weekly.map((w) => `        self.Weeklies[${s(w.id)}] = { id = ${s(w.id)}, name = ${s(w.name)}, desc = ${s(w.desc)}, elite = ${n(w.elite)}, stat = ${n(w.stat)}, speed = ${n(w.speed)}, mobs = ${n(w.mobs)}, curse = ${n(w.curse)}, rolls = ${n(w.rolls)}, extract = ${n(w.extract)}, light = ${n(w.light)}, skel = ${n(w.skel)} }\n        table.insert(self.WeeklyOrder, ${s(w.id)})`),
    "        self.Ranks = {}",
    ...ranks.map((r) => `        self.Ranks[${s(r.rank)}] = { name = ${s(r.name)}, hpMul = ${n(r.hpMul)}, dmgMul = ${n(r.dmgMul)}, extract = ${n(r.extractChance)}, extractCap = ${n(r.extractCap || 0.75)}, grade = ${n(r.shadowGrade)} }`),
    "        self.Shop = {}",
    ...shop.map((r) => `        self.Shop[${s(r.key)}] = { name = ${s(r.name)}, price = ${n(r.price)}, perLevel = ${n(r.pricePerLevel)}, hpPct = ${n(r.hpPct)}, manaPct = ${n(r.manaPct)}, hpFlat = ${n(r.hpFlat || 0)}, manaFlat = ${n(r.manaFlat || 0)}, kind = ${s(r.kind || r.key)}, tier = ${n(r.tier || 0)}, minLevel = ${n(r.minLevel || 1)}, icon = ${s(r.icon || "")}, iconPx = ${n(r.iconPx || 0)} }`),
    "        self.Difficulties = {}",
    ...diffs.map((d) => `        self.Difficulties[${n(d.index)}] = { id = ${s(d.id)}, name = ${s(d.name)}, suffix = ${s(d.mapSuffix)}, levelBonus = ${n(d.levelBonus)}, levelFrom = ${n(d.levelFrom)}, levelTo = ${n(d.levelTo)}, resistPenalty = ${n(-num(d.resistPenalty))}, deathExpLossPct = ${n(d.deathExpLossPct)}, questRewardMul = ${n(d.questRewardMul)}, monsterHpMul = ${n(d.monsterHpMul || 1)}, monsterDmgMul = ${n(d.monsterDmgMul || 1)}, dropQualityMul = ${n(d.dropQualityMul || 1)}, dropMagicMul = ${n(d.dropMagicMul || 1)}, dropGoldMul = ${n(d.dropGoldMul || 1)}, dropRuneMul = ${n(d.dropRuneMul || 1)}, dropNoneMul = ${n(d.dropNoneMul || 1)}, auraW1 = ${n(d.auraW1 || 60)}, auraW2 = ${n(d.auraW2 || 30)}, auraW3 = ${n(d.auraW3 || 10)}, eliteVariantChance = ${n(d.eliteVariantChance || 0)}, championDual = ${n(d.championDual || 0)} }`),
    "        self.Sounds = {}",
    ...sounds.map((r) => `        self.Sounds[${s(r.key)}] = ${s(r.ruid)}`),
    "        self.MonsterNames = {}",
    ...mons.map((m) => `        self.MonsterNames[${s(m.sourceId)}] = ${s(m.name)}`),
    "        self.MonsterFrames = {}",
    ...Object.entries(frames).map(([src, states]) => `        self.MonsterFrames[${s(src)}] = { ${Object.values(states).map((f) => `${f.state} = { r = { ${f.frames.split(";").map(s).join(", ")} }, d = { ${f.delays.split(";").map(n).join(", ")} }, loop = ${f.loop === "true"}${f.impact !== undefined && f.impact !== "" ? `, s = ${Number(f.impact) + 1}` : ""} }`).join(", ")} }`),
    "        self.MonsterSourceOf = {}",
    ...mons.map((m) => `        self.MonsterSourceOf[${s(m.id)}] = ${s(m.sourceId)}`),
    "        self.MonsterStats = {}",
    ...mons.map((m) => `        self.MonsterStats[${s(m.sourceId)}] = { level = ${n(m.baseLevel)}, hp = ${n(m.baseHp)}, dmg = ${n(m.baseDmg)}, interval = ${n(m.atkIntervalSec)}, speed = ${n(m.speed)}, range = ${n(m.attackRange || 0.8)}, element = ${s(m.element)}, ratio = ${n(m.elementRatio)}, resists = ${s(m.resists)}, behavior = ${s(m.behavior)}, stand = ${s(firstFrame(m.sourceId, "stand", m.stand))}, move = ${s(firstFrame(m.sourceId, "move", m.move))}, attack = ${s(strikeFrame(m.sourceId, m.attack))}, innate = ${s(m.innate)}, rank = ${s(num(m.grade) >= 3 ? "boss" : bool(m.unique) ? "unique" : "normal")}, summonScale = ${n(summonScale(m))}, mid = ${s(m.id)}, w = ${n(m.w || 0)}, h = ${n(m.h || 0)}, bh = ${n(m.bodyH || 0)}, portrait = ${s(m.portrait || "")}, pw = ${n(m.pw || 0)}, ph = ${n(m.ph || 0)}, chain = ${n(m.chain || 0)}, arch = ${s(m.archetype || "soldier")} }`),
    // 몬스터 피격·사망음 (data/monster_sounds.csv — 메이플 몬스터 팩의 _audio/Damage · Die, 10-23)
    "        self.MonsterSfx = {}",
    ...load("monster_sounds").map((r) => `        self.MonsterSfx[${s((mons.find((m) => m.id === r.monster) || {}).sourceId || r.monster)}] = { hit = ${s(r.hit)}, die = ${s(r.die)} }`),
    "        self.MapSpawns = {}",
    ...load("maps").filter((m) => m.spawns !== "").map((m) => {
      const w = num(m.w, 14), h = num(m.h, 8);
      const area = `minX = ${-(w / 2) + 3}, maxX = ${w / 2 - 3}, minY = ${-(h / 2) + 2.5}, maxY = ${h / 2 - 1.5}`;
      return `        self.MapSpawns[${s(m.id)}] = { entries = ${s(m.spawns)}, entriesNm = ${s(m.spawnsNm || "")}, entriesHell = ${s(m.spawnsHell || "")}, pack = ${n(m.packSize || 1)}, elite = ${n(m.eliteChance)}, variant = ${m.variantChance === "" ? -1 : n(m.variantChance)}, respawn = ${n(m.respawnSec || 10)}, ${area} }`;
    }),
    "        self.MapInfo = {}",
    ...mapRows.map((m) => {
      const maze = load("map_layouts").some((l) => l.map === m.id);
      const feats = minimapFeatures(m, mapRows).map((f) => `{ kind = ${s(f.kind)}, x = ${n(f.x)}, y = ${n(f.y)}, label = ${s(f.label)}, targetMap = ${s(f.targetMap)} }`).join(", ");
      return `        self.MapInfo[${s(m.id)}] = { name = ${s(m.name)}, kind = ${s(m.kind)}, parent = ${s(m.parent || "")}, act = ${n(m.act || 1)}, w = ${n(m.w)}, h = ${n(m.h)}, ambient = ${n(m.ambient || 0)}, maze = ${maze}, flavor = ${s(m.flavor || "")}, features = { ${feats} } }`;
    }),
    "        self.UiIcons = {}",
    ...load("ui_icons").map((r) => `        self.UiIcons[${s(r.key)}] = ${s(r.ruid)}`),
    // 이야기 문구 (data/story.csv — 시작 내레이션·장 표시·장 마무리·NPC 한마디. 「/」로 쪽 나눔, {장소}·[적] 강조)
    "        self.Story = {}",
    ...load("story").map((r) => `        self.Story[${s(r.key)}] = ${s(r.text)}`),
    "        self.DepthPool = {}",
    // 심도는 액트별 (10-20): 액트 N 심도에는 그 지역(region) 몬스터만
    ...mons.filter((m) => m.depth === "pool").map((m) => `        table.insert(self.DepthPool, { id = ${s(m.id)}, act = ${n(m.region || 1)} })`),
    "        self.DepthUniques = {}",
    ...mons.filter((m) => /^every\d+$/.test(m.depth)).sort((a, b) => num(b.depth.slice(5)) - num(a.depth.slice(5)))
      .map((m) => `        table.insert(self.DepthUniques, { every = ${n(m.depth.slice(5))}, id = ${s(m.id)}, act = ${n(m.region || 1)} })`),
  ].join("\n");
  const extra = `
    method string GetPlayerAppearance(string slot)
        -- 월드 전용 기본 피부·머리·얼굴 (player_appearance.csv). 계정 옷장과 별개다.
        self:Ensure()
        return self.PlayerAppearance[slot] or ""
    end

    method integer LookOptionCount(string kind, string gender)
        -- 캐릭터 만들기 선택지 수: kind = "hair" | "face", gender = "m" | "f" (player_appearance.csv의 hair.m.1 …)
        self:Ensure()
        local n = 0
        while self.PlayerAppearance[kind .. "." .. gender .. "." .. tostring(n + 1)] ~= nil do n = n + 1 end
        return n
    end

    method table ParseLook(string look)
        -- 캐릭터 외형 "m-1-1" (성별-머리 색-눈 색) → { g, h, f, hair, face, hairName, faceName }. 모르면 기본(남·1·1)
        self:Ensure()
        local g, h, f = string.match(look or "", "^([mf])%-(%d+)%-(%d+)$")
        if g == nil then g, h, f = "m", "1", "1" end
        local hairKey = "hair." .. g .. "." .. h
        local faceKey = "face." .. g .. "." .. f
        if self.PlayerAppearance[hairKey] == nil then hairKey = "hair." .. g .. ".1" end
        if self.PlayerAppearance[faceKey] == nil then faceKey = "face." .. g .. ".1" end
        return { g = g, h = tonumber(h) or 1, f = tonumber(f) or 1,
            hair = self.PlayerAppearance[hairKey] or self.PlayerAppearance["hair"] or "",
            face = self.PlayerAppearance[faceKey] or self.PlayerAppearance["face"] or "",
            hairName = self.PlayerAppearanceName[hairKey] or "", faceName = self.PlayerAppearanceName[faceKey] or "" }
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

    method any GetBossSkills(string sourceId)
        -- 보스가 내려찍기 사이에 쓰는 기술 (bosses.csv skills · skillInterval). 없으면 nil
        self:Ensure()
        return self.BossSkills[sourceId]
    end

    method any GetArchetype(string id)
        -- 몬스터 유형 (archetypes.csv: 짐승·무리·거구·방패·사수·암살자·광전사·병사). 없으면 병사
        self:Ensure()
        return self.Archetypes[id] or self.Archetypes["soldier"]
    end

    method any GetMonsterState(string id)
        -- 몬스터 상태 (monster_states.csv: 각성 등 — 이름 아래 특성 줄에 붙고 몸 색·속도에 반영). 없으면 nil
        self:Ensure()
        if id == "" then return nil end
        return self.MonsterStates[id]
    end

    method string ArchetypeOf(string sourceId)
        -- 원본 몬스터의 유형 id (monsters.csv archetype). 모르는 종은 ""
        self:Ensure()
        local m = self.MonsterStats[sourceId]
        return m ~= nil and m.arch or ""
    end

    -- 변종 능력 코드 (10-24 C안): "능력[:오오라 수치]" 를 "+"로 잇는다. 예) "aura_haste:23+skill_fire"
    -- 예전 저장의 "aura_haste" 처럼 수치가 없으면 variants.csv 값. 오오라 등급: 옅은 · 짙은 · 극한 (config auraTier2From·auraTier3From)
    method table ParseVariant(string code)
        -- 코드 → 능력 표 목록 (각각 variants.csv 행의 복사 + value·tier·label)
        self:Ensure()
        if code == nil or code == "" then return {} end
        -- 몬스터·그림자가 매 프레임 묻는다 → 코드별로 한 번만 풀어 둔다 (돌려준 표는 고치지 않는다)
        local hit = self.VariantCache[code]
        if hit ~= nil then return hit end
        local list = {}
        for part in string.gmatch(code, "[^+]+") do
            local id, val = string.match(part, "^([^:]+):?(%d*)$")
            local base = id ~= nil and self.Variants[id] or nil
            if base ~= nil then
                local v = {}
                for k, x in pairs(base) do v[k] = x end
                if val ~= nil and val ~= "" then v.value = tonumber(val) end
                v.tier = 0
                v.label = v.name
                v.amount = 0
                v.text = ""
                if v.kind == "aura" then
                    -- 수치(10~25) × variants.csv mult = 실제 효과량 (재생 ×0.1 · 저항 ×1.5 · 가시 ×3 · 치명 ×0.5 · 나머지 ×1)
                    v.tier = self:AuraTier(v.value)
                    v.amount = v.value * (v.mult > 0 and v.mult or 1)
                    v.text = self:AuraEffectText(v.effect, v.amount)
                    v.label = self:AuraTierName(v.tier) .. " " .. v.name
                end
                table.insert(list, v)
            end
        end
        self.VariantCache[code] = list
        return list
    end

    method any GetVariant(string code)
        -- 첫 능력 (예전 한 능력 호출 호환). 없으면 nil
        local list = self:ParseVariant(code)
        return list[1]
    end

    method any GetVariantOf(string code, string want)
        -- want = "aura" → 오오라 능력, "skill" → 오오라가 아닌 능력(기술·독안개). 없으면 nil
        for _, v in ipairs(self:ParseVariant(code)) do
            if (want == "aura") == (v.kind == "aura") then return v end
        end
        return nil
    end

    method string VariantLabel(string code)
        -- 이름표·창 표시: "극한 질풍 오오라 +23% · 화염 폭발"
        local names = {}
        for _, v in ipairs(self:ParseVariant(code)) do table.insert(names, v.label) end
        return table.concat(names, " · ")
    end

    method string AuraEffectText(string effect, number amount)
        -- 오오라 효과 한 줄 (대상 창·그림자 창·버프 설명 공통)
        local n = math.floor(amount + 0.5)
        if effect == "dmg" then return string.format("피해 +%d%%", n) end
        if effect == "haste" then return string.format("공격 속도 +%d%%", n) end
        if effect == "move" then return string.format("이동 속도 +%d%%", n) end
        if effect == "guard" then return string.format("받는 피해 -%d%%", n) end
        if effect == "regen" then return string.format("초당 생명 %.1f%% 회복", amount) end
        if effect == "resist" then return string.format("모든 저항 +%d", n) end
        if effect == "thorns" then return string.format("근접 평타 피해 %d%% 반사", n) end
        if effect == "crit" then return string.format("치명타 확률 +%d%% (×1.5)", n) end
        if effect == "corrode" then return string.format("주변 적 모든 저항 -%d", n) end
        return ""
    end

    method integer AuraTier(number value)
        if value >= self.auraTier3From then return 3 end
        if value >= self.auraTier2From then return 2 end
        return 1
    end

    method string AuraTierName(integer tier)
        if tier >= 3 then return "극한" end
        if tier == 2 then return "짙은" end
        return "옅은"
    end

    method integer RollAuraValue(integer difficulty)
        -- 등급을 난이도별 확률(difficulty.csv auraW1~3)로 고른 뒤 그 등급 범위 안에서 수치
        local d = self:GetDifficulty(difficulty)
        local w1, w2, w3 = d.auraW1, d.auraW2, d.auraW3
        local roll = _UtilLogic:RandomDouble() * (w1 + w2 + w3)
        local lo, hi = math.floor(self.auraMin), math.floor(self.auraTier2From) - 1
        if roll >= w1 + w2 then lo, hi = math.floor(self.auraTier3From), math.floor(self.auraMax)
        elseif roll >= w1 then lo, hi = math.floor(self.auraTier2From), math.floor(self.auraTier3From) - 1 end
        return _UtilLogic:RandomIntegerRange(lo, hi)
    end

    method string RollAbility(string want)
        -- 무작위 능력 id (weight 비례, 0은 고유 전용). want = "" 아무거나 · "aura" · "skill"
        self:Ensure()
        local total = 0
        local ok = function(v) return v.weight > 0 and (want == "" or (want == "aura") == (v.kind == "aura")) end
        for _, id in ipairs(self.VariantOrder) do if ok(self.Variants[id]) then total = total + self.Variants[id].weight end end
        if total <= 0 then return "" end
        local roll = _UtilLogic:RandomDouble() * total
        for _, id in ipairs(self.VariantOrder) do
            local v = self.Variants[id]
            if ok(v) then
                roll = roll - v.weight
                if roll <= 0 then return id end
            end
        end
        return ""
    end

    method string AbilityCode(string id, integer difficulty)
        -- 능력 id → 코드 조각 (오오라면 수치를 굴려 붙인다)
        if id == "" then return "" end
        local v = self.Variants[id]
        if v ~= nil and v.kind == "aura" then return id .. ":" .. tostring(self:RollAuraValue(difficulty)) end
        return id
    end

    method string RollVariant(integer difficulty)
        -- 변종 우두머리 능력: 보통은 하나, 악몽부터(difficulty.csv championDual)는 오오라 + 기술 둘
        local d = self:GetDifficulty(difficulty)
        if d.championDual > 0 then
            return self:AbilityCode(self:RollAbility("aura"), difficulty) .. "+" .. self:RollAbility("skill")
        end
        return self:AbilityCode(self:RollAbility(""), difficulty)
    end

    method string RollEliteVariant(integer difficulty)
        -- 악몽부터 정예도 difficulty.csv eliteVariantChance 확률로 능력 하나 (없으면 "")
        local d = self:GetDifficulty(difficulty)
        if d.eliteVariantChance <= 0 or _UtilLogic:RandomDouble() >= d.eliteVariantChance then return "" end
        return self:AbilityCode(self:RollAbility(""), difficulty)
    end

    method any GetShopItem(string key)
        -- 상점 품목 (shop.csv). 없으면 nil
        self:Ensure()
        return self.Shop[key]
    end

    method any GetMonsterFrames(string sourceId)
        -- 프레임 애니메이션 (stand/move/attack/hit/die → { r = 스프라이트 RUID 목록, d = 프레임 시간, loop }). 없으면 nil (클립 몬스터)
        self:Ensure()
        return self.MonsterFrames[sourceId]
    end

    method any GetMonsterSfx(string sourceId)
        -- 몬스터 피격·사망음 { hit, die } (monster_sounds.csv, sourceId 기준). 없으면 nil
        self:Ensure()
        return self.MonsterSfx[sourceId]
    end

    method any GetMonsterStats(string sourceId)
        -- 원본 몬스터 능력치 (monsters.csv, sourceId 기준). 그림자 개성의 원천. 없으면 nil
        self:Ensure()
        return self.MonsterStats[sourceId]
    end

    method string GetStory(string key)
        -- 이야기 문구 (data/story.csv). 없으면 ""
        -- 심연을 숨긴 동안(config depthEnabled 0)은 「<키>_nodepth」 판이 있으면 그것을 쓴다 (붉은 포탈을 말하지 않는 문구 · 10-24)
        self:Ensure()
        if self.depthEnabled < 1 and self.Story[key .. "_nodepth"] ~= nil then return self.Story[key .. "_nodepth"] end
        return self.Story[key] or ""
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

    method table GetDepthPool(integer act)
        -- 그 액트 심도에 나오는 몬스터 모델 id 목록 (monsters.csv depth=pool, region = 액트). 없으면 액트 1
        self:Ensure()
        local list = {}
        for _, e in ipairs(self.DepthPool) do
            if e.act == act then table.insert(list, e.id) end
        end
        if #list == 0 and act ~= 1 then return self:GetDepthPool(1) end
        return list
    end

    method string GetDepthUnique(integer floor, integer act)
        -- 이 층에 나올 그 액트 최상위 몬스터 (monsters.csv depth=everyN, 큰 N 우선). 없으면 ""
        self:Ensure()
        for _, u in ipairs(self.DepthUniques) do
            if u.act == act and floor % u.every == 0 then return u.id end
        end
        return ""
    end

    method string GetMonsterName(string sourceId)
        self:Ensure()
        return self.MonsterNames[sourceId] or sourceId
    end
`;
  write("GameData.mlua", "config.csv, difficulty.csv, sounds.csv, monsters.csv, shop.csv, player_appearance.csv, monster_ranks.csv, variants.csv, archetypes.csv, monster_states.csv, weekly.csv, maps.csv",
    logic("GameData", "게임 설정값(config.csv 각 행 = 속성), 난이도, 배경음, 몬스터 표시 이름", body, extra,
      props + "\n    property table PlayerAppearance = {}\n    property table PlayerAppearanceName = {}\n    property table Difficulties = {}\n    property table Sounds = {}\n    property table MonsterNames = {}\n    property table DepthPool = {}\n    property table MapSpawns = {}\n    property table MapInfo = {}\n    property table UiIcons = {}\n    property table Story = {}\n    property table Shop = {}\n    property table Variants = {}\n    property table VariantOrder = {}\n    property table VariantCache = {}\n    property table Archetypes = {}\n    property table MonsterStates = {}\n    property table Weeklies = {}\n    property table WeeklyOrder = {}\n    property table MonsterSourceOf = {}\n    property table MonsterStats = {}\n    property table MonsterSfx = {}\n    property table MonsterFrames = {}\n    property table Ranks = {}\n    property table DepthUniques = {}\n    property table BossSkills = {}\n"));
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
    ...bases.map((r) => `        self.Bases[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, slot = ${s(r.slot)}, reqLv = ${n(r.reqLv)}, grade = ${n(r.grade || 0)}, dmg = ${n(r.dmg)}, def = ${n(r.def)}, sockets = ${n(r.sockets)}, icon = ${s(r.icon)}, avatar = ${s(r.avatar || "")}, iconPx = ${n(r.iconPx || 0)}, implicit = ${s(r.mods || "")} }${r.drop === "false" ? "" : `\n        table.insert(self.BaseOrder, ${s(r.id)})`}`),
    "        self.Affixes = {}",
    ...affixes.map((r) => `        table.insert(self.Affixes, { id = ${s(r.id)}, prefix = ${b(r.prefix)}, name = ${s(r.name)}, stat = ${s(r.stat)}, min = ${n(r.min)}, max = ${n(r.max)}, ilvl = ${n(r.minIlvl)}, slots = ${s(r.slots)}, tier = ${n(r.tier || 0)} })`),
    "        self.UniqueList = {}",
    ...uniques.map((r) => `        table.insert(self.UniqueList, { id = ${s(r.id)}, base = ${s(r.base)}, name = ${s(r.name)}, mods = ${s(r.mods)}, special = ${s(r.special || "")}, source = ${s(r.source)}, weight = ${n(r.weight || 1)}, tree = ${s(r.tree || "any")} })`),
    "        self.Runes = {}",
    "        self.RuneOrder = {}",
    ...runes.map((r) => `        self.Runes[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, weapon = ${s(r.weapon)}, armor = ${s(r.armor)}, lamp = ${s(r.lamp)}, minLevel = ${n(r.minLevel)}, weight = ${n(r.dropWeight)}, icon = ${s(r.icon || "")}, iconPx = ${n(r.iconPx || 0)} }\n        table.insert(self.RuneOrder, ${s(r.id)})`),
    "        self.Drops = {}",
    ...drops.map((r) => `        self.Drops[${s(r.rank)}] = { picks = ${n(r.picks)}, none = ${n(r.none)}, gold = ${n(r.gold)}, potion = ${n(r.potion)}, item = ${n(r.item)}, rune = ${n(r.rune)}, unique = ${n(r.unique)}, set = ${n(r.set)}, rare = ${n(r.rare)}, magic = ${n(r.magic)} }`),
    "        self.Sets = {}",
    ...sets.map((r) => `        self.Sets[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, bonus2 = ${s(r.bonus2)}, bonus3 = ${s(r.bonus3)}, full = ${s(r.full)}, tree = ${s(r.tree || "any")}, grade = ${n(r.grade || 0)}, pieces = ${n(pieces.filter((p) => p.set === r.id).length)} }`),
    "        self.SetPieces = {}",
    "        self.SetPieceOrder = {}",
    ...pieces.map((r) => `        self.SetPieces[${s(r.base)}] = { set = ${s(r.set)}, base = ${s(r.base)}, name = ${s(r.name)}, mods = ${s(r.mods)} }\n        table.insert(self.SetPieceOrder, ${s(r.base)})`),
    "        self.Runewords = {}",
    ...runewords.map((r) => `        self.Runewords[${s(r.runes)}] = { name = ${s(r.name)}, slots = ${s(r.slots)}, mods = ${s(r.mods)}, tree = ${s(r.tree || "any")} }`),
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
    ...rows.map((r) => `        self.Skills[${s(r.id)}] = { id = ${s(r.id)}, name = ${s(r.name)}, tree = ${s(r.tree)}, row = ${n(r.row)}, kind = ${s(r.kind)}, prereq = ${s(r.prereq)}, maxLv = ${n(r.maxLv)}, mana = ${n(r.mana)}, cooldown = ${n(r.cooldown)}, impl = ${b(r.impl)}, nextLv = ${n(r.nextLv || 0)}, desc = ${s(r.desc)}, icon = ${s(r.icon)}, parent = ${s(r.parent || "")}, need = ${n(r.need || 0)} }\n        table.insert(self.Order, ${s(r.id)})`),
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

    method table NodesOf(string parent)
        -- 메인 스킬에 붙은 강화 노드 id (표 순서)
        self:Ensure()
        local list = {}
        for _, id in ipairs(self.Order) do
            if self.Skills[id].parent == parent then table.insert(list, id) end
        end
        return list
    end

    method table Mains()
        -- 메인 스킬 id (해금 레벨 순 — 표가 이미 그 순서)
        self:Ensure()
        local list = {}
        for _, id in ipairs(self.Order) do
            if self.Skills[id].kind ~= "node" then table.insert(list, id) end
        end
        return list
    end

    method string TreeName(string tree)
        -- 계열 이름: 소환·영혼·저주·이동 (스킬 창·아이템 옵션 공통, docs/design/19 · 기동 10-20)
        if tree == "command" then return "소환" end
        if tree == "soul" then return "영혼" end
        if tree == "move" then return "이동" end
        return "저주"
    end
`;
  write("SkillData.mlua", "skills.csv", logic("SkillData", "네크로맨서 스킬 정의 (docs/design/04 3장). impl=false는 트리에만 보이는 준비 중 스킬", body, extra,
    "    property table Skills = {}\n    property table Order = {}\n"));
}

// ── QuestData ──
function genQuests() {
  const rows = load("quests");
  const givers = load("npcs").filter((x) => rows.some((r) => r.giver === x.kind));
  const body = ["        self.List = {}",
    ...rows.map((r) => `        table.insert(self.List, { title = ${s(r.title)}, desc = ${s(r.desc)}, zone = ${s(r.zone || "")}, objective = ${s(r.objective || "")}, kind = ${s(r.kind)}, target = ${s(r.target)}, map = ${s(r.map || "")}, map1 = ${s(r.map1 || "")}, giver = ${s(r.giver || "quest")}, act = ${n(r.act || 1)}, count = ${n(r.count)}, exp = ${n(r.exp)}, level = ${n(r.level || 1)}, gate = ${s(r.gate || "")}, gold = ${n(r.gold)}, reward = ${s(r.reward)}, intro = ${s(r.intro || "")}, outro = ${s(r.outro || "")} })`),
    "        self.Givers = {}",
    ...givers.map((x) => `        self.Givers[${s(x.kind)}] = ${s(x.name)}`),
    "        self.Voices = {}",
    ...load("npcs").map((x) => `        self.Voices[${s(x.kind)}] = ${s(x.voice || "haera")}`),
    "        self.Portraits = {}",
    ...load("npcs").filter((x) => x.portrait).map((x) => `        self.Portraits[${s(x.kind)}] = ${s(x.portrait)}`),
    // 10-23: 그림(스프라이트)인 NPC 서 있는 모습 — 대화창 초상화를 thumbnail:// 대신 원본으로 (썸네일은 작게 줄인 미리보기라 흐렸다)
    "        self.SpriteStands = {}",
    ...[...new Set([...load("npcs").map((x) => x.stand), ...load("ui_icons").filter((x) => /^npc_/.test(x.key)).map((x) => x.ruid)].filter((r) => /^[0-9a-f]{32}$/.test(r || "")))]
      .map((r) => `        self.SpriteStands[${s(r)}] = true`)].join("\n");
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

    method string Voice(string kind)
        -- NPC 말투 (npcs.csv voice: haera 해라체 · hage 하게체 · haeyo 해요체 · hasipsio 하십시오체 · hao 하오체, docs/design/32)
        self:Ensure()
        return self.Voices[kind] or "haera"
    end

    method string Portrait(string kind)
        -- 대화창 초상화로 쓸 ui_icons 키 (npcs.csv portrait — 주요 인물만 가슴 위 그림, 없으면 "" = 서 있는 그림)
        self:Ensure()
        return self.Portraits[kind] or ""
    end

    method boolean IsSpriteStand(string ruid)
        -- 이 RUID가 그림 한 장(스프라이트)인 NPC 서 있는 모습인가 (애니메이션 클립은 thumbnail://이 필요하다)
        self:Ensure()
        return self.SpriteStands[ruid] == true
    end

    method string GiverName(string giver)
        -- 의뢰인 NPC 종류 → 이름 (npcs.csv의 name)
        self:Ensure()
        return self.Givers[giver] or giver
    end

    method boolean ActClosed(integer act)
        -- 그 액트의 마지막 의뢰가 액트 최종 보스 의뢰인가 (만드는 중인 액트는 의뢰가 다 들어오기 전까지 「끝」이 아니다 — 10-20 액트 4)
        local last = self:LastOfAct(act)
        if last <= 0 then return false end
        local boss = _GameConst:ActBossSource(act)
        return boss ~= "" and string.find("|" .. self.List[last].target .. "|", "|" .. boss .. "|", 1, true) ~= nil
    end

    method integer LastOfAct(integer act)
        -- 그 액트의 마지막 의뢰 번호 (액트 완료 = 이 의뢰까지 끝냄). 없으면 0
        self:Ensure()
        local last = 0
        for i, q in ipairs(self.List) do
            if q.act == act then last = i end
        end
        return last
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
            elseif key == "deploy" then table.insert(parts, "그림자 수 +" .. val .. "기 (영구 · 난이도마다)")
            elseif key == "respoison" then table.insert(parts, "독 저항 +" .. val .. " (영구 · 난이도마다)")
            elseif key == "reslight" then table.insert(parts, "번개 저항 +" .. val .. " (영구 · 난이도마다)")
            elseif key == "resfire" then table.insert(parts, "화염 저항 +" .. val .. " (영구 · 난이도마다)")
            elseif key == "unique" then table.insert(parts, "유니크 장비 " .. val)
            elseif key == "runes" then table.insert(parts, "룬 " .. val .. "개")
            elseif key == "socket" then table.insert(parts, "소켓권 " .. val .. "장")
            elseif key == "gen" then table.insert(parts, val == "3" and "희귀 장비" or "마법 장비") end
        end
        return table.concat(parts, ", ")
    end

    method integer ExpFor(table q, integer difficulty)
        -- 의뢰 경험치: 보통의 q.exp가 그 레벨(q.level)에서 레벨 몇 분의 몇인지를 그대로 두고, 악몽·지옥에선 그 난이도 레벨의 필요 경험치로 바꾼다
        -- (10-23 사용자: 「보통 3장 6만이면 악몽 3장은 그 레벨에 맞게」 — 고정 배율 ×5·×14는 1장에서 거의 0이 됐다)
        if q.exp <= 0 or difficulty <= 0 then return q.exp end
        local lv = math.max(1, q.level or 1)
        local to = _GameConst:ScaleLevel(lv, difficulty)
        local need = function(l) return _GameData.expCurveCoef * (l ^ _GameData.expCurveExp) end
        -- 한 의뢰는 그 난이도에서 레벨 하나를 넘지 않는다 (보통 1·4번은 첫 레벨을 끌어올리려고 2.8·1.1레벨치를 준다)
        local share = math.min(1, q.exp / need(lv))
        return math.floor(share * need(to) + 0.5)
    end
`;
  write("QuestData.mlua", "quests.csv", logic("QuestData", "의뢰 목록 (순서대로 진행). kind: kill / extract / reach / raise / clear(맵 전멸) / boss(이름 있는 적) / ritual(제단 의식) / chest(열쇠 → 봉인 상자). act = 액트", body, extra, "    property table List = {}\n    property table Givers = {}\n    property table Voices = {}\n    property table Portraits = {}\n    property table SpriteStands = {}\n"));
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
  const actOf = Object.fromEntries(load("maps").map((m) => [m.id, num(m.act || 1)]));
  const body = ["        self.List = {}",
    ...rows.map((r) => `        table.insert(self.List, { id = ${s(r.id)}, name = ${s(r.name)}, map = ${s(r.map)}, act = ${actOf[r.map] || 1}, x = ${n(r.x)}, y = ${n(r.y)} })`)].join("\n");
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

    method table ListOfAct(integer act)
        -- 그 액트의 웨이포인트 (창의 액트 탭)
        self:Ensure()
        local out = {}
        for _, w in ipairs(self.List) do if w.act == act then table.insert(out, w) end end
        return out
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
    ...mons.map((r) => `        table.insert(self.Monsters, { id = ${s(r.id)}, name = ${s(r.name)}, grade = ${n(r.grade)}, unique = ${b(r.unique)}, arch = ${s(r.archetype || "")}, lore = ${s(r.lore || "")} })`)].join("\n");
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
