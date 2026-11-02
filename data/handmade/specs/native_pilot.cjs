// 기획 61 §4 메이커 내장 기능 파일럿 (11-02 · 코덱스 그림 0장) — 이 표에 있는 맵만 켠다. 다른 맵은 지금과 같다.
//   torchFlicker: 화로(Objects/Brazier) 인스턴스에 OverlayLightComponent를 붙이고 TorchLight.Flicker를 준다.
//     DarkVision은 OverlayLightComponent가 있는 화로에는 서비스 빛을 따로 만들지 않고, 그 컴포넌트 세기를 클라이언트에서 흔든다(세기 폭 = Flicker)
//     + 화면 근처 화로에 ToonFireTorch 불꽃 입자. 롤백 = 이 줄 지우고 build.cjs <맵> (서비스 빛 · 깜빡임 0으로 복귀)
//   footShadow: 역할표(asset_roles.csv) feature·structure 장식 발밑에 공용 발밑 그림자(FOOT_SHADOW · maps.cjs NPC와 같은 그림) 한 장씩.
//     가로 = 그림 폭 × width · 색 알파 alpha(그림 자체 최대 알파 0.55 → 화면 약 0.3) · 이름 ArtShadow<n>(DarkVision Art* 규칙 그대로)
//   위치 소리(kind sound)·구역 안개(kind fog)는 배치표(data/handmade/<id>.csv) 줄로, 맵 전체 날씨는 maps.csv weather 열로 정한다.
module.exports = {
  wasteland: {
    torchFlicker: 0.15,
    footShadow: { roles: ["feature", "structure"], width: 0.7, alpha: 0.55, max: 30 },
  },
  // 표본 방 (11-02 · maps.csv kind handmade · 황무지 설계도 복사 + 후처리 A 장면판) — 황무지와 같은 연출
  sample_plate: {
    torchFlicker: 0.15,
    footShadow: { roles: ["feature", "structure"], width: 0.7, alpha: 0.55, max: 30 },
  },
};
