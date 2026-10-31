# 잡으면 내편 — 개발 자료실

세션과 무관한 고정 주소에서 스킬 애니메이션, 맵 전수 목록, 정책과 기준 시점을 보는 정적 웹입니다.
서버·DB·런타임 패키지 의존성은 없습니다. Node 20 이상을 사용합니다.

## 공개 소스와 비공개 자료

이 저장소는 공개이므로 사용자 선택에 따라 웹 소스만 커밋합니다.
`content/`(에셋/맵/정책), `dist/`, `.vercel/`, `.env*`는 Git에서 제외합니다.
자료는 Vercel Authentication의 **All Deployments** 보호 아래 빌드 결과로만 올립니다.
검색 차단 헤더는 로그인 보호를 대체하지 않습니다.

## 폴더

- `public/`: 자료실 화면과 스타일
- `templates/atlas.html`: 원본 프레임 재생 화면
- `scripts/`: 가져오기, 검증, 빌드, 미리보기, 비공개 배포
- `content/`: 로컬 비공개 자료 묶음(Git 제외)
- `dist/`: 검증된 정적 결과(Git 제외)

## 기존 납품 가져오기

```sh
cd web
npm run import -- --atlas /path/to/atlas --maps /path/to/maps --policies /path/to/policies
npm test
npm run build
npm run preview
```

atlas 폴더는 `catalog.json`, `media-manifest.json`, `media/`를 포함합니다.
maps 폴더는 `maps.json`, `media/`를, policies 폴더는 `policies.json`을 포함합니다.
가져오기는 복사만 하며 원본 게임 데이터와 이미지를 수정하지 않습니다.
절대 로컬 경로를 제거하고 에셋 SHA, 파일 경로, 필수 카탈로그를 빌드에서 검사합니다.
자료가 없거나 깨진 빌드는 실패하며 빈 화면으로 기존 배포를 덮지 않습니다.

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

## 데이터 의미

스킬 29개와 강화 노드 64개는 서로 독립된 93개 애니메이션을 의미하지 않습니다.
정지 아이콘, 공유 효과, 프레임 시퀀스, 엔진 내장 효과를 구분합니다.
맵의 등록/기획/실제 촬영/수정 적용 여부와 정책 승인/구현 검증 상태도 구분합니다.
배포 시각과 자료 검수 시각은 별개이며 스냅샷 기록에 각각 표시합니다.
