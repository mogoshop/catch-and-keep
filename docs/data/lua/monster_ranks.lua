-- 자동 생성: tools/csv_to_lua.py. 직접 수정 금지 (data/monster_ranks.csv 를 수정)
return {
  ["normal"] = { name = "일반", hpMul = 1, dmgMul = 1, extractChance = 0.15, shadowGrade = 1 },
  ["elite"] = { name = "정예", hpMul = 3, dmgMul = 1.3, extractChance = 0.08, shadowGrade = 2 },
  ["champion"] = { name = "무리 우두머리", hpMul = 4, dmgMul = 1.5, extractChance = 0.08, shadowGrade = 2 },
  ["unique"] = { name = "최상위", hpMul = 6, dmgMul = 1.8, extractChance = 0.05, shadowGrade = 2 },
  ["boss"] = { name = "보스", hpMul = 20, dmgMul = 2, extractChance = 1.0, shadowGrade = 3 },
}
