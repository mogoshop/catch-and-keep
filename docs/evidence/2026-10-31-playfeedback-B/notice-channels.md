# 알림 채널 배정표 (10-31 실플레이 피드백 B-4)

사용자 피드백(10-31 00:0x): 「사냥 중 알림이 6개 왔다갔다 — 파티 목록 · 왼쪽 알림 더미 · 상단 습격 띠 · 맵 이름 · 퀘스트 추적기 · 일지 진행까지, 채팅까지 겹치면 정신없다」.
화면 알림을 네 채널로 나눴다. 이 표는 `node tools/notice_channels.cjs`가 코드에서 다시 만들고, `npm test`의 「알림 채널 배정」이 파일·방법마다 부르는 곳 수가 표와 같은지 본다(누락 0).

| 채널 | 자리 · 규칙 (상수) | 무엇 |
|---|---|---|
| **A 상단 띠** | 위 가운데 맵 배너 자리 하나 · 한 번에 1개 · 대기열 · 2.5초(`HudMap.TopSeconds`) · 같은 키 10초 안 다시 안 띄움(`TopDedupSec`) · 급한 것(습격 시작·보스 등장)이 덜 급한 것을 밀어냄 · 창이 떠 있으면 기다리고 8초 지난 것은 버림(`TopStaleSec`) · 끄기 `HudMap.TopChannelOn` | 습격 시작/격퇴 · 보스 등장/처치(「○○ 처치!」 + 다시 나오는 때 한 띠로 합침) · 퀘스트 목표 달성 · 일지 완료(업적 달성 · 일일 퀘스트 완료) · 맵 입장 이름(예전 맵 배너 — 입장 때 1회) · 재의 왕 각성 안내 |
| **B 왼쪽 알림 더미** | PC 채팅 창 바로 위(펼치면 위로 · `ChatOpenExtra`) · 파티 목록·큰 알림 판 아래 끝까지만 · 위가 최신 · 동시 3줄(`KeepLines`) · 모바일 2줄(`MobileKeepLines`) · 4초 · 같은 글(숫자만 다른 글 포함) 10초 안 ×N(`MergeSec`) · 상한·경고류 60초에 1회(`LimitSec` · `LimitPatterns`) | 아래 표의 B 줄 전부 · 머리 위 경고(`Util.Warn`)는 창이 떠 있을 때만 |
| **C 오른쪽 추적기** | 퀘스트 추적기 맨 아래 한 줄(PC는 카드 +34 · 모바일은 지역 줄 자리) · 바뀌면 제자리 갱신 · 30초 뒤 접음(`HudMain.JournalTrackSec`) · 예전 일지 진행 말풍선은 끔(`JournalWindow.PulseToTracker`) | 일지 진행 「업적 · 이름 n/N」 · 「일일 퀘스트 · 이름 n/N」 |
| **D 줍기 표시** | 캐릭터 발밑 작은 글씨 1.5초 떠올라 사라짐(`HudMain.PickSeconds`) · 최대 3개 · 골드는 0.9초 안 한 글로 더함 · 머리 위 COMBO와 떨어진 발밑 · 창이 떠 있으면 B | 골드 +N · 귀환 두루마리 +N · 물약 +N · 아이템 이름 |

파티 목록(PC)은 평소 「파티 (n) · 이름 Lv · …」 한 줄로 접고 마우스를 올리거나 누르면 펼친다 — 왼쪽 알림 더미는 그 아래 끝을 피한다(`NoticeFeed.PlaceHome`). 모바일은 알림 더미가 지도 아래(오른쪽)라 예전처럼 펼친 채.

## 부르는 곳 전수 (141곳 · A 10 · B 128 · C 1 · D 2)

| 파일 | 줄 | 함수 | 부르는 법 | 글(앞부분) | 채널 |
|---|---|---|---|---|---|
| Combat/PlayerVitals.mlua | 304 | NotifyDepthEnd | NoticeFeed.Push | 심연 | B |
| Combat/PlayerVitals.mlua | 311 | NotifyDeath | NoticeFeed.Push | 결투에서 패배했습니다. 골드 | B |
| Combat/PlayerVitals.mlua | 316 | NotifyDeath | NoticeFeed.Push | text) | B |
| Common/Util.mlua | 22 | Notify | NoticeFeed.Push | text) | B (Notify 본체) |
| Common/Util.mlua | 34 | Warn | NoticeFeed.Push | text) return end | B (창이 떠 있을 때 Warn) |
| Common/Util.mlua | 59 | NotifyTop | HudMap.TopPush | key, title, line, prio) | A |
| Common/Util.mlua | 62 | NotifyTop | NoticeFeed.Push |  | B (채널 A를 끈 때만) |
| Common/Util.mlua | 74 | NotifyPickup | HudMain.PickupPop | text) | D |
| Endgame/AbyssSystem.mlua | 68 | GiveKey | Util.Notify | message, uid) | B |
| Endgame/DepthDirector.mlua | 485 | OnDoorUsed | Util.Notify | 이동에 실패했습니다. 문을 다시 밟아 주세요 | B |
| Endgame/DepthDirector.mlua | 527 | SaveAll | Util.Notify | 다음 층 이동 준비에 실패했습니다. 다시 시도해주세요 | B |
| Endgame/DepthDirector.mlua | 541 | Announce | NoticeFeed.Push | text) | B |
| Endgame/DepthGate.mlua | 91 | Ready | Util.Notify | · | B |
| Endgame/DepthGate.mlua | 163 | Enter | Util.Notify | 심도 입장에 실패했습니다. 다시 시도해주세요 | B |
| Item/PlayerInventory.mlua | 181 | NotifyPotionCap | Util.Notify | 은 | B |
| Item/PlayerInventory.mlua | 404 | Pickup | Util.Notify | 가방이 가득 찼습니다 — 전리품은 바닥에 남습니다 | B · 상한 60초 |
| Item/PlayerInventory.mlua | 415 | Pickup | Util.NotifyPickup | msg, self.Entity.PlayerComponent.UserId) | D |
| Item/PlayerInventory.mlua | 511 | RequestSell | Util.Notify | 잠긴 물건은 팔 수 없습니다. 잠금을 풀어주세요 | B |
| Item/PlayerInventory.mlua | 524 | RequestSell | Util.Notify | 판매 + | B |
| Item/PlayerInventory.mlua | 535 | RequestDiscard | Util.Notify | 잠긴 물건은 버릴 수 없습니다. 잠금을 풀어주세요 | B |
| Item/PlayerInventory.mlua | 543 | RequestDiscard | Util.Notify | 파괴: | B |
| Item/PlayerInventory.mlua | 548 | RequestDiscard | Util.Notify | 버림: | B |
| Item/PlayerInventory.mlua | 576 | SocketRune | Util.Notify | _ItemData:DisplayName(self.Equip[slot]), u… | B |
| Item/PlayerInventory.mlua | 728 | RequestSellMany | Util.Notify | 잠긴 물건·옵션을 고르는 중인 물건 | B |
| Item/PlayerInventory.mlua | 732 | RequestSellMany | Util.Notify | 판매 | B |
| Item/PlayerInventory.mlua | 750 | RequestDiscardMany | Util.Notify | 잠긴 물건·옵션을 고르는 중인 물건 | B |
| Item/PlayerInventory.mlua | 753 | RequestDiscardMany | Util.Notify | 버림 | B |
| Item/PlayerInventory.mlua | 769 | RequestLockBag | Util.Notify | 잠금: | B |
| Item/PlayerInventory.mlua | 782 | RequestLockEquip | Util.Notify | 잠금: | B |
| Item/PlayerInventory.mlua | 867 | RequestDepositKind | Util.Notify | 창고 | B |
| Item/PlayerShop.mlua | 67 | RequestBuyStock | Util.Notify | 구매: | B |
| Item/PlayerShop.mlua | 114 | RequestBuyCount | Util.Notify | 구매: | B |
| Item/PlayerShop.mlua | 152 | Buy | Util.Notify | 도박: | B |
| Monster/BossPattern.mlua | 809 | Announce | HudMap.TopPush | boss: | A |
| Monster/BossPattern.mlua | 812 | Announce | NoticeFeed.Push | 처치! | B (채널 A를 끈 때만) |
| Monster/Monster.mlua | 730 | Die | Util.NotifyTopMap | boss: | A |
| Monster/Monster.mlua | 820 | TryRespawn | Util.NotifyTopMap | bossup: | A |
| Monster/MonsterSpawner.mlua | 503 | TrackNamed | Util.NotifyTopMap | boss: | A |
| Monster/MonsterSpawner.mlua | 512 | TrackNamed | Util.NotifyTopMap | bossup: | A |
| Player/PetSystem.mlua | 107 | ProcessPurchase | Util.Notify | 펫 「 | B |
| Player/PlayerCorpses.mlua | 58 | EnsureSpawned | Util.Notify | 지난번에 쓰러진 시체가 마을에 있습니다 — 다가가면 장비를 되찾습니다 (미니… | B |
| Player/PlayerCorpses.mlua | 170 | TakeCorpse | Util.Notify | 시체를 되찾았습니다 | B |
| Player/PlayerSave.mlua | 154 | Protect | Util.Notify | 저장 데이터를 읽지 못했습니다. 기존 데이터 보호를 위해 저장을 중단합니다 | B |
| Player/PlayerSave.mlua | 339 | RequestCreateSlot | Util.Notify | 새 캐릭터 「 | B |
| Player/PlayerSave.mlua | 345 | RequestCreateSlot | Util.Notify | 새 캐릭터 「 | B |
| Player/PlayerSave.mlua | 355 | RequestCharSelect | Util.Notify | 쓰러진 상태에서는 캐릭터를 바꿀 수 없습니다 | B |
| Player/PlayerSave.mlua | 361 | RequestCharSelect | Util.Notify | 저장에 실패해 캐릭터 선택으로 가지 않았습니다. 다시 시도해주세요 | B |
| Player/PlayerSave.mlua | 376 | RequestCharSelect | Util.Notify | 캐릭터 선택으로 이동하지 못했습니다. 다시 시도해주세요 | B |
| Player/PlayerSave.mlua | 391 | RequestCharSelect | Util.Notify | 캐릭터 선택으로 이동하지 못했습니다. 다시 시도해주세요 | B |
| Player/PlayerSave.mlua | 409 | LeaveSelectRoom | Util.Notify | 이동하지 못했습니다. 다시 골라 주세요 | B |
| Player/PlayerSave.mlua | 426 | RequestDeleteSlot | Util.Notify | 캐릭터 「 | B |
| Player/PlayerSave.mlua | 487 | WarpToChannel | Util.Notify | 쓰러진 상태에서는 채널을 옮길 수 없습니다 | B |
| Player/PlayerSave.mlua | 493 | WarpToChannel | Util.Notify | 저장에 실패해 채널을 옮기지 않았습니다. 다시 시도해주세요 | B |
| Player/PlayerSave.mlua | 506 | WarpToChannel | Util.Notify | 채널을 옮기지 못했습니다 (가득 찼거나 닫히는 채널). 다른 채널을 고르세요 | B |
| Player/PlayerSave.mlua | 579 | ContinueDepthTravel | Util.Notify | 다음 층 이동에 실패했습니다. 마을에서 다시 입장하세요 | B |
| Player/PlayerSave.mlua | 594 | PrepareRoomMove | Util.Notify | 저장에 실패해 이동하지 않았습니다. 다시 시도해주세요 | B |
| Player/PlayerTravel.mlua | 114 | LeaveInstanceToTown | Util.Notify | 마을로 돌아가지 못했습니다. 다시 시도해주세요 | B |
| Player/PlayerTravel.mlua | 318 | OpenBossPortal | Util.NotifyMap | 처치 — 옆에 마을로 가는 포털이 1분 동안 열렸습니다 | B |
| Progress/PlayerJournal.mlua | 265 | RequestClaim | Util.Notify | 업적 보상을 받을 가방 공간 1칸이 필요합니다. 보상은 보관됩니다 | B |
| Progress/ProgressionSystem.mlua | 90 | AnnounceActBoss | Util.Notify | text, u.PlayerComponent.UserId) end | B |
| Quest/PlayerQuest.mlua | 431 | TurnIn | Util.Notify | 보상 받을 가방 공간 | B |
| Quest/PlayerQuest.mlua | 497 | TurnIn | Util.Notify | 보상: | B |
| Quest/PlayerQuest.mlua | 541 | StartGearWatch | Util.Notify | 새 장비는 가방에서 지금 장비와 비교해 장착해 주세요. 장착하면 다음 전투부… | B |
| Quest/PlayerQuest.mlua | 674 | OfferGearChoice | Util.Notify | 보상 받을 가방 공간 | B |
| Shadow/ShadowCommander.mlua | 432 | OnUnitDied | Util.Notify | 그림자가 지쳤습니다 — 마을에 들를 때까지 소환할 수 없습니다 ( | B |
| Shadow/ShadowCommander.mlua | 434 | OnUnitDied | Util.Notify | %s 그림자 쓰러짐 %d/%d — 한도가 차면 마을에 들를 때까지 부를 수 … | B · 상한 60초 |
| Shadow/ShadowOwner.mlua | 94 | DisassembleMany | Util.Notify | 그림자 | B |
| Shadow/ShadowOwner.mlua | 207 | RestAll | Util.Notify | 마을에서 쉬어 지친 그림자가 다시 싸울 수 있습니다 | B |
| Shadow/ShadowOwner.mlua | 246 | GainKillExp | Util.Notify | 그림자 레벨 업 · | B |
| Shadow/SoulExtractor.mlua | 108 | TryExtractNearby | NoticeFeed.Push | 혼 추출은 스킬 「그림자 소환」(Lv | B |
| Shadow/SoulExtractor.mlua | 114 | TryExtractNearby | NoticeFeed.Push | 가까운 혼이 없습니다 | B |
| Shop/Supporter.mlua | 104 | ProcessPurchase | Util.Notify | 후원 고맙습니다! 개발자가 오늘 밤도 커피 마시고 패치하러 갑니다 | B |
| Social/ChannelSystem.mlua | 91 | RequestMove | Util.Notify | 이미 이 채널에 있습니다 | B |
| Social/ChannelSystem.mlua | 95 | RequestMove | Util.Notify | 심도·캐릭터 선택 중에는 채널을 옮길 수 없습니다 — 야영지나 사냥터에서 옮… | B |
| Social/ChannelSystem.mlua | 106 | RequestMove | Util.Notify | 그 채널은 이제 없습니다 — 목록을 새로 불러오세요 | B |
| Social/ChannelSystem.mlua | 111 | RequestMove | Util.Notify | 그 채널은 가득 찼습니다 | B |
| Social/ChannelSystem.mlua | 137 | CheckOverflow | Util.Notify | 이 채널은 곧 들어올 파티의 자리라 자리가 있는 채널로 옮깁니다 | B |
| Social/PartyRescue.mlua | 132 | Done | Util.Notify | 님을 일으켜 세웠습니다 | B |
| Social/PlayerDuel.mlua | 95 | End | Util.Notify | message, self.Entity.PlayerComponent.UserI… | B |
| Social/PlayerSocial.mlua | 41 | RequestAction | Util.Notify | 상대가 다른 요청을 처리 중입니다 | B |
| Social/PlayerSocial.mlua | 49 | RequestAction | Util.Notify | 님에게 | B |
| Social/PlayerSocial.mlua | 71 | RespondRequest | Util.Notify | 님이 거절했습니다 | B |
| Social/PlayerSocial.mlua | 83 | RespondRequest | Util.Notify | 이미 결투 중입니다 | B |
| Social/PlayerSocial.mlua | 84 | RespondRequest | Util.Notify | 이미 결투 중입니다 | B |
| Social/PlayerTrade.mlua | 97 | RequestOffer | Util.Notify | 잠긴 물건은 거래할 수 없습니다. 잠금을 풀어주세요 | B |
| Social/PlayerTrade.mlua | 229 | ReturnEscrow | Util.Notify | 가방이 가득 차 돌려받은 물건 | B · 상한 60초 |
| Social/PlayerTrade.mlua | 249 | Finish | Util.Notify | message, self.Entity.PlayerComponent.UserI… | B |
| Social/RoomSystem.mlua | 246 | RequestCreate | Util.Notify | 비공개 방은 비밀번호가 필요합니다 | B |
| Social/RoomSystem.mlua | 262 | RequestCreate | Util.Notify | 방 목록에 쓰지 못했습니다. 다시 시도해주세요 | B |
| Social/RoomSystem.mlua | 278 | RequestJoin | Util.Notify | 그 방은 이제 없습니다 — 목록을 새로 불러오세요 | B |
| Social/RoomSystem.mlua | 283 | RequestJoin | Util.Notify | 비밀번호가 맞지 않습니다 | B |
| Social/RoomSystem.mlua | 287 | RequestJoin | Util.Notify | 방이 가득 찼습니다 | B |
| Social/RoomSystem.mlua | 294 | RequestJoin | Util.Notify | 아직 열지 않은 난이도의 방입니다 | B |
| Social/RoomSystem.mlua | 313 | RequestJoin | Util.Notify | 모집에 끼지 못했습니다 (가득 찼거나 출발함) — 목록을 새로 불러오세요 | B |
| Social/RoomSystem.mlua | 358 | TryStart | Util.Notify | 지금은 | B |
| Social/RoomSystem.mlua | 379 | TryStart | Util.Notify | 출발하지 못했습니다. 다시 시도해주세요 | B |
| Social/RoomSystem.mlua | 440 | GoTo | Util.Notify | 그 방이 있던 채널이 닫혔습니다 — 다른 방을 고르세요 | B |
| Social/RoomSystem.mlua | 445 | GoTo | Util.Notify | 그 방의 채널이 가득 찼습니다 — 자리가 나면 자동으로 들어갑니다 (최대 5… | B · 상한 60초 |
| Social/RoomSystem.mlua | 467 | Poll | Util.Notify | 모집이 끝났습니다 (팀장이 나갔거나 오래 소식이 없음) | B |
| Social/RoomSystem.mlua | 479 | Poll | Util.Notify | 함께 들어갈 채널을 찾지 못했습니다. 다시 시도해주세요 | B |
| Social/RoomSystem.mlua | 494 | Poll | Util.Notify | 기다리던 방이 닫혔거나 가득 찼습니다 — 다른 방을 고르세요 | B |
| Social/RoomSystem.mlua | 498 | Poll | Util.Notify | 5분 동안 자리가 나지 않았습니다 — 다른 방을 고르거나 다시 시도해주세요 | B |
| Social/RoomSystem.mlua | 662 | Enter | Util.Notify | 방에 들어가지 못했습니다. 다시 시도해주세요 | B |
| Social/RoomSystem.mlua | 692 | OnLobbyReady | Util.Notify | 그 방이 닫혔거나 가득 찼습니다 — 다른 방을 고르세요 | B |
| Social/RoomSystem.mlua | 744 | RequestLeaveGame | Util.Notify | 쓰러진 상태에서는 나갈 수 없습니다 | B |
| Social/RoomSystem.mlua | 757 | RequestLeaveGame | Util.Notify | 로비로 나가지 못했습니다. 다시 시도해주세요 | B |
| Social/TownBoard.mlua | 319 | RequestToggleLfg | Util.Notify | 게시판에 쓰지 못했습니다. 다시 시도해주세요 | B |
| Social/TownBoard.mlua | 333 | RequestInvite | Util.Notify | 이 게임은 이미 가득 찼습니다 | B |
| Social/TownBoard.mlua | 338 | RequestInvite | Util.Notify | 그 사람은 이제 파티를 찾지 않습니다 | B |
| Social/TownBoard.mlua | 346 | RequestInvite | Util.Notify | 그 사람은 아직 | B |
| Social/TownBoard.mlua | 351 | RequestInvite | Util.Notify | 님에게 초대를 보냈습니다 | B |
| Social/TownBoard.mlua | 428 | AnswerInvite | Util.Notify | 지금은 다른 게임으로 옮길 수 없습니다 | B |
| Social/TownBoard.mlua | 434 | AnswerInvite | Util.Notify | 아직 열지 않은 난이도의 게임입니다 | B |
| Social/TownBoard.mlua | 439 | AnswerInvite | Util.Notify | 게임을 옮기지 못했습니다. 다시 시도해주세요 | B |
| Social/TownBoard.mlua | 459 | AnswerInvite | Util.Notify | 게임을 옮기지 못했습니다. 다시 시도해주세요 | B |
| Story/AshAwakening.mlua | 265 | Awaken | HudMap.ShowAlert | 하늘이 핏빛으로 물든다 | A |
| UI/Hud/HudMain.mlua | 102 | OnBeginPlay | NoticeFeed.Push | d) end | B |
| UI/Hud/HudMain.mlua | 507 | PickupPop | NoticeFeed.Push | text) | B (창이 떠 있을 때 줍기) |
| UI/Hud/HudMain.mlua | 692 | RaidWarn | HudMap.TopPushFor | raid:warn | A |
| UI/Hud/HudMain.mlua | 789 | RaidDefeated | HudMap.TopPush | raid:done | A |
| UI/Hud/UXFeedback.mlua | 153 | Push | HudMap.TopPush | : | A |
| UI/Hud/UXFeedback.mlua | 159 | Push | NoticeFeed.Push | self:LineText(title, detail, true)) | B (큰 알림 넘침·창 안 결과) |
| UI/Hud/UXFeedback.mlua | 208 | DropOne | NoticeFeed.Push | self:LineText(m.title, m.detail, false)) | B (큰 알림 넘침·창 안 결과) |
| UI/Hud/UXFeedback.mlua | 359 | Release | NoticeFeed.Push | 외 알림 | B (큰 알림 넘침·창 안 결과) |
| UI/Windows/GuideWindow.mlua | 461 | Later | NoticeFeed.Push | 게임 안내는 메뉴에서 다시 볼 수 있습니다 | B |
| UI/Windows/JournalWindow.mlua | 123 | UpdateBadge | HudMain.SetJournalTrack |  | C |
| Undead/UndeadSystem.mlua | 806 | Raise | Util.Notify | 는 지금 최대 | B · 상한 60초 |
| Undead/UndeadSystem.mlua | 1647 | StashForRoomTravel | Util.Notify | 소환수 이동 준비에 실패했습니다. 다시 시도해주세요 | B |
| Undead/UndeadSystem.mlua | 1653 | StashForRoomTravel | Util.Notify | 소환수 이동 준비에 실패했습니다. 다시 시도해주세요 | B |
| World/AltarRitual.mlua | 68 | OnReached | Util.Notify | 피의 제단이 잠잠합니다 — %d:%02d 뒤 다시 의식을 시작할 수 있습니다 | B |
| World/AltarRitual.mlua | 223 | Bless | Util.Notify | 피의 신전 · 주는 피해 +25% (60초) | B |
| World/AltarRitual.mlua | 229 | Tell | Util.Notify | text, p.PlayerComponent.UserId) end | B |
| World/CoopRules.mlua | 113 | HurryForQuest | Util.NotifyMap | 퀘스트가 남은 플레이어가 들어왔습니다 — 쓰러진 적이 | B |
| World/CursedChest.mlua | 103 | Open | Util.Notify | 저주받은 상자! 매복이 덮친다 — 보물을 지켜라 | B |
| World/CursedChest.mlua | 170 | OpenSealed | Util.Notify | 봉인 상자를 열었습니다 | B |
| World/CursedChest.mlua | 185 | OpenReward | Util.Notify | 심도 보상 상자를 열었습니다 ( | B |
| World/MapShrine.mlua | 62 | Activate | Util.Notify | · | B |
| World/RoadAltar.mlua | 84 | Tick | Util.NotifyMap | 의식 습격 | B |
| World/RoadAltar.mlua | 117 | Begin | Util.NotifyMap | 이 깨어났다 — 망자들이 몰려온다 | B |
| World/RoadAltar.mlua | 212 | Finish | Util.Notify | 제단의 축복 · | B |
| World/RoadAltar.mlua | 216 | Finish | Util.NotifyMap | 제단의 의식을 끊었습니다 | B |

## 파일별 수만 적는 것

| 파일 | 부르는 법 | 수 | 채널 |
|---|---|---|---|
| Endgame/DepthGate.mlua | Util.Warn | 2 | 머리 위 경고 (창이 떠 있으면 B) |
| Item/PlayerBelt.mlua | Util.Warn | 1 | 머리 위 경고 (창이 떠 있으면 B) |
| Item/PlayerInventory.mlua | Util.Warn | 17 | 머리 위 경고 (창이 떠 있으면 B) |
| Item/PlayerShop.mlua | Util.Warn | 5 | 머리 위 경고 (창이 떠 있으면 B) |
| Monster/AshKingRite.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Monster/MonsterSpawner.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Player/PlayerStats.mlua | Util.Warn | 3 | 머리 위 경고 (창이 떠 있으면 B) |
| Player/PlayerTravel.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Player/PlayerTravel.mlua | Util.Warn | 7 | 머리 위 경고 (창이 떠 있으면 B) |
| Progress/PlayerJournal.mlua | Util.Banner | 4 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Progress/ProgressionSystem.mlua | Util.Banner | 2 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Quest/PlayerQuest.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Shadow/ShadowCommander.mlua | Util.Warn | 7 | 머리 위 경고 (창이 떠 있으면 B) |
| Shadow/ShadowOwner.mlua | Util.Banner | 2 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Shadow/ShadowOwner.mlua | Util.Warn | 6 | 머리 위 경고 (창이 떠 있으면 B) |
| Shadow/SoulExtractor.mlua | Util.Warn | 1 | 머리 위 경고 (창이 떠 있으면 B) |
| Skill/SkillBook.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Skill/SkillBook.mlua | Util.Warn | 12 | 머리 위 경고 (창이 떠 있으면 B) |
| Skill/SkillEffects.mlua | Util.Warn | 1 | 머리 위 경고 (창이 떠 있으면 B) |
| Social/PartyRescue.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Social/PlayerDuel.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Social/PlayerSocial.mlua | Util.Warn | 5 | 머리 위 경고 (창이 떠 있으면 B) |
| Social/PlayerTrade.mlua | Util.Warn | 10 | 머리 위 경고 (창이 떠 있으면 B) |
| Social/TownBoard.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| Undead/UndeadSystem.mlua | Util.Warn | 10 | 머리 위 경고 (창이 떠 있으면 B) |
| World/CursedChest.mlua | Util.Banner | 1 | 큰 알림 판 (업적 달성 · 일일 퀘스트 완료는 A) |
| World/CursedChest.mlua | Util.Warn | 1 | 머리 위 경고 (창이 떠 있으면 B) |
| World/WarpGate.mlua | Util.Warn | 2 | 머리 위 경고 (창이 떠 있으면 B) |
