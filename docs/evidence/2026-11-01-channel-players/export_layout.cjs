#!/usr/bin/env node
// 빌드된 GameHUD의 플레이어 창(SocialWin) 배치를 창 왼쪽 위 기준 사각형으로 뽑는다 (UIBuilder로 읽기 — .ui를 직접 열지 않는다).
// 사용: node docs/evidence/2026-11-01-channel-players/export_layout.cjs > docs/evidence/2026-11-01-channel-players/layout.json
"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const { UIBuilder } = require(path.join(ROOT, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const ANCHOR = { 0: [0.5, 0.5], 1: [0, 0.5], 2: [1, 0.5], 3: [0.5, 1], 4: [0, 1], 5: [1, 1], 6: [0.5, 0], 7: [0, 0], 8: [1, 0] };
const log = console.log;
console.log = () => {};
const b = UIBuilder.read(path.join(ROOT, "ui", "GameHUD" + "." + "ui"));
console.log = log;
const BASE = "/ui/GameHUD/SocialWin";
const ents = b.build().ContentProto.Entities.filter((e) => e.path === BASE || e.path.startsWith(BASE + "/")).sort((x, y) => x.path.split("/").length - y.path.split("/").length);
const rect = {};
const out = [];
const hex = (c) => c ? "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("") : null;
for (const e of ents) {
  const comps = Object.fromEntries(e.jsonString["@components"].map((c) => [c["@type"].replace("MOD.Core.", ""), c]));
  const t = comps.UITransformComponent;
  const w = t.RectSize.x, h = t.RectSize.y;
  let x = 0, y = 0;
  if (e.path !== BASE) {
    const parent = rect[e.path.slice(0, e.path.lastIndexOf("/"))];
    const a = ANCHOR[t.AlignmentOption] || [0.5, 0.5];
    const px = a[0] * parent.w + t.anchoredPosition.x, py = a[1] * parent.h + t.anchoredPosition.y;   // 부모 왼쪽 아래 기준 (y 위로)
    const left = px - t.Pivot.x * w, bottom = py - t.Pivot.y * h;
    x = parent.x + left;
    y = parent.y + (parent.h - (bottom + h));
  }
  rect[e.path] = { x, y, w, h };
  const text = comps.TextGUIRendererComponent;
  const sprite = comps.SpriteGUIRendererComponent;
  out.push({
    path: e.path.slice("/ui/GameHUD/".length), x, y, w, h, enable: e.jsonString.enable !== false,
    kind: comps.ButtonComponent ? "button" : (text ? "text" : (sprite ? "sprite" : "empty")),
    text: text ? text.Text : null, fontSize: text ? text.FontSize : null, bold: text ? (text.FontStyle === 1 || text.Bold === true) : false,
    hAlign: text ? (text.HorizontalAlignment || 2) : null, fontColor: text ? hex(text.FontColor) : null,
    spriteColor: sprite ? hex(sprite.Color) : null, spriteAlpha: sprite && sprite.Color ? sprite.Color.a : null,
  });
}
process.stdout.write(JSON.stringify({ note: "SocialWin 배치 (창 바탕 왼쪽 위 = 0,0 · y 아래로 · UI px)", items: out }, null, 1) + "\n");
