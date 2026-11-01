#!/usr/bin/env node
// 랭킹 창 오프라인 미리보기 1/3: GameHUD의 RankWin 묶음(+ 화면 HUD 기준 상자 Bottom/Menu · Bottom/Slots · Buffs)을 UIBuilder로 읽어 JSON으로.
//   사용: node dump_ui.cjs <out.json> [git 리비전]   (리비전을 주면 그 커밋의 GameHUD를 임시 파일로 꺼내 읽는다 — 전/후 비교)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '../../../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const [out, rev] = process.argv.slice(2);
const rel = 'ui/GameHUD' + '.' + 'ui';
let file = path.join(root, rel);
if (rev) {
  file = path.join(os.tmpdir(), `rankwin-${rev}-GameHUD.json`);
  fs.writeFileSync(file, execFileSync('git', ['show', `${rev}:${rel}`], { cwd: root, maxBuffer: 1 << 30 }));
}
const quiet = console.log;
console.log = () => {};
let b;
try { b = UIBuilder.read(file); } finally { console.log = quiet; }
const T = 'MOD.Core.UITransformComponent';
const ents = [];
for (const e of b.listEntities()) {
  const p = e.path.replace('/ui/GameHUD/', '');
  if (!(p === 'RankWin' || p.startsWith('RankWin/') || p.startsWith('SkillWin/Choice/C1') || ['Bottom', 'Bottom/Menu', 'Bottom/Slots', 'Buffs'].includes(p))) continue;
  const t = b.getComponent(p, T);
  const sp = b.getComponent(p, 'MOD.Core.SpriteGUIRendererComponent');
  const tx = b.getComponent(p, 'MOD.Core.TextGUIRendererComponent');
  const av = b.getComponent(p, 'MOD.Core.AvatarGUIRendererComponent');
  ents.push({
    path: p, enable: b.find(p).jsonString.enable !== false, order: b.find(p).jsonString.displayOrder || 0,   // 형제 순서 = 그리는 순서 (listEntities는 이름 순)
    anchor: [t.AnchorsMin.x, t.AnchorsMin.y], pivot: [t.Pivot.x, t.Pivot.y], pos: [t.anchoredPosition.x, t.anchoredPosition.y], size: [t.RectSize.x, t.RectSize.y],
    sprite: sp ? { ruid: (sp.ImageRUID && typeof sp.ImageRUID === 'object' ? sp.ImageRUID.DataId : sp.ImageRUID) || '', color: sp.Color, type: sp.Type } : null,
    text: tx ? { text: tx.Text, size: tx.FontSize, color: tx.FontColor, bold: tx.FontStyle === 1, h: tx.HorizontalAlignment, v: tx.VerticalAlignment, pad: tx.Padding, best: tx.BestFit, min: tx.MinSize, max: tx.MaxSize, outline: tx.OutlineWidth > 0 } : null,
    avatar: !!av,
  });
}
fs.writeFileSync(out, JSON.stringify({ rev: rev || 'worktree', entities: ents }, null, 1));
if (rev) fs.unlinkSync(file);
console.log(`[dump_ui] ${rev || 'worktree'} RankWin ${ents.length}개 → ${out}`);
