# Codex 납품 — 후드 얼굴 가림 수정 v3

수정 PSD: `assets/codex-ashen-hood-fit-v3/native/AshenVeil_Hood_FaceOpen_v3.psd`.

Downloads에도 같은 이름으로 복사했다. **그룹 OJYYQ의 AvatarItem/Cap 등록용 후보**이며, 일반 Sprite 가져오기가 아니다.

- 앞·뒤 후드 그림을 built-in image_gen으로 수정했다. 얼굴 개구부 확대, 턱 아래 천·목도리·어깨 망토 제거, 잿빛 테두리 유지.
- 공식 PSD의 보호 레이어 14개, origin/vslot/zmap, paint 사각형과 이름·순서 보존 검사 통과. 기존 PSD 보존.
- 공식 얼굴 가이드에서 눈 49px·입 39px·코 18px가 모두 후드에 가리지 않는다. 공식 짧은/긴 머리 합성도 직접 확인했다.
- 현행 데모닉 머리/흰색 긴 머리와 실제 게임 동작 검수는 **아직 미완료**. 신규 RUID 0개, 게임 연결 없음.
- 기존 후드의 리소스 로드 실패 로그가 메이커에 관찰됐다. 새 PSD 등록 및 새 RUID 검증이 필요하며, 얼굴 가림 보정만으로 기존 리소스 로드 문제가 해결된 것으로 보고하지 않는다.

사용자 등록 후 Claude는 기존 `ashen_hood` 아이템의 avatar/아이콘 리소스를 검증된 새 avataritem RUID로 연결한다. 기존 인벤토리·장착 저장·일회 지급 정책은 유지한다. 실제 미착용/착용을 같은 카메라 배율에서 비교하고 대기/걷기/공격/시전/피격/뒤보기의 눈·입·표정을 확인한다. 실제 착용 전에는 visualFit을 완료 처리하지 않는다.

검사와 프롬프트, 수정 전후 미리보기: `assets/codex-ashen-hood-fit-v3/README.md`, `checks.json`, `prompts.json`, `previews/`.
