// Skill-effect "slots" for the comparison view in /assets/.
// A slot is one place in the game that shows an effect (e.g. 독안개 구름).
// Every tab (현재 사용 중 / FX / 메이플 에셋) lists slots in this order with these names.
//
// runtime: where the game reads the picture now (`File.Property` or `File.Property:kind`),
//          or `catalog:<group id>` for effects wired outside the constant files.
// maple:   MSW/MapleStory resource clips declared in code for this slot (original clip,
//          fallback that the Codex art now hides, or the clip used before Codex art).
// match:   regular expression tested against Codex FX names/paths to collect candidates.
//          A candidate joins the first slot (in this order) whose expression matches.
export const SLOT_GROUPS = [
  {id: 'attack', title: '평타·투사체'},
  {id: 'undead', title: '해골·망자 스킬'},
  {id: 'bone', title: '본 프리즌·본 아머·본 스피리트'},
  {id: 'shadow', title: '그림자 추출·소환'},
  {id: 'curse', title: '저주 원형판'},
  {id: 'mark', title: '머리 위 표식'},
  {id: 'giant', title: '거인 기술'},
  {id: 'misc', title: '레벨업·기타'}
];

const curse = (kind, title) => ({id: `curse-${kind}`, title, group: 'curse', runtime: `GameConst.FxSkillCurseCircles:${kind}`,
  match: `CurseCircles(?::|--)${kind}\\b|curse-circle-${kind}\\b|CurseSigils(?::|--)${kind}\\b|curse-sigil-${kind}\\b`});
const mark = (kind, title, runtime = `GameConst.FxSkillMarks:${kind}`) => ({id: `mark-${kind}`, title, group: 'mark', runtime,
  match: `FxSkillMarks(?::|--)${kind}\\b|mark_${kind}\\b|mark-${kind}\\b`});

// 자리 이름은 11-02 메인 스킬 이름 교체(게임 36a8a136)를 따른다. id는 저장된 고르기와 맞물리므로 바꾸지 않는다.
export const SLOTS = [
  {id: 'slash', title: '평타 베기', group: 'attack', runtime: 'GameConst.FxSkillSlash', maple: ['GameConst.FxSlash'], match: 'FxSkillSlash|FxSlash'},
  {id: 'shard-throw', title: '티스 · 비행', group: 'attack', runtime: 'GameConst.FxSkillShardThrow', maple: ['SkillEffects.FxShardShot', 'SkillEffects.FxShardLaunch'], match: 'ShardThrow|shard-throw|fx-bone-shard-[123]'},
  {id: 'shard-hit', title: '티스 · 명중', group: 'attack', runtime: 'GameConst.FxSkillShardHit', maple: ['SkillEffects.FxShardHit'], match: 'ShardHit|shard-hit'},
  {id: 'bone-arrow', title: '뼈 화살 (원거리 그림자)', group: 'attack', runtime: 'GameConst.FxSkillBoneArrow', match: 'BoneArrow|bone-arrow(?!-hit)|RiteArrow|rite-arrow'},
  {id: 'hit-bone', title: '투사체 명중 · 뼈', group: 'attack', runtime: 'GameConst.FxSkillHitBone', match: 'HitBone|hit-bone|bone-arrow-hit'},
  {id: 'flame-shot', title: '불꽃 발사체', group: 'attack', runtime: 'GameConst.FxSkillFlameShot', maple: ['SkillEffects.FxFlameShot'], match: 'FlameShot|flame-shot'},
  {id: 'hit-fire', title: '투사체 명중 · 불', group: 'attack', runtime: 'GameConst.FxSkillHitFire', match: 'HitFire|hit-fire'},
  {id: 'frost-shot', title: '서리 발사체 (프로즌 오브)', group: 'attack', runtime: 'GameConst.FxSkillFrostShot', maple: ['SkillEffects.FxFrostShot'], match: 'FrostShot|frost-shot'},
  {id: 'hit-frost', title: '투사체 명중 · 서리', group: 'attack', runtime: 'GameConst.FxSkillHitFrost', match: 'HitFrost|hit-frost'},
  {id: 'hit-curse', title: '투사체 명중 · 저주', group: 'attack', runtime: 'GameConst.FxSkillHitCurse', match: 'HitCurse|hit-curse'},
  {id: 'hex-burst', title: '헥스블라스트 폭발', group: 'attack', runtime: 'GameConst.FxSkillHexBurst', maple: ['SkillEffects.FxFlameShot'], match: 'HexBurst|hex-burst'},
  {id: 'shatter', title: '서리 파쇄', group: 'attack', runtime: 'GameConst.FxSkillShatter', maple: ['SkillEffects.FxFrostShot'], match: 'Shatter|shatter'},
  {id: 'mage-bolt', title: '해골 마법사 마력탄', group: 'attack', runtime: 'GameConst.SpriteMageBolt', match: 'mage-bolt|SpriteMageBolt'},
  {id: 'monster-arrow', title: '몬스터 화살', group: 'attack', runtime: 'GameConst.SpriteArrow', match: 'SpriteArrow'},
  {id: 'hit-spark', title: '맞은 자리 불꽃', group: 'attack', maple: ['GameConst.FxHit'], match: 'FxHit(?![A-Za-z])'},

  // 해골 마법사(뼈 속성) 뼈 투척 — 11-01 캐릭터 뼈 창 스킬 삭제 뒤 남은 같은 그림(옛 FxSkillSpear*) · 옛 이름 패턴도 여기로 모은다
  {id: 'bone-bolt', title: '해골 마법사 · 뼈 투척', group: 'undead', runtime: 'GameConst.FxBoneBolt', maple: ['MageBolts.FxShardShot'],
    match: 'FxBoneBolt(?![A-Za-z])|BoneBoltShard|FxSkillSpear(?![A-Za-z])|bone-spear(?!-stick)|SpearShard|spear-shard'},
  {id: 'bone-bolt-hit', title: '해골 마법사 · 뼈 투척 꽂힘', group: 'undead', runtime: 'GameConst.FxBoneBoltHit', match: 'FxBoneBoltHit|SpearHit|spear-stick'},
  {id: 'blast', title: '본 노바 폭탄·본 오퍼링 제물 폭발', group: 'undead', runtime: 'GameConst.FxSkillBlast', maple: ['SkillEffects.FxBlast'], match: 'FxSkillBlast(?![A-Z])|bone-blast|FxBlast'},
  {id: 'offering', title: '본 오퍼링 치유', group: 'undead', runtime: 'GameConst.FxSkillOfferingHeal', maple: ['SkillEffects.FxOffering'], match: 'Offering'},
  {id: 'death-wave', title: '데스 노바', group: 'undead', runtime: 'GameConst.FxSkillDeathWave', maple: ['SkillEffects.FxWave'], match: 'DeathWave|death-wave'},
  {id: 'poison-mist', title: '포이즌 미스트', group: 'undead', runtime: 'GameConst.FxSkillPoisonCloud', maple: ['SkillEffects.FxPoisonCloud'], match: 'PoisonCloud|poison-cloud'},
  {id: 'drain-vortex', title: '드레인 라이프 소용돌이 (11-04 스킬 삭제 · 미사용)', group: 'undead', runtime: 'GameConst.FxSkillDrainVortex', maple: ['SkillEffects.FxDrain'], match: 'DrainVortex|drain-vortex|soul-drain'},
  {id: 'bone-storm', title: '본 스톰', group: 'undead', runtime: 'GameConst.FxSkillBoneStorm', maple: ['SkillEffects.FxStorm'], match: 'BoneStorm|bone-storm|StormShard|storm-shard'},
  {id: 'rite-whirl', title: '본 노바 해골 회오리 돌진 (3기 · 표적 추적)', group: 'undead', runtime: 'GameConst.FxSkillRiteWhirl', maple: ['SkillEffects.FxStorm'], match: 'RiteWhirl(?!Trace)|rite-bone-whirl(?!-trace)|bone-vortex(?!-floor)|storm-reuse'},
  {id: 'rite-whirl-trace', title: '본 노바 회오리 바닥 자국 (11-03 돌진형이라 안 씀)', group: 'undead', runtime: 'GameConst.FxSkillRiteWhirlTrace', match: 'RiteWhirlTrace|whirl-trace|bone-vortex-floor'},
  {id: 'dash-ghost', title: '질주 잔상', group: 'undead', runtime: 'GameConst.FxSkillDashGhost', maple: ['SkillEffects.FxBlink'], match: 'DashGhost|dash-ghost'},
  {id: 'sacrifice', title: '세크리파이스', group: 'undead', runtime: 'GameConst.FxSkillSacrifice', match: 'Sacrifice|shadow-sacrifice'},

  {id: 'prison-hold', title: '본 프리즌 유지', group: 'bone', runtime: 'GameConst.FxSkillPrisonHold', match: 'PrisonHold|prison-hold|fx-bone-prison(?!-release)'},
  {id: 'prison-release', title: '본 프리즌 해제', group: 'bone', runtime: 'GameConst.FxSkillPrisonRelease', match: 'PrisonRelease|prison-release'},
  {id: 'bone-spikes', title: '뼈 쐐기 가시 (땅에서 솟음 · 11-04)', group: 'bone', runtime: 'GameConst.FxSkillBoneSpikes', match: 'BoneSpikes|bone-spikes'},
  {id: 'armor-cast', title: '본 아머 시전', group: 'bone', runtime: 'GameConst.FxSkillArmorCast', match: 'ArmorCast|armor-cast'},
  {id: 'armor-ring-front', title: '본 아머 고리 · 앞층', group: 'bone', runtime: 'GameConst.FxSkillArmorRingFront', match: 'ArmorRingFront|ArmorRing(?![A-Z])|bone-armor-ring|armor-plate'},
  {id: 'armor-ring-back', title: '본 아머 고리 · 뒤층', group: 'bone', runtime: 'GameConst.FxSkillArmorRingBack', match: 'ArmorRingBack'},
  {id: 'armor-absorb', title: '본 아머 흡수', group: 'bone', runtime: 'GameConst.FxSkillArmorAbsorb', match: 'ArmorAbsorb|armor-absorb'},
  {id: 'armor-break', title: '본 아머 파괴', group: 'bone', runtime: 'GameConst.FxSkillArmorBreak', match: 'ArmorBreak|armor-break'},
  {id: 'torrent-body', title: '본 스피리트 비행 몸', group: 'bone', runtime: 'GameConst.FxSkillTorrent', maple: ['GameConst.FxAriseSoul'], match: 'FxSkillTorrent(?![A-Z])|fx-soul-torrent(?!-)'},
  {id: 'torrent-cast', title: '본 스피리트 시전', group: 'bone', runtime: 'GameConst.FxSkillTorrentCast', match: 'TorrentCast|torrent-cast'},
  {id: 'torrent-hit', title: '본 스피리트 명중', group: 'bone', runtime: 'GameConst.FxSkillTorrentHit', match: 'TorrentHit|torrent-hit'},

  {id: 'arise-ring', title: '그림자 추출 · 바닥 고리', group: 'shadow', runtime: 'GameConst.FxAriseRing', match: 'AriseRing|arise-ring'},
  {id: 'arise-flame', title: '그림자 추출 · 솟는 불꽃', group: 'shadow', runtime: 'GameConst.FxAriseFlame', match: 'AriseFlame|arise-flame'},
  {id: 'arise-burst', title: '그림자 추출 · 도착 파열', group: 'shadow', runtime: 'GameConst.FxAriseBurst', match: 'AriseBurst|arise-burst'},
  {id: 'arise-soul', title: '그림자 추출 · 혼 구슬', group: 'shadow', runtime: 'GameConst.FxAriseSoul', match: 'AriseSoul|arise-soul'},
  {id: 'shadow-rise', title: '리바이브 · 그림자 소환', group: 'shadow', runtime: 'GameConst.FxSkillShadowRise', match: 'ShadowRise|shadow-rise'},
  {id: 'elite-promote', title: '드레드 셰이드 · 정예 승격', group: 'shadow', runtime: 'GameConst.FxSkillElitePromote', match: 'ElitePromote|elite-promote'},
  {id: 'summon-ritual', title: '소환 성공 바닥 문양', group: 'shadow', runtime: 'catalog:codex-fx-v1--summon-ritual', match: 'summon-ritual'},
  {id: 'death-smoke', title: '쓰러질 때 연기', group: 'shadow', maple: ['GameConst.FxDeath'], match: 'death-smoke|FxDeath(?![A-Za-z])'},
  {id: 'elite-burst', title: '정예 처치 파열', group: 'shadow', match: 'elite-burst'},

  curse('amp', '앰플리파이'), curse('weaken', '위큰'), curse('thorn', '아이언 메이든'), curse('terror', '하울'), curse('lifetap', '라이프 탭'), curse('resist', '로워 레지스트'),
  {id: 'curse-break', title: '저주 깨짐', group: 'curse', runtime: 'GameConst.FxSkillCurseBreak', match: 'CurseBreak|curse-break'},

  mark('amp', '앰플리파이 표식'), mark('weaken', '위큰 표식'), mark('thorn', '아이언 메이든 표식'), mark('terror', '하울 표식'), mark('confuse', '혼란 표식'),
  mark('lifetap', '라이프 탭 표식'), mark('decay', '부패 표식'), mark('resist', '로워 레지스트 표식'), mark('root', '속박 표식'), mark('chill', '냉기 표식'),
  mark('poison', '중독 표식'), mark('hex', '주술 표식'), mark('stun', '기절 표식 (뼈 쐐기)'), mark('frost', '서리 표식', 'catalog:codex-skill-fx-v1--mark_frost'),

  {id: 'giant-nova', title: '마법사 거인 노바', group: 'giant', runtime: 'SkillEffects.FxGiantNovaV2', match: 'GiantNova'},
  {id: 'meteor-telegraph', title: '메테오 예고', group: 'giant', runtime: 'GameConst.FxGiantMeteorTelegraph', match: 'MeteorTelegraph|meteor\\S*tele'},
  {id: 'meteor-fall', title: '메테오 낙하', group: 'giant', runtime: 'GameConst.FxGiantMeteorFall', match: 'MeteorFall|meteor\\S*fall|FxGiantMeteor(?![A-Z])|GiantFireMeteor'},
  {id: 'meteor-impact', title: '메테오 착지', group: 'giant', runtime: 'GameConst.FxGiantMeteorImpact', match: 'MeteorImpact|meteor\\S*impa'},
  {id: 'meteor-afterglow', title: '메테오 잔불', group: 'giant', runtime: 'GameConst.FxGiantMeteorAfterglow', match: 'MeteorAfterglow|meteor\\S*afte'},
  {id: 'giant-spin-front', title: '대검 회전 베기 · 칼날', group: 'giant', runtime: 'SkillEffects.FxGiantSpinFront', match: 'GiantSpinFront|FxGiantSpin(?![A-Z])'},
  {id: 'giant-spin-back', title: '대검 회전 베기 · 먼지', group: 'giant', runtime: 'SkillEffects.FxGiantSpinBack', match: 'GiantSpinBack'},
  {id: 'giant-rift', title: '대검 땅 가르기', group: 'giant', runtime: 'SkillEffects.FxGiantRiftSeq', match: 'GiantRift'},
  {id: 'giant-slam', title: '방패 내려찍기', group: 'giant', runtime: 'SkillEffects.FxGiantSlamSeq', match: 'GiantSlam'},
  {id: 'giant-roar', title: '방패 함성', group: 'giant', runtime: 'SkillEffects.FxGiantRoarSeq', match: 'GiantRoar'},
  {id: 'giant-dash', title: '쌍칼 돌진', group: 'giant', runtime: 'SkillEffects.FxGiantDashSeq', match: 'GiantDash'},
  {id: 'giant-flurry', title: '쌍칼 연속 베기', group: 'giant', runtime: 'SkillEffects.FxGiantFlurry', match: 'GiantFlurry'},
  {id: 'giant-quake', title: '기본 거인 땅울림', group: 'giant', runtime: 'GameConst.FxGiantQuake', match: 'GiantQuake'},
  {id: 'giant-bone', title: '기본 거인 던진 뼈', group: 'giant', runtime: 'GameConst.FxGiantBone', match: 'FxGiantBone'},
  {id: 'giant-hexfield', title: '마법사 거인 저주 장판', group: 'giant', runtime: 'GameConst.FxGiantHexfield', match: 'GiantHexfield'},

  {id: 'levelup-ring', title: '레벨업 고리', group: 'misc', runtime: 'catalog:codex-feel-fx-v2--fx-levelup-ring', match: 'levelup-ring'},
  {id: 'levelup-pillar', title: '레벨업 빛기둥', group: 'misc', runtime: 'catalog:codex-feel-fx-v2--fx-levelup-pillar', match: 'levelup-pillar'}
];
