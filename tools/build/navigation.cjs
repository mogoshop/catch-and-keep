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
 b.panel(m+'/Body',{anchor:'top-center',pivot:[.5,1],pos:[0,-104],rect_size:[344,332],image_ruid:icons.win_content,sprite_type:0,color:'#17131C'});
 b.sprite(m+'/Body/Rim',{rect_size:[344,332],image_ruid:icons.minimap_frame,color:'#FFFFFF',sprite_type:1});
 b.empty(m+'/Body/Area',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[304,180]});
 const a=m+'/Body/Area';
 b.empty(a+'/Terrain',{rect_size:[304,180]});
 for(let i=1;i<=256;i++){ const e=b.getComponent(a+'/Terrain/R'+i,'MOD.Core.PolygonGUIRendererComponent'); if(e)b.remove(a+'/Terrain/R'+i); }
 for(let i=1;i<=256;i++)b.sprite(a+'/Terrain/R'+i,{rect_size:[1,1],image_ruid:icons.map_floor,color:'#FFFFFF',sprite_type:0,enable:false});
 for(let i=1;i<=12;i++)b.sprite(a+'/F'+i,{rect_size:[28,28],image_ruid:icons.icon_portal,color:'#FFFFFF',sprite_type:0,enable:false});
 b.sprite(a+'/Focus',{rect_size:[42,42],image_ruid:icons.slot_frame,color:'#E6C88A',sprite_type:0,enable:false});
 for(let i=1;i<=3;i++)b.sprite(a+'/P'+i,{rect_size:[14,14],image_ruid:icons.dot,color:'#71A6FF',sprite_type:0,enable:false});
 b.sprite(a+'/Me',{rect_size:[16,16],image_ruid:icons.dot,color:'#73F59B',sprite_type:0});
 b.text(m+'/Body/FocusText','',{anchor:'top-left',pos:[18,-200],rect_size:[308,44],size:24,color:'#E6C88A',alignment:3,bestfit:true,min_size:24,max_size:24});
 for(const [i,key,label] of [[0,'icon_scroll','출구'],[1,'icon_quest','의뢰'],[2,'icon_waypoint','거점']]){
  const n=m+'/Body/Legend'+i;
  if(b.getComponent(m+'/Body/LegendText'+i,'MOD.Core.TextGUIRendererComponent'))b.remove(m+'/Body/LegendText'+i);
  if(b.getComponent(n,'MOD.Core.SpriteGUIRendererComponent'))b.remove(n);
  b.empty(n,{anchor:'bottom-left',pivot:[0,0],pos:[22+i*100,24],rect_size:[100,44]});
  b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[0,0],rect_size:[26,26],image_ruid:icons[key],color:'#FFFFFF',sprite_type:0});
  b.text(n+'/Text',label,{anchor:'middle-left',pivot:[0,.5],pos:[30,0],rect_size:[64,44],size:24,color:'#D8CFBC',alignment:3});
 }
 const q='SafeArea/QuestTrack';
 b.button(q,'',{anchor:'top-right',pivot:[1,1],pos:[-24,-606],rect_size:[420,232],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 b.text(q+'/Title','',{anchor:'top-left',pos:[28,-20],rect_size:[364,44],size:28,color:'#E6C88A',alignment:3,bestfit:true,min_size:24,max_size:28});
 b.sprite(q+'/Icon',{anchor:'top-left',pos:[28,-78],rect_size:[52,52],image_ruid:icons.icon_quest,color:'#FFFFFF',sprite_type:0});
 b.text(q+'/Body','',{anchor:'top-left',pos:[92,-76],rect_size:[300,100],size:24,color:'#E8E1D3',alignment:0,bestfit:true,min_size:24,max_size:24});
 b.text(q+'/Progress','',{anchor:'bottom-left',pos:[92,8],rect_size:[300,44],size:24,color:'#C9B17E',alignment:3});
 b.write(file,{lint_verbose:true});
 return b.listEntities().length;
}
if(require.main===module)console.log('Navigation HUD entities: '+run());
module.exports={run};
