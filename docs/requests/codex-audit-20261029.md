# 코덱스 그림 감사 — 요청 · 납품 · 등록 · 사용 전수 대조 (2026-10-29, Claude)

다음 요청서: [codex-next-20261029.md](codex-next-20261029.md) — 이 감사에서 나온 재요청을 넣었다.

## 0. 기준과 방법

- **작업 트리 기준** (10-29 아침). 다른 세션이 하고 있는 「담 위」 확장의 미커밋 변경(`data/handmade/specs/act2·3.cjs`, `stormcliff`·`stormwaste` 설계도)도 포함한 상태다.
- `.map` · `.ui` · `.model`은 열지 않았다. 대신 그것들을 만드는 쪽을 봤다.
  - 맵에 깔리는 그림 = 설계도 결과물 `data/handmade/*.txt`(`;base` `;zone` `;road` `;wall` `;raised` `;shore`) + `data/handmade/*.csv`(prop · decal · set · cluster) + 심연 맵 `data/map_layouts.csv` · `data/map_art.csv`.
  - 세트는 실제로 맵이 부르는 세트만 사용으로 쳤다 (`data/map_sets.csv` 113세트 중 107세트가 쓰임, 없는 세트 이름을 부르는 곳 0).
  - 빌더가 이름을 만들어 쓰는 그림도 셌다: 벽 묶음 → 9조각, `;raised` → 앞면(`face=`·`<묶음>-face-*`)·끊긴 끝(`<묶음>-broken-*`)·그림자(`waste-borders-center`)·`back=`·`low=`·`below=`·`edge=` (`tools/build/handmade/lib.cjs` 290~400줄).
  - 코드·데이터 = 손으로 쓴 `.mlua`(RootDesk/MyDesk, `Data/` 생성물 제외)의 이름·RUID, `tools/**/*.cjs`, `data/*.csv`(art_sprites·art_scale 자신 제외).
- 납품물 = `assets/codex-*/` 83폴더의 `png/`(없으면 `upload/`·`exports/`·폴더 안 png). RUID는 폴더 안 `resource-mapping*.csv` · `RUIDS.csv` · `uploaded*.json/tsv`에서 읽고, 등록 여부는 그 RUID나 파일 이름이 `data/*.csv` · `.mlua` · `tools/`에 나오는지로 봤다.
- 도구(scratchpad, 커밋 안 함): `audit2.cjs`(등록 그림 → 사용처) · `audit3.cjs`(납품 → 등록) · `req.cjs`(요청서 이름 → 납품) · `png.cjs`(색 측정). 어젯밤 중간 산출(`566de651…/scratchpad/audit.json`)은 **맵 파일을 읽은 옛 색인**이라 교차 확인에만 썼고, 숫자는 모두 다시 쟀다.

## 요약

| 항목 | 수 |
|---|---|
| 요청서 | 68개 (`docs/requests/codex-*.md` 67 + `.json` 1) · 납품 기록 46개 |
| 납품 폴더 · png | 83폴더 · 5,909장 (그중 게임 등록 2,423장) |
| (a) 요청했으나 안 온 것 | **필수 7장**(안내 책갈피 아이콘 6 · 화면 테두리 1 — 10-27, 샘플만 옴) + **10-11 공통 백로그 미납분**(저주 표식 11 등 — 코덱스가 10-29 00:13에 `codex-common-backlog-v1` 폴더를 열었고 아직 png 0장) + 선택 항목 4건 생략 |
| (b) 납품됐으나 미등록 | 3,486장. 게임 밖 110 · 시안·샘플 181 · 대체된 옛 몬스터·지형 3,110 · **현행 묶음 85** (재업로드로 다른 RUID 45 · 샘플 19 · 승인 멈춤 7 · 쓸 곳 없어짐 4 · 아바타 아이템 경로 10). **진짜 빈 곳 0** |
| (c) 등록됐으나 어디에도 안 쓰임 | `art_sprites.csv` 749줄 중 **92줄** = 실제로 안 그려지는 그림 **75장** + 같은 RUID를 다른 이름으로 한 번 더 적은 줄 17 |
| (d) 쓰이는데 `art_scale` 줄 없음 | 6장 — 모두 띠 그림(배율을 `;shore`·`edge=`에서 줌) 또는 배치마다 배율을 준 옛 소품이라 **원본 크기로 그려지는 곳 0** (10-28 밤 §6-1에서 40줄 고친 뒤) |

---

## (a) 요청했으나 납품 안 된 것

### a-1. 미납 (지금도 필요)

| 요청서 | 미납 | 지금 게임 | 근거 |
|---|---|---|---|
| `codex-guide-ui-20261027.md` | 아이콘 6 (`guide-tab-start` · `-growth` · `-gear` · `-adventure` · `-together` · `-danger`) + `guide-screen-frame` 896×518 | 샘플 3장(`guide_tab` · `guide_tab_on` · `guide_legion`)만 `ui_icons.csv`에 들어감. 나머지 6칸은 메뉴 아이콘을 빌려 씀 (`tools/build/ui.cjs:759` `icon_scroll`·`icon_skill`·`icon_bag`·`icon_waypoint`·`icon_party`·`icon_sword`), 화면 칸 테두리 없음 | `assets/codex-guide-ui-v1/DELIVERY-samples.txt` 「샘플 승인 후 아이콘6종+화면 테두리1종을 추가 제작」 — 그 뒤 납품 없음 |
| `codex-art-backlog-20261011.md` §3 | 몬스터 머리 위 상태 표식 `mark_*` 11장 (32×32) | 걸린 저주를 스킬 아이콘(128px)을 0.14배로 줄여 띄운다 (`RootDesk/MyDesk/Monster/MonsterStatus.mlua:745`, 종류 9 = `CurseDefs` 282~295줄) | `codex-art-backlog-delivery-20261011.md` 「이번에 제작하지 않은 공통 요청」. 코덱스가 10-29 00:13 `assets/codex-common-backlog-v1/`(요청서 사본만, png 0)을 열어 진행 시작 |

### a-2. 10-11 공통 백로그 — 항목별 지금 상태 (코덱스가 지금 받는 중이라 「뺄 것」을 같이 적는다)

| 절 | 항목 | 지금 상태 | 판단 |
|---|---|---|---|
| §1 | 버프·디버프 칩 6 | 받음 (`ui_icons` buff_command … debuff_shock) | **빼기** |
| §2 | 스킬 아이콘 29 | 85개 스킬 모두 자기 아이콘 (`skills.csv` icon 중복 0). `blast_*` 3 · `revive_*` 2는 스킬이 없어짐 | **빼기** |
| §3 | 저주 표식 11 | 미납 — 위 a-1 | **최우선** (지금 종류 9: 약화·쇠약·가시·공포·혼란·생명 약탈·쇠퇴·저항 붕괴·골격 감옥 + 독·냉기 2는 새로 붙일 자리) |
| §4 | 아군 해골 전사·마법사 프레임 · 마력탄 | 변이 8종(해골 방패·쌍칼·대검 3 / 마법사 5)은 받음. 기본형은 필드 몬스터 그림 재사용(`codex-skeleton-forms-20261024.md:11`). 마력탄 `GameConst.SpriteMageBolt`는 코덱스 납품물 아님 | 사용자 확인 |
| §5 | 스킬 이펙트 7 (뼈 창 · 영혼 격류 · 혼 흡수 · 뼈 갑옷 · 골격 감옥 · 저주 바닥 문양 · 피의 사제 구슬) | `GameConst`에 전용 그림 상수 없음 — 파티클·대용 그림 | 사용자 확인 |
| §6 | 봉인 상자 2 · 심도 입구 · 피의 제단 · 플레이어 시체 | 심도 입구 `DepthGate`가 일반 포털과 같은 RUID(`objects.csv:7` = `:2`), 피의 제단·시체·봉인 상자(저주받은 상자 재사용)는 코덱스 납품물 아님 | 사용자 확인 |
| §7 | 고유 12 · 세트 11 · 목걸이·반지 · 그을린 등불 · 정수 · 소켓권 · 도박 · 미확인 장비 | `item_uniques.csv`·`item_set_pieces.csv`에 icon 칸 없음(베이스 그림), 목걸이·반지·그을린 등불·정수·도박은 코덱스 아님, `socket_ticket`·`item_unknown` 키 없음. 징 박힌 허리띠·금화는 받음 | 사용자 확인 (허리띠·금화는 빼기) |
| §8 | 메뉴 아이콘 4 + 완료 체크 · 공격 단추 · 동료 초상 4 · 액트 1 NPC 5 | 랭킹·귀환은 코덱스 아님(`ui_icons` `icon_rank`·`icon_portal`), `icon_attack` 없음. 초상은 썸네일·`monsters.csv portrait`로 해결. NPC는 고르·오렌·하르크·사디크 받음(`codex-story-scenes-v3`), 창고만 아님 | 초상·NPC 4는 **빼기**, 나머지 사용자 확인 |
| 선택 | 액트 1 몬스터 13 · 변종 아이콘 12 · 드롭 빛기둥 5 | 액트 1 몬스터는 `art-appeal-full-v3`로 받음, 빛기둥은 Claude `claude-loot-beam-v1`, 변종 아이콘 없음 | 몬스터·빛기둥 **빼기** |

### a-3. 선택 항목이라 생략된 것 (재요청 불필요)

| 요청서 | 생략 | 근거 |
|---|---|---|
| `codex-act234-20261028.md` B | 랜드마크 곁 `a<n>-adjunct-<영문>` 1장씩(선택) | `codex-act234-landmarks-v1/DELIVERY-full.txt:7`. Claude가 기존 곁 조각으로 세트 11을 묶어 대신함 (설계 42 §6-1) |
| `codex-map-variety-20261024.md` | 거품·용암 4프레임(선택) | `codex-map-variety-v1/DELIVERY-full.txt:13` |
| `codex-map-events-art-20261009.md` | `shrine_used`(「원하면」) | 쓴 신전은 코드가 회색으로 칠함 |
| `codex-act1-anim-questart-20261010.md` | 뼈 둥지 맥동 4프레임(선택·보류) | 뒤에 `monster_frames.csv` bonenest stand 4프레임으로 해결 |

### a-4. 멈춘 것 (납품은 왔지만 승인 단계에서 멈춤)

| 요청서 | 상태 |
|---|---|
| `codex-telegraph-rim-20261021.md` | 원형 예고 테두리 2안(v1) → r2 5색 납품, **RUID 빈칸 · 승인 기록 없음**. 게임은 Claude 임시 `claude-telegraph-v1`(GameConst `SpriteTeleRim`·`SpriteTeleFill`)을 계속 쓰고, 10-28 보스 선 예고도 그 색에 맞춰 받았다 |

### a-5. 요청서별 전수 확인 (68개)

이름이 적힌 요청은 `req.cjs`로 이름을 하나씩 대조했고, 이름 없이 묶음으로 요청한 옛 요청서는 납품 기록·폴더로 확인했다. 아래 외에는 **미납 없음**.

| 날짜 | 요청서 → 납품 폴더 | 결과 |
|---|---|---|
| 10-09 | ui-requests → 의뢰 그림 6+흑백 · 미니맵 3 · 조준 꺾쇠 (`ui_icons`) | 완료 |
| 10-09 | map-events-art → `codex-map-events-v1` 10 | 완료 (shrine_used 선택 생략) |
| 10-09 | rune-waypoint-art → `codex-rune-waypoint-v1` 26 | 완료 |
| 10-09 | custom-equipment-art.json → `codex-ashen-veil-v1` 6 | 완료 — 뒤에 아바타 아이템 경로로 감 |
| 10-09 | map-requests | 그림 아님 (배치 작업, 완료) |
| 10-10 | act1-anim-questart → `codex-act1-anim-v1` 12 | 완료 |
| 10-10 | act1-env-art → `codex-act1-env-v1` 111 | 완료 |
| 10-10 | act2-art → `codex-act2-v1` 369 | 완료 (몬스터 292는 뒤에 art-appeal로 대체) |
| 10-11 | act3-art · act3-review · act3-fix → `codex-act3-v1` 327 · `codex-act3-fix-v1` 32 | 완료 (지형 11은 RUID 빈칸 — r2로 대체) |
| 10-11 | art-backlog → `codex-act3-v1/png/ui` 6 | **부분** — 위 a-2 |
| 10-11 | art-maple-native · art-mood-explore · art-style-trial | 시안 완료 |
| 10-12 | act1-style-trial · trial2 · maple-dark-trial · maple-dark-remake · act1-remake · act2-maple-dark-remake · act23-maple-preflight · act23-maple-remake | 완료 — 모두 뒤에 art-appeal 몬스터로 대체 |
| 10-12 | belt-icons → `codex-belts-v2` 6 · story-art → `codex-story-art-v1` 14 | 완료 |
| 10-20 | act4-art → `codex-act4-v1` 446 · skill-icons(·20261020) → v3 13 · v4 9 | 완료 (액트 4 1차 지형은 10-28 묶음으로 대체) |
| 10-21 | act3-gothic-remake → 333 · monster-appeal(·sample) → v1~v4 · quest-art-tune · act4-quest-story-art | 완료 (24번 보류분도 뒤에 `quest_art24`) |
| 10-21 | telegraph-rim | **멈춤** — a-4 |
| 10-22 | room-cards · story-scenes · release-thumbnails-v6 | 완료 |
| 10-23 | fall-rise · reveal-elian · reveal-link · zafar-fall → `codex-story-scenes-v4` 7 · pet-jae-event · promo-subimages | 완료 |
| 10-24 | aura-icons 12 · mage-forms 130 · skeleton-forms 78 · map-variety 77 · pets-wave1 55 | 완료 (map-variety 선택 4프레임 생략) |
| 10-25 | notify-dot 1 · skill-node-icons 48 · supporter-pass 3 · youtube-channel 2 | 완료 |
| 10-27 | guide-ui | **부분** — 샘플 3만 (a-1) |
| 10-27 | guide-video ×5 · journal-stats-runes ×3 → 26 | 완료 |
| 10-28 | full · overnight → a1-handmade-v2 56 · feel-fx-v2 30 · skill-window-v3 46 · ui 등 | 완료 |
| 10-28 | act234 → landmarks 51 · a2-handmade 52 / entrances 27 / a3-handmade 68 / a4-handmade 69 / evening-act23 → + boss-moves 44 | 완료 (act234 선택 곁 조각 생략) |

---

## (b) 납품됐으나 RUID 미등록

### b-1. 묶음별

| 묶음 | 폴더 | png | 미등록 | 판단 |
|---|---|---|---|---|
| 게임 밖 (홍보·썸네일·영상·시안 화면) | release-thumbnails v2~v8 · release-branding · promo-subimages v2·v3 · youtube-channel · guide-video intro-outro·overlay · skill-window-mock · pet-event | 110 | 110 | 정상 (게임 RUID 불필요) |
| 시안·샘플 | act1-trial · trial2 · maple-dark-trial · style-trial · mood-explore · maple-native · art-appeal-samples v1·v2 · terrain-v1 · fx-v1 · story-scenes-v1 | 208 | 181 | 정상 |
| 대체된 옛 몬스터·지형 | act1-remake 451 · act1-maple-dark 451 · act2-maple-dark 168 · act23-maple 740/776 · act2-v1 292/369 · act3-v1 231/327 · act3-fix 32 · act3-gothic 330/333 · act4-v1 389/446 · story-scenes-v2 26 | 3,379 | 3,110 | 정상 — 몬스터는 `art-appeal-full-v3·v4`, 지형은 10-28 손 설계 묶음으로 바뀜. act4-v1 지형 20장은 이름을 바꿔(`a4-abyss_rune`… · `basalt-cliff-borders-*`) 등록돼 있어 매핑 RUID와 다를 뿐 |
| **현행 묶음** | 나머지 47폴더 | 2,212 | **85** | 아래 b-2 |

### b-2. 현행 묶음 미등록 85장 — 하나씩

| 폴더 | 장 | 실제 상태 | 할 일 |
|---|---|---|---|
| `codex-feel-fx-v1` `png/frames/fx-levelup-pillar-01~08` | 8 | 피벗 고쳐 다시 올린 RUID로 등록 (`ui_icons` `fx_levelup_1~8` ← `assets/claude-pivot-reupload-20261028/`) | 없음 (매핑이 낡음) |
| `codex-feel-fx-v2` pillar 8 + `fx-levelup-ring-01~06` | 14 | 같음 (`fx_levelup_ring_1~6`) | 없음 |
| `codex-skill-window-v3` `sk-offer-card-*` | 6 | Claude 수정본 `claude-offer-card-v2`로 대체 (`ui_icons` `sk_offer_card_*`) | 없음 |
| `codex-art-appeal-full-v3` `quest_art{1,2,3,23}_gray` | 4 | 흑백판을 `codex-story-scenes-v3` 것으로 다시 올림 (`ui_icons` `quest_art_gray*`) | 없음 |
| `codex-pet-jae-v1` exports 13 | 13 | `uploaded-ruids.json`의 RUID로 `pets.csv` jae에 등록 (매핑 CSV만 빈칸) | 없음 |
| 샘플 — aura 1 · mage-forms 5 · skeleton-forms 5 · story-scenes-v3 6 · art-appeal-v3 samples 2 | 19 | 전체 납품에 포함되어 쓸 일 없음 | 없음 |
| `codex-telegraph-rim-v1` 2 · `-r2-v1` 5 | 7 | RUID 빈칸 · 승인 멈춤 (a-4) | 사용자 결정 |
| `codex-art-appeal-full-v4` `portrait/abysslord` | 1 | 심연 군주 초상 — `monsters.csv`에 abysslord 줄 없음(형태 `form_abysslord`만) | 없음 (쓸 칸 없음) |
| `codex-map-events-v1` `bone-nest` | 1 | 뼈 둥지는 몬스터 프레임(`monster_frames` bonenest)으로 바뀜 | 없음 |
| `codex-ui-v2` `menu-quest` · `skill-corpse-blast` | 2 | 메뉴 의뢰는 `icon_quest`가 대신, 「망자 폭쇄」 스킬은 없어짐 | 없음 |
| `codex-ashen-veil-v1` 6 · `codex-items-v1` 4 | 10 | 장비 시안 → 아바타 아이템(그룹 OJYYQ 업로드) · `codex-belts-v2`로 대체 | 없음 |

→ **게임에 쓰려고 받았는데 아직 안 올린 그림은 0장.** (resource-mapping RUID 빈칸 자체는 코덱스 원본 CSV라 정상 — Claude가 올린 RUID는 `resource-mapping.csv` 본 파일 또는 `uploaded*.json`에 있다.)

---

## (c) 등록됐으나 어디에도 안 쓰이는 그림

`art_sprites.csv` 749줄: 맵에 깔림 615 · 코드·데이터에서 씀 42 (효과 35 · NPC 6 · `waste-rock-top`) · **안 쓰임 92**.

※ 다른 세션의 「담 위」 확장이 설계도를 다시 만드는 중이라 꾸밈(dress) 무작위 배치가 바뀐다. 첫 측정(616)과 마지막 측정(615) 사이에 `a4-prison-bars-h`가 혼 감옥 꾸밈 후보에만 남고 이번 조합에서 안 뽑혔다 — 아래 숫자는 마지막 측정.

### c-1. 이름만 중복 (그림은 쓰이고 있음) — 17줄

| 줄 | 이름 | 같은 RUID | 비고 |
|---|---|---|---|
| 615~623 | `a3-coast-rock-wall-borders-{center,e,n,ne,nw,s,se,sw,w}-r2` | `a3-coast-rock-wall-r2-borders-*` | 빌더는 `<묶음>-borders-<조각>` 꼴만 부른다 → 이 9줄은 이름이 틀려 영원히 안 불림 |
| 118~121 · 123~126 | `waste-borders-{nw,n,ne,w,e,sw,s,se}` | `a1-waste-borders-*` | `waste-borders-center`(122)는 높은 칸 그림자로 쓰임(lib.cjs 327·384) — 남긴다 |

(`waste-rock-top` 466줄도 `a1-waste-borders-center`와 같은 RUID — `tools/check_decisions38.cjs:73`에서만 부름.)

### c-2. 실제로 안 그려지는 그림 75장 — 종류별

「설계서에만」= `data/handmade/specs/*.cjs` 앞부분에 옛 이름이 남아 있지만 같은 파일 끝 매핑(`A3_WALL`·`A3_FLOOR`·act4 끝 매핑)이 새 그림으로 바꿔 설계도에는 안 나온다.

| 종류 | 장 | 이름 (art_sprites 줄) | 출처 | 왜 안 쓰나 | 쓸 자리 제안 |
|---|---|---|---|---|---|
| 벽 9조각 | 9 | `a3-coast-rock-wall-borders-*` (601~609) | `codex-a3-handmade-v1` r1 샘플 | r2(푸른 동굴 색)로 대체 | 없음 — 갈색이라 액트 3에 안 맞음 |
| 벽 9조각 | 9 | `coast-rock-borders-*` (193~201) · 설계서에만 | `codex-act3-v1` (10-11) | `A3_WALL` → r2 | 없음 |
| 벽 9조각 | 9 | `shiphold-borders-*` (211~219) · 설계서에만 | `codex-act3-v1` (10-11) | `A3_WALL` → 난파선 판자벽 r2 | 없음 |
| 벽 9조각 | 9 | `temple-borders-*` (68~76) | `codex-act2-v1` (10-10) | 사원은 `a2-temple-pillar-wall`로 | 없음 |
| 바닥 | 2 | `a3-wet-sand-floor`(611, 설계서에만) · `a3-tidal-flat-floor`(610) | `codex-a3-handmade-v1` r1 | r2로 대체 | 없음 |
| 바닥 | 12 | `a4-abyss_rune` · `a4-apostate_chapel` · `a4-basalt` · `a4-bone_pit` · `a4-demon_march_ew` · `a4-demon_march_ns` · `a4-lava_crack` · `a4-molten_forge` · `a4-scorched_pavers` · `a4-soul_prison` · `a4-sulfur_cave` · `a4-sulfur_mud` (268~279) | `claude-act4-terrain` (코덱스 10-20 1차를 Claude가 다듬음) | 10-28 액트 4 묶음으로 대체 (격자 반복·어두움 진단) | 없음 |
| 바닥 | 1 | `ash-road` (100) · 설계서에만 | `codex-act1-env-v1` | 액트 3 `A3_FLOOR` → 젖은 자갈길 r2, 액트 1은 `a1-*` 길 | 없음 |
| 입구·계단 | 7 | `a3-entrance-{drowned-chapel,keeper-door,sea-cave,smuggler-cave,wreck-hull}` · `a3-stair-{down,up}` (587~593) | `codex-entrances-v1` | r2 색으로 다시 받음 (`entrance_art.csv`가 `-r2`를 씀) | 없음 |
| 입구 (옛) | 2 | `cave-entrance`(64) · `crab-cave-mouth`(249) · 설계서에만 | `claude-act23-aligned` | 입구 그림(`entrance_art.csv`)으로 대체 — 포털과 입 위치가 안 맞았다 | 없음 |
| 장식 (옛) | 1 | `temple-stairs` (78) | `claude-act23-aligned` | `a2-stair-*`로 대체 | 없음 |
| 장식 | 7 | `a4-abyss-wall`(290) · `a4-cave-backwall`(300) · `a4-throne-cover-wall`(339) · `a4-outpost-gate`(317) · `a4-molten-channel-v`(316) · `a4-prison-bars-v`(320) · `a4-wood-fence-v`(342, 설계서에만) | `codex-act4-v1` (10-20) | 벽 3장은 10-28 성채·혼 핏줄 벽으로 대체. 세로 짝 3장은 가로 짝(`-h`)만 배치됨 | 세로 짝 3장 → 혼 감옥 세로 창살 · 용암 대장간 세로 쇳물 홈 · 마지막 초소 세로 울타리. `a4-outpost-gate` → 마지막 초소 남문 |
| 장식 | 1 | `a4-prison-bars-h` (319) · 설계서에만 | `codex-act4-v1` | 혼 감옥 꾸밈(dress) 후보 목록에만 있고 이번 조합에서 안 뽑힘 (첫 측정 땐 1곳) | 혼 감옥 창살 줄은 꾸밈 무작위 말고 `put`으로 고정 |
| 효과 | 4 | `a4-abyss-wall-pulse-00~03` (291~294) | `codex-act4-v1` | 연결된 적 없음 | 심연의 문 1~3층 — 「숨 쉬는 문양 기둥」 랜드마크 곁 맥동 (FrameAnimator 4프레임) |
| 효과 | 1 | `a4-outpost-red-sky` 1024×256 (318) | `codex-act4-v1` | 연결된 적 없음 | 마지막 초소 북쪽 끝 하늘 띠 |
| 효과 | 1 | `sandstorm-overlay` 1920×1080 (66) | `codex-act2-v1` (10-10) | 10-11 백로그 「Claude 쪽 — 바람 무덤 사막」에 연결 예정이었으나 안 됨. 모래폭풍은 지금 시야 축소 + 입자만 (`DarkVision.mlua:341`) | 바람 무덤 사막(`maps.csv` storm 0.35) · 대사제 3단계 모래폭풍(`HighPriestRite.mlua:48`)에 화면 덮개로 |

합: 9+9+9+9+2+12+1+7+2+1+7+1+4+1+1 = **75**.

- 설계 42 §6-1의 「코덱스 액트 2~4 묶음 중 안 쓴 그림 없음」은 **10-28 최종 납품분 기준으로 맞다.** 안 쓰는 것은 r1 샘플 11장 · 입구 r1 7장 · 10-11/10-20 1차 그림이다.

### c-3. 참고 — ui_icons

- `ui_icons.csv` 314키 중 정적 검색으로 못 찾은 89키는 대부분 문자열을 이어 붙여 부른다 (`eq_*` · `buff_*` · `story_*` · `*_portrait` · `guide_shot_*` · `sk_tl_node_*` · `supporter_*`). 그래서 미사용 판정은 하지 않았다.
- 확실히 안 쓰는 것: `ui_killstreak_plate_1~4` (259~262줄) — 10-28 사용자 「30마리 처치 판은 촌스럽다」로 머리 위 「COMBO N」 글자로 바뀜 (`tools/build/ui.cjs:530`). **습격 「격퇴 판」을 이 판 양식으로 받으면 같은 지적을 받을 수 있다** → 다음 요청서 B-3에 반영.

---

## (d) 쓰이는데 `art_scale.csv` 줄이 없는 그림

크기 규칙: 코덱스 `prop` 0.8배 · `prop-1x` 1배 × `art_scale.csv` (`lib.cjs:151`). 줄이 없으면 256px 그림이 2.56칸으로 그려진다. 맵에 깔리는 장식·무늬 334종 중 줄 없는 것 (`a4-prison-bars-h` 192×140도 줄이 없지만 이번 조합에선 안 깔림 — 첫 측정 때는 꾸밈 배율이 붙어 1.60칸, 창살로 괜찮은 크기):

| 그림 | 크기 | 실제 배치 | 실제 화면 폭 | 위험 |
|---|---|---|---|---|
| `a3-decal-shore-foam-edge-h-r2` | 256×64 | 물가 띠 (`;shore … 0.9`) | 띠 배율 0.9로 이어 깖 | 없음 — 줄을 넣으면 띠 길이가 바뀐다, **넣지 말 것** |
| `a3-decal-shore-foam-edge-v-r2` | 64×256 | 〃 | 〃 | 없음 |
| `a4-decal-lava-edge-h` | 256×64 | 용암 가장자리 (`edge=…:0.9`) | 〃 | 없음 |
| `a4-decal-lava-edge-v` | 64×256 | 〃 | 〃 | 없음 |
| `a4-molten-channel-h` | 128×64 | 2곳 (배치 배율 지정) | 1.00~1.03칸 | 없음 |
| `a4-prison-gate` | 128×170 | 1곳 (배율 지정) | 0.96칸 | 없음 |

- 곁 조각 40종은 모두 줄이 있고 실제 폭 2.2칸 이하. 바닥 무늬는 0.8배(256px → 약 2칸)가 기본이고, 큰 것은 `a4-decal-sigil-circle-large`(768px · 0.8 → 6.1칸, 아레나 문장 원 — 의도) 하나.
- 10-28 밤 「부두 소금 자루가 사람보다 컸다」(설계 42 §6-1)는 r2 곁 조각·무늬 40줄을 넣어 이미 고쳤다. 지금 남은 위험은 **0**.

---

## 바로 고칠 것 (Claude)

1. **`art_sprites.csv` 이름 중복 17줄 정리** — `a3-coast-rock-wall-borders-*-r2` 9줄(615~623)은 빌더가 절대 부르지 않는 이름이니 지운다. `waste-borders-*` 8줄(118~121·123~126)은 `a1-waste-*`와 같은 그림 — 지우거나 「= a1-waste」 메모. `waste-borders-center`는 그림자로 쓰니 남긴다. (맵 파일은 RUID로 그림을 들고 있어 줄을 지워도 다시 지을 때만 영향 — 지운 뒤 `node tools/build/handmade/build.cjs --check` 한 번.)
2. **안 쓰는 그림 쓸 자리** (c-2 제안 칸): `sandstorm-overlay` → 바람 무덤 사막·대사제 3단계 덮개 / `a4-abyss-wall-pulse-00~03` → 심연의 문 문양 기둥 맥동 / `a4-outpost-red-sky` · `a4-outpost-gate` → 마지막 초소 / 세로 짝 3장(`a4-prison-bars-v` · `a4-molten-channel-v` · `a4-wood-fence-v`). 맵마다 시안 캡처 후 사용자 확인.
3. **크기 검사 재발 방지** — `build.cjs --check`에 「`prop-1x` 192px 이상 + `art_scale` 줄 없음 + 배치 배율 1」 경고 한 줄 (띠 그림 4종은 예외 목록). 새 납품마다 사람이 표를 맞추던 일을 도구가 잡게.
4. **번개 절벽 · 악마의 행군로의 앞면**: 지금 `face=<묶음>-borders`(9조각의 윗단 가장자리 s·sw·se를 앞면 띠로 반복)다. 코덱스 앞면 조각이 오면 `face=a3-coast-rock-wall-r2-face` · `face=a4-fortress-wall-face` 한 칸만 바꾼다 (`specs/act3.cjs` stormcliff 181줄 · `specs/act4.cjs` demonroad 131줄). 바람 무덤 사막은 `a2-sandstone-wall-face-*`·`-broken-*`가 이미 있어 추가 그림 불필요.
5. **끊긴 담 끝은 지금 「담 위(top=zone 아님)」 방식에서만 쓰인다** (`lib.cjs:367~371`). 번개 절벽·행군로는 `top=zone` 층 방식이라 끝 조각이 와도 안 붙는다 → 받기 전에 `lib.cjs` 2-1 `zoneTop` 갈래에도 같은 판정(한 칸 너비 가로 끝)을 넣는다.
6. **설계서 옛 이름 34개** (c-2 「설계서에만」): 동작은 맞지만 읽을 때 헷갈린다. 지금은 두고, 액트 3·4 설계서를 다음에 손볼 때 끝 매핑을 앞부분에 녹인다.
7. **매핑 낡음 기록**: feel-fx 22 · skill-window 6 · quest gray 4의 `resource-mapping.csv` RUID가 실제 등록과 다르다 (재업로드). 감사 도구가 오판하지 않게 다음 감사 때 `claude-pivot-reupload-20261028`·`claude-offer-card-v2`·`codex-story-scenes-v3` 매핑을 같이 읽는다.

## 코덱스에 다시 요청할 것 (→ `codex-next-20261029.md` D절)

1. **안내 책갈피 아이콘 6 + 화면 테두리 1** — 10-27 샘플 승인분 결 그대로, 샘플 없이 바로.
2. **몬스터 저주 표식** — 코덱스가 지금 여는 `codex-common-backlog-v1`에 맡기되, 백로그 중 **이미 끝났거나 없어진 것을 빼라고** 알린다 (a-2 「빼기」: §1 · §2 · 초상 · NPC 4 · 액트 1 몬스터 · 빛기둥 · 허리띠 · 금화). 저주 표식 11장을 맨 앞으로.
3. **물에 잠긴 예배당 벽 r2** — `seachapel`이 10-11 `chapel` 벽(평균 밝기 0.22)을 그대로 쓴다. 등대 벽(0.20)과 같은 문제라 등대 벽과 같은 결로 9조각 (사용자 확인 뒤).
4. **원형 예고 테두리** — 10-21 r2 5색이 승인 단계에서 멈춤. 계속할지 사용자 결정 (지금 Claude 임시로 문제는 없다).
5. 10-11 백로그 「사용자 확인」 칸(이펙트 7 · 심도 입구 · 피의 제단 · 고유·세트 아이콘 · 정수 · 소켓권 · 미확인 장비 · 공격 단추 · 변종 아이콘 12 · 기본 해골 전사·마법사)은 사용자가 고른 뒤 요청한다.
