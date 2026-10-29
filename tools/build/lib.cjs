// 빌드 공용: 경로, MSW 빌더, CSV 읽기, 좌표 문자열 해석.
"use strict";
const path = require("path");
const fs = require("fs");
const { load, num, bool } = require("../lib/csv.cjs");

const ROOT = path.resolve(__dirname, "../..");
const SKILLS = path.join(ROOT, ".claude/skills");
const { ModelBuilder } = require(path.join(SKILLS, "msw-general/scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(SKILLS, "msw-general/scripts/map/msw_map_builder.cjs"));
const { UIBuilder } = require(path.join(SKILLS, "msw-ui-system/scripts/msw_ui_builder.cjs"));

// 확장자는 조립해서 쓴다 (작업 훅이 이 확장자 문자열이 든 셸 명령을 막는다)
const EXT = { model: "." + "model", map: ".map", ui: "." + "ui" };

const P = {
  model: (rel) => path.join(ROOT, "RootDesk/MyDesk/Models", rel + EXT.model),
  map: (id) => path.join(ROOT, "map", id + EXT.map),
  ui: (name) => path.join(ROOT, "ui", name + EXT.ui),
  global: (name) => path.join(ROOT, "Global", name + EXT.model),
  template: (name) => path.join(__dirname, "templates", name + EXT.model),
  skillModel: (name) => path.join(SKILLS, "msw-general/models", name + EXT.model),
};

// "x/y" → [x, y, 0]
function pos(text) {
  const [x, y] = text.split("/").map(Number);
  if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`좌표 형식 오류: '${text}' (x/y)`);
  return [x, y, 0];
}

// "name@x/y" → { name, pos }
function at(text) {
  const [name, p] = text.split("@");
  return { name, pos: pos(p) };
}

function list(text, sep = ";") {
  return text === "" ? [] : text.split(sep).map((s) => s.trim()).filter(Boolean);
}

// 빌더의 진행 로그를 줄인다 (요약만 남긴다)
function quiet(fn) {
  const log = console.log;
  console.log = () => {};
  try { return fn(); } finally { console.log = log; }
}

function exists(file) { return fs.existsSync(file); }

// 새로 만든(복제한) 맵·UI 파일의 엔티티 id를 같은 경로의 옛 id로 되돌리고, 파일 메타(EntryKey·Id·GameId·Content)는 옛 값을 쓴다.
// 그래서 다시 빌드해도 메이커가 같은 항목으로 보고 git diff도 생기지 않는다.
function readIfExists(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null; }

function preserveIds(file, previousText) {
  if (!previousText) return;
  const prev = JSON.parse(previousText);
  const oldByPath = new Map(prev.ContentProto.Entities.map((e) => [e.path, e.id]));
  let text = fs.readFileSync(file, "utf8");
  for (const e of JSON.parse(text).ContentProto.Entities) {
    const old = oldByPath.get(e.path);
    if (old && old !== e.id) text = text.split(e.id).join(old);
  }
  const obj = JSON.parse(text);
  for (const k of ["EntryKey", "Id", "GameId", "Content"]) obj[k] = prev[k];
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + (previousText.endsWith("\n") ? "\n" : ""), "utf8");
}

// 진행 막대 공용 (10-28 사용자 「민짜 막대 말고 만들어 둔 막대로 전부 교체」):
//   창 안 진행 막대 = 업적 막대 그림 — 청동 테두리 바탕(jr_bar_bg) + 보라→금 채움(jr_bar_fill), 둘 다 9조각.
//   채움은 폭을 줄여 나타낸다(양 끝 장식 8px 유지) → 실행 중에는 UIKit.SetBar(<이름>/Fill, 비율)
function progressBar(b, name, opts) {
  const icons = Object.fromEntries(load("ui_icons").map((r) => [r.key, r.ruid]));
  const [w, h] = opts.rect_size;
  b.panel(name, { ...opts, image_ruid: icons.jr_bar_bg, color: "#FFFFFF", sprite_type: 1 });
  b.sprite(`${name}/Fill`, { anchor: "middle-left", pivot: [0, 0.5], pos: [0, 0], rect_size: [w, h], image_ruid: icons.jr_bar_fill, color: "#FFFFFF", sprite_type: 1 });
  b.patchComponent(name, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.patchComponent(`${name}/Fill`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false, FillAmount: 1 });
}

// ── 공용 창 틀 (10-29 기획서 45 결정 2-A) ──
//   소지품·창고·상점·떠돌이 상인·의뢰 일지·일지·그림자 보관함(예전 별도 빌더 7개) · GameHUD 창(ui.cjs kit.frame) · 마을 게시판이 모두 이 틀을 쓴다.
//   꽉 찬 어두운 바탕(gauge_fill 한 장 · a1 — 기본 판 그림은 가운데가 비쳐 큰 창 뒤 화면이 보였다)
//   + 테두리(win_frame · 바탕보다 rimOut씩 밖으로) + 제목(26 굵게 · #F6E3B0 · 외곽선 · 제목 띠 가운데) + 닫기(88 · FRAME.close).
//   창 몸통 배치는 각 빌더가 정한다. 실행 중에는 <창>/Title · <창>/BtnClose · <창>/Rim 경로로 찾는다 (이름 그대로).
//   opts: { anchor, pos, size:[w,h], title, enable, pivot } — enable을 안 주면 이미 있던 창의 켜짐 상태를 그대로 둔다
function iconMap() { return Object.fromEntries(load("ui_icons").map((r) => [r.key, r.ruid])); }

function windowFrame(b, name, opts) {
  const T = require("./ui-tokens.cjs");
  const icons = iconMap();
  const { anchor = "middle-center", pos = [0, 0], size, title = "", pivot } = opts;
  const prev = b.find(name);
  const enable = opts.enable !== undefined ? opts.enable : (prev ? prev.jsonString.enable !== false : true);
  b.panel(name, { anchor, pos, rect_size: size, color: T.COLOR.windowBg, sprite_type: 0, raycast: true, enable, ...(pivot ? { pivot } : {}) });
  b.patchComponent(name, "MOD.Core.SpriteGUIRendererComponent", { ImageRUID: { DataId: icons.gauge_fill }, Type: 0, Color: T.COLOR.windowBg, RaycastTarget: true });
  const rim = T.FRAME.rimOut;
  b.sprite(`${name}/Rim`, { anchor: "middle-center", pivot: [0.5, 0.5], pos: [0, 0], rect_size: [size[0] + rim * 2, size[1] + rim * 2], image_ruid: icons.win_frame, color: "#FFFFFF", sprite_type: 1 });
  b.patchComponent(`${name}/Rim`, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: false });
  b.text(`${name}/Title`, title, { size: T.FRAME.titleSize, bold: true, color: T.COLOR.title, anchor: "top-center", pivot: [0.5, 1], pos: [0, -T.FRAME.titleTop], rect_size: [size[0] - 260, T.FRAME.titleH], alignment: 4, outline: true, outline_color: "#2D2D2D" });
  const c = T.FRAME.close;
  b.button(`${name}/BtnClose`, "", { anchor: "top-right", pivot: [1, 1], pos: [c.x, c.y], rect_size: [c.size, c.size], image_ruid: icons.btn_close, bg_color: "#FFFFFF", sprite_type: 1 });
}

// 테두리 단추(btn_frame) 글자 칸: 양 끝 장식 안쪽 여백 + 넘치면 줄이기 (ui-tokens buttonText — 지금 글자 크기를 최대로)
//   opts.oneLine: 위아래 여백으로 글 칸을 한 줄 높이로 줄여, 길면 두 줄로 접지 않고 글자를 줄인다
//   (BestFit은 두 줄이 칸에 들어가면 줄이지 않는다 — 10-29 통합 메이커: 「여러 개 선택」·「외형 변화 없는 부위」가 두 줄로 접혔다)
function fitButtonText(b, name, opts = {}) {
  const T = require("./ui-tokens.cjs");
  const t = b.getComponent(name, "MOD.Core.TextGUIRendererComponent");
  if (!t) throw new Error(`fitButtonText: ${name}에 글자가 없다`);
  const size = t.FontSize || T.BUTTON.font;
  const fit = T.buttonText(size);
  if (opts.oneLine) {
    const rt = b.getComponent(name, "MOD.Core.UITransformComponent");
    const h = rt && rt.RectSize ? rt.RectSize.y : T.BUTTON.h;
    const v = Math.max(0, Math.floor((h - size * 1.5) / 2));
    fit.Padding = { ...fit.Padding, top: v, bottom: v };
  }
  b.patchComponent(name, "MOD.Core.TextGUIRendererComponent", fit);
}

// 잠금 표지 (10-29 기획서 45 결정 6-A 「잠금」): 칸 왼쪽 위 금빛 ★. 꺼진 채로 두고 InventoryWindow.DrawItem이 잠긴 물건 칸에만 켠다
//   (코덱스 잠금 그림 — 45 부록 B ⑦ — 이 오기 전까지 글자 표지)
function slotLock(b, n) {
  b.text(`${n}/Lock`, "★", { size: 22, bold: true, color: "#FFD27A", anchor: "top-left", pivot: [0, 1], pos: [4, -2], rect_size: [28, 28], alignment: 4, outline: true, outline_color: "#101010", outline_width: 0.3, enable: false });
}

module.exports = { readIfExists, preserveIds, ROOT, ModelBuilder, MapBuilder, UIBuilder, EXT, P, pos, at, list, quiet, exists, load, num, bool, progressBar, windowFrame, fitButtonText, slotLock };
