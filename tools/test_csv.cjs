'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const parser=path.join(__dirname,'lib/csv.cjs');
const {parse,load}=require(parser);
assert.deepEqual(parse('a,b\r\n"문장, 쉼표","인용 ""말"""\r\n'),[['a','b'],['문장, 쉼표','인용 "말"']]);
assert.deepEqual(parse('a,b\n"첫 줄\n둘째 줄",\n'),[['a','b'],['첫 줄\n둘째 줄','']]);
assert.throws(()=>parse('a,b\n"닫히지 않음,1'),/따옴표/);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'msw-csv-regression-'));
try{
 for(const [name,text,valid] of [
  ['valid','a,b\n"문장, 쉼표",\n',true],
  ['extra','a,b\n쉼표,가,둘\n',false],
  ['missing','a,b\n하나\n',false],
  ['duplicate','a,a\n하나,둘\n',false],
  ['empty','a,\n하나,둘\n',false]
 ]){
  fs.writeFileSync(path.join(dir,name+'.csv'),text);
  const result=spawnSync(process.execPath,['-e','require(process.argv[1]).load(process.argv[2])',parser,name],{env:{...process.env,GAME_DATA_DIR:dir},encoding:'utf8'});
  assert.equal(result.status===0,valid,name+': '+result.stderr);
  if(!valid)assert.match(result.stderr,/열/);
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
const first=load('quests')[0];
assert.equal(first.zone,'피 묻은 황무지');
assert.equal(first.objective,'몬스터 처치 → 혼에서 해골 소환');
assert.match(first.outro,/장착하고, 다시 해골/);
assert.match(first.reward,/minion=20\|2\|,rune:r_as$/);
console.log('[test_csv] 인용·줄바꿈·빈 칸·열 개수·첫 퀘스트 회귀 검사 통과');
