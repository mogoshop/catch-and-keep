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
  minFont: 14 };   // 글이 길면 이 크기까지 줄인다 (「다음 ▶ [Space]」 같은 PC 단축키 안내)
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

module.exports = { INSET, SPACE, FRAME, NARROW, INNER, SKPANEL, BUTTON, TAB, BAND, COLOR, DIALOG, TOPBAND, dialogLayout, buttonText, bandText, portraitSprite };
