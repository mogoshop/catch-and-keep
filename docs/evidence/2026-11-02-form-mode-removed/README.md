# 11-02 스킬 창 「직접 정하기」 삭제 (기획 52 §3-2 안 C) — 메이커 확인

- 01-pc-skeleton-main.png: PC · 인꾸(Lv17 · 해골 전사 4랭크) 해골 전사 공방 — 「직접 정하기」·머리 글·−/+ 없음, 편성 줄 「편성 0/3 · 다음 소환: 해골 전사」, 「강화 +1」 오른쪽 끝
- 02-pc-greatsword-node.png: PC · 대검 해골 노드를 골라도 스테퍼 없음
- 03-mobile-shard-toggle.png: 모바일(iPad) · 티스 공방 「누르고 있으면 반복: 끔」 + 「켜기」(강화 +1 왼쪽) 유지
- 04-mobile-skeleton-main.png: 모바일 · 해골 전사 공방에는 그 칸 없음
- vrf-log.txt: [VRF] 줄 (SelfTest 412/0 · roster place=rank · 실제 시전 5회)

실제 소환 (서버 임시 랭크 raise_skeleton 6 · 대검 2 · 쌍칼 1 · 정원 4 → 피 묻은 황무지 · 혼 5개 · SkillBook.Cast 5회):
cast#1 greatsword=1 → #2 greatsword=2 → #3 greatsword=2,twin=1 → #4 basic=1,greatsword=2,twin=1 (= 노드 랭크) → #5(정원 참·가장 오래된 대검 교체) basic=2,greatsword=1,twin=1.
#5는 10-24 자동 규칙 그대로(무너질 개체도 센 채 고름)라 교체 순간 한 변이가 랭크−1이 될 수 있다 — 이번 결정은 규칙을 바꾸지 않음.
확인 뒤 랭크 원복(skeleton_mastery=3 · raise_skeleton=4 · 변이 노드 없음) · 해골 해산. maker_save 하지 않음.
