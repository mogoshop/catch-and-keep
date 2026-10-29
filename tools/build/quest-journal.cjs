'use strict';
const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const {windowFrame}=require(path.join(root,'tools/build/lib.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
// 메이커 기본 화면도 실제 의뢰 그림을 사용한다. 실행 중 색상은 진행도가 결정한다.
function initialArt(i) {
 const key=(i===1?'quest_art':'quest_art_gray')+i;
 if(!icons[key]) throw new Error(key+' 업로드 RUID가 없습니다');
 return icons[key];
}
function applyResources(b) {
 for(let i=1;i<=6;i++) {
  b.patchComponent('SafeArea/QuestWin/Q'+i+'/Art','MOD.Core.SpriteGUIRendererComponent',{
   ImageRUID:{DataId:initialArt(i)}, Type:0,
   Color:{r:1,g:1,b:1,a:1}, RaycastTarget:false
  });
 }
}
function run(){
const file=path.join(root,'ui/QuestJournalHUD.ui');
const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('QuestJournalHUD', 14,true);
b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
const win='SafeArea/QuestWin';
// D2 의뢰 일지: 위 2×3 의뢰 그림(받을 수 있거나 끝낸 의뢰만 컬러, 나머지 어둡게) → 누르면 아래에 내용
// 틀(바탕·테두리·제목·닫기)은 공용 창 틀 (lib.cjs windowFrame · 10-29 기획서 45 결정 2-A) — 몸통 배치는 아래 그대로
windowFrame(b,win,{size:[1320,960],pos:[0,0],title:'퀘스트 일지',enable:false});
if(b.find(win+'/List'))b.remove(win+'/List');
// 액트 넘김 막대 (10-20 사용자 선택: 예전 「액트1|액트2|액트3」 단추 줄은 좁고 액트가 늘면 안 들어갔다) — GameHUD kit.actPager와 같은 모양
for(const a of [1,2,3,4,5,6])if(b.find(win+'/Act'+a))b.remove(win+'/Act'+a);
// 제목 바로 아래 가운데 (10-20 사용자: 왼쪽 칸은 별로) — 의뢰 그림 2×3은 그 아래 가운데
const bar=win+'/ActBar',bw=520;
b.panel(bar,{anchor:'top-center',pivot:[.5,1],pos:[0,-64],rect_size:[bw,72],image_ruid:icons.win_content,color:{r:0,g:0,b:0,a:0.3},sprite_type:1});
b.button(bar+'/Prev','◀',{anchor:'middle-left',pos:[32,0],rect_size:[56,56],font_size:22,color:'#F6E3B0',image_ruid:icons.btn_frame,bg_color:'#FFFFFF',sprite_type:1});
b.button(bar+'/Next','▶',{anchor:'middle-right',pos:[-32,0],rect_size:[56,56],font_size:22,color:'#F6E3B0',image_ruid:icons.btn_frame,bg_color:'#FFFFFF',sprite_type:1});
b.text(bar+'/Title','',{anchor:'middle-center',pos:[0,9],rect_size:[bw-136,34],size:20,bold:true,color:'#F6E3B0',alignment:4,bestfit:true,min_size:15,max_size:20,outline:true,outline_color:'#2D2D2D'});
for(let i=1;i<=6;i++){
 b.sprite(bar+'/D'+i,{anchor:'middle-center',pos:[(i-3.5)*22,-20],rect_size:[12,12],image_ruid:icons.dot,sprite_type:0,color:'#FFFFFF'});
 b.patchComponent(bar+'/D'+i,'MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:false});
}
for(let i=1;i<=6;i++){
 const n=win+'/Q'+i;
 for(const old of ['Icon','Title','Status','Frame'])if(b.find(n+'/'+old))b.remove(n+'/'+old);
 const col=(i-1)%3,row=Math.floor((i-1)/3);
 // 칸 자체가 테두리 그림, 그 위에 의뢰 그림·이름 (덮개 테두리는 그림을 가렸다)
 b.button(n,'',{anchor:'top-center',pivot:[.5,1],pos:[(col-1)*250,-146-row*226],rect_size:[220,216],image_ruid:icons.btn_frame,bg_color:'#FFFFFF'});
 b.sprite(n+'/Art',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[150,150],image_ruid:initialArt(i),color:'#FFFFFF',sprite_type:0});
 // 완료 표시(흑백 그림 위 도장) · 아직 못 읽는 의뢰는 반투명 검정 덮개 (그림 형태는 보인다)
 b.text(n+'/Done','완료',{anchor:'top-right',pivot:[1,1],pos:[-14,-14],rect_size:[84,32],size:20,bold:true,color:'#B9E6A0',outline:true,outline_color:'#101010',outline_width:0.3,enable:false});
 b.panel(n+'/Lock',{anchor:'top-center',pivot:[.5,1],pos:[0,-18],rect_size:[150,150],color:{r:0.02,g:0.02,b:0.03,a:0.72},enable:false});
 b.text(n+'/Name','',{anchor:'bottom-center',pivot:[.5,0],pos:[0,12],rect_size:[196,36],size:21,bold:true,color:'#E6DCC6',bestfit:true,min_size:17,max_size:21,overflow:2});
}
const d=win+'/Detail';
b.panel(d,{anchor:'top-left',pos:[30,-598],rect_size:[1260,340],color:'#111018'});
b.text(d+'/Title','',{anchor:'top-left',pos:[24,-14],rect_size:[720,46],size:30,color:'#E6C88A',alignment:3,bold:true,bestfit:true,min_size:24,max_size:30});
b.text(d+'/Status','',{anchor:'top-right',pivot:[1,1],pos:[-24,-14],rect_size:[460,46],size:24,color:'#D8CFBC',alignment:5});
require(path.join(root,'tools/build/lib.cjs')).progressBar(b,d+'/Progress',{anchor:'top-left',pos:[24,-63],rect_size:[1212,16]});
b.text(d+'/Zone','',{anchor:'top-left',pos:[24,-82],rect_size:[1212,34],size:22,color:'#C7B08A',alignment:3});
b.text(d+'/Objective','',{anchor:'top-left',pos:[24,-118],rect_size:[1212,36],size:25,color:'#EEE5D4',alignment:3,bestfit:true,min_size:21,max_size:25});
b.text(d+'/Desc','',{anchor:'top-left',pos:[24,-156],rect_size:[1212,62],size:22,color:'#B9B0A1',alignment:0,bestfit:true,min_size:19,max_size:22,overflow:2});
b.text(d+'/RewardTitle','',{anchor:'top-left',pos:[24,-222],rect_size:[160,30],size:22,color:'#E6C88A',alignment:3,bold:true});
for(let i=1;i<=6;i++){
 const n=d+'/Reward'+i;
 b.panel(n,{anchor:'top-left',pos:[24+(i-1)*204,-256],rect_size:[196,76],color:'#26212A',enable:false});
 b.sprite(n+'/Icon',{anchor:'middle-left',pivot:[0,0.5],pos:[8,0],rect_size:[48,48],color:'#FFFFFF',sprite_type:0,enable:false});
 b.text(n+'/Name','',{anchor:'top-left',pos:[62,-4],rect_size:[130,36],size:20,color:'#ECE1CB',alignment:3,bestfit:true,min_size:16,max_size:20,overflow:2});
 b.text(n+'/Value','',{anchor:'bottom-left',pos:[62,4],rect_size:[130,32],size:19,color:'#C9B17E',alignment:3,overflow:2});
}
b.write(file,{lint_verbose:true});
return b.listEntities().length;
}
if(require.main===module)console.log('Quest journal entities: '+run());
module.exports={run,applyResources};
