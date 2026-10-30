# 48 연출 V2 — 방패 52 + 파생 앞층 8 업로드 (2026-10-30)

근거: 조정자 지시 · 계약 `summon48-spectacle-full-art-integration-contract.txt` · `assets/codex-bone-giants-v1/spectacle-v2-20261030/shield/full/` 패키징 사본을 우선 썼습니다(원본 폴더와 PNG 60/60 sha가 같습니다).

## 올린 것과 확인
- 올린 묶음 (60장):
  - 내려찍기: 몸 12 · FX 16
  - 함성: 몸 12 · FX 12
  - 파생 앞층 8: `derived-layers` slam-front-star 3 · shout-front-star 5
- 업로드 전 sha를 대조해 60/60 일치했습니다. 52장은 manifest의 files와, 파생 층 8장은 `records/derived-layer-manifest.json`과 맞췄습니다.
- 업로드는 그룹 OJYYQ에 ART-I 팩 방식으로 했습니다.
  - 이름: 52장은 key 그대로, 파생 층은 `fx-giant-shield-spectacle-v2-<파일명>`
  - 피벗: manifest 값 그대로(몸 0.5/0.03125 · 내려찍기 FX 0.5/0.104 · 함성 FX와 층 0.5/0.5) · Point / Clamp
- metadata_bulk로 대조해 일치했습니다(`metadata-verify.json`).
- 접점·미러 규격(`records/contact-and-mirror-spec.json`)은 통합 때 B 슬롯 계약에 그대로 넣습니다.

## 결과 파일
- 이 폴더: `resource-mapping-ruid.csv` · `metadata-verify.json`
- 업로드 로그: `../greatsword/upload-res-gs-shield.log`
- 공유 폴더: `summon48-spectacle-upload-gs64-shield52.json`

## 하지 않은 것
- csv · Opts는 바꾸지 않았고, 메이커도 쓰지 않았습니다.
