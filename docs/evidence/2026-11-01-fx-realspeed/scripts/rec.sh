#!/bin/bash
# usage: rec.sh name seconds  (화면 1 = 메이커 · 게임 영역 crop · 30fps)
S=/private/tmp/claude-502/-Users-leeinguk-Desktop-hoho-------/566de651-c506-4c42-af36-7730dae708d6/scratchpad
python3 -c "import datetime;print(datetime.datetime.now().strftime('%H:%M:%S.%f'))" > $S/rec/$1.start.txt
ffmpeg -hide_banner -y -f avfoundation -framerate 30 -capture_cursor 0 -i "Capture screen 1:none" -t $2 -vf "crop=2196:1236:786:236,scale=1920:-2" -c:v libx264 -crf 18 -pix_fmt yuv420p $S/rec/$1.mp4 > $S/rec/$1.ffmpeg.log 2>&1
python3 -c "import datetime;print(datetime.datetime.now().strftime('%H:%M:%S.%f'))" >> $S/rec/$1.start.txt
