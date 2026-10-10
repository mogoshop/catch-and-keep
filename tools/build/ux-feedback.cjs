// 独立 보상 알림: 기존 HUD를 다시 생성하지 않고 새 그룹만 작성한다.
'use strict';
const {UIBuilder,P,load}=require('./lib.cjs');
const icons=Object.fromEntries(load('ui_icons').map(r=>[r.key,r.ruid]));
function run(){
 const file=P.ui('RewardHUD');
 const b=require('fs').existsSync(file)?UIBuilder.load(file):new UIBuilder('RewardHUD', 25,true);
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
 // 10-10 QA: 상단 가운데 큰 알림이 전투 화면을 가린다 → 왼쪽 가운데 아래로 옮기고 조금 줄인다 (모바일에서도 읽히는 크기)
 b.patch('Toast',{anchor:'middle-left',pivot:[0,.5],pos:[24,150],rect_size:[600,122]});
 b.patch('Toast/Rim',{rect_size:[600,122]});
 b.patch('Toast/Title',{rect_size:[430,34]});
 b.patch('Toast/Body',{rect_size:[430,54]});
 // 안내 줄(획득·경고 문구): 엔진 화면 메시지(상단 큰 띠) 대신 왼쪽 아래에 짧은 줄로 쌓는다. 아래가 최신, 위로 4줄
 if(!b.find('Feed'))b.empty('Feed',{anchor:'middle-left',pivot:[0,0],pos:[24,-170],rect_size:[620,200]});
 else b.patch('Feed',{anchor:'middle-left',pivot:[0,0],pos:[24,-170],rect_size:[620,200]});
 for(let i=1;i<=4;i++){
  const y=(i-1)*50;
  const line=`Feed/Line${i}`;
  if(!b.find(line)){
   b.panel(line,{anchor:'bottom-left',pivot:[0,0],pos:[0,y],rect_size:[620,44],color:{r:.03,g:.025,b:.035,a:.72},enable:false});
   b.upsertComponent(line,'MOD.Core.CanvasGroupComponent',{GroupAlpha:1,BlocksRaycasts:false,Interactable:false});
   b.text(`${line}/Text`,'',{anchor:'middle-left',pivot:[0,.5],pos:[16,0],rect_size:[590,40],size:24,bold:true,color:'#EFE6D2',alignment:3});
  } else b.patch(line,{anchor:'bottom-left',pivot:[0,0],pos:[0,y],rect_size:[620,44]});
 }
 b.write(file);
 return b.listEntities().length;
}
if(require.main===module)console.log('보상 알림 엔티티',run());
module.exports={run};
