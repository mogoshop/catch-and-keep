# Skill icon production brief - 7 icons (dash + 6 upgrade nodes) matched to approved art systems

날짜 2026-11-04 · 작성 Claude(명세) → 제작 코덱스 · **승인 아님**(새 시안은 사용자 비교 검수 뒤 적용) · Claude는 이미지를 만들지 않음(중복 제작 금지)

## 배경(사용자 피드백)
- Reused stock drawings for the 6 new nodes: "all six look off, not fitting a skill upgrade" -> rejected.
- Codex redesign 20261104 (chunky pixel-art, bright violet/ivory, 1254px): "concept fine but consistency with existing assets is off" -> held, not applied.
- Dash: rename to 질주/Dash and make the icon readable as running at a glance.

## 두 시각 체계(구분해서 제작)
### A-active-main
- used_by: main skill slots (quick slots, skill window main, mobile dash button)
- reference_set: assets/codex-skill-icons-v2-20261102/revision2-0640/png/main/*.png (in use for bone_rite, bone_shard, bone_armor, enfeeble ...)
- canvas: 128x128 RGBA, fully opaque full-bleed square
- background: near-black #0d0d0d-#151317 with soft dark vignette; no explicit frame (only a ~2 px darker edge)
- measured_on_refs: mean saturation 0.29-0.39, mean value 0.19-0.30 over opaque pixels; subject fills 70-85%
- note: wraith_dash currently uses a 96x96 v4 icon (wraith + lightning); the new Dash icon should match the v2 main set at 128x128.
### B-node
- used_by: upgrade node slots in the skill window (48 px) and tooltips (96 px)
- reference_set: assets/codex-skill-node-icons-v3-20261102/{sample4/samples,command,soul,curse,frames}/png/node-*.png (51 approved 11-02)
- canvas: 96x96 RGBA, transparent background, single cut-out object
- margins: alpha bbox stays within 6..90 px on every side (>= 6 px clear margin); subject ~85% of canvas
- measured_on_refs: opaque coverage 0.21-0.55 of canvas; mean saturation 0.44-0.46; mean value 0.38-0.56 over opaque pixels
- outline: 1-2 px dark plum/near-black closed outline (#1a1016-#201316) on every form
- tree_accents: command: command tree accent = violet spectral glow (#512d57 to #8a4fa0, highlights #c9a6e0) · soul: soul tree accent = cold steel-blue spirit glow (#3a466c, #53659b, highlight #8ea9e3) · curse: curse tree accent = blood red (#b43937, #ef2f28, highlight #f94c24)

## 공통 화풍 규칙
- Painterly dark-fantasy, soft volumetric shading, chunky readable silhouettes (2-3 main forms).
- Palette anchored on bone ivory/ochre + deep plum shadows; ONE accent color by skill tree; keep saturation muted (see measured ranges).
- One warm key light from upper-left; restrained colored rim glow; no bloom halos.
- Scene must read the EFFECT at a glance (fork, reach, re-form, bounce-farther, wider blast, wider aura, dash).
- Legibility test: downscale to 48x48 (nodes) / 64x64 and 48x48 (active) on the dark UI (#1b1618) and check the subject still reads with 2-3 forms.
- Deliver PNG at the stated canvas + the generation original; name files node-<id>.png / main-wraith_dash.png.

## 금지
- Pixel-art / chunky flat style (the held 20261104 draft), hard-edged dithering, thin v1 line-art, vector flat fills.
- Bright neon violet/ivory; saturation above the measured ranges.
- Reusing or recoloring stock/leftover drawings (v1 nodes, v4 skill frames, deleted-node art).
- Text, numbers, letters, badges, arrows-as-UI, crosshairs, UI frames/borders, drop shadows on the canvas (nodes), opaque or scenic background (nodes).
- Photo-real gore, cute/chibi faces, more than 3 main forms, particle confetti.

## 납품
- 폴더(제안): /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/icons-redesign-v2-20261104 (suggested)
- 파일: 7 PNG + manifest.json (id, file, prompt used, source original) + a side-by-side review sheet: current temp icon | new draft, at 48 px and 96 px (nodes) / 64 px and 128 px (dash) on dark UI background
- 이후: user visual review -> only approved ones handed to Claude for upload (group OJYYQ, FILTER Point) and skills.csv icon update

## 7개 항목
### wraith_dash — 질주 (A-active-main · move)
- 효과: Dash 3 tiles (5 at rank 20) toward the aim direction with a brief invulnerability. Learned at rank 1 from Lv1 (free).
- 쓰이는 곳: Quick-use movement skill: PC Space / mobile dash button, skill window main slot, tooltip; icon shown ~64-88 px on PC quick slot, ~56 px mobile dash button, 48 px in skill window lists.
- 반드시 읽혀야 할 것: A running figure + speed trail = DASH. The old icon (hooded wraith with lightning) is not readable as movement; the user wants anyone to recognize running/dashing at a glance.
- 장면: Hooded necromancer seen from the side, sprinting from left to right, body leaning forward, cloak snapping back; behind the figure 2-3 translucent spectral after-images fading to the left (ghost echoes of the same pose) plus a short horizontal streak; faint blue-white shimmer on the body suggesting invulnerability. The figure should be clearly human and in motion (not floating, not a ghost, not lightning).
- 피할 것: No lightning bolts, no skull-only composition, no neon violet, no pixel-art chunky style (the held Codex draft), no cape bigger than the body.
- 악센트: movement accent = cold spirit blue-white (#8ea9e3, #53659b) for the trail only; body stays bone ivory/ochre cloth
- 크기: 128x128 RGBA, fully opaque (match v2 main set; game scales down)
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/current-wraith_dash-v4.png (RUID 65447baebee04e59b1552fd4807a88fe)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/active-main-v2/main-bone_rite.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/active-main-v2/main-bone_shard.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/active-main-v2/main-bone_armor.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy MAIN SKILL icon in the exact style of the approved 'skill icons v2 main' set: a FULL-BLEED OPAQUE square scene, near-black background (#0d0d0d to #151317) with soft dark vignette toward the corners, subject lit by one warm key light from upper-left plus a restrained colored rim glow. Painterly volumes, NOT pixel art, NOT flat vector. Palette: bone ivory/ochre (#a48d6c, #b79160, #624c34) on near-black; one accent color only. Subject fills 70-85% of the square, big silhouette, 2-3 main forms, legible at 64x64 and still readable at 48x48 (mobile pad). No text, no explicit frame or border (the set only has a slightly darker 2 px edge), no bright backdrop, no particle confetti, no photo-real gore. SUBJECT: a hooded necromancer in side view sprinting left-to-right across the square, strong forward lean, one knee driven forward, cloak and loose wrappings streaming behind; two or three translucent ghostly after-images of the same runner trail off to the left and fade, with a short cold blue-white speed streak; a faint blue-white shimmer outlines the body. Mood: dark grave-kingdom, decisive burst of speed. movement accent = cold spirit blue-white (#8ea9e3, #53659b) used only for the trail/shimmer.
```

### rite_fork — 갈래 (B-node · command)
- 효과: Bone Nova bomb: +1 charging skeleton per rank; Bone Nova whirl: +1 extra whirl branch per rank (branch deals 60%).
- 쓰이는 곳: Upgrade node under Bone Nova in the skill window (48 px node slot, 96 px tooltip).
- 반드시 읽혀야 할 것: Splitting / branching: ONE thing becoming TWO (or three) going separate ways.
- 장면: A single bone whirlwind (spinning ring of bones with a small skull at its core) splitting into a Y: at the top two smaller whirls peel off left and right, each with its own skull; the stem below is one. Read as a clear Y-shaped fork.
- 피할 것: No two static skulls side by side (that was the rejected temp), no spear/arrow symbols, no three identical copies.
- 악센트: command tree accent = violet spectral glow (#512d57 to #8a4fa0, highlights #c9a6e0)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/current-rite_fork-temp.png (RUID cb915a651108489f84df93fe25119e27)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-bomb_wide.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-mage_legion.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-skel_legion.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a Y-shaped fork of bone whirlwinds - one bone whirl at the bottom (ring of ivory bone shards spinning around a small skull core) that splits upward into two smaller whirls leaving in opposite directions, each with its own small skull; violet spectral glow inside the whirls. command tree accent = violet spectral glow (#512d57 to #8a4fa0, highlights #c9a6e0)
```

### rite_reach — 뼈의 길 (B-node · command)
- 효과: Bone Nova whirl dash distance +1.5 tiles per rank (base 5 tiles).
- 쓰이는 곳: Upgrade node under Bone Nova (48 px slot, 96 px tooltip).
- 반드시 읽혀야 할 것: Reach / distance: the whirl travels FAR along a long straight path.
- 장면: A bone whirlwind at the right end of a long diagonal trail of bone fragments and violet dust that stretches from the lower-left corner almost to the upper-right, with faint distance ticks (small bone chips) along the path; the whirl is clearly far from its start point.
- 피할 것: No spear, no portal, no running figure (that is the Dash icon).
- 악센트: command tree accent = violet spectral glow (#512d57 to #8a4fa0, highlights #c9a6e0)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/current-rite_reach-temp.png (RUID a61ff4f1cfc44c0c9f2213078fd5fd84)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-bomb_wide.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-dash_ghost.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-step_gale.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a small bone whirlwind (ring of ivory bone shards around a skull core) that has traveled far: a long diagonal trail of fading bone chips and violet dust runs from the lower-left corner to the whirl at the upper-right, the trail tapering and fading at its start, three small bone chips spaced like distance marks along it. command tree accent = violet spectral glow (#512d57 to #8a4fa0, highlights #c9a6e0)
```

### armor_thick — 급속 골화 (B-node · soul)
- 효과: When Bone Armor is fully broken, it re-forms 2 s later at 15% of max per rank (once per cast).
- 쓰이는 곳: Upgrade node under Bone Armor (48 px slot, 96 px tooltip).
- 반드시 읽혀야 할 것: Re-forming after breaking: shattered bone shell knitting itself back together.
- 장면: A rib-cage bone shell (same object family as the approved Bone Armor nodes) cracked open on one side, with the missing pieces floating back into place along the crack, seams glowing steel-blue as they fuse; motion is inward (pieces returning), not outward (not exploding).
- 피할 것: No outward burst (that is the approved "bursting armor" node), no shield badge, no green healing cross, no clock face.
- 악센트: soul tree accent = cold steel-blue spirit glow (#3a466c, #53659b, highlight #8ea9e3)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/I-armor-cur-node-armor_thick.png (RUID 325b0ad0a5a54f7296bfe59cb0ac5ecb)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-armor_thorns.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-frost_shatter.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-offering_wide.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a cracked rib-cage bone shell being rebuilt - the shell is split by a jagged crack and several broken bone pieces hover just outside it drifting back INTO the gap, the seams and the gap glowing cold steel-blue as the bone knits together; clear sense of reassembly, pieces converging inward. soul tree accent = cold steel-blue spirit glow (#3a466c, #53659b, highlight #8ea9e3)
```

### shard_spike — 유도탄 (B-node · soul)
- 효과: Ricochet reach +1 tile per rank (base 4 tiles): a bouncing shard can seek a farther enemy.
- 쓰이는 곳: Upgrade node under Teeth / bone shard (48 px slot, 96 px tooltip).
- 반드시 읽혀야 할 것: A shard that BOUNCES and then flies farther: an angled path with a longer second leg.
- 장면: One ivory bone shard (curved tooth-like, same family as the approved Teeth nodes) shown at the end of a two-segment path: a short first leg hits a small dark skull at the bend, then a longer second leg continues to the upper-right with a steel-blue motion trail; small chevrons on the second leg suggest extra reach.
- 피할 것: No fletched arrow, no crosshair/target reticle, no straight single flight line.
- 악센트: soul tree accent = cold steel-blue spirit glow (#3a466c, #53659b, highlight #8ea9e3)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/I-spike-cur-node-shard_spike.png (RUID 78c14e41a2644e6c8f4733fff60b6766)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-shard_bounce.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-frost_shatter.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-step_gale.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a curved ivory bone shard ricocheting - a short dim first path leg strikes a small dark skull at the bend, then the shard continues on a longer bright second leg toward the upper-right with a cold steel-blue motion trail; the bend angle is obvious and the second leg is clearly longer than the first. soul tree accent = cold steel-blue spirit glow (#3a466c, #53659b, highlight #8ea9e3)
```

### flame_hex — 피투성이 난장판 (B-node · soul)
- 효과: Hexblast explosion radius +15% per rank.
- 쓰이는 곳: Upgrade node under Hexblast (48 px slot, 96 px tooltip). Hexblast explodes cursed targets (purple burst).
- 반드시 읽혀야 할 것: A BIGGER blast radius: the burst plus a wider outer ring of blood splatter.
- 장면: A small cursed skull bursting at the center; around it a thick inner ring of violet-red hex fire and, clearly outside it, a second wider broken ring of dark blood droplets/splatter marking the enlarged radius; the outer ring is the point.
- 피할 것: No brand/sigil-only composition, no single flame, no neon.
- 악센트: hexblast accent = muted cursed violet-red (#6b2a5a, #a33a5a) with dark blood droplets (#5a1a1a, #8a2a2a)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/I-hex-cur-node-flame_hex.png (RUID 925653b8f3eb46e4941c6662aba0a63c)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-curse_area.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-bomb_wide.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-frost_shatter.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a cursed skull bursting at the center with a thick inner ring of muted violet-red hex fire, and a second, clearly wider, broken outer ring of dark blood droplets and splatter marks that shows the explosion radius has grown; two concentric rings read even at small size. hexblast accent = muted cursed violet-red (#6b2a5a, #a33a5a) with dark blood droplets (#5a1a1a, #8a2a2a).
```

### enfeeble_deep — 약화의 오라 (B-node · curse)
- 효과: Weaken curse area +20% per rank.
- 쓰이는 곳: Upgrade node under Weaken (48 px slot, 96 px tooltip). Weaken is a red curse area that lowers enemy damage.
- 반드시 읽혀야 할 것: A WIDER curse aura: expanding red rings, the outer one larger and dotted.
- 장면: A bowed, drooping skull (weakened) at the center with a cracked sword tip hanging down; around it two or three concentric blood-red aura rings expanding outward, the outermost drawn as a wider dotted ring to show the enlarged area.
- 피할 것: No downward-arrow debuff badge, no bare circle, no violet (that is command).
- 악센트: curse tree accent = blood red (#b43937, #ef2f28, highlight #f94c24)
- 크기: 96x96 RGBA transparent
- 현재(임시) 아이콘: /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/current-temp/I-weak-cur-node-enfeeble_deep.png (RUID f62c4c9525404fea9140b45642c230d8)
- 참고 원본(승인본):
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-curse_area.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-skel_legion.png
  - /Users/leeinguk/Documents/New project/maple-quality-remediation-20261029/claude-icon-brief-20261104/refs/node-v3/node-offering_wide.png
- 영문 프롬프트:

```
Hand-painted dark-fantasy icon in the exact style of the approved 'skill node icons v3' set: ONE centered object/scene cut out on a FULLY TRANSPARENT background (no backdrop, no frame, no vignette). Painterly soft shading with visible brush volumes (NOT pixel art, NOT flat vector, NOT thin line-art). Every shape closed by a 1-2 px dark plum/near-black outline (#1a1016 to #201316) so it reads on dark UI. Muted palette: bone ivory/ochre (#fdd1a8, #ad8c6a, #946d5a, #4c352d) for bone and flesh, deep plum shadows (#201316, #2d1a2a); one tree accent only. Lighting: one soft warm key light from upper-left, restrained rim glow in the accent color, no bloom halos. Silhouette strong and chunky: 2-3 main forms max, no small clutter, no particle confetti. Subject fills about 85% of the square (keep >=6 px clear margin at 96x96 on every side), slightly overflowing diagonal composition is fine. Legible at 48x48 and still identifiable at 32x32. No text, letters, numbers, runes-as-text, UI frames, borders, drop shadows on the canvas, photo-real gore, cute faces. SUBJECT: a drooping, bowed skull at the center with a cracked sword tip sagging below it, surrounded by two or three concentric blood-red aura rings that expand outward, the outermost ring wider and drawn as a dotted broken circle to show the growing area of the curse; red glow strongest at the inner ring and fading outward. curse tree accent = blood red (#b43937, #ef2f28, highlight #f94c24)
```
