import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
export const readJSON = async file => JSON.parse(await readFile(file,'utf8'));
export function safeRelative(value) {
  if(typeof value!=='string'||!value||value.includes('\\')||value.startsWith('/')||/^[a-z]+:/i.test(value)||value.split('/').includes('..')) throw new Error(`Unsafe relative path: ${value}`);
  return value;
}
export function assertSanitized(value,label='content') {
  const text=JSON.stringify(value);
  if(/\/Users\/|\/private\/(?:tmp|var)\/|[A-Z]:\\\\Users\\\\|(?:ghp_|github_pat_)[A-Za-z0-9_]{15,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) throw new Error(`Local path or credential in ${label}`);
}
export async function filesUnder(dir) {
  const out=[];
  for(const ent of await readdir(dir,{withFileTypes:true})) {
    if(ent.isSymbolicLink()) throw new Error(`Symlink not allowed: ${dir}/${ent.name}`);
    if(ent.isDirectory()) out.push(...(await filesUnder(path.join(dir,ent.name))).map(x=>ent.name+'/'+x));
    else if(ent.isFile()) out.push(ent.name);
  }
  return out;
}
