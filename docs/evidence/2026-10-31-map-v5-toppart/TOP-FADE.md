# 맵 v5 윗부분 그림 반투명 (2026-10-31 · 방안 B)

메이커 8차(`../2026-10-31-map-v5-sample/maker8/NOTES.md` (B))에서 윗부분 10종 모두 뒤에 서면 몸이 가려졌다(✅). 다만 발밑 이름표도 함께 가려졌다(△). 엔진 이름표 순서가 5보다 아래이고 층·순서 API가 없어서다. 제단·간헐천처럼 큰 그림 뒤에서는 내 위치를 잃는다. 이 변경은 방안 B다. 내 아바타가 윗부분 그림 뒤에 있는 동안 **그 그림만 내 화면에서 옅게** 해서 몸과 이름표가 비쳐 보이게 한다. 앞뒤 느낌(그림이 앞에 그려짐)은 그대로 남는다.

메이커는 쓰지 않았다. 확인은 액트 4 메이커 회차에 묶는다(5절). 기반 HEAD는 3e8f41f2다.

## 1. 설계

- **어디서**: `DarkVision`(클라이언트 `@Logic`)이다. 이미 맵 진입 때 맵 그림 렌더러를 한 번 도는 `ShadeWalls`가 있다. 그 순회에서 `Art…Top`(접두 `Art` · 접미 `Top`, 생성기 `lib.cjs` -top 훅 이름 규칙)을 모아 넘긴다. 새 컴포넌트나 맵 수정은 없다.
- **사각형 캐시 (맵 진입 1회)**: 그림마다 스프라이트 크기·피벗을 `_ResourceService:LoadSpriteAndWait`로 읽는다. RUID마다 한 번만 읽고 맵이 바뀌어도 다시 쓴다. 렌더러가 이미 그리고 있는 그림이라 바로 돌아온다. 못 읽으면 그 그림만 뺀다.
  - 폭 = Width ÷ PixelPerUnit × |Scale.x|, 높이 = Height ÷ PixelPerUnit × |Scale.y|.
  - 발 = 캔버스 아래 = 위치 y − 피벗 y × 높이. 생성기가 `py = y + ny·h·sc`로 원본 발을 맞추므로 이 값이 원본 그림의 발 y와 같다. 윗면 = 발 + 높이.
  - 가로 = 캔버스 가운데 ± 캔버스 폭 × `TopFadeWidthFrac`(0.9) ÷ 2. 양옆 투명 여백을 조금 덜어 낸다. FlipX면 피벗을 기준으로 좌우를 바꾼다.
  - 윗부분은 원본과 같은 캔버스·피벗·배율·뒤집기로 놓인다(LAYER-FIX 2절). 그래서 캔버스 사각형이 곧 원본 그림 자리다.
- **판정 (0.1초 · 클라이언트 타이머 하나)**: 내 아바타(`_UserService.LocalPlayer`)의 발 위치만 본다. 다른 플레이어·몬스터는 보지 않는다.
  - 가림 = 발 y > 그림 발 y **그리고** 발 y < 그림 윗면 **그리고** 가로가 보이는 폭 안.
  - 앞(발 y ≤ 그림 발 y)·옆·윗면 위는 옅게 하지 않는다.
  - 그림 가운데에서 6칸(`TopFadeRange`) 밖이면 검사를 생략한다. 그림이 6칸보다 크면 그림 반 크기를 쓴다.
  - 여러 그림이 겹치면 모두 옅게 한다.
- **보간**: 매 틱 1 ↔ 0.35 사이를 `TopFadeSec`(0.15초)에 걸쳐 움직인다. 0.1초 틱이므로 두 틱(0.567 → 0.35, 복원은 0.783 → 1)이다. 색은 원래 색(물들임 포함)을 그대로 두고 알파만 곱한다.
- **원래 색**: 엔티티 id마다 처음 본 색을 `TopBase`에 기억한다(`WallBase`와 같은 방식). 옅어진 채로 다시 들어와도 옅은 색을 원래 색으로 잡지 않는다.
- **맵 이동 (LEA-3051 짝)**: `DarkVision`은 `@Logic`이라 `OnMapEnter`/`OnMapLeave`가 오지 않는다. 대신 기존 0.3초 `Tick`이 `LocalPlayer.CurrentMap` 변화를 보고 `EnterMap`을 부른다. 거기서 먼저 `RestoreTopFade`(떠나는 맵 그림을 원래 색으로 · 목록 비움 = 이탈 짝)를 하고, 다음에 `ShadeWalls → BuildTopFade`(새 맵 목록 = 진입 짝)를 한다.
  - 반복 타이머는 `OnBeginPlay`에서 **한 번** 만들고 `OnEndPlay`에서 정리한다. 맵마다 새 타이머를 만들지 않으므로 맵을 오가도 쌓이지 않는다. `OnEndPlay`에서도 원래 색으로 돌린다.
  - 맵을 옮긴 직후 `EnterMap` 전 틱에서는 `LocalPlayer.CurrentMap ≠ CurrentMap`이라 판정을 건너뛴다.
- **다른 플레이어**: `SpriteRendererComponent.Color`는 `@Sync` 속성이지만 클라이언트에서 쓴 값은 서버·다른 클라이언트로 가지 않는다(클라이언트 쓰기는 그 화면만). 그래서 각자 자기 아바타 기준으로만 옅어진다. 서버 코드·서버 타이머는 없다.
- **로그**: `[VRF] DarkVision 윗부분 반투명 대상 N개 (빠짐 k · 알파 0.35 · 0.15초)`는 맵 진입마다 한 줄이다. `[VRF] top fade n=<겹친 수>`는 수가 바뀔 때만 찍는다. 둘 다 `Environment:IsPublishedPlay()`가 아닐 때만 찍는다.
- **비활성 스위치**: `GameConst.TopFadeOn = false`면 타이머를 만들지 않고 목록도 0이다. 그림은 늘 불투명이다(8차 상태).
- **성능**: 맵당 30개(`TopFadeMax`) 상한이다. 표본은 sanctum 17 · sulfurmarsh 7이다. 틱마다 그림당 비교 몇 번만 하고, 색 쓰기는 알파가 움직이는 동안만 한다.

## 2. 변경 (파일:행)

| 파일:행 | 내용 |
|---|---|
| `RootDesk/MyDesk/Common/GameConst.mlua:200-208` | `TopFadeOn` true · `TopFadeAlpha` 0.35 · `TopFadeSec` 0.15 · `TopFadeTick` 0.1 · `TopFadeRange` 6 · `TopFadeMax` 30 · `TopFadeWidthFrac` 0.9 |
| `RootDesk/MyDesk/Ambience/DarkVision.mlua:34-40` | 상태 속성 `TopFadeTimerId`·`TopFades`·`TopFadeCount`·`TopSprites`·`TopBase` |
| `DarkVision.mlua:49-54` | `OnBeginPlay`: 스위치가 켜져 있으면 클라이언트 반복 타이머 하나(`TopFadeTick`, 주기 `GameConst.TopFadeTick`) |
| `DarkVision.mlua:62-64` | `OnEndPlay`: 타이머 정리 + `RestoreTopFade` |
| `DarkVision.mlua:174-176` | `EnterMap`: `RestoreTopFade`(이탈 짝) → `ShadeWalls`(진입 짝) |
| `DarkVision.mlua:232·240·270` | `ShadeWalls`: 같은 순회에서 `Art…Top` 렌더러를 모아 `BuildTopFade`로 넘김(순서·z·색 처리는 그대로) |
| `DarkVision.mlua:273-309` | `BuildTopFade`(ClientOnly): 사각형 캐시 · 상한 30 · 원래 색 기억 · 진입 `[VRF]` |
| `DarkVision.mlua:311-327` | `TopSpriteInfo`(ClientOnly): RUID별 Width·Height·Pivot·PixelPerUnit 한 번 읽기(pcall · 실패 false) |
| `DarkVision.mlua:329-341` | `TopRect`: 월드 사각형(FlipX · 보이는 폭 · reach) |
| `DarkVision.mlua:343-347` | `TopCovers`: 뒤 판정(6칸 밖 생략) |
| `DarkVision.mlua:349-354` | `TopFadeStep`: 한 틱 보간 |
| `DarkVision.mlua:356-377` | `TopFadeTick`(ClientOnly): 내 아바타만 · 겹친 그림 모두 · 알파만 곱함 · `[VRF] top fade n=`은 바뀔 때만 |
| `DarkVision.mlua:379-387` | `RestoreTopFade`(ClientOnly): 원래 색 · 목록 비움 |
| `tests/quality/top_fade.lua` (새 파일) | 품질 검사 87개(3절) |
| `tests/quality/run.py:3·11` | 기본 그룹에 `top_fade` 추가 |
| `tests/quality/README.md` | `top_fade.lua` 설명 한 줄 |

API는 `.d.mlua`로 확인했다.
- `SpriteRendererComponent.Color`(Color, @Sync) · `FlipX` · `SpriteRUID`: `Environment/NativeScripts/Component/SpriteRendererComponent.d.mlua`
- `ResourceService:LoadSpriteAndWait(string) → Sprite`: `Service/ResourceService.d.mlua:20`
- `Sprite.Width`·`Height`(int32) · `Pivot`(Vector2) · `PixelPerUnit`(float, 기본 100): `Misc/Sprite.d.mlua`
- AndWait를 pcall로 감싸는 방식은 기존 `AudioWindow.mlua:121`·`PetWindow.mlua:82`와 같다.

## 3. 테스트

- `python3 tests/quality/run.py --lua /private/tmp/lua-5.4.8/src/lua top_fade` → `[top_fade] 통과 87`. 실제 `DarkVision` 본문 8개 메서드와 실제 `GameConst` 값으로 돌린다.
  - 상수 존재와 값(스위치 · 0.35 · 0.15 · 0.1 · 6 · 30 · 폭 비율).
  - 사각형: 발·윗면·보이는 폭 · FlipX 거울(피벗 0.3) · 배율 2 · 큰 그림 reach · 6칸 밖 생략.
  - 판정: 뒤 = 가림 · 앞·발과 같은 y·옆·윗면 위 = 안 가림.
  - 장면(제단 512² ×1.2 · 간헐천 FlipX · 촛대 둘 같은 RUID · 일반 그림 · 벽 · `DecorTop`): `Art…Top` 4개만 대상 · RUID마다 크기 한 번 · Top 아닌 그림은 안 읽음 · ShadeWalls 기존 동작(Top 순서 5 · 일반 그림 0) 유지.
  - 제단 앞(24.50, −1.01) 불투명 · 제단 뒤(24.50, 2.01) 두 틱 만에 0.35 · 물들임 색 유지 · `[VRF] top fade n=1` 한 번 · 촛대로 옮기면 제단 복원 + 촛대만 · 겹친 둘 n=2 · 간헐천 뒤 간헐천만 · 윗면 위 불투명 · n=0.
  - 게시 플레이면 옅게는 하되 로그 없음 · 맵이 바뀌면 판정 멈춤 → `RestoreTopFade` 원래 색 · 재진입 원래 색 유지 · 35개 → 30개(빠짐 5) · 크기 오류·nil·빈 RUID는 뺌 · 스위치 끄면 0.
  - 소스 검사: 반복 타이머는 `OnBeginPlay`에 한 번 · `OnEndPlay` 정리 짝 · `EnterMap`·`ShadeWalls`·판정 메서드 본문에 타이머 없음 · 판정 메서드 ClientOnly · 순수 계산 3개는 ExecSpace 없음 · 파일에 서버·멀티캐스트 ExecSpace 없음 · 판정은 `LocalPlayer`만(`GetUsersByMapComponent`·몬스터 없음) · `TopFade` 사용처는 DarkVision·GameConst 둘뿐 · Top 이름 규칙(생성기 `<원본>Top` · 원본 `ArtProp`/`ArtSet` · `TOP_LAYER Default / TOP_ORDER 5` ↔ DarkVision 접두 `Art` · 접미 `Top`).
- 다른 품질 그룹 25개도 모두 그대로 통과한다(같은 run.py 기본 묶음).
- `npm test` **20/20 통과**(스크립트 참조·ExecSpace 검사 포함).
- `.mlua` 빌드·런타임은 확인하지 않았다(메이커 금지). LSP 진단도 이 환경에 없다. 메이커 회차에서 refresh 뒤 build Error 0을 본다.

## 4. 한계·주의

- 판정 사각형은 캔버스 기준이다. 그림 내용이 캔버스보다 좁거나 낮으면, 내용 바로 옆·위의 투명 여백에 서도 옅어질 수 있다. 폭은 0.9로 조금 덜었다. 값은 메이커에서 다시 본다.
- 이름표는 여전히 엔진 순서로 그림 아래에 그려진다. 옅어진 그림을 통해 비쳐 보이는 것이다. 0.35에서 이름표 글자가 읽히는지는 메이커에서 본다. 부족하면 `TopFadeAlpha`만 낮춘다.
- `LoadSpriteAndWait`가 메이커에서 실패하면 그 그림은 빠진다. 진입 `[VRF]`의 「빠짐 k」로 드러난다. 이 경우에도 기존 동작(불투명)일 뿐 오류는 없다.

## 5. 메이커 확인 장면 (액트 4 메이커 회차에 묶음)

반영: refresh 뒤 build Error 0 · 런타임 오류 없음 · 표본 맵 진입 `[VRF] DarkVision 윗부분 반투명 대상 17개 (빠짐 0 …)`(sanctum) · `7개`(sulfurmarsh). 다음 플레이에서 LEA-3051이 없는지도 본다.

| # | 장면 | 절차(8차 좌표) | 기대 |
|---|---|---|---|
| 1 | 제단 뒤 | sanctum (24.5, 2.01)까지 걸어 들어감 | 0.2초 안에 제단이 옅어짐 · 몸·발밑 이름표가 비쳐 보임 · `[VRF] top fade n=1` |
| 2 | 간헐천 뒤 | sulfurmarsh (−2.5, 7.01) | 간헐천만 옅어짐 · 이름표 보임 · 「겹」(두 겹)이 이상하게 보이지 않는지 |
| 3 | 열주 사이 | sanctum 북열 (9.0, 5.01) → 옆 기둥 뒤로 걷기 | 서 있는 기둥만 옅어짐 · 사이로 나오면 복원 · 겹친 자리면 둘 다(n=2) |
| 4 | 벗어날 때 복원 | 1·2에서 남쪽(앞)과 옆으로 나옴 | 0.2초 안에 불투명 · 색(물들임·액트 붉은빛) 그대로 · `n=0` · 앞(24.5, −1.01)에서는 옅어지지 않음 |
| 5 | 다른 플레이어 영향 없음 | 둘이 접속 · A만 제단 뒤 | A 화면만 옅어짐 · B 화면의 제단은 불투명 · B가 A 뒤에 서도 A 화면은 그대로 |
| 6 | 맵 이동 | 제단 뒤 옅은 채로 포털/귀환 → 다시 들어옴 | 떠날 때 원래 색 · 다시 들어와도 원래 밝기(옅은 색이 굳지 않음) |
| 7 | 짧은 그림 | 용암 둔덕·고목(낮은 윗부분) 뒤 | 발 위쪽만 판정 · 지나칠 때 깜빡임이 거슬리지 않는지 |
