import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { run } from "../scripts/import-source-ignore-other.mjs";

test("ignores source/其他 while importing selected source trees", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "poetry-source-ignore-other-"));
  const sourceDir = path.join(root, "source");
  const outputDir = path.join(root, "seed");
  fs.mkdirSync(path.join(sourceDir, "诗", "唐"), { recursive: true });
  fs.mkdirSync(path.join(sourceDir, "其他"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "诗", "唐", "poetry.唐.0000.json"), JSON.stringify([
    { id: "p1", title: "测试", authorName: "作者", authorId: "a1", dynasty: "唐", content: [] }
  ]));
  fs.writeFileSync(path.join(sourceDir, "其他", "诗经.json"), JSON.stringify([
    { title: "无 id 的其他资料", content: ["不会被导入"] }
  ]));
  fs.writeFileSync(path.join(sourceDir, "作者.json"), JSON.stringify([
    { id: "a1", name: "作者", dynasty: "唐", desc: "" }
  ]));

  try {
    const manifest = run({ sourceDir, outputDir, chunkSize: 10 });
    assert.equal(manifest.records.works, 1);
    assert.equal(manifest.records.authors, 1);
    assert.equal(manifest.source.orphan_variant_files.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
