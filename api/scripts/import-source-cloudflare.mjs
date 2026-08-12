import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { run as runIgnoreOther } from "./import-source-ignore-other.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIR = path.resolve(SCRIPT_DIR, "../../source");
const DEFAULT_OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../.data/seed-cf");

function removeExplicitTransactions(outputDir, generatedFiles) {
  for (const filename of generatedFiles.filter((name) => /^(works|authors)-\d+\.sql$/.test(name))) {
    const filePath = path.join(outputDir, filename);
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    while (lines.at(-1) === "") lines.pop();
    if (lines[0] === "BEGIN TRANSACTION;") lines.shift();
    if (lines.at(-1) === "COMMIT;") lines.pop();
    fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
  }
}

export function run(options) {
  const manifest = runIgnoreOther(options);
  if (options.format === "sql" || options.format === "both") {
    removeExplicitTransactions(manifest.output_dir, manifest.generated_files);
  }
  return manifest;
}

function parseArgs(argv) {
  const options = {
    sourceDir: DEFAULT_SOURCE_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    format: "sql",
    chunkSize: 5000,
    force: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--force") {
      options.force = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    const [name, inlineValue] = argument.split("=", 2);
    const value = inlineValue ?? argv[++index];
    if (!value) throw new Error(`missing value for ${name}`);
    if (name === "--source") options.sourceDir = value;
    else if (name === "--out") options.outputDir = value;
    else if (name === "--format") options.format = value;
    else if (name === "--chunk-size") options.chunkSize = Number(value);
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/import-source-cloudflare.mjs [options]

This entrypoint ignores source/其他 and generates D1 SQL without explicit
BEGIN/COMMIT statements, which is compatible with wrangler d1 execute.

Options:
  --source <dir>       source directory (default: ../../source)
  --out <dir>          output directory (default: .data/seed-cf)
  --format <format>    sql, ndjson, or both (default: sql)
  --chunk-size <n>     rows per SQL file (default: 5000)
  --force              allow writing into a non-empty output directory
  --help               show this help
`);
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }
  const manifest = run(options);
  console.log(JSON.stringify({
    output_dir: manifest.output_dir,
    works: manifest.records.works,
    authors: manifest.records.authors,
    generated_files: manifest.generated_files.length,
    ignored: "source/其他",
    explicit_transactions: false
  }, null, 2));
}

const currentFile = pathToFileURL(fileURLToPath(import.meta.url)).href;
const invokedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (currentFile === invokedFile) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
