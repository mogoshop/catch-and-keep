# 잿빛 장막 후드 v3 적용 — 얼굴 노출 (2026-10-11)

- Codex 납품: `assets/codex-ashen-hood-fit-v3/native/AshenVeil_Hood_FaceOpen_v3.psd`
  - 공식 Cap 템플릿 사용, 얼굴 개구부를 넓히고 턱 아래 목도리·망토를 없앴다.
  - 공식 얼굴 가이드에서 눈·입·코 가림 0px (`docs/requests/codex-hood-fit-delivery-20261011.md`).
- MCP로 그룹 OJYYQ에 avataritem/cap 등록 → **RUID `c7e017288a784b1d956e69d8991269aa`** (sanctionState Allowed).
- `data/item_bases.csv` `ashen_hood`의 외형·아이콘을 기존 `64c8135a…`에서 새 RUID로 바꿨다. 아이콘은 외형 썸네일이다.
  - 저장된 아이템은 베이스 id(`ashen_hood`)로 외형을 찾는다. 그래서 이미 가진 후드·착용 중인 후드도 새 그림으로 바뀐다.
  - 일회 지급 정책은 그대로다.
- 기존 후드 리소스는 삭제하지 않았다 (되돌리기용).
- 메이커 착용 확인(대기·걷기·공격·시전·피격·뒤보기의 얼굴 노출)은 메이커 연결 후 진행한다.
  - 서버 LEA-3015 로그는 커스텀 아바타 아이템마다 나오지만 그림은 정상이다 (10-10 확인).
