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
const SFX = 'docs/evidence/2026-10-31-skillfx-maker/clips/';
const PF3 = 'docs/evidence/2026-10-31-playfeedback-maker3/';

export const SCENE_ACTORS = [
  {id: 'player-stand', role: 'player', pose: 'stand', label: '캐릭터 · 서기', flip: true,
    source: {kind: 'capture', file: PF3 + 'C2-close-2-roadfork-z130.png', crop: [860, 330, 160, 156], zoom: 130, pxPerCell: 195.1, matte: 'flood', tol: 40, tolRef: 110},
    note: '피 묻은 황무지 근접 화면(줌 130 · 195.1px/칸은 같은 회차 E4에서 확인) · 이름표 위에서 자름'},
  {id: 'player-cast', role: 'player', pose: 'cast', label: '캐릭터 · 시전(골편 투척 순간)',
    source: {kind: 'capture', file: SFX + 'P1-right-shard-hex-frost.mp4', t: 1.0, crop: [804, 324, 62, 92], zoom: 100, pxPerCell: 125, matte: 'flood', tol: 40, tolRef: 110},
    note: '오른쪽으로 골편을 던지는 순간(줌 100 · 1600px 화면 125px/칸) · 왼쪽에 쓰러진 구울이 겹쳐 가장자리에 닿은 바닥색만 지움(tolRef)'},
  {id: 'monster-stand', role: 'monster', pose: 'stand', label: '잿불 들개(일반 몬스터) · 서기',
    source: {kind: 'capture', file: SFX + 'P1-right-shard-hex-frost.mp4', t: 0.2, crop: [1192, 336, 100, 82], zoom: 100, pxPerCell: 125, matte: 'flood', tol: 38},
    note: '같은 클립의 고정 표적(이동 끔) · 피격 장이 없어서 화면이 흰빛을 덮어 번쩍임을 흉내 냄(근사)'},
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
    source: {kind: 'capture', file: PF3 + 'C2-close-2-roadfork-z130.png', crop: [1000, 560, 380, 200], zoom: 130, pxPerCell: 195.1},
    note: '캐릭터 이름표 오른쪽 맨땅만(횃불·길 안내 같은 눈에 띄는 장식이 거울 타일로 되풀이되지 않게) · 장면에서는 거울 타일로 이어 붙임'},
  {id: 'rotmarsh', label: '썩은 갈대 늪 (액트 1 사냥터)',
    source: {kind: 'capture', file: PF3 + 'C2-close-3-rotmarsh-fork-z130.png', crop: [1075, 340, 305, 300], zoom: 130, pxPerCell: 195.1}, note: '모닥불 아래·화면 UI 왼쪽 맨땅만 · 거울 타일'},
  {id: 'cellar1', label: '가라앉은 지하실 1층 (던전 · 어두운 돌바닥)',
    source: {kind: 'capture', file: PF3 + 'E2b-bone-spear-target-dies.mp4', t: 12.0, crop: [240, 524, 640, 256], zoom: 130, pxPerCell: 195.1},
    note: '길 안내 띠 아래 돌바닥만 · 좁아서 장면에서는 거울 타일로 이어 붙임'}
];
