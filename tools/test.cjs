#!/usr/bin/env node
// 오프라인 테스트 묶음 (메이커 없이, 커밋 전에 돌린다). 하나라도 실패하면 종료 코드 1.
//   1. 생성 데이터가 CSV와 같은가        (gen_data --check)
//   2. 데이터 표 무결성                    (check_data)
//   3. 스크립트 교차 참조·ExecSpace        (check_scripts)
//   4. 모델·맵 참조                        (check_assets)
//   4-1. 소환수 움직임 불변식               (check_motion, docs/motion-sync.md)
//   4-2. 창이 HUD에 가려지지 않는가        (check_ui_layers — UI 그룹 순서·화면 좌표)
//   4-3. 모바일 HUD 배치                   (check_mobile_layout — 화면 비율 4종에서 겹침·화면 밖, docs/ui/mobile-layout.md)
//   4-4. 공통 UI 규격                      (check_ui_tokens — tools/build/ui-tokens.cjs ↔ UIKit 대화 상자 규격)
//   4-5. 말투·용어                         (check_voice — docs/design/32-voice-guide.md)
//   4-5-1. 알림 채널 배정                  (notice_channels --check — 10-31 B-4 · 부르는 곳 전수 = 표 · 누락 0)
//   4-6. 기획서 38 결정 26개 대조           (check_decisions38 — 값이 부록 E 결정대로인가)
//   4-7. 기획서 46 거인 끝 레벨             (sim_balance --giant-check — 악몽·지옥 +20%까지 41·68·90 그대로)
//   5. 검사기 자가 테스트                  (tests/fixtures: 일부러 틀린 코드의 "-- EXPECT" 줄을 정확히 잡는가)
//   6. --build: 빌드를 두 번 돌려 결과가 같은가 (멱등성, 파일을 다시 쓴다)
// 사용: node tools/test.cjs [--build]
// 메이커 안 런타임 검사는 RootDesk/MyDesk/Test/SelfTest.mlua (플레이 시작 시 "[SelfTest] 통과 n / 실패 m")
"use strict";
const { spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const node = (script, args = []) => spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: ROOT, encoding: "utf8" });
const results = [];

function step(name, fn) {
  let ok = false;
  let detail = "";
  try { [ok, detail] = fn(); } catch (e) { detail = e.stack || String(e); }
  results.push({ name, ok });
  console.log(`${ok ? "통과" : "실패"}  ${name}${detail ? "\n" + detail.trimEnd().split("\n").map((l) => "      " + l).join("\n") : ""}`);
}

function tool(script, args) {
  const r = node(script, args);
  const out = (r.stdout + r.stderr).trim();
  const last = out.split("\n").pop();
  return [r.status === 0, r.status === 0 ? last : out];
}

step("CSV 파서 회귀 검사", () => tool("test_csv.cjs"));
step("생성 데이터 최신", () => tool("gen_data.cjs", ["--check"]));
step("데이터 무결성", () => tool("check_data.cjs"));
step("스크립트 참조", () => tool("check_scripts.cjs"));
step("모델·맵 참조", () => tool("check_assets.cjs"));
step("움직임 불변식", () => tool("check_motion.cjs"));
step("창 가림 검사", () => tool("check_ui_layers.cjs"));
step("모바일 HUD 배치", () => tool("check_mobile_layout.cjs"));
step("공통 UI 규격", () => tool("check_ui_tokens.cjs"));
step("말투·용어", () => tool("check_voice.cjs"));
step("알림 채널 배정", () => tool("notice_channels.cjs", ["--check"]));   // 10-31 B-4: 화면 알림 부르는 곳 전수가 채널 표(docs/evidence/2026-10-31-playfeedback-B/notice-channels.md)와 같은가 · 줍기·보스가 B로 새지 않는가
step("기획서 38 결정 26개", () => tool("check_decisions38.cjs"));
step("DPS 집계 도구", () => tool("dps/selftest.cjs"));   // I05 개발용 전투 계측 로그 집계 (tools/dps)
step("거인 그림 등록 대기표", () => tool("register_giant_visuals.cjs", ["check"]));
step("거인 그림 검증표 자체 테스트", () => tool("register_giant_visuals.cjs", ["selftest"]));   // 48 V2 (10-30): 구 납품 통과 · 새 범위(몸 12~16 · 효과 12~16) 통과 · 장 수·중복 장·타격 칸·반복·지속 위반 검출 · 지금 monster_frames 통과   // 10-30 갈래 E: 5종 몸 150 + HUD 5 (코덱스 0200 · 마법사 그림은 대기 지원만 — 5단계 자연 선택은 해골 전용 그대로) · 동작·장 수·타이밍·피벗 (RUID는 업로드 뒤)

step("거인 끝 레벨 (46-7)", () => {   // 기획서 46 부록 A-3: 악몽·지옥 빌드 +0·+8·+13.5·+20%에서 끝 레벨 41·68·90 그대로 (경험치 경로 모델 · 재미 증명 아님)
  const r = spawnSync("python3", [path.join(__dirname, "sim_balance.py"), "--giant-check"], { cwd: ROOT, encoding: "utf8" });
  if (r.error) return [false, "python3 없음 — " + r.error.message];
  const out = (r.stdout + r.stderr).trim();
  return [r.status === 0, r.status === 0 ? out.split("\n").pop() : out];
});

step("검사기 자가 테스트", () => {
  const fixture = path.join(ROOT, "tests/fixtures/bad_scripts");
  const r = node("check_scripts.cjs", ["--root", fixture]);
  const found = new Set();
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/^(\S+\.mlua):(\d+)\s/);
    if (m) found.add(`${m[1]}:${m[2]}`);
  }
  const expected = new Set();
  for (const f of require("./lib/mlua.cjs").walk(path.join(fixture, "RootDesk/MyDesk"), ".mlua", [])) {
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/--\s*EXPECT\b/.test(l) && i > 0) expected.add(`${path.relative(fixture, f)}:${i + 1}`);
    });
  }
  const missed = [...expected].filter((x) => !found.has(x));
  const extra = [...found].filter((x) => !expected.has(x));
  const ok = missed.length === 0 && extra.length === 0 && expected.size > 0;
  return [ok, ok ? `기대 ${expected.size}건 모두 검출, 오탐 0` : `놓침 ${missed.join(" ")} / 오탐 ${extra.join(" ")}`];
});

if (process.argv.includes("--build")) {
  step("빌드 멱등성", () => {
    const dirs = ["map", "ui", "Global", "RootDesk/MyDesk/Models", "RootDesk/MyDesk/Data"];
    const hash = () => {
      const h = crypto.createHash("sha1");
      const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (!p.endsWith(".directory")) h.update(p).update(fs.readFileSync(p));
        }
      };
      for (const d of dirs) walk(path.join(ROOT, d));
      return h.digest("hex");
    };
    const b1 = node("build.cjs");
    if (b1.status !== 0) return [false, b1.stdout + b1.stderr];
    const first = hash();
    const b2 = node("build.cjs");
    if (b2.status !== 0) return [false, b2.stdout + b2.stderr];
    return [first === hash(), first === hash() ? "두 번째 빌드 결과가 첫 번째와 같다" : "두 번째 빌드에서 파일이 바뀌었다"];
  });
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n[test] ${results.length - failed}/${results.length} 통과`);
process.exitCode = failed ? 1 : 0;
