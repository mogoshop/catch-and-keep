// 11-03 강조 에셋 확산 (기획 63 · 사용자 승인: 샘플 4장 방식을 액트 1~4 나머지 62장으로) — 생성기(v5)가 다 놓은 배치표 줄을 마지막에 고친다(postRows · 샘플과 같은 길).
//   원칙: 원본 그림을 정수배 최근접으로 키우기만(새 그림 없음) · 결과 배율 sc×k ≤ 2.5 (넘으면 <그림>-x<N> 최근접 확대 사본) · 키운 자리는 args hero=1(<그림>-top-hero 앞층은 그 자리만)
//   자리: 광장 중앙(둘레를 돌아가게) · 벽 대신(설계도 벽을 carve로 파고 그림이 막음) · 통로 입구(반전 쌍·문 규칙) · 길목
//   맵별 줄(MAPS)마다 근거 = docs/design/63-hero-assets-survey-20261103.md §2~§4 · 적용표 = docs/evidence/2026-11-04-hero-rollout/act<N>/apply-table.csv
//   되돌리기: 그 맵 줄을 지우고 compose → build. 샘플 4장(town · oasis · kingtomb1 · rotmarsh)은 act1·act2 설계서 끝 샘플 줄 그대로(여기서 건드리지 않는다).
"use strict";
const path = require("path");
const { load } = require("../../../tools/build/lib.cjs");
const r3 = (v) => Math.round(v * 1000) / 1000;
const num = (v, d = 0) => (v === "" || v === undefined || v === null || isNaN(Number(v)) ? d : Number(v));
const TAG = "11-03 강조 확산";
// 크기 상한 (11-03 사용자 「문은 왜 이렇게 커진 거야」 → 코디네이터 지시): 결과 캔버스 가로 ≤ 8칸 · 세로 ≤ 5.5칸 (PC 화면 12.8×7.2칸을 덮지 않게) — 조사표 k는 상한일 뿐
const CAP_W = 8, CAP_H = 5.5;
let SP = null;
// 지금 화면 배율 sc0 (빌더 lib.cjs place와 같은 식: 기본 배율 × art_scale × 역할 정규화 multOf × 배치표 배율 열)
function sc0Of(name, rowScale) {
  if (!SP) { const hm = require("../../../tools/build/handmade/lib.cjs"); const ctx = require("../../../tools/build/maps.cjs").context(); SP = { hm, ctx, table: hm.spriteTable(ctx), roles: require("../../../tools/build/handmade/roles.cjs") }; }
  const sp = SP.table[name]; if (!sp) throw new Error(`hero_rollout: 그림 '${name}' 표에 없음`);
  return { sp, sc: SP.hm.baseScale(sp, SP.ctx.propScale) * num(rowScale, 1) * SP.roles.multOf(name) };
}
const LOG = [];   // 적용표용 {name, kSurvey, k, sc0, sc, w, h}
let SETS = null;
const sets = () => { if (!SETS) { SETS = {}; for (const r of load("map_sets")) (SETS[r.set] = SETS[r.set] || []).push(r); } return SETS; };
const dist = (r, p) => Math.hypot(num(r.x) - p[0], num(r.y) - p[1]);
// 이름(또는 정규식)과 가장 가까운 줄 하나
function pick(rows, name, near, kind) {
  const m = rows.map((r, i) => [r, i]).filter(([r]) => (kind ? r.kind === kind : r.kind === "prop" || r.kind === "set") && (name instanceof RegExp ? name.test(r.name) : r.name === name));
  if (!m.length) throw new Error(`hero_rollout: '${name}' 줄 없음`);
  if (near) m.sort((a, b) => dist(a[0], near) - dist(b[0], near));
  return m[0][1];
}
const H = {
  // 키우기: o = { near, x, y, k(지금 배율 열 × k) | scale(절대), flip, args(hero=1 자동), note }
  hero(rows, name, o = {}) {
    const i = pick(rows, name, o.near, "prop"), r = Object.assign({}, rows[i]);
    if (o.swap) { r.name = o.swap; r.scale = o.swapScale === undefined ? "" : String(o.swapScale); }   // 같은 자리 다른 그림(조사표 대체안 · 반복 랜드마크 피하기)
    if (o.x !== undefined) r.x = String(o.x);
    if (o.y !== undefined) r.y = String(o.y);
    const { sp, sc: sc0 } = sc0Of(r.name, r.scale);
    let k = o.k || 1;
    if (o.scale !== undefined) k = num(o.scale) / num(r.scale, 1);
    const cap = Math.min((CAP_W * 100) / (num(sp.w) * sc0), (CAP_H * 100) / (num(sp.h) * sc0));
    const kUse = o.nocap ? k : Math.max(1, Math.min(k, Math.floor(cap * 100) / 100));
    r.scale = String(r3(num(r.scale, 1) * kUse));
    LOG.push({ map: o.map || "", name: r.name, kSurvey: o.k || r3(k), k: kUse, sc0: r3(sc0), sc: r3(sc0 * kUse), cw: r3((num(sp.w) * sc0 * kUse) / 100), ch: r3((num(sp.h) * sc0 * kUse) / 100) });
    o.note = `${o.note || ""} (조사 k ${o.k || r3(k)} → 상한 적용 k ${kUse} · sc ${r3(sc0)}→${r3(sc0 * kUse)})`;
    if (o.flip !== undefined) r.flip = o.flip ? "1" : "";
    if (o.args !== undefined) r.args = o.args;
    if (o.hero !== false && !/(^|;)hero=1/.test(r.args || "")) r.args = (r.args ? r.args + ";" : "") + "hero=1";
    r.note = `${r.note || ""} · ${TAG} ${o.note || ""}`.trim();
    rows[i] = r; return rows;
  },
  // 세트를 조각 줄로 편다 (세트 배율 열은 조각 배율에 곱한다) — 특징 조각만 키우거나 곁 조각을 빼려고
  explode(rows, setName, o = {}) {
    const i = pick(rows, setName, o.near, "set"), s = rows[i], pcs = sets()[setName];
    if (!pcs) throw new Error(`hero_rollout: 세트 '${setName}' 없음`);
    const mirror = num(s.flip) === 1 ? -1 : 1, x = num(s.x), y = num(s.y), sa = s.args || "";
    const out = pcs.map((pc) => {
      const decal = pc.piece.startsWith("d:"), name = decal ? pc.piece.slice(2) : pc.piece;
      const flip = (num(pc.flip) === 1) !== (mirror < 0);
      return { kind: decal ? "decal" : "prop", name, x: String(r3(x + num(pc.dx) * mirror)), y: String(r3(y + num(pc.dy))), scale: String(r3(num(pc.scale, 1) * num(s.scale, 1))), flip: flip ? "1" : "", tint: "", args: !decal && /foot=/.test(sa) && num(pc.back) === 1 ? sa.split(";").filter((t) => /^foot=/.test(t)).join(";") : "", note: `${s.note} · ${setName} 조각(세트 폄)` };
    });
    rows.splice(i, 1, ...out); return rows;
  },
  // 빼기: o = { keep: n(가까운/앞쪽 n개 남김), near, where(note 정규식), at: [[x,y],...](그 자리 줄만) }
  drop(rows, name, o = {}) {
    let idx = rows.map((r, i) => [r, i]).filter(([r]) => (r.kind === "prop" || r.kind === "decal" || r.kind === "set") && (name instanceof RegExp ? name.test(r.name) : r.name === name) && (!o.where || o.where.test(r.note || "")));
    if (o.at) idx = idx.filter(([r]) => o.at.some((p) => dist(r, p) < 0.3));
    if (o.near) idx.sort((a, b) => dist(a[0], o.near) - dist(b[0], o.near));
    const del = new Set((o.keep ? idx.slice(o.keep) : idx).map(([, i]) => i));
    if (!o.at && !o.keep && !del.size) throw new Error(`hero_rollout: 뺄 '${name}' 없음`);
    return rows.filter((_, i) => !del.has(i));
  },
  add(rows, row) { rows.push(Object.assign({ kind: "prop", scale: "", flip: "", tint: "", args: "" }, row, { x: String(row.x), y: String(row.y), scale: row.scale === undefined ? "" : String(row.scale), flip: row.flip ? "1" : "", note: `${row.note || ""} · ${TAG}`.trim() })); return rows; },
  move(rows, name, near, to) { const i = pick(rows, name, near); rows[i] = Object.assign({}, rows[i], { x: String(to[0]), y: String(to[1]) }); return rows; },
};

// ───────── 맵별 (carve: 벽 대신 자리의 설계도 벽 칸 → 구역 바닥 · ops: 줄 고치기) ─────────
const MAPS = {
  // 지하 납골당 1층: 납골 벽감 기둥 ×2.5 · 가운데 방 북벽에 붙은 자리 그대로(웨이포인트 (0,0.5)·촛대 열주가 방 가운데라 벽 대신으로) · 열린 관 7→4 · 촛대 6→4(특징 앞 줄)
  crypt1: { ops: (rows, h) => {
    h.hero(rows, "a1-landmark-ossuary-niche-pillar", { k: 2.5, args: "foot=0.67;wall=1", note: "가운데 방 북벽 대신" });
    rows = h.drop(rows, "a1-open-coffin", { keep: 4, near: [-12.45, 12.8] });
    rows = h.drop(rows, "crypt-candlestand", { at: [[3, 1.72], [6, 1.72]] });
    return rows;
  } },
  // 지하 납골당 2층: 뼈 탑 ×2 · 북서 막다른 방 끝(남쪽 구덩이 방 끝 벽) · 탑 양옆 해골 깃발 2 빼기(키운 탑 폭과 겹침) · 부러진 기둥 5→3 · 무너진 선반 6→3
  crypt2: { ops: (rows, h) => {
    h.hero(rows, "a1-bone-tower", { k: 2, args: "foot=0.67", note: "막다른 방 끝" });
    rows = h.drop(rows, "a1-skull-banner", { where: /a1_bone_shrine/ });
    rows = h.drop(rows, "execution-broken-column", { keep: 3, near: [2, -3.7] });
    rows = h.drop(rows, "cellar-broken-shelf", { keep: 3, near: [-7.42, 3.2] });
    return rows;
  } },
  // 지하 납골당 3층: 1층과 같은 납골 벽감 기둥이라 조사표 대체안 = 무너진 종탑(재고 a1-fallen-bell-tower) · 전당 북쪽 끝 벽 대신 · 촛대 열주 10→6(가운데 3쌍)
  crypt3: { ops: (rows, h) => {
    h.hero(rows, "a1-landmark-ossuary-niche-pillar", { swap: "a1-fallen-bell-tower", k: 2, args: "foot=0.67;wall=1", note: "전당 북쪽 끝 벽 대신(1층 납골 기둥과 겹치지 않게 종탑)" });
    rows = h.drop(rows, "crypt-candlestand", { at: [[8, 2.32], [8, -3.88], [20, 2.32], [20, -3.88]] });
    return rows;
  } },
  // 여왕의 무덤(보스방): 여왕 제단은 지금 크기 유지 · 2순위 = 여왕 옥좌 석관(재고) 서쪽 시녀들의 방 가운데(보스 아레나 x 2~28 · 여왕 (17.5,0.5)과 떨어진 곁방 — 의식·패턴 공간 밖)
  //   촛대 13→8(곁방 앞 2 · 아레나 남벽 9→6) · 피 깃발 열주 6→4
  queentomb: { ops: (rows, h) => {
    h.add(rows, { name: "queen-throne-sarcophagus", x: -13, y: -11.5, args: "", note: "시녀들의 방 · 대기실 가운데" });
    h.hero(rows, "queen-throne-sarcophagus", { near: [-13, -11.5], k: 1.8, args: "", note: "시녀들의 방 가운데(둘레를 돌아가게)" });
    rows = h.drop(rows, "crypt-candlestand", { at: [[-14, -13.7], [-11, -13.7], [2, -9.7], [5, -9.7], [26, -9.7]] });
    rows = h.drop(rows, "queen-blood-banner", { at: [[3, 2.06], [3, -3.54]] });
    return rows;
  } },
  // 굶주린 굴: 해골 탑 ×2를 북쪽 통로 어귀 벽 곁(4.5,4.4)에서 둥지 방 남서 자리(1.5,-5.2)로 — 둘레를 돌아가게(입구→출구 큰길 밖 · 가운데는 큰길이 지나 너비 2칸 밑) · 북쪽 통로 입구에 짐승 갈비 아치(재고) 문 규칙(door_tops · 열린 3칸)
  //   뼈 더미류(뼈 무더기·갉아먹힌 잔해·뼈 더미) 각 1개만
  hollow: { ops: (rows, h) => {
    h.hero(rows, "pit-skull-tower", { x: 1.5, y: -5.2, k: 2, args: "foot=0.67", note: "둥지 방 남서로 옮김(큰길 밖)" });
    h.add(rows, { name: "a1-landmark-beast-rib-arch", x: 3.5, y: 7.1, args: "ok=cliff", note: "북쪽 통로 입구 아치" });
    h.hero(rows, "a1-landmark-beast-rib-arch", { k: 3, args: "ok=cliff", note: "북쪽 통로 입구(문 규칙)" });
    for (const n of ["hollow-bone-pile", "hollow-gnawed-remains", "mp-bone-pile", "pit-bone-heap"]) rows = h.drop(rows, n, { keep: 1 });
    return rows;
  } },
  // 가라앉은 지하실 1층: 무너진 술통 선반(세트 a1_lm_barrel_shelf) — 술 창고 가운데(-12.5,10.9)에서 북벽으로 올리고 북벽 두 줄(x -14~-11 · y 15~16)을 파서 선반이 벽 대신 막는다
  //   세트 술통 곁 조각은 같이 옮김 · 밧줄 더미·깨진 단지·썩은 통나무 빼기
  cellar1: { carve: [{ r: [-14, 15, -11, 16], z: "b" }], ops: (rows, h) => {
    h.move(rows, "a1_lm_barrel_shelf", [-12.5, 10.3], [-12.5, 11.6]);
    rows = h.explode(rows, "a1_lm_barrel_shelf");
    h.hero(rows, "a1-landmark-collapsed-barrel-shelf", { k: 2.5, args: "foot=0.67;wall=1", note: "북벽 대신(벽 두 줄 팜)" });
    for (const n of ["a1-adjunct-rope-pile", "a1-adjunct-collapsed-urn", "marsh-rotten-log"]) rows = h.drop(rows, n);
    return rows;
  } },
  // 가라앉은 지하실 2층: 무너진 술통 선반 — 저장고 북벽 자리 그대로 키우고 뒤 벽 두 줄(x -16~-12 · y 13~14)을 파서 선반이 벽 대신 · 해골 깃발 6→3 · 촛대 4→2
  cellar2: { carve: [{ r: [-16, 13, -12, 14], z: "b" }], ops: (rows, h) => {
    h.hero(rows, "a1-landmark-collapsed-barrel-shelf", { k: 2.5, args: "foot=0.67;wall=1", note: "북벽 대신(벽 두 줄 팜)" });
    rows = h.drop(rows, "a1-skull-banner", { keep: 3, near: [12, 9] });
    rows = h.drop(rows, "crypt-candlestand", { at: [[14, 2.02], [14, -3.58]] });
    return rows;
  } },
  // 뼈 구덩이 1층: 뼈 도르래 기중기(세트 a1_lm_pulley_crane) — 매복 골짜기 북쪽 끝에서 방 가운데(11.5,7.6)로 내려 둘레를 돌아가게 · 막힘 3/4(-top 171/512 자르는 선이 막힘 꼭대기 아래)
  pit1: { ops: (rows, h) => {
    h.move(rows, "a1_lm_pulley_crane", [11.5, 10.3], [11.5, 7.0]);
    rows = h.explode(rows, "a1_lm_pulley_crane");
    h.hero(rows, "a1-landmark-bone-pulley-crane", { k: 3, args: "foot=0.75", note: "매복 골짜기 가운데(둘레를 돌아가게)" });
    rows = h.drop(rows, "a1-adjunct-bone-cart");   // 옮긴 기중기와 사이에 1칸 벽감이 생겨 뺌
    rows = h.drop(rows, "a1-skull-banner", { where: /a1_bone_shrine/ });
    return rows;
  } },
  // 뼈 구덩이 2층: 1층과 같은 기중기는 지금 크기 그대로(조사표 「2순위를 1순위로」) · 서쪽 굴 입구에 짐승 갈비 아치(재고 · 문 규칙 · 열린 3칸)
  pit2: { ops: (rows, h) => {
    h.add(rows, { name: "a1-landmark-beast-rib-arch", x: -18.5, y: 3.2, flip: 1, args: "ok=cliff", note: "서쪽 굴 입구 아치" });
    h.hero(rows, "a1-landmark-beast-rib-arch", { k: 3, args: "ok=cliff", note: "서쪽 굴 입구(문 규칙 · 반전)" });
    rows = h.drop(rows, "waste-skull-pile", { keep: 1 });
    return rows;
  } },
  // 목매단 동굴: 매달린 시체 기둥(세트 a1_lm_corpse_pillar) — 종유석 굴 가운데로 조금 내려(-8.5,-8.4) 둘레를 돌아가게 · 종유석·수의·뼈 더미 각 1개만
  cave: { ops: (rows, h) => {
    h.move(rows, "a1_lm_corpse_pillar", [-8.5, -6.7], [-8.5, -9.0]);
    rows = h.explode(rows, "a1_lm_corpse_pillar");
    h.hero(rows, "a1-landmark-hanging-corpse-pillar", { k: 3, args: "foot=0.75", note: "종유석 굴 가운데(둘레를 돌아가게)" });
    for (const n of ["cave-stalactite", "cave-burial-shroud", "mp-bone-pile"]) rows = h.drop(rows, n, { keep: 1 });
    return rows;
  } },
  // 무너진 형장: 처형대 ×1.4 · 처형 광장 자리 그대로(광장 가운데) · 처형대 폭과 겹치는 곁 조각(형틀·해골 깃발 2·방패·해골 더미) 빼기 · 뼈 무더기·말뚝 빼기
  execution: { ops: (rows, h) => {
    h.hero(rows, "execution-platform", { k: 1.4, args: "foot=0.67", note: "처형 광장 가운데" });
    rows = h.drop(rows, /^(execution-pillory|a1-skull-banner|a1-abandoned-shields|waste-skull-pile)$/, { where: /a1_execution_square/ });
    rows = h.drop(rows, "pit-bone-heap");
    rows = h.drop(rows, "mp-stake-spikes");
    return rows;
  } },
  // 교수대 숲: 거대한 교수목(세트 a1_lm_gallows_tree) ×3 · 까마귀 숲길 광장 가운데 · 특징 4→2(형장과 겹치는 처형대 · 뼈 탑 빼기 · 까마귀 울타리·말뚝 빼기)
  //   §4 입구: 처형대 곁 사슬 기둥 한 쌍을 목매단 동굴 입구(17.5,-18.35) 양옆으로 옮겨 ×1.5 반전 쌍
  gallows: { ops: (rows, h) => {
    rows = h.explode(rows, "a1_lm_gallows_tree");
    h.hero(rows, "a1-landmark-gallows-tree", { y: -10.4, k: 3, args: "foot=0.75", note: "까마귀 숲길 가운데(큰길 띠 남쪽으로 2칸 내림)" });
    rows = h.drop(rows, "execution-platform");
    rows = h.drop(rows, "a1-bone-tower");
    rows = h.drop(rows, /^(a1-crow-fence|mp-stake-spikes)$/);
    rows = h.drop(rows, "waste-skull-pile", { at: [[13.7, 0.7], [13.9, -3.7]] });
    h.hero(rows, "execution-chain-pillar", { near: [17.1, 1.3], x: 14.4, y: -18.2, flip: 0, k: 1.5, args: "foot=0.5", note: "목매단 동굴 입구 왼쪽" });
    h.hero(rows, "execution-chain-pillar", { near: [17.1, -3.9], x: 20.6, y: -18.2, flip: 1, k: 1.5, args: "foot=0.5;padr=1", note: "목매단 동굴 입구 오른쪽(반전)" });
    return rows;
  } },
  // ── 액트 2 ──
  // 뜨거운 모래 언덕: 짐승 두개골(세트 a2_beast_grave) ×1.8 · 짐승 무덤 광장 가운데 · 마른 오아시스 터 야자 2 빼기 · 창 해골 울타리 빼기 · 동쪽 바람길 세트 곁 조각 하나 빼기
  dunes: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_beast_grave");
    h.hero(rows, "a2-giant-beast-skull", { k: 1.8, args: "foot=0.67;wall=1", note: "짐승 무덤 광장 가운데" });
    rows = h.explode(rows, "a2_oasis_ruin");
    rows = h.drop(rows, "palm", { where: /a2_oasis_ruin/ });
    rows = h.drop(rows, "a2-spear-skull-fence");
    rows = h.drop(rows, "a2-adjunct-broken-waterjug", { keep: 0 });
    return rows;
  } },
  // 메마른 협곡: 마른 물레방아 ×3 · 갈라진 바위턱 광장 가운데 · 거상 머리 세트 빼기(3맵 중복 → 샘플 kingtomb1만) · 우물 빼기
  canyon: { ops: (rows, h) => {
    h.hero(rows, "a2-landmark-dry-waterwheel", { k: 3, args: "foot=0.67;wall=1", note: "갈라진 바위턱 가운데" });
    rows = h.drop(rows, "a2_colossus");
    rows = h.drop(rows, "well");
    rows = h.explode(rows, "a2_rib_pass");   // §4 갈비뼈 고개 아치 ×1.5 반전 · 문 규칙(door_tops · 열린 3칸) · 양옆 바위 그대로
    h.hero(rows, "a2-rib-arch", { flip: 1, k: 1.5, args: "", note: "서쪽 협곡 통로 입구 아치(반전 · 문 규칙)" });
    return rows;
  } },
  // 바람 무덤 사막: 바람 무덤 기둥(세트 a2_lm_wind_tomb) ×3 · 남쪽 무덤 광장 가운데 · §4 무덤 문 ×1.5(무덤 입구) · 무너진 집(액트 1 그림) 빼기 · 사막 바위 2·뼈 빼기
  stormwaste: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_lm_wind_tomb");
    h.hero(rows, "a2-landmark-wind-tomb-pillar", { k: 3, args: "foot=0.75", note: "무덤 광장 가운데" });
    h.hero(rows, "tomb-door", { k: 1.5, hero: false, args: "padl=2;wall=1", note: "무덤 입구 문(북벽 밀착 · 뒤 칸 없음이라 -top 없이)" });
    rows = h.drop(rows, "mp-house-ruin");
    rows = h.drop(rows, "desert-rock");
    rows = h.drop(rows, "desert-bones");
    return rows;
  } },
  // 가라앉은 대로: 거상 머리는 샘플(왕들의 묘실 1층)에만 → 여기서 뺀다 · §4 가라앉은 개선문 ×2.5 동쪽 출구 · 부러진 기둥 4→2 · 쓰러진 오벨리스크 빼기
  sunkenroad: { ops: (rows, h) => {
    rows = h.drop(rows, "a2-crowned-colossus-head");
    h.hero(rows, "a2-landmark-sunken-triumph-arch", { k: 2.5, args: "foot=0.67;wall=1", note: "동쪽 출구 성벽 앞" });
    rows = h.drop(rows, "broken-column", { keep: 2, near: [15.9, 2.9] });
    rows = h.drop(rows, "a2-fallen-obelisk");
    return rows;
  } },
  // 전갈 굴 1층: 독 웅덩이 바위(세트 a2_lm_venom_pool) ×3 · 껍질 광장 가운데 · 게 껍질 더미(액트 3 그림)·붕대 빼기
  scorpnest1: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_lm_venom_pool");
    h.hero(rows, "a2-landmark-venom-pool-rock", { k: 3, args: "foot=0.67;wall=1", note: "껍질 광장 가운데" });
    rows = h.drop(rows, "a3-crab-shell-pile");
    rows = h.drop(rows, "a2-adjunct-bandage-bundle");
    rows = h.explode(rows, "a2_rib_pass");   // §4 매복 굴 아치 ×1.5 반전 · 문 규칙
    h.hero(rows, "a2-rib-arch", { flip: 1, k: 1.5, args: "", note: "동쪽 굴 통로 입구 아치(반전 · 문 규칙)" });
    return rows;
  } },
  // 전갈 굴 2층: 전갈 알 둥지 ×2.5 · 서쪽 막다른 방 끝 · 게 껍질 더미 2(액트 3 그림)·붕대 빼기
  scorpnest2: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_lm_egg_nest");
    h.hero(rows, "a2-landmark-scorpion-egg-nest", { k: 2.5, args: "foot=0.5;wall=1", note: "막다른 방 끝" });
    rows = h.drop(rows, "a3-crab-shell-pile");
    rows = h.drop(rows, "a2-adjunct-bandage-bundle");
    return rows;
  } },
  // 버려진 우물: 마른 우물 도르래(세트 a2_lm_well_pulley) ×3 · 동쪽 방 광장 가운데 · 낱개로 흩은 태양 원반 판·향로 받침·가면 조각(a2_tomb_offering 조각) 빼기
  drywell: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_lm_well_pulley");
    h.hero(rows, "a2-landmark-dry-well-pulley", { k: 3, args: "foot=0.67;wall=1", note: "물웅덩이 터 가운데" });
    rows = h.drop(rows, /^a2-adjunct-(censer-base|sun-disc-plaque|golden-mask-fragments)$/, { where: /a2_tomb_offering/ });
    return rows;
  } },
  // 왕들의 묘실 2층: 수호왕 석관 ×2.5 · 동쪽 열주 방 · §4 무덤 문 ×1.5(동쪽 방 입구) · 바람 비석 4→2
  kingtomb2: { ops: (rows, h) => {
    rows = h.explode(rows, "a2_lm_king_sarcophagus");
    h.hero(rows, "a2-landmark-guardian-king-sarcophagus", { k: 2.5, args: "foot=0.75", note: "열주 방 끝" });
    h.hero(rows, "tomb-door", { k: 1.5, args: "", note: "동쪽 방 입구 문" });
    rows = h.drop(rows, "wind-stele", { keep: 2, near: [13.5, -9.7] });
    return rows;
  } },
  // 잊힌 서고: 불탄 책장 탑 ×2.5 · 동쪽 홀 북벽 대신(벽 두 줄 팜) · 책장 27→15 · 사서 책상 2→1 · 거미줄 3 빼기
  archive: { carve: [{ r: [19, 11, 22, 12], z: "f" }], ops: (rows, h) => {
    h.hero(rows, "a2-landmark-burning-bookshelf-tower", { k: 2.5, args: "foot=0.67;wall=1", note: "동쪽 홀 북벽 대신(벽 두 줄 팜)" });
    rows = h.drop(rows, "bookshelf", { at: [[-17.4, 2.2], [-15.8, 2.2], [-14.2, 2.2], [-12.6, 2.2], [-14.6, -3.8], [-13, -3.8], [-11.4, -3.8], [2.8, -11.8], [4.4, -11.8], [6, -11.8], [-1.7, -7.8], [-5, 15.2]] });   // 줄 단위로(평행 두 줄은 짝째 · 낱개로 빼면 산발)
    rows = h.drop(rows, "keeper-desk", { at: [[-3.1, -12.3]] });
    rows = h.drop(rows, /^mp-cobweb(-b)?$/);
    return rows;
  } },
  // 독사의 둥지: 똬리 튼 뱀 기둥 ×3 · 가운데 굴 광장 · 허물·사암 조각·붕대 각 1개만
  vipernest: { ops: (rows, h) => {
    h.hero(rows, "a2-landmark-coiled-serpent-column", { k: 3, args: "foot=0.75", note: "둥지 굴 가운데" });
    for (const n of ["a2-adjunct-snake-shed", "a2-adjunct-sandstone-fragments", "a2-adjunct-bandage-bundle"]) rows = h.drop(rows, n, { keep: 1 });
    return rows;
  } },
  // 잊힌 사원 1층: 향로 계단 ×2 · 기둥 회랑 북벽 대신(이미 벽 밀착) · 책장 7→4 · 부러진 기둥 3·사막 뼈 2 빼기
  temple1: { ops: (rows, h) => {
    h.hero(rows, "a2-landmark-temple-stair-censer", { k: 2, args: "wall=1", note: "기둥 회랑 북벽 대신" });
    rows = h.drop(rows, "bookshelf", { keep: 4, near: [18.8, 13.2] });
    rows = h.drop(rows, "broken-column");
    rows = h.drop(rows, "desert-bones");
    h.add(rows, { name: "a2-temple-gate-arch", x: 0.5, y: -7.6, flip: 1, args: "ok=cliff", note: "서고 계단 앞 통로 입구 문(재고)" });
    h.hero(rows, "a2-temple-gate-arch", { k: 2, args: "ok=cliff", note: "서고 계단 앞 통로 입구(반전 · 문 규칙)" });
    return rows;
  } },
  // 잊힌 사원 2층: 사자 쌍둥이 계단 문 ×2 · 문지기 전당 북벽 대신(벽 두 줄 팜) · 바람 비석 2 빼기 · 흩은 향로 받침 빼기
  temple2: { carve: [{ r: [13, 11, 16, 12], z: "e" }], ops: (rows, h) => {
    h.hero(rows, "a2-landmark-lion-twin-stair-gate", { k: 2, args: "foot=0.67;wall=1", note: "문지기 전당 북벽 대신(벽 두 줄 팜)" });
    rows = h.drop(rows, "wind-stele");
    rows = h.drop(rows, "a2-adjunct-censer-base");
    h.add(rows, { name: "a2-temple-gate-arch", x: -25, y: -3.2, args: "ok=cliff", note: "서쪽 고리 통로 입구 문(재고)" });
    h.hero(rows, "a2-temple-gate-arch", { k: 2, args: "ok=cliff", note: "서쪽 고리 통로 입구(문 규칙)" });
    return rows;
  } },
  // 잊힌 사원 3층: 노래하는 모래 제단 ×2.5 · 태양 제단실 북벽 대신(벽 홈 팜) · 책장 8→4
  temple3: { carve: [{ r: [1, 7, 5, 8], z: "d" }], ops: (rows, h) => {
    h.hero(rows, "a2-landmark-singing-sand-altar", { k: 2.5, args: "foot=0.67;wall=1", note: "태양 제단실 북벽 대신(벽 홈 팜)" });
    rows = h.drop(rows, "bookshelf", { keep: 4, near: [17.6, 15.2] });
    return rows;
  } },
  // 대사제의 성소(보스방 · 대사제 (20.5,1.5)): 태양 원반 제단은 이미 배율 1.33(캔버스 5.5칸 상한)이라 지금 크기 유지 · 2순위 없음 —
  //   다른 맵 랜드마크 중복 중 불탄 책장 탑(= 서고) 빼기 · 바람 비석 9→6 · 향로 받침 8→4 (의식·패턴 공간은 그대로)
  sanctum: { ops: (rows, h) => {
    rows = h.drop(rows, "a2-landmark-burning-bookshelf-tower");   // 향로 계단은 남김: 순례자의 방 남서 모서리 막다른 줄(fill)을 메우고 있어 빼면 폭 1칸 막다른 줄 4칸이 생김
    rows = h.drop(rows, "wind-stele", { keep: 6, near: [11, 9] });
    rows = h.drop(rows, "a2-adjunct-censer-base", { keep: 4, near: [9.5, -8.7], where: /벽 따라 열/ });
    return rows;
  } },

};

function install(specs) {
  for (const [id, m] of Object.entries(MAPS)) {
    const s = specs[id];
    if (!s) continue;
    const prev = s.postRows;
    Object.assign(s, {
      carve: (s.carve || []).concat(m.carve || []),
      extra: m.extra ? Object.assign({}, s.extra, m.extra) : s.extra,
      postRows: (rows) => m.ops((prev ? prev(rows) : rows).map((r) => Object.assign({}, r)), H),
    });
  }
  return specs;
}
module.exports = { install, H, MAPS, LOG, sc0Of };
