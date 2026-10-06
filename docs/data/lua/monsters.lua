-- 자동 생성: tools/csv_to_lua.py. 직접 수정 금지 (data/monsters.csv 를 수정)
return {
  ["wild_dog"] = { name = "들개", region = 1, baseLevel = 1, baseHp = 30, baseDmg = 4, atkIntervalSec = 1.0, def = 0, aiType = "melee_chase" },
  ["cinder_soldier"] = { name = "재투성이 병사", region = 1, baseLevel = 5, baseHp = 60, baseDmg = 7, atkIntervalSec = 1.2, def = 10, aiType = "melee_chase" },
  ["gallows_crow"] = { name = "갈가마귀", region = 1, baseLevel = 6, baseHp = 35, baseDmg = 6, atkIntervalSec = 1.0, def = 0, aiType = "flyer" },
  ["pit_worm"] = { name = "구덩이 벌레", region = 1, baseLevel = 4, baseHp = 45, baseDmg = 6, atkIntervalSec = 1.5, def = 5, aiType = "ambush" },
  ["graveyard_queen"] = { name = "묘지기 여왕", region = 1, baseLevel = 10, baseHp = 60, baseDmg = 10, atkIntervalSec = 1.5, def = 20, aiType = "boss" },
}
