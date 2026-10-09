// 기존 HUD의 UUID를 보존하면서 터치 크기와 실제 통로 표시를 보강한다.
'use strict';
const {UIBuilder,P,load,quiet}=require('./lib.cjs');
const K=Object.fromEntries(load('ui_icons').map(r=>[r.key,r.ruid]));
function run(){quiet(()=>{
 const b=UIBuilder.load(P.ui('GameHUD'));
 b.empty('MiniMap/Area/Terrain',{anchor:'middle-center',rect_size:[256,180]});
 for(let i=1;i<=128;i++)b.polygon(`MiniMap/Area/Terrain/R${i}`,{rect_size:[1,1],points:[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]],color:'#59515C',enable:false});
 const children=b.listEntities().filter(e=>e.path.startsWith('/ui/GameHUD/MiniMap/Area/')&&e.depth===3).sort((a,z)=>a.name==='Terrain'?-1:z.name==='Terrain'?1:a.name.localeCompare(z.name));
 children.forEach((e,i)=>b.patch(e.path,{display_order:i}));
 b.text('MiniMap/Legend','<color=#8CCBFF>출구</color> · <color=#FFE54A>의뢰</color> · <color=#50FF50>나</color>',{anchor:'bottom-center',pos:[0,14],rect_size:[270,28],size:21,color:'#D8CFBC'});
 b.patch('MiniMap/Area',{rect_size:[256,180],pos:[0,0]});
 b.patchComponent('MiniMap/Name','MOD.Core.TextGUIRendererComponent',{FontSize:23});
 b.patch('QuestTrack',{rect_size:[460,214]});b.patch('QuestTrack/Title',{rect_size:[342,34]});b.patch('QuestTrack/Body',{rect_size:[342,112],pos:[88,-54]});
 b.text('QuestTrack/Progress','',{anchor:'bottom-right',pos:[-28,16],rect_size:[300,30],size:24,color:'#E6C88A',alignment:8});
 // 의뢰 요약과 보상은 별도 마지막 페이지로 보여서 대사와 겹치지 않는다.
 b.patch('NpcWin',{rect_size:[1100,440]});b.patch('NpcWin/Rim',{rect_size:[1120,460]});
 b.patch('NpcWin/Paper',{rect_size:[1000,248]});b.patch('NpcWin/Paper/Body',{rect_size:[952,220],pos:[24,-14]});
 b.patchComponent('NpcWin/Paper/Body','MOD.Core.TextGUIRendererComponent',{FontSize:26});
 for(let i=1;i<=5;i++)b.patch('NpcWin/Btn'+i,{rect_size:[184,88]});
 b.patchComponent('QuestTrack/Body','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('Tip',{rect_size:[900,74],pos:[0,-130]});b.patch('Tip/Text',{rect_size:[860,66]});b.patchComponent('Tip/Text','MOD.Core.TextGUIRendererComponent',{FontSize:26});
 for(const e of b.listEntities())if(e.name==='BtnClose'){b.patch(e.path,{rect_size:[88,88]});}
 // 소지품: 30칸 모두 88px 이상. 선택 설명은 읽을 수 있는 크기로 분리.
 b.patch('InvWin',{anchor:'middle-center',pivot:[0.5,0.5],pos:[0,0],rect_size:[1280,960]});b.patch('InvWin/Rim',{rect_size:[1300,980]});
 b.patch('InvWin/Doll',{pos:[24,-76],rect_size:[604,296]});
 const eq={helm:[250,-8],armor:[250,-106],boots:[250,-204],weapon:[26,-106],offhand:[474,-106],gloves:[138,-106],belt:[362,-106],amulet:[362,-8],ring1:[138,-204],ring2:[362,-204]};
 for(const [slot,pos] of Object.entries(eq)){const n='InvWin/Doll/Eq_'+slot;b.patch(n,{pos,rect_size:[88,88]});b.patch(n+'/Rim',{rect_size:[88,88]});}
 b.patch('InvWin/Bag',{pos:[24,-380],rect_size:[604,504]});
 for(let i=1;i<=30;i++){const n='InvWin/Bag/Bag'+i;const col=(i-1)%6,row=Math.floor((i-1)/6);b.patch(n,{pos:[12+col*98,-12-row*98],rect_size:[88,88]});b.patch(n+'/Rim',{rect_size:[88,88]});b.patch(n+'/Icon',{rect_size:[60,60]});}
 b.patch('InvWin/DescBox',{pos:[-24,-84],rect_size:[604,716]});b.patch('InvWin/DescBox/Desc',{rect_size:[564,676]});b.patchComponent('InvWin/DescBox/Desc','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('InvWin/Gold',{pos:[32,-888],rect_size:[600,48]});b.patchComponent('InvWin/Gold','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('InvWin/BtnEquip',{pos:[-316,28],rect_size:[268,88]});b.patch('InvWin/BtnSell',{pos:[-32,28],rect_size:[268,88]});b.patch('InvWin/Hint',{pos:[-32,126],rect_size:[556,58]});b.patchComponent('InvWin/Hint','MOD.Core.TextGUIRendererComponent',{FontSize:23,HorizontalAlignment:2,Text:'룬 선택 후 장비 칸: 소켓\n장비 칸 누르기: 장착 해제'});
 b.patch('SkillWin',{rect_size:[1020,960],pos:[0,0]});b.patch('SkillWin/Rim',{rect_size:[1040,980]});
 // 스킬 트리: 큰 아이콘을 가진 세 개의 스크롤 열. 경로는 유지해 클릭 연결을 보존.
 for(let t=1;t<=3;t++){
  const n='SkillWin/Col'+t;if(b.find(n+'/Head'))b.remove(n+'/Head');
  b.text('SkillWin/Head'+t,'',{anchor:'top-left',pos:[38+(t-1)*324,-114],rect_size:[296,34],size:26,bold:true,color:'#E6C88A'});
  // 위·아래 버튼 없이 손가락/휠로 끌어 내린다. 버튼이 있던 자리만큼 목록을 길게.
  b.scrollLayout(n,{anchor:'top-left',pos:[30+(t-1)*324,-154],rect_size:[312,408],layout_type:1,spacing:12,padding:[8,8,8,8],child_alignment:0,use_scroll:true,v_scroll_dir:3,scroll_bar_visible:1,scroll_bar_thickness:10});
  for(let r=1;r<=12;r++){const row=n+'/T'+r;b.patch(row,{rect_size:[284,88]});b.patch(row+'/Icon',{pos:[10,0],rect_size:[56,56]});b.patch(row+'/Label',{pos:[76,0],rect_size:[200,80]});b.patchComponent(row+'/Label','MOD.Core.TextGUIRendererComponent',{FontSize:23});}
 }
 // 설명(왼쪽) + 습득(오른쪽, 가장 큰 버튼). 그 아래 줄: PC 칸 지정 / 모바일 스킬 편집
 b.patch('SkillWin/DescBox',{anchor:'bottom-left',pivot:[0,0],pos:[30,132],rect_size:[706,248]});b.patch('SkillWin/DescBox/Desc',{rect_size:[682,232]});b.patchComponent('SkillWin/DescBox/Desc','MOD.Core.TextGUIRendererComponent',{FontSize:24,BestFit:true,MinSize:21,MaxSize:24,Overflow:2});
 // 다른 창의 작은 상호작용 영역도 서로 겹치지 않게 확장.
 b.patch('QuestWin',{rect_size:[800,960],pos:[0,0]});b.patch('QuestWin/Rim',{rect_size:[820,980]});
 for(let i=1;i<=6;i++)b.patch('QuestWin/Q'+i,{pos:[40,-88-(i-1)*100],rect_size:[720,88]});
 b.patch('QuestWin/DescBox',{pos:[30,26],rect_size:[740,228]});b.patch('QuestWin/DescBox/Desc',{rect_size:[708,196]});b.patchComponent('QuestWin/DescBox/Desc','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 for(let i=1;i<=5;i++)b.patch('SkillPick/Tab'+i,{rect_size:[152,88]});b.patch('SkillPick/BtnClear',{rect_size:[190,88]});
 // 능력치: 넓은 2칸 — 왼쪽 현재 능력치(정보), 오른쪽 힘·민첩·활력·정신 올리기 4줄. 모바일 가로 화면을 넓게 쓴다
 b.patch('CharWin',{anchor:'middle-center',pivot:[.5,.5],pos:[0,0],rect_size:[1140,660]});b.patch('CharWin/Rim',{rect_size:[1160,680]});
 b.patch('CharWin/Paper',{anchor:'top-left',pivot:[0,1],pos:[30,-84],rect_size:[540,500]});
 b.patch('CharWin/Paper/Info',{pos:[18,-14],rect_size:[504,472]});b.patchComponent('CharWin/Paper/Info','MOD.Core.TextGUIRendererComponent',{FontSize:22,BestFit:true,MinSize:18,MaxSize:22});
 for(const [i,stat] of ['Str','Dex','Vit','Ene'].entries()){b.patch('CharWin/'+stat,{anchor:'top-left',pivot:[0,1],pos:[590,-84-i*126],rect_size:[520,116]});b.patch('CharWin/'+stat+'/Text',{rect_size:[410,108]});b.patchComponent('CharWin/'+stat+'/Text','MOD.Core.TextGUIRendererComponent',{FontSize:22,BestFit:true,MinSize:18,MaxSize:22});b.patch('CharWin/'+stat+'/BtnAdd',{rect_size:[96,96]});}
 b.patch('CharWin/Points',{pos:[0,20],rect_size:[700,36]});b.patchComponent('CharWin/Points','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 for(const win of ['MenuWin','SkillWin','InvWin','QuestWin','CharWin'])b.patchComponent(win,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:.05,g:.045,b:.06,a:1}});
 b.patch('GatePrompt',{anchor:'top-center',pivot:[.5,1],pos:[0,-220],rect_size:[760,60]});
 b.write(P.ui('GameHUD'));
 const s=UIBuilder.load(P.ui('ShadowHUD'));s.patch('MobilePad/Attack/Icon',{rect_size:[126,126]});s.patchComponent('MobilePad/Attack/Icon','MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:K.eq_weapon},Color:{r:1,g:1,b:1,a:1},Type:0});s.patch('MobilePad/BtnSkillEdit',{rect_size:[220,88]});s.patchComponent('MobilePad/BtnSkillEdit','MOD.Core.TextGUIRendererComponent',{FontSize:26});s.write(P.ui('ShadowHUD'),{strict:false}); // ui.cjs와 같은 L013 오탐(물약 수 글자)
 });console.log('미니맵 지형·30칸 터치 크기·스킬 스크롤 개선');}
if(require.main===module)run();module.exports={run};
