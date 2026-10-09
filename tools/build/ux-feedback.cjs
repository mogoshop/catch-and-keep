// 独立 보상 알림: 기존 HUD를 다시 생성하지 않고 새 그룹만 작성한다.
'use strict';
const {UIBuilder,P,load}=require('./lib.cjs');
const icons=Object.fromEntries(load('ui_icons').map(r=>[r.key,r.ruid]));
function run(){
 const file=P.ui('RewardHUD');
 const b=require('fs').existsSync(file)?UIBuilder.load(file):new UIBuilder('RewardHUD',20,true);
 // 판·테두리는 메이커에 저장된 그림(코덱스)을 그대로 두고, 없을 때만 만든다
 if(!b.find('Toast')){
  b.panel('Toast',{anchor:'top-center',pos:[0,-130],rect_size:[650,132],color:{r:.045,g:.04,b:.055,a:.98},enable:false});
  b.upsertComponent('Toast','MOD.Core.CanvasGroupComponent',{GroupAlpha:1,BlocksRaycasts:false,Interactable:false});
  b.sprite('Toast/Rim',{anchor:'middle-center',rect_size:[650,132],image_ruid:icons.btn_frame,color:'#FFFFFF',sprite_type:1});
 }
 // 왼쪽 해골 장식(약 40px) 안쪽에 그림, 글은 그림 오른쪽에서 위아래 가운데 (제목 34 + 본문 2줄 56)
 if(b.find('Toast/Icon'))b.patch('Toast/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[48,0],rect_size:[68,68]});
 else b.sprite('Toast/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[48,0],rect_size:[68,68],color:'#FFFFFF',sprite_type:0,enable:false});
 if(b.find('Toast/Title'))b.patch('Toast/Title',{anchor:'top-left',pos:[132,-20],rect_size:[470,34]});
 else b.text('Toast/Title','',{anchor:'top-left',pos:[132,-20],rect_size:[470,34],size:27,bold:true,color:'#E6C88A',alignment:3});
 if(b.find('Toast/Body'))b.patch('Toast/Body',{anchor:'top-left',pos:[132,-56],rect_size:[470,58]});
 else b.text('Toast/Body','',{anchor:'top-left',pos:[132,-56],rect_size:[470,58],size:22,color:'#DDD4C3',alignment:3});
 b.patchComponent('Toast/Body','MOD.Core.TextGUIRendererComponent',{FontSize:22});
 b.write(file);
 return b.listEntities().length;
}
if(require.main===module)console.log('보상 알림 엔티티',run());
module.exports={run};
