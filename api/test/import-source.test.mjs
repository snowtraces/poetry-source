import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  classifySourceFile,
  hashToInt,
  iterateAuthorRows,
  iterateWorkRows,
  sqlLiteral,
  writeSeed
} from "../scripts/import-source.mjs";

test("classifies source variants and types", () => {
  assert.deepEqual(classifySourceFile("诗/唐/poetry.唐.0000.json"), {
    variant: "canonical",
    type: "poetry"
  });
  assert.deepEqual(classifySourceFile("词/宋/ci.宋.0000.pinyin.json"), {
    variant: "pinyin",
    type: "ci"
  });
  assert.deepEqual(classifySourceFile("作者.json"), {
    variant: "authors",
    type: null
  });
});

test("joins sibling pinyin records without loading the entire dataset", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "poetry-source-test-"));
  const dynastyDir = path.join(root, "诗", "唐");
  fs.mkdirSync(dynastyDir, { recursive: true });
  fs.writeFileSync(path.join(dynastyDir, "poetry.唐.0000.json"), JSON.stringify([
    { id: "1", title: "静夜思", authorName: "李白", authorId: "a1", dynasty: "唐", content: ["床前明月光"] }
  ]));
  fs.writeFileSync(path.join(dynastyDir, "poetry.唐.0000.pinyin.json"), JSON.stringify([
    { id: "1", pinyin: ["chuáng qián míng yuè guāng"] }
  ]));
  fs.writeFileSync(path.join(root, "作者.json"), JSON.stringify([
    { id: "a1", name: "李白", dynasty: "唐", birthYear: "701", deathYear: "762", desc: "诗人" }
  ]));

  try {
    const works = [...iterateWorkRows(root)];
    const authors = [...iterateAuthorRows(root)];
    assert.equal(works.length, 1);
    assert.equal(works[0].type, "poetry");
    assert.equal(works[0].pinyin_json, JSON.stringify(["chuáng qián míng yuè guāng"]));
    assert.equal(authors.length, 1);
    assert.equal(authors[0].birth_year, "701");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("writes chunked SQL and preserves apostrophes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "poetry-source-seed-"));
  const sourceDir = path.join(root, "source");
  const outputDir = path.join(root, "seed");
  fs.mkdirSync(path.join(sourceDir, "曲", "元"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "曲", "元", "qu.元.0000.json"), JSON.stringify([
    { id: "q1", title: "O'Reilly", authorName: "作者", authorId: "a1", dynasty: "元", content: [] }
  ]));

  try {
    const manifest = writeSeed({ sourceDir, outputDir, chunkSize: 1 });
    assert.equal(manifest.records.works, 1);
    assert.equal(fs.existsSync(path.join(outputDir, "works-0001.sql")), true);
    const sql = fs.readFileSync(path.join(outputDir, "works-0001.sql"), "utf8");
    assert.match(sql, /O''Reilly/);
    assert.equal(sqlLiteral(null), "NULL");
    assert.equal(Number.isInteger(hashToInt("q1")), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
