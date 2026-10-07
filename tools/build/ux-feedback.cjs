// 独立 보상 알림: 기존 HUD를 다시 생성하지 않고 새 그룹만 작성한다.
'use strict';
const {UIBuilder,P,load}=require('./lib.cjs');
const icons=Object.fromEntries(load('ui_icons').map(r=>[r.key,r.ruid]));
function run(){
 const file=P.ui('RewardHUD');
 const b=require('fs').existsSync(file)?UIBuilder.load(file):new UIBuilder('RewardHUD',20,true);
 b.panel('Toast',{anchor:'top-center',pos:[0,-130],rect_size:[650,132],color:{r:.045,g:.04,b:.055,a:.98},enable:false});
 b.upsertComponent('Toast','MOD.Core.CanvasGroupComponent',{GroupAlpha:1,BlocksRaycasts:false,Interactable:false});
 b.sprite('Toast/Rim',{anchor:'middle-center',rect_size:[650,132],image_ruid:icons.btn_frame,color:'#FFFFFF',sprite_type:1});
 b.sprite('Toast/Icon',{anchor:'middle-left',pos:[24,0],rect_size:[72,72],color:'#FFFFFF',sprite_type:0,enable:false});
 b.text('Toast/Title','',{anchor:'top-left',pos:[116,-18],rect_size:[506,34],size:28,bold:true,color:'#E6C88A',alignment:3});
 b.text('Toast/Body','',{anchor:'top-left',pos:[116,-58],rect_size:[506,62],size:24,color:'#DDD4C3',alignment:0,bestfit:true,min_size:21,max_size:24});
 b.write(file);
 return b.listEntities().length;
}
if(require.main===module)console.log('보상 알림 엔티티',run());
module.exports={run};
