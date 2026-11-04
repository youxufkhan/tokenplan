/** Re-read App Store in-app purchase prices for every quote that has a `match` label. */
import { fetchText, parseIap, pickPrice, readData, writeData, logChange, report, today } from "./sync-lib.mjs";

const markets = readData("markets.json");
let failures = 0;
for (const q of markets.quotes) {
  if (!q.match || q.channel !== "Apple App Store") continue;
  const key = `${q.market}:${q.planId}`;
  try {
    const next = pickPrice(parseIap(await fetchText(q.sourceUrl)), q.match, q.amount);
    if (next == null) { report(`App Store ${key}: no single "${q.match}" price near ${q.amount}; left unchanged`); failures++; continue; }
    if (next !== q.amount) {
      logChange({ id: key, channel: q.channel, from: q.amount, to: next, currency: q.currency, source: q.sourceUrl });
      console.log(`${key}: ${q.amount} -> ${next}`);
      q.amount = next;
    }
    q.verifiedAt = today();
  } catch (err) { report(`App Store ${key}: ${err.message}`); failures++; }
  await new Promise((r) => setTimeout(r, 1000));
}
writeData("markets.json", markets);
process.exitCode = failures ? 1 : 0;
