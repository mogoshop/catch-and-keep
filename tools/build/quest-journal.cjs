'use strict';
const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
function run(){
const file=path.join(root,'ui/QuestJournalHUD.ui');
const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('QuestJournalHUD',6,true);
b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
const win='SafeArea/QuestWin';
b.panel(win,{rect_size:[1320,960],color:{r:.05,g:.045,b:.06,a:1},raycast:true,enable:false});
b.sprite(win+'/Rim',{rect_size:[1340,980],image_ruid:icons.win_frame,color:'#FFFFFF',sprite_type:1});
b.text(win+'/Title','의뢰 일지  ·  잿빛 변경',{anchor:'top-left',pos:[110,-22],rect_size:[1014,56],size:36,color:'#E6C88A',alignment:3,bold:true});
b.button(win+'/BtnClose','',{anchor:'top-right',pos:[-20,-14],rect_size:[88,88],image_ruid:icons.btn_close,bg_color:'#FFFFFF'});
b.panel(win+'/List',{anchor:'top-left',pos:[30,-112],rect_size:[450,800],color:'#111018'});
for(let i=1;i<=6;i++){
 const n=win+'/Q'+i;
 b.button(n,'',{anchor:'top-left',pos:[42,-124-(i-1)*120],rect_size:[426,104],bg_color:'#24212B'});
 b.sprite(n+'/Icon',{anchor:'middle-left',pos:[14,0],rect_size:[56,56],image_ruid:icons.icon_quest,color:'#FFFFFF',sprite_type:0});
 b.text(n+'/Title','',{anchor:'top-left',pos:[84,-8],rect_size:[322,44],size:28,color:'#E6DCC6',alignment:3,bestfit:true,min_size:24,max_size:28,overflow:2});
 b.text(n+'/Status','',{anchor:'bottom-left',pos:[84,6],rect_size:[322,44],size:24,color:'#B9B0A1',alignment:3,overflow:2});
}
const d=win+'/Detail';
b.panel(d,{anchor:'top-left',pos:[510,-112],rect_size:[780,800],color:'#111018'});
b.text(d+'/Title','',{anchor:'top-left',pos:[24,-18],rect_size:[732,64],size:34,color:'#E6C88A',alignment:3,bold:true,bestfit:true,min_size:28,max_size:34});
b.text(d+'/Status','',{anchor:'top-left',pos:[24,-90],rect_size:[732,40],size:26,color:'#D8CFBC',alignment:3});
b.sprite(d+'/Progress',{anchor:'top-left',pos:[24,-138],rect_size:[732,8],color:'#8A7651',sprite_type:3,fill_method:0});
b.text(d+'/Zone','',{anchor:'top-left',pos:[24,-164],rect_size:[732,40],size:26,color:'#C7B08A',alignment:3});
b.text(d+'/Objective','',{anchor:'top-left',pos:[24,-214],rect_size:[732,72],size:30,color:'#EEE5D4',alignment:0,bestfit:true,min_size:26,max_size:30});
b.text(d+'/Desc','',{anchor:'top-left',pos:[24,-300],rect_size:[732,100],size:26,color:'#D8CFBC',alignment:0,bestfit:true,min_size:24,max_size:26,overflow:2});
b.text(d+'/RewardTitle','',{anchor:'top-left',pos:[24,-406],rect_size:[732,44],size:26,color:'#E6C88A',alignment:3,bold:true});
for(let i=1;i<=6;i++){
 const n=d+'/Reward'+i;
 b.panel(n,{anchor:'top-left',pos:[24+((i-1)%2)*370,-462-Math.floor((i-1)/2)*108],rect_size:[354,100],color:'#26212A',enable:false});
 b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,0.5],pos:[12,0],rect_size:[58,58],color:'#FFFFFF',sprite_type:0,enable:false});
 b.text(n+'/Name','',{anchor:'top-left',pos:[80,-6],rect_size:[262,44],size:26,color:'#ECE1CB',alignment:3,bestfit:true,min_size:24,max_size:26,overflow:2});
 b.text(n+'/Value','',{anchor:'bottom-left',pos:[80,4],rect_size:[262,44],size:24,color:'#C9B17E',alignment:3,overflow:2});
}
b.write(file,{lint_verbose:true});
return b.listEntities().length;
}
if(require.main===module)console.log('Quest journal entities: '+run());
module.exports={run};
