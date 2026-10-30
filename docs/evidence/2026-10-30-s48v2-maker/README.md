# 48 연출 V2 — 통합·메이커 증거 (10-30)

## 1차 (5bc1ff8b: V4 기본 155 · 노바 새 아트 49 · impact)
- 통합: C d6229bea → A 79b1d425 → B 68fe1131를 병합했고 충돌은 없었습니다.
- 부모 패치: `monster_frames` 34줄 · pending 155줄 · `ui_icons` HUD 5 + 「폭발 증폭」 아이콘 · `skills` icon · `SkillEffects` FxGiantNovaV2 / V2Front 16+16 · `art_sprites` 48줄.
- 검사 로그(이 폴더):
  - gen_data · build-ui · register_giant_visuals · check_data · check_scripts · check_mobile_layout · check_ui_tokens
  - npm-test 16/16
  - quality-all 17그룹 · quality-giant_body_playback(V4 한 외형군)
- 메이커: refresh 1회, build Error 0.
- 녹화 6클립: `../2026-10-30-s48v2-recording/V2-*.mp4`. 클립마다 `.vrf.log`(로그 시각 대응표)와 `.start.txt`가 있습니다.
- 탐침: 클라이언트에서 0.1초마다 거인 화면 대역의 SpriteRUID를 GameData giant_<종> 표와 맞췄습니다(G1~G5).
  - 본 몸 동작(stand·move·attack·hit)은 모두 표 안의 V4 프레임이었습니다. notIn은 0이고, 방패만 1입니다(거인이 되기 전 첫 표본).
  - G5 마법사는 원거리라 걷기 구간이 없습니다.
- 노바 새 아트:
  - 강화 전(G5): mul 1.00 · 3명 1125
  - 강화 후(N2): mul 1.50 · 3명 1688
  - 두 경우 모두 뒤 16·앞 16 rule=durs · 총 0.820초 · 정점 impact_at 0.160 · shown 16/16
  - 스킬 창: `N3-skillwin-explosion-amplification-PC.png`
- 「새 아트 대기」(V2 완료 영상 아님):
  - 대검 회전·땅 쪼개기 — G3에서는 구형 6장
  - 방패 내려찍기
  - 방패 함성 — 몸 없음 · 구형 고리
- 저장: 백업 5/5 → 복원 after 5/5 (`restore-S48v2-readback-1.log`).
- 끝 상태: 편집 모드 · map01 · PC FHD.
- 한계: 거인은 GM `StartGiant`로 바로 세웠습니다(뼈 의식 S 홀드 경로가 아님). 판정은 하지 않았습니다.
