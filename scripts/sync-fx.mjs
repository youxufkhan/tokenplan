/** Refresh all FX rates together, retaining the source publication timestamp. */
import { fetchText, readData, writeData, report } from "./sync-lib.mjs";
import { fxCandidate } from "./fx-candidate.mjs";

try {
  const markets = readData("markets.json");
  const body = JSON.parse(await fetchText("https://open.er-api.com/v6/latest/USD"));
  const candidate = fxCandidate(body, markets.fx);
  writeData("markets.json", { ...markets, fx: candidate });
  console.log(`FX published ${candidate.publishedAt}; fetched ${candidate.fetchedAt}`);
} catch (error) {
  report(`FX update rejected; previous snapshot retained: ${error.message}`);
  process.exitCode = 1;
}
