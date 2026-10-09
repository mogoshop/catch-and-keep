# 잿빛 장막 — 동작 그림 v1

## 현재 상태

- 후드 앞·뒤 2장, 로브·장갑·장화·낫·등불 각 16장: 총 82장.
- 나머지 5부위는 대기·걷기·공격·시전 각 4프레임. 20개 부위별 GIF와 4개 비교 GIF.
- 후드 공식 PSD 구성: 원본 레이어 16개, edithere 2개만 교체. origin/zmap/타입/가이드 보존 검사 통과.
- **게임에서 착용 가능한 6종 완료 상태는 아니다.** 동작 그림은 avataritem이 아니며 일반 sprite 업로드만으로 CostumeManager에 넣을 수 없다.
- 후드: 사용자 등록 RUID `64c8135a00664ad1b5e270ecc382f522`, `ashen_hood` 아이템 연결. 실제 Maker 장착·썸네일 로드·저장은 확인했으나, 사용자 착용 화면에서 얼굴이 가려져 시각 검수 실패. PSD 보정·재등록이 필요하다. 나머지 5부위 native PSD는 후속 요청 시 진행.

## 파일

| 경로 | 내용 |
| --- | --- |
| sources/ | 이미지 생성 원본 및 보정본 |
| frames/ | 투명 개별 프레임 |
| sheets/ | 부위별 4×4 동작 시트 |
| previews/ | GIF와 후드 PSD 합성 미리보기 |
| native/AshenVeil_Hood.psd | 공식 Cap 템플릿으로 조립한 등록 후보 |
| native/hood-checks.json | PSD 보호 레이어 보존 검사 |
| checks.json | 프레임 투명도·잘림·해시·GIF 검사 |
| manifest.json | 부위별 적용 상태와 남은 단계 |

## 제작 및 재현

실제 그림은 image_gen으로 제작했다. export.cjs는 분할·크기 내보내기·GIF 조립만 수행한다. build-hood.cjs는 공식 템플릿의 edithere 두 레이어에 그림을 넣고 다른 레이어가 변경되지 않았는지 검사한다. Node.js, sharp 0.35.5, ag-psd 31.0.3이 필요하며 ASHEN_ART_NODE_MODULES로 설치 경로를 지정할 수 있다.

## 적용 순서

1. Maker의 Resource Storage → My Resources → avataritem → Cap 폴더에서 목록 위 `+`를 연다. PSD 파일 선택에서 native/AshenVeil_Hood.psd를 선택한다.
2. 공식 도구의 Action Name/Auto Play로 대기·이동·공격·뒤보기와 얼굴·머리 겹침을 검사한다. 위치 오류가 있으면 paint만 보정한다.
3. Upload 후 avataritem RUID를 받는다. 후드 한 부위부터 실제 게임에서 적용하고 검사한다.
4. 로브·장갑·장화는 공식 템플릿의 몸통/팔/손/다리와 전체 자세에 맞추는 작업이 남아 있다. 전체 옷 그림을 몸통 레이어에 붙이는 방식으로 완료 처리하지 않는다.
5. 낫·등불은 무기/보조무기 지원 방식과 동시 착용 조건부터 확인한다.

## 공식 안내

- [아바타 아이템 등록](https://maplestoryworlds-creators.nexon.com/en/docs?postId=590)
- [모자 제작](https://maplestoryworlds-creators.nexon.com/en/docs?postId=682)
- [전신 옷 제작](https://maplestoryworlds-creators.nexon.com/en/docs?postId=1042)
- [장갑 제작](https://maplestoryworlds-creators.nexon.com/en/docs?postId=587)
- [신발 제작](https://maplestoryworlds-creators.nexon.com/en/docs?postId=583)

후드는 캐릭터당 한 번 지급한다. 기존 투구는 보존하며 방어력 3/요구 레벨 1은 가죽 두건과 같다. 일반 무작위 드롭에서는 제외한다. 지급 플래그는 기존 인벤토리 저장 섹션에 보존한다.

제작·실제 착용 검수 기준: [모자·후드 얼굴 노출 규칙](../../docs/avatar-cap-fit-rules.md).
