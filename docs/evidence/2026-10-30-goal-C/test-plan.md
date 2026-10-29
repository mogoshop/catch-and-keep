# I05 실전 계측 시험 계획 (goal C · 2026-10-30)

> 상태: **계획·자동 수집 준비 완료, Maker 실행·실제 빌드 비교 미실시.** 이 문서와 스크립트는 메이커 담당이 순서대로 붙여 넣기만 하면 되게 만든 것이다. 결과로 빌드 우열을 정하는 일은 반복·실패·조건을 갖춘 집계 뒤 사람이 한다. 임의 승자·목표 DPS 배수를 미리 정하지 않는다.

## 1. 무엇을 재나

| 열 | 출처 | 뜻 |
|---|---|---|
| 설명 1타 | 오프라인 계산기 `parallel-analysis/combat/results/comparison.csv` | 실제 효과 함수로 계산한 한 투사체 피해 (HP 적용 전). 실측 아님 |
| 가정 상한 | 같은 계산기 | 1타 × 발수 ÷ 재사용. 적중 수·가동률·이동은 모름. 소환 빌드는 미계산 |
| 실측 총구간 DPS | 서버 HP 원장 `[DPS] window` | 유효 피해 ÷ DpsStart 이후 구간 (군단 소환 준비 포함; 앞선 빌드 세팅·맵 이동 제외) |
| 실측 전투 구간 DPS | 원장 `[DPS] ev\|` | 유효 피해 ÷ 전투 시간 (유효 피해 사이 간격 3초 이하만, 구간마다 중앙 타격 간격 하나를 더해 울타리 보정) |
| TTK | `[DPS] life` | 시도 안 첫 유효 타격 → 사망. 안 죽은 대상은 censored로 따로 센다 |
| 피격·사망 | `[DPS] owner` deaths · hits_taken(패치 전 unsupported) · hp_drop_sampled | 사망은 기존 PlayerDied, 피격 수는 MonsterAttack 패치 뒤 |
| 마나·혼 | mana_spent(SkillCast 패치 뒤) · mana_drop/rise_sampled · soul_raise · soul_extract · soul_other | 표본 값은 0.25초 사이 상쇄를 못 본다 |
| 군단 손실·복구 | legion_max · legion_loss · wipes · recover | 손실 이유는 SummonLost 패치 뒤 |

유효 피해 = min(max(0, 적용 전 HP), max(0, 적용 전 − 적용 후)) · 흡수(보호막)와 과잉 피해는 따로. 회복·인원 보정·리셋·원장 밖 HP 변화는 피해가 아닌 별도 사건이다.

## 2. 같은 투자·장비 예산의 세 빌드 (fixtures.json 그대로)

레벨마다 스킬 포인트 = 레벨, 능력치 합 = 5×(레벨−1) 추가, 장비 원문이 정확히 같다 (지팡이 + 「망자를 부르는 등불」 minion=20). 퀘스트 추가 포인트·선택 보상·세트·룬워드 없음, 보통 난이도.

| 레벨 | 빌드 | 힘/민/체/정 | 투자 | 슬롯 |
|---|---|---|---|---|
| 5 | summon | 35/25/15/25 | raise_skeleton 3 · skel_legion 1 · skeleton_mastery 1 | raise_skeleton |
| 5 | magic | 15/25/15/45 | bone_shard 3 · shard_bounce 1 · bone_armor 1 | bone_shard, bone_armor |
| 5 | curse_mix | 25/25/15/35 | mark_weakness 2 · bone_shard 2 · raise_skeleton 1 | mark_weakness, bone_shard, raise_skeleton |
| 15 | summon | 85/25/15/25 | raise_skeleton 6 · skeleton_mastery 3 · skel_legion 2 · raise_mage 2 · mage_legion 1 · bone_shard 1 | raise_skeleton, raise_mage, bone_shard |
| 15 | magic | 15/25/15/95 | bone_shard 8 · shard_bounce 2 · shard_multi 3 · bone_armor 2 | bone_shard, bone_armor |
| 15 | curse_mix | 50/25/15/60 | mark_weakness 5 · curse_power 1 · curse_duration 2 · hex_flame 4 · flame_hex 2 · raise_skeleton 1 | mark_weakness, hex_flame, raise_skeleton |
| 30 | summon | 160/25/15/25 | raise_skeleton 12 · skeleton_mastery 5 · skel_legion 2 · raise_mage 7 · mage_focus 2 · mage_legion 2 | raise_skeleton, raise_mage |
| 30 | magic | 15/25/15/170 | bone_shard 15 · shard_bounce 2 · shard_spike 3 · shard_multi 3 · bone_armor 4 · armor_thick 3 | bone_shard, bone_armor |
| 30 | curse_mix | 87/25/15/98 | mark_weakness 10 · curse_power 3 · curse_duration 3 · hex_flame 10 · flame_hex 3 · raise_skeleton 1 | mark_weakness, hex_flame, raise_skeleton |

장비: Lv5 `staff1|0|5|대조용 일반 지팡이||0|`, Lv15 `staff12|0|15|…`, Lv30 `staff25|0|30|…` + 보조 `lamp1|1|1|망자를 부르는 등불|minion=20|2|`. 시험 캐릭터는 스크립트가 세팅하고 `PlayerSave.IsLoadSuccess=false`로 저장을 끈다 (사용자 1회 무료 재구성 승인과 무관한 격리 시험).

## 3. 장면 (DPS-maker-scripts.lua `SCENES` 표와 같다)

좌표는 `data/handmade/<맵>.txt` 구역 중심(칸 → 월드 x = c − W/2, y = H/2 − r). 첫 실행에서 화면으로 벽 속이 아닌지 확인한다 (6절).

| 장면 | 목적 | Lv5 | Lv15 | Lv30 | 대상 | 끝 |
|---|---|---|---|---|---|---|
| boss | 보스 1기(이동·의식 보호막 포함) | gallows 망나니의 처형장 · 나 (6,−3) · 보스 (15,−3) | sanctum 대사제의 성소 · (6,1) → (18,1) | stormeye 폭풍의 눈 · (−6,0) → (−18,0) | headsman · highpriest · admiral 1기 (레벨 맞춤) | 처치 또는 150/180초 |
| horde | 넓은 무리 | execution 처형 광장 · (−16,−2) → (−7,−2) | canyon 거상의 분지 · (−10,4) → (0,4) | lighthouse2 침수된 방 · (0,−12) → (9,−12) | 14기 (7+7 / 6+4+4 / 6+4+4) 반경 2.5 | 전멸 또는 120초 |
| narrow | 협로 | cellar1 물이 스민 통로 (15×5) · (−3,0) → (8,0) | kingtomb1 순장 통로 · (−3,1) → (8,1) | smuggler1 물길 · (2,1) → (−9,1) | 8기 (4+4) 반경 1 | 전멸 또는 120초 |
| ranged | 원거리 이동 적 | execution · cultarcher 5 | canyon · firecultist 5 | lighthouse2 · brinewitch 3 + stormcaller 2 | 반경 3 퍼짐 | 전멸 또는 120초 |
| sustain60 | 60초 자원 지속 | execution · skelwarrior 3 (생명 ×40) | canyon · sandscorp 3 (×40) | lighthouse2 · wreckgolem 3 (×40) | 죽지 않는 표적 | 정확히 60초 |
| wipe | 군단 전멸 후 복구 (소환을 쓰는 빌드만 · magic은 건너뜀) | execution · hellhound 8 | canyon · jackal 8 | lighthouse2 · stormgulls 8 | 준비한 군단을 스크립트가 모두 쓰러뜨린 뒤 잡몹의 혼으로 다시 일으킴 | 원래 수 회복 또는 90초 |

모든 장면 공통: `_Telemetry.DpsFilter = 'C05_'`(시험 대상만 원장) · 시작 전 시험 자리 16칸 안의 다른 몬스터 정리 · 마나·생명 가득 · 소환 빌드는 정원만큼 준비용 혼을 놓고 10초 준비(총구간에 포함, 전투 구간에서는 빠진다).

## 4. 실행 순서 (maker_queue)

조각은 `node tools/dps/maker-blocks.cjs`가 만든다 (CFG 줄을 채운 붙여 넣기용 Lua). `maker_execute_script`의 context는 **server_main**. S10 생성에는 `--origin <unique-play-session-id>`가 필수다. Play 세션마다 호스트에서 고유한 날짜/작업 ID를 정하고 stop→play 뒤에는 새 값을 쓴다. `--queue`도 이 인자 자리를 표시한다. 직접 복사하면 CFG.capture_origin을 같은 규칙으로 채운다. 누락은 시험 상태를 바꾸기 전에 거절한다.

| 순서 | 할 일 | 붙여 넣을 것 | 기대 로그 |
|---|---|---|---|
| 0 | 이 브랜치 반영 → refresh → `logs(kind=build)` 0 error | — | build 0 |
| 1 | play (PC) → 사전 점검 | `maker-blocks.cjs S00` | `[DPS-RUN] preflight dpsOn=false buffer=false … ok=true` |
| 2 | 연결 확인 (아래 조각) | 직접 | `[DPS] window … events>0` · `[DPS] end … ev_omitted=0` |
| 3 | 단계 A: 반복 1회 51장면 | `maker-blocks.cjs --queue A` 순서대로 `S10 …` | 장면마다 `[DPS-RUN] queued/setup/begin/targets/finishing/end` + `[DPS] window/owner/src/life/sample/ev|/end` |
| 4 | 장면마다 로그 저장 | `maker_logs(kind=normal)` → begin/end 로그의 `raw_file` 경로 (전체 label에 auto/human 및 capture_id 포함; 기존 파일 덮어쓰기 금지) → 바로 다음 호출로 `maker_clear_logs` | — |
| 5 | 단계 B: 반복 2·3회 102장면 | `--queue B` | 같음 |
| 6 | 사람 조작 (선택) | `S10 <lv> <build> boss|horde 1 human --origin <unique-play-session-id>` 18회 | 같음 (자동 입력 없음, 메이커 담당이 직접 조작) |
| 7 | 집계 | `node tools/dps/aggregate.cjs raw/*.log --calc <comparison.csv> --out-md result.md --out-json result.json` | 세 열 표 · 원장 ok만 실측 |

연결 확인 조각 (2번):

```lua
local p = nil
for _, u in pairs(_UserService.UserEntities) do p = u break end
_Telemetry.DpsFilter = 'C05_'
_Telemetry:DpsStart('link')
local me = _Util:Pos2(p)
local e = _SpawnService:SpawnByModelId('hellhound', 'C05_link', Vector3(me.x + 2, me.y, 0), p.CurrentMap)
_Util:AfterSpawn(e, 'script.Monster', function(m) m.RespawnDelay = -1 m:ApplyLevel(5, false) end, nil)
local linkRun = _Telemetry.DpsRunId
_Telemetry.DpsCollection = { stop = function(reason)
  if _Telemetry.DpsOn and _Telemetry.Dps ~= nil and _Telemetry.Dps.run == linkRun then _Telemetry:DpsFinish(4000) end
  if isvalid(e) then e:Destroy() end
end }
log('[DPS-RUN] link spawned — 기본 공격·스킬·소환으로 몇 대 친 뒤 [S90]')
```

레벨이 바뀔 때(5 → 15 → 30)는 stop → play로 새로 시작한다. 각 장면은 앞 장면의 `[DPS-RUN] end`를 본 뒤 보낸다 (같은 context에 새 스크립트를 보내면 돌던 것이 멈춘다). 멈췄으면 `S90`. S90은 저장과 캐릭터 원복이 아니라 현재 시험 소유 타이머·대상 정리다. 마지막에는 기존 담당의 격리 세션 종료/복원 절차를 따르고, SaveOff만으로 저장·재접속 통과를 주장하지 않는다.

## 5. 소요 시간 (추정)

장면당: 이동 2.5초 + 준비 1~10초 + 전투 상한(보스 150~180 · 무리/협로/원거리 120 · 자원 60 · 복구 90초) + 로그 읽기·비우기 약 30초. 전멸이 빠르면 더 짧다.
단계 A 51장면 ≈ 90~120분, 단계 B ≈ 3~4시간, 사람 조작 18장면 ≈ 40분. 단계 A 결과로 좌표·대상 수를 먼저 확인한 뒤 B로 간다.

## 6. 좌표 보정

1. 단계 A의 첫 장면마다 `[DPS-RUN] targets`가 나온 직후 screenshot 1장 — 플레이어·대상이 벽 속이거나 막힌 칸이면 그 장면의 `SCENES[장면][레벨]` 한 줄(me·packs 좌표)만 고친다.
2. 고친 좌표·이유를 `raw/coords-fix.txt`에 남긴다. 장면 정의를 바꾸면 그 장면의 앞선 실행은 비교에서 뺀다.

## 7. 판정 규칙 (집계 도구가 강제)

- 같은 run의 flush가 여러 번 있으면 완결된 마지막 스냅샷 하나만 (C-AGG-01).
- 원장 검사 ok만 실측 비교(accepted). 원장이 잘렸거나(dropped·ev_omitted) end 줄이 없으면 요약 전용, 중복 순번·식 불일치는 거부 (C-AGG-02).
- 장면·input(auto/human)·기기(있으면)가 같은 표본끼리 반복 중앙값. 반복 3회는 전체 연구 계획이며 첫 연결/대표 묶음 납품의 필수 대기 조건이 아니다. 실패(플레이어 사망·이탈·좌표 문제·시간 초과)는 지우지 않고 사유와 함께 표에 남긴다.
- 미상 비율(player.unknown·tick.unknown·hit.none)이 높으면 스킬별 기여를 말하지 않는다 — PlayerAttack·ShadowUnit 꼬리표 패치 전에는 플레이어 직접 피해의 스킬 구분이 없다.
- 저주 기여는 같은 빌드에서 저주 사용/미사용 짝 실험(사람 조작, mark_weakness 안 씀)으로 따로 본다. 총 피해에 더해 중복 총DPS로 만들지 않는다.
- 자동 입력(auto)은 「제자리 사격 기준선」이다 (서버는 플레이어를 움직일 수 없다). 사람 조작(human)과 섞어 비교하지 않는다. PC/모바일은 별도 장면 묶음으로 반복한다.

## 8. 한계

- 오프라인 회귀(tests/quality/dps.lua 71개)와 스크립트 문법·대역 실행(logs/maker-script-dryrun.txt)은 실제 Maker 동작·투사체·AI·성능을 증명하지 않는다.
- 자동 입력은 서버 `SkillBook.Cast`·`PlayerAttack.RequestBasicAttack`을 부른다 — 사람의 입력 점유·조준·이동과 다르다.
- 방(Room)마다 Telemetry가 따로라 실행 번호는 방마다 1부터 — 로그 파일을 장면별로 나눠 저장한다.
