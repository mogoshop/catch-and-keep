'use strict';
const path=require('path'),fs=require('fs');
const root=process.env.MSW_WORLD_ROOT||path.resolve(__dirname,'../..');
const {UIBuilder}=require(path.join(root,'.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs'));
const {load}=require(path.join(root,'tools/lib/csv.cjs'));
const icons=Object.fromEntries(load('ui_icons').map(x=>[x.key,x.ruid]));
function run(){
const file=path.join(root,'ui/EquipmentHUD.ui');
const b=fs.existsSync(file)?UIBuilder.read(file):new UIBuilder('EquipmentHUD',7,true);
b.empty('SafeArea',{anchor:'stretch',rect_size:[1920,1080]});
const w='SafeArea/InvWin';
b.panel(w,{rect_size:[1400,1000],pos:[20,0],color:'#100E16',raycast:true,enable:false});
b.sprite(w+'/Rim',{rect_size:[1420,1020],image_ruid:icons.win_frame,color:'#FFFFFF',sprite_type:1});
b.text(w+'/Title','소지품  ·  망자의 장비',{anchor:'top-left',pos:[100,-20],rect_size:[1140,64],size:28,color:'#E6C88A',alignment:3,bold:true});
b.button(w+'/BtnClose','',{anchor:'top-right',pos:[-20,-14],rect_size:[88,88],image_ruid:icons.btn_close,bg_color:'#FFFFFF'});
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
}
b.text(d+'/PreviewState','현재 착용 모습',{anchor:'top-left',pos:[118,-378],rect_size:[264,36],size:24,color:'#D2BF9B',alignment:4,bestfit:true,min_size:24,max_size:24});
b.button(d+'/BtnPreview','장비 선택 후 외형 비교',{anchor:'top-left',pos:[118,-424],rect_size:[264,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:26,color:'#E6DCC6'});
const desc=w+'/DescBox';
b.scrollLayout(desc,{anchor:'top-left',pos:[552,-112],rect_size:[820,516],layout_type:1,use_scroll:true,padding:[24,32,20,20],scroll_bar_visible:1,scroll_bar_thickness:12,scroll_bar_bg_color:{r:.14,g:.12,b:.17,a:.6},scroll_bar_handle_color:{r:.6,g:.49,b:.3,a:1}});
b.text(desc+'/Desc','가방이나 착용 중인 장비를 선택하세요.',{anchor:'top-left',pos:[0,0],rect_size:[740,48],size:26,color:'#EEE5D4',alignment:0,overflow:0});
b.text(w+'/Gold','',{anchor:'top-left',pos:[28,-640],rect_size:[1344,36],size:26,color:'#E6C88A',alignment:3});
const bag=w+'/Bag';
// 가방 60칸 (10열 × 6줄): 3줄이 보이고 손가락·휠로 끌어 내린다
b.scrollLayout(bag,{anchor:'top-left',pos:[28,-690],rect_size:[1044,296],layout_type:2,cell_size:[88,88],constraint:1,constraint_count:10,grid_spacing:[16,14],padding:[10,10,6,6],use_scroll:true,v_scroll_dir:3,scroll_bar_visible:1,scroll_bar_thickness:10,scroll_bar_bg_color:{r:.14,g:.12,b:.17,a:.6},scroll_bar_handle_color:{r:.6,g:.49,b:.3,a:1}});
for(let i=1;i<=60;i++){
 const n=bag+'/Bag'+i;
 b.button(n,'',{anchor:'top-left',pos:[10+((i-1)%10)*104,-Math.floor(((i-1)%30)/10)*104],rect_size:[88,88],bg_color:'#19131E'}); // 실제 위치는 그리드가 정한다 (작성 좌표는 보이는 3줄 안)
 b.sprite(n+'/Rim',{rect_size:[88,88],image_ruid:icons.slot_frame,color:'#FFFFFF',sprite_type:1});
 b.sprite(n+'/Icon',{rect_size:[64,64],color:'#FFFFFF',enable:false});
}
b.button(w+'/BtnEquip','장착',{anchor:'top-left',pos:[1100,-690],rect_size:[272,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:30,color:'#E6C88A'});
b.button(w+'/BtnSell','버리기',{anchor:'top-left',pos:[1100,-794],rect_size:[272,88],image_ruid:icons.btn_frame,bg_color:'#FFFFFF',font_size:30,color:'#E6DCC6'});
b.text(w+'/Hint','선택 → 설명 확인\n버튼으로 작업 확정',{anchor:'top-left',pos:[1100,-616],rect_size:[272,64],size:24,color:'#C9BBA0',alignment:0});
b.write(file,{lint_verbose:true});
return b.listEntities().length;
}
if(require.main===module) console.log('Equipment UI entities: '+run());
module.exports={run};
