// replicate tools/dps/maker-blocks.cjs blocks()/scene() against an arbitrary canonical file (offline proof only)
const fs = require('fs');
const [file, level, build, sceneName] = process.argv.slice(2);
const out = {}; let cur = null;
for (const line of fs.readFileSync(file, 'utf8').split('\n')) { const m = /^-- =+ \[(S\d\d)\]/.exec(line); if (m) { cur = m[1]; out[cur] = []; } if (cur) out[cur].push(line); }
for (const k of Object.keys(out)) out[k] = out[k].join('\n').trimEnd() + '\n';
const q = "'";
const cfg = 'local CFG = { level = ' + Number(level) + ', build = ' + q + build + q + ', scene = ' + q + sceneName + q + ', rep = 1, input = ' + q + 'auto' + q + ', capture_origin = ' + q + 'SET_UNIQUE_CAPTURE_ORIGIN' + q + ' }';
const lines = out.S10.split('\n'); const i = lines.findIndex((l) => l.startsWith('local CFG = ')); lines[i] = cfg + '   -- maker-blocks.cjs가 채움';
process.stdout.write(lines.join('\n'));
