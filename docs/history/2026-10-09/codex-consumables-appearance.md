# 소모품 8종 연결 및 기본 외형 유지

- 사용자 CSV 20261009185352의 8개 RUID를 상점·드롭·빠른 슬롯 아이콘에 적용. hp/mp 별칭은 하급 그림과 연결. 회복량·가격·장비 수치·저장 데이터는 보존.
- 이전 데몬 계열 외형은 Codex가 클라이언트 미리보기만 적용하여 소스에 남지 않았음. Claude 롤백으로 확인된 근거 없음.
- `data/player_appearance.csv`와 GameData 생성기에 월드 기본 피부·검은 긴 머리·보라 눈을 지정. PlayerInventory가 서버에서 장비 적용 시마다 기본 외형 적용; 계정 외형 재캡처 RPC 제거.
- 생성기 재실행·npm test 6/6·메이커 refresh 두 번·플레이 실제 확인. 8개 이미지 실제 로드 모두 true. 기본 외형 RUID 일치 및 다른 플레이 재시작 이후에도 유지.
- 증거: `codex-consumables-appearance-verification.json`.
- 잿빛 장막 6종 동작 그림 제작은 별도 착용 자산 작업으로 진행 중이며 아직 게임 장비에 연결하지 않음.
