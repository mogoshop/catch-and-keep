from PIL import Image, ImageDraw, ImageFont
B="/private/tmp/claude-502/-Users-leeinguk-Desktop-hoho-------/996d49f7-49cf-4627-8ae2-6c4e2c8354ba/"
im=Image.open(B+"images/48.webp").convert("RGB")
f=ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc",22)
a=im.crop((0,330,330,571)).resize((990,723),Image.NEAREST)
b=im.crop((560,280,788,470)).resize((684,570),Image.NEAREST)
c=im.crop((100,40,480,240)).resize((760,400),Image.NEAREST)
W=990+684+20; out=Image.new("RGB",(W,723+400+150),(18,17,22)); d=ImageDraw.Draw(out)
out.paste(a,(0,60)); out.paste(b,(1010,60)); out.paste(c,(0,723+120))
d.text((10,10),"① 아래 가장자리: 2:1 마름모 계단 → 아이소메트릭 타일 격자 · 흙↔잔디는 타일 경계를 넘는 부드러운 섞기",fill=(235,225,200),font=f)
d.text((1010,640),"② 벚나무: 같은 모양·같은 명암이 반복 →\n   한 장 그림이 아니라 프롭 스프라이트 복제",fill=(235,225,200),font=f)
d.text((10,723+75),"③ 절벽 테두리: 같은 결의 띠가 바깥 둘레를 따라 이어짐 → 테두리 조각(오토타일) 추정 · 윗면 밝고 안쪽 벽면 어두움",fill=(235,225,200),font=f)
d.text((780,723+150),"참고 그림(사용자 첨부 48.webp · 788×571) 확대 3배/2배 · 최근접 확대\n판정: 「한 장 그림 + 충돌」이 아니라 「타일(지형 섞기) + 테두리 조각 + 프리렌더 프롭」\n근거: 마름모 계단 가장자리 · 동일 나무 반복 · 둘레를 도는 같은 절벽 결 · 프롭마다 같은 명암 방향(추정)\n(축소 캡처라 원본 텍셀 밀도·제작 도구·빛 방향 정밀값은 미확인)",fill=(200,195,185),font=f)
out.save(B+"scratchpad/m59/ref-analysis.png")
