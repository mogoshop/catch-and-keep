'use strict';
const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
// 메이커 재저장 상태에도 필요한 배치와 이미지 필드만 바꾼다.
function applyResources(b){
 const m='SafeArea/MiniMap',a=m+'/Body/Area';
 for(const key of ['minimap_round','minimap_me','minimap_exit'])if(!icons[key])throw new Error(key+' 업로드 RUID가 없습니다');
 const image=(entity,ruid)=>b.patchComponent(entity,'MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:ruid},Type:0,RaycastTarget:false});
 b.patch(m,{rect_size:[344,488]});
 b.patch(m+'/Body',{rect_size:[344,384]});
 b.patch(a,{rect_size:[264,264]});
 // 바닥은 테두리 안쪽 투명 반경(약 111px) 원으로 잘라 확대해도 테두리 밖으로 넘치지 않게 한다
 b.patch(a+'/Terrain',{rect_size:[264,264]});
 b.patch(m+'/Body/Rim',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[264,264]});
 image(m+'/Body/Rim',icons.minimap_round);
 b.patch(a+'/Me',{rect_size:[22,22]});image(a+'/Me',icons.minimap_me);
 // 로컬 파일에 범례 자식이 없을 때도 화면 설명을 복원한다.
 for(const [i,color,label] of [[0,'#FF5A4A','출구'],[1,'#FFD23F','의뢰'],[2,'#6FB4FF','웨이포인트'],[3,'#E8E1D3','NPC']]){
  const n=m+'/Body/Legend'+i;
  if(!b.find(n+'/Icon'))b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[0,0],rect_size:[14,14],image_ruid:icons.dot,color,sprite_type:0});
  if(!b.find(n+'/Text'))b.text(n+'/Text',label,{anchor:'middle-left',pivot:[0,.5],pos:[18,0],rect_size:[58,40],size:19,color:'#D8CFBC',alignment:3});
 }
 image(m+'/Body/Legend0/Icon',icons.minimap_exit);
 b.patch(m+'/Body/Legend0/Icon',{rect_size:[18,18]});
 b.patch(m+'/Body/FocusText',{pos:[18,-286],rect_size:[308,44]});
 b.patch('SafeArea/QuestTrack',{pos:[-24,-658]});
 // 원형 테두리는 지형 아래, 내 위치·출구·이름은 지형 위에 둔다.
 const parent='/ui/NavigationHUD/'+m+'/Body/';
 const kids=b.listEntities().filter(e=>e.path.startsWith(parent)&&!e.path.slice(parent.length).includes('/'));
 kids.sort((x,y)=>x.name==='Rim'?-1:y.name==='Rim'?1:0).forEach((e,i)=>b.patch(e.path,{display_order:i}));
}
function run(){
 const file=path.join(root,'ui/NavigationHUD.ui');
 const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('NavigationHUD',5,true);
 b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
 const m='SafeArea/MiniMap';
 b.empty(m,{anchor:'top-right',pivot:[1,1],pos:[-24,-150],rect_size:[344,488]});
 b.button(m+'/Toggle','',{anchor:'top-center',pivot:[.5,1],pos:[0,0],rect_size:[344,104],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 // 왼쪽 해골 장식(약 40px) 안쪽으로 — 글자가 장식에 붙어 보였다
 b.text(m+'/Toggle/Name','',{anchor:'top-left',pos:[50,-14],rect_size:[206,42],size:28,color:'#E6DCC6',alignment:3,bestfit:true,min_size:22,max_size:28});
 b.text(m+'/Toggle/Kind','',{anchor:'bottom-left',pos:[50,12],rect_size:[206,34],size:22,color:'#B9B0A1',alignment:3});
 b.text(m+'/Toggle/Hint','−',{anchor:'middle-right',pos:[-44,0],rect_size:[40,60],size:32,color:'#E6C88A',alignment:4});
 // 와우·이모탈처럼: 어두운 바탕 위 평평한 바닥색, 표시물은 그림 대신 색 점 + 아래 짧은 이름, 나는 바라보는 방향 화살표
 b.panel(m+'/Body',{anchor:'top-center',pivot:[.5,1],pos:[0,-104],rect_size:[344,384],image_ruid:icons.win_content,sprite_type:0,color:'#0D0A10'});
 b.sprite(m+'/Body/Rim',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[264,264],image_ruid:icons.minimap_round,color:'#FFFFFF',sprite_type:0});
 b.empty(m+'/Body/Area',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[264,264]});
 const a=m+'/Body/Area';
 // 메이커의 원형 MaskComponent는 자식을 자르지 못했다(투명이면 전부 가림). 그래서 HudMap이 바닥 사각형을 264 사각형 안으로 자르고,
 // 원 밖 모서리는 지형 위에 덮는 테두리 그림(Area/Frame)이 가린다. 바닥 사각형은 Terrain/Pan 아래
 if(b.getComponent(a+'/Terrain','MOD.Core.MaskComponent'))b.remove(a+'/Terrain');
 b.empty(a+'/Terrain',{rect_size:[264,264]});
 b.empty(a+'/Terrain/Pan',{rect_size:[264,264]});
 b.sprite(a+'/Frame',{rect_size:[264,264],image_ruid:icons.minimap_round,color:'#FFFFFF',sprite_type:0});
 b.patchComponent(a+'/Frame','MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:false});
 for(let i=1;i<=256;i++)b.sprite(a+'/Terrain/Pan/R'+i,{rect_size:[1,1],image_ruid:icons.map_floor,color:'#FFFFFF',sprite_type:0,enable:false});
 // 다시 만든 자식의 순번이 이전 개수에서 이어지면(256~) 메이커가 자식을 싣지 않았다 → 0부터 다시 매긴다
 b.patch(a+'/Terrain/Pan',{display_order:0});
 for(let i=1;i<=256;i++)b.patch(a+'/Terrain/Pan/R'+i,{display_order:i-1});
 for(let i=1;i<=12;i++){
  b.sprite(a+'/F'+i,{rect_size:[16,16],image_ruid:icons.dot,color:'#FFFFFF',sprite_type:0,enable:false});
  b.text(a+'/F'+i+'/Label','',{anchor:'middle-center',pos:[0,-17],rect_size:[150,22],size:15,bold:true,color:'#E8E1D3',outline:true,outline_color:'#0A0808',outline_width:0.25});
 }
 b.sprite(a+'/Focus',{rect_size:[42,42],image_ruid:icons.slot_frame,color:'#E6C88A',sprite_type:0,enable:false});
 for(let i=1;i<=3;i++)b.sprite(a+'/P'+i,{rect_size:[14,14],image_ruid:icons.dot,color:'#71A6FF',sprite_type:0,enable:false});
 // 내 위치: 위를 향한 정사각형 화살표. HudMap이 이동 방향으로 돌린다.
 b.sprite(a+'/Me',{rect_size:[22,22],image_ruid:icons.minimap_me,color:'#73F59B',sprite_type:0});
 // 확대 · 축소 (원 바깥 위 두 모서리 — 원형 지도라 모서리가 비어 있다)
 for(const [n,label,x] of [['ZoomOut','−',8],['ZoomIn','+',264]]){
  b.button(m+'/Body/'+n,'',{anchor:'top-left',pivot:[0,1],pos:[x,-6],rect_size:[72,72],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
  b.text(m+'/Body/'+n+'/Text',label,{anchor:'middle-center',rect_size:[72,72],size:40,bold:true,color:'#E6C88A',alignment:4});
 }
 b.text(m+'/Body/FocusText','',{anchor:'top-left',pos:[18,-286],rect_size:[308,44],size:24,color:'#E6C88A',alignment:3,bestfit:true,min_size:24,max_size:24});
 // 범례: 미니맵과 같은 색 점
 for(let i=0;i<=3;i++)if(b.find(m+'/Body/Legend'+i))b.remove(m+'/Body/Legend'+i);
 // 웨이포인트(디아2 이름 그대로)는 글자가 길어 칸을 넓힌다
 for(const [i,color,label,x,w] of [[0,'#FF5A4A','출구',18,64],[1,'#FFD23F','의뢰',82,64],[2,'#6FB4FF','웨이포인트',146,118],[3,'#E8E1D3','NPC',266,64]]){
  const n=m+'/Body/Legend'+i;
  b.empty(n,{anchor:'bottom-left',pivot:[0,0],pos:[x,22],rect_size:[w,40]});
  b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[0,0],rect_size:[14,14],image_ruid:icons.dot,color,sprite_type:0});
  b.text(n+'/Text',label,{anchor:'middle-left',pivot:[0,.5],pos:[18,0],rect_size:[w-18,40],size:19,color:'#D8CFBC',alignment:3});
 }
 // 순서: 지형(Terrain) → 테두리(Frame) → 표식·내 위치
 {const pre='/ui/NavigationHUD/'+a+'/';const rank=n=>n==='Terrain'?0:n==='Frame'?1:2;const kids=b.listEntities().filter(e=>e.path.startsWith(pre)&&!e.path.slice(pre.length).includes('/'));
  kids.sort((x,y)=>rank(x.name)-rank(y.name)).forEach((e,i)=>b.patch(e.path,{display_order:i}));}
 // 테두리(Rim)를 맨 아래로: 나중에 만든 범례가 테두리 그림에 덮여 보이지 않았다
 {const kids=b.listEntities().filter(e=>e.path.startsWith('/ui/NavigationHUD/'+m+'/Body/')&&e.path.split('/').length===('/ui/NavigationHUD/'+m+'/Body/x').split('/').length);
  kids.sort((x,y)=>x.name==='Rim'?-1:y.name==='Rim'?1:0).forEach((e,i)=>b.patch(e.path,{display_order:i}));}
 // 의뢰 추적: 그림 없이 글자만 — 뱃지(의뢰 n/6) → 제목 → 지역(캡션) → 완료 조건·진행
 const q='SafeArea/QuestTrack';
 b.button(q,'',{anchor:'top-right',pivot:[1,1],pos:[-24,-658],rect_size:[420,176],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 if(b.find(q+'/Icon'))b.remove(q+'/Icon');
 // 해골 장식 안쪽 여백 46px, 위아래 18px
 b.panel(q+'/Badge',{anchor:'top-left',pos:[46,-18],rect_size:[132,34],color:'#3A2C1A'});
 b.text(q+'/Badge/Text','',{anchor:'middle-center',rect_size:[128,32],size:20,bold:true,color:'#E6C88A'});
 b.text(q+'/Title','',{anchor:'top-left',pos:[46,-56],rect_size:[328,40],size:28,bold:true,color:'#F3E7CC',alignment:3,bestfit:true,min_size:22,max_size:28});
 b.text(q+'/Body','',{anchor:'top-left',pos:[46,-96],rect_size:[328,30],size:21,color:'#A99F8E',alignment:3,bestfit:true,min_size:18,max_size:21});
 b.text(q+'/Progress','',{anchor:'bottom-left',pos:[46,18],rect_size:[328,34],size:23,color:'#E6C88A',alignment:3,bestfit:true,min_size:19,max_size:23});
 applyResources(b);
 b.write(file,{lint_verbose:true});
 return b.listEntities().length;
}
if(require.main===module)console.log('Navigation HUD entities: '+run());
module.exports={run,applyResources};
