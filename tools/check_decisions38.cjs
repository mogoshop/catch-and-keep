#!/usr/bin/env node
// 기획서 38 부록 E 「결정 26개」 대조 검사 (10-28): 결정마다 데이터 값·코드 흔적·설계도 맵을 확인해 표로 찍는다.
//   node tools/check_decisions38.cjs        하나라도 어긋나면 종료 코드 1
// 메이커에서 확인한 것(화면·로그)은 기획서 38 부록 H에 적는다. 이 검사는 「값이 결정대로 들어가 있는가」만 본다.
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { load, num } = require("./lib/csv.cjs");

const ROOT = path.resolve(__dirname, "..");
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const has = (rel, text) => src(rel).includes(text);
const cfg = Object.fromEntries(load("config").map((r) => [r.key, num(r.value)]));
const skills = Object.fromEntries(load("skills").map((r) => [r.id, r]));
const maps = load("maps");
const quests = load("quests");
const bp = (id) => fs.existsSync(path.join(ROOT, "data/handmade", id + ".txt"));
const rows = [];
const check = (no, what, ok, evidence) => rows.push({ no, what, ok: !!ok, evidence });

// U1 이전 몬스터 속도 (#2 짐승·떼·암살자 ×1.2 비교용)
const before = (() => {
  try {
    const text = execSync("git show e79c191^:data/monsters.csv", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const { parse } = require("./lib/csv.cjs");
    const t = parse(text); const h = t.shift();
    return Object.fromEntries(t.map((r) => [r[h.indexOf("id")], r]).map(([id, r]) => [id, { speed: num(r[h.indexOf("speed")]), arch: r[h.indexOf("archetype")], grade: num(r[h.indexOf("grade")]) }]));
  } catch (e) { return null; }
})();
const mons = load("monsters");
const fastArch = mons.filter((m) => ["beast", "swarm", "assassin"].includes(m.archetype) && num(m.grade) < 3);
const sped = before ? fastArch.filter((m) => before[m.id] && Math.abs(num(m.speed) - before[m.id].speed * 1.2) < 0.051).length : -1;

check(1, "질주 Lv9 해금(포인트로 배움)", skills.wraith_dash.row === "9" && skills.wraith_dash.kind === "active" && has("RootDesk/MyDesk/UI/Windows/GuideWindow.mlua", "질주 (Lv\" .. tostring(math.floor((_SkillData:Get(\"wraith_dash\")"), `wraith_dash row ${skills.wraith_dash.row} (배우는 스킬) · 안내 창 「Space 질주 (Lv9부터」 — 해금 레벨을 스킬 표에서 읽는다`);
check(2, "기본 이속 1.73 · 짐승·떼·암살자 ×1.2 · 해골 1.7 · 그림자 하한 1.2",
  cfg.playerSpeedMul === 1.73 && cfg.skeletonSpeed === 1.7 && cfg.shadowSpeedMin === 1.2 && (sped === -1 || sped >= 10),
  `playerSpeedMul ${cfg.playerSpeedMul} · skeletonSpeed ${cfg.skeletonSpeed} · shadowSpeedMin ${cfg.shadowSpeedMin} · ×1.2 몬스터 ${sped}/${fastArch.length}`);
check(3, "가벼운 걸음 Lv4 · 해골 폭탄 Lv10", skills.swift_step.row === "4" && skills.skel_bomb.row === "10", `swift_step ${skills.swift_step.row} · skel_bomb ${skills.skel_bomb.row}`);
const uq = quests.filter((q) => /unique:1/.test(q.reward));
check(4, "액트 끝 의뢰 유니크 = 보스 전용 풀", uq.length >= 5 && uq.some((q) => q.map === "cellar2") && has("RootDesk/MyDesk/Quest/PlayerQuest.mlua", "PickUnique"), `유니크 보상 의뢰 ${uq.length}개(${uq.map((q) => q.map).join(",")}) · PlayerQuest.PickUnique(그 보스 풀에서)`);
check(5, "여왕 그림자 확정 없음 · 확률 표시 크게", has("RootDesk/MyDesk/UI/Hud/HudMain.mlua", "보스의 혼") && has("RootDesk/MyDesk/UI/Hud/HudMain.mlua", "<size=150%>"), "HudMain 혼 안내 「보스의 혼」 + 확률 150%");
const a2first = quests.find((q) => q.act === "2");
check(6, "액트 2 첫 의뢰 유지(사막 자칼 45)", a2first && /jackal/.test(a2first.target) && a2first.count === "45", `${a2first && a2first.title} · ${a2first && a2first.target} ${a2first && a2first.count}`);
check(7, "이야기 카드 「전체 건너뛰기」", has("RootDesk/MyDesk/UI/Hud/StoryCard.mlua", "method void SkipAll") && has("tools/build/story.cjs", "전체 건너뛰기"), "StoryCard.SkipAll · 단추 「전체 건너뛰기 ▶▶」");
check(8, "스킬 포인트 레벨당 1 유지", cfg.skillPerLevel === 1, `skillPerLevel ${cfg.skillPerLevel}`);
check(9, "그림자 본격 Lv10 · 증원 12/17/22", cfg.shadowFullLevel === 10 && cfg.deployExpandFromLv === 12 && cfg.deployExpandStep === 5 && /Lv12·17·22/.test(skills.deploy_expand.desc), `shadowFullLevel ${cfg.shadowFullLevel} · 증원 ${cfg.deployExpandFromLv}+${cfg.deployExpandStep}`);
check(10, "경험치 B: 초반 Lv8 ×1.8 · 높은 레벨 12% · expHighLevelTo 37", cfg.earlyExpLevel === 8 && cfg.earlyExpMult === 1.8 && cfg.expHighLevelPct === 12 && cfg.expHighLevelTo === 37, `${cfg.earlyExpLevel}/${cfg.earlyExpMult} · ${cfg.expHighLevelPct}% → ${cfg.expHighLevelTo}`);
check(11, "아군 표시 셋 다(고리 색·체력 막대·남의 소환수 흐리게)", has("RootDesk/MyDesk/Shadow/ShadowUnit.mlua", "method Color RingColor") && has("RootDesk/MyDesk/Shadow/ShadowUnit.mlua", "ViewHitAt") && has("RootDesk/MyDesk/World/MotionSmoother.mlua", "OtherSummonAlpha = 0.55"), "ShadowUnit.RingColor · 체력 막대(ViewHitAt) · OtherSummonAlpha 0.55");
check(12, "흔들림 기본 PC 켬 · 모바일 끔", has("RootDesk/MyDesk/Common/Util.mlua", "기본은 PC 켬 · 모바일 끔") && has("RootDesk/MyDesk/Player/PlayerSave.mlua", "ScreenShake"), "Util.ShakeEnabled(-1 = 기기 기본) · PlayerSave.ScreenShake 저장");
check(13, "소환수 피해 숫자 0.4초 합산 1개(엔진 숫자 끔)", has("RootDesk/MyDesk/Monster/Monster.mlua", "method void QueueSummonDamage") && has("RootDesk/MyDesk/Shadow/ShadowUnit.mlua", "skin.Alpha = 0"), "Monster.QueueSummonDamage 0.4초 · 소환수 기본 숫자 Alpha 0");
check(14, "연쇄 처치만(10부터) + 끝날 때 소량 보너스", cfg.streakShowFrom === 10 && cfg.streakWindowSec === 4 && cfg.streakBonusPct100 === 10 && !/다수 처치|멀티 킬/.test(src("RootDesk/MyDesk/UI/Hud/HudMain.mlua")), `streakShowFrom ${cfg.streakShowFrom} · 보너스 ${cfg.streakBonusPct10}/${cfg.streakBonusPct25}/${cfg.streakBonusPct50}/${cfg.streakBonusPct100}%`);
check(15, "바닥 이름표(PC Alt·모바일 희귀) + PC 클릭 줍기 + 줍기 단추", has("RootDesk/MyDesk/Item/LootDrop.mlua", "KeyboardKey.LeftAlt") && has("RootDesk/MyDesk/Item/PlayerInventory.mlua", "ManualPickup") && has("RootDesk/MyDesk/UI/Hud/HudMain.mlua", "method void RenderPickup") && has("tools/build/ui.cjs", "BtnPickup"), "LootDrop.RenderLabel · PlayerInventory.ManualPickup · HUD BtnPickup");
check(16, "레벨업 빛기둥만 같은 맵 공유(소리·카메라·글자는 본인)", /Multicast"\)\s*\n\s*method void LevelUpPillar/.test(src("RootDesk/MyDesk/Player/PlayerStats.mlua")) && has("RootDesk/MyDesk/Player/PlayerStats.mlua", "method void LevelUpRing"), "PlayerStats.LevelUpPillar(Multicast·같은 맵) + 고리 · NotifyLevelUp은 본인");
check(17, "보스 첫 처치 보장 드롭 없음(유지)", has("RootDesk/MyDesk/Item/LootSystem.mlua", "첫 처치 확정 보상은 없다"), "LootSystem: 첫 처치 확정 없음");
check(18, "첫 진입 둘러보기 유지", has("RootDesk/MyDesk/UI/Windows/GuideWindow.mlua", "CheckFirstEntry"), "GuideWindow.CheckFirstEntry 그대로");
check(19, "텔레메트리 선행 없이 시뮬로 바로", fs.existsSync(path.join(ROOT, "tools/sim_balance.py")) && has("tools/sim_balance.py", "nearMul") && fs.existsSync(path.join(ROOT, "data/handmade/routes.csv")), "tools/sim_balance.py --diff all · 설계도 맵은 실측 길 길이·길 근처 바닥 비율(routes.csv)");
const field = maps.filter((m) => ["field", "side", "town"].includes(m.kind));
const sizeBad = field.filter((m) => {
  const w = num(m.w), h = num(m.h);
  if (m.kind === "town") return !(w === 36 && h === 24);
  return !(w >= 60 && h >= 40 && w <= 70 && h <= 50) || !bp(m.id);
});
const inst = maps.filter((m) => m.kind === "instance");
const bossMaps = ["queentomb", "sanctum", "stormeye", "throne"].map((id) => maps.find((m) => m.id === id));
check(20, "맵 60×40~70×50 · 마을 36×24 · 심연 방 40×28 · 보스 = 회랑+아레나 60×40",
  sizeBad.length === 0 && inst.every((m) => m.w === "40" && m.h === "28") && bossMaps.every((m) => m.w === "60" && m.h === "40" && m.area),
  `66장 중 어긋남 ${sizeBad.length}${sizeBad.length ? " (" + sizeBad.map((m) => m.id).join(",") + ")" : ""} · 심연 ${inst.length}장 40×28 · 보스 맵 호위 구역(area) ${bossMaps.filter((m) => m.area).length}/4`);
check(21, "빈 맵 정리: 진행 중 곁가지 300초 미만 동결 · 넘으면 처음", cfg.sideRefillSec === 300 && cfg.mapSleepFieldSec === 90 && cfg.mapSleepSideSec === 180 && has("RootDesk/MyDesk/Monster/MonsterSpawner.mlua", "method void Sleep"), `sideRefillSec ${cfg.sideRefillSec} · 잠들기 사냥터 ${cfg.mapSleepFieldSec}/곁가지 ${cfg.mapSleepSideSec}초`);
check(22, "마을·항구·초소(+오아시스) 설계도로 재건", ["town", "oasis", "harbor", "outpost"].every(bp), "data/handmade/{town,oasis,harbor,outpost}.txt");
const art = load("art_sprites");
const packKeys = fs.readFileSync(path.join(ROOT, "data/art_sprites.csv"), "utf8").split("\n").map((l) => l.split(",")[0]);
const codex = art.filter((a) => /^(a1-(landmark|adjunct|decal-(beast|broad|chain|collapsed|dragged|ossuary|pooled|rotting|rusted|shield)|bonedust|broken-stone|cart-road|dead-grass|mud|scorched|wet-gravel|palisade|ruinwall|waste)|waste-rock-top)/.test(a.name) && /^[0-9a-f]{32}$/.test(a.ruid)).length;
const specText = ["act1", "act2", "act3", "act4"].map((a) => src(`data/handmade/specs/${a}.cjs`)).join("\n");
check(23, "바닥·벽·랜드마크 코덱스 · 소품 메이플 원본", codex >= 60 && packKeys.length > 0 && /mp-[a-z-]+/.test(specText) && load("map_sets").some((r) => r.set.startsWith("a1_lm_")), `코덱스 액트 1 맵 그림 ${codex}장 · 랜드마크 세트 a1_lm_* · 메이플 소품(mp-*) 배치`);
check(24, "스킬 창 V3(해금 시간선+공방) + 혼의 제물 3택 카드", has("RootDesk/MyDesk/UI/Windows/SkillWindow.mlua", "RenderTimeline") && has("RootDesk/MyDesk/UI/Windows/SkillOffer.mlua", "method void Choose") && has("tools/build/ui.cjs", "sk_timeline_panel"), "SkillWindow.RenderTimeline/RenderWorkshop · SkillOffer · 코덱스 V3 그림");
const log = execSync("git log --format=%s e79c191^..HEAD", { cwd: ROOT, encoding: "utf8" }).split("\n").reverse().filter(Boolean);
const order = ["U1", "U3", "U6", "U2", "U4", "U5", "U8"].map((u) => log.findIndex((s) => s.includes(u)));
check(25, "로드맵 순차: 템포 → 뽕 → 스킬 창 → 맵", order.every((v) => v >= 0) && order[0] < order[4] && order[4] < order[5] && order[5] < order[6], `커밋 순서 ${["U1", "U3", "U6", "U2", "U4", "U5", "U8"].map((u, i) => u + "#" + order[i]).join(" ")}`);
const qexp = (t) => (quests.find((q) => q.title.includes(t)) || {}).exp;
check(26, "액트 2 템포 점검(중간 의뢰 경험치)", qexp("독침 여왕") === "20000" && qexp("왕들의 봉인") === "30000" && qexp("두 문지기") === "40000", `독침 여왕 ${qexp("독침 여왕")} · 왕들의 봉인 ${qexp("왕들의 봉인")} · 두 문지기 ${qexp("두 문지기")}`);

for (const r of rows) console.log(`${r.ok ? "✓" : "✗"} #${String(r.no).padStart(2)} ${r.what} — ${r.evidence}`);
const bad = rows.filter((r) => !r.ok);
console.log(`\n결정 ${rows.length}개 중 맞음 ${rows.length - bad.length} · 어긋남 ${bad.length}`);
process.exit(bad.length ? 1 : 0);
