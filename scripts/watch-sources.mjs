/** Observe source pages; only exact product/billing matches can verify a price. */
import { fetchText, readData, writeData, report, today, logChange } from "./sync-lib.mjs";
import { extractSubscription, guardPrice } from "./price-extractors.mjs";
const plans = readData("plans.json");
const api = readData("api-prices.json");
const checks = readData("source-checks.json");
const pages = new Map();
for (const url of new Set([...plans, ...api].map((entry) => entry.sourceUrl))) {
  try { pages.set(url, { html: await fetchText(url) }); }
  catch (error) { pages.set(url, { error: error.message }); }
}
for (const [dataset, entries] of [["plans", plans], ["api", api]]) {
  for (const entry of entries) {
    const key = `${dataset}:${entry.id}`;
    const page = pages.get(entry.sourceUrl);
    const observation = page.error ? { status: "fetch-failed", evidence: page.error }
      : dataset === "plans" ? extractSubscription(page.html, entry)
      : { status: "unsupported", evidence: "API rate extraction requires a product-specific adapter" };
    checks[key] = { checkedAt: new Date().toISOString(), sourceUrl: entry.sourceUrl,
      extractorVersion: "subscriptions-v1", status: observation.status, evidence: observation.evidence.slice(0, 600),
      ...(observation.amount != null ? { candidate: observation.amount } : {}) };
    if (observation.status === "exact-match") entry.priceVerifiedAt = today();
    else if (observation.status === "changed-price" && guardPrice(observation.amount, entry.price.amount)
      && process.env.TOKENPLAN_AUTO_WEB_PRICES === "1") {
      logChange({ id: entry.id, from: entry.price.amount, to: observation.amount, currency: "USD",
        period: "month", channel: "web", source: entry.sourceUrl, evidenceRef: key });
      entry.price.amount = observation.amount;
      entry.priceVerifiedAt = today();
    } else if (observation.status !== "unsupported") report(`${key}: ${observation.status}; ${observation.evidence.slice(0, 200)}`);
  }
}
writeData("source-checks.json", checks);
writeData("plans.json", plans);
writeData("api-prices.json", api);
