// 기존 HUD의 UUID를 보존하면서 터치 크기와 실제 통로 표시를 보강한다.
'use strict';
const {UIBuilder,P,load,quiet}=require('./lib.cjs');
const {dialogLayout}=require('./ui-tokens.cjs');
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
 // 10-12 스토리 개편 (docs/design/18 §3-3): 낮은 창 · 왼쪽 NPC 초상 · 글 칸 · 쪽 표시 · 수락 쪽 의뢰 그림. 하단 메뉴를 가리지 않게 위로
 // 대화 상자 공통 규격 (tools/build/ui-tokens.cjs — 이야기 카드와 같은 값)
 { const {FRAME,DIALOG,BUTTON}=require('./ui-tokens.cjs'); const H=DIALOG.npcHeight, L=dialogLayout(H,true), paperH=DIALOG.npcPaperH;
 b.patch('NpcWin',{pos:[0,200],rect_size:[DIALOG.width,H]});b.patch('NpcWin/Rim',{rect_size:[DIALOG.width+FRAME.rimOut*2,H+FRAME.rimOut*2]});
 b.panel('NpcWin/PortraitBox',{anchor:'top-left',pos:[L.portraitX,-FRAME.contentTop],rect_size:[DIALOG.portrait.w,L.paperH],image_ruid:K.win_content,color:'#000000',alpha:0.35,sprite_type:1});
 b.sprite('NpcWin/PortraitBox/Portrait',{...require('./ui-tokens.cjs').portraitSprite(L.paperH),enable:false});
 b.patchComponent('NpcWin/PortraitBox/Portrait','MOD.Core.SpriteGUIRendererComponent',{PreserveSprite:0});
 b.patch('NpcWin/Paper',{anchor:'top-left',pivot:[0,1],pos:[L.paperX,-FRAME.contentTop],rect_size:[L.paperW,paperH]});
 b.patch('NpcWin/Paper/Body',{rect_size:[L.paperW-DIALOG.textPad.x*2,paperH-DIALOG.textPad.y*2-DIALOG.pageNo.h+DIALOG.pageNo.bottom],pos:[DIALOG.textPad.x,-DIALOG.textPad.y]});
 b.patchComponent('NpcWin/Paper/Body','MOD.Core.TextGUIRendererComponent',{FontSize:DIALOG.font.pc,BestFit:true,MinSize:DIALOG.font.min,MaxSize:DIALOG.font.pc}); // 대장장이·상점 안내처럼 긴 글은 줄여서 칸 안에 (모바일 크기는 UIKit.ApplyDialogFont)
 b.text('NpcWin/Paper/PageNo','',{anchor:'bottom-right',pos:[-DIALOG.pageNo.right,DIALOG.pageNo.bottom],rect_size:[DIALOG.pageNo.w,DIALOG.pageNo.h],size:DIALOG.pageNo.size,color:'#9C9488',alignment:8});
 b.sprite('NpcWin/Art',{anchor:'top-right',pos:[-FRAME.padX,-FRAME.contentTop],rect_size:[170,170],color:'#FFFFFF',sprite_type:0,enable:false});
 for(let i=1;i<=5;i++)b.patch('NpcWin/Btn'+i,{rect_size:[DIALOG.npcButtonW,BUTTON.h],pos:[-FRAME.padX-(5-i)*(DIALOG.npcButtonW+FRAME.gap),FRAME.buttonBottom]}); }
 // 맵 한 줄 소개 (maps.csv flavor): 이름·부제 아래 (HudMap.OnMapChanged)
 if(b.find('Banner/Flavor'))b.remove('Banner/Flavor');
 b.panel('Banner/FlavorBg',{anchor:'middle-center',pos:[0,-70],rect_size:[820,36],color:'#000000',alpha:0.6,enable:true}); // 배너 틀 아래 바닥 위라 검은 띠를 깐다
 b.text('Banner/FlavorBg/Text','',{anchor:'middle-center',pos:[0,0],rect_size:[800,32],size:20,color:'#D8CFBF',alignment:4});
 b.patchComponent('QuestTrack/Body','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('Tip',{rect_size:[900,74],pos:[0,-130]});b.patch('Tip/Text',{rect_size:[860,66]});b.patchComponent('Tip/Text','MOD.Core.TextGUIRendererComponent',{FontSize:26,BestFit:true,MinSize:20,MaxSize:26});
 // 위쪽 가운데 한 칸 (docs/ui/message-rules.md): 맵 배너를 대상 체력바 바로 아래 맨 위로 — 여정 안내는 배너가 끝난 뒤 같은 자리에
 b.patch('Banner',{pos:[0,-160],rect_size:[820,148]}); // 1000폭이면 오른쪽 끝이 「메뉴」 버튼에 겹친다
 b.patch('Banner/Title',{pos:[0,-7],rect_size:[620,44]});b.patch('Banner/Sub',{pos:[0,-20],rect_size:[620,28]});
 for(const e of b.listEntities())if(e.name==='BtnClose'){b.patch(e.path,{rect_size:[88,88]});}
 // 소지품: 30칸 모두 88px 이상. 선택 설명은 읽을 수 있는 크기로 분리.
 b.patch('InvWin',{anchor:'middle-center',pivot:[0.5,0.5],pos:[0,0],rect_size:[1280,960]});b.patch('InvWin/Rim',{rect_size:[1320,1000]});
 b.patch('InvWin/Doll',{pos:[24,-76],rect_size:[604,296]});
 const eq={helm:[250,-8],armor:[250,-106],boots:[250,-204],weapon:[26,-106],offhand:[474,-106],gloves:[138,-106],belt:[362,-106],amulet:[362,-8],ring1:[138,-204],ring2:[362,-204]};
 for(const [slot,pos] of Object.entries(eq)){const n='InvWin/Doll/Eq_'+slot;b.patch(n,{pos,rect_size:[88,88]});b.patch(n+'/Rim',{rect_size:[88,88]});}
 b.patch('InvWin/Bag',{pos:[24,-380],rect_size:[604,504]});
 for(let i=1;i<=30;i++){const n='InvWin/Bag/Bag'+i;const col=(i-1)%6,row=Math.floor((i-1)/6);b.patch(n,{pos:[12+col*98,-12-row*98],rect_size:[88,88]});b.patch(n+'/Rim',{rect_size:[88,88]});b.patch(n+'/Icon',{rect_size:[60,60]});}
 b.patch('InvWin/DescBox',{pos:[-24,-84],rect_size:[604,716]});b.patch('InvWin/DescBox/Desc',{rect_size:[564,676]});b.patchComponent('InvWin/DescBox/Desc','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('InvWin/Gold',{pos:[32,-888],rect_size:[600,48]});b.patchComponent('InvWin/Gold','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 b.patch('InvWin/BtnEquip',{pos:[-316,28],rect_size:[268,88]});b.patch('InvWin/BtnSell',{pos:[-32,28],rect_size:[268,88]});b.patch('InvWin/Hint',{pos:[-32,126],rect_size:[556,58]});b.patchComponent('InvWin/Hint','MOD.Core.TextGUIRendererComponent',{FontSize:23,HorizontalAlignment:2,Text:'룬 선택 후 장비 칸: 소켓\n장비 칸 누르기: 장착 해제'});
 b.patch('SkillWin',{rect_size:[1020,960],pos:[0,0]});b.patch('SkillWin/Rim',{rect_size:[1060,1000]});
 // 스킬 창 안쪽 배치는 ui.cjs (10-11 메인 스킬 카드 + 강화 패널, docs/design/16). 여기서는 창 크기만
 // 다른 창의 작은 상호작용 영역도 서로 겹치지 않게 확장.
 b.patch('QuestWin',{rect_size:[800,960],pos:[0,0]});b.patch('QuestWin/Rim',{rect_size:[840,1000]});
 for(let i=1;i<=6;i++)b.patch('QuestWin/Q'+i,{pos:[40,-88-(i-1)*100],rect_size:[720,88]});
 b.patch('QuestWin/DescBox',{pos:[30,26],rect_size:[740,228]});b.patch('QuestWin/DescBox/Desc',{rect_size:[708,196]});b.patchComponent('QuestWin/DescBox/Desc','MOD.Core.TextGUIRendererComponent',{FontSize:24});
 for(let i=1;i<=5;i++)b.patch('SkillPick/Tab'+i,{rect_size:[152,88]});b.patch('SkillPick/BtnClear',{rect_size:[190,88]});
 // 능력치 창 배치는 ui.cjs (10-27 개편 docs/design/37 §3 — 1140×720 두 칸을 거기서 바로 만든다)
 for(const win of ['MenuWin','SkillWin','InvWin','QuestWin','CharWin'])b.patchComponent(win,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:.05,g:.045,b:.06,a:1}});
 b.patch('GatePrompt',{anchor:'top-center',pivot:[.5,1],pos:[0,-220],rect_size:[760,60]});
 b.write(P.ui('GameHUD'));
 const s=UIBuilder.load(P.ui('ShadowHUD'));s.patch('MobilePad/Attack/Icon',{rect_size:[126,126]});s.patchComponent('MobilePad/Attack/Icon','MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:K.eq_weapon},Color:{r:1,g:1,b:1,a:1},Type:0});s.patch('MobilePad/BtnSkillEdit',{rect_size:[220,88]});s.patchComponent('MobilePad/BtnSkillEdit','MOD.Core.TextGUIRendererComponent',{FontSize:26});s.write(P.ui('ShadowHUD'),{strict:false}); // ui.cjs와 같은 L013 오탐(물약 수 글자)
 });console.log('미니맵 지형·30칸 터치 크기·스킬 스크롤 개선');}
if(require.main===module)run();module.exports={run};
