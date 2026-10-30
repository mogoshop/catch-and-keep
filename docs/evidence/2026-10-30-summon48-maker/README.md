# 48 소환물 정리 — 통합·메이커 검증 증거 (2026-10-30)

담당: Claude Opus 5.5 (48 통합·메이커 단일 담당) · 판정 없음(관찰·로그만) · 완료 선언 아님

## 무엇을 했나
- 통합: 갈래 C → B → A `--no-ff` 병합(e174b9ff · 15bede3c · bf4baa2e · d5257bfc) · 부모 패치 700c314e · 생성물 ccf9dc8b · e1ccc027
- 그림: K-4 미리보기 f54fe5f7 → 연속본 66장 적용 17d72ad3 (업로드 66 + 마법사 노바 영창 재사용 3 = RUID 69 · 피벗 업로드 때 함께)
- 수정: FIRE-01~03 병합 75aa6614 · 쌍칼 X 접점 2ac0c91a · 효과 재생 PlaySeq 1d676599 · UI pips 병합 04b11941 + 생성물 ab83e45f · 회전 반복 공백 3ad90ae5
- 문구 설명: 몸 프레임 소비 경로 = 클라이언트 `MotionSmoother.FrameClip`(첫 칸 RUID → monster_frames 행). 방패 내려찍기는 **서버 피해·묶기 즉시**, 0.12초 뒤 몸 4번째 칸에 맞춘 것은 **효과 그림뿐** — 피해 시각 변경 없음.

## 폴더
- `RUN-log.txt` — 시각순 기록(전반 12:44~13:20 · 후반 13:20~14:55)
- `*.log` — 검사 로그(npm · check_* · 품질 · UI 빌드), `UI-PIPS-*.log` · `A4-charge-map-FIRE03.log` · `B4-projectile-speeds.log` · `restore-S48-readback.log`
- 캡처: `C2-*`·`C3-*`·`A*`·`B*`(전반) · `UI-PIPS-PC-1~4` · `UI-PIPS-iPad-1~3` · `NODE-1-rite-K4-double-ring-new-icon.png`
- 스크립트: `S48-client-helpers.lua` · `S48-server-souls.lua` · `slot4-restore-S48.lua`
- 실시간 녹화: `../2026-10-30-summon48-recording/R*.mp4` (ffmpeg avfoundation · 30fps · 게임 영역 crop · 장면별 `*.vrf.log`·`*.start.txt`) — 대응표·sha는 공유 `summon48-preview-recording.json` `recordings`
- 미리보기(옛 3fps 이어붙임 · 녹화 아님): `../2026-10-30-summon48-preview/`

## 승인 전 후보 · 보류
- 경고 문구 「정원이 모두 거인에 들어가 있습니다」 · 「거인은 두 기까지 세울 수 있습니다」 = 승인 전 후보
- 거인 충전 동기화 속성(GiantCharges @Sync)은 만들지 않음(되돌리기 쉬운 보류)

## 한계 (자세히는 공유 JSON `limits`)
- 녹화 장면 일부는 GM 준비(혼 만들기 · 저항 설정 · 쌍칼 이동 멈춤 · 마나 400)를 섞음 — 실제 입력은 키(A/S/D/F/K/방향키)와 「저 적을」 RequestFocus RPC
- 마법사 메테오 0랭크 반경 1.8 · 영창 중 정지 · 노드 전 4속성(메이커)은 미확인(전반 시도는 시야 막힘으로 invalid · 노드 전은 오프라인만)
- A⑤ 두 거인 같은 「저 적을」 s2 · 별도 재사용 대기 로그 미확보 · B④ 날아가는 투사체 프레임 식별 미확인(cast cue만)
- 녹화 mp4 · 캡처 png는 크기 때문에 커밋하지 않고 경로·sha로만 제출
