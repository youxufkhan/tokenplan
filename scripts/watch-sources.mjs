/**
 * Check each official source page still shows the prices we recorded.
 * All recorded prices present -> bump verifiedAt. Any missing -> report, never edit the price.
 * ponytail: number presence is weak evidence (a page may show "20" elsewhere); a missing number is the reliable signal.
 */
import { fetchText, pageNumbers, showsUsdPrices, readData, writeData, report, today } from "./sync-lib.mjs";

const plans = readData("plans.json");
const api = readData("api-prices.json");
const recorded = (e) => (e.price ? [e.price.amount] : [e.input, e.output, e.cacheHit]).filter((n) => n > 0);
const entries = [...plans, ...api].filter((e) => recorded(e).length);
const urls = [...new Set(entries.map((e) => e.sourceUrl))];

const pages = new Map();
const queue = [...urls];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let url; (url = queue.pop());) {
    try { const html = await fetchText(url); pages.set(url, showsUsdPrices(html) ? pageNumbers(html) : null); } catch (err) { pages.set(url, err.message); }
  }
}));

let bumped = 0;
for (const e of entries) {
  const page = pages.get(e.sourceUrl);
  if (typeof page === "string") { report(`${e.id}: could not fetch ${e.sourceUrl} (${page})`); continue; }
  if (page === null) { console.log(`${e.id}: unwatchable (no readable USD prices on the page)`); continue; }
  const missing = recorded(e).filter((n) => !page.has(n));
  if (missing.length) report(`${e.id}: ${e.sourceUrl} no longer shows ${missing.join(", ")}`);
  else { e.verifiedAt = today(); bumped++; }
}
writeData("plans.json", plans);
writeData("api-prices.json", api);
console.log(`Reverified ${bumped}/${entries.length} entries across ${urls.length} pages`);
