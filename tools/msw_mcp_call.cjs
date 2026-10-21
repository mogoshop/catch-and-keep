// msw-mcp 도구를 스크립트에서 여러 번 부른다 (리소스 속성 일괄 설정 등).
// 인증 토큰은 .mcp.json(커밋 안 됨)에서 실행 중에만 읽고 출력하지 않는다.
//   node tools/msw_mcp_call.cjs pivot <list-file> [pivot_x] [pivot_y]   — 스프라이트 피벗 일괄 설정
//   list-file 한 줄 = "guid,이름,subcategory[,pivot_x,pivot_y,wrap]" (정보 갱신은 빠진 이름·subcategory를 지우므로 반드시 함께 보낸다)
//   행에 피벗·wrap이 있으면 그 값, 없으면 인자 값 (기본 0.5 / 0 / Clamp)
"use strict";
const fs = require("fs");
const path = require("path");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", ".mcp.json"), "utf8")).mcpServers["msw-mcp"];
const URL_ = cfg.url;
const AUTH = cfg.headers.Authorization;
let session = "";
let nextId = 1;

async function rpc(method, params, notify) {
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: AUTH };
  if (session) headers["Mcp-Session-Id"] = session;
  const body = notify ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: nextId++, method, params };
  const res = await fetch(URL_, { method: "POST", headers, body: JSON.stringify(body) });
  const sid = res.headers.get("mcp-session-id");
  if (sid) session = sid;
  if (notify) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}: ${text.slice(0, 200)}`);
  // 응답은 JSON 또는 SSE(data: 줄)
  const line = text.trim().startsWith("{") ? text : text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).pop();
  const msg = JSON.parse(line);
  if (msg.error) throw new Error(`${method}: ${JSON.stringify(msg.error).slice(0, 200)}`);
  return msg.result;
}

async function connect() {
  await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "jabeumyeon-tools", version: "1" } });
  await rpc("notifications/initialized", {}, true);
}

async function callTool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = (r.content || []).map((c) => c.text || "").join("");
  if (r.isError) throw new Error(`${name}: ${text.slice(0, 200)}`);
  return text;
}

// 그림 팩 업로드: <팩>/upload-environment-mapping.csv에서 RUID가 빈 줄을 그룹 저장소(sprite/object)에 올리고
// 받은 RUID를 그 표와 resource-mapping.csv(file 칸이 같은 줄)에 바로 적는다 (중간에 끊겨도 다시 실행하면 이어서).
//   node tools/msw_mcp_call.cjs upload <팩 폴더> [최대 개수] [--dry]
//   (코덱스 따옴표 표 resource-mapping.csv는 아래 upload-res)
function readCsv(file) {
  const [head, ...rows] = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l !== "").map((l) => l.split(","));
  return { head, rows };
}
function writeCsv(file, t) {
  fs.writeFileSync(file, [t.head, ...t.rows].map((r) => r.join(",")).join("\n") + "\n");
}
function pickJson(text) {
  try { return JSON.parse(text); } catch (e) { return {}; }
}
function findKey(obj, re) {
  if (!obj || typeof obj !== "object") return null;
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k) && typeof v === "string") return v;
    const inner = findKey(v, re);
    if (inner) return inner;
  }
  return null;
}
async function upload(pack, limitArg, dry) {
  const root = path.join(__dirname, "..");
  const mapFile = path.join(root, pack, "upload-environment-mapping.csv");
  const resFile = path.join(root, pack, "resource-mapping.csv");
  const map = readCsv(mapFile), res = readCsv(resFile);
  const c = (t, name) => t.head.indexOf(name);
  const todo = map.rows.filter((r) => !/^[0-9a-f]{32}$/.test(r[c(map, "RUID")]));
  const limit = Math.min(todo.length, Number(limitArg) || todo.length);
  console.log(`올릴 그림 ${todo.length}장 중 ${limit}장`);
  if (dry) return;
  await connect();
  for (let i = 0; i < limit; i++) {
    const r = todo[i];
    const name = r[c(map, "upload_name")], rel = r[c(map, "canonical_file")], group = r[c(map, "group")] || "OJYYQ";
    const body = fs.readFileSync(path.join(root, pack, rel));
    const args = { groupCode: group, category: "sprite", subcategory: "object", name, description: `${pack.split("/").pop()} ${r[c(map, "category")]}`, contentLength: body.length };
    const first = pickJson(await callTool("asset_create_group_resource_storage_item", args));
    const url = findKey(first, /presigned/i);
    if (!url) throw new Error(`${name}: 업로드 주소를 못 받음 (${Object.keys(first).join(",")})`);
    const put = await fetch(url, { method: "PUT", body, headers: { "Content-Length": String(body.length) } });
    if (!put.ok) throw new Error(`${name}: 파일 올리기 실패 HTTP ${put.status}`);
    const done = pickJson(await callTool("asset_create_group_resource_storage_item", Object.assign({}, args, { fileUrl: url })));
    const ruid = findKey(done, /^(ruid|guid|resourceId)$/i);
    if (!ruid || !/^[0-9a-f]{32}$/.test(ruid)) throw new Error(`${name}: RUID를 못 받음 (${JSON.stringify(done).slice(0, 200)})`);
    r[c(map, "RUID")] = ruid;
    for (const x of res.rows) if (x[c(res, "file")] === rel) x[c(res, "RUID")] = ruid;
    writeCsv(mapFile, map);
    writeCsv(resFile, res);
    if ((i + 1) % 10 === 0 || i + 1 === limit) console.log(`  ${i + 1}/${limit} ${name}`);
  }
}

// 따옴표 CSV (코덱스 resource-mapping.csv 형식)
function parseQuoted(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return { head: rows[0], rows: rows.slice(1) };
}
function writeQuoted(file, t) {
  const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  fs.writeFileSync(file, [t.head.join(","), ...t.rows.map((r) => r.map(q).join(","))].join("\n") + "\n");   // 헤더는 따옴표 없이 (코덱스 원본과 같게)
}

// 코덱스 팩의 resource-mapping.csv(따옴표 CSV)를 그대로 읽어 RUID가 빈 줄을 그룹 저장소에 올리고 RUID를 그 표에 적는다.
// 올린 직후 몬스터 프레임·NPC·장식·바닥 장판은 발밑 가운데 피벗(0.5, 0)으로 둔다 (중간에 끊겨도 다시 실행하면 이어서).
//   node tools/msw_mcp_call.cjs upload-res <팩 폴더> [--skip=floor,wall] [--skip-key=stormgulls] [--dry]
async function uploadRes(pack, argv) {
  const root = path.join(__dirname, "..");
  const resFile = path.join(root, pack, "resource-mapping.csv");
  const t = parseQuoted(fs.readFileSync(resFile, "utf8"));
  // 코덱스 새 표 형식(resource_name·ruid·entity)도 읽는다
  const alias = { upload_name: "resource_name", RUID: "ruid", key: "entity" };
  const c = (name) => (t.head.indexOf(name) >= 0 ? t.head.indexOf(name) : t.head.indexOf(alias[name] || name));
  const opt = (k) => ((argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || "").split(",").filter(Boolean);
  const skipCat = opt("skip"), skipKey = opt("skip-key");
  const bottom = (r) => ["monster-frame", "npc", "prop", "Monster", "NPC"].includes(r[c("category")]) || /-ground/.test(r[c("key")] || "");
  // 팩에 resource-properties.csv(name,pivot_x,pivot_y,wrap_mode)가 있으면 그림마다 그 피벗을 쓴다 (발이 캔버스 바닥이 아닌 장식·넓은 캔버스)
  const propFile = path.join(root, pack, "resource-properties.csv");
  const pivots = {};
  if (fs.existsSync(propFile)) {
    const p = parseQuoted(fs.readFileSync(propFile, "utf8"));
    const pc = (n) => p.head.indexOf(n);
    const px = pc("pivot_x") >= 0 ? pc("pivot_x") : pc("pivot_x_normalized"), py = pc("pivot_y") >= 0 ? pc("pivot_y") : pc("pivot_y_normalized_from_bottom");
    const pn = pc("name") >= 0 ? pc("name") : pc("resource_name");
    for (const r of p.rows) pivots[r[pn]] = { x: r[px], y: r[py], wrap: r[pc("wrap_mode")] || "Clamp" };
  }
  const todo = t.rows.filter((r) => !/^[0-9a-f]{32}$/.test(r[c("RUID")]) && !skipCat.includes(r[c("category")]) && !skipKey.some((k) => (r[c("key")] || "").startsWith(k) || r[c("upload_name")].includes(k)));
  console.log(`올릴 그림 ${todo.length}장 (건너뜀: ${skipCat.join("/") || "-"} · ${skipKey.join("/") || "-"})`);
  if (argv.includes("--dry")) return;
  await connect();
  let n = 0;
  for (const r of todo) {
    const name = r[c("upload_name")], rel = r[c("file")], group = (c("group") >= 0 && r[c("group")]) || "OJYYQ";
    const body = fs.readFileSync(path.join(root, pack, rel));
    const args = { groupCode: group, category: "sprite", subcategory: "object", name, description: `${pack.split("/").pop()} ${r[c("category")]}`, contentLength: body.length };
    const first = pickJson(await callTool("asset_create_group_resource_storage_item", args));
    const url = findKey(first, /presigned/i);
    if (!url) throw new Error(`${name}: 업로드 주소를 못 받음 (${Object.keys(first).join(",")})`);
    const put = await fetch(url, { method: "PUT", body, headers: { "Content-Length": String(body.length) } });
    if (!put.ok) throw new Error(`${name}: 파일 올리기 실패 HTTP ${put.status}`);
    const done = pickJson(await callTool("asset_create_group_resource_storage_item", Object.assign({}, args, { fileUrl: url })));
    const ruid = findKey(done, /^(ruid|guid|resourceId)$/i);
    if (!ruid || !/^[0-9a-f]{32}$/.test(ruid)) throw new Error(`${name}: RUID를 못 받음 (${JSON.stringify(done).slice(0, 200)})`);
    const pv = pivots[name];
    if (pv || bottom(r)) {
      await callTool("asset_update_resource_storage_info", { guid: ruid, name, subcategory: "object", properties: [
        { key: "pivot_x", value: pv ? String(pv.x) : "0.5" }, { key: "pivot_y", value: pv ? String(pv.y) : "0" }, { key: "filter_mode", value: "Point" }, { key: "wrap_mode", value: pv ? pv.wrap : "Clamp" },
      ] });
    }
    r[c("RUID")] = ruid;
    if (c("status") >= 0) r[c("status")] = "uploaded";
    writeQuoted(resFile, t);
    n++;
    if (n % 10 === 0 || n === todo.length) console.log(`  ${n}/${todo.length} ${name}`);
  }
}

async function main() {
  const [cmd, file, px, py] = process.argv.slice(2);
  if (cmd === "upload") return upload(file, px, process.argv.includes("--dry"));
  if (cmd === "upload-res") return uploadRes(file, process.argv.slice(4));
  if (cmd !== "pivot") throw new Error("사용법: node tools/msw_mcp_call.cjs pivot <guid-list-file> [pivot_x] [pivot_y] | upload <팩 폴더> [최대 개수]");
  const rows = fs.readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim().split(",")).filter((r) => /^[0-9a-f]{32}$/.test(r[0]) && r[1] && r[2]);
  await connect();
  let ok = 0;
  for (const [guid, name, subcategory, rx, ry, rwrap] of rows) {
    // 피벗 = 발밑 가운데 (몬스터 모델은 엔티티 원점이 발밑). 픽셀 스프라이트라 Point 필터
    await callTool("asset_update_resource_storage_info", {
      guid,
      name,
      subcategory,
      properties: [
        { key: "pivot_x", value: String(rx || px || "0.5") },
        { key: "pivot_y", value: String(ry || py || "0") },
        { key: "filter_mode", value: "Point" },
        { key: "wrap_mode", value: rwrap || "Clamp" },
      ],
    });
    ok++;
    if (ok % 20 === 0) console.log(`  ${ok}/${rows.length}`);
  }
  console.log(`피벗 설정 ${ok}/${rows.length}`);
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
