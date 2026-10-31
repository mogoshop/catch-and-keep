import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJSON,assertSanitized,filesUnder} from './lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);const opts={};for(let i=0;i<argv.length;i+=2)opts[argv[i].replace(/^--/,'')]=argv[i+1];
if(!opts.atlas||!opts.maps||!opts.policies)throw new Error('Usage: npm run import -- --atlas <atlas folder> --maps <map package> --policies <policy package>');
function clean(v){
 if(Array.isArray(v))return v.map(clean);
 if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clean(x)]));
 if(typeof v==='string'){
  if(v.startsWith('/Users/')||v.startsWith('/private/')){
   const n=v.normalize('NFC');const marker='잡으면 내편/';
   if(n.includes(marker))return n.split(marker).slice(1).join(marker);
   return 'local-evidence/'+path.basename(v);
  }
 }
 return v;
}
await mkdir(path.join(root,'content'),{recursive:true});
const atlas=clean(await readJSON(path.join(opts.atlas,'catalog.json')));assertSanitized(atlas);
const manifest=clean(await readJSON(path.join(opts.atlas,'media-manifest.json')));assertSanitized(manifest);
await mkdir(path.join(root,'content/assets'),{recursive:true});
await cp(path.join(opts.atlas,'media'),path.join(root,'content/assets/media'),{recursive:true});
await writeFile(path.join(root,'content/assets/catalog.json'),JSON.stringify(atlas));
await writeFile(path.join(root,'content/assets/media-manifest.json'),JSON.stringify(manifest));
for(const name of ['maps','policies']){
 const dir=path.join(root,'content',name);await mkdir(dir,{recursive:true});
 const data=clean(await readJSON(path.join(opts[name],name+'.json')));assertSanitized(data,name);
 await writeFile(path.join(dir,name+'.json'),JSON.stringify(data));
 if(name==='maps')await cp(path.join(opts.maps,'media'),path.join(dir,'media'),{recursive:true});
}
console.log('Imported private snapshots. content/ is excluded from Git. Run npm run build.');
