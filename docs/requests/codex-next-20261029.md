# 코덱스 요청: 폭풍 등대 벽 · 「담 위」 앞면 · 습격 그림 + 감사에서 나온 재요청 (2026-10-29, Claude) — 초안

근거:
- 감사 [codex-audit-20261029.md](codex-audit-20261029.md) — 요청 68개 · 납품 83폴더 · 등록 749줄 전수 대조. 미납·불량은 D절로.
- 「담 위」 확장 10-29 선정: 액트 2 바람 무덤 사막 · 액트 3 번개 절벽 · 액트 4 악마의 행군로 (액트 2 가라앉은 대로 시안 10-28 승인 — `codex-act234-20261028.md` 「담 위」 절).
- 습격: 기획서 [41-raid-waves-plan.md](../design/41-raid-waves-plan.md) §6 그림 · §8 결정 #7 A(3초 예고 = 화면 가장자리 표식 + 액트별 바닥 조짐 + 소리) · #10 글귀 후보 1 담백(「습격이 온다」 · 「습격 격퇴 · N마리」). 구현은 커밋 6bd99b5 — 그림만 임시다.

| 절 | 묶음 | 수 | 폴더 |
|---|---|---|---|
| A | 폭풍 등대 전용 벽 9조각 + 남쪽 앞면 3 | 12 | `assets/codex-walltop-v1/` |
| B | 습격 — 가장자리 예고 표식 3프레임 · 바닥 조짐 4종 × 4프레임 · 격퇴 판 1 (+선택 우두머리 표식 1) | 20 (+1) | `assets/codex-raid-v1/` |
| C | 「담 위」 앞면 3 + 끊긴 끝 2 — 액트 3 해안 바위 r2 · 액트 4 성채 벽 | 10 | `assets/codex-walltop-v1/` |
| D | 재요청 — 안내 책갈피 아이콘 6 + 화면 테두리 1 · (사용자 확인 뒤) 물에 잠긴 예배당 벽 r2 9 · 공통 백로그 정리 안내 | 7 (+9) | `assets/codex-guide-ui-v1/` · `assets/codex-walltop-v1/` · `assets/codex-common-backlog-v1/` |

---

## 공통 규칙 (액트 2~4 묶음 `codex-act234-20261028.md` C절 · `codex-a3-handmade-20261028.md` · `codex-a4-handmade-20261028.md`와 같다)

- **결 기준**: 승인된 `assets/codex-a2-handmade-v1/`(사암 담 9조각 · 담 위 앞면 `a2-sandstone-wall-face-*` · 끊긴 끝 `a2-sandstone-wall-broken-*`) · `assets/codex-a3-handmade-v1/`(r2 「얕은 바다」) · `assets/codex-a4-handmade-v1/`(현무암 절벽 r2 · 성채 벽). 위에서 3/4로 내려다보는 같은 각도 · 같은 외곽선 굵기 · 같은 명암.
- **반복 무늬 규칙 (C절)**: 벽·앞면 조각은 128×128 **이음매 없이** 이어 붙는다. 큰 불규칙 덩어리로, 눈에 띄는 무늬(창·장식 띠·큰 금)는 **한 장에 1곳 이하** — 128px마다 같은 자리에 같은 무늬가 오면 넓은 맵에서 격자·줄무늬로 보인다 (10-28 사암 바닥 · 액트 4 바닥 교훈).
- 벽 9조각(`-borders-center·n·s·e·w·ne·nw·se·sw`)은 **center도 그린다** — 밝기 0.25 이상, 검은 구멍 금지.
- 글자·숫자 넣지 않는다 (글귀는 게임이 쓴다). 투명 PNG(바닥 타일만 완전 불투명).
- **피벗은 `resource-properties.csv`에 반드시** (`key,width,height,pivot_x,pivot_y`). 한 번 불린 그림은 피벗을 고쳐도 메이커가 옛 피벗을 쓴다 (10-28 랜드마크 34장 재업로드 사고).
- 폴더마다 `png/` · `resource-mapping.csv`(`key,file,resource_name,category,ruid,border` — **ruid 빈칸**, 9-slice만 border에 `좌;우;위;아래`) · `resource-properties.csv` · `previews/` · `DELIVERY.txt`(만든 것 · 못 만든 것 · 고민한 점 · 반복 검사 숫자).
- `assets/`는 커밋하지 않는다. 업로드·RUID·게임 연결·메이커 확인은 Claude.

### 액트 색 (요약 — 전문은 각 요청서)

| 액트 | 색 |
|---|---|
| 1 잿빛 변경 | 진흙 갈색 · 마른 피 · 뼈 상아 · 녹슨 금 (`codex-a1-handmade-v2` 결) |
| 2 모래 폐허 | 모래 금 · 바랜 청록 · 사암 붉은 기 |
| 3 폭풍 해안 r2 | 바위 #181a23 · #222533 · #343740 · #4b4b51 · #73737b / 물 #1f3340 · #3f6773 · #5d8a93 · 반사 #a9cfd3 · 거품 #e4eef0 / 회청 모래 #7d8a88 · #95a09b / 해초 #2f4a45 · 따개비 #d9dcd6 · 녹슨 청동 #6f7a5a(조금). **갈색·주황 금지** |
| 4 불타는 심연 | 현무암 #15131a~#6b6370 · 재 #5a5552~#9c958e · 용암 #3a0d08~#ffc04a(틈·가장자리만) · 혼 보라 #5b2d7a · #9a5ad0(드물게) · 유황 탁한 황토 #8a7a3a |

## 진행 순서 (그림 샘플 승인제)

1. **샘플 먼저** → 사용자 승인:
   - A `a3-lighthouse-wall-borders-*` 9조각 1벌 + `a3-lighthouse-wall-face-s` 1장
   - B `ui_raid_edge_mark_2`(가운데 프레임) 1장 + `fx-raid-omen-a3-01` 1장 (액트 3이 색 맞추기가 가장 까다롭다) + `ui_raid_repelled_plate` 1장
   - C `a3-coast-rock-wall-r2-face-s` 1장 + `a4-fortress-wall-face-s` 1장
2. 승인되면 A·B·C 나머지.
3. D-1(안내 책갈피)은 10-27 샘플이 이미 승인된 결이라 **샘플 없이 바로**. D-2(예배당 벽)는 사용자 확인이 오면 A와 같은 방식(9조각 1벌 샘플)으로.
4. 시간이 모자라면 B-4(선택) → D-2 순으로 남긴다.

---

## A. 폭풍 등대 전용 벽 — `assets/codex-walltop-v1/`

**왜**: 폭풍 등대 1~3층 · 폭풍의 눈은 10-11 액트 3 첫 묶음의 `lighthouse-borders-*`(`codex-act3-v1/png/terrain/lighthouse-wall/`)를 그대로 쓴다.
- 잰 값: 평균 밝기 0.20 · 색상 204° — r2 해안 바위(0.35 · 218°)보다 훨씬 어둡고 결이 다르다 (10-11 1차 그림).
- 앞면 조각이 없어 9조각의 **윗단 가장자리(s·sw·se)를 앞면 띠로 1~3단 반복**한다 (`data/handmade/specs/act3.cjs` `LIGHT_HEIGHT` 줄 — `;raised lighthouse … face=lighthouse-borders back=lighthouse-borders-center`). 띠가 반투명이라 사이로 바다가 비쳐 울타리처럼 보여서, 벽 속 조각을 뒤에 한 장 더 깐다(`back=`, 설계 42 §6).

| 이름 | 크기 · 피벗 | 내용 | 쓰는 곳 (Claude) |
|---|---|---|---|
| `a3-lighthouse-wall-borders-{center,n,s,e,w,ne,nw,se,sw}` | 128×128 · 0.5/0.5 | 바다 위로 솟은 등대 석조. 윗면 가장자리(n·e·w·모서리)는 등대 층 바닥을 두른 낮은 돌 턱 — 소금 흰 얼룩, 녹슨 청동 꺾쇠 드물게. center는 두꺼운 등대 벽 속(돌 쌓기, 밝기 0.25 이상). 색은 액트 3 r2 바위 색 | 폭풍 등대 1~3층 · 폭풍의 눈 — 바깥 벽(`;wall # lighthouse` → `a3-lighthouse-wall`)과 높은 칸 테두리(`;raised a3-lighthouse-wall …`) |
| `a3-lighthouse-wall-face-{sw,s,se}` | 128×128 · 0.5/0.5 | 등대 외벽 **옆면**(남쪽 앞면): 큰 돌덩이 줄눈 · 위에서 흘러내린 소금 자국 · 젖은 짙은 회청. sw·se는 왼끝·오른끝(둥근 탑 곡면이 꺾여 들어가는 모서리). **완전 불투명** | 같은 맵 남쪽 앞면 띠 (`face=a3-lighthouse-wall-face`, `back=` 뺌) |

- **앞면은 위아래로도 이어 붙는다**: 층 높이만큼 1~3단 쌓는다(Claude가 단마다 1.0 → 0.68 → 0.46으로 어둡게 칠함). 윗변은 9조각 s 줄과, 아랫변은 자기 윗변과 이음매 없이.
- 앞면 안에 **물때 띠·거품 줄을 넣지 않는다** — 단마다 반복돼 줄무늬가 된다. 물에 닿는 맨 아래 거품은 Claude가 경계 띠(`a3-decal-shore-foam-edge-*-r2`)로 깐다.
- 미리보기:
  - `previews/lighthouse-walls-5x4.png` — 9조각으로 5×4 덩어리 + 남쪽에 앞면 3단(1.0/0.68/0.46로 칠한 모습), 바깥은 얕은 바다(`a3-shallow-sea-floor-r2`)
  - `previews/lighthouse-vs-coast-rock.png` — 새 등대 벽 · r2 해안 바위 · 지금 `lighthouse-borders` 나란히
  - `previews/screen-scale-19x11.png` — 128px를 56px로 줄여 19×11칸으로 깐 실제 한 화면. 줄지어 보이는 창·띠·금이 없어야 한다
- `resource-mapping.csv` 줄 예: `"a3-lighthouse-wall-face-s","png/a3-lighthouse-wall-face-s.png","a3-lighthouse-wall-face-s","wall","",""`

---

## B. 습격 그림 — `assets/codex-raid-v1/`

떼 몬스터는 기존 종 프레임 그대로 — **새 몬스터 그림 없음** (기획서 41 §6). 그림 안에 글자 없음: 「습격이 온다」(화면 위 띠) · 「습격 격퇴 · N마리」는 게임이 쓴다.

### B-1. 화면 가장자리 예고 표식 (1종 × 3프레임)

- 지금: 빨간 점(`ui_icons` `dot`을 #FF5A3A로 칠함) 30px이 숨 쉬듯 커졌다 작아진다 — `tools/build/ui.cjs:542` `RaidMark1~8`, `RootDesk/MyDesk/UI/Hud/HudMain.mlua` `RenderRaid`. 떼가 솟을 자리마다 하나, 화면 밖이면 가장자리 안쪽 48px에 붙는다.

| 이름 | 크기 · 피벗 | 내용 |
|---|---|---|
| `ui_raid_edge_mark_1` · `_2` · `_3` | 96×96 · 0.5/0.5 | 화면 밖에서 안쪽을 긁고 들어오는 **뼈 손톱 세 줄기** + 짙은 핏빛 테두리 빛. **오른쪽(→, 화면 밖 방향)을 향하게** 그린다 — Claude가 8방향으로 돌린다. 1 = 나타남(옅고 작게) · 2 = 긁음(가장 선명) · 3 = 흩어짐 |

- 게임에서 **40~48px**로 보인다 → 실루엣 굵게, 잔선 없이. 액트 공통 색(뼈 #e8dcc0 · 피 #b8322a · 외곽 #1a0c0c).
- 미리보기: `previews/edge-mark-8dir.png` — 실제 사냥터 캡처 위에 8방향으로 돌려 48px로 얹은 모습 · `edge-mark.gif` 3프레임 1회.

### B-2. 액트별 바닥 조짐 (4종 × 4프레임)

- 지금: 액트 장판 그림에 색만 입혀 쓴다 — 액트 1 독 장판(갈색) · 2 화염 장판(모래색) · 3 냉기 장판 · 4 용암 장판 (`HudMain.mlua` `RaidWarn` — `_Util:GroundDecal(…, 반지름 1.1)`). 떼가 솟을 자리 바닥에 3초 동안 깔린다.

| 이름 | 크기 · 피벗 | 내용 |
|---|---|---|
| `fx-raid-omen-a1-00~03` | 160×80 · 0.5/0 (발밑) | 액트 1 — 무덤 흙이 부풀어 갈라지고 틈으로 뼈 손끝 · 녹갈색 독 김 (진흙 갈색 · 마른 피 · 뼈) |
| `fx-raid-omen-a2-00~03` | 160×80 · 0.5/0 | 액트 2 — 가운데로 빨려드는 모래 소용돌이, 가장자리에 사암 부스러기 (모래 금 · 사암 붉은 기) |
| `fx-raid-omen-a3-00~03` | 160×80 · 0.5/0 | 액트 3 — 얕은 바다 물이 끓어오르는 거품 고리 + 가장자리 서리 결정 (r2 물색 · 거품 흰 · 냉기 하늘) |
| `fx-raid-omen-a4-00~03` | 160×80 · 0.5/0 | 액트 4 — 재 덮인 웅덩이가 갈라지며 껍질 사이로 용암 빛, 재 연기 (검붉은 껍질 · 용암 주황은 틈에만) |

- 4프레임 **반복**(00 → 03 → 00이 끊기지 않게, 약 150ms씩). 00은 작고 옅게, 03이 가장 부풂.
- 바깥쪽은 투명으로 옅어진다 — 지름 2.2칸 원을 덮게 늘여 깐다. 바닥 위 · 몬스터 몸 아래에 그려진다.
- 액트마다 **그 액트 바닥과 나란히 놓았을 때 한눈에 「뭔가 올라온다」**로 읽혀야 한다 (특히 액트 3 회청 바닥 위 회청 거품이 묻히지 않게 — 거품 흰·서리 하늘로 대비).
- 미리보기: `previews/omen-4acts.png`(액트별 바닥 4×4 위에 조짐 4프레임 한 줄씩) · `omen-a1~a4.gif`.

### B-3. 「습격 격퇴」 판 (1장 · 샘플 먼저)

- 지금: 화면 가운데 위 UX 띠에 「습격 격퇴 · N마리」 + 「골드 주머니 N이 발밑에 떨어졌다」 (`HudMain.mlua` `RaidDefeated`).
- **주의**: 10-28 사용자가 연쇄 처치 판(`ui_killstreak_plate_1~4`)을 「촌스럽다」고 빼고 머리 위 글자로 바꿨다. 같은 양식으로 그리지 않는다.

| 이름 | 크기 · 9-slice | 내용 |
|---|---|---|
| `ui_raid_repelled_plate` | 512×128 · border `좌;우;위;아래` 적어 줌 | **얇고 담백한 띠** — 어두운 반투명 바탕(가운데 비움) + 양 끝에만 작은 뼈·녹슨 금 장식. 가운데 줄에 게임 글자 34px 한 줄 + 아래 24px 한 줄이 들어간다 |

- 미리보기: `previews/repelled-plate.png` — 실제 화면 위에 임시 글자 「습격 격퇴 · 16마리」 · 「골드 주머니 120이 발밑에 떨어졌다」를 얹은 모습 (미리보기에만 글자). 지금 UX 띠와 나란히.
- 샘플이 반려되면 지금 UX 띠를 그대로 쓴다 (기획서 41 §6 「③은 없어도 구현된다」).

### B-4. (선택) 떼 우두머리 표식

| 이름 | 크기 · 피벗 | 내용 |
|---|---|---|
| `ui_raid_chief_mark` | 48×48 · 0.5/0 | 악몽·지옥 「떼 우두머리」 머리 위 작은 뼈 뿔 깃발 — 지금은 변종 푸른 몸으로 대신한다(`MonsterTraits.mlua:19`). 없어도 된다 |

---

## C. 「담 위」 앞면 · 끊긴 끝 — `assets/codex-walltop-v1/`

**이미 있는지 확인 (`data/art_sprites.csv`)**:

| 묶음 | 앞면 s·sw·se | 끊긴 끝 e·w | 이번 요청 |
|---|---|---|---|
| 액트 2 사암 담 `a2-sandstone-wall` (바람 무덤 사막) | 있음 (562~564줄) | 있음 (560~561줄) | **없음** |
| 액트 3 해안 바위 r2 `a3-coast-rock-wall-r2` (번개 절벽) | 없음 | 없음 | 5장 |
| 액트 4 성채 벽 `a4-fortress-wall` (악마의 행군로) | 없음 | 없음 | 5장 |

(`a3-coast-rock-wall-borders-*` r1 갈색 9조각은 있지만 r2로 대체돼 안 쓴다. 지금 번개 절벽·행군로는 9조각의 윗단 가장자리 s·sw·se를 앞면으로 반복한다 — `specs/act3.cjs` stormcliff · `specs/act4.cjs` demonroad의 `face=<묶음>-borders`.)

**이름은 빌더가 찾는 꼴 그대로** (`tools/build/handmade/lib.cjs:366~367` — `<묶음>-face-s/sw/se` · `<묶음>-broken-e/w`):

| 이름 | 크기 · 피벗 | 내용 | 쓰는 곳 (Claude) |
|---|---|---|---|
| `a3-coast-rock-wall-r2-face-{sw,s,se}` | 128×128 · 0.5/0.5 | 해안 바위 r2 담의 **남쪽 앞면** — 젖은 푸른 동굴 색 바위 절벽, 해초 #2f4a45 · 따개비 흰 점 드물게. 9조각 s 줄 아래에 이음매 없이, 위아래로도 이어 붙게 | 번개 절벽 절벽 능선 2단(`face=a3-coast-rock-wall-r2-face`) |
| `a3-coast-rock-wall-r2-broken-{e,w}` | 128×128 · 0.5/0.5 | 한 칸 너비 바위 담길이 가로로 **끊긴 끝** — 무너져 바다로 굴러떨어진 바위 | 번개 절벽 능선 끝 |
| `a4-fortress-wall-face-{sw,s,se}` | 128×128 · 0.5/0.5 | 악마 성채 석벽의 **남쪽 앞면** — 검은 석재 · 쇠 가시 줄 · 그을음, 성벽 총안 같은 큰 무늬는 한 장에 1곳 이하 | 악마의 행군로 성벽 2단 + 성채 줄기 4장(`;raised a4-fortress-wall` — 불타는 성채 외곽 · 재의 회랑 · 옥좌의 전실 · 군주의 옥좌)도 같이 좋아진다 |
| `a4-fortress-wall-broken-{e,w}` | 128×128 · 0.5/0.5 | 성벽 담길이 **무너져 끊긴 끝** — 부서진 돌덩이 · 휜 쇠 가시, 아래는 용암 쪽으로 무너짐 | 행군로 성벽 끝 |

- 앞면 안에 **아랫단 빛·거품 줄을 넣지 않는다** (층 겹쌓기로 단마다 반복됨). 바다 거품 · 용암 빛 경계는 Claude가 띠 그림(`a3-decal-shore-foam-edge-*-r2` · `a4-decal-lava-edge-*`)으로 맨 아래에만 깐다.
- 앞면 결 기준: 승인된 `a2-sandstone-wall-face-*`(1칸 높이 앞면 · 9조각 s 줄과 이음매 없음)와 `a4-basalt-cliff-r2-borders-s`(주상 절리 앞면).
- 미리보기:
  - `previews/walltop-a3.png` · `walltop-a4.png` — 9조각 + 앞면 + 끊긴 끝으로 「담 위」 덩어리(가로로 길게 끊긴 담길 포함) 8×5, 낮은 칸은 얕은 바다 / 용암 바다. 앞면 2단 쌓기(1.0/0.68)
  - `previews/walltop-3acts.png` — 액트 2 승인본(가라앉은 대로 담 위) · 액트 3 · 액트 4 나란히
  - `previews/screen-scale-19x11.png`에 앞면 줄을 같이 깔아 줄무늬 여부 확인

**이번엔 넣지 않은 것**: 혼 핏줄 벽(`a4-abyss-vein-wall`) · 사원 기둥벽(`a2-temple-pillar-wall`, 지금 사암 담 앞면을 빌림) · 현무암 절벽 r2의 전용 앞면 — 설계 42 §6에서 「반복 띠가 겹으로 쌓인 층으로 읽힌다」로 지금 모습이 승인됐다. 시안에서 어색해지면 그때 3장씩 소량 추가.

---

## D. 감사에서 나온 재요청

### D-1. 안내 책갈피 아이콘 6 + 화면 테두리 1 — `assets/codex-guide-ui-v1/` (이어서)

10-27 요청서 [codex-guide-ui-20261027.md](codex-guide-ui-20261027.md) 표 그대로. 샘플 3장(군단 아이콘 · 책갈피 보통·고름)은 게임에 들어갔고(`ui_icons` `guide_tab` · `guide_tab_on` · `guide_legion`), 나머지 6칸은 메뉴 아이콘을 빌려 쓴다 (`tools/build/ui.cjs:759`).

| 이름 | 크기 | 내용 (10-27 표) |
|---|---|---|
| `guide-tab-start` | 96×96 (게임 46) | 시작하기 — 펼친 낡은 책 + 보라 혼불 |
| `guide-tab-growth` | 96×96 | 성장 — 뼈 손이 쥔 보라 별, 위로 오르는 빛 |
| `guide-tab-gear` | 96×96 | 장비·파밍 — 바닥의 투구 + 위로 선 금빛 기둥 |
| `guide-tab-adventure` | 96×96 | 모험 — 말린 지도 + 붉은 표시 |
| `guide-tab-together` | 96×96 | 함께하기 — 등 맞댄 두건 네크로맨서 둘 (기존 `icon_party`와 겹치지 않게) |
| `guide-tab-danger` | 96×96 | 위험 신호 — 바닥의 붉은 원 + 가운데 작은 해골 경고 |
| `guide-screen-frame` | 896×518 · 9-slice (border 적어 줌) | 화면 칸 테두리 — 얇은 청동 액자 + 네 모서리 작은 해골·보라 혼불, 가운데 완전히 투명 |

- 결: 승인된 `guide-tab-legion` 그대로. 샘플 없이 바로.
- 미리보기: `previews/guide-window-full.png` — 지금 안내 창 캡처 위에 7개 책갈피 + 화면 테두리를 얹은 모습.
- `resource-mapping.csv`에 7줄 추가 (ruid 빈칸, 테두리는 border 칸).

### D-2. (사용자 확인 뒤) 물에 잠긴 예배당 벽 r2 — `assets/codex-walltop-v1/`

- 물에 잠긴 예배당(`seachapel`)이 10-11 `chapel-borders-*`(평균 밝기 0.22, 1차 결)를 그대로 쓴다 — 등대 벽과 같은 문제. 심연 7층(`map_layouts` depth7)도 같은 벽.
- `a3-chapel-wall-borders-{center,n,s,e,w,ne,nw,se,sw}` 128×128 — 물에 반쯤 잠긴 예배당 석벽, 푸른 불 향로 빛이 비친 젖은 돌 · 깨진 스테인드글라스 조각은 한 장에 1곳 이하. A와 같은 r2 색 · 같은 미리보기(5×4 · 나란히 · 19×11).
- 사용자가 「진행」하면 9조각 1벌 샘플 → 승인 → 끝.

### D-3. 공통 백로그 — `assets/codex-common-backlog-v1/` 정리 안내

10-29 00:13에 이 폴더를 열어 10-11 [공통 백로그](codex-art-backlog-20261011.md)를 시작한 것으로 보인다 (요청서 사본만, png 0). 10-11 이후 많이 바뀌었으니 **아래를 빼고**, 저주 표식부터 한다.

| 백로그 절 | 처리 |
|---|---|
| §1 버프·디버프 칩 6 | **빼기** — 받아서 쓰는 중 |
| §2 스킬 아이콘 29 | **빼기** — 모든 스킬이 자기 아이콘. `blast_*`·`revive_*`는 스킬이 없어짐 |
| §3 몬스터 머리 위 저주 표식 | **맨 앞** — `mark_amp`(약화의 낙인) · `mark_weaken`(쇠약) · `mark_thorn`(가시 저주) · `mark_terror`(공포) · `mark_confuse`(혼란 = 광란) · `mark_lifetap`(생명 약탈) · `mark_decay`(쇠퇴) · `mark_resist`(저항 붕괴) · `mark_root`(골격 감옥) + `mark_poison` · `mark_chill`. 32×32, 굵은 윤곽 단색 상징. 지금은 스킬 아이콘 128px를 0.14배로 줄여 띄워 알아보기 어렵다 (`MonsterStatus.mlua:745`). 미리보기: 몬스터 머리 위에 1~3개 나란히(0.26칸 간격) 얹은 실제 크기 |
| §4 아군 해골 전사·마법사 · 마력탄 | 변이 8종(방패·쌍칼·대검 · 마법사 5)은 **빼기**. 기본형·마력탄은 사용자 확인 뒤 |
| §5 스킬 이펙트 7 · §6 맵 오브젝트 · §7 아이템 · §8 메뉴·공격 단추 · 선택 변종 아이콘 12 | 사용자 확인 뒤 (감사 a-2 표). 그중 **빼기**: 동료 초상 4(썸네일로 해결) · 액트 1 NPC 고르·오렌·하르크·사디크 · 징 박힌 허리띠 · 금화 · 액트 1 몬스터 · 드롭 빛기둥 |

### D-4. 원형 예고 테두리 — 사용자 결정 대기 (이번 요청 아님)

`codex-telegraph-rim-r2-v1` 5색은 10-21에 납품됐지만 승인·업로드 없이 멈췄다. 게임은 Claude 임시 `claude-telegraph-v1`을 쓰고, 10-28 보스 선 예고 정식 그림도 그 색에 맞췄다. 바꿀지 사용자가 정하면 그때 요청한다.

---

## E. 돌려받은 뒤 Claude가 할 일

- 업로드(피벗 표대로 — 처음 불리기 전에) → `art_sprites.csv`(벽·앞면·끊긴 끝은 `border-atlas`) · `ui_icons.csv`(`ui_raid_*` · `guide-*` · `mark_*`).
- A: `specs/act3.cjs` 등대 4장 — 벽 `lighthouse` → `a3-lighthouse-wall`, `LIGHT_HEIGHT` → `face=a3-lighthouse-wall-face`, `back=` 빼고 메이커에서 띠 사이 비침 확인.
- B: `HudMain.RaidWarn`의 임시 장판 4줄 → `fx-raid-omen-aN` 4프레임(`Util.TeleFrames`처럼 프레임 목록 · `GameConst`에 `SpriteRaidOmen`), `RaidMark1~8` → `ui_raid_edge_mark_1~3`(방향으로 돌림 · 프레임 순환), 격퇴 판 승인 시 `RaidDefeated`의 UX 띠 → 판.
- C: 번개 절벽 · 행군로 `face=` 한 칸 교체. **끊긴 끝은 지금 「담 위」 방식(층 겹쌓기 아님)에서만 붙는다**(`lib.cjs:367~371`) → 받기 전에 `top=zone` 갈래에도 같은 판정을 넣는다.
- D-1: `ui.cjs:759` 책갈피 아이콘 6칸 교체 + 화면 칸 테두리.
- 맵 다시 짓고 메이커 전수 캡처(액트 2·3·4 「담 위」 3장 · 등대 4장)와 습격 예고 실제 화면을 나란히 보고.


## 사용자 확인 (10-29 01:10)

- 물에 잠긴 예배당 벽 r2 9장: **넣음** — D절 재요청에 포함해 보낸다.
- 원형 예고 테두리(10-21): **폐기** — 보스 패턴이 선·방향으로 바뀌어 쓸 곳이 없다. 요청서에서 뺀다.
