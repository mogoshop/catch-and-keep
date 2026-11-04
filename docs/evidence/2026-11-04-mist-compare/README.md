# 안개(mist) 강도 3안 비교 (11-04) — 현재 / 약함 / 강함

사용자 요청: 「안개 강도는 내가 비교해서 볼 수 있도록 보고해줘」. **고르는 건 사용자** — 이 자료는 비교만 한다. 비교가 끝난 뒤 현재 값으로 복구했다.
파일은 처음부터 끝까지 바꾸지 않았다(런타임 `maker_execute_script`로만 바꿈 · refresh 0 · maker_save 0).

## 안개가 어디서 정해지나
- `RootDesk/MyDesk/Ambience/DarkVision.mlua` `StartWeather` — `weather == "mist"`(또는 rain)일 때 `_ParticleService:PlayAreaParticle(AreaParticleType.FogLively, 맵 크기+6, …)` 한 개.
- 값은 **코드에 바로 적혀 있다** (`data/config.csv`에 mist·fog 줄 없음 — 확인함). 넘기는 옵션은 `Color`·`SortingLayer`·`OrderInLayer` 세 개뿐이고, 입자 수·크기·속도는 엔진 기본값(`AreaParticleComponent`: `ParticleCount=1` · `ParticleSize=1` · `ParticleSpeed=1`).
- 안개 맵(`data/maps.csv` weather=mist) 42장: crypt1~3 · queentomb · hollow · cellar1·2 · pit1 · cave · scorpnest1·2 · drywell · kingtomb1·2 · archive · vipernest · temple1~3 · sanctum · crabcave1·2 · wreckhold · smuggler1·2 · seachapel · keeperhouse · lighthouse1~3 · sulfurcave1·2 · soulprison · forge1·2 · apostate · pit · abyssgate1~3 · ashhall · throneante.

## 3안 값
| 안 | 알파 (Color.a) | ParticleCount | ParticleSize | ParticleSpeed | 색 RGB | 층 | 근거 |
|---|---|---|---|---|---|---|---|
| **현재** | **0.25** | 1 (기본) | 1 (기본) | 1 (기본) | 0.70, 0.85, 0.90 | MapLayer0 / 39 | 파일 값 그대로 (`StartWeather`) |
| 약함 | 0.15 | 0.6 | 1 | 1 | 같음 | 같음 | 현재 × 0.6 (알파·밀도) |
| 강함 | 0.40 | 1.6 | 1 | 1 | 같음 | 같음 | 현재 × 1.6 (알파 0.25→0.40 · 밀도 1→1.6). 비 맵 안개 알파 0.35보다 조금 진하게, 크기·속도는 그대로 두어 「짙기」만 비교 |

공통: `FogLively` · 영역 66×46칸(sulfurcave1 60×40 + 6) · 위치 (0, 1) · 반복 재생.

런타임 전환(클라이언트 · 파일 수정 없음):
```lua
-- WeatherSerials[1](안개 입자)을 지우고 같은 인자로 다시 틀어 값만 바꾼다
local dv=_DarkVision local map=_UserService.LocalPlayer.CurrentMap
local info=_GameData:GetMapInfo(_GameConst:BaseMapName(map.Name))
local size=Vector2(info.w+6, info.h+6)
_ParticleService:RemoveParticle(dv.WeatherSerials[1])
dv.WeatherSerials[1]=_ParticleService:PlayAreaParticle(AreaParticleType.FogLively,size,map,Vector3(0,1,0),0,Vector3(1,1,1),true,
  {Color=Color(0.7,0.85,0.9,0.40),ParticleCount=1.6,ParticleSize=1,ParticleSpeed=1,SortingLayer="MapLayer0",OrderInLayer=39})  -- 강함
```
파일에 반영하려면 `StartWeather`의 mist 알파(`0.25`)와 옵션 표에 `ParticleCount`를 넣으면 된다 — **사용자가 고른 뒤에만**.

## 조건 (세 안 공통)
- 메이커 플레이 · 슬롯 4 「새내기」 Lv40 · 솔로 · **저장 끔**(`PlayerSave.IsLoadSuccess=false`) · 무적
- 유황 동굴 1층(sulfurcave1) **(-3.5, 1.5)** — 입구 (14.5, -14.5)는 벽 모서리에 붙어 있어 적을 세울 자리가 없어서, 입구에서 가까운 넓은 바닥(용암 바위 아치 바로 위)으로 옮김
- 줌 80(기본) · 화면 1920×1080 · 같은 자리·같은 카메라
- 적 4기 고정: 재의 망령 2 · 화염 박쥐 2 (Lv32 · 생명 ×큰 값) — 캐릭터 기준 (-2.6, 0.3) (-1.6, -0.9) (2.4, 0.7) (1.8, -0.8). AIChase·MonsterNav·MonsterAttack·MonsterBehavior를 꺼서 이동 0 · 공격 0 (속박 아이콘이 안 뜨게 속박은 안 씀). 맵의 다른 몬스터는 지움
- 정지 캡처 = `maker_screenshot`(플레이 카메라) · 안개를 바꾸고 **10초 뒤** 같은 시점
- 실속도 녹화 6초 = `ffmpeg -f avfoundation -framerate 30 -capture_cursor 0 -i "Capture screen 1:none" -vf "crop=2196:1236:787:236,scale=1920:-2" -c:v libx264 -crf 18 -pix_fmt yuv420p` (입력 픽셀 형식 bgr0) · 녹화 중 maker_screenshot 0 · 녹화 시작 직후 재의 망령 1기를 왼쪽 6칸에 내고 캐릭터를 쫓게 함(약 3.3초에 1칸 안 → 그 자리 고정)
- 접근 장면 = 재의 망령 1기를 캐릭터 왼쪽 **6칸 / 3.5칸 / 1칸**에 하나씩 내서 고정하고 찍음(걸어오는 중간을 찍으면 안마다 자리가 달라져서)

## 결과 (보고 고를 때 참고 — 판단은 사용자)
- **세 안 모두 눈으로 거의 구분되지 않는다.** 이 자리는 빛 둘레(반지름 5.04칸) 안이라 밝은데, 안개 덩어리는 화면에 한두 개만 아주 옅게 지나간다.
- 안개를 끈 화면(`shots/ref-off-scene.png`, 참고용으로 한 번 끔)과 픽셀 차이: 바닥 두 곳 평균 차이 **0.00~0.02 / 255**. 차이를 12배 키운 `diff-vs-off-x12.png`에서 약함 = 덩어리 안 보임 · 현재 = 옅은 덩어리 1개 · 강함 = 옅은 덩어리 2~3개(몬스터 모양은 서 있는 동작 차이).
- 녹화(0.5초 간격 프레임 차이)도 바닥 평균 변화 0.001~0.002 / 255 — 움직이는 안개가 거의 잡히지 않음.
- 전투 시야: 6칸 자리는 화면 왼쪽 끝 + 빛 둘레 밖 어둠이라 안개와 상관없이 원래 어둡다. 3.5칸·1칸은 세 안 모두 또렷하다 → 지금 범위(0.15~0.40)에서는 안개가 시야를 가리지 않는다.
- 11-03 기록(`docs/evidence/2026-11-03-hero-samples/MAKER-CHECK.txt` (6) 「정지 프레임으로는 … 안개가 거의 안 보이고」)과 같은 결론. ×1.6로도 부족하면, 알파보다 입자 수·크기를 더 올린 별도 안이 필요하다(이번엔 만들지 않음).

## 11-03 자료와 조건 차이
| | 11-03 (`2026-11-03-hero-samples` rec/weather-mist on/off) | 11-04 (이 자료) |
|---|---|---|
| 비교 | 안개 켬/끔 2개 · 8초 | 현재/약함/강함 3개 · 6초 + 정지 + 접근 3거리 |
| 자리 | sulfurcave1 (입구 쪽) · 적 없음 | sulfurcave1 (-3.5, 1.5) · 적 4기 고정 + 접근 1기 |
| 크롭 | 2196:1236:786:236 | 2196:1236:787:236 (바람 11-03 공정과 같은 값) |
| 끄는 방법 | weather 끔 | 강도만 바꿈(끔은 참고 정지 1장) |

## 복구 확인 ([VRF] 로그)
- 처음: `16:45:04 C [VRF] weather mist on sulfurcave1 n=1` (파일 코드, 입자 serial 4)
- `16:55:55 C [VRF] MIST set weak alpha=0.150 count=0.60 size=1.00 speed=1.00 serial=7 old=4 n=1 map=sulfurcave1 area=66x46`
- 강함 `MIST set strong alpha=0.400 count=1.60 … serial=8`
- `16:58:13 C [VRF] MIST restore removed override serial=8 left=0` → `[VRF] weather mist on sulfurcave1 n=1` (DarkVision.StartWeather — 파일 코드 그대로 다시 실행)
- 참고 끔 `16:58:36 [VRF] MIST off (reference) removed serial=9` → **최종 복구** `16:58:49 C [VRF] weather mist on sulfurcave1 n=1` · `[VRF] MIST final restore via DarkVision:StartWeather serials=10, count=1`
- 그 뒤 서버 정리 타이머 해제 → maker_stop → 편집 모드 map01. 다음 플레이는 파일 값(0.25)으로 시작.
- 파일: `RootDesk/MyDesk/Ambience/` · `data/maps.csv` · `data/config.csv` 변경 0 (`git diff` 깨끗). 작업 중 data·RootDesk에 보인 다른 변경(GameData.mlua·SkillEffects.mlua 16:45 등)은 같은 시간대 다른 차선 것이고 이 차선은 손대지 않음.

## 파일
- `compare-3.png` — 3안 나란히(위 전체 화면 · 아래 가운데 확대) + 수치 라벨
- `approach-3.png` — 3안 × 6칸·3.5칸·1칸 (화면 왼쪽 확대)
- `diff-vs-off-x12.png` — 안개 끈 화면과의 차이 ×12 (약함 · 현재 · 강함)
- `shots/{0-current,1-weak,2-strong}-scene.png` — 정지 캡처 원본(2197×1236). `0-current-scene.png`는 첫 복구(파일 코드) 직후 찍음 — 처음 찍은 현재 장은 위에 안내 띠(「스킬(K)에서 리바이브…」)가 덮어 `0-current-scene-toast.png`로 남김
- `shots/*-approach{6,3.5,1}.png` — 접근 장면(1280 폭) · `ref-off-scene.png` 안개 끔 참고 · `9-restored-current-scene.png` 최종 복구 뒤
- `contact/*-0.25s.png` — 녹화 6초를 0.25초 간격 24장
- `rec/*.mp4` — 실속도 6초 녹화(커밋 안 함) · `rec/*.start.txt` 녹화 시작 시각
- 메모: 강함 녹화에는 위쪽 안내 띠(「스킬(K)에서 리바이브…」)가 떠 있다(게임이 띄우는 도움말 — 안마다 뜨는 때가 다름)
