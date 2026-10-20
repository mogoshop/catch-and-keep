# 26. 반복 플레이 변주 — MSW에서 되는 것과 구체 방안 (2026-10-20)

## MSW 엔진에서 실제로 되는 것 (API 확인)

| 기능 | 가능 | API (Environment/NativeScripts) | 우리 프로젝트에서 |
|---|---|---|---|
| 실행 중 타일 바꾸기 (맵 모양 생성) | 됨 | `RectTileMapComponent:SetTile` · `BoxFill` · `RemoveTile` · `Clear` · `Reset`. 서버에서 부르면 클라이언트에 반영된다 (공식 문서 「Dynamic Tile Creation Using Script」) | 아직 안 씀. 모든 맵은 빌드할 때 고정 시드로 한 번 만든다 (`tools/build/layout.cjs`, `map_layouts.csv`) |
| 실행 중 물건 만들기 | 됨 | `_SpawnService:SpawnByModelId` · `SpawnByEntityTemplate` · `Clone` | 많이 씀 (21개 파일). RectTile에서 몸통 충돌은 타일로만 막힌다 |
| 인스턴스 방 (파티 전용 방) | 됨 | `_RoomService:CreateInstanceRoom(key, maps, wait)` · `MoveUsersToInstanceRoom` · 방 공유 메모리 | 심연이 이미 쓴다 (방 키 `depth:층:난이도:액트:고유값`) |
| 맵 복제 | 됨 | `_DynamicMapService:CreateDynamicMap(원본, 새이름)` · `DestroyDynamicMap` | 아직 안 씀 |
| 시간 기준 주간 교체 | 됨 | `DateTime.UtcNow`. 주 번호 = `floor(UtcNow.Elapsed / 604800000)` | 일일 의뢰가 이미 날짜 키를 쓴다 |
| 전역 데이터·랭킹 | 됨 | `GlobalDataStorage` (비교 후 쓰기 포함) · `SortableDataStorage` (정렬 랭킹) | 랭킹이 쓴다. 이름만 바꾸면 시즌별 기록판이 된다 |
| 모든 채널에 알리기 | 됨 | `_WorldInstanceService:RequestSendEventToAllWorldInstances` · `_RoomService:RequestSendEventToAllRooms` | 아직 안 씀 |
| 조명·날씨 | 됨 | `OverlayLightService` · 파티클 · `MaterialService` | 심연 「어둠」 저주가 조명을 쓴다 |
| 시즌이 자동으로 초기화되는 리더보드 | 출시 서버에서만 | `MatchmakingService:CreateLeaderboardAndWait(... LeaderboardSeasonResetInfo)` | 메이커에서 시험할 수 없어 보류 |

**제약**

- 예약 실행(cron)이 없다. 타이머는 그 방 안에서만 돈다.
- DataStorage는 요청마다 크레딧이 들고, 모든 방이 크레딧을 함께 쓴다.
- 실행 중 맵을 만들면 벽 그림(ArtWall)도 따로 놓아야 한다. 지금 벽은 「충돌 타일 + 그림 엔티티」 두 겹이다.

## 구체 방안 (드는 품이 작은 순)

| 안 | 내용 | 기술 근거 | 품 | 기대 효과 | 위험 |
|---|---|---|---|---|---|
| **A. 심연 배치 여러 벌** | 빌드할 때 시드만 다르게 심연 맵을 8~12벌 만들어 두고, 층마다 무작위로 고른다. 지금은 4벌을 정해진 순서로 돈다 | 이미 있는 빌드 파이프라인(`layout.cjs`)과 인스턴스 방. 실행 중 위험 없음 | 작음 (반나절) | 심연을 할 때마다 다른 길 | 맵 수가 늘어 배포 크기가 조금 커진다 |
| **B. 주간 변주 (「이번 주 변경」)** | 주 번호로 정해지는 효과 2~3개. 예: 「망자의 주」 정예 +50%·추출 +5%p, 「잿불의 주」 화염 몹·화염 저항 −. 마을 게시판에 표시하고, 심연 랭킹도 주간판을 따로 둔다 | `UtcNow` + 효과 표(csv). 저장이 필요 없다. 랭킹은 `rank_depthrun_w<주>` | 작음~중간 (1일) | 매주 접속할 이유, 같은 맵을 다르게 플레이 | 효과 밸런스 검수가 필요하다 |
| **C. 사냥터 사건** | 들어갈 때마다 3~5개 중 1~2개: 떠도는 이름 있는 적, 봉인 상자 위치, 저주받은 신전, 「혼 폭풍」(추출 확률 ↑ 2분) | 이미 있는 스포너·신전·상자를 무작위 자리에 둔다 | 중간 (1~2일) | 같은 맵 반복의 지루함이 줄어든다 | 자리 검사(벽·출구 안전 구역)가 필요하다 |
| **D. 균열 (시간 제한 미니 던전)** | 사냥터에 가끔 붉은 균열이 열리고, 들어가면 3분짜리 인스턴스 방(무리 몰이 + 보상 상자) | `CreateInstanceRoom` (심연과 같은 방식) | 중간 (2일) | 짧고 강한 보상 순간 | 방 크레딧 소모, 파티 동기화 |
| **E. 래더 시즌** | 「시즌 캐릭터」를 새로 만들고, 시즌별 랭킹과 시즌 전용 룬워드 1~2개. 시즌이 끝나면 일반 캐릭터로 옮긴다 | 저장 칸에 시즌 표시 + 기록판 이름 교체 | 큼 (3~5일) | 디아2식 장기 재시작 동기 | 운영 일정과 공지가 필요하다 |
| **F. 실행 중 맵 생성** | 빈 원본 맵을 복제해 서버에서 타일·벽 그림·소품을 시드로 채운다 (심연 무한 변주) | `CreateDynamicMap` + `SetTile/BoxFill` + `layout.cjs`를 mlua로 옮기기 | 큼 (4~6일) | 진짜 무작위 던전 | 벽 그림 엔티티 수, 길찾기 캐시, 대량 타일 동기화 성능 |

**추천 순서:** A + B 먼저(합쳐서 약 1.5일) → C → D → (반응을 보고) E·F.
A와 B만으로도 「매주 다른 심연·다른 효과·주간 랭킹」이 생긴다.
