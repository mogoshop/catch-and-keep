// 「추천」 점수 규칙의 표 (공개 소스). recommend.mjs가 이 표로 자리마다 메이플 후보의 1순위를 고른다.
//
// 자리 하나 = [역할, 속성]. 역할은 그림이 게임에서 하는 일, 속성은 기대하는 색·계열이다.
// 역할: proj 투사체 · hit 명중 · burst 터짐(한 번) · ground 바닥 장판(머묾) · ring 발밑 고리(한 번) · aura 몸 둘레(머묾)
//       cast 시전 순간 · summon 솟아오름 · slash 베기 궤적 · trail 잔상·자취 · mark 머리 위 표식
// 속성: bone 뼈 · curse 저주 · shadow 그림자 · soul 혼 · fire 불 · frost 서리 · poison 독 · heal 치유 · gold 금빛 · blood 피 · earth 흙먼지 · neutral 무색
export const RECO_SLOTS = {
  'slash': ['slash', 'neutral'], 'shard-throw': ['proj', 'curse'], 'shard-hit': ['hit', 'curse'], 'bone-arrow': ['proj', 'bone'], 'hit-bone': ['hit', 'bone'],
  'flame-shot': ['proj', 'fire'], 'hit-fire': ['hit', 'fire'], 'frost-shot': ['proj', 'frost'], 'hit-frost': ['hit', 'frost'], 'hit-curse': ['hit', 'curse'],
  'hex-burst': ['burst', 'curse'], 'shatter': ['burst', 'frost'], 'mage-bolt': ['proj', 'curse'], 'monster-arrow': ['proj', 'neutral'], 'hit-spark': ['hit', 'neutral'],
  'bone-bolt': ['proj', 'bone'], 'bone-bolt-hit': ['hit', 'bone'],
  'blast': ['burst', 'bone'], 'offering': ['cast', 'heal'], 'offering-sacrifice': ['summon', 'heal'], 'death-wave': ['burst', 'curse'], 'poison-mist': ['ground', 'poison'], 'drain-vortex': ['aura', 'curse'],
  'bone-storm': ['aura', 'bone'], 'rite-whirl': ['aura', 'bone'], 'rite-whirl-trace': ['ground', 'bone'], 'dash-ghost': ['trail', 'soul'], 'sacrifice': ['burst', 'shadow'],
  'bone-spikes': ['burst', 'bone'], 'prison-hold': ['aura', 'bone'], 'prison-release': ['burst', 'bone'], 'armor-cast': ['cast', 'bone'], 'armor-ring-front': ['aura', 'bone'], 'armor-ring-back': ['aura', 'bone'],
  'armor-absorb': ['hit', 'bone'], 'armor-break': ['burst', 'bone'], 'torrent-body': ['proj', 'soul'], 'torrent-cast': ['cast', 'soul'], 'torrent-hit': ['hit', 'soul'],
  'arise-ring': ['ring', 'shadow'], 'arise-flame': ['summon', 'shadow'], 'arise-burst': ['burst', 'shadow'], 'arise-soul': ['proj', 'shadow'], 'shadow-rise': ['summon', 'shadow'],
  'elite-promote': ['summon', 'gold'], 'summon-ritual': ['ground', 'bone'], 'death-smoke': ['burst', 'neutral'], 'elite-burst': ['burst', 'gold'],
  'curse-amp': ['ground', 'blood'], 'curse-weaken': ['ground', 'curse'], 'curse-thorn': ['ground', 'poison'], 'curse-terror': ['ground', 'shadow'], 'curse-lifetap': ['ground', 'blood'],
  'curse-resist': ['ground', 'frost'], 'curse-break': ['burst', 'curse'],
  'mark-amp': ['mark', 'blood'], 'mark-weaken': ['mark', 'curse'], 'mark-thorn': ['mark', 'poison'], 'mark-terror': ['mark', 'shadow'], 'mark-confuse': ['mark', 'gold'],
  'mark-lifetap': ['mark', 'blood'], 'mark-decay': ['mark', 'poison'], 'mark-resist': ['mark', 'frost'], 'mark-root': ['mark', 'earth'], 'mark-chill': ['mark', 'frost'],
  'mark-poison': ['mark', 'poison'], 'mark-hex': ['mark', 'curse'], 'mark-stun': ['mark', 'neutral'], 'mark-frost': ['mark', 'frost'],
  'giant-nova': ['burst', 'fire'], 'meteor-telegraph': ['ground', 'fire'], 'meteor-fall': ['proj', 'fire'], 'meteor-impact': ['burst', 'fire'], 'meteor-afterglow': ['ground', 'fire'],
  'giant-spin-front': ['slash', 'neutral'], 'giant-spin-back': ['ground', 'earth'], 'giant-rift': ['ground', 'earth'], 'giant-slam': ['burst', 'earth'], 'giant-roar': ['burst', 'neutral'],
  'giant-dash': ['trail', 'neutral'], 'giant-flurry': ['slash', 'neutral'], 'giant-quake': ['ground', 'earth'], 'giant-bone': ['proj', 'bone'], 'giant-hexfield': ['ground', 'curse'],
  'levelup-ring': ['ring', 'gold'], 'levelup-pillar': ['summon', 'gold']
};

export const ROLE_KO = {proj: '투사체', hit: '명중', burst: '터짐', ground: '바닥 장판', ring: '발밑 고리', aura: '몸 둘레 유지', cast: '시전', summon: '솟아오름', slash: '베기 궤적', trail: '잔상·자취', mark: '머리 위 표식'};
export const LOOP_ROLES = new Set(['proj', 'ground', 'aura', 'mark']);

// 후보 부분(메이플 리소스 태그 subPath: hit·ball·tile·affected·effect·special…) ↔ 역할 적합도 0~1
export const PART_FIT = {
  proj: {'투사체': 1, '특수 효과': 0.5, '효과': 0.5, '시전': 0.4, '타격': 0.25},
  hit: {'타격': 1, '특수 효과': 0.55, '효과': 0.5, '시전': 0.4},
  burst: {'타격': 0.9, '시전': 0.8, '특수 효과': 0.8, '효과': 0.6, '바닥 장판': 0.4},
  ground: {'바닥 장판': 1, '특수 효과': 0.7, '효과': 0.6, '시전': 0.5, '상태 효과': 0.5},
  ring: {'시전': 0.9, '특수 효과': 0.8, '바닥 장판': 0.75, '효과': 0.6, '타격': 0.5},
  aura: {'상태 효과': 1, '특수 효과': 0.8, '시전': 0.6, '효과': 0.6, '바닥 장판': 0.4},
  cast: {'시전': 1, '상태 효과': 0.8, '특수 효과': 0.8, '모으기': 0.7, '효과': 0.6},
  summon: {'시전': 0.9, '특수 효과': 0.9, '효과': 0.7, '상태 효과': 0.4},
  slash: {'시전': 1, '타격': 0.7, '효과': 0.6, '특수 효과': 0.6},
  trail: {'시전': 0.8, '특수 효과': 0.8, '효과': 0.7, '상태 효과': 0.5},
  mark: {'상태 효과': 1, '효과': 0.5, '특수 효과': 0.5, '시전': 0.3}
};
export const PART_DEFAULT = 0.3; // 화면 효과·몹 스킬 등 표에 없는 부분

// 색 칸: 0~11 = 색상환 30°씩(0 빨강 · 1 주황 · 2 노랑 · 3 연두 · 4 초록 · 5 청록빛 초록 · 6 청록 · 7 하늘 · 8 파랑 · 9 남보라 · 10 보라 · 11 자홍) + white · gray · dark(무채색)
export const HUE_KO = ['빨강', '주황', '노랑', '연두', '초록', '청초록', '청록', '하늘', '파랑', '남보라', '보라', '자홍', '흰빛', '회색', '검정'];
// 속성별 기대 색 칸 · 태그 낱말(메이플 AI 태그 영어) · 어두운(네크로·저주) 계열을 따질지
export const ELEMENTS = {
  bone: {ko: '뼈', bins: [12, 13, 2, 1], words: ['bone', 'skull', 'skeleton', 'white', 'fragment', 'shard', 'spike', 'ivory'], dark: true},
  curse: {ko: '저주', bins: [9, 10, 11, 14, 0], words: ['curse', 'purple', 'violet', 'dark', 'hex', 'magic circle', 'rune', 'sigil', 'evil', 'demon'], dark: true},
  shadow: {ko: '그림자', bins: [14, 9, 10, 8], words: ['shadow', 'dark', 'black', 'abyss', 'purple', 'void', 'smoke', 'ghost'], dark: true},
  soul: {ko: '혼', bins: [6, 5, 7], words: ['soul', 'spirit', 'ghost', 'cyan', 'teal', 'wisp', 'orb', 'turquoise'], dark: true},
  fire: {ko: '불', bins: [0, 1, 2], words: ['fire', 'flame', 'burn', 'lava', 'ember', 'orange', 'blaze', 'meteor'], dark: false},
  frost: {ko: '서리', bins: [6, 7, 8, 12], words: ['ice', 'frost', 'freez', 'snow', 'cold', 'crystal', 'blue'], dark: false},
  poison: {ko: '독', bins: [3, 4, 5], words: ['poison', 'venom', 'toxic', 'green', 'gas', 'thorn', 'vine', 'rot', 'acid'], dark: true},
  heal: {ko: '치유', bins: [4, 3, 5, 2], words: ['heal', 'recovery', 'green', 'life', 'restore', 'leaf'], dark: false},
  gold: {ko: '금빛', bins: [2, 1, 12], words: ['gold', 'golden', 'yellow', 'light', 'shine', 'glow', 'star', 'holy'], dark: false},
  blood: {ko: '피', bins: [0, 11, 14], words: ['blood', 'red', 'crimson', 'drain', 'vampir', 'brand', 'scarlet'], dark: true},
  earth: {ko: '흙먼지', bins: [1, 2, 13, 14], words: ['dust', 'earth', 'rock', 'stone', 'ground', 'crack', 'sand', 'quake'], dark: false},
  neutral: {ko: '무색', bins: null, words: [], dark: false}
};
// 역할 낱말(메이플 AI 태그 영어)
export const ROLE_WORDS = {
  proj: ['projectile', 'bullet', 'orb', 'arrow', 'flying', 'missile', 'sphere', 'thrown', 'shot'],
  hit: ['hit', 'impact', 'strike', 'struck', 'spark'],
  burst: ['explosion', 'burst', 'shockwave', 'blast', 'explode', 'scatter'],
  ground: ['ground', 'floor', 'field', 'area', 'zone', 'magic circle', 'carpet', 'puddle'],
  ring: ['ring', 'circle', 'wave', 'ripple'],
  aura: ['aura', 'barrier', 'shield', 'surround', 'swirl', 'vortex', 'orbit', 'cage'],
  cast: ['cast', 'buff', 'charge', 'glow', 'aura', 'power'],
  summon: ['pillar', 'rising', 'summon', 'column', 'beam', 'erupt'],
  slash: ['slash', 'blade', 'sword', 'arc', 'cut', 'swing'],
  trail: ['afterimage', 'trail', 'dash', 'speed', 'streak'],
  mark: ['icon', 'status', 'debuff', 'above', 'head', 'mark', 'symbol', 'emblem']
};
// 어두운 계열 낱말 — 네크로·저주 게임 톤
export const DARK_WORDS = ['dark', 'shadow', 'skull', 'bone', 'ghost', 'spirit', 'soul', 'curse', 'death', 'undead', 'necro', 'demon', 'abyss', 'evil', 'blood', 'reaper', 'grim', 'venom', 'void', 'purple'];
// 메이플 원작 직업(태그 path skill/<직업 번호>.img). dark = 어둠·저주·피·그림자 계열 직업.
export const JOBS = {
  132: ['다크나이트', true], 1400: ['나이트워커', true], 1410: ['나이트워커', true], 1411: ['나이트워커', true], 1412: ['나이트워커', true],
  3100: ['데몬 슬레이어', true], 3110: ['데몬 슬레이어', true], 3111: ['데몬 슬레이어', true], 3112: ['데몬 슬레이어', true],
  3101: ['데몬 어벤져', true], 3120: ['데몬 어벤져', true], 3121: ['데몬 어벤져', true], 3122: ['데몬 어벤져', true],
  3200: ['배틀메이지', true], 3210: ['배틀메이지', true], 3211: ['배틀메이지', true], 3212: ['배틀메이지', true],
  15500: ['아크', true], 15510: ['아크', true], 15511: ['아크', true], 15512: ['아크', true],
  2700: ['루미너스', true], 2710: ['루미너스', true], 2711: ['루미너스', true], 2712: ['루미너스', true],
  210: ['불독 마법사', false], 211: ['불독 마법사', false], 212: ['불독 마법사', false],
  220: ['썬콜 마법사', false], 221: ['썬콜 마법사', false], 222: ['썬콜 마법사', false],
  230: ['비숍', false], 231: ['비숍', false], 232: ['비숍', false]
};

// 점수 가중치(합 1). theme은 속성이 어두운 계열(dark: true)일 때만 쓰고, 아니면 그 몫을 tone에 준다.
export const WEIGHTS = {part: 0.20, color: 0.22, shape: 0.14, size: 0.12, frames: 0.10, keyword: 0.08, theme: 0.08, tone: 0.06};
// 확신: high = 70점 이상이고 2순위와 5점 이상 차이 · low = 58점 미만 · 2순위와 2.5점 미만 차이 · 색 0.35 미만 · 역할 0.5 미만 · 크기 0.25 미만(배율을 크게 바꿔야 함) 중 하나
export const CONFIDENCE = {high: 70, highMargin: 5, low: 58, lowMargin: 2.5, lowColor: 0.35, lowPart: 0.5, lowSize: 0.25};
// 덧점: 지금 게임에 연결된 메이플 클립 +2 · 코드에 선언된 메이플 클립 +1 · 다른 자리 1순위와 같은 클립 -10 · 같은 원작 스킬 이름 -5 · 프레임 없는 썸네일 -15
export const BONUS = {currentMaple: 2, codeMaple: 1, dupe: -10, dupeName: -5, thumbOnly: -15};
