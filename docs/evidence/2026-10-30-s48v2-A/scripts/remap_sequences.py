import csv, json, sys
M="/Users/leeinguk/Desktop/hoho/잡으면 내편"
W=M+"/.claude/worktrees/agent-a4c1f510674b5e346"
A=M+"/assets/codex-bone-giants-v1"
OUT=W+"/docs/evidence/2026-10-30-s48v2-A"
# 줄 단위 적용표 (부모가 data/monster_frames.csv 거인 줄에 그대로 넣을 수 있게) · 선택: 인자로 적용할 monster_frames 경로를 주면 그 파일에 적용(검사용 로컬)
timing=json.load(open(A+"/v4-redesign-20261030/animation-timing.json"))["states"]
IMPACT_PROPOSAL={
 ("form_giant_greatsword","skill1"):("0","회전 타격 gap 0.4초마다 t=0부터 · 6칸 0.4초 루프 첫 칸"),
 ("form_giant_greatsword","skill2"):("3","땅 가르기 첫 토막 plant 0.3초 = 칸3 시작 0.3초"),
 ("form_giant_shield","skill2"):("3","내려찍기 FX 0.12초 = 칸3 시작 0.12초 (서버 피해는 지금 0초 → B에 맞춤 요청)"),
 ("form_giant_mage","skill1"):("2","노바 영창 0.3초 뒤 폭발 = 칸2 시작 0.3초"),
 ("form_giant_twin","skill2"):("","돌진은 순간 이동+즉시 피해 · 몸 타격 칸 정렬 없음(빈칸 유지)"),
 ("form_giant_mage","skill2"):("","기도 루프 · 피해는 영창+낙하 뒤 FX · 빈칸 유지"),
}
remap=list(csv.DictReader(open(OUT+"/frames-remap.csv",encoding='utf-8')))
by={}
for x in remap: by.setdefault((x['monster'],x['state']),[]).append(x)
rows=list(csv.reader(open(W+"/data/monster_frames.csv",encoding='utf-8')))
seqs=[]
for i,r in enumerate(rows):
    if i==0 or not r[0].startswith("form_giant"): continue
    key=(r[0],r[1]); xs=by[key]
    old_imp=r[6] if len(r)>6 else ""
    if xs[0]['canon_key']=='':
        imp,why=IMPACT_PROPOSAL.get(key,(old_imp,""))
        seqs.append({"line":i+1,"monster":r[0],"state":r[1],"frames":r[2],"delays":r[3],"loop":r[4],"clip":r[5],"impact":imp,"impact_before":old_imp,"timing_source":"full66 skill body (keep)","note":why})
    else:
        t=timing[r[1]]
        assert all(not x['new_ruid'].startswith('PENDING') for x in xs)
        frames=";".join(x['new_ruid'] for x in xs)
        delays=";".join(("%g" % (t['duration_ms']/1000)) for _ in xs)
        assert len(xs)==t['count']
        imp="" if t['hit_index0'] is None else str(t['hit_index0'])
        seqs.append({"line":i+1,"monster":r[0],"state":r[1],"frames":frames,"delays":delays,"loop":"true" if t['loop'] else "false","clip":r[5],"impact":imp,"impact_before":old_imp,"timing_source":"canon V4 animation-timing.json","note":"J203 -> V4 canon (summon48-spectacle-upload-V4-150)"})
with open(OUT+"/frames-remap-sequences.csv","w",newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(seqs[0].keys()),lineterminator='\n'); w.writeheader(); w.writerows(seqs)
same=sum(1 for s in seqs if s['timing_source'].startswith('canon') and s['delays']==rows[s['line']-1][3] and s['loop']==rows[s['line']-1][4] and s['impact']==(rows[s['line']-1][6] if len(rows[s['line']-1])>6 else ''))
print("sequences",len(seqs),"canon rows",sum(1 for s in seqs if s['timing_source'].startswith('canon')),"canon rows with identical delays/loop/impact",same)
if len(sys.argv)>1:
    dst=sys.argv[1]
    for s in seqs:
        r=rows[s['line']-1]
        while len(r)<7: r.append("")
        r[2],r[3],r[4],r[6]=s['frames'],s['delays'],s['loop'],s['impact']
    with open(dst,"w",newline='',encoding='utf-8') as f:
        csv.writer(f,lineterminator="\n").writerows(rows)
    print("applied to",dst)
