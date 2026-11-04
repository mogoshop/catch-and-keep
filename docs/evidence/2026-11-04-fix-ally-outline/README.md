# 11-04 아군 외곽선 머티리얼 (혼전 가독성 후속)

7e895086(혼전 가독성)에서 틴트만 넣고 보류했던 외곽선을, 사용자가 메이커에서 만들어 준 Outline 셰이더 참고본(`Ouline_Ally.material`, 손대지 않음)의 속성 블록을 그대로 복사해 정식 머티리얼로 만들고 아군 소환수에 연결했습니다.

## 바뀐 것
| 파일 | 내용 |
|---|---|
| `RootDesk/MyDesk/Materials/Outline_Ally.material` (새) | **추천·기본 적용** · Outline · OutlineColor **(1.6, 1.9, 2.2, 1)** · Thickness **0.02** · AlphaCut 0.25 · LitMode 0 · id `3851472f-cf46-4ded-bcba-01c217e26adf` |
| `RootDesk/MyDesk/Materials/Outline_Ally_B.material` (새) | 비교안 · OutlineColor (0.62, 0.86, 1.0, 1) · Thickness 0.02 · id `92ec2f42-f529-42b8-84bc-566f7d1cb5cc` |
| `RootDesk/MyDesk/Materials/Default_Material.material` (새) | Default 셰이더 · 외곽선 끄기용 (`AllyMaterialName = ""`) |
| `RootDesk/MyDesk/Materials/Ouline_Ally.material` | 사용자 참고본 그대로 (수정·이름변경 없음) |
| `RootDesk/MyDesk/Shadow/ShadowUnit.mlua` | 클라이언트 전용 `AllyMaterialId` · `ApplyAllyMaterial` + 속성 `AllyMaterialName`(기본 "Outline_Ally") · 0.15초 막대 타이머에서 바뀐 때만 `ChangeMaterial` |

- 대상: ShadowUnit 전부(그림자 · 해골 전사 · 해골 마법사 · 되살림 · 거인). 몬스터·플레이어는 ShadowUnit이 아니라 영향 없음.
- 내 화면의 몸은 MotionSmoother 그림 대역(MSVis)이 그리므로 루트 렌더러와 대역 렌더러 둘 다 입힙니다(로그 `n=2 vis=MSVis`). 대역이 새로 만들어지면 다시 입힙니다.
- 틴트(ShadowTint 0.45,0.58,0.95,0.85)·교전 톤 ×0.72·남의 소환수 투명도는 그대로입니다. PlayerVitals.TickBlink는 플레이어 아바타 색만 바꾸므로 소환수 머티리얼과 겹치지 않습니다.
- 해제: 소환수는 쓰러짐·회수 때 엔티티와 대역이 함께 지워지므로 되돌릴 대상이 없습니다. 거인 변신·복귀(틴트 흰색↔원래)에도 외곽선은 유지됩니다(아군 표시). 런타임에서 끄려면 `AllyMaterialName = ""` → Default_Material.

## 확인된 엔진 동작 (문서와 다름)
- `_EntryService:GetMaterialIdByName("Outline_Ally")`는 이 메이커(26.10)에서 **`material://3851472f-…` 접두사가 붙은 값**을 돌려줍니다(로그 `id=material://…`). 참고 문서(material.md)는 bare UUID라고 적혀 있지만, 그 반환값을 `ChangeMaterial`에 그대로 넣으면 외곽선이 정상으로 보였습니다(캡처). 그래서 코드는 반환값을 손대지 않고 그대로 넘깁니다.
- 외곽선 색에도 렌더러 `Color`(틴트)가 곱해집니다. 하늘색(0.62,0.86,1.0)은 틴트를 거쳐 짙은 파랑으로 가라앉아, 1을 넘는 값(1.6,1.9,2.2)으로 상쇄하니 밝은 하늘색으로 보였습니다. 1 초과 값은 `.material` 파일에 저장한 뒤 refresh → 새 플레이에서도 그대로 적용됐습니다(final-default-*).
- `_MaterialService:ChangeMaterialProperty`(클라이언트)로 후보를 실시간으로 바꿔 볼 수 있었습니다(공유 상태 — 비교 때만 사용).

## 비교판
`compare-outline.jpg` — ① 틴트만(이전) · ② 하늘 (0.62,0.86,1.0) · ③ 밝은 하늘 HDR (1.6,1.9,2.2) (추천). 윗줄 줌 100 전체 · 가운데 줌 100 확대 · 아랫줄 줌 170 확대. 같은 판, 몇 초 간격으로 머티리얼만 바꿔 찍었습니다.

추가 캡처(shots/)
- `z170-4-outline-white-thin.jpg` — ④ 흰색 (1,1,1) · 두께 0.012: 틴트가 곱해져 회청색 가는 선이 되어 혼전에서 거의 안 보임 → 탈락
- `a0-summon-z-outlineA-z100.jpg` — 실제 Z 키 3번으로 그림자 들개 3기 소환 직후(마나 46→14)
- `final-default-*.jpg` — 최종 파일 값으로 새로 플레이했을 때 기본 상태(③)

## 추천: ③ 밝은 하늘 HDR · 두께 0.02 (지금 기본 적용)
- 보라·잿빛 적(잿불 들개·굶주린 구울·임프) 사이에서 내 소환수의 몸 경계가 한눈에 갈립니다. ②는 외곽선이 몸 틴트와 같은 파랑이라 몸이 커진 것처럼 보일 뿐 경계가 약합니다.
- 색 계열이 아군 표시(청록 체력 막대·하늘색 이름표)와 같아 「하늘색 = 내 편」 규칙이 이어집니다. 적 표시(붉은 막대·붉은 숫자)와 겹치지 않습니다.
- 위험: 소환수가 10기 넘게 겹치면 밝은 선이 많아져 화면이 시끄러울 수 있습니다(이번엔 5기까지만 봄). 그러면 두께 0.015나 색 (1.2,1.5,1.8)로 한 단계 낮추는 것을 다음 후보로 둡니다. 최종 선택은 사용자.

## 메이커 실행 기록 (KST)
- 22:48:54 MAKER-FREE 삭제 → 22:59:05 재생성 → 23:01:28 삭제(3차) → 23:03:50 재생성 · 저장 끔(PlayerSave.IsLoadSuccess=false) · `maker_save` 안 함 · 매 플레이·방 이동 뒤 `_SoundDirector:SetVolumes(0,0,0)`
- 22:49 refresh 1회 → 빌드 로그 Error 0 (Info 255 · Warning 106, 기존 그대로) → play
- 1차 플레이: 캐릭터 칸 마우스 클릭이 먹지 않아 첫 입장이 슬롯 1(인꾸)로 들어감 → 바로 서버에서 저장 끔 처리 후 stop. 재시작 뒤 **슬롯 고르기만 `_CharSelectWindow:PickSlot(3)` 직접 호출**, 「입장」·「솔로 플레이」는 마우스 클릭 → 슬롯 3 핏빛망령(Lv4)
- 준비(서버 스크립트 · `maker-setup.lua`): 저장 끔 · 생명 999999 · 황무지 (5.97,1.61) · 들개 5기 처치해 혼 3개를 보관함에 **넣기만**(Deploy 안 함) · 해골 전사 2기(Raise) · 적 무리 10기(들개 6·임프 4, Lv1·생명 9,999,999) · 0.2초마다 생명 채움
- **실제 키 입력**: Z 3번 → 그림자 들개 3기 소환(마나 소모로 확인) · → 방향키 0.3~0.5초로 무리 속으로 이동
- 비교 전환은 클라이언트 스크립트로 각 소환수 `AllyMaterialName`만 바꿈(직접 호출 — 기능 경로는 같은 ApplyAllyMaterial) · ③은 처음엔 `ChangeMaterialProperty`로 시험 → 파일에 반영 → stop · refresh · 2차 플레이에서 파일 값 그대로 확인
- 로그: `[VRF] ally outline applied name=Outline_Ally id=material://3851472f-… n=2 kind=shadow unit=Shadow_hellhound vis=MSVis` 등 1차 55줄 · 2차 10줄 · LEA- 0건 · [SelfTest] 통과 408 / 실패 0 (Error 2건은 SelfTest의 의도한 실패 boom)
- 3차 플레이(23:01~23:03): npm test 「스크립트 참조」가 `self._T`를 모르는 속성으로 잡아(20/21) id 캐시를 문자열 속성 2개(`AllyMatCacheName`·`AllyMatCacheId`)로 바꿈 → refresh → 같은 절차(슬롯 3 · Z 키 · → 키)로 다시 확인. 소환수 4기 모두 `Outline_Ally:material://3851…` · LEA- 0 · 쉬는 중 캡처 `shots/final2-idle-z170.jpg` · npm test 21/21
- 자세한 줄: `key-lines.txt`

## 못 한 것 · 한계
- 성능 측정(fps)은 하지 않았습니다. 바뀐 게 없으면 문자열 비교만 하고 넘어가며, 머티리얼 교체는 소환 때 한 번(대역 생성 때 한 번 더)뿐입니다.
- 거인·해골 마법사·되살림·남의 소환수(파티) 화면은 이번에 찍지 않았습니다(코드상 같은 경로).
- 모바일·실기기 화면은 미확인.
- 녹화 없음(지시대로 maker_screenshot만).
- 1차 플레이 첫 입장이 슬롯 1(인꾸 Lv17)로 들어가 약 27초 동안 저장이 켜진 채 마을에 있었습니다(22:50:14 입장 → 22:50:41 저장 끔). 마을에 들어가기만 했고 아이템·경험치 변화는 없었습니다.
- 빌드 로그 시각이 22:48:59에서 바뀌지 않아(같은 Info 255·Warning 106) 3차 refresh의 재빌드는 로그로 확인하지 못했고, 대신 런타임에서 새 속성(`AllyMatCacheId`)이 채워진 것으로 새 코드가 돈 것을 확인했습니다.
