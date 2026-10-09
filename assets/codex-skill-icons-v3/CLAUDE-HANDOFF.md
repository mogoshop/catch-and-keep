# 새 스킬 13종 이미지 — Codex 인계 (2026-10-09)

## 상태

- 이미지 제작 **13/13 완료**. PNG는 `png/`, 생성 원본은 `originals/`, 전체 미리보기는 `contact-sheet.png`.
- My Resources 업로드 **0/13**, 실제 RUID **0/13**. `RUIDS.csv`와 manifest의 RUID는 미확인 상태로 비워 두었다.
- `data/skills.csv`는 변경하지 않았다. 업로드 전까지 기존 임시 아이콘이 표시된다.
- 메이커를 정상 종료·재실행하여 제작 모드 진입을 복구했지만, CUA 좌표 클릭·드래그가 리소스 보관함 탭으로 전달되지 않는다. 창 모드·모니터 위치·초점 변경 후에도 동일. 입력 오작동의 내부 원인은 확정하지 못했다.
- 이전 UI 팩 업로드 기록에서 `upload_sprite`가 메이커 멈춤을 유발한 이력이 확인되어 이 명령으로 재시도하지 않았다. 이번 업로드 실패가 그 명령의 실행 결과인 것은 아니다.

## 규격과 스타일

96×96 RGBA PNG, 바깥 투명 배경, 검게 닳은 철·낡은 청동·뼈. 텍스트 없음. 소환 보라 / 독 녹색 / 저주 붉은색과 요청된 보조색.
원본을 보존하고 최종 규격으로만 축소했다. 96px와 32px 접촉 시트를 육안 확인했다. 게임의 0.14배 저주 마커와 K창·퀵슬롯에서의 실제 표시 검증은 업로드 후 필요하다.

| 데이터 id | 스킬 이름 | 연결할 파일 |
|---|---|---|
| command_aura | 호령 | png/skill-command-aura.png |
| bone_prison | 골격 감옥 | png/skill-bone-prison.png |
| poison_spread | 독 확산 | png/skill-poison-spread.png |
| soul_torrent | 영혼 격류 | png/skill-soul-torrent.png |
| death_wave | 죽음의 파동 | png/skill-death-wave.png |
| shadow_sacrifice | 그림자 희생 | png/skill-shadow-sacrifice.png |
| thorn_curse | 가시 저주 | png/skill-thorn-curse.png |
| terror | 공포 | png/skill-terror-v2.png |
| confusion | 혼란 | png/skill-confusion.png |
| life_tap | 생명 약탈 | png/skill-life-tap.png |
| lure | 유인 | png/skill-lure.png |
| decay | 쇠퇴 | png/skill-decay.png |
| resist_break | 저항 붕괴 | png/skill-resist-break.png |

## 이어서 연결할 순서

1. 메이커 Resource Storage → My Resources → 파일 가져오기로 `png/skill-*.png` 13개를 등록한다.
2. 각 리소스의 Copy RUID로 실제 ID를 얻고 `RUIDS.csv`의 해당 id 행과 `manifest.json`에 기록한다. 파일 이름·임의 UUID는 RUID로 쓰지 않는다.
3. `data/skills.csv`의 같은 id 행 `icon` 칸만 갱신한다. `node tools/build.cjs data` 후 `npm test`를 실행한다.
4. 메이커 중지 → refresh → 스킬 창(K)·하단 슬롯·저주 마커에서 등록/학습 상태와 각각의 이미지가 맞는지 확인한다.

## 함께 처리한 맵 배치

- 출구 y=-4, 도착 y=-1.6, 안내 반경 1.8보다 큰 거리 2.4 유지.
- 출구 장식 화로는 (-1.8,-1.8). 중앙 출구 통로를 비우고 HUD 위로 옮겼다.
- town·map01·queentomb 각 보통/악몽/지옥의 출구·귀환 좌표를 함께 맞췄다.
- 첫 사냥터 화로 5개를 돌길 가까이 지그재그로 배치했다.
- CSV 원본과 생성 GameData에도 반영해 재빌드 시 위치가 돌아가지 않도록 했다.

이번 작업에서 비공개 재출시는 하지 않았다. 실기기 4:3 태블릿·손가락 터치·청취는 계속 미검증이다.

공포 아이콘은 생성 도구로 바깥 투명 여백을 보정한 v2가 최종본이다. 이전 생성 원본도 보존했다. 원본 프롬프트·보정 프롬프트·출처는 manifest.json에 기록했다.
