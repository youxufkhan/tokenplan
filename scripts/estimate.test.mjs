import test from "node:test";
import assert from "node:assert/strict";
import { estimateApiCost } from "../site/src/estimate.ts";

test("estimates monthly input, output and cache hits", () => {
  assert.equal(estimateApiCost({ inputUsd: 2, outputUsd: 8, cacheHitUsd: 0.4 }, 10, 2, 50), 28);
});

test("unpublished cache rates cannot be used to estimate savings", () => {
  const rates = { inputUsd: 2, outputUsd: 8, cacheHitUsd: null };
  assert.equal(estimateApiCost(rates, 10, 2, 0), 36);
  assert.equal(estimateApiCost(rates, 10, 2, 10), null);
});

test("rejects invalid usage instead of producing a price", () => {
  const rates = { inputUsd: 2, outputUsd: 8, cacheHitUsd: 0 };
  assert.equal(estimateApiCost(rates, -1, 2, 10), null);
  assert.equal(estimateApiCost(rates, 10, NaN, 10), null);
  assert.equal(estimateApiCost(rates, 10, 2, 101), null);
  assert.equal(estimateApiCost(rates, 10, 2, 100), 16);
});
