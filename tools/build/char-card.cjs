'use strict';
// 캐릭터 카드 공용 (캐릭터 선택 CharSelectHUD · 파티 모집 판 RoomPicker): UI 아바타 + 이름 + 한 줄 정보.
// 옷(외형)은 실행 중에 CharSelectWindow.Dress가 입힌다 — 두 화면이 같은 모습으로 보이게 한 곳에서.

// UI 아바타: 비어 있는 그림 자리 + 옷장(CostumeManager, 계정 옷 무시) + 아바타 그리기
function avatarOf(b) {
  return (name, opts) => {
    b.avatar(name, { ...opts, raycast: false, preserve_avatar: 1 });
    if (!b.hasComponent || !b.hasComponent(name, 'MOD.Core.CostumeManagerComponent')) {
      try { b.addComponent(name, 'MOD.Core.CostumeManagerComponent', { UseCustomEquipOnly: true }); } catch (e) { b.patchComponent(name, 'MOD.Core.CostumeManagerComponent', { UseCustomEquipOnly: true }); }
    }
  };
}

// 파티 모집 판 카드 (폭 w × 높이 h): Avatar · Empty(빈자리) · Name · Info
function memberCard(b, n, { x, y, w, h, panel }) {
  const avatar = avatarOf(b);
  b.panel(n, { anchor: 'top-left', pivot: [0, 1], pos: [x, y], rect_size: [w, h], ...panel, sprite_type: 1 });
  avatar(n + '/Avatar', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -14], rect_size: [Math.round(w * 0.7), Math.round(h * 0.63)] });
  b.text(n + '/Empty', '빈자리', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -Math.round(h * 0.3)], rect_size: [w - 40, 48], size: 26, color: '#5E5648', alignment: 4 });
  b.text(n + '/Name', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -Math.round(h * 0.7)], rect_size: [w - 30, 44], size: 28, bold: true, color: '#F3E7CC', alignment: 4, bestfit: true, min_size: 18, max_size: 28 });
  b.text(n + '/Info', '', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -Math.round(h * 0.7) - 50], rect_size: [w - 30, 40], size: 20, color: '#E6DCC6', alignment: 4, bestfit: true, min_size: 14, max_size: 20 });
}

module.exports = { avatarOf, memberCard };
