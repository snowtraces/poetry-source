import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { run } from "../scripts/import-source-cloudflare.mjs";

test("generates D1 SQL without explicit transaction statements", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "poetry-source-cloudflare-"));
  const sourceDir = path.join(root, "source");
  const outputDir = path.join(root, "seed");
  fs.mkdirSync(path.join(sourceDir, "诗", "唐"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "诗", "唐", "poetry.唐.0000.json"), JSON.stringify([
    { id: "p1", title: "测试", authorName: "作者", authorId: "a1", dynasty: "唐", content: [] }
  ]));
  fs.writeFileSync(path.join(sourceDir, "作者.json"), JSON.stringify([
    { id: "a1", name: "作者", dynasty: "唐", desc: "" }
  ]));

  try {
    const manifest = run({ sourceDir, outputDir, format: "sql", chunkSize: 10 });
    assert.equal(manifest.records.works, 1);
    assert.deepEqual(manifest.statistics.by_dynasty, [{ dynasty: "唐", count: 1 }]);
    assert.deepEqual(manifest.statistics.dynasties, ["唐"]);
    const sql = fs.readFileSync(path.join(outputDir, "works-0001.sql"), "utf8");
    assert.doesNotMatch(sql, /BEGIN TRANSACTION|COMMIT;/);
    const summarySql = fs.readFileSync(path.join(outputDir, "dataset-meta.sql"), "utf8");
    assert.match(summarySql, /'summary'/);
    assert.match(summarySql, /\\"works\\":1/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
