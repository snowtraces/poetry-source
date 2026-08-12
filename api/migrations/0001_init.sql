CREATE TABLE IF NOT EXISTS works (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author_id TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  dynasty TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '[]',
  pinyin_json TEXT,
  payload_json TEXT NOT NULL,
  title_search TEXT NOT NULL DEFAULT '',
  author_search TEXT NOT NULL DEFAULT '',
  source_file TEXT NOT NULL,
  random_key INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS works_type_dynasty_row_id
  ON works(type, dynasty, row_id);

CREATE INDEX IF NOT EXISTS works_author_row_id
  ON works(author_id, row_id);

CREATE INDEX IF NOT EXISTS works_random_key
  ON works(random_key);

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  dynasty TEXT NOT NULL DEFAULT '',
  birth_year TEXT,
  death_year TEXT,
  description TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS authors_name
  ON authors(name);

CREATE TABLE IF NOT EXISTS dataset_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS works_fts USING fts5(
  title_search,
  author_search,
  content='works',
  content_rowid='row_id'
);
