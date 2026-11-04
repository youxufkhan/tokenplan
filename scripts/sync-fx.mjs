/** Refresh USD exchange rates for the local markets. Keeps the old value when a rate fails its guard. */
import { fetchText, readData, writeData, report, today, validRate } from "./sync-lib.mjs";

const SOURCE = "https://open.er-api.com/v6/latest/USD";
const markets = readData("markets.json");
const body = JSON.parse(await fetchText(SOURCE));
if (body.result !== "success") throw new Error(`FX API result: ${body.result}`);

let failed = false;
for (const code of Object.keys(markets.fx.rates)) {
  const next = body.rates?.[code];
  if (!validRate(next, markets.fx.rates[code])) {
    report(`FX ${code}: rejected ${next} (previous ${markets.fx.rates[code]}, allowed ±5%)`);
    failed = true;
  } else markets.fx.rates[code] = Math.round(next * 10_000) / 10_000;
}
if (!failed) markets.fx.date = today();
markets.fx.sourceUrl = SOURCE;
writeData("markets.json", markets);
console.log(`FX updated: ${JSON.stringify(markets.fx.rates)}`);
process.exitCode = failed ? 1 : 0;
