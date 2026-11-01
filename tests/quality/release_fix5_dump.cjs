#!/usr/bin/env node
// release_fix5.lua 보조: 빌드된 GameHUD에서 넘김 단추 · 플레이어 창 줄 · 랭킹 칸 부품을 UIBuilder로 읽어 Lua 표(return { ... })로 찍는다.
//   사용: node tests/quality/release_fix5_dump.cjs [git 리비전]  (리비전 = 그 커밋의 GameHUD — 반례 대조용)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const { UIBuilder } = require(path.join(root, '.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const rel = 'ui/GameHUD' + '.' + 'ui';
const rev = process.argv[2];
let file = path.join(root, rel);
if (rev) {
  file = path.join(os.tmpdir(), 'fix5-' + rev + '-GameHUD.json');
  fs.writeFileSync(file, execFileSync('git', ['show', rev + ':' + rel], { cwd: root, maxBuffer: 1 << 30 }));
}
const quiet = console.log;
console.log = function () {};
let b;
try { b = UIBuilder.read(file); } finally { console.log = quiet; }
if (rev) fs.unlinkSync(file);
const WANT = /^(RankWin\/Paper\/ActBar|RankWin\/Paper$|RankWin\/Paper\/List\/R[12](\/|$)|RankWin\/Paper\/Mine|WpWin\/ActBar|SocialWin\/Pager|SocialWin\/R[18](\/|$)|SocialWin$)/;
const lua = (v) => typeof v === 'string' ? JSON.stringify(v) : typeof v === 'boolean' || typeof v === 'number' ? String(v) : 'nil';
const out = ['return {'];
b.listEntities().forEach(function (e) {
  const p = e.path.replace('/ui/GameHUD/', '');
  if (!WANT.test(p)) return;
  const t = b.getComponent(p, 'MOD.Core.UITransformComponent');
  const sp = b.getComponent(p, 'MOD.Core.SpriteGUIRendererComponent');
  const tx = b.getComponent(p, 'MOD.Core.TextGUIRendererComponent');
  const parts = ['enable=' + lua(b.find(p).jsonString.enable !== false), 'order=' + lua(b.find(p).jsonString.displayOrder || 0),
    'ax=' + t.AnchorsMin.x, 'ay=' + t.AnchorsMin.y, 'px=' + t.Pivot.x, 'py=' + t.Pivot.y, 'x=' + t.anchoredPosition.x, 'y=' + t.anchoredPosition.y, 'w=' + t.RectSize.x, 'h=' + t.RectSize.y,
    'button=' + lua(b.hasComponent(p, 'MOD.Core.ButtonComponent')), 'avatar=' + lua(b.hasComponent(p, 'MOD.Core.AvatarGUIRendererComponent'))];
  if (sp) parts.push('ruid=' + lua((sp.ImageRUID && sp.ImageRUID.DataId) || ''), 'stype=' + sp.Type, 'ray=' + lua(sp.RaycastTarget !== false), 'ca=' + (sp.Color ? sp.Color.a : 1), 'cr=' + (sp.Color ? sp.Color.r : 1));
  if (tx) parts.push('text=' + lua(tx.Text || ''), 'fs=' + tx.FontSize, 'best=' + lua(!!tx.BestFit), 'padl=' + (tx.Padding ? tx.Padding.left : 0), 'padr=' + (tx.Padding ? tx.Padding.right : 0), 'padt=' + (tx.Padding ? tx.Padding.top : 0), 'padb=' + (tx.Padding ? tx.Padding.bottom : 0));
  out.push('[' + JSON.stringify(p) + ']={' + parts.join(',') + '},');
});
out.push('}');
process.stdout.write(out.join('\n') + '\n');
