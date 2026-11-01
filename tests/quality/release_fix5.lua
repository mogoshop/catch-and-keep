-- 11-01 출시 전 수정 5건 회귀 검사 (메이커 2회차 「기대와 다름」 · docs/evidence/2026-11-01-rank-social-maker/NOTES.md 관찰 1~6 · docs/evidence/2026-11-01-release-fix5):
--   ① ◀ ▶ 넘김 단추(랭킹 창 심연 액트 막대 · 웨이포인트 막대 · 플레이어 창 쪽 넘김): 누르는 칸 = 투명 단추 88×88(ButtonComponent · RaycastTarget 켬 · Simple) ·
--      보이는 틀 …Art(btn_frame · RaycastTarget 끔 · 먼저 그림) · 제목·쪽 글·다른 누르는 것과 안 겹침 · ◀▶ 글이 틀 가운데 · 흐리게는 틀에만(UIKit.SetActPager) · [VRF] 클릭 로그
--   ② 실제 클라 수락 답 순서 — 행동 검사는 channel_roster ⑤-2 (방 이동에서 실행이 끊겨도 「수락」 도착) · 여기선 본문 순서(답 → 이동)만 대조
--   ③ 파티 색 띠·줄 바탕 = 흰 사각 판(ui_white_square · 색 #FFFFFF) — 예전 gauge_fill(붉은 그림)이 아님
--   ④ 줄 단추 = 민무늬 칩 테(PLATE ui_loot_label) · 가장 긴 글(「파티원」·「살펴보기」)이 테 안 글 칸에 한 줄 · 글 칸 여백 = chipInset
--   ⑤ 랭킹 칸 아바타: 보이는 몸(avatarFill 실측 비율) 높이 ≥ 칸 × 0.8 · 칸 안 · 글과 안 겹침 · 그림자 색이 칸 바탕과 대비 3 이상
--   각 항목은 87f8cdf2 빌드로 같은 검사를 돌려 실패하는지(반례)도 본다.
-- @source UIKit UI/Core/UIKit.mlua SetActPager+
-- @source RankWindow UI/Windows/RankWindow.mlua OnBeginPlay
--@pre function Color(r,g,b,a) return {r=r,g=g,b=b,a=a} end
local checks=0
local function ok(c,msg) if not c then error('FAIL: '..msg,2) end checks=checks+1 end
local function read(p) local f=assert(io.open(p,'r')) local s=f:read('a') f:close() return s end
local function has(s,n) return s~=nil and s:find(n,1,true)~=nil end
local logs={}
function log(s) table.insert(logs,s) end
function log_warning(s) end
function isvalid(x) return x~=nil and x~=false end
local function lastLog(prefix) local v=nil for _,l in ipairs(logs) do if l:sub(1,#prefix)==prefix then v=l end end return v end

-- ───────── 빌드된 GameHUD (지금 · 87f8cdf2) ─────────
local function dump(rev)
 local p=io.popen('node tests/quality/release_fix5_dump.cjs '..(rev or '')) local s=p:read('a') p:close()
 return assert(load(s))()
end
local NOW,OLD=dump(),dump('87f8cdf2')
local icons={}
for line in read('data/ui_icons.csv'):gmatch('[^\n]+') do local k,r,c,a=line:match('^([^,]+),([^,]+),([^,]+),([^,]+)') if k then icons[k]={ruid=r,color=c,alpha=tonumber(a)} end end
local tok=read('tools/build/ui-tokens.cjs')
local BTN_FRAME,PLATE_RUID,GAUGE=icons.btn_frame.ruid,icons.ui_loot_label.ruid,icons.gauge_fill.ruid
local WHITE_SQ=icons.ui_white_square and icons.ui_white_square.ruid
-- 부모 안 사각형 (부모 왼쪽 아래 = 0,0)
local function rect(e,pw,ph) local l=e.ax*pw+e.x-e.px*e.w local b=e.ay*ph+e.y-e.py*e.h return {l=l,r=l+e.w,b=b,t=b+e.h} end
local function ov(a,b) return a.l<b.r-0.01 and b.l<a.r-0.01 and a.b<b.t-0.01 and b.b<a.t-0.01 end
local function inside(a,b) return a.l>=b.l-0.01 and a.r<=b.r+0.01 and a.b>=b.b-0.01 and a.t<=b.t+0.01 end

-- ───────── ① 넘김 단추 ─────────
local function arrowProblems(U,bar,textName)
 local probs={}
 local B=U[bar]
 if not B then return {'막대 없음 '..bar} end
 local hits={}
 for _,side in ipairs({'Prev','Next'}) do
  local h=U[bar..'/'..side]
  if not h or not h.button then probs[#probs+1]=side..' 단추 없음' else
   local hr=rect(h,B.w,B.h) hits[#hits+1]=hr
   if h.w<88 or h.h<88 then probs[#probs+1]=string.format('%s 누르는 칸 %dx%d < 88x88',side,h.w,h.h) end
   if not h.ray then probs[#probs+1]=side..' RaycastTarget 꺼짐' end
   if h.ruid==BTN_FRAME then probs[#probs+1]=side..' 누르는 칸이 btn_frame 9조각 (폭 '..h.w..' < 좌우 장식 96)' end
   local a=U[bar..'/'..side..'Art']
   if not a then probs[#probs+1]=side..'Art(보이는 틀) 없음' else
    local ar=rect(a,B.w,B.h)
    if a.ray then probs[#probs+1]=side..'Art가 누름을 받음' end
    if a.ruid~=BTN_FRAME then probs[#probs+1]=side..'Art 그림이 btn_frame 아님' end
    if not inside(ar,hr) then probs[#probs+1]=side..'Art가 누르는 칸 밖' end
    if a.order>=h.order then probs[#probs+1]=side..'Art가 단추 위에 그려짐' end
    -- ◀▶ 글 칸(누르는 칸 − 글 여백) 가운데 = 틀 가운데
    local cx=(hr.l+h.padl+hr.r-h.padr)/2 local cy=(hr.b+h.padb+hr.t-h.padt)/2
    if math.abs(cx-(ar.l+ar.r)/2)>0.5 or math.abs(cy-(ar.b+ar.t)/2)>0.5 then probs[#probs+1]=string.format('%s 글이 틀 가운데 아님 (%.1f,%.1f)',side,cx-(ar.l+ar.r)/2,cy-(ar.b+ar.t)/2) end
   end
  end
 end
 -- 같은 막대의 다른 부품(글 칸 · 누름 받는 것)과 누르는 칸 겹침
 for path,e in pairs(U) do
  if path:sub(1,#bar+1)==bar..'/' and not path:sub(#bar+2):find('/') then
   local leaf=path:sub(#bar+2)
   if leaf~='Prev' and leaf~='Next' and leaf~='PrevArt' and leaf~='NextArt' then
    local r=rect(e,B.w,B.h)
    for _,hr in ipairs(hits) do
     if ov(r,hr) and (leaf==textName or e.ray or e.button) then probs[#probs+1]=leaf..'이(가) 누르는 칸과 겹침' end
    end
   end
  end
 end
 return probs,hits
end
for _,spec in ipairs({{'RankWin/Paper/ActBar','Title'},{'WpWin/ActBar','Title'},{'SocialWin/Pager','Label'}}) do
 local p=arrowProblems(NOW,spec[1],spec[2])
 ok(#p==0,spec[1]..' 넘김 단추: '..table.concat(p,' · '))
 local q=arrowProblems(OLD,spec[1],spec[2])
 ok(#q>0,'반례(87f8cdf2) '..spec[1]..'에서 문제를 찾음: '..table.concat(q,' · '))
end
-- 쪽 넘김 누르는 칸(아래로만 넘침)이 마지막 줄 R8 · 그 단추와 안 겹침 (창 바탕 좌표)
do
 local W=NOW['SocialWin'] local P=NOW['SocialWin/Pager'] local pr=rect(P,W.w,W.h) local r8=rect(NOW['SocialWin/R8'],W.w,W.h)
 for _,side in ipairs({'Prev','Next'}) do
  local h=rect(NOW['SocialWin/Pager/'..side],P.w,P.h)
  local hw={l=pr.l+h.l,r=pr.l+h.r,b=pr.b+h.b,t=pr.b+h.t}
  ok(not ov(hw,r8),'쪽 넘김 '..side..' 누르는 칸 '..string.format('%.0f~%.0f',hw.b,hw.t)..'이 마지막 줄 R8('..string.format('%.0f~%.0f',r8.b,r8.t)..')과 안 겹침')
  ok(hw.b>=0,'쪽 넘김 '..side..' 누르는 칸이 창 바탕 안 (아래 '..hw.b..')')
 end
end
-- 흐리게는 틀에만 (UIKit.SetActPager): 틀이 있는 막대 = …Art 색 · 없는 옛 막대(퀘스트 일지) = 단추 색
do
 local ents={}
 local function ent(path) ents[path]=ents[path] or {TextGUIRendererComponent={Text=''},SpriteGUIRendererComponent={},UITransformComponent={},Enable=true} return ents[path] end
 for path in pairs(NOW) do if path:sub(1,20)=='RankWin/Paper/ActBar' then ent(path) end end
 for _,p in ipairs({'Old/ActBar/Prev','Old/ActBar/Next','Old/ActBar/Title'}) do ent(p) end
 for i=1,6 do ent('Old/ActBar/D'..i) end
 UIKit.Get=function(_,rel) return ents[rel] end
 UIKit:SetActPager('RankWin/Paper/ActBar',1,4,'액트 1 · 무덤 왕국','')
 local A='RankWin/Paper/ActBar/'
 ok(ents[A..'PrevArt'].SpriteGUIRendererComponent.Color.a==0.55 and ents[A..'NextArt'].SpriteGUIRendererComponent.Color.a==1,'첫 액트: ◀ 틀만 흐리게 · ▶ 틀 그대로')
 ok(ents[A..'Prev'].SpriteGUIRendererComponent.Color==nil and ents[A..'Next'].SpriteGUIRendererComponent.Color==nil,'투명 누르는 칸에는 색을 넣지 않음 (넣으면 흰 판이 보인다)')
 ok(ents[A..'Next'].TextGUIRendererComponent.Text=='▶' and has(ents[A..'Prev'].TextGUIRendererComponent.Text,'#7A7268'),'◀▶ 글은 단추 자신에 (◀ 흐린 글)')
 UIKit:SetActPager('Old/ActBar',4,4,'액트 4','')
 ok(ents['Old/ActBar/Next'].SpriteGUIRendererComponent.Color.a==0.55,'틀 없는 옛 막대(퀘스트 일지)는 단추 그림을 그대로 흐리게')
end
-- 클릭 [VRF] (RankWindow ◀ ▶) — 실제 OnBeginPlay가 이은 콜백을 부른다
do
 local cb={}
 _UIKit={RegisterWindow=function() end,Connect=function(_,p,f) cb[p]=f end,SetEnabled=function() end,SetText=function() end,SetPos=function() end,SetSize=function() end,Comp=function() return nil end}
 _GameData={depthEnabled=0} _GameConst={ActCount=4,FinalBossSourceId='ash_king'}
 local acts={}
 RankWindow.SetAct=function(self,a) acts[#acts+1]=a end
 RankWindow.Layout=function() end RankWindow.LayoutTabs=function() end
 RankWindow.CurrentAct=function(self) return self.Act end
 RankWindow:OnBeginPlay()
 RankWindow.Act=2
 cb['RankWin/Paper/ActBar/Next']()
 ok(has(lastLog('[VRF] arrow click rank next'),'act=2') and acts[#acts]==3,'▶ 누름 → [VRF] arrow click rank next act=2 → 액트 3')
 cb['RankWin/Paper/ActBar/Prev']()
 ok(has(lastLog('[VRF] arrow click rank prev'),'act=2') and acts[#acts]==1,'◀ 누름 → [VRF] arrow click rank prev → 액트 1')
end
local sw=read('RootDesk/MyDesk/UI/Windows/SocialWindow.mlua')
ok(has(sw,'[VRF] arrow click social next') and has(sw,'[VRF] arrow click social prev') and has(sw,'/Pager/PrevArt"') and has(sw,'/Pager/NextArt"'),'플레이어 창: ◀▶ 클릭 [VRF] · 흐리게는 PrevArt/NextArt (행동은 channel_roster)')

-- ───────── ② 수락 답 순서 (본문 대조 · 행동은 channel_roster ⑤-2) ─────────
do
 local tb=read('RootDesk/MyDesk/Social/TownBoard.mlua')
 local body=tb:match('method void AnswerInvite%(.-\n    end\n')
 local a=body:find('self:ReplyNow(inv.fr',1,true) local m=body:find('MoveUsersToStaticRoom',1,true)
 ok(a and m and a<m,'게임 방 길: 「수락」 답(ReplyNow · 기다림) → 방 이동')
 ok(has(body,'_RoomSystem:EnterWith(') and has(read('RootDesk/MyDesk/Social/RoomSystem.mlua'),'if beforeMove ~= nil then beforeMove() end'),'로비 길: EnterWith가 이동 직전에 답을 보낸다')
 ok(has(tb,'RequestSendEventToRoomAndWait') and has(tb,'beforeMove=true'),'ReplyNow = 기다리는 전달 · [VRF] 보냄 줄')
 local gp=io.popen('gi'..'t show 87f8cdf2:RootDesk/MyDesk/Social/TownBoard.mlua') local old=gp:read('a') gp:close()
 local ob=old:match('method void AnswerInvite%(.-\n    end\n')
 local om=ob:find('MoveUsersToStaticRoom',1,true) local oo=ob:find('self:Reply(inv.fr or "", inv.fu or "", "ok", me)',1,true)
 ok(om and oo and om<oo,'반례(87f8cdf2): 이동 뒤에 「수락」 답 (실제 클라에서 끊겨 안 감)')
end

-- ───────── ③ 파티 색 띠·줄 바탕 = 흰 판 ─────────
ok(WHITE_SQ~=nil and icons.ui_white_square.color=='#FFFFFF' and icons.ui_white_square.alpha==1,'ui_icons ui_white_square = 흰 판 (색 #FFFFFF · 알파 1)')
ok(icons.gauge_fill.color~='#FFFFFF','gauge_fill은 흰 그림이 아님 (표의 기본색 '..icons.gauge_fill.color..' — 색을 입히는 판으로 쓰면 곱해져 틀어진다)')
for _,r in ipairs({'R1','R8'}) do
 for _,part in ipairs({'Mark','Bg'}) do
  local e=NOW['SocialWin/'..r..'/'..part]
  ok(e and e.ruid==WHITE_SQ and e.stype==0 and not e.ray,'SocialWin/'..r..'/'..part..' = 흰 사각 판 · Simple · 누름 안 받음')
  ok(OLD['SocialWin/'..r..'/'..part].ruid==GAUGE,'반례(87f8cdf2) '..r..'/'..part..' = gauge_fill')
 end
end
ok(has(tok,"fillKey: 'ui_white_square'"),'ui-tokens SOCIAL.fillKey = ui_white_square')

-- ───────── ④ 줄 단추 = 민무늬 칩 · 한 줄 ─────────
local function tw(s,px) local w=0 for ch in s:gmatch('[\0-\127\194-\244][\128-\191]*') do w=w+(#ch>1 and px or px*0.55) end return w end
local inset=tonumber(tok:match('const PLATE = { key: .-, rim: (%d+)'))+tonumber(tok:match('const SPACE = (%d+)'))/2
local LABELS={Party={'파티','초대','파티원'},Duel={'결투','포기'},Trade={'거래'},Inspect={'살펴보기'}}
ok(has(tok,"chipLabels: { Party: ['파티', '초대', '파티원'], Duel: ['결투', '포기'], Trade: ['거래'], Inspect: ['살펴보기'] }"),'ui-tokens chipLabels = 이 검사의 글 목록 (SocialWindow.RowState가 넣는 글)')
local function chipProblems(U,r)
 local probs={}
 for name,labels in pairs(LABELS) do
  local e=U['SocialWin/'..r..'/'..name]
  local long=0 for _,l in ipairs(labels) do long=math.max(long,tw(l,e.fs)) end
  local room=e.w-e.padl-e.padr
  if e.ruid~=PLATE_RUID then probs[#probs+1]=name..' 테가 민무늬 칩(ui_loot_label)이 아님' end
  if long>room+0.01 then probs[#probs+1]=string.format('%s 가장 긴 글 %.0f > 글 칸 %.0f (두 줄로 꺾임)',name,long,room) end
  if e.padl<inset or e.padr<inset then probs[#probs+1]=name..' 글 칸 여백 < 테 안쪽 '..inset end
  if e.h-e.padt-e.padb>=e.fs*1.5*2 then probs[#probs+1]=name..' 글 칸 높이가 두 줄을 허용' end
 end
 return probs
end
for _,r in ipairs({'R1','R8'}) do
 local p=chipProblems(NOW,r) ok(#p==0,'플레이어 창 '..r..' 줄 단추: '..table.concat(p,' · '))
 local q=chipProblems(OLD,r) ok(#q>0,'반례(87f8cdf2) '..r..': '..table.concat(q,' · '))
end
-- 줄 단추 = 줄 오른쪽 끝부터 chipGap씩 · 이름 칸과 안 겹침
do
 local R=NOW['SocialWin/R1'] local prev=nil
 for _,n in ipairs({'Party','Duel','Trade','Inspect'}) do local e=rect(NOW['SocialWin/R1/'..n],R.w,R.h) if prev then ok(math.abs(e.l-prev.r-6)<0.5,n..' 앞 단추와 사이 6') end prev=e end
 ok(math.abs(prev.r-R.w)<0.5,'살펴보기 끝 = 줄 끝')
 ok(rect(NOW['SocialWin/R1/Name'],R.w,R.h).r<=rect(NOW['SocialWin/R1/Party'],R.w,R.h).l-12+0.5,'이름 칸 끝 ↔ 파티 단추 사이 12 이상')
end

-- ───────── ⑤ 랭킹 칸 아바타 · 그림자 색 ─────────
local fw,fh,ff=tok:match('avatarFill: { w: ([%d.]+), h: ([%d.]+), foot: ([%d.]+) }')
fw,fh,ff=tonumber(fw),tonumber(fh),tonumber(ff)
ok(fw and fh and ff,'ui-tokens avatarFill 읽음 (메이커 11-01 실측 비율)')
local function body(e,pw,ph) local r=rect(e,pw,ph) local side=math.floor((e.w-e.w*fw)/2+0.5) return {l=r.l+side,r=r.r-side,b=r.b+e.h*ff,t=r.b+e.h*(ff+fh)} end
local function avatarProblems(U,cell,parts)
 local probs={}
 local C=U[cell]
 local bx=body(U[cell..'/Avatar'],C.w,C.h)
 if bx.t-bx.b<C.h*0.8 then probs[#probs+1]=string.format('보이는 몸 높이 %.1f < 칸 %d × 0.8',bx.t-bx.b,C.h) end
 if not inside(bx,{l=0,r=C.w,b=0,t=C.h}) then probs[#probs+1]=string.format('몸이 칸 밖 (%.1f~%.1f)',bx.b,bx.t) end
 for _,p in ipairs(parts) do if ov(bx,rect(U[cell..'/'..p],C.w,C.h)) then probs[#probs+1]='몸 ↔ '..p..' 겹침' end end
 return probs,bx
end
for _,spec in ipairs({{'RankWin/Paper/List/R1',{'Rank','Name','Value'}},{'RankWin/Paper/List/R2',{'Rank','Name','Value'}},{'RankWin/Paper/Mine',{'Rank','Name','Value','Label'}}}) do
 local p=avatarProblems(NOW,spec[1],spec[2])
 ok(#p==0,spec[1]..' 아바타: '..table.concat(p,' · '))
 local q=avatarProblems(OLD,spec[1],spec[2])
 ok(#q>0,'반례(87f8cdf2) '..spec[1]..': '..table.concat(q,' · '))
end
do
 local function lin(c) return c<=0.04045 and c/12.92 or ((c+0.055)/1.055)^2.4 end
 local function lum(c) return 0.2126*lin(c[1])+0.7152*lin(c[2])+0.0722*lin(c[3]) end
 local function con(a,b) local x,y=lum(a),lum(b) if x<y then x,y=y,x end return (x+0.05)/(y+0.05) end
 -- 칸 바탕 = 창 바탕(0.05,0.045,0.06) 위 흰 판 알파 0.05 · 그림자 모습 = 기본 피부(어림 #FFDBB0) × 그림자 색
 local cell={0.05*0.95+0.05,0.045*0.95+0.05,0.06*0.95+0.05}
 local skin={1,0.86,0.69}
 local function shade(t) return {skin[1]*t.r*t.a+cell[1]*(1-t.a),skin[2]*t.g*t.a+cell[2]*(1-t.a),skin[3]*t.b*t.a+cell[3]*(1-t.a)} end
 local T=RankWindow.ShadowTint
 ok(T.r<1 and T.g<1 and T.b<1,'그림자 색은 흰색이 아님 (외형 없는 옛 줄 = 「모르는 모습」)')
 local c=con(shade(T),cell)
 ok(c>=3,string.format('그림자 모습 ↔ 칸 바탕 대비 %.2f ≥ 3',c))
 local old=con(shade({r=0.13,g=0.12,b=0.16,a=0.9}),cell)
 ok(old<3,string.format('반례(87f8cdf2 그림자 색 0.13·0.12·0.16): 대비 %.2f < 3 (거의 안 보임)',old))
 ok(con(shade(T),skin)>=1.5,'그림자 모습은 외형 있는 칸(흰 색 그대로)과 구분됨')
end

print('[release_fix5] 통과 '..checks)
