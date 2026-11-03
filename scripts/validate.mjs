/**
 * 数据门禁：结构、唯一性、来源、时效，以及 platformId 与 platforms.json 的交叉引用。
 *
 * 原则：
 * - 价格必须能溯源到官方页面（sourceUrl），不接受二手博客。
 * - verifiedAt 过旧（默认 90 天）只警告不阻断，但会在报告里点名。
 * - 任何一条「低置信 + 有价格」的条目都会被标出来，提醒人工复核。
 * - platformId 必须能在 platforms.json 里找到，杜绝拼错后静默丢失「原厂/中转」标注。
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
    assert.fail(`${label} 结构不合法：\n${errs}`);
  }
};

validate("plans.schema.json", plans, "plans");
validate("api-prices.schema.json", apiPrices, "api-prices");

const platformIds = new Set(platforms.platforms.map((p) => p.id));
assert.ok(platformIds.size >= 15, `platforms 注册表过小：${platformIds.size}`);
const offeringIds = new Set(Object.keys(platforms.offeringDefs));
const bundleIds = new Set(Object.keys(platforms.bundleDefs));
for (const p of platforms.platforms) {
  assert.ok(offeringIds.has(p.offering), `platforms ${p.id} offering 非法：${p.offering}`);
  assert.ok(bundleIds.has(p.bundle), `platforms ${p.id} bundle 非法：${p.bundle}`);
  assert.ok(/^https:\/\//.test(p.url), `platforms ${p.id} url 非 https`);
}

const ids = new Set();
for (const p of plans) {
  assert.ok(!ids.has(p.id), `plans id 重复：${p.id}`);
  ids.add(p.id);
  assert.ok(p.sourceUrl.startsWith("https://"), `plans ${p.id} 缺官方来源`);
  const unverified = p.confidence === "low" || p.status === "unknown" || p.status === "no-plan" || p.status === "discontinued";
  assert.ok(p.buyUrl?.startsWith("https://") || unverified, `plans ${p.id} 缺购买直达链接（只有未核实条目可为空）`);
  assert.ok(p.platformId == null || platformIds.has(p.platformId), `plans ${p.id} platformId 未注册：${p.platformId}`);
  if (p.confidence === "low" && p.price.amount != null) {
    console.warn(`⚠️  低置信带价格，需复核：${p.id}（${p.vendor} ${p.name}）`);
  }
  if (p.platformId == null) console.warn(`⚠️  未标注售卖主体：plans ${p.id}（${p.vendor}）`);
}

const apiIds = new Set();
for (const a of apiPrices) {
  assert.ok(!apiIds.has(a.id), `api-prices id 重复：${a.id}`);
  apiIds.add(a.id);
  assert.ok(a.sourceUrl.startsWith("https://"), `api-prices ${a.id} 缺官方来源`);
  assert.ok(a.input >= 0 && a.output >= 0, `api-prices ${a.id} 价格非法`);
  assert.ok(a.platformId == null || platformIds.has(a.platformId), `api-prices ${a.id} platformId 未注册：${a.platformId}`);
  if (a.platformId == null) console.warn(`⚠️  未标注售卖主体：api ${a.id}（${a.vendor}）`);
}

assert.ok(plans.length >= 20, `plans 条目过少：${plans.length}`);
assert.ok(apiPrices.length >= 15, `api-prices 条目过少：${apiPrices.length}`);
assert.ok(rankings.models.length > 50, "rankings 模型数异常");
assert.ok(rankings.snapshotDate, "rankings 缺 snapshotDate");

assert.ok(Number.isFinite(markets.fx.pkrPerUsd) && markets.fx.pkrPerUsd > 0);
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(markets.fx.date));
assert.equal(new URL(markets.fx.sourceUrl).protocol, "https:");
const marketQuotes = new Set();
for (const quote of markets.quotes) {
  const key = `${quote.market}:${quote.planId}:${quote.channel}`;
  assert.ok(!marketQuotes.has(key), `Duplicate regional quote: ${key}`);
  marketQuotes.add(key);
  assert.ok(ids.has(quote.planId), `Unknown plan: ${quote.planId}`);
  assert.ok((quote.market === "US" && quote.currency === "USD")
    || (quote.market === "PK" && quote.currency === "PKR"), `Invalid market and currency: ${key}`);
  assert.ok(Number.isFinite(quote.amount) && quote.amount >= 0, `Invalid price: ${key}`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(quote.verifiedAt), `Missing verification date: ${key}`);
  assert.equal(new URL(quote.sourceUrl).protocol, "https:");
}
assert.ok(plans.every((p) => p.region === "global" && p.price.currency === "USD"));
assert.ok(apiPrices.every((a) => a.region === "global" && a.currency === "USD"));

for (const key of ["cheapest", "priciest"]) {
  assert.ok(usd.highlights.plans[key].length > 0, `usd.highlights.plans.${key} 为空`);
}

const staleDays = 90;
const today = new Date();
for (const item of [...plans, ...apiPrices]) {
  const days = (today - new Date(item.verifiedAt)) / 86400000;
  if (days > staleDays) {
    console.warn(`⚠️  超过 ${staleDays} 天未复核：${item.id}（${item.verifiedAt}）`);
  }
}

console.log(`Validated ${plans.length} plans, ${apiPrices.length} API prices and ${marketQuotes.size} local quotes.`);
