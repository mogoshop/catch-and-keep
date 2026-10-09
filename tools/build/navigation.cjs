'use strict';
const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
function run(){
 const file=path.join(root,'ui/NavigationHUD.ui');
 const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('NavigationHUD',5,true);
 b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
 const m='SafeArea/MiniMap';
 b.empty(m,{anchor:'top-right',pivot:[1,1],pos:[-24,-150],rect_size:[344,436]});
 b.button(m+'/Toggle','',{anchor:'top-center',pivot:[.5,1],pos:[0,0],rect_size:[344,104],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 b.text(m+'/Toggle/Name','',{anchor:'top-left',pos:[32,-12],rect_size:[244,44],size:28,color:'#E6DCC6',alignment:3,bestfit:true,min_size:24,max_size:28});
 b.text(m+'/Toggle/Kind','',{anchor:'bottom-left',pos:[32,8],rect_size:[244,40],size:24,color:'#B9B0A1',alignment:3});
 b.text(m+'/Toggle/Hint','−',{anchor:'middle-right',pos:[-24,0],rect_size:[44,60],size:32,color:'#E6C88A',alignment:4});
 // 와우·이모탈처럼: 어두운 바탕 위 평평한 바닥색, 표시물은 그림 대신 색 점 + 아래 짧은 이름, 나는 바라보는 방향 화살표
 b.panel(m+'/Body',{anchor:'top-center',pivot:[.5,1],pos:[0,-104],rect_size:[344,332],image_ruid:icons.win_content,sprite_type:0,color:'#0D0A10'});
 b.sprite(m+'/Body/Rim',{rect_size:[344,332],image_ruid:icons.minimap_frame,color:'#FFFFFF',sprite_type:1});
 b.empty(m+'/Body/Area',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[304,180]});
 const a=m+'/Body/Area';
 b.empty(a+'/Terrain',{rect_size:[304,180]});
 for(let i=1;i<=256;i++){ const e=b.getComponent(a+'/Terrain/R'+i,'MOD.Core.PolygonGUIRendererComponent'); if(e)b.remove(a+'/Terrain/R'+i); }
 for(let i=1;i<=256;i++)b.sprite(a+'/Terrain/R'+i,{rect_size:[1,1],image_ruid:icons.map_floor,color:'#FFFFFF',sprite_type:0,enable:false});
 for(let i=1;i<=12;i++){
  b.sprite(a+'/F'+i,{rect_size:[16,16],image_ruid:icons.dot,color:'#FFFFFF',sprite_type:0,enable:false});
  b.text(a+'/F'+i+'/Label','',{anchor:'middle-center',pos:[0,-17],rect_size:[150,22],size:16,bold:true,color:'#E8E1D3',outline:true,outline_color:'#0A0808',outline_width:0.25});
 }
 b.sprite(a+'/Focus',{rect_size:[42,42],image_ruid:icons.slot_frame,color:'#E6C88A',sprite_type:0,enable:false});
 for(let i=1;i<=3;i++)b.sprite(a+'/P'+i,{rect_size:[14,14],image_ruid:icons.dot,color:'#71A6FF',sprite_type:0,enable:false});
 // 내 위치: 아래를 향한 작은 삼각형 그림(메이플 리소스)을 초록으로 칠해 움직이는 방향으로 돌린다 (UI 도형은 화면에 그려지지 않았다)
 if(b.find(a+'/Me'))b.remove(a+'/Me');
 b.sprite(a+'/Me',{rect_size:[22,16],image_ruid:'fb55e389a5524729b8ede5bbd5d056c2',color:'#73F59B',sprite_type:0});
 b.text(m+'/Body/FocusText','',{anchor:'top-left',pos:[18,-200],rect_size:[308,44],size:24,color:'#E6C88A',alignment:3,bestfit:true,min_size:24,max_size:24});
 // 범례: 미니맵과 같은 색 점
 for(let i=0;i<=3;i++)if(b.find(m+'/Body/Legend'+i))b.remove(m+'/Body/Legend'+i);
 for(const [i,color,label] of [[0,'#FF5A4A','출구'],[1,'#FFD23F','의뢰'],[2,'#6FB4FF','거점'],[3,'#E8E1D3','NPC']]){
  const n=m+'/Body/Legend'+i;
  b.empty(n,{anchor:'bottom-left',pivot:[0,0],pos:[18+i*78,22],rect_size:[78,40]});
  b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[0,0],rect_size:[14,14],image_ruid:icons.dot,color,sprite_type:0});
  b.text(n+'/Text',label,{anchor:'middle-left',pivot:[0,.5],pos:[18,0],rect_size:[58,40],size:19,color:'#D8CFBC',alignment:3});
 }
 // 테두리(Rim)를 맨 아래로: 나중에 만든 범례가 테두리 그림에 덮여 보이지 않았다
 {const kids=b.listEntities().filter(e=>e.path.startsWith('/ui/NavigationHUD/'+m+'/Body/')&&e.path.split('/').length===('/ui/NavigationHUD/'+m+'/Body/x').split('/').length);
  kids.sort((x,y)=>x.name==='Rim'?-1:y.name==='Rim'?1:0).forEach((e,i)=>b.patch(e.path,{display_order:i}));}
 // 의뢰 추적: 그림 없이 글자만 — 뱃지(의뢰 n/6) → 제목 → 지역(캡션) → 완료 조건·진행
 const q='SafeArea/QuestTrack';
 b.button(q,'',{anchor:'top-right',pivot:[1,1],pos:[-24,-606],rect_size:[420,176],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 if(b.find(q+'/Icon'))b.remove(q+'/Icon');
 b.panel(q+'/Badge',{anchor:'top-left',pos:[22,-16],rect_size:[132,34],color:'#3A2C1A'});
 b.text(q+'/Badge/Text','',{anchor:'middle-center',rect_size:[128,32],size:20,bold:true,color:'#E6C88A'});
 b.text(q+'/Title','',{anchor:'top-left',pos:[22,-54],rect_size:[376,40],size:28,bold:true,color:'#F3E7CC',alignment:3,bestfit:true,min_size:22,max_size:28});
 b.text(q+'/Body','',{anchor:'top-left',pos:[22,-94],rect_size:[376,30],size:21,color:'#A99F8E',alignment:3,bestfit:true,min_size:18,max_size:21});
 b.text(q+'/Progress','',{anchor:'bottom-left',pos:[22,14],rect_size:[376,36],size:23,color:'#E6C88A',alignment:3,bestfit:true,min_size:19,max_size:23});
 b.write(file,{lint_verbose:true});
 return b.listEntities().length;
}
if(require.main===module)console.log('Navigation HUD entities: '+run());
module.exports={run};
