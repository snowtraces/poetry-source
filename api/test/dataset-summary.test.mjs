import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.mjs";

function summaryDb() {
  const summary = {
    works: 3,
    authors: 2,
    by_type: [{ type: "poetry", count: 3 }],
    by_dynasty: [{ dynasty: "唐", count: 3 }],
    dynasties: ["唐"]
  };
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        async all() {
          return {
            results: [
              { key: "summary", value: JSON.stringify(summary) },
              { key: "manifest", value: "null" }
            ]
          };
        }
      };
    }
  };
}

function invalidSummaryDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        async all() {
          return { results: [{ key: "manifest", value: "null" }] };
        }
      };
    }
  };
}

test("meta reads the precomputed summary instead of scanning works", async () => {
  const db = summaryDb();
  const response = await worker.fetch(
    new Request("https://poetry-api.snowtraces.com/v1/meta"),
    { ALLOWED_ORIGIN: "*", DB: db }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data.works, 3);
  assert.deepEqual(body.data.by_dynasty, [{ dynasty: "唐", count: 3 }]);
  assert.equal(db.calls.length, 1);
  assert.match(db.calls[0], /dataset_meta/);
});

test("dynasties reads the precomputed list instead of DISTINCT dynasty", async () => {
  const db = summaryDb();
  const response = await worker.fetch(
    new Request("https://poetry-api.snowtraces.com/v1/dynasties"),
    { ALLOWED_ORIGIN: "*", DB: db }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.data, ["唐"]);
  assert.equal(db.calls.length, 1);
  assert.match(db.calls[0], /dataset_meta/);
});

test("meta and dynasties fail without a precomputed summary instead of scanning tables", async () => {
  for (const path of ["/v1/meta", "/v1/dynasties"]) {
    const db = invalidSummaryDb();
    const response = await worker.fetch(
      new Request(`https://poetry-api.snowtraces.com${path}`),
      { ALLOWED_ORIGIN: "*", DB: db }
    );
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.error.code, "DATASET_META_UNAVAILABLE");
    assert.equal(db.calls.length, 1);
    assert.doesNotMatch(db.calls[0], /COUNT|GROUP BY|DISTINCT/);
  }
});
