/** Build one coherent FX snapshot or reject the entire response. */
export function fxCandidate(body, previous, fetchedAt = new Date().toISOString()) {
  if (body.result !== "success" || body.base_code !== "USD") throw new Error("Unexpected FX response or base currency");
  const published = Number(body.time_last_update_unix) * 1000;
  const fetched = Date.parse(fetchedAt);
  if (!Number.isFinite(published) || published <= 0 || published > fetched + 300_000) throw new Error("Invalid FX publication timestamp");
  const date = new Date(published).toISOString().slice(0, 10);
  if (date < previous.date || fetched - published > 7 * 86400000) throw new Error("FX response is stale");
  const rates = {};
  for (const code of Object.keys(previous.rates)) {
    const next = body.rates?.[code];
    const old = previous.rates[code];
    if (!Number.isFinite(next) || next <= 0 || (old > 0 && Math.abs(next - old) / old > 0.05)) throw new Error(`FX ${code}: invalid rate or change exceeds 5%`);
    rates[code] = Math.round(next * 10_000) / 10_000;
  }
  return { rates, date, publishedAt: new Date(published).toISOString(), fetchedAt, sourceUrl: "https://open.er-api.com/v6/latest/USD" };
}
