# Skill follow-ups A–D: Maker check (2026-11-02 02:16–02:32)

Session: stop → 5 s → touch (GameHUD UI file · SkillWindow/SkillPicker/HudMap.mlua) 02:16:17 → refresh once
Build log regenerated at 02:16, 358 lines: Info 255 · Warning 103 · **Error 0**
SelfTest: PC `[SelfTest] 통과 411 / 실패 0` (02:17:19, main) · iPad session `통과 410 / 실패 0` (02:28:18). The only Error line is the intentional SelfTestEvent boom.
Character: slot 1 인꾸 Lv17 Normal · solo room

## A. Bone Golem workshop hint line ✅
02:19:28 C [VRF] skill pick bone_giant
02:19:28 C [VRF] skill giant panel banner=none → hint
   → Shows 「깃발을 골라 거인 종류를 정해주세요」 (pick a banner to set the giant kind). Shield, greatsword, twin-blade and mage cells get a green rim. Basic = teal (shown); 안 고름 (no pick) = gold (chosen). See 01-giant-hint-none.png.
02:20:20 C [VRF] rite banner pick kind=basic
02:20:20 C [VRF] skill giant panel banner=basic → hint
   → Shows 「기본 거인은 강화가 없습니다 · 다른 깃발을 골라주세요」 (the basic giant has no upgrades; pick another banner). See 02-giant-hint-basic.png.
02:20:37 C [VRF] rite banner pick kind=greatsword
02:20:37 C [VRF] rite banner ui banner=greatsword shown=greatsword (no hint line)
   → Hint is gone. 3 nodes show: 긴 회전 (rank 10), 갈라진 땅 (17), 세 줄 가르기 (17). See 03-giant-greatsword-nodes3.png.
   * Differs from "5 nodes" in the brief. data/skills.csv has only 3 greatsword nodes (giant_gs_spin, giant_gs_scar, giant_gs_twice), so the display matches the data.
   * Clicking the 「기본」 cell (x1282) with the Maker mouse pressed 「안 고름」 (K6) instead. Basic was selected with a client ButtonClickEvent instead. Greatsword worked with the mouse.

## B. Skill picker top tabs ❌ ("..": gone · 6–7-character names overflow to 3 lines)
Tab cell 152×88 · text font 22, BestFit 12–22 · Overflow=Overflow (from the 02:22:18 [VRF-T] log line)
  Tab1 「▶A|티스」, Tab3 「D|해골 전사」 and the original Tab5 「우클릭|앰플리파이」 fit on 2 lines. See 04-picker-tabs-2line.png.
  Temporary slots (only server Slots and RightSkill changed): S 포이즌 미스트 · F 아이언 메이든 · right-click 드레드 셰이드
  → Render as 「S / 포이즌 미 / 스트」, 「F / 아이언 메 / 이든」 and 「우클릭 / 드레드 셰 / 이드」 on 3 lines. The top and bottom lines spill past the tab border, and BestFit does not shrink the text.
  See 05-picker-tabs-7char-wrap3.png and 05b-picker-tabs-7char-crop.png. iPad: 11-ipad-picker-tabs-7char-wrap3.png (same problem; labels read 「2번」 and 「공격 버튼」).
  (5-character 「앰플리파이」 and 4-character 「해골 전사」 fit within 2 lines.)

## C. Minimap terrain across map changes ✅
5 town↔wasteland round trips with PlayerTravel.Go (10 map changes, 02:23:05–02:24:09). See c-hops.log.
  Navigation ready terrain=: wasteland 249 ×5 · town 72 ×5 (unchanged) · features 4/10
  Client Error 0 · Exception 0 · 「Collection was modified」 0 · `[HudMap] terrain enable deferred` 0
  The 2 extra trips in and out for D gave the same counts (249/72).
  Minimap captures: 10b-minimap-town.png (floor cells plus fog) · 06b-minimap-wasteland.png (just past the entrance, mostly fog)

## D. Bone Golem live summon · split · Bone Nova cap ✅ (only 3 come back after the split)
Setup (server): Levels.bone_giant=1 · bone_rite=1 · Slots S=bone_rite F=bone_giant · RiteBanner="" · MakeRecord('skeleton',4)+SpawnUnit ×5 (wasteland)
  02:25:02 [VRF-T] D setup units=5 ready=true reason=
--- 1st cast (real F key) ---
02:25:13 S [VRF] giant charge use left=1 next=27.9 period=27.9 cover=0.0
02:25:13 S [VRF] rite giant start type=basic atk=159 hp=1566/1566 guard=0 radius=1.80 range=1.2 cd=1.60 speed=1.70 taunt=none look=basic scale=1.20
02:25:13 S [VRF] rite stage=5 giant type=basic counts=basic5 tie=false banner=false host=skeleton: atk=159 hp=1566/1566 sec=20 rankMul=1.00
02:25:13 S [VRF] giant count=1 cap=2 kinds=basic charge=1 cover=0.0
02:25:13 S [VRF] cast bone_giant lv=1 mul=1.00 mana=30 cover=0.0 giants=1
02:25:13 C [VRF] combat cue cast_bone_giant #1
02:25:13 C [VRF] ultimate rite_giant dim=true punch=true
02:25:13 S [VRF] giant tip shown n=1
02:25:46 S [VRF-T] after20s giants=0 units=3 live=3 skel=3 mana=69.06   (the split log line was lost when the console was cleared; captured again on the 2nd cast)
--- Bone Nova long press (S key down 4.47 s, then up) ---
02:26:03 C [VRF] rite hold start slot=2
02:26:03 C [VRF] rite ring stage=1 want=1 max=3 held=0.00
02:26:03 C [VRF] rite ring stage=2 want=2 max=3 held=0.50
02:26:04 C [VRF] rite ring stage=3 want=3 max=3 held=1.01      (no stage 4 or 5 line through 4.47 s)
02:26:07 C [VRF] rite release held=4.47 want=3 max=3 predicted=3 skel=3
02:26:07 S [VRF] rite stage=3 skel=3 consumed=3 avgAtk=29 rankMul=1.00
02:26:07 S [VRF] rite stage=3 skel=3 want=3 max=3 lv=1 mana=20 lock=false
02:26:07 S [VRF] rite arrow 1/3 · 2/3 · 3/3 dmg=145
--- 2nd cast (to capture the split log · 5 skeletons set up again → F key) ---
02:26:37 S [VRF-T] D2 setup units=5 reason=
02:26:37 S [VRF] rite stage=5 giant type=basic counts=basic5 tie=false banner=false host=skeleton: atk=159 hp=1566/1566 sec=20 rankMul=1.00
02:26:37 S [VRF] cast bone_giant lv=1 mul=1.00 mana=30 cover=0.0 giants=1
02:26:57 S [VRF] giant look play state=split key=split form=basic sec=0.60 loop=false
02:26:57 S [ShadowUnit] 소환 ud7 ATK 29 / 소환 ud8 ATK 29
02:26:57 S [VRF] rite giant split back=2/4 ratio=1.00 respawn=true giants=0
   → Splits exactly 20 s later. 3 come back: the giant body plus 2. EndGiant only re-adds a unit while have < MaxFor(raise_skeleton rank 4) = 3, so the other 2 stay off the list.
Captures: 06-bone-giant-standing.png (giant standing · mana 72→46) · 07-giant-split-back-x3.png · 08-bone-nova-hold-ring3.png (ring 3 「뼈 화살」 over the head) · 09-giant-split-2nd.png

## Restore
02:27:30 S [VRF-T] restored slots=bone_shard,,raise_skeleton, right=mark_weakness banner= tips=0 units=0 giants=0
   lv=raise_skeleton=4;bone_shard=3;mark_weakness=5;shadow_summon=1;skeleton_mastery=3 (bone_giant and bone_rite removed) · DismissRecords (test skeletons) · moved to town
02:30:35 A fresh iPad session also loaded the original slots, right-click and banner (the save took).
XP 55937/89759 unchanged · Lv17 · HP 84/84 · no kill logs (gold and items not checked)
Maker final state: edit mode · PC (FHD) · map01 · maker_save not used
