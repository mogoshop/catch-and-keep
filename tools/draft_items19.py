# docs/design/19 3단계 초안: 유니크 ~60 · 세트 9 · 룬워드 18 → docs/design/19-drafts/*.csv
# 기존 행은 id·베이스·옵션을 그대로 두고 계열(tree)만 붙인다 (이미 가진 아이템이 깨지지 않게).
import csv, io, os
OUT = 'docs/design/19-drafts/'
def rd(p): return list(csv.DictReader(open(p, encoding='utf-8')))
def wr(p, rows, H):
    o = io.StringIO(); w = csv.DictWriter(o, fieldnames=H, lineterminator='\n'); w.writeheader(); w.writerows(rows)
    open(p, 'w', encoding='utf-8').write(o.getvalue())

# ── 유니크 ──
U = rd('data/item_uniques.csv')
tree = {'dead_touch': 'command', 'whisper_branch': 'curse', 'ashen_crown': 'command', 'shadow_lord_lamp': 'command',
        'gravekeeper_shroud': 'any', 'black_oath': 'command', 'gravequeen_crown': 'command', 'gravequeen_hand': 'command',
        'headsman_chain': 'command', 'barg_seal': 'curse', 'high_priest_censer': 'soul', 'sand_veil': 'any',
        'ashen_veil_robe': 'command', 'ashen_veil_gloves': 'command', 'ashen_veil_boots': 'any', 'ashen_veil_scythe': 'command',
        'ashen_veil_lantern': 'curse', 'admiral_compass': 'soul', 'drowned_mantle': 'any'}
for r in U: r['tree'] = tree[r['id']]
def u(id, base, name, mods, special, tr, source=''):
    return {'id': id, 'base': base, 'name': name, 'mods': mods, 'special': special, 'source': source, 'weight': '', 'tree': tr}
new_u = [
    # 일반형 보강 — 영혼 4 · 저주 1
    u('bone_caller', 'staff15', '뼈를 부르는 손', 'ene=12,mana=25,fcr=10', 'treeSoul=1,spellDmg=10', 'soul'),
    u('pyre_lamp', 'lamp15', '화장터의 등불', 'fireDmg=8,ene=10,fireRes=20', 'spellDmg=15', 'soul'),
    u('marrow_helm', 'helm15', '골수 투구', 'def=15,mana=30,ene=8', 'sk_bone_spear=1', 'soul'),
    u('shard_ring', 'ring1', '골편 반지', 'dmgFlat=6,ene=8,mana=20', 'sk_bone_shard=2', 'soul'),
    u('cult_fingers', 'gloves15', '교단의 손가락', 'fcr=10,ene=8,poisonRes=20', 'treeCurse=1,curseDur=15', 'curse'),
    # 강화형 20 — 소환 6 · 영혼 6 · 저주 4 · 범용 4 (보스 5종은 악몽 보스 전용)
    u('legion_banner', 'lamp4', '군기 등롱', 'minion=50,ene=15,mana=40', 'treeCommand=1,minionIas=15', 'command'),
    u('bone_marshal', 'helm5', '뼈 원수의 투구', 'def=60,minion=35,life=40', 'treeCommand=1,deploy=1', 'command'),
    u('legion_reaper', 'scythe4', '군단을 베는 낫', 'dmgPct=140,minion=40,life=40', 'sk_raise_skeleton=2,minionPoison=12', 'command'),
    u('warden_hand', 'gloves4', '간수의 손', 'ias=25,minion=30,leech=6', 'minionIas=20', 'command'),
    u('queen_veil', 'armor4', '여왕의 장례 베일', 'def=90,minion=40,allRes=15', 'treeCommand=2', 'command', 'grave_queen'),
    u('barg_banner', 'amulet2', '바르그의 군기', 'minion=35,coldRes=30,fcr=15', 'treeCommand=1,minionRes=20', 'command', 'skel_captain'),
    u('marrow_staff', 'staff4', '골수 지팡이', 'ene=25,mana=60,fcr=15', 'treeSoul=1,spellDmg=25', 'soul'),
    u('lancer_hood', 'helm4', '창술사의 두건', 'def=50,ene=15,mana=40', 'sk_bone_spear=2,spellDmg=15', 'soul'),
    u('soulfire_lamp', 'lamp5', '혼불 등롱', 'ene=20,fireDmg=20,fireRes=25', 'treeSoul=1,spellDmg=20', 'soul'),
    u('torrent_seal', 'ring2', '격류의 인장', 'lightDmg=20,ene=15,mana=30', 'spellDmg=20,sk_soul_torrent=1', 'soul'),
    u('priest_mitre', 'helm6', '대사제의 관', 'def=65,fireRes=35,ene=20,fcr=15', 'treeSoul=2', 'soul', 'high_priest'),
    u('admiral_tide', 'staff5', '제독의 해일 지팡이', 'dmgPct=120,lightDmg=25,coldRes=30', 'treeSoul=1,spellDmg=30', 'soul', 'admiral'),
    u('zealot_hood', 'helm3', '광신자의 두건', 'def=45,fcr=15,poisonRes=30', 'treeCurse=1,curse=30', 'curse'),
    u('hex_knot', 'belt4', '저주 매듭 요대', 'life=50,def=30,allRes=12', 'curseDur=25,curseEff=15', 'curse'),
    u('headsman_noose', 'belt5', '처형인의 올가미', 'life=60,str=15,fireRes=30', 'treeCurse=1,curseEff=20', 'curse', 'headsman'),
    u('wraith_step', 'boots4', '망령의 걸음', 'ms=15,def=30,coldRes=30', 'treeCurse=1,curse=25', 'curse'),
    u('pilgrim_plate', 'armor5', '순례자의 갑주', 'def=110,life=70,allRes=20', 'regen=6', 'any'),
    u('gilded_boots', 'boots5', '도금된 장화', 'ms=20,def=35,gf=60', 'mf=30', 'any'),
    u('ward_ring', 'ring2', '수호의 고리', 'allRes=20,life=40,def=20', 'leech=4', 'any'),
    u('thorn_vine', 'gloves5', '가시 덩굴 장갑', 'ias=25,dmgFlat=15,poisonDmg=20', 'leech=6', 'any'),
    # 정예형 20 — 소환 6 · 영혼 6 · 저주 4 · 범용 4 (보스 5종은 지옥 보스 전용)
    u('lich_lantern', 'lamp6', '리치 군주의 등불', 'minion=80,ene=25,mana=80', 'treeCommand=2,minionIas=25', 'command'),
    u('deathknight_helm', 'helm7', '죽음 기사의 투구', 'def=110,minion=55,life=80', 'treeCommand=2,deploy=1', 'command'),
    u('legion_lord_scythe', 'scythe6', '군단장의 낫', 'dmgPct=220,minion=60,life=70', 'sk_raise_skeleton=3,minionIas=20', 'command'),
    u('abyss_gauntlet', 'gloves7', '심연의 건틀릿', 'ias=35,minion=45,leech=8', 'minionRes=30,minionPoison=25', 'command'),
    u('queen_throne', 'armor9', '여왕의 왕좌 갑주', 'def=170,minion=60,allRes=25,life=100', 'treeCommand=3', 'command', 'grave_queen'),
    u('barg_crown', 'amulet3', '바르그의 왕관 인장', 'minion=55,coldRes=40,fcr=20', 'treeCommand=2,minionRes=25', 'command', 'skel_captain'),
    u('abyss_scepter', 'staff6', '심연을 읽는 홀', 'ene=40,mana=100,fcr=25', 'treeSoul=2,spellDmg=40', 'soul'),
    u('soulhorn_scythe', 'scythe7', '혼각을 베는 낫', 'dmgPct=200,ene=30,mana=60', 'sk_bone_spear=3,spellDmg=35', 'soul'),
    u('torrent_lantern', 'lamp7', '영혼 급류 등롱', 'ene=35,lightDmg=30,coldRes=35', 'treeSoul=2,spellDmg=30', 'soul'),
    u('oracle_crown', 'helm10', '명계 예언자의 관', 'def=120,ene=30,mana=80,fcr=20', 'treeSoul=2,sk_death_wave=2', 'soul'),
    u('priest_undying', 'amulet3', '대사제의 불멸 향로', 'fireDmg=35,fireRes=40,ene=30,fcr=25', 'treeSoul=3', 'soul', 'high_priest'),
    u('admiral_storm', 'staff8', '폭풍 제독의 홀', 'dmgPct=200,lightDmg=45,coldRes=40,fcr=20', 'treeSoul=2,spellDmg=40', 'soul', 'admiral'),
    u('doom_hood', 'helm8', '재앙 예언자의 두건', 'def=95,fcr=25,poisonRes=40', 'treeCurse=2,curse=40', 'curse'),
    u('widow_sash', 'belt7', '과부의 장례띠', 'life=90,def=50,allRes=20', 'curseDur=40,curseEff=25', 'curse'),
    u('headsman_last', 'gloves8', '처형인의 마지막 손', 'ias=30,str=25,fireRes=40,leech=6', 'treeCurse=2,curseEff=30', 'curse', 'headsman'),
    u('plague_step', 'boots7', '역병 걸음', 'ms=20,def=50,poisonRes=40', 'treeCurse=2,curse=35', 'curse'),
    u('eternal_pall', 'armor10', '영겁의 장의', 'def=190,life=130,allRes=30', 'regen=12', 'any'),
    u('fate_boots', 'boots8', '운명의 장화', 'ms=25,def=55,gf=100', 'mf=50', 'any'),
    u('void_ring', 'ring3', '공허의 고리', 'allRes=30,life=70,def=30', 'leech=6', 'any'),
    u('hellfire_gloves', 'gloves6', '지옥불 장갑', 'ias=35,dmgFlat=25,fireDmg=40', 'leech=8', 'any'),
]
UH = list(U[0].keys())
wr(OUT + 'item_uniques.csv', U + new_u, UH)

# ── 세트 ──
S = rd('data/item_sets.csv'); P = rd('data/item_set_pieces.csv')
# 그림자 상한은 정예형 세트만 (10-12 결정). 기존 세트는 상한 대신 계열 스킬로
fix = {
    'ashen_legion': {'tree': 'command', 'grade': '0', 'full': 'deploy=1,minion=20,treeCommand=1', 'note': '소환 일반형 (Lv1) 4부위'},
    'bone_choir': {'tree': 'soul', 'grade': '0', 'bonus2': 'spellDmg=15,fcr=10', 'full': 'treeSoul=1,allRes=20,life=40', 'note': '영혼 일반형 (Lv18) 3부위'},
    'grave_king': {'tree': 'command', 'grade': '1', 'full': 'deploy=1,minion=40,life=80,treeCommand=2', 'note': '소환 강화형 (Lv33) 4부위 — 조각 베이스가 강화형이라 강화형에 둔다'},
}
for r in S: r.update(fix[r['id']])
def s(id, name, tr, g, b2, b3, full, note): return {'id': id, 'name': name, 'bonus2': b2, 'bonus3': b3, 'full': full, 'note': note, 'tree': tr, 'grade': g}
new_s = [
    s('cult_hex', '교단의 저주', 'curse', '0', 'curseDur=15,fcr=10', '', 'treeCurse=1,curse=25,allRes=15', '저주 일반형 (Lv8) 3부위'),
    s('desert_priest', '사막 대사제의 의복', 'soul', '1', 'spellDmg=20,fireDmg=15', '', 'treeSoul=2,fcr=20,allRes=25', '영혼 강화형 (Lv35) 3부위'),
    s('captain_curse', '근위대장의 저주', 'curse', '1', 'curseDur=20', 'curseEff=15,fcr=15', 'treeCurse=2,curse=35,allRes=20', '저주 강화형 (Lv44) 4부위'),
    s('lich_host', '망자 군주의 군기', 'command', '2', 'minion=40', 'minionIas=20,allRes=25', 'shadowCap=1,deploy=1,treeCommand=2,minion=50', '소환 정예형 (Lv63) 4부위 — 그림자 상한 +1'),
    s('netherseer', '명계 대주술사', 'soul', '2', 'spellDmg=30', 'fcr=25,mana=80', 'shadowCap=1,treeSoul=3,spellDmg=40', '영혼 정예형 (Lv63) 4부위 — 그림자 상한 +1'),
    s('queen_funeral', '묘지기 여왕의 장례복', 'curse', '2', 'curseDur=30', 'curseEff=25,fcr=20', 'shadowCap=1,treeCurse=3,curse=45', '저주 정예형 (Lv64) 4부위 — 그림자 상한 +1'),
]
SH = ['id', 'name', 'tree', 'grade', 'bonus2', 'bonus3', 'full', 'note']
wr(OUT + 'item_sets.csv', S + new_s, SH)
bone_choir_pieces = {'helm2': 'def=20,mana=30,ene=10', 'armor2': 'def=40,life=30,fcr=10', 'lamp2': 'ene=12,mana=30,spellDmg=10'}
for r in P:
    if r['base'] in bone_choir_pieces: r['mods'] = bone_choir_pieces[r['base']]
def p(set, base, name, mods): return {'set': set, 'base': base, 'name': name, 'mods': mods}
new_p = [
    p('cult_hex', 'helm15', '교단 저주술사의 두건', 'def=10,curse=15,fcr=8'),
    p('cult_hex', 'gloves15', '교단의 손짓', 'ias=10,curseDur=10,poisonRes=15'),
    p('cult_hex', 'belt15', '교단의 매듭', 'life=20,def=8,curseEff=8'),
    p('desert_priest', 'staff4', '대사제의 혼 지팡이', 'ene=20,fireDmg=15,fcr=15'),
    p('desert_priest', 'armor4', '대사제의 제의', 'def=70,life=50,fireRes=30'),
    p('desert_priest', 'ring2', '대사제의 인장', 'ene=12,mana=40,spellDmg=10'),
    p('captain_curse', 'helm5', '근위대장의 투구', 'def=55,curse=20,coldRes=25'),
    p('captain_curse', 'gloves4', '근위대장의 장갑', 'ias=20,curseEff=10,life=30'),
    p('captain_curse', 'boots4', '근위대장의 각반', 'ms=15,def=25,curseDur=15'),
    p('captain_curse', 'belt4', '근위대장의 요대', 'life=50,def=25,allRes=10'),
    p('lich_host', 'helm7', '군주의 망령 투구', 'def=100,minion=40,life=60'),
    p('lich_host', 'armor7', '군주의 혼각 갑주', 'def=150,minion=40,allRes=20'),
    p('lich_host', 'lamp6', '군주의 영겁 등불', 'minion=60,ene=25,minionIas=15'),
    p('lich_host', 'gloves6', '군주의 건틀릿', 'ias=30,minion=35,minionRes=20'),
    p('netherseer', 'staff6', '대주술사의 왕홀', 'ene=35,spellDmg=25,fcr=20'),
    p('netherseer', 'helm8', '대주술사의 두건', 'def=85,ene=25,mana=60'),
    p('netherseer', 'armor8', '대주술사의 장포', 'def=140,life=90,allRes=20'),
    p('netherseer', 'amulet3', '대주술사의 부적', 'ene=25,fcr=20,lightDmg=30'),
    p('queen_funeral', 'helm9', '여왕의 장례관', 'def=100,curse=30,poisonRes=40'),
    p('queen_funeral', 'armor10', '여왕의 영겁 수의', 'def=180,life=110,allRes=25'),
    p('queen_funeral', 'gloves8', '여왕의 저주 손', 'ias=30,curseEff=20,leech=6'),
    p('queen_funeral', 'belt8', '여왕의 장례띠', 'life=90,def=45,curseDur=25'),
]
wr(OUT + 'item_set_pieces.csv', P + new_p, list(P[0].keys()))

# ── 룬워드 ──
R = rd('data/runewords.csv')
rt = {'첫 번째 군령': 'command', '무덤의 속삭임': 'curse', '망자의 행진': 'command', '검은 서약': 'command', '끝없는 장례': 'command', '망령 군주': 'command'}
for r in R: r['tree'] = rt[r['name']]
def rw(runes, name, slots, mods, tr): return {'runes': runes, 'name': name, 'slots': slots, 'mods': mods, 'tree': tr}
new_r = [
    rw('r_kura,r_sel,r_rev', '해골 군단의 깃발', 'offhand', 'treeCommand=2,minion=40,minionIas=20,deploy=1', 'command'),
    rw('r_nod,r_kura,r_ur', '망자의 군가', 'helm', 'treeCommand=1,minion=25,minionRes=20,extract=8', 'command'),
    rw('r_tab,r_kan,r_sel,r_xil', '뼈 방벽', 'armor', 'treeCommand=1,minionRes=30,def=80,life=60', 'command'),
    rw('r_drak,r_kura,r_kan,r_sel,r_rev', '군주의 낫', 'weapon', 'treeCommand=3,minion=50,minionIas=30,dmgPct=150', 'command'),
    rw('r_baen,r_yel,r_drak', '골수의 불꽃', 'weapon', 'treeSoul=1,spellDmg=20,fireDmg=15,fcr=15', 'soul'),
    rw('r_mir,r_yel,r_xil', '혼백 등롱', 'offhand', 'treeSoul=1,spellDmg=25,mana=40,ene=15', 'soul'),
    rw('r_yel,r_nox,r_ab,r_mir', '명계의 언어', 'helm', 'treeSoul=2,spellDmg=30,fcr=20,mana=50', 'soul'),
    rw('r_yel,r_kan,r_xil,r_ab,r_obl,r_nox', '영혼 폭풍', 'weapon', 'treeSoul=3,spellDmg=60,fcr=30,ene=25,lightDmg=30', 'soul'),
    rw('r_mor,r_seb', '저주의 매듭', 'helm', 'treeCurse=1,curse=25,curseDur=20', 'curse'),
    rw('r_mor,r_nox,r_seb,r_zel', '검은 미사', 'armor', 'treeCurse=2,curseEff=20,curseDur=30,allRes=20', 'curse'),
    rw('r_nox,r_mor,r_ab,r_seb,r_obl', '재앙의 홀', 'weapon', 'treeCurse=3,curseEff=35,curse=40,curseDur=40,fcr=20', 'curse'),
    rw('r_wen,r_hawin,r_ireun', '순례자의 길', 'armor', 'ms=20,mf=40,allRes=25,life=50', 'any'),
]
wr(OUT + 'runewords.csv', R + new_r, list(R[0].keys()) + ['tree'] if 'tree' not in R[0] else list(R[0].keys()))
from collections import Counter
allu = U + new_u
print('uniques', len(allu), Counter((r['tree']) for r in allu))
print('sets', len(S + new_s), 'pieces', len(P + new_p), 'runewords', len(R + new_r))
