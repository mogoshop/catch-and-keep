#!/usr/bin/env node
// 소환수 움직임 불변식 검사 (docs/motion-sync.md 「하지 말 것」을 코드에서 확인).
// 2026-10-10 하루 8차례 QA로 잡은 끊김·껌뻑임·그림자 문제가 되돌아가지 않게, 핵심 구현이 남아 있는지 본다.
// 사용: node tools/check_motion.cjs  (npm test 에 포함)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const MS = "RootDesk/MyDesk/World/MotionSmoother.mlua";
const SU = "RootDesk/MyDesk/Shadow/ShadowUnit.mlua";
const UT = "RootDesk/MyDesk/Common/Util.mlua";

// [파일, 있어야 할 패턴(정규식), 없으면 생기는 문제]
const must = [
  [MS, /property boolean UseProxy = true/, "대역 그리기가 꺼져 있다 → 서버가 루트 위치를 덮어써 앞뒤로 껌뻑인다"],
  [MS, /property boolean LocalFollow = true/, "내 소환수 직접 따라가기가 꺼져 있다 → 걸을 때 띄엄띄엄 오는 서버 위치로만 그린다"],
  [MS, /SpawnByModelId\("artsprite", "MSVis", [^\n]*self\.Map\)/, "대역(MSVis)을 맵 아래가 아닌 곳에 만든다 → 서버 루트에 끌려가 껌뻑인다"],
  [MS, /vis\.SpriteRendererComponent\.SpriteRUID = src\.SpriteRUID/, "대역 생성 직후 그림을 넣지 않는다 → artsprite 기본 모래 바닥·로딩 원이 보인다"],
  [MS, /bar\.SpriteRendererComponent\.Enable = false/, "체력 막대 대역의 스프라이트가 켜져 있다 → 모래 네모가 따라다닌다"],
  [MS, /body\.EnableShadow = false/, "몸체 그림자를 끄지 않는다 → 그림자가 서버 위치에 붙어 따로 논다"],
  [MS, /src\.Enable = false/, "루트 몸 그림을 끄지 않는다 → 서버 위치의 몸과 대역이 겹쳐 두 개로 보인다"],
  [MS, /local of = unit\.OwnerFacing/, "대형 방향을 서버 값(OwnerFacing)이 아닌 클라이언트 추측으로 쓴다 → 주인 위에 뭉친다"],
  [MS, /r\.visSignWant = want/, "좌우를 대역 값으로 정하지 않는다 (루트 Scale을 쓰면 서버가 바꿀 때마다 뒤집힌다)"],
  [MS, /method any OwnerState\(Entity owner, number delta\)/, "주인별 화면 위치·속도 추적이 빠졌다 → 파티원 소환수가 직접 따라가기를 못 한다"],
  [MS, /r\.flipT < 0\.15/, "좌우 뒤집기 유지 시간(0.15초)이 빠졌다 → 좌우가 깜빡인다"],
  [SU, /@Sync\s+property Vector2 OwnerFacing/, "OwnerFacing 동기화가 빠졌다 → 클라이언트 대형 방향이 서버와 어긋난다"],
  [SU, /@Sync\s+property integer FormationIndex/, "FormationIndex 동기화가 빠졌다 → 클라이언트가 대형 자리를 계산 못 한다"],
  [SU, /@Sync\s+property Vector2 FormationOffset/, "FormationOffset 동기화가 빠졌다"],
  [SU, /@Sync\s+property number BaseSpeed/, "BaseSpeed 동기화가 빠졌다 → 클라이언트 걸음 빠르기가 틀어진다"],
  [SU, /@Sync\s+property Vector2 Wander/, "Wander 동기화가 빠졌다 → 대형 자리가 서버와 어긋난다"],
  [SU, /property number TickInterval = 0\.05/, "소환수 판단 주기(20Hz)가 바뀌었다 → 서버 멈춤 재발 위험"],
  [SU, /self\.OwnerVel > 0\.3 and self\.OwnerVelDir:Magnitude\(\) > 0\.5 then face = self\.OwnerVelDir/, "대형 방향을 실제 걷는 방향으로만 정하지 않는다 → 멈출 때 180° 돈다"],
  [SU, /face:Dot\(self\.OwnerFacing\) < 0\.99/, "OwnerFacing을 8°↑ 바뀔 때만 쓰지 않는다 → 동기화 값이 매 판단마다 나간다"],
  [SU, /property number PaceMax = /, "주인 속도 따라잡기 상한(PaceMax)이 빠졌다 → 걸을 때 전사가 앞으로 못 나간다"],
  [SU, /method Vector2 PassOwner\(/, "주인 몸 비켜 돌기(PassOwner)가 빠졌다"],
  [SU, /method Entity BarEntity\(\)/, "체력 막대를 대역 막대(HpBarAlt)에 그리는 경로가 빠졌다"],
  [UT, /method table ListOf\(Entity map, string typeName\)/, "맵 목록 캐시(Util:ListOf)가 빠졌다 → 소환수가 맵 전체를 매번 뒤져 서버가 멈춘다"],
];

// [파일, 없어야 할 패턴, 생기면 생기는 문제]
const mustNot = [
  [MS, /SpawnByModelId\("artsprite", "MSVis", [^\n]*,\s*e\)/, "대역을 서버 개체(루트)의 자식으로 만든다 → 서버 갱신마다 끌려가 껌뻑인다"],
  [MS, /unit\.OwnerPlayer ~= me then return end/, "직접 따라가기를 내 소환수로만 제한한다 → 파티원 소환수가 다시 띄엄띄엄 그려진다"],
  [MS, /SpriteRUID = ""/, "artsprite 그림을 \"\"로 비운다 → 지워지지 않고 기본 모래 바닥이 보인다"],
  [SU, /moved:Magnitude\(\) > 0\.015/, "평활한 주인 위치 이동량으로 대형 방향을 정한다 → 멈출 때 180° 돈다"],
];

let bad = 0;
for (const [file, re, why] of must) {
  if (!re.test(read(file))) { console.log(`${file}  없음: ${re}  → ${why}`); bad++; }
}
for (const [file, re, why] of mustNot) {
  if (re.test(read(file))) { console.log(`${file}  금지 패턴: ${re}  → ${why}`); bad++; }
}
if (bad > 0) {
  console.log(`[check_motion] 문제 ${bad}건 — docs/motion-sync.md 「하지 말 것」 참고`);
  process.exit(1);
}
console.log(`[check_motion] 불변식 ${must.length + mustNot.length}개 모두 통과 (docs/motion-sync.md)`);
