# 48 연출 V2 · 갈래 C — 데이터·문구·등록 검증표 (2026-10-30)

브랜치 `wip/s48v2-C-data` · 기반 `83936d93` · 메이커 미사용(오프라인 검사만) · 요청 `summon48-spectacle-execution-request.txt` §2·§5

## 1. 데이터 (전 → 후)

| 표 | 칸 | 전 | 후 |
|---|---|---|---|
| `rite_giants.csv` mage | `s1Radius` (노바 타격·자동 발동 판정·효과 지름 원천) | 2.5 | **3.75** (지름 5 → 7.5) |
| 〃 | `s1Opts` | `min=2;chant=0.3;grow=0.5;inner=0.5;ring=0.4` | `min=2;chant=0.3;grow=0.5;inner=0.5;novaAmpMul=1.5` |
| 〃 | 메테오 `s2Opts` | `radius=1.8;radiusMax=2;…` | 그대로 (상한 2.0 유지) |
| `skills.csv` giant_mage_pull | 이름 | 두 겹 고리 | **폭발 증폭** (id·필요 랭크·택일 묶음·아이콘 RUID 그대로) |
| 〃 | 설명 | 화염 노바가 0.4초 뒤 한 번 더 퍼진다 · ×0.5 (원소 붕괴와 둘 중 하나) | 화염 노바가 한 번에 더 세게 터진다 · 피해 ×1.5 (원소 붕괴와 둘 중 하나) |
| 〃 giant_mage_resist | 설명 괄호 | (두 겹 고리와 둘 중 하나) | (폭발 증폭과 둘 중 하나) |

- `ring=0.4`는 어느 코드도 읽지 않던 둘째 파동 지연이다. 노바를 단발로 바꾸면서 지웠다. 이제 `check_data`가 이 칸이 다시 들어오면 막는다.
- `novaAmpMul`은 노드가 있을 때 단발 한 번에 곱하는 계수다. 예전 첫 파동 ×1과 둘째 파동 ×0.5를 합친 값이다. 노드가 없으면 ×1.0이다. 이 값을 읽어 실제 피해에 쓰는 일은 갈래 B(`RiteGiantMoves`)가 맡는다.

## 2. 문구 (현재/다음)
- `SkillBook.NovaText()`를 새로 두었다. `giant_mage_pull`의 요약 줄은 「노바 폭발 피해 ×1.5 · 반경 3.75칸」이다. 이 값은 `rite_giants.csv`에서 바로 읽으므로 실제 타격 값과 같다.
- 스킬 창(`SkillWindow.StatLine`)은 구조를 바꾸지 않았다. 배우기 전에는 「배우면: …」, 배운 뒤에는 「지금: …」이 보인다. 1랭크 노드라 다음 랭크 줄은 없다.
- 변경을 해명하는 알림은 만들지 않았다. 저장 판(sv 5)·이전 처리(48-3)·환급은 손대지 않았다.
- 아이콘(코덱스 C-ICON-01 확정): 새 단일 폭발 그림을 채택했다. `ui_icons.csv`의 키를 `node-giant_mage_pull`에서 `node-explosion-amplification`으로 바꿨다.
  - **등록이 필요하다.** 이미지 원본은 `node-explosion-amplification-v2`(96px)다.
  - RUID가 오기 전에는 옛 두 겹 고리 RUID `359fd9b9…`로 대체한다. 빈 칸은 쓰지 않는다.
  - 업로드 뒤에는 부모가 이 줄과 `skills.csv` giant_mage_pull의 `icon` 칸을 같은 RUID로 바꾼다. `check_data`가 두 칸이 같은지, 빈 칸이 없는지, 옛 키가 남지 않았는지 막는다.
- 문구(C-COPY-01): 추천안을 그대로 확정했다.

## 3. 등록 검증표 `tools/register_giant_visuals.cjs` (전 → 후)

| 대상 | 전 (구 납품 강제) | 후 (구 납품 + V2) |
|---|---|---|
| 기본 6동작 | stand4·move6·attack6·skill6·hit2·split6 = 150 | 같음 (V4 canon) |
| 방패 skill1 함성 몸 | 0 (금지) | 8~12 (V2) · 타격 칸 0~1 |
| 방패 skill2 내려찍기 몸 | 정확히 6 | 6(구) · **12**(V2) |
| 대검 skill1 회전 몸 | 4~6 · 반복 금지 | 4~6(구) · **12~16**(V2 · 코덱스 확정 후속 — 16을 채우려 복제 금지) · 반복 허용, 한 바퀴가 `gap` 0.4초의 1배나 2배가 아니면 경고 |
| 대검 skill2 땅 가르기 몸 | 정확히 6 | 6(구) · **12~16**(V2) |
| 쌍칼 skill2 | 4~6 | 같음 |
| 마법사 skill1 / skill2 | 0 / 6 | 3(기도 앞 재사용) / 6 · 아트를 바꾸면 이 표의 값만 고친다 |
| 효과(kind fx) | 없음 | 노바 16(타격 칸 **정확히 1** · 둘째 파동 금지) · 회전 16 · 균열 16 · 내려찍기 12~16 · 함성 12 |

공통으로 보는 것:
- 칸마다 시간이 양수인지
- 지속 합 범위: V2 묶음은 벗어나면 오류, 구 납품은 경고
- 반복 허용 여부와 타격 칸 수
- 같은 그림이 연달아 나오는 중복 장: V2는 오류, 구 납품은 경고
- 떨어진 칸에서 같은 그림을 다시 쓰는 경우와 블렌드·보간 이름: 경고
- 효과는 장마다 캔버스 크기가 같은지
- 몸 칸이 1/30초보다 짧으면 **경고만** 하고 통과시킨다. 렌더·갱신 주기에 따라 그 구간이 건너뛰어지거나 길어질 수 있다는 뜻이다.
  - 처음에는 오류로 넣었다가 코덱스 정정으로 낮췄다. 1/30초는 엔진 상한도 필수 규칙도 아니다. 60Hz에서는 16장/0.4초(25ms)도 재생된다.
  - 30fps 하드캡이나 무조건 지연은 넣지 않는다.
- 효과 칸이 0.04초보다 짧으면 경고다. `spec.sec`를 써야 한다는 안내를 붙인다.
- 방패 함성 몸(shield skill1 · 8~12장)은 이미 검증표에 있었다. selftest에 7장·13장·반복 위반 검출을 더했다.
- 함성 상태 키는 A와 같은 `skill1`이다. 납품이 `roar`로 오면 `STATE_ALIAS` 한 곳에서만 `skill1`로 바꿔 읽는다.
  - monster_frames에는 `skill1`로 쓴다.
  - `skill1` 줄과 `roar` 줄이 둘 다 있으면 줄 중복 오류다.

추가한 명령:
- `check --manifest 결과.json [--strict]`: 아트 매니페스트의 sha를 대기표와 맞춰 본다.
- `check-frames`: 지금 `monster_frames.csv`의 `form_giant_*` 줄을 같은 검증표로 검사한다.
- `fx-audit`: 지금 걸린 효과의 장 수를 새 목표와 비교해 보여 준다.
- `selftest`
- `apply`: 결과 monster_frames를 다시 검사한 뒤에 쓴다. 효과 「|」 문자열은 화면에 보이기만 한다(그 파일은 부모·B 소유).

## 4. monster_frames 스키마
열은 그대로 둔다: `monster,state,frames,delays,loop,clip,impact`.
- `impact`가 타격 칸(hitFrame, 0부터)이다. gen_data는 이 값을 `s = impact+1`로 내보낸다.
- `loop`와 `delays`도 이미 있어서 새 열은 필요 없다.
- 새로 정한 규칙: V2 묶음 기술 몸 줄(12~16장 등)은 `impact`가 반드시 있어야 한다. `check_data`가 거인 줄 전부를 `checkFrames`로 검사한다.
- 다른 몬스터 줄도 함께 본다: 장 수와 시간 수가 같은지, 시간이 양수인지, loop 값, impact 범위.

### loopFrom (설계 메모 · 아직 추가하지 않음)
회전 몸에 앞 감기 장이 따로 생기면 반복 시작 칸이 필요하다. 그때 이렇게 넣는다.
- `monster_frames.csv`에 `loopFrom` 열을 둔다. 0부터 센 칸 번호이고, 비면 0이다.
- gen_data는 이 값을 MonsterFrames 동작 표에 `ls = loopFrom+1`로 내보낸다. impact → `s`와 같은 방식이다.
- MotionSmoother.FrameClip(갈래 A)은 반복할 때 `ls`번째 칸으로 돌아간다.
- 검증표는 `0 ≤ loopFrom < n`, `loop = true`일 때만 허용하고, 한 바퀴 합은 `ls`부터 센다.

지금은 이 값을 쓰는 곳이 없어서 열을 추가하지 않았다.

## 5. 검사 (모두 통과)
- `npm test` 16/16 (「거인 그림 검증표 자체 테스트」 단계를 새로 넣음)
- `register_giant_visuals selftest` 48/48 (회전 몸 12·16 양끝 통과 · 17장 · 16장 복제 채움 · 몸 1/30초 미만은 경고·통과 · 함성 7·13장·반복 검출 · roar 별칭 포함)
  - 통과해야 하는 경우: 지금 대기표, 구 납품, V2 새 범위와 그 경계, 지금 monster_frames
  - 잡아야 하는 위반 변이 17종: 장 수, 노바 타격 칸 둘, 중복 장, 시간 0, 반복, 타격 칸 없음, 지속 초과, 기본 거인 기술 몸, impact 비움·범위 밖 등
  - 경고 4종, 매니페스트 3종
- check_data 변이 11/11을 잡았다: 반경 4, ring, 계수 2, 계수 없음, 메테오 2.2, 옛 이름, 흡인 글귀, 새 아이콘 키 빈 RUID, icon·키 RUID 불일치, 옛 키 남김, 거인 impact 범위 밖. 시험 스크립트는 작업 폴더 밖(scratchpad)에 있다.
- quality `skills`·`giant_skills`·`giant_fire`·`giant_moves`·`mage_school`·`roster` 통과
  - skills 그룹에 새로 넣은 것: 「폭발 증폭」 이름·설명·요약 줄, 노바 데이터 3.75·1.5·ring 없음
  - sv 5 저장의 giant_mage_pull=1은 그대로 남고 환급 0이다. 다시 저장해도 sv 5이고, 다시 읽어도 환급 0이다.

## 7. 효과 출력을 B 새 자리로 (B 73fc0393 요청)
`fxStrings`·`apply`는 효과마다 「연속본 자리 + *Opts 계약 문자열」을 출력한다. 파일에 쓰지 않고 보이기만 하며, 넣는 일은 부모가 한다.

| 효과 · 층 | 연속본 자리 | 계약 자리 · order |
|---|---|---|
| 노바(한 층) · 뒤 층 | FxGiantNova | FxGiantNovaOpts · 1 |
| 노바 앞 층 | FxGiantNovaFront (**제안** — B 자리 없음) | FxGiantNovaFrontOpts · 6 |
| 회전 뒤 / 앞 (back은 rear 별칭) | FxGiantSpinBack / FxGiantSpinFront | FxGiantSpinOpts · 1 / 6 |
| 균열 | FxGiantRiftSeq | FxGiantRiftOpts · 1 |
| 내려찍기 뒤 / 앞 | FxGiantSlamSeq / FxGiantSlamFront | FxGiantSlamOpts · 1 / FxGiantSlamFrontOpts · 6 |
| 함성 / 앞 별 | FxGiantRoarSeq / FxGiantRoarFront (**제안**) | FxGiantRoarOpts · 1 (납품 behind_radial) / 6 |

- 계약 문자열에 넣는 값:
  - `w·h`: 원본 px
  - `ref`: 노바 7.5, 회전 3.2
  - `impact`: hitFrame+1
  - `durations`: 장마다 ms가 다를 때와 부분 파생 층일 때만 넣는다. **제안 키**이고 B GiantFxFrameSec는 아직 이 키를 읽지 않는다. 계약 칸 구분자 「;」와 겹치지 않도록 「,」로 잇는다.
  - `order`
- 기존 계약 키 span·ax·ay·dy·face·flip은 부모가 이미지 메타데이터로 합친다.
- 노바 w·h: 조정자 메시지의 11.43·9.14는 칸 단위다. B 계약은 w·h를 **원본 px**로 읽으므로 `w=640;h=512;ref=7.5`로 출력한다. 이 값이면 B의 배율이 100/56이 되어 캔버스가 11.43×9.14칸으로 그려진다.
- 노바 타격 칸: 정점 index 6(160ms)을 `impact=7`로 넣는다.
- 반복 효과(회전)는 B의 cycle 규칙이 간격을 정한다. 그래서 0.04초 바닥 경고를 내지 않는다.
- `intake-fx 「manifest」 [--layers] [--write]`: 노바 매니페스트를 대기표 효과 줄로 바꾼다. 파일 sha를 다시 재고, peak 칸을 타격 칸으로 잡고, 장별 ms를 그대로 쓴다. 앞/뒤 층은 파생 층으로 넣는다.

## 8. full133 납품 인수 — 대검 64 · 방패 52 (계약 summon48-spectacle-full-art-integration-contract)
`intake-art --nova … --greatsword … --shield … --out docs/evidence/2026-10-30-s48v2-C/full-art-rows`가 초안 세 개를 만든다. 모든 RUID 칸은 비워 둔다.
- `pending-draft.csv`: 지금 대기표 155줄 + 새 줄 204줄 = 359줄
- `monster_frames-draft.csv`: key·sha·delays·loop·impact·캔버스
- `fx-slots-draft.json`: 위 표의 출력 + 접점·미러 메타데이터

| 납품 | 대기표 줄 | 장 · 시간 · 타격 칸 |
|---|---|---|
| 대검 몸 skill1 회전 | giant-greatsword-skill1-01~16 | 16 × 25ms 반복(0.4초 = gap) · impact 0 · 캔버스 384×224, 발 피벗 38/224 |
| 대검 몸 skill2 균열 | giant-greatsword-skill2-01~16 | 합 550ms · impact 9(300ms) |
| 대검 효과 회전 | giant-fx-spin-01~16 + 뒤/앞 층 32 | 16 × 25ms 반복 · ref 3.2 · 층은 새 프레임 아님 |
| 대검 효과 균열 | giant-fx-rift-01~16 | 접점 300ms에 시작 · 0.65초를 16장에 고르게 나눔 · impact 1 |
| 방패 몸 skill2 내려찍기 | giant-shield-skill2-01~12 | 20~60ms 합 440 · impact 6(120ms) · 256×256 |
| 방패 몸 skill1 함성 | giant-shield-skill1-01~12 | 12 × 50ms · impact 비움 (아래 참고) |
| 방패 효과 내려찍기 | giant-fx-slam-01~16 + 앞 별 3 | 몸과 t0에 같이 시작 · impact 4(index 3 = 120ms 지면 접점) · 장별 ms |
| 방패 효과 함성 | giant-fx-roar-01~12 + 앞 별 5 | 12 × 50ms · 0~4 축광, 5부터 방사 |

- 노바 17 중 16장은 위와 같다. 남은 1장(node 아이콘)은 대기표 대상이 아니다.
- **함성 impact를 비운 이유**: 계약은 「FX는 몸 t0에 같이 시작, skill1Hit만큼 다시 늦추지 않음」이다. 그런데 B 코드는 skill1Hit 뒤에 FX를 시작한다. impact를 넣으면 FX가 늦어지므로 비웠다. 방사 원점 칸은 몸 index 5이고, 메타데이터로 넘긴다.
- **내려찍기 시작 시각**: 몸 index 6과 FX index 3이 모두 120ms에 오도록 t0에 동시 시작한다. 지금 B는 FX를 몸 타격 칸에 시작한다 → patch 요청.

규칙 보완:
- V2 기술 몸은 납품 캔버스를 그대로 받는다. 한 동작 안에서는 캔버스·피벗이 같아야 한다. 구 납품 묶음은 여전히 192 규격이다.
- 파생 층(derived · source_index0)은 새 프레임 수에 넣지 않는다.
  - 장 수는 원본 이하여야 한다.
  - 원본 칸 번호는 순서대로 늘어나야 한다.
  - 시간·반복은 원본 그 칸과 같아야 한다.

검사:
- `check --pending full-art-rows/pending-draft.csv --manifest 노바 --manifest 대검 --manifest 방패`: 문제 0
- 매니페스트 sha 대조: 노바 16/16, 대검 96/96(본 64 + 층 32), 방패 52/52
- 경고는 짧은 칸뿐이다(몸 <1/30초, 효과 <0.04초 → durations 필요). 경고는 통과로 친다.
- monster_frames 검사: 새 기술 몸 4줄을 sha로 가짜 RUID를 채운 상태에서 문제 0
- selftest 79/79 (실제 납품 인수 7항목 포함)
- `npm test` 16/16, `check_data` 0

## 9. 한계
- 생성물(`GameData.mlua`·`SkillData.mlua`)은 로컬 검증에만 썼고 커밋하지 않았다. 부모가 통합할 때 `node tools/gen_data.cjs`로 다시 만든다. 이 브랜치만으로는 `gen_data --check`가 실패한다.
- `giant_skills.lua`(갈래 B 소유)는 G.mage를 직접 2.5·ring으로 설정한다. B가 단발로 바꿀 때 같이 고친다.
- 효과 연속본과 기술 몸은 업로드 전이라 RUID가 없다. 실제 재생 시각, 레이어, 접점(ax·ay), 미러, 메이커 표시는 확인하지 않았다.
- 실제 납품 selftest는 작업 폴더(Documents/New project/art-…)가 있을 때만 돈다. 없으면 건너뛴다.
- 스틸 블렌드는 sha와 이름 단서로만 의심한다. 픽셀은 비교하지 않는다.
