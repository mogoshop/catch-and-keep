# 48 연출 V2 — 노바 새 아트 업로드 49장 (FX 16 + 아이콘 1 + layers 32 · 2026-10-30)

근거: 조정자 지시(업로드만) · 원본 `assets/codex-bone-giants-v1/spectacle-v2-20261030/nova/full/` (코덱스 수용 · hash 17/17).

## 업로드 전 확인
- sha 대조 49/49 일치. FX 16·아이콘 1은 `manifest.json`과, layers 32는 `records/file-manifest.json`과 대조했습니다.
- 그룹 OJYYQ에서 「nova-v2」「mage_pull」로 검색한 결과는 0건입니다. 기존 RUID가 없으므로 49장 모두 새로 올렸습니다.

## 방법 (ART-I 팩 방식)
- 업로드: `node tools/msw_mcp_call.cjs upload-res <scratchpad 복사본 팩>`, 그룹 OJYYQ의 sprite/object입니다. `assets/`는 읽기만 했습니다.
- 이름:
  - FX: key 그대로
  - layers: `<key>-front` / `<key>-rear`
  - 아이콘: `node-giant_mage_pull-v2`
- RUID를 받은 직후 같은 호출에서 속성을 넣었습니다.
  - FX·layers: pivot 0.5 / 0.375
  - 아이콘: pivot 0.5 / 0.5
  - 공통: Point / Clamp
- 확인: `asset_get_group_resource_metadata_bulk`로 이름·피벗·filter·wrap을 대조했고, 49/49가 일치했습니다(`metadata-verify-49.json`).
- 참고: `layers/front/fx-giant-nova-v2-00.png`는 FX 00과 같은 그림(sha 4a629680…)입니다. 표 행이 서로 달라 RUID를 따로 받았습니다.

## 결과 파일
- 이 폴더:
  - `resource-mapping-nova49-ruid.csv` — key · 업로드 이름 · ruid · sha · layer(front/rear/none)
  - `metadata-verify-49.json`
  - `upload-res.log`
- 공유 폴더: `maple-quality-remediation-20261029/summon48-spectacle-upload-nova17.json`

## 하지 않은 것
- `art_sprites.csv` · `ui_icons.csv` · skills icon · GameData는 바꾸지 않았습니다. 부모 담당이 통합합니다.
- 메이커 refresh / play / 촬영은 하지 않았고, 메이커는 편집 모드 그대로입니다. 런타임 표시는 아직 확인하지 않았습니다.
