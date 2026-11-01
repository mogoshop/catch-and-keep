# 11-01 뼈 창 제거(f9049165) — 메이커 확인 (17:28 ~ 18:22)

설계 `../../design/49-remove-bone-spear.md` §5. 원본 HEAD c77eb35c. 게임 파일 수정 0 · `maker_save` 0. 로그 `key-lines.txt` · 스크립트 `scripts/`.

## 판정 요약

| # | 항목 | 판정 | 근거 |
|---|---|---|---|
| 1 | 옛 저장 환급 | **통과** | 옛 저장 = 슬롯 4 새내기(S48 기준 `bone_spear:5` · sv 4). 준비로 칸 S·우클릭에도 bone_spear를 걸어 둠(`prep-hotbar.lua`). 실제 클릭(칸 4 → 입장) → 서버 17:30:58 `[VRF] skill migrate bone_spear refund=5 nodes=bone_spear:5` (+ 일반 정리 `skill migrate refund=9` = 뼈 창 5 + 지운 노드 4) · 방 입장 뒤 `DMQ sp=9 slots=raise_skeleton,,, right= levels=…`(bone_spear 없음) · K 창 「남은 포인트 9」 |
| 1b | 핫바·우클릭 비움 | **통과** | 화면 A=해골 전사 · S·D·F·우클릭 빈칸(`b1-room-entry-hotbar-cleared-no-notice.jpg`) |
| 1c | 알림 없음 | **통과** | 입장~방 이동 동안 알림 줄·화면 띠 없음(뜬 창은 기존 「선택 보상」 고르기 창뿐 — 이전과 무관) |
| 1d | 중복 환급 없음 | **통과** | (되돌린 S48 저장으로 18:35:11 다시 들어갔을 때도 `refund=5` 한 번만 — 이전 1회 = 저장당 1회) · 방 이동 다시 불러오기 17:31:55 · 새 플레이(iPad 회차) 다시 입장 18:21:26 · 18:21:43 모두 `불러오기 완료 (슬롯 4)`만, migrate 줄 없음 · 그 사이 저장 `DMSLOT2 … sv:5 … levels`에 bone_spear 없음 |
| 2 | K 창 Lv15 열 | **통과** | 시간선 Lv14 다음이 Lv18 — Lv15 열 자체가 없음(뼈 창·긴 창·쌍창 없음) · 골편 투척은 Lv1 열 둘째 줄 · 화면에 보인 설명·요약에 「뼈 창」 없음 + `grep "뼈 창"` data/*.csv · RootDesk mlua 0건(`b2-skillwin-points9-no-lv15-column.jpg`) |
| 3 | 선택 보상 2차 혼 「꿰뚫는 골편」 | **통과** | 카드 「꿰뚫는 골편 · 골편 한 발이 맞히는 적 수 +1 · 악몽 +2 · 지옥 +3」 · 골편 아이콘(`b3-choice-slot2-piercing-shard-card.jpg`) · 실제 클릭 → `choice pick slot=2 axis=soul tier=1` · 스킬 창 「배우면/지금: 뼛조각 1발 부채꼴 · 발마다 2마리」 |
| 3b | 골편 한 발 2마리(노말) | **통과** | 실제 S 키 · 같은 줄 임프 3마리(준비) → 서버 `[Projectile] end skill.bone_shard hits=2 traveled=0.3`(2마리 맞히고 멈춤) · 다른 발 `hits=1 traveled=6.5`(1마리 맞히고 계속 날아감 = 상한 2) · `MaxHits=2` |
| 3c | 악몽 3 · 지옥 4 | **부분(준비로)** | 난이도 전환 불가(새내기 maxDiff 0) → 선택 보상 단계만 바꿔(ChoiceTiers 1,2,1 / 1,3,1 · 준비) `GetShardHits` = 3 / 4 · 지옥 단계로 실제 S 키 → 투사체 `MaxHits=4` · `hits=3 traveled=6.1`(3마리 뒤에도 멈추지 않음) · 끝에 되돌림(`tiers restored=1,1,1 GetShardHits=2`) |
| 4 | 해골 마법사 bone 투사체(FxBoneBolt*) | **통과(로그) / 화면 미포착** | 마법사 일으키기는 대체(혼 구슬·커서 조준을 도구로 못 함 → `MakeRecord('mage')` + school=bone) → `[VRF] mage bolt school=bone element=magic rank=3 n=1 trait=2.00` 반복 · 오류 0 · GameConst `FxBoneBolt*` 값은 옛 `FxSkillSpear*`와 문자열 같음(git show). 비행 중 화면은 0.3초 간격 캡처로 못 잡음(실속도 판정은 녹화 대상) |
| 5 | 「투척수의 두건」 | **통과(대체)** | `grep 창술사` = `ItemData.MigrateLegacyItem` 한 줄뿐 · 옛 문자열 Parse → `name=투척수의 두건 · sk_bone_shard=2` · 설명 「★ 고유 효과 · 골편 투척 레벨 +2」 (옛 장비를 가진 저장이 없어 화면 툴팁 대신 같은 함수 · 대체) |

## 진행 메모
- 남은 포인트로 골편 투척 1랭크를 배움(시간선 48×48 아이콘 실제 클릭이 안 닿아 아이콘 고르기만 대체 · 「배우기」·「스킬 칸에 넣기」·S 칸 지정은 실제 클릭). 내 실수로 첫 「레벨 업」 5번이 해골 전사에 들어감(9→14) — 끝에 슬롯 4를 S48 기준으로 되돌려 영향 없음.
- 골편은 마우스 모드라 커서 방향(오른쪽)으로만 날아감 — 도구가 커서를 못 옮겨, 몬스터를 오른쪽에 두려고 `PlayerTravel:Go`(준비)로 위치를 옮김.
- 무적·HP 채움은 준비(서버 타이머). 같은 컨텍스트에 새 스크립트를 보내면 앞 스크립트(관찰 루프·타이머 포함)가 끊김 — 관찰 4~7은 각각 다시 시작.
- 끝: 슬롯 4 = S48 기준(`bone_spear:5`가 있는 옛 저장)으로 되돌림 → 다음 회차도 같은 옛 저장으로 다시 확인 가능(`../2026-11-01-release-fix5/maker/NOTES.md` 정리 절).
