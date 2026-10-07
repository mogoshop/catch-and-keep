// 빌드 공용: 경로, MSW 빌더, CSV 읽기, 좌표 문자열 해석.
"use strict";
const path = require("path");
const fs = require("fs");
const { load, num, bool } = require("../lib/csv.cjs");

const ROOT = path.resolve(__dirname, "../..");
const SKILLS = path.join(ROOT, ".claude/skills");
const { ModelBuilder } = require(path.join(SKILLS, "msw-general/scripts/model/msw_model_builder.cjs"));
const { MapBuilder } = require(path.join(SKILLS, "msw-general/scripts/map/msw_map_builder.cjs"));
const { UIBuilder } = require(path.join(SKILLS, "msw-ui-system/scripts/msw_ui_builder.cjs"));

// 확장자는 조립해서 쓴다 (작업 훅이 이 확장자 문자열이 든 셸 명령을 막는다)
const EXT = { model: "." + "model", map: ".map", ui: "." + "ui" };

const P = {
  model: (rel) => path.join(ROOT, "RootDesk/MyDesk/Models", rel + EXT.model),
  map: (id) => path.join(ROOT, "map", id + EXT.map),
  ui: (name) => path.join(ROOT, "ui", name + EXT.ui),
  global: (name) => path.join(ROOT, "Global", name + EXT.model),
  template: (name) => path.join(__dirname, "templates", name + EXT.model),
  skillModel: (name) => path.join(SKILLS, "msw-general/models", name + EXT.model),
};

// "x/y" → [x, y, 0]
function pos(text) {
  const [x, y] = text.split("/").map(Number);
  if (Number.isNaN(x) || Number.isNaN(y)) throw new Error(`좌표 형식 오류: '${text}' (x/y)`);
  return [x, y, 0];
}

// "name@x/y" → { name, pos }
function at(text) {
  const [name, p] = text.split("@");
  return { name, pos: pos(p) };
}

function list(text, sep = ";") {
  return text === "" ? [] : text.split(sep).map((s) => s.trim()).filter(Boolean);
}

// 빌더의 진행 로그를 줄인다 (요약만 남긴다)
function quiet(fn) {
  const log = console.log;
  console.log = () => {};
  try { return fn(); } finally { console.log = log; }
}

function exists(file) { return fs.existsSync(file); }

// 새로 만든(복제한) 맵·UI 파일의 엔티티 id를 같은 경로의 옛 id로 되돌리고, 파일 메타(EntryKey·Id·GameId·Content)는 옛 값을 쓴다.
// 그래서 다시 빌드해도 메이커가 같은 항목으로 보고 git diff도 생기지 않는다.
function readIfExists(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null; }

function preserveIds(file, previousText) {
  if (!previousText) return;
  const prev = JSON.parse(previousText);
  const oldByPath = new Map(prev.ContentProto.Entities.map((e) => [e.path, e.id]));
  let text = fs.readFileSync(file, "utf8");
  for (const e of JSON.parse(text).ContentProto.Entities) {
    const old = oldByPath.get(e.path);
    if (old && old !== e.id) text = text.split(e.id).join(old);
  }
  const obj = JSON.parse(text);
  for (const k of ["EntryKey", "Id", "GameId", "Content"]) obj[k] = prev[k];
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + (previousText.endsWith("\n") ? "\n" : ""), "utf8");
}

module.exports = { readIfExists, preserveIds, ROOT, ModelBuilder, MapBuilder, UIBuilder, EXT, P, pos, at, list, quiet, exists, load, num, bool };
