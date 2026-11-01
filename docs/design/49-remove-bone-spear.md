# 49. 뼈 창 삭제 — 골편 투척으로 합침 (2026-11-01 사용자 결정 · 결정 기록)

사용자 (11-01): 「뼈 창(`bone_spear`)은 골편 투척(`bone_shard`)과 같은 스킬이다 → 뼈 창을 지운다.」

- 혼 계열 Lv15 메인 `bone_spear`와 강화 `spear_long`(긴 창) · `spear_twin`(두 갈래)을 게임에서 완전히 뺐다.
- 출시 중이라 **이미 배운 플레이어의 저장을 깨지 않고** 포인트를 돌려준다 (§3).
- 해골 마법사의 bone 속성(몬스터 쪽 투사체 · `Undead/MageBolts.mlua` · `Shadow/ShadowUnit.mlua`)은 그대로 둔다. 이름만 「뼈 창」 → 「뼈 투척」.
- 옛 설계 문서(04 · 16 · 19 · 24 · 38 · 44 · 48 …)는 고치지 않는다. 그 문서의 뼈 창 서술은 이 문서가 덮는다.

## 1. 이유

- 두 스킬 모두 「조준 방향으로 뼈를 날려 맞힌다」 — 차이는 관통(뼈 창)과 부채꼴 발 수(골편)뿐이라 같은 줄에 같은 일을 하는 버튼이 둘이었다.
- 10-28 투사체 A안으로 골편은 「발 수」, 뼈 창은 「관통」을 나눠 가졌는데, 관통 하나로 메인 스킬 한 칸을 차지할 만큼 손맛이 다르지 않았다.

## 2. 바꾼 곳

| 영역 | 내용 |
|---|---|
| 데이터 | `data/skills.csv` 세 행 삭제 · 해골 마법사·서리 표식 설명에서 뼈 창 언급 정리 · `data/sounds.csv` `cast_bone_spear` 삭제 · `data/config.csv` `pierceHits1~4` 삭제(뼈 창 관통 상한에만 쓰였다) · `pierceTier*Lv`는 투사체 구간(골편 발 수 · 서리 쪼개짐 · 불꽃 폭발)으로 계속 쓰여 설명만 고침 · `magePierceBase`는 마법사 것이라 유지 |
| 장비 | 고유 장비 `lancer_hood` 「창술사의 두건」 → 「투척수의 두건」, `lancer_hood`·`soulhorn_scythe`의 단일 스킬 키를 같은 수의 골편 투척 레벨로 (`sk_bone_shard=2` · `=3`) |
| 코드 | `SkillBook`(거저 주던 1랭크 · 피해 성격 배율 1.3 · 관통 상한/글귀 · 랭크 단계 · 강화 글귀 · 조준 목록 정리, `GetShardHits` 추가) · `SkillEffects`(`BoneSpear` · `PierceCap` 삭제 → `ShardHits`) · `PlayerAttack`(서리 표식은 골편만) · `Projectile`(화면 흔들기 목록 · 골편은 꿰뚫어도 관통 가시 배율을 겹쳐 받지 않음) · `GameConst`(창 그림 상수 넷은 해골 마법사가 쓰므로 지우지 않고 `FxBoneBolt` · `FxBoneBoltHit` · `FxBoneBoltHitMs` · `FxBoneBoltShard`로 이름만 바꿈) · 주석 정리(`MonsterStatus` · `PlayerStats` · `Util` · `MageBolts` · `ShadowUnit`) · `SelfTest` 검사를 골편으로 |
| 생성 데이터 | `node tools/gen_data.cjs` → `GameData` · `SkillData` · `ItemTables` |
| 도구 | `sim_clear.py` · `sim_balance.py`(투자 순서의 뼈 창 → 골편 · 관통 항 삭제) · `dps/aggregate.cjs` · `draft_items19.py` |
| 검사 | `tools/check_data.cjs`에 「지운 스킬의 흔적」 검사 (데이터 csv 전부 + `RootDesk/MyDesk/**/*.mlua` · 아래 §3의 이전 자리만 허용) · `tests/quality/skills.lua`에 이전·선택 보상 검사 |

## 3. 저장 이전 규칙

- 자리: `SkillBook.MigrateSpearToShard` (불러올 때 `MigrateLevels`에서 · 일반 「정의 없는 스킬 환급」 루프보다 먼저).
- 배운 랭크(`bone_spear` + `spear_long` + `spear_twin`)만큼 스킬 포인트를 돌려주고 `Levels`에서 지운다. 지운 칸이라 다시 불러도 · 다시 이전해도 두 번 돌려주지 않는다 (저장 판 번호 `sv`는 그대로 5 — 키가 있는지만 본다).
- 칸(A·S·D·F)과 우클릭에 걸린 `bone_spear`는 `LoadSaveData`에서 비운다 (`SanitizeSlots`도 정의 없는 스킬을 비우지만 이유를 남긴다).
- 알림 없음(포인트만 반환) — 10-29 글귀 규칙(「변경 해명 · 옛 저장 이전 안내 알림은 만들지 않음」)이 우선이다. 돌려받은 포인트는 스킬 창의 「남은 포인트」로 보인다.
- 로그: `[VRF] skill migrate bone_spear refund=%d nodes=…`.
- 장비: 가방 · 창고 · 장착 · 거래 문자열은 모두 `ItemData.Parse`를 지나므로 `ItemData.MigrateLegacyItem`이 옛 키(`sk_bone_spear=N` → `sk_bone_shard=N`)와 옛 두건 이름을 새 값으로 읽고, 다음 저장부터 새 값으로 쓴다. 유니크 도감 키는 id(`u:lancer_hood`)라 그대로.

## 4. 선택 보상 2차 혼 축 대체

| | 옛 | 새 |
|---|---|---|
| 이름 | 미리 쥔 뼈 창 | 꿰뚫는 골편 |
| 효과 (보통) | 뼈 창 1랭크를 미리 (Lv15 전 · 포인트 없이) | 골편 한 발이 맞히는 적 수 +1 |
| 악몽 · 지옥 | +1 · +2레벨 | +2 · +3 |
| 아이콘 | bone_spear | bone_shard |

- 구현: `SkillBook.GetShardHits()` = 1 + `ChoiceTier(2, "soul")` → `SkillEffects.BoneShard`의 `MaxHits` · 내 화면 예측 뼛조각(`PredictBoneShard`)도 같은 수에서 멈춘다 · 스킬 요약 「발마다 N마리」. 튕긴 뼛조각은 1마리 그대로.
- 이미 2차에서 혼을 고른 캐릭터는 `ChoicePicks`가 그대로라 다음 접속부터 새 효과를 받는다 (예전 거저 랭크는 `Levels`에 없던 값이라 돌려줄 포인트가 없다).

## 5. 메이커에서 확인할 것

1. 뼈 창을 배운 옛 저장으로 들어가 — 알림 없음 · 남은 포인트 +N · 칸/우클릭의 뼈 창 비움 · 다시 들어가면 환급 없음.
2. 2차 혼(꿰뚫는 골편)을 고른 캐릭터 — 골편 한 발이 보통 2 · 악몽 3 · 지옥 4마리를 맞히고 멈춤 · 스킬 창 요약 「발마다 N마리」.
3. 해골 마법사 bone 속성 투사체 그림 · 꽂힘(`FxBoneBolt*`)이 예전과 같다.
4. 옛 「창술사의 두건」을 가진 캐릭터 — 이름 「투척수의 두건」 · 「골편 투척 레벨 +2」로 보인다.
