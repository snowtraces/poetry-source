import test from "node:test";
import assert from "node:assert/strict";

import { toFtsQuery, toSearchText, tokenizeSearchText } from "../src/search.mjs";
import worker from "../src/index.mjs";

test("tokenizes Chinese text into characters and bigrams", () => {
  const tokens = tokenizeSearchText("静夜思");
  assert.deepEqual(tokens, ["静", "夜", "静夜", "思", "夜思"]);
  assert.equal(toSearchText("静夜思"), "静 夜 静夜 思 夜思");
});

test("keeps Latin words as searchable tokens", () => {
  assert.equal(toSearchText("Li Bai 101"), "li bai 101");
  assert.equal(toFtsQuery("静夜"), '"静" AND "夜" AND "静夜"');
});

test("returns null for an empty query", () => {
  assert.equal(toFtsQuery("，。  "), null);
});

test("rejects single-character full-text work queries", async () => {
  const response = await worker.fetch(
    new Request("https://poetry-api.snowtraces.com/v1/works?q=静"),
    { ALLOWED_ORIGIN: "*", DB: { prepare() { throw new Error("DB should not be queried"); } } }
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "QUERY_TOO_SHORT");
});
