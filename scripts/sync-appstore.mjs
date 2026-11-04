import { fetchText, parseIap, readData, writeData, logChange, report, today } from "./sync-lib.mjs";
import { guardPrice, matchStorePrice } from "./price-extractors.mjs";
const markets = readData("markets.json");
const checks = readData("source-checks.json");
for (const quote of markets.quotes) {
  if (!quote.match || quote.channel !== "Apple App Store") continue;
  const key = `markets:${quote.market}:${quote.planId}`;
  let observation;
  try {
    const match = matchStorePrice(parseIap(await fetchText(quote.sourceUrl)), quote);
    if (!match) observation = { status: "ambiguous", evidence: "Product, currency and monthly period could not be matched uniquely" };
    else if (!guardPrice(match.amount, quote.amount)) observation = { status: "changed-price", evidence: "Observed price exceeds automatic-update guard", candidate: match.amount };
    else {
      observation = { status: match.amount === quote.amount ? "exact-match" : "changed-price", evidence: `${match.label}; ${quote.currency}; month`, candidate: match.amount };
      if (match.amount !== quote.amount) logChange({ id: key, channel: quote.channel, from: quote.amount, to: match.amount, currency: quote.currency, period: "month", source: quote.sourceUrl, evidenceRef: key });
      quote.amount = match.amount;
      quote.priceVerifiedAt = today();
    }
  } catch (error) { observation = { status: "fetch-failed", evidence: error.message }; }
  checks[key] = { checkedAt: new Date().toISOString(), sourceUrl: quote.sourceUrl, extractorVersion: "appstore-v2", ...observation };
  if (observation.status === "ambiguous" || observation.status === "fetch-failed"
    || (observation.status === "changed-price" && observation.candidate !== quote.amount)) report(`${key}: ${observation.evidence}`);
}
writeData("source-checks.json", checks);
writeData("markets.json", markets);
