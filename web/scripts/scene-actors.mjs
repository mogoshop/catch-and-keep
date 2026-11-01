// 「장면 보기」 배우(캐릭터·몬스터·거인·소환수)와 맵 바탕 조각의 출처 목록.
// npm run scene 이 이 목록대로 잘라 content/scene/media/ 에 PNG로 저장하고 scene.json·scene-manifest.json에 적는다.
//
// source.kind
//   capture — 게임 체크아웃의 증거 영상(mp4, t초) 또는 스크린숏(png)을 crop [x, y, w, h](원본 px)으로 자름.
//             matte 'flood' = 자른 상자 가장자리에서 바닥색을 채워 지움(근사 · 바닥 무늬·겹친 몸이 조금 남을 수 있음).
//             pxPerCell = 그 화면의 1칸 px (줌 100 = 1600px 화면 125 · 1920px 화면 150 / 줌 130 = 1920px 화면 195.1).
//   atlas   — 이미 가져온 에셋 도감(content/assets/catalog.json)의 몸 프레임. pxPerCell = 100 / 몸 배율.
//   png     — 정식 배우 PNG(투명 배경). file은 web/ 기준 경로(예: content/scene/incoming/player-stand.png · Git 제외 폴더).
//             feet [x, y](발 기준점 px)를 주지 않으면 불투명 화소의 맨 아래 가운데로 잡는다.
// flip: true = 좌우 반전해서 저장. 장면 규약: 캐릭터·거인·소환수는 오른쪽(표적 쪽)을, 몬스터는 왼쪽(캐릭터 쪽)을 본다.
//
// 다음 메이커 회차에서 정식 PNG를 찍으면 해당 항목의 source를 {kind: 'png', file, pxPerCell, feet}로 바꾸고 npm run scene을 다시 돌린다.
// id·role·pose는 화면이 찾는 이름이라 바꾸지 않는다(player-stand · player-cast · monster-stand · monster-hit(있으면 흰빛 흉내 대신 씀) · giant-stand(마법사) · giant-shield-stand 등 거인 종류별 · summon-stand).

// 11-01 메이커 정지 캡처(줌 100 · UI 숨김 · 2197×1236 = 게임 1920×1080 → 12.8칸 = 171.6px/칸). 게임 체크아웃
// docs/evidence/2026-11-01-fx-picker-scene/actors/(NOTES.md)의 PNG를 content/scene/incoming/에 복사해 쓴다(Git 제외).
// 배경은 맵 바닥 그대로라 flood로 근사해서 지운다. feet = 자른 그림 기준 발 px(NOTES.md 표의 값을 crop만큼 옮김).
const IN = 'content/scene/incoming/';
const PX11 = 171.6;

export const SCENE_ACTORS = [
  {id: 'player-stand', role: 'player', pose: 'stand', label: '캐릭터(새내기 Lv40 · 단낫) · 서기',
    source: {kind: 'png', file: IN + 'char-stand.png', crop: [40, 40, 150, 170], feet: [70, 138], pxPerCell: PX11, matte: 'flood', tol: 46, tolRef: 120},
    note: '11-01 메이커 캡처 char-stand.png(피 묻은 황무지 · 오른쪽을 봄) · 발 (110,178) · 바닥 지우기 근사'},
  {id: 'player-cast', role: 'player', pose: 'cast', label: '캐릭터 · 시전(골편 투척 자세)',
    source: {kind: 'png', file: IN + 'char-cast.png', crop: [40, 40, 150, 170], feet: [70, 138], pxPerCell: PX11, matte: 'flood', tol: 46, tolRef: 120},
    note: '11-01 메이커 캡처 char-cast.png(팔 든 장) · 발 (110,178)'},
  {id: 'monster-stand', role: 'monster', pose: 'stand', label: '굶주린 구울(액트 1 일반 몬스터) · 서기',
    source: {kind: 'png', file: IN + 'monster-stand-ghoul.png', crop: [10, 50, 158, 170], feet: [110, 120], pxPerCell: PX11, matte: 'flood', tol: 40, tolRef: 150},
    note: '11-01 메이커 캡처 monster-stand-ghoul.png(왼쪽을 봄) · 오른쪽 옆 몬스터·피해 숫자는 잘라 냄 · 피격 장은 해골 마법사 타격 효과가 덮여 있어 쓰지 않고 흰빛 흉내'},
  {id: 'summon-mage-stand', role: 'summon-mage', pose: 'stand', label: '해골 마법사(뼈 속성 · 소환수) · 서기',
    source: {kind: 'png', file: IN + 'skelmage-stand-3schools.png', crop: [20, 15, 120, 135], feet: [70, 125], pxPerCell: PX11, matte: 'flood', tol: 56, tolRef: 150}, flip: true,
    note: '11-01 메이커 캡처 skelmage-stand-3schools.png 맨 위(뼈 속성) · 마력탄·뼈 투척 자리의 시전자'},
  {id: 'giant-stand', role: 'giant', pose: 'stand', label: '마법사 거인 · 서기', flip: true,
    source: {kind: 'atlas', group: 'runtime--body--giant_mage--stand', frame: 0, pxPerCell: 100 / 0.66},
    note: '거인 몸 배율 0.66 = 해골 0.55 × GiantArtScale 1.2 (ShadowUnit.mlua:1002 · 10-31 로그 scale=0.66)'},
  {id: 'giant-hit', role: 'giant', pose: 'hit', label: '마법사 거인 · 피격', flip: true,
    source: {kind: 'atlas', group: 'runtime--body--giant_mage--hit', frame: 0, pxPerCell: 100 / 0.66}},
  ...['shield', 'greatsword', 'twin', 'basic'].map(kind => ({id: `giant-${kind}-stand`, role: `giant-${kind}`, pose: 'stand', label: `${{shield: '방패', greatsword: '대검', twin: '쌍칼', basic: '기본'}[kind]} 거인 · 서기`, flip: true,
    source: {kind: 'atlas', group: `runtime--body--giant_${kind}--stand`, frame: 0, pxPerCell: 100 / 0.66}, note: '거인 기술 자리마다 그 기술을 쓰는 거인으로(규칙의 giant 칸)'})),
  {id: 'summon-stand', role: 'summon', pose: 'stand', label: '해골 전사(소환수) · 서기', flip: true,
    source: {kind: 'atlas', group: 'runtime--body--skel_warrior--stand', frame: 0, pxPerCell: 100 / 0.55},
    note: '소환 해골 배율 0.55 (UndeadSystem.mlua:861) · 원거리 그림자·해골 마법사 자리도 이 그림으로 대신'}
];

export const SCENE_MAPS = [
  {id: 'wasteland', label: '피 묻은 황무지 (액트 1 사냥터)',
    source: {kind: 'png', file: IN + 'bg-wasteland.png', crop: [1000, 110, 780, 620], pxPerCell: PX11},
    note: '11-01 캡처 bg-wasteland.png 가운데 맨땅(가장자리 몬스터 2·횃불은 잘라 냄) · 장면에서는 거울 타일로 이어 붙임'},
  {id: 'rotmarsh', label: '썩은 갈대 늪 (액트 1 사냥터)',
    source: {kind: 'png', file: IN + 'bg-rotmarsh.png', crop: [1080, 130, 800, 600], pxPerCell: PX11}, note: '11-01 캡처 bg-rotmarsh.png 오른쪽 맨땅 · 거울 타일'},
  {id: 'cellar1', label: '가라앉은 지하실 1층 (던전 · 어두운 돌바닥)',
    source: {kind: 'png', file: IN + 'bg-cellar1.png', crop: [60, 330, 1400, 600], pxPerCell: PX11},
    note: '11-01 캡처 bg-cellar1.png 위아래 벽 사이 돌바닥 · 거울 타일'}
];
