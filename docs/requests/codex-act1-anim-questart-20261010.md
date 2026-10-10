# Codex 요청 — 액트 1 몬스터 동작 프레임 · 액트 2 의뢰 그림 (2026-10-10, Claude)

사용자 QA(10-10): 「액트 1 몬스터는 여전히 애니메이션이 없다 — 액트 2처럼」, 「액트 2는 의뢰 창이 없다 — 그림 제작도 필요」.

- 액트 1 몬스터는 지금 **상태마다 그림 1장**(`monsters.csv` `stand`·`move`·`hit`·`die`·`attack`)이라 움직여도 미끄러지듯 보인다.
- 액트 2 몬스터는 프레임을 `data/monster_frames.csv`에 넣어 코드(FrameAnimator)가 직접 넘긴다. **AnimationClip 등록은 필요 없다** — 프레임 Sprite RUID만 있으면 된다.
- 의뢰 일지는 액트 탭(액트 1 · 액트 2)이 생겼다. 액트 2 칸 6개는 지금 책 아이콘(`icon_quest`)으로 대신 그려진다.

## 0. 공통 규칙 (액트 2 몬스터 프레임과 같다)

| 항목 | 내용 |
|---|---|
| 시점·화풍 | 탑다운(위에서 비스듬히), 배경 투명, 어두운 고딕 판타지. 액트 1 팔레트: 잿빛 · 탁한 늪 초록 · 녹슨 갈색 · 피의 적갈색 |
| 방향 | **왼쪽을 보는 그림** (오른쪽은 코드가 좌우 반전) |
| 기준점 | 발밑 가운데. 프레임마다 아래 가운데 정렬, 상태 사이 높이 기준을 맞추고 하나의 공통 배율로 내보낸다 (프레임별 개별 확대 금지) |
| 모습 | **지금 쓰는 그림(`monsters.csv`의 stand RUID)과 같은 몬스터로 보이게** — 새 디자인이 아니라 기존 그림을 움직이는 것 |
| 프레임 수 | stand 4 · move 4~6 · attack 4 (두 번째 프레임이 타격 순간) · hit 2 · die 4 |
| 저장소 | 그룹 월드 OJYYQ **그룹 저장소** |
| 이름 | `a1_<id>_<state>_<n>.png` (중복 없는 이름 — 카탈로그 CSV로 RUID를 대조한다) |

## 1. 액트 1 몬스터 14종 (필수)

| id | 이름 | 지금 그림 px (w×h) | 동작 메모 |
|---|---|---|---|
| `hellhound` | 지옥견 | 92×54 | 빠른 질주, attack = 물어뜯기 |
| `fallenimp` | 타락 꼬마악마 | 82×96 | 겁쟁이, 팔짝팔짝 뛰는 이동 |
| `graveworm` | 무덤 구더기 | 60×53 | 꿈틀거림, 땅속에 숨었다 나옴 (stand = 꿈틀) |
| `cultarcher` | 광신 궁수 | 162×168 | 원거리, attack = 활 당겨 쏘기 |
| `skelwarrior` | 해골 전사 | 84×87 | attack = 칼 내려치기 |
| `starvedwraith` | 굶주린 악령 | 72×60 | 떠다니는 이동 (발 없음), attack = 할퀴기 |
| `rotzombie` | 썩은 좀비 | 64×92 | 느리게 비틀거림 |
| `ashendead` | 잿빛 망자병 | 56×92 | attack = 녹슨 창 찌르기 |
| `corpsecrow` | 시체 까마귀 | 66×53 | 날갯짓 (stand도 날갯짓), attack = 쪼기 |
| `broodspider` | 무덤 새끼거미 | 52×52 | 빠른 다리 움직임 |
| `headsman` | 목 없는 처형인 (고유) | 65×92 | attack = 도끼 크게 휘두르기 |
| `skelcaptain` | 납골당 지휘관 바르그 (고유) | 120×133 | attack = 지휘검 휘두르기 |
| `gravequeen` | 묘지기 여왕 (보스) | 300×496 | attack 2종 있으면 좋다 (휘두르기 · 시전 — 보스가 독안개·소환·도약·탄막을 쓴다) |
| `bonenest` | 뼈 둥지 (고정) | 224×116 | 이동 없음. stand = 맥동, hit 2, die 4 (move·attack은 stand 재사용) |

- 우선순위: 필드 몬스터 10종(위 10행) → 고유 2종 → 여왕 → 둥지.
- 원본 크기가 지금과 다르면 납품 표에 실제 px만 적어 주면 된다 (Claude가 `w`·`h`·`scale`을 맞춘다).

## 2. 액트 2 의뢰 그림 6장 + 흑백판 6장 (필수)

액트 1 의뢰 그림(`quest_art1~6`)과 같은 규격: 정사각형 약 256px, 테두리 없이 그림만, 어두운 톤. **흑백판도 함께** (끝낸 의뢰에 쓴다).

| 키 (ui_icons.csv) | 의뢰 | 장면 제안 |
|---|---|---|
| `quest_art7` / `quest_art_gray7` | 모래에 묻힌 대상 | 모래 언덕 위 무너진 카라반 수레와 자칼 무리 |
| `quest_art8` / `quest_art_gray8` | 독침 여왕 | 전갈 굴 속 녹색으로 빛나는 독침 꼬리 |
| `quest_art9` / `quest_art_gray9` | 메마른 우물의 혼 | 버려진 우물에서 피어오르는 보랏빛 혼 |
| `quest_art10` / `quest_art_gray10` | 왕들의 봉인 | 묘실 안 봉인된 석관과 금빛 문양 |
| `quest_art11` / `quest_art_gray11` | 사원의 두 문지기 | 사원 문 양옆에 선 거대한 문지기 둘 (방패·창) |
| `quest_art12` / `quest_art_gray12` | 모래 폐허의 대사제 | 태양 원반 지팡이와 금빛 가면, 붉은 망토 |

## 납품 · 연결 (역할 분담)

1. Codex: 프레임·그림 제작 → 업로드할 PNG 폴더를 Downloads에 모아 준다 → 사용자가 그룹 저장소에 올리고 카탈로그 CSV를 전달 → Codex가 RUID를 대조해 연결표(`assets/codex-act1-anim-v1/`)를 채운다.
2. 게임 데이터·코드·모델은 **Codex가 고치지 않는다.** Claude가 연결한다:
   - 몬스터: `data/monster_frames.csv`에 `monster,state,frames,delays,loop,clip` 행 추가 (액트 2와 같은 방식).
   - 의뢰 그림: `data/ui_icons.csv`에 `quest_art7..12`, `quest_art_gray7..12` 행 추가 → 의뢰 일지 액트 2 탭에 바로 나온다.
3. 결과는 `docs/requests/codex-act1-anim-delivery-YYYYMMDD.md`로 남겨 준다.
