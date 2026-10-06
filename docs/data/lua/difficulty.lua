-- 자동 생성: tools/csv_to_lua.py. 직접 수정 금지 (data/difficulty.csv 를 수정)
return {
  ["normal"] = { name = "보통", monsterLevelMin = 1, monsterLevelMax = 30, resistPenalty = 0, runeTierUnlock = "low" },
  ["nightmare"] = { name = "악몽", monsterLevelMin = 30, monsterLevelMax = 55, resistPenalty = -30, runeTierUnlock = "high" },
  ["hell"] = { name = "지옥", monsterLevelMin = 55, monsterLevelMax = 80, resistPenalty = -60, runeTierUnlock = "mythic" },
}
