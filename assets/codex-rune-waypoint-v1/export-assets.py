"""Export imagegen originals at game upload sizes; keep generated alpha."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import csv, hashlib, json, zipfile
root = Path(__file__).resolve().parent
rows = list(csv.DictReader((root / 'UPLOAD-MAPPING.csv').open()))
checks = []
for row in rows:
    key = row['key']
    src = root / 'originals' / (key + '.png')
    im = Image.open(src)
    assert im.mode == 'RGBA', (key, im.mode)
    size = (256, 160) if key.startswith('waypoint_') else (128, 128)
    assert abs(im.width / im.height - size[0] / size[1]) < .08, (key, im.size)
    out = im.resize(size, Image.Resampling.LANCZOS)
    dest = root / 'png' / (key + '.png')
    out.save(dest)
    alpha = out.getchannel('A')
    assert alpha.getextrema() == (0, 255), (key, alpha.getextrema())
    assert all(alpha.getpixel(p) == 0 for p in [(0,0),(size[0]-1,0),(0,size[1]-1),(size[0]-1,size[1]-1)]), key
    checks.append({'key':key, 'name':row['name'], 'tier':row['tier'], 'size':size,
                   'mode':out.mode, 'alpha_range':alpha.getextrema(), 'alpha_bbox':alpha.getbbox(),
                   'bytes':dest.stat().st_size, 'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
assert len(checks) == 26
assert len({x['sha256'] for x in checks}) == 26
(root / 'checks.json').write_text(json.dumps({'count':26,'assets':checks},ensure_ascii=False,indent=2)+'\n')
font_path = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
font = ImageFont.truetype(font_path, 18)
heading = ImageFont.truetype(font_path, 24)
sheet = Image.new('RGB', (1320, 1050), '#141218')
draw = ImageDraw.Draw(sheet)
draw.text((24,16),'룬 24종 · 웨이포인트 2종 — 업로드용 자산 미리보기',font=heading,fill='#ead3a1')
y = 64
for tier, label, color in [('low','낮은 룬 · Lv1 · 회색','#b9bcc7'),('mid','중간 룬 · Lv20 · 청동/주황','#d6a275'),('high','높은 룬 · Lv45 · 검붉은 돌','#d88c91'),('top','최상위 룬 · Lv65 · 검정/금빛','#e5c577')]:
    draw.text((24,y),label,font=font,fill=color)
    for idx, row in enumerate(r for r in rows if r['tier']==tier):
        x = 24 + idx * 162
        draw.rounded_rectangle((x,y+27,x+148,y+188),radius=8,fill='#25222b')
        icon=Image.open(root/'png'/row['filename'])
        sheet.paste(icon,(x+10,y+31),icon)
        draw.text((x+12,y+160),row['name']+' · '+row['key'].replace('r_',''),font=font,fill='#e1dce7')
    y += 204
for idx,key in enumerate(['waypoint_off','waypoint_on']):
    x=24+idx*390
    draw.rounded_rectangle((x,y+4,x+368,y+168),radius=8,fill='#25222b')
    icon=Image.open(root/'png'/(key+'.png'))
    sheet.paste(icon,(x+56,y+7),icon)
    draw.text((x+12,y+56),'꺼짐' if idx==0 else '켜짐',font=font,fill='#d8d2df')
draw.text((818,y+34),'PNG 26장 / 투명 배경\n룬 128×128\n웨이포인트 256×160\n게임 적용 전 생성 이미지',font=font,fill='#bcb5c6')
sheet.save(root/'contact-sheet.png')
with zipfile.ZipFile(root/'rune-waypoint-assets-20261009.zip','w',zipfile.ZIP_DEFLATED) as z:
    for row in rows:z.write(root/'png'/row['filename'],'png/'+row['filename'])
    for name in ['UPLOAD-MAPPING.csv','CLAUDE-HANDOFF.md','checks.json','contact-sheet.png']:
        z.write(root/name,name)
print('PASS: 26 RGBA images, correct dimensions, transparent corners, distinct SHA256, ZIP complete')
