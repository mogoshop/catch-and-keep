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
 // 왼쪽 해골 장식(약 40px) 안쪽에 그림 84칸(가운데 기준 — 몬스터 초상은 몸 비율대로 칸을 다시 잡는다, UXFeedback), 글은 그림 오른쪽
 // 10-13 지적: 그림자 획득 알림의 몬스터가 너무 작다 (68칸 + 여백 많은 프레임 썸네일) → 84칸 + 몸만 자른 초상
 if(b.find('Toast/Icon'))b.patch('Toast/Icon',{anchor:'middle-left',pivot:[.5,.5],pos:[90,0],rect_size:[84,84]});
 else b.sprite('Toast/Icon',{anchor:'middle-left',pivot:[.5,.5],pos:[90,0],rect_size:[84,84],color:'#FFFFFF',sprite_type:0,enable:false});
 if(b.find('Toast/Title'))b.patch('Toast/Title',{anchor:'top-left',pos:[140,-20],rect_size:[470,34]});
 else b.text('Toast/Title','',{anchor:'top-left',pos:[140,-20],rect_size:[470,34],size:27,bold:true,color:'#E6C88A',alignment:3});
 if(b.find('Toast/Body'))b.patch('Toast/Body',{anchor:'top-left',pos:[140,-56],rect_size:[470,58]});
 else b.text('Toast/Body','',{anchor:'top-left',pos:[140,-56],rect_size:[470,58],size:22,color:'#DDD4C3',alignment:3});
 b.patchComponent('Toast/Body','MOD.Core.TextGUIRendererComponent',{FontSize:22});
 // 10-10 QA: 상단 가운데 큰 알림이 전투 화면을 가린다 → 왼쪽 가운데 아래로 옮기고 조금 줄인다 (모바일에서도 읽히는 크기)
 b.patch('Toast',{anchor:'middle-left',pivot:[0,.5],pos:[24,150],rect_size:[600,122]});
 b.patch('Toast/Rim',{rect_size:[600,122]});
 b.patch('Toast/Title',{rect_size:[422,34]});
 b.patch('Toast/Body',{rect_size:[422,54]});
 // 10-29 45-1: 레벨 업·스킬·의뢰·그림자 알림은 누르면 그 창 (UXFeedback.OnToastClick). 눌리는 알림일 때만 CanvasGroup BlocksRaycasts·Interactable을 켠다
 //   (빌드 값은 끈 채 — 전리품처럼 잦은 알림이 클릭 이동을 막지 않게). 판 자체가 눌리는 칸이라 판 그림에 RaycastTarget
 b.patchComponent('Toast','MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:true});
 if(!b.hasComponent('Toast','MOD.Core.ButtonComponent'))b.addComponent('Toast','MOD.Core.ButtonComponent',{
  '@type':'MOD.Core.ButtonComponent',Enable:true,Transition:1,KeyCode:0,
  Colors:{NormalColor:{r:1,g:1,b:1,a:1},HighlightedColor:{r:.92,g:.9,b:1,a:1},PressedColor:{r:.78,g:.76,b:.82,a:1},SelectedColor:{r:.92,g:.9,b:1,a:1},DisabledColor:{r:1,g:1,b:1,a:1},ColorMultiplier:1,FadeDuration:.1},
  ImageRUIDs:{HighlightedSprite:null,PressedSprite:null,SelectedSprite:null,DisabledSprite:null},
  IgnoreMapLayerCheck:false,OrderInLayer:0,OverrideSorting:false,SortingLayer:'UI'});
 // 안내 줄(획득·경고 문구): 엔진 화면 메시지(상단 큰 띠) 대신 왼쪽 아래에 짧은 줄로 쌓는다.
 // 10-31 B-4 채널 B 「왼쪽 알림 더미」: 위가 최신 · 최대 3줄 · 채팅 창(chat.cjs 아래 210 + 300) 바로 위 522에서 위로 — 실행 중 NoticeFeed.PlaceHome이 채팅 펼침·파티 목록·큰 알림 판에 맞춰 다시 잡는다
 if(!b.find('Feed'))b.empty('Feed',{anchor:'bottom-left',pivot:[0,0],pos:[24,522],rect_size:[620,150]});
 else b.patch('Feed',{anchor:'bottom-left',pivot:[0,0],pos:[24,522],rect_size:[620,150]});
 for(let i=1;i<=4;i++){
  const y=(i-1)*50;
  const line=`Feed/Line${i}`;
  if(!b.find(line)){
   b.panel(line,{anchor:'bottom-left',pivot:[0,0],pos:[0,y],rect_size:[620,44],color:{r:.03,g:.025,b:.035,a:.72},enable:false});
   b.upsertComponent(line,'MOD.Core.CanvasGroupComponent',{GroupAlpha:1,BlocksRaycasts:false,Interactable:false});
   b.text(`${line}/Text`,'',{anchor:'middle-left',pivot:[0,.5],pos:[16,0],rect_size:[590,40],size:24,bold:true,color:'#EFE6D2',alignment:3});
  } else b.patch(line,{anchor:'bottom-left',pivot:[0,0],pos:[0,y],rect_size:[620,44]});
 }
 // 루트는 화면 전체 그대로 (메이커가 저장할 때 2034×1170으로 여백을 남겨 왼쪽·위 요소가 화면 밖으로 57·45px 밀렸다, 10-13)
 b.patchComponent('/','MOD.Core.UITransformComponent',{RectSize:{x:1920,y:1080},OffsetMin:{x:0,y:0},OffsetMax:{x:0,y:0}});
 b.write(file);
 return b.listEntities().length;
}
if(require.main===module)console.log('보상 알림 엔티티',run());
module.exports={run};
