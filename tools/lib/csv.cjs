// 최소 CSV 파서 (RFC 4180: 따옴표·쉼표·줄바꿈 포함 칸 지원). 외부 의존성 없음.
const fs = require("fs");
const path = require("path");

// 테스트는 GAME_DATA_DIR로 픽스처 폴더를 넘긴다
const DATA_DIR = process.env.GAME_DATA_DIR ? path.resolve(process.env.GAME_DATA_DIR) : path.resolve(__dirname, "../../data");

function parse(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// data/<name>.csv → [{col: value}] (값은 문자열 그대로)
function load(name) {
  const rows = parse(fs.readFileSync(path.join(DATA_DIR, name + ".csv"), "utf8"));
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] === undefined ? "" : r[i]])));
}

function num(v, fallback = 0) {
  const n = Number(v);
  return v === "" || Number.isNaN(n) ? fallback : n;
}

function bool(v) {
  return v === "true" || v === "1";
}

module.exports = { DATA_DIR, parse, load, num, bool };
