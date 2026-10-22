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
};

// 테두리 없는 안쪽 판(win_content) 안 여백
const INNER = { pad: 24 };

// 버튼 (모든 창 공통 · 터치 88 이상)
const BUTTON = { h: 88, w: 240, wide: 360, font: 22, fontMain: 26,
  padX: 30,        // 버튼 그림(btn_frame) 양 끝 장식 안쪽부터 글자 (장식에 글자가 닿지 않게)
  minFont: 14 };   // 글이 길면 이 크기까지 줄인다 (「다음 ▶ [Space]」 같은 PC 단축키 안내)
// 테두리 버튼 글자 칸 (모든 빌더 공통): 장식 안쪽 여백 + 넘치면 줄이기
function buttonText(fontSize) {
  return { Padding: { left: BUTTON.padX, right: BUTTON.padX, top: 0, bottom: 0 }, BestFit: true, MinSize: BUTTON.minFont, MaxSize: fontSize };
}

const COLOR = {
  title: '#F6E3B0',   // 창 제목 · 대화 상자 이름 (모든 화자 공통)
  body: '#E6DCC6',    // 대화 글
  dim: '#9C9488',     // 쪽 표시 · 안내
  panel: { r: 0.05, g: 0.045, b: 0.06, a: 0.94 },
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

// 대화 상자 안 배치 (x는 바탕 왼쪽에서, y는 바탕 위에서 아래로)
function dialogLayout(height, withPortrait) {
  const paperH = height - FRAME.contentTop - FRAME.padBottom;
  const portraitX = FRAME.padX;
  const paperX = withPortrait ? FRAME.padX + DIALOG.portrait.w + FRAME.gap : FRAME.padX;
  const paperW = DIALOG.width - paperX - FRAME.padX;
  return { portraitX, paperX, paperW, paperH };
}

module.exports = { INSET, SPACE, FRAME, INNER, BUTTON, COLOR, DIALOG, dialogLayout, buttonText };
