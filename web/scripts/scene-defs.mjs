// 「장면 보기」 자리별 배치 규칙 (효과 고르기 · 웹 합성 근사).
//
// npm run scene -- --game <게임 체크아웃> 이 이 표를 읽고, 게임 정본 커밋의 상수 선언을 읽어 숫자를 채운다
// (게임 체크아웃은 읽기만 한다). 결과는 content/scene/scene.json(비공개)에만 쓴다.
//
// 규칙 하나 = 자리 하나. 값은 함수 (k) => 숫자 로 적고, k로 값의 출처를 남긴다.
//   k.c('SkillEffects.ShardHitScale', 1.1)   게임 소스의 property 선언을 그대로 읽음 (출처: 파일:줄) — 못 찾으면 뒤 값 + 「추정」
//   k.kv('SkillEffects.C7Orders', 'blast', 6) "a=1;b=2" 꼴 property의 한 칸 · k.kvList(key, name) 그 칸의 "1,2,3" 목록
//   k.cfg('riteWhirlRadius', 1.5)            data/config.csv 한 줄
//   k.code(0.55, 'PlayerAttack.mlua:555')    코드 안 지역 값(상수 선언 아님)을 손으로 옮김 — 근거 줄을 적는다
//   k.est(1.0, '이유')                        코드에서 못 읽음 → 추정 (화면에 「추정」으로 표시)
//
// 좌표: 1칸 = 원본 100px(배율 1). dy = 기준점에서 위로(칸) · dx = 시전자→표적 방향으로(칸).
// pivot = [가로, 세로] 비율 · 세로는 아래에서 잰다(MSW 피벗과 같음). 코덱스 그림에만 쓰고, 메이플 클립은 자기 피벗을 쓴다.
// order = MapLayer0 OrderInLayer — 1 이하 = 몸 뒤(바닥) · 2~4 = 몬스터와 캐릭터 사이 · 5 이상 = 몸 앞.
// 장면 배우(scene): player = 캐릭터가 시전 · summon = 소환수(해골·그림자)가 시전 · giant = 뼈 의식 거인이 시전 ·
//   giant 칸 = 그 기술을 쓰는 거인(greatsword·shield·twin·basic · 없으면 마법사 거인).
//   monster = 몬스터가 캐릭터를 침(캐릭터가 맞는 자리). anchor: casterFeet/casterBody/targetFeet/targetBody/targetHead/aim(표적 바닥).
// 투사체(proj): from → to 로 speed(칸/초) 비행, 진행 방향으로 회전 · 명중 효과(hit-*·*-hit)는 표적 몸에서 시작하고 그 순간 맞는 쪽이 번쩍인다(근사).

const HAND = 'Projectile.mlua:184 hand = 발 + HeightOffset 0.3 + 진행 방향 0.35';
const HIT = 'Projectile.mlua:502 명중 자리 = 표적 발 + HeightOffset';
const PROJ_ORDER = k => k.est(0, '투사체 엔티티 층 = MapObject 템플릿 기본 MapLayer0 0 (audit P02·S06 · 모델 파일 직접 확인 못 함)');
const MAPLE_ORDER = k => k.est(3, '메이플 클립(PlayEffect)에 층 지정 없음 = 엔진 기본 — 몸 사이로 근사');
const bodyHeight = k => k.c('Projectile.HeightOffset', 0.3);
const giantBody = k => k.c('UndeadSystem.GiantArtScale', 1.2) * k.code(0.55, 'UndeadSystem.mlua:861 해골 rec.scale');
// C 7종(폭발·성찬·파동·독안개): 배율 = 옛 클립 배율 × 옛 폭(칸) × 100 / 새 그림 내용 폭(px) — SkillEffects.mlua:392-444
const c7 = (kind, old, oldSrc) => k => k.code(old, oldSrc) * k.kv('SkillEffects.C7OldW', kind, 1) * 100 / k.kv('SkillEffects.C7FitPx', kind, 100);
// 거인 계약 Opts: ref(56px = 1칸) → k = (100/56) × 지름 / ref (SkillEffects.mlua:1635-1652 SeqFx)
const refScale = (width, ref) => (100 / 56) * width / ref;

const curse = kind => ({id: `curse-${kind}`, scene: 'player', anchor: 'aim', pivot: [0.5, 0.5],
  scale: k => k.code(1.5, 'SkillEffects.mlua:2193 기본 저주 반경 1.5 × (1 + 범위 강화)') / (k.kv('SkillEffects.CurseCircleFitPx', kind, 180) / 100),
  order: k => k.c('SkillEffects.CurseCircleOrder', 1), loop: true, dur: k => k.c('SkillEffects.CurseCircleLoopSec', 0.8),
  release: k => k.c('GameConst.FxSkillUnifyReleaseN', 2), fade: k => k.c('SkillEffects.CurseCircleFadeSec', 0.3), flash: true,
  note: '조준점 바닥 · 보이는 지름 3칸(판정 원과 같게)', src: ['SkillEffects.mlua:2193-2214', 'SkillEffects.mlua:147-151', 'GameConst.mlua:126-128']});
const mark = kind => ({id: `mark-${kind}`, scene: 'player', anchor: 'targetHead', pivot: [0.5, 0.5],
  dy: k => k.code(1.1, 'MonsterStatus.mlua:842 max(1.1, HitBox.y × 배율 + 0.55) — 일반 몹'),
  scale: k => k.c('MonsterStatus.MarkerScale', 0.9), order: k => k.est(50, '표식 엔티티 층(audit M01 · 모델 파일 직접 확인 못 함)'),
  loop: true, dur: k => k.code(2.0, '저주가 걸린 동안 유지 — 장면에서는 2초'), follow: true,
  note: '몬스터 머리 위 · 몬스터를 따라감(자식 엔티티) · 여러 개면 0.36칸 간격 한 줄', src: ['MonsterStatus.mlua:40-46', 'MonsterStatus.mlua:755-858']});

export const SCENE_RULES = [
  // ---------- 평타·투사체 ----------
  {id: 'slash', scene: 'player', dist: 1.3, anchor: 'casterFeet', dy: k => k.code(0.5, 'PlayerAttack.mlua:434,555 발 + (0,0.2) + 0.3'), dx: k => k.code(0.7, 'PlayerAttack.mlua:434 방향 × 0.7'),
    scale: k => k.code(0.55, 'PlayerAttack.mlua:555 플레이어 옛 배율') * k.c('Util.SlashArtPerOld', 1.9), order: k => k.c('Util.SlashArtOrder', 6), pivot: [0.5, 0.5],
    flash: true, cast: true, note: '플레이어 평타 · 왼쪽이면 거울 · 몬스터·소환수 베기는 배율이 다름(0.855·0.475)', src: ['Util.mlua:790-804', 'PlayerAttack.mlua:555']},
  {id: 'shard-throw', scene: 'player', proj: {from: 'casterHand', to: 'targetBody', speed: k => k.code(12, 'SkillEffects.mlua:900-943 골편 속도'), count: 3, spread: 15},
    scale: k => k.c('SkillEffects.ShardThrowScale', 0.728), order: PROJ_ORDER, pivot: [0.5, 0.5], cast: true, flash: true,
    note: '손(발+0.3+방향 0.35)에서 3발 부채꼴 15° · 진행 방향으로 회전 · 사거리 6.5', src: ['SkillEffects.mlua:706-733', 'SkillEffects.mlua:900-943', HAND]},
  {id: 'shard-hit', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('SkillEffects.ShardHitScale', 1.1),
    order: k => k.c('SkillEffects.ShardHitOrder', 6), pivot: [0.5, 0.5], flash: true, note: '맞은 몬스터 발 + 0.3', src: ['SkillEffects.mlua:825-869', HIT]},
  {id: 'bone-arrow', scene: 'summon', proj: {from: 'casterBody', to: 'targetBody', speed: k => k.code(7, 'ShadowUnit.mlua:1517-1541 원거리 그림자 화살 속도')},
    scale: k => k.c('ShadowUnit.BoneArrowScale', 0.392), order: PROJ_ORDER, pivot: [0.5, 0.5], flash: true,
    note: '원거리 그림자(장면은 해골 소환수로 대신) · 의식 3기 화살은 RiteArrowScale 0.672·속도 13', src: ['ShadowUnit.mlua:103', 'ShadowUnit.mlua:1517-1541', 'SkillEffects.mlua:2076-2130']},
  {id: 'hit-bone', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('Projectile.HitBoneArtScale', 0.92),
    order: k => k.code(6, 'Projectile.mlua:446-448'), pivot: [0.5, 0.5], flash: true, src: ['Projectile.mlua:446-448', HIT]},
  {id: 'spear', scene: 'player', proj: {from: 'casterHand', to: 'targetBody', speed: k => k.code(14, 'MageBolts.mlua:136-146 뼈 창 속도')},
    scale: k => k.code(0.9, 'MageBolts.mlua:136-146 SkinXY'), order: PROJ_ORDER, pivot: [0.5, 0.5], cast: true, flash: true,
    note: '관통 · 사거리 9 · 조사 메모: 1장 그림이라 모델 AngleOffset 180이 붙을 수 있음(10-31 E2 녹화는 창촉이 진행 방향 — 장면은 오른쪽을 보는 그림 그대로)', src: ['MageBolts.mlua:136-146', 'SkillEffects.mlua:755-787']},
  {id: 'spear-hit', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('Projectile.SpearHitScale', 1.0),
    order: k => k.code(6, 'Projectile.mlua:422-425'), pivot: [0.5, 0.5], flash: true, note: '진행 방향으로 회전(장면은 오른쪽 비행)', src: ['Projectile.mlua:422-425', HIT]},
  {id: 'flame-shot', scene: 'player', proj: {from: 'casterHand', to: 'targetBody', speed: k => k.code(11, 'SkillEffects.mlua:978-1012 저주 불꽃 속도')},
    scale: k => k.c('MageBolts.FlameShotArtScale', 1.2), order: PROJ_ORDER, pivot: [0.5, 0.5], cast: true, flash: true,
    note: '저주 불꽃 · 마법사 거인 화염 구슬은 GiantFlameArtScale 2.13', src: ['MageBolts.mlua:18-21', 'SkillEffects.mlua:978-1012']},
  {id: 'hit-fire', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('Projectile.HitArtScale', 1.0), order: k => k.code(6, 'Projectile.mlua:443-451'), pivot: [0.5, 0.5], flash: true, src: ['Projectile.mlua:443-467', HIT]},
  {id: 'frost-shot', scene: 'player', proj: {from: 'casterHand', to: 'targetBody', speed: k => k.code(9, 'MageBolts.mlua:124-135 서리 혼 속도')},
    scale: k => k.c('MageBolts.FrostShotArtScale', 0.796), order: PROJ_ORDER, pivot: [0.5, 0.5], cast: true, flash: true, src: ['MageBolts.mlua:19-20', 'SkillEffects.mlua:1015-1079']},
  {id: 'hit-frost', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('Projectile.HitArtScale', 1.0), order: k => k.code(6, 'Projectile.mlua:443-451'), pivot: [0.5, 0.5], flash: true, src: ['Projectile.mlua:443-467', HIT]},
  {id: 'hit-curse', scene: 'player', anchor: 'targetBody', dy: bodyHeight, scale: k => k.c('Projectile.HitArtScale', 1.0), order: k => k.code(6, 'Projectile.mlua:443-451'), pivot: [0.5, 0.5], flash: true, src: ['Projectile.mlua:443-467', HIT]},
  {id: 'hex-burst', scene: 'player', anchor: 'targetBody', dy: bodyHeight, pivot: [0.5, 0.5],
    scale: k => 2 * k.code(0.9, 'SkillBook.mlua:330-334 저주 불꽃 폭발 기본 반경') / 1.28, order: k => k.c('SkillEffects.FramesFxOrder', 6),
    frameSec: k => k.c('SkillEffects.HexBurstFrameSec', 0.09), hold: k => k.c('SkillEffects.HexBurstHoldSec', 0.2), fade: k => k.c('SkillEffects.HexBurstFadeSec', 0.2), flash: true,
    src: ['SkillEffects.mlua:1082-1098', 'SkillEffects.mlua:92-94']},
  {id: 'shatter', scene: 'player', anchor: 'targetBody', dy: bodyHeight, pivot: [0.5, 0.5],
    scale: k => 2 * k.code(1.3, 'SkillEffects.mlua:1101-1106 파쇄 반경') / 1.28, order: k => k.c('SkillEffects.FramesFxOrder', 6),
    frameSec: k => k.c('SkillEffects.ShatterFrameSec', 0.09), hold: k => k.c('SkillEffects.ShatterHoldSec', 0.2), fade: k => k.c('SkillEffects.ShatterFadeSec', 0.2), flash: true,
    note: '얼어 죽은 자리 + 0.3', src: ['SkillEffects.mlua:1101-1106']},
  {id: 'mage-bolt', scene: 'summon', proj: {from: 'casterBody', to: 'targetBody', speed: k => k.code(7, 'MageBolts.mlua:159-163 마력탄 속도')},
    scale: k => k.code(1.2, 'MageBolts.mlua:159-163 배율'), order: PROJ_ORDER, pivot: [0.5, 0.5], flash: true,
    note: '저주 마법사 마력탄 · 그림이 왼쪽을 봐서 코드가 +180° 돌림(장면도 같게)', flipX: true, src: ['MageBolts.mlua:159-163']},
  {id: 'monster-arrow', scene: 'monster', proj: {from: 'targetHand', to: 'casterBody', speed: k => k.c('MonsterAttack.ArrowSpeed', 7)},
    scale: k => k.code(1.6, 'MonsterAttack.mlua:758-800 화살 배율'), order: PROJ_ORDER, pivot: [0.5, 0.5], flash: true,
    note: '몬스터가 캐릭터를 쏨 · 몬스터 발 + 0.4 + 방향 0.3에서 출발 · 캐릭터가 번쩍임', src: ['MonsterAttack.mlua:34', 'MonsterAttack.mlua:758-800', 'Projectile.mlua:591']},
  {id: 'hit-spark', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.4, 'Monster.mlua:588 발 + 0.4'), scale: k => k.code(0.32, 'MonsterTraits.mlua:428-430 내 타격 0.32(강타 0.4)'),
    playRate: k => k.code(1.5, 'MonsterTraits.mlua:428-430 PlayRate'), order: MAPLE_ORDER, flash: true, src: ['MonsterTraits.mlua:428-430', 'Monster.mlua:588']},

  // ---------- 해골·망자 스킬 ----------
  {id: 'blast', scene: 'summon', dist: 1.6, anchor: 'casterFeet', pivot: [0.5, 0.1667], scale: c7('blast', 0.75, 'ShadowUnit.mlua:926-944 해골 폭탄 옛 배율 0.75 × r/1.6 (r 1.6)'),
    order: k => k.kv('SkillEffects.C7Orders', 'blast', 6), flash: true, note: '해골 폭탄 = 해골 발 자리 · 성찬 제물 폭발은 옛 0.45 → 0.58', src: ['ShadowUnit.mlua:926-944', 'SkillEffects.mlua:161-175', 'SkillEffects.mlua:392-444']},
  {id: 'offering', scene: 'player', anchor: 'casterFeet', pivot: [0.5, 0.25], scale: c7('offering', 1.1, 'UndeadSystem.mlua:638-641 옛 1.1 × r/4 (r 4)'),
    order: k => k.kv('SkillEffects.C7Orders', 'offering', 6), hold: k => k.c('SkillEffects.C7HoldSec', 0.2), fade: k => k.c('SkillEffects.C7FadeSec', 0.25),
    note: '시전자 발 · 반경 4 초록 범위 원(0.6초)은 장면에 안 그림', src: ['UndeadSystem.mlua:638-641', 'SkillEffects.mlua:171-175']},
  {id: 'death-wave', scene: 'player', anchor: 'casterFeet', pivot: [0.5, 0.5], scale: c7('wave', 2.6, 'SkillEffects.mlua:2378-2384 옛 배율 2.6'),
    order: k => k.kv('SkillEffects.C7Orders', 'wave', 1), flash: true, note: '시전자 발 중심 · 보이는 폭 ≈ 6.4칸(판정 반경 3.5)', src: ['SkillEffects.mlua:2378-2384', 'GameConst.mlua:172']},
  {id: 'poison-mist', scene: 'player', anchor: 'aim', pivot: [0.5, 0.25], scale: c7('poison', 1.25, 'SkillEffects.mlua:946-975 옛 1.25 × r/1.3 (r 1.3)'),
    order: k => k.kv('SkillEffects.C7Orders', 'poison', 1), loop: true, dur: k => k.code(3.47, 'SkillEffects.mlua:946-975 반복 → 잦아듦 → 옅어짐 = 약 4초'),
    release: k => k.c('GameConst.FxSkillUnifyReleaseN', 2), fade: k => k.c('SkillEffects.C7FadeSec', 0.25), flash: true, src: ['SkillEffects.mlua:946-975', 'GameConst.mlua:173-174']},
  {id: 'drain-vortex', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.4, 'SkillEffects.mlua:1883-1900 표적 발 + 0.4'), pivot: [0.5, 0.5],
    scale: k => k.c('SkillEffects.DrainVortexScale', 0.8), order: k => k.code(6, 'SkillEffects.mlua:1930'), loop: true, dur: k => k.c('SkillEffects.DrainVortexSec', 0.7), flash: true,
    src: ['SkillEffects.mlua:1883-1900', 'SkillEffects.mlua:165-166']},
  {id: 'bone-storm', scene: 'player', anchor: 'casterFeet', dy: k => k.code(0.3, 'SkillEffects.mlua:447-504 발 + 0.3'), pivot: [0.5, 0.5],
    scale: k => 2 * k.c('SkillEffects.StormRadius', 1.2) / 1.28, order: k => k.code(5, 'SkillEffects.mlua:447-504'), loop: true, dur: k => k.code(2.4, '6초 지속 — 장면에서는 2.4초'),
    frameSec: k => k.code(0.08, 'SkillEffects.mlua:447-504 장 간격 고정값'), follow: true, note: '시전자에 붙어 따라감 · 지름 = 판정 지름 2.4칸', src: ['SkillEffects.mlua:447-504', 'SkillEffects.mlua:69']},
  {id: 'rite-whirl', scene: 'summon', anchor: 'aim', pivot: [0.5, 0.5],
    scale: k => 2 * k.cfg('riteWhirlRadius', 1.5) / (k.c('SkillEffects.RiteWhirlContentPx', 353) / 100), order: k => k.c('SkillEffects.RiteWhirlOrder', 1),
    loop: true, dur: k => k.code(4.0, 'SkillEffects.mlua:2053-2073 회오리 4초'), flash: true, src: ['SkillEffects.mlua:2053-2073', 'SkillEffects.mlua:156-160', 'data/config.csv riteWhirlRadius']},
  {id: 'rite-whirl-trace', scene: 'summon', anchor: 'aim', pivot: [0.5, 0.5],
    scale: k => 2 * k.cfg('riteWhirlRadius', 1.5) / (k.c('SkillEffects.RiteWhirlTraceContentPx', 360) / 100), order: k => k.c('SkillEffects.RiteWhirlTraceOrder', 0),
    hold: k => k.code(3.6, 'SkillEffects.mlua:2053-2073 회오리 시간 - 옅어짐'), fade: k => k.c('SkillEffects.RiteWhirlTraceFadeSec', 0.4), src: ['SkillEffects.mlua:2053-2073', 'SkillEffects.mlua:157-160']},
  {id: 'dash-ghost', scene: 'player', anchor: 'casterFeet', pivot: [0.5, 0.1], scale: k => k.c('SkillEffects.DashGhostScale', 1.0), order: k => k.c('SkillEffects.DashGhostOrder', 3),
    copies: k => { const step = k.c('SkillEffects.DashGhostStepSec', 0.05), len = k.est(1.6, '망령 질주 거리 — 코드 값 미조사'); return [0, 1, 2].map(i => ({dx: -len + i * len / 3, delay: i * step})); },
    note: '떠난 자리 → 도착 쪽 길 위 0·1/3·2/3 (캐릭터가 오른쪽으로 질주한 뒤)', src: ['SkillEffects.mlua:1793-1822', 'SkillEffects.mlua:152-155']},
  {id: 'sacrifice', scene: 'summon', dist: 1.6, anchor: 'casterFeet', pivot: [0.5, 0.5],
    scale: k => 2 * k.code(1.8, 'SkillEffects.mlua:2388-2416 판정 반경') / (k.c('SkillEffects.SacrificeContentPx', 424) / 100), order: k => k.c('SkillEffects.SacrificeOrder', 1),
    flash: true, note: '희생된 그림자 발(장면은 해골 소환수로 대신) · 피벗은 가운데로 추정', src: ['SkillEffects.mlua:2388-2416', 'SkillEffects.mlua:131-132']},

  // ---------- 뼈 감옥·뼈 갑옷·혼 격류 ----------
  {id: 'prison-hold', scene: 'player', anchor: 'targetFeet', pivot: [0.5, 0.2], scale: k => k.c('SkillEffects.PrisonScale', 1.0), order: k => k.c('SkillEffects.PrisonOrder', 6),
    loop: true, dur: k => k.code(2.75, 'SkillBook.mlua:623 묶임 2 + 0.15 × 강화 5'), frameSec: k => k.c('SkillEffects.PrisonFrameSec', 0.1), flash: true, src: ['SkillEffects.mlua:2268-2300', 'SkillEffects.mlua:133-136']},
  {id: 'prison-release', scene: 'player', anchor: 'targetFeet', pivot: [0.5, 0.2], scale: k => k.c('SkillEffects.PrisonScale', 1.0), order: k => k.c('SkillEffects.PrisonOrder', 6),
    frameSec: k => k.c('SkillEffects.PrisonReleaseSec', 0.1), src: ['SkillEffects.mlua:2268-2300']},
  {id: 'armor-cast', scene: 'player', anchor: 'casterFeet', dy: k => k.c('SkillEffects.ArmorArtDy', 0.45), pivot: [0.5, 0.5], scale: k => k.c('SkillEffects.ArmorCastArtScale', 1.0),
    order: k => k.c('SkillEffects.ArmorCastOrder', 5), cast: true, src: ['SkillEffects.mlua:2737-2741', 'SkillEffects.mlua:144-146']},
  {id: 'armor-ring-front', scene: 'player', anchor: 'casterFeet', dy: k => k.c('PlayerStats.ArmorRingDy', 0.45), pivot: [0.5, 0.5], scale: k => k.c('PlayerStats.ArmorRingArtScale', 1.0),
    order: k => k.code(5, 'PlayerStats.mlua:147-162 앞 층'), loop: true, dur: k => k.code(2.4, '흡수량이 남은 동안 — 장면 2.4초'), alpha: k => k.code(0.85, 'PlayerStats.mlua:825-880 알파 0.55~0.85'), follow: true,
    src: ['PlayerStats.mlua:147-162', 'PlayerStats.mlua:825-880']},
  {id: 'armor-ring-back', scene: 'player', anchor: 'casterFeet', dy: k => k.c('PlayerStats.ArmorRingDy', 0.45), pivot: [0.5, 0.5], scale: k => k.c('PlayerStats.ArmorRingArtScale', 1.0),
    order: k => k.code(3, 'PlayerStats.mlua:147-162 뒤 층'), loop: true, dur: k => k.code(2.4, '흡수량이 남은 동안 — 장면 2.4초'), alpha: k => k.code(0.85, 'PlayerStats.mlua:825-880'), follow: true,
    note: '층 3 — MSW 아바타(3·4)와 같은 층이라 장면에서는 캐릭터 바로 뒤', src: ['PlayerStats.mlua:147-162']},
  {id: 'armor-absorb', scene: 'monster', anchor: 'casterFeet', dy: k => k.c('PlayerStats.ArmorRingDy', 0.45), pivot: [0.5, 0.5], scale: k => k.code(1.0, 'PlayerStats.mlua:163-168'),
    order: k => k.code(5, 'PlayerStats.mlua:163-168'), flash: true, note: '캐릭터가 맞을 때 · 캐릭터가 번쩍임', src: ['PlayerStats.mlua:163-168', 'PlayerStats.mlua:715-730']},
  {id: 'armor-break', scene: 'monster', anchor: 'casterFeet', dy: k => k.c('PlayerStats.ArmorRingDy', 0.45), pivot: [0.5, 0.5], scale: k => k.code(1.0, 'PlayerStats.mlua:163-168'),
    order: k => k.code(5, 'PlayerStats.mlua:163-168'), flash: true, note: '흡수량을 다 쓴 순간', src: ['PlayerStats.mlua:163-168']},
  {id: 'torrent-body', scene: 'player', proj: {from: 'casterBody', to: 'targetBody', speed: k => k.code(7, 'MageBolts.mlua:147-157 영혼 격류 속도'), count: 3, spread: 60},
    scale: k => k.code(0.42, 'MageBolts.mlua:147-157 혼 구슬 배율(FxSkillTorrent가 빈 동안)'), order: PROJ_ORDER, pivot: [0.5, 0.5], cast: true, flash: true,
    note: '3 + 레벨/5발 · 부채꼴 60° · 유도(장면은 직선 근사)', src: ['MageBolts.mlua:147-157', 'SkillEffects.mlua:2342-2375']},
  {id: 'torrent-cast', scene: 'player', anchor: 'casterFeet', dy: k => k.code(0.45, 'SkillEffects.mlua:2535-2540 시전자 발 + 0.45'), pivot: [0.5, 0.5],
    scale: k => k.c('SkillEffects.TorrentCastArtScale', 0.8), order: k => k.code(5, 'SkillEffects.mlua:2535-2540'), cast: true, src: ['SkillEffects.mlua:2535-2540', 'SkillEffects.mlua:167']},
  {id: 'torrent-hit', scene: 'player', anchor: 'targetBody', dy: bodyHeight, pivot: [0.5, 0.5], scale: k => k.c('Projectile.TorrentHitArtScale', 0.75),
    order: k => k.code(6, 'Projectile.mlua:430-433'), flash: true, src: ['Projectile.mlua:430-433', HIT]},

  // ---------- 그림자 추출·소환 ----------
  {id: 'arise-ring', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.05, 'SoulExtractor.mlua:161 혼 자리 + 0.05'), scale: k => k.code(1.1, 'SoulExtractor.mlua:161 (정예 ×1.25)'), order: MAPLE_ORDER,
    note: '쓰러진 몬스터(혼) 자리 바닥', src: ['SoulExtractor.mlua:161']},
  {id: 'arise-flame', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.75, 'SoulExtractor.mlua:170 혼 자리 + 0.75'), scale: k => k.code(0.5, 'SoulExtractor.mlua:170'), order: MAPLE_ORDER, src: ['SoulExtractor.mlua:170']},
  {id: 'arise-burst', scene: 'player', anchor: 'casterFeet', dy: k => k.code(0.5, 'SoulExtractor.mlua:193 주인 발 + 0.5'), scale: k => k.code(0.45, 'SoulExtractor.mlua:193'), order: MAPLE_ORDER,
    start: k => k.code(0.75, 'SoulExtractor.mlua:172-198 혼 출발 0.35 + 비행 0.4'), note: '혼 구슬이 주인에게 닿는 순간', src: ['SoulExtractor.mlua:172-198']},
  {id: 'arise-soul', scene: 'player', proj: {from: 'targetSoul', to: 'casterBody', time: k => k.code(0.4, 'SoulExtractor.mlua:172-198 비행 0.4초'), arc: k => k.code(0.8, 'SoulExtractor.mlua:172-198 위로 볼록 0.8'), rotate: false},
    start: k => k.code(0.35, 'SoulExtractor.mlua:172-198 0.35초에 출발'), scale: k => k.code(0.32, 'SoulExtractor.mlua:172-198'), order: MAPLE_ORDER,
    note: '혼 자리 + 0.9 → 주인 발 + 0.5 곡선', src: ['SoulExtractor.mlua:172-198']},
  {id: 'shadow-rise', scene: 'player', anchor: 'casterFeet', dx: k => k.est(1.0, '소환 자리 — 캐릭터 옆 1칸으로 둠'), pivot: [0.5, 0.1], scale: k => k.code(1.25, 'ShadowCommander.mlua:297-300'),
    order: k => k.c('SkillEffects.FramesFxOrder', 6), frameSec: k => k.c('SkillEffects.RiseFrameSec', 0.08), hold: k => k.c('SkillEffects.RiseHoldSec', 0.15), fade: k => k.c('SkillEffects.RiseFadeSec', 0.15),
    src: ['ShadowCommander.mlua:297-300', 'SkillEffects.mlua:98-100']},
  {id: 'elite-promote', scene: 'summon', anchor: 'casterFeet', pivot: [0.5, 0.1], scale: k => k.code(1.25, 'SkillEffects.mlua:2448'),
    order: k => k.c('SkillEffects.FramesFxOrder', 6), frameSec: k => k.c('SkillEffects.RiseFrameSec', 0.08), hold: k => k.c('SkillEffects.RiseHoldSec', 0.15), fade: k => k.c('SkillEffects.RiseFadeSec', 0.15),
    note: '승격된 그림자 발(장면은 해골 소환수로 대신)', src: ['SkillEffects.mlua:2448']},
  {id: 'summon-ritual', scene: 'player', anchor: 'casterFeet', dx: k => k.est(1.0, '소환 자리 — 캐릭터 옆 1칸으로 둠'), pivot: [0.5, 0.5],
    scale: k => k.code(0.17, 'UndeadSystem.mlua:828-842 가로 0.1 → 0.17'), scaleY: k => k.code(0.09, 'UndeadSystem.mlua:828-842 세로 0.055 → 0.09 (납작한 타원)'),
    order: k => k.est(1, '소환 문양 층(audit P34)'), hold: k => k.code(0, 'UndeadSystem.mlua:828-842'), fade: k => k.code(0.72, 'UndeadSystem.mlua:828-842 0.72초 동안 알파 1→0'), src: ['UndeadSystem.mlua:828-842']},
  {id: 'death-smoke', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.3, 'Monster.mlua:844 죽은 자리 + 0.3'), scale: k => k.code(0.7, 'Monster.mlua:844'),
    playRate: k => k.code(1.6, 'Monster.mlua:844 PlayRate'), order: MAPLE_ORDER, src: ['Monster.mlua:844']},
  {id: 'elite-burst', scene: 'player', anchor: 'targetFeet', dy: k => k.code(0.55, 'Monster.mlua:909-931 정예 발 + 0.55'), pivot: [0.5, 0.5], scale: k => k.code(0.85, 'Monster.mlua:909-931'),
    order: k => k.code(7, 'Monster.mlua:909-931'), note: '정예(grade 2) 처치 때만', src: ['Monster.mlua:909-931']},

  // ---------- 저주 원형판 ----------
  curse('amp'), curse('weaken'), curse('thorn'), curse('terror'), curse('lifetap'), curse('resist'),
  {id: 'curse-break', scene: 'player', anchor: 'targetBody', dy: bodyHeight, pivot: [0.5, 0.5], scale: k => k.est(1.0, '부르는 코드 없음 — GameConst 주석 64×64만'),
    order: k => k.est(6, '부르는 코드 없음'), note: '지금 코드에서 부르는 곳 없음(조사 11-01)', src: ['GameConst.mlua:99']},

  // ---------- 머리 위 표식 ----------
  mark('amp'), mark('weaken'), mark('thorn'), mark('terror'), mark('confuse'), mark('lifetap'), mark('decay'), mark('resist'), mark('root'), mark('chill'), mark('poison'), mark('hex'), mark('frost'),

  // ---------- 거인 기술 (뼈 의식 거인 = 캐릭터의 소환수) ----------
  {id: 'giant-nova', scene: 'giant', anchor: 'casterFeet', pivot: [0.5, 0.375], start: k => k.code(0.3, 'RiteGiantMoves.mlua:256-298 영창 0.3초'),
    scale: k => refScale(2 * k.code(3.75, 'data/rite_giants.csv mage 노바 반경'), k.kv('SkillEffects.FxGiantNovaV2Opts', 'ref', 7.5)), order: k => k.code(1, 'SkillEffects.mlua:1187-1191'),
    alpha: k => k.code(0.85, 'SkillEffects.mlua:1589 own 색 알파'), flash: true, src: ['RiteGiantMoves.mlua:256-298', 'SkillEffects.mlua:48-50', 'SkillEffects.mlua:1635-1652']},
  {id: 'meteor-telegraph', scene: 'giant', anchor: 'aim', pivot: [0.5, 0.5], scale: k => refScale(2 * k.code(1.8, 'RiteGiantMoves.mlua:537-567 메테오 반경'), k.c('SkillEffects.MeteorL2LandRef', 10)),
    order: k => k.code(1, 'SkillEffects.mlua:1508-1540'), loop: true, dur: k => k.code(1.5, 'RiteGiantMoves.mlua:537-567 영창 1.0 + 낙하 0.5'), src: ['SkillEffects.mlua:1508-1540', 'SkillEffects.mlua:116-124']},
  {id: 'meteor-fall', scene: 'giant', proj: {from: 'meteorSky', to: 'aim', time: k => k.code(0.5, 'RiteGiantMoves.mlua:537-567 낙하 0.5초'), rotate: false,
    sky: k => { const d = k.c('SkillEffects.MeteorL2FallDist', 4), a = k.c('SkillEffects.MeteorL2FallDeg', 60) * Math.PI / 180; return [d * Math.cos(a), d * Math.sin(a)]; }},
    pivot: [0.5, 0.0833], scale: k => k.c('SkillEffects.MeteorFallMul', 1.5) * k.c('SkillEffects.MeteorL2FallCoreW', 0.8) * 100 / k.c('SkillEffects.MeteorL2FallCorePx', 62.449),
    order: k => k.code(6, 'SkillEffects.mlua:1508-1540 낙하 몸 앞'), flash: true, note: '표적 오른쪽 위에서 축 60°로 4칸 · 회전 없음(표적이 왼쪽이면 좌우 반전)', src: ['SkillEffects.mlua:118-121', 'SkillEffects.mlua:1508-1540']},
  {id: 'meteor-impact', scene: 'giant', anchor: 'aim', pivot: [0.5, 0.5], scale: k => refScale(2 * k.code(1.8, 'RiteGiantMoves.mlua:537-567 메테오 반경'), k.c('SkillEffects.MeteorL2LandRef', 10)),
    order: k => k.code(1, 'SkillEffects.mlua:1508-1540'), flash: true, src: ['SkillEffects.mlua:1508-1540']},
  {id: 'meteor-afterglow', scene: 'giant', anchor: 'aim', pivot: [0.5, 0.5], scale: k => refScale(2 * k.code(1.8, 'RiteGiantMoves.mlua:537-567 메테오 반경'), k.c('SkillEffects.MeteorL2LandRef', 10)),
    order: k => k.code(1, 'SkillEffects.mlua:1508-1540'), loop: true, dur: k => k.code(1.2, 'SkillEffects.mlua:1508-1540 잔불 1.2초'), fade: k => k.c('SkillEffects.MeteorL2FadeSec', 0.3), src: ['SkillEffects.mlua:122', 'SkillEffects.mlua:1508-1540']},
  {id: 'giant-spin-front', scene: 'giant', giant: 'greatsword', dist: 1.6, anchor: 'casterFeet', pivot: [0.5, 0.5], dy: k => k.kv('SkillEffects.FxGiantSpinFrontOpts', 'aypx', 80) * giantBody(k) / 100,
    scale: k => 2 * k.code(1.5, 'RiteGiantMoves.mlua:154-228 회전 반경') / (k.kv('SkillEffects.FxGiantSpinOpts', 'cw', 352) / 100), order: k => k.kv('SkillEffects.FxGiantSpinFrontOpts', 'order', 6),
    loop: true, dur: k => k.code(1.5, 'RiteGiantMoves.mlua:154-228 5타 1.5초'), frameSec: k => k.code(0.3 / 16, 'SkillEffects.mlua:53 한 바퀴 0.3초 ÷ 16장'), follow: true, flash: true,
    note: '몸 root + 80px × 몸 배율 · 몸을 따라감(이동형 휠윈드 — 장면은 제자리)', src: ['RiteGiantMoves.mlua:154-228', 'SkillEffects.mlua:51-55', 'SkillEffects.mlua:1606-1611']},
  {id: 'giant-spin-back', scene: 'giant', giant: 'greatsword', dist: 1.6, anchor: 'casterFeet', pivot: [0.5, 0.5], dy: k => k.kv('SkillEffects.FxGiantSpinBackOpts', 'aypx', 0) * giantBody(k) / 100,
    scale: k => 2 * k.code(1.5, 'RiteGiantMoves.mlua:154-228 회전 반경') / (k.kv('SkillEffects.FxGiantSpinOpts', 'cw', 352) / 100), order: k => k.kv('SkillEffects.FxGiantSpinBackOpts', 'order', 1),
    loop: true, dur: k => k.code(1.5, 'RiteGiantMoves.mlua:154-228'), frameSec: k => k.code(0.3 / 16, 'SkillEffects.mlua:53'), follow: true, src: ['SkillEffects.mlua:55']},
  {id: 'giant-rift', scene: 'giant', giant: 'greatsword', anchor: 'casterFeet', dy: k => k.code(0.05, 'RiteGiantMoves.mlua:423-486 발 + 0.05'), pivot: [0, 0.0833], start: k => k.code(0.3, 'RiteGiantMoves.mlua:676-683 꽂는 순간'),
    scale: k => k.code(6, 'RiteGiantMoves.mlua:423-486 직선 6칸') / (k.kv('SkillEffects.FxGiantRiftOpts', 'cw', 488) / 100), order: k => k.code(1, 'RiteGiantMoves.mlua:423-486'), flash: true,
    src: ['RiteGiantMoves.mlua:423-486', 'SkillEffects.mlua:56-57']},
  {id: 'giant-slam', scene: 'giant', giant: 'shield', dist: 1.5, anchor: 'casterFeet', pivot: [0.5, 0.104], flipX: true,
    dx: k => -k.kv('SkillEffects.FxGiantSlamOpts', 'axpx', -30) * giantBody(k) / 100, dy: k => k.kv('SkillEffects.FxGiantSlamOpts', 'aypx', 2) * giantBody(k) / 100,
    scale: giantBody, orders: k => k.kvList('SkillEffects.FxGiantSlamOpts', 'orders'), hold: k => k.c('SkillEffects.GiantSlamHoldSec', 0.18), flash: true,
    note: '접점 = 몸 root + (-30, +2)px × 몸 배율 · 장별 층(앞 3장 6 → 1) · 그림은 왼쪽 기준이라 오른쪽을 볼 때 좌우 반전', src: ['RiteGiantMoves.mlua:372-412', 'SkillEffects.mlua:58-61', 'SkillEffects.mlua:1598-1611']},
  {id: 'giant-roar', scene: 'giant', giant: 'shield', anchor: 'casterFeet', pivot: [0.5, 0.5], flipX: true, scale: giantBody,
    offsets: k => { const gx = k.kvList('SkillEffects.FxGiantRoarOpts', 'gxpx'), gy = k.kvList('SkillEffects.FxGiantRoarOpts', 'gypx'), s = giantBody(k) / 100; return gx.map((x, i) => [-x * s, (gy[i] || 0) * s]); },
    orders: k => k.kvList('SkillEffects.FxGiantRoarOpts', 'orders'),
    note: '몸 root + 장별 오프셋 × 몸 배율(6번째 장부터 고정) · 장별 층', src: ['RiteGiantMoves.mlua:571-597', 'SkillEffects.mlua:62-63']},
  {id: 'giant-dash', scene: 'giant', giant: 'twin', anchor: 'casterFeet', dy: k => k.code(0.3, 'RiteGiantMoves.mlua:489-534 길 + 0.3'), pivot: [0, 0.5], flipX: true,
    scale: k => k.est(3.0, '돌진 길이 L — max(0.6, 거리 - 0.5, 최대 4.5) 중 3칸으로 둠') / 2.56, scaleY: k => k.code(0.8 / 0.96, 'SkillEffects.mlua:1619-1634 세로 0.833'),
    order: k => k.code(1, 'RiteGiantMoves.mlua:489-534'), flash: true, note: '피벗 = 출발점 · 길 전체로 늘임 · 그림 머리가 -x라 오른쪽 돌진은 좌우 반전', src: ['RiteGiantMoves.mlua:489-534', 'SkillEffects.mlua:39-40', 'SkillEffects.mlua:1619-1634']},
  {id: 'giant-flurry', scene: 'giant', giant: 'twin', dist: 1.5, anchor: 'targetFeet', dy: k => k.code(0.066, 'RiteGiantMoves.mlua:229-255 표적 발 + 0.45 - 0.384'), pivot: [0.5, 0.5],
    scale: k => k.code(2.3, 'RiteGiantMoves.mlua:229-255 2.3칸') / 1.92, order: k => k.code(6, 'RiteGiantMoves.mlua:229-255'),
    copies: k => { const gap = k.code(0.15, 'RiteGiantMoves.mlua:229-255 타격 간격'); return [0, 1, 2, 3, 4, 5].map(i => ({delay: i * gap})); }, flash: true,
    note: '6타 · 0.15초 간격으로 겹쳐 재생', src: ['RiteGiantMoves.mlua:229-255', 'SkillEffects.mlua:37-38']},
  {id: 'giant-quake', scene: 'giant', giant: 'basic', anchor: 'casterFeet', pivot: [0.5, 0.5], scale: k => k.est(1.0, '부르는 코드 없음'), order: k => k.est(1, '부르는 코드 없음'),
    note: '기본 거인은 기술 없음 — 부르는 곳 없음(RiteGiantMoves.mlua:68-71)', src: ['GameConst.mlua:81']},
  {id: 'giant-bone', scene: 'giant', giant: 'basic', proj: {from: 'casterBody', to: 'targetBody', speed: k => k.est(8, '부르는 코드 없음')}, pivot: [0.5, 0.5], scale: k => k.est(1.0, '부르는 코드 없음'), order: PROJ_ORDER,
    flash: true, note: '부르는 곳 없음 · 날아가는 동안 2장 반복(주석)', src: ['GameConst.mlua:82']},
  {id: 'giant-hexfield', scene: 'giant', anchor: 'aim', pivot: [0.5, 0.5], scale: k => k.est(1.5, '부르는 코드 없음'), order: k => k.est(1, '부르는 코드 없음'),
    loop: true, dur: k => k.est(2.4, '주석 5초 — 장면 2.4초'), note: '부르는 곳 없음', src: ['GameConst.mlua:89']},

  // ---------- 레벨업·기타 ----------
  {id: 'levelup-ring', scene: 'player', anchor: 'casterFeet', pivot: [0.5, 0.31], scale: k => k.code(0.62, 'PlayerStats.mlua:362-382'), order: k => k.code(1, 'PlayerStats.mlua:362-382'), follow: true,
    note: '피벗은 주석(발 기준 128/88)에서 추정', src: ['PlayerStats.mlua:362-382']},
  {id: 'levelup-pillar', scene: 'player', anchor: 'casterFeet', pivot: [0.5, 0.0], scale: k => k.code(0.6, 'PlayerStats.mlua:333-358'), order: k => k.code(7, 'PlayerStats.mlua:333-358'), follow: true,
    src: ['PlayerStats.mlua:333-358']}
];
