// 기존 HUD의 UUID를 보존하면서 터치 크기와 실제 통로 표시를 보강한다.
'use strict';
const {UIBuilder,P,load,quiet}=require('./lib.cjs');
const {dialogLayout,TOPBAND}=require('./ui-tokens.cjs');
const K=Object.fromEntries(load('ui_icons').map(r=>[r.key,r.ruid]));
function run(){quiet(()=>{
 const b=UIBuilder.load(P.ui('GameHUD'));
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
 b.patch('Tip',{rect_size:[900,TOPBAND.tipH],pos:[0,-TOPBAND.slot2]});b.patch('Tip/Text',{rect_size:[860,66]});b.patchComponent('Tip/Text','MOD.Core.TextGUIRendererComponent',{FontSize:26,BestFit:true,MinSize:20,MaxSize:26});
 // 위쪽 가운데 띠 자리 (docs/ui/message-rules.md · 10-29 45 1-26 A): ① 대상 체력 띠 → ② 알림 칸(맵 배너, 끝나면 같은 자리에 여정 안내) → ③ 출구 안내.
 //   칸 사이 SPACE (ui-tokens TOPBAND). 예전에는 여정 안내 위 끝(130)이 저주 줄까지 늘어난 대상 띠(20~134)에 4px 겹쳤다
 b.patch('Banner',{pos:[0,-TOPBAND.slot2],rect_size:[820,148]}); // 1000폭이면 오른쪽 끝이 「메뉴」 버튼에 겹친다
 b.patch('Banner/Title',{pos:[0,-7],rect_size:[620,44]});b.patch('Banner/Sub',{pos:[0,-20],rect_size:[620,28]});
 for(const e of b.listEntities())if(e.name==='BtnClose'){b.patch(e.path,{rect_size:[88,88]});}
 b.patch('SkillWin',{rect_size:[1400,960],pos:[0,0]});b.patch('SkillWin/Rim',{rect_size:[1440,1000]});
 // 스킬 창 안쪽 배치는 ui.cjs (10-28 V3 해금 시간선 + 스킬 공방 — 1400×960). 여기서는 창 크기만
 // 다른 창의 작은 상호작용 영역도 서로 겹치지 않게 확장.
 for(let i=1;i<=5;i++)b.patch('SkillPick/Tab'+i,{rect_size:[152,88]});b.patch('SkillPick/BtnClear',{rect_size:[190,88]});
 // 능력치 창 배치는 ui.cjs (10-27 개편 docs/design/37 §3 — 1140×720 두 칸을 거기서 바로 만든다)
 for(const win of ['MenuWin','SkillWin','CharWin','OfferWin'])b.patchComponent(win,'MOD.Core.SpriteGUIRendererComponent',{Color:{r:.05,g:.045,b:.06,a:1}});
 b.patch('GatePrompt',{anchor:'top-center',pivot:[.5,1],pos:[0,-TOPBAND.slot3],rect_size:[760,60]}); // ③ 출구 안내 (배너가 떠 있는 동안은 숨는다 — HudMap)
 b.write(P.ui('GameHUD'));
 const s=UIBuilder.load(P.ui('ShadowHUD'));s.patch('MobilePad/Attack/Icon',{rect_size:[126,126]});s.patchComponent('MobilePad/Attack/Icon','MOD.Core.SpriteGUIRendererComponent',{ImageRUID:{DataId:K.eq_weapon},Color:{r:1,g:1,b:1,a:1},Type:0});s.patch('MobilePad/BtnSkillEdit',{rect_size:[220,88]});s.patchComponent('MobilePad/BtnSkillEdit','MOD.Core.TextGUIRendererComponent',{FontSize:26});s.write(P.ui('ShadowHUD'),{strict:false}); // ui.cjs와 같은 L013 오탐(물약 수 글자)
 });console.log('위쪽 띠 자리·대화 창·스킬 창 크기');}
if(require.main===module)run();module.exports={run};
