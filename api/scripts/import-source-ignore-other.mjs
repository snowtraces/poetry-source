import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ImportError, writeSeed } from "./import-source.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIR = path.resolve(SCRIPT_DIR, "../../source");
const DEFAULT_OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../.data/seed");
const INCLUDED_DIRECTORIES = ["诗", "词", "曲"];

function copyAsHardLink(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  try {
    fs.linkSync(sourcePath, targetPath);
  } catch {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function linkTree(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      linkTree(sourcePath, targetPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      copyAsHardLink(sourcePath, targetPath);
    }
  }
}

export function createFilteredSource(sourceDir) {
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "poetry-source-filtered-"));
  for (const directory of INCLUDED_DIRECTORIES) {
    const sourcePath = path.join(sourceDir, directory);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(stagingDir, directory);
    fs.mkdirSync(targetPath, { recursive: true });
    linkTree(sourcePath, targetPath);
  }

  const authorsPath = path.join(sourceDir, "作者.json");
  if (fs.existsSync(authorsPath)) copyAsHardLink(authorsPath, path.join(stagingDir, "作者.json"));
  return stagingDir;
}

export function run({ sourceDir, outputDir, format = "sql", chunkSize = 5000, force = false }) {
  const stagingDir = createFilteredSource(path.resolve(sourceDir));
  try {
    return writeSeed({ sourceDir: stagingDir, outputDir, format, chunkSize, force });
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
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
    if (!value) throw new ImportError(`missing value for ${name}`);
    if (name === "--source") options.sourceDir = value;
    else if (name === "--out") options.outputDir = value;
    else if (name === "--format") options.format = value;
    else if (name === "--chunk-size") options.chunkSize = Number(value);
    else throw new ImportError(`unknown argument: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/import-source-ignore-other.mjs [options]

This entrypoint ignores source/其他 and imports 诗、词、曲 plus 作者.json.

Options:
  --source <dir>       source directory (default: ../../source)
  --out <dir>          output directory (default: .data/seed)
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
    ignored: "source/其他"
  }, null, 2));
}

const currentFile = pathToFileURL(fileURLToPath(import.meta.url)).href;
const invokedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (currentFile === invokedFile) {
  main().catch((error) => {
    console.error(error instanceof ImportError ? error.message : error);
    process.exitCode = 1;
  });
}
