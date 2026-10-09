# 새 스킬 13종 이미지 — Codex 인계 (2026-10-09)

## 최종 상태

- 이미지 제작 **13/13**, My Resources 업로드 **13/13**, 실제 RUID 확인·데이터 연결 **13/13 완료**.
- 사용자 Copy RUID로 확인했다. 독 확산/유인 중복 전송은 사용자 정정으로 해결했으며 최종 13개 ID는 모두 다르다.
- `data/skills.csv`의 해당 13행 `icon`만 변경하고 `node tools/build.cjs data`로 `RootDesk/MyDesk/Data/SkillData.mlua`를 재생성했다. 17개 기존 스킬의 아이콘·밸런스·학습 조건은 그대로다.
- 첫 호령 1개 + 나머지 12개를 기본 이미지 가져오기에서 등록했다. 파일 선택 창의 키보드 다중 선택으로 일괄 업로드했고 12/12 완료 팝업을 확인했다.
- 자동 메이커 좌표 클릭의 입력 문제는 내부 원인을 확정하지 못했다. 사용자가 가져오기 창을 열고 RUID를 복사하는 협업으로 완료했다. 기존 멈춤 이력이 있는 `upload_sprite`는 사용하지 않았다.

## 규격과 스타일

96×96 RGBA PNG, 바깥 투명 배경, 검게 닳은 철·낡은 청동·뼈. 텍스트 없음. 소환 보라 / 독 녹색 / 저주 붉은색과 요청된 보조색.
PNG는 `png/`, 생성 원본은 `originals/`, 미리보기는 `contact-sheet.png`. 파일 연결표는 `RUIDS.csv`, 원본 출처·프롬프트는 `manifest.json`.
공포는 `png/skill-terror-v2.png`가 최종본이다.

## 확정 RUID

| 데이터 id | 스킬 이름 | RUID |
|---|---|---|
| command_aura | 호령 | `8a2ff6e3ecd44dd7a887fd23c02d70cb` |
| bone_prison | 골격 감옥 | `f246e9664d9f422580d3ff2c7543c00f` |
| poison_spread | 독 확산 | `1f60d113b6534f96a70cbd4345c6575c` |
| soul_torrent | 영혼 격류 | `7a632630eae34d6dbdad04ca3cd470c3` |
| death_wave | 죽음의 파동 | `8142f24b93934efb82a266b3adc7e26c` |
| shadow_sacrifice | 그림자 희생 | `23f381e29ae14077a981706fecf6ab6a` |
| thorn_curse | 가시 저주 | `65555ff1b91743f4a3961b963f98e8b3` |
| terror | 공포 | `11e4f466f5df432abf8ac3447372af49` |
| confusion | 혼란 | `491436d14d86497ab845fb0b54a1be69` |
| life_tap | 생명 약탈 | `8c09c83880fe4541bd2fecc003c75bf9` |
| lure | 유인 | `e0e963de53ae42b3abb44a697a041cb1` |
| decay | 쇠퇴 | `5a41e8cb57b6407ebe1ee1f984a4c39f` |
| resist_break | 저항 붕괴 | `a793bfedfe5a44a98ebd3ebdc94fbf4f` |

## 검증

- npm test **6/6 통과**. 생성 데이터 최신, 24개 표 무결성, 스크립트·모델·맵 참조 검사 통과.
- 메이커 map01 중지 → refresh → 빌드 로그 → Play → 클라이언트 프로브. 빌드 오류 **0**, 기존 경고 33개.
- 실제 `SkillWindow:Poll()` 경로로 13개 스킬 UI 아이콘의 ImageRUID가 확정 ID와 일치했다. ResourceService가 전부 96×96 Sprite로 로드했다: `[VRF-ICONS] verified=13/13`.
- `HudMain:SkillIcon()` → `UIKit:SetIcon()`으로 기존 퀵슬롯 UI에 13종을 임시 표시하고 기존 아이콘·Enable 상태를 즉시 복원했다: `quickslot-preview=13/13 restored=true`. 스킬 학습·슬롯 저장값을 변경하지 않았다.
- 미습득 스킬은 기존 규칙에 따라 흐리게 표시한다. 패시브·오라는 기존 기능대로 시전 슬롯 선택 대상이 아니다.
- 정상 로그의 오류 1개는 기존 SelfTestEvent의 의도된 실패 테스트였다. 이번 아이콘 프로브 오류 없음.
- 근거: `docs/evidence/2026-10-09-codex/skill-icons-verification.json`, `skill-icons-applied.png`, `skill-icons-upload-complete.png`.

## 남은 화면 검증

- 스킬창 최초 화면에서 새 가시 저주·골격 감옥 이미지 표시를 육안 확인했다. 다른 행은 스크롤 밖에 있어 RUID 일치/리소스 로드로 검증했다.
- `SkillWindow:Page()` 호출 후 캡처에서는 스크롤 위치 변화가 보이지 않았다. 기존 페이지 버튼의 실제 클릭/스크롤 동작은 별도로 확인할 필요가 있다. 이번 아이콘 작업에서 UI 레이아웃·스크롤 코드를 변경하지 않았다.
- 실제 습득·시전 조합, 0.14배 저주 마커의 전투 중 식별성, 모바일·4:3 태블릿의 화면 검증은 미실시.

## 함께 처리한 맵 배치

- 출구 y=-4, 도착 y=-1.6, 안내 반경 1.8보다 큰 거리 2.4 유지.
- 출구 장식 화로는 (-1.8,-1.8). 중앙 출구 통로를 비우고 HUD 위로 옮겼다.
- town·map01·queentomb 각 보통/악몽/지옥의 출구·귀환 좌표를 함께 맞췄다.
- 첫 사냥터 화로 5개를 돌길 가까이 지그재그로 배치했다.
- CSV 원본과 생성 GameData에도 반영해 재빌드 시 위치가 돌아가지 않도록 했다.

이번 작업에서 비공개 재출시는 하지 않았다.
