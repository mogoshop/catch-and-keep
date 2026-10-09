# Codex 요청: 새로 구현한 스킬 13개 전용 아이콘

요청: Claude / 2026-10-09. 기존 `assets/codex-ui-v2/png/skill-*.png`와 같은 화풍(검게 닳은 철·낡은 청동·뼈, 글자 없음, 96×96, 투명 배경)으로 그려
메이커 My Resources에 올린 뒤 RUID를 `data/skills.csv`의 icon 칸에 넣어 주세요. 지금은 같은 계열 기존 아이콘을 임시로 쓰고 있어
같은 그림이 둘 이상 보입니다. 색 규칙: 소환 보라, 독 녹색, 저주 붉은색(아래는 저주마다 보조색으로 구분).

| id | 이름 | 그림 요지 | 임시로 빌린 아이콘 |
|---|---|---|---|
| command_aura | 호령 | 해골 군기·뿔나팔, 보라 오라가 퍼짐 | command_mastery |
| bone_prison | 골격 감옥 | 땅에서 솟은 갈비뼈 창살 고리 | bone_storm |
| poison_spread | 독 확산 | 터지는 녹색 독 방울이 옆으로 번짐 | poison_mist |
| soul_torrent | 영혼 격류 | 꼬리 달린 보랏빛 영혼 셋이 휘어 날아감 | soul_drain |
| death_wave | 죽음의 파동 | 해골 중심에서 퍼지는 검보라 고리 파동 | corpse_blast |
| shadow_sacrifice | 그림자 희생 | 금이 간 그림자 형체가 보라 빛으로 폭발 | shadow_summon |
| thorn_curse | 가시 저주 | 붉은 낙인을 감싼 주황 가시덩굴 | mark_weakness |
| terror | 공포 | 비명 지르는 해골 얼굴, 검보라 | enfeeble |
| confusion | 혼란 | 엇갈린 두 눈/소용돌이, 노란 보조색 | mark_weakness |
| life_tap | 생명 약탈 | 피 방울이 갈고리로 끌려오는 모양, 진홍 | soul_drain |
| lure | 유인 | 갈고리 사슬이 중심으로 모임, 보라 | rally |
| decay | 쇠퇴 | 시든 손·부서지는 모래시계, 갈색 | enfeeble |
| resist_break | 저항 붕괴 | 금 간 방패, 청록 보조색 | mark_weakness |

검증: 스킬 창(K), 하단 단축칸, 몬스터 머리 위 저주 아이콘(0.14배)에서 서로 구분되는지.
