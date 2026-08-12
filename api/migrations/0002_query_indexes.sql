-- Cover the public API's filtered and random access paths.
-- The existing type+dynasty index remains useful for combined list queries.
CREATE INDEX IF NOT EXISTS works_dynasty_row_id
  ON works(dynasty, row_id);

CREATE INDEX IF NOT EXISTS works_type_row_id
  ON works(type, row_id);

CREATE INDEX IF NOT EXISTS works_type_dynasty_random_key
  ON works(type, dynasty, random_key);

CREATE INDEX IF NOT EXISTS works_type_random_key
  ON works(type, random_key);

CREATE INDEX IF NOT EXISTS works_dynasty_random_key
  ON works(dynasty, random_key);

CREATE INDEX IF NOT EXISTS works_author_random_key
  ON works(author_id, random_key);
