# 잿빛 장막 유니크 5종 등록 — 2026-10-10

## 등록한 리소스 (그룹 OJYYQ)

| 부위 | avataritem RUID | 아이콘 sprite RUID | 원본 |
| --- | --- | --- | --- |
| 로브 (longcoat) | `019c9e1261374b3692935bece2217f79` | `52b75eb8dcd04e32a3a66506a29f3f12` | assets/codex-ashen-veil-native-v2/native/AshenVeil_Robe.psd |
| 장갑 (glove) | `7b8c6b42250f49769ba188b97466a20f` | `ddab6c99c7e54f26a5fd09aeabc23667` | …/AshenVeil_Gloves.psd |
| 장화 (shoes) | `94251b358fcb4e7b8762739c6d7bd31f` | `0adf99ebded34b809f294622a2580940` | …/AshenVeil_Boots.psd |
| 낫 | — (공식 무기 템플릿 없음) | `bc23e25e1fac4eb8af09cac4020434ce` | assets/codex-ashen-veil-v1/png/scythe.png |
| 등불 | — (보조무기는 외형 없음) | `b418fced12df4ec79ce33442bceb70cf` | assets/codex-ashen-veil-v1/png/lantern.png |

- 공식 템플릿 PSD를 `asset_create_group_resource_storage_item`(category=avataritem)로 그대로 올리면 서버가 avataritem으로 변환한다. AvatarItem Editor를 거치지 않아도 된다.
- 아이콘은 128px 그림이라 `iconPx=128`.

## 아이템

| 유니크 | 베이스 (Lv18, 일반 드롭 제외) | 옵션 | 고유 효과 |
| --- | --- | --- | --- |
| 장막의 로브 | ashen_robe 방어 28 | 방어 45 · 소환수 25% · 생명 40 · 모든 저항 10 | 모든 스킬 +1 |
| 망자의 손싸개 | ashen_gloves 방어 9 | 공속 15 · 소환수 20% · 흡수 4 · 정신 10 | 소환수 독 8 |
| 재 묻은 장화 | ashen_boots 방어 9 · 이속 15 | 방어 20 · 이속 10 · 소환수 15% · 모든 저항 8 | 배치 한도 +1 |
| 혼을 거두는 낫 | ashen_scythe 피해 20 | 피해 100% · 소환수 30% · 추출 10 · 생명 25 | 모든 스킬 +2 · 그림자 상한 +1 |
| 잔혼의 등불 | ashen_lantern 방어 9 | 소환수 40% · 정신 15 · 마나 30 · 시전 10 | 모든 스킬 +1 · 저주 범위 20 · 그림자 상한 +1 |

## 드롭률

- `item_uniques.csv`에 `weight` 칸 추가 (빈칸 = 1). 잿빛 장막 5종만 0.15.
- 유니크가 뽑힐 때 Lv20 기준 실측(메이커 서버 계산): 기존 일반 유니크 각 14.8%, 잿빛 장막 각 **2.2%** — 모든 유니크 중 가장 낮다.
- 일반 몹 장비 1개가 유니크일 확률 0.1% (drop_tables.csv)이므로, 일반 몹에서 특정 잿빛 장막 1종은 장비 드롭 약 4만 5천 개 중 1개 꼴.
- 보스 전용 유니크(source 있음)와는 섞이지 않는다. 자가 테스트 「ashen uniques rarest」가 가중치를 확인한다.

## 확인 (메이커)

- 5종 지급 → 정상 RequestEquip으로 착용. 로브·장갑·장화가 캐릭터에 그려짐 (벗긴 상태와 비교 스크린샷).
- 장비 칸 아이콘 5종 모두 새 그림. `ItemData:IconFor`는 아이콘이 외형 RUID와 다를 때 썸네일 대신 그림을 그대로 쓴다.
- 서버 로그 `[LEA-3015] CannotLoad` (커스텀 avataritem마다): 기존 후드와 같은 현상. 클라이언트 표시에는 영향 없음.

## 남은 일

- 낫은 커스텀 무기 외형이 없어 착용 모습은 사신의 낫(`041d801e…`)을 빌려 쓴다. 공식 한손무기 템플릿을 구하면 `working/AshenVeil_Scythe_Motion_Source.psd`를 변환해 올리고 `ashen_scythe.avatar`만 바꾸면 된다.
- 로브 위쪽은 후드 망토에 가려 아래쪽만 보인다. 후드의 얼굴 가림(흰 얼굴) 문제는 이번 범위 밖.
