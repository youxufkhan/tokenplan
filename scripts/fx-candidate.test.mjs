import test from "node:test";
import assert from "node:assert/strict";
import { fxCandidate } from "./fx-candidate.mjs";
const previous = { date: "2026-11-03", rates: { PKR: 276, AED: 3.67, SAR: 3.75 } };
const fetched = "2026-11-05T12:00:00Z";
const body = { result: "success", base_code: "USD", time_last_update_unix: Date.parse("2026-11-04T10:00:00Z") / 1000, rates: { PKR: 277, AED: 3.67, SAR: 3.75 } };
test("FX date uses publication, with separate fetch time", () => {
  const next = fxCandidate(body, previous, fetched);
  assert.equal(next.date, "2026-11-04");
  assert.equal(next.fetchedAt, fetched);
});
test("FX rejects partial, stale, invalid and excessive changes atomically", () => {
  for (const change of [{ rates: { PKR: 277 } }, { time_last_update_unix: 1 }, { rates: { ...body.rates, PKR: 400 } }, { base_code: "EUR" }]) assert.throws(() => fxCandidate({ ...body, ...change }, previous, fetched));
  assert.deepEqual(previous.rates, { PKR: 276, AED: 3.67, SAR: 3.75 });
});
