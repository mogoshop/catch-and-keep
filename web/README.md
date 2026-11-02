# 메이플 리저렉션 — 개발 자료실 (개발명 잡으면 내편)

세션과 무관한 고정 주소에서 스킬 애니메이션, 맵 전수 목록, 정책과 기준 시점을 보는 정적 웹입니다.
서버·DB·런타임 패키지 의존성은 없습니다. Node 20 이상을 사용합니다.

## 공개 소스와 비공개 자료

이 저장소는 공개이므로 사용자 선택에 따라 웹 소스만 커밋합니다.
`content/`(에셋/맵/정책), `dist/`, `.vercel/`, `.env*`는 Git에서 제외합니다.
자료는 Vercel Authentication의 **All Deployments** 보호 아래 빌드 결과로만 올립니다.
검색 차단 헤더는 로그인 보호를 대체하지 않습니다.

## 폴더 · 경로

- `scripts/site.mjs`: 경로마다 HTML을 만드는 정적 사전 렌더(틀 = 상단 내비 + 본문 1200px + 푸터 · 페이지별 title/description/OG · SVG 아이콘 한 세트)
- `scripts/check-site.mjs`: 빌드 끝 검사 — 라우트 수 · 내부 링크 깨짐 0 · 해시 링크 0(`#main` 건너뛰기만) · 이모지 0 · `/skills/` HTML 300KB 이하. 하나라도 걸리면 빌드 실패
- `public/`: `site.css`(토큰·구성 요소 한 벌) · `site.js`(접힘 메뉴·목록 필터 `?q= ?act= ?role= ?cat=`·옛 해시 주소 옮기기) · `fonts/`(Pretendard 400·600·800 woff2, KS X 1001 한글 2350자+기호+라틴 서브셋, OFL) · `img/hero-wasteland.webp`(홈 히어로 · 실제 게임 장면)
- `templates/skills-views.js`: 대조표·아이콘·상세·효과 카드 조각(순수 함수) — 빌드가 node:vm으로 미리 렌더하고 브라우저도 같은 함수로 다시 그림
- `templates/skills-app.js`: 스킬 화면 동작(프레임 재생·크게 보기·효과 고르기·장면 보기·추천). 빌드가 두 파일을 이어 `/skills/app.js`로 냄
- `content/`: 로컬 비공개 자료 묶음(Git 제외) · `dist/`: 검증된 정적 결과(Git 제외)

| 경로 | 화면 |
|---|---|
| `/` | 홈(히어로·세 입구·최신 스냅샷·바뀐 것) |
| `/skills/` · `/skills/fx/` · `/skills/summons/` · `/skills/icons/` · `/skills/pick/` | 대조표(기본) · 효과 · 거인·소환물 · 아이콘 · 효과 고르기(`?view=compare&slot=`) |
| `/skills/<id>/` | 스킬 상세(메인 스킬마다) |
| `/maps/` · `/maps/<id>/` | 맵 목록(액트·역할·검색) · 맵 상세(그림 고르기·제원·이전/다음) |
| `/rules/` · `/rules/<id>/` | 규칙 목록 · 상세 |
| `/changelog/` | 스냅샷 기록 |
| `/404.html` | 없는 주소 |

옛 주소: `/assets/` → `/skills/`(308), `/#maps` → `/maps/`, `/assets/#pick/…` → `/skills/pick/?view=…`(클라이언트).
`npm run publish`는 Build Output API(prebuilt)라 `vercel.json`을 읽지 않으므로 같은 규칙(리다이렉트·끝 `/`·404)을 `build.mjs`가 `.vercel/output/config.json`에 씁니다. `npm run preview`(scripts/serve.mjs)도 같은 규칙입니다.
그림 경로: 자료의 `media/…`는 화면에 싣는 사본에서만 `/assets/media/…`로 바꿉니다(자료 원본·해시 검사는 그대로).

## 기존 납품 가져오기

```sh
cd web
npm run import -- --atlas /path/to/atlas --maps /path/to/maps --policies /path/to/policies
npm test
npm run build
npm run preview
```

atlas 폴더는 `catalog.json`, `media-manifest.json`, `media/`를 포함합니다.
바꿀 묶음만 주면 됩니다. 예: 스킬 자료만 새로 `npm run import -- --atlas <새 atlas>` (맵·정책은 그대로).
atlas 묶음은 자기 폴더의 스크립트로 다시 만듭니다(README.txt 순서 · `refresh-runtime-audit.py` → … → `build-changes.py` → `verify-atlas.py`).
`catalog.changes`(직전 묶음 대비 이름 바뀜·아이콘 교체·신규·삭제)가 있으면 대조표에 「변경됨」 배지로 보이고, 옛 아이콘도 매니페스트 해시로 검사해 함께 배포합니다.
maps 폴더는 `maps.json`, `media/`를, policies 폴더는 `policies.json`을 포함합니다.
가져오기는 복사만 하며 원본 게임 데이터와 이미지를 수정하지 않습니다.
절대 로컬 경로를 제거하고 에셋 SHA, 파일 경로, 필수 카탈로그를 빌드에서 검사합니다.
자료가 없거나 깨진 빌드는 실패하며 빈 화면으로 기존 배포를 덮지 않습니다.

## 효과 고르기(자리별 비교) 자료

`/skills/pick/`(효과 고르기)은 스킬 효과 자리(슬롯)마다 현재 사용 중 / 코덱스 FX 후보 / 메이플(MSW 리소스) 클립을
같은 이름·순서로 나란히 보여 주고, 브라우저 localStorage에 고른 것과 메모를 저장해 「선택 내보내기」로 복사합니다.

```sh
npm run slots -- --game /path/to/game-checkout --ref origin/main --atlas /path/to/atlas
npm test && npm run build
```

- 자리 목록과 이름은 `scripts/slot-defs.mjs`(공개 소스)에 있습니다.
- 생성기는 게임 체크아웃을 읽기만 합니다(`git show`/`git log`, `assets/` PNG). 현재 연결은 지정한 커밋의 상수 선언으로 정합니다.
- 카탈로그 뒤에 납품된 `assets/codex-skill-fx-v3`(통일 공정) 그림을 함께 넣습니다.
- 메이플 클립은 게임 체크아웃의 msw-search 래퍼(`getResource`/`getResourcesBatch`)로 프레임 스프라이트 썸네일 PNG와 미리보기 GIF 간격을 받습니다.
- 결과는 `content/assets/slots.json`, `slots-manifest.json`(SHA-256), `media/slots/`에만 씁니다(Git 제외). 빌드는 이 해시도 검사합니다.
- `slots.json`이 없으면 빌드는 경고만 하고 탭에 빈 상태를 보여 줍니다.
- 「메이플 후보 · 검색」은 자리마다 MSW 리소스 검색으로 고른 클립 3개입니다. 목록은 `scripts/maple-picks.mjs`에 고정되어 있어 `npm run slots`를 다시 돌려도 바뀌지 않습니다.
  검색을 새로 하려면 `node scripts/maple-search.mjs --game <checkout> --write`(검색어·해골 제외 자리는 그 파일 안) 뒤 결과를 검토하고 커밋합니다.
  새 자리만 찾으려면 `--only <자리 id,자리 id>`를 붙입니다. 다른 자리의 고정 후보는 그대로 두고 그 자리들만 새 검색 결과로 바꿉니다.

## 효과 고르기 · 장면 보기 자료

「효과 고르기」의 **장면 보기** 단추를 켜면 후보마다 캔버스 하나에
(바탕) 맵 조각 → (뒤층) 발밑 효과 → 몬스터 → 캐릭터·소환수·거인 → (앞층) 효과 순으로 겹쳐 재생합니다.
한 자리의 후보는 같은 장면에서 같은 시각부터 재생됩니다. 웹 합성(근사)이며 메이커 실녹화가 아닙니다.

```sh
npm run scene -- --game /path/to/game-checkout --ref origin/main
npm test && npm run build
```

- 자리별 배치 규칙은 `scripts/scene-defs.mjs`(공개 소스)에 자리마다 한 줄씩 있습니다. 기준점(시전자 발·표적 몸·머리 위·조준점 바닥)·배율·층·반복·투사체 속도를 적습니다.
  값은 `k.c('SkillEffects.ShardHitScale', 1.1)`처럼 상수 이름으로 적고, 생성기가 지정한 커밋의 property 선언을 읽어 채웁니다.
  코드 안 지역 값은 `k.code(값, '파일:줄')`, 코드에서 못 읽는 값은 `k.est(값, '이유')`로 적습니다. 화면에는 「추정」으로 표시되고, 근거를 펼치면 값마다 읽음/코드 옮김/추정과 줄 번호가 보입니다.
- 배우·맵 바탕은 `scripts/scene-actors.mjs`의 목록대로 게임 체크아웃의 증거 영상·스크린숏을 ffmpeg로 잘라 씁니다(배경 지우기는 근사).
  거인·소환수는 에셋 도감 몸 프레임을 씁니다. 1칸 px는 증거의 줌으로 맞춥니다(줌 100: 1600px 화면 125 · 줌 130: 1920px 화면 195.1).
- 메이플 클립은 `npm run slots`가 받아 둔 프레임 피벗(`content/assets/slots-cache`)으로 놓습니다. 코덱스 그림은 규칙의 피벗을 씁니다.
- 결과는 `content/scene/scene.json`, `scene-manifest.json`(SHA-256), `media/*.png`에만 씁니다(Git 제외). 빌드는 이 해시도 검사하고 `assets/scene/media/`로 복사합니다.
  `scene.json`이 없으면 빌드는 경고만 하고 단추가 「장면 자료 없음」으로 바뀝니다.
- 몬스터 피격 장이 없으면 배우 그림에 흰빛을 덮어 번쩍임을 흉내 냅니다(근사).
- 「후보 크기」 기본값은 저주 원형판 자리(규칙에 판정 지름 `judgeD`가 있는 자리)만 **판정 원에 맞춤**이고, 나머지 자리는 코드 배율입니다.
  판정 원 맞춤은 후보마다 피벗에서 알파>16 화소까지 가장 먼 거리(모든 장 중 최대 · 게임 `CurseCircleFitPx`와 같은 잼)를 브라우저에서 재서 보이는 지름을 판정 지름(3칸)에 맞추고, 점선 원으로 판정 원을 그립니다. 현재 그림은 코드 배율이 이미 판정 원과 같아 그대로 둡니다.

### 다음 메이커 회차에서 정식 배우 PNG로 교체하는 법

1. 메이커에서 배경 없는(또는 단색) 화면으로 배우를 찍어 투명 PNG로 만들고 `content/scene/incoming/<id>.png`에 둡니다(Git 제외).
   찍을 때의 줌과 화면 폭으로 1칸 px를 적어 둡니다(예: 줌 100 · 1920px 화면 = 150px/칸).
2. `scripts/scene-actors.mjs`에서 같은 `id` 항목의 `source`를 `{kind: 'png', file: 'content/scene/incoming/<id>.png', pxPerCell: 150, feet: [x, y]}`로 바꿉니다.
   `feet`(발 기준점 px)를 빼면 불투명 화소 맨 아래 가운데로 잡습니다. 캐릭터·거인·소환수는 오른쪽, 몬스터는 왼쪽을 보게 `flip`을 맞춥니다.
3. 피격 장을 찍었으면 `{id: 'monster-hit', role: 'monster', pose: 'hit', ...}`을 더합니다. 있으면 흰빛 흉내 대신 그 장을 씁니다.
4. `npm run scene -- --game <checkout>` → `npm test && npm run build` → 화면 확인 → `npm run publish`.

`id`·`role`·`pose`는 화면이 찾는 이름입니다: `player-stand`, `player-cast`, `monster-stand`, `monster-hit`, `giant-stand`(마법사), `giant-shield-stand`·`giant-greatsword-stand`·`giant-twin-stand`·`giant-basic-stand`, `summon-stand`.

### 후보 남기기 → 실녹화 목록

카드마다 「후보 남기기 (실녹화)」를 여러 개 체크하면 고른 것·메모와 함께 이 브라우저에 저장됩니다.
「실녹화 목록 내보내기」는 `kind: catch-and-keep/effect-shortlist` JSON(자리 id·runtime 상수·남긴 후보 id·RUID·메모·장면 규칙 요약)을 복사합니다.
이 JSON이 다음 단계(메이커 실녹화)의 입력입니다. 기존 「선택 내보내기」(자리마다 하나)는 그대로입니다.

## 효과 고르기 · 추천 (메이플 1순위)

「메이플 에셋 · 추천」 탭은 자리마다 메이플 후보 중 1순위를 **「추천 n순위 · 점수」 배지 + 이유 3개 + 「확인」/「다른 것」**으로 보여 줍니다.
「추천 장면」 탭은 83자리를 한 화면에 모아 자리마다 추천 1순위(해골 4자리는 코덱스 그림)를 장면(배우·맵 위)으로 재생합니다.

```sh
npm run recommend -- --game /path/to/game-checkout   # 재검색 없이: --no-search
npm test && npm run build
```

- 점수 규칙은 `scripts/recommend-defs.mjs`(공개 소스)에 있습니다. 자리마다 [역할, 속성] 한 줄 · 가중치 · 확신 기준 · 덧점.
  점수 = 역할(메이플 태그의 부분 hit·ball·tile·affected·effect·special) · 색(지금 그림과 색 칸 겹침 + 속성 색) · 모양(장별 면적 변화·가로세로) ·
  크기(같은 배율일 때 지금 그림 대비) · 장 수·길이 · 태그 낱말 · 어두운 계열(태그 + 원작 직업) · 톤(밝기·채도)의 가중합(0~100) + 덧점.
- 그림은 `scripts/png.mjs`(의존성 없는 PNG 해독)로 직접 잽니다. 태그는 게임 체크아웃의 msw-search 래퍼(`getResourceTags`)로 받고 `content/assets/slots-cache/tags-*.json`에 캐시합니다.
- 재검색: 자리마다 `scripts/maple-queries.mjs`의 검색어 2개를 `animationclip`·`sprite` / `category: skill`로 topK 20개씩 + 지금 메이플 클립과 비슷한 것 →
  메타·태그로 거른 상위 3개만 프레임을 받아 같은 규칙으로 잽니다. 그 자리 3위 안에 들면 「메이플 후보 · 재검색」 카드로 붙습니다(`extras`).
- 해골 관련 4자리(`EXCLUDED`)는 「코덱스 커스텀 유지」로 표시합니다.
- 「확인」은 「이걸로 고르기」와 같은 저장이라 「선택 내보내기」 JSON에 그대로 들어갑니다(재검색 후보는 `candidateOrigin: "recommend"`). 「다른 것」은 이 화면에서만 다음 순위를 보여 줍니다.
- 결과는 `content/assets/recommend.json`, `recommend-manifest.json`(재검색 프레임 SHA-256), `media/slots/`에만 씁니다(Git 제외). 빌드가 해시를 검사하고 `__RECO__`로 넣습니다.
- 장면 보기의 배우·바탕은 11-01 메이커 정지 캡처(`content/scene/incoming/`, 게임 체크아웃 `docs/evidence/2026-11-01-fx-picker-scene/actors/`에서 복사 · 171.6px/칸 · 바닥 지우기 근사)입니다.
  `npm run scene`은 이제 `content/scene/incoming/`을 지우지 않습니다. 「가까이 보기」는 화면 폭을 9.6칸 → 6칸으로 줄여 크게 봅니다.

## Vercel

전용 프로젝트: `catch-and-keep-library`, Root Directory: `web`, Build: `npm run build`, Output: `dist`.
운영 주소와 모든 미리보기 주소에 Authentication → All Deployments를 적용합니다.

```sh
npx vercel@65.9.0 login
npx vercel@65.9.0 link --project catch-and-keep-library --scope mogos-projects
npm run publish
```

GitHub는 소스 이력을 관리합니다. 비공개 자료가 없는 Git 빌드로 배포를 덮지 않도록 Git 자동 배포는 끕니다.
납품 작업자의 마지막 단계는 **자료 가져오기 → 변경 화면 확인 → `npm run publish`** 입니다.
publish는 로그인 보호 상태를 API로 확인한 뒤 Build Output API의 정적 파일만 업로드합니다.
비공개 자료·토큰을 공개 저장소나 GitHub Actions 로그에 넣지 않습니다.

## 스킬 화면 조각 (대조표 · 아이콘)

`templates/skills-views.js`의 「스킬 화면 조각」 블록과 `public/site.css`의 「대조표 · 아이콘 조각(skv)」 블록은 독립 함수로 둡니다.
`renderSkillAudit(root, catalog, {onOpenGroup, onCount})` = 트리별 카드 대조표, `renderSkillIcons(root, catalog, {...})` = 트리별 아이콘(104·60·40px).
상태는 `SKV`(트리·검색·펼치기·변경됨만·크기) 하나만 쓰고 전역 STATE를 읽지 않습니다. 쓰는 공용 함수는 `esc` 하나입니다.

## 데이터 의미

스킬 29개와 강화 노드 62개(11-02 기준)는 서로 독립된 91개 애니메이션을 의미하지 않습니다.
정지 아이콘, 공유 효과, 프레임 시퀀스, 엔진 내장 효과를 구분합니다.
맵의 등록/기획/실제 촬영/수정 적용 여부와 정책 승인/구현 검증 상태도 구분합니다.
배포 시각과 자료 검수 시각은 별개이며 스냅샷 기록에 각각 표시합니다.
