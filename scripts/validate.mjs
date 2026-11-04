/**
 * Data gate: structure, uniqueness, sources, freshness, and platformId cross-references.
 *
 * - Every price must trace to an official page (sourceUrl); no secondary blogs.
 * - A verifiedAt older than 90 days only warns, but is named in the report.
 * - Low-confidence entries that carry a price are flagged for manual review.
 * - platformId must exist in platforms.json so typos cannot silently drop seller labels.
 * - A verification date in the future fails the check.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import Ajv from "ajv";
import { assertPublicData } from "./public-boundary.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const plans = read("../data/plans.json");
const apiPrices = read("../data/api-prices.json");
const rankings = read("../data/rankings.json");
const markets = read("../data/markets.json");
const usd = read("../data/usd.json");
const history = read("../data/price-history.json");
assert.ok(Array.isArray(history), "price-history must be an array");
const platforms = read("../data/platforms.json");
for (const [name, data] of Object.entries({ plans, apiPrices, rankings, markets, usd, platforms }))
  assertPublicData(data, name);
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const validate = (schemaName, data, label) => {
  const schema = read(`../data/${schemaName}`);
  const ok = ajv.validate(schema, data);
  if (!ok) {
    const errs = ajv.errors
      .map((e) => `  ${e.instancePath || "/"} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues})` : ""}`)
      .join("\n");
    assert.fail(`${label} failed schema validation:\n${errs}`);
  }
};

validate("plans.schema.json", plans, "plans");
validate("api-prices.schema.json", apiPrices, "api-prices");

const platformIds = new Set(platforms.platforms.map((p) => p.id));
assert.ok(platformIds.size >= 15, `platforms registry too small: ${platformIds.size}`);
const offeringIds = new Set(Object.keys(platforms.offeringDefs));
const bundleIds = new Set(Object.keys(platforms.bundleDefs));
for (const p of platforms.platforms) {
  assert.ok(offeringIds.has(p.offering), `platforms ${p.id} has invalid offering: ${p.offering}`);
  assert.ok(bundleIds.has(p.bundle), `platforms ${p.id} has invalid bundle: ${p.bundle}`);
  assert.ok(/^https:\/\//.test(p.url), `platforms ${p.id} url is not https`);
}

const ids = new Set();
for (const p of plans) {
  assert.ok(!ids.has(p.id), `duplicate plans id: ${p.id}`);
  ids.add(p.id);
  assert.ok(p.sourceUrl.startsWith("https://"), `plans ${p.id} lacks an official source`);
  const unverified = p.confidence === "low" || p.status === "unknown" || p.status === "no-plan" || p.status === "discontinued";
  assert.ok(p.buyUrl?.startsWith("https://") || unverified, `plans ${p.id} lacks a direct buy link (only unverified entries may omit it)`);
  assert.ok(p.platformId == null || platformIds.has(p.platformId), `plans ${p.id} platformId not registered: ${p.platformId}`);
  if (p.confidence === "low" && p.price.amount != null) {
    console.warn(`⚠️  Low confidence with a price, review: ${p.id} (${p.vendor} ${p.name})`);
  }
  if (p.platformId == null) console.warn(`⚠️  Seller not labeled: plans ${p.id} (${p.vendor})`);
}

const apiIds = new Set();
for (const a of apiPrices) {
  assert.ok(!apiIds.has(a.id), `duplicate api-prices id: ${a.id}`);
  apiIds.add(a.id);
  assert.ok(a.sourceUrl.startsWith("https://"), `api-prices ${a.id} lacks an official source`);
  assert.ok(a.input >= 0 && a.output >= 0, `api-prices ${a.id} has an invalid price`);
  assert.ok(a.platformId == null || platformIds.has(a.platformId), `api-prices ${a.id} platformId not registered: ${a.platformId}`);
  if (a.platformId == null) console.warn(`⚠️  Seller not labeled: api ${a.id} (${a.vendor})`);
}

assert.ok(plans.length >= 20, `too few plans: ${plans.length}`);
assert.ok(apiPrices.length >= 15, `too few api-prices: ${apiPrices.length}`);
assert.ok(rankings.models.length > 50, "rankings model count is abnormal");
assert.ok(rankings.snapshotDate, "rankings is missing snapshotDate");

for (const [code, rate] of Object.entries(markets.fx.rates)) assert.ok(Number.isFinite(rate) && rate > 0, `Invalid FX rate: ${code}`);
assert.ok(markets.fx.rates.PKR, "Missing PKR rate");
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(markets.fx.date));
assert.equal(new URL(markets.fx.sourceUrl).protocol, "https:");
const tomorrow = new Date(Date.now() + 86400000);
assert.ok(new Date(markets.fx.date) <= tomorrow, "FX date is in the future");
const MARKET_CURRENCY = { US: "USD", PK: "PKR", AE: "AED", SA: "SAR" };
const marketQuotes = new Set();
for (const quote of markets.quotes) {
  const key = `${quote.market}:${quote.planId}:${quote.channel}`;
  assert.ok(!marketQuotes.has(key), `Duplicate regional quote: ${key}`);
  marketQuotes.add(key);
  assert.ok(ids.has(quote.planId), `Unknown plan: ${quote.planId}`);
  assert.equal(MARKET_CURRENCY[quote.market], quote.currency, `Invalid market and currency: ${key}`);
  assert.ok(quote.currency === "USD" || markets.fx.rates[quote.currency], `No FX rate for ${quote.currency}`);
  assert.ok(Number.isFinite(quote.amount) && quote.amount >= 0, `Invalid price: ${key}`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(quote.verifiedAt), `Missing verification date: ${key}`);
  assert.ok(new Date(quote.verifiedAt) <= tomorrow, `Verification date is in the future: ${key}`);
  assert.equal(new URL(quote.sourceUrl).protocol, "https:");
}
assert.ok(plans.every((p) => p.region === "global" && p.price.currency === "USD"));
assert.ok(apiPrices.every((a) => a.region === "global" && a.currency === "USD"));

for (const key of ["cheapest", "priciest"]) {
  assert.ok(usd.highlights.plans[key].length > 0, `usd.highlights.plans.${key} is empty`);
}

const staleDays = 90;
const today = new Date();
for (const item of [...plans, ...apiPrices]) {
  const days = (today - new Date(item.verifiedAt)) / 86400000;
  if (days > staleDays) {
    console.warn(`⚠️  Not reverified for over ${staleDays} days: ${item.id} (${item.verifiedAt})`);
  }
}

console.log(`Validated ${plans.length} plans, ${apiPrices.length} API prices and ${marketQuotes.size} local quotes.`);
