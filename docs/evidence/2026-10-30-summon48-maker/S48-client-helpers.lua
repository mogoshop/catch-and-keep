-- S48 공통 client 도우미 (maker_execute_script 앞에 붙여 씀)
local function click(p) local e=_UIKit:Get(p) if isvalid(e) and e.Enable then e:SendEvent(ButtonClickEvent()) log("[VRF] GM click "..p) return true end log("[VRF] GM click MISSING "..p) return false end
local function dump(root, tag)
  local out={}
  local function walk(e, path)
    if not isvalid(e) or not e.Enable then return end
    local t=e.TextGUIRendererComponent
    if t~=nil and t.Text~=nil and t.Text~="" then table.insert(out, path..'='..string.gsub(t.Text,'\n','⏎')) end
    for _,c in ipairs(e.Children) do walk(c, path..'/'..c.Name) end
  end
  walk(_UIKit:Get(root), root)
  for i=1,#out,6 do log('[VRF] '..tag..' '..table.concat(out,' | ',i,math.min(#out,i+5))) end
end
local function pickMain(id) local w=_SkillWindow for k,v in pairs(w.SlotIds or {}) do if v==id then local c,r=string.match(k,'(%d+):(%d+)') return click(w.Win..'/TL/C'..c..'/S'..r) end end log('[VRF] GM slot MISSING '..id) return false end
