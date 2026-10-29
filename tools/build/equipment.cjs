'use strict';
const path=require('path'),fs=require('fs');
const root=process.env.MSW_WORLD_ROOT||path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const {windowFrame,fitButtonText,slotLock}=require(path.join(root,'tools/build/lib.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
function run(){
const file=path.join(root,'ui/EquipmentHUD.ui');
const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('EquipmentHUD', 15,true);
b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
const w='SafeArea/InvWin';
// 틀(바탕·테두리·제목·닫기)은 공용 창 틀 (lib.cjs windowFrame · 10-29 기획서 45 결정 2-A) — 몸통 배치는 아래 그대로
windowFrame(b,w,{size:[1400,1000],pos:[20,0],title:'인벤토리  ·  망자의 장비',enable:false});
const d=w+'/Doll';
b.panel(d,{anchor:'top-left',pos:[28,-112],rect_size:[500,516],color:'#17131D'});
b.avatar(d+'/Avatar',{rect_size:[200,250],pos:[0,38],preserve_avatar:1,raycast:false});
b.upsertComponent(d+'/Avatar','MOD.Core.CostumeManagerComponent',{UseCustomEquipOnly:true,CustomBodyEquip:'',CustomHairEquip:'',CustomFaceEquip:'',CustomEarEquip:'',CustomCapEquip:'',CustomCapeEquip:'',CustomCoatEquip:'',CustomLongcoatEquip:'',CustomPantsEquip:'',CustomGloveEquip:'',CustomShoesEquip:'',CustomOneHandedWeaponEquip:'',CustomTwoHandedWeaponEquip:'',CustomSubWeaponEquip:'',CustomFaceAccessoryEquip:'',CustomEyeAccessoryEquip:'',CustomEarAccessoryEquip:'',DefaultEquipUserId:'',Enable:true});
const slots={helm:[206,-8],amulet:[398,-8],weapon:[14,-112],offhand:[398,-112],armor:[14,-216],gloves:[398,-216],belt:[14,-320],boots:[398,-320],ring1:[14,-424],ring2:[398,-424]};
for(const [slot,pos]of Object.entries(slots)){
 const n=d+'/Eq_'+slot;
 b.button(n,'',{anchor:'top-left',pos,rect_size:[88,88],bg_color:'#19131E'});
 b.sprite(n+'/Rim',{rect_size:[88,88],image_ruid:icons.slot_frame,color:'#FFFFFF',sprite_type:1});
 b.sprite(n+'/Icon',{rect_size:[64,64],color:'#FFFFFF',enable:false});
 b.sprite(n+'/Ghost',{rect_size:[56,56],image_ruid:icons['eq_'+slot.replace(/[0-9]/g,'')],color:{r:1,g:1,b:1,a:.42}});
 // 10-27 소켓 (docs/design/37 §5-5): 아래 소켓 점(●찬 칸 ○빈 칸) · 룬을 고르면 끼울 수 있는 칸에 금빛 테두리가 깜빡인다 (InventoryWindow.BlinkSockets)
 b.text(n+'/Sock','',{anchor:'bottom-center',pos:[0,2],rect_size:[84,20],size:16,bold:true,color:'#F4E2B0',alignment:4,outline:true,outline_color:'#000000',enable:false});
 // 소켓 칸 6개 (코덱스 socket_empty · 룬이 박히면 룬 그림 + socket_ring) — InventoryWindow.DrawSockets가 개수만큼 가운데로 켠다
 for(let k=1;k<=6;k++){ b.sprite(n+'/S'+k,{anchor:'bottom-center',pos:[0,10],rect_size:[16,16],image_ruid:icons.socket_empty,color:'#FFFFFF',enable:false}); b.sprite(n+'/S'+k+'/Ring',{rect_size:[18,18],image_ruid:icons.socket_ring,color:'#FFFFFF',enable:false}); }
 b.sprite(n+'/Glow',{rect_size:[104,104],image_ruid:icons.socket_glow,color:'#FFFFFF',sprite_type:0,enable:false});
 b.patchComponent(n+'/Glow','MOD.Core.SpriteGUIRendererComponent',{RaycastTarget:false});
 slotLock(b,n);
}
b.text(d+'/PreviewState','현재 착용 모습',{anchor:'top-left',pos:[118,-378],rect_size:[264,36],size:24,color:'#D2BF9B',alignment:4,bestfit:true,min_size:24,max_size:24});
b.button(d+'/BtnPreview','장비 선택 후 외형 비교',{anchor:'top-left',pos:[118,-424],rect_size:[264,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:26,color:'#E6DCC6'});
const desc=w+'/DescBox';
b.scrollLayout(desc,{anchor:'top-left',pos:[552,-112],rect_size:[820,516],layout_type:1,use_scroll:true,padding:[24,32,20,20],scroll_bar_visible:1,scroll_bar_thickness:12,scroll_bar_bg_color:{r:.14,g:.12,b:.17,a:.6},scroll_bar_handle_color:{r:.6,g:.49,b:.3,a:1}});
b.text(desc+'/Desc','가방이나 착용 중인 장비를 선택하세요.',{anchor:'top-left',pos:[0,0],rect_size:[740,48],size:26,color:'#EEE5D4',alignment:0,overflow:0});
// 골드: 아이콘 + 액수 (장착 버튼 위). 안내 문구는 가방 바로 위로
b.empty(w+'/Gold',{anchor:'top-left',pos:[1100,-622],rect_size:[272,48]});
b.sprite(w+'/Gold/Icon',{anchor:'middle-left',pivot:[0,.5],pos:[8,0],rect_size:[36,36],image_ruid:'94b7d89e2f514e269e04250dd4b7d989',color:'#FFFFFF',sprite_type:0});
b.text(w+'/Gold/Text','',{anchor:'middle-left',pivot:[0,.5],pos:[54,0],rect_size:[212,44],size:28,bold:true,color:'#E6C88A',alignment:3});
const bag=w+'/Bag';
// 가방 60칸 (10열 × 6줄): 3줄이 보이고 손가락·휠로 끌어 내린다
b.scrollLayout(bag,{anchor:'top-left',pos:[28,-672],rect_size:[1044,280],layout_type:2,cell_size:[88,88],constraint:1,constraint_count:10,grid_spacing:[14,14],padding:[8,8,6,6],use_scroll:true,v_scroll_dir:2,scroll_bar_visible:1,scroll_bar_thickness:10,scroll_bar_bg_color:{r:.14,g:.12,b:.17,a:.6},scroll_bar_handle_color:{r:.6,g:.49,b:.3,a:1}});
for(let i=1;i<=60;i++){
 const n=bag+'/Bag'+i;
 b.button(n,'',{anchor:'top-left',pos:[8+((i-1)%10)*102,-Math.floor(((i-1)%30)/10)*104],rect_size:[88,88],bg_color:'#19131E'}); // 실제 위치는 그리드가 정한다 (작성 좌표는 보이는 3줄 안)
 b.sprite(n+'/Rim',{rect_size:[88,88],image_ruid:icons.slot_frame,color:'#FFFFFF',sprite_type:1});
 b.sprite(n+'/Icon',{rect_size:[64,64],color:'#FFFFFF',enable:false});
 b.text(n+'/Count','',{anchor:'bottom-right',pivot:[1,0],pos:[-4,2],rect_size:[60,28],size:20,bold:true,color:'#FFFFFF',alignment:8,outline:true,outline_color:'#101010',outline_width:0.3});
 slotLock(b,n);
}
b.button(w+'/BtnEquip','장착',{anchor:'top-left',pos:[1100,-690],rect_size:[272,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:30,color:'#E6C88A'});
b.button(w+'/BtnSell','버리기',{anchor:'top-left',pos:[1100,-794],rect_size:[272,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:30,color:'#E6DCC6'});
b.text(w+'/Hint','선택 → 설명 확인 · 버튼으로 작업 확정',{anchor:'top-left',pos:[28,-628],rect_size:[1044,40],size:24,color:'#C9BBA0',alignment:3,bestfit:true,min_size:18,max_size:24});
// 가방 정렬(등급순) · 여러 개 선택(한꺼번에 버리기 — 판매는 잿빛 행상 거래 창) — 버리기 아래 나란히
b.button(w+'/BtnSort','정렬',{anchor:'top-left',pos:[1100,-892],rect_size:[110,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:22,color:'#E6DCC6'});
b.button(w+'/BtnMulti','여러 개 선택',{anchor:'top-left',pos:[1218,-892],rect_size:[154,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:20,color:'#E6DCC6'});
// 「잠금」 (10-29 기획서 45 결정 6-A): 고른 물건의 설명 칸 오른쪽 위 — 잠긴 물건은 팔기·버리기에서 빠진다 (가방·착용 칸 왼쪽 위 ★ 표지).
//   물건을 고르면 켜진다 (InventoryWindow.Poll). 설명 첫 두 줄(이름·종류)은 짧아 단추와 겹치지 않는다 — 글귀 승인 전
b.button(w+'/BtnLock','잠금',{anchor:'top-left',pos:[1188,-124],rect_size:[160,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:22,color:'#E6DCC6',enable:false});
// 테두리 단추 글자: 장식 안쪽 여백 + 넘치면 줄이기 (ui-tokens buttonText — 다른 창과 같은 규격)
for(const n of ['Doll/BtnPreview','BtnEquip','BtnSell','BtnSort','BtnMulti','BtnLock'])fitButtonText(b,w+'/'+n,{oneLine:n==='Doll/BtnPreview'||n==='BtnMulti'||n==='BtnSort'});   // 긴 글(「외형 변화 없는 부위」「여러 개 선택」)·좁은 칸(iPad 「정렬」 96px)은 두 줄로 접지 않고 줄인다
b.write(file,{lint_verbose:true});
return b.listEntities().length;
}
if(require.main===module) console.log('Equipment UI entities: '+run());
module.exports={run};
