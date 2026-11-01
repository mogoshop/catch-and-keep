'use strict';
// 공통 UI 규격 (10-22 사용자: 「공통값을 선언해 패딩은 다 공통으로 · 화면마다 다르지 않게 · PC/모바일 구분」).
// 창 테두리(win_frame, 9-slice)를 쓰는 모든 창과 대화 상자는 이 값만 쓴다. 숫자를 빌더에 따로 적지 않는다.
// 실행 중에 같은 값이 필요한 것(대화 상자 글 칸 배치·글자 크기)은 RootDesk/MyDesk/UI/Core/UIKit.mlua 「대화 상자 규격」과 짝을 맞춘다.

// 창 테두리 기준. 테두리 그림(win_frame 768×512)을 재 보면 안쪽 경계가 그림 가장자리에서 위 82 · 좌우 59 · 아래 56 안쪽이고,
// 그림은 바탕보다 rimOut(20)만큼 밖으로 넘치므로 바탕 기준으로는 위 62 · 좌우 39 · 아래 36 안쪽까지가 테두리다 (10-22 실측).
// 내용은 테두리 안쪽 경계에서 space(12)만큼 띄운다 → contentTop 74 · padX 51 · padBottom 48. 버튼 줄도 같은 아래 여백.
const INSET = { top: 62, side: 39, bottom: 36 };
const SPACE = 12;
const FRAME = {
  rimOut: 20,                          // 테두리 그림이 바탕 밖으로 넘치는 폭 (Rim = 바탕 + 2×rimOut)
  titleTop: 17,                        // 제목 칸 위쪽 = 바탕 위에서 17 (제목 띠 세로 가운데)
  titleH: 40,
  titleSize: 26,
  contentTop: INSET.top + SPACE,       // 74
  padX: INSET.side + SPACE,            // 51
  padBottom: INSET.bottom + SPACE,     // 48
  buttonBottom: INSET.bottom + SPACE,  // 48 (버튼 줄 바닥)
  gap: 16,                             // 나란한 칸 사이 (초상화 ↔ 글 칸, 버튼 ↔ 버튼, 줄 ↔ 줄)
  close: { size: 88, x: -12, y: -10 }, // 닫기 단추 (모든 창 공통 · 10-29 기획서 45 결정 2-A): 오른쪽 위 모서리에서 안쪽으로
};

// 모바일 좁은 화면 (10-29 기획서 45 결정 4-A): 4:3 태블릿은 화면에 보이는 폭이 1080 높이 기준 1440뿐이다 (메이커 iPad 미리보기 실측).
// 창 바깥 폭(테두리 포함) 상한 1440 · 화면 가장자리와 edge만큼 띄운다 → 창 바탕 폭 상한 = 1440 − 2×edge − 2×rimOut = 1368.
// 실행 중 배치(RootDesk/MyDesk/UI/Hud/WindowFit.mlua)가 같은 값을 쓴다 — tools/check_mobile_layout.cjs가 넓은 창 5개를 이 폭으로 잰다.
const NARROW = { visibleW: 1440, visibleH: 1080, edge: 16, bodyMaxW: 1440 - 16 * 2 - 20 * 2, bodyMaxH: 1080 - 16 * 2 - 20 * 2 };

// 테두리 없는 안쪽 판(win_content) 안 여백
const INNER = { pad: 24 };

// 스킬 창 V3 안쪽 판(sk_timeline_panel · sk_workshop_panel): 9조각 테두리 24 (코덱스 표 border 24) + space → 내용은 판 가장자리에서 36 안쪽.
// 10-28 사용자 「제목이 테두리에 걸침 · 다음 해금 글에 선이 지나감」 — 판 안 글·칸은 모두 이 여백 안에. 실행 중 배치(SkillWindow.mlua)도 같은 값.
const SKPANEL = { border: 24, pad: 24 + SPACE };

// 버튼 (모든 창 공통 · 터치 88 이상)
const BUTTON = { h: 88, w: 240, wide: 360, font: 22, fontMain: 26,
  padX: 30,        // 버튼 그림(btn_frame) 양 끝 장식 안쪽부터 글자 (장식에 글자가 닿지 않게)
  // 양 끝 장식(해골 + 안쪽 마름모 끝)이 단추 가장자리에서 차지하는 폭 — btn_frame 320×80 그림 열 분석(11-01): 왼쪽 38 · 오른쪽 36.
  //   padX(30)부터 글을 두면 긴 글이 마름모 끝(30~38)에 닿는다 (10-29 「정렬」·「여러 개 선택」). 글 길이로 폭을 정하는 단추는 artEdge + SPACE/2를 비운다
  artEdge: 38,
  minFont: 14 };   // 글이 길면 이 크기까지 줄인다 (「다음 ▶ [Space]」 같은 PC 단축키 안내)
// 넘김 단추 ◀ ▶ (액트 넘김 막대 kit.actPager · 플레이어 창 쪽 넘김 · 11-01 메이커 2회차 관찰 3 「◀▶ 실제 클릭이 단추 사건을 못 냄」):
//   예전 단추는 보이는 틀 그대로 64×64(막대) · 88×62(쪽 넘김) — 터치 하한 88에 못 미치고 막대 제목 글 칸이 ▶ 왼쪽을 덮었다.
//   → 누르는 칸 = 투명 단추 hit × hit (ButtonComponent · 그림 RaycastTarget 켬) · 보이는 틀(btn_frame)은 그 칸 안의 형제 그림 …Art(RaycastTarget 끔 · 먼저 그려 아래에 깔림)
//   · ◀ ▶ 글자는 단추 자신의 글 · 제목·쪽 글은 누르는 칸과 겹치지 않는다 (tests/quality/release_fix5.lua)
const ARROW = { hit: BUTTON.h, art: 64, font: 24 };
// 글 폭 어림 — 실행 중 UIKit.TextWidth와 같은 규칙: 한글·기호 1자 = 글자 크기 · 영문·숫자·빈칸 = 0.55배 (서식 태그는 뺀다).
//   메이커 실측(11-01 랭킹 탭 사진 · 기본 글꼴): 한글 0.92배 · 빈칸 0.23배 — 어림이 넉넉해서 「어림으로 한 줄에 든다」면 화면에서도 든다
const GLYPH = { wide: 1, narrow: 0.55 };
function textWidth(text, px) {
  let w = 0;
  for (const ch of String(text).replace(/<\/?[A-Za-z][\w-]*[^<>]*>/g, '')) w += (ch.codePointAt(0) > 127 ? GLYPH.wide : GLYPH.narrow) * px;
  return w;
}
// 랭킹 창 탭 (11-01 사용자 결정 2-C 「탭 폭 넓히기」 — 글귀·글자 크기 16 그대로. 폭 148에서 「보스 처치 시간」이 두 줄로 꺾였다).
//   탭 폭 = 가장 긴 탭 글(GLYPH 어림 · 한 줄) + 양쪽 side(단추 장식 artEdge + SPACE/2) → rankTabW. 글 칸 여백도 side (넘치면 줄이지 장식에 닿지 않게).
//   11-01 2차(RANK): 창이 넓어져(바탕 1188) 넷도 한 줄 — 4×202 + 3×16 = 856 ≤ 창 안쪽 1086. 보이는 탭(둘 또는 넷)만 한 줄 가운데.
//   실행 중 배치 RankWindow.LayoutTabs가 같은 값을 쓴다 (check_ui_tokens가 RankWindow 속성 · 빌드된 탭 · 2/4탭 배치 겹침을 잰다)
const RANKTAB = { font: 16, h: 56, top: FRAME.contentTop + SPACE, gapX: FRAME.gap, gapY: SPACE, perRow: 4, side: BUTTON.artEdge + SPACE / 2 };
function rankTabW(labels) {
  return Math.ceil(Math.max(...labels.map((t) => textWidth(t, RANKTAB.font))) + RANKTAB.side * 2);
}
// 보이는 탭 n개의 자리 (창 바탕 위 가운데 기준, y는 위에서 아래로 −). RankWindow.LayoutTabs와 같은 계산 — 줄이 둘 이상이면 기록 판이 그만큼 내려간다
function rankLayout(n, tabW) {
  const R = RANKTAB;
  const rows = Math.max(1, Math.ceil(n / R.perRow));
  const tabs = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / R.perRow), inRow = Math.min(R.perRow, n - row * R.perRow), col = i % R.perRow;
    tabs.push({ x: (col - (inRow - 1) / 2) * (tabW + R.gapX), y: -(R.top + row * (R.h + R.gapY)) });
  }
  return { rows, tabs, below: (rows - 1) * (R.h + R.gapY) };
}
// 랭킹 창 2차 (11-01 사용자 「랭킹창에 이 공백은 도대체 뭐여 줄이자 · 캐릭터도 작게 · 20위까지 · ui는 너가 판단」 — docs/evidence/2026-11-01-rank-window-2):
//   ① 공백: 예전엔 심연 탭에서만 쓰는 액트 넘김 막대 자리(76 + 사이)가 모든 탭에 비어 있었다 → 막대는 기록 판 머리 줄 오른쪽(심연 탭에서만 머리 줄이 막대 높이),
//      나머지 탭은 머리 줄 한 줄 · 보이는 것만 위에서 아래로 쌓는다 (탭 → 기록 판[머리 줄 → 목록 → 내 순위]).
//   ② 상위 20 = 칸 4 × 5줄 (1·2·3·4 / 5·6·7·8 …, 순위는 칸마다 숫자) — 스크롤 없음(PC 휠 스크롤 미지원). 1~10 | 11~20 두 칸(줄 40 · 그림 36×40)보다
//      창이 낮고(본문 668 대 728) 캐릭터 그림이 크다(44×56). 칸 = 순위 | 캐릭터 그림(UI 아바타) | 이름(위) · 기록(아래)
//   ③ 하단 메뉴 줄·퀵슬롯·버프 줄과 떨어지게 (메이커 11-01 관찰 2: 예전 탭 넷 배치 창 752가 하단 메뉴 줄에 닿을 듯): 창 테두리 위 끝(rimTop)을 고정하고
//      아래로만 늘고 준다 — 가장 긴 배치(심연 탭 · 머리 줄 76)도 테두리 아래 끝이 버프 줄(−266)·하단 메뉴 줄(−306) 위. 아이폰 가로 안전영역(위 끝 512)에서도 위 여백이 남는다.
//      실행 중 배치 RankWindow.Layout이 같은 값을 쓴다 (check_ui_tokens가 RankWindow 속성 · 빌드 · 탭 둘/넷 × 막대 보임/숨김 배치를 잰다)
const RANK = {
  top: 20, cols: 4, rows: 5,
  cellW: 264, cellH: 62, gapX: 10, gapY: 6,      // 칸 · 칸 사이 (4 × 264 + 3 × 10 = 1086)
  // 칸 안: 순위 34 | 그림(UI 아바타 avatar) | 글. 11-01 메이커 2회차 관찰 1: 44×56 칸에 PreserveAvatar 1로 그리면 몸은 그 칸의 가로 0.56 · 세로 0.68만 차지하고
  //   (머리 위 0.30이 빈 캔버스 · 발은 칸 아래 끝에서 0.02) 실제 화면 약 25×38 — 「44×56 그림」 의도보다 작았다(avatarFill = 그 실측 비율).
  //   → 아바타 칸을 64×80으로 키우고 칸 아래에 붙여(avatarBottom) 보이는 몸(약 36×54)이 칸 높이 안에 들게 한다. 칸 위로 넘치는 부분은 빈 캔버스뿐(누름 받지 않음).
  //   글은 보이는 몸 오른쪽 끝(아바타 칸 오른쪽 − 빈 옆 avatarSide)에서 textGap. 내 순위 줄(56)은 mineAvatar 56×70
  cellPad: SPACE / 2, rankW: 34, avatarGap: 2, avatar: [64, 80], avatarBottom: 2, mineAvatar: [56, 70], avatarFill: { w: 0.56, h: 0.68, foot: 0.02 }, textGap: SPACE / 2,
  nameH: 24, valueH: 24, textInset: 7,           // 이름(칸 위에서 7) · 기록(칸 아래에서 7) 두 줄
  pad: SPACE, gap: SPACE, headH: 40, actBarW: 420, actBarH: 76,   // 기록 판 안 여백 · 덩어리 사이 · 머리 줄(심연 탭이면 막대 높이 76)
  mineH: 56, mineLabelW: 96, mineRankW: 120, mineNameW: 320, mineValueW: 360,   // 내 순위 줄 (판 아래 · 칸과 같은 그림 크기)
  // 창 테두리 아래 모서리 꽃불 장식이 바탕 안으로 들어오는 폭 (메이커 11-01 iPad 캡처 B7 실측 약 44~50 — 예전 「내 순위」 글 첫 글자가 장식 위에 겹쳤다).
  //   내 순위 줄은 판 아래에 붙어 장식 높이 안이라, 줄 안 글·그림은 양끝에서 mineInset 띄워 바탕 가장자리에서 cornerClear 이상 떨어지게
  mineInset: SPACE * 2, cornerClear: 64,
  edge: INSET.side, bottom: INSET.bottom,        // 기록 판 좌우 = 창 테두리 안쪽 경계 · 판 아래 ↔ 창 바탕 아래
  rimTop: 496,                                   // 창 테두리 위 끝 (화면 가운데 기준 · PC 위 여백 44 · 아이폰 가로 안전영역 1025의 위 끝 512에서 16)
  font: { rank: 22, name: 18, value: 16, head: 20, mine: 20, min: 13 },
};
// 아바타 칸 [w, h] 안에서 보이는 몸 상자 (칸 왼쪽 아래 기준 · avatarFill 실측) — check_ui_tokens · release_fix5가 칸 안·글과 안 겹침을 이 상자로 잰다
function rankAvatarBody(size) {
  const F = RANK.avatarFill, side = Math.round((size[0] - size[0] * F.w) / 2);
  return { l: side, r: size[0] - side, b: Math.round(size[1] * F.foot * 10) / 10, t: Math.round(size[1] * (F.foot + F.h) * 10) / 10, side };
}
RANK.avatarSide = rankAvatarBody(RANK.avatar).side;                                          // 14
RANK.mineAvatarSide = rankAvatarBody(RANK.mineAvatar).side;                                  // 12
RANK.textX = RANK.cellPad + RANK.rankW + RANK.avatarGap + RANK.avatar[0] - RANK.avatarSide + RANK.textGap;   // 98
RANK.textW = RANK.cellW - RANK.textX - RANK.cellPad;                                        // 160
RANK.listW = RANK.cols * RANK.cellW + (RANK.cols - 1) * RANK.gapX;                          // 1086
RANK.listH = RANK.rows * RANK.cellH + (RANK.rows - 1) * RANK.gapY;                          // 334
RANK.paperW = RANK.listW + RANK.pad * 2;                                                     // 1110
RANK.winW = RANK.paperW + RANK.edge * 2;                                                     // 1188
RANK.paperTop = RANKTAB.top + RANKTAB.h + SPACE;                                             // 154 — 탭 한 줄 바로 아래
// 배치: kind = progress · boss_* (머리 줄 한 줄) / depth · week (머리 줄 = 막대 높이 · 막대 오른쪽). tabRows = 탭 줄 수(지금은 늘 1)
function rankWinLayout(kind, tabRows = 1) {
  const R = RANK;
  const paged = kind === 'depth' || kind === 'week';
  const headH = paged ? R.actBarH : R.headH;
  const paperTop = R.paperTop + (tabRows - 1) * (RANKTAB.h + RANKTAB.gapY);
  const listTop = R.pad + headH + R.gap;
  const paperH = listTop + R.listH + R.gap + R.mineH + R.pad;
  const winH = paperTop + paperH + R.bottom;
  const top = R.rimTop - FRAME.rimOut;                    // 창 바탕 위 끝 (고정)
  return { paged, headH, paperTop, listTop, paperH, winH, winY: top - winH / 2, rim: [R.winW + FRAME.rimOut * 2, winH + FRAME.rimOut * 2], rimBottom: R.rimTop - winH - FRAME.rimOut * 2 };
}
// 장식 없는 어두운 칸 테 (ui_loot_label 96×32 · 9조각 테두리 12 — 코덱스 feel-fx-v2 「밝은 회색 얇은 테 · 색을 입히는 용도 · 안쪽 반투명 검정 · 돌출 장식 없음」).
//   11-01 사용자 결정 3-A: 스킬 창 머리 줄 「선택 보상」 칸이 공방 노드 테(sk_ws_node_frame_*, 둥근 테 + 가시 장식)를 칸 폭으로 늘려 써서 이름이 장식 위로 지나갔다 → 이 판으로.
//   테 선은 가장자리에서 5px 안쪽까지(모서리 빗면 포함 · 그림 실측) → 아이콘·꼬리표·글은 pad(SPACE/2) 안쪽. 칸 상태는 그림 대신 테 색(SkillWindow.RenderChoices)
//   11-01 메이커 관찰 1: 고른 칸의 금빛 「선택 보상」 꼬리표 오른쪽 끝과 단계 글 「노말」이 붙어 「선택 보상노말」로 읽혔다 → 글은 꼬리표 끝에서 gap만큼 띄운다 (이름·단계 두 줄 같은 x)
const PLATE = { key: 'ui_loot_label', border: 12, rim: 5, pad: SPACE / 2, gap: SPACE / 2 };
// 책갈피 칸 (guide_tab 320×88): 왼쪽 해골 장식 40 · 오른쪽 화살촉 50을 뺀 안쪽에 아이콘 + 이름을 가운데로 (10-27 사용자: 「목차 내부 패딩 엉망 · 수평 중앙」)
const TAB = { artLeft: 40, artRight: 50, icon: 44, gap: 8, font: 24, minFont: 16 };
// 스킬 지정 창 탭 (SkillPick/Tab1~5 · 152×88): 위 줄 = 칸 이름(단추 자신의 글) · 아래 줄 = 든 스킬 이름(자식 글 Tab/Name).
//   11-02 메이커: 한 글 칸에 「칸 이름\n스킬 이름」을 넣으면 7자 「포이즌 미스트」가 92px에 안 들어 글자 단위로 꺾여 세 줄이 됐다 —
//   TextGUIRenderer에는 줄바꿈 끄기 속성이 없고(늘 접힌다) BestFit은 접힌 줄이 칸 높이에 들어가면 줄이지 않는다(fitButtonText 메모와 같은 성질).
//   → 두 글 칸을 각각 한 줄 높이(글자 × 약 1.58, BAND 38/24와 같은 비)로 좁혀, 길면 접지 않고 글자를 줄인다. 아래 줄은 하한에서도 넘치면 말줄임.
//   위에서부터: top 12 · 칸 이름 34 · 스킬 이름 28 · bottom 14 (= 88). 폭은 BUTTON.padX 안쪽 92 — 「드레드 셰이드」 5.75em(실측 0.92·0.23) → 약 16px
const PICKTAB = { w: 152, h: 88, top: 12, labelH: 34, nameH: 28, font: 22, nameFont: 18, minFont: 12 };
// HUD 장식 띠 (sk_offer_banner 360×72, 9조각 20 — 「스킬 추천 / 선택 보상 — 고르기」 OfferBand · 10-29 UI-20261029-01):
//   글은 한 줄. 양 끝 장식(약 40) 안쪽 padX부터, 위아래 padY로 글 칸을 한 줄 높이(72 − 34 = 38)로 좁혀 두 줄로 갈라지지 않게.
//   긴 제목은 실행 중(UIKit.SetBandText)에 폭을 maxW까지 넓히고 → 글자를 minFont까지 줄이고 → 끝내 말줄임. 같은 값: SkillOffer.mlua Band*
const BAND = { h: 72, minW: 440, maxW: 720, maxWMobile: 600, padX: 48, padY: 17, font: 24, minFont: 17 };
function bandText() {
  return { Padding: { left: BAND.padX, right: BAND.padX, top: BAND.padY, bottom: BAND.padY }, BestFit: true, MinSize: BAND.minFont, MaxSize: BAND.font, Overflow: 1 };
}
// 테두리 버튼 글자 칸 (모든 빌더 공통): 장식 안쪽 여백 + 넘치면 줄이기
function buttonText(fontSize) {
  return { Padding: { left: BUTTON.padX, right: BUTTON.padX, top: 0, bottom: 0 }, BestFit: true, MinSize: BUTTON.minFont, MaxSize: fontSize };
}

const COLOR = {
  title: '#F6E3B0',   // 창 제목 · 대화 상자 이름 (모든 화자 공통)
  body: '#E6DCC6',    // 대화 글
  dim: '#9C9488',     // 쪽 표시 · 안내
  panel: { r: 0.05, g: 0.045, b: 0.06, a: 0.94 },
  windowBg: { r: 0.05, g: 0.045, b: 0.06, a: 1 },   // 창 바탕 (모든 창 공통 · 꽉 찬 그림 gauge_fill에 입힌다 — 기본 판 그림은 가운데가 비쳐 뒤가 보였다)
};

// 대화 상자 (NPC 대화창 · 이야기 카드 공통)
const DIALOG = {
  width: 1300,
  portrait: { w: 220, inset: 12 },      // 초상화 칸 너비, 그림은 칸 안쪽 inset만큼 작게
  textPad: { x: 20, y: 14 },            // 글 칸(Paper) 안쪽 여백
  pageNo: { right: 14, bottom: 8, w: 360, h: 28, size: 18 },
  font: { pc: 26, mobile: 30, min: 18 }, // 대화 글 크기 (긴 글은 min까지 줄인다)
  storyPaperH: 200,                      // 이야기 카드 글 칸 높이 (버튼 줄 없음)
  npcPaperH: 150,                        // NPC 대화창 글 칸 높이 (아래에 버튼 줄)
  npcHeight: 372,                        // contentTop 74 + 글 칸 150 + 12 + 버튼 88 + 아래 48
  npcButtonW: 184,                       // NPC 대화창 버튼 다섯 개 (184 × 5 + 칸 사이 16 × 4)
};

// 대화 상자 초상화: 발밑 기준. 코덱스 NPC 그림은 기준점이 발밑(pivot_y 0)이라 「비율 유지」로 가운데에 두면 그림이 칸 위로 밀려난다 (10-22 무하드).
// 칸 아래 가운데에 발을 붙이고 PreserveSprite 0(그대로 맞춤)으로 그린다 — 메이플 그림(thumbnail://)도 같은 방식으로 맞는다 (메이커 실측)
function portraitSprite(paperH) {
  return { anchor: 'bottom-center', pivot: [0.5, 0], pos: [0, DIALOG.portrait.inset],
    rect_size: [DIALOG.portrait.w - DIALOG.portrait.inset * 2, paperH - DIALOG.portrait.inset * 2], color: '#FFFFFF', sprite_type: 0 };
}

// 대화 상자 안 배치 (x는 바탕 왼쪽에서, y는 바탕 위에서 아래로)
function dialogLayout(height, withPortrait) {
  const paperH = height - FRAME.contentTop - FRAME.padBottom;
  const portraitX = FRAME.padX;
  const paperX = withPortrait ? FRAME.padX + DIALOG.portrait.w + FRAME.gap : FRAME.padX;
  const paperW = DIALOG.width - paperX - FRAME.padX;
  return { portraitX, paperX, paperW, paperH };
}

// 위쪽 가운데 띠 자리 (PC · 10-29 45-1 · docs/ui/message-rules.md): 위에서부터 ① 대상 체력 띠 → ② 알림 칸(여정 안내 · 맵 배너가 차례로 같은 칸) → ③ 출구 안내.
// 대상 띠 높이는 실행 중 114 (HudMain.OnBeginPlay — 저주 줄 44 포함). 칸 사이는 SPACE. 모바일 자리는 MobileLayout
const TOPBAND = { targetTop: 20, targetH: 114, tipH: 74, gap: SPACE };
TOPBAND.slot2 = TOPBAND.targetTop + TOPBAND.targetH + TOPBAND.gap;   // 146 — 여정 안내 위 끝
TOPBAND.slot3 = TOPBAND.slot2 + TOPBAND.tipH + TOPBAND.gap;          // 232 — 출구 안내 위 끝

// 플레이어 창 (P · 제목 「파티플레이」 · 11-01 같은 채널 전원 · docs/evidence/2026-11-01-channel-players).
//   파티마다 같은 글자색 + 왼쪽 색 띠 + 줄 바탕(그 색 × rowAlpha) + 「파티 · N명」. 첫 색 = 내 파티, 다른 파티는 나머지를 차례로 (이웃한 묶음끼리 다른 색).
//   어두운 창 바탕(COLOR.windowBg)·그 색이 깔린 줄 바탕 위 대비 4.5 이상 · 색끼리 ΔE(CIE76) 30 이상 · 혼자 글자색(solo)·흐린 글자색(dim)과도 30 이상
//   (tests/quality/channel_roster.lua). 초록은 쓰지 않는다 (예전 「같은 곳」 초록과 헷갈린다). 실행 중 값 = SocialWindow PartyColors · SoloColor · DimColor · RowAlpha
const PARTY = { colors: ['#6CC4FF', '#FFB45A', '#FF8CC6', '#B9A2FF', '#5EDBC4', '#B6E35A'], solo: '#E6DCC6', dim: '#9C9488', rowAlpha: 0.16 };
// 배치 (창 바탕 왼쪽 위 기준 · x는 줄 안에서): 맨 위 요약 한 줄 → 줄 perPage개(색 띠 · 「파티 · N명」 · 이름/위치 두 줄 · 단추 넷) → 아래 「파티 탈퇴」 · ◀ 쪽 ▶.
//   최대 20명(채널 상한)이라 8줄 × 3쪽. 단추 x+w 끝 = 줄 폭(winW − 2×padX). 실행 중 SocialWindow.PerPage = perPage
//   줄 단추(파티·결투·거래·살펴보기 · 11-01 메이커 2회차 관찰 6): 장식 단추(btn_frame)는 폭 104에서 양 끝 장식 사이 글 칸이 44뿐이라 「파티원」(17px 어림 51)이 두 줄로 꺾이고
//   좁게 늘어난 가운데에 어두운 띠가 보였다 → 사용자 결정 3-A와 같은 민무늬 칩 테(PLATE · ui_loot_label 9조각) · 글 칸 = 폭 − 2 × chipInset(테 선 + pad) · 한 줄.
//   폭 = 그 단추에 올 수 있는 가장 긴 글(chipLabels) + 양쪽 chipInset, 터치 하한 chipMinW(88) — socialChipW. 단추는 줄 오른쪽 끝에서 chipGap씩 (btn = 그 계산 값)
//   색 띠(Mark)·줄 바탕(Bg)은 흰 사각 판(ui_icons ui_white_square)에 파티 색을 입힌다 (관찰 5: 예전 gauge_fill은 붉은 그림이라 하늘색이 보라 · 호박색이 빨강으로 곱해졌다)
const SOCIAL = { winW: 1040, posY: 40, summaryH: 32, rowH: 54, rowGap: 6, perPage: 8, markW: 6, tagX: 12, tagW: 132, nameX: 152, nameW: 402,
  btn: [{ name: 'Party', label: '파티', x: 566, w: 88 }, { name: 'Duel', label: '결투', x: 660, w: 88 }, { name: 'Trade', label: '거래', x: 754, w: 88 }, { name: 'Inspect', label: '살펴보기', x: 848, w: 90 }],
  chipLabels: { Party: ['파티', '초대', '파티원'], Duel: ['결투', '포기'], Trade: ['거래'], Inspect: ['살펴보기'] },
  chipInset: PLATE.rim + PLATE.pad, chipMinW: BUTTON.h, chipGap: SPACE / 2, chipRim: '#B8AE9A', fillKey: 'ui_white_square',
  barH: 62, leaveW: 200, pagerBtnW: 88, pagerW: 300, font: 17 };
function socialChipW(name) {
  return Math.max(SOCIAL.chipMinW, Math.ceil(Math.max(...SOCIAL.chipLabels[name].map((t) => textWidth(t, SOCIAL.font))) + SOCIAL.chipInset * 2));
}
SOCIAL.rowStep = SOCIAL.rowH + SOCIAL.rowGap;                                       // 60
SOCIAL.rowW = SOCIAL.winW - FRAME.padX * 2;                                          // 938
SOCIAL.rowTop = FRAME.contentTop + SOCIAL.summaryH + SPACE;                          // 118 — 첫 줄 위 끝 (바탕 위에서)
SOCIAL.winH = SOCIAL.rowTop + (SOCIAL.perPage - 1) * SOCIAL.rowStep + SOCIAL.rowH + SPACE + SOCIAL.barH + FRAME.buttonBottom;   // 714

module.exports = { INSET, SPACE, FRAME, NARROW, INNER, SKPANEL, BUTTON, GLYPH, RANKTAB, RANK, PLATE, TAB, BAND, COLOR, DIALOG, TOPBAND, dialogLayout, buttonText, bandText, portraitSprite, textWidth, rankTabW, rankLayout, rankWinLayout };
module.exports.PARTY = PARTY;
module.exports.PICKTAB = PICKTAB;
module.exports.SOCIAL = SOCIAL;
module.exports.ARROW = ARROW;
module.exports.socialChipW = socialChipW;
module.exports.rankAvatarBody = rankAvatarBody;
