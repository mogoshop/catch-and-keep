import csv, hashlib, json, os, sys
M="/Users/leeinguk/Desktop/hoho/잡으면 내편"
W=M+"/.claude/worktrees/agent-a4c1f510674b5e346"
A=M+"/assets/codex-bone-giants-v1"
OUT=W+"/docs/evidence/2026-10-30-s48v2-A"
SH="/Users/leeinguk/Documents/New project/maple-quality-remediation-20261029"
CANON="/Users/leeinguk/Documents/New project/art-summon48-spectacle-v2-20261030/style-audit/canon155-handoff.csv"
UPLOADED=SH+"/summon48-spectacle-upload-V4-150.json"   # 메이커 담당 업로드 결과 (오면 새 RUID를 채운다)
def sha(p):
    if not p or not os.path.exists(p): return None
    return hashlib.sha256(open(p,'rb').read()).hexdigest()
canon={r['key']:r for r in csv.DictReader(open(CANON,encoding='utf-8-sig'))}
assert len(canon)==155
canon_file_ok=sum(1 for r in canon.values() if sha(r['canonical_absolute_file'])==r['sha256'])
# 업로드 결과(있으면): key 또는 sha → RUID
up_by_sha={}
UPCSV=UPLOADED.replace('.json','.csv')
up_rows={}
if os.path.exists(UPCSV):
    for it in csv.DictReader(open(UPCSV,encoding='utf-8-sig')):
        assert it['canon_sha256']==canon[it['key']]['sha256'], it['key']
        up_by_sha[it['canon_sha256']]=it['ruid']; up_rows[it['key']]=it
# 이미 canon sha로 올린 RUID가 있는지: 기존 모든 업로드 표(goal-E · full66 · canon csv ruid 칸)
for r in canon.values():
    if r.get('ruid'): up_by_sha.setdefault(r['sha256'],r['ruid'])
old={}
for r in csv.DictReader(open(W+"/docs/evidence/2026-10-30-goal-E/upload-pack/resource-mapping.csv",encoding='utf-8-sig')):
    p=os.path.normpath(os.path.join(M+"/docs/evidence/2026-10-30-goal-E/upload-pack",r['file']))
    old[r['RUID']]=(r['key'],p)
full={}
for sub in ["upload-48-66","upload-48-mage-skill1"]:
    base=A+"/full-skills48-20261030/"+sub
    for r in csv.DictReader(open(base+"/resource-mapping.csv",encoding='utf-8-sig')):
        full[r['RUID']]=(r['key'],os.path.normpath(os.path.join(base,r['file'])),r['upload_name'])
old_sha_uploaded={}   # 구형 업로드의 sha → RUID (canon과 같은 그림이 이미 올라가 있는지)
for ru,(k,p) in old.items(): old_sha_uploaded[sha(p)]=ru
rows=[]; remap=[]; uploads=[]; summary={}
for i,r in enumerate(csv.reader(open(W+"/data/monster_frames.csv",encoding='utf-8'))):
    if i==0 or not r[0].startswith("form_giant"): continue
    mon,state,frames,delays=r[0],r[1],r[2].split(';'),r[3].split(';')
    kind=mon.replace("form_giant_","")
    for idx,ru in enumerate(frames):
        rec={"line":i+1,"form":kind,"state":state,"frame":idx+1,"ruid":ru,"delay_s":float(delays[idx])}
        if ru in old:
            key,p=old[ru]; s=sha(p)
            c=canon[key]
            new=up_by_sha.get(c['sha256']) or old_sha_uploaded.get(c['sha256'])
            rec.update(pack="goal-E upload-pack (J203 구형)",key=key,png=os.path.relpath(p,M),sha256=s,canon_sha256=c['sha256'],is_V4=(s==c['sha256']))
            change="keep" if s==c['sha256'] else ("replace" if new else "replace_pending_upload")
            remap.append({"monster":mon,"state":state,"frame":idx+1,"old_ruid":ru,"old_key":key,"old_sha256":s,
              "new_ruid":(ru if s==c['sha256'] else (new or "PENDING_UPLOAD:s48v2-v4-"+key)),"canon_key":key,"canon_file":c['canonical_relative_file'],"canon_sha256":c['sha256'],
              "pivot_x":c['pivot_x'],"pivot_y":c['pivot_y'],"width":c['width'],"height":c['height'],"canon_duration_ms":c['duration_ms'],"current_delay_s":delays[idx],
              "canon_loop":c['loop'],"canon_hit":c['hit'],"canon_hit_time_ms":c['hit_time_ms'],"change":change})
            if change=="replace_pending_upload":
                uploads.append({"upload_name":"s48v2-v4-"+key,"key":key,"png":c['canonical_absolute_file'],"sha256":c['sha256'],"group":"OJYYQ","category":"sprite","subcategory":"object",
                  "pivot_x":c['pivot_x'],"pivot_y":c['pivot_y'],"filter_mode":"Point","wrap_mode":"Clamp","size":c['width']+"x"+c['height']})
        elif ru in full:
            key,p,un=full[ru]; s=sha(p)
            rec.update(pack="full66 기술 몸",key=key,upload_name=un,png=os.path.relpath(p,M),sha256=s,is_V4="V4 계열(full66 · canon 범위 밖)")
            remap.append({"monster":mon,"state":state,"frame":idx+1,"old_ruid":ru,"old_key":key,"old_sha256":s,"new_ruid":ru,"canon_key":"","canon_file":"","canon_sha256":"",
              "pivot_x":"0.5","pivot_y":"0.03125","width":"","height":"","canon_duration_ms":"","current_delay_s":delays[idx],"canon_loop":r[4],"canon_hit":"","canon_hit_time_ms":"","change":"keep"})
        else:
            rec.update(pack="UNKNOWN")
        rows.append(rec)
        k=kind+"/"+state; summary.setdefault(k,{"frames":0,"pack":rec.get('pack'),"V4":0,"delays":r[3],"loop":r[4],"impact":r[6] if len(r)>6 else ""})
        summary[k]["frames"]+=1; summary[k]["V4"]+= 1 if (rec.get('is_V4') is True or isinstance(rec.get('is_V4'),str)) else 0
# 타이밍 대조 (canon ms vs 지금 delays)
tim_mis=[x for x in remap if x['canon_duration_ms'] and abs(float(x['canon_duration_ms'])/1000-float(x['current_delay_s']))>1e-6]
# HUD 5: ui_icons RUID → 업로드 파일 sha vs canon
hud=[]
icons={r['key']:r for r in csv.DictReader(open(W+"/data/ui_icons.csv",encoding='utf-8-sig'))}
oldkey={v[0]:(k,v[1]) for k,v in old.items()}
for key in ["ui_giant_basic","ui_giant_shield","ui_giant_greatsword","ui_giant_twin","ui_giant_mage"]:
    cur=icons[key]['ruid']; c=canon[key]
    ru,p=oldkey[key]; s=sha(p)
    same=(s==c['sha256'])
    new=cur if same else (up_by_sha.get(c['sha256']) or "PENDING_UPLOAD:s48v2-v4-"+key)
    hud.append({"key":key,"current_ruid":cur,"current_matches_goalE_upload":cur==ru,"current_png":os.path.relpath(p,M),"current_sha256":s,"canon_file":c['canonical_relative_file'],"canon_sha256":c['sha256'],"same":same,"new_ruid":new,"change":"keep" if same else ("replace" if not new.startswith("PENDING") else "replace_pending_upload")})
    if not same and new.startswith("PENDING"):
        uploads.append({"upload_name":"s48v2-v4-"+key,"key":key,"png":c['canonical_absolute_file'],"sha256":c['sha256'],"group":"OJYYQ","category":"sprite","subcategory":"etc(ui · 기존 ui_giant_* 업로드와 같은 분류로)",
          "pivot_x":c['pivot_x'],"pivot_y":c['pivot_y'],"filter_mode":"Point","wrap_mode":"Clamp","size":c['width']+"x"+c['height']})
json.dump(rows,open(OUT+"/body-binding-audit.json","w"),ensure_ascii=False,indent=1)
json.dump(summary,open(OUT+"/body-binding-summary.json","w"),ensure_ascii=False,indent=1)
with open(OUT+"/frames-remap.csv","w",newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(remap[0].keys()),lineterminator='\n'); w.writeheader(); w.writerows(remap)
with open(OUT+"/hud-remap.csv","w",newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(hud[0].keys()),lineterminator='\n'); w.writeheader(); w.writerows(hud)
json.dump({"source_canon":CANON,"source_canon_sha256":sha(CANON.replace('.csv','.json')),"canon_csv_sha256":sha(CANON),"count":len(uploads),"items":uploads},open(OUT+"/upload-requests-v4.json","w"),ensure_ascii=False,indent=1)
print("canon files sha ok",canon_file_ok,"/155 · uploaded-result file",os.path.exists(UPLOADED))
print("rows",len(rows),"replace(known ruid)",sum(1 for x in remap if x['change']=='replace'),"pending",sum(1 for x in remap if x['change']=='replace_pending_upload'),"keep",sum(1 for x in remap if x['change']=='keep'),"unknown",sum(1 for x in rows if x['pack']=='UNKNOWN'))
print("old==canon bytes:",sum(1 for x in rows if x.get('is_V4') is True),"timing mismatch vs canon:",len(tim_mis))
print("HUD:",[(h['key'],h['current_matches_goalE_upload'],h['same']) for h in hud])
print("upload requests",len(uploads))
