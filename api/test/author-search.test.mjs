import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.mjs";

function authorsDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = { sql, bindings: [] };
      calls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return {
            async all() {
              return {
                results: [{
                  rowid: 7,
                  id: "author-7",
                  name: "李白",
                  dynasty: "唐",
                  birth_year: "701",
                  death_year: "762"
                }]
              };
            }
          };
        }
      };
    }
  };
}

test("author search uses exact name matching instead of surname prefix matching", async () => {
  const db = authorsDb();
  const response = await worker.fetch(
    new Request("https://poetry-api.snowtraces.com/v1/authors?q=李白&page_size=10"),
    { ALLOWED_ORIGIN: "*", DB: db }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.data[0].name, "李白");
  assert.match(db.calls[0].sql, /name = \?/);
  assert.doesNotMatch(db.calls[0].sql, /LIKE/);
  assert.deepEqual(db.calls[0].bindings, ["李白", 11]);
});
