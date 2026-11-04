import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAmount, parseIap, pickPrice, pageNumbers, validRate } from "./sync-lib.mjs";

const iap = parseIap(readFileSync(new URL("./fixtures/appstore-iap.html", import.meta.url), "utf8"));

test("parses App Store in-app purchase prices in several currencies", () => {
  assert.equal(parseAmount("Rs 1,400.00"), 1400);
  assert.equal(parseAmount("$19.99"), 19.99);
  assert.equal(iap.length, 4);
});
test("repeated labels resolve by closeness to the recorded price", () => {
  assert.equal(pickPrice(iap, "ChatGPT Plus", 19.99), 19.99);
  assert.equal(pickPrice(iap, "ChatGPT Plus", 200), 200);
  assert.equal(pickPrice(iap, "ChatGPT Plus", 60), null, "ambiguous or out of band is rejected");
  assert.equal(pickPrice(iap, "Missing", 19.99), null);
});
test("page numbers ignore scripts and normalise separators", () => {
  const nums = pageNumbers("<script>var a=999</script><p>$1,400.00 and 0.006</p>");
  assert.ok(nums.has(1400) && nums.has(0.006) && !nums.has(999));
});
test("FX guard rejects non-finite, non-positive and large swings", () => {
  assert.equal(validRate(280, 276), true);
  assert.equal(validRate(300, 276), false);
  assert.equal(validRate(NaN, 276), false);
  assert.equal(validRate(0, null), false);
});
