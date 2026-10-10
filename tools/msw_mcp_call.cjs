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

async function main() {
  const [cmd, file, px, py] = process.argv.slice(2);
  if (cmd !== "pivot") throw new Error("사용법: node tools/msw_mcp_call.cjs pivot <guid-list-file> [pivot_x] [pivot_y]");
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
