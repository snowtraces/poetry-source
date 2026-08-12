import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.mjs";

test("serves the interactive debug page at the root route", async () => {
  const request = new Request("https://poetry-api.snowtraces.com/");
  const response = await worker.fetch(request, { ALLOWED_ORIGIN: "*" });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(body, /poetry-source API/);
  assert.match(body, /全部调试/);
  assert.match(body, /class="debug-layout"/);
  assert.match(body, /class="debug-panel"/);
  assert.match(body, /参数说明/);
  assert.match(body, /selected-parameters/);
  assert.match(body, /dynasty=%E6%98%8E/);
  assert.match(body, /e647d10f022b315ed1457b72d1457b72/);
  assert.match(body, /grid-template-columns: clamp\(180px, 26vw, 360px\)/);
  assert.match(body, /appearance: none/);
  assert.match(body, /min-height: 72px/);
  assert.match(body, /overflow-x: hidden/);
  assert.match(body, /\.debug-panel \{[^}]*overflow: hidden/);
  assert.match(body, /overscroll-behavior: contain/);
  assert.match(body, /scrollbar-gutter: stable/);
  assert.match(body, /max-width: 360px/);
  assert.equal((body.match(/class="example-item/g) || []).length, 14);
  assert.match(body, /\/v1\/health/);
  assert.match(body, /\/v1\/works\/random/);
  assert.match(body, /\/v1\/authors\/.*\/works/);
});
