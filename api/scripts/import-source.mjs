import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { toSearchText } from "../src/search.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIR = path.resolve(SCRIPT_DIR, "../../source");
const DEFAULT_OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../.data/seed");

const TYPE_BY_ROOT = new Map([
  ["诗", "poetry"],
  ["词", "ci"],
  ["曲", "qu"],
  ["其他", "other"]
]);

export class ImportError extends Error {}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function classifySourceFile(relativePath) {
  const normalized = toPosix(relativePath);
  const basename = path.posix.basename(normalized);

  if (basename === "作者.json") {
    return { variant: "authors", type: null };
  }

  if (!basename.endsWith(".json")) return null;

  const root = normalized.split("/")[0];
  const type = TYPE_BY_ROOT.get(root) ?? "other";
  let variant = "canonical";
  if (basename.endsWith(".base.json")) variant = "base";
  if (basename.endsWith(".pinyin.json")) variant = "pinyin";

  return { variant, type };
}

export function walkJsonFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new ImportError(`source directory does not exist: ${rootDir}`);
  }

  const files = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(absolutePath);
      }
    }
  };

  visit(rootDir);
  return files.sort((left, right) => left.localeCompare(right, "zh-CN"));
}

export function parseJsonRecords(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new ImportError(`invalid JSON: ${filePath}\n${error.message}`);
  }

  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  throw new ImportError(`expected an object or array in ${filePath}`);
}

function requireRecordId(record, filePath, index) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new ImportError(`record ${index} in ${filePath} is not an object`);
  }
  if (typeof record.id !== "string" || record.id.length === 0) {
    throw new ImportError(`record ${index} in ${filePath} has no string id`);
  }
}

function siblingVariant(filePath, variant) {
  if (!filePath.endsWith(".json")) return filePath;
  return `${filePath.slice(0, -5)}.${variant}.json`;
}

function indexRecordsById(filePath) {
  const records = parseJsonRecords(filePath);
  const indexed = new Map();
  records.forEach((record, index) => {
    requireRecordId(record, filePath, index);
    if (indexed.has(record.id)) {
      throw new ImportError(`duplicate id ${record.id} in ${filePath}`);
    }
    indexed.set(record.id, record);
  });
  return indexed;
}

export function hashToInt(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2147483647;
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

export function makeWorkRow(record, sourceInfo, pinyinRecord = null) {
  const content = Array.isArray(record.content)
    ? record.content
    : record.content === undefined || record.content === null
      ? []
      : [record.content];
  const pinyin = pinyinRecord && Array.isArray(pinyinRecord.pinyin)
    ? pinyinRecord.pinyin
    : null;

  return {
    id: record.id,
    type: sourceInfo.type,
    title: stringValue(record.title),
    author_id: record.authorId ? String(record.authorId) : null,
    author_name: stringValue(record.authorName),
    dynasty: stringValue(record.dynasty),
    content_json: JSON.stringify(content),
    pinyin_json: pinyin ? JSON.stringify(pinyin) : null,
    payload_json: JSON.stringify(record),
    title_search: toSearchText(record.title),
    author_search: toSearchText(record.authorName),
    source_file: sourceInfo.relativePath,
    random_key: hashToInt(record.id)
  };
}

export function makeAuthorRow(record, filePath, index) {
  requireRecordId(record, filePath, index);
  return {
    id: record.id,
    name: stringValue(record.name),
    dynasty: stringValue(record.dynasty),
    birth_year: record.birthYear === undefined ? null : String(record.birthYear),
    death_year: record.deathYear === undefined ? null : String(record.deathYear),
    description: stringValue(record.desc),
    payload_json: JSON.stringify(record)
  };
}

function sourceEntries(sourceDir) {
  return walkJsonFiles(sourceDir).map((absolutePath) => {
    const relativePath = toPosix(path.relative(sourceDir, absolutePath));
    const classification = classifySourceFile(relativePath);
    return {
      absolutePath,
      relativePath,
      size: fs.statSync(absolutePath).size,
      ...classification
    };
  });
}

export function* iterateWorkRows(sourceDir) {
  const entries = sourceEntries(sourceDir);
  const canonicalEntries = entries.filter((entry) => entry.variant === "canonical");
  if (canonicalEntries.length === 0) {
    throw new ImportError(`no canonical *.json files found under ${sourceDir}`);
  }

  const seen = new Map();
  for (const entry of canonicalEntries) {
    const pinyinPath = siblingVariant(entry.absolutePath, "pinyin");
    const pinyinById = fs.existsSync(pinyinPath) ? indexRecordsById(pinyinPath) : new Map();

    const records = parseJsonRecords(entry.absolutePath);
    records.forEach((record, index) => requireRecordId(record, entry.absolutePath, index));

    for (const record of records) {
      const previous = seen.get(record.id);
      if (previous) {
        throw new ImportError(
          `duplicate canonical id ${record.id} in ${previous} and ${entry.relativePath}`
        );
      }
      seen.set(record.id, entry.relativePath);
      yield makeWorkRow(record, entry, pinyinById.get(record.id) ?? null);
    }
  }
}

export function* iterateAuthorRows(sourceDir) {
  const entries = sourceEntries(sourceDir).filter((entry) => entry.variant === "authors");
  if (entries.length === 0) return;
  if (entries.length > 1) {
    throw new ImportError(`expected one authors file, found ${entries.length}`);
  }

  const entry = entries[0];
  const seen = new Set();
  const records = parseJsonRecords(entry.absolutePath);
  for (const [index, record] of records.entries()) {
    const row = makeAuthorRow(record, entry.absolutePath, index);
    if (seen.has(row.id)) throw new ImportError(`duplicate author id ${row.id}`);
    seen.add(row.id);
    yield row;
  }
}

export function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const WORK_COLUMNS = [
  "id",
  "type",
  "title",
  "author_id",
  "author_name",
  "dynasty",
  "content_json",
  "pinyin_json",
  "payload_json",
  "title_search",
  "author_search",
  "source_file",
  "random_key"
];

const AUTHOR_COLUMNS = [
  "id",
  "name",
  "dynasty",
  "birth_year",
  "death_year",
  "description",
  "payload_json"
];

function insertSql(table, columns, row) {
  const values = columns.map((column) => sqlLiteral(row[column])).join(", ");
  return `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${values});`;
}

function ensureOutputDir(outputDir, force) {
  fs.mkdirSync(outputDir, { recursive: true });
  const existing = fs.readdirSync(outputDir);
  if (existing.length > 0 && !force) {
    throw new ImportError(
      `output directory is not empty: ${outputDir}; use --force to overwrite generated files`
    );
  }
}

function createSummary() {
  return {
    works: 0,
    authors: 0,
    byType: new Map(),
    byDynasty: new Map()
  };
}

function addSummaryCount(map, value) {
  map.set(value, (map.get(value) ?? 0) + 1);
}

function addWorkToSummary(summary, row) {
  summary.works += 1;
  addSummaryCount(summary.byType, row.type);
  addSummaryCount(summary.byDynasty, row.dynasty);
}

function addAuthorToSummary(summary) {
  summary.authors += 1;
}

function compareSqlText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function finalizeSummary(summary) {
  const byType = [...summary.byType.entries()]
    .sort(([left], [right]) => compareSqlText(left, right))
    .map(([type, count]) => ({ type, count }));
  const byDynasty = [...summary.byDynasty.entries()]
    .sort(([left], [right]) => compareSqlText(left, right))
    .map(([dynasty, count]) => ({ dynasty, count }));

  return {
    works: summary.works,
    authors: summary.authors,
    by_type: byType,
    by_dynasty: byDynasty,
    dynasties: byDynasty.filter(({ dynasty }) => dynasty !== "").map(({ dynasty }) => dynasty)
  };
}

function writeSummarySql(outputDir, summary) {
  const filename = "dataset-meta.sql";
  const value = JSON.stringify(summary);
  fs.writeFileSync(
    path.join(outputDir, filename),
    `INSERT OR REPLACE INTO dataset_meta (key, value) VALUES ('summary', ${sqlLiteral(value)});\n`,
    "utf8"
  );
  return filename;
}

function createManifest(sourceDir, workCount, authorCount, generatedFiles, summary) {
  const entries = sourceEntries(sourceDir);
  const byVariant = {};
  const byType = {};
  for (const entry of entries) {
    byVariant[entry.variant] = (byVariant[entry.variant] ?? 0) + entry.size;
    if (entry.type) byType[entry.type] = (byType[entry.type] ?? 0) + 1;
  }

  const canonicalPaths = new Set(
    entries.filter((entry) => entry.variant === "canonical").map((entry) => entry.relativePath)
  );
  const orphanVariants = entries
    .filter((entry) => ["base", "pinyin"].includes(entry.variant))
    .filter((entry) => !canonicalPaths.has(entry.relativePath.replace(`.${entry.variant}.json`, ".json")))
    .map((entry) => entry.relativePath);

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source: {
      directory: path.basename(sourceDir),
      file_count: entries.length,
      bytes: entries.reduce((total, entry) => total + entry.size, 0),
      bytes_by_variant: byVariant,
      canonical_file_count_by_type: byType,
      orphan_variant_files: orphanVariants
    },
    records: {
      works: workCount,
      authors: authorCount
    },
    statistics: summary,
    generated_files: generatedFiles,
    notes: [
      "base files are retained in the source archive and are treated as the canonical payload when they duplicate canonical records",
      "pinyin is joined to canonical records by id when a sibling .pinyin.json file exists"
    ]
  };
}

function writeChunk(outputDir, prefix, index, statements) {
  const filename = `${prefix}-${String(index).padStart(4, "0")}.sql`;
  const content = ["BEGIN TRANSACTION;", ...statements, "COMMIT;", ""].join("\n");
  fs.writeFileSync(path.join(outputDir, filename), content, "utf8");
  return filename;
}

function writeSqlSeed(sourceDir, outputDir, chunkSize) {
  const generatedFiles = [];
  let workCount = 0;
  let authorCount = 0;
  let workChunkIndex = 0;
  let authorChunkIndex = 0;
  let workStatements = [];
  let authorStatements = [];
  const summary = createSummary();

  for (const row of iterateWorkRows(sourceDir)) {
    workStatements.push(insertSql("works", WORK_COLUMNS, row));
    workCount += 1;
    addWorkToSummary(summary, row);
    if (workStatements.length >= chunkSize) {
      generatedFiles.push(writeChunk(outputDir, "works", ++workChunkIndex, workStatements));
      workStatements = [];
    }
  }
  if (workStatements.length > 0) {
    generatedFiles.push(writeChunk(outputDir, "works", ++workChunkIndex, workStatements));
  }

  for (const row of iterateAuthorRows(sourceDir)) {
    authorStatements.push(insertSql("authors", AUTHOR_COLUMNS, row));
    authorCount += 1;
    addAuthorToSummary(summary);
    if (authorStatements.length >= chunkSize) {
      generatedFiles.push(writeChunk(outputDir, "authors", ++authorChunkIndex, authorStatements));
      authorStatements = [];
    }
  }
  if (authorStatements.length > 0) {
    generatedFiles.push(writeChunk(outputDir, "authors", ++authorChunkIndex, authorStatements));
  }

  const rebuildFilename = "rebuild-fts.sql";
  fs.writeFileSync(
    path.join(outputDir, rebuildFilename),
    "INSERT INTO works_fts(works_fts) VALUES ('rebuild');\n",
    "utf8"
  );
  generatedFiles.push(rebuildFilename);

  const verifyFilename = "verify.sql";
  fs.writeFileSync(
    path.join(outputDir, verifyFilename),
    [
      "SELECT 'works' AS table_name, COUNT(*) AS row_count FROM works;",
      "SELECT 'authors' AS table_name, COUNT(*) AS row_count FROM authors;",
      "SELECT type, COUNT(*) AS row_count FROM works GROUP BY type ORDER BY type;",
      "SELECT dynasty, COUNT(*) AS row_count FROM works GROUP BY dynasty ORDER BY dynasty;",
      ""
    ].join("\n"),
    "utf8"
  );
  generatedFiles.push(verifyFilename);

  return { workCount, authorCount, generatedFiles, summary: finalizeSummary(summary) };
}

function writeNdjsonSeed(sourceDir, outputDir) {
  const worksPath = path.join(outputDir, "works.ndjson");
  const authorsPath = path.join(outputDir, "authors.ndjson");
  const workHandle = fs.openSync(worksPath, "w");
  const authorHandle = fs.openSync(authorsPath, "w");
  let workCount = 0;
  let authorCount = 0;
  const summary = createSummary();

  try {
    for (const row of iterateWorkRows(sourceDir)) {
      fs.writeSync(workHandle, `${JSON.stringify(row)}\n`);
      workCount += 1;
      addWorkToSummary(summary, row);
    }
    for (const row of iterateAuthorRows(sourceDir)) {
      fs.writeSync(authorHandle, `${JSON.stringify(row)}\n`);
      authorCount += 1;
      addAuthorToSummary(summary);
    }
  } finally {
    fs.closeSync(workHandle);
    fs.closeSync(authorHandle);
  }

  return {
    workCount,
    authorCount,
    generatedFiles: ["works.ndjson", "authors.ndjson"],
    summary: finalizeSummary(summary)
  };
}

export function writeSeed({ sourceDir, outputDir, format = "sql", chunkSize = 5000, force = false }) {
  const absoluteSourceDir = path.resolve(sourceDir);
  const absoluteOutputDir = path.resolve(outputDir);
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 50000) {
    throw new ImportError("chunk size must be an integer between 1 and 50000");
  }
  if (!["sql", "ndjson", "both"].includes(format)) {
    throw new ImportError("format must be sql, ndjson, or both");
  }

  ensureOutputDir(absoluteOutputDir, force);
  const generatedFiles = [];
  let counts = null;

  if (format === "sql" || format === "both") {
    counts = writeSqlSeed(absoluteSourceDir, absoluteOutputDir, chunkSize);
    generatedFiles.push(...counts.generatedFiles);
  }
  if (format === "ndjson" || format === "both") {
    const ndjsonCounts = writeNdjsonSeed(absoluteSourceDir, absoluteOutputDir);
    counts ??= ndjsonCounts;
    generatedFiles.push(...ndjsonCounts.generatedFiles);
  }

  if (format === "sql" || format === "both") {
    generatedFiles.push(writeSummarySql(absoluteOutputDir, counts.summary));
  }

  const manifest = createManifest(
    absoluteSourceDir,
    counts.workCount,
    counts.authorCount,
    generatedFiles,
    counts.summary
  );
  const manifestPath = path.join(absoluteOutputDir, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { ...manifest, output_dir: absoluteOutputDir };
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
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--force") {
      options.force = true;
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
  console.log(`Usage: node scripts/import-source.mjs [options]

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

  const manifest = writeSeed(options);
  console.log(JSON.stringify({
    output_dir: manifest.output_dir,
    works: manifest.records.works,
    authors: manifest.records.authors,
    generated_files: manifest.generated_files.length
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
