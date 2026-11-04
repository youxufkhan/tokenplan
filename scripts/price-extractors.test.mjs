import test from "node:test";
import assert from "node:assert/strict";
import { extractSubscription, guardPrice, matchStorePrice } from "./price-extractors.mjs";
const entry = { id: "claude-pro", sourceUrl: "https://claude.com/pricing", price: { amount: 20, currency: "USD", period: "month" } };
test("monthly price is scoped to the product and never annual equivalent", () => {
  const html = "<h3>Free</h3>$20<h3>Pro</h3>$17 Per month with annual subscription discount ($200 billed up front). $20 if billed monthly.<h3>Max</h3>$100 Per month";
  assert.equal(extractSubscription(html, entry).amount, 20);
  assert.equal(extractSubscription("<h3>Max</h3>$20 Per month", entry).status, "ambiguous");
  assert.equal(extractSubscription("<h3>Pro</h3>$17 Per month with annual subscription discount", entry).status, "ambiguous");
});
test("promotions and duplicate plan sections require review", () => {
  assert.equal(extractSubscription("<h3>Pro</h3>$20 if billed monthly. limited-time offer", entry).status, "ambiguous");
  assert.equal(extractSubscription("<h3>Pro</h3>$20 if billed monthly.<h3>Pro</h3>$25 if billed monthly.", entry).status, "ambiguous");
});
test("guard allows unchanged/free and bounded paid changes only", () => {
  assert.equal(guardPrice(0, 0), true);
  assert.equal(guardPrice(28, 20), true);
  for (const [next, prev] of [[29,20],[0,20],[10,0],[NaN,20]]) assert.equal(guardPrice(next,prev), false);
});
test("App Store requires storefront currency and monthly evidence independently of price", () => {
  const quote = { sourceUrl: "https://apps.apple.com/pk/app/example/id123", market: "PK", currency: "PKR", match: "Pro Monthly" };
  const row = { label: "Pro Monthly", currency: "PKR", period: "month", amount: 4900 };
  assert.equal(matchStorePrice([row], quote)?.amount, 4900);
  assert.equal(matchStorePrice([row,row], quote), null);
  assert.equal(matchStorePrice([{...row,currency:"USD"}], quote), null);
  assert.equal(matchStorePrice([{...row,period:null}], quote), null);
});
