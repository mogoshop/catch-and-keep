# 48 연출 V2 선행 — V4 기본 몸 150 + HUD 5 업로드·RUID 표 (2026-10-30)

근거: 조정자 지시(연출 V2 선행 · 업로드·mapping만) · 정본 `Documents/New project/art-summon48-spectacle-v2-20261030/style-audit/canon155-handoff.json` (sha256 `f0fea6633f36db764870e6965669be41a8e9ca3855425d34d71e4cc6e97119cc` · 155행 · canonical_root `assets/codex-bone-giants-v1/v4-redesign-20261030/`).

## 1. 기존 V4 RUID 확인 → 0장, 155장 모두 새로 업로드

- 정본 handoff와 `resource-mapping.csv`의 ruid 칸은 155행 모두 비어 있습니다.
- 이전 V4 납품 기록(`giant-redesign-V4-final-delivery-20261030.json`)에도 RUID가 없습니다. 그 기록의 다음 담당은 Claude 업로드로 적혀 있습니다.
- 그룹 OJYYQ에서 이름 「v4」로 검색한 결과는 0건입니다.
- 그룹의 같은 이름 자원 `giant-*` · `ui_giant_*`는 옛 J203 / J7-HUD5 그림이고, sha가 정본과 다릅니다.
- HUD 5: `data/ui_icons.csv`의 현행 RUID는 J7-HUD5 그림입니다(sha 3b56905f · 5321b6cd · 3ca2c6cf · c5dbac94 · 4536d192). 정본 V4 HUD sha와 다르므로 새로 올렸습니다.

## 2. 방법 (ART-I 팩 방식)

- 정본 PNG 155장의 sha를 정본 표와 155/155 대조한 뒤 scratchpad 팩으로 복사했습니다. `assets/`는 읽기만 했습니다.
- 업로드: `node tools/msw_mcp_call.cjs upload-res <팩>`, 그룹 OJYYQ의 sprite/object, 이름은 `<key>-V4`입니다.
- RUID를 받은 직후 같은 호출에서 `asset_update_resource_storage_info`로 속성을 넣었습니다. 처음 불리기 전입니다.
  - 몸: pivot 0.5 / 0.03125
  - HUD: pivot 0.5 / 0.5
  - 공통: filter Point · wrap Clamp
- 확인: `asset_get_group_resource_metadata_bulk`(50개씩)로 이름·pivot_x/y·filter·wrap을 표와 대조했고, 155/155가 일치했습니다(`metadata-verify-155.json`).

## 3. 결과 파일

- 이 폴더:
  - `resource-mapping-V4-155-ruid.csv` — key · 업로드 이름 · ruid · 정본 sha
  - `metadata-verify-155.json`
  - `upload-res.log`
- 공유 폴더 `maple-quality-remediation-20261029/`:
  - `summon48-spectacle-upload-V4-150.json` — key · canon sha · 상태(신규 업로드) · RUID · 피벗 · 확인 방법
  - `summon48-spectacle-upload-V4-150.csv` — 같은 내용의 CSV

## 4. 하지 않은 것

- `data/monster_frames.csv` · `data/ui_icons.csv` · GameData는 바꾸지 않았습니다. 부모 담당이 A remap 표와 함께 통합합니다.
- 메이커 refresh / play는 하지 않았고, 메이커는 편집 모드 그대로입니다. 런타임 표시는 아직 확인하지 않았습니다.
- 새 기술 그림(대검 수평 몸·궤적·균열·방패 포즈/FX)은 이번 범위가 아닙니다. 도착한 뒤 따로 처리합니다.
