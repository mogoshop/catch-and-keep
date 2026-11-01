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
//   한 줄에 perRow개 — 넷을 한 줄에 두면 4×202 + 3×16 = 856 > 창 안쪽 538(바탕 640 − padX×2)이라 둘씩. 보이는 탭만 가운데 정렬:
//   심연을 숨긴 동안(성장·보스 둘) = 빌더 배치 그대로 한 줄 · 심연이 켜져 넷 = 둘째 줄 + 액트 넘김 막대·기록 칸을 gapY씩 아래로 쌓고 창을 늘린다.
//   실행 중 배치 RankWindow.LayoutTabs가 같은 값을 쓴다 (check_ui_tokens가 RankWindow 속성 · 빌드된 탭 · 2/4탭 배치 겹침을 잰다)
const RANKTAB = { font: 16, h: 56, top: FRAME.contentTop + SPACE, gapX: FRAME.gap, gapY: SPACE, perRow: 2, side: BUTTON.artEdge + SPACE / 2,
  winW: 640, winH: 660, actBarH: 76, paperH: 414 };
RANKTAB.actBarTop = RANKTAB.top + RANKTAB.h + SPACE * 2;   // 166 — 탭 한 줄일 때 액트 넘김 막대 위 끝 (예전 자리 그대로)
RANKTAB.paperTop = RANKTAB.top + RANKTAB.h + RANKTAB.actBarH;   // 218 — 탭 한 줄일 때 기록 칸 위 끝 (예전 자리 그대로)
function rankTabW(labels) {
  return Math.ceil(Math.max(...labels.map((t) => textWidth(t, RANKTAB.font))) + RANKTAB.side * 2);
}
// 보이는 탭 n개의 배치 (창 바탕 위 가운데 기준, y는 위에서 아래로 −). RankWindow.LayoutTabs와 같은 계산
function rankLayout(n, tabW) {
  const R = RANKTAB;
  const rows = Math.max(1, Math.ceil(n / R.perRow));
  const tabs = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / R.perRow), inRow = Math.min(R.perRow, n - row * R.perRow), col = i % R.perRow;
    tabs.push({ x: (col - (inRow - 1) / 2) * (tabW + R.gapX), y: -(R.top + row * (R.h + R.gapY)) });
  }
  let actTop = -R.actBarTop, paperTop = -R.paperTop;
  if (rows > 1) {
    const bottom = -(R.top + rows * R.h + (rows - 1) * R.gapY);
    actTop = bottom - R.gapY;
    paperTop = actTop - R.actBarH - R.gapY;
  }
  const winH = R.winH + (-R.paperTop - paperTop);
  return { rows, tabs, actTop, paperTop, winH, rim: [R.winW + FRAME.rimOut * 2, winH + FRAME.rimOut * 2] };
}
// 장식 없는 어두운 칸 테 (ui_loot_label 96×32 · 9조각 테두리 12 — 코덱스 feel-fx-v2 「밝은 회색 얇은 테 · 색을 입히는 용도 · 안쪽 반투명 검정 · 돌출 장식 없음」).
//   11-01 사용자 결정 3-A: 스킬 창 머리 줄 「선택 보상」 칸이 공방 노드 테(sk_ws_node_frame_*, 둥근 테 + 가시 장식)를 칸 폭으로 늘려 써서 이름이 장식 위로 지나갔다 → 이 판으로.
//   테 선은 가장자리에서 5px 안쪽까지(모서리 빗면 포함 · 그림 실측) → 아이콘·꼬리표·글은 pad(SPACE/2) 안쪽. 칸 상태는 그림 대신 테 색(SkillWindow.RenderChoices)
const PLATE = { key: 'ui_loot_label', border: 12, rim: 5, pad: SPACE / 2 };
// 책갈피 칸 (guide_tab 320×88): 왼쪽 해골 장식 40 · 오른쪽 화살촉 50을 뺀 안쪽에 아이콘 + 이름을 가운데로 (10-27 사용자: 「목차 내부 패딩 엉망 · 수평 중앙」)
const TAB = { artLeft: 40, artRight: 50, icon: 44, gap: 8, font: 24, minFont: 16 };
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
const SOCIAL = { winW: 1040, posY: 40, summaryH: 32, rowH: 54, rowGap: 6, perPage: 8, markW: 6, tagX: 12, tagW: 132, nameX: 152, nameW: 330,
  btn: [{ name: 'Party', label: '파티', x: 490, w: 104 }, { name: 'Duel', label: '결투', x: 598, w: 104 }, { name: 'Trade', label: '거래', x: 706, w: 104 }, { name: 'Inspect', label: '살펴보기', x: 810, w: 128 }],
  barH: 62, leaveW: 200, pagerBtnW: 88, pagerW: 300, font: 17 };
SOCIAL.rowStep = SOCIAL.rowH + SOCIAL.rowGap;                                       // 60
SOCIAL.rowW = SOCIAL.winW - FRAME.padX * 2;                                          // 938
SOCIAL.rowTop = FRAME.contentTop + SOCIAL.summaryH + SPACE;                          // 118 — 첫 줄 위 끝 (바탕 위에서)
SOCIAL.winH = SOCIAL.rowTop + (SOCIAL.perPage - 1) * SOCIAL.rowStep + SOCIAL.rowH + SPACE + SOCIAL.barH + FRAME.buttonBottom;   // 714

module.exports = { INSET, SPACE, FRAME, NARROW, INNER, SKPANEL, BUTTON, GLYPH, RANKTAB, PLATE, TAB, BAND, COLOR, DIALOG, TOPBAND, dialogLayout, buttonText, bandText, portraitSprite, textWidth, rankTabW, rankLayout };
module.exports.PARTY = PARTY;
module.exports.SOCIAL = SOCIAL;
