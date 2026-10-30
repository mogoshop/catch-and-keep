# 48 연출 V2 — 대검 64 + 파생 층 32 업로드 (2026-10-30)

근거: 조정자 지시 · 계약 `summon48-spectacle-full-art-integration-contract.txt` · 원본 `Documents/New project/art-summon48-spectacle-v2-20261030/greatsword/full/manifest.json` (assets/ 패키징 사본이 아직 없어 원본을 썼습니다).

## 올린 것과 확인
- 올린 묶음 (96장):
  - 몸 32: 회전 skill1 16 · 균열 skill2 16
  - FX 32: 회전 16 · 균열 16
  - 파생 층 32: 회전 FX 앞/뒤
- 업로드 전 manifest sha와 96/96 대조했습니다.
- 업로드는 그룹 OJYYQ에 `tools/msw_mcp_call.cjs upload-res`(ART-I 팩 방식)로 했습니다. 이름은 `<key>-sv2`입니다.
- 피벗은 RUID를 받은 직후 같은 호출에서 넣었습니다.
  - 몸: 0.5 / (38/224 = 0.16964)
  - 회전 FX와 층: 0.5 / 0.5
  - 균열 FX: 0 / 0.0833 (manifest 값)
  - 공통: Point / Clamp
- metadata_bulk로 대조해 일치했습니다(`metadata-verify.json`).

## 결과 파일
- 이 폴더:
  - `resource-mapping-ruid.csv` — key · RUID · sha · kind(body/fx/layer) · layer · 피벗
  - `metadata-verify.json`
  - `upload-res-gs-shield.log` (방패와 한 번에 올린 로그)
- 공유 폴더: `summon48-spectacle-upload-gs64-shield52.json`

## 하지 않은 것
- monster_frames · art_sprites · FxGiant*Opts는 바꾸지 않았습니다. 2차 통합에서 C의 등록 행 초안과 B의 FX 슬롯 계약으로 넣습니다.
- 메이커 refresh / play는 하지 않았습니다.
